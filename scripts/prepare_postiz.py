"""Adapt the official Postiz compose file for this local installation."""
import hashlib
import json
import secrets
import shutil
from pathlib import Path
import yaml

root = Path(__file__).resolve().parents[1]
source = root / '.runtime/vendor/postiz-docker-compose'
destination = root / 'deploy/postiz'
destination.mkdir(parents=True, exist_ok=True)
compose = yaml.safe_load((source / 'docker-compose.yaml').read_text(encoding='utf-8'))
compose['name'] = 'easel-postiz'
for service in compose['services'].values():
    service.pop('container_name', None)
    if service.get('restart') == 'always':
        service['restart'] = 'unless-stopped'
postiz = compose['services']['postiz']
postiz['ports'] = ['127.0.0.1:4007:5000']
postiz['volumes'].extend(f'./patches/initialize.sentry.js:/app/apps/{app}/dist/libraries/nestjs-libraries/src/sentry/initialize.sentry.js:ro' for app in ('backend', 'orchestrator'))
postiz['healthcheck'] = {'test': ['CMD', 'node', '-e', "Promise.all([5000,3000,3002].map(port=>new Promise((ok,no)=>{const r=require('http').get({hostname:'127.0.0.1',port,path:port===3002?'/health/status':'/'},res=>res.statusCode<500?ok():no());r.on('error',no);r.setTimeout(4000,()=>{r.destroy();no()})}))).then(()=>process.exit(0),()=>process.exit(1))"], 'interval': '30s', 'timeout': '10s', 'retries': 5, 'start_period': '120s'}
postiz['environment']['JWT_SECRET'] = '${POSTIZ_JWT_SECRET:?Run prepare_postiz.py}'
postiz['environment']['DATABASE_URL'] = 'postgresql://postiz-user:${POSTIZ_DB_PASSWORD:?Run prepare_postiz.py}@postiz-postgres:5432/postiz-db-local'
account_file = root / '.runtime/postiz-account.json'
if account_file.exists() and json.loads(account_file.read_text(encoding='utf-8')).get('registered'):
    postiz['environment']['DISABLE_REGISTRATION'] = 'true'
compose['services']['postiz-postgres']['environment']['POSTGRES_PASSWORD'] = '${POSTIZ_DB_PASSWORD}'
compose['services']['temporal-postgresql']['environment']['POSTGRES_PASSWORD'] = '${TEMPORAL_DB_PASSWORD}'
compose['services']['temporal']['environment'] = [item if not item.startswith('POSTGRES_PWD=') else 'POSTGRES_PWD=${TEMPORAL_DB_PASSWORD}' for item in compose['services']['temporal']['environment']]
compose['services']['temporal-ui']['ports'] = ['127.0.0.1:8088:8080']
compose['services']['temporal-ui']['environment'] = ['TEMPORAL_ADDRESS=temporal:7233', 'TEMPORAL_CORS_ORIGINS=http://localhost:8088']
compose['networks']['temporal-network'].pop('name', None)
compose['services']['freshrss'] = {
    'image': 'freshrss/freshrss:latest', 'restart': 'unless-stopped',
    'ports': ['127.0.0.1:8089:80'],
    'environment': {'TZ': 'Asia/Shanghai', 'CRON_MIN': '17',
        'FRESHRSS_INSTALL': '--api-enabled --base-url http://localhost:8089 --db-type sqlite --default-user easel --language zh-cn --title Easel订阅库',
        'FRESHRSS_USER': '--user easel --password ${FRESHRSS_ADMIN_PASSWORD} --api-password ${FRESHRSS_API_PASSWORD} --language zh-cn'},
    'volumes': ['freshrss-data:/var/www/FreshRSS/data', 'freshrss-extensions:/var/www/FreshRSS/extensions'],
    'networks': ['postiz-network'],
    'logging': {'driver': 'json-file', 'options': {'max-size': '10m', 'max-file': '2'}},
    'healthcheck': {'test': ['CMD', 'php', '-r', "exit(@file_get_contents('http://localhost/')===false ? 1 : 0);"], 'interval': '30s', 'timeout': '10s', 'retries': 5, 'start_period': '30s'},
}
compose['volumes'].update({'freshrss-data': {}, 'freshrss-extensions': {}})
# WeRSS uses its native per-task cron; configure hourly tasks after QR authorization.
compose['services']['werss'] = {'image': 'ghcr.io/rachelos/we-mp-rss@sha256:125472e8a58a05f02b930ba2b958575ffc87378743d9491383b13390f709215e',
 'restart': 'unless-stopped',
 'expose': [8001],
 'environment': {'DB': 'sqlite:////app/data/db.db',
                 'PORT': '8001',
                 'USERNAME': 'easel',
                 'PASSWORD': '${WERSS_ADMIN_PASSWORD:?Run prepare_postiz.py}',
                 'SECRET_KEY': '${WERSS_SECRET_KEY:?Run prepare_postiz.py}',
                 'ENABLE_JOB': 'True',
                 'WE_RSS.AUTH': 'False',
                 'ARTICLE_STATS_REFRESH_ENABLED': 'False',
                 'GATHER.CONTENT': 'False',
                 'GATHER.CONTENT_AUTO_CHECK': 'False',
                 'GATHER.MODEL': 'web',
                 'RSS_FULL_CONTEXT': 'False',
                 'RSS_ADD_COVER': 'False',
                 'MAX_PAGE': '1',
                 'SPAN_INTERVAL': '60',
                 'REDIS_SERVER_ENABLED': 'False',
                 'REDIS_URL': '',
                 'PROXY_ENABLED': 'False',
                 'DEBUG': 'False',
                 'AUTO_RELOAD': 'False',
                 'THREADS': '1'},
 'volumes': ['werss-data:/app/data', './patches/werss-main.py:/app/main.py:ro', './patches/werss-success.py:/app/driver/success.py:ro', './patches/werss-auth.py:/app/apis/auth.py:ro'],
 'networks': ['postiz-network'],
 'logging': {'driver': 'json-file', 'options': {'max-size': '10m', 'max-file': '2'}},
 'healthcheck': {'test': ['CMD',
                          'python3',
                          '-c',
                          'import urllib.request; '
                          "urllib.request.build_opener(urllib.request.ProxyHandler({})).open('http://127.0.0.1:8001/', "
                          'timeout=5).close()'],
                 'interval': '30s',
                 'timeout': '10s',
                 'retries': 5,
                 'start_period': '60s'},
 'platform': 'linux/amd64'}
