import{initializeApp}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import{getAuth,onAuthStateChanged}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import{getDatabase,ref,get,set,update,remove,push,query,limitToLast,endBefore,orderByKey,onValue,onChildAdded,onChildChanged,onChildRemoved,serverTimestamp,increment}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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
const ageTag=p=>{const d=(Date.now()-(p.ts||Date.now()))/864e5,[t,c]=d<3?['جديد','#5de0e6']:d<30?['عضو','#6ee787']:d<90?['قديم','#ffb04a']:['أسطورة','#ff7eb6'];return el('span',{class:'tag',style:`color:${c};background:${c}22`},t)};
const zoom=src=>{const o=el('div',{class:'ov',style:'align-items:center;justify-content:center;padding:0;background:#000e',onclick:()=>o.remove()},el('img',{src,style:'max-width:100%;max-height:100%;object-fit:contain'}));document.body.append(o)};
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
      dropProf:u=>P.delete(u),reinfo:g=>info(g),onLeave:f=>cleanup.push(f)});
    visitInfo=await ex.checkVisit();ex.start();
    if(!(await ex.integrity())){app$.replaceChildren(el('div',{class:'blk'},'⛔ تم حظرك\nلا تعبث مع الجي سي'));return}
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
  if(ex&&ex.route(a,b))return;
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
    el('button',{class:'ib',onclick:()=>go('shop')},'🛒'),isDev()?el('button',{class:'ib',onclick:()=>go('d')},'💬'):null,isEmp()?el('button',{class:'ib',onclick:()=>go('e')},'👑'):null,el('button',{class:'ib',onclick:()=>go('s')},'⚙️'));
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
    if(!own){const nm=el('div',{class:'nm'});prof(m.from).then(p=>{nm.prepend(p.name||'عضو');nm.append(ageTag(p))});roleOf(m.from).then(r=>{const t=rankTag(r,!!admins[m.from]);if(t)nm.append(t)});if(m.vis)nm.append(el('span',{class:'tag'},'زائر'));bub.append(nm);
      const b=bios[m.from];if(b&&b.t)bub.append(el('div',{class:'bio',style:b.c?`color:${b.c}`:''},b.t))}
    if(m.type==='text')bub.append(el('div',{class:'tx'},m.text));
    else if(m.type==='image')bub.append(el('img',{class:'im',src:m.img,onclick:()=>zoom(m.img)}));
    else if(m.type==='audio')bub.append(el('audio',{controls:true,preload:'none',src:m.au,style:'width:210px;height:40px'}));
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
    const btnI=el('button',{class:'ib',onclick:async()=>{const f=await pickFile();if(!f)return;try{const d=await fit(f,[900,720,560,420,320],55000,false);await ex.sendRaw(gid,gm,{type:'image',img:d},1)}catch(e){err(e)}}},'📷');
    let rec=null,chunks=[],tmr=0,t0=0;
    const btnM=me.gender==='m'?el('button',{class:'ib',onclick:async()=>{
      if(rec){rec.stop();return}
      try{const st=await navigator.mediaDevices.getUserMedia({audio:true});
        const mime=window.MediaRecorder&&MediaRecorder.isTypeSupported('audio/webm;codecs=opus')?'audio/webm;codecs=opus':'';
        rec=new MediaRecorder(st,{...(mime?{mimeType:mime}:{}),audioBitsPerSecond:16000});chunks=[];
        rec.ondataavailable=e=>chunks.push(e.data);
        rec.onstop=async()=>{clearTimeout(tmr);st.getTracks().forEach(t=>t.stop());btnM.textContent='🎙';
          const blob=new Blob(chunks,{type:rec.mimeType||'audio/webm'}),dur=Math.max(1,Math.round((Date.now()-t0)/1000));rec=null;
          const d=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(blob)});
          if(d.length>140000)return toast('التسجيل طويل جداً');
          try{await ex.sendRaw(gid,gm,{type:'audio',au:d,dur},0)}catch(e){err(e)}};
        t0=Date.now();rec.start();btnM.textContent='⏹';tmr=setTimeout(()=>rec&&rec.stop(),20000);
      }catch(e){toast('تعذر تشغيل المايك، فعّل إذن الميكروفون')}}},'🎙'):null;
    comp.replaceChildren(stk,el('div',{class:'cmp'},btnS,btnI,btnM,ta,el('button',{class:'send',onclick:sendTxt},'➤')));
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
    if(staff){const sw=el('input',{type:'checkbox',style:'width:auto',onchange:async e=>{try{await set(R(`groups/${gid}/locked`),e.target.checked);gm.locked=e.target.checked}catch(x){err(x);e.target.checked=!e.target.checked}}});sw.checked=!!gm.locked;sec.append(el('div',{class:'sw'},el('span',{},'قفل الشات'),sw));if(gm.kind==='main'){const g2=el('input',{type:'checkbox',style:'width:auto',onchange:async e=>{try{await set(R(`groups/${gid}/gamesAll`),e.target.checked);gm.gamesAll=e.target.checked}catch(x){err(x);e.target.checked=!e.target.checked}}});g2.checked=!!gm.gamesAll;sec.append(el('div',{class:'sw',style:'margin-top:8px'},el('span',{},'الألعاب للجميع'),g2))}}
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
    roleOf(u).then(r=>{const t=rankTag(r,!!admins[u]);if(t)nm.after(t)});prof(u).then(p=>nm.after(ageTag(p)));
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
  const gpS=await get(R(`gamePerm/${gid}/${u}`)).catch(()=>null),hasGp=!!(gpS&&gpS.exists());
  const ban=h=>act(()=>set(R(`bans/${gid}/${u}`),Date.now()+h*3600e3));
  openSheet(el('h3',{},p.name||'عضو'),
    el('button',{class:'btn g',onclick:()=>bioSheet(gid,u,bio,again)},'📝 نبذة ولون النص'),
    el('button',{class:'btn g',onclick:ban(1)},'🔇 كتم ساعة'),el('button',{class:'btn g',onclick:ban(24)},'🔇 كتم يوم'),el('button',{class:'btn g',onclick:ban(168)},'🔇 كتم أسبوع'),
    el('button',{class:'btn g',onclick:act(()=>remove(R(`bans/${gid}/${u}`)))},'🔊 إلغاء الكتم'),
    gm.kind==='main'?el('button',{class:'btn g',onclick:act(async()=>{const c=String(Math.floor(Math.random()*1e8)).padStart(8,'0');await update(ref(db),{[`refCodes/${c}`]:{u,g:gid},[`pubPerm/${gid}/${u}`]:c})})},'🔗 منح صلاحية النشر (رمز إحالة)'):null,
    gm.kind==='main'?el('button',{class:'btn g',onclick:act(async()=>{const s=await get(R(`pubPerm/${gid}/${u}`));if(s.val())await update(ref(db),{[`refCodes/${s.val()}`]:null,[`pubPerm/${gid}/${u}`]:null})})},'⛔ سحب صلاحية النشر'):null,
    isDev()?el('button',{class:'btn g',onclick:act(()=>admins[u]?remove(R(`groupAdmins/${gid}/${u}`)):set(R(`groupAdmins/${gid}/${u}`),true))},admins[u]?'⬇️ إزالة الإشراف':'⬆️ تعيين مشرف'):null,
    gm.kind==='main'?el('button',{class:'btn g',onclick:act(()=>hasGp?remove(R(`gamePerm/${gid}/${u}`)):set(R(`gamePerm/${gid}/${u}`),true))},hasGp?'🎮 سحب صلاحية الألعاب':'🎮 منح صلاحية الألعاب'):null,
    el('button',{class:'btn r',onclick:act(()=>remove(R(`members/${gid}/${u}`)))},'🚪 طرد من القروب'),
    isDev()&&!high?el('button',{class:'btn r',onclick:act(()=>set(R('banned/'+u),true))},'⛔ حظر من التطبيق'):null,
    isDev()?el('button',{class:'btn g',onclick:act(()=>remove(R('banned/'+u)))},'✅ رفع الحظر من التطبيق'):null);
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
      const r=roles[u],btn=u===uid?null:el('button',{class:'btn '+(r==='dev'?'r':'g'),style:'padding:8px 12px;font-size:13px',onclick:async e=>{e.stopPropagation();try{if(r==='dev'){await update(ref(db),{['roles/'+u]:null,['devs/'+u]:null});roles[u]=null}else{await update(ref(db),{['roles/'+u]:'dev',['devs/'+u]:true});roles[u]='dev'}RL.set(u,Promise.resolve(roles[u]));draw()}catch(x){err(x)}}},r==='dev'?'إزالة الرتبة':'تعيين مطور');
      return el('div',{class:'row'},avatar(u),el('div',{class:'t'},el('b',{},v.name||'عضو'),el('small',{},(v.gender==='f'?'أنثى':'ذكر')+(r==='dev'?' • رتبة عليا':u===EMP?' • الإمبراطور':''))),btn)}))};
  s.oninput=draw;draw();
}

