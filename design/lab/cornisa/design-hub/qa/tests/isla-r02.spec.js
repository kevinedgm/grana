// QA runtime · isla r02 «Top-Edge Droplet» (prototipo F2). Verifica el PROTOTIPO, no la librería.
import { test, expect } from '@playwright/test';

const URL = '/lab/isla/r02/index.html';
const errors = [];
test.beforeEach(async ({ page }, info) => {
  errors.length = 0;
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(URL);
  const w = info.project.use.viewport.width;
  if ([1440, 834, 393, 320].includes(w)) await page.click(`[data-w="${w}"]`);
});
test.afterEach(() => expect(errors, 'sin errores JS').toEqual([]));

const phase = p => p.evaluate(() => window.__proto.drop.phase);
const waitPhase = (p, ph, timeout = 4000) => expect.poll(() => phase(p), { timeout }).toBe(ph);
// muestrea por frame: bbox del path SVG en coordenadas del marco + opacidades del contenido
async function sampleUntil(page, done, max = 400) {
  return page.evaluate(([done, max]) => new Promise(res => {
    const out = [], path = document.querySelector('#drop-path'), f = document.querySelector('#wf-frame').getBoundingClientRect();
    const tick = () => { const d = window.__proto.drop; let bb = null;
      if (path.getAttribute('d')) { const b = path.getBBox(); bb = { x: b.x, y: b.y, w: b.width, h: b.height }; }
      const ui = document.querySelector('#drop-ui');
      out.push({ p: d.phase, h: d.h.x, w: d.w.x, sag: d.sag, bb, d: path.getAttribute('d'),
        rowOp: +getComputedStyle(document.querySelector('#drop-row')).opacity,
        detVisible: !document.querySelector('#drop-detail').hidden && +getComputedStyle(document.querySelector('#drop-detail')).opacity > 0.01,
        uiT: getComputedStyle(ui).transform, dims: d.d, frameW: f.width });
      if (out.length >= max || (out.length > 3 && done.includes(d.phase))) res(out); else requestAnimationFrame(tick); };
    tick(); }), [done, max]);
}

test('origen: la silueta está SIEMPRE anclada al borde superior (y ≤ 0) mientras existe', async ({ page }) => {
  await page.click('[data-a="show"]');
  const s = await sampleUntil(page, ['rest']);
  const vis = s.filter(x => x.bb);
  expect(vis.length).toBeGreaterThan(10);
  for (const x of vis) { expect(x.bb.y).toBeLessThanOrEqual(0); expect(x.d.startsWith('M')).toBe(true); expect(x.d).toContain(' 0 Q'); }
  // centrado horizontal
  const last = vis.at(-1); expect(Math.abs(last.bb.x + last.bb.w / 2 - last.frameW / 2)).toBeLessThan(1.5);
});

test('emergencia y deformación: crece en alto Y ancho, con relación de aspecto cambiante y curvatura inferior (no es height/translateY)', async ({ page }) => {
  await page.click('[data-a="show"]');
  const s = (await sampleUntil(page, ['rest'])).filter(x => x.h > 2 && x.w > 2);
  const ratios = s.map(x => x.w / x.h);
  expect(Math.max(...ratios) / Math.min(...ratios)).toBeGreaterThan(2);          // estrecha y alta → ancha y baja
  expect(Math.max(...s.map(x => x.sag))).toBeGreaterThan(2);                     // la parte inferior se abomba
  expect(s[0].w).toBeLessThan(s.at(-1).dims.compactW / 3);                       // nace pequeña
  // ni el SVG ni la UI usan animaciones/transiciones de transform/height
  const anims = await page.evaluate(() => [...document.querySelectorAll('#drop-svg, #drop-ui')].flatMap(n => n.getAnimations()).length);
  expect(anims).toBe(0);
  for (const x of s) expect(x.uiT).toMatch(/matrix\(1, 0, 0, 1, /);              // la UI solo se centra; nunca escala
});

test('legibilidad: el texto solo es visible cuando la silueta ya lo contiene', async ({ page }) => {
  await page.click('[data-a="show"]');
  let s = await sampleUntil(page, ['rest']);
  await page.click('[data-a="expand"]');
  s = s.concat(await sampleUntil(page, ['expanded']));
  await page.click('[data-a="collapse"]');
  s = s.concat(await sampleUntil(page, ['rest']));
  await page.click('[data-a="retract"]');
  s = s.concat(await sampleUntil(page, ['gone']));
  for (const x of s) {
    if (x.rowOp > 0.99) { expect(x.h).toBeGreaterThanOrEqual(x.dims.compactH - 2); expect(x.w).toBeGreaterThanOrEqual(x.dims.compactW - 2); }
    if (x.detVisible && x.p !== 'collapsing') { expect(x.h).toBeGreaterThanOrEqual(x.dims.expandedH - 2.5); expect(x.w).toBeGreaterThanOrEqual(x.dims.expandedW - 2.5); }
  }
  // al retirarse, el contenido desaparece ANTES de que la silueta empiece a encoger
  const firstShrink = s.findIndex(x => x.p === 'retract1');
  expect(s[firstShrink].rowOp).toBeLessThan(0.05);
});

test('secuencia completa: vacío → nacimiento → reposo → expansión → contracción → retirada → vacío, y limpieza', async ({ page }) => {
  const seen = new Set();
  await page.click('[data-a="sequence"]');
  for (let i = 0; i < 120; i++) { seen.add(await phase(page)); if (seen.has('gone')) break; await page.waitForTimeout(50); }
  for (const p of ['birth', 'settling', 'rest', 'expanding', 'expanded', 'collapsing', 'contracting', 'retract1', 'retract2', 'gone']) expect(seen, p).toContain(p);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => ({ r: window.__proto.running, d: document.querySelector('#drop-path').getAttribute('d'),
    on: document.querySelector('#drop-ui').hasAttribute('data-on') }))).toEqual({ r: false, d: '', on: false });
});

