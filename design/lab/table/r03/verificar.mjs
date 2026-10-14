// Verificación del prototipo de GTable r03 (kiwi): activación y estado de fila, base y conceptos A, B y C.
// Ejecutar desde la raíz: GRANA_PW_PORT=4217 node design/lab/table/r03/verificar.mjs
//   ENGINES=chromium,firefox,webkit  PARTS=base,A,B,C  VERBOSE=1  SHOTS=<carpeta>
// Requiere packages/vue/dist (tokens y fuente). Solo lee; no toca packages/.
import http from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4217)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(path))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/table/r03/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'base,A,B,C').split(',')
const V = !!process.env.VERBOSE
const SHOTS = process.env.SHOTS
if (SHOTS) await mkdir(SHOTS, { recursive: true })
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }
const MOD = process.platform === 'darwin' ? 'Meta' : 'Control'

async function open (b, c, qs = '', opts = {}) {
  const { vw = 1200, vh = 1400, reduce = false, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: reduce ? 'reduce' : 'no-preference', ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(`${BASE}?c=${c}&lat=0${qs}`, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('tbody tr[data-key]')
  return { p, context, errs }
}
const logTop = (p) => p.evaluate(() => document.querySelector('#log li')?.textContent || '')
const logAll = (p) => p.evaluate(() => [...document.querySelectorAll('#log li')].map((l) => l.textContent))
const clearLog = (p) => p.evaluate(() => { document.querySelector('#log').innerHTML = '' })
const cellBox = (p, key, sel) => p.evaluate(([k, s]) => { const r = document.querySelector(`tr[data-key="${k}"] ${s}`).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, l: r.left, r: r.right, t: r.top, b: r.bottom } }, [key, sel])

// Comunes a las cuatro: semántica, puerta, estado, guardas
async function common (b, eng, c) {
  const { p, context, errs } = await open(b, c)
  const s = await p.evaluate(() => {
    const t = document.querySelector('table.g-table__table')
    const rows = [...t.tBodies[0].querySelectorAll('tr.g-table__row')]
    const doors = rows.map((r) => r.querySelector('.r3-door'))
    return {
      grid: !!document.querySelector('[role="grid"],[role="treegrid"]'),
      rowTab: rows.some((r) => r.hasAttribute('tabindex')),
      oneDoor: rows.every((r) => r.querySelectorAll('.r3-door').length === 1),
      doorTags: [...new Set(doors.map((d) => d.tagName))],
      names: doors.slice(0, 3).map((d) => d.textContent.trim()),
      described: rows.filter((r) => r.dataset.status).every((r) => { const d = r.querySelector('.r3-door'); const id = d.getAttribute('aria-describedby'); const el = id && document.getElementById(id); return el && el.textContent.trim().length > 0 && r.contains(el) }),
      plainNoDesc: rows.filter((r) => !r.dataset.status).every((r) => !r.querySelector('.r3-door').hasAttribute('aria-describedby')),
      statusRows: rows.filter((r) => r.dataset.status).map((r) => r.dataset.status),
      noAriaSel: !t.querySelector('[aria-selected]'),
      noRowRole: !rows.some((r) => r.querySelector('[role="status"],[role="alert"]')),
      ids: (() => { const all = [...document.querySelectorAll('[id]')].map((e) => e.id); return all.length === new Set(all).size })()
    }
  })
  rec(eng, c, 'tabla de datos, sin grid ni tabindex en filas', !s.grid && !s.rowTab)
  rec(eng, c, 'una puerta por fila', s.oneDoor)
  rec(eng, c, 'la puerta es un elemento nativo', c === 'B' ? s.doorTags.join() === 'BUTTON' : s.doorTags.join() === 'A', s.doorTags.join())
  rec(eng, c, 'nombre de la puerta = código del lote', s.names.every((n) => /^L-\d+$/.test(n)), s.names.join())
  rec(eng, c, 'estado describe la puerta (texto dentro de la fila)', s.described)
  rec(eng, c, 'sin estado, sin descripción', s.plainNoDesc)
  rec(eng, c, 'hay filas con los tres estados en la página 1', ['error', 'warning'].every((x) => s.statusRows.includes(x)), s.statusRows.join())
  rec(eng, c, 'sin aria-selected ni role status/alert en filas', s.noAriaSel && s.noRowRole)
  rec(eng, c, 'ids únicos', s.ids)

  // Forma del estado (no solo color)
  const shape = await p.evaluate((c) => {
    const out = {}
    for (const st of ['error', 'warning', 'info']) {
      const tr = document.querySelector(`tr[data-status="${st}"]`); if (!tr) continue
      if (c === 'B') { const td = tr.querySelector('td.is-cause'); out[st] = td ? getComputedStyle(td).boxShadow !== 'none' && !!td.querySelector('.g-badge__text') : false } else out[st] = getComputedStyle(tr.querySelector('td')).borderInlineStartStyle
    }
    return out
  }, c)
  if (c === 'B') rec(eng, c, 'sello en la celda que causa (con texto)', shape.error === true && shape.warning === true, JSON.stringify(shape))
  else rec(eng, c, 'lomo de forma distinta por estado', shape.error === 'solid' && shape.warning === 'dashed' && (!shape.info || shape.info === 'dotted'), JSON.stringify(shape))
  // Columnas alineadas aunque haya lomo
  const aligned = await p.evaluate(() => { const xs = [...document.querySelectorAll('tbody tr.g-table__row')].map((r) => Math.round(r.cells[1].getBoundingClientRect().left)); return new Set(xs).size === 1 })
  rec(eng, c, 'el lomo no mueve las columnas', aligned)

  // Casilla y menú no activan
  const k0 = await p.evaluate(() => document.querySelector('tbody tr.g-table__row').dataset.key)
  await clearLog(p)
  await p.click(`tr[data-key="${k0}"] .g-table__select input`)
  await p.click(`tr[data-key="${k0}"] .r3-more`)
  const lg = await logAll(p)
  rec(eng, c, 'casilla y menú no activan la fila', lg.every((l) => /^update:selected|^menú/.test(l)), lg.join(' | '))
  rec(eng, c, 'la casilla no abre ningún detalle', !(await p.evaluate(() => document.querySelector('#dlg').open || document.querySelector('.r3-detail:not([hidden])') || !document.querySelector('#inspector').hidden)))

  // Selección de texto en otra celda no activa (todas)
  await clearLog(p)
  const loc = await cellBox(p, k0, 'td:nth-child(3)')
  await p.mouse.move(loc.l + 4, loc.y); await p.mouse.down(); await p.mouse.move(loc.r - 4, loc.y, { steps: 6 }); await p.mouse.up()
  const selText = await p.evaluate(() => String(getSelection()).trim())
  rec(eng, c, 'arrastrar para seleccionar texto no activa', (await logAll(p)).length === 0 && selText.length > 0, selText)
  await p.evaluate(() => getSelection().removeAllRanges())

  // Con modificador sobre la puerta-enlace no se emite (#505)
  if (c !== 'B') {
    await clearLog(p)
    const pages = []
    context.on('page', (np) => pages.push(np))
    await p.click(`tr[data-key="${k0}"] .r3-door`, { modifiers: [MOD] })
    await p.waitForTimeout(300)
    rec(eng, c, `${MOD}+clic en la puerta: sin navigate`, (await logAll(p)).every((l) => !l.startsWith('navigate')))
  }

  // 360: tarjetas sin desborde
  const m = await open(b, c, '&w=360')
  const cards = await m.p.evaluate(() => ({ cards: document.querySelector('#tb').classList.contains('g-table--mode-cards'), over: document.documentElement.scrollWidth - document.documentElement.clientWidth, frame: document.querySelector('#tb').scrollWidth - document.querySelector('#tb').clientWidth }))
  rec(eng, c, '360: tarjetas sin desborde', cards.cards && cards.over <= 0 && cards.frame <= 0, JSON.stringify(cards))
  if (SHOTS) await m.p.screenshot({ path: `${SHOTS}/${eng}-${c}-360.png`, fullPage: true })
  await m.context.close()
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/${eng}-${c}.png`, fullPage: true })
  rec(eng, c, 'consola limpia', errs.length === 0, errs.join(' | '))
  await context.close()
}

async function partBase (b, eng, c = 'base') {
  const { p, context } = await open(b, c)
  const k = await p.evaluate(() => document.querySelectorAll('tbody tr.g-table__row')[1].dataset.key)
  // Clic en una celda cualquiera (no control) → abre el detalle; el foco vuelve a la puerta al cerrar
  await p.click(`tr[data-key="${k}"] td:nth-child(5)`)
  rec(eng, c, 'clic en la fila abre el detalle', await p.evaluate(() => document.querySelector('#dlg').open))
  rec(eng, c, 'emite navigate con key y href', /^navigate .*"key":"l\d+".*"href"/.test(await logTop(p)), await logTop(p))
  await p.keyboard.press('Escape')
  const back = await p.evaluate((k) => document.activeElement === document.querySelector(`tr[data-key="${k}"] .r3-door`), k)
  rec(eng, c, 'al cerrar, el foco vuelve a la puerta de la fila', back)
  // Teclado: Intro en la puerta
  await p.keyboard.press('Enter')
  rec(eng, c, 'Intro en la puerta abre', await p.evaluate(() => document.querySelector('#dlg').open))
  await p.keyboard.press('Escape')
  // Doble clic: un solo navigate
  await clearLog(p)
  await p.dblclick(`tr[data-key="${k}"] td:nth-child(5)`)
  await p.keyboard.press('Escape')
  const n = (await logAll(p)).filter((l) => l.startsWith('navigate')).length
  rec(eng, c, 'doble clic = una sola activación', n === 1, String(n))
  await context.close()
}

async function partA (b, eng) {
  const c = 'A'
  const { p, context } = await open(b, c)
  const k = await p.evaluate(() => document.querySelectorAll('tbody tr.g-table__row')[1].dataset.key)
  // Clic en otra celda: nada
  await clearLog(p)
  await p.click(`tr[data-key="${k}"] td:nth-child(5)`)
  rec(eng, c, 'clic fuera de la celda principal no activa', (await logAll(p)).length === 0 && !(await p.evaluate(() => document.querySelector('#dlg').open)))
  // Doble clic en la ubicación selecciona palabra y no activa
  const lc = await cellBox(p, k, 'td:nth-child(3)')
  await p.mouse.dblclick(lc.l + 24, lc.y)
  const dsel = await p.evaluate(() => String(getSelection()).trim())
  rec(eng, c, 'doble clic en otra celda selecciona texto sin activar', (await logAll(p)).length === 0 && dsel.length > 0, `${dsel} | ${(await logAll(p)).join()}`)
  await p.evaluate(() => getSelection().removeAllRanges())
  // Clic en el hueco de la celda principal (lejos del texto del código) → la puerta
  const box = await cellBox(p, k, 'td.g-table__cell--primary')
  const hit = await p.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('.r3-door') ? true : false, [box.r - 6, box.b - 4])
  rec(eng, c, 'el borde de la celda principal es la puerta (hit-test)', hit)
  await p.mouse.click(box.r - 6, box.b - 4)
  rec(eng, c, 'clic en la celda principal abre', await p.evaluate(() => document.querySelector('#dlg').open))
  await p.keyboard.press('Escape')
  await p.waitForTimeout(50) // el evento close es una tarea
  const after = await p.evaluate((k) => ({ focus: document.activeElement === document.querySelector(`tr[data-key="${k}"] .r3-door`), last: document.querySelector(`tr[data-key="${k}"]`).classList.contains('is-last') }), k)
  rec(eng, c, 'al volver: foco en la puerta y la fila marcada como última', after.focus && after.last, JSON.stringify(after))
  // Anillo de foco en la celda (no recortado)
  // Por teclado (sin Tab, que WebKit no da a enlaces): puerta enfocada, Intro abre, Esc vuelve con :focus-visible
  await p.focus(`tr[data-key="${k}"] .r3-door`); await p.keyboard.press('Enter'); await p.keyboard.press('Escape')
  const ring = await p.evaluate((k) => getComputedStyle(document.querySelector(`tr[data-key="${k}"] td.g-table__cell--primary`)).outlineStyle, k)
  rec(eng, c, 'con foco de teclado, el anillo rodea la celda principal', ring === 'solid', ring)
  // La flecha asoma con foco
  await p.waitForTimeout(300)
  const arrow = await p.evaluate((k) => getComputedStyle(document.querySelector(`tr[data-key="${k}"] .r3-arrow`)).opacity, k)
  rec(eng, c, 'la flecha asoma con foco', Number(arrow) > 0.9, arrow)
  // Movimiento reducido: sin transición
  const r = await open(b, c, '', { reduce: true })
  const tr = await r.p.evaluate(() => getComputedStyle(document.querySelector('.r3-arrow')).transitionDuration)
  rec(eng, c, 'movimiento reducido: flecha sin transición', /^0s/.test(tr), tr)
  await r.context.close()
  await context.close()
}

async function partB (b, eng) {
  const c = 'B'
  const { p, context } = await open(b, c)
  const k = await p.evaluate(() => document.querySelectorAll('tbody tr.g-table__row')[0].dataset.key)
  await p.click(`tr[data-key="${k}"] td:nth-child(4)`)
  const st = await p.evaluate((k) => ({ exp: document.querySelector(`tr[data-key="${k}"] .r3-door`).getAttribute('aria-expanded'), det: !document.getElementById('det-' + k).hidden, ctl: document.querySelector(`tr[data-key="${k}"] .r3-door`).getAttribute('aria-controls') === 'det-' + k, focus: document.activeElement === document.querySelector(`tr[data-key="${k}"] .r3-door`) }), k)
  rec(eng, c, 'clic en la fila despliega (aria-expanded, aria-controls)', st.exp === 'true' && st.det && st.ctl, JSON.stringify(st))
  rec(eng, c, 'tras el clic de fila el foco está en la puerta', st.focus)
  // Doble clic no deshace
  const k2 = await p.evaluate(() => document.querySelectorAll('tbody tr.g-table__row')[2].dataset.key)
  await p.dblclick(`tr[data-key="${k2}"] td:nth-child(4)`)
  rec(eng, c, 'doble clic deja la ficha abierta', await p.evaluate((k) => !document.getElementById('det-' + k).hidden, k2))
  // Esc dentro de la ficha: pliega y vuelve a la puerta
  await p.focus(`#det-${k} .r3-link`)
  await p.keyboard.press('Escape')
  await p.waitForTimeout(400)
  const esc = await p.evaluate((k) => ({ hid: document.getElementById('det-' + k).hidden, focus: document.activeElement === document.querySelector(`tr[data-key="${k}"] .r3-door`) }), k)
  rec(eng, c, 'Esc en la ficha pliega y devuelve el foco', esc.hid && esc.focus, JSON.stringify(esc))
  // Teclado: Intro y Espacio en la puerta
  await p.keyboard.press('Enter')
  const ent = await p.evaluate((k) => !document.getElementById('det-' + k).hidden, k)
  await p.keyboard.press('Space')
  await p.waitForTimeout(400)
  const spc = await p.evaluate((k) => document.getElementById('det-' + k).hidden, k)
  rec(eng, c, 'Intro abre y Espacio cierra (botón nativo)', ent && spc)
  // Orden de foco: puerta → contenido de la ficha → siguiente fila
  await p.keyboard.press('Enter')
  await p.waitForTimeout(50)
  const order = []
  for (let i = 0; i < 4; i++) { await p.keyboard.press('Tab'); order.push(await p.evaluate(() => document.activeElement.className.split(' ')[0] || document.activeElement.tagName)) }
  // WebKit sin «acceso total por teclado» no da Tab a enlaces ni botones (Safari real: entorno real)
  if (eng !== 'webkit') rec(eng, c, 'Tab: puerta → menú de la fila → ficha desplegada', order[0] === 'g-btn' && order[1] === 'r3-link', order.join(' > '))
  // Enlace de ficha completa: clic con modificador no emite (es un <a> normal)
  const h = await p.evaluate((k) => document.querySelector(`#det-${k} .r3-link`).getAttribute('href'), k)
  rec(eng, c, 'la ficha completa es un enlace real', /^#lote\//.test(h || ''), h)
  // Cambiar de página cierra lo que ya no está
  await p.click('#pg-next')
  await p.waitForSelector('#pg-prev:not([disabled])')
  rec(eng, c, 'cambiar de página: expanded solo con filas visibles', await p.evaluate(() => [...window.r3.S.expanded].every((k) => window.r3.S.rows.some((r) => r.id === k))))
  // Reducido: sin transición
  const r = await open(b, c, '', { reduce: true })
  const td = await r.p.evaluate(() => getComputedStyle(document.querySelector('.r3-detail__clip')).transitionDuration)
  rec(eng, c, 'movimiento reducido: despliegue sin transición', /^0s/.test(td), td)
  await r.context.close()
  await context.close()
}

async function partC (b, eng) {
  const c = 'C'
  const { p, context } = await open(b, c)
  const k = await p.evaluate(() => document.querySelectorAll('tbody tr.g-table__row')[1].dataset.key)
  await p.click(`tr[data-key="${k}"] td:nth-child(5)`)
  const s1 = await p.evaluate((k) => ({ cur: document.querySelector(`tr[data-key="${k}"] .r3-door`).getAttribute('aria-current'), n: document.querySelectorAll('[aria-current="true"]').length, ins: !document.getElementById('inspector').hidden, h: document.getElementById('ins-h')?.textContent }), k)
  rec(eng, c, 'clic en la fila la apunta (aria-current único) y llena el inspector', s1.cur === 'true' && s1.n === 1 && s1.ins && /L-\d+/.test(s1.h), JSON.stringify(s1))
  rec(eng, c, 'el inspector es una región con nombre', await p.evaluate(() => { const i = document.getElementById('inspector'); return i.tagName === 'SECTION' && !!document.getElementById(i.getAttribute('aria-labelledby')) }))
  // Recorrer hasta cruzar página
  for (let i = 0; i < 7; i++) { await p.click('#walk-next'); await p.waitForTimeout(30) }
  const s2 = await p.evaluate(() => ({ page: window.r3.S.page, cur: window.r3.S.current, first: window.r3.S.rows[0].id, focus: document.activeElement.id }))
  rec(eng, c, '«Siguiente» cruza a la página 2 y apunta su primera fila', s2.page === 2 && s2.cur === s2.first, JSON.stringify(s2))
  rec(eng, c, 'el foco se queda en «Siguiente»', s2.focus === 'walk-next', s2.focus)
  // Salto al siguiente con aviso
  await p.click('#next-flag')
  const s3 = await p.evaluate(() => !!window.r3.rowStatus(window.r3.S.rows.find((r) => r.id === window.r3.S.current)))
  rec(eng, c, '«Ir al siguiente con aviso» apunta una fila con estado', s3)
  // Recuento de la página en texto
  rec(eng, c, 'recuento de la página en texto', /En esta página/.test(await p.evaluate(() => document.getElementById('tally').textContent)))
  // Anuncio
  await p.waitForTimeout(80)
  rec(eng, c, 'anuncio cortés al apuntar', /inspector/.test(await p.evaluate(() => document.getElementById('tb-live').textContent)))
  await context.close()
}

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  try {
    for (const c of PARTS) {
      await common(b, eng, c)
      if (c === 'base') await partBase(b, eng)
      if (c === 'A') await partA(b, eng)
      if (c === 'B') await partB(b, eng)
      if (c === 'C') await partC(b, eng)
    }
  } finally { await b.close() }
}
server.close()

const by = {}
for (const r of R) { const k = `${r.eng} ${r.part}`; by[k] = by[k] || [0, 0]; by[k][r.ok ? 0 : 1]++ }
for (const [k, [ok, ko]] of Object.entries(by)) console.log(`${k}: ${ok}/${ok + ko}`)
const fails = R.filter((r) => !r.ok).length
console.log(`TOTAL ${R.length - fails}/${R.length}`)
process.exit(fails ? 1 : 0)
