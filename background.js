/* OpusChange — script de fond.
 * Rôle : réagir au clic sur l'icône (activer/désactiver l'annotation
 * sur l'onglet courant), afficher le compteur d'annotations sur
 * l'icône, et gérer la capture d'écran PNG. */

'use strict';

const B = typeof browser !== 'undefined' ? browser : chrome;

// Clic sur l'icône (ou Alt+Shift+M) → on demande au content script
// de basculer le mode annotation sur cet onglet.
B.browserAction.onClicked.addListener((tab) => {
  B.tabs.sendMessage(tab.id, { type: 'mkp-toggle' }).catch(() => {
    // Pas de content script ici (page interne about:, addons.mozilla.org,
    // ou fichier local sans la permission « Accéder aux fichiers locaux »).
    console.warn('OpusChange: cannot annotate this page (protected page or missing permission).');
  });
});

B.runtime.onMessage.addListener((msg, sender) => {
  if (!msg) return;

  // Compteur d'annotations affiché sur l'icône, par onglet.
  if (msg.type === 'mkp-count' && sender.tab) {
    B.browserAction.setBadgeText({
      text: msg.count > 0 ? String(msg.count) : '',
      tabId: sender.tab.id,
    });
    B.browserAction.setBadgeBackgroundColor({ color: '#dc2626', tabId: sender.tab.id });
    return;
  }

  // Capture PNG de la zone visible, téléchargée dans le dossier Téléchargements.
  if (msg.type === 'mkp-capture' && sender.tab) {
    return B.tabs
      .captureVisibleTab(sender.tab.windowId, { format: 'png' })
      .then((dataUrl) => fetch(dataUrl))
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const host = (msg.host || 'page').replace(/[^a-z0-9.-]/gi, '_');
        const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        return B.downloads.download({
          url,
          filename: `annotations-${host}-${date}.png`,
          saveAs: false,
        });
      })
      .then(() => ({ ok: true }))
      .catch((e) => ({ ok: false, error: String(e) }));
  }
});
