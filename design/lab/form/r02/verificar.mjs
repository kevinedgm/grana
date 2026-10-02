// Verificación de r02 (kiwi), Chromium. Ejecutar: node design/lab/form/r02/verificar.mjs (usa el Playwright de design/lab/theme-playground)
const { chromium } = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url));
const url = new URL('./index.html', import.meta.url).href;
const b = await chromium.launch();
let pass = 0, fail = 0; const fails = [];
const ok = (c, m) => { if (c) pass++; else { fail++; fails.push(m); } };
const errs = [];
const page = async (vw) => { const p = await b.newPage({ viewport: { width: vw, height: 900 } }); p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()); }); p.on('pageerror', (e) => errs.push(String(e))); await p.goto(url); await p.waitForTimeout(200); return p; };

// Geometría: bordes y alineación
const geom = () => {
  const out = [];
  const T = 1;
  document.querySelectorAll('[data-frame] .layout').forEach((lay) => {
    const R = lay.getBoundingClientRect().right;
    [...lay.children].forEach((c) => { const r = c.getBoundingClientRect(); if (Math.abs(r.right - R) > T) out.push(`hijo de layout no llega al borde (${Math.round(R - r.right)}px): ${c.dataset.field || c.className}`); });
  });
  document.querySelectorAll('[data-frame] .row').forEach((row) => {
    const R = row.getBoundingClientRect().right;
    const lines = new Map();
    [...row.children].forEach((c) => { const t = Math.round(c.getBoundingClientRect().top); let k = [...lines.keys()].find((x) => Math.abs(x - t) <= T); if (k === undefined) { k = t; lines.set(k, []); } lines.get(k).push(c); });
    let prevBottom = -Infinity, domIdx = -1;
    [...lines.entries()].sort((a, b) => a[0] - b[0]).forEach(([, kids]) => {
      const right = Math.max(...kids.map((k) => k.getBoundingClientRect().right));
      if (Math.abs(right - R) > T) out.push(`línea que no llega al borde (${Math.round(R - right)}px): ${kids.map((k) => k.dataset.field).join('|')}`);
      const tops = kids.map((k) => k.querySelector(':scope > .box')?.getBoundingClientRect().top).filter((x) => x !== undefined);
      if (tops.length && Math.max(...tops) - Math.min(...tops) > T) out.push(`cajas desalineadas (${Math.round(Math.max(...tops) - Math.min(...tops))}px): ${kids.map((k) => k.dataset.field).join('|')}`);
      // orden visual = DOM: izquierda→derecha dentro de la línea, líneas de arriba abajo
      const sorted = [...kids].sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
      sorted.forEach((k) => { const i = [...row.children].indexOf(k); if (i < domIdx) out.push(`orden visual ≠ DOM: ${k.dataset.field}`); domIdx = i; });
      const top = Math.min(...kids.map((k) => k.getBoundingClientRect().top)); if (top < prevBottom - T) out.push('líneas superpuestas'); prevBottom = Math.max(...kids.map((k) => k.getBoundingClientRect().bottom));
      // ningún hijo se solapa con su vecino
      sorted.slice(1).forEach((k, i) => { if (k.getBoundingClientRect().left < sorted[i].getBoundingClientRect().right - T) out.push(`solape: ${k.dataset.field}`); });
    });
  });
  document.querySelectorAll('[data-frame]').forEach((f) => { if (f.scrollWidth > f.clientWidth + 1) out.push(`desborde en marco ${f.querySelector('form')?.id}`); f.querySelectorAll('.box').forEach((bx) => { if (bx.getBoundingClientRect().right > f.getBoundingClientRect().right + 1) out.push('caja fuera del marco'); }); });
  return out;
};

