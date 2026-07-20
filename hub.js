/* ============================================================
   hub.js — Combined bundle for clocker.html & clocker2.html
   Includes: security.js + spiderweb.js + games.js
   Edit games: find 'let files = [' and add/remove entries.
   Edit spiderweb: find '=== spiderweb.js ==='
   After editing, re-minify with: terser hub.js -o hub.min.js --compress --mangle
============================================================ */

/* === security.js === */
/* =====================================================
   NUCLEAR CONSOLE LOCK
   Loaded as the very first script in every page.
   Object.defineProperty means no injected script can
   restore the locked console methods.

   NOTE: console.error and console.warn are intentionally
   NOT locked. Firebase SDK uses them internally to report
   connection errors. Locking them causes silent failures
   that are impossible to diagnose. All user-visible
   methods (log, info, debug, dir, table, etc.) are
   still fully blocked to prevent casual snooping.
===================================================== */
(function(){
  var noop = function(){};
  var methods = [
    'log','info','debug','dir','dirxml','table',
    'trace','group','groupCollapsed','groupEnd','time','timeEnd',
    'timeLog','timeStamp','profile','profileEnd','count','countReset',
    'assert','clear'
  ];
  methods.forEach(function(m){
    try {
      Object.defineProperty(console, m, {
        get: function(){ return noop; },
        set: function(){},
        configurable: false,
        enumerable: false
      });
    } catch(e){ /* intentional: best-effort cleanup */ }
  });
  /* Do NOT call Object.freeze(console) — that also locks error/warn
     and silences Firebase's own internal connection error reporting. */
})();

/* === spiderweb.js === */
(function(){
    const canvas = document.getElementById('spiderweb');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let W = 0, H = 0;
    let nodes = [], gridCols = 1, gridRows = 1, grid = [];
    let mouse = { x: -9999, y: -9999 };

    // These can be overridden by the settings panel via window globals
    function getCfg() {
        return {
            N:     window._sw_nodes != null ? window._sw_nodes : 90,
            DIST:  window._sw_dist  != null ? window._sw_dist  : 130,
            SPEED: window._sw_speed != null ? window._sw_speed : 1.0,
        };
    }

    const MDIST = 160;
    const CELL  = 130;
    const FPS   = 60;
    const FRAME = 1000 / FPS;
    let lastT   = 0;
    let rafId   = null;
    let hue     = 0;   // global hue that slowly cycles

    // Allow settings panel to trigger a node rebuild
    window._sw_rebuild = function() { initNodes(); };

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
        initNodes();
    }

    function initNodes() {
        const { N } = getCfg();
        const cols  = Math.max(1, Math.ceil(Math.sqrt(N * W / H)));
        const rows  = Math.max(1, Math.ceil(N / cols));
        const cellW = W / cols, cellH = H / rows;
        nodes = [];
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols && nodes.length < N; c++)
                nodes.push({
                    x:      (c + Math.random()) * cellW,
                    y:      (r + Math.random()) * cellH,
                    vx:     (Math.random() - .5) * .7,
                    vy:     (Math.random() - .5) * .7,
                    pr:     Math.random() * 1.8 + .6,
                    ph:     Math.random() * Math.PI * 2,
                    pulse:  Math.random() * Math.PI * 2,
                    hueOff: Math.random() * 60 - 30,   // each node shifts hue ±30°
                });
        buildGrid();
    }

    function buildGrid() {
        gridCols = Math.max(1, Math.ceil(W / CELL));
        gridRows = Math.max(1, Math.ceil(H / CELL));
        grid = Array.from({ length: gridCols * gridRows }, () => []);
        nodes.forEach((n, i) => {
            const gx = Math.min((n.x / CELL) | 0, gridCols - 1);
            const gy = Math.min((n.y / CELL) | 0, gridRows - 1);
            const idx = gy * gridCols + gx;
            if (grid[idx]) {  // Safety check
                grid[idx].push(i);
            }
        });
    }

    function neighbors(n) {
        const gx = Math.min((n.x / CELL) | 0, gridCols - 1);
        const gy = Math.min((n.y / CELL) | 0, gridRows - 1);
        const out = [];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const nx = gx + dx, ny = gy + dy;
            if (nx < 0 || ny < 0 || nx >= gridCols || ny >= gridRows) continue;
            const idx = ny * gridCols + nx;
            if (grid[idx]) {  // Safety check
                for (const i of grid[idx]) out.push(i);
            }
        }
        return out;
    }

    function hslStr(h, s, l, a) {
        return 'hsla(' + (h | 0) + ',' + s + '%,' + l + '%,' + a.toFixed(3) + ')';
    }

    function draw(ts) {
        rafId = requestAnimationFrame(draw);
        if (ts - lastT < FRAME) return;
        const dt = Math.min((ts - lastT) / 16, 3);
        lastT = ts;
        if (!W || !H) return;

        // Slowly cycle the global hue
        hue = (hue + 0.12 * dt) % 360;

        ctx.clearRect(0, 0, W, H);

        const { DIST, SPEED } = getCfg();

        // Move nodes
        for (const n of nodes) {
            n.x += n.vx * dt * SPEED;
            n.y += n.vy * dt * SPEED;
            n.ph    += .018 * dt;
            n.pulse += .04  * dt;
            if (n.x < 0 || n.x > W) n.vx *= -1;
            if (n.y < 0 || n.y > H) n.vy *= -1;
            const md = Math.hypot(n.x - mouse.x, n.y - mouse.y);
            if (md < MDIST && md > 1) {
                const f = (MDIST - md) / MDIST * .6;
                n.x += (n.x - mouse.x) / md * f * dt;
                n.y += (n.y - mouse.y) / md * f * dt;
            }
        }
        buildGrid();

        const DIST2 = DIST * DIST;

        // Draw lines — gradient between each pair's hues
        for (let ai = 0; ai < nodes.length; ai++) {
            const a = nodes[ai];
            for (const bi of neighbors(a)) {
                if (bi <= ai) continue;
                const b = nodes[bi];
                const dx = a.x - b.x, dy = a.y - b.y;
                const d2 = dx * dx + dy * dy;
                if (d2 >= DIST2) continue;
                const d   = Math.sqrt(d2);
                const t   = 1 - d / DIST;

                const mda = Math.hypot(a.x - mouse.x, a.y - mouse.y);
                const mdb = Math.hypot(b.x - mouse.x, b.y - mouse.y);
                const mi  = Math.max(0, 1 - Math.min(mda, mdb) / MDIST);

                const baseAlpha = t * .38 * (.18 + mi * .6);
                const lineWidth = .4 + t * 1.4 + mi * 1.4;

                const ha = (hue + a.hueOff + 200) % 360;
                const hb = (hue + b.hueOff + 200) % 360;

                // Color gradient from node A to node B
                const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
                grad.addColorStop(0, hslStr(ha, 90, 70, baseAlpha));
                grad.addColorStop(1, hslStr(hb, 90, 70, baseAlpha));

                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = grad;
                ctx.lineWidth   = lineWidth;
                ctx.stroke();
            }
        }

        // Draw nodes — three-layer glow
        for (const n of nodes) {
            const mi    = Math.max(0, 1 - Math.hypot(n.x - mouse.x, n.y - mouse.y) / MDIST);
            const p     = Math.sin(n.ph)    * .5 + .5;
            const pulse = Math.sin(n.pulse) * .5 + .5;
            const nh    = (hue + n.hueOff + 200) % 360;
            const r     = n.pr * (1 + p * .3 + mi * .8);

            // Outer halo — only brightens near mouse
            if (mi > .05) {
                ctx.beginPath();
                ctx.arc(n.x, n.y, r * 3.5, 0, Math.PI * 2);
                ctx.fillStyle = hslStr(nh, 100, 65, mi * .09);
                ctx.fill();
            }

            // Mid glow
            ctx.beginPath();
            ctx.arc(n.x, n.y, r * 1.9, 0, Math.PI * 2);
            ctx.fillStyle = hslStr(nh, 90, 65, .08 + pulse * .06 + mi * .14);
            ctx.fill();

            // Core dot
            ctx.beginPath();
            ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
            ctx.fillStyle = hslStr(nh, 95, 80, .45 + p * .28 + mi * .3);
            ctx.fill();
        }


    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 200);
    });
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(rafId);
            rafId = null;
        } else {
            lastT = 0;
            rafId = requestAnimationFrame(draw);
        }
    });

    resize();
    rafId = requestAnimationFrame(draw);
})();

/* === games.js (hub runtime + game list + UI) === */
// Guard against double-loading
if (window._gamesLoaded) { throw new Error('games.js already loaded'); }
window._gamesLoaded = true;

/* =====================================================
   HUB RUNTIME — shared by clocker.html (Hub 1) and
   clocker2.html (Hub 2). Loaded via games.js so every
   hub page gets auth, presence, inactivity, kick/
   lockdown watchers, daily wipe,
   and the Firebase disconnect indicator for free.

   Each hub page sets window._HUB_ID before games.js
   loads so presence tracking labels correctly:
     clocker.html  → window._HUB_ID = 'hub'
     clocker2.html → window._HUB_ID = 'hub2'
   Personal pages leave _HUB_ID undefined, which skips
   this entire block.
===================================================== */
(function () {
  /* Only runs on authenticated public hubs */
  if (typeof firebase === 'undefined') return;
  if (!window._HUB_ID) return;

  /* ── Firebase init ────────────────────────────────── */
  const FB_CFG = {
    apiKey:            'AIzaSyBJ4lMm2Nf9u6UeJLHH-Ap9z7lX9wBFEuc',
    authDomain:        'drive-portal-d7eb1.firebaseapp.com',
    databaseURL:       'https://drive-portal-d7eb1-default-rtdb.firebaseio.com',
    projectId:         'drive-portal-d7eb1',
    storageBucket:     'drive-portal-d7eb1.firebasestorage.app',
    messagingSenderId: '602318258720',
    appId:             '1:602318258720:web:e81d1c6ec4c06bd5da3245',
  };
  if (!firebase.apps.length) firebase.initializeApp(FB_CFG);
  const db = firebase.database();

  /* ── Anti-inspect (right-click / devtools shortcuts) ─ */
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('keydown', e => {
    if (
      e.keyCode === 123 ||
      (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
      (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 83))
    ) { e.preventDefault(); return false; }
  });

  /* ── Auth guard ───────────────────────────────────── */
  const username = sessionStorage.getItem('clocker_user');
  if (!username) return;

  /* ── Helpers ──────────────────────────────────────── */
  function safeKey(u) {
    return u.toLowerCase().replace(/[.#$[\]]/g, '_');
  }

  function formatDuration(ms) {
    const t = Math.floor(ms / 1000);
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    if (h > 0) return h + 'h ' + m + 'm';
    if (m > 0) return m + 'm ' + s + 's';
    return s + 's';
  }

  /* ── Remote config (with safe defaults) ──────────── */
  let INACTIVITY_WARN_MS = 40 * 60 * 1000;
  let INACTIVITY_OUT_MS  = 45 * 60 * 1000;
  let WIPE_HOUR          = 15;
  let WIPE_MINUTE        = 0;
  let WIPE_ENABLED       = true;

  db.ref('config').get().then(snap => {
    if (!snap.exists()) return;
    const c = snap.val();
    if (c.inactivityWarnMin   > 0) INACTIVITY_WARN_MS = c.inactivityWarnMin   * 60000;
    if (c.inactivityLogoutMin > 0) INACTIVITY_OUT_MS  = c.inactivityLogoutMin * 60000;
    if (c.wipeHour    !== undefined) WIPE_HOUR    = c.wipeHour;
    if (c.wipeMinute  !== undefined) WIPE_MINUTE  = c.wipeMinute;
    if (c.wipeEnabled !== undefined) WIPE_ENABLED = c.wipeEnabled;
  }).catch(() => {});

  /* ── State ────────────────────────────────────────── */
  let lastActivity   = Date.now();
  let warnToastShown = false;
  let loggedOut      = false;
  let _wipeInterval  = null;
  let _inactInterval = null;
  let _presInterval  = null;
  let _lockdownRef   = null;
  let _userRef       = null;

  /* ── Activity log (debounced, auto-pruned to 200) ── */
  const MAX_LOG = 200;
  const _logDebounce = {};
  async function logActivity(user, event, extra) {
    if (!user || !event) return;
    const key = user + ':' + event;
    const now = Date.now();
    if (_logDebounce[key] && now - _logDebounce[key] < 2000) return;
    _logDebounce[key] = now;
    const entry = {
      username: user, event,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      ...extra,
    };
    try {
      await db.ref('activityLog').push(entry);
      const snap = await db.ref('activityLog').once('value');
      const keys = [];
      snap.forEach(c => keys.push(c.key));
      if (keys.length > MAX_LOG) {
        const del = {};
        keys.slice(0, keys.length - MAX_LOG).forEach(k => { del['activityLog/' + k] = null; });
        await db.ref('/').update(del);
      }
    } catch (e) { /* intentional: best-effort cleanup */ }
  }

  /* ── Presence ─────────────────────────────────────── */
  const PRESENCE_INTERVAL = 10000; // 10 s heartbeat
  const presRef = db.ref('presence/' + safeKey(username));
  presRef.onDisconnect().remove();

  function updatePresence() {
    if (loggedOut) return;
    presRef.set({ username, page: window._HUB_ID, heartbeat: Date.now() }).catch(() => {});
  }

  function startPresence() {
    updatePresence();
    _presInterval = setInterval(updatePresence, PRESENCE_INTERVAL);
  }

  function stopPresence() {
    if (_presInterval) { clearInterval(_presInterval); _presInterval = null; }
    presRef.remove().catch(() => {});
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (_presInterval) { clearInterval(_presInterval); _presInterval = null; }
    } else if (!loggedOut) {
      updatePresence();
      if (!_presInterval) _presInterval = setInterval(updatePresence, PRESENCE_INTERVAL);
    }
  });

  /* ── Force logout ─────────────────────────────────── */
  async function forceLogout(reason, redirect, isKicked) {
    if (loggedOut) return;
    loggedOut = true;
    if (_lockdownRef) { try { _lockdownRef.off(); } catch (e) { /* intentional: best-effort cleanup */ } _lockdownRef = null; }
    if (_userRef)     { try { _userRef.off();     } catch (e) { /* intentional: best-effort cleanup */ } _userRef     = null; }
    if (_wipeInterval)  { clearInterval(_wipeInterval);  _wipeInterval  = null; }
    if (_inactInterval) { clearInterval(_inactInterval); _inactInterval = null; }
    stopPresence();
    if (isKicked) sessionStorage.setItem('clocker_kicked', '1');
    const lt    = sessionStorage.getItem('clocker_login_time');
    const extra = lt ? { duration: formatDuration(Date.now() - parseInt(lt, 10)) } : {};
    try { await logActivity(username, reason, extra); } catch (e) { /* intentional: best-effort cleanup */ }
    sessionStorage.removeItem('clocker_user');
    sessionStorage.removeItem('clocker_login_time');
    if (redirect) window.location.href = redirect;
  }

  /* ── Inactivity warning toast ─────────────────────── */
  const toast = document.createElement('div');
  toast.id = 'inactivity-toast';
  toast.innerHTML = `<span>⚠️ You'll be logged out in <strong>5 minutes</strong> due to inactivity.</span><button>Stay</button>`;
  Object.assign(toast.style, {
    display: 'none', position: 'fixed', bottom: '24px', left: '50%',
    transform: 'translateX(-50%)', zIndex: '9999',
    background: 'rgba(8,15,30,0.97)', border: '1px solid rgba(251,146,60,0.5)',
    borderRadius: '8px', padding: '14px 20px', color: '#fb923c',
    fontFamily: "'Outfit', sans-serif", fontSize: '13px',
    boxShadow: '0 0 24px rgba(251,146,60,0.2)',
    alignItems: 'center', gap: '16px', whiteSpace: 'nowrap',
  });
  const toastBtn = toast.querySelector('button');
  toastBtn.style.cssText = 'background:rgba(251,146,60,0.12);border:1px solid rgba(251,146,60,0.4);color:#fb923c;padding:6px 14px;border-radius:5px;cursor:pointer;font-family:inherit;font-size:12px;letter-spacing:1px;';
  document.body.appendChild(toast);
  toastBtn.addEventListener('click', () => {
    lastActivity = Date.now();
    toast.style.display = 'none';
    warnToastShown = false;
  });

  /* ── Firebase disconnect banner ───────────────────── */
  db.ref('.info/connected').on('value', snap => {
    let banner = document.getElementById('firebase-status');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'firebase-status';
      Object.assign(banner.style, {
        position: 'fixed', top: '0', left: '0', right: '0', zIndex: '99999',
        padding: '8px 16px', textAlign: 'center', fontSize: '12px',
        fontFamily: "'Outfit',sans-serif", letterSpacing: '1px',
        transition: 'opacity 0.4s', display: 'none',
      });
      document.body.appendChild(banner);
    }
    if (snap.val() === true) {
      banner.style.display = 'none';
    } else {
      banner.textContent = '⚠ Connection lost — attempting to reconnect…';
      banner.style.background = 'rgba(239,68,68,0.9)';
      banner.style.color = '#fff';
      banner.style.display = 'block';
    }
  });

  /* ── Lockdown watcher ─────────────────────────────── */
  _lockdownRef = db.ref('lockdown/active');
  _lockdownRef.on('value', snap => {
    if (!loggedOut && snap.val() === true) forceLogout('lockdown-logout', 'login.html');
  });

  /* ── Kick watcher ─────────────────────────────────── */
  _userRef = db.ref('users/' + safeKey(username));
  _userRef.on('value', snap => {
    if (loggedOut || !snap.exists()) return;
    if (snap.val().status === 'kicked') forceLogout('kicked-from-hub', 'login.html', true);
  });

  /* ── Daily wipe (3 PM default, Firebase-coordinated) ─ */
  _wipeInterval = setInterval(async () => {
    if (loggedOut || !WIPE_ENABLED) return;
    const now = new Date();
    if (now.getHours() === WIPE_HOUR && now.getMinutes() === WIPE_MINUTE) {
      const today = now.toLocaleDateString();
      try {
        const snap = await db.ref('lastWipeDate').get();
        if (snap.val() !== today) {
          await db.ref('lastWipeDate').set(today);
          await db.ref('presence').remove();
          await logActivity('SYSTEM', 'daily-wipe');
          forceLogout('daily-wipe', 'login.html');
        }
      } catch (e) { /* intentional: best-effort cleanup */ }
    }
  }, 30000);

  /* ── Inactivity check (every 10 s) ───────────────── */
  _inactInterval = setInterval(() => {
    if (loggedOut) return;
    const idle = Date.now() - lastActivity;
    if (idle >= INACTIVITY_OUT_MS) {
      forceLogout('inactivity-logout', 'login.html');
    } else if (idle >= INACTIVITY_WARN_MS && !warnToastShown) {
      warnToastShown = true;
      toast.style.display = 'flex';
    }
  }, 10000);

  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(ev => {
    window.addEventListener(ev, () => {
      lastActivity = Date.now();
      if (warnToastShown) { toast.style.display = 'none'; warnToastShown = false; }
    }, { passive: true });
  });

  /* ── beforeunload: log-off + presence cleanup ──────── */
  window.addEventListener('beforeunload', () => {
    if (loggedOut) return;
    const now      = Date.now();
    const logKey   = window._HUB_ID + '_logout_ts_' + safeKey(username);
    const lastExit = localStorage.getItem(logKey);
    // 30-second dedup prevents double-logging on Chromebook lid-close / bfcache restore
    if (lastExit && now - parseInt(lastExit, 10) < 30000) {
      fetch('https://drive-portal-d7eb1-default-rtdb.firebaseio.com/presence/' + safeKey(username) + '.json',
        { method: 'DELETE', keepalive: true });
      return;
    }
    localStorage.setItem(logKey, now.toString());
    const lt      = sessionStorage.getItem('clocker_login_time');
    const nowDate = new Date();
    const entry   = {
      username, event: 'logged-off',
      date: nowDate.toLocaleDateString(),
      time: nowDate.toLocaleTimeString(),
    };
    if (lt) entry.duration = formatDuration(now - parseInt(lt, 10));
    fetch('https://drive-portal-d7eb1-default-rtdb.firebaseio.com/presence/' + safeKey(username) + '.json',
      { method: 'DELETE', keepalive: true });
    fetch('https://drive-portal-d7eb1-default-rtdb.firebaseio.com/activityLog.json',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry), keepalive: true });
  });

  /* ── Init ─────────────────────────────────────────── */
  startPresence();
})();

