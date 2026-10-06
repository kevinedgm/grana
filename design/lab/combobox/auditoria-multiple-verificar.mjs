// Auditoría de coco (paso 5) de la Fase 2 de GCombobox (multiple) sobre el COMPONENTE REAL: el playground
// (packages/vue/playground/index.html, #sec-combobox-multiple; sin ?cm cada caso enseña su concepto, con ?cm=A|B|C toda la
// batería toma uno) y el banco de auditoría (auditoria-multiple-banco.html: slot chosen alto y GTooltip envolviendo el
// campo), con dist/grana.css, dist/grana.umd.js y dist/combobox.umd.js tal como se publican, puntero real (page.mouse) y
// medida por cuadro (requestAnimationFrame).
// Apartados (--only=<lista>):
//   static   · la sección «FASE 2 · VARIAS» de GCombobox.css y las compuertas de dist
//   phrase   · A: Δ0 de la caja, la fila, las vecinas y lo de debajo de 0 a 40 elegidas; una línea; cesión «y N más»;
//              ≤ 55 % con el foco y text-muted; Retroceso tachado + selección; «Elegidas» con tope 12 y «Ver las N»
//   recipe   · B: renglones numerados, «Nueva» + barra al inicio, Δ0 de caja/etiqueta y lo de debajo baja un renglón,
//              rastro del mismo alto (--_row-h, también con un slot chosen de cuatro líneas), «Deshacer», tope (max) y
//              tope 6 con «Ver los N»; áreas 24/44
//   basket   · C: cesta sin solapes (6 : 5), homónimos, viaje con --g-ease-spring, rastro, pie con «Listo»; hoja 375 y 320
//   deploy   · despliegue de A sin reduced motion y con la duración real: la primera activa visible, el panel no se
//              desplaza, la forma no se mueve (arreglo de fca3496)
//   contrast · todo lo nuevo en defecto, auditoría, auditoría con primary propia (claro y oscuro, tres motores) y, en
//              Chromium, los once temas generados (claro y oscuro)
//   keys     · Intro alterna, Tab nunca elige, Retroceso en dos tiempos, Ctrl+Z, tope aria-disabled recorrible
//   motion   · con movimiento: casilla con rebote, cifra que rueda; reducido: ninguna animación g-combobox-*, sin clases
//   rtl, forced, zoom (texto al 200 %), tooltip, phase1 (estilo calculado de la Fase 1 con y sin la sección de la Fase 2)
// Ejecutar desde la raíz (requiere `npm run build`): GRANA_PW_PORT=4209 node design/lab/combobox/auditoria-multiple-verificar.mjs
// Opciones: --engines=chromium,firefox,webkit  --only=phrase,recipe  --verbose  --serve
// GRANA_DIST=<copia de dist> sirve /packages/vue/dist/ desde otra copia (otra sesión puede estar reconstruyendo dist/).
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const DIST = process.env.GRANA_DIST
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const ONLY = args.only ? new Set(String(args.only).split(',')) : null
const run = (k) => !ONLY || ONLY.has(k)
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const p = DIST && rel.startsWith('/packages/vue/dist/') ? join(DIST, rel.slice('/packages/vue/dist/'.length)) : normalize(join(ROOT, rel))
    if (!p.startsWith(ROOT) && !(DIST && p.startsWith(DIST))) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4209, '127.0.0.1', r))
const ORIGIN = `http://127.0.0.1:${server.address().port}`
const PLAY = `${ORIGIN}/packages/vue/playground/index.html`
const BANK = `${ORIGIN}/design/lab/combobox/auditoria-multiple-banco.html`
if (args.serve) { console.log(PLAY + '#sec-combobox-multiple\n' + BANK); await new Promise(() => {}) }

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
const THEME_HREF = { audit: '/design/lab/combobox/auditoria-tema.css', primary: '/design/lab/combobox/auditoria-tema-primary.css' }
let total = 0, failed = 0
const fails = [], measures = {}
const perEngine = {}
let ENG = ''
const ok = (cond, msg) => { total++; perEngine[ENG] = perEngine[ENG] || { total: 0, failed: 0 }; perEngine[ENG].total++; if (!cond) { failed++; perEngine[ENG].failed++; fails.push(`[${ENG}] ${msg}`) } }
const note = (k, v) => { (measures[k] ??= []).push(`${ENG}: ${v}`) }
const r2 = (n) => Math.round(n * 100) / 100

/* ---------- 0 · Estático ---------- */
if (run('static')) {
  ENG = 'estático'
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GCombobox/GCombobox.css'), 'utf8')
  const start = raw.lastIndexOf('/*', raw.indexOf('FASE 2 · VARIAS (multiple'))
  const end = raw.indexOf('/* ---------- Preferencias del sistema')
  ok(start > 0 && end > start, 'sección «FASE 2 · VARIAS» delimitada')
  const f2 = raw.slice(start, end).replace(/\/\*[\s\S]*?\*\//g, '')
  const all = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/@layer|@property|!important/.test(all), 'sin @layer, @property ni !important')
  ok(!/var\(\s*--[\w-]+\s*,/.test(all), 'sin valores de respaldo en var()')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(all), 'sin literales de color')
  const vars = [...f2.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'solo --g-* y --_*')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'tokens que no existen en defaults.css: ' + missing)
  // Alias: propios con --_cb-; del .vue (contrato): --_travel-x/y, --_row-h (#429; aquí su valor por defecto); de GInput
  const own = new Set([...f2.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  ok([...own].every((v) => v.startsWith('--_cb-') || v === '--_row-h'), 'alias propio sin prefijo --_cb-: ' + [...own])
  const allowed = ['--_focus', '--_fs', '--_lh', '--_travel-x', '--_travel-y', '--_row-h']
  const strange = [...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v) && !allowed.includes(v)))]
  ok(!strange.length, 'alias --_* no previsto: ' + strange)
  const px = [...f2.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0]).filter((p) => !['24px', '44px'].includes(p))
  ok(!px.length, 'medidas literales fuera de 24px/44px: ' + px)
  ok(/\.g-combobox__row\.is-trace\s*\{[^}]*min-block-size:\s*var\(--_row-h\)/.test(f2), 'el rastro usa --_row-h (#429)')
  const kf = [...f2.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
  ok(kf.every((k) => /^g-combobox-/.test(k) && !/^g-reject/.test(k)), 'keyframes con prefijo propio: ' + kf)
  ok(!/linear\(|ease-bounce|ease-spring/.test(f2.replace(/@supports \(transition-timing-function: linear\(0, 1\)\)\s*\{[^{}]*(\{[^{}]*\}[^{}]*)*\}/g, '')), 'bounce y spring solo dentro de @supports')
  ok(!/\banimation\s*:/.test(f2.replace(/@media \(prefers-reduced-motion: no-preference\)\s*\{[^{}]*(\{[^{}]*\}[^{}]*)*(\{[^{}]*(\{[^{}]*\}[^{}]*)*\}[^{}]*)*\}/g, '')), 'animation solo con no-preference')
  const sys = f2.replace(/@media \(forced-colors: active\)\s*\{[\s\S]*$/, '')
  ok(!/\b(Canvas|CanvasText|Highlight|HighlightText|GrayText|ButtonText)\b/.test(sys), 'colores de sistema solo en forced-colors')
  const dist = await readFile(join(DIST || join(ROOT, 'packages/vue/dist'), 'grana.css'), 'utf8')
  for (const g of ['g-combobox__sentence', 'g-combobox__trace', 'g-combobox--variant-soft'].slice(0, 2)) ok(dist.includes(g), `dist/grana.css contiene ${g}`)
  ok(/is-trace\{[^}]*min-block-size:var\(--_row-h\)/.test(dist), 'dist/grana.css: el rastro con --_row-h (dist construido tras la corrección)')
  ok(!dist.includes('data:font'), 'la fuente no está incrustada')
  const js = await readFile(join(DIST || join(ROOT, 'packages/vue/dist'), 'grana.js'), 'utf8')
  ok(!/GCombobox/.test(js), 'GCombobox no viaja en grana.js')
  const cjs = await readFile(join(DIST || join(ROOT, 'packages/vue/dist'), 'combobox.js'), 'utf8')
  ok(!/g-summary__/.test(cjs), 'combobox.js sin copia de GSummary')
}

/* ---------- Funciones de página ---------- */
const lib = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const parse = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (a, b) => [a[0] * a[3] + b[0] * (1 - a[3]), a[1] * a[3] + b[1] * (1 - a[3]), a[2] * a[3] + b[2] * (1 - a[3]), 1]
  const bgOf = (el) => {
    const layers = []
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break } }
    let base = parse(getComputedStyle(document.documentElement).backgroundColor)
    if (base[3] < 1) base = parse(getComputedStyle(document.body).backgroundColor)
    if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const tok = (n, prop = 'color', host = document.body) => { const i = document.createElement('i'); i.style[prop] = `var(${n})`; host.append(i); const c = getComputedStyle(i)[prop]; i.remove(); return c }
  const sys = (n) => { const i = document.createElement('i'); i.style.color = n; document.body.append(i); const c = getComputedStyle(i).color; i.remove(); return c }
  const same = (a, b) => { const x = parse(a), y = parse(b); return Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) + Math.abs(x[2] - y[2]) < 4 && Math.abs(x[3] - y[3]) < 0.02 }
  // Texto contra su fondo compuesto
  const pair = (k, el, min = 4.5, bgEl = el) => { if (!el) return { k: k + ' (no está)', r: 0, min }; const bg = bgOf(bgEl); return { k, r: ratio(over(parse(getComputedStyle(el).color), bg), bg), min } }
  // Un color (borde, relleno) contra el fondo compuesto de un elemento
  const vs = (k, color, bgEl, min = 3) => { if (!bgEl) return { k: k + ' (no está)', r: 0, min }; const bg = bgOf(bgEl); return { k, r: ratio(over(parse(color), bg), bg), min } }
  const rect = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height } }
  const root = (id) => document.getElementById(id).closest('.g-combobox')
  const ctl = (id) => document.getElementById(id).closest('.g-input__control')
  const vis = (el) => Boolean(el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
  return { parse, over, bgOf, ratio, tok, sys, same, pair, vs, rect, root, ctl, vis }
}
const L = `(${lib.toString()})()`
const E = (page, body, arg) => page.evaluate(`(() => { const H = ${L}; const ARG = ${JSON.stringify(arg ?? null)}; ${body} })()`)

