// Verificación de GFormReveal r01 (kiwi): Chromium, Firefox y WebKit.
// Ejecutar: node design/lab/form-reveal/r01/verificar.mjs   (usa el Playwright de design/lab/theme-playground)
// Prototipo: componentes reales de packages/vue/dist + XFormReveal de la página. Requiere `npm run build` previo.
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url));
const url = new URL('./index.html', import.meta.url).href;
const report = [];
const EXPECTED_WARN = /\[proto XFormReveal\] dentro de una GFormRow/;

for (const engine of ['chromium', 'firefox', 'webkit']) {
  const b = await pw[engine].launch();
  let pass = 0; const fails = []; const notes = []; const errs = [];
  const ok = (c, m) => { if (c) pass++; else fails.push(m); if (process.env.VERBOSE) console.log(engine, c ? "ok " : "NO ", m); };
  const open = async (vw = 1280, vh = 900, opts = {}) => {
    const p = await b.newPage({ viewport: { width: vw, height: vh }, ...opts });
    p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !EXPECTED_WARN.test(m.text())) errs.push(`${vw}: ${m.text()}`); });
    p.on('pageerror', (e) => errs.push(`${vw}: ${e}`));
    await p.goto(url);
    await p.waitForFunction(() => window.__reveals && window.__reveals.size >= 9);
    await p.evaluate(() => {
      window.__track = (sel, ms) => new Promise((res) => {
        const el = document.querySelector(sel); const r0 = el.getBoundingClientRect(); const s0 = scrollY;
        let dt = 0, dl = 0, ds = 0, n = 0; const t0 = performance.now();
        (function f() {
          const r = el.getBoundingClientRect();
          dt = Math.max(dt, Math.abs(r.top - r0.top)); dl = Math.max(dl, Math.abs(r.left - r0.left)); ds = Math.max(ds, Math.abs(scrollY - s0)); n++;
          if (performance.now() - t0 < ms) requestAnimationFrame(f); else res({ dt, dl, ds, n });
        })();
      });
      window.__st = (id) => { const el = document.getElementById(id); const cs = getComputedStyle(el); const body = el.firstElementChild;
        return { inert: el.hasAttribute('inert'), disabled: body.disabled, vis: cs.visibility, op: +cs.opacity, h: el.getBoundingClientRect().height,
          ovf: getComputedStyle(body).overflowY, anim: el.classList.contains('is-animating') }; };
      window.__fd = (id) => [...new FormData(document.getElementById(id)).keys()];
      // Pausa las transiciones de la raíz a la mitad de la de altura (o de la de opacidad si no hay altura)
      window.__half = (id, frac = 0.5) => { const el = document.getElementById(id); const as = el.getAnimations();
        const main = as.find((a) => a.transitionProperty === 'grid-template-rows') || as.find((a) => a.transitionProperty === 'opacity');
        if (!main) return null; const t = main.effect.getComputedTiming(); const half = (t.delay || 0) + t.duration * frac;
        as.forEach((a) => { a.pause(); a.currentTime = half; }); return { props: as.map((a) => a.transitionProperty) }; };
      window.__finish = (id) => document.getElementById(id).getAnimations().forEach((a) => { try { a.finish(); } catch {} });
    });
    await p.waitForTimeout(150);
    return p;
  };
  const settled = (p, id) => p.waitForFunction((i) => !window.__reveals.get(i).animating.value, id, { timeout: 3000 });
  const act = (p) => p.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
  const tabWorksOnRadios = engine !== 'webkit';
  if (!tabWorksOnRadios) notes.push('WebKit (macOS): Tab no llega a los radios (preferencia del sistema, #272); el salto del bloque se prueba entre campos de texto');

  // ================= 1. Carga y cerrado =================
  let p = await open();
  ok(await p.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.classList?.contains('x-reveal')).length) === 0, 'Al cargar no corre ninguna transición de bloque (plan 012)');
  let s = await p.evaluate(() => __st('w-rv-factura'));
  ok(s.inert && s.disabled && s.vis === 'hidden' && s.h === 0, `Cerrado: inert, fieldset deshabilitado, invisible y sin altura (${JSON.stringify(s)})`);
  const gapInfo = await p.evaluate(() => {
    const q = document.getElementById('w-factura'); const next = document.getElementById('w-obs').closest('#w-layout > *');
    return { dist: next.getBoundingClientRect().top - q.getBoundingClientRect().bottom, gap: parseFloat(getComputedStyle(document.getElementById('w-layout')).rowGap) };
  });
  ok(Math.abs(gapInfo.dist - gapInfo.gap) <= 0.5, `Cerrado no deja hueco: pregunta → siguiente = una separación (${gapInfo.dist.toFixed(2)} vs ${gapInfo.gap})`);
  ok(await p.evaluate(() => document.querySelectorAll('#w-rv-factura :invalid').length) === 0, 'Cerrado: ningún control dentro coincide con :invalid (fuera de la validación nativa)');
  let keys = await p.evaluate(() => __fd('w-form'));
  ok(!keys.some((k) => ['persona', 'curp', 'rfc', 'razon', 'cp', 'correo'].includes(k)), `Cerrado: FormData sin los campos del bloque (${keys})`);
  if (tabWorksOnRadios) { await p.focus('#w-factura-0'); } else { await p.focus('#w-nombre'); }
  await p.keyboard.press('Tab');
  ok(await act(p) === 'w-obs', `Tab salta el bloque cerrado (${await act(p)})`);
  const snapClosed = await p.locator('#w-layout').ariaSnapshot();
  ok(!/RFC|CURP|Tipo de persona/.test(snapClosed), 'Árbol accesible (snapshot de Playwright): el bloque cerrado no aparece');

  // ================= 2. Abrir: Δ 0, intermedio, asentado =================
  await p.evaluate(() => document.getElementById('w-factura').scrollIntoView({ block: 'center' }));
  let tr = p.evaluate(() => __track('#w-factura', 700)); await p.waitForTimeout(40);
  await p.click('label[for="w-factura-0"]');
  let t = await tr;
  ok(t.dt === 0 && t.dl === 0 && t.ds === 0, `Abrir: el disparador no se mueve y el desplazamiento no salta (Δtop ${t.dt}, Δleft ${t.dl}, Δscroll ${t.ds}, ${t.n} cuadros)`);
  await settled(p, 'w-rv-factura');
  s = await p.evaluate(() => __st('w-rv-factura'));
  ok(!s.inert && !s.disabled && s.vis === 'visible' && s.h > 0 && s.ovf === 'visible' && !s.anim, `Abierto y asentado: sin inert, habilitado, visible y overflow visible (${JSON.stringify(s)})`);
  ok(await p.evaluate(() => document.querySelectorAll('#w-rv-factura :invalid').length) > 0, 'Abierto: los obligatorios vacíos vuelven a la validación nativa (:invalid)');
  const snapOpen = await p.locator('#w-layout').ariaSnapshot();
  ok(/RFC/.test(snapOpen) && !/^\s*- group\b/m.test(snapOpen), 'Árbol accesible: abierto aparece y el cuerpo no añade un grupo sin nombre');
  if (tabWorksOnRadios) { await p.focus('#w-factura-0'); } else { await p.focus('#w-nombre'); }
  await p.keyboard.press('Tab');
  ok(await p.evaluate(() => document.getElementById('w-rv-factura').contains(document.activeElement)), `Abierto: Tab desde la pregunta entra en el bloque (${await act(p)})`);

  // Intermedio (formulario estrecho): pausa a la mitad
  await p.evaluate(() => document.getElementById('n-factura').scrollIntoView({ block: 'center' }));
  await p.click('label[for="n-factura-0"]');
  const half = await p.evaluate(() => __half('n-rv-factura'));
  s = await p.evaluate(() => __st('n-rv-factura'));
  await p.evaluate(() => __finish('n-rv-factura')); await settled(p, 'n-rv-factura');
  const full = await p.evaluate(() => __st('n-rv-factura'));
  ok(half && s.h > 0 && s.h < full.h && s.op > 0 && s.op < 1 && s.ovf === 'hidden' && !s.inert,
    `A la mitad: altura y opacidad intermedias, recortado, ya sin inert (h ${s.h.toFixed(1)}/${full.h.toFixed(1)}, op ${s.op.toFixed(2)}, ${half && half.props})`);

  // ================= 3. FormData por respuesta, anidado, conservar =================
  await p.click('label[for="w-persona-0"]'); await settled(p, 'w-rv-fisica');
  await p.fill('#w-curp', 'GODE561231HDFRRN09'); await p.fill('#w-rfc', 'GODE561231GR8');
  keys = await p.evaluate(() => __fd('w-form'));
  ok(['factura', 'persona', 'curp', 'rfc'].every((k) => keys.includes(k)) && !keys.includes('razon') && !keys.includes('representante'), `Física: FormData con CURP y sin razón social (${keys})`);
  await p.click('label[for="w-persona-1"]'); await settled(p, 'w-rv-moral');
  await p.fill('#w-razon', 'Clínica del Valle SA de CV');
  keys = await p.evaluate(() => __fd('w-form'));
  ok(keys.includes('razon') && keys.includes('representante') && !keys.includes('curp'), `Moral: FormData con razón social y sin CURP (${keys})`);
  tr = p.evaluate(() => __track('#w-factura', 600)); await p.waitForTimeout(40);
  await p.click('label[for="w-factura-1"]');
  t = await tr; await settled(p, 'w-rv-factura');
  ok(t.dt === 0 && t.ds === 0, `Cerrar: el disparador no se mueve (Δ ${t.dt}, Δscroll ${t.ds})`);
  keys = await p.evaluate(() => __fd('w-form'));
  ok(keys.includes('factura') && !['persona', 'curp', 'rfc', 'razon', 'representante', 'cp', 'correo'].some((k) => keys.includes(k)), `«No»: FormData sin ningún campo del bloque ni de sus anidados (${keys})`);
  ok(await p.evaluate(() => !__reveals.get('w-rv-moral').active.value && __reveals.get('w-rv-moral').open.value), 'Anidado: el bloque interior sigue «abierto» pero inactivo dentro del padre cerrado');
  await p.click('label[for="w-factura-0"]');
  const innerAnims = await p.evaluate(() => document.getElementById('w-rv-moral').getAnimations().length);
  await settled(p, 'w-rv-factura');
  const kept = await p.evaluate(() => ({ rfc: document.getElementById('w-rfc').value, razon: document.getElementById('w-razon').value, moral: document.getElementById('w-persona-1').checked, curp: document.getElementById('w-curp').value }));
  ok(kept.rfc === 'GODE561231GR8' && kept.razon === 'Clínica del Valle SA de CV' && kept.moral && kept.curp === 'GODE561231HDFRRN09', `Reabrir conserva lo escrito y lo elegido, también en anidados cerrados (${JSON.stringify(kept)})`);
  ok(innerAnims === 0, `Reabrir el padre no anima el anidado que ya estaba abierto (${innerAnims} transiciones)`);

  // ================= 4. Foco dentro al cerrar por programa =================
  await p.focus('#w-rfc');
  await p.evaluate(() => { __models.w.factura = 'no'; });
  await settled(p, 'w-rv-factura');
  ok(await act(p) === 'w-factura-1', `Cierre por programa con el foco dentro: el foco va a la pregunta (respuesta elegida), no a <body> (${await act(p)})`);

  // ================= 5. Errores, resumen y envío =================
  await p.fill('#n-nombre', 'Ana');
  await p.click('label[for="n-persona-0"]'); await settled(p, 'n-rv-fisica');
  await p.click('#n-save'); await p.waitForTimeout(250);
  let r = await p.evaluate(() => JSON.parse(JSON.stringify(__results.n)));
  ok(r.invalids === 1 && r.lastInvalid.includes('curp') && r.lastInvalid.includes('rfc') && !r.lastInvalid.includes('razon'), `Enviar con «Sí/Física»: invalid con curp y rfc, sin razón (bloque cerrado) (${r.lastInvalid})`);
  const sumBefore = await p.evaluate(() => { const s = document.querySelector('#n-form .g-error-summary'); return { hidden: s.hidden, links: [...s.querySelectorAll('a')].map((a) => a.getAttribute('href')) }; });
  ok(!sumBefore.hidden && sumBefore.links.includes('#n-curp'), `Resumen visible con enlace a la CURP (${sumBefore.links})`);
  ok(await p.getAttribute('#n-curp', 'aria-invalid') === 'true', 'CURP con error visible antes de cerrar');
  await p.click('label[for="n-factura-1"]'); await settled(p, 'n-rv-factura');
  const sumAfter = await p.evaluate(() => { const s = document.querySelector('#n-form .g-error-summary'); return { hidden: s.hidden, links: [...s.querySelectorAll('a')].map((a) => a.getAttribute('href')) }; });
  ok(sumAfter.hidden && sumAfter.links.length === 0, `«No»: los errores del bloque salen del resumen y este se oculta (${JSON.stringify(sumAfter)})`);
  await p.click('#n-save'); await p.waitForTimeout(250);
  r = await p.evaluate(() => JSON.parse(JSON.stringify(__results.n)));
  ok(r.submits === 1 && !['persona', 'curp', 'rfc'].some((k) => r.lastData.includes(k)), `Enviar con el bloque cerrado: submit (no invalid) y FormData sin sus campos (${r.lastData})`);
  await p.click('label[for="n-factura-0"]'); await settled(p, 'n-rv-factura');
  const reopened = await p.evaluate(() => ({ inv: document.getElementById('n-curp').getAttribute('aria-invalid'), msg: document.getElementById('n-curp-message')?.textContent.trim() ?? '(sin región)' }));
  ok(!reopened.inv && !reopened.msg, `Reabrir: los errores del bloque no reaparecen solos (estado «revelado» limpio) (${JSON.stringify(reopened)})`);
  await p.click('#n-save'); await p.waitForTimeout(250);
  r = await p.evaluate(() => JSON.parse(JSON.stringify(__results.n)));
  ok(r.invalids === 2 && r.lastInvalid.includes('curp'), `Tras reabrir, el envío vuelve a revelarlos (${r.lastInvalid})`);
  ok(await p.getAttribute('#n-curp', 'aria-invalid') === 'true', 'CURP con error visible tras el nuevo envío');

  // ================= 6. Interrupción y reversión =================
  // Se cierra, se congela al 10 % del tiempo y se vuelve a abrir: la transición nueva parte de la altura congelada
  await p.click('label[for="n-factura-1"]');
  await p.evaluate(() => __half('n-rv-factura', 0.1));
  const h1 = (await p.evaluate(() => __st('n-rv-factura'))).h;
  await p.click('label[for="n-factura-0"]');
  const h2 = (await p.evaluate(() => __st('n-rv-factura'))).h;
  ok(h1 > 0 && h1 < full.h && Math.abs(h2 - h1) < full.h * 0.05, `Interrumpir el cierre revierte desde la altura actual, sin saltar (${h1.toFixed(1)} → ${h2.toFixed(1)} de ${full.h.toFixed(1)})`);
  await settled(p, 'n-rv-factura');

  // ================= 7. Estrecho y RTL =================
  await p.click('label[for="n-persona-1"]'); await settled(p, 'n-rv-moral');
  const ovf = await p.evaluate(() => { const f = document.getElementById('n-form').closest('.frame'); return { sw: f.scrollWidth, cw: f.clientWidth, doc: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
  ok(ovf.sw <= ovf.cw && ovf.doc <= 0, `320 con dos niveles abiertos: sin desborde (${JSON.stringify(ovf)})`);
  await p.evaluate(() => document.getElementById('r-factura').scrollIntoView({ block: 'center' }));
  tr = p.evaluate(() => __track('#r-factura', 600)); await p.waitForTimeout(40);
  await p.click('label[for="r-factura-0"]');
  t = await tr; await settled(p, 'r-rv-factura');
  ok(t.dt === 0 && t.dl === 0, `RTL: el disparador no se mueve (Δ ${t.dt}/${t.dl})`);
  const rtl = await p.evaluate(() => { const b = document.querySelector('#r-rv-factura > .x-reveal__body'); const cs = getComputedStyle(b);
    const br = b.getBoundingClientRect(); const q = document.getElementById('r-persona').getBoundingClientRect();
    return { right: parseFloat(cs.borderRightWidth), left: parseFloat(cs.borderLeftWidth), indent: br.right - q.right }; });
  ok(rtl.right > 0 && rtl.left === 0 && rtl.indent > 0, `RTL: barra a la derecha y sangría desde la derecha (${JSON.stringify(rtl)})`);

  // ================= 8. Contraejemplo en GFormRow =================
  const row = await p.evaluate(() => ({ revealW: document.getElementById('rv-medio').getBoundingClientRect().width, trigW: document.getElementById('medio').getBoundingClientRect().width, rowW: document.getElementById('row-counter').getBoundingClientRect().width }));
  notes.push(`GFormRow (contraejemplo, 960): con el bloque CERRADO la fila le reserva ${row.revealW.toFixed(0)}px de ${row.rowW.toFixed(0)} (hueco vacío al lado del disparador de ${row.trigW.toFixed(0)}px)`);
  ok(row.revealW > 0, 'Contraejemplo: un bloque cerrado dentro de una fila deja una columna vacía (por eso no se admite)');

  // ================= 9. Soporte de interpolate-size (alternativa) =================
  notes.push(`interpolate-size: ${await p.evaluate(() => CSS.supports('interpolate-size', 'allow-keywords'))}; calc-size(): ${await p.evaluate(() => CSS.supports('height', 'calc-size(auto, size)'))}`);
  await p.close();

  // ================= 10. Movimiento reducido =================
  p = await open(1280, 900, { reducedMotion: 'reduce' });
  await p.evaluate(() => document.getElementById('w-factura').scrollIntoView({ block: 'center' }));
  tr = p.evaluate(() => __track('#w-factura', 400)); await p.waitForTimeout(40);
  await p.click('label[for="w-factura-0"]');
  const rm = await p.evaluate(() => { const el = document.getElementById('w-rv-factura'); return { props: el.getAnimations().map((a) => a.transitionProperty), h: el.getBoundingClientRect().height }; });
  t = await tr; await settled(p, 'w-rv-factura');
  const rmFull = (await p.evaluate(() => __st('w-rv-factura'))).h;
  ok(!rm.props.includes('grid-template-rows') && !rm.props.includes('margin-block-start') && rm.props.includes('opacity'), `Reducido: sin transición de altura ni margen, con fundido (${rm.props})`);
  ok(Math.abs(rm.h - rmFull) < 0.5, `Reducido: la altura final llega en el mismo cuadro (${rm.h.toFixed(1)} / ${rmFull.toFixed(1)})`);
  ok(t.dt === 0, `Reducido: el disparador no se mueve (Δ ${t.dt})`);
  await p.click('label[for="w-factura-1"]');
  await p.evaluate(() => __half('w-rv-factura'));
  s = await p.evaluate(() => __st('w-rv-factura'));
  ok(s.vis === 'visible' && s.op > 0 && s.op < 1 && s.inert, `Reducido, al cerrar: el fundido se ve (visible hasta el final) y ya es inert (${JSON.stringify(s)})`);
  await p.evaluate(() => __finish('w-rv-factura')); await settled(p, 'w-rv-factura');
  await p.close();

  // ================= 10b. forced-colors (emulación; solo Chromium la ofrece) =================
  if (engine === 'chromium') {
    p = await open(1280, 900, { forcedColors: 'active' });
    await p.click('label[for="w-factura-0"]'); await settled(p, 'w-rv-factura');
    const fc = await p.evaluate(() => { const cs = getComputedStyle(document.querySelector('#w-rv-factura > .x-reveal__body'));
      return { w: parseFloat(cs.borderInlineStartWidth), c: cs.borderInlineStartColor, fc: matchMedia('(forced-colors: active)').matches }; });
    ok(fc.fc && fc.w > 0 && !/rgba\(0, 0, 0, 0\)|transparent/.test(fc.c), `forced-colors: la barra (borde) sigue visible (${JSON.stringify(fc)})`);
    await p.close();
  }

  // ================= 11. Dentro de GDialog =================
  for (const [vw, vh, tag] of [[1280, 900, 'escritorio'], [375, 812, 'móvil']]) {
    p = await open(vw, vh);
    for (const [btn, pre, label] of [['#open-dlg', 'dc', 'centrado'], ['#open-dlg-top', 'dt', 'anclado arriba']]) {
      if (vw < 600 && pre === 'dt') continue;
      await p.click(btn); await p.waitForSelector(`#${pre}-q`); await p.waitForTimeout(400);
      tr = p.evaluate((sel) => __track(sel, 700), `#${pre}-q`); await p.waitForTimeout(40);
      await p.click(`label[for="${pre}-q-0"]`);
      t = await tr;
      const shape = vw < 600 ? 'hoja inferior' : label;
      notes.push(`GDialog ${shape} (${tag} ${vw}px): el disparador se mueve ${t.dt.toFixed(1)}px al abrir el bloque`);
      if (pre === 'dt') ok(t.dt === 0, `GDialog anclado arriba: el disparador no se mueve (Δ ${t.dt})`);
      await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    }
    await p.close();
  }

  ok(errs.length === 0, `Consola limpia (${errs.slice(0, 3).join(' | ')})`);
  report.push({ engine, pass, fails, notes });
  await b.close();
}

let total = 0, failed = 0;
for (const r of report) {
  total += r.pass + r.fails.length; failed += r.fails.length;
  console.log(`\n== ${r.engine}: ${r.pass}/${r.pass + r.fails.length}`);
  r.fails.forEach((f) => console.log('  FALLA', f));
  r.notes.forEach((n) => console.log('  nota', n));
}
console.log(`\nTotal: ${total - failed}/${total}`);
process.exit(failed ? 1 : 0);
