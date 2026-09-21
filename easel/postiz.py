"""Use the official Postiz CLI and API with this installation's local account."""
import json
import subprocess
import sys
import requests
from easel.runtime import ROOT, STATE, CREATE_FLAGS, runtime_env

API = 'http://localhost:4007/api/public/v1'


def client():
    path = STATE / 'postiz-account.json'
    key = json.loads(path.read_text(encoding='utf-8')).get('api_key') if path.is_file() else None
    if not key:
        raise RuntimeError('Postiz 本机 API 尚未配置，请完成本地账号初始化。')
    session = requests.Session()
    session.trust_env = False
    session.headers['Authorization'] = key
    return session


def upload(path):
    with client() as session, path.open('rb') as source:
        response = session.post(API + '/upload', files={'file': (path.name, source)}, timeout=90)
        response.raise_for_status()
        result = response.json()
    if not result.get('id') or not result.get('path'):
        raise RuntimeError('Postiz 未返回媒体回执。')
    return result


def main():
    args = sys.argv[1:]
    if args and args[0] in ('auth:login', 'auth:logout'):
        raise SystemExit('本安装使用独立的本地账号，请在 http://localhost:4007 登录。')
    with client() as session:
        if args == ['auth:status']:
            result = session.get(API + '/integrations', timeout=10)
            result.raise_for_status()
            print(json.dumps({'server': API, 'authenticated': True, 'channels': len(result.json())}))
            return
        env = runtime_env()
        cli_home = STATE / 'postiz-cli-home'
        cli_home.mkdir(exist_ok=True)
        # The upstream CLI prefers home-directory OAuth credentials over environment keys.
        env['USERPROFILE'] = str(cli_home)
        env['POSTIZ_API_KEY'] = session.headers['Authorization']
        env['POSTIZ_API_URL'] = 'http://localhost:4007/api'
        result = subprocess.run([str(STATE / 'node_modules/node/bin/node.exe'), str(STATE / 'node_modules/postiz/dist/index.js')] + args, env=env, cwd=ROOT, capture_output=True, text=True, encoding='utf-8', creationflags=CREATE_FLAGS)
        print(result.stdout.replace(env['POSTIZ_API_KEY'], '[redacted]'), end='')
        print(result.stderr.replace(env['POSTIZ_API_KEY'], '[redacted]'), file=sys.stderr, end='')
        raise SystemExit(result.returncode)


if __name__ == '__main__':
    main()
