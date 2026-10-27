// Auditoría de coco · Cornisa (paso 5): medidas estéticas y de movimiento sobre los ejemplos reales.
// Uso (desde la raíz del repo):  node design/lab/cornisa/auditoria-coco-verificar.mjs
// Sirve packages/cornisa en el puerto 4512 (propio), lanza Chromium de /opt/pw-browsers y apaga el servidor al terminar.
// Solo lee: no escribe nada dentro de packages/cornisa. Firefox y WebKit no están instalados: no verificados.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const PKG = path.join(root, 'packages/cornisa');
const PORT = 4512;
const BASE = `http://localhost:${PORT}`;
const EXEC = process.env.CHROMIUM || '/opt/pw-browsers/chromium';

const results = []; // { id, ok, msg }
const data = {};
const check = (id, ok, msg) => { results.push({ id, ok: !!ok, msg }); console.log(`${ok ? 'OK  ' : 'FALLA'} ${id} · ${msg}`); };
const info = (id, msg) => { results.push({ id, ok: null, msg }); console.log(`INFO ${id} · ${msg}`); };

/* ── 1. CSS estático ───────────────────────────────────────────────── */
const css = readFileSync(path.join(PKG, 'src/cornisa.css'), 'utf8');
const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
const colorLits = noComments.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi) || [];
const durLits = noComments.match(/\b\d*\.?\d+m?s\b/g) || [];
const fallbacks = noComments.match(/(var|env)\([^,()]+,[^)]*\)/g) || [];
const zIndex = noComments.match(/--cornisa-z:\s*[^;]+/)?.[0];
const pxLits = (noComments.match(/-?\d*\.?\d+px/g) || []).filter((v) => !['24px', '44px', '0px', '1px', '-1px'].includes(v));
data.css = { colorLits, durLits: [...new Set(durLits)], fallbacks, zIndex, pxLits: [...new Set(pxLits)] };
info('css.literales-color', `${colorLits.length} literales de color: ${[...new Set(colorLits)].join(' ')}`);
info('css.literales-duracion', `duraciones literales: ${[...new Set(durLits)].join(' ')}`);
info('css.respaldos', `var/env con respaldo: ${fallbacks.join(' | ') || 'ninguno'}`);
info('css.z-index', zIndex || 'sin z-index');
info('css.px', `medidas px fuera de 24/44/0/1: ${[...new Set(pxLits)].join(' ')}`);
check('css.capas', /@layer/.test(noComments), 'declara @layer grana.* (Grana exige las cuatro capas en la primera línea)');
check('css.hover-media', /@media \(hover: hover\)\s*{[^}]*:hover/.test(noComments) && !/^[^@]*:hover/m.test(noComments.split('@media (hover: hover)')[0]), 'todo :hover dentro de @media (hover: hover)');
check('css.focus-visible', /:focus-visible/.test(noComments), ':focus-visible presente');
check('css.reduced-motion', /prefers-reduced-motion: reduce/.test(noComments), 'prefers-reduced-motion: reduce');
check('css.forced-colors', /forced-colors: active/.test(noComments), 'forced-colors: active');
check('css.pointer-coarse', /pointer:\s*coarse/.test(noComments), '@media (pointer: coarse)');
check('css.rtl', /\[dir|:dir\(|inline-start|inline-end/.test(noComments), 'RTL por propiedades lógicas o [dir]');
check('css.transparencia', /prefers-reduced-transparency|prefers-contrast/.test(noComments), 'prefers-contrast / reduced-transparency');

/* ── utilidades en página ──────────────────────────────────────────── */
const PAGE_HELPERS = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  window.__px = (layers) => { // pinta capas (de abajo arriba) y devuelve el compuesto
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#fff'; cx.fillRect(0, 0, 1, 1);
    for (const c of layers) { cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); }
    return [...cx.getImageData(0, 0, 1, 1).data].slice(0, 3);
  };
  const lum = (rgb) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]); };
  window.__cr = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2); };
  window.__cs = (el, p) => getComputedStyle(el).getPropertyValue(p).trim();
  window.__pageBg = () => getComputedStyle(document.body).backgroundColor;
  window.__dropBg = () => getComputedStyle(document.querySelector('.cornisa-shape path')).fill;
  window.__state = () => {
    const p = document.querySelector('.cornisa-shape path'), ui = document.querySelector('.cornisa-ui');
    const d = p.getAttribute('d') || ''; let bb = null;
    if (d) { const b = p.getBBox(); bb = { x: b.x, y: b.y, w: b.width, h: b.height }; }
    const row = document.querySelector('.cornisa-row'), t = document.querySelector('.cornisa-title');
    const rr = row.getBoundingClientRect(), tr = t.getBoundingClientRect();
    return { t: performance.now(), d, bb, content: ui.hasAttribute('data-content'), expanded: ui.hasAttribute('data-expanded'),
      rowOp: +getComputedStyle(row).opacity, row: { x: rr.x, y: rr.y, w: rr.width, h: rr.height }, title: { x: tr.x, y: tr.y, w: tr.width, h: tr.height },
      titleFs: getComputedStyle(t).fontSize, uiTf: getComputedStyle(ui).transform, rootOp: +getComputedStyle(document.querySelector('.cornisa')).opacity };
  };
  window.__record = (ms) => new Promise((res) => { const out = []; const t0 = performance.now(); const f = () => { out.push(window.__state()); if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(out); }; requestAnimationFrame(f); });
  window.__rest = () => new Promise((res) => { let last = '', since = performance.now(); const t0 = performance.now(); const f = () => { const d = document.querySelector('.cornisa-shape path').getAttribute('d') || ''; if (d !== last) { last = d; since = performance.now(); } if (performance.now() - since > 350 || performance.now() - t0 > 5000) res(d); else requestAnimationFrame(f); }; requestAnimationFrame(f); });
};

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '-d', PKG], { stdio: 'ignore' });
const stop = () => { try { server.kill('SIGTERM'); } catch {} };
process.on('exit', stop);
await new Promise((r) => setTimeout(r, 700));

