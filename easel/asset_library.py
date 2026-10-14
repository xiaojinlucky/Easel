"""资产库：对齐 Beav 的「资产库」（nav.assets / redbox.asset-folder.v1）。

Beav 商业版真实落盘（本机工作区实测，2026-09-22）：
    spaces/<space>/assets/<标题>/asset.md
    frontmatter 字段实测：schema / id / title / type / cover / tags / aliases / platform
    type 实测取值：person | scene | collection.product | collection.character
    封面图与 asset.md 同目录，frontmatter 里写相对路径（cover: ./xxx.webp）

Easel 落地形态：
    asset-library/<标题>/asset.md
    顶层 assets/ 已被项目静态资源占用（图标 / README 图 / showcase），故换目录名。

设计前提与知识库（easel/research.py）保持一致：磁盘文件夹就是「给人看的那一份」，
Obsidian / 记事本可以直接打开。差别在于资产条目量小（几十条）且无需全文检索，
所以这里**文件夹即真源**，不再叠一层 sqlite；知识库那边条目多、要 FTS，才以 sqlite 为真源。
"""
from __future__ import annotations

import json
import re
import shutil
import time
import uuid
from pathlib import Path

import yaml

from easel.research_browser import ROOT

LIBRARY = ROOT / 'asset-library'
LIBRARY_TRASH = LIBRARY / '.trash'
CATEGORIES_FILE = LIBRARY / '.categories.json'

SCHEMA = 'redbox.asset-folder.v1'

# type 的取值（对齐 Beav 实测：person / scene 为真实资产，collection.* 为系统分类容器）
ASSET_TYPES = {
    'person': '人物',
    'scene': '场景',
    'brand': '品牌',
    'item': '物品',
    'product': '商品',
    'character': '角色',
    'collection.brand': '品牌集合',
    'collection.character': '角色集合',
    'collection.item': '物品集合',
    'collection.product': '商品集合',
    'collection.scene': '场景集合',
}

# 新建资产时给这几个属性留位（Beav 的属性预设）
ATTRIBUTE_PRESETS = ['性别', '年龄']

# 内置分类。id 与 name 照抄 Beav 的 spaces/<space>/subjects/categories.json
DEFAULT_CATEGORIES = [
    ('subject_cat_brand', '品牌'),
    ('subject_cat_person', '角色'),
    ('subject_cat_item', '物品'),
    ('subject_cat_product', '商品'),
    ('subject_cat_scene', '场景'),
]

# Windows 目录名非法字符 + 控制字符；顺带挡掉路径穿越
_ILLEGAL = re.compile(r'[<>:"/\\|?*\x00-\x1f]')

# Windows 保留设备名：用作目录名会让 mkdir/写文件抛 OSError（NUL 更会让 exists() 恒为真，
# 表现为「明明没建却报重名」）。落到用户机器上就是建不出来、或资源管理器打不开删不掉的文件夹。
_RESERVED_NAMES = {'CON', 'PRN', 'AUX', 'NUL',
                   *(f'COM{i}' for i in range(1, 10)),
                   *(f'LPT{i}' for i in range(1, 10))}


class AssetError(ValueError):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def _folder_name(title: str) -> str:
    """标题 → 文件夹名。保留中文，剥掉 Windows 非法字符，截断防超长路径。"""
    name = _ILLEGAL.sub('_', str(title or '').strip())
    name = name.strip(' .')            # Windows 不允许目录名以点或空格结尾
    name = re.sub(r'\s+', ' ', name)
    name = name[:80] or 'asset'
    if name.split('.')[0].upper() in _RESERVED_NAMES:   # CON.txt 也算保留名
        name = f'{name}_'
    return name


def _asset_dir(folder: str) -> Path:
    return LIBRARY / folder


def _rename_asset_dir(current: Path, title: str) -> Path:
    """标题改了 → 文件夹跟着改（文件夹名就是资产名）。

    不这样做会留下「asset.md 里写着李四、文件夹还叫张三」的错位，而且旧标题再也建不了
    新资产（会被 create_asset 的同名检测 409 挡住）。目标目录已存在时拒绝移动，
    避免把别人的资产覆盖掉。封面图与 asset.md 同目录，随目录整体移动，相对路径不受影响。
    """
    name = _folder_name(title)
    if name == current.name:
        return current
    desired = _asset_dir(name)
    if desired.exists():
        raise AssetError('已经有同名资产了，换个标题或直接编辑那条。', 409)
    try:
        current.rename(desired)
    except OSError as exc:
        raise AssetError(f'重命名资产文件夹失败：{exc}', 500) from exc
    return desired