/* Console locked by security.js — loaded before this script in clocker.html */

/* =====================================================
   NEW BADGE SYSTEM
   To mark a game as "New", add  // NEW  at the end of
   its line in the files array below, like:
       "clSomeCoolGame",  // NEW
   The badge disappears automatically after 7 days
   from the DEPLOY_DATE set below.
   Update DEPLOY_DATE each time you push new games.
===================================================== */
(function(){
    var DEPLOY_DATE = new Date('2026-05-26').getTime();
    var SHOW_MS     = 7 * 24 * 60 * 60 * 1000; // 7 days
    var withinWindow = (Date.now() - DEPLOY_DATE) < SHOW_MS;

    var tagged = new Set();
    if (withinWindow) {
        var src = '';
        if (document.currentScript) {
            src = document.currentScript.textContent;
        } else {
            document.querySelectorAll('script').forEach(function(s){ if (s.textContent.includes('_gamesLoaded')) src = s.textContent; });
        }
        if (src) {
            src.split('\n').forEach(function(line){
                var m = line.match(/["']([^"']+)["'][,\s]*\/\/\s*NEW\s*$/i);
                if (m) tagged.add(m[1]);
            });
        }
    }
    window._newGames = tagged;

    var style = document.createElement('style');
    style.textContent = [
        '.new-badge{',
            'position:absolute;top:5px;right:5px;',
            'background:linear-gradient(135deg,#22c55e,#16a34a);',
            'color:#fff;font-size:9px;font-weight:700;',
            'letter-spacing:1.2px;padding:2px 6px;border-radius:4px;',
            'text-transform:uppercase;',
            'box-shadow:0 0 8px rgba(34,197,94,0.5);',
            'pointer-events:none;z-index:5;',
            'animation:new-badge-pulse 2.5s ease-in-out infinite;',
        '}',
        '@keyframes new-badge-pulse{',
            '0%,100%{box-shadow:0 0 6px rgba(34,197,94,0.5);}',
            '50%{box-shadow:0 0 14px rgba(34,197,94,0.85);}',
        '}',
        '.game-card.has-new-badge{position:relative;}',
    ].join('');
    document.head.appendChild(style);
})();

/* =====================================================
   EMERGENCY PANIC REDIRECT
===================================================== */
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.location.replace("https://drive.google.com/drive/my-drive");
    }
});

