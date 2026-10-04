// Verificación de GNotice r01 (kiwi; carpeta de trabajo design/lab/alert): Chromium, Firefox y WebKit.
// Ejecutar: node design/lab/alert/r01/verificar.mjs   (usa el Playwright de design/lab/theme-playground)
// Sirve la raíz del repo en GRANA_PW_PORT (por defecto 4209). Prototipo: componentes reales de packages/vue/dist +
// XNotice de la página. Requiere `npm run build` previo. ENGINES=chromium,firefox VERBOSE=1 para filtrar o ver todo.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4209)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(path)
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(body)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const url = `http://127.0.0.1:${PORT}/design/lab/alert/r01/index.html`
const report = []
const FF = 'Firefox avisa (a veces) de que desactiva su anclaje nativo por ajustes pequeños consecutivos; la compensación propia sigue y las medidas pasan (hallazgo L12)'

for (const engine of (process.env.ENGINES || 'chromium,firefox,webkit').split(',')) {
  const b = await pw[engine].launch()
  let pass = 0; const fails = []; const notes = []; const errs = []
  let lastStep = 'inicio'
  const ok = (c, m) => { lastStep = m.slice(0, 50); if (c) pass++; else fails.push(m); if (process.env.VERBOSE) console.log(engine, c ? 'ok ' : 'NO ', m) }
  const open = async (opts = {}) => {
    const { vw = 1280, vh = 900, clock = false, ...ctx } = opts
    const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
    const p = await context.newPage()
    if (clock) await p.clock.install()
    p.on('console', (m) => { if (!['error', 'warning'].includes(m.type())) return; if (/Scroll anchoring was disabled/.test(m.text())) { if (!notes.includes(FF)) notes.push(FF) } else errs.push(`${vw} [tras «${lastStep}»]: ${m.text()}`) })
    p.on('pageerror', (e) => errs.push(`${vw}: ${e}`))
    await p.goto(url)
    await p.waitForFunction(() => window.__app && document.querySelectorAll('.x-notice').length >= 14)
    await p.evaluate(() => { window.__fast = true })
    await p.waitForTimeout(150)
    return p
  }
  const TAB = engine === 'webkit' ? 'Alt+Tab' : 'Tab' // en WebKit, Tab solo recorre campos; Opción+Tab recorre todo
  const TOL = engine === 'webkit' ? 1.5 : 1 // WebKit redondea scrollTop a enteros
  const act = (p) => p.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)
  const live = (p) => p.evaluate(() => window.__live.map((x) => ({ ...x })))
  const settle = (p, ms = 420) => p.waitForTimeout(ms)
  // Muestra por cuadro DESPUÉS de pintar (rAF → tarea): [top del elemento, scrollY]
  const startSample = (p, sel, ms) => p.evaluate(([s, t]) => {
    window.__sample = new Promise((res) => {
      const out = []; const el = document.querySelector(s); const t0 = performance.now()
      const f = () => setTimeout(() => { out.push([el.getBoundingClientRect().top, window.scrollY]); if (performance.now() - t0 < t) requestAnimationFrame(f); else res(out) }, 0)
      requestAnimationFrame(f)
    })
  }, [sel, ms])
  const endSample = (p) => p.evaluate(() => window.__sample)
  const spread = (a) => Math.max(...a) - Math.min(...a)
  const liveEls = (p) => p.evaluate(() => document.querySelectorAll(':is([aria-live]:not([aria-live=off]),[role=alert],[role=status]):not(.g-btn__status)').length) // sin la región propia de GBtn loadingText (#14)

  // ============ 1. Carga: estáticos, anatomía, árbol ============
  let p = await open()
  ok((await live(p)).length === 0, `Al cargar no se anuncia nada: 14 avisos presentes desde la carga, 0 anuncios (${(await live(p)).length})`)
  ok(await p.evaluate(() => [...document.querySelectorAll('.x-notice')].every((n) => !n.matches('[role=alert],[role=status],[aria-live]') && !n.querySelector(':is([role=alert],[role=status],[aria-live]:not([aria-live=off])):not(.g-btn__status)'))),
    'Ningún aviso lleva role="alert"/"status" ni aria-live propio (ni dentro): el anuncio va por el canal compartido')
  ok(await p.evaluate(() => { const l = document.querySelectorAll('body > .x-live'); return l.length === 1 && l[0].querySelector('[role=status][aria-live=polite][aria-atomic=true]') && l[0].querySelector('[role=alert][aria-atomic=true]') && l[0].textContent === '' }),
    'Un único par de canales en el body (status cortés + alert enérgico, aria-atomic), vacío antes del primer aviso')
  const snap = await p.locator('#gallery').ariaSnapshot()
  ok(/group "Borrador sin publicar"/.test(snap) && /group "Información: Hay una versión nueva del informe"/.test(snap) && /group "Error: No se pudo cargar el historial"/.test(snap),
    'Árbol: cada aviso es un grupo con nombre = prefijo de tipo + título (neutral sin prefijo)')
  ok(/heading "Advertencia: Faltan datos fiscales" \[level=3\]/.test(snap), 'Árbol: headingLevel=3 → el título es un encabezado h3; sin él, un párrafo')
  ok(/group "Advertencia"/.test(snap) && !/group "Advertencia:"/.test(snap), 'Árbol: sin título, el grupo se nombra con el tipo («Advertencia») y el cuerpo empieza por el prefijo oculto')
  ok(await p.evaluate(() => [...document.querySelectorAll('.x-notice__icon')].every((i) => i.getAttribute('aria-hidden') === 'true' && i.querySelector('svg.g-icon'))) , 'Iconos: Lucide, decorativos (aria-hidden); el tipo se dice con el prefijo oculto')
  ok(await p.evaluate(() => !document.querySelector('#g-neutral .x-notice__icon') && ['g-info', 'g-success', 'g-warning', 'g-error'].every((i) => document.querySelector('#' + i + ' .x-notice__icon svg'))), 'neutral sin icono; info, success, warning y error con el suyo')
  const shapes = await p.evaluate(() => ['g-info', 'g-success', 'g-warning', 'g-error'].map((i) => document.querySelector('#' + i + ' .x-notice__icon svg').innerHTML))
  ok(new Set(shapes).size === 4, 'Señal no cromática 1: cuatro formas de icono distintas')
  const marks = await p.evaluate(() => Object.fromEntries(['g-info', 'g-success', 'g-warning', 'g-error'].map((i) => { const c = getComputedStyle(document.querySelector('#' + i + ' .x-notice__box')); return [i, c.borderInlineStartStyle + ' ' + c.borderInlineStartWidth] })))
  ok(marks['g-error'] === 'solid 4px' && marks['g-warning'] === 'dashed 4px' && marks['g-info'] === 'solid 1px' && marks['g-success'] === 'solid 1px', `Señal no cromática 2: marca de inicio sólida en error y discontinua en advertencia, como GToast (${JSON.stringify(marks)})`)
  ok(await p.evaluate(() => { const c = (i) => getComputedStyle(document.querySelector('#' + i + ' .x-notice__box')); return c('g-info').borderTopColor === c('g-error').borderTopColor && c('g-info').backgroundColor === c('g-error').backgroundColor }), 'El prototipo no usa color por tipo: los tipos se distinguen igualmente')
  // Orden del DOM y del teclado
  ok(await p.evaluate(() => { const n = document.getElementById('n-error'); const seq = [...n.querySelectorAll('button')].map((x) => x.className.includes('toggle') ? 'toggle' : x.className.includes('close') ? 'close' : x.className.includes('copy') ? 'copy' : 'action'); return seq.join(',') === 'toggle,copy,action,action,close' }), 'Orden del DOM: contenido (título, cuerpo, detalle) → acciones → cierre')
  await p.focus('#g-error .x-notice__toggle'); await p.keyboard.press(TAB)
  ok((await act(p)) === 'g-error-retry', `Tab: del conmutador de detalle (cerrado, panel fuera del orden) a «Reintentar» (${await act(p)})`)
  ok(await p.evaluate(() => [...document.querySelectorAll('.x-notice__close, .x-notice__toggle, .x-notice__actions .g-btn')].every((x) => { const r = x.getBoundingClientRect(); return r.height >= 24 && r.width >= 24 })), 'Área de puntero ≥ 24×24 en cierre, conmutador y acciones')
  ok(await p.evaluate(() => { const a = document.getElementById('app'); return a.firstElementChild.id === 'bands' && a.children[1].tagName === 'MAIN' && document.querySelector('#bands .x-notice--banner') }), 'Banda de página: primer contenido del documento, antes de <main>')
  const base = await liveEls(p)

  // ============ 2. Formulario: validación (GErrorSummary) frente a servidor (aviso) ============
  await p.fill('#s-rfc', ''); await p.focus('#s-save'); await p.waitForTimeout(80); await p.keyboard.press('Enter'); await p.waitForTimeout(250)
  ok(await p.evaluate(() => !document.getElementById('s-summary').hidden) && (await act(p)) === 's-summary', `Validación: GErrorSummary visible y con el foco (${await act(p)})`)
  ok((await live(p)).length === 0 && !(await p.$('#s-notice')) && (await p.evaluate(() => __app.save.invalids)) === 1, 'Validación: ningún aviso ni anuncio del canal compartido (lo dice el role="alert" del resumen)')
  await p.fill('#s-rfc', 'CNO010203AB1'); await p.focus('#s-save')
  await p.keyboard.press('Enter'); await p.waitForSelector('#s-notice'); await settle(p)
  let lv = await live(p)
  ok(lv.length === 1 && lv[0].ch === 'assertive' && lv[0].host === 'body' && lv[0].text === 'Error: No se pudo guardar la factura. El servidor no respondió. Tus datos siguen en el formulario.',
    `Error de servidor que aparece: 1 anuncio enérgico con texto compuesto «tipo: título. cuerpo», sin nombres de botones (${JSON.stringify(lv)})`)
  ok((await act(p)) === 's-save', `El aviso NO toma el foco al aparecer: sigue en «Guardar» (${await act(p)})`)
  ok(await p.evaluate(() => document.getElementById('s-summary').hidden), 'Resumen de validación oculto con el error de servidor: no hay dos mensajes para el mismo suceso')
  ok(await p.evaluate(() => [...document.querySelectorAll('[role=alert]')].filter((x) => x.textContent.trim() && x.getClientRects().length).length) <= 1, 'Como mucho un role="alert" con texto a la vez')
  ok((await liveEls(p)) === base, `El número de regiones vivas no crece con los avisos (${base} → ${await liveEls(p)})`)
  // Detalle desplegable
  const tg = '#s-notice .x-notice__toggle'
  ok(await p.evaluate((s) => { const t = document.querySelector(s); const pn = document.getElementById(t.getAttribute('aria-controls')); return t.getAttribute('aria-expanded') === 'false' && pn.hidden }, tg), 'Detalle: botón con aria-expanded="false" y aria-controls; panel hidden')
  await p.focus(tg); await p.keyboard.press('Enter')
  ok(await p.evaluate((s) => { const t = document.querySelector(s); const pn = document.getElementById(t.getAttribute('aria-controls')); return t.getAttribute('aria-expanded') === 'true' && !pn.hidden && pn.querySelector('pre').getAttribute('dir') === 'ltr' }, tg) && (await act(p)) !== 'BODY',
    'Detalle: Enter lo abre (aria-expanded="true"), el foco no se mueve, el texto técnico va en dir="ltr"')
  ok((await live(p)).length === 1, 'Abrir el detalle no anuncia nada (el aviso no es una región viva)')
  await p.click('#s-notice .x-notice__copy'); await p.waitForTimeout(120)
  lv = await live(p)
  ok(lv.length === 2 && lv[1].ch === 'polite' && lv[1].text === 'Copiado' && /Copiado/.test(await p.textContent('#s-notice .x-notice__copy')), `Copiar: el botón pasa a «Copiado» y se anuncia por el canal cortés (${JSON.stringify(lv[1])})`)
  // N2: Reintentar con éxito → el mismo nodo cambia de tipo
  await p.evaluate(() => { window.__node = document.getElementById('s-notice'); __app.save.fails = false })
  await p.focus('#s-retry'); await p.keyboard.press('Enter')
  await p.waitForFunction(() => document.getElementById('s-notice')?.dataset.type === 'success'); await p.waitForTimeout(120)
  ok(await p.evaluate(() => window.__node === document.getElementById('s-notice') && window.__node.isConnected), 'N2: al resolverse, el MISMO nodo pasa de error a éxito (no se desmonta)')
  ok((await act(p)) === 's-notice', `N2: «Reintentar» desaparece con el foco dentro → el foco pasa al propio aviso (grupo «Correcto: Factura guardada»), nunca al body (${await act(p)})`)
  ok((await live(p)).length === 2, `N2: con el foco en el aviso no hay anuncio duplicado por el canal (${(await live(p)).length - 2} anuncios nuevos)`)
  ok(await p.evaluate(() => { const n = document.getElementById('s-notice'); return n.querySelector('.x-notice__title').textContent === 'Correcto: Factura guardada' && !!n.querySelector('#s-link') && !n.querySelector('.x-notice__actions') && !n.querySelector('.x-notice__details') }), 'N2: título, cuerpo (enlace a lo creado) y acciones cambian en el sitio')
  // Cierre con foco
  await p.focus('#s-notice .x-notice__close'); await p.keyboard.press('Enter'); await p.waitForTimeout(60)
  ok((await act(p)) === 's-save', `Cerrar con el foco dentro: el foco va al siguiente control («Guardar»), no al body (${await act(p)})`)
  await settle(p)
  ok(!(await p.$('#s-notice')), 'Tras la salida, el aviso cerrado sale del DOM')
  await p.close()

  // ============ 3. N1 · crece hacia donde no estás (foco debajo del aviso) ============
  p = await open({ vh: 700 })
  await p.evaluate(() => { document.getElementById('s-save').scrollIntoView({ block: 'center' }) }); await p.waitForTimeout(80)
  await p.focus('#s-save')
  let y0 = await p.evaluate(() => window.scrollY)
  await startSample(p, '#s-save', 700)
  await p.keyboard.press('Enter')
  let fr = await endSample(p)
  let pin = await p.evaluate(() => window.__pins.at(-1))
  let y1 = await p.evaluate(() => window.scrollY)
  ok(pin.id === 's-notice' && pin.pin === 'focus', `N1: aviso encima del control con foco y con sitio para desplazar → régimen «focus» (${JSON.stringify(pin)})`)
  ok(spread(fr.map((f) => f[0])) <= TOL, `N1: «Guardar» (con el foco) no se mueve en ningún cuadro mientras el aviso entra: Δ ${spread(fr.map((f) => f[0])).toFixed(2)}px en ${fr.length} cuadros`)
  ok(Math.abs((y1 - y0) - pin.delta) <= 1.5 && new Set(fr.map((f) => Math.round(f[1]))).size > 3, `N1: lo de arriba sube ${Math.round(y1 - y0)}px (alto del aviso + separación = ${pin.delta}px) en varios cuadros, sin salto`)
  ok((await act(p)) === 's-save', 'N1: el foco sigue en «Guardar»')
  // Salida: al quitar el aviso (validación siguiente), el control con foco tampoco se mueve
  await startSample(p, '#s-save', 700)
  await p.evaluate(() => { __app.save.shown = false })
  fr = await endSample(p)
  pin = await p.evaluate(() => window.__pins.at(-1))
  ok(pin.entering === false && !pin.instant && pin.pin === 'focus' && spread(fr.map((f) => f[0])) <= TOL, `N1 (salida): el control con foco no se mueve al retirarse el aviso: Δ ${spread(fr.map((f) => f[0])).toFixed(2)}px (${JSON.stringify(pin)})`)
  // Con ratón: WebKit no enfoca el botón al pulsarlo; el ancla es el último elemento pulsado
  await settle(p)
  await p.evaluate(() => document.activeElement.blur()); await p.waitForTimeout(50)
  await startSample(p, '#s-save', 700)
  await p.click('#s-save')
  fr = await endSample(p)
  pin = await p.evaluate(() => window.__pins.at(-1))
  ok(pin.entering && pin.pin === 'focus' && spread(fr.map((f) => f[0])) <= TOL, `N1 con ratón: el botón pulsado no se mueve bajo el puntero (activeElement: ${await act(p)}): Δ ${spread(fr.map((f) => f[0])).toFixed(2)}px`)
  await p.close()

  // ============ 4. Tabla: error al cargar ============
  p = await open()
  await p.focus('#tb-retry'); await p.keyboard.press('Enter')
  await p.waitForFunction(() => !document.getElementById('tb-notice')); await p.waitForTimeout(80)
  let a = await act(p)
  ok(a !== 'BODY' && await p.evaluate(() => document.getElementById('tb-frame').contains(document.activeElement)), `Cargar resuelto: el aviso sale (lo retira la aplicación) y el foco de «Reintentar» pasa al siguiente control, no al body (${a})`)
  ok(await p.evaluate(() => document.querySelectorAll('#tb tbody tr').length >= 2), 'La tabla muestra las filas')
  ok((await live(p)).length === 0, 'El error que ya venía con la página y su retirada no anuncian nada')
  await p.focus('#tb-break'); await p.keyboard.press('Enter'); await p.waitForSelector('#tb-notice'); await settle(p)
  lv = await live(p)
  ok(lv.length === 1 && lv[0].ch === 'assertive' && /^Error: No se pudieron cargar las facturas\./.test(lv[0].text) && (await act(p)) === 'tb-break', `Fallo de recarga posterior: el aviso aparece, 1 anuncio enérgico y el foco sigue en su sitio (${await act(p)})`)

  // ============ 5. Éxito persistente y cierre ============
  await p.focus('#c-create'); await p.keyboard.press('Enter'); await p.waitForSelector('#c-notice'); await settle(p)
  lv = await live(p)
  ok(lv.length === 2 && lv[1].ch === 'polite' && lv[1].text === 'Correcto: Proyecto creado. Ya puedes invitar a tu equipo desde Proyecto Atlas.', `Éxito que aparece: 1 anuncio cortés (${JSON.stringify(lv[1])})`)
  ok((await p.evaluate(() => window.__pins.at(-1).pin)) === '' && (await act(p)) === 'c-create', 'Foco encima del aviso: crece hacia abajo (sin compensar) y el foco no se mueve')
  await p.waitForTimeout(700)
  ok(!!(await p.$('#c-notice')), 'No se cierra solo')
  await p.keyboard.press(TAB); ok((await act(p)) === 'c-link', `Tab entra en el aviso por su enlace (${await act(p)})`)
  await p.keyboard.press(TAB); await p.keyboard.press('Enter'); await p.waitForTimeout(60)
  ok((await act(p)) === 'c-after', `Cierre por teclado: foco al siguiente elemento lógico (${await act(p)})`)
  await p.keyboard.press('Escape')
  await settle(p)
  ok((await live(p)).length === 2, 'Cerrar no anuncia nada')

  // ============ 6. Tarjeta y diálogo ============
  ok(await p.evaluate(() => { const n = document.getElementById('k-notice'); return n.closest('.g-card') && n.getAttribute('role') === 'group' }), 'Dentro de GCard (slot por defecto): grupo con nombre, sin región viva')
  await p.click('#d-open'); await p.waitForSelector('#d-dialog[open] #d-warn'); await p.waitForTimeout(450)
  ok((await live(p)).length === 2, 'Diálogo: la advertencia que viene con la vista NO se anuncia al abrir')
  ok((await act(p)) === 'd-nombre', `Diálogo: el foco inicial sigue la regla de GDialog (#292), no va al aviso (${await act(p)})`)
  ok(await p.evaluate(() => { const l = document.querySelectorAll('#d-dialog .x-live'); return l.length === 1 && l[0].textContent === '' }), 'Diálogo modal: tiene su propio par de canales, dentro del <dialog> (lo de fuera es inerte)')
  const dTop = await p.evaluate(() => document.getElementById('d-dialog').getBoundingClientRect().top)
  const sTop = await p.evaluate(() => document.getElementById('d-save').getBoundingClientRect().top)
  await p.focus('#d-save'); await p.keyboard.press('Enter'); await p.waitForSelector('#d-error'); await settle(p, 500)
  lv = await live(p)
  ok(lv.length === 3 && lv[2].host === 'dialog' && lv[2].ch === 'assertive' && lv[2].text === 'Error: No se pudo guardar. El servidor no respondió.', `Diálogo: el error que aparece se anuncia una vez, en el canal del diálogo (${JSON.stringify(lv[2])})`)
  ok(await p.evaluate(() => !/No se pudo guardar/.test(document.querySelector('body > .x-live').textContent)), 'Diálogo: el canal del body no recibe ese anuncio')
  ok((await act(p)) === 'd-save', `Diálogo: el foco sigue en «Guardar» (${await act(p)})`)
  const dTop2 = await p.evaluate(() => document.getElementById('d-dialog').getBoundingClientRect().top)
  const sTop2 = await p.evaluate(() => document.getElementById('d-save').getBoundingClientRect().top)
  ok(Math.abs(dTop2 - dTop) <= 0.5, `Diálogo (D2, #301): el borde superior no se mueve al crecer: Δ ${(dTop2 - dTop).toFixed(2)}px`)
  notes.push(`diálogo centrado: «Guardar» baja ${Math.round(sTop2 - sTop)}px al aparecer el aviso (crece hacia abajo, #301); ver L9`)
  await p.keyboard.press('Escape'); await p.waitForTimeout(400)

  // ============ 7. Foco a petición ============
  await p.focus('#f-open'); await p.keyboard.press('Enter'); await p.waitForSelector('#f-notice'); await p.waitForTimeout(80)
  ok((await act(p)) === 'f-notice' && await p.evaluate(() => document.getElementById('f-notice').getAttribute('tabindex') === '-1'), `focus(): el aviso recibe el foco a petición de la aplicación (${await act(p)})`)
  ok((await live(p)).length === 3, 'focus() con announce="off": sin anuncio duplicado')
  await p.keyboard.press(TAB)
  ok(await p.evaluate(() => !document.getElementById('f-notice').hasAttribute('tabindex')), 'Al salir el foco, el aviso deja de ser enfocable (pulsar su texto no mueve el foco)')
  await settle(p)

  // ============ 8. Con GToaster ============
  await p.click('#t-both'); await p.waitForSelector('#t-notice'); await p.waitForTimeout(250)
  lv = await live(p)
  const tText = await p.evaluate(() => [...document.querySelectorAll('.g-toaster__live')].map((x) => x.textContent.trim()).filter(Boolean))
  ok(lv.length === 4 && lv[3].text === 'Información: La copia tardará unos minutos en llegar.' && tText.length === 1 && /Copia enviada/.test(tText[0]), `GToaster + aviso: cada texto se anuncia una vez, en su canal (${JSON.stringify(tText)})`)
  ok(await p.evaluate(() => { const t = [...document.querySelectorAll('[aria-live]:not([aria-live=off]),[role=alert],[role=status]')].map((x) => x.textContent.trim()).filter(Boolean); return new Set(t).size === t.length }), 'Ningún texto repetido entre todas las regiones vivas del documento')
  await p.close()

  // ============ 9. Bandas de página ============
  p = await open({ vh: 700 })
  // 9a. Arriba del todo: empuja el contenido, no mueve ni el foco ni el desplazamiento
  await p.evaluate(() => document.getElementById('b-offline').scrollIntoView({ block: 'end' })); await p.waitForTimeout(80)
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(80)
  await p.evaluate(() => { document.querySelector('#t-slow').focus() })
  await startSample(p, 'h1', 600)
  await p.evaluate(() => __app.toggleBand('offline'))
  fr = await endSample(p)
  const tops = fr.map((f) => f[0])
  ok(fr.every((f) => f[1] === 0) && (await act(p)) === 't-slow', 'Banda que aparece con la página arriba: scrollY sigue en 0 y el foco no cambia de elemento')
  ok(tops.every((t, i) => i === 0 || t >= tops[i - 1] - 0.01) && new Set(tops.map((t) => Math.round(t))).size >= 4, `Banda: empuja el contenido de forma continua (${new Set(tops.map((t) => Math.round(t))).size} posiciones intermedias, sin retrocesos)`)
  lv = await live(p)
  ok(lv.length === 1 && lv[0].ch === 'polite' && lv[0].text === 'Advertencia: Sin conexión. Los cambios se guardarán al volver.', `Banda que aparece: 1 anuncio cortés (${JSON.stringify(lv)})`)
  ok((await p.evaluate(() => [...document.querySelectorAll('#bands .x-notice')].map((n) => n.id).join(','))) === 'band-offline,band-maint', 'Orden por gravedad en el DOM: advertencia antes que información')
  // 9b. N2 en banda sin foco dentro: cambia de tipo y se anuncia una vez
  await p.evaluate(() => { window.__node = document.getElementById('band-offline'); __app.online.value = true }); await p.waitForTimeout(150)
  lv = await live(p)
  ok(await p.evaluate(() => window.__node === document.getElementById('band-offline') && window.__node.dataset.type === 'success') && lv.length === 2 && lv[1].ch === 'polite' && lv[1].text === 'Correcto: Conexión restablecida. Los cambios pendientes ya se guardaron.',
    `N2 en banda (sin foco dentro): mismo nodo, de advertencia a éxito, 1 anuncio cortés (${JSON.stringify(lv[1])})`)
  ok((await p.evaluate(() => [...document.querySelectorAll('#bands .x-notice')].map((n) => n.id).join(','))) === 'band-maint,band-offline', 'Al pasar a éxito baja de gravedad: se reordena en el DOM sin remontarse')
  await p.evaluate(() => { __app.on.offline = false; __app.online.value = false }); await settle(p)
  // 9c. Con la página desplazada: la banda entra por encima sin mover lo que se ve
  await p.evaluate(() => document.getElementById('b-offline').scrollIntoView({ block: 'center' })); await p.waitForTimeout(100)
  await p.focus('#b-session')
  y0 = await p.evaluate(() => window.scrollY)
  await startSample(p, '#b-session', 700)
  await p.keyboard.press('Enter')
  fr = await endSample(p)
  pin = await p.evaluate(() => window.__pins.at(-1))
  y1 = await p.evaluate(() => window.scrollY)
  ok(pin.id === 'band-session' && pin.pin === 'above' && spread(fr.map((f) => f[0])) <= TOL, `Banda con la página desplazada: lo que se ve no se mueve en ningún cuadro: Δ ${spread(fr.map((f) => f[0])).toFixed(2)}px en ${fr.length} cuadros (${JSON.stringify(pin)})`)
  ok(Math.abs((y1 - y0) - pin.delta) <= 1.5, `…porque el desplazamiento se compensa con el alto de la banda (${Math.round(y1 - y0)}px de ${pin.delta}px), también sin anclaje nativo`)
  ok((await act(p)) === 'b-session', 'El foco sigue en el botón que la provocó')
  await startSample(p, '#b-session', 700)
  await p.keyboard.press('Enter')
  fr = await endSample(p)
  ok(spread(fr.map((f) => f[0])) <= TOL && (await p.evaluate(() => window.__pins.at(-1).pin)) === 'above', `Salida de la banda con la página desplazada: Δ ${spread(fr.map((f) => f[0])).toFixed(2)}px`)
  // 9d. Máximo a la vista
  await p.evaluate(() => { __app.toggleBand('session'); __app.toggleBand('offline') }); await settle(p, 500)
  ok((await p.evaluate(() => [...document.querySelectorAll('#bands .x-notice')].map((n) => n.id).join(','))) === 'band-session,band-offline', 'Tres bandas activas: a la vista las 2 más graves; la informativa espera')
  await p.evaluate(() => { __app.on.session = false; __app.on.offline = false }); await settle(p, 500)
  ok((await p.evaluate(() => [...document.querySelectorAll('#bands .x-notice')].map((n) => n.id).join(','))) === 'band-maint', 'Al resolverse las graves, la que esperaba vuelve')
  // 9e. Cierre de banda: foco al siguiente control
  await p.evaluate(() => window.scrollTo(0, 0))
  await p.focus('#band-maint .x-notice__close'); await p.keyboard.press('Enter'); await p.waitForTimeout(60)
  ok((await act(p)) === 't-slow', `Cerrar la banda: el foco pasa al primer control de la página (${await act(p)})`)
  await settle(p)
  // 9f. Banda fija: reserva el borde para GToaster y para el foco
  await p.evaluate(() => __app.toggleBand('readonly')); await settle(p, 500)
  await p.evaluate(() => window.scrollTo(0, 500)); await p.waitForTimeout(100)
  const band = await p.evaluate(() => { const r = document.getElementById('band-readonly').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, pos: getComputedStyle(document.getElementById('band-readonly')).position } })
  ok(band.pos === 'sticky' && Math.abs(band.top) < 0.5, `sticky: la banda se queda arriba al desplazar (top ${band.top})`)
  await p.evaluate(() => window.toaster.info('Aviso flotante')); await p.waitForSelector('.g-toast'); await p.waitForTimeout(500)
  const toastTop = await p.evaluate(() => document.querySelector('.g-toast').getBoundingClientRect().top)
  ok(toastTop >= band.bottom, `sticky: el aviso flotante (GToaster arriba) queda por debajo de la banda (${Math.round(toastTop)} ≥ ${Math.round(band.bottom)})`)
  await p.evaluate(() => { document.getElementById('c-create').focus({ preventScroll: true }); window.scrollTo(0, document.getElementById('c-after').getBoundingClientRect().top + window.scrollY + 40) }); await p.waitForTimeout(80)
  await p.evaluate(() => document.getElementById('c-create').scrollIntoView())
  await p.waitForTimeout(80)
  const fTop = await p.evaluate(() => document.getElementById('c-create').getBoundingClientRect().top)
  ok(fTop >= band.bottom - 0.5, `sticky: scroll-padding con la reserva → lo que se trae a la vista no queda tapado (WCAG 2.4.11) (${Math.round(fTop)} ≥ ${Math.round(band.bottom)})`)
  await p.close()
  p = await open({ vh: 400 })
  await p.evaluate(() => __app.toggleBand('readonly')); await settle(p, 500)
  ok((await p.evaluate(() => getComputedStyle(document.getElementById('band-readonly')).position)) === 'static', 'sticky se suelta en visores bajos (≤ 420px de alto): la banda vuelve al flujo')
  await p.close()

  // ============ 10. Cuenta atrás (N3) ============
  p = await open({ clock: true, reducedMotion: 'reduce' })
  await p.evaluate(() => __app.toggleBand('session')); await p.waitForSelector('#band-session')
  const timer = '#band-session .x-notice__timer'
  ok((await p.textContent(timer)) === 'Se cerrará en 6 min.' && await p.evaluate((s) => { const t = document.querySelector(s); return t.getAttribute('role') === 'timer' && t.getAttribute('aria-live') === 'off' }, timer), 'N3: cuenta atrás visible, role="timer" con aria-live="off" (no se lee cada cambio)')
  await p.clock.runFor(100); const n0 = (await live(p)).length
  await p.clock.runFor(7000)
  lv = await live(p)
  ok(lv.length === n0 + 1 && lv.at(-1).ch === 'polite' && lv.at(-1).text === 'Advertencia: Tu sesión está por caducar. Se cerrará en 5 min.', `N3: al cruzar 5 min, 1 anuncio cortés (${JSON.stringify(lv.at(-1))})`)
  await p.clock.runFor(200000)
  ok((await live(p)).length === n0 + 1, 'N3: entre umbrales no se anuncia nada, aunque el texto visible cambie')
  await p.clock.runFor(40000)
  lv = await live(p)
  ok(lv.length === n0 + 2 && /Se cerrará en (60|59|58) s\./.test(lv.at(-1).text), `N3: al cruzar 1 min, segundo anuncio (${lv.at(-1).text})`)
  await p.clock.runFor(70000)
  ok((await p.textContent('#log')) === 'expire: sesión' && (await live(p)).length === n0 + 3, 'N3: umbral de 30 s anunciado y evento expire al llegar a cero')
  await p.close()

  // ============ 11. 320px ============
  p = await open({ vw: 320, vh: 700 })
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= 320), `320px: sin desplazamiento horizontal (scrollWidth ${await p.evaluate(() => document.documentElement.scrollWidth)})`)
  ok(await p.evaluate(() => { const n = document.getElementById('n-error'); const c = n.querySelector('.x-notice__content').getBoundingClientRect(); const a = n.querySelector('.x-notice__actions').getBoundingClientRect(); const x = n.querySelector('.x-notice__close').getBoundingClientRect(); const b = n.getBoundingClientRect(); return a.top >= c.bottom - 0.5 && x.right <= b.right && a.right <= b.right && c.width >= 150 }), '320px: las acciones bajan debajo del texto; el cierre se queda en la esquina; nada se sale')
  ok(await p.evaluate(() => { const b = document.querySelector('#band-maint'); return b.scrollWidth <= b.clientWidth + 1 && b.getBoundingClientRect().width === document.documentElement.clientWidth }), '320px: la banda ocupa el ancho completo y envuelve su texto')
  await p.click('#n-error .x-notice__toggle')
  ok(await p.evaluate(() => { const n = document.getElementById('n-error'); return n.scrollWidth <= n.clientWidth + 1 && document.documentElement.scrollWidth <= 320 }), '320px: un identificador técnico largo se parte dentro del detalle')
  await p.close()

  // ============ 12. RTL ============
  p = await open()
  ok(await p.evaluate(() => { const n = document.getElementById('r-error'); const i = n.querySelector('.x-notice__icon').getBoundingClientRect(); const c = n.querySelector('.x-notice__content').getBoundingClientRect(); const x = n.querySelector('.x-notice__close').getBoundingClientRect(); const a = n.querySelector('.x-notice__actions').getBoundingClientRect(); const cs = getComputedStyle(n.querySelector('.x-notice__box')); return i.left >= c.right - 1 && x.right <= a.left + 1 && a.right <= c.left + 1 && cs.borderRightStyle === 'solid' && cs.borderRightWidth === '4px' && cs.borderLeftWidth === '1px' }),
    'RTL: icono y marca a la derecha, acciones y cierre a la izquierda (propiedades lógicas)')
  await p.click('#r-error .x-notice__toggle')
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('#r-error pre')).direction === 'ltr'), 'RTL: el detalle técnico se lee de izquierda a derecha')
  await p.close()

  // ============ 13. Movimiento reducido ============
  p = await open({ vh: 700, reducedMotion: 'reduce' })
  await p.evaluate(() => window.scrollTo(0, 0)); await p.evaluate(() => document.querySelector('#t-slow').focus())
  await startSample(p, 'h1', 300)
  await p.evaluate(() => __app.toggleBand('offline'))
  fr = await endSample(p)
  ok(new Set(fr.map((f) => Math.round(f[0]))).size <= 2 && !(await p.evaluate(() => document.getElementById('band-offline').getAnimations().length)), `Movimiento reducido: la banda aparece en un cuadro, sin animación (${new Set(fr.map((f) => Math.round(f[0]))).size} posiciones)`)
  await p.evaluate(() => document.getElementById('b-offline').scrollIntoView({ block: 'center' })); await p.waitForTimeout(80)
  await p.focus('#b-session')
  await startSample(p, '#b-session', 300)
  await p.keyboard.press('Enter')
  fr = await endSample(p)
  ok(spread(fr.map((f) => f[0])) <= TOL && (await p.evaluate(() => window.__pins.at(-1).pin)) === 'above', `Movimiento reducido: la compensación sigue (Δ ${spread(fr.map((f) => f[0])).toFixed(2)}px)`)
  ok((await live(p)).length === 2, 'Movimiento reducido: los anuncios no cambian')
  await p.close()

  // ============ 14. forced-colors (solo Chromium lo emula) ============
  if (engine === 'chromium') {
    p = await open({ forcedColors: 'active' })
    ok(await p.evaluate(() => { const c = (i) => getComputedStyle(document.querySelector('#' + i + ' .x-notice__box')); return c('g-error').borderInlineStartStyle === 'solid' && c('g-error').borderInlineStartWidth === '4px' && c('g-warning').borderInlineStartStyle === 'dashed' && c('g-info').borderTopWidth === '1px' && matchMedia('(forced-colors: active)').matches }),
      'forced-colors: el contorno y la marca de tipo son bordes reales (sólido / discontinuo) y sobreviven')
    ok(await p.evaluate(() => { const s = document.querySelector('#g-error .x-notice__icon svg'); return getComputedStyle(s).stroke !== 'none' && s.getBoundingClientRect().width >= 12 }), 'forced-colors: el icono (currentColor) sigue visible')
    await p.close()
  } else notes.push('forced-colors no se emula en este motor')

  report.push({ engine, pass, fails, notes, errs })
  await b.close()
}
server.close()
let bad = 0
for (const r of report) {
  console.log(`\n${r.engine}: ${r.pass} ok, ${r.fails.length} fallos`)
  for (const f of r.fails) { bad++; console.log('  NO  ' + f) }
  for (const n of r.notes) console.log('  nota: ' + n)
  for (const e of r.errs) { bad++; console.log('  consola: ' + e) }
}
process.exit(bad ? 1 : 0)
