// Verificación de coco: CSS de filas por página (B · pie que acompaña), puerta (A), despliegue (B) y estado de fila de GTable
// sobre design/lab/table/filas-banco.html (marcado del contrato inyectado, CSS fuente). Mide contraste, columnas quietas,
// foco, hover, táctil, RTL, forced-colors y movimiento reducido en el tema por defecto (claro y oscuro) y en los temas
// generados de dark-color-presence.
// Ejecutar desde la raíz: node design/lab/table/filas-verificar.mjs   (puerto 4228; ENGINES=chromium,firefox,webkit; SHOTS=1)
import http from 'node:http'
import { readFile, readdir, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4228)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(path))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/table/filas-banco.html`
const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const SHOTS = !!process.env.SHOTS
const SHOT_DIR = fileURLToPath(new URL('./filas-capturas/', import.meta.url))
if (SHOTS) await mkdir(SHOT_DIR, { recursive: true })
const THEMES = (await readdir(join(ROOT, 'design/lab/tema-oscuro/dark-color-presence/generated'))).filter((f) => /^[a-z-]+\.css$/.test(f) && !f.includes('variants')).map((f) => f.replace('.css', ''))

const R = []
const rec = (eng, name, ok, info = '') => { R.push({ eng, name, ok: !!ok }); if (!ok || process.env.VERBOSE) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} · ${name}${info !== '' ? ' · ' + info : ''}`) }
const M = []
const measure = (eng, what, val) => M.push({ eng, what, val })

async function open(b, qs, opts = {}) {
  const { vw = 1100, vh = 700, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push(String(e)))
  const pend = new Set()
  p.on('request', (r) => pend.add(r.url())); p.on('requestfinished', (r) => pend.delete(r.url())); p.on('requestfailed', (r) => pend.delete(r.url()))
  try { await p.goto(BASE + qs, { waitUntil: 'domcontentloaded', timeout: 30000 }) } catch (e) { console.log('pendientes:', [...pend]); throw e }
  await p.waitForFunction(() => window.__bench && window.__bench.ready)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(80)
  return { p, context, errs }
}

// Contraste en el navegador: compone colores con alfa sobre el fondo efectivo (fondo de la página → fondo de la celda)
const CONTRAST = `(() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (c) => { cx.clearRect(0,0,1,1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0,0,1,1); const d = cx.getImageData(0,0,1,1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const parse = (c) => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return rgba(c); const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [v[0], v[1], v[2], v[3] ?? 1] }
  const over = (a, b) => [0,1,2].map((i) => a[i] * a[3] + b[i] * (1 - a[3])).concat(1)
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const bgOf = (el) => { const chain = []; for (let n = el; n; n = n.parentElement) chain.push(getComputedStyle(n).backgroundColor); let c = parse(getComputedStyle(document.documentElement).backgroundColor); if (c[3] === 0) c = [255,255,255,1]; for (const s of chain.reverse()) { const v = parse(s); if (v[3] > 0) c = over(v, c) } return c }
  const tok = (name, el = document.body) => { const d = document.createElement('i'); d.style.color = 'var(' + name + ')'; el.append(d); const c = getComputedStyle(d).color; d.remove(); return c }
  return { parse, over, ratio, bgOf, tok }
})()`

