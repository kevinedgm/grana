// Verificación del prototipo de la galería (kiwi r01): base, A, B, C y el visor común en Chromium, Firefox y WebKit.
// Ejecutar desde la raíz: node design/lab/gallery/r01/verificar.mjs
//   Puerto 4232 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  PARTS=base,viewer,A,B,C,widths  VERBOSE=1  SHOTS=1 (capturas en el scratchpad indicado por SHOTS_DIR)
// Requiere packages/vue/dist/grana.css (npm run build). Solo lee; no toca packages/.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4232)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    const data = await readFile(path)
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(data)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/gallery/r01/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'base,viewer,A,B,C,widths').split(',')
const V = !!process.env.VERBOSE
const SHOTS = process.env.SHOTS_DIR
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }

async function open (b, qs, opts = {}) {
  const { vw = 1440, vh = 900, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/404|Failed to load resource|data:image\/png/.test(m.text())) errs.push(m.text()) })
  p.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/fonts.css')) errs.push(r.status() + ' ' + r.url()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE + qs)
  await p.waitForFunction(() => window.__gal && window.__gal.ready)
  await settle(p)
  p.__errs = errs; p.__ctx = context
  return p
}
const settle = (p, ms = 40) => p.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms)
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const active = (p) => p.evaluate(() => { const a = document.activeElement; return a ? (a.className + '|' + (a.dataset.i ?? '') + '|' + (a.getAttribute('aria-label') || '')) : '' })
const txt = (p, sel) => p.evaluate((sel) => document.querySelector(sel)?.textContent.trim() ?? null, sel)
const close = async (p, eng, part, label) => { rec(eng, part, `consola limpia (${label})`, p.__errs.length === 0, p.__errs.slice(0, 2).join(' | ')); await p.__ctx.close() }
const shot = async (p, name) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false }) }
const minTarget = (p, sel) => p.evaluate((sel) => Math.min(...[...document.querySelectorAll(sel)].filter((e) => e.offsetParent || e.getClientRects().length).map((e) => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height) })), sel)

