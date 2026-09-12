"""Check a private Easel backup without restoring or overwriting any data."""
import hashlib
import json
import sys
import tarfile
import zipfile
from pathlib import Path, PurePosixPath

def check(folder):
    manifest = json.loads((folder / 'manifest.json').read_text(encoding='utf-8'))
    expected = {'easel-data.zip', 'platform-volumes.tar.gz', 'research.sqlite'}
    if set(manifest['files']) != expected:
        raise ValueError('Unexpected backup file list')
    for name, info in manifest['files'].items():
        path = folder / name
        with path.open('rb') as source:
            if path.stat().st_size != info['bytes'] or hashlib.file_digest(source, 'sha256').hexdigest() != info['sha256']:
                raise ValueError('Backup checksum differs: ' + name)
    with zipfile.ZipFile(folder / 'easel-data.zip') as archive:
        if archive.testzip() is not None:
            raise ValueError('ZIP is damaged')
        if any(PurePosixPath(name).is_absolute() or '..' in PurePosixPath(name).parts or ':' in name for name in archive.namelist()):
            raise ValueError('Unsafe ZIP member')
    with tarfile.open(folder / 'platform-volumes.tar.gz', 'r:gz') as archive:
        for member in archive:
            path = PurePosixPath(member.name)
            if path.is_absolute() or '..' in path.parts or len(path.parts) < 2 or path.parts[0] not in manifest['volumes'] or path.parts[1] != '_data' or not (member.isfile() or member.isdir()):
                raise ValueError('Unexpected TAR member: ' + member.name)
            if member.isfile():
                with archive.extractfile(member) as source:
                    while source.read(1024 * 1024):
                        pass
    return manifest

if __name__ == '__main__':
    folder = Path(sys.argv[1]).resolve(strict=True)
    result = check(folder)
    print('PASS: checksums, ZIP CRC, complete TAR reads and safe member paths;', len(result['volumes']), 'platform volumes')
