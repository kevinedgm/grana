// Auditoría de coco (paso 5) de GPageIndex appearance="list" y su plegada `fold` sobre el COMPONENTE REAL:
// dist/page-index.umd.js + la extensión dist/page-index-list.umd.js + dist/grana.css, en el banco de bruno
// packages/vue/playground/sitio.html (columna derecha ≥ 80rem, plegada en la barra local < 80rem; dos instancias con el
// mismo v-model, PI-L5). Contrato: design/contracts/page-index.md «Forma list» (#1054, #1067).
// Mide: contraste (texto ≥ 4,5:1, marcador y anillo ≥ 3:1) en claro y oscuro con el tema por defecto, los diez temas
// generados de design/lab/tema-oscuro/dark-color-presence/generated/ y la zona de marca; geometría del marcador (2 × 18,
// centrado ±1,5 px, sobre la línea guía); marcador del panel plegado (contrato «Plegada» 6; 1.4.1); área táctil (fino ≥ 24,
// coarse ≥ 44); foco visible por teclado; panel dentro del visor; RTL; forced-colors (emulado); movimiento reducido y las
// transiciones contratadas (PI-H2); CSS solo con var(--g-*)/--_*; consola limpia.
// Ejecutar desde la raíz del repo con dist/ construido: node design/lab/page-index/auditoria-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit (por defecto chromium)  --port=4209  --verbose  --shots (en $SHOTS o /tmp/grana-pi-shots)
// Vue sale de node_modules/vue/dist/vue.global.js (la página lo pide a unpkg y se responde en local).
import http from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const VUE = join(ROOT, 'node_modules/vue/dist/vue.global.js')
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium').split(',')
const PORT = Number(args.port || 4209)
const SHOTS = process.env.SHOTS || '/tmp/grana-pi-shots'

/* Servidor: si el puerto ya sirve la raíz del repo, se usa; si no, uno propio en ese puerto */
let ORIGIN = `http://127.0.0.1:${PORT}`
let server
try { const r = await fetch(ORIGIN + '/packages/vue/playground/sitio.html'); if (!r.ok) throw new Error() } catch {
  const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
  server = http.createServer(async (req, res) => {
    try {
      let p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
      if (!p.startsWith(ROOT)) throw new Error('fuera')
      if (p.endsWith('/')) p += 'index.html'
      res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
    } catch { res.writeHead(404).end() }
  })
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
}
const PAGE = ORIGIN + '/packages/vue/playground/sitio.html'

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify']
const genCss = Object.fromEntries(await Promise.all(GEN.map(async (n) => [n, await readFile(join(ROOT, `design/lab/tema-oscuro/dark-color-presence/generated/${n}.css`), 'utf8')])))

let total = 0, failed = 0
const fails = []
const notes = []
const table = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }

