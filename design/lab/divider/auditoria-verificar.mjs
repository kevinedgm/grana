// Auditoría de coco (paso 5) de GDivider sobre el COMPONENTE REAL (GDivider.vue + dist/, playground #sec-divider).
// Contraste medido (strong ≥ 3:1, texto ≥ 4.5:1 sobre surface y surface-sunken; claro y oscuro) con el tema por defecto,
// el «Tema de prueba» del playground, un tema con space 5 y borde 2px y los diez temas generados; vertical con GBtn reales
// sm/md/lg; inset (y lista anfitriona default/compact); texto largo; RTL de página y local; 320px; diálogo con divisores
// decorativos; árbol (separators sin nombre); forced-colors (Chromium) y prefers-contrast: more; escalas 1.25/1.5/2 y zoom
// 150/200 % comprobados POR PÍXELES (la línea se pinta, no se duplica y strong conserva ≥ 3:1); consola limpia; GDivider.vue
// sin <style> ni literales.
// Ejecutar desde la raíz del repo con dist/ reconstruido: node design/lab/divider/auditoria-verificar.mjs
// Opcional: --engines=chromium   --origin=http://localhost:4173 (servidor del playground; si no responde, uno propio)
//           --shots (capturas en $SHOTS o /tmp/grana-divider-shots)   --verbose (tabla de contraste)
import http from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const SHOTS = process.env.SHOTS || '/tmp/grana-divider-shots'

