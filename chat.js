/* ============================================================
   chat.js — واجهة الشات والملف التعريفي لـ SLAW (النسخة 1)
   - وحدة ES واحدة، تستعمل نفس Firebase SDK 10.12.2 ونفس التطبيق المُهيّأ في index.html
   - تعمل داخل Shadow DOM فلا يتعارض تصميمها مع تصميم SLAW
   - الاستعمال من index.html:   window.SLAWChat.open(friendUid)
   - كل ما يعتمد على المتصفح معزول داخل الكائن Platform (للتحويل إلى Capacitor)
   ============================================================ */
import { getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase, ref, push, set, update, remove, get, query,
  orderByKey, limitToLast, startAt, endBefore,
  onChildAdded, onChildChanged, onChildRemoved, onValue,
  serverTimestamp, onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ============================================================
   0) الثوابت
   ============================================================ */
const BASE = new URL('.', import.meta.url);
const VER = new URL(import.meta.url).search;            // مثل ?v=1 (نفس رقم النسخة)
const PAGE = 40;                                        // رسائل كل صفحة تحميل
const MAX_TEXT = 2000;
const MAX_FILE_BYTES = 1500000;          // أقصى حجم ملف/صوت قبل التحويل (≈ 1.5MB)
const MAX_DATA_CHARS = 2200000;          // أقصى طول للنص المحفوظ في القاعدة (يوافق القواعد)
const MAX_REC_SECS = 180;                // أقصى مدة تسجيل عادي
const MAX_MERGE_SECS = 60;               // أقصى مدة عند إكمال مسودة
const RE_IMG = /^data:image\/(jpeg|png|webp|gif);base64,/;
const RE_AUD = /^data:audio\//;
const RE_KEY = /^[a-z0-9]{6,30}$/;
const QUICK_MSG = '💙🩶🩵🤍💜 باي 🤎🧡💛💚❤️';
const MODELS = [
  { id: 1, s: 1.28, n: 'الأزرار كبيرة جداً' },
  { id: 2, s: 1.14, n: 'الأزرار كبيرة' },
  { id: 3, s: 1.00, n: 'متوسطة (الأصلي)' },
  { id: 4, s: 0.88, n: 'الأزرار صغيرة' },
  { id: 5, s: 0.77, n: 'الأزرار صغيرة جداً' }
];
const FONT_STEPS = [0.80, 0.88, 0.95, 1.00, 1.08, 1.17, 1.28, 1.40, 1.55, 1.72];
const FONT_DEFAULT = 3;
const THEME_COLORS = ['#ff2d2d', '#2d7fff', '#ffd93d', '#2dff7f', '#ff8a2d', '#a02dff', '#ff2d9e', '#2dffd9'];
const TEXT_COLORS = [
  '#ff3b3b', '#ff8a2d', '#ffd93d', '#a3e635', '#2dff7f', '#2dffd9',
  '#38bdf8', '#2d7fff', '#a02dff', '#ff2d9e', '#d4af37', '#c0c0c0'
];

/* ============================================================
   1) Platform — كل ما يعتمد على المتصفح (يُستبدل عند التحويل إلى Capacitor)
   ============================================================ */
/* هل نعمل داخل تطبيق Capacitor الأصلي؟ (وليس في المتصفح) */
const NATIVE = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
const nativePlugin = name => {
  const C = window.Capacitor;
  if (C && typeof C.registerPlugin === 'function') { try { return C.registerPlugin(name); } catch (e) {} }
  return (C && C.Plugins && C.Plugins[name]) || null;
};

const Platform = {
  /* الاهتزاز  ← Capacitor: @capacitor/haptics */
  haptic(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} },

  /* النسخ  ← Capacitor: @capacitor/clipboard */
  async copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; }
    catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = t; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove(); return true;
      } catch (_) { return false; }
    }
  },

  /* التخزين المحلي للتفضيلات (يعمل في WebView) */
  getPref(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
  setPref(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },

  /* صوت الضغط  (click.mp3 بجانب index.html) */
  _click: { pool: [], i: 0 },
  initClick() {
    try {
      for (let k = 0; k < 3; k++) {
        const a = new Audio(new URL('click.mp3', document.baseURI).href);
        a.preload = 'auto'; a.volume = .55; this._click.pool.push(a);
      }
    } catch (e) {}
  },
  playClick() {
    const c = this._click; if (!c.pool.length) return;
    const a = c.pool[c.i++ % c.pool.length];
    try { a.currentTime = 0; const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  },

  /* اختيار ملف  ← Capacitor: File Picker / Camera plugin */
  pickFile(accept) {
    return new Promise(res => {
      const i = document.createElement('input');
      i.type = 'file'; i.accept = accept || '*/*'; i.style.display = 'none';
      i.addEventListener('change', () => { const f = i.files && i.files[0] || null; i.remove(); res(f); });
      i.addEventListener('cancel', () => { i.remove(); res(null); });
      document.body.appendChild(i); i.click();
    });
  },
  /* حفظ ملف على الجهاز  ← Capacitor: @capacitor/filesystem */
  async saveBlob(blob, name) {
    if (NATIVE) {
      /* في التطبيق الأصلي: نكتب الملف مؤقتاً ثم نفتح نافذة المشاركة/الحفظ */
      try {
        const data = (await this.blobToDataUrl(blob)).split(',')[1];
        const FS = nativePlugin('Filesystem'), SH = nativePlugin('Share');
        const r = await FS.writeFile({ path: 'slaw_' + Date.now() + '_' + name, data, directory: 'CACHE' });
        await SH.share({ title: name, url: r.uri, dialogTitle: 'حفظ أو مشاركة الملف' });
        return;
      } catch (e) { console.warn('[native save]', e); }
    }
    const obj = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = obj; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(obj), 4000);
  },
  /* الميكروفون  ← Capacitor: plugin تسجيل صوت إن لم يعمل getUserMedia في WebView */
  getMic() { return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); },
  recMime() {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    return (window.MediaRecorder && types.find(t => MediaRecorder.isTypeSupported(t))) || '';
  },
  /* ضغط الصور (canvas — يعمل في WebView) */
  blobToDataUrl(blob) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result); r.onerror = () => rej(r.error);
      r.readAsDataURL(blob);
    });
  },
  compressImage(file, maxDim, quality) {
    return new Promise((res, rej) => {
      const img = new Image();
      const u = URL.createObjectURL(file);
      img.onload = () => {
        let w = img.naturalWidth, h = img.naturalHeight;
        const sc = Math.min(1, maxDim / Math.max(w, h));
        w = Math.max(1, Math.round(w * sc)); h = Math.max(1, Math.round(h * sc));
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(u);
        c.toBlob(b => b ? res({ blob: b, w, h }) : rej(new Error('blob')), 'image/jpeg', quality);
      };
      img.onerror = () => { URL.revokeObjectURL(u); rej(new Error('img')); };
      img.src = u;
    });
  },
  /* المسودات الصوتية: IndexedDB (تعمل في WebView) */
  _ddb: null,
  _dopen() {
    return new Promise((res, rej) => {
      if (this._ddb) return res(this._ddb);
      if (!window.indexedDB) return rej(new Error('no-idb'));
      const r = indexedDB.open('slawchat_drafts', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('d');
      r.onsuccess = () => { this._ddb = r.result; res(this._ddb); };
      r.onerror = () => rej(r.error);
    });
  },
  async draftGet(k) {
    try {
      const db0 = await this._dopen();
      return await new Promise(res => {
        const q = db0.transaction('d').objectStore('d').get(k);
        q.onsuccess = () => res(q.result || null); q.onerror = () => res(null);
      });
    } catch (e) { return null; }
  },
  async draftSet(k, v) {
    const db0 = await this._dopen();
    return new Promise((res, rej) => {
      const tx = db0.transaction('d', 'readwrite');
      tx.objectStore('d').put(v, k);
      tx.oncomplete = () => res(true); tx.onerror = () => rej(tx.error);
    });
  },
  async draftDel(k) {
    try {
      const db0 = await this._dopen();
      await new Promise(res => {
        const tx = db0.transaction('d', 'readwrite');
        tx.objectStore('d').delete(k); tx.oncomplete = () => res(); tx.onerror = () => res();
      });
    } catch (e) {}
  },

  /* البطارية  ← Capacitor: @capacitor/device (Device.getBatteryInfo) */
  bat: null,
  natBat: null,
  async initBattery(onChange) {
    if (NATIVE) {
      const Dev = nativePlugin('Device');
      const poll = async () => {
        try { const b = await Dev.getBatteryInfo(); this.natBat = { level: b.batteryLevel, charging: !!b.isCharging }; onChange(); } catch (e) {}
      };
      poll(); setInterval(poll, 60000);
      return;
    }
    try {
      if (navigator.getBattery) {
        this.bat = await navigator.getBattery();
        ['levelchange', 'chargingchange'].forEach(ev => this.bat.addEventListener(ev, onChange));
      }
    } catch (e) {}
  },

  /* الشبكة  ← Capacitor: @capacitor/network */
  rtt: null,
  natNet: null,
  initNetwork(onChange) {
    if (NATIVE) {
      try {
        const N = nativePlugin('Network');
        N.getStatus().then(st => { this.natNet = st; onChange(); }).catch(() => {});
        N.addListener('networkStatusChange', st => { this.natNet = st; onChange(); });
      } catch (e) {}
    }
    try { if (navigator.connection) navigator.connection.addEventListener('change', onChange); } catch (e) {}
    window.addEventListener('online', () => { this.measureRtt(); onChange(); });
    window.addEventListener('offline', onChange);
    this.measureRtt();
    setInterval(() => this.measureRtt(), 60000);
  },
  async measureRtt() {
    if (!navigator.onLine) { this.rtt = null; return; }
    const t = performance.now();
    try {
      await fetch('https://www.google.com/generate_204', { mode: 'no-cors', cache: 'no-store' });
      this.rtt = Math.round(performance.now() - t);
    } catch (e) { this.rtt = null; }
  },
  netPref() { try { return JSON.parse(this.getPref('slawchat_net_v1', '{}')) || {}; } catch (e) { return {}; } },
  deviceSnapshot() {
    const c = navigator.connection || {};
    const p = this.netPref();
    let conn = 'unk';
    if (this.natNet) conn = !this.natNet.connected ? 'none' : this.natNet.connectionType === 'wifi' ? 'wifi' : this.natNet.connectionType === 'cellular' ? 'cell' : 'unk';
    else if (!navigator.onLine) conn = 'none';
    if (conn === 'none') { /* لا اتصال */ }
    else if (p.mode === 'wifi') conn = 'wifi';
    else if (p.mode === 'cell') conn = 'cell';
    else if (conn === 'unk') {
      if (c.type === 'wifi' || c.type === 'ethernet') conn = 'wifi';
      else if (c.type === 'cellular') conn = 'cell';
    }
    return {
      conn,
      wifi: conn === 'wifi' ? String(p.wifi || '').slice(0, 32) : '',
      eff: String(c.effectiveType || '').slice(0, 8),
      dl: typeof c.downlink === 'number' ? c.downlink : null,
      rtt: this.rtt,
      bat: this.natBat && typeof this.natBat.level === 'number' && this.natBat.level >= 0 ? Math.round(this.natBat.level * 100)
        : (this.bat ? Math.round(this.bat.level * 100) : null),
      chg: this.natBat ? !!this.natBat.charging : (this.bat ? !!this.bat.charging : null)
    };
  }
};

/* ============================================================
   2) أدوات عامة
   ============================================================ */
