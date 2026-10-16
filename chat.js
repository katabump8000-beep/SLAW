import{initializeApp}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import{getAuth,onAuthStateChanged}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import{getDatabase,ref,get,set,update,remove,push,query,limitToLast,endBefore,orderByKey,onValue,onChildAdded,onChildChanged,onChildRemoved,serverTimestamp}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import{init as initExtra}from"./extra.js";
const app=initializeApp({apiKey:"AIzaSyBlIyelgyQBD0jHPpKve2TOjH1OnZS5LMs",authDomain:"slaw-3a991.firebaseapp.com",databaseURL:"https://slaw-3a991-default-rtdb.europe-west1.firebasedatabase.app",projectId:"slaw-3a991",storageBucket:"slaw-3a991.firebasestorage.app",messagingSenderId:"989570314649",appId:"1:989570314649:web:cb29cd40127e93f2a0e308"});
const auth=getAuth(app),db=getDatabase(app);
const R=p=>ref(db,p);

/* ====== أدوات ====== */
const el=(t,a={},...k)=>{const e=document.createElement(t);for(const[x,v]of Object.entries(a)){if(v==null||v===false)continue;if(x==='class')e.className=v;else if(x==='style')e.style.cssText=v;else if(x==='value')e.value=v;else if(x.startsWith('on'))e.addEventListener(x.slice(2),v);else e.setAttribute(x,v===true?'':v)}for(const c of k.flat()){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(String(c)))}return e};
const app$=document.getElementById('app'),sheetEl=document.getElementById('sheet'),toastEl=document.getElementById('toast'),fileIn=document.getElementById('fileIn');
let tt=0;const toast=m=>{toastEl.textContent=m;toastEl.style.display='block';clearTimeout(tt);tt=setTimeout(()=>toastEl.style.display='none',2600)};
const err=e=>toast(/PERMISSION/i.test(String(e&&(e.code||e.message)))?'غير مسموح لك بهذا الإجراء':'حدث خطأ، تأكد من الاتصال');
const hhmm=ts=>{if(!ts)return'';const d=new Date(ts);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
const rgb=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)||0);
const dark=c=>{if(!/^#[0-9a-f]{6}$/i.test(c))return'#222';return'#'+rgb(c).map(v=>Math.round(v*.62).toString(16).padStart(2,'0')).join('')};
const copy=async t=>{try{await navigator.clipboard.writeText(t)}catch(e){const a=el('textarea',{value:t});document.body.append(a);a.select();document.execCommand('copy');a.remove()}toast('تم النسخ')};
function openSheet(...k){sheetEl.replaceChildren(el('div',{},...k));sheetEl.classList.add('on')}
function closeSheet(){sheetEl.classList.remove('on');sheetEl.replaceChildren()}
sheetEl.addEventListener('click',e=>{if(e.target===sheetEl)closeSheet()});
function pickFile(){return new Promise(r=>{fileIn.value='';fileIn.onchange=()=>r(fileIn.files[0]||null);fileIn.click()})}
function compress(file,max,q,sq,type){return new Promise((res,rej)=>{const img=new Image(),u=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(u);let w=img.width,h=img.height,sx=0,sy=0,sw=w,sh=h;if(sq){const s=Math.min(w,h);sx=(w-s)/2;sy=(h-s)/2;sw=sh=s;w=h=s}const k=Math.min(1,max/Math.max(w,h)),cw=Math.round(w*k),ch=Math.round(h*k),c=document.createElement('canvas');c.width=cw;c.height=ch;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cw,ch);x.drawImage(img,sx,sy,sw,sh,0,0,cw,ch);let o=c.toDataURL(type||'image/jpeg',q);if(type&&!o.startsWith('data:'+type))o=c.toDataURL('image/jpeg',q);res(o)};img.onerror=()=>rej(new Error('img'));img.src=u})}
async function fit(file,sizes,limit,sq,type){for(const s of sizes){let q=.8;do{const d=await compress(file,s,q,sq,type);if(d.length<limit)return d;q-=.12}while(q>.3)}throw new Error('big')}

/* ====== الحالة ====== */
let uid='',me={},EMP='',myRole=null,groups={},mem={},cleanup=[],ex=null,visitInfo=null;
const isEmp=()=>uid===EMP,isDev=()=>isEmp()||myRole==='dev';
const P=new Map(),RL=new Map(),AV=new Map();
const prof=u=>{if(!P.has(u))P.set(u,get(R('profiles/'+u)).then(s=>s.val()||{name:'عضو',color:'#888888'}).catch(()=>({name:'عضو',color:'#888888'})));return P.get(u)};
const roleOf=u=>{if(u===EMP)return Promise.resolve('emp');if(!RL.has(u))RL.set(u,get(R('roles/'+u)).then(s=>s.val()).catch(()=>null));return RL.get(u)};
const avOf=u=>{if(!AV.has(u))AV.set(u,get(R('avatars/'+u)).then(s=>s.val()||'').catch(()=>''));return AV.get(u)};
function avatar(u,cls=''){const d=el('div',{class:'av '+cls});prof(u).then(p=>{if(!d.style.backgroundImage)d.textContent=(p.name||'?')[0]});avOf(u).then(a=>{if(a){d.style.backgroundImage=`url(${a})`;d.textContent=''}});return d}
function botAv(cls=''){return el('div',{class:'av bot '+cls},'ALJESI')}
const KN={main:'نقابة',ads:'إعلانات',shop:'المتجر',news:'الصحيفة'};
function rankTag(r,isAdm){if(r==='emp')return el('span',{class:'tag king'},'الإمبراطور');if(r==='dev')return el('span',{class:'tag'},'رتبة عليا');if(isAdm)return el('span',{class:'tag'},'مشرف');return null}
const run=()=>{cleanup.forEach(f=>{try{f()}catch(e){}});cleanup=[]};