/* Servidor: el del playground (packages/vue como raíz) o uno propio con la misma raíz */
let ORIGIN = args.origin || 'http://localhost:4173'
let server
try { const r = await fetch(ORIGIN + '/playground/'); if (!r.ok) throw new Error() } catch {
  const VUE = join(ROOT, 'packages/vue')
  const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
  server = http.createServer(async (req, res) => {
    try {
      let p = normalize(join(VUE, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
      if (!p.startsWith(VUE)) throw new Error('fuera')
      if (p.endsWith('/')) p += 'index.html'
      res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
    } catch { res.writeHead(404).end() }
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  ORIGIN = `http://127.0.0.1:${server.address().port}`
}
const PAGE = ORIGIN + '/playground/'

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify']
const genCss = Object.fromEntries(await Promise.all(GEN.map(async (n) => [n, await readFile(join(ROOT, `design/lab/tema-oscuro/dark-color-presence/generated/${n}.css`), 'utf8')])))
// Otra escala (space 5, borde 2px, serif): la sensibilidad al tema que el defecto no prueba
const SPACE5 = ':root{--g-font-ui:Georgia,serif;--g-border-width:2px;--g-space-1:5px;--g-color-surface:#fffaf2;--g-color-surface-sunken:#f1e7d8;--g-color-bg:#f4ecdf;--g-color-border-control:#8a6d4b;--g-color-text:#2b1d0e;--g-color-text-muted:#6b5238}'

let total = 0, failed = 0
const fails = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const near = (a, b, t = 1) => Math.abs(a - b) <= t
const table = []
const notes = []

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
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const line = (d, pe) => { const cs = getComputedStyle(d, pe); const v = d.classList.contains('g-divider--orientation-vertical'); const bg = bgOf(d); return ratio(over(parse(v ? cs.borderLeftColor : cs.borderTopColor), bg), bg) }
  const text = (d) => { const bg = bgOf(d); return ratio(over(parse(getComputedStyle(d.querySelector('.g-divider__label')).color), bg), bg) }
  const [surf, sunk] = document.querySelectorAll('#dv-emphasis .dv-surf')
  const one = (box) => {
    const subtle = box.querySelector('hr.g-divider--emphasis-subtle'), strong = box.querySelector('hr.g-divider--emphasis-strong'), lab = box.querySelector('.g-divider--labeled')
    return { subtle: line(subtle), strong: line(strong), before: line(lab, '::before'), after: line(lab, '::after'), text: text(lab) }
  }
  const pageLab = document.querySelector('#dv-labeled .g-divider--labeled')
  return { surf: one(surf), sunk: one(sunk), pageHr: line(document.querySelector('#dv-hr')), pageText: text(pageLab), vertical: line(document.querySelector('#dv-row-md .dv-full')) }
}

/* ---------- En la página: geometría ---------- */
const geometry = () => {
  const R = (el) => el.getBoundingClientRect()
  const px = (v) => parseFloat(v)
  const rtl = getComputedStyle(document.documentElement).direction === 'rtl'
  const bw = px(getComputedStyle(document.documentElement).getPropertyValue('--g-border-width'))
  const inset = px(getComputedStyle(document.querySelector('#dv-inset-both')).marginInlineStart)
  const content = (el) => { const cs = getComputedStyle(el); return R(el).height - px(cs.paddingTop) - px(cs.paddingBottom) - px(cs.borderTopWidth) - px(cs.borderBottomWidth) }
  const g = { bw, inset, rtl, rows: {} }
  for (const id of ['dv-row-sm', 'dv-row-md', 'dv-row-lg', 'dv-rtl-row']) {
    const row = document.getElementById(id)
    const btn = row.querySelector('.g-btn')
    g.rows[id] = [...row.querySelectorAll('.g-divider')].map((d) => {
      const mb = px(getComputedStyle(d).marginTop) + px(getComputedStyle(d).marginBottom)
      return { cls: d.className, h: +R(d).height.toFixed(2), expect: +(content(row) - mb).toFixed(2), w: +R(d).width.toFixed(2), btn: +R(btn).height.toFixed(2), role: d.getAttribute('role'), ori: d.getAttribute('aria-orientation') }
    })
  }
  const box = (d) => { const p = d.parentElement; const r = R(p); const cs = getComputedStyle(p); return { l: r.left + px(cs.paddingLeft) + px(cs.borderLeftWidth), r: r.right - px(cs.paddingRight) - px(cs.borderRightWidth) } }
  const span = (d) => { const b = box(d); const r = R(d); return { dl: +(r.left - b.l).toFixed(2), dr: +(b.r - r.right).toFixed(2), h: +r.height.toFixed(2) } }
  for (const id of ['dv-inset-none', 'dv-inset-both', 'dv-inset-start', 'dv-hr']) g[id] = span(document.getElementById(id))
  g.rtlStart = span(document.querySelector('.dv-rtl-start'))
  // Lista anfitriona que redefine el token: la línea empieza donde el texto
  const nav = document.querySelector('#dv-nav > .g-divider'); const t = document.querySelector('#dv-nav .dv-text').getBoundingClientRect()
  g.nav = rtl ? { line: +R(nav).right.toFixed(2), text: +t.right.toFixed(2) } : { line: +R(nav).left.toFixed(2), text: +t.left.toFixed(2) }
  // Texto
  const lab = (d) => {
    const l = d.querySelector('.g-divider__label'); const b = getComputedStyle(d, '::before'); const a = getComputedStyle(d, '::after')
    return { center: +((R(l).left + R(l).right) / 2 - (R(d).left + R(d).right) / 2).toFixed(2), before: px(b.width), after: px(a.width), min: px(b.minWidth),
      clipped: l.scrollWidth > l.clientWidth + 1 || d.scrollWidth > d.clientWidth + 1, lines: Math.round(R(l).height / px(getComputedStyle(l).lineHeight)),
      fs: px(getComputedStyle(l).fontSize), bg: getComputedStyle(l).backgroundColor }
  }
  g.labOBien = lab(document.querySelector('#dv-labeled > .g-divider--labeled'))
  g.labLong = lab(document.querySelector('#dv-long .g-divider--labeled'))
  g.labRtl = lab(document.querySelector('#dv-rtl .g-divider--labeled'))
  const hr = document.getElementById('dv-hr'); const hs = getComputedStyle(hr)
  g.hr = { m: [hs.marginTop, hs.marginRight, hs.marginBottom, hs.marginLeft].join(' '), ov: hs.overflow, style: hs.borderTopStyle, h: R(hr).height, tag: hr.tagName }
  // Desborde de la sección y de cada divider
  const sec = document.getElementById('sec-divider'); const S = R(sec)
  g.overflow = {
    doc: document.documentElement.scrollWidth, vw: innerWidth, sec: sec.scrollWidth - sec.clientWidth,
    out: [...sec.querySelectorAll('.g-divider')].filter((d) => { const r = R(d); return r.width > 0 && (r.left < S.left - 1 || r.right > S.right + 1) }).length,
    self: [...sec.querySelectorAll('.g-divider')].filter((d) => d.scrollWidth > d.clientWidth + 1).length,
  }
  return g
}

/* ---------- Por píxeles: la línea se pinta (una franja, sin duplicar) y conserva su contraste ---------- */
// Captura el visor completo en píxeles de dispositivo (sin recorte, que remuestrearía a escalas fraccionarias) y analiza
// en la página (canvas) una franja que cruza la línea: filas (o columnas) de dispositivo que difieren del fondo
const pixels = async (page, el, vertical, pad = 6) => {
  const r = await el.boundingBox()
  const vp = page.viewportSize()
  if (!r || r.y - pad < 0 || r.y + r.height + pad > vp.height || r.x - pad < 0 || r.x + r.width + pad > vp.width) return { lit: 0, runs: 0, max: 1, fuera: r }
  const b64 = (await page.screenshot({ animations: 'disabled' })).toString('base64')
  return page.evaluate(async ({ b64, vertical, r, pad }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
    const k0 = img.naturalWidth / innerWidth
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight
    const x = c.getContext('2d'); x.drawImage(img, 0, 0)
    // Franja: a lo largo de la línea, 32px centrados; a través, la línea ± pad (en px de dispositivo enteros)
    const along = vertical ? [r.y + r.height / 2 - 4, r.y + r.height / 2 + 4] : [r.x + r.width / 2 - 16, r.x + r.width / 2 + 16]
    const across = vertical ? [r.x - pad, r.x + r.width + pad] : [r.y - pad, r.y + r.height + pad]
    const a0 = Math.round(along[0] * k0), a1 = Math.round(along[1] * k0), c0 = Math.round(across[0] * k0), c1 = Math.round(across[1] * k0)
    const box = vertical ? [c0, a0, c1 - c0, a1 - a0] : [a0, c0, a1 - a0, c1 - c0]
    const d = x.getImageData(...box).data; const W = box[2]
    const at = (i, j) => { const k = (j * W + i) * 4; return [d[k], d[k + 1], d[k + 2]] }
    const lum = (p) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]) }
    const ratio = (a, b) => { const p = lum(a), q = lum(b); return (Math.max(p, q) + 0.05) / (Math.min(p, q) + 0.05) }
    const n = c1 - c0, m = a1 - a0
    const bg = at(0, 0)
    const prof = []
    for (let s = 0; s < n; s++) { let worst = Infinity; for (let t = 0; t < m; t++) worst = Math.min(worst, ratio(vertical ? at(s, t) : at(t, s), bg)); prof.push(+worst.toFixed(2)) }
    const lit = prof.map((v, i) => [v, i]).filter(([v]) => v > 1.04)
    const runs = lit.reduce((acc, [, i], k, arr) => acc + (k === 0 || arr[k - 1][1] !== i - 1 ? 1 : 0), 0)
    return { device: n, lit: lit.length, runs, max: Math.max(...prof) }
  }, { b64, vertical, r, pad })
}

