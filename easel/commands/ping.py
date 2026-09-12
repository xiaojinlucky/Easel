"""Verify the configured subscription through the Web UI's guarded path."""
from easel.runtime import active_profile
from easel.services import healthy


def cmd_ping(_args) -> int:
    from web.settings_api import ModelProfile, run_probe
    if not healthy('gateway'):
        print('Gateway 未运行，请先启动工作台。')
        return 1
    try:
        result = run_probe(ModelProfile(**active_profile()))
        print(f"EASEL_READY · {result['model']} · {result['latency_seconds']} 秒")
        return 0
    except Exception as exc:
        print('连通性测试失败：' + str(exc))
        return 1