const browser = await chromium.launch({ executablePath: EXEC });
const grDefaults = readFileSync(path.join(root, 'packages/vue/src/styles/defaults.css'), 'utf8');

async function open(ctxOpts = {}, url = '/examples/index.html', setup) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...ctxOpts });
  await ctx.route(/cdn\.jsdelivr\.net|unpkg\.com/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(BASE + url);
  await page.waitForFunction(() => window.island);
  await page.evaluate(PAGE_HELPERS);
  if (setup) await setup(page);
  return { ctx, page, errors };
}
const show = (page, opts) => page.evaluate((o) => { window.__h = window.island.show(o); }, opts);

/* contraste de la superficie en reposo (la página ya debe tener una actividad con acción, «+N» y progreso o no) */
async function surfaceContrast(page, tag) {
  return page.evaluate((tag) => {
    const q = (s) => document.querySelector(s);
    const bg = window.__dropBg();
    const page = window.__pageBg();
    const B = window.__px([page, bg]);
    const C = (fg, under = [page, bg]) => window.__cr(window.__px([...under, fg]), window.__px(under));
    const r = {};
    r.titulo = C(window.__cs(q('.cornisa-title'), 'color'));
    const meta = q('.cornisa-meta'); if (meta && meta.textContent) r.meta = C(window.__cs(meta, 'color'));
    r.chevron = C(window.__cs(q('.cornisa-chevron'), 'color'));
    r.icono = C(window.__cs(q('.cornisa-icon'), 'color'));
    const quick = q('.cornisa-quick'); if (quick && !quick.hidden && quick.offsetParent) { const qb = window.__cs(quick, 'background-color'); r.rapidaTexto = window.__cr(window.__px([page, bg, qb, window.__cs(quick, 'color')]), window.__px([page, bg, qb])); r.rapidaContraGota = window.__cr(window.__px([page, bg, qb]), B); }
    const more = q('.cornisa-more'); if (more && !more.hidden) r.mas = C(window.__cs(more, 'color'));
    r.gotaContraPagina = window.__cr(B, window.__px([page]));
    return { tag, ...r, bg, page };
  }, tag);
}

