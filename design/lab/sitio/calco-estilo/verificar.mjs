// Banco de estilo del calco (coco): GNavBar.css, GPageIndex.css (list y fold), GCombobox.css (command), GAppShell.css
// (pinned-wide, barra local, is-covered) y grana-site.css, medidos contra la referencia congelada del sitio anterior
// (design/lab/sitio/referencia/medidas.json) con las tolerancias de sitio-marco.md §12, más contraste, área táctil, foco,
// P1, movimiento reducido, colores forzados y RTL.
// Ejecutar desde la raíz: node design/lab/sitio/calco-estilo/verificar.mjs
//   Puerto 4240 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  VERBOSE=1  SHOTS=1 (capturas en esta carpeta)
// Requiere packages/vue/dist, node_modules/vue y node_modules/vitepress. Escribe paridad.json y resultados.json aquí.
import http from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const HERE = fileURLToPath(new URL('./', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4240)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/sitio/calco-estilo/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const REF = JSON.parse(await readFile(join(ROOT, 'design/lab/sitio/referencia/medidas.json'), 'utf8'))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const V = !!process.env.VERBOSE
const SHOTS = process.env.SHOTS === '1'
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok, info: String(info).slice(0, 300) }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }
const PAR = []

const helpers = `
window.__ratio = (a, b) => { const parse = (c) => { const x = document.createElement('canvas').getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0,0,1,1); const d = x.getImageData(0,0,1,1).data; return [d[0], d[1], d[2], d[3] / 255] }; const over = (f, g) => [0,1,2].map((i) => f[i] * f[3] + g[i] * (1 - f[3])); const lum = (p) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]) }; const B = parse(b); const bb = B[3] < 1 ? over(B, [255,255,255]) : B; const A = parse(a); const aa = A[3] < 1 ? over(A, bb) : A; const x = lum(aa), y = lum(bb); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) };
window.__bg = (el) => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c } return getComputedStyle(document.body).backgroundColor };
window.__vis = (s) => [...document.querySelectorAll(s)].find((x) => { if (!x.getClientRects().length) return false; const cs = getComputedStyle(x); return cs.visibility !== 'hidden' });
window.__box = (s) => { const e = window.__vis(s); if (!e) return null; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); const r1 = (v) => Math.round(v * 10) / 10; return { x: r1(r.x), y: r1(r.y), w: r1(r.width), h: r1(r.height), ff: cs.fontFamily.split(',')[0].replace(/"/g, '').trim(), fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, color: cs.color, bg: cs.backgroundColor } };
`
const ffOf = (s) => (s || '').split(',')[0].replace(/"/g, '').trim()

// Mapa de piezas: referencia → banco. kind: 'est' (estructura ≤ 1 px) | 'pz' (piezas ≤ 2 px). keys: medidas a comparar.
// typo: comparar familia, tamaño, peso e interlineado; color: comparar el color del texto.
const PIECES = [
  { ref: 'nav', sel: '.g-app-shell__header', kind: 'est', keys: 'yh', name: 'banda (alto 64)' },
  { ref: 'navBarDivider', sel: '.g-app-shell__header', kind: 'est', keys: 'xw', name: 'banda (línea: x y ancho)' },
  { ref: 'title', sel: '.g-nav-bar__brand .site-brand', kind: 'pz', keys: 'xywh', name: 'marca', onlyIf: (r) => r.box.w < 150 },
  { ref: 'titleText', sel: '.g-nav-bar__brand .site-brand__name', kind: 'pz', keys: 'xh', name: 'marca (texto)', typo: true, color: true, onlyIf: (r, v) => v.p === 'home' || v.w < 960, wTol: 2 },
  { ref: 'searchButton', sel: '.site-search', kind: 'pz', keys: 'xywh', name: 'búsqueda (botón)' },
  { ref: 'searchPlaceholder', sel: '.site-search__text', kind: 'pz', keys: 'x', name: 'búsqueda (texto)', typoNoLh: true, color: true },
  { ref: 'menu', sel: '.g-nav-bar__nav', kind: 'pz', keys: 'xywh', name: 'enlaces (bloque)' },
  { ref: 'menuLink', sel: '.g-nav-bar__link', kind: 'pz', keys: 'xywh', name: 'primer enlace', typo: true, color: true },
  { ref: 'menuLinkActive', sel: '.g-nav-bar__link[aria-current="page"]', kind: 'pz', keys: 'xywh', name: 'enlace actual', typo: true, color: true },
  { ref: 'translationsButton', sel: '.site-lang', kind: 'pz', keys: 'xywh', name: 'idioma' },
  { ref: 'switch', sel: '.g-nav-bar__actions .site-theme .g-switch__control', kind: 'pz', keys: 'xywh', name: 'interruptor' },
  { ref: 'extraButton', sel: '.g-nav-bar__more-btn', kind: 'pz', keys: 'xywh', name: '«…»' },
  { ref: 'hamburger', sel: '.g-nav-bar__toggle', kind: 'pz', keys: 'xywh', name: 'hamburguesa' },
  { ref: 'localNav', sel: '.site-local', kind: 'est', keys: 'yh', name: 'barra local (48)' },
  { ref: 'localNavOutline', sel: '#pi-fold .g-page-index__fold', kind: 'pz', keys: 'xywh', name: 'desplegable (botón)', typo: true, color: true },
  { ref: 'outline', sel: '#pi-list', kind: 'est', keys: 'xyw', name: 'columna «En esta página»' },
  { ref: 'outlineTitle', sel: '#pi-list .g-page-index__title', kind: 'pz', keys: 'xywh', name: '«En esta página» (título)', typo: true, color: true },
  { ref: 'outlineLink', sel: '#pi-list .g-page-index__link', colorSel: '#pi-list .g-page-index__link:not([aria-current])', kind: 'pz', keys: 'xywh', name: '«En esta página» (enlace h2)', typo: true, color: true },
  { ref: 'outlineLinkNested', sel: '#pi-list .g-page-index__sub .g-page-index__link:not([aria-current])', kind: 'pz', keys: 'xwh', name: '«En esta página» (enlace h3)', typo: true, color: true },
  { ref: 'outlineMarker', sel: '#pi-list .g-page-index__marker', kind: 'pz', keys: 'xwh', name: 'marcador' },
  { ref: 'h1', sel: '.site-content h1', kind: 'est', keys: 'xywh', name: 'h1', typo: true, color: true, wTol: 1 },
  { ref: 'docContentContainer', sel: '.site-content .vp-doc', kind: 'est', keys: 'xyw', name: 'columna de texto' },
  { ref: 'pager', sel: '.site-pager__card', kind: 'pz', keys: 'xwh', name: 'tarjeta anterior/siguiente' },
  { ref: 'pagerDesc', sel: '.site-pager__label', kind: 'pz', keys: 'h', name: 'tarjeta (rótulo)', typo: true, color: true },
  { ref: 'pagerTitle', sel: '.site-pager__title', kind: 'pz', keys: 'h', name: 'tarjeta (título)', typo: true, color: true },
  { ref: 'footer', sel: '.g-app-shell__footer', kind: 'est', keys: 'xwh', name: 'pie (portada)' }
]
// Desviaciones aceptadas de sitio-marco.md §12 (cada una con su cota)
const allow = (v, piece, k, d) => {
  // 2: «…» a 1024 dentro del visor: lo que queda a su izquierda puede correrse ≤ 4 px
  if (v.w >= 960 && v.w < 1280 && v.p !== 'home' && ['menu', 'menuLink', 'menuLinkActive', 'extraButton'].includes(piece.ref) && k === 'x' && Math.abs(d) <= 4) return 'desviación 2'
  if (v.w >= 960 && v.w < 1280 && v.p !== 'home' && piece.ref === 'extraButton' && k === 'x' && Math.abs(d) <= 4) return 'desviación 2'
  // 3: botón de búsqueda a 1024 con la columna: ancho ≤ el del original
  if (piece.ref === 'searchButton' && k === 'w' && d < 0 && v.w >= 960 && v.w < 1280 && v.p !== 'home') return 'desviación 3'
  // 7: la fuente serif desde otro origen: ancho del texto ≤ 2
  return null
}

const views = []
for (const p of ['comp', 'guide', 'blocks', 'home']) for (const w of [1280, 1024, 768, 375, 320]) views.push({ p, w })
const refName = { comp: 'combobox', guide: 'empezar', blocks: 'blocks', home: 'portada' }

for (const eng of ENGINES) {
  const browser = await pw[eng].launch()
  for (const theme of ['claro', 'oscuro']) {
    for (const v of views) {
      const page = await browser.newPage({ viewport: { width: v.w, height: v.w < 768 ? 740 : 800 } })
      const errs = []
      page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
      page.on('pageerror', (e) => errs.push('pageerror ' + e.message))
      const part = `${v.p}/${theme}/${v.w}`
      await page.goto(`${BASE}?p=${v.p}${theme === 'oscuro' ? '&theme=dark' : ''}`, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      await page.addScriptTag({ content: helpers })
      await page.waitForTimeout(350)
      rec(eng, part, 'consola sin errores', errs.length === 0, errs.slice(0, 2).join(' | '))
      const s = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
      rec(eng, part, 'sin desplazamiento horizontal', s.sw <= s.cw, `${s.sw}/${s.cw}`)
      const ref = REF.paginas[`${refName[v.p]}-${v.w}-${theme}`]
      for (const piece of PIECES) {
        const r = ref[piece.ref]
        const b = await page.evaluate((sel) => window.__box(sel), piece.sel)
        const rv = r && r.visible
        if (!rv && !b) continue
        if (piece.onlyIf && rv && !piece.onlyIf(r, v)) continue
        const row = { motor: eng, vista: part, pieza: piece.name, tipo: piece.kind, ref: rv ? r.box : null, banco: b ? { x: b.x, y: b.y, w: b.w, h: b.h } : null }
        if (!rv || !b) {
          row.delta = rv ? 'falta en el banco' : 'sobra en el banco'
          // La marca de la barra con la columna izquierda: el original la pinta en la columna (N-L5); aquí también (fuera de la compuerta, §4)
          const ok = !rv && ['outlineMarker'].includes(piece.ref)
          if (!ok) rec(eng, part, `paridad · ${piece.name}`, false, row.delta)
          PAR.push(row); continue
        }
        const tol = piece.kind === 'est' ? 1 : 2
        row.delta = {}
        const bad = []
        for (const k of piece.keys) {
          const d = Math.round((b[k] - r.box[k]) * 10) / 10
          row.delta[k] = d
          const t = k === 'w' && piece.wTol ? Math.max(tol, piece.wTol) : tol
          if (Math.abs(d) > t + 0.05) { const a = allow(v, piece, k, d); if (a) row.desviacion = a; else bad.push(`${k} ${d}`) }
        }
        if (piece.typo || piece.typoNoLh) {
          const st = r.style
          const tr = { ff: ffOf(st.fontFamily), fs: st.fontSize, fw: st.fontWeight, lh: st.lineHeight }
          const tb = { ff: b.ff, fs: b.fs, fw: b.fw, lh: b.lh }
          const diff = Object.keys(tr).filter((k) => !(piece.typoNoLh && k === 'lh') && String(tr[k]) !== String(tb[k]) && !(k === 'ff' && tr[k].startsWith('Instrument Sans') && tb[k].startsWith('Instrument Sans')))
          row.tipografia = diff.length ? diff.map((k) => `${k} ${tr[k]} → ${tb[k]}`).join('; ') : 'igual'
          if (diff.length) bad.push('tipografía ' + row.tipografia)
        }
        if (piece.colorSel) b.color = (await page.evaluate((sel) => window.__box(sel), piece.colorSel)).color
        if (piece.color) {
          row.color = r.style.color === b.color ? 'igual' : `${r.style.color} → ${b.color}`
          if (r.style.color !== b.color) bad.push('color ' + row.color)
        }
        PAR.push(row)
        rec(eng, part, `paridad · ${piece.name}`, bad.length === 0, bad.join(' · '))
      }
      if (SHOTS && eng === 'chromium') await page.screenshot({ path: join(HERE, `banco-${v.p}-${v.w}-${theme}.png`) })
      await page.close()
    }

    // ---------- Comportamiento y estados a 1280 (ficha) ----------
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await page.goto(`${BASE}?p=comp${theme === 'oscuro' ? '&theme=dark' : ''}`, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.addScriptTag({ content: helpers })
    await page.waitForTimeout(300)
    const part = `1280/${theme}`
    // Contraste (fondo real resuelto bajo cada pieza)
    const c = await page.evaluate(() => {
      const r = (sel) => { const e = window.__vis(sel); return e ? window.__ratio(getComputedStyle(e).color, window.__bg(e)) : null }
      const cur = window.__vis('.g-nav-bar__link[aria-current="page"]'); const rest = window.__vis('.g-nav-bar__link:not([aria-current])')
      return {
        link: r('.g-nav-bar__link:not([aria-current])'), current: r('.g-nav-bar__link[aria-current="page"]'),
        curRest: window.__ratio(getComputedStyle(cur).color, getComputedStyle(rest).color),
        search: r('.site-search'), brand: r('.site-brand__name'), pager: r('.site-pager__label'), pagerTitle: r('.site-pager__title'),
        outTitle: r('#pi-list .g-page-index__title'), outLink: r('#pi-list .g-page-index__link:not([aria-current])'),
        outCur: r('#pi-list .g-page-index__link[aria-current]'),
        marker: (() => { const m = document.querySelector('#pi-list .g-page-index__marker'); return window.__ratio(getComputedStyle(m).backgroundColor, window.__bg(m.parentElement)) })(),
        sep: (() => { const m = window.__vis('.g-nav-bar__sep'); return m ? getComputedStyle(m).blockSize : null })()
      }
    })
    for (const k of ['link', 'current', 'search', 'brand', 'pager', 'pagerTitle', 'outTitle', 'outLink', 'outCur']) rec(eng, part, `contraste ${k} ≥ 4,5:1`, c[k] === null || c[k] >= 4.5, c[k] && c[k].toFixed(2))
    rec(eng, part, 'contraste marcador ≥ 3:1 (forma)', c.marker >= 3, c.marker.toFixed(2))
    rec(eng, part, 'actual frente a reposo ≥ 3:1 (límite aceptado de nav-bar.md)', c.curRest >= 3, c.curRest.toFixed(2))
    rec(eng, part, 'separador 1 × 24', c.sep === '24px', c.sep)
    // P1 · la luz bajo la fila de texto, sin pintar accent ni mover el foco
    await page.mouse.move(640, 600)
    await page.locator('.g-nav-bar__link').nth(2).hover()
    await page.waitForTimeout(450)
    const g = await page.evaluate(() => {
      const l = document.querySelector('.g-nav-bar__highlight'); const a = document.querySelectorAll('.g-nav-bar__link')[2]
      const lb = l.getBoundingClientRect(); const ab = a.getBoundingClientRect()
      return { op: getComputedStyle(l).opacity, dx: Math.abs(lb.left - ab.left), dw: Math.abs(lb.width - ab.width), h: lb.height, cy: Math.abs((lb.top + lb.bottom) / 2 - (ab.top + ab.bottom) / 2), focus: !document.activeElement.closest('.g-nav-bar'), color: getComputedStyle(a).color, text: getComputedStyle(document.querySelector('.g-nav-bar__link:not([aria-current]):not(:hover)')).color, linkW: ab.width }
    })
    rec(eng, part, 'P1 · la luz se posa en el enlace (x, ancho) y cubre la fila de texto (32, centrada)', g.op === '1' && g.dx <= 1 && g.dw <= 1 && Math.abs(g.h - 32) <= 0.5 && g.cy <= 1, JSON.stringify(g))
    rec(eng, part, 'P1 · el hover no pinta accent', g.color === g.text, `${g.color} / ${g.text}`)
    rec(eng, part, 'P1 · el puntero no mueve el foco', g.focus)
    const w0 = await page.evaluate(() => [...document.querySelectorAll('.g-nav-bar__link')].map((a) => a.getBoundingClientRect().width).join())
    await page.mouse.move(640, 600); await page.waitForTimeout(300)
    const w1 = await page.evaluate(() => [...document.querySelectorAll('.g-nav-bar__link')].map((a) => a.getBoundingClientRect().width).join())
    rec(eng, part, 'C · Δ0 de los enlaces con la luz y sin ella', w0 === w1)
    // Foco por teclado en un enlace: anillo de 2 por dentro
    await page.locator('.g-nav-bar__link').nth(1).focus()
    // WebKit no lleva Tab a los enlaces sin «acceso total por teclado»: Alt+Tab es su recorrido de enlaces
    const tab = eng === 'webkit' ? 'Alt+Tab' : 'Tab'
    await page.keyboard.press('Shift+' + tab); await page.keyboard.press(tab)
    const f = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return { cls: document.activeElement.className, st: cs.outlineStyle, w: cs.outlineWidth, off: cs.outlineOffset, ratio: window.__ratio(cs.outlineColor, window.__bg(document.activeElement)) } })
    rec(eng, part, 'foco visible por dentro (2 px, ≥ 3:1)', /g-nav-bar__link/.test(f.cls) && f.st === 'solid' && f.w === '2px' && f.off === '-2px' && f.ratio >= 3, JSON.stringify(f))
    // Búsqueda (command): caja arriba y centrada bajo la banda, 900 de ancho, fondo sunken, pie de teclas
    await page.keyboard.press(eng === 'webkit' ? 'Meta+k' : 'Control+k')
    await page.waitForTimeout(300)
    const sb = await page.evaluate(() => { const d = document.querySelector('#search-surface'); const r = d.getBoundingClientRect(); const cs = getComputedStyle(d); const frag = document.querySelector('#search-surface .g-summary__fact-value'); const hints = document.querySelector('.g-combobox__hints'); return { open: d.open, x: Math.round(r.x * 10) / 10, y: r.y, w: r.width, h: r.height, bg: cs.backgroundColor, radius: cs.borderRadius, pad: cs.paddingTop, shadow: cs.boxShadow, frag: window.__ratio(getComputedStyle(frag).color, cs.backgroundColor), hints: window.__ratio(getComputedStyle(hints).color, cs.backgroundColor), searchH: document.querySelector('#search-surface .g-combobox__search').getBoundingClientRect().height, focus: document.activeElement.classList.contains('g-combobox__search-field') } })
    const refS = REF.estados[`busqueda-1280-${theme}`]
    PAR.push({ motor: eng, vista: part, pieza: 'búsqueda abierta (panel)', tipo: 'pz', ref: { x: refS.box[0], y: refS.box[1], w: refS.box[2], h: refS.box[3] }, banco: { x: sb.x, y: sb.y, w: sb.w, h: sb.h }, delta: { x: sb.x - refS.box[0], y: sb.y - refS.box[1], w: sb.w - refS.box[2], h: Math.round(sb.h - refS.box[3]) }, nota: 'h depende del estado (la referencia: sin resultados); el banco con 3' })
    rec(eng, part, 'búsqueda: caja x, y, ancho ≤ 2 (calco 190, 64, 900)', sb.open && Math.abs(sb.x - refS.box[0]) <= 2 && Math.abs(sb.y - refS.box[1]) <= 2 && Math.abs(sb.w - refS.box[2]) <= 2, JSON.stringify(sb))
    rec(eng, part, 'búsqueda: fondo, radio 6, relleno 12, sin sombra (calco)', sb.bg === refS.bg && sb.radius === refS.radius && sb.pad === refS.padding && sb.shadow === 'none', `${sb.bg}/${refS.bg} ${sb.radius} ${sb.pad} ${sb.shadow}`)
    rec(eng, part, 'búsqueda: campo de 44 con el foco', Math.abs(sb.searchH - 44) <= 0.5 && sb.focus, sb.searchH)
    rec(eng, part, 'búsqueda: fragmento y pie ≥ 4,5:1 sobre surface-sunken', sb.frag >= 4.5 && sb.hints >= 4.5, `${sb.frag.toFixed(2)} / ${sb.hints.toFixed(2)}`)
    if (SHOTS && eng === 'chromium') await page.screenshot({ path: join(HERE, `banco-estado-busqueda-1280-${theme}.png`) })
    await page.keyboard.press('Escape')
    await page.close()

    // ---------- «…» a 1024 ----------
    for (const p of ['comp', 'home']) {
      const p2 = await browser.newPage({ viewport: { width: 1024, height: 800 } })
      await p2.goto(`${BASE}?p=${p}${theme === 'oscuro' ? '&theme=dark' : ''}`, { waitUntil: 'networkidle' })
      await p2.evaluate(() => document.fonts.ready)
      await p2.locator('.g-nav-bar__more-btn').click()
      await p2.waitForTimeout(350)
      const mo = await p2.evaluate(() => { const pn = document.querySelector('.g-nav-bar__more-panel'); const r = pn.getBoundingClientRect(); const b = document.querySelector('.g-nav-bar__more-btn').getBoundingClientRect(); return { open: pn.matches(':popover-open'), exp: document.querySelector('.g-nav-bar__more-btn').getAttribute('aria-expanded'), x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, btnRight: b.right, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth } })
      const refM = REF.estados[`mas-1024-${theme}`]
      PAR.push({ motor: eng, vista: `mas/${p}/${theme}`, pieza: '«…» abierto (panel)', tipo: 'pz', ref: { x: refM.box[0], y: refM.box[1], w: refM.box[2], h: refM.box[3] }, banco: mo, delta: { right: Math.round(mo.right - (refM.box[0] + refM.box[2])), y: Math.round(mo.y - refM.box[1]), w: Math.round(mo.w - refM.box[2]), h: Math.round(mo.h - refM.box[3]) } })
      rec(eng, `mas/${p}/${theme}`, '«…» abre bajo el botón, alineado a su final, solapando 12 (y 52) y dentro del visor', mo.open && mo.exp === 'true' && Math.abs(mo.right - mo.btnRight) <= 1 && Math.abs(mo.y - 52) <= 2 && mo.right <= 1024 && mo.sw <= mo.cw, JSON.stringify(mo))
      rec(eng, `mas/${p}/${theme}`, '«…» ancho y alto ≤ 2 del calco (202 × 142)', Math.abs(mo.w - refM.box[2]) <= 2 && Math.abs(mo.h - refM.box[3]) <= 2, `${mo.w} × ${mo.h}`)
      if (SHOTS && eng === 'chromium' && p === 'comp') await p2.screenshot({ path: join(HERE, `banco-estado-mas-1024-${theme}.png`) })
      await p2.close()
    }

    // ---------- Pantalla de menú y desplegable a 375 (táctil) ----------
    const p3 = await browser.newPage({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: eng !== 'firefox' })
    await p3.goto(`${BASE}?p=comp${theme === 'oscuro' ? '&theme=dark' : ''}`, { waitUntil: 'networkidle' })
    await p3.evaluate(() => document.fonts.ready)
    await p3.addScriptTag({ content: helpers })
    const coarse = await p3.evaluate(() => matchMedia('(pointer: coarse)').matches)
    const touch = await p3.evaluate(() => [...document.querySelectorAll('.g-nav-bar__toggle, .site-search, .site-brand, .site-local__menu, .g-page-index__fold')].filter((e) => e.getClientRects().length).map((e) => { const r = e.getBoundingClientRect(); return [e.className.split(' ')[0], Math.round(r.width), Math.round(r.height)] }))
    if (coarse) rec(eng, `375/${theme}`, 'pointer: coarse · todo lo pulsable ≥ 44', touch.every(([, w, h]) => w >= 44 && h >= 44), JSON.stringify(touch))
    else rec(eng, `375/${theme}`, 'sin pointer: coarse en este motor (no se mide el táctil)', true, JSON.stringify(touch))
    await p3.locator('.g-nav-bar__toggle').click()
    await p3.waitForTimeout(250)
    const sc = await p3.evaluate(() => { const s = document.querySelector('.g-nav-bar__screen'); const r = s.getBoundingClientRect(); const rows = [...s.querySelectorAll('.g-nav-bar__screen-link')].map((a) => { const b = a.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.width), Math.round(b.height)] }); const a0 = s.querySelector('.g-nav-bar__screen-link'); const cs = getComputedStyle(a0); return { x: r.x, y: r.y, w: r.width, h: r.height, rows, fs: cs.fontSize, fw: cs.fontWeight, bb: cs.borderBottomWidth, ratio: window.__ratio(cs.color, getComputedStyle(s).backgroundColor), cur: window.__ratio(getComputedStyle(s.querySelector('[aria-current]')).color, getComputedStyle(s).backgroundColor), inside: s.contains(document.activeElement) } })
    const refMM = REF.estados[`menu-movil-375-${theme}`]
    PAR.push({ motor: eng, vista: `375/${theme}`, pieza: 'menú móvil (pantalla)', tipo: 'pz', ref: { x: refMM.box[0], y: refMM.box[1], w: refMM.box[2], h: refMM.box[3] }, banco: { x: sc.x, y: sc.y, w: sc.w, h: sc.h }, delta: { x: sc.x - refMM.box[0], y: sc.y - refMM.box[1], w: sc.w - refMM.box[2], h: sc.h - refMM.box[3] }, filas: sc.rows })
    rec(eng, `375/${theme}`, 'pantalla: bajo la banda (y 64), visor entero, filas de 48 en 14/500 con línea, columna de 288 a 44', Math.abs(sc.y - 64) <= 1 && Math.abs(sc.w - 375) <= 1 && Math.abs(sc.h - 676) <= 2 && sc.rows.length === 6 && sc.rows.every(([x, w, h]) => h === 48 && Math.abs(x - 44) <= 1 && Math.abs(w - 287) <= 2) && sc.fs === '14px' && sc.fw === '500' && sc.bb === '1px', JSON.stringify(sc))
    rec(eng, `375/${theme}`, 'pantalla: enlaces y actual ≥ 4,5:1; foco dentro', sc.ratio >= 4.5 && sc.cur >= 4.5 && sc.inside, `${sc.ratio.toFixed(2)} / ${sc.cur.toFixed(2)}`)
    if (SHOTS && eng === 'chromium') await p3.screenshot({ path: join(HERE, `banco-estado-menu-movil-375-${theme}.png`) })
    await p3.keyboard.press('Escape')
    await p3.waitForTimeout(150)
    await p3.locator('#pi-fold .g-page-index__fold').click()
    await p3.waitForTimeout(300)
    const dp = await p3.evaluate(() => { const d = document.querySelector('#pi-fold .g-page-index__drop'); const r = d.getBoundingClientRect(); const cs = getComputedStyle(d); const top = d.querySelector('.g-page-index__top'); return { x: r.x, y: r.y, w: r.width, radius: cs.borderRadius, border: cs.borderTopColor, topRatio: window.__ratio(getComputedStyle(top).color, cs.backgroundColor), link: window.__ratio(getComputedStyle(d.querySelector('.g-page-index__link')).color, cs.backgroundColor), sw: document.documentElement.scrollWidth } })
    const refE = REF.estados[`en-esta-pagina-375-${theme}`]
    PAR.push({ motor: eng, vista: `375/${theme}`, pieza: '«En esta página» desplegado', tipo: 'pz', ref: { x: refE.box[0], y: refE.box[1], w: refE.box[2] }, banco: { x: dp.x, y: dp.y, w: dp.w }, delta: { x: dp.x - refE.box[0], y: dp.y - refE.box[1], w: dp.w - refE.box[2] } })
    rec(eng, `375/${theme}`, 'desplegado: x 16, y 104, ancho 343 (≤ 2), radio 8, sin desbordar', Math.abs(dp.x - refE.box[0]) <= 2 && Math.abs(dp.y - refE.box[1]) <= 2 && Math.abs(dp.w - refE.box[2]) <= 2 && dp.radius === refE.radius && dp.sw <= 375, JSON.stringify(dp))
    rec(eng, `375/${theme}`, 'desplegado: «Volver arriba» y enlaces ≥ 4,5:1', dp.topRatio >= 4.5 && dp.link >= 4.5, `${dp.topRatio.toFixed(2)} / ${dp.link.toFixed(2)}`)
    await p3.close()
  }

  // ---------- Movimiento reducido, colores forzados, RTL y otros temas (claro) ----------
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
  const pr = await ctx.newPage()
  await pr.goto(`${BASE}?p=comp`, { waitUntil: 'networkidle' })
  const rm = await pr.evaluate(() => ({ hl: getComputedStyle(document.querySelector('.g-nav-bar__highlight')).transitionProperty, mk: getComputedStyle(document.querySelector('#pi-list .g-page-index__marker')).transitionProperty, chev: getComputedStyle(document.querySelector('#pi-fold .g-page-index__chev')).transitionProperty }))
  rec(eng, 'reducido', 'luz y marcador: solo fundido; chevron sin giro animado', rm.hl === 'opacity' && rm.mk === 'opacity' && (rm.chev === 'all' || rm.chev === 'none' || !/rotate/.test(rm.chev)), JSON.stringify(rm))
  await ctx.close()
  if (eng === 'chromium') {
    const pf = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await pf.emulateMedia({ forcedColors: 'active' })
    await pf.goto(`${BASE}?p=comp`, { waitUntil: 'networkidle' })
    const fc = await pf.evaluate(() => ({ hl: getComputedStyle(document.querySelector('.g-nav-bar__highlight')).display, cur: getComputedStyle(document.querySelector('.g-nav-bar__link[aria-current]')).textDecorationLine, out: getComputedStyle(document.querySelector('#pi-list .g-page-index__link[aria-current]') || document.body).textDecorationLine, band: getComputedStyle(document.querySelector('.g-app-shell__header')).borderBottomStyle }))
    rec(eng, 'forced-colors', 'sin luz; actual de la barra y del índice subrayadas; la banda conserva su línea', fc.hl === 'none' && fc.cur === 'underline' && fc.out === 'underline' && fc.band === 'solid', JSON.stringify(fc))
    await pf.close()
  }
  for (const w of [1280, 375]) {
    const pt = await browser.newPage({ viewport: { width: w, height: 800 } })
    await pt.goto(`${BASE}?p=comp&dir=rtl`, { waitUntil: 'networkidle' })
    await pt.waitForTimeout(250)
    const rt = await pt.evaluate(() => { const ls = [...document.querySelectorAll('.g-nav-bar__link')].filter((a) => a.getClientRects().length).map((a) => a.getBoundingClientRect().x); return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, order: ls.length < 2 || ls[0] > ls[1] } })
    rec(eng, `rtl/${w}`, 'RTL: sin desplazamiento horizontal y los enlaces de derecha a izquierda', rt.sw <= rt.cw && rt.order, JSON.stringify(rt))
    await pt.close()
  }
  for (const tema of ['amazon', 'github', 'spotify', 'stripe']) {
    for (const theme of ['claro', 'oscuro']) {
      const pt = await browser.newPage({ viewport: { width: 1280, height: 800 } })
      await pt.goto(`${BASE}?p=comp&tema=${tema}${theme === 'oscuro' ? '&theme=dark' : ''}`, { waitUntil: 'networkidle' })
      await pt.addScriptTag({ content: helpers })
      await pt.waitForTimeout(250)
      const ct = await pt.evaluate(() => { const r = (sel) => { const e = window.__vis(sel); return e ? window.__ratio(getComputedStyle(e).color, window.__bg(e)) : 99 }; const cur = window.__vis('.g-nav-bar__link[aria-current]'); const rest = window.__vis('.g-nav-bar__link:not([aria-current])'); return { link: r('.g-nav-bar__link:not([aria-current])'), current: r('.g-nav-bar__link[aria-current]'), outLink: r('#pi-list .g-page-index__link:not([aria-current])'), outTitle: r('#pi-list .g-page-index__title'), search: r('.site-search'), pager: r('.site-pager__label'), curRest: window.__ratio(getComputedStyle(cur).color, getComputedStyle(rest).color) } })
      const low = Object.entries(ct).filter(([k, v]) => k !== 'curRest' && v < 4.5)
      rec(eng, `tema ${tema}/${theme}`, 'contraste ≥ 4,5:1 de enlaces, actual, índice, búsqueda y tarjetas', low.length === 0, JSON.stringify(ct))
      console.log(`medida ${eng} tema ${tema}/${theme} · actual/reposo ${ct.curRest.toFixed(2)}:1`)
      await pt.close()
    }
  }
  await browser.close()
}

server.close()
await writeFile(join(HERE, 'paridad.json'), JSON.stringify(PAR, null, 1))
await writeFile(join(HERE, 'resultados.json'), JSON.stringify(R, null, 1))
const byEng = {}
for (const r of R) { byEng[r.eng] ||= [0, 0]; byEng[r.eng][1]++; if (r.ok) byEng[r.eng][0]++ }
console.log(Object.entries(byEng).map(([e, [a, b]]) => `${e} ${a}/${b}`).join(' · '))
const ok = R.filter((r) => r.ok).length
console.log(`total ${ok}/${R.length}`)
process.exitCode = ok === R.length ? 0 : 1
