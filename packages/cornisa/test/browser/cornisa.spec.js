// Pruebas de navegador de la LIBRERÍA (no del prototipo).
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { inflateSync } from 'node:zlib';

/** Decodifica un PNG de 1×1 (RGB/RGBA, 8 bits). */
function decode1px(buf) {
  let off = 8, idat = [], type = 0;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off); const t = buf.toString('ascii', off + 4, off + 8);
    if (t === 'IHDR') type = buf[off + 8 + 9];
    if (t === 'IDAT') idat.push(buf.subarray(off + 8, off + 8 + len));
    off += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  void type; return [raw[1], raw[2], raw[3]]; // byte 0 = filtro
}

const errors = [];
async function open(page, file = 'page.html', { noPopover = false, query = '' } = {}) {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  if (noPopover) await page.addInitScript(() => { delete HTMLElement.prototype.popover; delete HTMLElement.prototype.showPopover; });
  await page.goto(`/test/browser/fixtures/${file}${query}`);
  await page.waitForFunction(() => window.ready === true);
}
test.afterEach(() => expect(errors, 'sin errores JS').toEqual([]));

const internals = (page) => page.evaluate(() => ({ ...window.island._internals.renderer._debug(), running: window.island._internals.renderer.running }));
const phase = async (page) => (await internals(page)).phase;
const state = (page, id) => page.evaluate((id) => window.island.get(id)?.state ?? 'removed', id);
const waitState = (page, id, s, timeout = 4000) => expect.poll(() => state(page, id), { timeout }).toBe(s);
const show = (page, opts) => page.evaluate((o) => window.island.show(o).id, opts);

/** Muestrea por frame la silueta y el contenido hasta que la gota esté en reposo/expandida/ida. */
function sample(page, until, max = 500) {
  return page.evaluate(([until, max]) => new Promise((res) => {
    const out = []; const r = window.island._internals.renderer; const path = document.querySelector('.cornisa-shape path'); const ui = document.querySelector('.cornisa-ui');
    const tick = () => {
      const d = r._debug(); let bb = null; const t = performance.now();
      if (path.getAttribute('d')) { const b = path.getBBox(); bb = { x: b.x, y: b.y, w: b.width, h: b.height }; }
      out.push({ ...d, t, bb, content: ui.hasAttribute('data-content'), detail: ui.hasAttribute('data-detail'), uiT: getComputedStyle(ui).transform });
      if (out.length >= max || (out.length > 2 && until.includes(d.phase))) res(out); else requestAnimationFrame(tick);
    };
    tick();
  }), [until, max]);
}

