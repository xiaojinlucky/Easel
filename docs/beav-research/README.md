# Beav 知识库复刻调研（2026-09-21）

七份记录，回答一个问题：Easel 的「采集 → 素材库 → 仿写」这条线跟 Beav 商业版差在哪，哪些值得自己实现。

读法：01–04 是四路独立调研（各自带 `文件:行号` 或 URL 证据），05 是汇总对比矩阵，06 是分阶段复刻方案，07 是阶段 0/1/2 的验收记录与复核命令。

## 两点需要先说明

1. **本仓库不含 `extensions/beav-capture`。** 该采集扩展的上游是 [Jamailar/Beav](https://github.com/Jamailar/Beav)，许可为 MIT-NC（仅限非商业使用），不授予再分发权利，所以发布形态里把它整体摘除了。01、02、05、06 中凡是以 `extensions/beav-capture/...` 形式出现的文件名与行号，指的是个人本机自行放置的那份副本，在公开仓库里查不到对应文件。要在自己的发行版里做采集壳，许可友好的参照是 [obsidian-clipper](https://github.com/obsidianmd/obsidian-clipper)（MIT）。
2. **这些是工作记录，不是产品文档。** 文中出现的分支名、工作树路径、端口、进程号与「待拍板」清单，记录的是 2026-09-21 那次调研当时的本机状态，多数已经变化；涉及可复核结论的部分，以代码、`tests/` 与 [`docs/ACCEPTANCE.md`](../ACCEPTANCE.md) 为准。
