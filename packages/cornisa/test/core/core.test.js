import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createManager, transition, normalize, Drop, silhouette, STATES } from '../../src/core/index.js';

/* reloj falso determinista */
function fakeClock() {
  let now = 0, id = 0; const timers = new Map();
  return {
    now: () => now,
    setTimeout(fn, ms) { const k = ++id; timers.set(k, { at: now + ms, fn }); return k; },
    clearTimeout(k) { timers.delete(k); },
    advance(ms) {
      const end = now + ms;
      for (;;) {
        const due = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        timers.delete(due[0]); now = due[1].at; due[1].fn();
      }
      now = end;
    },
    get pending() { return timers.size; },
  };
}
const flush = () => new Promise((r) => setTimeout(r, 0));
const setup = (opts = {}) => { const clock = fakeClock(); const m = createManager({ clock, ...opts }); const ann = []; m.on('announce', (a) => ann.push(a)); return { clock, m, ann }; };

/* ── máquina ─────────────────────────────────────────────────────────── */
test('máquina: transiciones permitidas y prohibidas', () => {
  assert.deepEqual([...STATES], ['queued', 'entering', 'compact', 'expanded', 'dismissing', 'removed']);
  assert.equal(transition('queued', 'promote'), 'entering');
  assert.equal(transition('entering', 'entered'), 'compact');
  assert.equal(transition('compact', 'expand'), 'expanded');
  assert.equal(transition('expanded', 'collapse'), 'compact');
  assert.equal(transition('compact', 'demote'), 'queued');
  assert.equal(transition('queued', 'dismiss'), 'removed');
  assert.equal(transition('dismissing', 'update'), null);
  assert.equal(transition('dismissing', 'expand'), null);
  assert.equal(transition('removed', 'promote'), null);
  assert.equal(transition('compact', 'toString'), null, 'no hereda de Object.prototype');
});

/* ── validación ──────────────────────────────────────────────────────── */
test('validación: título obligatorio, máx. 2 acciones, icono solo Node, progreso acotado', () => {
  assert.throws(() => normalize({}, null), /title/);
  assert.throws(() => normalize({ title: '  ' }, null), /title/);
  assert.throws(() => normalize({ title: 'a', actions: [{ label: '1' }, { label: '2' }, { label: '3' }] }, null), RangeError);
  assert.throws(() => normalize({ title: 'a', icon: '<img src=x onerror=alert(1)>' }, null), /DOM Node/);
  assert.throws(() => normalize({ title: 'a', intent: 'danger' }, null), /intent/);
  assert.throws(() => normalize({ title: 'a', duration: -1 }, null), /duration/);
  assert.throws(() => normalize({ title: 'a', progress: NaN }, null), /progress/);
  assert.equal(normalize({ title: 'a', progress: 140 }, null).progress, 100);
  const prev = normalize({ title: 'a', body: 'b' }, null);
  assert.equal(normalize({ body: null }, prev).body, null, 'null borra en update');
  assert.equal(normalize({ body: null }, prev).title, 'a', 'update conserva lo no indicado');
});

/* ── ciclo de vida ───────────────────────────────────────────────────── */
test('ciclo de vida sin renderer: queued → entering → compact → (timeout) → removed', async () => {
  const { clock, m } = setup();
  const h = m.show({ title: 'Guardado' });
  const seen = []; h.on('statechange', (e) => seen.push(e.state));
  assert.equal(h.state, 'queued');
  await flush();
  assert.equal(h.state, 'compact');
  clock.advance(4999); await flush();
  assert.equal(h.state, 'compact');
  clock.advance(1); await flush();
  assert.equal(h.state, 'removed');
  assert.deepEqual(seen, ['entering', 'compact', 'dismissing', 'removed']);
});

test('dismiss devuelve una promesa que se resuelve al retirarse; evento dismiss con motivo', async () => {
  const { m } = setup();
  const h = m.show({ title: 'x', duration: 'persistent' }); await flush();
  let reason; h.on('dismiss', (e) => { reason = e.reason; });
  await h.dismiss('user');
  assert.equal(h.state, 'removed'); assert.equal(reason, 'user');
  assert.equal(h.update({ title: 'y' }), false, 'update tras descartar no hace nada');
});

test('id idempotente: show() con un id existente actualiza la misma instancia', async () => {
  const { m } = setup();
  const a = m.show({ id: 'up', title: 'Subiendo', progress: 0, duration: 'persistent' });
  const b = m.show({ id: 'up', title: 'Subiendo', progress: 50 });
  assert.equal(a, b);
  await flush();
  assert.equal(m.snapshot().primary.content.progress, 50);
});

