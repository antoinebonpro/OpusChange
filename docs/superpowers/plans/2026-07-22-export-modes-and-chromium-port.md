# OpusChange v4.0.0 — Export Modes & Chromium Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add fix/improve/audit export modes to OpusChange, then make the same codebase load on Chrome/Edge/Brave/Arc via a second MV3 manifest and a build script.

**Architecture:** Single codebase. Modes live in `annotator.js` (state + 3 chips + per-mode markdown), translations in `_locales`, outline helper in `selector.js`. Chromium port = new `manifest.chrome.json` (MV3) + bi-compatible `background.js` (sendResponse pattern, data-URL downloads) + `build.ps1` assembling `dist/firefox` and `dist/chrome`.

**Tech Stack:** WebExtensions MV2 (Firefox) + MV3 (Chromium), vanilla JS, browser.i18n, PowerShell 5.1 build script. No test framework: each task validates with `node --check` / JSON parse + a manual browser check listed in the task.

## Global Constraints

- Firefox manifest stays **MV2** (`browser_action`, `background.scripts`) — do not migrate it to MV3.
- All user-visible strings go through `browser.i18n` with keys in BOTH `_locales/en` and `_locales/fr`.
- All injected DOM uses the `mkp-` class prefix and `data-mkp="1"` (via existing `h()`).
- `background.js` must run unchanged as MV2 background script AND MV3 service worker: use `B.browserAction || B.action`, the `sendResponse + return true` pattern, and no `URL.createObjectURL`.
- Version `4.0.0` in `manifest.json` AND `manifest.chrome.json`.
- Commits follow existing style, ending with the Co-Authored-By + Claude-Session trailers used in this repo.

---

### Task 1: Mode & outline translations (both locales)

**Files:**
- Modify: `_locales/en/messages.json`
- Modify: `_locales/fr/messages.json`

**Interfaces:**
- Produces i18n keys consumed by Task 3 via `t(key)`: `modeFix`, `modeImprove`, `modeAudit`, `modeFixTip`, `modeImproveTip`, `modeAuditTip`, `mdTitleFix`, `mdTitleImprove`, `mdTitleAudit`, `mdInstrFix`, `mdInstrFixFile`, `mdInstrImprove`, `mdInstrImproveFile`, `mdInstrAudit`, `mdInstrAuditFile`, `mdOutline`.
- Removes keys: `mdTitle`, `mdInstructions`, `mdInstructionsFile` (Task 3 stops using them in the same release).

- [ ] **Step 1: In `_locales/en/messages.json`, delete the `mdTitle`, `mdInstructions`, `mdInstructionsFile` entries and add:**

```json
  "modeFix": { "message": "Fix" },
  "modeImprove": { "message": "Improve" },
  "modeAudit": { "message": "Audit" },
  "modeFixTip": { "message": "Strict: repair exactly what is requested, nothing else" },
  "modeImproveTip": { "message": "The AI also suggests related improvements" },
  "modeAuditTip": { "message": "Analysis only — nothing gets modified" },
  "mdTitleFix": { "message": "Fixes" },
  "mdTitleImprove": { "message": "Improvements" },
  "mdTitleAudit": { "message": "Audit request" },
  "mdInstrFix": { "message": "**Instructions for the AI**: each annotation below identifies a precise element\non the page by its CSS selector and its full DOM path.\nFix the JavaScript errors first, then apply EXACTLY the requested changes\nto the matching elements in the source code. Do not modify anything else." },
  "mdInstrFixFile": { "message": "**Instructions for the AI**: each annotation below identifies a precise element\non the page by its CSS selector and its full DOM path.\nOpen the file listed above, fix the JavaScript errors first, then apply\nEXACTLY the requested changes to the matching elements. Do not modify anything else." },
  "mdInstrImprove": { "message": "**Instructions for the AI**: each annotation below identifies a precise element\non the page by its CSS selector and its full DOM path.\nApply the requested changes, AND suggest related improvements\n(design, accessibility, performance, consistency) around them.\nList every improvement you make beyond the annotations." },
  "mdInstrImproveFile": { "message": "**Instructions for the AI**: each annotation below identifies a precise element\non the page by its CSS selector and its full DOM path.\nOpen the file listed above, apply the requested changes, AND suggest\nrelated improvements (design, accessibility, performance, consistency).\nList every improvement you make beyond the annotations." },
  "mdInstrAudit": { "message": "**Instructions for the AI**: do NOT modify anything.\nAnalyze the page using the outline, the JavaScript errors and the annotated\npoints below, then produce a structured report: issues ranked by severity,\nwith a concrete recommendation for each." },
  "mdInstrAuditFile": { "message": "**Instructions for the AI**: do NOT modify anything.\nRead the file listed above and analyze it using the outline, the JavaScript\nerrors and the annotated points below, then produce a structured report:\nissues ranked by severity, with a concrete recommendation for each." },
  "mdOutline": { "message": "Page outline" },
```