/* ====================== ALJESI: الأوامر والمتجر والحرب والحسبة ====================== */

function initExtra(C){
const{db,el,toast,err,openSheet,closeSheet,go,avatar,prof,roleOf,copy,botAv}=C;
const R=p=>ref(db,p),U=()=>C.uid(),ME=()=>C.me();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const hex=c=>/^#[0-9a-f]{6}$/i.test(c||'');
const dk=(c,k=.45)=>'#'+[1,3,5].map(i=>Math.round(parseInt(c.slice(i,i+2),16)*k).toString(16).padStart(2,'0')).join('');
const PAL=['#2a6cff','#e53935','#8e24aa','#00897b','#f9a825','#d81b60','#43a047','#ff7a1a'];
const colorFor=g=>{const gm=C.groups()[g]||{};if(hex(gm.c))return gm.c;let h=0;for(const ch of g)h=(h*31+ch.charCodeAt(0))>>>0;return PAL[h%PAL.length]};
const mains=()=>Object.keys(C.groups()).filter(g=>C.groups()[g].kind==='main');
const myMains=()=>mains().filter(g=>C.mem()[g]===true);
const feed=k=>Object.keys(C.groups()).find(g=>C.groups()[g].kind===k&&C.mem()[g]);
const gname=g=>(C.groups()[g]||{}).name||'نقابة';

/* ---------- الفلتر العربي للألقاب ---------- */
const NAME_RE=/^[ء-ؿف-ي ]{2,20}$/;
const BAD=['كلب','حمار','خرا','عاهر','شرموط','قحب','منيك','زب','كس','طيز','لعن','حقير','قذر','وسخ'];
function nameErr(v){v=v.trim().replace(/\s+/g,' ');if(v.length<2)return'اللقب قصير جداً';if(!NAME_RE.test(v))return'اللقب بالعربية فقط، بدون أرقام أو زخرفة أو تشكيل';const ws=v.split(' '),flat=ws.join('');for(const b of BAD){if(b.length<=3?ws.includes(b):flat.includes(b))return'هذا اللقب غير لائق'}return''}

/* ---------- الرصيد ---------- */
async function balance(){return(await get(R('wallets/'+U()+'/bal'))).val()||0}
async function addBal(delta,gain){
  const cur=await balance(),nb=cur+delta;if(nb<0)throw new Error('low');
  const up={['wallets/'+U()+'/bal']:nb};if(gain)up['wallets/'+U()+'/ts']=serverTimestamp();
  await update(ref(db),up);return nb;
}
async function addBalRetry(d){try{return await addBal(d,true)}catch(e){await sleep(4500);return await addBal(d,true)}}
const fmt=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,',');

/* ---------- رسائل ALJESI والإشعارات ---------- */
async function bot(gid,text){try{await set(push(R('messages/'+gid)),{from:U(),type:'sys',k:'bot',f:ME().name,text,ts:serverTimestamp()})}catch(e){}}
async function notify(kind,text,k='note',d){const g=feed(kind);if(!g)return;try{const m={from:U(),type:'sys',k,text,ts:serverTimestamp()};if(d)m.d=d;await set(push(R('messages/'+g)),m)}catch(e){}}

/* ---------- إرسال رسالة + عدّاد التفاعل + الأوامر ---------- */
let boostV=null;
async function boost(){if(boostV===null)boostV=(await get(R('boost/'+U()))).exists();return boostV}
async function send(gid,gm,t){
  const k=push(R('messages/'+gid)).key,bs=gm.kind==='main'?await boost():false;
  const m={from:U(),type:'text',text:t,ts:serverTimestamp(),color:ME().color||'#ff7a1a'};
  if(C.mem()[gid]==='v')m.vis=true;
  const up={[`messages/${gid}/${k}`]:m};
  if(gm.kind==='main')up[`stats/${gid}/${U()}`]=increment(bs?2:1);
  await update(ref(db),up);
  if(/^\.[ء-يa-zA-Z]/.test(t))command(gid,gm,t);
}
async function sendRaw(gid,gm,payload,count){
  const k=push(R('messages/'+gid)).key,m={from:U(),ts:serverTimestamp(),color:ME().color||'#ff7a1a',...payload};
  if(C.mem()[gid]==='v')m.vis=true;
  const up={[`messages/${gid}/${k}`]:m};
  if(gm.kind==='main'&&count)up[`stats/${gid}/${U()}`]=increment(1);
  await update(ref(db),up);
}
const CMD={};
async function command(gid,gm,text){
  const[c,...args]=text.slice(1).trim().split(/\s+/),f=CMD[c];
  if(!f)return bot(gid,'❌ الأمر غير موجود. اكتب ‎.اوامر‎ لعرض القائمة');
  if(GAME.has(c)&&!(await canPlay(gid)))return bot(gid,'🎮 ليس لديك صلاحية الألعاب. اطلب من مشرف منحك إياها.');
  try{await f(gid,gm,args)}catch(e){err(e)}
}
const GAME=new Set(['العاب','كريستال','بالونات','اعلام','كتابة','الوان']);
async function canPlay(gid){const gm=C.groups()[gid]||{};if(C.isDev()||gm.gamesAll)return true;
  const[p,a]=await Promise.all([get(R(`gamePerm/${gid}/${U()}`)).catch(()=>null),get(R(`groupAdmins/${gid}/${U()}`)).catch(()=>null)]);return!!((p&&p.exists())||(a&&a.exists()))}
