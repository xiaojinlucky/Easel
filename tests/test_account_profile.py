import json
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from easel import account_profile as ap, persona
from web.account_profile_api import router


@pytest.fixture
def setup(tmp_path, monkeypatch):
    monkeypatch.setattr(ap, 'PROFILES_DIR', tmp_path / 'profiles')
    monkeypatch.setattr(persona, 'PROFILES_DIR', tmp_path / 'profiles')
    monkeypatch.setattr(ap, 'JOBS_DIR', tmp_path / 'jobs')
    monkeypatch.setattr(ap, 'dispatch', lambda identifier: None)
    monkeypatch.setattr(ap.runtime, 'active_profile', lambda: {'model': 'test-model', 'reasoning_effort': 'low'})
    config = tmp_path / 'config.json'
    config.write_text('{"agents":{},"plugins":{}}', encoding='utf-8')
    monkeypatch.setattr(ap.runtime, 'CONFIG_FILE', config)
    monkeypatch.setattr(ap.runtime, 'STATE', tmp_path / 'state')
    monkeypatch.setattr(ap.research, 'get_source', lambda identifier: {'id': identifier, 'state': 'saved', 'content': '主页1488，成长权益1486；口径冲突', 'method': 'manual', 'url': 'https://example.com/account', 'captured_at': 123})
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def model(monkeypatch, reply=None, code=0):
    reply = reply or {'evidence_ids': ['a'], 'sample_scope': '一份人工现场记录[a]，没有逐篇内容', **{key: '待检验推断[a]，缺数据不能断言' for key in ap.SECTIONS}}
    calls = []
    monkeypatch.setattr(ap.runtime, 'openclaw_command', lambda: ['openclaw'])
    def run(command, timeout, isolated=False):
        assert isolated
        assert command[command.index('--agent') + 1] == 'account-diagnosis'
        prompt = command[command.index('--message') + 1]
        assert '建议定位：' in prompt and '每个附1个' in prompt
        assert '开头、正文结构、语气、结尾规则' in prompt
        assert '3条有先后顺序的行动' in prompt and '观察什么反馈' in prompt
        assert '不把输入5篇冒充复核20选5' in prompt
        calls.append(command)
        config = json.loads(ap.runtime.CONFIG_FILE.read_text(encoding='utf-8'))
        assert config['agents']['entries']['account-diagnosis']['tools']['allow'] == ['session_status']
        return SimpleNamespace(returncode=code, stdout=json.dumps({'payloads': [{'text': json.dumps(reply)}]}), stderr='test model failure' if code else '')
    monkeypatch.setattr(ap.runtime, 'run_agent_command', run)
    return calls


def test_evidence_review_reanalysis_and_account_scope(setup, monkeypatch):
    response = setup.post('/api/account-profile/build', json={'name': '甲', 'source_ids': ['a'], 'intent': '用户目标'})
    assert response.status_code == 202
    job = response.json()
    initial = ap.read_profile('甲')
    assert initial['active']['version'] == 0
    assert '1488' in initial['evidence'][0]['content'] and '1486' in initial['evidence'][0]['content']
    assert initial['user_input'] == {'intent': '用户目标'}
    assert '尚未确认' in persona.persona_prefix('甲')
    calls = model(monkeypatch)
    ap.analyze_job(job['job_id'])
    assert ap.read_job(job['job_id'])['status'] == 'succeeded'
    assert ap.read_profile('甲')['active']['content'] == ''
    assert ap.read_profile('甲')['suggestion']['evidence_ids'] == ['a']
    result = setup.put('/api/account-profile/甲/active', json={'content': '用户修改：只讲证据边界', 'expected_version': 0})
    assert result.status_code == 200 and result.json()['version'] == 1
    assert setup.put('/api/account-profile/甲/active', json={'content': '旧版本覆盖', 'expected_version': 0}).status_code == 409
    second = ap.start_analysis('甲')
    ap.analyze_job(second['job_id'])
    assert ap.read_profile('甲')['active']['content'] == '用户修改：只讲证据边界'
    assert second['session_id'] != job['session_id']
    ap.build('乙', ['a'])
    ap.save_active('乙', '乙的不同风格', 0)
    prefix = persona.persona_prefix('甲')
    assert '用户修改' in prefix and '乙的不同风格' not in prefix and 'version' in prefix
    assert persona.load_profile_text('甲') == '用户修改：只讲证据边界'
    assert '--session-key' in calls[0] and '--model' in calls[0]
    assert ap.read_profile('甲')['revisions'][0]['version'] == 0
    third = ap.start_analysis('甲')
    model(monkeypatch, code=9)
    ap.analyze_job(third['job_id'])
    assert ap.read_job(third['job_id'])['status'] == 'failed'
    assert ap.read_profile('甲')['active']['content'] == '用户修改：只讲证据边界'
    assert ap.read_profile('甲')['suggestion']['job_id'] == second['job_id']


