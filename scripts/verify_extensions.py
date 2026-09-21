"""Verify vendored skill source hashes; refresh only after reviewing an update."""
import hashlib
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
lock_path = root / 'config/extensions.lock.json'
entries = json.loads(lock_path.read_text(encoding='utf-8'))
refresh = sys.argv[1:] == ['--refresh']
failures = []
for entry in entries:
    folder = root / entry['path']
    files = {path.relative_to(folder).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(folder.rglob('*')) if path.is_file() and not any(part in ('node_modules', '.git', '__pycache__', '.cache') for part in path.relative_to(folder).parts) and path.suffix not in ('.pyc', '.log', '.tmp')}
    if refresh:
        entry['sha256'] = files['SKILL.md']
        entry['hash_scope'] = 'sha256: SKILL.md; source_files: vendored files excluding dependency/cache directories'
        entry['source_files'] = files
    elif entry.get('source_files') != files or entry['sha256'] != files['SKILL.md']:
        failures.append(entry['name'])
if refresh:
    lock_path.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
if failures:
    raise SystemExit('Source hashes differ: ' + ', '.join(failures))
print(f'{len(entries)} extensions: ' + ('hash manifest refreshed' if refresh else 'source hashes verified'))