const sleep = ms => new Promise(r => setTimeout(r, ms));
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmt12(ts) {
  const d = new Date(ts || Date.now());
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'م' : 'ص';
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}
function fmtDate(ts) {
  const d = new Date(ts || Date.now());
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
function ago(ts) {
  if (!ts) return '';
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 45) return 'منذ لحظات';
  const m = s / 60;
  if (m < 60) { const v = m < 10 ? Math.round(m * 10) / 10 : Math.floor(m); return `منذ ${v}د`; }
  const h = m / 60;
  if (h < 24) return `منذ ${Math.floor(h)}س`;
  const d = h / 24;
  if (d < 30) return d < 2 ? 'منذ يوم' : `منذ ${Math.floor(d)} أيام`;
  const mo = d / 30;
  if (mo < 12) return mo < 2 ? 'منذ شهر' : `منذ ${Math.floor(mo)} أشهر`;
  const y = d / 365;
  return y < 2 ? 'منذ سنة' : `منذ ${Math.floor(y)} سنوات`;
}
function hashStr(str) {
  let h = 7;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
function hexToRgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255}, ${a})`;
}
const chatIdOf = (a, b) => [a, b].sort().join('_');
const isHex = c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
const isPhoto = p => typeof p === 'string' && p.startsWith('data:image/jpeg;base64,');

/* ============================================================
   3) الحالة
   ============================================================ */
let db = null, auth = null, me = null;
let host = null, R = null, initPromise = null, fab = null, fromList = false;
const $ = s => R.querySelector(s);
const $$ = s => [...R.querySelectorAll(s)];

const People = {};          // uid -> { name, id, photo, bio, status }
const S = {
  other: null, chatId: null, msgsRef: null, token: 0,
  rows: new Map(), msgs: new Map(), sig: new Map(),
  unsubs: [], peopleUnsubs: [],
  firstKey: null, hasMore: false, loadingOlder: false,
  ready: false, quiet: false, clearedAt: 0,
  replyTo: null, pendingBlur: false,
  themeColor: '', textColor: '',
  profileUid: null, allCache: null, lastSend: 0, reactMsgId: null
};
const api = { onBack: null, version: 1 };

/* يُستدعى عند أول استعمال (بعد أن يكون index.html قد هيّأ Firebase) */
let fbReady = false;
function ensureFirebase() {
  if (fbReady) return true;
  try {
    const app = getApp();
    db = getDatabase(app); auth = getAuth(app);
    onAuthStateChanged(auth, user => {
      if (!user) { Presence.stop(); close(true); me = null; setLauncher(false); return; }
      me = user.uid;
      watchLauncher(user.uid);
    });
    fbReady = true;
  } catch (e) { console.warn('[SLAWChat] Firebase لم يُهيَّأ بعد', e); }
  return fbReady;
}

/* ============================================================
   4) البناء: تحميل chat.css و chat.html داخل Shadow DOM
   ============================================================ */
function init() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const [css, html] = await Promise.all([
      fetch(new URL('chat.css' + VER, BASE)).then(r => { if (!r.ok) throw new Error('css'); return r.text(); }),
      fetch(new URL('chat.html' + VER, BASE)).then(r => { if (!r.ok) throw new Error('html'); return r.text(); })
    ]);
    /* @property وخط Cairo يجب أن يكونا في الصفحة نفسها (لا يعملان داخل Shadow DOM) */
    const props = css.match(/@property[^}]+}/g);
    if (props) { const st = document.createElement('style'); st.textContent = props.join('\n'); document.head.appendChild(st); }
    if (!document.querySelector('link[data-slawchat-font]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.dataset.slawchatFont = '1';
      l.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap';
      document.head.appendChild(l);
    }
    host = document.createElement('div');
    host.id = 'slaw-chat-host';
    document.body.appendChild(host);
    const sh = host.attachShadow({ mode: 'open' });
    const st = document.createElement('style'); st.textContent = css;
    R = document.createElement('div'); R.id = 'chat-root'; R.innerHTML = html;
    sh.appendChild(st); sh.appendChild(R);
    fab = document.createElement('button');
    fab.id = 'chat-fab'; fab.type = 'button'; fab.title = 'المحادثات'; fab.textContent = '💬';
    fab.addEventListener('click', () => { Platform.playClick(); showFriends(); });
    sh.appendChild(fab);
    Platform.initClick();
    bindUI();
    buildPalette(); buildColorGrid();
    applyModel(Platform.getPref('ui_model_v1', '3'));
    applyFont(parseInt(Platform.getPref('ui_font_v1', String(FONT_DEFAULT)), 10));
  })();
  return initPromise;
}

/* ============================================================
   5) نوافذ + توست + تأكيد
   ============================================================ */
let toastT = null;
function toast(msg, ms) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms || 2200);
}
function openSheet(id) { closeSheets(); $('#' + id).classList.add('open'); $('#sheet-backdrop').classList.add('open'); }
function closeSheets() {
  $$('.sheet.open').forEach(s => s.classList.remove('open'));
  $('#sheet-backdrop').classList.remove('open');
  S.profileUid = null;
}
function askConfirm(title, text, okLabel, cancelLabel) {
  return new Promise(res => {
    $('#cm-title').textContent = title; $('#cm-text').textContent = text;
    $('#cm-ok').textContent = okLabel || 'تأكيد';
    $('#cm-cancel').textContent = cancelLabel || 'إلغاء';
    const m = $('#confirm-modal'); m.classList.add('open');
    const done = v => { m.classList.remove('open'); $('#cm-ok').onclick = null; $('#cm-cancel').onclick = null; res(v); };
    $('#cm-ok').onclick = () => done(true);
    $('#cm-cancel').onclick = () => done(false);
  });
}

/* ============================================================
   6) النماذج + الخط + الألوان
   ============================================================ */
function applyModel(id) {
  const m = MODELS.find(x => String(x.id) === String(id)) || MODELS[2];
  R.style.setProperty('--s', m.s);
  measureBars();
}
function applyFont(idx) {
  const v = FONT_STEPS[idx] != null ? FONT_STEPS[idx] : 1;
  R.style.setProperty('--fs', v);
}
function measureBars() {
  requestAnimationFrame(() => {
    const h = $('#chat-header'), f = $('#chat-input');
    if (h && h.offsetHeight) R.style.setProperty('--hdr-h', h.offsetHeight + 'px');
    if (f && f.offsetHeight) R.style.setProperty('--inp-h', f.offsetHeight + 'px');
  });
}
function buildModelPop() {
  const box = $('#model-grid');
  const cur = Platform.getPref('ui_model_v1', '3');
  box.innerHTML = '';
  MODELS.forEach(m => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'model-btn' + (String(m.id) === cur ? ' active' : '');
    const sz = Math.round(30 * m.s);
    b.innerHTML = `<span class="mb-n">نموذج ${m.id}</span><span class="mb-d">${escapeHtml(m.n)}</span>` +
      `<span class="mb-demo" style="width:${sz}px;height:${sz}px;font-size:${Math.round(14 * m.s)}px">⚙️</span>`;
    b.addEventListener('click', () => {
      Platform.setPref('ui_model_v1', String(m.id));
      applyModel(m.id); buildModelPop(); Platform.haptic(15);
      toast(`تم تطبيق نموذج ${m.id} ✔`);
    });
    box.appendChild(b);
  });
}
function buildFontPop() {
  const cur = parseInt(Platform.getPref('ui_font_v1', String(FONT_DEFAULT)), 10);
  const row = $('#font-steps'); row.innerHTML = '';
  FONT_STEPS.forEach((v, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'size-step' + (i === cur ? ' active' : '');
    b.style.fontSize = (11 + i * 2) + 'px';
    b.textContent = 'أ';
    b.addEventListener('click', () => {
      Platform.setPref('ui_font_v1', String(i));
      applyFont(i); buildFontPop(); Platform.haptic(10);
    });
    row.appendChild(b);
  });
  $('#font-label').textContent = `الحجم: ${Math.round(FONT_STEPS[cur] * 100)}%  (${cur + 1} / 10)`;
  $('#font-preview').style.fontSize = 'calc(15px * var(--fs))';
}

function applyThemeColor(hex) {
  const st = R.style;
  st.setProperty('--accent', hex);
  st.setProperty('--edge', `color-mix(in srgb, ${hex} 50%, #000)`);
  st.setProperty('--edge-glow', hexToRgba(hex, .5));
  st.setProperty('--bubble-me', `color-mix(in srgb, ${hex} 16%, #050505)`);
  st.setProperty('--bubble-me-border', hex);
  st.setProperty('--bubble-other', `color-mix(in srgb, ${hex} 7%, #060606)`);
  st.setProperty('--bubble-other-border', `color-mix(in srgb, ${hex} 42%, #000)`);
  st.setProperty('--bg-1', `color-mix(in srgb, ${hex} 4%, #030303)`);
  st.setProperty('--bg-2', `color-mix(in srgb, ${hex} 11%, #050505)`);
  st.setProperty('--ov1', `color-mix(in srgb, ${hex} 10%, rgba(5,5,5,.74))`);
  st.setProperty('--ov2', `color-mix(in srgb, ${hex} 14%, rgba(5,5,5,.85))`);
}
function colorWave(x, y, hex) {
  ['', ' ring'].forEach(extra => {
    const w = document.createElement('div');
    w.className = 'color-wave' + extra;
    w.style.left = x + 'px'; w.style.top = y + 'px';
    if (!extra) w.style.background = `radial-gradient(circle, ${hex} 0%, ${hex}00 70%)`;
    R.appendChild(w);
    setTimeout(() => w.remove(), 1200);
  });
}
function buildPalette() {
  const wrap = $('#palette-colors'); wrap.innerHTML = '';
  THEME_COLORS.forEach(hex => {
    const s = document.createElement('div');
    s.className = 'swatch' + (hex === S.themeColor ? ' active' : '');
    s.style.background = hex;
    s.addEventListener('click', () => {
      S.themeColor = hex;
      applyThemeColor(hex);
      const r = s.getBoundingClientRect();
      colorWave(r.left + r.width / 2, r.top + r.height / 2, hex);
      $$('.palette-colors .swatch').forEach(x => x.classList.toggle('active', x === s));
      if (me) Platform.setPref('slawchat_theme_' + me, hex);
      Platform.haptic(12);
      toast('تم تغيير اللون ✔');
    });
    wrap.appendChild(s);
  });
}
function buildColorGrid() {
  const g = $('#color-grid'); g.innerHTML = '';
  TEXT_COLORS.forEach(c => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'color-chip' + (S.textColor === c ? ' active' : '');
    b.style.background = c; b.style.color = c;
    b.addEventListener('click', e => {
      e.stopPropagation();
      setTextColor(c);
      $('#color-pop').classList.remove('open');
      Platform.haptic(15);
      toast('تم تثبيت لون الكتابة ✔');
    });
    g.appendChild(b);
  });
}
function setTextColor(c) {
  S.textColor = c || '';
  if (me) Platform.setPref('slawchat_tcolor_' + me, S.textColor);
  applyTextColorUI(); buildColorGrid();
}
function applyTextColorUI() {
  const inp = $('#msg-input'); if (inp) inp.style.color = S.textColor || '';
  const dot = $('#opt-color-dot');
  if (dot) { dot.textContent = S.textColor ? '●' : '🎨'; dot.style.color = S.textColor || ''; }
}
function loadPrefs() {
  const th = Platform.getPref('slawchat_theme_' + me, '');
  S.themeColor = isHex(th) ? th : '';
  if (S.themeColor) applyThemeColor(S.themeColor);
  const tc = Platform.getPref('slawchat_tcolor_' + me, '');
  S.textColor = isHex(tc) ? tc : '';
  buildPalette(); buildColorGrid(); applyTextColorUI();
}

/* ============================================================
   7) الأشخاص: ملف + حالة (متصل / بطارية / شبكة)
   ============================================================ */
function avatarColor(seed) { return `hsl(${hashStr(String(seed)) % 360} 55% 38%)`; }
function setAvatarEl(el, uid) {
  const p = People[uid] || {};
  el.textContent = '';
  if (isPhoto(p.photo)) {
    const img = document.createElement('img');
    img.alt = ''; img.src = p.photo;
    el.appendChild(img); el.style.background = '';
  } else {
    el.textContent = (p.name || '?').trim().charAt(0) || '?';
    el.style.background = avatarColor(uid);
  }
}
function displayName(uid) { return (People[uid] && People[uid].name) || (uid === me ? 'أنت' : 'صديق'); }
function isOnlineUser(st) { return !!st && st.online === true && (Date.now() - (st.lastSeen || 0)) < 150000; }