def _safe_rel(folder: str) -> Path | None:
    """把外部传入的 folder/相对路径收敛到 LIBRARY 内部，挡路径穿越。"""
    raw = str(folder or '').replace('\\', '/').strip('/')
    if not raw or raw.startswith('.') or '..' in raw.split('/'):
        return None
    target = (LIBRARY / raw).resolve()
    try:
        root = LIBRARY.resolve()
    except OSError:
        return None
    if target != root and root not in target.parents:
        return None
    return target


def _new_id() -> str:
    return 'asset_' + uuid.uuid4().hex[:30]


def _iso(ts: float | None = None) -> str:
    return time.strftime('%Y-%m-%dT%H:%M:%S', time.localtime(ts or time.time()))


def _atomic_write(target: Path, text: str) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp = target.with_name(target.name + '.tmp')
    tmp.write_text(text, encoding='utf-8')
    tmp.replace(target)


# --------------------------------------------------------------------------- #
# categories（对齐 Beav 的 subjects/categories.json）
# --------------------------------------------------------------------------- #
def _read_categories() -> list[dict]:
    if not CATEGORIES_FILE.exists():
        return []
    try:
        data = json.loads(CATEGORIES_FILE.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return []
    items = data.get('categories') if isinstance(data, dict) else None
    return [x for x in (items or []) if isinstance(x, dict) and x.get('name')]


def list_categories() -> list[dict]:
    """分类列表。首次调用会把内置 5 类落盘（对齐 Beav 的默认分类）。"""
    items = _read_categories()
    if not items:
        items = [
            {'id': cid, 'name': name,
             'createdAt': '1970-01-01T00:00:00.000Z', 'updatedAt': '1970-01-01T00:00:00.000Z'}
            for cid, name in DEFAULT_CATEGORIES
        ]
        _write_categories(items)
    return items


def _write_categories(items: list[dict]) -> None:
    _atomic_write(CATEGORIES_FILE, json.dumps({'version': 1, 'categories': items}, ensure_ascii=False, indent=2))


def create_category(name: str) -> dict:
    text = str(name or '').strip()
    if not text:
        raise AssetError('分类名不能为空。')
    if len(text) > 20:
        raise AssetError('分类名太长了（最多 20 字）。')
    items = list_categories()
    if any(str(x.get('name')).strip() == text for x in items):
        raise AssetError('已经有同名分类了。', 409)
    item = {'id': 'subject_cat_' + uuid.uuid4().hex[:12], 'name': text,
            'createdAt': _iso(), 'updatedAt': _iso()}
    items.append(item)
    _write_categories(items)
    return item


def update_category(category_id: str, name: str) -> dict:
    text = str(name or '').strip()
    if not text:
        raise AssetError('分类名不能为空。')
    items = list_categories()
    hit = next((x for x in items if x.get('id') == category_id), None)
    if not hit:
        raise AssetError('分类不存在。', 404)
    if any(str(x.get('name')).strip() == text and x.get('id') != category_id for x in items):
        raise AssetError('已经有同名分类了。', 409)
    old = str(hit.get('name'))
    hit['name'] = text
    hit['updatedAt'] = _iso()
    _write_categories(items)
    # 分类改名：把用了旧名的资产一起改过去，避免出现"孤儿分类"
    if old != text:
        for asset in list_assets(limit=10000):
            if str(asset.get('category') or '') == old:
                write_asset({**asset, 'category': text})
    return hit


def delete_category(category_id: str) -> dict:
    items = list_categories()
    hit = next((x for x in items if x.get('id') == category_id), None)
    if not hit:
        raise AssetError('分类不存在。', 404)
    old = str(hit.get('name') or '').strip()
    items = [x for x in items if x.get('id') != category_id]
    _write_categories(items)
    # 分类删了，资产上留着的旧名就成了孤儿（列表里挂着一个已不存在的分类、按它筛还能命中）：
    # 一并清空回「未分类」。与 update_category 的改名同步对称。
    cleared = 0
    if old:
        for asset in list_assets(limit=10000):
            if str(asset.get('category') or '').strip() == old:
                write_asset({**asset, 'category': ''})
                cleared += 1
    return {'id': category_id, 'removed': True, 'uncategorized': cleared}


# --------------------------------------------------------------------------- #
# asset 读写
# --------------------------------------------------------------------------- #
def _parse_md(text: str) -> tuple[dict, str]:
    """解析 asset.md → (frontmatter, 正文)。没有 frontmatter 时返回 ({}, 全文)。"""
    body = text
    meta: dict = {}
    if text.startswith('---'):
        parts = text.split('\n---', 1)
        if len(parts) == 2:
            raw = parts[0][3:].strip()
            body = parts[1]
            if body.startswith('\n'):
                body = body[1:]
            try:
                loaded = yaml.safe_load(raw)
                if isinstance(loaded, dict):
                    meta = loaded
            except yaml.YAMLError:
                meta = {}
    return meta, body.strip('\n')


def _dump_md(meta: dict, body: str) -> str:
    front = yaml.safe_dump(meta, allow_unicode=True, sort_keys=False, default_flow_style=False).strip()
    return f'---\n{front}\n---\n\n{body.strip()}\n'


def _shape(meta: dict, body: str, folder: str) -> dict:
    def _list(key):
        value = meta.get(key)
        if isinstance(value, list):
            return [str(x).strip() for x in value if str(x).strip()]
        if isinstance(value, str) and value.strip():
            return [p.strip() for p in value.split(',') if p.strip()]
        return []

    cover = str(meta.get('cover') or '').strip()
    raw_attrs = meta.get('attributes')
    attributes = {}
    if isinstance(raw_attrs, dict):
        attributes = {str(k).strip(): str(v).strip() for k, v in raw_attrs.items()
                      if str(k).strip() and str(v).strip()}
    return {
        'id': str(meta.get('id') or ''),
        'folder': folder,
        'title': str(meta.get('title') or folder),
        'type': str(meta.get('type') or 'person').strip(),
        'category': str(meta.get('category') or '').strip(),
        'cover': cover,
        'tags': _list('tags'),
        'aliases': _list('aliases'),
        'attributes': attributes,
        'platform': str(meta.get('platform') or '').strip(),
        'description': body,
        'updated_at': str(meta.get('updatedAt') or ''),
    }


def read_asset(folder: str) -> dict:
    target = _safe_rel(folder)
    if target is None:
        raise AssetError('资产路径不合法。')
    md = target / 'asset.md'
    if not md.exists():
        raise AssetError('资产不存在。', 404)
    meta, body = _parse_md(md.read_text(encoding='utf-8'))
    return _shape(meta, body, folder)


def list_assets(query: str = '', category: str = '', type_filter: str = '', limit: int = 500) -> list[dict]:
    if not LIBRARY.exists():
        return []
    items: list[dict] = []
    for entry in sorted(LIBRARY.iterdir(), key=lambda p: p.name):
        if not entry.is_dir() or entry.name.startswith('.'):
            continue
        if not (entry / 'asset.md').exists():
            continue
        try:
            items.append(read_asset(entry.name))
        except (AssetError, OSError):
            continue
    if category:
        items = [x for x in items if x['category'] == category]
    if type_filter:
        items = [x for x in items if x['type'] == type_filter]
    needle = str(query or '').strip().lower()   # 纯空格 = 不筛（注意 '' in s 恒为真，不能拿它当过滤条件）
    if needle:
        items = [
            x for x in items
            if needle in x['title'].lower()
            or needle in x['description'].lower()
            or any(needle in t.lower() for t in x['tags'] + x['aliases'])
        ]
    return items[: max(1, limit)]


def get_asset(identifier: str) -> dict:
    """按 id 或文件夹名定位。id 需要扫一遍（条目量小，可接受）。"""
    target = _safe_rel(identifier)
    if target is not None and (target / 'asset.md').exists():
        return read_asset(identifier)
    for item in list_assets(limit=10000):
        if item['id'] == identifier:
            return item
    raise AssetError('资产不存在。', 404)


def write_asset(item: dict) -> dict:
    """按 id 或 folder 更新既有资产；不存在则按 title 新建。返回最新形态。"""
    folder = str(item.get('folder') or '').strip()
    if folder:
        target = _safe_rel(folder)
        if target is None:
            raise AssetError('资产路径不合法。')
    else:
        title = str(item.get('title') or '').strip()
        if not title:
            raise AssetError('资产标题不能为空。')
        target = _asset_dir(_folder_name(title))
        if target.exists() and not item.get('id'):
            raise AssetError('已经有同名资产了，换个标题或直接编辑那条。', 409)

    meta: dict = {}
    md = target / 'asset.md'
    if md.exists():
        meta, _ = _parse_md(md.read_text(encoding='utf-8'))

    title = str(item.get('title') or meta.get('title') or target.name).strip()[:200]

    # 标题变了就同步重命名文件夹（文件夹名即资产名）；命名冲突时抛 409，不覆盖
    if folder and title and _folder_name(title) != target.name:
        target = _rename_asset_dir(target, title)
        md = target / 'asset.md'

    meta.update({
        'schema': SCHEMA,
        'id': str(meta.get('id') or item.get('id') or _new_id()),
        'title': title,
        'type': str(item.get('type') or meta.get('type') or 'person').strip(),
        'updatedAt': _iso(),
    })
    for key in ('category', 'platform'):
        if key in item:
            value = str(item.get(key) or '').strip()
            if value:
                meta[key] = value
            else:
                meta.pop(key, None)
    for key in ('tags', 'aliases'):
        if key in item:
            values = [str(x).strip() for x in (item.get(key) or []) if str(x).strip()][:30]
            if values:
                meta[key] = values
            else:
                meta.pop(key, None)
    if 'cover' in item:
        value = str(item.get('cover') or '').strip()
        if value:
            meta['cover'] = value
        else:
            meta.pop('cover', None)

    body = str(item.get('description') if item.get('description') is not None else '')
    if not body:
        _, body = _parse_md(md.read_text(encoding='utf-8')) if md.exists() else ({}, '')

    _atomic_write(md, _dump_md(meta, body))
    return read_asset(target.name)


def create_asset(item: dict) -> dict:
    payload = {k: v for k, v in item.items() if k != 'folder'}
    if not str(payload.get('title') or '').strip():
        raise AssetError('资产标题不能为空。')
    # 同名检测：给出明确提示而不是静默覆盖
    target = _asset_dir(_folder_name(str(payload['title'])))
    if (target / 'asset.md').exists():
        raise AssetError('已经有同名资产了，换个标题或直接编辑那条。', 409)
    return write_asset(payload)


def delete_asset(identifier: str) -> dict:
    item = get_asset(identifier)
    target = _safe_rel(item['folder'])
    if target is None or not target.exists():
        raise AssetError('资产不存在。', 404)
    LIBRARY_TRASH.mkdir(parents=True, exist_ok=True)
    dest = LIBRARY_TRASH / target.name
    if dest.exists():
        dest = LIBRARY_TRASH / f'{target.name}-{uuid.uuid4().hex[:6]}'
    try:
        shutil.move(str(target), str(dest))
    except OSError as exc:
        raise AssetError(f'删除失败：{exc}', 500) from exc
    return {'id': item['id'], 'folder': item['folder'], 'trashed': True}


def resolve_file(folder: str, filename: str) -> Path:
    """取资产文件夹内的文件（封面图等）。文件名只取末段，已挡路径穿越。"""
    target = _safe_rel(folder)
    if target is None:
        raise AssetError('资产路径不合法。')
    name = str(filename or '').replace('\\', '/').split('/')[-1]
    if not name or name.startswith('.'):
        raise AssetError('文件名不合法。')
    file = (target / name).resolve()
    root = LIBRARY.resolve()
    if file.parent != target.resolve() or root not in file.parents:
        raise AssetError('文件名不合法。')
    if not file.is_file():
        raise AssetError('文件不存在。', 404)
    return file


def library_status() -> dict:
    items = list_assets(limit=10000)
    counts: dict[str, int] = {}
    uncategorized = 0
    for x in items:
        if x['category']:
            counts[x['category']] = counts.get(x['category'], 0) + 1
        else:
            uncategorized += 1
    return {
        'total': len(items),
        'by_category': counts,
        'uncategorized': uncategorized,
        'categories': list_categories(),
        'types': ASSET_TYPES,
    }
