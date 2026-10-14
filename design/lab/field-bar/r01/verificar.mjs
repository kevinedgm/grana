// Verificación del prototipo de la barra de campos (kiwi r01): base y conceptos A, B y C en Chromium, Firefox y WebKit,
// sobre los componentes REALES de dist/ (GCombobox, GSelect, GDatePicker, GInput, GBtn, GDialog).
// Ejecutar desde la raíz: node design/lab/field-bar/r01/verificar.mjs
//   Solo el puerto 4216 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  PARTS=base,A,B,C  VERBOSE=1
// Requiere packages/vue/dist (npm run build) y node_modules/vue. Solo lee; no toca packages/.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4216)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(path))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/field-bar/r01/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'base,A,B,C').split(',')
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }

async function open(b, qs, opts = {}) {
  const { vw = 1280, vh = 1000, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE + qs)
  await p.waitForFunction(() => window.__fb && window.__fb.ready)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(250)
  p.__errs = errs
  return p
}
const setW = async (p, w) => { await p.evaluate((w) => { document.getElementById('lab').style.setProperty('--w', w + 'px') }, w); await p.waitForTimeout(200) }

// Utilidades en la página
const HELPERS = () => {
  window.__rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  window.__cr = (a, b) => { const A = window.__lum(window.__rgb(a)), B = window.__lum(window.__rgb(b)); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05) }
  // Nombre accesible aproximado: aria-labelledby › <label for> › aria-label
  window.__name = (el) => {
    const by = el.getAttribute('aria-labelledby')
    if (by) return by.split(/\s+/).map((id) => (document.getElementById(id) || {}).textContent || '').join(' ').replace(/\s+/g, ' ').trim()
    if (el.id) { const l = document.querySelector(`label[for="${el.id}"]`); if (l) return l.textContent.replace(/\s+/g, ' ').trim() }
    return (el.getAttribute('aria-label') || '').trim()
  }
  window.__visibleLabel = (el) => {
    const root = el.closest('.g-input, .g-select, .g-datepicker')
    const l = root && root.querySelector(':scope > :is(.g-input__label, .g-select__label, .g-datepicker__label)')
    if (!l) return ''
    // Solo el texto visible (sin el calificador oculto de B)
    const c = l.cloneNode(true); c.querySelectorAll('.xp__sr').forEach((n) => n.remove())
    return c.textContent.replace(/\s+/g, ' ').trim()
  }
}

const EX = (ex) => `[data-example="${ex}"]`
const KEYS = { vuelos: ['from', 'to', 'date'], filtro: ['cat', 'q'] }

async function checkCommon(p, eng, part, ex, rootSel) {
  const info = await p.evaluate(({ ex, rootSel, keys }) => {
    const form = document.querySelector(`[data-example="${ex}"]`)
    const root = form.querySelector(rootSel)
    const out = { role: root && root.getAttribute('role'), name: root && (root.getAttribute('aria-label') || ''), names: [] }
    for (const k of keys) {
      const el = form.querySelector(`[data-k="${k}"]`)
      out.names.push({ k, name: window.__name(el), vis: window.__visibleLabel(el) })
    }
    out.overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    return out
  }, { ex, rootSel, keys: KEYS[ex] })
  rec(eng, part, `${ex}: raíz role="search" con nombre`, info.role === 'search' && info.name.length > 0, `${info.role} «${info.name}»`)
  for (const n of info.names) rec(eng, part, `${ex}: «${n.k}» con etiqueta visible contenida en el nombre (2.5.3)`, n.vis && n.name.toLowerCase().includes(n.vis.toLowerCase()), `«${n.name}» ⊇ «${n.vis}»`)
  rec(eng, part, `${ex}: sin desbordamiento horizontal de la página`, !info.overflow)
}