/* ====== الدخول ====== */
onAuthStateChanged(auth,async u=>{
  if(!u){location.replace('index.html');return}
  uid=u.uid;
  try{
    const[p,emp,rl,ban]=await Promise.all([get(R('profiles/'+uid)),get(R('config/emperorUid')),get(R('roles/'+uid)),get(R('banned/'+uid))]);
    if(!p.exists()){location.replace('index.html');return}
    if(ban.exists()){app$.replaceChildren(el('div',{class:'blk'},'تم حظرك من التطبيق'));return}
    me=p.val();EMP=emp.val()||'';myRole=rl.val()||null;P.set(uid,Promise.resolve(me));
    await loadGroups();
    ex=initExtra({db,app:app$,el,toast,err,openSheet,closeSheet,go,back,avatar,prof,roleOf,copy,botAv,
      uid:()=>uid,me:()=>me,groups:()=>groups,mem:()=>mem,isDev,isEmp,EMP:()=>EMP,
      dropProf:u=>P.delete(u),reinfo:g=>info(g)});
    visitInfo=await ex.checkVisit();ex.start();
    window.addEventListener('hashchange',route);route();
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&(location.hash===''||location.hash==='#'))loadGroups().then(route)});
  }catch(e){app$.replaceChildren(el('div',{class:'blk'},'تعذر الاتصال، أغلق التطبيق وافتحه مجدداً'))}
});

async function loadGroups(){
  groups=(await get(R('groups'))).val()||{};
  const m={};
  await Promise.all(Object.keys(groups).map(async g=>{try{const s=await get(R(`members/${g}/${uid}`));if(s.exists())m[g]=s.val()}catch(e){}}));
  const join=async g=>{try{await set(R(`members/${g}/${uid}`),true);m[g]=true}catch(e){}};
  for(const g of Object.keys(groups))if(groups[g].kind==='news'&&!m[g])await join(g);
  if(isDev())for(const g of Object.keys(groups))if(!m[g])await join(g);
  const mains=Object.keys(m).filter(g=>groups[g]&&groups[g].kind==='main'&&m[g]===true);
  if(mains.length)for(const g of Object.keys(groups))if((groups[g].kind==='ads'||groups[g].kind==='shop')&&!m[g])await join(g);
  mem=m;
  if(mains.length>=2&&!isDev())set(R('multi/'+uid),true).catch(()=>{});
}

/* ====== التوجيه ====== */
function route(){
  run();closeSheet();
  const h=location.hash.replace('#','');const[a,b]=h.split('/');
  if(ex&&ex.route(a))return;
  if(a==='g'&&b)return chat(b);
  if(a==='i'&&b)return info(b);
  if(a==='s')return settings();
  if(a==='e'&&isEmp())return empMenu();
  home();
}
const go=h=>{location.hash=h};
const back=()=>history.length>1?history.back():go('');