/* ---------- Estático: CSS de coco y extensión de bruno ---------- */
{
  const css = await readFile(join(ROOT, 'packages/vue/src/components/GPageIndex/GPageIndex.css'), 'utf8')
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(css.startsWith('@layer grana.defaults, grana.components, grana.blocks, grana.utilities;'), 'CSS: primera línea con las cuatro capas (#806)')
  const vars = [...code.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), `CSS: solo var(--g-*) y --_* (${vars.filter((v) => !v.startsWith('--g-') && !v.startsWith('--_')).join(' ')})`)
  ok(!/var\(\s*--[\w-]+\s*,/.test(code), 'CSS: sin valores de respaldo en var()')
  const lits = [...code.replace(/,\s*0\.5px\)/g, ')').matchAll(/(?<![\w.-])(\d*\.?\d+)px/g)].map((m) => m[1]).filter((n) => !['24', '44', '0', '1'].includes(n))
  ok(lits.length === 0, `CSS: literales de medida fuera de 24px/44px (${lits.join(', ')}; el paso de redondeo 0.5px de round(), como GBtn, no es una medida)`)
  const hex = code.match(/#[0-9a-f]{3,8}\b|rgba?\(|oklch\(|hsl\(/gi) || []
  ok(hex.length === 0, `CSS: sin colores literales (${hex.join(' ')})`)
  ok(!/@keyframes/.test(code), 'CSS: sin @keyframes (transiciones interrumpibles)')
  const ext = await readFile(join(ROOT, 'packages/vue/src/components/GPageIndex/GPageIndexList.js'), 'utf8')
  const styleWrites = [...ext.matchAll(/style\.cssText\s*=\s*`([^`]*)`/g)].map((m) => m[1])
  ok(styleWrites.length === 1 && /^--_marker-y:[^;]+;--_marker-h:[^;]+$/.test(styleWrites[0]), 'Extensión: el único estilo en línea es la geometría del marcador (--_marker-y/-h, #964)')
  ok(!/<style|color:|#[0-9a-f]{6}/i.test(ext.replace(/\/\/.*$/gm, '')), 'Extensión: sin <style> ni colores')
}

/* ---------- En la página: contraste compuesto ---------- */
const MEASURE = () => {
  window.__pi = {
    parse(s) {
      let m = s.match(/rgba?\(([^)]+)\)/)
      if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
      m = s.match(/color\(srgb ([^)]+)\)/)
      if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
      return [0, 0, 0, 0]
    },
    over(t, b) { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] },
    bg(el) {
      const L = []
      for (let n = el; n; n = n.parentElement) { const c = __pi.parse(getComputedStyle(n).backgroundColor); if (c[3] > 0) { L.push(c); if (c[3] >= 1) break } }
      let base = __pi.parse(getComputedStyle(document.documentElement).backgroundColor)
      if (base[3] < 1) base = [255, 255, 255, 1]
      for (let i = L.length - 1; i >= 0; i--) base = __pi.over(L[i], base)
      return base
    },
    lum(c) { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) },
    ratio(a, b) { const x = __pi.lum(a), y = __pi.lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) },
    // color de primer plano (texto, fondo de un trazo o contorno) sobre el fondo efectivo de `host`
    c(fg, host) { const bg = __pi.bg(host); return __pi.ratio(__pi.over(__pi.parse(fg), bg), bg) }
  }
}

const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 60)))))

async function openPage(ctx, { width = 1280, height = 800, qs = '', theme = '', motion = 'reduce', forced = 'none', zone = false } = {}) {
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
  page.on('console', (m) => { const t = m.text(); if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`); else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t)) errs.push(`warning: ${t}`) })
  page.on('requestfailed', (r) => { if (!/favicon/.test(r.url())) errs.push(`requestfailed: ${r.url()}`) })
  await page.setViewportSize({ width, height })
  await page.emulateMedia({ reducedMotion: motion, forcedColors: forced })
  await page.goto(PAGE + qs)
  await page.waitForSelector('#pi-list', { state: 'attached' })
  if (theme) await page.addStyleTag({ content: theme })
  if (zone) await page.evaluate(() => { document.getElementById('aside').dataset.gZone = 'brand'; document.getElementById('local').dataset.gZone = 'brand' })
  await page.evaluate(MEASURE)
  await settle(page)
  return { page, errs }
}
async function toSection(page, id) {
  await page.evaluate((i) => { const el = document.getElementById(i); scrollTo(0, el.getBoundingClientRect().top + scrollY - 120) }, id)
  await page.waitForTimeout(120)
  await settle(page)
}

/* Columna: contraste y marcador */
const columnFacts = () => {
  const q = (s) => document.querySelector(s)
  const nav = q('#pi-list'), cur = q('#pi-list [aria-current="location"]'), mk = q('#pi-list .g-page-index__marker')
  const other = q('#pi-list .g-page-index__link:not([aria-current])'), title = q('#pi-list .g-page-index__title'), body = q('#pi-list .g-page-index__body')
  const m = mk.getBoundingClientRect(), a = cur.getBoundingClientRect(), bb = body.getBoundingClientRect()
  const rtl = getComputedStyle(nav).direction === 'rtl'
  const bw = parseFloat(getComputedStyle(body).borderInlineStartWidth)
  const lineX = rtl ? bb.right - bw / 2 : bb.left + bw / 2
  const cs = getComputedStyle
  return {
    currents: document.querySelectorAll('#pi-list [aria-current]').length,
    hasCurrent: nav.classList.contains('has-current'),
    link: __pi.c(cs(other).color, other), current: __pi.c(cs(cur).color, cur), title: __pi.c(cs(title).color, title),
    between: __pi.ratio(__pi.parse(cs(cur).color), __pi.parse(cs(other).color)),
    marker: __pi.c(cs(mk).backgroundColor, body), markerOpacity: +cs(mk).opacity,
    line: __pi.c(cs(body).borderInlineStartColor, body),
    mW: +m.width.toFixed(2), mH: +m.height.toFixed(2), mOff: +Math.abs((m.top + m.height / 2) - (a.top + a.height / 2)).toFixed(2),
    mOnLine: +Math.abs((m.left + m.width / 2) - lineX).toFixed(2), bw,
    rowH: a.height, linkFs: parseFloat(cs(other).fontSize), titleFs: parseFloat(cs(title).fontSize),
    focusRing: __pi.c(cs(document.documentElement).getPropertyValue('--g-color-focus').trim() ? (() => { const d = document.createElement('i'); d.style.color = 'var(--g-color-focus)'; nav.append(d); const c = cs(d).color; d.remove(); return c })() : 'rgb(0,0,0)', cur)
  }
}

