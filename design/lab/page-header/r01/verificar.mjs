// Verificación del prototipo del encabezado de página (kiwi r01): base y conceptos A, B y C en Chromium, Firefox y WebKit.
// Ejecutar desde la raíz: node design/lab/page-header/r01/verificar.mjs
//   Puerto 4215 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  PARTS=base,A,B,C,zone  VERBOSE=1
// Requiere packages/vue/dist (npm run build) para los tokens y la fuente. Solo lee; no toca packages/.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4215)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(path))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/page-header/r01/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'base,A,B,C,BC,zone').split(',')
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }
const near = (a, b, t = 1.5) => Math.abs(a - b) <= t

async function open (b, qs, opts = {}) {
  const { vw = 1280, vh = 800, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE + qs)
  await p.waitForFunction(() => window.__ph && window.__ph.ready)
  await settle(p)
  p.__errs = errs
  p.__ctx = context
  return p
}
const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 40))))))
const scroll = async (p, y) => { await p.evaluate((y) => scrollTo(0, y), y); await settle(p); await settle(p) }
const st = (p) => p.evaluate(() => { const s = { ...window.__ph }; s.pending = !!s.pending; return s })
const rect = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height } }, sel)
const docTop = (p, sel) => p.evaluate((sel) => document.querySelector(sel).getBoundingClientRect().top + scrollY, sel)
const where = (p) => p.evaluate(() => { const a = document.querySelector('.ph__actions'); return a.closest('.ph__band') ? 'band' : a.closest('.ph__dock') ? 'dock' : a.closest('.ph__base') ? 'base' : a.closest('.ph__head') ? 'head' : '?' })
const pageOverflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const countBtn = (p, name) => p.getByRole('button', { name, exact: true }).count()
// Contraste: color resuelto con un lienzo (sirve para color-mix y oklab en los tres motores)
const contrast = (p, fgSel, fgProp, bgSel, bgProp) => p.evaluate(([fgSel, fgProp, bgSel, bgProp]) => {
  const rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#010203'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]] }
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const a = rgb(getComputedStyle(document.querySelector(fgSel))[fgProp]), b = rgb(getComputedStyle(document.querySelector(bgSel))[bgProp])
  const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x)
  return Math.round(((h + 0.05) / (l + 0.05)) * 100) / 100
}, [fgSel, fgProp, bgSel, bgProp])
// Posición de y para que el h1 quede a medio pasar bajo la franja (A) o bajo el borde (B)
const yForTitle = (p, frac) => p.evaluate((frac) => { const t = document.getElementById('ph-title').getBoundingClientRect(); const S = window.__ph; return Math.round(scrollY + t.bottom - S.top - S.bandH * frac) }, frac)

