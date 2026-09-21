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
| 阶段 2 | `ac527af` 功能 + `49b1f78` 线程用例 + `d8d32ba` 修复轮一 + `04a633e` 修复轮二 + `5c3af88` 文档 + 修复轮三 | AI 打标/摘要队列、OCR 批量回填、视频字幕/Whisper 转写、Beav 目录式导出（folder/json/csv）、宿主入库自动投递加工任务；三轮对抗验收修复见下 |

**提交粒度对账**：当初约定"每阶段一个提交，验收后单独合"，实际因三轮对抗验收各自要独立可复现，
阶段 0/1 各一提交，阶段 2 已拆成 6+ 提交（含本轮）。想要"一阶段一提交"的干净历史，
就整支 `git merge --squash research/beav-kb-parity`；想保留三轮修复的演进过程，就按上表逐个 cherry-pick。
两种都不自动做，等你发话。

修复轮三的提交号不写在正文里（自己引用自己的哈希拿不到）：`git log --oneline research/beav-kb-parity` 最上面那条即本轮。

## 已验证事实（可复制复核）

环境：**现役树是 `Easel-official`**（2026-09-19 拍板，见其 `HANDOFF.md`；隔壁 `Easel/` 是待吸收的代码资产，不再是现役树）。
本 worktree 没有自带虚拟环境，两个可用解释器各有缺口：

| 解释器 | pytest | rapidocr | 备注 |
|---|---|---|---|
| `Easel-official/.venv`（现役，App 实际就靠它跑） | **已装 9.1.1**（2026-09-21 用户授权，清华镜像） | 1.4.4 有 | `HANDOFF.md` 里"没装 pytest"那条已过期 |
| `Easel/.venv`（隔壁待吸收树） | 有 | **没装** | 本文件数字原先只在这上面跑 |

**用现役解释器复跑过，数字完全一致**：`3 failed, 268 passed, 5 skipped`；
`tests/test_research_enrich.py` = `32 passed`。所以下面这些期望值在"真跑 App 的那个环境"里成立，
不是旧环境专供（唯一区别：现役环境里 `ocr_available()` 为 True，隔壁为 False；用例只断言它是 bool，不受影响）。

```bash
cd "F:/科研大师兄/自媒体工作台/Easel-beav-kb"
PY="F:/科研大师兄/自媒体工作台/Easel-official/.venv/Scripts/python.exe"   # 现役环境（推荐）
# 备选：PY="F:/科研大师兄/自媒体工作台/Easel/.venv/Scripts/python.exe"    # 缺 rapidocr
"$PY" -m pytest -q                 # 期望：3 failed, 268 passed, 5 skipped
"$PY" -m pytest tests/test_research_enrich.py -q   # 期望：32 passed
```

`tests/test_core.py` 里那 3 个失败（`test_write_baseline_profile`、
`test_persona_skill_prioritizes_positioning_and_caps_cross_niche_scores`、
`test_job_events_resume_after_event_id`）**在主树同样失败**——已在 `Easel-official` 上跑过同文件比对，
属于基线问题，不是这条线引入的。

调研线各测试文件通过数（修复轮三后重跑）：宿主 19 / 治理 6 / 治理路由 2 / 导出+OCR 4 / 加工队列 32 / 扩展安全 6 = 69 条。

前端（worktree 里 `npm ci` 后）：

```bash
cd web/frontend && npm run build   # 期望：tsc 无错；单 JS 460.22 kB(gzip 142.35 kB)、哈希 index-C84UostV.js；dist 被 gitignore，不入库
```

阶段 2 具体已测行为：

- 打标提示词把素材包成 `UNTRUSTED_REFERENCE`（`tests/test_research_enrich.py:88` 断言提示词含该标记且带素材标题；
  这是**提示词文本断言**，不等于验证过模型真不服从素材里的指令）；模型返回的标签/摘要写回库，且进全文索引（能用标签词搜到）。
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
   （勘误：`attempts` 并不是唯一版本，见下面修复轮二第 5 条与修复轮三的 `claim_key`。）
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
5. **LOW｜领取没有版本核对**：`_claim` 是「读一行→无条件改成 running」，两个领取者会跑同一行。
   这一轮给领取的 UPDATE 加了 `status=? AND attempts=?` 复检，**但事后（修复轮三）复核发现它并没有真正解决 ABA**：
   `attempts` 不是唯一版本，退避期内两次领取都可能落在 `running/attempts=1`；而 `rowcount==0 放弃这一轮`
   那条分支在单例 worker 下从未被执行过，用例 `test_claim_is_versioned_so_two_workers_cannot_run_one_row`
   实际断言的是 SELECT 侧的可见性（第二次 `_claim` 因退避返回 None），并非该 UPDATE 的复检生效。
   真正的修复在修复轮三：加 `claim_key` 领用令牌，领取与回写都带令牌比对。