/* ═══ A. Escritorio claro (ejemplo index, identidad neutra) ═══ */
{
  const { ctx, page, errors } = await open();
  // A1 · nacimiento: fotogramas
  const recP = page.evaluate(() => window.__record(1400));
  await show(page, { title: 'Cambios guardados', intent: 'success', duration: 'persistent', actions: [{ label: 'Deshacer' }] });
  const fr = await recP;
  const vis = fr.filter((f) => f.bb);
  const finalH = vis.at(-1).bb.h, finalW = vis.at(-1).bb.w;
  const maxH = Math.max(...vis.map((f) => f.bb.h)), maxW = Math.max(...vis.map((f) => f.bb.w));
  const firstContent = fr.findIndex((f) => f.content);
  const lastChange = fr.reduce((a, f, i) => (i && f.d !== fr[i - 1].d ? i : a), 0);
  const settleMs = Math.round(fr[lastChange].t - vis[0].t);
  const contentMs = Math.round(fr[firstContent].t - vis[0].t);
  // legibilidad: texto pintado (opacidad > 0.05) fuera de la silueta
  const leaks = fr.filter((f) => f.rowOp > 0.05 && f.bb && (f.row.x < f.bb.x - 0.5 || f.row.x + f.row.w > f.bb.x + f.bb.w + 0.5 || f.row.y + f.row.h > f.bb.y + f.bb.h + 0.5));
  const fsSet = new Set(fr.map((f) => f.titleFs)); const tfSet = new Set(fr.map((f) => f.uiTf));
  const titleH = new Set(fr.filter((f) => f.content).map((f) => Math.round(f.title.h * 10) / 10));
  data.nacimiento = { frames: fr.length, finalH, finalW, overshootH: +((maxH / finalH - 1) * 100).toFixed(1), overshootW: +((maxW / finalW - 1) * 100).toFixed(1), settleMs, contentMs, leaks: leaks.length, sagMax: null };
  info('mov.nacimiento', `gota ${Math.round(finalW)}×${Math.round(finalH)} px; sobrepaso alto ${data.nacimiento.overshootH} %, ancho ${data.nacimiento.overshootW} %; contenido visible a los ${contentMs} ms; asienta en ${settleMs} ms (${fr.length} fotogramas)`);
  check('mov.texto-dentro', leaks.length === 0, `fotogramas con texto visible fuera de la silueta: ${leaks.length}`);
  check('mov.texto-no-deforma', fsSet.size === 1 && [...tfSet].every((t) => /^matrix\(1, 0, 0, 1,/.test(t)), `tamaño de letra ${[...fsSet]} y transform de .cornisa-ui sin escala (${[...tfSet].length} valores, solo traslación)`);
  check('mov.alto-titulo-estable', titleH.size === 1, `alto del título mientras se ve: ${[...titleH].join(', ')} px`);

  // A2 · contraste en reposo (claro)
  await page.evaluate(() => window.__rest());
  await show(page, { title: 'Subiendo informe.pdf', progress: 40, duration: 'persistent' });
  await show(page, { title: 'Otro aviso', duration: 'persistent' });
  await page.evaluate(() => window.__rest());
  // la primaria sigue siendo «Cambios guardados» con «+2»
  data.contrasteClaro = await surfaceContrast(page, 'neutro, página #f5f5f5');
  info('contraste.neutro', JSON.stringify(data.contrasteClaro));
  check('contraste.titulo', data.contrasteClaro.titulo >= 4.5, `título ${data.contrasteClaro.titulo}:1`);
  check('contraste.chevron', data.contrasteClaro.chevron >= 3, `chevron (muted) ${data.contrasteClaro.chevron}:1`);
  check('contraste.rapida', data.contrasteClaro.rapidaTexto >= 4.5, `acción rápida texto ${data.contrasteClaro.rapidaTexto}:1`);

  // hover de la acción rápida y del conmutador (puntero fino)
  const hov = await page.evaluate(() => ({}));
  await page.hover('.cornisa-quick');
  const qh = await page.evaluate(() => { const q = document.querySelector('.cornisa-quick'); const under = [window.__pageBg(), window.__dropBg(), window.__cs(q, 'background-color')]; return window.__cr(window.__px([...under, window.__cs(q, 'color')]), window.__px(under)); });
  await page.hover('.cornisa-toggle');
  const th = await page.evaluate(() => { const q = document.querySelector('.cornisa-toggle'); const under = [window.__pageBg(), window.__dropBg(), window.__cs(q, 'background-color')]; return { t: window.__cr(window.__px([...under, window.__cs(document.querySelector('.cornisa-title'), 'color')]), window.__px(under)), velo: window.__cr(window.__px(under), window.__px(under.slice(0, 2))) }; });
  data.hover = { rapida: qh, conmutador: th };
  check('contraste.hover-rapida', qh >= 4.5, `acción rápida al pasar: texto ${qh}:1`);
  info('contraste.hover-conmutador', `título sobre el velo ${th.t}:1; el velo contra la gota ${th.velo}:1`);
  await page.mouse.move(5, 880);

  // A3 · foco con teclado: Tab desde el último botón de la página entra en la isla
  await page.focus('[data-demo="clear"]');
  const ringData = [];
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => {
      const a = document.activeElement; if (!a || !a.closest('.cornisa-ui')) return null;
      const cs = getComputedStyle(a); const bgEl = cs.backgroundColor;
      const under = [window.__pageBg(), window.__dropBg(), bgEl];
      // el anillo va por dentro (outline-offset negativo): se compara con el fondo propio del botón, que es lo que lo rodea
      return { cls: a.className, fv: a.matches(':focus-visible'), outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, offset: cs.outlineOffset, border: cs.borderTopWidth,
        anilloContraFondoBoton: window.__cr(window.__px([...under, cs.outlineColor]), window.__px(under)), anilloContraGota: window.__cr(window.__px([window.__pageBg(), window.__dropBg(), cs.outlineColor]), window.__px([window.__pageBg(), window.__dropBg()])) };
    });
    if (!r) break;
    // evidencia de píxeles: cuántos píxeles cambian entre foco y sin foco
    const sel = '.' + r.cls.split(' ')[0];
    const box = await page.locator(sel).boundingBox();
    const clip = { x: box.x, y: box.y, width: box.width, height: box.height };
    const withF = await page.screenshot({ clip });
    await page.evaluate(() => { const a = document.activeElement; a.dataset.f = '1'; a.style.outline = 'none'; });
    const without = await page.screenshot({ clip });
    await page.evaluate(() => { const a = document.querySelector('[data-f]'); a.style.outline = ''; delete a.dataset.f; });
    r.bytesDistintos = withF.equals(without) ? 0 : 1;
    ringData.push(r);
  }
  data.foco = ringData;
  for (const r of ringData) check(`foco.${r.cls.split(' ')[0]}`, r.fv && r.anilloContraFondoBoton >= 3 && r.bytesDistintos, `${r.outline} offset ${r.offset}; anillo contra lo que lo rodea ${r.anilloContraFondoBoton}:1; captura con/sin foco ${r.bytesDistintos ? 'distinta' : 'IDÉNTICA'}`);
  await page.keyboard.press('Escape');

  // A4 · tamaños de diana en compacto
  const sizes = await page.evaluate(() => [...document.querySelectorAll('.cornisa-ui button')].filter((b) => !b.hidden && b.offsetParent).map((b) => { const r = b.getBoundingClientRect(); const cs = getComputedStyle(b); return { cls: b.className.split(' ')[0], w: Math.round(r.width), h: Math.round(r.height), visibleH: Math.round(r.height - 2 * parseFloat(cs.borderTopWidth)), fs: cs.fontSize }; }));
  data.dianasCompacto = sizes;
  for (const s of sizes) check(`diana.${s.cls}`, s.w >= 44 && s.h >= 44, `${s.w}×${s.h} (pieza visible de ${s.visibleH} px de alto), letra ${s.fs}`);

  // A5 · expandido con cuerpo y acciones; foco en primaria y cerrar
  await page.evaluate(() => window.island.dismissAll()); await page.waitForTimeout(900);
  await show(page, { title: 'No se pudo subir informe.pdf', intent: 'error', duration: 'persistent', body: 'Se perdió la conexión. El archivo sigue en tu dispositivo.', actions: [{ label: 'Reintentar' }, { label: 'Ver detalles' }] });
  await page.evaluate(() => window.__rest());
  const recE = page.evaluate(() => window.__record(1200));
  await page.evaluate(() => window.__h.expand());
  const fe = await recE;
  const ve = fe.filter((f) => f.bb); const eH = ve.at(-1).bb.h, eMax = Math.max(...ve.map((f) => f.bb.h));
  const eLast = fe.reduce((a, f, i) => (i && f.d !== fe[i - 1].d ? i : a), 0);
  const detailFirst = fe.findIndex((f) => f.expanded);
  data.expandir = { h: Math.round(eH), overshoot: +((eMax / eH - 1) * 100).toFixed(1), settleMs: Math.round(fe[eLast].t - fe[0].t), detalleVisibleMs: detailFirst >= 0 ? Math.round(fe[detailFirst].t - fe[0].t) : null };
  info('mov.expandir', JSON.stringify(data.expandir));
  const exSizes = await page.evaluate(() => [...document.querySelectorAll('.cornisa-detail button')].map((b) => { const r = b.getBoundingClientRect(); const cs = getComputedStyle(b); const under = [window.__pageBg(), window.__dropBg(), cs.backgroundColor];
    return { txt: b.textContent, w: Math.round(r.width), h: Math.round(r.height), texto: window.__cr(window.__px([...under, cs.color]), window.__px(under)), borde: window.__cr(window.__px([window.__pageBg(), window.__dropBg(), cs.borderTopColor]), window.__px([window.__pageBg(), window.__dropBg()])) }; }));
  data.expandidoBotones = exSizes;
  for (const b of exSizes) check(`expandido.${b.txt}`, b.h >= 44 && b.texto >= 4.5, `${b.w}×${b.h}, texto ${b.texto}:1, borde contra la gota ${b.borde}:1`);
  const body = await page.evaluate(() => { const b = document.querySelector('.cornisa-body'); return { c: window.__cr(window.__px([window.__pageBg(), window.__dropBg(), window.__cs(b, 'color')]), window.__px([window.__pageBg(), window.__dropBg()])), fs: window.__cs(b, 'font-size'), lh: window.__cs(b, 'line-height') }; });
  check('expandido.cuerpo', body.c >= 4.5, `cuerpo ${body.c}:1, ${body.fs}/${body.lh}`);
  // foco con teclado en primaria y en cerrar
  await page.focus('[data-demo="clear"]'); await page.keyboard.press('Tab');
  const focEx = [];
  for (let i = 0; i < 5; i++) {
    const r = await page.evaluate(() => { const a = document.activeElement; if (!a || !a.closest('.cornisa-detail')) return null; const cs = getComputedStyle(a); const under = [window.__pageBg(), window.__dropBg(), cs.backgroundColor]; return { txt: a.textContent, ring: window.__cr(window.__px([...under, cs.outlineColor]), window.__px(under)), outline: `${cs.outlineWidth} ${cs.outlineColor} offset ${cs.outlineOffset}` }; });
    if (r) focEx.push(r);
    await page.keyboard.press('Tab');
  }
  data.focoExpandido = focEx;
  for (const r of focEx) check(`foco.expandido.${r.txt}`, r.ring >= 3, `anillo ${r.outline}: contra el fondo del botón ${r.ring}:1`);

  // A6 · recoger y retirar
  const recC = page.evaluate(() => window.__record(1200));
  await page.evaluate(() => window.__h.collapse());
  const fc = await recC; const fcl = fc.reduce((a, f, i) => (i && f.d !== fc[i - 1].d ? i : a), 0);
  const leaksC = fc.filter((f) => f.rowOp > 0.05 && f.bb && (f.row.y + f.row.h > f.bb.y + f.bb.h + 0.5 || f.row.x < f.bb.x - 0.5 || f.row.x + f.row.w > f.bb.x + f.bb.w + 0.5));
  const recR = page.evaluate(() => window.__record(1200));
  await page.evaluate(() => window.__h.dismiss());
  const frr = await recR; const fre = frr.findIndex((f, i) => i && !f.d);
  const leaksR = frr.filter((f) => f.rowOp > 0.05 && f.bb && (f.row.y + f.row.h > f.bb.y + f.bb.h + 0.5 || f.row.x < f.bb.x - 0.5 || f.row.x + f.row.w > f.bb.x + f.bb.w + 0.5));
  data.recoger = { settleMs: Math.round(fc[fcl].t - fc[0].t), fugas: leaksC.length };
  data.retirar = { ms: fre > 0 ? Math.round(frr[fre].t - frr[0].t) : null, fugas: leaksR.length, maxOpFuera: leaksR.length ? Math.max(...leaksR.map((f) => f.rowOp)) : 0 };
  info('mov.recoger', JSON.stringify(data.recoger)); info('mov.retirar', JSON.stringify(data.retirar));
  check('mov.texto-dentro-recoger-retirar', leaksC.length + leaksR.length === 0, `fotogramas con texto visible fuera de la silueta: recoger ${leaksC.length}, retirar ${leaksR.length} (opacidad máx. ${data.retirar.maxOpFuera})`);

  // A7 · interrupción: retirar a mitad del nacimiento y volver a mostrar a mitad de la retirada
  const recI = page.evaluate(() => window.__record(1600));
  await show(page, { title: 'Interrumpida', duration: 'persistent' });
  await page.waitForTimeout(120);
  await page.evaluate(() => window.__h.dismiss());
  await page.waitForTimeout(90);
  await show(page, { title: 'Vuelve', duration: 'persistent' });
  const fi = await recI; const vi = fi.filter((f) => f.bb);
  let maxJump = 0; for (let i = 1; i < fi.length; i++) if (fi[i].bb && fi[i - 1].bb) maxJump = Math.max(maxJump, Math.abs(fi[i].bb.h - fi[i - 1].bb.h), Math.abs(fi[i].bb.w - fi[i - 1].bb.w));
  data.interrupcion = { mayorSaltoPx: Math.round(maxJump * 10) / 10, termina: fi.at(-1).content, errores: [...errors] };
  check('mov.interrumpible', maxJump < 40 && fi.at(-1).content, `mostrar→retirar→mostrar a mitad: mayor salto entre fotogramas ${data.interrupcion.mayorSaltoPx} px; termina con contenido ${fi.at(-1).content}`);
  await page.evaluate(() => window.island.dismissAll()); await page.waitForTimeout(800);

  // A8 · rendimiento: métricas de CDP durante un nacimiento + expansión y durante 20 actualizaciones de progreso
  const cdp = await ctx.newCDPSession(page); await cdp.send('Performance.enable');
  const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
  const m0 = await m();
  const recP2 = page.evaluate(() => window.__record(1500));
  await show(page, { title: 'Rendimiento', duration: 'persistent', body: 'Cuerpo', actions: [{ label: 'Abrir' }] });
  await page.waitForTimeout(500); await page.evaluate(() => window.__h.expand());
  const fp = await recP2; const m1 = await m();
  const gaps = fp.slice(1).map((f, i) => f.t - fp[i].t).sort((a, b) => a - b);
  await page.evaluate(() => window.__h.collapse()); await page.waitForTimeout(800);
  const m2 = await m();
  await page.evaluate(async () => { for (let p = 0; p <= 100; p += 5) { window.__h.update({ progress: p }); await new Promise((r) => setTimeout(r, 16)); } });
  const m3 = await m();
  data.rendimiento = { animacion: { layouts: m1.LayoutCount - m0.LayoutCount, estilos: m1.RecalcStyleCount - m0.RecalcStyleCount, fotogramas: fp.length, p95ms: +gaps[Math.floor(gaps.length * 0.95)].toFixed(1), maxms: +gaps.at(-1).toFixed(1), layoutMs: +((m1.LayoutDuration - m0.LayoutDuration) * 1000).toFixed(1), estiloMs: +((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000).toFixed(1) },
    progreso21: { layouts: m3.LayoutCount - m2.LayoutCount, layoutMs: +((m3.LayoutDuration - m2.LayoutDuration) * 1000).toFixed(1) } };
  info('rend', JSON.stringify(data.rendimiento));
  const svgBox = await page.evaluate(() => { const r = document.querySelector('.cornisa-shape').getBoundingClientRect(); return `${Math.round(r.width)}×${Math.round(r.height)}`; });
  info('rend.svg', `la capa SVG mide ${svgBox} (toda la ventana) mientras la gota mide ≈ ${Math.round(finalW)}×${Math.round(finalH)}`);
  await page.evaluate(() => window.island.dismissAll()); await page.waitForTimeout(800);

  // A9 · página oscura del anfitrión (Cornisa no tiene modo oscuro: la gota es la misma)
  await page.addStyleTag({ content: 'body{background:#141414;color:#f2f2f2}' });
  await show(page, { title: 'Sobre página oscura', duration: 'persistent', actions: [{ label: 'Abrir' }] });
  await page.evaluate(() => window.__rest());
  data.contrasteOscuro = await surfaceContrast(page, 'neutro, página #141414 (bg de Grana oscuro)');
  info('contraste.pagina-oscura', JSON.stringify(data.contrasteOscuro));
  check('delimitacion.pagina-oscura', data.contrasteOscuro.gotaContraPagina >= 1.5, `gota contra página oscura ${data.contrasteOscuro.gotaContraPagina}:1 (sin borde ni sombra)`);
  const hasScheme = await page.evaluate(() => /prefers-color-scheme/.test([...document.styleSheets].map((s) => { try { return [...s.cssRules].map((r) => r.cssText).join(''); } catch { return ''; } }).join('')));
  info('esquema', `el CSS de Cornisa ${hasScheme ? 'sí' : 'no'} reacciona a prefers-color-scheme`);
  data.erroresA = errors;
  check('consola', errors.length === 0, `errores de consola: ${errors.length} ${errors.join(' | ')}`);
  await ctx.close();
}

