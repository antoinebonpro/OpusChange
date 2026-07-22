/* OpusChange — analyse d'élément.
 * Produit tout ce qui décrit un élément pour l'IA :
 *  - sélecteur CSS unique le plus court
 *  - chemin complet dans le DOM (body > … > élément)
 *  - contexte de section (conteneur + titre le plus proche)
 *  - styles calculés clés, attributs utiles, extrait HTML
 * Exposé sous window.__mkp pour annotator.js. */

'use strict';

(function () {
  function esc(s) {
    return window.CSS && CSS.escape
      ? CSS.escape(s)
      : String(s).replace(/([^a-zA-Z0-9_-])/g, '\\$1');
  }

  function isUnique(sel) {
    try {
      return document.querySelectorAll(sel).length === 1;
    } catch (e) {
      return false;
    }
  }

  function ownClasses(el) {
    return Array.from(el.classList).filter((c) => c && !c.startsWith('mkp-'));
  }

  /* Description courte d'un nœud : tag#id.classe1.classe2:nth-of-type(n) */
  function describeNode(node, withNth) {
    let part = node.tagName.toLowerCase();
    if (node.id) return part + '#' + esc(node.id);
    const classes = ownClasses(node).slice(0, 2);
    if (classes.length) part += '.' + classes.map(esc).join('.');
    if (withNth !== false) {
      const parent = node.parentElement;
      if (parent) {
        const sameTag = Array.from(parent.children).filter(
          (s) => s.tagName === node.tagName
        );
        if (sameTag.length > 1) {
          part += ':nth-of-type(' + (sameTag.indexOf(node) + 1) + ')';
        }
      }
    }
    return part;
  }

  /* Sélecteur CSS unique le plus court possible. */
  function getSelector(el) {
    if (!(el instanceof Element)) return null;
    if (el.id && isUnique('#' + esc(el.id))) return '#' + esc(el.id);

    const path = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      if (node.id) {
        path.unshift('#' + esc(node.id));
        break;
      }
      path.unshift(describeNode(node));
      const candidate = path.join(' > ');
      if (isUnique(candidate)) return candidate;
      node = node.parentElement;
    }
    return path.join(' > ');
  }

  /* Chemin complet depuis <body> jusqu'à l'élément. */
  function buildFullPath(el) {
    const parts = [];
    let node = el;
    while (node && node !== document.body && node !== document.documentElement) {
      parts.unshift(describeNode(node));
      node = node.parentElement;
    }
    parts.unshift('body');
    if (parts.length > 12) {
      return parts.slice(0, 3).join(' > ') + ' > … > ' + parts.slice(-8).join(' > ');
    }
    return parts.join(' > ');
  }

  /* Section englobante : premier ancêtre "structurant" + son titre. */
  function sectionContext(el) {
    let container = null;
    let node = el.parentElement;
    while (node && node !== document.documentElement && node !== document.body) {
      if (
        /^(SECTION|ARTICLE|MAIN|HEADER|FOOTER|NAV|ASIDE|FORM|DIALOG)$/.test(node.tagName) ||
        node.id ||
        node.getAttribute('role') === 'region'
      ) {
        container = node;
        break;
      }
      node = node.parentElement;
    }
    if (!container) container = document.body;

    // Titre : premier heading dans le conteneur, sinon dernier heading avant l'élément.
    let heading = container.querySelector('h1,h2,h3,h4,h5,h6');
    if (!heading) {
      for (const hd of document.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
        if (hd.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) heading = hd;
        else break;
      }
    }
    return {
      name: heading ? excerpt(heading, 60) : null,
      selector: describeNode(container, false),
      tag: container.tagName.toLowerCase(),
    };
  }

  /* Extrait de texte normalisé. */
  function excerpt(el, max) {
    return (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, max || 90);
  }

  /* Attributs pertinents pour comprendre l'élément. */
  function pickAttrs(el) {
    const keep = ['href', 'src', 'alt', 'placeholder', 'title', 'type', 'name', 'aria-label'];
    const out = {};
    for (const k of keep) {
      const v = el.getAttribute(k);
      if (v) out[k] = v.length > 80 ? v.slice(0, 80) + '…' : v;
    }
    return out;
  }

  /* rgb()/rgba() → #RRGGBB (ou "transparent"). */
  function toHex(rgb) {
    const m = /rgba?\(\s*(\d+)[, ]+(\d+)[, ]+(\d+)(?:[,/ ]+([\d.]+))?\s*\)/.exec(rgb || '');
    if (!m) return rgb || '';
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return 'transparent';
    const h = (x) => (+x).toString(16).padStart(2, '0');
    return ('#' + h(m[1]) + h(m[2]) + h(m[3])).toUpperCase();
  }

  /* Fond effectif : remonte les parents tant que le fond est transparent. */
  function effectiveBackground(el) {
    let node = el;
    while (node && node !== document.documentElement) {
      const hex = toHex(getComputedStyle(node).backgroundColor);
      if (hex && hex !== 'transparent') return hex;
      node = node.parentElement;
    }
    return 'transparent';
  }

  /* Styles calculés clés (utile pour les retouches design). */
  function keyStyles(el) {
    const cs = getComputedStyle(el);
    return {
      color: toHex(cs.color),
      background: effectiveBackground(el),
      fontSize: cs.fontSize,
      fontFamily: (cs.fontFamily || '').split(',')[0].replace(/["']/g, '').trim(),
      fontWeight: cs.fontWeight,
    };
  }

  /* Extrait HTML compact de l'élément. */
  function cleanHTML(el) {
    let html = (el.outerHTML || '').replace(/\s+/g, ' ').trim();
    if (html.length > 300) html = html.slice(0, 300) + '…';
    return html;
  }

  window.__mkp = {
    getSelector,
    describeNode,
    buildFullPath,
    sectionContext,
    excerpt,
    pickAttrs,
    keyStyles,
    cleanHTML,
    toHex,
  };
})();
