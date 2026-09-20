# 07 · 验收记录：阶段 0/1/2 交付清单与复核方式（worktree 内，未合主树）

> 分支 `research/beav-kb-parity`，worktree `F:\科研大师兄\自媒体工作台\Easel-beav-kb`。
> 每阶段一个提交，等你点头后才 cherry-pick 回 `Easel-official`；本文件只记录已经落盘的东西和**怎么自己验**。
> 三档分开写：**已验证事实**（跑过命令、有期望值）、**推断**（读代码得出、没跑）、**未做**（明确不在本轮范围）。

## 提交对应关系

| 阶段 | 提交 | 内容 |
|---|---|---|
| 调研 | `9fa8dd7` | 六份材料（01–06） |
| 阶段 0 | `e6bfb0b` | 摘 Beav 云回连/遥测、`.runtime` 入库防护、rapidocr+yt-dlp 进依赖、端口统一 7870、NOTICE 重写 |
| 阶段 1A | `65fdac9` | 宿主协议：回执、`operationId` 幂等、`data:` 图落盘、kind/平台归一化、真实 `desktop.health`/`desktop.context` |
| 阶段 1B+1C | `ac809cb` | 素材库治理：分页/筛选/kindCounts、jieba+FTS5 全文检索（LIKE 兜底）、标签/置顶/摘要、回收站+30 天清理、治理路由、前端治理面 |
| 阶段 2 | 本提交 | AI 打标/摘要队列、OCR 批量回填、视频字幕/Whisper 转写、Beav 目录式导出（folder/json/csv）、宿主入库自动投递加工任务 |

## 已验证事实（可复制复核）

环境：worktree 没有自带虚拟环境，测试借用主项目 venv。工作目录切到 worktree 根。

```bash
cd "F:/科研大师兄/自媒体工作台/Easel-beav-kb"
PY="F:/科研大师兄/自媒体工作台/Easel/.venv/Scripts/python.exe"
"$PY" -m pytest -q                 # 期望：3 failed, 240 passed, 5 skipped
"$PY" -m pytest tests/test_research_enrich.py -q   # 期望：8 passed
```

`tests/test_core.py` 里那 3 个失败（`test_write_baseline_profile`、
`test_persona_skill_prioritizes_positioning_and_caps_cross_niche_scores`、
`test_job_events_resume_after_event_id`）**在主树同样失败**——已在 `Easel-official` 上跑过同文件比对，
属于基线问题，不是这条线引入的。

调研线各测试文件通过数：宿主 15 / 治理 6 / 治理路由 2 / 导出+OCR 4 / 加工队列 8 / 扩展安全 6 = 41 条。

前端（worktree 里 `npm ci` 后）：

```bash
cd web/frontend && npm run build   # 期望：tsc 无错，vite 产出 ~459KB 单 JS，dist 被 gitignore
```

阶段 2 具体已测行为：

- 打标提示词把素材包成 `UNTRUSTED_REFERENCE`，素材内指令不会被当指令；模型返回的标签/摘要写回库，且进全文索引（能用标签词搜到）。
- 失败重试：模型通道不可用（返回以 `⏳/⏱️/❌` 开头）→ 任务回到 `pending`，三次后 `failed`，`index-status` 里 `enrich_failed` 计数可见，素材摘要保持为空（不会写坏数据）。
- 幂等：同一素材同一任务只留一行，重复点按钮不会堆队列；`enqueue_missing_enrich` 只补没有摘要的存量。
- 进程被杀留下的 `running` 僵尸行，超过 30 分钟（`STALE_RUNNING_AFTER`）重新可领。
- 宿主侧：`created/updated` 入库后自动投递 `enrich`，带 `options.transcribe` 的视频再投递 `transcribe`；投递失败只记日志，**不影响入库回执**。
- 导出：`knowledge/<site>/<id>/meta.json + content.md`（Obsidian 可直接吃）、CSV 带 BOM、JSON 批量；格式非法报 422。

顺带修掉一个阶段 1C 引入的前端回归：`api()` 支持 PATCH/DELETE 时把默认方法写死成 GET，导致
`/capture`、`/reindex`、`/export` 这类没显式传方法的调用变成 GET。现在按「有没有 body」推默认方法（有 body 即 POST）。

## 推断（读了代码，没跑起来）

- 模型通道复用工作台进程内的 `run_agent_sync`（`web/app.py`）：`_agent_runner()` 只从已加载的
  `app` / `__main__` / `web.app` 模块取函数，取不到就明确报错——刻意不回退到 `import app`，
  那会把整份 FastAPI 模块再执行一遍。因此**打标必须在 Easel Web 后端进程内跑**；
  从别的进程（如 Native Host）触发的任务会以 `failed` + 这条中文原因显示出来。
- Whisper 走 CPU + int8（`EASEL_WHISPER_MODEL`，默认 `small`），首次要下模型；没字幕的视频才会走到它。

## 未做 / 未验证（别当成已通过）

- 没有跑过一次真实的 yt-dlp 下载 + faster-whisper 转写（venv 里两个包都装了，但整条链需要联网+几分钟 GPU/CPU 时间）。
- 没有跑过一次真实的 OpenClaw 打标（要后端和订阅在线）；队列语义是用假模型验的。
- 没有在真 Chrome 里重装扩展做端到端（回执三态、`data:` 封面、视频地址不丢都是测试内模拟）。
- 语义检索/相似素材（阶段 3.1）、素材问答工具（3.2）、灵感漫步（3.4）：按计划留给 FTS 上线后看满意度。
- 博主订阅每日刷新（4.1）、账号档案（4.2）、browser-control 自动化（4.3）：未启动。
- 本 worktree 里 `/api/research/feeds/sync` 恒为 503：`easel/feeds.py` 在这条分支基线上就不存在，属既有缺口，不在 06 方案范围。
- 多 worktree 同时注册 Native Host 是否互相覆盖注册表键：未核实（合并时留意）。
