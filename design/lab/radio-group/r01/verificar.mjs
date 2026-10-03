// Verificación de GRadioGroup r01 (kiwi): Chromium, Firefox y WebKit.
// Ejecutar: node design/lab/radio-group/r01/verificar.mjs   (usa el Playwright de design/lab/theme-playground)
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url));
const url = new URL('./index.html', import.meta.url).href;
const WIDTHS = [1280, 960, 720, 480, 360, 320];
const report = [];

for (const engine of ['chromium', 'firefox', 'webkit']) {
  const b = await pw[engine].launch();
  let pass = 0; const fails = []; const notes = [];
  const ok = (c, m) => { if (c) pass++; else fails.push(m); };
  const errs = [];
  const open = async (vw, opts = {}) => {
    const p = await b.newPage({ viewport: { width: vw, height: 900 }, ...opts });
    p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(`${vw}: ${m.text()}`); });
    p.on('pageerror', (e) => errs.push(`${vw}: ${e}`));
    await p.goto(url); await p.waitForTimeout(200); return p;
  };
  const active = (p) => p.evaluate(() => { const a = document.activeElement; return a?.type === 'radio' ? `${a.name}=${a.value}${a.checked ? '*' : ''}` : a?.id || a?.tagName; });
  const checkedOf = (p, name) => p.evaluate((n) => document.querySelector(`input[name="${n}"]:checked`)?.value ?? null, name);

  // ---------- 1. Teclado (radios nativos) ----------
  const p = await open(1280);
  // WebKit (macOS) no lleva Tab a los radios sin «acceso total por teclado»: se entra con focus() y se prueban las flechas
  const tabReaches = engine !== 'webkit';
  if (tabReaches) {
    await p.focus('#before'); await p.keyboard.press('Tab');
    ok(await active(p) === 'sexo=F', `Tab desde «Antes» entra en la primera opción sin selección (${await active(p)})`);
  } else { await p.focus('#s-kb-0'); notes.push('WebKit: Tab no llega a los radios (preferencia del sistema); flechas probadas con focus()'); }
  await p.keyboard.press('Space');
  ok(await checkedOf(p, 'sexo') === 'F', 'Espacio elige la opción enfocada cuando no hay ninguna');
  await p.keyboard.press('ArrowRight'); ok(await checkedOf(p, 'sexo') === 'M', 'Flecha derecha → Masculino');
  await p.keyboard.press('ArrowDown'); ok(await checkedOf(p, 'sexo') === 'X', 'Flecha abajo → Otro');
  // Envolver: Chromium y Firefox envuelven; WebKit no (comportamiento nativo de la plataforma, se registra como nota)
  await p.keyboard.press('ArrowRight'); const w1 = await checkedOf(p, 'sexo');
  await p.keyboard.press('ArrowLeft'); const w2 = await checkedOf(p, 'sexo');
  if (engine === 'webkit') notes.push(`WebKit: desde la última, flecha derecha → ${w1 === 'X' ? 'se queda (no envuelve)' : w1}; luego izquierda → ${w2}`);
  else { ok(w1 === 'F', 'Flecha derecha envuelve a la primera'); ok(w2 === 'X', 'Flecha izquierda envuelve a la última'); }
  ok(await p.evaluate(() => document.querySelectorAll('input[name=sexo]:checked').length) === 1, 'name común: una sola elegida');
  if (tabReaches) {
    await p.keyboard.press('Tab');
    ok((await active(p)).startsWith('frecuencia='), `Tab sale del grupo al siguiente (${await active(p)})`);
    await p.keyboard.press('Shift+Tab');
    ok(await active(p) === 'sexo=X*', `Shift+Tab vuelve a la elegida (${await active(p)})`);
  }
  // Opción deshabilitada: las flechas la saltan
  await p.focus('#s-dis1-0'); await p.keyboard.press('ArrowDown');
  ok(await checkedOf(p, 'frecuencia') === 'm', 'Flechas saltan la opción deshabilitada (Diario → Mensual)');
  // Solo lectura: flechas, Espacio y clic no cambian; sigue enfocable
  await p.focus('#s-ro-1');
  for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'Space']) await p.keyboard.press(k);
  await p.click('label[for="s-ro-2"]'); await p.click('label[for="s-ro2-2"]');
  ok(await checkedOf(p, 'sexo_ro') === 'M' && await checkedOf(p, 'modalidad_ro') === 'presencial', 'Solo lectura: flechas, Espacio y clic no cambian la elegida');
  ok(await p.evaluate(() => [...document.querySelectorAll('[name=sexo_ro],[name=modalidad_ro]')].every((r) => !r.disabled)), 'Solo lectura: radios no deshabilitados (enfocables)');
  // Grupo deshabilitado: fuera del Tab y del envío
  ok(await p.evaluate(() => [...document.querySelectorAll('[name=sangre_dis]')].every((r) => r.matches(':disabled'))), 'Grupo deshabilitado: todos los radios :disabled (fieldset disabled)');
  const fd = await p.evaluate(() => Object.fromEntries(new FormData(document.getElementById('f-states'))));
  ok(fd.sexo_ro === 'M' && fd.modalidad_ro === 'presencial', 'Solo lectura dentro de FormData');
  ok(!('sangre_dis' in fd), 'Grupo deshabilitado fuera de FormData');
  ok(!('alergias' in fd) && !('modalidad' in fd), 'Sin selección: el grupo no aparece en FormData');
  // name común en todos los grupos
  ok(await p.evaluate(() => [...document.querySelectorAll('.rg')].every((g) => new Set([...g.querySelectorAll('input[type=radio]')].map((r) => r.name)).size === 1)), 'Cada grupo: todos sus radios con el mismo name');
  ok(await p.evaluate(() => [...document.querySelectorAll('.rg')].every((g) => g.querySelectorAll('input:checked').length <= 1)), 'Cada grupo: como mucho una elegida');

  // ---------- 2. Semántica (marcado; en Chromium, además, el árbol de accesibilidad real) ----------
  const sem = await p.evaluate(() => [...document.querySelectorAll('.rg')].map((g) => ({
    id: g.dataset.field, tag: g.tagName, role: g.getAttribute('role'), app: [...g.classList].find((c) => c.startsWith('rg--')),
    named: Boolean(document.getElementById(g.getAttribute('aria-labelledby'))?.textContent.trim()),
    req: g.querySelector('.req') ? g.getAttribute('aria-required') === 'true' : !g.hasAttribute('aria-required'),
    nativeReq: g.querySelectorAll('input[required]').length,
    invalidOnRadios: g.querySelectorAll('input[aria-invalid]').length,
    iconsHidden: [...g.querySelectorAll('.rg__icon')].every((i) => i.getAttribute('aria-hidden') === 'true')
  })));
  for (const s of sem) {
    ok(s.role === 'radiogroup' && s.named, `${s.id}: radiogroup con nombre visible`);
    ok(['rg--inline', 'rg--segmented'].includes(s.app) ? s.tag === 'DIV' : s.tag === 'FIELDSET', `${s.id}: raíz ${s.tag} para ${s.app}`);
    ok(s.req && s.nativeReq === 0 && s.invalidOnRadios === 0, `${s.id}: aria-required solo en el grupo, sin required ni aria-invalid en los radios`);
    ok(s.iconsHidden, `${s.id}: iconos aria-hidden`);
  }
  if (engine === 'chromium') {
    const cdp = await p.context().newCDPSession(p);
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const groups = nodes.filter((n) => !n.ignored && n.role?.value === 'radiogroup');
    const prop = (n, k) => (n.properties || []).find((x) => x.name === k)?.value.value;
    ok(groups.length === sem.length, `AX: ${groups.length} radiogroup (esperados ${sem.length})`);
    ok(groups.every((g) => g.name?.value), 'AX: todos los radiogroup con nombre (también los fieldset)');
    const err = groups.find((g) => g.name?.value.startsWith('¿Alergias'));
    ok(prop(err, 'invalid') === 'true', 'AX: aria-invalid expuesto en el radiogroup con error');
    ok(groups.filter((g) => prop(g, 'required') === true).length >= 4, 'AX: aria-required expuesto en los grupos obligatorios');
    const radios = nodes.filter((n) => !n.ignored && n.role?.value === 'radio');
    ok(radios.every((r) => r.name?.value), 'AX: todos los radios con nombre (también solo icono)');
    ok(radios.every((r) => prop(r, 'invalid') !== 'true'), 'AX: ningún radio «inválido» antes de tiempo (sin required nativo)');
    const linea = radios.find((r) => r.name?.value === 'En línea');
    ok(linea && linea.description?.value === 'Videollamada; el enlace llega por correo.', 'AX: descripción por opción fuera del nombre (aria-describedby)');
    const iconOnly = radios.filter((r) => ['Lista', 'Tabla', 'Gráfica', 'Correo', 'Mensaje', 'Notificación'].includes(r.name?.value));
    ok(iconOnly.length >= 9, `AX: solo icono con nombre de texto (${iconOnly.length})`);
  }

  // ---------- 3. Ajuste y alineación por anchos y estados ----------
  for (const st of [false, true]) for (const w of WIDTHS) {
    await p.evaluate(([w, st]) => { __r01.setWidth(String(w)); __r01.setState(st); }, [w, st]);
    await p.waitForTimeout(120);
    const r = await p.evaluate(() => {
      const out = { overflow: [], tops: [], trunc: [], small: [], stacked: {} };
      document.querySelectorAll('.frame').forEach((f) => { if (f.scrollWidth > f.clientWidth + 1) out.overflow.push(f.querySelector('[data-field]')?.dataset.field); });
      document.querySelectorAll('.row[data-laid]').forEach((row) => {
        const byLine = {};
        [...row.children].forEach((c) => { const box = c.querySelector(':scope > .box'); (byLine[c.dataset.line] ||= []).push(box.getBoundingClientRect().top); });
        Object.values(byLine).forEach((ts) => out.tops.push(Math.max(...ts) - Math.min(...ts)));
      });
      document.querySelectorAll('.rg__name, .rg__desc, .rg__legend, .rg > .lbl').forEach((t) => { if (t.scrollWidth > t.clientWidth + 1 && getComputedStyle(t).display !== 'inline') out.trunc.push(t.textContent); });
      document.querySelectorAll('.rg__option').forEach((o) => { const b = o.getBoundingClientRect(); if (b.width && (b.width < 24 || b.height < 24)) out.small.push(`${o.textContent.trim()} ${b.width.toFixed(0)}×${b.height.toFixed(0)}`); });
      document.querySelectorAll('.rg--segmented').forEach((s) => { out.stacked[s.dataset.field] = s.dataset.fit === 'stack'; });
      out.pageOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
      return out;
    });
    const tag = `${w}px ${st ? 'con mensajes' : 'limpio'}`;
    ok(!r.overflow.length && !r.pageOverflow, `${tag}: sin desborde (${r.overflow.join(', ')})`);
    ok(r.tops.every((d) => d <= 1), `${tag}: cajas de una línea con el mismo top (máx. ${Math.max(0, ...r.tops).toFixed(2)})`);
    ok(!r.trunc.length, `${tag}: textos sin recortar (${r.trunc.slice(0, 3).join(' | ')})`);
    ok(!r.small.length, `${tag}: objetivos ≥ 24px (${r.small.slice(0, 3).join(', ')})`);
    if (w === 1280) ok(!r.stacked['r-sexo'] && !r.stacked['r-lado'], `${tag}: segmentados en una línea a 1280`);
    if (w === 320) ok(r.stacked['r-lado'] && r.stacked['mx320-segmented'] === false, `${tag}: «Lado dominante» (4 opciones) se apila; «Sexo» (3) cabe a 320`);
  }
  // La fila se parte antes de apilar el segmentado: con su línea propia, Sexo cabe sin apilarse a 480
  await p.evaluate(() => __r01.setWidth('480')); await p.waitForTimeout(120);
  const sexo = await p.evaluate(() => { const s = document.querySelector('[data-field="r-sexo"]'); return { line: s.dataset.line, stack: s.dataset.fit === 'stack' }; });
  ok(sexo.line === '1' && !sexo.stack, `480px: Sexo pasa a su propia línea y no se apila (línea ${sexo.line})`);

  // ---------- 4. RTL ----------
  await p.evaluate(() => __r01.setWidth('100%')); await p.waitForTimeout(120);
  const rtl = await p.evaluate(() => { const o = [...document.querySelectorAll('[data-field="rtl-sexo"] .rg__option')].map((x) => x.getBoundingClientRect().left); return o[0] > o[1] && o[1] > o[2]; });
  ok(rtl, 'RTL: la primera opción queda a la derecha (orden visual espejado)');
  await p.focus('#rtl-sexo-0'); await p.keyboard.press('ArrowLeft');
  const rtlLeft = await checkedOf(p, 'rtl-sexo');
  notes.push(`RTL: flecha izquierda desde la primera → ${rtlLeft === 'M' ? 'la siguiente (sigue la dirección visual)' : rtlLeft === 'X' ? 'la anterior/última (no invierte en RTL)' : rtlLeft === 'F' ? 'se queda (no invierte en RTL ni envuelve)' : rtlLeft}`);
  if (engine !== 'webkit') ok(rtlLeft === 'M', 'RTL: flecha izquierda va a la siguiente (visual)');

  // ---------- 5. Movimiento reducido ----------
  const dur = await p.evaluate(() => getComputedStyle(document.querySelector('.rg--segmented .rg__option')).transitionDuration);
  ok(parseFloat(dur) > 0, `Transición del relleno sin preferencia (${dur})`);
  await p.emulateMedia({ reducedMotion: 'reduce' });
  const dur2 = await p.evaluate(() => getComputedStyle(document.querySelector('.rg--segmented .rg__option')).transitionDuration);
  ok(dur2.split(',').every((d) => parseFloat(d) === 0), `Movimiento reducido: sin transición (${dur2})`);
  await p.close();

  // ---------- 6. Táctil (pointer: coarse) y forced-colors (Chromium) ----------
  if (engine === 'chromium') {
    const t = await open(360, { hasTouch: true, isMobile: true });
    const small = await t.evaluate(() => [...document.querySelectorAll('.rg__option')].filter((o) => { const b = o.getBoundingClientRect(); return b.width && (b.height < 44 || b.width < 44); }).map((o) => `${o.textContent.trim()} ${o.getBoundingClientRect().width.toFixed(0)}×${o.getBoundingClientRect().height.toFixed(0)}`));
    ok(!small.length, `Táctil: opciones ≥ 44×44 (${small.slice(0, 4).join(', ')})`);
    const segH = await t.evaluate(() => { const s = document.querySelector('[data-field="r-sexo"] .rg__options').getBoundingClientRect().height; const i = document.querySelector('[data-field="r-nac"] .box').getBoundingClientRect().height; return [s, i]; });
    ok(Math.abs(segH[0] - segH[1]) <= 1, `Táctil: la caja del segmentado mide lo que la de su vecino (${segH.join(' / ')})`);
    await t.close();
    const f = await open(1280);
    await f.emulateMedia({ forcedColors: 'active' });
    const fc = await f.evaluate(() => { const [a, b] = document.querySelectorAll('[data-field="mx-segmented"] .rg__option'); const box = document.querySelector('[data-field="mx-segmented"] .rg__options'); return { a: getComputedStyle(a).backgroundColor, b: getComputedStyle(b).backgroundColor, frame: getComputedStyle(box).outlineStyle }; });
    ok(fc.a !== fc.b && fc.frame === 'solid', `forced-colors: elegida distinta (${fc.a} vs ${fc.b}) y marco visible (${fc.frame})`);
    await f.close();
  }
  // Desarrollo: desde 1280 limpio, con estrecho de ventana real
  const n = await open(320);
  const pageOv = await n.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  ok(!pageOv, 'Ventana de 320px: sin desborde horizontal de la página');
  await n.close();

  ok(!errs.length, `Consola limpia (${errs.slice(0, 3).join(' | ')})`);
  await b.close();
  report.push({ engine, pass, fails, notes });
}

let total = 0, failed = 0;
for (const r of report) {
  total += r.pass + r.fails.length; failed += r.fails.length;
  console.log(`\n${r.engine}: ${r.pass}/${r.pass + r.fails.length}`);
  r.fails.forEach((f) => console.log('  FALLA ' + f));
  r.notes.forEach((x) => console.log('  nota  ' + x));
}
console.log(`\nTotal: ${total - failed}/${total}`);
process.exit(failed ? 1 : 0);