/* ── una visible + cola ──────────────────────────────────────────────── */
test('una sola visible; el resto espera (+N); al descartar entra la siguiente', async () => {
  const { m } = setup();
  const a = m.show({ title: 'A', duration: 'persistent' });
  const b = m.show({ title: 'B', duration: 'persistent' });
  const c = m.show({ title: 'C', duration: 'persistent' });
  await flush();
  assert.equal(a.state, 'compact'); assert.equal(b.state, 'queued'); assert.equal(c.state, 'queued');
  assert.equal(m.snapshot().waiting, 2);
  await a.dismiss(); await flush(); await flush();
  assert.equal(b.state, 'compact'); assert.equal(m.snapshot().waiting, 1);
});

test('prioridad: high desplaza a la visible (que vuelve a la cola) salvo si está expandida o fijada', async () => {
  const { m } = setup();
  const a = m.show({ title: 'A', duration: 'persistent' }); await flush();
  const hi = m.show({ title: 'Sin conexión', priority: 'high', duration: 'persistent' }); await flush(); await flush();
  assert.equal(hi.state, 'compact'); assert.equal(a.state, 'queued');

  const { m: m2 } = setup();
  const x = m2.show({ title: 'X', duration: 'persistent' }); await flush();
  x.expand();
  const y = m2.show({ title: 'Y', priority: 'high' }); await flush(); await flush();
  assert.equal(x.state, 'expanded'); assert.equal(y.state, 'queued', 'no interrumpe una expandida');

  const { m: m3 } = setup();
  const p = m3.show({ title: 'P', duration: 'persistent' }); await flush();
  m3.setPinned(true);
  m3.show({ title: 'Q', priority: 'high' }); await flush(); await flush();
  assert.equal(p.state, 'compact', 'no interrumpe con el foco dentro');
});

test('cycle(): el usuario pasa a la siguiente; la actual vuelve a la cola', async () => {
  const { m } = setup();
  const a = m.show({ title: 'A', duration: 'persistent' });
  const b = m.show({ title: 'B', duration: 'persistent' }); await flush();
  assert.equal(m.cycle(), true); await flush();
  assert.equal(b.state, 'compact'); assert.equal(a.state, 'queued');
  assert.equal(m.snapshot().waiting, 1);
});

test('expand() en cola se recuerda como intención (show(...).expand())', async () => {
  const { m } = setup();
  const h = m.show({ title: 'x', duration: 'persistent' });
  h.expand();
  await flush(); await flush();
  assert.equal(h.state, 'expanded');
});

/* ── temporizadores ──────────────────────────────────────────────────── */
test('temporizador: pausa con hover/foco/pestaña oculta y en expandido; reanuda con lo restante', async () => {
  const { clock, m } = setup();
  const h = m.show({ title: 'x', duration: 1000 }); await flush();
  clock.advance(600);
  m.setPaused('hover', true); clock.advance(5000); await flush();
  assert.equal(h.state, 'compact');
  m.setPaused('hover', false); clock.advance(399); await flush();
  assert.equal(h.state, 'compact');
  h.expand(); clock.advance(5000); await flush();
  assert.equal(h.state, 'expanded');
  h.collapse(); m.setPaused('hidden', true); clock.advance(5000); await flush();
  assert.equal(h.state, 'compact');
  m.setPaused('hidden', false); clock.advance(1); await flush();
  assert.equal(h.state, 'removed');
});

test('las actividades en cola no consumen tiempo; los errores son persistentes por defecto', async () => {
  const { clock, m } = setup();
  const a = m.show({ title: 'A', duration: 'persistent' });
  const b = m.show({ title: 'B', duration: 1000 }); await flush();
  clock.advance(10000); await flush();
  assert.equal(b.state, 'queued');
  const e = m.show({ title: 'Error', intent: 'error', priority: 'high' }); await flush(); await flush();
  clock.advance(60000); await flush();
  assert.equal(e.state, 'compact');
  void a;
});

/* ── anuncios ────────────────────────────────────────────────────────── */
test('anuncios: al hacerse visible (no al encolar), ≥1 s entre ellos, sin perder ninguno', async () => {
  const { clock, m, ann } = setup();
  m.show({ title: 'A', duration: 'persistent' }); m.show({ title: 'B', duration: 'persistent' });
  await flush(); clock.advance(5000);
  assert.deepEqual(ann.map((x) => x.text), ['A'], 'B está en cola: aún no se anuncia');
  m.cycle(); await flush(); clock.advance(5000);
  assert.deepEqual(ann.map((x) => x.text), ['A', 'B']);
});

