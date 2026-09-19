"""公众号重复登录及异常状态回归测试，不启动真实浏览器。"""
import ast
import asyncio
import importlib.util
import threading
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[1]

def load_web_functions():
    tree = ast.parse((ROOT / 'web/app.py').read_text(encoding='utf-8'))
    # 除了两个入口，还要带上本 fork 的登录认领锁辅助函数：
    # api_mp_login_start 用 _login_proc_alive / _try_begin_login / _release_login_claim
    # 复用正在进行的登录，缺一个就会 NameError。
    names = {'api_mp_login_start', '_stop_mp_login_on_shutdown',
             '_login_proc_alive', '_try_begin_login', '_release_login_claim'}
    nodes = [n for n in tree.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and n.name in names]
    for node in nodes:
        node.decorator_list = []
    env = {'subprocess': subprocess,
           '_LOGIN_PENDING': set(),
           '_LOGIN_PENDING_LOCK': threading.Lock()}
    exec(compile(ast.Module(body=nodes, type_ignores=[]), 'web/app.py', 'exec'), env)
    return env

class MpLoginTests(unittest.TestCase):
    def test_repeated_start_preserves_existing_session(self):
        env = load_web_functions()
        proc = Mock()
        proc.poll.return_value = None
        status = {'state': 'qr_ready', 'qr': '_login/wechat-oa-mp.png'}
        env.update(LOGIN_RUNNERS={'wechat-oa': {'backend': 'wechat-oa'}},
                   LOGIN_PROCESSES={'wechat-oa-mp': proc}, _mp_login_status=lambda: status)
        # 文件目录与启动依赖未提供；复用会话不应碰触它们。
        for _ in range(2):
            self.assertEqual(asyncio.run(env['api_mp_login_start']('wechat-oa')), {'mode': 'qr', **status})

    def test_concurrent_start_claims_once(self):
        """本 fork 额外保证：认领槽已占、进程还没登记时，第二次点击也不许起第二个浏览器。"""
        env = load_web_functions()
        fake = Mock()
        fake.Popen.side_effect = AssertionError('认领锁失效：起了第二个浏览器')
        status = {'state': 'starting'}
        env.update(subprocess=fake,
                   LOGIN_RUNNERS={'wechat-oa': {'backend': 'wechat-oa'}},
                   LOGIN_PROCESSES={}, _mp_login_status=lambda: status)
        self.assertTrue(env['_try_begin_login']('wechat-oa'))  # 模拟第一次请求卡在 Popen 之前
        try:
            self.assertEqual(asyncio.run(env['api_mp_login_start']('wechat-oa')), {'mode': 'qr', **status})
        finally:
            env['_release_login_claim']('wechat-oa')
        fake.Popen.assert_not_called()

    def test_shutdown_reaps_login_process(self):
        env = load_web_functions()
        proc = Mock()
        proc.poll.return_value = None
        marker = Mock()
        env.update(LOGIN_PROCESSES={'wechat-oa-mp': proc}, _write_login_marker=marker)
        env['_stop_mp_login_on_shutdown']()
        proc.terminate.assert_called_once()
        proc.wait.assert_called_once_with(timeout=5)
        self.assertEqual(env['LOGIN_PROCESSES'], {})
        self.assertEqual(marker.call_args.args[1], 'expired')

    def test_browser_failure_writes_error_state(self):
        script = ROOT / 'skills/shared/scripts/weixin_mp_stats.py'
        spec = importlib.util.spec_from_file_location('mp_login_under_test', script)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as d:
            args = Mock(status_file=str(Path(d) / 'status.json'))
            with patch.object(module, '_run_login', side_effect=RuntimeError('browser launch failed')):
                self.assertEqual(module.cmd_login(args), 1)
            self.assertEqual(module.login_state.read_status(args.status_file)['state'], 'error')

if __name__ == '__main__':
    unittest.main()