function listenPerson(uid) {
  People[uid] = People[uid] || {};
  S.peopleUnsubs.push(onValue(ref(db, 'profiles/' + uid), snap => {
    const v = snap.val() || {};
    People[uid] = { ...People[uid], name: v.name || '', id: v.id || '', photo: v.photo || '', bio: v.bio || '' };
    refreshAvatars(); if (S.other) updateChatHeader();
  }, () => {}));
}
function listenOtherStatus(uid) {
  S.peopleUnsubs.push(onValue(ref(db, 'status/' + uid), snap => {
    People[uid] = People[uid] || {};
    People[uid].status = snap.val() || {};
    updateChatHeader();
    if (S.profileUid === uid && $('#profile-modal').classList.contains('open')) renderProfile();
  }, () => { People[uid] = People[uid] || {}; People[uid].status = {}; }));
}
function refreshAvatars() {
  setAvatarEl($('#hdr-avatar'), S.other);
  $$('.msg-row').forEach(row => {
    const av = row.querySelector('.msg-avatar'); if (av) setAvatarEl(av, row.dataset.from);
  });
  if (S.profileUid) setAvatarEl($('#pm-avatar'), S.profileUid);
}
function updateChatHeader() {
  const uid = S.other; if (!uid) return;
  const p = People[uid] || {}, st = p.status || {};
  $('#hdr-name').textContent = p.name || '...';
  setAvatarEl($('#hdr-avatar'), uid);
  const n = $('#hdr-note');
  n.textContent = st.note ? '💭 ' + st.note : '';
  n.style.display = st.note ? 'block' : 'none';
  const el = $('#hdr-status');
  if (isOnlineUser(st)) { el.textContent = 'متصل'; el.className = 'hdr-status online'; }
  else { el.textContent = st.lastSeen ? 'غير متصل · ' + ago(st.lastSeen) : 'غير متصل'; el.className = 'hdr-status offline'; }
}

/* حضوري أنا: متصل + معلومات الجهاز */
const Presence = {
  timer: null, started: false, soon: null, bound: false,
  start() {
    if (this.started || !me) return;
    this.started = true;
    if (!this.bound) {
      this.bound = true;
      Platform.initBattery(() => this.pushSoon());
      Platform.initNetwork(() => this.pushSoon());
      document.addEventListener('visibilitychange', () => { if (this.started) this.push(!document.hidden); });
      window.addEventListener('pagehide', () => { if (this.started) this.push(false); });
    }
    try { onDisconnect(ref(db, 'status/' + me)).update({ online: false, lastSeen: serverTimestamp() }); } catch (e) {}
    this.push(true);
    this.timer = setInterval(() => this.push(true), 45000);
  },
  stop() {
    if (!this.started) return;
    clearInterval(this.timer); this.timer = null; this.started = false;
    if (me) this.push(false);
  },
  pushSoon() { clearTimeout(this.soon); this.soon = setTimeout(() => this.push(!document.hidden), 800); },
  push(online) {
    if (!me) return;
    const d = Platform.deviceSnapshot();
    const data = {
      online: !!online, lastSeen: serverTimestamp(),
      note: Platform.getPref('slawchat_note_' + me, '').slice(0, 60),
      conn: d.conn, wifi: d.wifi, eff: d.eff, dl: d.dl, rtt: d.rtt, bat: d.bat, chg: d.chg
    };
    update(ref(db, 'status/' + me), data).catch(() => {});
  }
};

/* ============================================================
   8) بناء الرسائل
   ============================================================ */
function messagesEl() { return $('#messages'); }
function belongs(m) {
  return !!m && typeof m === 'object' && m.from !== m.to &&
    (m.from === me || m.from === S.other) && (m.to === me || m.to === S.other);
}
function isViewing() {
  return !!S.other && R && R.classList.contains('open') && !document.hidden;
}
function msgRef(id) { return ref(db, `chats/${S.chatId}/messages/${id}`); }

/* ---------- الوسائط: تُحفظ في media/{chatId}/{key} ---------- */
const mediaCache = new Map();
async function mediaUrl(msg) {
  const key = msg && msg.mediaKey;
  if (typeof key !== 'string' || !RE_KEY.test(key) || !S.chatId) return '';
  const ck = S.chatId + '/' + key;
  if (mediaCache.has(ck)) return mediaCache.get(ck);
  const v = (await get(ref(db, `media/${ck}/d`))).val();
  if (typeof v !== 'string') return '';
  if (msg.type === 'image' && !RE_IMG.test(v)) return '';
  if (msg.type === 'audio' && !RE_AUD.test(v)) return '';
  if (mediaCache.size > 12) mediaCache.delete(mediaCache.keys().next().value);
  mediaCache.set(ck, v);
  return v;
}
function dataUrlToBlob(u) {
  const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(u);
  if (!m) return new Blob([]);
  const bin = atob(m[3]); const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: m[1] || 'application/octet-stream' });
}
const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'audio/webm': 'webm', 'audio/mpeg': 'mp3', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/mp4': 'm4a',
  'application/pdf': 'pdf', 'text/plain': 'txt' };
function safeFileName(name, mime, type) {
  name = String(name || 'file').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim().slice(0, 80) || 'file';
  if (/\.[A-Za-z0-9]{2,5}$/.test(name)) return name;
  const ext = MIME_EXT[(mime || '').split(';')[0]] || (type === 'image' ? 'jpg' : type === 'audio' ? 'webm' : '');
  return ext ? name + '.' + ext : name;
}
async function downloadMsg(msg, id) {
  toast('⬇ جاري التنزيل...');
  try {
    const u = await mediaUrl(msg);
    if (!u) { toast('تعذّر تحميل الملف'); return; }
    const blob = dataUrlToBlob(u);
    await Platform.saveBlob(blob, safeFileName(msg.fileName, blob.type, msg.type));
    toast(NATIVE ? 'اختر مكان الحفظ ✔' : 'تم التنزيل ✔');
    /* عند تحميل الطرف الآخر → يظهر "قام بتحميلها ♻️" للطرفين */
    if (msg.from !== me && id && !msg.downloaded) {
      update(msgRef(id), { downloaded: true, downloadedAt: serverTimestamp() }).catch(() => {});
    }
  } catch (e) { console.error(e); toast('تعذّر التنزيل'); }
}
function makeDlBtn(msg, id) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'msg-dl'; b.textContent = '⬇ تنزيل';
  b.addEventListener('click', e => { e.stopPropagation(); downloadMsg(msg, id); });
  return b;
}
let io = null;
function lazyLoad(el, fn) {
  if (!('IntersectionObserver' in window)) { fn(); return; }
  if (!io) io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { io.unobserve(e.target); if (e.target._load) e.target._load(); }
  }), { root: messagesEl(), rootMargin: '300px' });
  el._load = fn; io.observe(el);
}
async function openViewer(msg, id) {
  const body = $('#viewer-body'); body.innerHTML = '';
  const img = document.createElement('img'); img.alt = '';
  if (isPhoto(msg.thumb)) img.src = msg.thumb;
  body.appendChild(img);
  $('#viewer-download').onclick = () => downloadMsg(msg, id);
  $('#viewer').classList.add('open');
  try { const u = await mediaUrl(msg); if (u) img.src = u; } catch (e) {}
}

