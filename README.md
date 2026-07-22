# OpusChange

> 🇫🇷 [Version française](README.fr.md)

**Annotate any web page by clicking its elements, then export ultra-precise
instructions for your AI** (Claude Code, ChatGPT, Copilot…).

Each annotation captures not just the element's **CSS selector**, but also its
**full DOM path**, the **section** it belongs to, its **styles**, **attributes**
and **HTML** — the AI knows *exactly* what to change and where. The export also
includes the **path of the file to edit** (local pages) and any **JavaScript
errors** detected, and the **✓ Resolved** status lets you iterate to perfection.

> 100% local: no account, no server, no data sent. UI in **English and French**
> (follows your Firefox language).

---

## Features

| Feature | |
|---|---|
| Click-to-annotate with element highlighting (like DevTools inspector) | ✅ |
| Unique CSS selector + **full DOM path** per annotation | ✅ |
| **Section context** (nearest container + heading) | ✅ |
| Computed **styles** (color, background, font), attributes, HTML snippet | ✅ |
| 5 annotation types: Edit · Add · Remove · Bug · Question (color-coded badges) | ✅ |
| Badges anchored to elements (follow scroll and layout changes) | ✅ |
| **JavaScript error capture** (uncaught errors, rejected promises, missing resources) | ✅ |
| **File-to-edit path** in the export for local pages | ✅ |
| **✓ Resolved** status per annotation — re-export only what's left | ✅ |
| Markdown export (clipboard) + PNG capture with badges | ✅ |
| Per-URL persistence (annotations restored on revisit) | ✅ |
| Draggable, collapsible panel · dark mode · to-do counter on the toolbar icon | ✅ |
| **Export modes**: Fix · Improve · Audit (adapts instructions and content) | ✅ |
| **Chrome / Edge / Brave / Arc build** (MV3, same codebase) | ✅ |

## Installation

### Load in Firefox (2 minutes)

1. Open Firefox and go to **`about:debugging`**
2. Click **"This Firefox"** in the left menu
3. Click **"Load Temporary Add-on…"**
4. Select the **`manifest.json`** file from this folder
5. The OpusChange icon appears in your toolbar 🎉

> ⚠️ Temporary add-ons are removed when Firefox closes — reload it next time
> (2 clicks in `about:debugging`). After changing the code, just hit **"Reload"**.

### To annotate local files (`file://`)

Firefox blocks extension access to local files by default:

1. Go to **`about:addons`** → click **OpusChange**
2. **"Permissions"** tab → enable **"Access local files on your computer"**
3. Reload your HTML file (**F5**)

*Alternative: serve your folder locally — `python -m http.server 8000` — and open
`http://localhost:8000/your-page.html`.*

### Install on Chrome / Edge / Brave / Arc

1. Run `powershell -File build.ps1` (creates `dist/chrome`)
2. Open **`chrome://extensions`** (or `edge://extensions`, `brave://extensions`)
3. Enable **Developer mode** (top right)
4. Click **"Load unpacked"** and select the **`dist/chrome`** folder
5. For local files: open the extension's details and enable **"Allow access to file URLs"**

### Permanent install (optional)