/* ── Top-Edge Droplet ─────────────────────────────────────────────────── */
test('origen y emergencia: anclada a y≤0, centrada, nace estrecha y se deforma (no height/translateY)', async ({ page }) => {
  await open(page);
  await page.evaluate(() => window.island.show({ title: 'Informe subido', intent: 'success' }));
  const s = (await sample(page, ['rest'])).filter((x) => x.bb && x.h > 2);
  expect(s.length).toBeGreaterThan(10);
  for (const x of s) expect(x.bb.y).toBeLessThanOrEqual(0);
  const vw = await page.evaluate(() => document.documentElement.clientWidth);
  const last = s.at(-1); expect(Math.abs(last.bb.x + last.bb.w / 2 - vw / 2)).toBeLessThan(1.5);
  const ratios = s.map((x) => x.w / x.h);
  expect(Math.max(...ratios) / Math.min(...ratios)).toBeGreaterThan(2);
  expect(Math.max(...s.map((x) => x.sag))).toBeGreaterThan(2);
  expect(await page.evaluate(() => [...document.querySelectorAll('.cornisa, .cornisa-shape, .cornisa-ui')].flatMap((n) => n.getAnimations()).length)).toBe(0);
  for (const x of s) expect(x.uiT).toMatch(/^matrix\(1, 0, 0, 1, /);
});

test('legibilidad: el contenido solo se muestra cuando la silueta lo contiene; se recoge antes de encoger', async ({ page }) => {
  await open(page);
  const id = await show(page, { title: 'Informe subido', body: 'Disponible en Documentos.', actions: [{ label: 'Abrir' }], duration: 'persistent' });
  let s = await sample(page, ['rest']);
  await page.evaluate((id) => window.island.get(id).expand(), id); s = s.concat(await sample(page, ['expanded']));
  await page.evaluate((id) => window.island.get(id).collapse(), id); s = s.concat(await sample(page, ['rest']));
  await page.evaluate((id) => { window.island.get(id).dismiss(); }, id); s = s.concat(await sample(page, ['gone']));   // sin devolver la promesa
  for (const x of s) {
    if (x.content) { expect(x.h).toBeGreaterThanOrEqual(x.dims.compactH - 2); expect(x.w).toBeGreaterThanOrEqual(x.dims.compactW - 2); }
    if (x.detail) { expect(x.h).toBeGreaterThanOrEqual(x.dims.expandedH - 2.5); expect(x.w).toBeGreaterThanOrEqual(x.dims.expandedW - 2.5); }
  }
  const shrink = s.findIndex((x) => x.phase === 'retract1');
  expect(s[shrink].content).toBe(false);
});

test('ciclo completo y limpieza: al retirarse no queda bucle, ni path, ni popover abierto; promesa resuelta', async ({ page }) => {
  await open(page);
  const res = await page.evaluate(async () => {
    const h = window.island.show({ title: 'Hola', duration: 'persistent' });
    await new Promise((r) => setTimeout(r, 900));
    await h.dismiss('test');
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const root = document.querySelector('.cornisa');
    return { state: h.state, d: document.querySelector('.cornisa-shape path').getAttribute('d'),
      open: root.hasAttribute('popover') ? root.matches(':popover-open') : !root.hidden, running: window.island._internals.renderer.running };
  });
  expect(res).toEqual({ state: 'removed', d: '', open: false, running: false });
});

test('interrupción: actualizar y expandir durante la entrada es continuo y termina en el estado pedido', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { const h = window.island.show({ id: 'x', title: 'Exportando', progress: 'indeterminate', duration: 'persistent', body: 'Preparando' });
    setTimeout(() => h.update({ title: 'Exportación lista para descargar', progress: null, intent: 'success', actions: [{ label: 'Descargar' }] }), 120);
    setTimeout(() => h.expand(), 200); });
  const s = await sample(page, ['expanded'], 700);
  // Continuidad medida contra el TIEMPO SIMULADO de la física (no el reloj del muestreador, cuyo orden respecto
  // al bucle de la gota varía entre frames). Un salto real = cambio sin tiempo simulado → velocidad infinita.
  // Cota: la mayor velocidad física de los muelles en estas distancias es < 4000 px/s.
  for (let i = 1; i < s.length; i++) {
    const dts = s[i].simT - s[i - 1].simT;
    const dh = Math.abs(s[i].h - s[i - 1].h), dw = Math.abs(s[i].w - s[i - 1].w);
    if (dts <= 0) { expect(dh).toBeLessThan(0.01); expect(dw).toBeLessThan(0.01); continue; }
    expect(dh / dts).toBeLessThan(6000);
    expect(dw / dts).toBeLessThan(6000);
  }
  await waitState(page, 'x', 'expanded');
  await expect(page.locator('.cornisa-title')).toHaveText('Exportación lista para descargar');
});

test('movimiento reducido: aparece asentada sin fotogramas intermedios ni bucle rAF', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await page.evaluate(() => window.island.show({ title: 'Guardado' }));
  const s = (await sample(page, ['rest'], 20)).filter((x) => x.bb);
  expect(new Set(s.map((x) => Math.round(x.h))).size).toBe(1);
  expect((await internals(page)).running).toBe(false);
});

