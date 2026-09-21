import json
import socket
from types import SimpleNamespace

import pytest
from pathlib import Path

from easel import research, research_browser

ROOT = Path(__file__).resolve().parents[1]


def test_research_page_offers_rewrite_actions():
    text = (ROOT / 'web' / 'frontend' / 'src' / 'components' / 'ResearchPage.tsx').read_text(encoding='utf-8')
    assert '仿写笔记' in text
    assert '改成可发文案' in text
    assert '刚保存' in text
    assert 'MAX_PICK = 12' in text
    assert 'UNTRUSTED_REFERENCE' in text
    assert "stage: 'produce'" in text


@pytest.fixture
def collector(monkeypatch, tmp_path):
    monkeypatch.setattr(research_browser, 'STATE', tmp_path)
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    monkeypatch.setattr(research, 'STATE', tmp_path)
    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    bun = tmp_path / 'node_modules' / 'bun' / 'bin' / 'bun.exe'
    bun.parent.mkdir(parents=True)
    bun.write_bytes(b'')
    monkeypatch.delenv('EASEL_RESEARCH_CDP_URL', raising=False)
    monkeypatch.setattr(research, 'start', lambda name: None)
    monkeypatch.setattr(research.socket, 'getaddrinfo', lambda *a, **k: [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('1.1.1.1', 443))])
    calls = []
    def run(command, **kwargs):
        assert kwargs['env']['EASEL_RESEARCH_SINGLE_PAGE'] == '1'
        calls.append(command)
        return SimpleNamespace(returncode=0, stderr='', stdout=json.dumps({'status': 'ok', 'markdown': 'captured text', 'document': {'title': 'title', 'url': command[2]}}))
    monkeypatch.setattr(research.subprocess, 'run', run)
    return calls


def test_capture_persists_random_platform_cooldown_and_reuses_cache(collector):
    first = research.capture('https://xhslink.cn/one')
    assert first['state'] == 'saved'
    assert '单页' in first['method']
    with research.connection() as db:
        at = db.execute('SELECT at FROM visits').fetchone()[0]
        next_at = db.execute('SELECT next_at FROM cooldowns').fetchone()[0]
    assert 60 <= next_at - at <= 120
    assert research.capture('https://xhslink.cn/one')['cached']
    with pytest.raises(research.CollectionError) as exc:
        research.capture('https://www.xiaohongshu.com/user/profile/two')
    assert exc.value.status == 429
    assert len(collector) == 1


def test_attach_endpoint_does_not_start_or_take_over_browser(collector, monkeypatch):
    monkeypatch.setenv('EASEL_RESEARCH_CDP_URL', 'http://127.0.0.1:9222')
    monkeypatch.setattr(research, 'start', lambda name: pytest.fail('must not launch'))
    seen = []
    monkeypatch.setattr(research, 'verify_research_cdp', lambda endpoint: seen.append(endpoint))
    assert research.capture('https://xhslink.cn/one')['state'] == 'saved'
    assert seen == ['http://127.0.0.1:9222']
    assert collector[0][collector[0].index('--cdp-url') + 1] == seen[0]


def test_attach_failure_is_visible_without_fallback(collector, monkeypatch):
    monkeypatch.setenv('EASEL_RESEARCH_CDP_URL', 'http://127.0.0.1:9222')
    monkeypatch.setattr(research, 'verify_research_cdp', lambda endpoint: (_ for _ in ()).throw(RuntimeError('CDP unavailable')))
    result = research.capture('https://xhslink.cn/one')
    assert result['state'] == 'error'
    assert result['error'] == 'CDP unavailable'
    assert collector == []


@pytest.mark.parametrize('endpoint', ['http://example.com:9222', 'http://user:pass@127.0.0.1:9222', 'file:///tmp', 'http://127.0.0.1:9222/path'])
def test_external_endpoint_must_be_local_metadata_endpoint(monkeypatch, endpoint):
    monkeypatch.setenv('EASEL_RESEARCH_CDP_URL', endpoint)
    with pytest.raises(RuntimeError):
        research_browser.research_cdp_endpoint()


def test_xhs_shortlink_keeps_public_dns_check(monkeypatch):
    monkeypatch.setattr(research.socket, 'getaddrinfo', lambda *a, **k: [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('192.168.0.1', 443))])
    with pytest.raises(research.CollectionError, match='非公开'):
        research.normalize_url('https://xhslink.cn/example', check_network=True)


def test_hourly_cap_survives_expired_cooldown(collector):
    now = research.time.time()
    with research.connection() as db:
        db.executemany('INSERT INTO visits VALUES (?,?)', [('小红书', now - 200 - i) for i in range(12)])
        db.execute('INSERT INTO cooldowns VALUES (?,?)', ('小红书', now - 1))
    with pytest.raises(research.CollectionError) as exc:
        research.capture('https://xhslink.cn/limited')
    assert exc.value.status == 429


def test_import_excerpt_saves_without_browser(tmp_path, monkeypatch):
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    row = research.save_source('', '手摘标题', '导入摘录', '选题', '这是一段有来源的摘录正文。')
    assert row['state'] == 'saved'
    assert row['title'] == '手摘标题'
    assert '摘录正文' in (tmp_path / 'outputs' / '研究素材' / f"{row['id']}.md").read_text(encoding='utf-8')


# 以下三条来自两树吸收线，改用现役树的 research_browser 模块。
# 之前只有 EASEL_RESEARCH_CDP_URL 环境变量这条路径有测试，
# 而界面上「连接已有浏览器」写的是 .runtime/research-browser.json，那条读配置的分支一直没人测。

def test_no_env_and_no_config_file_means_managed_profile(collector):
    assert research_browser.research_cdp_endpoint() is None
    assert research.collection_status()['connection_mode'] == 'managed_research_profile'


def test_persisted_endpoint_is_reported_and_env_still_wins(collector, monkeypatch):
    (research_browser.STATE / 'research-browser.json').write_text(
        '{"cdp_url":"http://127.0.0.1:9345"}', encoding='utf-8')
    assert research_browser.research_cdp_endpoint() == 'http://127.0.0.1:9345'
    status = research.collection_status()
    assert status['connection_mode'] == 'existing_browser'
    assert status['cdp_url'] == 'http://127.0.0.1:9345'
    monkeypatch.setenv('EASEL_RESEARCH_CDP_URL', 'http://127.0.0.1:9222')
    assert research_browser.research_cdp_endpoint() == 'http://127.0.0.1:9222'
    monkeypatch.setenv('EASEL_RESEARCH_CDP_URL', '')
    assert research_browser.research_cdp_endpoint() is None


@pytest.mark.parametrize('content', ['invalid', '{}', '{"cdp_url":"https://example.com"}'])
def test_invalid_persisted_endpoint_is_visible(collector, content):
    # 配置文件坏了要当场报错，不能悄悄退回托管档案：用户以为连的是自己的浏览器，实际在另开一个
    (research_browser.STATE / 'research-browser.json').write_text(content, encoding='utf-8')
    with pytest.raises(RuntimeError):
        research_browser.research_cdp_endpoint()
