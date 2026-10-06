// Verificación del tooltip (kiwi): la base (r01) y los conceptos 0/A/B/C (r02) con la misma batería, más lo propio.
// Ejecutar: node design/lab/tooltip/verificar.mjs   (GRANA_PW_PORT, por defecto 4212; ENGINES=chromium,firefox,webkit;
// PARTS=base,0,A,B,C; VERBOSE=1). Requiere packages/vue/dist (npm run build). Solo lee; no toca packages/.
import { serve, pw } from './serve.mjs'

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'base,0,A,B,C').split(',')
const V = !!process.env.VERBOSE
const R = []
const M = {} // medidas para la comparativa
const rec = (eng, c, name, ok, info = '') => { R.push({ eng, c, name, ok: !!ok, info }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${c} · ${name}${info ? ' · ' + info : ''}`) }
const wait = (p, ms) => p.waitForTimeout(ms)

// ---- ayudantes en la página ----
const H = () => {
  window.__vis = () => [...document.querySelectorAll('.xt, .ca-tag, .cb-legend:not(.is-reserved)')].filter((e) => { try { return e.matches(':popover-open') } catch { return false } })
  window.__open = () => __vis().map((e) => e.id || e.className)
  window.__rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  window.__contrast = (el) => {
    const fg = __rgb(getComputedStyle(el).color); let bg = null
    for (let a = el; a; a = a.parentElement) { const c = __rgb(getComputedStyle(a).backgroundColor); if (c[3] > 0.95) { bg = c; break } }
    bg = bg || [255, 255, 255]; const L1 = __lum(fg), L2 = __lum(bg); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
  }
  // Recuento de aperturas de superficies visibles (evento toggle de popover)
  window.__toggles = 0
  document.addEventListener('toggle', (e) => { if (e.newState === 'open' && !e.target.classList.contains('g-dialog')) window.__toggles++ }, true)
  window.__ptr = (el, type, extra = {}) => { const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(type, { bubbles: type !== 'pointerenter' && type !== 'pointerleave', cancelable: true, pointerType: 'touch', isPrimary: true, pointerId: 7, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0, ...extra })) }
}
const tab = (eng) => (eng === 'webkit' ? 'Alt+Tab' : 'Tab')
const center = async (loc) => { const b = await loc.boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2] }
async function load(page, url, ctxOpts) {
  await page.goto(url)
  await page.waitForFunction(() => window.__ready)
  await page.evaluate(H)
  await wait(page, 150)
}
const openIds = (page) => page.evaluate(() => __open())
const visRect = (page) => page.evaluate(() => { const e = __vis()[0]; return e ? e.getBoundingClientRect().toJSON() : null })
async function away(page) { await page.mouse.move(2, 790); await wait(page, 700) }

// ------------------------------------------------------------------ base (r01)
async function runBase(page, eng, base) {
  const ck = (n, ok, i) => rec(eng, 'base', n, ok, i)
  await load(page, base + '/r01/index.html')
  // 1. Nombres: el tooltip es el nombre, sin el atajo
  const snap = await page.locator('#toolbar').ariaSnapshot()
  ck('nombres de la barra = texto del tooltip, sin el atajo', /button "Deshacer"\n/.test(snap + '\n') && snap.includes('button "Marcar para revisión"') && !snap.includes('Ctrl'), snap.split('\n').slice(1, 3).join(' | '))
  const undo = page.locator('[data-tool="undo-2"]')
  ck('aria-keyshortcuts en el control', (await undo.getAttribute('aria-keyshortcuts')) === 'Control+Z')
  const ref = await undo.evaluate((b) => { const id = b.getAttribute('aria-labelledby'); const n = document.getElementById(id); return { id, role: n?.closest('[role=tooltip]')?.getAttribute('role'), text: n?.textContent, sibling: b.nextElementSibling?.getAttribute('role') } })
  ck('aria-labelledby → texto dentro del role="tooltip", hermano del control', ref.role === 'tooltip' && ref.text === 'Deshacer' && ref.sibling === 'tooltip', JSON.stringify(ref))
  // 2. kind auto
  const kinds = await page.evaluate(() => {
    const d = (sel) => { const b = document.querySelector(sel); return { lb: b.getAttribute('aria-labelledby'), db: b.getAttribute('aria-describedby'), al: b.getAttribute('aria-label') } }
    const txt = (ids) => (ids || '').split(' ').map((i) => document.getElementById(i)?.textContent).join(' ')
    const p = d('#publish'), s = d('#share-same'), l = d('#policy'), bl = d('#bell')
    return { publish: !p.lb && txt(p.db), share: s.lb && !s.db && txt(s.lb), policy: !l.lb && txt(l.db), bell: txt(bl.lb) }
  })
  ck('auto: botón con texto → descripción', kinds.publish === 'Visible para todo el equipo de la clínica', kinds.publish)
  ck('auto: mismo texto que su aria-label → nombre, sin duplicar', kinds.share === 'Compartir', String(kinds.share))
  ck('auto: enlace con texto → descripción', kinds.policy === 'Se abre en otra pestaña')
  ck('kind="label" explícito gana sobre aria-label', kinds.bell === 'Avisos: 3 sin leer')
  ck('nombre de #publish sigue siendo «Publicar»', (await page.locator('#publish').ariaSnapshot()).includes('"Publicar"'))

  // 3. Retraso de apertura y grupo
  const copy = page.locator('[data-tool="copy"]')
  await copy.hover()
  await wait(page, 200)
  const early = (await openIds(page)).length
  await wait(page, 300)
  const opened = await openIds(page)
  ck('hover: nada a los 200 ms, abierto a los 500 ms', early === 0 && opened.length === 1, `${early} → ${opened}`)
  const t0 = Date.now()
  await page.locator('[data-tool="pencil"]').hover()
  await page.waitForFunction(() => __vis().some((e) => e.textContent.includes('Editar')), null, { timeout: 2000 }).catch(() => {})
  const dt = Date.now() - t0
  const inst = await page.evaluate(() => { const v = __vis(); return { n: v.length, instant: v[0]?.hasAttribute('data-instant') } })
  ck('grupo: el siguiente abre sin espera y sin entrada; uno solo abierto', dt < 200 && inst.n === 1 && inst.instant, `${dt} ms, ${JSON.stringify(inst)}`)
  // 4. El puntero cruza al tooltip (puente) y se queda
  const r = await visRect(page)
  const [bx, by] = await center(page.locator('[data-tool="pencil"]'))
  await page.mouse.move(bx, by)
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2, { steps: 8 })
  await wait(page, 400)
  ck('1.4.13 hoverable: el puntero pasa al tooltip y sigue abierto', (await openIds(page)).length === 1)
  await page.mouse.move(r.x + r.width / 2, r.y - 120, { steps: 2 })
  await wait(page, 300)
  ck('al salir del tooltip se cierra (gracia 100 ms)', (await openIds(page)).length === 0)
  // 5. Esc
  await away(page)
  await copy.hover()
  await wait(page, 500)
  const before = await page.evaluate(() => document.activeElement?.tagName + '#' + (document.activeElement?.id || ''))
  await page.keyboard.press('Escape')
  await wait(page, 100)
  const after = await page.evaluate(() => document.activeElement?.tagName + '#' + (document.activeElement?.id || ''))
  ck('Esc cierra sin mover el foco', (await openIds(page)).length === 0 && before === after, `${before} / ${after}`)
  const [cx, cy] = await center(copy)
  await page.mouse.move(cx + 2, cy + 1)
  await wait(page, 300)
  await page.mouse.move(cx, cy)
  await wait(page, 600)
  ck('tras Esc no reaparece con el puntero quieto en el mismo control', (await openIds(page)).length === 0)
  await away(page)
  await copy.hover()
  await wait(page, 500)
  ck('al volver a entrar, reaparece', (await openIds(page)).length === 1)
  // 6. Pulsar oculta y no reaparece hasta salir
  await page.mouse.down()
  await wait(page, 50)
  const pressed = (await openIds(page)).length
  await page.mouse.up()
  await wait(page, 600)
  ck('pulsar (ratón) lo cierra y no vuelve mientras no salga', pressed === 0 && (await openIds(page)).length === 0)
  // 7. Teclado: Tab entra en la barra (foco por navegación) → al instante; flechas recorren
  await away(page)
  await page.locator('#case-toolbar .lab-how').click({ position: { x: 2, y: 2 } })
  await page.evaluate(() => document.querySelector('#case-toolbar .lab-how').setAttribute('tabindex', '-1'))
  await page.evaluate(() => document.querySelector('#case-toolbar .lab-how').focus())
  await page.keyboard.press(tab(eng))
  await wait(page, 80)
  const own = () => page.evaluate(() => { const a = document.activeElement; const id = a?.getAttribute('aria-labelledby'); return { f: a?.dataset?.tool, mine: id ? document.getElementById(id)?.closest('[role=tooltip]')?.id : null, open: __vis().map((e) => e.id) } })
  const kb = await own()
  ck('Tab: el tooltip del control enfocado (parada única de la barra) aparece al instante', kb.f && kb.open.length === 1 && kb.open[0] === kb.mine, JSON.stringify(kb))
  await page.keyboard.press('ArrowRight')
  await wait(page, 80)
  const kb2 = await own()
  ck('flechas: el siguiente aparece y el anterior se va', kb2.f && kb2.f !== kb.f && kb2.open.length === 1 && kb2.open[0] === kb2.mine, JSON.stringify(kb2))
  await page.keyboard.press('Escape')
  await wait(page, 80)
  ck('Esc con foco de teclado: cierra y el foco se queda', (await openIds(page)).length === 0 && (await page.evaluate(() => document.activeElement?.dataset?.tool)) === kb2.f)
  await page.keyboard.press('Shift+' + tab(eng))
  await wait(page, 100)
  // 8. Clic enfoca sin mostrar (foco por puntero)
  await away(page)
  await page.locator('#save').click()
  await page.mouse.move(2, 790)
  await wait(page, 500)
  ck('foco por clic: no aparece', (await openIds(page)).length === 0)
  // 9. Desbordes y volteo
  await page.locator('#top-search').hover()
  await wait(page, 500)
  const flip = await page.evaluate(() => { const e = __vis()[0]; return e && { side: e.dataset.side, top: e.getBoundingClientRect().top } })
  ck('sin sitio arriba (cabecera): se abre abajo', flip && flip.side === 'bottom', JSON.stringify(flip))
  await away(page)
  await page.locator('#edge-start').hover()
  await wait(page, 500)
  const es = await page.evaluate(() => { const e = __vis()[0]; const r = e.getBoundingClientRect(); return { l: r.left, w: r.width, lines: Math.round(r.height / parseFloat(getComputedStyle(e).lineHeight)) } })
  ck('texto largo: ≤ 280px, varias líneas, dentro del visor (≥ 8px)', es.w <= 281 && es.lines >= 2 && es.l >= 7.5, JSON.stringify(es))
  await away(page)
  await page.locator('#edge-end').hover()
  await wait(page, 500)
  const ee = await page.evaluate(() => { const e = __vis()[0]; const r = e.getBoundingClientRect(); const b = document.querySelector('#edge-end').getBoundingClientRect(); return { side: e.dataset.side, right: r.right, vw: document.documentElement.clientWidth, tipR: r.right, btnL: b.left } })
  ck('placement="left" (inicio): a la izquierda del control en LTR', ee.side === 'left' && ee.tipR <= ee.btnL, JSON.stringify(ee))
  // 10. Contenedor con desplazamiento: sigue y se cierra al salir el control
  await away(page)
  await page.locator('#scroller').scrollIntoViewIfNeeded()
  // Con foco de teclado (con el puntero, el contenido se va de debajo del puntero y el tooltip se cierra por hover: correcto)
  await page.locator('#edge-end').focus()
  // Firefox mete el contenedor con desplazamiento en el orden de Tab: se avanza hasta el botón
  for (let i = 0; i < 3 && (await page.evaluate(() => document.activeElement?.id)) !== 'in-scroll'; i++) await page.keyboard.press(tab(eng))
  await wait(page, 100)
  const y0 = (await visRect(page))?.y
  await page.locator('#scroller').evaluate((s) => { s.scrollTop = 30 })
  await wait(page, 120)
  const y1 = (await visRect(page))?.y
  ck('desplazamiento: el tooltip sigue a su control', y0 != null && y1 != null && Math.abs(y0 - 30 - y1) <= 2, `${y0} → ${y1}`)
  await page.locator('#scroller').evaluate((s) => { s.scrollTop = 200 })
  await wait(page, 150)
  ck('desplazamiento: el control sale del contenedor y el tooltip se cierra, sin mover el foco', (await openIds(page)).length === 0 && (await page.evaluate(() => document.activeElement?.id)) === 'in-scroll')
  await page.locator('#scroller').evaluate((s) => { s.scrollTop = 0 })
  // 11. Estados
  await away(page)
  await page.locator('#disabled-native').hover({ force: true })
  await wait(page, 500)
  ck('disabled nativo: no aparece', (await openIds(page)).length === 0)
  await away(page)
  await page.locator('#disabled-aria').hover()
  await wait(page, 500)
  const da = await page.evaluate(() => ({ open: __vis().map((e) => e.textContent), desc: document.getElementById(document.querySelector('#disabled-aria').getAttribute('aria-describedby'))?.textContent }))
  ck('aria-disabled: aparece y describe el motivo', da.open.length === 1 && da.desc === 'Necesitas permiso de edición', JSON.stringify(da))
  await away(page)
  await page.locator('#disclosure').click()
  await page.mouse.move(2, 790)
  await wait(page, 300)
  await page.locator('#disclosure').hover()
  await wait(page, 500)
  ck('aria-expanded="true": no tapa su menú', (await page.locator('#disclosure').getAttribute('aria-expanded')) === 'true' && (await openIds(page)).length === 0)
  await page.locator('#disclosure').click()
  // GHelper: el tooltip nombra su disparador y no aparece con el GHelper abierto
  await away(page)
  const hb = page.locator('#case-states .g-helper__trigger')
  await hb.hover()
  await wait(page, 500)
  const h1 = (await openIds(page)).length
  await hb.click()
  await page.mouse.move(2, 790)
  await wait(page, 300)
  await hb.hover()
  await wait(page, 500)
  const h2 = await page.evaluate(() => ({ exp: document.querySelector('#case-states .g-helper__trigger').getAttribute('aria-expanded'), tips: __vis().length, lbOn: document.querySelector('#case-states .g-helper').getAttribute('aria-labelledby') ? 'raíz' : document.querySelector('#case-states .g-helper__trigger').getAttribute('aria-labelledby') ? 'botón' : 'ninguno' }))
  ck('GHelper: el tooltip nombra el disparador y calla con el GHelper abierto', h1 === 1 && h2.exp === 'true' && h2.tips === 0, JSON.stringify({ h1, ...h2 }))
  M.helperAria = h2.lbOn
  await page.keyboard.press('Escape')
  await wait(page, 200)
  // 12. Táctil: pulsación larga (eventos de puntero sintéticos, pointerType touch)
  await away(page)
  const touch = await page.evaluate(async () => {
    const b = document.querySelector('#touch-add'); const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    window.__touchClicks = 0
    __ptr(b, 'pointerdown'); await sleep(250); const at250 = __vis().length
    await sleep(400); const at650 = __vis().map((e) => e.textContent)
    __ptr(b, 'pointerup'); b.click(); await sleep(50)
    const clicks = window.__touchClicks; const still = __vis().length
    await sleep(1700); const gone = __vis().length
    __ptr(b, 'pointerdown'); await sleep(100); __ptr(b, 'pointerup'); b.click(); await sleep(600)
    return { at250, at650, clicks, still, gone, tapClicks: window.__touchClicks, tapOpen: __vis().length }
  })
  ck('táctil: pulsación larga muestra el nombre (nada a 250 ms)', touch.at250 === 0 && touch.at650.length === 1 && touch.at650[0] === 'Nueva nota', JSON.stringify(touch))
  ck('táctil: el clic que sigue a la pulsación larga no activa', touch.clicks === 0)
  ck('táctil: queda al soltar y se va tras 1,5 s', touch.still === 1 && touch.gone === 0)
  ck('táctil: un toque normal activa y no muestra nada', touch.tapClicks === 1 && touch.tapOpen === 0)
  // 13. Diálogo modal: foco por programa sin tooltip; Esc por capas
  await page.locator('#open-dialog').focus()
  await page.keyboard.press('Enter')
  await wait(page, 500)
  const d1 = await page.evaluate(() => ({ dlg: !!document.querySelector('dialog[open]'), f: document.activeElement?.id, open: __vis().length }))
  ck('diálogo abierto con Intro: el foco va al primer control y su tooltip NO aparece', d1.dlg && d1.f === 'dlg-attach' && d1.open === 0, JSON.stringify(d1))
  await page.keyboard.press(tab(eng))
  await wait(page, 100)
  const d2 = await page.evaluate(() => ({ f: document.activeElement?.id, open: __vis().map((e) => e.textContent), inDialog: __vis()[0]?.closest('dialog') != null }))
  ck('Tab dentro del diálogo: aparece, dentro del <dialog>', d2.f === 'dlg-mail' && d2.open[0] === 'Enviar por correo' && d2.inDialog, JSON.stringify(d2))
  await page.keyboard.press('Escape')
  await wait(page, 200)
  const d3 = await page.evaluate(() => ({ dlg: !!document.querySelector('dialog[open]'), open: __vis().length, f: document.activeElement?.id }))
  ck('primer Esc: cierra el tooltip y el diálogo sigue abierto', d3.dlg && d3.open === 0 && d3.f === 'dlg-mail', JSON.stringify(d3))
  await page.keyboard.press('Escape')
  await wait(page, 400)
  ck('segundo Esc: cierra el diálogo', !(await page.evaluate(() => !!document.querySelector('dialog[open]'))))
  // 14. Contraste y tamaño
  await away(page)
  await copy.hover()
  await wait(page, 500)
  const cs = await page.evaluate(() => { const e = __vis()[0].querySelector('.xt__text'); return { c: __contrast(e), fs: parseFloat(getComputedStyle(e).fontSize) } })
  ck('contraste ≥ 4.5:1 y texto ≥ 12px', cs.c >= 4.5 && cs.fs >= 12, `${cs.c.toFixed(2)}:1, ${cs.fs}px`)
  // 15. Movimiento reducido: solo opacidad
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const tr = await page.evaluate(() => getComputedStyle(document.querySelector('.xt')).transitionProperty)
  ck('movimiento reducido: solo opacidad (y overlay/display)', !/transform|translate|scale|top|left/.test(tr), tr)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  // 16. RTL
  await load(page, base + '/r01/index.html?dir=rtl')
  await page.locator('#edge-end').hover()
  await wait(page, 500)
  const rtl = await page.evaluate(() => { const e = __vis()[0]; const r = e.getBoundingClientRect(); const b = document.querySelector('#edge-end').getBoundingClientRect(); return { side: e.dataset.side, tipL: r.left, btnR: b.right } })
  ck('RTL: placement="left" es el inicio de línea (a la derecha)', rtl.side === 'left' && rtl.tipL >= rtl.btnR, JSON.stringify(rtl))
  const errs = await page.evaluate(() => 0)
  return errs
}

// ------------------------------------------------------------------ conceptos (r02)
async function concept(page, eng, base, c) {
  const ck = (n, ok, i) => rec(eng, c, n, ok, i)
  await load(page, base + '/r02/index.html?c=' + c)
  const snap = await page.locator('#toolbar').ariaSnapshot()
  ck('misma semántica: nombres = texto, sin atajo', snap.includes('button "Deshacer"') && snap.includes('button "Eliminar"') && !snap.includes('Ctrl'))
  const desc = await page.evaluate(() => { const b = document.querySelector('[data-tool="trash"]'); return (b.getAttribute('aria-describedby') || '').split(' ').map((i) => document.getElementById(i)?.textContent).join('|') })
  ck('la descripción (detail) está en el DOM desde el montaje', desc === 'Se puede deshacer durante 10 segundos', desc)
  // Barrido: 8 controles, 120 ms cada uno tras el primero
  const tools = ['undo-2', 'redo-2', 'copy', 'pencil', 'tag', 'flag', 'share-2', 'trash']
  await page.locator('[data-tool="undo-2"]').hover()
  await wait(page, 450)
  await page.evaluate(() => { window.__toggles = 0 })
  const pos = []
  for (const t of tools.slice(1)) {
    await page.locator(`[data-tool="${t}"]`).hover()
    await wait(page, 120)
    pos.push(await page.evaluate(() => { const e = __vis()[0]; const n = e && (e.querySelector('.xt__text, .cb__name')); const r = n && n.getBoundingClientRect(); return r ? { x: Math.round(r.left), y: Math.round(r.top), t: n.textContent } : null }))
  }
  await wait(page, 300)
  const toggles = await page.evaluate(() => window.__toggles)
  const xs = pos.filter(Boolean)
  const moves = xs.slice(1).filter((p, i) => p.x !== xs[i].x || p.y !== xs[i].y).length
  const ok = xs.length === 7 && xs[6].t === 'Eliminar'
  const btn = await page.locator('[data-tool="trash"]').boundingBox()
  const last = await page.evaluate(() => { const e = __vis()[0]; const n = e?.querySelector('.xt__text, .cb__name'); return n ? n.getBoundingClientRect().toJSON() : null })
  const eye = last ? Math.round(Math.hypot(last.x - (btn.x + btn.width / 2), last.y + last.height / 2 - (btn.y + btn.height / 2))) : null
  M[c] = { ...(M[c] || {}), [eng]: { apariciones: toggles + 1, cambiosDePosicion: moves, distanciaOjo: eye } }
  ck('barrido de 8: llega al último y uno solo visible', ok && (await openIds(page)).length === 1, `apariciones ${toggles + 1}, cambios de posición del texto ${moves}, ojo ${eye}px`)
  // Esc en cada concepto
  await page.keyboard.press('Escape')
  await wait(page, 120)
  ck('Esc cierra (también la superficie compartida)', (await openIds(page)).length === 0)
  await away(page)
  // Hoverable: el puntero pasa del control a la superficie visible
  await page.locator('[data-tool="trash"]').hover()
  await wait(page, 500)
  const vr = await visRect(page)
  const [fx, fy] = await center(page.locator('[data-tool="trash"]'))
  await page.mouse.move(fx, fy)
  // En línea recta hacia la superficie (en diagonal se pasa por los vecinos, que toman el relevo: es lo esperado en un grupo)
  const tx = Math.min(Math.max(fx, vr.x + 4), vr.x + vr.width - 4)
  await page.mouse.move(tx, vr.y + vr.height / 2, { steps: 10 })
  await wait(page, 400)
  ck('1.4.13: el puntero cruza a la superficie y sigue abierta', (await openIds(page)).length === 1)
  // Contraste de nombre, detalle y atajo
  const con = await page.evaluate(() => { const e = __vis()[0]; return [...e.querySelectorAll('.xt__text, .xt__detail, .cb__name, .cb__detail, .xt__kbd')].filter((n) => n.getBoundingClientRect().width > 0 && !n.hidden && n.textContent).map((n) => ({ c: __contrast(n), fs: parseFloat(getComputedStyle(n).fontSize) })) })
  const minC = Math.min(...con.map((x) => x.c)), minF = Math.min(...con.map((x) => x.fs))
  ck('contraste ≥ 4.5:1 y texto ≥ 12px en nombre, descripción y atajo visibles', con.length >= 3 && minC >= 4.5 && minF >= 12, `${con.length} textos, ${minC.toFixed(2)}:1, ${minF}px`)
  await away(page)

  if (c === 'A') {
    await page.locator('[data-tool="flag"]').hover()
    await wait(page, 500)
    const g = await page.evaluate(() => { const t = document.querySelector('#toolbar ~ .ca-tag') || document.querySelector('.ca-tag'); const tab = t.querySelector('.ca__tab').getBoundingClientRect(); const b = document.querySelector('[data-tool="flag"]').getBoundingClientRect(); return { dTop: Math.abs(tab.top - b.bottom), dW: Math.abs(tab.width - b.width), dL: Math.abs(tab.left - b.left) } })
    ck('A: la pestaña toca el control y mide lo que él', g.dTop <= 1 && g.dW <= 0.5 && g.dL <= 0.5, JSON.stringify(g))
    // viaje: la misma etiqueta no se cierra entre controles
    await page.evaluate(() => { window.__toggles = 0 })
    await page.locator('[data-tool="share-2"]').hover()
    await wait(page, 60)
    const mid = await page.evaluate(() => { const t = document.querySelector('.ca-tag'); return { travel: t.hasAttribute('data-travel'), tp: getComputedStyle(t).transitionProperty } })
    await wait(page, 300)
    const g2 = await page.evaluate(() => { const t = document.querySelector('.ca-tag'); const tab = t.querySelector('.ca__tab').getBoundingClientRect(); const b = document.querySelector('[data-tool="share-2"]').getBoundingClientRect(); return { dL: Math.abs(tab.left - b.left), toggles: window.__toggles } })
    ck('A: viaja al siguiente sin cerrarse y la pestaña llega a su sitio', mid.travel && /translate/.test(mid.tp) && g2.toggles === 0 && g2.dL <= 0.5, JSON.stringify({ ...mid, ...g2 }))
    await away(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.locator('[data-tool="copy"]').hover()
    await wait(page, 500)
    await page.locator('[data-tool="pencil"]').hover()
    await wait(page, 30)
    const rm = await page.evaluate(() => getComputedStyle(document.querySelector('.ca-tag')).transitionProperty)
    ck('A con movimiento reducido: no viaja (salta)', !/translate|inline-size|width/.test(rm), rm)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await away(page)
    // riel en RTL: la etiqueta al final de línea (izquierda) y la pestaña pegada al control
    await load(page, base + '/r02/index.html?c=A&dir=rtl')
    await page.locator('[data-rail="inbox"]').hover()
    await wait(page, 500)
    const rr = await page.evaluate(() => { const t = [...document.querySelectorAll('.ca-tag')].find((e) => e.matches(':popover-open')); const tab = t.querySelector('.ca__tab').getBoundingClientRect(); const b = document.querySelector('[data-rail="inbox"]').getBoundingClientRect(); return { side: t.dataset.side, tagR: t.getBoundingClientRect().right, btnL: b.left, gap: Math.abs(tab.right - b.left) } })
    ck('A en RTL (riel): a la izquierda y la pestaña pegada', rr.side === 'right' && rr.tagR <= rr.btnL + 1 && rr.gap <= 1, JSON.stringify(rr))
  }
  if (c === 'B') {
    await page.locator('[data-tool="undo-2"]').hover()
    await wait(page, 500)
    const b1 = await page.evaluate(() => { const L = document.querySelector('.cb-legend').getBoundingClientRect(); const G = document.querySelector('#toolbar').getBoundingClientRect(); const m = document.querySelector('.cb-legend .cb__marker').getBoundingClientRect(); const b = document.querySelector('[data-tool="undo-2"]').getBoundingClientRect(); return { overlap: !(L.top >= G.bottom || L.bottom <= G.top), dW: Math.abs(L.width - G.width), mL: Math.abs(m.left - b.left), mW: Math.abs(m.width - b.width) } })
    ck('B: la leyenda no tapa la barra y mide lo que ella', !b1.overlap && b1.dW <= 1, JSON.stringify(b1))
    ck('B: la marca señala el control', b1.mL <= 0.5 && b1.mW <= 0.5)
    ck('B: el texto no cambia de sitio durante el barrido', M.B[eng].cambiosDePosicion === 0 && M.B[eng].apariciones === 1, JSON.stringify(M.B[eng]))
    await away(page)
    await load(page, base + '/r02/index.html?c=B&reserved=1')
    const yb = await page.locator('#under-toolbar').boundingBox()
    await page.locator('[data-tool="flag"]').hover()
    await wait(page, 500)
    const ya = await page.locator('#under-toolbar').boundingBox()
    const rs = await page.evaluate(() => ({ pop: document.querySelector('.cb-legend').hasAttribute('popover'), txt: document.querySelector('.cb-legend .cb__name').textContent, any: __vis().length }))
    ck('B reservada: en el flujo, sin capa, nada se mueve (Δ0)', !rs.pop && rs.txt === 'Marcar para revisión' && rs.any === 0 && Math.abs(ya.y - yb.y) < 0.5, JSON.stringify({ ...rs, dy: ya.y - yb.y }))
  }
  if (c === 'C') {
    await page.locator('[data-tool="flag"]').hover()
    await wait(page, 450)
    const s1 = await page.evaluate(() => { const e = __vis()[0]; return { h: e.querySelector('.cc-more').getBoundingClientRect().height, bottom: e.getBoundingClientRect().bottom, side: e.dataset.side } })
    await wait(page, 900)
    const s2 = await page.evaluate(() => { const e = __vis()[0]; return { h: e.querySelector('.cc-more').getBoundingClientRect().height, bottom: e.getBoundingClientRect().bottom, dwell: e.hasAttribute('data-dwell') } })
    ck('C: primero solo el nombre; quieto, crece con la descripción', s1.h < 1 && s2.dwell && s2.h > 10, JSON.stringify({ s1, s2 }))
    ck('C: crece hacia fuera del control (el borde cercano no se mueve)', s1.side !== 'top' || Math.abs(s1.bottom - s2.bottom) <= 1, `${s1.side} ${s1.bottom} → ${s2.bottom}`)
    await away(page)
    // Mover el puntero sin parar no lo hace crecer
    const [x0, y0] = await center(page.locator('[data-tool="copy"]'))
    await page.mouse.move(x0, y0)
    let grew = false
    for (let i = 0; i < 12; i++) { await page.mouse.move(x0 + (i % 2 ? 3 : -3), y0); await wait(page, 120); grew = grew || (await page.evaluate(() => !!__vis()[0]?.hasAttribute('data-dwell'))) }
    ck('C: con el puntero en movimiento no crece (solo al detenerse)', !grew && (await openIds(page)).length === 1)
    await away(page)
    const lin = await page.evaluate(async () => {
      const b = document.querySelector('[data-tool="flag"]'); const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
      __ptr(b, 'pointerdown'); await sleep(650); const grown = __vis()[0]?.hasAttribute('data-dwell')
      __ptr(b, 'pointerup'); const t0 = performance.now()
      while (__vis().length && performance.now() - t0 < 7000) await sleep(100)
      return { grown, ms: Math.round(performance.now() - t0) }
    })
    ck('C táctil: todo de una vez y visible según su texto (> 1,5 s)', lin.grown && lin.ms > 2500 && lin.ms < 6200, JSON.stringify(lin))
  }
  return 0
}

const { server, base } = await serve()
try {
  for (const eng of ENGINES) {
    const browser = await pw[eng].launch()
    for (const part of PARTS) {
      const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } })
      const page = await ctx.newPage()
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      const expected = []
      page.on('console', (m) => {
        if (m.type() === 'warning' && /disabled nativo/.test(m.text())) { expected.push(m.text()); return }
        if (m.type() === 'error' || (m.type() === 'warning' && /XTooltip|Grana/.test(m.text()))) errors.push(m.text())
      })
      try { part === "base" ? await runBase(page, eng, base) : await concept(page, eng, base, part) } catch (e) { rec(eng, part, 'excepción', false, e.message.split('\n')[0]) }
      rec(eng, part, 'sin errores ni avisos en consola (salvo el esperado)', errors.length === 0, errors.slice(0, 2).join(' | '))
      if (part === 'base') rec(eng, part, 'aviso en desarrollo: tooltip en un control disabled nativo', expected.length >= 1)
      await ctx.close()
    }
    await browser.close()
  }
} finally { server.close() }
const ok = R.filter((r) => r.ok).length
console.log(`\n${ok}/${R.length} comprobaciones en ${ENGINES.join(', ')}`)
if (M.helperAria) console.log(`GHelper con tooltip: aria-labelledby cae en ${M.helperAria}`)
console.log('Comparativa del barrido (8 controles, 120 ms cada uno):')
for (const [c, byEng] of Object.entries(M).filter(([k]) => k !== 'helperAria')) console.log(`  ${c}: ${Object.entries(byEng).map(([e, m]) => `${e} apariciones ${m.apariciones}, cambios de posición ${m.cambiosDePosicion}, ojo ${m.distanciaOjo}px`).join(' · ')}`)
process.exit(ok === R.length ? 0 : 1)
