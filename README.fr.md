# OpusChange

> 🇬🇧 [English version](README.md)

**Annotez n'importe quelle page web en cliquant sur ses éléments, puis exportez
des instructions ultra-précises pour votre IA** (Claude Code, ChatGPT, Copilot…).

Chaque annotation capture non seulement le **sélecteur CSS** de l'élément, mais
aussi son **chemin complet dans le DOM**, la **section** où il se trouve, ses
**styles**, ses **attributs** et son **HTML** — l'IA sait *exactement* quoi
modifier et où. L'export inclut aussi le **chemin du fichier à modifier** (pages
locales) et les **erreurs JavaScript** détectées, et le statut **✓ Résolu**
permet d'itérer jusqu'à la perfection.

> 100 % local : pas de compte, pas de serveur, aucune donnée envoyée.
> Interface en **français et anglais** (suit la langue de votre Firefox).

---

## Fonctionnalités

| Fonctionnalité | |
|---|---|
| Annotation par clic avec surbrillance (comme l'inspecteur DevTools) | ✅ |
| Sélecteur CSS unique + **chemin DOM complet** par annotation | ✅ |
| **Contexte de section** (conteneur + titre le plus proche) | ✅ |
| **Styles** calculés (couleur, fond, police), attributs, extrait HTML | ✅ |
| 5 types : Modifier · Ajouter · Supprimer · Bug · Question (badges colorés) | ✅ |
| Badges ancrés aux éléments (suivent le scroll et la mise en page) | ✅ |
| **Capture des erreurs JavaScript** (erreurs, promesses rejetées, ressources manquantes) | ✅ |
| **Chemin du fichier à modifier** dans l'export (pages locales) | ✅ |
| Statut **✓ Résolu** par annotation — ré-export de ce qui reste seulement | ✅ |
| Export markdown (presse-papier) + capture PNG avec badges | ✅ |
| Sauvegarde par URL (annotations restaurées au retour) | ✅ |
| Panneau déplaçable et repliable · mode sombre · compteur sur l'icône | ✅ |
| **Modes d'export** : Corriger · Améliorer · Audit (adapte instructions et contenu) | ✅ |
| **Build Chrome / Edge / Brave / Arc** (MV3, même code) | ✅ |

## Installation

### Chargement dans Firefox (2 minutes)

1. Ouvrez Firefox et allez sur **`about:debugging`**
2. Cliquez sur **« Ce Firefox »** dans le menu de gauche
3. Cliquez sur **« Charger un module complémentaire temporaire… »**
4. Sélectionnez le fichier **`manifest.json`** de ce dossier
5. L'icône OpusChange apparaît dans la barre d'outils 🎉

> ⚠️ Une extension temporaire est retirée à la **fermeture de Firefox** —
> rechargez-la au prochain démarrage (2 clics dans `about:debugging`).
> Après une modification du code, cliquez simplement sur **« Recharger »**.

### Pour annoter des fichiers locaux (`file://`)

Firefox bloque par défaut l'accès des extensions aux fichiers locaux :

1. Allez sur **`about:addons`** → cliquez sur **OpusChange**
2. Onglet **« Permissions »** → activez **« Accéder aux fichiers locaux sur votre ordinateur »**
3. Rechargez votre fichier HTML (**F5**)

*Alternative : servez votre dossier en local — `python -m http.server 8000` —
puis ouvrez `http://localhost:8000/votre-page.html`.*

### Installer sur Chrome / Edge / Brave / Arc

1. Lancez `powershell -File build.ps1` (crée `dist/chrome`)
2. Ouvrez **`chrome://extensions`** (ou `edge://extensions`, `brave://extensions`)
3. Activez le **Mode développeur** (en haut à droite)
4. Cliquez **« Charger l'extension non empaquetée »** et sélectionnez le dossier **`dist/chrome`**
5. Pour les fichiers locaux : ouvrez les détails de l'extension et activez
   **« Autoriser l'accès aux URL de fichier »**

### Installation permanente (optionnel)

Firefox exige que les extensions permanentes soient signées par Mozilla :
soumettez le dossier zippé sur [addons.mozilla.org](https://addons.mozilla.org)
en mode **« non listé »** (reste privé), récupérez le `.xpi` signé en quelques
minutes, installez-le par double-clic.

## Utilisation

1. Cliquez sur **l'icône OpusChange** (ou **Alt+Shift+M**) → le panneau s'ouvre,
   le curseur devient une croix
2. **Survolez** la page : chaque élément se surligne avec son sélecteur CSS
3. **Cliquez** sur un élément → choisissez le **type** (Modifier · Ajouter ·
   Supprimer · Bug · Question) → tapez votre commentaire → **Ajouter**
4. Un **badge numéroté coloré** s'ancre à l'élément ; enchaînez autant
   d'annotations que vous voulez
5. Exportez :
   - **📋 Copier pour l'IA** → tout le markdown dans le presse-papier
   - **📸 PNG** → capture de la page avec les badges (dossier Téléchargements)

Choisissez un **mode d'export** au-dessus du bouton de copie : **Corriger**
(réparations strictes uniquement), **Améliorer** (l'IA propose aussi mieux :
design, accessibilité, performances) ou **Audit** (rapport seulement, rien n'est
modifié). Les exports Améliorer et Audit incluent un **plan de la page**
(titres h1-h3 avec leurs sélecteurs). Votre choix est mémorisé.

### La boucle de perfection 🔄

1. Annotez, puis **📋 Copier pour l'IA** — l'export contient le **fichier à
   modifier** (pages locales) et les **erreurs JavaScript** détectées
2. Collez dans Claude Code : il ouvre le fichier, débogue, améliore
3. Rechargez la page (**F5**) — vos annotations réapparaissent
4. Cochez **✓** ce qui est réglé (badge grisé), ré-exportez : seules les
   annotations **restantes** partent à l'IA
5. Répétez jusqu'à **0 à traiter** = perfection atteinte 🎯

Le compteur sur l'icône Firefox affiche le nombre d'annotations *restant à traiter*.

### Raccourcis

| Raccourci | Action |
|---|---|
| `Alt+Shift+M` | Ouvrir/fermer OpusChange sur la page |
| `Échap` | Arrêter le mode annotation |
| `Ctrl+Entrée` | Valider le commentaire en cours |

## Exemple d'export

Ce que **📋 Copier pour l'IA** met dans votre presse-papier (dans la langue de
votre Firefox) :

```markdown
# Annotations — Ma page d'accueil

- **Fichier à modifier** : `C:\Users\vous\Projets\mon-site\index.html`
- **URL** : file:///C:/Users/vous/Projets/mon-site/index.html
- **Date** : 22/07/2026 15:04
- **Fenêtre** : 1920×947 px
- **À traiter** : 2 (1× Modifier, 1× Supprimer)
- **Déjà résolues** : 1 (n° 1) — ne pas y retoucher

> **Instructions pour l'IA** : chaque annotation ci-dessous identifie un élément
> précis de la page par son sélecteur CSS et son chemin complet dans le DOM.
> Ouvre le fichier indiqué ci-dessus, applique chaque changement demandé
> à l'élément correspondant, et corrige les erreurs JavaScript listées.

## ⚠ Erreurs JavaScript détectées sur la page

1. `TypeError: cart is undefined` — script.js ligne 42

---

## 2. [MODIFIER] « Commencer »

- **Sélecteur CSS** : `#hero button.cta`
- **Chemin complet** : `body > main > section#hero > div.container > button.cta`
- **Section** : « Créez votre site en 5 minutes » (`section#hero`)
- **Élément** : `<button>` — classes : `cta`, `btn-primary` — texte : « Commencer »
- **Taille** : 182×48 px — à ≈520 px du haut de la page
- **Styles** : texte #FFFFFF · fond #2563EB · 16px Inter (600)

**Changement demandé :**
> Ce bouton doit ouvrir une modale au lieu de rediriger

**HTML actuel :**
```html
<button class="cta btn-primary">Commencer</button>
```
```

## Dépannage

| Problème | Solution |
|---|---|
| Le clic sur l'icône ne fait rien | La page était ouverte **avant** le chargement de l'extension → **F5** |
| Ne marche pas sur un fichier local | Activez la permission « Accéder aux fichiers locaux » (voir Installation), puis **F5** |
| L'extension a disparu | Firefox a été redémarré → rechargez-la dans `about:debugging` |
| Ne marche pas sur `about:…` ou addons.mozilla.org | Normal : pages protégées par Firefox |
| Sélecteur barré dans le panneau | L'élément n'existe plus sur la page — l'annotation est conservée quand même |

## Structure du code

| Fichier | Rôle |
|---|---|
| `manifest.json` | Déclaration Firefox (MV2) |
| `manifest.chrome.json` | Manifest Chromium (MV3), utilisé par le build |
| `build.ps1` | Assemble `dist/firefox`, `dist/chrome` et les zips |
| `background.js` | Clic sur l'icône, compteur, capture PNG |
| `content/selector.js` | Analyse d'élément : sélecteur unique, chemin complet, section, styles, HTML |
| `content/annotator.js` | Surbrillance, badges, panneau, éditeur, export, persistance |
| `content/annotator.css` | Design de l'overlay (préfixe `mkp-`, mode sombre auto) |
| `_locales/en`, `_locales/fr` | Traductions de l'interface (anglais, français) |

## Confidentialité

- Aucune requête réseau, aucun serveur, aucun compte
- Les annotations restent dans le stockage local de **votre** Firefox
- Le seul moment où une donnée « sort » : quand **vous** copiez ou téléchargez l'export

## Idées pour la suite

- Analyse automatique de la page (alt manquants, images lourdes, liens vides…) créant des annotations pré-remplies
- Capture d'écran individuelle par élément annoté
- Export JSON structuré
- Publication sur les stores (addons.mozilla.org, Chrome Web Store)

## Licence

[MIT](LICENSE)