/* =====================================================
   GAME FILES AND LOGIC
===================================================== */
/* =====================================================
   GAME FILE LIST
   ~2698 entries — each maps to a file name on the CDN:
   https://cdn.jsdelivr.net/gh/taekfighter/ugs-singlefile/UGS-Files/<name>

   TO ADD A GAME: append the filename (without path) to this array.
   TO REMOVE A GAME: delete its line.
   Keep entries sorted alphabetically for sanity.
   Prefix "cl" is part of the actual filename on the CDN.
===================================================== */
let files = [
  "cl1",
"cl100RoomsOfEnemies",
"cl10bullets",
"cl10minutestildawn",
"cl10morebullets",
"cl12minibattles",
"cl13bones",
"cl1on1soccer",
"cl1v1lol",
"cl1v1tennis",
"cl2048",
"cl2048cupcakes",
"cl20smallmazes",
"cl234playergame",
"cl2doom",
"cl2Dshooting",
"cl3dash",
"cl3dasheditor",
"cl3dpinballspacecadet",
"cl3pandas",
"cl3pandasbrazil",
"cl3pandasfantasy",
"cl3pandasjapan",
"cl3pandasnight",
"cl3slices2",
"cl40xescape",
"cl4thandgoal",
"cl500calibercontractz",
"cl60secondsburgerrun",
"cl60secondssantarun",
"cl64in1nes",
"cl8ballclassic",
"cl8ballpool",
"cl9007199254740992",
"cl90in1nes",
"cl99balls",
"cl99nightsitf",
"clA Walk in The Forest (v10)",
"clabandoned3",
"clabsolutemadness",
"clacecombat2",
"clacecombat3",
"clacegangstertaxi",
"clachievementunlocked",
"clachievmentunlocked",
"clachievmentunlocked2",
"clachievmentunlocked3",
"clachillies",
"clachillies2",
"clAcko_s Mach Bike Challenge (v10)",
"clADarkRoom",
"cladatewithdeath",
"cladayintheoffice",
"clADOFAI",
"cladvancewars",
"cladvancewars2",
"cladvancewarsdualstrike",
"cladventneon",
"clAdventureCapatalist",
"cladventurecapitalist",
"claflac",
"claftertheweek",
"clagariolite",
"clageofwar",
"clageofwar2",
"clagesofconflict",
"clagesofempire",
"clahoysurvival",
"clai",
"clairlinetycoonidle",
"clakoopasrevenge",
"clakoopasrevenge2",
"clakumanorgaiden",
"claladdinsnes",
"clalexkiddinmiracleworld",
"clalienhominid",
"clalienhominidgba",
"clalienskyinvasion",
"clalientransporter",
"clalienvspredator",
"clallbossesin1",
"clallocation",
"clAltered Beast",
"clamaze",
"clambulencearush",
"clamidstthesky",
"clamigopancho",
"clamigopancho2",
"clamigopancho3",
"clamigopancho4",
"clamigopancho5",
"clamigopancho6",
"clamigopancho7",
"clamongus",
"clamorphous",
"clancientsins",
"clanemonesfall",
"clangry-birdsspace",
"clangrybirds-space",
"clangrybirds",
"clangrybirdsshowdown",
"clangrybirdsspace",
"clanimalcrossingwildworld",
"clanimalforestn64",
"clannsmb",
"clanotherworld",
"clantarttycoon",
"clantimatterdimensions",
"clapesvshelium",
"clapotris",
"clappleshooter",
"clappleworm",
"claquaparkio",
"clarceuslegend",
"clarcheryworldtour",
"clarchesspelago",
"clarena",
"clarmormayhem2",
"clarsonate",
"clarthursnightmare",
"clascent",
"clasdutydemands",
"clasmallworldcup",
"classesmentexaminationque",
"classessmentexamination",
"clasteroids",
"clasteroidsALT",
"clasteroidsarcade",
"clAstrosDreamland",
"clastynax",
"clatariadventure",
"clattackhole",
"clavalanche",
"claviamasters",
"claviamastersbuggy",
"clAwesomePirates",
"clawesomeplanes",
"clawesometanks",
"clawesometanks2",
"claxbattler",
"claxisfootballleague",
"clB3313",
"clb3313unabandonedA2",
"clb3313v102",
"clbabeltower",
"clbabychiccoadventure",
"clbabykaizo",
"clbabysniperinvietnam",
"clbackrooms",
"clbackrooms2D",
"clbackyardbaseball",
"clbackyardbaseball09",
"clbackyardbaseball10",
"clbackyardfootball",
"clbackyardsoccer",
"clbaconmaydie",
"clbadbodyguards",
"clbadicecream",
"clbadicecream2",
"clbadicecream3",
"clbadmondaysimulator",
"clbadparenting",
"clbadpiggies",
"clbadpiggieslatest",
"clbadtimesim",
"clbadtimesimulator",
"clbalatrogba",
"clbaldicaseoh",
"clbaldidecomp",
"clbaldiepstein",
"clbaldisbasics",
"clbaldisbasicsremaster",
"clbaldisfunnewschoolultimate",
"clballblast",
"clballistic",
"clballsandbricks",
"clballsandbricksgood",
"clballz",
"clbananasimulator",
"clbanbuds",
"clbanditgunslingers",
"clbanjokazooie",
"clbanjotooie",
"clBank Robbery",
"clbankbreakout2",
"clbankrobbery2",
"clbarryhasasecret",
"clbartblast",
"clbas",
"clbaseballbros",
"clbasketballfrvr",
"clbasketballlegends(1)",
"clbasketballlegends",
"clbasketballstars",
"clbasketballsuperstars",
"clbasketbattle",
"clbasketbros",
"clbasketrandom",
"clbasketrandomgood",
"clbasketslamdunk2",
"clbatterup",
"clbattlekarts",
"clbattles",
"clbattlesim",
"clbattlezone",
"clbazookaboy",
"clbballlegend",
"clbeachboxingsim",
"clbeamrider",
"clbearbarians",
"clbearsus",
"clbejeweledtwistds",
"clbejeweledtwistflash",
"clben10alienforce",
"clben10omniverse",
"clben10protector",
"clben10racing",
"clben10ultimatealien",
"clbendrowned",
"clbergentruck201x",
"clbfdia5b",
"clBFDIBranches",
"clbigflappytowertinysquare",
"clbigicetowertinysquare",
"clbigneontowertinysquare",
"clbigshotboxing2",
"clbigtowertinysquare",
"clbigtowertinysquare2",
"clbigtowertinysquare2good",
"clBig_Time_Butter_Baron",
"clbindingofisaccsheeptime",
"clbioevil4",
"clbitlife",
"clbitlifeencrypted",
"clbitplanes",
"clblackjack",
"clblackjackbattle",
"clblackjackhhhh",
"clblackknight",
"clblackout",
"clblacksmithlab",
"clblastronaut",
"clblazedrifter",
"clbleachvsnaruto",
"clblightborne",
"clblobsstory2",
"clblockblast",
"clblockblastv2",
"clblockcraftparkour",
"clblockcraftshooter",
"clblockpost",
"clblockthepig",
"clblockydemolitionderby",
"clblockysnakes",
"clblood",
"clbloodmoney",
"clbloodtournament",
"clbloons",
"clbloons2",
"clbloonspp1",
"clbloonspp2",
"clbloonspp3",
"clbloonspp4",
"clbloonspp5",
"clbloonsTD1",
"clbloonsTD2",
"clbloonsTD3",
"clbloonsTD4",
"clbloonsTD5",
"clbloonsTD6scratch",
"clbloxorz",
"clblumgiracers",
"clblumgirocket",
"clBMX2",
"clbntts",
"clbobasimulator",
"clbobtherobber",
"clbobtherobber2",
"clbobtherobber5",
"clbollybeat",
"clbomberman",
"clbomberman2",
"clbombermanhero",
"clbombermanworld",
"clBonanza-Bros",
"clbonkerssnes",
"clboomslingers",
"clbottlecracks",
"clbottleflip3d",
"clbotwds",
"clbounceback",
"clbouncemasters",
"clbouncybasketball",
"clbouncymotors",
"clBountyOfOne",
"clbowlalt",
"clbowmaster",
"clboxhead2playrooms",
"clboxheadnightmare",
"clboxinglive-2",
"clboxinglive2",
"clboxingrandom",
"clbrainrot",
"clbrawlsimulator3d",
"clBrawlstars",
"clbreadskate",
"clbridgerace",
"clbrotato",
"clBTD1",
"clbtd5",
"clbtts",
"clbtts2",
"clbubbleshooter",
"clbubbleshooterpirate",
"clbubbletanks",
"clbubbletanks2",
"clbubbletanks3",
"clbubbletanksarenas",
"clbubbletankstd",
"clbubsy",
"clbuckshotroulette",
"clbuildnowgg",
"clbulletforce",
"clbunnyland",
"clbunzobunny",
"clburgerandfrights",
"clburgertime",
"clburritobison",
"clburritobison2",
"clburritobisonlaunchalibre",
"clburritobisonrevenge",
"clbushidoblade",
"clBusterJam",
"clcactusmccoy(1)",
"clcactusmccoy",
"clcactusmccoy2(1)",
"clcactusmccoy2(2)",
"clcactusmccoy2",
"clcallofbattle",
"clcamilla",
"clcandybox1",
"clcannonballs3d",
"clcannonfodder",
"clcaptainlang",
"clcaptchaware",
"clcapybaraclicker",
"clcarcrash3",
"clcardrawing",
"clcareatscar2deluxe",
"clcarkingarena",
"clcarmods",
"clcarrampvspolicechase",
"clcarstuntsdriving",
"clCartoonNetworkTableTennisUltimateTournament",
"clcastaway",
"clcastlebloodline",
"clcastlecircleofmoon",
"clcastlevania",
"clcastlevania2",
"clcastlevania3",
"clcastlevaniaariaofsorrow",
"clcastlevaniadawnofsorrow",
"clcastlevanianes",
"clcastlewarsmodern",
"clcatmario",
"clcatmariogood",
"clcatslovecake2",
"clcavecrawler",
"clcavestory",
"clceleste",
"clceleste2",
"clcelestemariodx",
"clCeliasStupidROMHack",
"clcellardoor",
"clCellToSingularity",
"clcentipedearcade",
"clchainofmemories",
"clchaosfaction2",
"clcheckers",
"clcheesechompers3d",
"clcheeseisthereason",
"clcheeserolling",
"clcheshireinachatroom",
"clchess",
"clchessclassic",
"clchibiknight",
"clChickenCS",
"clchickenscream",
"clchickenwar",
"clchipschallenge",
"clchoppyorc",
"clchoroqwonderful",
"clchronotrigger",
"clchuzzle",
"clCircloO2",
"clciviballs",
"clciviballs2",
"clclashnslash",
"clclashofvikings",
"clclassof09",
"clclaymore",
"clclayuncraft",
"clcleanupio",
"clclearvision",
"clclearvision2",
"clclearvision3",
"clclearvision4",
"clclearvision5",
"clclimbforbrainrots",
"clclmadnessambulation",
"clclover",
"clclubbytheseal",
"clclusterrush",
"clcoalllcdemo",
"clcod4",
"clcodblackopp",
"clcoddefiance",
"clcodenamegordon",
"clcodeorg",
"clcodeorgbutoffline",
"clcodercraft",
"clcodmodernwarfare",
"clcodworldatwar",
"clcoffeemaker",
"clcoldpines",
"clcolorburst3d",
"clcolormatch",
"clcolorwatersort3d",
"clcombopool",
"clcommandandconquer",
"clcommanderkeen4",
"clcommanderkeen5",
"clcommanderkeen6",
"clconfrontingurself",
"clconfrontingyourself",
"clconkersbadfurday",
"clcontra",
"clcontra3",
"clcookie-clicker",
"clcookieclicker",
"clcookieclickercool",
"clcookieclickergood",
"clcookieclickermodmenu",
"clcookingmama",
"clcookingmama2",
"clcookingmama3",
"clcoreball",
"clcoryinthehouse",
"clcotlk",
"clcountmastersstickmangames",
"clcoverorange",
"clcoverorange2",
"clcoverorangejourneygangsters",
"clcoverorangejourneyknights",
"clcoverorangejourneypirates",
"clcoverorangejourneyspace",
"clcoverorangeplayerspack",
"clcoverorangeplayerspack2",
"clcoverorangeplayerspack3(1)",
"clcoverorangeplayerspack3",
"clcrankit!",
"clcrankit",
"clcrash2",
"clcrash3",
"clcrashbandicoot (1)",
"clcrashbandicoot",
"clcrashbandicoot2",
"clcrashteamracing",
"clcrazycars",
"clcrazycattle3d",
"clcrazychicken3D",
"clcrazyclimber",
"clcrazyfrogracer",
"clcrazymotorcycle",
"clcrazypenguincatapult",
"clcrazyplanelanding",
"clcrazytaxigba",
"clcreaturecardidle",
"clcreeperworld2",
"clcreepyinternetstories",
"clcreepynightfunkin",
"clcrimsonmadness",
"clcrossyroad",
"clcrunchball3000",
"clCrystalCastles",
"clcs16",
"clcs6",
"clcsds",
"clcsgoclicker",
"clctgpnitro",
"clcurveball(1)",
"clcurveball",
"clcustomersupport",
"clcuttherope",
"clcuttheropeholiday",
"clcuttheropetimetravel",
"clcvooc",
"clcyberbungracing",
"clcybersensation",
"cldadgame",
"cldadish",
"cldadnme",
"cldaggerfall",
"cldandysworldclicker",
"cldanktomb",
"cldasharena",
"cldashio",
"clDashmetry",
"cldatewithiraq",
"cldborigins",
"cldborigins2",
"cldbsniper",
"cldbzattacksaiyans",
"cldbzdevolution",
"cldbzsuperwarriorssonic",
"cldbzwarriors2",
"clddlc64",
"cldeadair",
"cldeadestate",
"cldeadfrontieroutbreak",
"cldeadfrontieroutbreak2",
"cldeadlydescent",
"cldeadplate",
"cldeadseat",
"cldeadzed",
"cldeadzed2",
"cldeathchase",
"cldeathrun",
"cldeblob2",
"cldecision",
"cldecision2",
"cldecision3",
"cldecisionmedieval",
"cldeepersleep",
"cldeepestsword",
"cldeepsleep",
"cldefenderarcade",
"cldefendyourcastle",
"cldefendyournuts",
"cldefendyournuts2",
"cldeltarune",
"cldeltatraveler",
"cldementium",
"cldemolitionderbycrashracing",
"cldemonblade",
"cldemonbluff",
"cldiablo",
"cldiamondhollow",
"cldiamondhollow2",
"cldiddykong-racing",
"cldieinthedungeon",
"cldigdeep",
"cldigdug",
"cldigdug2",
"cldigdug26",
"cldigtochina",
"cldimensionalincident",
"cldinodudes",
"cldinorun",
"cldinorunenterplanetd",
"cldinorunmarathonofdoom",
"cldiredecks",
"cldkccompetitioncart",
"clDKNESCollection(1)",
"clDKNESCollection",
"clDigOutofPrison",
"cldoblox",
"cldogeminer",
"cldogeminer2",
"cldokidokiliteratureclub",
"cldomeromantik",
"cldonkeykong",
"cldonkeykong64",
"cldonkeykong94",
"cldonkeykongcountry",
"cldonkeykongcountry2",
"cldonkeykongcountry3",
"cldonkeykongnes",
"cldontescape",
"cldontescape2",
"cldontescape3",
"cldontyoulecturemehtml",
"cldoodlejump",
"cldoodlejumpgoober",
"cldoom",
"cldoom2",
"cldoom2d",
"cldoom2dDOS",
"cldoom2dos",
"cldoom3pack",
"cldoom64",
"cldoomdos",
"cldoomemscripten",
"cldoomps",
"cldoompsalt",
"cldoomzio",
"cldoorscastle",
"cldoswasmx",
"cldoubledribble",
"cldouchebaglife",
"cldouchebagworkout",
"cldouchebagworkout2",
"cldownthemountain",
"cldragonballadvance",
"clDragonBallZTheLegacyofGoku",
"cldragonquest5ds",
"clDragonQuestIX",
"cldragonwarriormonsters",
"clDragonxclient",
"cldrawclimber",
"cldrawntolife",
"cldrawntolife2",
"cldrawtheline",
"cldreader",
"cldreadheadparkour",
"cldriftboss",
"cldrifthuntersmerge",
"cldriftsimulator",
"cldrivemady",
"cldrivenwild",
"cldriverussia",
"cldrmario",
"cldrweedgaster",
"cldta6",
"cldubstep",
"clduckhunt",
"clducklfe5",
"clducklife",
"clducklife2",
"clducklife3",
"clducklife4",
"clducklifebattle",
"clducklifespace",
"clducklingsio",
"clducktales",
"clducktales2",
"cldud",
"cldukenukem2",
"cldukenukem3d",
"cldumbwaystodie",
"cldumpling",
"cldunebuggy",
"cldungeondeck",
"cldungeonraid",
"cldungeonsanddegenerategamblers",
"cldunkshot",
"clduskchild",
"cldyingdreams",
"cldynamiteheaddy",
"clEaglercraft-Alpha-126-Offline",
"clEaglercraft-Beta-1.3-Offline",
"clEaglercraft-Beta-13-Offline",
"clEaglercraft-Indev-Offline (1)",
"clEaglercraft-Indev-Offline(1)",
"clEaglercraft-Indev-Offline(2)",
"clEaglercraft-Indev-Offline",
"cleaglercraft152",
"clEaglercraftL_19_v0_7_0_Offline_Signed(1)",
"clEaglercraftL_19_v0_7_0_Offline_Signed",
"cleaglercraftnebula",
"cleagleride",
"clearntodie",
"clearntodie2",
"clearthbound",
"clearthbound3",
"clearthboundsnes",
"clearthtaken",
"clearthtaken2",
"clearthtaken3",
"clearthwormgg",
"clearthwormjim (1)",
"clearthwormjim",
"clearthwormjim2 (1)",
"clearthwormjim2",
"cledelweiss",
"cledyscarsimulator",
"cleffinghail",
"cleffingmachines",
"cleffingworms",
"cleffingzombies",
"clegg",
"cleggycar",
"clelasticface",
"clelectricman2",
"clelevatoraction",
"clelytraflight",
"clemujs",
"clenchain",
"clendacopia",
"clendlesswar4",
"clendlesswar5",
"clendlesswar5wow",
"clendlesswar7",
"clenduro",
"clepicbattlefantasy5",
"clescalatingduel",
"clescaperoad",
"clescaperoadcity2",
"clescapeschoolduel",
"clet",
"cletrianoddyssey",
"cleurovisionsim",
"clevilglitch",
"clevolution",
"clexcitebike64",
"clexitpath",
"clexoobservation",
"clextremerun3d",
"clfactoryballs",
"clfactoryballs2",
"clfactoryballs3",
"clfactoryballs4",
"clfairytalevsonepiece",
"clfallguys",
"clfallout",
"clfamidash",
"clfamidash128",
"clfamidash2alpha",
"clfamidashAlbum128",
"clfamidashBSides128",
"clfamidashCSides128",
"clfamidashDSides128",
"clfamilyguycorrupted",
"clfancypantsadventure",
"clfancypantsadventure2",
"clfancypantsadventure3",
"clfancysnowboarding",
"clfantasyzone",
"clfashionbattle",
"clfattygenius",
"clfearassessment",
"clfearstofathomhomealone",
"clfeedthevoid",
"clfeedus",
"clfeedus2",
"clfeedus3",
"clfeedus4",
"clfeedus5",
"clff2ws",
"clFF3",
"clff6",
"clffaf",
"clffmysticquest",
"clFFsonic1",
"clFFsonic2",
"clFFsonic3",
"clFFsonic4",
"clFFsonic5",
"clFFsonic61",
"clFFsonic62",
"clFIFA07",
"clFIFA10",
"clFIFA11",
"clFIFA2000(1)",
"clFIFA2000(2)",
"clfifa2000",
"clFIFA99",
"clFIFAinternationalsoccer",
"clFIFAroadtoworldcup98",
"clFIFAsoccer06",
"clFIFAsoccer95",
"clFIFAsoccer96",
"clFIFAsoccer97",
"clFIFAstreet2",
"clfinalearth2",
"clfinalfantasy",
"clfinalfantasy2nes",
"clfinalfantasy3nes",
"clfinalfantasyII",
"clfinalfantasyIX",
"clfinalfantasylegend2",
"clfinalfantasytactics",
"clfinalfantasyVI",
"clfinalfantasyVII",
"clfinalfantasyVIId2",
"clfinalfantasyVIId3",
"clfinalfantasyVIItheothertetrr",
"clfinalninja",
"clfindthealien",
"clfireblob",
"clfireboyandwatergirl",
"clfireboyandwatergirl2",
"clfireboyandwatergirl3",
"clfireboyandwatergirl5",
"clfireboyandwatergirl6",
"clfireemblem",
"clfisheatgettingbig",
"clfisquarium",
"clfivenightsatbaldisredone",
"clfivenightsatepsteins",
"clfivenightsatshreks",
"clfivenightsatshrekshotel",
"clfivenightsatyoshis",
"clflappybird",
"clflashsonic",
"clFleurdeLis",
"clfloodrunner",
"clfloodrunner2",
"clfloodrunner4",
"clfluidism",
"clfnac1",
"clfnac2",
"clFNAF",
"clFNAF2",
"clFNAF3",
"clfnaf3remastered",
"clFNAF4",
"clfnaf4halloween",
"clfnafanimatronics",
"clfnafps",
"clfnafshooter",
"clfnafsl",
"clfnafucn",
"clfnafworldd",
"clfnaw",
"clfnfaethos",
"clfnfagoti",
"clfnfakage",
"clfnfanimation",
"clfnfannie",
"clfnfasdf",
"clfnfbelowdepths",
"clfnfbfdi26",
"clfnfbinarybreakdown",
"clfnfblackbetrayal",
"clfnfbside",
"clfnfcamelliarudeblaster",
"clfnfcandycarrier",
"clfnfchara",
"clfnfcitytales",
"clfnfclassified",
"clfnfcorrosion",
"clfnfcory",
"clfnfcrunchin",
"clfnfdeciever",
"clfnfdesolation",
"clfnfdocumictxtv3",
"clfnfdokitakeoverplus",
"clfnfdropandroll",
"clfnfdsides",
"clfnfdustin",
"clfnfdusttale",
"clfnffleetway",
"clfnfflippedout",
"clfnffnaf1",
"clfnffnaf2",
"clfnffnaf3",
"clfnffnatpt",
"clfnfgamebreakerbundle",
"clfnfgfmode",
"clfnfgodot",
"clfnfgoldenapple",
"clfnfhank",
"clfnfheartbreakhavoc",
"clfnfherobrine",
"clfnfhex",
"clfnfholiday",
"clfnfhorkglorpgloop",
"clfnfhotline",
"clfnfhypnoslullaby",
"clfnfimposter3",
"clfnfimposterv4",
"clfnfindiecross",
"clfnfinfernalbout",
"clfnfinfiniteirida",
"clfnfironlung",
"clfnfjapcreepypasta",
"clfnfmadnesspoop",
"clfnfmaginagematches",
"clfnfmariomadnessdside",
"clfnfmarioport",
"clfnfmcmadness",
"clfnfmidfight",
"clfnfmiku",
"clfnfmobmod",
"clfnfneo",
"clfnfpiggyfield",
"clfnfplutoshi",
"clfnfpokepastaperdition",
"clfnfporifera",
"clfnfqt",
"clfnfremnants",
"clfnfretrospecter",
"clfnfrevmixed",
"clfnfrewrite",
"clfnfrhythmicrev",
"clfnfrottensmoothie",
"clfnfselfpaced",
"clfnfshaggy4keys",
"clfnfshaggyxmatt",
"clfnfshucks-v2",
"clfnfshucksv2",
"clfnfsky",
"clfnfsoft",
"clfnfsonicexe",
"clfnfsonicexe4",
"clfnfstarlightmayhem",
"clfnfstridentcrisis",
"clfnftailsgetstrolled",
"clfnftooslowfran",
"clfnftricky",
"clfnfTWIDDLEFINGER",
"clfnfundertale",
"clfnfvoid",
"clfnfvstabi",
"clfnfwaltenfiles",
"clfnfwednesday-infedility",
"clfnfwhitty",
"clfnfzardy",
"clfocus",
"clfolderdungeon",
"clfootballbros",
"clfootballlegends",
"clforknsausage",
"clfortzone",
"clfpa4p1",
"clfpa4p2",
"clfreegemas",
"clfreerider",
"clfreerider2",
"clfreerider3",
"clfridaynightfunkin",
"clfroggerarcade",
"clfromrusttoash",
"clfruitninja",
"clfunkinmix",
"clfunnybattle",
"clfunnybattle2",
"clfunnymadracing",
"clfunnyshooter2",
"clfunnyshooter22",
"clfuschiax",
"clfused240",
"clfzero",
"clfzerox",
"clgachaverse",
"clGain Ground",
"clgalaga",
"clgameandwatchcollection",
"clgamewatchgallery3",
"clgangstabean",
"clgangstabean2",
"clgangsterbros",
"clgarcello",
"clgarfcaughtinact",
"clgdlite",
"clgeneralchaos",
"clgenericfightermaybe",
"clgeometrydashscratch",
"clgeometryvibes",
"clgeorgeandtheprinter",
"clgetawayshootout",
"clgetontop",
"clGettothetopalthoughthereisnotop",
"clgetyoked",
"clggshinobi",
"clggshinobi2",
"clghosttrick",
"clgimmietheairpod",
"clgladdihoppers",
"clglfighters",
"clgloryhunters",
"clglover",
"clgoalsouthafrica",
"clgobble",
"clgoingballs",
"clgolddiggerfrvr",
"clgoldenaxe",
"clgoldenaxe2",
"clgoldenaxe3",
"clgoldeneye007",
"clgoldensun",
"clgoldensunnds",
"clGoldenSunTheLostAge",
"clgoldminer",
"clgolfbattle",
"clgolforbit",
"clgolfsunday",
"clgoodbigtowertinysquare",
"clgoodbigtowertinysquare2",
"clgoodboygalaxy",
"clgoodmonkeymart",
"clgooftroopsnes",
"clgooglebaseball",
"clgoogledino",
"clgorescriptclassic",
"clgorillatag",
"clgotobed",
"clgrandactionsimulator-ny",
"clgranddad",
"clgrandescapeprison",
"clgrandtheftautoadvance",
"clgranny",
"clgranny2",
"clgranny22",
"clgranny3",
"clgrannycreepy",
"clgrannynightmare",
"clgrannyy",
"clgranturismo",
"clgranturismo2",
"clgrassmowing",
"clgravity",
"clgravitymod",
"clgreenergrassawaits",
"clgrey-box-testing",
"clgrimacebirthday",
"clgrindcraft",
"clgrn",
"clgrowagarden",
"clgrowdenio",
"clgrowmi",
"clgrowyourgarden",
"clgta",
"clgta2",
"clgta22",
"clgta2alt",
"clgtaalt",
"clgtaalty",
"clgtachina",
"clgtamods",
"clguesstheiranswer",
"clgun-spin",
"clgunblood",
"clguncho",
"clgunfighterjessejames",
"clgunknight",
"clgunmayhem",
"clgunmayhem2",
"clgunmayhem2goof",
"clgunmayhemredux",
"clgunnight",
"clgunsmoke",
"clgunstarheroes",
"clgymstack",
"clgyromite",
"clhacx",
"clhajimeippo",
"clhajimenoippo",
"clhalflife",
"clhalocombatdevolved",
"clhandshakes",
"clhandsofwar (1)",
"clhandsofwar(1)",
"clhandsofwar(2)",
"clhandsofwar",
"clhandulum",
"clhanger",
"clhanger2",
"clhangonsms",
"clhappyroom",
"clhappywheels",
"clhardwaretycoon",
"clharmonyofdissonance",
"clHaroldsbadday",
"clharvestio",
"clharvestmoon",
"clharvestmoon2",
"clharvestmoon64",
"clhauntedschool",
"clhauntthehouse",
"clheartandsoul",
"clheartandsoul121",
"clhei$t",
"clHelios-Offline (1)",
"clHelios-Offline",
"clhelixjump",
"clhellron",
"clhelpnobrakes",
"clheretic",
"clhero3flyingrobot",
"clherobrinereborn",
"clhextris",
"clHighSpeed",
"clhighstakes",
"clhighwayracer2",
"clhighwaytraffic3d",
"clhillclimbracinglite",
"clHiNoHomo",
"clhipsterkickball",
"clhit8ox",
"clhitsinglereal",
"clhitstunfly",
"clhl2doom",
"clhobo",
"clhobo2",
"clhobo3",
"clhobo4",
"clhobo5",
"clhobo6",
"clhobo7",
"clhobovszombies",
"clHoennsLastWish",
"clholebattle",
"clholeio",
"clhollowknight",
"clhomesheephome",
"clhorrormickeymouse",
"clhotdogbush",
"clhotwax",
"clhouseofhazards",
"clhoverracerdrive",
"clhuggywuggypixel",
"clhumanexpenditureprogram",
"clhungryknight",
"clhungrylamu",
"clhyppersandbox",
"clicantbelievegoogleflaggedmeforthenameofthefilelol",
"clice age baby",
"clicedodo",
"clicefishing",
"clicypurplehead",
"clidlebreakout",
"clidledice",
"clidlefootballmanager",
"clidleidlegamedev",
"clidleminertycoon",
"clidleminorzamnshes12",
"climpossiblequiz (1)",
"climpossiblequiz",
"climpossiblequiz2",
"clinclementemerald",
"clindiantrucksimiulator",
"clinfinitecraft",
"clinkgame",
"clInkwell (v104)",
"clinnkeeper",
"clinsidestory",
"clinsomniary",
"clintellisphere",
"clinteractivebuddy",
"clintoruins",
"clintospace",
"clintospace2",
"clintospace3",
"clintothedeepweb",
"clintrusion",
"cliqball",
"clironsnout",
"clironsoldier",
"clirori",
"clitgetssolonelyhere",
"cliwbtg",
"cljacksmith",
"cljacksmithencryptedorsmthn",
"cljailbreakobbbobob",
"cljamesbondjr",
"cljazzjackrabbit",
"cljazzjackrabbit2",
"cljefflings",
"cljellydadhero",
"cljellydrift",
"cljellymario",
"cljellytruck",
"cljellytruckgood",
"cljetforcegemini",
"cljetpackjoyride",
"cljetrush",
"cljetskiracing",
"cljmocraft",
"cljohnnytrigger",
"cljohnnyupgrade",
"cljojobaps1",
"cljourneyarcade",
"cljourneydownhill",
"cljoustarcade",
"cljsvecx",
"cljumbomario",
"clJUMP",
"cljumpingshell",
"cljunglebooksnes",
"cljungledeerhunting",
"cljurassicpark",
"cljustfalllol",
"cljusthitthebutton",
"cljustoneboss",
"clkaizomarioworld",
"clkalikan",
"clkanyezone",
"clkapi",
"clkaratebros",
"clkarlson",
"clkartbros",
"clKenGriffeyJrPresentsMajorLeagueBaseball",
"clkeroseneclient",
"clkillerinstinct",
"clkillover",
"clkilltheiceagebabyadventure",
"clkimjonguntilepuzzle",
"clkingdomheartsdays",
"clkingdomheartsrecoded",
"clkingdomheartsrecodedalt",
"clkirby64",
"clkirby64crystalshards",
"clkirbyandtheamzingmirror",
"clkirbycanvascurse",
"clkirbysadventure",
"clkirbysdreamland",
"clkirbysdreamland3",
"clkirbysoftandwet",
"clkirbysqueaksquad",
"clkirbysuperstar",
"clkirbysuperstarultra",
"clkirbytiltandtumble",
"clkittencannon",
"clklifur",
"clknifehit",
"clknightmaretower",
"clknockknock",
"clkonkrio",
"clkoopasrevenge",
"clkourio",
"clks2teams",
"cllaceysflashgames",
"cllastfirered",
"cllasthorizon",
"cllaststand",
"cllaststand2",
"clleaderstrike",
"clleapandavoid2",
"cllearntofly",
"cllearntofly2",
"cllearntofly3",
"clLearnToFly3Debug",
"cllearntoflyidle",
"cllearntoflyidlehack",
"clLegacyOfGoku",
"cllegobatman",
"cllegobatman2superheroes",
"cllegoindianajones",
"cllegoindianajones2",
"cllegoninjago",
"cllegostarwars",
"cllegostarwars2gba",
"cllegostarwarsgba",
"cllemmings",
"clletitconsume",
"clletsgoeevee",
"clletsgopikachu",
"clleveldevil",
"clleverwarriors",
"cllightitup",
"cllilrunmo",
"cllime",
"cllinerider",
"cllinksawakeningdx",
"cllinktothepast",
"cllittlealchemy2",
"cllittlerunmo",
"cllockthedoor",
"clloderunner",
"cllonewolf",
"cllosangelesshark",
"cllowknight",
"clloz1",
"cllozlinkawakening",
"cllozminishcap",
"cllozoracleofseasons",
"cllozphantomhourglass",
"cllozspirittracks",
"clLSE",
"cllucid",
"clluckyblocks",
"cllumberobby",
"cllummm",
"clmadalinstuntcars",
"clmadalinstuntcarsgood",
"clmadalinstuntcarsmultiplayerfixed",
"clmadden93",
"clmadden94",
"clmadden95",
"clmadden96",
"clmadden99",
"clmaddenfootball",
"clmaddenfootball64",
"clmaddennfl",
"clmaddennfl2000",
"clmaddennfl2001",
"clmaddennfl2002",
"clmaddy98",
"clmadness-retaliation",
"clmadnessaccelerant",
"clmadnesscombatdefense",
"clmadnesscombatnexus",
"clmadnessgemini",
"clmadnesshydraulic",
"clmadnessinteractive",
"clmadnessoffcolor",
"clmadnesspremediation",
"clmadnessretaliation",
"clmadnesss2010",
"clmadnessstand",
"clmadskillsmotocross2",
"clmadstick",
"clmadstuntcars2",
"clmagetoweridle",
"clmagictiles3",
"clmajorasmask",
"clmakesureitsclosed",
"clmami",
"clmanagod",
"clmarbleracer(1)",
"clmarbleracer",
"clmari0",
"clMario Party Advance",
"clmario3",
"clmario64webgl",
"clmarioandluigisuperstarsaga",
"clmariobuilder64(1)",
"clmariobuilder64",
"clmariocombat",
"clmariogolf",
"clMarioisMissingDoneRight",
"clmariokart64",
"clmariokartds",
"clmariokartsupercircuit",
"clmariolostlevels",
"clmariomadness",
"clmariomakersnes",
"clmariominusrabbids",
"clmariopaint",
"clmarioparty",
"clmarioparty2",
"clmarioparty3",
"clmariopartyds",
"clmariosmysterymeat",
"clmariotennis",
"clmariotennisgb",
"clmariovsluigi",
"clMarvelSuperHeroesArcade",
"clMarvelVsCapcomPS1",
"clMarvelVsStreetFighter",
"clmarvelvsstreetfighterjp",
"clmaskedforcesunlimited",
"clmastermindworldconquerer",
"clmatrixrampage",
"clmattv2",
"clmauimallard",
"clmaxpayne",
"clmcfpsfbhd",
"clmcraerally",
"clmeatboy",
"clmeatboyflash",
"clmedalofhonor",
"clmedievalshark",
"clmedievil",
"clmegacd",
"clmegachess",
"clmegaclient",
"clmegaman",
"clmegaman2",
"clmegaman2gba",
"clmegaman3",
"clmegaman4",
"clmegaman5",
"clmegaman5gb",
"clmegaman6",
"clmegaman7",
"clmegaman8",
"clmegamanbasscftf",
"clmegamanbattlechipchallenge",
"clmegamanbn5tc",
"clmegamanbn5tp",
"clmegamanbn6cf",
"clmegamanbn6cg",
"clmegamanlegends",
"clmegamanlegends2",
"clmegamanx",
"clmegamanx2",
"clmegamanx3",
"clmegamanx4",
"clmegamanx5",
"clmegamanx6",
"clmegamanzero",
"clmegamanzx",
"clmegaminer",
"clmelonplayground",
"clmeowuwu",
"clmergeroundracers",
"clmetalgear",
"clmetalgearsolid",
"clmetalgearsolidps",
"clmetalslug",
"clmetalslug2",
"clmetalslugadvance",
"clmetalslugmission1",
"clmetalslugmission2",
"clMetalSonicHyperdrive",
"clmetroid",
"clmetroid2",
"clmetroidfusion",
"clmetroidprimehunters",
"clmetroidzeromission",
"clmiamishark",
"clmickeymaniasnes",
"clmicrolife",
"clmicromages",
"clmidwaysgreatesthitsn64",
"clmightyknight",
"clmightyknight2",
"clmimic",
"clMinceraft-I-NotMine_V6(1)",
"clMinceraft-I-NotMine_V6",
"clmindscape",
"clmindwave",
"clminecaves",
"clminecraft1-8-8",
"clminecraftcasesim",
"clminecraftpocketedition",
"clminecraftshooter",
"clMINECRAFTTOWERDEFENSE",
"clmineshooter",
"clminesweeperplus",
"clminhero",
"clminicrossword",
"clminiflips",
"clminimart",
"clminishooters",
"clminitooth",
"clmiraginewar",
"clmisslecommand",
"clmk4ampedup",
"clmkmythologiesn64",
"clmktrilogyps1",
"clmmbn3b",
"clmmbn3w",
"clmmbn4bm",
"clmmbn4rs",
"clmmbnws",
"clmmsf2zxn",
"clmmsf2zxs",
"clmmsf3ba",
"clmmsf3rj",
"clmmsfd",
"clmmsfl",
"clmmsfp",
"clmmwilywars",
"clmo64(1)",
"clmo64",
"clmobcontrolhtml5",
"clmobiusrevolution",
"clMoemon Emerald Vanilla+ (v110)",
"clmomimsleeping",
"clmomoscrushers",
"clmoneyrush",
"clmonkeymart",
"clmonkeymartenc",
"clmonsterderby",
"clmonsterswing",
"clmonstertracks",
"clmonstertruckcurfew",
"clmonstertruckportstunt",
"clmoonemeraldextremerandomizer",
"clmortalkombat",
"clmortalkombat2",
"clmortalkombat2a",
"clmortalkombat3",
"clmortalkombat3a",
"clmortalkombat4",
"clmortalkombata",
"clmortalkombatadvance",
"clmortkom4",
"clmotherload",
"clmotoroadrash",
"clmotox3m2",
"clmotox3m3",
"clmotox3mm",
"clmotox3mpoolparty",
"clmotox3mspookyland",
"clmotox3mwinter",
"clmountainbikeracer",
"clmrmine",
"clmrracer",
"clmspacman (1)",
"clmspacman(1)",
"clmspacman(2)",
"clmspacman",
"clmultitask",
"clmutilate-a-doll",
"clmvpbaseball",
"clmxoffroadmaster",
"clmyfriendpedro",
"clmyfriendpedroarena",
"clmyteardrop",
"cln",
"clnarc",
"clnatsuki64",
"clnaturalselection",
"clNautilusOS(1)",
"clNautilusOS",
"clNBAhangtime",
"clNBAjam",
"clnbajamTE",
"clnbalive2000",
"clnbalive2003",
"clnblox",
"clneonblaster",
"clneonrider",
"clnesworldchampion",
"clnetattack",
"clneverendinglegacy",
"clnewersmbds",
"clnewgroundsrumble",
"clnewsupermariobros",
"clNewSuperMarioWorld2AroundtheWorld",
"clnewyorkshark",
"clnextdoor",
"clnflblitz",
"clnfscarbonowncity",
"clnfsmostwanted",
"clnfsporcheunleashed",
"clnfsunderground",
"clnfsunderground2",
"clngon(1)",
"clngon",
"clnhl2002",
"clnhl98",
"clnhlhitz2003",
"clnickelodeonsuperbrawl2",
"clNicktoonsFreezeFrameFrenzy",
"clnightcatsurvival",
"clnightclubshowdown",
"clnightfire",
"clnightshade",
"clnikehub",
"clnimrods",
"clninjabrawl",
"clninjaobbyparkor",
"clnintendogslab",
"clnintendoworldcup",
"clnitclient",
"clnitromemustdie",
"clnomoregameasdsadfagfggdfs",
"clnoobminer",
"clnotyourpawn",
"clnovaclient",
"clnplus",
"clnsmbuds",
"clnsmbwds",
"clnubbysnumberfactory",
"clnullkevin",
"clNutsandBoltsScrewingPuzzle",
"clnzp",
"clobby-99-will-lose",
"clobby1jumpperclick",
"clobby456",
"clobbybike",
"clobbycart",
"clobbyonlyup",
"clobbyrainbowtower",
"clobbyslide",
"clobbyswing",
"clobbyyardsale",
"clobeythegame",
"clocarinaoftime",
"cloddbotout",
"cloddfuture",
"clofflineparadise",
"clohflip",
"clomegalayers",
"clomeganuggetclicker",
"clomnipresent",
"clonebitadventure",
"clonenightasfreddy",
"clonepiece",
"clonepiecefighting",
"cloneshotold",
"clonlyup",
"clOotMasterQuest",
"cloperius",
"cloppositeday",
"clopposumcountry",
"clOrangeRoulette",
"clorbofcreation",
"clordinarysonicromhack",
"cloregontrail",
"clorigamiking",
"clormmimastickwithclsoitcanberememberedoyeahclalienhominid",
"clortalkombat4",
"closu",
"clourpleguy",
"clouthold",
"cloutnumbered",
"clOutrunArcade",
"clOutrunGenesis",
"cloverburden",
"clovo",
"clovo2",
"clovodimensions",
"clovofixed",
"clpacman",
"clpacmana",
"clpacmansuperfast",
"clpacmanworld3",
"clpacmanworldg",
"clpacmanworldpsx",
"clpandameic2",
"clpapabakeria",
"clpapadonut",
"clpapalouienighthunt2",
"clpapalouiewhenburgersattack",
"clpapalouiewhenpizzasattack",
"clpapalouiewhensundaesattack",
"clpapapizzagood",
"clpapapizzagoody",
"clpapapizzamamamia",
"clpapasburgerIIIAAAAA",
"clpapascheeseria",
"clpapascupcakeria",
"clpapasfreezeria",
"clpapashotdoggeria",
"clpapaspancakeria",
"clpapaspastaria",
"clpapasscooperia",
"clpapassushiria",
"clpapastacomia",
"clpapaswingeria",
"clpaperio",
"clpaperio3d",
"clpaperiomania",
"clpapermario",
"clPaperMarioDSE",
"clPaperMarioPracticeHack",
"clpapermariopromode",
"clpapermariottyd",
"clparappatherapper",
"clparappatherapperalt",
"clparkingfury",
"clparkingfury2",
"clparkingfury3",
"clparkingrush",
"clpartnersintime",
"clpeacekeeper",
"clpeach",
"clpeggle",
"clpenaltykicks",
"clpenguindiner",
"clpenguinpass",
"clpepsiman",
"clpepsimanalt",
"clpereelous",
"clperfectdark",
"clperfecthotel",
"clpersona",
"clpersona2",
"clpersona2alt",
"clpersonaalt",
"clpetworld",
"clphantasystar",
"clphantasystar2",
"clphantasystar3",
"clphantasystar4",
"clphasma",
"clpheonixjusticeforall",
"clpheonixrightaceattorny",
"clpheonixtrialsandyear",
"clpheonixtrialsandyeartrhfasd",
"clpibbyapocalypse",
"clpiclient",
"clpico8",
"clpico8edu",
"clpicodriller",
"clpicohot",
"clpicolife",
"clpiconightpunkin",
"clpicosschool",
"clpicovsbeardx",
"clpiecesofcake",
"clpikwip",
"clpingpongchaos",
"clpinkbike",
"clpint",
"clpitfall",
"clpitof100trials",
"clpixelbattlegroundsio",
"clpixelcombat2",
"clpixelgun",
"clpixelquestlostidols",
"clpixelshooter",
"clpixelspeedrun",
"clpixelwarfare",
"clpizzapapa",
"clpizzatower",
"clpkmnarutoans",
"clplanetlife",
"clplangman",
"clplantsvszombies",
"clplantsvszombiesnds",
"clplazmaburst",
"clplinko",
"clplonky",
"clpogo3D",
"clpokeacademylifeforever",
"clpokeallin",
"clPokeAmbrosia",
"clpokebattlefact",
"clpokeblack",
"clpokeblack2alt",
"clpokeblack2html",
"clpokeblackalt",
"clpokeblazeblack2redux",
"clpokeblue",
"clpokeclassic",
"clpokecrown",
"clpokecrystaladvanceredux",
"clpokecrystalclear",
"clpokediamond",
"clpokedreamstone",
"clpokeeliteredux",
"clpokeelysiuma",
"clpokeelysiumb",
"clpokeemeraldenhanced",
"clpokeemeraldexceeded",
"clpokeemeraldhorizons",
"clpokeemeraldimperium",
"clpokeemeraldrandom",
"clpokeemeraldrogue",
"clPokeEmeraldRogueEX",
"clpokeemeraldz",
"clpokefiregold",
"clpokeflora",
"clpokefrlgplus",
"clpokefuseddimension",
"clPokeFusion3",
"clpokegaia",
"clpokegoldenshield",
"clpokegschronicles",
"clpokeheartgold",
"clPokeHeartgoldGenerations",
"clpokelightplatinum",
"clpokeliquidcrysta",
"clpokemegamoemon",
"clpokemonamnesia",
"clpokemonclover",
"clpokemoncrystal",
"clpokemonemerald",
"clpokemonemeraldcrest",
"clpokemonemeraldimperium",
"clpokemonemeraldkaizo",
"clpokemonemeraldmini",
"clPokemonemeraldrouge",
"clpokemonemeraldseaglass",
"clpokemonenergizedemerald",
"clpokemonevolvedsfdgsdfs",
"clpokemonfirered",
"clpokemonfireredandleafgreenplusedition",
"clpokemonfireredrandomized",
"clpokemongold",
"clpokemonkaizoironfirered",
"clpokemonlazarus",
"clpokemonleafgreen",
"clpokemonmodernemerald",
"clpokemonmysterydungeon",
"clpokemonperfectemerald55",
"clpokemonquetzal",
"clpokemonroaringred",
"clPokemonrocketedition",
"clpokemonruby",
"clpokemonsaiph",
"clpokemonsaiph2",
"clpokemonsapphire",
"clpokemonshinsigma",
"clpokemonsilver",
"clpokemonslgreen",
"clpokemonsmred",
"clpokemonsnap",
"clpokemonsors",
"clpokemonsors2",
"clpokemonstadium",
"clpokemonstadium2",
"clpokemontowerdefense",
"clpokemonultimatefusion",
"clpokemonunbound",
"clpokemonvolume1",
"clpokemonvolume2",
"clpokemonvolume3",
"clpokemonvolume4",
"clpokemoonemerald",
"clpokemoongalaxy",
"clpokemysteryexplorersofsky",
"clpokenameless",
"clpokeodyssey",
"clpokepasta",
"clpokepath",
"clpokepearl",
"clpokeperfectfirered",
"clpokepisces",
"clpokeplatinum",
"clpokeplatinumrandomized",
"clpokepureblue",
"clpokepuregreen",
"clpokepurered",
"clpokerechargedpink",
"clpokerechargedyellow",
"clpokerecordkeepers",
"clpokered",
"clpokerenegadeplat",
"clpokerocketedition",
"clpokerowe",
"clpokeruby",
"clpokerunandbun",
"clpokescorchedsilver",
"clpokesoulsilver",
"clpokesunsky",
"clpoketcg1",
"clpoketcg2",
"clpokethepit",
"clPokeThetaEmeraldEX",
"clpoketoomanytypes2",
"clpoketourmaline",
"clpokeultraviolet",
"clpokeunovaemerald",
"clpokevega",
"clpokevoltwhite2redux",
"clpokevoyager",
"clpokewhite",
"clpokewhite2",
"clpokewhite2alt",
"clpokeyellow",
"clPok�mon Emerald Rush Edition (20)",
"clPok�mon Trade&_Stache (V11)",
"clPok�mon TWO (v11)",
"clPok�monstunningsteel",
"clpolicepursuit2",
"clpolishedcrystal",
"clpolytrackbutnotflagged(1)",
"clpolytrackbutnotflagged",
"clpolytrackworksnow",
"clpomgetsinternet",
"clpoorbunny",
"clpopeyepapi",
"clporklike",
"clportal",
"clportal2d",
"clportaldefendersfastbreak",
"clportaldefendersTD",
"clportalflash",
"clporter",
"clportraitofruin",
"clpossessquest",
"clpostal",
"clpotatomanseeksthetroof",
"clpou(1)",
"clPou",
"clpowerslave",
"clpraxisfighterx",
"clprebronzeage",
"clprecivilationbronzeage",
"clprehistoricshark",
"clprimary",
"clprismarine",
"clprocessortycoon",
"clprofessorlaytonandthecuriousvillage",
"clpuckman",
"clpullfrog",
"clpumpkinrun",
"clpunchout",
"clpunchthedrump",
"clpunchthetrump",
"clpuppethockey",
"clpuppetmaster",
"clpushyourluck",
"clpuyopuyofever",
"clpvz",
"clpvz2",
"clpvz2gardenless",
"clPVZM",
"clpyrotoad",
"clqbert",
"clqbertarcade",
"clqtrewired",
"clquake2",
"clquake3",
"clquake64",
"clQuantumClicker",
"clquickieworld",
"clqwop",
"clracemaster3d",
"clracingarena",
"clradicalred",
"clradracer",
"clraftwars",
"clraftwars2",
"clragdoll-io",
"clragdollachivement",
"clragdollarchers",
"clragdolldrop",
"clragdollhit",
"clragdollrunners",
"clragdollsoccer",
"clragollhit",
"clrainbowsix",
"clrainbowsixalt",
"clraldiscrackhouse",
"clravenbase",
"clray1",
"clray2",
"clrayman",
"clraze",
"clraze2",
"clraze3",
"clre3",
"clreachthecore",
"clrealflightsim",
"clrebuild",
"clrebuild2",
"clrecoil",
"clredalert",
"clredball",
"clredball2",
"clredball3",
"clredball4(1)",
"clRedBall4",
"clredball4vol2",
"clredball4vol3",
"clredhanded",
"clredtierunner",
"clredvbluefix",
"clredvsblue2",
"clredvsbluewar",
"clreignofcentipede",
"clrenegades",
"clrepobad",
"clresidentevil",
"clresidentevil2",
"clresidentevil2d1",
"clresidentevil2d2",
"clresizer",
"clresortempire",
"clretrobowl",
"clretrobowlcollege",
"clretrohighway",
"clretropingpong",
"clreturnman",
"clreturnman2",
"clreturntoriddleschool",
"clrevolutionidle",
"clrewrite2",
"clrh",
"clrhythmheaven",
"clrhythymymheaven",
"clricochetkills2",
"clriddle",
"clriddlemiddleschool",
"clriddleschool",
"clriddleschool2",
"clriddleschool3",
"clriddleschool445544444$$444$444",
"clriddletransfer",
"clriddletransfer2",
"clriddleuneversityfix",
"clridgeracer",
"clrisehigher",
"clristar",
"clroadfighter",
"clroadoffury",
"clroadofthedead",
"clroadofthedead2",
"clroadrunnernes",
"clrocketgoalio",
"clrocketjump",
"clrocketknight2 (1)",
"clrocketknight2(1)",
"clrocketknight2(2)",
"clrocketknight2",
"clrocketknightadventures",
"clrocketleague",
"clrocketpult",
"clrocketsoccerderby",
"clrodha",
"clroguesoul",
"clroguesoul2",
"clrollerballer",
"clrollingsky",
"clrollyvortex",
"clrolypolymonster",
"clrooftoprun",
"clrooftopsnipers",
"clrooftopsnipers2",
"clroomclicker",
"clrosegold",
"clrotate",
"clroulettehero",
"clrouletteknight",
"clruffle",
"clrun-2",
"clrun",
"clrun2",
"clrun3",
"clrunningfred",
"clrussianbuckshot",
"clrussiancardriver",
"clrussiansandbox",
"clsaihatestation",
"clsandboxcity",
"clsandboxels",
"clsandsofthecoliseum",
"clsandstone(1)",
"clsandstone",
"clsandtris",
"clsantarun",
"clsanty",
"clsaszombieassault2",
"clsatryn",
"clsaulgoodmanrun",
"clsausageflip",
"clsayorisnotebook",
"clscalethedepths",
"clScamptonTheGreatFightRecreate",
"clscarletandviolet",
"clscarletshift",
"clscarymazegame",
"clscaryshawarma",
"clscaryteacher3d",
"clschoolboyrunaway",
"clscrapmetal3",
"clscrapyarddog",
"clscratchoptions",
"clscribblenauts",
"clscubabear",
"clsd-thewar",
"clsdf",
"clseamongrel",
"clsecretofmana",
"clsega2gg",
"clSegaSonicTheHedgehog",
"clself",
"clsentryfortress",
"clserenitrove",
"clserioussamadvance",
"clservingupmadness",
"clsevendays",
"clsfk",
"clsfk2",
"clsfklaststand",
"clsfkleague",
"clshadowcourier",
"clshadowdancer",
"clshadowdancersecret",
"clshaggy (1)",
"clshaggy",
"clshantaegb",
"clshapetransform",
"clshc1",
"clshc2",
"clshc3",
"clshift",
"clshift2",
"clshift3",
"clshiftatmidnight",
"clshinmegamitenseidevilsurvivor",
"clshinobi",
"clshinobi3",
"clshinobirevenge",
"clshoppingcarthero",
"clshortlife",
"clshotout4",
"clshredmill",
"clshredsauce",
"clshrek-2",
"clshrubnaut",
"clshwultimatem",
"clsideeffects",
"clsidepocket",
"clsierra7",
"clsilenthill",
"clsilenthillalt",
"clsilk",
"clsilkmelody",
"clsiloshowdow",
"clsilver",
"clsimcity64",
"clsimpsonsarcade",
"clSINGLEFILE",
"clsixwaystodie",
"clskateit",
"clskateordie",
"clskibididibidygyattohiorizzingallovertheplacestillwatermangotheoryfemboydrool",
"clskibidiinthebackrooms",
"clskibidishooter",
"clskinwalker",
"clskong",
"clskyrace-3d",
"clSkyRiders",
"clskywire",
"clskywire2",
"clslenderman",
"clslendytubbies",
"clsliceitall",
"clslideinthewoods",
"clslimelabratory",
"clslipways",
"clslitherio",
"clslope",
"clslope2player",
"clslope3",
"clslopeplus",
"clslotornot",
"clslowroads",
"clsm63redux",
"clsm64greenstars",
"clsm64hiddenstars",
"clSM64Land",
"clsm64lastimpact",
"clsm64liminaldream",
"clsm64oot",
"clsm64sapphire",
"clsmadvance2",
"clsmadvance3",
"clSmash Hit Ripoff",
"clsmashkarts",
"clsmashkartsworking",
"clsmashremix",
"clsmashremix201",
"clsmb12",
"clsmbc",
"clsmbcrossover",
"clsmbgameover",
"clsmbremastered",
"clsmc",
"clsmgds",
"clsnailbob",
"clsnailbob2",
"clsnailbob3",
"clsnailbob4space",
"clsnailbob5lovestory",
"clsnakeis",
"clsnakelike",
"clsnipershot",
"clsniperv2",
"clsnowballio",
"clsnowboardobby",
"clsnowbros (1)",
"clsnowbros(1)",
"clsnowbros(2)",
"clsnowbros",
"clSnowBrosGenesis",
"clsnowbrothers",
"clsnowdrift",
"clsnowrid",
"clsnowrideee",
"clsnowrider",
"clsnowridergoodygumdrops",
"clsnowriderrrr",
"clsnowroad",
"clsnowwhite",
"clsoccerbros",
"clsoccerrandom",
"clsoccerrandomgood",
"clsodasimulator",
"clsolarsandbox",
"clsolarsmash",
"clsolatrobo",
"clsolitaire",
"clsolstice",
"clsomari64",
"clSonic & Knuckles + Sonic The Hedgehog 3",
"clsonic1contemporary",
"clsonic1mobile",
"clSonic1ScoreRush",
"clSonic1TheSuperChallenges",
"clsonic2mobile",
"clsonic2pinkedition",
"clSonic2ScoreRush",
"clsonic2timeandplace",
"clsonic3andknuckles",
"clsonic3andsally",
"clsonic3complete",
"clsonic3dblast",
"clsonic3dblastdx",
"clsonicadvance",
"clsonicadvance2",
"clsonicadvance2sp",
"clsonicadvance3",
"clsonicandashuro",
"clsonicandfallingstar",
"clsonicandknuckles",
"clsonicbattle",
"clsonicblast",
"clsoniccd",
"clsoniccdmobile",
"clsonicchaos",
"clsonicclassiccollection",
"clsonicclassicheroes(1)",
"clsonicclassicheroes",
"clSonicClassics",
"clsoniccolors",
"clsonicdeltaorigins",
"clsoniceexeog",
"clsonicerazor",
"clsonicgg",
"clSonicHellfireSaga",
"clSonicInSM64",
"clSonicinSMW(1)",
"clsonicinsmw(2)",
"clSonicinSMW",
"clsonicjam",
"clsoniclabyrinth",
"clsonicmania",
"clsonicmaniaplus",
"clsonicmegamix",
"clsonicmon",
"clsonicpocketadventure",
"clsonicr",
"clsonicralt",
"clsonicrevert",
"clsonicrush",
"clsonicrushadventure",
"clsonicscorchedquest",
"clsonicspinball",
"clsonicthehedgehog",
"clsonicthehedgehog2",
"clsonicthehedgehog3",
"clsonny2",
"clsortthecourt",
"clsotn",
"clsouljumper",
"clsoundboard",
"clsouthparkn64",
"clSovereignoftheskys",
"clspacebarclicker",
"clspacecompany",
"clspaceharriersms",
"clspaceinvade95",
"clspaceinvaders",
"clspaceiskey",
"clspaceiskey2",
"clspaceiskeyxmas",
"clspacewarsbattleground",
"clspacewaves",
"clspecialmission",
"clspeedperclick",
"clspeedstars",
"clspelunky",
"clspewer",
"clspidermanps1",
"clspiralroll",
"clspiritsofhell",
"clSpongebobPowerKartGrandPrix",
"clSportsHeadsIceHockey",
"clsprinter",
"clsprunked",
"clsprunki",
"clsprunkiclicker",
"clspyhunter",
"clsquidplayground",
"clSSF2Arcade",
"clSSF2TArcade",
"clstackballio",
"clstacktris",
"clstackydash",
"clstarfox",
"clstarfox64",
"clstarraiders",
"clstateio",
"clstation141",
"clstationmeltdown",
"clstationsaturn",
"clsteakandjake",
"clstealbrainrot",
"clstealbrainrotonline",
"clstealthassassin",
"clstealthmaster",
"clsteelempire",
"clsteelsurge",
"clsteepdescent",
"clstickarchersbattle",
"clstickdefenders",
"clstickfighter",
"clstickjetchallenge",
"clstickmanandguns",
"clstickmanclash",
"clstickmanduel",
"clstickmangtacity",
"clstickmanhook",
"clStickmanKingdomclash",
"clstickmankombat2d",
"clstickmanstealingdiamond",
"clstickmerge",
"clstickminairship",
"clstickminbreakingbank",
"clstickminescapingprison",
"clstickminfleecomplex",
"clstickrpgcomplete",
"clstickslasher",
"clstickwar",
"clstickwar2",
"clstickwithit",
"clstormthehouse",
"clstormthehouse2",
"clstormthehouse3",
"clstrangejournet",
"clstreangeropepolice",
"clStreetFighter1Arcade",
"clstreetfighter2",
"clStreetFighter2Arcade",
"clStreetFighter2CEArcade",
"clStreetFighter2HFArcade(1)",
"clStreetFighter2HFArcade",
"clstreetfighter2turbo",
"clstreetfighteralpha3",
"clstreetfighterumuhsomething",
"clstreetofrage",
"clstreetofrage2",
"clstreetofrage3",
"clstrikeforceheroes",
"clstrikeforceheroes2",
"clstrikeforceheroes3",
"clstrikerdummies",
"clstylesavvy",
"clsubwaysurfersbarcelona",
"clsubwaysurfersbeijing",
"clsubwaysurfersberlin",
"clsubwaysurfersbuenosaires",
"clsubwaysurfershavana",
"clsubwaysurfershouston",
"clsubwaysurfersiceland",
"clsubwaysurferslondon",
"clsubwaysurfersmexico",
"clsubwaysurfersmiami",
"clsubwaysurfersmonaco",
"clsubwaysurfersneworeleans",
"clsubwaysurfersneworleans",
"clsubwaysurferssanfrancisco (1)",
"clsubwaysurferssanfrancisco(1)",
"clsubwaysurferssanfrancisco",
"clsubwaysurfersstpetersburg",
"clsubwaysurferswinterholiday",
"clsubwaysurferszurich",
"clsugarsugar",
"clsuika",
"clsuikapico",
"clsummerrider",
"clsunandmoon",
"clsuperbomberman",
"clsuperbomberman2",
"clsuperbomberman3",
"clsuperbomberman4",
"clsuperbomberman5",
"clsuperc",
"clsupercarrush",
"clsupercastlevaniaVI",
"clsuperchibiknight",
"clsupercold",
"clsuperdarkdeception",
"clsuperdiagonalmario2",
"clsuperdromebugs(1)",
"clsuperdromebugs",
"clsuperfallingfred",
"clsuperfighters",
"clsuperhot",
"clsuperhotlinemiami",
"clsuperhouseofdeadninjas",
"clsuperislandadventure",
"clsuperliquidsoccer",
"clsupermario",
"clsupermario3mix",
"clsupermario63",
"clsupermario64",
"clsupermario64ds",
"clsupermario74",
"clsupermarioallstars",
"clsupermariobros",
"clsupermariobros2",
"clsupermariobros2us",
"clsupermariobros3",
"clsupermariobros3real",
"clsupermariokart",
"clsupermarioland",
"clsupermarioland2",
"clsupermarioland2dx",
"clsupermariolanddx",
"clsupermariomon",
"clsupermariorpg",
"clsupermariostarroad",
"clsupermariostarroadretooled",
"clsupermariosunshine64",
"clsupermarioworld",
"clsupermarioworld2",
"clSuperMarioWorldThe SecretOfThe7GoldenStatues",
"clsupermetroid",
"clsupermonkeyballjr",
"clsupernoahsark3D",
"clsuperoliverworld",
"clsuperonionboy2",
"clsuperpickleballadventure",
"clsuperpunchout",
"clSuperPunchOutEN",
"clsuperpuzzlefighter2turbo",
"clsuperpuzzlefighter2turboalt",
"clsupersantakicker",
"clsupersantakicker2",
"clsuperscribblenauts",
"clsupersmashbros",
"clsupersmashflash",
"clsupersmashflash08",
"clsupersmashflash2",
"clsupersmashflash2butdifversion",
"clsuperstreetfighter2turbojp",
"clsupertiltbros",
"clsupitdept",
"clsupremeduelist",
"clSupremeDuelist2019",
"clsurvivalracev2",
"clsurvivorio",
"clsushicat",
"clsushicat2",
"clsushiunroll",
"clswerve",
"clswitchblade",
"clswordandshieldultimateplus",
"clswordfight",
"clswordplay",
"clswordsandsandals",
"clswordsandsandals2",
"clswordsandsouls",
"clsydneyshark",
"cltabi",
"cltabletanks",
"cltabletennisworldtour",
"cltacostand",
"cltag-",
"cltagc3",
"cltagcm",
"clTaikonoTatsujin",
"cltailofthedragon",
"cltaisei",
"cltakeover",
"cltallio",
"cltallmanrun",
"cltankmayhem",
"cltankpixel",
"cltanktrouble",
"cltanukisunset",
"cltanukisunsetuhhhhhhhh",
"cltapper",
"cltaproad",
"cltastyplanet",
"cltboidemo",
"cltboilambeternal",
"cltecmobowl",
"cltekken2ps1",
"cltekken3ps1",
"cltelephonetrouble",
"cltelocation",
"cltempest2000",
"cltempleofboom",
"cltemplerun2",
"cltempoverdose",
"clteod",
"clterra",
"clterritorialio",
"clterritorywar",
"clterritorywar2",
"clterritorywar3",
"cltetris",
"cltetrisattack",
"cltetrisgba",
"cltetrisgrandmaster2",
"clthanksforremindingmeihadtofixthis",
"cltheclassroom",
"cltheclassroom2",
"cltheclassroom3",
"clthedeadseat",
"clthedeepestsleep",
"clthedude",
"cltheenchantedcave2",
"cltheimpossiblegame",
"cltheincrediblemachine",
"clthelaststand",
"clthelaststandunioncity (1)",
"clthelaststandunioncity",
"clTheLoneRanger",
"clthemaninthewindow",
"clthemepark",
"clthepit",
"clthereisnofile",
"clthermomorph",
"clthesodorrace",
"clTheSunForTheVampire",
"cltheyarecoming",
"clthisistheonlylevel",
"clthisistheonlylevel2",
"clthisistheonlyleveltoo",
"clthreegoblets",
"clthrowapotato",
"clthrowapotatoagain",
"clthwack",
"cltiberiandawn",
"cltimeshooter2",
"cltimeshooter3",
"cltimewarriors",
"cltinyfishing",
"cltmnt",
"cltmnt2arc",
"cltmntarc",
"cltmntturtlesintime",
"cltoastarling",
"cltoasterball",
"cltoejam&earl",
"cltoejam&earlpof",
"cltombofthemass",
"cltommorowandyesterday",
"cltomodachicollection",
"cltonyhawkskater2",
"cltonyhawkskater4",
"cltonyhawksunderground",
"cltoomanytypes",
"cltopspeedracing3d",
"cltosstheturtle",
"cltotm",
"cltouhou",
"cltouhou2",
"cltouhou3",
"cltouhou4",
"cltouhou5",
"cltowerblocks",
"cltowercrash3d",
"cltowerwizard",
"cltownscraper",
"cltrace",
"cltrafficjam3d",
"cltralalerotralalaescapetungtungtungsahur",
"cltrappedwithjester",
"cltrapthecat",
"cltrechoroustrials",
"cltrechoroustrialspart2",
"cltriachnid",
"cltripleplay2000",
"cltriviacrack",
"cltrollfacequest1",
"cltrollfacequest10",
"cltrollfacequest11",
"cltrollfacequest12",
"cltrollfacequest13",
"cltrollfacequest2",
"cltrollfacequest3",
"cltrollfacequest4",
"cltrollfacequest5",
"cltrollfacequest6",
"cltrollfacequest7",
"cltrollfacequest8",
"cltrollfacequest9",
"cltrucksim",
"cltsuzukimaze",
"cltubejumpers",
"cltungtunghorror",
"cltungtungtungsahurobby",
"cltunnelrush",
"cltunnelrushbetter",
"cltupertariotros",
"clturbostars",
"clturokdinosaurhunter",
"cltwinshot (1)",
"cltwinshot(1)",
"cltwinshot",
"cltwistedmetal",
"cltwistedmetal2",
"cltwoball3d",
"clucds",
"cluckyblockobbyEUOPHRATESRIVER",
"clufoswampoddysey",
"clultima",
"clultimateassassian2",
"clultimateassassian3",
"clUltimatecardrivingsimulator",
"clultimatemortalkombat",
"clultimatemortalkombat3",
"clultrakill",
"clumjammerlammy",
"clumstickmangameidkiforgor",
"cluncannycatgolf",
"clunderneath",
"clundertalelb",
"clundertaler",
"clundertaleyellow",
"clunfairmario",
"clunfairmarioworkquestionmark",
"clunfairundyne",
"clunicyclehero",
"clunitresdreams",
"cluno",
"clunownking",
"cluntime",
"cluntitledgoosegame",
"clupgradecomplete",
"clupgradecomplete2",
"clupslash",
"clusterrush",
"clUZG",
"clvampiresurvivors",
"clvanguard",
"clvaportrails",
"clvex",
"clvex2",
"clvex3",
"clvex3xmas",
"clvex4",
"clvex5",
"clvex6",
"clvex7",
"clvex8",
"clvexchallenges",
"clvexx3m",
"clvexx3m2",
"clvillager",
"clvincentmansionofthedead",
"clvisitor",
"clvolleyrandom",
"clvollyballchallenge",
"clvortex",
"clvsagore",
"clvsnonsense",
"clVSSMB",
"clvvvvvv(1)",
"clvvvvvv",
"clwaluigitacostand",
"clwarfare1917",
"clwarfare1944",
"clwarioland1",
"clwarioland3",
"clwarioland4",
"clwariowarediy",
"clwariowareinc",
"clwartheknight",
"clwaterpoolio",
"clwaterworks",
"clwavedash",
"clwaverace64",
"clwaverun",
"clwebecomewhatwebehold",
"clwebfishing",
"clweltling",
"clwermhole",
"clwhackthetheif",
"clwhackyourboss",
"clwhackyourcomputer",
"clwhatamarioworld",
"clwheeliebike",
"clwheely",
"clwheely2",
"clwheely3",
"clwheely4",
"clwheely5",
"clwheely6",
"clwheely7",
"clwheely8",
"clwilywars",
"clwindowsdoors",
"clwinterfalling",
"clwinterolympics",
"clwipeout2097",
"clwipeout2097alt",
"clwitchcrafttd",
"clwolfchild",
"clwolfenstein",
"clwolfenstein3d",
"clwoodworm",
"clwordle",
"clworldcup98",
"clworldshardestgame",
"clworldshardestgame2",
"clworldshardestgame3",
"clworldshardestgame4",
"clwpnfire",
"clwrassling",
"clwrestlebros",
"clwwfattitude",
"clwwfsmackdown2",
"clxevent",
"clXevious",
"clxmenarcade",
"clXMenChildrenOfTheAtomArcade",
"clXMenVSStreetFighter",
"clyanderesimulator",
"clyarsrevenge",
"clyellow",
"clyohohoio",
"clYoshisStrangeQuest",
"clyouarelucky",
"clyourturntodie",
"clyouvs100skibidi",
"clyumenikki",
"clzdoom",
"clzelda2thelegendoflink",
"clZeldaIndigoch2",
"clzeldaminishcap",
"clzenword",
"clzoinkz",
"clzombieexploder",
"clzombieroad",
"clzombierush",
"clzombiesatemyneighboors",
"clzombopaclypse2",
"clzombotron",
"clzombotron2",
"clzombotronreboot",
"clzrist",
"clzuma",
"clzumashooter",
"cl�oo",
"clbaldi-3",
"clbaldi-b",
"cl100in1nes",
"cl10bullets",
"cl10yardfight",
"cl1942nes",
"claceattorneymilesedgeworth",
"cladvancewarsdualstrike",
"clalexkiddinmiracleworld",
"clangrybirds2",
"clangrybirdsslingshotfrenzy",
"clanimalcrossing",
"clanimalforestn64",
"clantipathy",
"clarcadevolley",
"classroommaxxing",
"clb3313unabandonedA2",
"clbadicecream2",
"clbadicecream3",
"clballoonfight",
"clbaseballnes",
"clbejeweledtwistds",
"clbitburner",
"clbotwds",
"clbrotato",
"clbuckbumble",
"clcactusmccoy",
"clcactusmccoy2",
"clcarnivalgamesds",
"clceleste",
"clceleste2",
"clcelestemariodx",
"clCeliasStupidROMHack",
"clchoroqwonderful",
"clclucluland",
"clcoldfront",
"clcoverorangeplayerspack3",
"clcrash2",
"clcrash3",
"clcrashbandicoot (1)",
"clcrashbash",
"clcvooc",
"cldecision3",
"clDKNESCollection",
"cldodecadragons",
"cldoomori",
"cldoubledribble",
"cldragonquest5ds",
"clducktales2",
"cldunedash",
"cldungeonsanddegenerategambler",
"cldungeonsanddegenerategamblerdebug",
"cleccothedolphin",
"clelevatoraction",
"clescalatingduel",
"clescaperoad3",
"cleugeneslife",
"clexcitebike",
"clexitpath",
"clfamidashESides1.2.8",
"clfantasyzone",
"clfinalfantasy2nes",
"clfinalfantasy3nes",
"clfivenightsatfrickbears3",
"clfloodrunner3",
"clfnfsohv2",
"clfzerox",
"clGeometryDashWave",
"clgettingoverit",
"clgrandshiftauto",
"clgyromite",
"clhangonsms",
"clheartandsoul1.2.1",
"clHelltaker",
"clhl2doom",
"clHoennsLastWish",
"clhooked",
"clhorntale",
"clhungrylamu2",
"clhungrypumpkin",
"cliceclimber",
"clihateyou",
"climpossiblequiz",
"climpossiblequiz2",
"cljojobaps1",
"cljustaplatformer",
"cljustaplatformerE",
"cljustaplatformerE2",
"clknuckleschaotix",
"clleafblower",
"cllearntofly2hacked",
"clLearnToFly3Debug",
"cllearntoflyidle",
"cllearntoflyidlehack",
"cllegionbreaker",
"clmachrider",
"clmariobrosnes",
"clMarvelVsCapcomPS1",
"clMarvelVsStreetFighter",
"clmedalofhonor",
"clmegamanx5",
"clmegamanx6",
"clmeowio",
"clmidwaysgreatesthitsn64",
"clmkmythologiesn64",
"clmktrilogyps1",
"clmrdriller",
"clmrdriller2",
"clneonrider",
"clnewersmbds",
"clnewsuperbowserworld",
"clnguidle",
"clnsmbuds",
"clnsmbwds",
"clOotMasterQuest",
"clOrangeRoulette",
"clPaperMarioDSE",
"clPaperMarioPracticeHack",
"clpinballnes",
"clPokeAmbrosia",
"clpokecrystaladvanceredux",
"clpokecrystalclear",
"clpokeemeraldextendedcut",
"clpokeemeraldimperium",
"clpokeemeraldrogue",
"clPokeEmeraldRogueEX",
"clpokefrlgplus",
"clPokeFusion3",
"clpokegoldenshield",
"clPokeHeartgoldGenerations",
"clpokelowbudgetcrystal",
"clpokemonemeraldcrest",
"clPokemonemeraldrouge",
"clpokemonperfectemerald5.5",
"clpokemonstadium2",
"clpokemoonemerald",
"clpokemoongalaxy",
"clpokepicross",
"clpokepureblue",
"clpokepuregreen",
"clpokepurered",
"clpokerowe",
"clpokescrambledscarlet",
"clpokesunsky",
"clPokeThetaEmeraldEX",
"clpoketoomanytypes2",
"clportraitofruin",
"clprankcalltungtungtungsahurclicker",
"clprestigetree",
"clprowrestling",
"clpunchthetrump",
"clquake",
"clrabbithole106",
"clradicalred",
"clreacticore",
"clroadrunnernes",
"clrunfromwitheredfox",
"clscoobydoocreepyrun",
"clscoobydoozombiehunter",
"clsimcity64",
"clSINGLEFILE",
"clskywire",
"clskywire2",
"clslalomnes",
"clslicemaster",
"clsm64greenstars",
"clSM64Land",
"clsm64lastimpact",
"clsm64liminaldream",
"clsm64sapphire",
"clsm64yscaled",
"clsmashremix2.0.1",
"clsoccernes",
"clsomari64",
"clsonic2pinkedition",
"clsonic2timeandplace",
"clsonic3andsally",
"clsoniccd",
"clsonicclassicheroes",
"clsonicdrift",
"clsonicdrift2",
"clsonicerazor",
"clsonicmegamix5.0aLEAKED",
"clsonicmushroomblast",
"clsonicscorchedquest",
"clsotn",
"clspaceharriersms",
"clspidermanps1",
"clSportsHeadsIceHockey",
"clsprunkipyramixed",
"clstarfox",
"clstarfox2",
"clstarfoxsfx2",
"clsugaryspire",
"clsupermario3mix",
"clsupermario74",
"clsupermariostarroad",
"clsupermariostarroadretooled",
"clswingforbrainrots",
"cltailsadventure",
"cltailsskypatrol",
"cltekken2ps1",
"cltekken3ps1",
"cltennisnes",
"clthemeparkpsx",
"clTheSunForTheVampire",
"cltomodachicollection",
"cltoomanytypes",
"cltreeshateyou",
"cltungtungbasics",
"clumjammerlammy",
"clunfairmarioworkquestionmark",
"clurbanchampion",
"clUvuvwevwevweOnyetenvewveUgwemubwemOssas",
"clvibribbon",
"clvolleyball",
"clwackyflip",
"clwbml",
"clwebdashers",
"clwonderboy3",
"clwonderboyarcade",
"clwreckingcrew",
"clwwfattitude",
"clwwfsmackdown2",
"clxor",
"codeorg",
"EB.Client.V1.0.0R2.WASM",
"esm",
"npm",
"skypack",
"supremeduelistfix",
"thiefpuzzle",
"unpkg",
"cl?",
"clcatmario",
"clCeliasStupidROMHack",
"clDigOutofPrison",
"cldokidokiliteratureclub",
"cldrivemad",
"clfamidash2alpha",
"clFleurdeLis",
"clgranny3",
"clgrowdenio",
"clhalloween2600",
"cllegoracers",
"clpaperio3d",
"clpokeaestheticred",
"clpokecrystaladvanceredux",
"clpokecrystallegacy",
"clpokeemeraldextendedcut",
"clpokeemeraldlegacy",
"clpokeyellowlegacy",
"clsausageflip",
"clswitch",
"clwariowaretouched"
];
/* =====================================================
   FAVOURITES
===================================================== */
function getFavs() {
  try { return JSON.parse(localStorage.getItem('gameFavs') || '[]'); } catch(e) { return []; }
}
function saveFavs(arr) {
  localStorage.setItem('gameFavs', JSON.stringify(arr));
}
function isFav(file) { return getFavs().includes(file); }
function toggleFav(file) {
  let favs = getFavs();
  if (favs.includes(file)) favs = favs.filter(f => f !== file);
  else favs.push(file);
  saveFavs(favs);
  renderFavsSection();
  updateSidebarFavBtn();
  // update any star button for this file across the page
  document.querySelectorAll(`.star-btn[data-file="${CSS.escape(file)}"]`).forEach(b => {
    b.textContent = isFav(file) ? '★' : '☆';
    b.classList.toggle('starred', isFav(file));
  });
}

