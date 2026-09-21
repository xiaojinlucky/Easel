"""Keep this stack's WSL foreground input open for the lifetime of its owner."""
import subprocess
from easel.platform_services import WSL, wsl_path
from easel.runtime import ROOT, CREATE_FLAGS

if __name__ == '__main__':
    process = subprocess.Popen(WSL + ['/bin/sh', wsl_path(ROOT / 'deploy/postiz/keepalive.sh')], stdin=subprocess.PIPE, creationflags=CREATE_FLAGS)
    try:
        raise SystemExit(process.wait())
    finally:
        process.stdin.close()
        if process.poll() is None:
            process.terminate()
