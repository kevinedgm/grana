/**
 * cornisa — superficie de actividad no modal que nace del borde superior del viewport.
 * 0 dependencias, sin framework.
 * @module cornisa
 */
import { createManager } from './core/manager.js';
import { createRenderer, DEFAULT_LABELS } from './dom/renderer.js';

export { DEFAULT_LABELS };

const MODS = ['alt', 'ctrl', 'meta', 'shift'];
/**
 * Analiza un atajo tipo «Alt+Shift+N». Exige al menos Alt, Ctrl o Meta (WCAG 2.1.4).
 * @param {string} spec
 */
export function parseShortcut(spec) {
  if (typeof spec !== 'string' || !spec.trim()) throw new TypeError('cornisa: `shortcut` must be a string like "Alt+Shift+N"');
  const parts = spec.split('+').map((p) => p.trim()).filter(Boolean);
  const key = parts.pop();
  const mods = parts.map((p) => p.toLowerCase().replace(/^control$/, 'ctrl').replace(/^(cmd|command)$/, 'meta').replace(/^option$/, 'alt'));
  if (!key || key.length === 0 || mods.some((m) => !MODS.includes(m))) throw new TypeError(`cornisa: invalid shortcut "${spec}"`);
  if (!mods.some((m) => m === 'alt' || m === 'ctrl' || m === 'meta')) throw new TypeError('cornisa: `shortcut` needs Alt, Ctrl or Meta (WCAG 2.1.4)');
  const want = new Set(mods);
  const k = key.length === 1 ? key.toUpperCase() : key;
  const code = /^[A-Z]$/.test(k) ? `Key${k}` : /^[0-9]$/.test(k) ? `Digit${k}` : null;
  return {
    aria: [...MODS.filter((m) => want.has(m)).map((m) => ({ alt: 'Alt', ctrl: 'Control', meta: 'Meta', shift: 'Shift' })[m]), k].join('+'),
    /** @param {KeyboardEvent} e */
    matches: (e) => e.altKey === want.has('alt') && e.ctrlKey === want.has('ctrl') && e.metaKey === want.has('meta') && e.shiftKey === want.has('shift')
      && (code ? e.code === code : e.key.toLowerCase() === k.toLowerCase()),
  };
}

/**
 * Crea una isla. Llamar una vez por página/documento.
 * @param {import('../types/index').IslandOptions} [options]
 * @returns {import('../types/index').Island}
 */
export function createIsland(options = {}) {
  if (typeof document === 'undefined' && !options.container) {
    throw new Error('cornisa: createIsland() needs a DOM. For non-DOM environments use createManager() from "cornisa/core".');
  }
  const shortcut = options.shortcut == null ? null : parseShortcut(options.shortcut);
  const islandListeners = new Map();
  const emit = (type, detail) => { for (const fn of [...(islandListeners.get(type) || [])]) fn(detail); };
  const manager = createManager({ announceGap: options.announceGap });
  manager.on('error', (err) => {
    if ((islandListeners.get('error') || new Set()).size) emit('error', err);
    else setTimeout(() => { throw err; });
  });
  const renderer = createRenderer(manager, { container: options.container, labels: options.labels, emit, shortcut });
  let destroyed = false;

  const island = {
    show: (opts) => manager.show(opts),
    get: (id) => manager.get(id),
    /**
     * Muestra una actividad ligada a una promesa: loading → success | error en la MISMA instancia.
     * Devuelve la promesa original (sin alterar su resultado).
     */
    promise(p, msgs) {
      if (!msgs || !msgs.loading) throw new TypeError('cornisa: promise() needs { loading, success, error }');
      const asOpts = (m, v) => (typeof m === 'function' ? m(v) : typeof m === 'string' ? { title: m } : m);
      const h = manager.show({ ...asOpts(msgs.loading), progress: 'indeterminate', duration: 'persistent' });
      Promise.resolve(p).then(
        (v) => { if (msgs.success) h.update({ intent: 'success', progress: null, duration: undefined, ...asOpts(msgs.success, v) }); else h.dismiss('settled'); },
        (e) => { if (msgs.error) h.update({ intent: 'error', progress: null, duration: 'persistent', ...asOpts(msgs.error, e) }); else h.dismiss('settled'); },
      );
      return p;
    },
    dismissAll: (reason) => manager.dismissAll(reason),
    /** @param {'reservedchange'|'error'} type */
    on(type, fn) {
      if (typeof fn !== 'function') throw new TypeError('cornisa: listener must be a function');
      if (!islandListeners.has(type)) islandListeners.set(type, new Set());
      islandListeners.get(type).add(fn);
      return () => islandListeners.get(type)?.delete(fn);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      renderer.destroy();
      manager.destroy();
      islandListeners.clear();
    },
    get destroyed() { return destroyed; },
  };
  // INESTABLE: acceso interno para pruebas/depuración, no enumerable y fuera de semver (ver README)
  Object.defineProperty(island, '_internals', { value: Object.freeze({ manager, renderer }), enumerable: false });
  return /** @type {import('../types/index').Island} */ (/** @type {unknown} */ (island));
}
