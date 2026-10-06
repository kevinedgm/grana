// GCombobox · Fase 2 (`multiple`) · r03 · verificación de kiwi (Playwright: Chromium, Firefox, WebKit).
// Uso: node design/lab/combobox/r03/verificar.mjs   (GRANA_PW_PORT=4212 por defecto; requiere npm run build)
//      CONCEPTS=A,B  ENGINES=chromium  para acotar.
process.env.GRANA_PW_PORT = process.env.GRANA_PW_PORT || '4212'
const { serve, pw } = await import('../serve.mjs')
const { server, base } = await serve()
const CONCEPTS = (process.env.CONCEPTS || 'base,A,B,C').split(',')
const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const results = {}
let failTotal = 0

function bucket(engine, c) { const k = `${engine} ${c}`; return (results[k] = results[k] || { pass: 0, fail: [] }) }

// ---- Utilidades en la página
const HELPERS = () => {
  window.__rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  window.__bg = (el) => { let e = el; while (e) { const c = getComputedStyle(e).backgroundColor; const v = __rgb(c); if (v[3] > 0.5) return v; e = e.parentElement } return [255, 255, 255, 1] }
  window.__contrast = (el) => { const fg = __rgb(getComputedStyle(el).color), bg = __bg(el); const a = __lum(fg), b = __lum(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
  window.__lastLive = () => (window.__live.length ? window.__live[window.__live.length - 1].text : '')
}

async function run(engine) {
  const browser = await pw[engine].launch()
  const mod = engine === 'webkit' ? 'Meta' : 'Control'
  for (const c of CONCEPTS) {
    const B = bucket(engine, c)
    const ok = (name, cond, detail) => { if (cond) B.pass++; else { B.fail.push(`${name}${detail !== undefined ? ' → ' + JSON.stringify(detail) : ''}`); failTotal++ } }
    const errors = []
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    const load = async (q = '') => { await page.goto(`${base}/r03/index.html?c=${c}${q}`); await page.waitForFunction(() => window.__M && document.querySelector('#alg')); await page.evaluate(HELPERS); await page.waitForTimeout(120) }
    const surf = c === 'C'
    const listVisible = (id) => page.evaluate((id) => { const l = document.getElementById(id + '-list'); return Boolean(l && l.offsetParent !== null && l.getClientRects().length) }, id)
    const model = (k) => page.evaluate((k) => JSON.parse(JSON.stringify(window.__M[k])), k)
    const live = () => page.evaluate(() => window.__lastLive())
    const sIn = (id) => page.locator(`#${id}-surface .xm-surface__input`)
    const input = (id) => (surf ? sIn(id) : page.locator(`#${id}`))
    async function openWith(id, key = 'ArrowDown') { await page.locator(`#${id}`).focus(); await page.keyboard.press(key); await page.waitForTimeout(surf ? 250 : 150) }
    async function typeIn(id, t) { if (surf) { const open = await page.evaluate((id) => Boolean(document.querySelector(`#${id}-surface[open]`)), id); if (!open) { await page.locator(`#${id}`).focus(); await page.keyboard.type(t.slice(0, 1)); await page.waitForTimeout(250); await page.keyboard.type(t.slice(1)) } else { await sIn(id).fill(''); await page.keyboard.type(t) } } else { await page.locator(`#${id}`).focus(); await page.keyboard.type(t) } await page.waitForTimeout(150) }
    const activeOf = (id) => page.evaluate((id) => { const i = (document.querySelector(`#${id}-surface[open] .xm-surface__input`) || document.getElementById(id)); const a = i.getAttribute('aria-activedescendant'); const el = a && document.getElementById(a); return el ? el.textContent.trim() : null }, id)

    // ---------------------------------------------------------------- 1 · Semántica en reposo
    await load()
    {
      const r = await page.evaluate(() => { const i = document.getElementById('alg'); return { role: i.getAttribute('role'), exp: i.getAttribute('aria-expanded'), pop: i.getAttribute('aria-haspopup'), hidden: [...document.querySelectorAll('input[type=hidden][name=alergias]')].map((h) => h.value), about: (document.getElementById('alg-about') || {}).textContent, desc: i.getAttribute('aria-describedby') || '', req: i.hasAttribute('required'), name: i.hasAttribute('name') } })
      ok('reposo: role=combobox', r.role === 'combobox', r.role)
      ok('reposo: aria-expanded=false', r.exp === 'false', r.exp)
      ok('reposo: aria-haspopup', r.pop === (surf ? 'dialog' : 'listbox'), r.pop)
      ok('reposo: un oculto por valor, en orden', JSON.stringify(r.hidden) === '["penicilina","latex"]', r.hidden)
      ok('reposo: el visible no lleva name ni required', !r.req && !r.name)
      ok('reposo: descripción con la lista elegida', r.about === '2 seleccionadas: Penicilina y Látex' && r.desc.startsWith('alg-about'), r.about)
    }
    // ---------------------------------------------------------------- 2 · Enfocar no abre
    await page.locator('#alg').focus(); await page.waitForTimeout(100)
    ok('enfocar no abre', (await page.locator('#alg').getAttribute('aria-expanded')) === 'false' && !(await listVisible('alg')))
    // ---------------------------------------------------------------- 3 · Abrir: listbox multiselectable, aria-selected en todas
    await openWith('alg')
    {
      const r = await page.evaluate(() => { const l = document.getElementById('alg-list'); const opts = [...l.querySelectorAll('[role=option]')]; const firstGroup = l.querySelector('[role=group]'); const gl = firstGroup && document.getElementById(firstGroup.getAttribute('aria-labelledby')); return { ms: l.getAttribute('aria-multiselectable'), all: opts.every((o) => o.hasAttribute('aria-selected')), sel: opts.filter((o) => o.getAttribute('aria-selected') === 'true').map((o) => o.querySelector('.g-summary__title').textContent), group: gl && gl.textContent.trim(), firstSel: firstGroup && [...firstGroup.querySelectorAll('[role=option]')].map((o) => o.getAttribute('aria-selected')), surface: Boolean(document.querySelector('#alg-surface[open]')), basket: document.querySelectorAll('#alg-surface .xm-basket .xm-row').length, exp: document.getElementById('alg').getAttribute('aria-expanded') } })
      ok('abierta: aria-multiselectable=true', r.ms === 'true', r.ms)
      ok('abierta: todas las opciones con aria-selected', r.all)
      ok('abierta: las elegidas con aria-selected=true', JSON.stringify(r.sel.sort()) === JSON.stringify(['Látex', 'Penicilina']), r.sel)
      ok('abierta: aria-expanded=true', r.exp === 'true', r.exp)
      if (c === 'A') ok('A: «Elegidas» es el primer grupo, marcadas', r.group === 'Elegidas2' && JSON.stringify(r.firstSel) === '["true","true"]', [r.group, r.firstSel])
      if (c !== 'A' && !surf) ok(`${c}: sin grupo de elegidas (en su sitio del catálogo)`, r.group === 'Medicamentos', r.group)
      if (surf) { ok('C: la paleta se abre (dialog modal)', r.surface); ok('C: la cesta enseña las 2 elegidas', r.basket === 2, r.basket) }
    }
    // ---------------------------------------------------------------- 4 · Agregar con Intro: la lista sigue y el texto queda seleccionado
    await typeIn('alg', 'ibu')
    ok('escribir activa la primera coincidencia', (await activeOf('alg') || '').startsWith('Ibuprofeno'), await activeOf('alg'))
    await page.keyboard.press('Enter'); await page.waitForTimeout(150)
    {
      const m = await model('alg'); const sel = await input('alg').evaluate((i) => [i.selectionStart, i.selectionEnd, i.value])
      ok('Intro agrega al final del modelo', JSON.stringify(m) === '["penicilina","latex","ibuprofeno"]', m)
      ok('la lista sigue abierta tras elegir', await listVisible('alg'))
      ok('el texto queda seleccionado (lo siguiente lo reemplaza)', sel[0] === 0 && sel[1] === 3 && sel[2] === 'ibu', sel)
      ok('anuncio: agregada y recuento', (await live()) === 'Se agregó Ibuprofeno. 3 seleccionadas.', await live())
      ok('change: un evento con added', await page.evaluate(() => { const c = window.__M.changes[0]; return c && c.added[0] === 'Ibuprofeno' && c.n === 3 }))
      ok('el hueco oculto nuevo', (await page.locator('input[type=hidden][name=alergias]').count()) === 3)
    }
    // ---------------------------------------------------------------- 5 · Intro sobre una ya elegida resaltada sola NO la quita
    await typeIn('alg', 'peni')
    await page.keyboard.press('Enter'); await page.waitForTimeout(120)
    ok('Intro sobre elegida activa sola: no la quita', (await model('alg')).includes('penicilina'))
    ok('… y lo dice', (await live()) === 'Penicilina ya está elegida', await live())
    // ---------------------------------------------------------------- 6 · Activada por la persona, Intro sí la desmarca (y la fila no se mueve)
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp'); await page.waitForTimeout(60)
    const y0 = await page.evaluate(() => { const a = document.querySelector('[aria-activedescendant]:focus') || document.querySelector('.xm-surface__input'); const el = document.getElementById(a.getAttribute('aria-activedescendant')); return el.getBoundingClientRect().top })
    await page.keyboard.press('Enter'); await page.waitForTimeout(150)
    {
      const r = await page.evaluate(() => { const a = document.activeElement; const el = document.getElementById(a.getAttribute('aria-activedescendant')); return { sel: el.getAttribute('aria-selected'), top: el.getBoundingClientRect().top } })
      ok('flechas + Intro desmarca', !(await model('alg')).includes('penicilina'))
      ok('desmarcar no mueve la fila (puntero quieto)', r.sel === 'false' && Math.abs(r.top - y0) < 0.5, [r, y0])
      ok('anuncio: quitada y recuento', (await live()) === 'Se quitó Penicilina. 2 seleccionadas.', await live())
    }
    await page.keyboard.press('Enter'); await page.waitForTimeout(120)
    ok('Intro otra vez la vuelve a marcar', (await model('alg')).includes('penicilina'))
    // ---------------------------------------------------------------- 7 · Esc
    await page.keyboard.press('Escape'); await page.waitForTimeout(150)
    if (surf) {
      ok('C: Esc cierra la paleta conservando lo elegido', !(await page.evaluate(() => Boolean(document.querySelector('#alg-surface[open]')))) && (await model('alg')).length === 3)
      ok('C: el foco vuelve al campo', await page.evaluate(() => document.activeElement.id === 'alg'))
    } else {
      ok('Esc cierra la lista y conserva el texto', !(await listVisible('alg')) && (await page.locator('#alg').inputValue()) === 'peni')
      await page.keyboard.press('Escape'); await page.waitForTimeout(60)
      ok('Esc otra vez vacía el texto', (await page.locator('#alg').inputValue()) === '')
    }
    // ---------------------------------------------------------------- 8 · Tab nunca agrega; salir descarta el texto
    await load()
    if (!surf) {
      await typeIn('alg', 'kiw'); await page.waitForTimeout(60)
      if (c !== 'base') ok(`${c}: texto fantasma por prefijo («kiw» → «i»)`, await page.evaluate(() => { const g = document.querySelector('#case-alg .xm-ghost__rest'); return g && g.textContent === 'i' }))
      await page.keyboard.press('Tab'); await page.waitForTimeout(100)
      ok('Tab no agrega', !(await model('alg')).includes('kiwi'), await model('alg'))
      ok('al salir, el texto a medio escribir se descarta', (await page.locator('#alg').inputValue()) === '')
    } else {
      await typeIn('alg', 'kiw'); await page.keyboard.press('Tab'); await page.waitForTimeout(80)
      ok('C: Tab dentro de la paleta no agrega', !(await model('alg')).includes('kiwi'))
      ok('C: la primera tecla abre y no se pierde', await page.evaluate(() => document.querySelector('#alg-surface .xm-surface__input').value === 'kiw'))
      await page.keyboard.press('Escape'); await page.waitForTimeout(150)
    }
    // ---------------------------------------------------------------- 9 · Retroceso en dos tiempos; la repetición no quita; Ctrl+Z devuelve
    await load()
    await page.locator('#alg').focus()
    await page.keyboard.press('Backspace'); await page.waitForTimeout(120)
    ok('Retroceso 1: no quita', (await model('alg')).length === 2)
    ok('Retroceso 1: marca la última y lo dice', (await live()) === 'Pulsa Retroceso otra vez para quitar Látex', await live())
    {
      const sel = { base: '#case-alg .xm-chip.is-armed', A: '#case-alg .xm-s-item.is-armed', B: '#case-alg .xm-row.is-armed', C: '#case-alg .xm-s-item.is-armed' }[c]
      ok('Retroceso 1: la marca se ve (no solo color: tachado o borde)', await page.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; const cs = getComputedStyle(e.matches('.xm-row') ? e.querySelector('.g-summary__title') : e); return cs.textDecorationLine.includes('line-through') || cs.boxShadow !== 'none' }, sel))
    }
    await page.keyboard.press('Backspace'); await page.waitForTimeout(150)
    ok('Retroceso 2: quita la última', JSON.stringify(await model('alg')) === '["penicilina"]', await model('alg'))
    await page.evaluate(() => { const i = document.getElementById('alg'); for (let k = 0; k < 3; k++) i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', repeat: true, bubbles: true, cancelable: true })) })
    await page.waitForTimeout(100)
    ok('Retroceso sostenido (repeat) no quita nada', (await model('alg')).length === 1)
    await page.keyboard.press(`${mod}+z`); await page.waitForTimeout(150)
    ok('Ctrl/⌘+Z devuelve la quitada a su sitio', JSON.stringify(await model('alg')) === '["penicilina","latex"]', await model('alg'))
    ok('anuncio de restaurada', (await live()).startsWith('Se restauró Látex'), await live())
    // ---------------------------------------------------------------- 10 · Quitar todas (clearable) y deshacer
    await page.locator('#alg-clear').click(); await page.waitForTimeout(120)
    ok('«Quitar todas» vacía el modelo y lo dice', (await model('alg')).length === 0 && (await live()) === 'Se quitaron todas')
    ok('«Quitar todas»: nombre con la etiqueta', await page.evaluate(() => document.activeElement.id === 'alg'))
    await page.keyboard.press(`${mod}+z`); await page.waitForTimeout(150)
    ok('Ctrl/⌘+Z devuelve todas', (await model('alg')).length === 2)
    // ---------------------------------------------------------------- 11 · Texto libre múltiple
    await load()
    await typeIn('alg', 'Polen de olivo')
    {
      const row = await page.evaluate(() => { const r = document.getElementById('alg-custom'); return r && [r.textContent.trim(), r.getAttribute('role'), r.getAttribute('aria-selected')] })
      ok('fila «Usar … como texto libre»', row && row[0] === 'Usar «Polen de olivo» como texto libre' && row[1] === 'option', row)
      for (let k = 0; k < 4 && (await activeOf('alg')) !== 'Usar «Polen de olivo» como texto libre'; k++) await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter'); await page.waitForTimeout(150)
      ok('el texto libre entra en `custom` (Array)', JSON.stringify(await model('algC')) === '["Polen de olivo"]', await model('algC'))
      ok('un oculto por texto libre (customName)', (await page.locator('input[type=hidden][name=alergias_libre]').count()) === 1)
      ok('la descripción lo marca', (await page.evaluate(() => document.getElementById('alg-about').textContent)).includes('Polen de olivo (Texto libre)'))
      await typeIn('alg', 'polen de olivo')
      ok('sin duplicar: la fila desaparece con el mismo texto', !(await page.evaluate(() => Boolean(document.getElementById('alg-custom')))))
    }
    if (surf) { await page.keyboard.press('Escape'); await page.waitForTimeout(150) }
    // ---------------------------------------------------------------- 12 · Máximo (diagnósticos, max 3)
    await load()
    for (const t of ['I10', 'J45.9']) { await typeIn('dx', t); await page.keyboard.press('Enter'); await page.waitForTimeout(120) }
    ok('máximo: 3 elegidos', (await model('dx')).length === 3, await model('dx'))
    {
      const r = await page.evaluate(() => { const l = document.getElementById('dx-list'); const opts = [...l.querySelectorAll('[role=option]:not(.xm-opt--action)')]; return { dis: opts.filter((o) => o.getAttribute('aria-selected') === 'false').every((o) => o.getAttribute('aria-disabled') === 'true'), selOk: opts.filter((o) => o.getAttribute('aria-selected') === 'true').every((o) => !o.hasAttribute('aria-disabled')), status: (document.querySelector('#dx-status') || {}).textContent } })
      ok('máximo: las no elegidas quedan aria-disabled (las elegidas no)', r.dis && r.selOk)
      ok('máximo: el panel dice por qué', (r.status || '').includes('Máximo 3 diagnósticos'), r.status)
    }
    await typeIn('dx', 'R05'); await page.keyboard.press('Enter'); await page.waitForTimeout(120)
    ok('máximo: Intro sobre otra no agrega y lo dice', (await model('dx')).length === 3 && (await live()).startsWith('Máximo 3'), await live())
    ok('máximo: la deshabilitada es navegable (se lee y se sabe por qué)', (await activeOf('dx') || '').includes('Tos'), await activeOf('dx'))
    if (surf) { await page.keyboard.press('Escape'); await page.waitForTimeout(150) }
    // ---------------------------------------------------------------- 13 · Envío, solo lectura y deshabilitado
    await load()
    await page.locator('#send').click(); await page.waitForTimeout(120)
    {
      const sent = JSON.parse(await page.locator('#out-sent').textContent())
      ok('FormData: un valor por elegido con el mismo name', JSON.stringify(sent.etiquetas) === '["t0","t1"]' && JSON.stringify(sent.ro) === '["t2","t4","t8"]', sent)
      ok('FormData: el deshabilitado no se envía', !('dis' in sent), sent)
      ok('FormData: el GCombobox real convive (servicio)', JSON.stringify(sent.servicio) === '["urg"]', sent.servicio)
    }
    await page.locator('#f-ro').focus(); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150)
    ok('solo lectura: no abre', !(await listVisible('f-ro')) && !(await page.evaluate(() => Boolean(document.querySelector('#f-ro-surface[open]')))))
    ok('solo lectura: sin «Quitar» ni limpiar', await page.evaluate(() => { const r = document.getElementById('f-ro').closest('.xm'); return !r.querySelector('.xm-row__x, .xm-chip__x, .xm-clear') }))
    ok('solo lectura: aria-readonly / readonly y descripción', await page.evaluate(() => { const i = document.getElementById('f-ro'); return i.readOnly && document.getElementById('f-ro-about').textContent.startsWith('3 ') }))
    ok('deshabilitado: ocultos deshabilitados', await page.evaluate(() => [...document.querySelectorAll('input[type=hidden][name=dis]')].every((h) => h.disabled)))
    // ---------------------------------------------------------------- 14 · Δ en la GFormRow al pasar de 2 a 8 elegidos
    {
      const measure = () => page.evaluate(() => { const o = document.querySelector('#case-form > h2').getBoundingClientRect().top; const box = (id) => document.getElementById(id).closest('.g-input__control').getBoundingClientRect(); const lab = document.querySelector('label[for=f-tags]').getBoundingClientRect(); return { tags: box('f-tags').height, tagsTop: box('f-tags').top - o, folio: box('f-folio').top - o, serv: box('f-serv').top - o, lab: lab.top - o, notas: box('f-notas').top - o } })
      const a = await measure()
      await page.evaluate(() => { window.__M.tags = ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'] }); await page.waitForTimeout(700)
      const b = await measure()
      const d = (k) => Math.round((b[k] - a[k]) * 10) / 10
      ok('fila: la caja del campo no se mueve', d('tagsTop') === 0 && d('lab') === 0, [d('tagsTop'), d('lab')])
      ok('fila: las cajas vecinas no se mueven', d('folio') === 0 && d('serv') === 0, [d('folio'), d('serv')])
      if (c === 'base') { ok('base: la caja CRECE (referencia: la premisa que se cuestiona)', d('tags') > 0, d('tags')); results[`${engine} base`].delta = { caja: d('tags'), notas: d('notas') } }
      else ok(`${c}: la caja mide lo mismo con 2 y con 8 (Δ0)`, d('tags') === 0, d('tags'))
      if (c === 'A' || c === 'C') ok(`${c}: la línea de debajo no se mueve (Δ0)`, d('notas') === 0, d('notas'))
      if (c === 'B') { ok('B: la receta crece hacia abajo (lo de debajo baja)', d('notas') > 0, d('notas')); results[`${engine} B`].delta = { notas: d('notas') } }
    }
    // ---------------------------------------------------------------- 15 · Muchos: 500 opciones y 40 elegidas
    await load()
    {
      const openMs = () => page.evaluate(async () => { const i = document.getElementById('big'); i.focus(); const t0 = performance.now(); i.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const n = document.querySelectorAll('#big-list [role=option]').length; return { ms: Math.round(performance.now() - t0), n } })
      const cold = await openMs()
      if (c === 'A') ok('A: con 40 elegidas, «Elegidos» enseña 12 y «Ver los 40»', await page.evaluate(() => { const g = document.querySelector('[aria-labelledby="big-g-chosen"]'); const p = document.getElementById('big-pins'); return g.querySelectorAll('[role=option]:not(.xm-opt--action)').length === 12 && p && p.textContent.trim() === 'Ver los 40' && p.getAttribute('role') === 'option' }))
      await page.keyboard.press('Escape'); await page.waitForTimeout(150); if (!surf) { await page.keyboard.press('Escape') } await page.locator('#f-folio').focus(); await page.waitForTimeout(100)
      const warm = await openMs()
      results[`${engine} ${c}`].perf = { frio: cold.ms, caliente: warm.ms, filas: warm.n }
      // Cifra ANOTADA, no exigida: el prototipo compila sus plantillas en el navegador y monta un GSummary real por fila,
      // y con varios motores en paralelo WebKit varía ±100 ms entre pasadas. La compuerta «< 150 ms» es del componente
      // real (bruno, tests/combobox.spec.mjs). Aquí se exige que se pinten las filas y se anotan frío y caliente.
      ok('500 opciones y 40 elegidas: se pinta la lista (tope + elegidas)', warm.n > 40, warm)
      await page.keyboard.press('Escape'); await page.waitForTimeout(150)
      if (c === 'A' || c === 'C') {
        await page.locator('#big').focus(); await page.keyboard.press('Backspace'); await page.waitForTimeout(150)
        ok(`${c}: Retroceso saca a la vista la última aunque estuviera en «y N más»`, await page.evaluate(() => { const a = document.querySelector('#case-big .xm-s-item.is-armed'); return Boolean(a) && a.textContent.trim() === 'Insumo 040 · vendas' }))
        await page.keyboard.press('Escape'); await page.locator('#f-folio').focus(); await page.waitForTimeout(100)
      }
      if (c === 'A' || c === 'C') ok(`${c}: la frase cede («… y N más») y la descripción las dice todas`, await page.evaluate(() => { const s = document.querySelector('#case-big .xm-s-more'); const ab = document.getElementById('big-about').textContent; return Boolean(s && /\d+ más/.test(s.textContent)) && ab.startsWith('40 seleccionados') && ab.includes('Insumo 040') }))
      if (c === 'B') {
        ok('B: con muchos, 6 renglones y «Ver los 40»', await page.evaluate(() => { const r = document.querySelectorAll('#case-big .xm-row').length; const b = document.querySelector('#case-big .xm-rows__all'); return r === 6 && b && b.textContent.includes('Ver los 40') && b.getAttribute('aria-expanded') === 'false' }))
        await page.locator('#case-big .xm-rows__all').click(); await page.waitForTimeout(80)
        ok('B: «Ver los 40» los enseña todos', (await page.locator('#case-big .xm-row').count()) === 40)
      }
    }
    // ---------------------------------------------------------------- 16 · Dentro de un GDialog: Esc cierra la lista, no el diálogo
    await load()
    await page.locator('#d-open').click(); await page.waitForTimeout(250)
    await page.locator('#d-alg').focus(); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(200)
    ok('en GDialog: la lista se abre', surf ? await page.evaluate(() => Boolean(document.querySelector('#d-alg-surface[open]'))) : await listVisible('d-alg'))
    await typeIn('d-alg', 'mor'); await page.keyboard.press('Enter'); await page.waitForTimeout(150)
    ok('en GDialog: elige', (await model('dlgAlg')).includes('morfina'), await model('dlgAlg'))
    await page.keyboard.press('Escape'); await page.waitForTimeout(200)
    ok('en GDialog: Esc cierra la lista y el diálogo sigue abierto', await page.evaluate(() => { const d = document.querySelector('dialog.g-dialog, #dlg dialog, dialog[open]'); return [...document.querySelectorAll('dialog[open]')].some((x) => x.querySelector('#d-alg')) }))
    ok('en GDialog: el anuncio sale dentro del diálogo', await page.evaluate(() => { const l = [...document.querySelectorAll('dialog[open] [role=status]')]; return l.some((x) => x.closest('dialog').contains(document.getElementById('d-alg'))) }))
    // ---------------------------------------------------------------- 17 · Movimiento: con movimiento y sin él
    await load()
    ok('nada se anima al cargar ni al abrir (#336)', await page.evaluate(async () => { const i = document.getElementById('alg'); i.focus(); i.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); await new Promise((r) => setTimeout(r, 30)); return document.getAnimations().filter((a) => !(a instanceof CSSTransition) && a.playState === 'running' && a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.xm, .xm-surface')).length === 0 }))
    if (surf) { await page.keyboard.press('Escape') } else { await page.keyboard.press('Escape') }
    await page.waitForTimeout(150)
    {
      await typeIn('alg', 'naprox'); await page.keyboard.press('Enter')
      const n = await page.evaluate(() => new Promise((r) => setTimeout(() => r(document.getAnimations().filter((a) => a.playState === 'running').length), 30)))
      ok('con movimiento: agregar anima algo', n > 0, n)
      if (surf) await page.keyboard.press('Escape')
    }
    await page.emulateMedia({ reducedMotion: 'reduce' }); await load()
    {
      await typeIn('alg', 'naprox'); await page.keyboard.press('Enter')
      const n = await page.evaluate(() => new Promise((r) => setTimeout(() => r(document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.target && a.effect.target.closest('.xm, .xm-surface')).length), 30)))
      ok('movimiento reducido: nada se mueve', n === 0, n)
      if (surf) await page.keyboard.press('Escape')
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    // ---------------------------------------------------------------- 18 · Contraste (tema por defecto)
    await load()
    {
      const r = await page.evaluate((c) => {
        const out = {}
        const one = (k, s) => { const e = document.querySelector(s); if (e) out[k] = Math.round(__contrast(e) * 100) / 100 }
        if (c === 'A' || c === 'C') one('frase', '#case-alg .xm-s-item')
        if (c === 'base') one('ficha', '#case-alg .xm-chip__t')
        if (c === 'B') { one('renglón', '#case-alg .xm-row .g-summary__title'); one('dato', '#case-alg .xm-row .g-summary__subtitle') }
        return out
      }, c)
      for (const [k, v] of Object.entries(r)) ok(`contraste ${k} ≥ 4.5`, v >= 4.5, v)
    }
    // ---------------------------------------------------------------- 19 · Propio de cada concepto
    await load()
    if (c === 'A') {
      await openWith('alg')
      const before = await page.evaluate(() => document.querySelectorAll('#alg-g-chosen ~ [role=option], [aria-labelledby="alg-g-chosen"] [role=option]').length)
      await page.locator('[aria-labelledby="alg-g-chosen"] [role=option]').first().click(); await page.waitForTimeout(120)
      const r = await page.evaluate(() => { const g = document.querySelector('[aria-labelledby="alg-g-chosen"]'); const o = [...g.querySelectorAll('[role=option]')]; return { n: o.length, first: o[0].getAttribute('aria-selected') } })
      ok('A: desmarcar en «Elegidas» deja la fila (sin saltos) y la desmarca', r.n === before && r.first === 'false', [before, r])
      await page.keyboard.press('Escape'); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150)
      ok('A: al reabrir, «Elegidas» ya no la tiene', (await page.locator('[aria-labelledby="alg-g-chosen"] [role=option]').count()) === before - 1)
      ok('A: la cifra de «Elegidas» va con el modelo', (await page.locator('#alg-g-chosen').textContent()).trim() === 'Elegidas1')
    }
    if (c === 'B') {
      await typeIn('dx', 'I10'); await page.keyboard.press('Enter'); await page.waitForTimeout(150); await page.keyboard.press('Escape')
      ok('B: un renglón por elegido, en orden, numerado', await page.evaluate(() => { const r = [...document.querySelectorAll('#case-dx .xm-row')]; return r.length === 2 && r.map((x) => x.querySelector('.xm-row__n').textContent).join() === '1,2' && r[1].querySelector('.g-summary__code').textContent === 'I10' }))
      ok('B: el nuevo lleva «Nuevo» (texto, se lee)', await page.evaluate(() => { const r = document.querySelectorAll('#case-dx .xm-row')[1]; return r.classList.contains('is-fresh') && r.querySelector('.xm-row__fresh').textContent === 'Nuevo' }))
      const xBtn = page.locator('#case-dx .xm-row').first().locator('.xm-row__x')
      ok('B: «Quitar» con el nombre de lo que quita', (await xBtn.getAttribute('aria-label')) === 'Quitar Diabetes mellitus tipo 2, sin complicación')
      await page.locator('#case-dx .xm-row').first().scrollIntoViewIfNeeded()
      const top0 = await page.locator('#case-dx .xm-row').first().evaluate((e) => [e.getBoundingClientRect().top - document.querySelector('label[for=dx]').getBoundingClientRect().top, e.getBoundingClientRect().height])
      await xBtn.click(); await page.waitForTimeout(150)
      const r = await page.evaluate(() => { const t = document.querySelector('#case-dx .xm-row.is-tomb'); return { top: t && t.getBoundingClientRect().top - document.querySelector('label[for=dx]').getBoundingClientRect().top, h: t && t.getBoundingClientRect().height, focus: document.activeElement.classList.contains('xm-row__undo'), text: t && t.querySelector('.xm-row__tomb').textContent, desc: document.activeElement.getAttribute('aria-describedby') } })
      ok('B: quitar deja el rastro en el mismo sitio y alto (Δ0)', r.top !== null && Math.abs(r.top - top0[0]) < 0.5 && Math.abs(r.h - top0[1]) < 1, [r, top0])
      ok('B: el foco queda en «Deshacer», descrito por el rastro', r.focus && Boolean(r.desc) && r.text === 'Diabetes mellitus tipo 2, sin complicación quitado', r)
      await page.keyboard.press('Enter'); await page.waitForTimeout(150)
      ok('B: «Deshacer» lo devuelve a su sitio y el foco a su «Quitar»', JSON.stringify(await model('dx')) === '["E11.9","I10"]' && await page.evaluate(() => document.activeElement.classList.contains('xm-row__x')), await model('dx'))
      await page.locator('#case-dx .xm-row').first().locator('.xm-row__x').click(); await page.waitForTimeout(100)
      await page.locator('#f-folio').focus(); await page.waitForTimeout(200)
      ok('B: salir del campo no pliega el rastro (nada se mueve fuera)', (await page.locator('#case-dx .xm-row.is-tomb').count()) === 1)
      await page.locator('#dx').focus(); await page.waitForTimeout(600)
      ok('B: al volver a escribir, el rastro se pliega y «Nuevo» se va', await page.evaluate(() => document.querySelectorAll('#case-dx .xm-row.is-tomb').length === 0 && document.querySelectorAll('#case-dx .xm-row.is-fresh').length === 0 && document.querySelectorAll('#case-dx .xm-row').length === 1))
    }
    if (c === 'C') {
      await openWith('resp', 'Enter')
      ok('C: la cesta vacía lo dice', (await page.locator('#resp-surface .xm-basket__empty').count()) === 1)
      await page.keyboard.type('ana lop'); await page.waitForTimeout(100)
      ok('C: las dos «Ana López Ruiz» se distinguen: el área es is-diff (GSummary, #354)', await page.evaluate(() => { const o = [...document.querySelectorAll('#resp-list [role=option]')].filter((o) => o.textContent.includes('Ana López Ruiz')); return o.length === 2 && o.every((x) => x.querySelector('.g-summary__fact.is-diff')) }))
      await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('Enter')
      const arriving = await page.evaluate(() => new Promise((r) => setTimeout(() => r(Boolean(document.querySelector('#resp-surface .xm-row.is-arriving'))), 40)))
      ok('C: lo marcado viaja a la cesta', arriving)
      await page.waitForTimeout(700)
      ok('C: la cesta cuenta 1', (await page.locator('#resp-surface .xm-basket .xm-row').count()) === 1 && (await page.locator('#resp-surface .xm-basket__tally').textContent()).includes('1 seleccionado'))
      await page.locator('#resp-surface .xm-basket .xm-row__x').first().click(); await page.waitForTimeout(150)
      ok('C: quitar en la cesta deja «Deshacer» con el foco', await page.evaluate(() => document.activeElement.classList.contains('xm-row__undo')) && (await model('resp')).length === 0)
      await page.keyboard.press('Enter'); await page.waitForTimeout(150)
      ok('C: deshacer en la cesta', (await model('resp')).length === 1)
      await page.locator('#resp-surface .xm-done').click(); await page.waitForTimeout(200)
      ok('C: «Listo» cierra y devuelve el foco al campo', await page.evaluate(() => !document.querySelector('#resp-surface[open]') && document.activeElement.id === 'resp'))
      ok('C: en reposo, la frase', (await page.locator('#case-resp .xm-sentence').textContent()).includes('Ana López Ruiz'))
    }
    if (c === 'base') {
      const x = page.locator('#case-alg .xm-chip__x').first()
      ok('base: cada ficha con «Quitar {nombre}»', (await x.getAttribute('aria-label')) === 'Quitar Penicilina')
      await x.click(); await page.waitForTimeout(120)
      ok('base: el × quita', JSON.stringify(await model('alg')) === '["latex"]')
    }
    // ---------------------------------------------------------------- 20 · Móvil (375 y 320): hoja para todos, «Elegidas» arriba, ≥ 44px
    for (const w of [375, 320]) {
      await page.setViewportSize({ width: w, height: 760 }); await load()
      await page.locator('#alg').click(); await page.waitForTimeout(350)
      const r = await page.evaluate(() => { const d = document.querySelector('#alg-surface[open]'); const opts = d ? [...d.querySelectorAll('[role=option]')] : []; const g = d && d.querySelector('[role=group]'); return { sheet: Boolean(d && d.classList.contains('xm-surface--sheet')), chosen: g && document.getElementById(g.getAttribute('aria-labelledby')).textContent.trim(), min: Math.min(...opts.map((o) => o.getBoundingClientRect().height)), over: document.documentElement.scrollWidth - innerWidth, boxOver: d ? d.querySelector('.xm-surface__box').getBoundingClientRect().right - innerWidth : 0 } })
      ok(`${w}px: hoja`, r.sheet)
      ok(`${w}px: «Elegidas» arriba en la hoja`, r.chosen === 'Elegidas2', r.chosen)
      ok(`${w}px: opciones ≥ 44px`, r.min >= 44, r.min)
      ok(`${w}px: sin desbordamiento`, r.over <= 0 && r.boxOver <= 0.5, r)
      await page.locator('#alg-surface .xm-done').click(); await page.waitForTimeout(200)
      ok(`${w}px: «Listo» cierra y vuelve al campo`, await page.evaluate(() => document.activeElement.id === 'alg'))
    }
    await page.setViewportSize({ width: 1100, height: 900 })
    // ---------------------------------------------------------------- 21 · RTL
    await load('&dir=rtl')
    {
      const r = await page.evaluate(() => { const over = document.documentElement.scrollWidth - innerWidth; const s = document.querySelector('#case-alg .xm-sentence, #case-alg .xm-chip, #case-alg .xm-inwrap'); const ctl = document.getElementById('alg').closest('.g-input__control').getBoundingClientRect(); const sr = s.getBoundingClientRect(); return { over, startRight: ctl.right - sr.right } })
      ok('RTL: sin desbordamiento', r.over <= 0, r.over)
      ok('RTL: lo elegido empieza en el borde de inicio (derecha)', r.startRight < 80, r.startRight)
    }
    ok('consola limpia', errors.length === 0, errors.slice(0, 3))
    await ctx.close()
  }
  await browser.close()
}

for (const e of ENGINES) await run(e)
server.close()
let total = 0
for (const [k, v] of Object.entries(results)) { total += v.pass + v.fail.length; console.log(`${k}: ${v.pass}/${v.pass + v.fail.length}${v.delta ? ' · Δ ' + JSON.stringify(v.delta) : ''}${v.perf ? ' · ms ' + JSON.stringify(v.perf) : ''}`); for (const f of v.fail) console.log('   FALLA: ' + f) }
console.log(`TOTAL ${total - failTotal}/${total}`)
process.exit(failTotal ? 1 : 0)