const home=gid=>myMains()[0]||gid;
CMD['اوامر']=(gid)=>bot(gid,'╮─❖『 أوامر ALJESI 』❖─╭\n.تفاصيلي — بطاقتك\n.رصيدي — رصيدك\n.العاب — قائمة الألعاب\n.كريستال [مبلغ] — لعبة الكريستال\n.بالونات — لعبة البالونات\n.اعلام — تخمين الأعلام\n.كتابة — سرعة الكتابة\n.الوان — لعبة الألوان\n.تحويل — تحويل رصيد لعضو\n.المتصدرين — متصدرو اليوم\n.المتجر — فتح المتجر\n╰─❖『 ALJESI 』❖─╯');
CMD['رصيدي']=async gid=>bot(gid,'💰 رصيدك الحالي: '+fmt(await balance()));
CMD['تفاصيلي']=async(gid,gm)=>{
  const u=U(),mg=gm.kind==='main'?gid:home(gid);
  const[b,st,inv,bo,pp,vs]=await Promise.all([balance(),get(R(`stats/${mg}/${u}`)).catch(()=>null),get(R('inv/'+u+'/upg')),boost(),get(R(`pubPerm/${mg}/${u}`)).catch(()=>null),get(R('visit/'+u))]);
  const r=await roleOf(u),adm=(await get(R('groupAdmins/'+mg)).catch(()=>null));
  const rank=r==='emp'?'الإمبراطور 👑':r==='dev'?'رتبة عليا':(adm&&adm.val()&&adm.val()[u])?'مشرف':'عضو';
  bot(gid,['╮─❖『 تفاصيلي 』❖─╭','👤 اللقب: '+ME().name,'🎖 الرتبة: '+rank,'🏰 النقابة: '+gname(mg),'💰 الرصيد: '+fmt(b),'💬 رسائل اليوم: '+((st&&st.val())||0),
    '🎫 بطاقات الترقية: '+(inv.val()||0),'✖️2 المضاعفة: '+(bo?'مفعّلة ✅':'غير مفعّلة'),pp&&pp.val()?'🔗 رمز النشر: '+pp.val():null,vs.val()?'✈️ زائر في: '+gname(vs.val().g):null,'╰─❖『 ALJESI 』❖─╯'].filter(Boolean).join('\n'));
};
CMD['المتصدرين']=async(gid,gm)=>{
  const mg=gm.kind==='main'?gid:home(gid),s=(await get(R('stats/'+mg)).catch(()=>null));
  const ents=Object.entries((s&&s.val())||{}).sort((a,b)=>b[1]-a[1]).slice(0,10);
  if(!ents.length)return bot(gid,'لا يوجد تفاعل اليوم بعد');
  const names=await Promise.all(ents.map(([u])=>prof(u)));
  bot(gid,'🏆 متصدرو '+gname(mg)+' اليوم:\n'+ents.map(([u,c],i)=>(['🥇','🥈','🥉'][i]||(i+1)+'.')+' '+names[i].name+' — '+c).join('\n'));
};
CMD['العاب']=async gid=>{bot(gid,'🎮 الألعاب المتاحة:\n💎 ‎.كريستال [مبلغ]‎\n🎈 ‎.بالونات‎\n🏳️ ‎.اعلام‎\n⌨️ ‎.كتابة‎\n🎨 ‎.الوان‎');gamesSheet(gid)};
CMD['اعلام']=(gid)=>flagsGame(gid);
CMD['كتابة']=(gid)=>typingGame(gid);
CMD['الوان']=(gid)=>colorsGame(gid);
CMD['كريستال']=(gid,gm,a)=>crystalUI(gid,gm,Number(a[0])||50);
CMD['بالونات']=(gid,gm)=>balloonUI(gid,gm);
CMD['تحويل']=(gid,gm)=>transferUI(gid,gm);
CMD['المتجر']=()=>go('shop');
async function gamesSheet(gid){const gm=C.groups()[gid];if(!(await canPlay(gid)))return toast('ليس لديك صلاحية الألعاب');
  const B=(t,f)=>el('button',{class:'btn',onclick:()=>{closeSheet();f()}},t);
  openSheet(el('h3',{},'🎮 اختر لعبة'),B('💎 كريستال',()=>crystalUI(gid,gm,50)),B('🎈 البالونات',()=>balloonUI(gid,gm)),B('🏳️ تخمين الأعلام',()=>flagsGame(gid)),B('⌨️ سرعة الكتابة',()=>typingGame(gid)),B('🎨 لعبة الألوان',()=>colorsGame(gid)),el('button',{class:'btn g',onclick:closeSheet},'إغلاق'))}
/* ---------- ألعاب سريعة (مكافآت صغيرة + انتظار 90 ثانية) ---------- */
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function cooldown(key){const left=90000-(Date.now()-Number(localStorage.getItem('cd_'+key)||0));if(left>0){toast('انتظر '+Math.ceil(left/1000)+' ثانية قبل إعادة اللعب');return false}return true}
async function endQuiz(key,gid,title,pay,o,info){localStorage.setItem('cd_'+key,String(Date.now()));let m=pay>0?`🎉 ربح ${pay} رصيد`:'💥 لم يربح';
  if(pay>0){try{await addBalRetry(pay)}catch(e){m='تعذر إضافة الربح'}}info.textContent=m;bot(gid,`${title} — ${ME().name}\n${m}`);}
const FLAGS=[['🇸🇦','السعودية'],['🇪🇬','مصر'],['🇯🇵','اليابان'],['🇫🇷','فرنسا'],['🇩🇪','ألمانيا'],['🇧🇷','البرازيل'],['🇹🇷','تركيا'],['🇲🇦','المغرب'],['🇮🇹','إيطاليا'],['🇪🇸','إسبانيا'],['🇺🇸','أمريكا'],['🇰🇷','كوريا الجنوبية'],['🇮🇳','الهند'],['🇦🇷','الأرجنتين'],['🇨🇦','كندا'],['🇷🇺','روسيا'],['🇦🇪','الإمارات'],['🇯🇴','الأردن'],['🇱🇧','لبنان'],['🇸🇾','سوريا'],['🇮🇶','العراق'],['🇩🇿','الجزائر'],['🇹🇳','تونس'],['🇶🇦','قطر'],['🇰🇼','الكويت']];
function flagsGame(gid){
  if(!cooldown('flags'))return;const o=overlay('🏳️ تخمين الأعلام'),qs=shuffle(FLAGS).slice(0,5),info=el('div',{class:'ovi'}),box=el('div',{style:'display:flex;flex-direction:column;gap:10px'});let i=0,ok=0;o.body.append(info,box);
  const next=()=>{if(i>=5){box.replaceChildren();return endQuiz('flags',gid,'🏳️ تخمين الأعلام',ok*15,o,info)}
    const[f,n]=qs[i],opts=shuffle([n,...shuffle(FLAGS.filter(x=>x[1]!==n)).slice(0,3).map(x=>x[1])]);info.textContent=`السؤال ${i+1}/5`;
    box.replaceChildren(el('div',{style:'font-size:90px;text-align:center'},f),...opts.map(t=>el('button',{class:'btn g',onclick:e=>{if(box.dataset.l)return;box.dataset.l=1;if(t===n){ok++;e.target.style.background='#2e7d32'}else e.target.style.background='#c62828';i++;setTimeout(()=>{delete box.dataset.l;next()},650)}},t)))};
  next();
}
const PH=['ناروتو يحلم أن يصبح هوكاجي','لوفي يريد أن يصبح ملك القراصنة','غوكو يتدرب ليصبح أقوى','كاكاشي ينسخ الجتسو بعينه','إيرين يحارب من أجل الحرية','ليفاي أقوى جندي في الإنسانية'];
function typingGame(gid){
  if(!cooldown('typing'))return;const o=overlay('⌨️ سرعة الكتابة'),ph=rnd(PH),info=el('div',{class:'ovi'},'اكتب الجملة بأسرع ما يمكن'),inp=el('input',{placeholder:'اكتب هنا',autocomplete:'off'});let t0=0,done=false;
  const btn=el('button',{class:'btn',onclick:()=>{t0=Date.now();view.textContent=ph;btn.disabled=true;inp.focus()}},'ابدأ'),view=el('div',{style:'font-size:20px;text-align:center;padding:14px;border:1px dashed var(--line);border-radius:12px;min-height:60px'},'اضغط ابدأ');
  inp.oninput=()=>{if(!t0||done)return;if(inp.value.trim().replace(/\s+/g,' ')===ph){done=true;const s=(Date.now()-t0)/1000;info.textContent=`⏱ ${s.toFixed(1)} ثانية`;endQuiz('typing',gid,'⌨️ سرعة الكتابة',s<=8?40:s<=15?20:0,o,info)}};
  o.body.append(info,view,btn,inp);
  setTimeout(()=>{if(t0&&!done){done=true;endQuiz('typing',gid,'⌨️ سرعة الكتابة',0,o,info)}},40000);
}
const CN=[['أحمر','#ff4d4d'],['أزرق','#4d8dff'],['أخضر','#4dff88'],['أصفر','#ffe04d'],['بنفسجي','#b34dff']];
function colorsGame(gid){
  if(!cooldown('colors'))return;const o=overlay('🎨 لعبة الألوان'),info=el('div',{class:'ovi'},'اختر لون الحبر وليس معنى الكلمة'),box=el('div',{style:'display:flex;flex-direction:column;gap:10px'});let i=0,ok=0;o.body.append(info,box);
  const next=()=>{if(i>=6){box.replaceChildren();return endQuiz('colors',gid,'🎨 لعبة الألوان',ok*10,o,info)}
    const w=rnd(CN),c=rnd(CN.filter(x=>x[0]!==w[0]));info.textContent=`الجولة ${i+1}/6`;
    box.replaceChildren(el('div',{style:`font-size:54px;font-weight:800;text-align:center;color:${c[1]}`},w[0]),...shuffle(CN).map(x=>el('button',{class:'btn g',onclick:e=>{if(box.dataset.l)return;box.dataset.l=1;if(x[0]===c[0]){ok++;e.target.style.background='#2e7d32'}else e.target.style.background='#c62828';i++;setTimeout(()=>{delete box.dataset.l;next()},550)}},x[0])))};
  next();
}