function buildAudio(msg, id) {
  const w = document.createElement('div');
  w.className = 'aud';
  const seed = hashStr(String(id || msg.ts || 'x'));
  let bars = '';
  for (let i = 0; i < 30; i++) bars += `<i style="height:${Math.round(24 + Math.abs(Math.sin(seed + i * 1.7)) * 70)}%"></i>`;
  w.innerHTML = `<div class="aud-lbl">🎧 استمع إليها</div>
    <div class="aud-row"><button type="button" class="aud-play">▶</button>
    <div class="aud-bars">${bars}</div><span class="aud-time">${fmtDur(msg.dur || 0)}</span></div>`;
  const btn = w.querySelector('.aud-play'), barsEl = w.querySelector('.aud-bars'), timeEl = w.querySelector('.aud-time');
  const bs = [...barsEl.children];
  const a = new Audio(); a.preload = 'none';
  let loaded = false;
  const dur = () => (isFinite(a.duration) && a.duration > 0) ? a.duration : (msg.dur || 0);
  const paint = p => { const on = Math.round(p * bs.length); bs.forEach((b, i) => b.classList.toggle('on', i < on)); };
  async function ensure() {
    if (loaded) return true;
    btn.textContent = '⏳';
    let u = '';
    try { u = await mediaUrl(msg); } catch (e) {}
    if (!u) { btn.textContent = '▶'; toast('تعذّر تحميل الصوت'); return false; }
    a.src = u; loaded = true; return true;
  }
  btn.addEventListener('click', async e => {
    e.stopPropagation();
    if (!a.paused) { a.pause(); return; }
    if (!(await ensure())) return;
    if (curAudio && curAudio !== a) curAudio.pause();
    curAudio = a;
    try { await a.play(); } catch (err) { btn.textContent = '▶'; toast('تعذّر تشغيل الصوت'); }
  });
  a.addEventListener('play', () => { btn.textContent = '⏸'; w.classList.add('playing'); });
  a.addEventListener('pause', () => { btn.textContent = '▶'; w.classList.remove('playing'); });
  a.addEventListener('ended', () => { btn.textContent = '▶'; w.classList.remove('playing'); paint(0); timeEl.textContent = fmtDur(dur()); });
  a.addEventListener('timeupdate', () => { const d = dur(); if (d) paint(a.currentTime / d); timeEl.textContent = fmtDur(a.currentTime); });
  barsEl.addEventListener('click', async e => {
    e.stopPropagation();
    if (!(await ensure())) return;
    const r = barsEl.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (r.right - e.clientX) / r.width));   // RTL
    const d = dur();
    if (d) { try { a.currentTime = frac * d; } catch (err) {} }
    if (a.paused) btn.click();
  });
  return w;
}
let curAudio = null;
function fmtDur(s) {
  s = Math.max(0, Math.round(s || 0));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function buildContent(msg, id, blurred) {
  const content = document.createElement('div');
  content.className = 'msg-content';
  if (msg.type === 'image') {
    const img = document.createElement('img');
    img.className = 'msg-image'; img.alt = ''; img.decoding = 'async';
    if (Number(msg.w) > 0 && Number(msg.h) > 0) img.style.aspectRatio = Number(msg.w) + ' / ' + Number(msg.h);
    if (isPhoto(msg.thumb)) img.src = msg.thumb;
    img.classList.add('lazy-blur');
    lazyLoad(img, () => {
      mediaUrl(msg).then(u => { if (u) { img.src = u; img.classList.remove('lazy-blur'); } }).catch(() => {});
    });
    img.addEventListener('click', e => { e.stopPropagation(); openViewer(msg, id); });
    content.appendChild(img);
    content.appendChild(makeDlBtn(msg, id));
  } else if (msg.type === 'audio') {
    content.appendChild(buildAudio(msg, id));
    content.appendChild(makeDlBtn(msg, id));
  } else if (msg.type === 'file') {
    const wrap = document.createElement('div');
    wrap.className = 'msg-file';
    const ico = document.createElement('span'); ico.className = 'f-ico'; ico.textContent = '📄';
    const box = document.createElement('div');
    const nm = document.createElement('div'); nm.className = 'f-name'; nm.textContent = String(msg.fileName || 'ملف');
    box.appendChild(nm); box.appendChild(makeDlBtn(msg, id));
    wrap.appendChild(ico); wrap.appendChild(box);
    content.appendChild(wrap);
  } else if (blurred) {
    content.textContent = String(msg.text || '').slice(0, 160).replace(/[^\s]/g, '▒');   // لا نص حقيقي في الصفحة
  } else {
    if (isHex(msg.color)) content.style.color = msg.color;
    content.innerHTML = escapeHtml(msg.text || '').replace(/\n/g, '<br>');
  }
  return content;
}

function buildRow(msg, id, opts) {
  opts = opts || {};
  const isMe = msg.from === me;
  const isText = !msg.type || msg.type === 'text';
  const blurred = !!msg.blur && !msg.revealed && isText;

  const row = document.createElement('div');
  row.className = 'msg-row ' + (isMe ? 'me' : 'other') + (opts.noAnim ? ' no-anim' : '');
  row.dataset.id = id; row.dataset.from = msg.from;
  row.style.setProperty('--d', (Math.random() * 1.2).toFixed(2) + 's');

  const av = document.createElement('div');
  av.className = 'msg-avatar';
  setAvatarEl(av, msg.from);
  row.appendChild(av);

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble' + (blurred ? ' blurred' : '');

  if (msg.replyTo && typeof msg.replyTo === 'object') {
    const r = document.createElement('div');
    r.className = 'msg-reply';
    const b = document.createElement('b'); b.textContent = String(msg.replyTo.name || '');
    const sp = document.createElement('span'); sp.textContent = String(msg.replyTo.text || '');
    r.appendChild(b); r.appendChild(sp);
    if (msg.replyTo.id) r.addEventListener('click', e => { e.stopPropagation(); jumpTo(String(msg.replyTo.id)); });
    bubble.appendChild(r);
  }

  const content = buildContent(msg, id, blurred);
  bubble.appendChild(content);

  if (msg.downloaded && !isText) {
    const dn = document.createElement('div');
    dn.className = 'dl-note'; dn.textContent = 'قام بتحميلها ♻️';
    bubble.appendChild(dn);
  }

  /* السطر السفلي: منذ ... / تم تعديلها / √ */
  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  const time = document.createElement('span');
  time.className = 'msg-time';
  time.dataset.ts = msg.ts || Date.now();
  time.title = fmt12(msg.ts);
  time.textContent = ago(msg.ts || Date.now());
  meta.appendChild(time);
  if (msg.edited) {
    const ed = document.createElement('span');
    ed.className = 'msg-edited'; ed.textContent = 'تم تعديلها';
    meta.appendChild(ed);
  }
  if (isMe) {
    const st = document.createElement('span');
    st.className = 'msg-status';
    st.innerHTML = `<span class="tk ${msg.delivered ? 'ok' : 'no'}" title="${msg.delivered ? 'وصلت' : 'لم تصل بعد'}">√</span>` +
      (msg.seen ? ' <span class="eye" title="شوهدت">👁</span>' : '');
    meta.appendChild(st);
  }
  bubble.appendChild(meta);

  if (msg.reactions && typeof msg.reactions === 'object' && Object.keys(msg.reactions).length) {
    const rx = document.createElement('div');
    rx.className = 'msg-reactions';
    Object.entries(msg.reactions).forEach(([emo, users]) => {
      const sp = document.createElement('span');
      sp.textContent = `${emo} ${Object.keys(users || {}).length}`;
      rx.appendChild(sp);
    });
    bubble.appendChild(rx);
  }

  /* أزرار: نسخ + تعديل + حذف */
  const bar = document.createElement('div');
  bar.className = 'msg-actions';
  let n = 0;
  const mk = (cls, title, txt, fn) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'msg-act ' + cls; b.title = title; b.textContent = txt;
    b.addEventListener('click', e => { e.stopPropagation(); fn(); });
    bar.appendChild(b); n++;
  };
  if (isText && !blurred) mk('copy', 'نسخ الرسالة', '📋', () => copyText(msg.text || ''));
  if (isMe && isText) mk('edit', 'تعديل الرسالة', '✏️', () => startEdit(msg, id, row, bubble, content));
  if (isMe) mk('del', 'حذف الرسالة', '🗑️', () => deleteOwnMessage(msg, id, row));
  if (n) bubble.appendChild(bar);

  let longPressed = false;
  bubble.addEventListener('click', e => {
    if (longPressed) { longPressed = false; return; }
    if (e.target.closest('.msg-actions, .msg-edit, .aud, .msg-reply')) return;
    if (bubble.classList.contains('blurred') && !isMe) {
      Platform.haptic(20);
      update(msgRef(id), { revealed: true }).catch(() => toast('تعذّر كشف الرسالة'));
      return;
    }
    if (e.target.closest('img, a, button')) return;
    if (!bubble.querySelector('.msg-actions') || bubble.classList.contains('editing')) return;
    const open = bubble.classList.contains('show-actions');
    closeAllActions();
    if (!open) bubble.classList.add('show-actions');
  });

  let pressTimer = null;
  bubble.addEventListener('touchstart', () => {
    if (bubble.classList.contains('editing')) return;
    pressTimer = setTimeout(() => {
      longPressed = true;
      Platform.haptic(25);
      openReactions(id, bubble);
      if (bubble.querySelector('.msg-actions')) { closeAllActions(); bubble.classList.add('show-actions'); }
    }, 500);
  }, { passive: true });
  bubble.addEventListener('touchend', () => clearTimeout(pressTimer));
  bubble.addEventListener('touchmove', () => clearTimeout(pressTimer), { passive: true });
  bubble.addEventListener('contextmenu', e => {
    e.preventDefault();
    if (bubble.classList.contains('editing')) return;
    openReactions(id, bubble);
    if (bubble.querySelector('.msg-actions')) { closeAllActions(); bubble.classList.add('show-actions'); }
  });
  attachSwipeToReply(bubble, msg, id);

  row.appendChild(bubble);
  return row;
}

/* وضع الصف في مكانه الصحيح حسب المفتاح (المفاتيح مرتبة زمنياً) */
function placeRow(id, row) {
  const box = messagesEl();
  const ph = box.querySelector('.msgs-loading'); if (ph) ph.remove();
  let before = null;
  for (const el of box.children) {
    if (el.dataset && el.dataset.id && el.dataset.id > id) { before = el; break; }
  }
  if (before) box.insertBefore(row, before); else box.appendChild(row);
}
function renderMessage(msg, id, opts) {
  opts = opts || {};
  const existing = S.rows.get(id);
  if (existing && existing.dataset.editing) { existing._pending = { msg, id }; return; }
  if (existing && existing.dataset.removing) return;
  const row = buildRow(msg, id, { noAnim: !!existing || opts.animate === false });
  /* لا نقطع تشغيل صوت جارٍ عند تحديث الرسالة (وصلت/شوهدت...) */
  if (existing && msg.type === 'audio') {
    const oldAud = existing.querySelector('.aud'), newAud = row.querySelector('.aud');
    if (oldAud && newAud) newAud.replaceWith(oldAud);
  }
  S.rows.set(id, row);
  if (existing) existing.replaceWith(row); else placeRow(id, row);
}
function closeAllActions() { $$('.msg-bubble.show-actions').forEach(b => b.classList.remove('show-actions')); }
function animateRemove(row, done) {
  if (!row || row.dataset.removing) return;
  row.dataset.removing = '1';
  row.classList.add('deleting');
  setTimeout(() => { row.remove(); if (done) done(); }, 400);
}
function removeMessageRow(id) { animateRemove(S.rows.get(id), () => S.rows.delete(id)); }
function clearMessagesDom() { messagesEl().innerHTML = ''; S.rows.clear(); }
function scrollToBottom() { const m = messagesEl(); m.scrollTop = m.scrollHeight; }

/* ============================================================
   9) الاستماع للرسائل (نافذة تكبر عند تحميل الأقدم)
   ============================================================ */
function detachMessages() {
  S.unsubs.forEach(fn => { try { fn(); } catch (e) {} });
  S.unsubs = [];
}
function attachMessages(startKey, onReady) {
  detachMessages();
  const tok = S.token;
  S.quiet = true;
  const q = startKey
    ? query(S.msgsRef, orderByKey(), startAt(startKey))
    : query(S.msgsRef, orderByKey(), limitToLast(PAGE));
  const fail = err => {
    if (tok !== S.token) return;
    console.error(err);
    clearMessagesDom();
    messagesEl().innerHTML = '<div class="msgs-loading">⛔ لا تملك صلاحية فتح هذه المحادثة</div>';
  };
  S.unsubs.push(onChildAdded(q, snap => { if (tok === S.token) onMsg('added', snap.key, snap.val()); }, fail));
  S.unsubs.push(onChildChanged(q, snap => { if (tok === S.token) onMsg('changed', snap.key, snap.val()); }, () => {}));
  S.unsubs.push(onChildRemoved(q, snap => { if (tok === S.token) onMsg('removed', snap.key); }, () => {}));
  onValue(q, () => {
    if (tok !== S.token) return;
    S.quiet = false;
    if (!S.ready) {
      S.ready = true;
      S.hasMore = S.msgs.size >= PAGE;
      if (!S.msgs.size) { const ph = messagesEl().querySelector('.msgs-loading'); if (ph) ph.remove(); }
      refreshOlderBox(); scrollToBottom(); markAllSeen();
    }
    if (onReady) onReady();
  }, fail, { onlyOnce: true });
}

function onMsg(kind, id, msg) {
  if (kind === 'removed') {
    S.msgs.delete(id); S.sig.delete(id);
    if (S.firstKey === id) { S.firstKey = [...S.msgs.keys()].sort()[0] || null; }
    removeMessageRow(id);
    return;
  }
  if (!belongs(msg)) return;
  if (S.clearedAt && msg.ts && msg.ts <= S.clearedAt) return;

  const sig = JSON.stringify(msg);
  const known = S.msgs.has(id);
  if (known && S.sig.get(id) === sig && S.rows.has(id)) return;     // لا تغيير

  const full = { ...msg };
  S.msgs.set(id, full); S.sig.set(id, sig);
  if (!S.firstKey || id < S.firstKey) S.firstKey = id;

  if (full.to === me) handleIncoming(full, id, known);

  const live = S.ready && !S.quiet;
  if (S.ready) {
    const box = messagesEl();
    const near = box.scrollHeight - box.scrollTop - box.clientHeight < 180;
    renderMessage(full, id, { animate: live && kind === 'added' && !known });
    if (live && kind === 'added' && !known && (near || full.from === me)) scrollToBottom();
  } else {
    renderMessage(full, id, { animate: false });
  }
}

/* رسالة واردة: وصلت (أخضر) ثم شوهدت إن كان الشات مفتوحاً */
function handleIncoming(m, id, known) {
  const patch = {};
  const first = !m.delivered;
  if (!m.delivered) { patch.delivered = true; patch.deliveredAt = serverTimestamp(); m.delivered = true; }
  if (!m.seen && isViewing()) { patch.seen = true; patch.seenAt = serverTimestamp(); m.seen = true; }
  if (Object.keys(patch).length) update(msgRef(id), patch).catch(() => {});
  if (first && S.ready && !S.quiet && !known && isViewing()) Platform.haptic(25);
}
function markAllSeen() {
  if (!isViewing()) return;
  S.msgs.forEach((m, id) => {
    if (m.to === me && !m.seen) {
      m.seen = true;
      update(msgRef(id), { seen: true, seenAt: serverTimestamp(), delivered: true }).catch(() => {});
    }
  });
}

/* زر "تحميل رسائل أقدم" */
function refreshOlderBox() {
  const box = messagesEl();
  let ob = box.querySelector('#older-box');
  if (S.hasMore) {
    if (!ob) {
      ob = document.createElement('button');
      ob.id = 'older-box'; ob.type = 'button'; ob.className = 'older-box';
      ob.addEventListener('click', loadOlder);
      box.prepend(ob);
    }
    ob.textContent = S.loadingOlder ? '⏳ جار التحميل...' : '⬆ تحميل رسائل أقدم';
  } else if (ob) ob.remove();
}
async function loadOlder() {
  if (!S.other || S.loadingOlder || !S.hasMore || !S.firstKey) return;
  S.loadingOlder = true; refreshOlderBox();
  const tok = S.token;
  try {
    const snap = await get(query(S.msgsRef, orderByKey(), endBefore(S.firstKey), limitToLast(PAGE)));
    if (tok !== S.token) return;
    const keys = []; snap.forEach(c => { keys.push(c.key); });
    S.hasMore = keys.length >= PAGE;
    if (keys.length) {
      const box = messagesEl(), prevH = box.scrollHeight, prevT = box.scrollTop;
      await new Promise(res => attachMessages(keys[0], () => {
        box.scrollTop = prevT + (box.scrollHeight - prevH);
        res();
      }));
    }
  } catch (e) { console.error(e); toast('تعذّر تحميل الرسائل الأقدم'); }
  S.loadingOlder = false; refreshOlderBox();
}

