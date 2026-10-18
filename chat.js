import{initializeApp}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import{getAuth,onAuthStateChanged,EmailAuthProvider,linkWithCredential,updatePassword,signOut}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import{getDatabase,ref,get,set,update,remove,push,query,limitToLast,endBefore,startAt,orderByKey,orderByChild,onValue,onChildAdded,onChildChanged,onChildRemoved,serverTimestamp,increment}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const app=initializeApp({apiKey:"AIzaSyBlIyelgyQBD0jHPpKve2TOjH1OnZS5LMs",authDomain:"slaw-3a991.firebaseapp.com",databaseURL:"https://slaw-3a991-default-rtdb.europe-west1.firebasedatabase.app",projectId:"slaw-3a991",storageBucket:"slaw-3a991.firebasestorage.app",messagingSenderId:"989570314649",appId:"1:989570314649:web:cb29cd40127e93f2a0e308"});
const auth=getAuth(app),db=getDatabase(app);
const R=p=>ref(db,p);

/* ====== أدوات ====== */
const el=(t,a={},...k)=>{const e=document.createElement(t);for(const[x,v]of Object.entries(a)){if(v==null||v===false)continue;if(x==='class')e.className=v;else if(x==='style')e.style.cssText=v;else if(x==='value')e.value=v;else if(x.startsWith('on'))e.addEventListener(x.slice(2),v);else e.setAttribute(x,v===true?'':v)}for(const c of k.flat()){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(String(c)))}return e};
const app$=document.getElementById('app'),sheetEl=document.getElementById('sheet'),toastEl=document.getElementById('toast'),fileIn=document.getElementById('fileIn');
const BADMSG=/خطأ|تعذر|لا يكفي|غير |ليس|لا يمكن|يجب|اكتب|اختر|فشل|انتظر|ممنوع|مقفل|كبير|طويل|حدد|لا توجد|لا يوجد|أقل|الحد|يرجى/;
let tt=0;const toast=(m,bad,acc)=>{toastEl.textContent=m;toastEl.style.display='block';toastEl.style.background=acc?'var(--or)':'#000c';toastEl.style.color=acc?'#1a0a00':'';toastEl.style.fontWeight=acc?'800':'';clearTimeout(tt);tt=setTimeout(()=>toastEl.style.display='none',2600);if(bad===true||(bad!==false&&!acc&&BADMSG.test(m)))sfx('err')};
const err=e=>toast(/PERMISSION/i.test(String(e&&(e.code||e.message)))?'غير مسموح لك بهذا الإجراء':'حدث خطأ، تأكد من الاتصال',true);
const hhmm=ts=>{if(!ts)return'';const d=new Date(ts);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
const rgb=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)||0);
const dark=c=>{if(!/^#[0-9a-f]{6}$/i.test(c))return'#222';return'#'+rgb(c).map(v=>Math.round(v*.62).toString(16).padStart(2,'0')).join('')};
const copy=async t=>{try{await navigator.clipboard.writeText(t)}catch(e){const a=el('textarea',{value:t});document.body.append(a);a.select();document.execCommand('copy');a.remove()}toast('تم النسخ')};
function openSheet(...k){sheetEl.replaceChildren(el('div',{},...k));sheetEl.classList.add('on')}
function closeSheet(){sheetEl.classList.remove('on');sheetEl.replaceChildren()}
sheetEl.addEventListener('click',e=>{if(e.target===sheetEl)closeSheet()});
function pickFile(acc='image/*',multi=false){return new Promise(r=>{fileIn.value='';fileIn.accept=acc;fileIn.multiple=multi;fileIn.onchange=()=>r(multi?[...fileIn.files]:(fileIn.files[0]||null));fileIn.oncancel=()=>r(multi?[]:null);fileIn.click()})}
function compress(file,max,q,sq,type){return new Promise((res,rej)=>{const img=new Image(),u=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(u);let w=img.width,h=img.height,sx=0,sy=0,sw=w,sh=h;if(sq){const s=Math.min(w,h);sx=(w-s)/2;sy=(h-s)/2;sw=sh=s;w=h=s}const k=Math.min(1,max/Math.max(w,h)),cw=Math.round(w*k),ch=Math.round(h*k),c=document.createElement('canvas');c.width=cw;c.height=ch;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cw,ch);x.drawImage(img,sx,sy,sw,sh,0,0,cw,ch);let o=c.toDataURL(type||'image/jpeg',q);if(type&&!o.startsWith('data:'+type))o=c.toDataURL('image/jpeg',q);res(o)};img.onerror=()=>rej(new Error('img'));img.src=u})}
async function fit(file,sizes,limit,sq,type){for(const s of sizes){let q=.8;do{const d=await compress(file,s,q,sq,type);if(d.length<limit)return d;q-=.12}while(q>.3)}throw new Error('big')}

/* ====== الحالة ====== */
let uid='',me={},EMP='',myRole=null,groups={},mem={},cleanup=[],ex=null,visitInfo=null;
const isEmp=()=>uid===EMP,isDev=()=>isEmp()||myRole==='dev';
const P=new Map(),RL=new Map(),AV=new Map();
const prof=u=>{if(!P.has(u))P.set(u,get(R('profiles/'+u)).then(s=>s.val()||{name:'عضو',color:'#888888'}).catch(()=>{P.delete(u);return{name:'عضو',color:'#888888'}}));return P.get(u)};
const roleOf=u=>{if(u===EMP)return Promise.resolve('emp');if(!RL.has(u))RL.set(u,get(R('roles/'+u)).then(s=>s.val()).catch(()=>null));return RL.get(u)};
const avOf=u=>{if(!AV.has(u))AV.set(u,get(R('avatars/'+u)).then(s=>s.val()||'').catch(()=>{AV.delete(u);return''}));return AV.get(u)};
const avIO=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){avIO.unobserve(e.target);e.target._ld&&e.target._ld()}},{rootMargin:'300px'});
function avatar(u,cls=''){const d=el('div',{class:'av '+cls});prof(u).then(p=>{if(!d.style.backgroundImage)d.textContent=(p.name||'?')[0]});d._ld=()=>avOf(u).then(a=>{if(a){d.style.backgroundImage=`url(${a})`;d.textContent=''}});avIO.observe(d);return d}
function botAv(cls=''){return el('div',{class:'av bot '+cls},'ALJESI')}
const KN={main:'نقابة',ads:'إعلانات',shop:'المتجر',news:'الصحيفة'};
function rankTag(r,isAdm){if(r==='emp')return el('span',{class:'tag king',style:'display:inline-flex;align-items:center;gap:3px'},ic('crown',12),'الإمبراطور');if(r==='dev')return el('span',{class:'tag'},'رتبة عليا');if(isAdm)return el('span',{class:'tag'},'مشرف');return null}
const ageTag=p=>{const d=(Date.now()-(p.ts||Date.now()))/864e5,[t,c]=d<3?['جديد','#5de0e6']:d<30?['عضو','#6ee787']:d<90?['قديم','#ffb04a']:['أسطورة','#ff7eb6'];return el('span',{class:'tag',style:`color:${c};background:${c}22`},t)};
const zoom=src=>{const o=el('div',{class:'ov',style:'align-items:center;justify-content:center;padding:0;background:#000e',onclick:()=>o.remove()},el('img',{src,style:'max-width:100%;max-height:100%;object-fit:contain'}));document.body.append(o)};
['replaceChildren','append','prepend'].forEach(n=>{const o=Element.prototype[n];Element.prototype[n]=function(...k){return o.apply(this,k.filter(x=>x!=null&&x!==false))}});
const run=()=>{cleanup.forEach(f=>{try{f()}catch(e){}});cleanup=[]};

/* ====== الأصوات (غيّر أسماء الملفات من هنا فقط) ====== */
const SFX={click:['XML.mp3','click.mp3'],err:['fff.mp3'],cres:['cres.mp3'],boom:['boom.mp3'],milo:['milo.mp3'],zmrd:['zmrd.mp3'],jesi:['jesi.mp3']};
const BADF=new Set();
function sfx(k,vol=1){
  if(k!=='jesi'&&localStorage.getItem('mute')==='1')return null;
  try{const src=(SFX[k]||[]).find(f=>!BADF.has(f));if(!src)return null;
    const a=new Audio(src);a.volume=vol;a.onerror=()=>BADF.add(src);const p=a.play();if(p&&p.catch)p.catch(()=>{});return a}catch(e){return null}
}
const stopSfx=a=>{try{if(a){a.pause();a.currentTime=0}}catch(e){}};
document.addEventListener('pointerdown',e=>{if(e.target.closest&&e.target.closest('button,.btn,.ib,.row,.cc,.chip,.bgp,.fab,.nd,.opt,.gb,select'))sfx('click',.6)},true);

/* ====== الأيقونات (رسومات ثابتة بدل الإيموجي) ====== */
const IC={
plus:'<path d="M12 5v14M5 12h14"/>',
mic:'<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
palette:'<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.3-1.7-.4-1 .2-2.3 1.5-2.3H17a4 4 0 0 0 4-4c0-5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
blur:'<path d="M3 3l18 18"/><path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 4.5 10 6-.5.8-1.6 2.2-3.2 3.4M6.7 7.7C4.4 9.1 2.8 11 2 12c1 1.5 5 6 10 6 1.5 0 2.8-.4 4-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
image:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>',
swap:'<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
userplus:'<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M19 8v6M16 11h6"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
bell:'<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 8H4c0-1 2-2 2-8z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
edit:'<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
dots:'<circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/>',
game:'<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10v5M4.5 12.5h5"/><circle cx="16" cy="11" r="1"/><circle cx="18.5" cy="14" r="1"/>',
cart:'<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11L21 7H6"/>',
shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>',
swords:'<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" x2="9" y1="14" y2="18"/><line x1="7" x2="4" y1="17" y2="20"/><line x1="3" x2="5" y1="19" y2="21"/>',
ticket:'<path d="M3 8a2 2 0 0 0 0 8v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a2 2 0 0 1 0-8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/><path d="M13 4v16" stroke-dasharray="2 3"/>',
gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
wheel:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 3v7M12 14v7M3 12h7M14 12h7M5.6 5.6l5 5M13.4 13.4l5 5M18.4 5.6l-5 5M10.6 13.4l-5 5"/>',
trophy:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
chain:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
download:'<path d="M12 3v12M7 11l5 5 5-5M4 21h16"/>',
send:'<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
pause:'<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
play:'<path d="M7 4l13 8-13 8z"/>',
x:'<path d="M6 6l12 12M18 6L6 18"/>',
check:'<path d="M5 12l5 5 9-10"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
back:'<path d="M5 12h14M13 6l6 6-6 6"/>',
crown:'<path d="M3 18h18l-2-10-5 4-2-7-2 7-5-4z"/>',
sliders:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
camera:'<path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/>',
reply:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v3"/>',
ban:'<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
flag:'<path d="M5 21V4M5 4h13l-3 4 3 4H5"/>',
merge:'<path d="M6 3v6a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3M12 15v6"/>',
at:'<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h0"/>',
share:'<path d="M12 3v12M8 7l4-4 4 4M5 14v6h14v-6"/>',
vip:'<path d="M3 18h18l-2-10-5 4-2-7-2 7-5-4z"/><path d="M5 21h14"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h0M3 12h0M3 18h0"/>'
};
function ic(n,s=22,c){const sp=document.createElement('span');sp.className='ico';sp.innerHTML=`<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${IC[n]||''}</svg>`;if(c)sp.style.color=c;return sp}
const ibtn=(n,f,cls='')=>el('button',{class:'ib '+cls,onclick:f},ic(n,21));

/* ====== ثيم الواجهة وحجم الخط والنموذج ====== */
const ACC=['#ff7a1a','#e53935','#d81b60','#8e24aa','#3949ab','#1e88e5','#00acc1','#00897b','#43a047','#f9a825'];
const FSZ=[11,12.5,13.5,15,17,19,21],LAYU=[.82,.9,.95,1,1.12,1.25,1.4];
const accent=()=>localStorage.getItem('ac')||'#ff7a1a';
const lighten=(c,k=.35)=>'#'+rgb(c).map(v=>Math.round(v+(255-v)*k).toString(16).padStart(2,'0')).join('');
const uiFs=()=>Math.min(7,Math.max(1,+(localStorage.getItem('ui_fs')||4))),uiLay=()=>Math.min(7,Math.max(1,+(localStorage.getItem('ui_lay')||4)));
function applyUI(fs=uiFs(),lay=uiLay(),ac=accent(),root=document.documentElement){
  const r=root.style;r.setProperty('--or',ac);r.setProperty('--or2',lighten(ac));r.setProperty('--acr',rgb(ac).join(','));
  r.setProperty('--fs',FSZ[fs-1]+'px');r.setProperty('--u',String(LAYU[lay-1]));
  if(root===document.documentElement)document.body.dataset.lay=String(lay);else root.dataset.lay=String(lay);
}
const hexOk=c=>/^#[0-9a-f]{6}$/i.test(c||'');
const normAr=s=>String(s||'').replace(/[\u064B-\u065F\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/\s+/g,' ').trim().toLowerCase();
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const nowS=()=>Date.now()+(window.__srvOff||0);
const fmtN=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,',');
const days=ts=>Math.max(0,Math.floor((Date.now()-(ts||Date.now()))/864e5));

/* ====== نافذة الأذونات ====== */
const PERMN={mic:'الميكروفون',media:'الصور والوسائط',music:'الصوتيات',save:'حفظ الملفات'};
function askPerm(kind){
  return new Promise(async res=>{
    if(kind==='mic'){try{const q=await navigator.permissions.query({name:'microphone'});if(q.state==='granted')return res(true)}catch(e){}}
    if(localStorage.getItem('perm_'+kind)==='1')return res(true);
    const o=el('div',{class:'ov dlgo'},el('div',{class:'dlgb'},ic('lock',34),el('h3',{},'يرجى منح الأذونات'),el('p',{},'يحتاج التطبيق إذن '+(PERMN[kind]||'')+' لإتمام هذه العملية'),
      el('div',{class:'dlgr'},el('button',{class:'btn',onclick:()=>{o.remove();localStorage.setItem('perm_'+kind,'1');res(true)}},'سماح'),el('button',{class:'btn g',onclick:()=>{o.remove();res(false)}},'تراجع'))));
    document.body.append(o);
  });
}

/* ====== أداة القص 1:1 ====== */
function cropImage(file,o={}){
  const{out=[256],limit=29000,type='image/jpeg',round=true,title='قص الصورة',ratio=1}=o;
  return new Promise(res=>{
    const img=new Image(),u=URL.createObjectURL(file);
    img.onerror=()=>{URL.revokeObjectURL(u);toast('تعذر فتح الصورة',true);res(null)};
    img.onload=()=>{
      const S=Math.min(300,Math.round(innerHeight*.5/ratio),innerWidth-56),H=Math.round(S*ratio),cv=el('canvas',{width:S,height:H,style:`width:${S}px;height:${H}px;border-radius:${round?'50%':'18px'};touch-action:none;background:#000;box-shadow:0 0 0 3px var(--or),0 0 26px rgba(var(--acr),.55)`});
      const cx=cv.getContext('2d'),base=Math.max(S/img.width,H/img.height);let z=1,px=0,py=0;
      const clamp=()=>{const w=img.width*base*z,h=img.height*base*z,mx=Math.max(0,(w-S)/2),my=Math.max(0,(h-H)/2);px=Math.min(mx,Math.max(-mx,px));py=Math.min(my,Math.max(-my,py))};
      const draw=(c2=cx,s=S)=>{const k=s/S,w=img.width*base*z*k,h=img.height*base*z*k;c2.fillStyle='#fff';c2.fillRect(0,0,s,s*ratio);c2.drawImage(img,s/2-w/2+px*k,s*ratio/2-h/2+py*k,w,h)};
      draw();
      const ps=new Map();let d0=0;
      cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);ps.set(e.pointerId,[e.clientX,e.clientY]);d0=0};
      cv.onpointermove=e=>{if(!ps.has(e.pointerId))return;const p=ps.get(e.pointerId);
        if(ps.size===1){px+=e.clientX-p[0];py+=e.clientY-p[1]}
        ps.set(e.pointerId,[e.clientX,e.clientY]);
        if(ps.size===2){const[a,b]=[...ps.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(d0){z=Math.min(4,Math.max(1,z*d/d0));zr.value=z}d0=d}
        clamp();draw()};
      cv.onpointerup=cv.onpointercancel=e=>{ps.delete(e.pointerId);d0=0};
      const zr=el('input',{type:'range',min:'1',max:'4',step:'0.01',value:'1',style:'direction:ltr',oninput:()=>{z=+zr.value;clamp();draw()}});
      const close=v=>{URL.revokeObjectURL(u);ov.remove();res(v)};
      const ov=el('div',{class:'ov'},el('h2',{},title),el('div',{class:'ovb',style:'align-items:center'},cv,el('small',{style:'color:var(--mu)'},'اسحب لتحريك الصورة وكبّرها بالشريط'),zr,
        el('div',{style:'display:flex;gap:10px;width:100%'},el('button',{class:'btn',style:'flex:1',onclick:async()=>{
          try{for(const s of out){let q=.85;do{const c=document.createElement('canvas');c.width=s;c.height=Math.round(s*ratio);draw(c.getContext('2d'),s);let d=c.toDataURL(type,q);if(!d.startsWith('data:'+type))d=c.toDataURL('image/jpeg',q);if(d.length<limit)return close(d);q-=.12}while(q>.3)}toast('الصورة كبيرة جداً',true)}catch(e){toast('تعذر معالجة الصورة',true)}}},'حفظ'),
          el('button',{class:'btn g',style:'flex:1',onclick:()=>close(null)},'إلغاء'))));
      document.body.append(ov);
    };
    img.src=u;
  });
}


