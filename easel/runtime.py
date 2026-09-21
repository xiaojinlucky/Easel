"""Project-owned OpenClaw and official Codex subscription integration."""
from __future__ import annotations

import json
import os
import queue
import shutil
import subprocess
import threading
import time
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROFILE = 'easel-studio'
CONFIG_FILE = Path.home() / f'.openclaw-{PROFILE}/openclaw.json'
STATE = ROOT / '.runtime'
SETTINGS_FILE = STATE / 'model-settings.json'
# 常驻 gateway 写「模型原始流」的单个共享文件，web 侧 tail 它做逐字流式 + 思考面板。
# POSIX 沿用上游 scripts/gateway.sh 的 /tmp 默认；本机 Windows 统一落 .runtime，
# 由 easel.services 给 gateway 与 web 注入同一个 OPENCLAW_RAW_STREAM_PATH /
# EASEL_RAW_STREAM_PATH，避免 /tmp 在本机不可靠导致流式静默失效。
SHARED_RAW_STREAM = STATE / 'easel-raw-stream.jsonl'
CREATE_FLAGS = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
_rpc_lock = threading.Lock()
_json_write_lock = threading.Lock()
_catalog_cache: tuple[float, list] = (0, [])


def openclaw_command() -> list[str]:
    entry = STATE / 'node_modules/openclaw/openclaw.mjs'
    node = STATE / 'node_modules/node/bin' / ('node.exe' if os.name == 'nt' else 'node')
    if entry.is_file() and node.is_file():
        return [str(node), str(entry)]
    executable = shutil.which('openclaw')
    if executable and os.name != 'nt':
        return [executable]
    raise RuntimeError('未找到 Easel 的独立 OpenClaw，请运行安装脚本。')


def codex_command() -> list[str]:
    if os.name == 'nt':
        entry = Path(os.environ.get('APPDATA', '')) / 'npm/node_modules/@openai/codex/bin/codex.js'
        if entry.is_file():
            return [openclaw_command()[0], str(entry)]
        candidate = Path(os.environ.get('LOCALAPPDATA', '')) / 'OpenAI/Codex/bin/codex.exe'
        if candidate.is_file():
            return [str(candidate)]
    executable = shutil.which('codex')
    if executable:
        return [executable]
    raise RuntimeError('未找到官方 Codex CLI。')


def runtime_env() -> dict[str, str]:
    env = os.environ.copy()
    env['PATH'] = os.pathsep.join([str(ROOT / '.venv' / ('Scripts' if os.name == 'nt' else 'bin')), str(STATE / 'node_modules/node/bin'), str(STATE / 'node_modules/bun/bin'), str(STATE / 'node_modules/.bin'), env.get('PATH', '')])
    env['PYTHONUTF8'] = '1'
    env['EASEL_ROOT'] = str(ROOT)
    env['NO_COLOR'] = '1'
    env['POSTIZ_API_URL'] = 'http://localhost:4007/api'
    env['NO_PROXY'] = ','.join(filter(None, [env.get('NO_PROXY', ''), 'localhost', '127.0.0.1', '::1']))
    env['no_proxy'] = env['NO_PROXY']
    # Subscription requests must not silently switch to separately billed API keys.
    for key in ('OPENAI_API_KEY', 'CODEX_API_KEY', 'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN'):
        env.pop(key, None)
    return env


def read_settings() -> dict:
    if SETTINGS_FILE.is_file():
        return json.loads(SETTINGS_FILE.read_text(encoding='utf-8'))
    return {'active_id': 'full', 'profiles': [{'id': 'full', 'name': '完整创作', 'model': 'gpt-6-astra', 'reasoning_effort': 'high'}]}


def active_profile() -> dict:
    settings = read_settings()
    return next(p for p in settings['profiles'] if p['id'] == settings['active_id'])


def native_image_ready() -> bool:
    evidence_file = STATE / 'acceptance.json'
    if not evidence_file.is_file():
        return False
    evidence = json.loads(evidence_file.read_text(encoding='utf-8')).get('原生图片工具', {})
    return evidence.get('passed') is True and evidence.get('model') == active_profile()['model']


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=path.parent, prefix=path.name + '.', suffix='.tmp', delete=False) as output:
        temp = Path(output.name)
        json.dump(data, output, ensure_ascii=False, indent=2)
        output.write('\n')
    try:
        with _json_write_lock:
            temp.replace(path)
    finally:
        temp.unlink(missing_ok=True)


