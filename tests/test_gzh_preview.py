"""公众号预览外壳：安全限制还在，本地图会嵌进页面。不打开浏览器。"""
import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / 'skills/openclaw/gzh-design/assets/preview-template.html'
SCRIPT = ROOT / 'skills/openclaw/gzh-design/scripts/wrap_preview.py'


def load_wrap():
    spec = importlib.util.spec_from_file_location('wrap_preview_under_test', SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class GzhPreviewTests(unittest.TestCase):
    def test_template_blocks_preview_script_from_calling_back(self):
        text = TEMPLATE.read_text(encoding='utf-8')
        self.assertIn("connect-src 'none'", text)
        self.assertIn("default-src 'none'", text)
        self.assertIn('img-src data: https: http:', text)

    def test_inline_local_image_and_leave_remote_alone(self):
        module = load_wrap()
        with tempfile.TemporaryDirectory() as d:
            base = Path(d)
            article = base / 'article'
            article.mkdir()
            (article / 'cover.png').write_bytes(b'\x89PNG\r\n')
            secret_dir = base / '_login'
            secret_dir.mkdir()
            secret = secret_dir / 'secret.png'
            secret.write_bytes(b'secret')
            outputs = base / 'outputs'
            (outputs / 'gallery').mkdir(parents=True)
            library = outputs / 'gallery' / 'a.png'
            library.write_bytes(b'\x89PNG\r\n')
            html = (
                '<img src="cover.png">'
                '<img src="https://cdn.example/a.png">'
                '<img src="missing.png">'
                '<img src="../_login/secret.png">'
                '<img src="/api/media/gallery/a.png">'
                '<img src="http://127.0.0.1:7870/api/media/gallery/a.png?x=1">'
                '<img src="https://cdn.example/api/media/gallery/a.png">'
            )
            out = module._inline_images(html, str(base / 'article'), str(outputs))
            self.assertIn('data:image/png;base64,', out)
            self.assertNotIn('src="cover.png"', out)
            self.assertIn('src="https://cdn.example/a.png"', out)
            self.assertIn('src="missing.png"', out)
            self.assertIn('src="../_login/secret.png"', out)
            self.assertNotIn('c2VjcmV0', out)
            self.assertNotIn('src="/api/media/gallery/a.png"', out)
            self.assertNotIn('127.0.0.1:7870/api/media', out)
            self.assertIn('src="https://cdn.example/api/media/gallery/a.png"', out)
            self.assertEqual(module._inline_images('', str(base)), '')
            (article / 'a.webp').write_bytes(b'RIFFwebp')
            (article / '图#1.png').write_bytes(b'hash-name')
            typed = module._inline_images('<img src="a.webp"><img src="图#1.png">', str(article), str(outputs))
            self.assertIn('data:image/webp;base64,', typed)
            self.assertNotIn('src="a.webp"', typed)
            self.assertNotIn('src="图#1.png"', typed)
