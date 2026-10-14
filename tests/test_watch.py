import urllib.parse

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from easel import watch
from web.watch_api import router


@pytest.fixture
def path(tmp_path, monkeypatch):
    file = tmp_path / 'watch.json'
    monkeypatch.setattr(watch, 'STATE', tmp_path)
    return file


def test_only_two_platforms_and_duplicate(path):
    target = watch.add_target('xiaohongshu', '  甲老师 ', 'https://www.xiaohongshu.com/user/profile/abc', path)
    assert target['name'] == '甲老师'
    with pytest.raises(watch.WatchError, match='已经在盯'):
        watch.add_target('xiaohongshu', '甲老师', 'https://www.xiaohongshu.com/user/profile/abc', path)
    with pytest.raises(watch.WatchError, match='只能盯'):
        watch.add_target('douyin', '别人', 'https://www.douyin.com/user/x', path)
    with pytest.raises(watch.WatchError, match='主页'):
        watch.add_target('xiaohongshu', '乙', 'https://www.xiaohongshu.com/explore/note1', path)
    account = watch.add_target('wechat-oa', '丁香园', '', path)
    assert account['url'].startswith('https://weixin.sogou.com/weixin?type=2&query=')
    assert '丁香园' in urllib.parse.unquote(account['url'])
    with pytest.raises(watch.WatchError, match='不能用'):
        watch.add_target('wechat-oa', '内网', 'http://127.0.0.1/a', path)


def test_parse_posts_and_refresh_keeps_manual(path):
    target = watch.add_target('xiaohongshu', '甲', 'https://www.xiaohongshu.com/user/profile/abc', path)
    manual = watch.add_post(target['id'], '我手记的', 'https://www.xiaohongshu.com/explore/hand', '手写正文', path)

    def reader(account):
        assert account['id'] == target['id']
        return [
            {'title': '三天写完开题', 'url': 'https://www.xiaohongshu.com/explore/abc123', 'text': '先写问题再写方法', 'type': 'normal'},
            {'title': '论文草稿三天改完', 'url': 'https://www.xiaohongshu.com/explore/draft9', 'text': '这是正文', 'type': 'video'},
            {'title': '链接里的笔记', 'url': 'https://www.xiaohongshu.com/explore/fromlink', 'text': ''},
            {'title': '没', 'url': 'https://www.xiaohongshu.com/explore/short'},
        ]

    refreshed = watch.refresh_target(target['id'], reader, path)
    titles = [post['title'] for post in refreshed['posts']]
    assert '三天写完开题' in titles
    assert '论文草稿三天改完' in titles
    assert '链接里的笔记' in titles
    assert '没' not in titles
    assert any(post['media'] == '视频' and post['title'] == '论文草稿三天改完' for post in refreshed['posts'])
    assert any(post['media'] == '图文' and post['title'] == '三天写完开题' for post in refreshed['posts'])
    assert any(post['id'] == manual['id'] for post in refreshed['posts'])
    again = watch.refresh_target(target['id'], reader, path)
    assert again['message'] == '这次没有新帖。'
    assert len(again['posts']) == len(refreshed['posts'])


def test_profile_note_link_is_kept(path):
    target = watch.add_target('xiaohongshu', '甲', 'https://www.xiaohongshu.com/user/profile/abc?xsec_token=HOME', path)
    note = 'https://www.xiaohongshu.com/user/profile/abc/note9?xsec_token=T&xsec_source=pc_user'

    def reader(account):
        return [{'title': '开题三天写完', 'type': 'video', 'likes': '3', 'url': note}]

    refreshed = watch.refresh_target(target['id'], reader, path)
    assert refreshed['message'] == '新读到 1 篇。'
    assert refreshed['posts'][0]['media'] == '视频'
    assert refreshed['posts'][0]['url'] == note
    with pytest.raises(watch.WatchError, match='一篇笔记'):
        watch.add_target('xiaohongshu', '乙', note, path)
    assert watch._read_failure('', 'code: EMPTY_RESULT\n没有公开笔记') == '这次没有新帖。'
    assert '浏览器' in watch._read_failure('', 'code: AUTH_REQUIRED')
    assert watch._read_failure('', 'message: Navigation rejected.') == '这次页面没打开，等一会儿再看。'