async function themeChecks(b, eng, qs, label) {
  const { p, context } = await open(b, qs)
  const r = await p.evaluate((C) => {
    const K = eval(C)
    const out = {}
    // Lomo: tono del borde de inicio del primer <td> contra el fondo de la fila (normal, seleccionada) y contra la marca
    for (const s of ['error', 'warning', 'info', 'success']) {
      const td = document.querySelector(`.g-table__row[data-status="${s}"] > td:first-child`)
      const col = K.parse(getComputedStyle(td).borderInlineStartColor)
      const bg = K.bgOf(td)
      out[`lomo ${s}`] = K.ratio(K.over(col, bg), bg)
      // Sobre la fila seleccionada (primary-soft) y sobre «aquí estabas» (accent-soft)
      for (const t of ['--g-color-primary-soft', '--g-color-accent-soft']) {
        const page = K.bgOf(document.querySelector('.g-table'))
        const tint = K.over(K.parse(K.tok(t)), page)
        out[`lomo ${s} / ${t.replace('--g-color-', '')}`] = K.ratio(K.over(col, tint), tint)
      }
      out[`estilo ${s}`] = getComputedStyle(td).borderInlineStartStyle
    }
    // Sello en la causa: el filo (sombra interior) contra el fondo de la celda
    for (const s of ['error', 'warning']) {
      const td = document.querySelector(`td.g-table__cell--cause[data-status="${s}"]`)
      const m = getComputedStyle(td).boxShadow.match(/rgba?\([^)]+\)|#[0-9a-f]+/i)
      const bg = K.bgOf(td)
      out[`sello ${s}`] = m ? K.ratio(K.over(K.parse(m[0]), bg), bg) : 0
    }
    // Segmentos: tinta sin marcar (text-muted sobre la pista) y marcada (text sobre surface)
    const off = document.querySelector('.g-pagination__size-input:not(:checked) + .g-pagination__size-text')
    const on = document.querySelector('.g-pagination__size-input:checked + .g-pagination__size-text')
    out['cifra sin marcar'] = K.ratio(K.parse(getComputedStyle(off).color), K.bgOf(off))
    out['cifra marcada'] = K.ratio(K.parse(getComputedStyle(on).color), K.bgOf(on))
    out['borde de la marcada / pista'] = K.ratio(K.over(K.parse(getComputedStyle(on).borderTopColor), K.bgOf(on.parentElement.parentElement)), K.bgOf(on.parentElement.parentElement))
    // Flecha del rastro (is-last-opened): icono no textual ≥ 3:1
    const arr = document.querySelector('.g-table__row.is-last-opened .g-table__door-arrow')
    if (arr) out['flecha del rastro'] = K.ratio(K.parse(getComputedStyle(arr).color), K.bgOf(arr))
    return out
  }, CONTRAST)
  for (const [k, v] of Object.entries(r)) {
    if (k.startsWith('estilo')) continue
    measure(eng, `${label} · ${k}`, typeof v === 'number' ? v.toFixed(2) : v)
    const min = k.startsWith('cifra') ? 4.5 : 3
    if (min) rec(eng, `${label} · ${k} ≥ ${min}`, v >= min, v.toFixed(2))
  }
  rec(eng, `${label} · formas del lomo`, r['estilo error'] === 'solid' && r['estilo warning'] === 'dashed' && r['estilo info'] === 'dotted' && r['estilo success'] === 'double', [r['estilo error'], r['estilo warning'], r['estilo info'], r['estilo success']].join('/'))
  await context.close()
}

