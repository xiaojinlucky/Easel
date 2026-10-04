"""看数据时小红书要和发布共用同一把目录锁。不打开浏览器。"""
import importlib.util
import sys
import tempfile
import types
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / 'skills' / 'shared' / 'scripts'


def load(name):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / f'{name}.py')
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


class _Playwright:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class StatsLockTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        sys.path.insert(0, str(SCRIPTS))
        fake = types.ModuleType('playwright.sync_api')
        fake.sync_playwright = lambda: _Playwright()
        sys.modules['playwright.sync_api'] = fake
        sys.modules.setdefault('playwright', types.ModuleType('playwright'))
        cls.xhs = load('xhs_publish')
        cls.stats = load('account_stats')

    def test_second_holder_times_out_then_release_allows_next(self):
        with tempfile.TemporaryDirectory() as d:
            prof = Path(d) / 'XiaohongshuProfile'
            holder = self.xhs._ProfileLock(prof)
            holder.acquire(1)
            other = self.xhs._ProfileLock(prof)
            with self.assertRaises(TimeoutError):
                other.acquire(0.5)
            holder.release()
            other.acquire(1)
            other.release()

    def test_scrape_releases_lock_when_browser_fails_to_start(self):
        def boom(*_a, **_k):
            raise RuntimeError('cloak failed')

        self.xhs._launch = boom
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(RuntimeError):
                self.stats._scrape('xiaohongshu', False, d, None)
            prof = Path(d) / 'XiaohongshuProfile'
            again = self.xhs._ProfileLock(prof)
            again.acquire(1)
            again.release()

    def test_close_failure_still_releases_lock(self):
        class Page:
            def goto(self, *_a, **_k):
                raise RuntimeError('page gone')

        class Ctx:
            pages = [Page()]

            def close(self):
                raise RuntimeError('close failed')

        self.xhs._launch = lambda *_a, **_k: Ctx()
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(RuntimeError):
                self.stats._scrape('xiaohongshu', False, d, None)
            again = self.xhs._ProfileLock(Path(d) / 'XiaohongshuProfile')
            again.acquire(1)
            again.release()

    def test_douyin_does_not_take_xiaohongshu_lock(self):
        taken = []
        real = self.xhs._ProfileLock.acquire

        def spy(this, timeout):
            taken.append(this.path)
            return real(this, timeout)

        self.xhs._ProfileLock.acquire = spy

        class Ctx:
            pages = []

            def new_page(self):
                raise RuntimeError('stop')

            def close(self):
                return None

        self.stats_chromium = Ctx

        class PW(_Playwright):
            class chromium:
                @staticmethod
                def launch_persistent_context(*_a, **_k):
                    return Ctx()

        sys.modules['playwright.sync_api'].sync_playwright = lambda: PW()
        try:
            with tempfile.TemporaryDirectory() as d:
                with self.assertRaises(RuntimeError):
                    self.stats._scrape('douyin', False, d, None)
        finally:
            self.xhs._ProfileLock.acquire = real
            sys.modules['playwright.sync_api'].sync_playwright = lambda: _Playwright()
        self.assertEqual(taken, [])
