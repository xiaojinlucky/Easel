# Meta 工作台规则（做科研的Meta师兄 自用，2026-10-19：素材只走飞书，启动不打开 Beav）

这台 Easel 是「做科研的Meta师兄」的自用创作工作台。飞书收藏库是主素材源。Easel 管选题方法、写稿、卡片、公众号排版、发布前检查和复盘。不要启动 Beav，也不要通过 beav-creator 读取素材或选题。发布永远停在发布页，由用户本人点。

## 素材从哪来（只读）
1. 飞书「收藏资产库」（主源）：每天由启动脚本导出一份快照到 `outputs/_sources/feishu-收藏资产库-YYYYMMDD.ndjson`（一行一条，字段有 标题、正文、视频转写、图片文字、热门评论、评论区在说什么、为什么火、选题潜力、点赞、链接 等）。用最新日期那份。不要改标题、正文或链接。确认删除不物理删行：工作台把同一条的「收藏状态」写成「不再同步」，并写下「取消发现日期」。原始ID留着，定时同步不会把手机上仍在收藏的同一条再写进来；每周取消收藏检查也不会把「不再同步」改回「收藏中」。在飞书里直接删掉整行会丢掉这个标记，下次同步可能再出现。
2. 用户已有的底稿或论文：用户在对话里给路径。

## 选题
- 漫步选题（wander-synthesis）和评论区选题（xhs-comment-insight）已从工作台撤下。不要加载这两个技能，也不要在首页、素材库或对话里提议它们。
- 用户要写稿时，直接按下面的写稿规则，从飞书快照里取用户点名的素材。
- 量化评论词频仍可用原有 `skill-comment-insights`（脚本分析）。它只出数据，不出选题入口。

## 写稿
- 写任何稿子前先读 `skills/builtin/writing-style/SKILL.md`（材料门槛、去 AI 味、标题 framing、账号高表现结构），再读 `skills/builtin/meta-writing-core/SKILL.md` 与 `skills/builtin/meta-writing-core/anchors/` 下用户原文摘录。原文就是标准，不拿自己改写的句子当示例。
- 小红书笔记的流程和输出格式参考 `skills/builtin/xhs-note-creator`，论文题材参考 `skills/builtin/paper-explainer`，但开头模板和「爆款方法论」不用，语气以 writing-style + meta-writing-core 为准。
- 不照论文顺序复述；不先夸后贬；结尾不写「三点总结」「抄作业」；全篇有「我」的判断；三个平台各自起笔。
- 写完对照 anchors 逐段自检，自检表附在稿子末尾单独一节，只列问题不替用户改。

## 卡片
- 内页文字卡：`.venv\Scripts\python.exe skills\builtin\text-to-card\render_card.py 草稿.md 输出目录`，每张 1080×1440。
- 封面与配图默认先取 `assets/meta-ip/README.md` 列出的现成 IP 资产，按 `skills/builtin/meta-ip-visual/SKILL.md` 使用；默认资产正本在 `assets/meta-ip/`，内容库有同名展示。只有现有场景不适合，才把画面交给本机已登录的 Codex 订阅生成（默认走 `skills/shared/scripts/ai_image.py`，不另配生图 key）。只有用户把生图通道改成 OpenAI 兼容并标成主之后，才使用单独的生图接口。

## 文件规矩
- 成稿一律新建：`outputs/meta-drafts/YYYY-MM-DD-主题-v1/`，里面放 `小红书草稿.md`、`cards/`。同名已存在就升 v2，绝不覆盖。
- 选题样例可放 `outputs/meta-drafts/YYYY-MM-DD-选题-漫步或评论-v1/`。
- 不改、不覆盖用户的 Word 手改稿，不碰 `03-变现交付`。
- 不登录、不发布、不刷小红书。需要发布时只告诉用户在哪一页点。