async function base (b, eng) {
  const P = 'base'
  const p = await open(b, '?c=base')
  rec(eng, P, 'un solo h1 con el nombre de la página', (await p.locator('h1').count()) === 1 && (await p.locator('h1').textContent()) === 'Muestra M-0007')
  rec(eng, P, 'el encabezado no es un banner (solo la barra de la aplicación)', (await p.getByRole('banner').count()) === 1 && !(await p.evaluate(() => document.querySelector('#app-bar').contains(document.querySelector('#ph')))))
  rec(eng, P, 'el encabezado va dentro de main', await p.evaluate(() => !!document.querySelector('main #ph')))
  rec(eng, P, 'la ruta es un nav con nombre dentro del encabezado', await p.evaluate(() => !!document.querySelector('#ph nav[aria-label="Ruta de navegación"]')))
  const order = await p.evaluate(() => { const els = ['.ph-trail', '#ph-title', '.ph__actions', '.ph__content', '[role="tablist"]'].map((s) => document.querySelector(s)); return els.every((e, i) => i === 0 || (els[i - 1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING)) })
  rec(eng, P, 'orden de lectura: ruta → h1 → acciones → contenido → pestañas', order)
  rec(eng, P, 'acciones en un grupo con nombre', (await p.getByRole('group', { name: 'Acciones de la página' }).count()) === 1)
  rec(eng, P, 'cada acción una vez', (await countBtn(p, 'Validar resultados')) === 1 && (await countBtn(p, 'Editar')) === 1)
  await scroll(p, 1200)
  rec(eng, P, 'sin franja: al desplazar, las acciones siguen en la cabecera', (await where(p)) === 'head' && !(await p.evaluate(() => document.querySelector('.ph__band, .ph__dock'))))
  await scroll(p, 0)
  await p.getByRole('tab', { name: 'Resumen' }).focus()
  await p.keyboard.press('ArrowRight')
  rec(eng, P, 'pestañas: → selecciona y enfoca la siguiente', await p.evaluate(() => document.activeElement.textContent === 'Resultados' && document.activeElement.getAttribute('aria-selected') === 'true' && !document.getElementById('p2').hidden))
  rec(eng, P, 'sin desbordamiento horizontal a 1280', !(await pageOverflow(p)))
  rec(eng, P, 'consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.__ctx.close()
  const m = await open(b, '?c=base', { vw: 390, vh: 760, hasTouch: true, ...(eng === 'chromium' ? { isMobile: true } : {}) })
  rec(eng, P, '390 táctil: sin desbordamiento horizontal', !(await pageOverflow(m)))
  const small = await m.evaluate(() => [...document.querySelectorAll('#ph a, #ph button')].filter((e) => e.offsetParent).some((e) => { const r = e.getBoundingClientRect(); return r.height < 43.5 && e.closest('.ph-trail') === null }))
  rec(eng, P, '390 táctil: acciones y pestañas ≥ 44px de alto', !small)
  rec(eng, P, '390: las secundarias pasan a «Más acciones» (estrecho por el ancho del encabezado)', await m.evaluate(() => document.querySelector('#ph').hasAttribute('data-narrow') && getComputedStyle(document.querySelector('.ph__secondary')).display === 'none'))
  await m.__ctx.close()
}

async function A (b, eng) {
  const P = 'A'
  const p = await open(b, '?c=A')
  const s0 = await st(p)
  rec(eng, P, 'arriba: franja oculta (fuera del árbol) y acciones en la cabecera', (await where(p)) === 'head' && (await p.evaluate(() => document.getElementById('ph-band').hidden)) && s0.p === 0)
  const content0 = await docTop(p, '#contenido')
  // a medio pasar: la franja va ligada al desplazamiento
  await scroll(p, await yForTitle(p, 0.5))
  const sm = await st(p)
  rec(eng, P, 'ligada al desplazamiento: con el h1 a medio pasar, 0 < p < 1', sm.p > 0.2 && sm.p < 0.8, sm.p)
  await scroll(p, 700)
  const s1 = await st(p)
  const band = await rect(p, '#ph-band'), ph = await rect(p, '#ph')
  rec(eng, P, 'pasado el h1: p = 1 y las acciones en la franja', s1.p === 1 && (await where(p)) === 'band')
  rec(eng, P, 'la franja empieza bajo la barra de la aplicación (--g-page-header-top)', near(band.top, s1.top), band.top)
  rec(eng, P, 'la franja ocupa el ancho del encabezado, no el de la ventana (no tapa la barra lateral)', near(band.left, ph.left) && near(band.width, ph.width), `${band.left}/${ph.left}`)
  rec(eng, P, 'sin copias: cada acción existe una vez', (await countBtn(p, 'Validar resultados')) === 1 && (await countBtn(p, 'Más acciones')) === 1)
  rec(eng, P, 'el hueco guarda su tamaño: el contenido no se mueve (Δ 0)', near(await docTop(p, '#contenido'), content0, 0.5))
  rec(eng, P, 'orden de lectura estable: las acciones siguen después del h1 y antes del contenido', await p.evaluate(() => { const a = document.querySelector('.ph__actions'); return !!(document.getElementById('ph-title').compareDocumentPosition(a) & 4) && !!(a.compareDocumentPosition(document.querySelector('.ph__content')) & 4) }))
  rec(eng, P, 'reserva de borde: avisos e isla bajan el alto de la franja', near(await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lab-edge-top'))), s1.top + s1.bandH + 8))
  await p.click('#lab-toast-btn')
  const toast = await rect(p, '#lab-toast')
  rec(eng, P, 'el aviso de prueba queda debajo de la franja', toast.top >= band.bottom - 0.5, `${toast.top}/${band.bottom}`)
  await scroll(p, 0)
  rec(eng, P, 'al volver arriba: acciones de vuelta y franja oculta', (await where(p)) === 'head' && (await p.evaluate(() => document.getElementById('ph-band').hidden)))
  rec(eng, P, 'el contenido no se movió en la vuelta', near(await docTop(p, '#contenido'), content0, 0.5))
  // Lo enfocado no se muda
  await p.evaluate(() => document.querySelector('.ph__actions .ph__secondary + .ph__secondary, .ph__actions button:nth-child(2)').focus())
  await scroll(p, 700)
  const sf = await st(p)
  rec(eng, P, 'lo enfocado no se mueve: con el foco en «Editar», las acciones esperan', (await where(p)) === 'head' && sf.deferred >= 1 && (await p.evaluate(() => document.activeElement.textContent.trim() === 'Editar')))
  await p.evaluate(() => document.getElementById('p1').focus({ preventScroll: true }))
  await settle(p)
  rec(eng, P, 'al salir el foco, se mudan', (await where(p)) === 'band')
  // El título de la franja lleva al h1
  await p.click('.ph__band-title')
  await settle(p); await settle(p)
  const h1 = await rect(p, '#ph-title'), s2 = await st(p)
  rec(eng, P, 'el título de la franja lleva el foco al h1, visible bajo la barra', (await p.evaluate(() => document.activeElement.id)) === 'ph-title' && h1.top >= s2.top - 0.5, h1.top)
  rec(eng, P, 'tras ir al h1, la franja se retira', s2.p === 0 && (await where(p)) === 'head')
  rec(eng, P, 'consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.__ctx.close()

  const r = await open(b, '?c=A', { reducedMotion: 'reduce' })
  await scroll(r, await yForTitle(r, 0.3))
  const sr = await st(r)
  rec(eng, P, 'movimiento reducido: sin estados intermedios (p ∈ {0, 1})', sr.p === 0 || sr.p === 1, sr.p)
  await r.__ctx.close()

  const z = await open(b, '?c=A', { vw: 1280, vh: 180 })
  await scroll(z, 700)
  const sz = await st(z)
  rec(eng, P, 'franja > ¼ del alto visible (zoom, apaisado): no aparece', sz.off && sz.p === 0 && (await where(z)) === 'head')
  await z.__ctx.close()

  const m = await open(b, '?c=A', { vw: 390, vh: 760, hasTouch: true, ...(eng === 'chromium' ? { isMobile: true } : {}) })
  await scroll(m, 900)
  rec(eng, P, '390 táctil: franja con las acciones', (await where(m)) === 'band')
  const small = await m.evaluate(() => [...document.querySelectorAll('#ph-band a, #ph-band button')].filter((e) => e.offsetParent).some((e) => { const r = e.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5 }))
  rec(eng, P, '390 táctil: objetivos de la franja ≥ 44 × 44', !small, await m.evaluate(() => [...document.querySelectorAll('#ph-band a, #ph-band button')].map((e) => { const r = e.getBoundingClientRect(); return e.className + ':' + Math.round(r.width) + 'x' + Math.round(r.height) }).join(' ')))
  rec(eng, P, '390: sin desbordamiento horizontal', !(await pageOverflow(m)))
  await m.__ctx.close()

  const t = await open(b, '?c=A&dir=rtl')
  await scroll(t, 700)
  const bt = await rect(t, '#ph-band'), pt = await rect(t, '#ph')
  rec(eng, P, 'RTL: la franja sigue al encabezado', near(bt.left, pt.left) && near(bt.width, pt.width))
  await t.__ctx.close()
}

async function B (b, eng) {
  const P = 'B'
  const p = await open(b, '?c=B')
  rec(eng, P, 'forma estática: acciones en el zócalo, después de las pestañas', (await where(p)) === 'base' && (await p.evaluate(() => !!(document.querySelector('[role="tablist"]').compareDocumentPosition(document.querySelector('.ph__actions')) & 4))))
  const content0 = await docTop(p, '#contenido')
  await scroll(p, 900)
  const s1 = await st(p), ph = await rect(p, '#ph'), base = await rect(p, '#ph-base')
  rec(eng, P, 'pegado: el zócalo queda justo bajo la barra de la aplicación', s1.stuck && near(base.top, s1.top), base.top)
  rec(eng, P, 'el encabezado entero se hunde (no encoge: mismo alto)', near(ph.bottom, base.bottom) && ph.height > base.height * 3)
  rec(eng, P, 'nada se mudó ni se copió', s1.moves === 0 && (await countBtn(p, 'Validar resultados')) === 1)
  rec(eng, P, 'el título compacto aparece y es aria-hidden', s1.p === 1 && (await p.evaluate(() => { const t = document.querySelector('.ph__base-title'); return t.getAttribute('aria-hidden') === 'true' && parseFloat(getComputedStyle(t).opacity) > 0.95 })))
  rec(eng, P, 'el contenido no se movió (Δ 0)', near(await docTop(p, '#contenido'), content0, 0.5))
  rec(eng, P, 'reserva de borde: avisos e isla bajan el alto del zócalo', near(await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lab-edge-top'))), s1.top + s1.baseH + 8))
  await p.getByRole('tab', { name: 'Resultados' }).click()
  await settle(p); await settle(p)
  const s2 = await st(p), base2 = await rect(p, '#ph-base'), body2 = await rect(p, '#contenido')
  rec(eng, P, 'cambiar de pestaña pegado (panel largo): sigue pegado y el panel nuevo empieza bajo el zócalo', s2.stuck && near(base2.top, s2.top) && near(body2.top, base2.bottom, 2) && !(await p.evaluate(() => document.getElementById('p2').hidden)), `${body2.top}/${base2.bottom} stuck=${s2.stuck}`)
  await scroll(p, 900)
  await p.getByRole('tab', { name: 'Historial' }).click()
  await settle(p); await settle(p)
  const base3 = await rect(p, '#ph-base'), body3 = await rect(p, '#contenido')
  rec(eng, P, 'panel corto: la página no da para pegar, pero el panel nuevo queda visible justo bajo el zócalo', near(body3.top, base3.bottom, 2) && base3.top >= 0 && body3.top < 760, `${body3.top}/${base3.bottom}`)
  await p.getByRole('tab', { name: 'Historial' }).focus()
  await p.keyboard.press('ArrowLeft')
  rec(eng, P, 'teclado de pestañas en el zócalo pegado', await p.evaluate(() => document.activeElement.textContent === 'Resultados'))
  await scroll(p, 0)
  rec(eng, P, 'arriba: sin pegar y sin título compacto', !(await st(p)).stuck && (await st(p)).p === 0)
  rec(eng, P, 'consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.__ctx.close()

  const r = await open(b, '?c=B', { reducedMotion: 'reduce' })
  await scroll(r, await r.evaluate(() => { const t = document.getElementById('ph-title').getBoundingClientRect(); return Math.round(scrollY + t.top - window.__ph.top + t.height * 0.3) }))
  const sr = await st(r)
  rec(eng, P, 'movimiento reducido: título compacto sin estados intermedios', sr.p === 0 || sr.p === 1, sr.p)
  await r.__ctx.close()

  const z = await open(b, '?c=B', { vw: 1280, vh: 180 })
  await scroll(z, 900)
  rec(eng, P, 'zócalo > ¼ del alto visible: no se pega', (await st(z)).off && (await z.evaluate(() => getComputedStyle(document.getElementById('ph')).position)) === 'static')
  await z.__ctx.close()

  const m = await open(b, '?c=B', { vw: 390, vh: 760, hasTouch: true, ...(eng === 'chromium' ? { isMobile: true } : {}) })
  await scroll(m, 900)
  rec(eng, P, '390: pegado y sin desbordamiento', (await st(m)).stuck && !(await pageOverflow(m)))
  rec(eng, P, '390: la principal en su icono conserva su nombre', (await countBtn(m, 'Validar resultados')) === 1)
  const small = await m.evaluate(() => [...document.querySelectorAll('#ph-base button')].filter((e) => e.offsetParent).some((e) => { const r = e.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5 }))
  rec(eng, P, '390 táctil: objetivos del zócalo ≥ 44 × 44', !small)
  await m.__ctx.close()
}

async function Cc (b, eng) {
  const P = 'C'
  const p = await open(b, '?c=C')
  const content0 = await docTop(p, '#contenido')
  await scroll(p, 900)
  await p.waitForTimeout(400) // fin del muelle con resorte
  const s1 = await st(p), dock = await rect(p, '#ph-dock'), ph = await rect(p, '#ph')
  const vh = 800
  rec(eng, P, 'pasado el h1: muelle abierto con las acciones', s1.open && (await where(p)) === 'dock')
  rec(eng, P, 'arriba no queda nada del encabezado', ph.bottom <= s1.top)
  rec(eng, P, 'el muelle está abajo, alineado al final del encabezado', dock.bottom <= vh && dock.bottom >= vh - 40 && near(dock.right, ph.right - 24, 2), `${dock.right}/${ph.right}`)
  rec(eng, P, 'sin copias y el contenido no se movió', (await countBtn(p, 'Validar resultados')) === 1 && near(await docTop(p, '#contenido'), content0, 0.5))
  await p.click('#lab-toast-btn')
  await settle(p)
  const toast = await rect(p, '#lab-toast')
  rec(eng, P, 'reserva del borde inferior: el aviso queda encima del muelle', toast.bottom <= dock.top + 0.5, `${toast.bottom}/${dock.top}`)
  await scroll(p, 0)
  await p.waitForTimeout(260)
  rec(eng, P, 'arriba: muelle cerrado (inert, fuera del árbol) y acciones de vuelta', !(await st(p)).open && (await where(p)) === 'head' && (await p.evaluate(() => document.getElementById('ph-dock').hidden)))
  rec(eng, P, 'consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.__ctx.close()

  const r = await open(b, '?c=C', { reducedMotion: 'reduce' })
  rec(eng, P, 'movimiento reducido: el muelle no se desliza', (await r.evaluate(() => getComputedStyle(document.getElementById('ph-dock')).transitionDuration.split(',').every((d) => parseFloat(d) === 0))))
  await r.__ctx.close()

  const m = await open(b, '?c=C', { vw: 390, vh: 760, hasTouch: true, ...(eng === 'chromium' ? { isMobile: true } : {}) })
  await scroll(m, 900)
  await m.waitForTimeout(400) // fin del muelle con resorte
  const dm = await rect(m, '#ph-dock'), pm = await rect(m, '#ph')
  rec(eng, P, '390: barra de borde a borde, abajo', near(dm.left, pm.left) && near(dm.width, pm.width) && near(dm.bottom, 760, 1), JSON.stringify([dm, pm]))
  const small = await m.evaluate(() => [...document.querySelectorAll('#ph-dock button')].filter((e) => e.offsetParent).some((e) => { const r = e.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5 }))
  rec(eng, P, '390 táctil: objetivos del muelle ≥ 44 × 44 y sin desbordamiento', !small && !(await pageOverflow(m)))
  await m.__ctx.close()

  const t = await open(b, '?c=C&dir=rtl')
  await scroll(t, 900)
  const dt = await rect(t, '#ph-dock'), pt = await rect(t, '#ph')
  rec(eng, P, 'RTL: el muelle va al final lógico (izquierda)', near(dt.left, pt.left + 24, 2))
  await t.__ctx.close()
}

async function BC (b, eng) {
  const P = 'B+muelle'
  const d = await open(b, '?c=B&final=C')
  await scroll(d, 900)
  rec(eng, P, 'escritorio: se comporta como B (acciones en el zócalo, sin muelle)', (await st(d)).stuck && (await where(d)) === 'base' && (await d.evaluate(() => document.getElementById('ph-dock').hidden)))
  rec(eng, P, 'consola limpia', d.__errs.length === 0, d.__errs.join(' | '))
  await d.__ctx.close()
  const m = await open(b, '?c=B&final=C', { vw: 390, vh: 760, hasTouch: true, ...(eng === 'chromium' ? { isMobile: true } : {}) })
  rec(eng, P, '390 arriba: acciones en el zócalo', (await where(m)) === 'base')
  await scroll(m, 900)
  await m.waitForTimeout(400)
  const s1 = await st(m), base = await rect(m, '#ph-base'), tabs = await rect(m, '[role="tablist"]'), dock = await rect(m, '#ph-dock')
  rec(eng, P, '390 pegado: el zócalo se queda con las pestañas y las acciones bajan al muelle', s1.stuck && (await where(m)) === 'dock' && near(base.top, s1.top) && tabs.width > base.width * 0.8, `${tabs.width}/${base.width}`)
  rec(eng, P, '390: el muelle abajo de borde a borde; la principal con su texto', near(dock.bottom, 760, 1) && (await m.evaluate(() => getComputedStyle(document.querySelector('.ph__dock .ph__primary .g-btn__label')).position !== 'absolute')))
  rec(eng, P, '390: sin copias ni desbordamiento', (await countBtn(m, 'Validar resultados')) === 1 && !(await pageOverflow(m)))
  await scroll(m, 0)
  await m.waitForTimeout(260)
  rec(eng, P, '390 arriba otra vez: acciones de vuelta al zócalo', (await where(m)) === 'base' && !(await st(m)).open)
  await m.__ctx.close()
}

async function zone (b, eng) {
  for (const [qs, name] of [['&zone=brand', 'zona, tema por defecto'], ['&zone=brand&theme=nsa', 'zona, tema NisaNabani']]) {
    const P = 'zone'
    const p = await open(b, '?c=A' + qs)
    rec(eng, P, `${name}: h1 ≥ 4.5:1`, (await contrast(p, '#ph-title', 'color', '#ph', 'backgroundColor')) >= 4.5, await contrast(p, '#ph-title', 'color', '#ph', 'backgroundColor'))
    rec(eng, P, `${name}: descripción ≥ 4.5:1`, (await contrast(p, '.ph__desc', 'color', '#ph', 'backgroundColor')) >= 4.5, await contrast(p, '.ph__desc', 'color', '#ph', 'backgroundColor'))
    rec(eng, P, `${name}: ruta ≥ 4.5:1`, (await contrast(p, '.ph-trail a', 'color', '#ph', 'backgroundColor')) >= 4.5, await contrast(p, '.ph-trail a', 'color', '#ph', 'backgroundColor'))
    rec(eng, P, `${name}: acción principal ≥ 4.5:1 y su relleno ≥ 3:1 sobre la zona`, (await contrast(p, '.ph__primary', 'color', '.ph__primary', 'backgroundColor')) >= 4.5 && (await contrast(p, '.ph__primary', 'backgroundColor', '#ph', 'backgroundColor')) >= 3, `${await contrast(p, '.ph__primary', 'color', '.ph__primary', 'backgroundColor')} / ${await contrast(p, '.ph__primary', 'backgroundColor', '#ph', 'backgroundColor')}`)
    const focusRatio = await p.evaluate(() => { const ph = document.getElementById('ph'); const s = document.createElement('span'); s.id = 'focus-probe'; s.style.color = 'var(--g-color-focus)'; ph.append(s); return true }) && await contrast(p, '#focus-probe', 'color', '#ph', 'backgroundColor')
    await p.evaluate(() => document.getElementById('focus-probe').remove())
    rec(eng, P, `${name}: color de foco ≥ 3:1 sobre la zona`, focusRatio >= 3, focusRatio)
    await scroll(p, 700)
    rec(eng, P, `${name}: la franja hereda la zona (mismo fondo que el encabezado)`, await p.evaluate(() => getComputedStyle(document.getElementById('ph-band')).backgroundColor === getComputedStyle(document.getElementById('ph')).backgroundColor))
    rec(eng, P, `${name}: consola limpia`, p.__errs.length === 0, p.__errs.join(' | '))
    await p.__ctx.close()
  }
}

const RUN = { base, A, B, C: Cc, BC, zone }
for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  for (const part of PARTS) {
    try { await RUN[part](b, eng) } catch (e) { rec(eng, part, 'excepción', false, e.message.split('\n')[0]) }
  }
  await b.close()
}
server.close()
const by = {}
for (const r of R) { const k = `${r.eng} ${r.part}`; by[k] = by[k] || [0, 0]; by[k][1]++; if (r.ok) by[k][0]++ }
for (const [k, [ok, n]] of Object.entries(by)) console.log(`${k}: ${ok}/${n}`)
const ok = R.filter((r) => r.ok).length
console.log(`\n${ok}/${R.length} pasan`)
process.exit(ok === R.length ? 0 : 1)
