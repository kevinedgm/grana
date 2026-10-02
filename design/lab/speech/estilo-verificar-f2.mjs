// Verificación de coco sobre el banco de la Fase 2 (design/lab/speech/estilo-banco-f2.html), con el CSS real de
// GTranscript.css y GSpeechHost.css: contraste compuesto (texto 4.5:1; marcas, bordes, iconos y foco 3:1) en todas las
// piezas visibles, con el tema por defecto, los generados y tres temas con categorías (speakerColors), claro y oscuro;
// <del>/<ins> reconocibles sin color; foco visible y no tapado dentro del área desplazable; objetivos 24/44px; 320px sin
// desbordamiento; RTL; forced-colors; prefers-contrast; movimiento reducido; panel compacto; diálogo de respaldo; consola.
// Además mide (informativo) cuántas líneas ocupa la barra según el ancho, para fijar el umbral de «Más».
// Requiere `npm run build` (dist/grana.umd.js). Desde la raíz: node design/lab/speech/estilo-verificar-f2.mjs
// Opcional: --engines=chromium,firefox,webkit  --verbose
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/speech/estilo-banco-f2.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
const CAT = ['spotify-cat6', 'default-cat12', 'lustre-cat8']
let total = 0, failed = 0
const fails = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const mins = {}

/* ---------- En la página: contraste compuesto de todas las piezas visibles de GTranscript ---------- */
const contrast = () => {
  const parse = (s) => {
    let m = String(s).match(/rgba?\(([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
    m = String(s).match(/color\(srgb ([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
    return [0, 0, 0, 0]
  }
  const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
  const bgOf = (el) => {
    const layers = []
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break } }
    let base = parse(getComputedStyle(document.body).backgroundColor); if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const vis = (el) => el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[hidden]')
  const out = []
  const add = (id, what, r, min) => out.push({ id, what, r, min })
  const text = (id, what, el, min = 4.5) => { if (!vis(el)) return; const bg = bgOf(el); add(id, what, ratio(over(parse(getComputedStyle(el).color), bg), bg), min) }
  const paint = (id, what, el, prop, against, min = 3) => { if (!vis(el)) return; const bg = against || bgOf(el); add(id, what, ratio(over(parse(getComputedStyle(el)[prop]), bg), bg), min) }
  for (const root of document.querySelectorAll('.g-transcript')) {
    if (!vis(root)) continue
    const id = root.id
    for (const [sel, what] of [['.g-transcript__text', 'texto'], ['.is-partial .g-transcript__text', 'provisional'], ['.is-removed .g-transcript__text', 'eliminado (tachado)'],
      ['.g-transcript__cell--time', 'hora'], ['.g-transcript__time', 'hora (lista)'], ['.g-transcript__flag', 'marca'], ['.g-transcript__count', 'contador'], ['.g-transcript__kbd', 'ayuda de teclado'],
      ['.g-transcript__note', 'aviso sin diarización'], ['.g-transcript__empty', 'vacío'], ['.g-transcript__orig > p', 'original'], ['.g-transcript__diff', 'cambios'], ['.g-transcript__diff del', '<del>'], ['.g-transcript__diff ins', '<ins>'],
      ['.g-transcript__editor-orig', 'original del editor'], ['.g-transcript__editor-hint', 'ayuda del editor'], ['.g-transcript__field', 'editor (texto)'], ['.g-transcript__speaker', 'hablante'], ['.g-transcript__mark', 'letra de la marca'],
      ['.g-transcript__speakers > p', 'ayuda del gestor'], ['.g-transcript__speakers > :is(h2,h3,h4,h5,h6)', 'título del gestor'], ['.g-transcript__insert > :is(h2,h3,h4,h5,h6)', 'título de la inserción'], ['.g-transcript__speaker-row > span:not([class])', 'secundario del gestor'],
      ['.g-transcript__insert > p:not([class])', 'rótulo de la vista previa'], ['.g-transcript__preview', 'vista previa'], ['.g-transcript__result > span', 'resultado'], ['.g-transcript__uses li > span', 'uso'], ['.g-transcript__uses summary', 'usos']]) {
      for (const el of root.querySelectorAll(sel)) text(id, what, el)
    }
    for (const b of root.querySelectorAll('.g-btn')) {
      if (!vis(b) || b.getAttribute('aria-disabled') === 'true') continue
      const lab = b.querySelector('.g-btn__label')
      if (lab && lab.textContent.trim()) text(id, 'botón «' + lab.textContent.trim().slice(0, 18) + '»', b)
      const svg = b.querySelector('svg'); if (svg) paint(id, 'icono de botón', svg, 'color', bgOf(b))
      if (b.matches('.g-btn--variant-outline')) paint(id, 'borde de botón', b, 'borderTopColor', bgOf(b.parentElement))
    }
    for (const el of root.querySelectorAll('.g-transcript__flag > svg')) paint(id, 'icono de marca', el, 'color')
    for (const el of root.querySelectorAll('.g-transcript__result > svg')) paint(id, 'icono del resultado', el, 'color')
    for (const el of root.querySelectorAll('.g-transcript__flag--partial')) paint(id, 'borde «Provisional»', el, 'borderTopColor')
    for (const el of root.querySelectorAll('.g-transcript__field')) paint(id, 'borde del editor', el, 'borderTopColor', bgOf(el.parentElement))
    for (const el of root.querySelectorAll('.g-transcript__mark')) {
      const outside = bgOf(el.parentElement)
      paint(id, el.dataset.cat ? 'borde de marca de color' : el.classList.contains('is-unassigned') ? 'borde «Sin asignar»' : 'borde de marca', el, 'borderTopColor', outside)
    }
    for (const r of root.querySelectorAll('.g-transcript__row.is-selected')) {
      const c = parse(getComputedStyle(r).borderInlineStartColor || getComputedStyle(r).borderLeftColor)
      add(id, 'marca de selección / fila', ratio(over(c, bgOf(r)), bgOf(r)), 3)
      add(id, 'marca de selección / fuera', ratio(over(c, bgOf(r.parentElement)), bgOf(r.parentElement)), 3)
    }
    for (const r of root.querySelectorAll('.g-transcript__row.is-failed, .g-transcript__item.is-failed')) paint(id, 'marca de fallido', r, 'borderInlineStartColor', bgOf(r))
    // Anillo de foco de celda sobre el fondo de una fila normal y de una seleccionada
    for (const r of [root.querySelector('.g-transcript__row:not(.is-selected)'), root.querySelector('.g-transcript__row.is-selected')]) {
      if (!r || !vis(r)) continue
      const cell = r.querySelector('.g-transcript__cell--text'), probe = document.createElement('span'); probe.style.color = 'var(--g-color-focus)'; cell.append(probe)
      add(id, r.classList.contains('is-selected') ? 'foco / fila seleccionada' : 'foco / fila', ratio(over(parse(getComputedStyle(probe).color), bgOf(r)), bgOf(r)), 3); probe.remove()
    }
  }
  return out
}

const consoleOf = (page) => { const msgs = []; page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) msgs.push(m.type() + ': ' + m.text()) }); page.on('pageerror', (e) => msgs.push('pageerror: ' + e.message)); page.on('response', (r) => { if (r.status() >= 400) msgs.push('http ' + r.status() + ' ' + r.url()) }); return msgs }
const open = async (page, qs) => { await page.goto(BASE + qs); await page.waitForFunction(() => window.__ready, null, { timeout: 20000 }); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(250) }
const noOverflow = () => {
  const de = document.scrollingElement, bad = []
  if (de.scrollWidth > innerWidth + 1) bad.push('página ' + de.scrollWidth)
  for (const el of document.querySelectorAll('.g-transcript, .g-transcript__bar, .g-transcript__scroll, .g-transcript__row, .g-transcript__insert, .g-transcript__speakers, .g-speech-panel, dialog[open]')) {
    if (!el.getClientRects().length) continue
    if (el.scrollWidth > el.clientWidth + 1) bad.push((el.id || el.className.split(' ')[0]) + ' ' + el.scrollWidth + '>' + el.clientWidth)
    const r = el.getBoundingClientRect(); if (r.right > innerWidth + 1 || r.left < -1) bad.push('fuera del visor ' + (el.id || el.className.split(' ')[0]))
  }
  return bad
}

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  const msgs = consoleOf(page)

  /* ---------- 1. Contraste por tema (y diálogo de respaldo abierto) ---------- */
  const themes = [['defecto', ''], ...(engine === 'chromium' ? GEN : ['spotify', 'lustre']).map((t) => [t, '&theme=' + t]), ...(engine === 'chromium' ? CAT : ['spotify-cat6']).map((t) => [t, '&cat=' + t])]
  for (const [name, qs] of themes) {
    for (const dark of [false, true]) {
      await open(page, '?dlg=1' + qs + (dark ? '&dark=1' : ''))
      const rows = await page.evaluate(contrast)
      const tag = `${engine} ${name} ${dark ? 'oscuro' : 'claro'}`
      ok(rows.length > 300, `${tag}: piezas medidas ${rows.length}`)
      if (name.includes('cat')) ok(rows.some((r) => r.what === 'borde de marca de color'), `${tag}: hay marcas de color (speakerColors)`)
      for (const r of rows) {
        ok(r.r >= r.min, `${tag} ${r.id} ${r.what}: ${r.r} < ${r.min}`)
        const k = r.what.replace(/«.*»/, '«…»') + ' (' + r.min + ')'
        if (!mins[k] || r.r < mins[k].r) mins[k] = { r: r.r, where: tag + ' ' + r.id }
      }
    }
  }

  /* ---------- 2. <del>/<ins> reconocibles sin color ---------- */
  await open(page, '?only=s-edit')
  const di = await page.evaluate(() => {
    const d = document.querySelector('.g-transcript__diff del'), i = document.querySelector('.g-transcript__diff ins')
    const cd = getComputedStyle(d), ci = getComputedStyle(i)
    return { del: cd.textDecorationLine, ins: ci.textDecorationLine, dt: parseFloat(cd.textDecorationThickness), it: parseFloat(ci.textDecorationThickness), dsr: d.querySelector('.g-transcript__sr')?.textContent, isr: i.querySelector('.g-transcript__sr')?.textContent }
  })
  ok(di.del.includes('line-through') && !di.del.includes('underline') && di.ins.includes('underline') && !di.ins.includes('line-through') && di.dt >= 2 && di.it >= 2 && di.dsr && di.isr, `${engine} del/ins por forma (tachado / subrayado de 2px) y envoltura oculta: ${JSON.stringify(di)}`)
  // Escala de grises: con filter grayscale la diferencia sigue en la decoración (no depende del tono)
  const rm = await page.evaluate(() => { const t = document.querySelector('.is-removed .g-transcript__text'); return getComputedStyle(t).textDecorationLine })
  ok(rm.includes('line-through'), `${engine} eliminado tachado: ${rm}`)

  /* ---------- 3. Foco visible y no tapado dentro del área desplazable ---------- */
  await open(page, '?only=s-narrow')
  const fo = await page.evaluate(async () => {
    const root = document.getElementById('tx-long'), sc = root.querySelector('.g-transcript__scroll'), sr = sc.getBoundingClientRect()
    const res = []
    const inside = (r, pad = 0) => r.top - pad >= sr.top + 0.5 && r.bottom + pad <= sr.bottom - 0.5 && r.left - pad >= sr.left - 0.5 && r.right + pad <= sr.right + 0.5
    const check = async (el, what) => {
      el.focus(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const cs = getComputedStyle(el), r = el.getBoundingClientRect(), off = parseFloat(cs.outlineOffset) || 0, w = parseFloat(cs.outlineWidth) || 0
      const ring = Math.max(0, off + w)
      const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2)
      res.push({ what, style: cs.outlineStyle, w, inside: inside(r, ring), visible: el.contains(hit) || hit === el, fv: el.matches(':focus-visible') })
    }
    const rows = root.querySelectorAll('.g-transcript__row')
    const last = rows[rows.length - 1], first = rows[0]
    // Foco por teclado: el banco no tiene foco itinerante; se simula la tecla para que :focus-visible aplique
    await check(last.querySelector('.g-transcript__cell--text'), 'texto última fila')
    await check(last.querySelector('.g-transcript__cell--time'), 'hora última fila')
    await check(last.querySelector('.g-transcript__actions'), 'acciones última fila')
    await check(rows[12].querySelector('.g-transcript__speaker'), 'hablante fila 13')
    await check(first.querySelector('.g-checkbox input'), 'casilla primera fila')
    await check(first.querySelector('.g-transcript__cell--text'), 'texto primera fila')
    return res
  })
  for (const f of fo) ok(f.style !== 'none' && f.w >= 2 && f.inside && f.visible, `${engine} foco «${f.what}» visible, sólido ≥ 2px, dentro del área y sin tapar: ${JSON.stringify(f)}`)
  // Celda de texto: anillo interior
  const inset = await page.evaluate(() => { const c = document.querySelector('#tx-long .g-transcript__cell--text'); c.focus(); const cs = getComputedStyle(c); return parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth) })
  ok(inset <= 0, `${engine} anillo de celda interior (offset + ancho ≤ 0): ${inset}`)

  /* ---------- 4. Objetivos 24px ---------- */
  await open(page, '')
  const tg = await page.evaluate(() => {
    let small = 0, n = 0
    for (const b of document.querySelectorAll('.g-transcript .g-btn')) { if (!b.getClientRects().length) continue; n++; const a = getComputedStyle(b, '::after'); if (Math.min(parseFloat(a.width), parseFloat(a.height)) < 24) small++ }
    for (const i of document.querySelectorAll('.g-transcript .g-checkbox__input')) { if (!i.getClientRects().length) continue; n++; const r = i.getBoundingClientRect(); if (Math.min(r.width, r.height) < 16) small++ }
    const rowH = Math.min(...[...document.querySelectorAll('.g-transcript__row')].filter((r) => r.getClientRects().length).map((r) => r.getBoundingClientRect().height))
    return { n, small, rowH }
  })
  ok(tg.n > 60 && tg.small === 0 && tg.rowH >= 24, `${engine} objetivos ≥ 24px: ${JSON.stringify(tg)}`)

  /* ---------- 5. Táctil (pointer: coarse): columnas de control de 44px y áreas que no se pisan ---------- */
  if (engine !== 'firefox') {
    const c4 = await browser.newContext({ viewport: { width: 800, height: 900 }, hasTouch: true, isMobile: engine === 'chromium', reducedMotion: 'reduce' })
    const p4 = await c4.newPage(); consoleOf(p4)
    await open(p4, '?only=s-edit')
    const co = await p4.evaluate(() => {
      const coarse = matchMedia('(pointer: coarse)').matches
      let small = 0, overlap = 0, cells = 0
      const area = (b) => { const r = b.getBoundingClientRect(), a = getComputedStyle(b, '::after'), w = parseFloat(a.width), h = parseFloat(a.height); return { l: (r.left + r.right) / 2 - w / 2, r: (r.left + r.right) / 2 + w / 2, t: (r.top + r.bottom) / 2 - h / 2, b: (r.top + r.bottom) / 2 + h / 2, w, h } }
      for (const row of document.querySelectorAll('#tx-edit .g-transcript__row')) {
        const bs = [...row.querySelectorAll('.g-transcript__speaker.g-btn, .g-transcript__actions')].map(area)
        for (const a of bs) if (Math.min(a.w, a.h) < 44) small++
        for (const c of row.querySelectorAll('.g-transcript__cell--select, .g-transcript__cell--actions')) { cells++; if (c.getBoundingClientRect().width < 44) small++ }
        for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i], b = bs[j]; if (a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5) overlap++ }
        const cb = row.querySelector('.g-checkbox'); if (cb && cb.getBoundingClientRect().height < 44) small++
      }
      return { coarse, small, overlap, cells }
    })
    ok(co.coarse && co.cells > 10 && co.small === 0 && co.overlap === 0, `${engine} táctil: columnas y áreas ≥ 44px sin pisarse: ${JSON.stringify(co)}`)
    await c4.close()
  }

  /* ---------- 6. 320×640: sin desbordamiento (página, vistas, panel, diálogo, menú «Más») ---------- */
  const c5 = await browser.newContext({ viewport: { width: 320, height: 640 }, hasTouch: engine !== 'firefox', reducedMotion: 'reduce' })
  const p5 = await c5.newPage(); const m5 = consoleOf(p5)
  for (const rtl of [false, true]) {
    await open(p5, rtl ? '?rtl=1' : '')
    const bad = await p5.evaluate(noOverflow)
    ok(bad.length === 0, `${engine} 320px${rtl ? ' RTL' : ''}: sin desbordamiento: ${bad.join('; ')}`)
    const st = await p5.evaluate(() => {
      const r = document.querySelector('#tx-edit'), row = r.querySelector('.g-transcript__row'), text = row.querySelector('.g-transcript__cell--text'), time = row.querySelector('.g-transcript__cell--time')
      return { narrow: r.hasAttribute('data-narrow'), below: text.getBoundingClientRect().top >= time.getBoundingClientRect().bottom - 1, full: text.getBoundingClientRect().width >= row.clientWidth - 40, more: !!r.querySelector('.g-transcript__more') }
    })
    ok(st.narrow && st.below && st.full && st.more, `${engine} 320px${rtl ? ' RTL' : ''}: fila apilada (texto debajo, a todo el ancho) y «Más»: ${JSON.stringify(st)}`)
    // «Más» abierto: el menú dentro del visor
    await p5.click('#tx-edit .g-transcript__more')
    await p5.waitForTimeout(200)
    const mn = await p5.evaluate(() => { const m = [...document.querySelectorAll('.g-menu__list, [role="menu"]')].find((x) => x.getClientRects().length); if (!m) return null; const r = m.getBoundingClientRect(); return { l: r.left, r: r.right, items: m.querySelectorAll('[role^="menuitem"]').length } })
    ok(mn && mn.l >= 0 && mn.r <= 320 && mn.items >= 4, `${engine} 320px${rtl ? ' RTL' : ''}: menú «Más» dentro del visor: ${JSON.stringify(mn)}`)
    await p5.keyboard.press('Escape')
  }
  // Diálogo de respaldo a pantalla completa
  await open(p5, '?dlg=1')
  const dl = await p5.evaluate(() => { const d = document.querySelector('dialog.g-speech-review'); const r = d.getBoundingClientRect(); const sc = d.querySelector('.g-transcript__scroll'); return { w: r.width, h: r.height, max: getComputedStyle(sc).maxBlockSize, bad: [] } })
  const bad5 = await p5.evaluate(noOverflow)
  ok(dl.w >= 319 && bad5.length === 0, `${engine} 320px: diálogo de respaldo a pantalla completa y sin desbordamiento: ${JSON.stringify(dl)} ${bad5.join('; ')}`)
  ok(Math.abs(parseFloat(dl.max) - 240) < 1, `${engine} 320×640: alto máximo de la rejilla en el diálogo = max(space × 60, 100dvh − space × 100) = 240px: ${dl.max}`)
  ok(m5.length === 0, `${engine} consola 320px: ${m5.join(' | ')}`)
  await c5.close()

  /* ---------- 6b. Zoom 200 % (visor de 640×450): sin desbordamiento, también con el diálogo ---------- */
  const c6 = await browser.newContext({ viewport: { width: 640, height: 450 }, reducedMotion: 'reduce' })
  const p6 = await c6.newPage(); const m6 = consoleOf(p6)
  for (const qs of ['', '?dlg=1']) {
    await open(p6, qs)
    const bad = await p6.evaluate(noOverflow)
    ok(bad.length === 0, `${engine} 640×450 ${qs}: sin desbordamiento: ${bad.join('; ')}`)
  }
  const z = await p6.evaluate(() => getComputedStyle(document.querySelector('.g-speech-review .g-transcript__scroll')).maxBlockSize)
  ok(Math.abs(parseFloat(z) - 240) < 1, `${engine} 640×450: rejilla del diálogo con su mínimo de space × 60: ${z}`)
  ok(m6.length === 0, `${engine} consola 640×450: ${m6.join(' | ')}`)
  await c6.close()

  /* ---------- 7. Diálogo de respaldo en escritorio y panel compacto ---------- */
  await open(page, '?dlg=1')
  const dd = await page.evaluate(() => { const sc = document.querySelector('.g-speech-review .g-transcript__scroll'); return { max: parseFloat(getComputedStyle(sc).maxBlockSize), sh: sc.scrollHeight, ch: sc.clientHeight } })
  ok(Math.abs(dd.max - 500) < 1 && dd.sh > dd.ch, `${engine} 1280×900: rejilla del diálogo acotada a 500px y desplazable: ${JSON.stringify(dd)}`)
  await open(page, '?only=s-panel')
  const pn = await page.evaluate(() => {
    return [...document.querySelectorAll('.g-speech-panel__transcript > .g-transcript')].map((t) => {
      const sc = t.querySelector('.g-transcript__scroll')
      return { compact: t.hasAttribute('data-compact'), narrow: t.hasAttribute('data-narrow'), sel: t.querySelectorAll('.g-transcript__cell--select').length, kbdHidden: !t.querySelector('.g-transcript__kbd').getClientRects().length, h: sc.clientHeight, min: parseFloat(getComputedStyle(sc).minBlockSize), scrolls: sc.scrollHeight > sc.clientHeight, ov: t.scrollWidth > t.clientWidth + 1, review: !!t.closest('.g-speech-panel').querySelector('.g-speech-panel__controls .g-btn svg') }
    })
  })
  for (const p of pn) ok(p.compact && p.narrow && p.sel === 0 && p.kbdHidden && p.min === 120 && p.h >= 120 && p.scrolls && !p.ov && p.review, `${engine} panel: GTranscript compacto apilado, sin selección ni ayuda visible, área ≥ space × 30 y desplazable: ${JSON.stringify(p)}`)

  /* ---------- 8. RTL: marca de selección y fallido al inicio (derecha), acciones al final (izquierda) ---------- */
  await open(page, '?only=s-edit&rtl=1')
  const rt = await page.evaluate(() => {
    const sel = document.querySelector('#tx-edit .g-transcript__row.is-selected'), cs = getComputedStyle(sel)
    const row = document.querySelector('#tx-edit .g-transcript__row'), act = row.querySelector('.g-transcript__cell--actions').getBoundingClientRect(), text = row.querySelector('.g-transcript__cell--text').getBoundingClientRect(), time = row.querySelector('.g-transcript__cell--time').getBoundingClientRect()
    const orig = getComputedStyle(document.querySelector('#tx-edit .g-transcript__orig'))
    return { right: cs.borderRightWidth, left: cs.borderLeftWidth, actLeft: act.right <= text.left + 1, timeRight: time.left >= text.right - 1, origRight: orig.borderRightWidth }
  })
  ok(parseFloat(rt.right) >= 2 && parseFloat(rt.left) === 0 && rt.actLeft && rt.timeRight && parseFloat(rt.origRight) >= 2, `${engine} RTL: marcas a la derecha, acciones a la izquierda: ${JSON.stringify(rt)}`)

  /* ---------- 9. Movimiento reducido: el chevron de «Más» no anima ---------- */
  await open(page, '?only=s-narrow')
  const mv = await page.evaluate(() => getComputedStyle(document.querySelector('.g-transcript__more .g-btn__append > svg')).transitionDuration)
  ok(/^0s/.test(mv), `${engine} movimiento reducido: chevron sin transición: ${mv}`)

  /* ---------- 10. forced-colors y prefers-contrast (solo Chromium emula ambos) ---------- */
  if (engine === 'chromium') {
    const c7 = await browser.newContext({ viewport: { width: 1280, height: 900 }, forcedColors: 'active', reducedMotion: 'reduce' })
    const p7 = await c7.newPage(); consoleOf(p7)
    await open(p7, '?only=s-edit')
    const fc = await p7.evaluate(() => {
      const probe = document.createElement('i'); probe.style.color = 'Highlight'; document.body.append(probe); const hl = getComputedStyle(probe).color; probe.remove()
      const sel = getComputedStyle(document.querySelector('#tx-edit .g-transcript__row.is-selected'))
      const mk = getComputedStyle(document.querySelector('#tx-edit .g-transcript__mark'))
      const c = document.querySelector('#tx-edit .g-transcript__cell--text'); c.focus()
      const cf = getComputedStyle(c)
      return { hl, sel: sel.borderLeftColor, selW: sel.borderLeftWidth, mark: mk.borderTopStyle + ' ' + mk.borderTopColor, focus: cf.outlineColor, fw: cf.outlineWidth, del: getComputedStyle(document.querySelector('.g-transcript__diff del')).textDecorationLine, ins: getComputedStyle(document.querySelector('.g-transcript__diff ins')).textDecorationLine, failed: getComputedStyle(document.querySelector('.g-transcript__row.is-failed')).borderLeftStyle }
    })
    ok(fc.sel === fc.hl && parseFloat(fc.selW) >= 2 && /solid/.test(fc.mark) && !/rgba\(0, 0, 0, 0\)/.test(fc.mark) && fc.focus === fc.hl && parseFloat(fc.fw) >= 2 && fc.del.includes('line-through') && fc.ins.includes('underline') && fc.failed === 'dashed', `chromium forced-colors: selección y foco en Highlight, marca y formas visibles: ${JSON.stringify(fc)}`)
    await c7.close()
    const c8 = await browser.newContext({ viewport: { width: 1280, height: 900 }, contrast: 'more', reducedMotion: 'reduce' })
    const p8 = await c8.newPage(); consoleOf(p8)
    await open(p8, '?only=s-edit')
    const pc = await p8.evaluate(() => { const t = getComputedStyle(document.querySelector('#tx-edit .g-transcript__text')).color; return { t, time: getComputedStyle(document.querySelector('#tx-edit .g-transcript__cell--time')).color, part: getComputedStyle(document.querySelector('#tx-edit .is-partial .g-transcript__text')).color, sc: getComputedStyle(document.querySelector('#tx-edit .g-transcript__scroll')).borderTopColor, ctl: (() => { const p = document.createElement('i'); p.style.color = 'var(--g-color-border-control)'; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c })() } })
    ok(pc.time === pc.t && pc.part === pc.t && pc.sc === pc.ctl, `chromium prefers-contrast: more: secundarios a text y bordes a border-control: ${JSON.stringify(pc)}`)
    await c8.close()

    /* ---------- 11. Umbral de «Más» (informativo): líneas de la barra según el ancho ---------- */
    const lines = {}
    for (const at of [120, 160]) {
      for (const w of [320, 400, 480, 560, 640, 720, 800, 960]) {
        const c9 = await browser.newContext({ viewport: { width: w + 64, height: 900 }, reducedMotion: 'reduce' })
        const p9 = await c9.newPage()
        await open(p9, `?only=s-edit&narrowAt=${at}`)
        const n = await p9.evaluate(() => { const b = document.querySelector('#tx-edit .g-transcript__bar'); const mids = [...b.children].filter((c) => c.getClientRects().length && !c.classList.contains('g-transcript__sr') && !c.classList.contains('g-btn__status')).map((c) => { const r = c.getBoundingClientRect(); return (r.top + r.bottom) / 2 }).sort((x, y) => x - y); const lines = mids.filter((m, i) => !i || m - mids[i - 1] > 12).length; return { lines, w: Math.round(document.querySelector('#tx-edit').getBoundingClientRect().width) } })
        ;(lines[at] ??= []).push(`${n.w}:${n.lines}`)
        await c9.close()
      }
    }
    console.log('Líneas de la barra (ancho de la raíz: líneas) · umbral space × 120:', lines[120].join(' '), '· × 160:', lines[160].join(' '))
    // Con el umbral fijado (space × 160) la barra completa no pasa de dos líneas desde 440px de raíz
    for (const e of lines[160]) { const [w, n] = e.split(':').map(Number); if (w >= 440) ok(n <= 2, `chromium barra con umbral space × 160 a ${w}px: ${n} líneas (máximo 2)`) }
  }

  ok(msgs.length === 0, `${engine} consola: ${msgs.join(' | ')}`)
  await browser.close()
}
server.close()

if (args.verbose) for (const [k, v] of Object.entries(mins).sort()) console.log(`  ${k}: ${v.r} (${v.where})`)
console.log(`\n${total - failed} / ${total} comprobaciones correctas`)
if (failed) { console.log(fails.slice(0, 60).join('\n')); process.exitCode = 1 }
