# 🎮 Game Hub

## 📁 Files

```
├── login.html             ← Entry point for the public hubs (register/login/approval)
├── clocker.html           ← Public Hub 1 — opens games in new tabs
├── clocker2.html          ← Public Hub 2 — opens games inline (in-page overlay)
├── personal-clocker.html  ← Your private hub — no login, not tracked
├── personal-admin.html    ← Admin dashboard (controls the public hubs)
├── hub.js                 ← Engine for clocker.html / clocker2.html
├── personal.js            ← Engine for personal-clocker.html
├── spiderweb.js           ← Animated background — loaded by all five pages above
└── styles.css              ← Shared site-wide styling
```

That's every file — nothing else needs to be uploaded. `logo.png` is no
longer used anywhere; every page's favicon now points at a live Google
icon URL instead (see **Favicons**, below).

---

## 🚀 Quick Start

**Public side:** point people at `login.html`. They register or log in,
then land on a hub picker → `clocker.html` (new tabs) or `clocker2.html`
(inline).

**Your private hub:** just open `personal-clocker.html` directly — no
login screen, nothing gets logged anywhere.

**Admin dashboard:** `personal-admin.html`. Password-gated, controls the
public hubs only — has no visibility into or effect on your personal hub.

---

## 🔀 Public hubs vs. personal hub

The personal hub is the *same* browsing/search/game engine, minus an
entire tracking-and-enforcement layer that only exists in `hub.js`:

| | Public hubs (`hub.js`) | Personal hub (`personal.js`) |
|---|---|---|
| Login required | Yes | No |
| Single-tab enforcement | Yes | No |
| Presence ("who's online") | Yes | No |
| Activity logging | Yes | No |
| Remote kick / site lockdown | Yes | No |
| Inactivity auto-logout | Yes | No |
| Daily presence wipe | Yes | No |
| Anti-inspect / console lock | Yes | Yes |
| Tab title/icon presets | Yes | Yes |
| Close-tab confirmation | Yes | Yes |

---

## 🛡️ Panic key & close confirmation

**Panic key** — pressing `Esc` on `clocker.html`, `clocker2.html`, or
`personal-clocker.html` redirects instantly to Google Drive. It's
registered as a tiny inline `<script>` right at the top of each page's
`<head>`, *before* `hub.js`/`personal.js` even start downloading — that
placement is deliberate, since a script that only exists inside the much
larger deferred `hub.js`/`personal.js` bundle wouldn't be listening yet
if someone hit `Esc` in the first moment the page was visible.

**Close confirmation** — closing the tab, typing a new URL, or hitting
back triggers the browser's native "Leave site?" prompt (browsers hard-
lock this wording; no site can customize or remove it). This lives in
`hub.js`/`personal.js` — one shared implementation per hub type, not
copy-pasted per page.

**How they stay compatible** — the panic key sets `window._panicking =
true` in that same inline snippet, a split second before it redirects.
The close-confirmation listener checks that flag first and silently
skips itself if it's set, so pressing `Esc` never triggers "are you sure
you want to leave?" — only genuine tab-close/navigation does.

