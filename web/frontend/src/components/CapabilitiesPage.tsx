import { useEffect, useState } from 'react';
import type { Page } from './Sidebar';

type Snapshot = {upstream_skills:number; extensions:{name:string; repository:string; license:string; version?:string; commit?:string}[]; gateway:boolean; accounts:{name:string; connected:boolean}[]; research:{saved_count:number}; postiz_online:boolean; postiz_channels:number|null; postiz_error:string; evidence:Record<string, {passed:boolean; detail:string}>; media:{name:string; configured:boolean}[]};
export default function CapabilitiesPage({onNavigate}:{onNavigate:(page:Page)=>void}) {
  const [data,setData] = useState<Snapshot|null>(null);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  async function refresh() {
    setBusy(true); setError('');
    try { const response=await fetch('/api/capabilities'); if(!response.ok) throw new Error('暂时无法读取能力状态'); setData(await response.json()); }
    catch(e) {setError((e as Error).message);} finally {setBusy(false);}
  }
  useEffect(()=>{void refresh();},[]);
  return <div className="model-page capability-page">
    <div className="model-heading"><div><span className="model-eyebrow">现有工具，组合成完整流程</span><h2>能力与集成</h2><p>从素材采集到制作、排期与复盘，直接使用成熟工具。账号和服务连接状态分别显示。</p></div><button className="btn" disabled={busy} onClick={refresh}>{busy?'检测中…':'刷新状态'}</button></div>
    {error && <div className="model-alert error" role="alert">{error}</div>}
    {data && <>
      <div className="capability-grid">
        <section><span className="capability-tag">{data.gateway?'运行中':'需要启动'}</span><h3>Easel 完整技能库</h3><p>保留上游全部 {data.upstream_skills} 项技能。热点、画像、选题、文案、卡片、音视频、平台适配与复盘共用同一套内容资产。</p><button className="btn" onClick={()=>onNavigate('skills')}>浏览技能</button><button className="btn" onClick={()=>onNavigate('model-settings')}>订阅模型设置</button></section>
        <section><span className="capability-tag">已保存 {data.research.saved_count} 条素材</span><h3>社区调研与知识库</h3><p>CloakBrowser 控制访问频率，Baoyu 提取正文，Mozilla Readability 采集当前页与选区。FreshRSS 负责公开 RSS / Atom 订阅、更新归档与分类。素材可接选题、评论洞察和四平台改写。</p><button className="btn" onClick={()=>onNavigate('research')}>开始调研</button><a className="btn" href="http://localhost:8089/" target="_blank" rel="noreferrer">打开订阅库 ↗</a></section>
        <section><span className="capability-tag">{data.postiz_online?`API 已连接 · ${data.postiz_channels} 个频道`:'服务尚未就绪'}</span><h3>Postiz 多平台发布与排期</h3><p>复用独立部署的 Postiz：内容日历、渠道管理、媒体上传、定时队列和数据分析。海外平台需各自授权，API 平台还需要开发者应用配置。</p>{data.postiz_error && <p role="status">{data.postiz_error}</p>}<a className="btn" href="http://localhost:4007/" target="_blank" rel="noreferrer">打开 Postiz ↗</a><a className="capability-link" href="http://localhost:8088/" target="_blank" rel="noreferrer">查看任务队列 ↗</a></section>
        <section><span className="capability-tag">已保存登录态 {data.accounts.filter(a=>a.connected).length}/{data.accounts.length}</span><h3>国内平台与公众号排版</h3><p>{data.accounts.map(a=>a.name).join('、')}沿用 Easel 已有适配器。公众号排版与草稿、X 长文复用 Baoyu；正式发布前检查成稿与登录态是否仍有效。</p><button className="btn" onClick={()=>onNavigate('accounts')}>连接账号</button><button className="btn" onClick={()=>onNavigate('publish')}>发布中心</button><button className="btn" onClick={()=>onNavigate('wechat')}>公众号工作区</button></section>
      </div>
      <section className="capability-evidence"><h3>实测记录</h3>{Object.keys(data.evidence).length ? Object.entries(data.evidence).map(([key,item])=><p key={key}><b>{item.passed?'已验证':'待处理'} · {key}</b><span>{item.detail}</span></p>):<p>正在进行完整流程验收，结果会记录在这里。</p>}<p><b>外部媒体服务</b><span>{data.media.map(m=>`${m.name}：${m.configured?'已配置，调用前确认':'未配置'}`).join('；')}。本地卡片渲染与媒体处理可独立使用。</span></p></section>
      <section className="capability-evidence"><h3>扩展来源</h3><p>版本和许可证随项目保存，更新时可以核对来源。</p>{data.extensions.map(item=><div className="capability-source" key={item.name}><a href={item.repository} target="_blank" rel="noreferrer">{item.name} ↗</a><span>{item.license} · {item.version || item.commit?.slice(0,8)}</span></div>)}</section>
    </>}
  </div>;
}
