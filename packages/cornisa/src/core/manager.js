/**
 * Gestor de actividades: cola con prioridad, una sola actividad visible (+N en espera),
 * temporizadores pausables, anuncios con frecuencia limitada y eventos. Sin DOM.
 * @module cornisa/core/manager
 */
import { transition } from './machine.js';

const INTENTS = ['neutral', 'success', 'warning', 'error'];
const PRIORITY = { low: 0, normal: 1, high: 2 };
export const DEFAULT_DURATION = 5000;
export const MAX_ACTIONS = 2;

/** @typedef {{ now(): number, setTimeout(fn: () => void, ms: number): any, clearTimeout(id: any): void }} Clock */
/** @type {Clock} */
export const systemClock = {
  now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
};

const isNode = (v) => typeof v === 'object' && v !== null && typeof v.nodeType === 'number' && typeof v.cloneNode === 'function';

/**
 * Valida y normaliza contenido. En update, `null` borra un campo opcional.
 * @param {Record<string, any>} input
 * @param {Record<string, any>|null} prev
 */
export function normalize(input, prev) {
  if (input === null || typeof input !== 'object') throw new TypeError('cornisa: options must be an object');
  const out = prev ? { ...prev } : {
    intent: 'neutral', title: '', body: null, icon: null, progress: null, timer: null, actions: [], duration: undefined, priority: 'normal',
  };
  const has = (k) => Object.prototype.hasOwnProperty.call(input, k);
  if (has('title') || !prev) {
    if (typeof input.title !== 'string' || input.title.trim() === '') throw new TypeError('cornisa: `title` must be a non-empty string');
    out.title = input.title;
  }
  if (has('intent')) {
    const v = input.intent ?? 'neutral';
    if (!INTENTS.includes(v)) throw new TypeError(`cornisa: \`intent\` must be one of ${INTENTS.join(', ')}`);
    out.intent = v;
  }
  if (has('body')) {
    if (input.body != null && typeof input.body !== 'string') throw new TypeError('cornisa: `body` must be a string');
    out.body = input.body ?? null;
  }
  if (has('icon')) {
    if (input.icon != null && !isNode(input.icon)) throw new TypeError('cornisa: `icon` must be a DOM Node (strings of HTML are not accepted)');
    out.icon = input.icon ?? null;
  }
  if (has('progress')) {
    const v = input.progress;
    if (v == null) out.progress = null;
    else if (v === 'indeterminate') out.progress = v;
    else if (typeof v === 'number' && Number.isFinite(v)) out.progress = Math.min(100, Math.max(0, v));
    else throw new TypeError('cornisa: `progress` must be a number 0–100, "indeterminate" or null');
  }
  if (has('timer')) {
    const v = input.timer;
    if (v == null) out.timer = null;
    else if (typeof v === 'object' && typeof v.endsAt === 'number' && Number.isFinite(v.endsAt)) out.timer = { endsAt: v.endsAt };
    else throw new TypeError('cornisa: `timer` must be { endsAt: number } or null');
  }
  if (has('actions')) {
    const v = input.actions ?? [];
    if (!Array.isArray(v)) throw new TypeError('cornisa: `actions` must be an array');
    if (v.length > MAX_ACTIONS) throw new RangeError(`cornisa: at most ${MAX_ACTIONS} actions are allowed`);
    out.actions = v.map((a) => {
      if (!a || typeof a.label !== 'string' || a.label.trim() === '') throw new TypeError('cornisa: each action needs a non-empty `label`');
      if (a.onSelect != null && typeof a.onSelect !== 'function') throw new TypeError('cornisa: `onSelect` must be a function');
      return { label: a.label, onSelect: a.onSelect ?? null };
    });
  }
  if (has('duration')) {
    const v = input.duration;
    if (v === 'persistent' || v === undefined) out.duration = v;
    else if (typeof v === 'number' && Number.isFinite(v) && v > 0) out.duration = v;
    else throw new TypeError('cornisa: `duration` must be a positive number of ms or "persistent"');
  }
  if (has('priority')) {
    if (!(input.priority in PRIORITY)) throw new TypeError('cornisa: `priority` must be low, normal or high');
    out.priority = input.priority;
  }
  return out;
}

/** Duración efectiva: explícita; si no, los errores son persistentes. */
const effectiveDuration = (c) => (c.duration !== undefined ? c.duration : c.intent === 'error' ? 'persistent' : DEFAULT_DURATION);

/**
 * @param {{ clock?: Clock, announceGap?: number }} [options]
 */