/* ====== الرئيسية ====== */
function home(){
  const bal=el('div',{class:'bal'},'…');
  cleanup.push(onValue(R('wallets/'+uid+'/bal'),s=>{const v=s.val()||0;bal.textContent='💰 '+v;bal.classList.toggle('neg',v<0)},()=>{}));
  const list=el('div',{class:'list'});
  const ids=Object.keys(mem).filter(g=>groups[g]).sort((a,b)=>(groups[a].kind==='main'?0:1)-(groups[b].kind==='main'?0:1));
  const hasMain=ids.some(g=>groups[g].kind==='main'&&mem[g]===true);
  if(!hasMain&&!isDev())list.append(el('div',{class:'note'},'أهلاً بك 🔥\nأنت الآن في غرفة الانتظار. سيضيفك أحد المطورين إلى نقابة قريباً، أو يمكنك الدخول برمز إحالة من أحد أعضاء النقابات عند التسجيل.'));
  if(visitInfo&&groups[visitInfo.g])list.append(el('div',{class:'note'},'✈️ أنت زائر في نقابة «'+groups[visitInfo.g].name+'» وستعود إلى نقابتك بعد '+Math.max(1,Math.ceil((visitInfo.until-Date.now())/864e5))+' يوم. رصيدك معك.'));
  if(!ids.length)list.append(el('div',{class:'empty'},'لا توجد قروبات بعد'));
  for(const g of ids){
    const gm=groups[g],ph=el('div',{class:'av'},(gm.name||'?')[0]);
    get(R('groupPhotos/'+g)).then(s=>{if(s.val()){ph.style.backgroundImage=`url(${s.val()})`;ph.textContent=''}}).catch(()=>{});
    list.append(el('div',{class:'row',onclick:()=>go('g/'+g)},ph,el('div',{class:'t'},el('b',{},gm.name),el('small',{},KN[gm.kind]||''))
      ,mem[g]==='v'?el('span',{class:'tag'},'زائر'):null));
  }
  const hdr=el('div',{class:'hdr'},el('div',{onclick:()=>go('s')},avatar(uid)),el('h1',{},me.name),bal,
    el('button',{class:'ib',onclick:()=>go('shop')},'🛒'),isEmp()?el('button',{class:'ib',onclick:()=>go('e')},'👑'):null,el('button',{class:'ib',onclick:()=>go('s')},'⚙️'));
  app$.replaceChildren(hdr,list,isDev()?el('button',{class:'fab',onclick:newGroup},'+'):null);
}
function newGroup(){
  const nm=el('input',{placeholder:'اسم القروب',maxlength:'40'});
  const kd=el('select',{},...Object.entries(KN).map(([k,v])=>el('option',{value:k},v)));
  openSheet(el('h3',{},'إنشاء قروب'),nm,kd,el('button',{class:'btn',onclick:async()=>{
    const name=nm.value.trim();if(!name)return toast('اكتب اسم القروب');
    const g=push(R('groups')).key,kind=kd.value;
    try{await update(ref(db),{[`groups/${g}`]:{name,kind,locked:kind!=='main',desc:'',ts:serverTimestamp(),by:uid},[`members/${g}/${uid}`]:true,...(kind==='main'?{[`guildStats/${g}`]:{atk:1,def:1}}:{})});
      groups[g]={name,kind,locked:kind!=='main',desc:''};mem[g]=true;closeSheet();go('i/'+g)}catch(e){err(e)}
  }},'إنشاء'),el('button',{class:'btn g',onclick:closeSheet},'إلغاء'));
}

/* ====== الدردشة ====== */
const stickerCache=new Map();
function stickerData(sid){const c=localStorage.getItem('st_'+sid);if(c)return Promise.resolve(c);if(!stickerCache.has(sid))stickerCache.set(sid,get(R('stickers/'+sid)).then(s=>{const d=s.val()&&s.val().d||'';if(d){try{localStorage.setItem('st_'+sid,d)}catch(e){}}return d}).catch(()=>''));return stickerCache.get(sid)}
function applyBg(box){const b=localStorage.getItem('bg')||'linear-gradient(160deg,#120804,#2a0f06)';box.style.backgroundImage=/^data:/.test(b)?`url(${b})`:b}