这一轮只动后端与测试，前端未改（`npm run build` 结论沿用 `d8d32ba`）。

### 对抗验收后修掉的问题（阶段 2 修复轮三）

针对 `04a633e`+`d8d32ba` 再派一轮独立评审（4 个只读评审视角：数据层、加工队列、宿主与扩展、Web/前端），
逐条对着代码复核后修掉下列真缺陷；评审为只读，修复与补测试由主线自己完成后重跑全量（`3 failed / 268 passed / 5 skipped`）。

**数据层（`easel/research.py`）**

1. **重新采集同一条会把 AI 成果冲掉**：标签整列覆盖、`ocr_attempted`/`ocr_text` 一起没、旧正文里的
   `[视频转写]`/`[识别文字]` 段落被新正文替换（几十秒模型配额 + 已下载的视频白扔）。
   现在标签只并在前、本次没产出的 OCR 字段留旧值、标记段落经 `preserve_enriched_sections()` 原子补回；
   模型调用期间用户新加的标签由 `merge_ai_fields()` 保住，摘要被改过则不覆盖。
   用例：`test_enrich_keeps_tags_added_during_the_model_call`。
2. **跨平台相同 note id 互相覆盖**：`save_source` 的重复身份只用裸 `external_id`。现在带平台命名空间
   （`'ext\n' + platform + '\n' + external_id`）。
3. **`merge_extra_json()` 会把好数据写成 `{}`**：`json_type(x)='$'` 恒不成立（该函数返回类型名，
   合法对象返回 `'object'`），每行都被替换成空对象；对故意写坏的那行 SQLite 又抛 `malformed JSON`。
   现在 `json_valid()` + `json_type()='object'` 双重短路。用例：`test_merge_extra_json_preserves_untouched_keys`。
4. **带引号的搜索直接 500**：`ESCAPE '\\'` 在 SQLite 字面量里是两个字符（不认反斜杠转义），
   报 `ESCAPE expression must be a single character`；且 `%`/`_` 会漏成通配符。现在发单字符转义符、
   对 `\ % _` 逐列转义、查询截断 200 字符。
5. **FTS 命中过多撞变量上限**：命中 id 直接拼 `id IN (?,...)`，超过 SQLite 32766 变量上限会 500。
   现在 `FTS_ID_CAP` 超上限就整体退回 LIKE 扫描（慢但不炸）。

**SSRF / 路径 / 回收站**

6. **视频地址可以是内网**：转写链路原来只判 `startswith('http')`，`http://127.0.0.1:xxxx` 或
   `127.0.0.1.nip.io` 这类通配 DNS 会让本机去请求内网服务。现在 `media_url_allowed()` 解析 DNS 后判
   `is_global`，并在**三层**都拦：路由 `/sources/{id}/transcribe`（422 中文原因）、宿主投递前（不投 `transcribe`，
   但视频地址照样存库，不静默丢数据）、worker `transcribe_one()` 兜底。
   用例：`test_transcribe_route_rejects_unusable_video_urls`、`test_transcribe_refuses_private_video_url`、
   `test_private_video_url_is_not_queued_for_transcribe`。
7. **`Path.startswith` 不是包含判定**：`../outputs_backup/...` 会被当成 `outputs/` 下面，回收站硬删时
   `rmtree` 会扫到兄弟目录。现在统一走 `_inside()`（resolve 后看 `parents`）。
8. **回收站超期硬删留残留**：只删 `sources` 行，`sources_fts`、`enrich_tasks`、md 资产和图片目录都留着
   （僵尸任务反复被领→报错，状态页计数永远不归零）。现在同一条写事务里一起清，且 `DELETE` 复核
   `deleted_at<?` 上界——与 restore 赛跑时不会出现"返回成功、素材连文件仍被硬删"。

**宿主与扩展（`scripts/beav_native_host.py`）**

9. **单帧无上限**：扩展一次投多张 base64 长图能把宿主读爆。现在 `MAX_INBOUND_BYTES = 32 MiB`，超限拒收并记日志。
   用例：`test_oversized_frame_is_refused`。
