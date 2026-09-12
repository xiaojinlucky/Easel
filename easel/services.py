"""Manage only processes owned by this local Easel installation."""
import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit

import psutil
from easel.runtime import ROOT, STATE, PROFILE, CREATE_FLAGS, openclaw_command, runtime_env

CLOAK_PORT = 9344
CLOAK_PROFILE = STATE / 'cloak-research-profile'
LOG_MAX_BYTES = 5 * 1024 * 1024
LOG_BACKUP_COUNT = 3


def open_log(name: str):
    """打开（并轮转）服务日志。超过 5MB 自动切为 .1/.2/.3，避免无限增长。"""
    logs = STATE / 'logs'
    logs.mkdir(parents=True, exist_ok=True)
    log_path = logs / f'{name}.log'
    if log_path.exists() and log_path.stat().st_size >= LOG_MAX_BYTES:
        for i in range(LOG_BACKUP_COUNT - 1, 0, -1):
            old = logs / f'{name}.log.{i}'
            if old.exists():
                (logs / f'{name}.log.{i + 1}').unlink(missing_ok=True)
                old.rename(logs / f'{name}.log.{i + 1}')
        if (logs / f'{name}.log.1').exists():
            (logs / f'{name}.log.1').unlink(missing_ok=True)
        log_path.rename(logs / f'{name}.log.1')
    return (logs / f'{name}.log').open('a', encoding='utf-8')



def research_cdp_endpoint() -> str | None:
    """Explicit attach-only override; unset restores the owned research browser."""
    if 'EASEL_RESEARCH_CDP_URL' in os.environ:
        raw = os.environ['EASEL_RESEARCH_CDP_URL'].strip()
    else:
        config_path = STATE / 'research-browser.json'
        if not config_path.exists():
            return None
        try:
            config = json.loads(config_path.read_text(encoding='utf-8'))
        except (OSError, ValueError) as exc:
            raise RuntimeError('research-browser.json 无法读取或 JSON 格式无效。') from exc
        if not isinstance(config, dict) or not isinstance(config.get('cdp_url'), str):
            raise RuntimeError('research-browser.json 必须包含字符串 cdp_url。')
        raw = config['cdp_url'].strip()
    if not raw:
        return None
    try:
        parsed = urlsplit(raw)
        valid = parsed.scheme == 'http' and parsed.hostname in ('127.0.0.1', 'localhost', '::1') and parsed.port and not parsed.username and not parsed.password and parsed.path in ('', '/') and not parsed.query and not parsed.fragment
    except ValueError:
        valid = False
    if not valid:
        raise RuntimeError('EASEL_RESEARCH_CDP_URL 必须是本机 loopback HTTP 调试端口地址。')
    return raw.rstrip('/')


def verify_research_cdp(endpoint: str) -> None:
    try:
        with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(endpoint + '/json/version', timeout=2) as response:
            metadata = json.load(response)
            if response.status != 200 or not metadata.get('webSocketDebuggerUrl'):
                raise ValueError('missing debugger endpoint')
    except (OSError, ValueError, TypeError):
        raise RuntimeError('指定的已有浏览器 CDP 未就绪；未启动其他浏览器或迁移登录数据。请启用该浏览器调试端口，或清除 EASEL_RESEARCH_CDP_URL 恢复独立研究浏览器。') from None

def cloak_executable() -> Path:
    choices = sorted((Path.home() / '.cloakbrowser').glob('chromium-*/chrome.exe'), key=lambda p: p.stat().st_mtime, reverse=True)
    if not choices:
        raise RuntimeError('未找到已安装的 CloakBrowser。')
    return choices[0]


def command_for(name: str) -> list[str]:
    if name == 'gateway':
        return openclaw_command() + ['--profile', PROFILE, 'gateway', 'run', '--bind', 'loopback']
    if name == 'web':
        return [str(ROOT / '.venv/Scripts/python.exe'), '-m', 'uvicorn', 'web.app:app', '--host', '127.0.0.1', '--port', '7860']
    if name == 'cloak':
        return [str(cloak_executable()), '--headless=new', '--remote-debugging-address=127.0.0.1', f'--remote-debugging-port={CLOAK_PORT}', f'--user-data-dir={CLOAK_PROFILE}', '--no-first-run', '--disable-background-networking', '--disable-sync', '--disable-component-update', 'about:blank']
    if name == 'platform-proxy':
        return [str(STATE / 'caddy/caddy.exe'), 'run', '--config', str(STATE / 'Caddyfile'), '--adapter', 'caddyfile']
    if name == 'wsl-runtime':
        return [str(ROOT / '.venv/Scripts/python.exe'), '-m', 'easel.wsl_keeper']
    raise ValueError('Unknown service')