/* ---------- واجهات الألعاب ---------- */
function overlay(title){
  const ov=el('div',{class:'ov'}),body=el('div',{class:'ovb'}),close=()=>ov.remove();
  ov.append(el('button',{class:'ib ovx',onclick:close},'✕'),el('h2',{},title),body);document.body.append(ov);return{body,close};
}
async function showBal(e){e.textContent='💰 '+fmt(await balance())}
const EM=['💎','⭐','🍒','💣','🔥','🍀','👑','💰'];
const PATTERNS=[
 {p:['💎','💎','💎','💎'],m:5,r:'win',w:2},{p:['⭐','⭐','⭐','⭐'],m:4,r:'win',w:3},{p:['👑','👑','👑','👑'],m:3,r:'win',w:5},
 {p:['💎','💎','💎','⭐'],m:2,r:'win',w:8},{p:['⭐','⭐','🍒','🍒'],m:1.5,r:'win',w:10},{p:['🍀','🍀','💰','💰'],m:1.3,r:'win',w:10},
 {p:['💎','⭐','💎','⭐'],m:1,r:'retry',w:12},{p:['🔥','🔥','💣','💎'],m:0,r:'lose',w:25},{p:['💣','💣','🍒','⭐'],m:0,r:'lose',w:25}];
function pickPattern(){let t=PATTERNS.reduce((s,x)=>s+x.w,0),r=Math.random()*t;for(const x of PATTERNS){if((r-=x.w)<0)return x}return PATTERNS[PATTERNS.length-1]}
function crystalUI(gid,gm,preset){
  const o=overlay('💎 كريستال');let busy=false;
  const slots=[0,1,2,3].map(()=>el('div',{class:'slot'},'❔')),bet=el('input',{type:'number',inputmode:'numeric',value:String(Math.min(200,Math.max(10,preset||50)))});
  const balEl=el('div',{class:'bal'},'…'),info=el('div',{class:'ovi'},'الرهان من 10 إلى 200 • ربح حتى ×5'),btn=el('button',{class:'btn',onclick:play},'ابدأ اللف 🎰');
  o.body.append(balEl,el('div',{class:'slots'},slots),bet,btn,info);showBal(balEl);
  async function play(){
    if(busy)return;const b=Math.floor(Number(bet.value));if(!(b>=10&&b<=200))return toast('الرهان من 10 إلى 200');
    busy=true;btn.disabled=true;
    try{await addBal(-b,false)}catch(e){toast('رصيدك لا يكفي');busy=false;btn.disabled=false;return}
    showBal(balEl);const res=pickPattern();slots.forEach(s=>{delete s.dataset.done;s.classList.remove('stop')});
    const iv=setInterval(()=>slots.forEach(s=>{if(!s.dataset.done)s.textContent=rnd(EM)}),70);
    slots.forEach((s,i)=>setTimeout(()=>{s.dataset.done=1;s.textContent=res.p[i];s.classList.add('stop')},2000+i*900));
    await sleep(5300);clearInterval(iv);
    const pay=res.r==='win'?Math.round(b*res.m):res.r==='retry'?b:0;let ok=true;
    if(pay>0){try{await addBalRetry(pay)}catch(e){ok=false;toast('تعذر إضافة الربح، تواصل مع مطور')}}
    showBal(balEl);
    const net=pay-b,line=res.p.join(' ');
    info.textContent=res.r==='win'?`🎉 ربحت ${fmt(net)} (×${res.m})`:res.r==='retry'?'↩️ استرجعت رهانك':`💥 خسرت ${fmt(b)}`;
    bot(gid,`💎 كريستال — ${ME().name}\n[ ${line} ]\n`+(res.r==='win'?`🎉 ربح ${fmt(net)} رصيد (×${res.m})`:res.r==='retry'?'↩️ استرجع رهانه':`💥 خسر ${fmt(b)} رصيد`));
    if(net>=300)notify('ads',`🎉 ${ME().name} ربح ${fmt(net)} رصيد في الكريستال!`,'win');
    else if(net<=-150)notify('ads',`💥 ${ME().name} خسر ${fmt(-net)} رصيد في الكريستال`,'lose');
    busy=false;btn.disabled=false;
  }
}
function balloonUI(gid,gm){
  const o=overlay('🎈 البالونات');let state='idle',bet=0,picks=[],vals=[],paid=false;
  const betIn=el('input',{type:'number',inputmode:'numeric',value:'60'}),balEl=el('div',{class:'bal'},'…'),info=el('div',{class:'ovi'},'اختر 3 بالونات. احذر الدبوس 📌'),field=el('div',{class:'balloons'}),btn=el('button',{class:'btn',onclick:start},'ابدأ اللعب 🎈');
  o.body.append(balEl,betIn,btn,info,field);showBal(balEl);
  const OUT=[{e:'📌',m:0,w:35},{e:'🥈',m:.5,w:30},{e:'🥇',m:1.5,w:25},{e:'🌈',m:3,w:10}];
  const draw=()=>{let r=Math.random()*100;for(const x of OUT){if((r-=x.w)<0)return x}return OUT[0]};
  const cols=['#ff5a4d','#ffb04a','#6ee787','#7fb2ff','#c792ff','#ff7eb6'];
  async function start(){
    if(state==='play')return;const b=Math.floor(Number(betIn.value));if(!(b>=30&&b<=200))return toast('الرهان من 30 إلى 200');
    try{await addBal(-b,false)}catch(e){return toast('رصيدك لا يكفي')}
    bet=b;state='play';picks=[];paid=false;btn.disabled=true;showBal(balEl);vals=Array.from({length:12},draw);field.replaceChildren();
    vals.forEach((v,i)=>field.append(el('div',{class:'bl',style:`background:${cols[i%6]};animation-delay:${(i%5)*.25}s`,onclick:e=>pop(i,e.currentTarget)},'🎈')));
    info.textContent='اختر 3 بالونات (0/3)';
  }
  async function pop(i,node){
    if(state!=='play'||node.dataset.p)return;node.dataset.p=1;picks.push(i);const v=vals[i];
    node.classList.add('pop');node.textContent=v.e;node.style.background='rgba(255,255,255,.12)';
    info.textContent=`اخترت ${picks.length}/3`;
    if(picks.length>=3)await finish();
  }
  async function finish(){
    if(paid)return;paid=true;state='done';
    const shot=bet/3,pay=Math.round(picks.reduce((s,i)=>s+shot*vals[i].m,0)),net=pay-bet;let ok=true;
    if(pay>0){try{await addBalRetry(pay)}catch(e){ok=false;toast('تعذر إضافة الربح')}}
    showBal(balEl);btn.disabled=false;
    info.textContent=net>0?`🎉 ربحت ${fmt(net)}`:net===0?'↩️ تعادل':`💥 خسرت ${fmt(-net)}`;
    bot(gid,`🎈 البالونات — ${ME().name}\n[ ${picks.map(i=>vals[i].e).join(' ')} ]\n`+(net>0?`🎉 ربح ${fmt(net)} رصيد`:net===0?'↩️ تعادل':`💥 خسر ${fmt(-net)} رصيد`));
    if(net>=200)notify('ads',`🎈 ${ME().name} ربح ${fmt(net)} رصيد في البالونات!`,'win');
  }
}

