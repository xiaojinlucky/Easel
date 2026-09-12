import hashlib
import json
import pytest
from fastapi.testclient import TestClient
from web import settings_api as settings
from web.app import app


@pytest.fixture
def model_settings(monkeypatch, tmp_path):
    profile = {'id': 'full', 'name': '完整创作', 'model': 'model-a', 'reasoning_effort': 'high'}
    old = {'active_id': 'full', 'profiles': [profile], 'verified_fingerprint': hashlib.sha256(b'model-a:high').hexdigest(), 'last_test': {'ok': True, 'model': 'model-a', 'reasoning_effort': 'high', 'tested_at': 123, 'latency_seconds': 1}}
    config = tmp_path / 'config.json'
    config.write_text('{}', encoding='utf-8')
    monkeypatch.setattr(settings, 'CONFIG_FILE', config)
    monkeypatch.setattr(settings, 'SETTINGS_FILE', tmp_path / 'settings.json')
    monkeypatch.setattr(settings, 'read_settings', lambda: old)
    monkeypatch.setattr(settings, '_tested', {})
    monkeypatch.setattr(settings, 'model_catalog', lambda: [{'model': m, 'supportedReasoningEfforts': [{'reasoningEffort': e} for e in ['low', 'high']]} for m in ['model-a', 'model-b']])
    monkeypatch.setattr(settings, 'run_agent_command', lambda *a, **k: pytest.fail('保存配置不应调用模型'))
    return TestClient(app, base_url='http://127.0.0.1:7860'), profile, old


def test_effort_change_reuses_legacy_model_verification(model_settings):
    client, profile, old = model_settings
    response = client.post('/api/model-settings', json={'active_id': 'full', 'profiles': [{**profile, 'reasoning_effort': 'low'}]})
    assert response.status_code == 200, response.text
    assert response.json()['profiles'][0]['reasoning_effort'] == 'low'
    assert response.json()['last_test'] == old['last_test']  # 不伪造一次新测试


def test_different_model_still_requires_test(model_settings):
    client, profile, _ = model_settings
    response = client.post('/api/model-settings', json={'active_id': 'full', 'profiles': [{**profile, 'model': 'model-b'}]})
    assert response.status_code == 409


def test_unsupported_effort_still_rejected(model_settings):
    client, profile, _ = model_settings
    response = client.post('/api/model-settings', json={'active_id': 'full', 'profiles': [{**profile, 'reasoning_effort': 'invalid'}]})
    assert response.status_code == 422


def test_new_model_probe_covers_its_other_supported_efforts(model_settings):
    client, profile, _ = model_settings
    tested = settings.ModelProfile(**{**profile, 'model': 'model-b'})
    settings._tested[settings.fingerprint(tested)] = {'ok': True, 'model': 'model-b', 'reasoning_effort': 'high', 'tested_at': 456}
    response = client.post('/api/model-settings', json={'active_id': 'full', 'profiles': [{**profile, 'model': 'model-b', 'reasoning_effort': 'low'}]})
    assert response.status_code == 200
    assert response.json()['last_test']['tested_at'] == 456