def codex_rpc(methods: list[tuple[str, dict]], timeout: float = 20) -> list[dict]:
    """Read account/catalog through official local RPC, never inspect auth.json."""
    with _rpc_lock:
        process = subprocess.Popen(codex_command() + ['app-server', '--listen', 'stdio://'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8', env=runtime_env(), creationflags=CREATE_FLAGS, cwd=str(STATE))
        inbox: queue.Queue = queue.Queue()
        def reader():
            for line in process.stdout:
                try:
                    inbox.put(json.loads(line))
                except json.JSONDecodeError:
                    continue
            inbox.put(None)
        threading.Thread(target=reader, daemon=True).start()
        deadline = time.monotonic() + timeout
        def send(payload):
            process.stdin.write(json.dumps(payload) + '\n')
            process.stdin.flush()
        def response(identifier):
            while True:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise TimeoutError('Codex 状态读取超时。')
                try:
                    value = inbox.get(timeout=remaining)
                except queue.Empty as exc:
                    raise TimeoutError('Codex 状态读取超时。') from exc
                if value is None:
                    detail = process.stderr.read()[-1500:]
                    raise RuntimeError('Codex 状态连接提前关闭：' + detail)
                if value.get('id') == identifier:
                    if 'error' in value:
                        raise RuntimeError(value['error'].get('message', 'Codex RPC 失败'))
                    return value['result']
        try:
            send({'id': 1, 'method': 'initialize', 'params': {'clientInfo': {'name': 'easel_status', 'version': '1.0.0'}, 'capabilities': {}}})
            response(1)
            send({'method': 'initialized', 'params': {}})
            results = []
            for identifier, (method, params) in enumerate(methods, 2):
                send({'id': identifier, 'method': method, 'params': params})
                results.append(response(identifier))
            return results
        finally:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)


def model_catalog(refresh: bool = False) -> list[dict]:
    global _catalog_cache
    if not refresh and time.monotonic() - _catalog_cache[0] < 300:
        return _catalog_cache[1]
    result = codex_rpc([('model/list', {'includeHidden': False, 'limit': 100})])[0]
    models = result.get('data', [])
    if not models:
        raise RuntimeError('当前 Codex 账号未返回可用模型。')
    _catalog_cache = (time.monotonic(), models)
    return models


def subscription_status() -> dict:
    account, usage = codex_rpc([('account/read', {'refreshToken': False}), ('account/rateLimits/read', {})])
    account = account.get('account') or {}
    limits = (usage.get('rateLimitsByLimitId') or {}).get('codex') or usage.get('rateLimits') or {}
    weekly = next((limits.get(k) for k in ('primary', 'secondary') if (limits.get(k) or {}).get('windowDurationMins') == 10080), None)
    used = weekly.get('usedPercent') if weekly else None
    remaining = min(100, max(0, 100 - used)) if isinstance(used, (int, float)) else None
    return {'logged_in': account.get('type') == 'chatgpt', 'plan': account.get('planType'), 'weekly_remaining': remaining, 'resets_at': weekly.get('resetsAt') if weekly else None, 'stop_reason': None, 'checked_at': time.time()}


def require_subscription() -> dict:
    account = (codex_rpc([('account/read', {'refreshToken': False})])[0].get('account') or {})
    if account.get('type') != 'chatgpt':
        raise RuntimeError('请先通过官方 Codex 登录 ChatGPT。')
    return {'logged_in': True, 'plan': account.get('planType')}


def agent_options() -> list[str]:
    profile = active_profile()
    return ['--model', 'openai/' + profile['model'], '--thinking', profile['reasoning_effort']]


def agent_reply(stdout: str) -> str:
    """Read the official final JSON envelope; transport success alone is insufficient."""
    try:
        response = json.loads(stdout)
        if response.get('status') not in (None, 'ok'):
            raise RuntimeError('Agent 未完成：' + str(response.get('summary') or response.get('status')))
        result = response.get('result') or response
        if result.get('meta', {}).get('aborted'):
            raise RuntimeError('Agent 已中止。')
        payloads = result['payloads']
        reply = '\n\n'.join(p.get('text', '') for p in payloads if p.get('text')).strip()
        if not reply:
            raise RuntimeError('Agent 未返回完成内容，请查看运行日志。')
        return reply
    except (ValueError, KeyError, AttributeError, TypeError) as exc:
        raise RuntimeError('Agent 返回格式异常，请查看运行日志。') from exc


def abort_session(session_key: str) -> None:
    result = subprocess.run(openclaw_command() + ['--profile', PROFILE, 'gateway', 'call', 'chat.abort', '--params', json.dumps({'sessionKey': session_key}), '--json'], cwd=ROOT, env=runtime_env(), capture_output=True, text=True, encoding='utf-8', timeout=15, creationflags=CREATE_FLAGS)
    if result.returncode:
        raise RuntimeError('运行时未确认中断：' + (result.stderr or result.stdout)[-700:])


def run_agent_command(command: list[str], timeout: float, on_start=None, isolated: bool = False) -> subprocess.CompletedProcess:
    require_subscription()
    process = subprocess.Popen(command, cwd=ROOT, env=runtime_env(), stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8', creationflags=CREATE_FLAGS)
    if on_start is not None:
        on_start(process)
    deadline = time.monotonic() + timeout
    try:
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise subprocess.TimeoutExpired(command, timeout)
            try:
                stdout, stderr = process.communicate(timeout=min(30, remaining))
                return subprocess.CompletedProcess(command, process.returncode, stdout, stderr)
            except subprocess.TimeoutExpired:
                continue
    except BaseException:
        from easel.services import stop, stop_tree
        import psutil
        if isolated and '--session-key' in command:
            try:
                abort_session(command[command.index('--session-key') + 1])
            except Exception:
                pass  # Never stop the shared Gateway for an isolated job.
        if not isolated:
            try:
                if '--session-key' in command:
                    abort_session(command[command.index('--session-key') + 1])
                else:
                    stop('gateway')
            except Exception:
                stop('gateway')
        try:
            stop_tree(psutil.Process(process.pid))
        except psutil.NoSuchProcess:
            pass
        process.communicate(timeout=5)
        raise