- [ ] **Step 2: Same in `_locales/fr/messages.json` (delete the 3 keys, add):**

```json
  "modeFix": { "message": "Corriger" },
  "modeImprove": { "message": "Améliorer" },
  "modeAudit": { "message": "Audit" },
  "modeFixTip": { "message": "Strict : répare exactement ce qui est demandé, rien d'autre" },
  "modeImproveTip": { "message": "L'IA propose aussi des améliorations connexes" },
  "modeAuditTip": { "message": "Analyse seulement — rien n'est modifié" },
  "mdTitleFix": { "message": "Corrections" },
  "mdTitleImprove": { "message": "Améliorations" },
  "mdTitleAudit": { "message": "Demande d'audit" },
  "mdInstrFix": { "message": "**Instructions pour l'IA** : chaque annotation ci-dessous identifie un élément\nprécis de la page par son sélecteur CSS et son chemin complet dans le DOM.\nCorrige d'abord les erreurs JavaScript, puis applique EXACTEMENT les changements\ndemandés aux éléments correspondants dans le code source. Ne modifie rien d'autre." },
  "mdInstrFixFile": { "message": "**Instructions pour l'IA** : chaque annotation ci-dessous identifie un élément\nprécis de la page par son sélecteur CSS et son chemin complet dans le DOM.\nOuvre le fichier indiqué ci-dessus, corrige d'abord les erreurs JavaScript,\npuis applique EXACTEMENT les changements demandés aux éléments correspondants.\nNe modifie rien d'autre." },
  "mdInstrImprove": { "message": "**Instructions pour l'IA** : chaque annotation ci-dessous identifie un élément\nprécis de la page par son sélecteur CSS et son chemin complet dans le DOM.\nApplique les changements demandés ET propose des améliorations connexes\n(design, accessibilité, performances, cohérence) autour d'eux.\nListe chaque amélioration apportée au-delà des annotations." },
  "mdInstrImproveFile": { "message": "**Instructions pour l'IA** : chaque annotation ci-dessous identifie un élément\nprécis de la page par son sélecteur CSS et son chemin complet dans le DOM.\nOuvre le fichier indiqué ci-dessus, applique les changements demandés ET propose\ndes améliorations connexes (design, accessibilité, performances, cohérence).\nListe chaque amélioration apportée au-delà des annotations." },
  "mdInstrAudit": { "message": "**Instructions pour l'IA** : ne modifie RIEN.\nAnalyse la page à partir du plan, des erreurs JavaScript et des points annotés\nci-dessous, puis rends un rapport structuré : problèmes classés par sévérité,\navec une recommandation concrète pour chacun." },
  "mdInstrAuditFile": { "message": "**Instructions pour l'IA** : ne modifie RIEN.\nLis le fichier indiqué ci-dessus et analyse-le à partir du plan, des erreurs\nJavaScript et des points annotés ci-dessous, puis rends un rapport structuré :\nproblèmes classés par sévérité, avec une recommandation concrète pour chacun." },
  "mdOutline": { "message": "Plan de la page" },
```

- [ ] **Step 3: Validate both files parse**

Run: `Get-Content _locales\en\messages.json -Raw | ConvertFrom-Json | Out-Null; Get-Content _locales\fr\messages.json -Raw | ConvertFrom-Json | Out-Null`
Expected: no error.

- [ ] **Step 4: Commit** — `git add _locales; git commit -m "i18n: add export-mode and outline strings (en/fr)"` (+ trailers)

---

### Task 2: `pageOutline()` in selector.js

**Files:**
- Modify: `content/selector.js` (add function + export)

**Interfaces:**
- Produces: `window.__mkp.pageOutline()` → `[{ level: 'h1'|'h2'|'h3', text: string≤60, selector: string }]`, max 30 items, skips our own UI. Consumed by Task 3.

- [ ] **Step 1: Add above the `window.__mkp = {` block:**

