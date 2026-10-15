// 用法: node render.js 输入.md 输出目录 [--name 昵称] [--date YYYY-MM-DD] [--wm 水印] [--avatar 图片]
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const a=process.argv.slice(2);const opt={name:'做科研的Meta师兄',date:new Date().toISOString().slice(0,10),wm:'',avatar:''};
const pos=[];for(let i=0;i<a.length;i++){if(a[i].startsWith('--'))opt[a[i].slice(2)]=a[++i];else pos.push(a[i]);}
const [inp,out]=pos;if(!inp||!out){console.log('node render.js 输入.md 输出目录 [--name 昵称] [--date 日期] [--wm 水印]');process.exit(1);}
fs.mkdirSync(out,{recursive:true});
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
const inl=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/==(.+?)==/g,'<mark>$1</mark>');
const blocks=fs.readFileSync(inp,'utf8').split(/\n\s*\n/).map(b=>b.trim()).filter(b=>b&&b!=='---').map(b=>{
  const m=b.match(/^#{1,6}\s+(.*)$/s);return m?{h:1,html:inl(m[1])}:{h:0,html:inl(b),raw:b};});
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:400,height:534},deviceScaleFactor:2.7});
await p.setContent(fs.readFileSync(path.join(__dirname,'template.html'),'utf8'));
if(!opt.avatar)opt.avatar=require('path').join(__dirname,'assets/avatar-square.png');const av=opt.avatar&&fs.existsSync(opt.avatar)?'data:image/png;base64,'+fs.readFileSync(opt.avatar).toString('base64'):'';
const n=await p.evaluate(({blocks,opt,av})=>{
 const head=`<div class="head"><div class="av">${av?`<img src="${av}">`:''}</div><div><div class="name">${opt.name}</div><div class="date">${opt.date}</div></div></div>`;
 const wm=opt.wm?`<div class="wm">${opt.wm}</div>`:'';
 let pages=[],cur,body;const fits=()=>body.scrollHeight<=body.clientHeight+0.5;
 const newPage=()=>{cur=document.createElement('div');cur.className='page';cur.innerHTML=(pages.length?'':head)+'<div class="body"></div>'+wm;document.body.appendChild(cur);body=cur.querySelector('.body');pages.push(cur);};
 newPage();const q=[...blocks];
 while(q.length){const b=q.shift();const el=document.createElement('p');if(b.h)el.className='h';el.innerHTML=b.html;body.appendChild(el);
  if(fits())continue;
  const prev=body.children.length>1;
  // 标题不落在页底：标题后紧跟的内容一起挪
  if(!b.h&&!b.split&&b.raw){ // 长段落按句子切开，前半留在本页
   const s=b.raw.match(/[^。！？；]+[。！？；]?/g)||[b.raw];let k=s.length-1;
   while(k>0){el.innerHTML=s.slice(0,k).join('');if(fits())break;k--;}
   if(k>0&&s.length>1){const rest=s.slice(k).join('');q.unshift({h:0,html:rest,raw:rest,split:1});
     const last=body.children[body.children.length-2];newPage();continue;}
  }
  el.remove();
  const last=body.lastElementChild;if(last&&last.className==='h'&&prev){last.remove();q.unshift(b);newPage();body.appendChild(last);continue;}
  if(!prev){body.appendChild(el);newPage();continue;}
  q.unshift(b);newPage();}
 pages.forEach((pg,i)=>pg.id='pg'+i);return pages.length;},{blocks,opt,av});
await p.evaluate(()=>document.fonts.ready);
for(let i=0;i<n;i++){const f=path.join(out,`card-${String(i+1).padStart(2,'0')}.png`);const r=await p.$eval('#pg'+i,e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y+window.scrollY}});await p.setViewportSize({width:400,height:Math.ceil(r.y+540)});await p.screenshot({path:f,clip:{x:r.x,y:r.y,width:400,height:1441/2.7}});console.log(f);}
await br.close();require('child_process').execSync(`python3 -c "import sys,glob;from PIL import Image\n[Image.open(f).convert('RGB').resize((1080,1440),Image.LANCZOS).save(f) for f in glob.glob(sys.argv[1]+'/card-*.png')]" '${out}'`);})();