/* الانتقال لرسالة (يحمّل القديم إن لزم) */
async function jumpTo(id) {
  let row = S.rows.get(id);
  if (!row && S.firstKey && id < S.firstKey) {
    try {
      const box = messagesEl(), prevH = box.scrollHeight, prevT = box.scrollTop;
      await new Promise(res => attachMessages(id, () => { box.scrollTop = prevT + (box.scrollHeight - prevH); res(); }));
      S.hasMore = true; refreshOlderBox();
    } catch (e) {}
    row = S.rows.get(id);
  }
  if (!row) { toast('الرسالة الأصلية غير موجودة'); return; }
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash');
  setTimeout(() => row.classList.remove('flash'), 1800);
}

/* ============================================================
   10) أفعال الرسالة: نسخ / حذف / تعديل / تفاعل / رد
   ============================================================ */
async function copyText(t) {
  await Platform.copyText(t);
  Platform.haptic(10); toast('تم النسخ ✔');
}
async function deleteOwnMessage(msg, id, row) {
  if (msg.from !== me) { toast('لا يمكنك حذف رسائل الطرف الآخر'); return; }
  const bubble = row.querySelector('.msg-bubble');
  if (bubble) bubble.classList.remove('show-actions');
  try {
    await remove(msgRef(id));
    if (msg.mediaKey && RE_KEY.test(msg.mediaKey)) remove(ref(db, `media/${S.chatId}/${msg.mediaKey}`)).catch(() => {});
  } catch (err) {
    console.error(err); toast('تعذّر حذف الرسالة');
  }
}
function startEdit(msg, id, row, bubble, content) {
  if (msg.from !== me) { toast('لا يمكنك تعديل رسائل الطرف الآخر'); return; }
  if (msg.type && msg.type !== 'text') { toast('يمكن تعديل الرسائل النصية فقط'); return; }
  if (row.dataset.editing) return;
  row.dataset.editing = '1';
  bubble.classList.remove('show-actions');
  bubble.classList.add('editing');

  const box = document.createElement('div');
  box.className = 'msg-edit';
  const ta = document.createElement('textarea');
  ta.className = 'msg-edit-input'; ta.value = msg.text || ''; ta.rows = 1; ta.maxLength = MAX_TEXT;
  const btns = document.createElement('div');
  btns.className = 'msg-edit-btns';
  const ok = document.createElement('button');
  ok.type = 'button'; ok.className = 'msg-edit-ok'; ok.textContent = '✔ حفظ';
  const no = document.createElement('button');
  no.type = 'button'; no.className = 'msg-edit-no'; no.textContent = '✖ إلغاء';
  btns.appendChild(ok); btns.appendChild(no);
  box.appendChild(ta); box.appendChild(btns);
  content.style.display = 'none';
  content.after(box);

  const autosize = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'; };
  autosize(); ta.addEventListener('input', autosize);
  ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);

  const finish = rerenderPending => {
    box.remove(); content.style.display = '';
    bubble.classList.remove('editing');
    delete row.dataset.editing;
    const p = row._pending; row._pending = null;
    if (rerenderPending && p) renderMessage(p.msg, p.id, { animate: false });
  };
  const save = async () => {
    const t = ta.value.trim();
    if (!t) { toast('لا يمكن أن تكون الرسالة فارغة'); return; }
    if (t === (msg.text || '')) { finish(true); return; }
    finish(false);
    try {
      await update(msgRef(id), { text: t.slice(0, MAX_TEXT), edited: true, editedAt: serverTimestamp() });
      toast('تم تعديلها ✔');
    } catch (err) { console.error(err); toast('تعذّر تعديل الرسالة'); }
  };
  ok.addEventListener('click', e => { e.stopPropagation(); save(); });
  no.addEventListener('click', e => { e.stopPropagation(); finish(true); });
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
    else if (e.key === 'Escape') { e.preventDefault(); finish(true); }
  });
}

function attachSwipeToReply(bubble, msg, id) {
  let startX = 0, moved = false;
  bubble.addEventListener('touchstart', e => { startX = e.touches[0].clientX; moved = false; }, { passive: true });
  bubble.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - startX;
    if (dx > 60) { moved = true; bubble.style.transform = `translateX(${Math.min(dx, 100)}px)`; }
  }, { passive: true });
  bubble.addEventListener('touchend', () => {
    if (moved) { bubble.style.transform = ''; Platform.haptic(20); setReply(msg, id); }
  });
}
function setReply(msg, id) {
  const hidden = msg.blur && !msg.revealed;
  const txt = hidden ? '🌫️ رسالة مغبشة'
    : (msg.text || (msg.type === 'image' ? '📷 صورة' : msg.type === 'audio' ? '🎵 تسجيل صوتي' : '📄 ' + (msg.fileName || 'ملف')));
  S.replyTo = { id, name: displayName(msg.from).slice(0, 30), text: String(txt).slice(0, 140) };
  $('#rp-name').textContent = S.replyTo.name;
  $('#rp-text').textContent = S.replyTo.text;
  $('#reply-preview').classList.add('open');
  $('#msg-input').focus();
}
function clearReply() { S.replyTo = null; $('#reply-preview').classList.remove('open'); }

function openReactions(msgId, bubble) {
  S.reactMsgId = msgId;
  const rect = bubble.getBoundingClientRect();
  const bar = $('#reactions-bar');
  bar.style.left = Math.max(10, Math.min(rect.left, window.innerWidth - 280)) + 'px';
  bar.style.top = Math.max(10, rect.top - 46) + 'px';
  bar.classList.add('open');
}
async function toggleReaction(emo) {
  const id = S.reactMsgId, m = id && S.msgs.get(id);
  if (!m) return;
  const has = !!(m.reactions && m.reactions[emo] && m.reactions[emo][me]);
  const r = ref(db, `chats/${S.chatId}/messages/${id}/reactions/${emo}/${me}`);
  Platform.haptic(15);
  try {
    if (has) await remove(r); else await set(r, true);
    toast(has ? 'تم إلغاء التفاعل' : 'تم التفاعل ' + emo);
  } catch (e) { toast('تعذّر إضافة التفاعل'); }
}

/* ============================================================
   11) الإرسال
   ============================================================ */
function sendMessage(extra, force) {
  if (!S.other) { toast('اختر محادثة أولاً'); return false; }
  const now = Date.now();
  if (!force && now - S.lastSend < 300) return false;                 // حماية بسيطة من الضغط المتكرر (الحد الحقيقي في المرحلة هـ)
  S.lastSend = now;
  const msg = { from: me, to: S.other, type: 'text', ts: serverTimestamp(), ...extra };
  const r = push(S.msgsRef);
  return set(r, msg).then(() => { Platform.haptic(12); return true; })
    .catch(async e => {
      console.error(e);
      const code = (e && (e.code || e.message)) || 'خطأ';
      const extra = /PERMISSION/i.test(code) ? await diagnose() : '';
      toast('⛔ تعذّر الإرسال: ' + code + extra, 9000);
      return false;
    });
}
/* تشخيص سبب رفض الصلاحية: يُعرض مع رسالة الخطأ */
async function diagnose() {
  const out = [];
  try { out.push('صداقة: ' + ((await get(ref(db, 'friends/' + me + '/' + S.other))).exists() ? 'نعم' : 'لا')); }
  catch (e) { out.push('صداقة: ؟'); }
  try { out.push('حظرتَه أنت: ' + ((await get(ref(db, 'blocks/' + me + '/' + S.other))).exists() ? 'نعم ← هذا هو السبب' : 'لا')); }
  catch (e) { out.push('حظر: ؟'); }
  out.push('موثّق: ' + (auth.currentUser && auth.currentUser.emailVerified ? 'نعم' : 'لا'));
  try { await get(ref(db, `chats/${S.chatId}/cleared/${me}`)); out.push('قراءة الشات: نعم'); }
  catch (e) { out.push('قراءة الشات: لا'); }
  return ' [' + out.join(' | ') + ']';
}
function sendTextMessage() {
  const input = $('#msg-input');
  const text = input.value.trim();
  if (!text) return;
  const extra = { text: text.slice(0, MAX_TEXT) };
  if (S.textColor) extra.color = S.textColor;
  if (S.pendingBlur) { extra.blur = true; extra.revealed = false; }
  if (text === '.تحميل' && S.replyTo) {
    const m = S.msgs.get(S.replyTo.id);
    if (m && m.type && m.type !== 'text') downloadMsg(m, S.replyTo.id); else toast('الرسالة المرتبطة ليست ملفاً');
    input.value = ''; clearReply(); return;
  }
  if (S.replyTo) extra.replyTo = { ...S.replyTo };
  if (!sendMessage(extra)) return;
  input.value = ''; input.style.height = 'auto';
  clearReply();
  S.pendingBlur = false; input.classList.remove('blur-armed');
  measureBars();
}


/* ============================================================
   11-ب) إرسال الوسائط: صورة / صوت / ملف  (تُحفظ في media/ داخل قاعدة البيانات
         لأن Storage غير مفعّل — عند تفعيله تتغير دالة uploadMedia فقط)
   ============================================================ */