async function sha(t){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
const gname=g=>(groups[g]&&groups[g].name)||'—';
/* ====== إصدار التطبيق والتحديث ====== */
const BUILD=Number('__BUILD__')||window.__BUILD||0,REPO='__REPO__'.startsWith('__')?(window.__REPO||''):'__REPO__';
async function checkUpdate(){
  if(!BUILD||!REPO)return;
  try{const mb=(await get(R('config/minBuild'))).val();if(!(mb>BUILD)||document.querySelector('.updo'))return;
    const o=el('div',{class:'ov dlgo updo'},el('div',{class:'dlgb'},ic('download',34),el('h3',{},'يتوفر تحديث جديد'),el('p',{},'يلزم تحديث التطبيق. حمّل النسخة وثبّتها فوق القديمة، لا حاجة لحذف التطبيق ولا تفقد بياناتك.'),
      el('div',{class:'dlgr'},el('button',{class:'btn',onclick:()=>window.open('https://github.com/'+REPO+'/releases/latest/download/SLAW.apk','_blank')},'تحديث الآن'),el('button',{class:'btn g',onclick:()=>o.remove()},'لاحقاً'))));
    document.body.append(o)}catch(e){}
}
/* ====== الدخول ====== */
let authTimer=0;
onAuthStateChanged(auth,async u=>{
  if(!u){clearTimeout(authTimer);authTimer=setTimeout(()=>{if(!auth.currentUser){localStorage.removeItem('fir_in');location.replace('index.html')}},2500);return}
  clearTimeout(authTimer);if(uid===u.uid&&ex)return;
  uid=u.uid;localStorage.setItem('fir_in','1');applyUI();
  try{
    const[p,emp,rl,ban]=await Promise.all([get(R('profiles/'+uid)),get(R('config/emperorUid')),get(R('roles/'+uid)),get(R('banned/'+uid))]);
    if(!p.exists()){localStorage.removeItem('fir_in');location.replace('index.html');return}
    if(ban.exists()){sfx('err');app$.replaceChildren(el('div',{class:'blk'},'أنت محظور من استعمال التطبيق'));return}
    me=p.val();EMP=emp.val()||'';myRole=rl.val()||null;P.set(uid,Promise.resolve(me));
    onValue(ref(db,'.info/serverTimeOffset'),s=>{window.__srvOff=s.val()||0},()=>{});
    await loadGroups();
    ex=initExtra({db,app:app$,el,toast,err,openSheet,closeSheet,go,back,avatar,prof,roleOf,copy,botAv,
      uid:()=>uid,me:()=>me,groups:()=>groups,mem:()=>mem,isDev,isEmp,EMP:()=>EMP,
      dropProf:u=>P.delete(u),reinfo:g=>info(g),onLeave:f=>cleanup.push(f)});
    visitInfo=await ex.checkVisit();ex.start();
    const lock=()=>{sfx('err');cleanup.forEach(f=>{try{f()}catch(e){}});app$.replaceChildren(el('div',{class:'blk'},'أنت محظور من استعمال التطبيق'))};
    setTimeout(()=>ex.integrity(),6000);if(uid===EMP)localStorage.setItem('emp_dev','1');
    setTimeout(checkUpdate,3000);setInterval(checkUpdate,1800000);setTimeout(ensurePw,2500);
    ensurePid();startBell();startLb();initBack();
    if(uid===EMP)onValue(R('wallets/'+uid+'/bal'),s=>{if((s.val()||0)<50000000)set(R('wallets/'+uid+'/bal'),99000000).catch(()=>{})},()=>{});
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
  if(a==='ui')return uiEditor();
  if(a==='vip')return vipScreen();
  if(a==='lb')return lbScreen();
  if(a==='roul')return roulScreen();
  if(a==='bell')return bellScreen();
  if(a==='mg')return mergeScreen();
  if(a==='dl')return devLocks();
  if(a==='e'&&isEmp())return empMenu();
  home();
}
const go=h=>{location.hash=h};
const back=()=>history.length>1?history.back():go('');

/* ====== الرئيسية ====== */
const _pl={};
const plugin=n=>{if(n in _pl)return _pl[n];let p=null;try{const C=window.Capacitor;if(C&&C.registerPlugin)p=C.registerPlugin(n)}catch(e){}return _pl[n]=p};
function initBack(){
  const App=plugin('App');if(!App||!App.addListener)return;
  App.addListener('backButton',()=>{
    const ovs=document.querySelectorAll('.ov');if(ovs.length){ovs[ovs.length-1].remove();return}
    if(sheetEl.classList.contains('on')){closeSheet();return}
    const h=location.hash.replace('#','');
    if(h===''||h==='/'){
      openSheet(el('h3',{style:'text-align:center'},'هل تريد مغادرة التطبيق؟'),el('div',{style:'display:flex;gap:10px'},el('button',{class:'btn r',style:'flex:1',onclick:()=>{try{App.exitApp()}catch(e){}}},'نعم'),el('button',{class:'btn g',style:'flex:1',onclick:closeSheet},'لا')));return}
    const before=location.hash;history.back();setTimeout(()=>{if(location.hash===before)go('')},200);
  });
}
function home(){
  const isE=isEmp(),bal=el('div',{class:'bal'},isE?infSvg(44):'…'),upg=el('div',{class:'bal upgb'},ic('ticket',16),el('span',{},'0'));
  if(!isE)cleanup.push(onValue(R('wallets/'+uid+'/bal'),s=>{const v=s.val()||0;bal.textContent=fmtN(v);bal.classList.toggle('neg',v<0)},()=>{}));
  cleanup.push(onValue(R('inv/'+uid+'/upg'),s=>{upg.lastChild.textContent=String(s.val()||0)},()=>{}));
  const list=el('div',{class:'list'}),ids=Object.keys(mem).filter(g=>groups[g]&&groups[g].kind!=='dm').sort((a,b)=>(groups[a].kind==='main'?0:1)-(groups[b].kind==='main'?0:1));
  const hasMain=ids.some(g=>groups[g].kind==='main'&&mem[g]===true);
  if(!hasMain&&!isDev())list.append(el('div',{class:'note'},'أهلاً بك 🔥\nأنت الآن في غرفة الانتظار. سيضيفك أحد المطورين إلى نقابة قريباً، أو يمكنك الدخول برمز إحالة من أحد أعضاء النقابات عند التسجيل.'));
  if(visitInfo&&groups[visitInfo.g])list.append(el('div',{class:'note'},'✈️ أنت زائر في نقابة «'+groups[visitInfo.g].name+'» وستعود إلى نقابتك بعد '+Math.max(1,Math.ceil((visitInfo.until-Date.now())/864e5))+' يوم. رصيدك معك.'));
  const badge=g=>{const b=el('i',{class:'ub'});cleanup.push(onValue(R('gl/'+g+'/cnt'),s=>{const c=s.val()||0,k='rd_'+g;let r=localStorage.getItem(k);if(r===null){localStorage.setItem(k,String(c));r=String(c)}const n=c-(+r);b.textContent=n>99?'99+':String(n);b.style.display=n>0?'flex':'none'},()=>{}));return b};
  const secBox=el('div',{class:'secard'},el('div',{class:'sech'},'المجموعات'));
  if(!ids.length)secBox.append(el('div',{class:'empty'},'لا توجد قروبات بعد'));
  for(const g of ids){
    const gm=groups[g],ph=el('div',{class:'av'},(gm.name||'?')[0]),sub=el('small',{},KN[gm.kind]||'');
    get(R('groupPhotos/'+g)).then(s=>{if(s.val()){ph.style.backgroundImage=`url(${s.val()})`;ph.textContent=''}}).catch(()=>{});
    cleanup.push(onValue(R('groups/'+g+'/maint'),s=>{const v=s.val();gm.maint=v;
      if(v&&v.s==='run'){sub.textContent='صيانة';sub.style.color='#ffb04a'}
      else if(v&&v.s==='done'&&Date.now()-(v.ts||0)<36e5){sub.textContent='انتهى';sub.style.color='#6ee787'}
      else{sub.textContent=KN[gm.kind]||'';sub.style.color=''}},()=>{}));
    secBox.append(el('div',{class:'row',onclick:()=>{if(gm.maint&&gm.maint.s==='run'&&!isDev())return toast('الدردشة قيد الصيانة',true);go('g/'+g)}},ph,el('div',{class:'t'},el('b',{},gm.name),sub),mem[g]==='v'?el('span',{class:'tag'},'زائر'):null,badge(g)));
  }
  const dmBox=el('div',{class:'secard dmc'},el('div',{class:'sech'},'الدردشات'));
  let lastFr={};const bc={},favs=()=>{try{return JSON.parse(localStorage.getItem('favs')||'[]')}catch(e){return[]}};
  const drawDm=fr=>{lastFr=fr||{};dmBox.replaceChildren(el('div',{class:'sech'},'الدردشات'));const fv=favs(),us=Object.keys(lastFr).sort((a,b)=>(fv.includes(b)?1:0)-(fv.includes(a)?1:0));
    if(!us.length)return dmBox.append(el('div',{class:'empty'},'أضف أصدقاء وسيظهرون هنا للمراسلة'));
    for(const u of us){const g=dmId(uid,u),nm=el('b',{},'…');prof(u).then(p=>{nm.textContent=p.name||'صديق'});
      const st=el('button',{class:'star'+(fv.includes(u)?' on':''),onclick:e=>{e.stopPropagation();const f=favs(),k=f.indexOf(u);if(k<0)f.push(u);else f.splice(k,1);localStorage.setItem('favs',JSON.stringify(f));drawDm(lastFr)}},ic('star',22));
      dmBox.append(el('div',{class:'row',onclick:()=>go('g/'+g)},avatarP(u,''),el('div',{class:'t'},nm,el('small',{},fv.includes(u)?'مفضّل':'صديق')),st,bc[g]||(bc[g]=badge(g))))}};
  cleanup.push(onValue(R('friends/'+uid),s=>drawDm(s.val()),()=>drawDm({})));
  list.append(secBox,dmBox);
  const bell=el('button',{class:'ib bellb',onclick:()=>go('bell')},ic('bell',21),el('i',{class:'bdg'},'0'));
  const hdr=el('div',{class:'hdr'},el('div',{onclick:()=>go('s')},avatar(uid)),el('h1',{},me.name),bal,upg,
    ibtn('userplus',addFriendSheet),bell,isDev()?el('button',{class:'ib',onclick:()=>go('d')},'💬'):null,isEmp()?el('button',{class:'ib',style:'color:#ffd54a',onclick:()=>go('e')},ic('crown',22)):null,ibtn('gear',()=>go('s')));
  const bar=el('div',{class:'hbar'},el('button',{class:'hb',onclick:()=>go('lb')},ic('trophy',24),el('span',{},'التصدر')),el('button',{class:'hb',onclick:()=>go('roul')},ic('wheel',24),el('span',{},'الروليت')));
  app$.replaceChildren(hdr,list,bar,el('button',{class:'fab gift'+(isDev()?' up':''),onclick:claimGift},ic('gift',26)),isDev()?el('button',{class:'fab',onclick:newGroup},'+'):null);
  updBadge();
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


/* ====================== أدوات الوسائط والملصقات والتحويل ====================== */
const MB6=6*1024*1024,VMAX=90;
const readURL=f=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)});
async function putMedia(gid,dataUrl,onProg){
  const mid=push(R('media/'+gid)).key,CH=380000,n=Math.ceil(dataUrl.length/CH);
  for(let i=0;i<n;i+=3){const up={};for(let j=i;j<Math.min(n,i+3);j++)up[`media/${gid}/${mid}/${j}`]=dataUrl.slice(j*CH,(j+1)*CH);await update(ref(db),up);onProg&&onProg(Math.min(1,(i+3)/n))}
  return{mid,nc:n};
}
async function getMedia(gid,mid){
  const s=(await get(R(`media/${gid}/${mid}`))).val();if(!s)throw new Error('nomedia');
  const parts=Array.isArray(s)?s:Object.keys(s).sort((a,b)=>a-b).map(k=>s[k]);return parts.join('');
}
function dataToBlobUrl(d){const[h,b]=d.split(','),mime=(h.match(/:(.*?);/)||[])[1]||'application/octet-stream',bin=atob(b),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);return URL.createObjectURL(new Blob([u8],{type:mime}))}
const sz=n=>n>1048576?(n/1048576).toFixed(1)+' MB':Math.round(n/1024)+' KB';
async function saveImage(src){
  if(!(await askPerm('save')))return;
  try{
    const FS=plugin('Filesystem');
    const name='FIR_'+Date.now()+'.'+((src.match(/^data:image\/(\w+)/)||[])[1]||'jpg').replace('jpeg','jpg');
    if(FS&&FS.writeFile){await FS.writeFile({path:'FIR/'+name,data:src.split(',')[1],directory:'DOCUMENTS',recursive:true});toast('تم حفظ الصورة في Documents/FIR',false,true)}
    else{const a=el('a',{href:src,download:name});document.body.append(a);a.click();a.remove();toast('تم تحميل الصورة',false,true)}
  }catch(e){toast('تعذر حفظ الصورة',true)}
}
/* ---- ملصقات ---- */
const stOwner=new Map();
function stickerOwner(sid){if(!stOwner.has(sid))stOwner.set(sid,get(R('stickers/'+sid+'/u')).then(s=>s.val()||'').catch(()=>''));return stOwner.get(sid)}
async function stickerName(owner){if(!owner)return'';try{return(await get(R('snm/'+owner))).val()||''}catch(e){return''}}
function gifSecs(buf){const b=new Uint8Array(buf);let t=0,i=13;if(b[10]&0x80)i+=3*(1<<((b[10]&7)+1));while(i<b.length){if(b[i]===0x21&&b[i+1]===0xF9){t+=(b[i+4]|(b[i+5]<<8))/100;i+=8}else if(b[i]===0x21){i+=2;while(b[i])i+=b[i]+1;i++}else if(b[i]===0x2C){i+=10;if(b[i-1]&0x80)i+=3*(1<<((b[i-1]&7)+1));i++;while(b[i])i+=b[i]+1;i++}else if(b[i]===0x3B)break;else i++}return t}
function webpSecs(buf){const b=new Uint8Array(buf),dv=new DataView(buf);let t=0,i=12,anim=false;while(i+8<=b.length){const tag=String.fromCharCode(b[i],b[i+1],b[i+2],b[i+3]),len=dv.getUint32(i+4,true);if(tag==='VP8X')anim=!!(b[i+8]&2);if(tag==='ANMF')t+=(b[i+20]|(b[i+21]<<8)|(b[i+22]<<16))/1000;i+=8+len+(len&1)}return anim?t:0}
async function makeSticker(onDone){
  if(!(await askPerm('media')))return;const f=await pickFile('image/*');if(!f)return;
  try{
    let d=null;
    const isGif=f.type==='image/gif',isWebp=f.type==='image/webp';
    if(isGif||isWebp){const buf=await f.arrayBuffer(),secs=isGif?gifSecs(buf):webpSecs(buf);
      if(secs>6)return toast('الملصق المتحرك أقصى مدة 6 ثواني',true);
      if(secs>0){if(f.size>95000)return toast('الملصق المتحرك كبير الحجم (الأقصى 95 كيلوبايت)',true);d=await readURL(f)}}
    if(!d){d=await cropImage(f,{out:[256,200,150],limit:24000,type:'image/webp',round:false,title:'قص الملصق'});if(!d)return}
    const sid=push(R('stickers')).key;
    await update(ref(db),{[`stickers/${sid}`]:{u:uid,d},[`myStickers/${uid}/${sid}`]:true});
    try{localStorage.setItem('st_'+sid,d)}catch(e){}
    toast('تم إنشاء الملصق',false,true);onDone&&onDone();
  }catch(e){err(e)}
}
async function stickerPanel(onPick){
  const grid=el('div',{class:'stg'}),sel=new Set();let delMode=false,ids=[];
  const foot=el('div',{style:'display:none;gap:10px'},el('button',{class:'btn g',style:'flex:1',onclick:()=>{delMode=false;sel.clear();draw()}},'إلغاء'),el('button',{class:'btn r',style:'flex:1',onclick:async()=>{
    if(!sel.size)return toast('حدد ملصقاً واحداً على الأقل',true);const up={};sel.forEach(s=>up[`myStickers/${uid}/${s}`]=null);
    try{await update(ref(db),up);ids=ids.filter(x=>!sel.has(x));sel.clear();delMode=false;draw();toast('تم الحذف')}catch(e){err(e)}}},'حذف'));
  const draw=()=>{foot.style.display=delMode?'flex':'none';grid.replaceChildren(el('div',{class:'add',onclick:()=>makeSticker(load)},ic('plus',28)),...ids.map(sid=>{const im=el('img');stickerData(sid).then(d=>{if(d)im.src=d});
    return el('div',{class:'stc'+(sel.has(sid)?' on':''),onclick:()=>{if(delMode){if(sel.has(sid))sel.delete(sid);else sel.add(sid);draw()}else{closeSheet();onPick(sid)}}},im,delMode?el('i',{class:'ck'},sel.has(sid)?ic('check',14):null):null)}))};
  async function load(){try{ids=Object.keys((await get(R('myStickers/'+uid))).val()||{})}catch(e){}draw()}
  const nameBtn=el('button',{class:'ib',onclick:async()=>{
    const cur=await stickerName(uid),inp=el('input',{value:cur,maxlength:'24',placeholder:'اسم يظهر في معلومات كل ملصق'});
    openSheet(el('h3',{},'ضع اسم يظهر في معلومات كل ملصق'),inp,el('button',{class:'btn',onclick:async()=>{try{const v=inp.value.trim().slice(0,24);await set(R('snm/'+uid),v||null);closeSheet();toast('تم حفظ الاسم',false,true)}catch(e){err(e)}}},'حفظ'),el('button',{class:'btn g',onclick:closeSheet},'إلغاء'))}},ic('edit',20));
  const delBtn=el('button',{class:'ib',style:'color:#ff5a4d',onclick:()=>{delMode=true;sel.clear();draw()}},ic('trash',20));
  openSheet(el('div',{style:'display:flex;align-items:center;gap:8px'},el('h3',{style:'flex:1;margin:0'},'ملصقاتي'),nameBtn,delBtn),grid,foot);
  load();
}
async function stickerInfo(m,own,del){
  const sid=m.sid,im=el('img',{class:'stbig'});stickerData(sid).then(d=>{if(d)im.src=d});
  const nmEl=el('b',{style:'font-size:17px'},'…');
  stickerOwner(sid).then(async o=>{const n=await stickerName(o);nmEl.textContent=n||(await prof(m.from)).name||'عضو'});
  const mine=(await get(R(`myStickers/${uid}/${sid}`)).then(s=>s.exists()).catch(()=>false));
  openSheet(el('div',{style:'display:flex;flex-direction:column;align-items:center;gap:10px'},im,nmEl),
    mine?el('div',{class:'empty',style:'padding:6px'},'الملصق موجود لديك'):el('button',{class:'btn',onclick:async()=>{try{await set(R(`myStickers/${uid}/${sid}`),true);closeSheet();toast('تمت سرقة الملصق',false,true)}catch(e){err(e)}}},'سرقة الملصق'),
    del?el('button',{class:'btn r',onclick:()=>{closeSheet();del()}},'حذف الرسالة'):null,el('button',{class:'btn g',onclick:closeSheet},'إغلاق'));
}
/* ---- تحويل رصيد ---- */
async function transferSheet(gid,gm){
  const mg=gm&&gm.kind==='main'?gid:myMainG();if(!mg||mem[mg]!==true)return toast('التحويل داخل النقابة فقط',true);
  const amt=el('input',{type:'number',inputmode:'numeric',placeholder:'حدد المبلغ'});let target=null;
  const tb=el('button',{class:'btn g',onclick:pickMember},'حدد العضو المراد ارسال مبلغ اليه'),sendB=el('button',{class:'btn',style:'display:none',onclick:go2},'ارسال');
  openSheet(el('div',{style:'display:flex;align-items:center;gap:8px'},ic('swap',24,'var(--or2)'),el('h3',{style:'margin:0'},'تحويل')),amt,tb,sendB,el('button',{class:'btn g',onclick:closeSheet},'إلغاء'));
  async function pickMember(){
    const n=Math.floor(Number(amt.value));if(!(n>=10))return toast('حدد المبلغ أولاً (10 فما فوق)',true);
    const list=el('div'),s=el('input',{placeholder:'ابحث بالاسم'});openSheet(el('h3',{},'أعضاء النقابة'),s,list);
    let ms={};try{ms=(await get(R('members/'+mg))).val()||{}}catch(e){return err(e)}
    const ids=Object.keys(ms).filter(u=>u!==uid&&ms[u]===true),ps=await Promise.all(ids.map(prof));
    const draw=()=>{const q=s.value.trim();list.replaceChildren(...ids.map((u,i)=>[u,ps[i]]).filter(([u,p])=>!q||(p.name||'').includes(q)).slice(0,40).map(([u,p])=>
      el('div',{class:'row',onclick:()=>{target={u,p};closeSheet();transferSheet2(n)}},avatar(u,'s'),el('div',{class:'t'},el('b',{},p.name)))))};s.oninput=draw;draw();
  }
  function transferSheet2(n){
    openSheet(el('div',{class:'frc'},avatar(target.u,'l'),el('b',{style:'font-size:18px'},target.p.name),el('div',{class:'ovi'},fmtN(n)+' رصيد')),el('button',{class:'btn',onclick:()=>doSend(n)},'ارسال'),el('button',{class:'btn g',onclick:closeSheet},'إلغاء'));
  }
  async function doSend(n){
    try{if(await ex.balance()<n){closeSheet();return toast('رصيدك لا يكفي',true)}
      const k1=push(R('notifs/'+uid)).key,k2=push(R('notifs/'+target.u)).key;
      await update(ref(db),{['wallets/'+uid+'/bal']:increment(-n),['wallets/'+target.u+'/bal']:increment(n),
        [`notifs/${target.u}/${k2}`]:{t:'tr',from:uid,a:n,ts:serverTimestamp()},[`notifs/${uid}/${k1}`]:{t:'lost',from:uid,a:n,m:target.p.name||'عضو',ts:serverTimestamp()}});
      closeSheet();toast('تم التحويل',false,true);ex.shopTx({to:target.p.name||'عضو',from:me.name,g:gname(mg),a:n});
    }catch(e){err(e)}
  }
  function go2(){}
}
/* ---- المنشن ---- */
async function mentionSheet(gid,staff,onPick){
  const s=el('input',{placeholder:'ابحث عن عضو'}),list=el('div');openSheet(el('h3',{},'منشن عضو'),s,list);
  let ms={};try{ms=(await get(R('members/'+gid))).val()||{}}catch(e){return err(e)}
  const ids=Object.keys(ms).filter(u=>u!==uid),ps=await Promise.all(ids.map(prof));
  const draw=()=>{const q=s.value.trim();list.replaceChildren(
    ...(staff&&!q?[el('div',{class:'row',onclick:()=>{closeSheet();onPick(null,'الكل')}},el('div',{class:'av s'},ic('at',16)),el('div',{class:'t'},el('b',{},'الكل'),el('small',{},'للمشرفين والرتب العليا فقط')))]:[]),
    ...ids.map((u,i)=>[u,ps[i]]).filter(([u,p])=>!q||(p.name||'').includes(q)).slice(0,50).map(([u,p])=>el('div',{class:'row',onclick:()=>{closeSheet();onPick(u,p.name||'عضو')}},avatar(u,'s'),el('div',{class:'t'},el('b',{},p.name||'عضو')))))};
  s.oninput=draw;draw();
}
/* ---- الصوتيات ---- */
const musicLib=[];
async function musicPicker(gid,gm,sendMedia){
  if(!(await askPerm('music')))return;
  const o=el('div',{class:'ov'}),close=()=>o.remove(),list=el('div',{class:'list',style:'flex:1;overflow:auto'}),s=el('input',{placeholder:'ابحث عن أغنية'});
  const draw=()=>{const q=normAr(s.value);const items=musicLib.filter(f=>!q||normAr(f.name).includes(q)).sort((a,b)=>b.lastModified-a.lastModified);
    list.replaceChildren(...(items.length?items.map(f=>el('div',{class:'row',onclick:()=>{if(f.size>MB6)return toast('حجم الأغنية أكبر من 6 ميغابايت',true);close();sendMedia('music',f)}},
      el('div',{class:'av s',style:'background:rgba(var(--acr),.25)'},ic('music',16)),el('div',{class:'t'},el('b',{},f.name.replace(/\.[^.]+$/,'')),el('small',{},sz(f.size)+(f.size>MB6?' • أكبر من الحد':''))),f.size>MB6?ic('lock',16):null)):[el('div',{class:'empty'},musicLib.length?'لا توجد نتائج':'اضغط «إضافة أغاني» لاختيار أغانيك')]))};
  s.oninput=draw;
  const add=el('button',{class:'btn',style:'margin:0 0 6px',onclick:async()=>{const fs=await pickFile('audio/*',true);if(!fs||!fs.length)return;for(const f of fs)if(!musicLib.some(x=>x.name===f.name&&x.size===f.size))musicLib.push(f);draw()}},'إضافة أغاني من الجهاز');
  o.append(el('button',{class:'ib ovx',onclick:close},ic('x',20)),el('h2',{},'الصوتيات'),el('div',{style:'display:flex;flex-direction:column;gap:8px;flex:1;min-height:0;max-width:480px;width:100%;margin:0 auto'},add,s,el('small',{style:'color:var(--mu)'},'الأحدث أولاً • الحد الأقصى 6 ميغابايت'),list));
  document.body.append(o);draw();
}

/* ====== الدردشة ====== */
const stickerCache=new Map();
function stickerData(sid){const c=localStorage.getItem('st_'+sid);if(c)return Promise.resolve(c);if(!stickerCache.has(sid))stickerCache.set(sid,get(R('stickers/'+sid)).then(s=>{const d=s.val()&&s.val().d||'';if(d){try{localStorage.setItem('st_'+sid,d)}catch(e){}}return d}).catch(()=>''));return stickerCache.get(sid)}
function applyBg(layer){const b=localStorage.getItem('bg')||'linear-gradient(160deg,#120804,#2a0f06)',dim=(+localStorage.getItem('bgdim')||0)/100,bl=+localStorage.getItem('bgblur')||0;
  layer.style.cssText=`background:${/^data:/.test(b)?`url(${b}) center/cover`:b};filter:blur(${bl}px);transform:scale(${bl?1.06:1})`;layer.replaceChildren(el('div',{style:`position:absolute;inset:0;background:rgba(0,0,0,${dim})`}))}
const jparse=s=>{try{return JSON.parse(s)}catch(e){return null}};
const TCOLS=['#ffffff','#111111','#ffe066','#ff5a4d','#ff7eb6','#c792ff','#7fb2ff','#5de0e6','#6ee787','#ffb04a','#b8ff3a','#ff9ad0'];
function richText(m){
  const t=m.text||'',names=Object.values(m.mn||{}).filter(x=>typeof x==='string');if(m.all)names.push('الكل');
  if(!names.length)return t;
  const re=new RegExp('(@(?:'+names.map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+'))','g');
  return t.split(re).map((s,i)=>i%2?el('span',{class:'mnt'},s):s);
}
function voiceEl(m){
  const blocked=m.vo==='m'&&me.gender!=='m'&&m.from!==uid;let a=null,playing=false;
  const b=el('button',{class:'vplay'},blocked?'فتح':ic('play',18)),bars=el('div',{class:'vbars'},...Array.from({length:18},(_,i)=>el('i',{style:`height:${6+((i*7)%14)}px`})));
  b.onclick=()=>{if(blocked)return toast('هذا الصوت فقط للذكور',true);if(!a){a=new Audio(m.au);a.onended=a.onpause=()=>{playing=false;b.replaceChildren(ic('play',18));bars.classList.remove('on')};a.onplay=()=>{playing=true;b.replaceChildren(ic('pause',18));bars.classList.add('on')}}playing?a.pause():a.play().catch(()=>{})};
  return el('div',{class:'voice'},b,bars,el('small',{},(m.dur||0)+'ث'),m.vo==='m'?ic('lock',13):null);
}
function mediaEl(m,gid){
  const isV=m.type==='video',btn=el('button',{class:'mplay'},ic(isV?'play':'music',20),el('div',{},el('b',{},(m.nm||(isV?'فيديو':'أغنية')).slice(0,28)),el('small',{},sz(m.sz||0)+(m.dur?' • '+Math.round(m.dur)+'ث':''))));
  const box=el('div',{class:'mbox'},btn);
  btn.onclick=async()=>{btn.disabled=true;btn.lastChild.lastChild.textContent='جارٍ التحميل…';
    try{const d=await getMedia(gid,m.mid),u=dataToBlobUrl(d);box.replaceChildren(isV?el('video',{src:u,controls:true,playsinline:true,style:'width:100%;max-height:260px;border-radius:12px',autoplay:true}):el('audio',{src:u,controls:true,autoplay:true,style:'width:100%'}))}
    catch(e){btn.disabled=false;btn.lastChild.lastChild.textContent='الملف غير متوفر';sfx('err')}};
  return box;
}

