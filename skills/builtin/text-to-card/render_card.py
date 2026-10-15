# 文字卡片渲染（render.js 的 Python 版，给 Windows 工作台用，样式同 template.html）
# 用法: python render_card.py 输入.md 输出目录 [--name 昵称] [--date YYYY-MM-DD] [--wm 水印] [--avatar 图片]
# 输出 card-01.png… 每张 1080x1440；空行分段，# 标题加粗，**加粗**，==高亮==
import sys, re, base64, datetime, pathlib, html, json
from playwright.sync_api import sync_playwright
from PIL import Image

# Step1. 读参数
here = pathlib.Path(__file__).resolve().parent
opt = {"name": "做科研的Meta师兄", "date": datetime.date.today().isoformat(), "wm": "", "avatar": ""}
pos, a, i = [], sys.argv[1:], 0
while i < len(a):
    if a[i].startswith("--"): opt[a[i][2:]] = a[i + 1]; i += 2
    else: pos.append(a[i]); i += 1
if len(pos) < 2: sys.exit(__doc__ or "python render_card.py 输入.md 输出目录")
inp, out = pathlib.Path(pos[0]), pathlib.Path(pos[1]); out.mkdir(parents=True, exist_ok=True)

# Step2. 切段落，转行内样式
def inl(s): return re.sub(r"==(.+?)==", r"<mark>\1</mark>", re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s.replace("&", "&amp;").replace("<", "&lt;")))
blocks = []
for b in re.split(r"\n\s*\n", inp.read_text(encoding="utf-8")):
    b = b.strip()
    if not b or b == "---": continue
    m = re.match(r"^#{1,6}\s+(.*)$", b, re.S)
    blocks.append({"h": 1, "html": inl(m.group(1)), "raw": b} if m else {"h": 0, "html": inl(b), "raw": b})
av_path = pathlib.Path(opt["avatar"]) if opt["avatar"] else here / "assets" / "avatar-square.png"
av = "data:image/png;base64," + base64.b64encode(av_path.read_bytes()).decode() if av_path.exists() else ""

# Step3. 在浏览器里排版分页（逻辑与 render.js 相同）
JS = r"""({blocks,opt,av})=>{
 const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const inline=s=>escape(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/==(.+?)==/g,'<mark>$1</mark>');
 const head=`<div class="head"><div class="av">${av?`<img src="${av}">`:''}</div><div><div class="name">${opt.name}</div><div class="date">${opt.date}</div></div></div>`;
 const wm=opt.wm?`<div class="wm">${opt.wm}</div>`:'';
 let pages=[],cur,body;const fits=()=>body.scrollHeight<=body.clientHeight+0.5;
 const newPage=()=>{if(pages.length>=30)throw Error('卡片超过 30 张，请缩短稿件');cur=document.createElement('div');cur.className='page';cur.innerHTML=(pages.length||opt.continuation==='1'?'':head)+'<div class="body"></div>'+wm;document.body.appendChild(cur);body=cur.querySelector('.body');pages.push(cur);};
 newPage();const q=[...blocks];
 while(q.length){const b=q.shift();const el=document.createElement('p');if(b.h)el.className='h';el.innerHTML=b.html;el.dataset.raw=b.raw;body.appendChild(el);
  if(fits())continue;
  if(opt.single==='1')throw Error('内容超出一张卡，请缩短后重试');
  const prev=body.children.length>1;
  if(!b.h&&!b.split&&b.raw){const s=b.raw.match(/[^。！？；]+[。！？；]?/g)||[b.raw];let k=s.length-1;
   while(k>0){el.innerHTML=inline(s.slice(0,k).join(''));if(fits())break;k--;}
   if(k>0&&s.length>1){el.dataset.raw=s.slice(0,k).join('');const rest=s.slice(k).join('');q.unshift({h:0,html:inline(rest),raw:rest,split:1});newPage();continue;}}
  el.remove();
  const last=body.lastElementChild;if(last&&last.className==='h'&&prev){last.remove();q.unshift(b);newPage();body.appendChild(last);continue;}
  if(!prev){throw Error('单段内容超出一张卡，请增加空行分段');}
  q.unshift(b);newPage();}
 pages.forEach((pg,i)=>pg.id='pg'+i);return pages.length;}"""
with sync_playwright() as p:
    try: br = p.chromium.launch()
    except Exception: br = p.chromium.launch(channel="chrome")  # 没装 Playwright 自带浏览器时用本机 Chrome
    pg = br.new_page(viewport={"width": 400, "height": 534}, device_scale_factor=2.7)
    pg.set_content((here / "template.html").read_text(encoding="utf-8"))
    n = pg.evaluate(JS, {"blocks": blocks, "opt": opt, "av": av})
    pg.evaluate("document.fonts.ready")
    files = []
    manifest = []
    for k in range(n):
        f = out / f"card-{k + 1:02d}.png"
        r = pg.eval_on_selector(f"#pg{k}", "e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y+window.scrollY}}")
        pg.set_viewport_size({"width": 400, "height": int(r["y"] + 540)})
        pg.screenshot(path=str(f), clip={"x": r["x"], "y": r["y"], "width": 400, "height": 1441 / 2.7})
        files.append(f)
        manifest.append({"file": f.name, "text": pg.eval_on_selector(f"#pg{k} .body", "e=>Array.from(e.children).map(p=>p.dataset.raw||p.innerText).join('\\n\\n')")})
    br.close()

# Step4. 统一缩放到 1080x1440
for f in files:
    Image.open(f).convert("RGB").resize((1080, 1440), Image.LANCZOS).save(f); print(f)
print(f"共 {len(files)} 张")
if opt.get("manifest"):
    pathlib.Path(opt["manifest"]).write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
