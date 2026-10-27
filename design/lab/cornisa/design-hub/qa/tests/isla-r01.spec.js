// QA runtime · isla r01 (prototipo F2). Verifica comportamiento del PROTOTIPO,
// no de la librería (que aún no existe). Cada test nombra el requisito que cubre.
import { test, expect } from '@playwright/test';

const URL = '/lab/isla/r01/index.html';
const errors = [];

test.beforeEach(async ({ page }, info) => {
  errors.length = 0;
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.goto(URL);
  // el marco del wireframe sigue al viewport del proyecto
  const w = info.project.use.viewport.width;
  const btn = { 1440: 1440, 834: 834, 393: 393, 320: 320 }[w];
  if (btn) await page.click(`[data-w="${btn}"]`);
});
test.afterEach(() => expect(errors, 'sin errores JS').toEqual([]));

const isl = p => p.locator('#isl .isl-act');
const waitPhase = (p, ph) => expect(isl(p)).toHaveAttribute('data-phase', ph, { timeout: 3000 });

test('no roba el foco al aparecer y la página sigue operativa (no modal)', async ({ page }) => {
  const trig = page.locator('[data-s="toast"]');
  await trig.focus();
  await page.keyboard.press('Enter');
  await waitPhase(page, 'compact');
  await expect(trig).toBeFocused();
  await page.click('#host-primary');                 // el anfitrión recibe clics
  await expect(page.locator('#host-primary')).toBeFocused();
  expect(await page.locator('[inert], [aria-modal]').count()).toBe(0);
});

