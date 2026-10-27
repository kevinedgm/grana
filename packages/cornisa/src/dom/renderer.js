/**
 * Renderer DOM de cornisa: gota SVG anclada al borde superior, contenido HTML
 * no deformable, regiones vivas, teclado y gestión de foco no modal.
 * @module cornisa/dom/renderer
 */
import { Drop, silhouette } from '../core/drop.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ROW_H = 44, GAP_TOP = 4, GAP_BOTTOM = 4, PROGRESS_H = 8, SIDE_MARGIN = 12;
// Iconos dibujados: un solo trazo (2 px en viewBox 24) y una sola familia. Paths como datos, nunca innerHTML.
const ICON_PATHS = {
  neutral: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 16v-5', 'M12 8h.01'],
  success: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'm8 12.5 2.5 2.5L16 9.5'],
  warning: ['M10.3 3.9 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z', 'M12 9v4', 'M12 17h.01'],
  error: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'm15 9-6 6', 'm9 9 6 6'],
  chevron: ['m6 9 6 6 6-6'],
};

/** @typedef {{ close: string, more: (waiting: number) => string }} Labels */
/** @type {Readonly<Labels>} */
export const DEFAULT_LABELS = Object.freeze({
  close: 'Close',
  more: (n) => `Show next notification (${n} waiting)`,
});

/**
 * @param {ReturnType<import('../core/manager.js').createManager>} manager
 * @param {{ container?: HTMLElement, labels?: Partial<Labels>, emit: (type: string, detail: any) => void, shortcut?: { aria: string, matches: (e: KeyboardEvent) => boolean } | null }} options
 */
