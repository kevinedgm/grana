// Verificación de coco sobre el banco de GRadioGroup (design/lab/radio-group/estilo-banco.html), con el CSS real.
// Contraste medido en la página (colores calculados, capas compuestas) en el tema por defecto claro y oscuro, el «Tema de
// prueba» y los once temas generados (claro y oscuro): etiquetas y textos ≥ 4.5:1; círculo, contorno del chip, marco del
// segmentado, trazo de lo elegido, punto sobre el relleno y anillo de foco ≥ 3:1. Geometría: la caja de inline y segmented
// mide lo mismo que la de GInput por size y densidad; cajas de una fila con el mismo top (±1px) a varios anchos; opciones
// ≥ 24×24 (≥ 44×44 con puntero grueso, Chromium); segmentado con opciones iguales, apilado por su ancho y sin recortes;
// --measure; RTL; forced-colors (Chromium); movimiento reducido; análisis estático del CSS (sin literales, sin respaldos,
// sin @layer, sin --g-tabs-*, hover solo dentro de @media (hover: hover)); consola limpia.
// Ejecutar desde la raíz del repo: node design/lab/radio-group/estilo-verificar.mjs   (Playwright de design/lab/theme-playground)
// Opcional: --engines=chromium,firefox,webkit   --verbose (tabla de contraste por tema)
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium').split(',')
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/radio-group/estilo-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const near = (a, b, t = 1) => Math.abs(a - b) <= t

/* ---------- 0 · Análisis estático del CSS ---------- */
{
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GRadioGroup/GRadioGroup.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(css), 'CSS: color literal')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer/.test(css), 'CSS: @layer en el archivo')
  ok(!/--g-tabs-/.test(css), 'CSS: lee --g-tabs-* (el segmentado de radios no es navegación, #273)')
  ok(!/@property/.test(css), 'CSS: @property (sin propiedades nuevas)')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*: ' + vars.filter((v) => !/^--(g|_)/.test(v)))
  const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  const badPx = px.filter((p) => !['24px', '44px', '0px', '1px', '-1px'].includes(p))
  ok(!badPx.length, 'CSS: medidas literales no permitidas ' + badPx)
  const onePx = css.split('\n').filter((l) => /\b-?1px\b/.test(l))
  ok(onePx.every((l) => /^\s*(inline-size|block-size|margin): -?1px;$/.test(l)), 'CSS: 1px fuera del patrón de texto oculto: ' + onePx.filter((l) => !/^\s*(inline-size|block-size|margin): -?1px;$/.test(l)).join(' | '))
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  // Hover solo dentro de @media (hover: hover)
  let depth = 0, hoverDepth = -1, hoverOutside = []
  const tokens = css.split(/([{}])/)
  let pending = ''
  for (const t of tokens) {
    if (t === '{') { if (/@media\s*\(hover:\s*hover\)/.test(pending) && hoverDepth < 0) hoverDepth = depth; else if (/:hover/.test(pending) && hoverDepth < 0) hoverOutside.push(pending.trim().slice(0, 80)); depth++; pending = '' }
    else if (t === '}') { depth--; if (depth === hoverDepth) hoverDepth = -1; pending = '' }
    else pending += t
  }
  ok(!hoverOutside.length, 'CSS: :hover fuera de @media (hover: hover): ' + hoverOutside.join(' | '))
  ok(/@media \(prefers-reduced-motion: reduce\)/.test(css), 'CSS: sin bloque de movimiento reducido')
  ok(/@media \(forced-colors: active\)/.test(css), 'CSS: sin bloque de forced-colors')
  ok(/:focus-visible/.test(css), 'CSS: sin :focus-visible')
}

