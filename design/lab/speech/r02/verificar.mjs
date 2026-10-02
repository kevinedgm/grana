// Verificación de la ronda r02 de captura de voz (kiwi), Chromium.
// Ejecutar desde la raíz del repo: node design/lab/speech/r02/verificar.mjs  (PORT=4252 por defecto; nunca 4173/4174)
// Levanta su propio servidor estático (el prototipo importa iconos de node_modules/lucide-static) y usa el
// Playwright de design/lab/theme-playground.
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const port = +(process.env.PORT || 4252)
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '-d', root], { stdio: 'ignore' })
const URL_ = `http://127.0.0.1:${port}/design/lab/speech/r02/index.html`
for (let i = 0; i < 50; i++) { try { if ((await fetch(URL_)).ok) break } catch {} await new Promise((r) => setTimeout(r, 100)) }

const { chromium } = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
let pass = 0, fail = 0
const fails = [], errs = [], notes = []
const ok = (c, m) => { if (c) pass++; else { fail++; fails.push(m) } }
const b = await chromium.launch()
async function open(opts = {}) {
  const ctx = await b.newContext({ viewport: { width: opts.w || 1280, height: opts.h || 900 }, hasTouch: !!opts.touch })
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: `http://127.0.0.1:${port}` })
  const p = await ctx.newPage()
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text()) })
  p.on('pageerror', (e) => errs.push('pageerror: ' + e))
  await p.goto(URL_); await p.waitForFunction(() => window.__sp?.ready)
  return p
}
const segs = (p) => p.evaluate(() => __sp.S.tx.segments.length)
const waitSegs = (p, n, timeout = 15000) => p.waitForFunction((k) => __sp.S.tx.segments.filter((s) => !s.failed).length >= k, n, { timeout }).then(() => true, () => false)
const ann = (p) => p.evaluate(() => __sp.announcements.map((a) => a.t))
const startFast = async (p, { diar = true, exp = '2' } = {}) => {
  await p.selectOption('#b-speed', 'fast'); await p.setChecked('#b-diar', diar); await p.selectOption('#b-exp', exp)
  await p.click('#panel-ctl [data-s="start"]')
}
const act = (p) => p.evaluate(() => { const a = document.activeElement; const row = a?.closest?.('[role=row]'); return { tag: a?.tagName, col: a?.closest?.('[data-col]')?.dataset.col || null, row: row?.dataset.id || null, a: a?.dataset?.a || null, id: a?.id || null } })
const oneTab = (p, sel) => p.evaluate((s) => [...document.querySelector(s).querySelectorAll('[role=grid] [tabindex="0"]')].length, sel)