function addPending(label, previewUrl) {
  const row = document.createElement('div');
  row.className = 'msg-row me pending no-anim';
  row.innerHTML = `<div class="msg-bubble"><div class="pend-box">
      ${previewUrl ? '<img class="pend-img" alt="">' : ''}
      <div class="pend-txt"><span class="pend-spin"></span><span class="pend-label"></span></div>
      <div class="pend-bar"><i></i></div></div></div>`;
  row.querySelector('.pend-label').textContent = label;
  if (previewUrl) row.querySelector('.pend-img').src = previewUrl;
  messagesEl().appendChild(row);
  scrollToBottom();
  const bar = row.querySelector('.pend-bar i');
  return {
    set(p) { bar.style.width = Math.round(p * 100) + '%'; },
    remove() { row.remove(); if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl); },
    fail(t) {
      row.querySelector('.pend-label').textContent = t;
      row.classList.add('failed');
      setTimeout(() => row.remove(), 3000);
    }
  };
}
/* رفع الوسيط  ← عند تفعيل Storage تُستبدل هذه الدالة فقط */
async function uploadMedia(dataUrl) {
  if (dataUrl.length > MAX_DATA_CHARS) throw new Error('big');
  const key = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  await set(ref(db, `media/${S.chatId}/${key}`), { d: dataUrl, u: me, to: S.other });
  return key;
}
async function sendMedia(kind, file, label, extra0) {
  if (!S.other) return;
  const tok = S.token, reply = S.replyTo;
  if (file.size > MAX_FILE_BYTES && kind !== 'image') { toast('⛔ الملف كبير جداً (الحد 1.5 ميغابايت)'); return; }
  const pend = addPending(label, kind === 'image' ? URL.createObjectURL(file) : null);
  let fake = 0.05; pend.set(fake);
  const tick = setInterval(() => { fake = Math.min(0.9, fake + 0.04); pend.set(fake); }, 200);
  try {
    let blob = file; const extra = { fileName: String(file.name || '').slice(0, 100), ...(extra0 || {}) };
    if (kind === 'image') {
      if (!/gif/i.test(file.type)) {
        try { const r = await Platform.compressImage(file, 1280, .78); blob = r.blob; extra.w = r.w; extra.h = r.h; } catch (e) {}
      }
      try { const t = await Platform.compressImage(file, 32, .5); extra.thumb = await Platform.blobToDataUrl(t.blob); } catch (e) {}
      if (blob === file && !/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error('type');
      if (/^data:image\/jpeg/.test(extra.thumb || '') === false) delete extra.thumb;
      extra.fileName = (extra.fileName || 'image').replace(/\.\w+$/, '') + (blob === file ? '' : '.jpg');
    }
    const dataUrl = await Platform.blobToDataUrl(blob);
    if (tok !== S.token) throw new Error('closed');
    const key = await uploadMedia(dataUrl);
    clearInterval(tick); pend.remove();
    const ok = await sendMessage({ type: kind, mediaKey: key, ...extra, ...(reply ? { replyTo: { ...reply } } : {}) }, true);
    if (!ok) remove(ref(db, `media/${S.chatId}/${key}`)).catch(() => {});
    else if (S.replyTo === reply) clearReply();
  } catch (err) {
    clearInterval(tick);
    console.error(err);
    pend.fail(err && err.message === 'big' ? '⛔ الملف كبير جداً' : err && err.message === 'type' ? '⛔ نوع الصورة غير مدعوم' : '⛔ فشل الإرسال — حاول مرة أخرى');
  }
}
async function pickAndSend(kind) {
  const accept = kind === 'image' ? 'image/*' : kind === 'audio' ? 'audio/*' : '*/*';
  const f = await Platform.pickFile(accept);
  if (!f) return;
  sendMedia(kind, f, kind === 'image' ? 'جار إرسال الصورة…' : kind === 'audio' ? 'جار إرسال الصوت…' : 'جار إرسال الملف…');
}

/* ============================================================
   15) التسجيل الصوتي + المسودات (زر 🎤)
   ============================================================ */
const Rec = { stream: null, mr: null, chunks: [], mime: '', secs: 0, timer: null, paused: false,
              action: 'send', prev: null, chat: null, active: false, token: 0 };
const draftKey = () => me + '__' + S.other;
async function refreshDraftDot() {
  const mic = $('#btn-mic');
  if (!S.other || !me) { mic.classList.remove('has-draft'); return; }
  const d = await Platform.draftGet(draftKey());
  mic.classList.toggle('has-draft', !!(d && d.blob));
}
function stopStream() { if (Rec.stream) { Rec.stream.getTracks().forEach(t => t.stop()); Rec.stream = null; } }
async function startRecording() {
  if (Rec.active) { toast('التسجيل جارٍ'); return; }
  if (!S.other) return;
  const key = draftKey(), chat = S.other, chatId = S.chatId;
  Rec.prev = null; let prevDur = 0;
  const d = await Platform.draftGet(key);
  if (d && d.blob) {
    const cont = await askConfirm('🎙️ صوت محفوظ', 'هل تريد إكمال صوت محفوظ؟', 'نعم', 'لا');
    if (cont) { Rec.prev = d.blob; prevDur = d.dur || 0; }
    else { await Platform.draftDel(key); refreshDraftDot(); }
  }
  if (Rec.prev && prevDur >= MAX_MERGE_SECS) {
    toast('⛔ المسودة وصلت الحد الأقصى للإكمال (60 ثانية) — سيُرسل المحفوظ كما هو');
    sendAudioBlob(Rec.prev, prevDur, chatId, chat); await Platform.draftDel(key); refreshDraftDot(); Rec.prev = null; return;
  }
  try { Rec.stream = await Platform.getMic(); }
  catch (e) { toast('⛔ لا يمكن الوصول للميكروفون — اسمح به من الإعدادات'); return; }
  const mime = Platform.recMime();
  try { Rec.mr = mime ? new MediaRecorder(Rec.stream, { mimeType: mime }) : new MediaRecorder(Rec.stream); }
  catch (e) { stopStream(); toast('⛔ التسجيل غير مدعوم هنا'); return; }
  Rec.chat = chat; Rec.chatId = chatId; Rec.chunks = []; Rec.mime = Rec.mr.mimeType || mime || 'audio/webm';
  Rec.secs = prevDur; Rec.paused = false; Rec.action = 'send'; Rec.active = true; Rec.token = S.token;
  Rec.limit = Rec.prev ? MAX_MERGE_SECS : MAX_REC_SECS;
  Rec.mr.ondataavailable = e => { if (e.data && e.data.size) Rec.chunks.push(e.data); };
  Rec.mr.onstop = onRecStop;
  Rec.mr.start(500);                       // قطع كل نصف ثانية → المسودة لا تكون فارغة
  $('#record-panel').classList.add('open'); $('#record-panel').classList.remove('paused');
  $('#btn-mic').classList.add('recording');
  $('#rec-pause').textContent = '⏸';
  startRecTimer(); measureBars(); Platform.haptic(30);
}
function startRecTimer() {
  clearInterval(Rec.timer);
  const upd = () => { $('#rec-time').textContent = String(Math.floor(Rec.secs / 60)).padStart(2, '0') + ':' + String(Rec.secs % 60).padStart(2, '0'); };
  upd();
  Rec.timer = setInterval(() => {
    if (Rec.paused) return;
    Rec.secs++; upd();
    if (Rec.secs >= Rec.limit) { toast('وصلت الحد الأقصى للتسجيل'); stopRecorder('send'); }
  }, 1000);
}
function pauseRecording() {
  if (!Rec.mr || !Rec.active) return;
  try {
    if (Rec.paused) { Rec.mr.resume(); Rec.paused = false; $('#rec-pause').textContent = '⏸'; $('#record-panel').classList.remove('paused'); }
    else { Rec.mr.pause(); Rec.paused = true; $('#rec-pause').textContent = '▶'; $('#record-panel').classList.add('paused'); }
    Platform.haptic(15);
  } catch (e) {}
}
function stopRecorder(action) {
  if (!Rec.active) return;
  Rec.action = action;
  if (Rec.mr && Rec.mr.state !== 'inactive') { try { Rec.mr.stop(); return; } catch (e) {} }
  onRecStop();
}
async function onRecStop() {
  if (!Rec.active) return;
  const { action, chat, chatId, secs, prev } = Rec;
  const chunks = Rec.chunks.slice(), mime = Rec.mime;
  stopStream(); clearInterval(Rec.timer);          // نغلق اللوحة فوراً — لا ننتظر الرفع
  Rec.active = false; Rec.mr = null; Rec.chunks = []; Rec.prev = null; Rec.paused = false;
  $('#record-panel').classList.remove('open'); $('#btn-mic').classList.remove('recording');
  $('#rec-time').textContent = '00:00'; measureBars();

  if (action === 'cancel') { toast('تم إلغاء التسجيل'); return; }
  let blob = new Blob(chunks, { type: mime });
  if (!chunks.length || blob.size < 300) { toast('التسجيل فارغ'); return; }
  if (prev) {
    try { toast('جار دمج التسجيل...'); blob = await mergeAudio([prev, blob]); }
    catch (e) { console.warn('[merge]', e); toast('⛔ تعذّر دمج الجزء المحفوظ'); }
  }
  const dk = me + '__' + chat;
  if (action === 'draft') {
    try { await Platform.draftSet(dk, { blob, dur: secs, t: Date.now() }); toast('تم حفظ الصوت كمسودة'); }
    catch (e) { toast('⛔ تعذّر حفظ المسودة'); }
    refreshDraftDot(); return;
  }
  await Platform.draftDel(dk); refreshDraftDot();
  sendAudioBlob(blob, secs, chatId, chat);
}
async function sendAudioBlob(blob, dur, chatId, chat) {
  if (S.other !== chat || S.chatId !== chatId) { toast('⛔ فُتحت محادثة أخرى — احفظ الصوت كمسودة أولاً'); return; }
  if (blob.size > MAX_FILE_BYTES) { toast('⛔ التسجيل كبير جداً'); return; }
  const t = blob.type || '';
  const ext = t.includes('wav') ? 'wav' : t.includes('mp4') ? 'm4a' : t.includes('ogg') ? 'ogg' : 'webm';
  const f = new File([blob], 'تسجيل صوتي.' + ext, { type: t || 'audio/webm' });
  sendMedia('audio', f, 'جار إرسال التسجيل…', { dur: Math.min(600, Math.max(0, Math.round(dur))), fileName: 'تسجيل صوتي' });
}
/* دمج جزأين صوتيين (لإكمال المسودة) → WAV 11kHz أحادي */
async function mergeAudio(blobs) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  try {
    const bufs = [];
    for (const b of blobs) bufs.push(await ctx.decodeAudioData(await b.arrayBuffer()));
    const rate = 11025;
    const total = Math.ceil(bufs.reduce((x, b) => x + b.duration, 0) * rate) + 1;
    const off = new OfflineAudioContext(1, total, rate);
    let t = 0;
    bufs.forEach(b => { const src = off.createBufferSource(); src.buffer = b; src.connect(off.destination); src.start(t); t += b.duration; });
    const out = await off.startRendering();
    return encodeWav(out.getChannelData(0), rate);
  } finally { try { ctx.close(); } catch (e) {} }
}
function encodeWav(samples, rate) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, samples.length * 2, true);
  let o = 44;
  for (let i = 0; i < samples.length; i++, o += 2) {
    const x = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7FFF, true);
  }
  return new Blob([v], { type: 'audio/wav' });
}

/* ============================================================
   12) البحث داخل الشات
   ============================================================ */
function normMap(str) {
  let out = ''; const map = [];
  for (let i = 0; i < str.length; i++) {
    let ch = str[i];
    if (/[\u064B-\u065F\u0670\u0640]/.test(ch)) continue;
    ch = ch.toLowerCase().replace(/[أإآ]/, 'ا').replace('ى', 'ي').replace('ة', 'ه');
    out += ch; map.push(i);
  }
  return { out, map };
}
function highlight(text, q) {
  const { out, map } = normMap(text);
  let html = '', last = 0, from = 0, pos;
  while ((pos = out.indexOf(q, from)) !== -1) {
    const a = map[pos], b = map[pos + q.length - 1] + 1;
    html += escapeHtml(text.slice(last, a)) + '<mark>' + escapeHtml(text.slice(a, b)) + '</mark>';
    last = b; from = pos + q.length;
  }
  return html + escapeHtml(text.slice(last));
}
async function getAllMsgs(onSlow) {
  let c = S.allCache;
  if (!c || c.chat !== S.chatId || Date.now() - c.t > 30000) {
    if (onSlow && (!c || c.chat !== S.chatId)) onSlow();
    const snap = await get(query(S.msgsRef, orderByKey()));
    const list = [];
    snap.forEach(ch => { list.push({ ...ch.val(), _id: ch.key }); });
    c = S.allCache = { t: Date.now(), chat: S.chatId, list };
  }
  const map = new Map();
  c.list.forEach(m => map.set(m._id, m));
  S.msgs.forEach((m, id) => map.set(id, { ...m, _id: id }));
  return [...map.values()]
    .filter(m => belongs(m) && !(S.clearedAt && m.ts && m.ts <= S.clearedAt))
    .sort((a, b) => (a._id < b._id ? -1 : 1));
}
const SEARCH_HINT = '<div class="search-empty">اكتب كلمة أو جزءاً منها للبحث 🔍</div>';
function openSearch() {
  if (!S.other) return;
  $('#search-bar').classList.add('open');
  $('#search-input').value = '';
  $('#search-results').innerHTML = SEARCH_HINT;
  setTimeout(() => $('#search-input').focus(), 50);
}
function closeSearch() {
  const bar = $('#search-bar'); if (!bar) return;
  bar.classList.remove('open');
  $('#search-input').value = ''; $('#search-results').innerHTML = '';
}
let searchSeq = 0, searchTimer = null;
async function runSearch() {
  const box = $('#search-results');
  const raw = $('#search-input').value.trim();
  if (!raw) { box.innerHTML = SEARCH_HINT; return; }
  if (!S.other) return;
  const my = ++searchSeq;
  const q = normMap(raw).out;
  let list;
  try { list = await getAllMsgs(() => { box.innerHTML = '<div class="search-empty">⏳ جار تحميل كل الرسائل...</div>'; }); }
  catch (e) { box.innerHTML = '<div class="search-empty">تعذّر البحث</div>'; return; }
  if (my !== searchSeq) return;
  const found = [];
  list.slice().reverse().forEach(m => {
    if (m.blur && !m.revealed) return;                      // لا نكشف المغبشة
    const txt = (!m.type || m.type === 'text') ? (m.text || '') : (m.fileName || '');
    if (txt && normMap(txt).out.indexOf(q) !== -1) found.push({ m, txt });
  });
  box.innerHTML = '';
  if (!found.length) { box.innerHTML = '<div class="search-empty">لا توجد نتائج 🙁</div>'; return; }
  const cnt = document.createElement('div');
  cnt.className = 'search-count'; cnt.textContent = `النتائج: ${found.length}`;
  box.appendChild(cnt);
  found.slice(0, 80).forEach(({ m, txt }) => {
    const el = document.createElement('div');
    el.className = 'search-item';
    const who = m.from === me ? 'أنت' : escapeHtml(displayName(m.from));
    const icon = (!m.type || m.type === 'text') ? '' : (m.type === 'image' ? '📷 ' : m.type === 'audio' ? '🎵 ' : '📄 ');
    el.innerHTML = `<div class="si-head"><b>${who}</b><span>${fmtDate(m.ts)} · ${fmt12(m.ts)}</span></div>` +
      `<div class="si-text">${icon}${highlight(txt, q)}</div>`;
    el.addEventListener('click', () => { closeSearch(); jumpTo(m._id); });
    box.appendChild(el);
  });
}