async function chat(gid){
  if(gid.startsWith('dm_'))await ensureDm(gid);
  const gm=groups[gid];if(!gm||!mem[gid]){go('');return}
  if(gm.maint&&gm.maint.s==='run'&&!isDev()){toast('الدردشة قيد الصيانة',true);go('');return}
  let admins={},bios={},locked=!!gm.locked,mine=mem[gid],replyTo=null,tcol=localStorage.getItem('tcol')||'',blurNext=false,royalNext=false,vipOn=false,war=null,gpm=false;
  const isStaff=()=>isDev()||!!admins[uid];
  const warLock=()=>!!war&&Date.now()>=war.st&&Date.now()<war.en&&!isDev();
  const canWrite=()=>!warLock()&&(isDev()?true:((gm.kind==='main'||gm.kind==='dm')&&(!locked||isStaff())));
  const bgl=el('div',{class:'mbg'}),box=el('div',{id:'msgs'}),mw=el('div',{class:'mw'},bgl,box);applyBg(bgl);
  const isDm=gm.kind==='dm',comp=el('div'),title=el('h1',{onclick:()=>isDm?viewProfile(dmOther(gid)):go('i/'+gid)},gm.name),wbox=el('div'),gbox=el('div'),hb=el('div',{style:'display:flex;gap:8px'});
  const drawHdr=()=>hb.replaceChildren(gm.kind==='shop'?ibtn('cart',()=>go('shop')):null,gm.kind==='main'?ibtn('game',()=>ex.gamesSheet(gid)):null,(isStaff())?ibtn('dots',staffMenu):null,ibtn('info',()=>isDm?viewProfile(dmOther(gid)):go('i/'+gid)));
  app$.replaceChildren(el('div',{class:'hdr'},ibtn('back',back),title,hb),wbox,gbox,mw,comp);drawHdr();
  ex.warBanner(gid,wbox,cleanup,w=>{war=w;drawComp()});
  ex.gameBoard(gid,gbox,cleanup);
  cleanup.push(onValue(R('gl/'+gid+'/cnt'),s=>localStorage.setItem('rd_'+gid,String(s.val()||0)),()=>{}));
  cleanup.push(onValue(R('groups/'+gid+'/maint'),s=>{const v=s.val();gm.maint=v;if(v&&v.s==='run'&&!isDev()){toast('بدأت صيانة الدردشة',true);go('')}},()=>{}));
  if(isDev())get(R('pvip/'+uid)).then(s=>{vipOn=s.val()===true}).catch(()=>{});
  get(R(`gamePerm/${gid}/${uid}`)).then(s=>{gpm=s.exists()}).catch(()=>{});
  const tick=setInterval(()=>{if(war){const was=comp.dataset.wl,now=warLock()?'1':'0';if(was!==now)drawComp()}},1000);cleanup.push(()=>clearInterval(tick));

  const els=new Map(),data=new Map(),pending=new Set(),revealed=new Set();let oldest=null,sendT=0;
  const near=()=>box.scrollHeight-box.scrollTop-box.clientHeight<140;
  const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){const id=e.target.dataset.id,m=data.get(id);if(m&&m.from!==uid&&m.type!=='sys'&&!(m.seen&&m.seen[uid])&&!document.hidden){pending.add(id);io.unobserve(e.target);clearTimeout(sendT);sendT=setTimeout(flush,1200)}}},{root:box,threshold:.6});
  async function flush(){if(!pending.size)return;const u={};for(const id of pending){u[`messages/${gid}/${id}/seen/${uid}`]=serverTimestamp()}pending.clear();try{await update(ref(db),u)}catch(e){}}
  cleanup.push(()=>{io.disconnect();flush()});
  const delMsg=async id=>{closeSheet();const m=data.get(id);try{if(m&&m.mid)await remove(R(`media/${gid}/${m.mid}`)).catch(()=>{});await remove(R(`messages/${gid}/${id}`))}catch(e){err(e)}};

  function bubble(id,m){
    if(m.type==='sys'){
      const D=m.d?jparse(m.d):null,wide=m.k==='rank'||m.k==='war'||(D&&(D.card||D.t==='cry'||D.t==='decl'));
      const c=ex&&ex.sysCard(m);
      if(wide)return el('div',{class:'sys wide','data-id':id},c||el('div',{},m.text));
      const nmx=el('div',{class:'nm'},'ALJESI',el('span',{class:'tag king',style:'background:#000;color:var(--or2);border:1px solid var(--or)'},'النظام'));
      return el('div',{class:'msg ot','data-id':id},botAv('s'),el('div',{class:'bub botb'},nmx,c||el('div',{class:'tx'},m.text),el('div',{class:'ft'},hhmm(m.ts))))}
    const own=m.from===uid,c=hexOk(m.color)?m.color:'#5b5be0',mentioned=(m.mn&&m.mn[uid])||(m.all&&m.from!==uid);
    const bub=el('div',{class:'bub'+(m.vip?' vipb':'')+(m.emp?' royalb':'')+(mentioned?' mnme':''),style:(m.emp?'':m.vip?`--bc:${c}`:`background:linear-gradient(135deg,${c},${dark(c)})`)+';'+(m.tcol&&hexOk(m.tcol)?`color:${m.tcol}`:'')});
    if(!own){const nm=el('div',{class:'nm'});prof(m.from).then(p=>{nm.prepend(p.name||'عضو');nm.append(ageTag(p))});roleOf(m.from).then(r=>{const t=r==='dev'?null:rankTag(r,!!admins[m.from]);if(t)nm.append(t)});if(m.vis)nm.append(el('span',{class:'tag'},'زائر'));bub.append(nm);
      const b=bios[m.from];if(b&&b.t)bub.append(el('div',{class:'bio',style:b.c?`color:${b.c}`:''},b.t))}
    if(m.rp)bub.append(el('div',{class:'rq',onclick:e=>{e.stopPropagation();jumpTo(m.rp.i)}},el('b',{},m.rp.n||''),el('span',{},m.rp.t||'')));
    let content=null;
    if(m.type==='text')content=el('div',{class:'tx'},richText(m));
    else if(m.type==='image')content=el('div',{class:'imw'},el('img',{class:'im',src:m.img,onclick:()=>zoom(m.img)}),el('button',{class:'dl',onclick:()=>saveImage(m.img)},ic('download',15),'تحميل'));
    else if(m.type==='audio')content=voiceEl(m);
    else if(m.type==='music'||m.type==='video')content=mediaEl(m,gid);
    else if(m.type==='sticker'){const im=el('img',{class:'st'});stickerData(m.sid).then(d=>{if(d)im.src=d});content=im}
    if(m.blur&&!revealed.has(id)){const w=el('div',{class:'blurw',onclick:e=>{e.stopPropagation();revealed.add(id);w.replaceWith(content)}},el('div',{class:'blurc'},content),el('div',{class:'blurt'},ic('blur',18),' مغبشة • اضغط للعرض'));bub.append(w)}else bub.append(content);
    if(m.ok)bub.append(el('div',{class:'okb'},ic('check',13),' اجابة صحيحة '+m.ok));
    const sc=Object.keys(m.seen||{}).filter(x=>x!==m.from).length;
    bub.append(el('div',{class:'ft'},m.edited?'تم التعديل':null,hhmm(m.ts),own&&sc?el('span',{class:'seenc',style:'display:inline-flex;align-items:center;gap:2px'},ic('eye',12),String(sc)):null));
    const w=el('div',{class:'msg '+(own?'me':'ot'),'data-id':id},own?null:avatarP(m.from,'s'),bub);
    // ضغط مطول لقائمة الرسالة + سهم رد صغير
    let t0=0,x0=0,y0=0;
    bub.addEventListener('pointerdown',e=>{x0=e.clientX;y0=e.clientY;t0=setTimeout(()=>{m.type==='sticker'?stickerInfo(m,own,(own||isStaff())?()=>delMsg(id):null):msgMenu(id)},450)});
    bub.addEventListener('pointermove',e=>{if(Math.abs(e.clientX-x0)>10||Math.abs(e.clientY-y0)>10)clearTimeout(t0)});
    ['pointerup','pointercancel','pointerleave'].forEach(x=>bub.addEventListener(x,()=>clearTimeout(t0)));
    bub.addEventListener('contextmenu',e=>e.preventDefault());
    w.append(el('button',{class:'rpb',onclick:e=>{e.stopPropagation();setReply(id)}},ic('reply',15)));
    return w;
  }
  function put(id,m){
    const o0=data.get(id);
    if(o0&&els.get(id)){const a=Object.assign({},o0),b=Object.assign({},m);delete a.seen;delete b.seen;
      if(JSON.stringify(a)===JSON.stringify(b)){data.set(id,m);const ft=els.get(id).querySelector('.ft .seenc');const sc=Object.keys(m.seen||{}).filter(x=>x!==m.from).length;if(ft)ft.lastChild&&(ft.lastChild.textContent=String(sc));return}}
    data.set(id,m);const was=near(),n=bubble(id,m),old=els.get(id);
    if(old){io.unobserve(old);old.replaceWith(n)}else box.append(n);
    els.set(id,n);io.observe(n);if(was||m.from===uid)box.scrollTop=box.scrollHeight;
    if(m.w===uid&&m.a&&!localStorage.getItem('rw_'+id)&&nowS()-(m.ts||0)<240000){localStorage.setItem('rw_'+id,'1');ex.claimReward(Math.min(100,m.a))}
  }
  function setReply(id){const m=data.get(id);if(!m||m.type==='sys')return;
    prof(m.from).then(p=>{const t=m.type==='text'?m.text:m.type==='image'?'صورة':m.type==='audio'?'رسالة صوتية':m.type==='sticker'?'ملصق':m.type==='music'?'أغنية':'فيديو';
      replyTo={i:id,n:(p.name||'عضو').slice(0,20),t:String(t).slice(0,60)};drawComp();setTimeout(()=>{const ta=comp.querySelector('textarea');ta&&ta.focus()},50)})}
  function msgMenu(id){
    const m=data.get(id);if(!m||m.type==='sys')return;const own=m.from===uid;
    const B=(i,t,f,c='g')=>el('button',{class:'btn '+c+' mrow',onclick:f},ic(i,20),el('span',{},t));
    openSheet(el('h3',{},'الرسالة'),B('eye','من شاهد الرسالة',()=>seenInfo(id)),
      B('reply','رد',()=>{closeSheet();setReply(id)}),
      m.type==='text'?B('copy','نسخ',()=>{copy(m.text);closeSheet()}):null,
      own&&m.type==='text'?B('edit','تعديل',()=>editMsg(id)):null,
      (own||isStaff())?B('trash','حذف',()=>delMsg(id),'r'):null);
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
  async function loadOlder(){
    if(!oldest)return false;
    const s=await get(query(R('messages/'+gid),orderByKey(),endBefore(oldest),limitToLast(30)));const arr=[];s.forEach(c=>{arr.push([c.key,c.val()])});
    if(!arr.length){more.remove();return false}
    const h0=box.scrollHeight;for(const[k,v]of arr.reverse()){if(k<oldest)oldest=k;data.set(k,v);const n=bubble(k,v);els.set(k,n);more.after(n)}
    const keys=[...els.keys()].sort();for(const k of keys)box.append(els.get(k));box.prepend(more);box.scrollTop=box.scrollHeight-h0;return true;
  }
  const more=el('button',{class:'btn g',style:'align-self:center;padding:6px 14px;font-size:13px',onclick:async()=>{try{await loadOlder()}catch(e){err(e)}}},'تحميل رسائل أقدم');
  box.prepend(more);
  async function jumpTo(id){
    try{for(let i=0;i<30&&!els.has(id);i++){if(!(await loadOlder()))break}}catch(e){}
    const n=els.get(id);if(!n)return toast('تعذر الوصول إلى الرسالة (قد تكون محذوفة)',true);
    n.scrollIntoView({block:'center'});n.classList.add('flash');setTimeout(()=>n.classList.remove('flash'),1800);
  }
  cleanup.push(onValue(R('groupAdmins/'+gid),s=>{admins=s.val()||{};drawHdr();drawComp()}));
  cleanup.push(onValue(R('groups/'+gid+'/locked'),s=>{locked=s.val()===true;drawComp()}));
  cleanup.push(onValue(R('groupBios/'+gid),s=>{bios=s.val()||{}},()=>{}));
  if(gm.kind==='main'&&mine===true){
    get(R(`welcomed/${gid}/${uid}`)).then(async s=>{if(s.exists())return;const k=push(R('messages/'+gid)).key;
      try{await update(ref(db),{[`welcomed/${gid}/${uid}`]:true,[`messages/${gid}/${k}`]:{from:uid,type:'sys',k:'welcome',text:`🔥 انضم ${me.name} إلى النقابة، رحّبوا به! حصل على 100 رصيد كعضو جديد.`,ts:serverTimestamp()}})}catch(e){}}).catch(()=>{});
  }

  /* ---- قائمة الإشراف (ثلاث نقاط) ---- */
  function staffMenu(){
    openSheet(el('h3',{},'خيارات الإشراف'),
      el('button',{class:'btn g mrow',onclick:()=>{closeSheet();searchSheet()}},ic('search',20),el('span',{},'بحث')),
      el('button',{class:'btn r mrow',onclick:()=>{closeSheet();confirmMaint()}},ic('trash',20),el('span',{},'حذف الوسائط')));
  }
  async function searchSheet(){
    const inp=el('input',{placeholder:'اكتب كلمة للبحث في الرسائل'}),res=el('div',{class:'srl'});let all=null;
    openSheet(el('h3',{},'بحث'),inp,res,el('button',{class:'btn g',onclick:closeSheet},'إغلاق'));
    const draw=async()=>{
      const k=normAr(inp.value);res.replaceChildren();if(!k)return;
      if(!all){res.append(el('div',{class:'empty'},'جارٍ التحميل…'));try{const s=await get(query(R('messages/'+gid),limitToLast(800)));all=[];s.forEach(c=>{all.push([c.key,c.val()])})}catch(e){return err(e)}res.replaceChildren()}
      const hits=all.filter(([,m])=>m.type==='text'&&normAr(m.text).includes(k)).reverse().slice(0,40);
      if(!hits.length)return res.append(el('div',{class:'empty'},'لا توجد نتائج'));
      for(const[id,m]of hits){const nm=el('b',{},'…');prof(m.from).then(p=>nm.textContent=p.name||'عضو');
        res.append(el('div',{class:'srr',onclick:()=>{closeSheet();jumpTo(id)}},el('div',{style:'display:flex;justify-content:space-between'},nm,el('small',{},hhmm(m.ts))),el('div',{class:'srt'},m.text.slice(0,120))))}
    };
    let tm=0;inp.oninput=()=>{clearTimeout(tm);tm=setTimeout(draw,250)};
  }
  function confirmMaint(){
    openSheet(el('h3',{},'حذف الوسائط'),el('p',{style:'text-align:center;line-height:1.9'},'سيخرج الجميع من الدردشة وتُحذف كل الصور والملصقات والأغاني والفيديوهات والتسجيلات الصوتية. هل أنت متأكد؟'),
      el('div',{style:'display:flex;gap:10px'},el('button',{class:'btn r',style:'flex:1',onclick:()=>{closeSheet();runMaint()}},'نعم، احذف'),el('button',{class:'btn g',style:'flex:1',onclick:closeSheet},'لا')));
  }
  async function runMaint(){
    try{await update(R('groups/'+gid),{maint:{s:'run',by:uid,ts:Date.now()}});gm.maint={s:'run'};toast('بدأ حذف الوسائط… لا تغلق التطبيق',false,true);
      const all=(await get(R('messages/'+gid))).val()||{},ids=Object.keys(all).filter(k=>{const m=all[k];return['image','sticker','audio','music','video'].includes(m.type)&&(isDev()||!(m.from===EMP))});
      for(let i=0;i<ids.length;i+=60){const up={};ids.slice(i,i+60).forEach(k=>up[`messages/${gid}/${k}`]=null);try{await update(ref(db),up)}catch(e){}await sl(400)}
      try{await remove(R('media/'+gid))}catch(e){}
      await update(R('groups/'+gid),{maint:{s:'done',by:uid,ts:Date.now()}});gm.maint={s:'done'};toast('انتهى حذف الوسائط',false,true);go('');
    }catch(e){err(e);try{await remove(R('groups/'+gid+'/maint'))}catch(x){}}
  }

  /* ---- شريط الكتابة ---- */
  async function sendMedia(kind,f){
    try{
      if(kind==='image'){const d=await fit(f,[900,720,560,420,320],55000,false);return await ex.sendRaw(gid,gm,{type:'image',img:d},1)}
      const isV=kind==='video';if(f.size>MB6)return toast(isV?'حجم الفيديو أكبر من 6 ميغابايت':'حجم الأغنية أكبر من 6 ميغابايت',true);
      let dur=0;
      if(isV){const u=URL.createObjectURL(f);dur=await new Promise(r=>{const v=document.createElement('video');v.preload='metadata';v.onloadedmetadata=()=>{r(v.duration||0);URL.revokeObjectURL(u)};v.onerror=()=>r(0);v.src=u});if(dur>VMAX)return toast('الفيديو لا يتجاوز دقيقة ونصف',true)}
      const bar=el('div',{class:'ovi'},'جارٍ الرفع 0%');openSheet(el('h3',{},'رفع الملف'),bar);
      const d=await readURL(f),r=await putMedia(gid,d,p=>{bar.textContent='جارٍ الرفع '+Math.round(p*100)+'%'});
      closeSheet();await ex.sendRaw(gid,gm,{type:kind,mid:r.mid,nc:r.nc,sz:f.size,nm:f.name.slice(0,40),...(dur?{dur:Math.round(dur)}:{})},1);
    }catch(e){closeSheet();err(e)}
  }
  async function pickGallery(){
    if(!(await askPerm('media')))return;const f=await pickFile('image/*,video/*');if(!f)return;
    sendMedia(f.type.startsWith('video')?'video':'image',f);
  }
  function colorSheet(){
    openSheet(el('h3',{},'لون الرسالة'),el('div',{class:'cols'},...TCOLS.map(c=>el('div',{class:'cc'+(c===tcol?' on':''),style:'background:'+c+';border-color:'+(c===tcol?'var(--or)':'#fff4'),onclick:()=>{tcol=c;localStorage.setItem('tcol',c);closeSheet();toast('تم اختيار اللون',false,true)}}))),
      el('button',{class:'btn g',onclick:()=>{tcol='';localStorage.removeItem('tcol');closeSheet()}},'اللون الافتراضي'));
  }
  function plusMenu(){
    const O=(i,t,f)=>el('button',{class:'opt',onclick:()=>{closeSheet();f()}},ic(i,28),el('span',{},t));
    openSheet(el('h3',{},'إرسال'),el('div',{class:'optg'},O('palette','لون',colorSheet),O('blur','مغبشة',()=>{blurNext=true;toast('الرسالة القادمة ستكون مغبشة',false,true);drawComp()}),O('image','ارسال صورة',pickGallery),...(isEmp()?[O('crown','ملكية',()=>{royalNext=true;toast('الرسالة القادمة ملكية',false,true);drawComp()})]:[]),O('swap','تحويل',()=>transferSheet(gid,gm)),O('music','صوتيات',()=>musicPicker(gid,gm,sendMedia))));
  }
  const pendMn=new Map();let pendAll=false;
  function mentionFill(ta){mentionSheet(gid,isStaff(),(u,name)=>{if(u===null)pendAll=true;else pendMn.set(name,u);ta.value+=(ta.value&&!/\s$/.test(ta.value)?' ':'')+'@'+name+' ';ta.focus()})}
  // التسجيل الصوتي
  let rec=null,rst=null,rch=[],rT0=0,rAcc=0,rPaused=false,ractx=null,ran=null,raf=0,rtm=0;
  const elapsed=()=>rAcc+(rPaused?0:Date.now()-rT0);
  const stopRecRes=()=>{cancelAnimationFrame(raf);clearInterval(rtm);try{rst&&rst.getTracks().forEach(t=>t.stop())}catch(e){}try{ractx&&ractx.close()}catch(e){}rec=rst=ractx=ran=null};
  async function startRec(){
    if(!(await askPerm('mic')))return;
    try{rst=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){localStorage.removeItem('perm_mic');return toast('تعذر تشغيل المايك، فعّل إذن الميكروفون',true)}
    const mime=window.MediaRecorder&&MediaRecorder.isTypeSupported('audio/webm;codecs=opus')?'audio/webm;codecs=opus':'';
    rec=new MediaRecorder(rst,{...(mime?{mimeType:mime}:{}),audioBitsPerSecond:16000});rch=[];rec.ondataavailable=e=>{if(e.data&&e.data.size)rch.push(e.data)};
    rec.start(250);rT0=Date.now();rAcc=0;rPaused=false;
    try{const AC=window.AudioContext||window.webkitAudioContext;ractx=new AC();const s=ractx.createMediaStreamSource(rst);ran=ractx.createAnalyser();ran.fftSize=64;s.connect(ran)}catch(e){ran=null}
    drawRec();
  }
  function drawRec(){
    const bars=Array.from({length:22},()=>el('i')),tm=el('b',{class:'rtm'},'0:00'),canP=!!(rec&&rec.pause);
    const pbtn=el('button',{class:'rb',onclick:()=>{if(rPaused){rec.resume();rT0=Date.now();rPaused=false;pbtn.replaceChildren(ic('pause',22))}else{rec.pause();rAcc+=Date.now()-rT0;rPaused=true;pbtn.replaceChildren(ic('play',22))}pnl.classList.toggle('paused',rPaused)}},ic('pause',22));
    const pnl=el('div',{class:'recp'},el('div',{class:'rmic'},ic('mic',30)),el('div',{class:'rbars'},...bars),tm,
      el('div',{class:'rbtn'},el('button',{class:'rb x',onclick:cancelRec},ic('x',22)),canP?pbtn:null,el('button',{class:'rb s',onclick:finishRec},ic('send',22))));
    comp.replaceChildren(pnl);
    const buf=ran?new Uint8Array(ran.frequencyBinCount):null,loop=()=>{if(!rec)return;
      if(ran&&!rPaused){ran.getByteFrequencyData(buf);bars.forEach((b,i)=>{b.style.height=(4+buf[(i*1)%buf.length]/255*34)+'px'})}else if(!rPaused)bars.forEach(b=>{b.style.height=(4+Math.random()*26)+'px'});
      raf=requestAnimationFrame(loop)};loop();
    rtm=setInterval(()=>{const s=Math.floor(elapsed()/1000);tm.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');if(s>=20)finishRec()},300);
  }
  function cancelRec(){try{rec&&rec.state!=='inactive'&&rec.stop()}catch(e){}stopRecRes();drawComp()}
  async function finishRec(){
    if(!rec)return;const dur=Math.max(1,Math.round(elapsed()/1000)),r0=rec;clearInterval(rtm);
    await new Promise(r=>{r0.onstop=()=>r();if(r0.state!=='inactive')r0.stop();else r()});
    const blob=new Blob(rch,{type:r0.mimeType||'audio/webm'});stopRecRes();drawComp();
    const d=await readURL(blob);if(d.length>140000)return toast('التسجيل طويل جداً',true);
    openSheet(el('h3',{style:'text-align:center'},'هل تريد أن تجعل الصوت مخصص للذكور فقط؟'),el('div',{style:'display:flex;gap:10px'},
      el('button',{class:'btn',style:'flex:1',onclick:()=>sendVoice(d,dur,true)},'نعم'),el('button',{class:'btn g',style:'flex:1',onclick:()=>sendVoice(d,dur,false)},'لا')));
  }
  async function sendVoice(d,dur,maleOnly){
    closeSheet();const fx=el('div',{class:'sendfx'},el('i'),el('i'),el('i'),ic('mic',34));document.body.append(fx);setTimeout(()=>fx.remove(),1100);
    try{await ex.sendRaw(gid,gm,{type:'audio',au:d,dur,...(maleOnly?{vo:'m'}:{})},0)}catch(e){err(e)}
  }
  function drawComp(){
    comp.dataset.wl=warLock()?'1':'0';
    if(gm.kind==='shop'&&!isEmp()){comp.replaceChildren(el('div',{class:'shopbar'},el('button',{class:'btn glowbtn shopbtn',onclick:()=>go('shop')},ic('cart',22),' شراء')));return}
    if(!canWrite()){comp.replaceChildren(el('div',{class:'lockbar'},warLock()?'الشات مقفل أثناء المعركة':gm.kind==='main'?el('span',{style:'display:inline-flex;gap:6px;align-items:center'},'الشات مقفل من المشرفين',ic('lock',16)):'للقراءة فقط'));return}
    if(rec)return;
    const ta=el('textarea',{rows:'1',placeholder:blurNext?'رسالة مغبشة…':'اكتب رسالة…',maxlength:'2000'});
    ta.addEventListener('input',()=>{ta.style.height='auto';ta.style.height=Math.min(110,ta.scrollHeight)+'px'});
    const sendTxt=async()=>{const t=ta.value.trim();if(!t)return;if(!spamCheck('text'))return;
      const o={};if(replyTo)o.rp=replyTo;if(tcol)o.tcol=tcol;if(blurNext)o.blur=true;if(royalNext)o.emp=true;if(vipOn)o.vip=true;
      const mn={};for(const[n,u]of pendMn)if(t.includes('@'+n))mn[u]=n;if(Object.keys(mn).length)o.mn=mn;if(pendAll&&t.includes('@الكل')&&isStaff())o.all=true;
      ta.value='';ta.style.height='auto';replyTo=null;blurNext=false;royalNext=false;pendMn.clear();pendAll=false;drawComp();
      try{await ex.send(gid,gm,t,o)}catch(e){err(e);ta.value=t}};
    const stk=el('button',{class:'ib stb',onclick:()=>stickerPanel(async sid=>{if(!spamCheck('sticker'))return;try{await ex.sendRaw(gid,gm,{type:'sticker',sid},0)}catch(e){err(e)}})},el('span',{style:'font-size:20px;line-height:1'},'🙂'),el('em',{},'ملصقات'));
    const mic=me.gender==='m'?el('button',{class:'ib micb',onclick:startRec},ic('mic',22,'var(--or)')):null;
    const acts=el('div',{class:'acts'},el('button',{class:'ib',onclick:plusMenu},ic('plus',22)),stk,el('button',{class:'ib',onclick:()=>mentionFill(ta)},ic('at',21)),mic);
    const top=[];
    if(replyTo)top.push(el('div',{class:'rchip'},ic('reply',16),el('div',{class:'t'},el('b',{},replyTo.n),el('span',{},replyTo.t)),el('button',{class:'ib',style:'width:26px;height:26px',onclick:()=>{replyTo=null;drawComp()}},ic('x',14))));
    if(blurNext)top.push(el('div',{class:'rchip'},ic('blur',16),el('div',{class:'t'},'الرسالة القادمة ستكون مغبشة'),el('button',{class:'ib',style:'width:26px;height:26px',onclick:()=>{blurNext=false;drawComp()}},ic('x',14))));
    comp.replaceChildren(...top,el('div',{class:'cmp'},acts,ta,el('button',{class:'send',onclick:sendTxt},ic('send',20))));
  }
  drawComp();
}

/* ====================== كلمة السر ====================== */
const genPw=()=>{const A='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';let s='';for(const b of crypto.getRandomValues(new Uint8Array(12)))s+=A[b%A.length];return s};
const pwEmail=()=>'u'+uid.toLowerCase()+'@fir.app';
let pwShown=false;
async function ensurePw(){
  const u=auth.currentUser;if(!u||pwShown)return;
  let has=null;try{has=(await get(R('pwd/'+uid))).val()}catch(e){}
  if(has)return;pwShown=true;
  const pw=genPw(),hasProv=(u.providerData||[]).some(p=>p.providerId==='password'),busyB=el('button',{class:'btn glowbtn'},'حفظت كلمة السر');let linked=false;
  const{o,close}=overlayBox('',el('div',{class:'pvt'},ic('lock',54),el('h3',{},'كلمة السر الخاصة بك'),
    el('p',{style:'line-height:1.9;max-width:320px'},'احفظها جيداً، ستحتاجها لتسجيل الدخول إذا غيّرت هاتفك أو حذفت التطبيق. تجدها دائماً في الإعدادات.'),
    el('div',{class:'code',style:'font-size:22px;letter-spacing:2px'},pw),el('button',{class:'btn g',onclick:()=>copy(pw)},'نسخ'),busyB));
  const msg=(e,step)=>{const c=String((e&&(e.code||e.message))||'');
    if(/operation-not-allowed/.test(c))return'فعّل Email/Password من Firebase ← Authentication';
    if(/recent/.test(c))return'أغلق التطبيق وافتحه من جديد ثم حاول';
    if(/PERMISSION/i.test(c))return'انسخ ملف database.rules.json الجديد إلى Firebase ← Rules ثم Publish';
    if(/network/i.test(c))return'لا يوجد اتصال بالإنترنت';
    return'تعذر '+step+' ('+c.slice(0,40)+')'};
  busyB.onclick=async()=>{busyB.disabled=true;
    if(!linked){try{
      if(hasProv)await updatePassword(u,pw);
      else{try{await linkWithCredential(u,EmailAuthProvider.credential(pwEmail(),pw))}catch(e){if(/email-already-in-use|provider-already-linked|credential-already/.test(String(e&&e.code)))await updatePassword(u,pw);else throw e}}
      linked=true}catch(e){busyB.disabled=false;toast(msg(e,'تعيين كلمة السر'),true);return}}
    try{await update(ref(db),{['passmap/'+await sha(pw)]:{e:(auth.currentUser.email||pwEmail()),u:uid},['pwd/'+uid]:pw});close();toast('تم حفظ كلمة السر',false,true)}
    catch(e){busyB.disabled=false;toast(msg(e,'حفظ كلمة السر'),true)}};
}
function pwSection(){
  const show=el('div',{class:'code',style:'font-size:18px;letter-spacing:1px'},'••••••••••••'),inp=el('input',{placeholder:'كلمة سر جديدة (10 أحرف على الأقل)',type:'text'});let cur='';
  get(R('pwd/'+uid)).then(s=>{cur=s.val()||'';if(!cur)show.textContent='غير محددة بعد'}).catch(()=>{});
  return el('div',{class:'sec'},el('h4',{},'كلمة السر'),show,
    el('div',{style:'display:flex;gap:8px;margin-top:8px'},el('button',{class:'btn g',style:'flex:1',onclick:()=>{if(!cur)return toast('لا توجد كلمة سر بعد، أعد فتح التطبيق',true);show.textContent=show.textContent.includes('•')?cur:'••••••••••••'}},'إظهار'),el('button',{class:'btn g',style:'flex:1',onclick:()=>cur&&copy(cur)},'نسخ')),
    inp,el('button',{class:'btn',style:'margin-top:8px',onclick:async()=>{
      const n=inp.value.trim();if(n.length<10||!/[A-Za-z]/.test(n)||!/[0-9]/.test(n))return toast('10 أحرف على الأقل وتحتوي حروفاً وأرقاماً',true);
      if(auth.currentUser.isAnonymous)return toast('أكمل حفظ كلمة السر أولاً',true);
      try{const h=await sha(n);if((await get(R('passmap/'+h))).exists())return toast('كلمة السر مستخدمة، اختر غيرها',true);
        await updatePassword(auth.currentUser,n);const up={['passmap/'+h]:{e:pwEmail(),u:uid},['pwd/'+uid]:n};if(cur)up['passmap/'+await sha(cur)]=null;await update(ref(db),up);cur=n;inp.value='';toast('تم تغيير كلمة السر',false,true)}
      catch(e){toast(/recent/.test(String(e&&e.code))?'سجّل الدخول من جديد ثم غيّرها':'تعذر تغيير كلمة السر',true)}}},'تغيير كلمة السر'));
}
/* ====================== الحماية من السبام ====================== */
const sendLog=[];let stkRun=0;
function warnCard(t){
  overlayBox('',el('div',{class:'pvt'},el('div',{class:'pvl',style:'color:#ffb04a'},ic('info',60)),el('h3',{},'تحذير'),el('p',{style:'line-height:1.9;max-width:300px'},t),el('button',{class:'btn',onclick:e=>e.target.closest('.ov').remove()},'فهمت')));
  sfx('err');notifTo(uid,{t:'warn',m:t.slice(0,100)});
}
function spamCheck(kind){ // true = مسموح
  const n=Date.now();
  if(kind==='sticker'){stkRun++;if(stkRun>=4){stkRun=0;warnCard('أرسلت ملصقات متتالية كثيرة. أرجوك لا تكرر هذا الشيء.');return false}}else stkRun=0;
  sendLog.push(n);while(sendLog.length&&n-sendLog[0]>10000)sendLog.shift();
  if(sendLog.length>7){sendLog.length=0;warnCard('أنت تقوم بإرسال رسائل متتالية (سبام). أرجوك لا تكرر هذا الشيء.');return false}
  return true;
}
/* ====================== المحادثات الخاصة والأقسام ====================== */
const dmId=(a,b)=>['dm',...[a,b].sort()].join('_');
const dmOther=g=>g.split('_').slice(1).find(x=>x!==uid)||'';
async function ensureDm(g){if(groups[g])return true;const o=dmOther(g);if(!o)return false;const p=await prof(o);groups[g]={name:p.name||'صديق',kind:'dm'};mem[g]=true;return true}
const infSvg=(w=46)=>{const d=el('span',{class:'inf'});d.innerHTML=`<svg viewBox="0 0 120 60" width="${w}" height="${w/2}"><defs><linearGradient id="ig${w}" x1="0" x2="1"><stop offset="0" stop-color="#ff3b3b"/><stop offset=".25" stop-color="#ffb800"/><stop offset=".5" stop-color="#37e06a"/><stop offset=".75" stop-color="#2aa8ff"/><stop offset="1" stop-color="#c05bff"/><animateTransform attributeName="gradientTransform" type="translate" from="-1 0" to="1 0" dur="3s" repeatCount="indefinite"/></linearGradient></defs><path d="M60 30C48 10 14 6 14 30s34 20 46 0 46-20 46 0-34 24-46 0z" fill="none" stroke="url(#ig${w})" stroke-width="9" stroke-linecap="round"/></svg>`;return d};

async function devLocks(){
  if(!isDev()){go('');return}
  const list=el('div',{class:'list'});app$.replaceChildren(el('div',{class:'hdr'},ibtn('back',back),el('h1',{},'قيود الأجهزة')),el('small',{style:'padding:8px 14px;color:var(--mu);line-height:1.7'},'أشخاص ظهرت لهم رسالة «هذا الجهاز مسجّل بحساب آخر». اضغط «فك القيد» ليتمكنوا من إنشاء حساب.'),list);
  let d={};try{d=(await get(R('dups'))).val()||{}}catch(e){return err(e)}
  const ks=Object.keys(d).sort((a,b)=>(d[b].ts||0)-(d[a].ts||0));
  if(!ks.length)return list.append(el('div',{class:'empty'},'لا توجد محاولات'));
  for(const k of ks){const x=d[k],old=el('small',{},'…');prof(x.o).then(p=>{old.textContent='الحساب القديم على الجهاز: '+(p.name||'عضو')+' • '+hhmm(x.ts)});
    const row=el('div',{class:'row'},ic('lock',22,'var(--or2)'),el('div',{class:'t'},el('b',{},'حاول التسجيل باسم: '+(x.n||'—')),old),
      el('button',{class:'btn',style:'padding:8px 12px;font-size:13px',onclick:async()=>{try{await update(ref(db),{['devices/'+k]:null,['dups/'+k]:null});row.remove();toast('تم فك القيد، يمكنه التسجيل الآن',false,true)}catch(e){err(e)}}},'فك القيد'));
    list.append(row)}
}
/* ====== معلومات القروب ====== */
async function info(gid){
  const gm=groups[gid];if(!gm){go('');return}
  const staffNow=()=>isDev()||admins[uid];let admins={};
  const body=el('div',{class:'list'});
  app$.replaceChildren(el('div',{class:'hdr'},el('button',{class:'ib',onclick:back},'→'),el('h1',{},'معلومات القروب')),body);
  const[gv,adm0,ms0,bios0]=await Promise.all([get(R('groups/'+gid)).then(s=>s.val()||gm).catch(()=>gm),get(R('groupAdmins/'+gid)).then(s=>s.val()||{}).catch(()=>({})),get(R('members/'+gid)).then(s=>s.val()||{}).catch(()=>null),get(R('groupBios/'+gid)).then(s=>s.val()||{}).catch(()=>({}))]);Object.assign(gm,gv);admins=adm0;
  const staff=isDev()||!!admins[uid];
  const ph=el('div',{class:'av l'},(gm.name||'?')[0]);
  get(R('groupPhotos/'+gid)).then(s=>{if(s.val()){ph.style.backgroundImage=`url(${s.val()})`;ph.textContent=''}}).catch(()=>{});
  if(staff)ph.onclick=async()=>{const f=await pickFile();if(!f)return;try{const d=await fit(f,[200,160,120],29000,true);await set(R('groupPhotos/'+gid),d);ph.style.backgroundImage=`url(${d})`;ph.textContent=''}catch(e){err(e)}};
  const nameEl=el('h2',{style:'margin:8px 0 2px'},gm.name),descEl=el('p',{},gm.desc||'لا يوجد وصف');
  body.append(el('div',{class:'sec',style:'text-align:center'},el('div',{style:'display:flex;justify-content:center'},ph),nameEl,el('span',{class:'tag'},KN[gm.kind]||''),
    staff?el('div',{style:'color:var(--mu);font-size:12px;margin-top:6px'},'اضغط الصورة لتغييرها'):null));
  const dsec=el('div',{class:'sec'},el('h4',{},'وصف القروب'),descEl);
  if(staff){dsec.append(el('button',{class:'btn g',style:'margin-top:8px',onclick:()=>{
    const ta=el('textarea',{value:gm.desc||'',rows:'9',maxlength:'2000'}),nm=el('input',{value:gm.name,maxlength:'40'});
    openSheet(el('h3',{},'تعديل'),nm,ta,el('button',{class:'btn',onclick:async()=>{try{await update(R('groups/'+gid),{desc:ta.value.trim(),name:nm.value.trim()||gm.name});gm.desc=ta.value.trim();gm.name=nm.value.trim()||gm.name;descEl.textContent=gm.desc||'لا يوجد وصف';nameEl.textContent=gm.name;closeSheet()}catch(e){err(e)}}},'حفظ'))}},'✏️ تعديل الاسم والوصف'))}
  body.append(dsec);
  ex.guildPanel(gid,gm,body);
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
  let ms=ms0;if(!ms){mlist.append(el('p',{},'تعذّر تحميل الأعضاء'));return}
  const ids=Object.keys(ms);msec.firstChild.textContent='الأعضاء ('+ids.length+')';
  const bios=bios0;
  for(const u of ids){
    const nm=el('b',{},'…'),sub=el('small',{}),row=el('div',{class:'row'},avatarP(u,''),el('div',{class:'t'},nm,sub));
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


/* ====================== المعرف والملف التعريفي والمؤثرات والأصدقاء والجرس ====================== */
const rid9=()=>String(Math.floor(Math.random()*9e8)+1e8);
let myPid='';
async function ensurePid(){
  try{const s=await get(R('pdata/'+uid+'/pid'));if(s.exists()){myPid=s.val();return}
    for(let i=0;i<8;i++){const p=rid9();if((await get(R('pids/'+p))).exists())continue;
      await update(ref(db),{['pdata/'+uid+'/pid']:p,['pids/'+p]:uid});myPid=p;return}}catch(e){}
}
const avatarP=(u,cls='s')=>{const a=avatar(u,cls);a.style.cursor='pointer';a.addEventListener('click',e=>{e.stopPropagation();viewProfile(u)});return a};
const BAR=(...k)=>el('div',{class:'ovh'},...k);
function overlayBox(title,...k){const o=el('div',{class:'ov'}),close=()=>o.remove();o.append(el('button',{class:'ib ovx',onclick:close},ic('x',20)));if(title)o.append(el('h2',{},title));o.append(...k);document.body.append(o);return{o,close}}

/* ---------- المؤثرات ---------- */
const FXL=[
 {id:'f1',n:'الورود المنتثرة',g:'f',a:'zmrd'},{id:'f2',n:'قلوب متوهجة',g:'f',a:'zmrd'},{id:'f3',n:'فراشات الفجر',g:'f',a:'zmrd'},{id:'f4',n:'نجوم وردية',g:'f',a:'zmrd'},{id:'f5',n:'لؤلؤ وتلألؤ',g:'f',a:'zmrd'},
 {id:'m1',n:'جماجم الظلام',g:'m',a:'milo'},{id:'m2',n:'التاج الملكي',g:'m',a:'milo'},{id:'m3',n:'صاعقة سوداء',g:'m',a:'milo'},{id:'m4',n:'جمر وشرر',g:'m',a:'milo'},{id:'m5',n:'هالة القوة',g:'m',a:'milo'}];
const FXE={id:'emp',n:'عين الإمبراطور',g:'e',a:'jesi'};
const SH={
 petal(c,s,col){c.fillStyle=col;c.beginPath();c.ellipse(0,0,s*.55,s,0,0,7);c.fill();c.fillStyle='rgba(255,255,255,.25)';c.beginPath();c.ellipse(-s*.1,-s*.2,s*.18,s*.5,0,0,7);c.fill()},
 heart(c,s,col){c.fillStyle=col;c.beginPath();c.moveTo(0,s*.35);c.bezierCurveTo(-s,-s*.3,-s*.5,-s,0,-s*.4);c.bezierCurveTo(s*.5,-s,s,-s*.3,0,s*.35);c.fill()},
 butterfly(c,s,col,t){const f=Math.abs(Math.sin(t*9));c.fillStyle=col;for(const k of[-1,1]){c.save();c.scale(k*(.35+.65*f),1);c.beginPath();c.ellipse(s*.6,-s*.3,s*.6,s*.45,-.5,0,7);c.fill();c.beginPath();c.ellipse(s*.5,s*.35,s*.4,s*.3,.5,0,7);c.fill();c.restore()}c.fillStyle='#222';c.fillRect(-s*.05,-s*.5,s*.1,s)},
 star(c,s,col){c.fillStyle=col;c.beginPath();for(let i=0;i<10;i++){const r=i%2?s*.45:s,a=i*Math.PI/5-Math.PI/2;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fill()},
 pearl(c,s,col){const g=c.createRadialGradient(-s*.3,-s*.3,s*.1,0,0,s);g.addColorStop(0,'#fff');g.addColorStop(1,col);c.fillStyle=g;c.beginPath();c.arc(0,0,s,0,7);c.fill()},
 skull(c,s,col){c.fillStyle=col;c.beginPath();c.arc(0,-s*.1,s*.8,Math.PI,0);c.lineTo(s*.8,s*.2);c.lineTo(s*.45,s*.35);c.lineTo(s*.45,s*.8);c.lineTo(-s*.45,s*.8);c.lineTo(-s*.45,s*.35);c.lineTo(-s*.8,s*.2);c.closePath();c.fill();c.fillStyle='#000';for(const k of[-1,1]){c.beginPath();c.arc(k*s*.33,-s*.05,s*.2,0,7);c.fill()}c.beginPath();c.moveTo(0,s*.1);c.lineTo(-s*.1,s*.3);c.lineTo(s*.1,s*.3);c.fill()},
 crown(c,s,col){c.fillStyle=col;c.beginPath();c.moveTo(-s,s*.7);c.lineTo(-s,-s*.4);c.lineTo(-s*.5,s*.1);c.lineTo(0,-s*.8);c.lineTo(s*.5,s*.1);c.lineTo(s,-s*.4);c.lineTo(s,s*.7);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.25)';c.fillRect(-s,s*.5,s*2,s*.2)},
 ember(c,s,col){c.fillStyle=col;c.beginPath();c.arc(0,0,s,0,7);c.fill()},
 spark(c,s,col){c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.moveTo(-s,0);c.lineTo(s,0);c.moveTo(0,-s);c.lineTo(0,s);c.stroke()}
};
const FXC={
 f1:{bg:['#3a0a1c','#14030a'],it:[{sh:'petal',cols:['#ff4d79','#ff8fb1','#e0245e','#ffb3c8'],rate:28,from:'top',vy:[90,190],vx:[-40,40],s:[9,18],rot:1,glow:'#ff4d79'}]},
 f2:{bg:['#3b0a2c','#12030f'],it:[{sh:'heart',cols:['#ff5fa2','#ff2d7a','#ff9ac8'],rate:16,from:'bottom',vy:[-190,-90],vx:[-30,30],s:[10,26],glow:'#ff2d7a'}]},
 f3:{bg:['#240a3a','#0a0318'],it:[{sh:'butterfly',cols:['#ff8be0','#c58bff','#8be3ff','#ffd18b'],rate:7,from:'bottom',vy:[-120,-60],vx:[-50,50],s:[16,30],glow:'#d68bff',wob:1}]},
 f4:{bg:['#2f0a2a','#0e0310'],it:[{sh:'star',cols:['#ffd1e8','#ff9ad0','#fff'],rate:22,from:'rand',vy:[-10,60],vx:[-20,20],s:[6,15],rot:1,glow:'#ff9ad0',tw:1}]},
 f5:{bg:['#2a1030','#0c0512'],it:[{sh:'pearl',cols:['#ffe6f2','#f5d0ff','#ffd9e6'],rate:14,from:'bottom',vy:[-110,-50],vx:[-25,25],s:[7,16],glow:'#ffd9f0'},{sh:'spark',cols:['#fff','#ffe6f9'],rate:24,from:'rand',vy:[-5,5],vx:[-5,5],s:[4,9],glow:'#fff',tw:1}]},
 m1:{bg:['#1a0000','#000'],it:[{sh:'skull',cols:['#e8e8e8','#c9c9c9','#b0b0b0'],rate:7,from:'bottom',vy:[-170,-90],vx:[-25,25],s:[16,34],glow:'#ff1a1a',rot:.4}]},
 m2:{bg:['#150f00','#000'],it:[{sh:'spark',cols:['#ffd54a','#ffb300','#fff3b0'],rate:30,from:'rand',vy:[30,110],vx:[-30,30],s:[4,10],glow:'#ffc107',tw:1}],crown:1},
 m3:{bg:['#05050f','#000'],it:[{sh:'ember',cols:['#6bb6ff','#bfe0ff'],rate:12,from:'rand',vy:[-20,20],vx:[-30,30],s:[2,5],glow:'#4aa3ff'}],bolt:1},
 m4:{bg:['#1a0600','#000'],it:[{sh:'ember',cols:['#ff6a00','#ffb000','#ff3d00','#ffd54a'],rate:60,from:'bottom',vy:[-260,-110],vx:[-50,50],s:[2,6],glow:'#ff5a00'}]},
 m5:{bg:['#0b0014','#000'],it:[{sh:'spark',cols:['#b061ff','#ff4d4d','#fff'],rate:26,from:'rand',vy:[-40,40],vx:[-40,40],s:[4,9],glow:'#b061ff',tw:1}],rings:1}
};
function playFx(id,done){
  const emp=id==='emp',def=emp?FXE:(FXL.find(x=>x.id===id)||FXL[0]),dur=emp?12000:6000;
  const o=el('div',{class:'fxo'+(emp?' emp':'')});document.body.append(o);
  const au=sfx(def.a);
  let ended=false;const end=()=>{if(ended)return;ended=true;stopSfx(au);o.classList.add('out');setTimeout(()=>{o.remove();done&&done()},350)};
  const skip=el('button',{class:'fxskip',onclick:end},'تخطي');
  if(emp){empSeq(o,end,dur);o.append(skip);return}
  const cv=el('canvas',{class:'fxc'});o.append(cv,el('div',{class:'fxname'},def.n),skip);
  cv.width=innerWidth;cv.height=innerHeight;const c=cv.getContext('2d'),W=cv.width,H=cv.height,cfg=FXC[def.id],P=[];
  const t0=performance.now();let last=t0,acc=cfg.it.map(()=>0),bolt=null;
  const R2=(a,b)=>a+Math.random()*(b-a);
  const frame=now=>{
    if(ended)return;const t=(now-t0)/1000,dt=Math.min(.05,(now-last)/1000);last=now;
    const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,cfg.bg[0]);g.addColorStop(1,cfg.bg[1]);c.fillStyle=g;c.fillRect(0,0,W,H);
    cfg.it.forEach((it,k)=>{acc[k]+=it.rate*dt;while(acc[k]>=1){acc[k]--;const x=R2(0,W);
      P.push({sh:it.sh,col:pick(it.cols),x:it.from==='rand'?x:x,y:it.from==='top'?-20:it.from==='bottom'?H+20:R2(0,H),vx:R2(...it.vx),vy:R2(...it.vy),s:R2(...it.s),a:R2(0,6.28),va:it.rot?R2(-2,2):0,life:0,max:it.from==='rand'?R2(1.2,2.6):9,glow:it.glow,tw:it.tw,wob:it.wob,ph:R2(0,6.28)})}});
    for(let i=P.length-1;i>=0;i--){const p=P[i];p.life+=dt;p.x+=p.vx*dt+(p.wob?Math.sin(p.life*3+p.ph)*30*dt:0);p.y+=p.vy*dt;p.a+=p.va*dt;
      if(p.y<-60||p.y>H+60||p.life>p.max){P.splice(i,1);continue}
      let al=1;if(p.max<5)al=Math.sin(Math.PI*p.life/p.max);if(p.tw)al*=.6+.4*Math.sin(p.life*12+p.ph);
      c.save();c.globalAlpha=Math.max(0,al);c.translate(p.x,p.y);c.rotate(p.sh==='butterfly'?0:p.a);c.shadowColor=p.glow;c.shadowBlur=14;SH[p.sh](c,p.s,p.col,p.life);c.restore()}
    if(cfg.crown){const k=Math.min(1,t/1.6),y=-120+(H*.34+120)*(1-Math.pow(1-k,3)),s=70+Math.sin(t*3)*4;c.save();c.translate(W/2,y);c.shadowColor='#ffc107';c.shadowBlur=36;SH.crown(c,s,'#ffc83d');c.restore()}
    if(cfg.rings){for(let k=0;k<4;k++){const r=((t*.9+k*.25)%1);c.strokeStyle=`rgba(176,97,255,${1-r})`;c.lineWidth=3;c.shadowColor='#b061ff';c.shadowBlur=18;c.beginPath();c.arc(W/2,H/2,40+r*Math.max(W,H)*.55,0,7);c.stroke()}}
    if(cfg.bolt){if(!bolt&&Math.random()<dt*1.6)bolt={x:R2(W*.15,W*.85),t:0};if(bolt){bolt.t+=dt;c.save();c.strokeStyle='rgba(190,225,255,'+(1-bolt.t/.28)+')';c.lineWidth=3;c.shadowColor='#6bb6ff';c.shadowBlur=26;c.beginPath();let x=bolt.x,y=0;c.moveTo(x,y);while(y<H){y+=R2(30,70);x+=R2(-40,40);c.lineTo(x,y)}c.stroke();c.fillStyle='rgba(120,170,255,'+Math.max(0,.18*(1-bolt.t/.28))+')';c.fillRect(0,0,W,H);c.restore();if(bolt.t>.28)bolt=null}}
    if(now-t0>=dur)return end();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
function empSeq(o,end,dur){
  const eyes=el('div',{class:'eyes'},el('i'),el('i')),s1=el('div',{class:'slash a'}),s2=el('div',{class:'slash b'}),s3=el('div',{class:'slash c'}),nm=el('div',{class:'empnm'},'الجيسي'),cv=el('canvas',{class:'fxc',style:'opacity:0;transition:opacity 1.2s'});
  o.append(cv,eyes,s1,s2,s3,nm);cv.width=innerWidth;cv.height=innerHeight;const c=cv.getContext('2d'),W=cv.width,H=cv.height;
  const st=Array.from({length:110},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.8+.3,p:Math.random()*6.28,v:Math.random()*8+2}));
  let run=true;const draw=t=>{if(!run)return;c.fillStyle='#000';c.fillRect(0,0,W,H);for(const s of st){s.y-=s.v*.016;if(s.y<0)s.y=H;c.globalAlpha=.4+.6*Math.abs(Math.sin(t/500+s.p));c.fillStyle='#fff';c.shadowColor='#fff';c.shadowBlur=6;c.beginPath();c.arc(s.x,s.y,s.r,0,7);c.fill()}c.globalAlpha=1;requestAnimationFrame(draw)};requestAnimationFrame(draw);
  const T=(ms,f)=>setTimeout(()=>{if(run)f()},ms);
  T(700,()=>eyes.classList.add('on'));T(2300,()=>s1.classList.add('on'));T(3000,()=>s2.classList.add('on'));
  T(3600,()=>{s1.classList.add('off');s3.classList.add('on');eyes.classList.add('fade')});
  T(4200,()=>{s2.classList.add('off');s3.classList.add('off');cv.style.opacity='1'});
  T(5600,()=>nm.classList.add('on'));T(dur-1700,()=>nm.classList.remove('on'));
  T(dur,()=>{run=false;end()});
  const ob=new MutationObserver(()=>{if(!o.isConnected){run=false;ob.disconnect()}});ob.observe(document.body,{childList:true});
}

/* ---------- عرض الملف التعريفي ---------- */
function privateCard(){
  const{close}=overlayBox('',el('div',{class:'pvt'},el('div',{class:'pvl'},ic('lock',64)),el('h3',{},'هذا الملف التعريفي خاص'),el('button',{class:'btn g',onclick:()=>close()},'إغلاق')));
}
async function viewProfile(u){
  if(!u)return;
  const own=u===uid,p=await prof(u),r=await roleOf(u);
  let pub=true;try{pub=(await get(R('ppub/'+u))).val()!==false}catch(e){}
  if(!own&&!pub&&!isDev())return privateCard();
  let pd={};try{pd=(await get(R('pdata/'+u))).val()||{}}catch(e){}
  try{pd.rk=(await get(R('rankt/'+u))).val()||''}catch(e){}
  try{pd.fr=(await get(R(`friends/${uid}/${u}`))).exists()}catch(e){}
  let fx=null;if(!own&&(r==='dev'||r==='emp')){try{fx=(await get(R('pfx/'+u))).val()}catch(e){}if(!fx&&r==='emp')fx='emp'}
  const show=()=>profileCard(u,p,r,pd,own);
  if(fx&&(fx==='emp'?r==='emp':true))playFx(fx,show);else show();
}
function profileCard(u,p,r,pd,own){
  const royal=r==='emp';
  const idp=el('div',{class:'idp'+(royal?' gold':'')},el('small',{},'ID'),el('b',{},pd.pid||'—'),pd.pid?el('button',{class:'ib',style:'width:30px;height:30px',onclick:()=>copy(pd.pid)},ic('copy',16)):null);
  const a=avatar(u,'l');a.classList.add('pfav');
  const rows=[el('div',{class:'pfn'},p.name||'عضو'),el('div',{class:'pft'},pd.rk?el('span',{class:'tag king'},pd.rk):rankTag(r,false),ageTag(p),el('span',{class:'tag'},p.gender==='f'?'أنثى':'ذكر'))];
  const body=[royal?el('div',{class:'crw'},ic('crown',44)):null,a,...rows,idp,pd.note?el('div',{class:'pfnote'},pd.note):null,el('small',{style:'color:var(--mu)'},'عضو منذ '+days(p.ts)+' يوم')];
  const btns=el('div',{style:'display:flex;gap:8px;width:100%;flex-wrap:wrap'},
    !own?(pd.fr?el('button',{class:'btn r',style:'flex:1;min-width:120px',onclick:()=>confirmUnfriend(u,p,close)},'حذف الصديق'):el('button',{class:'btn',style:'flex:1;min-width:120px',onclick:()=>sendFriendReq(u)},'إرسال طلب صداقة')):null,
    !own?el('button',{class:'btn g',style:'flex:1;min-width:90px',onclick:()=>reportSheet(u)},'إبلاغ'):null,
    el('button',{class:'btn g',style:'flex:1;min-width:90px',onclick:()=>close()},'إغلاق'));
  const{o,close}=overlayBox('',el('div',{class:'pfc'+(royal?' royal':'')},...body,btns));
  o.classList.add('pfo');if(royal)o.classList.add('royalo');
}
function confirmUnfriend(u,p,close){
  openSheet(el('h3',{style:'text-align:center'},'حذف '+(p.name||'الصديق')+' من أصدقائك؟'),el('div',{style:'display:flex;gap:10px'},
    el('button',{class:'btn r',style:'flex:1',onclick:async()=>{closeSheet();try{await update(ref(db),{[`friends/${uid}/${u}`]:null,[`friends/${u}/${uid}`]:null});toast('تم حذف الصديق');close()}catch(e){err(e)}}},'نعم'),el('button',{class:'btn g',style:'flex:1',onclick:closeSheet},'لا')));
}
function reportSheet(u){
  const R0=['إساءة أو شتائم','سبام مزعج','انتحال شخصية','محتوى غير لائق','سبب آخر'];
  openSheet(el('h3',{},'إبلاغ عن العضو'),...R0.map(r=>el('button',{class:'btn g',onclick:async()=>{closeSheet();try{await set(push(R('reports')),{from:uid,tg:u,r,ts:serverTimestamp()});toast('تم إرسال البلاغ للمشرفين',false,true)}catch(e){err(e)}}},r)),el('button',{class:'btn g',onclick:closeSheet},'إلغاء'));
}
async function sendFriendReq(u){
  if(u===uid)return toast('هذا ملفك أنت',true);
  try{
    if((await get(R(`friends/${uid}/${u}`))).exists())return toast('أنتما صديقان بالفعل',true);
    if((await get(R(`freq/${u}/${uid}`))).exists())return toast('أرسلت طلباً سابقاً',true);
    const k=push(R('notifs/'+u)).key;
    await update(ref(db),{[`freq/${u}/${uid}`]:{ts:serverTimestamp()},[`notifs/${u}/${k}`]:{t:'fr',from:uid,ts:serverTimestamp()}});
    toast('تم إرسال طلب الصداقة',false,true);
  }catch(e){err(e)}
}
function addFriendSheet(){
  const inp=el('input',{placeholder:'ضع المعرف أو ID',inputmode:'numeric',maxlength:'9',style:'text-align:center;letter-spacing:3px'}),res=el('div',{class:'frres'});
  const go2=async()=>{
    const id=inp.value.trim();res.replaceChildren();
    if(!/^[0-9]{9}$/.test(id))return toast('المعرف 9 أرقام',true);
    try{const t=(await get(R('pids/'+id))).val();if(!t){res.append(el('div',{class:'empty'},'لا يوجد عضو بهذا المعرف'));sfx('err');return}
      const p=await prof(t);
      res.append(el('div',{class:'frc'},avatar(t,'l'),el('b',{style:'font-size:18px'},p.name||'عضو'),
        t===uid?el('small',{style:'color:var(--mu)'},'هذا أنت'):el('div',{style:'display:flex;gap:8px;width:100%;flex-wrap:wrap'},
          el('button',{class:'btn',style:'flex:1;min-width:130px',onclick:()=>sendFriendReq(t)},'إرسال طلب صداقة'),
          el('button',{class:'btn g',style:'flex:1;min-width:130px',onclick:()=>{closeSheet();viewProfile(t)}},'عرض الملف التعريفي'))))
    }catch(e){err(e)}
  };
  openSheet(el('h3',{},'إضافة صديق'),inp,el('button',{class:'btn',onclick:go2},'بحث'),res,el('button',{class:'btn g',onclick:closeSheet},'إغلاق'));
}

/* ---------- الجرس (الإشعارات) ---------- */
const NT=new Map();let bellSeen=0;
const bellUnread=()=>[...NT.values()].filter(n=>(n.ts||0)>bellSeen).length;
function updBadge(){const n=bellUnread();document.querySelectorAll('.bdg').forEach(b=>{b.textContent=n>99?'99+':String(n);b.style.display=n?'flex':'none'})}
async function notifTo(u,o){try{await set(push(R('notifs/'+u)),{from:uid,ts:serverTimestamp(),...o})}catch(e){}}
function startBell(){
  bellSeen=+(localStorage.getItem('bell_seen_'+uid)||0);
  const add=(src,s)=>{const v=s.val();if(!v)return;const key=src+s.key;if(NT.has(key))return;v.src=src;v.k=s.key;NT.set(key,v);updBadge();
    if(!document.hidden&&(v.ts||0)>bellSeen&&Date.now()-(v.ts||0)<20000)toast(notifLine(v,'…').plain,false,true)};
  cleanup0.push(onChildAdded(R('notifs/'+uid),s=>add('n',s),()=>{}));
  if(isDev()){cleanup0.push(onChildAdded(R('sus'),s=>add('s',s),()=>{}));cleanup0.push(onChildAdded(R('reports'),s=>add('r',s),()=>{}))}
}
const cleanup0=[];
function notifLine(n,name){
  const a=fmtN(n.a||0);
  switch(n.t){
    case'tr':return{plain:'وصلك رصيد '+a,t:`وصلك رصيد ${a} من ${name}`,i:'swap'};
    case'lost':return{plain:'خسرت '+a+' رصيد',t:`خسرت ${a} رصيد بسبب تحويله إلى ${n.m||'عضو'}`,i:'swap'};
    case'fr':return{plain:'طلب صداقة جديد',t:`${name} أرسل لك طلب صداقة`,i:'userplus'};
    case'men':return{plain:'تم ذكرك في نقابة',t:`${name} ذكرك في «${n.m||'نقابة'}»`,i:'at'};
    case'ban':return{plain:'محاولة حظر',t:`المعرف ${name} حاول حظرك من استعمال التطبيق`,i:'ban'};
    case'sus':return{plain:'تنبيه اشتباه',t:`تنبيه: ${name} جمع ${a} رصيد بسرعة فائقة`,i:'info'};
    case'wl':return{plain:'خسرتم الحرب',t:`خسرتم ${a} رصيد لأن نقابتكم خسرت الحرب`,i:'flag'};
    case'ww':return{plain:'ربحتم الحرب',t:`ربحتم الحرب وكسبتم ${a} رصيد`,i:'trophy'};
    case'rep':return{plain:'بلاغ جديد',t:'بلاغ',i:'ban'};
    case'buy':return{plain:'عملية شراء',t:`${name} اشترى «${n.m||''}» بمبلغ ${a}`,i:'cart'};
    case'warn':return{plain:'تحذير',t:'تحذير: '+(n.m||'سبام'),i:'info'};
    case'wd':return{plain:'حرب',t:n.m||'حرب',i:'swords'};
    default:return{plain:n.m||'إشعار',t:n.m||'إشعار',i:'bell'};
  }
}
async function bellScreen(){
  const list=el('div',{class:'list'});
  app$.replaceChildren(el('div',{class:'hdr'},ibtn('back',back),el('h1',{},'الإشعارات')),list);
  bellSeen=Date.now()+5000;localStorage.setItem('bell_seen_'+uid,String(Date.now()+5000));updBadge();
  const items=[...NT.values()].sort((a,b)=>(b.ts||0)-(a.ts||0));
  // تنبيهات الحرب الحالية لنقابتي
  const wars=[];
  for(const g of Object.keys(mem)){if(!groups[g]||groups[g].kind!=='main'||mem[g]!==true)continue;
    try{const wid=(await get(R('activeWar/'+g))).val();if(!wid||wars.some(w=>w.id===wid))continue;const w=(await get(R('wars/'+wid))).val();if(!w)continue;wars.push({id:wid,w,g})}catch(e){}}
  for(const{w,g}of wars){const att=w.a===g,by=(await prof(w.by)).name||'مشرف';
    list.append(el('div',{class:'nrow war'+(att?' atk':' def')},ic(att?'swords':'shield',26),el('div',{class:'t'},el('b',{},att?`⚔ نقابتكم تهاجم «${groups[w.d]?.name||''}»`:`تتعرضون لغزو من نقابة «${groups[w.a]?.name||''}»`),el('small',{},'أعلنها المشرف '+by),el('small',{class:'wcd'},'')),el('small',{},hhmm(w.t0))));
    const cdn=list.lastChild.querySelector('.wcd');const tk=setInterval(()=>{if(!cdn.isConnected)return clearInterval(tk);const n=Date.now();cdn.textContent=n<w.st?'تبدأ بعد '+mmssF(w.st-n):n<w.en?'المعركة قائمة الآن':'بانتظار الحسم'},1000)}
  if(!items.length&&!wars.length)list.append(el('div',{class:'empty'},'لا توجد إشعارات'));
  for(const n of items){
    const nm=el('b',{},'…'),row=el('div',{class:'nrow'},ic(notifLine(n,'').i,24),el('div',{class:'t'},nm,el('small',{},hhmm(n.ts))));
    const setT=name=>{nm.textContent=notifLine(n,name).t};
    if(n.t==='sus'&&n.src==='s'){prof(n.k).then(p=>setT(p.name||'عضو'))}
    else if(n.src==='r'){Promise.all([prof(n.from),prof(n.tg)]).then(([a,b])=>{nm.textContent=`بلاغ: ${a.name||'عضو'} أبلغ عن ${b.name||'عضو'} — ${n.r||''}`});row.onclick=()=>viewProfile(n.tg)}
    else if(n.from&&n.t!=='lost'&&n.t!=='wl'&&n.t!=='ww'&&n.t!=='wd')prof(n.from).then(p=>setT(p.name||'عضو'));else setT('');
    if(n.t==='fr'&&n.src==='n'){const acts=el('div',{style:'display:flex;gap:6px;margin-top:6px'},
      el('button',{class:'btn',style:'padding:6px 12px;font-size:13px',onclick:async()=>{try{await update(ref(db),{[`friends/${uid}/${n.from}`]:true,[`friends/${n.from}/${uid}`]:true,[`freq/${uid}/${n.from}`]:null,[`notifs/${uid}/${n.k}`]:null});NT.delete('n'+n.k);toast('تمت الإضافة إلى أصدقائك',false,true);acts.remove();row.style.opacity='.5'}catch(e){err(e)}}},'قبول'),
      el('button',{class:'btn g',style:'padding:6px 12px;font-size:13px',onclick:async()=>{try{await update(ref(db),{[`freq/${uid}/${n.from}`]:null,[`notifs/${uid}/${n.k}`]:null});NT.delete('n'+n.k);row.remove()}catch(e){err(e)}}},'تجاهل'));row.querySelector('.t').append(acts)}
    if(n.t==='men'&&n.g&&groups[n.g]&&mem[n.g])row.onclick=()=>go('g/'+n.g);
    list.append(row);
  }
}
const mmssF=ms=>{const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60);return(h?h+':':'')+String(m).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};

/* ====================== الإعدادات ====================== */
const BCOLS=['#ff7a1a','#e53935','#d81b60','#8e24aa','#5e35b1','#3949ab','#1e88e5','#00acc1','#00897b','#43a047','#7cb342','#f9a825','#6d4c41','#546e7a'];
const BGS=['linear-gradient(160deg,#120804,#2a0f06)','linear-gradient(160deg,#0d0f1a,#1a1230)','linear-gradient(160deg,#04141a,#0a2a2a)','linear-gradient(160deg,#1a0a14,#2e1020)','linear-gradient(160deg,#111,#222)','linear-gradient(160deg,#1c1304,#3a2a08)'];
const myMainG=()=>Object.keys(groups).find(g=>groups[g].kind==='main'&&mem[g]===true)||null;
function settings(){
  const body=el('div',{class:'list'});
  const av=avatar(uid,'l');
  const changePhoto=async()=>{
    if(!(await askPerm('media')))return;const f=await pickFile('image/*');if(!f)return;
    const d=await cropImage(f,{out:[128,100,80],limit:29000,title:'قص الصورة 1:1'});if(!d)return;
    try{await set(R('avatars/'+uid),d);AV.set(uid,Promise.resolve(d));av.style.backgroundImage=`url(${d})`;av.textContent='';toast('تم حفظ الصورة',false,true)}catch(e){err(e)}};
  av.onclick=changePhoto;
  const idp=el('div',{class:'idp'},el('small',{},'ID'),el('b',{},myPid||'…'),el('button',{class:'ib',style:'width:30px;height:30px',onclick:()=>myPid&&copy(myPid)},ic('copy',16)));
  ensurePid().then(()=>{idp.querySelector('b').textContent=myPid||'—'});
  // ملاحظة
  const note=el('input',{maxlength:'40',placeholder:'ملاحظة عن نفسك (40 حرفاً)'});
  get(R('pdata/'+uid+'/note')).then(s=>{note.value=s.val()||''}).catch(()=>{});
  // عام / خاص
  const pubD=el('div',{class:'pubd'}),bPub=el('button',{class:'chip2'},'عام'),bPriv=el('button',{class:'chip2'},'خاص');let isPub=true;
  const drawP=()=>{bPub.classList.toggle('a',isPub);bPriv.classList.toggle('a',!isPub);pubD.textContent=isPub?'يمكن لأي عضو الدخول ورؤية ملفك التعريفي':'لا يمكن لأي عضو الدخول ورؤية ملفك التعريفي'};
  get(R('ppub/'+uid)).then(s=>{isPub=s.val()!==false;drawP()}).catch(()=>drawP());
  const setPub=v=>async()=>{try{await set(R('ppub/'+uid),v);isPub=v;drawP()}catch(e){err(e)}};
  bPub.onclick=setPub(true);bPriv.onclick=setPub(false);drawP();
  // ألوان
  const accEl=el('div',{class:'cols'}),colsEl=el('div',{class:'cols'}),bgEl=el('div',{class:'cols'});
  const drawA=()=>accEl.replaceChildren(...ACC.map(c=>el('div',{class:'cc'+(c===accent()?' on':''),style:'background:'+c,onclick:()=>{localStorage.setItem('ac',c);applyUI();drawA();toast('تم تغيير لون الواجهة',false,true)}})));
  const drawC=()=>colsEl.replaceChildren(...BCOLS.map(c=>el('div',{class:'cc'+(c===me.color?' on':''),style:'background:'+c,onclick:async()=>{try{await set(R(`profiles/${uid}/color`),c);me.color=c;drawC()}catch(e){err(e)}}})));
  const curBg=()=>localStorage.getItem('bg')||BGS[0];
  const prevBg=el('div',{class:'bgprev'}),dimR=el('input',{type:'range',min:'0',max:'85',value:localStorage.getItem('bgdim')||'0'}),blurR=el('input',{type:'range',min:'0',max:'14',value:localStorage.getItem('bgblur')||'0'});
  const drawPrev=()=>{const b=curBg();prevBg.style.cssText=`background:${/^data:/.test(b)?`url(${b}) center/cover`:b};--dim:${dimR.value/100};--bl:${blurR.value}px`;prevBg.replaceChildren(el('div',{class:'bgd'}),el('div',{class:'bgs'},'معاينة الخلفية'))};
  dimR.oninput=()=>{localStorage.setItem('bgdim',dimR.value);drawPrev()};blurR.oninput=()=>{localStorage.setItem('bgblur',blurR.value);drawPrev()};
  const drawB=()=>{bgEl.replaceChildren(...BGS.map(b=>el('div',{class:'bgp'+(b===curBg()?' on':''),style:'background:'+b,onclick:()=>{localStorage.setItem('bg',b);drawB();drawPrev()}})),
    el('div',{class:'bgp',style:'display:flex;align-items:center;justify-content:center;border:2px dashed var(--line)',onclick:async()=>{if(!(await askPerm('media')))return;const f=await pickFile('image/*');if(!f)return;try{const d=await cropImage(f,{out:[720,560,420],limit:300000,round:false,ratio:1.78,title:'قص الخلفية'});if(!d)return;localStorage.setItem('bg',d);drawB();drawPrev();toast('تم تعيين الخلفية',false,true)}catch(e){toast('تعذر تحميل الصورة',true)}}},ic('image',26)));drawPrev()};
  drawA();drawC();drawB();
  const empBox=isEmp()?el('div',{class:'sec'},el('h4',{},'خاص الإمبراطور'),
    el('button',{class:'btn g',style:'margin-bottom:8px',onclick:resetLb},'تصفير المتصدرين'),
    el('button',{class:'btn g',style:'margin-bottom:8px',onclick:()=>go('mg')},'خاص الإمبراطور: دمج النقابات'),
    el('button',{class:'btn g',style:'margin-bottom:8px',onclick:async()=>{try{const r=await fetch('https://api.github.com/repos/'+REPO+'/releases/latest',{cache:'no-store'});const n=+String((await r.json()).tag_name||'').replace(/\D/g,'');if(!n)throw 0;await set(R('config/minBuild'),n);toast('تم إلزام الأعضاء بتثبيت النسخة '+n,false,true)}catch(e){toast('تعذر قراءة آخر إصدار',true)}}},'إلزام الأعضاء بتحديث APK'),
    el('button',{class:'btn r',onclick:async()=>{localStorage.removeItem('fir_in');try{await signOut(auth)}catch(e){}location.replace('index.html')}},'تسجيل خروج (لفتح حساب آخر)')):null;
  body.append(
    el('div',{class:'sec',style:'text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px'},av,
      el('button',{class:'btn glowbtn',onclick:changePhoto},ic('camera',20),' تغيير الصورة'),
      el('h2',{style:'margin:0'},me.name),idp),
    el('div',{class:'sec'},el('h4',{},'ملاحظة'),note,el('button',{class:'btn g',style:'margin-top:8px',onclick:async()=>{try{const v=note.value.trim().slice(0,40);await set(R('pdata/'+uid+'/note'),v||null);toast('تم حفظ الملاحظة',false,true)}catch(e){err(e)}}},'حفظ الملاحظة')),
    el('div',{class:'sec'},el('h4',{},'خصوصية الملف التعريفي'),el('div',{style:'display:flex;gap:10px'},bPub,bPriv),pubD),
    el('div',{class:'sec'},el('button',{class:'btn glowbtn',style:'width:100%',onclick:()=>go('ui')},ic('sliders',20),' تعديل الواجهة')),
    el('div',{class:'sec'},(()=>{const sw=el('input',{type:'checkbox',style:'width:auto',onchange:e=>{localStorage.setItem('mute',e.target.checked?'1':'0')}});sw.checked=localStorage.getItem('mute')==='1';return el('div',{class:'sw'},el('span',{},'إيقاف أصوات التطبيق'),sw)})(),el('small',{style:'color:var(--mu)'},'يوقف كل الأصوات عدا مؤثر دخول الإمبراطور')),
    el('div',{class:'sec'},el('h4',{},'لون الواجهة'),accEl),
    el('div',{class:'sec'},el('h4',{},'لون فقاعات رسائلك'),colsEl),
    el('div',{class:'sec'},el('h4',{},'خلفية الدردشة (لك فقط)'),prevBg,bgEl,el('small',{style:'color:var(--mu)'},'التعتيم'),dimR,el('small',{style:'color:var(--mu)'},'الضبابية'),blurR),
    pwSection(),
    isDev()?el('div',{class:'sec'},el('button',{class:'btn vipb',style:'width:100%',onclick:()=>go('vip')},ic('crown',20),' VIP'),el('button',{class:'btn g',style:'width:100%;margin-top:8px',onclick:()=>go('dl')},'قيود الأجهزة (فك الحظر عن الجهاز)')):null,
    empBox);
  app$.replaceChildren(el('div',{class:'hdr'},ibtn('back',back),el('h1',{},'الإعدادات')),body);
}

/* ====================== تعديل الواجهة ====================== */
function track(n,get0,onCh,labels){
  const w=el('div',{class:'trk'});
  const draw=()=>{const v=get0();w.replaceChildren(...Array.from({length:n},(_,i)=>el('div',{class:'tcol'},el('div',{class:'nd'+(i+1<=v?' f':'')+(i+1===v?' on':''),onclick:()=>{onCh(i+1);draw()}}),el('small',{},labels[i]||''))))};draw();w.redraw=draw;return w;
}
function uiEditor(){
  let fs=uiFs(),lay=uiLay();
  const pv=el('div',{class:'pv'});
  const sample=()=>{pv.replaceChildren(
    el('div',{class:'hdr'},el('div',{class:'ib'},ic('back',20)),el('h1',{},'نقابة المثال'),el('div',{class:'ib'},ic('game',20)),el('div',{class:'ib'},ic('info',20))),
    el('div',{class:'pvm'},
      el('div',{class:'msg ot'},el('div',{class:'av s'},'ن'),el('div',{class:'bub',style:'background:linear-gradient(135deg,#5b5be0,#38388a)'},el('div',{class:'nm'},'ناروتو'),el('div',{class:'tx'},'مرحباً بالجميع، كيف حالكم اليوم؟'),el('div',{class:'ft'},'10:24'))),
      el('div',{class:'msg me'},el('div',{class:'bub',style:'background:linear-gradient(135deg,'+accent()+','+dark(accent())+')'},el('div',{class:'tx'},'الحمد لله بخير، وأنت؟'),el('div',{class:'ft'},'10:25'))),
      el('div',{class:'msg ot'},el('div',{class:'av s'},'ل'),el('div',{class:'bub',style:'background:linear-gradient(135deg,#00897b,#005a50)'},el('div',{class:'nm'},'ليفاي'),el('div',{class:'tx'},'هذا مثال لشكل الرسائل بالحجم الذي اخترته'),el('div',{class:'ft'},'10:26')))),
    el('div',{class:'cmp'},el('div',{class:'acts'},el('button',{class:'ib'},ic('plus',21)),el('button',{class:'ib stb'},el('span',{style:'font-size:20px;line-height:1'},'🙂'),el('em',{},'ملصقات')),el('button',{class:'ib'},ic('at',21)),el('button',{class:'ib'},ic('mic',21,accent()))),el('textarea',{rows:'1',placeholder:'اكتب رسالة…',disabled:true}),el('button',{class:'send'},ic('send',20))))};
  const redraw=()=>{applyUI(fs,lay,accent(),pv);sample()};
  const t1=track(7,()=>fs,v=>{fs=v;redraw()},['أصغر','','','متوسط','','','أكبر']);
  const t2=track(7,()=>lay,v=>{lay=v;redraw()},['1','2','3','4','5','6','7']);
  redraw();
  const body=el('div',{class:'list',style:'padding:12px;display:flex;flex-direction:column;gap:14px'},
    el('div',{class:'sec',style:'padding:0;border:0'},el('h4',{},'معاينة مباشرة'),pv),
    el('div',{class:'sec'},el('h4',{},'الخط'),t1,el('small',{style:'color:var(--mu)'},'اليسار أصغر • اليمين أكبر')),
    el('div',{class:'sec'},el('h4',{},'النموذج'),t2,el('small',{style:'color:var(--mu)'},'من 5 إلى 7 تكبر الأزرار وتتغير أماكنها')),
    el('div',{style:'display:flex;gap:10px'},el('button',{class:'btn glowbtn',style:'flex:1',onclick:()=>{localStorage.setItem('ui_fs',String(fs));localStorage.setItem('ui_lay',String(lay));applyUI();toast('تم حفظ الواجهة',false,true)}},'حفظ'),
      el('button',{class:'btn g',style:'flex:1',onclick:()=>{fs=4;lay=4;redraw();t1.redraw();t2.redraw()}},'الافتراضي')));
  app$.replaceChildren(el('div',{class:'hdr'},ibtn('back',back),el('h1',{},'تعديل الواجهة')),body);
}

/* ====================== VIP ====================== */
function vipScreen(){
  if(!isDev()){go('');return}
  const B=(i,t,f)=>el('button',{class:'btn g vrow',onclick:f},ic(i,22),el('span',{},t));
  app$.replaceChildren(el('div',{class:'hdr'},ibtn('back',back),el('h1',{},'VIP')),el('div',{class:'list',style:'padding:12px;display:flex;flex-direction:column;gap:10px'},
    B('edit','تعديل المعرف',vipId),B('sparkle0','تعيين واجهة مميزة',vipBubble),B('share','النشر',vipPublish),B('ban','حظر',vipBan),B('crown','مؤثرات',vipFx)));
}
IC.star='<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>';
IC.sparkle0='<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>';
async function vipId(){
  const inp=el('input',{value:myPid,maxlength:'9',inputmode:'numeric',style:'text-align:center;letter-spacing:3px'}),e=el('div',{class:'err'});
  openSheet(el('h3',{},'تعديل المعرف'),el('small',{style:'color:var(--mu)'},'المعرف 9 أرقام'),inp,e,el('button',{class:'btn',onclick:async()=>{
    const n=inp.value.trim();if(!/^[0-9]{9}$/.test(n)){e.textContent='المعرف يجب أن يكون 9 أرقام';sfx('err');return}
    if(n===myPid)return closeSheet();
    try{const t=(await get(R('pids/'+n))).val();if(t&&t!==uid){e.textContent='هذا المعرف مستخدم';sfx('err');return}
      const up={['pdata/'+uid+'/pid']:n,['pids/'+n]:uid};if(myPid)up['pids/'+myPid]=null;await update(ref(db),up);myPid=n;closeSheet();toast('تم تغيير المعرف',false,true)}catch(x){err(x)}}},'حفظ'),el('button',{class:'btn g',onclick:closeSheet},'إلغاء'));
}
async function vipBubble(){
  let on=false;try{on=(await get(R('pvip/'+uid))).val()===true}catch(e){}
  const st=el('div',{class:'ovi'},on?'مفعّلة':'غير مفعّلة');
  const demo=el('div',{class:'vipdemo'},el('div',{class:'bub vipb',style:`--bc:${me.color||'#ff7a1a'}`},el('div',{class:'nm'},me.name),el('div',{class:'tx'},'هذه فقاعتك المميزة: شفافة ولامعة بموجات متحركة'),el('div',{class:'ft'},'الآن')));
  openSheet(el('h3',{},'الواجهة المميزة'),demo,st,el('button',{class:'btn',onclick:async()=>{try{await set(R('pvip/'+uid),true);st.textContent='مفعّلة';toast('تم التفعيل',false,true)}catch(e){err(e)}}},'تفعيل'),
    el('button',{class:'btn g',onclick:async()=>{try{await remove(R('pvip/'+uid));st.textContent='غير مفعّلة'}catch(e){err(e)}}},'إيقاف'),el('button',{class:'btn g',onclick:closeSheet},'إغلاق'));
}
async function vipPublish(){
  const list=el('div');openSheet(el('h3',{},'رموز النشر'),el('small',{style:'color:var(--mu)'},'لكل نقابة رمز إحالة مختلف'),list,el('button',{class:'btn g',onclick:closeSheet},'إغلاق'));
  for(const g of Object.keys(groups).filter(g=>groups[g].kind==='main'&&mem[g]===true)){
    let code=null;try{code=(await get(R(`pubPerm/${g}/${uid}`))).val()}catch(e){}
    if(!code){try{for(let i=0;i<6&&!code;i++){const c=String(Math.floor(Math.random()*1e8)).padStart(8,'0');if((await get(R('refCodes/'+c))).exists())continue;await update(ref(db),{['refCodes/'+c]:{u:uid,g},[`pubPerm/${g}/${uid}`]:c});code=c}}catch(e){err(e)}}
    list.append(el('div',{class:'row'},el('div',{class:'t'},el('b',{},groups[g].name),el('small',{},'رمز الإحالة')),el('div',{class:'code',style:'font-size:18px;letter-spacing:3px;margin:0;padding:6px 10px'},code||'—'),code?el('button',{class:'ib',onclick:()=>copy(code)},ic('copy',18)):null));
  }
}
function vipBan(){
  const inp=el('input',{placeholder:'ضع ID الشخص',inputmode:'numeric',maxlength:'9',style:'text-align:center;letter-spacing:3px'}),res=el('div',{class:'frres'});
  const search=async()=>{
    res.replaceChildren();const id=inp.value.trim();if(!/^[0-9]{9}$/.test(id))return toast('المعرف 9 أرقام',true);
    try{const t=(await get(R('pids/'+id))).val();if(!t)return toast('لا يوجد عضو بهذا المعرف',true);const p=await prof(t);
      res.append(el('div',{class:'frc'},avatar(t,'l'),el('b',{},p.name||'عضو'),el('div',{style:'display:flex;gap:10px;width:100%'},
        el('button',{class:'btn g',style:'flex:1',onclick:closeSheet},'إلغاء'),
        el('button',{class:'btn r',style:'flex:1',onclick:()=>confirmBan(t,p)},'حظر'))))}catch(e){err(e)}};
  const confirmBan=(t,p)=>{
    openSheet(el('h3',{},'تأكيد'),el('p',{style:'text-align:center;line-height:1.9'},'هل انت متأكد من أنك ستحظر هذا المستخدم من استعمال التطبيق؟'),
      el('div',{style:'display:flex;gap:10px'},el('button',{class:'btn r',style:'flex:1',onclick:async()=>{
        closeSheet();const r=await roleOf(t);
        if(r==='emp'||r==='dev'||t===EMP){await notifTo(t,{t:'ban',m:me.name});toast('لا يمكن حظر هذا المستخدم',true);return}
        try{await set(R('banned/'+t),true);toast('تم حظر المستخدم',false,true)}catch(e){err(e)}}},'نعم'),el('button',{class:'btn g',style:'flex:1',onclick:closeSheet},'لا')))};
  openSheet(el('h3',{},'حظر مستخدم'),inp,el('button',{class:'btn',onclick:search},'بحث'),res);
}
async function vipFx(){
  let cur=null;try{cur=(await get(R('pfx/'+uid))).val()}catch(e){}
  const grid=el('div',{class:'fxg'});
  const all=[...FXL,...(isEmp()?[FXE]:[])];
  const draw=()=>grid.replaceChildren(...all.map(f=>el('button',{class:'fxc2'+(cur===f.id?' on':'')+(f.g==='f'?' fe':f.g==='m'?' ma':' em'),onclick:()=>{
    closeSheet();playFx(f.id,()=>openSheet(el('h3',{},f.n),el('button',{class:'btn',onclick:async()=>{try{await set(R('pfx/'+uid),f.id);cur=f.id;closeSheet();toast('تم تعيين المؤثر',false,true)}catch(e){err(e)}}},'تعيين كمؤثر لملفي'),el('button',{class:'btn g',onclick:()=>{closeSheet();vipFx()}},'رجوع')))}},
    el('b',{},f.n),el('small',{},f.g==='f'?'أنثوي':f.g==='m'?'ذكوري':'خاص بالإمبراطور'))));
  draw();openSheet(el('h3',{},'مؤثرات الملف التعريفي'),el('small',{style:'color:var(--mu)'},'اضغط على أي مؤثر لمعاينته'),grid,
    el('button',{class:'btn g',onclick:async()=>{try{await remove(R('pfx/'+uid));cur=null;closeSheet();toast('تمت إزالة المؤثر')}catch(e){err(e)}}},'إزالة المؤثر'),el('button',{class:'btn g',onclick:closeSheet},'إغلاق'));
}

/* ====================== التصدّر ====================== */
let lbBal=null,lbT=0,gainLog=[];
function trackGain(d){const n=Date.now();gainLog.push([n,d]);gainLog=gainLog.filter(x=>n-x[0]<180000);const s=gainLog.reduce((a,x)=>a+x[1],0);
  if(s>=5000&&n-(+localStorage.getItem('sus_t')||0)>600000){localStorage.setItem('sus_t',String(n));set(R('sus/'+uid),{ts:serverTimestamp(),a:s}).catch(()=>{})}}
function startLb(){
  if(uid===EMP)return;
  cleanup0.push(onValue(R('wallets/'+uid+'/bal'),s=>{const b=s.val()||0;if(lbBal!==null&&b>lbBal)trackGain(b-lbBal);lbBal=b;clearTimeout(lbT);
    lbT=setTimeout(()=>{const u={['lb/'+uid+'/bal']:b},g=myMainG();if(g)u['lb/'+uid+'/g']=g;update(ref(db),u).catch(()=>{})},2500)},()=>{}));
}
async function lbScreen(tab=0){
  const TABS=[['الأكثر مالاً','bal'],['الأكثر خسارة','lost'],['التفاعل','act'],['النقابات','g']];
  const list=el('div',{class:'list'}),tabs=el('div',{class:'lbt'},...TABS.map((t,i)=>el('button',{class:'lbb'+(i===tab?' a':''),onclick:()=>lbScreen(i)},t[0])));
  app$.replaceChildren(el('div',{class:'hdr'},ibtn('back',back),el('h1',{},'التصدر')),tabs,list);
  const f=TABS[tab][1],ring=['#ffd54a','#cfd8dc','#cd7f32'];
  try{
    if(f==='g'){
      const gl=(await get(R('gl'))).val()||{},ids=Object.keys(groups).filter(g=>groups[g].kind==='main').sort((a,b)=>((gl[b]&&gl[b].n)||0)-((gl[a]&&gl[a].n)||0)||((gl[b]&&gl[b].act)||0)-((gl[a]&&gl[a].act)||0));
      if(!ids.length)return list.append(el('div',{class:'empty'},'لا توجد نقابات'));
      ids.forEach((g,i)=>{const ph=el('div',{class:'av'},(groups[g].name||'?')[0]);get(R('groupPhotos/'+g)).then(s=>{if(s.val()){ph.style.backgroundImage=`url(${s.val()})`;ph.textContent=''}}).catch(()=>{});
        list.append(el('div',{class:'lbr'+(i<3?' top':''),style:`--gc:${ex.colorFor(g)}`},el('span',{class:'rk0',style:i<3?'color:'+ring[i]:''},String(i+1)),ph,el('div',{class:'t'},el('b',{},groups[g].name),el('small',{class:'gsoft'},'الأعضاء: '+((gl[g]&&gl[g].n)||0)+' • التفاعل: '+fmtN((gl[g]&&gl[g].act)||0)))))});
      return;
    }
    const s=await get(query(R('lb'),orderByChild(f),limitToLast(30))),arr=[];s.forEach(c=>{const v=c.val();if(v&&v[f]>0&&c.key!==EMP)arr.push([c.key,v])});arr.reverse();arr.length=Math.min(arr.length,25);
    if(!arr.length)return list.append(el('div',{class:'empty'},'لا توجد بيانات بعد'));
    arr.forEach(([u,v],i)=>{const a=avatarP(u,i<3?'l':''),nm=el('b',{},'…'),gn=v.g&&groups[v.g]?el('small',{class:'gsoft',style:'color:'+ex.colorFor(v.g)},groups[v.g].name):null;
      prof(u).then(p=>{nm.textContent=p.name||'عضو'});if(i<3){a.style.border='3px solid '+ring[i];a.style.boxShadow='0 0 14px '+ring[i]}
      list.append(el('div',{class:'lbr'+(i<3?' top':''),style:v.g?`--gc:${ex.colorFor(v.g)}`:''},el('span',{class:'rk0',style:i<3?'color:'+ring[i]:''},String(i+1)),a,el('div',{class:'t'},nm,gn),el('em',{class:'lbv'},fmtN(v[f]))))});
  }catch(e){err(e)}
}
async function resetLb(){
  openSheet(el('h3',{},'تصفير المتصدرين'),el('p',{style:'line-height:1.9;text-align:center'},'سيتم تصفير قوائم الخسارة والتفاعل وتفاعل النقابات. قائمة الأكثر مالاً تعرض الأرصدة الحقيقية ولا تتصفر.'),
    el('div',{style:'display:flex;gap:10px'},el('button',{class:'btn r',style:'flex:1',onclick:async()=>{closeSheet();try{
      const lb=(await get(R('lb'))).val()||{},gl=(await get(R('gl'))).val()||{},up={};
      for(const u of Object.keys(lb)){up[`lb/${u}/lost`]=0;up[`lb/${u}/act`]=0;up[`lb/${u}/won`]=0}
      for(const g of Object.keys(gl))up[`gl/${g}/act`]=0;
      await update(ref(db),up);toast('تم تصفير المتصدرين',false,true)}catch(e){err(e)}}},'تصفير'),el('button',{class:'btn g',style:'flex:1',onclick:closeSheet},'إلغاء')));
}
async function monitorWallets(){ // مراقبة المطورين: جمع 5000 بسرعة
  const snap=monitorWallets.s||(monitorWallets.s=new Map());let all={};try{all=(await get(R('profiles'))).val()||{}}catch(e){return}
  const n=Date.now();
  for(const u of Object.keys(all)){if(u===uid)continue;let b=null;try{b=(await get(R('wallets/'+u+'/bal'))).val()}catch(e){continue}if(b==null)continue;
    const h=(snap.get(u)||[]).filter(x=>n-x[0]<300000);h.push([n,b]);snap.set(u,h);
    const mn=Math.min(...h.map(x=>x[1]));
    if(b-mn>=5000){const lk='sus_'+u;if(n-(+localStorage.getItem(lk)||0)>900000){localStorage.setItem(lk,String(n));set(R('sus/'+u),{ts:serverTimestamp(),a:b-mn}).catch(()=>{})}}}
}
async function syncGuildCounts(){
  for(const g of Object.keys(groups).filter(g=>groups[g].kind==='main')){try{const m=(await get(R('members/'+g))).val()||{};await update(ref(db),{[`gl/${g}/n`]:Object.keys(m).filter(u=>m[u]===true).length})}catch(e){}}
}

/* ====================== الهدية اليومية والروليت ====================== */
async function claimGift(){
  try{
    const d=(await get(R('daily/'+uid))).val(),n=nowS();
    if(d&&n-d.ts<72000000){const left=72000000-(n-d.ts);return toast('هديتك التالية بعد '+mmssF(left),true)}
    const s=d&&n-d.ts<=172800000?Math.min(10,(d.s||0)+1):1,amt=Math.min(100,10*s);
    await update(ref(db),{['daily/'+uid]:{ts:serverTimestamp(),s},['wallets/'+uid+'/bal']:increment(amt),['wallets/'+uid+'/ts']:serverTimestamp()});
    giftPop(amt,s);
  }catch(e){err(e)}
}
function giftPop(amt,s){
  const{o,close}=overlayBox('',el('div',{class:'giftp'},el('div',{class:'gbox'},ic('gift',72)),el('h2',{},'+'+amt+' رصيد'),s?el('p',{},'سلسلة الأيام المتواصلة: '+s+(s<10?' • غداً '+Math.min(100,10*(s+1)):' • الحد الأقصى')):el('p',{},'لفتك القادمة بعد 12 ساعة'),el('button',{class:'btn',onclick:()=>close()},'رائع')));
  sfx('click');
}
async function roulScreen(){
  const PR=[10,20,30,40,50,60,70,80,90,100],cols=['#e53935','#8e24aa','#3949ab','#1e88e5','#00897b','#43a047','#f9a825','#ef6c00','#d81b60','#546e7a'];
  const S=Math.min(320,innerWidth-40),cv=el('canvas',{width:S*2,height:S*2,style:`width:${S}px;height:${S}px;border-radius:50%;box-shadow:0 0 30px rgba(var(--acr),.55)`}),c=cv.getContext('2d');
  const R0=S-6;c.translate(S,S);
  PR.forEach((p,i)=>{const a0=i*Math.PI/5-Math.PI/2,a1=a0+Math.PI/5;c.beginPath();c.moveTo(0,0);c.arc(0,0,R0,a0,a1);c.closePath();c.fillStyle=cols[i];c.fill();c.strokeStyle='#fff3';c.lineWidth=3;c.stroke();
    c.save();c.rotate((a0+a1)/2);c.fillStyle='#fff';c.font='bold '+Math.round(S*.12)+'px sans-serif';c.textAlign='right';c.textBaseline='middle';c.fillText(String(p),R0-14,0);c.restore()});
  c.beginPath();c.arc(0,0,S*.12,0,7);c.fillStyle='#1b0a04';c.fill();c.strokeStyle='#fff';c.lineWidth=4;c.stroke();
  const wheel=el('div',{class:'whl',style:`width:${S}px;height:${S}px`},cv),info=el('div',{class:'ovi'}),btn=el('button',{class:'btn glowbtn',style:'width:100%'},'لف العجلة');
  let rot=0,busy=false;
  const status=async()=>{try{const d=(await get(R('roul/'+uid))).val(),left=d?43200000-(nowS()-d.ts):0;
    if(left>0){info.textContent='اللفة التالية بعد '+mmssF(left);btn.disabled=true;const tk=setInterval(()=>{if(!info.isConnected)return clearInterval(tk);const l=43200000-(nowS()-d.ts);if(l<=0){clearInterval(tk);info.textContent='لفتك جاهزة';btn.disabled=false}else info.textContent='اللفة التالية بعد '+mmssF(l)},1000)}
    else{info.textContent='لديك لفة واحدة كل 12 ساعة';btn.disabled=false}}catch(e){}};
  btn.onclick=async()=>{
    if(busy)return;busy=true;btn.disabled=true;
    const i=Math.floor(Math.random()*10),p=PR[i];
    try{await update(ref(db),{['roul/'+uid]:{ts:serverTimestamp(),p},['wallets/'+uid+'/bal']:increment(p),['wallets/'+uid+'/ts']:serverTimestamp()})}catch(e){busy=false;err(e);status();return}
    rot+=360*6+(360-(i*36+18))-((rot%360));wheel.firstChild.style.transition='transform 5s cubic-bezier(.12,.7,.1,1)';wheel.firstChild.style.transform=`rotate(${rot}deg)`;
    await sl(5200);info.textContent='ربحت '+p+' رصيد';sfx('click');giftPop(p,0);busy=false;status();
  };
  app$.replaceChildren(el('div',{class:'hdr'},ibtn('back',back),el('h1',{},'عجلة الروليت')),el('div',{class:'list',style:'display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px'},el('div',{class:'ptr'}),wheel,info,btn));
  status();
}

/* ====================== خاص الإمبراطور: دمج النقابات ====================== */
async function mergeScreen(){
  if(!isEmp()){go('');return}
  const sel=new Set(),list=el('div',{class:'list'}),btn=el('button',{class:'btn glowbtn',style:'margin:10px;display:none',onclick:()=>mergeSheet([...sel])},'دمج');
  const ids=Object.keys(groups).filter(g=>groups[g].kind==='main');
  const draw=()=>{list.replaceChildren(...ids.map(g=>el('div',{class:'row',style:sel.has(g)?'background:rgba(var(--acr),.22)':'',onclick:()=>{if(sel.has(g))sel.delete(g);else if(sel.size<2)sel.add(g);btn.style.display=sel.size===2?'block':'none';draw()}},
    el('div',{class:'av s'},(groups[g].name||'?')[0]),el('div',{class:'t'},el('b',{},groups[g].name)),sel.has(g)?ic('check',22):null)));if(!ids.length)list.append(el('div',{class:'empty'},'لا توجد نقابات'))};draw();
  app$.replaceChildren(el('div',{class:'hdr'},ibtn('back',back),el('h1',{},'دمج النقابات')),el('small',{style:'padding:8px 14px;color:var(--mu)'},'حدد نقابتين ثم اضغط دمج'),list,btn);
}
function mergeSheet([A,B]){
  const nm=el('input',{placeholder:'الاسم الجديد للنقابة',maxlength:'40'});let img=null;
  const pb=el('button',{class:'btn g',onclick:async()=>{if(!(await askPerm('media')))return;const f=await pickFile('image/*');if(!f)return;const d=await cropImage(f,{out:[200,160,120],limit:29000,title:'صورة النقابة'});if(d){img=d;pb.textContent='تم اختيار الصورة'}}},'اختيار صورة');
  openSheet(el('h3',{},`دمج «${groups[A].name}» مع «${groups[B].name}»`),nm,pb,el('button',{class:'btn',onclick:async()=>{
    const name=nm.value.trim();if(!name)return toast('اكتب الاسم الجديد',true);closeSheet();
    try{await doMerge(A,B,name,img);toast('تم دمج النقابتين',false,true);await loadGroups();go('')}catch(e){err(e)}}},'دمج'),el('button',{class:'btn g',onclick:closeSheet},'إلغاء'));
}
async function doMerge(A,B,name,img){
  const g=p=>get(R(p)).then(s=>s.val()||{}).catch(()=>({}));
  const[mA,mB,adB,gsA,gsB,ppB,gpB,bioB,bioA]=await Promise.all([g('members/'+A),g('members/'+B),g('groupAdmins/'+B),g('guildStats/'+A),g('guildStats/'+B),g('pubPerm/'+B),g('gamePerm/'+B),g('groupBios/'+B),g('groupBios/'+A)]);
  const up={};
  for(const u of Object.keys(mB)){if(mA[u]!==true)up[`members/${A}/${u}`]=mB[u];up[`members/${B}/${u}`]=null}
  for(const u of Object.keys(adB)){up[`groupAdmins/${A}/${u}`]=true;up[`groupAdmins/${B}/${u}`]=null}
  for(const u of Object.keys(ppB)){const c=ppB[u];up[`refCodes/${c}/g`]=A;up[`pubPerm/${A}/${u}`]=c;up[`pubPerm/${B}/${u}`]=null}
  for(const u of Object.keys(gpB)){up[`gamePerm/${A}/${u}`]=true;up[`gamePerm/${B}/${u}`]=null}
  for(const u of Object.keys(bioB)){if(!bioA[u])up[`groupBios/${A}/${u}`]=bioB[u];up[`groupBios/${B}/${u}`]=null}
  const atk=Math.min(9999,(gsA.atk||1)+(gsB.atk||1)),def=Math.min(9999,(gsA.def||1)+(gsB.def||1));
  const con={...(gsA.contrib||{})};for(const u of Object.keys(gsB.contrib||{}))con[u]=(con[u]||0)+gsB.contrib[u];
  up[`guildStats/${A}`]={atk,def,...(Object.keys(con).length?{contrib:con}:{})};up[`guildStats/${B}`]=null;
  up[`groups/${A}/name`]=name;if(img)up[`groupPhotos/${A}`]=img;
  up[`groups/${B}`]=null;up[`groupPhotos/${B}`]=null;up[`stats/${B}`]=null;up[`activeWar/${B}`]=null;up[`gl/${B}`]=null;
  await update(ref(db),up);
  await remove(R('messages/'+B)).catch(()=>{});
  const news=Object.keys(groups).find(x=>groups[x].kind==='news');
  if(news)ex.notify('news',`🤝 اندمجت النقابتان في نقابة «${name}»`,'note');
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
async function send(gid,gm,t,o){
  o=o||{};const k=push(R('messages/'+gid)).key,bs=gm.kind==='main'?await boost():false;
  const m={from:U(),type:'text',text:t,ts:serverTimestamp(),color:ME().color||'#ff7a1a'};
  for(const f of['rp','mn','all','blur','tcol','vip','emp'])if(o[f]!==undefined)m[f]=o[f];
  if(C.mem()[gid]==='v')m.vis=true;
  const up={[`messages/${gid}/${k}`]:m};
  if(gm.kind==='main')up[`stats/${gid}/${U()}`]=increment(bs?2:1);
  await update(ref(db),up);
  side(gid,gm,o,t);
  if(/^\.[ء-يa-zA-Z]/.test(t))command(gid,gm,t,o);
}
function side(gid,gm,o,t){ // عمليات جانبية لا تعطل الإرسال
  update(ref(db),{[`gl/${gid}/cnt`]:increment(1)}).catch(()=>{});
  if(gm.kind==='main'&&!C.isEmp()){const u={};u[`lb/${U()}/act`]=increment(1);u[`gl/${gid}/act`]=increment(1);const g=myMains()[0];if(g)u[`lb/${U()}/g`]=g;update(ref(db),u).catch(()=>{})}
  if(o&&(o.mn||o.all)){const up={},nm=gname(gid);
    if(o.all){get(R('members/'+gid)).then(s=>{const ms=s.val()||{},u2={};for(const x of Object.keys(ms))if(x!==U())u2[`notifs/${x}/${push(R('x')).key}`]={t:'men',from:U(),g:gid,m:nm,ts:serverTimestamp()};return update(ref(db),u2)}).catch(()=>{})}
    else{for(const x of Object.keys(o.mn))up[`notifs/${x}/${push(R('x')).key}`]={t:'men',from:U(),g:gid,m:nm,ts:serverTimestamp()};update(ref(db),up).catch(()=>{})}}
}
async function sendRaw(gid,gm,payload,count){
  const k=push(R('messages/'+gid)).key,m={from:U(),ts:serverTimestamp(),color:ME().color||'#ff7a1a',...payload};
  if(C.mem()[gid]==='v')m.vis=true;
  const up={[`messages/${gid}/${k}`]:m};
  if(gm.kind==='main'&&count)up[`stats/${gid}/${U()}`]=increment(1);
  await update(ref(db),up);side(gid,gm,null,'');
}
const CMD={};
async function command(gid,gm,text,o){
  const[c,...args]=text.slice(1).trim().split(/\s+/),f=CMD[c];
  if(!f)return bot(gid,'❌ الأمر غير موجود. اكتب ‎.اوامر‎ لعرض القائمة');
  if(GAME.has(c)&&!(await canPlay(gid)))return bot(gid,'🎮 ليس لديك صلاحية الألعاب. اطلب من مشرف منحك إياها.');
  try{await f(gid,gm,args,o)}catch(e){err(e)}
}
const GAME=new Set(['العاب','بالونات','اعلام','كتابة','الوان','تفكيك','حدس']);
async function canPlay(gid){const gm=C.groups()[gid]||{};if(C.isDev()||gm.gamesAll)return true;
  const[p,a]=await Promise.all([get(R(`gamePerm/${gid}/${U()}`)).catch(()=>null),get(R(`groupAdmins/${gid}/${U()}`)).catch(()=>null)]);return!!((p&&p.exists())||(a&&a.exists()))}
const home=gid=>myMains()[0]||gid;
CMD['اوامر']=(gid)=>bot(gid,'╮─❖『 أوامر ALJESI 』❖─╭\n.تفاصيلي — بطاقتك\n.رصيدي — رصيدك\n.العاب — قائمة الألعاب\n.كريستال [مبلغ] — لعبة الكريستال\n.بالونات — لعبة البالونات\n.اعلام — تخمين الأعلام\n.كتابة — سرعة الكتابة\n.الوان — لعبة الألوان\n.تحويل — تحويل رصيد لعضو\n.المتصدرين — متصدرو اليوم\n.المتجر — فتح المتجر\n╰─❖『 ALJESI 』❖─╯');
CMD['رصيدي']=async gid=>bot(gid,'💰 رصيدك الحالي: '+fmt(await balance()));
CMD['تفاصيلي']=async(gid,gm)=>{
  const u=U(),mg=gm.kind==='main'?gid:home(gid);
  const[b,st,inv,bo,pp,vs,rk]=await Promise.all([balance(),get(R(`stats/${mg}/${u}`)).catch(()=>null),get(R('inv/'+u+'/upg')),boost(),get(R(`pubPerm/${mg}/${u}`)).catch(()=>null),get(R('visit/'+u)),get(R('rankt/'+u)).catch(()=>null)]);
  const r=await roleOf(u),adm=(await get(R('groupAdmins/'+mg)).catch(()=>null)),isE=r==='emp';
  const rank=(rk&&rk.val())||(isE?'الإمبراطور':r==='dev'?'رتبة عليا':(adm&&adm.val()&&adm.val()[u])?'مشرف':'عضو');
  const rows=[['اللقب',ME().name],['الرتبة',rank],['النقابة',gname(mg)],['الرصيد',isE?'__INF__':fmt(b)],['رسائل اليوم',String((st&&st.val())||0)],['بطاقات الترقية',String(inv.val()||0)],['المضاعفة',bo?'مفعّلة':'غير مفعّلة']];
  if(pp&&pp.val())rows.push(['رمز النشر',pp.val()]);if(vs.val())rows.push(['زائر في',gname(vs.val().g)]);
  await botFull(gid,{text:'تفاصيلي',d:JSON.stringify({card:1,t:'det',rows,c:colorFor(mg),emp:isE})});
};
CMD['رصيد']=async(gid,gm,a,o)=>{
  if(!C.isDev())return bot(gid,'هذا الأمر للمطورين والإمبراطور فقط');
  const ts=Object.keys((o&&o.mn)||{}),n=Math.floor(Number(a.filter(x=>/^\d+$/.test(x)).pop()));
  if(!ts.length||!(n>0))return bot(gid,'الصيغة: ‎.رصيد @عضو 50‎ (استخدم زر @ لاختيار العضو)');
  for(const t of ts){
    await update(ref(db),{[`wallets/${t}/bal`]:increment(n)});
    const[bl,tp,lg]=await Promise.all([get(R(`wallets/${t}/bal`)).then(s=>s.val()||0).catch(()=>0),prof(t),get(R(`lb/${t}/g`)).then(s=>s.val()).catch(()=>null)]);
    notifTo(t,{t:'tr',a:n});
    shopTx({to:tp.name||'عضو',from:ME().name,g:lg?gname(lg):'—',a:n,bal:bl});
  }
  bot(gid,'تم إرسال '+fmt(n)+' رصيد');
};
CMD['رتبته']=async(gid,gm,a,o)=>{
  if(!C.isDev())return bot(gid,'هذا الأمر للمطورين والإمبراطور فقط');
  const mn=(o&&o.mn)||{},t=Object.keys(mn)[0];if(!t)return bot(gid,'الصيغة: ‎.رتبته @عضو الرتبة‎');
  const title=a.join(' ').replace('@'+mn[t],'').trim().slice(0,24);if(!title)return bot(gid,'اكتب الرتبة بعد المنشن');
  if(title==='ازالة'){await remove(R('rankt/'+t));return bot(gid,'تمت إزالة الرتبة المخصصة')}
  await set(R('rankt/'+t),title);bot(gid,'تم تعيين رتبة «'+title+'» لـ '+mn[t]);
};
async function shopTx(d){const g=feed('shop');if(!g)return;try{await set(push(R('messages/'+g)),{from:U(),type:'sys',k:'tx',text:'تحويل رصيد',d:JSON.stringify({card:1,t:'tx',...d}),ts:serverTimestamp()})}catch(e){}}
CMD['المتصدرين']=async(gid,gm)=>{
  const mg=gm.kind==='main'?gid:home(gid),s=(await get(R('stats/'+mg)).catch(()=>null));
  const ents=Object.entries((s&&s.val())||{}).filter(([u])=>u!==C.EMP()).sort((a,b)=>b[1]-a[1]).slice(0,10);
  if(!ents.length)return bot(gid,'لا يوجد تفاعل اليوم بعد');
  const names=await Promise.all(ents.map(([u])=>prof(u)));
  bot(gid,'🏆 متصدرو '+gname(mg)+' اليوم:\n'+ents.map(([u,c],i)=>(['🥇','🥈','🥉'][i]||(i+1)+'.')+' '+names[i].name+' — '+c).join('\n'));
};
CMD['العاب']=async gid=>gamesSheet(gid);
CMD['اعلام']=(gid,gm)=>startQuiz(gid,gm,'flg');
CMD['كتابة']=(gid,gm)=>startQuiz(gid,gm,'typ');
CMD['تفكيك']=(gid,gm)=>startQuiz(gid,gm,'spl');
CMD['الوان']=(gid,gm)=>startQuiz(gid,gm,'col');
CMD['حدس']=(gid,gm)=>startIntuition(gid,gm);
CMD['كريستال']=(gid,gm,a)=>crystalUI(gid,gm,Number(a[0])||50);
CMD['بالونات']=(gid,gm)=>startBalloons(gid,gm);
CMD['تحويل']=(gid,gm)=>transferSheet(gid,gm);
CMD['المتجر']=()=>go('shop');
/* ---------- واجهات الألعاب ---------- */
function overlay(title){
  const ov=el('div',{class:'ov'}),body=el('div',{class:'ovb'}),close=()=>ov.remove();
  ov.append(el('button',{class:'ib ovx',onclick:close},'✕'),el('h2',{},title),body);document.body.append(ov);return{body,close};
}
async function showBal(e){e.textContent='💰 '+fmt(await balance())}

/* ====================== الألعاب الجديدة ====================== */
const nrm=s=>String(s||'').replace(/[\u064B-\u065F\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/\s+/g,' ').trim().toLowerCase();
const ANI1=['ليفاي','ناروتو','ساسكي','ساكورا','كاكاشي','هيناتا','ايتاتشي','جيرايا','لوفي','زورو','سانجي','نامي','اوسوب','روبن','غوكو','فيجيتا','غوهان','كريلين','بولما','ايرين','ميكاسا','ارمين','راينر','هيتشو','ايتشيغو','روكيا','غون','كيلوا','كورابيكا','ليورايو','ديكو','كاتسوكي','اوتشاكو','تودوروكي','تانجيرو','نيزوكو','زينيتسو','اينوسكي','غيو','رينغوكو','شينوبو','ساتورو','يوجي','ميغومي','ايس','سابو','شانكس','لايت','ريوك','ميسا'];
const ANI2=['ناروتو اوزوماكي','ساسكي اوتشيها','ايتاتشي اوتشيها','كاكاشي هاتاكي','هيناتا هيوغا','ساكورا هارونو','ميناتو نامكازي','مدارا اوتشيها','اوبيتو اوتشيها','ناغاتو بين','تسونادي سينجو','شيكامارو نارا','نيجي هيوغا','روك لي','مايتو غاي','كيبا اينوزوكا','مونكي لوفي','رورونوا زورو','فينسموك سانجي','نيكو روبن','بورتغاس ايس','ادوارد نيوغيت','تراغالغار لو','دونكيشوت دوفلامينغو','سون غوكو','سون غوهان','سون غوتن','بولما بريفس','تيان شينهان','ايرين ييغر','ميكاسا اكرمان','ارمين ارليرت','ليفاي اكرمان','ايرفين سميث','هانجي زوي','راينر براون','اني ليونهارت','زيك ييغر','ساشا براوس','كوني سبرينغر','جان كيرشتاين','لايت ياغامي','ايل لولييت','ميسا اماني','تانجيرو كامادو','نيزوكو كامادو','زينيتسو اغاتسوما','اينوسكي هاشيبيرا','غيو تومييوكا','كيوجورو رينغوكو','شينوبو كوتشو','موزان كيبوتسوجي','يوجي ايتادوري','ميغومي فوشيغورو','ساتورو غوجو','نوبارا كوغيساكي','ريومين سوكونا','ماكي زينين','توجي فوشيغورو','ايزوكو ميدوريا','كاتسوكي باكوغو','شوتو تودوروكي','اوراراكا اوتشاكو','تينيا ايدا','ايجيرو كيرشيما','غون فريكس','كيلوا زولديك','ليورايو باراديناي','هيسوكا موراو','ايتشيغو كوروساكي','روكيا كوتشيكي','بياكويا كوتشيكي','رينجي ابراي','ادوارد ايلريك','الفونس ايلريك','روي موستانغ','وينري روكبيل','سوبارو ناتسوكي','كازوما ساتو','كيريتو كيريغايا','اسونا يوكي','غينتوكي ساكاتا','جوتارو كوجو','جوسكي هيغاشيكاتا','ديو براندو'];
const CCODES='SA السعودية|EG مصر|SY سوريا|IQ العراق|JO الاردن|LB لبنان|PS فلسطين|AE الامارات|QA قطر|KW الكويت|BH البحرين|OM عمان|YE اليمن|LY ليبيا|TN تونس|DZ الجزائر|MA المغرب|SD السودان|SO الصومال|MR موريتانيا|DJ جيبوتي|KM جزر القمر|TR تركيا|IR ايران|AF افغانستان|PK باكستان|IN الهند|BD بنغلاديش|CN الصين|JP اليابان|KR كوريا الجنوبية|KP كوريا الشمالية|TH تايلاند|VN فيتنام|ID اندونيسيا|MY ماليزيا|PH الفلبين|SG سنغافورة|AU استراليا|NZ نيوزيلندا|RU روسيا|UA اوكرانيا|PL بولندا|DE المانيا|FR فرنسا|IT ايطاليا|ES اسبانيا|PT البرتغال|NL هولندا|BE بلجيكا|CH سويسرا|AT النمسا|SE السويد|NO النرويج|DK الدنمارك|FI فنلندا|GB بريطانيا|IE ايرلندا|GR اليونان|HU المجر|CZ التشيك|RO رومانيا|BG بلغاريا|RS صربيا|HR كرواتيا|US امريكا|CA كندا|MX المكسيك|BR البرازيل|AR الارجنتين|CL تشيلي|CO كولومبيا|PE بيرو|VE فنزويلا|CU كوبا|ZA جنوب افريقيا|NG نيجيريا|KE كينيا|ET اثيوبيا|GH غانا|SN السنغال|KZ كازاخستان|AZ اذربيجان|GE جورجيا|AM ارمينيا'.split('|').map(x=>{const[c,...n]=x.split(' ');return[String.fromCodePoint(...[...c].map(ch=>0x1F1A5+ch.charCodeAt(0))),n.join(' ')]});
const FLAGS=CCODES;
const CLR=[['احمر','#e53935'],['ازرق','#1e88e5'],['اخضر','#43a047'],['اصفر','#fdd835'],['برتقالي','#fb8c00'],['بنفسجي','#8e24aa'],['وردي','#ec407a'],['بني','#8d6e63'],['رمادي','#9e9e9e'],['ابيض','#fafafa'],['اسود','#37474f'],['سماوي','#26c6da']];
const GM={
 typ:{n:'الكتابة',icon:'edit',intro:'فعالية الكتابة بكل بساطة انا سأرسل\nلكم اسم شخصية انمي وانتم اعيدو\nارسال الكلمة. والهدف هو 10 اجابات\nصحيحة',lab:'الكلمة',gen:()=>{const w=pick([...ANI1,...ANI2]);return{show:w,ans:[w]}},chk:(t,r)=>nrm(t)===nrm(r.show)},
 spl:{n:'التفكيك',icon:'list',intro:'فعالية التفكيك بكل بساطة انا سأرسل\nلكم اسم شخصية انمي وانتم فككوا حروفه\nمثال: ناروتو ← ن ا ر و ت و\nوالهدف هو 10 اجابات صحيحة',lab:'فكك',gen:()=>{const w=pick([...ANI1,...ANI2]);return{show:w,ans:[w]}},
   chk:(t,r)=>{const toks=nrm(t).split(' ');return toks.length>1&&toks.every(x=>[...x].length===1)&&toks.join('')===nrm(r.show).replace(/ /g,'')}},
 col:{n:'الألوان',icon:'palette',intro:'فعالية الألوان بكل بساطة انا سأرسل\nلكم غيمة بلون معين وانتم اكتبوا\nاسم اللون. والهدف هو 10 اجابات\nصحيحة',lab:'اللون',gen:()=>{const c=pick(CLR);return{show:c[0],c:c[1]}},chk:(t,r)=>{const n=nrm(t),g=nrm(r.show);return n===g||n.startsWith(g+' ')||(g==='ازرق'&&/^ازرق/.test(n))||(g==='سماوي'&&/^(ازرق )?(سماوي|فاتح)|^ازرق فاتح/.test(n))}},
 flg:{n:'الأعلام',icon:'flag',intro:'فعالية الأعلام بكل بساطة انا سأرسل\nلكم علم دولة وانتم اكتبوا اسم الدولة.\nوالهدف هو 10 اجابات صحيحة',lab:'العلم',gen:()=>{const f=pick(FLAGS);return{show:f[1],f:f[0]}},chk:(t,r)=>nrm(t)===nrm(r.show)}
};
const BALLS=['🟤','🟣','🟢','⚫','🔴','🔵','🟠','🟡','⚪'];
const homeG=()=>myMains()[0];
const myGuildName=()=>{const g=homeG();return g?gname(g):'—'};

/* ---- بطاقات النظام (تزيين) ---- */
const decor=(c,mid='')=>el('div',{class:'dcr',style:`--gc:${c}`},'◆━─━─━─⊱'+mid+'⊰─━─━─━◆');
const DECO2='❆━━━━━═⏣⊰🎮⊱⏣═━━━━━❆';
async function botCard(gid,d,text){try{await set(push(R('messages/'+gid)),{from:U(),type:'sys',k:'bot',f:ME().name,text:text||'بطاقة',d:JSON.stringify(d),ts:serverTimestamp()})}catch(e){}}
async function botFull(gid,extra){try{await set(push(R('messages/'+gid)),{from:U(),type:'sys',k:'bot',f:ME().name,ts:serverTimestamp(),...extra})}catch(e){}}
async function announce(o){ // رسالة في شات الإعلانات
  const g=feed('ads');if(!g)return;
  try{await set(push(R('messages/'+g)),{from:U(),type:'sys',k:'cry',text:`${o.n} ${o.w?'فاز':'خسر'} في ${o.game} بمبلغ ${o.a}`,d:JSON.stringify({card:1,t:'cry',u:U(),n:o.n,a:o.a,w:o.w,gm:o.game,gc:homeG()||'',gn:myGuildName(),c:colorFor(homeG()||'')}),ts:serverTimestamp()})}catch(e){}
}
const lbBump=(f,n)=>{if(n>0)update(ref(db),{[`lb/${U()}/${f}`]:increment(n)}).catch(()=>{})};
async function claimReward(a){try{await addBalRetry(a);toast('تمت إضافة '+a+' إلى رصيدك',false,true)}catch(e){}}

/* ---- محرك الفعاليات (الكتابة/التفكيك/الألوان/الأعلام) ---- */
let HOST=null;
async function gameActive(gid){try{const g=(await get(R('games/'+gid))).val();return g&&g.s!=='end'&&Date.now()-(g.ts||0)<1800000?g:null}catch(e){return null}}
const setLock=(gid,v)=>set(R(`groups/${gid}/locked`),v).catch(()=>{});
async function endHost(gid,quiet){
  if(!HOST||HOST.gid!==gid)return;const h=HOST;HOST=null;
  try{h.unsub&&h.unsub()}catch(e){}clearTimeout(h.tm);
  try{await setLock(gid,h.prevLock);await remove(R('games/'+gid))}catch(e){}
  if(!quiet)bot(gid,'تم إنهاء الفعالية');
}
async function startQuiz(gid,gm,kind){
  if(HOST)return toast('لديك فعالية قائمة، اكتب ‎.انهاء‎ لإنهائها',true);
  if(await gameActive(gid))return toast('هناك فعالية قائمة في هذه النقابة',true);
  const G=GM[kind],c=colorFor(gid);let prev=!!(gm.locked);
  HOST={gid,kind,prevLock:prev,score:{},cur:null,round:0};
  try{await set(R('games/'+gid),{t:kind,by:U(),s:'run',ts:Date.now(),v:''});await setLock(gid,true)}catch(e){HOST=null;return err(e)}
  C.onLeave(()=>endHost(gid,true));
  await botCard(gid,{card:1,t:'intro',ic:G.icon,n:G.n,c},DECO2+'\n'+G.intro);
  await sleep(6000);if(!HOST)return;
  await setLock(gid,false);
  const marker=push(R('messages/'+gid)).key;
  HOST.unsub=onChildAdded(query(R('messages/'+gid),orderByKey(),startAt(marker)),s=>{const m=s.val();if(m&&m.type==='text'&&HOST&&HOST.gid===gid)answer(gid,gm,s.key,m)});
  nextRound(gid,gm);
}
function nextRound(gid,gm){
  if(!HOST)return;const G=GM[HOST.kind];HOST.cur=G.gen();HOST.cur.done=false;HOST.round++;
  const r=HOST.cur;botCard(gid,{card:1,t:'round',k:HOST.kind,lab:G.lab,show:r.show,c:r.c||'',f:r.f||'',gc:colorFor(gid)},`${G.lab}: ${r.f||r.show}`);
  clearTimeout(HOST.tm);const rd=HOST.round;HOST.tm=setTimeout(()=>{if(HOST&&HOST.round===rd&&!HOST.cur.done){HOST.miss=(HOST.miss||0)+1;if(HOST.miss>=6){bot(gid,'انتهت الفعالية لقلة التفاعل');return endHost(gid,true)}bot(gid,'⏭ الإجابة كانت: '+r.show+' — جولة جديدة!');nextRound(gid,gm)}},45000);
}
async function answer(gid,gm,id,m){
  const h=HOST;if(!h||!h.cur||h.cur.done)return;const G=GM[h.kind];
  if(!G.chk(m.text,h.cur))return;
  h.cur.done=true;h.miss=0;clearTimeout(h.tm);
  const n=(h.score[m.from]=(h.score[m.from]||0)+1);
  update(R(`messages/${gid}/${id}`),{ok:n+'/10'}).catch(()=>{});
  if(n<10){await sleep(900);return nextRound(gid,gm)}
  const p=await prof(m.from),c=colorFor(gid);
  await botFull(gid,{text:`مبروك للفائز ${p.name} — تمت إضافة 35 إلى رصيده`,d:JSON.stringify({card:1,t:'win',n:p.name,a:35,c}),w:m.from,a:35});
  announce({n:p.name,a:35,w:1,game:'فعالية '+G.n}).catch(()=>{});
  // الإعلان يُرسل باسم المنشئ؛ نحدد اللاعب الفائز في الاسم
  await sleep(1500);endHost(gid,true);
}

/* ---- الكريستال ---- */
const CEM=['💎','🏆','⭐','🔮','💣','💩'];
const PATTERNS=[
 {p:['💎','💎','💎','💎'],m:5,r:'win',w:2},{p:['⭐','⭐','⭐','⭐'],m:4,r:'win',w:3},{p:['🏆','🏆','🏆','🏆'],m:3,r:'win',w:5},
 {p:['💎','💎','💎','⭐'],m:2,r:'win',w:8},{p:['⭐','⭐','🔮','🔮'],m:1.5,r:'win',w:10},{p:['🔮','🔮','🏆','🏆'],m:1.3,r:'win',w:10},
 {p:['💎','⭐','💎','⭐'],m:1,r:'retry',w:12},{p:['💣','💩','💣','💩'],m:0,r:'lose',w:25},{p:['💩','💣','💩','💩'],m:0,r:'lose',w:25}];
function pickPattern(){let t=PATTERNS.reduce((s,x)=>s+x.w,0),r=Math.random()*t;for(const x of PATTERNS){if((r-=x.w)<0)return x}return PATTERNS[PATTERNS.length-1]}
async function cryState(){const d=(await get(R('cry/'+U()))).val(),n=nowS();if(!d||n-d.w>=600000)return{d:null,left:3,reset:0};return{d,left:Math.max(0,3-d.n),reset:d.w+600000-n}}
function crystalUI(gid,gm,preset){
  const o=overlay('💎 كريستال');let busy=false,left=3,rt=null;
  const slots=[0,1,2,3].map(()=>el('div',{class:'slot'},'❔')),bet=el('input',{type:'number',inputmode:'numeric',value:String(Math.min(500,Math.max(10,preset||50)))});
  const balEl=el('div',{class:'bal'},'…'),cnt=el('div',{class:'cdc'},'…'),info=el('div',{class:'ovi'},'الرهان من 10 إلى 500 • ربح حتى ×5'),big=el('div',{class:'bigwin'}),btn=el('button',{class:'btn',onclick:play},'ابدأ اللف');
  o.body.append(balEl,cnt,el('div',{class:'slots'},slots),big,bet,btn,info);showBal(balEl);
  async function refresh(){
    try{const s=await cryState();left=s.left;cnt.textContent=left+'/3';cnt.classList.toggle('z',left===0);clearInterval(rt);
      if(left===0){btn.disabled=true;const endAt=Date.now()+s.reset;rt=setInterval(()=>{if(!cnt.isConnected)return clearInterval(rt);const rem=Math.max(0,endAt-Date.now());info.textContent='يرجى الانتظار: '+mmss(rem);if(rem<=0){clearInterval(rt);refresh()}},500)}
      else btn.disabled=false}catch(e){}
  }
  refresh();
  async function play(){
    if(busy)return;const b=Math.floor(Number(bet.value));if(!(b>=10&&b<=500))return toast('الرهان من 10 إلى 500',true);
    busy=true;btn.disabled=true;big.textContent='';
    let st;try{st=await cryState()}catch(e){busy=false;return err(e)}
    if(st.left<=0){busy=false;refresh();return toast('يرجى الانتظار',true)}
    try{const cur=await balance();if(cur<b)throw new Error('low');
      await update(ref(db),{['wallets/'+U()+'/bal']:increment(-b),['cry/'+U()]:st.d?{w:st.d.w,n:st.d.n+1}:{w:serverTimestamp(),n:1}})}
    catch(e){toast(String(e.message)==='low'?'رصيدك لا يكفي':'تعذر بدء اللعبة',true);busy=false;refresh();return}
    showBal(balEl);const res=pickPattern();slots.forEach(s=>{delete s.dataset.done;s.classList.remove('stop')});
    const au=sfx('cres');const iv=setInterval(()=>slots.forEach(s=>{if(!s.dataset.done)s.textContent=rnd(CEM)}),70);
    slots.forEach((s,i)=>setTimeout(()=>{s.dataset.done=1;s.textContent=res.p[i];s.classList.add('stop')},1500+i*500));
    await sleep(3050);clearInterval(iv);stopSfx(au);
    const pay=res.r==='win'?Math.round(b*res.m):res.r==='retry'?b:0;
    if(pay>0){try{await addBalRetry(pay)}catch(e){toast('تعذر إضافة الربح، تواصل مع مطور',true)}}
    showBal(balEl);const net=pay-b;
    info.textContent=res.r==='win'?'ربحت':res.r==='retry'?'استرجعت رهانك':'خسرت';
    big.textContent=net>0?'+'+fmt(net):net===0?'0':'-'+fmt(-net);big.className='bigwin '+(net>0?'w':net<0?'l':'');
    if(res.r==='win'){announce({n:ME().name,a:fmt(net),w:1,game:'الكريستال'});lbBump('won',net)}
    else if(res.r==='lose'){announce({n:ME().name,a:fmt(b),w:0,game:'الكريستال'});lbBump('lost',b)}
    busy=false;refresh();
  }
}
/* ---- قائمة الألعاب ---- */
async function gamesSheet(gid){
  const gm=C.groups()[gid],ok=await canPlay(gid);
  const B=(icn,t,f,locked)=>el('button',{class:'btn gb'+(locked?' lk':''),onclick:()=>{if(locked)return toast('يجب منحك صلاحيات!',true);closeSheet();f()}},ic(icn,24),el('span',{},t),locked?el('i',{class:'chn'},ic('chain',22)):null);
  openSheet(el('h3',{},'اختر لعبة'),B('sparkle0','كريستال',()=>crystalUI(gid,gm,50),false),
    B('edit','الكتابة',()=>startQuiz(gid,gm,'typ'),!ok),B('list','التفكيك',()=>startQuiz(gid,gm,'spl'),!ok),B('palette','الألوان',()=>startQuiz(gid,gm,'col'),!ok),B('flag','الأعلام',()=>startQuiz(gid,gm,'flg'),!ok),
    B('game','البالونات',()=>startBalloons(gid,gm),!ok),B('wheel','الحدس',()=>startIntuition(gid,gm),!ok),
    el('button',{class:'btn g',onclick:closeSheet},'إغلاق'));
}

/* ---- رهانات: دالة سؤال الرهان ---- */
function promptBet(title,min,cb){
  const inp=el('input',{type:'number',inputmode:'numeric',value:String(min)});
  openSheet(el('h3',{},title),el('small',{style:'color:var(--mu)'},'الحد الأدنى '+min),inp,el('button',{class:'btn',onclick:()=>{const n=Math.floor(Number(inp.value));if(!(n>=min))return toast('الحد الأدنى '+min,true);closeSheet();cb(n)}},'تأكيد'),el('button',{class:'btn g',onclick:closeSheet},'إلغاء'));
}
const BAL_TEXT='╮─❖『 الرهانات 』❖─╭\n\nشرح الفعالية:\n\nفعالية تعتمد على الحظ، إما تربح أو تخسر 🎲\n\nيجب أن يمتلك المشارك رصيدًا ويضع رهانًا.\n\nبعد وضع أول رهان، ينتظر صاحب رهان آخر بنفس القيمة أو أعلى بشرط ألا يتجاوز رصيد صاحب الفعالية.\n\nكل شخص يملك 🎈🎈🎈 بالونات بحيث إذا وقع الحظ عليه ستفقع البالونة 💥 وعندما تفقع كل بالوناته يخسر رهانه، لكن إذا صمدت بالوناته يربح.\n\nمثال:\nناغي كتب .رهان 100\nيجب أن يضع شخص آخر 100 أو أكثر بدون تجاوز الحد.\n\nبعد اكتمال الرهانات، يختار منشئ الفعالية:\n\n.بدأ الرهان ➜ تبدأ اللعبة.\n\n.انسحاب ➜ تلغى الفعالية.\n\nيمكن مشاركة أكثر من 20 أشخاص.\n\nالفائز يحصل على مجموع كل الرهانات.\n\nيفضل تجربة رهان 5$ أولًا لفهم اللعبة قبل الرهانات الكبيرة.\n\n╰─❖『 بالتوفيق 🍀 』❖─╯';
const INT_TEXT='بكل بساطة الفعالية عبارة عن اتباع\nحدسك واختيارك الكرة التي تظن انها\nالصحيحة وان كان حدسك صحيح ستفوز';
async function refundAll(gid,g){
  const up={},others=Object.entries(g.players||{}).filter(([u])=>u!==g.by);let tot=0;
  for(const[u,p]of others){up[`wallets/${u}/bal`]=increment(p.bet);tot+=p.bet}
  if(tot>0){up[`wallets/${g.by}/bal`]=increment(-tot);await update(ref(db),up)}
}
async function endGameDoc(gid,delay=0){await sleep(delay);if(!HOST||HOST.gid!==gid)return;await endHost(gid,true)}
async function startBalloons(gid,gm){
  if(HOST)return toast('لديك فعالية قائمة، اكتب ‎.انهاء‎ لإنهائها',true);
  if(await gameActive(gid))return toast('هناك فعالية قائمة في هذه النقابة',true);
  promptBet('ما هو رهانك؟',30,async bet=>{
    try{const bal=await balance();if(bal<bet)return toast('رصيدك لا يكفي',true);
      HOST={gid,kind:'bal',prevLock:!!gm.locked};
      await set(R('games/'+gid),{t:'bal',by:U(),s:'open',min:bet,cap:bal,ts:Date.now(),players:{[U()]:{bet}}});
      C.onLeave(()=>cancelGame(gid,true));
      await botCard(gid,{card:1,t:'text',c:colorFor(gid)},BAL_TEXT);
    }catch(e){HOST=null;err(e)}});
}
async function cancelGame(gid,quiet){
  if(!HOST||HOST.gid!==gid)return;
  try{const g=(await get(R('games/'+gid))).val();if(g&&(g.t==='bal'||g.t==='int'))await refundAll(gid,g)}catch(e){}
  if(!quiet)bot(gid,'تم إلغاء الفعالية وإرجاع الرهانات');
  await endHost(gid,true);
}
CMD['رهان']=async(gid,gm,a)=>{
  const g=(await get(R('games/'+gid))).val();if(!g||g.t!=='bal'||g.s!=='open')return bot(gid,'لا توجد فعالية رهانات مفتوحة الآن');
  const n=Math.floor(Number(a[0]));if(!(n>=g.min))return bot(gid,'أقل رهان مسموح: '+g.min);if(n>g.cap)return bot(gid,'الرهان لا يتجاوز رصيد صاحب الفعالية ('+g.cap+')');
  if((g.players||{})[U()])return bot(gid,'أنت مشارك بالفعل');if(Object.keys(g.players||{}).length>=30)return bot(gid,'اكتمل عدد المشاركين');
  try{if(await balance()<n)return bot(gid,'رصيدك لا يكفي');
    await update(ref(db),{['wallets/'+U()+'/bal']:increment(-n),['wallets/'+g.by+'/bal']:increment(n),[`games/${gid}/players/${U()}`]:{bet:n}});
    bot(gid,`${ME().name} دخل الرهان بمبلغ ${fmt(n)}`)}catch(e){err(e)}
};
CMD['بدأ']=async(gid,gm,a)=>{if(HOST&&HOST.gid===gid&&HOST.kind==='bal')runBalloons(gid,gm)};
CMD['انسحاب']=async(gid)=>{if(HOST&&HOST.gid===gid&&(HOST.kind==='bal'||HOST.kind==='int'))cancelGame(gid)};
CMD['انهاء']=async(gid)=>{if(HOST&&HOST.gid===gid){const k=HOST.kind;if(k==='bal'||k==='int')cancelGame(gid);else endHost(gid)}};
async function runBalloons(gid,gm){
  const h=HOST;if(!h||h.kind!=='bal'||h.run)return;const g=(await get(R('games/'+gid))).val(),ids=Object.keys((g&&g.players)||{});
  if(ids.length<2)return bot(gid,'يلزم مشاركان على الأقل لبدء الرهان');
  h.run=true;await update(R('games/'+gid),{s:'run'});await setLock(gid,true);
  const nm=await Promise.all(ids.map(prof)),ps=ids.map((u,i)=>({u,n:nm[i].name||'عضو',b:3,bet:g.players[u].bet})),pot=ps.reduce((s,p)=>s+p.bet,0);
  const view=ex2=>update(R('games/'+gid),{v:JSON.stringify({pot,ps:ps.map(p=>[p.u,p.n,p.b,p.bet]),...ex2})}).catch(()=>{});
  await view({msg:'بدأت الفعالية'});await sleep(1500);let seq=0;
  while(HOST===h&&ps.filter(p=>p.b>0).length>1){
    const t=rnd(ps.filter(p=>p.b>0));seq++;await view({seq,pin:'fall',t:t.u,tn:t.n});await sleep(2000);if(HOST!==h)return;
    t.b--;await view({seq,pin:'pop',t:t.u,tn:t.n});await sleep(1500);
    if(t.b===0){await view({seq,pin:'out',t:t.u,tn:t.n,msg:'ودع المونديال 💀'});bot(gid,`${t.n} ودع المونديال 💀`);await sleep(1700)}
  }
  if(HOST!==h)return;const w=ps.find(p=>p.b>0);
  try{if(w.u!==U())await update(ref(db),{['wallets/'+U()+'/bal']:increment(-pot),['wallets/'+w.u+'/bal']:increment(pot)})}catch(e){toast('تعذر دفع الجائزة، تواصل مع مطور',true)}
  await view({win:w.u,tn:w.n,msg:'الفائز '+w.n});
  await botFull(gid,{text:`مبروك للفائز ${w.n} — ربح ${fmt(pot)} رصيد`,d:JSON.stringify({card:1,t:'win2',n:w.n,a:pot,c:colorFor(gid)})});
  announce({n:w.n,a:fmt(pot),w:1,game:'البالونات'});await endGameDoc(gid,6000);
}
async function startIntuition(gid,gm){
  if(HOST)return toast('لديك فعالية قائمة، اكتب ‎.انهاء‎ لإنهائها',true);
  if(await gameActive(gid))return toast('هناك فعالية قائمة في هذه النقابة',true);
  promptBet('ما هو رهانك؟',50,async bet=>{
    try{const bal=await balance();if(bal<bet)return toast('رصيدك لا يكفي',true);
      HOST={gid,kind:'int',prevLock:!!gm.locked};C.onLeave(()=>cancelGame(gid,true));
      await set(R('games/'+gid),{t:'int',by:U(),s:'wait',min:bet,cap:bal,ts:Date.now()});await setLock(gid,true);
      await botCard(gid,{card:1,t:'intro',ic:'wheel',n:'الحدس',c:colorFor(gid)},DECO2+'\n'+INT_TEXT);
      await sleep(6000);if(!HOST)return;await update(R('games/'+gid),{s:'open',players:{}});await setLock(gid,false);
    }catch(e){HOST=null;err(e)}});
}
async function runIntuition(gid,gm){
  const h=HOST;if(!h||h.kind!=='int'||h.run)return;const g=(await get(R('games/'+gid))).val(),P=(g&&g.players)||{},ids=Object.keys(P);
  if(ids.length<3||!P[U()])return toast('يلزم 3 مشاركين على الأقل',true);
  h.run=true;await update(R('games/'+gid),{s:'run'});await setLock(gid,true);
  let alive=[0,1,2,3,4,5,6,7,8];const view=o=>update(R('games/'+gid),{v:JSON.stringify(o)}).catch(()=>{});
  await view({alive,boom:-1,seq:0});await sleep(1200);let seq=0;
  while(HOST===h&&alive.length>1){const b=rnd(alive);alive=alive.filter(x=>x!==b);seq++;await view({alive,boom:b,seq});await sleep(1100)}
  if(HOST!==h)return;const fin=alive[0];await view({alive,fin,seq:seq+1});await sleep(2600);
  const nm=Object.fromEntries(await Promise.all(ids.map(async u=>[u,(await prof(u)).name||'عضو']))),pot=ids.reduce((s,u)=>s+P[u].bet,0),W=ids.filter(u=>P[u].pick===fin),c=colorFor(gid);
  let res,up={};
  if(W.length===ids.length){res={k:'all'};for(const u of ids)if(u!==U())up[`wallets/${u}/bal`]=increment(P[u].bet);const t=ids.filter(u=>u!==U()).reduce((s,u)=>s+P[u].bet,0);if(t)up[`wallets/${U()}/bal`]=increment(-t)}
  else if(!W.length){res={k:'none'};up[`wallets/${U()}/bal`]=increment(-pot)}
  else{const share=Math.floor(pot/W.length);res={k:'win',names:W.map(u=>nm[u]),share};let t=0;for(const u of W)if(u!==U()){up[`wallets/${u}/bal`]=increment(share);t+=share}if(t)up[`wallets/${U()}/bal`]=increment(-t)}
  try{if(Object.keys(up).length)await update(ref(db),up)}catch(e){toast('تعذر دفع الجوائز، تواصل مع مطور',true)}
  await view({alive,fin,seq:seq+1,res});
  if(res.k==='win'){await botFull(gid,{text:`مبروك للفائزين ${res.names.join(' و ')} — ${fmt(res.share)} لكل واحد`,d:JSON.stringify({card:1,t:'win2',n:res.names.join(' و '),a:res.share,c})});res.names.forEach(n=>announce({n,a:fmt(res.share),w:1,game:'الحدس'}))}
  else if(res.k==='all')bot(gid,'الكل أصاب حدسه وقد تم إرجاع رهانكم');else bot(gid,'لم يربح أحد');
  await endGameDoc(gid,7000);
}

/* ---- لوحة اللعبة الحية أعلى الشات ---- */
const nameSp=u=>{const s=el('span',{},'…');prof(u).then(p=>{s.textContent=p.name||'عضو'});return s};
function gameBoard(gid,holder,cleanup){
  if(C.groups()[gid].kind!=='main')return;
  let g=null,lastSeq=-1,selB=-1,betV='',joined=false,shown=false;
  const draw=()=>{
    if(!g||g.s==='end'||(g.t!=='bal'&&g.t!=='int')){holder.replaceChildren();return}
    const v=g.v?jparse(g.v):null,host=g.by===U(),P=g.players||{},ids=Object.keys(P),pot=ids.reduce((s,u)=>s+(P[u].bet||0),0),c=colorFor(gid);
    if(g.t==='bal'){
      const stage=el('div',{class:'bstage'},el('i',{class:'cl c1'}),el('i',{class:'cl c2'}),el('i',{class:'cl c3'}));
      if(v&&v.pin){const pin=el('div',{class:'pin '+(v.pin==='fall'?'fall':'down')},'📌');stage.append(pin);
        if(v.pin!=='fall')stage.append(el('div',{class:'burst'},'💥'));
        stage.append(el('div',{class:'tgt'},v.pin==='fall'?'…':v.tn));
        if(v.seq!==lastSeq||v.pin!==lastPin){if(v.pin==='pop')sfx('boom');lastSeq=v.seq;lastPin=v.pin}}
      else stage.append(el('div',{class:'tgt'},g.s==='open'?'بانتظار المشاركين':v&&v.win?v.msg:'…'));
      if(v&&v.msg&&v.pin==='out')stage.append(el('div',{class:'bye'},v.msg));
      const list=(v?v.ps:ids.map(u=>[u,null,3,P[u].bet])),grid=el('div',{class:'bgrid'},...list.map(([u,n,b,bet])=>el('div',{class:'bp'+(b<=0?' out':'')+(v&&v.win===u?' win':'')},el('b',{},n||nameSp(u)),el('div',{class:'bl3'},b>0?'🎈'.repeat(b):'💥'),el('small',{},fmt(bet)))));
      const ctl=host&&g.s==='open'?el('div',{style:'display:flex;gap:8px;margin-top:8px'},el('button',{class:'btn',style:'flex:1',onclick:()=>runBalloons(gid,C.groups()[gid])},'بدأ الرهان'),el('button',{class:'btn r',style:'flex:1',onclick:()=>cancelGame(gid)},'انسحاب')):null;
      holder.replaceChildren(el('div',{class:'gbd',style:`--gc:${c}`},el('div',{class:'gbh'},ic('game',18),'البالونات',el('em',{},'مجموع الرهان: '+fmt(pot))),stage,
        el('div',{class:'gbh2'},'البالونات الحالية • الرهان: '+fmt(g.min)),grid,g.s==='open'?el('small',{style:'color:var(--mu)'},'للمشاركة اكتب: ‎.رهان '+g.min+'‎ أو أكثر'):null,ctl));
      return;
    }
    // الحدس
    const alive=v?v.alive:[0,1,2,3,4,5,6,7,8],mine=P[U()];
    if(g.s==='wait'){holder.replaceChildren(el('div',{class:'gbd',style:`--gc:${c}`},el('div',{class:'gbh'},'الحدس'),el('div',{class:'ovi'},'جارٍ التجهيز…')));return}
    if(v&&v.seq!==undefined&&v.seq!==lastSeq){if(v.boom>=0)sfx('boom');lastSeq=v.seq}
    const grid=el('div',{class:'ballg'},...BALLS.map((b,i)=>{const dead=v&&!alive.includes(i),fin=v&&v.fin===i;
      return el('button',{class:'ball'+(selB===i&&!v?' sel':'')+(mine&&mine.pick===i?' mine':'')+(dead?' dead':'')+(fin?' fin':''),onclick:()=>{if(v||mine)return;selB=i;draw()}},dead?'💥':b)}));
    let foot=null;
    if(!v&&g.s==='open'){
      if(mine)foot=el('div',{class:'ovi'},'تم حفظ كرتك '+BALLS[mine.pick]+' • انتظر حتى يبدأ المنشئ');
      else if(host){foot=el('button',{class:'btn',onclick:async()=>{if(selB<0)return toast('اختر كرة أولاً',true);try{await set(R(`games/${gid}/players/${U()}`),{bet:g.min,pick:selB})}catch(e){err(e)}}},'تأكيد')}
      else{const bi=el('input',{type:'number',inputmode:'numeric',placeholder:'ضع رهان لا يقل عن '+g.min,value:betV,oninput:()=>{betV=bi.value}});
        foot=el('div',{style:'display:flex;flex-direction:column;gap:8px'},bi,el('button',{class:'btn',onclick:async()=>{const n=Math.floor(Number(bi.value));if(selB<0)return toast('اختر كرة أولاً',true);if(!(n>=g.min))return toast('الرهان لا يقل عن '+g.min,true);
          try{if(await balance()<n)return toast('رصيدك لا يكفي',true);await update(ref(db),{['wallets/'+U()+'/bal']:increment(-n),['wallets/'+g.by+'/bal']:increment(n),[`games/${gid}/players/${U()}`]:{bet:n,pick:selB}})}catch(e){err(e)}}},'تأكيد'))}
    }
    const cnt=el('div',{class:'ovi'},'عدد المشاركين: '+ids.length);
    const start=host&&g.s==='open'&&mine?el('div',{style:'display:flex;gap:8px'},el('button',{class:'btn',style:'flex:1',disabled:ids.length<3,onclick:()=>runIntuition(gid,C.groups()[gid])},'بدأ'),el('button',{class:'btn r',style:'flex:1',onclick:()=>cancelGame(gid)},'انسحاب')):null;
    let fx=null;if(v&&v.fin!==undefined&&v.fin!==null)fx=el('div',{class:'finl'},'الكرة الصحيحة');
    let rs=null;if(v&&v.res){rs=v.res.k==='win'?el('div',{class:'ovi',style:'color:#6ee787'},'الفائز: '+v.res.names.join(' و ')+' — '+fmt(v.res.share)):v.res.k==='all'?el('div',{class:'ovi'},'الكل أصاب حدسه وقد تم ارجاع رهانكم'):el('div',{class:'ovi',style:'color:#ff5a4d'},'لم يربح أحد')}
    holder.replaceChildren(el('div',{class:'gbd',style:`--gc:${c}`},el('div',{class:'gbh'},ic('wheel',18),'الحدس',el('em',{},'الرهان: '+fmt(g.min)+' • المجموع: '+fmt(pot))),grid,fx,rs,(g.s==='open'?cnt:null),foot,start));
  };
  let lastPin='';
  const un=onValue(R('games/'+gid),s=>{g=s.val();draw()},()=>{});
  cleanup.push(un);
}

/* ---- بطاقات النظام ---- */
const glowName=(t,c)=>el('span',{class:'gname',style:`--gc:${c}`},t);
function cloudSvg(col){const w=el('div',{class:'cloud',style:`--cc:${col}`});w.innerHTML=`<svg viewBox="0 0 240 90" width="240" height="90"><path d="M52 76a26 26 0 0 1 2-50 34 34 0 0 1 64-9 30 30 0 0 1 52 17 24 24 0 0 1 8 42z" fill="${col}"/></svg>`;return w}
function sysCard(m){
  const D=m.d?jparse(m.d):null;
  if(D&&D.card){
    const c=hex(D.c)?D.c:'#2a6cff';
    if(D.t==='intro')return el('div',{class:'gcard',style:`--gc:${c}`},el('div',{class:'gchd'},ic(D.ic||'game',26),el('b',{},'فعالية '+D.n)),el('div',{class:'gctx'},(m.text||'').split('\n').slice(1).join('\n')));
    if(D.t==='text')return el('div',{class:'gcard',style:`--gc:${c}`},el('div',{class:'gctx sm'},m.text));
    if(D.t==='round'){const gc=hex(D.gc)?D.gc:c;
      const content=D.k==='col'?cloudSvg(D.c):D.k==='flg'?el('div',{class:'flg'},D.f):glowName(D.show,gc);
      return el('div',{class:'gcard rnd',style:`--gc:${gc}`},decor(gc),el('div',{class:'rlab'},D.lab+':'),content,decor(gc))}
    if(D.t==='det')return el('div',{class:'gcard det'+(D.emp?' emp':''),style:`--gc:${c}`},decor(c),...D.rows.map(r=>el('div',{class:'drow'},el('span',{},r[0]),r[1]==='__INF__'?infSvg(54):el('b',{},r[1]))),decor(c));
    if(D.t==='tx')return el('div',{class:'gcard',style:`--gc:#37e06a`},decor('#37e06a'),el('div',{class:'gchd',style:'color:#37e06a'},ic('swap',22),el('b',{},'تحويل رصيد')),el('div',{class:'drow'},el('span',{},'المستلم'),el('b',{},D.to)),el('div',{class:'drow'},el('span',{},'من نقابة'),el('b',{},D.g||'—')),el('div',{class:'drow'},el('span',{},'المحوِّل'),el('b',{},D.from)),el('div',{class:'drow'},el('span',{},'المبلغ'),el('b',{style:'color:#6ee787'},fmt(D.a))),D.bal!=null?el('div',{class:'drow'},el('span',{},'رصيده بعد التحويل'),el('b',{},fmt(D.bal))):null,decor('#37e06a'));
    if(D.t==='win'||D.t==='win2')return el('div',{class:'gcard win',style:`--gc:${c}`},decor(c,'🎉'),el('div',{class:'gctx'},'مبروك للفائز ',glowName('@'+D.n,c),el('br'),D.t==='win'?'لقد تم اضافة 35 الى رصيدك':'لقد ربح '+fmt(D.a)+' رصيد'),decor(c,'🫟'));
    if(D.t==='cry')return el('div',{class:'gcard cry',style:`--gc:${hex(D.c)?D.c:'#2a6cff'}`},decor(hex(D.c)?D.c:'#2a6cff'),el('div',{class:'gctx'},'اللاعب ',glowName('@'+D.n,hex(D.c)?D.c:'#2a6cff'),el('br'),'قد '+(D.w?'فاز':'خسر')+' في لعبة '+(D.gm||'الكريستال'),el('br'),'بمبلغ: ',el('b',{class:D.w?'gw':'gl'},String(D.a)),D.gn?el('br'):null,D.gn?'وهو ينتمي لنقابة:':null,D.gn?el('br'):null,D.gn?el('b',{},D.gn):null),decor(hex(D.c)?D.c:'#2a6cff'));
  }
  if(m.k==='bot')return el('div',{},el('div',{style:'white-space:pre-wrap;line-height:1.7'},m.text),m.f?el('small',{style:'color:var(--mu)'},'بطلب: '+m.f):null);
  if(m.k==='welcome')return el('div',{class:'tx',style:'line-height:1.7'},m.text);
  if(m.k==='rank'&&m.d)try{return rankCard(JSON.parse(m.d))}catch(e){}
  if(m.k==='war'&&m.d)try{return warCard(JSON.parse(m.d))}catch(e){}
  return null;
}
function rankCard(o){
  const c=hex(o.c)?o.c:'#2a6cff',L=o.l||[],ring=['#ffd54a','#cfd8dc','#cd7f32'];
  const top=el('div',{class:'rk3'},...[1,0,2].map(i=>{const r=L[i];if(!r)return el('div');const a=avatar(r[0],'l');a.style.border='4px solid '+ring[i];a.style.boxShadow='0 0 14px '+ring[i];
    return el('div',{class:'rkc'+(i===0?' first':'')},i===0?ic('crown',24,'#ffd54a'):null,a,el('b',{style:'color:'+ring[i]},String(i+1)),el('div',{class:'rkn'},r[1]),el('small',{},r[2]+' رسالة'))}));
  const rows=L.slice(3).map((r,i)=>el('div',{class:'rkr'},el('span',{},String(i+4)),el('b',{},r[1]),el('span',{},r[3]==='f'?'أنثى':'ذكر'),el('em',{},String(r[2]))));
  return el('div',{class:'rk',style:`background:linear-gradient(160deg,${dk(c,.55)},#07101f)`},el('div',{class:'rkt',style:'color:'+c},o.n),top,...rows);
}
function gpill(g,name,role){
  const ph=el('div',{class:'av'},(name||'?')[0]);if(g)get(R('groupPhotos/'+g)).then(s=>{if(s.val()){ph.style.backgroundImage=`url(${s.val()})`;ph.textContent=''}}).catch(()=>{});
  const c=g?colorFor(g):'#888';return el('div',{class:'gpill '+role,style:`--gc:${c}`},ph,el('b',{},name),el('small',{},role==='def'?'المدافع':role==='atk'?'المهاجم':''),role==='def'?ic('shield',22,c):role==='atk'?ic('swords',22,c):null);
}
function warCard(o){
  if(o.t==='decl'){
    const cd=el('div',{class:'wcd2'}),box=el('div',{class:'wc2'},el('b',{style:'font-size:16px'},'إعلان حرب'),el('div',{class:'vs'},gpill(o.ag,o.a,'atk'),el('div',{class:'clash'},el('span',{},ic('swords',34))),gpill(o.dg,o.d,'def')),el('small',{},'بقيادة '+o.by),cd);
    const t=setInterval(()=>{if(!box.isConnected){if(box._seen)clearInterval(t);return}box._seen=1;const n=nowS(),st=o.st,en=o.en||st+180000;
      cd.textContent=n<st?'تبدأ الحرب بعد '+mmss(st-n):n<en?'القتال دائر الآن • المتبقي '+mmss(en-n):'انتهى القتال • بانتظار الحسم';box.classList.toggle('fight',n>=st&&n<en)},1000);return box;
  }
  return el('div',{class:'wc2 res'},el('b',{style:'font-size:16px'},'انتهت الحرب'),el('div',{class:'vs'},el('div',{class:'gpill win',style:`--gc:${o.wg?colorFor(o.wg):'#ffd54a'}`},ic('trophy',26,'#ffd54a'),el('b',{},o.win),el('small',{},'المنتصر')),
    el('div',{class:'gpill lose'},ic('flag',24,'#fff'),el('b',{},o.lose||''),el('small',{},'خسرت'))),o.lead?el('small',{},'بقيادة '+o.lead):null);
}
/* ---- لوحة النقابة: المستويات ---- */
async function guildPanel(gid,gm,body){
  if(gm.kind!=='main'||C.mem()[gid]!==true)return;
  const c=colorFor(gid),sec=el('div',{class:'sec'},el('h4',{},'المستويات'));body.append(sec);
  let gs=null;try{gs=(await get(R('guildStats/'+gid))).val()}catch(e){}
  if(!gs){sec.append(el('p',{},'لم تُفعَّل المستويات لهذه النقابة بعد.'));if(C.isDev())sec.append(el('button',{class:'btn g',style:'margin-top:8px',onclick:async()=>{await set(R('guildStats/'+gid),{atk:1,def:1});C.reinfo(gid)}},'تفعيل المستويات'));return}
  const cards=(await get(R('inv/'+U()+'/upg'))).val()||0,mine=((gs.contrib||{})[U()])||0;
  sec.append(el('div',{class:'lv'},el('div',{},ic('swords',30,c),'الهجوم',el('b',{style:`color:${c}`},String(gs.atk))),el('div',{},ic('shield',30,c),'الدفاع',el('b',{style:`color:${c}`},String(gs.def)))),
    el('p',{style:'margin:6px 0;color:var(--mu)'},`بطاقات الترقية: ${cards} • مساهماتك: ${mine}`));
  const up=k=>async()=>{if(!cards)return toast('لا تملك بطاقة ترقية، اشتر من المتجر',true);
    try{await update(ref(db),{[`guildStats/${gid}/${k}`]:increment(1),['inv/'+U()+'/upg']:increment(-1),[`guildStats/${gid}/contrib/${U()}`]:increment(1)});toast('تمت الترقية',false,true);notify('shop',`🎫 ${ME().name} رقّى ${k==='atk'?'هجوم':'دفاع'} نقابة ${gname(gid)}`,'buy');C.reinfo(gid)}catch(e){err(e)}};
  sec.append(el('div',{style:'display:flex;gap:8px;margin-top:6px'},el('button',{class:'btn',style:'flex:1;display:flex;gap:6px;justify-content:center;align-items:center',onclick:up('def')},ic('shield',20,c),'ترقية الدفاع'),el('button',{class:'btn',style:'flex:1;display:flex;gap:6px;justify-content:center;align-items:center',onclick:up('atk')},ic('swords',20,c),'ترقية الهجوم')));
}
const mmss=ms=>{const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60);return(h?h+':':'')+String(m).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
/* شريط الحرب المثبّت أعلى الدردشة */
function warBanner(gid,holder,cleanup,cb){
  if(C.groups()[gid].kind!=='main'||C.mem()[gid]!==true)return;
  let w=null,by='',t=0;
  const tick=()=>{if(!w){holder.replaceChildren();return}const n=nowS(),at=w.a===gid,fight=n>=w.st&&n<w.en;
    holder.replaceChildren(el('div',{class:'wb '+(at?'atk':'def')+(fight?' fight':'')},el('div',{class:'clash s'},el('span',{},ic('swords',20))),
      el('b',{},at?`تشنون حرباً على «${gname(w.d)}»`:`تتعرضون لغزو من نقابة «${gname(w.a)}» — أعلنها ${by}`),el('br'),
      n<w.st?'تبدأ الحرب بعد '+mmss(w.st-n):fight?(at?'أنتم تهاجمون نقابة أخرى • النتيجة حسب مستوى الهجوم لديكم':'أنتم تتعرضون لغزو • إما أن تفوزوا أو تخسروا حسب مستوى الدفاع')+' • '+mmss(w.en-n):'بانتظار الحسم…'))};
  const un=onValue(R('activeWar/'+gid),async s=>{const wid=s.val();clearInterval(t);if(!wid){w=null;holder.replaceChildren();cb&&cb(null);return}
    try{w=(await get(R('wars/'+wid))).val();if(w)by=(await prof(w.by)).name||'';cb&&cb(w);tick();t=setInterval(tick,1000)}catch(e){}},()=>{});
  cleanup.push(un,()=>clearInterval(t));
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
  let ci={};try{ci=(await get(R('shopItems'))).val()||{}}catch(e){}
  const cids=Object.keys(ci);
  if(cids.length||C.isEmp())list.append(el('div',{class:'sech'},'عروض الإمبراطور'));
  for(const id of cids){const it=ci[id];
    list.append(el('div',{class:'row'},el('div',{class:'av',style:'background:linear-gradient(135deg,#3a0714,#12020a);color:#ffd54a'},ic('crown',20)),el('div',{class:'t'},el('b',{},it.n),el('small',{},it.d||'')),
      C.isEmp()?el('div',{style:'display:flex;gap:6px'},el('button',{class:'ib',onclick:()=>editItem(id,it)},ic('edit',18)),el('button',{class:'ib',style:'color:#ff5a4d',onclick:async()=>{try{await remove(R('shopItems/'+id));shop()}catch(e){err(e)}}},ic('trash',18))):
      el('button',{class:'btn',style:'padding:9px 12px;font-size:13px',onclick:async()=>{try{if(await balance()<it.p)return toast('رصيدك لا يكفي');await update(ref(db),{['wallets/'+U()+'/bal']:increment(-it.p)});notifTo(C.EMP(),{t:'buy',a:it.p,m:it.n});notify('shop',`🛒 ${ME().name} اشترى «${it.n}»`,'buy');toast('تم الشراء ✅');showBal(bal)}catch(e){err(e)}}},fmt(it.p))))}
  if(C.isEmp())list.append(el('button',{class:'btn glowbtn',style:'margin:12px;width:calc(100% - 24px)',onclick:()=>editItem(null,{n:'',d:'',p:100})},ic('plus',20),' إضافة منتج'));
}
function editItem(id,it){
  const n=el('input',{placeholder:'اسم المنتج',maxlength:'30',value:it.n}),d=el('input',{placeholder:'وصف قصير',maxlength:'120',value:it.d||''}),p=el('input',{type:'number',inputmode:'numeric',placeholder:'السعر',value:String(it.p||'')});
  openSheet(el('h3',{},id?'تعديل المنتج':'منتج جديد'),n,d,p,el('button',{class:'btn',onclick:async()=>{const pr=Math.floor(Number(p.value)),nm=n.value.trim();if(!nm||!(pr>=1&&pr<=100000000))return toast('اكتب الاسم وسعراً صحيحاً',true);
    try{await set(id?R('shopItems/'+id):push(R('shopItems')),{n:nm,d:d.value.trim(),p:pr});closeSheet();shop()}catch(e){err(e)}}},'حفظ'),el('button',{class:'btn g',onclick:closeSheet},'إلغاء'));
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
      await update(ref(db),{['wars/'+wid]:{a,d:g,by:U(),t0:Date.now(),st,en:st+180e3,s:'p'},['activeWar/'+a]:wid,['activeWar/'+g]:wid,['wallets/'+U()+'/bal']:increment(-it.p)});
      notify('news',`⚔️ إعلان حرب: نقابة ${gname(a)} تعلن الحرب على ${gname(g)}`,'war',JSON.stringify({t:'decl',a:gname(a),d:gname(g),ag:a,dg:g,by:ME().name,st,en:st+180e3}));toast('تم إعلان الحرب، تبدأ بعد ساعة ⚔️');done&&done()}catch(e){err(e)}}},gname(g))));
  if(att.length===1)pickT(att[0]);else openSheet(el('h3',{},'من أي نقابة؟'),...att.map(g=>el('button',{class:'btn g',onclick:()=>{closeSheet();pickT(g)}},gname(g))));
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
    for(const f of FILES){if(!cur[f])continue;const ok=Object.values(cfg[FK(f)]||{});if(ok.length&&!ok.includes(cur[f])){set(R('tamper/'+U()),Date.now()).catch(()=>{});return true}}
  }catch(e){}
  return true;
}
async function approve(){
  const cur=await fileHashes(),cfg=(await get(R('config/hashes'))).val()||{},up={};
  for(const f of FILES){if(!cur[f])continue;const arr=Object.values(cfg[FK(f)]||{});if(!arr.includes(cur[f]))up[`config/hashes/${FK(f)}/${arr.length}`]=cur[f]}
  if(!Object.keys(up).length)return toast('هذه النسخة معتمدة بالفعل');
  await update(ref(db),up);toast('تم اعتماد النسخة الحالية ✅');
}