// 1) Marcos a cada ancho × estados
{
  const p = await page(1440);
  for (const w of ['1280', '960', '720', '480', '360', '320']) {
    for (const [st, lg] of [[false, false], [true, false], [false, true], [true, true]]) {
      await p.evaluate(([w, st, lg]) => { window.__r02.setWidth(w); window.__r02.setState(st); window.__r02.setLong(lg); }, [w, st, lg]);
      await p.waitForTimeout(60);
      const g = await p.evaluate(geom);
      ok(g.length === 0, `marco ${w} mensajes=${st} largas=${lg}: ${g.slice(0, 4).join(' · ')}`);
    }
  }
  // líneas esperadas en signos vitales
  for (const [w, n] of [['1280', 1], ['720', 2], ['360', 3]]) {
    await p.evaluate((w) => { window.__r02.setState(false); window.__r02.setLong(false); window.__r02.setWidth(w); }, w); await p.waitForTimeout(60);
    const lines = await p.evaluate(() => document.querySelector('[aria-label="Signos vitales"]').dataset.lines);
    ok(+lines === n, `signos vitales a ${w}: ${lines} líneas (esperado ${n})`);
  }
  await p.close();
}
// 2) Ventana estrecha: sin desborde de página
for (const vw of [320, 360, 480, 720, 960, 1280]) {
  const p = await page(vw);
  const g = await p.evaluate(geom);
  const sw = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(sw <= 0, `ventana ${vw}: desborde de página ${sw}px`);
  ok(g.length === 0, `ventana ${vw}: ${g.slice(0, 4).join(' · ')}`);
  await p.close();
}
// 3) Teclado y nombres accesibles
{
  const p = await page(1280);
  const expected = await p.evaluate(() => { const seen = new Set(); return [...document.querySelectorAll('#fm input, #fm select, #fm textarea, #fm button')].filter((e) => !e.disabled && e.offsetParent !== null || (e.type === 'radio' && !e.disabled)).filter((e) => { if (e.type !== 'radio') return true; if (seen.has(e.name)) return false; seen.add(e.name); return true; }).map((e) => e.id || e.textContent.trim()); });
  await p.focus('#fm-nombre');
  const got = [await p.evaluate(() => document.activeElement.id)];
  for (let i = 1; i < expected.length; i++) { await p.keyboard.press('Tab'); got.push(await p.evaluate(() => document.activeElement.id || document.activeElement.textContent.trim())); }
  ok(JSON.stringify(got) === JSON.stringify(expected), `Tab ≠ DOM en mediano:\n${got.join(',')}\n${expected.join(',')}`);
  // flechas en el segmentado
  await p.focus('#fm-sexo'); await p.keyboard.press('ArrowRight');
  ok(await p.evaluate(() => document.activeElement.value === '1' && document.activeElement.checked), 'flecha en el segmentado');
  const r = (role, name, sc = '#fj') => p.locator(sc).getByRole(role, { name, exact: true }).count();
  ok(await r('group', 'Teléfono') === 1, 'grupo Teléfono');
  ok(await r('combobox', 'Teléfono Código de país') === 1, 'selector «Teléfono Código de país»');
  ok(await r('textbox', 'Teléfono') === 1, 'número «Teléfono»');
  ok(await r('combobox', 'Temperatura Unidad') === 1, 'unidad de temperatura');
  ok(await r('textbox', 'Temperatura') === 1, 'valor de temperatura');
  ok(await r('combobox', 'Copago Moneda') === 1, 'moneda');
  ok(await r('textbox', 'Copago') === 1, 'importe');
  ok(await r('textbox', 'Folio de factura Serie') === 1, 'serie');
  ok(await r('textbox', 'Rango de edad desde') === 1 && await r('textbox', 'Rango de edad hasta') === 1, 'rango');
  ok(await r('textbox', 'Presión arterial (opcional) sistólica', '#fm') === 1 && await r('textbox', 'Presión arterial (opcional) diastólica', '#fm') === 1, 'presión arterial');
  ok(await r('radiogroup', 'Sexo', '#fm') === 1, 'radiogroup Sexo');
  ok(await p.evaluate(() => document.getElementById('fj-tel-pais').autocomplete === 'tel-country-code' && document.getElementById('fj-tel-num').autocomplete === 'tel-national' && document.getElementById('fj-ext').autocomplete === 'tel-extension'), 'autocomplete del teléfono');
  // Un foco visual por parte: el anillo está en la parte, no en la caja
  await p.focus('#fj-tel-pais'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab');
  ok(await p.evaluate(() => { const part = document.getElementById('fj-tel-pais').parentElement; return getComputedStyle(part).outlineStyle !== 'none' && getComputedStyle(part.parentElement).outlineStyle === 'none'; }), 'anillo en la parte');
  // Mensajes y aria-invalid por parte
  await p.evaluate(() => window.__r02.setState(true));
  ok(await p.evaluate(() => document.getElementById('fj-tel-pais').getAttribute('aria-invalid') === 'true' && !document.getElementById('fj-tel-num').hasAttribute('aria-invalid') && document.getElementById('fj-tel-num').getAttribute('aria-describedby').includes('fj-tel-msg')), 'error en la parte con mensaje del grupo');
  // Edad calculada
  await p.fill('#fm-nac', '12/05/1990');
  ok(await p.evaluate(() => document.getElementById('fm-edad').textContent === '36 años' && document.getElementById('fm-nac').getAttribute('aria-describedby').includes('fm-edad')), 'edad calculada y descrita');
  await p.close();
}
ok(errs.length === 0, 'consola: ' + errs.join(' | '));
console.log(`${pass}/${pass + fail} OK`); if (fails.length) console.log(fails.join('\n'));
await b.close();