for (const eng of ENGINES) {
  const b = await pw[eng].launch()

  // ---------- Base: estructura y mejora progresiva ----------
  if (PARTS.includes('base')) {
    const p = await open(b, '?c=base')
    rec(eng, 'base', 'una lista con 10 miniaturas', await p.evaluate(() => document.querySelectorAll('#gal ul > li .gal__thumb').length === 10))
    rec(eng, 'base', 'miniaturas = enlaces con href a la foto grande (sin JS funcionan)', await p.evaluate(() => [...document.querySelectorAll('.gal__thumb')].every((a) => a.tagName === 'A' && a.getAttribute('href').startsWith('data:image'))))
    rec(eng, 'base', 'nombre accesible de cada miniatura = alt de la aplicación', await p.evaluate(() => [...document.querySelectorAll('.gal__thumb img')].every((i) => i.alt.length > 8)))
    rec(eng, 'base', 'recuento visible «10 fotos» y título h2', (await txt(p, '.gal__total')) === '10 fotos' && await p.evaluate(() => document.querySelector('#gal h2')?.id === 'gal-title'))
    rec(eng, 'base', 'carga diferida salvo las 4 primeras', await p.evaluate(() => { const im = [...document.querySelectorAll('.gal__thumb img')]; return im.slice(0, 4).every((i) => !i.hasAttribute('loading')) && im.slice(4).every((i) => i.getAttribute('loading') === 'lazy') }))
    await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab')
    // Llega a una miniatura con Tab y su foco es visible
    await p.evaluate(() => document.querySelector('.gal__thumb').focus())
    const ring = await p.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 })
    rec(eng, 'base', 'foco visible en la miniatura (≥ 2px)', ring)
    rec(eng, 'base', 'sin desplazamiento horizontal a 1440', !(await overflow(p)))
    await shot(p, `${eng}-base`)
    await close(p, eng, 'base', '1440')
  }

  // ---------- Visor: teclado, anuncios, foco devuelto, gesto, zoom, error ----------
  if (PARTS.includes('viewer')) {
    const p = await open(b, '?c=base')
    await p.evaluate(() => document.querySelector('.gal__thumb[data-i="2"]').focus())
    await p.keyboard.press('Enter'); await settle(p, 120)
    rec(eng, 'viewer', 'Enter en la miniatura abre el visor modal', await p.evaluate(() => document.querySelector('.gv').open && document.querySelector('.gv').matches(':modal')))
    rec(eng, 'viewer', 'abre en la foto elegida (3 de 10)', (await txt(p, '.gv__count')) === '3 de 10')
    rec(eng, 'viewer', 'diálogo con nombre', (await p.evaluate(() => document.querySelector('.gv').getAttribute('aria-label'))) === 'Habitación Jardín, galería')
    rec(eng, 'viewer', 'foco inicial en «Foto siguiente» (autofocus, #292)', (await active(p)).includes('Foto siguiente'))
    rec(eng, 'viewer', 'anuncio de llegada con la foto', /^3 de 10\. Lámparas/.test(await txt(p, '.gv__live')), await txt(p, '.gv__live'))
    rec(eng, 'viewer', 'la foto grande lleva el alt', (await p.evaluate(() => document.querySelector('.gv__img').alt)).startsWith('Lámparas'))
    await p.keyboard.press('ArrowRight'); await settle(p)
    rec(eng, 'viewer', '→ pasa a 4 de 10 y lo anuncia', (await txt(p, '.gv__count')) === '4 de 10' && (await txt(p, '.gv__live')).startsWith('4 de 10'))
    await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await settle(p)
    rec(eng, 'viewer', '← vuelve (2 de 10)', (await txt(p, '.gv__count')) === '2 de 10')
    await p.keyboard.press('End'); await settle(p)
    rec(eng, 'viewer', 'Fin → 10 de 10, «siguiente» con aria-disabled', (await txt(p, '.gv__count')) === '10 de 10' && await p.evaluate(() => document.querySelector('.gv__next').getAttribute('aria-disabled') === 'true'))
    await p.keyboard.press('ArrowRight'); await settle(p)
    rec(eng, 'viewer', 'sin vuelta al final: anuncia «Última foto»', (await txt(p, '.gv__count')) === '10 de 10' && (await txt(p, '.gv__live')) === 'Última foto.')
    rec(eng, 'viewer', 'el foco sigue en «siguiente» aunque esté inactivo', (await active(p)).includes('Foto siguiente'))
    await p.keyboard.press('Home'); await settle(p)
    rec(eng, 'viewer', 'Inicio → 1 de 10', (await txt(p, '.gv__count')) === '1 de 10')
    // Tab queda dentro del visor
    const inside = []
    for (let k = 0; k < 6; k++) { await p.keyboard.press('Tab'); inside.push(await p.evaluate(() => !!document.activeElement.closest('.gv') || document.activeElement === document.body)) }
    rec(eng, 'viewer', 'Tab no sale a la página (modal)', inside.every(Boolean))
    // Zoom y Esc escalonado
    await p.click('.gv__zoom'); await settle(p)
    rec(eng, 'viewer', 'ampliar: aria-pressed y nombre «Reducir»', await p.evaluate(() => { const z = document.querySelector('.gv__zoom'); return z.getAttribute('aria-pressed') === 'true' && z.getAttribute('aria-label') === 'Reducir' }))
    await p.keyboard.press('Escape'); await settle(p)
    rec(eng, 'viewer', 'Esc con la foto ampliada solo reduce (visor sigue abierto)', await p.evaluate(() => document.querySelector('.gv').open && !document.querySelector('.gv__stage').classList.contains('is-zoomed')))
    await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await settle(p)
    await p.keyboard.press('Escape'); await settle(p, 80)
    rec(eng, 'viewer', 'Esc cierra', await p.evaluate(() => !document.querySelector('.gv').open))
    rec(eng, 'viewer', 'el foco vuelve a la miniatura de la foto que se veía (4), no a la que abrió (3)', (await active(p)).includes('gal__thumb|3|'), await active(p))
    rec(eng, 'viewer', 'al cerrar la página vuelve a desplazar', await p.evaluate(() => getComputedStyle(document.documentElement).overflow !== 'hidden'))
    // Gesto con puntero: arrastre horizontal
    await p.evaluate(() => window.__gal.open(0, document.querySelector('.gal__thumb'))); await settle(p, 100)
    const box = await p.evaluate(() => { const r = document.querySelector('.gv__stage').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, t: r.top, h: r.height } })
    await p.mouse.move(box.x + box.w * 0.25, box.y); await p.mouse.down(); await p.mouse.move(box.x - box.w * 0.15, box.y, { steps: 6 }); await p.mouse.up(); await settle(p)
    rec(eng, 'viewer', 'deslizar a la izquierda pasa a la siguiente', (await txt(p, '.gv__count')) === '2 de 10')
    await p.mouse.move(box.x, box.t + 10); await p.mouse.down(); await p.mouse.move(box.x + 5, box.t + box.h - 10, { steps: 6 }); await p.mouse.up(); await settle(p, 80)
    rec(eng, 'viewer', 'deslizar hacia abajo cierra', await p.evaluate(() => !document.querySelector('.gv').open))
    await shot(p, `${eng}-viewer-closed`)
    await close(p, eng, 'viewer', 'teclado')

    // Imagen que falla
    const pb = await open(b, '?c=base&broken=1')
    await pb.evaluate(() => window.__gal.open(3, document.querySelector('.gal__thumb[data-i="3"]'))); await settle(pb, 150)
    rec(eng, 'viewer', 'foto que falla: aviso con el alt, sin hueco mudo', await pb.evaluate(() => document.querySelector('.gv__stage').classList.contains('is-broken') && document.querySelector('.gv__broken-text').textContent.includes('No se pudo cargar')))
    rec(eng, 'viewer', 'miniatura que falla marcada', await pb.evaluate(() => document.querySelector('.gal__thumb[data-i="3"]').classList.contains('is-broken')))
    await close(pb, eng, 'viewer', 'error')

    // Una sola foto: sin flechas, foco en cerrar
    const p1 = await open(b, '?c=base&one=1')
    await p1.evaluate(() => window.__gal.open(0, document.querySelector('.gal__thumb'))); await settle(p1, 100)
    rec(eng, 'viewer', 'una sola foto: sin anterior/siguiente y foco en cerrar', await p1.evaluate(() => document.querySelector('.gv__prev').hidden && document.querySelector('.gv__next').hidden) && (await active(p1)).includes('Cerrar galería'))
    rec(eng, 'viewer', 'una sola foto: «1 foto»', (await txt(p1, '.gal__total')) === '1 foto')
    await close(p1, eng, 'viewer', 'una')

    // RTL: las flechas se espejan
    const pr = await open(b, '?c=base&dir=rtl')
    await pr.evaluate(() => window.__gal.open(4, document.querySelector('.gal__thumb[data-i="4"]'))); await settle(pr, 100)
    await pr.keyboard.press('ArrowLeft'); await settle(pr)
    rec(eng, 'viewer', 'RTL: ← avanza (6 de 10)', (await txt(pr, '.gv__count')) === '6 de 10')
    await pr.keyboard.press('ArrowRight'); await pr.keyboard.press('ArrowRight'); await settle(pr)
    rec(eng, 'viewer', 'RTL: → retrocede (4 de 10)', (await txt(pr, '.gv__count')) === '4 de 10')
    rec(eng, 'viewer', 'RTL: sin desplazamiento horizontal', !(await overflow(pr)))
    await close(pr, eng, 'viewer', 'rtl')

    // Movimiento reducido: sin desplazamiento, solo fundido
    const pm = await open(b, '?c=base', { reducedMotion: 'reduce' })
    await pm.evaluate(() => window.__gal.open(0, document.querySelector('.gal__thumb'))); await settle(pm, 100)
    await pm.keyboard.press('ArrowRight')
    const mv = await pm.evaluate(() => new Promise((r) => requestAnimationFrame(() => { const s = getComputedStyle(document.querySelector('.gv__img')); r({ tr: s.translate, prop: s.transitionProperty }) })))
    rec(eng, 'viewer', 'reducido: la foto no se desplaza (translate none)', mv.tr === 'none' || mv.tr === '0px' || mv.tr === '', JSON.stringify(mv))
    rec(eng, 'viewer', 'reducido: solo transición de opacidad', !/translate/.test(mv.prop), mv.prop)
    await close(pm, eng, 'viewer', 'reducido')

    // Contraste del visor: tinta sobre el fondo de la zona
    const pc = await open(b, '?c=base')
    await pc.evaluate(() => window.__gal.open(0, document.querySelector('.gal__thumb'))); await settle(pc, 100)
    const cr = await pc.evaluate(() => {
      const rgb = (c) => { const m = c.match(/[\d.]+/g).map(Number); return m.slice(0, 3) }
      const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
      const bg = rgb(getComputedStyle(document.querySelector('.gv')).backgroundColor)
      return { cap: ratio(rgb(getComputedStyle(document.querySelector('.gv__caption')).color), bg), count: ratio(rgb(getComputedStyle(document.querySelector('.gv__count')).color), bg), btn: ratio(rgb(getComputedStyle(document.querySelector('.gv__next')).color), bg) }
    })
    rec(eng, 'viewer', 'contraste del pie ≥ 4.5:1 sobre el fondo del visor', cr.cap >= 4.5, cr.cap.toFixed(2))
    rec(eng, 'viewer', 'contraste del contador ≥ 4.5:1', cr.count >= 4.5, cr.count.toFixed(2))
    rec(eng, 'viewer', 'icono de los controles ≥ 3:1', cr.btn >= 3, cr.btn.toFixed(2))
    await shot(pc, `${eng}-viewer`)
    if (eng === 'chromium') {
      await pc.emulateMedia({ forcedColors: 'active' }); await settle(pc)
      rec(eng, 'viewer', 'forced-colors: el visor conserva un borde real', await pc.evaluate(() => getComputedStyle(document.querySelector('.gv')).borderStyle === 'solid'))
      await pc.keyboard.press('Escape'); await settle(pc)
      rec(eng, 'viewer', 'forced-colors: la miniatura tiene borde real', await pc.evaluate(() => getComputedStyle(document.querySelector('.gal__thumb'), '::after').borderStyle === 'solid'))
    }
    await close(pc, eng, 'viewer', 'contraste')
  }

  // ---------- A · El recorrido por espacios ----------
  if (PARTS.includes('A')) {
    const p = await open(b, '?c=A')
    rec(eng, 'A', 'índice de espacios = nav con enlaces a cada grupo', await p.evaluate(() => { const a = [...document.querySelectorAll('.gal__index a')]; return a.length === 5 && a.every((x) => document.querySelector(x.getAttribute('href'))) }))
    rec(eng, 'A', 'cada grupo: role=group nombrado por su h3', await p.evaluate(() => [...document.querySelectorAll('.gal__group')].every((g) => g.getAttribute('role') === 'group' && document.getElementById(g.getAttribute('aria-labelledby'))?.tagName === 'H3')))
    rec(eng, 'A', 'índice: nombre incluye el recuento («Baño 2, 2 fotos»)', /Baño.*2 fotos/.test(await p.evaluate(() => document.querySelectorAll('.gal__index a')[1].textContent)))
    await p.click('.gal__index a >> nth=1'); await settle(p, 400)
    const top = await p.evaluate(() => document.querySelector('#gal-g-bano').getBoundingClientRect().top)
    rec(eng, 'A', 'el enlace «Baño» lleva al grupo', top >= -2 && top < 120, Math.round(top))
    await p.evaluate(() => document.querySelector('.gal__thumb[data-i="3"]').click()); await settle(p, 120)
    rec(eng, 'A', 'visor: contador por espacio «Baño · 1 de 2»', (await txt(p, '.gv__count')) === 'Baño · 1 de 2')
    rec(eng, 'A', 'visor: hilo de espacios con el actual marcado', await p.evaluate(() => document.querySelector('.gv__groups button[aria-current="true"]')?.textContent === 'Baño'))
    await p.keyboard.press('PageDown'); await settle(p)
    rec(eng, 'A', 'AvPág salta al siguiente espacio (Terraza · 1 de 2)', (await txt(p, '.gv__count')) === 'Terraza · 1 de 2' && (await txt(p, '.gv__live')).startsWith('Terraza, 1 de 2'))
    await p.keyboard.press('ArrowLeft'); await settle(p)
    rec(eng, 'A', '← cruza al espacio anterior (Baño · 2 de 2)', (await txt(p, '.gv__count')) === 'Baño · 2 de 2')
    await p.click('.gv__groups button >> text=Vista'); await settle(p)
    rec(eng, 'A', 'el hilo salta al espacio pulsado', (await txt(p, '.gv__count')) === 'Vista · 1 de 2')
    await p.keyboard.press('Escape'); await settle(p, 80)
    rec(eng, 'A', 'al cerrar, foco en la miniatura de la foto vista (Vista)', (await active(p)).includes('gal__thumb|7|'))
    rec(eng, 'A', 'sin desplazamiento horizontal a 1440', !(await overflow(p)))
    await shot(p, `${eng}-A`)
    await close(p, eng, 'A', '1440')
  }

  // ---------- B · La tira ----------
  if (PARTS.includes('B')) {
    const p = await open(b, '?c=B')
    rec(eng, 'B', 'región con aria-roledescription=carrusel y diapositivas «n de 10»', await p.evaluate(() => document.querySelector('#gal').getAttribute('aria-roledescription') === 'carrusel' && document.querySelectorAll('.gal__slide[aria-roledescription="diapositiva"]').length === 10 && document.querySelector('.gal__slide').getAttribute('aria-label') === '1 de 10'))
    rec(eng, 'B', 'una sola parada de Tab en la tira (tabindex itinerante)', await p.evaluate(() => [...document.querySelectorAll('.gal__slide .gal__thumb')].filter((t) => t.tabIndex === 0).length === 1))
    rec(eng, 'B', 'sin autoavance (sin temporizador): sigue en 1 / 10 tras 1,5 s', await p.evaluate(() => new Promise((r) => setTimeout(() => r(document.querySelector('#gal-out').textContent === '1 / 10'), 1500))))
    await p.click('.gal__next'); await settle(p, 500)
    rec(eng, 'B', '«siguiente» mueve la tira y lo anuncia', (await txt(p, '#gal-out')) === '2 / 10' && (await txt(p, '#gal-live')).startsWith('2 de 10'))
    await p.evaluate(() => document.querySelector('.gal__slide.is-current .gal__thumb').focus())
    await p.keyboard.press('ArrowRight'); await settle(p, 500)
    rec(eng, 'B', '→ en la diapositiva mueve el foco y la actual (3)', (await active(p)).includes('gal__thumb|2|') && (await txt(p, '#gal-out')) === '3 / 10')
    await p.keyboard.press('End'); await settle(p, 900)
    rec(eng, 'B', 'Fin → 10 / 10', (await txt(p, '#gal-out')) === '10 / 10')
    // La rueda/arrastre mueve la actual sin anunciar
    await p.evaluate(() => { document.querySelector('#gal-live').textContent = ''; const s = document.querySelector('.gal__strip'); s.scrollTo({ left: 0, behavior: 'instant' }) }); await settle(p, 200)
    rec(eng, 'B', 'desplazar a mano actualiza «1 / 10» sin anuncio', (await txt(p, '#gal-out')) === '1 / 10' && (await txt(p, '#gal-live')) === '')
    // Un estado, dos profundidades
    await p.evaluate(() => document.querySelector('.gal__thumb[data-i="1"]').click()); await settle(p, 120)
    rec(eng, 'B', 'tocar una diapositiva abre el visor en esa foto', (await txt(p, '.gv__count')) === '2 de 10')
    await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await settle(p)
    await p.keyboard.press('Escape'); await settle(p, 600)
    rec(eng, 'B', 'al cerrar, la tira queda en la foto vista (5 / 10) y con el foco', (await txt(p, '#gal-out')) === '5 / 10' && (await active(p)).includes('gal__thumb|4|'))
    const vis = await p.evaluate(() => { const s = document.querySelector('.gal__strip').getBoundingClientRect(); const r = document.querySelector('.gal__thumb[data-i="4"]').getBoundingClientRect(); return r.left >= s.left - 2 && r.right <= s.right + 2 })
    rec(eng, 'B', 'la foto vista queda a la vista en la tira', vis)
    rec(eng, 'B', 'la tira desplaza dentro: sin desplazamiento horizontal de la página', !(await overflow(p)))
    await shot(p, `${eng}-B`)
    await close(p, eng, 'B', '1440')
  }

  // ---------- C · Se abre en su sitio ----------
  if (PARTS.includes('C')) {
    const p = await open(b, '?c=C&set=restaurante')
    await p.evaluate(() => document.querySelector('.gal__thumb[data-i="1"]').focus())
    await p.keyboard.press('Enter'); await settle(p, 200)
    rec(eng, 'C', 'Enter abre el detalle en la página (sin modal)', await p.evaluate(() => !!document.querySelector('#gal-detail') && !document.querySelector('.gv').open))
    rec(eng, 'C', 'aria-expanded en la miniatura y aria-controls al panel', await p.evaluate(() => { const t = document.querySelector('.gal__thumb[data-i="1"]'); return t.getAttribute('aria-expanded') === 'true' && t.getAttribute('aria-controls') === 'gal-detail' }))
    rec(eng, 'C', 'el panel es región con nombre y recibe el foco', (await active(p)).includes('gal__detail') && await p.evaluate(() => document.getElementById(document.querySelector('#gal-detail').getAttribute('aria-labelledby')).textContent.startsWith('Tlayuda')))
    const rowOk = await p.evaluate(() => { const d = document.querySelector('.gal__detail-row').getBoundingClientRect(); const t = document.querySelector('.gal__thumb[data-i="1"]').getBoundingClientRect(); return d.top > t.bottom - 1 })
    rec(eng, 'C', 'el panel se inserta debajo de la fila de su miniatura', rowOk)
    await p.keyboard.press('ArrowRight'); await settle(p, 200)
    rec(eng, 'C', '→ en el panel pasa al siguiente plato y lo anuncia', (await txt(p, '.gal__detail-count')) === '3 de 6' && (await txt(p, '#gal-dlive')).startsWith('3 de 6'))
    rec(eng, 'C', 'aria-expanded sigue a la foto del panel', await p.evaluate(() => document.querySelector('.gal__thumb[aria-expanded="true"]').dataset.i === '2'))
    await p.click('.gal__dfull'); await settle(p, 120)
    rec(eng, 'C', '«Pantalla completa» abre el visor en el mismo plato', (await txt(p, '.gv__count')) === '3 de 6')
    await p.keyboard.press('ArrowRight'); await settle(p)
    await p.keyboard.press('Escape'); await settle(p, 200)
    rec(eng, 'C', 'al cerrar el visor, el panel queda en el plato visto y el foco en «Pantalla completa»', (await txt(p, '.gal__detail-count')) === '4 de 6' && (await active(p)).includes('gal__dfull'))
    await p.evaluate(() => document.querySelector('#gal-detail').focus())
    await p.keyboard.press('Escape'); await settle(p, 100)
    rec(eng, 'C', 'Esc en el panel lo cierra y devuelve el foco a su miniatura', await p.evaluate(() => !document.querySelector('#gal-detail')) && (await active(p)).includes('gal__thumb|3|'))
    rec(eng, 'C', 'sin desplazamiento horizontal a 1440', !(await overflow(p)))
    await p.evaluate(() => document.querySelector('.gal__thumb[data-i="0"]').click()); await settle(p, 200)
    await shot(p, `${eng}-C`)
    await close(p, eng, 'C', '1440')
  }

  // ---------- Anchos: 390, 320 y 400 % (320×256), táctil ----------
  if (PARTS.includes('widths')) {
    for (const c of ['base', 'A', 'B', 'C']) {
      for (const [vw, vh, label] of [[390, 844, '390'], [320, 640, '320'], [320, 256, '400 %']]) {
        const p = await open(b, `?c=${c}`, { vw, vh, hasTouch: eng !== 'firefox', isMobile: eng === 'chromium' })
        rec(eng, 'widths', `${c} · sin desplazamiento horizontal a ${label}`, !(await overflow(p)))
        if (c === 'C') { await p.evaluate(() => document.querySelector('.gal__thumb[data-i="1"]').click()); await settle(p, 200); rec(eng, 'widths', `C · panel abierto sin desbordar a ${label}`, !(await overflow(p))) }
        await p.evaluate(() => window.__gal.open(1, document.querySelector('.gal__thumb'))); await settle(p, 120)
        const ctl = await p.evaluate(() => ['.gv__close', '.gv__prev', '.gv__next', '.gv__zoom'].every((s) => { const r = document.querySelector(s).getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.bottom <= innerHeight + 1 && r.left >= 0 && r.right <= innerWidth + 1 }))
        rec(eng, 'widths', `${c} · visor: cerrar, anterior, siguiente y ampliar a la vista a ${label}`, ctl)
        const t = await minTarget(p, '.gv .g-btn--icon:not([hidden])')
        rec(eng, 'widths', `${c} · visor: controles ≥ ${eng === 'chromium' ? 44 : 24}px a ${label}`, t >= (eng === 'chromium' ? 43.5 : 24), Math.round(t))
        const imgOk = await p.evaluate(() => { const r = document.querySelector('.gv__img').getBoundingClientRect(); return r.height > 20 && r.width > 20 })
        rec(eng, 'widths', `${c} · visor: la foto se ve a ${label}`, imgOk)
        if (label === '390') await shot(p, `${eng}-${c}-390-viewer`)
        await p.keyboard.press('Escape'); await settle(p)
        if (label === '390') await shot(p, `${eng}-${c}-390`)
        await close(p, eng, 'widths', `${c} ${label}`)
      }
    }
  }
  await b.close()
}

server.close()
const by = {}
for (const r of R) { const k = r.eng; by[k] ??= { ok: 0, all: 0 }; by[k].all++; if (r.ok) by[k].ok++ }
const tot = R.filter((r) => r.ok).length
console.log(Object.entries(by).map(([k, v]) => `${k}: ${v.ok}/${v.all}`).join(' · '))
console.log(`Total: ${tot}/${R.length}`)
process.exit(tot === R.length ? 0 : 1)
