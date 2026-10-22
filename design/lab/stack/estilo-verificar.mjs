// Verificación de coco sobre el banco de GStack (design/lab/stack/estilo-banco.html), con el CSS real en las capas del registro.
// Separaciones por gap y density (con space del tema), márgenes de los hijos y regla de la aplicación sin capa (#516),
// GTooltip hermano (#383), divided (línea, 2 × gap, hijos hidden), alineaciones lógicas en LTR y RTL, partición en horizontal
// a 320, forced-colors, consola limpia. Temas: defecto, «Tema de prueba» (space 5) y tres generados, claro y oscuro.
// Desde la raíz: node design/lab/stack/estilo-verificar.mjs [--engines=chromium,firefox,webkit]   (Playwright de theme-playground)
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/stack/estilo-banco.html`

let total = 0, failed = 0
const fails = []
const ok = (c, m) => { total++; if (!c) { failed++; fails.push(m) } }
const near = (a, b, t = 0.6) => Math.abs(a - b) <= t

const geometry = () => {
  const q = (c) => document.querySelector(`[data-case="${c}"]`)
  const R = (e) => e.getBoundingClientRect()
  const px = parseFloat
  const kids = (c) => [...q(c).children].filter((k) => !k.hidden && !k.classList.contains('g-tooltip'))
  const dist = (c) => { const k = kids(c); return k.slice(1).map((e, i) => +(R(e).top - R(k[i]).bottom).toFixed(2)) }
  const s1 = px(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1'))
  const bw = px(getComputedStyle(document.documentElement).getPropertyValue('--g-border-width'))
  const g = { s1, bw, rtl: document.documentElement.dir === 'rtl' }
  for (const c of ['none', 'sm', 'md', 'lg']) g['gap-' + c] = dist('gap-' + c)
  for (const d of ['default', 'comfortable', 'compact']) for (const k of ['', 'sm-', 'lg-']) g['den-' + k + d] = dist('den-' + k + d)
  g.margins = { d: dist('margins'), m: kids('margins').map((e) => getComputedStyle(e).marginBlockStart + '/' + getComputedStyle(e).marginBlockEnd) }
  g.app = { d: dist('app-margin'), m: getComputedStyle(q('app-margin').children[1]).marginBlockStart }
  g.tooltip = { d: dist('tooltip'), open: q('tooltip').querySelector('.g-tooltip').matches(':popover-open') }
  const inner = (e) => R(e.querySelector('.in'))
  const dv = (c) => { const k = kids(c); return { d: k.slice(1).map((e, i) => +(inner(e).top - inner(k[i]).bottom).toFixed(2)), b: k.map((e) => px(getComputedStyle(e).borderTopWidth)), c: k.map((e) => getComputedStyle(e).borderTopColor), st: k.map((e) => getComputedStyle(e).borderTopStyle), last: px(getComputedStyle(k[k.length - 1]).paddingBottom) } }
  g.div = dv('divided'); g.divH = dv('divided-hidden'); g.divC = dv('divided-compact')
  g.hiddenLines = [...q('divided-hidden').children].map((e) => e.hidden ? 'h' : getComputedStyle(e).borderTopWidth)
  const box = (c) => { const r = R(q(c)); return { l: r.left, r: r.right, w: r.width } }
  for (const h of ['none', 'start', 'center', 'end']) { const b = box('v-h-' + h); g['vh-' + h] = { box: b, kids: kids('v-h-' + h).map((e) => ({ l: +(R(e).left - b.l).toFixed(2), r: +(b.r - R(e).right).toFixed(2), w: R(e).width })) } }
  const rows = (c) => { const k = kids(c); const tops = [...new Set(k.map((e) => Math.round(R(e).top)))]; return { rows: tops.length, n: k.length } }
  g.hd = { rows: rows('h-default'), dx: kids('h-default').slice(1).map((e, i) => { const p = kids('h-default')[i]; return Math.round(R(e).top) === Math.round(R(p).top) ? +Math.max(R(e).left - R(p).right, R(p).left - R(e).right).toFixed(2) : null }).filter((v) => v !== null), tops: kids('h-default').slice(0, 5).map((e) => Math.round(R(e).top)) }
  const span = (c) => { const k = kids(c); const b = box(c); return { l: Math.min(...k.map((e) => R(e).left)) - b.l, r: b.r - Math.max(...k.map((e) => R(e).right)) } }
  g.hc = span('h-center'); g.he = span('h-end'); g.hdef = span('h-default')
  for (const v of ['top', 'center', 'bottom']) { const k = kids('h-v-' + v); const b = R(q('h-v-' + v)); g['hv-' + v] = { chip: +(R(k[1]).top - b.top).toFixed(1), chipB: +(b.bottom - R(k[1]).bottom).toFixed(1), h: b.height } }
  const wrap = kids('h-wrap'); const tops = [...new Set(wrap.map((e) => Math.round(R(e).top)))].sort((a, b) => a - b)
  g.wrap = { rows: tops.length, rowGap: tops.length > 1 ? +(R(wrap.find((e) => Math.round(R(e).top) === tops[1])).top - R(wrap[0]).bottom).toFixed(2) : null, colGap: +(R(wrap[1]).left - R(wrap[0]).right).toFixed(2) }
  g.hdiv = kids('h-divided-ignored').map((e) => px(getComputedStyle(e).borderTopWidth) + px(getComputedStyle(e).borderInlineStartWidth) * 0)
  g.ul = dist('ul'); g.ulRoles = [q('ul').getAttribute('role'), q('ul').tagName]
  g.overflow = { doc: document.documentElement.scrollWidth, vw: innerWidth }
  return g
}

const check = (g, tag, w320) => {
  const s = g.s1, rtl = g.rtl
  const exp = { none: 0, sm: 3 * s, md: 6 * s, lg: 12 * s }
  for (const k of Object.keys(exp)) g['gap-' + k].forEach((d) => ok(near(d, exp[k]), `${tag}: gap ${k} ${d} ≠ ${exp[k]}`))
  const f = { default: 1, comfortable: 0.875, compact: 0.75 }
  for (const d of Object.keys(f)) for (const [k, base] of [['', 6], ['sm-', 3], ['lg-', 12]]) g['den-' + k + d].forEach((v) => ok(near(v, base * s * f[d]), `${tag}: density ${k}${d} ${v} ≠ ${base * s * f[d]}`))
  g.margins.d.forEach((d) => ok(near(d, 6 * s), `${tag}: hijos con margen: separación ${d} ≠ ${6 * s}`))
  g.margins.m.forEach((m) => ok(m === '0px/0px', `${tag}: margen de hijo ${m} ≠ 0`))
  ok(g.app.m === '10px' && near(g.app.d[0], 6 * s + 10) && near(g.app.d[1], 6 * s + 10), `${tag}: la regla de la aplicación sin capa no gana (#516) ${JSON.stringify(g.app)}`)
  ok(g.tooltip.open && g.tooltip.d.length === 1 && near(g.tooltip.d[0], 6 * s), `${tag}: GTooltip hermano altera la separación ${JSON.stringify(g.tooltip)}`)
  for (const [n, v] of [['divided', g.div], ['divided-hidden', g.divH], ['divided-compact', g.divC]]) {
    const gap = n === 'divided-compact' ? 3 * s * 0.75 : 6 * s
    v.d.forEach((d) => ok(near(d, 2 * gap + g.bw, 0.8), `${tag}: ${n} distancia ${d} ≠ 2×gap+borde ${2 * gap + g.bw}`))
    ok(v.b[0] === 0, `${tag}: ${n} línea antes del primero`)
    v.b.slice(1).forEach((b) => ok(near(b, g.bw, 0.01), `${tag}: ${n} grosor ${b} ≠ ${g.bw}`))
    ok(v.last === 0, `${tag}: ${n} aire tras el último ${v.last}`)
    ok(v.st.slice(1).every((x) => x === 'solid'), `${tag}: ${n} estilo de línea`)
  }
  ok(JSON.stringify(g.hiddenLines) === JSON.stringify(['h', '0px', 'h', g.bw + 'px', g.bw + 'px']), `${tag}: hijos hidden y divided ${JSON.stringify(g.hiddenLines)}`)
  ok(g['vh-none'].kids.every((k) => near(k.w, g['vh-none'].box.w, 0.6)), `${tag}: sin horizontal los hijos no se estiran`)
  const side = (k, a, b) => rtl ? (a === 'l' ? b : a) : a
  g['vh-start'].kids.forEach((k) => ok(near(rtl ? k.r : k.l, 0), `${tag}: start ${JSON.stringify(k)}`))
  g['vh-end'].kids.forEach((k) => ok(near(rtl ? k.l : k.r, 0), `${tag}: end ${JSON.stringify(k)}`))
  g['vh-center'].kids.forEach((k) => ok(near(k.l, k.r, 1), `${tag}: center ${JSON.stringify(k)}`))
  ok(g.hd.dx.length > 0 && g.hd.dx.every((d) => near(d, 6 * s)), `${tag}: separación en fila ${JSON.stringify(g.hd.dx)}`)
  if (!w320) ok(g.hd.rows.rows === 1, `${tag}: la fila de 5 se parte a ancho normal`)
  ok(near(rtl ? g.hdef.r : g.hdef.l, 0, 1), `${tag}: horizontal sin valor empieza en start ${JSON.stringify(g.hdef)}`)
  ok(near(g.hc.l, g.hc.r, 1), `${tag}: horizontal center descentrada ${JSON.stringify(g.hc)}`)
  ok(near(rtl ? g.he.l : g.he.r, 0, 1) && (rtl ? g.he.r : g.he.l) > 10, `${tag}: horizontal end ${JSON.stringify(g.he)}`)
  ok(near(g['hv-top'].chip, 0, 1) && near(g['hv-bottom'].chipB, 0, 1) && near(g['hv-center'].chip, g['hv-center'].chipB, 1.5), `${tag}: vertical top/center/bottom ${JSON.stringify([g['hv-top'], g['hv-center'], g['hv-bottom']])}`)
  ok(g.wrap.rows > 1 || !w320, `${tag}: 14 etiquetas no se parten a 320 (${g.wrap.rows} filas)`)
  if (g.wrap.rows > 1) ok(near(g.wrap.rowGap, 6 * s), `${tag}: separación entre filas ${g.wrap.rowGap} ≠ ${6 * s}`)
  ok(near(g.wrap.colGap, 6 * s) || g.wrap.colGap < 0, `${tag}: separación entre columnas ${g.wrap.colGap}`)
  ok(g.hdiv.every((v) => v === 0), `${tag}: divided en horizontal pinta línea ${JSON.stringify(g.hdiv)}`)
  g.ul.forEach((d) => ok(near(d, 6 * s), `${tag}: ul separación ${d}`))
  ok(g.ulRoles[0] === null, `${tag}: la pila añade role`)
  ok(g.overflow.doc <= g.overflow.vw, `${tag}: desborde ${JSON.stringify(g.overflow)}`)
}

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('requestfailed', (r) => errors.push('red: ' + r.url()))
  const go = async (qs) => { await page.goto(BASE + qs); await page.evaluate(() => document.fonts.ready) }
  const configs = [['defecto', ''], ['defecto-oscuro', '?dark=1'], ['prueba', '?test=1'], ['defecto-rtl', '?rtl=1'], ...['notion', 'caracol-purpura', 'spotify'].flatMap((t) => [[t, `?theme=${t}`], [t + '-oscuro', `?theme=${t}&dark=1`]])]
  for (const [name, qs] of configs) {
    await go(qs); check(await page.evaluate(geometry), `${engine} ${name}`)
  }
  for (const [name, qs] of [['320', ''], ['320-rtl', '?rtl=1'], ['320-prueba', '?test=1']]) {
    await page.setViewportSize({ width: 320, height: 800 }); await go(qs); check(await page.evaluate(geometry), `${engine} ${name}`, true)
  }
  await page.setViewportSize({ width: 1280, height: 900 })
  // forced-colors: la línea de divided es un borde y sigue visible
  if (engine === 'chromium') {
    await page.emulateMedia({ forcedColors: 'active' }); await go('')
    const fc = await page.evaluate(() => { const k = document.querySelector('[data-case="divided"]').children[1]; const cs = getComputedStyle(k); return { w: parseFloat(cs.borderTopWidth), st: cs.borderTopStyle, c: cs.borderTopColor, canvas: getComputedStyle(document.body).backgroundColor } })
    ok(fc.w >= 1 && fc.st === 'solid' && fc.c !== fc.canvas && !/^rgba\(.*,\s*0\)$/.test(fc.c), `${engine} forced-colors: ${JSON.stringify(fc)}`)
    await page.emulateMedia({ forcedColors: 'none' })
  }
  // Cambiar space cambia el ritmo de toda la pantalla y nunca un número a mano
  await go('')
  const sp = await page.evaluate(() => { document.documentElement.style.setProperty('--g-space-1', '5px'); const k = document.querySelector('[data-case="gap-md"]').children; return k[1].getBoundingClientRect().top - k[0].getBoundingClientRect().bottom })
  ok(near(sp, 30), `${engine} space 5: md ${sp} ≠ 30`)
  ok(!errors.length, `${engine} consola: ${errors.join(' | ')}`)
  await browser.close()
}
server.close()
console.log(`${total - failed}/${total} correctas`)
if (failed) { console.log(fails.slice(0, 60).map((f) => '  x ' + f).join('\n')); process.exitCode = 1 }