```js
  /* Plan de la page : titres h1-h3 avec leur sélecteur (30 max). */
  function pageOutline() {
    const out = [];
    for (const hd of document.querySelectorAll('h1, h2, h3')) {
      if (out.length >= 30) break;
      if (hd.closest('[data-mkp]')) continue;
      const text = excerpt(hd, 60);
      if (!text) continue;
      out.push({
        level: hd.tagName.toLowerCase(),
        text,
        selector: getSelector(hd),
      });
    }
    return out;
  }
```

- [ ] **Step 2: Add `pageOutline,` to the `window.__mkp = { … }` export object.**

- [ ] **Step 3: Validate** — `node --check content\selector.js` → exit 0.

- [ ] **Step 4: Commit** — `git add content/selector.js; git commit -m "feat: page outline helper (h1-h3 with selectors)"` (+ trailers)

---

### Task 3: Mode state, chips UI and per-mode markdown in annotator.js (+ CSS)

**Files:**
- Modify: `content/annotator.js`
- Modify: `content/annotator.css` (append mode-chip styles)

**Interfaces:**
- Consumes: Task 1 keys via `t()`, Task 2 `M.pageOutline()`.
- Produces: `exportMode` (`'fix'|'improve'|'audit'`), persisted in `storage.local` key `mkp-mode`; `buildMarkdown()` output varies per mode.

- [ ] **Step 1: Add state near the top (after `let nextNumber = 1;`):**

```js
  const MODE_KEY = 'mkp-mode';
  const MODES = ['fix', 'improve', 'audit'];
  let exportMode = 'fix';
```

- [ ] **Step 2: Add helpers (before `buildPanel`):**

```js
  function modeLabelKey(m) {
    return 'mode' + m.charAt(0).toUpperCase() + m.slice(1);
  }

  function setMode(m) {
    if (!MODES.includes(m)) m = 'fix';
    exportMode = m;
    B.storage.local.set({ [MODE_KEY]: m }).catch(() => {});
    refreshModeChips();
  }

  function refreshModeChips() {
    if (!els.modeChips) return;
    for (const chip of els.modeChips.children) {
      chip.setAttribute('aria-pressed', String(chip.getAttribute('data-mkp-mode') === exportMode));
    }
  }
```

- [ ] **Step 3: In `buildPanel()`, insert between the `els.errorsInfo` block and `const actions = …`:**

```js
    els.modeChips = h('div', 'mkp-mode-chips');
    for (const m of MODES) {
      const chip = h('button', 'mkp-chip mkp-mode-chip', t(modeLabelKey(m)));
      chip.setAttribute('data-mkp-mode', m);
      chip.title = t(modeLabelKey(m) + 'Tip');
      chip.addEventListener('click', () => setMode(m));
      els.modeChips.appendChild(chip);
    }
    body.appendChild(els.modeChips);
    refreshModeChips();
```

- [ ] **Step 4: In `buildMarkdown()`, replace the title line, the instructions block, and add the outline section.**

Title line becomes:

```js
    const titleKey = { fix: 'mdTitleFix', improve: 'mdTitleImprove', audit: 'mdTitleAudit' }[exportMode];
    lines.push('# ' + t(titleKey) + ' — ' + (document.title || location.pathname));
```

Instructions block becomes:

```js
    const instrBase = { fix: 'mdInstrFix', improve: 'mdInstrImprove', audit: 'mdInstrAudit' }[exportMode];
    const instr = t(file ? instrBase + 'File' : instrBase);
    for (const l of instr.split('\n')) lines.push('> ' + l);
    lines.push('');
```

After the jsErrors section (before `lines.push('---')`), add:

```js
    if (exportMode !== 'fix') {
      const outline = M.pageOutline();
      if (outline.length) {
        lines.push('## ' + t('mdOutline'));
        lines.push('');
        for (const o of outline) {
          lines.push('- ' + o.level + ' « ' + o.text + ' » — `' + o.selector + '`');
        }
        lines.push('');
      }
    }
```

- [ ] **Step 5: Restore the saved mode at load: change the final `B.storage.local.get(PAGE_KEY)` to `B.storage.local.get([PAGE_KEY, MODE_KEY])` and, first thing inside the callback, add:**

```js
    if (data && MODES.includes(data[MODE_KEY])) exportMode = data[MODE_KEY];
```

- [ ] **Step 6: Append to `annotator.css` (end of file, after the errors-info block):**