10. **回执说"读回过内容"是假的**：素材被删或资产文件不在时仍报 `readBack:true`。现在 `readBack` 要有正文
    或 `asset_exists()` 真的 stat 到文件；重放（同一 `operationId`）对已删源会明确标 missing。
    用例：`test_replayed_receipt_marks_deleted_source`。
11. **投递失败在回执里看不见**：入库成功、加工任务没排上，用户以为"在处理"。现在回执带
    `processing.queued` / `processing.failed`（异常类名兜底，不写空串）。
    用例：`test_enqueue_failure_is_visible_in_receipt`。

**加工队列（`easel/research_enrich.py`）**

12. **一批任务 = 一次 CLI 风暴**：通道不可用时每条任务各自去拉起模型通道，几十条排队就是几十次 CLI 调用，
    还会互相抢会话。现在整队列共用 `CHANNEL_COOLDOWN=120s` 冷却，冷却期内不领任务，`next_available()`
    把冷却折进等待时间。用例：`test_channel_outage_cools_the_whole_queue_down`、`test_success_clears_channel_cooldown`。
13. **领取仍不是唯一版本**（修复轮二第 5 条的遗留）：现在加 `claim_key`（`time.time_ns()` 单调令牌），
    `_claim` 的 UPDATE 与 `_finish` 的写回都比对令牌。列**必须是 INTEGER**：`REAL` 存 61 位纳秒会丢尾数，
    `_finish` 匹配 0 行、任务永远卡在 `running`（已实测：REAL 匹配 0、INTEGER 匹配 1）。
    老库用 `ALTER TABLE ... ADD COLUMN claim_key INTEGER NOT NULL DEFAULT 0` 迁移（本分支前几个提交的库正是缺列形状）。
    用例：`test_reenqueue_while_running_is_not_swallowed`（断言第二次领到的 `attempts` 相同但 `claim_key` 不同）、
    `test_legacy_database_gains_the_claim_key_column`（手工建缺列老库 → 连接时自动补列 → 老 `pending` 行仍能被领、能被回写成 `done`）。
14. **转写会饿死打标**：`_claim` 按 `id` 排序取第一条，一批转写排前面时 enrich 长期领不到。现在按
    `TASK_TYPES` 轮转领，本轮该类没活再回退到任意类型。用例：`test_batch_of_transcribes_does_not_starve_enrich`。
15. **系统时钟回拨会卡死队列**：可领判定只比 `now >= updated_at + backoff`，时间往回调就永远不成立。
    现在加 `updated_at > ?`（窗口起点）分支。用例：`test_clock_rollback_does_not_stall_pending_tasks`。
16. **worker 遇一次 `sqlite3.Error` 就永久退出**：锁在 `finally` 外、异常直接冒线程外，之后到重启前排空不再发生。
    现在整轮包 `except sqlite3.Error` 退避重试、连续 5 次才收，且 `finally` 一定 `_WORKER.release()`，
    释放后再探测一次并重新拉起。
17. **失败原因可能是空串**：`_finish` 收到空 `error` 时状态页显示空白。现在统一兜底为
    "加工失败（模型通道未给出原因）。"；模型通道抛出的异常原来直接冒出去，现在包成
    `ChannelUnavailable`（带类型名与 160 字摘要）走延迟通道，不烧配额。
    用例：`test_agent_exception_becomes_a_reasoned_channel_failure`。
18. **判重发生在下载之后**：已有转写的素材还会先下几十 MB 再发现不用写。现在 `TRANSCRIBE_MARKER in content`
    提前返回 `{'source':'existing','already':True}`。用例：`test_transcribe_skips_download_when_a_transcript_exists`。

**Web / 前端诚实性**

19. **导出注入**：CSV 单元格以 `= + - @ Tab CR` 开头时，Excel/WPS 会当公式（DDE 甚至能拉命令）。
    现在 `_neutralise()` 给这类值加前缀 `'`；导出文件名精确到毫秒再带随机段，同一秒两次导出不再互相覆盖后
    返回同一个路径。
20. **事件循环里跑同步 sqlite/宿主 IO**：`/status`、`/sources`、`/index-status`、`/enrich`、`/enrich/status`、
    `/sources/{id}`、`/import` 已统一走 `to_thread`；加工线程不再被前端轮询卡住。
