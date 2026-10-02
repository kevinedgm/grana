// Verificación de coco sobre el banco de GDivider (design/lab/divider/estilo-banco.html), con el CSS real.
// Contraste medido (línea subtle y strong, texto) sobre surface y surface-sunken en claro y oscuro, con el tema por defecto,
// el «Tema de prueba» y los diez temas generados; alto del vertical; inset; texto largo; RTL; 320px; forced-colors;
// prefers-contrast; escalas fraccionarias; reseteo del <hr>; coherencia de tono con GDialog; consola limpia.
// Ejecutar desde la raíz del repo: node design/lab/divider/estilo-verificar.mjs   (usa el Playwright de design/lab/theme-playground)
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
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/divider/estilo-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify']
let total = 0, failed = 0
const fails = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }

/* ---------- En la página: colores compuestos y contraste ---------- */
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
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const out = {}
  for (const d of document.querySelectorAll('[data-case]')) {
    const labeled = d.classList.contains('g-divider--labeled')
    const vertical = d.classList.contains('g-divider--orientation-vertical')
    const cs = getComputedStyle(d, labeled ? '::before' : null)
    const lineColor = parse(vertical ? cs.borderInlineStartColor || cs.borderLeftColor : cs.borderTopColor)
    const bg = bgOf(d)
    const r = { line: +ratio(over(lineColor, bg), bg).toFixed(2) }
    if (labeled) { const l = d.querySelector('.g-divider__label'); r.text = +ratio(over(parse(getComputedStyle(l).color), bg), bg).toFixed(2) }
    out[d.dataset.case] = r
  }
  // Referencia del hallazgo 7: border y border-strong contra la superficie (GMenu usa border-strong)
  const probe = document.createElement('div'); probe.style.cssText = 'background:var(--g-color-surface)'; document.body.append(probe)
  const s = parse(getComputedStyle(probe).backgroundColor)
  for (const t of ['border', 'border-strong', 'border-control']) { probe.style.color = `var(--g-color-${t})`; out['ref-' + t] = { line: +ratio(over(parse(getComputedStyle(probe).color), s), s).toFixed(2) } }
  probe.remove()
  return out
}

/* ---------- En la página: geometría ---------- */
const geometry = () => {
  const q = (c) => document.querySelector(`[data-case="${c}"]`)
  const R = (el) => el.getBoundingClientRect()
  const px = (v) => parseFloat(v)
  const inset = px(getComputedStyle(q('inset-both')).marginInlineStart)
  const bw = px(getComputedStyle(document.documentElement).getPropertyValue('--g-border-width'))
  const content = (el) => { const cs = getComputedStyle(el); return R(el).height - px(cs.paddingTop) - px(cs.paddingBottom) - px(cs.borderTopWidth) - px(cs.borderBottomWidth) }
  const g = { inset, bw }
  for (const c of ['v-sm', 'v-md', 'v-md-both', 'v-lg', 'v-grid', 'rtl-v']) {
    const d = q(c); const row = d.parentElement; const mb = px(getComputedStyle(d).marginTop) + px(getComputedStyle(d).marginBottom)
    g[c] = { h: +R(d).height.toFixed(2), expect: +(content(row) - mb).toFixed(2), w: +R(d).width.toFixed(2), cls: d.className, top: +(R(d).top - R(row).top).toFixed(2) }
  }
  const stackBox = (d) => { const p = d.parentElement; const r = R(p); const cs = getComputedStyle(p); return { l: r.left + px(cs.paddingLeft) + px(cs.borderLeftWidth), r: r.right - px(cs.paddingRight) - px(cs.borderRightWidth) } }
  for (const c of ['inset-none', 'inset-both', 'inset-start', 'rtl-start', 'simple', 'subtle-surface']) {
    const d = q(c); const b = stackBox(d); const r = R(d)
    g[c] = { dl: +(r.left - b.l).toFixed(2), dr: +(b.r - r.right).toFixed(2), h: +r.height.toFixed(2) }
  }
  // Lista con icono: la línea empieza donde el texto (LTR)
  const nav = q('nav-start'); const link = document.querySelector('#navlist a'); const txt = document.createRange(); txt.selectNodeContents(link.lastChild)
  g.nav = { lineStart: +R(nav).left.toFixed(2), textStart: +txt.getBoundingClientRect().left.toFixed(2) }
  // Texto
  for (const c of ['label-surface', 'label-long', 'rtl-label']) {
    const d = q(c); const l = d.querySelector('.g-divider__label'); const b = getComputedStyle(d, '::before'); const a = getComputedStyle(d, '::after')
    g[c] = {
      center: +((R(l).left + R(l).right) / 2 - (R(d).left + R(d).right) / 2).toFixed(2),
      before: px(b.width), after: px(a.width), min: px(b.minWidth),
      clipped: l.scrollWidth > l.clientWidth + 1 || d.scrollWidth > d.clientWidth + 1,
      lines: Math.round(R(l).height / px(getComputedStyle(l).lineHeight)),
      fs: px(getComputedStyle(l).fontSize), fw: getComputedStyle(l).fontWeight, bg: getComputedStyle(l).backgroundColor,
      gap: px(getComputedStyle(d).columnGap),
    }
  }
  // Reseteo del <hr>
  const hr = q('simple'); const hs = getComputedStyle(hr)
  g.hr = { m: [hs.marginTop, hs.marginBottom, hs.marginLeft, hs.marginRight].join(' '), ov: hs.overflow, b: [hs.borderTopWidth, hs.borderRightWidth, hs.borderBottomWidth, hs.borderLeftWidth].join(' '), style: hs.borderTopStyle, h: R(hr).height }
  // Tono frente a GDialog: sección, pie y divider del cuerpo
  const sec = document.querySelectorAll('.g-dialog__section')[1]; const foot = document.querySelector('.g-dialog__footer'); const dd = q('dialog-body')
  g.dialog = { section: getComputedStyle(sec).borderTopColor, footer: getComputedStyle(foot).borderTopColor, divider: getComputedStyle(dd).borderTopColor, inSection: R(dd).left >= R(sec).left + px(getComputedStyle(sec).paddingLeft) - 0.5 }
  g.overflow = { doc: document.documentElement.scrollWidth, vw: innerWidth, dividers: [...document.querySelectorAll('[data-case]')].filter((d) => d.scrollWidth > d.clientWidth + 1).map((d) => d.dataset.case) }
  return g
}