Firefox requires permanent extensions to be signed by Mozilla: submit the zipped
folder on [addons.mozilla.org](https://addons.mozilla.org) as **"unlisted"**
(stays private), get a signed `.xpi` back in minutes, install it by double-click.

## Usage

1. Click the **OpusChange icon** (or **Alt+Shift+M**) → the panel opens,
   the cursor becomes a crosshair
2. **Hover** the page: each element highlights with its CSS selector
3. **Click** an element → pick a **type** (Edit · Add · Remove · Bug · Question)
   → write your comment → **Add**
4. A **numbered color-coded badge** anchors to the element; chain as many
   annotations as you want
5. Export:
   - **📋 Copy for AI** → full markdown in your clipboard
   - **📸 PNG** → page capture with badges (Downloads folder)

Pick an **export mode** above the copy button: **Fix** (strict repairs only),
**Improve** (the AI also suggests better design/accessibility/performance) or
**Audit** (report only, nothing modified). Improve and Audit exports include a
**page outline** (h1-h3 headings with their selectors). Your choice is remembered.

### The perfection loop 🔄

1. Annotate, then **📋 Copy for AI** — the export includes the **file to edit**
   (local pages) and any **JavaScript errors** found on the page
2. Paste into Claude Code: it opens the file, debugs, improves
3. Reload the page (**F5**) — your annotations come back
4. Check **✓** what's fixed (badge grays out), re-export: only the **remaining**
   annotations go to the AI
5. Repeat until **0 to do** = perfection reached 🎯

The counter on the Firefox icon shows the number of annotations *left to do*.

### Shortcuts

| Shortcut | Action |
|---|---|
| `Alt+Shift+M` | Toggle OpusChange on the page |
| `Esc` | Stop annotation mode |
| `Ctrl+Enter` | Confirm the current comment |

## Export example

What **📋 Copy for AI** puts in your clipboard (in your Firefox language):

```markdown
# Annotations — My home page

- **File to edit** : `C:\Users\you\Projects\my-site\index.html`
- **URL** : file:///C:/Users/you/Projects/my-site/index.html
- **Date** : 7/22/2026, 3:04 PM
- **Window** : 1920×947 px
- **To do** : 2 (1× Edit, 1× Remove)
- **Already resolved** : 1 (no. 1) — do not touch these again

> **Instructions for the AI**: each annotation below identifies a precise element
> on the page by its CSS selector and its full DOM path.
> Open the file listed above, apply each requested change
> to the matching element, and fix the JavaScript errors listed.

## ⚠ JavaScript errors detected on the page

1. `TypeError: cart is undefined` — script.js line 42

---

## 2. [EDIT] « Get started »

- **CSS selector** : `#hero button.cta`
- **Full path** : `body > main > section#hero > div.container > button.cta`
- **Section** : « Build your site in 5 minutes » (`section#hero`)
- **Element** : `<button>` — classes : `cta`, `btn-primary` — text : « Get started »
- **Size** : 182×48 px — ≈520 px from the top of the page
- **Styles** : text #FFFFFF · background #2563EB · 16px Inter (600)

**Requested change:**
> This button should open a modal instead of redirecting

**Current HTML:**
```html
<button class="cta btn-primary">Get started</button>
```
```

## Troubleshooting

| Problem | Fix |
|---|---|
| Clicking the icon does nothing | The page was open **before** the extension loaded → **F5** the page |
| Doesn't work on a local file | Enable the "Access local files" permission (see Installation), then **F5** |
| Extension disappeared | Firefox was restarted → reload it in `about:debugging` |
| Doesn't work on `about:…` or addons.mozilla.org | Normal: Firefox-protected pages, no extension can run there |
| Selector struck through in the panel | The element no longer exists on the page — the annotation is kept anyway |

## Code structure

| File | Role |
|---|---|
| `manifest.json` | Firefox (MV2) extension declaration |
| `manifest.chrome.json` | Chromium (MV3) manifest, used by the build |
| `build.ps1` | Assembles `dist/firefox`, `dist/chrome` and the zips |
| `background.js` | Icon click, to-do counter, PNG capture |
| `content/selector.js` | Element analysis: unique selector, full path, section, styles, HTML |
| `content/annotator.js` | Highlighting, badges, panel, editor, export, persistence |
| `content/annotator.css` | Overlay design (`mkp-` prefix, auto dark mode) |
| `_locales/en`, `_locales/fr` | UI translations (English, French) |

## Privacy

- No network requests, no server, no account
- Annotations stay in **your** Firefox local storage
- The only time data "leaves": when **you** copy or download the export

## Roadmap ideas

- Automatic page audit (missing alts, heavy images, empty links…) creating pre-filled annotations
- Per-element screenshot capture
- Structured JSON export
- Store publishing (addons.mozilla.org, Chrome Web Store)

## License

[MIT](LICENSE)
