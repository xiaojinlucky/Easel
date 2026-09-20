from easel.research import _public_http_url


def test_blocks_localhost_and_private_image_urls():
    assert _public_http_url('https://ci.xiaohongshu.com/a.jpg') is True
    assert _public_http_url('http://127.0.0.1/secret.jpg') is False
    assert _public_http_url('http://localhost/x.png') is False
    assert _public_http_url('file:///c:/x.png') is False
    assert _public_http_url('https://user:pass@example.com/a.jpg') is False
    assert _public_http_url('https://169.254.169.254/latest/meta-data/') is False
