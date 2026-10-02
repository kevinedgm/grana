// Verificación de GDivider r01 (kiwi), Chromium. Ejecutar: node design/lab/divider/r01/verificar.mjs
// (usa el Playwright de design/lab/theme-playground)
const { chromium } = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url));
const url = new URL('./index.html', import.meta.url).href;
const b = await chromium.launch();
let pass = 0; const fails = [];
const ok = (c, m) => { if (c) pass++; else fails.push(m); };
const errs = [];
const open = async (vw, opts = {}) => {
  const p = await b.newPage({ viewport: { width: vw, height: 900 }, ...opts });
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(vw + ': ' + m.text()); });
  p.on('pageerror', (e) => errs.push(vw + ': ' + String(e)));
  await p.goto(url); await p.waitForTimeout(150); return p;
};

// 1) Árbol de accesibilidad real (CDP) de cada divider de las secciones de ejemplo
const p = await open(1280);
const cdp = await p.context().newCDPSession(p);
await cdp.send('DOM.enable'); await cdp.send('Accessibility.enable');
const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '[data-ax] .gdiv' });
const expected = await p.$$eval('[data-ax] .gdiv', (els) => els.map((e) => ({
  sec: e.closest('[data-ax]').dataset.ax,
  kind: e.getAttribute('aria-hidden') === 'true' ? 'hidden' : e.classList.contains('gdiv--labeled') ? 'text' : 'sep',
  or: e.getAttribute('aria-orientation') || 'horizontal', text: e.textContent.trim()
})));
const axLines = [];
for (let i = 0; i < nodeIds.length; i++) {
  const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId: nodeIds[i], fetchRelatives: false });
  const n = nodes[0]; const e = expected[i];
  const role = n.role?.value; const orient = (n.properties || []).find((x) => x.name === 'orientation')?.value.value;
  axLines.push(`${e.sec} → ${n.ignored ? 'ignorado' : role}${orient ? ' ' + orient : ''}`);
  if (e.kind === 'hidden') ok(n.ignored, `${e.sec}: decorativo debería estar fuera del árbol (role ${role})`);
  if (e.kind === 'sep') ok(!n.ignored && role === 'separator' && orient === e.or, `${e.sec}: se esperaba separator ${e.or}, hay ${role} ${orient}`);
  if (e.kind === 'text') ok(role !== 'separator', `${e.sec}: con texto no debe ser separator`);
}
ok(nodeIds.length === expected.length && nodeIds.length >= 14, 'número de dividers de ejemplo: ' + nodeIds.length);
// El texto de los dividers con label está en el árbol como texto; las líneas (::before/::after) no aportan nada
const full = (await cdp.send('Accessibility.getFullAXTree')).nodes;
const texts = full.filter((n) => !n.ignored && n.role?.value === 'StaticText').map((n) => n.name?.value);
for (const t of ['O bien', 'أو', 'Elementos archivados hace más de treinta días, ordenados por fecha']) ok(texts.includes(t), 'texto del divider en el árbol: ' + t);
const seps = full.filter((n) => !n.ignored && n.role?.value === 'separator');
ok(seps.every((n) => !n.name?.value), 'ningún separator tiene nombre (no se nombra; el texto va como texto)');
// Ningún separator es hijo de una lista (salvo el uso indebido de la sección 10)
const listChild = await p.$$eval('ul > .gdiv, ol > .gdiv', (els) => els.filter((e) => !e.parentElement.hasAttribute('data-misuse')).length);
ok(listChild === 0, 'dividers como hijos directos de una lista fuera de la sección 10: ' + listChild);
// La tabla de la sección 8 coincide con la cuenta
ok(await p.$$eval('#ax-table tbody tr', (r) => r.length) === nodeIds.length, 'tabla de la sección 8 completa');

// 2) Contraste: texto ≥ 4.5:1; strong ≥ 3:1 en superficie y hundida
const labelR = await p.textContent('#label-ratio');
const lr = [...labelR.matchAll(/([\d.]+):1/g)].map((m) => +m[1]).filter((x, i, a) => i < a.length - 1);
ok(lr.length >= 3 && lr.every((r) => r >= 4.5), 'contraste del texto ≥ 4.5:1: ' + lr.join(', '));
const emph = await p.textContent('#emph-ratio');
const strong = [...emph.matchAll(/strong ([\d.]+):1/g)].map((m) => +m[1]);
ok(strong.length === 2 && strong.every((r) => r >= 3), 'strong ≥ 3:1: ' + strong.join(', '));

// 3) Vertical: altura = la de la fila, con align-items:center; inset vertical acorta 2 × inset
const geo = await p.evaluate(() => ['row-md', 'row-lg', 'row-bar', 'row-rtl'].map((id) => { const r = document.getElementById(id); const d = r.querySelector('.gdiv').getBoundingClientRect(); const cs = getComputedStyle(r); const content = r.getBoundingClientRect().height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth); const ins = parseFloat(getComputedStyle(r.querySelector('.gdiv')).marginTop); return { id, d: d.height, content, ins, btn: r.querySelector('button').getBoundingClientRect().height, ai: cs.alignItems }; }));
for (const g of geo) ok(Math.abs(g.d - (g.content - 2 * g.ins)) <= 1, `${g.id}: divider ${g.d}px, fila ${g.content}px, inset ${g.ins}px`);
ok(geo[1].d > geo[0].d, 'la fila más alta da un divider más alto');
ok(geo.every((g) => g.ai === 'center'), 'filas con align-items:center (el divider se estira igual)');