/* ---------- En la página: contraste ---------- */
const measure = () => {
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
    if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const shadows = (s) => (s.match(/rgba?\([^)]*\)|color\([^)]*\)/g) || []).map(parse)
  const out = []
  const add = (k, fg, bg, min, pair) => out.push({ k, r: ratio(over(fg, bg), bg), min, pair })
  // Pares del tema que el CSS usa tal cual (on-{c} sobre {c}, on-{c}-soft sobre {c}-soft): si el propio tema no llega,
  // el defecto es del tema (motor), no del componente
  const FAM = { brand: 'primary', accent: 'accent', neutral: 'neutral', success: 'success', warning: 'warning', danger: 'danger', info: 'info' }
  const probe = document.createElement('i'); document.body.append(probe)
  const tok = (n) => { probe.style.color = `var(--g-color-${n})`; return parse(getComputedStyle(probe).color) }
  const pairs = {}
  for (const [c, f] of Object.entries(FAM)) { pairs[c + ':fill'] = ratio(tok('on-' + f), tok(f)); pairs[c + ':soft'] = ratio(tok('on-' + f + '-soft'), tok(f + '-soft')) }
  probe.remove()
  for (const root of document.querySelectorAll('.g-radio-group[data-case]')) {
    const id = root.dataset.case
    const app = [...root.classList].find((c) => c.startsWith('g-radio-group--appearance-')).slice(26)
    const groupOff = root.classList.contains('is-disabled')
    const label = root.querySelector('.g-radio-group__label')
    if (label && !groupOff) add(`${id} etiqueta`, parse(getComputedStyle(label).color), bgOf(label), 4.5)
    const hint = root.querySelector('.g-radio-group__hint')
    if (hint && !groupOff) add(`${id} ayuda`, parse(getComputedStyle(hint).color), bgOf(hint), 4.5)
    const msg = root.querySelector('.g-radio-group__message')
    if (msg && msg.textContent.trim()) add(`${id} mensaje`, parse(getComputedStyle(msg).color), bgOf(msg), 4.5)
    if (groupOff) continue
    const box = root.querySelector('.g-radio-group__options')
    if (app === 'segmented') {
      const cs = getComputedStyle(box, '::after')
      add(`${id} marco del segmentado`, parse(cs.outlineColor), bgOf(root), 3)
    }
    for (const o of root.querySelectorAll('.g-radio-group__option')) {
      if (o.classList.contains('is-disabled')) continue
      const inp = o.querySelector('.g-radio-group__input')
      const k = `${id}[${inp.value}${inp.checked ? ' ✓' : ''}]`
      const color = [...root.classList].find((x) => x.startsWith('g-radio-group--color-')).slice(21)
      const pair = inp.checked && !root.classList.contains('is-readonly') ? (app === 'chip' || app === 'segmented' ? color + ':fill' : app === 'card' ? color + ':soft' : null) : null
      if (!o.classList.contains('is-icon-only')) { const l = o.querySelector('.g-radio-group__option-label'); add(`${k} texto`, parse(getComputedStyle(l).color), bgOf(l), 4.5, pair && pairs[pair] < 4.5 ? pairs[pair] : null) }
      const d = o.querySelector('.g-radio-group__description'); if (d) add(`${k} descripción`, parse(getComputedStyle(d).color), bgOf(d), 4.5)
      const ocs = getComputedStyle(o)
      if (app === 'list' || app === 'inline' || app === 'card') {
        const ics = getComputedStyle(inp)
        add(`${k} borde del círculo`, parse(ics.borderTopColor), bgOf(o), 3)
        if (inp.checked) { const sh = shadows(ics.boxShadow); add(`${k} punto sobre el relleno`, parse(ics.backgroundColor), sh[1] || sh[0], 3) }
        if (app === 'card' && inp.checked) add(`${k} borde de la tarjeta elegida`, parse(ocs.borderTopColor), bgOf(box), 3)
      }
      if (app === 'chip') add(`${k} contorno del chip`, parse(ocs.borderTopColor), bgOf(box), 3)
      if (app === 'segmented' && inp.checked) { const sh = shadows(ocs.boxShadow); add(`${k} trazo de la elegida`, sh[0], bgOf(box), 3) }
    }
  }
  return out
}