`login.html` has its own copy of the close-confirmation listener (no
panic key needed there — there's no game content to hide). It also
skips itself via a pre-existing `navigatingToHub` flag that already got
set right before login's own internal redirect into a hub after a
successful sign-in, so completing login doesn't trigger the prompt
either.

---

## ⚙️ Admin Dashboard (`personal-admin.html`)

- **Pending / Approved / Denied / Kicked** — the user queue, with
  individual approve/deny/kick/delete actions
- **Auto-Approve New Users** — a toggle in Settings. When on, new
  registrations skip the queue entirely. Flipping it on also sweeps in
  anyone *currently* sitting on the "Awaiting Approval" screen with the
  tab open (detected via a live presence heartbeat) — it does **not**
  touch anyone who requested access and closed the tab; they stay in
  Pending until manually approved either way.
- **Site Lockdown** — one switch blocks all logins and force-logs-out
  anyone currently in a hub.
- **Inactivity Timeout** — configurable warn/logout minutes, enforced
  live against anyone in a hub.
- **Daily Wipe** — clears stale presence at a configured hour/minute.
- **Game Source (Hub vs CDN)** — separate toggles for the public hubs
  and the personal hub, each pointing at a different Firebase flag.
- **Admin password** — SHA-256 hashed. Regular user account passwords are
  **not** hashed (see Passwords below).
- **Activity Log** — every login/logout/registration/kick, with a
  scrolling announcement banner on `login.html` driven by
  `config/announcement` in Firebase (`{active: true, text: "..."}`) —
  no dedicated toggle for it in the Settings UI yet, set directly in the
  database.

Note: `personal-admin.html` has its own `beforeunload` handler too, but
it's session-cleanup logging only — it doesn't show the close
confirmation prompt.

---

## 🎨 Browser tab customization

The gear settings panel (on `clocker.html`, `clocker2.html`, and
`personal-clocker.html`) has a **Tab** tab with one-click presets:

- **Drive** — the site's own default title/icon
- **Sheets**, **Docs**, **Slides**, **Calendar**, **Classroom** — each
  swaps in that Google Workspace app's real title and icon
- **Canvas** — despite the label, this one intentionally links to
  **Canva** (the design tool), not the Instructure Canvas LMS
- **Schoology** — a real school LMS icon, for wherever this is deployed

There's also a Custom Title field and a Custom Icon upload for anything
not covered by a preset; picking either just moves you off whichever
preset was active — the preset buttons stay put as one-click starting
points to return to. Persists per-browser via `localStorage`, reapplied
the instant each page loads.

**On iframes:** if a page ever gets loaded inside an iframe (e.g. by an
external wrapper), an iframe's own `document.title`/favicon changes have
no effect on the actual browser tab — only the top-level document
controls that. The tab-customization code already accounts for this: it
reaches up to `window.top` (same-origin only, wrapped in a try/catch)
and applies the same change there too, so presets still work correctly
in that scenario.

---

## 🖼️ Favicons

Every page's `<link rel="icon">` — and every tab preset's icon — now
points at a live URL on Google's own CDN
(`ssl.gstatic.com`/`gstatic.com`) or, for Canva/Schoology, their own
respective CDNs. None of these are hosted locally anymore; `logo.png` is
fully unused. This means favicons depend on those third-party URLs
staying up and unchanged — if Google (or Canva/Schoology) ever moves or
renames one of these specific asset paths, that one icon would need a
new URL, since there's no local fallback file to catch it.

---

## 🌌 Animated background (`spiderweb.js`)

One shared file, loaded by all five pages — edit the animation in
exactly one place. Current defaults: 45 nodes, 30fps, solid-color
connecting lines (not gradients — gradient allocation per line, per
frame, was previously the single biggest performance cost in this
animation).

The in-app settings slider is bounded (node count 20–200), but the
fallback numbers in `spiderweb.js` itself are fully open to hand-edit
with no cap — set them to whatever you actually want. Speed and
connection-distance are read live every frame, so changes apply
instantly; node *count* requires a rebuild, which the settings panel
already triggers correctly (both on slider changes and on initial page
load).

---

## 🔐 Passwords

The admin password is SHA-256 hashed (Web Crypto, no library) — see
`hashPassword()` in `personal-admin.html`. Regular user account passwords
are **not** hashed; that was tried for regular accounts too and
intentionally reverted, so `login.html` has no hashing code left in it at
all — passwords are stored as entered.

---

## ⚙️ Firebase

Single Realtime Database backs everything.

```
apiKey:      AIzaSyBJ4lMm2Nf9u6UeJLHH-Ap9z7lX9wBFEuc
databaseURL: https://drive-portal-d7eb1-default-rtdb.firebaseio.com
```

Relevant top-level nodes:

- `users/` — accounts + status (pending/approved/denied/kicked)
- `presence/` — who's currently online in a public hub
- `pendingPresence/` — who's currently sitting on the "Awaiting Approval"
  screen (separate from `presence/`, used only by the auto-approve sweep)
- `activityLog/` — the admin panel's log feed
- `lockdown/` — site-wide lockdown state
- `config/` — every setting above: `autoApprove`, `gameSourceHub12`,
  `gameSourcePersonal`, `announcement`, inactivity timers, wipe schedule,
  `adminPass` (hashed)

### Game source (Hub vs CDN)
Each game is a single self-contained HTML file. Both are plain static
hosting — nothing proxies or rewrites requests:

- **Hub** (default): served directly from this same Cloudflare Pages
  deployment — `https://google-drive-hub.pages.dev`
- **CDN**: jsDelivr mirroring a GitHub repo —
  `cdn.jsdelivr.net/gh/taekfighter/ugs-singlefile/UGS-Files`

Toggle per-hub-type in the admin Settings tab, or directly via
`config/gameSourceHub12` (public hubs) / `config/gameSourcePersonal`
(personal hub). `personal.js` owns this check entirely — it's the only
Firebase call the personal hub makes (no auth, no tracking, no
presence), and `personal-clocker.html` itself no longer duplicates any
of that logic inline.

---

## 🎯 Adding a game

Add the filename to the `files` array near the top of `hub.js` (public)
and/or `personal.js` (personal) — game names normally start with `cl`
(e.g. `"clYourGame"`), which just gets stripped for the display name; a
handful of intentionally-kept entries don't follow that convention and
still work fine, since the fetch logic doesn't actually require the
prefix. Upload the matching `.html` file to whichever source (Hub or
CDN) is currently active. Order doesn't matter — games render
alphabetically by section regardless of array order.

---

## ✅ Pre-deployment checklist

- [ ] `spiderweb.js` present alongside all five pages that load it
- [ ] Admin password changed from any placeholder/default
- [ ] Firebase rules reviewed — this file documents the schema, not access control
- [ ] Auto-Approve set to whatever you want the default to be
- [ ] Confirm the Google/Canva/Schoology favicon URLs still resolve (see **Favicons**) — nothing local to fall back on if one moves
