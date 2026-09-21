import importlib.util
from pathlib import Path

from easel import research  # noqa: E402  （宿主模块导入时已把仓库根加入 sys.path）

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    'beav_native_host', ROOT / 'scripts' / 'beav_native_host.py'
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
_text_from_payload = mod._text_from_payload
handle = mod.handle


def test_project_root_ignores_utf8_bom():
    bom_path = b"\xef\xbb\xbfF:\\easel-official\r\n"
    resolved = Path(bom_path.decode("utf-8-sig").strip())
    assert resolved.name == "easel-official"
    text = (ROOT / "scripts" / "beav_native_host.py").read_text(encoding="utf-8")
    assert 'encoding="utf-8-sig"' in text


def test_hashtags_become_tags_when_plugin_omits_them():
    entry = mod.extract_entry('knowledge.ingestXhsEntryV2', {
        'payload': {
            'source': {'sourceUrl': 'https://www.xiaohongshu.com/explore/abc'},
            'note': {'title': '简历求改', 'text': '27应届 #改简历#校招 #生物就业前景'},
        }
    })
    assert '改简历' in entry['extra']['tags']
    assert '校招' in entry['extra']['tags']


def test_ping_reports_bridge_connected():
    result = handle('ping', {})
    assert result['ok'] is True
    assert result['appVersion'].startswith('2.7.')
    assert result['desktopBridge']['connected'] is True
    assert result['desktopBridge']['browserControl'] is False
    assert result['capabilities']['browserControl'] is False


def test_extracts_knowledge_entry_fields():
    url, title, text = _text_from_payload({
        'payload': {
            'source': {'sourceUrl': 'https://www.xiaohongshu.com/explore/abc'},
            'content': {'title': '一条笔记', 'text': '正文内容'},
        }
    })
    assert url.endswith('/abc')
    assert title == '一条笔记'
    assert '正文' in text


def test_xhs_v2_uses_note_text_and_images():
    entry = mod.extract_entry('knowledge.ingestXhsEntryV2', {
        'payload': {
            'source': {'sourceUrl': 'https://www.xiaohongshu.com/explore/abc', 'externalId': 'n1'},
            'note': {
                'title': 'V2标题',
                'text': '笔记正文不该丢',
                'author': {'nickname': '作者甲'},
                'assets': {
                    'coverUrl': 'https://example.com/cover.jpg',
                    'imageUrls': ['https://example.com/1.jpg'],
                },
            },
            'comments': {'items': [{'author': '乙', 'text': '一条评论'}]},
        }
    })
    assert entry['title'] == 'V2标题'
    assert '不该丢' in entry['text']
    assert entry['author'] == '作者甲'
    assert entry['cover_url'].endswith('cover.jpg')
    assert '一条评论' in entry['extra']['comments_text']
    entry2 = mod.extract_entry('knowledge.ingestXhsEntryV2', {
        'payload': {
            'source': {'sourceUrl': 'https://www.xiaohongshu.com/explore/abc'},
            'note': {'title': '有赞', 'text': '正文', 'stats': {'likes': 12, 'collects': 3, 'comments': 4}, 'tags': ['科研']},
        }
    })
    assert entry2['extra']['likes'] == 12
    assert '科研' in entry2['extra']['tags']


def test_accounts_rpc_is_rejected():
    try:
        handle('accounts.createImportSession', {'payload': {'homepageUrl': 'https://www.xiaohongshu.com/user/profile/x'}})
        raise AssertionError('should reject')
    except ValueError as exc:
        assert '账号档案' in str(exc)


def test_zhihu_answer_uses_nested_text():
    entry = mod.extract_entry('knowledge.ingestZhihuAnswer', {
        'payload': {
            'source': {'sourceUrl': 'https://www.zhihu.com/question/1/answer/2'},
            'answer': {'text': '回答正文', 'author': '答主'},
        }
    })
    assert '回答正文' in entry['text']
    assert entry['author'] == '答主'


