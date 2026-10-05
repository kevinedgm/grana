// Auditoría de coco (paso 5) de GCombobox sobre el COMPONENTE REAL: el playground (packages/vue/playground, #sec-combobox,
// «Alta de paciente» #fm-clinica) con dist/combobox.umd.js y dist/grana.css tal como se publican, el servidor simulado de
// playground/combobox-data.js y el puntero y el desplazamiento de verdad (page.mouse, page.mouse.wheel).
// Repite la batería del banco (estilo-verificar.mjs) sobre el marcado que pone GCombobox.vue y añade lo que solo existe con
// el componente real, con especial cuidado en las dos zonas del reporte del usuario:
//   (1) fichas de opción amontonadas o desbordadas en estrecho → dos líneas, sin desborde, identificador visible a 240/320/480;
//   (2) «pivoteo/parpadeo» al pasar por las opciones y al desplazar → con el puntero real, una superficie resaltada por cuadro,
//       la lista no se desplaza sola, la forma no se recoloca; con la rueda real sobre la página, ningún cuadro con la forma
//       rota, el alto del panel constante salvo al cambiar de lado (una vez), cierre al salir del visor.
// Y busca otros saltos: abrir y cerrar rápido (contorno y anillo nunca ausentes a la vez), escribir mientras llegan los
// resultados con la red simulada real (la lista no parpadea a vacío ni el panel encoge y vuelve), «Mostrar más» (las filas a
// la vista no se mueven), llegada de la ficha, reapertura de la paleta durante su salida, hoja móvil al cambiar resultados.
// Temas: defecto claro y oscuro, «Tema de prueba» del playground claro y oscuro, el de la auditoría (auditoria-tema.css,
// @grana/cli: brand #0F5C5C, radius 2, space 3, fontSize 15) claro y oscuro y los once generados de
// design/lab/tema-oscuro/dark-color-presence/generated/ claro y oscuro (Chromium; Firefox y WebKit: siete).
// Ejecutar desde la raíz (requiere `npm run build`): GRANA_PW_PORT=4209 node design/lab/combobox/auditoria-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit   --shots=<carpeta> (capturas lado a lado con r02 ?c=AC y ?c=B)   --verbose
import http from 'node:http'
import zlib from 'node:zlib'
import { readFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const ONLY = args.only ? new Set(String(args.only).split(',')) : null
const run = (k) => !ONLY || ONLY.has(k)
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    // GRANA_DIST=<carpeta>: sirve una copia fija de dist/ (otra sesión puede estar reconstruyendo dist/ a la vez)
    const p = process.env.GRANA_DIST && path.startsWith('/packages/vue/dist/') ? join(process.env.GRANA_DIST, path.slice('/packages/vue/dist/'.length)) : normalize(join(ROOT, path))
    if (!p.startsWith(ROOT) && !(process.env.GRANA_DIST && p.startsWith(process.env.GRANA_DIST))) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 0, '127.0.0.1', r))
const ORIGIN = `http://127.0.0.1:${server.address().port}`
const PLAY = `${ORIGIN}/packages/vue/playground/index.html`

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

/* ---------- 0 · Análisis estático: GCombobox.css y las reglas g-combobox* de dist/grana.css ---------- */
if (run('static')) {
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GCombobox/GCombobox.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(css), 'CSS: color literal')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer/.test(css) && !/@property/.test(css) && !/!important/.test(css), 'CSS: @layer, @property o !important')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  ok([...own].every((v) => v.startsWith('--_cb-')), 'CSS: alias propio sin prefijo --_cb-: ' + [...own])
  const allowed = ['--_focus', '--_radius', '--_fs', '--_lh', '--_gap', '--_density', '--_inset-radius', '--_x', '--_top', '--_bottom', '--_w', '--_max', '--_field-h', '--_travel-x', '--_travel-y']
  const strange = [...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v) && !allowed.includes(v)))]
  ok(!strange.length, 'CSS: alias --_* no previsto: ' + strange)
  const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  ok(px.every((p) => ['24px', '44px', '1px', '-1px', '0px'].includes(p)), 'CSS: medidas literales no permitidas ' + px.filter((p) => !['24px', '44px', '1px', '-1px', '0px'].includes(p)))
  // dist/grana.css: todas las reglas cuyo selector nombra g-combobox (minificado; se parte por bloques)
  const dist = await readFile(process.env.GRANA_DIST ? join(process.env.GRANA_DIST, 'grana.css') : join(ROOT, 'packages/vue/dist/grana.css'), 'utf8')
  const blocks = []
  {
    let depth = 0, sel = '', start = 0, ctx = []
    for (let i = 0; i < dist.length; i++) {
      const ch = dist[i]
      if (ch === '{') { ctx.push(dist.slice(start, i).trim()); start = i + 1 }
      else if (ch === '}') { const s = ctx.pop(); const body = dist.slice(start, i); if (s && /g-combobox/.test(s) && !/^@/.test(s)) blocks.push({ s, body, ctx: ctx.join(' » ') }); start = i + 1 }
      else if (ch === ';' && false) depth++
    }
  }
  ok(blocks.length > 80, `dist: solo ${blocks.length} reglas g-combobox`)
  const sysOk = (b) => /forced-colors/.test(b.ctx)
  const litColor = blocks.filter((b) => /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/.test(b.body))
  ok(!litColor.length, 'dist: color literal en g-combobox* ' + litColor.map((b) => b.s).slice(0, 3))
  const fb = blocks.filter((b) => /var\(\s*--[\w-]+\s*,/.test(b.body))
  ok(!fb.length, 'dist: var() con respaldo en g-combobox* ' + fb.map((b) => b.s).slice(0, 3))
  const sys = blocks.filter((b) => /\b(Canvas|CanvasText|Highlight|HighlightText|GrayText|FieldText|ButtonText)\b/.test(b.body) && !sysOk(b))
  ok(!sys.length, 'dist: colores de sistema fuera de forced-colors ' + sys.map((b) => b.s).slice(0, 3))
  const lay = blocks.filter((b) => !/grana\.components/.test(b.ctx))
  ok(!lay.length, 'dist: reglas g-combobox fuera de la capa grana.components ' + lay.map((b) => b.s).slice(0, 3))
  const dpx = [...new Set(blocks.flatMap((b) => [...b.body.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])))]
  ok(dpx.every((p) => ['24px', '44px', '1px', '-1px', '0px', '0'].includes(p)), 'dist: medidas literales en g-combobox* ' + dpx)
  note('dist/grana.css', `${blocks.length} reglas g-combobox*, sin literales de color ni respaldos; colores de sistema solo en forced-colors; todas en grana.components`)
  const js = await readFile(process.env.GRANA_DIST ? join(process.env.GRANA_DIST, 'grana.js') : join(ROOT, 'packages/vue/dist/grana.js'), 'utf8')
  ok(!/GCombobox/.test(js), 'dist: GCombobox viaja en grana.js (debe ir en su propia entrada)')
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
  const px = (n) => { const i = document.createElement('i'); i.style.inlineSize = `var(${n})`; i.style.position = 'absolute'; document.body.append(i); const v = i.getBoundingClientRect().width; i.remove(); return v }
  const tok = (n, prop = 'color', host = document.body) => { const i = document.createElement('i'); i.style[prop] = `var(${n})`; host.append(i); const c = getComputedStyle(i)[prop]; i.remove(); return c }
  const root = (id) => document.getElementById(id).closest('.g-combobox')
  const fg = (el) => parse(getComputedStyle(el).color)
  const pair = (k, el, min, bgEl = el) => el ? { k, r: ratio(over(fg(el), bgOf(bgEl)), bgOf(bgEl)), min } : { k: k + ' (no está)', r: 0, min }
  return { parse, over, bgOf, ratio, px, tok, root, fg, pair }
}
const L = `(${lib.toString()})()`

