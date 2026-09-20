from easel.research import _public_http_url, layout_ocr_items, ocr_local_images


def test_ocr_empty_paths_do_not_crash():
    assert ocr_local_images([]) == ''


def test_ocr_layout_keeps_same_row_and_section_titles():
    items = [
        [[[60, 10], [200, 10], [200, 40], [60, 40]], '个人简历', 0.99],
        [[[80, 190], [140, 190], [140, 220], [80, 220]], '姓名', 0.99],
        [[[450, 190], [640, 190], [640, 220], [450, 220]], '学历：硕士', 0.99],
        [[[60, 400], [180, 400], [180, 430], [60, 430]], '教育背景', 0.99],
        [[[80, 450], [300, 450], [300, 480], [80, 480]], '医学检验技术', 0.99],
    ]
    text = layout_ocr_items(items)
    assert '## 个人简历' in text
    assert '## 教育背景' in text
    assert '姓名    学历：硕士' in text
    assert text.index('个人简历') < text.index('教育背景')


def test_blocks_localhost_and_private_image_urls():
    assert _public_http_url('https://ci.xiaohongshu.com/a.jpg') is True
    assert _public_http_url('http://127.0.0.1/secret.jpg') is False
    assert _public_http_url('http://localhost/x.png') is False
    assert _public_http_url('file:///c:/x.png') is False
    assert _public_http_url('https://user:pass@example.com/a.jpg') is False
    assert _public_http_url('https://169.254.169.254/latest/meta-data/') is False
