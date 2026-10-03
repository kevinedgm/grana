// Verificación de GFormSection Fase 3 r01 (kiwi): Chromium, Firefox y WebKit.
// Ejecutar: node design/lab/form-section/r01/verificar.mjs   (usa el Playwright de design/lab/theme-playground)
// Prototipo: componentes reales de packages/vue/dist + XFormSection de la página. Requiere `npm run build` previo.
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url));
const url = new URL('./index.html', import.meta.url).href;
const report = [];

for (const engine of (process.env.ENGINES || 'chromium,firefox,webkit').split(',')) {
  const b = await pw[engine].launch();
  let pass = 0; const fails = []; const notes = []; const errs = [];
  let lastStep = 'inicio'; let inAlt = false;
  const ok = (c, m) => { lastStep = m.slice(0, 50); if (c) pass++; else fails.push(m); if (process.env.VERBOSE) console.log(engine, c ? 'ok ' : 'NO ', m); };
  const open = async (vw = 1280, vh = 900, opts = {}) => {
    const p = await b.newPage({ viewport: { width: vw, height: vh }, ...opts });
    p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) (inAlt ? notes : errs).push((inAlt ? 'Alternativa descartada, consola: ' : '') + `${vw} [tras «${lastStep}»]: ${m.text()}`); });
    p.on('pageerror', (e) => errs.push(`${vw}: ${e}`));
    await p.goto(url);
    await p.waitForFunction(() => window.__sections && window.__sections.size >= 40);
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
      window.__st = (id) => { const s = __sections.get(id); const pn = s.panel.value; const cs = getComputedStyle(pn); const body = pn.firstElementChild;
        const t = document.getElementById(id + '-toggle');
        return { inert: pn.inert, vis: cs.visibility, op: +cs.opacity, h: pn.getBoundingClientRect().height, ovf: getComputedStyle(body).overflowY,
          anim: s.animating.value, exp: t ? t.getAttribute('aria-expanded') : null, desc: t ? t.getAttribute('aria-describedby') : null }; };
      window.__fd = (id) => [...new FormData(document.getElementById(id)).keys()];
      window.__half = (panelId, frac = 0.5) => { const el = document.getElementById(panelId); const as = el.getAnimations();
        const main = as.find((a) => a.transitionProperty === 'grid-template-rows') || as.find((a) => a.transitionProperty === 'opacity');
        if (!main) return null; const t = main.effect.getComputedTiming(); const half = (t.delay || 0) + t.duration * frac;
        as.forEach((a) => { a.pause(); a.currentTime = half; }); return as.map((a) => a.transitionProperty); };
      window.__finish = (panelId) => document.getElementById(panelId).getAnimations().forEach((a) => { try { a.finish(); } catch {} });
      window.__inView = (el) => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; };
    });
    await p.waitForTimeout(150);
    return p;
  };
  const settled = (p, id) => p.waitForFunction((i) => !window.__sections.get(i).animating.value, id, { timeout: 4000 });
  const act = (p) => p.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);

  // ================= 1. Carga, anatomía y plegada =================
  let p = await open();
  notes.push(`hidden="until-found" (beforematch): ${await p.evaluate(() => 'onbeforematch' in document.body)}`);
  ok(await p.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.classList?.contains('x-section__panel')).length) === 0, 'Al cargar no corre ninguna transición de panel (plan 012)');
  let s = await p.evaluate(() => __st('w-s-adv'));
  ok(s.inert && s.vis === 'hidden' && s.h === 0 && s.exp === 'false', `Plegada: panel inert, invisible, sin altura; aria-expanded=false (${JSON.stringify(s)})`);
  ok(await p.evaluate(() => { const t = document.getElementById('w-s-adv-toggle'); return t.closest('h3') !== null && t.tagName === 'BUTTON' && t.type === 'button' && !!document.getElementById(t.getAttribute('aria-controls')); }),
    'Disclosure APG: h3 > button type=button con aria-controls hacia el panel');
  const snapAdv = await p.locator('#w-s-adv').ariaSnapshot();
  ok(/heading "Configuración avanzada" \[level=3\]/.test(snapAdv) && /button "Configuración avanzada"/.test(snapAdv) && !/Zona horaria/.test(snapAdv),
    `Árbol: encabezado de nivel 3 con el botón del mismo nombre; el cuerpo plegado no aparece`);
  const gapAdv = await p.evaluate(() => { const sec = document.getElementById('w-s-adv'); const hd = sec.querySelector('.g-form-section__header'); return sec.getBoundingClientRect().bottom - hd.getBoundingClientRect().bottom; });
  ok(Math.abs(gapAdv) <= 0.5, `Plegada no deja hueco bajo el encabezado (fondo sección − fondo encabezado = ${gapAdv.toFixed(2)}px)`);
  let keys = await p.evaluate(() => __fd('w-form'));
  ok(['canal', 'avisos', 'idioma', 'zona'].every((k) => keys.includes(k)), `Plegadas SÍ van en FormData (inert sin fieldset disabled) (${keys})`);
  ok(!['rfc', 'razon', 'cp'].some((k) => keys.includes(k)), `Sin agregar NO va en FormData (fieldset disabled) (${keys})`);
  ok(await p.evaluate(() => document.getElementById('w-s-adv-toggle').getAttribute('aria-describedby') === 'w-s-adv-digest' && document.getElementById('w-s-adv-digest').textContent.includes('Español')),
    'Plegada: el resumen de la aplicación describe al botón (aria-describedby)');
  ok(await p.evaluate(() => !!document.getElementById('w-copiar')), 'Plegada: las acciones del encabezado siguen visibles (ocultarlas movía el título)');
  if (engine !== 'webkit') {
    await p.focus('#w-s-pref-toggle'); await p.keyboard.press('Tab');
    const t1 = await act(p); await p.keyboard.press('Tab');
    ok(t1 === 'w-copiar' && await act(p) === 'w-s-adv-toggle', `Tab: botón → acción del encabezado → siguiente sección; salta el cuerpo plegado (${t1} → ${await act(p)})`);
    await p.keyboard.press('Tab');
    ok(await act(p) === 'w-s-fis-add', `Tab llega a «Agregar datos fiscales» sin pasar por sus campos (${await act(p)})`);
  } else {
    notes.push('WebKit (macOS): Tab no llega a botones ni radios (preferencia del sistema); el salto se prueba entre campos de texto');
    await p.focus('#w-correo'); await p.keyboard.press('Tab');
    ok(await act(p) === 'w-obs', `Tab (WebKit, campos de texto): de «Correo» a «Observaciones»; salta dos cuerpos plegados y uno sin agregar (${await act(p)})`);
  }
  const snapFis = await p.locator('#w-s-fis').ariaSnapshot();
  ok(!/heading/.test(snapFis) && /button "Agregar datos fiscales"/.test(snapFis), 'Sin agregar: sin encabezado en el árbol; botón «Agregar…»');
  ok(await p.evaluate(() => { const b = document.getElementById('w-s-fis-add'); return document.getElementById(b.getAttribute('aria-describedby'))?.textContent.includes('factura'); }),
    'Sin agregar: el texto secundario describe al botón');

  // ================= 2. Abrir con Enter, cerrar con Espacio: Δ 0, foco quieto =================
  await p.evaluate(() => document.getElementById('w-s-adv').scrollIntoView({ block: 'center' }));
  const nameBefore = await p.evaluate(() => document.getElementById('w-s-adv-toggle').textContent.trim());
  await p.focus('#w-s-adv-toggle');
  let tr = p.evaluate(() => __track('#w-s-adv-toggle', 700)); await p.waitForTimeout(40);
  await p.keyboard.press('Enter');
  let t = await tr; await settled(p, 'w-s-adv');
  s = await p.evaluate(() => __st('w-s-adv'));
  ok(t.dt === 0 && t.dl === 0 && t.ds === 0, `Abrir: el encabezado no se mueve y el desplazamiento no salta (Δtop ${t.dt}, Δleft ${t.dl}, Δscroll ${t.ds}, ${t.n} cuadros)`);
  ok(s.exp === 'true' && !s.inert && s.vis === 'visible' && s.h > 0 && s.ovf === 'visible' && s.desc === null, `Enter abre; asentado sin inert, visible, overflow visible, sin describedby (${JSON.stringify(s)})`);
  ok(await act(p) === 'w-s-adv-toggle', 'Abrir: el foco se queda en el botón');
  ok(await p.evaluate(() => document.getElementById('w-s-adv-toggle').textContent.trim()) === nameBefore, 'El nombre del botón no cambia al abrir (lo dice aria-expanded)');
  await p.keyboard.press('Tab');
  ok(await p.evaluate(() => document.getElementById('w-s-adv-panel').contains(document.activeElement)), `Abierta: Tab desde el botón entra en el cuerpo (${await act(p)})`);
  await p.focus('#w-s-adv-toggle');
  tr = p.evaluate(() => __track('#w-s-adv-toggle', 700)); await p.waitForTimeout(40);
  await p.keyboard.press('Space');
  t = await tr; await settled(p, 'w-s-adv');
  ok(t.dt === 0 && t.ds === 0 && (await p.evaluate(() => __st('w-s-adv').exp)) === 'false' && await act(p) === 'w-s-adv-toggle', `Espacio pliega, Δ ${t.dt}, Δscroll ${t.ds}, foco en el botón`);
  // Plegar por programa (v-model:open) con el foco dentro: el foco va al botón, nunca a <body>
  await p.click('#w-s-adv-toggle'); await settled(p, 'w-s-adv');
  await p.focus('#w-zona');
  await p.evaluate(() => { __models.w.advOpen = false; });
  await settled(p, 'w-s-adv');
  ok(await act(p) === 'w-s-adv-toggle' && await p.evaluate(() => __st('w-s-adv').inert), `Plegar por programa con el foco dentro: foco al botón antes de aplicar inert (${await act(p)})`);
  // Encabezado cerca del borde superior de la vista (anclaje de desplazamiento del navegador)
  await p.click('#w-s-pref-toggle'); await settled(p, 'w-s-pref');
  await p.evaluate(() => { const r = document.getElementById('w-s-pref-toggle').getBoundingClientRect(); scrollBy(0, r.top - 60); });
  tr = p.evaluate(() => __track('#w-s-pref-toggle', 700)); await p.waitForTimeout(40);
  await p.click('#w-s-pref-toggle');
  t = await tr; await settled(p, 'w-s-pref');
  ok(t.dt === 0 && t.ds === 0, `Plegar con el encabezado arriba de la vista: Δ ${t.dt}, Δscroll ${t.ds}`);
  // Mitad de la transición (formulario estrecho)
  await p.evaluate(() => document.getElementById('n-s-adv').scrollIntoView({ block: 'center' }));
  await p.click('#n-s-adv-toggle');
  const half = await p.evaluate(() => __half('n-s-adv-panel'));
  s = await p.evaluate(() => __st('n-s-adv'));
  await p.evaluate(() => __finish('n-s-adv-panel')); await settled(p, 'n-s-adv');
  const full = await p.evaluate(() => __st('n-s-adv'));
  ok(half && s.h > 0 && s.h < full.h && s.op > 0 && s.op < 1 && s.ovf === 'hidden' && !s.inert, `A la mitad: altura y opacidad intermedias, recortado, sin inert (h ${s.h.toFixed(1)}/${full.h.toFixed(1)}, op ${s.op.toFixed(2)}, ${half})`);
  await p.click('#n-s-adv-toggle'); await settled(p, 'n-s-adv');

  // ================= 3. Envío con un error dentro de una plegada (con resumen) =================
  await p.fill('#w-nombre', 'Ana');
  await p.click('#w-save');
  await p.waitForFunction(() => __results.w.invalids === 1);
  await p.waitForTimeout(100);
  const inv = await p.evaluate(() => __results.w.lastInvalid);
  ok(inv.includes('avisos') && !inv.includes('rfc') && !inv.includes('razon'), `Envío: el campo de la plegada CUENTA; los de la no agregada no (${inv})`);
  ok(await p.evaluate(() => __st('w-s-pref').exp) === 'true' && await act(p) === 'w-summary', `Envío con errores: la plegada con el error se abre y el foco va al resumen (${await act(p)})`);
  ok(await p.evaluate(() => __st('w-s-adv').exp) === 'false', 'Envío: la plegada SIN errores sigue plegada');
  // Volver a plegar: estado de errores en el encabezado
  await p.click('#w-s-pref-toggle'); await settled(p, 'w-s-pref');
  const dg = await p.evaluate(() => { const d = document.getElementById('w-s-pref-digest'); const t = document.getElementById('w-s-pref-toggle');
    return { txt: d && d.textContent.replace(/\s+/g, ' ').trim(), icon: !!d?.querySelector('.x-section__status svg[aria-hidden="true"], .x-section__status [aria-hidden="true"] svg'), desc: t.getAttribute('aria-describedby') }; });
  ok(dg.txt && dg.txt.startsWith('1 error') && dg.icon && dg.desc === 'w-s-pref-digest', `Plegada con error: «1 error» con icono en el encabezado, en la descripción del botón (${JSON.stringify(dg)})`);
  // Enlace del resumen a un campo de la plegada: se abre en un cuadro y enfoca
  await p.click('#w-summary a[href="#w-avisos"]');
  await p.waitForTimeout(120);
  const nav = await p.evaluate(() => { const b = document.querySelector('#w-s-pref-panel > .x-section__body'); const lab = document.querySelector('label[for="w-avisos"]');
    return { a: document.activeElement?.id, exp: document.getElementById('w-s-pref-toggle').getAttribute('aria-expanded'), st: b.scrollTop, pst: document.getElementById('w-s-pref-panel').scrollTop, lab: __inView(lab) }; });
  ok(nav.a === 'w-avisos' && nav.exp === 'true' && nav.st === 0 && nav.pst === 0 && nav.lab, `Resumen → campo plegado: abre, enfoca el control, etiqueta a la vista, cuerpo sin desplazamiento interno (${JSON.stringify(nav)})`);
  // Alternativa descartada: abrir animando y enfocar en el mismo ciclo
  await p.click('#w-s-pref-toggle'); await settled(p, 'w-s-pref');
  inAlt = true;
  await p.evaluate(() => { window.__navAnimated = true; });
  await p.click('#w-summary a[href="#w-avisos"]');
  await p.waitForTimeout(40);
  const bad = await p.evaluate(() => ({ a: document.activeElement?.id || document.activeElement?.tagName, st: document.querySelector('#w-s-pref-panel > .x-section__body').scrollTop }));
  await settled(p, 'w-s-pref');
  notes.push(`Alternativa descartada (abrir animando al navegar): foco en ${bad.a}, scrollTop interno del cuerpo ${bad.st}`);
  await p.evaluate(() => { window.__navAnimated = false; });
  await p.waitForTimeout(300); inAlt = false;

  // ================= 4. Sin resumen: foco al primer inválido dentro de la plegada =================
  await p.fill('#n-nombre', 'Ana');
  await p.click('#n-save');
  await p.waitForFunction(() => __results.n.invalids === 1); await p.waitForTimeout(100);
  ok(await act(p) === 'n-avisos' && await p.evaluate(() => __st('n-s-pref').exp) === 'true', `Sin resumen: la plegada se abre y el foco va a su primer inválido (${await act(p)})`);

  // ================= 5. showErrors() con un error del servidor en otra plegada =================
  await p.fill('#m-nombre', 'Ana');
  await p.click('#m-server'); await p.waitForTimeout(200);
  ok(await act(p) === 'm-avisos' && await p.evaluate(() => __st('m-s-pref').exp === 'true' && __st('m-s-adv').exp === 'true'),
    `showErrors(): abre las plegadas con errores (incluida la del error del servidor) y enfoca el primero (${await act(p)})`);

  // ================= 6. addable =================
  await p.evaluate(() => { __models.w.avisos = 'ana@correo.mx'; });
  await p.click('#w-save'); await p.waitForFunction(() => __results.w.submits === 1);
  keys = await p.evaluate(() => __results.w.lastData);
  ok(!['rfc', 'razon', 'cp'].some((k) => keys.includes(k)), `Sin agregar: envía aunque la aplicación calcule rfc y razón social sin condiciones (${keys})`);
  await p.evaluate(() => document.getElementById('w-s-fis').scrollIntoView({ block: 'center' }));
  const addTop = await p.evaluate(() => document.getElementById('w-s-fis-add').getBoundingClientRect().top);
  tr = p.evaluate(() => __track('#w-s-fis', 600)); await p.waitForTimeout(40);
  await p.click('#w-s-fis-add');
  t = await tr; await settled(p, 'w-s-fis');
  const titleTop = await p.evaluate(() => document.getElementById('w-s-fis-title').getBoundingClientRect().top);
  ok(await act(p) === 'w-s-fis-title' && t.ds === 0 && t.dt === 0, `Agregar: foco al título (tabindex=-1), la sección no se mueve, Δscroll ${t.ds}`);
  notes.push(`Agregar: el título queda ${(titleTop - addTop).toFixed(1)}px respecto del borde superior del botón «Agregar…» (mismo sitio, distinta caja)`);
  keys = await p.evaluate(() => __fd('w-form'));
  ok(['rfc', 'razon', 'cp'].every((k) => keys.includes(k)), `Agregada: sus campos entran en FormData (${keys})`);
  await p.keyboard.press('Tab');
  if (engine !== 'webkit') {
    ok(await act(p) === 'w-s-fis-remove', `Tab desde el título: «Quitar…» (acción del encabezado) (${await act(p)})`);
    await p.keyboard.press('Tab');
  }
  ok(await act(p) === 'w-rfc', `Tab: primer campo de la sección (${await act(p)})`);
  await p.click('#w-save'); await p.waitForFunction(() => __results.w.invalids === 2); await p.waitForTimeout(100);
  const inv2 = await p.evaluate(() => __results.w.lastInvalid);
  ok(inv2.includes('rfc') && inv2.includes('razon'), `Agregada: sus errores bloquean (${inv2})`);
  await p.fill('#w-rfc', 'GOD');
  await p.focus('#w-s-fis-remove'); await p.keyboard.press('Enter');
  await p.waitForSelector('#w-s-fis-confirm[open]'); await p.waitForTimeout(300);
  const dlg = await p.evaluate(() => ({ role: document.getElementById('w-s-fis-confirm').getAttribute('role'), a: document.activeElement?.id }));
  ok(dlg.role === 'alertdialog' && dlg.a === 'w-s-fis-cancel', `Quitar con datos escritos: alertdialog con el foco en «Cancelar» (${JSON.stringify(dlg)})`);
  await p.keyboard.press('Enter');
  await p.waitForFunction(() => !document.getElementById('w-s-fis-confirm')?.open); await p.waitForTimeout(400);
  ok(await p.evaluate(() => __sections.get('w-s-fis').added.value) && await act(p) === 'w-s-fis-remove', `Cancelar: sigue agregada y el foco vuelve a «Quitar…» (${await act(p)})`);
  await p.click('#w-s-fis-remove');
  await p.waitForSelector('#w-s-fis-confirm[open]'); await p.waitForTimeout(300);
  await p.click('#w-s-fis-confirm-btn');
  await p.waitForFunction(() => !__sections.get('w-s-fis').added.value, null, { timeout: 4000 }); await settled(p, 'w-s-fis'); await p.waitForTimeout(100);
  const rem = await p.evaluate(() => ({ a: document.activeElement?.id, links: [...document.querySelectorAll('#w-summary a')].map((x) => x.getAttribute('href')), sumHidden: document.getElementById('w-summary').hidden,
    fd: __fd('w-form'), model: __models.w.rfc }));
  ok(rem.a === 'w-s-fis-add', `Quitar confirmado: el foco vuelve a «Agregar…» (${rem.a})`);
  ok(!rem.links.some((h) => /rfc|razon/.test(h)), `Quitar: sus errores salen del resumen en silencio (${rem.links}; oculto ${rem.sumHidden})`);
  ok(!['rfc', 'razon', 'cp'].some((k) => rem.fd.includes(k)) && rem.model === '', `Quitar: fuera de FormData y la aplicación vació su modelo (${rem.fd})`);
  await p.click('#w-s-fis-add'); await settled(p, 'w-s-fis');
  ok(await p.evaluate(() => document.getElementById('w-rfc').value) === '' && !(await p.evaluate(() => document.getElementById('w-rfc').getAttribute('aria-invalid') === 'true')),
    'Volver a agregar: empieza vacía y sin errores revelados');
  await p.click('#w-s-fis-remove'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => !__sections.get('w-s-fis').added.value && !document.getElementById('w-s-fis-confirm')?.open) && await act(p) === 'w-s-fis-add',
    'Quitar sin haber escrito: sin confirmación, foco a «Agregar…»');

  // ================= 7. addable: registro inactivo frente a desmontar =================
  await p.click('#st-inactive-save'); await p.click('#st-unmount-save'); await p.waitForTimeout(200);
  const st = await p.evaluate(() => ({ i: { ...__results['st-inactive'] }, u: { ...__results['st-unmount'] } }));
  ok(st.i.submits === 1 && st.i.invalids === 0, `Registro inactivo: sin agregar, envía (${JSON.stringify(st.i)})`);
  ok(st.u.invalids === 1 && st.u.lastInvalid?.[0]?.name === 'rfc' && st.u.lastInvalid[0].id === null, `Desmontar: «rfc» se vuelve error general sin enlace y bloquea (${JSON.stringify(st.u.lastInvalid)})`);

  // ================= 8. headerPlacement =================
  const side = await p.evaluate(() => { const sec = document.getElementById('a-s-pac'); const hd = sec.querySelector('.g-form-section__header'); const bd = sec.querySelector('.g-form-section__body');
    const ttl = sec.querySelector('.g-form-section__title'); const lab = bd.querySelector('label');
    return { side: __sections.get('a-s-pac').side.value, w: sec.getBoundingClientRect().width, hdR: hd.getBoundingClientRect().right, bdL: bd.getBoundingClientRect().left,
      dTop: ttl.getBoundingClientRect().top - lab.getBoundingClientRect().top, lines: bd.querySelector('.g-form-row')?.dataset.lines, mSide: __sections.get('m-s-pac').side.value,
      mw: document.getElementById('m-s-pac').getBoundingClientRect().width }; });
  ok(side.side && side.hdR < side.bdL && Math.abs(side.dTop) <= 1 && side.lines, `auto ≥ space×200 (${side.w}px): encabezado al lado, título alineado con la primera etiqueta (Δ ${side.dTop.toFixed(2)}px), la fila del cuerpo mide su ancho (${side.lines} línea/s)`);
  ok(!side.mSide, `auto < space×200 (${side.mw}px): encabezado arriba`);
  await p.evaluate(() => { document.getElementById('frame-a').style.setProperty('--fw', '700px'); });
  await p.waitForTimeout(200);
  const s700 = await p.evaluate(() => __sections.get('a-s-pac').side.value);
  await p.evaluate(() => { document.getElementById('frame-a').style.setProperty('--fw', '1100px'); });
  await p.waitForTimeout(200);
  ok(!s700 && await p.evaluate(() => __sections.get('a-s-pac').side.value), 'auto: cambia por el ancho propio (ResizeObserver) al estrechar y al ensanchar');
  await p.evaluate(() => document.getElementById('a-s-adv').scrollIntoView({ block: 'center' }));
  tr = p.evaluate(() => __track('#a-s-adv-toggle', 700)); await p.waitForTimeout(40);
  await p.click('#a-s-adv-toggle');
  t = await tr; await settled(p, 'a-s-adv');
  const sideAdv = await p.evaluate(() => { const pn = document.getElementById('a-s-adv-panel'); const hd = document.querySelector('#a-s-adv > .g-form-section__header'); return pn.getBoundingClientRect().left > hd.getBoundingClientRect().right; });
  ok(t.dt === 0 && t.dl === 0 && t.ds === 0 && sideAdv, `Al lado: el botón de plegar va en la columna del encabezado y no se mueve al abrir (Δ ${t.dt}/${t.dl})`);
  const addSide = await p.evaluate(() => { const a = document.querySelector('#a-s-fis > .x-section__add'); const sec = document.getElementById('a-s-fis'); return Math.abs(a.getBoundingClientRect().width - sec.getBoundingClientRect().width) < 1; });
  ok(addSide, 'Al lado, sin agregar: la fila «Agregar…» ocupa el ancho de la sección');

  // ================= 9. divider =================
  for (const [prefix, gapVar] of [['dv-default', 1], ['dv-comfortable', 0.875], ['dv-compact', 0.75], ['dv-out', 1]]) {
    const m = await p.evaluate(([px, f]) => {
      const space = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1'));
      const gap = space * 10 * f;
      const out = [];
      for (const i of [2, 3]) {
        const prev = document.getElementById(`${px}-${i - 1}`).getBoundingClientRect(); const sec = document.getElementById(`${px}-${i}`);
        const hd = sec.querySelector('.g-form-section__header').getBoundingClientRect(); const hr = sec.querySelector('.g-divider').getBoundingClientRect();
        out.push({ dist: hd.top - prev.bottom, mid: (hr.top + hr.bottom) / 2 - (prev.bottom + hd.top) / 2, gap });
      }
      const first = document.getElementById(`${px}-1`).querySelector('.g-divider');
      const hr2 = document.getElementById(`${px}-2`).querySelector('.g-divider');
      return { out, firstHidden: getComputedStyle(first).display === 'none', tag: hr2.tagName, aria: hr2.getAttribute('aria-hidden'), role: hr2.getAttribute('role') };
    }, [prefix, gapVar]);
    ok(m.out.every((o) => Math.abs(o.dist - o.gap) <= 1 && Math.abs(o.mid) <= 1) && m.firstHidden && m.tag === 'HR' && m.aria === 'true' && !m.role,
      `divider ${prefix}: distancia = gap × densidad (${m.out.map((o) => o.dist.toFixed(1) + '/' + o.gap).join(', ')}), línea centrada (${m.out.map((o) => o.mid.toFixed(2)).join(', ')}), sin línea en la primera, GDivider <hr aria-hidden> sin rol`);
  }

  // ================= 10. readonly y disabled =================
  const ro = await p.evaluate(() => ({ add: !!document.getElementById('ro-s-fis-add'), rm: !!document.getElementById('ro-s-fis-remove'), fisVisible: !document.getElementById('ro-s-fis').hidden,
    diHidden: document.getElementById('di-s-fis').hidden, diAdd: !!document.getElementById('di-s-fis-add') }));
  await p.click('#ro-s-pref-toggle'); await p.click('#di-s-pref-toggle'); await p.waitForTimeout(100);
  const roT = await p.evaluate(() => [__st('ro-s-pref').exp, __st('di-s-pref').exp]);
  ok(!ro.add && !ro.rm && ro.fisVisible && ro.diHidden && !ro.diAdd && roT.every((x) => x === 'true'),
    `readonly/disabled: sin «Agregar…» ni «Quitar…» (agregada visible; sin agregar oculta); plegar sigue funcionando (${JSON.stringify(ro)} ${roT})`);

  // Nota para coco: título junto a una acción larga a 320 (Fase 1 real y collapsible)
  const nr = await p.evaluate(() => ['nr-s', 'n-s-pref'].map((id) => { const t = document.querySelector(`#${id} .g-form-section__title`); const r = t.getBoundingClientRect();
    return `${id}: título ${r.width.toFixed(0)}px de ancho, ${Math.round(r.height / parseFloat(getComputedStyle(t).lineHeight))} líneas`; }).join('; '));
  notes.push(`Encabezado a 320 con acción «Usar el correo del paciente»: ${nr}`);

  // ================= 11. RTL =================
  await p.evaluate(() => document.getElementById('r-s-adv').scrollIntoView({ block: 'center' }));
  const chev0 = await p.evaluate(() => getComputedStyle(document.querySelector('#r-s-adv .x-section__chevron svg')).scale);
  tr = p.evaluate(() => __track('#r-s-adv-toggle', 700)); await p.waitForTimeout(40);
  await p.click('#r-s-adv-toggle');
  t = await tr; await settled(p, 'r-s-adv');
  const rtl = await p.evaluate(() => { const svg = document.querySelector('#r-s-adv .x-section__chevron svg'); const cs = getComputedStyle(svg);
    const tg = document.getElementById('r-s-adv-toggle').getBoundingClientRect(); const ch = document.querySelector('#r-s-adv .x-section__chevron').getBoundingClientRect();
    return { rot: cs.rotate, chevRight: ch.left > tg.left + tg.width / 2 }; });
  ok(t.dt === 0 && t.dl === 0 && /-1/.test(chev0) && rtl.rot === '-90deg' && rtl.chevRight, `RTL: chevron al inicio (derecha) y espejado; abierta apunta abajo; Δ ${t.dt}/${t.dl} (${chev0}, ${JSON.stringify(rtl)})`);
  await p.close();

  // ================= 12. 320: sin desborde =================
  p = await open(320, 800);
  await p.click('#n-s-pref-toggle'); await p.click('#n-s-adv-toggle'); await p.click('#n-s-fis-add'); await p.waitForTimeout(600);
  const ov = await p.evaluate(() => ({ page: document.documentElement.scrollWidth - innerWidth, frames: [...document.querySelectorAll('.frame')].map((f) => f.scrollWidth - f.clientWidth).filter((d) => d > 0) }));
  ok(ov.page <= 0 && ov.frames.length === 0, `320px: sin desborde de página ni de marcos con las secciones abiertas y agregadas (${JSON.stringify(ov)})`);
  await p.close();

  // ================= 13. Movimiento reducido =================
  p = await open(1280, 900, { reducedMotion: 'reduce' });
  await p.evaluate(() => document.getElementById('w-s-adv').scrollIntoView({ block: 'center' }));
  await p.click('#w-s-adv-toggle');
  const rm = await p.evaluate(() => new Promise((res) => requestAnimationFrame(() => { const pn = document.getElementById('w-s-adv-panel');
    res({ props: pn.getAnimations().map((a) => a.transitionProperty), h: pn.getBoundingClientRect().height }); })));
  await settled(p, 'w-s-adv');
  const rmFull = await p.evaluate(() => __st('w-s-adv').h);
  ok(!rm.props.includes('grid-template-rows') && !rm.props.includes('margin-block-start') && rm.props.includes('opacity') && Math.abs(rm.h - rmFull) < 0.5,
    `Movimiento reducido: altura en un cuadro (${rm.h.toFixed(1)}/${rmFull.toFixed(1)}), solo fundido (${rm.props})`);
  await p.click('#w-s-adv-toggle');
  await p.evaluate(() => __half('w-s-adv-panel'));
  const rmc = await p.evaluate(() => __st('w-s-adv'));
  ok(rmc.vis === 'visible' && rmc.op > 0 && rmc.op < 1 && rmc.inert, `Movimiento reducido al plegar: visible mientras se funde, ya inert (${JSON.stringify(rmc)})`);
  await p.close();

  // ================= 14. forced-colors (solo Chromium emula) =================
  if (engine === 'chromium') {
    p = await open(1280, 900, { forcedColors: 'active' });
    await p.focus('#w-s-adv-toggle'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab');
    const fc = await p.evaluate(() => { const svg = document.querySelector('#w-s-adv .x-section__chevron svg'); const t = document.getElementById('w-s-adv-toggle');
      return { fc: matchMedia('(forced-colors: active)').matches, stroke: getComputedStyle(svg).stroke, color: getComputedStyle(svg).color, outline: getComputedStyle(t).outlineStyle,
        hr: getComputedStyle(document.querySelector('#w-s-adv .g-divider')).borderBlockStartStyle }; });
    ok(fc.fc && !/rgba\(0, 0, 0, 0\)|transparent/.test(fc.color) && fc.outline !== 'none' && fc.hr !== 'none', `forced-colors: chevron en currentColor, anillo de foco y línea visibles (${JSON.stringify(fc)})`);
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
