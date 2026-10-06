// Auditoría de coco (paso 5) de GFileField sobre el COMPONENTE REAL: design/lab/file-field/auditoria-banco.html monta
// dist/grana.umd.js + dist/file-field.umd.js + dist/grana.css tal como se publican, con un adaptador determinista (sin
// red) que deja cada ficha en el estado que se mide. Repite la batería del banco de estilo (estilo-verificar.mjs) sobre
// el marcado que pone GFileField.vue y añade lo que solo existe con el componente: foco y orden de foco, anuncios, envío
// bloqueado con el enlace del resumen, arrastre de página con un modal abierto, texto al 200 % y el fundido del destino
// en WebKit (pendiente-coco de personalidad-file-field.spec.mjs).
// Temas: por defecto claro y oscuro; el de esta auditoría (auditoria-tema.css, @grana/cli desde auditoria-tema.json:
// brand #5B2A86, accent #C2410C, radius 10, space 5, fontSize 17, borde 2px) claro y oscuro; y los once generados de
// design/lab/tema-oscuro/dark-color-presence/generated/ claro y oscuro (Chromium; Firefox y WebKit: defecto, auditoría
// y spotify, claro y oscuro). Contraste sobre el compuesto real (capas translúcidas incluidas).
// Ejecutar desde la raíz (requiere `npm run build`): GRANA_PW_PORT=4209 node design/lab/file-field/auditoria-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit   --only=css,contrast,geo,touch,drag,fade,focus,live,block,motion,rtl,zoom,forced
//           --verbose   GRANA_DIST=<carpeta> (sirve otra copia de dist/)
import http from 'node:http'
import { readFile } from 'node:fs/promises'
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
    const p = process.env.GRANA_DIST && path.startsWith('/packages/vue/dist/') ? join(process.env.GRANA_DIST, path.slice('/packages/vue/dist/'.length)) : normalize(join(ROOT, path))
    if (!p.startsWith(ROOT) && !(process.env.GRANA_DIST && p.startsWith(process.env.GRANA_DIST))) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/file-field/auditoria-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = [], measures = {}, perEngine = {}
let ENGINE = ''
const ok = (cond, msg) => { total++; perEngine[ENGINE] ??= [0, 0]; perEngine[ENGINE][0]++; if (!cond) { failed++; perEngine[ENGINE][1]++; fails.push(msg) } }
const note = (k, v) => { (measures[k] ??= []).push(v) }

/* ---------- 0 · Análisis estático del CSS (el del banco de estilo, con los dos cambios de esta auditoría) ---------- */
if (run('css')) {
  ENGINE = 'css'
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GFileField/GFileField.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch|color-mix)\(/.test(css), 'CSS: color literal o color-mix')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer|@property|!important/.test(css), 'CSS: @layer, @property o !important')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  const strange = [...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v)))]
  ok(!strange.length, 'CSS: lee un alias --_* que no declara: ' + strange)
  const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  ok(px.every((p) => ['24px', '44px', '1px', '-1px'].includes(p)), 'CSS: medidas literales no permitidas ' + px.filter((p) => !['24px', '44px', '1px', '-1px'].includes(p)))
  ok(!/\d(?:ch|em|rem|vw|vh|lh)\b/.test(css.replace(/-0\.125em/g, '')), 'CSS: unidad literal no permitida')
  ok(!/--g-ease-spring|--g-ease-bounce/.test(css), 'CSS: muelle o rebote (L24)')
  ok(/--_ff-py: calc\(\(var\(--_h\) - max\(var\(--_ff-chip-h\), var\(--_lh\)\)\) \/ 2 - var\(--g-border-width\)\);/.test(css), 'CSS: el reparto de la caja no cuenta la línea de texto (hallazgo 2)')
  ok(!/\.g-file-field__chip \{[^}]*\bblock-size:/.test(css.replace(/min-block-size/g, 'MIN')), 'CSS: la ficha lleva block-size fijo (hallazgo 2)')
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
    let base = parse(getComputedStyle(document.body).backgroundColor)
    if (base[3] < 1) base = parse(getComputedStyle(document.documentElement).backgroundColor)
    if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const tok = (n, prop = 'color') => { const i = document.createElement('i'); i.style[prop] = `var(${n})`; document.body.append(i); const c = getComputedStyle(i)[prop]; i.remove(); return c }
  const px = (n) => { const i = document.createElement('i'); i.style.inlineSize = `var(${n})`; i.style.position = 'absolute'; document.body.append(i); const v = i.getBoundingClientRect().width; i.remove(); return v }
  const root = (c) => { const e = document.querySelector(`[data-case="${c}"]`); return e ? (e.closest('.g-file-field, .g-input') || e) : null }
  const q = (c, s) => root(c).querySelector(s)
  const fg = (el) => parse(getComputedStyle(el).color)
  const pair = (k, el, min, bg) => { const b = bg || bgOf(el); return { k, r: ratio(over(fg(el), b), b), min } }
  const rect = (el) => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height } }
  const drag = (target = document.body, type = 'image/png', ev = 'dragenter') => { const dt = new DataTransfer(); dt.items.add(new File([new Uint8Array(5)], 'x.' + type.split('/')[1], { type })); target.dispatchEvent(new DragEvent(ev, { bubbles: true, cancelable: true, dataTransfer: dt })) }
  const frames = (n = 2) => new Promise((r) => { const f = () => (n-- > 0 ? requestAnimationFrame(f) : r()); f() })
  return { parse, over, bgOf, ratio, tok, px, root, q, fg, pair, rect, drag, frames }
}
const L = `(${lib.toString()})()`