export function createRenderer(manager, options) {
  const doc = (options.container && options.container.ownerDocument) || document;
  const win = doc.defaultView;
  const container = options.container || doc.body;
  const labels = { ...DEFAULT_LABELS, ...(options.labels || {}) };
  // Registro manual de listeners: `addEventListener({ signal })` exige Chrome 90 / FF 86 / Safari 15 (por encima del suelo)
  const offs = [];
  const listen = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); offs.push(() => target.removeEventListener(type, fn, opts)); };
  // Element.replaceChildren exige Chrome/Edge 86 y FF 78 (por encima del suelo)
  const setChildren = (parent, ...nodes) => { while (parent.firstChild) parent.removeChild(parent.firstChild); for (const n of nodes) parent.appendChild(n); };
  const el = (tag, cls, attrs = {}) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    for (const k of Object.keys(attrs)) n.setAttribute(k, attrs[k]);
    return n;
  };
  const uid = `cornisa-${Math.random().toString(36).slice(2, 8)}`;
  function drawIcon(name) {
    const svgEl = doc.createElementNS(SVG_NS, 'svg');
    const attrs = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false' };
    for (const k of Object.keys(attrs)) svgEl.setAttribute(k, attrs[k]);
    for (const d of ICON_PATHS[name]) { const pth = doc.createElementNS(SVG_NS, 'path'); pth.setAttribute('d', d); svgEl.append(pth); }
    return svgEl;
  }

  /* ── estructura ───────────────────────────────────────────────────── */
  const live = el('div', 'cornisa-sr', { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const alert = el('div', 'cornisa-sr', { role: 'alert', 'aria-atomic': 'true' });
  const probe = el('div', 'cornisa-probe', { 'aria-hidden': 'true' });
  const measure = el('div', 'cornisa-measure', { 'aria-hidden': 'true' });
  const root = el('div', 'cornisa');
  const usePopover = typeof win.HTMLElement === 'function' && 'popover' in win.HTMLElement.prototype && typeof root.showPopover === 'function';
  if (usePopover) root.setAttribute('popover', 'manual');
  root.hidden = !usePopover; // con popover, el UA lo oculta hasta showPopover()

  const svg = doc.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'cornisa-shape'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
  const path = doc.createElementNS(SVG_NS, 'path');
  svg.append(path);

  const ui = el('div', 'cornisa-ui', { role: 'group', 'aria-labelledby': `${uid}-title` });
  const row = el('div', 'cornisa-row');
  const toggle = el('button', 'cornisa-toggle', { type: 'button', 'aria-expanded': 'false', 'aria-controls': `${uid}-detail` });
  const icon = el('span', 'cornisa-icon', { 'aria-hidden': 'true' });
  const title = el('span', 'cornisa-title', { id: `${uid}-title` });
  const meta = el('span', 'cornisa-meta');
  const chevron = drawIcon('chevron'); chevron.setAttribute('class', 'cornisa-chevron');
  toggle.append(icon, title, meta, chevron);
  const quick = el('button', 'cornisa-quick', { type: 'button' });   // D3-01: 1.ª acción visible en compacto
  quick.hidden = true;
  const more = el('button', 'cornisa-more', { type: 'button' });
  more.hidden = true;
  row.append(toggle, quick, more);
  const progress = el('div', 'cornisa-progress', { role: 'progressbar', 'aria-labelledby': `${uid}-title`, 'aria-valuemin': '0', 'aria-valuemax': '100' });
  const bar = el('span', 'cornisa-progress-bar');
  progress.append(bar); progress.hidden = true;
  const detail = el('div', 'cornisa-detail', { id: `${uid}-detail` });
  detail.hidden = true;
  const body = el('p', 'cornisa-body');
  const actions = el('div', 'cornisa-actions');
  detail.append(body, actions);
  ui.append(row, progress, detail);
  root.append(svg, ui);
  container.append(live, alert, probe, measure, root);

  /* ── estado del renderer ──────────────────────────────────────────── */
  const drop = new Drop();
  let shownId = null, shown = null, pendingId = null; // contenido en pantalla / pendiente de entrar
  let raf = 0, last = 0, timerTick = 0, reserved = -1, returnFocus = null, destroyed = false;
  let dims = null, fading = null, focusInside = false;
  const mql = win.matchMedia ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const reduced = () => !!(mql && mql.matches);
  manager.setAutoAck(false);

  /* ── medición ─────────────────────────────────────────────────────── */
  const px = (v) => parseFloat(v) || 0;
  function metrics() {
    const cs = win.getComputedStyle(probe);
    const vw = doc.documentElement.clientWidth || win.innerWidth;
    const vh = doc.documentElement.clientHeight || win.innerHeight;
    const maxW = Math.max(120, Math.min(px(cs.width) || 400, vw - 2 * SIDE_MARGIN));
    return { safe: px(cs.paddingTop), vw, vh, maxW, radius: px(cs.borderTopLeftRadius) || 24 };
  }
  function computeDims(c) {
    const m = metrics();
    const top = m.safe + GAP_TOP;
    const clone = ui.cloneNode(true);
    clone.removeAttribute('id'); clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    clone.removeAttribute('data-expanded'); clone.removeAttribute('data-detail');
    clone.style.width = 'max-content'; clone.style.maxWidth = `${m.maxW}px`;
    clone.querySelector('.cornisa-detail').hidden = true;
    setChildren(measure, clone);
    const compactW = Math.min(m.maxW, Math.ceil(clone.querySelector('.cornisa-row').getBoundingClientRect().width));
    clone.style.width = `${m.maxW}px`; clone.setAttribute('data-expanded', '');
    clone.querySelector('.cornisa-detail').hidden = false;
    const exH = clone.getBoundingClientRect().height;
    setChildren(measure);
    const prog = c.progress != null ? PROGRESS_H : 0;
    // adapt: en pantallas bajas (p. ej. móvil horizontal + texto 200 %) el expandido se limita al viewport
    // y el detalle se desplaza dentro; nada queda fuera de alcance (WCAG 1.4.10 / 1.4.4)
    const maxH = Math.max(top + ROW_H + GAP_BOTTOM, m.vh - 8);
    const expandedH = Math.min(Math.ceil(top + exH), maxH);
    dims = { compactW, compactH: top + ROW_H + prog + GAP_BOTTOM, expandedW: m.maxW, expandedH, top, cx: m.vw / 2, radius: m.radius, vw: m.vw, scroll: Math.ceil(top + exH) > maxH };
    return dims;
  }

  /* ── contenido (solo textContent; iconos = Node clonado) ──────────── */
  function fill(a, waiting) {
    const c = a.content;
    ui.dataset.intent = c.intent;
    if (c.icon) setChildren(icon, c.icon.cloneNode(true));
    else if (icon.dataset.drawn !== c.intent) { setChildren(icon, drawIcon(c.intent)); icon.dataset.drawn = c.intent; }
    if (c.icon) delete icon.dataset.drawn;
    title.textContent = c.title;
    renderMeta(c);
    if (c.progress != null) {
      progress.hidden = false;
      if (c.progress === 'indeterminate') { progress.removeAttribute('aria-valuenow'); progress.dataset.indeterminate = ''; bar.style.width = ''; }
      else { progress.setAttribute('aria-valuenow', String(Math.round(c.progress))); delete progress.dataset.indeterminate; bar.style.width = `${c.progress}%`; }
    } else progress.hidden = true;
    body.textContent = c.body || ''; body.hidden = !c.body;
    // solo se reconstruyen si cambian las etiquetas: reconstruir botones haría perder el foco
    const key = JSON.stringify(c.actions.map((x) => x.label));
    if (actions.dataset.key !== key) {
      actions.dataset.key = key;
      setChildren(actions, ...c.actions.map((x, i) => {
        const b = el('button', i === 0 ? 'cornisa-action cornisa-action--primary' : 'cornisa-action', { type: 'button' });
        b.textContent = x.label; b.dataset.index = String(i); return b;
      }), (() => { const b = el('button', 'cornisa-close', { type: 'button' }); b.textContent = labels.close; return b; })());
    }
    toggle.setAttribute('aria-expanded', String(a.state === 'expanded'));
    const first = c.actions[0];
    quick.hidden = !first;
    if (first && quick.textContent !== first.label) quick.textContent = first.label;
    more.hidden = waiting === 0;
    if (waiting > 0) { more.textContent = `+${waiting}`; more.setAttribute('aria-label', labels.more(waiting)); }
  }
  function renderMeta(c) {
    if (c.timer) {
      const s = Math.max(0, Math.ceil((c.timer.endsAt - Date.now()) / 1000));
      meta.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      meta.setAttribute('role', 'timer'); meta.removeAttribute('aria-hidden');
    } else {
      meta.removeAttribute('role');
      meta.textContent = typeof c.progress === 'number' ? `${Math.round(c.progress)}%` : '';
      meta.setAttribute('aria-hidden', 'true'); // el progressbar ya lo expone
    }
  }
  function syncTimerTick() {
    const need = !!(shown && shown.content.timer) && drop.visible;
    if (need && !timerTick) timerTick = win.setInterval(() => shown && renderMeta(shown.content), 1000);
    if (!need && timerTick) { win.clearInterval(timerTick); timerTick = 0; }
  }

  /* ── bucle de animación ───────────────────────────────────────────── */
  function kick() {
    if (destroyed) return;
    if (reduced()) {
      // movimiento reducido: sin estados intermedios de forma; solo opacidad
      if (drop.phase.startsWith('retract')) {
        if (!fading) {
          fading = root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-out' });
          const end = () => { fading = null; if (!destroyed) { drop.snap(); draw(); } };
          fading.finished.then(end, end);
        }
        return;
      }
      drop.snap(); draw(); return;
    }
    if (!raf) { last = win.performance.now(); raf = win.requestAnimationFrame(loop); }
  }
  function loop(t) {
    raf = 0;
    let dt = Math.min(0.05, Math.max(0, (t - last) / 1000)); last = t;
    while (dt > 0) { const s = Math.min(dt, 1 / 240); drop.step(s); dt -= s; }
    draw();
    if (drop.busy && !destroyed) raf = win.requestAnimationFrame(loop);
  }

  function draw() {
    const d = drop.d;
    if (d) path.setAttribute('d', silhouette(d.cx ?? dims.cx, drop.w.x, drop.h.x, drop.sag, drop.expandedShape, d.radius));
    else path.setAttribute('d', '');
    const retracting = drop.phase.startsWith('retract') || drop.phase === 'gone' || drop.phase === 'empty' || drop.phase === 'swapping';
    const rowFits = !!d && !retracting && drop.h.x >= d.compactH - 1.5 && drop.w.x >= d.compactW - 1.5;
    const detFits = drop.phase === 'expanded';
    ui.style.width = `${drop.expandedShape ? d.expandedW : d ? d.compactW : 0}px`;
    ui.toggleAttribute('data-expanded', drop.phase === 'expanded');
    ui.style.maxHeight = d && d.scroll ? `${d.expandedH - d.top}px` : '';
    ui.toggleAttribute('data-content', rowFits);
    detail.hidden = !(detFits || drop.phase === 'collapsing');
    ui.toggleAttribute('data-detail', detFits);
    for (const e of drop.drain()) onDropEvent(e);
  }

  function onDropEvent(e) {
    if (e === 'rest' && pendingId) { const id = pendingId; pendingId = null; manager.ack(id, 'entered'); }
    if (e === 'rest' || e === 'expanded' || e === 'gone') updateReserved();
    if (e === 'swapped' && pendingFill) { pendingFill(); pendingFill = null; }
    if (e === 'gone') {
      if (usePopover && root.matches(':popover-open')) root.hidePopover(); else if (!usePopover) root.hidden = true;
      // el foco pudo «caer» a body al ocultarse el contenido: se recuerda con focusInside
      const active = doc.activeElement;
      const wasInside = ui.contains(active) || (focusInside && (!active || active === doc.body));
      focusInside = false;
      const leaving = shownId; shownId = null; shown = null;
      if (leaving) manager.ack(leaving, 'removed');
      if (wasInside) restoreFocus();
      returnFocus = null;
      syncTimerTick();
    }
  }
  let pendingFill = null;

  function updateReserved() {
    const v = drop.visible && dims ? Math.round(dims.compactH) : 0;
    if (v === reserved) return;
    reserved = v;
    doc.documentElement.style.setProperty('--cornisa-reserved', `${v}px`);
    options.emit('reservedchange', { height: v });
  }

  function restoreFocus() {
    const t = returnFocus && returnFocus.isConnected ? returnFocus : (doc.querySelector('main') || doc.body);
    if (t && typeof t.focus === 'function') {
      if (t !== doc.body && !t.hasAttribute('tabindex') && !t.matches('a[href],button,input,select,textarea,[contenteditable]')) t.setAttribute('tabindex', '-1');
      t.focus({ preventScroll: true });
    }
  }

  function open() {
    if (usePopover) { if (!root.matches(':popover-open')) root.showPopover(); } else root.hidden = false;
  }

  /* ── reconciliación con el gestor ─────────────────────────────────── */
  function render(snap) {
    if (destroyed) return;
    const p = snap.primary;
    const a = p ? { id: p.id, content: p.content, state: p.state } : null;

    if (!a) { if (drop.visible) { drop.retract(); kick(); } return; }

    if (a.state === 'dismissing') {
      if (a.id !== shownId) { manager.ack(a.id, 'removed'); return; }
      if (snap.waiting > 0) {
        // queda otra: la gota se queda y cambia de contenido (continuidad)
        manager.ack(a.id, 'removed');
        return;
      }
      if (drop.retract()) kick();
      return;
    }

    if (a.id !== shownId) {
      // entra otra actividad
      const enterNow = () => { shownId = a.id; shown = a; fill(a, snap.waiting); computeDims(a.content); drop.resize(dims); };
      const outside = activeOutside(); if (outside) returnFocus = outside;
      pendingId = a.state === 'entering' ? a.id : null;
      if (!drop.visible || drop.phase.startsWith('retract')) {
        shownId = a.id; shown = a; fill(a, snap.waiting); computeDims(a.content);
        open(); drop.show(dims);
      } else {
        shownId = a.id; shown = a;
        pendingFill = enterNow;
        const d = computeDims(a.content); // provisional: se recalcula al rellenar
        drop.swap(d);
      }
      kick(); syncTimerTick();
      return;
    }

    // misma actividad: contenido/estado actualizados
    shown = a;
    if (!pendingFill) fill(a, snap.waiting);
    const before = dims && `${dims.compactW}x${dims.compactH}x${dims.expandedH}`;
    if (!pendingFill) computeDims(a.content);
    toggle.setAttribute('aria-expanded', String(a.state === 'expanded'));
    if (a.state === 'expanded' && drop.phase !== 'expanded' && drop.phase !== 'expanding') drop.expand();
    else if (a.state === 'compact' && (drop.phase === 'expanded' || drop.phase === 'expanding')) drop.collapse();
    else if (before !== `${dims.compactW}x${dims.compactH}x${dims.expandedH}`) drop.resize(dims);
    kick(); syncTimerTick();
  }
  const activeOutside = () => { const n = doc.activeElement; return n && n !== doc.body && !root.contains(n) ? n : null; };

  /* ── interacción ──────────────────────────────────────────────────── */
  listen(toggle, 'click', () => {
    const h = shownId && manager.get(shownId); if (!h) return;
    if (h.state === 'expanded') h.collapse(); else h.expand();
  });
  listen(more, 'click', () => { manager.cycle(); });
  listen(quick, 'click', () => { if (shownId) manager.invokeAction(shownId, 0); });
  listen(actions, 'click', (e) => {
    const b = e.target.closest('button'); if (!b || !shownId) return;
    if (b.classList.contains('cornisa-close')) { manager.get(shownId)?.dismiss('user'); return; }
    manager.invokeAction(shownId, Number(b.dataset.index));
  });
  listen(ui, 'keydown', (e) => {
    if (e.key !== 'Escape') return;
    const h = shownId && manager.get(shownId);
    if (h && h.state === 'expanded') { e.stopPropagation(); h.collapse(); toggle.focus({ preventScroll: true }); }
  });
  listen(ui, 'focusin', () => { focusInside = true; manager.setPaused('focus', true); manager.setPinned(true); });
  listen(ui, 'focusout', (e) => {
    if (e.relatedTarget && ui.contains(e.relatedTarget)) return;
    if (e.relatedTarget) focusInside = false; // sin relatedTarget: el foco cayó a body (contenido ocultado), no se movió a la página
    manager.setPaused('focus', false); manager.setPinned(false);
    // WCAG 2.4.11: si el foco pasa a la página, el expandido no debe taparla
    if (e.relatedTarget) { const h = shownId && manager.get(shownId); if (h && h.state === 'expanded') h.collapse(); }
  });
  listen(ui, 'pointerenter', () => manager.setPaused('hover', true));
  listen(ui, 'pointerleave', () => manager.setPaused('hover', false));
  listen(doc, 'pointerdown', (e) => {
    if (ui.contains(/** @type {Node} */ (e.target))) return;
    const h = shownId && manager.get(shownId); if (h && h.state === 'expanded') h.collapse();
  }, { capture: true });
  listen(doc, 'visibilitychange', () => manager.setPaused('hidden', doc.hidden));
  if (doc.hidden) manager.setPaused('hidden', true);
  // D3-02: atajo opcional (desactivado por defecto); siempre con modificador (WCAG 2.1.4)
  const shortcut = options.shortcut || null;
  let shortcutReturn = null;
  if (shortcut) {
    toggle.setAttribute('aria-keyshortcuts', shortcut.aria);
    listen(doc, 'keydown', (e) => {
      if (!shortcut.matches(e) || !shownId || !drop.visible) return; // sin actividad: no se roba la tecla
      e.preventDefault();
      if (ui.contains(doc.activeElement)) {
        const back = shortcutReturn && shortcutReturn.isConnected ? shortcutReturn : null;
        if (back) back.focus(); else restoreFocus();
        shortcutReturn = null;
      } else {
        shortcutReturn = doc.activeElement && doc.activeElement !== doc.body ? doc.activeElement : null;
        toggle.focus();
      }
    });
  }
  listen(win, 'resize', () => { if (shown && drop.visible && !pendingFill) { computeDims(shown.content); drop.resize(dims); kick(); } });
  if (mql && mql.addEventListener) listen(mql, 'change', () => { if (reduced() && drop.busy) { drop.snap(); draw(); } });

  const offChange = manager.on('change', render);
  const offAnn = manager.on('announce', (a) => {
    const politeness = a.politeness, text = a.text;
    const n = politeness === 'assertive' ? alert : live;
    n.textContent = '';
    win.setTimeout(() => { if (!destroyed) n.textContent = text; }, 30); // vaciar y reescribir: fuerza la relectura
  });

  return {
    get running() { return raf !== 0; },
    get phase() { return drop.phase; },
    get usesPopover() { return usePopover; },
    /** @internal para pruebas */
    _debug: () => ({ h: drop.h.x, w: drop.w.x, sag: drop.sag, phase: drop.phase, dims, simT: drop.t }),
    destroy() {
      if (destroyed) return;
      destroyed = true;
      offChange(); offAnn(); for (const off of offs.splice(0)) off();
      if (raf) win.cancelAnimationFrame(raf);
      raf = 0;
      if (timerTick) win.clearInterval(timerTick);
      timerTick = 0;
      if (usePopover && root.matches(':popover-open')) root.hidePopover();
      const hadFocus = root.contains(doc.activeElement);
      for (const n of [live, alert, probe, measure, root]) n.remove();
      doc.documentElement.style.removeProperty('--cornisa-reserved');
      if (hadFocus) restoreFocus();
    },
  };
}
