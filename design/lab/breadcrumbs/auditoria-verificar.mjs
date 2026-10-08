// Auditoría de coco (paso 5) de GBreadcrumbs sobre el COMPONENTE REAL: design/lab/breadcrumbs/auditoria-banco.html con
// GBreadcrumbs, GBadge y GDialog de dist/grana.umd.js y dist/grana.css + dist/fonts.css. Repite la batería de
// estilo-verificar.mjs sobre el real y añade lo que solo existe con él: marcado real frente al que espera el CSS (contrato
// «Estructura accesible» y «Clases y datos»), CSS publicado (capa y keyframes), contraste en 28 configuraciones (defecto,
// auditoría de @grana/cli, propio del estilo y los once de dark-color-presence/generated, claro y oscuro), geometría y alto
// Δ0 también con el tema de la auditoría y con el texto al 200 %, barrido de ancho de 1100 a 200px en LTR y RTL (etapas en
// orden, nada fuera, ida y vuelta), paneles reales (placeBlock, capa superior, uno a la vez, teclado, Esc, Tab, pulsar
// fuera, ancla que sale del visor, lado del panel al pie del visor), pista visual del motor del tooltip (lo recortado, la
// raíz en solo icono, la puerta, «Subir» y la divulgación; nunca lo que cabe), despliegue por teclado, bajar y subir con la
// regla de L13 (copia saliente, respaldos de tiempo), movimiento reducido, slot link, GDialog, navigate, táctil 44px,
// zoom, forced-colors (Chromium) y consola limpia.
// Ejecutar desde la raíz del repo:  GRANA_PW_PORT=4215 node design/lab/breadcrumbs/auditoria-verificar.mjs
// Opcional: GRANA_DIST=<copia de dist/>  --engines=chromium,firefox,webkit  --verbose  --only=0,1,…  --themes=quick
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const DIST = process.env.GRANA_DIST
const DISTDIR = DIST || join(ROOT, 'packages/vue/dist')
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const ONLY = args.only ? new Set(String(args.only).split(',')) : null
const run = (n) => !ONLY || ONLY.has(String(n))
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const p = DIST && path.startsWith('/packages/vue/dist/') ? join(DIST, path.slice('/packages/vue/dist/'.length)) : normalize(join(ROOT, path))
    if (!DIST && !p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4215, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/breadcrumbs/auditoria-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = [], notes = []
const counts = {}
const ok = (cond, msg, eng = 'estático') => { total++; counts[eng] = counts[eng] || [0, 0]; counts[eng][1]++; if (cond) counts[eng][0]++; else { failed++; fails.push(msg) } }
const near = (a, b, t = 0.5) => Math.abs(a - b) <= t

/* ---------- 0 · Análisis estático del CSS fuente y del publicado ---------- */
if (run(0)) {
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GBreadcrumbs/GBreadcrumbs.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch|color-mix)\(/.test(css), 'CSS: color literal o mezcla')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer|@property|!important/.test(css), 'CSS: @layer, @property o !important')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  ok(!/--g-[\w-]+\s*:/.test(css), 'CSS: declara un token del tema')
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  const fromVue = ['--_depth', '--_x', '--_y', '--_max']
  ok([...own].every((v) => v.startsWith('--_bc-')), 'CSS: alias propio sin prefijo --_bc-')
  ok(![...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v) && !fromVue.includes(v)))].length, 'CSS: alias --_* que ni declara ni recibe del .vue')
  const px = [...css.matchAll(/(-?\d*\.?\d+)px\b/g)].map((m) => m[0])
  ok(px.every((p) => ['24px', '44px', '1px', '-1px'].includes(p)), 'CSS: medidas literales no permitidas ' + px)
  const onePx = css.split('\n').filter((l) => /\b-?1px\b/.test(l)).map((l) => l.trim())
  ok(onePx.every((l) => /^(inline-size|block-size|margin): -?1px;$/.test(l)), 'CSS: 1px fuera del texto oculto')
  const ch = [...css.matchAll(/(\d*\.?\d+)ch\b/g)].map((m) => m[0])
  ok(ch.every((c) => ['20ch', '3ch', '8ch'].includes(c)), 'CSS: ch fuera de 20ch, 3ch y 8ch (#501): ' + ch)
  ok([...css.matchAll(/(\d*\.?\d+)deg\b/g)].every((m) => ['90deg', '180deg'].includes(m[0])), 'CSS: giros fuera de 90° y 180°')
  ok(!/ease-bounce|cubic-bezier|steps\(/.test(css), 'CSS: rebote o curva propia')
  ok((css.match(/ease-spring/g) || []).length === 1, 'CSS: --g-ease-spring más de una vez')
  ok(!/>\s*\*/.test(css.replace(/\{[^}]*\}/g, '{}')), 'CSS: selector de hijos por estructura (#383)')
  // Hallazgo 1: la fila, la cara, la raíz en solo icono y la puerta crecen con su texto
  ok(/--_bc-h: max\(24px, calc\(var\(--g-space-1\) \* 7\), var\(--g-text-body-sm-line\)\)/.test(css) && /--_bc-h: max\(44px, calc\(var\(--g-space-1\) \* 7\), var\(--g-text-body-sm-line\)\)/.test(css), 'CSS: el alto de la fila no cuenta su línea de texto (hallazgo 1)')
  ok(/--_bc-door: max\(24px, calc\(var\(--g-space-1\) \* 6\), calc\(1em \+ var\(--g-space-1\) \* 2\)\)/.test(css) && /--_bc-door: max\(44px, calc\(1em \+ var\(--g-space-1\) \* 2\)\)/.test(css), 'CSS: la puerta no crece con su chevron (hallazgo 1)')
  // Publicado
  const dcss = await readFile(join(DISTDIR, 'grana.css'), 'utf8')
  const djs = await readFile(join(DISTDIR, 'grana.js'), 'utf8')
  const layerAt = dcss.indexOf('@layer grana.components')
  const at = dcss.indexOf('.g-breadcrumbs__door')
  ok(layerAt >= 0 && at > layerAt, 'dist: GBreadcrumbs fuera de @layer grana.components')
  ok(/g-breadcrumbs__door/.test(dcss) && /g-breadcrumbs__stairs/.test(dcss), 'dist: compuertas g-breadcrumbs__door / __stairs')
  ok(/GBreadcrumbs/.test(djs), 'dist: GBreadcrumbs fuera del paquete principal (#490)')
  const kfd = [...dcss.matchAll(/@keyframes\s+(g-breadcrumbs[\w-]*)/g)].map((m) => m[1])
  ok(kfd.sort().join() === 'g-breadcrumbs-enter,g-breadcrumbs-enter-fade,g-breadcrumbs-leave,g-breadcrumbs-stair', 'dist: keyframes ' + kfd)
  ok(/--_bc-h:max\(24px,calc\(var\(--g-space-1\)\*7\),var\(--g-text-body-sm-line\)\)|--_bc-h: max\(24px, calc\(var\(--g-space-1\) \* 7\), var\(--g-text-body-sm-line\)\)/.test(dcss), 'dist: grana.css sin el arreglo de la auditoría (reconstruir)')
  ok(!/data:font/.test(dcss), 'dist: fuente incrustada')
}

/* ---------- Utilidades en la página ---------- */
const LIB = `window.__lib = (() => {
  const parse = (s) => {
    let m = s.match(/rgba?\\(([^)]+)\\)/)
    if (m) { const p = m[1].split(/[\\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
    m = s.match(/color\\(srgb ([^)]+)\\)/)
    if (m) { const p = m[1].split(/[\\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
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
  const tok = (n) => { const i = document.createElement('i'); i.style.color = 'var(' + n + ')'; document.querySelector('.host').append(i); const c = parse(getComputedStyle(i).color); i.remove(); return c }
  const sw = (v) => { const i = document.createElement('i'); i.style.background = v; document.querySelector('.host').append(i); const x = getComputedStyle(i).backgroundColor; i.remove(); return x }
  const swc = (v) => { const i = document.createElement('i'); i.style.color = v; document.querySelector('.host').append(i); const x = getComputedStyle(i).color; i.remove(); return x }
  const px = (expr, host) => { const i = document.createElement('i'); i.style.inlineSize = expr; i.style.position = 'absolute'; (host || document.querySelector('.g-breadcrumbs')).append(i); const v = i.getBoundingClientRect().width; i.remove(); return v }
  const nav = (id) => document.getElementById(id)
  const R = (el) => el.getBoundingClientRect()
  const dur = (n) => { const i = document.createElement('i'); i.style.transitionDuration = 'var(' + n + ')'; document.body.append(i); const v = parseFloat(getComputedStyle(i).transitionDuration) * 1000; i.remove(); return v }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  const panelOf = (t) => document.getElementById(t.getAttribute('aria-controls'))
  return { parse, over, bgOf, ratio, tok, sw, swc, px, nav, R, dur, wait, raf2, panelOf }
})()`

async function load(page, qs = '') {
  await page.goto(BASE + qs)
  await page.waitForSelector('html[data-ready="1"]', { timeout: 20000 })
  await page.evaluate(LIB)
}
const raf2 = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))