function buildGameClickHandler(file) {
  return () => {
    // Prevent double-click from stacking two fetches / two loaders
    if (window._gameLoading) return;
    window._gameLoading = true;
    const name = file.includes('.') && file.lastIndexOf('.') > 0 ? file : file + '.html';
    // Launch animation overlay
    let loader = document.getElementById('game-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'game-loader';
      loader.innerHTML = `<div class="launch-icon">🎮</div><div class="loading-spinner"></div><div class="loading-text">Launching...</div>`;
      document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => loader.classList.add('visible')));
    const hide = (msg) => {
      window._gameLoading = false;
      loader.classList.remove('visible');
      setTimeout(() => {
        loader.style.display = 'none';
        if (msg) { const t = document.createElement('div'); t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(239,68,68,.9);color:#fff;padding:10px 20px;border-radius:10px;font-family:Outfit,sans-serif;font-size:13px;z-index:999999;'; t.textContent = msg; document.body.appendChild(t); setTimeout(()=>t.remove(),4000); }
      }, 350);
    };
    // 15s timeout — avoids hanging loader if CDN is slow
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 15000);
    const _srcBase = (window.GAME_BASE_URL || 'https://google-drive-hub.pages.dev').replace(/\/$/, '');
    const gameUrl = `${_srcBase}/${encodeURIComponent(name)}`;
    fetch(gameUrl, { signal: ctrl.signal })
      .then(r => { clearTimeout(tid); if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(text => {
        hide();
        const base = _srcBase + '/';
        const proxy = `https://dawn-meadow-7e02.snalebob67.workers.dev`;

        // Rewrite all cdn.jsdelivr.net references to go through our Cloudflare Worker proxy
        text = text.replace(/https?:\/\/cdn\.jsdelivr\.net/g, proxy);

        const w = window.open('about:blank', '_blank');
        if (!w) { hide('Popup was blocked — please allow popups for this site and try again.'); return; }
        if (!/<base\s/i.test(text)) {
          text = text.replace(/(<head[^>]*>)/i, `$1<base href="${base}">`);
          if (!/<head/i.test(text)) text = `<base href="${base}">` + text;
        }
        w.document.open(); w.document.write(text); w.document.close();
      })
      .catch(e => { clearTimeout(tid); hide(e.name === 'AbortError' ? 'Game took too long to load — try again.' : 'Failed to load game. Check your connection.'); });
  };
}

function renderFavsSection() {
  const container = document.getElementById('sections-container');
  let section = document.getElementById('section-FAVS');
  const favs = getFavs();

  if (!favs.length) {
    if (section) section.remove();
    return;
  }

  if (!section) {
    section = document.createElement('div');
    section.className = 'letter-section';
    section.id = 'section-FAVS';
    container.insertBefore(section, container.firstChild);
  }
  section.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'letter-header';
  header.innerHTML = '<span style="color:#facc15;text-shadow:0 0 12px rgba(250,204,21,0.5);">★</span> Favorites <span class="section-count">' + favs.length + '</span>';
  header.style.cursor = 'pointer';
  header.title = 'Click to collapse';
  const grid = document.createElement('div');
  grid.className = 'buttons-container';

  header.onclick = () => {
    const isCollapsed = grid.classList.toggle('collapsed');
    header.style.opacity = isCollapsed ? '0.5' : '1';
  };

  favs.forEach(file => {
    const btn = document.createElement('input');
    btn.type = 'button';
    btn.value = file;
    btn.onclick = buildGameClickHandler(file);
    grid.appendChild(btn);
  });

  section.appendChild(header);
  section.appendChild(grid);

  // transform new buttons into cards
  grid.querySelectorAll('input[type="button"]').forEach(btn => transformButtonToCard(btn));
}

/* =====================================================
   SECTION BUILDER
===================================================== */
function generateAllSections() {

  const allChars = ['0','1','2','3','4','5','6','7','8','9',
    'A','B','C','D','E','F','G','H','I','J','K','L','M',
    'N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

  const filesByChar = {};
  allChars.forEach(c => { filesByChar[c] = []; });

  files.forEach(file => {
    const lower = file.toLowerCase();
    if (lower.startsWith('cl')) {
      const aftercl = lower.substring(2);
      if (aftercl && aftercl.length > 0) {
        const fc = aftercl[0].toUpperCase();
        if (filesByChar[fc]) filesByChar[fc].push(file);
      }
    }
  });

  const container = document.getElementById('sections-container');

  allChars.forEach(char => {
    if (filesByChar[char].length === 0) return;

    const section = document.createElement('div');
    section.className = 'letter-section';
    section.id = `section-${char}`;

    const header = document.createElement('div');
    header.className = 'letter-header';
    header.style.cursor = 'pointer';
    header.title = 'Click to collapse';

    const countBadge = document.createElement('span');
    countBadge.className = 'section-count';
    countBadge.dataset.total = filesByChar[char].length;
    countBadge.textContent = filesByChar[char].length;

    const chevron = document.createElement('span');
    chevron.textContent = '▾';
    chevron.style.cssText = 'margin-left:auto;font-size:0.9rem;opacity:0.4;display:inline-block;transition:transform 0.25s ease;';

    header.appendChild(document.createTextNode(char + ' '));
    header.appendChild(countBadge);
    header.appendChild(chevron);

    const grid = document.createElement('div');
    grid.className = 'buttons-container';

    let collapsed = false;
    header.onclick = () => {
      collapsed = !collapsed;
      grid.classList.toggle('collapsed', collapsed);
      header.style.opacity = collapsed ? '0.5' : '1';
      chevron.style.transform = collapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
    };

    // Show skeletons as placeholders (reserve height so page doesn't jump)
    const skCount = Math.min(filesByChar[char].length, 6);
    for (let i = 0; i < skCount; i++) {
      const sk = document.createElement('div');
      sk.className = 'game-card-skeleton';
      sk.innerHTML = '<div class="skeleton-thumb"></div><div class="skeleton-lines"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>';
      grid.appendChild(sk);
    }

    section.appendChild(header);
    section.appendChild(grid);
    container.appendChild(section);

    // Lazy-render: only build real cards when the section scrolls into view
    const sectionFiles = filesByChar[char];
    let rendered = false;

    function renderCards(immediate) {
      if (rendered) return;
      rendered = true;
      const CHUNK = 30;
      let idx = 0;
      function renderChunk() {
        const end = Math.min(idx + CHUNK, sectionFiles.length);
        if (idx === 0) grid.innerHTML = ''; // clear skeletons on first chunk
        const frag = document.createDocumentFragment();
        for (; idx < end; idx++) {
          const btn = document.createElement('input');
          btn.type = 'button';
          btn.value = sectionFiles[idx];
          btn.onclick = buildGameClickHandler(sectionFiles[idx]);
          frag.appendChild(transformButtonToCard(btn));
        }
        grid.appendChild(frag);
        if (idx < sectionFiles.length) {
          if (immediate) {
            renderChunk(); // finish synchronously so search sees every card right away
          } else {
            setTimeout(renderChunk, 0);
          }
        }
      }
      renderChunk();
    }

    // Expose so filterGames can force-render if user searches an unrendered section.
    // Pass `true` to render every card synchronously (used by search) instead of
    // yielding between 30-card chunks — otherwise filterGames runs its DOM query
    // before later chunks exist and misses matches past the first 30 in a section.
    grid._lazyRender = renderCards;

    // Use IntersectionObserver with a generous rootMargin so cards appear
    // before the user actually reaches the section (feels instant)
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries, observer) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          renderCards();
        }
      }, { rootMargin: '400px 0px' });
      obs.observe(section);
    } else {
      // Fallback for browsers without IntersectionObserver
      const delay = allChars.indexOf(char) * 20;
      setTimeout(renderCards, delay);
    }
  });

  renderFavsSection();
  generateSidebar(allChars, filesByChar);
}

