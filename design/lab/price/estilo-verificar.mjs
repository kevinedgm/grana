// Verificación de coco sobre el banco de GPrice (design/lab/price/estilo-banco.html) con el CSS real de GPrice.css,
// GPriceScope.css y GDatePicker.css de src/ y GDatePicker real de dist/. Mide: análisis estático (tokens, sin respaldo, sin
// literales de tema, lista exacta de tokens para tokens.md §54); tabla de roles por tamaño (cifra y secundario, ≥ 12px);
// contraste ≥ 4.5:1 de todas las partes de texto (cifra, lead, unidad, código, referencia, ahorro, total, leyenda, sello,
// impuestos) en el tema por defecto y once temas generados, claro y oscuro; carta con un solo borde final; reflujo a 320px
// sin desplazamiento horizontal; la forma del día con precio (celdas iguales con y sin precio, precio dentro de su cápsula a
// 320 y 1100, texto ≥ 12px, área ≥ 24/44px, cinco cifras: límite); A · cifras que ruedan (≥ 2 posiciones intermedias, menos
// ranuras que caracteres, Δ ancho 0, retirada; movimiento reducido sin capa); RTL (ar-EG: flecha espejada, sin desborde);
// forced-colors (Chromium); consola limpia.
// Ejecutar desde la raíz del repo (requiere dist/):  GRANA_PW_PORT=4209 node design/lab/price/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --verbose
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const V = !!args.verbose
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4209, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/price/estilo-banco.html`

let total = 0, failed = 0
const fails = [], notes = []
const ok = (cond, msg, info = '') => { total++; if (!cond) { failed++; fails.push(msg + (info !== '' ? ' · ' + info : '')) } else if (V) console.log('ok   ' + msg + (info !== '' ? ' · ' + info : '')) }
const note = (s) => { if (!notes.includes(s)) notes.push(s); if (V) console.log('nota ' + s) }

/* ---------- 0 · Análisis estático ---------- */
const tokens = new Set()
for (const [file, lens] of [['GPrice/GPrice.css', ['1px', '100%']], ['GPriceScope/GPriceScope.css', ['24px']], ['GDatePicker/GDatePicker.css', null]]) {
  const raw = await readFile(join(ROOT, 'packages/vue/src/components', file), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color|color-mix)\(/.test(css), `estático ${file}: sin color literal`)
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), `estático ${file}: var() sin respaldo`)
  ok(!/@layer/.test(css) && !/!important/.test(css), `estático ${file}: sin @layer ni !important`)
  const vars = [...new Set([...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))]
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), `estático ${file}: solo --g-* y --_*`)
  if (lens) {
    vars.filter((v) => v.startsWith('--g-')).forEach((v) => tokens.add(v))
    const found = [...css.matchAll(/(?<![\w-])(\d*\.?\d+)(px|rem|em|vh|vw|ms|s|ch|%)(?![\w-])/g)].map((m) => m[1] + m[2]).filter((l) => !['0%', '100%', '50%'].includes(l) || l === '100%')
    const bad = found.filter((l) => !lens.includes(l) && l !== '50%' && l !== '1em')
    ok(!bad.length, `estático ${file}: literales solo los de la cabecera`, [...new Set(bad)].join(','))
    ok(!/ease-(spring|bounce)/.test(css), `estático ${file}: sin muelle ni rebote`)
  }
  if (file.startsWith('GPrice/')) {
    const kf = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
    ok(kf.length === 4 && kf.every((k) => k.startsWith('g-price-roll')), 'estático: keyframes g-price-roll-* (y ninguno g-reject)', kf.join(','))
    ok(/@media \(prefers-reduced-motion: no-preference\)\s*\{[\s\S]*g-price-roll-up-new/.test(css), 'estático: la capa solo anima sin movimiento reducido')
  }
}
const ALLOWED = /^--g-(text-(caption|body-sm|body|title-sm|title|display)-(size|line|weight|tracking)|text-action-weight|font-(ui|display)|color-(text|text-muted|success-soft|on-success-soft|border-strong)|border-width|radius-(xs|pill)|space-1|duration-press|ease-out)$/
const extra = [...tokens].filter((t) => !ALLOWED.test(t))
ok(!extra.length, 'estático: GPrice y GPriceScope solo consumen la lista de §54 (+ text-action-weight)', extra.join(','))
note('Tokens consumidos por GPrice.css + GPriceScope.css (para tokens.md §54): ' + [...tokens].sort().join(' '))

const HELPERS = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (a, b) => [0, 1, 2].map((i) => a[i] * a[3] + b[i] * (1 - a[3]))
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const bgOf = (el) => {
    const stack = []
    for (let n = el; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c[3] > 0) stack.push(c); if (c[3] === 1) break }
    let base = rgba(getComputedStyle(document.body).backgroundColor); if (base[3] < 1) base = [255, 255, 255, 1]
    let col = base.slice(0, 3)
    for (const c of stack.reverse()) col = over(c, col)
    return col
  }
  window.__contrast = (el) => {
    const fg = rgba(getComputedStyle(el).color), bg = bgOf(el)
    const f = over(fg, bg), L1 = lum(f), L2 = lum(bg)
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
  }
}

const PARTS = ['.g-price__amount', '.g-price__lead', '.g-price__unit', '.g-price__code', '.g-price__approx', '.g-price__sep', '.g-price__compare-label', '.g-price__amount--compare', '.g-price__saving', '.g-price__total-label', '.g-price__total-amount', '.g-price__total-unit', '.g-price--free', '.g-price--on-request', '.g-price-scope__seal', '.g-price-scope__legend-text', '.g-price-scope__taxes', '[data-day-price] .g-price__amount']

async function open (page, qs = '') {
  await page.goto(BASE + (qs ? '?' + qs : ''))
  await page.waitForFunction(() => window.__bench && window.__bench.ready)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400) // el día elegido entra con la transición de color de GDatePicker (duration-fast)
  await page.evaluate(HELPERS)
}

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  const E = `[${engine}]`

  /* ---------- 1 · Tabla de roles ---------- */
  await open(page)
  const roles = await page.evaluate(() => {
    const px = (v) => parseFloat(v)
    const r = {}
    for (const s of ['xs', 'sm', 'md', 'lg', 'xl']) {
      const root = document.getElementById('size-' + s)
      const a = root.querySelector('.g-price__amount'), u = root.querySelector('.g-price__unit'), c = root.querySelector('.g-price__code')
      const cs = getComputedStyle(root)
      const tok = (n) => px(getComputedStyle(document.documentElement).getPropertyValue(n)) * (n.endsWith('size') || n.endsWith('line') ? 16 : 1)
      r[s] = { num: px(getComputedStyle(a).fontSize), numW: getComputedStyle(a).fontWeight, sec: px(getComputedStyle(u).fontSize), code: px(getComputedStyle(c).fontSize), nums: getComputedStyle(a).fontVariantNumeric, tok }
    }
    const R = (n) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n)) * 16
    return { r, exp: { caption: R('--g-text-caption-size'), bodySm: R('--g-text-body-sm-size'), body: R('--g-text-body-size'), titleSm: R('--g-text-title-sm-size'), title: R('--g-text-title-size'), display: R('--g-text-display-size') } }
  })
  const X = roles.exp
  const want = { xs: [X.caption, X.caption], sm: [X.bodySm, X.caption], md: [X.titleSm, X.bodySm], lg: [X.title, X.body], xl: [X.display, X.body] }
  for (const [s, [n, sec]] of Object.entries(want)) {
    const m = roles.r[s]
    ok(Math.abs(m.num - n) < 0.1 && Math.abs(m.sec - sec) < 0.1 && Math.abs(m.code - sec) < 0.1, `${E} ${s}: cifra ${n}px, secundario y código ${sec}px`, `${m.num}/${m.sec}/${m.code}`)
    ok(m.sec >= 12 && m.num >= 12, `${E} ${s}: texto ≥ 12px`)
    ok(/tabular-nums/.test(m.nums) && /lining-nums/.test(m.nums), `${E} ${s}: cifras tabulares y de altura de mayúscula`, m.nums)
    if (engine === 'chromium') note(`Tamaño ${s}: cifra ${m.num}px peso ${m.numW}, secundario ${m.sec}px`)
  }
  ok(await page.evaluate(() => { const s = document.querySelector('.g-price__spoken').getBoundingClientRect(); return s.width <= 1 && s.height <= 1 }), `${E} la frase va en texto oculto (1px)`)

  /* ---------- 2 · Carta con un solo borde final ---------- */
  const edges = await page.evaluate(() => [...document.querySelectorAll('.menu__price .g-price')].map((p) => Math.round(p.getBoundingClientRect().right)))
  ok(new Set(edges).size === 1, `${E} carta: todos los precios contra el mismo borde final`, edges.join(','))
  ok(await page.evaluate(() => !document.querySelector('#menu-0 .g-price__code') && /USD/.test(document.querySelector('#menu-3 .g-price__visual').textContent)), `${E} región: el símbolo propio sin código, lo extranjero con código`)
  const strike = await page.evaluate(() => getComputedStyle(document.querySelector('#c-strike .g-price__amount--compare')).textDecorationLine)
  ok(/line-through/.test(strike), `${E} strike: el importe de referencia va tachado`, strike)
  const filete = await page.evaluate(() => { const t = getComputedStyle(document.querySelector('.g-price-scope__taxes')); return t.borderInlineStartStyle + ' ' + t.borderInlineStartWidth })
  ok(/solid/.test(filete), `${E} leyenda: filete entre leyenda e impuestos`, filete)
  ok(await page.evaluate(() => !/·/.test(document.querySelector('.g-price-scope__legend').textContent)), `${E} leyenda: sin «·»`)
  const seal = await page.evaluate(() => document.querySelector('.g-price-scope__seal').getBoundingClientRect().height)
  ok(seal >= 24, `${E} sello: alto ≥ 24px`, seal)

  /* ---------- 3 · Contraste en temas ---------- */
  const THEMES = engine === 'chromium' ? ['', 'amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe'] : ['', 'stripe', 'caracol-purpura']
  for (const th of THEMES) {
    for (const dark of [0, 1]) {
      await open(page, [th && 'theme=' + th, dark && 'dark=1'].filter(Boolean).join('&'))
      const res = await page.evaluate((PARTS) => {
        const out = []
        for (const sel of PARTS) for (const el of document.querySelectorAll(sel)) {
          if (!el.getClientRects().length) continue
          const btn = el.closest('.g-datepicker__day'); if (btn && (btn.classList.contains('is-outside') || btn.classList.contains('is-disabled'))) continue
          out.push([sel, Math.round(window.__contrast(el) * 100) / 100])
        }
        const min = {}
        for (const [s, c] of out) min[s] = Math.min(min[s] ?? 99, c)
        return min
      }, PARTS)
      const low = Object.entries(res).filter(([, c]) => c < 4.5)
      ok(!low.length, `${E} contraste ≥ 4.5:1 de todas las partes · ${th || 'por defecto'} ${dark ? 'oscuro' : 'claro'}`, low.map(([s, c]) => s + ' ' + c).join(', '))
      if (engine === 'chromium' && !th) note(`Contraste mínimo por parte (${dark ? 'oscuro' : 'claro'}, por defecto): ` + Object.entries(res).map(([s, c]) => s.replace(/\.g-price(-scope)?__|\.g-price--/g, '') + ' ' + c).join(' · '))
    }
  }

  /* ---------- 4 · Reflujo a 320px y día con precio ---------- */
  for (const [w, qs] of [[320, ''], [320, 'big=1'], [1100, ''], [320, 'lang=ar-EG']]) {
    await page.setViewportSize({ width: w, height: 900 })
    await open(page, qs)
    const r = await page.evaluate(() => {
      const days = [...document.querySelectorAll('.g-datepicker__day')]
      const sizes = new Set(days.map((d) => { const b = d.getBoundingClientRect(); return Math.round(b.width) + 'x' + Math.round(b.height) }))
      const over = days.filter((d) => { const p = d.querySelector('[data-day-price]'); if (!p) return false; const a = p.getBoundingClientRect(), b = d.getBoundingClientRect(); return a.left < b.left - 0.5 || a.right > b.right + 0.5 })
      const touch = days.some((d, i) => { const n = days[i + 1]; if (!n || d.closest('tr') !== n.closest('tr')) return false; const a = d.querySelector('[data-day-price]').getBoundingClientRect(), b = n.querySelector('[data-day-price]').getBoundingClientRect(); return a.right > b.left - 1 && b.right > a.left - 1 })
      const today = document.querySelector('.g-datepicker__day.is-today')
      const dot = today?.querySelector('.g-datepicker__today-dot')?.getBoundingClientRect(), tb = today?.getBoundingClientRect()
      const priceFs = parseFloat(getComputedStyle(document.querySelector('[data-day-price] .g-price__amount')).fontSize)
      const minDay = Math.min(...days.map((d) => Math.min(d.getBoundingClientRect().width, d.getBoundingClientRect().height)))
      const numTop = new Set(days.map((d) => { const r = document.createRange(); r.selectNodeContents(d); const t = d.firstChild; const rr = document.createRange(); rr.selectNode(t); return Math.round(rr.getBoundingClientRect().top - d.getBoundingClientRect().top) }))
      return { scroll: document.documentElement.scrollWidth, sizes: [...sizes], over: over.length, touch, dotIn: dot && tb ? dot.top >= tb.top && dot.right <= tb.right && dot.bottom <= tb.top + tb.height / 2 : null, priceFs, minDay, numTop: [...numTop], cellW: days[10].getBoundingClientRect().width }
    })
    const lbl = `${E} ${w}px${qs ? ' ' + qs : ''}`
    ok(r.scroll <= w, `${lbl}: sin desplazamiento horizontal`, r.scroll)
    ok(r.sizes.length === 1, `${lbl}: todas las celdas del día iguales (con y sin precio)`, r.sizes.join(','))
    ok(r.numTop.length === 1, `${lbl}: el número del día en la misma posición en todas las celdas`, r.numTop.join(','))
    ok(r.priceFs >= 12, `${lbl}: precio del día ≥ 12px`, r.priceFs)
    ok(r.minDay >= 24, `${lbl}: área del día ≥ 24px`, r.minDay)
    ok(r.dotIn, `${lbl}: el punto de hoy dentro de la cápsula, arriba`)
    if (qs === 'big=1') {
      note(`${engine} 320px: un precio de cinco cifras («12,400») ${r.over ? `desborda su cápsula en ${r.over} días (celda ${Math.round(r.cellW)}px)` : 'cabe'}: límite para lima (notation compact, #778)`)
    } else {
      ok(!r.over && !r.touch, `${lbl}: el precio de cuatro cifras cabe en su cápsula y no toca al vecino`, `${r.over} fuera, celda ${Math.round(r.cellW)}px`)
    }
    if (qs === 'lang=ar-EG') {
      const rtl = await page.evaluate(() => ({ scale: getComputedStyle(document.querySelector('#c-trace .g-price__arrow')).scale, dir: getComputedStyle(document.querySelector('#c-trace .g-price__amount')).direction, unicode: getComputedStyle(document.querySelector('#c-trace .g-price__amount')).unicodeBidi }))
      ok(/^-1/.test(rtl.scale), `${E} RTL: la flecha se espeja (flip-rtl)`, rtl.scale)
      ok(rtl.dir === 'ltr' && rtl.unicode === 'isolate', `${E} RTL: el importe ltr aislado`, rtl.dir + ' ' + rtl.unicode)
    }
  }
  await page.setViewportSize({ width: 1100, height: 900 })

  /* ---------- 5 · A · cifras que ruedan ---------- */
  await open(page)
  const rollRes = await page.evaluate(async () => {
    const el = document.querySelector('[data-total]')
    const w0 = el.getBoundingClientRect().width
    const raf = () => new Promise((r) => requestAnimationFrame(r))
    window.__bench.setNights(3)
    const after = { slots: el.querySelectorAll('.g-price__roll-slot').length, chars: el.textContent.length }
    const ys = new Set(); const widths = new Set()
    const t0 = performance.now()
    while (el.classList.contains('is-rolling') && performance.now() - t0 < 1500) {
      const n = el.querySelector('.g-price__roll-new'); if (n) ys.add(Math.round(n.getBoundingClientRect().top))
      widths.add(Math.round(el.getBoundingClientRect().width * 10) / 10)
      await raf()
    }
    const done = !el.classList.contains('is-rolling') && !el.querySelector('.g-price__roll-slot')
    const wEnd = Math.round(el.getBoundingClientRect().width * 10) / 10
    return { w0, after, positions: ys.size, widths: [...widths], wEnd, done, text: el.textContent, ms: Math.round(performance.now() - t0) }
  })
  ok(rollRes.positions >= 3, `${E} A: ≥ 2 posiciones intermedias de la cifra que rueda`, rollRes.positions)
  ok(rollRes.after.slots > 0 && rollRes.after.slots < rollRes.text.length, `${E} A: solo ruedan los caracteres que cambian`, `${rollRes.after.slots} de ${rollRes.text.length}`)
  ok(rollRes.widths.every((w) => Math.abs(w - rollRes.wEnd) <= 0.5), `${E} A: Δ ancho 0 durante la capa`, rollRes.widths.join(',') + ' → ' + rollRes.wEnd)
  ok(rollRes.done, `${E} A: la capa se retira al terminar`, rollRes.ms + 'ms')
  // interrumpible: un cambio durante la capa la retira y no apila otra
  const inter = await page.evaluate(async () => { const el = document.querySelector('[data-total]'); window.__bench.setNights(4); window.__bench.setNights(5); return { rolling: el.classList.contains('is-rolling'), slots: el.querySelectorAll('.g-price__roll-slot').length } })
  ok(!inter.rolling && inter.slots === 0, `${E} A: un cambio durante la capa la retira (no apila)`)

  const rctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, reducedMotion: 'reduce' })
  const rp = await rctx.newPage()
  await open(rp)
  const red = await rp.evaluate(async () => {
    const el = document.querySelector('[data-total]')
    window.__bench.setNights(3)
    const anim = [...el.querySelectorAll('*')].map((x) => getComputedStyle(x).animationName).filter((n) => n !== 'none').length
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    return { anim, rolling: el.classList.contains('is-rolling'), slots: el.querySelectorAll('.g-price__roll-slot').length }
  })
  ok(red.anim === 0 && !red.rolling && red.slots === 0, `${E} A reducido: sin animación calculada y la capa se retira en el acto`, JSON.stringify(red))
  await rctx.close()

  /* ---------- 6 · forced-colors (Chromium) ---------- */
  if (engine === 'chromium') {
    const fctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, forcedColors: 'active' })
    const fp = await fctx.newPage()
    await open(fp)
    const fc = await fp.evaluate(() => ({ saving: getComputedStyle(document.querySelector('#c-trace .g-price__saving')).borderTopStyle, seal: getComputedStyle(document.querySelector('.g-price-scope__seal')).borderTopStyle, taxes: getComputedStyle(document.querySelector('.g-price-scope__taxes')).borderInlineStartStyle }))
    ok(fc.saving === 'solid' && fc.seal === 'solid' && fc.taxes === 'solid', `${E} forced-colors: ahorro, sello y filete con borde del sistema`, JSON.stringify(fc))
    await fctx.close()
  }

  ok(!errors.length, `${E} consola sin errores`, errors.slice(0, 3).join(' | '))
  await browser.close()
}

server.close()
console.log(`\n${total - failed}/${total} comprobaciones`)
if (notes.length) console.log('\nNotas:\n- ' + notes.join('\n- '))
if (fails.length) { console.log('\nFallos:\n- ' + fails.join('\n- ')); process.exitCode = 1 }