// Marcado real frente al que espera el CSS (contrato «Estructura accesible» y «Clases y datos»)
const markup = () => {
  const bad = []
  const has = (el, c) => el && el.classList.contains(c)
  const B = 'g-breadcrumbs'
  for (const n of document.querySelectorAll('nav.g-breadcrumbs')) {
    const b = (m) => bad.push(`${n.id}: ${m}`)
    if (!n.classList.contains('is-ready')) b('sin is-ready')
    if (!n.getAttribute('aria-label')) b('nav sin aria-label')
    if (n.querySelector('[title]')) b('lleva title')
    const st = n.dataset.stage
    if (!['liquid', 'root-icon', 'shrink', 'step'].includes(st)) b('data-stage ' + st)
    const kids = [...n.children]
    const tips = kids.filter((k) => has(k, 'g-tooltip'))
    if (tips.some((t) => t.getAttribute('aria-hidden') !== 'true' || t.id || t.getAttribute('role') || t.getAttribute('popover') !== 'manual')) b('pista sin aria-hidden/popover o con id/rol')
    if (n.querySelector(`.${B}__list .g-tooltip, .${B}__face .g-tooltip`)) b('pista dentro de la fila o la cara')
    const measure = kids.find((k) => has(k, `${B}__measure`))
    if (!measure || measure.getAttribute('aria-hidden') !== 'true' || !measure.inert || measure.querySelector('[id]') || !measure.dataset.stage) b('lista de medida sin aria-hidden/inert/data-stage o con ids')
    if (measure && measure.querySelector('[tabindex]:not([tabindex="-1"])')) b('medida con paradas de Tab')
    const [list] = kids.filter((k) => has(k, `${B}__list`))
    const [face] = kids.filter((k) => has(k, `${B}__face`))
    if (st === 'step') {
      if (list || !face) { b('step sin cara o con fila'); continue }
      const fk = [...face.children]
      const up = fk.find((k) => has(k, `${B}__up`)), tg = fk.find((k) => has(k, `${B}__toggle`))
      if (!tg || tg.tagName !== 'BUTTON' || !tg.getAttribute('aria-expanded') || !tg.getAttribute('aria-label') || !tg.querySelector(`:scope > .${B}__label[dir="auto"]`) || !tg.querySelector(`:scope > .${B}__chevron`)) b('divulgación incompleta')
      if (up && (up.tagName !== 'A' || !up.getAttribute('href') || !up.getAttribute('aria-label') || !up.querySelector(`:scope > .${B}__label[dir="auto"]`) || !up.querySelector(':scope > svg'))) b('«Subir» incompleto')
      if (fk.length !== (up ? 2 : 1)) b('cara con piezas de más')
      const stairs = kids.find((k) => has(k, `${B}__stairs`))
      if (!stairs || stairs.tagName !== 'OL' || stairs.getAttribute('popover') !== 'manual' || stairs.id !== tg.getAttribute('aria-controls')) b('escalera sin popover o sin aria-controls')
      else {
        const lis = [...stairs.children]
        lis.forEach((li, i) => { if (!has(li, `${B}__stair`) || li.style.getPropertyValue('--_depth').trim() !== String(i)) b('escalón sin --_depth = índice') })
        if (!has(lis[lis.length - 1], 'is-current') || lis.filter((li) => has(li, 'is-current')).length !== 1) b('escalón actual')
        if (stairs.querySelectorAll('[aria-current="page"]').length !== 1) b('escalera: aria-current="page" ≠ 1')
        if (stairs.querySelector(`.${B}__door`)) b('puerta en la escalera')
      }
      continue
    }
    if (!list || face) { b('fila sin ol o con cara'); continue }
    const lis = [...list.children].filter((li) => !has(li, 'is-leaving'))
    const N = lis.length
    lis.forEach((li, i) => {
      if (li.tagName !== 'LI' || !has(li, `${B}__item`)) b('hijo del ol que no es li.__item')
      const roles = ['is-root', 'is-mid', 'is-parent', 'is-current'].filter((c) => has(li, c))
      const want = N === 1 ? ['is-current'] : i === N - 1 ? ['is-current'] : i === 0 ? (N === 2 ? ['is-root', 'is-parent'] : ['is-root']) : i === N - 2 ? ['is-parent'] : ['is-mid']
      if (roles.join() !== want.join()) b(`li ${i}: papeles ${roles} ≠ ${want}`)
      const ck = [...li.children]
      const link = ck[ck.length - 1]
      if (!has(link, `${B}__link`)) b(`li ${i}: el destino no es el último hijo directo`)
      if (link.tagName === 'A' && !link.getAttribute('href')) b(`li ${i}: a sin href`)
      if (link.tagName === 'SPAN' && !has(link, `${B}__link--text`)) b(`li ${i}: span sin --text`)
      const lab = link.querySelector(`:scope > .${B}__label`)
      if (!lab || lab.getAttribute('dir') !== 'auto') b(`li ${i}: nombre sin __label dir=auto`)
      const icn = link.querySelector(`:scope > .${B}__icon`)
      if (icn && (icn.getAttribute('aria-hidden') !== 'true' || !icn.querySelector('svg'))) b(`li ${i}: icono sin aria-hidden o sin svg`)
      if ((link.getAttribute('aria-current') === 'page') !== (i === N - 1)) b(`li ${i}: aria-current`)
      if (i === 0 && ck.length !== 1) b('raíz con separador')
      if (i > 0) {
        const lead = ck[0]
        if (has(lead, `${B}__sep`)) {
          if (lead.tagName.toLowerCase() !== 'svg' || lead.getAttribute('aria-hidden') !== 'true' || !lead.classList.contains('g-icon--flip-rtl')) b(`li ${i}: separador sin svg aria-hidden flip-rtl`)
          if (ck.length !== 2) b(`li ${i}: piezas de más`)
        } else if (has(lead, `${B}__door`)) {
          const p = ck[1]
          if (lead.tagName !== 'BUTTON' || lead.type !== 'button' || !lead.getAttribute('aria-label') || !['true', 'false'].includes(lead.getAttribute('aria-expanded'))) b(`li ${i}: puerta incompleta`)
          if (!lead.querySelector(':scope > svg.g-icon--flip-rtl')) b(`li ${i}: chevron de la puerta sin flip-rtl`)
          if (!has(p, `${B}__panel`) || p.tagName !== 'UL' || p.getAttribute('popover') !== 'manual' || p.id !== lead.getAttribute('aria-controls')) b(`li ${i}: panel no sigue a la puerta`)
          if (p && p.querySelector('[aria-current="page"]')) b(`li ${i}: page en un panel`)
          if (p && p.querySelectorAll('[aria-current="true"]').length > 1) b(`li ${i}: más de un hijo de la ruta`)
          const here = p && p.querySelector('[aria-current="true"]')
          if (here && !here.querySelector(`.${B}__here`)) b(`li ${i}: hijo de la ruta sin check`)
          if (ck.length !== 3) b(`li ${i}: piezas de más`)
        } else b(`li ${i}: sin separador ni puerta`)
      }
      const isIcon = has(li, 'is-icon')
      if (isIcon && (i !== 0 || !icn || !['root-icon', 'shrink'].includes(st))) b(`li ${i}: is-icon fuera de la raíz con icono en root-icon/shrink`)
      if (i === 0 && icn && N > 1 && st === 'root-icon' && !isIcon) b('root-icon sin is-icon')
      const clip = !isIcon && lab && lab.scrollWidth > lab.clientWidth + 1
      if (clip !== li.hasAttribute('data-clipped')) b(`li ${i}: data-clipped ${li.hasAttribute('data-clipped')} y recorte ${clip}`)
    })
    if (n.querySelectorAll(`.${B}__list [aria-current="page"]`).length !== 1) b('aria-current="page" ≠ 1 en la fila')
    if (tips.length !== lis.length + n.querySelectorAll(`.${B}__list .${B}__door`).length) b(`pistas ${tips.length} ≠ niveles + puertas`)
  }
  return bad
}

// Contraste de todas las piezas en el tema cargado
const contrast = async (page) => page.evaluate(async () => {
  const { parse, over, bgOf, ratio, tok, nav, wait, panelOf } = window.__lib
  const out = []
  const add = (k, fg, bg, min) => out.push({ k, r: ratio(over(fg, bg), bg), min })
  const col = (el) => parse(getComputedStyle(el).color)
  for (const id of ['door', 'chip', 'bg720', 'p1100', 'p560']) {
    const n = nav(id)
    for (const li of n.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item')) {
      const a = li.querySelector(':scope > .g-breadcrumbs__link')
      const kind = li.classList.contains('is-current') ? 'actual' : li.hasAttribute('data-clipped') ? 'pastilla' : a.classList.contains('g-breadcrumbs__link--text') ? 'sin página' : li.classList.contains('is-icon') ? 'raíz icono' : 'nivel'
      add(`${id} ${kind}`, col(a), bgOf(a), 4.5)
      const sep = li.querySelector(':scope > .g-breadcrumbs__sep')
      if (sep) out.push({ k: `${id} separador (decorativo)`, r: ratio(over(col(sep), bgOf(li)), bgOf(li)), min: 0 })
      const d = li.querySelector(':scope > .g-breadcrumbs__door')
      if (d) {
        add(`${id} puerta reposo: chevron/hueco`, col(d), bgOf(d), 3)
        add(`${id} puerta reposo: chevron/superficie`, col(d), bgOf(li), 3)
        add(`${id} puerta al pasar: marco/superficie`, tok('--g-color-border-control'), bgOf(li), 3)
        add(`${id} puerta al pasar: chevron/hueco`, tok('--g-color-text'), bgOf(d), 4.5)
      }
      add(`${id} foco/fondo`, tok('--g-color-focus'), bgOf(li), 3)
    }
  }
  add('nivel al pasar', tok('--g-color-text'), bgOf(nav('door')), 4.5)
  // Puerta abierta + su panel
  const d = [...nav('door-open').querySelectorAll('.g-breadcrumbs__door')][2]
  d.click(); await wait(450)
  add('puerta abierta: chevron/acento', col(d), bgOf(d), 3)
  const p = panelOf(d)
  for (const a of p.querySelectorAll('.g-breadcrumbs__link')) add(`panel ${a.getAttribute('aria-current') ? 'de la ruta' : a.matches('.g-breadcrumbs__link--text') ? 'sin página' : 'enlace'}`, col(a), bgOf(a), 4.5)
  const here = p.querySelector('.g-breadcrumbs__here')
  add('panel check', col(here), bgOf(here), 3)
  add('panel al pasar', tok('--g-color-text'), over(tok('--g-color-neutral-soft'), bgOf(p)), 4.5)
  add('panel foco', tok('--g-color-focus'), bgOf(p), 3)
  d.click(); await wait(200)
  const d0 = nav('door').querySelector('.g-breadcrumbs__door')
  d0.click(); await wait(450)
  for (const a of panelOf(d0).querySelectorAll('.g-breadcrumbs__link--text')) add('panel sin página', col(a), bgOf(a), 4.5)
  d0.click(); await wait(200)
  // Cara de B y escalera
  const f = nav('face260')
  const up = f.querySelector('.g-breadcrumbs__up'), tg = f.querySelector('.g-breadcrumbs__toggle')
  add('subir', col(up), bgOf(up), 4.5)
  add('subir al pasar', tok('--g-color-on-neutral'), over(tok('--g-color-neutral-strong'), bgOf(f)), 4.5)
  add('divulgación', col(tg), bgOf(tg), 4.5)
  add('divulgación al pasar: marco', tok('--g-color-on-accent-soft'), bgOf(tg), 3)
  tg.click(); await wait(500)
  const st = f.querySelector('.g-breadcrumbs__stairs')
  for (const a of st.querySelectorAll('.g-breadcrumbs__link')) add(`escalera ${a.getAttribute('aria-current') ? 'actual' : a.matches('.g-breadcrumbs__link--text') ? 'sin página' : 'nivel'}`, col(a), bgOf(a), 4.5)
  const cur = st.querySelector('.is-current .g-breadcrumbs__link')
  add('escalera barra del actual', parse(getComputedStyle(cur).borderInlineStartColor), bgOf(st), 3)
  const g = st.querySelector('.g-breadcrumbs__stair + .g-breadcrumbs__stair')
  out.push({ k: 'escalera guía (estructura, no exigido)', r: ratio(over(parse(getComputedStyle(g, '::before').borderInlineStartColor), bgOf(st)), bgOf(st)), min: 0 })
  tg.click(); await wait(200)
  // Pista visual (tokens de GTooltip): texto sobre su fondo
  const tip = nav('chip').querySelector(':scope > .g-tooltip .g-tooltip__body')
  if (tip) add('pista visual', col(tip), bgOf(tip), 4.5)
  return out
})

