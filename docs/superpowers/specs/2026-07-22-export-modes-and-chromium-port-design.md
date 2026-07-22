# Spec — Modes d'export & portage Chromium

Date : 2026-07-22 · Projet : OpusChange v3.1.0 → v4.0.0 · Statut : validée (design approuvé en brainstorming)

## Contexte

OpusChange (Firefox, MV2, i18n fr/en) exporte des annotations de page en markdown
pour une IA. Deux évolutions validées, à livrer **dans cet ordre** :

1. **Modes d'export** Corriger / Améliorer / Audit — adapte instructions **et** contenu
2. **Portage Chromium** (Chrome, Edge, Brave, Arc) — un seul code, deux manifests

---

## Chantier 1 — Modes d'export

### UI

- Rangée de 3 puces (réutilise `.mkp-chip`) insérée entre la ligne d'info erreurs
  et les boutons d'export : `Corriger · Améliorer · Audit` (une seule active,
  `aria-pressed`).
- Mode mémorisé **globalement** dans `storage.local`, clé `mkp-mode`,
  valeurs `fix | improve | audit`, défaut `fix`. Restauré à l'ouverture du panneau.
- Le bouton « 📋 Copier pour l'IA » reste unique et copie selon le mode actif.

### Effet de chaque mode sur l'export

Structure commune conservée : en-tête → instructions → erreurs JS → [plan de la
page] → annotations ouvertes. PNG, statut ✓ Résolu, « Déjà résolues » : inchangés.

| Élément | fix | improve | audit |
|---|---|---|---|
| Titre H1 | « Corrections — {page} » | « Améliorations — {page} » | « Demande d'audit — {page} » |
| Instructions | Réparer exactement ce qui est demandé, ne rien changer d'autre, corriger les erreurs JS en priorité | Appliquer les changements ET proposer des améliorations connexes (design, accessibilité, performances), en les listant | Ne rien modifier ; analyser la page et les points annotés ; rapport structuré : problèmes par sévérité + recommandations |
| Section « Plan de la page » | non | oui | oui |
| Erreurs JS | incluses (citées prioritaires dans les instructions) | incluses | incluses (matière d'analyse) |

### Plan de la page (nouveau)

- `pageOutline()` dans `content/selector.js` : parcourt `h1, h2, h3` (30 max),
  retourne `[{ level, text (≤60 c), selector }]` (sélecteur via `getSelector`).
- Rendu markdown, une ligne par titre : `- h2 « Nos tarifs » — \`section#pricing > h2\``.

### i18n (×2 langues)

- Nouvelles clés : `modeFix`, `modeImprove`, `modeAudit` (libellés puces),
  `modeFixTip`, `modeImproveTip`, `modeAuditTip` (tooltips),
  `mdTitleFix`, `mdTitleImprove`, `mdTitleAudit`,
  `mdInstrFix`, `mdInstrFixFile`, `mdInstrImprove`, `mdInstrImproveFile`,
  `mdInstrAudit`, `mdInstrAuditFile` (multilignes `\n`, rendues préfixées `> `),
  `mdOutline` (« Plan de la page » / « Page outline »).
- Clés supprimées (remplacées par les variantes fix) : `mdTitle`,
  `mdInstructions`, `mdInstructionsFile`.

---

## Chantier 2 — Portage Chromium

### Manifests

- `manifest.json` (Firefox, MV2) : **inchangé** — MV2 choisi exprès pour
  l'auto-injection des content scripts (MV3 Firefox rend les host permissions
  optionnelles).
- `manifest.chrome.json` (MV3) nouveau :
  - `"manifest_version": 3`, mêmes `name/description/version/default_locale/icons`
    (`__MSG___` + PNG — Chrome refuse les SVG, les PNG existent déjà)
  - `"action"` (remplace `browser_action`), mêmes icônes/titre
  - `"background": { "service_worker": "background.js" }`
  - `"permissions": ["storage", "clipboardWrite", "downloads"]`,
    `"host_permissions": ["<all_urls>"]` (auto-accordées à l'installation sur Chrome)
  - `content_scripts` identiques (`<all_urls>`)
  - `"commands": { "_execute_action": … }` (équivalent MV3 de
    `_execute_browser_action`)
  - pas de `browser_specific_settings`

### background.js bi-compatible

- `const action = B.action || B.browserAction;` puis `action.*` partout
  (`onClicked`, `setBadgeText`, `setBadgeBackgroundColor`).
- Capture PNG : suppression de `fetch → blob → createObjectURL`
  (indisponible en service worker MV3) → `downloads.download({ url: dataUrl })`
  directement. Les data-URL sont acceptées par Firefox et Chrome ; un seul
  chemin de code pour les deux.
- Aucun état persistant en mémoire (déjà le cas) → compatible service worker.

### Content scripts

- Aucun changement : garde `browser || chrome` déjà en place, `storage`,
  `i18n`, `runtime.sendMessage` identiques sur les deux moteurs.

### Build

- `build.ps1` à la racine :
  1. lit la version dans `manifest.json`
  2. assemble `dist/firefox/` (fichiers communs + `manifest.json`)
     et `dist/chrome/` (fichiers communs + `manifest.chrome.json` renommé
     `manifest.json`)
  3. fichiers communs : `background.js`, `content/`, `_locales/`,
     `icons/*.png`, `LICENSE` (exclus : `Logo.jpg`, docs, mail)
  4. produit `dist/opuschange-firefox-{version}.zip` et
     `dist/opuschange-chrome-{version}.zip` (Compress-Archive)
- `.gitignore` : ajouter `dist/`.

### Documentation

- `README.md` + `README.fr.md` : section « Install on Chrome / Edge / Brave / Arc »
  (`chrome://extensions` → Developer mode → Load unpacked → `dist/chrome`),
  note file:// (« Allow access to file URLs » dans les détails de l'extension),
  mention du script de build. Tableau des navigateurs supportés mis à jour.

### Version

- Livraison des deux chantiers = **v4.0.0** dans les deux manifests.

---

## Critères d'acceptation

**Modes** — sur Firefox :
1. Les 3 puces s'affichent, une seule active, le choix survit à un rechargement
   de la page et de Firefox (storage global).
2. Copie en mode fix : titre « Corrections », instructions strictes, pas de plan.
3. Copie en mode improve : titre « Améliorations », instructions d'amélioration,
   section « Plan de la page » présente avec titres h1-h3 + sélecteurs.
4. Copie en mode audit : titre « Demande d'audit », instructions « ne rien
   modifier », plan présent.
5. Interface et export corrects en fr ET en en.

**Portage** — sur Chrome (ou Edge/Brave/Arc) :
6. `build.ps1` produit `dist/firefox/`, `dist/chrome/` et les deux zips sans erreur.
7. `dist/chrome` se charge dans `chrome://extensions` sans avertissement bloquant.
8. Annoter, copier (3 modes), PNG, compteur d'icône, persistance : fonctionnels.
9. Firefox (dossier racine ou `dist/firefox`) : aucun comportement régressé.

## Hors périmètre

Analyse automatique de la page (audit *exécuté par l'extension*), export JSON,
capture par élément, publication sur les stores (AMO / Chrome Web Store).
