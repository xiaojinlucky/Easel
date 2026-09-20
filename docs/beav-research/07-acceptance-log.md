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
| 阶段 2 | `ac527af` 功能 + `49b1f78` 线程用例 + `d8d32ba` 修复轮一 + 本次修复轮二 | AI 打标/摘要队列、OCR 批量回填、视频字幕/Whisper 转写、Beav 目录式导出（folder/json/csv）、宿主入库自动投递加工任务；两轮对抗验收修复见下 |

## 已验证事实（可复制复核）

环境：worktree 没有自带虚拟环境，测试借用主项目 venv。工作目录切到 worktree 根。

```bash
cd "F:/科研大师兄/自媒体工作台/Easel-beav-kb"
PY="F:/科研大师兄/自媒体工作台/Easel/.venv/Scripts/python.exe"
"$PY" -m pytest -q                 # 期望：3 failed, 254 passed, 5 skipped
"$PY" -m pytest tests/test_research_enrich.py -q   # 期望：22 passed
```

`tests/test_core.py` 里那 3 个失败（`test_write_baseline_profile`、
`test_persona_skill_prioritizes_positioning_and_caps_cross_niche_scores`、
`test_job_events_resume_after_event_id`）**在主树同样失败**——已在 `Easel-official` 上跑过同文件比对，
属于基线问题，不是这条线引入的。

调研线各测试文件通过数：宿主 15 / 治理 6 / 治理路由 2 / 导出+OCR 4 / 加工队列 22 / 扩展安全 6 = 55 条。

前端（worktree 里 `npm ci` 后）：

```bash
cd web/frontend && npm run build   # 期望：tsc 无错，vite 产出 ~459KB 单 JS，dist 被 gitignore
```

阶段 2 具体已测行为：

- 打标提示词把素材包成 `UNTRUSTED_REFERENCE`，素材内指令不会被当指令；模型返回的标签/摘要写回库，且进全文索引（能用标签词搜到）。
- 失败重试分两类：**模型不配合**（返回不是 JSON、标签和摘要都空）按 `90s × 已试次数` 退避，三次后转 `failed`；
  **通道不可用**（工作台没起、CLI 超时、返回 `⏳/⏱️/❌/（无输出）`）退回 `pending` 不计次，通道恢复后自动补跑（修复轮二）。
  `index-status` 里 `enrich_pending`/`enrich_failed` 计数可见，素材摘要保持为空（不会写坏数据）。
- 幂等：同一素材同一任务只留一行，重复点按钮不会堆队列；`enqueue_missing_enrich` 只补没有摘要的存量。
- 进程被杀留下的 `running` 僵尸行，超过 30 分钟（`STALE_RUNNING_AFTER`）重新可领。
- 加工线程本体用假模型通道在进程内跑通：锁被占时 `start_worker()` 返回 False（不并发起第二个），
  守护线程把 pending 清到 `done` 后自行退出并释放单例锁。
- 宿主侧：`created/updated` 入库后自动投递 `enrich`，带 `options.transcribe` 的视频再投递 `transcribe`；投递失败只记日志，**不影响入库回执**。
- 导出：`knowledge/<site>/<id>/meta.json + content.md`（Obsidian 可直接吃）、CSV 带 BOM、JSON 批量；格式非法报 422。

顺带修掉一个阶段 1C 引入的前端回归：`api()` 支持 PATCH/DELETE 时把默认方法写死成 GET，导致
`/capture`、`/reindex`、`/export` 这类没显式传方法的调用变成 GET。现在按「有没有 body」推默认方法（有 body 即 POST）。

### 对抗验收后修掉的问题（阶段 2 修复轮）

第一轮提交后另派一次独立评审（读 `ac527af` 的 diff），查出 6 个真缺陷，都已修并补了回归用例：

1. **重复转写把正文越堆越长**：判重写的是 `[视频转写]`，实际落的标记是 `[视频转写·subtitles]`，永远判不中。
   现在判重与写入共用同一个前缀常量 `TRANSCRIBE_MARKER`，且整段追加走 `append_marked_section()` 一条原子 UPDATE。
   用例：连转两次 → `[视频转写` 只出现 1 次，md 资产同步。
2. **OCR 回填会吃掉并发修改**：先读整行 → 跑几秒 OCR → 整列写回，期间用户「保存正文」或转写追加会被覆盖。
   现在 OCR 与转写共用同一个「带标记才追加」的原子 UPDATE，资产与索引只在真追加时刷新。
3. **重试在几十毫秒内烧光三次机会**：模型通道一句 `⏳ 会话被占用` 就能把任务打成 `failed`。
   现在 `RETRY_BACKOFF=90s` 按 `attempts` 递增退避，`MAX_IDLE_WAIT=300s` 兜住线程驻留时长。
   用例：失败后立刻 `_claim()` 返回 None，退避归零后才能再领。
4. **扩展投递的任务没人排干**：宿主进程没有模型通道，`start_worker()` 只在两个按钮路由里调用，
   "入库后自动加工"实际不成立。现在后端启动时接着跑，前端每 6 秒轮询 `/index-status` 时也补一次，
   并在线程释放锁后再探测一次，堵掉「最后一次探测 → 释放锁」之间投递进来的漏。
   用例：队列有空行时 `/index-status` 不起线程，有可领任务时恰好触发一次。
5. **跑任务期间重新投递会被判成已完成**：`_finish()` 无条件写 `done`，把用户新排的队吞了。
   现在只更新自己领到的那一版（`status='running' AND attempts=?`），不匹配就什么都不写。
   用例：claim → 再 enqueue → finish → 计数仍是 `pending:1`。