const near = (a, b, t = 1) => Math.abs(a - b) <= t
const table = []

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('requestfailed', (r) => errors.push('red: ' + r.url()))
  const go = async (qs) => { await page.goto(BASE + qs); await page.evaluate(() => document.fonts.ready) }

  /* 1 · Contraste en todos los temas, claro y oscuro */
  const configs = [['defecto', ''], ['defecto', 'dark=1'], ['prueba', 'test=1'], ...GEN.flatMap((t) => [[t, `theme=${t}`], [t, `theme=${t}&dark=1`]])]
  for (const [name, qs] of configs) {
    await go('?' + qs)
    const m = await page.evaluate(measure)
    const mode = qs.includes('dark') ? 'oscuro' : 'claro'
    const tag = `${engine} ${name} ${mode}`
    for (const c of ['strong-surface', 'strong-sunken', 'label-strong-surface', 'label-strong-sunken', 'label-long', 'inset-none']) ok(m[c].line >= 3, `${tag}: línea strong ${c} ${m[c].line}:1 < 3`)
    for (const c of ['label-surface', 'label-sunken', 'label-strong-surface', 'label-strong-sunken', 'label-long']) ok(m[c].text >= 4.5, `${tag}: texto ${c} ${m[c].text}:1 < 4.5`)
    table.push({ tag, sSurf: m['subtle-surface'].line, sSunk: m['subtle-sunken'].line, gSurf: m['strong-surface'].line, gSunk: m['strong-sunken'].line, tSurf: m['label-surface'].text, tSunk: m['label-sunken'].text, refBorder: m['ref-border'].line, refStrong: m['ref-border-strong'].line })
  }

  /* 2 · Geometría con el tema por defecto, LTR y RTL de página, y el Tema de prueba (borde 2px, space 5) */
  for (const qs of ['', 'rtl=1', 'test=1', 'dark=1']) {
    await go('?' + qs)
    const g = await page.evaluate(geometry)
    const tag = `${engine} geom ?${qs}`
    ok(near(g.inset, 8 * (qs === 'test=1' ? 1.25 : 1), 0.01), `${tag}: --g-divider-inset ${g.inset}`)
    for (const c of ['v-sm', 'v-md', 'v-md-both', 'v-lg', 'v-grid', 'rtl-v']) {
      ok(near(g[c].h, g[c].expect, 0.5), `${tag}: alto de ${c} ${g[c].h} ≠ ${g[c].expect}`)
      ok(g[c].h > 0, `${tag}: ${c} mide 0`)
      ok(near(g[c].w, g.bw, 0.01), `${tag}: ancho de ${c} ${g[c].w} ≠ ${g.bw}`)
    }
    ok(g['v-lg'].cls.includes('g-divider--inset-both'), `${tag}: v-lg sin clase efectiva both`)
    ok(near(g['v-md'].h, 36 * (qs === 'test=1' ? 1.25 : 1), 0.5), `${tag}: v-md ${g['v-md'].h} ≠ alto de GBtn md`)
    const rtl = qs === 'rtl=1'
    ok(near(g['inset-none'].dl, 0, 0.5) && near(g['inset-none'].dr, 0, 0.5), `${tag}: inset none no ocupa la caja (${g['inset-none'].dl}, ${g['inset-none'].dr})`)
    ok(near(g['inset-both'].dl, g.inset, 0.5) && near(g['inset-both'].dr, g.inset, 0.5), `${tag}: inset both (${g['inset-both'].dl}, ${g['inset-both'].dr})`)
    const st = g['inset-start']; ok(rtl ? near(st.dr, g.inset, 0.5) && near(st.dl, 0, 0.5) : near(st.dl, g.inset, 0.5) && near(st.dr, 0, 0.5), `${tag}: inset start (${st.dl}, ${st.dr})`)
    const rs = g['rtl-start']; ok(near(rs.dr, g.inset, 0.5) && near(rs.dl, 0, 0.5), `${tag}: inset start en dir=rtl local (${rs.dl}, ${rs.dr})`)
    ok(near(g.simple.h, g.bw, 0.01), `${tag}: grosor del hr ${g.simple.h} ≠ ${g.bw}`)
    ok(g.hr.m === '0px 0px 0px 0px' && g.hr.ov === 'visible' && g.hr.style === 'solid' && g.hr.b.endsWith('0px 0px 0px'), `${tag}: reseteo del hr ${JSON.stringify(g.hr)}`)
    if (!rtl) ok(near(g.nav.lineStart, g.nav.textStart, 1), `${tag}: línea de la lista ${g.nav.lineStart} ≠ texto ${g.nav.textStart}`)
    for (const c of ['label-surface', 'label-long', 'rtl-label']) {
      const l = g[c]
      ok(near(l.center, 0, 1), `${tag}: ${c} descentrado ${l.center}`)
      ok(!l.clipped, `${tag}: ${c} recortado`)
      ok(l.before >= l.min - 0.01 && l.after >= l.min - 0.01, `${tag}: ${c} líneas ${l.before}/${l.after} < mínimo ${l.min}`)
      ok(l.fs >= 12, `${tag}: ${c} texto ${l.fs}px < 12`)
      ok(l.bg === 'rgba(0, 0, 0, 0)', `${tag}: ${c} el texto tiene fondo ${l.bg}`)
    }
    ok(g['label-long'].lines >= 2, `${tag}: el texto largo no envuelve (${g['label-long'].lines} líneas)`)
    ok(g.dialog.section === g.dialog.divider && g.dialog.footer === g.dialog.divider, `${tag}: tono distinto al de GDialog ${JSON.stringify(g.dialog)}`)
    ok(g.dialog.inSection, `${tag}: el divider del diálogo sangra`)
    ok(g.overflow.doc <= g.overflow.vw && !g.overflow.dividers.length, `${tag}: desborde ${JSON.stringify(g.overflow)}`)
  }

  /* 3 · 320px (LTR y RTL), y en la lista compacta */
  for (const qs of ['', 'rtl=1', 'dark=1&rtl=1']) {
    await page.setViewportSize({ width: 320, height: 800 })
    await go('?' + qs)
    const g = await page.evaluate(geometry)
    ok(g.overflow.doc <= 320 && !g.overflow.dividers.length, `${engine} 320px ?${qs}: desborde ${JSON.stringify(g.overflow)}`)
    for (const c of ['label-surface', 'label-long', 'rtl-label']) ok(!g[c].clipped && g[c].before >= g[c].min - 0.01, `${engine} 320px ?${qs}: ${c}`)
  }
  await page.setViewportSize({ width: 1280, height: 900 })
  await go('')
  await page.selectOption('#nav-density', 'compact')
  const gc = await page.evaluate(geometry)
  ok(near(gc.nav.lineStart, gc.nav.textStart, 1), `${engine} lista compacta: línea ${gc.nav.lineStart} ≠ texto ${gc.nav.textStart}`)

  /* 4 · prefers-contrast: more */
  await page.emulateMedia({ contrast: 'more' })
  await go('')
  const pc = await page.evaluate(() => {
    const p = document.createElement('div'); p.style.color = 'var(--g-color-border-control)'; document.body.append(p)
    const ctl = getComputedStyle(p).color; p.style.color = 'var(--g-color-text)'; const txt = getComputedStyle(p).color; p.remove()
    const s = document.querySelector('[data-case="subtle-surface"]'); const l = document.querySelector('[data-case="label-surface"]')
    return { ctl, txt, subtle: getComputedStyle(s).borderTopColor, before: getComputedStyle(l, '::before').borderTopColor, label: getComputedStyle(l.firstElementChild).color }
  })
  ok(pc.subtle === pc.ctl && pc.before === pc.ctl, `${engine} prefers-contrast: línea ${JSON.stringify(pc)}`)
  ok(pc.label === pc.txt, `${engine} prefers-contrast: texto ${pc.label} ≠ ${pc.txt}`)
  await page.emulateMedia({ contrast: 'no-preference' })

  /* 5 · forced-colors: las tres formas de línea siguen visibles (solo Chromium emula forced-colors) */
  if (engine === 'chromium') {
    await page.emulateMedia({ forcedColors: 'active' })
    await go('')
    const fc = await page.evaluate(() => {
      const q = (c) => document.querySelector(`[data-case="${c}"]`)
      const s = (el, pe, side) => { const cs = getComputedStyle(el, pe); return { w: parseFloat(cs[`border${side}Width`]), st: cs[`border${side}Style`], c: cs[`border${side}Color`] } }
      return { hr: s(q('simple'), null, 'Top'), before: s(q('label-surface'), '::before', 'Top'), after: s(q('label-surface'), '::after', 'Top'), v: s(q('v-md'), null, 'Left'), canvas: getComputedStyle(document.body).backgroundColor }
    })
    for (const k of ['hr', 'before', 'after', 'v']) ok(fc[k].w >= 1 && fc[k].st === 'solid' && fc[k].c !== fc.canvas && !/^rgba\(.*,\s*0\)$/.test(fc[k].c), `${engine} forced-colors: ${k} ${JSON.stringify(fc[k])}`)
    await page.emulateMedia({ forcedColors: 'none' })
  }

  /* 6 · Escalas fraccionarias y zoom: la línea de 1px no desaparece */
  for (const dpr of [1.25, 1.5, 2, 3]) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: dpr })
    const p2 = await ctx.newPage(); await p2.goto(BASE)
    const hs = await p2.evaluate(() => ['simple', 'strong-surface', 'v-md', 'label-surface'].map((c) => {
      const d = document.querySelector(`[data-case="${c}"]`); const r = d.getBoundingClientRect()
      const cs = getComputedStyle(d, c.startsWith('label') ? '::before' : null)
      return { c, h: r.height, w: r.width, bt: parseFloat(cs.borderTopWidth), bl: parseFloat(cs.borderLeftWidth) }
    }))
    for (const h of hs) ok(h.c === 'v-md' ? h.w > 0 && h.bl * dpr >= 1 - 0.01 : h.bt * dpr >= 1 - 0.01, `${engine} DPR ${dpr}: ${h.c} ${JSON.stringify(h)}`)
    await ctx.close()
  }
  await go('')
  const zoom = await page.evaluate(() => { document.documentElement.style.zoom = '2'; const d = document.querySelector('[data-case="simple"]'); const r = d.getBoundingClientRect(); const out = { h: r.height, doc: document.documentElement.scrollWidth, vw: innerWidth }; document.documentElement.style.zoom = ''; return out })
  ok(zoom.h > 0, `${engine} zoom 200%: hr ${JSON.stringify(zoom)}`)

  ok(!errors.length, `${engine} consola: ${errors.join(' | ')}`)
  await browser.close()
}

server.close()
if (args.verbose) console.table(table)
else {
  const min = (k) => Math.min(...table.map((r) => r[k])).toFixed(2)
  const pick = (t) => table.find((r) => r.tag.endsWith(t))
  console.log('Contraste (línea subtle sup/hund · strong sup/hund · texto sup/hund):')
  for (const t of ['defecto claro', 'defecto oscuro', 'prueba claro', 'spotify claro', 'spotify oscuro', 'caracol-purpura claro', 'caracol-purpura oscuro']) {
    const r = pick(t); if (r) console.log(`  ${t.padEnd(24)} ${r.sSurf} / ${r.sSunk} · ${r.gSurf} / ${r.gSunk} · ${r.tSurf} / ${r.tSunk}   (ref border ${r.refBorder}, border-strong ${r.refStrong})`)
  }
  console.log(`  mínimo en ${table.length} temas      ${min('sSurf')} / ${min('sSunk')} · ${min('gSurf')} / ${min('gSunk')} · ${min('tSurf')} / ${min('tSunk')}`)
}
console.log(`\n${total - failed}/${total} correctas`)
if (failed) { console.log(fails.map((f) => '  ✗ ' + f).join('\n')); process.exitCode = 1 }