/* ---------- GDivider.vue: sin <style> ni literales ---------- */
const vue = await readFile(join(ROOT, 'packages/vue/src/components/GDivider/GDivider.vue'), 'utf8')
const code = vue.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
ok(!/<style/i.test(vue), 'GDivider.vue tiene <style>')
ok(!/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(|\b\d+(\.\d+)?(px|rem|em|%)\b|style\s*:/i.test(code), 'GDivider.vue con literales de color, medida o style en línea')
const css = await readFile(join(ROOT, 'packages/vue/src/components/GDivider/GDivider.css'), 'utf8')
const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, '')
ok(!/#[0-9a-f]{3,8}\b|rgba?\(|\b\d+(\.\d+)?(px|rem|em)\b/i.test(cssCode), 'GDivider.css con literales')
ok(!/var\(--[\w-]+\s*,/.test(cssCode), 'GDivider.css con valores de respaldo')

if (args.shots) await mkdir(SHOTS, { recursive: true })

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const errors = []
  const open = async ({ width = 1280, height = 900, dark = false, theme = '', test = false, dpr = 1, contrast, forced, rtl = false } = {}) => {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, colorScheme: dark ? 'dark' : 'light', reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(`${engine}: ${m.text()}`) })
    page.on('pageerror', (e) => errors.push(`${engine}: ${e}`))
    page.on('requestfailed', (r) => errors.push(`${engine} red: ${r.url()}`))
    if (contrast || forced) await page.emulateMedia({ ...(contrast ? { contrast } : {}), ...(forced ? { forcedColors: forced } : {}) })
    await page.goto(PAGE + '#sec-divider')
    await page.waitForSelector('#dv-hr.g-divider')
    if (test) { await page.click('#pg-theme-test'); await page.waitForTimeout(50) }
    if (theme) await page.addStyleTag({ content: theme })
    if (rtl) await page.evaluate(() => { document.documentElement.dir = 'rtl' })
    await page.evaluate(() => document.fonts.ready)
    await page.locator('#sec-divider').scrollIntoViewIfNeeded()
    return page
  }

  /* 1 · Contraste: defecto, Tema de prueba, space 5 y los diez generados, claro y oscuro */
  const configs = [['defecto', '', false], ['prueba', '', true], ['space5', SPACE5, false], ...GEN.map((t) => [t, genCss[t], false])]
  for (const [name, theme, test] of configs) {
    for (const dark of [false, true]) {
      if (name === 'space5' && dark) continue
      const page = await open({ dark, theme, test })
      const m = await page.evaluate(measure)
      const tag = `${engine} ${name} ${dark ? 'oscuro' : 'claro'}`
      for (const k of ['surf', 'sunk']) {
        ok(m[k].strong >= 3, `${tag}: strong/${k} ${m[k].strong}:1 < 3`)
        ok(m[k].before >= 3 && m[k].after >= 3, `${tag}: líneas del texto strong/${k} ${m[k].before}/${m[k].after} < 3`)
        ok(m[k].text >= 4.5, `${tag}: texto/${k} ${m[k].text}:1 < 4.5`)
      }
      ok(m.pageText >= 4.5, `${tag}: texto sobre bg ${m.pageText}:1 < 4.5`)
      table.push({ tag, subSurf: m.surf.subtle, subSunk: m.sunk.subtle, strSurf: m.surf.strong, strSunk: m.sunk.strong, txtSurf: m.surf.text, txtSunk: m.sunk.text, txtBg: m.pageText, hrBg: m.pageHr })
      if (args.shots && engine === 'chromium' && ['defecto', 'spotify', 'space5'].includes(name)) await page.locator('#dv-demo').screenshot({ path: `${SHOTS}/${name}-${dark ? 'oscuro' : 'claro'}.png` })
      await page.context().close()
    }
  }

  /* 2 · Geometría: defecto (LTR, RTL de página, oscuro), Tema de prueba y space 5 */
  for (const [label, o] of [['defecto', {}], ['rtl', { rtl: true }], ['oscuro', { dark: true }], ['prueba', { test: true }], ['space5', { theme: SPACE5 }]]) {
    const page = await open(o)
    const g = await page.evaluate(geometry)
    const tag = `${engine} geom ${label}`
    const sp = label === 'space5' ? 1.25 : 1
    ok(near(g.inset, 8 * sp, 0.01), `${tag}: --g-divider-inset ${g.inset}`)
    for (const [id, ds] of Object.entries(g.rows)) for (const d of ds) {
      ok(near(d.h, d.expect, 0.5) && d.h > 0, `${tag}: ${id} vertical alto ${d.h} ≠ ${d.expect}`)
      ok(near(d.w, g.bw, 0.01), `${tag}: ${id} vertical ancho ${d.w} ≠ ${g.bw}`)
      ok(d.role === 'separator' && d.ori === 'vertical', `${tag}: ${id} rol ${d.role}/${d.ori}`)
    }
    if (label === 'defecto' || label === 'rtl' || label === 'oscuro') {
      // GBtn reales: sin inset = alto del botón (28/36/44); inset both = − 2 × 8 (12/20/28)
      const exp = { 'dv-row-sm': [12, 28], 'dv-row-md': [20, 36], 'dv-row-lg': [28, 44] }
      for (const [id, [ins, full]] of Object.entries(exp)) {
        const [a, b] = g.rows[id]
        ok(near(a.h, ins, 0.5) && near(b.h, full, 0.5) && near(b.btn, full, 0.5), `${tag}: ${id} ${a.h}/${b.h} (botón ${b.btn}) ≠ ${ins}/${full}`)
      }
    }
    if (label === 'space5') notes.push(`${engine} space5: verticales ${Object.values(g.rows).map((ds) => ds.map((d) => d.h).join('/')).join(' · ')}; grosor ${g['dv-hr'].h}`)
    ok(near(g['dv-inset-none'].dl, 0, 0.5) && near(g['dv-inset-none'].dr, 0, 0.5), `${tag}: inset none ${JSON.stringify(g['dv-inset-none'])}`)
    ok(near(g['dv-inset-both'].dl, g.inset, 0.5) && near(g['dv-inset-both'].dr, g.inset, 0.5), `${tag}: inset both ${JSON.stringify(g['dv-inset-both'])}`)
    const st = g['dv-inset-start']
    ok(g.rtl ? near(st.dr, g.inset, 0.5) && near(st.dl, 0, 0.5) : near(st.dl, g.inset, 0.5) && near(st.dr, 0, 0.5), `${tag}: inset start ${JSON.stringify(st)}`)
    ok(near(g.rtlStart.dr, g.inset, 0.5) && near(g.rtlStart.dl, 0, 0.5), `${tag}: inset start en dir=rtl local ${JSON.stringify(g.rtlStart)}`)
    ok(near(g.nav.line, g.nav.text, 1), `${tag}: lista anfitriona línea ${g.nav.line} ≠ texto ${g.nav.text}`)
    ok(near(g['dv-hr'].h, g.bw, 0.01), `${tag}: grosor del hr ${g['dv-hr'].h} ≠ ${g.bw}`)
    ok(g.hr.tag === 'HR' && g.hr.m === '0px 0px 0px 0px' && g.hr.ov === 'visible' && g.hr.style === 'solid', `${tag}: reseteo del hr ${JSON.stringify(g.hr)}`)
    for (const k of ['labOBien', 'labLong', 'labRtl']) {
      const l = g[k]
      ok(near(l.center, 0, 1), `${tag}: ${k} descentrado ${l.center}`)
      ok(!l.clipped, `${tag}: ${k} recortado`)
      ok(l.before >= l.min - 0.01 && l.after >= l.min - 0.01, `${tag}: ${k} líneas ${l.before}/${l.after} < ${l.min}`)
      ok(l.fs >= 12, `${tag}: ${k} ${l.fs}px`)
      ok(l.bg === 'rgba(0, 0, 0, 0)', `${tag}: ${k} con fondo ${l.bg}`)
    }
    ok(g.labLong.lines >= 2, `${tag}: el texto largo no envuelve`)
    ok(!g.overflow.out && !g.overflow.self && g.overflow.sec <= 1, `${tag}: desborde ${JSON.stringify(g.overflow)}`)
    if (label === 'defecto') {
      // Lista compacta: la anfitriona recalcula el token y la línea sigue al texto
      await page.click('#dv-demo .fm-bench-ctl input')
      const gc = await page.evaluate(geometry)
      ok(near(gc.nav.line, gc.nav.text, 1), `${tag}: lista compacta línea ${gc.nav.line} ≠ texto ${gc.nav.text}`)
      // Árbol: separators del playground (1 hr + 6 verticales + 4 hr de énfasis + 3 inset + 1 lista + 2 RTL), ninguno con nombre
      const sep = page.locator('#sec-divider').getByRole('separator')
      const n = await sep.count()
      ok(n === 17, `${tag}: ${n} separators (esperados 17)`)
      ok((await page.locator('#sec-divider').getByRole('separator', { name: /\S/ }).count()) === 0, `${tag}: separator con nombre`)
      ok((await page.locator('#sec-divider .g-divider--labeled[role], #sec-divider .g-divider__label[role]').count()) === 0, `${tag}: divider con texto con rol`)
      // Ningún divider enfocable
      ok(await page.evaluate(() => [...document.querySelectorAll('#sec-divider .g-divider')].every((d) => d.tabIndex < 0 && !d.hasAttribute('tabindex'))), `${tag}: divider enfocable`)
      // Diálogo: dos divisores decorativos, mismo tono que la línea del pie, sin sangrar
      await page.click('#dv-open-dlg')
      await page.waitForSelector('#dv-dlg-body .g-divider')
      const dlg = await page.evaluate(() => {
        const ds = [...document.querySelectorAll('#dv-dlg-body .g-divider')]
        const foot = document.querySelector('.g-dialog__footer'); const body = document.getElementById('dv-dlg-body').getBoundingClientRect()
        return { n: ds.length, hidden: ds.every((d) => d.getAttribute('aria-hidden') === 'true' && !d.hasAttribute('role')), color: ds.map((d) => getComputedStyle(d).borderTopColor), foot: getComputedStyle(foot).borderTopColor, inside: ds.every((d) => { const r = d.getBoundingClientRect(); return r.left >= body.left - 0.5 && r.right <= body.right + 0.5 }) }
      })
      ok(dlg.n === 2 && dlg.hidden, `${tag}: diálogo ${JSON.stringify(dlg)}`)
      ok(dlg.color.every((c) => c === dlg.foot), `${tag}: tono del divider del diálogo ${dlg.color} ≠ pie ${dlg.foot}`)
      ok(dlg.inside, `${tag}: el divider del diálogo sangra`)
      ok((await page.getByRole('dialog').getByRole('separator').count()) === 0, `${tag}: separator dentro del diálogo`)
      if (args.shots && engine === 'chromium') await page.getByRole('dialog').screenshot({ path: `${SHOTS}/dialogo.png` })
      await page.keyboard.press('Escape')
    }
    await page.context().close()
  }

  /* 3 · 320px (LTR, RTL, RTL oscuro, Spotify) */
  for (const [label, o] of [['ltr', {}], ['rtl', { rtl: true }], ['rtl oscuro', { rtl: true, dark: true }], ['spotify', { theme: genCss.spotify }]]) {
    const page = await open({ width: 320, height: 800, ...o })
    const g = await page.evaluate(geometry)
    const tag = `${engine} 320px ${label}`
    ok(!g.overflow.out && !g.overflow.self && g.overflow.sec <= 1, `${tag}: desborde ${JSON.stringify(g.overflow)}`)
    for (const k of ['labOBien', 'labLong', 'labRtl']) ok(!g[k].clipped && g[k].before >= g[k].min - 0.01 && g[k].after >= g[k].min - 0.01, `${tag}: ${k} ${JSON.stringify(g[k])}`)
    for (const ds of Object.values(g.rows)) for (const d of ds) ok(near(d.h, d.expect, 0.5) && d.h > 0, `${tag}: vertical ${d.h} ≠ ${d.expect}`)
    if (label === 'ltr') notes.push(`${engine} 320px: documento ${g.overflow.doc}/${g.overflow.vw}`)
    if (args.shots && engine === 'chromium' && label !== 'spotify') await page.locator('#dv-demo').screenshot({ path: `${SHOTS}/320-${label.replace(' ', '-')}.png` })
    await page.context().close()
  }

  /* 4 · prefers-contrast: more sobre el componente real (claro y oscuro) */
  for (const dark of [false, true]) {
    const page = await open({ contrast: 'more', dark })
    const pc = await page.evaluate(() => {
      const p = document.createElement('div'); p.style.color = 'var(--g-color-border-control)'; document.body.append(p)
      const ctl = getComputedStyle(p).color; p.style.color = 'var(--g-color-text)'; const txt = getComputedStyle(p).color; p.remove()
      const l = document.querySelector('#dv-labeled .g-divider--labeled')
      return { ctl, txt, hr: getComputedStyle(document.getElementById('dv-hr')).borderTopColor, v: getComputedStyle(document.querySelector('#dv-row-md .dv-full')).borderLeftColor, before: getComputedStyle(l, '::before').borderTopColor, after: getComputedStyle(l, '::after').borderTopColor, label: getComputedStyle(l.firstElementChild).color }
    })
    const tag = `${engine} prefers-contrast ${dark ? 'oscuro' : 'claro'}`
    ok(pc.hr === pc.ctl && pc.v === pc.ctl && pc.before === pc.ctl && pc.after === pc.ctl, `${tag}: líneas ${JSON.stringify(pc)}`)
    ok(pc.label === pc.txt, `${tag}: texto ${pc.label} ≠ ${pc.txt}`)
    const m = await page.evaluate(measure)
    ok(m.surf.subtle >= 3 && m.sunk.subtle >= 3 && m.pageHr >= 3, `${tag}: subtle sin 3:1 ${m.surf.subtle}/${m.sunk.subtle}/${m.pageHr}`)
    if (!dark) notes.push(`${engine} prefers-contrast claro: subtle ${m.surf.subtle}/${m.sunk.subtle}, texto ${m.surf.text}/${m.sunk.text}`)
    await page.context().close()
  }

  /* 5 · forced-colors (solo Chromium emula): las tres formas de línea en CanvasText y visibles por píxeles */
  if (engine === 'chromium') {
    for (const dark of [false, true]) {
      const page = await open({ forced: 'active', dark })
      const fc = await page.evaluate(() => {
        const s = (el, pe, side) => { const cs = getComputedStyle(el, pe); return { w: parseFloat(cs[`border${side}Width`]), st: cs[`border${side}Style`], c: cs[`border${side}Color`] } }
        const p = document.createElement('div'); p.style.color = 'CanvasText'; document.body.append(p); const ct = getComputedStyle(p).color; p.remove()
        const l = document.querySelector('#dv-labeled .g-divider--labeled')
        return { ct, hr: s(document.getElementById('dv-hr'), null, 'Top'), strong: s(document.querySelector('#dv-emphasis hr.g-divider--emphasis-strong'), null, 'Top'), before: s(l, '::before', 'Top'), after: s(l, '::after', 'Top'), v: s(document.querySelector('#dv-row-md .dv-in'), null, 'Left') }
      })
      const tag = `${engine} forced-colors ${dark ? 'oscuro' : 'claro'}`
      for (const k of ['hr', 'strong', 'before', 'after', 'v']) ok(fc[k].w >= 1 && fc[k].st === 'solid' && fc[k].c === fc.ct, `${tag}: ${k} ${JSON.stringify(fc[k])} (CanvasText ${fc.ct})`)
      const px1 = await pixels(page, page.locator('#dv-hr'), false)
      const px2 = await pixels(page, page.locator('#dv-row-md .dv-in'), true)
      ok(px1.max >= 4.5 && px2.max >= 4.5, `${tag}: píxeles hr ${JSON.stringify(px1)} vertical ${JSON.stringify(px2)}`)
      if (!dark) notes.push(`${engine} forced-colors: hr ${px1.max}:1, vertical ${px2.max}:1 por píxeles`)
      if (args.shots) await page.locator('#dv-demo').screenshot({ path: `${SHOTS}/forced-${dark ? 'oscuro' : 'claro'}.png` })
      await page.context().close()
    }
  }

  /* 6 · Escalas fraccionarias (deviceScaleFactor) y zoom 150/200 %: por píxeles */
  const cases = [['hr subtle', '#dv-hr', false, 1.04], ['hr strong', '#dv-emphasis .dv-surf hr.g-divider--emphasis-strong', false, 3], ['vertical md', '#dv-row-md .dv-full', true, 1.04]]
  // Zoom del navegador = más píxeles de dispositivo por px CSS y un visor CSS más estrecho (1280 / z); zoom CSS = `zoom` en la raíz
  const scales = [['dpr 1', { dpr: 1 }], ['dpr 1.25', { dpr: 1.25 }], ['dpr 1.5', { dpr: 1.5 }], ['dpr 2', { dpr: 2 }],
    ['zoom navegador 150 %', { dpr: 1.5, width: 853 }], ['zoom navegador 200 %', { dpr: 2, width: 640 }], ['zoom navegador 125 % (dpr 1.25)', { dpr: 1.25, width: 1024 }],
    ['zoom CSS 150 %', { zoom: 1.5 }], ['zoom CSS 200 %', { zoom: 2 }], ['zoom CSS 150 % · dpr 1.25', { zoom: 1.5, dpr: 1.25 }]]
  for (const [label, { dpr = 1, zoom, width = 1000 }] of scales) {
    // WebKit con `zoom` en la raíz: getBoundingClientRect y el desplazamiento no coinciden con la captura (el elemento queda
    // fuera del visor); no es del componente. En WebKit vale el zoom del navegador (dpr), que es el real
    if (zoom && engine === 'webkit') continue
    const page = await open({ dpr, width, height: 900 })
    if (zoom) await page.evaluate((z) => { document.documentElement.style.zoom = String(z) }, zoom)
    const row = []
    const scale = dpr * (zoom || 1)
    for (const [name, sel, vertical, min] of cases) {
      const el = page.locator(sel).first()
      // scrollIntoView propio: con `zoom` en la raíz el de Playwright puede dejar el elemento fuera del visor
      await el.evaluate((n) => n.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }))
      const p = await pixels(page, el, vertical)
      // Se pinta, en una sola franja (no se duplica) y no más ancha que el grosor en px de dispositivo + 1 (antialias)
      ok(p.lit >= 1 && p.runs === 1 && p.lit <= Math.ceil(scale) + 1 && p.max >= 1.04, `${engine} ${label}: ${name} ${JSON.stringify(p)}`)
      // A escala entera la línea cae en píxeles enteros: strong conserva su 3:1 medido en píxeles
      if (Number.isInteger(scale)) ok(p.max >= min, `${engine} ${label}: ${name} contraste en píxeles ${p.max} < ${min}`)
      row.push(`${name} ${p.lit}px·${p.max}`)
    }
    // El texto no se sale y las líneas no se cruzan con él al ampliar
    const g = await page.evaluate(geometry)
    ok(!g.labOBien.clipped && !g.labLong.clipped && !g.overflow.self, `${engine} ${label}: texto ${JSON.stringify(g.labLong)}`)
    notes.push(`${engine} ${label}: ${row.join(' | ')}`)
    await page.context().close()
  }

  ok(!errors.length, `${engine} consola: ${[...new Set(errors)].join(' | ')}`)
  await browser.close()
}