test('anuncios de progreso: solo hitos de 25 %; error = assertive inmediato', async () => {
  const { clock, m, ann } = setup();
  const h = m.show({ title: 'Subida', progress: 0, duration: 'persistent' }); await flush();
  for (let p = 1; p <= 100; p++) { h.update({ progress: p }); clock.advance(50); }
  clock.advance(5000);
  const texts = ann.map((x) => x.text);
  assert.ok(texts.length <= 6, `demasiados anuncios: ${texts.length}`);
  assert.ok(texts.includes('Subida: 100%'));
  h.update({ title: 'Falló', intent: 'error' });
  assert.equal(ann.at(-1).politeness, 'assertive');
});

/* ── acciones, errores de consumidor, destroy ────────────────────────── */
test('acciones: emite action y llama a onSelect con el handle; un error del consumidor no rompe el gestor', async () => {
  const { m } = setup();
  const errors = []; m.on('error', (e) => errors.push(e));
  let got;
  const h = m.show({ title: 'x', duration: 'persistent', actions: [{ label: 'Deshacer', onSelect: (hh) => { got = hh; throw new Error('boom'); } }] });
  await flush();
  const evs = []; h.on('action', (e) => evs.push(e));
  m.invokeAction(h.id, 0);
  assert.equal(got, h); assert.deepEqual(evs, [{ index: 0, label: 'Deshacer' }]);
  assert.equal(errors.length, 1);
  assert.equal(h.state, 'compact');
});

test('destroy(): no quedan temporizadores; resuelve las promesas pendientes; show posterior lanza', async () => {
  const { clock, m } = setup();
  const a = m.show({ title: 'A', duration: 1000 });
  m.show({ title: 'B' }); await flush();
  const p = a.dismiss();
  m.destroy();
  await p;
  assert.equal(m._liveTimers(), 0);
  assert.equal(clock.pending, 0);
  assert.throws(() => m.show({ title: 'C' }), /destroyed/);
});

/* ── modelo físico ───────────────────────────────────────────────────── */
const D = { compactW: 172, compactH: 52, expandedW: 369, expandedH: 150 };
const run = (drop, secs) => { for (let t = 0; t < secs; t += 1 / 240) drop.step(1 / 240); };

test('gota: nace estrecha, se ensancha, se asienta; nunca por encima del borde', () => {
  const d = new Drop(); d.show(D);
  let minH = Infinity, ratios = [];
  for (let t = 0; t < 1.5; t += 1 / 240) { d.step(1 / 240); minH = Math.min(minH, d.h.x); if (d.h.x > 2) ratios.push(d.w.x / d.h.x); }
  assert.ok(minH >= 0);
  assert.equal(d.phase, 'rest');
  assert.ok(Math.abs(d.w.x - 172) < 1 && Math.abs(d.h.x - 52) < 1);
  assert.ok(Math.max(...ratios) / Math.min(...ratios) > 2, 'la relación de aspecto cambia (deformación)');
  assert.deepEqual(d.drain(), ['rest']);
});

test('gota: expandir, contraer, retirar hasta desaparecer', () => {
  const d = new Drop(); d.show(D); run(d, 1.5);
  d.expand(); run(d, 1.5); assert.equal(d.phase, 'expanded');
  d.collapse(); run(d, 1.5); assert.equal(d.phase, 'rest');
  d.retract(); run(d, 1.5); assert.equal(d.phase, 'gone');
  assert.equal(d.h.x, 0); assert.equal(d.busy, false);
});

test('gota: snap() (movimiento reducido) salta al estado estable sin intermedios', () => {
  const d = new Drop(); d.show(D); d.snap(); assert.equal(d.phase, 'rest'); assert.equal(d.h.x, 52);
  d.expand(); d.snap(); assert.equal(d.phase, 'expanded'); assert.equal(d.h.x, 150);
  d.collapse(); d.snap(); assert.equal(d.phase, 'rest');
  d.retract(); d.snap(); assert.equal(d.phase, 'gone');
});

test('silueta: anclada a y=0 con unión cóncava; vacía cuando no hay gota', () => {
  assert.equal(silhouette(100, 0, 0, 0, false), '');
  const p = silhouette(200, 172, 52, 3, false);
  assert.match(p, /^M[\d.]+ -2L[\d.]+ 0Q/);
  assert.match(p, /Z$/);
});

test('anuncios de progreso: sin cruzar un hito no se anuncia nada aunque pase tiempo', async () => {
  const { clock, m, ann } = setup();
  const h = m.show({ title: 'Subida', progress: 0, duration: 'persistent' }); await flush();
  clock.advance(5000); ann.length = 0;
  for (let p = 1; p <= 24; p++) { h.update({ progress: p }); clock.advance(2000); }
  assert.deepEqual(ann, [], 'del 1 al 24 % no hay hito');
  h.update({ progress: 25 }); clock.advance(2000);
  assert.deepEqual(ann.map((x) => x.text), ['Subida: 25%']);
});