async function chat(gid){
  const gm=groups[gid];if(!gm||!mem[gid]){go('');return}
  let admins={},bios={},locked=!!gm.locked,mine=mem[gid];
  const isStaff=()=>isDev()||!!admins[uid];
  const canWrite=()=>isDev()?true:(gm.kind==='main'&&(!locked||isStaff()));
  const box=el('div',{id:'msgs'});applyBg(box);
  const comp=el('div');
  const title=el('h1',{onclick:()=>go('i/'+gid)},gm.name);
  const wbox=el('div');
  app$.replaceChildren(el('div',{class:'hdr'},el('button',{class:'ib',onclick:back},'→'),title,
    gm.kind==='shop'?el('button',{class:'ib',onclick:()=>go('shop')},'🛒'):null,
    gm.kind==='main'?el('button',{class:'ib',onclick:()=>ex.gamesSheet(gid)},'🎮'):null,
    el('button',{class:'ib',onclick:()=>go('i/'+gid)},'ℹ️')),wbox,box,comp);
  ex.warBanner(gid,wbox,cleanup);

  const els=new Map(),data=new Map(),pending=new Set();let oldest=null,sendT=0;
  const near=()=>box.scrollHeight-box.scrollTop-box.clientHeight<140;
  const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){const id=e.target.dataset.id,m=data.get(id);if(m&&m.from!==uid&&m.type!=='sys'&&!(m.seen&&m.seen[uid])&&!document.hidden){pending.add(id);io.unobserve(e.target);clearTimeout(sendT);sendT=setTimeout(flush,1200)}}},{root:box,threshold:.6});
  async function flush(){if(!pending.size)return;const u={};for(const id of pending){u[`messages/${gid}/${id}/seen/${uid}`]=serverTimestamp()}pending.clear();try{await update(ref(db),u)}catch(e){}}
  cleanup.push(()=>{io.disconnect();flush()});

  function bubble(id,m){
    if(m.type==='sys'){const c=ex&&ex.sysCard(m),wide=m.k==='rank'||m.k==='war';return el('div',{class:'sys'+(wide?' wide':''),'data-id':id},wide?null:botAv('s'),c||el('div',{},m.text))}
    const own=m.from===uid,c=/^#[0-9a-f]{6}$/i.test(m.color||'')?m.color:'#5b5be0';
    const bub=el('div',{class:'bub',style:`background:linear-gradient(135deg,${c},${dark(c)})`});
    if(!own){const nm=el('div',{class:'nm'});prof(m.from).then(p=>{nm.prepend(p.name||'عضو')});roleOf(m.from).then(r=>{const t=rankTag(r,!!admins[m.from]);if(t)nm.append(t)});if(m.vis)nm.append(el('span',{class:'tag'},'زائر'));bub.append(nm);
      const b=bios[m.from];if(b&&b.t)bub.append(el('div',{class:'bio',style:b.c?`color:${b.c}`:''},b.t))}
    if(m.type==='text')bub.append(el('div',{class:'tx'},m.text));
    else if(m.type==='image')bub.append(el('img',{class:'im',src:m.img}));
    else if(m.type==='sticker'){const im=el('img',{class:'st'});stickerData(m.sid).then(d=>{if(d)im.src=d});bub.append(im)}
    const sc=Object.keys(m.seen||{}).filter(x=>x!==m.from).length;
    bub.append(el('div',{class:'ft'},m.edited?'تم التعديل':null,hhmm(m.ts),own&&sc?('👁 '+sc):null));
    const w=el('div',{class:'msg '+(own?'me':'ot'),'data-id':id},own?null:avatar(m.from,'s'),bub);
    let t0=0,mv=false;
    bub.addEventListener('pointerdown',e=>{mv=false;t0=setTimeout(()=>{if(!mv)msgMenu(id)},450)});
    bub.addEventListener('pointermove',()=>{mv=true;clearTimeout(t0)});
    ['pointerup','pointercancel','pointerleave'].forEach(x=>bub.addEventListener(x,()=>clearTimeout(t0)));
    bub.addEventListener('contextmenu',e=>e.preventDefault());
    return w;
  }
  function put(id,m){
    data.set(id,m);const was=near(),n=bubble(id,m),old=els.get(id);
    if(old){io.unobserve(old);old.replaceWith(n)}else box.append(n);
    els.set(id,n);io.observe(n);if(was||m.from===uid)box.scrollTop=box.scrollHeight;
  }
  function msgMenu(id){
    const m=data.get(id);if(!m||m.type==='sys')return;const own=m.from===uid;
    openSheet(el('h3',{},'الرسالة'),
      el('button',{class:'btn g',onclick:()=>seenInfo(id)},'👁 من شاهد الرسالة'),
      m.type==='text'?el('button',{class:'btn g',onclick:()=>{copy(m.text);closeSheet()}},'📋 نسخ'):null,
      own&&m.type==='text'?el('button',{class:'btn g',onclick:()=>editMsg(id)},'✏️ تعديل'):null,
      (own||isStaff())?el('button',{class:'btn r',onclick:async()=>{closeSheet();try{await remove(R(`messages/${gid}/${id}`))}catch(e){err(e)}}},'🗑 حذف'):null);
  }
  async function seenInfo(id){
    const m=data.get(id),s=Object.entries(m.seen||{}).filter(([u])=>u!==m.from).sort((a,b)=>a[1]-b[1]);
    const rows=el('div');openSheet(el('h3',{},'شاهدها ('+s.length+')'),rows,el('button',{class:'btn g',onclick:closeSheet},'إغلاق'));
    if(!s.length)rows.append(el('div',{class:'empty'},'لم يشاهدها أحد بعد'));
    for(const[u,t]of s)rows.append(el('div',{class:'row'},avatar(u,'s'),el('div',{class:'t'},el('b',{id:'sn'+u},'…')),el('small',{},hhmm(t))));
    for(const[u]of s)prof(u).then(p=>{const e=document.getElementById('sn'+u);if(e)e.textContent=p.name||'عضو'});
  }
  function editMsg(id){
    const m=data.get(id),ta=el('textarea',{value:m.text,rows:'4',maxlength:'2000'});
    openSheet(el('h3',{},'تعديل الرسالة'),ta,el('button',{class:'btn',onclick:async()=>{const t=ta.value.trim();if(!t)return;closeSheet();try{await update(R(`messages/${gid}/${id}`),{text:t,edited:true,editedAt:Date.now()})}catch(e){err(e)}}},'حفظ'));
  }
  const q=query(R('messages/'+gid),limitToLast(30));
  const u1=onChildAdded(q,s=>{if(oldest===null||s.key<oldest)oldest=s.key;put(s.key,s.val())},e=>err(e));
  const u2=onChildChanged(q,s=>put(s.key,s.val()));
  const u3=onChildRemoved(q,s=>{const n=els.get(s.key);if(n){io.unobserve(n);n.remove()}els.delete(s.key);data.delete(s.key)});
  cleanup.push(u1,u2,u3);
  const more=el('button',{class:'btn g',style:'align-self:center;padding:6px 14px;font-size:13px',onclick:async()=>{
    if(!oldest)return;try{const s=await get(query(R('messages/'+gid),orderByKey(),endBefore(oldest),limitToLast(30)));const arr=[];s.forEach(c=>{arr.push([c.key,c.val()])});if(!arr.length){more.remove();return}
      const h0=box.scrollHeight;for(const[k,v]of arr.reverse()){if(k<oldest)oldest=k;data.set(k,v);const n=bubble(k,v);els.set(k,n);more.after(n)}
      // رتّب القديمة بترتيب صحيح
      const keys=[...els.keys()].sort();for(const k of keys)box.append(els.get(k));box.prepend(more);box.scrollTop=box.scrollHeight-h0}catch(e){err(e)}}},'تحميل رسائل أقدم');
  box.prepend(more);
  cleanup.push(onValue(R('groupAdmins/'+gid),s=>{admins=s.val()||{};drawComp()}));
  cleanup.push(onValue(R('groups/'+gid+'/locked'),s=>{locked=s.val()===true;drawComp()}));
  cleanup.push(onValue(R('groupBios/'+gid),s=>{bios=s.val()||{}},()=>{}));

  // ترحيب ALJESI عند أول دخول لنقابة
  if(gm.kind==='main'&&mine===true){
    get(R(`welcomed/${gid}/${uid}`)).then(async s=>{if(s.exists())return;const k=push(R('messages/'+gid)).key;
      try{await update(ref(db),{[`welcomed/${gid}/${uid}`]:true,[`messages/${gid}/${k}`]:{from:uid,type:'sys',k:'welcome',text:`🔥 انضم ${me.name} إلى النقابة، رحّبوا به! حصل على 100 رصيد كعضو جديد.`,ts:serverTimestamp()}})}catch(e){}}).catch(()=>{});
  }

  /* شريط الكتابة */
  let panel=null;
  function drawComp(){
    if(!canWrite()){comp.replaceChildren(el('div',{class:'lockbar'},gm.kind==='main'?'الشات مقفل من المشرفين 🔒':'للقراءة فقط'));return}
    const ta=el('textarea',{rows:'1',placeholder:'اكتب رسالة…',maxlength:'2000'});
    ta.addEventListener('input',()=>{ta.style.height='auto';ta.style.height=Math.min(110,ta.scrollHeight)+'px'});
    const sendTxt=async()=>{const t=ta.value.trim();if(!t)return;ta.value='';ta.style.height='auto';
      try{await ex.send(gid,gm,t)}catch(e){err(e);ta.value=t}};
    const stk=el('div',{class:'stp',style:'display:none'});
    const btnS=el('button',{class:'ib',onclick:async()=>{if(stk.style.display==='none'){stk.style.display='flex';await fillStickers(stk,async sid=>{stk.style.display='none';try{await set(push(R('messages/'+gid)),{from:uid,type:'sticker',sid,ts:serverTimestamp(),color:me.color||'#ff7a1a'})}catch(e){err(e)}})}else stk.style.display='none'}},'😊');
    comp.replaceChildren(stk,el('div',{class:'cmp'},btnS,ta,el('button',{class:'send',onclick:sendTxt},'➤')));
  }
  drawComp();
}
async function fillStickers(box,onPick){
  box.replaceChildren(el('div',{class:'add',onclick:makeSticker},'+'));
  try{const s=await get(R('myStickers/'+uid));for(const sid of Object.keys(s.val()||{})){const im=el('img',{onclick:()=>onPick(sid)});stickerData(sid).then(d=>{if(d)im.src=d});box.append(im)}}catch(e){}
}
async function makeSticker(){
  const f=await pickFile();if(!f)return;
  try{
    const d=await fit(f,[256,200,150],24000,true,'image/webp');
    const sid=push(R('stickers')).key;
    await update(ref(db),{[`stickers/${sid}`]:{u:uid,d},[`myStickers/${uid}/${sid}`]:true});
    try{localStorage.setItem('st_'+sid,d)}catch(e){}
    toast('تم إنشاء الملصق ✅');closeSheet();
    const open=document.querySelector('.stp');if(open&&open.style.display!=='none')fillStickers(open,()=>{})
  }catch(e){err(e)}
}

