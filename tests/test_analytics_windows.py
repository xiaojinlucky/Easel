import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "skills" / "shared" / "scripts"


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class AnalyticsWindowTests(unittest.TestCase):
    def test_account_stats_records_new_day_even_if_numbers_same(self):
        stats = load("account_stats", ROOT / "account_stats.py")
        day = 100 * 86400
        last = [{"ts": day, "followers": 4, "likes": 11, "posts": None}]
        self.assertFalse(stats.should_record(last, {"ts": day + 3600, "followers": 4, "likes": 11, "posts": None}))
        self.assertTrue(stats.should_record(last, {"ts": day + 86400, "followers": 4, "likes": 11, "posts": None}))

    def test_weixin_does_not_put_reads_into_likes(self):
        wx = load("weixin_mp_stats", ROOT / "weixin_mp_stats.py")
        self.assertEqual(wx.cmd_selftest(), 0)

    def test_weixin_tendency_uses_daily_total_scene(self):
        wx = load("weixin_mp_stats", ROOT / "weixin_mp_stats.py")
        lst = [
            {"date": 1, "scene": 1, "read_uv": 9, "share_uv": 9},
            {"date": 1, "scene": 9999, "read_uv": 3, "share_uv": 1},
            {"date": 2, "scene": 9999, "read_uv": 4, "share_uv": 0},
        ]
        daily = wx._daily_totals(lst)
        self.assertEqual([x["read_uv"] for x in daily], [3, 4])
        self.assertEqual(wx._tendency_metrics(daily, 1)[0]["value"], 4)

    def test_xhs_notes_exclude_drafts(self):
        stats = load("account_stats", ROOT / "account_stats.py")
        self.assertTrue(stats.is_public_xhs_note({"title": "GPT6 两小时速通课题答辩PPT"}))
        self.assertFalse(stats.is_public_xhs_note({"title": "无笔记标题"}))
        self.assertFalse(stats.is_public_xhs_note({"title": "(无标题)"}))
        self.assertFalse(stats.is_public_xhs_note({"title": "还没写完", "text": "草稿 编辑"}))
        self.assertFalse(stats.is_public_xhs_note({
            "title": "有标题草稿",
            "href": "https://creator.xiaohongshu.com/publish/publish?id=1",
        }))


if __name__ == "__main__":
    unittest.main()