try {
// ---------------------------------------------------------------------------------------------------
// 1) Carga: regiones vivas, una sola parada de tabulación por rejilla, iconos
{
  const p = await open()
  const r = await p.evaluate(() => {
    const live = [...document.querySelectorAll('[aria-live]:not([aria-live="off"]),[role="status"],[role="alert"],[role="log"]')]
    return { n: live.length, host: live.filter((e) => document.getElementById('host-ch').contains(e)).length }
  })
  ok(r.host === 2, `canales del anfitrión: ${r.host} (esperados 2)`)
  ok(r.n === 3, `regiones vivas al cargar: ${r.n} (2 del anfitrión + 1 del GTranscript sin anfitrión)`)
  ok(await p.evaluate(() => [...document.querySelectorAll('svg.g-icon')].every((s) => s.innerHTML.trim().length > 0)), 'todos los iconos tienen trazo (Lucide resuelto)')
  ok(await p.evaluate(() => ['text-cursor-input', 'undo-2', 'redo-2', 'trash', 'pencil', 'copy'].every((n) => window.LUCIDE_ICONS[n])), 'iconos F2 registrados en el prototipo (text-cursor-input, undo-2, redo-2, trash, pencil, copy)')
  ok(await oneTab(p, '#gt-saved') === 1, 'guardado: exactamente un elemento con tabindex=0 en la rejilla')
  await p.context().close()
}

// 2) Edición mientras llegan provisionales y confirmados: el editor no se pisa, el literal queda intacto
{
  const p = await open()
  await startFast(p)
  ok(await waitSegs(p, 3), 'sesión: llegan confirmados')
  const id = await p.evaluate(() => __sp.S.tx.segments[0].id)
  const literal = await p.evaluate(() => __sp.S.tx.segments[0].literal)
  await p.evaluate(() => __sp.GT.page.focusFirst())
  await p.keyboard.press('Enter')
  let a = await act(p)
  ok(a.tag === 'TEXTAREA' && a.row === id, 'Intro en la celda de texto abre el editor con el foco en el texto')
  await p.evaluate(() => { const t = document.activeElement; t.setSelectionRange(4, 4) })
  await p.keyboard.type('XYZ ')
  const before = await segs(p)
  const seenPartials = new Set()
  let sawPartialRow = false
  for (let i = 0; i < 40; i++) {
    const s = await p.evaluate(() => ({ p: __sp.S.tx.partial?.text || '', row: !!document.querySelector('#gt-page [role=row][data-state=partial]') }))
    if (s.p) seenPartials.add(s.p); if (s.row) sawPartialRow = true
    await p.waitForTimeout(60)
  }
  const after = await segs(p)
  ok(after - before >= 2, `llegan confirmados mientras se edita (${after - before} nuevos)`)
  ok(seenPartials.size >= 3 && sawPartialRow, `el provisional cambia en su propia fila mientras se edita (${seenPartials.size} versiones)`)
  const ed = await p.evaluate(() => { const t = document.activeElement; return { tag: t.tagName, v: t.value, s: t.selectionStart, e: t.selectionEnd } })
  ok(ed.tag === 'TEXTAREA', 'el foco sigue en el editor')
  ok(ed.v === literal.slice(0, 4) + 'XYZ ' + literal.slice(4), 'el borrador no se pierde ni se pisa')
  ok(ed.s === 8 && ed.e === 8, `el cursor no se mueve (${ed.s}/${ed.e})`)
  await p.keyboard.press('Enter')
  const seg = await p.evaluate((i) => ({ ...__sp.S.tx.segment(i) }), id)
  ok(seg.literal === literal, 'literal intacto tras guardar')
  ok(seg.corrected === (literal.slice(0, 4) + 'XYZ ' + literal.slice(4)).replace(/\s+/g, ' ').trim(), 'corregido guardado aparte')
  a = await act(p)
  ok(a.col === 'text' && a.row === id && a.tag === 'DIV', 'tras guardar, el foco vuelve a la celda de texto')
  ok(await p.evaluate((i) => document.querySelector(`#gt-panel [role=row][data-id="${i}"] .gt-p`).textContent.includes('XYZ'), id), 'la otra vista (panel) muestra la corrección: un solo modelo')
  ok(await p.evaluate((i) => /Corregido/.test(document.querySelector(`#gt-page [role=row][data-id="${i}"] .gt-flags`)?.textContent || ''), id), 'marca visible «Corregido» (texto + icono)')
  ok(await oneTab(p, '#gt-page') === 1, 'página: una sola parada de tabulación en la rejilla durante la edición')
  // anuncios: uno por la corrección, ninguno con texto transcrito
  await p.waitForTimeout(1200)
  const A = await ann(p)
  const lits = await p.evaluate(() => __sp.S.tx.segments.map((s) => s.literal).concat(__sp.S.tx.partial ? [__sp.S.tx.partial.text] : []))
  ok(A.filter((t) => /corregido/.test(t)).length === 1, 'un solo anuncio por la corrección')
  ok(!A.some((t) => lits.some((l) => l.length > 12 && t.includes(l.slice(0, 12)))), 'ningún anuncio contiene texto transcrito')
  // sin acciones del usuario: nada se anuncia mientras llegan fragmentos
  const n0 = (await ann(p)).length
  await p.waitForTimeout(2500)
  ok((await ann(p)).length === n0 && (await segs(p)) > after, 'sin spam: llegan fragmentos y no hay anuncios')

  // 3) Teclado de la rejilla
  await p.evaluate(() => __sp.GT.page.focusFirst())
  const ids = await p.evaluate(() => __sp.S.tx.segments.map((s) => s.id))
  await p.keyboard.press('ArrowDown'); a = await act(p)
  ok(a.row === ids[1] && a.col === 'text', 'Flecha abajo: siguiente fragmento, misma columna')
  await p.keyboard.press('ArrowLeft'); a = await act(p)
  ok(a.col === 'spk' && a.tag === 'BUTTON', 'Flecha izquierda: celda del hablante (su botón)')
  await p.keyboard.press('Home'); a = await act(p)
  ok(a.col === 'sel' && a.tag === 'INPUT', 'Inicio: casilla de selección de la fila')
  await p.keyboard.press('End'); a = await act(p)
  ok(a.col === 'act' && a.tag === 'BUTTON', 'Fin: botón de acciones de la fila')
  await p.keyboard.press('Control+End'); a = await act(p)
  const lastId = await p.evaluate(() => [...document.querySelectorAll('#gt-page [role=row][data-id]')].pop().dataset.id)
  ok(a.row === lastId, 'Ctrl+Fin: última fila')
  await p.keyboard.press('Control+Home'); a = await act(p)
  ok(a.row === ids[0], 'Ctrl+Inicio: primera fila')
  ok(await oneTab(p, '#gt-page') === 1, 'roving: sigue habiendo un solo tabindex=0')
  await p.keyboard.press('Home'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowDown')
  a = await act(p)
  ok(a.col === 'text' && a.row === ids[1], 'columna de texto de la fila 2')

  // 4) Eliminar, deshacer, rehacer
  await p.keyboard.press('Delete')
  ok(await p.evaluate((i) => __sp.S.tx.segment(i).removed, ids[1]), 'Supr: borrado lógico (removed)')
  ok(await p.evaluate((i) => document.querySelector(`#gt-page [role=row][data-id="${i}"]`).dataset.state === 'removed' && /Eliminado/.test(document.querySelector(`#gt-page [role=row][data-id="${i}"] .gt-flags`).textContent), ids[1]), 'fila eliminada visible con marca «Eliminado»')
  a = await act(p); ok(a.row === ids[1], 'el foco se queda en la fila eliminada')
  await p.waitForTimeout(1000)
  await p.keyboard.press('Control+z')
  ok(!(await p.evaluate((i) => __sp.S.tx.segment(i).removed, ids[1])), 'Ctrl+Z: restaurado')
  await p.waitForTimeout(1000)
  await p.keyboard.press('Control+Shift+z')
  ok(await p.evaluate((i) => __sp.S.tx.segment(i).removed, ids[1]), 'Ctrl+Mayús+Z: rehecho')
  await p.waitForTimeout(1000)
  const A2 = await ann(p)
  ok(A2.some((t) => /^Deshecho: eliminación/.test(t)) && A2.some((t) => /^Rehecho: eliminación/.test(t)), 'anuncios de deshacer/rehacer con la acción' + ` — ${JSON.stringify(A2.slice(-6))} ${JSON.stringify(await act(p))}`)
  const nA = (await ann(p)).length
  await p.keyboard.press('Delete'); await p.keyboard.press('Delete'); await p.keyboard.press('Delete')
  ok(await p.evaluate((i) => __sp.S.tx.segment(i).removed === false, ids[1]), 'Supr sobre una eliminada: la restaura (tres pulsaciones: restaurada, eliminada, restaurada)')
  await p.waitForTimeout(1500)
  const A3 = (await ann(p)).slice(nA)
  ok(A3.length === 1 && /restaurado/.test(A3[0]), `acciones seguidas: gana el último anuncio (${A3.length}: ${A3.join(' | ')})`)
  ok(await p.evaluate((i) => __sp.S.tx.segment(i).literal.length > 0 && __sp.S.tx.segment(i).corrected === null, ids[1]), 'eliminar y restaurar no tocan literal ni corregido')

  // 5) Ver original (diferencias) y volver al original desde el menú de acciones
  await p.keyboard.press('Control+Home'); await p.keyboard.press('End'); await p.keyboard.press('Enter')
  ok(await p.evaluate(() => document.activeElement.getAttribute('role') === 'menuitem'), 'menú de acciones: foco en el primer elemento')
  const items = await p.evaluate(() => [...document.querySelectorAll('.gt-menu [role^=menuitem]')].map((x) => x.textContent.trim()))
  ok(items.includes('Ver original') && items.includes('Volver al original') && items.includes('Insertar en Plan'), 'menú: ver original, volver al original, insertar en cada destino')
  await p.evaluate(() => [...document.querySelectorAll('.gt-menu [role^=menuitem]')].find((x) => x.textContent.trim() === 'Ver original').focus())
  await p.keyboard.press('Enter')
  const diff = await p.evaluate((i) => { const r = document.querySelector(`#gt-page [role=row][data-id="${i}"] .gt-orig`); return r ? { del: r.querySelectorAll('del').length, ins: r.querySelectorAll('ins').length, sr: r.querySelector('ins .sr')?.textContent } : null }, ids[0])
  ok(diff && diff.ins >= 1 && diff.sr === '(añadido: ', 'ver original: diferencia por palabras con <ins>/<del> y prefijo oculto para lectores')
  a = await act(p); ok(a.col === 'act' && a.tag === 'BUTTON', 'al cerrar el menú el foco vuelve a su botón')
  await p.keyboard.press('Enter')
  await p.evaluate(() => [...document.querySelectorAll('.gt-menu [role^=menuitem]')].find((x) => x.textContent.trim() === 'Volver al original').focus())
  await p.keyboard.press('Enter')
  ok(await p.evaluate((i) => __sp.S.tx.segment(i).corrected === null, ids[0]), 'volver al original: corrected = null')
  await p.keyboard.press('Control+z')
  ok(await p.evaluate((i) => __sp.S.tx.segment(i).corrected !== null, ids[0]), 'deshacer «volver al original» recupera la corrección')

  // 6) Reasignar hablante (no toca engineSpeaker)
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Home'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight')
  a = await act(p); ok(a.col === 'spk', 'celda de hablante de la fila 2')
  const eng1 = await p.evaluate((i) => __sp.S.tx.segment(i).engineSpeaker, ids[1])
  await p.keyboard.press('Enter')
  const radios = await p.evaluate(() => [...document.querySelectorAll('.gt-menu [role=menuitemradio]')].map((x) => [x.textContent.trim(), x.getAttribute('aria-checked')]))
  ok(radios.length >= 2 && radios.filter((r) => r[1] === 'true').length === 1, 'menú de hablantes: menuitemradio con el actual marcado')
  await p.evaluate(() => [...document.querySelectorAll('.gt-menu [role=menuitemradio]')].find((x) => x.getAttribute('aria-checked') === 'false').focus())
  await p.keyboard.press('Enter')
  const s1 = await p.evaluate((i) => ({ ...__sp.S.tx.segment(i) }), ids[1])
  ok(s1.speaker && s1.speaker !== eng1 && s1.engineSpeaker === eng1, 'reasignación: speaker cambia, engineSpeaker intacto')
  ok(await p.evaluate((i) => /Hablante cambiado \(motor: Hablante B\)/.test(document.querySelector(`#gt-page [role=row][data-id="${i}"] .gt-flags`).textContent), ids[1]), 'marca «Hablante cambiado (motor: Hablante B)»')

  // 7) Roles por hablante (gestor) en las dos vistas
  await p.click('#gt-page [data-a="speakers"]')
  ok(await p.getAttribute('#gt-page [data-a="speakers"]', 'aria-expanded') === 'true', 'Hablantes: disclosure con aria-expanded')
  await p.selectOption('#gt-page [data-a="role"][data-spk="spk_0"]', 'pro')
  await p.selectOption('#gt-page [data-a="role"][data-spk="spk_1"]', 'pac')
  const labs = await p.evaluate(() => [...new Set([...document.querySelectorAll('#gt-panel .gt-spk__t')].map((x) => x.textContent))])
  ok(labs.includes('Profesional (A)') && labs.includes('Paciente (B)'), `roles visibles también en el panel: ${labs.join(' | ')}`)
  ok(await p.evaluate(() => __sp.S.tx.toJSON().speakers.find((s) => s.id === 'spk_0').role === 'pro'), 'el rol se guarda en speakers[].role (dato)')

  // 8) Unir hablantes y diarización revisada mientras se edita
  ok(await waitSegs(p, 6), 'aparece un tercer hablante (C)')
  await p.waitForFunction(() => document.querySelector('#gt-page [data-a="merge"][data-spk="spk_2"]'))
  await p.selectOption('#gt-page [data-r3="into-spk_2"]', 'spk_0')
  await p.click('#gt-page [data-a="merge"][data-spk="spk_2"]')
  const cId = await p.evaluate(() => __sp.S.tx.segments.find((s) => s.engineSpeaker === 'spk_2').id)
  ok(await p.evaluate((i) => document.querySelector(`#gt-page [role=row][data-id="${i}"] .gt-spk__t`).textContent === 'Profesional (A)', cId), 'unir C con A: sus fragmentos muestran A')
  ok(await p.evaluate((i) => __sp.S.tx.segment(i).engineSpeaker === 'spk_2', cId), 'unir no cambia engineSpeaker')
  await p.click('#gt-page [data-a="undo"]')
  ok(await p.evaluate((i) => document.querySelector(`#gt-page [role=row][data-id="${i}"] .gt-spk__t`).textContent === 'Hablante C', cId), 'deshacer la unión')
  // relabel del motor con el editor abierto en otro fragmento
  await p.evaluate(() => __sp.GT.page.focusFirst()); await p.keyboard.press('Enter'); await p.keyboard.type(' QQ')
  await p.evaluate(() => __sp.S.tx.relabel({ spk_2: 'spk_0' }))
  const ed2 = await p.evaluate(() => ({ v: document.querySelector('#gt-page .gt-editor textarea')?.value.endsWith(' QQ'), f: document.activeElement.tagName }))
  ok(ed2.v && ed2.f === 'TEXTAREA', 'diarización revisada (relabel) con el editor abierto: el borrador y el foco siguen')
  ok(await p.evaluate((i) => __sp.S.tx.segment(i).engineSpeaker === 'spk_0', cId), 'relabel: actualiza la capa literal (engineSpeaker)')
  await p.evaluate(() => document.querySelector('#gt-page .gt-editor textarea').focus())
  await p.keyboard.press('Escape')
  ok(!(await p.evaluate(() => !!document.querySelector('#gt-page .gt-editor'))), 'Esc cancela la edición')
  ok(await p.evaluate(() => !__sp.S.tx.segments[0].corrected.includes('QQ')), 'cancelar no guarda el borrador')

  // 9) Selección: Mayús+Espacio, Mayús+flechas, Ctrl+A, rango con Mayús+clic
  await p.evaluate(() => __sp.GT.page.focusFirst())
  await p.keyboard.press('Shift+Space'); await p.keyboard.press('Shift+ArrowDown'); await p.keyboard.press('Shift+ArrowDown')
  let sel = await p.evaluate(() => [...__sp.GT.page.ui.sel])
  ok(sel.length === 3, `selección por teclado: ${sel.length} (esperadas 3)`)
  ok(await p.evaluate(() => [...document.querySelectorAll('#gt-page [role=row][aria-selected=true]')].length) === 3, 'aria-selected en las filas seleccionadas')
  ok(await p.evaluate(() => document.querySelector('#gt-page .gt__count').textContent) === '3 seleccionados', 'contador visible «3 seleccionados»')
  await p.keyboard.press('Control+a')
  const total = await p.evaluate(() => __sp.S.tx.segments.filter((s) => !s.failed).length)
  sel = await p.evaluate(() => [...__sp.GT.page.ui.sel]); ok(sel.length >= total - 1, 'Ctrl+A selecciona todo')
  await p.keyboard.press('Control+a'); sel = await p.evaluate(() => [...__sp.GT.page.ui.sel]); ok(sel.length === 0, 'Ctrl+A otra vez: ninguno')
  await p.click(`#gt-page [role=row][data-id="${ids[0]}"] [data-a="pick"]`)
  await p.click(`#gt-page [role=row][data-id="${ids[3]}"] [data-a="pick"]`, { modifiers: ['Shift'] })
  sel = await p.evaluate(() => [...__sp.GT.page.ui.sel]); ok(sel.length === 4, `Mayús+clic en la casilla: rango (${sel.length})`)

  // 10) Copiar: selección con y sin hablantes; copia nativa limpia
  await p.click('#gt-page [data-a="copy"]')
  await p.evaluate(() => [...document.querySelectorAll('.gt-menu [role^=menuitem]')].find((x) => x.textContent.startsWith('Copiar texto')).focus())
  await p.keyboard.press('Enter'); await p.waitForTimeout(150)
  const clip1 = await p.evaluate(() => navigator.clipboard.readText())
  const exp1 = await p.evaluate(() => __sp.GT.page.compose({ kind: 'segments', ids: [...__sp.GT.page.ui.sel] }, {}).text)
  ok(clip1 === exp1 && clip1.length > 20 && !/\d\d:\d\d/.test(clip1), 'copiar texto: el corregido de los seleccionados, sin horas')
  await p.click('#gt-page [data-a="copy"]')
  await p.evaluate(() => [...document.querySelectorAll('.gt-menu [role^=menuitem]')].find((x) => x.textContent.startsWith('Copiar con')).focus())
  await p.keyboard.press('Enter'); await p.waitForTimeout(150)
  const clip2 = await p.evaluate(() => navigator.clipboard.readText())
  ok(/^\[00:00\] Profesional: /.test(clip2) && clip2.includes('\n[') , 'copiar con hablantes y horas: «[mm:ss] Rol: texto» por turno')
  const nat = await p.evaluate((i) => {
    const p0 = document.querySelector(`#gt-page [role=row][data-id="${i}"] .gt-p`); const r = document.createRange()
    r.setStart(p0.firstChild, 2); r.setEnd(p0.firstChild, 14); const s = getSelection(); s.removeAllRanges(); s.addRange(r)
    const dt = new DataTransfer(); const ev = new ClipboardEvent('copy', { clipboardData: dt, bubbles: true, cancelable: true }); p0.dispatchEvent(ev)
    return { data: dt.getData('text/plain'), want: p0.textContent.slice(2, 14).trim(), prevented: ev.defaultPrevented }
  }, ids[2])
  ok(nat.prevented && nat.data === nat.want, 'copia nativa de un trozo de texto: limpio (sin horas ni textos ocultos)')

  // 11) Destinos: insertar en un campo desmontado, v-model, marca de uso, deshacer; cursor; texto seleccionado; una línea
  await p.waitForTimeout(150)
  await p.evaluate(() => __sp.setTab('motivo'))
  ok(!(await p.evaluate(() => !!document.getElementById('f-plan'))), 'Plan está desmontado (otra pestaña)')
  await p.selectOption('#gt-page [data-a="target"]', 'plan')
  await p.check('#gt-page [data-a="src"][value="sel"]')
  await p.click('#gt-page [data-a="insert"]')
  const plan = await p.evaluate(() => __sp.form.plan)
  const expPlan = await p.evaluate(() => __sp.GT.page.compose({ kind: 'segments', ids: [...__sp.GT.page.ui.sel] }, { withSpeakers: true }).text)
  ok(plan === expPlan && plan.includes('Profesional: '), 'insertar fragmentos marcados en Plan (desmontado) con hablantes, vía el modelo' + (plan === expPlan ? '' : ` — plan=${JSON.stringify(plan)} esperado=${JSON.stringify(expPlan)} ${JSON.stringify(await p.evaluate(() => ({ sel: [...__sp.GT.page.ui.sel], src: __sp.GT.page.ui.src, target: __sp.GT.page.ui.target, motivo: __sp.form.motivo, resumen: __sp.form.resumen })))}`))
  ok(await p.evaluate(() => [...__sp.GT.page.ui.sel].every((i) => /Usado en Plan/.test(document.querySelector(`#gt-page [role=row][data-id="${i}"] .gt-flags`)?.textContent || ''))), 'marca «Usado en Plan» en cada fragmento usado')
  ok(await p.evaluate(() => __sp.S.tx.toJSON().derived.some((d) => d.kind === 'insert' && d.target.id === 'plan' && d.sourceSegmentIds.length === 4)), 'el uso queda como dato en derived (kind insert, target, sourceSegmentIds)')
  await p.evaluate(() => __sp.setTab('plan'))
  ok(await p.evaluate(() => document.getElementById('f-plan').value === __sp.form.plan), 'al montar Plan, el campo muestra el valor (v-model)')
  await p.click('#gt-page .gt__result [data-a="undoins"]')
  ok(await p.evaluate(() => __sp.form.plan === '' && document.getElementById('f-plan').value === ''), 'deshacer inserción: Plan vuelve a estar vacío')
  ok(await p.evaluate(() => !document.querySelector('#gt-page .gt-flags')?.textContent.includes('Usado en Plan')), 'deshacer quita la marca de uso')
  // inserción no deshacible si el campo cambió después
  await p.click('#gt-page [data-a="insert"]')
  await p.click('#f-plan'); await p.keyboard.press('End'); await p.keyboard.type(' (editado)')
  const planEdited = await p.evaluate(() => __sp.form.plan)
  await p.click('#gt-page .gt__result [data-a="undoins"]')
  ok(await p.evaluate(() => __sp.form.plan) === planEdited, 'deshacer tras editar el campo: no toca nada')
  await p.waitForTimeout(1000)
  ok((await ann(p)).some((t) => /No se puede deshacer: Plan cambió/.test(t)), 'y lo anuncia')
  // en el cursor del campo Motivo, con texto seleccionado en la transcripción
  await p.evaluate(() => __sp.setTab('motivo'))
  await p.evaluate(() => { const t = document.getElementById('f-motivo'); t.value = 'Cefalea. Dolor.'; t.dispatchEvent(new Event('input', { bubbles: true })); t.focus(); t.setSelectionRange(8, 8); t.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true })) })
  const sub = await p.evaluate((i) => {
    const p0 = document.querySelector(`#gt-page [role=row][data-id="${i}"] .gt-p`); const r = document.createRange()
    r.setStart(p0.firstChild, 0); r.setEnd(p0.firstChild, 20); getSelection().removeAllRanges(); getSelection().addRange(r); return p0.textContent.slice(0, 20)
  }, ids[2])
  await p.waitForTimeout(250)
  await p.selectOption('#gt-page [data-a="target"]', 'motivo')
  ok(await p.evaluate(() => document.querySelector('#gt-page [data-a="src"][value="text"]').checked), 'al seleccionar texto en la transcripción, «Texto seleccionado» pasa a ser la fuente')
  ok(!(await p.evaluate(() => document.querySelector('#gt-page [data-a="pos"][value="cursor"]').disabled)), '«En la posición del cursor» disponible (cursor recordado del campo)')
  await p.check('#gt-page [data-a="pos"][value="cursor"]')
  await p.click('#gt-page [data-a="insert"]')
  ok(await p.evaluate(() => __sp.form.motivo) === 'Cefalea. ' + sub.trim() + ' Dolor.', `insertar texto seleccionado en el cursor con separadores: «${await p.evaluate(() => __sp.form.motivo)}»`)
  ok(await p.evaluate(() => document.getElementById('f-motivo').value === __sp.form.motivo), 'el campo montado se actualiza por el modelo')
  // campo de una línea
  await p.evaluate(() => getSelection().removeAllRanges())
  await p.evaluate(() => __sp.GT.page.focusFirst()); await p.keyboard.press('Control+a'); await p.keyboard.press('Control+a')
  await p.selectOption('#gt-page [data-a="target"]', 'resumen')
  await p.check('#gt-page [data-a="src"][value="all"]')
  await p.click('#gt-page [data-a="insert"]')
  const res = await p.evaluate(() => __sp.form.resumen)
  ok(res.length > 40 && !res.includes('\n'), 'campo de una línea: sin saltos de línea')
  ok(await p.evaluate(() => /En la posición del cursor/.test(document.querySelector('#gt-page .gt__ins').textContent) && document.querySelector('#gt-page [data-a="insert"]').textContent.includes('Insertar en Resumen')), 'botón con el destino en el nombre')

  // 12) Finalizar y revisión
  await p.click('#panel-ctl [data-s="finish"]')
  await p.waitForFunction(() => __sp.S.status === 'completed', null, { timeout: 8000 })
  ok(await p.evaluate(() => __sp.S.tx.partial === null), 'al finalizar no queda provisional')
  await p.waitForTimeout(2500)
  ok((await ann(p)).some((t) => /^Transcripción lista: \d+ fragmentos/.test(t)), 'anuncio de fin (canal del anfitrión)')
  await p.click('#panel-ctl [data-s="review"]')
  ok((await act(p)).id === 'rv-page-t', 'Revisar con revisión en la página: foco al título de la revisión (no se abre diálogo)')
  await p.setChecked('#b-pagerev', false)
  await p.click('#panel-ctl [data-s="review"]')
  ok(await p.evaluate(() => document.getElementById('rv-dlg').open), 'sin revisión en la página: diálogo de respaldo del anfitrión')
  ok((await act(p)).id === 'rv-dlg-t', 'foco al título del diálogo')
  ok(await p.evaluate(() => document.getElementById('rv-dlg').contains(document.getElementById('host-ch'))), 'los canales vivos se trasladan al diálogo modal')
  ok(await p.evaluate(() => document.querySelectorAll('#gt-dialog [role=row][data-id]').length === __sp.S.tx.segments.length), 'el diálogo muestra el mismo transcript')
  await p.evaluate(() => __sp.GT.dialog.focusFirst()); await p.keyboard.press('Enter'); await p.keyboard.press('Escape')
  ok(await p.evaluate(() => document.getElementById('rv-dlg').open && !document.querySelector('#gt-dialog .gt-editor')), 'Esc en el editor cancela la edición y no cierra el diálogo')
  await p.keyboard.press('End'); await p.keyboard.press('Enter'); await p.keyboard.press('Escape')
  ok(await p.evaluate(() => document.getElementById('rv-dlg').open && !document.querySelector('.gt-menu')), 'Esc en un menú lo cierra y no cierra el diálogo')
  await p.keyboard.press('Escape')
  ok(!(await p.evaluate(() => document.getElementById('rv-dlg').open)), 'Esc en la rejilla cierra el diálogo')
  ok((await act(p)).a === null && await p.evaluate(() => document.activeElement.dataset.s === 'review'), 'el foco vuelve a «Revisar transcripción»')
  ok(await p.evaluate(() => document.getElementById('host-ch').parentElement === document.body), 'los canales vuelven a body')
  await p.click('#panel-ctl [data-s="close"]')
  const done = await p.evaluate(() => __sp.completed[0])
  ok(done && done.segments.some((s) => s.corrected) && done.segments.every((s) => s.literal || s.failed) && done.derived.length >= 2 && !('partial' in done), 'cerrar sesión: onComplete recibe literal, corregido, hablantes con rol y usos (sin partial)')
  await p.context().close()
}

