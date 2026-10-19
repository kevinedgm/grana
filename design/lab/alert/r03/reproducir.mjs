// Reproducción del reporte del usuario (2026-10-18) sobre la isla REAL del playground (kiwi, alert r03).
// Recorre el ciclo como una persona que no conoce el contrato y escribe lo que ve, lo que pasa y lo que se mide.
// Ejecutar: node design/lab/alert/r03/reproducir.mjs   (requiere `npm run build`; GRANA_PW_PORT, por defecto 4213)
// ENGINES=chromium (por defecto) · SHOTS=1 guarda capturas en r03/capturas/ (no se versionan).
import http from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4213)
const VUE = await readFile(join(ROOT, 'node_modules/vue/dist/vue.global.js'), 'utf8')
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(path))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const URL_PG = `http://127.0.0.1:${PORT}/packages/vue/playground/index.html`
const SHOTS = process.env.SHOTS ? fileURLToPath(new URL('./capturas/', import.meta.url)) : null
if (SHOTS) await mkdir(SHOTS, { recursive: true })

// Lo que una persona ve de la isla en este momento
const look = () => {
  const root = document.querySelector('.g-status-island')
  const shape = root.querySelector('.g-status-island__shape')
  const r = shape.hidden ? null : shape.getBoundingClientRect()
  const vis = (el) => el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'
  const live = [...root.querySelectorAll('.g-status-island__live')].map((x) => x.textContent).filter(Boolean)
  const btns = [...root.querySelectorAll('.g-status-island__panel button, .g-status-island__panel a')].filter(vis).map((b) => (b.textContent.trim() || b.getAttribute('aria-label')))
  const summary = root.querySelector('.g-status-island__summary')
  const visibleText = summary ? [...summary.childNodes].map((n) => (n.nodeType === 3 ? n.textContent : (n.classList && (n.classList.contains('g-status-island__sr') || getComputedStyle(n).position === 'absolute') ? '' : n.innerText))).join('').trim() : ''
  return {
    form: root.dataset.form, type: root.dataset.type || null,
    rect: r && { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    visibleText, accessibleName: summary ? summary.textContent.trim() : '',
    title: summary ? summary.getAttribute('title') : null,
    buttons: btns, live, focus: document.activeElement && (document.activeElement.id || document.activeElement.className || document.activeElement.tagName),
    state: { ...window.gStatus.state }
  }
}
// Muestreo por cuadro de la superficie durante `ms` tras ejecutar `fn` (para medir lo «abrupto»)
const film = async (p, fn, ms = 420) => p.evaluate(async ({ fn, ms }) => {
  const shape = document.querySelector('.g-status-island__shape')
  const frames = []
  const t0 = performance.now()
  const tick = () => {
    const cs = getComputedStyle(shape)
    const r = shape.hidden ? { width: 0, height: 0 } : shape.getBoundingClientRect()
    frames.push({ t: Math.round(performance.now() - t0), w: Math.round(r.width), h: Math.round(r.height), o: +(+cs.opacity).toFixed(2), s: cs.scale })
    if (performance.now() - t0 < ms) requestAnimationFrame(tick)
  }
  // eslint-disable-next-line no-new-func
  new Function(fn)()
  requestAnimationFrame(tick)
  await new Promise((r) => setTimeout(r, ms + 60))
  return frames
}, { fn, ms })

const steps = []
const step = (n, quien, espera, pasa, medido, manda) => { steps.push({ n, quien, espera, pasa, medido, manda }); console.log(`\n[${n}] ${quien}\n  espera: ${espera}\n  pasa:   ${pasa}\n  medido: ${JSON.stringify(medido)}\n  manda:  ${manda}`) }

for (const engine of (process.env.ENGINES || 'chromium').split(',')) {
  console.log(`\n================ ${engine}`)
  const b = await pw[engine].launch()
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } })
  const p = await ctx.newPage()
  await p.route('https://unpkg.com/vue@3/dist/vue.global.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: VUE }))
  await p.goto(URL_PG + '#sec-status')
  await p.waitForFunction(() => window.gStatus && document.querySelector('.g-status-island.is-ready'))
  await p.locator('#st-save').scrollIntoViewIfNeeded()
  const shot = async (name) => { if (SHOTS) await p.screenshot({ path: join(SHOTS, `${engine}-${name}.png`) }) }

  // 1. Llega un error al guardar (y se filma el nacimiento por cuadros desde que la superficie deja de estar oculta)
  await p.evaluate(() => {
    const shape = document.querySelector('.g-status-island__shape'); window.__f = []
    const mo = new MutationObserver(() => {
      if (shape.hidden || window.__t0) return
      window.__t0 = performance.now()
      const tick = () => { const cs = getComputedStyle(shape); const r = shape.getBoundingClientRect(); window.__f.push({ t: Math.round(performance.now() - window.__t0), w: Math.round(r.width), h: Math.round(r.height), o: +(+cs.opacity).toFixed(2), form: document.querySelector('.g-status-island').dataset.form }); if (performance.now() - window.__t0 < 400) requestAnimationFrame(tick) }
      tick()
    })
    mo.observe(shape, { attributes: true })
  })
  await p.locator('#st-save').click()
  await p.waitForTimeout(1500)
  const frames = await p.evaluate(() => window.__f)
  const s1 = await p.evaluate(look)
  await shot('1-error-abre-sola')
  step(1, 'Pulsa «Guardar»; el servidor falla.', 'Ver un error cerca del botón; poder cerrarlo.',
    `La isla nace ya abierta (${s1.form}) arriba al centro, a ${s1.rect && s1.rect.y}px del borde, ${s1.rect && s1.rect.w}×${s1.rect && s1.rect.h}px, lejos del botón; junto a «Guardar» aparece una cápsula «No se guardó». Botones en el panel: ${s1.buttons.join(' · ')}. Ningún botón dice «Cerrar».`,
    s1, '#319 apertura automática (D3), #323 marca, #320 anuncio enérgico')
  const wide = frames.filter((f) => f.o > 0.05 && f.w > s1.rect.w * 1.2)
  step('1b', 'El mismo nacimiento, cuadro a cuadro.', 'Ver de dónde sale y hacia dónde crece.',
    `Cuadros visibles más anchos que la isla abierta: ${wide.length} (hasta ${Math.max(0, ...wide.map((f) => f.w))}px de ancho, opacidad hasta ${Math.max(0, ...wide.map((f) => f.o))}). La superficie se pinta sin tamaño (--_island-w aún sin escribir: inline-size cae a auto = todo el ancho) y luego salta a ${s1.rect.w}px.`,
    { frames }, 'DEFECTO frente a #324 (nacer = fundido + escala a su tamaño) y D4 (continuidad)')
  // 2. La persona espera a que se cierre
  await p.waitForTimeout(8000)
  const s2 = await p.evaluate(look)
  step(2, 'Lee el error y espera.', 'Que se vaya sola al cabo de unos segundos, como un aviso.',
    `A los 8 s sigue ${s2.form}. Nada indica que no se cerrará sola ni cómo cerrarla.`, { form: s2.form, rect: s2.rect }, '#319 «nunca se cierra por tiempo»; status.md «Rechazados: cierre automático»')

  // 3. Pulsa fuera
  await p.mouse.click(40, 700)
  await p.waitForTimeout(400)
  const s3 = await p.evaluate(look)
  await shot('3-pulsar-fuera')
  step(3, 'Pulsa fuera de la isla.', 'Que se cierre.',
    `Se repliega a ${s3.form} (${s3.rect && s3.rect.w}×${s3.rect && s3.rect.h}px) con el título visible: «${s3.visibleText}». No se va.`, s3, '#319 «cerrar la abierta» → compacta mientras no esté reconocida')

  // 4. Entendido
  await p.locator('.g-status-island__summary').click()
  await p.waitForTimeout(400)
  await p.locator('.g-status-island__ack').click()
  await p.waitForTimeout(500)
  const s4 = await p.evaluate(look)
  await shot('4-punto')
  step(4, 'La abre y pulsa «Entendido».', '«Entendido» = cerrar; que desaparezca.',
    `Queda un círculo oscuro de ${s4.rect && s4.rect.w}×${s4.rect && s4.rect.h}px con el icono del tipo, sin texto visible («${s4.visibleText}»), sin title ni pista al pasar (title=${s4.title}). Solo el lector oye «${s4.accessibleName}».`, s4, '#316 D2 «un solo sitio con memoria», #319 punto: «no desaparece mientras dure alguna condición»')

  // 4b. Pasa el puntero y enfoca el punto
  await p.locator('.g-status-island__summary').hover()
  await p.waitForTimeout(900)
  const tip = await p.evaluate(() => ({ tooltips: [...document.querySelectorAll('[role=tooltip]')].filter((t) => t.getClientRects().length && getComputedStyle(t).visibility !== 'hidden' && t.closest('.g-status-island')).length, cursor: getComputedStyle(document.querySelector('.g-status-island__summary')).cursor }))
  step('4b', 'Pasa el puntero por el punto.', 'Una pista de qué es.', `Ninguna pista (${tip.tooltips} tooltips), cursor «${tip.cursor}». El punto no dice que guarda un error vigente ni que se puede abrir.`, tip, 'status.md: el texto queda con el patrón oculto; no hay pista visual')

  // 5. Reintentar falla (casilla «El servidor falla» marcada por defecto)
  await p.locator('.g-status-island__summary').click()
  await p.waitForTimeout(300)
  await p.locator('.g-status-item__action').click()
  await p.waitForTimeout(1200)
  const s5 = await p.evaluate(look)
  step(5, 'Abre el punto y pulsa «Reintentar».', 'Que se arregle o, al menos, que pueda quitarlo.',
    `Gira ~0,9 s y vuelve el mismo error (la demo trae «El servidor falla» marcado: el reintento falla siempre). Forma ${s5.form}; botones: ${s5.buttons.join(' · ')}. No hay descartar: el error no es «dismissible».`, s5, '#318 rechazo → announce(id) → apertura automática otra vez')

  // 6. Otro suceso: sin conexión y vuelve
  await p.mouse.click(40, 700)
  await p.locator('.g-status-island__summary').click(); await p.waitForTimeout(250)
  await p.locator('.g-status-island__ack').click(); await p.waitForTimeout(400)
  await p.locator('#st-offline').click(); await p.waitForTimeout(500)
  const s6 = await p.evaluate(look)
  await p.locator('#st-online').click(); await p.waitForTimeout(500)
  const s6b = await p.evaluate(look)
  step(6, 'Pulsa «Sin conexión» y luego «Vuelve la conexión».', 'Que el aviso de conexión se vaya al volver.',
    `Con el punto puesto llega «Sin conexión»: pasa a ${s6.form} mostrando «${s6.visibleText}» (el error sigue primero en el orden, el aviso nuevo no se ve en el resumen). Al volver la conexión: ${s6b.form}, «${s6b.visibleText}»; «Conexión restablecida» se queda hasta pulsar «Entendido».`, { s6, s6b }, '#319 orden por gravedad (el resumen muestra el error, no lo nuevo); resolve → success persistent:false se queda hasta reconocer')

  // 7. Mantenimiento descartable, info, success
  await p.locator('#st-maint').click(); await p.waitForTimeout(400)
  await p.locator('#st-success').click(); await p.waitForTimeout(400)
  const s7 = await p.evaluate(look)
  step(7, 'Añade mantenimiento (info) y un éxito con enlace.', 'Ver cada uno al llegar.',
    `Resumen: «${s7.visibleText}» (+N); lo nuevo no se ve sin abrir. ${s7.state.count} condiciones.`, s7, '#319 el resumen muestra la más grave, no la más nueva')

  // 8. La aplicación resuelve el error: desmarcar el fallo y reintentar
  await p.locator('#st-save-fails').uncheck()
  await p.locator('.g-status-island__summary').click(); await p.waitForTimeout(300)
  await p.locator('.g-status-item__action').first().click(); await p.waitForTimeout(1300)
  const s8 = await p.evaluate(look)
  step(8, 'El servidor vuelve; «Reintentar».', 'Que el error desaparezca.',
    `El error pasa a «Factura guardada…» (success) en el mismo sitio y se queda hasta «Entendido». Forma ${s8.form}, ${s8.state.count} condiciones.`, s8, '#318 resolución en el sitio; persistent:false')

  // 9. Entendido con varias: mantenimiento queda → punto
  await p.locator('.g-status-island__ack').click(); await p.waitForTimeout(500)
  const s9 = await p.evaluate(look)
  step(9, '«Entendido» con varias.', 'Que se cierre todo.', `Se van los éxitos; queda ${s9.form} por ${s9.state.count} condición(es) (mantenimiento, descartable solo desde dentro).`, s9, '#319')
  await shot('9-punto-mantenimiento')
  await ctx.close()

  // 10. Móvil
  const m = await b.newContext({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: engine !== 'firefox' })
  const mp = await m.newPage()
  await mp.route('https://unpkg.com/vue@3/dist/vue.global.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: VUE }))
  await mp.goto(URL_PG + '#sec-status')
  await mp.waitForFunction(() => window.gStatus && document.querySelector('.g-status-island.is-ready'))
  await mp.evaluate(() => window.gStatus.error('m', 'No se pudo guardar la factura', { description: 'El servidor no respondió.', action: { label: 'Reintentar', onClick () {} } }))
  await mp.waitForTimeout(500)
  const s10 = await mp.evaluate(look)
  await mp.locator('.g-status-island__summary').click(); await mp.waitForTimeout(500)
  const sheet = await mp.evaluate(() => { const d = document.querySelector('.g-status-sheet'); return d && { open: d.open, h: Math.round(d.getBoundingClientRect().height) } })
  step(10, 'Móvil (375px): llega un error.', 'Verlo.', `Queda ${s10.form} arriba (${s10.rect && s10.rect.w}×${s10.rect && s10.rect.h}px); al tocar, hoja ${JSON.stringify(sheet)}. Igual que en escritorio, tras «Entendido» queda el punto.`, { s10, sheet }, '#322 móvil: solo la abre la persona')
  if (SHOTS) await mp.screenshot({ path: join(SHOTS, `${engine}-10-movil.png`) })
  await m.close()
  await b.close()
}
server.close()