/* ---------- التحويل ---------- */
async function transferUI(gid,gm){
  const mg=gm.kind==='main'?gid:home(gid);if(C.mem()[mg]!==true)return toast('التحويل داخل النقابة فقط');
  const s=el('input',{placeholder:'ابحث بالاسم'}),amt=el('input',{type:'number',inputmode:'numeric',placeholder:'المبلغ (10 فما فوق)'}),list=el('div');
  openSheet(el('h3',{},'💸 تحويل رصيد'),amt,s,list);
  let ms={};try{ms=(await get(R('members/'+mg))).val()||{}}catch(e){return err(e)}
  const ids=Object.keys(ms).filter(u=>u!==U()&&ms[u]===true),ps=await Promise.all(ids.map(prof));
  const draw=()=>{const q=s.value.trim();list.replaceChildren(...ids.map((u,i)=>[u,ps[i]]).filter(([u,p])=>!q||(p.name||'').includes(q)).slice(0,30).map(([u,p])=>
    el('div',{class:'row',onclick:async()=>{const n=Math.floor(Number(amt.value));if(!(n>=10))return toast('اكتب المبلغ أولاً');
      try{if(await balance()<n)return toast('رصيدك لا يكفي');await update(ref(db),{['wallets/'+U()+'/bal']:increment(-n),['wallets/'+u+'/bal']:increment(n)});
        closeSheet();toast('تم التحويل ✅');bot(gid,`💸 ${ME().name} حوّل ${fmt(n)} رصيد إلى ${p.name}`);notify('ads',`💸 ${ME().name} حوّل ${fmt(n)} رصيد إلى ${p.name}`,'tr')}catch(e){err(e)}}},
      el('div',{class:'av s'},(p.name||'?')[0]),el('div',{class:'t'},el('b',{},p.name)))))};
  s.oninput=draw;draw();
}

/* ---------- المتجر ---------- */
const ITEMS=[
 {id:'upg',e:'🎫',n:'بطاقة ترقية',p:500,d:'تُستخدم من وصف نقابتك لرفع الهجوم أو الدفاع +1'},
 {id:'x2',e:'✖️2',n:'مضاعفة الرسائل',p:1500,d:'كل رسالة تُحسب رسالتين حتى نزول الحسبة'},
 {id:'nick',e:'🏷',n:'تغيير اللقب',p:1000,d:'غيّر لقبك (عربي فقط)'},
 {id:'sab',e:'💥',n:'تخريب لقب',p:1000,d:'غيّر لقب عضو من نقابتك (عدا المشرفين)'},
 {id:'visit',e:'✈️',n:'زيارة',p:10000,d:'زر نقابة أخرى لمدة 3 أيام'},
 {id:'war',e:'⚔️',n:'إعلان حرب',p:20000,d:'للمشرفين فقط',staff:true}];
const isStaffAny=async()=>{if(C.isDev())return true;for(const g of myMains()){const a=(await get(R('groupAdmins/'+g)).catch(()=>null));if(a&&a.val()&&a.val()[U()])return true}return false};
async function shop(){
  const list=el('div',{class:'list'}),bal=el('div',{class:'bal'},'…');
  C.app.replaceChildren(el('div',{class:'hdr'},el('button',{class:'ib',onclick:C.back},'→'),el('h1',{},'🛒 المتجر'),bal),list);showBal(bal);
  const staff=await isStaffAny();
  for(const it of ITEMS){if(it.staff&&!staff)continue;
    list.append(el('div',{class:'row'},el('div',{class:'av'},it.e),el('div',{class:'t'},el('b',{},it.n),el('small',{},it.d)),
      el('button',{class:'btn',style:'padding:9px 12px;font-size:13px',onclick:()=>buy(it,()=>showBal(bal))},fmt(it.p))))}
}
async function buy(it,done){
  try{
    if(await balance()<it.p)return toast('رصيدك لا يكفي');
    const u=U(),W='wallets/'+u+'/bal';
    if(it.id==='upg'){await update(ref(db),{['inv/'+u+'/upg']:increment(1),[W]:increment(-it.p)});toast('تم شراء بطاقة ترقية ✅')}
    else if(it.id==='x2'){if(await boost())return toast('المضاعفة مفعّلة بالفعل');await update(ref(db),{['boost/'+u]:true,[W]:increment(-it.p)});boostV=true;toast('تم تفعيل مضاعفة الرسائل، اذهب وتفاعل ✅')}
    else if(it.id==='nick')return nickSheet(null,it,done);
    else if(it.id==='sab')return sabSheet(it,done);
    else if(it.id==='visit')return visitSheet(it,done);
    else if(it.id==='war')return warSheet(it,done);
    notify('shop',`🛒 ${ME().name} اشترى «${it.n}»`,'buy');done&&done();
  }catch(e){err(e)}
}
function nameSheet(title,cb){
  const t=el('input',{placeholder:'اللقب الجديد (عربي فقط)',maxlength:'20'}),e=el('div',{class:'err'});
  openSheet(el('h3',{},title),t,e,el('button',{class:'btn',onclick:()=>{const m=nameErr(t.value);if(m){e.textContent=m;return}cb(t.value.trim().replace(/\s+/g,' '))}},'تأكيد'),el('button',{class:'btn g',onclick:closeSheet},'إلغاء'));
}
function nickSheet(_,it,done){nameSheet('🏷 تغيير لقبك',async n=>{closeSheet();try{await update(ref(db),{['profiles/'+U()+'/name']:n,['wallets/'+U()+'/bal']:increment(-it.p)});ME().name=n;C.dropProf(U());toast('تم تغيير لقبك ✅');notify('shop',`🏷 ${ME().name} غيّر لقبه`,'buy');done&&done()}catch(e){err(e)}})}
async function sabSheet(it,done){
  const mg=myMains()[0];if(!mg)return toast('تحتاج نقابة أولاً');
  const list=el('div');openSheet(el('h3',{},'💥 اختر العضو'),list);
  let ms={},ad={};try{ms=(await get(R('members/'+mg))).val()||{};ad=(await get(R('groupAdmins/'+mg))).val()||{}}catch(e){return err(e)}
  for(const u of Object.keys(ms)){if(u===U()||ms[u]!==true||ad[u])continue;const r=await roleOf(u);if(r)continue;const p=await prof(u);
    list.append(el('div',{class:'row',onclick:()=>nameSheet('اللقب الجديد لـ '+p.name,async n=>{closeSheet();try{await update(ref(db),{['profiles/'+u+'/name']:n,['wallets/'+U()+'/bal']:increment(-it.p)});C.dropProf(u);toast('تم ✅');notify('shop',`💥 ${ME().name} خرّب لقب ${p.name}`,'buy');done&&done()}catch(e){err(e)}})},el('div',{class:'av s'},(p.name||'?')[0]),el('div',{class:'t'},el('b',{},p.name))))}
}
function visitSheet(it,done){
  const home0=myMains()[0];if(!home0)return toast('تحتاج نقابة أولاً');
  const others=mains().filter(g=>C.mem()[g]!==true&&C.mem()[g]!=='v');
  if(!others.length)return toast('لا توجد نقابات أخرى');
  openSheet(el('h3',{},'✈️ اختر النقابة'),...others.map(g=>el('button',{class:'btn g',onclick:async()=>{closeSheet();
    try{await update(ref(db),{[`members/${g}/${U()}`]:'v',['visit/'+U()]:{g,home:home0,until:Date.now()+3*864e5},['wallets/'+U()+'/bal']:increment(-it.p)});
      C.mem()[g]='v';await set(push(R('messages/'+g)),{from:U(),type:'sys',k:'visit',text:`✈️ لقد انضم ${ME().name} من نقابة ${gname(home0)} — زائر`,ts:serverTimestamp()});
      notify('news',`✈️ ${ME().name} يزور نقابة ${gname(g)}`,'buy');toast('تمت الزيارة لمدة 3 أيام ✅');done&&done();go('g/'+g)}catch(e){err(e)}}},gname(g))));
}
async function warSheet(it,done){
  const att=[];for(const g of mains()){if(C.isDev()||(C.mem()[g]===true&&(await get(R('groupAdmins/'+g)).then(s=>!!(s.val()||{})[U()]).catch(()=>false))))att.push(g)}
  if(!att.length)return toast('للمشرفين فقط');
  const pickT=a=>openSheet(el('h3',{},'⚔️ اختر النقابة المستهدفة'),...mains().filter(g=>g!==a).map(g=>el('button',{class:'btn g',onclick:async()=>{closeSheet();
    try{const wid=push(R('wars')).key,st=Date.now()+3600e3+30e3;
      await update(ref(db),{['wars/'+wid]:{a,d:g,by:U(),t0:Date.now(),st,en:st+300e3,s:'p'},['activeWar/'+a]:wid,['activeWar/'+g]:wid,['wallets/'+U()+'/bal']:increment(-it.p)});
      notify('news',`⚔️ إعلان حرب: نقابة ${gname(a)} تعلن الحرب على ${gname(g)}`,'war',JSON.stringify({t:'decl',a:gname(a),d:gname(g),by:ME().name,st}));toast('تم إعلان الحرب، تبدأ بعد ساعة ⚔️');done&&done()}catch(e){err(e)}}},gname(g))));
  if(att.length===1)pickT(att[0]);else openSheet(el('h3',{},'من أي نقابة؟'),...att.map(g=>el('button',{class:'btn g',onclick:()=>{closeSheet();pickT(g)}},gname(g))));
}