async function tabOrder(p, ex, startSel) {
  return p.evaluate(async ({ ex, startSel }) => {
    const form = document.querySelector(`[data-example="${ex}"]`)
    form.querySelector(startSel).focus()
    return true
  }, { ex, startSel })
}
async function collectTab(p, ex, n, eng) {
  const seq = []
  for (let i = 0; i < n; i++) {
    seq.push(await p.evaluate((ex) => {
      const a = document.activeElement
      if (!a) return null
      if (a.dataset && a.dataset.k) return a.dataset.k
      if (a.closest(`[data-example="${ex}"] .xb-go, [data-example="${ex}"] .xp__go`)) return 'go'
      return a.tagName.toLowerCase()
    }, ex))
    // WebKit no detiene Tab en botones sin «Tab a todos los controles»: Opción+Tab (como el resto de specs de Grana)
    await p.keyboard.press(eng === 'webkit' ? 'Alt+Tab' : 'Tab')
    await p.waitForTimeout(60)
  }
  return seq
}

async function runBaseOrA(b, eng, part) {
  const qs = `?c=${part}`
  const p = await open(b, qs)
  await p.evaluate(HELPERS)
  for (const ex of ['vuelos', 'filtro']) await checkCommon(p, eng, part, ex, '.xb')

  // Reparto: fila a 1100, columna a 420
  const lay = await p.evaluate(() => [...document.querySelectorAll('.xb')].map((e) => e.dataset.layout))
  rec(eng, part, 'fila con el marco a 1100px', lay.every((l) => l === 'row'), lay.join(','))
  // Tres pistas: etiquetas a la misma altura y cajas a la misma altura (±1px)
  const tracks = await p.evaluate(() => {
    const f = document.querySelector('[data-example="vuelos"]')
    const L = [...f.querySelectorAll(':is(.g-input__label, .g-select__label, .g-datepicker__label)')].map((e) => e.getBoundingClientRect().top)
    const B = [...f.querySelectorAll(':is(.g-input__row, .g-select__control, .g-datepicker__field)')].map((e) => e.getBoundingClientRect().top)
    return { l: Math.max(...L) - Math.min(...L), b: Math.max(...B) - Math.min(...B) }
  })
  rec(eng, part, 'tres pistas: etiquetas y cajas alineadas (±1px)', tracks.l <= 1 && tracks.b <= 1, JSON.stringify(tracks))

  // Orden de Tab = orden visual = DOM
  await tabOrder(p, 'vuelos', '[data-k="from"]')
  const seq = await collectTab(p, 'vuelos', 4, eng)
  rec(eng, part, 'Tab recorre Origen → Destino → Salida → Buscar', seq.join(',') === 'from,to,date,go', seq.join(','))

  if (part === 'A') {
    // Segmento activo: crece y la lente se eleva; costuras abiertas; los demás no bajan de su mínimo
    const w0 = await p.evaluate(() => [...document.querySelectorAll('[data-example="vuelos"] .xb__cell')].map((c) => c.getBoundingClientRect().width))
    await p.evaluate(() => document.querySelector('[data-example="vuelos"] [data-k="to"]').blur())
    await p.waitForTimeout(50)
    await p.evaluate(() => document.querySelector('[data-example="vuelos"] [data-k="from"]').focus())
    await p.keyboard.press('Tab')
    await p.waitForTimeout(500)
    const st = await p.evaluate(() => {
      const cells = [...document.querySelectorAll('[data-example="vuelos"] .xb__cell')]
      const c = cells[1], lens = c.querySelector('.xb__lens'), cs = getComputedStyle(lens)
      const seamL = getComputedStyle(c, '::before').opacity, seamR = getComputedStyle(cells[2], '::before').opacity, seamOther = getComputedStyle(cells[1].previousElementSibling, '::before').opacity
      return {
        active: c.classList.contains('is-active'), w: cells.map((x) => x.getBoundingClientRect().width),
        outline: cs.outlineStyle + ' ' + cs.outlineWidth, shadow: cs.boxShadow !== 'none', seams: [seamL, seamR],
        surf: getComputedStyle(document.querySelector('[data-example="vuelos"] .xb__surface')).backgroundColor,
        lensBg: cs.backgroundColor
      }
    })
    rec(eng, part, 'A: Tab marca el segmento activo', st.active)
    rec(eng, part, 'A: el segmento activo gana ancho (> 15 %)', st.w[1] > w0[1] * 1.15, `${Math.round(w0[1])} → ${Math.round(st.w[1])}`)
    rec(eng, part, 'A: los demás no bajan de su mínimo (space × 32)', st.w[0] >= 159 && st.w[2] >= 127, st.w.map(Math.round).join(','))
    rec(eng, part, 'A: anillo de foco en el segmento entero (≥ 2px)', /solid/.test(st.outline) && parseFloat(st.outline.split(' ')[1]) >= 2, st.outline)
    rec(eng, part, 'A: la lente se eleva (sombra) sobre la barra hundida', st.shadow && st.surf !== st.lensBg, `${st.surf} / ${st.lensBg}`)
    rec(eng, part, 'A: las costuras de los dos lados del activo se abren', st.seams.every((o) => Number(o) === 0), st.seams.join(','))

    // Panel anclado del combobox (#358) bajo su segmento
    await p.keyboard.type('can')
    await p.waitForTimeout(500)
    const pan = await p.evaluate(() => {
      const f = document.querySelector('[data-example="vuelos"]')
      const pop = f.querySelector('.g-combobox__popup:popover-open')
      const cell = f.querySelectorAll('.xb__cell')[1].getBoundingClientRect()
      const box = f.querySelector('[data-k="to"]').closest('.g-input__control').getBoundingClientRect()
      if (!pop) return null
      const r = pop.getBoundingClientRect()
      return { top: r.top, bottom: r.bottom, boxBottom: box.bottom, left: r.left, right: r.right, cl: cell.left, cr: cell.right, opts: pop.querySelectorAll('[role=option]').length }
    })
    rec(eng, part, 'A: el panel de GCombobox se abre desde su segmento, dentro de su ancho (#358)', pan && pan.top <= pan.boxBottom && pan.bottom > pan.boxBottom && pan.left >= pan.cl - 2 && pan.right <= pan.cr + 2 && pan.opts >= 1, JSON.stringify(pan))
    await p.keyboard.press('Escape'); await p.keyboard.press('Escape')

    // Selector de fechas anclado a la barra: dos meses
    await p.evaluate(() => window.scrollTo(0, 0))
    await p.click('[data-example="vuelos"] [data-k="date"]')
    await p.waitForTimeout(500)
    const dp = await p.evaluate(() => {
      const f = document.querySelector('[data-example="vuelos"]')
      const pop = f.querySelector('.g-datepicker__pop:popover-open')
      const bar = f.querySelector('.xb').getBoundingClientRect()
      if (!pop) return null
      const r = pop.getBoundingClientRect()
      return { months: pop.querySelectorAll('.g-datepicker__month').length, left: Math.round(r.left), barLeft: Math.round(bar.left) }
    })
    rec(eng, part, 'A: GDatePicker se ancla a la barra (dos meses, borde de inicio de la barra)', dp && dp.months === 2 && Math.abs(dp.left - dp.barLeft) <= 2, JSON.stringify(dp))
    await p.keyboard.press('Escape')
    await p.waitForTimeout(200)

    // El segmento entero es objetivo: pulsar la etiqueta (span) de Salida abre el selector
    await p.click('[data-example="vuelos"] .g-datepicker__label')
    await p.waitForTimeout(400)
    const lab = await p.evaluate(() => { const pop = document.querySelector('[data-example="vuelos"] .g-datepicker__pop:popover-open'); return { open: !!pop, focusInPop: !!(pop && pop.contains(document.activeElement)) } })
    rec(eng, part, 'A: pulsar la etiqueta (span) del segmento abre su control y el foco entra en él', lab.open && lab.focusInPop, JSON.stringify(lab))
    await p.keyboard.press('Escape')
    await p.waitForTimeout(150)

    // Contraste: etiqueta sobre la superficie y sobre la lente; etiqueta de error; contorno de la superficie
    const cr = await p.evaluate(() => {
      const f = document.querySelector('[data-example="filtro"]')
      const label = getComputedStyle(f.querySelector('.g-select__label')).color
      const surf = getComputedStyle(f.querySelector('.xb__surface'))
      const val = getComputedStyle(f.querySelector('.g-input__field'))
      return {
        label: window.__cr(label, surf.backgroundColor),
        ph: window.__cr(getComputedStyle(f.querySelector('.g-input__field'), '::placeholder').color, surf.backgroundColor),
        edge: window.__cr(surf.borderTopColor, getComputedStyle(f.closest('.frame')).backgroundColor),
        size: parseFloat(getComputedStyle(f.querySelector('.g-select__label')).fontSize),
        valH: f.querySelector('.g-input__control').getBoundingClientRect().height
      }
    })
    rec(eng, part, 'A: etiqueta dentro del segmento ≥ 4.5:1 y ≥ 12px', cr.label >= 4.5 && cr.size >= 12, `${cr.label.toFixed(2)}:1, ${cr.size}px`)
    rec(eng, part, 'A: marcador de posición ≥ 4.5:1', cr.ph >= 4.5, cr.ph.toFixed(2))
    rec(eng, part, 'A: contorno de la superficie (outline) ≥ 3:1 sobre el fondo', cr.edge >= 3, cr.edge.toFixed(2))
    rec(eng, part, 'A: la caja de valor mide ≥ 24px', cr.valH >= 24, cr.valH)
  }

  // Error por segmento: enviar sin destino ni fecha
  await p.evaluate(() => window.scrollTo(0, 0))
  await p.click('[data-example="vuelos"] .xb-go')
  await p.waitForTimeout(300)
  const er = await p.evaluate(() => {
    const f = document.querySelector('[data-example="vuelos"]')
    const res = {}
    for (const k of ['from', 'to', 'date']) {
      const el = f.querySelector(`[data-k="${k}"]`)
      const root = el.closest('.g-input, .g-datepicker, .g-select')
      const msg = root.querySelector(':is(.g-input__message, .g-datepicker__message, .g-select__message)')
      const cell = el.closest('.xb__cell').getBoundingClientRect(), m = msg.getBoundingClientRect()
      res[k] = { inv: el.getAttribute('aria-invalid') === 'true', desc: (el.getAttribute('aria-describedby') || '').includes(msg.id), txt: msg.textContent.trim(), under: m.left >= cell.left - 1 && m.left < cell.right && m.top >= f.querySelector(`[data-k="${k}"]`).closest(':is(.g-input__row, .g-datepicker__field)').getBoundingClientRect().bottom - 1 }
    }
    res.focus = document.activeElement && document.activeElement.dataset.k
    return res
  })
  rec(eng, part, 'error: aria-invalid solo en los segmentos que fallan', !er.from.inv && er.to.inv && er.date.inv)
  rec(eng, part, 'error: cada mensaje en el aria-describedby de su control', er.to.desc && er.date.desc)
  rec(eng, part, 'error: el mensaje queda debajo de su segmento', er.to.under && er.date.under, JSON.stringify([er.to.under, er.date.under]))
  rec(eng, part, 'error: el foco va al primer segmento que falla', er.focus === 'to', er.focus)
  if (part === 'A') {
    const ec = await p.evaluate(() => {
      const c = document.querySelector('[data-example="vuelos"] [data-k="date"]').closest('.xb__cell')
      const lab = getComputedStyle(c.querySelector('.g-datepicker__label')).color
      return { cr: window.__cr(lab, getComputedStyle(document.querySelector('[data-example="vuelos"] .xb__surface')).backgroundColor), mark: getComputedStyle(c.querySelector('.xb__lens')).boxShadow.includes('inset') }
    })
    rec(eng, part, 'A: segmento con error: etiqueta danger ≥ 4.5:1 y marca de forma (barra interior)', ec.cr >= 4.5 && ec.mark, ec.cr.toFixed(2))
  }

  // Columna a 420 y móvil a 320
  await setW(p, 420)
  await p.waitForTimeout(250)
  const col = await p.evaluate(() => [...document.querySelectorAll('.xb')].map((e) => e.dataset.layout))
  rec(eng, part, 'columna con el marco a 420px', col.every((l) => l === 'column'), col.join(','))
  const colOrder = await p.evaluate(() => {
    const ys = ['from', 'to', 'date'].map((k) => document.querySelector(`[data-example="vuelos"] [data-k="${k}"]`).getBoundingClientRect().top)
    return ys[0] < ys[1] && ys[1] < ys[2]
  })
  rec(eng, part, 'columna: orden visual = orden DOM', colOrder)
  rec(eng, part, 'sin errores de consola', p.__errs.length === 0, p.__errs.slice(0, 2).join(' | '))
  await p.context().close()

  const m = await open(b, qs, { vw: 320, vh: 800 })
  const mo = await m.evaluate(() => ({ overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, lay: [...document.querySelectorAll('.xb')].map((e) => e.dataset.layout) }))
  rec(eng, part, 'móvil 320px: columna y sin desbordamiento', !mo.overflow && mo.lay.every((l) => l === 'column'), JSON.stringify(mo))
  await m.context().close()

  if (part === 'A') {
    // Segmentada: bandeja + contorno de cada segmento ≥ 3:1 sobre la bandeja
    const s = await open(b, '?c=A&appearance=segmented&shape=rounded')
    await s.evaluate(HELPERS)
    const sg = await s.evaluate(() => {
      const f = document.querySelector('[data-example="filtro"]')
      const lens = getComputedStyle(f.querySelector('.xb__lens')), tray = getComputedStyle(f.querySelector('.xb__surface'))
      return { cr: window.__cr(lens.borderTopColor, tray.backgroundColor), seams: getComputedStyle(f.querySelectorAll('.xb__cell')[1], '::before').content }
    })
    rec(eng, part, 'A segmentada: contorno del segmento ≥ 3:1 sobre la bandeja', sg.cr >= 3, sg.cr.toFixed(2))
    rec(eng, part, 'A segmentada: sin costuras', sg.seams === 'none' || sg.seams === 'normal', sg.seams)
    await s.context().close()
    // Movimiento reducido: el ancho no viaja
    const r = await open(b, '?c=A', { reducedMotion: 'reduce' })
    const tr = await r.evaluate(() => getComputedStyle(document.querySelector('.xb--A')).transitionDuration)
    rec(eng, part, 'A con movimiento reducido: sin transición de columnas', tr.split(',').every((d) => parseFloat(d) === 0), tr)
    await r.context().close()
  }
}

