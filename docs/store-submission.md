# Kit de soumission aux stores — OpusChange v4.0.1

Textes prêts à coller dans les formulaires AMO et Chrome Web Store.
Fichiers à uploader : `dist/opuschange-firefox-4.0.1.zip` (AMO) et
`dist/opuschange-chrome-4.0.1.zip` (CWS) — régénérés par `build.ps1`.

---

## 🦊 addons.mozilla.org (AMO) — formulaire champ par champ

**Nom** :
> OpusChange

**Adresse URL du module (slug)** : garder `opuschange`

**Résumé** (déjà rempli depuis le manifest — le garder) :
> Annotate any web page by clicking its elements and export precise AI-ready instructions (CSS selectors, paths, styles). 100% local.

**Description** (markdown supporté — les 250 premiers caractères portent l'essentiel) :

```markdown
OpusChange turns visual feedback into instructions an AI coding assistant (Claude Code, ChatGPT, Copilot…) can execute precisely. Click any element, describe the change, and export selectors, DOM paths, styles and JS errors — 100% locally.

**How it works**
1. Click the OpusChange icon (or Alt+Shift+M)
2. Hover the page — elements highlight like the DevTools inspector
3. Click an element, pick a type (Edit · Add · Remove · Bug · Question) and write your comment
4. Copy the export and paste it into your AI assistant

**What each annotation captures**
- Unique CSS selector + full DOM path
- Section context, computed styles, attributes, HTML snippet

**Built for iteration**
- 3 export modes: Fix (strict repairs), Improve (the AI also suggests better), Audit (report only)
- JavaScript errors on the page are captured and included
- Mark annotations as resolved and re-export only what remains
- Annotations persist per URL; PNG capture with badges

**Privacy**: no account, no server, no network requests. Nothing leaves your browser unless you copy or download the export yourself. Interface in English and French.
```

**Ce module est expérimental ?** → Non (ne pas cocher)

**Nécessite un paiement / services payants ?** → Non (ne pas cocher)

**Catégories (max 3)** → **Développement web** (une seule suffit, c'est la bonne)

**E-mail d'assistance** : optionnel et **visible publiquement** — mettre son
adresse ou laisser vide

**Site d'assistance** :
> https://github.com/antoinebonpro/OpusChange/issues

**Licence** → **Licence MIT** (correspond au fichier LICENSE du dépôt)

**Ce module a une politique de confidentialité ?** → Oui, cocher et coller :
> OpusChange does not collect, store, transmit or share any user data. All
> annotations are stored locally in your browser's extension storage and never
> leave your device. The extension makes no network requests. The only data
> that leaves the browser is the export you explicitly copy to your clipboard
> or the PNG capture you download yourself.

**Notes aux testeurs** :
> - Single purpose: annotate elements of any page the user chooses and export
>   precise change instructions for AI coding assistants — this is why the
>   content script requests <all_urls>.
> - No remote code, no analytics, no network requests at all. Data collection:
>   none (declared via data_collection_permissions in the manifest).
> - The submitted code is the original, unminified source — no build step, no
>   bundler. Public repository: https://github.com/antoinebonpro/OpusChange
> - To test: open any website, click the toolbar icon (or Alt+Shift+M), click
>   an element, type a comment, then press the copy button. Try the
>   Fix / Improve / Audit chips to see the three export variants.

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