/* ---------- لوحة النقابة: المستويات والحرب ---------- */
async function guildPanel(gid,gm,body){
  if(gm.kind!=='main'||C.mem()[gid]!==true)return;
  const sec=el('div',{class:'sec'},el('h4',{},'⚔️ المستويات والحرب'));body.append(sec);
  let gs=null;try{gs=(await get(R('guildStats/'+gid))).val()}catch(e){}
  if(!gs){sec.append(el('p',{},'لم تُفعَّل المستويات لهذه النقابة بعد.'));if(C.isDev())sec.append(el('button',{class:'btn g',style:'margin-top:8px',onclick:async()=>{await set(R('guildStats/'+gid),{atk:1,def:1});C.reinfo(gid)}},'تفعيل المستويات'));return}
  const cards=(await get(R('inv/'+U()+'/upg'))).val()||0,mine=((gs.contrib||{})[U()])||0;
  sec.append(el('div',{class:'lv'},el('div',{},'⚔️ الهجوم',el('b',{},String(gs.atk))),el('div',{},'🛡 الدفاع',el('b',{},String(gs.def)))),
    el('p',{style:'margin:6px 0;color:var(--mu)'},`🎫 بطاقاتك: ${cards} • مساهماتك: ${mine}`));
  const up=k=>async()=>{if(!cards)return toast('لا تملك بطاقة ترقية، اشتر من المتجر');
    try{await update(ref(db),{[`guildStats/${gid}/${k}`]:increment(1),['inv/'+U()+'/upg']:increment(-1),[`guildStats/${gid}/contrib/${U()}`]:increment(1)});toast('تمت الترقية ✅');notify('shop',`🎫 ${ME().name} رقّى ${k==='atk'?'هجوم':'دفاع'} نقابة ${gname(gid)}`,'buy');C.reinfo(gid)}catch(e){err(e)}};
  sec.append(el('div',{style:'display:flex;gap:8px;margin-top:6px'},el('button',{class:'btn',style:'flex:1',onclick:up('atk')},'⬆️ هجوم'),el('button',{class:'btn',style:'flex:1',onclick:up('def')},'⬆️ دفاع')));
  // حرب جارية أو قائد منتصر
  try{const aw=(await get(R('activeWar/'+gid))).val();if(aw){const w=(await get(R('wars/'+aw))).val();if(w){const at=w.a===gid;sec.append(el('div',{class:'note'},at?`⚔️ تشنون حرباً على «${gname(w.d)}»`:`🚨 تتعرضون لهجوم من «${gname(w.a)}»`,el('br'),el('span',{id:'wcd'},'')));cd(w,document.getElementById('wcd'))}}}catch(e){}
  await leaderPick(sec);
}
function cd(w,node){if(!node)return;const t=setInterval(()=>{if(!node.isConnected){clearInterval(t);return}const n=Date.now();node.textContent=n<w.st?'تبدأ المعركة بعد '+mmss(w.st-n):n<w.en?'⚔️ المعركة قائمة الآن':'بانتظار الحسم…'},1000)}
const mmss=ms=>{const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60);return(h?h+':':'')+String(m).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
/* شريط الحرب المثبّت أعلى الدردشة */
function warBanner(gid,holder,cleanup){
  if(C.groups()[gid].kind!=='main'||C.mem()[gid]!==true)return;
  let w=null,t=0;
  const tick=()=>{if(!w){holder.replaceChildren();return}const n=Date.now(),at=w.a===gid;
    holder.replaceChildren(el('div',{class:'wb'+(at?'':' def')},el('div',{class:'clash s'},el('span',{},'🗡️'),el('span',{},'🗡️')),at?`⚔️ تشنون حرباً على «${gname(w.d)}»`:`🚨 تتعرضون لهجوم من «${gname(w.a)}»`,el('br'),n<w.st?'تبدأ المعركة بعد '+mmss(w.st-n):n<w.en?'المعركة قائمة الآن!':'بانتظار الحسم…'))};
  get(R('activeWar/'+gid)).then(async s=>{if(!s.val())return;w=(await get(R('wars/'+s.val()))).val();tick();t=setInterval(tick,1000)}).catch(()=>{});
  cleanup.push(()=>clearInterval(t));
}
/* القائد المنتصر يختار 5 أعضاء من النقابة المهزومة */
async function leaderPick(sec){
  try{
    const wid=(await get(R('leadWar/'+U()))).val();if(!wid)return;
    const w=(await get(R('wars/'+wid))).val();if(!w||w.res!=='a')return;
    if((await get(R('warMv/'+wid))).exists())return;
    const cand=(await get(R('warCand/'+wid))).val()||{};if(!Object.keys(cand).length)return;
    sec.append(el('div',{class:'note'},'🏆 انتصرت نقابتك! يحق لك نقل 5 أعضاء من النقابة المهزومة إلى نقابتك.',el('button',{class:'btn',style:'margin-top:8px;width:100%',onclick:()=>{
      const chosen=new Set(),list=el('div'),cnt=el('small',{},'0/5');
      const draw=()=>list.replaceChildren(...Object.entries(cand).map(([u,n])=>el('div',{class:'row',style:chosen.has(u)?'background:rgba(255,176,74,.18)':'',onclick:()=>{if(chosen.has(u))chosen.delete(u);else if(chosen.size<5)chosen.add(u);cnt.textContent=chosen.size+'/5';draw()}},el('div',{class:'av s'},n[0]),el('div',{class:'t'},el('b',{},n)))));
      draw();openSheet(el('h3',{},'اختر حتى 5 أعضاء'),cnt,list,el('button',{class:'btn',onclick:async()=>{if(!chosen.size)return toast('اختر عضواً واحداً على الأقل');closeSheet();try{await set(R('warMv/'+wid),[...chosen]);toast('تم إرسال الطلب، يُنفَّذ قريباً ✅')}catch(e){err(e)}}},'تأكيد النقل'),el('button',{class:'btn g',onclick:closeSheet},'إلغاء'));
    }},'اختيار الأعضاء')));
  }catch(e){}
}