// 4) Inset start: la línea empieza donde el texto, en default y compact
for (const dens of ['default', 'compact']) {
  await p.selectOption('#nav-density', dens);
  const d = await p.evaluate(() => { const nav = document.querySelector('#navlist .gdiv'); const a = document.querySelector('#navlist a'); const r = document.createRange(); r.selectNodeContents(a.lastChild); return nav.getBoundingClientRect().left - r.getBoundingClientRect().left; });
  ok(Math.abs(d) <= 1, `inset start alineado con el texto (${dens}): ${d.toFixed(1)}px`);
}

// 5) RTL: hueco del inset a la derecha; texto con línea a ambos lados
const rtl = await p.evaluate(() => { const n = document.querySelector('#navlist-rtl .gdiv').getBoundingClientRect(), h = document.getElementById('navlist-rtl').getBoundingClientRect(); const lab = document.querySelector('#rtl-zone .gdiv--labeled'); const s = lab.querySelector('span').getBoundingClientRect(), l = lab.getBoundingClientRect(); return { right: h.right - n.right, left: n.left - h.left, before: s.left - l.left, after: l.right - s.right, dir: getComputedStyle(lab).direction }; });
ok(rtl.right > 30 && rtl.left <= 2, `RTL inset start a la derecha: der ${rtl.right}, izq ${rtl.left}`);
ok(rtl.dir === 'rtl' && Math.abs(rtl.before - rtl.after) <= 1, `RTL texto centrado: ${rtl.before} / ${rtl.after}`);

// 6) Texto largo: envuelve, nunca se recorta, las líneas conservan su mínimo
await p.evaluate(() => { document.querySelector('.frame').style.inlineSize = '200px'; });
const wrap = await p.evaluate(() => { const lab = document.querySelectorAll('.gdiv--labeled')[1]; const s = lab.querySelector('span'); return { h: s.getBoundingClientRect().height, sw: s.scrollWidth, cw: s.clientWidth, before: parseFloat(getComputedStyle(lab, '::before').width), after: parseFloat(getComputedStyle(lab, '::after').width) }; });
ok(wrap.h > 16 && wrap.sw <= wrap.cw + 1 && wrap.before >= 15 && wrap.after >= 15, 'texto largo envuelve y las líneas conservan su mínimo: ' + JSON.stringify(wrap));

// 7) Avisos de montaje (sección 10): los cuatro usos indebidos y ninguno más
const log = await p.textContent('#warnlog');
for (const k of ['(padre: display block)', 'flex, column', 'label solo se admite en horizontal', 'hijo directo de <ul>']) ok(log.includes(k), 'aviso: ' + k);
ok(log.split('\n').length === 4, 'exactamente 4 avisos en la carga: ' + log.split('\n').length);

// 8) Banco: decorativo y vertical producen el marcado y el árbol esperados
await p.selectOption('#b-or', 'vertical'); await p.check('#b-deco');
ok((await p.textContent('#b-markup')).includes('aria-hidden="true"') && !(await p.textContent('#b-markup')).includes('role='), 'banco: vertical decorativo sin role');
await p.uncheck('#b-deco');
ok((await p.textContent('#b-markup')).includes('role="separator" aria-orientation="vertical"'), 'banco: vertical semántico');
await p.selectOption('#b-or', 'horizontal'); await p.fill('#b-label', 'O bien');
ok((await p.textContent('#b-ax')).startsWith('Árbol: texto'), 'banco: con texto no es separator');
await p.close();

// 9) 320px y 375px: sin desborde de la página; también en RTL a 320px
for (const vw of [320, 375]) {
  const q = await open(vw);
  const o = await q.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, btn: [...document.querySelectorAll('.wf-btn')].filter((x) => x.scrollWidth > x.clientWidth + 1).length, out: [...document.querySelectorAll('.gdiv')].filter((d) => { const r = d.getBoundingClientRect(); return r.right > document.documentElement.clientWidth + 1 || r.left < -1; }).length }));
  ok(o.sw <= o.cw && o.out === 0 && o.btn === 0, `${vw}px sin desborde: ${o.sw}/${o.cw}, dividers fuera ${o.out}, botones desbordados ${o.btn}`);
  if (vw === 320) { await q.evaluate(() => { document.documentElement.dir = 'rtl'; }); const r = await q.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth); ok(r, '320px RTL sin desborde'); }
  await q.close();
}

// 10) forced-colors: la línea es borde (sobrevive); un fondo no sobreviviría
const fc = await open(1280, { forcedColors: 'active' });
const f = await fc.evaluate(() => { const h = document.querySelector('[data-ax] hr.gdiv'); const l = document.querySelector('.gdiv--labeled'); const v = document.querySelector('#row-md .gdiv'); const probe = document.createElement('div'); probe.style.cssText = 'background:#8a8a8a;block-size:1px'; document.body.append(probe); return { hr: getComputedStyle(h).borderTopColor + ' ' + getComputedStyle(h).borderTopWidth, lab: getComputedStyle(l, '::before').borderTopColor + ' ' + getComputedStyle(l, '::before').borderTopWidth, v: getComputedStyle(v).borderLeftColor + ' ' + getComputedStyle(v).borderLeftWidth, bodyBg: getComputedStyle(document.body).backgroundColor, probe: getComputedStyle(probe).backgroundColor }; });
ok([f.hr, f.lab, f.v].every((s) => /1px$/.test(s) && !s.startsWith(f.bodyBg)), 'forced-colors: líneas visibles ' + JSON.stringify(f));
ok(f.probe === f.bodyBg || f.probe !== 'rgb(138, 138, 138)', 'forced-colors: una línea dibujada con fondo pierde su color (' + f.probe + ')');
await fc.close();

await b.close();
ok(errs.length === 0, 'consola limpia: ' + errs.join(' | '));
console.log(axLines.join('\n'));
console.log(`\n${pass} correctas, ${fails.length} fallidas`);
if (fails.length) { console.log(fails.map((x) => '  FALLA: ' + x).join('\n')); process.exit(1); }
