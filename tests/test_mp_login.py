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

    def test_weixin_resolve_content_image_maps_api_media(self):
        script = ROOT / 'skills/shared/scripts/weixin_mp_stats.py'
        spec = importlib.util.spec_from_file_location('mp_stats_image', script)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as d:
            tmp_path = Path(d)
            module.PROJECT_ROOT = tmp_path
            image = tmp_path / 'outputs' / 'gallery' / 'a.png'
            image.parent.mkdir(parents=True)
            image.write_bytes(b'png')
            html = tmp_path / 'outputs' / 'articles' / 'a.html'
            html.parent.mkdir(parents=True)
            html.write_text('<p></p>', encoding='utf-8')
            self.assertEqual(module.resolve_content_image('/api/media/gallery/a.png', html), image.resolve())
            self.assertEqual(
                module.resolve_content_image('https://127.0.0.1:7870/api/media/gallery/a.png', html),
                image.resolve(),
            )
            self.assertEqual(
                module.resolve_content_image('https://127.0.0.1:7860/api/media/gallery/a.png', html),
                image.resolve(),
            )
            secret = tmp_path / 'outputs' / '_login' / 'secret.png'
            secret.parent.mkdir(parents=True)
            secret.write_bytes(b'secret')
            outside = tmp_path / 'outside.png'
            outside.write_bytes(b'out')
            self.assertIsNone(module.resolve_content_image('', html))
            self.assertIsNone(module.resolve_content_image('https://cdn.example/x.png', html))
            self.assertIsNone(module.resolve_content_image('https://cdn.example/api/media/gallery/a.png', html))
            self.assertIsNone(module.resolve_content_image('/api/media/_login/secret.png', html))
            self.assertIsNone(module.resolve_content_image('/api/media/../secret.png', html))
            self.assertIsNone(module.resolve_content_image('../_login/secret.png', html))
            self.assertIsNone(module.resolve_content_image(r'..\_login\secret.png', html))
            self.assertIsNone(module.resolve_content_image(str(outside), html))
            self.assertEqual(
                module.resolve_content_image('http://127.0.0.1:7870/api/media/gallery/a.png?x=1', html),
                image.resolve(),
            )
            amped = tmp_path / 'outputs' / 'articles' / 'a&b.png'
            amped.write_bytes(b'amp')
            hashed = tmp_path / 'outputs' / 'articles' / '图#1.png'
            hashed.write_bytes(b'hash')
            self.assertEqual(module.resolve_content_image(str(amped).replace('&', '&amp;'), html), amped.resolve())
            self.assertEqual(module.resolve_content_image('图#1.png', html), hashed.resolve())
            self.assertEqual(module.resolve_content_image('/api/media/articles/a&amp;b.png', html), amped.resolve())
            side = tmp_path / 'side'
            side.mkdir()
            fig = side / 'fig.png'
            fig.write_bytes(b'fig')
            side_html = side / 'note.html'
            side_html.write_text('<p></p>', encoding='utf-8')
            self.assertEqual(module.resolve_content_image('fig.png', side_html), fig.resolve())
            self.assertIsNone(module.resolve_content_image('../outside.png', side_html))
            self.assertFalse(module.image_src_must_upload('https://cdn.example/x.png'))
            self.assertTrue(module.image_src_must_upload('fig.png'))
            self.assertTrue(module.image_src_must_upload('/api/media/gallery/a.png'))

    def test_weixin_profile_lock_rejects_second_holder(self):
        script = ROOT / 'skills/shared/scripts/weixin_mp_stats.py'
        spec = importlib.util.spec_from_file_location('mp_stats_lock', script)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as d:
            prof = Path(d) / 'WeixinMpProfile'
            holder = module._lock_profile(prof)
            try:
                with self.assertRaises(RuntimeError):
                    module._lock_profile(prof)
            finally:
                module._unlock_profile(holder)
            again = module._lock_profile(prof)
            module._unlock_profile(again)

if __name__ == '__main__':
    unittest.main()