/* ---------- مراسلة المطورين ---------- */
const hdr=(t)=>el('div',{class:'hdr'},el('button',{class:'ib',onclick:C.back},'→'),el('h1',{},t));
async function dmList(){
  const list=el('div',{class:'list'});C.app.replaceChildren(hdr('💬 المطورون'),list);
  let ids=[];try{ids=Object.keys((await get(R('devs'))).val()||{})}catch(e){}
  if(C.EMP()&&!ids.includes(C.EMP()))ids.push(C.EMP());ids=ids.filter(u=>u!==U());
  if(!ids.length)return list.append(el('div',{class:'empty'},'لا يوجد مطورون آخرون بعد'));
  for(const u of ids){const nm=el('b',{},'…');prof(u).then(p=>nm.textContent=p.name||'مطور');list.append(el('div',{class:'row',onclick:()=>go('d/'+u)},avatar(u),el('div',{class:'t'},nm,el('small',{},u===C.EMP()?'الإمبراطور':'رتبة عليا'))))}
}
async function dmChat(peer){
  const[a,b]=[U(),peer].sort(),path=`dm/${a}/${b}`,box=el('div',{id:'msgs'}),ta=el('textarea',{rows:'1',placeholder:'اكتب رسالة…',maxlength:'2000'}),nm=el('h1',{},'…');
  prof(peer).then(p=>nm.textContent=p.name||'مطور');
  C.app.replaceChildren(el('div',{class:'hdr'},el('button',{class:'ib',onclick:C.back},'→'),nm),box,el('div',{class:'cmp'},ta,el('button',{class:'send',onclick:async()=>{const t=ta.value.trim();if(!t)return;ta.value='';try{await set(push(R(path)),{from:U(),text:t,ts:serverTimestamp()})}catch(e){err(e);ta.value=t}}},'➤')));
  const un=onChildAdded(query(R(path),limitToLast(50)),s=>{const m=s.val(),own=m.from===U();
    box.append(el('div',{class:'msg '+(own?'me':'ot')},el('div',{class:'bub',style:'background:linear-gradient(135deg,'+(own?'#ff7a1a,#a04800':'#3a4a6a,#1f2840')+')'},el('div',{class:'tx'},m.text),el('div',{class:'ft'},hhmmx(m.ts)))));box.scrollTop=box.scrollHeight},e=>err(e));
  C.onLeave(un);
}
const hhmmx=ts=>{if(!ts)return'';const d=new Date(ts);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};