def _isolate(tmp_path, monkeypatch):
    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    monkeypatch.setattr(research, 'ocr_local_images', lambda rel: '')


def test_ingest_receipt_created_then_duplicate(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    payload = {'payload': {
        'source': {'sourceUrl': 'https://www.xiaohongshu.com/explore/abc', 'externalId': 'note-1'},
        'note': {'title': '幂等测试', 'text': '同样的正文'},
    }}
    first = handle('knowledge.ingestXhsEntryV2', payload)
    assert first['created'] is True and first['duplicate'] is False
    assert first['storageStatus'] == 'stored' and first['readBack'] is True
    second = handle('knowledge.ingestXhsEntryV2', payload)
    assert second['id'] == first['id']
    assert second['duplicate'] is True and second['created'] is False
    row = research.get_source(first['id'])
    assert row['content'] == '同样的正文'


def test_operation_id_replays_receipt(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    params = {
        'operationId': 'op-42',
        'payload': {
            'source': {'sourceUrl': 'https://www.zhihu.com/question/9/answer/8'},
            'answer': {'text': '只应落库一次', 'author': '甲'},
        },
    }
    first = handle('knowledge.ingestZhihuAnswer', params)
    second = handle('knowledge.ingestZhihuAnswer', params)
    assert second['replayed'] is True and second['id'] == first['id']
    with research.connection() as db:
        assert db.execute("SELECT count(*) FROM sources WHERE state='saved'").fetchone()[0] == 1


def test_data_images_are_decoded_not_stored(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    tiny = 'data:image/png;base64,AAAA'
    payload = {'payload': {
        'source': {'sourceUrl': 'https://www.xiaohongshu.com/explore/img1'},
        'note': {'title': '内联图', 'text': '短', 'assets': {'coverUrl': tiny, 'imageUrls': [tiny]}},
    }}
    receipt = handle('knowledge.ingestXhsEntryV2', payload)
    row = research.get_source(receipt['id'])
    local_images = row['extra'].get('local_images') or []
    assert local_images and all((tmp_path / 'outputs' / p).is_file() for p in local_images)
    assert 'data_images' not in row['extra']
    assert 'data:image' not in row['content']
    assert 'data:image' not in (row['extra_json'] or '')


def test_video_url_and_transcribe_task_extracted():
    entry = mod.extract_entry('knowledge.ingestEntry', {'payload': {
        'source': {'sourceUrl': 'https://www.bilibili.com/video/BV1xx'},
        'content': {'title': '一个视频', 'text': '简介'},
        'assets': {'videoUrl': 'https://example.com/stream.m4s'},
        'options': {'transcribe': True},
    }})
    assert entry['extra']['video_url'].endswith('stream.m4s')
    assert entry['extra']['pending_tasks'] == ['transcribe']
    assert entry['platform'] == '哔哩哔哩'


def test_kind_and_platform_normalized():
    xhs = mod.extract_entry('knowledge.ingestXhsEntryV2', {'payload': {
        'source': {'sourceUrl': 'https://www.xiaohongshu.com/explore/a'},
        'note': {'title': 't', 'text': 'x'},
    }})
    assert xhs['kind'] == 'redbook-note' and xhs['platform'] == '小红书'
    zhihu = mod.extract_entry('knowledge.ingestZhihuArticle', {'payload': {
        'source': {'sourceUrl': 'https://zhuanlan.zhihu.com/p/123'},
        'article': {'text': '文'},
    }})
    assert zhihu['kind'] == 'zhihu-article' and zhihu['platform'] == '知乎'


def test_media_assets_text_never_leaks_data_urls():
    entry = mod.extract_entry('knowledge.ingestMediaAssets', {'payload': {
        'source': {'sourceUrl': 'https://www.xiaohongshu.com/explore/m1'},
        'items': [{'source': 'data:image/png;base64,AAAA', 'title': '图'}],
    }})
    assert not entry['text'].startswith('data:')
    assert entry['extra']['data_images'] == ['data:image/png;base64,AAAA']
    assert entry['extra']['image_urls'] == []


def test_desktop_health_reports_real_counts(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    handle('knowledge.ingestZhihuAnswer', {'payload': {
        'source': {'sourceUrl': 'https://www.zhihu.com/question/5/answer/6'},
        'answer': {'text': '一条素材'},
    }})
    result = handle('desktop.health', {})
    counts = result['knowledge']['counts']
    assert counts['saved'] == 1
    assert counts['kinds'].get('zhihu-answer') == 1
    assert counts['platforms'].get('知乎') == 1


def test_desktop_context_reports_ready_state():
    context = handle('desktop.context', {})
    assert context['initialization'] == {'ready': True, 'state': 'ready'}
    assert context['ingest']['allowed'] is True


def test_private_video_url_is_not_queued_for_transcribe():
    """转写会真的去请求这个地址：内网地址不投任务，但地址本身照常保存。"""
    entry = mod.extract_entry('knowledge.ingestEntry', {'payload': {
        'source': {'sourceUrl': 'https://www.bilibili.com/video/BV2xx'},
        'content': {'title': '内网视频', 'text': '简介'},
        'assets': {'videoUrl': 'http://127.0.0.1:7870/api/research/sources'},
        'options': {'transcribe': True},
    }})
    assert entry['extra']['pending_tasks'] == []
    assert entry['extra']['video_url'].startswith('http://127.0.0.1')


def test_replayed_receipt_marks_deleted_source(tmp_path, monkeypatch):
    _isolate(tmp_path, monkeypatch)
    params = {
        'operationId': 'op-gone',
        'payload': {
            'source': {'sourceUrl': 'https://www.zhihu.com/question/7/answer/7'},
            'answer': {'text': '存过一次就被删了'},
        },
    }
    first = handle('knowledge.ingestZhihuAnswer', params)
    assert first['success'] is True and first['storageStatus'] == 'stored'
    research.delete_sources([first['id']])
    replay = handle('knowledge.ingestZhihuAnswer', params)
    assert replay['replayed'] is True
    assert replay['success'] is False and replay['missing'] is True
    assert replay['storageStatus'] == 'missing'


def test_enqueue_failure_is_visible_in_receipt(tmp_path, monkeypatch):
    """加工队列挂了不能只躺在宿主日志里：回执要说清这次没排上队。"""
    _isolate(tmp_path, monkeypatch)
    from easel import research_enrich

    calls = []

    def flaky(identifier, task='enrich'):
        calls.append((identifier, task))
        if len(calls) == 1:
            raise RuntimeError('队列写不进去')
        return True

    monkeypatch.setattr(research_enrich, 'enqueue', flaky)
    receipt = handle('knowledge.ingestXhsEntryV2', {'payload': {
        'source': {'sourceUrl': 'https://www.xiaohongshu.com/explore/enq1'},
        'note': {'title': '投递失败', 'text': '正文'},
    }})
    assert receipt['success'] is True                      # 入库不受影响
    assert receipt['processing']['queued'] == [] and '队列写不进去' in receipt['processing']['failed']

    ok = handle('knowledge.ingestXhsEntryV2', {'payload': {
        'source': {'sourceUrl': 'https://www.xiaohongshu.com/explore/enq2'},
        'note': {'title': '投递成功', 'text': '正文'},
    }})
    assert ok['processing'] == {'queued': ['enrich']}


def test_oversized_frame_is_refused(monkeypatch):
    """长度头是 4 字节无符号整数，最大能声明 4GB：不设上限一条坏帧就能把宿主吃掉。"""
    class Stub:
        buffer = type('B', (), {'read': staticmethod(lambda n: b'\xff\xff\xff\xff' if n == 4 else b'')})()

    monkeypatch.setattr(mod.sys, 'stdin', Stub())
    assert mod._read() is None