/* ====== معلومات القروب ====== */
async function info(gid){
  const gm=groups[gid];if(!gm){go('');return}
  const staffNow=()=>isDev()||admins[uid];let admins={};
  const body=el('div',{class:'list'});
  app$.replaceChildren(el('div',{class:'hdr'},el('button',{class:'ib',onclick:back},'→'),el('h1',{},'معلومات القروب')),body);
  const gv=await get(R('groups/'+gid)).then(s=>s.val()||gm).catch(()=>gm);Object.assign(gm,gv);
  admins=await get(R('groupAdmins/'+gid)).then(s=>s.val()||{}).catch(()=>({}));
  const staff=isDev()||!!admins[uid];
  const ph=el('div',{class:'av l'},(gm.name||'?')[0]);
  get(R('groupPhotos/'+gid)).then(s=>{if(s.val()){ph.style.backgroundImage=`url(${s.val()})`;ph.textContent=''}}).catch(()=>{});
  if(staff)ph.onclick=async()=>{const f=await pickFile();if(!f)return;try{const d=await fit(f,[200,160,120],29000,true);await set(R('groupPhotos/'+gid),d);ph.style.backgroundImage=`url(${d})`;ph.textContent=''}catch(e){err(e)}};
  const nameEl=el('h2',{style:'margin:8px 0 2px'},gm.name),descEl=el('p',{},gm.desc||'لا يوجد وصف');
  body.append(el('div',{class:'sec',style:'text-align:center'},el('div',{style:'display:flex;justify-content:center'},ph),nameEl,el('span',{class:'tag'},KN[gm.kind]||''),
    staff?el('div',{style:'color:var(--mu);font-size:12px;margin-top:6px'},'اضغط الصورة لتغييرها'):null));
  const dsec=el('div',{class:'sec'},el('h4',{},'وصف القروب'),descEl);
  if(staff){dsec.append(el('button',{class:'btn g',style:'margin-top:8px',onclick:()=>{
    const ta=el('textarea',{value:gm.desc||'',rows:'5',maxlength:'300'}),nm=el('input',{value:gm.name,maxlength:'40'});
    openSheet(el('h3',{},'تعديل'),nm,ta,el('button',{class:'btn',onclick:async()=>{try{await update(R('groups/'+gid),{desc:ta.value.trim(),name:nm.value.trim()||gm.name});gm.desc=ta.value.trim();gm.name=nm.value.trim()||gm.name;descEl.textContent=gm.desc||'لا يوجد وصف';nameEl.textContent=gm.name;closeSheet()}catch(e){err(e)}}},'حفظ'))}},'✏️ تعديل الاسم والوصف'))}
  body.append(dsec);
  await ex.guildPanel(gid,gm,body);
  if(staff&&gm.kind==='main'||isDev()){
    const sec=el('div',{class:'sec'},el('h4',{},'الإعدادات'));
    if(staff){const sw=el('input',{type:'checkbox',style:'width:auto',onchange:async e=>{try{await set(R(`groups/${gid}/locked`),e.target.checked);gm.locked=e.target.checked}catch(x){err(x);e.target.checked=!e.target.checked}}});sw.checked=!!gm.locked;sec.append(el('div',{class:'sw'},el('span',{},'قفل الشات'),sw))}
    if(isDev()){const kd=el('select',{style:'margin-top:10px',onchange:async()=>{try{const k=kd.value;await update(R('groups/'+gid),{kind:k,locked:k!=='main'?true:!!gm.locked});gm.kind=k;if(k!=='main')gm.locked=true;toast('تم التغيير')}catch(e){err(e)}}},...Object.entries(KN).map(([k,v])=>el('option',{value:k},v)));kd.value=gm.kind;sec.append(el('div',{style:'margin-top:8px'},el('span',{},'نوع القروب'),kd))}
    if(staff&&gm.kind==='main'){const pal=el('div',{class:'cols',style:'margin-top:6px'});['#2a6cff','#e53935','#8e24aa','#00897b','#f9a825','#d81b60','#43a047','#ff7a1a'].forEach(c=>pal.append(el('div',{class:'cc',style:'background:'+c,onclick:async()=>{try{await set(R(`groups/${gid}/c`),c);gm.c=c;toast('تم اختيار لون النقابة ✅')}catch(e){err(e)}}})));sec.append(el('div',{style:'margin-top:10px;color:var(--mu)'},'لون النقابة (يظهر في قوائم الحسبة)'),pal)}
    body.append(sec);
  }
  // رمز النشر الخاص بي
  if(gm.kind==='main'){get(R(`pubPerm/${gid}/${uid}`)).then(s=>{if(s.val())body.append(el('div',{class:'sec'},el('h4',{},'أنت تملك صلاحيات النشر'),el('p',{},'هذا رمز الإحالة الخاص بك. من يسجّل به يدخل نقابتك وتحصل على 100 رصيد.'),el('div',{class:'code',style:'margin:8px 0'},s.val()),el('button',{class:'btn',onclick:()=>copy(s.val())},'نسخ الرمز')))}).catch(()=>{})}
  // الأعضاء
  const msec=el('div',{class:'sec'},el('h4',{},'الأعضاء'));body.append(msec);
  if(mem[gid]!==true&&!isDev()){msec.append(el('p',{},'لا يمكن رؤية أعضاء هذا القروب.'));return}
  const mlist=el('div');msec.append(mlist);
  if(isDev())msec.append(el('button',{class:'btn g',style:'margin-top:8px',onclick:()=>addMember(gid,gm)},'➕ إضافة عضو'));
  let ms={};try{ms=(await get(R('members/'+gid))).val()||{}}catch(e){mlist.append(el('p',{},'تعذّر تحميل الأعضاء'));return}
  const ids=Object.keys(ms);msec.firstChild.textContent='الأعضاء ('+ids.length+')';
  let bios={};try{bios=(await get(R('groupBios/'+gid))).val()||{}}catch(e){}
  for(const u of ids){
    const nm=el('b',{},'…'),sub=el('small',{}),row=el('div',{class:'row'},avatar(u),el('div',{class:'t'},nm,sub));
    prof(u).then(p=>{nm.textContent=p.name||'عضو'});
    roleOf(u).then(r=>{const t=rankTag(r,!!admins[u]);if(t)nm.after(t)});
    if(bios[u]&&bios[u].t)sub.textContent=bios[u].t,bios[u].c&&(sub.style.color=bios[u].c);
    if(ms[u]==='v')row.append(el('span',{class:'tag'},'زائر'));
    if(staff&&gm.kind==='main')get(R('multi/'+u)).then(s=>{if(s.val())nm.after(el('span',{class:'tag red'},'تعدد'))}).catch(()=>{});
    if(staff&&u!==uid)row.onclick=()=>memberMenu(gid,gm,u,admins,bios[u],()=>info(gid));
    mlist.append(row);
  }
}
async function memberMenu(gid,gm,u,admins,bio,again){
  const p=await prof(u),r=await roleOf(u),high=r==='emp'||r==='dev';
  if(r==='emp'&&!isEmp()){toast('لا يمكن التحكم بهذه الرتبة');return}
  if(high&&!isDev()){toast('لا يمكن التحكم بالرتب العليا');return}
  const act=f=>async()=>{closeSheet();try{await f();toast('تم ✅');again()}catch(e){err(e)}};
  const ban=h=>act(()=>set(R(`bans/${gid}/${u}`),Date.now()+h*3600e3));
  openSheet(el('h3',{},p.name||'عضو'),
    el('button',{class:'btn g',onclick:()=>bioSheet(gid,u,bio,again)},'📝 نبذة ولون النص'),
    el('button',{class:'btn g',onclick:ban(1)},'🔇 كتم ساعة'),el('button',{class:'btn g',onclick:ban(24)},'🔇 كتم يوم'),el('button',{class:'btn g',onclick:ban(168)},'🔇 كتم أسبوع'),
    el('button',{class:'btn g',onclick:act(()=>remove(R(`bans/${gid}/${u}`)))},'🔊 إلغاء الكتم'),
    gm.kind==='main'?el('button',{class:'btn g',onclick:act(async()=>{const c=String(Math.floor(Math.random()*1e8)).padStart(8,'0');await update(ref(db),{[`refCodes/${c}`]:{u,g:gid},[`pubPerm/${gid}/${u}`]:c})})},'🔗 منح صلاحية النشر (رمز إحالة)'):null,
    gm.kind==='main'?el('button',{class:'btn g',onclick:act(async()=>{const s=await get(R(`pubPerm/${gid}/${u}`));if(s.val())await update(ref(db),{[`refCodes/${s.val()}`]:null,[`pubPerm/${gid}/${u}`]:null})})},'⛔ سحب صلاحية النشر'):null,
    isDev()?el('button',{class:'btn g',onclick:act(()=>admins[u]?remove(R(`groupAdmins/${gid}/${u}`)):set(R(`groupAdmins/${gid}/${u}`),true))},admins[u]?'⬇️ إزالة الإشراف':'⬆️ تعيين مشرف'):null,
    el('button',{class:'btn r',onclick:act(()=>remove(R(`members/${gid}/${u}`)))},'🚪 طرد من القروب'));
}
function bioSheet(gid,u,bio,again){
  bio=bio||{};let col=bio.c||'#ffb04a';
  const t=el('input',{value:bio.t||'',maxlength:'40',placeholder:'النبذة (تظهر تحت اسمه)'});
  const cols=el('div',{class:'cols'}),P=['#ffb04a','#ff5a4d','#ff7eb6','#c792ff','#7fb2ff','#5de0e6','#6ee787','#ffe066','#ffffff'];
  const draw=()=>cols.replaceChildren(...P.map(c=>el('div',{class:'cc'+(c===col?' on':''),style:'background:'+c,onclick:()=>{col=c;draw()}})));draw();
  openSheet(el('h3',{},'نبذة العضو'),t,cols,el('button',{class:'btn',onclick:async()=>{closeSheet();try{const v=t.value.trim();await (v?set(R(`groupBios/${gid}/${u}`),{t:v,c:col}):remove(R(`groupBios/${gid}/${u}`)));toast('تم ✅');again()}catch(e){err(e)}}},'حفظ'),
    el('button',{class:'btn g',onclick:closeSheet},'إلغاء'));
}
async function addMember(gid,gm){
  const s=el('input',{placeholder:'ابحث بالاسم'}),list=el('div');
  openSheet(el('h3',{},'إضافة عضو'),s,list);
  let all={};try{all=(await get(R('profiles'))).val()||{}}catch(e){err(e);return}
  const draw=()=>{const q=s.value.trim();list.replaceChildren(...Object.entries(all).filter(([k,v])=>!q||(v.name||'').includes(q)).slice(0,40).map(([k,v])=>
    el('div',{class:'row',onclick:async()=>{try{await set(R(`members/${gid}/${k}`),true);
      if(gm.kind==='main'){let n=0;for(const g of Object.keys(groups))if(groups[g].kind==='main'&&(await get(R(`members/${g}/${k}`))).val()===true)n++;if(n>=2)await set(R('multi/'+k),true)}
      toast('تمت الإضافة ✅');closeSheet();info(gid)}catch(e){err(e)}}},el('div',{class:'av s'},(v.name||'?')[0]),el('div',{class:'t'},el('b',{},v.name||'عضو')))))};
  s.oninput=draw;draw();
}