server?.close()
if (args.verbose) console.table(table)
else {
  const min = (k) => Math.min(...table.map((r) => r[k])).toFixed(2)
  const pick = (t) => table.find((r) => r.tag === t)
  console.log('Contraste (subtle sup/hund · strong sup/hund · texto sup/hund/bg):')
  for (const t of ['defecto claro', 'defecto oscuro', 'prueba claro', 'prueba oscuro', 'space5 claro', 'spotify claro', 'spotify oscuro', 'lustre claro', 'lustre oscuro']) {
    const r = pick(`${ENGINES[0]} ${t}`); if (r) console.log(`  ${t.padEnd(16)} ${r.subSurf} / ${r.subSunk} · ${r.strSurf} / ${r.strSunk} · ${r.txtSurf} / ${r.txtSunk} / ${r.txtBg}`)
  }
  console.log(`  mínimo (${table.length} config.) ${min('subSurf')} / ${min('subSunk')} · ${min('strSurf')} / ${min('strSunk')} · ${min('txtSurf')} / ${min('txtSunk')} / ${min('txtBg')}`)
}
console.log(notes.map((n) => '  · ' + n).join('\n'))
console.log(`\n${total - failed}/${total} correctas (${PAGE})`)
if (failed) { console.log(fails.map((f) => '  ✗ ' + f).join('\n')); process.exitCode = 1 }
