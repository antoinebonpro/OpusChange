/* OpusChange — script de fond.
 * Bi-compatible : Firefox MV2 (background script) et Chromium MV3
 * (service worker). D'où : browserAction||action, réponse via
 * sendResponse + return true, téléchargement via data-URL
 * (pas de createObjectURL en service worker). */

'use strict';

const B = typeof browser !== 'undefined' ? browser : chrome;
const action = B.browserAction || B.action;

// Clic sur l'icône (ou Alt+Shift+M) → bascule le mode annotation sur l'onglet.
action.onClicked.addListener((tab) => {
  B.tabs.sendMessage(tab.id, { type: 'mkp-toggle' }).catch(() => {
    // Pas de content script ici (page interne, store, ou fichier local
    // sans la permission d'accès aux fichiers).
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