compose['volumes']['werss-data'] = {}
# Keep the exact imported platform digest; updates require a fresh compatibility check.
lock_file = root / 'config/postiz-images.lock.json'
if lock_file.exists():
    for name, locked in json.loads(lock_file.read_text(encoding='utf-8')).items():
        compose['services'][name]['image'] = locked.get('local_image_id') or locked['image'].split('@')[0] + '@' + locked['digest']
(destination / 'compose.yaml').write_text('# Adapted from gitroomhq/postiz-docker-compose (AGPL-3.0); see UPSTREAM.json.\n' + yaml.safe_dump(compose, sort_keys=False), encoding='utf-8')
shutil.copytree(source / 'dynamicconfig', destination / 'dynamicconfig', dirs_exist_ok=True)
shutil.copy2(source / 'LICENSE', destination / 'LICENSE.upstream')
env_file = root / '.runtime/postiz.env'
if not env_file.exists():
    env_file.write_text('\n'.join(f'{key}={secrets.token_hex(32)}' for key in ('POSTIZ_JWT_SECRET', 'POSTIZ_DB_PASSWORD', 'TEMPORAL_DB_PASSWORD')) + '\n', encoding='utf-8')
existing = env_file.read_text(encoding='utf-8')
with env_file.open('a', encoding='utf-8') as output:
    for key in ('FRESHRSS_ADMIN_PASSWORD', 'FRESHRSS_API_PASSWORD', 'WERSS_ADMIN_PASSWORD', 'WERSS_SECRET_KEY'):
        if not any(line.startswith(key + '=') for line in existing.splitlines()):
            output.write(f'{key}={secrets.token_hex(24)}\n')
import subprocess
commit = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
(destination / 'UPSTREAM.json').write_text(json.dumps({'repository': 'https://github.com/gitroomhq/postiz-docker-compose', 'commit': commit, 'license': 'AGPL-3.0', 'source_sha256': hashlib.sha256((source / 'docker-compose.yaml').read_bytes()).hexdigest(), 'adaptations': ['Isolated compose project easel-postiz and named volumes', 'Windows loopback Caddy ports 4007, 8088, 8089 and 8090; generated WSL private-IP override', 'Generated local secrets; registration disabled after local bootstrap', 'Preserved upstream health dependencies and extended Postiz backend/orchestrator health check', 'Added isolated FreshRSS with hourly polling and authenticated Google Reader API', 'Immutable image IDs backed by registry digests in config/postiz-images.lock.json', 'Conditional Sentry import fix mounted read-only; see patches/PROVENANCE.json']}, indent=2) + '\n', encoding='utf-8')
print('Postiz compose prepared; secrets remain in .runtime/postiz.env.')
