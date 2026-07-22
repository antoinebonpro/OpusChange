# Kit de soumission aux stores — OpusChange v4.0.1

Textes prêts à coller dans les formulaires AMO et Chrome Web Store.
Fichiers à uploader : `dist/opuschange-firefox-4.0.1.zip` (AMO) et
`dist/opuschange-chrome-4.0.1.zip` (CWS) — régénérés par `build.ps1`.

---

## 🦊 addons.mozilla.org (AMO)

**Canal** : Listé · **Catégorie** : Developer Tools (Outils de développement)

**Résumé (max 250 car.)** :
> Annotate any web page by clicking its elements, then export precise AI-ready
> instructions: CSS selectors, full DOM paths, styles, JS errors. Fix/Improve/Audit
> modes, resolved tracking, PNG capture. 100% local, no account, no data collected.

**Description longue** (champ « À propos de cette extension ») :
> OpusChange turns visual feedback into instructions an AI coding assistant
> (Claude Code, ChatGPT, Copilot…) can execute precisely.
>
> • Click any element — it highlights like the DevTools inspector
> • Each annotation captures the CSS selector, full DOM path, section, styles,
>   attributes and HTML of the element
> • 5 annotation types: Edit, Add, Remove, Bug, Question
> • JavaScript errors on the page are captured and included in the export
> • 3 export modes: Fix (strict repairs), Improve (AI suggests better),
>   Audit (report only)
> • Mark annotations as resolved and re-export only what remains
> • Markdown to clipboard + PNG capture with badges
> • Annotations persist per URL — 100% locally
>
> Privacy: no account, no server, no network requests. Nothing leaves your
> browser unless you copy or download the export yourself.
> Interface in English and French.

**Notes pour le reviewer** :
> The <all_urls> host permission is required because the extension's single
> purpose is annotating any page the user chooses. No remote code, no
> analytics, no network requests at all. Data collection: none (declared via
> data_collection_permissions).

---

## 🌐 Chrome Web Store

**Catégorie** : Developer Tools · **Langues** : English + Français

**Single purpose description** :
> Annotate elements of the current page and export precise, AI-ready change
> instructions (CSS selectors, DOM paths, styles, JS errors).

**Justifications des permissions** :
- `host_permissions <all_urls>` :
  > The extension's single purpose is letting the user annotate any web page
  > they choose. The content script must run on the active page to highlight
  > elements and compute CSS selectors. No data is transmitted anywhere.
- `storage` :
  > Saves the user's annotations locally per URL so they reappear on revisit,
  > and remembers the chosen export mode. Local only.
- `downloads` :
  > Saves the annotated-page PNG capture that the user explicitly requests
  > to their Downloads folder.

**Déclarations de confidentialité (onglet Privacy)** :
- Collecte de données : **aucune** (cocher « does not collect user data »)
- Usage distant du code : non · Analytics : non

**Captures d'écran** : 1280×800 (obligatoire, 1 à 5). Idées : ① panneau ouvert
avec 3 annotations typées sur une page, ② l'éditeur avec les puces de type,
③ l'export markdown collé dans un assistant IA, ④ mode sombre.

---

## Rappels

- AMO : gratuit · CWS : 5 $ une seule fois · Edge Add-ons : gratuit (même zip CWS)
- Mise à jour = re-upload d'un zip avec `version` supérieure (penser `build.ps1`)
- Lint local avant chaque soumission : `npx web-ext lint --source-dir dist/firefox`
  (attendu : 0 erreur ; 1 warning Android connu et assumé)
