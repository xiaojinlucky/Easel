import pytest
from fastapi.testclient import TestClient
from web import app as web
from easel import postiz


@pytest.mark.parametrize('directory', ['_sessions', '_debug', '_profile_build', '_login', '_inbox', 'analytics', '.private'])
def test_system_files_cannot_be_read_deleted_or_sent(monkeypatch, tmp_path, directory):
    monkeypatch.setattr(web, 'OUTPUTS_DIR', tmp_path)
    monkeypatch.setattr(postiz, 'upload', lambda *_: pytest.fail('Protected file reached Postiz'))
    folder = tmp_path / directory
    folder.mkdir()
    file = folder / 'record.png'
    file.write_bytes(b'private system data')
    origin = {'Origin': 'http://127.0.0.1:7860'}
    with TestClient(web.app, base_url='http://127.0.0.1:7860') as client:
        assert client.get(f'/api/output/{directory}/record.png').status_code == 403
        assert client.get(f'/api/media/{directory}/record.png').status_code == 403
        assert client.delete(f'/api/output/{directory}', headers=origin).status_code == 403
        assert client.post('/api/publishing/postiz/media', json={'path': f'{directory}/record.png'}, headers=origin).status_code == 403
    assert file.read_bytes() == b'private system data'


def test_project_deliverables_remain_available(monkeypatch, tmp_path):
    monkeypatch.setattr(web, 'OUTPUTS_DIR', tmp_path)
    folder = tmp_path / 'project'
    folder.mkdir()
    file = folder / 'card.png'
    file.write_bytes(b'public deliverable')
    monkeypatch.setattr(postiz, 'upload', lambda path: {'uploaded': path.name})
    origin = {'Origin': 'http://127.0.0.1:7860'}
    with TestClient(web.app, base_url='http://127.0.0.1:7860') as client:
        assert client.get('/api/output/project/card.png').status_code == 200
        assert client.get('/api/media/project/card.png').content == b'public deliverable'
        assert client.post('/api/publishing/postiz/media', json={'path': 'project/card.png'}, headers=origin).json() == {'uploaded': 'card.png'}
        assert client.delete('/api/output/project', headers=origin).status_code == 200
    assert not folder.exists()