function updateSidebarFavBtn() {
  const existing = document.getElementById('sidebar-fav-btn');
  if (existing) {
    const count = getFavs().length;
    existing.title = count ? `Favorites (${count})` : 'No favorites yet';
    existing.style.opacity = count ? '1' : '0.35';
    existing.style.borderColor = count ? 'rgba(250,204,21,0.5)' : '';
    existing.style.color = count ? '#facc15' : '';
  }
}

function generateSidebar(allChars, filesByChar) {
  const sidebar = document.getElementById('sidebar');

  // ★ Favorites button — always first
  const favBtn = document.createElement('button');
  favBtn.className = 'sidebar-btn';
  favBtn.id = 'sidebar-fav-btn';
  favBtn.textContent = '★';
  const count = getFavs().length;
  favBtn.title = count ? `Favorites (${count})` : 'No favorites yet';
  favBtn.style.opacity = count ? '1' : '0.35';
  if (count) {
    favBtn.style.borderColor = 'rgba(250,204,21,0.5)';
    favBtn.style.color = '#facc15';
  }
  favBtn.onclick = () => {
    const section = document.getElementById('section-FAVS');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else {
      document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  sidebar.appendChild(favBtn);

  // Separator
  const sep = document.createElement('div');
  sep.style.cssText = 'width:32px;height:1px;background:rgba(56,189,248,0.15);margin:4px 0;flex-shrink:0;';
  sidebar.appendChild(sep);

  allChars.forEach(char => {
    if (filesByChar[char].length === 0) return;
    const btn = document.createElement('button');
    btn.className = 'sidebar-btn';
    btn.textContent = char;
    btn.onclick = () => {
      const section = document.getElementById(`section-${char}`);
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    sidebar.appendChild(btn);
  });
}
generateAllSections();

/* =====================================================
   ENHANCED SECURITY & ANTI-INSPECT
===================================================== */
// 1. Disable Right-Click (Context Menu)
document.addEventListener('contextmenu', (e) => e.preventDefault());
// 2. Disable Key Combinations
document.addEventListener('keydown', (e) => {
    // Check for:
    // F12 (123)
    // Ctrl+Shift+I (Inspect)
    // Ctrl+Shift+J (Console)
    // Ctrl+Shift+C (Element Selector)
    // Ctrl+U (View Source)
    // Ctrl+S (Save Page)
    if (
        e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) || 
        (e.ctrlKey && e.keyCode === 85) ||
        (e.ctrlKey && e.keyCode === 83)
    ) {
        e.preventDefault();
        return false;
    }
});
// 3. The "Debugger Trap"
// This pauses the browser execution if the DevTools are opened.
// It creates an infinite loop that triggers only when the console is active.
(function() {
    const tester = setInterval(() => {
        const start = performance.now();
        debugger; 
        const end = performance.now();
        if (end - start > 100) {
            // If the debugger took more than 100ms to clear, 
            // DevTools are likely open.
            console.clear();
            // Dev tools message blocked by security.js
        }
    }, 1000);
})();
// ==============================
// SEARCH + UI LOGIC
// ==============================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput'); 
    const clearBtn    = document.getElementById('search-clear');
    const noResults   = document.getElementById('no-results');
    const noTerm      = document.getElementById('no-results-term');
    const searchWrap  = document.getElementById('search-wrap');
    const searchArea  = document.querySelector('.search-area');

    if (!searchInput) return;

    // ── Create Google-style dropdown ──
    const dropdown = document.createElement('div');
    dropdown.id = 'search-dropdown';
    document.body.appendChild(dropdown);

    function positionDropdown() {
        if (!searchWrap) return;
        const rect = searchWrap.getBoundingClientRect();
        dropdown.style.top  = (rect.bottom + 6) + 'px';
        dropdown.style.left = rect.left + 'px';
        dropdown.style.width = rect.width + 'px';
        dropdown.style.transform = 'none';
    }
    searchInput.addEventListener('focus', positionDropdown);
    window.addEventListener('resize', () => { if (dropdown.classList.contains('visible')) positionDropdown(); });

    // Hide dropdown when the user scrolls (search bar moves away)
    const _mainScroller = document.querySelector('.main-content');
    if (_mainScroller) {
        _mainScroller.addEventListener('scroll', () => {
            if (dropdown.classList.contains('visible')) {
                const rect = searchWrap ? searchWrap.getBoundingClientRect() : null;
                if (!rect || rect.bottom < 60) {
                    hideDropdown();
                } else {
                    positionDropdown();
                }
            }
        }, { passive: true });
    }

    // Focus styling
    searchInput.addEventListener('focus', () => {
        if (searchWrap) searchWrap.style.borderColor = 'rgba(var(--accent-rgb), 0.8)';
        const q = searchInput.value.trim();
        if (q.length >= 1) showDropdown(q.toLowerCase());
    });

    searchInput.addEventListener('blur', () => {
        if (searchWrap) searchWrap.style.borderColor = 'rgba(var(--accent-rgb), 0.3)';
        setTimeout(() => hideDropdown(), 180);
    });

    // ── Keyboard navigation in dropdown ──
    let highlightIdx = -1;

    searchInput.addEventListener('keydown', e => {
        const items = dropdown.querySelectorAll('.search-drop-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightIdx = Math.min(highlightIdx + 1, items.length - 1);
            updateHighlight(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightIdx = Math.max(highlightIdx - 1, -1);
            updateHighlight(items);
        } else if (e.key === 'Enter') {
            if (highlightIdx >= 0 && items[highlightIdx]) {
                items[highlightIdx]._openGame && items[highlightIdx]._openGame();
            } else if (items.length > 0 && items[0]._openGame && dropdown.classList.contains('visible')) {
                items[0]._openGame();
            }
        } else if (e.key === 'Escape') {
            hideDropdown();
        }
    });

    function updateHighlight(items) {
        items.forEach((item, i) => item.classList.toggle('highlighted', i === highlightIdx));
        if (highlightIdx >= 0 && items[highlightIdx]) {
            items[highlightIdx].scrollIntoView({ block: 'nearest' });
        }
    }

    // Input handling — debounced
    let _searchDebounce = null;
    searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        clearBtn.style.display = q ? 'block' : 'none';
        highlightIdx = -1;
        clearTimeout(_searchDebounce);
        if (!q) {
            hideDropdown();
            filterGames('');
            return;
        }
        _searchDebounce = setTimeout(() => {
            showDropdown(q);
            filterGames(q);
        }, 80);
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        searchInput.focus();
        hideDropdown();
        filterGames('');
    });

    // Ctrl+F shortcut override
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });

    function _thumbHashLocal(name) {
        let h = 0;
        for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
        return h;
    }

    function showDropdown(q) {
        if (!q) { hideDropdown(); return; }
        // Search the full files array (covers unrendered lazy sections too)
        const matches = [];
        const seenFiles = new Set();
        for (const file of files) {
            const display = formatName(file);
            const name = display.toLowerCase();
            if (name.includes(q) && !seenFiles.has(file)) {
                seenFiles.add(file);
                const card = document.querySelector(`.game-card[data-file="${CSS.escape(file)}"]`);
                matches.push({ display, file, card });
                if (matches.length >= 20) break;
            }
        }
        if (!matches.length) { hideDropdown(); return; }

        dropdown.innerHTML = '';
        matches.forEach(({ display, file, card }, idx) => {
            const item = document.createElement('div');
            item.className = 'search-drop-item';

            const thumb = document.createElement('div');
            thumb.className = 'search-drop-thumb';
            const letter = (display.replace(/^cl/i, '')[0] || '?').toUpperCase();
            const hash = _thumbHashLocal(display);
            const bgOp = (0.22 + (hash % 9) * 0.018).toFixed(3);
            thumb.style.background = `rgba(var(--accent-rgb),${bgOp})`;
            thumb.textContent = letter;

            const nameEl = document.createElement('div');
            nameEl.className = 'search-drop-name';
            // Highlight matching portion
            const lowerDisplay = display.toLowerCase();
            const qi = lowerDisplay.indexOf(q);
            if (qi >= 0) {
                nameEl.innerHTML =
                    escHtml(display.slice(0, qi)) +
                    '<mark>' + escHtml(display.slice(qi, qi + q.length)) + '</mark>' +
                    escHtml(display.slice(qi + q.length));
            } else {
                nameEl.textContent = display;
            }

            // Add favorite star
            const star = document.createElement('div');
            star.className = 'favorite-star';
            star.textContent = isFav(file) ? '★' : '☆';
            if (isFav(file)) star.classList.add('favorited');
            
            star.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFav(file);
                star.textContent = isFav(file) ? '★' : '☆';
                star.classList.toggle('favorited', isFav(file));
                updateSidebarFavBtn();
            });

            item.appendChild(thumb);
            item.appendChild(nameEl);
            item.appendChild(star);

            function openGame() {
                hideDropdown();
                searchInput.value = '';
                clearBtn.style.display = 'none';
                filterGames('');
                const liveCard = document.querySelector(`.game-card[data-file="${CSS.escape(file)}"]`);
                if (liveCard && typeof liveCard.onclick === 'function') liveCard.onclick();
                else if (liveCard) liveCard.click();
                else buildGameClickHandler(file)();
            }

            item._openGame = openGame;

            item.addEventListener('mousedown', (e) => {
                if (e.target === star) return;
                e.preventDefault();
                openGame();
            });

            dropdown.appendChild(item);
        });

        if (matches.length >= 20) {
            const countEl = document.createElement('div');
            countEl.className = 'search-drop-count';
            const realTotal = files.filter(f => formatName(f).toLowerCase().includes(q)).length;
            countEl.textContent = `Showing 20 of ${realTotal} matches — keep typing to narrow down`;
            dropdown.appendChild(countEl);
        }

        dropdown.classList.add('visible');
        positionDropdown();
    }

    function hideDropdown() {
        dropdown.classList.remove('visible');
        highlightIdx = -1;
    }

    function escHtml(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function filterGames(q) {
        // If searching, force-render any sections still showing skeletons
        if (q) {
            document.querySelectorAll('.letter-section').forEach(section => {
                if (section.querySelector('.game-card-skeleton')) {
                    const grid = section.querySelector('.buttons-container');
                    if (grid && grid._lazyRender) grid._lazyRender(true);
                }
            });
        }

        const sections = document.querySelectorAll('.letter-section');
        let totalVisible = 0;

        sections.forEach(section => {
            const items = section.querySelectorAll('.game-card, input[type="button"]');
            let sectionVisible = 0;

            items.forEach(item => {
                const name = (item.querySelector('.game-card-name')?.textContent || item.value || '').toLowerCase();
                const match = !q || name.includes(q);

                item.style.display = match ? '' : 'none';
                if (match) sectionVisible++;
            });

            section.style.display = sectionVisible === 0 ? 'none' : '';
            totalVisible += sectionVisible;

            // Update count badge: show "X / total" when searching, just total when not
            const badge = section.querySelector('.section-count');
            if (badge) {
                const total = parseInt(badge.dataset.total || items.length, 10);
                if (!badge.dataset.total) badge.dataset.total = items.length; // store on first run
                badge.textContent = q ? `${sectionVisible} / ${total}` : total;
            }
        });

        if (noResults) {
            noResults.style.display = (q && totalVisible === 0) ? 'block' : 'none';
            if (noTerm) noTerm.textContent = q;
        }
    }

    // LOADING PROGRESS BAR
    const bar = document.getElementById('progress-bar');
    if (bar) {
        let progress = 0;
        bar.style.width = '0%';
        bar.style.opacity = '1';
        const interval = setInterval(() => {
            progress += Math.random() * 12;
            if (progress >= 90) { progress = 90; clearInterval(interval); }
            bar.style.width = progress + '%';
        }, 150);
        window.addEventListener('load', () => {
            clearInterval(interval);
            bar.style.width = '100%';
            setTimeout(() => {
                bar.style.opacity = '0';
                setTimeout(() => { bar.style.display = 'none'; }, 400);
            }, 800);
        });
    }

    // ── Build Burger Button (sidebar toggle) ──
    (function() {
        const BURGER_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
        const CLOSE_ICON  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg>`;

        const burgerBtn = document.createElement('button');
        burgerBtn.id = 'burger-btn';
        burgerBtn.title = 'Toggle sidebar';
        burgerBtn.innerHTML = BURGER_ICON;
        document.body.appendChild(burgerBtn);
        burgerBtn.style.cssText = 'position:fixed;top:14px;left:13px;z-index:10001;width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(8,15,30,0.94);border:1px solid rgba(56,189,248,0.25);color:rgba(56,189,248,0.8);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 4px 16px rgba(0,0,0,0.4);';

        const sidebar = document.getElementById('sidebar');
        const STORAGE_KEY = 'sidebar_collapsed';

        function setSidebar(collapsed) {
            if (collapsed) {
                sidebar.classList.add('collapsed');
                burgerBtn.classList.add('open');
                burgerBtn.innerHTML = CLOSE_ICON;
            } else {
                sidebar.classList.remove('collapsed');
                burgerBtn.classList.remove('open');
                burgerBtn.innerHTML = BURGER_ICON;
            }
            try { localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0'); } catch(e) {}
        }

        try {
            if (localStorage.getItem(STORAGE_KEY) === '1') setSidebar(true);
            else setSidebar(false);
        } catch(e) { setSidebar(false); }

        burgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setSidebar(!sidebar.classList.contains('collapsed'));
        });
    })();

    // ── Build Gear Settings Panel ──
    buildGearPanel();
});

function buildGearPanel() {
    const gearBtn = document.createElement('button');
    gearBtn.id = 'settings-btn';
    gearBtn.title = 'Settings';
    gearBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>`;
    document.body.appendChild(gearBtn);

    const panel = document.createElement('div');
    panel.id = 'settings-panel';

    const username = sessionStorage.getItem('clocker_user') || 'Personal';
    const gameSource = (window.GAME_BASE_URL || '').includes('cdn.jsdelivr') ? '\u{1F4E6} CDN' : '\u{1F310} Hub';

    const spiderOn   = localStorage.getItem('setting_spiderweb') !== 'off';
    const compactOn  = localStorage.getItem('setting_compact') === 'on';
    const clock24On  = localStorage.getItem('setting_clock24') === 'on';
    const favsOn     = localStorage.getItem('setting_favs') !== 'off';
    const savedCols  = localStorage.getItem('setting_cols') || 'auto';
    const savedFont  = localStorage.getItem('setting_font') || 'medium';
    const savedTab   = localStorage.getItem('setting_active_tab') || 'display';

    // Load saved spiderweb tuning
    const swSpeed = parseFloat(localStorage.getItem('setting_sw_speed') || '1.0');
    const swNodes = parseInt(localStorage.getItem('setting_sw_nodes')   || '90',  10);
    const swDist  = parseInt(localStorage.getItem('setting_sw_dist')    || '130', 10);

    if (!spiderOn) { const c = document.getElementById('spiderweb'); if(c) c.style.display='none'; }
    if (compactOn) document.body.classList.add('compact-mode');
    applyFontSize(savedFont);
    applyColumns(savedCols);
    if (!favsOn) document.body.classList.add('hide-favs');
    if (clock24On) document.body.classList.add('clock-24h');
    window._sw_speed = swSpeed;
    window._sw_nodes = swNodes;
    window._sw_dist  = swDist;

    // Inject tabbed panel styles
    const tabStyle = document.createElement('style');
    tabStyle.textContent = `
    #settings-panel { width: 260px !important; padding: 0 !important; }
    .sp-header { display:flex; align-items:center; gap:8px; padding:10px 12px 0; }
    .sp-user { display:flex; align-items:center; gap:6px; flex:1; min-width:0; }
    .sp-user span { font-size:11px; color:rgba(255,255,255,.7); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:Outfit,sans-serif; }
    .sp-src { font-size:10px; color:rgba(var(--accent-rgb),.7); font-family:Outfit,sans-serif; white-space:nowrap; }
    .sp-tabs { display:flex; gap:2px; padding:8px 8px 0; }
    .sp-tab { flex:1; padding:5px 2px; background:rgba(var(--accent-rgb),.05); border:1px solid rgba(var(--accent-rgb),.12); border-bottom:none; border-radius:6px 6px 0 0; color:rgba(255,255,255,.4); font-size:10px; font-family:Outfit,sans-serif; cursor:pointer; text-align:center; transition:all .15s; letter-spacing:.3px; }
    .sp-tab:hover { color:rgba(255,255,255,.7); background:rgba(var(--accent-rgb),.1); }
    .sp-tab.active { background:rgba(var(--accent-rgb),.18); border-color:rgba(var(--accent-rgb),.3); color:rgba(var(--accent-rgb),1); }
    .sp-body { padding:10px; border-top:1px solid rgba(var(--accent-rgb),.18); }
    .sp-pane { display:none; }
    .sp-pane.active { display:block; }
    .sp-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:7px; }
    .sp-row-label { font-size:11px; color:rgba(255,255,255,.65); font-family:Outfit,sans-serif; }
    .sp-mini-group { display:flex; gap:4px; margin-top:6px; }
    .sp-mini-btn { flex:1; padding:4px 2px; border-radius:6px; border:1px solid rgba(var(--accent-rgb),.2); background:rgba(var(--accent-rgb),.06); color:rgba(255,255,255,.5); font-size:11px; cursor:pointer; font-family:Outfit,sans-serif; transition:all .15s; text-align:center; }
    .sp-mini-btn.active, .sp-mini-btn:hover { background:rgba(var(--accent-rgb),.25); color:rgba(255,255,255,.95); border-color:rgba(var(--accent-rgb),.45); }
    .sp-divider { height:1px; background:rgba(var(--accent-rgb),.1); margin:8px 0; }
    .sw-slider-row { margin-bottom:9px; }
    .sw-slider-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:3px; }
    .sw-slider-lbl { font-size:10px; color:rgba(255,255,255,.55); font-family:Outfit,sans-serif; text-transform:uppercase; letter-spacing:.4px; }
    .sw-slider-val { font-size:10px; color:rgba(var(--accent-rgb),.9); font-family:Outfit,sans-serif; min-width:28px; text-align:right; }
    .sw-range { -webkit-appearance:none; appearance:none; width:100%; height:3px; border-radius:2px; background:rgba(var(--accent-rgb),.15); outline:none; cursor:pointer; }
    .sw-range::-webkit-slider-thumb { -webkit-appearance:none; width:12px; height:12px; border-radius:50%; background:rgba(var(--accent-rgb),1); border:none; cursor:pointer; }
    .sw-range::-moz-range-thumb { width:12px; height:12px; border-radius:50%; background:rgba(var(--accent-rgb),1); border:none; cursor:pointer; }
    .sw-reset { width:100%; margin-top:8px; padding:5px; border-radius:6px; border:1px solid rgba(var(--accent-rgb),.2); background:rgba(var(--accent-rgb),.06); color:rgba(255,255,255,.45); font-size:10px; font-family:Outfit,sans-serif; cursor:pointer; transition:all .15s; letter-spacing:.3px; }
    .sw-reset:hover { background:rgba(var(--accent-rgb),.15); color:rgba(255,255,255,.8); }
    `;
    document.head.appendChild(tabStyle);

    panel.innerHTML = `
        <div class="sp-header">
            <div class="sp-user">
                <span style="font-size:14px;">&#x1F464;</span>
                <span id="gear-username">${username}</span>
            </div>
            <div class="sp-src" id="gear-source">${gameSource}</div>
        </div>
        <div class="sp-tabs">
            <button class="sp-tab${savedTab==='display'?' active':''}" data-tab="display">Display</button>
            <button class="sp-tab${savedTab==='layout'?' active':''}" data-tab="layout">Layout</button>
            <button class="sp-tab${savedTab==='theme'?' active':''}" data-tab="theme">Theme</button>
            <button class="sp-tab${savedTab==='web'?' active':''}" data-tab="web">Web</button>
        </div>
        <div class="sp-body">

            <!-- DISPLAY TAB -->
            <div class="sp-pane${savedTab==='display'?' active':''}" data-pane="display">
                <div class="sp-row">
                    <span class="sp-row-label">&#x2728; Spiderweb</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="toggle-spiderweb" ${spiderOn ? 'checked' : ''}>
                        <span class="toggle-track"></span>
                    </label>
                </div>
                <div class="sp-row">
                    <span class="sp-row-label">&#x26A1; Compact mode</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="toggle-compact" ${compactOn ? 'checked' : ''}>
                        <span class="toggle-track"></span>
                    </label>
                </div>
                <div class="sp-row">
                    <span class="sp-row-label">&#x2B50; Favorites section</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="toggle-favs" ${favsOn ? 'checked' : ''}>
                        <span class="toggle-track"></span>
                    </label>
                </div>
                <div class="sp-row">
                    <span class="sp-row-label">&#x1F550; 24-hour clock</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="toggle-clock24" ${clock24On ? 'checked' : ''}>
                        <span class="toggle-track"></span>
                    </label>
                </div>
            </div>

            <!-- LAYOUT TAB -->
            <div class="sp-pane${savedTab==='layout'?' active':''}" data-pane="layout">
                <div class="sp-row-label" style="margin-bottom:5px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;opacity:.5;">Card Columns</div>
                <div class="sp-mini-group">
                    ${['auto','2','3','4','5'].map(v => `
                    <button class="sp-mini-btn col-btn${savedCols===v?' active':''}" data-cols="${v}">${v==='auto'?'A':v}</button>`).join('')}
                </div>
                <div class="sp-divider"></div>
                <div class="sp-row-label" style="margin-bottom:5px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;opacity:.5;">Text Size</div>
                <div class="sp-mini-group">
                    ${[['small','S'],['medium','M'],['large','L']].map(([v,l]) => `
                    <button class="sp-mini-btn font-btn${savedFont===v?' active':''}" data-font="${v}">${l}</button>`).join('')}
                </div>
            </div>

            <!-- THEME TAB -->
            <div class="sp-pane${savedTab==='theme'?' active':''}" data-pane="theme">
                <div id="theme-switcher-wrap"></div>
            </div>

            <!-- WEB TAB -->
            <div class="sp-pane${savedTab==='web'?' active':''}" data-pane="web">
                <div class="sw-slider-row">
                    <div class="sw-slider-top">
                        <span class="sw-slider-lbl">⚡ Speed</span>
                        <span class="sw-slider-val" id="sw-speed-val">${swSpeed.toFixed(1)}x</span>
                    </div>
                    <input type="range" class="sw-range" id="sw-speed" min="0.1" max="3" step="0.1" value="${swSpeed}">
                </div>
                <div class="sw-slider-row">
                    <div class="sw-slider-top">
                        <span class="sw-slider-lbl">🔵 Nodes</span>
                        <span class="sw-slider-val" id="sw-nodes-val">${swNodes}</span>
                    </div>
                    <input type="range" class="sw-range" id="sw-nodes" min="20" max="200" step="5" value="${swNodes}">
                </div>
                <div class="sw-slider-row">
                    <div class="sw-slider-top">
                        <span class="sw-slider-lbl">🕸 Connect</span>
                        <span class="sw-slider-val" id="sw-dist-val">${swDist}px</span>
                    </div>
                    <input type="range" class="sw-range" id="sw-dist" min="60" max="300" step="10" value="${swDist}">
                </div>
                <button class="sw-reset" id="sw-reset">Reset defaults</button>
            </div>

        </div>
    `;
    document.body.appendChild(panel);

    if (typeof buildThemeButtons === 'function') {
        buildThemeButtons(panel.querySelector('#theme-switcher-wrap'));
    }

    // Spiderweb live controls
    (function() {
        function wire() {
            var speedEl = panel.querySelector('#sw-speed');
            var nodesEl = panel.querySelector('#sw-nodes');
            var distEl  = panel.querySelector('#sw-dist');
            if (!speedEl) return;

            speedEl.addEventListener('input', function() {
                var v = parseFloat(this.value);
                window._sw_speed = v;
                localStorage.setItem('setting_sw_speed', v);
                panel.querySelector('#sw-speed-val').textContent = v.toFixed(1) + 'x';
            });
            nodesEl.addEventListener('input', function() {
                var v = parseInt(this.value, 10);
                window._sw_nodes = v;
                localStorage.setItem('setting_sw_nodes', v);
                panel.querySelector('#sw-nodes-val').textContent = v;
                if (typeof window._sw_rebuild === 'function') window._sw_rebuild();
            });
            distEl.addEventListener('input', function() {
                var v = parseInt(this.value, 10);
                window._sw_dist = v;
                localStorage.setItem('setting_sw_dist', v);
                panel.querySelector('#sw-dist-val').textContent = v + 'px';
            });
            panel.querySelector('#sw-reset').addEventListener('click', function() {
                window._sw_speed = 1.0; window._sw_nodes = 90; window._sw_dist = 130;
                localStorage.removeItem('setting_sw_speed');
                localStorage.removeItem('setting_sw_nodes');
                localStorage.removeItem('setting_sw_dist');
                speedEl.value = 1.0; nodesEl.value = 90; distEl.value = 130;
                panel.querySelector('#sw-speed-val').textContent = '1.0x';
                panel.querySelector('#sw-nodes-val').textContent = '90';
                panel.querySelector('#sw-dist-val').textContent  = '130px';
                if (typeof window._sw_rebuild === 'function') window._sw_rebuild();
            });
        }
        wire();
    })();

    // Tab switching
    panel.querySelectorAll('.sp-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const t = this.dataset.tab;
            localStorage.setItem('setting_active_tab', t);
            panel.querySelectorAll('.sp-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
            panel.querySelectorAll('.sp-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === t));
        });
    });

    panel.querySelector('#toggle-spiderweb').addEventListener('change', function() {
        const canvas = document.getElementById('spiderweb');
        if (this.checked) { localStorage.setItem('setting_spiderweb', 'on'); if (canvas) canvas.style.display = ''; }
        else { localStorage.setItem('setting_spiderweb', 'off'); if (canvas) canvas.style.display = 'none'; }
    });
    panel.querySelector('#toggle-compact').addEventListener('change', function() {
        if (this.checked) { localStorage.setItem('setting_compact', 'on'); document.body.classList.add('compact-mode'); }
        else { localStorage.setItem('setting_compact', 'off'); document.body.classList.remove('compact-mode'); }
    });
    panel.querySelector('#toggle-favs').addEventListener('change', function() {
        if (this.checked) { localStorage.setItem('setting_favs', 'on'); document.body.classList.remove('hide-favs'); }
        else { localStorage.setItem('setting_favs', 'off'); document.body.classList.add('hide-favs'); }
    });
    panel.querySelector('#toggle-clock24').addEventListener('change', function() {
        if (this.checked) { localStorage.setItem('setting_clock24', 'on'); document.body.classList.add('clock-24h'); }
        else { localStorage.setItem('setting_clock24', 'off'); document.body.classList.remove('clock-24h'); }
    });
    panel.querySelectorAll('.col-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const v = this.dataset.cols;
            localStorage.setItem('setting_cols', v);
            applyColumns(v);
            panel.querySelectorAll('.col-btn').forEach(b => b.classList.toggle('active', b.dataset.cols === v));
        });
    });
    panel.querySelectorAll('.font-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const v = this.dataset.font;
            localStorage.setItem('setting_font', v);
            applyFontSize(v);
            panel.querySelectorAll('.font-btn').forEach(b => b.classList.toggle('active', b.dataset.font === v));
        });
    });

    let sourceCheckCount = 0;
    const sourceInterval = setInterval(() => {
        sourceCheckCount++;
        const src = (window.GAME_BASE_URL || '').includes('cdn.jsdelivr') ? '\u{1F4E6} CDN' : '\u{1F310} Hub';
        const el = document.getElementById('gear-source');
        if (el) el.textContent = src;
        if (sourceCheckCount >= 10) clearInterval(sourceInterval);
    }, 600);

    let open = false;
    gearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        open = !open;
        gearBtn.classList.toggle('open', open);
        panel.classList.toggle('open', open);
    });
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && e.target !== gearBtn) {
            open = false;
            gearBtn.classList.remove('open');
            panel.classList.remove('open');
        }
    });
}