// 13) Motor sin diarización y fragmento fallido
{
  const p = await open()
  await startFast(p, { diar: false, exp: 'many' })
  ok(await waitSegs(p, 3), 'sin diarización: llegan confirmados')
  ok(await p.evaluate(() => !document.querySelector('#gt-page .gt__note').hidden && /no distingue hablantes/.test(document.querySelector('#gt-page .gt__note').textContent)), 'aviso visible: el motor no distingue hablantes')
  ok(await p.evaluate(() => [...document.querySelectorAll('#gt-page [role=row][data-id] .gt-spk__t')].every((x) => x.textContent === 'Sin asignar')), 'todos los fragmentos «Sin asignar»')
  const ids = await p.evaluate(() => __sp.S.tx.segments.slice(0, 2).map((s) => s.id))
  await p.click(`#gt-page [role=row][data-id="${ids[0]}"] [data-a="pick"]`); await p.click(`#gt-page [role=row][data-id="${ids[1]}"] [data-a="pick"]`)
  await p.click('#gt-page [data-a="assign"]')
  await p.evaluate(() => [...document.querySelectorAll('.gt-menu [role^=menuitem]')].find((x) => x.textContent.trim() === 'Nuevo hablante').focus())
  await p.keyboard.press('Enter')
  ok(await p.evaluate((l) => l.every((i) => document.querySelector(`#gt-page [role=row][data-id="${i}"] .gt-spk__t`).textContent === 'Hablante A'), ids), 'asignar la selección a un hablante nuevo (A)')
  ok(await p.evaluate(() => __sp.S.tx.speakers.some((s) => s.origin === 'user')), 'el hablante creado por el usuario queda con origin: user')
  await p.click('#gt-page [data-a="undo"]')
  ok(await p.evaluate((l) => l.every((i) => document.querySelector(`#gt-page [role=row][data-id="${i}"] .gt-spk__t`).textContent === 'Sin asignar') && !__sp.S.tx.speakers.length, ids), 'deshacer quita la asignación y el hablante creado')
  await p.click('#inj-fail')
  ok(await p.waitForFunction(() => __sp.S.tx.segments.some((s) => s.failed), null, { timeout: 8000 }).then(() => true, () => false), 'fragmento fallido en la lista')
  ok(await p.evaluate(() => { const r = document.querySelector('#gt-page [role=row][data-state=failed]'); return r && !r.querySelector('[data-a="pick"]') && !r.querySelector('[data-a="menu"]') && /No se pudo transcribir/.test(r.textContent) }), 'fallido: sin selección ni acciones, con texto (icono + mensaje)')
  // expectedSpeakers 1: sin columna de hablante hasta que el motor distinga dos
  await p.click('#panel-ctl [data-s="finish"]'); await p.waitForFunction(() => __sp.S.status === 'completed', null, { timeout: 8000 })
  await p.click('#panel-ctl [data-s="close"]')
  await p.setChecked('#b-diar', false); await p.selectOption('#b-exp', '1'); await p.click('#panel-ctl [data-s="start"]')
  await waitSegs(p, 2)
  ok(await p.evaluate(() => !document.querySelector('#gt-page [role=row][data-id] [data-col="spk"]')), 'un participante previsto y sin diarización: sin columna de hablante')
  await p.context().close()
}

