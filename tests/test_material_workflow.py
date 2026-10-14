"""从素材写一篇：只在人点开时存在的一条流程，备注原样读回。"""
import json

from easel import material_draft, workflow

NOTE = '人工确认之前不能发出去。\n不能把“发出去”写成已经发出。\n行尾留空  '


def test_library_workflow_roundtrips_steps_and_edge_note(monkeypatch, tmp_path):
    live = workflow.WORKFLOWS_DIR
    before = sorted(path.name for path in live.glob('*.json')) if live.is_dir() else []
    monkeypatch.setattr(workflow, 'WORKFLOWS_DIR', tmp_path / 'workflows')

    saved = workflow.save(material_draft.library_workflow(NOTE))
    listed = workflow.list_workflows()
    loaded = workflow.load(saved['id'])

    assert [item['id'] for item in listed] == [saved['id']]
    assert loaded['id'] == 'library-draft'
    assert loaded['note'] == NOTE
    assert 'schedule' not in loaded
    assert 'cron' not in loaded
    assert 'timer' not in loaded
    steps = workflow.recipe_steps(loaded)
    assert [step['prompt'] for step in steps] == [
        'save-into-library',
        'choose specific materials or all materials',
        'draft with the account persona',
        'stop for human review',
    ]
    assert [step['title'] for step in steps] == [
        '保存进素材库',
        '选定素材或全部素材',
        '按画像写草稿',
        '停下来等人看',
    ]
    blob = json.dumps(loaded, ensure_ascii=False).lower()
    assert 'publish' not in blob
    assert 'delete' not in blob
    for node in loaded['nodes']:
        text = json.dumps(node, ensure_ascii=False)
        assert '发布' not in text
        assert '删除' not in text
    after = sorted(path.name for path in live.glob('*.json')) if live.is_dir() else []
    assert after == before