/* ---------- Navegador ---------- */
const shotsDir = typeof args.shots === 'string' ? args.shots : null
if (shotsDir) await mkdir(shotsDir, { recursive: true })

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const errors = []
  const tag = (s) => `${engine} ${s}`
  const mk = async ({ width = 1280, height = 900, dpr = 1, touch = false, mobile = false } = {}) => {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, hasTouch: touch, isMobile: mobile && engine === 'chromium' })
    const page = await ctx.newPage()
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push(m.text()) })
    page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errors.push(e.message) })
    return { ctx, page }
  }
  // Tema: '' por defecto · 'test' Tema de prueba del playground · 'audit' · nombre de un generado. dark: data-theme
  const go = async (page, { theme = '', dark = false, fast = true, motion = 'no-preference', dir = '' } = {}) => {
    await page.emulateMedia({ reducedMotion: motion })
    if (fast) await page.addInitScript(() => { window.__cbFast = true })
    await page.goto(PLAY)
    await page.waitForSelector('#cb-pac', { timeout: 15000 }).catch((e) => { throw new Error('el playground no montó: ' + [...new Set(errors)].slice(-3).join(' | ') + ' · ' + e.message.split('\n')[0]) })
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
    if (theme === 'test') await page.click('#pg-theme-test')
    else if (theme) {
      const href = theme === 'audit' ? '/design/lab/combobox/auditoria-tema.css' : `/design/lab/tema-oscuro/dark-color-presence/generated/${theme}.css`
      await page.evaluate((href) => new Promise((r) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = r; l.onerror = r; document.head.append(l) }), href)
    }
    await page.evaluate(([d, dir]) => { document.documentElement.dataset.theme = d ? 'dark' : 'light'; if (dir) document.getElementById('sec-combobox').dir = dir }, [dark, dir])
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  }
  const center = (page, id, block = 'center') => page.evaluate(([id, block]) => document.getElementById(id).closest('.g-input__control').scrollIntoView({ block }), [id, block])
  const settle = (page, ms = 450) => page.waitForTimeout(ms)
  const close = async (page) => { await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.evaluate(() => document.activeElement && document.activeElement.blur()); await settle(page, 120) }
  const openWith = async (page, id, text, ms = 500) => {
    await center(page, id)
    await page.click('#' + id)
    if (text) await page.keyboard.type(text, { delay: 25 })
    await page.waitForFunction((id) => { const p = document.getElementById(id + '-popup'); return p && p.querySelector('.g-combobox__option, .g-combobox__status') && !document.getElementById(id + '-list')?.getAttribute('aria-busy') }, id, { timeout: 4000 }).catch(() => {})
    await settle(page, ms)
  }

  /* 1 · Marcado real frente al CSS */
  if (run('markup')) {
    const { ctx, page } = await mk()
    await go(page)
    const m0 = await page.evaluate(() => {
      const r = document.getElementById('cb-f-pac').closest('.g-combobox')
      const pop = document.getElementById('cb-f-pac-popup'), live = r.querySelector('.g-combobox__live')
      return { popInRoot: pop.parentElement === r, liveInRoot: live && live.parentElement === r, token: r.classList.contains('is-token'), prepend: r.querySelector('.g-input__prepend') ? getComputedStyle(r.querySelector('.g-input__prepend')).display : 'sin prepend',
        avatarXs: Boolean(r.querySelector('.g-combobox__token .g-avatar--size-xs')), hidden: r.querySelector('input[type=hidden][name=paciente]') ? 1 : 0, value: r.querySelector('.g-combobox__value') !== null,
        surfaceInRoot: (() => { const s = document.getElementById('cb-pal-surface'); return Boolean(s && s.closest('.g-combobox') === document.getElementById('cb-pal').closest('.g-combobox')) })() }
    })
    ok(m0.popInRoot && m0.liveInRoot && m0.surfaceInRoot, tag('marcado: popup, región viva o superficie no son hijos de la raíz ' + JSON.stringify(m0)))
    ok(m0.token && m0.avatarXs && m0.hidden, tag('marcado: ficha con avatar xs u oculto con name ' + JSON.stringify(m0)))
    await openWith(page, 'cb-pac', 'mar')
    const m1 = await page.evaluate(() => {
      const pop = document.getElementById('cb-pac-popup'); const s = pop.style
      const vars = ['--_x', '--_top', '--_bottom', '--_w', '--_max', '--_field-h'].map((k) => [k, s.getPropertyValue(k)])
      const ctl = document.getElementById('cb-pac').closest('.g-input__control').getBoundingClientRect()
      const o = pop.querySelector('.g-combobox__option')
      return { vars, fh: parseFloat(s.getPropertyValue('--_field-h')), ctlH: ctl.height, avatarMd: Boolean(o.querySelector('.g-avatar--size-md')), parts: ['g-summary--layout-row', 'g-summary__lead', 'g-summary__title', 'g-summary__facts', 'g-summary__fact', 'g-summary__fact-label', 'g-summary__mark'].filter((c) => !o.querySelector('.' + c)),
        old: ['g-combobox__lead', 'g-combobox__main', 'g-combobox__label', 'g-combobox__facts', 'g-combobox__fact', 'g-combobox__mark', 'g-combobox__code', 'g-combobox__description'].filter((c) => o.querySelector('.' + c)),
        popover: pop.matches(':popover-open'), ghost: Boolean(document.getElementById('cb-pac').closest('.g-combobox').querySelector('.g-combobox__ghost-rest')) }
    })
    ok(m1.vars.every(([, v]) => v !== ''), tag('marcado: variables en línea del popup ' + JSON.stringify(m1.vars)))
    ok(Math.abs(m1.fh - m1.ctlH) < 0.5, tag(`marcado: --_field-h ${m1.fh} ≠ alto de la caja ${m1.ctlH}`))
    ok(m1.avatarMd && !m1.parts.length && m1.popover && m1.ghost, tag('marcado: fila sin avatar md o sin partes ' + m1.parts + ' o sin fantasma'))
    ok(!m1.old.length, tag('marcado: la opción aún emite partes retiradas por #356 ' + m1.old))
    await close(page)
    await ctx.close()
  }

  /* 2 · Contraste en todas las configuraciones */
  if (run('contrast')) {
    const { ctx, page } = await mk()
    const measure = async () => {
      const out = []
      await openWith(page, 'cb-pac', 'mar')
      out.push(...await page.evaluate(`(() => { const { pair, parse, ratio, bgOf } = ${L}; const pop = document.getElementById('cb-pac-popup'); const rows = [...pop.querySelectorAll('.g-combobox__option')]; const act = pop.querySelector('.g-combobox__option.is-active'); const idle = rows.find((x) => !x.classList.contains('is-active'))
        return [pair('opción: etiqueta', idle.querySelector('.g-summary__title'), 4.5), pair('opción: coincidencia', idle.querySelector('.g-summary__mark'), 4.5), pair('opción: rótulo de dato', idle.querySelector('.g-summary__fact-label'), 4.5), pair('opción: dato', idle.querySelector('.g-summary__fact-value'), 4.5),
          pair('opción: «+N»', idle.querySelector('.g-summary__more:not([hidden])'), 4.5),
          pair('avatar md (iniciales)', idle.querySelector('.g-avatar__initials'), 4.5),
          act ? pair('activa: etiqueta', act.querySelector('.g-summary__title'), 4.5) : { k: 'activa (no hay)', r: 0, min: 4.5 },
          act ? pair('activa: rótulo de dato', act.querySelector('.g-summary__fact-label'), 4.5) : { k: 'activa rótulo (no hay)', r: 0, min: 4.5 },
          act ? { k: 'activa: borde de ficha', r: ratio(parse(getComputedStyle(act).borderTopColor), bgOf(act.parentElement)), min: 3 } : { k: 'activa borde (no hay)', r: 0, min: 3 },
          { k: 'forma: contorno', r: ratio(parse(getComputedStyle(pop).borderTopColor), bgOf(document.body)), min: 3 },
          pair('fantasma: resto', document.getElementById('cb-pac').closest('.g-combobox').querySelector('.g-combobox__ghost-rest'), 4.5)] })()`))
      await close(page)
      await openWith(page, 'cb-dx', '', 300)
      out.push(...await page.evaluate(`(() => { const { pair } = ${L}; const pop = document.getElementById('cb-dx-popup'); return [pair('código', pop.querySelectorAll('.g-combobox__option .g-summary__code')[1], 4.5), pair('encabezado de grupo', pop.querySelector('.g-combobox__group-label'), 4.5), pair('descripción', pop.querySelectorAll('.g-combobox__option .g-summary__subtitle')[1], 4.5)] })()`))
      await close(page)
      await openWith(page, 'cb-dx', 'zzqq', 300)
      out.push(...await page.evaluate(`(() => { const { pair } = ${L}; return [pair('sin resultados', document.querySelector('#cb-dx-popup .g-combobox__status'), 4.5)] })()`))
      await close(page)
      // La marca se pone tras la primera letra: con la red rápida, «l» ya busca (y consumiría el fallo) antes de «lu»
      await openWith(page, 'cb-err', 'l', 200)
      await page.evaluate(() => { window.__cbFailNext = true })
      await page.keyboard.type('u')
      await page.waitForSelector('#cb-err-popup .g-combobox__status--error', { timeout: 3000 }).catch(() => {})
      await settle(page, 200)
      out.push(...await page.evaluate(`(() => { const { pair } = ${L}; const pop = document.getElementById('cb-err-popup'); return [pair('error de carga', pop.querySelector('.g-combobox__status--error'), 4.5), pair('fila de acción', pop.querySelector('.g-combobox__action .g-combobox__label'), 4.5)] })()`))
      await close(page)
      await page.evaluate(() => { window.__cb.medLibre = 'Jarabe casero de miel'; window.__cb.dx = 'E11.9' })
      await settle(page, 150)
      out.push(...await page.evaluate(`(() => { const { pair, root } = ${L}; const t = (id, s) => root(id).querySelector(s)
        return [pair('ficha: etiqueta', t('cb-f-pac', '.g-combobox__token .g-summary__title'), 4.5), pair('ficha: rótulo de dato', t('cb-f-pac', '.g-combobox__token .g-summary__fact-label'), 4.5), pair('ficha: dato', t('cb-f-pac', '.g-combobox__token .g-summary__fact-value'), 4.5), pair('ficha: código', t('cb-dx', '.g-combobox__token .g-summary__code'), 4.5), pair('ficha: capítulo', t('cb-dx', '.g-combobox__token .g-summary__subtitle'), 4.5),
          pair('ficha: texto libre', t('cb-med', '.g-combobox__token .g-summary__title'), 4.5), pair('marca «Texto libre»', t('cb-med', '.g-combobox__token .g-summary__subtitle'), 4.5), pair('ficha solo lectura', t('cb-ro', '.g-combobox__token .g-summary__title'), 4.5), pair('ficha solo lectura: dato', t('cb-ro', '.g-combobox__token :is(.g-summary__fact-label, .g-summary__subtitle)'), 4.5)] })()`))
      await center(page, 'cb-f-pac'); await page.focus('#cb-f-pac'); await settle(page, 200)
      // Ficha seleccionada (foco: fondo --g-color-selection). La ficha del valor no recibe diff (no hay homónimas en el campo):
      // el valor compartido (is-same) se mide marcando un dato a mano, para comprobar el reapunte de GCombobox.css
      out.push(...await page.evaluate(`(() => { const { pair, root } = ${L}; const t = (s) => root('cb-f-pac').querySelector(s); const f = t('.g-combobox__token .g-summary__fact:not(.is-anchor)'); if (f) f.classList.add('is-same')
        const r = [pair('ficha seleccionada: etiqueta', t('.g-combobox__token .g-summary__title'), 4.5), pair('ficha seleccionada: rótulo', t('.g-combobox__token .g-summary__fact-label'), 4.5), pair('ficha seleccionada: dato', t('.g-combobox__token .g-summary__fact-value'), 4.5), pair('ficha seleccionada: compartido (is-same)', f && f.querySelector('.g-summary__fact-value'), 4.5)]
        if (f) f.classList.remove('is-same'); return r })()`))
      await center(page, 'cb-dx'); await page.focus('#cb-dx'); await settle(page, 200)
      out.push(...await page.evaluate(`(() => { const { pair, root } = ${L}; const t = (s) => root('cb-dx').querySelector(s); return [pair('ficha seleccionada: código', t('.g-combobox__token .g-summary__code'), 4.5), pair('ficha seleccionada: capítulo', t('.g-combobox__token .g-summary__subtitle'), 4.5)] })()`))
      await page.evaluate(() => { document.activeElement.blur(); window.__cb.medLibre = ''; window.__cb.dx = null })
      await center(page, 'cb-pal'); await page.click('#cb-pal'); await settle(page, 400); await page.keyboard.type('mar', { delay: 25 }); await settle(page, 500); await page.keyboard.press('ArrowDown'); await settle(page, 300)
      out.push(...await page.evaluate(`(() => { const { pair } = ${L}; const d = document.querySelector('dialog[open].g-combobox-surface'); if (!d) return [{ k: 'paleta (no abre)', r: 0, min: 4.5 }]; const act = d.querySelector('.g-combobox__option.is-active')
        return [pair('paleta activa: etiqueta', act.querySelector('.g-summary__title'), 4.5), pair('paleta activa: rótulo', act.querySelector('.g-summary__fact-label'), 4.5), pair('paleta activa: dato', act.querySelector('.g-summary__fact-value'), 4.5),
          pair('paleta: búsqueda', d.querySelector('.g-combobox__search-field'), 4.5), pair('paleta: título', d.querySelector('.g-dialog__title'), 4.5),
          pair('vista previa: título', d.querySelector('.g-combobox__preview .g-summary__title'), 4.5), pair('vista previa: rótulo', d.querySelector('.g-combobox__preview .g-summary__fact-label'), 4.5), pair('vista previa: dato', d.querySelector('.g-combobox__preview .g-summary__fact-value'), 4.5)] })()`))
      await page.keyboard.press('Escape'); await settle(page, 350)
      return out
    }
    const worst = {}
    const base = [['defecto', ''], ['prueba', 'test'], ['auditoría', 'audit']]
    const CONF = engine === 'chromium' ? [...base, ...GEN.map((t) => [t, t])] : [...base, ['spotify', 'spotify']]
    let n = 0
    for (const [name, theme] of CONF) for (const dark of [false, true]) {
      await go(page, { theme, dark, motion: 'reduce' })
      let m
      try { m = await measure() } catch (e) { ok(false, tag(`${name} ${dark ? 'oscuro' : 'claro'}: contraste no medible (${e.message.split('\n')[0]})`)); continue }
      n++
      for (const c of m) ok(c.r >= c.min, tag(`${name} ${dark ? 'oscuro' : 'claro'}: ${c.k} ${c.r}:1 < ${c.min}`))
      for (const c of m) worst[c.k] = Math.min(worst[c.k] ?? 99, c.r)
    }
    note('contraste mínimo', `${engine} (${n} configuraciones): ` + Object.entries(worst).map(([k, v]) => `${k} ${v}`).join(' · '))
    await ctx.close()
  }

  /* 3 · A · una sola forma, abajo y arriba, por defecto, oscuro, Tema de prueba y auditoría */
  const shape = (page, id) => page.evaluate(`(() => { const { parse, px, root } = ${L}; const r = root('${id}'); const ctl = r.querySelector('.g-input__control').getBoundingClientRect(); const pop = document.getElementById('${id}-popup'); const P = pop.getBoundingClientRect(); const B = pop.querySelector('.g-combobox__popup-body').getBoundingClientRect()
    const cs = getComputedStyle(pop), row = getComputedStyle(r.querySelector('.g-input__row')), cc = getComputedStyle(r.querySelector('.g-input__control')); const inp = document.getElementById('${id}')
    const hit = document.elementFromPoint(ctl.left + ctl.width / 2, ctl.top + ctl.height / 2)
    const t = document.createElement('i'); t.style.color = 'var(--_focus)'; r.querySelector('.g-input__control').append(t); const focus = getComputedStyle(t).color; t.remove()
    return { ctl: { l: ctl.left, t: ctl.top, w: ctl.width, b: ctl.bottom }, P: { l: P.left, t: P.top, w: P.width, b: P.bottom }, B: { t: B.top, b: B.bottom }, up: r.classList.contains('is-up'),
      outline: cs.outlineStyle, ow: parseFloat(cs.outlineWidth), oc: cs.outlineColor, focus, fw: px('--g-focus-width'), bw: px('--g-border-width'), shadow: cs.boxShadow, rowA: row.outlineStyle === 'none' ? 0 : parse(row.outlineColor)[3], ctlBorderA: cc.borderImageSource !== 'none' && (cc.borderImageSource.includes('transparent') || cc.borderImageSource.includes('rgba(0, 0, 0, 0)')) ? 0 : parse(cc.borderTopColor)[3], ctlShadow: cc.boxShadow,
      hit: hit === inp || inp.contains(hit), open: r.classList.contains('is-open') } })()`)
  if (run('shape')) {
    const { ctx, page } = await mk()
    for (const [theme, dark] of [['', false], ['', true], ['test', false], ['audit', false], ['audit', true]]) {
      await go(page, { theme, dark })
      const t = (x) => tag(`${theme || 'defecto'}${dark ? ' oscuro' : ''} A: ${x}`)
      await center(page, 'cb-dx')
      const pre = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, y: scrollY, t: document.getElementById('cb-dx').closest('.g-input__control').getBoundingClientRect().top }))
      await page.click('#cb-dx'); await page.keyboard.type('dia', { delay: 25 }); await settle(page, 600)
      const s = await shape(page, 'cb-dx')
      ok(s.open && !s.up, t('no abre hacia abajo en el centro'))
      ok(Math.abs(s.P.l - s.ctl.l) < 1 && Math.abs(s.P.t - s.ctl.t) < 1 && Math.abs(s.P.w - s.ctl.w) < 1, t(`Δ caja–forma (${(s.P.l - s.ctl.l).toFixed(2)}, ${(s.P.t - s.ctl.t).toFixed(2)}, ${(s.P.w - s.ctl.w).toFixed(2)})`))
      const seam = s.B.t - (s.ctl.b - s.bw)
      ok(Math.abs(seam) < 1.5, t(`costura ${seam.toFixed(2)}px`))
      note('A costura (px)', `${engine} ${theme || 'defecto'}${dark ? ' oscuro' : ''} abajo ${seam.toFixed(2)}`)
      ok(s.outline === 'solid' && Math.abs(s.ow - s.fw) < 0.1 && s.oc === s.focus, t(`anillo ${s.outline} ${s.ow} ${s.oc} ≠ ${s.focus}`))
      ok(s.rowA === 0 && s.ctlBorderA === 0 && s.shadow !== 'none' && s.ctlShadow === 'none', t('la caja conserva anillo, contorno o sombra ' + JSON.stringify({ rowA: s.rowA, ctlBorderA: s.ctlBorderA, shadow: s.shadow, ctlShadow: s.ctlShadow })))
      ok(s.hit, t('el punto central del campo no es el <input>'))
      const clip = { x: Math.floor(s.ctl.l + s.bw - s.fw / 2 - 0.5), y: Math.ceil(s.P.t + 12), width: 1, height: Math.floor(s.P.b - s.P.t - 24) }
      const img = png(await page.screenshot({ clip }))
      const fc = await page.evaluate(`(${lib.toString()})().parse('${s.focus}')`)
      let breaks = 0
      for (let y = 0; y < img.h; y++) { const p = img.px(0, y); if (Math.abs(p[0] - fc[0]) + Math.abs(p[1] - fc[1]) + Math.abs(p[2] - fc[2]) > 90) breaks++ }
      ok(breaks === 0, t(`el anillo se corta en ${breaks} de ${img.h} px`))
      const post = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, y: scrollY, t: document.getElementById('cb-dx').closest('.g-input__control').getBoundingClientRect().top }))
      ok(Math.abs(post.h - pre.h) < 1 && Math.abs(post.t - pre.t) < 0.5 && post.y === pre.y, t(`abrir mueve algo (alto ${pre.h}→${post.h}, campo ${pre.t}→${post.t}, scroll ${pre.y}→${post.y})`))
      await close(page)
      // Hacia arriba: la caja a 60px del pie del visor
      await page.evaluate(() => { const c = document.getElementById('cb-dx').closest('.g-input__control'); scrollBy(0, c.getBoundingClientRect().bottom - innerHeight + 60) })
      await page.click('#cb-dx'); await page.keyboard.type('dia', { delay: 25 }); await settle(page, 600)
      const u = await shape(page, 'cb-dx')
      ok(u.up, t('al pie no abre hacia arriba'))
      ok(Math.abs(u.P.l - u.ctl.l) < 1 && Math.abs(u.P.b - u.ctl.b) < 1 && Math.abs(u.P.w - u.ctl.w) < 1, t(`arriba: Δ caja–forma (${(u.P.b - u.ctl.b).toFixed(2)})`))
      const seamUp = (u.ctl.t + u.bw) - u.B.b
      ok(Math.abs(seamUp) < 1.5 && u.outline === 'solid' && u.hit, t(`arriba: costura ${seamUp.toFixed(2)}px, anillo o punto central`))
      note('A costura (px)', `${engine} ${theme || 'defecto'}${dark ? ' oscuro' : ''} arriba ${seamUp.toFixed(2)}`)
      await close(page)
    }
    // rounded pill del tema del playground: la forma con el radio de medio alto
    await ctx.close()
  }

  /* 4 · Fantasma alineado al píxel (DPR 2), LTR y RTL */
  if (run('ghost')) {
    for (const dir of ['', 'rtl']) {
      const { ctx, page } = await mk({ dpr: 2 })
      await go(page, { dir, motion: 'reduce' })
      await openWith(page, 'cb-pac', 'mar', 400)
      const g = await page.evaluate(`(() => { const { root } = ${L}; const r = root('cb-pac'); const cell = r.querySelector('.g-combobox__value').getBoundingClientRect(); const inp = document.getElementById('cb-pac').getBoundingClientRect(); const ty = r.querySelector('.g-combobox__ghost-typed').getBoundingClientRect(); const gs = getComputedStyle(r.querySelector('.g-combobox__ghost')), is = getComputedStyle(document.getElementById('cb-pac'))
        return { cell: { x: cell.left, y: cell.top, w: cell.width, h: cell.height }, inp: { l: inp.left, r: inp.right }, ty: { l: ty.left, r: ty.right }, font: [gs.fontFamily === is.fontFamily, gs.fontSize === is.fontSize, gs.fontWeight === is.fontWeight, gs.letterSpacing === is.letterSpacing], pe: gs.pointerEvents, hidden: r.querySelector('.g-combobox__ghost').getAttribute('aria-hidden') } })()`)
      const t = (x) => tag(`fantasma ${dir || 'ltr'}: ${x}`)
      ok(g.font.every(Boolean) && g.pe === 'none' && g.hidden === 'true', t('tipografía, puntero o aria-hidden ' + g.font))
      ok(Math.abs(g.ty.l - g.inp.l) <= 0.5, t(`inicio de lo tecleado Δ ${(g.ty.l - g.inp.l).toFixed(2)}px`))
      const clip = { x: g.cell.x, y: g.cell.y + 3, width: g.cell.w, height: g.cell.h - 6 }
      await page.evaluate(() => { const s = document.createElement('style'); s.id = 'probe'; s.textContent = '.g-combobox__ghost-typed{visibility:visible!important;color:var(--g-color-text)!important}.g-combobox__ghost-rest{visibility:hidden!important}#cb-pac{color:transparent!important;caret-color:transparent!important}'; document.head.append(s) })
      await page.waitForTimeout(150)
      const a = ink(png(await page.screenshot({ clip })))
      await page.evaluate(() => { document.getElementById('probe').textContent = '.g-combobox__ghost{visibility:hidden!important}#cb-pac{caret-color:transparent!important}' })
      await page.waitForTimeout(150)
      const b = ink(png(await page.screenshot({ clip })))
      const d = [a.x0 - b.x0, a.y0 - b.y0, a.x1 - b.x1, a.y1 - b.y1].map((v) => v / 2)
      ok(a.x1 > 0 && b.x1 > 0 && d.every((v) => Math.abs(v) <= 0.5), t(`tinta Δ ${d.join(', ')} px`))
      note('fantasma: Δ de tinta frente al <input> (px CSS)', `${engine} ${dir || 'ltr'} ${d.join(' ')}`)
      await ctx.close()
    }
  }

  /* 5 · C · Δ0 de alto con ficha (frente a GInput en la misma fila y frente al campo vacío), recorte, seleccionada */
  if (run('token')) {
    const { ctx, page } = await mk()
    for (const theme of ['', 'test', 'audit']) {
      await go(page, { theme, motion: 'reduce' })
      const h = await page.evaluate(() => {
        const H = (id) => document.getElementById(id).closest('.g-input__control').getBoundingClientRect()
        const r = document.getElementById('cb-f-pac').closest('.g-combobox'), tk = r.querySelector('.g-combobox__token').getBoundingClientRect(), c = H('cb-f-pac')
        const empty = H('cb-dx').height
        window.__cb.dx = 'E11.9'
        return new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => {
          const r2 = document.getElementById('cb-dx').closest('.g-combobox'), c2 = H('cb-dx'), t2 = r2.querySelector('.g-combobox__token').getBoundingClientRect()
          res({ row: c.height - H('cb-f-nota').height, rowTop: c.top - H('cb-f-nota').top, center: (tk.top + tk.height / 2) - (c.top + c.height / 2), inside: tk.top >= c.top && tk.bottom <= c.bottom, dEmpty: c2.height - empty, center2: (t2.top + t2.height / 2) - (c2.top + c2.height / 2), color: getComputedStyle(document.getElementById('cb-dx')).color, token: r2.classList.contains('is-token') })
        })))
      })
      const t = (x) => tag(`${theme || 'defecto'} C: ${x}`)
      ok(Math.abs(h.row) < 0.5 && Math.abs(h.rowTop) < 0.5, t(`con ficha en la fila Δ alto ${h.row.toFixed(2)}, Δ arriba ${h.rowTop.toFixed(2)} frente a GInput`))
      ok(h.token && Math.abs(h.dEmpty) < 0.5, t(`vacío → ficha Δ alto ${h.dEmpty.toFixed(2)}`))
      ok(Math.abs(h.center) <= 0.5 && Math.abs(h.center2) <= 0.5 && h.inside, t(`ficha descentrada ${h.center.toFixed(2)} / ${h.center2.toFixed(2)}`))
      ok(/rgba\(0, 0, 0, 0\)|transparent/.test(h.color), t('el texto del <input> se ve bajo la ficha ' + h.color))
      note('C Δ0 (px)', `${engine} ${theme || 'defecto'}: fila ${h.row.toFixed(2)} · vacío→ficha ${h.dEmpty.toFixed(2)} · centrado ${h.center.toFixed(2)}`)
      // Recorte: el dato secundario (capítulo) se recorta antes que la etiqueta; nada sale de la caja
      const sw = await page.evaluate(() => { const r = document.getElementById('cb-dx').closest('.g-combobox'); const lab = r.querySelector('.g-combobox__token .g-summary__title'), meta = r.querySelector('.g-combobox__token .g-summary__subtitle'), tk = r.querySelector('.g-combobox__token'); const res = []
        for (let w = 760; w >= 150; w -= 10) { r.style.inlineSize = w + 'px'; const c = r.querySelector('.g-input__control').getBoundingClientRect(), T = tk.getBoundingClientRect(); res.push({ w, lc: lab.scrollWidth > lab.clientWidth + 1, mc: meta.scrollWidth > meta.clientWidth + 1, mw: meta.getBoundingClientRect().width, out: T.right > c.right + 0.5 || T.left < c.left - 0.5 }) }
        r.style.inlineSize = ''; return res })
      ok(sw.every((x) => !(x.lc && x.mw > 1)) && sw.some((x) => x.mc && !x.lc) && sw.every((x) => !x.out), t('recorte: la etiqueta se recorta antes que el secundario o la ficha sale de la caja ' + JSON.stringify(sw.find((x) => (x.lc && x.mw > 1) || x.out))))
      note('C recorte', `${engine} ${theme || 'defecto'}: secundario desde ${sw.find((x) => x.mc)?.w}px, etiqueta desde ${sw.find((x) => x.lc)?.w}px`)
      await page.evaluate(() => { window.__cb.dx = null })
    }
    // Seleccionada con el foco
    await go(page, { motion: 'reduce' })
    await center(page, 'cb-f-pac'); await page.focus('#cb-f-pac'); await settle(page, 200)
    const sel = await page.evaluate(`(() => { const { root, tok } = ${L}; return [getComputedStyle(root('cb-f-pac').querySelector('.g-combobox__token')).backgroundColor, tok('--g-color-selection', 'backgroundColor')] })()`)
    ok(sel[0] === sel[1], tag(`C: con el foco la ficha no se ve seleccionada (${sel})`))
    // A 320px de visor la ficha de la fila de formulario no sale de su caja
    await ctx.close()
  }

  /* 6 · Fichas de opción a 240 / 320 / 480 de campo (reporte del usuario 1) y en la hoja */
  const fichas = (page, sel) => page.evaluate(`(() => { const { px } = ${L}; const host = document.querySelector('${sel}'); const lim = px('--g-text-body-line') + px('--g-text-body-sm-line') + 0.5; const bad = []; let maxH = 0, n = 0, vis = []
    for (const o of host.querySelectorAll('.g-combobox__option:not(.g-combobox__action)')) { n++
      const R = o.getBoundingClientRect(), main = o.querySelector('.g-summary'), mh = main.getBoundingClientRect().height; maxH = Math.max(maxH, mh)
      if (mh > lim) bad.push('más de dos líneas ' + mh)
      if (o.scrollWidth > o.clientWidth + 0.5 || main.scrollWidth > main.clientWidth + 0.5) bad.push('desborda ' + main.scrollWidth + '/' + main.clientWidth)
      // Lo que se ve de cada hijo: su caja recortada por los antepasados con overflow (un dato que saltó a la línea que no se
      // ve de la corriente puede ser más ancho que ella, pero no se pinta)
      const seen = (k) => { let l = k.getBoundingClientRect().left, r = k.getBoundingClientRect().right, t = k.getBoundingClientRect().top, b = k.getBoundingClientRect().bottom
        for (let n = k.parentElement; n && n !== o; n = n.parentElement) { if (getComputedStyle(n).overflowX !== 'visible') { const c = n.getBoundingClientRect(); l = Math.max(l, c.left); r = Math.min(r, c.right); t = Math.max(t, c.top); b = Math.min(b, c.bottom) } }
        return r - l > 0.5 && b - t > 0.5 ? { l, r } : null }
      for (const k of o.querySelectorAll('*')) { const r = seen(k); if (r && (r.r > R.right + 0.5 || r.l < R.left - 0.5)) { bad.push('hijo fuera ' + k.className); break } }
      // GSummary row (#356): el identificador (is-anchor) va en la corriente, fuera de __facts; los demás en __facts (una
      // línea, los que no caben saltan a una segunda que no se ve). Visible = dentro de la caja de la corriente (__data)
      const fs = o.querySelector('.g-summary__data'), f = o.querySelector('.g-summary__fact.is-anchor')
      if (f) { const a = f.getBoundingClientRect(), b = fs.getBoundingClientRect(); if (!(a.top >= b.top - 0.5 && a.bottom <= b.bottom + 0.5 && a.width > 0) || f.scrollWidth > f.clientWidth + 0.5) bad.push('identificador oculto o recortado'); vis.push([...o.querySelectorAll('.g-summary__fact')].filter((x) => x.getBoundingClientRect().top < b.bottom - 0.5).length) }
      for (const x of o.querySelectorAll('.g-summary__fact')) { const a = x.getBoundingClientRect(), b = fs.getBoundingClientRect(); if (a.top < b.bottom - 0.5 && a.bottom <= b.bottom + 0.5 && x.scrollWidth > x.clientWidth + 0.5 && x !== f) bad.push('dato visible partido') }
    }
    return { n, maxH: +maxH.toFixed(1), lim, bad: [...new Set(bad)], vis: [Math.min(...vis), Math.max(...vis)] } })()`)
  if (run('fichas')) {
    const { ctx, page } = await mk()
    for (const theme of ['', 'audit']) {
      await go(page, { theme, motion: 'reduce' })
      for (const w of [240, 320, 480]) {
        await page.evaluate((w) => { document.getElementById('cb-pac').closest('.g-combobox').style.inlineSize = w + 'px' }, w)
        await openWith(page, 'cb-pac', 'mar', 300)
        const res = await fichas(page, '#cb-pac-popup')
        ok(res.n > 0 && !res.bad.length, tag(`${theme || 'defecto'} fichas a ${w}px: ${res.bad.join(' · ')}`))
        note('fichas de opción (campo → alto nombre+datos, datos visibles min–máx de 4)', `${engine} ${theme || 'defecto'} ${w}px: ${res.maxH}px ≤ ${res.lim.toFixed(1)}, ${res.vis.join('–')} de 4`)
        // La ficha del valor elegida a ese ancho no sale de la caja
        await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await settle(page, 200)
        const tk = await page.evaluate(() => { const r = document.getElementById('cb-pac').closest('.g-combobox'); const c = r.querySelector('.g-input__control').getBoundingClientRect(); const t = r.querySelector('.g-combobox__token'); if (!t) return { none: true }; const T = t.getBoundingClientRect(); return { inside: T.right <= c.right + 0.5 && T.left >= c.left - 0.5, lab: r.querySelector('.g-combobox__token .g-summary__title').getBoundingClientRect().width, su: r.querySelector('.g-combobox__token .g-summary').getBoundingClientRect().width } })
        ok(!tk.none && tk.inside && tk.lab > 20 && tk.su > 40, tag(`${theme || 'defecto'} ficha del valor a ${w}px: ${JSON.stringify(tk)}`))
        note('ficha del valor (ancho de la ficha · de la etiqueta)', `${engine} ${theme || 'defecto'} ${w}px: ${tk.su?.toFixed(0)} · ${tk.lab?.toFixed(0)}px`)
        await page.evaluate(() => { window.__cb.pac.value = null; document.activeElement.blur(); document.getElementById('cb-pac').closest('.g-combobox').style.inlineSize = '' })
        await settle(page, 100)
      }
    }
    await ctx.close()
  }

  /* 7 · Puntero real sobre las opciones (reporte del usuario 2): una superficie por cuadro, la lista no se desplaza sola,
         la forma no se recoloca; también al rozar la fila cortada del pie y con la rueda dentro del panel */
  if (run('pointer')) {
    const { ctx, page } = await mk()
    for (const motion of ['no-preference', 'reduce']) {
      await go(page, { motion })
      await openWith(page, 'cb-pac', 'mar', 600)
      const rec = () => page.evaluate(() => { window.__fr = []; window.__run = true; const pop = document.getElementById('cb-pac-popup'), panel = pop.querySelector('.g-combobox__panel')
        ;(function f() { let n = 0; for (const o of pop.querySelectorAll('.g-combobox__option')) { const cs = getComputedStyle(o); const bc = cs.borderTopColor.match(/[\d.]+/g).map(Number); if ((bc.length > 3 ? bc[3] : 1) > 0.05 || cs.boxShadow !== 'none') n++ }
          const P = pop.getBoundingClientRect(); window.__fr.push({ n, st: panel.scrollTop, top: P.top, h: P.height, act: (pop.querySelector('.is-active') || {}).id || '' }); if (window.__run) requestAnimationFrame(f) })() })
      const stop = () => page.evaluate(() => { window.__run = false; return window.__fr })
      const rows = await page.evaluate(() => { const panel = document.querySelector('#cb-pac-popup .g-combobox__panel').getBoundingClientRect(); return [...document.querySelectorAll('#cb-pac-popup .g-combobox__option')].map((o) => { const b = o.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, top: b.top, bottom: b.bottom, cut: b.bottom > panel.bottom + 0.5 && b.top < panel.bottom } }).concat([{ panelBottom: panel.bottom, panelTop: panel.top }]) })
      const meta = rows.pop()
      const visible = rows.filter((r) => r.bottom <= meta.panelBottom + 0.5 && r.top >= meta.panelTop - 0.5)
      const cut = rows.find((r) => r.cut)
      await rec()
      for (const p of visible) await page.mouse.move(p.x, p.y, { steps: 8 })
      if (cut) await page.mouse.move(cut.x, Math.min(cut.y, meta.panelBottom - 4), { steps: 8 }) // la fila cortada del pie
      for (const p of [...visible].reverse()) await page.mouse.move(p.x, p.y, { steps: 8 })
      await page.waitForTimeout(150)
      const fr = await stop()
      const t = (x) => tag(`${motion} puntero: ${x}`)
      ok(Math.max(...fr.map((x) => x.n)) <= 1, t(`hasta ${Math.max(...fr.map((x) => x.n))} superficies resaltadas en un cuadro`))
      ok(new Set(fr.map((x) => x.st)).size === 1, t(`la lista se desplaza sola con el puntero (scrollTop ${[...new Set(fr.map((x) => x.st))]})`))
      ok(new Set(fr.map((x) => Math.round(x.top) + ',' + Math.round(x.h))).size === 1, t('la forma se recoloca al mover el puntero ' + [...new Set(fr.map((x) => Math.round(x.top) + ',' + Math.round(x.h)))]))
      const acts = fr.map((x) => x.act).filter((v, i, a) => i === 0 || v !== a[i - 1])
      ok(acts.length >= visible.length, t(`la activa no sigue al puntero (${acts.length} cambios para ${visible.length} filas)`))
      note('puntero real', `${engine} ${motion}: ${fr.length} cuadros, máx. ${Math.max(...fr.map((x) => x.n))} superficie resaltada, scrollTop constante, forma quieta, ${visible.length} filas + la cortada del pie (${cut ? 'sí' : 'no hay'})`)
      // Rueda dentro del panel con el puntero quieto encima: la lista se desplaza lo que pide la rueda, la forma no
      await rec()
      const mid = visible[Math.floor(visible.length / 2)]
      await page.mouse.move(mid.x, mid.y)
      for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 60); await page.waitForTimeout(40) }
      await page.waitForTimeout(250)
      const fw = await stop()
      const sts = fw.map((x) => x.st)
      const back = sts.some((v, i) => i && v < sts[i - 1] - 0.5)
      ok(!back && sts[sts.length - 1] > sts[0], t(`rueda en el panel: retrocede o no avanza (${sts[0]} → ${sts[sts.length - 1]})`))
      ok(Math.max(...fw.map((x) => x.n)) <= 1 && new Set(fw.map((x) => Math.round(x.top) + ',' + Math.round(x.h))).size === 1, t('rueda en el panel: dos resaltadas o la forma se mueve'))
      const pageY = await page.evaluate(() => scrollY)
      note('rueda dentro del panel', `${engine} ${motion}: scrollTop ${sts[0]} → ${sts[sts.length - 1]} sin retroceso; página quieta (${pageY})`)
      await close(page)
    }
    await ctx.close()
  }

  /* 8 · Desplazamiento real de la página con la forma abierta (reporte del usuario 2): forma intacta en cada cuadro, sin
         «respirar», un solo cambio de lado, cierre al salir del visor */
  if (run('scroll')) {
    const { ctx, page } = await mk()
    for (const theme of ['', 'audit']) {
      await go(page, { theme })
      // El campo en el tercio superior: abre abajo. La rueda (sobre la página, fuera de la forma) lo lleva hacia el pie
      await page.evaluate(() => { const c = document.getElementById('cb-dx').closest('.g-input__control'); scrollBy(0, c.getBoundingClientRect().top - 220) })
      await page.click('#cb-dx'); await page.keyboard.type('a', { delay: 25 }); await settle(page, 600)
      // Se mide en un cuadro pedido DESPUÉS del de GCombobox (escucha de scroll registrada tras abrir): es lo que se pinta en
      // ese cuadro. Un bucle rAF propio, pedido antes, leería la posición anterior a la del componente
      await page.evaluate(() => { window.__fr = []; window.__run = true; let pend = false; const r = document.getElementById('cb-dx').closest('.g-combobox'), pop = document.getElementById('cb-dx-popup'), panel = pop.querySelector('.g-combobox__panel')
        addEventListener('scroll', () => { if (pend || !window.__run) return; pend = true; requestAnimationFrame(() => { pend = false; f() }) }, true)
        function f() { const c = r.querySelector('.g-input__control').getBoundingClientRect(), P = pop.getBoundingClientRect(), up = r.classList.contains('is-up'), open = pop.matches(':popover-open') && getComputedStyle(pop).display !== 'none', cs = getComputedStyle(pop)
          window.__fr.push({ open, up, okShape: !open || (Math.abs(P.left - c.left) < 1 && Math.abs(P.width - c.width) < 1 && (up ? Math.abs(P.bottom - c.bottom) < 1 : Math.abs(P.top - c.top) < 1) && cs.outlineStyle === 'solid'), ph: panel.clientHeight, max: pop.style.getPropertyValue('--_max'), ctop: c.top, inView: c.bottom > 0 && c.top < innerHeight }) } })
      const box = await page.evaluate(() => { const P = document.getElementById('cb-dx-popup').getBoundingClientRect(); return { x: Math.min(innerWidth - 40, P.right + 120), y: 120 } })
      await page.mouse.move(box.x, box.y)
      for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, -40); await page.waitForTimeout(30) }
      await page.waitForTimeout(300)
      const fr = await page.evaluate(() => { window.__run = false; return window.__fr })
      const openF = fr.filter((x) => x.open)
      const broken = openF.filter((x) => !x.okShape).length
      let flips = 0, breathe = 0
      for (let i = 1; i < fr.length; i++) {
        if (fr[i].open && fr[i - 1].open && fr[i].up !== fr[i - 1].up) flips++
        else if (fr[i].open && fr[i - 1].open && Math.abs(fr[i].ph - fr[i - 1].ph) > 0.5) breathe++
      }
      const closedOut = fr.some((x) => !x.inView) ? fr.filter((x) => !x.inView).every((x) => !x.open) : null
      const t = (x) => tag(`${theme || 'defecto'} rueda sobre la página: ${x}`)
      ok(openF.length > 8 && broken === 0, t(`${broken} cuadros con la forma rota de ${openF.length}`))
      ok(flips <= 1, t(`${flips} cambios de lado (máximo 1)`))
      ok(breathe === 0, t(`el panel cambia de alto en ${breathe} cuadros sin cambio de lado («respira»)`))
      ok(closedOut !== false, t('la forma sigue abierta con la caja fuera del visor'))
      note('desplazamiento real de la página', `${engine} ${theme || 'defecto'}: ${openF.length} cuadros abiertos, ${broken} rotos, ${flips} cambio(s) de lado, ${breathe} cambios de alto sin cambio de lado, ${closedOut === null ? 'la caja no salió' : 'se cerró al salir'}`)
      await close(page)
    }
    await ctx.close()
  }

  /* 9 · Abrir y cerrar rápido: nunca un cuadro sin contorno (la caja sin borde y la forma sin pintar) ni sin anillo con el foco */
  if (run('toggle')) {
    const { ctx, page } = await mk()
    await go(page)
    await center(page, 'cb-dx')
    await page.focus('#cb-dx')
    await settle(page, 300) // el anillo de GInput entra fundiéndose al recibir el foco (--g-duration-fast): se mide desde el reposo
    await page.evaluate(() => { window.__fr = []; window.__run = true; const r = document.getElementById('cb-dx').closest('.g-combobox'), pop = document.getElementById('cb-dx-popup'), inp = document.getElementById('cb-dx')
      const a = (s) => { const m = s.match(/[\d.]+/g); return m ? (m.length > 3 ? +m[3] : 1) : 0 }
      ;(function f() { const cc = getComputedStyle(r.querySelector('.g-input__control')), row = getComputedStyle(r.querySelector('.g-input__row')), ps = getComputedStyle(pop), shown = pop.matches(':popover-open') && ps.display !== 'none'
        const border = a(cc.borderTopColor) > 0.05 || (shown && a(ps.borderTopColor) > 0.05)
        const ring = document.activeElement !== inp || (row.outlineStyle !== 'none' && a(row.outlineColor) > 0.05) || (shown && ps.outlineStyle === 'solid' && a(ps.outlineColor) > 0.05) || cc.boxShadow !== 'none'
        window.__fr.push({ border, ring, shown, open: r.classList.contains('is-open'), rs: row.outlineStyle, rc: row.outlineColor, po: ps.outlineStyle + ' ' + ps.outlineColor, fv: inp.matches(':focus-visible'), act: document.activeElement === inp, v: inp.value }); if (window.__run) requestAnimationFrame(f) })() })
    const arrow = await page.evaluate(() => { const b = document.getElementById('cb-dx').closest('.g-combobox').querySelector('.g-combobox__arrow').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } })
    for (let i = 0; i < 8; i++) { await page.mouse.click(arrow.x, arrow.y); await page.waitForTimeout(35 + (i % 3) * 30) }
    for (const k of ['d', 'Escape', 'i', 'Escape', 'Escape', 'a', 'Backspace', 'Backspace']) { await page.keyboard.press(k); await page.waitForTimeout(40) }
    await page.waitForTimeout(400)
    const fr = await page.evaluate(() => { window.__run = false; return window.__fr })
    const noBorder = fr.filter((x) => !x.border).length, noRing = fr.filter((x) => !x.ring).length
    ok(noBorder === 0, tag(`abrir/cerrar rápido: ${noBorder} cuadros sin contorno de ${fr.length}`))
    ok(noRing === 0, tag(`abrir/cerrar rápido: ${noRing} cuadros sin anillo con el foco de ${fr.length}`))
    if (args.verbose) fr.forEach((x, i) => { if (!x.ring || !x.border || (fr[i - 1] && !fr[i - 1].ring)) console.log('toggle', i, JSON.stringify(x), JSON.stringify(fr[i - 1])) })
    note('abrir y cerrar rápido (8 clics en la flecha + teclas)', `${engine}: ${fr.length} cuadros, ${fr.filter((x) => x.shown).length} con la forma; sin contorno ${noBorder}, sin anillo ${noRing}`)
    await ctx.close()
  }

  /* 10 · Escribir mientras llegan los resultados (red simulada con sus tiempos reales: 380 ms y antirrebote 250 ms) */
  if (run('typing')) {
    const { ctx, page } = await mk()
    await go(page, { fast: false })
    await center(page, 'cb-pac')
    await page.click('#cb-pac')
    await page.evaluate(() => { window.__fr = []; window.__run = true; const pop = document.getElementById('cb-pac-popup'), r = document.getElementById('cb-pac').closest('.g-combobox')
      ;(function f() { const shown = pop.matches(':popover-open') && getComputedStyle(pop).display !== 'none', list = document.getElementById('cb-pac-list'), body = pop.querySelector('.g-combobox__popup-body')
        window.__fr.push({ t: performance.now(), shown, h: shown ? body.getBoundingClientRect().height : 0, rows: list && !list.hidden ? list.querySelectorAll('.g-combobox__option:not(.g-combobox__action)').length : 0, busy: list ? list.getAttribute('aria-busy') : null, ghost: Boolean(r.querySelector('.g-combobox__ghost-rest')), st: (document.getElementById('cb-pac-status') || {}).className || '' })
        if (window.__run) requestAnimationFrame(f) })() })
    for (const [s, gap] of [['m', 160], ['a', 140], ['r', 600], ['í', 120], ['a', 120], [' ', 500], ['g', 150], ['a', 900], ['Backspace', 130], ['Backspace', 700]]) {
      if (s.length > 1) await page.keyboard.press(s); else await page.keyboard.type(s)
      await page.waitForTimeout(gap)
    }
    await page.waitForTimeout(900)
    const fr = await page.evaluate(() => { window.__run = false; return window.__fr })
    // Parpadeo a vacío: con filas a la vista, un tramo sin filas (< 300 ms) que vuelve a tenerlas
    let blinks = 0, ghostBlinks = 0, dips = 0
    const seg = (key) => { const out = []; let cur = null; for (const x of fr) { const v = key(x); if (!cur || cur.v !== v) { cur = { v, t0: x.t, t1: x.t }; out.push(cur) } else cur.t1 = x.t } return out }
    const rs = seg((x) => x.shown && x.rows > 0)
    for (let i = 1; i < rs.length - 1; i++) if (!rs[i].v && rs[i - 1].v && rs[i + 1].v && rs[i].t1 - rs[i].t0 < 300) blinks++
    const gs = seg((x) => x.ghost)
    for (let i = 1; i < gs.length - 1; i++) if (!gs[i].v && gs[i - 1].v && gs[i + 1].v && gs[i].t1 - gs[i].t0 < 200) ghostBlinks++
    const hs = seg((x) => Math.round(x.h))
    for (let i = 1; i < hs.length - 1; i++) if (hs[i].v < hs[i - 1].v - 4 && hs[i + 1].v > hs[i].v + 4 && hs[i].t1 - hs[i].t0 < 250 && hs[i].v > 0) dips++
    const hidden = fr.filter((x, i) => i && fr[i - 1].shown && !x.shown).length
    ok(blinks === 0, tag(`escribir con la red real: la lista parpadea a vacío ${blinks} veces`))
    ok(ghostBlinks === 0, tag(`escribir con la red real: el fantasma parpadea ${ghostBlinks} veces`))
    ok(dips === 0, tag(`escribir con la red real: el panel encoge y vuelve ${dips} veces en < 250 ms`))
    note('escribir mientras llegan los resultados (red simulada real)', `${engine}: ${fr.length} cuadros; parpadeos de la lista ${blinks}, del fantasma ${ghostBlinks}, encoge-y-vuelve ${dips}, la forma se oculta ${hidden} vez/veces; alturas ${[...new Set(hs.map((x) => x.v))].slice(0, 8).join(' → ')}`)
    await close(page)
    await ctx.close()
  }

  /* 11 · «Mostrar más»: las filas que se ven no se mueven, el panel no salta y la activa va a la primera nueva */
  if (run('more')) {
    const { ctx, page } = await mk()
    await go(page)
    await openWith(page, 'cb-pac', 'ma', 500)
    await page.evaluate(() => { const p = document.querySelector('#cb-pac-popup .g-combobox__panel'); p.scrollTop = p.scrollHeight })
    await settle(page, 150)
    const before = await page.evaluate(() => { const p = document.querySelector('#cb-pac-popup .g-combobox__panel'); const P = p.getBoundingClientRect(); const rows = [...p.querySelectorAll('.g-combobox__option:not(.g-combobox__action)')].filter((o) => { const b = o.getBoundingClientRect(); return b.bottom > P.top && b.top < P.bottom }); const more = p.querySelector('.g-combobox__action--more'); const m = more && more.getBoundingClientRect(); return { n: p.querySelectorAll('.g-combobox__option:not(.g-combobox__action)').length, ids: rows.map((o) => [o.id, o.getBoundingClientRect().top]), more: m ? { x: m.left + m.width / 2, y: m.top + m.height / 2 } : null, ph: p.clientHeight, pop: document.getElementById('cb-pac-popup').getBoundingClientRect().top } })
    ok(before.more, tag('«Mostrar más»: no aparece con «ma»'))
    if (before.more) {
      await page.mouse.move(before.more.x, before.more.y, { steps: 4 })
      await page.evaluate(() => { window.__fr = []; window.__run = true; const p = document.querySelector('#cb-pac-popup .g-combobox__panel'), pop = document.getElementById('cb-pac-popup'); (function f() { window.__fr.push({ ph: p.clientHeight, top: pop.getBoundingClientRect().top, st: p.scrollTop }); if (window.__run) requestAnimationFrame(f) })() })
      await page.mouse.click(before.more.x, before.more.y)
      await page.waitForFunction((n) => document.querySelectorAll('#cb-pac-popup .g-combobox__option:not(.g-combobox__action)').length > n, before.n, { timeout: 4000 }).catch(() => {})
      await settle(page, 300)
      const after = await page.evaluate((ids) => { const fr = (window.__run = false, window.__fr); return { n: document.querySelectorAll('#cb-pac-popup .g-combobox__option:not(.g-combobox__action)').length, moved: ids.map(([id, t]) => Math.abs(document.getElementById(id).getBoundingClientRect().top - t)), act: (document.querySelector('#cb-pac-popup .is-active') || {}).id, ph: [...new Set(fr.map((x) => x.ph))], top: [...new Set(fr.map((x) => Math.round(x.top)))] } }, before.ids)
      const firstNew = await page.evaluate((n) => document.querySelectorAll('#cb-pac-popup .g-combobox__option:not(.g-combobox__action)')[n]?.id, before.n)
      ok(after.n > before.n, tag(`«Mostrar más»: no llegan filas (${before.n} → ${after.n})`))
      // Las que se veían: o no se mueven, o el panel se desplazó para enseñar la primera nueva (se permite: lo pide el contrato)
      ok(after.ph.length === 1 && after.top.length === 1, tag(`«Mostrar más»: el panel cambia de alto o la forma se mueve (${after.ph} / ${after.top})`))
      ok(after.act === firstNew, tag(`«Mostrar más»: la activa no es la primera nueva (${after.act} ≠ ${firstNew})`))
      note('«Mostrar más»', `${engine}: ${before.n} → ${after.n} filas; alto del panel ${after.ph.join('/')}px constante; forma quieta; filas vistas movidas ${Math.max(...after.moved).toFixed(1)}px (desplazamiento hacia la primera nueva)`)
    }
    await close(page)
    await ctx.close()
  }

  /* 12 · Llegada de la ficha desde la fila más lejana (puntero real): vector, rebase ≤ space × 2, termina en 0, se retira */
  if (run('arrive')) {
    const { ctx, page } = await mk()
    for (const theme of ['', 'audit']) {
      await go(page, { theme })
      await openWith(page, 'cb-pac', 'mar', 600)
      const far = await page.evaluate(() => { const panel = document.querySelector('#cb-pac-popup .g-combobox__panel').getBoundingClientRect(); const rows = [...document.querySelectorAll('#cb-pac-popup .g-combobox__option')].filter((o) => o.getBoundingClientRect().bottom <= panel.bottom); const el = rows[rows.length - 1]; const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } })
      await page.evaluate(() => { window.__arr = null; const r = document.getElementById('cb-pac').closest('.g-combobox'); const mo = new MutationObserver(() => { const t = r.querySelector('.g-combobox__token.is-arriving'); if (t && !window.__arr) { const a = t.getAnimations().find((x) => x.animationName === 'g-combobox-arrive'); if (a) { a.pause(); window.__arr = a } } }); mo.observe(r, { subtree: true, attributes: true, childList: true }) })
      await page.mouse.move(far.x, far.y, { steps: 5 }); await page.mouse.click(far.x, far.y)
      await page.waitForFunction(() => window.__arr, null, { timeout: 3000 }).catch(() => {})
      const tr = await page.evaluate(`(() => { const { px } = ${L}; const a = window.__arr; if (!a) return null; const t = document.getElementById('cb-pac').closest('.g-combobox').querySelector('.g-combobox__token'); const dur = a.effect.getComputedTiming().duration; const out = []
        for (let i = 0; i <= 60; i++) { a.currentTime = dur * i / 60; const v = getComputedStyle(t).translate; const m = v === 'none' ? [0, 0] : v.split(' ').map(parseFloat); out.push([m[0], m[1] ?? 0]) }
        const vy = parseFloat(t.style.getPropertyValue('--_travel-y')), op = getComputedStyle(t).opacity; a.currentTime = 0; a.play(); return { out, vy, s2: px('--g-space-1') * 2, dur, op } })()`)
      const t = (x) => tag(`${theme || 'defecto'} llegada: ${x}`)
      ok(tr, t('no hay animación g-combobox-arrive al elegir con el puntero'))
      if (tr) {
        const ys = tr.out.map((p) => p[1]), sign = Math.sign(tr.vy), want = sign * Math.min(Math.abs(tr.vy), tr.s2 / 0.038)
        ok(Math.abs(ys[0] - want) < 0.6, t(`no parte de la fila acotada (${ys[0]} ≠ ${want})`))
        ok(new Set(ys.slice(1, -1).map((v) => Math.round(v))).size >= 2 && Math.abs(ys[ys.length - 1]) < 0.01, t('sin posiciones intermedias o no termina en 0'))
        const over = Math.max(0, ...ys.map((v) => -sign * v))
        ok(over <= tr.s2 + 0.1, t(`rebase ${over.toFixed(2)}px > space × 2 (${tr.s2})`))
        ok(+tr.op === 1, t(`la ficha no viaja opaca (${tr.op})`))
        note('llegada (puntero real, fila más lejana a la vista)', `${engine} ${theme || 'defecto'}: Δy ${tr.vy.toFixed(1)}px → parte de ${ys[0].toFixed(1)}, rebase ${over.toFixed(2)}px (tope ${tr.s2}px), ${tr.dur}ms`)
      }
      await page.waitForTimeout(900)
      ok(await page.evaluate(() => !document.querySelector('#cb-pac') .closest('.g-combobox').querySelector('.g-combobox__token.is-arriving')), t('is-arriving no se retira'))
      // Ningún vecino se mueve durante la llegada (la ficha va por encima, la caja no cambia)
      await page.evaluate(() => { window.__cb.pac.value = null; document.activeElement.blur() })
    }
    await ctx.close()
  }

  /* 13 · Movimiento reducido: ni despliegue ni giro ni viaje; fundidos sí */
  if (run('reduce')) {
    const { ctx, page } = await mk()
    await go(page, { motion: 'reduce' })
    await center(page, 'cb-pac'); await page.click('#cb-pac')
    const hs = page.evaluate(() => new Promise((res) => { const out = []; const t0 = performance.now(); (function f() { const p = document.getElementById('cb-pac-popup'); out.push(p.matches(':popover-open') && getComputedStyle(p).display !== 'none' ? p.querySelector('.g-combobox__popup-body').getBoundingClientRect().height : -1); if (performance.now() - t0 < 1500) requestAnimationFrame(f); else res(out) })() }))
    await page.keyboard.type('mar', { delay: 25 })
    const H = (await hs).filter((v) => v > 0)
    const fin = H[H.length - 1]
    const mid = H.filter((v) => v > 2 && v < fin - 2 && Math.abs(v - H[0]) > 2)
    // Con reduce el alto pasa de una vez (puede haber un estado intermedio real: «Escribe al menos…» o «Buscando…»)
    ok(new Set(H.map(Math.round)).size <= 4, tag(`reduce: el despliegue anima (${[...new Set(H.map(Math.round))].slice(0, 8)})`))
    const ar = await page.evaluate(() => { const a = getComputedStyle(document.getElementById('cb-pac').closest('.g-combobox').querySelector('.g-combobox__arrow')); return a.transitionProperty + ' ' + a.transitionDuration })
    ok(!/rotate/.test(ar) || /^[^ ]+ 0s/.test(ar), tag('reduce: la flecha gira con transición ' + ar))
    await settle(page, 300)
    const row = await page.evaluate(() => { const b = document.querySelectorAll('#cb-pac-popup .g-combobox__option')[2].getBoundingClientRect(); return { x: b.left + 30, y: b.top + 10 } })
    await page.mouse.click(row.x, row.y); await page.waitForTimeout(60)
    const st = await page.evaluate(() => { const t = document.getElementById('cb-pac').closest('.g-combobox').querySelector('.g-combobox__token'); return t ? { cls: t.classList.contains('is-arriving'), anim: getComputedStyle(t).animationName, tr: getComputedStyle(t).translate } : null })
    ok(st && !st.cls && st.anim === 'none' && (st.tr === 'none' || st.tr === '0px'), tag(`reduce: la ficha viaja ${JSON.stringify(st)}`))
    note('movimiento reducido', `${engine}: alturas al abrir ${[...new Set(H.map(Math.round))].join(' → ')}; flecha sin transición de giro; ficha sin viaje`)
    await ctx.close()
  }

  /* 14 · B · paleta a 1280 (reapertura durante la salida) y hoja arriba a 375 y 320 */
  if (run('surface')) {
    {
      const { ctx, page } = await mk()
      await go(page)
      await center(page, 'cb-pal'); await page.click('#cb-pal'); await settle(page, 500)
      await page.keyboard.type('mar', { delay: 25 }); await settle(page, 600)
      const pal = await page.evaluate(`(() => { const { px } = ${L}; const d = document.querySelector('dialog[open].g-combobox-surface'); if (!d) return null; const r = d.getBoundingClientRect(); const body = d.querySelector('.g-dialog__body'); const sb = d.querySelector('.g-combobox__surface-body').getBoundingClientRect(); const pan = d.querySelector('.g-combobox__panel'); const pv = d.querySelector('.g-combobox__preview')
        return { modal: d.matches(':modal'), palette: d.classList.contains('g-combobox-surface--palette'), inView: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, bodyScroll: body.scrollHeight - body.clientHeight, sbh: sb.height, want: px('--g-space-1') * 96, ratio: pv ? pan.getBoundingClientRect().width / pv.getBoundingClientRect().width : 0, focus: document.activeElement.classList.contains('g-combobox__search-field'), top: r.top, h: r.height } })()`)
      ok(pal && pal.modal && pal.palette && pal.inView && pal.focus, tag('paleta: ' + JSON.stringify(pal)))
      if (pal) {
        ok(pal.bodyScroll <= 1 && Math.abs(pal.sbh - pal.want) < 1 && Math.abs(pal.ratio - 1.2) < 0.05, tag(`paleta: cuerpo ${pal.sbh}/${pal.want}, proporción ${pal.ratio.toFixed(2)}, desplazamiento ${pal.bodyScroll}`))
        // Cambiar resultados no mueve la superficie
        const geo0 = await page.evaluate(() => { const r = document.querySelector('dialog[open].g-combobox-surface').getBoundingClientRect(); return [r.top, r.height] })
        await page.keyboard.type('ía gar', { delay: 40 }); await settle(page, 500)
        await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await settle(page, 150)
        const geo1 = await page.evaluate(() => { const r = document.querySelector('dialog[open].g-combobox-surface').getBoundingClientRect(); return [r.top, r.height] })
        ok(Math.abs(geo0[0] - geo1[0]) < 0.5 && Math.abs(geo0[1] - geo1[1]) < 0.5, tag(`paleta: la superficie salta al cambiar resultados ${geo0} → ${geo1}`))
        const pv = await page.evaluate(() => { const v = document.querySelector('dialog[open] .g-combobox__preview'); const o = [...document.querySelectorAll('dialog[open] .g-combobox__option:not(.g-combobox__action) > .g-summary')]; return { pv: v.scrollWidth - v.clientWidth, dd: v.querySelectorAll('.g-summary--layout-stack .g-summary__fact').length, rows: o.every((m) => m.scrollWidth <= m.clientWidth + 0.5) } })
        ok(pv.pv <= 0.5 && pv.dd === 4 && pv.rows, tag('paleta: vista previa o fichas desbordan ' + JSON.stringify(pv)))
        note('paleta 1280', `${engine}: cuerpo ${pal.sbh}px, lista/vista ${pal.ratio.toFixed(2)}, superficie quieta al cambiar resultados (top ${geo0[0].toFixed(1)}, alto ${geo0[1].toFixed(1)})`)
        // Reapertura durante la salida: Esc y volver a abrir a los 60 ms
        await page.keyboard.press('Escape'); await page.waitForTimeout(60)
        await page.click('#cb-pal'); await settle(page, 600)
        const re = await page.evaluate(() => { const ds = [...document.querySelectorAll('dialog[open].g-combobox-surface')]; const d = ds[0]; const r = d && d.getBoundingClientRect(); return { n: ds.length, op: d ? +getComputedStyle(d).opacity : 0, inView: d && r.top >= 0 && r.bottom <= innerHeight, focus: document.activeElement && document.activeElement.classList.contains('g-combobox__search-field'), top: r && r.top } })
        ok(re.n === 1 && re.op === 1 && re.inView && re.focus, tag('paleta: reabrir durante la salida ' + JSON.stringify(re)))
        ok(Math.abs(re.top - pal.top) < 0.5, tag(`paleta: reabre en otro sitio (${pal.top} → ${re.top})`))
        await page.keyboard.press('Escape'); await settle(page, 400)
      }
      await ctx.close()
    }
    for (const [w, h] of [[375, 812], [320, 640]]) {
      const { ctx, page } = await mk({ width: w, height: h, touch: engine !== 'firefox', mobile: true })
      await go(page)
      for (const id of ['cb-pac', 'cb-pal']) {
        await center(page, id); await page.click('#' + id); await settle(page, 400)
        if (!(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('g-combobox__search-field')))) await page.focus(`#${id}-search`).catch(() => {})
        await page.keyboard.type('mar', { delay: 25 }); await settle(page, 600)
        const sh = await page.evaluate(() => { const d = document.querySelector('dialog[open].g-combobox-surface'); if (!d) return null; const r = d.getBoundingClientRect(); const rows = [...d.querySelectorAll('.g-combobox__option')].map((o) => o.getBoundingClientRect()); const body = d.querySelector('.g-dialog__body')
          return { sheet: d.classList.contains('g-combobox-surface--sheet'), top: r.top, left: r.left, w: r.width, vw: document.documentElement.clientWidth, preview: Boolean(d.querySelector('.g-combobox__preview')), minRow: Math.min(...rows.map((x) => x.height)), overflowX: Math.max(...rows.map((x) => x.right)) - r.right, docX: document.documentElement.scrollWidth - document.documentElement.clientWidth, bodyScroll: body.scrollHeight - body.clientHeight, bottom: r.bottom, vh: innerHeight } })
        const t = (x) => tag(`hoja ${w} ${id}: ${x}`)
        ok(sh && sh.sheet, t('no es la hoja ' + JSON.stringify(sh)))
        if (sh) {
          ok(Math.abs(sh.top) <= 1 && Math.abs(sh.left) <= 1 && Math.abs(sh.w - sh.vw) <= 1, t(`no está arriba a ancho completo (${sh.top}, ${sh.w}/${sh.vw})`))
          ok(!sh.preview && sh.minRow >= 43.5 && sh.overflowX <= 0.5 && sh.docX <= 0 && sh.bodyScroll <= 1 && sh.bottom <= sh.vh, t(JSON.stringify(sh)))
          const res = await fichas(page, 'dialog[open].g-combobox-surface')
          ok(!res.bad.length, t('fichas ' + res.bad.join(' · ')))
          // Cambiar los resultados no mueve el borde inferior de la hoja más que una vez por respuesta, y nunca la deja fuera
          const b0 = sh.bottom
          await page.evaluate(() => { window.__fr = []; window.__run = true; (function f() { const d = document.querySelector('dialog[open].g-combobox-surface'); window.__fr.push(d ? d.getBoundingClientRect().bottom : -1); if (window.__run) requestAnimationFrame(f) })() })
          await page.keyboard.type('ía g', { delay: 60 }); await settle(page, 600)
          const fr = await page.evaluate(() => { window.__run = false; return window.__fr })
          const vals = fr.map(Math.round).filter((v, i, a) => i === 0 || v !== a[i - 1])
          ok(vals.length <= 4, t(`el pie de la hoja salta ${vals.length - 1} veces al escribir (${vals})`))
          note('hoja', `${engine} ${w}×${h} ${id}: top ${sh.top}, fila mínima ${sh.minRow.toFixed(1)}px, pie ${b0.toFixed(0)}px; al escribir «ía g» el pie pasa por ${vals.join(' → ')}`)
        }
        await page.keyboard.press('Escape'); await settle(page, 400)
      }
      await ctx.close()
    }
  }

  /* 15 · forced-colors (Chromium y WebKit lo emulan) */
  if (run('forced')) {
    const { ctx, page } = await mk()
    let supported = true
    try { await page.emulateMedia({ forcedColors: 'active' }) } catch { supported = false }
    await go(page, { motion: 'reduce' })
    supported = supported && await page.evaluate(() => matchMedia('(forced-colors: active)').matches)
    if (!supported) notes.push(`${engine}: forced-colors no emulable`)
    else {
      await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' })
      const f = await page.evaluate(() => { const r = document.getElementById('cb-f-pac').closest('.g-combobox'); const t = r.querySelector('.g-combobox__token'); const inp = document.getElementById('cb-f-pac'); const i = document.createElement('i'); i.style.color = 'FieldText'; r.querySelector('.g-input__control').append(i); const ft = getComputedStyle(i).color; i.remove(); return { token: getComputedStyle(t).display, same: getComputedStyle(inp).color === ft } })
      ok(f.token === 'none' && f.same, tag(`forced-colors: la ficha no se retira o el texto no se ve ${JSON.stringify(f)}`))
      await openWith(page, 'cb-pac', 'mar', 300)
      const g = await page.evaluate(() => { const r = document.getElementById('cb-pac').closest('.g-combobox'); const sys = (k, p) => { const i = document.createElement('i'); i.style[p] = k; r.querySelector('.g-input__control').append(i); const v = getComputedStyle(i)[p]; i.remove(); return v }; const act = r.querySelector('.g-combobox__option.is-active'); const pop = getComputedStyle(document.getElementById('cb-pac-popup')); const mark = getComputedStyle(r.querySelector('.g-combobox__option:not(.is-active) .g-summary__mark'))
        return { actBg: act && getComputedStyle(act).backgroundColor === sys('Highlight', 'backgroundColor'), actFg: act && [...act.querySelectorAll('.g-summary__title, .g-summary__fact-label, .g-summary__fact-value')].every((x) => getComputedStyle(x).color === sys('HighlightText', 'color')), border: pop.borderTopColor === sys('CanvasText', 'color'), ring: pop.outlineColor === sys('Highlight', 'color') && pop.outlineStyle === 'solid', ghost: getComputedStyle(r.querySelector('.g-combobox__ghost-rest')).color === sys('GrayText', 'color'), mark: /underline/.test(mark.textDecorationLine) } })
      for (const [k, v] of Object.entries(g)) ok(v, tag(`forced-colors: ${k}`))
      await close(page)
      await center(page, 'cb-pal'); await page.click('#cb-pal'); await settle(page, 400); await page.keyboard.type('mar'); await settle(page, 500); await page.keyboard.press('ArrowDown'); await settle(page, 200)
      const pg = await page.evaluate(() => { const d = document.querySelector('dialog[open].g-combobox-surface'); const act = d && d.querySelector('.g-combobox__option.is-active'); const i = document.createElement('i'); i.style.backgroundColor = 'Highlight'; d.append(i); const hl = getComputedStyle(i).backgroundColor; i.remove(); return act ? getComputedStyle(act).backgroundColor === hl : null })
      ok(pg, tag('forced-colors: la activa de la paleta no es Highlight'))
      note('forced-colors (emulado)', `${engine}: ficha retirada y texto en FieldText; forma CanvasText; anillo Highlight; activa Highlight/HighlightText (A y paleta); fantasma GrayText; marca subrayada`)
      await page.keyboard.press('Escape')
    }
    await ctx.close()
  }

  /* 16 · RTL: #cb-rtl (árabe) y la sección entera en rtl */
  if (run('rtl')) {
    const { ctx, page } = await mk()
    await go(page, { dir: 'rtl' })
    await openWith(page, 'cb-pac', 'mar', 600)
    const r = await shape(page, 'cb-pac')
    ok(Math.abs(r.P.l - r.ctl.l) < 1 && Math.abs(r.P.w - r.ctl.w) < 1 && r.outline === 'solid', tag('RTL: la forma no coincide con la caja'))
    const lead = await page.evaluate(() => { const o = document.querySelector('#cb-pac-popup .g-combobox__option'); const a = o.querySelector('.g-summary__lead').getBoundingClientRect(), m = o.querySelector('.g-summary__body').getBoundingClientRect(); return a.left > m.left })
    ok(lead, tag('RTL: el avatar de la fila no está al inicio (derecha)'))
    await close(page)
    await go(page)
    await openWith(page, 'cb-rtl', '', 500)
    const ar = await page.evaluate(() => { const r = document.getElementById('cb-rtl').closest('.g-combobox'); const c = r.querySelector('.g-input__control').getBoundingClientRect(); const P = document.getElementById('cb-rtl-popup').getBoundingClientRect(); const o = document.querySelector('#cb-rtl-popup .g-combobox__option'); const R = o.getBoundingClientRect(); return { shape: Math.abs(P.left - c.left) < 1 && Math.abs(P.width - c.width) < 1, dir: getComputedStyle(r).direction, over: [...o.querySelectorAll('*')].some((k) => { const b = k.getBoundingClientRect(); return b.width && (b.right > R.right + 0.5 || b.left < R.left - 0.5) }) } })
    ok(ar.shape && ar.dir === 'rtl' && !ar.over, tag('RTL #cb-rtl: ' + JSON.stringify(ar)))
    await page.keyboard.type('طبيب', { delay: 30 }); await settle(page, 400)
    const ag = await page.evaluate(() => { const r = document.getElementById('cb-rtl').closest('.g-combobox'); const g = r.querySelector('.g-combobox__ghost-typed'), i = document.getElementById('cb-rtl'); if (!g) return { none: true }; const a = g.getBoundingClientRect(), b = i.getBoundingClientRect(); return { dr: a.right - b.right } })
    ok(ag.none || Math.abs(ag.dr) <= 0.5, tag('RTL #cb-rtl: el fantasma árabe no empieza a la derecha ' + JSON.stringify(ag)))
    note('RTL', `${engine}: forma = caja; avatar al inicio; #cb-rtl sin desborde; fantasma árabe ${ag.none ? 'sin fantasma' : 'Δ ' + ag.dr.toFixed(2) + 'px'}`)
    await close(page)
    await ctx.close()
  }

  /* 17 · Fila de tres en GFormRow (#cb-row), «Alta de paciente» (#fm-clinica) y dentro de GDialog (#cb-dlg) */
  if (run('context')) {
    for (const [w, h] of [[1280, 900], [900, 900], [600, 800]]) { // ≤ 520 el campo usa la hoja (sección 14)
      const { ctx, page } = await mk({ width: w, height: h })
      await go(page, { motion: 'reduce' })
      const fr = await page.evaluate(() => { const cb = document.getElementById('cb-f-pac').closest('.g-combobox'), sel = document.getElementById('cb-f-sel').closest('.g-select, .g-input') || document.getElementById('cb-f-sel'), nota = document.getElementById('cb-f-nota').closest('.g-input'); const a = cb.getBoundingClientRect(), b = nota.getBoundingClientRect(); const lab = cb.querySelector('.g-combobox__token .g-summary__title'); return { min: getComputedStyle(cb).getPropertyValue('--g-form-min').trim(), w: a.width, sameLine: Math.abs(a.top - b.top) < 1, lab: lab ? lab.getBoundingClientRect().width : 0, labCut: lab ? lab.scrollWidth > lab.clientWidth + 1 : null, ctlTop: Math.abs(cb.querySelector('.g-input__control').getBoundingClientRect().top - nota.querySelector('.g-input__control').getBoundingClientRect().top) } })
      ok(fr.min === '60' && fr.w >= 239, tag(`fila ${w}: --g-form-min ${fr.min}, campo ${fr.w.toFixed(0)}px`))
      if (fr.sameLine) ok(fr.ctlTop < 1, tag(`fila ${w}: cajas desalineadas ${fr.ctlTop}`))
      note('fila de tres (#cb-row)', `${engine} ${w}: campo ${fr.w.toFixed(0)}px ${fr.sameLine ? 'en línea' : 'partida'}; etiqueta de la ficha ${fr.lab.toFixed(0)}px${fr.labCut ? ' (recortada)' : ''}`)
      await openWith(page, 'cb-f-pac', 'mar', 300)
      const s = await shape(page, 'cb-f-pac')
      ok(Math.abs(s.P.w - s.ctl.w) < 1 && Math.abs(s.P.l - s.ctl.l) < 1, tag(`fila ${w}: la forma no mide lo que el campo`))
      const res = await fichas(page, '#cb-f-pac-popup')
      ok(!res.bad.length, tag(`fila ${w}: fichas ${res.bad.join(' · ')}`))
      await close(page)
      // «Alta de paciente»: #fm-medico y #fm-dx con ficha y forma
      const fm = await page.evaluate(() => { const r = document.getElementById('fm-medico'); return r ? { ok: true } : { ok: false } })
      if (fm.ok) {
        await openWith(page, 'fm-medico', 'dra', 300)
        const s2 = await shape(page, 'fm-medico')
        ok(Math.abs(s2.P.w - s2.ctl.w) < 1 && s2.outline === 'solid', tag(`Alta de paciente ${w}: forma de #fm-medico`))
        await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await settle(page, 200)
        const tk = await page.evaluate(() => { const r = document.getElementById('fm-medico').closest('.g-combobox'); const c = r.querySelector('.g-input__control').getBoundingClientRect(), t = r.querySelector('.g-combobox__token'); return t ? t.getBoundingClientRect().right <= c.right + 0.5 : false })
        ok(tk, tag(`Alta de paciente ${w}: la ficha de #fm-medico sale de la caja`))
        await close(page)
      }
      // Dentro de GDialog: la forma por encima del modal, el clic en una fila elige
      await page.evaluate(() => { window.__cb.dlg = true }); await settle(page, 500)
      await page.click('#cb-d-dx'); await page.keyboard.type('dia', { delay: 25 }); await settle(page, 500)
      const d = await page.evaluate(() => { const pop = document.getElementById('cb-d-dx-popup'); const o = pop.querySelector('.g-combobox__option'); const b = o.getBoundingClientRect(); const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); const c = document.getElementById('cb-d-dx').closest('.g-input__control').getBoundingClientRect(), P = pop.getBoundingClientRect(); return { top: pop.matches(':popover-open'), hit: o.contains(hit), shape: Math.abs(P.left - c.left) < 1 && Math.abs(P.width - c.width) < 1 } })
      ok(d.top && d.hit && d.shape, tag(`GDialog ${w}: ${JSON.stringify(d)}`))
      await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await settle(page, 300)
      await ctx.close()
    }
  }

  /* 17b · Área táctil y foco de los objetivos propios (limpiar, flecha, filas, «Mostrar más»), puntero fino y grueso */
  if (run('targets')) {
    const confs = [['fino', 'defecto', '', { width: 1280, height: 900 }], ['fino', 'auditoría', 'audit', { width: 1280, height: 900 }], ['grueso', 'auditoría', 'audit', { width: 600, height: 900, touch: true, mobile: true }]]
    for (const [ptr, name, theme, opts] of confs) {
      if (ptr === 'grueso' && engine === 'firefox') continue // Firefox no emula pointer: coarse (isMobile no existe en Firefox)
      const { ctx, page } = await mk(opts)
      await go(page, { theme, motion: 'reduce' })
      const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
      if (ptr === 'grueso' && !coarse) { notes.push(`${engine}: pointer: coarse no emulable con hasTouch`); await ctx.close(); continue }
      const min = ptr === 'grueso' ? 44 : 24
      const t = (x) => tag(`objetivos ${ptr} ${name}: ${x}`)
      // Elegir una opción con el puntero para que aparezca «Limpiar»
      await openWith(page, 'cb-pac', 'mar', 400)
      const rows = await page.evaluate(() => { const pop = document.getElementById('cb-pac-popup'); return [...pop.querySelectorAll('.g-combobox__option')].map((o) => o.getBoundingClientRect().height) })
      ok(rows.length && Math.min(...rows) >= min - 0.5, t(`fila de ${Math.min(...rows).toFixed(1)}px < ${min}`))
      const more = await page.evaluate(() => { const a = [...document.querySelectorAll('#cb-pac-popup .g-combobox__action')].pop(); return a ? a.getBoundingClientRect().height : null })
      if (more !== null) ok(more >= min - 0.5, t(`fila de acción de ${more.toFixed(1)}px < ${min}`))
      if (ptr === 'grueso') {
        // Con puntero grueso a > 520px el campo sigue siendo A: elegir con el teclado (el toque abriría igual)
        await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter')
      } else {
        const r = await page.evaluate(() => { const b = document.querySelectorAll('#cb-pac-popup .g-combobox__option')[1].getBoundingClientRect(); return { x: b.left + 40, y: b.top + b.height / 2 } })
        await page.mouse.click(r.x, r.y)
      }
      await settle(page, 300)
      const g = await page.evaluate(`(() => { const { parse, ratio, bgOf, px } = ${L}; const r = document.getElementById('cb-pac').closest('.g-combobox'); const c = r.querySelector('.g-combobox__clear'), a = r.querySelector('.g-combobox__arrow'), ctl = r.querySelector('.g-input__control').getBoundingClientRect()
        const box = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { w: b.width, h: b.height } }
        return { clear: box(c), arrow: box(a), ctlH: ctl.height, fw: px('--g-focus-width') } })()`)
      ok(g.clear && g.clear.w >= min - 0.5 && g.clear.h >= min - 0.5, t(`«Limpiar» ${JSON.stringify(g.clear)} < ${min}`))
      ok(g.arrow && g.arrow.w >= 23.5 && g.arrow.h >= 23.5, t(`flecha ${JSON.stringify(g.arrow)} < 24`))
      // Foco por teclado en «Limpiar»: anillo visible y con contraste ≥ 3:1 sobre lo que rodea
      // WebKit (como Safari sin «Acceso total por teclado») salta los botones con Tab; Alt+Tab los recorre
      await page.focus('#cb-pac'); await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab'); await settle(page, 200)
      const f = await page.evaluate(`(() => { const { parse, ratio, bgOf, over } = ${L}; const c = document.querySelector('#cb-pac') .closest('.g-combobox').querySelector('.g-combobox__clear'); if (!c || document.activeElement !== c) return { focused: false }; const cs = getComputedStyle(c); const oc = parse(cs.outlineColor); const bg = bgOf(c.parentElement)
        return { focused: true, fv: c.matches(':focus-visible'), style: cs.outlineStyle, w: parseFloat(cs.outlineWidth), r: ratio(over(oc, bg), bg) } })()`)
      ok(f.focused && f.fv && f.style === 'solid' && f.w >= g.fw - 0.1 && f.r >= 3, t('foco de «Limpiar» ' + JSON.stringify(f)))
      note('área táctil y foco', `${engine} ${ptr} ${name}: filas ≥ ${Math.min(...rows).toFixed(0)}px${more !== null ? `, acción ${more.toFixed(0)}px` : ''}, «Limpiar» ${g.clear ? g.clear.w.toFixed(0) + '×' + g.clear.h.toFixed(0) : '—'}, flecha ${g.arrow ? g.arrow.w.toFixed(0) + '×' + g.arrow.h.toFixed(0) : '—'}; anillo de «Limpiar» ${f.focused ? `${f.style} ${f.w}px ${f.r}:1` : 'sin foco'}`)
      await page.keyboard.press('Escape'); await page.evaluate(() => document.activeElement && document.activeElement.blur())
      await ctx.close()
    }
  }

  /* 18 · Zoom 200 % aproximado (visor 640 × 450 a DPR 2) */
  if (run('zoom')) {
    const { ctx, page } = await mk({ width: 640, height: 450, dpr: 2 })
    await go(page, { motion: 'reduce' })
    await openWith(page, 'cb-dx', 'dia', 400)
    const s = await shape(page, 'cb-dx')
    ok(Math.abs(s.P.w - s.ctl.w) < 1 && s.outline === 'solid', tag('zoom 200 %: la forma no coincide'))
    const room = await page.evaluate(() => { const pop = document.getElementById('cb-dx-popup').getBoundingClientRect(); return { top: pop.top, bottom: pop.bottom, vh: innerHeight, docX: document.documentElement.scrollWidth - document.documentElement.clientWidth } })
    ok(room.top >= -0.5 && room.bottom <= room.vh + 0.5 && room.docX <= 0, tag('zoom 200 %: la forma sale del visor o hay desplazamiento horizontal ' + JSON.stringify(room)))
    const res = await fichas(page, '#cb-dx-popup')
    ok(!res.bad.length, tag('zoom 200 %: fichas ' + res.bad.join(' · ')))
    note('zoom 200 % (640 × 450 a DPR 2)', `${engine}: forma ${s.up ? 'arriba' : 'abajo'} dentro del visor (${room.top.toFixed(0)}–${room.bottom.toFixed(0)} de ${room.vh}), sin desplazamiento horizontal`)
    await close(page)
    await ctx.close()
  }

  /* 19 · Capturas lado a lado con los prototipos elegidos (r02 ?c=AC y ?c=B) */
  if (run('shots') && shotsDir && engine === 'chromium') {
    const { ctx, page } = await mk()
    for (const c of ['AC', 'B']) {
      await page.goto(`${ORIGIN}/design/lab/combobox/r02/index.html?c=${c}`)
      await page.waitForTimeout(600)
      const inp = page.locator('input[role=combobox]').first()
      await inp.scrollIntoViewIfNeeded(); await inp.click(); await page.keyboard.type('mar', { delay: 40 }); await page.waitForTimeout(1200)
      await page.screenshot({ path: join(shotsDir, `r02-${c}.png`) })
      await page.keyboard.press('Escape')
    }
    await go(page)
    await openWith(page, 'cb-pac', 'mar', 700)
    await page.screenshot({ path: join(shotsDir, 'real-A.png') })
    await close(page)
    await center(page, 'cb-pal'); await page.click('#cb-pal'); await settle(page, 500); await page.keyboard.type('mar'); await settle(page, 600); await page.keyboard.press('ArrowDown'); await settle(page, 300)
    await page.screenshot({ path: join(shotsDir, 'real-B.png') })
    await page.keyboard.press('Escape'); await settle(page, 300)
    await openWith(page, 'cb-pac', 'mar', 600)
    const far = await page.evaluate(() => { const b = document.querySelectorAll('#cb-pac-popup .g-combobox__option')[3].getBoundingClientRect(); return { x: b.left + 40, y: b.top + 20 } })
    await page.mouse.click(far.x, far.y); await settle(page, 800)
    await center(page, 'cb-pac')
    await page.screenshot({ path: join(shotsDir, 'real-C.png') })
    await ctx.close()
  }

  ok(!errors.length, tag('consola: ' + [...new Set(errors)].slice(0, 3).join(' | ')))
  await browser.close()
}
server.close()

console.log(`\nGCombobox · auditoría · ${total - failed}/${total} comprobaciones (${ENGINES.join(', ')})`)
for (const [k, v] of Object.entries(measures)) { console.log(`· ${k}`); for (const x of (args.verbose ? v : v.slice(0, 12))) console.log('    ' + x) }
for (const n of notes) console.log('nota: ' + n)
if (fails.length) { console.log('\nFALLAN:'); for (const f of [...new Set(fails)]) console.log('  ✗ ' + f); process.exitCode = 1 }
