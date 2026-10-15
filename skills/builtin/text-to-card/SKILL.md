---
name: text-to-card
description: 当用户需要把小红书笔记或 Markdown 稿件排成白底文字卡片时使用。沿用 Meta 工作台的本地样式，导出 1080x1440 图片，支持自动分页、单张重排和分页文本清单，保留原始稿件，由用户检查后自行发布。
layer: produce
---
用法：`.venv\Scripts\python.exe skills\builtin\text-to-card\render_card.py 输入.md 输出目录 [--name 昵称] [--date 2026-10-11] [--wm 水印] [--avatar 头像.png]`

输出 card-01.png… 每张 1080x1440（3:4）。空行分段；`# 标题`/`## 小标题` 显示为加粗段；`**加粗**`、`==黄色高亮==`。第一页带头像+昵称+日期；超长自动分页，长段按句号切开；小标题不留在页底。字体用本机 Noto Sans CJK，不联网。

默认头像：不传 `--avatar` 时尝试读取技能目录内的 assets/avatar-square.png；这个可选的个人文件不随源码发布，缺失时头像留空。也可以用 `--avatar` 指定本机图片。


Windows 工作台用 render_card.py（Python 版，和 render.js 同一套排版逻辑和 template.html）。render.js 是原版，留作对照。
