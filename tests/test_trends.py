import asyncio
import time

from web import app as trends


def test_hot_string_list_and_existing_objects():
    assert trends._parse_hot({'data': [' B站热点 ', '', None, {'title': '其他热点', 'hot': 123, 'url': 'https://example.com'}]}) == [
        {'title': 'B站热点', 'hot': '', 'url': ''},
        {'title': '其他热点', 'hot': '123', 'url': 'https://example.com'},
    ]


def test_bilibili_backup_after_primary_failure(monkeypatch):
    calls = []
    def fetch(url):
        calls.append(url)
        if url == trends.TREND_SOURCES['bilibili'][0]:
            raise OSError('upstream HTTP 500')
        return {'code': 200, 'data': ['B站热点']}
    monkeypatch.setattr(trends, '_http_get_json', fetch)
    items = trends._fetch_platform('bilibili')
    assert len(calls) == 2
    assert items == [{'title': 'B站热点', 'hot': '', 'url': 'https://search.bilibili.com/all?keyword=B%E7%AB%99%E7%83%AD%E7%82%B9'}]


def test_toutiao_official_backup_and_fields(monkeypatch):
    calls = []
    primary, backup = trends.TREND_SOURCES['toutiao']

    def fetch(url):
        calls.append(url)
        if url == primary:
            raise OSError('upstream unavailable')
        return {'data': [{'Title': '头条热点', 'HotValue': 321, 'Url': 'https://www.toutiao.com/trending/1'}]}

    monkeypatch.setattr(trends, '_http_get_json', fetch)
    assert trends._fetch_platform('toutiao') == [
        {'title': '头条热点', 'hot': '321', 'url': 'https://www.toutiao.com/trending/1'},
    ]
    assert calls == [primary, backup]


def test_api_trends_marks_stale_cache_and_source_error(monkeypatch):
    stale_at = time.time() - 600
    cached = [{'title': '旧热点', 'hot': '', 'url': ''}]
    monkeypatch.setattr(trends, '_TREND_CACHE', {'toutiao': (stale_at, cached)})
    monkeypatch.setattr(trends, '_fetch_platform', lambda _pf: [])

    result = asyncio.run(trends.api_trends('toutiao', 15))
    group = result['trends'][0]
    assert group['items'] == cached
    assert group['stale'] is True
    assert group['updated'] == int(stale_at)
    assert group['error'] == '实时热点暂时不可用，当前展示缓存数据'
    assert result['updated'] == int(stale_at)


def test_api_trends_exposes_empty_source_failure(monkeypatch):
    monkeypatch.setattr(trends, '_TREND_CACHE', {})
    monkeypatch.setattr(trends, '_fetch_platform', lambda _pf: [])

    result = asyncio.run(trends.api_trends('toutiao', 15))
    group = result['trends'][0]
    assert group['items'] == []
    assert group['stale'] is False
    assert group['updated'] == 0
    assert group['error'] == '实时热点暂时不可用'
    assert result['updated'] == 0


def test_api_trends_deduplicates_platform_requests(monkeypatch):
    calls = []
    monkeypatch.setattr(trends, '_TREND_CACHE', {})

    def fetch(pf):
        calls.append(pf)
        return [{'title': pf, 'hot': '', 'url': ''}]

    monkeypatch.setattr(trends, '_fetch_platform', fetch)
    result = asyncio.run(trends.api_trends('toutiao,toutiao', 15))
    assert calls == ['toutiao']
    assert len(result['trends']) == 1
