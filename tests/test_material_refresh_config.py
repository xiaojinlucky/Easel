"""Publication must not bake a user's collection identifiers into source code."""
import asyncio
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

import web.app as web


@pytest.mark.parametrize('file_values,env_values,expected', [
    (None, None, None),
    (('test-base', 'test-table'), None, ('test-base', 'test-table')),
    (('test-base', 'test-table'), ('  ', '  '), ('test-base', 'test-table')),
    (None, ('replace_me', 'replace_me'), None),
    (('replace_me', 'replace_me'), None, None),
    (None, ('env-base', 'env-table'), ('env-base', 'env-table')),
    (('file-base', 'file-table'), ('env-base', 'env-table'), ('env-base', 'env-table')),
])
def test_refresh_requires_local_config_and_passes_it_to_exporter(tmp_path, monkeypatch, file_values, env_values, expected):
    env_file = tmp_path / '.env'
    env_file.write_text(
        f'META_FEISHU_BASE_TOKEN={file_values[0]}\nMETA_FEISHU_TABLE_ID={file_values[1]}\n' if file_values else '',
        encoding='utf-8',
    )
    monkeypatch.setattr(web, 'ENV_FILE', env_file)
    monkeypatch.setattr(web, 'MATERIALS_DIR', tmp_path / '中文 素材')
    monkeypatch.setattr(web, '_MAT_REFRESH', {'running': False, 'msg': ''})
    monkeypatch.delenv('META_FEISHU_BASE_TOKEN', raising=False)
    monkeypatch.delenv('META_FEISHU_TABLE_ID', raising=False)
    if env_values:
        monkeypatch.setenv('META_FEISHU_BASE_TOKEN', env_values[0])
        monkeypatch.setenv('META_FEISHU_TABLE_ID', env_values[1])
    monkeypatch.setattr(web.shutil, 'which', lambda _: 'lark-cli.exe')
    calls = []
    jobs = []
    monkeypatch.setattr(web.threading, 'Thread', lambda *, target, daemon: SimpleNamespace(start=lambda: jobs.append(target)))

    def export(cmd, **kwargs):
        calls.append(cmd)
        if '--output' in cmd:
            Path(cmd[cmd.index('--output') + 1]).write_text('{"record_id":"test-record"}\n', encoding='utf-8')
        return SimpleNamespace(stdout='', stderr='')

    monkeypatch.setattr(web.subprocess, 'run', export)
    if expected is None:
        with pytest.raises(HTTPException) as exc:
            asyncio.run(web.api_materials_refresh())
        assert exc.value.status_code == 400
        assert not jobs and not calls
        assert not web.MATERIALS_DIR.exists()
        return

    assert asyncio.run(web.api_materials_refresh()) == {'state': 'running'}
    assert len(jobs) == 1
    jobs[0]()
    cmd = calls[0]
    assert cmd[cmd.index('--base-token') + 1] == expected[0]
    assert cmd[cmd.index('--table-id') + 1] == expected[1]
    assert len(list(web.MATERIALS_DIR.glob('feishu-*.ndjson'))) == 1
    assert not list(web.MATERIALS_DIR.glob('*.part'))
    assert web._MAT_REFRESH == {'running': False, 'msg': '已更新'}