/* ── accesibilidad / teclado / foco ───────────────────────────────────── */
test('no modal: no roba el foco, la página sigue operativa, sin inert/aria-modal', async ({ page }) => {
  await open(page);
  await page.focus('#trigger');
  await page.evaluate(() => window.island.show({ title: 'Guardado', duration: 'persistent' }));
  await page.waitForTimeout(300);
  await expect(page.locator('#trigger')).toBeFocused();
  await page.click('#host-primary');
  await expect(page.locator('#host-primary')).toBeFocused();
  expect(await page.locator('[inert], [aria-modal]').count()).toBe(0);
});

test('teclado: Enter expande, Tab llega a la acción, Esc contrae y devuelve el foco; foco fuera contrae', async ({ page }) => {
  await open(page);
  const id = await show(page, { title: 'Conversación archivada', body: 'Puedes deshacerlo.', actions: [{ label: 'Deshacer' }], duration: 'persistent' });
  await waitState(page, id, 'compact');
  const toggle = page.locator('.cornisa-toggle');
  await toggle.focus(); await page.keyboard.press('Enter');
  await waitState(page, id, 'expanded');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => phase(page)).toBe('expanded');
  await page.keyboard.press('Tab');
  await expect(page.locator('.cornisa-action--primary')).toBeFocused();
  await page.keyboard.press('Escape');
  await waitState(page, id, 'compact');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Enter'); await waitState(page, id, 'expanded');
  await page.locator('#host-primary').focus();
  await waitState(page, id, 'compact');
});

test('descartar con el foco dentro devuelve el foco al disparador', async ({ page }) => {
  await open(page);
  await page.focus('#trigger');
  const id = await show(page, { title: 'x', duration: 'persistent', body: 'b' });
  await waitState(page, id, 'compact');
  await page.locator('.cornisa-toggle').click();
  await expect.poll(() => phase(page)).toBe('expanded');
  await page.locator('.cornisa-close').click();
  await waitState(page, id, 'removed');
  await expect(page.locator('#trigger')).toBeFocused();
});

test('actualizar progreso no destruye la acción enfocada (no se pierde el foco)', async ({ page }) => {
  await open(page);
  const id = await show(page, { title: 'Subiendo', progress: 10, duration: 'persistent', actions: [{ label: 'Cancelar' }] });
  await waitState(page, id, 'compact');
  await page.evaluate((id) => window.island.get(id).expand(), id);
  await expect.poll(() => phase(page)).toBe('expanded');
  await page.locator('.cornisa-action--primary').focus();
  for (let p = 20; p <= 60; p += 10) await page.evaluate(([id, p]) => window.island.get(id).update({ progress: p }), [id, p]);
  await expect(page.locator('.cornisa-action--primary')).toBeFocused();
  await expect(page.locator('.cornisa-progress')).toHaveAttribute('aria-valuenow', '60');
});

test('regiones vivas: existen antes del primer anuncio; anuncio cortés; error = role=alert', async ({ page }) => {
  await open(page);
  await expect(page.locator('.cornisa-sr[role="status"]')).toHaveCount(1);
  await page.evaluate(() => window.island.show({ title: 'Guardado', body: 'Todo al día.' }));
  await expect(page.locator('.cornisa-sr[role="status"]')).toHaveText('Guardado. Todo al día.');
  await page.evaluate(() => window.island.show({ title: 'Sin conexión', intent: 'error', priority: 'high' }));
  await expect(page.locator('.cornisa-sr[role="alert"]')).toHaveText('Sin conexión');
  await expect(page.locator('.cornisa-shape')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.cornisa-ui')).toHaveAttribute('role', 'group');
});

test('varias actividades: una gota con +N (botón con nombre accesible); pasa a la siguiente', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { for (const t of ['A', 'B', 'C']) window.island.show({ id: t, title: t, duration: 'persistent' }); });
  await waitState(page, 'A', 'compact');
  const more = page.locator('.cornisa-more');
  await expect(more).toBeVisible(); await expect(more).toHaveText('+2');
  await expect(more).toHaveAttribute('aria-label', 'Show next notification (2 waiting)');
  const box = await more.boundingBox(); expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
  await more.click();
  await waitState(page, 'B', 'compact');
  await expect(page.locator('.cornisa-title')).toHaveText('B');
  expect(await state(page, 'A')).toBe('queued');
  await expect(more).toBeFocused();
});