export function createManager(options = {}) {
  const clock = options.clock || systemClock;
  const announceGap = options.announceGap ?? 1000;
  /** @type {Map<string, any>} */
  const acts = new Map();
  const listeners = new Map(); // manager-level: change, announce, error
  const pause = new Set();     // hover | focus | hidden
  let seq = 0, autoId = 0, pinned = false, destroyed = false, autoAck = true;
  let annQueue = [], annTimer = null, lastAnn = -Infinity;
  let batched = false;

  const emit = (map, type, payload) => {
    const set = map.get(type); if (!set) return;
    for (const fn of [...set]) {
      try { fn(payload); } catch (err) { if (type !== 'error') emit(listeners, 'error', err); else setTimeout(() => { throw err; }); }
    }
  };
  const on = (map, type, fn) => {
    if (typeof fn !== 'function') throw new TypeError('cornisa: listener must be a function');
    if (!map.has(type)) map.set(type, new Set());
    map.get(type).add(fn);
    return () => map.get(type)?.delete(fn);
  };

  const changed = () => {
    if (batched) return; batched = true;
    queueMicrotask(() => { batched = false; if (!destroyed) { reconcile(); emit(listeners, 'change', snapshot()); } });
  };

  /* ── anuncios ─────────────────────────────────────────────────────── */
  const announce = (a, text) => {
    if (!text) return;
    if (a.content.intent === 'error') { emit(listeners, 'announce', { politeness: 'assertive', text }); return; }
    const i = annQueue.findIndex((m) => m.id === a.id);
    if (i >= 0) annQueue[i].text = text; else annQueue.push({ id: a.id, text });
    pump();
  };
  const pump = () => {
    if (annTimer !== null || annQueue.length === 0 || destroyed) return;
    const wait = Math.max(0, announceGap - (clock.now() - lastAnn));
    annTimer = clock.setTimeout(() => {
      annTimer = null;
      const m = annQueue.shift();
      if (m) { lastAnn = clock.now(); emit(listeners, 'announce', { politeness: 'polite', text: m.text }); }
      pump();
    }, wait);
  };
  const dropAnnouncements = (id) => { annQueue = annQueue.filter((m) => m.id !== id); };
  const summary = (c) => [c.title, c.body].filter(Boolean).join('. ');

  /* ── temporizador de autodescartar ───────────────────────────────── */
  const shouldRun = (a) => a.phase === 'compact' && pause.size === 0 && Number.isFinite(a.remaining);
  const arm = (a) => {
    if (a.timer !== null || !shouldRun(a)) return;
    a.startedAt = clock.now();
    a.timer = clock.setTimeout(() => { a.timer = null; a.remaining = 0; dismiss(a, 'timeout'); }, a.remaining);
  };
  const disarm = (a) => {
    if (a.timer === null) return;
    clock.clearTimeout(a.timer); a.timer = null;
    a.remaining = Math.max(0, a.remaining - (clock.now() - a.startedAt));
  };
  const resetRemaining = (a) => { const d = effectiveDuration(a.content); a.remaining = d === 'persistent' ? Infinity : d; };
  const syncTimers = () => { for (const a of acts.values()) { if (shouldRun(a)) arm(a); else disarm(a); } };

  /* ── transiciones ─────────────────────────────────────────────────── */
  const go = (a, event) => {
    const next = transition(a.phase, event);
    if (next === null) return false;
    const previous = a.phase;
    if (next === previous) return true;
    a.phase = next;
    if (next === 'queued') dropAnnouncements(a.id);
    if (next === 'removed') finalize(a);
    syncTimers();
    emit(a.listeners, 'statechange', { state: next, previous });
    changed();
    return true;
  };
  const finalize = (a) => {
    disarm(a); dropAnnouncements(a.id); acts.delete(a.id);
    emit(a.listeners, 'dismiss', { reason: a.reason });
    a.resolve();
  };
  const dismiss = (a, reason) => {
    if (a.phase === 'dismissing' || a.phase === 'removed') return a.done;
    a.reason = reason;
    go(a, 'dismiss');
    if (a.phase === 'dismissing' && autoAck) queueMicrotask(() => ack(a.id, 'removed'));
    return a.done;
  };

  const primary = () => { for (const a of acts.values()) if (a.phase !== 'queued') return a; return null; };
  const queued = () => [...acts.values()].filter((a) => a.phase === 'queued')
    .sort((x, y) => PRIORITY[y.content.priority] - PRIORITY[x.content.priority] || x.seq - y.seq);

  const promote = (a) => {
    go(a, 'promote');
    if (!a.announced || a.reannounce) { a.announced = true; a.reannounce = false; announce(a, summary(a.content)); }
    if (autoAck) queueMicrotask(() => ack(a.id, 'entered'));
  };

  /** Una sola actividad visible; desplaza la actual si llega una de mayor prioridad y no está fijada. */
  function reconcile() {
    const cur = primary();
    const next = queued()[0];
    if (!next) return;
    if (!cur) { promote(next); return; }
    if (cur.phase === 'dismissing') return; // se promueve cuando termine
    const canPreempt = cur.phase !== 'expanded' && !pinned;
    if (canPreempt && PRIORITY[next.content.priority] > PRIORITY[cur.content.priority]) {
      cur.seq = ++seq; // vuelve a la cola detrás de las de su prioridad
      go(cur, 'demote');
      promote(next);
    }
  }

  /** Avance por petición del usuario: la visible pasa a la cola y entra la siguiente. */
  function cycle() {
    const cur = primary(); const next = queued()[0];
    if (!cur || !next || cur.phase === 'dismissing') return false;
    cur.seq = ++seq;
    go(cur, 'demote');
    promote(next);
    return true;
  }

  /** El renderer confirma el fin de una animación. */
  function ack(id, what) {
    const a = acts.get(id); if (!a) return;
    if (what === 'entered' && a.phase === 'entering') {
      go(a, 'entered');
      if (a.wantExpand) { a.wantExpand = false; go(a, 'expand'); }
    } else if (what === 'removed' && a.phase === 'dismissing') go(a, 'removed');
  }

  function makeHandle(a) {
    return Object.freeze({
      id: a.id,
      get state() { return a.phase; },
      update(patch) {
        if (a.phase === 'dismissing' || a.phase === 'removed') return false;
        const before = a.content;
        a.content = normalize(patch, before);
        if ('duration' in patch || before.intent !== a.content.intent) { disarm(a); resetRemaining(a); }
        if (a.phase !== 'queued') {
          const c = a.content;
          if (c.title !== before.title || c.body !== before.body || c.intent !== before.intent) announce(a, summary(c));
          else if (typeof c.progress === 'number') {
            const m = Math.floor(c.progress / 25) * 25;
            if (m > 0 && m !== a.milestone) { a.milestone = m; announce(a, `${c.title}: ${m}%`); }
          }
        } else a.reannounce = true;
        syncTimers();
        emit(listeners, 'change', snapshot());
        return true;
      },
      expand() {
        if (a.phase === 'queued') { a.wantExpand = true; return true; }
        if (a.phase === 'entering' || a.phase === 'compact') return go(a, 'expand');
        return a.phase === 'expanded';
      },
      collapse() {
        if (a.phase === 'queued') { a.wantExpand = false; return true; }
        return a.phase === 'expanded' ? go(a, 'collapse') : a.phase === 'compact';
      },
      dismiss(reason = 'api') { return dismiss(a, reason); },
      on(type, fn) { return on(a.listeners, type, fn); },
    });
  }

  function show(input) {
    if (destroyed) throw new Error('cornisa: this island was destroyed');
    if (input && input.id != null && acts.has(String(input.id))) {
      const h = acts.get(String(input.id)).handle; h.update(input); return h;
    }
    const content = normalize(input, null);
    const id = input.id != null ? String(input.id) : `cornisa-${++autoId}`;
    let resolve;
    const done = new Promise((r) => { resolve = r; });
    const a = { id, content, phase: 'queued', seq: ++seq, listeners: new Map(), timer: null, startedAt: 0, remaining: 0,
      wantExpand: false, announced: false, reannounce: false, milestone: -1, reason: null, done, resolve };
    resetRemaining(a);
    if (typeof content.progress === 'number') a.milestone = Math.floor(content.progress / 25) * 25;
    a.handle = makeHandle(a);
    acts.set(id, a);
    changed();
    return a.handle;
  }

  function invokeAction(id, index) {
    const a = acts.get(id); if (!a) return;
    const act = a.content.actions[index]; if (!act) return;
    emit(a.listeners, 'action', { index, label: act.label });
    if (act.onSelect) { try { act.onSelect(a.handle); } catch (err) { emit(listeners, 'error', err); } }
  }

  function snapshot() {
    const p = primary();
    return { primary: p ? { id: p.id, state: p.phase, content: p.content } : null, waiting: queued().length };
  }

  return {
    show,
    get: (id) => acts.get(String(id))?.handle ?? null,
    dismissAll(reason = 'api') { return Promise.all([...acts.values()].map((a) => dismiss(a, reason))); },
    cycle,
    ack,
    invokeAction,
    snapshot,
    /** @param {'hover'|'focus'|'hidden'} reason @param {boolean} value */
    setPaused(reason, value) { if (value) pause.add(reason); else pause.delete(reason); syncTimers(); },
    setPinned(value) { pinned = !!value; },
    /** El renderer toma el control de las confirmaciones de animación. */
    setAutoAck(value) { autoAck = !!value; },
    on: (type, fn) => on(listeners, type, fn),
    destroy() {
      if (destroyed) return;
      for (const a of acts.values()) { disarm(a); a.reason = 'destroy'; a.phase = 'removed'; a.resolve(); }
      acts.clear(); annQueue = [];
      if (annTimer !== null) clock.clearTimeout(annTimer);
      annTimer = null; destroyed = true; listeners.clear();
    },
    get destroyed() { return destroyed; },
    /** Para pruebas: temporizadores vivos. */
    _liveTimers() { let n = annTimer !== null ? 1 : 0; for (const a of acts.values()) if (a.timer !== null) n++; return n; },
  };
}