@pytest.mark.parametrize('reply,code', [({'evidence_ids': ['forged']}, 0), ({'evidence_ids': ['a']}, 0), ({}, 7)])
def test_failure_never_activates_or_claims_success(setup, monkeypatch, reply, code):
    job = ap.build('失败账号', ['a'])
    model(monkeypatch, reply, code)
    ap.analyze_job(job['job_id'])
    assert ap.read_job(job['job_id'])['status'] == 'failed'
    assert ap.read_job(job['job_id'])['error']
    profile = ap.read_profile('失败账号')
    assert profile['suggestion'] is None and profile['active']['version'] == 0


def test_inputs_and_existing_profiles(setup, monkeypatch):
    for name in ('../escape', 'CON', 'a/b', 'a\\b', 'trail.', '_internal'):
        assert setup.post('/api/account-profile/build', json={'name': name, 'source_ids': ['a']}).status_code == 422
    assert setup.post('/api/account-profile/build', json={'name': 'empty', 'source_ids': []}).status_code == 422
    monkeypatch.setattr(ap.research, 'get_source', lambda identifier: {'state': 'error', 'content': ''})
    assert setup.post('/api/account-profile/build', json={'name': 'bad', 'source_ids': ['a']}).status_code == 422
    assert not (ap.PROFILES_DIR / 'bad').exists()


def test_old_profile_compatible(setup):
    folder = ap.PROFILES_DIR / '旧画像'
    folder.mkdir(parents=True)
    (folder / 'identity.md').write_text('旧身份', encoding='utf-8')
    assert persona.load_profile_text('旧画像') == '旧身份'
    assert '旧画像' in persona.persona_prefix('旧画像')
    assert setup.post('/api/account-profile/build', json={'name': '旧画像', 'source_ids': ['a']}).status_code == 409


def test_interrupted_job_can_retry(setup):
    job = ap.build('重启账号', ['a'])
    job['owner_created_at'] = 0
    ap.write_json(ap.JOBS_DIR / (job['job_id'] + '.json'), job)
    assert ap.read_job(job['job_id'])['status'] == 'failed'
    assert ap.start_analysis('重启账号')['job_id'] != job['job_id']


def test_failure_details_redact_config_credentials():
    text = ap.safe_failure('bad option --message token=secret123 Bearer abc123 https://host/path?q=private', {'gateway': {'token': 'secret123'}})
    assert 'bad option --message' in text
    assert 'secret123' not in text and 'abc123' not in text and 'private' not in text


def test_dedicated_policy_preserves_main_and_global(setup):
    config = {'agents': {'defaults': {'model': {'primary': 'unchanged'}}, 'entries': {'main': {'tools': {'allow': ['read', 'write']}}}}, 'tools': {'profile': 'coding'}}
    ap.runtime.CONFIG_FILE.write_text(json.dumps(config), encoding='utf-8')
    updated = ap.ensure_diagnosis_agent()
    assert updated['tools'] == config['tools']
    assert updated['agents']['entries']['main']['tools'] == config['agents']['entries']['main']['tools']
    assert updated['agents']['defaults'] == config['agents']['defaults']
    assert updated['agents']['entries']['account-diagnosis']['skills'] == []
    first = ap.runtime.CONFIG_FILE.read_bytes()
    ap.ensure_diagnosis_agent()
    assert ap.runtime.CONFIG_FILE.read_bytes() == first