```css
/* ------------------------------------------------------- modes d'export */

.mkp-mode-chips {
  display: flex;
  gap: 4px;
  padding-bottom: 8px;
}

.mkp-mode-chip {
  flex: 1;
  text-align: center;
}

.mkp-mode-chip[aria-pressed="true"] {
  color: var(--mkp-paper);
  background: var(--mkp-ink);
  border-color: var(--mkp-ink);
}
```

- [ ] **Step 7: Validate** — `node --check content\annotator.js` → exit 0.

- [ ] **Step 8: Manual check on Firefox (about:debugging → Recharger, F5 a page):** 3 chips visible, choice survives page reload; copy in each mode → title/instructions change; improve & audit include « Plan de la page »; fix does not.

- [ ] **Step 9: Commit** — `git add content; git commit -m "feat: fix/improve/audit export modes"` (+ trailers)

---

### Task 4: Bi-compatible background.js + manifest.chrome.json

**Files:**
- Modify: `background.js` (full rewrite below)
- Create: `manifest.chrome.json`

**Interfaces:**
- Consumes messages `{type:'mkp-toggle'}` out / `{type:'mkp-count'|'mkp-capture'}` in — unchanged, content scripts untouched.
- Produces: a background that runs as MV2 script (Firefox) and MV3 service worker (Chromium).

- [ ] **Step 1: Replace `background.js` entirely with:**

```js
/* OpusChange — script de fond.
 * Bi-compatible : Firefox MV2 (background script) et Chromium MV3
 * (service worker). D'où : browserAction||action, réponse via
 * sendResponse + return true, téléchargement via data-URL
 * (pas de createObjectURL en service worker). */

'use strict';

const B = typeof browser !== 'undefined' ? browser : chrome;
const action = B.browserAction || B.action;

// Clic sur l'icône (ou Alt+Shift+M) → bascule le mode annotation.
action.onClicked.addListener((tab) => {
  B.tabs.sendMessage(tab.id, { type: 'mkp-toggle' }).catch(() => {
    console.warn('OpusChange: cannot annotate this page (protected page or missing permission).');
  });
});

B.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !sender.tab) return;

  // Compteur d'annotations affiché sur l'icône, par onglet.
  if (msg.type === 'mkp-count') {
    action.setBadgeText({
      text: msg.count > 0 ? String(msg.count) : '',
      tabId: sender.tab.id,
    });
    action.setBadgeBackgroundColor({ color: '#dc2626', tabId: sender.tab.id });
    return;
  }

  // Capture PNG de la zone visible → dossier Téléchargements.
  if (msg.type === 'mkp-capture') {
    const host = (msg.host || 'page').replace(/[^a-z0-9.-]/gi, '_');
    const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    B.tabs
      .captureVisibleTab(sender.tab.windowId, { format: 'png' })
      .then((dataUrl) => B.downloads.download({
        url: dataUrl,
        filename: `annotations-${host}-${date}.png`,
        saveAs: false,
      }))
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true; // réponse asynchrone
  }
});
```

- [ ] **Step 2: Create `manifest.chrome.json`:**

```json
{
  "manifest_version": 3,
  "name": "__MSG_extName__",
  "version": "4.0.0",
  "description": "__MSG_extDesc__",
  "default_locale": "en",
  "permissions": ["storage", "clipboardWrite", "downloads"],
  "host_permissions": ["<all_urls>"],
  "action": {
    "default_title": "__MSG_actionTitle__",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png"
    }
  },
  "commands": {
    "_execute_action": {
      "suggested_key": { "default": "Alt+Shift+M" },
      "description": "__MSG_cmdDesc__"
    }
  },
  "background": { "service_worker": "background.js" },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/selector.js", "content/annotator.js"],
      "css": ["content/annotator.css"],
      "run_at": "document_idle"
    }
  ],
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

(Note: no `clipboardWrite` permission exists in Chrome MV3 — it is ignored with a warning; keep it for Firefox parity or drop it here: **drop it in manifest.chrome.json**, keep `["storage", "downloads"]`.)

- [ ] **Step 3: Bump `manifest.json` (Firefox) version to `4.0.0`.**

- [ ] **Step 4: Validate** — `node --check background.js` + both manifests parse via ConvertFrom-Json.

- [ ] **Step 5: Manual check on Firefox:** reload extension; toggle, counter, PNG capture still work (data-URL path).

- [ ] **Step 6: Commit** — `git add background.js manifest.json manifest.chrome.json; git commit -m "feat: Chromium MV3 support (bi-compatible background, chrome manifest)"` (+ trailers)

---

### Task 5: build.ps1 + .gitignore

**Files:**
- Create: `build.ps1`
- Modify: `.gitignore` (add `dist/`)

**Interfaces:**
- Produces: `dist/firefox/`, `dist/chrome/`, `dist/opuschange-firefox-<v>.zip`, `dist/opuschange-chrome-<v>.zip`.

- [ ] **Step 1: Create `build.ps1`:**

```powershell
# OpusChange — assemble les versions Firefox (MV2) et Chromium (MV3) dans dist/.
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$manifest = Get-Content (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json
$version = $manifest.version
$dist = Join-Path $root 'dist'
if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }

