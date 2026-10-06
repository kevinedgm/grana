// Verificación de coco sobre el banco de GTooltip (design/lab/tooltip/estilo-banco.html): GTooltip.css real en la capa
// grana.components, CSS de src/ y GBtn, GIcon y GInputGroup reales de dist/ (JS). Mide:
//   0 · análisis estático (solo var(--g-*)/--_*, sin respaldos, sin literales de color ni de medida, sin @layer ni
//       !important, tokens existentes, display del nodo solo bajo :popover-open, sin muelle ni rebote, movimiento solo
//       con no-preference, @property con el nombre del componente) y que los cambios de #383 solo añaden :where(.g-tooltip)
//   1 · geometría (claro, tema de esta entrega; LTR y RTL): la pestaña toca el borde del control y mide lo que él (Δ <
//       0,5px), entra --g-border-width en la etiqueta, nunca sobresale; la etiqueta ≥ pestaña hasta min(space × 70,
//       visor − space × 4), centrada sobre un control más ancho; dentro del visor con su margen; hueco = space × 1,5;
//       puente del puntero; esquinas cuadradas donde la pestaña llega al borde; texto ≥ 12px y sin recorte
//   2 · contraste: nombre, detalle y atajo ≥ 4,5:1; borde del atajo ≥ 3:1; pestaña y etiqueta frente a la página ≥ 3:1
//       (claro y oscuro del tema por defecto, del tema de esta entrega y, en Chromium, de los once generados)
//   3 · movimiento: viaje (una sola etiqueta visible, sin entrada, monótono, sin rebase, la pestaña siempre dentro y
//       Δ0 al llegar, data-travel retirado), segunda etapa (el borde junto al control Δ0 mientras crece, hacia fuera en
//       los dos lados), entrada y salida con fundido, data-instant sin ninguno; con movimiento reducido el viaje salta y
//       la segunda etapa aparece sin crecer
//   4 · 320px (zoom al 400 % de 1280): la etiqueta cabe con su margen (también con space 5)
//   5 · forced-colors emulado (Chromium): borde de la etiqueta, lados de la pestaña en CanvasText, sin curvas de unión
//   6 · puntero grueso: el control no se selecciona salvo un campo; -webkit-touch-callout donde existe
//   7 · #383: Δ0 sin tooltip frente al CSS del commit 5dba395; con el nodo hermano, el mismo aspecto que sin él (y que
//       con el CSS anterior fallaba); el nodo cerrado no se ve ni ocupa y abierto no hereda márgenes ni anchos
//   8 · consola limpia
// Ejecutar desde la raíz (requiere dist/ por el JS): GRANA_PW_PORT=4209 node design/lab/tooltip/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit   --verbose
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { serve, ROOT, REF } from './estilo-serve.mjs'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const { server, base: BASE } = await serve(Number(process.env.GRANA_PW_PORT) || 4209)
const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = [], measures = {}
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const note = (k, v) => { (measures[k] ??= []).push(v) }