def owned_processes(name: str) -> list[psutil.Process]:
    result = []
    for p in psutil.process_iter(['pid', 'exe', 'cmdline']):
        try:
            args = p.info['cmdline'] or []
            joined = ' '.join(args).replace('\\', '/').lower()
            if name == 'web':
                matches = 'web.app:app' in args and str(ROOT / '.venv').replace('\\', '/').lower() in joined
            elif name == 'gateway':
                matches = PROFILE in args and 'gateway' in args and str(ROOT / '.runtime/node_modules/openclaw').replace('\\', '/').lower() in joined
            elif name == 'cloak':
                matches = '--type=' not in joined and str(CLOAK_PROFILE).replace('\\', '/').lower() in joined and '.cloakbrowser/' in joined
            elif name == 'platform-proxy':
                matches = str(STATE / 'caddy/caddy.exe').replace('\\', '/').lower() in joined and str(STATE / 'Caddyfile').replace('\\', '/').lower() in joined
            elif name == 'wsl-runtime':
                matches = 'easel.wsl_keeper' in args and str(ROOT / '.venv').replace('\\', '/').lower() in joined
            else:
                raise ValueError('Unknown service')
            if matches:
                result.append(p)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return result


def healthy(name: str) -> bool:
    if name == 'wsl-runtime':
        return bool(owned_processes(name))
    url = {'gateway': 'http://127.0.0.1:18789/healthz', 'web': 'http://127.0.0.1:7860/', 'cloak': f'http://127.0.0.1:{CLOAK_PORT}/json/version', 'platform-proxy': 'http://127.0.0.1:8089/'}[name]
    try:
        with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(url, timeout=2) as response:
            return response.status == 200
    except OSError:
        return False


def stop_tree(process: psutil.Process) -> None:
    try:
        children = process.children(recursive=True)
        for child in reversed(children):
            try:
                child.terminate()
            except psutil.NoSuchProcess:
                pass
        process.terminate()
        _, alive = psutil.wait_procs(children + [process], timeout=5)
        for p in alive:
            try:
                p.kill()
            except psutil.NoSuchProcess:
                pass
    except psutil.NoSuchProcess:
        pass


def stop(name: str) -> dict:
    if name == 'platforms':
        from easel.platform_services import manage
        return manage('stop')
    processes = owned_processes(name)
    for process in processes:
        stop_tree(process)
    return {'service': name, 'stopped': [p.pid for p in processes]}


def start(name: str) -> dict:
    if name == 'platforms':
        from easel.platform_services import manage
        return manage('start')
    if healthy(name):
        if not owned_processes(name):
            raise RuntimeError(f'{name} 的端口已被其他程序占用，未接管。')
        return {'service': name, 'status': 'running'}
    if owned_processes(name):
        raise RuntimeError(f'{name} 进程存在但未就绪，请查看日志或重启。')
    logs = STATE / 'logs'
    logs.mkdir(parents=True, exist_ok=True)
    env = runtime_env()
    if name == 'platform-proxy':
        # This proxy only reaches private WSL services; never route it through an Internet proxy.
        for key in list(env):
            if key.lower() in ('http_proxy', 'https_proxy', 'all_proxy'):
                env.pop(key)
    with open_log(name) as log:
        child = subprocess.Popen(command_for(name), cwd=ROOT, env=env, stdout=log, stderr=log, creationflags=CREATE_FLAGS)
    for _ in range(50):
        if healthy(name):
            return {'service': name, 'status': 'running', 'pid': child.pid}
        if child.poll() is not None:
            break
        time.sleep(0.5)
    raise RuntimeError(f'{name} 启动失败或超时，请查看 {logs / (name + ".log")}')


def main() -> None:
    action = sys.argv[1] if len(sys.argv) > 1 else 'status'
    names = sys.argv[2:] or ['gateway', 'web']
    for name in names:
        if action == 'restart':
            stop(name)
            result = start(name)
        elif action == 'start':
            result = start(name)
        elif action == 'stop':
            result = stop(name)
        elif action == 'status':
            if name == 'platforms':
                from easel.platform_services import manage
                result = manage('status')
            else:
                result = {'service': name, 'healthy': healthy(name), 'pids': [p.pid for p in owned_processes(name)]}
        else:
            raise ValueError('Use start, stop, restart or status')
        print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
