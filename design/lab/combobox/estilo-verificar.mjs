// Verificación de coco sobre el banco de GCombobox (design/lab/combobox/estilo-banco.html), con el CSS real cargado en la
// capa grana.components y los vecinos reales de dist/ (GInput con slots field/end, GAvatar, GDialog, GForm, GFormRow,
// GSelect). Mide: análisis estático del CSS (sin literales, sin respaldos, sin @layer, keyframes g-combobox-arrive… y
// g-combobox-spin, nunca g-reject…, movimiento solo con no-preference, hover en (hover: hover), muelle solo en @supports);
// A · una sola forma (Δ izquierda, arriba y ancho < 1px, costura < 1.5px, también hacia arriba; anillo y sombra en el
// popover, caja sin contorno ni anillo; columna del anillo continua en píxeles; el punto central del campo es el
// <input>; abrir no mueve nada); texto fantasma alineado ±0,5px con el texto del <input> (píxeles, DPR 2);
// C · Δ0 de alto con ficha en los cinco tamaños frente a GInput, ficha centrada y con su texto donde el del <input>,
// el dato secundario se recorta primero (barrido de anchos), llegada con ≥ 2 posiciones intermedias, termina en 0, se
// retira la clase y el rebase ≤ space × 2 (también con un vector de 600px, acotado); despliegue de A con alturas
// intermedias solo al abrir; B · paleta (modal, 6:5, alto fijo, cuerpo sin desplazamiento, panel con desplazamiento)
// a 1280 y hoja arriba a 375 y 320 (ancho completo, sin vista previa, filas ≥ 44px, sin desborde); contraste (texto,
// secundario, código, coincidencia, activa, ficha, ficha seleccionada, marca «Texto libre», fantasma, error, activa
// invertida, vista previa) en claro, oscuro, Tema de prueba y los once temas generados (claro y oscuro); forced-colors
// (L23); reduced motion; RTL; fila de tres en GFormRow (--g-form-min: 60, A funcional a ≥ 239px, sobrescribible);
// consola limpia.
// Ejecutar desde la raíz del repo (requiere `npm run build`): GRANA_PW_PORT=4209 node design/lab/combobox/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit (por defecto los tres)   --verbose
import http from 'node:http'
import zlib from 'node:zlib'
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
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/combobox/estilo-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = [], notes = [], measures = {}
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const note = (k, v) => { (measures[k] ??= []).push(v) }

// ---------- PNG mínimo (RGB/RGBA de 8 bits sin entrelazar, lo que devuelve Playwright) ----------
function png(buf) {
  let o = 8, w = 0, h = 0, ct = 0; const idat = []
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8), d = buf.subarray(o + 8, o + 8 + len)
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9] }
    if (type === 'IDAT') idat.push(d)
    o += 12 + len
  }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, out = Buffer.alloc(w * h * 4)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)))
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? line[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
      line[x] = (line[x] + [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f]) & 255
    }
    for (let x = 0; x < w; x++) for (let k = 0; k < 4; k++) out[(y * w + x) * 4 + k] = k < 3 ? line[x * bpp + k] : (bpp === 4 ? line[x * bpp + 3] : 255)
    prev = line
  }
  return { w, h, px: (x, y) => [...out.subarray((y * w + x) * 4, (y * w + x) * 4 + 4)] }
}
// Caja de tinta: píxeles que se separan del fondo (esquina superior izquierda) más de `t`
function ink(img, t = 60) {
  const freq = new Map()
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) { const k = img.px(x, y).slice(0, 3).join(','); freq.set(k, (freq.get(k) || 0) + 1) }
  const bg = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number)
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const p = img.px(x, y); if (Math.abs(p[0] - bg[0]) + Math.abs(p[1] - bg[1]) + Math.abs(p[2] - bg[2]) > t) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
  }
  return { x0, y0, x1, y1 }
}