/* ---------- مهام المطورين الدورية: الحرب والحسبة ---------- */

/* ---- الحسم: الحرب بين النقابات ---- */
async function settleWars(){
  const ws=(await get(R('wars'))).val()||{};
  for(const[wid,w]of Object.entries(ws)){if(w.s==='p'&&nowS()>=w.en)await settle(wid,w)}
}
async function settle(wid,w){
  try{await set(R('locks/war_'+wid),true)}catch(e){return}
  const g=(p)=>get(R(p)).then(s=>s.val()).catch(()=>null);
  const[A0,D0,ma,md,lead]=await Promise.all([g('guildStats/'+w.a),g('guildStats/'+w.d),g('members/'+w.a),g('members/'+w.d),prof(w.by)]);
  const A=A0||{atk:1,def:1},D=D0||{atk:1,def:1},attWins=(A.atk||0)>(D.def||0);
  const W=attWins?w.a:w.d,L=attWins?w.d:w.a,WS=attWins?A:D,LS=attWins?D:A;
  const plain=async m=>{const ids=Object.keys(m||{}).filter(u=>m[u]===true),out=[];for(const u of ids){const r=await C.roleOf(u);if(r!=='dev'&&r!=='emp'&&u!==C.EMP())out.push(u)}return out};
  const mw=await plain(attWins?ma:md),ml=await plain(attWins?md:ma);
  const up={['wars/'+wid+'/s']:'d',['wars/'+wid+'/res']:attWins?'a':'d',['activeWar/'+w.a]:null,['activeWar/'+w.d]:null};
  let pool=0;const nf=(u,o)=>{up[`notifs/${u}/${push(R('x')).key}`]={from:U(),ts:serverTimestamp(),...o}};
  for(const u of ml){const b=(await g(`wallets/${u}/bal`))||0,take=Math.min(1000,b);if(take>0){up[`wallets/${u}/bal`]=b-take;pool+=take}nf(u,{t:'wl',a:take})}
  const share=mw.length?Math.floor(pool/mw.length):0;
  for(const u of mw){if(share>0)up[`wallets/${u}/bal`]=increment(share);nf(u,{t:'ww',a:share})}
  up['guildStats/'+W+'/atk']=Math.min(9999,(WS.atk||0)+(LS.atk||0));up['guildStats/'+W+'/def']=Math.min(9999,(WS.def||0)+(LS.def||0));
  up['guildStats/'+L+'/atk']=0;up['guildStats/'+L+'/def']=0;
  try{await update(ref(db),up)}catch(e){await update(ref(db),{['wars/'+wid+'/s']:'d',['activeWar/'+w.a]:null,['activeWar/'+w.d]:null}).catch(()=>{});return}
  const gs=C.groups(),news=Object.keys(gs).find(x=>gs[x].kind==='news');
  if(news)set(push(R('messages/'+news)),{from:U(),type:'sys',k:'war',text:'انتهت الحرب',d:JSON.stringify({t:'res',win:gs[W]?gs[W].name:'',lose:gs[L]?gs[L].name:'',wg:W,lead:lead.name||''}),ts:serverTimestamp()}).catch(()=>{});
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
let tk0=0;async function devTick(){if(ticking)return;ticking=true;try{await settleWars();await tally();tk0++;if(tk0%2===0)await monitorWallets();if(tk0%10===1)await syncGuildCounts()}catch(e){}ticking=false}
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
return{send,sendRaw,integrity,sysCard,route,guildPanel,warBanner,checkVisit,empExtras,start,shop,colorFor,gamesSheet,gameBoard,claimReward,balance,notify,bot,fmt,shopTx};
}
