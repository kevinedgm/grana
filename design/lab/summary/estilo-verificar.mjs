// Verificación de coco sobre el banco de GSummary (design/lab/summary/estilo-banco.html), con el CSS real cargado en la
// capa grana.components y GAvatar, GBadge y GBtn reales de dist/. Mide:
// 0 · CSS estático: sin literales de color, sin respaldos, solo --g-* existentes y --_su-* / --_lines, sin @layer ni
//     !important; literales solo 7ch, 4ch, 1lh, 1px/-1px del texto oculto; keyframes g-summary-enter…, animación solo con
//     no-preference; sin muelle ni rebote; display:none solo en «+N»; nunca visibility:hidden; sin pesos numéricos.
// 1 · Barrido de anchos 120 a 640 (paso 20) en todos los casos (opción, campo en tres tamaños, vista previa, tarjetas
//     lines 4/3/0, celda, RTL árabe y hebreo, latino en RTL, tamaños): sin desborde; nada cortado a medias; identificador
//     entero (elipsis solo si él solo no cabe, apretado y con title); título ≥ 20px; «+N» = data-clipped; recortados = sufijo de la prioridad; data-terse antes de
//     soltar un dato con rótulo bare; data-tight ⇒ todos los datos fuera; en inline, título con elipsis ⇒ datos fuera; el
//     estado solo se ve con el título en su suelo (7ch); el lector lo recibe todo; row lines 2 de alto constante; inline
//     Δ0 frente al campo con texto; stack sin elipsis ni recorte; datos visibles en la primera opción a 240/360/520.
// 2 · Contraste sobre bg, surface y surface-sunken (selection, informativo): rótulo, compartido, secundaria, código,
//     marcador vacío, título, «+N»; claro, oscuro, Tema de prueba y los once temas generados (claro y oscuro).
// 3 · Pesos (lo único > lo compartido; identificador y título con peso de título; coincidencia con peso y subrayado).
// 4 · Carga Δ0 (row lines 2, inline, row lines 4 al máximo) y formas visibles. 5 · forced-colors emulado.
// 6 · Movimiento: nada al montar; al ensanchar 190 → 520 entran datos (≥ 2 opacidades intermedias, keyframes
//     g-summary-enter / -rtl, desplazamiento desde el inicio, se retira data-enter); con reduce, nada.
// 7 · Bidi (sin desplazamiento horizontal del anfitrión en RTL; orden visual RTL), móvil 320 sin desplazamiento; consola.
// Ejecutar desde la raíz del repo (requiere `npm run build`): GRANA_PW_PORT=4211 node design/lab/summary/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit   --verbose
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { serve, pw, ROOT } from './serve.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = [], measures = {}
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const note = (k, v) => { (measures[k] ??= []).push(v) }