test('axe: sin violaciones WCAG 2.x A/AA en compacto y expandido', async ({ page }) => {
  await open(page);
  const id = await show(page, { title: 'Informe subido', body: 'Disponible en Documentos.', actions: [{ label: 'Abrir' }], progress: 40, duration: 'persistent' });
  await waitState(page, id, 'compact'); await expect.poll(() => phase(page)).toBe('rest');
  let r = await new AxeBuilder({ page }).include('.cornisa').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  await page.evaluate((id) => window.island.get(id).expand(), id); await expect.poll(() => phase(page)).toBe('expanded');
  r = await new AxeBuilder({ page }).include('.cornisa').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});

/* ── responsive / safe-area / reserva ─────────────────────────────────── */
test('responsive: cabe en el viewport (−24 px), targets ≥ 44 px, sin scroll horizontal', async ({ page }) => {
  await open(page);
  const id = await show(page, { title: 'Sincronización completada para «Presupuesto anual del departamento de operaciones internacionales 2026»',
    body: 'Se actualizaron 1.284 filas. Donaudampfschifffahrtsgesellschaftskapitänsmütze.', actions: [{ label: 'Ver cambios' }, { label: 'Descartar' }], duration: 'persistent' });
  await waitState(page, id, 'compact');
  await page.evaluate((id) => window.island.get(id).expand(), id);
  await expect.poll(() => phase(page)).toBe('expanded');
  const r = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth; const ui = document.querySelector('.cornisa-ui').getBoundingClientRect();
    const t = [...document.querySelectorAll('.cornisa-ui button')].filter((b) => b.offsetParent).map((b) => b.getBoundingClientRect());
    return { vw, left: ui.left, right: ui.right, minT: Math.min(...t.map((b) => Math.min(b.width, b.height))), hscroll: document.documentElement.scrollWidth > vw };
  });
  expect(r.left).toBeGreaterThanOrEqual(11.5); expect(r.right).toBeLessThanOrEqual(r.vw - 11.5);
  expect(r.minT).toBeGreaterThanOrEqual(44); expect(r.hscroll).toBe(false);
});

test('safe-area: con inset superior, la gota lo cubre y el contenido queda debajo', async ({ page }) => {
  await open(page);
  await page.addStyleTag({ content: ':root{--cornisa-safe-top:48px}' });
  const id = await show(page, { title: 'Guardado', duration: 'persistent' });
  await waitState(page, id, 'compact'); await expect.poll(() => phase(page)).toBe('rest');
  const r = await page.evaluate(() => ({ row: document.querySelector('.cornisa-row').getBoundingClientRect().top, d: window.island._internals.renderer._debug() }));
  expect(r.row).toBeGreaterThanOrEqual(48); expect(r.d.h).toBeGreaterThanOrEqual(48 + 44);
});

test('--cornisa-reserved y reservedchange: alto ocupado en reposo y 0 al irse; destroy lo elimina', async ({ page }) => {
  await open(page);
  const id = await show(page, { title: 'Guardado', duration: 'persistent' });
  await waitState(page, id, 'compact'); await expect.poll(() => phase(page)).toBe('rest');
  const v = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--cornisa-reserved').trim());
  expect(v).toBe('52px');
  await page.evaluate((id) => window.island.get(id).dismiss(), id); await waitState(page, id, 'removed');
  expect(await page.evaluate(() => window.reserved)).toEqual([52, 0]);
  await page.evaluate(() => window.island.destroy());
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--cornisa-reserved'))).toBe('');
});

