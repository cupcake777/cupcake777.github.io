import { useState, useEffect, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const MOODS = [
  { label:"开心", emoji:"😸", color:"#f6a623", val:5 },
  { label:"平静", emoji:"😺", color:"#5bc0eb", val:4 },
  { label:"充能", emoji:"😼", color:"#6bcb77", val:5 },
  { label:"疲惫", emoji:"😿", color:"#a0b4c8", val:2 },
  { label:"焦虑", emoji:"🙀", color:"#c9b1d9", val:2 },
  { label:"烦躁", emoji:"😾", color:"#e87c7c", val:1 },
];
const MENTAL   = ["🌟 满血复活","✨ 还不错","🌤 一般般","🌧 有点低落","⛈ 快撑不住了"];
const PHYSICAL = ["💪 精力充沛","🙂 状态良好","😐 还可以","😮‍💨 有点累","😵 超级疲惫"];
const STAGES   = ["本科生","硕士生","博士生","博士后","教职/研究员","其他研究者"];
const CAT_AVATARS = ["🐱","🐈","🐈‍⬛","😺","😸","😻","🙀","😼"];

const SK = { records:"catjournal-records", digests:"catjournal-digests", research:"catjournal-research", profile:"catjournal-profile" };

// ─── Storage ──────────────────────────────────────────────────────────────────
const db = {
  load: async k => { try { const r=await window.storage.get(k); return r?JSON.parse(r.value):null; } catch { return null; } },
  save: async (k,v) => { try { await window.storage.set(k,JSON.stringify(v)); } catch {} },
};
const PROFILE_DEFAULT = { name:"", avatar:"🐱", stage:"博士生", field:"", institution:"", workStyle:"", stressors:"", goals:"", setupDone:false };
const RESEARCH_DEFAULT = { topic:"", description:"", blockers:[], inspirations:[], aiAdvice:[] };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad2    = n => String(n).padStart(2,"0");
const fmt     = ts => { const d=new Date(ts); return `${d.getMonth()+1}/${d.getDate()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const fmtDate = ts => { const d=new Date(ts); return `${d.getMonth()+1}月${d.getDate()}日`; };
const dayKey  = ts => { const d=new Date(ts); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; };
const today   = ()  => dayKey(Date.now());
const weekNum = ts  => { const d=new Date(ts),j=new Date(d.getFullYear(),0,1); return `${d.getFullYear()}-W${Math.ceil(((d-j)/864e5+j.getDay()+1)/7)}`; };
const monthKey= ts  => { const d=new Date(ts); return `${d.getFullYear()}-${d.getMonth()+1}`; };
const weekStart=ts  => { const d=new Date(ts),day=d.getDay(),diff=day===0?-6:1-day; d.setDate(d.getDate()+diff); d.setHours(0,0,0,0); return d; };
const mentalVal=s   => { const i=MENTAL.indexOf(s);   return i<0?3:[5,4,3,2,1][i]; };
const physVal  =s   => { const i=PHYSICAL.indexOf(s); return i<0?3:[5,4,3,2,1][i]; };
const uid      =()  => Date.now().toString(36)+Math.random().toString(36).slice(2,6);

// ─── AI Context Builder — single source of truth ──────────────────────────────
function buildCtx(profile, research, records) {
  const lines = [];
  if (profile?.name)        lines.push(`【饲养对象】${profile.name}，${profile.stage}，研究领域：${profile.field||"未填写"}，所在机构：${profile.institution||"未填写"}`);
  if (profile?.workStyle)   lines.push(`【工作风格】${profile.workStyle}`);
  if (profile?.stressors)   lines.push(`【压力来源】${profile.stressors}`);
  if (profile?.goals)       lines.push(`【长期目标】${profile.goals}`);
  if (research?.topic)      lines.push(`【研究课题】${research.topic}${research.description?" — "+research.description:""}`);
  const activeB = (research?.blockers||[]).filter(b=>!b.resolved).map(b=>b.text);
  if (activeB.length)       lines.push(`【当前卡点】${activeB.join("；")}`);
  const recentInspo = (research?.inspirations||[]).filter(i=>i.starred).slice(0,3).map(i=>i.text);
  if (recentInspo.length)   lines.push(`【近期灵感】${recentInspo.join("；")}`);
  if (records?.length) {
    const hist = records.slice(-20).map(r=>`[${fmt(r.ts)}] 活动:${r.activity}|心情:${r.mood?.label}|精神:${r.mental}|身体:${r.physical}|计划:${r.nextPlan}`).join("\n");
    lines.push(`【近期记录（最新${Math.min(records.length,20)}条）】\n${hist}`);
  }
  return lines.join("\n");
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=DM+Mono:ital@0;1&display=swap');
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  body{margin:0;background:#f7efe6;}
  ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:#d9c4ae;border-radius:4px;}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
  @keyframes popIn{0%{opacity:0;transform:scale(.85)}100%{opacity:1;transform:scale(1)}}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .btn-hover:hover{opacity:.88;transform:translateY(-1px);}
  .card-hover:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(160,120,80,0.18)!important;}
  .tab-bar{position:fixed;bottom:0;left:0;right:0;background:rgba(253,244,236,0.95);backdrop-filter:blur(20px);border-top:1px solid rgba(196,168,130,0.2);display:flex;z-index:100;padding-bottom:env(safe-area-inset-bottom,0px);}
  input,textarea,button{font-family:inherit;}
`;

// ─── Design tokens ────────────────────────────────────────────────────────────
const serif = "'Noto Serif SC',serif";
const mono  = "DM Mono,monospace";
const accent = "#c4a882";
const accentDark = "#7a5c45";
const textMain = "#5c4033";
const textMid  = "#9e8472";
const textLight= "#b0a090";
const surface  = "rgba(255,255,255,0.88)";
const border   = "rgba(196,168,130,0.22)";

// ─── Atoms ────────────────────────────────────────────────────────────────────
function Dots() {
  return <span style={{display:"inline-flex",gap:3,alignItems:"center",verticalAlign:"middle"}}>
    {[0,1,2].map(i=><span key={i} style={{width:5,height:5,borderRadius:"50%",background:accent,animation:`bounce 1.2s ease-in-out ${i*.2}s infinite`}}/>)}
  </span>;
}
function Card({children,style={},onClick,className=""}) {
  return <div onClick={onClick} className={className}
    style={{background:surface,backdropFilter:"blur(18px)",borderRadius:22,border:`1px solid ${border}`,boxShadow:"0 6px 28px rgba(160,120,80,0.10)",transition:"transform .18s,box-shadow .18s",...style}}>
    {children}
  </div>;
}
function Tag({icon="",label,color=accent}) {
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:`${color}18`,border:`1px solid ${color}44`,borderRadius:20,padding:"3px 11px",fontSize:12,color,fontFamily:"sans-serif",whiteSpace:"nowrap"}}>{icon&&<span>{icon}</span>}{label}</span>;
}
function SecTitle({icon,title,right}) {
  return <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
    <span style={{fontSize:20}}>{icon}</span>
    <h3 style={{fontFamily:serif,color:textMain,margin:0,fontSize:15,flex:1,fontWeight:600}}>{title}</h3>
    {right&&<div>{right}</div>}
  </div>;
}
function Skeleton({h=13,w="100%",r=8,style={}}) {
  return <div style={{height:h,width:w,borderRadius:r,background:"linear-gradient(90deg,#f0e6d8 25%,#fdf4ec 50%,#f0e6d8 75%)",backgroundSize:"400px 100%",animation:"shimmer 1.4s infinite",...style}}/>;
}
function FieldLabel({children}) {
  return <div style={{fontSize:12,color:textMid,fontFamily:"sans-serif",marginBottom:6,fontWeight:600,letterSpacing:".03em"}}>{children}</div>;
}
function TextInput({value,onChange,placeholder,style={}}) {
  return <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{width:"100%",borderRadius:12,border:`2px solid #e8d5c0`,padding:"10px 13px",fontSize:14,fontFamily:"sans-serif",outline:"none",background:"#fdf8f4",color:textMain,boxSizing:"border-box",transition:"border-color .2s",...style}}
    onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor="#e8d5c0"}/>;
}
function TextArea({value,onChange,placeholder,rows=3,style={}}) {
  return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{width:"100%",borderRadius:14,border:"2px solid #e8d5c0",padding:"11px 14px",fontSize:14,fontFamily:"sans-serif",outline:"none",background:"#fdf8f4",color:textMain,resize:"none",lineHeight:1.65,boxSizing:"border-box",transition:"border-color .2s",...style}}
    onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor="#e8d5c0"}/>;
}
function PrimaryBtn({onClick,disabled,children,style={},full}) {
  return <button onClick={onClick} disabled={disabled} className={disabled?"":"btn-hover"}
    style={{width:full?"100%":undefined,borderRadius:14,border:"none",background:disabled?"#e8d5c0":"linear-gradient(135deg,#c4a882,#e8b89a)",color:disabled?"#b0a090":"white",fontSize:14,cursor:disabled?"not-allowed":"pointer",fontFamily:serif,fontWeight:600,padding:"12px 20px",transition:"all .2s",letterSpacing:".02em",...style}}>
    {children}
  </button>;
}
function GhostBtn({onClick,children,style={}}) {
  return <button onClick={onClick} className="btn-hover"
    style={{borderRadius:12,border:"2px solid #e8d5c0",background:"transparent",color:accentDark,fontSize:13,cursor:"pointer",fontFamily:"sans-serif",padding:"9px 16px",transition:"all .2s",...style}}>
    {children}
  </button>;
}
function DangerBtn({onClick,children}) {
  return <button onClick={onClick} className="btn-hover"
    style={{borderRadius:10,border:"1px solid #f5c8c8",background:"#fff5f5",color:"#c05050",fontSize:12,cursor:"pointer",fontFamily:"sans-serif",padding:"6px 12px",transition:"all .2s"}}>
    {children}
  </button>;
}
function Divider() {
  return <div style={{height:1,background:"linear-gradient(90deg,transparent,#e8d5c0,transparent)",margin:"16px 0"}}/>;
}