/* ---------- حماية النسخة (بصمة الملفات) ---------- */
const FILES=['chat.js','chat.css','chat.html','index.html'],FK=f=>f.replace('.','_');
async function sha(t){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function fileHashes(){const o={};for(const f of FILES){try{o[f]=await sha(await(await fetch(f,{cache:'no-store'})).text())}catch(e){o[f]=null}}return o}
async function integrity(){
  if(C.isDev())return true;
  try{const cfg=(await get(R('config/hashes'))).val();if(!cfg)return true;
    const cur=await fileHashes();
    for(const f of FILES){if(!cur[f])continue;const ok=Object.values(cfg[FK(f)]||{});if(ok.length&&!ok.includes(cur[f])){set(R('tamper/'+U()),Date.now()).catch(()=>{});return false}}
  }catch(e){}
  return true;
}
async function approve(){
  const cur=await fileHashes(),cfg=(await get(R('config/hashes'))).val()||{},up={};
  for(const f of FILES){if(!cur[f])continue;const arr=Object.values(cfg[FK(f)]||{});if(!arr.includes(cur[f]))up[`config/hashes/${FK(f)}/${arr.length}`]=cur[f]}
  if(!Object.keys(up).length)return toast('هذه النسخة معتمدة بالفعل');
  await update(ref(db),up);toast('تم اعتماد النسخة الحالية ✅');
}

/* ---------- بطاقات الرسائل الخاصة ---------- */
function sysCard(m){
  if(m.k==='bot')return el('div',{},el('div',{style:'white-space:pre-wrap;line-height:1.7'},m.text),m.f?el('small',{style:'color:var(--mu)'},'بطلب: '+m.f):null);
  if(m.k==='welcome')return el('div',{style:'display:flex;gap:10px;align-items:center'},avatar(m.from,'l'),el('div',{style:'line-height:1.7'},m.text));
  if(m.k==='rank'&&m.d)try{return rankCard(JSON.parse(m.d))}catch(e){}
  if(m.k==='war'&&m.d)try{return warCard(JSON.parse(m.d))}catch(e){}
  return null;
}
function rankCard(o){
  const c=hex(o.c)?o.c:'#2a6cff',L=o.l||[],ring=['#ffd54a','#cfd8dc','#cd7f32'];
  const top=el('div',{class:'rk3'},...[1,0,2].map(i=>{const r=L[i];if(!r)return el('div');const a=avatar(r[0],'l');a.style.border='4px solid '+ring[i];a.style.boxShadow='0 0 14px '+ring[i];
    return el('div',{class:'rkc'+(i===0?' first':'')},i===0?el('div',{style:'font-size:22px'},'👑'):null,a,el('b',{style:'color:'+ring[i]},String(i+1)),el('div',{class:'rkn'},r[1]),el('small',{},r[2]+' رسالة'))}));
  const rows=L.slice(3).map((r,i)=>el('div',{class:'rkr'},el('span',{},String(i+4)),el('b',{},r[1]),el('span',{},r[3]==='f'?'👩':'👨'),el('em',{},String(r[2]))));
  return el('div',{class:'rk',style:`background:linear-gradient(160deg,${dk(c,.55)},#07101f)`},el('div',{class:'rkt',style:'color:'+c},'🏆 '+o.n),top,...rows);
}
function warCard(o){
  if(o.t==='decl')return el('div',{class:'wc'},el('div',{class:'clash'},el('span',{},'🗡️'),el('span',{},'🗡️')),el('b',{},'⚔️ إعلان حرب'),el('div',{},`نقابة «${o.a}» ⚔️ نقابة «${o.d}»`),el('small',{},'بقيادة '+o.by+' — تبدأ بعد ساعة'));
  return el('div',{class:'wc'},el('div',{class:'clash'},el('span',{},'🗡️'),el('span',{},'🗡️')),el('b',{},'🏆 انتهت الحرب'),el('div',{},`انتصرت نقابة «${o.win}» 👑`),el('small',{},o.lead?'القائد: '+o.lead:''),o.mv?el('small',{},' • تم نقل '+o.mv+' أعضاء'):null);
}

/* ---------- مهام المطورين الدورية: الحرب والحسبة ---------- */
async function settleWars(){
  const ws=(await get(R('wars'))).val()||{};
  for(const[wid,w]of Object.entries(ws)){
    if(w.s==='p'&&Date.now()>=w.en)await settle(wid,w);
    if(w.s==='d'&&w.res==='a')await applyMoves(wid,w);
  }
}
async function settle(wid,w){
  const[sa,sd]=await Promise.all([get(R('guildStats/'+w.a)),get(R('guildStats/'+w.d))]);
  const A=sa.val()||{atk:1,def:1},D=sd.val()||{atk:1,def:1},win=(A.atk||1)>(D.def||1)?'a':'d';
  const up={['wars/'+wid+'/s']:'d',['wars/'+wid+'/res']:win,['activeWar/'+w.a]:null,['activeWar/'+w.d]:null};
  const lead=(await prof(w.by)).name;
  if(win==='a'){
    const md=(await get(R('members/'+w.d))).val()||{},ma=(await get(R('members/'+w.a))).val()||{},cand={};
    for(const u of Object.keys(md))if(md[u]===true){up['wallets/'+u+'/bal']=0;cand[u]=(await prof(u)).name}
    const con=A.contrib||{},tot=Object.values(con).reduce((s,x)=>s+x,0),rec=tot?Object.entries(con):Object.keys(ma).filter(u=>ma[u]===true).map(u=>[u,1]),den=tot||rec.length||1;
    for(const[u,c]of rec){const sh=Math.floor(10000*c/den);if(sh>0)up['wallets/'+u+'/bal']=increment(sh)}
    up['warCand/'+wid]=cand;up['leadWar/'+w.by]=wid;
  }else{up['guildStats/'+w.a+'/atk']=1;up['guildStats/'+w.d+'/atk']=(D.atk||1)+Math.max(0,(A.atk||1)-1)}
  await update(ref(db),up);
  const g=C.groups(),news=Object.keys(g).find(x=>g[x].kind==='news');
  if(news)set(push(R('messages/'+news)),{from:U(),type:'sys',k:'war',text:'🏆 انتهت الحرب',d:JSON.stringify({t:'res',win:win==='a'?g[w.a].name:g[w.d].name,lead:lead}),ts:serverTimestamp()}).catch(()=>{});
}
async function applyMoves(wid,w){
  const mv=(await get(R('warMv/'+wid))).val();if(!mv)return;
  const list=(Array.isArray(mv)?mv:Object.values(mv)).slice(0,5),up={['warMv/'+wid]:null,['warCand/'+wid]:null,['leadWar/'+w.by]:null};
  for(const u of list){up[`members/${w.d}/${u}`]=null;up[`members/${w.a}/${u}`]=true}
  await update(ref(db),up);
}
async function tally(){
  const hh=(await get(R('meta/tallyHour'))).val(),hour=hh==null?23:hh,n=new Date();if(n.getHours()<hour)return;
  const key='tally_'+n.getFullYear()+'_'+(n.getMonth()+1)+'_'+n.getDate();
  try{await set(R('locks/'+key),true)}catch(e){return}
  const g=C.groups(),ms=Object.keys(g).filter(x=>g[x].kind==='main'),ads=Object.keys(g).find(x=>g[x].kind==='ads')||Object.keys(g).find(x=>g[x].kind==='news'),res=[];
  for(const x of ms){
    const st=(await get(R('stats/'+x))).val()||{},ents=Object.entries(st).filter(([,c])=>c>0).sort((a,b)=>b[1]-a[1]),total=ents.reduce((s,[,c])=>s+c,0);
    if(!total)continue;res.push([x,total]);
    const l=[];for(const[u,c]of ents.slice(0,10)){const p=await prof(u);l.push([u,(p.name||'عضو').slice(0,20),c,p.gender||'m'])}
    if(ads)await set(push(R('messages/'+ads)),{from:U(),type:'sys',k:'rank',text:'🏆 متصدرو '+g[x].name,d:JSON.stringify({n:g[x].name,c:colorFor(x),l}),ts:serverTimestamp()}).catch(()=>{});
  }
  if(ads&&res.length){res.sort((a,b)=>b[1]-a[1]);
    const lines=['⌬━─⟐─ ⊱•💭•⊰ ─⟐─━⌬'].concat(res.map(([x,t],i)=>(['المركز الأول','المركز الثاني','المركز الثالث'][i]||(i+1)+'')+':\n'+g[x].name+' ('+fmt(t)+' رسالة)'));
    await set(push(R('messages/'+ads)),{from:U(),type:'sys',k:'note',text:lines.join('\n'),ts:serverTimestamp()}).catch(()=>{});}
  for(const x of ms){await remove(R('messages/'+x)).catch(()=>{});await remove(R('stats/'+x)).catch(()=>{})}
  const bo=(await get(R('boost'))).val()||{};for(const u of Object.keys(bo))await remove(R('boost/'+u)).catch(()=>{});
  boostV=null;
}
let ticking=false;
async function devTick(){if(ticking)return;ticking=true;try{await settleWars();await tally()}catch(e){}ticking=false}
async function ensureStats(){if(!C.isDev())return;for(const g of mains()){try{if(!(await get(R('guildStats/'+g))).exists())await set(R('guildStats/'+g),{atk:1,def:1})}catch(e){}}}
async function checkVisit(){
  try{const v=(await get(R('visit/'+U()))).val();if(!v)return null;
    if(v.until<Date.now()){await update(ref(db),{[`members/${v.g}/${U()}`]:null,['visit/'+U()]:null});delete C.mem()[v.g];toast('انتهت زيارتك، عدت إلى نقابتك');return null}
    return v}catch(e){return null}
}
function empExtras(){
  const h=el('input',{type:'number',min:'0',max:'23',placeholder:'ساعة الحسبة (0-23)',style:'max-width:160px'});
  get(R('meta/tallyHour')).then(s=>{h.value=s.val()==null?23:s.val()}).catch(()=>{});
  return el('div',{class:'sec'},el('h4',{},'🛡 حماية النسخة'),el('p',{style:'margin-bottom:8px;color:var(--mu)'},'بعد كل تحديث للتطبيق: افتحه بحسابك ثم اضغط اعتماد، وإلا يُقفل التطبيق على الأعضاء.'),el('button',{class:'btn',style:'margin-bottom:12px',onclick:async()=>{try{await approve()}catch(e){err(e)}}},'اعتماد النسخة الحالية'),el('h4',{},'⏰ ساعة الحسبة اليومية'),el('div',{style:'display:flex;gap:8px'},h,el('button',{class:'btn',style:'padding:10px 16px',onclick:async()=>{const v=Math.floor(Number(h.value));if(!(v>=0&&v<=23))return toast('0 إلى 23');try{await set(R('meta/tallyHour'),v);toast('تم الحفظ ✅')}catch(e){err(e)}}},'حفظ')));
}
function route(a,b){if(a==='shop'){shop();return true}if(a==='d'){b?dmChat(b):dmList();return true}return false}
function start(){ensureStats();if(C.isDev()){setTimeout(devTick,4000);setInterval(devTick,30000)}}
return{send,sendRaw,integrity,sysCard,route,guildPanel,warBanner,checkVisit,empExtras,start,shop,colorFor,gamesSheet};
}
