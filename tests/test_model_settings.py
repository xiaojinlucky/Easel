import hashlib
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "web"))

from easel.model_runtime import default_settings


class DefaultSettingsTests(unittest.TestCase):
    def test_default_is_luna_low(self):
        settings = default_settings()
        self.assertEqual(settings["profiles"][0]["model"], "gpt-5.6-luna")
        self.assertEqual(settings["profiles"][0]["reasoning_effort"], "low")


class ModelSettingsApiTests(unittest.TestCase):
    def setUp(self):
        from easel import model_settings_api as settings
        from fastapi.testclient import TestClient
        import app as web

        self.settings = settings
        tmp = Path(tempfile.mkdtemp())
        self.profile = {"id": "daily", "name": "日常创作", "model": "model-a", "reasoning_effort": "high"}
        self.old = {
            "active_id": "daily",
            "profiles": [self.profile],
            "verified_fingerprint": hashlib.sha256(b"model-a").hexdigest(),
            "last_test": {"ok": True, "model": "model-a", "reasoning_effort": "high", "tested_at": 123, "latency_seconds": 1},
        }
        config = tmp / "openclaw.json"
        config.write_text("{}", encoding="utf-8")
        settings.CONFIG_FILE = config
        settings.SETTINGS_FILE = tmp / "settings.json"
        settings.read_settings = lambda: self.old
        settings._tested = {}
        settings.model_catalog = lambda: [
            {"model": name, "supportedReasoningEfforts": [{"reasoningEffort": effort} for effort in ["low", "high"]]}
            for name in ["model-a", "model-b"]
        ]
        settings.apply_openclaw_models = lambda payload: None
        # 后端有写请求的 Origin 守卫（local_write_guard）：不带本机 Origin 的 POST 会先吃 403，
        # 到不了模型校验逻辑。用本机 7870 的 Origin 建客户端，测的是校验本身。
        self.client = TestClient(web.app, base_url='http://127.0.0.1:7870',
                                 headers={'Origin': 'http://127.0.0.1:7870'})

    def test_effort_change_reuses_verification(self):
        response = self.client.post("/api/model-settings", json={"active_id": "daily", "profiles": [{**self.profile, "reasoning_effort": "low"}]})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["profiles"][0]["reasoning_effort"], "low")
        self.assertEqual(response.json()["last_test"], self.old["last_test"])

    def test_effort_change_without_probe_if_model_already_saved(self):
        self.old.pop("verified_fingerprint")
        self.old.pop("last_test")
        response = self.client.post("/api/model-settings", json={"active_id": "daily", "profiles": [{**self.profile, "reasoning_effort": "low"}]})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["profiles"][0]["reasoning_effort"], "low")

    def test_different_model_still_requires_test(self):
        response = self.client.post("/api/model-settings", json={"active_id": "daily", "profiles": [{**self.profile, "model": "model-b"}]})
        self.assertEqual(response.status_code, 409)

    def test_unsupported_effort_still_rejected(self):
        response = self.client.post("/api/model-settings", json={"active_id": "daily", "profiles": [{**self.profile, "reasoning_effort": "invalid"}]})
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