/* ── plataforma / seguridad / limpieza ────────────────────────────────── */
test('Popover API: si existe se usa popover=manual y se VE por encima de un <dialog> modal abierto antes', async ({ page }) => {
  await open(page);
  const uses = await page.evaluate(() => window.island._internals.renderer.usesPopover);
  test.skip(!uses, 'Este navegador no expone Popover API: se cubre en la prueba de alternativa');
  await page.addStyleTag({ content: 'dialog::backdrop{background:rgb(255,0,0)}' });
  await page.evaluate(() => document.getElementById('host-dialog').showModal());
  const id = await show(page, { title: 'Encima del diálogo', duration: 'persistent' });
  await waitState(page, id, 'compact'); await expect.poll(() => phase(page)).toBe('rest');
  // píxel dentro de la gota pero fuera del texto: si la isla quedara debajo, se vería el rojo opaco del backdrop
  const pt = await page.evaluate(() => { const d = window.island._internals.renderer._debug(); return { x: Math.round(d.dims.cx), y: Math.round(d.dims.compactH - 2) }; });
  const png = await page.screenshot({ clip: { x: pt.x, y: pt.y, width: 1, height: 1 } });
  const [r, g, b] = decode1px(png);
  expect(r).toBeLessThan(60); expect(g).toBeLessThan(60); expect(b).toBeLessThan(60);
  // limitación documentada: con un modal abierto, la isla es inerte (no operable), como el resto de la página
});

test('sin Popover API: alternativa position:fixed funcional', async ({ page }) => {
  await open(page, 'page.html', { noPopover: true });
  expect(await page.evaluate(() => window.island._internals.renderer.usesPopover)).toBe(false);
  const id = await show(page, { title: 'Sin popover', duration: 'persistent' });
  await waitState(page, id, 'compact');
  await expect(page.locator('.cornisa-title')).toBeVisible();
  await page.evaluate((id) => window.island.get(id).dismiss(), id);
  await waitState(page, id, 'removed');
  await expect(page.locator('.cornisa')).toBeHidden();
});

test('CSP estricta (sin unsafe-inline/eval): funciona y no genera violaciones', async ({ page }) => {
  await open(page, 'page-csp.html');
  const id = await show(page, { title: 'Con CSP', body: 'b', progress: 30, actions: [{ label: 'Ok' }], duration: 'persistent' });
  await waitState(page, id, 'compact');
  await page.evaluate((id) => window.island.get(id).expand(), id);
  await expect.poll(() => phase(page)).toBe('expanded');
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
});

test('seguridad: el contenido se inserta como texto (sin ejecución de HTML)', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.pwned = false; window.island.show({ title: '<img src=x onerror="window.pwned=true">', body: '<script>window.pwned=true</script>', duration: 'persistent' }); });
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.pwned)).toBe(false);
  await expect(page.locator('.cornisa-title')).toHaveText('<img src=x onerror="window.pwned=true">');
  expect(await page.locator('.cornisa img, .cornisa script').count()).toBe(0);
});

test('destroy(): elimina todos los nodos y deja de reaccionar a eventos', async ({ page }) => {
  await open(page);
  await page.evaluate(() => window.island.show({ title: 'x', duration: 'persistent' }));
  await page.waitForTimeout(200);
  const r = await page.evaluate(() => {
    window.island.destroy();
    const left = document.querySelectorAll('.cornisa, .cornisa-sr, .cornisa-probe, .cornisa-measure').length;
    window.dispatchEvent(new Event('resize')); document.dispatchEvent(new Event('visibilitychange'));
    let threw = false; try { window.island.show({ title: 'y' }); } catch { threw = true; }
    return { left, threw, running: window.island._internals.renderer.running };
  });
  expect(r).toEqual({ left: 0, threw: true, running: false });
});