21. **前端把状态说小/说大**：6 秒轮询把已翻页的列表打回一页（现在按 `loadedRef` 续，最多 500）；
    导出按钮没勾选时说得像全库（现在写"（勾选/已加载）"并在被截断时提示）；重建索引只报成功条数
    （现在带 `skipped`）；通道冷却完全不可见（现在 `/index-status.enrich_cooldown`、
    `/enrich/status.channelCooldown`，界面显示"通道冷却 Ns 后自动续跑"）。

**文档对账**（口径回到代码，不是代码回到文档）

- `README.md` / `README_EN.md` / `WECHAT_OA_INTEGRATION.md` / `docs/known-issues.md` / `docs/known-issues_EN.md`：
  端口 7860 → **7870**（与 `easel/cli.py`、后端默认、扩展硬编码一致）。
- `01-ours.md` 顶部加"时点快照"提醒（它是 `58e99a3` 的盘点，不是现状）。
- `06-replica-plan.md` §1A：`data:` 图片"≤6MB 上限沿用"改为实现真实口径（解码后 ≤2,000,000 字节、每条最多 8 张）。
- 本文件的基线期望值、每文件通过数、前端产物哈希、以及修复轮一/二里两处过头的结论，均已按实测重写。

**刻意没改的基线决定（要你在合并前定夺，不替你静默改）**

- **H1｜局域网全库暴露**：`web/app.py:3225` 仍是 `host="0.0.0.0"`、`:335` 仍是 `allow_origins=["*"]`，
  且 `/api/research/*` 没有任何鉴权。按现役树 HEAD 的路由表，同网段现在就能**读全库**
  （`GET /status`、`/sources`、`/sources/{id}`）并**写入素材**（`POST /capture`、`/import`）；
  编辑与删除（`PATCH` / `DELETE` / `batch-delete` / 回收站硬删）是本分支阶段 1B 才加的路由，
  **合并后风险从"可读可注入"升级为"任意改删"**。实测数据见下面"与现役树的关系"一节。
  改法很短（`host="127.0.0.1"` + CORS 收敛到同源），但它会改变你现在"手机/别的机器访问工作台"的用法，
  所以留给你决定。
- **H2｜`POST /api/research/beav-host` 免鉴权注册扩展**（主树 `9e9ca82` 引入）：任何能连到端口的进程都能
  把自己的扩展 ID 写进 Native Host 允许清单，之后宿主就认它投的数据。这属于主树既有行为，本分支未动。
- **`enrich_tasks.error` 原样进 `/enrich/status`**：里面可能带 yt-dlp 的 stderr 尾巴（含临时文件路径）。
  不是凭据泄露，但如果你要给别人看状态页，建议只回异常类名。
- 另：`state` / `kind` / `tags` / `sort` 这几个筛选**只有后端实现了，界面没有入口**（前端只有 kind 一个下拉）。
  补齐 UI 属于阶段 1C 的收尾，没排在修复轮里。

## 与现役树的关系（2026-09-21 复核）

- 仓库拓扑（`git worktree list`，在 `Easel-official` 里执行）：`Easel-official` = `snapshot/official-active-0919`、
  `Easel-beav-kb` = 本线 `research/beav-kb-parity`、`Easel-merge-wip` = `merge/easel-into-official`。
  三者同属一个仓库，所以 cherry-pick 直接可行；隔壁 `Easel/` 是**另一个独立 .git**（待吸收，不是 worktree）。
- **运行时现状（2026-09-21 实测，不是推断）**：`netstat` 显示 **7870 正在 `0.0.0.0` 上监听**（pid 32096，00:02:52 起），
  网关 18789 只绑 `127.0.0.1`。该实例跑的是 official HEAD 的代码（`GET /api/research/index-status` → 404，
  `GET /api/research/status` → 200 且响应里还没有 `ocr_available` 这些本分支才有的字段）。
  `%LOCALAPPDATA%\easel-native-host\easel-root.txt` 当前内容是 `F:\科研大师兄\自媒体工作台\Easel-official`
  ——浏览器采集真的落进现役树。合起来意味着：**上面 H1 那条局域网暴露是此刻成立的事实，不是假设**：
  本机无鉴权 `GET http://127.0.0.1:7870/api/research/sources` 实测 **200、约 9.7 KB** 素材数据
  （official HEAD `web/research_api.py:26` 就有这条路由，绑在 `0.0.0.0` 上＝同网段可达）。
  删除类破坏要等本分支的 `DELETE` / `batch-delete` 路由合进去才成立，现状是"可读可改采集"。
  一个小未坐实项：WMI 报这个进程的镜像是 uv 托管的基础 `python.exe`，而那个解释器单独 `import fastapi` 是失败的，
  所以它实际吃哪套 site-packages（多半是 `Easel-official/.venv`）没核实——要判断"线上有没有 OCR 能力"时别拿这条当依据。
