// Verificación de coco sobre el banco de la Fase 2 de GCombobox (multiple): design/lab/combobox/estilo-multiple-banco.html,
// con el CSS real (GCombobox.css en la capa grana.components) y los componentes reales de dist/.
// Mide: análisis estático del CSS de la Fase 2 (solo var(--g-*) y --_*, sin respaldos ni literales de color, sin @layer;
// keyframes g-combobox-roll/-tick/-row…; nunca g-reject…; animaciones solo con no-preference; bounce y spring solo dentro
// de @supports); A · Δ0 de la caja, la fila y lo de debajo de 0 a 8 y 40 elegidas en una GFormRow, la frase en una línea
// dentro de la celda, ≤ 55 % con el foco y text-muted, cesión con «y N más», primer elemento con elipsis, marca de
// Retroceso (tachado + selección), alto por tamaño igual a GInput; panel: «Elegidas» primero, casilla (tamaño, centrada en
// la línea del título, borde ≥ 3:1, marcada ≥ 3:1, marca ≥ 3:1, también en la activa invertida), tope (estado, casillas
// apagadas), «Ver las N»; B · receta en el pie (tercera pista), caja y vecina Δ0, lo de debajo baja un renglón, rastro del
// mismo alto que el renglón, «Nueva» (etiqueta y barra al inicio), áreas táctiles, «Ver los N» con el chevron girado;
// C · cesta 6 : 5 sin solapes, pie con recuento y «Listo», viaje; hoja a 375 y 320 (sin desborde, «Elegidas», filas
// ≥ 44px); movimiento (cifras, casilla con rebote, renglón que crece y se pliega, viaje con muelle; retirada de clases);
// movimiento reducido (nada se anima, no quedan clases); RTL; forced-colors emulado (L42); puntero grueso (44px); contraste
// de todo lo nuevo en el tema por defecto claro y oscuro, el tema del CLI de auditoria-tema.json (claro y oscuro) y, en
// Chromium, los once temas generados (claro y oscuro); consola limpia.
// Ejecutar desde la raíz del repo: GRANA_PW_PORT=4209 node design/lab/combobox/estilo-multiple-verificar.mjs
// Opciones: --engines=chromium,firefox,webkit   --verbose   --serve (solo sirve el banco)
// GRANA_DIST=/ruta/a/dist sirve /packages/vue/dist/ desde otra copia (p. ej. mientras bruno compila).
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const DIST = process.env.GRANA_DIST
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const p = DIST && rel.startsWith('/packages/vue/dist/') ? join(DIST, rel.slice('/packages/vue/dist/'.length)) : normalize(join(ROOT, rel))
    if (!DIST && !p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4209, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/combobox/estilo-multiple-banco.html`
if (args.serve) { console.log(BASE); await new Promise(() => {}) }

let total = 0, failed = 0
const fails = [], measures = {}
let ctxName = ''
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(`[${ctxName}] ${msg}`) } }
const note = (k, v) => { (measures[k] ??= []).push(v) }

// ---------- Estático: la sección de la Fase 2 ----------
{
  ctxName = 'estático'
  const css = await readFile(join(ROOT, 'packages/vue/src/components/GCombobox/GCombobox.css'), 'utf8')
  const start = css.lastIndexOf('FASE 2 · VARIAS')
  ok(start > 0, 'sección «FASE 2 · VARIAS» presente')
  const f2 = css.slice(css.lastIndexOf('/*', start), css.indexOf('/* ---------- Preferencias del sistema')).replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/@layer/.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), 'sin @layer')
  ok(!/var\(--[\w-]+\s*,/.test(f2), 'sin valores de respaldo en var()')
  ok(!/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(/.test(f2), 'sin literales de color')
  const px = [...f2.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[1]).filter((v) => !['24', '44'].includes(v))
  ok(px.length === 0, `sin px literales salvo 24/44 (encontrados: ${px.join(', ')})`)
  const vars = [...f2.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]).filter((v) => !v.startsWith('--g-') && !v.startsWith('--_'))
  ok(vars.length === 0, `solo --g-* y --_* (${vars.join(', ')})`)
  const kf = [...f2.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
  ok(kf.length >= 4 && kf.every((k) => /^g-combobox-(roll|tick|row)/.test(k)), `keyframes con prefijo propio (${kf.join(', ')})`)
  ok(!/g-reject/.test(f2), 'ninguna animación g-reject…')
  // Toda declaración animation: dentro de @media (prefers-reduced-motion: no-preference)
  const blocks = f2.split(/@media\s*\(prefers-reduced-motion:\s*no-preference\)/)
  ok(!/\banimation\s*:/.test(blocks[0]) || false, 'animation solo con no-preference (antes del primer bloque)')
  ok(!/linear\(|ease-bounce|ease-spring/.test(f2.replace(/@supports \(transition-timing-function: linear\(0, 1\)\)\s*\{[^{}]*(\{[^{}]*\}[^{}]*)*\}/g, '')), 'bounce y spring solo dentro de @supports')
  ok(/@media \(forced-colors: active\)/.test(f2), 'reglas de forced-colors')
}

// ---------- Utilidades de página ----------
const HELPERS = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (a, b) => [a[0] * a[3] + b[0] * (1 - a[3]), a[1] * a[3] + b[1] * (1 - a[3]), a[2] * a[3] + b[2] * (1 - a[3]), 1]
  const bgOf = (el) => {
    const stack = []
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor
      const v = rgba(c); if (v[3] > 0) stack.push(v); if (v[3] >= 1) break
      if (e.matches('dialog[open]') && getComputedStyle(e).backgroundColor === 'rgba(0, 0, 0, 0)') { /* sigue */ }
    }
    let acc = rgba(getComputedStyle(document.body).backgroundColor); if (acc[3] < 1) acc = over(acc, [255, 255, 255, 1])
    for (let i = stack.length - 1; i >= 0; i--) acc = over(stack[i], acc)
    return acc
  }
  const lum = ([r, g, b]) => { const f = (x) => { x /= 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05) }
  window.__h = {
    rgba, bgOf,
    text: (el) => { const bg = bgOf(el); const fg = over(rgba(getComputedStyle(el).color), bg); return ratio(fg, bg) },
    pair: (fgColor, el) => { const bg = bgOf(el); return ratio(over(rgba(fgColor), bg), bg) },
    colors: (a, b) => ratio(over(rgba(a), [255, 255, 255, 1]), over(rgba(b), [255, 255, 255, 1])),
    tok: (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    px: (n) => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;block-size:var(' + n + ')'; document.body.append(d); const v = d.getBoundingClientRect().height; d.remove(); return v },
    r: (el) => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height } },
    q: (s, root = document) => root.querySelector(s),
    anims: (re) => document.getAnimations().filter((a) => re.test(a.animationName || '')).map((a) => ({ name: a.animationName, easing: a.effect.getComputedTiming().easing || getComputedStyle(a.effect.target).animationTimingFunction })),
    frames: () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  }
}

async function load(page, qs = '') {
  await page.goto(BASE + qs)
  await page.waitForSelector('html[data-ready]', { timeout: 20000 })
  await page.evaluate(HELPERS)
  await page.waitForTimeout(150)
}
const settle = (page, ms = 120) => page.waitForTimeout(ms)
const m = (page, fn, arg) => page.evaluate(fn, arg).catch((e) => { throw new Error(e.message.split('\n')[0] + ' ⟵ ' + fn.toString().slice(0, 160).replace(/\s+/g, ' ')) })

const THEMES = [['', 'por defecto'], ['auditoria', 'auditoría (CLI)']]
const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']

// ---------- Contraste de todo lo nuevo en una configuración ----------
async function contrast(page, label) {
  // A en reposo y con el foco
  const a = await m(page, async () => {
    const H = window.__h, out = {}
    __cbm.get('a-armed').arm(); await H.frames()
    out.sentence = H.text(H.q('.xm-a-dx .g-combobox__sentence-item'))
    out.rest = H.text(H.q('.xm-a-many .g-combobox__sentence-rest'))
    out.armed = H.text(H.q('.xm-a-armed .g-combobox__sentence-item.is-armed'))
    __cbm.get('a-free').set([], ['Polen de olivo']); await H.frames(); await new Promise((r) => setTimeout(r, 60))
    out.customIcon = H.pair(getComputedStyle(H.q('.xm-a-free .g-combobox__sentence-icon')).color, H.q('.xm-a-free .g-combobox__sentence-item.is-custom'))
    H.q('.xm-a-dx input[role=combobox]').focus(); await H.frames(); await new Promise((r) => setTimeout(r, 60))
    out.sentenceFocus = H.text(H.q('.xm-a-dx .g-combobox__sentence-item'))
    H.q('.xm-a-dx input[role=combobox]').blur(); await H.frames()
    return out
  })
  // Panel abierto (A)
  const p = await m(page, async () => {
    const H = window.__h, out = {}
    __cbm.get('a-open').show(); await H.frames(); await new Promise((r) => setTimeout(r, 350))
    const root = __cbm.get('a-open').root()
    const sel = root.querySelector('.g-combobox__option[aria-selected="true"] .g-combobox__box')
    const un = root.querySelector('.g-combobox__option[aria-selected="false"] .g-combobox__box')
    const optBg = un.closest('.g-combobox__option')
    out.groupLabel = H.text(root.querySelector('.g-combobox__group.is-chosen .g-combobox__group-label'))
    out.tally = H.text(root.querySelector('.g-combobox__group-tally'))
    out.boxBorder = H.pair(getComputedStyle(un).borderTopColor, optBg)
    out.boxSel = H.pair(getComputedStyle(sel).borderTopColor, sel.closest('.g-combobox__option'))
    out.mark = H.colors(getComputedStyle(sel).color, getComputedStyle(sel).backgroundColor)
    __cbm.get('a-open').hide(); await H.frames()
    __cbm.get('a-max').show(); await H.frames(); await new Promise((r) => setTimeout(r, 350))
    out.max = H.text(__cbm.get('a-max').root().querySelector('.g-combobox__status--max'))
    __cbm.get('a-max').hide(); await H.frames()
    return out
  })
  // B
  const b = await m(page, async () => {
    const H = window.__h, out = {}, R = __cbm.get('b-states').root()
    out.number = H.text(R.querySelector('.g-combobox__row-number'))
    const fresh = R.querySelector('.g-combobox__row-fresh'); out.fresh = H.text(fresh)
    const row = fresh.closest('.g-combobox__row'); out.bar = H.pair(getComputedStyle(row, '::before').backgroundColor, row)
    out.trace = H.text(R.querySelector('.g-combobox__trace'))
    out.undo = H.text(R.querySelector('.g-combobox__undo'))
    const armed = R.querySelector('.g-combobox__row.is-armed .g-summary__title'); out.armedRow = H.text(armed)
    out.remove = H.pair(getComputedStyle(R.querySelector('.g-combobox__remove')).color, R.querySelector('.g-combobox__remove'))
    out.rowsAll = H.text(__cbm.get('b-many').root().querySelector('.g-combobox__rows-all'))
    return out
  })
  // C: cesta y pie; la activa invertida con la casilla
  const c = await m(page, async () => {
    const H = window.__h, out = {}
    __cbm.get('c-pal').openSurface(); await new Promise((r) => setTimeout(r, 500))
    const S = document.getElementById('c-pal-surface')
    out.basketTitle = H.text(S.querySelector('.g-combobox__basket-title'))
    out.basketTally = H.text(S.querySelector('.g-combobox__basket-tally'))
    out.footTally = H.text(S.querySelector('.g-combobox__foot-tally'))
    out.basketRow = H.text(S.querySelector('.g-combobox__basket .g-summary__title'))
    __cbm.get('c-pal').removeKey(__cbm.get('c-pal').state().keys.at(-1)); await new Promise((r) => setTimeout(r, 250))
    out.basketTrace = H.text(S.querySelector('.g-combobox__basket .g-combobox__trace'))
    out.basketUndo = H.text(S.querySelector('.g-combobox__basket .g-combobox__undo'))
    __cbm.get('c-pal').restore(); await H.frames()
    // activa invertida sobre una elegida y sobre una no elegida
    const opts = [...S.querySelectorAll('.g-combobox__option')]
    const iSel = opts.findIndex((o) => o.getAttribute('aria-selected') === 'true'), iUn = opts.findIndex((o) => o.getAttribute('aria-selected') === 'false')
    __cbm.get('c-pal').setActive(iSel); await new Promise((r) => setTimeout(r, 300))
    let box = opts[iSel].querySelector('.g-combobox__box')
    out.invSelBox = H.pair(getComputedStyle(box).borderTopColor, opts[iSel])
    __cbm.get('c-pal').setActive(iUn); await new Promise((r) => setTimeout(r, 300))
    box = opts[iUn].querySelector('.g-combobox__box')
    out.invUnBox = Math.max(H.pair(getComputedStyle(box).borderTopColor, opts[iUn]), H.pair(getComputedStyle(box).backgroundColor, opts[iUn]))
    __cbm.get('c-pal').closeSurface(); await new Promise((r) => setTimeout(r, 400))
    __cbm.get('c-empty').openSurface(); await new Promise((r) => setTimeout(r, 500))
    out.basketEmpty = H.text(document.querySelector('#c-empty-surface .g-combobox__basket-empty'))
    __cbm.get('c-empty').closeSurface(); await new Promise((r) => setTimeout(r, 400))
    return out
  })
  // Geometría en este tema: Δ0 de A (0, 8, 40) y renglones/rastro del mismo alto
  const g = await m(page, async () => {
    const H = window.__h, api = __cbm.get('a-row'), R = api.root(), K = ['penicilina', 'latex', 'ibuprofeno', 'sulfonamidas', ...Array.from({ length: 41 }, (_, i) => 'a' + (i + 4))]
    const hs = []
    for (const n of [0, 8, 40]) { api.set(K.slice(0, n)); await H.frames(); await new Promise((r) => setTimeout(r, 40)); hs.push([H.r(R.querySelector('.g-input__control')).h, H.r(document.querySelector('[data-after="a-row"]')).t, H.r(R.querySelector('.g-combobox__sentence') || R).h]) }
    api.set(['penicilina', 'latex'])
    const rows = [...__cbm.get('b-states').root().querySelectorAll('.g-combobox__row')].map((r) => H.r(r).h)
    return { hs, rows }
  })
  ok(g.hs.every(([h, t]) => Math.abs(h - g.hs[0][0]) < 0.5 && Math.abs(t - g.hs[0][1]) < 0.5), `${label} · A Δ0 de 0 a 8 y 40 (${g.hs.map((x) => x[0]).join(' / ')})`)
  ok(g.rows.every((h) => Math.abs(h - g.rows[0]) < 0.6), `${label} · renglones y rastro del mismo alto (${g.rows.map((h) => h.toFixed(1)).join(' ')})`)
  const all = { ...a, ...p, ...b, ...c }
  const min3 = ['boxBorder', 'boxSel', 'mark', 'bar', 'invSelBox', 'invUnBox', 'remove', 'customIcon']
  for (const [k, v] of Object.entries(all)) {
    const need = min3.includes(k) ? 3 : 4.5
    ok(v >= need, `${label} · contraste ${k} ${v.toFixed(2)} ≥ ${need}`)
    note('contraste ' + k, v)
  }
}

// ---------- Batería completa en un motor ----------
async function full(browser, engine) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  ctxName = engine
  await load(page)

  // ---- A · Δ0 en la fila de 0 a 8 y 40 ----
  const geo = await m(page, async () => {
    const H = window.__h, out = []
    const R = __cbm.get('a-row').root(), notas = document.querySelector('.xn-a-row .g-input__control'), after = document.querySelector('[data-after="a-row"]')
    for (const n of [0, 1, 2, 3, 5, 8, 40]) {
      __cbm.get('a-row').set(ALLERGY_KEYS().slice(0, n)); await H.frames(); await new Promise((r) => setTimeout(r, 60))
      const c = R.querySelector('.g-input__control'), cell = R.querySelector('.g-combobox__value'), s = R.querySelector('.g-combobox__sentence')
      const it = s ? [...s.children].map((x) => x.getBoundingClientRect().top) : []
      out.push({ n, root: H.r(R).h, ctrl: H.r(c), notas: H.r(notas), after: H.r(after).t, cell: H.r(cell), s: s && { ...H.r(s), sh: s.scrollHeight, ch: s.clientHeight, sw: s.scrollWidth, cw: s.clientWidth, lh: parseFloat(getComputedStyle(s).lineHeight), tops: it, rest: !!s.querySelector('.g-combobox__sentence-rest') } })
    }
    return out
    function ALLERGY_KEYS() { return ['penicilina', 'latex', 'ibuprofeno', 'sulfonamidas', ...Array.from({ length: 41 }, (_, i) => 'a' + (i + 4))] }
  })
  const g0 = geo[0]
  for (const g of geo) {
    ok(Math.abs(g.ctrl.h - g0.ctrl.h) < 0.5 && Math.abs(g.root - g0.root) < 0.5, `A · Δ0 caja y raíz con ${g.n} (Δ ${(g.ctrl.h - g0.ctrl.h).toFixed(2)} / ${(g.root - g0.root).toFixed(2)})`)
    ok(Math.abs(g.notas.t - g0.notas.t) < 0.5 && Math.abs(g.notas.h - g0.notas.h) < 0.5, `A · la vecina no se mueve con ${g.n}`)
    ok(Math.abs(g.after - g0.after) < 0.5, `A · lo de debajo no se mueve con ${g.n} (Δ ${(g.after - g0.after).toFixed(2)})`)
    note('A Δ caja (px)', g.ctrl.h - g0.ctrl.h); note('A Δ debajo (px)', g.after - g0.after)
    if (g.n) {
      ok(g.s && g.s.sh <= g.s.ch + 0.5 && Math.abs(g.s.h - g.s.lh) < 0.5, `A · frase en una línea con ${g.n} (alto ${g.s?.h} = línea ${g.s?.lh})`)
      ok(g.s && g.s.tops.every((t) => Math.abs(t - g.s.tops[0]) < 0.5), `A · todos los trozos en la misma línea con ${g.n}`)
      ok(g.s && g.s.r <= g.cell.r + 0.5 && g.s.l >= g.cell.l - 0.5, `A · la frase dentro de la celda con ${g.n}`)
      ok(g.s && g.s.sw <= g.s.cw + 0.5, `A · la frase no desborda tras ceder con ${g.n}`)
    }
    if (g.n >= 5) ok(g.s && g.s.rest, `A · cede con «y N más» con ${g.n}`)
  }
  // Con el foco: ≤ 55 % de la celda y text-muted
  const foc = await m(page, async () => {
    const H = window.__h
    __cbm.get('a-row').set(['penicilina', 'latex', 'ibuprofeno']); await H.frames()
    const R = __cbm.get('a-row').root(), s = () => R.querySelector('.g-combobox__sentence'), cell = R.querySelector('.g-combobox__value')
    const before = { w: H.r(s()).w, color: getComputedStyle(s()).color }
    R.querySelector('input[role=combobox]').focus(); await H.frames(); await new Promise((r) => setTimeout(r, 120))
    const after = { w: H.r(s()).w, cell: H.r(cell).w, color: getComputedStyle(s()).color, muted: H.rgba(H.tok('--g-color-text-muted')).join(), got: H.rgba(getComputedStyle(s()).color).join(), field: H.r(R.querySelector('.g-combobox__field')).w }
    __cbm.get('a-row').hide(); R.querySelector('input[role=combobox]').blur(); await H.frames()
    return { before, after }
  })
  ok(foc.after.w <= foc.after.cell * 0.55 + 0.5, `A · con el foco la frase ≤ 55 % (${foc.after.w.toFixed(1)} de ${foc.after.cell.toFixed(1)})`)
  ok(foc.after.got === foc.after.muted, 'A · con el foco la frase en text-muted')
  ok(foc.after.field >= foc.after.cell * 0.45 - 0.5, `A · el texto que se escribe tiene ≥ 45 % (${foc.after.field.toFixed(1)})`)
  note('A frase con foco / celda', foc.after.w / foc.after.cell)
  // Elipsis del primero (estrecho) y cuarenta
  const ce = await m(page, () => {
    const n = (c) => __cbm.get(c).root().querySelector('.g-combobox__sentence')
    const first = n('a-narrow').querySelector('.g-combobox__sentence-item')
    const many = n('a-many')
    return { firstEll: getComputedStyle(first).textOverflow, firstCut: first.scrollWidth > first.clientWidth, narrowRest: !!n('a-narrow').querySelector('.g-combobox__sentence-rest'), items: n('a-narrow').querySelectorAll('.g-combobox__sentence-item').length,
      many: many.textContent, manyNum: many.querySelector('.g-combobox__sentence-rest .g-combobox__num')?.textContent }
  })
  ok(ce.firstEll === 'ellipsis' && ce.firstCut && ce.narrowRest && ce.items === 1, `A · estrecho: solo el primero, recortado con elipsis, y «y N más» (${JSON.stringify(ce)})`)
  ok(/más$/.test(ce.many.trim()) && Number(ce.manyNum) >= 30, `A · cuarenta: «${ce.many.trim()}»`)
  // Marca de Retroceso, texto libre
  const arm = await m(page, async () => {
    __cbm.get('a-armed').arm(); await window.__h.frames()
    const it = __cbm.get('a-armed').root().querySelector('.g-combobox__sentence-item.is-armed'), cs = getComputedStyle(it)
    const fr = __cbm.get('a-free').root().querySelector('.g-combobox__sentence-item.is-custom')
    return { line: cs.textDecorationLine, bg: window.__h.rgba(cs.backgroundColor).join(), sel: window.__h.rgba(window.__h.tok('--g-color-selection')).join(), italic: getComputedStyle(fr).fontStyle, icon: !!fr.querySelector('svg.g-icon') }
  })
  ok(arm.line.includes('line-through') && arm.bg === arm.sel, `A · Retroceso marcado: tachado + selección (${arm.line})`)
  ok(arm.italic === 'italic' && arm.icon, 'A · texto libre en cursiva con lápiz')
  // Tamaños: el mismo alto que GInput
  const sz = await m(page, () => ['xs', 'sm', 'md', 'lg', 'xl'].map((s) => ({ s, cb: __cbm.get('a-' + s).root().querySelector('.g-input__control').getBoundingClientRect().height, gi: document.querySelector('.xn-in-' + s + ' .g-input__control').getBoundingClientRect().height })))
  for (const x of sz) ok(Math.abs(x.cb - x.gi) < 0.5, `A · ${x.s}: alto ${x.cb} = GInput ${x.gi}`)

  // ---- Panel ----
  const pn = await m(page, async () => {
    const H = window.__h
    __cbm.get('a-open').set(['penicilina', 'latex', 'ibuprofeno'])
    __cbm.get('a-open').show(); await H.frames(); await new Promise((r) => setTimeout(r, 400))
    const R = __cbm.get('a-open').root()
    const list = R.querySelector('.g-combobox__list')
    const firstGroup = list.querySelector(':scope > li > .g-combobox__group')
    const opt = R.querySelector('.g-combobox__option[aria-selected="true"]'), box = opt.querySelector('.g-combobox__box'), title = opt.querySelector('.g-summary__title')
    const bx = H.r(box), tl = H.r(title)
    const sp = H.px('--g-space-1')
    const icon = box.querySelector('.g-icon')
    const out = { chosenFirst: firstGroup.classList.contains('is-chosen'), labelColor: H.rgba(getComputedStyle(firstGroup.querySelector('.g-combobox__group-label')).color).join(), text: H.rgba(H.tok('--g-color-text')).join(),
      box: bx.w, boxH: bx.h, sp, dy: (bx.t + bx.h / 2) - (tl.t + parseFloat(getComputedStyle(title).lineHeight) / 2), markOp: getComputedStyle(icon).opacity, markW: H.r(icon).w,
      unOp: getComputedStyle(R.querySelector('.g-combobox__option[aria-selected="false"] .g-combobox__box .g-icon')).opacity, ariaMulti: list.getAttribute('aria-multiselectable'),
      check: R.querySelectorAll('.g-combobox__check').length }
    // armado en «Elegidas»
    __cbm.get('a-open').arm(); await H.frames()
    const armedOpt = R.querySelector('.g-combobox__option.is-armed'); out.armedOpt = !!armedOpt && getComputedStyle(armedOpt.querySelector('.g-summary__title')).textDecorationLine
    __cbm.get('a-open').hide(); await H.frames()
    // tope
    __cbm.get('a-max').show(); await H.frames(); await new Promise((r) => setTimeout(r, 350))
    const M = __cbm.get('a-max').root()
    const st = M.querySelector('.g-combobox__status--max'), disBox = M.querySelector('.g-combobox__option[aria-disabled="true"] .g-combobox__box')
    out.max = { status: !!st, icon: !!st?.querySelector('svg'), full: M.classList.contains('is-full'), disBorder: H.rgba(getComputedStyle(disBox).borderTopColor).join(), border: H.rgba(H.tok('--g-color-border')).join(), outside: !st.closest('[role=listbox]') }
    __cbm.get('a-max').hide(); await H.frames()
    __cbm.get('a-chosen13').show(); await H.frames(); await new Promise((r) => setTimeout(r, 350))
    const C = __cbm.get('a-chosen13').root()
    out.all = !!C.querySelector('.g-combobox__group.is-chosen > .g-combobox__action--all'); out.chosenRows = C.querySelectorAll('.g-combobox__group.is-chosen > .g-combobox__option:not(.g-combobox__action)').length
    __cbm.get('a-chosen13').hide(); await H.frames()
    return out
  })
  ok(pn.chosenFirst && pn.labelColor === pn.text, '«Elegidas» es el primer grupo, rótulo en text')
  ok(Math.abs(pn.box - pn.sp * 5) < 0.5 && Math.abs(pn.boxH - pn.sp * 5) < 0.5, `casilla space × 5 (${pn.box})`)
  ok(Math.abs(pn.dy) <= 1, `casilla centrada en la línea del título (Δ ${pn.dy.toFixed(2)})`)
  ok(pn.markOp === '1' && pn.unOp === '0' && Math.abs(pn.markW - pn.box * 0.72) < 0.6, `marca visible solo en la elegida (${pn.markW.toFixed(1)}px)`)
  ok(pn.ariaMulti === 'true' && pn.check === 0, 'aria-multiselectable y sin la marca de la Fase 1')
  ok(pn.armedOpt && pn.armedOpt.includes('line-through'), 'fila de «Elegidas» marcada por Retroceso, tachada')
  ok(pn.max.status && pn.max.icon && pn.max.full && pn.max.outside && pn.max.disBorder === pn.max.border, 'tope: estado con icono fuera del listbox, is-full, casillas apagadas')
  ok(pn.all && pn.chosenRows === 12, `«Ver las 13» dentro del grupo tras 12 filas (${pn.chosenRows})`)

  // ---- B · la receta ----
  const bb = await m(page, async () => {
    const H = window.__h, api = __cbm.get('b-row'), R = api.root(), out = {}
    const med = document.querySelector('.xn-b-row .g-input__control'), after = document.querySelector('[data-after="b-row"]')
    const snap = () => ({ ctrl: H.r(R.querySelector('.g-input__control')), med: H.r(med), after: H.r(after).t, label: H.r(R.querySelector('.g-input__label')).t })
    api.set(['E11.9', 'I10']); await H.frames(); await new Promise((r) => setTimeout(r, 80))
    const s0 = snap()
    const chosen = R.querySelector('.g-combobox__chosen')
    out.inSupport = chosen?.parentElement?.classList.contains('g-input__support') && chosen === chosen.parentElement.lastElementChild
    const sup = R.querySelector('.g-input__support')
    out.supportRow = getComputedStyle(sup).gridRowStart
    out.chosenR = H.r(chosen); out.rootR = H.r(R); out.medL = s0.med.l
    const row1 = R.querySelector('.g-combobox__row'); out.rowH = H.r(row1).h
    out.rowh = H.px('--g-text-body-line') + H.px('--g-text-body-sm-line') + 2 * H.px('--g-space-1')
    // Agregar uno: crece, lo de debajo baja un renglón
    api.add('v:J45.9'); await H.frames()
    const entering = R.querySelector('.g-combobox__row.is-entering')
    out.enterAnim = entering ? entering.getAnimations().map((a) => a.animationName) : []
    const hs = []
    for (let i = 0; i < 30 && R.querySelector('.g-combobox__row.is-entering'); i++) { hs.push(H.r(R.querySelector('.g-combobox__row.is-entering')).h); await new Promise((r) => requestAnimationFrame(r)) }
    await new Promise((r) => setTimeout(r, 120))
    out.hs = hs; out.enterCleared = !R.querySelector('.is-entering')
    const s1 = snap()
    out.ctrlD = s1.ctrl.h - s0.ctrl.h; out.ctrlT = s1.ctrl.t - s0.ctrl.t; out.medD = s1.med.t - s0.med.t; out.afterD = s1.after - s0.after; out.labelD = s1.label - s0.label
    const newRow = [...R.querySelectorAll('.g-combobox__row')].pop(); out.newRowH = H.r(newRow).h
    out.fresh = newRow.classList.contains('is-fresh') && !!newRow.querySelector('.g-combobox__row-fresh')
    const bar = getComputedStyle(newRow, '::before'); out.barW = parseFloat(bar.width); out.focusW = parseFloat(H.tok('--g-focus-width'))
    out.barStart = bar.insetInlineStart || bar.left
    // Quitar → rastro del mismo alto, en el mismo sitio
    const target = R.querySelectorAll('.g-combobox__row')[1], before = H.r(target)
    api.removeKey('v:I10'); await H.frames(); await new Promise((r) => setTimeout(r, 80))
    const tr = R.querySelector('.g-combobox__row.is-trace'); const after2 = H.r(tr)
    out.traceDH = after2.h - before.h; out.traceDT = after2.t - before.t; out.afterTrace = snap().after - s1.after
    out.traceLine = getComputedStyle(tr.querySelector('.g-combobox__trace')).textDecorationLine
    const ub = H.r(tr.querySelector('.g-combobox__undo')); out.undo = [ub.w, ub.h]
    const rb = H.r(R.querySelector('.g-combobox__remove')); out.remove = [rb.w, rb.h]
    // Pasada nueva: el rastro se pliega
    api.newPass(); await H.frames()
    const lv = R.querySelector('.g-combobox__row.is-leaving'); out.leaveAnim = lv ? lv.getAnimations().map((a) => a.animationName) : []
    const lh = []
    for (let i = 0; i < 30 && R.querySelector('.g-combobox__row.is-leaving'); i++) { lh.push(H.r(R.querySelector('.g-combobox__row.is-leaving')).h); await new Promise((r) => requestAnimationFrame(r)) }
    await new Promise((r) => setTimeout(r, 120))
    out.lh = lh; out.traceGone = !R.querySelector('.g-combobox__row.is-trace'); out.freshGone = !R.querySelector('.is-fresh')
    api.set(['E11.9', 'I10']); await H.frames()
    // Estados: rastro y renglones vivos del mismo alto (también el libre), número que se lee
    const S = __cbm.get('b-states').root()
    out.heights = [...S.querySelectorAll('.g-combobox__row')].map((r) => H.r(r).h)
    out.customItalic = getComputedStyle(S.querySelector('.g-combobox__row.is-custom .g-summary__title')).fontStyle
    // Ver los 8: el chevron gira
    const B8 = __cbm.get('b-many').root(), all = B8.querySelector('.g-combobox__rows-all')
    out.rows8 = B8.querySelectorAll('.g-combobox__row').length; const ab = H.r(all); out.allBtn = [ab.w, ab.h]
    all.click(); await H.frames(); await new Promise((r) => setTimeout(r, 300))
    out.rot = getComputedStyle(B8.querySelector('.g-combobox__rows-all .g-icon')).rotate; out.rows8b = B8.querySelectorAll('.g-combobox__row').length
    B8.querySelector('.g-combobox__rows-all').click(); await H.frames()
    return out
  })
  ok(bb.inSupport, 'B · la receta es el último hijo de g-input__support (N5)')
  ok(bb.chosenR.r <= bb.rootR.r + 0.5 && bb.chosenR.r <= bb.medL, 'B · la receta en su columna, sin solaparse con la vecina')
  ok(Math.abs(bb.rowH - bb.rowh) < 0.6, `B · renglón = dos líneas + space × 2 (${bb.rowH} ≈ ${bb.rowh})`)
  ok(bb.enterAnim.some((n) => n.startsWith('g-combobox-row-in')), `B · el nuevo crece (${bb.enterAnim})`)
  ok(bb.hs.some((h) => h > 1 && h < bb.rowh - 1), `B · alturas intermedias al crecer (${bb.hs.map((h) => h.toFixed(0)).join(' ')})`)
  ok(bb.enterCleared, 'B · is-entering retirada al terminar')
  ok(Math.abs(bb.ctrlD) < 0.5 && Math.abs(bb.ctrlT) < 0.5 && Math.abs(bb.medD) < 0.5 && Math.abs(bb.labelD) < 0.5, 'B · caja, etiqueta y vecina Δ0 al agregar')
  ok(Math.abs(bb.afterD - bb.newRowH) < 1.5, `B · lo de debajo baja un renglón (${bb.afterD.toFixed(1)} ≈ ${bb.newRowH.toFixed(1)})`)
  note('B renglón (px)', bb.rowH); note('B lo de debajo baja (px)', bb.afterD)
  ok(bb.fresh && Math.abs(bb.barW - bb.focusW) < 0.1, `B · «Nueva» con etiqueta y barra de focus-width (${bb.barW})`)
  ok(Math.abs(bb.traceDH) < 0.5 && Math.abs(bb.traceDT) < 0.5 && Math.abs(bb.afterTrace) < 0.5, `B · rastro del mismo alto y en el mismo sitio (Δ alto ${bb.traceDH.toFixed(2)}, Δ arriba ${bb.traceDT.toFixed(2)}, debajo ${bb.afterTrace.toFixed(2)})`)
  note('B Δ rastro (px)', bb.traceDH)
  ok(bb.traceLine.includes('line-through'), 'B · rastro tachado')
  ok(bb.undo[0] >= 24 && bb.undo[1] >= 24 && bb.remove[0] >= 24 && bb.remove[1] >= 24 && bb.allBtn[1] >= 24, `B · áreas ≥ 24px (Quitar ${bb.remove}, Deshacer ${bb.undo.map((x) => x.toFixed(0))}, Ver ${bb.allBtn.map((x) => x.toFixed(0))})`)
  ok(bb.leaveAnim.some((n) => n.startsWith('g-combobox-row-out')) && bb.lh.some((h) => h > 1 && h < bb.rowh - 1) && bb.traceGone && bb.freshGone, `B · pasada: el rastro se pliega (${bb.lh.map((h) => h.toFixed(0)).join(' ')}) y «Nueva» se retira`)
  ok(bb.heights.every((h) => Math.abs(h - bb.heights[0]) < 0.6), `B · renglones, libre y rastro del mismo alto (${bb.heights.map((h) => h.toFixed(1)).join(' ')})`)
  ok(bb.customItalic === 'italic', 'B · texto libre en cursiva')
  ok(bb.rows8 === 6 && bb.rows8b === 8 && /180deg|0\.5turn/.test(bb.rot), `B · tope 6, «Ver los 8» despliega y el chevron gira (${bb.rot})`)

  // ---- C · la cesta (1280) y movimiento ----
  const cc = await m(page, async () => {
    const H = window.__h, api = __cbm.get('c-pal'), out = {}
    api.set(['ana1', 'ana2', 'luis']); api.openSurface(); await new Promise((r) => setTimeout(r, 600))
    const S = document.getElementById('c-pal-surface')
    const body = S.querySelector('.g-combobox__surface-body'), panel = body.querySelector('.g-combobox__panel'), basket = body.querySelector('.g-combobox__basket'), foot = S.querySelector('.g-combobox__foot')
    const P = H.r(panel), B = H.r(basket), D = H.r(S), F = H.r(foot), BO = H.r(body)
    out.ratio = P.w / B.w; out.overlap = P.r > B.l + 0.5; out.inside = B.r <= D.r + 0.5 && F.b <= D.b + 0.5 && F.t >= BO.b - 0.5
    out.hasBasket = body.classList.contains('has-basket'); out.preview = !!S.querySelector('.g-combobox__preview')
    out.hOverflow = S.scrollWidth > S.clientWidth + 1
    const done = S.querySelector('.g-combobox__done'); const dr = H.r(done); out.done = [dr.w, dr.h]; out.doneBtn = done.classList.contains('g-btn')
    out.rowsInBasket = [...basket.querySelectorAll('.g-combobox__row')].every((r) => { const x = H.r(r); return x.l >= B.l - 0.5 && x.r <= B.r + 0.5 })
    out.diff = basket.querySelectorAll('.is-diff').length
    // Marcar una: la casilla salta, las cifras ruedan, el renglón viaja a la cesta
    const opts = [...S.querySelectorAll('.g-combobox__option')]
    const i = opts.findIndex((o) => o.getAttribute('aria-selected') === 'false')
    api.toggleIndex(i); await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r))
    out.tick = H.anims(/^g-combobox-tick/); out.roll = H.anims(/^g-combobox-roll/)
    const sc = []
    const mark = S.querySelector('.g-combobox__box.is-ticking .g-icon')
    const arr = S.querySelector('.g-combobox__row.is-arriving')
    out.arrive = H.anims(/^g-combobox-arrive/)
    const tx = []
    for (let k = 0; k < 40; k++) {
      if (mark && mark.isConnected) sc.push(parseFloat(getComputedStyle(mark).scale) || 1)
      if (arr && arr.isConnected && arr.classList.contains('is-arriving')) { const t = getComputedStyle(arr).translate; tx.push(t) }
      await new Promise((r) => requestAnimationFrame(r))
    }
    await new Promise((r) => setTimeout(r, 200))
    out.sc = sc; out.tx = tx
    out.cleared = !S.querySelector('.is-ticking, .is-rolling, .is-arriving')
    api.closeSurface(); await new Promise((r) => setTimeout(r, 400))
    return out
  })
  ok(cc.hasBasket && !cc.preview, 'C · cesta en el sitio de la vista previa (sin vista previa)')
  ok(Math.abs(cc.ratio - 1.2) < 0.03, `C · proporción resultados : cesta 6 : 5 (${cc.ratio.toFixed(3)})`)
  ok(!cc.overlap && cc.inside && !cc.hOverflow && cc.rowsInBasket, 'C · sin solapes ni desborde; pie dentro, bajo el cuerpo')
  ok(cc.doneBtn && cc.done[1] >= 24, `C · «Listo» es un GBtn ≥ 24px (${cc.done.map((x) => x.toFixed(0))})`)
  ok(cc.diff > 0, `C · homónimos marcados en la cesta (${cc.diff})`)
  note('C resultados/cesta', cc.ratio)
  const hasLinear = await m(page, () => CSS.supports('transition-timing-function', 'linear(0, 1)'))
  ok(cc.tick.length && (!hasLinear || cc.tick.some((a) => /linear/.test(a.easing))), `casilla: g-combobox-tick${hasLinear ? ' con --g-ease-bounce' : ''} (${JSON.stringify(cc.tick)})`)
  ok(cc.sc.length && Math.min(...cc.sc) >= 0.399 && (!hasLinear || Math.max(...cc.sc) > 1.0005), `casilla: escala desde 0.4${hasLinear ? ' con rebase' : ''} (min ${Math.min(...cc.sc).toFixed(3)}, máx ${Math.max(...cc.sc).toFixed(3)})`)
  note('casilla escala máx', Math.max(...cc.sc))
  ok(cc.roll.length >= 1, `cifras: g-combobox-roll (${cc.roll.length})`)
  ok(cc.arrive.length && (!hasLinear || cc.arrive.some((a) => /linear/.test(a.easing))), `C · viaje g-combobox-arrive${hasLinear ? ' con --g-ease-spring' : ''}`)
  ok(cc.tx.filter((t) => t && t !== 'none' && t !== '0px').length >= 2, `C · posiciones intermedias del viaje (${cc.tx.slice(0, 4).join(' | ')})`)
  ok(cc.cleared, 'clases de movimiento retiradas al terminar')

  // Cifras: recorte durante el giro (la cifra nunca se pinta fuera de su hueco)
  const rl = await m(page, async () => {
    const H = window.__h
    __cbm.get('a-open').set(['penicilina']); __cbm.get('a-open').show(); await new Promise((r) => setTimeout(r, 400))
    const R = __cbm.get('a-open').root()
    __cbm.get('a-open').toggleIndex(3); await new Promise((r) => requestAnimationFrame(r))
    const n = R.querySelector('.g-combobox__group-tally .g-combobox__num.is-rolling')
    const out = { exists: !!n, samples: [] }
    for (let k = 0; k < 12 && n && n.isConnected; k++) { const cs = getComputedStyle(n); out.samples.push([cs.translate, cs.clipPath]); await new Promise((r) => requestAnimationFrame(r)) }
    __cbm.get('a-open').hide(); await H.frames()
    return out
  })
  ok(rl.exists && rl.samples.some(([t, c]) => t !== 'none' && /inset/.test(c)), `cifras: entran desde abajo recortadas (${JSON.stringify(rl.samples[1] || rl.samples[0])})`)

  // ---- Contraste en el tema por defecto y el del CLI, claro y oscuro ----
  for (const [th, thl] of THEMES) for (const dark of [false, true]) {
    await load(page, `?${th ? 'theme=' + th + '&' : ''}${dark ? 'dark=1' : ''}`)
    await contrast(page, `${thl} ${dark ? 'oscuro' : 'claro'}`)
  }

  // ---- RTL ----
  await load(page, '?dir=rtl')
  const rtl = await m(page, async () => {
    const H = window.__h, out = {}
    const R = __cbm.get('a-dx').root(), s = H.r(R.querySelector('.g-combobox__sentence')), cell = H.r(R.querySelector('.g-combobox__value'))
    out.sentStart = Math.abs(s.r - cell.r)
    const S = __cbm.get('b-states').root(), fresh = S.querySelector('.g-combobox__row.is-fresh')
    const fr = H.r(fresh), cs = getComputedStyle(fresh, '::before')
    out.barRight = cs.right; out.barLeft = cs.left; out.rowW = fr.w
    const num = H.r(S.querySelector('.g-combobox__row-number')), rm = H.r(S.querySelector('.g-combobox__remove'))
    out.numRight = num.l > rm.l
    __cbm.get('a-open').show(); await new Promise((r) => setTimeout(r, 400))
    const o = __cbm.get('a-open').root().querySelector('.g-combobox__option'), bx = H.r(o.querySelector('.g-combobox__box')), su = H.r(o.querySelector('.g-summary'))
    out.boxRight = bx.l > su.l
    __cbm.get('a-open').hide(); await H.frames()
    __cbm.get('c-pal').openSurface(); await new Promise((r) => setTimeout(r, 600))
    const SS = document.getElementById('c-pal-surface')
    out.basketLeft = H.r(SS.querySelector('.g-combobox__basket')).r <= H.r(SS.querySelector('.g-combobox__surface-body > .g-combobox__panel')).l + 0.5
    __cbm.get('c-pal').closeSurface(); await new Promise((r) => setTimeout(r, 400))
    return out
  })
  ok(rtl.sentStart < 0.6, `RTL · la frase empieza en el borde de inicio (Δ ${rtl.sentStart.toFixed(2)})`)
  ok(rtl.barRight === '0px' && rtl.barLeft !== '0px', `RTL · barra de «Nueva» al inicio (right ${rtl.barRight}, left ${rtl.barLeft})`)
  ok(rtl.numRight && rtl.boxRight && rtl.basketLeft, 'RTL · número, casilla y cesta en espejo')

  // ---- Hoja a 375 y 320 ----
  for (const w of [375, 320]) {
    await page.setViewportSize({ width: w, height: 760 })
    await load(page)
    const sh = await m(page, async () => {
      const H = window.__h, api = __cbm.get('c-pal')
      api.set(['ana1', 'luis']); api.openSurface(); await new Promise((r) => setTimeout(r, 700))
      const S = document.getElementById('c-pal-surface')
      const opts = [...S.querySelectorAll('.g-combobox__option')]
      const out = { sheet: S.classList.contains('g-combobox-surface--sheet'), basket: !!S.querySelector('.g-combobox__basket'), chosen: !!S.querySelector('.g-combobox__group.is-chosen'),
        minRow: Math.min(...opts.map((o) => H.r(o).h)), overflow: S.scrollWidth > S.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth + 1,
        foot: !!S.querySelector('.g-combobox__foot .g-combobox__done'), footIn: H.r(S.querySelector('.g-combobox__foot')).b <= innerHeight + 0.5, rowsOut: opts.filter((o) => H.r(o).r > innerWidth + 0.5).length }
      api.closeSurface(); await new Promise((r) => setTimeout(r, 400))
      // A y B en la columna estrecha: sin desborde
      out.pageOverflow = document.documentElement.scrollWidth > innerWidth + 1
      return out
    })
    ok(sh.sheet && !sh.basket && sh.chosen, `${w} · hoja común con «Elegidas» y sin cesta`)
    ok(sh.minRow >= 43.5, `${w} · opciones ≥ 44px (${sh.minRow.toFixed(1)})`)
    ok(!sh.overflow && !sh.pageOverflow && sh.rowsOut === 0, `${w} · sin desbordamiento`)
    ok(sh.foot && sh.footIn, `${w} · pie con «Listo» a la vista`)
  }
  await page.setViewportSize({ width: 1280, height: 900 })

  ok(errors.length === 0, `consola limpia (${errors.slice(0, 3).join(' | ')})`)
  await ctx.close()

  // ---- Movimiento reducido ----
  {
    const c2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
    const p2 = await c2.newPage()
    await load(p2)
    const rd = await m(p2, async () => {
      const H = window.__h, out = {}
      __cbm.get('a-open').set(['penicilina']); __cbm.get('a-open').show(); await new Promise((r) => setTimeout(r, 300))
      __cbm.get('a-open').toggleIndex(3); await H.frames()
      out.a = H.anims(/^g-combobox-(tick|roll)/).length
      __cbm.get('a-open').hide()
      __cbm.get('b-row').set(['E11.9']); await H.frames(); __cbm.get('b-row').add('v:I10'); await H.frames()
      out.b = H.anims(/^g-combobox-row/).length
      __cbm.get('b-row').removeKey('v:I10'); await H.frames(); __cbm.get('b-row').newPass(); await H.frames()
      out.b2 = H.anims(/^g-combobox-row/).length
      __cbm.get('c-pal').openSurface(); await new Promise((r) => setTimeout(r, 500))
      const S = document.getElementById('c-pal-surface'), opts = [...S.querySelectorAll('.g-combobox__option')]
      __cbm.get('c-pal').toggleIndex(opts.findIndex((o) => o.getAttribute('aria-selected') === 'false')); await H.frames()
      out.c = H.anims(/^g-combobox-(arrive|tick|roll)/).length
      await new Promise((r) => setTimeout(r, 60))
      out.left = [...document.querySelectorAll('.is-ticking, .is-rolling, .is-entering, .is-arriving, .is-leaving')].map((e) => e.className).join(' / ')
      // los fundidos se quedan: la marca de la casilla
      out.fade = getComputedStyle(S.querySelector('.g-combobox__box .g-icon')).transitionProperty
      return out
    })
    ctxName = engine + ' · reduce'
    ok(rd.a === 0 && rd.b === 0 && rd.b2 === 0 && rd.c === 0, `nada se anima (${JSON.stringify(rd)})`)
    ok(rd.left === '', `no quedan clases de movimiento (${rd.left})`)
    ok(/opacity/.test(rd.fade), 'el fundido de la marca se queda')
    await c2.close()
  }

  // ---- forced-colors emulado (L42) ----
  {
    const c3 = await browser.newContext({ viewport: { width: 1280, height: 900 }, forcedColors: 'active' })
    const p3 = await c3.newPage()
    await load(p3)
    ctxName = engine + ' · forced-colors'
    const fc = await m(p3, async () => {
      if (!matchMedia('(forced-colors: active)').matches) return null
      const H = window.__h, out = {}
      const probe = (c) => { const d = document.createElement('div'); d.style.cssText = 'color:' + c + ';forced-color-adjust:none'; document.body.append(d); const v = H.rgba(getComputedStyle(d).color).join(); d.remove(); return v }
      const CT = probe('CanvasText'), HL = probe('Highlight'), HT = probe('HighlightText')
      __cbm.get('a-open').set(['penicilina', 'latex']); __cbm.get('a-open').show(); await new Promise((r) => setTimeout(r, 400))
      const R = __cbm.get('a-open').root()
      const un = R.querySelector('.g-combobox__option[aria-selected="false"]:not(.is-active) .g-combobox__box'), sel = R.querySelector('.g-combobox__option[aria-selected="true"]:not(.is-active) .g-combobox__box')
      out.boxBorder = H.rgba(getComputedStyle(un).borderTopColor).join() === CT
      out.boxSel = H.rgba(getComputedStyle(sel).backgroundColor).join() === HL
      out.mark = H.rgba(getComputedStyle(sel).color).join() === HT
      __cbm.get('a-open').hide(); await H.frames()
      __cbm.get('a-armed').arm(); await H.frames()
      const it = __cbm.get('a-armed').root().querySelector('.g-combobox__sentence-item.is-armed'), ics = getComputedStyle(it)
      out.armed = ics.textDecorationLine.includes('line-through') && H.rgba(ics.backgroundColor).join() === HL && H.rgba(ics.color).join() === HT
      const S = __cbm.get('b-states').root()
      const fresh = S.querySelector('.g-combobox__row-fresh'), fcs = getComputedStyle(fresh)
      out.fresh = fresh.textContent.trim() === 'Nueva' && H.rgba(fcs.borderTopColor).join() === CT && fcs.borderTopStyle === 'solid' && parseFloat(fcs.borderTopWidth) > 0
      out.bar = H.rgba(getComputedStyle(S.querySelector('.g-combobox__row.is-fresh'), '::before').backgroundColor).join() === CT
      const tr = S.querySelector('.g-combobox__trace'), tcs = getComputedStyle(tr)
      out.trace = tcs.textDecorationLine.includes('line-through') && H.rgba(tcs.color).join() === CT
      const ar = S.querySelector('.g-combobox__row.is-armed'), acs = getComputedStyle(ar.querySelector('.g-summary__title'))
      out.armedRow = acs.textDecorationLine.includes('line-through') && H.rgba(getComputedStyle(ar).backgroundColor).join() === HL && H.rgba(acs.color).join() === HT
      return out
    })
    if (fc === null) { note('forced-colors no emulable', engine) } else for (const [k, v] of Object.entries(fc)) ok(v, `forced-colors · ${k}`)
    await c3.close()
  }

  // ---- Puntero grueso (Chromium: hasTouch + isMobile) ----
  if (engine === 'chromium') {
    const c4 = await browser.newContext({ viewport: { width: 1280, height: 900 }, hasTouch: true, isMobile: true })
    const p4 = await c4.newPage()
    await load(p4)
    ctxName = engine + ' · táctil'
    const t = await m(p4, () => {
      const R = __cbm.get('b-states').root(), r = (s) => { const b = R.querySelector(s).getBoundingClientRect(); return [b.width, b.height] }
      return { coarse: matchMedia('(pointer: coarse)').matches, remove: r('.g-combobox__remove'), undo: r('.g-combobox__undo'), all: (() => { const b = __cbm.get('b-many').root().querySelector('.g-combobox__rows-all').getBoundingClientRect(); return [b.width, b.height] })() }
    })
    ok(t.coarse && [t.remove, t.undo, t.all].every(([w, h]) => w >= 44 && h >= 44), `puntero grueso: «Quitar», «Deshacer» y «Ver los N» ≥ 44px (${JSON.stringify(t)})`)
    await c4.close()
  }
}

// ---------- Contraste en los once temas generados (Chromium) ----------
async function generated(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  ctxName = 'chromium · generados'
  for (const g of GEN) for (const dark of [false, true]) {
    await load(page, `?theme=${g}${dark ? '&dark=1' : ''}`)
    await contrast(page, `${g} ${dark ? 'oscuro' : 'claro'}`)
  }
  await ctx.close()
}

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  try {
    const before = failed
    await full(browser, engine)
    if (engine === 'chromium') await generated(browser)
    console.log(`${engine}: ${failed - before === 0 ? 'ok' : (failed - before) + ' fallos'}`)
  } catch (e) { failed++; total++; fails.push(`[${engine}] excepción: ${e.message.split('\n')[0]}`) }
  await browser.close()
}
server.close()

console.log(`\n${total - failed}/${total} comprobaciones pasan`)
const fmt = (v) => (typeof v === 'number' ? v.toFixed(2) : String(v))
for (const [k, v] of Object.entries(measures)) {
  const nums = v.filter((x) => typeof x === 'number')
  console.log(`  ${k}: ${nums.length ? `mín ${fmt(Math.min(...nums))} · máx ${fmt(Math.max(...nums))} (${nums.length})` : v.join(', ')}`)
}
if (fails.length) { console.log('\nFallos:'); for (const f of fails.slice(0, args.verbose ? 999 : 60)) console.log('  ✗ ' + f) }
process.exit(failed ? 1 : 0)