/* ---------- 0 · Análisis estático ---------- */
{
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GTooltip/GTooltip.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  const fc = css.slice(css.indexOf('@media (forced-colors: active)'))
  const main = css.slice(0, css.indexOf('@media (forced-colors: active)'))
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color-mix)\(/.test(css), 'CSS: color literal o color-mix')
  ok(!/\b(?:Canvas|CanvasText|Highlight|ButtonText|GrayText)\b/.test(main), 'CSS: color del sistema fuera de forced-colors')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer/.test(css) && !/!important/.test(css), 'CSS: @layer o !important')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  ok(![...css.matchAll(/(--g-[\w-]+)\s*:/g)].length, 'CSS: declara propiedades --g-*')
  const props = [...css.matchAll(/@property\s+(--[\w-]+)/g)].map((m) => m[1])
  ok(props.length === 4 && props.every((p) => /^--_tooltip-a[xywh]$/.test(p)), 'CSS: @property fuera de --_tooltip-ax/ay/aw/ah: ' + props)
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]).concat(props))
  const DATA = ['--_x', '--_y', '--_yb']
  const strange = [...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v) && !DATA.includes(v)))]
  ok(!strange.length, 'CSS: lee un alias --_* que no declara ni es dato del .vue: ' + strange)
  const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  ok(px.every((p) => p === '0px'), 'CSS: medidas literales distintas de 0px ' + px.filter((p) => p !== '0px'))
  ok(!/\d(?:ch|em|rem|vw|vh|dvw|dvh|lh)\b/.test(css), 'CSS: unidad literal (ch, em, rem, vw, vh, lh)')
  const nums = [...css.matchAll(/[*/]\s*(-?\d*\.?\d+)\b(?!px|ms|%|fr|turn)/g)].map((m) => m[1])
  const NUMS = ['1.5', '70', '4', '2', '2.5', '-1']
  ok(nums.every((n) => NUMS.includes(n)), 'CSS: factores no previstos: ' + [...new Set(nums.filter((n) => !NUMS.includes(n)))])
  ok(!/@keyframes|animation\s*:/.test(css), 'CSS: keyframes o animation (el contrato pide transiciones)')
  ok(!/--g-ease-spring|--g-ease-bounce/.test(css), 'CSS: usa el muelle o el rebote (#388: viaje sobrio)')
  // Recorrido por reglas: display del nodo, movimiento solo en no-preference
  let ctx = [], pending = ''
  const nodeDisplay = [], moveTr = []
  for (const t of css.split(/([{}])/)) {
    if (t === '{') { ctx.push(pending.trim()); pending = '' }
    else if (t === '}') { ctx.pop(); pending = '' }
    else {
      pending = t
      const decls = t.split(';').map((d) => d.trim()).filter((d) => /^[\w-]+\s*:/.test(d))
      const sel = ctx.at(-1) || ''
      for (const d of decls) {
        // El sujeto es el nodo: el último compuesto del selector empieza por .g-tooltip y no es una pieza ni un pseudo
        const subj = sel.split(',').map((s) => s.trim().split(/\s+|>/).at(-1))
        if (/^display\s*:/.test(d) && subj.some((s) => /^\.g-tooltip(?![_-])/.test(s) && !/::/.test(s))) nodeDisplay.push(sel)
        if (/^transition\s*:/.test(d) && /\b(translate|inline-size|--_tooltip|grid-template-rows)\b/.test(d)) moveTr.push(ctx.join(' » '))
      }
    }
  }
  ok(nodeDisplay.length === 1 && nodeDisplay[0] === '.g-tooltip:popover-open', 'CSS: display del nodo fuera de :popover-open: ' + nodeDisplay)
  ok(moveTr.length && moveTr.every((c) => /prefers-reduced-motion: no-preference/.test(c)), 'CSS: transición de movimiento fuera de no-preference: ' + moveTr)
  ok(/translate var\(--g-duration-press\) var\(--g-ease-out\)/.test(css) && /grid-template-rows var\(--g-duration-press\) var\(--g-ease-out\)/.test(css), 'CSS: viaje o segunda etapa sin press + ease-out')
  ok(/opacity var\(--g-duration-fast\)/.test(css), 'CSS: fundido sin --g-duration-fast')
  // #383: frente al commit de referencia, los otros archivos solo cambian para ignorar .g-tooltip. Se deshace la exclusión
  // (`:nth-last-child(1 of :not(:where(.g-tooltip)))` → `:last-child`, `:not(:where(.g-tooltip))` → `*`, y fuera los
  // selectores con el nodo intermedio) y lo que queda, sin comentarios, debe ser idéntico al original
  const files = ['GDialog/GDialog.css', 'GInputGroup/GInputGroup.css', 'GFormRow/GFormRow.css', 'GAdaptiveLayout/GAdaptiveLayout.css', 'GCard/GCard.css', 'GInput/GInput.css']
  const splitTop = (sel) => { const out = []; let depth = 0, cur = ''; for (const ch of sel) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { out.push(cur); cur = '' } else cur += ch } out.push(cur); return out }
  const norm = (src, undo) => {
    let c = src.replace(/\/\*[\s\S]*?\*\//g, '')
    if (undo) {
      c = c.replace(/:nth-last-child\(1 of :not\(:where\(\.g-tooltip\)\)\)/g, ':last-child').replace(/:not\(:where\(\.g-tooltip\)\)/g, '*')
      c = c.replace(/([^{}]+)\{/g, (m, pre) => splitTop(pre).filter((x) => !/\.g-tooltip/.test(x)).join(',') + '{')
    }
    return c.replace(/\s+/g, ' ').replace(/\s*([{},;>+])\s*/g, '$1').trim()
  }
  for (const f of files) {
    const path = `packages/vue/src/components/${f}`
    const old = execFileSync('git', ['show', `${REF}:${path}`], { cwd: ROOT }).toString()
    const now = await readFile(join(ROOT, path), 'utf8')
    ok(norm(now, false) !== norm(old, false), `#383 ${f}: sin cambios`)
    ok(norm(now, true) === norm(old, false), `#383 ${f}: cambia algo más que la exclusión de .g-tooltip`)
  }
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
    let b = parse(getComputedStyle(document.body).backgroundColor)
    if (b[3] < 1) b = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) b = over(layers[i], b)
    return b
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const rect = (el) => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height } }
  const node = (tid) => document.querySelector(`[data-tt="${tid}"]`)
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  return { parse, over, bgOf, ratio, rect, node, frame }
}
const L = `(${lib.toString()})()`