- **端口**：现役树代码里默认端口仍是 **7860**（`easel/cli.py:147`、`:199`、`web/app.py:3213` 的 `EASEL_PORT` 兜底），
  而 `extensions/easel-clipper/manifest.json:7` 已经写死 `127.0.0.1:7870`，产品合同也是 7870（`HANDOFF.md`）
  ——即现役树现在靠启动时显式传端口才对得上。本分支阶段 0 把默认值统一到 7870，正是补这个缝；
  **但合并后不带参数 `easel web` 会从 7860 变 7870**，正在跑的 7870 实例要按 `HANDOFF.md` 的规矩重启才吃到新代码。
- **冲突面**：与 `merge/easel-into-official`（349 文件的两树吸收线）重名的只有 5 个文件，
  且都是本线的核心：`easel/research.py`、`web/research_api.py`、`web/app.py`、
  `web/frontend/src/components/ResearchPage.tsx`、`web/frontend/src/styles/research.css`。
  两侧都往里加代码（那条线 +349/−13，本线 +1184/−81），**先合哪边，后合的那边就要手动解**。
  复核命令：
  ```bash
  cd "F:/科研大师兄/自媒体工作台/Easel-official"
  git worktree list
  comm -12 <(git diff --name-only 21c8e8d...6fdb281 | sort) <(git diff --name-only 21c8e8d...HEAD | sort)
  ```
- Native Host 落库位置由 `%LOCALAPPDATA%\easel-native-host\easel-root.txt` 单点决定（`01-ours.md` 行 23），
  三条 worktree 都点过"注册到本工作台"的话最后一次说了算——合并/试跑前先确认它指向哪棵树。
- 合并前动手顺序建议：先备份 `outputs/`（老库补列迁移只练过假库），再在**当前 HEAD 上**跑一遍本文件的 pytest 期望值。
  两个解释器现在都能跑同一套（现役 `.venv` 已补装 pytest 9.1.1），唯一残留差别是隔壁 `Easel/.venv` 缺 rapidocr，
  在那上面跑会让 `ocr_available()` 显示 False——只影响显示值，不影响用例通过。

## 推断（读了代码，没跑起来）

- 模型通道复用工作台进程内的 `run_agent_sync`（`web/app.py`）：`_agent_runner()` 只从已加载的
  `app` / `__main__` / `web.app` 模块取函数，取不到就明确报错——刻意不回退到 `import app`，
  那会把整份 FastAPI 模块再执行一遍。因此**打标必须在 Easel Web 后端进程内跑**；
  后端没起时投进来的任务停在 `pending`（`error` 里就是这句中文原因），等下一次后端启动或页面轮询自动补跑，不会转 `failed`。
- Whisper 走 CPU + int8（`EASEL_WHISPER_MODEL`，默认 `small`），首次要下模型；没字幕的视频才会走到它。

## 未做 / 未验证（别当成已通过）

- 没有跑过一次真实的 yt-dlp 下载 + faster-whisper 转写（venv 里两个包都装了，但整条链需要联网+几分钟 GPU/CPU 时间）。
- **rapidocr 推理已真跑通一次**（2026-09-21，用**现役树** `Easel-official/.venv`：rapidocr-onnxruntime 1.4.4 + onnxruntime 1.30，CPU）：
  拿本分支的 `research.ocr_local_images()` 识别一张 PIL 合成的干净中文图（"肿瘤学直博转行数据分析" + 一行英文），
  结果与期望中文**逐字相同**，冷启动 10.2 秒（含模型加载）、热第二次 3.6 秒，两次输出一致。
  但**注意两个环境的差别**：跑 pytest 的 `Easel/.venv`（隔壁树）**根本没装 rapidocr**，
  所以测试里 `ocr_available()` 恒为 False、所有 OCR 用例都把 `ocr_local_images` 换成了假函数。
  仍未验：真实平台截图（模糊/水印/竖长图）的识别质量、`批量识别图片 → 写库 → 进索引` 整链用真推理跑一遍、以及模型加载那 10 秒卡在哪个请求上。
- 老库补列迁移只在临时目录里造的老 schema 上验过（`test_legacy_database_gains_the_claim_key_column`），
  **没有对你真实 `outputs/` 里那份带真素材的库做过一次升级演练**；合并前先备份 `outputs/`。
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