// 14) Transcript guardado sin sesión: editable, solo selección, solo lectura
{
  const p = await open()
  await p.evaluate(() => document.querySelector('#gt-saved [role=row][data-id="s2"] [data-col="text"]').focus())
  await p.keyboard.press('Delete')
  ok(await p.evaluate(() => __sp.savedTx.segment('s2').removed), 'guardado: se edita sin sesión')
  await p.waitForTimeout(400)
  ok(await p.evaluate(() => document.querySelector('#gt-saved [role=status]').textContent.includes('eliminado')), 'guardado: anuncia por su propia región (sin anfitrión)')
  ok(await p.evaluate(() => /Usado en Plan/.test(document.querySelector('#gt-saved [role=row][data-id="s6"]').textContent)), 'guardado: los usos guardados se muestran')
  ok(await p.evaluate(() => document.querySelector('#gt-saved [role=row][data-id="s4"] .gt-spk__t').textContent === 'Profesional (A)' && /motor: Paciente \(B\)/.test(document.querySelector('#gt-saved [role=row][data-id="s4"] .gt-flags').textContent)), 'guardado: reasignación con el hablante del motor visible')
  await p.selectOption('#saved-mode', 'select')
  ok(await p.evaluate(() => !!document.querySelector('#gt-saved [role=grid]') && !document.querySelector('#gt-saved [data-a="undo"]') && !document.querySelector('#gt-saved [data-a="spk"]')), 'solo selección: rejilla sin edición ni cambio de hablante')
  await p.selectOption('#saved-mode', 'read')
  ok(await p.evaluate(() => !document.querySelector('#gt-saved [role=grid]') && document.querySelector('#gt-saved ol.gt-list')?.getAttribute('tabindex') === '0'), 'solo lectura: lista simple desplazable con teclado')
  await p.context().close()
}

