// Verificación de coco sobre el banco de GIcon público (design/lab/icons/estilo-banco.html), con el CSS real:
// flip-rtl (solo en RTL efectivo, también heredado; se compone con transform y rotate del hueco; nunca sin la clase),
// tamaños (1em, clase de la aplicación, alias del hueco), nombre accesible de decorativo y con label, y el hueco __lead
// de GFormSection (alineado con la primera línea del título ±1px en una y varias líneas, tamaño = título, RTL, sin icono
// no deja rastro), contraste del lead en claro y oscuro con el tema por defecto, el «Tema de prueba» y los diez generados,
// 320px sin desplazamiento horizontal y consola limpia.
// Ejecutar desde la raíz del repo: node design/lab/icons/estilo-verificar.mjs   (usa el Playwright de design/lab/theme-playground)
// Opcional: --engines=chromium,firefox,webkit
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
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/icons/estilo-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify']
let total = 0, failed = 0
const fails = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const near = (a, b, t = 1) => Math.abs(a - b) <= t

/* ---------- En la página ---------- */
const probe = () => {
  const px = parseFloat
  const R = (el) => el.getBoundingClientRect()
  const c = (k) => document.querySelector(`[data-case="${k}"]`)
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (s) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = s; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
  const bgOf = (el) => {
    const layers = []
    for (let n = el; n; n = n.parentElement) { const k = rgba(getComputedStyle(n).backgroundColor); if (k[3] > 0) { layers.push(k); if (k[3] >= 1) break } }
    let base = rgba(getComputedStyle(document.documentElement).backgroundColor); if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (k) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(k[0]) + 0.7152 * f(k[1]) + 0.0722 * f(k[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const out = { icons: {}, sections: {} }
  // Iconos sueltos
  for (const d of document.querySelectorAll('[data-case]:not([data-case^="s-"])')) {
    const cs = getComputedStyle(d)
    out.icons[d.dataset.case] = { w: +R(d).width.toFixed(2), h: +R(d).height.toFixed(2), fs: px(cs.fontSize), scale: cs.scale, rotate: cs.rotate, transform: cs.transform, role: d.getAttribute('role'), label: d.getAttribute('aria-label'), hidden: d.getAttribute('aria-hidden'), color: cs.color, parentColor: getComputedStyle(d.parentElement).color }
  }
  // Secciones
  for (const s of document.querySelectorAll('[data-case^="s-"]')) {
    const lead = s.querySelector('.g-form-section__lead'); const title = s.querySelector('.g-form-section__title')
    const heading = s.querySelector('.g-form-section__heading'); const desc = s.querySelector('.g-form-section__description')
    const tcs = getComputedStyle(title); const lh = px(tcs.lineHeight)
    const o = { secLeft: R(s).left, secRight: R(s).right, hasLead: !!lead, titleLines: Math.round(R(title).height / lh), titleTop: R(title).top, titleLeft: R(title).left, titleRight: R(title).right, lh, tfs: px(tcs.fontSize), headingTop: R(heading).top, headingH: R(heading).height, tag: title.tagName, titleHasIcon: !!title.querySelector('svg'), firstChild: heading.firstElementChild.className }
    if (desc) o.descLeft = R(desc).left, o.descRight = R(desc).right
    if (lead) {
      const ic = lead.querySelector('.g-icon'); const lcs = getComputedStyle(lead); const dir = getComputedStyle(heading).direction
      o.lead = { aria: lead.getAttribute('aria-hidden'), w: R(lead).width, h: R(lead).height, top: R(lead).top, left: R(lead).left, right: R(lead).right, iw: R(ic).width, ih: R(ic).height, icy: R(ic).top + R(ic).height / 2, icx: R(ic).left + R(ic).width / 2, color: lcs.color, tabindex: ic.getAttribute('tabindex'), dir }
      const bg = bgOf(lead); o.lead.contrast = +ratio(over(rgba(lcs.color), bg), bg).toFixed(2)
      o.lead.titleStartGap = dir === 'rtl' ? +(R(lead).left - R(title).right).toFixed(2) : +(R(title).left - R(lead).right).toFixed(2)
      o.lead.gapWanted = px(getComputedStyle(heading).columnGap)
    }
    out.sections[s.dataset.case] = o
  }
  out.overflow = { doc: document.documentElement.scrollWidth, vw: innerWidth }
  out.space = px(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')) || null
  return out
}

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('requestfailed', (r) => errors.push('red: ' + r.url()))
  const go = async (qs) => { await page.goto(BASE + qs); await page.evaluate(() => document.fonts.ready); return page.evaluate(probe) }
  const E = engine + ' · '

  /* 1 · Todos los temas, claro y oscuro: contraste del lead y alineación */
  const configs = [['defecto', ''], ['defecto', 'dark=1'], ['prueba', 'test=1'], ...GEN.flatMap((t) => [[t, `theme=${t}`], [t, `theme=${t}&dark=1`]])]
  let base
  for (const [name, qs] of configs) {
    const m = await go('?' + qs)
    if (!base) base = m
    const tag = `${E}${name}${qs.includes('dark') ? ' oscuro' : ''}`
    for (const [k, s] of Object.entries(m.sections)) {
      if (!s.hasLead) continue
      const cy = s.titleTop + s.lh / 2
      ok(near(s.lead.icy, cy, 1), `${tag}: ${k} icono centrado en la primera línea del título (icono ${s.lead.icy.toFixed(1)} vs línea ${cy.toFixed(1)})`)
      ok(near(s.lead.top, s.titleTop, 1), `${tag}: ${k} el hueco arranca donde el título (${s.lead.top.toFixed(1)} vs ${s.titleTop.toFixed(1)})`)
      ok(s.lead.contrast >= 3, `${tag}: ${k} contraste del lead ${s.lead.contrast} ≥ 3`)
      ok(near(s.lead.iw, s.tfs, 0.5) && near(s.lead.ih, s.tfs, 0.5), `${tag}: ${k} icono = tamaño del título (${s.lead.iw}×${s.lead.ih} vs ${s.tfs})`)
    }
    if (qs.includes('dark')) ok(m.icons['ltr-chev-flip'].scale === 'none', `${tag}: flip no se activa en LTR`)
  }

  /* 2 · Tema por defecto claro: detalle */
  const m = base
  const I = m.icons, S = m.sections
  // tamaños
  ok(near(I['deco-14'].w, 14, 0.1) && near(I['deco-16'].w, 16, 0.1) && near(I['deco-24'].w, 24, 0.1), `${E}1em en 14/16/24px (${I['deco-14'].w}, ${I['deco-16'].w}, ${I['deco-24'].w})`)
  ok(near(I['deco-24'].h, 24, 0.1), `${E}alto = 1em`)
  ok(I['app-class'].w === 48, `${E}clase de la aplicación gana al :where (${I['app-class'].w})`)
  ok(near(I['slot-big'].w, 8 * 4, 0.1) || I['slot-big'].w > 24, `${E}alias del hueco manda (${I['slot-big'].w})`)
  ok(I['deco-24'].color === 'rgb(11, 99, 206)' || I['deco-24'].color !== I['deco-14'].color, `${E}hereda currentColor del contenedor`)
  ok(I['deco-16'].color === I['deco-16'].parentColor, `${E}currentColor = color del texto`)
  // árbol accesible
  ok(I['deco-16'].hidden === 'true' && !I['deco-16'].role && !I['deco-16'].label, `${E}decorativo: aria-hidden y sin role/label`)
  ok(I['label-1'].role === 'img' && I['label-1'].label === 'Bloqueado' && I['label-1'].hidden === null, `${E}con label: role=img, aria-label, sin aria-hidden`)
  // flip: LTR
  for (const k of ['ltr-chev-flip', 'ltr-chev-plain', 'ltr-arrow-flip', 'ltr-check-flip']) ok(I[k].scale === 'none', `${E}${k}: sin espejo en LTR (scale=${I[k].scale})`)
  // RTL: solo con la clase
  for (const k of ['rtl-chev-flip', 'rtl-arrow-flip', 'rtl-check-flip']) ok(I[k].scale === '-1' || I[k].scale === '-1 1', `${E}${k}: espejado en RTL (scale=${I[k].scale})`)
  ok(I['rtl-chev-plain'].scale === 'none', `${E}rtl-chev-plain: sin la clase no se espeja (scale=${I['rtl-chev-plain'].scale})`)
  // dirección efectiva heredada
  ok(I['mixed-ltr'].scale === 'none', `${E}RTL → LTR local: no espeja (${I['mixed-ltr'].scale})`)
  ok(I['mixed-rtl'].scale === '-1' || I['mixed-rtl'].scale === '-1 1', `${E}RTL del antecesor: espeja (${I['mixed-rtl'].scale})`)
  // composición con el giro del hueco
  ok(I['compose-transform'].transform.startsWith('matrix(') && I['compose-transform'].transform !== 'none' && (I['compose-transform'].scale === '-1' || I['compose-transform'].scale === '-1 1'), `${E}transform del hueco intacto y scale activo (${I['compose-transform'].transform} / ${I['compose-transform'].scale})`)
  ok(I['compose-rotate'].rotate === '90deg' && (I['compose-rotate'].scale === '-1' || I['compose-rotate'].scale === '-1 1'), `${E}rotate del hueco intacto y scale activo (${I['compose-rotate'].rotate} / ${I['compose-rotate'].scale})`)
  ok(I['btn-ltr'].scale === 'none' && (I['btn-rtl'].scale === '-1' || I['btn-rtl'].scale === '-1 1'), `${E}GBtn append: LTR sin espejo, RTL con espejo`)
  ok(I['btn-ltr'].w === I['btn-rtl'].w && near(I['btn-ltr'].w, I['btn-ltr'].fs * 1.15, 0.1), `${E}GBtn append: --_icon = 1.15em del texto del botón (${I['btn-ltr'].w}px vs ${I['btn-ltr'].fs}px, #205) y espejado o no mide lo mismo`)

  // lead
  ok(!S['s-none'].hasLead && S['s-none'].firstChild.includes('title'), `${E}sin lead: no existe el elemento y el título abre la fila`)
  ok(S['s-lead'].hasLead && S['s-lead'].lead.aria === 'true' && !S['s-lead'].titleHasIcon && S['s-lead'].tag === 'H3', `${E}lead aria-hidden, fuera del hN`)
  ok(S['s-lead'].lead.tabindex === null, `${E}el icono del lead no es enfocable`)
  ok(near(S['s-lead'].titleLeft - S['s-lead'].lead.right, S['s-lead'].lead.gapWanted, 0.5), `${E}separación lead → título = gap del heading (${S['s-lead'].lead.titleStartGap} vs ${S['s-lead'].lead.gapWanted})`)
  ok(near(S['s-lead'].lead.h, S['s-lead'].lh, 0.5), `${E}hueco = interlineado del título (${S['s-lead'].lead.h} vs ${S['s-lead'].lh})`)
  ok(near(S['s-lead'].headingH, S['s-none'].headingH, 0.5), `${E}con lead el encabezado no crece (${S['s-lead'].headingH} vs ${S['s-none'].headingH})`)
  ok(near(S['s-lead'].descLeft - S['s-lead'].secLeft, 0, 0.1) && near(S['s-none'].descLeft - S['s-none'].secLeft, 0, 0.1), `${E}la descripción sigue a sangre de la sección con y sin lead`)
  ok(S['s-long'].titleLines >= 3 && near(S['s-long'].lead.top, S['s-long'].titleTop, 1), `${E}título de ${S['s-long'].titleLines} líneas: lead en la primera`)
  ok(S['s-long'].lead.left < S['s-long'].titleLeft, `${E}título largo: no salta a otra fila (lead y título comparten fila)`)
  ok(S['s-long-badge'].titleLines >= 2 && near(S['s-long-badge'].lead.top, S['s-long-badge'].titleTop, 1), `${E}título largo con insignia: lead en la primera línea`)
  ok(S['s-full'].hasLead && near(S['s-full'].lead.icy, S['s-full'].titleTop + S['s-full'].lh / 2, 1), `${E}lead + insignia + acciones: alineado`)
  // RTL
  ok(S['s-rtl'].lead.dir === 'rtl' && S['s-rtl'].lead.right > S['s-rtl'].titleRight, `${E}RTL: el lead va a la derecha (inicio) del título`)
  ok(S['s-rtl'].lead.titleStartGap >= 0 && near(S['s-rtl'].lead.titleStartGap, S['s-rtl'].lead.gapWanted, 0.5), `${E}RTL: separación = gap (${S['s-rtl'].lead.titleStartGap})`)
  ok(near(S['s-rtl'].lead.icy, S['s-rtl'].titleTop + S['s-rtl'].lh / 2, 1), `${E}RTL: alineado con la primera línea`)
  ok(!S['s-b'].hasLead && near(S['s-b'].titleLeft, S['s-a'].lead.left, 0.5) , `${E}sección sin lead sigue alineada con la anterior que lo tiene por el borde de inicio`)

  /* 3 · Escalas y densidad de texto: el lead sigue al título en un tema con otra escala (Tema de prueba: space 5) */
  // (cubierto en el bucle de temas: tamaño = título y alineación ±1px)

  /* 4 · Otros anchos y RTL global */
  for (const w of [320, 375]) {
    await page.setViewportSize({ width: w, height: 800 })
    const mm = await go('')
    ok(mm.overflow.doc <= mm.overflow.vw, `${E}${w}px sin desplazamiento horizontal (${mm.overflow.doc} > ${mm.overflow.vw})`)
    for (const [k, s] of Object.entries(mm.sections)) if (s.hasLead) ok(near(s.lead.icy, s.titleTop + s.lh / 2, 1), `${E}${w}px ${k}: lead alineado`)
  }
  await page.setViewportSize({ width: 1280, height: 900 })
  const mr = await go('?rtl=1')
  ok(['ltr-chev-flip', 'ltr-chev-plain'].every((k) => mr.icons[k].scale === 'none'), `${E}RTL global: los hosts dir="ltr" locales no espejan`)
  ok(mr.icons['btn-ltr'].scale === '-1' || mr.icons['btn-ltr'].scale === '-1 1', `${E}RTL global: GBtn append espejado`)
  ok(mr.sections['s-lead'].lead.dir === 'rtl' && near(mr.sections['s-lead'].lead.icy, mr.sections['s-lead'].titleTop + mr.sections['s-lead'].lh / 2, 1), `${E}RTL global: lead alineado`)

  /* 5 · forced-colors: el icono usa currentColor (CanvasText del contenedor) */
  if (engine === 'chromium') {
    const ctx = await browser.newContext({ forcedColors: 'active', viewport: { width: 1280, height: 900 } })
    const p2 = await ctx.newPage(); await p2.goto(BASE); await p2.evaluate(() => document.fonts.ready)
    const fc = await p2.evaluate(() => { const l = document.querySelector('[data-case="s-lead"] .g-form-section__lead'); const i = l.querySelector('.g-icon'); return { stroke: getComputedStyle(i).stroke, color: getComputedStyle(l).color } })
    ok(fc.stroke === fc.color, `${E}forced-colors: el trazo sigue a currentColor (${fc.stroke} vs ${fc.color})`)
    await ctx.close()
  }

  ok(errors.length === 0, `${E}consola limpia (${errors.join(' | ')})`)
  await browser.close()
}
server.close()

console.log(`${total - failed}/${total}`)
if (failed) { console.log(fails.map((f) => ' · ' + f).join('\n')); process.exit(1) }
