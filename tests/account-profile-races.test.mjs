import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
const require = createRequire(new URL('../web/frontend/package.json', import.meta.url));
const ts = require('typescript');
const code = ts.transpileModule(readFileSync(new URL('../web/frontend/src/components/AccountProfilePanel.tsx', import.meta.url),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const deferred = () => {let resolve; const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const profile = (version, content='original', name='A') => ({name,homepage_url:'',user_input:{intent:''},evidence:[],suggestion:null,active:{version,content},latest_job_id:null});
function mount(api, props={}) {
  let slots=[], index=0, effects=[], tree, dirty=true;
  const react={useState(initial){const i=index++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;dirty=true;}];},useRef(initial){const i=index++;return slots[i]??(slots[i]={current:initial});},useEffect(fn,deps){const i=index++;const previous=slots[i];if(!previous || deps.some((d,n)=>d!==previous.deps[n])){effects.push(()=>{previous?.cleanup?.();slots[i]={deps,cleanup:fn()};});}}};
  const exports={};
  vm.runInNewContext(code,{exports,require(name){if(name==='react')return react;if(name==='react/jsx-runtime')return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'fragment'};if(name.includes('/api'))return api;if(name.includes('sanitize'))return {renderMarkdown:x=>x};return {};},setTimeout:()=>0,clearTimeout(){},window:{confirm:()=>true}});
  const render=()=>{index=0;dirty=false;tree=exports.default(props);const pending=effects;effects=[];pending.forEach(fn=>fn());};
  const nodes=()=>{let out=[];function walk(n){if(!n||typeof n!=='object')return;if(Array.isArray(n)){n.forEach(walk);return;}out.push(n);walk(n.props?.children);}walk(tree);return out;};
  const text=n=> (typeof n==='string'||typeof n==='number')?String(n):Array.isArray(n)?n.map(text).join(''):n?.props?text(n.props.children):'';
  return {async settle(){for(let i=0;i<12;i++){if(dirty)render();await new Promise(r=>setImmediate(r));}},find(type,label){return nodes().find(n=>n.type===type && (label===undefined || text(n).includes(label) || n.props['aria-label']===label));},input(placeholder,value){nodes().find(n=>n.type==='input' && n.props.placeholder===placeholder).props.onChange({target:{value}});},click(label){const n=this.find('button',label);assert.ok(n, label);n.props.onClick();},setProps(value){props=value;dirty=true;},text(){return text(tree);}};
}
test('changing homepage clears prior selection and rejects late capture from the previous URL',async()=>{
 const first=deferred();let calls=0;
 const ui=mount({fetchAccountSources:async()=>[],captureAccountSource:()=>++calls===1?Promise.resolve({id:'a',title:'A',state:'saved',content:'A',method:'capture'}):first.promise});
 await ui.settle();ui.input('https://…','https://a.test');await ui.settle();ui.click('读取主页资料');await ui.settle();assert.match(ui.text(),/所选 1/);
 ui.input('https://…','https://b.test');await ui.settle();assert.match(ui.text(),/所选 0/);
 ui.click('读取主页资料');await ui.settle();ui.input('https://…','https://c.test');await ui.settle();first.resolve({id:'b',title:'B',state:'saved',content:'B',method:'capture'});await ui.settle();assert.match(ui.text(),/所选 0/);assert.equal(ui.find('button','确认资料范围').props.disabled,true);
});
test('analysis refresh cannot advance the editing version and bypass a concurrent-write conflict',async()=>{
 let reads=0,sent;
 const ui=mount({fetchAccountProfile:async()=>++reads===1?profile(1):profile(2,'other window'),analyzeAccountProfile:async()=>({job_id:'j',name:'A',status:'queued'}),fetchAccountProfileJob:async()=>({job_id:'j',name:'A',status:'succeeded'}),adoptAccountProfile:async(name,content,version)=>{sent={name,content,version};throw Error('409 version conflict');}},{persona:'A'});
 await ui.settle();ui.find('textarea','当前采用文案').props.onChange({target:{value:'my edit'}});await ui.settle();ui.click('重新分析资料');await ui.settle();assert.match(ui.text(),/编辑基于版本 1/);assert.match(ui.text(),/已有新版本/);ui.click('确认采用此版本');await ui.settle();assert.deepEqual(sent,{name:'A',content:'my edit',version:1});assert.match(ui.text(),/409 version conflict/);
});
test('late mutation for a previous persona cannot overwrite the newly selected profile',async()=>{
 const save=deferred();
 const ui=mount({fetchAccountProfile:async name=>profile(1,name,name),adoptAccountProfile:()=>save.promise},{persona:'A'});
 await ui.settle();ui.find('textarea','当前采用文案').props.onChange({target:{value:'edited A'}});await ui.settle();ui.click('确认采用此版本');await ui.settle();ui.setProps({persona:'B'});await ui.settle();save.resolve({content:'edited A',version:2});await ui.settle();assert.equal(ui.find('textarea','当前采用文案').props.value,'B');assert.match(ui.text(),/编辑基于版本 1/);assert.doesNotMatch(ui.text(),/已确认采用/);
});