test('interrupción: retirar a mitad de nacimiento y volver a mostrar es continuo (sin saltos)', async ({ page }) => {
  await page.click('[data-a="interrupt"]');
  const s = await sampleUntil(page, ['rest'], 600);
  for (let i = 1; i < s.length; i++) { expect(Math.abs(s[i].h - s[i - 1].h)).toBeLessThan(30); expect(Math.abs(s[i].w - s[i - 1].w)).toBeLessThan(60); }
  expect(s.at(-1).p).toBe('rest');
});

test('movimiento reducido: sin fotogramas intermedios de forma; solo fundido de opacidad', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.click('[data-a="show"]');
  const s = await sampleUntil(page, ['rest'], 30);
  const hs = [...new Set(s.filter(x => x.bb).map(x => Math.round(x.h)))];
  expect(hs.length).toBe(1);                                         // aparece ya asentada
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#drop-svg')).transitionProperty)).toContain('opacity');
  expect(await page.evaluate(() => window.__proto.running)).toBe(false);   // no hay bucle de animación
});

test('no roba el foco, no bloquea la página; teclado: Enter expande, Esc contrae, foco fuera contrae', async ({ page }) => {
  const trig = page.locator('[data-a="show"]');
  await trig.focus(); await page.keyboard.press('Enter');
  await waitPhase(page, 'rest');
  await expect(trig).toBeFocused();
  await page.click('#host-primary'); await expect(page.locator('#host-primary')).toBeFocused();
  const row = page.locator('#drop-row');
  await row.focus(); await page.keyboard.press('Enter');
  await waitPhase(page, 'expanded');
  await expect(row).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab'); await expect(page.locator('#drop-detail .primary')).toBeFocused();
  await page.keyboard.press('Escape'); await waitPhase(page, 'rest');
  await expect(row).toBeFocused();
  await row.press('Enter'); await waitPhase(page, 'expanded');
  await page.locator('#host-primary').focus(); await waitPhase(page, 'rest');
  expect(await page.locator('[inert], [aria-modal]').count()).toBe(0);
});

test('accesibilidad: SVG oculto a la AT, grupo con nombre, anuncio en región persistente', async ({ page }) => {
  await expect(page.locator('#drop-svg')).toHaveAttribute('aria-hidden', 'true');
  await page.click('[data-a="show"]'); await waitPhase(page, 'rest');
  await expect(page.locator('#drop-ui')).toHaveAttribute('role', 'group');
  await expect(page.locator('#drop-title')).toHaveText('Informe subido');
  await expect(page.locator('#live')).toContainText('Informe subido');
});

test('responsive y safe-area: la gota cabe en el marco; con notch la fila queda bajo el inset; targets ≥ 44', async ({ page }) => {
  for (const notch of [false, true]) {
    if (notch) await page.check('#opt-notch');
    for (const st of ['expanded', 'long']) {
      await page.selectOption('#wf-state', 'default'); await page.selectOption('#wf-state', st);
      const r = await page.evaluate(() => { const f = document.querySelector('#wf-frame').getBoundingClientRect(), d = window.__proto.drop;
        const row = document.querySelector('#drop-row').getBoundingClientRect();
        const t = [...document.querySelectorAll('#drop-ui button')].filter(b => b.offsetParent).map(b => b.getBoundingClientRect());
        const sat = parseFloat(getComputedStyle(document.querySelector('#wf-frame')).getPropertyValue('--sat')) || 0;
        return { fits: d.w.x <= f.width - 24 + 0.5, rowTop: row.top - f.top, sat, minT: Math.min(...t.map(b => Math.min(b.width, b.height))), ph: d.phase }; });
      expect(r.ph).toBe('expanded'); expect(r.fits).toBe(true);
      expect(r.rowTop).toBeGreaterThanOrEqual(r.sat); expect(r.minT).toBeGreaterThanOrEqual(44);
    }
  }
});

test('rendimiento (indicativo, este entorno): coste de dibujar un frame', async ({ page }) => {
  await page.click('[data-a="sequence"]');
  await waitPhase(page, 'gone', 8000);
  const c = await page.evaluate(() => window.__proto.drawCost.slice().sort((a, b) => a - b));
  const p95 = c[Math.floor(c.length * 0.95)];
  test.info().annotations.push({ type: 'draw-p95-ms', description: p95.toFixed(3) + ' ms en ' + c.length + ' frames' });
  console.log(`[perf] ${test.info().project.name}: draw p95 = ${p95.toFixed(3)} ms (${c.length} frames)`);
  expect(p95).toBeLessThan(4);   // umbral holgado; NO es una medición en dispositivo real
});