const CONFIGS = [['por defecto', ''], ['auditoría', 'theme=auditoria'], ['propio', 'theme=propio'], ...(args.themes === 'quick' ? [] : GEN.map((g) => [g, 'theme=' + g]))]

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  const watch = (p) => { p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()) }); p.on('pageerror', (e) => errors.push(String(e))) }
  watch(page)
  const E = (m) => `[${engine}] ${m}`
  const OK = (c, m) => ok(c, E(m), engine)
  const TAB = engine === 'webkit' ? 'Alt+Tab' : 'Tab'
  const STAB = engine === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab'

  /* ---------- 1 · Marcado real en defecto, auditoría, oscuro, RTL y texto al 200 % ---------- */
  if (run(1)) {
    for (const qs of ['', '?theme=auditoria', '?dark=1', '?text=200', '?theme=auditoria&text=200']) {
      await load(page, qs)
      const bad = await page.evaluate(markup)
      OK(!bad.length, `marcado ${qs || 'defecto'}: ${bad.slice(0, 6).join(' · ')}`)
      const n = await page.evaluate(() => document.querySelectorAll('nav.g-breadcrumbs').length)
      OK(n >= 33, `marcado: ${n} migas en el banco`)
    }
  }

  /* ---------- 2 · Contraste en 28 configuraciones ---------- */
  if (run(2)) {
    const mins = {}
    for (const [name, t] of CONFIGS) {
      for (const dark of [false, true]) {
        const qs = '?' + [t, dark ? 'dark=1' : ''].filter(Boolean).join('&')
        await load(page, qs)
        const rows = await contrast(page)
        const tag = `${name}${dark ? ' oscuro' : ' claro'}`
        for (const r of rows) {
          const key = r.k.replace(/^(door|chip|bg720|p1100|p560) /, '')
          if (r.min) OK(r.r >= r.min, `${tag}: ${r.k} ${r.r} < ${r.min}`)
          mins[key] = Math.min(mins[key] ?? 99, r.r)
          if (['por defecto', 'auditoría', 'propio'].includes(name)) (mins['@' + tag] ||= {})[key] = Math.min(mins['@' + tag]?.[key] ?? 99, r.r)
        }
      }
    }
    if (engine === ENGINES[0]) {
      notes.push(`Contraste (mínimo en ${CONFIGS.length * 2} configuraciones): ` + JSON.stringify(Object.fromEntries(Object.entries(mins).filter(([k]) => !k.startsWith('@')))))
      for (const k of Object.keys(mins).filter((k) => k.startsWith('@'))) notes.push(k + ': ' + JSON.stringify(mins[k]))
    }
  }

  /* ---------- 3 · Geometría, etapas y estados ---------- */
  if (run(3)) {
    for (const qs of ['', '?dark=1', '?theme=auditoria', '?theme=propio', '?text=200', '?theme=auditoria&text=200']) {
      await load(page, qs)
      await page.waitForTimeout(200)
      const T = (m) => `${qs || 'por defecto'}: ${m}`
      const g = await page.evaluate(() => {
        const { nav, R, px, sw, swc } = window.__lib
        const o = { navs: {} }
        for (const n of document.querySelectorAll('nav.g-breadcrumbs')) {
          if (n.closest('dialog')) continue
          const id = n.id, r = R(n)
          const pieces = [...n.querySelectorAll(':scope > .g-breadcrumbs__list > .g-breadcrumbs__item, :scope > .g-breadcrumbs__face > *')]
          const out = pieces.filter((x) => { const q = R(x); return q.left < r.left - 0.5 || q.right > r.right + 0.5 })
          const root = n.querySelector('.g-breadcrumbs__item.is-root')
          const rl = root && root.querySelector(':scope > .g-breadcrumbs__link .g-breadcrumbs__label')
          const ctl = [...n.querySelectorAll(':scope > .g-breadcrumbs__list > li > a, :scope > .g-breadcrumbs__list > li > button, :scope > .g-breadcrumbs__face > *')]
          const targets = ctl.map((x) => R(x)).map((q) => Math.min(q.width, q.height))
          // Piezas que no caben en su caja: chevron de la puerta en su hueco, icono de la raíz en su círculo
          const spill = []
          for (const d of n.querySelectorAll(':scope > .g-breadcrumbs__list .g-breadcrumbs__door')) { const a = R(d), b = R(d.querySelector('svg')); if (b.width > a.width + 0.5 || b.height > a.height + 0.5) spill.push('puerta ' + a.width.toFixed(1) + '/' + b.width.toFixed(1)) }
          const ic = n.querySelector('.is-icon > .g-breadcrumbs__link')
          if (ic) { const a = R(ic), b = R(ic.querySelector('.g-breadcrumbs__icon')); if (b.width > a.width + 0.5 || Math.abs(a.width - a.height) > 0.5) spill.push('raíz icono ' + a.width.toFixed(1) + '×' + a.height.toFixed(1)) }
          // Ninguna pieza más alta que la fila (Δ0 lo exige: la fila y la cara miden lo mismo)
          const tall = ctl.filter((x) => R(x).height > r.height + 0.5).length
          o.navs[id] = { stage: n.dataset.stage, n: n.querySelectorAll(':scope > .g-breadcrumbs__list > .g-breadcrumbs__item').length, tab: ctl.filter((x) => x.matches('a[href], button')).length, out: out.length, h: r.height, rootHalf: !!(rl && !root.classList.contains('is-icon') && rl.scrollWidth > rl.clientWidth + 1), minTarget: Math.min(...targets), spill, tall, overflowX: getComputedStyle(n.querySelector(':scope > .g-breadcrumbs__list, :scope > .g-breadcrumbs__face')).overflowX }
        }
        o.hExpect = px('max(24px, calc(var(--g-space-1) * 7), var(--g-text-body-sm-line))')
        const chip = ['chip', 'p560', 'p720', 'd1100'].map(nav).find((n) => n.querySelector('.g-breadcrumbs__item[data-clipped]:not(.is-current)'))
        o.chips = chip ? [...chip.querySelectorAll(':scope > .g-breadcrumbs__list > .g-breadcrumbs__item')].map((li) => ({ clipped: li.hasAttribute('data-clipped'), cur: li.classList.contains('is-current'), icon: li.classList.contains('is-icon'), bg: getComputedStyle(li.querySelector(':scope > .g-breadcrumbs__link')).backgroundColor })) : []
        o.full = [...nav('p1100').querySelectorAll(':scope > .g-breadcrumbs__list > .g-breadcrumbs__item:not(.is-current):not([data-clipped])')].map((li) => getComputedStyle(li.querySelector(':scope > .g-breadcrumbs__link')).backgroundColor)
        o.nsBg = sw('var(--g-color-neutral-soft)'); o.asBg = sw('var(--g-color-accent-soft)')
        o.mid560 = [...nav('p560').querySelectorAll('.is-mid, .is-parent')].map((li) => { const l = li.querySelector(':scope > .g-breadcrumbs__link .g-breadcrumbs__label'); return !l || l.clientWidth + 0.5 >= Math.min(px('3ch', li), l.scrollWidth) - 1 })
        const dn = nav('door'), door = dn.querySelector('.g-breadcrumbs__door'), sep = dn.querySelector('.g-breadcrumbs__sep')
        const ds = getComputedStyle(door), ss = getComputedStyle(sep)
        o.door = { bg: ds.backgroundColor, sepBg: ss.backgroundColor, color: ds.color, sepColor: ss.color, cursor: ds.cursor, sepCursor: ss.cursor, w: R(door).width, h: R(door).height, muted: swc('var(--g-color-text-muted)'), subtle: swc('var(--g-color-text-subtle)') }
        const rn = nav('rtl720')
        const rr = R(rn.querySelector('.is-root')), rc = R(rn.querySelector('.is-current'))
        o.rtl = { sepScale: getComputedStyle(rn.querySelector('.g-breadcrumbs__sep')).scale, doorScale: getComputedStyle(rn.querySelector('.g-breadcrumbs__door svg')).scale, rootRight: rr.right > rc.right, ltrSepScale: getComputedStyle(nav('door').querySelector('.g-breadcrumbs__sep')).scale }
        // Pastillas: GBadge real al lado (forma distinta: la pastilla es un enlace sin borde, con su alto de fila)
        const bd = document.querySelector('#badges .g-badge'), pl = nav('chip').querySelector('[data-clipped] > .g-breadcrumbs__link')
        o.badge = bd && pl ? { bh: R(bd).height, ph: R(pl).height, pdec: getComputedStyle(pl).textDecorationLine, tag: pl.tagName } : null
        return o
      })
      const H = g.hExpect
      for (const [id, v] of Object.entries(g.navs)) {
        OK(v.out === 0, T(`${id}: ${v.out} piezas fuera del nav (${v.stage})`))
        OK(!v.rootHalf, T(`${id}: la raíz quedó a medias`))
        OK(v.minTarget >= 24 - 0.01, T(`${id}: objetivo < 24px (${v.minTarget})`))
        OK(near(v.h, H, 0.5), T(`${id}: alto ${v.h} ≠ ${H} (Δ0, ${v.stage})`))
        OK(!v.tall, T(`${id}: una pieza más alta que la fila`))
        OK(!v.spill.length, T(`${id}: pieza que no cabe en su caja ${v.spill}`))
        OK(v.overflowX === 'visible', T(`${id}: con is-ready la fila recorta (${v.overflowX})`))
      }
      const N = g.navs
      if (!qs) {
        for (const id of ['p1100', 'p720', 'p560', 'p480']) OK(N[id].stage === 'liquid' && N[id].n === 6, T(`${id}: ${N[id].stage} con ${N[id].n} niveles (se espera liquid, 6)`))
        for (const id of ['p560', 'p400']) OK(N[id].stage !== 'step' && N[id].n === 6 && N[id].tab === 5, T(`${id}: seis de seis en la fila y 5 enlaces en el Tab (${N[id].stage}, ${N[id].n}, ${N[id].tab})`))
        OK(['root-icon', 'shrink'].includes(N.p400.stage), T(`p400: ${N.p400.stage}`))
      }
      if (!qs.includes('text')) for (const id of ['p260', 'p240', 'rtl260']) OK(N[id].stage === 'step' && N[id].tab === 2, T(`${id}: ${N[id].stage}, ${N[id].tab} paradas (step con 2)`))
      OK(N['face-noup'].stage !== 'step' || N['face-noup'].tab === 1, T('face-noup: «Subir» sin antepasado con página'))
      OK(N.one.n === 1 && N['one-narrow'].out === 0, T('un nivel: desborda a 120px'))
      OK(g.mid560.every(Boolean), T('p560: pastilla con menos de 3ch de nombre a la vista'))
      if (g.chips.length) OK(g.chips.some((c) => c.clipped && !c.cur) && g.chips.every((c) => c.cur ? c.bg === g.asBg : c.clipped ? c.bg === g.nsBg : c.icon || c.bg === 'rgba(0, 0, 0, 0)'), T('pastillas: fondo neutral-soft solo si recorta, accent-soft el actual'))
      OK(g.full.every((b) => b === 'rgba(0, 0, 0, 0)'), T('un nombre entero lleva fondo'))
      OK(g.door.bg === g.nsBg && g.door.sepBg === 'rgba(0, 0, 0, 0)', T('puerta en reposo: hueco neutral-soft y separador sin fondo'))
      OK(g.door.color === g.door.muted && g.door.sepColor === g.door.subtle && g.door.color !== g.door.sepColor, T('puerta en reposo: text-muted frente al text-subtle del separador'))
      OK(g.door.cursor === 'pointer' && g.door.sepCursor !== 'pointer', T('puerta: cursor pointer; separador, no'))
      OK(g.door.w >= 24 && near(g.door.w, g.door.h), T(`puerta: ${g.door.w}×${g.door.h} (≥ 24, redonda)`))
      OK(g.rtl.sepScale === '-1 1' && g.rtl.doorScale === '-1 1' && g.rtl.rootRight && g.rtl.ltrSepScale === 'none', T('RTL: chevrons espejados y raíz a la derecha ' + JSON.stringify(g.rtl)))
      if (g.badge) OK(g.badge.tag === 'A' && g.badge.ph >= 24, T('pastilla frente a GBadge ' + JSON.stringify(g.badge)))
      if (engine === ENGINES[0] && (qs === '' || qs.includes('auditoria'))) notes.push(`Etapas ${qs || 'defecto'}: ` + Object.entries(N).filter(([k]) => /^(p|d)\d/.test(k)).map(([k, v]) => `${k} ${v.stage}`).join(' · ') + ` · alto ${H}`)
    }
  }

  /* ---------- 4 · Barrido de ancho 1100 → 200 → 1100 (LTR y RTL): etapas en orden, Δ0, nada fuera ---------- */
  if (run(4)) {
    for (const qs of ['', '?theme=auditoria']) {
      await load(page, qs)
      for (const rtl of [false, true]) {
        const r = await page.evaluate(async (rtl) => {
          const { nav, R, raf2 } = window.__lib
          const ORDER = ['liquid', 'root-icon', 'shrink', 'step']
          const res = {}
          for (const id of ['sweep', 'sweep-p']) {
            const n = nav(id), fr = n.closest('.frame')
            fr.dir = rtl ? 'rtl' : ''
            const seen = [], hs = new Set(), bad = []
            let back = null
            const ws = []
            for (let w = 1100; w >= 200; w -= 10) ws.push(w)
            for (let w = 210; w <= 1100; w += 30) ws.push(w)
            let down = true, last = -1
            for (const w of ws) {
              if (down && w > last && last > 0) down = false
              last = w
              fr.style.inlineSize = w + 'px'
              await raf2(); await raf2()
              const st = n.dataset.stage, rr = R(n)
              hs.add(rr.height.toFixed(2))
              const out = [...n.querySelectorAll(':scope > .g-breadcrumbs__list > .g-breadcrumbs__item, :scope > .g-breadcrumbs__face > *')].filter((x) => R(x).left < rr.left - 0.5 || R(x).right > rr.right + 0.5).length
              if (out) bad.push(`${w}:${out} fuera`)
              if (down) { if (seen.length && ORDER.indexOf(st) < ORDER.indexOf(seen[seen.length - 1])) bad.push(`${w}: vuelve de ${seen[seen.length - 1]} a ${st} al estrechar`); if (seen[seen.length - 1] !== st) seen.push(st) }
              else back = st
            }
            res[id] = { seen, hs: [...hs], bad, back }
            fr.dir = ''
            fr.style.inlineSize = '1100px'
            await raf2(); await raf2()
          }
          return res
        }, rtl)
        for (const [id, v] of Object.entries(r)) {
          const T = (m) => `barrido ${qs || 'defecto'} ${rtl ? 'RTL' : 'LTR'} ${id}: ${m}`
          OK(!v.bad.length, T(v.bad.slice(0, 4).join(' · ')))
          OK(v.hs.length === 1, T(`altos ${v.hs} (Δ0)`))
          OK(v.seen[0] === 'liquid' && v.seen[v.seen.length - 1] === 'step' && v.back === 'liquid', T(`etapas ${v.seen} → vuelta ${v.back}`))
          if (engine === ENGINES[0] && !rtl) notes.push(`Barrido ${qs || 'defecto'} ${id}: ${v.seen.join(' → ')}`)
        }
      }
    }
  }

  /* ---------- 5 · Paneles reales: puerta y escalera ---------- */
  if (run(5)) {
    await load(page, '')
    const T = (m) => `paneles: ${m}`
    // Al pasar: marco interior border-control
    const door = page.locator('#door .g-breadcrumbs__door').nth(1)
    await door.scrollIntoViewIfNeeded()
    await door.hover()
    await page.waitForTimeout(300)
    const hv = await door.evaluate((d) => ({ sh: getComputedStyle(d).boxShadow, c: getComputedStyle(d).color, bc: window.__lib.swc('var(--g-color-border-control)'), tx: window.__lib.swc('var(--g-color-text)') }))
    OK(hv.sh.includes(hv.bc) && hv.sh.includes('inset') && hv.c === hv.tx, T('puerta al pasar sin marco border-control o sin text ' + JSON.stringify(hv)))
    await page.mouse.move(0, 0)
    for (const id of ['door', 'rtl720', 'hdr']) {
      const r = await page.evaluate(async (id) => {
        const { nav, R, px, sw, wait, panelOf } = window.__lib
        const d = nav(id).querySelector('.g-breadcrumbs__door')
        d.scrollIntoView({ block: 'center' })
        await wait(60)
        d.click()
        await wait(450)
        const p = panelOf(d)
        const pr = R(p), dr = R(d)
        const hit = document.elementFromPoint(pr.left + pr.width / 2, pr.top + Math.min(pr.height / 2, 20))
        const rtl = getComputedStyle(d).direction === 'rtl'
        const out = { open: p.matches(':popover-open'), exp: d.getAttribute('aria-expanded'), top: !!(hit && p.contains(hit)), below: pr.top >= dr.bottom - 0.5, side: p.dataset.side, align: rtl ? Math.abs(pr.right - dr.right) : Math.abs(pr.left - dr.left), bg: getComputedStyle(d).backgroundColor, as: sw('var(--g-color-accent-soft)'), rot: getComputedStyle(d.querySelector('svg')).rotate, w: pr.width, wMin: px('calc(var(--g-space-1) * 48)'), surf: getComputedStyle(p).backgroundColor === sw('var(--g-color-surface)'), links: [...p.querySelectorAll('.g-breadcrumbs__link')].map((a) => R(a).height), max: p.style.getPropertyValue('--_max'), inNav: nav(id).contains(p) }
        d.click()
        await wait(300)
        out.closed = !p.matches(':popover-open') && d.getAttribute('aria-expanded') === 'false' && getComputedStyle(d.querySelector('svg')).rotate
        return out
      }, id)
      OK(r.open && r.exp === 'true' && r.top && r.below && r.side === 'bottom' && r.inNav, T(`${id}: panel abierto en la capa superior, debajo de la puerta y dentro del nav ` + JSON.stringify(r)))
      OK(r.align < 1, T(`${id}: panel no alineado al inicio de la puerta (${r.align})`))
      OK(r.bg === r.as, T(`${id}: puerta abierta sin accent-soft`))
      OK(r.rot === (id === 'rtl720' ? '-90deg' : '90deg'), T(`${id}: giro de la puerta abierta ${r.rot}`))
      OK(r.w >= r.wMin - 0.5 && r.surf && /px$/.test(r.max), T(`${id}: panel ${r.w}px (≥ space × 48) sobre surface con --_max`))
      OK(r.links.every((h) => h >= 24), T(`${id}: enlaces del panel < 24px`))
      OK(r.closed === 'none' || r.closed === '0deg', T(`${id}: al cerrar, la puerta vuelve (${r.closed})`))
    }
    // Teclado: ↓ al hijo de la ruta, ↑/↓/Inicio/Fin circulares, Esc vuelve, Tab sale y cierra, uno abierto a la vez,
    // pulsar fuera cierra sin mover el foco
    const k = await page.evaluate(async () => {
      const { nav, wait, panelOf } = window.__lib
      const n = nav('door'), ds = [...n.querySelectorAll('.g-breadcrumbs__door')]
      n.scrollIntoView({ block: 'center' })
      await wait(60)
      return { n: ds.length }
    })
    const d3 = page.locator('#door > .g-breadcrumbs__list .g-breadcrumbs__door').nth(2)
    await d3.focus()
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(250)
    const kb = { route: await page.evaluate(() => { const a = document.activeElement; return { cur: a.getAttribute('aria-current'), txt: a.textContent.trim(), inPanel: !!a.closest('.g-breadcrumbs__panel') } }) }
    await page.keyboard.press('ArrowDown')
    kb.next = await page.evaluate(() => document.activeElement.textContent.trim())
    await page.keyboard.press('End')
    kb.end = await page.evaluate(() => document.activeElement.textContent.trim())
    await page.keyboard.press('ArrowDown')
    kb.wrap = await page.evaluate(() => document.activeElement.textContent.trim())
    await page.keyboard.press('Home')
    kb.home = await page.evaluate(() => document.activeElement.textContent.trim())
    await page.keyboard.press('ArrowUp')
    kb.up = await page.evaluate(() => document.activeElement.textContent.trim())
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)
    kb.esc = await page.evaluate(() => { const a = document.activeElement; return { door: a.classList.contains('g-breadcrumbs__door'), exp: a.getAttribute('aria-expanded'), open: !!document.querySelector('#door .g-breadcrumbs__panel:popover-open') } })
    OK(kb.route.cur === 'true' && kb.route.txt === 'Lote 2026-0412' && kb.route.inPanel, T('↓ en la puerta no lleva al hijo de la ruta ' + JSON.stringify(kb.route)))
    OK(kb.next === 'Lote 2026-0413' && kb.end === 'Lote 2026-0414' && kb.wrap === 'Lote 2026-0409' && kb.home === 'Lote 2026-0409' && kb.up === 'Lote 2026-0414', T('↑/↓/Inicio/Fin en el panel ' + JSON.stringify(kb)))
    OK(kb.esc.door && kb.esc.exp === 'false' && !kb.esc.open, T('Esc no cierra o no devuelve el foco a la puerta'))
    // Tab dentro del panel: recorre sus enlaces y, desde el último, sale y cierra
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(150)
    await page.keyboard.press(TAB)
    await page.waitForTimeout(80)
    const tabIn = await page.evaluate(() => ({ inPanel: !!document.activeElement.closest('.g-breadcrumbs__panel'), open: !!document.querySelector('#door .g-breadcrumbs__panel:popover-open') }))
    OK(tabIn.inPanel && tabIn.open, T('Tab dentro del panel no pasa al enlace siguiente ' + JSON.stringify(tabIn)))
    await page.keyboard.press('End')
    await page.keyboard.press(TAB)
    await page.waitForTimeout(200)
    const tb = await page.evaluate(() => ({ open: !!document.querySelector('#door .g-breadcrumbs__panel:popover-open'), out: !document.activeElement.closest('.g-breadcrumbs__panel'), at: document.activeElement.textContent.trim(), exp: [...document.querySelectorAll('#door > .g-breadcrumbs__list .g-breadcrumbs__door')][2].getAttribute('aria-expanded') }))
    OK(!tb.open && tb.out && tb.exp === 'false', T('Tab dentro del panel no sale o no cierra ' + JSON.stringify(tb)))
    // Uno a la vez + pulsar fuera sin mover el foco
    const one = await page.evaluate(async () => {
      const { wait, panelOf } = window.__lib
      const ds = [...document.querySelectorAll('#door .g-breadcrumbs__door')]
      ds[0].click(); await wait(200)
      ds[1].click(); await wait(200)
      const o = { open: [...document.querySelectorAll('#door .g-breadcrumbs__panel')].filter((p) => p.matches(':popover-open')).length, first: ds[0].getAttribute('aria-expanded'), second: ds[1].getAttribute('aria-expanded') }
      ds[1].focus()
      return o
    })
    // Pulsar en el margen de la página (body), a la altura de las migas
    const yy = await page.evaluate(() => { const r = document.getElementById('door').getBoundingClientRect(); return r.top + r.height / 2 })
    await page.mouse.click(2, yy)
    await page.waitForTimeout(200)
    const outside = await page.evaluate(() => ({ open: [...document.querySelectorAll('#door .g-breadcrumbs__panel')].filter((p) => p.matches(':popover-open')).length, exp: [...document.querySelectorAll('#door .g-breadcrumbs__door')][1].getAttribute('aria-expanded') }))
    OK(one.open === 1 && one.first === 'false' && one.second === 'true', T('más de un panel abierto ' + JSON.stringify(one)))
    OK(outside.open === 0 && outside.exp === 'false', T('pulsar fuera no cierra ' + JSON.stringify(outside)))
    // El ancla que sale del visor cierra sin devolver el foco (#358 regla 3); el vaivén no cambia de lado (regla 1)
    const gone = await page.evaluate(async () => {
      const { nav, wait, panelOf, R } = window.__lib
      const d = nav('d1100').querySelector('.g-breadcrumbs__door')
      d.scrollIntoView({ block: 'center' }); await wait(80)
      d.click(); await wait(300)
      const p = panelOf(d)
      const sides = []
      for (const dy of [20, -20, 20, -20]) { scrollBy(0, dy); await wait(60); sides.push(p.dataset.side + ':' + p.style.getPropertyValue('--_max')) }
      const follows = Math.abs(R(p).top - R(d).bottom) < 12
      scrollBy(0, innerHeight + R(d).top); await wait(250)
      return { sides, follows, open: p.matches(':popover-open'), exp: d.getAttribute('aria-expanded'), focusBody: document.activeElement === document.body || !nav('d1100').contains(document.activeElement) }
    })
    OK(new Set(gone.sides).size === 1 && gone.follows, T('vaivén de ±20px cambia de lado o de --_max, o el panel no sigue ' + JSON.stringify(gone)))
    OK(!gone.open && gone.exp === 'false', T('el ancla salió del visor y el panel sigue abierto ' + JSON.stringify(gone)))
    // Escalera: sangría, barra, guías, chevron, retardos; ↓ al primer escalón
    await load(page, '')
    for (const id of ['face260', 'rtl260']) {
      const s = await page.evaluate(async (id) => {
        const { nav, R, px, swc, dur, wait } = window.__lib
        const n = nav(id)
        const t = n.querySelector('.g-breadcrumbs__toggle')
        t.scrollIntoView({ block: 'center' })
        await wait(60)
        t.click()
        await wait(20)
        const st = n.querySelector('.g-breadcrumbs__stairs')
        const lis = [...st.querySelectorAll('.g-breadcrumbs__stair')]
        const delays = lis.map((li) => { const a = li.getAnimations().find((x) => x.animationName); return a ? { name: a.animationName, delay: a.effect.getTiming().delay } : null })
        await wait(600)
        const rtl = getComputedStyle(n).direction === 'rtl'
        const xs = lis.map((li) => { const a = R(li.querySelector('.g-breadcrumbs__link')); return rtl ? a.right : a.left })
        const cur = st.querySelector('.is-current .g-breadcrumbs__link')
        const tr = R(t), sr = R(st)
        const out = { xs, step: px('calc(var(--g-space-1) * 4)', n), delays, bar: getComputedStyle(cur).borderInlineStartColor === swc('var(--g-color-accent-text)'), weight: getComputedStyle(cur).fontWeight, base: getComputedStyle(st.querySelector('.g-breadcrumbs__link')).fontWeight, guides: lis.slice(1).every((li) => getComputedStyle(li, '::before').content !== 'none'), rot: getComputedStyle(t.querySelector('.g-breadcrumbs__chevron')).rotate, fast: dur('--g-duration-fast'), wrap: getComputedStyle(st.querySelector('.g-breadcrumbs__label')).whiteSpace, below: sr.top >= tr.bottom - 0.5, side: st.dataset.side, inView: sr.left >= -0.5 && sr.right <= document.documentElement.clientWidth + 0.5 }
        t.click(); await wait(250)
        return out
      }, id)
      const d = s.xs.slice(1).map((x, i) => (id.startsWith('rtl') ? s.xs[i] - x : x - s.xs[i]))
      OK(d.every((v) => near(v, s.step, 1)), T(`${id}: sangría por nivel ${d} ≠ ${s.step}`))
      OK(s.bar && +s.weight > +s.base && s.guides, T(`${id}: escalón actual sin barra/peso o sin guías`))
      OK(s.rot === '180deg' && s.wrap === 'normal', T(`${id}: chevron ${s.rot} o nombres que no se parten`))
      OK(s.below && s.side === 'bottom' && s.inView, T(`${id}: escalera fuera de sitio ` + JSON.stringify(s)))
      OK(s.delays.every((x, i) => x && x.name === 'g-breadcrumbs-stair' && near(x.delay, (s.fast * Math.min(i, 4)) / 4, 1)), T(`${id}: retardos de la escalera ${JSON.stringify(s.delays)}`))
    }
    const tg = page.locator('#face260 .g-breadcrumbs__toggle')
    await tg.focus()
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(200)
    const sd = await page.evaluate(() => { const a = document.activeElement; return { first: !!a.closest('.g-breadcrumbs__stair') && a === document.querySelector('#face260 .g-breadcrumbs__stairs a[href]') } })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)
    const se = await page.evaluate(() => document.activeElement.classList.contains('g-breadcrumbs__toggle') && !document.querySelector('#face260 .g-breadcrumbs__stairs:popover-open'))
    OK(sd.first && se, T('escalera: ↓ al primer escalón o Esc ' + JSON.stringify(sd)))
    // Lado al pie del visor: hijos largos que se parten (el alto previsto se queda corto). Registro de la entrada
    const lowAt = (room) => page.evaluate(async (room) => {
      const { nav, R, wait, panelOf } = window.__lib
      const d = nav('low').querySelector('.g-breadcrumbs__door')
      const r0 = R(d)
      scrollBy(0, r0.bottom - innerHeight + room); await wait(120)
      const p = panelOf(d)
      const sides = []
      const mo = new MutationObserver((ms) => { for (const m of ms) sides.push(p.getAttribute('data-side')) })
      mo.observe(p, { attributes: true, attributeFilter: ['data-side'] })
      d.click()
      const tr = p.getAnimations().find((a) => a.transitionProperty === 'translate')
      const kf = tr ? tr.effect.getKeyframes() : []
      await wait(0); mo.disconnect()
      await wait(400)
      const pr = R(p), dr = R(d)
      const o = { room, sides, side: p.dataset.side, above: pr.bottom <= dr.top + 0.5, below: pr.top >= dr.bottom - 0.5, inView: pr.top >= -0.5 && pr.bottom <= innerHeight + 0.5, from: kf[0] && kf[0].translate, h: Math.round(pr.height), scroll: p.scrollHeight > p.clientHeight + 1 }
      // La entrada debe venir del lado del disparador: desde arriba (−space) si el panel va debajo, desde abajo si va encima
      o.fromOk = !o.from || (o.side === 'top' ? !/-/.test(o.from) : /-/.test(o.from))
      d.click(); await wait(200)
      return o
    }, room)
    for (const room of [140, 185, 230]) {
      const low = await lowAt(room)
      OK(low.inView && ((low.side === 'top' && low.above) || (low.side === 'bottom' && low.below)), T('panel al pie del visor fuera de la vista o del lado equivocado ' + JSON.stringify(low)))
      notes.push(`[${engine}] ${low.fromOk ? '' : 'HALLAZGO 3 · '}Panel al pie del visor (hijos de varias líneas, ${room}px bajo la puerta): ` + JSON.stringify(low))
    }
  }

  /* ---------- 6 · Pista visual (motor del tooltip, modo visual) ---------- */
  if (run(6)) {
    await load(page, '')
    const T = (m) => `pista: ${m}`
    const tipOpen = (sel) => page.evaluate((sel) => { const n = document.querySelector(sel).closest('nav'); return [...n.querySelectorAll(':scope > .g-tooltip')].filter((t) => t.matches(':popover-open')).map((t) => t.textContent.trim()) }, sel)
    const hover = async (sel) => {
      await page.mouse.move(2, 2)
      await page.waitForTimeout(700)
      const l = page.locator(sel).first()
      await l.scrollIntoViewIfNeeded()
      const b = await l.boundingBox()
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
      await page.waitForTimeout(120)
      const early = await tipOpen(sel)
      await page.waitForTimeout(450)
      return { early, late: await tipOpen(sel) }
    }
    // Recortado (pastilla en medio): abre a los 350 ms con el nombre entero
    const clipSel = await page.evaluate(() => { const li = [...document.querySelectorAll('#p560 .g-breadcrumbs__item.is-mid[data-clipped]')][0]; li.querySelector('a').dataset.t = 'clip'; return li.querySelector('.g-breadcrumbs__label').textContent })
    const h1 = await hover('#p560 [data-t="clip"]')
    OK(!h1.early.length && h1.late.length === 1 && h1.late[0] === clipSel, T('lo recortado no abre a los 350 ms con su nombre ' + JSON.stringify(h1)))
    // Nombre entero: nunca
    await page.evaluate(() => { document.querySelector('#p1100 .is-mid > a').dataset.t = 'whole' })
    const h2 = await hover('#p1100 [data-t="whole"]')
    OK(!h2.late.length, T('un nombre que cabe abre pista ' + JSON.stringify(h2)))
    // Raíz en solo icono
    const h3 = await hover('#p400 .is-icon > a')
    OK(h3.late.length === 1 && h3.late[0] === 'Inicio', T('raíz en solo icono sin pista ' + JSON.stringify(h3)))
    // Puerta: siempre, con labels.children
    const h4 = await hover('#door .g-breadcrumbs__door')
    OK(h4.late.length === 1 && h4.late[0] === 'Otras páginas en Inicio', T('puerta sin pista ' + JSON.stringify(h4)))
    // Abrir el panel cierra la pista
    await page.locator('#door .g-breadcrumbs__door').first().click()
    await page.waitForTimeout(250)
    const h4b = await tipOpen('#door .g-breadcrumbs__door')
    OK(!h4b.length, T('abrir el panel no cierra la pista ' + JSON.stringify(h4b)))
    await page.locator('#door .g-breadcrumbs__door').first().click()
    // Cara de B: «Subir» y la divulgación, recortadas
    const fc = await page.evaluate(() => { const f = document.getElementById('face240'); const c = (s) => { const l = f.querySelector(s + ' .g-breadcrumbs__label'); return l.scrollWidth > l.clientWidth + 1 } ; return { up: c('.g-breadcrumbs__up'), tg: c('.g-breadcrumbs__toggle') } })
    const h5 = await hover('#face240 .g-breadcrumbs__toggle')
    OK(fc.tg ? h5.late.length === 1 && h5.late[0] === 'Muestra M-0007' : !h5.late.length, T('divulgación: pista ' + JSON.stringify({ fc, h5 })))
    const h6 = await hover('#face240 .g-breadcrumbs__up')
    OK(fc.up ? h6.late.length === 1 : !h6.late.length, T('«Subir»: pista ' + JSON.stringify({ fc, h6 })))
    // Nodos de la pista: aria-hidden, fuera del ol, del texto del nivel (no del aria-label)
    await page.mouse.move(2, 2)
    await page.waitForTimeout(600)
    // Teclado: Tab a la puerta → pista al instante; Esc la cierra sin mover el foco
    await page.evaluate(() => { const n = document.getElementById('door'); n.scrollIntoView({ block: 'center' }); n.querySelector('.is-root > a').focus() })
    await page.keyboard.press(TAB)
    await page.waitForTimeout(80)
    const k1 = await page.evaluate(() => ({ door: document.activeElement.classList.contains('g-breadcrumbs__door'), tips: [...document.querySelectorAll('#door > .g-tooltip')].filter((t) => t.matches(':popover-open')).map((t) => t.textContent.trim()) }))
    OK(k1.door && k1.tips.length === 1 && k1.tips[0] === 'Otras páginas en Inicio', T('Tab a la puerta: sin pista inmediata ' + JSON.stringify(k1)))
    await page.keyboard.press('Escape')
    await page.waitForTimeout(80)
    const k2 = await page.evaluate(() => ({ door: document.activeElement.classList.contains('g-breadcrumbs__door'), tips: [...document.querySelectorAll('#door > .g-tooltip')].filter((t) => t.matches(':popover-open')).length }))
    OK(k2.door && !k2.tips, T('Esc no cierra la pista o mueve el foco ' + JSON.stringify(k2)))
    // Tab a una pastilla recortada: se despliega; la pista solo si ni desplegada cabe
    await page.evaluate(() => { const n = document.getElementById('p560'); n.scrollIntoView({ block: 'center' }); n.querySelector('.is-root > a').focus() })
    const unf = []
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press(TAB)
      await page.waitForTimeout(60)
      unf.push(await page.evaluate(() => { const a = document.activeElement, l = a.querySelector('.g-breadcrumbs__label'); const n = a.closest('nav'); return { fv: a.matches(':focus-visible'), cut: l.scrollWidth > l.clientWidth + 1, tip: [...n.querySelectorAll(':scope > .g-tooltip')].filter((t) => t.matches(':popover-open')).length, clipped: a.parentElement.hasAttribute('data-clipped') } }))
    }
    OK(unf.every((u) => u.fv && (u.cut ? u.tip === 1 : u.tip === 0)), T('Tab por la fila: pista solo si ni desplegado cabe ' + JSON.stringify(unf)))
    if (engine === ENGINES[0]) notes.push('Tab por p560 (desplegado / recortado / pista): ' + unf.map((u) => `${u.cut ? 'recortado' : 'entero'}·${u.tip}`).join(' '))
    await page.evaluate(() => document.activeElement.blur())
  }

  /* ---------- 7 · Despliegue por teclado (sin animar el tamaño, anillo visible) ---------- */
  if (run(7)) {
    await load(page, '')
    const T = (m) => `despliegue: ${m}`
    await page.evaluate(() => { const n = document.getElementById('p560'); n.scrollIntoView({ block: 'center' }); n.querySelector('.is-root > a').focus() })
    await page.keyboard.press(TAB)
    await raf2(page)
    const uf = await page.evaluate(() => {
      const { R } = window.__lib
      const a = document.activeElement, li = a.parentElement, l = a.querySelector('.g-breadcrumbs__label'), n = a.closest('nav')
      const r = R(n)
      return { fv: a.matches(':focus-visible'), seen: l.clientWidth / l.scrollWidth, anims: n.getAnimations({ subtree: true }).filter((x) => !(x instanceof CSSTransition) || /width|flex|inline-size/.test(x.transitionProperty)).length, outline: getComputedStyle(a).outlineStyle, ow: parseFloat(getComputedStyle(a).outlineWidth), out: [...n.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item')].filter((x) => R(x).right > r.right + 0.5 || R(x).left < r.left - 0.5).length, z: getComputedStyle(li).zIndex, clipList: getComputedStyle(n.querySelector('.g-breadcrumbs__list')).overflowX, wasClipped: li.hasAttribute('data-clipped') }
    })
    OK(uf.fv && uf.seen >= 0.9, T('el nombre no se ve (casi) entero ' + JSON.stringify(uf)))
    OK(uf.anims === 0, T('anima el tamaño'))
    OK(uf.outline === 'solid' && uf.ow >= 2 && uf.clipList === 'visible' && uf.z === '2' && uf.out === 0, T('anillo no visible, tapable o desborde ' + JSON.stringify(uf)))
    if (engine === ENGINES[0]) notes.push(`Despliegue por foco a 560px: ${(uf.seen * 100).toFixed(1)} % del nombre a la vista`)
    // El foco se conserva por nivel al cambiar de etapa (ancho)
    const fk = await page.evaluate(async () => {
      const { wait } = window.__lib
      const n = document.getElementById('p720'), fr = n.closest('.frame')
      n.scrollIntoView({ block: 'center' })
      const lis = n.querySelectorAll('.g-breadcrumbs__item')
      lis[4].querySelector('a').focus()
      fr.style.inlineSize = '260px'; await wait(150)
      const a1 = document.activeElement, s1 = n.dataset.stage
      const step = a1.classList.contains('g-breadcrumbs__up') && a1.closest('nav') === n
      fr.style.inlineSize = '720px'; await wait(150)
      const a2 = document.activeElement
      return { a1: a1.className + ' ' + a1.textContent.trim(), s1, step, back: a2.closest('nav') === n && a2.textContent.trim() === 'Lote 2026-0412', s2: n.dataset.stage }
    })
    OK(fk.s1 === 'step' && fk.step && fk.back && fk.s2 === 'liquid', T('el foco no se conserva por nivel al cambiar de etapa ' + JSON.stringify(fk)))
  }

  /* ---------- 8 · Bajar y subir (SPA real) y cambio de etapa ---------- */
  if (run(8)) {
    await load(page, '')
    const T = (m) => `movimiento: ${m}`
    const mv = await page.evaluate(async () => {
      const { nav, R, dur, px, wait } = window.__lib
      const n = nav('spa')
      n.scrollIntoView({ block: 'center' })
      await wait(60)
      const before = document.getAnimations().filter((a) => !(a instanceof CSSTransition) && n.contains(a.effect.target)).length
      const t0 = performance.now()
      window.__spa.down()
      await new Promise((r) => requestAnimationFrame(r))
      const li = [...n.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item')].pop()
      const an = li.getAnimations().filter((a) => a.animationName)
      const enter = an.find((a) => a.animationName === 'g-breadcrumbs-enter')
      const fade = an.find((a) => a.animationName === 'g-breadcrumbs-enter-fade')
      const o = { before, entering: li.classList.contains('is-entering'), current: li.querySelector('[aria-current="page"]') !== null, others: n.querySelectorAll('[aria-current="page"]').length, names: an.map((a) => a.animationName), dE: enter && enter.effect.getTiming().duration, dF: fade && fade.effect.getTiming().duration, ease: getComputedStyle(li).animationTimingFunction, z: getComputedStyle(li).zIndex }
      if (enter) { const ct = enter.currentTime; enter.pause(); enter.currentTime = 0; o.x0 = getComputedStyle(li).translate; enter.currentTime = enter.effect.getTiming().duration * 0.4; o.xMid = getComputedStyle(li).translate; enter.currentTime = ct; enter.play() }
      while (li.classList.contains('is-entering') && performance.now() - t0 < 2000) await new Promise((r) => requestAnimationFrame(r))
      o.enterMs = Math.round(performance.now() - t0)
      o.settled = getComputedStyle(li).translate
      const nBefore = n.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item').length
      const t1 = performance.now()
      window.__spa.up()
      await new Promise((r) => requestAnimationFrame(r))
      const copy = n.querySelector('.g-breadcrumbs__item.is-leaving')
      o.copy = !!copy
      if (copy) {
        const a = copy.getAnimations().find((x) => x.animationName === 'g-breadcrumbs-leave')
        o.leave = a && a.effect.getTiming().duration
        o.copyW = R(copy).width
        o.copyInert = copy.inert && copy.getAttribute('aria-hidden') === 'true' && !copy.querySelector('[id]') && !copy.querySelector('[aria-controls]')
        o.copyCur = copy.classList.contains('is-current')
        o.listClip = getComputedStyle(copy.parentElement).overflowX
        o.copyPe = getComputedStyle(copy).pointerEvents
        o.newCur = [...n.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item:not(.is-leaving)')].pop().querySelector('[aria-current="page"]') !== null
      }
      while (n.querySelector('.is-leaving') && performance.now() - t1 < 2000) await new Promise((r) => requestAnimationFrame(r))
      o.leaveMs = Math.round(performance.now() - t1)
      o.nAfter = n.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item').length
      o.nBefore = nBefore
      o.press = dur('--g-duration-press'); o.slow = dur('--g-duration-slow'); o.space = px('var(--g-space-1)')
      // Cualquier otro cambio, sin animación (L13)
      window.__spa.set([{ label: 'Otra', href: '#otra' }, { label: 'Ruta', href: '#ruta' }])
      await new Promise((r) => requestAnimationFrame(r))
      o.other = !!n.querySelector('.is-entering, .is-leaving')
      window.__spa.set([{ label: 'Inicio', href: '#inicio', icon: 'house' }, { label: 'Laboratorio central', href: '#lab' }, { label: 'Muestras', href: '#muestras' }, { label: '2026' }])
      await wait(50)
      return o
    })
    OK(mv.before === 0, T('al cargar hay animaciones en la fila (nada al montar)'))
    OK(mv.entering && mv.current && mv.others === 1 && mv.names.includes('g-breadcrumbs-enter') && mv.names.includes('g-breadcrumbs-enter-fade'), T('bajar: sin las dos animaciones de entrada o aria-current tarde ' + JSON.stringify(mv)))
    OK(near(mv.dE, mv.slow, 1) && near(mv.dF, mv.press, 1), T(`bajar: duraciones ${mv.dE}/${mv.dF}`))
    OK(/linear\(/.test(mv.ease || ''), T(`bajar: sin --g-ease-spring (${mv.ease})`))
    OK(mv.x0 === `${-3 * mv.space}px` || mv.x0 === `${-3 * mv.space}px 0px`, T(`bajar: parte de ${mv.x0}`))
    OK(mv.xMid !== mv.x0 && mv.xMid !== 'none', T(`bajar: sin posición intermedia (${mv.xMid})`))
    OK(mv.z === '0' && (mv.settled === 'none' || /^0px/.test(mv.settled)), T('bajar: no va detrás o no termina en su sitio'))
    OK(mv.enterMs <= mv.slow + 400 + 100, T(`bajar: is-entering se retira a los ${mv.enterMs} ms`))
    OK(mv.copy && near(mv.leave, mv.press, 1) && mv.copyW === 0 && mv.copyInert && mv.copyCur && mv.listClip === 'clip' && mv.copyPe === 'none' && mv.newCur, T('subir: copia saliente ' + JSON.stringify(mv)))
    OK(mv.leaveMs <= mv.press + 400 + 100 && mv.nAfter === mv.nBefore - 1, T(`subir: la copia se retira a los ${mv.leaveMs} ms`))
    OK(!mv.other, T('un cambio que no es bajar ni subir se anima'))
    notes.push(`[${engine}] bajar: is-entering ${mv.enterMs} ms (slow ${mv.slow} · respaldo ${mv.slow + 400}); subir: copia ${mv.leaveMs} ms (press ${mv.press} · respaldo ${mv.press + 400})`)
    const sc = await page.evaluate(async () => {
      const { nav, wait } = window.__lib
      const n = nav('p720'), fr = n.closest('.frame')
      const moving = () => n.getAnimations({ subtree: true }).filter((x) => !(x instanceof CSSTransition) || !/color|background|box-shadow|opacity/.test(x.transitionProperty)).length
      fr.style.inlineSize = '300px'; await wait(120)
      const s1 = n.dataset.stage, a = moving()
      fr.style.inlineSize = '720px'; await wait(120)
      return { s1, s2: n.dataset.stage, a, b: moving() }
    })
    OK(sc.s1 === 'step' && sc.s2 === 'liquid' && sc.a === 0 && sc.b === 0, T('cambio de etapa animado o no cambia ' + JSON.stringify(sc)))
  }

  /* ---------- 9 · Movimiento reducido ---------- */
  if (run(9)) {
    const c2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
    const p2 = await c2.newPage()
    watch(p2)
    await load(p2, '')
    const r = await p2.evaluate(async () => {
      const { nav, dur, wait } = window.__lib
      window.__spa.down()
      await new Promise((r) => requestAnimationFrame(r))
      const n = nav('spa')
      const li = [...n.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item')].pop()
      const an = li.getAnimations().filter((a) => a.animationName)
      const o = { names: an.map((a) => a.animationName), dur: an[0] && an[0].effect.getTiming().duration, fast: dur('--g-duration-fast') }
      await wait(400)
      o.entering = li.classList.contains('is-entering')
      window.__spa.up()
      await new Promise((r) => requestAnimationFrame(r))
      o.copy = !!n.querySelector('.is-leaving')
      const f = nav('face260'), t = f.querySelector('.g-breadcrumbs__toggle')
      t.click(); await wait(30)
      o.stairs = [...f.querySelectorAll('.g-breadcrumbs__stair')].flatMap((li) => li.getAnimations()).length
      o.chev = getComputedStyle(f.querySelector('.g-breadcrumbs__chevron')).transitionProperty
      t.click(); await wait(100)
      const d = nav('door').querySelector('.g-breadcrumbs__door')
      d.click(); await wait(30)
      o.doorRot = getComputedStyle(d.querySelector('svg')).transitionProperty
      o.doorAnims = d.querySelector('svg').getAnimations().length
      const p = document.getElementById(d.getAttribute('aria-controls'))
      o.panelT = p.getAnimations().map((a) => a.transitionProperty)
      d.click()
      return o
    })
    OK(r.names.length === 1 && r.names[0] === 'g-breadcrumbs-enter-fade' && near(r.dur, r.fast, 1) && !r.entering, 'reducido: el que llega se desplaza, no funde en fast o no se retira ' + JSON.stringify(r))
    OK(!r.copy, 'reducido: hay copia saliente')
    OK(r.stairs === 0, 'reducido: la escalera se anima')
    OK(!/rotate/.test(r.chev) && !/rotate/.test(r.doorRot) && r.doorAnims === 0, 'reducido: los chevrons giran con transición')
    OK(r.panelT.every((t) => !/translate/.test(t)), 'reducido: el panel se desplaza ' + r.panelT)
    await c2.close()
  }

  /* ---------- 10 · Slot link, GDialog y navigate ---------- */
  if (run(10)) {
    await load(page, '')
    const T = (m) => `aplicación: ${m}`
    const sl = await page.evaluate(() => {
      const n = document.getElementById('slot')
      const links = [...n.querySelectorAll(':scope > .g-breadcrumbs__list > li > a')]
      return { all: links.length, fake: links.filter((a) => a.hasAttribute('data-fake-router') && a.classList.contains('g-breadcrumbs__link') && a.getAttribute('href')).length, cur: n.querySelector('[data-fake-router][aria-current="page"]') !== null, labels: links.every((a) => a.querySelector(':scope > .g-breadcrumbs__label[dir="auto"]')), stage: n.dataset.stage, clipped: n.querySelectorAll('[data-clipped]').length }
    })
    OK(sl.all === 5 && sl.fake === 5 && sl.cur && sl.labels, T('slot link: el elemento no recibe attrs o content ' + JSON.stringify(sl)))
    await page.locator('#slot > .g-breadcrumbs__list > .is-parent > a').click()
    await page.locator('#p1100 > .g-breadcrumbs__list > .is-mid > a').first().click()
    await page.locator('#p1100 > .g-breadcrumbs__list > .is-mid > a').first().click({ modifiers: [engine === 'webkit' ? 'Meta' : 'Control'] }).catch(() => {})
    await page.waitForTimeout(150)
    const navs = await page.evaluate(() => window.__navs.slice())
    OK(navs.length === 2 && navs[0].from === 'path' && navs[0].label === 'Lote 2026-0412' && navs[1].label === 'Laboratorio central', T('navigate: payload o guarda de modificadores ' + JSON.stringify(navs)))
    OK(page.url().startsWith(BASE), T('navigate cancelado cambió la URL ' + page.url()))
    // Dentro de un GDialog: Esc cierra la puerta y no el diálogo; el segundo Esc, el diálogo
    await page.locator('#dlg-open').click()
    await page.waitForTimeout(500)
    const dd = page.locator('#dlg .g-breadcrumbs__door').first()
    const visible = await dd.isVisible().catch(() => false)
    if (visible) {
      await dd.focus()
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(250)
      const inPanel = await page.evaluate(() => !!document.activeElement.closest('.g-breadcrumbs__panel'))
      await page.keyboard.press('Escape')
      await page.waitForTimeout(250)
      const s1 = await page.evaluate(() => ({ dlg: window.__dlg.value, panel: !!document.querySelector('#dlg .g-breadcrumbs__panel:popover-open'), door: document.activeElement.classList.contains('g-breadcrumbs__door') }))
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
      const s2 = await page.evaluate(() => window.__dlg.value)
      OK(inPanel && s1.dlg && !s1.panel && s1.door && !s2, T('GDialog: Esc ' + JSON.stringify({ inPanel, s1, s2 })))
    } else OK(false, T('GDialog: las migas no se ven en el diálogo'))
  }

  /* ---------- 11 · Puntero grueso (390px): 44px y Δ0 ---------- */
  if (run(11)) {
    const opts = engine === 'chromium' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 390, height: 844 }, hasTouch: true }
    for (const qs of ['', '?theme=auditoria']) {
      const c3 = await browser.newContext(opts)
      const p3 = await c3.newPage()
      watch(p3)
      await load(p3, qs)
      const coarse = await p3.evaluate(() => matchMedia('(pointer: coarse)').matches)
      if (!coarse) { if (!qs) notes.push(`[${engine}] pointer: coarse no se emula; táctil sin medir`); await c3.close(); continue }
      const t = await p3.evaluate(async () => {
        const { R, wait } = window.__lib
        const o = { small: [], h: {}, out: 0 }
        for (const n of document.querySelectorAll('nav.g-breadcrumbs')) {
          if (n.closest('dialog')) continue
          for (const x of n.querySelectorAll(':scope > .g-breadcrumbs__list > li > a, :scope > .g-breadcrumbs__list > li > button, :scope > .g-breadcrumbs__face > *')) { const q = R(x); if (q.width < 44 - 0.01 || q.height < 44 - 0.01) o.small.push(n.id + ' ' + x.className + ' ' + q.width.toFixed(1) + '×' + q.height.toFixed(1)) }
          o.h[n.id] = R(n).height
          const r = R(n)
          o.out += [...n.querySelectorAll(':scope > .g-breadcrumbs__list > .g-breadcrumbs__item, :scope > .g-breadcrumbs__face > *')].filter((x) => R(x).right > r.right + 0.5 || R(x).left < r.left - 0.5).length
        }
        const f = document.getElementById('face260'), tg = f.querySelector('.g-breadcrumbs__toggle')
        tg.click(); await wait(500)
        o.stairs = [...f.querySelectorAll('.g-breadcrumbs__stair .g-breadcrumbs__link')].map((a) => R(a).height)
        tg.click(); await wait(100)
        const d = document.querySelector('nav.g-breadcrumbs > .g-breadcrumbs__list .g-breadcrumbs__door')
        o.panel = []
        if (d) { d.scrollIntoView({ block: 'center' }); d.click(); await wait(400); o.panel = [...document.getElementById(d.getAttribute('aria-controls')).querySelectorAll('.g-breadcrumbs__link')].map((a) => R(a).height); d.click() }
        o.doorAt = d ? d.closest('nav').id : null
        o.page = document.documentElement.scrollWidth <= innerWidth + 1
        return o
      })
      const T = (m) => `táctil ${qs || 'defecto'}: ${m}`
      OK(!t.small.length, T('objetivos < 44: ' + t.small.slice(0, 6)))
      const hs = Object.entries(t.h).filter(([k]) => k !== 'hdr')
      OK(hs.every(([, h]) => near(h, 44, 0.5)), T('alto ≠ 44 (Δ0): ' + JSON.stringify(hs.filter(([, h]) => !near(h, 44, 0.5)))))
      OK(t.out === 0 && t.page, T('piezas fuera del nav o página que desborda'))
      OK(t.stairs.every((h) => h >= 44 - 0.01) && t.panel.every((h) => h >= 44 - 0.01), T('escalones o enlaces de panel < 44'))
      // Pulsación larga sobre lo recortado: muestra el nombre y soltar no navega (#385)
      if (!qs) {
        const lp = await p3.evaluate(async () => {
          const a = document.querySelector('#chip .g-breadcrumbs__item.is-mid[data-clipped] > a')
          if (!a) return null
          a.scrollIntoView({ block: 'center' })
          const r = a.getBoundingClientRect()
          return { x: r.x + r.width / 2, y: r.y + r.height / 2, label: a.textContent.trim() }
        })
        if (lp && engine === 'chromium') {
          const cdp = await c3.newCDPSession(p3)
          const n0 = await p3.evaluate(() => window.__navs.length)
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: lp.x, y: lp.y }] })
          await p3.waitForTimeout(900)
          const tips = await p3.evaluate(() => [...document.querySelectorAll('#chip > .g-tooltip')].filter((t) => t.matches(':popover-open')).map((t) => t.textContent.trim()))
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
          await p3.waitForTimeout(200)
          const n1 = await p3.evaluate(() => window.__navs.length)
          OK(tips.length === 1 && tips[0] === lp.label && n1 === n0, T('pulsación larga: ' + JSON.stringify({ tips, n0, n1 })))
        }
      }
      await c3.close()
    }
  }

  /* ---------- 12 · Zoom 200 % y 400 % (visor de 640 y 320px CSS) ---------- */
  if (run(12)) {
    for (const w of [640, 320]) {
      const c4 = await browser.newContext({ viewport: { width: w, height: 800 } })
      const p4 = await c4.newPage()
      watch(p4)
      await load(p4, '')
      const z = await p4.evaluate(() => {
        const { R } = window.__lib
        let out = 0
        for (const n of document.querySelectorAll('nav.g-breadcrumbs')) { if (n.closest('dialog')) continue; const r = R(n); out += [...n.querySelectorAll(':scope > .g-breadcrumbs__list > .g-breadcrumbs__item, :scope > .g-breadcrumbs__face > *')].filter((x) => R(x).right > r.right + 0.5 || R(x).left < r.left - 0.5).length }
        return { out, page: document.documentElement.scrollWidth <= innerWidth + 1, p1100: document.getElementById('p1100').dataset.stage }
      })
      OK(z.out === 0 && z.page, `zoom (${w}px): ${z.out} piezas fuera, página ${z.page ? 'sin' : 'con'} desborde`)
      if (w === 320) OK(z.p1100 === 'step', `zoom 400 %: la ruta de 1100 no pasa a step (${z.p1100})`)
      await c4.close()
    }
  }

  /* ---------- 13 · forced-colors (Chromium) ---------- */
  if (run(13)) {
    if (engine === 'chromium') {
      for (const qs of ['', '?dark=1', '?theme=auditoria']) {
        const c5 = await browser.newContext({ viewport: { width: 1280, height: 900 }, forcedColors: 'active' })
        const p5 = await c5.newPage()
        watch(p5)
        await load(p5, qs)
        const fc = await p5.evaluate(async () => {
          const { nav, wait } = window.__lib
          const n = nav('door')
          const lab = n.querySelector('.is-current > .g-breadcrumbs__link .g-breadcrumbs__label')
          const d = n.querySelector('.g-breadcrumbs__door')
          const f = nav('face260')
          const b = (el) => { const s = getComputedStyle(el); return s.borderTopStyle === 'solid' && parseFloat(s.borderTopWidth) >= 1 }
          const o = { cur: getComputedStyle(lab).textDecorationLine, door: b(d), up: b(f.querySelector('.g-breadcrumbs__up')), tg: b(f.querySelector('.g-breadcrumbs__toggle')), tgU: getComputedStyle(f.querySelector('.g-breadcrumbs__toggle .g-breadcrumbs__label')).textDecorationLine, sep: getComputedStyle(nav('p1100').querySelector('.g-breadcrumbs__sep')).color }
          d.focus()
          o.ring = getComputedStyle(d).outlineStyle
          d.click(); await wait(400)
          o.open = getComputedStyle(d).backgroundColor !== getComputedStyle(d.parentElement).backgroundColor
          o.panel = b(document.getElementById(d.getAttribute('aria-controls')))
          d.click()
          const t = f.querySelector('.g-breadcrumbs__toggle'); t.click(); await wait(400)
          o.stairCur = getComputedStyle(f.querySelector('.g-breadcrumbs__stair.is-current .g-breadcrumbs__label')).textDecorationLine
          o.bar = getComputedStyle(f.querySelector('.g-breadcrumbs__stair.is-current .g-breadcrumbs__link')).borderInlineStartColor !== getComputedStyle(f.querySelector('.g-breadcrumbs__stair .g-breadcrumbs__link')).borderInlineStartColor
          t.click()
          return o
        })
        const T = (m) => `forced-colors ${qs || 'defecto'}: ${m}`
        OK(fc.cur === 'underline' && fc.tgU === 'underline' && fc.stairCur === 'underline', T('el actual sin subrayar ' + JSON.stringify(fc)))
        OK(fc.door && fc.up && fc.tg, T('puerta, «Subir» o divulgación sin borde ' + JSON.stringify(fc)))
        OK(fc.open && fc.panel && fc.bar, T('puerta abierta indistinta, panel sin borde o barra del escalón ' + JSON.stringify(fc)))
        await c5.close()
      }
    } else notes.push(`[${engine}] forced-colors sin medir (Playwright solo lo emula en Chromium)`)
  }

  const own = errors.filter((e) => !/favicon/.test(e))
  OK(!own.length, 'consola: ' + own.slice(0, 3))
  await browser.close()
}

server.close()
for (const n of notes) console.log('· ' + n)
for (const [e, [a, b]] of Object.entries(counts)) console.log(`  ${e}: ${a}/${b}`)
if (failed) for (const f of fails.slice(0, args.verbose ? 400 : 40)) console.log('✗ ' + f)
console.log(`${total - failed}/${total} comprobaciones pasan`)
process.exit(failed ? 1 : 0)
