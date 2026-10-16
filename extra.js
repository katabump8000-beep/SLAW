import{ref,get,set,update,remove,push,serverTimestamp,increment}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

export function init(C){
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
const CMD={};
async function command(gid,gm,text){
  const[c,...args]=text.slice(1).trim().split(/\s+/),f=CMD[c];
  if(!f)return bot(gid,'❌ الأمر غير موجود. اكتب ‎.اوامر‎ لعرض القائمة');
  try{await f(gid,gm,args)}catch(e){err(e)}
}
const home=gid=>myMains()[0]||gid;
CMD['اوامر']=(gid)=>bot(gid,'╮─❖『 أوامر ALJESI 』❖─╭\n.تفاصيلي — بطاقتك\n.رصيدي — رصيدك\n.العاب — قائمة الألعاب\n.كريستال [مبلغ] — لعبة الكريستال\n.بالونات — لعبة البالونات\n.تحويل — تحويل رصيد لعضو\n.المتصدرين — متصدرو اليوم\n.المتجر — فتح المتجر\n╰─❖『 ALJESI 』❖─╯');
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
CMD['العاب']=async gid=>{bot(gid,'🎮 الألعاب المتاحة:\n💎 ‎.كريستال [مبلغ]‎\n🎈 ‎.بالونات‎\n(المزيد قريباً)');gamesSheet(gid)};
CMD['كريستال']=(gid,gm,a)=>crystalUI(gid,gm,Number(a[0])||50);
CMD['بالونات']=(gid,gm)=>balloonUI(gid,gm);
CMD['تحويل']=(gid,gm)=>transferUI(gid,gm);
CMD['المتجر']=()=>go('shop');
function gamesSheet(gid){const gm=C.groups()[gid];openSheet(el('h3',{},'🎮 اختر لعبة'),el('button',{class:'btn',onclick:()=>{closeSheet();crystalUI(gid,gm,50)}},'💎 كريستال'),el('button',{class:'btn',onclick:()=>{closeSheet();balloonUI(gid,gm)}},'🎈 البالونات'),el('button',{class:'btn g',onclick:closeSheet},'إغلاق'))}

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
    holder.replaceChildren(el('div',{class:'wb'+(at?'':' def')},at?`⚔️ تشنون حرباً على «${gname(w.d)}»`:`🚨 تتعرضون لهجوم من «${gname(w.a)}»`,el('br'),n<w.st?'تبدأ المعركة بعد '+mmss(w.st-n):n<w.en?'المعركة قائمة الآن!':'بانتظار الحسم…'))};
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

/* ---------- بطاقات الرسائل الخاصة ---------- */
function sysCard(m){
  if(m.k==='bot')return el('div',{},el('div',{style:'white-space:pre-wrap;line-height:1.7'},m.text),m.f?el('small',{style:'color:var(--mu)'},'بطلب: '+m.f):null);
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
  if(o.t==='decl')return el('div',{class:'wc'},el('b',{},'⚔️ إعلان حرب'),el('div',{},`نقابة «${o.a}» ⚔️ نقابة «${o.d}»`),el('small',{},'بقيادة '+o.by+' — تبدأ بعد ساعة'));
  return el('div',{class:'wc'},el('b',{},'🏆 انتهت الحرب'),el('div',{},`انتصرت نقابة «${o.win}» 👑`),el('small',{},o.lead?'القائد: '+o.lead:''),o.mv?el('small',{},' • تم نقل '+o.mv+' أعضاء'):null);
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
  return el('div',{class:'sec'},el('h4',{},'⏰ ساعة الحسبة اليومية'),el('div',{style:'display:flex;gap:8px'},h,el('button',{class:'btn',style:'padding:10px 16px',onclick:async()=>{const v=Math.floor(Number(h.value));if(!(v>=0&&v<=23))return toast('0 إلى 23');try{await set(R('meta/tallyHour'),v);toast('تم الحفظ ✅')}catch(e){err(e)}}},'حفظ')));
}
function route(a){if(a==='shop'){shop();return true}return false}
function start(){ensureStats();if(C.isDev()){setTimeout(devTick,4000);setInterval(devTick,30000)}}
return{send,sysCard,route,guildPanel,warBanner,checkVisit,empExtras,start,shop,colorFor,gamesSheet};
}