test('compacto → expandido → Esc contrae y devuelve el foco (teclado)', async ({ page }) => {
  await page.click('[data-s="media"]');
  await waitPhase(page, 'compact');
  const toggle = page.locator('#isl .isl-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.focus(); await page.keyboard.press('Enter');
  await waitPhase(page, 'expanded');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  await expect(page.locator('#isl [data-act="0"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await waitPhase(page, 'compact');
  await expect(page.locator('#isl .isl-toggle')).toBeFocused();
  await expect(page.locator('#isl .isl-detail')).toBeHidden();
});

test('descartar con foco dentro devuelve el foco al disparador y limpia timers', async ({ page }) => {
  await page.click('[data-s="media"]');
  await waitPhase(page, 'compact');
  await page.locator('#isl .isl-toggle').click();
  await page.locator('#isl [data-close]').click();
  await expect(isl(page)).toHaveCount(0);
  await expect(page.locator('[data-s="media"]')).toBeFocused();
  expect(await page.evaluate(() => window.__proto.acts.size)).toBe(0);
});

test('actualizar sin recrear: mismo nodo, progreso con aria-valuenow, anuncios limitados', async ({ page }) => {
  await page.click('[data-s="upload"]');
  await waitPhase(page, 'compact');
  const nodeId = await isl(page).evaluate(n => (n.__tag = 'same', n.dataset.id));
  await expect(page.locator('#isl [role="progressbar"]')).toHaveAttribute('aria-valuenow', /\d+/);
  const anns = [];
  await page.exposeFunction('__ann', t => anns.push(t));
  await page.evaluate(() => new MutationObserver(() => window.__ann(document.querySelector('#isl-live').textContent))
    .observe(document.querySelector('#isl-live'), { childList: true, characterData: true, subtree: true }));
  await expect(page.locator('#isl .isl-title')).toHaveText('Informe subido', { timeout: 8000 });
  expect(await isl(page).evaluate(n => n.__tag)).toBe('same');          // no se recreó el nodo
  expect(await isl(page).getAttribute('data-id')).toBe(nodeId);
  await page.waitForTimeout(1200);
  // ~15 actualizaciones de progreso → como máximo hitos 25/50/75 + resultado
  expect(anns.length).toBeLessThanOrEqual(5);
  expect(anns.at(-1)).toContain('Informe subido');
});

test('interrupción: expandir→contraer en 60 ms termina contraída, sin animaciones apiladas', async ({ page }) => {
  await page.click('[data-s="int1"]');
  await page.waitForTimeout(1300);
  await waitPhase(page, 'compact');
  expect(await isl(page).evaluate(n => n.getAnimations().filter(a => a.playState === 'running').length)).toBe(0);
  const h = await isl(page).evaluate(n => n.getBoundingClientRect().height);
  expect(h).toBeGreaterThanOrEqual(44); expect(h).toBeLessThan(60);     // tamaño compacto final (sin "salto" residual)
});

test('interrupción: actualizar durante el morph parte del tamaño actual', async ({ page }) => {
  await page.click('[data-s="int2"]');
  await page.waitForTimeout(450);
  // muestreamos el alto durante la transición: no debe haber retrocesos bruscos a 0 ni saltos > 120 px entre frames
  const samples = await page.evaluate(() => new Promise(r => { const n = document.querySelector('#isl .isl-act'); const s = [];
    const f = () => { const el = document.querySelector('#isl .isl-act'); s.push(el ? el.getBoundingClientRect().height : -1); s.length < 40 ? requestAnimationFrame(f) : r(s); }; f(); }));
  expect(samples.every(v => v > 0)).toBe(true);
  for (let i = 1; i < samples.length; i++) expect(Math.abs(samples[i] - samples[i - 1])).toBeLessThan(120);
  await waitPhase(page, 'expanded');
  await expect(page.locator('#isl .isl-title')).toContainText('Exportación lista');
});

test('interrupción: descartar durante la entrada elimina nodo, estado y timers', async ({ page }) => {
  await page.click('[data-s="int3"]');
  await expect(isl(page)).toHaveCount(0, { timeout: 2000 });
  expect(await page.evaluate(() => ({ a: window.__proto.acts.size, o: window.__proto.order.length }))).toEqual({ a: 0, o: 0 });
  await page.waitForTimeout(1200);   // el anuncio pendiente debe haberse emitido y su timer liberado
  expect(await page.evaluate(() => window.__proto.timers.size)).toBe(0);
});

test('varias actividades: 1 primaria + 1 secundaria + contador; prioridad alta primero', async ({ page }) => {
  await page.click('[data-s="burst"]');
  await waitPhase(page, 'compact');
  await expect(page.locator('#isl .isl-title')).toHaveText('Sin conexión');
  await expect(isl(page)).toHaveCount(1);
  const sec = page.locator('#isl .isl-sec');
  await expect(sec).toHaveCount(1);
  await expect(sec).toHaveAttribute('aria-label', /y 2 más en espera/);
  const box = await sec.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
  await sec.click();
  await expect(page.locator('#isl .isl-toggle')).toBeFocused();
});

test('movimiento reducido (emulado por el SO): solo fundidos, sin transform/tamaño', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => {
    const orig = Element.prototype.animate; window.__kf = [];
    Element.prototype.animate = function (k, o) { window.__kf.push(Object.keys(Object.assign({}, ...k)).filter(x => x !== 'offset' && x !== 'easing' && x !== 'composite')); return orig.call(this, k, o); };
  });
  await page.click('[data-s="media"]'); await waitPhase(page, 'compact');
  await page.locator('#isl .isl-toggle').click(); await waitPhase(page, 'expanded');
  await page.locator('#isl [data-close]').click(); await expect(isl(page)).toHaveCount(0);
  const props = new Set((await page.evaluate(() => window.__kf)).flat());
  expect([...props]).toEqual(['opacity']);
});

test('responsive: isla dentro del marco y targets ≥ 44 px', async ({ page }) => {
  for (const s of ['long', 'multi', 'expanded']) {
    await page.selectOption('#wf-state', s);
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const f = document.querySelector('#wf-frame').getBoundingClientRect();
      const i = [...document.querySelectorAll('#isl > *')].map(n => n.getBoundingClientRect());
      const t = [...document.querySelectorAll('#isl button')].filter(b => b.offsetParent).map(b => b.getBoundingClientRect());
      return { inside: i.every(b => b.left >= f.left - 0.5 && b.right <= f.right + 0.5),
               minTarget: Math.min(...t.map(b => Math.min(b.width, b.height))) };
    });
    expect(r.inside, `isla dentro del marco (${s})`).toBe(true);
    expect(r.minTarget, `targets (${s})`).toBeGreaterThanOrEqual(44);
  }
});

test('safe-area: con notch la isla queda por debajo del inset', async ({ page }) => {
  await page.check('#opt-notch');
  await page.click('[data-s="media"]'); await waitPhase(page, 'compact');
  const { top, ftop } = await page.evaluate(() => ({ top: document.querySelector('#isl .isl-act').getBoundingClientRect().top,
    ftop: document.querySelector('#wf-frame').getBoundingClientRect().top }));
  expect(top - ftop).toBeGreaterThanOrEqual(48);
});

test('autodescartar se pausa con el foco dentro (WCAG 2.2.1)', async ({ page }) => {
  await page.click('[data-s="undo"]'); await waitPhase(page, 'compact');   // 6 s
  await page.locator('#isl .isl-toggle').focus();
  await page.waitForTimeout(6800);
  await expect(isl(page)).toHaveCount(1);
});