/* ---------- 0 · Análisis estático del CSS ---------- */
{
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GCombobox/GCombobox.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(css), 'CSS: color literal')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer/.test(css), 'CSS: @layer en el archivo')
  ok(!/@property/.test(css), 'CSS: @property')
  ok(!/!important/.test(css), 'CSS: !important')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  const declaredG = [...css.matchAll(/(--g-[\w-]+)\s*:/g)].map((m) => m[1])
  ok(declaredG.length === 1 && declaredG[0] === '--g-form-min', 'CSS: declara propiedades --g-* distintas de --g-form-min: ' + declaredG)
  ok(/\.g-form-row > \.g-combobox--appearance-field \{\s*--g-form-min: 60;/.test(css), 'CSS: --g-form-min: 60 sobre .g-form-row > .g-combobox--appearance-field')
  // Alias: propios --_cb-*, heredados de GInput/GDialog o escritos en línea por bruno (tokens.md §29.5)
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  ok([...own].every((v) => v.startsWith('--_cb-')), 'CSS: alias propio sin prefijo --_cb-: ' + [...own])
  const allowed = ['--_focus', '--_radius', '--_fs', '--_lh', '--_gap', '--_density', '--_inset-radius', '--_x', '--_top', '--_bottom', '--_w', '--_max', '--_field-h', '--_travel-x', '--_travel-y']
  const strange = [...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v) && !allowed.includes(v)))]
  ok(!strange.length, 'CSS: alias --_* no previsto: ' + strange)
  const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  ok(px.every((p) => ['24px', '44px', '1px', '-1px', '0px'].includes(p)), 'CSS: medidas literales no permitidas ' + px.filter((p) => !['24px', '44px', '1px', '-1px', '0px'].includes(p)))
  const onePx = css.split('\n').filter((l) => /\b-?1px\b/.test(l)).map((l) => l.trim())
  ok(onePx.every((l) => /^(inline-size|block-size|margin): -?1px;$/.test(l)), 'CSS: 1px fuera del texto oculto: ' + onePx)
  const zero = css.split('\n').filter((l) => /\b0px\b/.test(l)).map((l) => l.trim())
  ok(zero.every((l) => /max\(0px, calc\(var\(--_cb-r\) - var\(--g-border-width\)\)\)/.test(l)), 'CSS: 0px fuera del radio interior: ' + zero)
  const nums = [...css.matchAll(/[*/]\s*(-?\d*\.?\d+)\b(?!px|ms|%|fr|turn)/g)].map((m) => m[1])
  ok(nums.every((n) => ['-1', '2', '-2', '9', '8', '14', '12', '96', '0.038', '2.5'].includes(n)), 'CSS: factores no previstos: ' + nums)
  const kf = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
  ok(kf.length === 2 && kf.includes('g-combobox-arrive') && kf.includes('g-combobox-spin'), 'CSS: keyframes ' + kf)
  ok(!/g-reject/.test(css) && !/is-rejected/.test(css), 'CSS: nombra g-reject… o is-rejected (la sacudida es de GInput)')
  ok((css.match(/var\(--g-ease-spring\)/g) || []).length === 1 && /@supports \(transition-timing-function: linear\(0, 1\)\) \{\s*\.g-combobox__token\.is-arriving \{\s*animation-timing-function: var\(--g-ease-spring\);/.test(css), 'CSS: el muelle solo en la llegada y dentro de @supports')
  ok(!/--g-ease-bounce/.test(css), 'CSS: --g-ease-bounce no es de este componente')
  // Nada de transition: all, ni transiciones de colocación (max-block-size, inset, top, bottom, left, padding, inline-size)
  const trs = [...css.matchAll(/transition(?:-property)?\s*:([^;]+);/g)].map((m) => m[1])
  ok(!trs.some((t) => /\ball\b|max-block-size|inset|\btop\b|\bbottom\b|\bleft\b|padding|inline-size|block-size/.test(t)), 'CSS: transición de colocación o all: ' + trs.filter((t) => /all|size|inset|top|bottom|left|padding/.test(t)))
  // La fila de opción no lleva transición (una sola superficie resaltada por cuadro)
  ok(!/\.g-combobox__option \{[^}]*transition/.test(css), 'CSS: la fila de opción lleva transición')
  // Contexto de cada declaración: animation solo en no-preference (o el giro), transiciones de movimiento en no-preference, hover en (hover: hover)
  let ctx = [], pending = ''
  const anim = [], hov = [], moveTr = []
  for (const t of css.split(/([{}])/)) {
    if (t === '{') { ctx.push(pending.trim()); pending = '' }
    else if (t === '}') { ctx.pop(); pending = '' }
    else {
      pending = t
      const decls = t.split(';').map((d) => d.trim()).filter((d) => /^[\w-]+\s*:/.test(d))
      for (const d of decls) {
        const c = ctx.join(' » ')
        if (/^animation\s*:/.test(d)) anim.push([c, d])
        if (/^transition\s*:/.test(d) && /(rotate|translate|grid-template-rows|scale)/.test(d)) moveTr.push([c, d])
      }
      if (ctx.some((c) => /:hover/.test(c))) hov.push(ctx.join(' » '))
    }
  }
  ok(anim.every(([c, d]) => /prefers-reduced-motion: no-preference/.test(c) || /g-combobox-spin/.test(d)), 'CSS: animation fuera de no-preference: ' + anim.filter(([c, d]) => !/no-preference/.test(c) && !/spin/.test(d)).map((x) => x.join(' ')))
  ok(moveTr.every(([c]) => /prefers-reduced-motion: no-preference/.test(c)), 'CSS: transición de movimiento fuera de no-preference: ' + moveTr.map((x) => x[0]))
  ok(hov.every((c) => /\(hover: hover\)/.test(c)), 'CSS: :hover fuera de (hover: hover): ' + hov)
}

/* ---------- Funciones de página ---------- */
const lib = () => {
  const parse = (s) => {
    let m = s.match(/rgba?\(([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
    m = s.match(/color\(srgb ([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
    return [0, 0, 0, 0]
  }
  const over = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1] }
  const bgOf = (el) => {
    const layers = []
    for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break } }
    let base = parse(getComputedStyle(document.documentElement).backgroundColor)
    if (base[3] < 1) base = parse(getComputedStyle(document.body).backgroundColor)
    if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const tok = (n, prop = 'color') => { const i = document.createElement('i'); i.style[prop] = `var(${n})`; document.body.append(i); const c = getComputedStyle(i)[prop]; i.remove(); return c }
  const px = (n) => { const i = document.createElement('i'); i.style.inlineSize = `var(${n})`; i.style.position = 'absolute'; document.body.append(i); const v = i.getBoundingClientRect().width; i.remove(); return v }
  const root = (c) => document.querySelector(`[data-case="${c}"]`).closest('.g-combobox')
  const fg = (el) => parse(getComputedStyle(el).color)
  const pair = (k, el, min, bgEl = el) => ({ k, r: ratio(over(fg(el), bgOf(bgEl)), bgOf(bgEl)), min })
  return { parse, over, bgOf, ratio, tok, px, root, fg, pair }
}
const L = `(${lib.toString()})()`

/* ---------- Navegador ---------- */
for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  const tag = (s) => `${engine} ${s}`
  const go = async (qs = '', p = page) => {
    await p.goto(BASE + qs)
    await p.waitForSelector('[data-ready]')
    await p.evaluate(() => document.fonts.ready)
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    if (/theme=|test=|dark=/.test(qs)) await p.waitForTimeout(300)
  }
  const settle = (p = page, ms = 450) => p.waitForTimeout(ms)
  const typeIn = async (c, text, p = page) => { await p.evaluate((c) => document.querySelector(`[data-case="${c}"]`).scrollIntoView({ block: 'center' }), c); await p.click(`[data-case="${c}"]`); await p.keyboard.type(text); await settle(p) }

  /* 1 · Contraste */
  const contrast = async () => {
    const out = []
    await typeIn('pac', 'mar')
    out.push(...await page.evaluate(`(() => { const { pair, root } = ${L}; const r = root('pac'); const pop = r.querySelector('.g-combobox__popup'); const rows = pop.querySelectorAll('.g-combobox__option'); const act = pop.querySelector('.g-combobox__option.is-active'); const idle = [...rows].find((x) => !x.classList.contains('is-active'))
      return [pair('opción: etiqueta', idle.querySelector('.g-combobox__label'), 4.5), pair('opción: coincidencia', idle.querySelector('.g-combobox__mark'), 4.5), pair('opción: rótulo de dato', idle.querySelector('.g-combobox__fact-label'), 4.5), pair('opción: dato', idle.querySelector('.g-combobox__fact'), 4.5),
        pair('activa: etiqueta', act.querySelector('.g-combobox__label'), 4.5), pair('activa: rótulo', act.querySelector('.g-combobox__fact-label'), 4.5),
        { ...pair('activa: borde de ficha', act, 3), r: (() => { const { parse, ratio, bgOf } = ${L}; return ratio(parse(getComputedStyle(act).borderTopColor), bgOf(act.parentElement)) })() },
        pair('fantasma: resto', r.querySelector('.g-combobox__ghost-rest'), 4.5)] })()`))
    await page.keyboard.press('Escape'); await page.evaluate(() => document.activeElement.blur())
    await page.evaluate(() => { document.querySelector('[data-case="st-groups"]').scrollIntoView({ block: 'center' }); __cb.open('st-groups') }); await settle(page, 250)
    out.push(...await page.evaluate(`(() => { const { pair, root } = ${L}; const pop = root('st-groups').querySelector('.g-combobox__popup'); const code = [...pop.querySelectorAll('.g-combobox__option:not([aria-disabled]) .g-combobox__code')][1]
      return [pair('código', code, 4.5), pair('encabezado de grupo', pop.querySelector('.g-combobox__group-label'), 4.5)] })()`))
    await page.evaluate(() => { document.querySelector('[data-case="st-error"]').scrollIntoView({ block: 'center' }); __cb.open('st-error') }); await settle(page, 250)
    out.push(...await page.evaluate(`(() => { const { pair, root } = ${L}; const pop = root('st-error').querySelector('.g-combobox__popup'); return [pair('error de carga', pop.querySelector('.g-combobox__status--error'), 4.5), pair('fila de acción', pop.querySelector('.g-combobox__action .g-combobox__label'), 4.5)] })()`))
    await page.evaluate(() => { document.querySelector('[data-case="st-empty"]').scrollIntoView({ block: 'center' }); __cb.open('st-empty') }); await settle(page, 250)
    out.push(...await page.evaluate(`(() => { const { pair, root } = ${L}; const pop = root('st-empty').querySelector('.g-combobox__popup'); return [pair('sin resultados', pop.querySelector('.g-combobox__status--empty'), 4.5)] })()`))
    await page.evaluate(() => { for (const v of __cb.items.values()) v.hide() })
    out.push(...await page.evaluate(`(() => { const { pair, root } = ${L}; const t = (c, s) => root(c).querySelector(s)
      return [pair('ficha: etiqueta', t('tok-md', '.g-combobox__token-label'), 4.5), pair('ficha: dato secundario', t('tok-md', '.g-combobox__token-meta'), 4.5), pair('ficha: código', t('tok-dx', '.g-combobox__code'), 4.5),
        pair('ficha: texto libre', t('tok-free', '.g-combobox__token-label'), 4.5), pair('marca «Texto libre»', t('tok-free', '.g-combobox__token-meta'), 4.5), pair('ficha solo lectura', t('tok-ro', '.g-combobox__token-meta'), 4.5)] })()`))
    await page.evaluate(() => document.querySelector('[data-case="tok-md"]').scrollIntoView({ block: 'center' }))
    await page.focus('[data-case="tok-md"]'); await settle(page, 200)
    out.push(...await page.evaluate(`(() => { const { pair, root } = ${L}; const t = (s) => root('tok-md').querySelector(s); return [pair('ficha seleccionada: etiqueta', t('.g-combobox__token-label'), 4.5), pair('ficha seleccionada: dato', t('.g-combobox__token-meta'), 4.5)] })()`))
    await page.evaluate(() => document.activeElement.blur())
    await typeIn('pal', 'mar'); await page.keyboard.press('ArrowDown'); await settle(page, 300)
    out.push(...await page.evaluate(`(() => { const { pair } = ${L}; const d = document.querySelector('dialog[open].g-combobox-surface'); const act = d.querySelector('.g-combobox__option.is-active')
      return [pair('paleta activa: etiqueta', act.querySelector('.g-combobox__label'), 4.5), pair('paleta activa: rótulo', act.querySelector('.g-combobox__fact-label'), 4.5), pair('paleta activa: dato', act.querySelector('.g-combobox__fact'), 4.5),
        pair('paleta: búsqueda', d.querySelector('.g-combobox__search-field'), 4.5), pair('paleta: título', d.querySelector('.g-dialog__title'), 4.5),
        pair('vista previa: título', d.querySelector('.g-combobox__preview-title'), 4.5), pair('vista previa: dt', d.querySelector('.g-combobox__preview-facts dt'), 4.5), pair('vista previa: dd', d.querySelector('.g-combobox__preview-facts dd'), 4.5)] })()`))
    await page.keyboard.press('Escape'); await settle(page, 300)
    return out
  }
  const worst = {}
  const THEMES = engine === 'chromium' ? [['defecto', ''], ['defecto', 'dark=1'], ['prueba', 'test=1'], ...GEN.flatMap((t) => [[t, `theme=${t}`], [t, `theme=${t}&dark=1`]])] : [['defecto', ''], ['defecto', 'dark=1'], ['spotify', 'theme=spotify&dark=1']]
  for (const [name, qs] of THEMES) {
    await go('?' + qs)
    let m
    try { m = await contrast() } catch (e) { ok(false, tag(`${name} ${qs}: contraste no medible (${e.message.split('\n')[0]})`)); continue }
    const t = `${name} ${qs.includes('dark') ? 'oscuro' : 'claro'}`
    for (const c of m) ok(c.r >= c.min, tag(`${t}: ${c.k} ${c.r}:1 < ${c.min}`))
    for (const c of m) worst[c.k] = Math.min(worst[c.k] ?? 99, c.r)
  }
  note('contraste mínimo ' + engine, Object.entries(worst).map(([k, v]) => `${k} ${v}`).join(' · '))

  /* 2 · A · una sola forma (por defecto, oscuro, Tema de prueba) */
  const shape = (c) => page.evaluate(`(() => { const { parse, tok, px, root } = ${L}; const r = root('${c}'); const ctl = r.querySelector('.g-input__control').getBoundingClientRect(); const pop = r.querySelector('.g-combobox__popup'); const P = pop.getBoundingClientRect(); const B = r.querySelector('.g-combobox__popup-body').getBoundingClientRect()
    const cs = getComputedStyle(pop), row = getComputedStyle(r.querySelector('.g-input__row')), cc = getComputedStyle(r.querySelector('.g-input__control')); const inp = r.querySelector('.g-combobox__field')
    const hit = document.elementFromPoint(ctl.left + ctl.width / 2, ctl.top + ctl.height / 2)
    const t = document.createElement('i'); t.style.color = 'var(--g-color-focus)'; r.querySelector('.g-input__control').append(t); const focus = getComputedStyle(t).color; t.remove()
    return { ctl: { l: ctl.left, t: ctl.top, w: ctl.width, b: ctl.bottom }, P: { l: P.left, t: P.top, w: P.width, b: P.bottom }, B: { t: B.top, b: B.bottom }, up: r.classList.contains('is-up'),
      outline: cs.outlineStyle, ow: parseFloat(cs.outlineWidth), oc: cs.outlineColor, focus, fw: px('--g-focus-width'), bw: px('--g-border-width'), shadow: cs.boxShadow, rowA: parse(row.outlineColor)[3], ctlBorderA: parse(cc.borderTopColor)[3], ctlShadow: cc.boxShadow,
      hit: hit === inp, open: r.classList.contains('is-open') } })()`)
  for (const qs of ['', 'dark=1', 'test=1']) {
    await go('?' + qs)
    const before = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, y: scrollY }))
    await typeIn('pac', 'mar')
    const pre = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, y: scrollY, t: document.querySelector('[data-case="pac"]').closest('.g-input__control').getBoundingClientRect().top }))
    const s = await shape('pac')
    const t = (x) => tag(`?${qs} A: ${x}`)
    ok(s.open, t('is-open'))
    ok(Math.abs(s.P.l - s.ctl.l) < 1 && Math.abs(s.P.t - s.ctl.t) < 1 && Math.abs(s.P.w - s.ctl.w) < 1, t(`Δ caja–forma ≥ 1px (${(s.P.l - s.ctl.l).toFixed(2)}, ${(s.P.t - s.ctl.t).toFixed(2)}, ${(s.P.w - s.ctl.w).toFixed(2)})`))
    const seam = s.B.t - (s.ctl.b - s.bw)
    ok(Math.abs(seam) < 1.5, t(`costura ${seam.toFixed(2)}px`))
    note('A costura (px, la línea cae sobre el borde inferior de la caja)', `${engine} ?${qs} ${seam.toFixed(2)}`)
    ok(s.outline === 'solid' && Math.abs(s.ow - s.fw) < 0.1 && s.oc === s.focus, t(`anillo de la forma ${s.outline} ${s.ow} ${s.oc} ≠ foco ${s.focus}`))
    ok(s.rowA === 0 && s.ctlBorderA === 0, t('la caja conserva anillo o contorno con la forma abierta'))
    ok(s.shadow !== 'none' && s.ctlShadow === 'none', t('sombra: no es de la forma o la caja tiene la suya'))
    ok(s.hit, t('el punto central del campo no es el <input>'))
    // Columna del anillo en píxeles: del campo a la lista, sin corte (a 1px fuera del borde izquierdo)
    const clip = { x: Math.floor(s.ctl.l + s.bw - s.fw / 2 - 0.5), y: Math.ceil(s.P.t + 12), width: 1, height: Math.floor(s.P.b - s.P.t - 24) }
    const img = png(await page.screenshot({ clip }))
    const fc = (await page.evaluate(`(${lib.toString()})().parse('${s.focus}')`))
    let breaks = 0
    for (let y = 0; y < img.h; y++) { const p = img.px(0, y); if (Math.abs(p[0] - fc[0]) + Math.abs(p[1] - fc[1]) + Math.abs(p[2] - fc[2]) > 90) breaks++ }
    ok(breaks === 0, t(`el anillo se corta en ${breaks} de ${img.h} píxeles de su columna`))
    const post = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, y: scrollY, t: document.querySelector('[data-case="pac"]').closest('.g-input__control').getBoundingClientRect().top }))
    ok(Math.abs(post.h - pre.h) < 1 && Math.abs(post.t - pre.t) < 0.5 && before.h === pre.h, t(`abrir mueve algo (alto ${pre.h}→${post.h}, campo ${pre.t}→${post.t})`))
    await page.keyboard.press('Escape'); await page.evaluate(() => document.activeElement.blur())
    // Hacia arriba
    await page.evaluate(() => document.querySelector('[data-case="up"]').scrollIntoView({ block: 'end' }))
    await page.click('[data-case="up"]'); await page.keyboard.type('ma'); await settle()
    const u = await shape('up')
    ok(u.up, t('al pie no abre hacia arriba'))
    ok(Math.abs(u.P.l - u.ctl.l) < 1 && Math.abs(u.P.b - u.ctl.b) < 1 && Math.abs(u.P.w - u.ctl.w) < 1, t(`hacia arriba: Δ caja–forma ≥ 1px (${(u.P.b - u.ctl.b).toFixed(2)})`))
    const seamUp = (u.ctl.t + u.bw) - u.B.b
    ok(Math.abs(seamUp) < 1.5, t(`hacia arriba: costura ${seamUp.toFixed(2)}px`))
    ok(u.outline === 'solid' && u.hit, t('hacia arriba: anillo o punto central'))
    await page.keyboard.press('Escape'); await page.evaluate(() => document.activeElement.blur())
  }

  /* 3 · Texto fantasma alineado al píxel (DPR 2), LTR y RTL */
  for (const dir of ['', 'dir=rtl']) {
    const c2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 })
    const p2 = await c2.newPage()
    await go('?' + dir, p2)
    await typeIn('pac', 'mar', p2)
    const g = await p2.evaluate(`(() => { const { root } = ${L}; const r = root('pac'); const cell = r.querySelector('.g-combobox__value').getBoundingClientRect(); const inp = r.querySelector('.g-combobox__field').getBoundingClientRect(); const ty = r.querySelector('.g-combobox__ghost-typed').getBoundingClientRect(); const gs = getComputedStyle(r.querySelector('.g-combobox__ghost')), is = getComputedStyle(r.querySelector('.g-combobox__field'))
      return { cell: { x: cell.left, y: cell.top, w: cell.width, h: cell.height }, inp: { l: inp.left, r: inp.right }, ty: { l: ty.left, r: ty.right }, font: [gs.fontFamily === is.fontFamily, gs.fontSize === is.fontSize, gs.fontWeight === is.fontWeight, gs.letterSpacing === is.letterSpacing], rtl: gs.direction === 'rtl', pe: gs.pointerEvents, hidden: r.querySelector('.g-combobox__ghost').getAttribute('aria-hidden') } })()`)
    const t = (x) => tag(`fantasma ${dir || 'ltr'}: ${x}`)
    ok(g.font.every(Boolean), t('tipografía distinta de la del <input> ' + g.font))
    ok(g.pe === 'none' && g.hidden === 'true', t('captura el puntero o no es aria-hidden'))
    // Texto latino: con unicode-bidi: plaintext el <input> y el fantasma lo escriben de izquierda a derecha también en RTL
    ok(Math.abs(g.ty.l - g.inp.l) <= 0.5, t(`inicio de lo tecleado Δ ${(g.ty.l - g.inp.l).toFixed(2)}px`))
    const clip = { x: g.cell.x, y: g.cell.y + 3, width: g.cell.w, height: g.cell.h - 6 }
    // A: lo tecleado del fantasma (visible) sin el texto del <input>; B: el texto del <input> solo
    await p2.evaluate(() => { const s = document.createElement('style'); s.id = 'probe'; s.textContent = '.g-combobox__ghost-typed{visibility:visible!important;color:var(--g-color-text)!important}.g-combobox__ghost-rest{visibility:hidden!important}[data-case="pac"]{color:transparent!important;caret-color:transparent!important}'; document.head.append(s) })
    await p2.waitForTimeout(150)
    const a = ink(png(await p2.screenshot({ clip })))
    await p2.evaluate(() => { document.getElementById('probe').textContent = '.g-combobox__ghost{visibility:hidden!important}[data-case="pac"]{caret-color:transparent!important}' })
    await p2.waitForTimeout(150)
    const b = ink(png(await p2.screenshot({ clip })))
    const d = [a.x0 - b.x0, a.y0 - b.y0, a.x1 - b.x1, a.y1 - b.y1].map((v) => v / 2)
    ok(a.x1 > 0 && b.x1 > 0 && (a.x1 - a.x0) < clip.width * 2 * 0.6 && d.every((v) => Math.abs(v) <= 0.5), t(`tinta Δ (izq, arr, der, ab) ${d.join(', ')} px`))
    if (args.verbose) console.log(engine, dir, 'tinta', a, b)
    note('fantasma: Δ de tinta frente al <input> (px CSS)', `${engine} ${dir || 'ltr'} ${d.join(' ')}`)
    await c2.close()
  }

  /* 4 · C · Δ0 de alto, centrado, recorte del secundario */
  for (const qs of ['', 'test=1']) {
    await go('?' + qs)
    const h = await page.evaluate(`(() => { const { root } = ${L}; const out = {}
      for (const s of ['xs', 'sm', 'md', 'lg', 'xl']) { const r = root('tok-' + s); const ctl = r.querySelector('.g-input__control').getBoundingClientRect(); const gin = document.querySelector('[data-case="in-' + s + '"]').closest('.g-input__control').getBoundingClientRect(); const tk = r.querySelector('.g-combobox__token').getBoundingClientRect(); const lab = r.querySelector('.g-combobox__token-label').getBoundingClientRect(); const inp = r.querySelector('.g-combobox__field').getBoundingClientRect()
        out[s] = { dh: ctl.height - gin.height, dc: (tk.top + tk.height / 2) - (ctl.top + ctl.height / 2), inside: tk.top >= ctl.top && tk.bottom <= ctl.bottom, token: r.classList.contains('is-token'), transparent: getComputedStyle(r.querySelector('.g-combobox__field')).color } }
      const e = root('empty').querySelector('.g-input__control').getBoundingClientRect().height, m = root('tok-md').querySelector('.g-input__control').getBoundingClientRect().height
      return { out, dEmpty: m - e } })()`)
    for (const [s, v] of Object.entries(h.out)) {
      ok(v.token && Math.abs(v.dh) < 0.5, tag(`?${qs} C ${s}: Δ alto con ficha ${v.dh.toFixed(2)}px frente a GInput`))
      ok(Math.abs(v.dc) <= 0.5 && v.inside, tag(`?${qs} C ${s}: ficha descentrada ${v.dc.toFixed(2)}px o fuera de la caja`))
      ok(/rgba\(0, 0, 0, 0\)|transparent/.test(v.transparent), tag(`?${qs} C ${s}: el texto del <input> se ve bajo la ficha (${v.transparent})`))
    }
    ok(Math.abs(h.dEmpty) < 0.5, tag(`?${qs} C: Δ alto vacío/ficha ${h.dEmpty}`))
    note('C Δ0 (px, con ficha − GInput, por tamaño)', `${engine} ?${qs} ` + Object.entries(h.out).map(([s, v]) => `${s} ${v.dh.toFixed(2)}`).join(' · '))
  }
  await go()
  {
    // La etiqueta de la ficha empieza donde empieza el texto del <input> (ficha desplazada space-1 con relleno space-1)
    const al = await page.evaluate(`(() => { const { root } = ${L}; const r = root('tok-dx'); const inp = r.querySelector('.g-combobox__field').getBoundingClientRect(); const first = r.querySelector('.g-combobox__token').firstElementChild.getBoundingClientRect(); return first.left - inp.left })()`)
    ok(Math.abs(al) <= 0.5, tag(`C: la ficha no empieza donde el texto del <input> (Δ ${al.toFixed(2)})`))
    // Barrido de anchos: el dato secundario se recorta primero
    const sw = await page.evaluate(`(() => { const { root } = ${L}; const r = root('tok-narrow'); const host = r.parentElement; const lab = r.querySelector('.g-combobox__token-label'), meta = r.querySelector('.g-combobox__token-meta'); const res = []
      for (let w = 460; w >= 150; w -= 5) { host.style.inlineSize = w + 'px'; const lc = lab.scrollWidth > lab.clientWidth + 1, mc = meta.scrollWidth > meta.clientWidth + 1, mw = meta.getBoundingClientRect().width; res.push({ w, lc, mc, mw }) }
      host.style.inlineSize = '200px'; return res })()`)
    ok(sw.every((x) => !(x.lc && x.mw > 1)), tag('C: la etiqueta se recorta antes que el dato secundario en ' + sw.filter((x) => x.lc && x.mw > 1).map((x) => x.w)))
    ok(sw.some((x) => x.mc && !x.lc), tag('C: ningún ancho con el secundario recortado y la etiqueta entera'))
    const first = sw.find((x) => x.mc), labCut = sw.find((x) => x.lc)
    note('C recorte (ancho del campo en px)', `${engine} secundario desde ${first?.w}, etiqueta desde ${labCut?.w}`)
    // Con el foco, ficha seleccionada
    await page.evaluate(() => document.querySelector('[data-case="tok-md"]').scrollIntoView({ block: 'center' }))
    await page.focus('[data-case="tok-md"]'); await settle(page, 200)
    const sel = await page.evaluate(`(() => { const { root, tok } = ${L}; return [getComputedStyle(root('tok-md').querySelector('.g-combobox__token')).backgroundColor, tok('--g-color-selection', 'backgroundColor')] })()`)
    ok(sel[0] === sel[1], tag(`C: con el foco la ficha no se ve seleccionada (${sel})`))
    await page.evaluate(() => document.activeElement.blur())
  }

  /* 4b · Fichas de opción: como máximo dos líneas, nada desborda, el identificador siempre visible (campo de 240, 320 y 480px) */
  const fichas = (sel) => page.evaluate(`(() => { const { px } = ${L}; const host = document.querySelector('${sel}'); const lim = px('--g-text-body-line') + px('--g-text-body-sm-line') + 0.5; const bad = []; let maxH = 0, n = 0
    for (const o of host.querySelectorAll('.g-combobox__option:not(.g-combobox__action)')) { n++
      const R = o.getBoundingClientRect(), main = o.querySelector('.g-combobox__main'); maxH = Math.max(maxH, main.getBoundingClientRect().height)
      if (main.getBoundingClientRect().height > lim) bad.push('más de dos líneas ' + main.getBoundingClientRect().height)
      if (o.scrollWidth > o.clientWidth + 0.5 || main.scrollWidth > main.clientWidth + 0.5) bad.push('desborda ' + main.scrollWidth + '/' + main.clientWidth)
      for (const k of o.querySelectorAll('*')) { const r = k.getBoundingClientRect(); if (r.width && (r.right > R.right + 0.5 || r.left < R.left - 0.5)) { bad.push('hijo fuera ' + k.className); break } }
      const f = o.querySelector('.g-combobox__fact'), fs = o.querySelector('.g-combobox__facts')
      if (f) { const a = f.getBoundingClientRect(), b = fs.getBoundingClientRect(); if (!(a.top >= b.top - 0.5 && a.bottom <= b.bottom + 0.5 && a.width > 0) || f.scrollWidth > f.clientWidth + 0.5) bad.push('identificador oculto o recortado') }
      const fl = [...o.querySelectorAll('.g-combobox__fact')].filter((x) => { const a = x.getBoundingClientRect(), b = fs.getBoundingClientRect(); return a.top < b.bottom - 0.5 }).length
      o.dataset.visibleFacts = fl }
    return { n, maxH: +maxH.toFixed(1), lim, bad: [...new Set(bad)], facts: [...host.querySelectorAll('.g-combobox__option[data-visible-facts]')].map((o) => +o.dataset.visibleFacts).slice(0, 1)[0] } })()`)
  await go()
  for (const w of [240, 320, 480]) {
    await page.evaluate((w) => { const r = document.querySelector('[data-case="pac"]').closest('.g-combobox'); r.style.inlineSize = w + 'px' }, w)
    await typeIn('pac', 'mar')
    const f = await fichas('[data-case="pac"]')
    const g = await page.evaluate(`(() => { const r = document.querySelector('[data-case="pac"]').closest('.g-combobox'); return r.querySelector('.g-combobox__popup') ? 'popup' : '' })()`)
    const fr = await page.evaluate((s) => document.querySelector(s).closest('.g-combobox').querySelector('.g-combobox__popup').id, '[data-case="pac"]')
    const res = await fichas('#' + fr)
    ok(res.n > 0 && !res.bad.length, tag(`fichas a ${w}px: ${res.bad.join(' · ')}`))
    note('fichas de opción (campo → alto del bloque nombre+datos, límite, datos visibles)', `${engine} ${w}px: ${res.maxH}px ≤ ${res.lim.toFixed(1)}, ${res.facts} de 4 datos`)
    await page.keyboard.press('Escape'); await page.evaluate(() => document.activeElement.blur())
    // La ficha del valor: nada sale de la celda (más el space-1 de su relleno)
    await page.evaluate((w) => { const r = document.querySelector('[data-case="tok-md"]').closest('.g-combobox'); r.closest('.sizes').style.gridTemplateColumns = w + 'px ' + w + 'px' }, w)
    const tk = await page.evaluate(`(() => { const { px } = ${L}; const r = document.querySelector('[data-case="tok-md"]').closest('.g-combobox'); const c = r.querySelector('.g-input__control').getBoundingClientRect(); const t = r.querySelector('.g-combobox__token'); const T = t.getBoundingClientRect(); const out = [...t.querySelectorAll('*')].filter((k) => { const b = k.getBoundingClientRect(); return b.width && (b.right > T.right + 0.5 || b.left < T.left - 0.5) }).length; return { inside: T.right <= c.right && T.left >= c.left, out, exp: r.querySelector('.g-combobox__token-meta').scrollWidth <= r.querySelector('.g-combobox__token-meta').clientWidth + 0.5 } })()`)
    ok(tk.inside && !tk.out, tag(`ficha del valor a ${w}px: sale de la caja ${JSON.stringify(tk)}`))
    await page.evaluate(() => { document.querySelector('[data-case="tok-md"]').closest('.sizes').style.gridTemplateColumns = '' ; document.querySelector('[data-case="pac"]').closest('.g-combobox').style.inlineSize = '' })
  }

  /* 4c · Recorrer cinco opciones con el puntero: como máximo una superficie resaltada por cuadro */
  {
    await go()
    await typeIn('pac', 'mar')
    const pts = await page.evaluate(() => [...document.querySelector('[data-case="pac"]').closest('.g-combobox').querySelectorAll('.g-combobox__popup .g-combobox__option')].slice(0, 5).map((o) => { const b = o.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } }))
    await page.evaluate(() => { window.__hl = []; window.__run = true; (function f() { const os = document.querySelector('[data-case="pac"]').closest('.g-combobox').querySelectorAll('.g-combobox__popup .g-combobox__option'); let n = 0; for (const o of os) { const cs = getComputedStyle(o); const bc = cs.borderTopColor.match(/[\d.]+/g).map(Number); const a = bc.length > 3 ? bc[3] : 1; if (a > 0.05 || cs.boxShadow !== 'none') n++ } window.__hl.push(n); if (window.__run) requestAnimationFrame(f) })() })
    for (const p of pts) await page.mouse.move(p.x, p.y, { steps: 6 })
    for (const p of [...pts].reverse()) await page.mouse.move(p.x, p.y, { steps: 6 })
    await page.waitForTimeout(150)
    const hl = await page.evaluate(() => { window.__run = false; return window.__hl })
    ok(pts.length === 5 && Math.max(...hl) <= 1, tag(`puntero: hasta ${Math.max(...hl)} superficies resaltadas en un cuadro (${hl.length} cuadros)`))
    note('recorrido con el puntero (cinco opciones, ida y vuelta)', `${engine}: ${hl.length} cuadros, máximo ${Math.max(...hl)} superficie resaltada por cuadro`)
    await page.keyboard.press('Escape'); await page.evaluate(() => document.activeElement.blur())
    // Cambio de lado al desplazar la página con la forma abierta: ningún cuadro con la forma rota
    await page.evaluate(() => document.querySelector('[data-case="up"]').scrollIntoView({ block: 'end' }))
    await page.click('[data-case="up"]'); await page.keyboard.type('ma'); await settle()
    const side = await page.evaluate(() => new Promise((res) => { const r = document.querySelector('[data-case="up"]').closest('.g-combobox'); const out = { frames: 0, broken: 0, flips: 0, sides: new Set() }; let last = null, i = 0
      ;(function f() { const c = r.querySelector('.g-input__control').getBoundingClientRect(), p = r.querySelector('.g-combobox__popup'), P = p.getBoundingClientRect(), up = r.classList.contains('is-up'), cs = getComputedStyle(p)
        if (p.matches(':popover-open') && getComputedStyle(p).display !== 'none') { out.frames++; const okShape = Math.abs(P.left - c.left) < 1 && Math.abs(P.width - c.width) < 1 && (up ? Math.abs(P.bottom - c.bottom) < 1 : Math.abs(P.top - c.top) < 1) && cs.outlineStyle === 'solid'; if (!okShape) out.broken++; if (last !== null && last !== up) out.flips++; last = up; out.sides.add(up) }
        if (i++ < 70) { scrollBy(0, 12); requestAnimationFrame(f) } else res({ ...out, sides: [...out.sides] }) })() }))
    ok(side.broken === 0 && side.flips >= 1, tag(`cambio de lado: ${side.broken} cuadros con la forma rota de ${side.frames}, ${side.flips} cambios`))
    note('cambio de lado al desplazar (cuadros con la forma rota)', `${engine}: ${side.broken} de ${side.frames}, ${side.flips} cambio(s) de lado`)
    await page.keyboard.press('Escape'); await page.evaluate(() => document.activeElement.blur())
  }

  /* 5 · Movimiento: despliegue de A y llegada de la ficha */
  {
    await go('?slow=1')
    await page.evaluate(() => document.querySelector('[data-case="dx"]').scrollIntoView({ block: 'center' }))
    await page.click('[data-case="dx"]')
    const hs = page.evaluate(() => new Promise((res) => { const out = []; const t0 = performance.now(); (function f() { const b = document.querySelector('[data-case="dx"]').closest('.g-combobox').querySelector('.g-combobox__popup-body'); out.push(b && b.closest('.g-combobox__popup').matches(':popover-open') ? b.getBoundingClientRect().height : -1); if (performance.now() - t0 < 1600) requestAnimationFrame(f); else res(out) })() }))
    await page.keyboard.type('h')
    const H = (await hs).filter((v) => v >= 0)
    const fin = H[H.length - 1]
    const mid = [...new Set(H.filter((v) => v > 2 && v < fin - 2).map((v) => Math.round(v)))]
    ok(mid.length >= 2, tag(`despliegue: ${mid.length} alturas intermedias (${H.slice(0, 6).map(Math.round)})`))
    // Cambiar los resultados no anima
    // Cambiar los resultados no anima: tras cada tecla el alto pasa del viejo al nuevo sin valores intermedios
    for (const ch of 'ipe') {
      const hs2 = page.evaluate(() => new Promise((res) => { const out = []; const t0 = performance.now(); (function f() { out.push(document.querySelector('[data-case="dx"]').closest('.g-combobox').querySelector('.g-combobox__popup-body').getBoundingClientRect().height); if (performance.now() - t0 < 600) requestAnimationFrame(f); else res(out) })() }))
      await page.keyboard.type(ch)
      const H2 = (await hs2).map(Math.round)
      ok(new Set(H2).size <= 2, tag(`«${ch}»: los cambios de resultados animan el alto (${[...new Set(H2)]})`))
    }
    await page.keyboard.press('Escape'); await page.evaluate(() => document.activeElement.blur())

    // Llegada: elegir la cuarta homónima; vector, posiciones intermedias, rebase, fin y retirada
    await go()
    await typeIn('pac', 'mar')
    await page.evaluate(() => { const r = document.querySelector('[data-case="pac"]').closest('.g-combobox'); r.querySelector('.g-combobox__panel').scrollTop = 0 })
    const far = await page.evaluate(() => { const r = document.querySelector('[data-case="pac"]').closest('.g-combobox'); const rows = [...r.querySelectorAll('.g-combobox__popup .g-combobox__option')]; const el = rows[3]; const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } })
    await page.evaluate(() => { window.__arr = null; const r = document.querySelector('[data-case="pac"]').closest('.g-combobox'); const mo = new MutationObserver(() => { const t = r.querySelector('.g-combobox__token.is-arriving'); if (t && !window.__arr) { const a = t.getAnimations().find((x) => x.animationName === 'g-combobox-arrive'); if (a) { a.pause(); window.__arr = a } } }); mo.observe(r, { subtree: true, attributes: true, childList: true }); window.__mo = mo })
    await page.mouse.move(far.x, far.y); await page.mouse.click(far.x, far.y)
    await page.waitForFunction(() => window.__arr, null, { timeout: 3000 }).catch(() => {})
    const tr = await page.evaluate(`(() => { const { px } = ${L}; const a = window.__arr; if (!a) return null; const t = document.querySelector('[data-case="pac"]').closest('.g-combobox').querySelector('.g-combobox__token'); const dur = a.effect.getComputedTiming().duration; const out = []
      for (let i = 0; i <= 60; i++) { a.currentTime = dur * i / 60; const v = getComputedStyle(t).translate; const m = v === 'none' ? [0, 0] : v.split(' ').map(parseFloat); out.push([m[0], m[1] ?? 0]) }
      const vx = parseFloat(t.style.getPropertyValue('--_travel-x')), vy = parseFloat(t.style.getPropertyValue('--_travel-y')); a.currentTime = 0; a.play(); return { out, vx, vy, s2: px('--g-space-1') * 2, dur } })()`)
    ok(tr, tag('llegada: no hay animación g-combobox-arrive'))
    if (tr) {
      const ys = tr.out.map((p) => p[1]), y0 = ys[0], sign = Math.sign(tr.vy)
      const want = Math.sign(tr.vy) * Math.min(Math.abs(tr.vy), tr.s2 / 0.038)
      ok(Math.abs(y0 - want) < 0.6, tag(`llegada: no parte de la fila, acotada (${y0} ≠ ${want})`))
      ok(new Set(ys.slice(1, -1).map((v) => Math.round(v))).size >= 2, tag('llegada: menos de dos posiciones intermedias'))
      ok(Math.abs(ys[ys.length - 1]) < 0.01, tag(`llegada: no termina en 0 (${ys[ys.length - 1]})`))
      const over = Math.max(0, ...ys.map((v) => -sign * v))
      ok(over <= tr.s2 + 0.1, tag(`llegada: rebase ${over.toFixed(2)}px > space × 2 (${tr.s2})`))
      note('llegada (vector, rebase medido)', `${engine} Δy ${tr.vy.toFixed(1)}px → rebase ${over.toFixed(2)}px (tope ${tr.s2}px)`)
    }
    await page.waitForTimeout(700)
    ok(await page.evaluate(() => !document.querySelector('[data-case="pac"]').closest('.g-combobox').querySelector('.g-combobox__token.is-arriving')), tag('llegada: is-arriving no se retira al terminar'))
    // Vector de 600px: se acota y el rebase sigue ≤ space × 2
    const cl = await page.evaluate(`(() => { const { px } = ${L}; const t = document.querySelector('[data-case="pac"]').closest('.g-combobox').querySelector('.g-combobox__token'); t.style.setProperty('--_travel-x', '0px'); t.style.setProperty('--_travel-y', '600px'); t.classList.add('is-arriving'); const a = t.getAnimations().find((x) => x.animationName === 'g-combobox-arrive'); if (!a) return null; a.pause(); const dur = a.effect.getComputedTiming().duration; const ys = []
      for (let i = 0; i <= 80; i++) { a.currentTime = dur * i / 80; const v = getComputedStyle(t).translate; ys.push(v === 'none' ? 0 : parseFloat(v.split(' ')[1] ?? 0)) }
      a.cancel(); t.classList.remove('is-arriving'); return { y0: ys[0], over: Math.max(0, ...ys.map((v) => -v)), s2: px('--g-space-1') * 2, cap: px('--g-space-1') * 2 / 0.038 } })()`)
    ok(cl && Math.abs(cl.y0 - cl.cap) < 0.6 && cl.over <= cl.s2 + 0.1, tag(`llegada acotada: parte de ${cl?.y0} (tope ${cl?.cap?.toFixed(1)}), rebase ${cl?.over?.toFixed(2)}`))
    if (cl) note('llegada con vector de 600px', `${engine} parte de ${cl.y0.toFixed(1)}px, rebase ${cl.over.toFixed(2)}px`)
  }

  /* 6 · Movimiento reducido: nada se desplaza; fundidos sí */
  {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await go()
    await typeIn('pac', 'mar')
    const rm = await page.evaluate(() => { const r = document.querySelector('[data-case="pac"]').closest('.g-combobox'); const b = getComputedStyle(r.querySelector('.g-combobox__popup-body')); const ar = getComputedStyle(r.querySelector('.g-combobox__arrow')); return { body: b.transitionProperty + ' ' + b.transitionDuration, arrow: ar.transitionProperty + ' ' + ar.transitionDuration } })
    ok(!/grid-template-rows/.test(rm.body) || /^\S+ 0s$/.test(rm.body), tag('reduce: el despliegue sigue animado ' + rm.body))
    ok(!/rotate/.test(rm.arrow) || /0s/.test(rm.arrow), tag('reduce: la flecha gira con transición ' + rm.arrow))
    const row = await page.evaluate(() => { const el = document.querySelector('[data-case="pac"]').closest('.g-combobox').querySelectorAll('.g-combobox__popup .g-combobox__option')[2]; const b = el.getBoundingClientRect(); return { x: b.left + 20, y: b.top + 10 } })
    await page.mouse.click(row.x, row.y)
    await page.waitForTimeout(80)
    const st = await page.evaluate(() => { const t = document.querySelector('[data-case="pac"]').closest('.g-combobox').querySelector('.g-combobox__token'); return { cls: t.classList.contains('is-arriving'), anim: getComputedStyle(t).animationName, tr: getComputedStyle(t).translate } })
    ok(!st.cls && st.anim === 'none' && (st.tr === 'none' || st.tr === '0px'), tag(`reduce: la ficha viaja (${JSON.stringify(st)})`))
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  }

  /* 7 · B · paleta a 1280 y hoja arriba a 375 y 320 */
  {
    await go()
    await typeIn('pal', 'mar')
    const pal = await page.evaluate(`(() => { const { px } = ${L}; const d = document.querySelector('dialog[open].g-combobox-surface'); if (!d) return null; const r = d.getBoundingClientRect(); const body = d.querySelector('.g-dialog__body'); const sb = d.querySelector('.g-combobox__surface-body').getBoundingClientRect(); const pan = d.querySelector('.g-combobox__panel'); const pv = d.querySelector('.g-combobox__preview')
      return { modal: d.matches(':modal'), palette: d.classList.contains('g-combobox-surface--palette'), inView: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, bodyScroll: body.scrollHeight - body.clientHeight, tabindex: body.hasAttribute('tabindex'), sbh: sb.height, want: px('--g-space-1') * 96, ratio: pan.getBoundingClientRect().width / pv.getBoundingClientRect().width, panScroll: pan.scrollHeight > pan.clientHeight, focus: document.activeElement.classList.contains('g-combobox__search-field') } })()`)
    ok(pal && pal.modal && pal.palette && pal.inView, tag('paleta: no modal, sin clase o fuera del visor ' + JSON.stringify(pal)))
    if (pal) {
      ok(pal.bodyScroll <= 1, tag(`paleta: el cuerpo del diálogo se desplaza (${pal.bodyScroll}px)`))
      ok(Math.abs(pal.sbh - pal.want) < 1, tag(`paleta: alto del cuerpo ${pal.sbh} ≠ space × 96 (${pal.want})`))
      ok(Math.abs(pal.ratio - 1.2) < 0.05, tag(`paleta: proporción lista–vista previa ${pal.ratio.toFixed(2)} ≠ 1.2`))
      ok(pal.panScroll && pal.focus, tag('paleta: el panel no se desplaza o el foco no está en la búsqueda'))
      note('paleta 1280', `${engine} cuerpo ${pal.sbh}px · lista/vista ${pal.ratio.toFixed(2)}`)
      const pv = await page.evaluate(() => { const v = document.querySelector('dialog[open] .g-combobox__preview'); const o = [...document.querySelectorAll('dialog[open] .g-combobox__option:not(.g-combobox__action) .g-combobox__main')]; return { pv: v.scrollWidth - v.clientWidth, dd: v.querySelectorAll('dd').length, rows: o.every((m) => m.scrollWidth <= m.clientWidth + 0.5) } })
      ok(pv.pv <= 0.5 && pv.dd === 4 && pv.rows, tag(`paleta: la vista previa desborda o no trae los 4 datos, o una ficha desborda ${JSON.stringify(pv)}`))
    }
    await page.keyboard.press('Escape'); await settle(page, 300)
    for (const [w, h] of [[375, 812], [320, 640]]) {
      const c3 = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: engine !== 'firefox', isMobile: engine === 'chromium' })
      const p3 = await c3.newPage()
      p3.on('pageerror', (e) => errors.push(e.message))
      await go('', p3)
      for (const c of ['pac', 'pal']) {
        await p3.evaluate((c) => document.querySelector(`[data-case="${c}"]`).scrollIntoView({ block: 'center' }), c)
        await p3.click(`[data-case="${c}"]`); await p3.keyboard.type('mar'); await settle(p3, 500)
        const sh = await p3.evaluate(() => { const d = document.querySelector('dialog[open].g-combobox-surface'); if (!d) return null; const r = d.getBoundingClientRect(); const rows = [...d.querySelectorAll('.g-combobox__option')].map((o) => o.getBoundingClientRect()); const body = d.querySelector('.g-dialog__body')
          return { sheet: d.classList.contains('g-combobox-surface--sheet'), top: r.top, left: r.left, w: r.width, vw: document.documentElement.clientWidth, preview: Boolean(d.querySelector('.g-combobox__preview')), minRow: Math.min(...rows.map((x) => x.height)), overflowX: Math.max(...rows.map((x) => x.right)) - r.right, docX: document.documentElement.scrollWidth - document.documentElement.clientWidth, bodyScroll: body.scrollHeight - body.clientHeight, bottom: r.bottom, vh: innerHeight } })
        const t = (x) => tag(`hoja ${w} ${c}: ${x}`)
        ok(sh && sh.sheet, t('no es la hoja ' + JSON.stringify(sh)))
        if (sh) {
          ok(Math.abs(sh.top) <= 1 && Math.abs(sh.left) <= 1 && Math.abs(sh.w - sh.vw) <= 1, t(`no está arriba a ancho completo (top ${sh.top}, w ${sh.w}/${sh.vw})`))
          ok(!sh.preview && sh.minRow >= 44 - 0.5 && sh.overflowX <= 0.5 && sh.docX <= 0, t(`vista previa ${sh.preview}, fila mínima ${sh.minRow}, desborde ${sh.overflowX}/${sh.docX}`))
          ok(sh.bodyScroll <= 1 && sh.bottom <= sh.vh, t(`cuerpo con desplazamiento (${sh.bodyScroll}) o fuera del visor`))
          note('hoja', `${engine} ${w}×${h} ${c}: top ${sh.top}, fila mínima ${sh.minRow.toFixed(1)}px, alto ${sh.bottom.toFixed(0)}px`)
        }
        const fx = await p3.evaluate(() => { const o = [...document.querySelectorAll('dialog[open] .g-combobox__option:not(.g-combobox__action)')]; return o.map((x) => { const m = x.querySelector('.g-combobox__main'); return { h: m.getBoundingClientRect().height, sw: m.scrollWidth - m.clientWidth } }) })
        const lim2 = await p3.evaluate(`(() => { const { px } = ${L}; return px('--g-text-body-line') + px('--g-text-body-sm-line') + 0.5 })()`)
        ok(fx.length && fx.every((x) => x.h <= lim2 && x.sw <= 0.5), tag(`hoja ${w} ${c}: ficha de más de dos líneas o desborde ${JSON.stringify(fx[0])}`))
        await p3.keyboard.press('Escape'); await settle(p3, 350)
      }
      await c3.close()
    }
  }

  /* 8 · forced-colors (L23) */
  {
    let supported = true
    try { await page.emulateMedia({ forcedColors: 'active' }) } catch { supported = false }
    await go()
    supported = supported && await page.evaluate(() => matchMedia('(forced-colors: active)').matches)
    if (!supported) notes.push(`${engine}: forced-colors no emulable; se mide en los motores que lo emulan`)
    else {
      const f = await page.evaluate(`(() => { const { parse, root } = ${L}; const r = root('tok-md'); const t = r.querySelector('.g-combobox__token'); const inp = r.querySelector('.g-combobox__field'); const i = document.createElement('i'); i.style.color = 'FieldText'; r.querySelector('.g-input__control').append(i); const ft = getComputedStyle(i).color; i.remove(); return { token: getComputedStyle(t).display, a: parse(getComputedStyle(inp).color)[3], same: getComputedStyle(inp).color === ft } })()`)
      ok(f.token === 'none' && f.same && f.a > 0.5, tag(`forced-colors: la ficha no se retira o el texto del <input> no se ve (${f.token}, α ${f.a}, FieldText ${f.same})`))
      await typeIn('pac', 'mar')
      const g = await page.evaluate(`(() => { const { root } = ${L}; const r = root('pac'); const sys = (k, p) => { const i = document.createElement('i'); i.style[p] = k; r.querySelector('.g-input__control').append(i); const v = getComputedStyle(i)[p]; i.remove(); return v }; const act = r.querySelector('.g-combobox__option.is-active'); const pop = getComputedStyle(r.querySelector('.g-combobox__popup')); const mark = getComputedStyle(r.querySelector('.g-combobox__option:not(.is-active) .g-combobox__mark'))
        return { actBg: getComputedStyle(act).backgroundColor === sys('Highlight', 'backgroundColor'), actFg: getComputedStyle(act.querySelector('.g-combobox__label')).color === sys('HighlightText', 'color'), factFg: getComputedStyle(act.querySelector('.g-combobox__fact-label')).color === sys('HighlightText', 'color'), border: pop.borderTopColor === sys('CanvasText', 'color'), ring: pop.outlineColor === sys('Highlight', 'color') && pop.outlineStyle === 'solid', ghost: getComputedStyle(r.querySelector('.g-combobox__ghost-rest')).color === sys('GrayText', 'color'), mark: /underline/.test(mark.textDecorationLine) && +mark.fontWeight >= 500 } })()`)
      for (const [k, v] of Object.entries(g)) ok(v, tag(`forced-colors: ${k}`))
      note('forced-colors', `${engine}: ficha retirada y texto visible; activa Highlight/HighlightText; forma CanvasText; anillo Highlight; fantasma GrayText; marca subrayada`)
      await page.keyboard.press('Escape')
      await page.emulateMedia({ forcedColors: 'none' })
    }
  }

  /* 9 · RTL: la forma se alinea al inicio de la caja; hueco inicial al inicio; barra/borde reflejado */
  {
    await go('?dir=rtl')
    await typeIn('pac', 'mar')
    const r = await shape('pac')
    ok(Math.abs(r.P.l - r.ctl.l) < 1 && Math.abs(r.P.w - r.ctl.w) < 1 && r.outline === 'solid', tag('RTL: la forma no coincide con la caja'))
    await page.keyboard.press('Escape'); await page.evaluate(() => document.activeElement.blur())
    const tk = await page.evaluate(`(() => { const { root } = ${L}; const r = root('tok-md'); const t = r.querySelector('.g-combobox__token').getBoundingClientRect(); const lead = r.querySelector('.g-combobox__token .g-combobox__lead').getBoundingClientRect(); const inp = r.querySelector('.g-combobox__field').getBoundingClientRect(); return { leadAtStart: lead.right > lead.left && Math.abs(lead.right - inp.right) <= 0.5, tokenInside: t.right <= r.querySelector('.g-input__control').getBoundingClientRect().right } })()`)
    ok(tk.leadAtStart && tk.tokenInside, tag('RTL: el hueco inicial de la ficha no está al inicio ' + JSON.stringify(tk)))
  }

  /* 10 · Fila de tres en GFormRow */
  {
    await go()
    const fr = await page.evaluate(() => { const out = {}
      for (const w of ['w1100', 'w720', 'w320']) { const cb = document.querySelector(`[data-case="row-${w}"]`).closest('.g-combobox'); const inn = document.querySelector(`[data-case="rowin-${w}"]`).closest('.g-input'); const r1 = cb.getBoundingClientRect(), r2 = inn.getBoundingClientRect()
        out[w] = { min: getComputedStyle(cb).getPropertyValue('--g-form-min').trim(), w: r1.width, sameLine: Math.abs(r1.top - r2.top) < 1, boxTop: Math.abs(cb.querySelector('.g-input__control').getBoundingClientRect().top - inn.querySelector('.g-input__control').getBoundingClientRect().top) } }
      return out })
    ok(fr.w1100.min === '60', tag('fila: --g-form-min no es 60 (' + fr.w1100.min + ')'))
    ok(fr.w1100.sameLine && fr.w1100.boxTop < 1, tag('fila 1100: no comparten línea'))
    for (const w of ['w1100', 'w720', 'w320']) ok(fr[w].w >= 239, tag(`fila ${w}: el campo mide ${fr[w].w.toFixed(1)}px < 239`))
    note('fila de tres', `${engine} ` + Object.entries(fr).map(([k, v]) => `${k}: ${v.w.toFixed(0)}px ${v.sameLine ? 'en línea' : 'partida'}`).join(' · '))
    // A funciona en la fila (la forma mide lo que el campo)
    await typeIn('row-w720', 'mar')
    const s = await shape('row-w720')
    ok(Math.abs(s.P.w - s.ctl.w) < 1 && s.ctl.w >= 239, tag('fila 720: la forma no mide lo que el campo'))
    await page.keyboard.press('Escape'); await page.evaluate(() => document.activeElement.blur())
    // El consumidor la sobrescribe
    const ov = await page.evaluate(async () => { const cb = document.querySelector('[data-case="row-w720"]').closest('.g-combobox'); cb.style.setProperty('--g-form-min', '30'); await new Promise((r) => setTimeout(r, 250)); const v = getComputedStyle(cb).getPropertyValue('--g-form-min').trim(); cb.style.removeProperty('--g-form-min'); return v })
    ok(ov === '30', tag('fila: el consumidor no puede sobrescribir --g-form-min (' + ov + ')'))
  }

  ok(!errors.length, tag('consola: ' + errors.slice(0, 3).join(' | ')))
  await browser.close()
}
server.close()

console.log(`\nGCombobox · estilo · ${total - failed}/${total} comprobaciones (${ENGINES.join(', ')})`)
for (const [k, v] of Object.entries(measures)) { console.log(`· ${k}`); for (const x of (args.verbose ? v : v.slice(0, 9))) console.log('    ' + x) }
for (const n of notes) console.log('nota: ' + n)
if (fails.length) { console.log('\nFALLAN:'); for (const f of fails) console.log('  ✗ ' + f); process.exitCode = 1 }
