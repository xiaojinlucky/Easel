from types import SimpleNamespace

from easel import platform_services
from easel import services


def test_platform_status_requires_all_loopback_ports_and_keeps_owned_proxy_pids(monkeypatch):
    health = {4007: True, 8088: False, 8089: True}
    monkeypatch.setattr(platform_services, 'platform_health', lambda: health)
    monkeypatch.setattr(services, 'owned_processes', lambda name: [SimpleNamespace(pid=4321)] if name == 'platform-proxy' else [])

    result = platform_services.manage('status')

    assert result == {'service': 'platforms', 'healthy': False, 'ports': health, 'pids': [4321]}


def test_platform_status_is_healthy_only_when_postiz_temporal_and_freshrss_are_healthy(monkeypatch):
    health = {4007: True, 8088: True, 8089: True}
    monkeypatch.setattr(platform_services, 'platform_health', lambda: health)
    monkeypatch.setattr(services, 'owned_processes', lambda _name: [])

    assert platform_services.manage('status')['healthy'] is True