/* ---------- Navegador ---------- */
for (const engine of ENGINES) {
  ENG = engine
  const browser = await pw[engine].launch()
  const errors = []
  const mk = async ({ width = 1280, height = 900, touch = false, mobile = false } = {}) => {
    const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: mobile && engine !== 'firefox' })
    const page = await ctx.newPage()
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push(m.text()) })
    page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errors.push(e.message) })
    return { ctx, page }
  }
  const theme = async (page, t) => {
    if (!t) return
    const href = THEME_HREF[t] || `/design/lab/tema-oscuro/dark-color-presence/generated/${t}.css`
    await page.evaluate((href) => new Promise((r) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = r; l.onerror = r; document.head.append(l) }), href)
  }
  const frames = (page, n = 2) => page.evaluate((n) => new Promise((r) => { let k = 0; const t = () => (++k >= n ? r() : requestAnimationFrame(t)); requestAnimationFrame(t) }), n)
  // Playground: cm '' (cada caso su concepto) o A/B/C; t: tema; dark
  const go = async (page, { cm = '', t = '', dark = false, motion = 'reduce', css = '' } = {}) => {
    await page.emulateMedia({ reducedMotion: motion })
    await page.addInitScript(() => { window.__cbFast = true })
    await page.goto(PLAY + (cm ? `?cm=${cm}` : ''))
    await page.waitForSelector('#cm-alg', { timeout: 20000 })
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' + css })
    await theme(page, t)
    await page.evaluate((d) => { document.documentElement.dataset.theme = d ? 'dark' : 'light' }, dark)
    await page.evaluate(() => document.fonts.ready)
    await frames(page)
  }
  const bank = async (page, { t = '', dark = false, motion = 'reduce' } = {}) => {
    await page.emulateMedia({ reducedMotion: motion })
    await page.goto(BANK + `?${t ? 'theme=' + (THEME_HREF[t] ? (t === 'audit' ? 'auditoria' : 'auditoria-primary') : t) + '&' : ''}${dark ? 'dark=1' : ''}`)
    await page.waitForSelector('html[data-ready]', { timeout: 20000 })
  }
  const into = (page, id) => page.evaluate((id) => document.getElementById(id).closest('.g-input__control').scrollIntoView({ block: 'center' }), id)
  const openA = async (page, id, ms = 350) => { await into(page, id); await page.focus('#' + id); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(ms) }
  const openC = async (page, id, ms = 450) => { await into(page, id); await page.focus('#' + id); await page.keyboard.press('ArrowDown'); await page.waitForSelector(`#${id}-surface[open]`, { timeout: 4000 }).catch(() => {}); await page.waitForTimeout(ms) }
  const shut = async (page) => { await page.keyboard.press('Escape'); await page.waitForTimeout(80); await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.waitForTimeout(150) }
  const clickOpt = async (page, sel) => { await page.locator(sel).first().evaluate((el) => el.scrollIntoView({ block: 'nearest' })); await page.waitForTimeout(60); const b = await page.locator(sel).first().boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2) }
  const clickEl = clickOpt
  // Un apartado que se rompe no tumba la pasada: cuenta como fallo y sigue
  const sect = async (k, fn) => { if (!run(k)) return; try { await fn() } catch (e) { ok(false, `${k}: excepción ${e.message.split('\n')[0]}`) } }

  /* ---------- A · la frase ---------- */
  await sect('phrase', async () => {
    const { ctx, page } = await mk()
    for (const [t, dark, name] of [['', false, 'defecto'], ['audit', false, 'auditoría'], ['primary', false, 'primary propia'], ['', true, 'defecto oscuro']]) {
      await go(page, { cm: 'A', t, dark })
      await page.evaluate(() => { window.__cm.tagOptions = window.PlaygroundCombobox.big })
      await into(page, 'cm-f-tags')
      const geo = async (n) => {
        await page.evaluate((n) => { window.__cm.tags = window.PlaygroundCombobox.big.slice(0, n).map((o) => o.value) }, n)
        await frames(page, 3); await page.waitForTimeout(80)
        return E(page, `
          const r = H.root('cm-f-tags'), i = document.getElementById('cm-f-tags'), s = r.querySelector('.g-combobox__sentence')
          const cell = i.parentElement, items = s ? [...s.children] : []
          const rest = s && s.querySelector('.g-combobox__sentence-rest')
          return { ctl: H.rect(H.ctl('cm-f-tags')), root: H.rect(r), folio: H.rect(H.ctl('cm-f-folio')), serv: H.rect(H.ctl('cm-f-serv')), notas: H.rect(H.ctl('cm-f-notas')), row: H.rect(document.getElementById('cm-row')),
            input: H.rect(i), cell: H.rect(cell), s: H.rect(s), tops: items.map((x) => x.getBoundingClientRect().top), over: s ? s.scrollWidth - s.clientWidth : 0,
            nItems: s ? s.querySelectorAll('.g-combobox__sentence-item').length : 0, rest: rest ? rest.textContent.trim() : '', restN: rest ? Number(rest.querySelector('.g-combobox__num').textContent) : 0,
            first: s && s.firstElementChild ? { sw: s.firstElementChild.scrollWidth, cw: s.firstElementChild.clientWidth, to: getComputedStyle(s.firstElementChild).textOverflow } : null,
            lh: parseFloat(getComputedStyle(i).lineHeight) }`)
      }
      const g0 = await geo(0)
      const NS = [1, 2, 3, 5, 8, 12, 20, 40]
      let worst = 0, cededFrom = 0
      for (const n of NS) {
        const g = await geo(n)
        const d = Math.max(Math.abs(g.ctl.t - g0.ctl.t), Math.abs(g.ctl.h - g0.ctl.h), Math.abs(g.root.h - g0.root.h), Math.abs(g.folio.t - g0.folio.t), Math.abs(g.folio.h - g0.folio.h), Math.abs(g.serv.t - g0.serv.t), Math.abs(g.serv.h - g0.serv.h), Math.abs(g.notas.t - g0.notas.t), Math.abs(g.row.h - g0.row.h))
        worst = Math.max(worst, d)
        ok(d < 0.5, `${name} A: Δ ${r2(d)}px con ${n} elegidas (caja, raíz, vecinas, fila o lo de debajo)`)
        ok(g.s && g.s.h <= g.input.h + 0.5 && Math.abs((g.s.t + g.s.b) / 2 - (g.input.t + g.input.b) / 2) < 1, `${name} A: la frase no está en una línea centrada con ${n} (${g.s && r2(g.s.h)} / ${r2(g.input.h)})`)
        ok(g.tops.every((x) => Math.abs(x - g.tops[0]) < 1.5), `${name} A: trozos de la frase a distinta altura con ${n}`)
        ok(g.s.l >= g.cell.l - 0.5 && g.s.r <= g.cell.r + 0.5, `${name} A: la frase se sale de su celda con ${n}`)
        ok(g.over <= 1 || (g.nItems === 1 && g.first && g.first.to === 'ellipsis'), `${name} A: la frase desborda tras ceder con ${n} (${g.over}px)`)
        ok(g.nItems + g.restN === n, `${name} A: ${g.nItems} a la vista + «${g.rest}» ≠ ${n}`)
        if (g.restN) { ok(/^\d+ más$/.test(g.rest), `${name} A: cesión sin «N más»: «${g.rest}»`); if (!cededFrom) cededFrom = n }
      }
      note('A · Δ0 de 0 a 40 (GFormRow de tres + línea de debajo)', `${name}: máx ${r2(worst)}px; cede desde ${cededFrom}`)
      // Con el foco: ≤ 55 % de la celda y text-muted
      await geo(8)
      await page.focus('#cm-f-tags'); await page.waitForTimeout(350)
      const f = await E(page, `const r = H.root('cm-f-tags'), s = r.querySelector('.g-combobox__sentence'), i = document.getElementById('cm-f-tags'), c = i.parentElement
        return { s: s.getBoundingClientRect().width, c: c.getBoundingClientRect().width, i: i.getBoundingClientRect().width, muted: H.same(getComputedStyle(s).color, H.tok('--g-color-text-muted')), rest: s.querySelector('.g-combobox__num')?.textContent }`)
      ok(f.s <= f.c * 0.55 + 1, `${name} A: con el foco la frase ocupa ${r2(f.s / f.c * 100)} % (> 55 %)`)
      ok(f.i >= f.c * 0.45 - 1, `${name} A: con el foco el campo tiene ${r2(f.i / f.c * 100)} % (< 45 %)`)
      ok(f.muted, `${name} A: con el foco la frase no está en text-muted`)
      note('A · frase con el foco', `${name}: ${r2(f.s / f.c * 100)} % de la celda con 8 elegidas («y ${f.rest} más»)`)
      // Retroceso: tachado + selección; segunda pulsación quita; Ctrl+Z devuelve
      await page.keyboard.press('Backspace'); await frames(page, 3); await page.waitForTimeout(250)
      const a = await E(page, `const it = H.root('cm-f-tags').querySelector('.g-combobox__sentence-item.is-armed'); if (!it) return null; const cs = getComputedStyle(it)
        return { line: cs.textDecorationLine, sel: H.same(cs.backgroundColor, H.tok('--g-color-selection', 'backgroundColor')), text: it.textContent, n: window.__cm.tags.length, inCell: it.getBoundingClientRect().right <= it.closest('.g-combobox__value').getBoundingClientRect().right + 0.5 }`)
      ok(a && /line-through/.test(a.line) && a.sel && a.n === 8 && a.inCell, `${name} A: Retroceso no marca con tachado + selección a la vista ${JSON.stringify(a)}`)
      await page.keyboard.press('Backspace'); await frames(page, 2)
      ok(await page.evaluate(() => window.__cm.tags.length) === 7, `${name} A: la segunda pulsación no quitó`)
      await page.keyboard.press('Control+z'); await frames(page, 2)
      const back = await page.evaluate(() => window.__cm.tags.join())
      ok(back === (await page.evaluate(() => window.PlaygroundCombobox.big.slice(0, 8).map((o) => o.value).join())), `${name} A: Ctrl+Z no devolvió a su posición`)
      await shut(page)
      // «Elegidas»: primer grupo, tope 12 + «Ver las 40» dentro del grupo; ejecutarla deja activa la 13
      await openA(page, 'cm-big', 400)
      const e1 = await E(page, `const l = document.getElementById('cm-big-list'), g = l.querySelector('.g-combobox__group'); const opts = g ? [...g.querySelectorAll(':scope > [role=option]:not(.g-combobox__action)')] : []
        const all = g && g.querySelector(':scope > .g-combobox__action--all')
        return { first: Boolean(g && g.classList.contains('is-chosen') && g.closest('li') === l.firstElementChild), n: opts.length, all: all ? all.textContent.trim() : null, tally: g && g.querySelector('.g-combobox__group-tally').textContent.trim(), allLast: Boolean(all && all === g.lastElementChild),
          labelColor: H.same(getComputedStyle(g.querySelector('.g-combobox__group-label')).color, H.tok('--g-color-text')) }`)
      ok(e1.first && e1.n === 12 && /40/.test(e1.all || '') && e1.allLast && e1.tally === '40' && e1.labelColor, `${name} A: «Elegidas» ${JSON.stringify(e1)}`)
      await clickOpt(page, '#cm-big-list .g-combobox__action--all'); await page.waitForTimeout(200)
      const e2 = await E(page, `const l = document.getElementById('cm-big-list'), g = l.querySelector('.g-combobox__group.is-chosen'), i = document.getElementById('cm-big'), a = document.getElementById(i.getAttribute('aria-activedescendant') || 'x'), p = l.closest('.g-combobox__panel')
        return { n: g.querySelectorAll(':scope > [role=option]:not(.g-combobox__action)').length, act: a && a.id, inView: a ? a.getBoundingClientRect().top >= p.getBoundingClientRect().top - 0.5 && a.getBoundingClientRect().bottom <= p.getBoundingClientRect().bottom + 0.5 : false, all: Boolean(g.querySelector('.g-combobox__action--all')) }`)
      ok(e2.n === 40 && e2.act === 'cm-big-opt-c12' && e2.inView && !e2.all, `${name} A: «Ver las 40» ${JSON.stringify(e2)}`)
      await shut(page)
    }
    await ctx.close()
  })

  /* ---------- B · la receta ---------- */
  await sect('recipe', async () => {
    for (const coarse of [false, true]) {
      if (coarse && engine === 'firefox') continue // Firefox no emula pointer: coarse
      const { ctx, page } = await mk({ touch: coarse, mobile: false })
      const isCoarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
      const min = coarse ? 44 : 24
      if (coarse && !isCoarse) { note('B · puntero grueso', 'no emulable'); await ctx.close(); continue }
      for (const [t, name] of coarse ? [['', 'defecto']] : [['', 'defecto'], ['audit', 'auditoría']]) {
        const tag = `${name}${coarse ? ' (táctil)' : ''} B`
        await go(page, { t })
        await into(page, 'cm-dx')
        const st = () => E(page, `const r = H.root('cm-dx'); const rows = [...r.querySelectorAll('.g-combobox__row')]
          return { ctl: H.rect(H.ctl('cm-dx')), label: H.rect(r.querySelector('.g-input__label')), below: H.rect(document.getElementById('cm-out-dx')), chosenLast: r.querySelector('.g-input__support').lastElementChild.classList.contains('g-combobox__chosen'),
            rows: rows.map((x) => ({ h: x.getBoundingClientRect().height, t: x.getBoundingClientRect().top, num: x.querySelector('.g-combobox__row-number')?.textContent, fresh: x.classList.contains('is-fresh'), trace: x.classList.contains('is-trace'), rowH: x.style.getPropertyValue('--_row-h') })) }`)
        const s0 = await st()
        ok(s0.chosenLast && s0.rows.length === 1 && s0.rows[0].num === '1', `${tag}: receta en el pie con un renglón numerado ${JSON.stringify(s0.rows)}`)
        // Agregar con el puntero real y cerrar: «Nueva» + barra al inicio; caja y etiqueta quietas; lo de debajo baja un renglón
        await openA(page, 'cm-dx', 300)
        await clickOpt(page, '#cm-dx-list [role=option][aria-selected=false]:not([aria-disabled=true]):not(.g-combobox__action)')
        await page.waitForTimeout(150)
        await page.keyboard.press('Escape'); await page.waitForTimeout(450)
        const s1 = await st()
        const fresh = await E(page, `const r = H.root('cm-dx'), row = r.querySelector('.g-combobox__row.is-fresh'); if (!row) return null; const b = getComputedStyle(row, '::before'), f = row.querySelector('.g-combobox__row-fresh')
          return { bw: parseFloat(b.width), fw: parseFloat(H.tok('--g-focus-width', 'width')), left: b.left, right: b.right, color: H.same(b.backgroundColor, H.tok('--g-color-accent-text', 'backgroundColor')), text: f && f.textContent.trim(), fv: H.vis(f), fBg: f && H.same(getComputedStyle(f).backgroundColor, H.tok('--g-color-accent-soft', 'backgroundColor')) }`)
        ok(s1.rows.length === 2 && s1.rows[1].fresh && s1.rows[1].num === '2', `${tag}: el nuevo renglón no es 2 ni «Nueva» ${JSON.stringify(s1.rows)}`)
        ok(fresh && fresh.text && fresh.fv && fresh.fBg && fresh.color && fresh.left === '0px' && Math.abs(fresh.bw - fresh.fw) < 0.1, `${tag}: «Nueva» o su barra ${JSON.stringify(fresh)}`)
        const dCtl = Math.max(Math.abs(s1.ctl.t - s0.ctl.t), Math.abs(s1.ctl.h - s0.ctl.h), Math.abs(s1.label.t - s0.label.t))
        ok(dCtl < 0.5, `${tag}: la caja o la etiqueta se movieron al agregar (${r2(dCtl)}px)`)
        const down = s1.below.t - s0.below.t
        ok(Math.abs(down - s1.rows[1].h) < 1, `${tag}: lo de debajo bajó ${r2(down)}px, el renglón mide ${r2(s1.rows[1].h)}px`)
        note('B · agregar', `${tag}: caja Δ${r2(dCtl)}; lo de debajo baja ${r2(down)}px = renglón ${r2(s1.rows[1].h)}px`)
        // Quitar: rastro del mismo alto en el mismo sitio, foco en «Deshacer»
        await clickEl(page, '#sec-combobox-multiple .g-combobox:has(#cm-dx) .g-combobox__row:nth-child(2) .g-combobox__remove')
        await page.mouse.move(2, 2); await page.waitForTimeout(250)
        const s2 = await st()
        const tr = await E(page, `const r = H.root('cm-dx'), row = r.querySelector('.g-combobox__row.is-trace'); if (!row) return null; const t = row.querySelector('.g-combobox__trace'), u = row.querySelector('.g-combobox__undo')
          return { line: getComputedStyle(t).textDecorationLine, muted: H.same(getComputedStyle(t).color, H.tok('--g-color-text-muted')), undoBg: H.same(getComputedStyle(u).backgroundColor, H.tok('--g-color-accent-soft', 'backgroundColor')), focusUndo: document.activeElement === u, u: H.rect(u) }`)
        const dTrace = Math.max(Math.abs(s2.rows[1].h - s1.rows[1].h), Math.abs(s2.rows[1].t - s1.rows[1].t))
        ok(s2.rows[1].trace && dTrace < 0.5, `${tag}: el rastro no mide lo mismo que el renglón (Δ ${r2(dTrace)}px)`)
        ok(s2.rows[1].rowH !== '', `${tag}: el rastro sin --_row-h en línea`)
        ok(tr && /line-through/.test(tr.line) && tr.muted && tr.undoBg && tr.focusUndo, `${tag}: rastro ${JSON.stringify(tr)}`)
        ok(tr && tr.u.h >= min - 0.5, `${tag}: «Deshacer» mide ${tr && r2(tr.u.h)}px de alto (< ${min})`)
        if (coarse) ok(tr && tr.u.w >= 43.5, `${tag}: «Deshacer» mide ${tr && r2(tr.u.w)}px de ancho (< 44)`)
        note('B · rastro', `${tag}: Δ ${r2(dTrace)}px (--_row-h ${s2.rows[1].rowH})`)
        // «Deshacer» devuelve y deja el foco en su «Quitar»
        await page.keyboard.press('Enter'); await page.waitForTimeout(250)
        const s3 = await E(page, `const r = H.root('cm-dx'), rows = [...r.querySelectorAll('.g-combobox__row')]; const q = rows[1] && rows[1].querySelector('.g-combobox__remove')
          return { n: rows.length, trace: rows.some((x) => x.classList.contains('is-trace')), focus: document.activeElement === q, q: H.rect(q), model: window.__cm.dx.length }`)
        ok(s3.n === 2 && !s3.trace && s3.focus && s3.model === 2, `${tag}: «Deshacer» ${JSON.stringify(s3)}`)
        ok(s3.q.w >= min - 0.5 && s3.q.h >= min - 0.5, `${tag}: «Quitar» ${r2(s3.q.w)}×${r2(s3.q.h)} (< ${min})`)
        // Tope 6 y «Ver los 40» en la receta de 40
        await into(page, 'cm-big-b')
        const v0 = await E(page, `const r = H.root('cm-big-b'), b = r.querySelector('.g-combobox__rows-all'); return { n: r.querySelectorAll('.g-combobox__row').length, text: b && b.textContent.trim(), exp: b && b.getAttribute('aria-expanded'), rot: b && getComputedStyle(b.querySelector('svg')).rotate, b: H.rect(b) }`)
        ok(v0.n === 6 && /40/.test(v0.text) && v0.exp === 'false', `${tag}: tope 6 ${JSON.stringify(v0)}`)
        ok(v0.b && v0.b.h >= min - 0.5 && (!coarse || v0.b.w >= 43.5), `${tag}: «Ver los N» ${v0.b && r2(v0.b.w)}×${v0.b && r2(v0.b.h)}`)
        await clickEl(page, '#sec-combobox-multiple .g-combobox:has(#cm-big-b) .g-combobox__rows-all'); await page.waitForTimeout(250)
        const v1 = await E(page, `const r = H.root('cm-big-b'), b = r.querySelector('.g-combobox__rows-all'); return { n: r.querySelectorAll('.g-combobox__row').length, text: b.textContent.trim(), exp: b.getAttribute('aria-expanded'), rot: getComputedStyle(b.querySelector('svg')).rotate }`)
        ok(v1.n === 40 && v1.exp === 'true' && /menos/.test(v1.text) && /180deg|0\.5turn/.test(v1.rot), `${tag}: «Ver los 40» desplegado ${JSON.stringify(v1)}`)
        await clickEl(page, '#sec-combobox-multiple .g-combobox:has(#cm-big-b) .g-combobox__rows-all'); await page.waitForTimeout(200)
        // Tope (max 3): estado, no elegidas aria-disabled y recorribles
        await page.evaluate(() => { const v = window.__cb.dxOptions.flatMap((g) => g.options || [g]).map((o) => o.value); window.__cm.dx = v.slice(0, 3) })
        await frames(page, 2)
        await openA(page, 'cm-dx', 300)
        const m = await E(page, `const r = H.root('cm-dx'), p = document.getElementById('cm-dx-popup'), s = p.querySelector('.g-combobox__status--max'), l = document.getElementById('cm-dx-list')
          return { full: r.classList.contains('is-full'), status: Boolean(s && H.vis(s)), outside: Boolean(s && !l.contains(s)), icon: Boolean(s && s.querySelector('svg')), bg: s && H.same(getComputedStyle(s).backgroundColor, H.tok('--g-color-warning-soft', 'backgroundColor')), dis: l.querySelectorAll('[role=option][aria-disabled=true]').length }`)
        ok(m.full && m.status && m.outside && m.icon && m.bg && m.dis > 0, `${tag}: tope ${JSON.stringify(m)}`)
        let hit = false
        for (let k = 0; k < 6 && !hit; k++) { await page.keyboard.press('ArrowDown'); hit = await page.evaluate(() => { const a = document.getElementById(document.getElementById('cm-dx').getAttribute('aria-activedescendant') || 'x'); return Boolean(a && a.getAttribute('aria-disabled') === 'true') }) }
        ok(hit, `${tag}: las no elegibles por el tope no se recorren`)
        await page.keyboard.press('Enter'); await page.waitForTimeout(120)
        ok(await page.evaluate(() => window.__cm.dx.length) === 3, `${tag}: Intro sobre una no elegible cambió el modelo`)
        await shut(page)
      }
      await ctx.close()
    }
    // Slot chosen de cuatro líneas (banco): el rastro mide lo mismo (--_row-h), en la receta y en la cesta
    const { ctx, page } = await mk()
    await bank(page)
    const h0 = await E(page, `const r = H.root('ab-tall'), rows = [...r.querySelectorAll('.g-combobox__row')]; return { h: rows.map((x) => x.getBoundingClientRect().height), t: rows.map((x) => x.getBoundingClientRect().top), after: document.getElementById('ab-tall-after').getBoundingClientRect().top }`)
    await clickEl(page, '#app .g-combobox:has(#ab-tall) .g-combobox__row:nth-child(2) .g-combobox__remove'); await page.waitForTimeout(300)
    const h1 = await E(page, `const r = H.root('ab-tall'), rows = [...r.querySelectorAll('.g-combobox__row')]; return { h: rows.map((x) => x.getBoundingClientRect().height), t: rows.map((x) => x.getBoundingClientRect().top), trace: rows[1].classList.contains('is-trace'), rowH: rows[1].style.getPropertyValue('--_row-h'), after: document.getElementById('ab-tall-after').getBoundingClientRect().top }`)
    const dTall = Math.max(Math.abs(h1.h[1] - h0.h[1]), Math.abs(h1.after - h0.after))
    ok(h1.trace && h0.h[1] > 80 && dTall < 0.5, `B slot chosen alto: rastro ${r2(h1.h[1])} frente a ${r2(h0.h[1])}px, lo de debajo Δ ${r2(h1.after - h0.after)} (--_row-h «${h1.rowH}»)`)
    note('B · slot chosen de cuatro líneas', `renglón ${r2(h0.h[1])}px → rastro ${r2(h1.h[1])}px (Δ ${r2(dTall)}); --_row-h ${h1.rowH}`)
    await openC(page, 'ab-tall-c')
    const c0 = await E(page, `const s = document.getElementById('ab-tall-c-surface'), rows = [...s.querySelectorAll('.g-combobox__basket .g-combobox__row')]; return rows.map((x) => x.getBoundingClientRect().height)`)
    await clickEl(page, '#ab-tall-c-surface .g-combobox__basket .g-combobox__row:nth-child(2) .g-combobox__remove'); await page.waitForTimeout(300)
    const c1 = await E(page, `const s = document.getElementById('ab-tall-c-surface'), rows = [...s.querySelectorAll('.g-combobox__basket .g-combobox__row')]; return { h: rows.map((x) => x.getBoundingClientRect().height), trace: rows[1] && rows[1].classList.contains('is-trace') }`)
    ok(c1.trace && Math.abs(c1.h[1] - c0[1]) < 0.5, `C slot chosen alto: rastro de la cesta ${r2(c1.h[1])} frente a ${r2(c0[1])}px`)
    note('C · slot chosen de cuatro líneas', `tarjeta ${r2(c0[1])}px → rastro ${r2(c1.h[1])}px`)
    await ctx.close()
  })

  /* ---------- C · la cesta ---------- */
  await sect('basket', async () => {
    const { ctx, page } = await mk()
    for (const [t, dark, name] of [['', false, 'defecto'], ['audit', false, 'auditoría'], ['', true, 'defecto oscuro']]) {
      await go(page, { t, dark, motion: 'no-preference' })
      await openC(page, 'cm-resp')
      const e0 = await E(page, `const s = document.getElementById('cm-resp-surface'); return { body: Boolean(s.querySelector('.g-combobox__surface-body.has-basket')), empty: s.querySelector('.g-combobox__basket-empty')?.textContent.trim(), title: s.querySelector('.g-combobox__basket-title')?.textContent.trim(), preview: Boolean(s.querySelector('.g-combobox__preview')) }`)
      ok(e0.body && e0.empty && e0.title && !e0.preview, `${name} C: cesta vacía ${JSON.stringify(e0)}`)
      // Marcar la primera «Ana López Ruiz» con el puntero real y seguir el viaje cuadro a cuadro. La duración se dilata
      // (--g-duration-slow 1500 ms, tema sin capa) para muestrearla también en WebKit sin cabeza (pinta cada 40–75 ms;
      // con 300 ms solo se ven 3 o 4 cuadros y el muelle ya llegó)
      await page.evaluate(() => {
        const st = document.createElement('style'); st.id = '__slow'; st.textContent = ':root, :root[data-theme] { --g-duration-slow: 1500ms; }'; document.head.append(st)
        window.__trip = []
        const s = document.getElementById('cm-resp-surface'); const t0 = performance.now()
        const tick = () => { const row = s.querySelector('.g-combobox__basket .g-combobox__row'); if (row) { const b = row.getBoundingClientRect(); const a = row.getAnimations().map((x) => x.animationName); window.__trip.push({ t: performance.now() - t0, x: b.left, y: b.top, arriving: row.classList.contains('is-arriving'), a, ease: getComputedStyle(row).animationTimingFunction }) } if (performance.now() - t0 < 3000) requestAnimationFrame(tick) }
        requestAnimationFrame(tick)
      })
      await clickOpt(page, '#cm-resp-opt-0')
      await page.waitForTimeout(3100)
      await page.evaluate(() => document.getElementById('__slow').remove())
      const trip = await page.evaluate(() => window.__trip)
      const moving = trip.filter((f) => f.a.includes('g-combobox-arrive'))
      const last = trip[trip.length - 1]
      const spring = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--g-ease-spring').trim())
      const dist = moving.length ? Math.hypot(moving[0].x - last.x, moving[0].y - last.y) : 0
      ok(moving.length >= 2 && dist > 8, `${name} C: el renglón no viaja (${moving.length} cuadros, ${r2(dist)}px)`)
      ok(moving.length && /linear\(/.test(moving[0].ease) && /^linear\(/.test(spring), `${name} C: el viaje no usa --g-ease-spring (${moving[0] && moving[0].ease.slice(0, 40)})`)
      ok(!last.arriving && !last.a.length, `${name} C: is-arriving o la animación no se retiraron`)
      note('C · viaje (duración dilatada a 1500 ms)', `${name}: ${moving.length} cuadros, parte a ${r2(dist)}px del sitio final, termina en 0`)
      await clickOpt(page, '#cm-resp-opt-1'); await page.waitForTimeout(700)
      const g = await E(page, `const s = document.getElementById('cm-resp-surface'), p = s.querySelector('.g-combobox__surface-body > .g-combobox__panel'), b = s.querySelector('.g-combobox__basket'), rows = [...b.querySelectorAll('.g-combobox__row')]
        const pr = H.rect(p), br = H.rect(b), d = H.rect(s), foot = s.querySelector('.g-combobox__foot'), done = s.querySelector('.g-combobox__done')
        return { pr, br, d, ratio: pr.w / br.w, overlap: !(pr.r <= br.l + 0.5 || br.r <= pr.l + 0.5), rowsIn: rows.every((x) => { const r = x.getBoundingClientRect(); return r.left >= br.l - 0.5 && r.right <= br.r + 0.5 }), rowsOver: rows.map((x) => x.scrollWidth - x.clientWidth), bOver: b.scrollWidth - b.clientWidth, dOver: s.scrollWidth - s.clientWidth,
          diff: b.querySelectorAll('.g-summary__fact.is-diff').length, n: rows.length, foot: H.rect(foot), tally: s.querySelector('.g-combobox__foot-tally')?.textContent.trim(), done: Boolean(done && done.classList.contains('g-btn') && H.vis(done)), doneR: H.rect(done) }`)
      ok(g.n === 2 && !g.overlap && g.rowsIn && g.rowsOver.every((x) => x <= 1) && g.bOver <= 1 && g.dOver <= 1, `${name} C: solapes o desbordes ${JSON.stringify({ n: g.n, overlap: g.overlap, rowsIn: g.rowsIn, rowsOver: g.rowsOver, bOver: g.bOver, dOver: g.dOver })}`)
      ok(Math.abs(g.ratio - 1.2) < 0.02, `${name} C: proporción resultados : cesta ${r2(g.ratio)} (≠ 6 : 5)`)
      ok(g.diff >= 2, `${name} C: los homónimos de la cesta sin is-diff (${g.diff})`)
      ok(g.done && g.tally && g.foot.b <= g.d.b + 0.5 && g.foot.t >= g.br.b - 0.5 && g.doneR.r <= g.d.r + 0.5, `${name} C: pie ${JSON.stringify({ tally: g.tally, done: g.done, foot: g.foot, d: g.d })}`)
      note('C · cesta', `${name}: 6 : 5 = ${r2(g.ratio)}; homónimos con ${g.diff} datos is-diff; pie «${g.tally}» + «Listo»`)
      // Quitar en la cesta: rastro del mismo alto, foco en «Deshacer»
      const h0 = await E(page, `return [...document.querySelectorAll('#cm-resp-surface .g-combobox__basket .g-combobox__row')].map((x) => x.getBoundingClientRect().height)`)
      await clickEl(page, '#cm-resp-surface .g-combobox__basket .g-combobox__row:nth-child(1) .g-combobox__remove'); await page.waitForTimeout(300)
      const h1 = await E(page, `const rows = [...document.querySelectorAll('#cm-resp-surface .g-combobox__basket .g-combobox__row')]; const u = rows[0].querySelector('.g-combobox__undo'); return { h: rows.map((x) => x.getBoundingClientRect().height), trace: rows[0].classList.contains('is-trace'), focus: document.activeElement === u, dashed: getComputedStyle(rows[0]).borderTopStyle }`)
      ok(h1.trace && Math.abs(h1.h[0] - h0[0]) < 0.5 && h1.focus && h1.dashed === 'dashed', `${name} C: rastro de la cesta ${JSON.stringify(h1)} frente a ${h0[0]}`)
      await page.keyboard.press('Enter'); await page.waitForTimeout(250)
      // «Listo» cierra conservando y el foco vuelve al campo
      await clickEl(page, '#cm-resp-surface .g-combobox__done'); await page.waitForTimeout(450)
      const cl = await page.evaluate(() => ({ open: document.getElementById('cm-resp-surface').open, focus: document.activeElement && document.activeElement.id, model: window.__cm.resp.length }))
      ok(!cl.open && cl.focus === 'cm-resp' && cl.model === 2, `${name} C: «Listo» ${JSON.stringify(cl)}`)
      await page.evaluate(() => { window.__cm.resp = [] })
    }
    await ctx.close()
    // Hoja a 375 y 320
    for (const [w, h] of [[375, 812], [320, 640]]) {
      const { ctx, page } = await mk({ width: w, height: h })
      await go(page, { cm: 'C' })
      await openC(page, 'cm-resp')
      await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await page.waitForTimeout(250)
      await clickEl(page, '#cm-resp-surface .g-combobox__done'); await page.waitForTimeout(450)
      await openC(page, 'cm-resp')
      const s = await E(page, `const d = document.getElementById('cm-resp-surface'), r = H.rect(d), opts = [...d.querySelectorAll('[role=option]')], g = d.querySelector('.g-combobox__list > li:first-child > .g-combobox__group'), done = d.querySelector('.g-combobox__done'), b = d.querySelector('.g-combobox__basket')
        return { r, vw: innerWidth, vh: innerHeight, basket: Boolean(b && H.vis(b)), chosen: Boolean(g && g.classList.contains('is-chosen')), minOpt: Math.min(...opts.map((o) => o.getBoundingClientRect().height)), pageOver: document.documentElement.scrollWidth - innerWidth, dOver: d.scrollWidth - d.clientWidth, done: H.rect(done) }`)
      ok(s.r.t < 1 && Math.abs(s.r.w - s.vw) < 1, `C hoja ${w}: no es una hoja arriba de ancho completo ${JSON.stringify(s.r)}`)
      ok(!s.basket && s.chosen, `C hoja ${w}: con cesta o sin «Elegidas» arriba (cesta ${s.basket}, elegidas ${s.chosen})`)
      ok(s.minOpt >= 43.5, `C hoja ${w}: opción de ${r2(s.minOpt)}px (< 44)`)
      ok(s.pageOver <= 0 && s.dOver <= 1, `C hoja ${w}: desborde horizontal (página ${s.pageOver}, hoja ${s.dOver})`)
      ok(s.done && s.done.b <= s.vh + 0.5 && s.done.r <= s.vw + 0.5, `C hoja ${w}: «Listo» fuera del visor ${JSON.stringify(s.done)}`)
      note('C · hoja móvil', `${w}px: arriba, ancho completo, «Elegidas» arriba, opciones ≥ ${r2(s.minOpt)}px, sin desborde`)
      await ctx.close()
    }
  })

  /* ---------- Despliegue de A con movimiento y duración real ---------- */
  await sect('deploy', async () => {
    const { ctx, page } = await mk()
    for (const [cm, t, dark, name, ids] of [['A', '', false, 'defecto', ['cm-alg', 'cm-big', 'cm-f-tags']], ['A', 'audit', false, 'auditoría', ['cm-alg', 'cm-big']], ['A', '', true, 'oscuro', ['cm-alg']], ['B', '', false, 'defecto (B)', ['cm-dx', 'cm-big-b']]]) {
      await go(page, { cm, t, dark, motion: 'no-preference' })
      for (const id of ids) {
        await into(page, id)
        await page.focus('#' + id)
        await page.waitForTimeout(200)
        await page.evaluate((id) => {
          const i = document.getElementById(id); const slow = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-duration-slow')) || 300
          window.__frames = []; const t0 = performance.now()
          const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, h: b.height } }
          const tick = () => {
            const pop = document.getElementById(id + '-popup'); const panel = pop && pop.matches(':popover-open') ? pop.querySelector('.g-combobox__panel') : null; const act = i.getAttribute('aria-activedescendant')
            window.__frames.push({ t: performance.now() - t0, ctl: r(i.closest('.g-input__control')), pop: panel ? r(pop) : null, panel: r(panel), st: panel ? panel.scrollTop : null, act: act ? r(document.getElementById(act)) : null, actId: act, up: i.closest('.g-combobox').classList.contains('is-up') })
            if (performance.now() - t0 < slow * 2 + 250) requestAnimationFrame(tick); else window.__done = true
          }
          window.__done = false; requestAnimationFrame(tick)
        }, id)
        await page.keyboard.press('ArrowDown')
        await page.waitForFunction(() => window.__done, null, { timeout: 5000 })
        const fr = await page.evaluate(() => window.__frames)
        const shown = fr.filter((f) => f.panel && f.panel.h > 0 && f.act)
        const tag = `${name} ${id}`
        ok(shown.length >= 2, `${tag}: ${shown.length} cuadros con panel y activa`)
        if (!shown.length) { await shut(page); continue }
        const heights = new Set(shown.map((f) => Math.round(f.panel.h)))
        const up = shown[0].up, e0 = up ? shown[0].pop.bottom : shown[0].pop.top
        let bad = []
        for (const f of shown) {
          if (f.up !== up) bad.push('lado')
          if (Math.abs((up ? f.pop.bottom : f.pop.top) - e0) >= 1) bad.push('forma movida')
          if (f.st !== 0) bad.push(`scrollTop ${f.st}`)
          if (f.act.top < f.panel.top - 0.5) bad.push('activa fuera del panel')
          if (!up && f.act.top < f.ctl.bottom - 1) bad.push('activa bajo el campo')
        }
        const last = shown[shown.length - 1]
        ok(!bad.length, `${tag}: ${[...new Set(bad)].join(', ')}`)
        ok(last.act.top >= last.panel.top - 0.5 && last.act.bottom <= last.panel.bottom + 0.5, `${tag}: al terminar la activa no está entera a la vista`)
        ok(shown[0].actId && /-opt-(c)?0$/.test(shown[0].actId), `${tag}: la activa no es la primera (${shown[0].actId})`)
        note('Despliegue con movimiento (duración real)', `${tag}: ${shown.length} cuadros, ${heights.size} altos del panel, scrollTop 0, activa ${shown[0].actId}`)
        await shut(page)
      }
    }
    await ctx.close()
  })

  /* ---------- Contraste ---------- */
  await sect('contrast', async () => {
    const { ctx, page } = await mk()
    const CONF = [['', 'defecto'], ['audit', 'auditoría'], ['primary', 'primary propia'], ...(engine === 'chromium' ? GEN.map((g) => [g, g]) : [])]
    const worst = {}
    for (const [t, name] of CONF) for (const dark of [false, true]) {
      const cname = `${name} ${dark ? 'oscuro' : 'claro'}`
      const out = []
      try {
        await go(page, { t, dark })
        // A: frase, texto libre, «y N más»
        await page.evaluate(() => { window.__cm.alg = ['penicilina']; window.__cm.algC = ['Polen de olivo'] })
        await into(page, 'cm-alg'); await frames(page, 3)
        out.push(...await E(page, `const r = H.root('cm-alg'), s = r.querySelector('.g-combobox__sentence'), c = s.querySelector('.is-custom')
          return [H.pair('frase: elemento', s.querySelector('.g-combobox__sentence-item')), H.pair('frase: texto libre', c), H.vs('frase: lápiz (icono)', getComputedStyle(c.querySelector('svg')).color, c, 3)]`))
        await page.evaluate(() => { window.__cm.alg = window.__cm.allergens.flatMap((g) => g.options || [g]).map((o) => o.value).slice(0, 9) })
        await frames(page, 3); await page.waitForTimeout(60)
        out.push(...await E(page, `const s = H.root('cm-alg').querySelector('.g-combobox__sentence'); return [H.pair('frase: «y N más»', s.querySelector('.g-combobox__sentence-rest'))]`))
        await page.focus('#cm-alg'); await page.waitForTimeout(300)
        out.push(...await E(page, `const s = H.root('cm-alg').querySelector('.g-combobox__sentence'); return [H.pair('frase con el foco', s.querySelector('.g-combobox__sentence-item'))]`))
        await page.keyboard.press('Backspace'); await frames(page, 3)
        out.push(...await E(page, `return [H.pair('frase: marcada por Retroceso', H.root('cm-alg').querySelector('.g-combobox__sentence-item.is-armed'))]`))
        await page.keyboard.press('Escape'); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300)
        out.push(...await E(page, `const l = document.getElementById('cm-alg-list'), g = l.querySelector('.g-combobox__group.is-chosen'), sel = g.querySelector('[role=option][aria-selected=true]:not(.is-active)') || g.querySelector('[role=option][aria-selected=true]'), un = l.querySelector('[role=option][aria-selected=false]:not(.g-combobox__action):not(.is-active)')
          const bs = sel.querySelector('.g-combobox__box'), bu = un.querySelector('.g-combobox__box'), cs = getComputedStyle(bs)
          return [H.pair('«Elegidas»: rótulo', g.querySelector('.g-combobox__group-label')), H.pair('«Elegidas»: recuento', g.querySelector('.g-combobox__group-tally')),
            H.vs('casilla sin marcar: borde', getComputedStyle(bu).borderTopColor, un), H.vs('casilla marcada: contorno text', cs.borderTopColor, sel), H.vs('casilla marcada: marca on-primary / primary', getComputedStyle(bs.querySelector('svg')).color, bs),
            { k: 'casilla marcada: es primary', r: H.same(cs.backgroundColor, H.tok('--g-color-primary', 'backgroundColor')) ? 9 : 0, min: 1 }]`))
        await page.keyboard.press('Escape'); await page.keyboard.press('Escape')
        // Tope (cm-dx, B, max 3): estado; receta: número, «Nueva», barra, «Quitar», rastro, «Deshacer», marcado, «Ver los N»
        await page.evaluate(() => { const v = window.__cb.dxOptions.flatMap((g) => g.options || [g]).map((o) => o.value); window.__cm.dx = v.slice(0, 2) })
        await into(page, 'cm-dx'); await frames(page, 2)
        await openA(page, 'cm-dx', 300)
        await clickOpt(page, '#cm-dx-list [role=option][aria-selected=false]:not(.g-combobox__action)'); await page.waitForTimeout(200)
        out.push(...await E(page, `const s = document.querySelector('#cm-dx-popup .g-combobox__status--max'); return [H.pair('estado del tope', s), s ? H.vs('estado del tope: icono', getComputedStyle(s.querySelector('svg')).color, s, 3) : { k: 'icono del tope (no está)', r: 0, min: 3 },
          H.vs('casilla no elegible: borde (informativo)', getComputedStyle(document.querySelector('#cm-dx-list [aria-disabled=true] .g-combobox__box')).borderTopColor, document.querySelector('#cm-dx-list [aria-disabled=true]'), 1)]`))
        await page.keyboard.press('Escape'); await page.waitForTimeout(400)
        out.push(...await E(page, `const r = H.root('cm-dx'), f = r.querySelector('.g-combobox__row.is-fresh'), row = r.querySelector('.g-combobox__row')
          return [H.pair('receta: número', row.querySelector('.g-combobox__row-number')), H.pair('receta: título', row.querySelector('.g-summary__title')), H.pair('receta: «Nueva»', f.querySelector('.g-combobox__row-fresh')),
            H.vs('receta: barra de «Nueva»', getComputedStyle(f, '::before').backgroundColor, f, 3), H.vs('receta: «Quitar» (icono)', getComputedStyle(row.querySelector('.g-combobox__remove')).color, row, 3)]`))
        await page.focus('#cm-dx'); await page.keyboard.press('Backspace'); await frames(page, 3)
        out.push(...await E(page, `const a = H.root('cm-dx').querySelector('.g-combobox__row.is-armed'); return [H.pair('receta: marcada por Retroceso', a && a.querySelector('.g-summary__title'))]`))
        await page.keyboard.press('Escape')
        await clickEl(page, '#sec-combobox-multiple .g-combobox:has(#cm-dx) .g-combobox__row:nth-child(1) .g-combobox__remove'); await page.waitForTimeout(250)
        out.push(...await E(page, `const t = H.root('cm-dx').querySelector('.g-combobox__row.is-trace'); return [H.pair('receta: rastro', t.querySelector('.g-combobox__trace')), H.pair('receta: «Deshacer»', t.querySelector('.g-combobox__undo'))]`))
        await page.hover('#sec-combobox-multiple .g-combobox:has(#cm-dx) .g-combobox__undo'); await page.waitForTimeout(250)
        out.push(...await E(page, `return [H.pair('receta: «Deshacer» al pasar', H.root('cm-dx').querySelector('.g-combobox__undo'))]`))
        await page.mouse.move(2, 2)
        out.push(...await E(page, `return [H.pair('receta: «Ver los N»', H.root('cm-big-b').querySelector('.g-combobox__rows-all'))]`))
        // C: cesta vacía, título, recuento, pie, renglón, rastro y «Deshacer» de la cesta; activa invertida con casilla
        await openC(page, 'cm-resp')
        out.push(...await E(page, `const s = document.getElementById('cm-resp-surface'); return [H.pair('cesta: vacía', s.querySelector('.g-combobox__basket-empty')), H.pair('cesta: título', s.querySelector('.g-combobox__basket-title')), H.pair('pie: recuento', s.querySelector('.g-combobox__foot-tally'))]`))
        await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await page.waitForTimeout(250)
        await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await page.waitForTimeout(250)
        out.push(...await E(page, `const s = document.getElementById('cm-resp-surface'), act = s.querySelector('.g-combobox__option.is-active'), b = act.querySelector('.g-combobox__box'), row = s.querySelector('.g-combobox__basket .g-combobox__row')
          return [H.pair('cesta: recuento', s.querySelector('.g-combobox__basket-tally')), H.pair('cesta: renglón', row.querySelector('.g-summary__title')), H.pair('cesta: dato del renglón', row.querySelector('.g-summary__fact-value')),
            H.vs('paleta: casilla marcada en la activa invertida (contorno)', getComputedStyle(b).borderTopColor, act, 3), H.vs('paleta: marca en la activa invertida', getComputedStyle(b.querySelector('svg')).color, b, 3)]`))
        await clickEl(page, '#cm-resp-surface .g-combobox__basket .g-combobox__row:nth-child(1) .g-combobox__remove'); await page.waitForTimeout(250)
        out.push(...await E(page, `const t = document.querySelector('#cm-resp-surface .g-combobox__basket .g-combobox__row.is-trace'); return [H.pair('cesta: rastro', t.querySelector('.g-combobox__trace')), H.pair('cesta: «Deshacer»', t.querySelector('.g-combobox__undo'))]`))
        await page.keyboard.press('Escape'); await page.waitForTimeout(350)
      } catch (e) { ok(false, `${cname}: contraste no medible (${e.message.split('\n')[0]})`); continue }
      for (const c of out) { ok(c.r >= c.min, `${cname}: ${c.k} ${c.r}:1 < ${c.min}`); if (!/informativo/.test(c.k) && c.min > 1) worst[c.k] = Math.min(worst[c.k] ?? 99, c.r); else if (/informativo/.test(c.k)) worst[c.k] = Math.min(worst[c.k] ?? 99, c.r) }
    }
    note('Contraste (mínimo de las configuraciones)', `${CONF.length * 2} configuraciones: ` + Object.entries(worst).map(([k, v]) => `${k} ${v}`).join(' · '))
    await ctx.close()
  })

  /* ---------- Teclado ---------- */
  await sect('keys', async () => {
    const { ctx, page } = await mk()
    await go(page)
    await into(page, 'cm-alg'); await page.focus('#cm-alg')
    await page.keyboard.type('ibu'); await page.waitForTimeout(250)
    await page.keyboard.press('Enter'); await page.waitForTimeout(120)
    const k1 = await page.evaluate(() => { const i = document.getElementById('cm-alg'); return { m: window.__cm.alg.slice(), exp: i.getAttribute('aria-expanded'), sel: [i.selectionStart, i.selectionEnd, i.value.length] } })
    ok(k1.m.includes('ibuprofeno') && k1.m.length === 3 && k1.exp === 'true' && k1.sel[0] === 0 && k1.sel[1] === k1.sel[2] && k1.sel[2] === 3, `teclado: Intro no alterna con la lista abierta y el texto seleccionado ${JSON.stringify(k1)}`)
    await page.keyboard.type('sulf'); await page.waitForTimeout(250)
    await page.keyboard.press('Tab'); await page.waitForTimeout(150)
    const k2 = await page.evaluate(() => ({ m: window.__cm.alg.slice(), exp: document.getElementById('cm-alg').getAttribute('aria-expanded') }))
    ok(k2.m.length === 3 && !k2.m.includes('sulfonamidas') && k2.exp === 'false', `teclado: Tab eligió o no cerró ${JSON.stringify(k2)}`)
    await page.focus('#cm-alg'); await page.keyboard.press('Backspace'); await frames(page, 2)
    const k3 = await page.evaluate(() => ({ n: window.__cm.alg.length, armed: Boolean(document.querySelector('#sec-combobox-multiple .g-combobox:has(#cm-alg) .is-armed')) }))
    ok(k3.n === 3 && k3.armed, `teclado: la primera pulsación de Retroceso no solo marca ${JSON.stringify(k3)}`)
    await page.keyboard.press('Backspace'); await frames(page, 2)
    ok(await page.evaluate(() => window.__cm.alg.length) === 2, 'teclado: la segunda pulsación de Retroceso no quita')
    await page.keyboard.press('Control+z'); await frames(page, 2)
    ok((await page.evaluate(() => window.__cm.alg.join())) === 'penicilina,latex,ibuprofeno', 'teclado: Ctrl+Z no devuelve a su posición')
    // Tope aria-disabled recorrible
    await page.evaluate(() => { const v = window.__cb.dxOptions.flatMap((g) => g.options || [g]).map((o) => o.value); window.__cm.dx = v.slice(0, 3) })
    await openA(page, 'cm-dx', 300)
    const seen = new Set()
    for (let k = 0; k < 8; k++) { await page.keyboard.press('ArrowDown'); seen.add(await page.evaluate(() => { const a = document.getElementById(document.getElementById('cm-dx').getAttribute('aria-activedescendant') || 'x'); return a ? a.getAttribute('aria-disabled') || 'no' : 'nada' })) }
    ok(seen.has('true'), `teclado: con el tope, las no elegibles no se recorren (${[...seen]})`)
    await shut(page)
    note('Teclado', 'Intro alterna (lista abierta, texto seleccionado), Tab no elige y cierra, Retroceso en dos tiempos, Ctrl+Z a su posición, tope recorrible')
    await ctx.close()
  })

  /* ---------- Movimiento y movimiento reducido ---------- */
  await sect('motion', async () => {
    for (const motion of ['no-preference', 'reduce']) {
      const { ctx, page } = await mk()
      await go(page, { motion })
      await page.evaluate(() => {
        window.__seen = new Set(); window.__eases = {}
        const t0 = performance.now()
        const tick = () => { for (const a of document.getAnimations()) if (/^g-combobox-/.test(a.animationName || '')) { window.__seen.add(a.animationName); window.__eases[a.animationName] = getComputedStyle(a.effect.target).animationTimingFunction } if (performance.now() - t0 < 20000) requestAnimationFrame(tick) }
        requestAnimationFrame(tick)
      })
      await openA(page, 'cm-alg', 300)
      await clickOpt(page, '#cm-alg-list [role=option][aria-selected=false]:not(.g-combobox__action)'); await page.waitForTimeout(500)
      await page.keyboard.press('Escape'); await page.waitForTimeout(150)
      await openA(page, 'cm-dx', 300)
      await clickOpt(page, '#cm-dx-list [role=option][aria-selected=false]:not(.g-combobox__action)'); await page.waitForTimeout(200)
      await page.keyboard.press('Escape'); await page.waitForTimeout(600)
      await openC(page, 'cm-resp')
      await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await page.waitForTimeout(700)
      await page.keyboard.press('Escape'); await page.waitForTimeout(400)
      const r = await page.evaluate(() => ({ seen: [...window.__seen], eases: window.__eases, left: document.querySelectorAll('#sec-combobox-multiple :is(.is-ticking, .is-rolling, .is-entering, .is-leaving, .is-arriving)').length }))
      if (motion === 'reduce') ok(!r.seen.length && !r.left, `reducido: animaciones ${r.seen} o clases pendientes ${r.left}`)
      else {
        ok(['g-combobox-tick', 'g-combobox-roll', 'g-combobox-row-in', 'g-combobox-arrive'].every((n) => r.seen.includes(n)), `movimiento: faltan animaciones (${r.seen})`)
        ok(/linear\(/.test(r.eases['g-combobox-tick'] || ''), `movimiento: la casilla no rebota (${r.eases['g-combobox-tick']})`)
        ok(!r.left, `movimiento: ${r.left} clases sin retirar`)
      }
      note('Movimiento', `${motion}: ${r.seen.length ? r.seen.join(', ') : 'ninguna animación g-combobox-*'}; clases pendientes ${r.left}`)
      await ctx.close()
    }
  })

  /* ---------- RTL ---------- */
  await sect('rtl', async () => {
    const { ctx, page } = await mk()
    await go(page)
    await into(page, 'cm-rtl'); await frames(page, 2)
    const a = await E(page, `const r = H.root('cm-rtl'), s = r.querySelector('.g-combobox__sentence'), c = s.parentElement; return { s: H.rect(s), c: H.rect(c), over: document.documentElement.scrollWidth - innerWidth }`)
    ok(Math.abs(a.s.r - a.c.r) < 0.6 && a.over <= 0, `RTL A: la frase no empieza en el borde de inicio (Δ ${r2(a.s.r - a.c.r)})`)
    await go(page, { cm: 'B' })
    await openA(page, 'cm-rtl', 300)
    await clickOpt(page, '#cm-rtl-list [role=option][aria-selected=false]:not(.g-combobox__action)'); await page.waitForTimeout(150)
    await page.keyboard.press('Escape'); await page.waitForTimeout(450)
    const b = await E(page, `const r = H.root('cm-rtl'), row = r.querySelector('.g-combobox__row.is-fresh'); if (!row) return null; const be = getComputedStyle(row, '::before'), sum = row.querySelector('.g-summary'), rm = row.querySelector('.g-combobox__remove')
      return { right: be.right, left: be.left, sum: H.rect(sum), rm: H.rect(rm), row: H.rect(row), over: row.scrollWidth - row.clientWidth }`)
    ok(b && b.right === '0px' && b.rm.l < b.sum.l && b.over <= 1, `RTL B: barra o «Quitar» sin espejar ${JSON.stringify(b)}`)
    await shut(page)
    await go(page, { cm: 'C' })
    await openC(page, 'cm-rtl')
    const c = await E(page, `const s = document.getElementById('cm-rtl-surface'), p = s.querySelector('.g-combobox__surface-body > .g-combobox__panel'), k = s.querySelector('.g-combobox__basket'); return { p: H.rect(p), k: H.rect(k) }`)
    ok(c.k && c.k.r <= c.p.l + 0.5, `RTL C: la cesta no queda al otro lado (a la izquierda) ${JSON.stringify(c)}`)
    note('RTL', `frase al borde de inicio (Δ ${r2(a.s.r - a.c.r)}); barra de «Nueva» a la derecha; cesta a la izquierda`)
    await ctx.close()
  })

  /* ---------- forced-colors emulado ---------- */
  await sect('forced', async () => {
    const { ctx, page } = await mk()
    await page.emulateMedia({ forcedColors: 'active' })
    await go(page)
    const fc = await page.evaluate(() => matchMedia('(forced-colors: active)').matches)
    if (!fc) { note('forced-colors', 'no emulable en este motor'); await ctx.close() } else {
      await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' })
      await into(page, 'cm-alg'); await page.focus('#cm-alg'); await page.keyboard.press('Backspace'); await frames(page, 2); await page.waitForTimeout(250)
      const s = await E(page, `const it = H.root('cm-alg').querySelector('.g-combobox__sentence-item.is-armed'), cs = getComputedStyle(it); return { line: cs.textDecorationLine, bg: H.same(cs.backgroundColor, H.sys('Highlight')), fg: H.same(cs.color, H.sys('HighlightText')) }`)
      ok(/line-through/.test(s.line) && s.bg && s.fg, `forced A: marcada por Retroceso ${JSON.stringify(s)}`)
      await page.keyboard.press('Escape'); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300)
      const o = await E(page, `const l = document.getElementById('cm-alg-list'), sel = l.querySelector('[role=option][aria-selected=true]:not(.is-active) .g-combobox__box'), un = l.querySelector('[role=option][aria-selected=false]:not(.is-active):not(.g-combobox__action) .g-combobox__box')
        return { un: H.same(getComputedStyle(un).borderTopColor, H.sys('CanvasText')), sel: H.same(getComputedStyle(sel).backgroundColor, H.sys('Highlight')), mark: H.same(getComputedStyle(sel.querySelector('svg')).color, H.sys('HighlightText')) }`)
      ok(o.un && o.sel && o.mark, `forced: casilla ${JSON.stringify(o)}`)
      await shut(page)
      await openA(page, 'cm-dx', 300)
      await clickOpt(page, '#cm-dx-list [role=option][aria-selected=false]:not(.g-combobox__action)'); await page.waitForTimeout(150)
      await page.keyboard.press('Escape'); await page.waitForTimeout(300)
      const f = await E(page, `const r = H.root('cm-dx'), row = r.querySelector('.g-combobox__row.is-fresh'), t = row.querySelector('.g-combobox__row-fresh'); return { border: H.same(getComputedStyle(t).borderTopColor, H.sys('CanvasText')), bar: H.same(getComputedStyle(row, '::before').backgroundColor, H.sys('CanvasText')) }`)
      ok(f.border && f.bar, `forced B: «Nueva» ${JSON.stringify(f)}`)
      await clickEl(page, '#sec-combobox-multiple .g-combobox:has(#cm-dx) .g-combobox__row.is-fresh .g-combobox__remove'); await page.waitForTimeout(250)
      const t = await E(page, `const t = H.root('cm-dx').querySelector('.g-combobox__trace'), cs = getComputedStyle(t); return { line: cs.textDecorationLine, fg: H.same(cs.color, H.sys('CanvasText')) }`)
      ok(/line-through/.test(t.line) && t.fg, `forced B: rastro ${JSON.stringify(t)}`)
      note('forced-colors (emulado)', 'casilla CanvasText / Highlight + HighlightText; Retroceso Highlight + tachado; «Nueva» con borde y barra CanvasText; rastro CanvasText tachado')
      await ctx.close()
    }
  })

  /* ---------- Texto al 200 % (raíz a 32px: los tamaños del tema son rem) ---------- */
  await sect('zoom', async () => {
    const { ctx, page } = await mk()
    await go(page, { cm: 'A', css: 'html { font-size: 200% !important; }' })
    const fs = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('cm-alg')).fontSize))
    ok(fs >= 26, `200 %: el texto del campo no creció (${fs}px)`)
    await page.evaluate(() => { window.__cm.tagOptions = window.PlaygroundCombobox.big })
    await into(page, 'cm-f-tags')
    const z = []
    for (const n of [0, 3, 8, 40]) {
      await page.evaluate((n) => { window.__cm.tags = window.PlaygroundCombobox.big.slice(0, n).map((o) => o.value) }, n)
      await frames(page, 3); await page.waitForTimeout(80)
      z.push(await E(page, `const r = H.root('cm-f-tags'), i = document.getElementById('cm-f-tags'), s = r.querySelector('.g-combobox__sentence'); return { ctl: H.rect(H.ctl('cm-f-tags')), notas: H.rect(H.ctl('cm-f-notas')), s: H.rect(s), i: H.rect(i), over: s ? s.scrollWidth - s.clientWidth : 0, n: s ? s.querySelectorAll('.g-combobox__sentence-item').length : 0, page: document.documentElement.scrollWidth - innerWidth }`))
    }
    const dz = Math.max(...z.map((g) => Math.max(Math.abs(g.ctl.h - z[0].ctl.h), Math.abs(g.notas.t - z[0].notas.t))))
    ok(dz < 0.5, `200 %: Δ ${r2(dz)}px de 0 a 40`)
    ok(z.slice(1).every((g) => g.s.h <= g.i.h + 0.5 && (g.over <= 1 || g.n === 1)), `200 %: la frase en más de una línea o desbordada ${JSON.stringify(z.map((g) => [g.s && r2(g.s.h), r2(g.i.h), g.over]))}`)
    ok(z.every((g) => g.page <= 0), '200 %: desplazamiento horizontal de la página')
    await go(page, { cm: 'B', css: 'html { font-size: 200% !important; }' })
    await into(page, 'cm-big-b')
    const b = await E(page, `const r = H.root('cm-big-b'); return [...r.querySelectorAll('.g-combobox__row')].map((x) => ({ over: x.scrollWidth - x.clientWidth, q: H.rect(x.querySelector('.g-combobox__remove')), row: H.rect(x) }))`)
    ok(b.every((x) => x.over <= 1 && x.q.r <= x.row.r + 0.5 && x.q.w >= 23.5), `200 %: renglones desbordados o «Quitar» fuera ${JSON.stringify(b.slice(0, 2))}`)
    await go(page, { cm: 'C', css: 'html { font-size: 200% !important; }' })
    await openC(page, 'cm-resp')
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await page.waitForTimeout(300)
    const c = await E(page, `const s = document.getElementById('cm-resp-surface'), p = s.querySelector('.g-combobox__surface-body > .g-combobox__panel'), k = s.querySelector('.g-combobox__basket'), d = H.rect(s)
      return { d, vw: innerWidth, over: s.scrollWidth - s.clientWidth, p: H.rect(p), k: H.rect(k), rowsOver: k ? [...k.querySelectorAll('.g-combobox__row')].map((x) => x.scrollWidth - x.clientWidth) : [] }`)
    ok(c.d.r <= c.vw + 0.5 && c.over <= 1 && (!c.k || c.k.l >= c.p.r - 0.5) && c.rowsOver.every((x) => x <= 1), `200 %: la paleta con cesta desborda o se solapa ${JSON.stringify(c)}`)
    note('Texto al 200 %', `campo ${fs}px; A Δ ${r2(dz)}px de 0 a 40, una línea; B sin desborde; C sin solape ni desborde`)
    await ctx.close()
  })

  /* ---------- GTooltip envolviendo el campo (banco) ---------- */
  await sect('tooltip', async () => {
    const { ctx, page } = await mk()
    await bank(page, { motion: 'reduce' })
    const tipOpen = (id) => page.evaluate((id) => { const i = document.getElementById(id); const t = [...document.querySelectorAll('.g-tooltip')].find((x) => (i.getAttribute('aria-describedby') || '').includes(x.id + '-name') || (i.getAttribute('aria-describedby') || '').includes(x.id)); return t ? t.matches(':popover-open') : null }, id)
    for (const [id, c] of [['ab-tip-a', 'A'], ['ab-tip-b', 'B'], ['ab-tip-c', 'C']]) {
      const d = await page.evaluate((id) => document.getElementById(id).getAttribute('aria-describedby') || '', id)
      ok(d.split(' ')[0] === id + '-about' && /g-tooltip|-name/.test(d), `tooltip ${c}: aria-describedby «${d}» (about primero y el tooltip añadido)`)
      // Llegar con el teclado (foco por navegación): abre
      await page.focus(c === 'A' ? '#ab-before' : c === 'B' ? '#ab-tip-a' : '#ab-tip-b')
      const trail = []
      for (let k = 0; k < 5; k++) {
        await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab'); await page.waitForTimeout(150)
        const f = await page.evaluate(() => { const a = document.activeElement; return a.id || a.className || a.tagName })
        trail.push(f); if (f === id) break
      }
      const at = await page.evaluate(() => document.activeElement.id)
      if (at !== id) note('GTooltip', `${c}: recorrido con Tab ${trail.join(' → ')}`)
      const o1 = await tipOpen(id)
      ok(at === id && o1 === true, `tooltip ${c}: no abre al llegar con el teclado (foco ${at}, abierto ${o1})`)
      // Abrir la lista o la paleta: el tooltip se cierra y no tapa el panel
      await page.keyboard.press('ArrowDown'); await page.waitForTimeout(400)
      const o2 = await tipOpen(id)
      ok(o2 === false, `tooltip ${c}: sigue abierto con la lista o la paleta abiertas`)
      if (c === 'C') {
        await page.keyboard.press('Enter'); await page.waitForTimeout(200)
        await clickEl(page, '#ab-tip-c-surface .g-combobox__done'); await page.waitForTimeout(450)
        const o3 = await tipOpen(id)
        const f3 = await page.evaluate(() => document.activeElement.id)
        ok(f3 === id && o3 === false, `tooltip C: tras «Listo» el foco vuelve (${f3}) y el tooltip no se enciende (${o3})`)
      } else {
        await page.keyboard.press('Enter'); await page.waitForTimeout(150)
        await page.keyboard.press('Escape'); await page.waitForTimeout(200)
        const o3 = await tipOpen(id)
        note('GTooltip', `${c}: cerrar la lista con Esc → tooltip ${o3 ? 'abierto' : 'cerrado'}`)
        await page.evaluate(() => document.activeElement.blur())
      }
      const d2 = await page.evaluate((id) => document.getElementById(id).getAttribute('aria-describedby') || '', id)
      ok(d2.startsWith(id + '-about') && /g-tooltip|-name/.test(d2), `tooltip ${c}: tras elegir, aria-describedby «${d2}»`)
    }
    note('GTooltip', 'aria-describedby = about + tooltip en A, B y C; abre al llegar con el teclado; se cierra al abrir la lista o la paleta; el foco devuelto por «Listo» no lo enciende')
    await ctx.close()
  })

  /* ---------- Fase 1 intacta: estilo calculado con y sin la sección de la Fase 2 ---------- */
  await sect('phase1', async () => {
    const { ctx, page } = await mk()
    await go(page)
    const src = await readFile(join(ROOT, 'packages/vue/src/components/GCombobox/GCombobox.css'), 'utf8')
    const a = src.lastIndexOf('/*', src.indexOf('FASE 2 · VARIAS (multiple')), b = src.indexOf('/* ---------- Preferencias del sistema')
    const no2 = src.slice(0, a) + src.slice(b)
    await page.evaluate(() => {
      // Retira de dist/grana.css las reglas de GCombobox (las mismas en las dos variantes) y deja sitio a la fuente
      const sheet = [...document.styleSheets].find((s) => /dist\/grana\.css/.test(s.href || ''))
      const walk = (list) => { for (let i = list.cssRules.length - 1; i >= 0; i--) { const r = list.cssRules[i]; if (r.cssRules && !(r instanceof CSSStyleRule) && !(r instanceof CSSKeyframesRule)) { walk(r); continue } if ((r.selectorText && /g-combobox/.test(r.selectorText)) || (r instanceof CSSKeyframesRule && /^g-combobox/.test(r.name))) list.deleteRule(i) } }
      window.__snapAll = () => {
        const out = []
        const roots = [...document.querySelectorAll('#sec-combobox .g-combobox')]
        for (const r of roots) for (const el of [r, ...r.querySelectorAll('*')]) for (const pe of [null, '::before', '::after']) {
          const cs = getComputedStyle(el, pe); const v = []
          for (let k = 0; k < cs.length; k++) { const p = cs[k]; if (/^transition|^animation/.test(p)) continue; v.push(p + ':' + cs.getPropertyValue(p)) }
          out.push(v.join(';'))
        }
        return out
      }
      window.__swap = (css) => { if (!window.__strip) { walk(sheet); window.__strip = true } let st = document.getElementById('__src'); if (!st) { st = document.createElement('style'); st.id = '__src'; document.head.append(st) } st.textContent = '@layer grana.components {\n' + css + '\n}' }
    })
    const states = [['reposo', async () => {}], ['A abierta', async () => { await into(page, 'cb-pac'); await page.click('#cb-pac'); await page.keyboard.type('mar', { delay: 20 }); await page.waitForTimeout(500) }], ['paleta abierta', async () => { await shut(page); await into(page, 'cb-pal'); await page.click('#cb-pal'); await page.waitForTimeout(400); await page.keyboard.type('mar', { delay: 20 }); await page.waitForTimeout(500) }]]
    let n = 0
    for (const [name, enter] of states) {
      await enter()
      const dist = await page.evaluate(() => window.__snapAll())
      await page.evaluate((css) => window.__swap(css), src); await page.waitForTimeout(500)
      const full = await page.evaluate(() => window.__snapAll())
      await page.evaluate((css) => window.__swap(css), no2); await page.waitForTimeout(500)
      const without = await page.evaluate(() => window.__snapAll())
      await page.evaluate((css) => window.__swap(css), src); await page.waitForTimeout(300)
      const diffs = (x, y) => { const d = []; for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) { const a = x[i].split(';'), b = y[i].split(';'); d.push(a.filter((p, j) => p !== b[j]).slice(0, 2).join(' | ')) } return { n: d.length + Math.abs(x.length - y.length), ex: d.slice(0, 3) } }
      const fw = diffs(full, without), df = diffs(dist, full)
      n += full.length
      ok(fw.n === 0, `Fase 1 (${name}): ${fw.n} diferencias con y sin la sección de la Fase 2: ${fw.ex}`)
      note('Fase 1 intacta', `${name}: ${full.length} cajas (elementos y ::before/::after), con y sin la Fase 2: ${fw.n} diferencias; dist frente a la fuente: ${df.n}${df.n ? ' (' + df.ex[0] + ')' : ''}`)
    }
    await ctx.close()
  })

  ok(!errors.length, `consola: ${[...new Set(errors)].slice(0, 3).join(' | ')}`)
  await browser.close()
}

server.close()
if (args.verbose || true) for (const [k, v] of Object.entries(measures)) { console.log(`\n· ${k}`); for (const x of v) console.log('    ' + x) }
console.log('\nPor motor: ' + Object.entries(perEngine).map(([k, v]) => `${k} ${v.total - v.failed}/${v.total}`).join(' · '))
if (fails.length) { console.log('\nFALLOS:'); for (const f of fails) console.log('  ✗ ' + f) }
console.log(`\n${total - failed}/${total} comprobaciones`)
process.exit(failed ? 1 : 0)