/* ====== الإعدادات ====== */
function settings(){
  const COLS=['#ff7a1a','#e53935','#d81b60','#8e24aa','#5e35b1','#3949ab','#1e88e5','#00acc1','#00897b','#43a047','#7cb342','#f9a825','#6d4c41','#546e7a'];
  const BGS=['linear-gradient(160deg,#120804,#2a0f06)','linear-gradient(160deg,#0d0f1a,#1a1230)','linear-gradient(160deg,#04141a,#0a2a2a)','linear-gradient(160deg,#1a0a14,#2e1020)','linear-gradient(160deg,#111,#222)','linear-gradient(160deg,#1c1304,#3a2a08)'];
  const body=el('div',{class:'list'}),colsEl=el('div',{class:'cols'}),bgEl=el('div',{class:'cols'});
  const drawC=()=>colsEl.replaceChildren(...COLS.map(c=>el('div',{class:'cc'+(c===me.color?' on':''),style:'background:'+c,onclick:async()=>{try{await set(R(`profiles/${uid}/color`),c);me.color=c;drawC()}catch(e){err(e)}}})));
  const curBg=()=>localStorage.getItem('bg')||BGS[0];
  const drawB=()=>bgEl.replaceChildren(...BGS.map(b=>el('div',{class:'bgp'+(b===curBg()?' on':''),style:'background:'+b,onclick:()=>{localStorage.setItem('bg',b);drawB()}})),
    el('div',{class:'bgp',style:'display:flex;align-items:center;justify-content:center;border:2px dashed var(--line);font-size:24px',onclick:async()=>{const f=await pickFile();if(!f)return;try{const d=await compress(f,800,.6,false);localStorage.setItem('bg',d);drawB();toast('تم تعيين الخلفية')}catch(e){toast('تعذر تحميل الصورة')}}},'🖼'));
  drawC();drawB();
  const av=avatar(uid,'l');av.onclick=async()=>{const f=await pickFile();if(!f)return;try{const d=await fit(f,[128,100,80],29000,true);await set(R('avatars/'+uid),d);AV.set(uid,Promise.resolve(d));av.style.backgroundImage=`url(${d})`;av.textContent=''}catch(e){err(e)}};
  body.append(el('div',{class:'sec',style:'text-align:center'},el('div',{style:'display:flex;justify-content:center'},av),el('h2',{style:'margin:8px 0 2px'},me.name),el('small',{style:'color:var(--mu)'},'اضغط الصورة لتغييرها')),
    el('div',{class:'sec'},el('h4',{},'لون فقاعات رسائلك'),colsEl),
    el('div',{class:'sec'},el('h4',{},'خلفية الدردشة (لك فقط)'),bgEl));
  app$.replaceChildren(el('div',{class:'hdr'},el('button',{class:'ib',onclick:back},'→'),el('h1',{},'الإعدادات')),body);
}