async function runB(b, eng) {
  const part = 'B'
  const p = await open(b, '?c=B')
  await p.evaluate(HELPERS)
  for (const ex of ['vuelos', 'filtro']) await checkCommon(p, eng, part, ex, '.xp')
  await tabOrder(p, 'vuelos', '[data-k="from"]')
  const seq = await collectTab(p, 'vuelos', 4, eng)
  rec(eng, part, 'Tab recorre la frase en orden', seq.join(',') === 'from,to,date,go', seq.join(','))
  // La palabra y su hueco en la misma línea, a 1100 y a 320
  const same = async () => p.evaluate(() => [...document.querySelectorAll('.xp__slot')].every((s) => {
    const l = s.querySelector(':is(.g-input__label, .g-select__label, .g-datepicker__label)').getBoundingClientRect()
    const bx = s.querySelector(':is(.g-input__row, .g-select__control, .g-datepicker__field)').getBoundingClientRect()
    return l.bottom > bx.top && l.top < bx.bottom
  }))
  rec(eng, part, 'palabra y hueco en la misma línea (1100px)', await same())
  const hue = await p.evaluate(() => {
    const s = document.querySelector('.xp__slot--to .g-input__control')
    const sh = getComputedStyle(s).boxShadow
    const lab = getComputedStyle(document.querySelector('.xp__slot--to .g-input__label')).color
    const bg = getComputedStyle(document.querySelector('[data-example="vuelos"]').closest('.frame')).backgroundColor
    return { sh, cr: window.__cr(lab, bg), line: window.__cr(getComputedStyle(document.documentElement).getPropertyValue('--g-color-border-control').trim(), bg), h: s.getBoundingClientRect().height }
  })
  rec(eng, part, 'hueco: subrayado ≥ 3:1 (forma del control)', hue.line >= 3 && /inset/.test(hue.sh), hue.line.toFixed(2))
  rec(eng, part, 'palabra (etiqueta) ≥ 4.5:1', hue.cr >= 4.5, hue.cr.toFixed(2))
  rec(eng, part, 'hueco ≥ 44px de alto (objetivo)', hue.h >= 44, hue.h)
  await p.click('[data-example="vuelos"] .xp__go')
  await p.waitForTimeout(300)
  const er = await p.evaluate(() => ({ inv: document.querySelector('[data-example="vuelos"] [data-k="to"]').getAttribute('aria-invalid'), focus: document.activeElement && document.activeElement.dataset.k }))
  rec(eng, part, 'error: hueco inválido y foco en el primero', er.inv === 'true' && er.focus === 'to', JSON.stringify(er))
  await setW(p, 320)
  rec(eng, part, 'palabra y hueco en la misma línea (320px)', await same())
  const ov = await p.evaluate(() => [...document.querySelectorAll('.xp')].every((x) => x.scrollWidth <= x.clientWidth + 1))
  rec(eng, part, 'la frase se pliega sin desbordar (320px)', ov)
  rec(eng, part, 'sin errores de consola', p.__errs.length === 0, p.__errs.slice(0, 2).join(' | '))
  await p.context().close()
}