for (const engine of ENGINES) {
  ENGINE = engine
  const browser = await pw[engine].launch()
  const errors = []
  const tag = (s) => `${engine} ${s}`
  const mk = async ({ width = 1280, height = 900, motion = 'no-preference', touch = false } = {}) => {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: motion, hasTouch: touch, isMobile: touch && engine === 'chromium' })
    const page = await ctx.newPage()
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/favicon|404/.test(m.text())) errors.push(m.text()) })
    page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errors.push(e.message) })
    return { ctx, page }
  }
  const go = async (page, qs = '') => {
    await page.goto(BASE + (qs ? '?' + qs : ''))
    await page.waitForSelector('[data-ready]', { timeout: 20000 })
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(() => new Promise((r) => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(r)), 250)))
  }
  const center = (page, c) => page.evaluate((c) => document.querySelector(`[data-case="${c}"]`).closest('.g-file-field, .g-input, .g-form-row, div').scrollIntoView({ block: 'center' }), c)

  /* 1 · Contraste en todos los temas (ficha en sus seis estados, frente, filo, error, cara, destino, aviso, mensajes) */
  if (run('contrast')) {
    const { ctx, page } = await mk()
    const THEMES = engine === 'chromium'
      ? [['defecto', ''], ['auditoría', 'audit'], ...GEN.map((t) => [t, t])]
      : [['defecto', ''], ['auditoría', 'audit'], ['spotify', 'spotify']]
    const worst = {}
    for (const [name, th] of THEMES) for (const dark of [false, true]) {
      await go(page, [th && 'theme=' + th, dark && 'dark=1'].filter(Boolean).join('&'))
      // Aviso de no añadidos (un gesto real con un archivo que excede maxSize) y arrastre (admite, encima, no admite, lleno)
      await page.evaluate(`(async () => { const { root, drag, frames } = ${L}
        window.__ab.refs.noticeRef.value.add([window.__ab.file('grande.png', 5000, 'image/png')])
        drag(document.body); await frames(1); drag(root('t-over')); drag(root('t-overno')); await new Promise((r) => setTimeout(r, 400)) })()`)
      let m
      try {
        m = await page.evaluate(`(() => { const { pair, q, root, bgOf, parse, ratio, tok } = ${L}
          const out = []
          const P = (k, el, min, bg) => { if (!el) { out.push({ k: k + ' (no está)', r: 0, min }); return } out.push(pair(k, el, min, bg)) }
          const G = (k, color, bg, min) => out.push({ k, r: ratio(parse(color), bg), min })
          P('cara (accent-text)', q('empty', '.g-file-field__action'), 4.5)
          P('cara: icono', q('empty', '.g-file-field__add-icon'), 3)
          P('pista en la caja', q('empty', '.g-file-field__add-hint'), 4.5)
          P('estado del pie', q('st-md', '.g-file-field__status'), 4.5)
          for (const [c, rd] of [['st-md', 'rd-md'], ['st-soft', 'rd-soft']]) {
            const chip = (s) => q(c, '.g-file-field__chip[data-state="' + s + '"]' + (s === 'done' ? ':not([data-stored])' : ''))
            const r = q(rd, '.g-file-field__chip[data-state="ready"]')
            P(c + ' · ready: nombre', r.querySelector('.g-summary__title'), 4.5); P(c + ' · ready: tamaño', r.querySelector('.g-summary__subtitle'), 4.5)
            P(c + ' · ready: icono', r.querySelector('.g-summary__lead'), 3)
            G(c + ' · ready: Quitar', getComputedStyle(r.querySelector('.g-file-field__remove')).color, bgOf(r), 3)
            const st = q(c, '.g-file-field__chip[data-stored]'); P(c + ' · guardado: nombre', st.querySelector('.g-summary__title'), 4.5)
            const qu = chip('queued'); P(c + ' · en cola: nombre', qu.querySelector('.g-summary__title'), 4.5)
            const u = chip('uploading'), fill = u.querySelector('.g-progress__fill'), fb = parse(getComputedStyle(fill).backgroundColor), ub = bgOf(u)
            P(c + ' · subiendo: nombre sobre el relleno', u.querySelector('.g-summary__title'), 4.5, fb); P(c + ' · subiendo: nombre sin relleno', u.querySelector('.g-summary__title'), 4.5, ub)
            G(c + ' · subiendo: Cancelar', getComputedStyle(u.querySelector('.g-file-field__remove')).color, fb, 3)
            const fcs = getComputedStyle(fill), edge = getComputedStyle(u).direction === 'rtl' ? fcs.borderLeftColor : fcs.borderRightColor
            G(c + ' · frente de avance / relleno', edge, fb, 3); G(c + ' · frente de avance / ficha', edge, ub, 3)
            const d = chip('done'); G(c + ' · filo de éxito / ficha', getComputedStyle(d, '::after').backgroundColor, bgOf(d), 3)
            G(c + ' · filo de éxito / caja', getComputedStyle(d, '::after').backgroundColor, bgOf(d.parentElement), 3)
            const e = chip('error'), eb = bgOf(e)
            P(c + ' · error: nombre', e.querySelector('.g-summary__title'), 4.5); P(c + ' · error: mensaje', e.querySelector('.g-summary__fact-value'), 4.5)
            P(c + ' · error: icono', e.querySelector('.g-summary__lead'), 3)
            G(c + ' · error: Reintentar', getComputedStyle(e.querySelector('.g-file-field__retry')).color, eb, 3)
            G(c + ' · error: Quitar', getComputedStyle(e.querySelector('.g-file-field__remove')).color, eb, 3)
          }
          P('soft · cara', q('empty-soft', '.g-file-field__action'), 4.5)
          P('solo lectura · cara', q('ro', '.g-file-field__action'), 4.5); P('solo lectura · nombre', q('ro', '.g-summary__title'), 4.5); P('solo lectura vacío · cara', q('ro-empty', '.g-file-field__action'), 4.5)
          P('lleno · cara', q('full', '.g-file-field__action'), 4.5)
          P('aviso: texto', q('notice', '.g-file-field__notice-list li'), 4.5)
          G('aviso: Descartar', getComputedStyle(q('notice', '.g-file-field__notice > .g-btn')).color, bgOf(q('notice', '.g-file-field__notice')), 3)
          P('mensaje: error', q('inv', '.g-file-field__message'), 4.5); P('mensaje: advertencia', q('warn', '.g-file-field__message'), 4.5); P('mensaje: válido', q('valid', '.g-file-field__message'), 4.5)
          const host = bgOf(root('empty').parentElement)
          G('borde de la caja', getComputedStyle(q('empty', '.g-file-field__box')).borderTopColor, host, 3)
          G('borde con error', getComputedStyle(q('inv', '.g-file-field__box')).borderTopColor, host, 3)
          G('foco / página', tok('--g-color-focus'), host, 3)
          for (const [c, k] of [['t-ok', 'destino admite'], ['t-over', 'destino encima'], ['t-no', 'destino no admite'], ['t-overno', 'destino encima no admite'], ['t-full', 'destino lleno']]) {
            const t = q(c, '.g-file-field__target'); P(k + ': texto', t.querySelector('.g-file-field__target-text'), 4.5)
            G(k + ': borde / página', getComputedStyle(t).borderTopColor, bgOf(root(c).parentElement), 3)
          }
          return out })()`)
      } catch (e) { ok(false, tag(`${name} ${dark ? 'oscuro' : 'claro'}: contraste no medible (${e.message.split('\n')[0]})`)); continue }
      for (const c of m) ok(c.r >= c.min, tag(`${name} ${dark ? 'oscuro' : 'claro'}: ${c.k} ${c.r}:1 < ${c.min}`))
      for (const c of m) worst[c.k] = Math.min(worst[c.k] ?? 99, c.r)
    }
    note('contraste mínimo (peor tema) ' + engine, Object.entries(worst).map(([k, v]) => `${k} ${v}`).join(' · '))
    await ctx.close()
  }

  /* 2 · Geometría: Δ0 con GInput en una GFormRow (vacía y con un archivo), ficha Δ0 en sus seis estados, ≥ 24px */
  if (run('geo')) {
    const { ctx, page } = await mk()
    for (const [name, qs] of [['defecto', ''], ['auditoría', 'theme=audit'], ['auditoría oscuro', 'theme=audit&dark=1']]) {
      await go(page, qs)
      const rows = await page.evaluate(`(() => { const { root, q, rect, px } = ${L}; const out = []
        for (const d of ['default', 'comfortable', 'compact']) for (const s of ['xs', 'sm', 'md', 'lg', 'xl']) {
          const gi = rect(root('in-' + s + '-' + d).querySelector('.g-input__control')), gl = rect(root('in-' + s + '-' + d).querySelector('.g-input__label'))
          const e = rect(q('e-' + s + '-' + d, '.g-file-field__box')), el = rect(q('e-' + s + '-' + d, '.g-file-field__label'))
          const o = rect(q('o-' + s + '-' + d, '.g-file-field__box')), g1 = rect(root('in1-' + s + '-' + d).querySelector('.g-input__control'))
          const chip = rect(q('o-' + s + '-' + d, '.g-file-field__chip')), btn = rect(q('o-' + s + '-' + d, '.g-file-field__chip .g-btn')).h
          out.push({ s, d, gi, gl, e, el, o, g1, chip, btn, bw: px('--g-border-width') })
        } return out })()`)
      for (const r of rows) {
        const t = (x) => tag(`${name} ${r.s}/${r.d}: ${x}`)
        ok(Math.abs(r.e.t - r.gi.t) < 0.5 && Math.abs(r.e.h - r.gi.h) < 0.5, t(`caja vacía Δtop ${(r.e.t - r.gi.t).toFixed(2)} Δalto ${(r.e.h - r.gi.h).toFixed(2)}`))
        ok(Math.abs(r.el.t - r.gl.t) < 0.5, t(`etiqueta Δtop ${(r.el.t - r.gl.t).toFixed(2)}`))
        ok(Math.abs(r.o.t - r.g1.t) < 0.5, t(`caja con archivo Δtop ${(r.o.t - r.g1.t).toFixed(2)}`))
        const expect = Math.max(r.gi.h, r.chip.h + 2 * r.bw)
        ok(Math.abs(r.o.h - expect) < 0.5, t(`caja con archivo ${r.o.h} ≠ ${expect}`))
        ok(Math.abs(r.g1.h - r.gi.h) < 0.5, t(`el GInput vecino se estira (${r.g1.h} frente a ${r.gi.h})`))
        ok(r.chip.h >= 24 - 0.01 && r.chip.h >= r.btn - 0.01, t(`ficha ${r.chip.h} < 24 o < su botón ${r.btn}`))
        if (Math.abs(r.o.h - r.gi.h) > 0.01) note('caja con un archivo más alta que la de GInput (la ficha en su piso de 24px; permitido)', `${engine} ${name} ${r.s}/${r.d} ${r.o.h} frente a ${r.gi.h}`)
      }
      note('Δ0 caja vacía y con un archivo frente a GInput', `${engine} ${name}: ${rows.length} combinaciones`)
      const chips = await page.evaluate(`(() => { const { root } = ${L}; return ['xs', 'sm', 'md', 'lg', 'xl', 'soft'].map((s) => { const all = [...root('st-' + s).querySelectorAll('.g-file-field__chip'), ...root('rd-' + s).querySelectorAll('.g-file-field__chip')]
        return { s, h: all.map((c) => [c.dataset.state + (c.hasAttribute('data-stored') ? '*' : ''), +c.getBoundingClientRect().height.toFixed(2)]),
          btn: all.flatMap((c) => [...c.querySelectorAll('.g-btn')]).map((b) => { const r = b.getBoundingClientRect(); return [r.width, r.height] }),
          sliver: all.map((c) => { const s = c.querySelector('.g-summary__subtitle'); if (!s || getComputedStyle(s).position === 'absolute') return 0; const sr = s.getBoundingClientRect(), br = c.querySelector('.g-summary__body').getBoundingClientRect(); const visible = sr.top < br.bottom - 0.5; return visible && sr.width > 0 && sr.width < s.scrollWidth - 0.5 && sr.width < 12 ? sr.width : 0 }) } }) })()`)
      for (const c of chips) {
        const hs = c.h.map((x) => x[1]), states = c.h.map((x) => x[0]).sort().join(',')
        ok(states === 'done,done*,error,queued,ready,uploading', tag(`${name} ${c.s}: estados ${states}`))
        ok(Math.max(...hs) - Math.min(...hs) < 0.01, tag(`${name} ficha ${c.s}: Δ entre estados ${JSON.stringify(c.h)}`))
        ok(c.btn.every(([w, h]) => w >= 24 - 0.01 && h >= 24 - 0.01), tag(`${name} ficha ${c.s}: botón < 24px ${JSON.stringify(c.btn)}`))
        ok(c.sliver.every((w) => w === 0), tag(`${name} ficha ${c.s}: trozo del tamaño a la vista (${c.sliver})`))
      }
      note('alto de la ficha por tamaño (px)', `${engine} ${name}: ` + chips.map((c) => `${c.s} ${c.h[0][1]}`).join(' · '))
    }
    // Barrido del trozo de cifra (hallazgo 3): el ancho de la ficha de 140 a 320px, el tamaño entero o fuera de la vista
    await go(page, 'theme=audit')
    const bad = await page.evaluate(`(async () => { const { root, frames } = ${L}; const f = root('rd-md'); const chip = f.querySelector('.g-file-field__chip'); const bad = []
      for (let w = 140; w <= 320; w += 1) { chip.style.inlineSize = w + 'px'; chip.style.flex = 'none'; await frames(1)
        const s = chip.querySelector('.g-summary__subtitle'), sr = s.getBoundingClientRect(), br = chip.querySelector('.g-summary__body').getBoundingClientRect()
        if (sr.top < br.bottom - 0.5 && sr.width > 0.5 && sr.width < s.scrollWidth - 0.5) bad.push(w + ':' + sr.width.toFixed(1)) }
      chip.style.inlineSize = ''; chip.style.flex = ''; return bad })()`)
    ok(!bad.length, tag(`tamaño recortado a la vista en ${bad.length} anchos: ${bad.slice(0, 6)}`))
    await ctx.close()
  }

  /* 3 · Táctil (Chromium con isMobile): caja, ficha y botones ≥ 44px */
  if (run('touch') && engine === 'chromium') {
    const { ctx, page } = await mk({ width: 800, touch: true })
    await go(page, 'theme=audit')
    const t = await page.evaluate(`(() => { const { q, root, rect } = ${L}; return { coarse: matchMedia('(pointer: coarse)').matches, box: rect(q('e-xs-compact', '.g-file-field__box')).h, chip: Math.min(...[...root('st-xs').querySelectorAll('.g-file-field__chip')].map((c) => rect(c).h)),
      btn: [...root('st-md').querySelectorAll('.g-btn')].map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height) }) } })()`)
    ok(t.coarse && t.box >= 44 && t.chip >= 44 && t.btn.every((x) => x >= 44 - 0.01), tag(`táctil < 44px ${JSON.stringify(t)}`))
    note('táctil (px)', `${engine} caja xs/compact ${t.box} · ficha xs ${t.chip} · botón mínimo ${Math.min(...t.btn)}`)
    await ctx.close()
  }

  /* 4 · Arrastre de página: despertar sin mover nada, destino mayor, vecinos, puntero, apariencias; con un modal abierto */
  if (run('drag')) {
    const { ctx, page } = await mk()
    for (const [name, qs] of [['defecto', ''], ['auditoría', 'theme=audit']]) {
      await go(page, qs)
      await center(page, 'trow-a')
      const snap = () => page.evaluate(`(() => { const { rect } = ${L}; return [...document.querySelectorAll('.g-file-field, .g-input')].map((r) => { const b = r.querySelector('.g-file-field__box, .g-input__control'); const f = r.lastElementChild; return [rect(r), rect(b), rect(f)].map((x) => [x.l, x.t, x.w, x.h].map((v) => +v.toFixed(2))) }) })()`)
      const before = await snap()
      const live0 = await page.evaluate(() => [...document.querySelectorAll('.g-file-field__live')].map((l) => l.textContent).join('|'))
      await page.evaluate(`(async () => { const { root, drag, frames } = ${L}; drag(document.body); await frames(1); drag(root('t-over')); drag(root('t-overno')); await new Promise((r) => setTimeout(r, 400)) })()`)
      const after = await snap()
      ok(JSON.stringify(before) === JSON.stringify(after), tag(`${name}: despertar mueve cajas, raíces o pies (${before.findIndex((b, i) => JSON.stringify(b) !== JSON.stringify(after[i]))})`))
      const live1 = await page.evaluate(() => [...document.querySelectorAll('.g-file-field__live')].map((l) => l.textContent).join('|'))
      ok(live0 === live1, tag(`${name}: despertar anuncia algo`))
      const CASES = ['t-ok', 't-over', 't-no', 't-overno', 't-full']
      const tg = await page.evaluate(`(() => { const { q, rect, tok, root } = ${L}; const o = {}
        for (const c of ${JSON.stringify(CASES)}) { const t = q(c, '.g-file-field__target'), cs = getComputedStyle(t); o[c] = { cls: root(c).className, t: rect(t), box: rect(q(c, '.g-file-field__box')), label: rect(q(c, '.g-file-field__label')), op: cs.opacity, pe: cs.pointerEvents, bs: cs.borderTopStyle, soft: cs.backgroundColor === tok('--g-color-accent-soft', 'backgroundColor'), fill: cs.backgroundColor === tok('--g-color-accent', 'backgroundColor'), text: t.textContent.trim() } }
        return o })()`)
      for (const c of CASES) {
        const x = tg[c]
        ok(x.t.l < x.box.l && x.t.r > x.box.r && x.t.t < x.box.t && x.t.b > x.box.b, tag(`${name}: destino ${c} no es mayor que la caja`))
        ok(x.t.t >= x.label.b - 0.5, tag(`${name}: destino ${c} tapa la etiqueta (${x.t.t} < ${x.label.b})`))
        ok(x.op === '1' && x.text, tag(`${name}: destino ${c} no se ve o sin texto (${x.op}, «${x.text}»)`))
      }
      const inter = (a, b) => !(a.r <= b.l || b.r <= a.l || a.b <= b.t || b.b <= a.t)
      ok(!inter(tg['t-ok'].t, tg['t-over'].t) && !inter(tg['t-over'].t, tg['t-no'].t) && !inter(tg['t-overno'].t, tg['t-full'].t), tag(`${name}: destinos vecinos se solapan (compact)`))
      note('destino: sobresaliente y separación entre vecinos en compact (px)', `${engine} ${name}: ${(tg['t-ok'].box.l - tg['t-ok'].t.l).toFixed(2)} por lado · ${(tg['t-over'].t.l - tg['t-ok'].t.r).toFixed(2)} entre vecinos`)
      ok(tg['t-ok'].pe === 'auto' && tg['t-over'].pe === 'auto' && ['t-no', 't-overno', 't-full'].every((c) => tg[c].pe === 'none'), tag(`${name}: puntero del destino solo con is-awake-ok`))
      const sig = (x) => `${x.bs}/${x.fill ? 'sólido' : x.soft ? 'suave' : 'apagado'}`
      ok(sig(tg['t-ok']) === 'solid/suave' && sig(tg['t-over']) === 'solid/sólido' && ['t-no', 't-overno', 't-full'].every((c) => sig(tg[c]) === 'dashed/apagado'), tag(`${name}: apariencias ${CASES.map((c) => c + ' ' + sig(tg[c]))}`))
      ok(/Soltar en Fotos de frente/.test(tg['t-over'].text) && /no admite/.test(tg['t-overno'].text) && /está lleno/.test(tg['t-full'].text) && /Soltar aquí/.test(tg['t-ok'].text), tag(`${name}: textos del destino ${CASES.map((c) => tg[c].text)}`))
      // Soltar en un campo añade; todo se apaga
      await page.evaluate(`(async () => { const { q, drag } = ${L}; drag(q('t-ok', '.g-file-field__target'), 'image/png', 'drop'); await new Promise((r) => setTimeout(r, 300)) })()`)
      const dropped = await page.evaluate(`(() => { const { root } = ${L}; return { n: root('t-ok').querySelectorAll('.g-file-field__chip').length, awake: document.querySelectorAll('.g-file-field.is-awake').length } })()`)
      ok(dropped.n === 1 && dropped.awake === 0, tag(`${name}: soltar en el destino no añade o no apaga ${JSON.stringify(dropped)}`))
      // Con un GDialog modal abierto: solo despierta el campo del diálogo; nada de la página pinta por encima
      await page.click('#dlg-open')
      await page.waitForTimeout(400)
      const modal = await page.evaluate(`(async () => { const { root, drag, rect } = ${L}; drag(document.body); await new Promise((r) => setTimeout(r, 400))
        const page = [...document.querySelectorAll('.g-file-field')].filter((r) => !r.closest('dialog'))
        const dlg = root('dlg'), d = dlg.closest('dialog').getBoundingClientRect()
        const painted = page.filter((r) => { const t = r.querySelector('.g-file-field__target'); return parseFloat(getComputedStyle(t).opacity) > 0 || getComputedStyle(t).visibility !== 'hidden' })
        const res = { pageAwake: page.filter((r) => r.classList.contains('is-awake')).length, painted: painted.length, dlgAwake: dlg.classList.contains('is-awake-ok'), dlgOp: getComputedStyle(dlg.querySelector('.g-file-field__target')).opacity }
        drag(document.body, 'image/png', 'drop'); await new Promise((r) => setTimeout(r, 300)); return res })()`)
      ok(modal.pageAwake === 0 && modal.painted === 0 && modal.dlgAwake && modal.dlgOp === '1', tag(`${name}: con el modal abierto ${JSON.stringify(modal)}`))
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }
    await ctx.close()
  }

  /* 4b · Inerte y --g-form-min: un campo en un subárbol inert no despierta; la fila se parte antes de que «Adjuntar» baje */
  if (run('drag')) {
    const { ctx, page } = await mk()
    for (const [name, qs] of [['defecto', ''], ['auditoría', 'theme=audit']]) {
      await go(page, qs)
      const inert = await page.evaluate(`(async () => { const { root, drag } = ${L}; drag(document.body); await new Promise((r) => setTimeout(r, 300)); const r = root('inert-ff'); const res = [r.classList.contains('is-awake'), getComputedStyle(r.querySelector('.g-file-field__target')).opacity]; drag(document.body, 'image/png', 'drop'); await new Promise((r) => setTimeout(r, 200)); return res })()`)
      ok(inert[0] === false && inert[1] === '0', tag(`${name}: un campo inerte despierta ${inert}`))
      await center(page, 'sweep-host')
      let split = null
      const bad = []
      for (let w = 960; w >= 300; w -= 4) {
        const s = await page.evaluate(`(() => { const { q, root, rect } = ${L}; root('sweep-host').style.inlineSize = '${w}px'; return new Promise((res) => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => {
          const gi = rect(root('sw-in').querySelector('.g-input__control')), fb = rect(q('sw-ff', '.g-file-field__box')), add = rect(q('sw-ff', '.g-file-field__add')), chip = rect(q('sw-ff', '.g-file-field__chip'))
          res({ same: Math.abs(gi.t - fb.t) < 0.5, h: fb.h, gh: gi.h, oneLine: Math.abs(add.t + add.h / 2 - (chip.t + chip.h / 2)) < 1 }) })), 30)) })()`)
        if (s.same && (!s.oneLine || Math.abs(s.h - s.gh) > 0.5)) bad.push(w)
        if (!s.same && split === null) split = w
      }
      ok(!bad.length && split !== null, tag(`${name}: mientras comparte línea con GInput, «Adjuntar archivo» baja de línea (${bad.slice(0, 6)}) o la fila no se parte (${split})`))
      note('--g-form-min: ancho de la fila donde se parte (px)', `${engine} ${name}: ${split}`)
    }
    await ctx.close()
  }

  /* 5 · Fundido del destino (pendiente-coco del spec de personalidad): tras un cuadro de render, interpola en los tres motores */
  if (run('fade')) {
    const { ctx, page } = await mk()
    await go(page)
    await center(page, 'trow-a')
    const sample = (wait) => page.evaluate(`(async () => { const { root, drag, frames } = ${L}
      if (${wait}) await frames(1)
      const targets = ['t-ok', 't-over', 't-no'].map((c) => root(c).querySelector('.g-file-field__target'))
      drag(document.body); await new Promise((r) => setTimeout(r, 0)); targets.forEach((x) => getComputedStyle(x).opacity)
      const fades = targets.map((x) => x.getAnimations().find((a) => a.transitionProperty === 'opacity'))
      const s = []
      if (fades.every(Boolean)) { fades.forEach((f) => f.pause()); const d = fades[0].effect.getComputedTiming().duration
        for (let i = 0; i <= 8; i++) { fades.forEach((f) => { f.currentTime = (d * i) / 8 }); s.push(targets.map((x) => parseFloat(getComputedStyle(x).opacity))) } fades.forEach((f) => f.finish()) }
      const durs = fades.map((f) => (f ? f.effect.getComputedTiming().duration : null))
      drag(document.body, 'image/png', 'drop'); await frames(1); targets.forEach((x) => getComputedStyle(x).opacity)
      const sleep = targets.map((x) => (x.getAnimations().find((a) => a.transitionProperty === 'opacity') || { effect: { getComputedTiming: () => ({ duration: null }) } }).effect.getComputedTiming().duration)
      await new Promise((r) => setTimeout(r, 300))
      return { s, durs, sleep } })()`)
    const a = await sample(true)
    const mids = a.s.filter((row) => row.some((o) => o > 0.02 && o < 0.98))
    ok(mids.length >= 1 && a.durs.every((d) => d === 160), tag(`fundido de despertar sin valores intermedios o sin 160ms ${JSON.stringify(a)}`))
    ok(a.s.every((row) => Math.max(...row) - Math.min(...row) < 0.15), tag('los destinos no despiertan juntos'))
    ok(a.sleep.every((d) => d === 120), tag(`dormir sin 120ms ${JSON.stringify(a.sleep)}`))
    // Sin un cuadro de render entre el desplazamiento programático y el dragenter: lo que mide el spec (informativo)
    await page.evaluate(() => window.scrollTo(0, 0)); await center(page, 'trow-b')
    const b = await sample(false)
    note('fundido del destino: con un cuadro tras desplazar / en el mismo cuadro (transiciones creadas)', `${engine} ${a.durs.filter(Boolean).length}/3 · ${b.durs.filter(Boolean).length}/3`)
    await ctx.close()
  }

  /* 6 · Foco: Tab, quitar (siguiente, anterior, control), reintentar (se queda), descartar el aviso (control); anillo */
  if (run('focus')) {
    const { ctx, page } = await mk()
    await go(page, 'theme=audit')
    await center(page, 'focus')
    const add = (names) => page.evaluate((names) => window.__ab.refs.focusRef.value.add(names.map((n) => window.__ab.file(n))), names)
    await add(['ok-uno.pdf', 'ok-dos.pdf', 'ok-tres.pdf'])
    await page.waitForTimeout(300)
    const TAB = engine === 'webkit' ? 'Alt+Tab' : 'Tab'
    await page.evaluate(() => { const b = document.createElement('button'); b.id = 'before-focus'; b.textContent = 'antes'; const r = document.querySelector('[data-case="focus"]').closest('.g-file-field'); r.before(b); b.focus() })
    const seq = []
    for (let i = 0; i < 4; i++) { await page.keyboard.press(TAB); seq.push(await page.evaluate(() => document.activeElement.getAttribute('aria-label') || (document.activeElement.type === 'file' ? 'control' : document.activeElement.tagName))) }
    ok(JSON.stringify(seq) === JSON.stringify(['Quitar ok-uno.pdf', 'Quitar ok-dos.pdf', 'Quitar ok-tres.pdf', 'control']), tag(`orden de Tab ${seq}`))
    await page.waitForTimeout(300) // el anillo entra con una transición de color (--g-duration-fast)
    const ring = await page.evaluate(`(() => { const { q, px, tok } = ${L}; const b = q('focus', '.g-file-field__box'), cs = getComputedStyle(b); return { fv: q('focus', '.g-file-field__input').matches(':focus-visible'), w: parseFloat(cs.outlineWidth), s: cs.outlineStyle, c: cs.outlineColor, fc: tok('--g-color-focus'), fw: px('--g-focus-width') } })()`)
    ok(ring.fv && ring.s === 'solid' && ring.w >= 2 && Math.abs(ring.w - ring.fw) < 0.1 && ring.c === ring.fc, tag(`anillo de la caja ${JSON.stringify(ring)}`))
    const btnRing = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-case="focus"]')][0].closest('.g-file-field').querySelector('.g-file-field__remove'); b.focus(); const cs = getComputedStyle(b); return { s: cs.outlineStyle, w: parseFloat(cs.outlineWidth), fv: b.matches(':focus-visible') } })
    ok(btnRing.s !== 'none' && btnRing.w >= 2, tag(`anillo de «Quitar» ${JSON.stringify(btnRing)}`))
    const focusName = () => page.evaluate(() => document.activeElement.getAttribute('aria-label') || (document.activeElement.type === 'file' ? 'control' : document.activeElement.tagName))
    const press = async (label) => { await page.evaluate((l) => [...document.querySelectorAll('.g-btn')].find((b) => b.getAttribute('aria-label') === l).focus(), label); await page.keyboard.press('Enter'); await page.waitForTimeout(150) }
    await press('Quitar ok-dos.pdf'); const f1 = await focusName()
    await press('Quitar ok-tres.pdf'); const f2 = await focusName()
    await press('Quitar ok-uno.pdf'); const f3 = await focusName()
    ok(f1 === 'Quitar ok-tres.pdf' && f2 === 'Quitar ok-uno.pdf' && f3 === 'control', tag(`foco tras quitar: ${f1} · ${f2} · ${f3}`))
    await add(['once-reintento.pdf']); await page.waitForTimeout(250)
    await press('Reintentar once-reintento.pdf'); const f4 = await focusName()
    const st4 = await page.evaluate(() => document.querySelector('[data-case="focus"]').closest('.g-file-field').querySelector('.g-file-field__chip').dataset.state)
    ok(f4 === 'Cancelar subida de once-reintento.pdf' && st4 === 'uploading', tag(`foco tras reintentar: ${f4} (${st4})`))
    await press('Cancelar subida de once-reintento.pdf'); const f5 = await focusName()
    ok(f5 === 'control', tag(`foco tras cancelar la única: ${f5}`))
    await page.evaluate(() => window.__ab.refs.noticeRef.value.add([window.__ab.file('grande.png', 5000, 'image/png')]))
    await page.waitForTimeout(100)
    await page.evaluate(() => document.querySelector('[data-case="notice"]').closest('.g-file-field').querySelector('.g-file-field__notice .g-btn').focus())
    await page.keyboard.press('Enter'); await page.waitForTimeout(150)
    const f6 = await page.evaluate(() => document.activeElement === document.querySelector('[data-case="notice"]') && !document.querySelector('[data-case="notice"]').closest('.g-file-field').querySelector('.g-file-field__notice'))
    ok(f6, tag('«Descartar» no devuelve el foco al control o el aviso no se va'))
    await ctx.close()
  }

  /* 7 · Anuncios: gesto, lote, fallo, quitar, cancelar, reintentar; región oculta a la vista; nada al despertar */
  if (run('live')) {
    const { ctx, page } = await mk()
    await go(page)
    await page.evaluate(() => { window.__said = []; const l = document.querySelector('[data-case="focus"]').closest('.g-file-field').querySelector('.g-file-field__live'); new MutationObserver(() => { const t = l.textContent.trim(); if (t) window.__said.push(t) }).observe(l, { childList: true, characterData: true, subtree: true }) })
    const said = () => page.evaluate(() => window.__said.splice(0))
    const add = (names) => page.evaluate((names) => window.__ab.refs.focusRef.value.add(names.map((n) => window.__ab.file(n))), names)
    await add(['fast-a.pdf', 'fast-b.pdf']); await page.waitForTimeout(900)
    const s1 = await said()
    ok(s1[0] === 'Añadidos 2 archivos. Subiendo 2.' && s1.includes('2 archivos subidos.') && s1.length === 2, tag(`anuncios al añadir y por lote ${JSON.stringify(s1)}`))
    await add(['err-roto.pdf']); await page.waitForTimeout(300)
    const s2 = await said()
    // El escritor de la región junta lo que llega dentro de su retardo (50ms): el gesto y el fallo inmediato van en un anuncio
    const j2 = s2.join(' ')
    ok(j2.includes('Añadido err-roto.pdf. Subiendo.') && j2.includes('No se pudo subir err-roto.pdf: Se interrumpió la conexión con el servidor.'), tag(`anuncio de fallo ${JSON.stringify(s2)}`))
    await page.evaluate(() => [...document.querySelectorAll('.g-btn')].find((b) => b.getAttribute('aria-label') === 'Quitar err-roto.pdf').click()); await page.waitForTimeout(200)
    const s3 = await said()
    ok(s3[0] === 'Quitado err-roto.pdf. Quedan 2 archivos.', tag(`anuncio al quitar ${JSON.stringify(s3)}`))
    await add(['hold-c.pdf']); await page.waitForTimeout(200); await said()
    await page.evaluate(() => [...document.querySelectorAll('.g-btn')].find((b) => b.getAttribute('aria-label') === 'Cancelar subida de hold-c.pdf').click()); await page.waitForTimeout(200)
    const s4 = await said()
    ok(s4[0] === 'Subida de hold-c.pdf cancelada. Quedan 2 archivos.', tag(`anuncio al cancelar ${JSON.stringify(s4)}`))
    await add(['once-r.pdf']); await page.waitForTimeout(250); await said()
    await page.evaluate(() => [...document.querySelectorAll('.g-btn')].find((b) => b.getAttribute('aria-label') === 'Reintentar once-r.pdf').click()); await page.waitForTimeout(200)
    const s5 = await said()
    ok(s5[0] === 'Reintentando once-r.pdf.', tag(`anuncio al reintentar ${JSON.stringify(s5)}`))
    const vis = await page.evaluate(() => [...document.querySelectorAll('.g-file-field__live')].every((l) => { const r = l.getBoundingClientRect(); return r.width <= 1 && r.height <= 1 && getComputedStyle(l).clipPath !== 'none' }))
    ok(vis, tag('una región viva se ve'))
    // En un modal: el anuncio de un campo de la página se escribe en una región dentro del diálogo
    await page.click('#dlg-open'); await page.waitForTimeout(400)
    await page.evaluate(() => window.__ab.refs.focusRef.value.add([window.__ab.file('ok-modal.pdf')])); await page.waitForTimeout(300)
    const inModal = await page.evaluate(() => [...document.querySelectorAll('dialog .g-file-field__live')].map((l) => l.textContent).join('|'))
    ok(/ok-modal\.pdf/.test(inModal), tag(`con un modal, el anuncio no llega al diálogo («${inModal}»)`))
    await ctx.close()
  }

  /* 8 · Envío bloqueado: pendiente → resumen al control; fallido → resumen al «Reintentar»; mensaje y sacudida */
  if (run('block')) {
    for (const motion of ['no-preference', 'reduce']) {
      const { ctx, page } = await mk({ motion })
      await go(page, 'theme=audit')
      await center(page, 'block')
      await page.evaluate(() => window.__ab.refs.blockRef.value.add([window.__ab.file('hold-b.pdf')]))
      await page.waitForTimeout(200)
      const pre = await page.evaluate(() => document.querySelector('[data-case="block"]').closest('.g-file-field').className)
      ok(!/is-invalid/.test(pre), tag(`${motion}: añadir con subida en curso pinta error`))
      await page.click('#send')
      const anim = await page.evaluate(() => new Promise((res) => { const r = document.querySelector('[data-case="block"]').closest('.g-file-field'); const box = r.querySelector('.g-file-field__box'); const names = new Set(); let moved = false; const t0 = performance.now()
        const tick = () => { const cs = getComputedStyle(box); names.add(cs.animationName); if (cs.translate && cs.translate !== 'none' && parseFloat(cs.translate) !== 0) moved = true; if (performance.now() - t0 < 700) requestAnimationFrame(tick); else res({ names: [...names], moved, rejected: r.classList.contains('is-rejected') }) }; requestAnimationFrame(tick) }))
      if (motion === 'reduce') ok(!anim.moved && !anim.names.includes('g-reject-file-field'), tag(`reduce: la caja se sacude ${JSON.stringify(anim)}`))
      else ok(anim.moved && anim.names.includes('g-reject-file-field') && !anim.rejected, tag(`la caja no se sacude o no retira is-rejected ${JSON.stringify(anim)}`))
      const s1 = await page.evaluate(() => { const r = document.querySelector('[data-case="block"]').closest('.g-file-field'); const a = document.querySelector('.g-error-summary__link'); return { sent: document.getElementById('sent').textContent, link: a && a.textContent, href: a && a.getAttribute('href'), inv: r.classList.contains('is-invalid'), msg: r.querySelector('.g-file-field__message').textContent.trim() } })
      ok(s1.sent === 'invalid' && /Espera a que termine de subir hold-b\.pdf/.test(s1.link || '') && s1.inv && /Espera a que termine/.test(s1.msg), tag(`${motion}: bloqueo con pendiente ${JSON.stringify(s1)}`))
      await page.click('.g-error-summary__link'); await page.waitForTimeout(250)
      const f1 = await page.evaluate(() => document.activeElement === document.querySelector('[data-case="block"]'))
      ok(f1, tag(`${motion}: el enlace del resumen no lleva al control`))
      await page.evaluate(() => [...document.querySelectorAll('.g-btn')].find((b) => b.getAttribute('aria-label') === 'Cancelar subida de hold-b.pdf').click())
      await page.evaluate(() => window.__ab.refs.blockRef.value.add([window.__ab.file('err-b.pdf')]))
      await page.waitForTimeout(250)
      await page.click('#send'); await page.waitForTimeout(250)
      // Con el teclado (Intro en el enlace): así llega quien navega sin puntero y el anillo es :focus-visible
      // tras el envío el foco está en el resumen; Tab llega al enlace (Opción+Tab en WebKit) e Intro lo sigue
      await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab'); await page.keyboard.press('Enter'); await page.waitForTimeout(250)
      const f2 = await page.evaluate(() => ({ l: document.activeElement.getAttribute('aria-label'), d: document.getElementById(document.activeElement.getAttribute('aria-describedby') || 'x')?.textContent }))
      ok(f2.l === 'Reintentar err-b.pdf' && /Error: Se interrumpió/.test(f2.d || ''), tag(`${motion}: el enlace no lleva al «Reintentar» ${JSON.stringify(f2)}`))
      const fv = await page.evaluate(() => { const b = document.activeElement, cs = getComputedStyle(b); return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 })
      ok(fv, tag(`${motion}: el «Reintentar» enfocado desde el resumen no muestra el anillo`))
      await ctx.close()
    }
  }

  /* 9 · Movimiento: aterrizaje (escala 0.86 → 1, origen al final de la lectura, sin rebase) y con reduce solo fundido */
  if (run('motion')) {
    for (const motion of ['no-preference', 'reduce']) for (const dir of ['ltr', 'rtl']) {
      const { ctx, page } = await mk({ motion })
      await go(page)
      await center(page, 'focus')
      const s = await page.evaluate(async (dir) => {
        const r = document.querySelector('[data-case="focus"]').closest('.g-file-field'); r.parentElement.dir = dir
        await new Promise((res) => requestAnimationFrame(res))
        window.__ab.refs.focusRef.value.add([window.__ab.file('ok-aterriza.pdf')])
        await new Promise((res) => setTimeout(res, 0))
        const chip = r.querySelector('.g-file-field__chip')
        const out = { scales: [], name: '', origin: getComputedStyle(chip).transformOrigin, w: chip.getBoundingClientRect().width, landing: chip.classList.contains('is-landing') }
        const a = chip.getAnimations().find((x) => String(x.animationName || '').startsWith('g-file-field-land'))
        if (a) { out.name = a.animationName; a.pause(); const d = a.effect.getComputedTiming().duration; for (let i = 0; i <= 10; i++) { a.currentTime = (d * i) / 10; const sc = getComputedStyle(chip).scale; out.scales.push(sc === 'none' ? 1 : parseFloat(sc)) } a.play() }
        await new Promise((res) => setTimeout(res, 500))
        out.after = chip.classList.contains('is-landing')
        return out
      }, dir)
      if (motion === 'reduce') ok(s.name === 'g-file-field-land-fade' && s.scales.every((x) => x === 1) && !s.after, tag(`reduce ${dir}: aterrizaje ${JSON.stringify(s)}`))
      else {
        const mids = s.scales.filter((x) => x > 0.861 && x < 0.999)
        ok(s.name === 'g-file-field-land' && Math.abs(s.scales[0] - 0.86) < 0.01 && mids.length >= 2 && Math.max(...s.scales) <= 1 + 1e-6 && s.scales.at(-1) === 1 && !s.after, tag(`${dir}: aterrizaje ${JSON.stringify(s)}`))
        const ox = parseFloat(s.origin)
        ok(dir === 'ltr' ? ox > s.w - 1 : ox < 1, tag(`${dir}: el origen del aterrizaje no está al final de la lectura (${s.origin}, ancho ${s.w})`))
      }
      await ctx.close()
    }
  }

  /* 10 · RTL y 320px: sin desborde; el relleno avanza desde el inicio de la lectura y el frente está en el final */
  if (run('rtl')) {
    const { ctx, page } = await mk({ width: 360 })
    for (const qs of ['', 'theme=audit']) {
      await go(page, qs)
      const n = await page.evaluate(`(() => { const { root, q, rect } = ${L}; const o = {}
        for (const c of ['w320-ltr', 'w320-rtl']) { const h = root(c), hr = rect(h); let worst = 0
          const vis = (el) => { let r = el.getBoundingClientRect(), l = r.left, rr = r.right; for (let n = el.parentElement; n && n !== h; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.overflowX !== 'visible' || cs.clipPath !== 'none') { const b = n.getBoundingClientRect(); l = Math.max(l, b.left); rr = Math.min(rr, b.right) } } return { l, r: rr, w: r.width } }
          for (const el of h.querySelectorAll('*')) { if (getComputedStyle(el).clipPath !== 'none' || el.closest('.g-file-field__live')) continue; const r = vis(el); if (!r.w || r.r <= r.l) continue; worst = Math.max(worst, hr.l - r.l, r.r - hr.r) }
          o[c] = { worst, sw: h.scrollWidth, cw: h.clientWidth } }
        for (const c of ['up-ltr', 'up-rtl']) { const chip = root(c).querySelector('.g-file-field__chip'), fill = chip.querySelector('.g-progress__fill'), cr = rect(chip), fr = rect(fill), cs = getComputedStyle(fill)
          o[c] = { lead: getComputedStyle(chip).direction === 'rtl' ? (cr.r - Math.max(fr.l, cr.l)) / cr.w : (Math.min(fr.r, cr.r) - cr.l) / cr.w, bl: parseFloat(cs.borderLeftWidth), br: parseFloat(cs.borderRightWidth) } }
        o.doc = document.documentElement.scrollWidth - innerWidth
        return o })()`)
      for (const c of ['w320-ltr', 'w320-rtl']) ok(n[c].worst <= 0.5 && n[c].sw <= n[c].cw, tag(`${qs || 'defecto'} ${c}: desborde ${n[c].worst.toFixed(2)}px (scroll ${n[c].sw}/${n[c].cw})`))
      for (const c of ['up-ltr', 'up-rtl']) ok(Math.abs(n[c].lead - 0.42) < 0.03, tag(`${qs || 'defecto'} ${c}: el relleno no llega al 42 % desde el inicio de la lectura (${n[c].lead.toFixed(3)})`))
      ok(n['up-ltr'].br > 0 && n['up-ltr'].bl === 0 && n['up-rtl'].bl > 0 && n['up-rtl'].br === 0, tag(`${qs || 'defecto'}: frente de avance en el lado equivocado ${JSON.stringify([n['up-ltr'], n['up-rtl']])}`))
    }
    await ctx.close()
  }

  /* 11 · Texto al 200 % (tamaño de letra raíz): Δ0 con GInput, la ficha contiene su texto, nada desborda */
  if (run('zoom')) {
    const { ctx, page } = await mk()
    for (const qs of ['zoom=2', 'zoom=2&theme=audit']) {
      await go(page, qs)
      const z = await page.evaluate(`(() => { const { root, q, rect } = ${L}; const out = { rows: [], chips: [] }
        for (const d of ['default', 'compact']) for (const s of ['xs', 'md', 'xl']) {
          const gi = rect(root('in-' + s + '-' + d).querySelector('.g-input__control')), e = rect(q('e-' + s + '-' + d, '.g-file-field__box'))
          const g1 = rect(root('in1-' + s + '-' + d).querySelector('.g-input__control')), o = rect(q('o-' + s + '-' + d, '.g-file-field__box')), chip = q('o-' + s + '-' + d, '.g-file-field__chip')
          out.rows.push({ k: s + '/' + d, de: +(e.h - gi.h).toFixed(2), dt: +(e.t - gi.t).toFixed(2), d1: +(o.h - g1.h).toFixed(2), chipH: rect(chip).h, btnH: Math.max(...[...chip.querySelectorAll('.g-btn')].map((b) => rect(b).h)), lh: parseFloat(getComputedStyle(chip).lineHeight) }) }
        for (const s of ['xs', 'md', 'xl', 'soft']) for (const c of root('st-' + s).querySelectorAll('.g-file-field__chip')) { const cr = rect(c), t = rect(c.querySelector('.g-summary__title')); out.chips.push({ k: s + ' ' + c.dataset.state, over: +Math.max(cr.t - t.t, t.b - cr.b).toFixed(2), h: cr.h }) }
        out.doc = document.documentElement.scrollWidth - innerWidth
        return out })()`)
      for (const r of z.rows) {
        ok(Math.abs(r.de) < 0.5 && Math.abs(r.dt) < 0.5, tag(`${qs} ${r.k}: caja vacía Δalto ${r.de} Δtop ${r.dt} frente a GInput`))
        ok(Math.abs(r.d1) < 0.5 || r.chipH <= Math.max(24, r.btnH, r.lh) + 0.5, tag(`${qs} ${r.k}: caja con un archivo Δ${r.d1} sin que la ficha esté en su piso (ficha ${r.chipH}, botón ${r.btnH}, línea ${r.lh})`))
        if (Math.abs(r.d1) >= 0.5) note('texto al 200 %: caja con un archivo más alta que GInput (la ficha en el piso de sus botones; permitido)', `${engine} ${qs} ${r.k} Δ${r.d1}`)
      }
      ok(z.chips.every((c) => c.over <= 0.5), tag(`${qs}: texto que sale de la ficha ${JSON.stringify(z.chips.filter((c) => c.over > 0.5).slice(0, 4))}`))
      const hs = new Map(); for (const c of z.chips) { const s = c.k.split(' ')[0]; (hs.get(s) || hs.set(s, []).get(s)).push(c.h) }
      for (const [s, h] of hs) ok(Math.max(...h) - Math.min(...h) < 0.01, tag(`${qs} ficha ${s}: Δ entre estados ${h}`))
      ok(z.doc <= 0, tag(`${qs}: la página desborda en horizontal (${z.doc})`))
    }
    await ctx.close()
  }

  /* 12 · forced-colors emulado */
  if (run('forced')) {
    const { ctx, page } = await mk()
    let supported = true
    try { await page.emulateMedia({ forcedColors: 'active' }) } catch { supported = false }
    await go(page)
    const active = supported && await page.evaluate(() => matchMedia('(forced-colors: active)').matches)
    if (active) {
      await page.evaluate(`(async () => { const { root, drag, frames } = ${L}; drag(document.body); await frames(1); drag(root('t-over')); await new Promise((r) => setTimeout(r, 400)) })()`)
      await page.keyboard.press('Shift')
      await page.evaluate(() => document.querySelector('[data-case="empty"]').focus())
      const fc = await page.evaluate(`(() => { const { q, root, parse } = ${L}
        const sys = (k, p = 'color') => { const e = document.createElement('i'); e.style[p] = k; document.body.append(e); const c = getComputedStyle(e)[p]; e.remove(); return c }
        const up = q('st-md', '.g-file-field__chip[data-state="uploading"]'), fill = up.querySelector('.g-progress__fill'), fcs = getComputedStyle(fill)
        const done = q('st-md', '.g-file-field__chip[data-state="done"]:not([data-stored])')
        return { hl: sys('Highlight'), ct: sys('CanvasText'), canvas: sys('Canvas', 'backgroundColor'), ring: getComputedStyle(q('empty', '.g-file-field__box')).outlineColor, ringW: parseFloat(getComputedStyle(q('empty', '.g-file-field__box')).outlineWidth),
          chipO: getComputedStyle(up).outlineStyle, errO: getComputedStyle(q('st-md', '.g-file-field__chip[data-state="error"]')).outlineStyle,
          fillBg: parse(fcs.backgroundColor)[3], fillEdge: fcs.borderRightColor, fillLine: fcs.borderBottomColor,
          overBg: getComputedStyle(q('t-over', '.g-file-field__target')).backgroundColor, okB: getComputedStyle(q('t-ok', '.g-file-field__target')).borderTopColor, noS: getComputedStyle(q('t-no', '.g-file-field__target')).borderTopStyle,
          doneA: getComputedStyle(done, '::after').backgroundColor, tile: getComputedStyle(q('rd-md', '.g-summary__lead > .g-icon')).backgroundColor, under: getComputedStyle(q('t-over', '.g-file-field__add')).opacity } })()`)
      ok(fc.ring === fc.hl && fc.ringW >= 2, tag(`forced: anillo ${fc.ring}`))
      ok(fc.chipO === 'solid' && fc.errO === 'dashed', tag(`forced: contorno de la ficha ${fc.chipO}/${fc.errO}`))
      ok(fc.fillBg === 0 && fc.fillEdge === fc.hl && fc.fillLine === fc.hl, tag(`forced: progreso ${JSON.stringify(fc)}`))
      ok(fc.overBg === fc.hl && fc.okB === fc.hl && fc.noS === 'dashed', tag(`forced: destino ${fc.overBg} ${fc.okB} ${fc.noS}`))
      ok(fc.doneA === fc.ct && fc.tile === fc.canvas && fc.under === '0', tag(`forced: filo, tesela o lo de debajo del destino ${JSON.stringify(fc)}`))
      note('forced-colors emulado', `${engine}: medido`)
    } else note('forced-colors emulado', `${engine}: la emulación no activa la consulta (no medido)`)
    await ctx.close()
  }

  ok(!errors.length, tag('consola: ' + [...new Set(errors)].slice(0, 5).join(' | ')))
  await browser.close()
}

server.close()
for (const [k, v] of Object.entries(measures)) console.log(`· ${k}\n    ${v.join('\n    ')}`)
console.log('\nPor motor: ' + Object.entries(perEngine).map(([e, [n, f]]) => `${e} ${n - f}/${n}`).join(' · '))
if (fails.length) console.log('\nFALLOS:\n  ' + fails.slice(0, args.verbose ? 999 : 60).join('\n  '))
console.log(`\n${total - failed}/${total} comprobaciones`)
process.exit(failed ? 1 : 0)