/* ---------- En la página: geometría ---------- */
const geometry = () => {
  const q = (c) => document.querySelector(`[data-case="${c}"]`)
  const R = (el) => el.getBoundingClientRect()
  const boxOf = (el) => el.querySelector('.g-input__control, .g-radio-group__options')
  const g = { heights: {}, rows: {}, targets: [], clipped: [], equal: {} }
  for (const s of ['xs', 'sm', 'md', 'lg', 'xl', 'md-compact']) {
    g.heights[s] = { input: +R(boxOf(q('in-' + s))).height.toFixed(2), seg: +R(boxOf(q('seg-' + s))).height.toFixed(2), inl: +R(boxOf(q('inl-' + s))).height.toFixed(2), segOpt: +R(q('seg-' + s).querySelector('.g-radio-group__option')).height.toFixed(2) }
  }
  for (const row of document.querySelectorAll('.g-form-row')) {
    const lines = {}
    for (const k of row.children) { const b = boxOf(k); (lines[k.dataset.line] ??= []).push({ c: k.dataset.case, top: +R(b).top.toFixed(2), h: +R(b).height.toFixed(2) }) }
    g.rows[row.dataset.row] = { lines: row.dataset.lines, byLine: lines, compactH: row.dataset.row === 'c' ? [...row.children].map((k) => +R(boxOf(k)).height.toFixed(2)) : null }
  }
  for (const o of document.querySelectorAll('.g-radio-group__option')) {
    const r = R(o); const id = o.closest('[data-case]').dataset.case
    g.targets.push({ id: id + ':' + o.querySelector('input').value, w: +r.width.toFixed(2), h: +r.height.toFixed(2) })
    for (const t of o.querySelectorAll('.g-radio-group__option-label, .g-radio-group__description')) {
      if (o.classList.contains('is-icon-only') && t.classList.contains('g-radio-group__option-label')) continue
      if (t.scrollWidth > t.clientWidth + 1 || R(t).right > R(o).right + 1 || R(t).left < R(o).left - 1) g.clipped.push(id + ':' + t.textContent)
    }
  }
  for (const l of document.querySelectorAll('.g-radio-group__label, .g-input__label')) if (l.scrollWidth > l.clientWidth + 1) g.clipped.push('etiqueta ' + l.textContent)
  for (const seg of document.querySelectorAll('.g-radio-group--appearance-segmented')) {
    const opts = [...seg.querySelectorAll('.g-radio-group__option')].map(R)
    g.equal[seg.dataset.case] = { stacked: seg.classList.contains('is-stacked'), widths: opts.map((r) => +r.width.toFixed(2)), tops: opts.map((r) => +r.top.toFixed(2)), lefts: opts.map((r) => +r.left.toFixed(2)), natural: +seg.dataset.natural, box: +R(seg.querySelector('.g-radio-group__options')).width.toFixed(2) }
  }
  const rtl = (c) => [...q(c).querySelectorAll('.g-radio-group__option')].map((o) => +R(o).left.toFixed(2))
  g.rtl = { seg: rtl('rtl-seg'), inline: rtl('rtl-inline') }
  g.overflow = { doc: document.documentElement.scrollWidth, vw: innerWidth }
  return g
}