/* Apply card column count to all game grids */
function applyColumns(v) {
    const style = document.getElementById('setting-cols-style') || (() => {
        const s = document.createElement('style');
        s.id = 'setting-cols-style';
        document.head.appendChild(s);
        return s;
    })();
    style.textContent = v === 'auto' ? '' : `.buttons-container { grid-template-columns: repeat(${v}, 1fr) !important; }`;
}

/* Apply font size to game card names */
function applyFontSize(v) {
    const style = document.getElementById('setting-font-style') || (() => {
        const s = document.createElement('style');
        s.id = 'setting-font-style';
        document.head.appendChild(s);
        return s;
    })();
    const sizes = { small: '0.72rem', medium: '0.82rem', large: '0.96rem' };
    style.textContent = `.game-card-name { font-size: ${sizes[v] || sizes.medium} !important; }`;
}


/* =====================================================
   SPIDERWEB BACKGROUND — loaded from spiderweb.js
   (clocker.html loads spiderweb.js before games.js)
===================================================== */

/* =====================================================
   CLOCK
===================================================== */
function updateClock(){
    const now=new Date();
    const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const rawHours=now.getHours();
    const mins=String(now.getMinutes()).padStart(2,'0');
    const secs=String(now.getSeconds()).padStart(2,'0');
    const is24=document.body.classList.contains('clock-24h');
    const ampm=rawHours>=12?'PM':'AM';
    const hours=is24?String(rawHours).padStart(2,'0'):String(rawHours%12||12);
    const el=document.getElementById('clock');
    if(el) el.innerHTML=`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()} ${now.getFullYear()}&nbsp;&nbsp;•&nbsp;&nbsp;${hours}:${mins}:${secs} <span class="clock-ampm">${ampm}</span>`;
}
updateClock();
setInterval(updateClock,1000);