def test_phone_share_and_article_are_told_apart(path):
    def resolve(url):
        assert url == 'https://xhslink.com/m/AbCd'
        return 'https://www.xiaohongshu.com/user/profile/abc?xsec_token=TOK&xsec_source=app_share'

    pasted = watch.add_target(
        'wechat-oa', '甲',
        '来看看我的主页>> https://xhslink.com/m/AbCd 。',
        path, resolve=resolve,
    )
    assert pasted['platform'] == 'xiaohongshu'
    assert pasted['url'].endswith('xsec_source=app_share')
    with pytest.raises(watch.WatchError, match='已经在盯'):
        watch.add_target('xiaohongshu', '甲二', 'https://www.xiaohongshu.com/user/profile/abc?xsec_token=OTHER', path)
    with pytest.raises(watch.WatchError, match='一篇文章'):
        watch.add_target('wechat-oa', '单篇', '看这篇 https://mp.weixin.qq.com/s/ONLY', path)
    with pytest.raises(watch.WatchError, match='没有主页链接'):
        watch.add_target('xiaohongshu', '空的', '只有一句话没有链接', path)
    with pytest.raises(watch.WatchError, match='一篇笔记'):
        watch.add_target('xiaohongshu', '乙', 'https://xhslink.com/a/xx', path, resolve=lambda url: 'https://www.xiaohongshu.com/explore/note1')


def test_xhs_user_command_maps_video(monkeypatch):
    def fake(args, timeout=90):
        assert args[:3] == ['xiaohongshu', 'user', 'https://www.xiaohongshu.com/user/profile/abc']
        assert '--window' in args and 'background' in args
        assert args[args.index('--trace') + 1] == 'retain-on-failure'
        assert 'login' not in args and 'publish' not in args
        return [{
            'id': 'n1', 'title': '一条视频', 'type': 'video', 'likes': '3',
            'url': 'https://www.xiaohongshu.com/explore/n1?xsec_token=T',
        }]

    monkeypatch.setattr(watch, '_opencli', fake)
    posts = watch.read_account({'platform': 'xiaohongshu', 'name': '甲', 'url': 'https://www.xiaohongshu.com/user/profile/abc'})
    assert posts[0]['media'] == '视频'
    assert 'xsec_token=T' in posts[0]['url']
    monkeypatch.undo()
    with pytest.raises(watch.WatchError, match='没读到'):
        watch._opencli(['xiaohongshu', 'login'])


def test_wechat_search_rows(path, monkeypatch):
    seen = []

    def fake(args, timeout=90):
        seen.append(args)
        return [
            {'title': '研究生怎么写开题', 'url': 'https://mp.weixin.qq.com/s/XYZ', 'summary': '先写问题'},
            {'title': '不要这条', 'url': 'https://example.com/nope', 'summary': '外站'},
        ]

    monkeypatch.setattr(watch, '_opencli', fake)
    target = watch.add_target('wechat-oa', '某号', '', path)
    got = watch.read_account(target)
    assert [post['title'] for post in got] == ['研究生怎么写开题']
    assert got[0]['media'] == '文章'
    assert got[0]['text'] == '先写问题'
    assert seen[0][:3] == ['weixin', 'search', '某号']
    assert seen[0][seen[0].index('--trace') + 1] == 'retain-on-failure'
    assert 'login' not in seen[0] and 'publish' not in seen[0]


def test_refresh_failure_keeps_posts(path):
    target = watch.add_target('xiaohongshu', '甲', 'https://www.xiaohongshu.com/user/profile/abc', path)
    watch.add_post(target['id'], '还在', text='正文', path=path)

    def boom(url):
        raise TimeoutError('slow')

    got = watch.refresh_target(target['id'], boom, path)
    assert got['posts'][0]['title'] == '还在'
    assert got['message'] == '这次没读到新帖。'


