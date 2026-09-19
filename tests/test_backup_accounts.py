"""scripts/backup_accounts.py 的回归测试。

重点保护三条「错了就丢数据」的路径：
1. 备份不该把浏览器缓存打进去（体积会从 KB 级涨回百 MB 级）；
2. 恢复要把内容原样写回，并拒绝越界成员（绝对路径 / `..` / 盘符相对路径）；
3. 恢复前必须给现有状态留快照，否则一次误恢复就没退路。
"""
from __future__ import annotations

import importlib.util
import json
import os
import time
import zipfile
from argparse import Namespace
from pathlib import Path

import pytest

SCRIPTS_DIR = Path(__file__).resolve().parents[1] / 'scripts'


def _load_module():
    spec = importlib.util.spec_from_file_location(
        'backup_accounts_under_test', SCRIPTS_DIR / 'backup_accounts.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture
def sandbox(tmp_path, monkeypatch):
    """把「用户目录」和「项目根」都挪到 tmp_path，绝不动真实登录态。"""
    module = _load_module()
    home = tmp_path / 'home'
    project = tmp_path / 'project'
    monkeypatch.setattr(module, '_home', lambda: home)
    monkeypatch.setattr(module, 'ROOT', project)
    monkeypatch.setattr(module, 'STATE', project / '.runtime')
    monkeypatch.setattr(module, 'BACKUP_DIR', project / '.runtime' / 'account-backups')
    monkeypatch.setattr(
        module, 'SKILL_CONFIG',
        project / 'skills' / 'openclaw' / 'skill-wechat-publisher' / 'wechat-publisher.yaml')

    profile = home / '.easel-browser-profiles' / 'XiaohongshuProfile' / 'Default'
    (profile / 'Network').mkdir(parents=True)
    (profile / 'Network' / 'Cookies').write_bytes(b'web_session=abc')
    (profile / 'Cache' / 'Cache_Data').mkdir(parents=True)
    (profile / 'Cache' / 'Cache_Data' / 'junk').write_bytes(b'x' * 4096)
    (profile / 'Code Cache' / 'js').mkdir(parents=True)
    (profile / 'Code Cache' / 'js' / 'big').write_bytes(b'y' * 4096)

    (project / 'outputs' / '_login').mkdir(parents=True)
    (project / 'outputs' / '_login' / 'qr.png').write_bytes(b'png')
    (project / 'outputs' / '_login' / 'noise.log').write_bytes(b'log')
    (project / 'profiles' / 'someone').mkdir(parents=True)
    (project / 'profiles' / 'someone' / 'identity.md').write_text('人设', encoding='utf-8')
    (project / 'cookies.json').write_text('{"bili": 1}', encoding='utf-8')
    module.SKILL_CONFIG.parent.mkdir(parents=True)
    module.SKILL_CONFIG.write_text('default: main\n', encoding='utf-8')
    (project / '.runtime').mkdir(parents=True, exist_ok=True)
    (project / '.runtime' / 'postiz.env').write_text('KEY=1', encoding='utf-8')

    return module


def _arc_names(archive_path: Path) -> list[str]:
    with zipfile.ZipFile(archive_path) as archive:
        return archive.namelist()


def test_backup_skips_browser_caches_and_logs(sandbox, capsys):
    sandbox.cmd_backup(Namespace(keep=10))
    archives = sandbox._all_archives()
    assert len(archives) == 1
    names = _arc_names(archives[0])
    assert not [n for n in names if '/Cache/' in n or '/Code Cache/' in n]
    assert not [n for n in names if n.endswith('.log')]
    assert 'home/.easel-browser-profiles/XiaohongshuProfile/Default/Network/Cookies' in names
    assert 'project/outputs/_login/qr.png' in names
    assert 'project/.runtime/postiz.env' in names


def test_manifest_records_skipped_and_missing(sandbox, capsys):
    sandbox.cmd_backup(Namespace(keep=10))
    manifest = sandbox._read_manifest(sandbox._all_archives()[0])
    assert manifest['kind'] == 'easel-account-state'
    assert manifest['contains_secrets'] is True
    assert manifest['file_count'] == len(manifest['entries'])
    assert manifest['total_bytes'] == sum(item['bytes'] for item in manifest['entries'])


def test_restore_round_trip_restores_exact_bytes(sandbox, capsys):
    sandbox.cmd_backup(Namespace(keep=10))
    archive = sandbox._all_archives()[0]
    cookie = sandbox._home() / '.easel-browser-profiles/XiaohongshuProfile/Default/Network/Cookies'
    identity = sandbox.ROOT / 'profiles' / 'someone' / 'identity.md'
    cookie.write_bytes(b'wiped')
    identity.unlink()

    code = sandbox.cmd_restore(Namespace(archive=str(archive), dry_run=False))
    assert code == 0
    assert cookie.read_bytes() == b'web_session=abc'
    assert identity.read_text(encoding='utf-8') == '人设'


def test_restore_snapshots_existing_state_first(sandbox, capsys):
    sandbox.cmd_backup(Namespace(keep=10))
    archive = sandbox._all_archives()[0]
    sandbox.cmd_restore(Namespace(archive=str(archive), dry_run=False))
    snapshots = [p for p in sandbox._all_archives() if p.name.startswith('accounts-snapshot-')]
    assert len(snapshots) == 1


def test_restore_dry_run_writes_nothing(sandbox):
    sandbox.cmd_backup(Namespace(keep=10))
    archive = sandbox._all_archives()[0]
    cookie = sandbox._home() / '.easel-browser-profiles/XiaohongshuProfile/Default/Network/Cookies'
    cookie.write_bytes(b'wiped')
    sandbox.cmd_restore(Namespace(archive=str(archive), dry_run=True))
    assert cookie.read_bytes() == b'wiped'
    assert not [p for p in sandbox._all_archives() if p.name.startswith('accounts-snapshot-')]


@pytest.mark.parametrize('arc', [
    'project/../escaped.txt',
    'home/.easel-browser-profiles/../../escaped.txt',
    '/absolute/escaped.txt',
    'project/C:/escaped.txt',
    'unknown/escaped.txt',
])
def test_dest_for_rejects_out_of_scope_members(sandbox, arc):
    assert sandbox._dest_for(arc) is None


def test_dest_for_accepts_expected_prefixes(sandbox):
    assert sandbox._dest_for('home/x/y') == sandbox._home() / 'x' / 'y'
    assert sandbox._dest_for('project/outputs/_login/a.png') == \
        sandbox.ROOT / 'outputs' / '_login' / 'a.png'
    assert sandbox._dest_for('home') is None
    assert sandbox._dest_for('project') is None


def test_restore_ignores_traversal_members_without_writing_them(sandbox, tmp_path, capsys):
    sandbox.cmd_backup(Namespace(keep=10))
    source = sandbox._all_archives()[0]
    hostile = sandbox.BACKUP_DIR / 'hostile.zip'
    with zipfile.ZipFile(source) as origin, zipfile.ZipFile(hostile, 'w') as target:
        for name in origin.namelist():
            target.writestr(name, origin.read(name))
        target.writestr('project/../escaped.txt', 'boom')
    code = sandbox.cmd_restore(Namespace(archive=str(hostile), dry_run=False))
    assert code == 0
    assert not (tmp_path / 'escaped.txt').exists()
    assert '越界' in capsys.readouterr().out


def test_verify_detects_tampered_member(sandbox, capsys):
    sandbox.cmd_backup(Namespace(keep=10))
    source = sandbox._all_archives()[0]
    tampered = sandbox.BACKUP_DIR / 'tampered.zip'
    target_arc = 'project/cookies.json'
    with zipfile.ZipFile(source) as origin, zipfile.ZipFile(tampered, 'w') as target:
        for name in origin.namelist():
            payload = origin.read(name)
            if name == target_arc:
                payload = b'{"bili": 9}'    # 与原文同长度，确保命中的是 SHA-256 而不是长度检查
            target.writestr(name, payload)
    assert sandbox.cmd_verify(Namespace(archive=str(tampered))) == 1
    assert '不符' in capsys.readouterr().out


def test_verify_passes_on_fresh_backup(sandbox):
    sandbox.cmd_backup(Namespace(keep=10))
    assert sandbox.cmd_verify(Namespace(archive=str(sandbox._all_archives()[0]))) == 0


def test_prune_keeps_manual_and_snapshot_budgets_separate(sandbox):
    sandbox.BACKUP_DIR.mkdir(parents=True)
    for index in range(1, 6):
        (sandbox.BACKUP_DIR / f'accounts-2026010{index}-000000.zip').write_bytes(b'')
        (sandbox.BACKUP_DIR / f'accounts-snapshot-2026010{index}-000000.zip').write_bytes(b'')
    sandbox._prune('accounts', 2)
    remaining = sorted(p.name for p in sandbox.BACKUP_DIR.iterdir())
    assert [n for n in remaining if n.startswith('accounts-2')] == [
        'accounts-20260104-000000.zip', 'accounts-20260105-000000.zip']
    assert len([n for n in remaining if n.startswith('accounts-snapshot-')]) == 5


def test_missing_manifest_is_rejected(sandbox, tmp_path):
    stray = tmp_path / 'stray.zip'
    with zipfile.ZipFile(stray, 'w') as archive:
        archive.writestr('project/cookies.json', '{}')
    with pytest.raises(SystemExit):
        sandbox._read_manifest(stray)


def test_second_backup_in_same_second_does_not_overwrite(sandbox):
    sandbox.cmd_backup(Namespace(keep=10))
    sandbox.cmd_backup(Namespace(keep=10))
    assert len(sandbox._all_archives()) == 2


def test_status_is_read_only(sandbox, capsys):
    before = sorted(p.name for p in sandbox._home().rglob('*'))
    assert sandbox.cmd_status(Namespace()) == 0
    assert sorted(p.name for p in sandbox._home().rglob('*')) == before


# --------------------------------------------------------------------------- #
# 对抗性审查回填：符号链接 / 畸形 manifest / 临时文件
# --------------------------------------------------------------------------- #
def _hostile_archive(sandbox, name: str, manifest_text: str) -> Path:
    sandbox.BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    path = sandbox.BACKUP_DIR / name
    with zipfile.ZipFile(path, 'w') as archive:
        archive.writestr(sandbox.MANIFEST_NAME, manifest_text)
        archive.writestr('project/cookies.json', '{}')
    return path


def test_files_symlink_is_not_followed(sandbox, tmp_path, capsys):
    """`FILES` 里的符号链接必须跳过。

    跟随的话，一个软链到项目外文件的 `cookies.json` 会把外部内容静默打进归档
    —— 既泄露又可能撑爆体积。`TREES` 本来就不跟随，这里保证两处口径一致。
    """
    outside = tmp_path / 'outside-secret.txt'
    outside.write_text('TOP_SECRET_EXTERNAL_CONTENT', encoding='utf-8')
    link = sandbox.ROOT / 'cookies.json'
    if link.exists():
        link.unlink()
    try:
        link.symlink_to(outside)
    except (OSError, NotImplementedError):
        pytest.skip('当前环境不允许创建符号链接')

    sandbox.cmd_backup(Namespace(keep=10))
    archive_path = sandbox._all_archives()[0]
    with zipfile.ZipFile(archive_path) as archive:
        assert 'project/cookies.json' not in archive.namelist()
        joined = b''.join(archive.read(n) for n in archive.namelist())
    assert b'TOP_SECRET_EXTERNAL_CONTENT' not in joined
    assert 'cookies.json' in capsys.readouterr().out        # 跳过原因要报出来，不能默默少存


def test_symlink_inside_trees_is_not_followed(sandbox, tmp_path):
    outside = tmp_path / 'outside2.txt'
    outside.write_text('OUTSIDE_TREE_SECRET', encoding='utf-8')
    planted = sandbox._home() / '.easel-browser-profiles/XiaohongshuProfile/planted.lnk'
    try:
        planted.symlink_to(outside)
    except (OSError, NotImplementedError):
        pytest.skip('当前环境不允许创建符号链接')

    sandbox.cmd_backup(Namespace(keep=10))
    with zipfile.ZipFile(sandbox._all_archives()[0]) as archive:
        joined = b''.join(archive.read(n) for n in archive.namelist())
    assert b'OUTSIDE_TREE_SECRET' not in joined


@pytest.mark.parametrize('manifest_text, reason', [
    ('{ this is not json ', '非法 JSON'),
    ('[]', '顶层不是对象'),
    (json.dumps({'kind': 'someone-else'}), 'kind 不符'),
    (json.dumps({'kind': 'easel-account-state', 'host': 'h', 'file_count': 0,
                 'total_bytes': 0, 'entries': []}), '缺 created_at'),
    (json.dumps({'kind': 'easel-account-state', 'created_at': 'x', 'host': 'h',
                 'file_count': 0, 'total_bytes': 0}), '缺 entries'),
    (json.dumps({'kind': 'easel-account-state', 'created_at': 'x', 'host': 'h',
                 'file_count': 0, 'total_bytes': 0, 'entries': 'nope'}), 'entries 不是数组'),
])
def test_malformed_manifest_exits_cleanly(sandbox, manifest_text, reason):
    """畸形 MANIFEST 必须转成可读退出，而不是抛 JSONDecodeError / KeyError 堆栈。

    恢复工具死在堆栈上是最糟的失败方式：用户看不出该删哪份、该重备哪份。
    """
    path = _hostile_archive(sandbox, 'broken.zip', manifest_text)
    with pytest.raises(SystemExit) as excinfo:
        sandbox._read_manifest(path)
    message = str(excinfo.value)
    assert 'broken.zip' in message or 'MANIFEST' in message, (reason, message)
    assert 'Traceback' not in message


def test_malformed_archive_is_reported_by_every_subcommand(sandbox, capsys):
    path = _hostile_archive(sandbox, 'broken.zip', '{ not json')
    assert sandbox.cmd_list(Namespace()) == 0          # list 跳过损坏项，不中断
    assert '损坏' in capsys.readouterr().out
    for command in (lambda: sandbox.cmd_verify(Namespace(archive=str(path))),
                    lambda: sandbox.cmd_restore(Namespace(archive=str(path), dry_run=True))):
        with pytest.raises(SystemExit):
            command()


def test_non_zip_file_is_rejected_readably(sandbox, tmp_path):
    stray = sandbox.BACKUP_DIR / 'not-a-zip.zip'
    stray.parent.mkdir(parents=True, exist_ok=True)
    stray.write_bytes(b'definitely not a zip')
    with pytest.raises(SystemExit) as excinfo:
        sandbox._read_manifest(stray)
    assert 'zip' in str(excinfo.value)


def test_broken_entry_shape_does_not_crash_verify(sandbox, capsys):
    """entries 数组里混进坏条目时，verify 要报问题而不是崩在 KeyError。"""
    sandbox.cmd_backup(Namespace(keep=10))
    source = sandbox._all_archives()[0]
    with zipfile.ZipFile(source) as archive:
        manifest = json.loads(archive.read(sandbox.MANIFEST_NAME).decode('utf-8'))
    manifest['entries'].append({'arc': 'project/ghost'})        # 缺 bytes / sha256
    tampered = sandbox.BACKUP_DIR / 'bogus-entry.zip'
    with zipfile.ZipFile(source) as origin, zipfile.ZipFile(tampered, 'w') as target:
        for name in origin.namelist():
            if name == sandbox.MANIFEST_NAME:
                target.writestr(name, json.dumps(manifest, ensure_ascii=False))
            else:
                target.writestr(name, origin.read(name))
    assert sandbox.cmd_verify(Namespace(archive=str(tampered))) == 1
    assert '条目字段不全' in capsys.readouterr().out


def test_part_files_are_not_listed_and_stale_ones_are_swept(sandbox):
    sandbox.BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    fresh = sandbox.BACKUP_DIR / 'accounts-20260101-000000.zip.999.part'
    fresh.write_bytes(b'partial')
    stale = sandbox.BACKUP_DIR / 'accounts-20260101-000000.zip.888.part'
    stale.write_bytes(b'partial')
    old = time.time() - (sandbox.STALE_PART_AGE + 60)
    os.utime(stale, (old, old))

    assert fresh not in sandbox._all_archives()          # `.part` 不算备份
    sandbox._sweep_stale_parts(sandbox.BACKUP_DIR)
    assert stale.exists() is False                       # 老残留被清掉
    assert fresh.exists() is True                        # 新鲜的可能是别人正在写的，不动


def test_temp_archive_name_carries_pid(sandbox, monkeypatch):
    """临时名带 pid，同秒并发才不会共用同一个 `.part` 互相截断。"""
    written: list[str] = []
    real_zipfile = zipfile.ZipFile

    class Spy(real_zipfile):                             # type: ignore[misc]
        def __init__(self, file, *args, **kwargs):
            written.append(str(file))
            super().__init__(file, *args, **kwargs)

    monkeypatch.setattr(zipfile, 'ZipFile', Spy)
    sandbox.cmd_backup(Namespace(keep=10))
    monkeypatch.undo()
    temp_names = [name for name in written if name.endswith('.part')]
    assert temp_names and all(str(os.getpid()) in name for name in temp_names)
    assert list(sandbox.BACKUP_DIR.glob('*.part')) == []   # 成功后不留临时文件


def test_postiz_cli_home_is_covered(sandbox):
    """Postiz CLI 的 OAuth 凭据目录属「配一次长期有效」，必须纳入。"""
    creds = sandbox.STATE / 'postiz-cli-home' / 'session.json'
    creds.parent.mkdir(parents=True, exist_ok=True)
    creds.write_text('{"token": "t"}', encoding='utf-8')
    sandbox.cmd_backup(Namespace(keep=10))
    with zipfile.ZipFile(sandbox._all_archives()[0]) as archive:
        assert 'project/.runtime/postiz-cli-home/session.json' in archive.namelist()