const table = []
const themeNotes = new Set()
for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('requestfailed', (r) => errors.push('red: ' + r.url()))
  const go = async (qs, p = page) => { await p.goto(BASE + qs); await p.waitForSelector('html[data-ready]'); await p.evaluate(() => document.fonts.ready); await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    // El tema generado se carga después de la primera pintura: se esperan las transiciones de color que dispara
    if (/theme=|test=|dark=/.test(qs)) await p.waitForTimeout(400) }

  /* 1 · Contraste en todos los temas, claro y oscuro */
  const configs = [['defecto', ''], ['defecto', 'dark=1'], ['prueba', 'test=1'], ...GEN.flatMap((t) => [[t, `theme=${t}`], [t, `theme=${t}&dark=1`]])]
  for (const [name, qs] of configs) {
    await go('?' + qs)
    const m = await page.evaluate(measure)
    const tag = `${engine} ${name} ${qs.includes('dark') ? 'oscuro' : 'claro'}`
    for (const c of m) {
      if (c.r < c.min && c.pair && near(c.r, c.pair, 0.05)) { themeNotes.add(`${name} ${qs.includes('dark') ? 'oscuro' : 'claro'}: ${c.k} ${c.r}:1 = par del tema ${c.pair}:1`); continue }
      ok(c.r >= c.min, `${tag}: ${c.k} ${c.r}:1 < ${c.min}`)
    }
    const worst = (re) => { const xs = m.filter((c) => re.test(c.k)); return xs.length ? Math.min(...xs.map((c) => c.r)) : null }
    table.push({ tag, texto: worst(/texto|etiqueta|descripción|ayuda|mensaje/), circulo: worst(/borde del círculo/), punto: worst(/punto/), chip: worst(/contorno del chip/), marco: worst(/marco/), elegida: worst(/trazo de la elegida|tarjeta elegida/) })
  }

  /* 2 · Foco visible por opción (tema por defecto, claro y oscuro, y uno generado) */
  for (const qs of ['', 'dark=1', 'theme=spotify', 'theme=caracol-purpura&dark=1']) {
    await go('?' + qs)
    for (const c of ['ap-list', 'ap-inline', 'ap-segmented', 'ap-chip', 'ap-card', 'st-segmented-readonly', 'io-seg', 'col-segmented-accent', 'col-chip-warning']) {
      await page.keyboard.press('Shift')
      const f = await page.evaluate((c) => {
        const root = document.querySelector(`[data-case="${c}"]`)
        const app = [...root.classList].find((x) => x.startsWith('g-radio-group--appearance-')).slice(26)
        const inp = root.querySelector('.g-radio-group__input:checked') || root.querySelector('.g-radio-group__input:not(:disabled)')
        inp.focus()
        return new Promise((done) => setTimeout(() => done(after()), 400))
        function after() {
        const ringEl = app === 'list' || app === 'inline' ? inp : inp.closest('.g-radio-group__option')
        const cs = getComputedStyle(ringEl)
        const probe = document.createElement('i'); probe.style.color = 'var(--g-color-focus)'; document.body.append(probe); const focus = getComputedStyle(probe).color; probe.remove()
        // Fondo junto al anillo: fuera (list/inline/chip/card: lo que hay detrás de la opción) o el halo (segmented)
        const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return [0, 0, 0, 0]; const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
        const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const x = parse(getComputedStyle(n).backgroundColor); if (x[3] >= 1) return x } return [255, 255, 255, 1] }
        const lum = (x) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(x[0]) + 0.7152 * f(x[1]) + 0.0722 * f(x[2]) }
        const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
        const adj = app === 'segmented' ? parse((cs.boxShadow.match(/rgba?\([^)]*\)/) || ['rgba(0,0,0,0)'])[0]) : bgOf(app === 'list' || app === 'inline' ? inp.closest('.g-radio-group__option') : root.querySelector('.g-radio-group__options'))
        // Dentro del segmento: el anillo no se recorta (queda dentro de la caja)
        const rr = ringEl.getBoundingClientRect(), off = parseFloat(cs.outlineOffset), w = parseFloat(cs.outlineWidth)
        return { fv: inp.matches(':focus-visible'), style: cs.outlineStyle, w, off, color: cs.outlineColor, focus, ratio: ratio(parse(cs.outlineColor), adj), inside: app === 'segmented' ? off + w <= 0 : true, rr: rr.width > 0 }
        }
      }, c)
      const tag = `${engine} foco ${c} ?${qs}`
      ok(f.fv, `${tag}: no hay :focus-visible`)
      ok(f.style === 'solid' && f.w >= 1.5, `${tag}: sin anillo (${f.style} ${f.w})`)
      ok(f.color === f.focus, `${tag}: color ${f.color} ≠ --g-color-focus ${f.focus}`)
      ok(f.ratio >= 3, `${tag}: anillo ${f.ratio}:1 < 3 contra lo adyacente`)
      ok(f.inside, `${tag}: el anillo del segmento sale de la opción (offset ${f.off}, ancho ${f.w})`)
      await page.evaluate(() => document.activeElement && document.activeElement.blur())
    }
  }

  /* 3 · Geometría: tema por defecto, oscuro, RTL de página y Tema de prueba (borde 2px, space 5) */
  for (const qs of ['', 'dark=1', 'rtl=1', 'test=1']) {
    await go('?' + qs)
    const g = await page.evaluate(geometry)
    const tag = `${engine} geom ?${qs}`
    for (const [s, h] of Object.entries(g.heights)) {
      ok(near(h.seg, h.input, 0.5), `${tag}: caja segmented ${s} ${h.seg} ≠ GInput ${h.input}`)
      ok(near(h.inl, h.input, 0.5), `${tag}: caja inline ${s} ${h.inl} ≠ GInput ${h.input}`)
      ok(near(h.segOpt, h.input, 0.5), `${tag}: segmento ${s} ${h.segOpt} no ocupa el alto de la caja ${h.input}`)
    }
    for (const [r, row] of Object.entries(g.rows)) for (const [line, kids] of Object.entries(row.byLine)) {
      if (kids.length < 2) continue
      const t0 = kids[0].top
      ok(kids.every((k) => near(k.top, t0, 1)), `${tag}: fila ${r} línea ${line} tops ${JSON.stringify(kids)}`)
    }
    ok(g.rows.a.lines === '1', `${tag}: la fila a no cabe en una línea a 1280 (${g.rows.a.lines})`)
    ok(g.rows.c.compactH.every((h) => near(h, g.rows.c.compactH[0], 0.5)), `${tag}: fila compacta alturas ${g.rows.c.compactH}`)
    for (const t of g.targets) ok(t.w >= 24 - 0.01 && t.h >= 24 - 0.01, `${tag}: opción ${t.id} ${t.w}×${t.h} < 24`)
    ok(!g.clipped.length, `${tag}: textos recortados ${g.clipped.join(' | ')}`)
    for (const [c, e] of Object.entries(g.equal)) {
      if (!e.stacked) {
        ok(e.widths.every((w) => near(w, e.widths[0], 1)), `${tag}: ${c} segmentos desiguales ${e.widths}`)
        ok(e.tops.every((t) => near(t, e.tops[0], 0.5)), `${tag}: ${c} no está en una línea`)
        ok(e.natural <= e.box + 0.5, `${tag}: ${c} en una línea sin caber (natural ${e.natural} > ${e.box})`)
      } else {
        ok(e.natural > e.box + 0.5, `${tag}: ${c} apilado sin necesidad (natural ${e.natural} ≤ ${e.box})`)
        ok(e.lefts.every((l) => near(l, e.lefts[0], 0.5)) && e.tops.every((t, i) => i === 0 || t > e.tops[i - 1]), `${tag}: ${c} apilado no es una columna en orden`)
      }
    }
    ok(g.equal['narrow-seg'].stacked, `${tag}: narrow-seg (4 opciones en 220px) no se apila`)
    ok(!g.equal['rowa-seg'].stacked && !g.equal['ap-segmented'].stacked, `${tag}: segmentado apilado a 1280`)
    const rtlPage = qs === 'rtl=1'
    // Local dir="rtl": la primera opción queda a la derecha (también en una página RTL)
    ok(g.rtl.seg[0] > g.rtl.seg[1] && g.rtl.inline[0] > g.rtl.inline[1], `${tag}: RTL local ${JSON.stringify(g.rtl)}`)
    if (rtlPage) { const e = g.equal['ap-segmented']; ok(e.lefts[0] > e.lefts[1], `${tag}: página RTL, el segmentado no empieza a la derecha`) }
    ok(g.overflow.doc <= g.overflow.vw, `${tag}: desborde ${JSON.stringify(g.overflow)}`)
  }

  /* 4 · Anchos de ventana: filas que se parten, cajas alineadas por línea, sin recortes ni desborde */
  for (const w of [960, 720, 480, 360, 320]) {
    await page.setViewportSize({ width: w, height: 900 })
    await go('')
    const g = await page.evaluate(geometry)
    const tag = `${engine} ${w}px`
    for (const [r, row] of Object.entries(g.rows)) for (const [line, kids] of Object.entries(row.byLine)) if (kids.length > 1) ok(kids.every((k) => near(k.top, kids[0].top, 1)), `${tag}: fila ${r} línea ${line} ${JSON.stringify(kids)}`)
    ok(!g.clipped.length, `${tag}: recortes ${g.clipped.join(' | ')}`)
    ok(g.overflow.doc <= w, `${tag}: desborde ${JSON.stringify(g.overflow)}`)
    for (const t of g.targets) ok(t.w >= 24 - 0.01 && t.h >= 24 - 0.01, `${tag}: opción ${t.id} ${t.w}×${t.h}`)
    for (const [c, e] of Object.entries(g.equal)) if (e.stacked) ok(e.natural > e.box + 0.5, `${tag}: ${c} apilado sin necesidad`); else ok(e.natural <= e.box + 0.5, `${tag}: ${c} en una línea sin caber`)
    // La fila se parte antes de que el segmentado se apile (#271): si se apila, ya está solo en su línea
    if (g.equal['rowa-seg'].stacked) { const line = Object.values(g.rows.a.byLine).find((k) => k.some((x) => x.c === 'rowa-seg')); ok(line.length === 1, `${tag}: el segmentado de la fila a se apiló sin que la fila se partiera`) }
  }
  await page.setViewportSize({ width: 1280, height: 900 })

  /* 5 · --measure: una línea y sin transiciones aunque esté apilado */
  await go('')
  const m = await page.evaluate(() => {
    const root = document.querySelector('[data-case="narrow-seg"]'); root.classList.add('g-radio-group--measure')
    const opts = [...root.querySelectorAll('.g-radio-group__option')]
    const out = { tops: opts.map((o) => +o.getBoundingClientRect().top.toFixed(2)), dur: [...root.querySelectorAll('.g-radio-group__option, .g-radio-group__options, .g-radio-group__input')].map((e) => getComputedStyle(e).transitionDuration).concat(getComputedStyle(root.querySelector('.g-radio-group__options'), '::after').transitionDuration) }
    root.classList.remove('g-radio-group--measure'); return out
  })
  ok(m.tops.every((t) => near(t, m.tops[0], 0.5)), `${engine} --measure: no está en una línea ${m.tops}`)
  ok(m.dur.every((d) => d.split(',').every((x) => parseFloat(x) === 0)), `${engine} --measure: con transición ${m.dur}`)

  /* 6 · Movimiento reducido: sin crecer el punto ni hundirse; los fundidos de color siguen */
  for (const rm of ['no-preference', 'reduce']) {
    await page.emulateMedia({ reducedMotion: rm })
    await go('')
    const t = await page.evaluate(() => {
      const tr = (el) => { const cs = getComputedStyle(el); const p = cs.transitionProperty.split(',').map((s) => s.trim()); const d = cs.transitionDuration.split(',').map(parseFloat); return Object.fromEntries(p.map((x, i) => [x, d[i % d.length]])) }
      return { circle: tr(document.querySelector('[data-case="ap-list"] .g-radio-group__input')), seg: tr(document.querySelector('[data-case="ap-segmented"] .g-radio-group__option')), chip: tr(document.querySelector('[data-case="ap-chip"] .g-radio-group__option')) }
    })
    const tag = `${engine} reduced-motion=${rm}`
    if (rm === 'reduce') {
      ok(!t.circle['box-shadow'] && !t.circle.scale && !t.circle['outline-offset'], `${tag}: el círculo sigue con movimiento ${JSON.stringify(t.circle)}`)
      ok(t.circle['border-color'] > 0, `${tag}: el círculo perdió el fundido de color`)
      ok(t.seg['background-color'] > 0 && !t.seg.transform && !t.seg.translate, `${tag}: segmento ${JSON.stringify(t.seg)}`)
      ok(t.chip['background-color'] > 0, `${tag}: chip sin fundido de color`)
    } else {
      ok(t.circle['box-shadow'] > 0 && t.circle.scale > 0, `${tag}: el punto no crece ${JSON.stringify(t.circle)}`)
      ok(t.seg['background-color'] > 0 && !t.seg.transform && !t.seg.translate && !t.seg.left && !t.seg['inset-inline-start'], `${tag}: el relleno del segmento se desliza o no se funde ${JSON.stringify(t.seg)}`)
    }
  }
  if (engine === 'chromium') {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await go('')
    const lab = page.locator('[data-case="ap-list"] .g-radio-group__option').first()
    const b = await lab.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(400)
    const sc = await page.evaluate(() => getComputedStyle(document.querySelector('[data-case="ap-list"] .g-radio-group__input')).scale)
    await page.mouse.up()
    ok(sc === '1' || sc === 'none', `${engine} reduce: el círculo se hunde al pulsar (scale ${sc})`)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await go('')
    const b2 = await lab.boundingBox(); await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2); await page.mouse.down(); await page.waitForTimeout(400)
    const sc2 = await page.evaluate(() => getComputedStyle(document.querySelector('[data-case="ap-list"] .g-radio-group__input')).scale)
    await page.mouse.up()
    ok(sc2 !== '1' && sc2 !== 'none', `${engine} sin preferencia: el círculo no se hunde al pulsar (scale ${sc2})`)
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  /* 7 · forced-colors (solo Chromium emula forced-colors) */
  if (engine === 'chromium') {
    for (const qs of ['', 'dark=1']) {
      await page.emulateMedia({ forcedColors: 'active' })
      await go('?' + qs)
      const fc = await page.evaluate(() => {
        const q = (c) => document.querySelector(`[data-case="${c}"]`)
        const opt = (c, checked) => [...q(c).querySelectorAll('.g-radio-group__option')].find((o) => o.querySelector('input').checked === checked)
        const cs = (el) => getComputedStyle(el)
        const segBox = getComputedStyle(q('ap-segmented').querySelector('.g-radio-group__options'), '::after')
        const listOn = q('ap-list').querySelector('input:checked'), listOff = q('ap-list').querySelector('input:not(:checked):not(:disabled)')
        const cardOn = opt('ap-card', true), cardOff = opt('ap-card', false)
        const roSeg = opt('st-segmented-readonly', true)
        return {
          seg: [cs(opt('ap-segmented', true)).backgroundColor, cs(opt('ap-segmented', false)).backgroundColor],
          segText: cs(opt('ap-segmented', true).querySelector('.g-radio-group__option-label')).color,
          chip: [cs(opt('ap-chip', true)).backgroundColor, cs(opt('ap-chip', false)).backgroundColor],
          frame: { st: segBox.outlineStyle, w: parseFloat(segBox.outlineWidth), c: segBox.outlineColor },
          list: [cs(listOn).backgroundColor + ' ' + cs(listOn).boxShadow + ' ' + cs(listOn).borderColor, cs(listOff).backgroundColor + ' ' + cs(listOff).boxShadow + ' ' + cs(listOff).borderColor],
          listOffBorder: { w: parseFloat(cs(listOff).borderTopWidth), st: cs(listOff).borderTopStyle },
          card: [parseFloat(cs(cardOn).borderTopWidth), parseFloat(cs(cardOff).borderTopWidth)],
          roSeg: { o: cs(roSeg).outlineStyle, w: parseFloat(cs(roSeg).outlineWidth) },
          canvas: cs(document.body).backgroundColor
        }
      })
      const tag = `${engine} forced-colors ?${qs}`
      ok(fc.seg[0] !== fc.seg[1], `${tag}: segmento elegido igual al resto ${fc.seg}`)
      ok(fc.segText !== fc.seg[0], `${tag}: texto del segmento elegido sin contraste ${fc.segText} / ${fc.seg[0]}`)
      ok(fc.chip[0] !== fc.chip[1], `${tag}: chip elegido igual al resto ${fc.chip}`)
      ok(fc.frame.st === 'solid' && fc.frame.w >= 1 && fc.frame.c !== fc.canvas, `${tag}: marco del segmentado ${JSON.stringify(fc.frame)}`)
      ok(fc.list[0] !== fc.list[1], `${tag}: círculo elegido igual al resto`)
      ok(fc.listOffBorder.w >= 1 && fc.listOffBorder.st === 'solid', `${tag}: círculo sin borde ${JSON.stringify(fc.listOffBorder)}`)
      ok(fc.card[0] > fc.card[1], `${tag}: tarjeta elegida sin borde más grueso ${fc.card}`)
      ok(fc.roSeg.o === 'solid' && fc.roSeg.w >= 2, `${tag}: segmento elegido en solo lectura sin marca ${JSON.stringify(fc.roSeg)}`)
      // Foco del segmento
      await page.keyboard.press('Shift')
      const ff = await page.evaluate(() => { const i = document.querySelector('[data-case="ap-segmented"] input:checked'); i.focus(); const cs = getComputedStyle(i.closest('.g-radio-group__option')); return { st: cs.outlineStyle, w: parseFloat(cs.outlineWidth), c: cs.outlineColor } })
      ok(ff.st === 'solid' && ff.w >= 1.5, `${tag}: foco del segmento ${JSON.stringify(ff)}`)
    }
    await page.emulateMedia({ forcedColors: 'none' })
  }

  /* 8 · Puntero grueso (Chromium: táctil y móvil): opciones ≥ 44×44 y la caja del segmentado igual a la de GInput */
  if (engine === 'chromium') {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
    const p2 = await ctx.newPage()
    await go('', p2)
    const coarse = await p2.evaluate(() => matchMedia('(pointer: coarse)').matches)
    ok(coarse, `${engine} táctil: pointer: coarse no se emula`)
    const g = await p2.evaluate(geometry)
    for (const t of g.targets) ok(t.w >= 44 - 0.01 && t.h >= 44 - 0.01, `${engine} táctil: opción ${t.id} ${t.w}×${t.h} < 44`)
    for (const [s, h] of Object.entries(g.heights)) ok((g.equal['seg-' + s].stacked || near(h.seg, h.input, 0.5)) && near(h.segOpt, h.input, 0.5) && near(h.inl, h.input, 0.5) && h.input >= 44 - 0.01, `${engine} táctil: cajas ${s} ${JSON.stringify(h)}`)
    for (const [r, row] of Object.entries(g.rows)) for (const [line, kids] of Object.entries(row.byLine)) if (kids.length > 1) ok(kids.every((k) => near(k.top, kids[0].top, 1)), `${engine} táctil: fila ${r} línea ${line}`)
    ok(g.overflow.doc <= 390, `${engine} táctil: desborde ${JSON.stringify(g.overflow)}`)
    await ctx.close()
  }

  /* 9 · Escalas fraccionarias: el marco del segmentado y el borde del círculo no desaparecen */
  for (const dpr of [1.25, 1.5, 2]) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: dpr })
    const p2 = await ctx.newPage(); await go('', p2)
    const v = await p2.evaluate(() => ({ frame: parseFloat(getComputedStyle(document.querySelector('[data-case="ap-segmented"] .g-radio-group__options'), '::after').outlineWidth), circle: parseFloat(getComputedStyle(document.querySelector('[data-case="ap-list"] .g-radio-group__input')).borderTopWidth), box: document.querySelector('[data-case="ap-list"] .g-radio-group__input').getBoundingClientRect().width }))
    ok(v.frame * dpr >= 1 - 0.01 && v.circle * dpr >= 1 - 0.01 && v.box > 10, `${engine} DPR ${dpr}: ${JSON.stringify(v)}`)
    await ctx.close()
  }

  ok(!errors.length, `${engine} consola: ${errors.join(' | ')}`)
  await browser.close()
}