/* ═══ B. 320 px, táctil, texto largo ═══ */
{
  const { ctx, page } = await open({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const coarse = await page.evaluate(() => ({ coarse: matchMedia('(pointer: coarse)').matches, hover: matchMedia('(hover: hover)').matches }));
  await show(page, { title: 'Sincronización completada para «Presupuesto anual del departamento de operaciones internacionales 2026»', duration: 'persistent', body: 'Se actualizaron 1.284 filas en 37 hojas.', actions: [{ label: 'Ver cambios' }, { label: 'Descartar' }] });
  await page.evaluate(() => window.__rest());
  const compact = await page.evaluate(() => { const ui = document.querySelector('.cornisa-ui').getBoundingClientRect(); const t = document.querySelector('.cornisa-title'); const p = document.querySelector('.cornisa-shape path').getBBox();
    return { ui: [Math.round(ui.left), Math.round(ui.right)], gota: [Math.round(p.x), Math.round(p.x + p.width), Math.round(p.height)], elipsis: t.scrollWidth > t.clientWidth, tituloVisible: Math.round(t.clientWidth), hscroll: document.documentElement.scrollWidth > innerWidth,
      dianas: [...document.querySelectorAll('.cornisa-row button')].filter((b) => !b.hidden && b.offsetParent).map((b) => { const r = b.getBoundingClientRect(); return `${b.className.split(' ')[0]} ${Math.round(r.width)}×${Math.round(r.height)}`; }) }; });
  await page.evaluate(() => window.__h.expand()); await page.evaluate(() => window.__rest());
  const exp = await page.evaluate(() => { const ui = document.querySelector('.cornisa-ui').getBoundingClientRect(); const t = document.querySelector('.cornisa-title'); const p = document.querySelector('.cornisa-shape path').getBBox();
    const btns = [...document.querySelectorAll('.cornisa-detail button')].map((b) => { const r = b.getBoundingClientRect(); return { t: b.textContent, r: [Math.round(r.left), Math.round(r.right), Math.round(r.bottom)] }; });
    return { ui: [Math.round(ui.left), Math.round(ui.right), Math.round(ui.bottom)], gota: [Math.round(p.x), Math.round(p.x + p.width), Math.round(p.height)], lineas: Math.round(t.getBoundingClientRect().height / parseFloat(getComputedStyle(t).lineHeight || 20)), tituloAlto: Math.round(t.getBoundingClientRect().height), btns, hscroll: document.documentElement.scrollWidth > innerWidth }; });
  data.estrecho = { coarse, compact, exp };
  info('320.compacto', JSON.stringify(compact)); info('320.expandido', JSON.stringify(exp));
  check('320.sin-scroll-h', !compact.hscroll && !exp.hscroll, 'sin desplazamiento horizontal a 320 px');
  check('320.dentro', compact.ui[0] >= 12 && compact.ui[1] <= 308 && exp.ui[0] >= 12 && exp.ui[1] <= 308, `contenido dentro de 12…308 px: compacto ${compact.ui}, expandido ${exp.ui}`);
  check('320.botones-dentro-gota', exp.btns.every((b) => b.r[0] >= exp.gota[0] && b.r[1] <= exp.gota[1] && b.r[2] <= exp.gota[2]), `botones dentro de la silueta expandida ${JSON.stringify(exp.btns)} gota ${exp.gota}`);
  info('pointer-coarse', `pointer coarse=${coarse.coarse}, hover=${coarse.hover}; dianas ${compact.dianas.join(', ')} (sin reglas propias de pointer: coarse; el mínimo ya es 44)`);
  // zoom de texto 200 % (raíz a 32 px) en 320
  await page.evaluate(() => window.island.dismissAll()); await page.waitForTimeout(800);
  await page.addStyleTag({ content: 'html{font-size:32px}' });
  await show(page, { title: 'Exportación lista', duration: 'persistent', body: 'Disponible en Documentos durante 7 días.', actions: [{ label: 'Abrir' }, { label: 'Compartir' }] });
  await page.evaluate(() => window.__rest()); await page.evaluate(() => window.__h.expand()); await page.evaluate(() => window.__rest());
  const z = await page.evaluate(() => { const ui = document.querySelector('.cornisa-ui'); const r = ui.getBoundingClientRect(); const p = document.querySelector('.cornisa-shape path').getBBox(); const det = document.querySelector('.cornisa-detail');
    return { ui: [Math.round(r.left), Math.round(r.right), Math.round(r.bottom)], gotaAlto: Math.round(p.height), alto: innerHeight, detalleDesplaza: det.scrollHeight > det.clientHeight + 1, hscroll: document.documentElement.scrollWidth > innerWidth }; });
  data.zoom200 = z; info('320.texto200', JSON.stringify(z));
  check('320.texto200', !z.hscroll && z.ui[2] <= z.alto && z.gotaAlto <= z.alto, 'texto al 200 % a 320×640: dentro del visor, sin scroll horizontal');
  await ctx.close();
}

/* ═══ C. Movimiento reducido ═══ */
{
  const { ctx, page } = await open({ reducedMotion: 'reduce' });
  const rec = page.evaluate(() => window.__record(700));
  await show(page, { title: 'Reducido', duration: 'persistent', body: 'x', actions: [{ label: 'Abrir' }] });
  const f = await rec; const hs = new Set(f.filter((x) => x.bb).map((x) => Math.round(x.bb.h)));
  const ops = f.map((x) => x.rootOp); const anim = await page.evaluate(() => document.getAnimations().map((a) => `${a.animationName || a.constructor.name}:${a.effect.getTiming().duration}`));
  const rec2 = page.evaluate(() => window.__record(500));
  await page.evaluate(() => window.__h.expand());
  const f2 = await rec2; const hs2 = new Set(f2.filter((x) => x.bb).map((x) => Math.round(x.bb.h)));
  const rec3 = page.evaluate(() => window.__record(600));
  await page.evaluate(() => window.__h.dismiss());
  const f3 = await rec3; const op3 = f3.map((x) => x.rootOp); const hs3 = new Set(f3.filter((x) => x.bb).map((x) => Math.round(x.bb.h)));
  data.reducido = { altosNacer: [...hs], opacidadMin: Math.min(...ops), anim, altosExpandir: [...hs2], altosRetirar: [...hs3], opRetirar: [Math.min(...op3), Math.max(...op3)] };
  info('reducido', JSON.stringify(data.reducido));
  check('reducido.sin-forma-intermedia', hs.size === 1 && hs2.size <= 2 && hs3.size <= 1, `alturas distintas: nacer ${[...hs]}, expandir ${[...hs2]}, retirar ${[...hs3]}`);
  // progreso indeterminado con reduce
  await page.waitForTimeout(400);
  await show(page, { title: 'Cargando', progress: 'indeterminate', duration: 'persistent' }); await page.waitForTimeout(300);
  const ind = await page.evaluate(() => { const b = document.querySelector('.cornisa-progress-bar'); return { anim: getComputedStyle(b).animationName, w: b.getBoundingClientRect().width, op: getComputedStyle(b).opacity }; });
  check('reducido.indeterminado', ind.anim === 'none', `barra indeterminada: animación ${ind.anim}, opacidad ${ind.op}`);
  await ctx.close();
}

/* ═══ D. Colores forzados (Chromium) ═══ */
{
  const { ctx, page } = await open({ forcedColors: 'active' });
  await show(page, { title: 'Forzados', duration: 'persistent', actions: [{ label: 'Abrir' }] });
  await page.evaluate(() => window.__rest());
  await page.focus('[data-demo="clear"]'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  const fc = await page.evaluate(() => { const p = document.querySelector('.cornisa-shape path'); const q = document.querySelector('.cornisa-quick'); const a = document.activeElement; const cs = getComputedStyle(p);
    return { fill: cs.fill, stroke: cs.stroke, sw: cs.strokeWidth, quick: `${getComputedStyle(q).backgroundColor} / ${getComputedStyle(q).color}`, foco: `${a.className} ${getComputedStyle(a).outlineStyle} ${getComputedStyle(a).outlineColor}`, fv: a.matches(':focus-visible') }; });
  data.forzados = fc; info('forzados', JSON.stringify(fc));
  check('forzados.silueta', fc.stroke !== 'none' && fc.sw !== '0px', `silueta con trazo ${fc.stroke} ${fc.sw}`);
  check('forzados.foco', fc.fv && !/none/.test(fc.foco), `foco: ${fc.foco}`);
  await ctx.close();
}

/* ═══ E. RTL ═══ */
{
  const { ctx, page } = await open({}, '/examples/index.html', (p) => p.evaluate(() => { document.documentElement.dir = 'rtl'; }));
  await show(page, { title: 'مرحبا بالعالم', duration: 'persistent', body: 'نص', actions: [{ label: 'افتح' }] });
  await page.evaluate(() => window.__rest());
  const c = await page.evaluate(() => { const g = (s) => document.querySelector(s).getBoundingClientRect(); return { icon: Math.round(g('.cornisa-icon').left), title: Math.round(g('.cornisa-title').left), chevron: Math.round(g('.cornisa-chevron').left), quick: Math.round(g('.cornisa-quick').left), toggle: Math.round(g('.cornisa-toggle').left) }; });
  await page.evaluate(() => window.__h.expand()); await page.evaluate(() => window.__rest());
  const e = await page.evaluate(() => { const b = [...document.querySelectorAll('.cornisa-detail button')].map((x) => [x.textContent, Math.round(x.getBoundingClientRect().left)]); const ui = document.querySelector('.cornisa-ui').getBoundingClientRect(); return { b, ui: [Math.round(ui.left), Math.round(ui.right)] }; });
  data.rtl = { compacto: c, expandido: e }; info('rtl', JSON.stringify(data.rtl));
  check('rtl.orden', c.icon > c.title && c.title > c.chevron && c.toggle > c.quick, `icono a la derecha del título, chevron a la izquierda, acción rápida a la izquierda del conmutador: ${JSON.stringify(c)}`);
  const close = e.b.find((x) => x[0] === 'Close' || x[0] === 'Cerrar'); const prim = e.b[0];
  check('rtl.cerrar', close && close[1] < prim[1], `«Cerrar» al final lógico (izquierda): ${JSON.stringify(e.b)}`);
  await ctx.close();
}

/* ═══ F. Tema de ejemplo (04, tokens --cornisa-*) ═══ */
{
  const { ctx, page } = await open({}, '/examples/cdn/04-casos-de-uso.html', (p) => p.evaluate(() => { document.documentElement.dataset.tema = 'ejemplo'; }));
  await show(page, { title: 'Tema de ejemplo', duration: 'persistent', actions: [{ label: 'Abrir' }] });
  await show(page, { title: 'Otra', duration: 'persistent' });
  await page.evaluate(() => window.__rest());
  data.temaEjemplo = await surfaceContrast(page, 'tema de ejemplo 04 (#1f3a5f)');
  info('tema-04', JSON.stringify(data.temaEjemplo));
  check('tema-04.titulo', data.temaEjemplo.titulo >= 4.5 && data.temaEjemplo.chevron >= 3, `título ${data.temaEjemplo.titulo}:1, chevron ${data.temaEjemplo.chevron}:1, rápida ${data.temaEjemplo.rapidaTexto}:1`);
  await ctx.close();
}

/* ═══ G. Con tokens de Grana (defaults.css), claro y oscuro: correspondencia propuesta ═══ */
const MAP = `
:root {
  --cornisa-bg: light-dark(color-mix(in srgb, var(--g-color-text) 84%, transparent), color-mix(in srgb, var(--g-glass-tint) calc(var(--g-glass-opacity) * 100%), transparent));
  --cornisa-fg: light-dark(var(--g-color-surface), var(--g-color-text));
  --cornisa-muted: color-mix(in oklab, var(--cornisa-fg) 78%, transparent);
  --cornisa-track: color-mix(in oklab, var(--cornisa-fg) 28%, transparent);
  --cornisa-hover: color-mix(in oklab, var(--cornisa-fg) 12%, transparent);
  --cornisa-focus: var(--cornisa-fg);
  --cornisa-radius-expanded: var(--g-radius-xl);
  --cornisa-max-width: calc(var(--g-space-1) * 104);
  --cornisa-font: var(--g-text-body-sm-weight) var(--g-text-body-sm-size) / var(--g-text-body-sm-line) var(--g-font-ui);
}
body { background: var(--g-color-bg); color: var(--g-color-text); }`;
for (const scheme of ['light', 'dark']) {
  const { ctx, page } = await open({ colorScheme: scheme }, '/examples/index.html', async (p) => {
    await p.addStyleTag({ content: grDefaults }); await p.addStyleTag({ content: MAP });
    await p.evaluate((s) => { document.documentElement.dataset.theme = s; }, scheme);
  });
  await show(page, { title: 'Con tokens de Grana', duration: 'persistent', actions: [{ label: 'Abrir' }] });
  await show(page, { title: 'Otra', duration: 'persistent' });
  await page.evaluate(() => window.__rest());
  const r = await surfaceContrast(page, `Grana ${scheme}`);
  await page.focus('[data-demo="clear"]'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  r.focoRapida = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); const under = [window.__pageBg(), window.__dropBg(), cs.backgroundColor]; return `${a.className}: ${window.__cr(window.__px([...under, cs.outlineColor]), window.__px(under))}`; });
  // la gota sobre el peor fondo (blanco en claro, negro en oscuro) por si la página tiene imágenes
  data[`grana_${scheme}`] = r; info(`grana.${scheme}`, JSON.stringify(r));
  check(`grana.${scheme}.texto`, r.titulo >= 4.5 && r.chevron >= 3, `título ${r.titulo}:1, chevron ${r.chevron}:1, gota contra página ${r.gotaContraPagina}:1`);
  await ctx.close();
}

await browser.close();
stop();
const fails = results.filter((r) => r.ok === false).length, oks = results.filter((r) => r.ok === true).length;
console.log(`\nResumen: ${oks} cumplen, ${fails} no cumplen, ${results.filter((r) => r.ok === null).length} informativas (Chromium; Firefox y WebKit no verificados)`);
if (process.argv.includes('--json')) console.log(JSON.stringify(data, null, 1));