/* ---------- 0 · Análisis estático del CSS ---------- */
{
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GSummary/GSummary.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(css), 'CSS: color literal')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer|@property|!important|@container/.test(css), 'CSS: @layer, @property, @container o !important')
  ok(!/@media[^{]*(?:width|height)/.test(css), 'CSS: @media por ancho (la ficha no tiene umbrales)')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_su-') || v === '--_lines'), 'CSS: var() fuera de --g-*, --_su-* y --_lines: ' + vars.filter((v) => !v.startsWith('--g-') && !v.startsWith('--_su-') && v !== '--_lines'))
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  ok(![...css.matchAll(/(--g-[\w-]+)\s*:/g)].length, 'CSS: declara propiedades --g-*')
  const own = [...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1])
  ok(own.every((v) => v.startsWith('--_su-')), 'CSS: alias propio sin prefijo --_su-: ' + own)
  const px = [...css.matchAll(/(-?\d*\.?\d+)px\b/g)].map((m) => m[0])
  ok(px.every((p) => ['1px', '-1px'].includes(p)), 'CSS: px no permitidos ' + px)
  const onePx = css.split('\n').filter((l) => /\b-?1px\b/.test(l)).map((l) => l.trim())
  ok(onePx.every((l) => /^(inline-size|block-size|margin): -?1px;$/.test(l)), 'CSS: 1px fuera del texto oculto: ' + onePx)
  const units = [...css.matchAll(/(\d*\.?\d+)(ch|lh|em|rem|vw|vh|%)\b/g)].map((m) => m[0])
  ok(units.every((u) => ['7ch', '4ch', '1lh', '100%', '60%', '85%', '70%', '50%'].includes(u)), 'CSS: unidades literales no previstas ' + units.filter((u) => !['7ch', '4ch', '1lh', '100%', '60%', '85%', '70%', '50%'].includes(u)))
  const nums = [...css.matchAll(/[*/]\s*(-?\d*\.?\d+)\b(?!px|ms|%|ch|lh)/g)].map((m) => m[1])
  ok(nums.every((n) => ['5', '6', '8', '10', '16', '-1', '1.5', '-3', '3', '2', '28'].includes(n)), 'CSS: factores no previstos ' + nums)
  const kf = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
  ok(kf.length === 2 && kf.every((k) => k.startsWith('g-summary-enter')), 'CSS: keyframes ' + kf)
  const anim = css.split('@media (prefers-reduced-motion: no-preference)')
  ok(anim.length === 2 && !/\banimation(?:-name)?\s*:/.test(anim[0]) && !/\banimation(?:-name)?\s*:/.test(anim[1].split(/\n}\n/)[1] || ''), 'CSS: animación fuera de prefers-reduced-motion: no-preference')
  ok(!/transition/.test(css), 'CSS: transiciones (la única pieza de movimiento es la entrada)')
  ok(!/--g-ease-spring|--g-ease-bounce/.test(css), 'CSS: muelle o rebote')
  ok(/var\(--g-duration-slow\) var\(--g-ease-out\)/.test(css), 'CSS: la entrada con --g-duration-slow + --g-ease-out')
  ok(!/visibility\s*:\s*hidden/.test(css), 'CSS: visibility:hidden')
  const none = [...css.matchAll(/([^{}]+)\{[^{}]*display:\s*none/g)].map((m) => m[1].trim())
  ok(none.length === 1 && none[0].split(',').every((s) => /g-summary__more/.test(s)), 'CSS: display:none fuera de «+N»: ' + none)
  ok(!/font-weight:\s*\d/.test(css), 'CSS: peso numérico literal')
  ok(/\.g-summary \{[^}]*contain: inline-size;[^}]*\}/.test(css) && /\.g-summary \{[^}]*inline-size: 100%;/.test(css), 'CSS: la raíz no lleva contain: inline-size e inline-size: 100%')
  ok(/@media \(forced-colors: active\)/.test(css), 'CSS: sin forced-colors')
}