const CASES = ['t-undo', 't-copy', 't-trash', 'r-inbox', 'w120', 'w120b', 'block', 's-top', 's-bottom', 's-left', 's-right', 'edge-start', 'edge-end', 'field']
const geometry = (page, tid, dwell = false) => page.evaluate(`(async () => { const { rect, node, frame } = ${L}
  const tid = ${JSON.stringify(tid)}, inst = TT.get(tid), n = node(tid)
  inst.ctrl.scrollIntoView({ block: 'center', inline: 'nearest' })
  await frame()
  TT.open(tid, { instant: true })
  ${dwell ? 'TT.dwell(tid)' : ''}
  await new Promise((r) => setTimeout(r, ${dwell ? 400 : 0}))
  await frame()
  const body = n.querySelector('.g-tooltip__body'), tab = n.querySelector('.g-tooltip__tab'), text = n.querySelector('.g-tooltip__text'), kbd = n.querySelector('.g-tooltip__kbd')
  const C = rect(inst.ctrl), N = rect(n), B = rect(body), T = rect(tab), u = TT.unit(), bw = parseFloat(getComputedStyle(body).borderTopWidth)
  const side = n.dataset.side, rtl = getComputedStyle(n).direction === 'rtl'
  const phys = side === 'right' ? (rtl ? 'left' : 'right') : side === 'left' ? (rtl ? 'right' : 'left') : side
  // Puente: el punto medio del hueco, en la línea central de la pestaña
  const mid = phys === 'bottom' ? [T.l + T.w / 2, (C.b + B.t) / 2] : phys === 'top' ? [T.l + T.w / 2, (B.b + C.t) / 2] : phys === 'right' ? [(C.r + B.l) / 2, T.t + T.h / 2] : [(B.r + C.r - C.w) / 2, T.t + T.h / 2]
  const hit = document.elementFromPoint(mid[0], mid[1])
  const cs = getComputedStyle(body)
  const out = { tid, side, phys, rtl, C, N, B, T, u, bw, vw: innerWidth, vh: innerHeight, bridge: !!hit && n.contains(hit), open: n.matches(':popover-open'),
    fsText: parseFloat(getComputedStyle(text).fontSize), fsKbd: kbd ? parseFloat(getComputedStyle(kbd).fontSize) : null,
    clip: body.scrollWidth - body.clientWidth, textR: rect(text),
    r: parseFloat(getComputedStyle(n).getPropertyValue('--g-radius-md')) || parseFloat(cs.borderBottomLeftRadius),
    // Esquinas por impacto (el radio usado depende del ancho): a 0,5px del lado y un px dentro del borde, dentro si es recta
    corners: (() => { const inB = (x, y) => { const e = document.elementFromPoint(x, y); return !!e && body.contains(e) }
      const near = phys === 'bottom' ? [inB(B.l + 0.5, B.t + bw + 1), inB(B.r - 0.5, B.t + bw + 1)] : phys === 'top' ? [inB(B.l + 0.5, B.b - bw - 1), inB(B.r - 0.5, B.b - bw - 1)] : []
      const far = phys === 'bottom' ? [inB(B.l + 0.5, B.b - bw - 1), inB(B.r - 0.5, B.b - bw - 1)] : phys === 'top' ? [inB(B.l + 0.5, B.t + bw + 1), inB(B.r - 0.5, B.t + bw + 1)] : []
      return { near, far } })() }
  TT.close(tid, { instant: true })
  await frame()
  return out })()`)

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const errors = []
  const watch = (p) => {
    p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/favicon|404|development build/.test(m.text())) errors.push(m.text()) })
    p.on('pageerror', (e) => errors.push(e.message))
  }
  watch(page)
  const tag = (s) => `${engine} ${s}`
  const go = async (qs = '', p = page) => {
    await p.goto(BASE + qs)
    await p.waitForSelector('[data-ready]')
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  }

  /* 1 · Geometría */
  const geomCheck = (g, t) => {
    const d = (a, b) => Math.abs(a - b)
    const maxW = Math.min(70 * g.u, g.vw - 4 * g.u)
    const horiz = g.phys === 'top' || g.phys === 'bottom'
    ok(g.open, t('no se abre'))
    if (g.phys === 'bottom') { ok(d(g.T.t, g.C.b) < 0.5, t(`pestaña lejos del control Δ${(g.T.t - g.C.b).toFixed(2)}`)); ok(d(g.T.b, g.B.t + g.bw) < 0.5, t(`pestaña no entra el borde en la etiqueta Δ${(g.T.b - g.B.t - g.bw).toFixed(2)}`)); ok(d(g.B.t - g.C.b, 1.5 * g.u) < 0.5, t(`hueco ${(g.B.t - g.C.b).toFixed(2)} ≠ space × 1,5`)) }
    if (g.phys === 'top') { ok(d(g.T.b, g.C.t) < 0.5, t(`pestaña lejos del control Δ${(g.T.b - g.C.t).toFixed(2)}`)); ok(d(g.T.t, g.B.b - g.bw) < 0.5, t('pestaña no entra el borde en la etiqueta')); ok(d(g.C.t - g.B.b, 1.5 * g.u) < 0.5, t(`hueco ${(g.C.t - g.B.b).toFixed(2)} ≠ space × 1,5`)) }
    if (g.phys === 'right') { ok(d(g.T.l, g.C.r) < 0.5, t(`pestaña lejos del control Δ${(g.T.l - g.C.r).toFixed(2)}`)); ok(d(g.T.r, g.B.l + g.bw) < 0.5, t('pestaña no entra el borde en la etiqueta')); ok(d(g.B.l - g.C.r, 1.5 * g.u) < 0.5, t('hueco ≠ space × 1,5')) }
    if (g.phys === 'left') { ok(d(g.T.r, g.C.l) < 0.5, t(`pestaña lejos del control Δ${(g.T.r - g.C.l).toFixed(2)}`)); ok(d(g.T.l, g.B.r - g.bw) < 0.5, t('pestaña no entra el borde en la etiqueta')); ok(d(g.C.l - g.B.r, 1.5 * g.u) < 0.5, t('hueco ≠ space × 1,5')) }
    if (horiz) {
      if (g.C.w <= g.B.w + 0.5) { ok(d(g.T.w, g.C.w) < 0.5 && d(g.T.l, g.C.l) < 0.5, t(`pestaña ${g.T.w.toFixed(2)}@${g.T.l.toFixed(2)} ≠ control ${g.C.w.toFixed(2)}@${g.C.l.toFixed(2)}`)) }
      else { ok(d(g.T.w, g.B.w) < 0.5, t(`control más ancho: pestaña ${g.T.w} no se acota a la etiqueta ${g.B.w}`)); ok(d(g.B.l + g.B.w / 2, g.C.l + g.C.w / 2) < 0.5, t('control más ancho: la etiqueta no se centra sobre él')) }
      ok(g.T.l >= g.B.l - 0.01 && g.T.r <= g.B.r + 0.01, t('la pestaña sobresale de la etiqueta'))
      ok(g.B.w >= Math.min(g.C.w, maxW) - 0.5, t(`etiqueta ${g.B.w} < pestaña ${g.C.w}`))
    } else {
      ok(d(g.T.h, Math.min(g.C.h, g.B.h)) < 0.5 && (g.C.h > g.B.h || d(g.T.t, g.C.t) < 0.5), t(`pestaña ${g.T.h}@${g.T.t} ≠ control ${g.C.h}@${g.C.t}`))
      ok(g.T.t >= g.B.t - 0.01 && g.T.b <= g.B.b + 0.01, t('la pestaña sobresale de la etiqueta'))
      ok(g.B.h >= Math.min(g.C.h, g.vh - 4 * g.u) - 0.5, t(`etiqueta ${g.B.h} < control ${g.C.h}`))
    }
    ok(g.B.w <= maxW + 0.5, t(`etiqueta ${g.B.w} > máximo ${maxW}`))
    ok(g.B.l >= 2 * g.u - 0.5 && g.B.r <= g.vw - 2 * g.u + 0.5, t(`etiqueta fuera del margen del visor ${g.B.l.toFixed(1)}–${g.B.r.toFixed(1)} (visor ${g.vw})`))
    ok(g.bridge, t('el hueco entre control y etiqueta no es del tooltip (puente 1.4.13)'))
    ok(g.fsText >= 12 && (g.fsKbd === null || g.fsKbd >= 12), t(`texto < 12px (${g.fsText}, ${g.fsKbd})`))
    ok(g.clip <= 1 && g.textR.r <= g.B.r + 0.5 && g.textR.l >= g.B.l - 0.5, t(`texto recortado (${g.clip})`))
  }
  for (const qs of ['', '?dir=rtl', '?theme=estilo', '?theme=estilo&dir=rtl']) {
    await go(qs)
    const worst = { tab: 0, edge: 0 }
    for (const tid of CASES) {
      const g = await geometry(page, tid)
      geomCheck(g, (x) => tag(`${qs || 'defecto'} ${tid}: ${x}`))
      if (g.phys === 'bottom' || g.phys === 'top') { if (g.C.w <= g.B.w) worst.tab = Math.max(worst.tab, Math.abs(g.T.w - g.C.w)) } else worst.tab = Math.max(worst.tab, Math.abs(g.T.h - g.C.h))
      worst.edge = Math.max(worst.edge, g.phys === 'bottom' ? Math.abs(g.T.t - g.C.b) : g.phys === 'top' ? Math.abs(g.T.b - g.C.t) : g.phys === 'right' ? Math.abs(g.T.l - g.C.r) : Math.abs(g.T.r - g.C.l))
      // WebKit no recorta por border-radius al buscar el elemento bajo un punto: ahí no se puede medir así
      if (tid === 'w120' && engine !== 'webkit') ok(g.corners.near.every(Boolean) && (g.r < 4 || g.corners.far.every((x) => !x)), tag(`${qs} w120: esquinas (junto a la pestaña cuadradas, las otras redondas) ${JSON.stringify(g.corners)}`))
      if (tid === 'block') note('control block (px): etiqueta · control', `${engine} ${qs || 'defecto'} ${g.B.w.toFixed(1)} · ${g.C.w.toFixed(1)}`)
      if (tid === 'r-inbox') ok(g.phys === (g.rtl ? 'left' : 'right'), tag(`${qs} riel: lado físico ${g.phys} (esperado ${g.rtl ? 'izquierda' : 'derecha'})`))
      if (tid === 's-left') ok(g.phys === (g.rtl ? 'right' : 'left'), tag(`${qs} placement left: lado físico ${g.phys}`))
    }
    for (const tid of ['t-copy', 's-top', 's-bottom', 'r-inbox', 's-left']) geomCheck(await geometry(page, tid, true), (x) => tag(`${qs || 'defecto'} ${tid} (segunda etapa): ${x}`))
    note('pestaña frente al control: Δ ancho/alto máx · Δ borde máx (px)', `${engine} ${qs || 'defecto'} ${worst.tab.toFixed(3)} · ${worst.edge.toFixed(3)}`)
  }

  /* 2 · Contraste */
  const THEMES = engine === 'chromium'
    ? [['defecto', ''], ['defecto', 'dark=1'], ['estilo', 'theme=estilo'], ['estilo', 'theme=estilo&dark=1'], ...GEN.flatMap((t) => [[t, `theme=${t}`], [t, `theme=${t}&dark=1`]])]
    : [['defecto', ''], ['defecto', 'dark=1'], ['estilo', 'theme=estilo'], ['estilo', 'theme=estilo&dark=1']]
  const worstC = {}
  for (const [name, qs] of THEMES) {
    await go('?' + qs)
    const m = await page.evaluate(`(async () => { const { parse, ratio, bgOf, node, frame } = ${L}; const out = []
      for (const [tid, dwell] of [['t-copy', true], ['t-undo', false], ['r-inbox', true]]) {
        const inst = TT.get(tid), n = node(tid); inst.ctrl.scrollIntoView({ block: 'center' }); await frame()
        TT.open(tid, { instant: true }); if (dwell) TT.dwell(tid); await new Promise((r) => setTimeout(r, dwell ? 400 : 0)); await frame()
        const body = n.querySelector('.g-tooltip__body'), bg = parse(getComputedStyle(body).backgroundColor), page = bgOf(inst.ctrl.parentElement)
        const P = (k, el, min) => { if (el) out.push({ k, r: ratio(parse(getComputedStyle(el).color), bg), min }) }
        P('nombre', n.querySelector('.g-tooltip__text'), 4.5); P('detalle', n.querySelector('.g-tooltip__detail'), 4.5); P('atajo', n.querySelector('.g-tooltip__kbd'), 4.5)
        const k = n.querySelector('.g-tooltip__kbd'); if (k) out.push({ k: 'borde del atajo', r: ratio(parse(getComputedStyle(k).borderTopColor), bg), min: 3 })
        out.push({ k: 'pestaña / página', r: ratio(parse(getComputedStyle(n.querySelector('.g-tooltip__tab')).backgroundColor), page), min: 3 })
        out.push({ k: 'etiqueta / página', r: ratio(bg, page), min: 3 })
        TT.close(tid, { instant: true }); await frame()
      } return out })()`)
    const t = `${name} ${qs.includes('dark') ? 'oscuro' : 'claro'}`
    for (const c of m) { ok(c.r >= c.min, tag(`${t}: ${c.k} ${c.r}:1 < ${c.min}`)); worstC[c.k] = Math.min(worstC[c.k] ?? 99, c.r) }
  }
  note('contraste mínimo', `${engine} (${THEMES.length} temas) ` + Object.entries(worstC).map(([k, v]) => `${k} ${v}`).join(' · '))

  /* 3 · Movimiento (×5 lento para muestrear: press 800ms, fast 600ms) */
  {
    await go('?slow=1')
    // Viaje de «Deshacer» a «Duplicar» (mismo grupo, mismo lado)
    const tr = await page.evaluate(`(async () => { const { rect, node, frame } = ${L}
      document.querySelector('#toolbar').scrollIntoView({ block: 'center' }); await frame()
      TT.open('t-undo', { instant: true }); await frame()
      const A = node('t-undo'), B = node('t-copy'), C2 = rect(TT.get('t-copy').ctrl)
      const travelled = TT.travel('t-undo', 't-copy')
      const csB = getComputedStyle(B), tp = csB.transitionProperty, td = csB.transitionDuration
      const s = [], t0 = performance.now()
      while (performance.now() - t0 < 1300) {
        const all = [...document.querySelectorAll('.g-tooltip')].filter((n) => getComputedStyle(n).display !== 'none' && parseFloat(getComputedStyle(n).opacity) > 0.01)
        const T = rect(B.querySelector('.g-tooltip__tab')), Bd = rect(B.querySelector('.g-tooltip__body'))
        s.push({ vis: all.length, op: parseFloat(getComputedStyle(B).opacity), tl: T.l, tw: T.w, bl: Bd.l, br: Bd.r, tr: T.r, travel: B.hasAttribute('data-travel') })
        await new Promise((r) => requestAnimationFrame(r))
      }
      const out = { travelled, tp, td, s, C2, inline: B.style.inlineSize }
      TT.close('t-copy', { instant: true }); await frame()
      return out })()`)
    ok(tr.travelled, tag('viaje: no viajó dentro del mismo grupo y lado'))
    ok(/translate/.test(tr.tp) && /inline-size/.test(tr.tp) && /--_tooltip-ax/.test(tr.tp), tag(`viaje: transición sin translate/inline-size/pestaña (${tr.tp})`))
    ok(tr.s.every((x) => x.vis === 1), tag(`viaje: etiquetas visibles a la vez ${[...new Set(tr.s.map((x) => x.vis))]}`))
    ok(tr.s.every((x) => x.op === 1), tag(`viaje: el entrante tiene entrada (opacidad ${Math.min(...tr.s.map((x) => x.op))})`))
    const tl = tr.s.map((x) => x.tl), fin = tr.C2.l
    const mid = new Set(tl.filter((v) => Math.abs(v - fin) > 0.5 && Math.abs(v - tl[0]) > 0.5).map((v) => v.toFixed(1)))
    ok(mid.size >= 3, tag(`viaje: sin cuadros intermedios (${mid.size})`))
    ok(tl.every((v, i) => i === 0 || v >= tl[i - 1] - 0.05) && Math.max(...tl) <= fin + 0.5, tag(`viaje: la pestaña rebasa o retrocede (máx ${Math.max(...tl).toFixed(2)}, destino ${fin.toFixed(2)})`))
    ok(Math.abs(tl.at(-1) - fin) < 0.5 && Math.abs(tr.s.at(-1).tw - tr.C2.w) < 0.5, tag(`viaje: la pestaña no llega Δ${(tl.at(-1) - fin).toFixed(2)}`))
    ok(tr.s.every((x) => x.tl >= x.bl - 0.5 && x.tr <= x.br + 0.5), tag('viaje: la pestaña sale de la etiqueta en algún cuadro'))
    ok(!tr.s.at(-1).travel && !tr.inline, tag('viaje: data-travel o inline-size no se retiraron'))
    note('viaje: cuadros intermedios', `${engine} ${mid.size} (×5 lento)`)
    // Segunda etapa: el borde junto al control no se mueve; crece hacia fuera
    for (const [tid, edge] of [['s-bottom', 't'], ['s-top', 'b']]) {
      const g = await page.evaluate(`(async () => { const { rect, node, frame } = ${L}
        const n = node('${tid}'), inst = TT.get('${tid}'); inst.ctrl.scrollIntoView({ block: 'center' }); await frame()
        TT.open('${tid}', { instant: true }); await frame()
        const b0 = rect(n.querySelector('.g-tooltip__body')); TT.dwell('${tid}')
        const s = [], t0 = performance.now()
        while (performance.now() - t0 < 1200) { const b = rect(n.querySelector('.g-tooltip__body')), T = rect(n.querySelector('.g-tooltip__tab')), C = rect(inst.ctrl); s.push({ e: b['${edge}'], h: b.h, tab: '${edge}' === 't' ? T.t - C.b : C.t - T.b, op: parseFloat(getComputedStyle(n.querySelector('.g-tooltip__more-in')).opacity) }); await new Promise((r) => requestAnimationFrame(r)) }
        const tp = getComputedStyle(n.querySelector('.g-tooltip__more')).transitionProperty
        await new Promise((r) => setTimeout(r, 1200)); const late = rect(n.querySelector('.g-tooltip__body')).h
        TT.close('${tid}', { instant: true }); await frame()
        return { b0, s, tp, late } })()`)
      const e0 = g.b0[edge], hs = g.s.map((x) => x.h)
      ok(g.s.every((x) => Math.abs(x.e - e0) < 0.5), tag(`${tid}: el borde junto al control se mueve al crecer (máx Δ${Math.max(...g.s.map((x) => Math.abs(x.e - e0))).toFixed(2)})`))
      ok(g.s.every((x) => Math.abs(x.tab) < 0.5), tag(`${tid}: la pestaña se separa del control al crecer`))
      ok(hs.every((h, i) => i === 0 || h >= hs[i - 1] - 0.05) && new Set(hs.filter((h) => h > g.b0.h + 0.5 && h < hs.at(-1) - 0.5).map((h) => h.toFixed(1))).size >= 2 && hs.at(-1) > g.b0.h + 10, tag(`${tid}: no crece de forma continua (${g.b0.h} → ${hs.at(-1)})`))
      ok(/grid-template-rows/.test(g.tp) && g.s.at(-1).op === 1, tag(`${tid}: segunda etapa sin grid-template-rows o sin mostrar el detalle (${g.tp})`))
      ok(Math.abs(g.late - hs.at(-1)) < 0.5, tag(`${tid}: el alto cambia después de crecer (${hs.at(-1)} → ${g.late})`))
    }
    // Entrada, salida y data-instant
    const io = await page.evaluate(`(async () => { const { node, frame } = ${L}
      const n = node('t-tag'); TT.get('t-tag').ctrl.scrollIntoView({ block: 'center' }); await frame()
      const sample = async (ms) => { const s = [], t0 = performance.now(); while (performance.now() - t0 < ms) { const cs = getComputedStyle(n); s.push([+parseFloat(cs.opacity).toFixed(3), cs.display]); await new Promise((r) => requestAnimationFrame(r)) } return s }
      TT.open('t-tag'); const inS = await sample(800)
      TT.close('t-tag'); const outS = await sample(900)
      TT.open('t-tag', { instant: true }); const inI = await sample(100)
      TT.close('t-tag', { instant: true }); const outI = await sample(100)
      return { inS, outS, inI, outI } })()`)
    ok(io.inS[0][0] < 0.5 && io.inS.at(-1)[0] === 1 && io.inS.some((x) => x[0] > 0.05 && x[0] < 0.95), tag(`entrada sin fundido ${JSON.stringify(io.inS.slice(0, 3))}`))
    // La salida con fundido necesita transicionar display (allow-discrete) en un popover: Chromium sí; Firefox y WebKit
    // de Playwright cierran en el acto (como GMenu y GSelect). Se exige el cierre y se anota el fundido
    const fade = io.outS[0][1] !== 'none' && io.outS.some((x) => x[0] > 0.05 && x[0] < 0.95)
    ok(io.outS.at(-1)[1] === 'none', tag(`salida: no se cierra ${JSON.stringify(io.outS.at(-1))}`))
    if (engine === 'chromium') ok(fade, tag(`salida sin fundido ${JSON.stringify(io.outS.slice(0, 3))} … ${JSON.stringify(io.outS.at(-1))}`))
    note('salida con fundido (display allow-discrete en popover)', `${engine} ${fade ? 'sí' : 'no: cierra en el acto'}`)
    ok(io.inI.every((x) => x[0] === 1), tag(`data-instant: hay entrada ${JSON.stringify(io.inI.slice(0, 3))}`))
    ok(io.outI.every((x) => x[1] === 'none'), tag(`data-instant: hay salida ${JSON.stringify(io.outI.slice(0, 3))}`))
    // Movimiento reducido
    const rctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
    const rp = await rctx.newPage(); watch(rp)
    await go('?slow=1', rp)
    const red = await rp.evaluate(`(async () => { const { rect, node, frame } = ${L}
      document.querySelector('#toolbar').scrollIntoView({ block: 'center' }); await frame()
      TT.open('t-undo', { instant: true }); await frame()
      const B = node('t-copy'), C2 = rect(TT.get('t-copy').ctrl)
      TT.travel('t-undo', 't-copy'); const tp = getComputedStyle(B).transitionProperty
      await new Promise((r) => requestAnimationFrame(r)); const T1 = rect(B.querySelector('.g-tooltip__tab'))
      TT.close('t-copy', { instant: true }); await frame()
      const n = node('s-bottom'); TT.get('s-bottom').ctrl.scrollIntoView({ block: 'center' }); await frame()
      TT.open('s-bottom', { instant: true }); await frame(); TT.dwell('s-bottom')
      await new Promise((r) => requestAnimationFrame(r)); const h1 = rect(n.querySelector('.g-tooltip__body')).h
      await new Promise((r) => setTimeout(r, 1800)); const h2 = rect(n.querySelector('.g-tooltip__body')).h
      const mtp = getComputedStyle(n.querySelector('.g-tooltip__more')).transitionProperty
      TT.close('s-bottom', { instant: true }); await frame()
      TT.open('t-tag'); const op0 = parseFloat(getComputedStyle(node('t-tag')).opacity); const ntp = getComputedStyle(node('t-tag')).transitionProperty
      return { tp, T1, C2, h1, h2, mtp, op0, ntp } })()`)
    ok(!/translate|inline-size|--_tooltip/.test(red.tp), tag(`reducido: el viaje anima ${red.tp}`))
    ok(Math.abs(red.T1.l - red.C2.l) < 0.5, tag(`reducido: la pestaña no salta al destino (Δ${(red.T1.l - red.C2.l).toFixed(2)})`))
    ok(Math.abs(red.h1 - red.h2) < 0.5 && !/grid-template-rows/.test(red.mtp), tag(`reducido: la segunda etapa crece (${red.h1} → ${red.h2}; ${red.mtp})`))
    ok(/opacity/.test(red.ntp) && red.op0 < 1, tag(`reducido: sin fundido de entrada (${red.ntp}, ${red.op0})`))
    await rctx.close()
  }

  /* 4 · 320px */
  {
    const nctx = await browser.newContext({ viewport: { width: 320, height: 720 } })
    const np = await nctx.newPage(); watch(np)
    for (const qs of ['', '?dir=rtl', '?theme=estilo', '?theme=estilo&dir=rtl']) {
      await go(qs, np)
      for (const [tid, dw] of [['t-flag', true], ['block', false], ['edge-end', false], ['edge-start', false], ['s-top', true], ['w120b', false]]) {
        const g = await geometry(np, tid, dw)
        const maxW = Math.min(70 * g.u, g.vw - 4 * g.u)
        ok(g.B.l >= 2 * g.u - 0.5 && g.B.r <= g.vw - 2 * g.u + 0.5 && g.B.w <= maxW + 0.5, tag(`320 ${qs} ${tid}: etiqueta ${g.B.l.toFixed(1)}–${g.B.r.toFixed(1)} (máx ${maxW})`))
        ok(g.clip <= 1, tag(`320 ${qs} ${tid}: texto recortado`))
        if (tid === 'block') note('320px: ancho de la etiqueta del control block', `${engine} ${qs || 'defecto'} ${g.B.w.toFixed(1)} (visor ${g.vw}, space ${g.u})`)
      }
    }
    await nctx.close()
  }

  /* 5 · forced-colors (emulado) */
  {
    const fctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const fp = await fctx.newPage(); watch(fp)
    let supported = true
    try { await fp.emulateMedia({ forcedColors: 'active' }) } catch { supported = false }
    if (supported) {
      await go('', fp)
      if (await fp.evaluate(() => matchMedia('(forced-colors: active)').matches)) {
        const f = await fp.evaluate(`(async () => { const { node, frame } = ${L}; const out = {}
          const sys = (k, p = 'color') => { const e = document.createElement('i'); e.style[p] = k; document.body.append(e); const c = getComputedStyle(e)[p]; e.remove(); return c }
          for (const tid of ['t-copy', 'r-inbox']) { const n = node(tid); TT.get(tid).ctrl.scrollIntoView({ block: 'center' }); await frame(); TT.open(tid, { instant: true }); TT.dwell(tid); await frame()
            const b = getComputedStyle(n.querySelector('.g-tooltip__body')), t = getComputedStyle(n.querySelector('.g-tooltip__tab')), k = n.querySelector('.g-tooltip__kbd')
            out[tid] = { side: n.dataset.side, bc: b.borderTopColor, bw: parseFloat(b.borderTopWidth), tb: [t.borderLeftColor, t.borderLeftWidth, t.borderRightWidth, t.borderTopWidth, t.borderBottomWidth], tbg: t.backgroundColor, before: getComputedStyle(n, '::before').content, after: getComputedStyle(n, '::after').content, kbd: k ? getComputedStyle(k).borderTopColor : null, text: getComputedStyle(n.querySelector('.g-tooltip__text')).color }
            TT.close(tid, { instant: true }); await frame() }
          out.ct = sys('CanvasText'); out.cv = sys('Canvas', 'backgroundColor'); return out })()`)
        for (const tid of ['t-copy', 'r-inbox']) {
          const x = f[tid]
          ok(x.bc === f.ct && x.bw >= 1, tag(`forced ${tid}: borde de la etiqueta ${x.bc} ${x.bw}`))
          const sides = x.side === 'bottom' || x.side === 'top' ? [x.tb[1], x.tb[2]] : [x.tb[3], x.tb[4]]
          ok(x.tb[0] === f.ct && sides.every((w) => parseFloat(w) >= 1) && x.tbg === f.cv, tag(`forced ${tid}: pestaña sin sus lados en CanvasText ${JSON.stringify(x.tb)} ${x.tbg}`))
          ok(x.before === 'none' && x.after === 'none', tag(`forced ${tid}: curvas de unión presentes`))
          ok(x.text === f.ct && (x.kbd === null || x.kbd === f.ct), tag(`forced ${tid}: texto o atajo fuera de CanvasText`))
        }
        note('forced-colors', `${engine} medido`)
      } else note('forced-colors', `${engine}: la emulación no activa la consulta (no medido)`)
    } else note('forced-colors', `${engine}: emulación no admitida (no medido)`)
    await fctx.close()
  }

  /* 6 · Puntero grueso */
  {
    let tctx
    try { tctx = await browser.newContext({ viewport: { width: 800, height: 900 }, hasTouch: true, isMobile: engine !== 'firefox' }) } catch { tctx = null }
    if (tctx) {
      const tp = await tctx.newPage(); watch(tp)
      await go('', tp)
      const t = await tp.evaluate(() => {
        const btn = TT.get('t-copy').ctrl, inp = TT.get('field').ctrl, cs = getComputedStyle(btn)
        return { coarse: matchMedia('(pointer: coarse)').matches, btn: cs.userSelect || cs.webkitUserSelect, inp: getComputedStyle(inp).userSelect || getComputedStyle(inp).webkitUserSelect, callout: CSS.supports('-webkit-touch-callout', 'none') ? cs.getPropertyValue('-webkit-touch-callout') : 'no admitido', marked: btn.hasAttribute('data-g-tooltip') && inp.hasAttribute('data-g-tooltip') }
      })
      if (t.coarse) {
        ok(t.marked && t.btn === 'none' && t.inp !== 'none', tag(`táctil: selección ${JSON.stringify(t)}`))
        ok(t.callout === 'no admitido' || t.callout === 'none', tag(`táctil: -webkit-touch-callout ${t.callout}`))
        note('táctil', `${engine} control user-select ${t.btn} · campo ${t.inp} · touch-callout ${t.callout}`)
        // #395: caja marcada con `data-g-tooltip-box` que contiene un control con `data-g-tooltip` (en el componente real la
        // marca la pone bruno; aquí se pone a mano): la caja y su prefijo no se seleccionan, el campo sí
        const bx = await tp.evaluate(() => {
          const box = document.createElement('div')
          box.setAttribute('data-g-tooltip-box', '')
          box.innerHTML = '<span class="pre">+52</span><input aria-label="Teléfono" data-g-tooltip><textarea aria-label="Nota"></textarea>'
          document.body.append(box)
          const us = (e) => getComputedStyle(e).userSelect || getComputedStyle(e).webkitUserSelect
          const r = { box: us(box), pre: us(box.firstChild), inp: us(box.querySelector('input')), ta: us(box.querySelector('textarea')), callout: CSS.supports('-webkit-touch-callout', 'none') ? getComputedStyle(box).getPropertyValue('-webkit-touch-callout') : 'no admitido' }
          const lone = document.createElement('div'); lone.setAttribute('data-g-tooltip-box', ''); lone.innerHTML = '<span>x</span><input aria-label="Sin tooltip">'
          document.body.append(lone); r.lone = us(lone)
          box.remove(); lone.remove()
          return r
        })
        ok(bx.box === 'none' && bx.pre === 'none' && bx.inp !== 'none' && bx.ta !== 'none', tag(`táctil: caja marcada ${JSON.stringify(bx)}`))
        ok(bx.callout === 'no admitido' || bx.callout === 'none', tag(`táctil: caja -webkit-touch-callout ${bx.callout}`))
        ok(bx.lone !== 'none', tag(`táctil: caja marcada sin tooltip dentro no se toca (${bx.lone})`))
        note('táctil', `${engine} caja user-select ${bx.box} · prefijo ${bx.pre} · input ${bx.inp} · textarea ${bx.ta} · sin tooltip ${bx.lone}`)
      } else note('táctil', `${engine}: (pointer: coarse) no se emula (no medido)`)
      await tctx.close()
    }
  }

  /* 7 · #383 */
  {
    const FX = ['dialog', 'ig', 'ig2', 'row', 'adapt', 'meta', 'action']
    const snap = (p) => p.evaluate((FX) => {
      const out = {}
      for (const k of [...FX, ...FX.map((f) => f + '-tt')]) {
        const host = document.querySelector(`[data-fx="${k}"]`), hr = host.getBoundingClientRect()
        out[k] = [...host.querySelectorAll('*')].filter((e) => !e.closest('.g-tooltip') && !e.closest('option')).map((e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return [e.tagName, +(r.left - hr.left).toFixed(2), +(r.top - hr.top).toFixed(2), +r.width.toFixed(2), +r.height.toFixed(2), cs.marginTop, cs.marginBottom, cs.marginLeft, cs.marginRight, cs.borderLeftWidth, cs.borderLeftStyle, cs.paddingLeft, cs.paddingRight].join('|') })
        out[k].push('host|' + hr.width.toFixed(2) + '|' + hr.height.toFixed(2))
      }
      // El nodo cerrado no se ve ni ocupa; abierto en (100, 100) no hereda márgenes ni anchos del contenedor
      const nodes = {}
      for (const n of document.querySelectorAll('[data-fx] .g-tooltip')) {
        const closed = getComputedStyle(n).display
        n.setAttribute('data-instant', ''); n.showPopover(); n.dataset.side = 'bottom'
        for (const [k, v] of [['--_x', '100px'], ['--_y', '100px'], ['--_yb', '0px'], ['--_tooltip-ax', '10px'], ['--_tooltip-aw', '20px'], ['--_tooltip-ah', '20px']]) n.style.setProperty(k, v)
        const r = n.getBoundingClientRect(), text = n.querySelector('.g-tooltip__text').getBoundingClientRect()
        nodes[n.id] = { closed, l: r.left, t: r.top, w: r.width, textW: text.width }
        n.hidePopover()
      }
      return { out, nodes }
    }, FX)
    await go('?css=head')
    const head = await snap(page)
    await go('')
    const work = await snap(page)
    const diff = (a, b) => a.filter((x, i) => x !== b[i]).length + Math.abs(a.length - b.length)
    for (const f of FX) {
      ok(diff(head.out[f], work.out[f]) === 0, tag(`#383 Δ0 sin tooltip: ${f} cambia frente a ${REF} (${work.out[f].filter((x, i) => x !== head.out[f][i]).slice(0, 2)} | ${head.out[f].filter((x, i) => x !== work.out[f][i]).slice(0, 2)})`))
      ok(diff(work.out[f], work.out[f + '-tt']) === 0, tag(`#383 con el nodo hermano: ${f} no conserva su aspecto (${work.out[f].filter((x, i) => x !== work.out[f + '-tt'][i]).slice(0, 2)})`))
    }
    const before = FX.filter((f) => diff(head.out[f], head.out[f + '-tt']) !== 0)
    note('#383: con el CSS anterior el nodo hermano cambiaba', `${engine} ${before.join(', ') || 'nada'}`)
    ok(['dialog', 'ig', 'ig2'].every((f) => before.includes(f)), tag(`#383: la prueba no distingue el CSS anterior (${before})`))
    const badNode = []
    for (const [id, x] of Object.entries(work.nodes)) if (x.closed !== 'none' || Math.abs(x.l - 100) > 0.5 || Math.abs(x.t - 100) > 0.5 || x.w > x.textW + 4 * 16) badNode.push(`${id} ${JSON.stringify(x)}`)
    ok(!badNode.length, tag('#383: el nodo hereda del contenedor: ' + badNode.join(' | ')))
    const badHead = Object.entries(head.nodes).filter(([, x]) => x.closed !== 'none' || Math.abs(x.l - 100) > 0.5 || Math.abs(x.t - 100) > 0.5 || x.w > x.textW + 64).map(([id]) => id)
    note('#383: nodos que heredaban del contenedor con el CSS anterior', `${engine} ${badHead.join(', ') || 'ninguno'}`)
  }

  ok(!errors.length, tag('consola: ' + errors.slice(0, 5).join(' | ')))
  await browser.close()
}

server.close()
for (const [k, v] of Object.entries(measures)) console.log(`· ${k}\n    ${v.join('\n    ')}`)
if (fails.length) console.log('\nFALLOS:\n  ' + fails.slice(0, args.verbose ? 999 : 60).join('\n  '))
console.log(`\n${total - failed}/${total} comprobaciones`)
process.exit(failed ? 1 : 0)
