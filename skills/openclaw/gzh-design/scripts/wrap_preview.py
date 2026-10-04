#!/usr/bin/env python3
"""把已校验的公众号正文片段（纯 <section>）包成带「复制」按钮的浏览器预览页。

用户打开预览页 → 点右上角「复制到公众号」→ 按钮选中并复制里面渲染后的富文本
（等价手动 Ctrl+A/Ctrl+C，样式全保留）→ 到公众号编辑器 Ctrl+V 粘贴即可。

按钮和 JS 只存在于预览外壳里，**不在被复制的 section 内**，所以粘进公众号的
仍是干净合规的正文，不含 <script>/<button>。校验请对原始 section 文件跑
validate_gzh_html.py（本预览页含 script/style，不参与校验）。

用法:
    wrap_preview.py <section.html> [output.html]
    默认输出 <section去扩展名>_预览.html
"""

import base64
from html import unescape
import mimetypes
import os
import re
import sys
from urllib.parse import unquote

# 把正文里引用本地图片的 <img src="xxx.png"> 内联成 base64 data-URI。
# 复制粘贴进公众号时，图片字节随剪贴板一起走，公众号会把内联图上传到自己 CDN；
# 否则它要回源抓 src 指向的 Easel 本地/相对地址 → 抓不到 → 图片超时/裂图。
_IMG_SRC = re.compile(r'(<img\b[^>]*?\bsrc\s*=\s*)(["\'])(.*?)\2', re.IGNORECASE)
_INLINE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"}
_INLINE_MIME = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml", ".bmp": "image/bmp",
}
_LOCAL_MEDIA = re.compile(
    r"^(?:https?://(?:127\.0\.0\.1|localhost)(?::\d+)?)?/api/media/(.+)$",
    re.IGNORECASE,
)
_PROTECTED = {"analytics", "wechat"}


def _contained(path, root):
    try:
        rel = os.path.relpath(os.path.realpath(path), os.path.realpath(root))
    except ValueError:
        return None
    if rel.startswith("..") or os.path.isabs(rel):
        return None
    parts = rel.split(os.sep)
    if any(part in {"", ".", ".."} or part.startswith(("_", ".")) or part.lower() in _PROTECTED for part in parts):
        return None
    return os.path.realpath(path)


def _src_forms(src):
    text = unescape(unquote((src or "").strip()))
    if not text or text.startswith("data:"):
        return []
    forms = [text]
    no_query = text.split("?", 1)[0]
    if no_query and no_query not in forms:
        forms.append(no_query)
    if "#" in no_query:
        cut = no_query.split("#", 1)[0]
        if cut and cut not in forms:
            forms.append(cut)
    return forms


def _local_image(src, base_dir, outputs_root):
    for bare in _src_forms(src):
        media = _LOCAL_MEDIA.match(bare)
        if media:
            parts = re.split(r"[\\/]", media.group(1))
            if not parts or any(part in {"", ".", ".."} for part in parts):
                continue
            candidate = _contained(os.path.join(outputs_root, *parts), outputs_root)
        elif bare.lower().startswith(("http://", "https://", "//")):
            continue
        else:
            raw = bare if os.path.isabs(bare) else os.path.join(base_dir, bare)
            candidate = _contained(raw, base_dir)
        if not candidate:
            continue
        ext = os.path.splitext(candidate)[1].lower()
        if ext in _INLINE_EXT and os.path.isfile(candidate):
            return candidate
    return None


def _inline_images(html, base_dir, outputs_root=None):
    if outputs_root is None:
        outputs_root = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "outputs")

    def repl(m):
        prefix, quote, src = m.group(1), m.group(2), m.group(3)
        img = _local_image(src, base_dir, outputs_root)
        if not img:
            return m.group(0)
        ext = os.path.splitext(img)[1].lower()
        try:
            with open(img, "rb") as fh:
                data = fh.read()
        except OSError:
            return m.group(0)
        mime = _INLINE_MIME.get(ext) or mimetypes.guess_type(img)[0] or "image/png"
        b64 = base64.b64encode(data).decode("ascii")
        return f'{prefix}{quote}data:{mime};base64,{b64}{quote}'
    return _IMG_SRC.sub(repl, html)


def main():
    if len(sys.argv) < 2:
        print("用法: wrap_preview.py <section.html> [output.html]")
        sys.exit(1)
    src = sys.argv[1]
    if not os.path.isfile(src):
        print(f"✗ 找不到文件: {src}")
        sys.exit(1)

    content = open(src, encoding="utf-8").read().strip()
    # 本地图内联 base64，让「复制到公众号」粘贴后图片不裂（相对路径按 section 文件所在目录解析）
    content = _inline_images(content, os.path.dirname(os.path.abspath(src)))
    tpl_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                            "..", "assets", "preview-template.html")
    tpl = open(tpl_path, encoding="utf-8").read()

    title = os.path.splitext(os.path.basename(src))[0]
    out_html = tpl.replace("{{TITLE}}", title).replace("<!--GZH_CONTENT-->", content)

    out = sys.argv[2] if len(sys.argv) > 2 else os.path.splitext(src)[0] + "_预览.html"
    open(out, "w", encoding="utf-8").write(out_html)
    print(f"✓ 已生成带「复制」按钮的预览页: {out}")
    print("  用浏览器打开它，点右上角「复制到公众号」，再去公众号编辑器 Ctrl/⌘+V 粘贴。")


if __name__ == "__main__":
    main()