// 15) Transcript largo: tiempos de interacción
{
  const p = await open()
  await p.click('#long-load')
  await p.waitForFunction(() => __sp.longRender)
  const lr = await p.evaluate(() => __sp.longRender)
  notes.push(`320 fragmentos: construcción ${lr.build} ms, hasta el pintado ${lr.toPaint} ms, ${lr.nodes} nodos`)
  ok(lr.toPaint < 500, `320 fragmentos: pintado inicial ${lr.toPaint} ms (< 500)`)
  await p.waitForTimeout(300)
  await p.evaluate(() => { __sp.perf.length = 0; __sp.events.length = 0; __sp.tMeasure = performance.now(); __sp.GT.long.focusFirst() })
  // Ritmo de una persona con la tecla mantenida (repetición ~25/s): 40 ms entre pulsaciones
  const press = async (k, n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(40) } }
  await press('ArrowDown', 20); await press('PageDown', 5)
  await press('Shift+Space'); await press('Shift+ArrowDown', 2)
  await press('Enter'); await p.keyboard.type(' corregido'); await press('Enter')
  await press('Delete'); await press('Control+z'); await press('Control+Shift+z')
  await press('Control+a', 2); await press('Control+End'); await press('Control+Home')
  await p.waitForTimeout(300)
  const perf = await p.evaluate(() => __sp.perf.filter((x) => x.gt === 'largo'))
  const ev = await p.evaluate(() => __sp.events.filter((e) => /key|click|pointer/.test(e.name) && e.t >= __sp.tMeasure))
  const maxK = Math.max(...perf.map((x) => x.ms)), maxE = ev.length ? Math.max(...ev.map((e) => e.dur)) : 0
  const worst = perf.slice().sort((a, b) => b.ms - a.ms).slice(0, 3).map((x) => `${x.key} ${x.ms}`).join(', ')
  notes.push(`320 fragmentos: ${perf.length} teclas, máximo tecla→pintado ${maxK} ms (${worst}); Event Timing: ${ev.length} eventos ≥ 16 ms, máximo ${maxE} ms`)
  ok(perf.length >= 35, `teclas medidas: ${perf.length}`)
  ok(maxK < 50, `320 fragmentos: cada tecla < 50 ms hasta el pintado (máx. ${maxK} ms)`)
  ok(maxE < 100, `320 fragmentos: Event Timing < 100 ms (máx. ${maxE} ms)`)
  await p.click('#long-load-1000')
  await p.waitForFunction(() => __sp.longRender?.n === 1000)
  const l2 = await p.evaluate(() => __sp.longRender)
  await p.evaluate(() => { __sp.perf.length = 0; __sp.GT.long.focusFirst() })
  for (const k of ['PageDown', 'PageDown', 'PageDown', 'PageDown', 'PageDown', 'Control+a', 'Control+a', 'Delete', 'Control+z']) { await p.keyboard.press(k); await p.waitForTimeout(40) }
  await p.waitForTimeout(300)
  const perf2 = await p.evaluate(() => __sp.perf.filter((x) => x.gt === 'largo'))
  notes.push(`1000 fragmentos (informativo): pintado ${l2.toPaint} ms, ${l2.nodes} nodos; máximo tecla→pintado ${Math.max(...perf2.map((x) => x.ms))} ms (${perf2.slice().sort((a, b) => b.ms - a.ms)[0].key})`)
  await p.context().close()
}

