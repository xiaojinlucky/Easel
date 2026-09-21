import asyncio
import json
import pytest
from fastapi import HTTPException
from web import wechat_monitor_api as monitor


def test_missing_monitor_credentials_are_not_invented(monkeypatch, tmp_path):
    monkeypatch.setattr(monitor, 'STATE', tmp_path)
    with pytest.raises(HTTPException) as error:
        asyncio.run(monitor.local_credentials())
    assert error.value.status_code == 503


def test_credentials_require_explicit_action_and_are_not_cached(monkeypatch, tmp_path):
    monkeypatch.setattr(monitor, 'STATE', tmp_path)
    (tmp_path / 'postiz.env').write_text('WERSS_ADMIN_PASSWORD=test-password\n', encoding='utf-8')
    response = asyncio.run(monitor.local_credentials())
    assert json.loads(response.body) == {'username': 'easel', 'password': 'test-password'}
    assert response.headers['cache-control'] == 'no-store'
