// Verificación de la etiqueta (kiwi r01): la base y los conceptos A, B y C, en Chromium, Firefox y WebKit.
// Ejecutar: node design/lab/chip/r01/verificar.mjs   (solo puerto 4213; ENGINES=chromium,firefox,webkit; VERBOSE=1)
// Requiere packages/vue/dist (npm run build). Solo lee; no toca packages/.
import { serve, pw } from './serve.mjs'

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok, info }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info ? ' · ' + info : ''}`) }
const { server, base } = await serve()

const H = () => {
  window.__rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  window.__ratio = (a, b) => { const L1 = __lum(a), L2 = __lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05) }
  window.__bg = (el) => { for (let a = el; a; a = a.parentElement) { const c = __rgb(getComputedStyle(a).backgroundColor); if (c[3] > 0.95) return c } return [255, 255, 255, 1] }
  window.__contrast = (el, prop = 'color') => __ratio(__rgb(getComputedStyle(el)[prop]), __bg(el))
}
async function open(b, q = '', opts = {}) {
  const { vw = 1100, vh = 900, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(base + '/index.html' + q)
  await p.waitForFunction(() => window.__ready)
  await p.evaluate(H)
  await p.evaluate(() => document.fonts.ready)
  p.__errs = errs
  return p
}
const act = (p) => p.evaluate(() => { const a = document.activeElement; return a ? (a.getAttribute('aria-label') || a.id || a.textContent.trim()) : null })
const live = (p) => p.waitForTimeout(120).then(() => p.evaluate(() => document.getElementById('t-live')?.textContent || ''))
const box = (p, sel) => p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right } }, sel)

async function run(eng) {
  const b = await pw[eng].launch()
  const ck = (part) => (n, ok, i) => rec(eng, part, n, ok, i)
  // ================= BASE =================
  let c = ck('base'), p = await open(b)
  // Semántica por caso
  const sem = await p.evaluate(() => {
    const s = document.querySelector('#b-static .t-list'), t = document.querySelector('#b-toggle .t-list')
    return {
      staticRole: s.tagName + '/' + s.getAttribute('role') + '/' + s.getAttribute('aria-label'),
      staticFocusable: [...document.querySelectorAll('#b-static .t-tag')].some((x) => x.matches('[tabindex]') || x.querySelector('a,button,[tabindex]')),
      links: [...document.querySelectorAll('#b-link a.t-body')].map((a) => a.getAttribute('href')).length,
      toggleRole: t.tagName + '/' + t.getAttribute('role') + '/' + t.getAttribute('aria-label'),
      pressed: [...document.querySelectorAll('#b-toggle [aria-pressed]')].map((x) => x.getAttribute('aria-pressed')).join(','),
      disabled: document.querySelector('#b-toggle [data-id="t4"] button').disabled,
      removeNames: [...document.querySelectorAll('#b-remove .t-remove')].map((x) => x.getAttribute('aria-label')),
      checkHidden: document.querySelector('#b-toggle .t-check').getAttribute('aria-hidden')
    }
  })
  c('estática: <ul role=list> con nombre, sin nada enfocable', sem.staticRole === 'UL/list/Etiquetas del expediente' && !sem.staticFocusable, sem.staticRole)
  c('enlace: tres <a href>', sem.links === 3)
  c('alternar: <div role=group> con nombre; aria-pressed true,false,false,false; deshabilitado nativo', sem.toggleRole === 'DIV/group/Filtrar por estado' && sem.pressed === 'true,false,false,false' && sem.disabled, sem.toggleRole + ' ' + sem.pressed)
  c('quitar: cada botón con nombre propio «Quitar X» (únicos)', sem.removeNames.length === 4 && new Set(sem.removeNames).size === 4 && sem.removeNames[0] === 'Quitar Pendiente', sem.removeNames.join(' | '))
  c('la marca check del pulsado es decorativa (aria-hidden)', sem.checkHidden === 'true')
  const snap = await p.locator('#b-remove').ariaSnapshot()
  c('árbol: lista «Filtros aplicados» con 4 elementos y botones «Quitar …»', /list "Filtros aplicados"/.test(snap) && (snap.match(/listitem/g) || []).length === 4 && /button "Quitar Alta prioridad"/.test(snap), snap.split('\n').slice(0, 3).join(' | '))
  const snapT = await p.locator('#b-toggle').ariaSnapshot()
  c('árbol: grupo con botones de alternar (pressed)', /group "Filtrar por estado"/.test(snapT) && /button "Pendientes" \[pressed\]/.test(snapT), snapT.split('\n').slice(0, 2).join(' | '))
  // Alternar con ratón, Espacio y Enter
  await p.click('#b-toggle [data-id="t2"] button')
  c('clic alterna aria-pressed y la clase', await p.getAttribute('#b-toggle [data-id="t2"] button', 'aria-pressed') === 'true')
  await p.focus('#b-toggle [data-id="t2"] button'); await p.keyboard.press('Space')
  c('Espacio alterna', await p.getAttribute('#b-toggle [data-id="t2"] button', 'aria-pressed') === 'false')
  await p.keyboard.press('Enter')
  c('Enter alterna', await p.getAttribute('#b-toggle [data-id="t2"] button', 'aria-pressed') === 'true')
  // Contraste del pulsado y del contorno sin pulsar
  const tc = await p.evaluate(() => {
    const on = document.querySelector('#b-toggle [data-id="t1"] .t-tag, #b-toggle [data-id="t1"]').closest('.t-item').querySelector('.t-tag')
    const off = document.querySelector('#b-toggle [data-id="t3"] .t-tag')
    const edge = (el) => { const m = getComputedStyle(el).boxShadow.match(/rgba?\([^)]*\)/); return __ratio(__rgb(m[0]), __bg(el.parentElement)) }
    return { onText: __ratio(__rgb(getComputedStyle(on).color), __rgb(getComputedStyle(on).backgroundColor)), offEdge: edge(off), offText: __contrast(off) }
  })
  c('alternar: texto pulsado ≥ 4,5:1; contorno sin pulsar ≥ 3:1 (border-control)', tc.onText >= 4.5 && tc.offEdge >= 3 && tc.offText >= 4.5, JSON.stringify(tc, (k, v) => typeof v === 'number' ? +v.toFixed(2) : v))
  // Categorías: contraste de cada una (on-cat-k-soft sobre cat-k-soft)
  const cats = await p.evaluate(() => [...document.querySelectorAll('#b-static-cat .t-tag')].map((t) => ({ cat: t.dataset.cat, r: __ratio(__rgb(getComputedStyle(t).color), __rgb(getComputedStyle(t).backgroundColor)) })))
  c('categorías: texto ≥ 4,5:1 en las cinco', cats.every((x) => x.cat && x.r >= 4.5), cats.map((x) => `${x.cat}:${x.r.toFixed(2)}`).join(' '))
  // Hash = el de GAvatar (vectores del contrato, n = 8)
  const hv = await p.evaluate(() => [...document.querySelectorAll('#hash-table tbody tr')].every((tr) => tr.children[2].textContent === tr.children[4].textContent))
  c('hash: vectores del contrato de GAvatar (n = 8) idénticos', hv)
  // Quitar: foco a la siguiente, anuncio
  await p.click('#b-remove [data-id="r1"] .t-remove')
  c('quitar la 2.ª: foco al «Quitar» de la siguiente', await act(p) === 'Quitar Ana Martínez', await act(p))
  c('anuncio cortés «Alta prioridad quitada»', (await live(p)) === 'Alta prioridad quitada', await live(p))
  c('canal vivo: aria-live=polite, aria-atomic', await p.evaluate(() => { const l = document.getElementById('t-live'); return l.getAttribute('aria-live') === 'polite' && l.getAttribute('aria-atomic') === 'true' }))
  await p.focus('#b-remove [data-id="r3"] .t-remove'); await p.keyboard.press('Delete')
  c('Supr sobre la última: foco a la anterior', await act(p) === 'Quitar Ana Martínez', await act(p))
  await p.keyboard.press('Backspace')
  c('Retroceso también quita; foco a la que queda', await act(p) === 'Quitar Pendiente', await act(p))
  await p.keyboard.press('Delete')
  c('sin etiquetas: foco a «Agregar filtro» (emptyFocus)', await p.evaluate(() => document.activeElement.id) === 'b-add')
  // Quitar todas y deshacer en su sitio
  const p2 = await open(b, '#A')
  await p2.click('#b-remove .t-clear')
  c('«Quitar todas»: el botón pasa a «Deshacer» en su sitio con el foco', await p2.evaluate(() => document.activeElement.dataset.part) === 'undo-all' && (await live(p2)) === 'Se quitaron 4 etiquetas')
  await p2.keyboard.press('Enter')
  c('deshacer todas: vuelven las 4 en su orden, foco a «Quitar todas»', await p2.evaluate(() => [...document.querySelectorAll('#b-remove .t-text')].map((x) => x.textContent).join(',')) === 'Pendiente,Alta prioridad,Ana Martínez,Este mes' && await p2.evaluate(() => document.activeElement.dataset.part) === 'clear')
  await p2.click('#b-remove .t-clear'); await p2.focus('#b-add'); await p2.waitForTimeout(50)
  c('el «Deshacer» de «Quitar todas» se va al salir del grupo', await p2.evaluate(() => !document.querySelector('#b-remove [data-part="undo-all"]')))
  await p2.context().close()
  // Tope «Ver N más»
  const more = await p.evaluate(() => { const m = document.querySelector('#b-limit .t-more'); return { t: m.textContent, exp: m.getAttribute('aria-expanded'), ctl: !!document.getElementById(m.getAttribute('aria-controls')), hidden: document.querySelectorAll('#b-limit .t-item[hidden]').length } })
  c('tope: «Ver 3 más», aria-expanded=false, aria-controls válido, 3 ocultas', more.t === 'Ver 3 más' && more.exp === 'false' && more.ctl && more.hidden === 3, JSON.stringify(more))
  await p.click('#b-limit .t-more')
  c('desplegar: aria-expanded=true, ninguna oculta, foco sigue en el botón', await p.evaluate(() => { const m = document.querySelector('#b-limit .t-more'); return m.getAttribute('aria-expanded') === 'true' && m === document.activeElement && !document.querySelector('#b-limit .t-item[hidden]') }))
  // Tamaños: blanco ≥ 24 (md y sm); md alto 32, sm 24
  const sz = await p.evaluate(() => ({ x: [...document.querySelectorAll('#b-limit .t-remove, #b-sm .t-remove')].map((x) => { const r = x.getBoundingClientRect(); return Math.min(r.width, r.height) }), md: document.querySelector('#b-limit .t-tag').getBoundingClientRect().height, sm: document.querySelector('#b-sm .t-tag').getBoundingClientRect().height, smToggle: document.querySelector('#b-sm .t-body--toggle').getBoundingClientRect().height }))
  c('«Quitar» ≥ 24 × 24; alto md 32, sm 24; alternar sm ≥ 24', sz.x.every((v) => v >= 24) && Math.round(sz.md) === 32 && Math.round(sz.sm) === 24 && sz.smToggle >= 24, JSON.stringify(sz))
  // Recorte: interactivas recortan con pista; estáticas se parten
  const cut = await p.evaluate(() => { const t = document.querySelector('#b-long [data-id="g1"] .t-text'), s = document.querySelector('#b-static [data-id="s3"] .t-text'); return { inter: t.scrollWidth > t.clientWidth, full: document.querySelector('#b-long [data-id="g1"] .t-remove').getAttribute('aria-label'), staticCut: s.scrollWidth > s.clientWidth + 1, staticLines: Math.round(s.getBoundingClientRect().height / parseFloat(getComputedStyle(s).lineHeight)) } })
  c('recorte: la interactiva se recorta y su nombre es el texto entero', cut.inter && cut.full === 'Quitar E11.9 Diabetes mellitus tipo 2 sin complicaciones', cut.full)
  c('recorte: la estática no se recorta, se parte (2 líneas)', !cut.staticCut && cut.staticLines === 2, JSON.stringify(cut))
  await p.focus('#b-long [data-id="g2"] a')
  const tipA = await p.evaluate(() => { const t = document.querySelector('.t-tip'); return t && !t.hidden ? { text: t.textContent, hidden: t.getAttribute('aria-hidden') } : null })
  c('pista al enfocar un enlace recortado: texto entero, aria-hidden', tipA && tipA.text === 'Hipertensión arterial esencial (primaria) controlada' && tipA.hidden === 'true', JSON.stringify(tipA))
  await p.focus('#b-sm [data-id="x1"] .t-remove')
  c('pista de un botón de solo icono: su nombre', await p.evaluate(() => { const t = document.querySelector('.t-tip'); return t && !t.hidden && t.textContent === 'Quitar Borrador' }))
  await p.focus('#b-sm [data-id="x3"] button')
  c('sin recorte, sin pista', await p.evaluate(() => document.querySelector('.t-tip').hidden))
  // Avatar decorativo dentro de la etiqueta
  c('avatar xs decorativo (aria-hidden), 20px', await p.evaluate(() => { const a = document.querySelector('#b-people .g-avatar'); return a.getAttribute('aria-hidden') === 'true' && Math.round(a.getBoundingClientRect().width) === 20 }))
  // Foco visible
  // Foco visible: página nueva sin interacción de puntero (WebKit no lleva enlaces ni botones en el orden de Tab por defecto)
  {
    const pf = await open(b)
    const fv = []
    for (const sel of ['#b-link a', '#b-toggle [data-id="t3"] button', '#b-remove [data-id="r0"] .t-remove']) { await pf.focus(sel); fv.push(await pf.evaluate(() => parseFloat(getComputedStyle(document.activeElement).outlineWidth) >= 2 && getComputedStyle(document.activeElement).outlineStyle !== 'none')) }
    c('foco visible (outline ≥ 2px) en enlace, alternar y «Quitar»', fv.every(Boolean), JSON.stringify(fv))
    await pf.context().close()
  }
  // Foco tras quitar cuando la vecina no tiene «Quitar»: a su control (alternar); sin ninguna, al propio grupo, nunca a <body>
  await p.click('#b-sm [data-id="x1"] .t-remove')
  c('la siguiente sin «Quitar» (estática) se salta: foco al alternar «Revisar»', await act(p) === 'Revisar', await act(p))
  for (const id of ['p1', 'p2', 'p3']) await p.click(`#b-people [data-id="${id}"] .t-remove`)
  c('sin emptyFocus y sin etiquetas: foco al grupo (tabindex=-1)', await p.evaluate(() => document.activeElement.id === 'b-people' && document.activeElement.tabIndex === -1), await act(p))
  c('consola sin errores ni avisos', !p.__errs.length, p.__errs.join(' | '))
  await p.context().close()

  // Táctil: área de 44 en «Quitar» sin cambiar el dibujo (Chromium y WebKit emulan pointer: coarse con hasTouch)
  if (eng !== 'firefox') {
    p = await open(b, '', { hasTouch: true, isMobile: eng === 'chromium', vw: 390, vh: 800 })
    const t = await p.evaluate(() => {
      const x = document.querySelector('#b-sm [data-id="x1"] .t-remove'); x.scrollIntoView({ block: 'center' }); const r = x.getBoundingClientRect()
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2
      return { coarse: matchMedia('(pointer: coarse)').matches, w: r.width, hit: [[0, -21], [0, 21]].every(([dx, dy]) => document.elementFromPoint(cx + dx, cy + dy)?.closest('.t-remove') === x) }
    })
    c('táctil: pointer coarse, dibujo 24 y blanco de 44 de alto', !t.coarse || (t.w === 24 && t.hit), JSON.stringify(t))
    await p.context().close()
  }

  // RTL
  p = await open(b, '?dir=rtl')
  const rtl = await p.evaluate(() => { const t = document.querySelector('#b-remove [data-id="r0"] .t-tag'), x = t.querySelector('.t-remove').getBoundingClientRect(), tx = t.querySelector('.t-text').getBoundingClientRect(); const s = document.querySelector('#B .t-racimo') ; return { xLeft: x.right <= tx.left + 1, spine: getComputedStyle(document.querySelector('#b2-filters .t-racimo')).borderRightWidth } })
  c('RTL: «Quitar» al final lógico (a la izquierda); lomo a la derecha', rtl.xLeft && parseFloat(rtl.spine) > 0, JSON.stringify(rtl))
  c('texto con dir=auto (árabe en LTR y latino en RTL)', await p.evaluate(() => [...document.querySelectorAll('.t-text')].every((t) => t.getAttribute('dir') === 'auto')))
  await p.context().close()

  // 320px sin desplazamiento horizontal
  p = await open(b, '', { vw: 320, vh: 700 })
  c('320px: sin desplazamiento horizontal', await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), await p.evaluate(() => document.documentElement.scrollWidth))
  await p.context().close()

  // ================= A · HUELLA =================
  c = ck('A'); p = await open(b, '#A')
  await p.evaluate(() => document.getElementById('a-remove').scrollIntoView({ block: 'center' }))
  const capSz = await box(p, '#a-remove [data-id="a1"] .t-remove')
  c('tapa entera: 32 × 32 (toda la altura)', Math.round(capSz.w) === 32 && Math.round(capSz.h) >= 31, JSON.stringify(capSz))
  await p.hover('#a-remove [data-id="a2"] .t-remove')
  c('vista previa: apuntar a la tapa tacha el texto', await p.evaluate(() => getComputedStyle(document.querySelector('#a-remove [data-id="a2"] .t-text')).textDecorationLine.includes('line-through')))
  const before = await p.evaluate(() => [...document.querySelectorAll('#a-remove .t-item')].map((li) => { const r = li.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width)] }))
  await p.click('#a-remove [data-id="a2"] .t-remove')
  const after = await p.evaluate(() => [...document.querySelectorAll('#a-remove .t-item')].map((li) => { const r = li.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width)] }))
  c('huella: nada se mueve (posiciones y anchos Δ0)', JSON.stringify(before) === JSON.stringify(after), JSON.stringify(after.slice(0, 3)))
  c('huella: el foco pasa a «Deshacer: quitar Látex» en el mismo sitio', await act(p) === 'Deshacer: quitar Látex', await act(p))
  c('anuncio «Látex quitada. Deshacer disponible»', (await live(p)) === 'Látex quitada. Deshacer disponible')
  const gh = await p.evaluate(() => { const t = document.querySelector('#a-remove [data-id="a2"] .t-tag'); return { cls: t.classList.contains('is-ghost'), dash: getComputedStyle(t).borderTopStyle, bodyHidden: t.querySelector('.t-body').getAttribute('aria-hidden') } })
  c('huella: borde discontinuo; texto fuera del árbol (lo dice «Deshacer»)', gh.cls && gh.dash === 'dashed' && gh.bodyHidden === 'true', JSON.stringify(gh))
  await p.click('#a-remove [data-id="a2"] .t-undo')
  c('deshacer: vuelve en su sitio, foco a su «Quitar», «Látex restaurada»', await act(p) === 'Quitar Látex' && (await live(p)) === 'Látex restaurada' && await p.evaluate(() => !document.querySelector('#a-remove .is-ghost')))
  // Doble clic rápido en la misma tapa: quita una y deshace (no quita dos)
  await p.dblclick('#a-remove [data-id="a3"] .t-remove')
  c('doble clic rápido en la tapa: no quita la vecina (5 siguen)', await p.evaluate(() => window.__tag.get('a-remove').items.length === 5 && window.__tag.get('a-remove').items.find((x) => x.id === 'a4' && !x.ghost)))
  // Recogerse al salir puntero y foco
  await p.click('#a-remove [data-id="a3"] .t-remove').catch(() => {})
  const ghostN = await p.evaluate(() => document.querySelectorAll('#a-remove .t-tag.is-ghost').length)
  await p.focus('#a-add'); await p.mouse.move(5, 5)
  await p.waitForTimeout(400)
  c('al salir puntero y foco, las huellas se recogen', ghostN >= 1 && await p.evaluate(() => !document.querySelector('#a-remove .is-ghost')), `huellas antes: ${ghostN}`)
  c('modelo: lo quitado ya no está', await p.evaluate(() => !window.__tag.get('a-remove').items.some((x) => x.id === 'a3' && !x.ghost)))
  // Contraste de categorías y alternar con categoría (§7.1)
  const ac = await p.evaluate(() => {
    const on = document.querySelector('#a-toggle .is-pressed'); const m = getComputedStyle(on).boxShadow.match(/rgba?\([^)]*\)/)
    return { tags: [...document.querySelectorAll('#a-remove .t-tag:not(.is-ghost)')].map((t) => __ratio(__rgb(getComputedStyle(t).color), __rgb(getComputedStyle(t).backgroundColor))), onText: __ratio(__rgb(getComputedStyle(on).color), __rgb(getComputedStyle(on).backgroundColor)), onEdge: __ratio(__rgb(m[0]), __bg(on.parentElement)) }
  })
  c('A: texto ≥ 4,5:1 en cada categoría; pulsado ≥ 4,5:1 y contorno cat-k-text ≥ 3:1', ac.tags.every((r) => r >= 4.5) && ac.onText >= 4.5 && ac.onEdge >= 3, JSON.stringify(ac, (k, v) => typeof v === 'number' ? +v.toFixed(2) : v))
  c('consola sin errores ni avisos', !p.__errs.length, p.__errs.join(' | '))
  await p.context().close()
  // Movimiento reducido: se recogen sin animación
  p = await open(b, '#A', { reducedMotion: 'reduce' })
  await p.click('#a-remove [data-id="a1"] .t-remove'); await p.focus('#a-add'); await p.mouse.move(5, 5); await p.waitForTimeout(30)
  c('movimiento reducido: la huella se recoge sin esperar animación', await p.evaluate(() => !document.querySelector('#a-remove .is-ghost')))
  await p.context().close()

  // ================= B · RACIMO =================
  c = ck('B'); p = await open(b, '#B')
  const bs = await p.evaluate(() => {
    const r = [...document.querySelectorAll('#b2-filters .t-racimo')]
    return { n: r.length, facets: r.map((x) => x.dataset.facet).join(','), named: r.filter((x) => x.dataset.facet).every((x) => { const ul = x.querySelector('.t-vals'); return document.getElementById(ul.getAttribute('aria-labelledby'))?.textContent === x.dataset.facet }), spine: r.map((x) => { const cs = getComputedStyle(x); return +__ratio(__rgb(cs.borderLeftColor), __rgb(getComputedStyle(document.querySelector('#B + p + .demo, .demo')).backgroundColor)).toFixed(2) }) }
  })
  c('racimos por faceta en orden de aparición (Estado, Prioridad, Responsable, suelta)', bs.n === 4 && bs.facets === 'Estado,Prioridad,Responsable,', bs.facets)
  c('cada racimo es una lista nombrada por su faceta', bs.named)
  c('lomo (cat-k-text) ≥ 3:1 contra la superficie', bs.spine.slice(0, 3).every((v) => v >= 3), JSON.stringify(bs.spine))
  const snapB = await p.locator('#b2-filters').ariaSnapshot()
  c('árbol: lista «Estado» dentro de «Filtros aplicados»; «Quitar Pendiente de Estado»', /list "Estado"/.test(snapB) && /button "Quitar Pendiente de Estado"/.test(snapB), snapB.split('\n').slice(0, 4).join(' | '))
  await p.click('#b2-filters [data-id="f1"] .t-remove')
  c('quitar en un racimo: foco al vecino del mismo racimo; «Pendiente quitada de Estado»', await act(p) === 'Quitar En curso de Estado' && (await live(p)) === 'Pendiente quitada de Estado', await act(p))
  await p.keyboard.press('Enter')
  c('quitar el último del racimo: el racimo se va; foco al siguiente', await act(p) === 'Quitar Alta de Prioridad' && await p.evaluate(() => !document.querySelector('#b2-filters [data-facet="Estado"]')), await act(p))
  const snapBT = await p.locator('#b2-toggle').ariaSnapshot()
  c('alternar en racimo: grupo nombrado por la faceta con botones pressed', /group "Estado"/.test(snapBT) && /button "Pendiente" \[pressed\]/.test(snapBT), snapBT.split('\n').slice(0, 3).join(' | '))
  const pb = await p.evaluate(() => { const t = document.querySelector('#b2-toggle .is-pressed'); return __ratio(__rgb(getComputedStyle(t).color), __rgb(getComputedStyle(t).backgroundColor)) })
  c('alternar en racimo: texto pulsado ≥ 4,5:1 (on-cat-k-soft)', pb >= 4.5, pb.toFixed(2))
  c('consola sin errores ni avisos', !p.__errs.length, p.__errs.join(' | '))
  await p.context().close()

  // ================= C · PALABRA =================
  c = ck('C'); p = await open(b, '#C')
  const cl = await p.evaluate(() => {
    const para = document.getElementById('c-para'), lh = parseFloat(getComputedStyle(para).lineHeight)
    const lines = Math.round(para.getBoundingClientRect().height / lh)
    // Referencia: el mismo párrafo con cada etiqueta sustituida por su texto llano (sin marca, sin pestaña)
    const ref = para.cloneNode(true); ref.removeAttribute('id'); ref.style.inlineSize = para.getBoundingClientRect().width + 'px'
    ref.querySelectorAll('.t-tag').forEach((t) => t.replaceWith(document.createTextNode(t.querySelector('.t-text').textContent))); para.after(ref)
    const d = para.getBoundingClientRect().height - ref.getBoundingClientRect().height; ref.remove()
    const inl = document.querySelector('#c-inline .t-list')
    return { d, lines, list: inl.tagName + '/' + inl.getAttribute('role'), item: inl.firstElementChild.tagName + '/' + inl.firstElementChild.getAttribute('role'), bg: getComputedStyle(document.querySelector('#c-static .t-tag')).backgroundColor }
  })
  c('en una frase: altura Δ0 frente al mismo texto sin etiquetas', Math.abs(cl.d) < 0.5, JSON.stringify(cl))
  c('en una frase: <span role=list>/<span role=listitem> (válido dentro de <p>)', cl.list === 'SPAN/list' && cl.item === 'SPAN/listitem')
  c('en reposo sin caja (fondo transparente)', /rgba\(0, 0, 0, 0\)|transparent/.test(cl.bg), cl.bg)
  const xr = await p.evaluate(() => { const x = document.querySelector('#c-remove [data-id="cr1"] .t-remove'); const cs = getComputedStyle(x); return { op: cs.opacity, pe: cs.pointerEvents, focusable: x.tabIndex === 0 } })
  c('«Quitar» oculto en reposo pero en el orden de Tab', xr.op === '0' && xr.pe === 'none' && xr.focusable, JSON.stringify(xr))
  const pos0 = await p.evaluate(() => [...document.querySelectorAll('#c-remove .t-item')].map((li) => Math.round(li.getBoundingClientRect().left)))
  await p.hover('#c-remove [data-id="cr1"] .t-text')
  await p.waitForTimeout(250)
  const hv2 = await p.evaluate(() => { const x = document.querySelector('#c-remove [data-id="cr1"] .t-remove'), t = document.querySelector('#c-remove [data-id="cr1"] .t-text'); const rx = x.getBoundingClientRect(), rt = t.getBoundingClientRect(), nb = document.querySelector('#c-remove [data-id="cr2"] .t-text').getBoundingClientRect(); return { op: getComputedStyle(x).opacity, below: rx.top >= rt.bottom - 1, h: Math.round(rx.height), overNeighbor: rx.right > nb.left && rx.top < nb.bottom, pos: [...document.querySelectorAll('#c-remove .t-item')].map((li) => Math.round(li.getBoundingClientRect().left)), name: x.getAttribute('aria-label'), vis: x.textContent.trim() } })
  c('al apuntar: la pestaña aparece debajo, 24px de alto, sin tapar la palabra vecina', hv2.op === '1' && hv2.below && hv2.h >= 24 && !hv2.overNeighbor, JSON.stringify(hv2))
  c('al apuntar: nada se mueve (Δ0)', JSON.stringify(pos0) === JSON.stringify(hv2.pos))
  c('pestaña con texto visible «Quitar» contenido en su nombre (2.5.3)', hv2.vis === 'Quitar' && hv2.name.startsWith('Quitar'), hv2.name)
  await p.mouse.move(5, 5)
  await p.focus('#c-remove [data-id="cr2"] .t-remove'); await p.waitForTimeout(250)
  c('teclado: al enfocar «Quitar», la pestaña es visible', await p.evaluate(() => getComputedStyle(document.activeElement).opacity === '1'))
  await p.keyboard.press('Enter')
  c('quitar: foco al «Quitar» de la siguiente; anuncio', await act(p) === 'Quitar Este mes' && (await live(p)) === 'Ana Martínez quitada', await act(p))
  await p.click('#c-toggle [data-id="ct0"] button')
  const ct = await p.evaluate(() => { const t = document.querySelector('#c-toggle [data-id="ct0"] .t-tag'); return { pressed: t.querySelector('button').getAttribute('aria-pressed'), bg: getComputedStyle(t).backgroundColor, r: __ratio(__rgb(getComputedStyle(t.querySelector('button')).color), __rgb(getComputedStyle(t).backgroundColor)) } })
  c('alternar: la caja aparece solo al pulsar; texto ≥ 4,5:1', ct.pressed === 'true' && !/rgba\(0, 0, 0, 0\)/.test(ct.bg) && ct.r >= 4.5, JSON.stringify(ct))
  const mk = await p.evaluate(() => [...document.querySelectorAll('#c-static .t-mark')].map((m) => +__ratio(__rgb(getComputedStyle(m).color), __bg(m)).toFixed(2)))
  c('marca de categoría (cat-k-text) ≥ 3:1', mk.every((v) => v >= 3), JSON.stringify(mk))
  c('consola sin errores ni avisos', !p.__errs.length, p.__errs.join(' | '))
  await p.context().close()
  // Táctil en C: primer toque enfoca «Quitar» (aparece la pestaña), no quita
  if (eng !== 'firefox') {
    p = await open(b, '#C', { hasTouch: true, isMobile: eng === 'chromium', vw: 390, vh: 800 })
    await p.evaluate(() => document.getElementById('c-remove').scrollIntoView({ block: 'center' }))
    const tc = await p.evaluate(() => { const r = document.querySelector('#c-remove [data-id="cr0"] .t-text').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] })
    await p.touchscreen.tap(tc[0], tc[1]); await p.waitForTimeout(100)
    c('táctil: el primer toque muestra la pestaña y no quita', await p.evaluate(() => document.activeElement.getAttribute('aria-label') === 'Quitar Pendiente' && window.__tag.get('c-remove').items.length === 4))
    await p.context().close()
  }

  // Tema oscuro: contraste de categorías y alternar
  p = await open(b, '?theme=dark')
  const dk = await p.evaluate(() => ({ cats: [...document.querySelectorAll('#b-static-cat .t-tag, #a-remove .t-tag')].map((t) => __ratio(__rgb(getComputedStyle(t).color), __rgb(getComputedStyle(t).backgroundColor))), on: (() => { const t = document.querySelector('#b-toggle .is-pressed'); return __ratio(__rgb(getComputedStyle(t).color), __rgb(getComputedStyle(t).backgroundColor)) })() }))
  rec(eng, 'tema', 'oscuro: categorías y pulsado ≥ 4,5:1', dk.cats.every((r) => r >= 4.5) && dk.on >= 4.5, `min ${Math.min(...dk.cats).toFixed(2)} · pulsado ${dk.on.toFixed(2)}`)
  await p.context().close()
  await b.close()
}

for (const e of ENGINES) await run(e)
server.close()
const fail = R.filter((r) => !r.ok)
const by = {}; for (const r of R) { by[r.eng] ??= [0, 0]; by[r.eng][r.ok ? 0 : 1]++ }
console.log(Object.entries(by).map(([e, [ok, ko]]) => `${e}: ${ok}/${ok + ko}`).join(' · '))
console.log(fail.length ? `${fail.length} fallos` : `${R.length}/${R.length} sin fallos`)
process.exit(fail.length ? 1 : 0)