// 16) Móvil 320×640
{
  const p = await open({ w: 320, h: 640, touch: true })
  await startFast(p)
  await waitSegs(p, 4)
  const ov = await p.evaluate(() => ({ doc: document.documentElement.scrollWidth, gts: [...document.querySelectorAll('.gt')].map((g) => [g.id || g.parentElement.id, g.scrollWidth - g.clientWidth]).filter((x) => x[1] > 0) }))
  ok(ov.doc <= 320, `320px: sin desborde horizontal de la página (${ov.doc})`)
  ok(ov.gts.length === 0, `320px: ningún GTranscript desborda (${JSON.stringify(ov.gts)})`)
  const lay = await p.evaluate(() => { const r = document.querySelector('#gt-page [role=row][data-id]'); const t = r.querySelector('[data-col=text]').getBoundingClientRect(), s = r.querySelector('[data-col=spk]').getBoundingClientRect(); return { stacked: t.top >= s.bottom - 1, w: t.width } })
  ok(lay.stacked && lay.w > 200, `320px: fila apilada (meta arriba, texto a todo el ancho: ${Math.round(lay.w)}px)`)
  const tg = await p.evaluate(() => [...document.querySelectorAll('#gt-page [role=row][data-id] button, #gt-page [role=row][data-id] input')].slice(0, 12).map((x) => { const r = x.closest('.gt-c').getBoundingClientRect(); return Math.min(r.width, r.height) }))
  ok(tg.every((v) => v >= 24), `objetivos de la fila ≥ 24px (${Math.min(...tg)})`)
  await p.evaluate(() => document.querySelector('#gt-page [role=row][data-id] [data-a="menu"]').scrollIntoView({ block: 'center' }))
  await p.click('#gt-page [role=row][data-id] [data-a="menu"]')
  const mr = await p.evaluate(() => { const r = document.querySelector('.gt-menu').getBoundingClientRect(); return [r.left, r.right, r.top, r.bottom] })
  ok(mr[0] >= 0 && mr[1] <= 320 && mr[2] >= 0 && mr[3] <= 640, `320px: el menú cabe en el visor (${mr.map(Math.round).join(',')})`)
  await p.keyboard.press('Escape')
  const ins = await p.evaluate(() => { const r = document.querySelector('#gt-page .gt__ins').getBoundingClientRect(); return [r.left, r.right] })
  ok(ins[0] >= 0 && ins[1] <= 320, '320px: la barra de inserción cabe')
  await p.setChecked('#b-pagerev', false)
  await p.click('#open-review')
  const dl = await p.evaluate(() => { const r = document.getElementById('rv-dlg').getBoundingClientRect(); const g = document.querySelector('#gt-dialog .gt'); return { w: r.width, h: r.height, over: (g || document.getElementById('gt-dialog')).scrollWidth - (g || document.getElementById('gt-dialog')).clientWidth } })
  ok(dl.w <= 320 && dl.h <= 640 && dl.over <= 0, `320px: revisión de respaldo a pantalla completa sin desborde (${Math.round(dl.w)}×${Math.round(dl.h)})`)
  await p.context().close()
}

} catch (e) { ok(false, 'EXCEPCIÓN: ' + e.message.split('\n')[0]) }
b.close(); srv.kill()
console.log(notes.map((n) => '· ' + n).join('\n'))
const errsUniq = [...new Set(errs)]
ok(errsUniq.length === 0, 'consola sin errores ni avisos: ' + errsUniq.join(' | '))
console.log(`\n${pass} correctas, ${fail} fallidas`)
if (fails.length) console.log('FALLAN:\n- ' + fails.join('\n- '))
process.exit(fail ? 1 : 0)
