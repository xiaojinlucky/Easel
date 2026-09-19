"""Configure the isolated Easel profile without touching other applications."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from easel.runtime import read_settings, write_json, SETTINGS_FILE, CONFIG_FILE, PROFILE, model_catalog

config_path = CONFIG_FILE
config = json.loads(config_path.read_text(encoding='utf-8')) if config_path.exists() else {}
workspace = Path.home() / '.openclaw/workspace-easel'
workspace.mkdir(parents=True, exist_ok=True)
settings = read_settings()
active = next(p for p in settings['profiles'] if p['id'] == settings['active_id'])
defaults = config.setdefault('agents', {}).setdefault('defaults', {})
defaults.update({'workspace': str(workspace), 'model': {'primary': 'openai/' + active['model']}, 'timeoutSeconds': 7200})
defaults['heartbeat'] = {'every': '0m'}
models = [entry['id'] for entry in model_catalog()]
for model in models:
    defaults.setdefault('models', {})['openai/' + model] = {'agentRuntime': {'id': 'codex'}}
defaults['modelPolicy'] = {'allow': ['openai/' + model for model in models]}
config.setdefault('gateway', {}).update({'mode': 'local', 'bind': 'loopback', 'port': 18789, 'auth': {'mode': 'none'}})
config.setdefault('plugins', {}).setdefault('entries', {}).setdefault('codex', {}).update({'enabled': True, 'config': {'sessionCatalog': {'enabled': False}, 'appServer': {'defaultWorkspaceDir': str(ROOT)}}})
config['plugins']['entries'].setdefault('memory-core', {}).setdefault('config', {})['dreaming'] = {'enabled': False}
config['cron'] = {'enabled': False}
config['skills'] = {'load': {'extraDirs': [str(ROOT / 'skills/openclaw'), str(ROOT / 'skills/extensions')]}}
write_json(config_path, config)
write_json(SETTINGS_FILE, read_settings())
for source in (ROOT / 'openclaw/workspace').glob('*.md'):
    destination = workspace / source.name
    if not destination.exists():
        destination.write_text(source.read_text(encoding='utf-8'), encoding='utf-8')
context = '\n\n## 运行时项目根\n\n' + str(ROOT) + '\n使用项目 .venv 中的 Python。产物保存在项目 outputs/，画像保存在项目 profiles/。\n'
agent_file = workspace / 'AGENTS.md'
current = agent_file.read_text(encoding='utf-8')
if '## 运行时项目根' not in current:
    agent_file.write_text(current + context, encoding='utf-8')
if not (ROOT / '.env').exists():
    (ROOT / '.env').write_text('EASEL_AUTH_MODE=codex_subscription\nEASEL_THINKING_LEVEL=high\nOPENCLAW_PORT=18789\n', encoding='utf-8')
print('Easel isolated profile configured.')