/* Plegada: botón, panel y marcador del panel */
const foldFacts = () => {
  const q = (s) => document.querySelector(s)
  const cs = getComputedStyle
  const btn = q('#pi-fold-fold'), drop = q('#pi-fold-drop'), top = q('#pi-fold .g-page-index__top')
  const cur = q('#pi-fold [aria-current="location"]'), other = q('#pi-fold .g-page-index__link:not([aria-current])')
  const d = drop.getBoundingClientRect(), b = btn.getBoundingClientRect()
  const rtl = cs(btn).direction === 'rtl'
  const out = {
    btnH: b.height, btnW: b.width, btnFs: parseFloat(cs(btn).fontSize), btn: __pi.c(cs(btn).color, btn),
    dropL: d.left, dropR: d.right, dropT: d.top, dropB: d.bottom, vw: innerWidth, vh: innerHeight, btnL: b.left, btnR: b.right,
    link: __pi.c(cs(other).color, other), top: __pi.c(cs(top).color, top), topH: top.getBoundingClientRect().height,
    rowH: other.getBoundingClientRect().height, rtl, radius: cs(drop).borderTopLeftRadius,
    edge: __pi.c(cs(drop).borderTopColor, drop.parentElement)
  }
  if (cur) {
    const a = cur.getBoundingClientRect(), pe = cs(cur, '::before')
    const rtl = cs(cur).direction === 'rtl' // el enlace lleva dir="auto": manda la dirección de su texto
    const textX = (() => { const r = document.createRange(); r.selectNodeContents(cur); const t = r.getBoundingClientRect(); return rtl ? t.right : t.left })()
    out.current = __pi.c(cs(cur).color, cur)
    out.mk = pe.content !== 'none' && pe.content !== '' && pe.display !== 'none'
    if (out.mk) {
      const w = parseFloat(pe.width), h = parseFloat(pe.height)
      // posición del pseudo: el enlace es su bloque contenedor (position: relative); centrado por margin-block auto
      const start = parseFloat(rtl ? pe.right : pe.left)
      const mx = rtl ? a.right - start - w : a.left + start
      out.mkW = w; out.mkH = h; out.mkC = __pi.c(pe.backgroundColor, drop)
      out.mkInDrop = mx >= d.left && mx + w <= d.right
      out.mkGap = rtl ? mx - textX : textX - (mx + w) // separación hasta el texto, en el sentido de la lectura
      out.mkTop = parseFloat(pe.marginTop) || 0
      out.mkDisp = pe.backgroundColor
    }
    // texto en la misma x que sin marcador: el de un h2 empieza en el relleno del panel
    const first = q('#pi-fold .g-page-index__list > li > .g-page-index__link'), sc = q('#pi-fold .g-page-index__scroll')
    const r = document.createRange(); r.selectNodeContents(first); const t = r.getBoundingClientRect(), s = sc.getBoundingClientRect()
    out.textInset = Math.round(rtl ? s.right - t.right : t.left - s.left)
    out.pad = parseFloat(cs(sc).paddingInlineStart)
  }
  return out
}

