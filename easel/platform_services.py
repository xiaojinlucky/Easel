"""Compose upstream publishing/feed services with a Windows loopback Caddy proxy."""
import ipaddress
import re
import subprocess
import urllib.request
from easel.runtime import ROOT, STATE, CREATE_FLAGS

PORTS = (4007, 8088, 8089, 8090)
WSL = ['wsl', '-d', 'Ubuntu-24.04', '-u', 'root', '--exec']


def wsl_path(path):
    return '/mnt/' + path.drive[0].lower() + path.as_posix()[2:]


def compose_command():
    return WSL + ['/usr/bin/docker', '--host', 'unix:///var/run/docker.sock', 'compose', '--env-file', wsl_path(STATE / 'postiz.env'), '-f', wsl_path(ROOT / 'deploy/postiz/compose.yaml'), '-f', wsl_path(STATE / 'postiz-bind.yaml')]


def port_health(port):
    try:
        with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(f'http://127.0.0.1:{port}/', timeout=2) as response:
            return response.status == 200
    except OSError:
        return False


def platform_health():
    return {port: port_health(port) for port in PORTS}


def manage(action):
    from easel.services import start, stop, healthy, owned_processes
    if action == 'status':
        ports = platform_health()
        return {'service': 'platforms', 'healthy': all(ports.values()), 'ports': ports, 'pids': [p.pid for p in owned_processes('platform-proxy')]}
    logs = STATE / 'logs'
    logs.mkdir(parents=True, exist_ok=True)
    if action == 'start':
        start('wsl-runtime')
        result = subprocess.run(WSL + ['ip', '-4', '-o', 'addr', 'show', 'eth0'], capture_output=True, check=True, timeout=30, creationflags=CREATE_FLAGS)
        match = re.search(rb'inet ([0-9.]+)/', result.stdout)
        if not match or not ipaddress.ip_address(match[1].decode()).is_private:
            raise RuntimeError('未取得 WSL 私有地址。')
        address = match[1].decode()
        override = STATE / 'postiz-bind.yaml'
        services = {'postiz': (4007,5000), 'temporal-ui': (8088,8080), 'freshrss': (8089,80), 'werss': (8090,8001)}
        override.write_text('services:\n' + ''.join(f'  {name}:\n    ports: !override\n      - "{address}:{host}:{container}"\n' for name,(host,container) in services.items()), encoding='utf-8')
        proxy = STATE / 'Caddyfile'
        content = '{\n  admin off\n  auto_https off\n}\n' + ''.join(f':{port} {{\n  bind 127.0.0.1\n  reverse_proxy {address}:{port}\n}}\n' for port in PORTS)
        if not proxy.exists() or proxy.read_text(encoding='utf-8') != content:
            stop('platform-proxy')
            proxy.write_text(content, encoding='utf-8')
        with (logs / 'platforms.log').open('ab') as log:
            result = subprocess.run(compose_command() + ['up', '-d', '--pull', 'never', '--wait', '--wait-timeout', '300'], stdout=log, stderr=log, creationflags=CREATE_FLAGS, timeout=420)
        if result.returncode:
            raise RuntimeError('发布 / 订阅服务未就绪，请查看 .runtime/logs/platforms.log。')
        start('platform-proxy')
        return {'service':'platforms','status':'running','urls':['http://localhost:4007/','http://localhost:8089/','http://localhost:8090/']}
    if action == 'stop':
        stop('platform-proxy')
        with (logs / 'platforms.log').open('ab') as log:
            subprocess.run(compose_command() + ['stop'], stdout=log, stderr=log, check=True, timeout=120, creationflags=CREATE_FLAGS)
        stop('wsl-runtime')
        return {'service':'platforms','status':'stopped'}
    raise ValueError('Use start, stop or status')