test('texto al 200 % (aproximación: font-size raíz ×2): nada recortado en compacto ni en expandido', async ({ page }) => {
  await open(page);
  await page.addStyleTag({ content: 'html{font-size:200%}' });
  const id = await show(page, { title: 'Informe subido correctamente', body: 'Disponible en Documentos.', actions: [{ label: 'Abrir' }], duration: 'persistent' });
  await waitState(page, id, 'compact'); await expect.poll(() => phase(page)).toBe('rest');
  const fit = () => page.evaluate(() => {
    const d = window.island._internals.renderer._debug();
    const t = document.querySelector('.cornisa-title'); const ui = document.querySelector('.cornisa-ui').getBoundingClientRect();
    const lastBtn = [...document.querySelectorAll('.cornisa-ui button')].filter((b) => b.offsetParent).pop().getBoundingClientRect();
    return { titleClipV: t.scrollHeight > t.clientHeight + 1, shapeBottom: d.h, contentBottom: d.phase === 'expanded' ? lastBtn.bottom : document.querySelector('.cornisa-row').getBoundingClientRect().bottom, uiW: ui.width };
  });
  let r = await fit();
  expect(r.titleClipV).toBe(false); expect(r.contentBottom).toBeLessThanOrEqual(r.shapeBottom + 0.5);
  await page.evaluate((id) => window.island.get(id).expand(), id); await expect.poll(() => phase(page)).toBe('expanded');
  r = await fit();
  expect(r.titleClipV).toBe(false); expect(r.contentBottom).toBeLessThanOrEqual(r.shapeBottom + 0.5);
});

test('adapt: pantalla baja + texto al 200 %: el expandido cabe en el viewport y «Cerrar» es alcanzable', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await open(page);
  await page.addStyleTag({ content: 'html{font-size:200%}' });
  const id = await show(page, { title: 'Sincronización completada para «Presupuesto anual del departamento de operaciones internacionales 2026»',
    body: 'Se actualizaron 1.284 filas en 37 hojas. Revisa los conflictos marcados antes de publicar el informe final al equipo directivo y a los auditores externos.',
    actions: [{ label: 'Ver cambios' }, { label: 'Descartar' }], duration: 'persistent' });
  await waitState(page, id, 'compact');
  await page.evaluate((id) => window.island.get(id).expand(), id); await expect.poll(() => phase(page)).toBe('expanded');
  const r = await page.evaluate(() => ({ vh: innerHeight, shape: window.island._internals.renderer._debug().h, ui: document.querySelector('.cornisa-ui').getBoundingClientRect().bottom }));
  expect(r.shape).toBeLessThanOrEqual(r.vh); expect(r.ui).toBeLessThanOrEqual(r.vh);
  await page.locator('.cornisa-toggle').focus();
  const close = page.locator('.cornisa-close');
  // Firefox añade el contenedor desplazable como parada de tabulación (correcto: permite desplazar el texto con teclado)
  for (let i = 0; i < 6 && !(await close.evaluate((n) => n === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  const b = await close.boundingBox(); expect(b.y + b.height).toBeLessThanOrEqual(r.vh);   // el foco lo desplaza a la vista
});

test('polish: iconos SVG dibujados (sin glifos), chevron de expansión, sin borde discontinuo', async ({ page }) => {
  await open(page);
  const id = await show(page, { title: 'x', intent: 'warning', duration: 'persistent' });
  await waitState(page, id, 'compact');
  const r = await page.evaluate(() => ({ iconSvg: !!document.querySelector('.cornisa-icon > svg'), iconText: document.querySelector('.cornisa-icon').textContent.trim(),
    chevron: !!document.querySelector('.cornisa-toggle .cornisa-chevron[aria-hidden="true"]'), closeStyle: getComputedStyle(document.querySelector('.cornisa-close')).borderTopStyle }));
  expect(r).toEqual({ iconSvg: true, iconText: '', chevron: true, closeStyle: 'solid' });
});


/* ── r03 ─────────────────────────────────────────────────────────────── */
test('D3-01: la 1.ª acción está visible en compacto y funciona sin expandir; en expandido no se duplica', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.undone = 0; window.island.show({ id: 'u', title: 'Conversación archivada', duration: 'persistent', body: 'b',
    actions: [{ label: 'Deshacer', onSelect: (h) => { window.undone++; h.dismiss('undo'); } }, { label: 'Ver' }] }); });
  await waitState(page, 'u', 'compact'); await expect.poll(() => phase(page)).toBe('rest');
  const quick = page.locator('.cornisa-quick');
  await expect(quick).toBeVisible(); await expect(quick).toHaveText('Deshacer');
  expect(await page.getByRole('button', { name: 'Deshacer', exact: true }).count()).toBe(1);
  expect(await page.getByRole('button', { name: 'Ver', exact: true }).count()).toBe(0);          // la 2.ª solo en expandido
  const b = await quick.boundingBox(); expect(b.height).toBeGreaterThanOrEqual(44); expect(b.width).toBeGreaterThanOrEqual(44);
  expect(await quick.evaluate((n) => [getComputedStyle(n).appearance, getComputedStyle(n).borderTopLeftRadius])).toEqual(['none', '22px']);
  await page.locator('.cornisa-toggle').focus(); await page.keyboard.press('Tab');
  await expect(quick).toBeFocused();                                                  // orden: conmutador → acción rápida
  await page.locator('.cornisa-toggle').click(); await expect.poll(() => phase(page)).toBe('expanded');
  await expect(quick).toBeHidden();
  expect(await page.getByRole('button', { name: 'Deshacer', exact: true }).count()).toBe(1);      // la del detalle, no dos
  await page.locator('.cornisa-toggle').click(); await expect.poll(() => phase(page)).toBe('rest');
  await quick.click();
  await waitState(page, 'u', 'removed');
  expect(await page.evaluate(() => window.undone)).toBe(1);
});

