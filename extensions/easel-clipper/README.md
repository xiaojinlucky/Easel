# Easel 素材采集扩展

正文提取直接复用 Mozilla Readability 0.6.0（Apache-2.0，见 LICENSE.Readability.md）；这里只提供 Chrome / Edge 到本地 Easel 素材库的连接。

1. 打开浏览器扩展管理页面，开启开发者模式，选择「加载已解压的扩展程序」，选择此目录。
2. 在 Easel「调研与素材」生成配对码，复制到扩展。
3. 在网页中选中要保存的评论或摘录，点击扩展保存。未选择文字时提取正文。

仅在你点击时读取当前页。使用 activeTab 与 scripting，不请求所有网站常驻权限，不读取登录 Cookie，不上传到云端。配对码存储在当前浏览器的本地扩展存储中。
