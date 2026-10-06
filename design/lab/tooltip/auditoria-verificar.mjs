// Auditoría de coco (paso 5) de GTooltip sobre el COMPONENTE REAL (dist/grana.umd.js, combobox, file-field y grana.css)
// en design/lab/tooltip/auditoria-banco.html, con el tema por defecto (claro y oscuro), un tema generado con @grana/cli
// para esta auditoría (auditoria-tema.json → auditoria-tema.css: brand #14532D, accent #B45309, neutros teñidos,
// radius 14, space 5, fontSize 17, borde 2px; claro y oscuro) y, para el contraste en Chromium, los once temas de
// design/lab/tema-oscuro/dark-color-presence/generated/ (claro y oscuro). Mide:
//   1 · forma A: la pestaña contra la caja visible en la matriz de hijos admitidos (GBtn button y a, GInput con
//       prefix/suffix/action, contraseña, GTextarea, GSelect, GNumberField −/+, GCombobox field y palette, GDatePicker,
//       GSwitch, GCheckbox, GHelper, GFileField vacío y con archivos): Δ ≤ 0,5 px de ancho y del borde, entra
//       --g-border-width en la etiqueta, nunca sobresale, hueco space × 1,5; esquinas y curvas de unión según la
//       geometría; texto ≥ 12 px sin recorte; dentro del visor; ancho ≤ min(space × 70, visor − space × 4)
//   2 · control relleno a los doce lados (lado pedido, alineación start/center/end), 120 px (etiqueta = pestaña,
//       esquinas rectas), block (pestaña acotada y centrada), segunda etapa del relleno
//   3 · desbordes del visor (cuatro esquinas: volteo y margen), RTL (lado físico, alineación start, pestaña), 320 px
//   4 · movimiento: viaje por relevo en una barra (una sola etiqueta por cuadro y ningún cuadro vacío, sin entrada,
//       monótono, sin rebase, pestaña siempre dentro, Δ0 al llegar, data-travel e inline-size retirados), segunda etapa
//       hacia fuera (abajo y arriba: el borde junto al control fijo), movimiento reducido (el viaje salta, la segunda
//       etapa no crece, el fundido se queda), data-instant (sin entrada) y fundido de entrada en frío
//   5 · accesibilidad: contraste (nombre, detalle, atajo ≥ 4,5:1; borde del atajo ≥ 3:1; pestaña y etiqueta contra la
//       página ≥ 3:1), WCAG 1.4.13 (Esc sin mover el foco, el puntero cruza por la pestaña sin cerrar, persiste),
//       foco solo por navegación (Tab sí; clic y programa no), forced-colors emulado, táctil emulado (pointer: coarse:
//       sin selección ni lupa en control y caja; pulsación larga sintética muestra el nombre y soltar no activa)
//   6 · #383 en componentes reales: GDialog (último control), GInput action, GInputGroup (parte y unidad; advertencia),
//       GFormRow, GAdaptiveLayout y GCard (meta y acciones): Δ0 frente al mismo marcado sin tooltip, cerrado y abierto
//   7 · consola limpia
// Ejecutar desde la raíz con dist/ reconstruido: GRANA_PW_PORT=4209 node design/lab/tooltip/auditoria-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit   --shots (capturas en $SHOTS o /tmp/grana-tooltip-audit)   --verbose
import { readdir, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { serve, ROOT } from './estilo-serve.mjs'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const SHOTS = process.env.SHOTS || '/tmp/grana-tooltip-audit'
if (args.shots) await mkdir(SHOTS, { recursive: true })
const { server } = await serve(Number(process.env.GRANA_PW_PORT) || 4209)
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/tooltip/auditoria-banco.html`
const GEN = (await readdir(join(ROOT, 'design/lab/tema-oscuro/dark-color-presence/generated'))).filter((f) => /^[a-z-]+\.css$/.test(f) && !/variants/.test(f)).map((f) => f.replace('.css', ''))

let total = 0, failed = 0
const fails = [], measures = {}, perEngine = {}
let ENGINE = ''
const ok = (cond, msg) => { total++; perEngine[ENGINE] ??= { total: 0, failed: 0 }; perEngine[ENGINE].total++; if (!cond) { failed++; perEngine[ENGINE].failed++; fails.push(`[${ENGINE}] ${msg}`) } }
const note = (k, v) => { (measures[k] ??= []).push(v) }
const near = (a, b, t = 0.5) => Math.abs(a - b) <= t

/* ---------- En la página ---------- */
const LIB = () => {
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
    let b = parse(getComputedStyle(document.body).backgroundColor)
    if (b[3] < 1) b = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) b = over(layers[i], b)
    return b
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height } }
  const ids = (el, a) => (el.getAttribute(a) || '').split(/\s+/).filter(Boolean)
  const find = (c) => {
    const el = document.querySelector(`[data-case="${c}"]`)
    if (!el) return null
    const res = el.matches('[data-g-tooltip]') ? el : el.querySelector('[data-g-tooltip]') || el.closest('[data-g-tooltip]')
    if (!res) return null
    const nameId = ids(res, 'aria-labelledby').concat(ids(res, 'aria-describedby')).find((i) => /-name$/.test(i) && document.getElementById(i)?.closest('.g-tooltip'))
    const node = nameId && document.getElementById(nameId).closest('.g-tooltip')
    if (!node) return null
    const root = node.previousElementSibling
    const b = res.closest('[data-g-tooltip-box]')
    const box = b && root && root.contains(b) ? b : res
    return { el, res, node, root, box }
  }
  const px = (v) => parseFloat(v) || 0
  const geo = (c) => {
    const f = find(c)
    if (!f) return null
    const { node, box, res, root } = f
    const cs = getComputedStyle(node)
    const body = node.querySelector('.g-tooltip__body'), tab = node.querySelector('.g-tooltip__tab')
    const bcs = getComputedStyle(body)
    const pseudo = (p) => { const s = getComputedStyle(node, p); return { content: s.content, l: px(s.left), t: px(s.top), w: px(s.width), h: px(s.height), bg: s.backgroundImage } }
    // El radio llega como expresión (clamp(0px, calc(100% - …), 14px) 14px): se evalúa con el ancho o alto de la etiqueta
    const br = body.getBoundingClientRect()
    const CLs = 'const CL=(a,b,c)=>Math.min(c,Math.max(a,b));'
    const top = (str) => { const out = []; let d = 0, cur = ''; for (const ch of str) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ' ' && !d) { out.push(cur); cur = '' } else cur += ch } out.push(cur); return out.filter(Boolean) }
    const rad = (k) => { const parts = top(bcs[k]); const ev = (e, basis) => Function(CLs + 'return ' + e.replace(/calc\(/g, '(').replace(/clamp\(/g, 'CL(').replace(/(-?[\d.]+)%/g, (m, n) => `(${n}/100*${basis})`).replace(/(-?[\d.]+)px/g, '$1'))(); const h = ev(parts[0], br.width); return [h, parts[1] ? ev(parts[1], br.height) : h] }
    const text = node.querySelector('.g-tooltip__text'), kbd = node.querySelector('.g-tooltip__kbd'), det = node.querySelector('.g-tooltip__detail')
    return {
      open: node.matches(':popover-open'), side: node.dataset.side, attrs: [...node.attributes].map((a) => a.name).filter((a) => a.startsWith('data-')),
      inline: node.style.inlineSize, dir: getComputedStyle(res).direction,
      box: R(box), n: R(node), body: R(body), tab: R(tab), before: pseudo('::before'), after: pseudo('::after'),
      radii: { tl: rad('borderTopLeftRadius'), tr: rad('borderTopRightRadius'), bl: rad('borderBottomLeftRadius'), br: rad('borderBottomRightRadius') },
      u: px(cs.getPropertyValue('--g-space-1')), bw: px(cs.getPropertyValue('--g-border-width')), r: px(cs.getPropertyValue('--g-radius-md')), fl: px(cs.getPropertyValue('--g-radius-sm')),
      fs: { text: px(getComputedStyle(text).fontSize), kbd: kbd ? px(getComputedStyle(kbd).fontSize) : null, det: det ? px(getComputedStyle(det).fontSize) : null },
      clip: body.scrollWidth - body.clientWidth, vw: document.documentElement.clientWidth, vh: document.documentElement.clientHeight,
      opacity: +cs.opacity, boxIsRes: box === res, rootTag: root.className
    }
  }
  const openCount = () => [...document.querySelectorAll('.g-tooltip')].filter((n) => n.matches(':popover-open')).length
  const visible = () => [...document.querySelectorAll('.g-tooltip')].filter((n) => n.matches(':popover-open') && +getComputedStyle(n).opacity > 0.01)
  const contrast = (c) => {
    const f = find(c)
    const n = f.node, body = n.querySelector('.g-tooltip__body'), tab = n.querySelector('.g-tooltip__tab')
    const bb = bgOf(body)
    const page = bgOf(f.root.parentElement)
    const col = (e) => parse(getComputedStyle(e).color)
    const kbd = n.querySelector('.g-tooltip__kbd'), det = n.querySelector('.g-tooltip__detail')
    return {
      name: ratio(over(col(n.querySelector('.g-tooltip__text')), bb), bb),
      det: det ? ratio(over(col(det), bb), bb) : null,
      kbd: kbd ? ratio(over(col(kbd), bb), bb) : null,
      kbdBorder: kbd ? ratio(over(parse(getComputedStyle(kbd).borderTopColor), bb), bb) : null,
      tab: ratio(over(parse(getComputedStyle(tab).backgroundColor), page), page),
      body: ratio(bb, page)
    }
  }
  const sys = (name, prop = 'color') => { const d = document.createElement('div'); d.style[prop] = name; document.body.append(d); const v = getComputedStyle(d)[prop]; d.remove(); return v }
  // #383: descendientes de un contenedor (sin los nodos .g-tooltip) con su caja relativa y el modelo de caja
  const PROPS = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopColor', 'borderLeftColor', 'borderRightColor', 'boxShadow', 'whiteSpace', 'minWidth', 'minHeight', 'display']
  const snap = (host, colors = true) => {
    const o = R(host)
    const out = []
    const walk = (e) => {
      for (const k of e.children) {
        if (k.classList.contains('g-tooltip')) continue
        const r = R(k), s = getComputedStyle(k)
        out.push([k.tagName, +(r.l - o.l).toFixed(2), +(r.t - o.t).toFixed(2), +r.w.toFixed(2), +r.h.toFixed(2), ...PROPS.filter((p) => colors || !/Color|Shadow/.test(p)).map((p) => s[p])])
        walk(k)
      }
    }
    walk(host)
    return out
  }
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  window.A = { find, geo, openCount, visible, contrast, sys, snap, frame, R, parse, ratio, bgOf }
}

/* ---------- Utilidades de Playwright ---------- */
const g = (page, c) => page.evaluate((c) => A.geo(c), c)
async function load(page, { q = '', part = 'all', motion = 'reduce', w = 1280, h = 900, css = '' } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  try { await page.emulateMedia({ forcedColors: 'none' }) } catch { /* sin emulación */ }
  await page.setViewportSize({ width: w, height: h })
  await page.goto(`${BASE}?part=${part}${q ? '&' + q : ''}`)
  await page.waitForFunction(() => window.__ready && document.fonts.status === 'loaded')
  await page.evaluate(LIB)
  if (css) await page.addStyleTag({ content: css })
  await page.mouse.move(3, 3)
  await page.waitForTimeout(150)
}
async function closeAll(page) {
  await page.mouse.move(3, 3)
  await page.waitForFunction(() => A.openCount() === 0, null, { timeout: 2000 }).catch(() => {})
}
/** Abre el tooltip de un caso con el puntero en el centro de su caja visible; devuelve su geometría */
async function hoverOpen(page, c, { at } = {}) {
  await closeAll(page)
  await page.evaluate((c) => A.find(c).box.scrollIntoView({ block: 'center', inline: 'center' }), c)
  await page.waitForTimeout(30)
  const b = await page.evaluate((c) => A.R(A.find(c).box), c)
  const [x, y] = at ? at(b) : [b.l + b.w / 2, b.t + b.h / 2]
  await page.mouse.move(x, y)
  const opened = await page.waitForFunction((c) => { const f = A.find(c); return f.node.matches(':popover-open') && !f.node.hasAttribute('data-travel') }, c, { timeout: 2500 }).then(() => true).catch(() => false)
  await page.evaluate(() => A.frame())
  return opened ? g(page, c) : null
}

/** Comprobaciones geométricas de la forma A sobre una medida */
function checkShape(m, tag, { side, align } = {}) {
  if (!m) { ok(false, `${tag}: no abre`); return }
  const { box, body, tab, bw, u, r, fl } = m
  const s = m.side
  if (side) ok(s === side, `${tag}: lado ${s} (pedido ${side})`)
  const rtl = m.dir === 'rtl'
  const phys = s === 'top' || s === 'bottom' ? s : (s === 'right') !== rtl ? 'right' : 'left'
  const max = Math.min(u * 70, m.vw - u * 4)
  const vertical = phys === 'top' || phys === 'bottom'
  // Pestaña: del tamaño de la caja (acotada a la etiqueta), dentro de la etiqueta, toca el borde de la caja y entra bw
  if (vertical) {
    const want = Math.min(box.r, body.r) - Math.max(box.l, body.l)
    ok(near(tab.w, want), `${tag}: pestaña ${tab.w.toFixed(2)} ≠ ${want.toFixed(2)} (caja ∩ etiqueta)`)
    if (want < box.w - 0.5 && box.w <= body.w) note('pestaña recortada por el visor', `${ENGINE} ${tag}: ${(box.w - want).toFixed(1)}px`)
    ok(tab.l >= body.l - 0.5 && tab.r <= body.r + 0.5, `${tag}: la pestaña sobresale de la etiqueta`)
    if (box.l >= body.l - 0.5 && box.r <= body.r + 0.5) ok(near(tab.l, box.l) && near(tab.r, box.r), `${tag}: la pestaña no se alinea con la caja (Δ ${(tab.l - box.l).toFixed(2)})`)
    else ok(near((tab.l + tab.r) / 2, (box.l + box.r) / 2, 1) || tab.l <= box.l + 0.5 || tab.r >= box.r - 0.5, `${tag}: pestaña acotada fuera de la caja`)
    ok(body.w >= Math.min(box.w, max) - 0.5, `${tag}: etiqueta ${body.w.toFixed(1)} más estrecha que la caja`)
    if (phys === 'bottom') {
      ok(near(tab.t, box.b), `${tag}: la pestaña no toca la caja (Δ ${(tab.t - box.b).toFixed(2)})`)
      ok(near(tab.b, body.t + bw), `${tag}: la pestaña no entra el borde en la etiqueta`)
      ok(near(body.t - box.b, u * 1.5), `${tag}: hueco ${(body.t - box.b).toFixed(2)} ≠ space × 1,5`)
    } else {
      ok(near(tab.b, box.t), `${tag}: la pestaña no toca la caja (Δ ${(tab.b - box.t).toFixed(2)})`)
      ok(near(tab.t, body.b - bw), `${tag}: la pestaña no entra el borde en la etiqueta`)
      ok(near(box.t - body.b, u * 1.5), `${tag}: hueco ${(box.t - body.b).toFixed(2)} ≠ space × 1,5`)
    }
    // Esquinas del lado de la pestaña: lo que sobra de etiqueta junto a ella, hasta --g-radius-md; curvas de unión
    const lead = box.l - body.l, tail = body.r - box.r
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
    const [c1, c2] = phys === 'bottom' ? [m.radii.tl, m.radii.tr] : [m.radii.bl, m.radii.br]
    ok(near(c1[0], clamp(lead, 0, r), 0.6) && near(c2[0], clamp(tail, 0, r), 0.6), `${tag}: esquinas ${c1[0]}/${c2[0]} ≠ ${clamp(lead, 0, r).toFixed(1)}/${clamp(tail, 0, r).toFixed(1)}`)
    // Hallazgo 1: las curvas nunca asoman fuera de la etiqueta (antes, con la pestaña en su borde, una mota de bw)
    ok((m.before.w < 0.01 || m.before.l >= -0.3) && (m.after.w < 0.01 || m.after.l + m.after.w <= body.w + 0.3), `${tag}: una curva de unión asoma fuera de la etiqueta (${m.before.l.toFixed(1)} / ${(m.after.l + m.after.w - body.w).toFixed(1)})`)
    if (box.l >= body.l - 0.5 && box.r <= body.r + 0.5) {
      const s1 = clamp(lead - r, 0, fl) + clamp(lead, 0, bw), s2 = clamp(tail - r, 0, fl) + clamp(tail, 0, bw)
      ok(m.before.content !== 'none' && near(m.before.w, s1, 0.6) && near(m.after.w, s2, 0.6), `${tag}: curvas ${m.before.w}/${m.after.w} ≠ ${s1.toFixed(1)}/${s2.toFixed(1)}`)
      ok(near(body.l + m.before.l + m.before.w, tab.l, 0.6) && near(body.l + m.after.l, tab.r, 0.6), `${tag}: las curvas no tocan la pestaña`)
    }
  } else {
    const want = Math.min(box.b, body.b) - Math.max(box.t, body.t)
    ok(near(tab.h, want), `${tag}: pestaña ${tab.h.toFixed(2)} ≠ ${want.toFixed(2)} (caja ∩ etiqueta)`)
    ok(tab.t >= body.t - 0.5 && tab.b <= body.b + 0.5, `${tag}: la pestaña sobresale de la etiqueta`)
    if (box.t >= body.t - 0.5 && box.b <= body.b + 0.5) ok(near(tab.t, box.t) && near(tab.b, box.b), `${tag}: la pestaña no se alinea con la caja`)
    ok(body.h >= Math.min(box.h, m.vh - u * 4) - 0.5, `${tag}: etiqueta más baja que la caja`)
    if (phys === 'right') {
      ok(near(tab.l, box.r), `${tag}: la pestaña no toca la caja (Δ ${(tab.l - box.r).toFixed(2)})`)
      ok(near(tab.r, body.l + bw), `${tag}: la pestaña no entra el borde en la etiqueta`)
      ok(near(body.l - box.r, u * 1.5), `${tag}: hueco ≠ space × 1,5`)
    } else {
      ok(near(tab.r, box.l), `${tag}: la pestaña no toca la caja (Δ ${(tab.r - box.l).toFixed(2)})`)
      ok(near(tab.l, body.r - bw), `${tag}: la pestaña no entra el borde en la etiqueta`)
      ok(near(box.l - body.r, u * 1.5), `${tag}: hueco ≠ space × 1,5`)
    }
    const lead = box.t - body.t, tail = body.b - box.b
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
    const [c1, c2] = phys === 'right' ? [m.radii.tl, m.radii.bl] : [m.radii.tr, m.radii.br]
    ok(near(c1[1], clamp(lead, 0, r), 0.6) && near(c2[1], clamp(tail, 0, r), 0.6), `${tag}: esquinas ${c1}/${c2} ≠ ${clamp(lead, 0, r).toFixed(1)}/${clamp(tail, 0, r).toFixed(1)}`)
    ok((m.before.h < 0.01 || m.before.t >= -0.3) && (m.after.h < 0.01 || m.after.t + m.after.h <= body.h + 0.3), `${tag}: una curva de unión asoma fuera de la etiqueta (${m.before.t.toFixed(1)} / ${(m.after.t + m.after.h - body.h).toFixed(1)})`)
    if (box.t >= body.t - 0.5 && box.b <= body.b + 0.5) {
      const s1 = clamp(lead - r, 0, fl) + clamp(lead, 0, bw), s2 = clamp(tail - r, 0, fl) + clamp(tail, 0, bw)
      ok(m.before.content !== 'none' && near(m.before.h, s1, 0.6) && near(m.after.h, s2, 0.6), `${tag}: curvas ${m.before.h}/${m.after.h} ≠ ${s1.toFixed(1)}/${s2.toFixed(1)}`)
      ok(near(body.t + m.before.t + m.before.h, tab.t, 0.6) && near(body.t + m.after.t, tab.b, 0.6), `${tag}: las curvas no tocan la pestaña`)
    }
  }
  // Alineación pedida
  if (align !== undefined) {
    const cx = (x) => (x.l + x.r) / 2, cy = (x) => (x.t + x.b) / 2
    const startEdge = rtl ? 'r' : 'l', endEdge = rtl ? 'l' : 'r'
    if (vertical) ok(align === 'start' ? near(body[startEdge], box[startEdge]) : align === 'end' ? near(body[endEdge], box[endEdge]) : near(cx(body), cx(box)), `${tag}: alineación ${align} incorrecta`)
    else ok(align === 'start' ? near(body.t, box.t) : align === 'end' ? near(body.b, box.b) : near(cy(body), cy(box)), `${tag}: alineación ${align} incorrecta`)
  }
  // Visor, ancho máximo, texto
  ok(body.l >= u * 2 - 0.6 && body.r <= m.vw - u * 2 + 0.6 && body.t >= -0.5 && body.b <= m.vh + 0.5, `${tag}: fuera del visor o sin margen (${body.l.toFixed(1)}–${body.r.toFixed(1)} de ${m.vw})`)
  ok(body.w <= max + 0.6, `${tag}: ancho ${body.w.toFixed(1)} > máximo ${max}`)
  ok(m.fs.text >= 12 && (m.fs.kbd === null || m.fs.kbd >= 12) && (m.fs.det === null || m.fs.det >= 12), `${tag}: texto < 12px ${JSON.stringify(m.fs)}`)
  ok(m.clip <= 1, `${tag}: texto recortado (${m.clip}px)`)
}

/* ---------- Pruebas por motor ---------- */
const MATRIX = ['btn', 'a', 'input-ps', 'input-action', 'pass', 'textarea', 'select', 'number', 'cb-field', 'cb-palette', 'date', 'switch', 'checkbox', 'helper', 'file-empty', 'file-files']
const BOXED = { 'input-ps': 'g-input__control', pass: 'g-input__control', textarea: 'g-textarea__control', select: 'g-select__control', number: 'g-input__control', 'cb-field': 'g-input__control', 'cb-palette': 'g-input__control', 'file-empty': 'g-file-field__add', 'file-files': 'g-file-field__add' }
const PLACEMENTS = ['top-start', 'top', 'top-end', 'right-start', 'right', 'right-end', 'bottom-end', 'bottom', 'bottom-start', 'left-end', 'left', 'left-start']
const THEMES = [['defecto', ''], ['auditoría', 'theme=audit'], ['auditoría oscuro', 'theme=audit&dark=1'], ['defecto oscuro', 'dark=1']]
const SLOW = ':root, [data-theme] { --g-duration-press: 1000ms; }'

for (const engine of ENGINES) {
  ENGINE = engine
  const browser = await pw[engine].launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('console', (m) => { const t = m.text(); if (m.type() === 'error' || (m.type() === 'warning' && /Grana|Vue warn/.test(t))) errs.push(`${m.type()}: ${t}`) })
  const t0 = Date.now()

  /* 1 · Matriz y 2 · lados, con tres temas (claro y oscuro) */
  for (const [th, q] of THEMES.slice(0, 3)) {
    await load(page, { q, part: 'matrix' })
    for (const c of MATRIX) {
      const m = await hoverOpen(page, c)
      const tag = `${th} · ${c}`
      if (!m) { ok(false, `${tag}: no abre con el puntero en su caja`); continue }
      if (BOXED[c]) ok(m.boxIsRes === false, `${tag}: el ancla no es la caja visible`)
      ok(m.side === 'bottom', `${tag}: lado ${m.side}`)
      checkShape(m, tag)
      ok(await page.evaluate(() => A.openCount()) === 1, `${tag}: más de un tooltip abierto`)
      if (args.shots && th !== 'defecto') await page.waitForTimeout(250); await page.screenshot({ path: `${SHOTS}/${engine}-${th.replace(' ', '-')}-${c}.png`, clip: { x: Math.max(0, m.box.l - 40), y: Math.max(0, m.box.t - 20), width: Math.min(420, m.vw - Math.max(0, m.box.l - 40)), height: 160 } })
      note(`matriz Δ pestaña (${engine})`, Math.abs(m.tab.w - Math.min(m.box.w, m.body.w)))
    }
    await load(page, { q, part: 'sides' })
    for (const p of PLACEMENTS) {
      const m = await hoverOpen(page, 'side-' + p)
      const [side, align = 'center'] = p.split('-')
      checkShape(m, `${th} · lado ${p}`, { side, align })
      if (m && args.shots) await page.waitForTimeout(250); await page.screenshot({ path: `${SHOTS}/${engine}-${th.replace(' ', '-')}-side-${p}.png`, clip: { x: Math.max(0, m.box.l - 340), y: Math.max(0, m.box.t - 120), width: 720, height: 280 } })
    }
    // 120 px con un nombre corto: etiqueta = pestaña, esquinas del lado de la pestaña rectas
    for (const c of ['w120', 'w120-top']) {
      const m = await hoverOpen(page, c)
      checkShape(m, `${th} · ${c}`)
      if (m) {
        ok(near(m.body.w, m.box.w), `${th} · ${c}: la etiqueta ${m.body.w.toFixed(1)} no mide lo que el control (${m.box.w.toFixed(1)})`)
        const cs = m.side === 'bottom' ? [m.radii.tl[0], m.radii.tr[0]] : [m.radii.bl[0], m.radii.br[0]]
        ok(cs.every((v) => v < 0.6), `${th} · ${c}: esquinas del lado de la pestaña no rectas ${cs}`)
      }
    }
    // block: etiqueta al máximo, pestaña acotada y centrada sobre el control
    {
      const m = await hoverOpen(page, 'block')
      checkShape(m, `${th} · block`)
      if (m) {
        const max = Math.min(m.u * 70, m.vw - m.u * 4)
        ok(near(m.body.w, max, 0.6) && near(m.tab.w, m.body.w, 0.6), `${th} · block: etiqueta ${m.body.w.toFixed(1)} / pestaña ${m.tab.w.toFixed(1)} (máximo ${max})`)
        ok(near((m.tab.l + m.tab.r) / 2, (m.box.l + m.box.r) / 2, 1), `${th} · block: pestaña no centrada sobre el control`)
      }
    }
    // Segunda etapa del relleno (movimiento reducido: aparece sin crecer)
    {
      const m0 = await hoverOpen(page, 'detail-solid')
      await page.waitForFunction(() => A.find('detail-solid').node.hasAttribute('data-dwell'), null, { timeout: 2500 }).catch(() => {})
      await page.waitForTimeout(80)
      const m = await g(page, 'detail-solid')
      ok(m.attrs.includes('data-dwell'), `${th} · detail: sin segunda etapa tras el reposo`)
      checkShape(m, `${th} · detail (segunda etapa)`)
      ok(m0 && near(m.body.t, m0.body.t), `${th} · detail: el borde junto al control se movió`)
      if (args.shots) await page.waitForTimeout(250); await page.screenshot({ path: `${SHOTS}/${engine}-${th.replace(' ', '-')}-detail.png`, clip: { x: Math.max(0, m.box.l - 200), y: Math.max(0, m.box.t - 20), width: 520, height: 200 } })
    }
  }

  /* 3 · Desbordes del visor, RTL y 320 px (tema de auditoría) */
  await load(page, { q: 'theme=audit', part: 'edge' })
  // Lado: el pedido no cabe (o no cabe con su margen en el eje cruzado); anchor.js elige otro. Se mide que la etiqueta
  // quede dentro del visor con su margen y la forma (la pestaña se acota a la parte de la caja que la etiqueta cubre)
  for (const [c, bad] of [['edge-tl', 'top'], ['edge-tr', null], ['edge-bl', 'left'], ['edge-br', 'right']]) {
    const m = await hoverOpen(page, c)
    checkShape(m, `visor · ${c}`)
    if (m) { ok(m.side !== bad, `visor · ${c}: se queda en el lado que no cabe (${m.side})`); note(`visor (${engine})`, `${c}: ${m.side}`) }
    if (m && args.shots) await page.waitForTimeout(250); await page.screenshot({ path: `${SHOTS}/${engine}-${c}.png`, clip: { x: Math.max(0, Math.min(m.box.l, m.body.l) - 10), y: Math.max(0, Math.min(m.box.t, m.body.t) - 10), width: 420, height: 140 } })
  }
  await load(page, { q: 'theme=audit', part: 'rtl' })
  for (const [c, side, align] of [['rtl-a', 'bottom', 'center'], ['rtl-left', 'left', 'center'], ['rtl-bs', 'bottom', 'start'], ['rtl-re', 'right', 'end'], ['rtl-input', 'bottom', undefined]]) {
    const m = await hoverOpen(page, c)
    checkShape(m, `RTL · ${c}`, { side, align })
    if (m && c === 'rtl-left') ok(m.body.l > m.box.r, 'RTL · placement left no abre al lado físico derecho')
    if (m && c === 'rtl-re') ok(m.body.r < m.box.l, 'RTL · placement right no abre al lado físico izquierdo')
    if (m && c === 'rtl-left') ok(/at (0px 0px|0% 0%|left top)/.test(m.before.bg) && /at (0px 100%|0% 100%|left bottom)/.test(m.after.bg), `RTL · curvas de unión sin espejar: ${m.before.bg.slice(0, 70)} / ${m.after.bg.slice(0, 70)}`)
    if (m && args.shots) await page.waitForTimeout(250); await page.screenshot({ path: `${SHOTS}/${engine}-rtl-${c}.png`, clip: { x: Math.max(0, Math.min(m.box.l, m.body.l) - 30), y: Math.max(0, Math.min(m.box.t, m.body.t) - 20), width: 520, height: 200 } })
  }
  for (const [th, q] of [['defecto', ''], ['auditoría', 'theme=audit']]) {
    await load(page, { q, part: 'narrow', w: 320, h: 740 })
    for (const c of ['n-long', 'n-block', 'n-input']) {
      const m = await hoverOpen(page, c)
      checkShape(m, `320px ${th} · ${c}`)
      if (m) note(`320px (${engine})`, `${th} ${c}: ${m.body.l.toFixed(1)}–${m.body.r.toFixed(1)}`)
    }
  }

  /* 4 · Movimiento (tema de auditoría; press a 1000 ms para contar cuadros; luego reducido) */
  for (const motion of ['no-preference', 'reduce']) {
    await load(page, { q: 'theme=audit', part: 'motion', motion, css: SLOW })
    const tag = motion === 'reduce' ? 'reducido' : 'movimiento'
    // Fundido de entrada en frío y data-instant al reabrir
    {
      await page.evaluate(() => A.find('solo').box.scrollIntoView({ block: 'center' }))
      await page.waitForTimeout(700)
      const b = await page.evaluate(() => A.R(A.find('solo').box))
      await page.evaluate(() => { window.__op = []; const n = A.find('solo').node; const f = () => { if (n.matches(':popover-open')) window.__op.push(+getComputedStyle(n).opacity); if (window.__op.length < 12) requestAnimationFrame(f) }; requestAnimationFrame(f) })
      await page.mouse.move(b.l + b.w / 2, b.t + b.h / 2)
      await page.waitForFunction(() => window.__op.length >= 3, null, { timeout: 2500 }).catch(() => {})
      const op = await page.evaluate(() => window.__op)
      const tr = await page.evaluate(() => getComputedStyle(A.find('solo').node).transitionProperty + ' | ' + getComputedStyle(A.find('solo').node).transitionDuration)
      ok(op.length && op[0] < 0.99, `${tag}: entrada en frío sin fundido (${op.slice(0, 3)})`)
      ok(/opacity/.test(tr), `${tag}: sin transición de opacidad (${tr})`)
      await page.mouse.move(3, 3)
      await page.waitForFunction(() => A.openCount() === 0)
      await page.evaluate(() => { window.__op2 = []; const n = A.find('solo').node; const f = () => { if (n.matches(':popover-open')) window.__op2.push([+getComputedStyle(n).opacity, n.hasAttribute('data-instant')]); if (window.__op2.length < 4) requestAnimationFrame(f) }; requestAnimationFrame(f) })
      await page.mouse.move(b.l + b.w / 2, b.t + b.h / 2)
      await page.waitForFunction(() => window.__op2.length >= 2, null, { timeout: 1500 }).catch(() => {})
      const op2 = await page.evaluate(() => window.__op2)
      ok(op2.length && op2[0][1] === true && op2[0][0] >= 0.99, `${tag}: reabrir antes de SKIP no es instantáneo ${JSON.stringify(op2.slice(0, 2))}`)
    }
    // Viaje por relevo en la barra: deshacer → compartir (cuatro controles)
    {
      await closeAll(page)
      await page.waitForTimeout(700)
      const a = await hoverOpen(page, 'bar-undo')
      await page.waitForTimeout(300)
      const dest = await page.evaluate(() => A.R(A.find('bar-share').box))
      await page.evaluate(() => {
        window.__fr = []
        const nodes = [...document.querySelectorAll('.g-tooltip')]
        const target = A.find('bar-share').node
        const t0 = performance.now()
        const f = () => {
          const vis = nodes.filter((n) => n.matches(':popover-open') && +getComputedStyle(n).opacity > 0.01)
          const body = target.querySelector('.g-tooltip__body'), tab = target.querySelector('.g-tooltip__tab')
          window.__fr.push({ vis: vis.length, open: target.matches(':popover-open'), op: +getComputedStyle(target).opacity, body: A.R(body), tab: A.R(tab), travel: target.hasAttribute('data-travel') })
          if (performance.now() - t0 < 1600) requestAnimationFrame(f)
        }
        requestAnimationFrame(f)
      })
      await page.mouse.move(dest.l + dest.w / 2, dest.t + dest.h / 2)
      await page.waitForTimeout(1750)
      const fr = await page.evaluate(() => window.__fr)
      const start = fr.findIndex((f) => f.open)
      const run = fr.slice(start)
      const fin = await g(page, 'bar-share')
      ok(a && start >= 0, `${tag} viaje: no abre el entrante`)
      ok(fr.every((f) => f.vis === 1), `${tag} viaje: cuadros con ${[...new Set(fr.map((f) => f.vis))]} etiquetas visibles`)
      ok(run.length && run[0].op >= 0.99, `${tag} viaje: el entrante entra con fundido (${run[0]?.op})`)
      const xs = run.map((f) => f.body.l)
      const mid = xs.filter((x) => !near(x, xs[0], 0.5) && !near(x, fin.body.l, 0.5)).length
      ok(xs.every((x, i) => i === 0 || x >= xs[i - 1] - 0.3), `${tag} viaje: no monótono`)
      ok(xs.every((x) => x <= fin.body.l + 0.5), `${tag} viaje: rebasa el destino`)
      ok(run.every((f) => f.tab.l >= f.body.l - 0.6 && f.tab.r <= f.body.r + 0.6), `${tag} viaje: la pestaña sale de la etiqueta en algún cuadro`)
      if (motion === 'reduce') ok(mid === 0, `${tag} viaje: ${mid} cuadros intermedios (debe saltar)`)
      else ok(mid >= 8, `${tag} viaje: solo ${mid} cuadros intermedios`)
      note(`viaje (${engine})`, `${tag}: ${run.length} cuadros, ${mid} intermedios`)
      checkShape(fin, `${tag} viaje · llegada`)
      ok(!fin.attrs.includes('data-travel') && !fin.inline, `${tag} viaje: data-travel o inline-size sin retirar`)
    }
    // Segunda etapa: abajo (barra) y arriba
    for (const [c, edge] of [['bar-tag', 't'], ['dwell-top', 'b']]) {
      await closeAll(page)
      await page.waitForTimeout(700)
      const m0 = await hoverOpen(page, c)
      await page.evaluate((c) => {
        window.__fr = []
        const n = A.find(c).node
        const t0 = performance.now()
        const f = () => { window.__fr.push({ body: A.R(n.querySelector('.g-tooltip__body')), dwell: n.hasAttribute('data-dwell') }); if (performance.now() - t0 < 2400) requestAnimationFrame(f) }
        requestAnimationFrame(f)
      }, c)
      await page.waitForTimeout(2500)
      const fr = await page.evaluate(() => window.__fr)
      const fin = await g(page, c)
      ok(fin.attrs.includes('data-dwell'), `${tag} ${c}: sin segunda etapa`)
      ok(fr.every((f) => near(f.body[edge], m0.body[edge], 0.5)), `${tag} ${c}: el borde junto al control se mueve (${Math.max(...fr.map((f) => Math.abs(f.body[edge] - m0.body[edge]))).toFixed(2)}px)`)
      const hs = fr.map((f) => f.body.h)
      const mid = hs.filter((h) => !near(h, m0.body.h, 0.3) && !near(h, fin.body.h, 0.3)).length
      ok(hs.every((h, i) => i === 0 || h >= hs[i - 1] - 0.3), `${tag} ${c}: el alto no crece de forma monótona`)
      if (motion === 'reduce') ok(mid === 0, `${tag} ${c}: crece en ${mid} cuadros (debe aparecer sin crecer)`)
      else ok(mid >= 8, `${tag} ${c}: solo ${mid} cuadros de crecimiento`)
      ok(fin.side === (c === 'dwell-top' ? 'top' : 'bottom'), `${tag} ${c}: cambió de lado (${fin.side})`)
      checkShape(fin, `${tag} ${c} final`)
    }
  }

  /* 5 · Accesibilidad */
  // Contraste: cuatro temas en todos los motores; los generados (claro y oscuro) en Chromium
  const contrastThemes = THEMES.concat(engine === 'chromium' ? GEN.flatMap((n) => [[n, `theme=${n}`], [n + ' oscuro', `theme=${n}&dark=1`]]) : [])
  let minC = Infinity
  for (const [th, q] of contrastThemes) {
    await load(page, { q, part: 'sides' })
    await hoverOpen(page, 'detail-solid')
    await page.waitForFunction(() => A.find('detail-solid').node.hasAttribute('data-dwell'), null, { timeout: 2500 }).catch(() => {})
    await page.waitForTimeout(200)
    const k = await page.evaluate(() => A.contrast('detail-solid'))
    ok(k.name >= 4.5 && k.det >= 4.5 && k.kbd >= 4.5, `contraste ${th}: texto ${JSON.stringify(k)}`)
    ok(k.kbdBorder >= 3 && k.tab >= 3 && k.body >= 3, `contraste ${th}: atajo/pestaña/etiqueta frente a la página ${JSON.stringify(k)}`)
    minC = Math.min(minC, k.name, k.det, k.kbd, k.tab)
    if (args.verbose) console.log(engine, th, JSON.stringify(k))
  }
  note(`contraste mínimo (${engine})`, minC)

  // 1.4.13 y foco por navegación (tema de auditoría, sin movimiento)
  await load(page, { q: 'theme=audit', part: 'motion' })
  {
    const TAB = engine === 'webkit' ? 'Alt+Tab' : 'Tab'
    await page.evaluate(() => A.find('solo').box.scrollIntoView({ block: 'center' }))
    // Foco por clic: no abre
    await page.click('[data-case="solo"]')
    await page.waitForTimeout(500)
    ok(await page.evaluate(() => A.openCount()) === 0, 'foco: el clic abre el tooltip')
    await page.mouse.move(3, 3)
    await page.waitForTimeout(700)
    // Foco por programa: no abre
    await page.evaluate(() => { document.activeElement.blur(); A.find('solo').res.focus() })
    await page.waitForTimeout(500)
    ok(await page.evaluate(() => A.openCount()) === 0, 'foco: el foco por programa abre el tooltip')
    // Tab desde el control anterior: abre; Esc cierra sin mover el foco
    await page.evaluate(() => document.querySelector('[data-case="plain"]').focus())
    await page.keyboard.press(TAB)
    await page.waitForTimeout(100)
    const st = await page.evaluate(() => ({ open: A.find('solo').node.matches(':popover-open'), active: document.activeElement === A.find('solo').res }))
    ok(st.active && st.open, `foco: Tab no abre (${JSON.stringify(st)})`)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)
    const st2 = await page.evaluate(() => ({ open: A.openCount(), active: document.activeElement === A.find('solo').res }))
    ok(st2.open === 0 && st2.active, `1.4.13: Esc ${JSON.stringify(st2)}`)
    await page.evaluate(() => document.activeElement.blur())
    // Puente: el puntero baja del control a la etiqueta cruzando la pestaña, se queda; persiste
    const m = await hoverOpen(page, 'solo')
    const x = (m.tab.l + m.tab.r) / 2
    const y0 = m.box.t + m.box.h / 2, y1 = m.body.t + m.body.h / 2
    let closed = false
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(x, y0 + ((y1 - y0) * i) / 12)
      await page.waitForTimeout(30)
      if (!(await page.evaluate(() => A.find('solo').node.matches(':popover-open')))) closed = true
    }
    ok(!closed, '1.4.13: el puntero que cruza por la pestaña cierra la etiqueta')
    await page.waitForTimeout(2000)
    ok(await page.evaluate(() => A.find('solo').node.matches(':popover-open')), '1.4.13: no persiste con el puntero en la etiqueta')
    ok(await page.evaluate(() => getComputedStyle(A.find('solo').node).userSelect !== 'none'), '1.4.13: el texto de la etiqueta no se puede seleccionar')
    await page.mouse.move(m.box.l + m.box.w / 2, y0)
    await page.waitForTimeout(3000)
    ok(await page.evaluate(() => A.find('solo').node.matches(':popover-open')), '1.4.13: no persiste con el puntero quieto en el control')
  }

  // forced-colors emulado
  {
    let supported = true
    await load(page, { q: 'theme=audit', part: 'motion' })
    try { await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' }) } catch { supported = false }
    supported = supported && (await page.evaluate(() => matchMedia('(forced-colors: active)').matches))
    if (supported) {
      const m = await hoverOpen(page, 'solo')
      const f = await page.evaluate(() => {
        const n = A.find('solo').node, tab = n.querySelector('.g-tooltip__tab'), body = n.querySelector('.g-tooltip__body')
        const t = getComputedStyle(tab), b = getComputedStyle(body)
        return { tbl: t.borderLeftWidth, tbr: t.borderRightWidth, tc: t.borderLeftColor, tbg: t.backgroundColor, bc: b.borderTopColor, before: getComputedStyle(n, '::before').content, ct: A.sys('CanvasText'), cv: A.sys('Canvas', 'backgroundColor') }
      })
      ok(m && parseFloat(f.tbl) >= 1 && parseFloat(f.tbr) >= 1 && f.tc === f.ct && f.tbg === f.cv, `forced-colors: pestaña sin sus lados en CanvasText ${JSON.stringify(f)}`)
      ok(f.bc === f.ct && f.before === 'none', `forced-colors: etiqueta sin borde CanvasText o con curvas ${JSON.stringify(f)}`)
      ok(await page.evaluate(() => A.ratio(A.parse(A.sys('CanvasText')), A.parse(A.sys('Canvas', 'backgroundColor')))) >= 3, 'forced-colors: lados de la pestaña < 3:1')
      if (args.shots && m) await page.waitForTimeout(250); await page.screenshot({ path: `${SHOTS}/${engine}-forced.png`, clip: { x: Math.max(0, m.box.l - 60), y: Math.max(0, m.box.t - 20), width: 260, height: 120 } })
    } else note('forced-colors', `${engine}: no se emula (no medido)`)
  }

  // Táctil emulado
  {
    let tctx = null
    try { tctx = await browser.newContext({ viewport: { width: 800, height: 900 }, hasTouch: true, isMobile: engine !== 'firefox' }) } catch { tctx = null }
    if (tctx) {
      const tp = await tctx.newPage()
      tp.on('pageerror', (e) => errs.push('pageerror (táctil): ' + e.message))
      await load(tp, { q: 'theme=audit', part: 'matrix' })
      const coarse = await tp.evaluate(() => matchMedia('(pointer: coarse)').matches)
      if (coarse) {
        for (const c of MATRIX) {
          const u = await tp.evaluate((c) => {
            const f = A.find(c)
            const us = (e) => { const s = getComputedStyle(e); return s.userSelect || s.webkitUserSelect }
            const call = (e) => (CSS.supports('-webkit-touch-callout', 'none') ? getComputedStyle(e).getPropertyValue('-webkit-touch-callout') : 'none')
            return { res: us(f.res), field: /^(input|textarea)$/.test(f.res.localName), box: f.box === f.res ? null : us(f.box), call: call(f.box), callRes: call(f.res) }
          }, c)
          // Regla de coco: cualquier input o textarea conserva su selección (casillas y file no tienen texto que seleccionar)
          ok(u.field ? u.res !== 'none' : u.res === 'none', `táctil ${c}: user-select del control ${u.res}`)
          ok(u.box === null || u.box === 'none', `táctil ${c}: la caja visible se puede seleccionar (${u.box})`)
          ok(u.call === 'none' && u.callRes === 'none', `táctil ${c}: -webkit-touch-callout ${u.call}/${u.callRes}`)
        }
      } else note('táctil', `${engine}: (pointer: coarse) no se emula (selección no medida)`)
      // Pulsación larga sintética (pointerType touch): abre a ~500 ms, soltar no activa; toque corto activa sin tooltip
      await load(tp, { q: 'theme=audit', part: 'motion' })
      const lp = await tp.evaluate(async () => {
        const f = A.find('solo')
        f.box.scrollIntoView({ block: 'center' })
        let clicks = 0
        f.res.addEventListener('click', () => clicks++)
        const r = A.R(f.box), x = r.l + r.w / 2, y = r.t + r.h / 2
        const ev = (t) => f.box.dispatchEvent(new PointerEvent(t, { pointerType: 'touch', bubbles: true, composed: true, clientX: x, clientY: y, isPrimary: true, pointerId: 7 }))
        const wait = (ms) => new Promise((s) => setTimeout(s, ms))
        ev('pointerdown'); await wait(300)
        const at300 = f.node.matches(':popover-open')
        await wait(350)
        const at650 = f.node.matches(':popover-open'), touch = f.node.hasAttribute('data-touch')
        ev('pointerup'); f.res.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y }))
        await wait(1200)
        const after = f.node.matches(':popover-open')
        const c1 = clicks
        await wait(2000)
        // Toque corto
        ev('pointerdown'); await wait(80); ev('pointerup'); f.res.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y }))
        await wait(700)
        return { at300, at650, touch, after, c1, c2: clicks, tapOpen: f.node.matches(':popover-open') }
      })
      ok(!lp.at300 && lp.at650 && lp.touch, `táctil: la pulsación larga no muestra el nombre a ~500 ms ${JSON.stringify(lp)}`)
      ok(lp.c1 === 0, `táctil: soltar tras la pulsación larga activa el control ${JSON.stringify(lp)}`)
      ok(lp.after, `táctil: no queda el tiempo de lectura ${JSON.stringify(lp)}`)
      ok(lp.c2 === 1 && !lp.tapOpen, `táctil: el toque corto no activa o muestra el tooltip ${JSON.stringify(lp)}`)
      await tctx.close()
    } else note('táctil', `${engine}: contexto táctil no disponible`)
  }

  /* 6 · #383 en componentes reales: con tooltip frente a sin él, cerrado y abierto */
  for (const [th, q] of [['defecto', ''], ['auditoría', 'theme=audit']]) {
    await load(page, { q, part: 'x383' })
    const PAIRS = [['input', 'x-action'], ['group', 'x-part'], ['group-warn', 'x-part-warn'], ['row', 'x-row'], ['adapt', 'x-adapt'], ['card', 'x-meta']]
    for (const [x, c] of PAIRS) {
      await closeAll(page)
      const [a, b] = await page.evaluate((x) => { const [l, r] = document.querySelector(`[data-x="${x}"]`).children; return [A.snap(l), A.snap(r)] }, x)
            // Δ ≤ 0,05 px en las cajas (las dos columnas caen en posiciones fraccionarias distintas); el resto, idéntico
      const same = (v, w) => v.length === w.length && v.every((z, k) => (typeof z === 'number' ? Math.abs(z - w[k]) <= 0.05 : z === w[k]))
      const diff = a.length !== b.length ? `${a.length} frente a ${b.length} elementos` : a.map((v, i) => (same(v, b[i]) ? null : `${v[0]}: ${JSON.stringify(v.filter((z, k) => z !== b[i][k]))} ≠ ${JSON.stringify(b[i].filter((z, k) => z !== v[k]))}`)).filter(Boolean)[0]
      ok(!diff, `#383 ${th} · ${x}: con tooltip ≠ sin él (${diff})`)
      // Abierto (sin colores: el control bajo el puntero cambia de fondo)
      const before = await page.evaluate((x) => A.snap(document.querySelector(`[data-x="${x}"]`).children[0], false), x)
      const m = await hoverOpen(page, c)
      ok(Boolean(m), `#383 ${th} · ${x}: el tooltip no abre`)
      const after = await page.evaluate((x) => A.snap(document.querySelector(`[data-x="${x}"]`).children[0], false), x)
      ok(JSON.stringify(before) === JSON.stringify(after), `#383 ${th} · ${x}: abrir el tooltip mueve algo`)
      if (m) checkShape(m, `#383 ${th} · ${c}`)
    }
    // Acciones de GCard (narrow) con dos tooltips: abrir el segundo
    {
      const m = await hoverOpen(page, 'x-card-b')
      checkShape(m, `#383 ${th} · x-card-b`)
    }
    // GDialog: último control con tooltip frente a sin él
    const dlgSnap = async (open, c) => {
      await page.click(`[data-case="${open}"]`)
      await page.waitForFunction((c) => { const e = document.querySelector(`[data-case="${c}"]`); return e && e.closest('dialog')?.open }, c)
      await page.waitForTimeout(500)
      return page.evaluate((c) => {
        const e = document.querySelector(`[data-case="${c}"]`)
        const body = e.closest('.g-dialog__body')
        const panel = e.closest('dialog')
        return { snap: A.snap(body, false), mb: getComputedStyle(e).marginBlockEnd, h: +A.R(panel.firstElementChild || panel).h.toFixed(2), bh: +A.R(body).h.toFixed(2) }
      }, c)
    }
    const d1 = await dlgSnap('dlg-open-tt', 'dlg-last-tt')
    const mm = await hoverOpen(page, 'dlg-last-tt')
    const d1o = await page.evaluate(() => { const e = document.querySelector('[data-case="dlg-last-tt"]'); return { snap: A.snap(e.closest('.g-dialog__body'), false), bh: +A.R(e.closest('.g-dialog__body')).h.toFixed(2) } })
    ok(Boolean(mm), `#383 ${th} · GDialog: el tooltip del último control no abre`)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)
    if (await page.evaluate(() => A.openCount())) await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => ![...document.querySelectorAll('dialog')].some((d) => d.open), null, { timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(400)
    const d2 = await dlgSnap('dlg-open', 'dlg-last')
    ok(d1.mb === '0px' && d2.mb === '0px', `#383 ${th} · GDialog: margen final del último control ${d1.mb} / ${d2.mb}`)
    ok(JSON.stringify(d1.snap) === JSON.stringify(d2.snap) && d1.bh === d2.bh && d1.h === d2.h, `#383 ${th} · GDialog: con tooltip ≠ sin él (${d1.bh}/${d2.bh}, ${d1.h}/${d2.h})`)
    ok(JSON.stringify(d1.snap) === JSON.stringify(d1o.snap) && d1.bh === d1o.bh, `#383 ${th} · GDialog: abrir el tooltip mueve el cuerpo`)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }

  /* 7 · Consola */
  ok(!errs.length, `consola: ${errs.slice(0, 3).join(' | ')}`)
  note('tiempo', `${engine}: ${((Date.now() - t0) / 1000).toFixed(0)} s`)
  await browser.close()
}
server.close()

for (const [k, v] of Object.entries(measures)) {
  const nums = v.filter((x) => typeof x === 'number')
  console.log(`· ${k}: ${nums.length === v.length ? `máx ${Math.max(...nums).toFixed(3)} · mín ${Math.min(...nums).toFixed(3)}` : v.join(' | ')}`)
}
for (const [e, r] of Object.entries(perEngine)) console.log(`${e}: ${r.total - r.failed}/${r.total}`)
console.log(fails.length ? `\nFALLOS (${fails.length}):\n` + fails.slice(0, 80).join('\n') : '')
console.log(`\nGTooltip auditoría: ${total - failed}/${total}`)
process.exit(failed ? 1 : 0)