/* ============================================================
   13) الملف التعريفي
   ============================================================ */
function batteryHtml(d) {
  if (!d || typeof d.bat !== 'number') return '<span class="pm-muted">غير متاح على هذا الجهاز</span>';
  const lv = Math.max(0, Math.min(100, d.bat));
  const col = lv <= 20 ? '#ef4444' : (lv <= 50 ? '#f59e0b' : '#10b981');
  const w = Math.max(1, Math.round(lv / 100 * 17));
  return `<span class="bat" style="color:${col}">
    <svg viewBox="0 0 26 12" width="28" height="13"><rect x="0.8" y="0.8" width="21" height="10.4" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <rect x="2.6" y="2.6" width="${w}" height="6.8" rx="1.2" fill="currentColor"/><rect x="23" y="3.6" width="2.2" height="4.8" rx="1" fill="currentColor"/></svg>
    <b>${lv}%</b></span>${d.chg ? ' <span class="chg">⚡ يشحن الان</span>' : ''}`;
}
function signalHtml(d) {
  if (!d) return '<span class="pm-muted">غير متاح</span>';
  let lvl = null;
  if (d.conn === 'none') lvl = 0;
  else if (d.eff) lvl = d.eff === '4g' ? ((d.dl >= 5 && (d.rtt == null || d.rtt < 150)) ? 4 : 3) : d.eff === '3g' ? 2 : 1;
  else if (typeof d.rtt === 'number') lvl = d.rtt < 80 ? 4 : d.rtt < 200 ? 3 : d.rtt < 500 ? 2 : 1;
  if (lvl == null) return '<span class="pm-muted">غير متاح</span>';
  const names = ['لا يوجد', 'ضعيف', 'متوسط', 'جيد', 'قوي'];
  const cols = ['#ef4444', '#ef4444', '#f59e0b', '#10b981', '#10b981'];
  const hs = [4, 7, 10, 13];
  let bars = '';
  hs.forEach((h, i) => { bars += `<rect x="${i * 5}" y="${14 - h}" width="3.4" height="${h}" rx="1" fill="${i < lvl ? cols[lvl] : 'rgba(255,255,255,.2)'}"/>`; });
  const extra = (typeof d.dl === 'number' && d.dl > 0) ? ` · ${Number(d.dl)} Mbps` : (typeof d.rtt === 'number' ? ` · ${Number(d.rtt)}ms` : '');
  return `<svg viewBox="0 0 19 14" width="22" height="16">${bars}</svg> <span style="color:${cols[lvl]}">${names[lvl]}</span><span class="pm-muted">${extra}</span>`;
}
function networkHtml(d, online) {
  const W = '<b class="blue">WIFI</b>';
  if (!online || !d || d.conn === 'none') return `<span class="bad">ليس متصلا بالـ${W}</span>`;
  if (d.conn === 'wifi') return `<span class="ok">${W}: ${escapeHtml(d.wifi || 'متصل')}</span>`;
  if (d.conn === 'cell') return '<span class="ok">متصل بالبيانات</span>';
  return '<span>متصل بالإنترنت</span>';
}
function renderProfile() {
  const uid = S.profileUid; if (!uid) return;
  const p = People[uid] || {}, d = p.status || {};
  const online = isOnlineUser(d);
  setAvatarEl($('#pm-avatar'), uid);
  $('#pm-name').textContent = (p.name || '...') + (p.id ? ' · \u2066@' + p.id + '\u2069' : '');
  $('#pm-note').textContent = d.note ? '💭 ' + d.note : (p.bio ? p.bio : '');
  const row = (k, v) => `<div class="pm-row"><span class="pm-k">${k}</span><span class="pm-v">${v}</span></div>`;
  $('#pm-rows').innerHTML =
    row('📶 الشبكة', networkHtml(d, online)) +
    row('🔋 البطارية', batteryHtml(d)) +
    row('📱 اسم الهاتف', d.note ? escapeHtml(d.note) : '<span class="pm-muted">—</span>') +
    row('⚙️ حالة الهاتف', online ? '<span class="ok">شغال</span>' : '<span class="bad">مطفي</span>') +
    row('📡 قوة الإنترنت', online ? signalHtml(d) : '<span class="pm-muted">—</span>') +
    row('🕒 آخر ظهور', online ? '<span class="ok">الآن</span>' : (d.lastSeen ? ago(d.lastSeen) : '<span class="pm-muted">—</span>')) +
    (online ? '' : '<div class="pm-hint">البيانات أعلاه تعود لآخر مرة كان فيها متصلاً</div>');
}
function openProfileSheet(uid) {
  closeSheets();
  S.profileUid = uid;
  renderProfile();
  $('#profile-modal').classList.add('open');
  $('#sheet-backdrop').classList.add('open');
}

/* ============================================================
   14) مسح الشات (عندي فقط) + إعدادات الشات
   ============================================================ */
async function clearCurrentChat() {
  if (!S.other) return;
  const ok = await askConfirm('🗑️ مسح الشات عندي',
    `سيُمسح الشات من عندك فقط، وتبقى رسائل ${displayName(S.other)} عنده.`, 'مسح الكل');
  if (!ok) return;
  try {
    const cr = ref(db, `chats/${S.chatId}/cleared/${me}`);
    await set(cr, serverTimestamp());
    const v = (await get(cr)).val();
    S.clearedAt = typeof v === 'number' ? v : Date.now();
    S.msgs.forEach((m, id) => removeMessageRow(id));
    S.msgs.clear(); S.sig.clear(); S.firstKey = null; S.hasMore = false; S.allCache = null;
    setTimeout(refreshOlderBox, 450);
    toast('تم مسح الشات ✔');
  } catch (err) { console.error(err); toast('⛔ تعذّر مسح الشات'); }
}
function openSettings() {
  $('#set-note').value = Platform.getPref('slawchat_note_' + me, '');
  const p = Platform.netPref();
  $('#set-net-mode').value = p.mode || 'auto';
  $('#set-wifi').value = p.wifi || '';
  openSheet('settings-panel');
}
function saveSettings() {
  const note = $('#set-note').value.trim().slice(0, 60);
  Platform.setPref('slawchat_note_' + me, note);
  Platform.setPref('slawchat_net_v1', JSON.stringify({ mode: $('#set-net-mode').value, wifi: $('#set-wifi').value.trim().slice(0, 32) }));
  Presence.push(!document.hidden);
  closeSheets();
  toast('تم حفظ الإعدادات ✔');
}

/* ============================================================
   15) ربط الأزرار (مرة واحدة)
   ============================================================ */
function bindUI() {
  /* صوت + موجة عند الضغط */
  const CLICKABLE = 'button, .icon-btn, .opt-btn, .menu-item, .search-item, .swatch, .header-profile, .color-chip, .size-step, .model-btn, .msg-reply';
  R.addEventListener('pointerdown', e => { if (e.target.closest(CLICKABLE)) Platform.playClick(); }, true);
  R.addEventListener('pointerdown', e => {
    const t = e.target.closest('.cbtn, .icon-btn, .opt-btn, .pill-btn, .menu-item, .search-item');
    if (!t) return;
    const r = t.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2;
    const sp = document.createElement('span');
    sp.className = 'ripple';
    sp.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    t.appendChild(sp); setTimeout(() => sp.remove(), 700);
  });

  /* النوافذ */
  $('#sheet-backdrop').addEventListener('click', closeSheets);
  ['model-close', 'font-close', 'pm-close', 'set-close'].forEach(id => $('#' + id).addEventListener('click', closeSheets));
  $('#btn-settings').addEventListener('click', e => { e.stopPropagation(); closeAll(); openSettings(); });
  $('#set-save').addEventListener('click', saveSettings);
  $('#btn-models').addEventListener('click', () => { buildModelPop(); openSheet('model-pop'); });
  $('#btn-font').addEventListener('click', () => { buildFontPop(); openSheet('font-pop'); });
  $('#open-profile').addEventListener('click', () => { if (S.other) openProfileSheet(S.other); });

  /* رجوع */
  $('#btn-back').addEventListener('click', () => { if (fromList) backToFriends(); else close(); });
  $('#fr-back').addEventListener('click', () => close());
  $('#fr-settings').addEventListener('click', () => { closeAll(); openSettings(); });

  /* الألوان */
  $('#btn-palette').addEventListener('click', e => {
    e.stopPropagation();
    $('#palette-bar').classList.toggle('open');
    $('#chat-menu').classList.remove('open'); $('#color-pop').classList.remove('open');
    closeSheets();
  });
  $('#btn-palette-close').addEventListener('click', () => $('#palette-bar').classList.remove('open'));
  $('#color-none').addEventListener('click', e => {
    e.stopPropagation(); setTextColor('');
    $('#color-pop').classList.remove('open'); toast('تم إلغاء لون الكتابة');
  });

  /* قائمة ⋮ */
  $('#btn-more').addEventListener('click', e => {
    e.stopPropagation();
    $('#palette-bar').classList.remove('open'); $('#color-pop').classList.remove('open');
    closeSheets();
    $('#chat-menu').classList.toggle('open');
  });
  $$('#chat-menu .menu-item').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    $('#chat-menu').classList.remove('open');
    const act = b.dataset.act;
    if (act === 'search') openSearch();
    else if (act === 'refresh') reloadChat();
    else if (act === 'clear') clearCurrentChat();
  }));

  /* البحث */
  $('#search-close').addEventListener('click', closeSearch);
  $('#search-input').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(runSearch, 180); });

  /* الكتابة والإرسال */
  $('#btn-send').addEventListener('click', sendTextMessage);
  $('#msg-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTextMessage(); }
  });
  $('#msg-input').addEventListener('input', e => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    measureBars();
  });
  $('#btn-quick').addEventListener('click', () => { if (sendMessage({ text: QUICK_MSG })) Platform.haptic([15, 40, 15]); });
  $('#btn-mic').addEventListener('click', startRecording);
  $('#rec-cancel').addEventListener('click', () => stopRecorder('cancel'));
  $('#rec-pause').addEventListener('click', pauseRecording);
  $('#rec-draft').addEventListener('click', () => stopRecorder('draft'));
  $('#rec-send').addEventListener('click', () => stopRecorder('send'));
  $('#viewer-close').addEventListener('click', () => $('#viewer').classList.remove('open'));
  $('#rp-cancel').addEventListener('click', clearReply);

  /* لوحة (+) */
  $('#btn-plus').addEventListener('click', e => {
    e.stopPropagation();
    $('#options-panel').classList.toggle('open'); $('#color-pop').classList.remove('open');
  });
  $$('.opt-btn').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const opt = b.dataset.opt;
    $('#options-panel').classList.remove('open');
    if (opt === 'studio') pickAndSend('image');
    else if (opt === 'music') pickAndSend('audio');
    else if (opt === 'files') pickAndSend('file');
    else if (opt === 'blur') {
      S.pendingBlur = true;
      $('#msg-input').classList.add('blur-armed');
      toast('🌫️ الرسالة القادمة ستكون مغبشة');
      $('#msg-input').focus();
    } else if (opt === 'color') { buildColorGrid(); $('#color-pop').classList.add('open'); }
  }));

  /* التفاعلات */
  $$('#reactions-bar span').forEach(s => s.addEventListener('click', e => {
    e.stopPropagation();
    $('#reactions-bar').classList.remove('open');
    toggleReaction(s.dataset.r);
  }));

  /* إغلاق اللوحات عند الضغط خارجها */
  R.addEventListener('click', e => {
    const t = e.target;
    if (!t.closest('.msg-bubble')) closeAllActions();
    if (!t.closest('#reactions-bar') && !t.closest('.msg-bubble')) $('#reactions-bar').classList.remove('open');
    if (!t.closest('#options-panel') && !t.closest('#btn-plus')) $('#options-panel').classList.remove('open');
    if (!t.closest('#color-pop') && !t.closest('.opt-btn')) $('#color-pop').classList.remove('open');
    if (!t.closest('#chat-menu, #btn-more')) $('#chat-menu').classList.remove('open');
  });

  /* تحميل الأقدم عند الصعود للأعلى */
  messagesEl().addEventListener('scroll', e => {
    if (e.currentTarget.scrollTop < 60 && S.hasMore && !S.loadingOlder) loadOlder();
  }, { passive: true });

  window.addEventListener('resize', measureBars);
  window.addEventListener('orientationchange', () => setTimeout(measureBars, 250));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && S.other) markAllSeen(); });

  /* تحديث "منذ" كل 10 ثوانٍ */
  setInterval(() => {
    if (!R.classList.contains('open')) return;
    $$('[data-ts]').forEach(el => { el.textContent = ago(+el.dataset.ts); });
    updateChatHeader();
    if (S.profileUid && $('#profile-modal').classList.contains('open')) renderProfile();
  }, 10000);
}
function closeAll() {
  closeSearch(); closeSheets();
  ['#chat-menu', '#color-pop', '#palette-bar', '#options-panel', '#reactions-bar', '#viewer'].forEach(s => $(s).classList.remove('open'));
}