6. **上次跑剩的字幕/音频被当成本次结果**：yt-dlp 这次失败时，`glob('subs*')`/`glob('audio.*')` 会把旧文件读回来并报成功。
   现在两条下载路径各自先清掉自己那类旧产物；顺带补 `creationflags` 不再弹控制台窗口。
   用例：预置旧 `subs.zh.vtt` + 假 `_run` 什么都不做 → 返回空串而不是旧字幕。

另外：导出按钮原来在没勾选时会导出「当前已加载的这些条」却说得像全库，现在按钮与提示都写清范围（勾选/本页）。

### 对抗验收后修掉的问题（阶段 2 修复轮二）

针对 `d8d32ba` 再派一次独立评审，查出 5 个问题（2 高 2 中 1 低），逐条对着代码复核后都修了：

1. **HIGH｜后端空跑一次就把整队列判死**：通道不可用（`⏳/⏱️/❌/（无输出）`）原来照样计次，
   三次在 270 秒内烧完（`MAX_IDLE_WAIT=300`），`failed` 行此后再也不会被领；
   于是"没开着模型通道时启动一次工作台"= 队列全灭。
   现在这类失败走 `ChannelUnavailable` → `_finish(deferred=True)` 退回 `pending`，
   `attempts` 封顶在 `MAX_ATTEMPTS`（退避固定 270s，不随领取次数无限增长），永不转 `failed`。
   用例：`test_channel_outage_does_not_burn_the_retry_budget`（连跑 6 轮仍 pending、`enrich_failed==0`、通道恢复后跑成 done）。
2. **HIGH｜转写"成功"是假的**：`transcribe_one` 把 `append_marked_section()` 的返回值丢了，
   追加没生效也报 `done`。顺带发现原子 UPDATE 在 `content IS NULL` 时整条匹配 0 行
   （`trim(NULL)`/`instr(NULL,x)` 都是 NULL），而 `ocr_attempted` 已经写进去了 → 识别文字永久丢失、批量回填也不会再来。
   现在 SQL 两处都 `COALESCE(content,'')`；转写侧未追加成功时回读正文：已有转写标记 → `{'already': True}`，
   否则抛错让队列记失败。用例：`test_transcribe_reports_failure_when_append_is_refused`、
   `test_ocr_backfill_appends_into_null_content_and_keeps_extra`。
3. **MEDIUM｜OCR 整列覆盖 extra_json**：`refresh_ocr` 用「读整行→算→写整列」，OCR 那几秒里并发补的字段会被抹掉。
   现在走新加的 `merge_extra_json()`（SQLite `json_set` 逐 key 合并，坏 JSON 先当 `{}` 兜底）。
   用例：`test_merge_extra_json_preserves_untouched_keys`。
4. **MEDIUM｜`start_worker()` 可能漏锁**：`_WORKER` 先抢后起线程，`Thread` 构造/`start()` 抛异常时
   `loop` 从未执行、`finally` 也就不会释放，加工队列到重启前彻底起不来。现在整段包 `try`，失败即还锁并返回 False。
   用例：`test_start_worker_releases_lock_when_thread_cannot_start`。
5. **LOW｜领取没有版本核对**：`_claim` 是「读一行→无条件改成 running」，两个领取者会跑同一行、重复烧配额；
   `_finish` 的 `(status='running', attempts=?)` 也不是唯一版本（第二次领取同样落在 running/1）。
   现在领取的 UPDATE 带 `status=? AND attempts=?` 复检，抢输的一方 `rowcount==0` 直接放弃这一轮。
   用例：`test_claim_is_versioned_so_two_workers_cannot_run_one_row`。

这一轮只动后端与测试，前端未改（`npm run build` 结论沿用 `d8d32ba`）。

## 推断（读了代码，没跑起来）

- 模型通道复用工作台进程内的 `run_agent_sync`（`web/app.py`）：`_agent_runner()` 只从已加载的
  `app` / `__main__` / `web.app` 模块取函数，取不到就明确报错——刻意不回退到 `import app`，
  那会把整份 FastAPI 模块再执行一遍。因此**打标必须在 Easel Web 后端进程内跑**；
  后端没起时投进来的任务停在 `pending`（`error` 里就是这句中文原因），等下一次后端启动或页面轮询自动补跑，不会转 `failed`。
- Whisper 走 CPU + int8（`EASEL_WHISPER_MODEL`，默认 `small`），首次要下模型；没字幕的视频才会走到它。

## 未做 / 未验证（别当成已通过）

- 没有跑过一次真实的 yt-dlp 下载 + faster-whisper 转写（venv 里两个包都装了，但整条链需要联网+几分钟 GPU/CPU 时间）。
- 没有跑过一次真实的 OpenClaw 打标（要后端和订阅在线）；队列语义是用假模型验的。
- 没有在真 Chrome 里重装扩展做端到端（回执三态、`data:` 封面、视频地址不丢都是测试内模拟）。
- 语义检索/相似素材（阶段 3.1）、素材问答工具（3.2）、灵感漫步（3.4）：按计划留给 FTS 上线后看满意度。
- 博主订阅每日刷新（4.1）、账号档案（4.2）、browser-control 自动化（4.3）：未启动。
- 本 worktree 里 `/api/research/feeds/sync` 恒为 503：`easel/feeds.py` 在这条分支基线上就不存在，属既有缺口，不在 06 方案范围。
- 多 worktree 同时注册 Native Host 是否互相覆盖注册表键：未核实（合并时留意）。
- **一个可能要回退的行为决定**：修复轮之后队列是**自动排干**的（后端启动时 + 素材库页打开时每 6 秒探测），
  也就是说打标会自己消耗 ChatGPT 订阅额度，不需要你点按钮。不想要就删两处触发点：
  `web/app.py` 启动里的 `research_enrich.start_worker()`、`web/research_api.py` 的 `/index-status` 分支，
  只留「AI 打标摘要」按钮手动触发。