// ─── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({data,height=54,color=accent}) {
  if(!data||data.length<2) return <div style={{height,display:"flex",alignItems:"center",justifyContent:"center",color:accent,fontSize:12,fontFamily:"sans-serif"}}>数据积累中…</div>;
  const W=300,min=1,max=5,pad=8;
  const xs=data.map((_,i)=>pad+(i/(data.length-1))*(W-pad*2));
  const ys=data.map(v=>height-pad-(v-min)/(max-min)*(height-pad*2));
  const path=xs.map((x,i)=>`${i===0?"M":"L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area=`${path} L${xs[xs.length-1].toFixed(1)},${height} L${xs[0].toFixed(1)},${height} Z`;
  return <svg width="100%" viewBox={`0 0 ${W} ${height}`} style={{overflow:"visible"}}>
    <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".3"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
    <path d={area} fill="url(#sg)"/>
    <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    {xs.map((x,i)=><circle key={i} cx={x} cy={ys[i]} r={i===data.length-1?4.5:2.5} fill={i===data.length-1?color:"white"} stroke={color} strokeWidth="1.8"/>)}
  </svg>;
}

// ─── Heatmap ───────────────────────────────────────────────────────────────────
function HeatmapRow({records,weeks=10}) {
  const now=new Date(); now.setHours(23,59,59,999);
  const start=new Date(now); start.setDate(start.getDate()-weeks*7+1); start.setHours(0,0,0,0);
  const byDay={};
  records.forEach(r=>{ const k=dayKey(r.ts); if(!byDay[k])byDay[k]=[]; byDay[k].push(r); });
  const days=[]; for(let d=new Date(start);d<=now;d.setDate(d.getDate()+1)) days.push(dayKey(+d));
  const cols=[]; let col=[];
  days.forEach((d,i)=>{ col.push(d); if(col.length===7||(i===days.length-1)){cols.push(col);col=[];} });
  const COLORS=["#f0e6d8","#f5d4a8","#e8b89a","#c4a882","#8a6848"];
  const lvl=recs=>!recs?.length?0:Math.min(4,Math.ceil(recs.reduce((s,r)=>s+(r.mood?.val||3),0)/recs.length));
  return <div style={{display:"flex",gap:3,overflowX:"auto",paddingBottom:2}}>
    {cols.map((c,ci)=><div key={ci} style={{display:"flex",flexDirection:"column",gap:3}}>
      {c.map(d=><div key={d} title={`${d}${byDay[d]?` · ${byDay[d].length}次`:""}`}
        style={{width:11,height:11,borderRadius:2,background:COLORS[lvl(byDay[d])],flexShrink:0,cursor:"default"}}/>)}
    </div>)}
  </div>;
}

// ─── Bottom Nav ────────────────────────────────────────────────────────────────
function BottomNav({active,onNav,hasProfile}) {
  const tabs=[
    {key:"home",    icon:"🏠", label:"主页"},
    {key:"research",icon:"🔬", label:"研究"},
    {key:"digest",  icon:"📊", label:"报告"},
    {key:"history", icon:"📚", label:"档案"},
    {key:"profile", icon:"🐾", label:"档案", badge:!hasProfile},
  ];
  // rename last one
  tabs[4].label = "猫咪";
  return <nav className="tab-bar">
    {tabs.map(t=>(
      <button key={t.key} onClick={()=>onNav(t.key)} style={{flex:1,padding:"9px 0 7px",border:"none",background:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}}>
        <span style={{fontSize:21,lineHeight:1,filter:active===t.key?"none":"grayscale(30%)",opacity:active===t.key?1:.55,transition:"all .2s"}}>{t.icon}</span>
        <span style={{fontSize:10,color:active===t.key?accentDark:textMid,fontFamily:"sans-serif",fontWeight:active===t.key?700:400,transition:"color .2s"}}>{t.label}</span>
        {active===t.key&&<div style={{position:"absolute",bottom:0,width:20,height:2.5,borderRadius:2,background:accent}}/>}
        {t.badge&&<div style={{position:"absolute",top:6,right:"50%",marginRight:-14,width:7,height:7,borderRadius:"50%",background:"#e87c7c",border:"1.5px solid white"}}/>}
      </button>
    ))}
  </nav>;
}

// ─── Onboarding ────────────────────────────────────────────────────────────────
function Onboarding({onComplete}) {
  const [step,setStep]=useState(0);
  const [p,setP]=useState({...PROFILE_DEFAULT});
  const up=patch=>setP(prev=>({...prev,...patch}));

  const steps=[
    { title:"欢迎来到猫猫饲养日志 🐱", sub:"让饲养员先认识一下你~", content:
      <div style={{animation:"popIn .3s ease-out"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:72,animation:"float 3s ease-in-out infinite"}}>🐱</div>
          <p style={{color:textMid,fontSize:14,fontFamily:"sans-serif",lineHeight:1.7,marginTop:12}}>这是一个专属于你的<strong style={{color:accentDark}}>每日签到 & 研究陪伴</strong>应用。饲养员会关注你的状态、帮你整理研究思路、在你疲惫时鼓励你。</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[["📋","每日签到"],["🔬","研究方向"],["📊","周/月报告"],["💌","AI陪伴"]].map(([i,l])=>(
            <div key={l} style={{background:"#f5ede4",borderRadius:14,padding:"12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:20}}>{i}</span><span style={{fontSize:13,color:accentDark,fontFamily:"sans-serif"}}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    },
    { title:"你叫什么名字？", sub:"饲养员想叫你的名字~", required:true, content:
      <div>
        <FieldLabel>你的名字或昵称 *</FieldLabel>
        <TextInput value={p.name} onChange={v=>up({name:v})} placeholder="随便什么都行，饲养员只叫你这个"/>
        <div style={{marginTop:16}}>
          <FieldLabel>选一个你喜欢的猫咪头像</FieldLabel>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {CAT_AVATARS.map(a=>(
              <button key={a} onClick={()=>up({avatar:a})} style={{width:48,height:48,borderRadius:14,border:`2px solid ${p.avatar===a?accent:"#e8d5c0"}`,background:p.avatar===a?"#f5ede4":"#fdf8f4",fontSize:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",transform:p.avatar===a?"scale(1.1)":"scale(1)"}}>
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>
    },
    { title:"你目前的身份是？", sub:"这能帮饲养员更懂你的压力", content:
      <div>
        <FieldLabel>学术阶段</FieldLabel>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {STAGES.map(s=>(
            <button key={s} onClick={()=>up({stage:s})} style={{padding:"11px 8px",borderRadius:13,border:`2px solid ${p.stage===s?accent:"#e8d5c0"}`,background:p.stage===s?"#f5ede4":"#fdf8f4",fontSize:13,color:textMain,cursor:"pointer",fontFamily:"sans-serif",transition:"all .2s",fontWeight:p.stage===s?600:400}}>
              {s}
            </button>
          ))}
        </div>
        <FieldLabel>研究领域（大方向就行）</FieldLabel>
        <TextInput value={p.field} onChange={v=>up({field:v})} placeholder="如：计算机视觉 / 分子生物学 / 教育学…"/>
        <div style={{marginTop:12}}>
          <FieldLabel>所在机构（可选）</FieldLabel>
          <TextInput value={p.institution} onChange={v=>up({institution:v})} placeholder="大学/研究所名称"/>
        </div>
      </div>
    },
    { title:"告诉饲养员更多 🐾", sub:"这些能让AI的回应更有针对性（可跳过）", content:
      <div>
        <FieldLabel>你的工作风格</FieldLabel>
        <TextArea value={p.workStyle} onChange={v=>up({workStyle:v})} placeholder="比如：喜欢深夜工作/容易拖延/做事追求完美…" rows={2}/>
        <div style={{marginTop:12}}>
          <FieldLabel>主要压力来源</FieldLabel>
          <TextArea value={p.stressors} onChange={v=>up({stressors:v})} placeholder="比如：论文进展/导师关系/毕业压力/社交焦虑…" rows={2}/>
        </div>
        <div style={{marginTop:12}}>
          <FieldLabel>你的长期目标</FieldLabel>
          <TextArea value={p.goals} onChange={v=>up({goals:v})} placeholder="比如：毕业后去工业界/申请博士/做出有影响力的研究…" rows={2}/>
        </div>
      </div>
    },
  ];

  const cur=steps[step];
  const canNext=!cur.required || (step===1?p.name.trim().length>0:true);

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#fdf4ec,#f5e6d8,#ede0d4)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px"}}>
      <style>{CSS}</style>
      <div style={{width:"100%",maxWidth:460,animation:"fadeUp .5s ease-out"}}>
        {/* progress */}
        <div style={{display:"flex",gap:6,marginBottom:28,justifyContent:"center"}}>
          {steps.map((_,i)=><div key={i} style={{height:5,width:i===step?32:10,borderRadius:3,background:i<=step?accent:"#e8d5c0",transition:"all .35s"}}/>)}
        </div>
        <Card style={{padding:"32px 28px"}}>
          <div style={{textAlign:"center",marginBottom:22}}>
            <h2 style={{fontFamily:serif,fontSize:20,color:textMain,margin:"0 0 6px",fontWeight:700}}>{cur.title}</h2>
            <p style={{color:textMid,fontSize:13,margin:0,fontFamily:"sans-serif"}}>{cur.sub}</p>
          </div>
          {cur.content}
          <div style={{display:"flex",gap:8,marginTop:24}}>
            {step>0&&<GhostBtn onClick={()=>setStep(s=>s-1)} style={{flex:1}}>← 上一步</GhostBtn>}
            <PrimaryBtn full={step===0} disabled={!canNext} style={{flex:step>0?2:1,padding:"14px"}}
              onClick={()=>{ if(step<steps.length-1){setStep(s=>s+1);}else{onComplete({...p,setupDone:true});} }}>
              {step===steps.length-1?"开始使用 🐾":"下一步 →"}
            </PrimaryBtn>
          </div>
          {step>0&&step<steps.length-1&&<button onClick={()=>setStep(s=>s+1)} style={{display:"block",width:"100%",marginTop:10,background:"none",border:"none",color:textLight,fontSize:12,cursor:"pointer",fontFamily:"sans-serif"}}>跳过这步</button>}
        </Card>
      </div>
    </div>
  );
}

// ─── Cat Profile ───────────────────────────────────────────────────────────────
function ProfilePage({profile,onSave,onNav}) {
  const [p,setP]=useState({...profile});
  const [saved,setSaved]=useState(false);
  const up=patch=>setP(prev=>({...prev,...patch}));

  const save=async()=>{
    await db.save(SK.profile,{...p,setupDone:true});
    onSave({...p,setupDone:true});
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  const totalDays=0; // will come from records in real use

  return <div style={{maxWidth:560,margin:"0 auto",padding:"20px 16px 90px",animation:"fadeUp .4s ease-out"}}>
    {/* hero */}
    <Card style={{padding:"28px 24px",textAlign:"center",marginBottom:14,background:"linear-gradient(135deg,rgba(255,255,255,0.95),rgba(245,237,228,0.95))"}}>
      <div style={{fontSize:64,marginBottom:8,animation:"float 4s ease-in-out infinite"}}>{p.avatar}</div>
      <div style={{fontFamily:serif,fontSize:20,color:textMain,fontWeight:700}}>{p.name||"未命名小猫"}</div>
      <div style={{fontSize:13,color:textMid,fontFamily:"sans-serif",marginTop:4}}>{p.stage} · {p.field||"研究领域待填写"}</div>
      {p.institution&&<div style={{fontSize:12,color:textLight,fontFamily:"sans-serif",marginTop:3}}>📍 {p.institution}</div>}
    </Card>

    {/* avatar picker */}
    <Card style={{padding:"18px 20px",marginBottom:14}}>
      <SecTitle icon="🎨" title="猫咪头像"/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {CAT_AVATARS.map(a=>(
          <button key={a} onClick={()=>up({avatar:a})} style={{width:44,height:44,borderRadius:12,border:`2px solid ${p.avatar===a?accent:"#e8d5c0"}`,background:p.avatar===a?"#f5ede4":"#fdf8f4",fontSize:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",transform:p.avatar===a?"scale(1.12)":"scale(1)"}}>
            {a}
          </button>
        ))}
      </div>
    </Card>

    {/* basic info */}
    <Card style={{padding:"18px 20px",marginBottom:14}}>
      <SecTitle icon="📋" title="基本信息"/>
      <FieldLabel>名字 / 昵称</FieldLabel>
      <TextInput value={p.name} onChange={v=>up({name:v})} placeholder="你想让饲养员叫你什么？"/>
      <div style={{marginTop:12}}>
        <FieldLabel>学术阶段</FieldLabel>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
          {STAGES.map(s=>(
            <button key={s} onClick={()=>up({stage:s})} style={{padding:"9px 6px",borderRadius:11,border:`2px solid ${p.stage===s?accent:"#e8d5c0"}`,background:p.stage===s?"#f5ede4":"#fdf8f4",fontSize:12,color:textMain,cursor:"pointer",fontFamily:"sans-serif",transition:"all .2s",fontWeight:p.stage===s?600:400}}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div style={{marginTop:12}}>
        <FieldLabel>研究领域</FieldLabel>
        <TextInput value={p.field} onChange={v=>up({field:v})} placeholder="计算机视觉 / 分子生物学 / 教育学…"/>
      </div>
      <div style={{marginTop:12}}>
        <FieldLabel>所在机构</FieldLabel>
        <TextInput value={p.institution} onChange={v=>up({institution:v})} placeholder="大学 / 研究所（可选）"/>
      </div>
    </Card>

    {/* personality */}
    <Card style={{padding:"18px 20px",marginBottom:14}}>
      <SecTitle icon="🧬" title="个性设定" right={<span style={{fontSize:11,color:textLight,fontFamily:"sans-serif"}}>帮AI更懂你</span>}/>
      <FieldLabel>工作风格</FieldLabel>
      <TextArea value={p.workStyle} onChange={v=>up({workStyle:v})} placeholder="喜欢深夜工作/容易拖延/做事追求完美/需要外部压力…" rows={2}/>
      <div style={{marginTop:12}}>
        <FieldLabel>主要压力来源</FieldLabel>
        <TextArea value={p.stressors} onChange={v=>up({stressors:v})} placeholder="论文进展/导师关系/毕业压力/社交焦虑/经济压力…" rows={2}/>
      </div>
      <div style={{marginTop:12}}>
        <FieldLabel>长期目标 / 愿景</FieldLabel>
        <TextArea value={p.goals} onChange={v=>up({goals:v})} placeholder="毕业后想做什么？什么对你最重要？" rows={2}/>
      </div>
    </Card>

    {/* save */}
    <PrimaryBtn full onClick={save} style={{fontSize:15,padding:"15px",borderRadius:18,boxShadow:"0 6px 24px rgba(196,168,130,0.38)"}}>
      {saved?"✓ 已保存！":"保存猫咪档案 🐾"}
    </PrimaryBtn>

    <Divider/>

    <div style={{textAlign:"center",padding:"8px 0 4px"}}>
      <div style={{fontSize:12,color:textLight,fontFamily:"sans-serif",lineHeight:1.7}}>
        所有数据仅存储在你的设备本地<br/>饲养员不会把你的秘密告诉任何人 🔒
      </div>
    </div>
  </div>;
}

// ─── Check-in Wizard ───────────────────────────────────────────────────────────
function CheckIn({onComplete,profile}) {
  const [step,setStep]=useState(0);
  const [data,setData]=useState({activity:"",mood:null,mental:"",physical:"",nextPlan:"",goals:["","",""]});
  const name=profile?.name||"小猫";
  const steps=[
    {key:"activity",title:`${name}现在在做什么？🐾`,sub:"饲养员想了解你的现状",type:"ta",ph:"读论文 / 写代码 / 发呆 / 喝咖啡…"},
    {key:"mood",    title:"今天心情如何？😸",sub:"选一个最接近的感受",type:"mood"},
    {key:"mental",  title:"精神状态怎么样？✨",sub:"大脑还在线吗",type:"sel",opts:MENTAL},
    {key:"physical",title:"身体感觉如何？💪",sub:"要好好照顾自己哦",type:"sel",opts:PHYSICAL},
    {key:"nextPlan",title:"接下来打算做什么？📋",sub:"说出来更容易执行",type:"ta",ph:"读三篇文献 / 写实验报告 / 开组会…"},
    {key:"goals",   title:"今日三件小事 🎯",sub:"完成这三件就是成功的一天！",type:"goals"},
  ];
  const cur=steps[step];
  const ok=()=>{
    if(cur.key==="activity")return data.activity.trim().length>0;
    if(cur.key==="mood")return data.mood!==null;
    if(cur.key==="mental")return data.mental!=="";
    if(cur.key==="physical")return data.physical!=="";
    if(cur.key==="nextPlan")return data.nextPlan.trim().length>0;
    if(cur.key==="goals")return data.goals[0].trim().length>0;
    return true;
  };
  return <div style={{minHeight:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px 80px",animation:"fadeUp .45s ease-out"}}>
    <div style={{display:"flex",gap:6,marginBottom:28}}>
      {steps.map((_,i)=><div key={i} style={{width:i===step?24:7,height:7,borderRadius:4,background:i<=step?accent:"#e8d5c0",transition:"all .3s"}}/>)}
    </div>
    <Card style={{padding:"30px 26px",width:"100%",maxWidth:440}}>
      <div style={{textAlign:"center",marginBottom:22}}>
        <div style={{fontSize:48,marginBottom:6,animation:"float 3s ease-in-out infinite"}}>{profile?.avatar||"🐱"}</div>
        <h2 style={{fontFamily:serif,fontSize:19,color:textMain,margin:0,fontWeight:700}}>{cur.title}</h2>
        <p style={{color:textMid,fontSize:13,margin:"5px 0 0",fontFamily:"sans-serif"}}>{cur.sub}</p>
      </div>
      {cur.type==="ta"&&<TextArea value={data[cur.key]} onChange={v=>setData({...data,[cur.key]:v})} placeholder={cur.ph}/>}
      {cur.type==="mood"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {MOODS.map(m=><button key={m.label} onClick={()=>setData({...data,mood:m})} style={{borderRadius:14,border:`2px solid ${data.mood?.label===m.label?m.color:"#e8d5c0"}`,padding:"11px 6px",background:data.mood?.label===m.label?`${m.color}22`:"#fdf8f4",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .2s",transform:data.mood?.label===m.label?"scale(1.06)":"scale(1)"}}>
          <span style={{fontSize:28}}>{m.emoji}</span><span style={{fontSize:12,color:textMain,fontFamily:"sans-serif"}}>{m.label}</span>
        </button>)}
      </div>}
      {cur.type==="sel"&&<div style={{display:"flex",flexDirection:"column",gap:7}}>
        {cur.opts.map(o=><button key={o} onClick={()=>setData({...data,[cur.key]:o})} style={{borderRadius:13,border:`2px solid ${data[cur.key]===o?accent:"#e8d5c0"}`,padding:"12px 16px",background:data[cur.key]===o?"#f5ede4":"#fdf8f4",cursor:"pointer",textAlign:"left",fontSize:14,color:textMain,fontFamily:"sans-serif",transition:"all .2s"}}>{o}</button>)}
      </div>}
      {cur.type==="goals"&&<div style={{display:"flex",flexDirection:"column",gap:9}}>
        {data.goals.map((g,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:26,height:26,borderRadius:"50%",background:"#f5ede4",border:"2px solid #e8d5c0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:accent,fontWeight:700,flexShrink:0}}>{i+1}</div>
          <TextInput value={g} onChange={v=>{const n=[...data.goals];n[i]=v;setData({...data,goals:n});}} placeholder={["最重要的一件事 *","第二件（可选）","第三件（可选）"][i]} style={{flex:1}}/>
        </div>)}
      </div>}
      <div style={{display:"flex",gap:8,marginTop:22}}>
        {step>0&&<GhostBtn onClick={()=>setStep(s=>s-1)} style={{flex:1}}>← 返回</GhostBtn>}
        <PrimaryBtn onClick={()=>{ if(step<steps.length-1)setStep(s=>s+1); else onComplete(data); }} disabled={!ok()} style={{flex:2,padding:"13px",fontSize:15}}>
          {step<steps.length-1?"下一步 →":"提交日志 🐾"}
        </PrimaryBtn>
      </div>
    </Card>
  </div>;
}

// ─── Daily Report ──────────────────────────────────────────────────────────────
function DailyReport({record,allRecords,profile,research,onBack}) {
  const [report,setReport]=useState("");
  const [loading,setLoading]=useState(true);
  const [goalDone,setGoalDone]=useState(record.goalDone||[false,false,false]);

  useEffect(()=>{
    (async()=>{
      const ctx=buildCtx(profile,research,allRecords.slice(-20));
      const name=profile?.name||"小猫";
      const prompt=`你是"${name}"专属的猫猫饲养员AI，正在写今日观察日志。

${ctx}

【本次签到】
活动：${record.activity}
心情：${record.mood?.label} ${record.mood?.emoji}
精神：${record.mental}
身体：${record.physical}
接下来计划：${record.nextPlan}
今日目标：${record.goals.filter(Boolean).join("、")||"未设置"}

请写一份有温度的观察日志，包含：
1. 📋 今日状态小结（结合历史趋势，如发现规律要点出来；若有研究卡点可顺带点评；用可爱比喻描述${name}今天的状态）
2. 💡 针对建议（1-2条具体可操作，结合${name}的工作风格和压力来源）
3. 🎯 计划点评（鼓励并给出具体优化建议）
4. 💌 今日鼓励（温暖有力量，结合${name}的长期目标和近期状态，让她/他感到被真正看见）

语气温柔亲切，偶尔俏皮，像真正了解${name}的老朋友，300字内。`;
      try{
        const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
        const d=await r.json(); setReport(d.content?.map(c=>c.text||"").join("")||"你今天很棒，继续加油 🐾");
      }catch{setReport(`📋 今日观察\n\n${record.mood?.emoji} 心情${record.mood?.label}，正在${record.activity}。饲养员默默记下来啦~\n\n💌 不管今天怎样，你已经很努力了 🐾`);}
      finally{setLoading(false);}
    })();
  },[]);

  const toggleGoal=async i=>{
    const next=[...goalDone]; next[i]=!next[i]; setGoalDone(next);
    const all=await db.load(SK.records)||[];
    const idx=all.findIndex(r=>r.id===record.id);
    if(idx>=0){all[idx].goalDone=next; await db.save(SK.records,all);}
  };
  const total=record.goals.filter(Boolean).length;
  const done=goalDone.filter((d,i)=>d&&record.goals[i]).length;

  return <div style={{maxWidth:560,margin:"0 auto",padding:"20px 16px 90px",animation:"fadeUp .4s ease-out"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,paddingTop:4}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:textMid,cursor:"pointer",fontSize:14,fontFamily:"sans-serif",display:"flex",alignItems:"center",gap:4}}>← 返回</button>
      <div style={{fontSize:11,color:textLight,fontFamily:mono}}>{fmt(record.ts)}</div>
    </div>
    <Card style={{padding:"22px 24px",textAlign:"center",marginBottom:14}}>
      <div style={{fontSize:52,marginBottom:8,animation:"float 3.5s ease-in-out infinite"}}>{record.mood?.emoji||profile?.avatar||"🐱"}</div>
      <div style={{fontFamily:serif,color:textMain,fontSize:18,fontWeight:700,marginBottom:10}}>今日观察日志</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>
        <Tag icon={record.mood?.emoji} label={record.mood?.label} color={record.mood?.color||accent}/>
        <Tag icon="🧠" label={record.mental.split(" ").pop()} color="#9b7ec8"/>
        <Tag icon="🫀" label={record.physical.split(" ").pop()} color="#5bc0a8"/>
      </div>
    </Card>
    <Card style={{padding:"22px 24px",marginBottom:14}}>
      <SecTitle icon="🐾" title={`饲养员的话${profile?.name?" · "+profile.name:""}`}/>
      {loading
        ?<div style={{display:"flex",flexDirection:"column",gap:10}}>{[100,82,94,70,86].map((w,i)=><Skeleton key={i} w={`${w}%`}/>)}</div>
        :<div style={{fontSize:14.5,lineHeight:1.92,color:textMain,fontFamily:"sans-serif",whiteSpace:"pre-wrap"}}>{report}</div>}
    </Card>
    {total>0&&<Card style={{padding:"20px 22px",marginBottom:14}}>
      <SecTitle icon="🎯" title="今日任务" right={<span style={{fontSize:12,color:textMid,fontFamily:"sans-serif"}}>{done}/{total} 完成</span>}/>
      <div style={{height:4,background:"#f0e6d8",borderRadius:2,marginBottom:12,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${total?(done/total)*100:0}%`,background:`linear-gradient(90deg,${accent},#e8b89a)`,borderRadius:2,transition:"width .5s"}}/>
      </div>
      {record.goals.map((g,i)=>g?<div key={i} onClick={()=>toggleGoal(i)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 13px",borderRadius:13,background:goalDone[i]?"#f0f9f0":"#fdf8f4",border:`2px solid ${goalDone[i]?"#a8d8a8":"#e8d5c0"}`,marginBottom:7,cursor:"pointer",transition:"all .2s",userSelect:"none"}}>
        <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${goalDone[i]?"#6db86d":accent}`,background:goalDone[i]?"#6db86d":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"white",flexShrink:0,transition:"all .2s"}}>{goalDone[i]?"✓":""}</div>
        <span style={{fontSize:14,color:goalDone[i]?"#6db86d":textMain,fontFamily:"sans-serif",textDecoration:goalDone[i]?"line-through":"none",flex:1,transition:"all .2s"}}>{g}</span>
        {goalDone[i]&&<span style={{fontSize:15}}>🎉</span>}
      </div>:null)}
      {done===total&&total>0&&<div style={{marginTop:8,padding:"10px",borderRadius:12,background:"#fff9e6",border:"1px solid #ffd97d",fontSize:13,color:"#8a6d00",fontFamily:"sans-serif",textAlign:"center"}}>🌟 全部完成！{profile?.name||""}今天超级厉害！</div>}
    </Card>}
  </div>;
}

// ─── Research Module ───────────────────────────────────────────────────────────
function ResearchModule({records,profile,research,onResearchChange}) {
  const [tab,setTab]=useState("overview");
  const [loading,setLoading]=useState(false);
  const [newBlocker,setNewBlocker]=useState("");
  const [newInspo,setNewInspo]=useState("");
  const [editTopic,setEditTopic]=useState(false);
  const [topicD,setTopicD]=useState(research.topic);
  const [descD,setDescD]=useState(research.description);

  const persist=async next=>{ await db.save(SK.research,next); onResearchChange(next); };
  const saveTopic=async()=>{ const n={...research,topic:topicD,description:descD}; await persist(n); setEditTopic(false); };
  const addBlocker=async()=>{ if(!newBlocker.trim())return; const b={id:uid(),text:newBlocker.trim(),ts:Date.now(),resolved:false}; await persist({...research,blockers:[...(research.blockers||[]),b]}); setNewBlocker(""); };
  const toggleB=async id=>{ await persist({...research,blockers:research.blockers.map(b=>b.id===id?{...b,resolved:!b.resolved}:b)}); };
  const delB=async id=>{ await persist({...research,blockers:research.blockers.filter(b=>b.id!==id)}); };
  const addInspo=async()=>{ if(!newInspo.trim())return; await persist({...research,inspirations:[...(research.inspirations||[]),{id:uid(),text:newInspo.trim(),ts:Date.now(),starred:false}]}); setNewInspo(""); };
  const starI=async id=>{ await persist({...research,inspirations:research.inspirations.map(i=>i.id===id?{...i,starred:!i.starred}:i)}); };
  const delI=async id=>{ await persist({...research,inspirations:research.inspirations.filter(i=>i.id!==id)}); };

  const generateAdvice=async()=>{
    if(loading||!research.topic)return;
    setLoading(true);
    const ctx=buildCtx(profile,research,records.slice(-14));
    const name=profile?.name||"你";
    const prompt=`你是温柔睿智的研究导师兼专属饲养员，正在帮助${name}梳理研究方向。

${ctx}

请给出一份有深度的研究方向建议：
1. 🔍 现状诊断（温柔指出当前可能的问题和模式，结合状态记录）
2. 💡 方向建议（2-3个具体可操作的研究突破口或调整思路）
3. 🛠️ 本周行动（结合${name}当前精神/身体状态，给3个匹配状态的具体任务）
4. 🌱 长期视角（帮${name}看到更远的可能性，与其长期目标呼应）

语气像关心学生的导师，有洞见不说教，温柔有力量，400字以内。`;
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,messages:[{role:"user",content:prompt}]})});
      const d=await r.json();
      const text=d.content?.map(c=>c.text||"").join("")||"请稍后重试~";
      await persist({...research,aiAdvice:[{id:uid(),text,ts:Date.now()},...(research.aiAdvice||[]).slice(0,4)]});
    }catch{alert("生成失败，请重试");}
    finally{setLoading(false);}
  };

  const activeB=(research.blockers||[]).filter(b=>!b.resolved);
  const resolvedB=(research.blockers||[]).filter(b=>b.resolved);
  const starredI=(research.inspirations||[]).filter(i=>i.starred);
  const otherI=(research.inspirations||[]).filter(i=>!i.starred);
  const TABS=[
    {key:"overview",icon:"📌",label:"概览"},
    {key:"blockers",icon:"🚧",label:`卡点${activeB.length?` (${activeB.length})`:""}` },
    {key:"inspiration",icon:"✨",label:"灵感"},
    {key:"advice",icon:"🤖",label:"AI建议"},
  ];

  return <div style={{maxWidth:560,margin:"0 auto",padding:"20px 16px 90px",animation:"fadeUp .4s ease-out"}}>
    <h2 style={{fontFamily:serif,color:textMain,margin:"0 0 16px",fontSize:18,paddingTop:4}}>研究方向 🔬</h2>

    {/* Topic card */}
    <Card style={{padding:"18px 20px",marginBottom:14}}>
      {editTopic?(
        <div style={{animation:"popIn .2s ease-out"}}>
          <FieldLabel>研究课题名称</FieldLabel>
          <TextInput value={topicD} onChange={setTopicD} placeholder="例：基于LLM的代码生成可靠性研究"/>
          <div style={{marginTop:12}}><FieldLabel>简要描述（可选）</FieldLabel>
          <TextArea value={descD} onChange={setDescD} placeholder="一两句话描述研究方向、目标或方法…" rows={2}/></div>
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <GhostBtn onClick={()=>{setEditTopic(false);setTopicD(research.topic);setDescD(research.description);}} style={{flex:1}}>取消</GhostBtn>
            <PrimaryBtn onClick={saveTopic} style={{flex:2}}>保存 ✓</PrimaryBtn>
          </div>
        </div>
      ):(
        <div onClick={()=>setEditTopic(true)} style={{cursor:"pointer"}}>
          {research.topic?(
            <>
              <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:16,fontWeight:700,color:textMain,fontFamily:serif,marginBottom:research.description?5:0,lineHeight:1.4}}>{research.topic}</div>
                  {research.description&&<div style={{fontSize:13,color:accentDark,fontFamily:"sans-serif",lineHeight:1.65}}>{research.description}</div>}
                </div>
                <span style={{fontSize:15,color:accent,flexShrink:0,marginTop:2}}>✎</span>
              </div>
              <div style={{display:"flex",gap:6,marginTop:12,flexWrap:"wrap"}}>
                <Tag label={`🚧 ${activeB.length}个卡点`} color={activeB.length>0?"#e87c7c":"#9e8472"}/>
                <Tag label={`✨ ${research.inspirations?.length||0}条灵感`} color="#9b7ec8"/>
                <Tag label={`🤖 ${research.aiAdvice?.length||0}次建议`} color="#5bc0a8"/>
              </div>
            </>
          ):(
            <div style={{textAlign:"center",padding:"12px 0"}}>
              <div style={{fontSize:36,marginBottom:8}}>🔬</div>
              <div style={{fontFamily:serif,color:textMain,fontSize:15,marginBottom:4}}>还没有设置研究课题</div>
              <div style={{fontSize:13,color:textMid,fontFamily:"sans-serif"}}>点击这里填写，让饲养员更了解你的工作 🐾</div>
            </div>
          )}
        </div>
      )}
    </Card>

    {/* Tab switcher */}
    <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:2}}>
      {TABS.map(t=><button key={t.key} onClick={()=>setTab(t.key)} style={{flexShrink:0,padding:"8px 14px",borderRadius:20,border:`2px solid ${tab===t.key?accent:"#e8d5c0"}`,background:tab===t.key?"#f5ede4":"rgba(255,255,255,0.75)",color:tab===t.key?textMain:textMid,fontSize:13,cursor:"pointer",fontFamily:"sans-serif",fontWeight:tab===t.key?700:400,transition:"all .2s",whiteSpace:"nowrap"}}>
        {t.icon} {t.label}
      </button>)}
    </div>

    {/* Overview */}
    {tab==="overview"&&<div style={{animation:"slideIn .2s ease-out"}}>
      {records.length>0&&<Card style={{padding:"16px 18px",marginBottom:14}}>
        <SecTitle icon="📅" title="近期工作脉络"/>
        {records.slice(-5).reverse().map(r=><div key={r.id} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:"1px solid #f5ede4"}}>
          <span style={{fontSize:18,flexShrink:0}}>{r.mood?.emoji}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,color:textMain,fontFamily:"sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.activity}</div>
            {r.nextPlan&&<div style={{fontSize:12,color:textMid,fontFamily:"sans-serif",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>→ {r.nextPlan}</div>}
          </div>
          <span style={{fontSize:11,color:textLight,fontFamily:mono,flexShrink:0,paddingTop:2}}>{fmtDate(r.ts)}</span>
        </div>)}
      </Card>}
      {starredI.length>0&&<Card style={{padding:"16px 18px",marginBottom:14}}>
        <SecTitle icon="⭐" title="置顶灵感"/>
        {starredI.map(ins=><div key={ins.id} style={{display:"flex",gap:8,padding:"9px 12px",borderRadius:12,background:"#fff9e6",border:"1px solid #ffd97d",marginBottom:8}}>
          <span style={{fontSize:16}}>💡</span><div style={{fontSize:13,color:textMain,fontFamily:"sans-serif",lineHeight:1.65}}>{ins.text}</div>
        </div>)}
      </Card>}
      {research.topic&&<Card style={{padding:"16px 18px",marginBottom:14,textAlign:"center"}}>
        <div style={{fontSize:13,color:accentDark,fontFamily:"sans-serif",marginBottom:12}}>
          {research.aiAdvice?.length>0?`上次建议：${fmtDate(research.aiAdvice[0].ts)}`:"还没有AI建议，让饲养员帮你分析一下~"}
        </div>
        <PrimaryBtn full onClick={()=>{setTab("advice");generateAdvice();}} disabled={loading||!research.topic} style={{padding:"13px"}}>
          {loading?"🤖 思考中…":"🤖 获取研究方向建议"}
        </PrimaryBtn>
      </Card>}
    </div>}

    {/* Blockers */}
    {tab==="blockers"&&<div style={{animation:"slideIn .2s ease-out"}}>
      <Card style={{padding:"16px 18px",marginBottom:14}}>
        <SecTitle icon="🚧" title="记录卡点"/>
        <TextArea value={newBlocker} onChange={setNewBlocker} placeholder="描述遇到的障碍、困惑或卡住的问题…" rows={2}/>
        <PrimaryBtn full onClick={addBlocker} disabled={!newBlocker.trim()} style={{marginTop:10,padding:"11px"}}>+ 记录卡点</PrimaryBtn>
      </Card>
      {activeB.length>0&&<Card style={{padding:"16px 18px",marginBottom:14}}>
        <SecTitle icon="🔴" title={`进行中 (${activeB.length})`}/>
        {activeB.map(b=><div key={b.id} style={{padding:"12px 14px",borderRadius:14,background:"#fff5f5",border:"1px solid #ffd0d0",marginBottom:8,animation:"popIn .2s ease-out"}}>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1,fontSize:14,color:textMain,fontFamily:"sans-serif",lineHeight:1.65}}>{b.text}</div>
            <div style={{display:"flex",gap:5,flexShrink:0}}>
              <button onClick={()=>toggleB(b.id)} style={{background:"#e8f5e8",border:"1px solid #a8d8a8",borderRadius:8,padding:"4px 9px",cursor:"pointer",fontSize:13,color:"#5a8a5a"}}>✓</button>
              <button onClick={()=>delB(b.id)} style={{background:"#f5e8e8",border:"1px solid #e8b8b8",borderRadius:8,padding:"4px 9px",cursor:"pointer",fontSize:13,color:"#8a5a5a"}}>✕</button>
            </div>
          </div>
          <div style={{fontSize:11,color:textLight,fontFamily:mono,marginTop:5}}>{fmtDate(b.ts)}</div>
        </div>)}
      </Card>}
      {resolvedB.length>0&&<Card style={{padding:"16px 18px",marginBottom:14}}>
        <SecTitle icon="✅" title={`已解决 (${resolvedB.length})`}/>
        {resolvedB.map(b=><div key={b.id} style={{display:"flex",gap:8,padding:"10px 14px",borderRadius:12,background:"#f0f9f0",border:"1px solid #c8e8c8",marginBottom:7}}>
          <span style={{fontSize:16,flexShrink:0}}>✅</span>
          <div style={{flex:1}}><div style={{fontSize:13,color:"#6db86d",fontFamily:"sans-serif",textDecoration:"line-through",lineHeight:1.5}}>{b.text}</div><div style={{fontSize:11,color:textLight,fontFamily:mono,marginTop:3}}>{fmtDate(b.ts)}</div></div>
          <button onClick={()=>delB(b.id)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:14,color:"#c8c8c8",flexShrink:0,padding:"2px"}}>✕</button>
        </div>)}
      </Card>}
      {!research.blockers?.length&&<Card style={{padding:"36px 24px",textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:8}}>🌿</div>
        <div style={{fontFamily:serif,color:textMain,fontSize:15,marginBottom:4}}>目前没有卡点</div>
        <div style={{fontSize:13,color:textMid,fontFamily:"sans-serif"}}>遇到困难随时记录，饲养员会帮你分析 🐾</div>
      </Card>}
    </div>}

    {/* Inspiration */}
    {tab==="inspiration"&&<div style={{animation:"slideIn .2s ease-out"}}>
      <Card style={{padding:"16px 18px",marginBottom:14}}>
        <SecTitle icon="✨" title="记录灵感"/>
        <TextArea value={newInspo} onChange={setNewInspo} placeholder="一个突然的想法、有趣观点、值得探索的方向…" rows={2}/>
        <PrimaryBtn full onClick={addInspo} disabled={!newInspo.trim()} style={{marginTop:10,padding:"11px"}}>+ 记录灵感</PrimaryBtn>
      </Card>
      {!research.inspirations?.length&&<Card style={{padding:"36px 24px",textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:8}}>💭</div>
        <div style={{fontFamily:serif,color:textMain,fontSize:15}}>还没有灵感</div>
        <div style={{fontSize:13,color:textMid,fontFamily:"sans-serif",marginTop:4}}>把脑海中闪过的想法记在这里~</div>
      </Card>}
      {starredI.length>0&&<><div style={{fontSize:12,color:textMid,fontFamily:"sans-serif",marginBottom:8}}>⭐ 置顶</div>{starredI.map(i=><InspoCard key={i.id} ins={i} onStar={starI} onDel={delI}/>)}</>}
      {otherI.length>0&&<><div style={{fontSize:12,color:textMid,fontFamily:"sans-serif",marginBottom:8,marginTop:starredI.length?12:0}}>{starredI.length?"其他灵感":""}</div>{[...otherI].reverse().map(i=><InspoCard key={i.id} ins={i} onStar={starI} onDel={delI}/>)}</>}
    </div>}

    {/* AI Advice */}
    {tab==="advice"&&<div style={{animation:"slideIn .2s ease-out"}}>
      {!research.topic?<Card style={{padding:"32px 24px",textAlign:"center",marginBottom:14}}>
        <div style={{fontSize:36,marginBottom:8}}>🔬</div>
        <div style={{fontFamily:serif,color:textMain,fontSize:15,marginBottom:4}}>先填写研究课题</div>
        <div style={{fontSize:13,color:textMid,fontFamily:"sans-serif",marginBottom:14}}>有了方向，饲养员才能给出有价值的建议~</div>
        <GhostBtn onClick={()=>{setTab("overview");setEditTopic(true);}}>去填写课题 →</GhostBtn>
      </Card>:<>
        <Card style={{padding:"16px 18px",marginBottom:14}}>
          <SecTitle icon="🤖" title="AI研究建议"/>
          <div style={{fontSize:13,color:accentDark,fontFamily:"sans-serif",lineHeight:1.75,marginBottom:14}}>
            饲养员会结合你的<strong>研究课题</strong>、<strong>当前卡点</strong>、<strong>近期签到状态</strong>{profile?.goals?`和你的<strong>长期目标</strong>`:""}，给出有针对性的方向建议和行动计划。
          </div>
          <PrimaryBtn full onClick={generateAdvice} disabled={loading} style={{padding:"13px"}}>
            {loading?"🤖 饲养员认真思考中…":"✨ 生成研究方向建议"}
          </PrimaryBtn>
          {loading&&<div style={{display:"flex",flexDirection:"column",gap:8,marginTop:14}}>{[100,80,90,70,85].map((w,i)=><Skeleton key={i} w={`${w}%`}/>)}</div>}
        </Card>
        {(research.aiAdvice||[]).map((a,idx)=><Card key={a.id} style={{padding:"18px 20px",marginBottom:12,opacity:idx===0?1:0.72}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:18}}>{idx===0?"🌟":"📄"}</span><span style={{fontFamily:serif,color:textMain,fontSize:14,fontWeight:600}}>{idx===0?"最新建议":"历史建议"}</span></div>
            <span style={{fontSize:11,color:textLight,fontFamily:mono}}>{fmtDate(a.ts)}</span>
          </div>
          <div style={{fontSize:14,lineHeight:1.9,color:textMain,fontFamily:"sans-serif",whiteSpace:"pre-wrap"}}>{a.text}</div>
        </Card>)}
      </>}
    </div>}
  </div>;
}

function InspoCard({ins,onStar,onDel}) {
  return <div style={{padding:"12px 14px",borderRadius:14,background:ins.starred?"#fff9e6":"#fdf8f4",border:`1px solid ${ins.starred?"#ffd97d":"#f0e0d0"}`,marginBottom:8,animation:"popIn .2s ease-out"}}>
    <div style={{display:"flex",gap:8}}>
      <span style={{fontSize:17,flexShrink:0}}>💡</span>
      <div style={{flex:1,fontSize:13,color:textMain,fontFamily:"sans-serif",lineHeight:1.7}}>{ins.text}</div>
      <div style={{display:"flex",gap:4,flexShrink:0,alignItems:"flex-start"}}>
        <button onClick={()=>onStar(ins.id)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:17,opacity:ins.starred?1:.35,padding:"1px 3px",transition:"opacity .2s"}}>{ins.starred?"⭐":"☆"}</button>
        <button onClick={()=>onDel(ins.id)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:14,color:"#d0c0b0",padding:"2px"}}> ✕</button>
      </div>
    </div>
    <div style={{fontSize:11,color:textLight,fontFamily:mono,marginTop:5}}>{fmtDate(ins.ts)}</div>
  </div>;
}

// ─── Digest ─────────────────────────────────────────────────────────────────────
function DigestView({records,profile,research,onViewRecord}) {
  const [mode,setMode]=useState("week");
  const [offset,setOffset]=useState(0);
  const [report,setReport]=useState("");
  const [loading,setLoading]=useState(false);
  const [digests,setDigests]=useState({});
  useEffect(()=>{ db.load(SK.digests).then(d=>setDigests(d||{})); },[]);

  const bounds=()=>{
    if(mode==="week"){
      const ws=weekStart(Date.now()); ws.setDate(ws.getDate()+offset*7);
      const we=new Date(ws); we.setDate(we.getDate()+6); we.setHours(23,59,59,999);
      return{start:+ws,end:+we,key:`W-${weekNum(+ws)}`};
    }else{
      const d=new Date(); d.setDate(1); d.setHours(0,0,0,0); d.setMonth(d.getMonth()+offset);
      return{start:+d,end:+new Date(d.getFullYear(),d.getMonth()+1,0,23,59,59,999),key:`M-${monthKey(+d)}`};
    }
  };
  const{start,end,key}=bounds();
  const pr=records.filter(r=>r.ts>=start&&r.ts<=end);
  const pLabel=()=>{ const s=new Date(start),e=new Date(end); return mode==="week"?`${s.getMonth()+1}/${s.getDate()} – ${e.getMonth()+1}/${e.getDate()}`:`${s.getFullYear()}年${s.getMonth()+1}月`; };
  const avgMood=pr.length?(pr.reduce((s,r)=>s+(r.mood?.val||3),0)/pr.length).toFixed(1):"—";
  const avgMental=pr.length?(pr.reduce((s,r)=>s+mentalVal(r.mental),0)/pr.length).toFixed(1):"—";
  const avgPhys=pr.length?(pr.reduce((s,r)=>s+physVal(r.physical),0)/pr.length).toFixed(1):"—";
  const checkDays=new Set(pr.map(r=>dayKey(r.ts))).size;
  const totalG=pr.reduce((s,r)=>s+r.goals.filter(Boolean).length,0);
  const doneG=pr.reduce((s,r)=>s+(r.goalDone||[]).filter((d,i)=>d&&r.goals[i]).length,0);
  const moodSeries=pr.map(r=>r.mood?.val||3);
  const moodFreq=MOODS.map(m=>({...m,count:pr.filter(r=>r.mood?.label===m.label).length})).filter(m=>m.count>0).sort((a,b)=>b.count-a.count);
  useEffect(()=>{ setReport(digests[key]?.text||""); },[key,digests]);

  const generate=async()=>{
    if(loading)return; setLoading(true); setReport("");
    const ctx=buildCtx(profile,research,pr);
    const name=profile?.name||"小猫";
    const prompt=`你是${name}专属的猫猫饲养员AI，正在出具${mode==="week"?"周报":"月报"}。

${ctx}

【本期统计】时段：${pLabel()}，签到${checkDays}天共${pr.length}条，平均心情${avgMood}/5，精神${avgMental}/5，体力${avgPhys}/5，任务完成率${totalG>0?Math.round(doneG/totalG*100):0}%

请写一份有温度的${mode==="week"?"周报":"月报"}：
1. 📊 本期总体状态（用可爱比喻描述${name}这${mode==="week"?"周":"月"}；结合研究进展和卡点变化）
2. 🌟 高光时刻（1-2个值得表扬的具体进步或闪光时刻）
3. 💛 需关注的模式（温柔指出需改善的规律，比如持续低精神、特定时段焦虑等）
4. 🎯 下${mode==="week"?"周":"月"}建议（2-3条结合研究方向和${name}状态的具体行动）
5. 💌 饲养员寄语（温暖有力量，与${name}的长期目标呼应）

语气温柔，有洞察力，像真正了解${name}的老朋友，420字内。`;
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,messages:[{role:"user",content:prompt}]})});
      const d=await r.json();
      const text=d.content?.map(c=>c.text||"").join("")||"生成失败，请重试~";
      setReport(text);
      const next={...digests,[key]:{text,ts:Date.now(),period:pLabel()}};
      setDigests(next); await db.save(SK.digests,next);
    }catch{setReport("网络开小差，请稍后重试 🐾");}
    finally{setLoading(false);}
  };
  const cached=!!digests[key];

  return <div style={{maxWidth:560,margin:"0 auto",padding:"20px 16px 90px",animation:"fadeUp .4s ease-out"}}>
    <h2 style={{fontFamily:serif,color:textMain,margin:"0 0 16px",fontSize:18,paddingTop:4}}>饲养报告 📊</h2>
    <Card style={{padding:"14px 18px",marginBottom:14}}>
      <div style={{display:"flex",background:"#f5ede4",borderRadius:12,padding:3,marginBottom:14}}>
        {[["week","📅 周报"],["month","📆 月报"]].map(([m,l])=><button key={m} onClick={()=>{setMode(m);setOffset(0);}} style={{flex:1,padding:"9px",borderRadius:10,border:"none",background:mode===m?"white":"transparent",color:mode===m?textMain:textMid,fontSize:14,cursor:"pointer",fontFamily:serif,fontWeight:mode===m?700:400,boxShadow:mode===m?"0 2px 10px rgba(160,120,80,0.12)":"none",transition:"all .2s"}}>{l}</button>)}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>setOffset(o=>o-1)} style={{width:36,height:36,borderRadius:"50%",border:"2px solid #e8d5c0",background:"#fdf8f4",cursor:"pointer",fontSize:18,color:textMid,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:serif,color:textMain,fontSize:15,fontWeight:700}}>{pLabel()}</div>
          <div style={{fontSize:12,color:textMid,fontFamily:"sans-serif",marginTop:2}}>{checkDays}天签到 · {pr.length}条记录</div>
        </div>
        <button onClick={()=>setOffset(o=>Math.min(0,o+1))} disabled={offset===0} style={{width:36,height:36,borderRadius:"50%",border:"2px solid #e8d5c0",background:offset===0?"#f5ede4":"#fdf8f4",cursor:offset===0?"not-allowed":"pointer",fontSize:18,color:offset===0?"#d9c4ae":textMid,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
      </div>
    </Card>
    {pr.length===0?<Card style={{padding:"40px 24px",textAlign:"center"}}><div style={{fontSize:40,marginBottom:10}}>🐾</div><div style={{fontFamily:serif,color:textMain,fontSize:15,marginBottom:4}}>这段时间没有记录</div><div style={{fontSize:13,color:textMid,fontFamily:"sans-serif"}}>去签到一下吧~</div></Card>:<>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[{icon:"😸",val:avgMood,label:"平均心情",c:"#f6a623"},{icon:"🧠",val:avgMental,label:"平均精神",c:"#9b7ec8"},{icon:"🫀",val:avgPhys,label:"平均体力",c:"#5bc0a8"},{icon:"✅",val:totalG>0?`${Math.round(doneG/totalG*100)}%`:"—",label:"任务完成率",c:"#6bcb77"}].map(s=><Card key={s.label} style={{padding:"14px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:38,height:38,borderRadius:11,background:`${s.c}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,flexShrink:0}}>{s.icon}</div>
          <div><div style={{fontSize:20,fontWeight:700,color:textMain,fontFamily:serif,lineHeight:1}}>{s.val}</div><div style={{fontSize:11,color:textMid,fontFamily:"sans-serif",marginTop:3}}>{s.label}</div></div>
        </Card>)}
      </div>
      <Card style={{padding:"16px 18px",marginBottom:14}}><SecTitle icon="📈" title="心情走势"/><Sparkline data={moodSeries}/></Card>
      {moodFreq.length>0&&<Card style={{padding:"16px 18px",marginBottom:14}}>
        <SecTitle icon="🎨" title="心情分布"/>
        {moodFreq.map(m=><div key={m.label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
          <span style={{fontSize:18,width:26,textAlign:"center"}}>{m.emoji}</span>
          <span style={{fontSize:12,color:textMain,fontFamily:"sans-serif",width:34}}>{m.label}</span>
          <div style={{flex:1,height:7,background:"#f0e6d8",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${(m.count/pr.length)*100}%`,background:m.color,borderRadius:4,transition:"width .6s"}}/></div>
          <span style={{fontSize:11,color:textMid,fontFamily:mono,width:26,textAlign:"right"}}>{m.count}次</span>
        </div>)}
      </Card>}
      <Card style={{padding:"20px 22px",marginBottom:14}}>
        <SecTitle icon="🐾" title={`饲养员${mode==="week"?"周报":"月报"}`} right={cached&&<span style={{fontSize:11,color:textLight,fontFamily:"sans-serif"}}>{fmt(digests[key].ts)}</span>}/>
        {loading?<div style={{display:"flex",flexDirection:"column",gap:9}}><div style={{fontSize:13,color:textMid,fontFamily:"sans-serif",marginBottom:4}}>认真翻阅档案中 <Dots/></div>{[100,80,90,70,85].map((w,i)=><Skeleton key={i} w={`${w}%`}/>)}</div>
          :report?<div style={{fontSize:14.5,lineHeight:1.9,color:textMain,fontFamily:"sans-serif",whiteSpace:"pre-wrap"}}>{report}</div>
          :<div style={{textAlign:"center",padding:"8px 0",fontSize:13,color:textMid,fontFamily:"sans-serif"}}>点击下方生成本期饲养报告 🔍</div>}
        <PrimaryBtn full onClick={generate} disabled={loading} style={{padding:"12px",marginTop:14}}>
          {loading?"生成中…":cached?"🔄 重新生成":"✨ 生成报告"}
        </PrimaryBtn>
      </Card>
      <Card style={{padding:"16px 18px",marginBottom:14}}>
        <SecTitle icon="📋" title="本期记录"/>
        {pr.slice().reverse().map(r=><div key={r.id} onClick={()=>onViewRecord(r)} className="card-hover" style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:12,background:"#fdf8f4",border:"1px solid #f0e0d0",marginBottom:6,cursor:"pointer",transition:"transform .15s,box-shadow .15s"}}>
          <span style={{fontSize:18}}>{r.mood?.emoji}</span>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,color:textMain,fontFamily:"sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.activity}</div><div style={{fontSize:11,color:textLight,fontFamily:mono,marginTop:1}}>{fmt(r.ts)}</div></div>
          <span style={{color:"#d9c4ae",fontSize:14}}>›</span>
        </div>)}
      </Card>
    </>}
  </div>;
}

// ─── History ───────────────────────────────────────────────────────────────────
function History({records,onSelect}) {
  const grouped=[...records].reverse().reduce((acc,r)=>{ const k=dayKey(r.ts); if(!acc[k])acc[k]=[]; acc[k].push(r); return acc; },{});
  const days=Object.keys(grouped).sort((a,b)=>b.localeCompare(a));
  const labelDay=k=>{ const t=today(),yd=dayKey(Date.now()-864e5); if(k===t)return"今天"; if(k===yd)return"昨天"; const[,m,d]=k.split("-"); return`${m}月${d}日`; };
  return <div style={{maxWidth:560,margin:"0 auto",padding:"20px 16px 90px",animation:"fadeUp .4s ease-out"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,paddingTop:4}}>
      <h2 style={{fontFamily:serif,color:textMain,margin:0,fontSize:18}}>历史档案 📚</h2>
      <span style={{fontSize:12,color:textLight,fontFamily:"sans-serif"}}>{records.length}条记录</span>
    </div>
    {!days.length&&<Card style={{padding:"48px 24px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:8}}>🐾</div><div style={{fontFamily:serif,color:textMain,fontSize:15}}>还没有任何记录</div><div style={{fontSize:13,color:textMid,fontFamily:"sans-serif",marginTop:4}}>快去签到吧~</div></Card>}
    {days.map(dk=><div key={dk} style={{marginBottom:18}}>
      <div style={{fontSize:12,color:textMid,fontFamily:serif,fontWeight:700,marginBottom:8,letterSpacing:".04em"}}>{labelDay(dk)}</div>
      {grouped[dk].map(r=><Card key={r.id} onClick={()=>onSelect(r)} className="card-hover" style={{padding:"12px 18px",marginBottom:8,cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>{r.mood?.emoji||"🐱"}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,color:textMain,fontFamily:"sans-serif",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.activity}</div>
            <div style={{fontSize:11,color:textLight,fontFamily:mono,marginTop:2}}>{fmt(r.ts)}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            <Tag label={r.mood?.label||""} color={r.mood?.color||accent}/>
            {r.goals.filter(Boolean).length>0&&<span style={{fontSize:11,color:textMid,fontFamily:"sans-serif"}}>{(r.goalDone||[]).filter((d,i)=>d&&r.goals[i]).length}/{r.goals.filter(Boolean).length} ✓</span>}
          </div>
        </div>
      </Card>)}
    </div>)}
  </div>;
}

// ─── Home ──────────────────────────────────────────────────────────────────────
function Home({records,profile,research,onCheckin,onNav}) {
  const hasToday=records.some(r=>dayKey(r.ts)===today());
  const latest=records[records.length-1];
  const hour=new Date().getHours();
  const timeGreet=hour<6?"深夜了还在努力":hour<10?"早上好":hour<13?"上午好":hour<18?"下午好":"晚上好";
  const greeting=profile?.name?`${timeGreet}，${profile.name}~`:timeGreet;
  const streak=(()=>{ const s=new Set(records.map(r=>dayKey(r.ts))); let n=0,d=Date.now(); while(s.has(dayKey(d))){n++;d-=864e5;} return n; })();
  const last7=records.filter(r=>r.ts>Date.now()-7*864e5);
  const avgMood=last7.length?(last7.reduce((s,r)=>s+(r.mood?.val||3),0)/last7.length).toFixed(1):"—";
  const doneTotal=records.reduce((s,r)=>s+(r.goalDone||[]).filter((d,i)=>d&&r.goals[i]).length,0);
  const activeB=(research?.blockers||[]).filter(b=>!b.resolved).length;

  return <div style={{maxWidth:560,margin:"0 auto",padding:"28px 16px 90px",animation:"fadeUp .5s ease-out"}}>
    {/* hero */}
    <div style={{textAlign:"center",marginBottom:20}}>
      <div style={{fontSize:profile?68:60,animation:"float 3.5s ease-in-out infinite",marginBottom:8}}>{profile?.avatar||"🐱"}</div>
      <h1 style={{fontFamily:serif,fontSize:22,color:textMain,margin:"0 0 4px",fontWeight:700}}>猫猫饲养日志</h1>
      <p style={{color:textMid,fontSize:14,margin:0,fontFamily:"sans-serif"}}>{greeting}，今天也要被饲养员好好照顾 🔭</p>
      {profile?.field&&<div style={{marginTop:6}}><Tag label={`${profile.stage} · ${profile.field}`} color={accent}/></div>}
    </div>

    {/* stats */}
    {records.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
      {[{icon:"🔥",val:streak,label:"连续签到"},{icon:"😸",val:avgMood,label:"近7天均值"},{icon:"✅",val:doneTotal,label:"累计完成"}].map(s=><Card key={s.label} style={{padding:"12px 8px",textAlign:"center"}}>
        <div style={{fontSize:20,marginBottom:3}}>{s.icon}</div>
        <div style={{fontSize:20,fontWeight:700,color:textMain,fontFamily:serif,lineHeight:1}}>{s.val}</div>
        <div style={{fontSize:10,color:textMid,fontFamily:"sans-serif",marginTop:3,lineHeight:1.3}}>{s.label}</div>
      </Card>)}
    </div>}

    {/* heatmap */}
    {records.length>4&&<Card style={{padding:"14px 16px",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}>
        <span style={{fontSize:13,color:accentDark,fontFamily:serif,fontWeight:700}}>签到热力图</span>
        <span style={{fontSize:11,color:textLight,fontFamily:"sans-serif"}}>近10周</span>
      </div>
      <HeatmapRow records={records} weeks={10}/>
      <div style={{display:"flex",alignItems:"center",gap:5,marginTop:7}}>
        <span style={{fontSize:10,color:textLight,fontFamily:"sans-serif"}}>少</span>
        {["#f0e6d8","#f5d4a8","#e8b89a","#c4a882","#8a6848"].map(c=><div key={c} style={{width:10,height:10,borderRadius:2,background:c}}/>)}
        <span style={{fontSize:10,color:textLight,fontFamily:"sans-serif"}}>多</span>
      </div>
    </Card>}

    {/* research peek */}
    {research?.topic&&<Card onClick={()=>onNav("research")} className="card-hover" style={{padding:"13px 18px",marginBottom:14,cursor:"pointer"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:22}}>🔬</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,color:textMain,fontFamily:"sans-serif",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{research.topic}</div>
          <div style={{fontSize:12,color:activeB>0?"#c05050":textMid,fontFamily:"sans-serif",marginTop:2}}>{activeB>0?`🚧 ${activeB}个卡点待解决`:"✨ 暂无卡点，保持良好状态~"}</div>
        </div>
        <span style={{color:accent,fontSize:16}}>›</span>
      </div>
    </Card>}

    {/* today card */}
    {hasToday&&latest?(
      <Card style={{padding:"15px 20px",marginBottom:14}}>
        <div style={{fontSize:11,color:textLight,fontFamily:mono,marginBottom:8}}>今天已签到 ✓</div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:30}}>{latest.mood?.emoji}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,color:textMain,fontFamily:"sans-serif",fontWeight:500}}>{latest.activity}</div>
            <div style={{fontSize:12,color:textMid,fontFamily:"sans-serif",marginTop:2}}>心情 {latest.mood?.label} · {fmt(latest.ts)}</div>
          </div>
        </div>
      </Card>
    ):(
      <Card style={{padding:"16px 20px",marginBottom:14,textAlign:"center"}}>
        <div style={{fontSize:26,marginBottom:5}}>📋</div>
        <div style={{fontFamily:serif,color:textMain,fontSize:15,marginBottom:3}}>今天还没有签到哦</div>
        <div style={{fontSize:13,color:textMid,fontFamily:"sans-serif"}}>快来告诉饲养员你的状态吧~</div>
      </Card>
    )}

    <PrimaryBtn full onClick={onCheckin} style={{fontSize:16,padding:"15px",borderRadius:18,boxShadow:"0 8px 28px rgba(196,168,130,0.4)",marginBottom:10,letterSpacing:".03em"}}>
      {hasToday?"🐾 再次签到":"🐾 开始今日签到"}
    </PrimaryBtn>

    {!profile?.setupDone&&<Card style={{padding:"14px 18px",marginBottom:14,background:"linear-gradient(135deg,rgba(245,237,228,.95),rgba(255,249,240,.95))"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:22}}>✨</span>
        <div style={{flex:1}}>
          <div style={{fontFamily:serif,color:textMain,fontSize:14,fontWeight:600}}>完善猫咪档案</div>
          <div style={{fontSize:12,color:textMid,fontFamily:"sans-serif",marginTop:2}}>让饲养员更了解你，AI回应会更有针对性</div>
        </div>
        <GhostBtn onClick={()=>onNav("profile")} style={{padding:"7px 12px",flexShrink:0}}>去填写</GhostBtn>
      </div>
    </Card>}

    {records.length>1&&<div style={{marginTop:4}}>
      <div style={{fontSize:12,color:textMid,fontFamily:"sans-serif",marginBottom:9}}>最近记录</div>
      {records.slice(-4).reverse().map(r=><Card key={r.id} className="card-hover" style={{padding:"10px 16px",marginBottom:7,cursor:"pointer",display:"flex",alignItems:"center",gap:10}} onClick={()=>{}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:r.mood?.color||accent,flexShrink:0}}/>
        <span style={{fontSize:17}}>{r.mood?.emoji}</span>
        <span style={{flex:1,fontSize:13,color:textMain,fontFamily:"sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.activity}</span>
        <span style={{fontSize:11,color:textLight,fontFamily:mono,flexShrink:0}}>{fmt(r.ts)}</span>
      </Card>)}
    </div>}

    <p style={{textAlign:"center",fontSize:11,color:accent,fontFamily:"sans-serif",marginTop:22,opacity:.8}}>饲养员永远在偷偷关注你 ♡</p>
  </div>;
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,   setScreen]   = useState("loading");
  const [tab,      setTab]      = useState("home");
  const [records,  setRecords]  = useState([]);
  const [research, setResearch] = useState(null);
  const [profile,  setProfile]  = useState(null);
  const [viewing,  setViewing]  = useState(null);

  useEffect(()=>{
    Promise.all([
      db.load(SK.records).then(v=>v||[]),
      db.load(SK.research).then(v=>v||RESEARCH_DEFAULT),
      db.load(SK.profile).then(v=>v||null),
    ]).then(([r,res,p])=>{
      setRecords(r); setResearch(res); setProfile(p);
      setScreen(p?.setupDone?"app":"onboarding");
    });
  },[]);

  const handleOnboarding=async p=>{ await db.save(SK.profile,p); setProfile(p); setScreen("app"); };
  const handleSaveProfile=p=>setProfile(p);
  const handleComplete=async data=>{
    const rec={id:Date.now().toString(),ts:Date.now(),goalDone:[false,false,false],...data};
    const next=[...records,rec];
    setRecords(next); await db.save(SK.records,next);
    setViewing(rec); setScreen("report");
  };
  const handleResearchChange=res=>setResearch(res);
  const handleNav=t=>{ setTab(t); setScreen("app"); };

  if(screen==="loading") return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#fdf4ec,#f5e6d8,#ede0d4)"}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:56,animation:"float 2s ease-in-out infinite"}}>🐱</div>
        <div style={{marginTop:14,color:textMid,fontFamily:"sans-serif",fontSize:14,display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
          饲养员在准备档案 <Dots/>
        </div>
      </div>
    </div>
  );

  if(screen==="onboarding") return <Onboarding onComplete={handleOnboarding}/>;

  return(
    <>
      <style>{CSS}</style>
      <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#fdf4ec 0%,#f5e6d8 55%,#ede0d4 100%)",overflowY:"auto",paddingBottom:64}}>

        {screen==="checkin" && <CheckIn onComplete={handleComplete} profile={profile}/>}

        {screen==="report" && viewing && (
          <DailyReport record={viewing} allRecords={records} profile={profile} research={research} onBack={()=>setScreen("app")}/>
        )}

        {screen==="app" && (<>
          {tab==="home"     && <Home records={records} profile={profile} research={research} onCheckin={()=>setScreen("checkin")} onNav={handleNav}/>}
          {tab==="research" && <ResearchModule records={records} profile={profile} research={research} onResearchChange={handleResearchChange}/>}
          {tab==="digest"   && <DigestView records={records} profile={profile} research={research} onViewRecord={r=>{setViewing(r);setScreen("report");}}/>}
          {tab==="history"  && <History records={records} onSelect={r=>{setViewing(r);setScreen("report");}}/>}
          {tab==="profile"  && <ProfilePage profile={profile} onSave={handleSaveProfile} onNav={handleNav}/>}
        </>)}

        <BottomNav active={tab} onNav={handleNav} hasProfile={!!profile?.name}/>
      </div>
    </>
  );
}