/* =====================================================
   THEME SWITCHER — no-lag CSS-variable approach + richer palette
===================================================== */
(function(){
    /* ── Palette ── richer, more distinct colours ── */
    const themes = {
        blue:   { hex:'#38bdf8', rgb:'56,189,248',   bg:'#020b18,#0a1628,#061222', card:'8,18,40' },
        cyan:   { hex:'#06d6c7', rgb:'6,214,199',    bg:'#011a19,#082220,#051f1d', card:'5,28,26' },
        green:  { hex:'#4ade80', rgb:'74,222,128',   bg:'#021408,#081f0e,#05190a', card:'6,24,10' },
        lime:   { hex:'#a3e635', rgb:'163,230,53',   bg:'#0d1a02,#121f03,#0f1c02', card:'14,22,3' },
        purple: { hex:'#c084fc', rgb:'192,132,252',  bg:'#0e0320,#160529,#120420', card:'18,5,36' },
        pink:   { hex:'#f472b6', rgb:'244,114,182',  bg:'#1a0212,#220318,#1c0214', card:'28,4,20' },
        red:    { hex:'#f87171', rgb:'248,113,113',  bg:'#1a0505,#200606,#1c0505', card:'30,6,6' },
        orange: { hex:'#fb923c', rgb:'251,146,60',   bg:'#190a02,#221003,#1c0e03', card:'28,14,4' },
        gold:   { hex:'#fbbf24', rgb:'251,191,36',   bg:'#191200,#221900,#1c1500', card:'26,20,2' },
        grey:   { hex:'#94a3b8', rgb:'148,163,184',  bg:'#111111,#1a1a1a,#151515', card:'20,20,22' },
    };

    /* ── One-time static <style> block — all rules use CSS vars only ── */
    /* This never gets rewritten on theme change; only CSS vars update  */
    const staticStyle = document.createElement('style');
    staticStyle.id = 'theme-static';
    staticStyle.textContent = `
        body { background: var(--theme-bg) !important; }
        .game-card { background: var(--card-bg) !important; }
        .letter-header { color: var(--accent-blue) !important; border-bottom-color: rgba(var(--accent-rgb),.2) !important; }
        .letter-header::before { background: linear-gradient(to bottom,var(--accent-blue),rgba(var(--accent-rgb),.2)) !important; }
        #clock { color: rgba(var(--accent-rgb),.6) !important; }
        h1 { background: linear-gradient(135deg,#f9fafb,var(--accent-blue),rgba(var(--accent-rgb),.6)) !important; -webkit-background-clip:text !important; background-clip:text !important; }
        .sidebar { border-right-color: rgba(var(--accent-rgb),.15) !important; }
        .sidebar::before { background: linear-gradient(90deg,transparent,rgba(var(--accent-rgb),.4),transparent) !important; }
        .sidebar-btn { color: rgba(var(--accent-rgb),.55) !important; border-color: rgba(var(--accent-rgb),.12) !important; background: rgba(var(--accent-rgb),.04) !important; }
        .sidebar-btn:hover { border-color: rgba(var(--accent-rgb),.65) !important; color: var(--accent-blue) !important; background: rgba(var(--accent-rgb),.12) !important; box-shadow: 0 0 0 1px rgba(var(--accent-rgb),.2),0 4px 16px rgba(var(--accent-rgb),.15) !important; }
        .game-card { border-color: rgba(var(--accent-rgb),.12) !important; }
        .game-card:hover { border-color: rgba(var(--accent-rgb),.6) !important; box-shadow: 0 8px 24px rgba(0,0,0,.4),0 0 0 1px rgba(var(--accent-rgb),.18),0 0 24px rgba(var(--accent-rgb),.1) !important; }
        .game-card::before { background: linear-gradient(90deg,transparent,rgba(var(--accent-rgb),.45),transparent) !important; }
        .game-card::after { background: radial-gradient(ellipse at 30% 50%,rgba(var(--accent-rgb),.1) 0%,transparent 65%) !important; }
        .game-card-thumb { border-color: rgba(var(--accent-rgb),.15) !important; background: rgba(var(--accent-rgb),.08) !important; }
        .game-card:hover .game-card-thumb { border-color: rgba(var(--accent-rgb),.4) !important; }
        #back-to-top { border-color: rgba(var(--accent-rgb),.3) !important; color: var(--accent-blue) !important; }
        #back-to-top:hover { border-color: rgba(var(--accent-rgb),.65) !important; box-shadow: 0 8px 24px rgba(0,0,0,.5),0 0 16px rgba(var(--accent-rgb),.2) !important; }
        #back-to-top::before { background: radial-gradient(circle at center bottom,rgba(var(--accent-rgb),.15) 0%,transparent 70%) !important; }
        #progress-bar { background: linear-gradient(90deg,var(--accent-blue),rgba(var(--accent-rgb),.5)) !important; box-shadow: 0 0 8px rgba(var(--accent-rgb),.6) !important; }
        #settings-btn { border-color: rgba(var(--accent-rgb),.25) !important; color: rgba(var(--accent-rgb),.8) !important; }
        #burger-btn { position:fixed; top:14px; left:13px; z-index:10001; width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; cursor:pointer; background:var(--sidebar-bg); border:1px solid rgba(var(--accent-rgb),.25); color:rgba(var(--accent-rgb),.8); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); box-shadow:0 4px 16px rgba(0,0,0,.4); transition:border-color .2s ease, color .2s ease, box-shadow .2s ease; }
        #burger-btn:hover { border-color: rgba(var(--accent-rgb),.65) !important; color: var(--accent-blue) !important; box-shadow: 0 4px 20px rgba(var(--accent-rgb),.2) !important; }
        .sidebar { transition: width .25s ease, padding .25s ease; }
        .sidebar.collapsed { width:0 !important; padding-left:0 !important; padding-right:0 !important; border-right-color:transparent !important; overflow:hidden; }
        .sidebar { padding-top:66px !important; }
        #settings-panel { border-color: rgba(var(--accent-rgb),.2) !important; }
        #search-dropdown { border-color: rgba(var(--accent-rgb),.25) !important; }
        .search-wrap { border-color: rgba(var(--accent-rgb),.25) !important; }
        .search-wrap:focus-within { border-color: rgba(var(--accent-rgb),.6) !important; box-shadow: 0 0 0 3px rgba(var(--accent-rgb),.08) !important; }
        .quick-tags code { background: rgba(var(--accent-rgb),.1) !important; color: rgba(var(--accent-rgb),.85) !important; border-color: rgba(var(--accent-rgb),.15) !important; }
        .quick-tags code:hover { background: rgba(var(--accent-rgb),.22) !important; }
        .info-card { border-color: rgba(var(--accent-rgb),.12) !important; }
        .info-card:hover { border-color: rgba(var(--accent-rgb),.3) !important; }
        ::-webkit-scrollbar-thumb { background-color: rgba(var(--accent-rgb),.35) !important; }
        .section-count { color: rgba(var(--accent-rgb),.45) !important; }
        .skeleton-thumb,.skeleton-line { background: rgba(var(--accent-rgb),.09) !important; }
        .game-card-skeleton { border-color: rgba(var(--accent-rgb),.07) !important; }
        .game-card-skeleton::after { background: linear-gradient(90deg,transparent,rgba(var(--accent-rgb),.07),transparent) !important; }
        .search-drop-thumb { background: rgba(var(--accent-rgb),.1) !important; border-color: rgba(var(--accent-rgb),.15) !important; color: rgba(var(--accent-rgb),.7) !important; }
        .search-drop-item:hover,.search-drop-item.highlighted { background: rgba(var(--accent-rgb),.1) !important; }
        .search-drop-name mark { color: var(--accent-blue) !important; }
        body.hide-favs #section-FAVS { display: none !important; }
        body.clock-24h .clock-ampm { display: none !important; }
    `;
    document.head.appendChild(staticStyle);

    // Thumbnail regen removed — CSS-based thumbs update instantly with CSS vars

    /* ── applyTheme: updates CSS vars only — card thumbs update instantly via CSS ── */
    function applyTheme(name) {
        const t = themes[name] || themes.blue;
        const root = document.documentElement;
        const [c1, c2, c3] = t.bg.split(',');
        root.style.setProperty('--accent-blue', t.hex);
        root.style.setProperty('--accent-rgb',  t.rgb);
        root.style.setProperty('--card-bg',    `rgba(${t.card},0.6)`);
        root.style.setProperty('--sidebar-bg', `rgba(${t.card},0.94)`);
        root.style.setProperty('--theme-bg',
            `radial-gradient(ellipse at top right,${c1} 0%,${c2} 50%,${c2} 100%),` +
            `radial-gradient(ellipse at bottom left,${c3} 0%,${c2} 70%)`
        );
        localStorage.setItem('siteTheme', name);
        document.querySelectorAll('.theme-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.theme === name)
        );
        // No regen needed — all thumbs use rgba(var(--accent-rgb),...) and update instantly
    }

    /* ── Build theme buttons into the gear settings panel ── */
    function _buildThemeButtonsBase(container) {
        if (!container) return;
        container.innerHTML = '';
        const swatchColors = {
            blue:'#38bdf8', cyan:'#06d6c7', green:'#4ade80', lime:'#a3e635',
            purple:'#c084fc', pink:'#f472b6', red:'#f87171',
            orange:'#fb923c', gold:'#fbbf24', grey:'#94a3b8',
        };
        Object.keys(themes).forEach(name => {
            const btn = document.createElement('button');
            btn.className = 'theme-btn';
            btn.dataset.theme = name;
            btn.title = name.charAt(0).toUpperCase() + name.slice(1);
            btn.style.background = swatchColors[name] || '#888';
            btn.addEventListener('click', () => applyTheme(name));
            container.appendChild(btn);
        });
    }

    /* ── Custom colour from hex — derives dark bg tones ── */
    function applyCustomColor(hex) {
        // Parse hex to r,g,b
        const r = parseInt(hex.slice(1,3),16);
        const g = parseInt(hex.slice(3,5),16);
        const b = parseInt(hex.slice(5,7),16);
        const rgb = `${r},${g},${b}`;
        // Build dark bg: very dark tinted versions of the hue
        const darken = (ch, f) => Math.max(0, Math.round(ch * f));
        const d1 = `#${[r,g,b].map(c=>darken(c,.07).toString(16).padStart(2,'0')).join('')}`;
        const d2 = `#${[r,g,b].map(c=>darken(c,.10).toString(16).padStart(2,'0')).join('')}`;
        const d3 = `#${[r,g,b].map(c=>darken(c,.08).toString(16).padStart(2,'0')).join('')}`;
        const root = document.documentElement;
        root.style.setProperty('--accent-blue', hex);
        root.style.setProperty('--accent-rgb',  rgb);
        const cr = darken(r, .10), cg = darken(g, .10), cb = darken(b, .10);
        root.style.setProperty('--card-bg',    `rgba(${cr},${cg},${cb},0.6)`);
        root.style.setProperty('--sidebar-bg', `rgba(${cr},${cg},${cb},0.94)`);
        root.style.setProperty('--theme-bg',
            `radial-gradient(ellipse at top right,${d1} 0%,${d2} 50%,${d2} 100%),` +
            `radial-gradient(ellipse at bottom left,${d3} 0%,${d2} 70%)`
        );
        localStorage.setItem('siteTheme', 'custom');
        localStorage.setItem('siteThemeCustomHex', hex);
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        // Update the custom color pill
        const pill = document.querySelector('.theme-btn-wheel-pill');
        if (pill) {
            const sw = pill.querySelector('.wheel-swatch');
            const lb = pill.querySelector('span:nth-child(3)');
            if (sw) { sw.style.background = hex; sw.style.display = 'block'; }
            if (lb) lb.textContent = 'Custom: ' + hex;
        }
    }

    /* ── Build theme buttons with colour wheel pill ── */
    function buildThemeButtons(container) {
        _buildThemeButtonsBase(container);

        // Full-width custom color pill — sits below the swatch row
        const savedCustom = localStorage.getItem('siteThemeCustomHex') || '#38bdf8';
        const isCustom = localStorage.getItem('siteTheme') === 'custom';

        const pill = document.createElement('label');
        pill.className = 'theme-btn-wheel-pill';
        pill.title = 'Pick any custom color';
        pill.style.cssText = [
            'display:flex', 'align-items:center', 'gap:8px',
            'width:100%', 'margin-top:8px', 'padding:6px 10px',
            'border-radius:8px', 'cursor:pointer', 'position:relative',
            'border:1px solid rgba(255,255,255,0.15)',
            'background:linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))',
            'box-sizing:border-box', 'transition:border-color 0.2s,background 0.2s',
            'overflow:hidden',
        ].join(';');

        const strip = document.createElement('span');
        strip.style.cssText = 'width:18px;height:18px;border-radius:50%;flex-shrink:0;background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red);border:2px solid rgba(255,255,255,0.3);';

        const swatch = document.createElement('span');
        swatch.className = 'wheel-swatch';
        swatch.style.cssText = `width:14px;height:14px;border-radius:4px;flex-shrink:0;background:${savedCustom};border:1.5px solid rgba(255,255,255,0.25);display:${isCustom ? 'block' : 'none'};`;

        const label = document.createElement('span');
        label.style.cssText = 'font-size:0.75rem;color:rgba(255,255,255,0.7);font-family:Outfit,sans-serif;flex:1;';
        label.textContent = isCustom ? 'Custom: ' + savedCustom : 'Custom color…';

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = savedCustom;
        colorInput.style.cssText = 'position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;border:none;padding:0;';
        colorInput.addEventListener('input', e => applyCustomColor(e.target.value));
        colorInput.addEventListener('change', e => applyCustomColor(e.target.value));

        pill.appendChild(strip);
        pill.appendChild(swatch);
        pill.appendChild(label);
        pill.appendChild(colorInput);
        container.appendChild(pill);

        pill.addEventListener('mouseenter', () => { pill.style.borderColor = 'rgba(255,255,255,0.35)'; pill.style.background = 'linear-gradient(90deg,rgba(255,255,255,0.10),rgba(255,255,255,0.05))'; });
        pill.addEventListener('mouseleave', () => { pill.style.borderColor = 'rgba(255,255,255,0.15)'; pill.style.background = 'linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))'; });
    }

    /* ── Expose globally so buildGearPanel() can call it ── */
    window.buildThemeButtons = buildThemeButtons;
    window.applyCustomColor  = applyCustomColor;

    /* ── Old #theme-switcher fallback (hidden but keep for compat) ── */
    const switcher = document.getElementById('theme-switcher');
    if (switcher) { switcher.innerHTML = ''; }

    // Restore custom colour on load
    const _savedTheme = localStorage.getItem('siteTheme');
    if (_savedTheme === 'custom') {
        const _savedHex = localStorage.getItem('siteThemeCustomHex');
        if (_savedHex) { applyCustomColor(_savedHex); }
        else { applyTheme('blue'); }
    } else {
        applyTheme(_savedTheme || 'blue');
    }
})();

