/* OpusChange — logique principale d'annotation (v3, multilingue).
 * Survol → surbrillance, clic → annotation typée ancrée à l'élément,
 * panneau déplaçable, capture des erreurs JS, statut résolu,
 * export markdown enrichi (sélecteur + chemin complet + section + styles
 * + HTML + fichier source) et PNG, persistance par URL.
 * Toutes les chaînes visibles passent par browser.i18n (fr/en). */

'use strict';

(function () {
  if (window.__mkpLoaded) return;
  window.__mkpLoaded = true;

  const B = typeof browser !== 'undefined' ? browser : chrome;
  const M = window.__mkp;
  const PAGE_KEY = 'mkp:' + location.origin + location.pathname + location.search;

  /* Traduction : suit la langue de Firefox (fr/en). */
  function t(key, subs) {
    const msg = B.i18n.getMessage(key, subs);
    return msg || key;
  }

  const TYPES = {
    edit: { fr: t('typeEdit'), label: t('typeEdit').toUpperCase() },
    add: { fr: t('typeAdd'), label: t('typeAdd').toUpperCase() },
    remove: { fr: t('typeRemove'), label: t('typeRemove').toUpperCase() },
    bug: { fr: t('typeBug'), label: t('typeBug').toUpperCase() },
    question: { fr: t('typeQuestion'), label: t('typeQuestion').toUpperCase() },
  };

  /** Annotations riches — voir captureRecord() pour la forme. */
  let annotations = [];
  let nextNumber = 1;

  /* Mode d'export : fix (corriger) | improve (améliorer) | audit. */
  const MODE_KEY = 'mkp-mode';
  const MODES = ['fix', 'improve', 'audit'];
  let exportMode = 'fix';

  let uiVisible = false; // panneau + badges affichés
  let picking = false;   // mode "cliquer pour annoter" actif
  let els = {};          // éléments de notre UI
  let resolvedCache = new Map(); // selector -> Element
  let repositionScheduled = false;
  let observer = null;

  /* ------------------------------------------------- erreurs JavaScript */

  const jsErrors = [];

  function pushError(err) {
    const last = jsErrors[jsErrors.length - 1];
    if (last && last.msg === err.msg && last.src === err.src) return; // doublon
    jsErrors.push(err);
    if (jsErrors.length > 15) jsErrors.shift();
    updateErrorsInfo();
  }

  function updateErrorsInfo() {
    if (!els.errorsInfo) return;
    const n = jsErrors.length;
    els.errorsInfo.textContent = n ? t('errorsInfo', [String(n)]) : '';
    els.errorsInfo.style.display = n ? '' : 'none';
  }

  window.addEventListener('error', (e) => {
    try {
      const target = e.target;
      if (target && target !== window && target instanceof Element) {
        // Échec de chargement d'une ressource (image, script, css…).
        const url = target.src || target.href;
        if (url && !isOurUI(target)) {
          pushError({ msg: t('errResource') + ' <' + target.tagName.toLowerCase() + '> ' + url });
        }
        return;
      }
      if (e.message) {
        pushError({ msg: e.message, src: e.filename, line: e.lineno });
      }
    } catch (x) { /* ne jamais casser la page */ }
  }, true);

  window.addEventListener('unhandledrejection', (e) => {
    try {
      const r = e.reason;
      pushError({ msg: t('errPromise') + ' ' + ((r && r.message) || String(r)) });
    } catch (x) { /* ignore */ }
  });

  /* ---------------------------------------------------------- utilitaires */

  function h(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    el.setAttribute('data-mkp', '1');
    return el;
  }

  function isOurUI(target) {
    return target instanceof Element && !!target.closest('[data-mkp]');
  }

  function resolve(selector) {
    let el = resolvedCache.get(selector);
    if (el && el.isConnected) return el;
    try {
      el = document.querySelector(selector);
    } catch (e) {
      el = null;
    }
    if (el) resolvedCache.set(selector, el);
    else resolvedCache.delete(selector);
    return el;
  }

  function save() {
    B.storage.local.set({ [PAGE_KEY]: annotations }).catch(() => {});
    updateCount();
  }

  function updateCount() {
    const open = annotations.filter((a) => !a.done).length;
    B.runtime.sendMessage({ type: 'mkp-count', count: open }).catch(() => {});
    if (els.countPill) {
      els.countPill.textContent = String(open);
      els.countPill.style.display = annotations.length ? '' : 'none';
      els.countPill.title = t('countTitle', [String(open), String(annotations.length)]);
    }
  }

  function renumber() {
    annotations.forEach((a, i) => { a.n = i + 1; });
    nextNumber = annotations.length + 1;
  }

  /* Construit l'enregistrement complet d'une annotation. */
  function captureRecord(target, selector, type, comment) {
    const r = target.getBoundingClientRect();
    return {
      n: nextNumber++,
      type,
      comment,
      selector,
      done: false,
      path: M.buildFullPath(target),
      section: M.sectionContext(target),
      el: {
        tag: target.tagName.toLowerCase(),
        id: target.id || null,
        classes: Array.from(target.classList)
          .filter((c) => !c.startsWith('mkp-'))
          .slice(0, 6),
        text: M.excerpt(target),
        attrs: M.pickAttrs(target),
      },
      rect: {
        w: Math.round(r.width),
        h: Math.round(r.height),
        top: Math.round(r.top + window.scrollY),
      },
      styles: M.keyStyles(target),
      html: M.cleanHTML(target),
    };
  }

  /* Complète les annotations anciennes (sans chemin/section/statut). */
  function enrichLegacy() {
    let changed = false;
    for (const a of annotations) {
      if (!a.type) { a.type = 'edit'; changed = true; }
      if (a.done === undefined) { a.done = false; changed = true; }
      if (!a.el) { a.el = { tag: '', id: null, classes: [], text: a.text || '', attrs: {} }; changed = true; }
      if (!a.path) {
        const target = resolve(a.selector);
        if (target) {
          const fresh = captureRecord(target, a.selector, a.type, a.comment);
          nextNumber--; // captureRecord a incrémenté pour rien
          fresh.n = a.n;
          fresh.done = a.done;
          Object.assign(a, fresh);
          changed = true;
        }
      }
    }
    if (changed) save();
  }

  /* -------------------------------------------------------------- badges */

  function scheduleReposition() {
    if (repositionScheduled) return;
    repositionScheduled = true;
    requestAnimationFrame(() => {
      repositionScheduled = false;
      positionBadges();
    });
  }

  function positionBadges() {
    if (!els.badgeLayer) return;
    for (const badge of els.badgeLayer.children) {
      const selector = badge.getAttribute('data-mkp-selector');
      const target = resolve(selector);
      if (!target) {
        badge.style.display = 'none';
        continue;
      }
      const r = target.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        badge.style.display = 'none';
        continue;
      }
      badge.style.display = '';
      badge.style.top = Math.max(0, r.top - 11) + 'px';
      badge.style.left = Math.max(0, r.left - 11) + 'px';
    }
  }

  function renderBadges(popLast) {
    if (!els.badgeLayer) {
      els.badgeLayer = h('div', 'mkp-badge-layer');
      document.documentElement.appendChild(els.badgeLayer);
    }
    els.badgeLayer.textContent = '';
    for (const a of annotations) {
      const badge = h('div',
        'mkp-badge mkp-t-' + (a.type || 'edit') + (a.done ? ' mkp-done' : ''),
        String(a.n));
      badge.setAttribute('data-mkp-selector', a.selector);
      badge.title = (a.done ? t('resolvedPrefix') : '') +
        '[' + TYPES[a.type || 'edit'].fr + '] ' + a.comment;
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        openPanel();
        flashEntry(a.n);
      });
      if (popLast && a.n === annotations.length) badge.classList.add('mkp-pop');
      els.badgeLayer.appendChild(badge);
    }
    positionBadges();
  }

  /* ----------------------------------------------- surbrillance au survol */

  function ensureHoverUI() {
    if (els.hoverBox) return;
    els.hoverBox = h('div', 'mkp-hover-box');
    els.hoverTip = h('div', 'mkp-hover-tip');
    document.documentElement.appendChild(els.hoverBox);
    document.documentElement.appendChild(els.hoverTip);
  }

  function hideHover() {
    if (els.hoverBox) els.hoverBox.style.display = 'none';
    if (els.hoverTip) els.hoverTip.style.display = 'none';
  }

  function highlightElement(target, withTip) {
    if (!target) return hideHover();
    ensureHoverUI();
    const r = target.getBoundingClientRect();
    els.hoverBox.style.display = 'block';
    els.hoverBox.style.top = r.top + 'px';
    els.hoverBox.style.left = r.left + 'px';
    els.hoverBox.style.width = r.width + 'px';
    els.hoverBox.style.height = r.height + 'px';
    if (withTip) {
      const sel = M.getSelector(target) || target.tagName.toLowerCase();
      els.hoverTip.textContent = sel;
      els.hoverTip.style.display = 'block';
      els.hoverTip.style.top = Math.max(0, r.top - 26) + 'px';
      els.hoverTip.style.left = Math.max(0, r.left) + 'px';
    } else {
      els.hoverTip.style.display = 'none';
    }
  }

  function onMouseMove(e) {
    if (!picking || els.editor) return;
    const target = e.target;
    if (!(target instanceof Element) || isOurUI(target)) {
      hideHover();
      return;
    }
    highlightElement(target, true);
  }

  function onClick(e) {
    if (!picking) return;
    const target = e.target;
    if (!(target instanceof Element) || isOurUI(target)) return;
    e.preventDefault();
    e.stopPropagation();
    if (els.editor) {
      // Un commentaire est en cours : on le termine d'abord.
      const ta = els.editor.querySelector('textarea');
      if (ta) ta.focus();
      return;
    }
    hideHover();
    const selector = M.getSelector(target);
    if (!selector) return;
    openCommentEditor(target, selector);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape' && picking && !els.editor) setPicking(false);
  }

  function setPicking(on) {
    picking = on;
    document.documentElement.classList.toggle('mkp-picking', on);
    if (!on) hideHover();
    if (els.addBtn) {
      els.addBtn.textContent = on ? t('addBtnActive') : t('addBtn');
      els.addBtn.classList.toggle('mkp-btn-active', on);
    }
  }

  /* ---------------------------------------------------- éditeur d'annotation */

  function closeCommentEditor() {
    if (els.editor) {
      els.editor.remove();
      els.editor = null;
    }
  }

  function openCommentEditor(target, selector, existing) {
    closeCommentEditor();
    const r = target ? target.getBoundingClientRect() : null;

    const box = h('div', 'mkp-editor');
    box.appendChild(h('div', 'mkp-editor-selector', selector));

    // Choix du type d'annotation.
    let chosenType = existing ? existing.type || 'edit' : 'edit';
    const chips = h('div', 'mkp-editor-chips');
    for (const [key, type] of Object.entries(TYPES)) {
      const chip = h('button', 'mkp-chip mkp-t-' + key, type.fr);
      chip.setAttribute('aria-pressed', String(key === chosenType));
      chip.addEventListener('click', () => {
        chosenType = key;
        for (const c of chips.children) c.setAttribute('aria-pressed', 'false');
        chip.setAttribute('aria-pressed', 'true');
      });
      chips.appendChild(chip);
    }
    box.appendChild(chips);

    const ta = h('textarea', 'mkp-editor-input');
    ta.placeholder = t('editorPlaceholder');
    if (existing) ta.value = existing.comment;
    box.appendChild(ta);

    const row = h('div', 'mkp-editor-row');
    const okBtn = h('button', 'mkp-btn mkp-btn-primary', existing ? t('btnSave') : t('btnAdd'));
    const cancelBtn = h('button', 'mkp-btn', t('btnCancel'));
    row.appendChild(okBtn);
    row.appendChild(cancelBtn);
    box.appendChild(row);
    document.documentElement.appendChild(box);

    if (r) {
      box.style.top = Math.min(window.innerHeight - 230, Math.max(8, r.bottom + 8)) + 'px';
      box.style.left = Math.min(window.innerWidth - 350, Math.max(8, r.left)) + 'px';
    } else {
      box.style.top = '40%';
      box.style.left = 'calc(50% - 170px)';
    }

    els.editor = box;
    ta.focus();

    okBtn.addEventListener('click', () => {
      const comment = ta.value.trim();
      if (!comment) {
        ta.focus();
        return;
      }
      if (existing) {
        existing.comment = comment;
        existing.type = chosenType;
      } else {
        annotations.push(captureRecord(target, selector, chosenType, comment));
      }
      closeCommentEditor();
      save();
      renderBadges(!existing);
      renderPanelList();
      // On reste en mode annotation pour enchaîner.
    });
    cancelBtn.addEventListener('click', closeCommentEditor);
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeCommentEditor();
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) okBtn.click();
    });
  }

  /* ------------------------------------------------------- mode d'export */

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

  /* ------------------------------------------------------------- panneau */

  function buildPanel() {
    if (els.panel) return;
    const panel = h('div', 'mkp-panel');

    // En-tête (déplaçable).
    const header = h('div', 'mkp-panel-header');
    header.appendChild(h('span', 'mkp-logo-dot'));
    header.appendChild(h('span', 'mkp-panel-title', 'OpusChange'));
    els.countPill = h('span', 'mkp-count-pill', '0');
    header.appendChild(els.countPill);
    header.appendChild(h('span', 'mkp-header-spacer'));
    const collapseBtn = h('button', 'mkp-icon-btn', '–');
    collapseBtn.title = t('collapse');
    collapseBtn.addEventListener('click', () => {
      panel.classList.toggle('mkp-collapsed');
      const collapsed = panel.classList.contains('mkp-collapsed');
      collapseBtn.textContent = collapsed ? '❐' : '–';
      collapseBtn.title = collapsed ? t('expand') : t('collapse');
    });
    header.appendChild(collapseBtn);
    const closeBtn = h('button', 'mkp-icon-btn', '✕');
    closeBtn.title = t('closePanel');
    closeBtn.addEventListener('click', () => hideUI());
    header.appendChild(closeBtn);
    panel.appendChild(header);
    makeDraggable(panel, header);

    const body = h('div', 'mkp-panel-body');

    els.addBtn = h('button', 'mkp-btn mkp-btn-wide', t('addBtn'));
    els.addBtn.addEventListener('click', () => setPicking(!picking));
    body.appendChild(els.addBtn);

    els.list = h('div', 'mkp-panel-list');
    body.appendChild(els.list);

    els.errorsInfo = h('div', 'mkp-errors-info');
    els.errorsInfo.style.display = 'none';
    body.appendChild(els.errorsInfo);

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

    const actions = h('div', 'mkp-panel-actions');
    const copyBtn = h('button', 'mkp-btn mkp-btn-primary', t('copyAI'));
    copyBtn.addEventListener('click', () => copyText(buildMarkdown(), copyBtn, t('copied')));
    const pngBtn = h('button', 'mkp-btn', t('pngBtn'));
    pngBtn.title = t('pngTitle');
    pngBtn.addEventListener('click', () => exportPng(pngBtn));
    const clearBtn = h('button', 'mkp-btn mkp-btn-danger', '🗑');
    clearBtn.title = t('clearAll');
    clearBtn.addEventListener('click', () => {
      annotations = [];
      renumber();
      save();
      renderBadges();
      renderPanelList();
    });
    actions.appendChild(copyBtn);
    actions.appendChild(pngBtn);
    actions.appendChild(clearBtn);
    body.appendChild(actions);

    body.appendChild(h('div', 'mkp-footer', t('footer')));
    panel.appendChild(body);

    document.documentElement.appendChild(panel);
    els.panel = panel;
  }

  function makeDraggable(panel, handle) {
    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      const rect = panel.getBoundingClientRect();
      panel.style.left = rect.left + 'px';
      panel.style.top = rect.top + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      const dx = e.clientX - rect.left;
      const dy = e.clientY - rect.top;
      const move = (ev) => {
        panel.style.left = Math.min(window.innerWidth - 60, Math.max(0, ev.clientX - dx)) + 'px';
        panel.style.top = Math.min(window.innerHeight - 40, Math.max(0, ev.clientY - dy)) + 'px';
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      e.preventDefault();
    });
  }

  function renderPanelList() {
    if (!els.list) return;
    els.list.textContent = '';
    updateCount();
    updateErrorsInfo();
    if (!annotations.length) {
      els.list.appendChild(h('div', 'mkp-empty', t('emptyState')));
      return;
    }
    for (const a of annotations) {
      const entry = h('div', 'mkp-entry' + (a.done ? ' mkp-done' : ''));
      entry.setAttribute('data-mkp-n', String(a.n));

      const head = h('div', 'mkp-entry-head');
      head.appendChild(h('span', 'mkp-entry-num mkp-t-' + (a.type || 'edit'), String(a.n)));
      head.appendChild(a.done
        ? h('span', 'mkp-type-chip mkp-chip-resolved', t('resolvedChip'))
        : h('span', 'mkp-type-chip mkp-t-' + (a.type || 'edit'), TYPES[a.type || 'edit'].fr));
      const selCode = h('code', 'mkp-entry-selector', a.selector);
      if (!resolve(a.selector)) {
        selCode.classList.add('mkp-missing');
        selCode.title = t('missingEl');
      }
      head.appendChild(selCode);
      entry.appendChild(head);

      entry.appendChild(h('div', 'mkp-entry-comment', a.comment));

      const btns = h('div', 'mkp-entry-btns');
      const doneBtn = h('button', 'mkp-mini-btn', a.done ? '↺' : '✓');
      doneBtn.title = a.done ? t('doneReopen') : t('doneMark');
      doneBtn.addEventListener('click', () => {
        a.done = !a.done;
        save();
        renderBadges();
        renderPanelList();
      });
      btns.appendChild(doneBtn);
      const copyOne = h('button', 'mkp-mini-btn', '📄');
      copyOne.title = t('copyOne');
      copyOne.addEventListener('click', () =>
        copyText(annotationMarkdown(a), copyOne, '✓')
      );
      const editBtn = h('button', 'mkp-mini-btn', '✏');
      editBtn.title = t('editOne');
      editBtn.addEventListener('click', () =>
        openCommentEditor(resolve(a.selector), a.selector, a)
      );
      const delBtn = h('button', 'mkp-mini-btn', '🗑');
      delBtn.title = t('deleteOne');
      delBtn.addEventListener('click', () => {
        annotations = annotations.filter((x) => x !== a);
        renumber();
        save();
        renderBadges();
        renderPanelList();
      });
      btns.appendChild(copyOne);
      btns.appendChild(editBtn);
      btns.appendChild(delBtn);
      entry.appendChild(btns);

      // Survoler une entrée surligne l'élément correspondant sur la page.
      entry.addEventListener('mouseenter', () => {
        if (!picking) highlightElement(resolve(a.selector), false);
      });
      entry.addEventListener('mouseleave', () => {
        if (!picking) hideHover();
      });

      els.list.appendChild(entry);
    }
  }

  function flashEntry(n) {
    const entry = els.list && els.list.querySelector('[data-mkp-n="' + n + '"]');
    if (!entry) return;
    entry.scrollIntoView({ block: 'nearest' });
    entry.classList.add('mkp-flash');
    setTimeout(() => entry.classList.remove('mkp-flash'), 1200);
  }

  /* -------------------------------------------------------------- export */

  function annotationTitle(a) {
    const text = a.el && a.el.text;
    if (text) return '« ' + text.slice(0, 40) + (text.length > 40 ? '…' : '') + ' »';
    return a.el && a.el.tag ? t('mdElementFallback') + ' <' + a.el.tag + '>' : t('mdElementFallback');
  }

  function annotationMarkdown(a) {
    const type = TYPES[a.type || 'edit'];
    const lines = [];
    lines.push('## ' + a.n + '. [' + type.label + '] ' + annotationTitle(a));
    lines.push('');
    lines.push('- **' + t('mdSelector') + '** : `' + a.selector + '`');
    if (a.path) lines.push('- **' + t('mdPath') + '** : `' + a.path + '`');
    if (a.section) {
      lines.push('- **' + t('mdSection') + '** : ' +
        (a.section.name ? '« ' + a.section.name + ' » ' : '') +
        '(`' + a.section.selector + '`)');
    }
    if (a.el && a.el.tag) {
      let elLine = '- **' + t('mdElement') + '** : `<' + a.el.tag + '>`';
      if (a.el.id) elLine += ' — ' + t('mdId') + ' : `' + a.el.id + '`';
      if (a.el.classes && a.el.classes.length) {
        elLine += ' — ' + t('mdClasses') + ' : ' +
          a.el.classes.map((c) => '`' + c + '`').join(', ');
      }
      if (a.el.text) elLine += ' — ' + t('mdText') + ' : « ' + a.el.text + ' »';
      lines.push(elLine);
    }
    if (a.el && a.el.attrs && Object.keys(a.el.attrs).length) {
      lines.push('- **' + t('mdAttrs') + '** : ' +
        Object.entries(a.el.attrs).map(([k, v]) => k + '="' + v + '"').join(' · '));
    }
    if (a.rect) {
      lines.push('- **' + t('mdSize') + '** : ' +
        t('mdSizeDetail', [String(a.rect.w), String(a.rect.h), String(a.rect.top)]));
    }
    if (a.styles) {
      const s = a.styles;
      const bits = [];
      if (s.color) bits.push(t('mdStyleText') + ' ' + s.color);
      if (s.background) bits.push(t('mdStyleBg') + ' ' + s.background);
      if (s.fontSize) bits.push(s.fontSize + ' ' + (s.fontFamily || '') +
        (s.fontWeight ? ' (' + s.fontWeight + ')' : ''));
      if (bits.length) lines.push('- **' + t('mdStyles') + '** : ' + bits.join(' · '));
    }
    lines.push('');
    lines.push('**' + t('mdChange') + '**');
    for (const l of a.comment.split('\n')) lines.push('> ' + l);
    if (a.html) {
      lines.push('');
      lines.push('**' + t('mdHtml') + '**');
      lines.push('```html');
      lines.push(a.html);
      lines.push('```');
    }
    return lines.join('\n');
  }

  /* Chemin Windows/Unix du fichier source quand la page est un fichier local. */
  function sourceFilePath() {
    if (location.protocol !== 'file:') return null;
    let p = decodeURIComponent(location.pathname);
    if (/^\/[A-Za-z]:\//.test(p)) p = p.slice(1).replace(/\//g, '\\');
    return p;
  }

  function buildMarkdown() {
    const open = annotations.filter((a) => !a.done);
    const resolved = annotations.filter((a) => a.done);
    const counts = {};
    for (const a of open) {
      const key = TYPES[a.type || 'edit'].fr;
      counts[key] = (counts[key] || 0) + 1;
    }
    const summary = Object.entries(counts).map(([k, v]) => v + '× ' + k).join(', ');
    const file = sourceFilePath();

    const lines = [];
    const titleKey = { fix: 'mdTitleFix', improve: 'mdTitleImprove', audit: 'mdTitleAudit' }[exportMode];
    lines.push('# ' + t(titleKey) + ' — ' + (document.title || location.pathname));
    lines.push('');
    if (file) lines.push('- **' + t('mdFile') + '** : `' + file + '`');
    lines.push('- **URL** : ' + location.href);
    lines.push('- **' + t('mdDate') + '** : ' + new Date().toLocaleString());
    lines.push('- **' + t('mdViewport') + '** : ' + window.innerWidth + '×' + window.innerHeight + ' px');
    lines.push('- **' + t('mdOpen') + '** : ' + open.length + (summary ? ' (' + summary + ')' : ''));
    if (resolved.length) {
      lines.push('- **' + t('mdResolved') + '** : ' + resolved.length + ' ' +
        t('mdResolvedNote', [resolved.map((a) => a.n).join(', ')]));
    }
    lines.push('');
    const instrBase = { fix: 'mdInstrFix', improve: 'mdInstrImprove', audit: 'mdInstrAudit' }[exportMode];
    const instr = t(file ? instrBase + 'File' : instrBase);
    for (const l of instr.split('\n')) lines.push('> ' + l);
    lines.push('');

    if (jsErrors.length) {
      lines.push('## ' + t('mdErrors'));
      lines.push('');
      jsErrors.forEach((err, i) => {
        let l = (i + 1) + '. `' + err.msg + '`';
        if (err.src) l += ' — ' + err.src + (err.line ? ' ' + t('lineAt', [String(err.line)]) : '');
        lines.push(l);
      });
      lines.push('');
    }

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

    lines.push('---');
    lines.push('');
    if (!open.length) {
      lines.push(annotations.length ? t('mdAllResolved') : t('mdNone'));
      lines.push('');
    }
    for (const a of open) {
      lines.push(annotationMarkdown(a));
      lines.push('');
      lines.push('---');
      lines.push('');
    }
    return lines.join('\n');
  }

  function copyText(text, btn, okLabel) {
    const done = () => feedback(btn, okLabel || t('copied'));
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    const ta = h('textarea', 'mkp-hidden-ta');
    ta.value = text;
    document.documentElement.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      done();
    } finally {
      ta.remove();
    }
  }

  function exportPng(btn) {
    setPicking(false);
    closeCommentEditor();
    if (els.panel) els.panel.style.visibility = 'hidden';
    setTimeout(() => {
      B.runtime
        .sendMessage({ type: 'mkp-capture', host: location.hostname || 'local-file' })
        .then((res) => {
          if (els.panel) els.panel.style.visibility = '';
          feedback(btn, res && res.ok ? t('pngOk') : t('pngFail'));
        })
        .catch(() => {
          if (els.panel) els.panel.style.visibility = '';
          feedback(btn, t('pngFail'));
        });
    }, 150);
  }

  function feedback(btn, text) {
    const original = btn.textContent;
    btn.textContent = text;
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 1500);
  }

  /* ------------------------------------------------- affichage / cycle de vie */

  function openPanel() {
    buildPanel();
    els.panel.style.display = '';
    renderPanelList();
  }

  function showUI() {
    uiVisible = true;
    openPanel();
    renderBadges();
    startTracking();
    if (!annotations.length) setPicking(true);
  }

  function hideUI() {
    uiVisible = false;
    setPicking(false);
    closeCommentEditor();
    if (els.panel) els.panel.style.display = 'none';
    if (els.badgeLayer) els.badgeLayer.textContent = '';
    stopTracking();
  }

  function startTracking() {
    window.addEventListener('scroll', scheduleReposition, { passive: true, capture: true });
    window.addEventListener('resize', scheduleReposition, { passive: true });
    if (!observer) observer = new MutationObserver(scheduleReposition);
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function stopTracking() {
    window.removeEventListener('scroll', scheduleReposition, { capture: true });
    window.removeEventListener('resize', scheduleReposition);
    if (observer) observer.disconnect();
  }

  /* ------------------------------------------------------------ écouteurs */

  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);

  B.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'mkp-toggle') {
      uiVisible ? hideUI() : showUI();
    }
  });

  /* --------------------------------------------- restauration au chargement */

  B.storage.local.get([PAGE_KEY, MODE_KEY]).then((data) => {
    if (data && MODES.includes(data[MODE_KEY])) exportMode = data[MODE_KEY];
    const saved = data && data[PAGE_KEY];
    if (Array.isArray(saved) && saved.length) {
      annotations = saved;
      renumber();
      enrichLegacy();
      // Des annotations existent pour cette page : on réaffiche les badges.
      uiVisible = true;
      openPanel();
      renderBadges();
      startTracking();
    }
    updateCount();
  }).catch(() => {});
})();