async function run(engine) {
  const browser = await pw[engine].launch()
  const ctx = await browser.newContext()
  await ctx.route(/^https:\/\/unpkg\.com\/vue@3[^/]*\/dist\/vue\.global\.js/, (r) => r.fulfill({ path: VUE, contentType: 'application/javascript; charset=utf-8' }))
  const E = (m) => `[${engine}] ${m}`
  const configs = [['defecto', '', false, false], ['defecto', '', true, false], ['zona de marca', '', false, true], ['zona de marca', '', true, true],
    ...GEN.flatMap((t) => [[t, genCss[t], false, false], [t, genCss[t], true, false]])]

  for (const [name, theme, dark, zone] of configs) {
    const label = `${name} ${dark ? 'oscuro' : 'claro'}`
    /* Columna a 1280 en cuatro posiciones */
    {
      const { page, errs } = await openPage(ctx, { qs: `?sections=12${dark ? '&dark=1' : ''}`, theme, zone })
      let row
      for (const id of ['s2', 's4a', 's7', 's10b']) {
        await toSection(page, id)
        const f = await page.evaluate(columnFacts)
        ok(f.currents === 1 && f.hasCurrent, E(`${label} · ${id}: una sola actual y has-current`))
        ok(f.mOff <= 1.5, E(`${label} · ${id}: marcador centrado en la fila (${f.mOff})`))
        ok(f.mOnLine <= 1, E(`${label} · ${id}: marcador sobre la línea guía (${f.mOnLine})`))
        ok(Math.abs(f.mW - f.bw * 2) <= 0.5 && Math.abs(f.mH - 18) <= 0.5, E(`${label} · ${id}: marcador 2 × 18 (${f.mW} × ${f.mH})`))
        row = f
      }
      ok(row.link >= 4.5, E(`${label}: enlace ${row.link} ≥ 4,5`))
      ok(row.current >= 4.5, E(`${label}: actual ${row.current} ≥ 4,5`))
      ok(row.title >= 4.5, E(`${label}: título ${row.title} ≥ 4,5`))
      ok(row.marker >= 3, E(`${label}: marcador ${row.marker} ≥ 3 (señal de forma, 1.4.1)`))
      ok(row.markerOpacity === 1, E(`${label}: marcador visible`))
      ok(row.focusRing >= 3, E(`${label}: anillo de foco ${row.focusRing} ≥ 3`))
      ok(row.rowH >= 24 && row.linkFs >= 12 && row.titleFs >= 12, E(`${label}: filas ≥ 24 (${row.rowH}) y texto ≥ 12`))
      /* Foco por teclado en un enlace de la columna */
      await page.evaluate(() => document.querySelector('#pi-list .g-page-index__scroll').focus())
      await page.keyboard.press('Tab')
      const fo = await page.evaluate(() => { const a = document.activeElement; const c = getComputedStyle(a); return { isLink: a.classList.contains('g-page-index__link'), w: parseFloat(c.outlineWidth), s: c.outlineStyle, o: parseFloat(c.outlineOffset) } })
      ok(fo.isLink && fo.s === 'solid' && fo.w >= 2 && fo.o >= -fo.w, E(`${label}: foco visible en el enlace (${JSON.stringify(fo)})`))
      ok(errs.length === 0, E(`${label}: consola limpia en la columna (${errs.join(' | ')})`))
      table.push({ engine, label, link: row.link, current: row.current, title: row.title, between: row.between, marker: row.marker, line: row.line, focus: row.focusRing })
      await page.close()
    }
    /* Plegada a 1024: botón, panel y marcador del panel */
    {
      const { page, errs } = await openPage(ctx, { width: 1024, height: 700, qs: `?sections=12${dark ? '&dark=1' : ''}`, theme, zone })
      await toSection(page, 's3')
      await page.click('#pi-fold-fold')
      await page.waitForTimeout(80)
      const f = await page.evaluate(foldFacts)
      ok(f.btn >= 4.5, E(`${label} · fold: botón ${f.btn} ≥ 4,5`))
      ok(f.btnH >= 24 && f.btnFs >= 12, E(`${label} · fold: botón ≥ 24 de alto (${f.btnH}) y texto ≥ 12 (${f.btnFs})`))
      ok(f.link >= 4.5 && f.current >= 4.5, E(`${label} · fold: enlaces ${f.link} / actual ${f.current} ≥ 4,5`))
      ok(f.top >= 4.5, E(`${label} · fold: «Volver arriba» ${f.top} ≥ 4,5`))
      ok(f.dropL >= 0 && f.dropR <= f.vw + 0.5 && f.dropB <= f.vh + 0.5, E(`${label} · fold: panel dentro del visor (${f.dropL}, ${f.dropR}, ${f.dropB})`))
      ok(f.mk === true, E(`${label} · fold: el marcador se pinta en la fila actual del panel (contrato «Plegada» 6, 1.4.1)`))
      if (f.mk) {
        ok(f.mkW === 2 && f.mkH === 18, E(`${label} · fold: marcador del panel 2 × 18 (${f.mkW} × ${f.mkH})`))
        ok(f.mkC >= 3, E(`${label} · fold: marcador del panel ${f.mkC} ≥ 3`))
        if (label === 'defecto claro') notes.push(E(`fold: marcador del panel a ${f.mkGap} px del texto; texto a ${f.textInset} px del borde del desplazador`))
        ok(f.mkInDrop && f.mkGap >= 4, E(`${label} · fold: marcador dentro del panel y antes del texto (separación ${f.mkGap})`))
        ok(f.textInset === f.pad, E(`${label} · fold: el texto no se mueve (${f.textInset} = relleno ${f.pad})`))
      }
      table.find((r) => r.engine === engine && r.label === label).fold = { btn: f.btn, link: f.link, current: f.current, top: f.top, marker: f.mkC ?? '—', edge: f.edge }
      ok(errs.length === 0, E(`${label}: consola limpia en la plegada (${errs.join(' | ')})`))
      if (args.shots && (name === 'defecto' || name === 'spotify')) { await mkdir(SHOTS, { recursive: true }); await page.screenshot({ path: `${SHOTS}/fold-1024-${name}-${dark ? 'oscuro' : 'claro'}-${engine}.png` }) }
      await page.close()
    }
  }

  /* Plegada a 375: dentro del visor en horizontal siempre; en vertical tras desplazar (con la banda ya ida) */
  for (const dark of [false, true]) {
    const { page, errs } = await openPage(ctx, { width: 375, height: 700, qs: `?sections=12${dark ? '&dark=1' : ''}` })
    await page.click('#pi-fold-fold')
    await page.waitForTimeout(80)
    let f = await page.evaluate(foldFacts)
    ok(f.dropL >= 0 && f.dropR <= f.vw + 0.5, E(`375 ${dark ? 'oscuro' : 'claro'} · fold: panel dentro del visor en horizontal (${f.dropL}–${f.dropR})`))
    if (f.dropB > f.vh + 0.5) notes.push(E(`375 ${dark ? 'oscuro' : 'claro'} · arriba del todo: el panel acaba en ${f.dropB} con el visor en ${f.vh} (sobra ${(f.dropB - f.vh).toFixed(1)} px; hallazgo 2 de auditoria.md)`))
    await page.keyboard.press('Escape')
    await toSection(page, 's3')
    await page.click('#pi-fold-fold')
    await page.waitForTimeout(80)
    f = await page.evaluate(foldFacts)
    ok(f.dropB <= f.vh + 0.5 && f.dropR <= f.vw + 0.5 && f.dropL >= 0, E(`375 ${dark ? 'oscuro' : 'claro'} · fold: panel dentro del visor tras desplazar (${f.dropB} ≤ ${f.vh})`))
    ok(f.mk === true, E(`375 ${dark ? 'oscuro' : 'claro'} · fold: marcador del panel`))
    ok(errs.length === 0, E(`375: consola limpia (${errs.join(' | ')})`))
    if (args.shots) { await mkdir(SHOTS, { recursive: true }); await page.screenshot({ path: `${SHOTS}/fold-375-${dark ? 'oscuro' : 'claro'}-${engine}.png` }) }
    await page.close()
  }

  /* Plegada: foco por teclado en el botón, «Volver arriba» y un enlace del panel; Esc */
  {
    const { page } = await openPage(ctx, { width: 1024, height: 700, qs: '?sections=12' })
    await page.focus('#pi-fold-fold')
    await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
    const ring = () => page.evaluate(() => { const a = document.activeElement, c = getComputedStyle(a); return { cls: a.className, s: c.outlineStyle, w: parseFloat(c.outlineWidth) } })
    let r = await ring()
    ok(r.cls === 'g-page-index__fold' && r.s === 'solid' && r.w >= 2, E(`fold: anillo en el botón (${JSON.stringify(r)})`))
    await page.keyboard.press('Enter')
    await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab')
    r = await ring()
    ok(r.cls === 'g-page-index__top' && r.s === 'solid' && r.w >= 2, E(`fold: anillo en «Volver arriba» (${JSON.stringify(r)})`))
    await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab')
    r = await ring()
    ok(/g-page-index__link/.test(r.cls) && r.s === 'solid' && r.w >= 2, E(`fold: anillo en un enlace del panel (${JSON.stringify(r)})`))
    const ex = await page.evaluate(() => { const a = document.activeElement, d = document.getElementById('pi-fold-drop'); const x = a.getBoundingClientRect(), y = d.getBoundingClientRect(); return x.left >= y.left && x.right <= y.right })
    ok(ex, E('fold: el anillo del enlace queda dentro del panel (no lo recorta el borde)'))
    await page.keyboard.press('Escape')
    ok(await page.evaluate(() => document.activeElement.id === 'pi-fold-fold' && document.getElementById('pi-fold-fold').getAttribute('aria-expanded') === 'false'), E('fold: Esc cierra y devuelve el foco'))
    await page.close()
  }

  /* Táctil: pointer: coarse (contexto con toque) */
  if (engine !== 'firefox') {
    const tctx = await browser.newContext({ hasTouch: true, isMobile: engine === 'chromium' })
    await tctx.route(/^https:\/\/unpkg\.com\/vue@3[^/]*\/dist\/vue\.global\.js/, (r) => r.fulfill({ path: VUE, contentType: 'application/javascript; charset=utf-8' }))
    const { page } = await openPage(tctx, { width: 375, height: 700, qs: '?sections=12' })
    ok(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), E('táctil: pointer: coarse activo'))
    await toSection(page, 's2')
    const b = await page.locator('#pi-fold-fold').boundingBox()
    ok(b.height >= 44, E(`táctil: botón ${b.height} ≥ 44`))
    await page.locator('#pi-fold-fold').tap()
    await page.waitForTimeout(80)
    const t = await page.evaluate(() => [...document.querySelectorAll('#pi-fold .g-page-index__top, #pi-fold .g-page-index__link')].map((a) => a.getBoundingClientRect().height))
    ok(t.every((h) => h >= 44), E(`táctil: «Volver arriba» y filas ≥ 44 (mín. ${Math.min(...t)})`))
    const f = await page.evaluate(foldFacts)
    ok(f.mk && f.mkH === 18, E('táctil: el marcador del panel sigue en 2 × 18 en la fila de 44'))
    const tl = await page.evaluate(() => { const nav = document.getElementById('pi-list'); return getComputedStyle(nav.querySelector('.g-page-index__link')).lineHeight })
    ok(tl === '44px', E(`táctil: filas de la columna a 44 (${tl})`))
    await page.close(); await tctx.close()
  }

  /* RTL: marcador en la línea del borde inicial (derecha), panel alineado al inicio, chevron hacia abajo al abrir */
  {
    const { page, errs } = await openPage(ctx, { qs: '?sections=12&dir=rtl' })
    await toSection(page, 's4a')
    const f = await page.evaluate(columnFacts)
    ok(f.mOnLine <= 1 && f.mOff <= 1.5, E(`RTL: marcador sobre la línea guía derecha (${f.mOnLine}) y centrado (${f.mOff})`))
    const side = await page.evaluate(() => { const b = document.querySelector('#pi-list .g-page-index__body'); const m = document.querySelector('#pi-list .g-page-index__marker').getBoundingClientRect(); return m.left > b.getBoundingClientRect().left + b.getBoundingClientRect().width / 2 })
    ok(side, E('RTL: el marcador está en el borde derecho'))
    await page.setViewportSize({ width: 1024, height: 700 }); await settle(page)
    await toSection(page, 's3')
    await page.click('#pi-fold-fold'); await page.waitForTimeout(300)
    // Etiquetas en árabe (dir="auto" las resuelve RTL; el banco solo trae etiquetas en español, que siguen LTR)
    await page.evaluate(() => document.querySelectorAll('#pi-fold .g-page-index__link').forEach((a, i) => { a.textContent = 'القسم ' + 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'[i % 28] }))
    const g = await page.evaluate(foldFacts)
    ok(g.rtl && Math.abs(g.dropR - g.btnR) <= 1, E(`RTL: con align="start" el panel se alinea al borde derecho del botón (${g.dropR} / ${g.btnR})`))
    ok(g.mk && g.mkInDrop && g.mkGap >= 4 && g.textInset === g.pad, E(`RTL: marcador del panel a la derecha del texto (${g.mkGap}), texto sin mover`))
    const chev = await page.evaluate(() => { const s = document.querySelector('#pi-fold .g-page-index__chev'); const r = getComputedStyle(s).rotate; const svg = s.querySelector('svg'); return { r, flip: getComputedStyle(svg).scale } })
    ok(chev.r === '-90deg' && chev.flip === '-1 1', E(`RTL: chevron volteado y girado −90° al abrir (apunta abajo) (${JSON.stringify(chev)})`))
    ok(errs.length === 0, E(`RTL: consola limpia (${errs.join(' | ')})`))
    await page.close()
  }

  /* Movimiento: transiciones contratadas (sin reducir) y movimiento reducido */
  {
    const { page } = await openPage(ctx, { width: 1280, qs: '?sections=12', motion: 'no-preference' })
    const m = await page.evaluate(() => { const c = getComputedStyle(document.querySelector('#pi-list .g-page-index__marker')); return { p: c.transitionProperty, d: c.transitionDuration, f: c.transitionTimingFunction } })
    ok(/translate/.test(m.p) && /0\.24s/.test(m.d) && /cubic-bezier\(0\.23, 1, 0\.32, 1\)/.test(m.f), E(`movimiento: marcador translate 240 ms ease-out (${JSON.stringify(m)})`))
    // Interrumpible: un cambio a mitad del viaje parte de donde está (sin saltos al origen)
    await toSection(page, 's2'); await page.waitForTimeout(400)
    const y0 = await page.evaluate(() => document.querySelector('#pi-list .g-page-index__marker').getBoundingClientRect().top)
    await page.evaluate(() => { const el = document.getElementById('s6'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 120) })
    await page.waitForTimeout(90)
    const yMid = await page.evaluate(() => document.querySelector('#pi-list .g-page-index__marker').getBoundingClientRect().top)
    await page.evaluate(() => { const el = document.getElementById('s3'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 120) })
    await page.waitForTimeout(16)
    const yAfter = await page.evaluate(() => document.querySelector('#pi-list .g-page-index__marker').getBoundingClientRect().top)
    await page.waitForTimeout(400)
    const yEnd = await page.evaluate(() => document.querySelector('#pi-list .g-page-index__marker').getBoundingClientRect().top)
    notes.push(E(`movimiento: marcador interrumpido s2 → s6 → s3: ${[y0, yMid, yAfter, yEnd].map(Math.round).join(' → ')} px`))
    ok(yMid > y0 && Math.abs(yAfter - yMid) < Math.abs(yMid - y0) + 40 && yEnd < yMid, E(`movimiento: interrumpible (${[y0, yMid, yAfter, yEnd].map(Math.round).join(' → ')})`))
    await page.setViewportSize({ width: 1024, height: 700 }); await settle(page)
    const ch = await page.evaluate(() => { const c = getComputedStyle(document.querySelector('#pi-fold .g-page-index__chev')); return { p: c.transitionProperty, d: c.transitionDuration } })
    ok(/rotate/.test(ch.p) && /0\.24s/.test(ch.d), E(`movimiento: chevron rotate 240 ms (${JSON.stringify(ch)})`))
    await page.close()
  }
  {
    const { page } = await openPage(ctx, { width: 1280, qs: '?sections=12', motion: 'reduce' })
    const m = await page.evaluate(() => { const c = getComputedStyle(document.querySelector('#pi-list .g-page-index__marker')); return { p: c.transitionProperty, d: c.transitionDuration } })
    ok(m.p === 'opacity' && /0\.12s/.test(m.d), E(`reducido: el marcador solo se funde (${JSON.stringify(m)})`))
    await page.setViewportSize({ width: 1024, height: 700 }); await settle(page)
    await page.click('#pi-fold-fold'); await page.waitForTimeout(50)
    const r = await page.evaluate(() => { const c = getComputedStyle(document.querySelector('#pi-fold .g-page-index__chev')); const d = getComputedStyle(document.getElementById('pi-fold-drop')); return { chev: c.transitionProperty + ' ' + c.transitionDuration, drop: d.transitionDuration, dropTr: d.translate } })
    ok(/0s/.test(r.chev) && /^0s/.test(r.drop) && r.dropTr === 'none', E(`reducido: el chevron gira al instante y el panel abre sin desplazamiento (${JSON.stringify(r)})`))
    const links = await page.evaluate(() => getComputedStyle(document.querySelector('#pi-list .g-page-index__link')).transitionProperty)
    ok(links === 'color', E(`reducido: los enlaces solo cambian de color (${links})`))
    await page.close()
  }

  /* forced-colors (emulado; solo Chromium lo emula) */
  if (engine === 'chromium') {
    for (const dark of [false, true]) {
      const { page } = await openPage(ctx, { width: 1280, qs: `?sections=12${dark ? '&dark=1' : ''}`, forced: 'active' })
      await toSection(page, 's4a')
      const f = await page.evaluate(() => {
        const cs = getComputedStyle
        const mk = document.querySelector('#pi-list .g-page-index__marker'), cur = document.querySelector('#pi-list [aria-current]')
        const hl = (() => { const i = document.createElement('i'); i.style.color = 'Highlight'; document.body.append(i); const c = cs(i).color; i.remove(); return c })()
        return { mk: cs(mk).backgroundColor, hl, op: cs(mk).opacity, u: cs(cur).textDecorationLine, line: cs(document.querySelector('#pi-list .g-page-index__body')).borderInlineStartStyle }
      })
      ok(f.mk === f.hl && f.op === '1', E(`forced-colors ${dark ? 'oscuro' : 'claro'}: marcador en Highlight (${f.mk})`))
      ok(f.u === 'underline' && f.line === 'solid', E(`forced-colors ${dark ? 'oscuro' : 'claro'}: actual subrayada y línea guía visible`))
      await page.setViewportSize({ width: 1024, height: 700 }); await settle(page)
      await toSection(page, 's3')
      await page.click('#pi-fold-fold'); await page.waitForTimeout(60)
      const g = await page.evaluate(() => {
        const cs = getComputedStyle
        const cur = document.querySelector('#pi-fold [aria-current]')
        const hl = (() => { const i = document.createElement('i'); i.style.color = 'Highlight'; document.body.append(i); const c = cs(i).color; i.remove(); return c })()
        const pe = cs(cur, '::before')
        return { pk: pe.backgroundColor, hl, u: cs(cur).textDecorationLine, edge: cs(document.getElementById('pi-fold-drop')).borderTopStyle }
      })
      ok(g.pk === g.hl && g.u === 'underline' && g.edge === 'solid', E(`forced-colors ${dark ? 'oscuro' : 'claro'}: panel con borde, actual subrayada y marcador en Highlight (${JSON.stringify(g)})`))
      if (args.shots) { await mkdir(SHOTS, { recursive: true }); await page.screenshot({ path: `${SHOTS}/forced-${dark ? 'oscuro' : 'claro'}.png` }) }
      await page.close()
    }
  }

  /* Sin chasis: la columna sigue con alto máximo válido (las propiedades de GAppShell tienen valor inicial) */
  {
    const { page, errs } = await openPage(ctx, { width: 1280, height: 700, qs: '?sections=30&shell=0' })
    const mb = await page.evaluate(() => getComputedStyle(document.querySelector('#pi-list .g-page-index__scroll')).maxBlockSize)
    ok(/px$/.test(mb) && parseFloat(mb) > 100, E(`sin chasis: max-block-size de la columna resuelto (${mb})`))
    ok(errs.length === 0, E(`sin chasis: consola limpia (${errs.join(' | ')})`))
    await page.close()
  }

  await browser.close()
}

for (const e of ENGINES) await run(e)
if (server) server.close()

if (args.verbose) {
  console.log('engine · tema · enlace / actual / título / actual↔enlace / marcador / línea / anillo · fold: botón / enlace / actual / arriba / marcador / filo')
  for (const r of table) console.log(`${r.engine} · ${r.label} · ${r.link} / ${r.current} / ${r.title} / ${r.between} / ${r.marker} / ${r.line} / ${r.focus} · ${r.fold ? Object.values(r.fold).join(' / ') : ''}`)
}
const min = (k, sub) => Math.min(...table.map((r) => (sub ? r.fold?.[k] : r[k])).filter((v) => typeof v === 'number'))
console.log(`mínimos · enlace ${min('link')} · actual ${min('current')} · título ${min('title')} · marcador ${min('marker')} · anillo ${min('focus')} · fold: botón ${min('btn', 1)} · enlace ${min('link', 1)} · actual ${min('current', 1)} · arriba ${min('top', 1)} · marcador ${min('marker', 1)}`)
for (const n of notes) console.log('NOTA ' + n)
for (const f of fails) console.log('FALLA ' + f)
console.log(`${total - failed}/${total} (${ENGINES.join(', ')})`)
process.exit(failed ? 1 : 0)