/* ============================================================
   15-ب) قائمة المحادثات (الأصدقاء) + الزر العائم 💬
   ============================================================ */
const FL = { unsubs: [], friends: [], blocked: new Set(), profUnsubs: new Map() };
let launcherUnsub = null, launcherUid = null;
function setLauncher(on) { if (fab) fab.classList.toggle('show', !!on && api.launcher !== false); }
/* يظهر الزر فقط بعد اكتمال التسجيل (اسم + معرّف) */
async function watchLauncher(uid) {
  if (launcherUid === uid) return;
  launcherUid = uid;
  if (launcherUnsub) { try { launcherUnsub(); } catch (e) {} launcherUnsub = null; }
  try { await init(); } catch (e) { return; }
  launcherUnsub = onValue(ref(db, 'profiles/' + uid), snap => {
    const v = snap.val();
    setLauncher(!!(v && v.name && v.id) && !R.classList.contains('open'));
  }, () => setLauncher(false));
}
function stopFriendsListeners() {
  FL.unsubs.forEach(fn => { try { fn(); } catch (e) {} }); FL.unsubs = [];
  FL.profUnsubs.forEach(fn => { try { fn(); } catch (e) {} }); FL.profUnsubs.clear();
}
function renderFriends() {
  const box = $('#fr-list'); if (!box) return;
  const list = FL.friends.filter(u => !FL.blocked.has(u))
    .sort((a, b) => String((People[a] && People[a].name) || '').localeCompare(String((People[b] && People[b].name) || ''), 'ar'));
  box.innerHTML = '';
  if (!list.length) {
    box.innerHTML = '<div class="fr-empty">لا يوجد أصدقاء بعد 👋<br>أضف صديقاً بمعرّفه من الصفحة الرئيسية،<br>وبعد قبول الطلب يظهر هنا.</div>';
    return;
  }
  list.forEach(uid => {
    const p = People[uid] || {};
    const row = document.createElement('div');
    row.className = 'fr-item';
    const av = document.createElement('div'); av.className = 'fr-av'; setAvatarEl(av, uid);
    const info = document.createElement('div');
    const nm = document.createElement('div'); nm.className = 'fr-name'; nm.textContent = p.name || '...';
    const idv = document.createElement('div'); idv.className = 'fr-id'; idv.textContent = p.id ? '@' + p.id : '';
    info.appendChild(nm); info.appendChild(idv);
    row.appendChild(av); row.appendChild(info);
    row.addEventListener('click', () => { Platform.haptic(10); open(uid, { fromList: true }); });
    box.appendChild(row);
  });
}
async function showFriends() {
  try {
    if (!ensureFirebase()) return;
    const user = auth.currentUser; if (!user) return;
    await init();
    me = user.uid;
    if (S.other) { teardownChat(); clearMessagesDom(); }
    closeAll();
    const wasOpen = R.classList.contains('open');
    fromList = false;
    R.classList.add('open', 'mode-friends');
    setLauncher(false);
    if (!wasOpen) { try { history.pushState({ slawChat: 1 }, ''); } catch (e) {} }
    stopFriendsListeners();
    $('#fr-list').innerHTML = '<div class="fr-empty">⏳ جار التحميل...</div>';
    FL.unsubs.push(onValue(ref(db, 'blocks/' + me), snap => {
      FL.blocked = new Set(Object.keys(snap.val() || {})); renderFriends();
    }, () => {}));
    FL.unsubs.push(onValue(ref(db, 'friends/' + me), snap => {
      FL.friends = Object.keys(snap.val() || {});
      FL.friends.forEach(uid => {
        if (FL.profUnsubs.has(uid)) return;
        People[uid] = People[uid] || {};
        FL.profUnsubs.set(uid, onValue(ref(db, 'profiles/' + uid), ps => {
          const v = ps.val() || {};
          People[uid] = { ...People[uid], name: v.name || '', id: v.id || '', photo: v.photo || '', bio: v.bio || '' };
          renderFriends();
        }, () => {}));
      });
      renderFriends();
    }, err => { console.error(err); $('#fr-list').innerHTML = '<div class="fr-empty">⛔ تعذّر تحميل الأصدقاء</div>'; }));
  } catch (e) { console.error('[SLAWChat]', e); }
}
function backToFriends() {
  teardownChat(); clearMessagesDom(); closeAll();
  fromList = false;
  showFriends();
}

/* ============================================================
   16) فتح / إغلاق المحادثة
   ============================================================ */
function teardownChat() {
  if (Rec.active) { try { Rec.action = 'cancel'; stopRecorder('cancel'); } catch (e) {} }
  if (curAudio) { try { curAudio.pause(); } catch (e) {} curAudio = null; }
  S.token++;
  detachMessages();
  S.peopleUnsubs.forEach(fn => { try { fn(); } catch (e) {} });
  S.peopleUnsubs = [];
  S.rows.clear(); S.msgs.clear(); S.sig.clear();
  S.other = null; S.chatId = null; S.msgsRef = null;
  S.firstKey = null; S.hasMore = false; S.loadingOlder = false;
  S.ready = false; S.quiet = false; S.clearedAt = 0; S.allCache = null;
  S.replyTo = null; S.pendingBlur = false;
}
function reloadChat() {
  if (!S.other) return;
  const uid = S.other;
  detachMessages();
  S.token++; S.ready = false; S.msgs.clear(); S.sig.clear(); S.firstKey = null; S.allCache = null;
  clearMessagesDom();
  messagesEl().innerHTML = '<div class="msgs-loading">⏳ جار تحميل الرسائل...</div>';
  attachMessages(null);
  toast('تم التحديث ✔');
}

async function open(uid, opts) {
  try {
    if (!ensureFirebase()) return false;
    const user = auth.currentUser;
    if (!user) { console.warn('[SLAWChat] لا يوجد مستخدم مسجّل'); return false; }
    if (!uid || typeof uid !== 'string' || uid === user.uid) return false;
    await init();
    me = user.uid;
    if (S.other) teardownChat();
    closeAll();

    fromList = !!(opts && opts.fromList);
    stopFriendsListeners(); R.classList.remove('mode-friends'); setLauncher(false);
    S.other = uid; S.chatId = chatIdOf(me, uid);
    S.msgsRef = ref(db, `chats/${S.chatId}/messages`);
    S.token++;
    loadPrefs();

    clearMessagesDom();
    messagesEl().innerHTML = '<div class="msgs-loading">⏳ جار تحميل الرسائل...</div>';
    const wasOpen = R.classList.contains('open');
    R.classList.add('open');
    if (!wasOpen) { try { history.pushState({ slawChat: 1 }, ''); } catch (e) {} }

    listenPerson(me); listenPerson(uid); listenOtherStatus(uid);
    updateChatHeader();
    Presence.start();
    measureBars();

    const tok = S.token;
    try {
      const v = (await get(ref(db, `chats/${S.chatId}/cleared/${me}`))).val();
      S.clearedAt = typeof v === 'number' ? v : 0;
    } catch (e) { S.clearedAt = 0; }
    if (tok !== S.token) return false;
    attachMessages(null);
    refreshDraftDot();
    return true;
  } catch (e) {
    console.error('[SLAWChat]', e);
    return false;
  }
}
function close(fromPop) {
  if (!R || !R.classList.contains('open')) return;
  closeAll();
  teardownChat();
  clearMessagesDom();
  stopFriendsListeners();
  fromList = false;
  R.classList.remove('open', 'mode-friends');
  if (launcherUid && fab) { get(ref(db, 'profiles/' + launcherUid)).then(sn => { const v = sn.val(); setLauncher(!!(v && v.name && v.id)); }).catch(() => {}); }
  if (!fromPop) { try { if (history.state && history.state.slawChat) history.back(); } catch (e) {} }
  if (typeof api.onBack === 'function') { try { api.onBack(); } catch (e) {} }
}
window.addEventListener('popstate', () => {
  if (!R || !R.classList.contains('open')) return;
  if (fromList && S.other) { backToFriends(); try { history.pushState({ slawChat: 1 }, ''); } catch (e) {} return; }
  close(true);
});

async function openProfile(uid) {
  await open(uid);
  if (S.other === uid) openProfileSheet(uid);
}
function startPresence() {
  try {
    if (!ensureFirebase()) return;
    if (auth.currentUser) { me = auth.currentUser.uid; Presence.start(); }
  } catch (e) {}
}

/* ============================================================
   17) الواجهة العامة
   ============================================================ */
api.open = open;
api.close = () => close();
api.openProfile = openProfile;
api.showFriends = showFriends;
api.launcher = new URL(import.meta.url).searchParams.get('fab') !== '0';   // ?fab=0 يلغي الزر العائم 💬
api.startPresence = startPresence;
api.stopPresence = () => Presence.stop();
window.SLAWChat = api;

/* تشغيل تلقائي: ننتظر حتى يهيّئ index.html تطبيق Firebase ثم نفعّل الزر العائم */
(function boot() {
  let n = 0;
  if (ensureFirebase()) return;
  const t = setInterval(() => { if (ensureFirebase() || ++n > 60) clearInterval(t); }, 500);
})();

window.dispatchEvent(new Event('slawchat-ready'));