/* ---------- Funciones de página ---------- */
function lib() {
  const parse = (s) => {
    let m = s.match(/rgba?\(([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
    m = s.match(/color\(srgb ([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
    return [0, 0, 0, 0]
  }
  const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
  const bgOf = (el) => {
    const layers = []
    for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break } }
    let base = parse(getComputedStyle(document.body).backgroundColor); if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const pair = (k, el, min) => el ? { k, r: ratio(over(parse(getComputedStyle(el).color), bgOf(el)), bgOf(el)), min } : null
  return { parse, over, bgOf, ratio, pair }
}
const L = `(${lib.toString()})()`

// Mide todas las fichas de los casos con datos (no carga, no vacías)
function probe(minId) {
  const out = []
  document.querySelectorAll('[data-case] .g-summary:not(.is-loading):not(.is-empty)').forEach((su, idx) => {
    const host = su.closest('[data-case]'), c = host.dataset.case
    if (c === 'surfaces' || c === 'loading') return
    const r = su.getBoundingClientRect(), it = { c, idx, w: r.width, h: r.height, bad: [] }
    const L = su.classList.contains('g-summary--layout-inline') ? 'inline' : su.classList.contains('g-summary--layout-stack') ? 'stack' : 'row'
    it.layout = L; it.multi = su.classList.contains('g-summary--multi')
    const pb = su.parentElement.getBoundingClientRect()
    if (r.right > pb.right + 0.5 || r.left < pb.left - 0.5) it.bad.push('la ficha sale de su anfitrión')
    const stage = host.closest('.stage') || host
    if (stage.scrollWidth > stage.clientWidth + 1 || host.scrollWidth > host.clientWidth + 1) it.bad.push('el anfitrión se desplaza en horizontal')
    const visIn = (e) => { // ¿se ve entero dentro de todos sus ancestros que recortan, hasta la ficha?
      const b = e.getBoundingClientRect(); if (!b.width || !b.height) return false
      for (let a = e.parentElement; a && a !== su.parentElement; a = a.parentElement) {
        const cs = getComputedStyle(a); if (cs.display === 'contents' || (cs.overflowX === 'visible' && cs.overflowY === 'visible')) continue
        const q = a.getBoundingClientRect(); if (b.left < q.left - 1 || b.right > q.right + 1 || b.top < q.top - 1 || b.bottom > q.bottom + 1) return false
      }
      return true
    }
    const hiddenSr = (e) => { for (let a = e; a && a !== su; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.position === 'absolute' && cs.clipPath && cs.clipPath !== 'none') return true } return false }
    const clipped = (e) => !!e.closest('[data-clipped]')
    su.querySelectorAll('.g-summary__lead, .g-summary__code, .g-summary__title, .g-summary__status, .g-summary__fact, .g-summary__more, .g-summary__subtitle, .g-summary__action').forEach((e) => {
      const cs = getComputedStyle(e); if (cs.display === 'none' || e.hidden || hiddenSr(e) || clipped(e)) return
      const b = e.getBoundingClientRect(); if (!b.width) return
      if (e.matches('.g-summary__status') && b.top >= e.parentElement.getBoundingClientRect().bottom - 1) return  // cedido: en la línea recortada
      if (b.right > r.right + 1 || b.left < r.left - 1) it.bad.push('cruza el borde: ' + e.className)
      if (e.matches('.g-summary__status')) return  // cede saltando a una línea recortada: o entero o fuera
      const ell = cs.textOverflow === 'ellipsis'
      if (!visIn(e) && !ell) it.bad.push((e.matches('.g-summary__fact') ? 'dato cortado a medias: ' : 'cortado sin elipsis: ') + e.className + ' «' + e.textContent.slice(0, 24) + '»')
      if (L === 'stack' && ell && e.scrollWidth > e.clientWidth + 1) it.bad.push('stack con elipsis: ' + e.className)
    })
    if (L === 'stack' && su.querySelector('[data-clipped]')) it.bad.push('stack recorta datos')
    // Identificador entero (≥ minId)
    const code = su.querySelector('.g-summary__code'), anc = su.querySelector('.g-summary__fact.is-anchor')
    const idEl = code || anc?.querySelector('.g-summary__fact-value')
    if (idEl && it.w >= minId) {
      const box = code || anc
      const whole = visIn(idEl) && box.scrollWidth <= box.clientWidth + 1 && (() => { const rg = document.createRange(); rg.selectNodeContents(idEl); const t = rg.getBoundingClientRect(), q = box.getBoundingClientRect(); return t.right <= q.right + 0.01 && t.left >= q.left - 0.01 })()
      if (!whole) {
        // Paso 6 del orden de cesión: el valor del identificador lleva elipsis SOLO si él solo no cabe (apretado) y con title
        const rg = document.createRange(); rg.selectNodeContents(idEl); const need = rg.getBoundingClientRect().width
        const room = (code ? code.parentElement : anc.parentElement).getBoundingClientRect().width
        if (!(su.hasAttribute('data-tight') && need > room - 0.5 && box.title)) it.bad.push(`identificador no entero «${idEl.textContent}» (necesita ${need.toFixed(1)}, hay ${room.toFixed(1)})`)
        else it.idEllipsis = true
      }
    }
    const t = su.querySelector('.g-summary__title')
    if (t && t.getBoundingClientRect().width < 20 && it.w >= minId) it.bad.push('título < 20px')
    // El lector lo recibe todo
    su.querySelectorAll('.g-summary__title, .g-summary__fact-label, .g-summary__fact-value, .g-summary__code, .g-summary__status, .g-summary__subtitle').forEach((e) => {
      for (let a = e; a && a !== su.parentElement; a = a.parentElement) {
        const cs = getComputedStyle(a)
        if (cs.display === 'none' || cs.visibility === 'hidden' || a.getAttribute('aria-hidden') === 'true') { it.bad.push('fuera del árbol accesible: ' + e.className); break }
      }
    })
    // «+N», orden de cesión
    const facts = [...su.querySelectorAll('.g-summary__fact:not(.is-anchor)')], cl = facts.map((f) => f.hasAttribute('data-clipped'))
    const n = cl.filter(Boolean).length, more = su.querySelector('.g-summary__more'), tight = su.hasAttribute('data-tight'), terse = su.hasAttribute('data-terse')
    if (more) {
      const shown = more.hidden || getComputedStyle(more).display === 'none' ? 0 : parseInt(more.textContent.replace('+', ''), 10)
      if (!tight && shown !== n) it.bad.push(`+N dice ${shown} y hay ${n} recortados`)
      if (tight && shown) it.bad.push('+N visible en data-tight')
    }
    const first = cl.indexOf(true); if (first >= 0 && cl.slice(first).some((x) => !x)) it.bad.push('los recortados no son el final de la prioridad')
    if (n && facts.some((f) => f.classList.contains('is-bare')) && !terse && L !== 'stack') it.bad.push('dato recortado sin callar antes los rótulos bare')
    if (tight && !it.multi && n !== facts.length) it.bad.push('data-tight con datos a la vista')
    if (L === 'inline' && t && t.scrollWidth > t.clientWidth + 1 && n !== facts.length && !su.querySelector('.g-summary__code')) it.bad.push('inline: el título cede antes que los datos')
    // Estado: solo a la vista si el título conserva su suelo (7ch)
    const st = su.querySelector('.g-summary__status'), head = su.querySelector('.g-summary__head'), name = su.querySelector('.g-summary__name')
    if (st && L === 'row') {
      const sb = st.getBoundingClientRect(), hb = head.getBoundingClientRect(), stVisible = sb.top < hb.bottom - 1
      const p = document.createElement('span'); p.style.cssText = 'position:absolute;inline-size:7ch'; head.append(p); const ch7 = p.getBoundingClientRect().width; p.remove()
      if (stVisible && name.getBoundingClientRect().width < Math.min(ch7, hb.width) - 1) it.bad.push(`estado a la vista con el nombre en ${name.getBoundingClientRect().width.toFixed(1)} < 7ch ${ch7.toFixed(1)}`)
      it.status = stVisible
    }
    it.visible = facts.length - n + (anc ? 1 : 0); it.total = facts.length + (anc ? 1 : 0); it.tight = tight; it.terse = terse
    out.push(it)
  })
  const field = {}; ['sm', 'md', 'lg'].forEach((s) => { field[s] = [document.querySelector(`[data-case="ref-${s}"]`).getBoundingClientRect().height, document.querySelector(`[data-case="field-${s}"]`).getBoundingClientRect().height, document.querySelector(`[data-case="field-dx-${s}"]`).getBoundingClientRect().height] })
  return { items: out, field, docScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }
}

/* ---------- Navegador ---------- */
const { server, base } = await serve()
const BASE = base + '/estilo-banco.html'
for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  const tag = (s) => `${engine} ${s}`
  const frames = (p = page, n = 3) => p.evaluate((n) => new Promise((r) => { const f = (k) => k ? requestAnimationFrame(() => f(k - 1)) : r(); f(n) }), n)
  const go = async (qs = '', p = page) => {
    await p.goto(BASE + qs); await p.waitForSelector('[data-ready]'); await p.evaluate(() => document.fonts.ready); await frames(p)
    if (/theme=|test=|dark=/.test(qs)) { await p.waitForTimeout(250); await p.evaluate(() => window.__su.measureAll()); await frames(p) }
  }
  const setW = async (w, p = page) => { await p.evaluate((w) => window.__su.setW(w), w); await frames(p, 4) }

  /* 1 · Barrido de anchos (con movimiento reducido: una entrada en curso desplaza el dato y no es un recorte) */
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await go('')
  const heights = new Map(), counts = {}
  let sweepBad = 0
  for (let w = 120; w <= 640; w += 20) {
    await setW(w)
    const m = await page.evaluate(`(${probe.toString()})(120)`)
    for (const it of m.items) {
      for (const b of it.bad) { ok(false, tag(`${w}px ${it.c}#${it.idx} (${it.layout}): ${b}`)); sweepBad++ }
      total++
      if (it.layout === 'row' && !it.multi) { const k = it.c + '#' + it.idx; (heights.get(k) || heights.set(k, []).get(k)).push(it.h) }
    }
    for (const s of ['sm', 'md', 'lg']) { const [ref, f, dx] = m.field[s]; ok(Math.abs(ref - f) < 0.5 && Math.abs(ref - dx) < 0.5, tag(`${w}px inline Δ0 campo ${s}: ${ref} / ${f} / ${dx}`)) }
    ok(!m.docScroll, tag(`${w}px: la página se desplaza en horizontal`))
    const opt = m.items.find((x) => x.c === 'opt'); if ([240, 360, 520].includes(w)) counts[w] = `${opt.visible}/${opt.total}`
    const ie = m.items.filter((x) => x.idEllipsis).map((x) => x.c + '#' + x.idx); if (ie.length) note('identificador con elipsis porque él solo no cabe (paso 6)', `${engine} ${w}px ${ie.join(' ')}`)
    if (w === 120) note('a 120px (identificador y título solo informativos)', `${engine} ` + m.items.filter((x) => x.layout !== 'stack').map((x) => `${x.c}:${x.visible}/${x.total}${x.tight ? 't' : ''}`).join(' '))
  }
  for (const [k, hs] of heights) ok(Math.max(...hs) - Math.min(...hs) < 0.5, tag(`row lines 2 de alto variable ${k}: ${Math.min(...hs)}–${Math.max(...hs)}`))
  note('datos visibles en la primera opción 240/360/520', `${engine} ${counts[240]} · ${counts[360]} · ${counts[520]}`)
  const rowH = await page.evaluate(() => [...document.querySelectorAll('[data-case="sizes"] .g-summary')].map((s) => s.getBoundingClientRect().height).join('/'))
  note('alto row lines 2 xs/sm/md/lg/xl', `${engine} ${rowH}`)
  ok(rowH.split('/')[2] === '44', tag('row md lines 2 ≠ 44px: ' + rowH))

  // Monotonía: al ensanchar no se ven menos datos
  {
    let prev = 0, mono = true
    for (let w = 160; w <= 640; w += 40) { await setW(w); const v = await page.evaluate(() => [...document.querySelectorAll('[data-case="opt"] .g-summary')][0].querySelectorAll('.g-summary__fact:not([data-clipped])').length); if (v < prev) mono = false; prev = v }
    ok(mono, tag('la opción muestra menos datos al ensanchar'))
  }

  await page.emulateMedia({ reducedMotion: 'no-preference' })

  /* 2 · Contraste */
  const contrast = () => page.evaluate(`(() => { const { pair, parse, over, bgOf, ratio } = ${L}; const out = []
    document.querySelectorAll('[data-case="surfaces"] [data-bg]').forEach((host) => { const b = host.dataset.bg, min = b === 'selection' ? 0 : 4.5
      const [row, stack, empty] = host.querySelectorAll('.g-summary')
      const more = row.querySelector('.g-summary__more:not([hidden])')
      out.push(pair(b + ': título', row.querySelector('.g-summary__title'), min), pair(b + ': rótulo', row.querySelector('.g-summary__fact-label'), min),
        pair(b + ': valor compartido', row.querySelector('.g-summary__fact.is-same:not(.is-anchor) .g-summary__fact-value') || stack.querySelector('.is-same .g-summary__fact-value'), min),
        pair(b + ': rótulo stack (caption)', stack.querySelector('.g-summary__fact-label'), min), pair(b + ': código', stack.querySelector('.g-summary__code'), min),
        pair(b + ': marcador vacío', empty.querySelector('.g-summary__title'), min))
      if (more) out.push({ k: b + ': «+N»', r: ratio(parse(getComputedStyle(more).color), over(parse(getComputedStyle(more).backgroundColor), bgOf(host))), min: 4.5 })
    })
    const opt = document.querySelector('[data-case="opt"] .g-summary'); out.push(pair('opción: rótulo', opt.querySelector('.g-summary__fact-label'), 4.5))
    return out.filter(Boolean) })()`)
  const worst = {}
  await setW(360)
  const THEMES = engine === 'chromium' ? [['defecto', ''], ['defecto', 'dark=1'], ['prueba', 'test=1'], ...GEN.flatMap((t) => [[t, `theme=${t}`], [t, `theme=${t}&dark=1`]])] : [['defecto', ''], ['defecto', 'dark=1'], ['prueba', 'test=1'], ['spotify', 'theme=spotify&dark=1']]
  for (const [name, qs] of THEMES) {
    await go('?w=360&' + qs)
    const m = await contrast(), t = `${name} ${qs.includes('dark') ? 'oscuro' : 'claro'}`
    ok(m.some((c) => c.k.endsWith('«+N»')), tag(`${t}: «+N» no visible en el caso de superficies`))
    for (const c of m) { ok(c.r >= c.min, tag(`${t}: ${c.k} ${c.r}:1 < ${c.min}`)); worst[c.k] = Math.min(worst[c.k] ?? 99, c.r) }
  }
  note('contraste mínimo ' + engine, Object.entries(worst).map(([k, v]) => `${k} ${v}`).join(' · '))

  /* 3 · Pesos */
  await go('?w=360')
  {
    const wt = await page.evaluate(() => { const fw = (s) => { const e = document.querySelector(s); return e ? Number(getComputedStyle(e).fontWeight) : 0 }
      const tok = (() => { const i = document.createElement('i'); i.style.fontWeight = 'var(--g-text-title-sm-weight)'; document.body.append(i); const v = Number(getComputedStyle(i).fontWeight); i.remove(); return v })()
      const mk = document.querySelector('[data-case="opt"] .g-summary__mark')
      return { diff: fw('[data-case="opt"] .is-diff:not(.is-anchor) .g-summary__fact-value'), same: fw('[data-case="opt"] .is-same:not(.is-anchor) .g-summary__fact-value'), anchor: fw('[data-case="opt"] .is-anchor .g-summary__fact-value'), title: fw('[data-case="opt"] .g-summary__title'), tok,
        mark: mk ? [Number(getComputedStyle(mk).fontWeight), getComputedStyle(mk).textDecorationLine, getComputedStyle(mk).backgroundColor] : null,
        anchorSame: (() => { const a = document.querySelector('[data-case="opt"] .is-anchor.is-same .g-summary__fact-value, [data-case="opt"] .is-anchor .g-summary__fact-value'); const t = document.querySelector('[data-case="opt"] .g-summary__title'); return getComputedStyle(a).color === getComputedStyle(t).color })() } })
    ok(wt.diff > wt.same && wt.diff === wt.tok, tag(`peso único ${wt.diff} vs compartido ${wt.same} (título ${wt.tok})`))
    ok(wt.anchor === wt.tok && wt.title === wt.tok, tag(`identificador ${wt.anchor} / título ${wt.title} ≠ ${wt.tok}`))
    ok(wt.anchorSame, tag('el identificador se apaga'))
    ok(wt.mark && wt.mark[0] === wt.tok && wt.mark[1].includes('underline') && /rgba\(0, 0, 0, 0\)|transparent/.test(wt.mark[2]), tag('coincidencia sin peso, subrayado o con fondo: ' + wt.mark))
  }

  /* 4 · Carga Δ0 y formas visibles */
  for (const w of [240, 360, 520]) {
    await setW(w)
    const c = await page.evaluate(`(() => { const { parse, over, bgOf, ratio } = ${L}; const H = (k) => [...document.querySelectorAll('[data-pair="' + k + '"]')].map((e) => (e.querySelector('.g-summary') || e).getBoundingClientRect().height)
      const r4 = document.querySelectorAll('[data-pair="row4"] .g-summary'); const head = r4[0].querySelector('.g-summary__head').getBoundingClientRect().height
      const lh = parseFloat(getComputedStyle(r4[0].querySelector('.g-summary__data')).lineHeight), gap = parseFloat(getComputedStyle(r4[0].querySelector('.g-summary__flow')).rowGap)
      const bones = [...document.querySelectorAll('.is-loading .g-summary__bone')].map((b) => ratio(over(parse(getComputedStyle(b).backgroundColor), bgOf(b.parentElement)), bgOf(b.parentElement)))
      const lis = [...document.querySelectorAll('li[data-pair="row2"]')].map((e) => e.getBoundingClientRect().height)
      return { row2: H('row2'), lis, inline: [...document.querySelectorAll('[data-pair="inline"]')].map((e) => e.getBoundingClientRect().height), row4: [r4[0].getBoundingClientRect().height, r4[1].getBoundingClientRect().height, head + 3 * lh + 2 * gap], bones: Math.min(...bones), busy: document.querySelectorAll('[aria-busy="true"].is-loading').length } })()`)
    ok(Math.abs(c.row2[0] - c.row2[1]) < 0.5 && Math.abs(c.lis[0] - c.lis[1]) < 0.5, tag(`${w}px carga row lines 2 Δ ${c.row2} ${c.lis}`))
    ok(Math.abs(c.inline[0] - c.inline[1]) < 0.5, tag(`${w}px carga inline Δ ${c.inline}`))
    ok(Math.abs(c.row4[1] - c.row4[2]) < 0.5 && c.row4[0] <= c.row4[2] + 0.5, tag(`${w}px carga row lines 4: cargada ${c.row4[0]}, carga ${c.row4[1]}, máximo ${c.row4[2]}`))
    ok(c.bones >= 1.15, tag(`${w}px formas de carga apenas visibles ${c.bones}:1`))
    if (w === 360) note('carga: contraste mínimo forma/fondo', `${engine} ${c.bones}:1`)
  }

  /* 5 · forced-colors emulado */
  try {
    await page.emulateMedia({ forcedColors: 'active' })
    await go('?w=360')
    const f = await page.evaluate(() => { const sys = (c, p = 'color') => { const i = document.createElement('i'); i.style[p] = c; document.body.append(i); const v = getComputedStyle(i)[p]; i.remove(); return v }
      const fact = document.querySelector('[data-case="opt"] .g-summary__fact:not(.is-anchor)'), more = document.querySelector('[data-case="surfaces"] .g-summary__more:not([hidden])'), bone = document.querySelector('.is-loading .g-summary__bone')
      const fw = (s) => Number(getComputedStyle(document.querySelector(s)).fontWeight)
      return { active: matchMedia('(forced-colors: active)').matches, sep: getComputedStyle(fact, '::before').borderInlineStartColor, ct: sys('CanvasText'), more: more && getComputedStyle(more).borderTopColor, bone: getComputedStyle(bone).backgroundColor, gt: sys('GrayText', 'backgroundColor'),
        diff: fw('[data-case="opt"] .is-diff:not(.is-anchor) .g-summary__fact-value'), same: fw('[data-case="opt"] .is-same:not(.is-anchor) .g-summary__fact-value'), canvas: sys('Canvas', 'backgroundColor') } })
    if (!f.active) note('forced-colors', `${engine}: emulación no disponible`)
    else {
      ok(f.sep === f.ct, tag(`forced-colors: separador ${f.sep} ≠ CanvasText ${f.ct}`))
      ok(f.more === f.ct, tag(`forced-colors: borde de «+N» ${f.more} ≠ CanvasText`))
      ok(f.bone === f.gt && f.bone !== f.canvas, tag(`forced-colors: forma de carga ${f.bone} ≠ GrayText ${f.gt}`))
      ok(f.diff > f.same, tag('forced-colors: lo único no pesa más'))
      note('forced-colors', `${engine}: separador y «+N» CanvasText, formas GrayText, peso ${f.diff}/${f.same}`)
    }
    await page.emulateMedia({ forcedColors: 'none' })
  } catch (e) { note('forced-colors', `${engine}: no emulable (${e.message.split('\n')[0]})`) }

  /* 6 · Movimiento */
  // La entrada se observa con un MutationObserver (no depende del ritmo de rAF del motor sin ventana) y se muestrea
  // deteniendo la animación real del primer dato que entra al 25 % y al 50 % de su duración; luego sigue y termina sola.
  const enterRun = async (sel) => {
    await setW(190); await page.waitForTimeout(300)
    await page.evaluate((sel) => { const su = document.querySelector(sel); const log = window.__log = { names: new Set(), samples: [], seen: 0, dur: 0 }
      const mo = new MutationObserver((ms) => ms.forEach((m) => { const f = m.target; if (!f.hasAttribute('data-enter')) return; log.seen++
        const an = f.getAnimations().find((x) => x.animationName?.startsWith('g-summary-enter')); if (!an) return; log.names.add(an.animationName)
        if (log.samples.length) return
        const d = an.effect.getComputedTiming().duration; log.dur = d; an.pause()
        for (const k of [0, 0.25, 0.5]) { an.currentTime = d * k; const cs = getComputedStyle(f); log.samples.push([+parseFloat(cs.opacity).toFixed(2), cs.translate]) }
        an.play() }))
      mo.observe(su, { subtree: true, attributes: true, attributeFilter: ['data-enter'] }); log.mo = mo }, sel)
    await setW(520); await page.waitForTimeout(1200)
    return page.evaluate((sel) => { const l = window.__log; l.mo.disconnect(); return { names: [...l.names], seen: l.seen, dur: l.dur, samples: l.samples, left: document.querySelectorAll(sel + ' [data-enter]').length } }, sel)
  }
  const enterOk = (r, sign) => r.seen > 0 && r.left === 0 && r.samples.length === 3 && r.samples[0][0] === 0 && r.samples[1][0] > 0 && r.samples[1][0] < 1 && r.samples[2][0] > r.samples[1][0] &&
    Math.sign(parseFloat(r.samples[0][1])) === sign && Math.abs(parseFloat(r.samples[2][1])) < Math.abs(parseFloat(r.samples[0][1]))
  await go('?w=360')
  ok(!(await page.evaluate(() => document.querySelectorAll('[data-enter]').length)), tag('data-enter al montar'))
  {
    const r = await enterRun('[data-case="opt"] .g-summary')
    ok(r.names.length === 1 && r.names[0] === 'g-summary-enter' && enterOk(r, -1), tag(`entrada LTR: ${JSON.stringify(r)}`))
    note('entrada: duración y muestras 0/25/50 % [opacidad, translate]', `${engine} LTR ${r.dur}ms ${JSON.stringify(r.samples)}`)
    const q = await enterRun('[data-case="rtl-opt"] .g-summary')
    ok(q.names.length === 1 && q.names[0] === 'g-summary-enter-rtl' && enterOk(q, 1), tag(`entrada RTL: ${JSON.stringify(q)}`))
    note('entrada: duración y muestras 0/25/50 % [opacidad, translate]', `${engine} RTL ${q.dur}ms ${JSON.stringify(q.samples)}`)
  }
  {
    const p2 = await ctx.newPage(); await p2.emulateMedia({ reducedMotion: 'reduce' })
    p2.on('pageerror', (e) => errors.push(e.message))
    await go('?w=360', p2)
    await setW(190, p2); await p2.waitForTimeout(200)
    await p2.evaluate(() => { window.__n = 0; const t = () => { window.__n += document.querySelectorAll('[data-enter]').length; if (!window.__stop) requestAnimationFrame(t) }; requestAnimationFrame(t) })
    await setW(520, p2); await p2.waitForTimeout(500)
    const n = await p2.evaluate(() => { window.__stop = true; const f = document.querySelector('[data-case="opt"] .g-summary__fact:not(.is-anchor)'); f.setAttribute('data-enter', ''); const a = getComputedStyle(f).animationName; f.removeAttribute('data-enter'); return { n: window.__n, a } })
    ok(n.n === 0 && n.a === 'none', tag(`reduce: data-enter ${n.n}, animación ${n.a}`))
    await p2.close()
  }

  /* 7 · Bidi y móvil */
  await go('?w=360')
  for (const w of [160, 240, 360]) {
    await setW(w)
    const b = await page.evaluate(() => { const lat = document.querySelector('[data-case="rtl-latin"] .is-anchor'); const l = lat.querySelector('.g-summary__fact-label').getBoundingClientRect(), v = lat.querySelector('.g-summary__fact-value').getBoundingClientRect()
      const ar = document.querySelector('[data-case="rtl-opt"] .is-anchor'); const al = ar.querySelector('.g-summary__fact-label').getBoundingClientRect(), av = ar.querySelector('.g-summary__fact-value').getBoundingClientRect()
      const scroll = [...document.querySelectorAll('[dir="rtl"]')].some((s) => s.scrollWidth > s.clientWidth + 1 || [...s.querySelectorAll('.lb, .fld, .pv')].some((x) => x.scrollWidth > x.clientWidth + 1))
      const txt = document.querySelector('[data-case="rtl-opt"] .g-summary__title').getBoundingClientRect()
      return { latinOrder: l.left > v.left || lat.closest('[data-tight]') != null, arOrder: al.left > av.left || ar.closest('[data-tight]') != null, scroll, dirs: [...document.querySelectorAll('[data-case="rtl-opt"] :is(.g-summary__title, .g-summary__fact-label, .g-summary__fact-value, .g-summary__subtitle)')].every((e) => e.getAttribute('dir') === 'auto'), titleRight: txt.right }
    })
    ok(b.latinOrder && b.arOrder, tag(`${w}px RTL: el rótulo no va antes (a la derecha) del valor`))
    ok(!b.scroll, tag(`${w}px RTL: el anfitrión se desplaza (texto oculto sin contener)`))
    ok(b.dirs, tag('dir="auto" ausente en el banco'))
  }
  {
    const p3 = await browser.newPage({ viewport: { width: 320, height: 640 } })
    await go('?w=320', p3)
    const s = await p3.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    ok(s <= 1, tag(`móvil 320: desplazamiento horizontal ${s}px`))
    await p3.close()
  }

  ok(!errors.length, tag('consola: ' + errors.slice(0, 3).join(' | ')))
  note('barrido 120–640', `${engine}: ${sweepBad} defectos`)
  await browser.close()
}
server.close()

console.log(`\nGSummary · estilo: ${total - failed}/${total} comprobaciones`)
for (const [k, v] of Object.entries(measures)) { console.log('· ' + k); v.forEach((x) => console.log('    ' + x)) }
if (fails.length) { console.log('\nFallos:'); [...new Set(fails)].slice(0, args.verbose ? 400 : 60).forEach((f) => console.log('  ✗ ' + f)) }
process.exit(failed ? 1 : 0)