test('D3-01: título largo + acción en el ancho mínimo: se recorta el título, nunca la acción', async ({ page }) => {
  await open(page);
  const id = await show(page, { title: 'Sincronización completada para «Presupuesto anual del departamento de operaciones internacionales 2026»', actions: [{ label: 'Ver cambios' }], duration: 'persistent' });
  await waitState(page, id, 'compact'); await expect.poll(() => phase(page)).toBe('rest');
  const r = await page.evaluate(() => { const q = document.querySelector('.cornisa-quick'), t = document.querySelector('.cornisa-title'), ui = document.querySelector('.cornisa-ui').getBoundingClientRect(), qb = q.getBoundingClientRect();
    return { quickClipped: q.scrollWidth > q.clientWidth + 1, titleEllipsis: t.scrollWidth > t.clientWidth, inside: qb.right <= ui.right + 0.5 && qb.left >= ui.left - 0.5, vw: document.documentElement.clientWidth, uiR: ui.right }; });
  expect(r.quickClipped).toBe(false); expect(r.inside).toBe(true); expect(r.titleEllipsis).toBe(true);
  expect(r.uiR).toBeLessThanOrEqual(r.vw - 11.5);
});

test('D3-02: sin atajo por defecto; la tecla no se intercepta', async ({ page }) => {
  await open(page);
  const id = await show(page, { title: 'x', duration: 'persistent' }); await waitState(page, id, 'compact');
  await page.focus('#trigger');
  const prevented = await page.evaluate(() => { const e = new KeyboardEvent('keydown', { key: 'N', code: 'KeyN', altKey: true, shiftKey: true, bubbles: true, cancelable: true }); document.activeElement.dispatchEvent(e); return e.defaultPrevented; });
  expect(prevented).toBe(false);
  await expect(page.locator('#trigger')).toBeFocused();
  expect(await page.locator('.cornisa-toggle').getAttribute('aria-keyshortcuts')).toBeNull();
});

test('D3-02: con shortcut, conmuta el foco entre la página y la isla; sin actividad no hace nada', async ({ page }) => {
  await open(page, 'page.html', { query: '?shortcut=Alt%2BShift%2BN' });
  await page.focus('#trigger');
  await page.keyboard.press('Alt+Shift+KeyN');
  await expect(page.locator('#trigger')).toBeFocused();                              // sin actividad: no roba
  const id = await show(page, { title: 'Guardado', duration: 'persistent' }); await waitState(page, id, 'compact');
  await expect(page.locator('.cornisa-toggle')).toHaveAttribute('aria-keyshortcuts', 'Alt+Shift+N');
  await page.keyboard.press('Alt+Shift+KeyN');
  await expect(page.locator('.cornisa-toggle')).toBeFocused();
  await page.keyboard.press('Alt+Shift+KeyN');
  await expect(page.locator('#trigger')).toBeFocused();
});