foreach ($target in 'firefox', 'chrome') {
  $out = Join-Path $dist $target
  New-Item -ItemType Directory -Force $out | Out-Null
  Copy-Item (Join-Path $root 'background.js') $out
  Copy-Item (Join-Path $root 'content') $out -Recurse
  Copy-Item (Join-Path $root '_locales') $out -Recurse
  Copy-Item (Join-Path $root 'LICENSE') $out
  New-Item -ItemType Directory -Force (Join-Path $out 'icons') | Out-Null
  Copy-Item (Join-Path $root 'icons\*.png') (Join-Path $out 'icons')
}
Copy-Item (Join-Path $root 'manifest.json') (Join-Path $dist 'firefox\manifest.json')
Copy-Item (Join-Path $root 'manifest.chrome.json') (Join-Path $dist 'chrome\manifest.json')

Compress-Archive -Path (Join-Path $dist 'firefox\*') -DestinationPath (Join-Path $dist "opuschange-firefox-$version.zip") -Force
Compress-Archive -Path (Join-Path $dist 'chrome\*') -DestinationPath (Join-Path $dist "opuschange-chrome-$version.zip") -Force
Write-Host "Build OK — dist/firefox, dist/chrome, zips v$version"
```

- [ ] **Step 2: Add `dist/` to `.gitignore` (under « Archives de build »).**

- [ ] **Step 3: Run** — `powershell -File build.ps1` → "Build OK", `dist/chrome/manifest.json` has `"manifest_version": 3`.

- [ ] **Step 4: Manual check on a Chromium browser:** `chrome://extensions` → Developer mode → Load unpacked → `dist/chrome` → annotate, 3 modes copy, PNG, counter.

- [ ] **Step 5: Commit** — `git add build.ps1 .gitignore; git commit -m "build: dist assembly script for Firefox and Chromium"` (+ trailers)

---

### Task 6: Documentation + push

**Files:**
- Modify: `README.md`, `README.fr.md`

- [ ] **Step 1: README.md — features table: add `| Export modes: Fix · Improve · Audit | ✅ |` and `| Chrome / Edge / Brave / Arc build | ✅ |`. After the file-permission install section, add:**

```markdown
### Install on Chrome / Edge / Brave / Arc

1. Run `powershell -File build.ps1` (creates `dist/chrome`)
2. Open **`chrome://extensions`** (or `edge://extensions`, `brave://extensions`, `arc://extensions`)
3. Enable **Developer mode** (top right)
4. Click **"Load unpacked"** and select the **`dist/chrome`** folder
5. For local files: open the extension's details and enable **"Allow access to file URLs"**
```

Usage section: after the export step, add one line — `Pick an export mode above the copy button: **Fix** (strict repairs), **Improve** (AI also suggests better), **Audit** (report only, nothing modified). Improve/Audit exports include a page outline (h1-h3 with selectors).`

- [ ] **Step 2: README.fr.md — same additions in French (« Installer sur Chrome / Edge / Brave / Arc », modes « Corriger / Améliorer / Audit », plan de la page). Remove the roadmap lines « Modes d'export… » and « Portage Chrome/Edge (Manifest V3) » in both READMEs.**

- [ ] **Step 3: Commit and push** — `git add README.md README.fr.md; git commit -m "docs: export modes and Chromium install"` (+ trailers), then `git push`.

---

## Self-review

- Spec coverage: modes UI+storage (T3), i18n (T1), outline (T2), titles/instructions/outline per mode (T3), MV3 manifest (T4), bi-compat background (T4), build (T5), docs+version (T4/T6), acceptance checks embedded as manual steps. ✓
- No placeholders; all code inline. ✓
- Names consistent: `MODE_KEY`/`mkp-mode`, `pageOutline`, `modeFix…` keys match between T1 and T3; `action` var in T4 only. ✓