/* =====================================================
   QUICK TAG CLICK — launches first matching game directly
===================================================== */
document.querySelectorAll('.quick-tags code').forEach(tag => {
    tag.addEventListener('click', () => {
        const rawQuery = tag.textContent.trim();
        const query = rawQuery.toLowerCase().replace(/\s+/g, '');

        function findBestCard(cards) {
            let exactMatch = null, partialMatch = null;
            for (const card of cards) {
                const name = (card.dataset.name || '').toLowerCase().replace(/\s+/g, '');
                if (name === query) { exactMatch = card; break; }
                if (!partialMatch && name.includes(query)) partialMatch = card;
            }
            return exactMatch || partialMatch;
        }

        const bestCard = findBestCard(document.querySelectorAll('.game-card'));
        if (bestCard) {
            bestCard.click();
        } else {
            const input = document.getElementById('searchInput');
            if (!input) return;
            input.value = rawQuery;
            input.dispatchEvent(new Event('input'));
            input.focus();
            let attempts = 0;
            const poll = setInterval(() => {
                attempts++;
                const cards = document.querySelectorAll('.game-card');
                let exactMatch = null;
                for (const card of cards) {
                    const name = (card.dataset.name || '').toLowerCase().replace(/\s+/g, '');
                    if (name === query) { exactMatch = card; break; }
                }
                if (exactMatch) {
                    clearInterval(poll);
                    input.value = '';
                    input.dispatchEvent(new Event('input'));
                    exactMatch.click();
                } else if (attempts > 20) {
                    clearInterval(poll);
                    const partial = findBestCard(document.querySelectorAll('.game-card'));
                    if (partial) { input.value = ''; input.dispatchEvent(new Event('input')); partial.click(); }
                }
            }, 50);
        }
    });
});
/* =====================================================
   CARD TRANSFORMER
===================================================== */
function formatName(raw) {
    return raw
        .replace(/^cl/i, '')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([a-zA-Z])(\d)/g, '$1 $2')
        .replace(/(\d)([a-zA-Z])/g, '$1 $2')
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, c => c.toUpperCase());
}

/* =====================================================
   THUMBNAIL — pure CSS div, updates with theme instantly, zero regen lag
===================================================== */

function _thumbHash(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return h;
}

function makeCSSThumb(displayName) {
    const letter = (displayName.replace(/^cl/i, '')[0] || '?').toUpperCase();
    const hash = _thumbHash(displayName);
    const bgOpacity  = (0.22 + (hash % 9) * 0.018).toFixed(3);
    const letOpacity = (0.70 + (hash % 5) * 0.06).toFixed(3);
    const thumb = document.createElement('div');
    thumb.className = 'game-card-thumb';
    thumb.style.cssText =
        `background:rgba(var(--accent-rgb),${bgOpacity});` +
        `color:rgba(var(--accent-rgb),${letOpacity});`;
    thumb.textContent = letter;
    return thumb;
}

function transformButtonToCard(btn) {
    const file = btn.value;
    const displayName = formatName(file);
    const clickHandler = btn.onclick;

    const card = document.createElement('div');
    card.className = 'game-card';
    card.dataset.file = file;
    card.dataset.name = displayName.toLowerCase();

    const thumb = makeCSSThumb(displayName);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'game-card-name';
    nameSpan.textContent = displayName;
    nameSpan.dataset.fullname = displayName;

    // ── NEW badge — shown if file is in window._newGames set ──
    if (window._newGames && window._newGames.has(file)) {
        const badge = document.createElement('span');
        badge.className = 'new-badge';
        badge.textContent = 'NEW';
        card.appendChild(badge);
        card.classList.add('has-new-badge');
    }

    // Star button
    const star = document.createElement('button');
    star.className = 'star-btn' + (isFav(file) ? ' starred' : '');
    star.dataset.file = file;
    star.textContent = isFav(file) ? '★' : '☆';
    star.title = 'Add to Favorites';
    star.onclick = (e) => { e.stopPropagation(); toggleFav(file); };

    card.appendChild(thumb);
    card.appendChild(nameSpan);
    card.appendChild(star);
    card.onclick = clickHandler;

    if (btn.parentNode) btn.parentNode.replaceChild(card, btn);
    return card;
}

function transformButtons() {
    document.querySelectorAll('.buttons-container input[type="button"]').forEach(btn => {
        transformButtonToCard(btn);
    });
}

transformButtons();

/* =====================================================
   GAME CARD TOOLTIP — fixed-position so it escapes overflow:hidden
===================================================== */
(function() {
    const tip = document.createElement('div');
    tip.className = 'game-card-tooltip';
    document.body.appendChild(tip);

    let hideTimer = null;

    document.addEventListener('mouseover', e => {
        const card = e.target.closest('.game-card');
        if (!card) return;
        const nameEl = card.querySelector('.game-card-name');
        if (!nameEl) return;

        // Only show if text is actually truncated
        if (nameEl.scrollWidth <= nameEl.clientWidth) return;

        clearTimeout(hideTimer);
        const fullName = nameEl.dataset.fullname || nameEl.textContent;
        tip.textContent = fullName;

        const rect = card.getBoundingClientRect();
        tip.style.left = (rect.left + rect.width / 2) + 'px';
        tip.style.top  = (rect.top - 10) + 'px';
        tip.style.transform = 'translate(-50%, -100%)';
        tip.classList.add('visible');
    });

    document.addEventListener('mouseout', e => {
        const card = e.target.closest('.game-card');
        if (!card) return;
        hideTimer = setTimeout(() => tip.classList.remove('visible'), 80);
    });
})();
/* =====================================================
   BACK TO TOP
===================================================== */
(function(){
    const btn = document.getElementById('back-to-top');
    const scroller = document.querySelector('.main-content');
    if (!btn || !scroller) return;
    btn.style.display = 'flex';
    scroller.addEventListener('scroll', () => {
        if (scroller.scrollTop > 400) {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        } else {
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none';
        }
    });
    btn.onclick = () => scroller.scrollTo({ top: 0, behavior: 'smooth' });
})();