/* ====== قائمة الإمبراطور ====== */
async function empMenu(){
  const s=el('input',{placeholder:'ابحث بالاسم'}),list=el('div',{class:'list'});
  app$.replaceChildren(el('div',{class:'hdr'},el('button',{class:'ib',onclick:back},'→'),el('h1',{},'👑 المستخدمون')),ex.empExtras(),el('div',{style:'padding:10px'},s),list);
  let all={};try{all=(await get(R('profiles'))).val()||{}}catch(e){err(e);return}
  const roles={};await Promise.all(Object.keys(all).map(async u=>{roles[u]=await roleOf(u)}));
  const draw=()=>{const q=s.value.trim(),ents=Object.entries(all).filter(([k,v])=>!q||(v.name||'').includes(q));
    list.replaceChildren(el('div',{style:'padding:4px 14px;color:var(--mu);font-size:13px'},'عدد المستخدمين: '+Object.keys(all).length),...ents.map(([u,v])=>{
      const r=roles[u],btn=u===uid?null:el('button',{class:'btn '+(r==='dev'?'r':'g'),style:'padding:8px 12px;font-size:13px',onclick:async e=>{e.stopPropagation();try{if(r==='dev'){await remove(R('roles/'+u));roles[u]=null}else{await set(R('roles/'+u),'dev');roles[u]='dev'}RL.set(u,Promise.resolve(roles[u]));draw()}catch(x){err(x)}}},r==='dev'?'إزالة الرتبة':'تعيين مطور');
      return el('div',{class:'row'},avatar(u),el('div',{class:'t'},el('b',{},v.name||'عضو'),el('small',{},(v.gender==='f'?'أنثى':'ذكر')+(r==='dev'?' • رتبة عليا':u===EMP?' • الإمبراطور':''))),btn)}))};
  s.oninput=draw;draw();
}