server.close()
if (args.verbose) console.table(table)
else {
  const cols = ['texto', 'circulo', 'punto', 'chip', 'marco', 'elegida']
  const min = (k) => Math.min(...table.map((r) => r[k] ?? Infinity)).toFixed(2)
  const pick = (t) => table.find((r) => r.tag.endsWith(t))
  console.log('Contraste mínimo por tema (texto · borde del círculo · punto/relleno · contorno del chip · marco del segmentado · trazo de la elegida):')
  for (const t of ['defecto claro', 'defecto oscuro', 'prueba claro', 'spotify claro', 'spotify oscuro', 'amazon claro', 'caracol-purpura oscuro']) {
    const r = pick(t); if (r) console.log(`  ${t.padEnd(24)} ${cols.map((k) => r[k]).join(' · ')}`)
  }
  console.log(`  mínimo en ${table.length} temas      ${cols.map(min).join(' · ')}`)
}
if (themeNotes.size) console.log('\nNotas del tema (el par que el CSS usa no llega en el propio tema; defecto del motor, no del componente):\n' + [...themeNotes].map((n) => '  · ' + n).join('\n'))
console.log(`\n${total - failed}/${total} correctas`)
if (failed) { console.log(fails.slice(0, 80).map((f) => '  ✗ ' + f).join('\n')); if (fails.length > 80) console.log(`  … y ${fails.length - 80} más`); process.exitCode = 1 }