def test_prompt_and_parse_roundtrip():
    prompt = watch.task_prompt({'title': '对方标题', 'text': '对方正文'})
    assert '对方标题' in prompt and '不要照抄' in prompt
    draft = watch.parse_draft('标题：我的标题\n正文：\n这是写成的一篇。')
    assert draft == {
        'title': '我的标题',
        'body': '这是写成的一篇。',
        'platforms': ['xiaohongshu', 'wechat-oa'],
    }
    with pytest.raises(watch.WatchError, match='没写完'):
        watch.parse_draft('标题：一句话\n正文：\n从这里写正文')
    with pytest.raises(watch.WatchError, match='没写完'):
        watch.parse_draft('随便写了一段没有格式')


def test_remove_and_empty_name(path):
    target = watch.add_target('wechat-oa', '甲', '', path)
    post = watch.add_post(target['id'], '', text='只有正文没有标题', path=path)
    assert post['title'] == '只有正文没有标题'
    watch.remove_post(post['id'], path)
    assert watch.load(path)['targets'][0]['posts'] == []
    watch.remove_target(target['id'], path)
    assert watch.load(path)['targets'] == []
    with pytest.raises(watch.WatchError, match='名字'):
        watch.add_target('wechat-oa', '   ', '', path)


def test_api_uses_store_and_parser(path, monkeypatch, tmp_path):
    profile = tmp_path / 'profiles' / '科研'
    profile.mkdir(parents=True)
    (profile / 'style.md').write_text('短句', encoding='utf-8')
    monkeypatch.setattr(watch, 'STATE', path.parent if path.name == 'watch.json' else path)
    # fixture 把 STATE 指到 tmp_path，store 就是 tmp_path/watch.json
    monkeypatch.setattr('web.watch_api.persona.profile_exists', lambda name: name == '科研')
    monkeypatch.setattr(watch, 'final_url', lambda url: (_ for _ in ()).throw(AssertionError('不应访问网络')))
    monkeypatch.setattr(watch, 'read_account', lambda target: (_ for _ in ()).throw(AssertionError('不应去读账号')))
    monkeypatch.setattr(watch, 'read_post_detail', lambda platform, url: (_ for _ in ()).throw(AssertionError('不应去读正文')))
    app = FastAPI()
    app.include_router(router)
    client = TestClient(app)
    created = client.post('/api/watch/targets', json={
        'platform': 'xiaohongshu', 'name': '甲',
        'url': 'https://www.xiaohongshu.com/user/profile/abc',
    })
    assert created.status_code == 200, created.text
    target_id = created.json()['id']
    posted = client.post(f'/api/watch/targets/{target_id}/posts', json={'title': '对方', 'text': '对方正文'})
    assert posted.status_code == 200
    blocked = client.post('/api/watch/prompt', json={'post_id': posted.json()['id'], 'persona': '../科研'})
    assert blocked.status_code == 400
    prompted = client.post('/api/watch/prompt', json={'post_id': posted.json()['id'], 'persona': '科研'})
    assert prompted.status_code == 200
    assert '对方正文' in prompted.json()['prompt']
    parsed = client.post('/api/watch/parse', json={'text': '标题：新标题\n正文：\n新正文在这里。'})
    assert parsed.json()['platforms'] == ['xiaohongshu', 'wechat-oa']
    missing = client.post('/api/watch/targets', json={'platform': 'douyin', 'name': '抖', 'url': 'https://www.douyin.com/user/a'})
    assert missing.status_code == 400
    listed = client.get('/api/watch')
    assert listed.json()['targets'][0]['name'] == '甲'


def test_corrupt_store_is_empty(path):
    path.write_text('{', encoding='utf-8')
    assert watch.load(path) == {'targets': []}