async function runC(b, eng) {
  const part = 'C'
  const p = await open(b, '?c=C')
  await p.evaluate(HELPERS)
  for (const ex of ['vuelos', 'filtro']) await checkCommon(p, eng, part, ex, '.xs')
  const t0 = await p.evaluate(() => {
    const f = document.querySelector('[data-example="vuelos"]')
    const toks = [...f.querySelectorAll('.xs__token')]
    const edit = f.querySelector('.xs__edit')
    return { exp: toks.map((t) => t.getAttribute('aria-expanded')), names: toks.map((t) => t.getAttribute('aria-label')), vis: toks.map((t) => t.querySelector('.xs__text').textContent), inert: edit.hasAttribute('inert') }
  })
  rec(eng, part, 'resumen: datos como botones con aria-expanded="false"', t0.exp.every((e) => e === 'false'), t0.exp.join(','))
  rec(eng, part, 'resumen: el nombre de cada dato contiene su texto visible (2.5.3)', t0.names.every((n, i) => n.includes(t0.vis[i]) || /sin elegir/.test(n)), JSON.stringify(t0.names))
  rec(eng, part, 'plegada: la edición es inert (fuera del Tab)', t0.inert)
  await p.click('[data-example="vuelos"] .xs__token[data-token="to"]')
  await p.waitForTimeout(500)
  const t1 = await p.evaluate(() => {
    const f = document.querySelector('[data-example="vuelos"]')
    return { open: f.querySelector('.xs').classList.contains('is-open'), exp: f.querySelector('.xs__token').getAttribute('aria-expanded'), focus: document.activeElement && document.activeElement.dataset.k, sumInert: f.querySelector('.xs__summary').hasAttribute('inert'), ctl: f.querySelector('.xs__token').getAttribute('aria-controls') }
  })
  rec(eng, part, 'pulsar un dato despliega la barra y enfoca ESE campo', t1.open && t1.focus === 'to', JSON.stringify(t1))
  rec(eng, part, 'desplegada: aria-expanded="true" y aria-controls a la edición; resumen inert', t1.exp === 'true' && !!t1.ctl && t1.sumInert)
  // Esc: el primero lo usa el campo si tiene algo abierto; con nada abierto, recoge y devuelve el foco al dato
  for (let i = 0; i < 3; i++) {
    const still = await p.evaluate(() => document.querySelector('[data-example="vuelos"] .xs').classList.contains('is-open'))
    if (!still) break
    await p.keyboard.press('Escape'); await p.waitForTimeout(200)
  }
  const t2 = await p.evaluate(() => ({ open: document.querySelector('[data-example="vuelos"] .xs').classList.contains('is-open'), tok: document.activeElement && document.activeElement.dataset.token }))
  rec(eng, part, 'Esc (sin paneles abiertos) recoge y devuelve el foco al dato', !t2.open && t2.tok === 'to', JSON.stringify(t2))
  // Salir con Tab recoge
  await p.click('[data-example="vuelos"] .xs__token[data-token="date"]')
  await p.waitForTimeout(400)
  const d1 = await p.evaluate(() => document.activeElement && document.activeElement.dataset.k)
  rec(eng, part, 'pulsar «Fecha» enfoca Salida', d1 === 'date', d1)
  await p.keyboard.press('Escape'); await p.waitForTimeout(150)
  await p.evaluate(() => { const f = document.querySelector('[data-example="vuelos"]'); if (!f.querySelector('.xs').classList.contains('is-open')) f.querySelector('.xs__token[data-token="date"]').click() })
  await p.waitForTimeout(400)
  await p.evaluate(() => document.querySelector('[data-example="vuelos"] [data-k="date"]').focus())
  const TAB = eng === 'webkit' ? 'Alt+Tab' : 'Tab'
  await p.keyboard.press(TAB); await p.waitForTimeout(80)
  await p.keyboard.press(TAB); await p.waitForTimeout(300)
  const t3 = await p.evaluate(() => ({ open: document.querySelector('[data-example="vuelos"] .xs').classList.contains('is-open'), in: document.querySelector('[data-example="vuelos"]').contains(document.activeElement) }))
  rec(eng, part, 'salir de la barra con Tab la recoge', !t3.open, JSON.stringify(t3))
  rec(eng, part, 'sin errores de consola', p.__errs.length === 0, p.__errs.slice(0, 2).join(' | '))
  await p.context().close()

  // Estrecho: hoja (GDialog)
  const m = await open(b, '?c=C', { vw: 400, vh: 800 })
  await m.click('[data-example="vuelos"] .xs__token[data-token="to"]')
  await m.waitForTimeout(700)
  const s1 = await m.evaluate(() => ({ dlg: !!document.querySelector('dialog[open]'), focus: document.activeElement && document.activeElement.dataset.k, inDlg: !!(document.activeElement && document.activeElement.closest('dialog')) }))
  rec(eng, part, 'estrecho: el dato abre una hoja con el foco en ese campo', s1.dlg && s1.focus === 'to' && s1.inDlg, JSON.stringify(s1))
  await m.evaluate(() => { const b = [...document.querySelectorAll('dialog[open] button')].find((x) => x.textContent.trim() === 'Listo'); b && b.click() })
  await m.waitForTimeout(600)
  const s2 = await m.evaluate(() => ({ dlg: !!document.querySelector('dialog[open]'), tok: document.activeElement && document.activeElement.dataset.token, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }))
  rec(eng, part, 'estrecho: «Listo» cierra y el foco vuelve al dato', !s2.dlg && s2.tok === 'to', JSON.stringify(s2))
  rec(eng, part, 'estrecho: sin desbordamiento horizontal', !s2.overflow)
  await m.context().close()
}

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  try {
    for (const part of PARTS) {
      try {
        if (part === 'base' || part === 'A') await runBaseOrA(b, eng, part)
        else if (part === 'B') await runB(b, eng)
        else if (part === 'C') await runC(b, eng)
      } catch (e) { rec(eng, part, 'excepción', false, String(e).slice(0, 300)) }
    }
  } finally { await b.close() }
}
server.close()
const ok = R.filter((r) => r.ok).length
console.log(`\n${ok}/${R.length} comprobaciones` + (ok === R.length ? ' · todo en verde' : ''))
for (const eng of ENGINES) { const e = R.filter((r) => r.eng === eng); console.log(`  ${eng}: ${e.filter((r) => r.ok).length}/${e.length}`) }
process.exit(ok === R.length ? 0 : 1)