def test_explicit_fleet_pins_main_output_root(setup, tmp_path):
    workspace = str(tmp_path / 'existing-workspace')
    config = {'agents': {'defaults': {'workspace': workspace}, 'entries': {'main': {}}}}
    ap.runtime.CONFIG_FILE.write_text(json.dumps(config), encoding='utf-8')
    updated = ap.ensure_diagnosis_agent()
    main = updated['agents']['entries']['main']
    assert main['workspace'] == workspace and main['cwd'] == workspace
    assert str(ap.runtime.STATE / 'account-diagnosis-workspace') == updated['agents']['entries']['account-diagnosis']['workspace']
    assert main['workspace'] != str(tmp_path / 'existing-workspace' / 'main')


def test_account_profile_disables_legacy_files_but_old_mode_works(setup, monkeypatch):
    import asyncio
    import web.app as web
    from fastapi import HTTPException
    monkeypatch.setattr(web, 'PROFILES_DIR', ap.PROFILES_DIR)
    ap.build('新账号', ['a'])
    assert asyncio.run(web.api_persona_files('新账号'))['files'] == []
    with pytest.raises(HTTPException) as failure:
        asyncio.run(web.api_persona_file_save('新账号', web.PersonaFileRequest(filename='identity.md', content='不会生效的旧稿')))
    assert failure.value.status_code == 409
    assert not (ap.PROFILES_DIR / '新账号' / 'identity.md').exists()
    old = ap.PROFILES_DIR / '旧账号'
    old.mkdir()
    assert len(asyncio.run(web.api_persona_files('旧账号'))['files']) == 6
    assert asyncio.run(web.api_persona_file_save('旧账号', web.PersonaFileRequest(filename='identity.md', content='旧模式生效')))['ok']
    assert persona.load_profile_text('旧账号') == '旧模式生效'


def test_turn_records_same_snapshot_after_profile_changes(setup, monkeypatch, tmp_path):
    import hashlib
    import web.app as web
    ap.build('创作账号', ['a'])
    ap.save_active('创作账号', '首版写作规则', 0)
    context = {}
    message = web._chat_message(web.ChatRequest(message='写一篇', persona='创作账号'), context)
    ap.save_active('创作账号', '更新后的规则', 1)
    monkeypatch.setattr(web, 'SESSIONS_DIR', tmp_path / 'sessions')
    for status in ('running', 'done'):
        web._save_turn('web:test', status, '', {'turn_id': 'one', **context})
        result = json.loads(web._turn_file('web:test').read_text(encoding='utf-8'))
        assert result['account_profile'] == {'name': '创作账号', 'version': 1, 'sha256': hashlib.sha256('首版写作规则'.encode()).hexdigest(), 'confirmed': True}
    assert '首版写作规则' in message and '更新后的规则' not in message


def test_isolated_timeout_never_stops_gateway(monkeypatch):
    import subprocess
    from easel import services
    calls = []
    class Process:
        pid = 123
        def communicate(self, timeout):
            if not calls:
                raise RuntimeError('test interruption')
            return '', ''
    monkeypatch.setattr(ap.runtime, 'require_subscription', lambda: None)
    monkeypatch.setattr(ap.runtime.subprocess, 'Popen', lambda *a, **k: Process())
    monkeypatch.setattr(ap.runtime.psutil if hasattr(ap.runtime, 'psutil') else ap.psutil, 'Process', lambda *a: 'owned-process')
    monkeypatch.setattr(services, 'stop_tree', lambda p: calls.append(('tree', p)))
    monkeypatch.setattr(services, 'stop', lambda p: calls.append(('service', p)))
    monkeypatch.setattr(ap.runtime, 'abort_session', lambda p: calls.append(('abort', p)))
    with pytest.raises(RuntimeError, match='test interruption'):
        ap.runtime.run_agent_command(['agent', 'exec'], 10, isolated=True)
    assert calls == [('tree', 'owned-process')]
