// Verificación de coco de la lectura del día de GDatePicker (AV-C1, #952) sobre dist/ real con el banco lectura-banco.html
// (clase y nodo puestos a mano). Tres motores, 320 y 1440, texto 100 y 200 %, claro y oscuro: celda Δ 0 entre estados,
// contenido oculto en todas, lectura dentro de la caja, alto constante al cambiar de día, ≥ 12 px, contraste ≥ 4,5:1,
// sin transición, forced-colors (Chromium) y 0 errores de consola.
// Ejecutar desde la raíz con dist/ reconstruido: node design/lab/datepicker/lectura-verificar.mjs [--engines=chromium] [--verbose]
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT || 0), '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/datepicker/lectura-banco.html`
let total = 0, failed = 0
const fails = []
const ok = (c, m) => { total++; if (!c) { failed++; fails.push(m) } }

const MEASURE = () => {
  const root = document.querySelector('.g-datepicker')
  const cells = [...root.querySelectorAll('.g-datepicker__grid td')].filter((t) => t.querySelector('.g-datepicker__day'))
  const surf = root.querySelector('.g-datepicker__surface').getBoundingClientRect()
  const rd = root.querySelector('.g-datepicker__day-readout')
  const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2] }
  let ratio = null
  if (rd) {
    let bg = rd; let c
    while (bg && (!(c = getComputedStyle(bg).backgroundColor) || /rgba\(.*, 0\)|transparent/.test(c))) bg = bg.parentElement
    const f = getComputedStyle(rd).color
    const a = lum(f), b = lum(c || 'rgb(255,255,255)')
    ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  }
  const r = rd && getComputedStyle(rd).display !== 'none' ? rd.getBoundingClientRect() : null
  // contenido visible de las celdas (fuera de su celda = solape)
  let overlaps = 0, visible = 0
  for (const td of cells) {
    const tr = td.getBoundingClientRect()
    for (const el of td.querySelectorAll('.g-datepicker__day > :not(.g-datepicker__today-dot)')) {
      if (getComputedStyle(el).visibility === 'hidden') continue
      visible++
      if (el.scrollWidth > el.clientWidth + 0.5 || el.getBoundingClientRect().width > tr.width + 0.5) overlaps++
    }
  }
  return {
    cells: cells.slice(0, 40).map((t) => { const b = t.getBoundingClientRect(); return [+b.width.toFixed(2), +b.height.toFixed(2)] }),
    visible, overlaps, hiddenAll: cells.every((td) => [...td.querySelectorAll('.g-datepicker__day > :not(.g-datepicker__today-dot)')].every((e) => getComputedStyle(e).visibility === 'hidden')),
    readout: r && { x: r.left, r: r.right, t: r.top, b: r.bottom, h: r.height, font: parseFloat(getComputedStyle(rd).fontSize), trans: getComputedStyle(rd).transitionDuration, anim: getComputedStyle(rd).animationName, w: rd.scrollWidth, cw: rd.clientWidth, text: rd.textContent, color: getComputedStyle(rd).color },
    surf: { x: surf.left, r: surf.right, b: surf.bottom }, ratio, docOverflow: document.documentElement.scrollWidth > innerWidth + 1, docW: document.documentElement.scrollWidth, vw: innerWidth,
  }
}

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  for (const width of [320, 1440]) for (const text of ['100', '200']) for (const theme of ['light', 'dark']) for (const months of (width < 600 ? ['1'] : ['1', '2'])) {
    const tag = `${engine} ${width}px texto ${text} % ${theme} ${months} mes(es)`
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    const url = (hide) => `${BASE}?${new URLSearchParams({ text, theme, months, price: '12345', ...(hide ? { hide: '1' } : {}) })}`
    const run = async (hide) => { await page.goto(url(hide)); await page.waitForFunction(() => window.__ready); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(150); return page.evaluate(MEASURE) }
    const a = await run(false), b = await run(true)
    ok(a.cells.length === b.cells.length && a.cells.every((c, i) => Math.abs(c[0] - b.cells[i][0]) <= 0.5 && Math.abs(c[1] - b.cells[i][1]) <= 0.5), `${tag}: celda Δ 0 entre estados`)
    ok(b.hiddenAll && b.visible === 0, `${tag}: contenido oculto en todas las celdas`)
    ok(b.readout && b.readout.x >= b.surf.x - 0.5 && b.readout.r <= b.surf.r + 0.5 && b.readout.w <= b.readout.cw + 1, `${tag}: lectura dentro de la caja (${JSON.stringify(b.readout && [b.readout.x, b.readout.r, b.surf.x, b.surf.r, b.readout.w, b.readout.cw])})`)
    ok(b.readout && b.readout.t >= 0 && !b.docOverflow, `${tag}: sin desbordamiento de página (${b.docW}/${b.vw}; sin clase ${a.docW})`)
    ok(b.readout && b.readout.font >= 12, `${tag}: lectura ≥ 12 px`)
    ok(b.ratio >= 4.5, `${tag}: contraste ${b.ratio && b.ratio.toFixed(2)}`)
    ok(b.readout && /^0s$/.test(b.readout.trans) && b.readout.anim === 'none', `${tag}: sin movimiento`)
    ok(a.readout === null, `${tag}: sin la clase la lectura no se pinta`)
    // alto constante al pasar por días con y sin dato
    const hs = []
    const days = page.locator('.g-datepicker__day[data-date]:not(.is-disabled)')
    const n = await days.count()
    for (const i of [0, 3, Math.min(n - 1, 20), n - 1]) { await days.nth(i).hover({ force: true }); hs.push(await page.evaluate(() => { const r = document.querySelector('.g-datepicker__day-readout'); return [r.getBoundingClientRect().height, r.getBoundingClientRect().top, r.textContent.trim()] })) }
    ok(hs.every((h) => Math.abs(h[0] - hs[0][0]) <= 0.01 && Math.abs(h[1] - hs[0][1]) <= 0.01), `${tag}: alto y posición constantes (${JSON.stringify(hs)})`)
    ok(new Set(hs.map((h) => h[2])).size > 1, `${tag}: la lectura cambia con el día`)
    ok(errors.length === 0, `${tag}: consola limpia (${errors.slice(0, 2)})`)
    if (args.verbose) console.log(tag, JSON.stringify({ cell: b.cells[10], text: b.readout?.text, h: b.readout?.h, ratio: b.ratio?.toFixed(2), overlapsSinClase: a.overlaps }))
    if (engine === 'chromium' && theme === 'light' && months === '1') {
      await page.emulateMedia({ forcedColors: 'active' }); await page.waitForTimeout(100)
      const fc = await page.evaluate(() => { const r = document.querySelector('.g-datepicker__day-readout'); const cs = getComputedStyle(r); const bg = getComputedStyle(r.closest('.g-datepicker__surface')).backgroundColor; return { color: cs.color, bg, vis: cs.display !== 'none', h: r.getBoundingClientRect().height } })
      ok(fc.vis && fc.color === 'rgb(0, 0, 0)' || fc.color !== fc.bg, `${tag}: forced-colors legible (${JSON.stringify(fc)})`)
    }
    await ctx.close()
  }
  // sin la clase, con 200 % hay solape (confirma el defecto que corrige): informativo
  const ctx = await browser.newContext({ viewport: { width: 320, height: 900 } }); const page = await ctx.newPage()
  await page.goto(`${BASE}?text=200&price=12345`); await page.waitForFunction(() => window.__ready); await page.waitForTimeout(150)
  const o = await page.evaluate(MEASURE); if (args.verbose) console.log(engine, 'defecto sin clase a 320/200 %: solapes', o.overlaps, 'de', o.visible)
  await ctx.close()
  await browser.close()
}
server.close()
console.log(`${total - failed}/${total}`)
for (const f of fails.slice(0, 30)) console.log('FALLA', f)
process.exit(failed ? 1 : 0)