async function structural(b, eng) {
  // Columnas quietas: la x de cada columna es igual en todas las filas (con y sin estado) y en la cabecera
  for (const qs of ['?v=A', '?v=A&ap=surface', '?v=B', '?v=A&dir=rtl']) {
    const { p, context, errs } = await open(b, qs)
    rec(eng, `${qs} sin errores`, errs.length === 0, errs.join(' | '))
    const xs = await p.evaluate(() => {
      const cols = [...document.querySelectorAll('.g-table__table tr:not(.g-table__detail)')].map((tr) => [...tr.children].slice(1).map((c) => {
        const r = c.getBoundingClientRect(); const s = getComputedStyle(c)
        return Math.round((document.dir === 'rtl' ? r.right - parseFloat(s.paddingRight) : r.left + parseFloat(s.paddingLeft)) * 10) / 10
      }))
      // y el contenido de la primera celda (casilla) arranca en el mismo sitio con y sin lomo
      const firsts = [...document.querySelectorAll('.g-table__table tr:not(.g-table__detail) > :first-child')].map((c) => { const r = c.getBoundingClientRect(); const s = getComputedStyle(c); return Math.round((document.dir === 'rtl' ? r.right - parseFloat(s.borderRightWidth) - parseFloat(s.paddingRight) : r.left + parseFloat(s.borderLeftWidth) + parseFloat(s.paddingLeft)) * 10) / 10 })
      return { cols, firsts }
    })
    const ref = JSON.stringify(xs.cols[1])
    rec(eng, `${qs} · columnas quietas con y sin estado`, xs.cols.slice(1).every((c) => JSON.stringify(c) === ref), ref)
    rec(eng, `${qs} · el contenido de la primera celda arranca igual`, new Set(xs.firsts).size === 1, [...new Set(xs.firsts)].join(','))
    await context.close()
  }

  // A · hover solo en la celda principal y la casilla; la seleccionada lo conserva (#564)
  {
    const { p, context } = await open(b, '?v=A')
    const tok = await p.evaluate((C) => { const K = eval(C); return { sunken: K.tok('--g-color-surface-sunken'), psoft: K.tok('--g-color-primary-soft') } }, CONTRAST)
    await p.hover('.g-table__row[data-key="L-2040"] td:nth-child(3)')
    await p.waitForTimeout(300)
    const h = await p.evaluate(() => [...document.querySelectorAll('.g-table__row[data-key="L-2040"] > td')].map((td) => getComputedStyle(td).backgroundColor))
    rec(eng, 'A · hover: casilla y principal con sunken; el resto sin fondo', h[0] === h[1] && h[2] !== h[1] && h[3] !== h[1] && h[4] !== h[1], h.join(' | '))
    const deco = await p.evaluate(() => { const a = document.querySelector('.g-table__row[data-key="L-2040"] .g-table__door-arrow'); return { op: getComputedStyle(a).opacity, ul: getComputedStyle(document.querySelector('.g-table__row[data-key="L-2040"] .g-table__door')).textDecorationLine } })
    rec(eng, 'A · hover: flecha visible y título subrayado', deco.op === '1' && deco.ul === 'underline', JSON.stringify(deco))
    await p.hover('.g-table__row[data-key="L-2042"] td:nth-child(3)')
    await p.waitForTimeout(300)
    const sel = await p.evaluate(() => [...document.querySelectorAll('.g-table__row[data-key="L-2042"] > td')].map((td) => getComputedStyle(td).backgroundColor))
    rec(eng, 'A · seleccionada conserva primary-soft al pasar (#564)', sel.every((c) => c === sel[0]) && sel[0] !== 'rgba(0, 0, 0, 0)', sel[0])
    // Prueba de impacto: el borde de la celda principal pertenece a la puerta
    const hit = await p.evaluate(() => { const td = document.querySelector('.g-table__row[data-key="L-2045"] .g-table__cell--primary'); const r = td.getBoundingClientRect(); const pts = [[r.left + 2, r.top + 2], [r.right - 2, r.bottom - 2], [r.left + 2, r.bottom - 2]]; return pts.map(([x, y]) => { const e = document.elementFromPoint(x, y); return !!e.closest('.g-table__door') }) })
    rec(eng, 'A · las esquinas de la celda principal son la puerta', hit.every(Boolean), hit.join(','))
    // Foco por teclado: anillo en la celda, no en el enlace
    await p.focus('.g-table__row[data-key="L-2045"] input')
    await p.keyboard.press('Tab')
    // WebKit no lleva Tab a los enlaces (preferencia del sistema): tras la tecla, el foco por programa también es visible
    if (!(await p.evaluate(() => document.activeElement.classList.contains('g-table__door')))) await p.focus('.g-table__row[data-key="L-2045"] .g-table__door')
    const ring = await p.evaluate(() => { const a = document.activeElement; const td = a.closest('td'); return { door: a.classList.contains('g-table__door'), aOut: getComputedStyle(a).outlineStyle, tdOut: getComputedStyle(td).outlineStyle, tdW: getComputedStyle(td).outlineWidth, off: getComputedStyle(td).outlineOffset } })
    rec(eng, 'A · Tab llega a la puerta y el anillo rodea la celda', ring.door && ring.aOut === 'none' && ring.tdOut === 'solid' && parseFloat(ring.off) < 0, JSON.stringify(ring))
    // Rastro: is-last-opened deja la flecha a la vista
    const last = await p.evaluate(() => getComputedStyle(document.querySelector('.is-last-opened .g-table__door-arrow')).opacity)
    rec(eng, 'A · rastro: flecha a la vista en is-last-opened', last === '1', last)
    // tbody sin anclaje nativo; scroll-margin del área desplazable = alto del pie
    const anc = await p.evaluate(() => ({ oa: getComputedStyle(document.querySelector('.g-table__table tbody')).overflowAnchor, sm: getComputedStyle(document.querySelector('.g-table__row[data-key="L-2060"] .g-table__door')).scrollMarginBlockEnd, dock: document.querySelector('.g-pagination').offsetHeight }))
    rec(eng, 'tbody con overflow-anchor: none', anc.oa === 'none' || eng === 'webkit', anc.oa)
    rec(eng, 'scroll-margin-block-end = alto del pie', parseFloat(anc.sm) === anc.dock, `${anc.sm} / ${anc.dock}px`)
    // Pie acoplado: pegado al borde inferior de la ventana, con filo y sombra
    const dock = await p.evaluate(() => { const n = document.querySelector('.g-pagination'); const r = n.getBoundingClientRect(); const s = getComputedStyle(n); return { bottom: Math.round(r.bottom), vh: innerHeight, stuck: n.classList.contains('is-stuck'), bc: s.borderTopColor, sh: s.boxShadow } })
    rec(eng, 'pie acoplado al borde inferior con filo y sombra', Math.abs(dock.bottom - dock.vh) <= 1 && dock.stuck && dock.sh !== 'none' && dock.bc !== 'rgba(0, 0, 0, 0)', JSON.stringify(dock))
    // Tab hasta una fila bajo el pie: queda a la vista por encima del pie
    await p.evaluate(() => scrollTo(0, 0))
    // Foco por programa (lo que hacen Tab, #534 y scrollIntoView) en una casilla muy por debajo del pie. WebKit en
    // Playwright no lleva Tab a botones ni casillas (preferencia del sistema), por eso no se tabula
    await p.keyboard.press('Shift')
    await p.focus('.g-table__row[data-key="L-2058"] input')
    await p.waitForTimeout(150)
    const vis = await p.evaluate(() => { const a = document.activeElement.getBoundingClientRect(); const n = document.querySelector('.g-pagination').getBoundingClientRect(); return { a: Math.round(a.bottom), n: Math.round(n.top) } })
    rec(eng, 'foco: el control enfocado no queda bajo el pie', vis.a <= vis.n, JSON.stringify(vis))
    // Al final de la tabla, el pie vuelve a su sitio sin filo
    await p.evaluate(() => scrollTo(0, document.body.scrollHeight))
    await p.waitForTimeout(250)
    const end = await p.evaluate(() => { const n = document.querySelector('.g-pagination'); return { stuck: n.classList.contains('is-stuck'), bc: getComputedStyle(n).borderTopColor } })
    rec(eng, 'al final el pie se desacopla (sin filo)', !end.stuck && end.bc === 'rgba(0, 0, 0, 0)', JSON.stringify(end))
    if (SHOTS) { await p.evaluate(() => scrollTo(0, 0)); await p.hover('.g-table__row[data-key="L-2041"] td:nth-child(3)'); await p.waitForTimeout(250); await p.screenshot({ path: `${SHOT_DIR}${eng}-A.png` }) }
    await context.close()
  }

  // B · chevron, ficha pegada, despliegue desde 0 y foco en el título sin recorte
  {
    const { p, context } = await open(b, '?v=B')
    const st = await p.evaluate(() => {
      const ch = document.querySelector('.g-table__row.is-expanded .g-table__door-chevron')
      const row = document.querySelector('.g-table__row.is-expanded > td')
      const body = document.querySelector('.g-table__detail-body')
      return { rot: getComputedStyle(ch).rotate, sep: getComputedStyle(row).borderBottomColor, h: body.getBoundingClientRect().height, rows: getComputedStyle(body).gridTemplateRows }
    })
    rec(eng, 'B · chevron girado 90° y fila sin separador', st.rot === '90deg' && st.sep === 'rgba(0, 0, 0, 0)', JSON.stringify(st))
    rec(eng, 'B · ficha desplegada con alto', st.h > 30, st.h)
    const cont = await p.evaluate(() => { const a = getComputedStyle(document.querySelector('.g-table__row.is-expanded > td:first-child')); const d = getComputedStyle(document.querySelector('.g-table__detail > td')); return [a.borderInlineStartStyle, d.borderInlineStartStyle, a.borderInlineStartColor === d.borderInlineStartColor] })
    rec(eng, 'B · la ficha sigue el lomo de su fila', cont[0] === 'dashed' && cont[1] === 'dashed' && cont[2], JSON.stringify(cont))
    // Despliegue nuevo: se monta plegada (starting-style) y crece
    const grow = await p.evaluate(async () => {
      const tr = document.querySelector('.g-table__row[data-key="L-2045"]')
      const det = document.createElement('tr'); det.className = 'g-table__detail'
      det.innerHTML = '<td class="g-table__detail-cell" colspan="5"><div class="g-table__detail-body" role="group"><div><p style="margin:0">Ficha</p><p style="margin:0">Segunda línea</p></div></div></td>'
      tr.classList.add('is-expanded'); tr.after(det)
      const b = det.querySelector('.g-table__detail-body')
      const hs = []
      for (let i = 0; i < 30; i++) { hs.push(Math.round(b.getBoundingClientRect().height)); await new Promise((r) => requestAnimationFrame(r)) }
      await new Promise((r) => setTimeout(r, 400))
      hs.push(Math.round(b.getBoundingClientRect().height))
      return hs
    })
    rec(eng, 'B · la ficha nueva crece desde 0', grow[0] <= 2 && grow.at(-1) > 30, `${grow[0]} → ${grow.at(-1)}`)
    await p.focus('.g-table__row[data-key="L-2041"] .g-table__door')
    await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab')
    if (!(await p.evaluate(() => document.activeElement.classList.contains('g-table__door')))) await p.focus('.g-table__row[data-key="L-2041"] .g-table__door')
    const ring = await p.evaluate(() => { const a = document.activeElement; const t = a.closest('.g-table__title'); const ar = a.getBoundingClientRect(); const tr = t.getBoundingClientRect(); const s = getComputedStyle(a); const w = parseFloat(s.outlineWidth) + parseFloat(s.outlineOffset); return { out: s.outlineStyle, fits: ar.left - w >= tr.left - 0.5 && ar.top - w >= tr.top - 0.5 && ar.bottom + w <= tr.bottom + 0.5 } })
    rec(eng, 'B · anillo de la puerta entero dentro del recorte del título', ring.out === 'solid' && ring.fits, JSON.stringify(ring))
    const size = await p.evaluate(() => { const r = document.querySelector('.g-table__row[data-key="L-2041"] .g-table__cell--primary').getBoundingClientRect(); const e = document.elementFromPoint(r.left + 3, r.bottom - 3); return !!e.closest('.g-table__door') })
    rec(eng, 'B · el área de la puerta es la celda (≥ 24px)', size)
    if (SHOTS) await p.screenshot({ path: `${SHOT_DIR}${eng}-B.png` })
    await context.close()
  }

  // RTL: flecha y chevron espejados por flip-rtl; el chevron abierto apunta abajo (−90°)
  {
    const { p, context } = await open(b, '?v=B&dir=rtl')
    const r = await p.evaluate(() => { const ch = document.querySelector('.g-table__row.is-expanded .g-table__door-chevron'); return { rot: getComputedStyle(ch).rotate, scale: getComputedStyle(ch.querySelector('svg')).scale } })
    rec(eng, 'RTL · chevron espejado y abierto a −90°', r.rot === '-90deg' && r.scale === '-1 1', JSON.stringify(r))
    await context.close()
    const a = await open(b, '?v=A&dir=rtl')
    const ra = await a.p.evaluate(() => { const ar = document.querySelector('.g-table__row:not(.is-last-opened) .g-table__door-arrow'); return { tr: getComputedStyle(ar).translate, scale: getComputedStyle(ar.querySelector('svg')).scale } })
    rec(eng, 'RTL · la flecha espera desde el inicio (positivo) y se espeja', parseFloat(ra.tr) > 0 && ra.scale === '-1 1', JSON.stringify(ra))
    if (SHOTS) { await a.p.hover('.g-table__row[data-key="L-2041"] td:nth-child(3)'); await a.p.waitForTimeout(250); await a.p.screenshot({ path: `${SHOT_DIR}${eng}-A-rtl.png` }) }
    await a.context.close()
  }

  // Movimiento reducido: «aquí estabas» quieta (accent-soft, sin animación), flecha sin desplazamiento, ficha sin transición
  {
    const { p, context } = await open(b, '?v=A', { reducedMotion: 'reduce' })
    const r = await p.evaluate((C) => {
      const K = eval(C)
      const tr = document.querySelector('.g-table__row[data-key="L-2046"]'); tr.classList.add('is-here')
      const td = tr.children[2]
      const ar = document.querySelector('.g-table__row[data-key="L-2047"] .g-table__door-arrow')
      return { anim: getComputedStyle(td).animationName, bg: getComputedStyle(td).backgroundColor, accent: K.tok('--g-color-accent-soft'), tr: getComputedStyle(ar).translate, trans: getComputedStyle(ar).transitionDuration }
    }, CONTRAST)
    rec(eng, 'reducido · aquí estabas quieta en accent-soft', r.anim === 'none' && r.bg === r.accent, JSON.stringify(r))
    rec(eng, 'reducido · la flecha no se desplaza', (r.tr === 'none' || r.tr === '0px' || r.tr === '0px 0px') && parseFloat(r.trans) === 0, r.tr)
    await context.close()
    const n = await open(b, '?v=A')
    const an = await n.p.evaluate(() => { const tr = document.querySelector('.g-table__row[data-key="L-2042"]'); tr.classList.add('is-here'); const a = tr.children[2].getAnimations(); const nw = document.querySelector('.g-table__row[data-key="L-2048"]'); nw.classList.add('is-new'); return { here: a.map((x) => x.animationName + ':' + x.effect.getTiming().duration), nw: nw.children[1].getAnimations().map((x) => x.animationName) } })
    rec(eng, 'aquí estabas: animación slow × 4; filas nuevas con fundido', an.here.length === 1 && an.here[0].startsWith('g-table-here') && an.nw[0] === 'g-table-new', JSON.stringify(an))
    await n.context.close()
  }

  // Táctil: cifras del selector ≥ 44 × 44 a 360px y sin desplazamiento horizontal
  {
    const { p, context } = await open(b, '?v=A&mode=cards', { vw: 360, vh: 740, hasTouch: true, isMobile: eng !== 'firefox' })
    const r = await p.evaluate(() => ({ coarse: matchMedia('(pointer: coarse)').matches, seg: [...document.querySelectorAll('.g-pagination__size-text')].map((s) => { const b = s.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)] }), sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
    if (r.coarse) rec(eng, '360 táctil · cifras ≥ 44 × 44', r.seg.every(([w, h]) => w >= 44 && h >= 44), JSON.stringify(r.seg))
    else measure(eng, '360 · pointer: coarse no emulado', 'omitido')
    rec(eng, '360 · sin desplazamiento horizontal', r.sw <= r.cw, `${r.sw}/${r.cw}`)
    const c360 = await p.evaluate(() => ({ dock: document.querySelector('.g-pagination').offsetHeight, title: Math.round(document.querySelector('.g-table__row[data-status="error"] .g-table__title').getBoundingClientRect().height) }))
    measure(eng, '360 · alto del pie acoplado (px)', c360.dock)
    rec(eng, '360 tarjetas · el título con etiqueta no se parte (una línea)', c360.title <= 30, c360.title)
    // Tarjetas: lomo en el borde de la tarjeta
    const cards = await p.evaluate(() => { const c = document.querySelector('.g-table__row[data-status="warning"]'); const s = getComputedStyle(c); return { w: s.borderInlineStartWidth, st: s.borderInlineStartStyle } })
    rec(eng, 'tarjetas · lomo en el borde de la tarjeta', cards.st === 'dashed' && parseFloat(cards.w) >= 6, JSON.stringify(cards))
    if (SHOTS) await p.screenshot({ path: `${SHOT_DIR}${eng}-cards.png`, fullPage: false })
    await context.close()
  }
}

async function forced(b, eng) {
  if (eng !== 'chromium') return
  const { p, context } = await open(b, '?v=A', { forcedColors: 'active' })
  const r = await p.evaluate(() => {
    const st = (sel) => { const td = document.querySelector(sel); const s = getComputedStyle(td); return [s.borderInlineStartStyle, s.borderInlineStartColor, s.borderInlineStartWidth] }
    return {
      none: st('.g-table__row:not([data-status]) > td:first-child'),
      err: st('.g-table__row[data-status="error"] > td:first-child'),
      warn: st('.g-table__row[data-status="warning"] > td:first-child'),
      ok: st('.g-table__row[data-status="success"] > td:first-child'),
      bg: getComputedStyle(document.body).backgroundColor,
      cause: getComputedStyle(document.querySelector('td.g-table__cell--cause')).outlineStyle,
      seg: getComputedStyle(document.querySelector('.g-pagination__size-input:checked + .g-pagination__size-text')).backgroundColor
    }
  })
  rec(eng, 'forced-colors · lomo conserva su forma y su ancho', r.err[0] === 'solid' && r.warn[0] === 'dashed' && r.ok[0] === 'double' && r.err[2] === r.none[2], JSON.stringify(r))
  rec(eng, 'forced-colors · sin estado, lomo del color del fondo', r.none[1] === r.bg, `${r.none[1]} / ${r.bg}`)
  rec(eng, 'forced-colors · lomo con estado visible (≠ fondo)', r.err[1] !== r.bg)
  rec(eng, 'forced-colors · sello con contorno', r.cause !== 'none', r.cause)
  rec(eng, 'forced-colors · cifra marcada en Highlight', r.seg !== r.bg, r.seg)
  if (SHOTS) await p.screenshot({ path: `${SHOT_DIR}${eng}-forced.png` })
  await context.close()
}

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  try {
    await structural(b, eng)
    await forced(b, eng)
    if (eng === 'chromium') {
      await themeChecks(b, eng, '?v=A', 'defecto claro')
      await themeChecks(b, eng, '?v=A&dark=1', 'defecto oscuro')
      for (const t of THEMES) {
        await themeChecks(b, eng, `?v=A&theme=${t}`, `${t} claro`)
        await themeChecks(b, eng, `?v=A&theme=${t}&dark=1`, `${t} oscuro`)
      }
    } else {
      await themeChecks(b, eng, '?v=A', 'defecto claro')
      await themeChecks(b, eng, '?v=A&dark=1', 'defecto oscuro')
    }
  } finally { await b.close() }
}
server.close()
const fails = R.filter((r) => !r.ok)
for (const m of M.filter((x) => x.what.startsWith('360'))) console.log(`medida ${m.eng} · ${m.what} = ${m.val}`)
if (process.env.MEASURES) for (const m of M) console.log(`medida ${m.eng} · ${m.what} = ${m.val}`)
// Mínimos por medida (solo Chromium recorre todos los temas)
const mins = {}
for (const m of M.filter((x) => x.eng === 'chromium' && !isNaN(parseFloat(x.val)))) { const k = m.what.replace(/^.*? · /, ''); const v = parseFloat(m.val); if (!(k in mins) || v < mins[k].v) mins[k] = { v, where: m.what } }
for (const [k, { v, where }] of Object.entries(mins)) console.log(`mínimo · ${k} = ${v.toFixed(2)} (${where.split(' · ')[0]})`)
console.log(`\n${R.length - fails.length}/${R.length} comprobaciones en ${ENGINES.join(', ')}`)
process.exit(fails.length ? 1 : 0)
