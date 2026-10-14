// Verificación del prototipo de filas por página (kiwi, paginación r02): base y conceptos A, B y C en Chromium, Firefox y WebKit.
// Ejecutar desde la raíz: node design/lab/pagination/r02/verificar.mjs
//   Puerto 4213 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  PARTS=base,A,B,C  VERBOSE=1
// Requiere packages/vue/dist (npm run build) para los tokens y la fuente. Solo lee; no toca packages/.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4213)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(path))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/pagination/r02/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'base,A,B,C').split(',')
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function open(b, qs, opts = {}) {
  const { vw = 1280, vh = 900, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE + qs, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await p.waitForFunction(() => window.__pg && window.__pg.ready)
  await p.evaluate(() => document.fonts.ready)
  return { p, context, errs }
}
// Página 2 (filas 11–20) con la fila LT-0015 a 2 px del borde superior de la ventana
async function park(p, key = 'LT-0015', y = 2) {
  await p.evaluate(() => window.__pg.goPage(2))
  await p.evaluate(({ key, y }) => {
    const tr = document.querySelector(`tr[data-key="${key}"]`)
    scrollBy(0, tr.getBoundingClientRect().top - y)
  }, { key, y })
  await wait(200) // deja pasar el anuncio del cambio de página
}
// Cambia el tamaño con la interfaz de cada concepto, como lo haría una persona
async function setSize(p, c, n) {
  if (c === 'base') { await p.focus('.pgBase-size select'); await p.selectOption('.pgBase-size select', String(n)) }
  if (c === 'A') { await p.click('.pgA-range'); await p.click(`.pgA-item[data-size="${n}"]`) }
  if (c === 'B' || c === 'C') {
    // Teclado: en B el grupo de radios (← →), en C el slider. El clic en B se mide aparte (paso 4)
    await p.focus(c === 'B' ? '.pgB-seg input:checked' : '.pgC-grip')
    const now = await p.evaluate(() => window.__pg.S.size)
    const order = [10, 25, 50, 100]
    const d = order.indexOf(n) - order.indexOf(now)
    for (let i = 0; i < Math.abs(d); i++) { await p.keyboard.press(d > 0 ? 'ArrowRight' : 'ArrowLeft'); await wait(30) }
  }
  await wait(120)
}
const controlSel = { base: '.pgBase-size select', A: '.pgA-range', B: '.pgB-seg input:checked', C: '.pgC-grip' }
const inView = (p, sel) => p.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight }, sel)

async function common(b, eng, c) {
  // 1 · carga sin errores
  {
    const { p, context, errs } = await open(b, `?c=${c}`)
    rec(eng, c, 'sin errores en consola', errs.length === 0, errs.join(' | '))
    const cnt = await p.evaluate(() => document.querySelectorAll('tbody tr[data-key]').length)
    rec(eng, c, '10 filas al inicio', cnt === 10, cnt)

    // 2 · 10 → 25 desde la página 2 con la fila 15 arriba: página 1, la fila no se mueve, foco en el control, un anuncio
    await park(p)
    const before = (await p.evaluate(() => window.__pg.S.events.length))
    await setSize(p, c, 25)
    const st = await p.evaluate(() => ({ page: window.__pg.S.page, size: window.__pg.S.size, hold: window.__pg.S.lastHold }))
    rec(eng, c, '10→25: página 1 (la fila 15 sigue en la página)', st.page === 1 && st.size === 25, JSON.stringify(st))
    rec(eng, c, '10→25: la fila 15 no se mueve (Δ ≤ 1 px)', st.hold && Math.abs(st.hold.after - st.hold.before) <= 1, JSON.stringify(st.hold))
    const foc = await p.evaluate((sel) => document.activeElement === document.querySelector(sel), controlSel[c])
    rec(eng, c, 'el foco se queda en el control', foc)
    await wait(150)
    const said = await p.evaluate((n) => window.__pg.S.events.slice(n).filter((e) => e.kind === 'say').map((e) => e.text), before)
    rec(eng, c, 'un solo anuncio: «Filas 1–25 de 240»', said.length === 1 && said[0] === 'Filas 1–25 de 240', JSON.stringify(said))
    const emitted = await p.evaluate((n) => window.__pg.S.events.slice(n).filter((e) => e.kind === 'emit').map((e) => e.text), before)
    rec(eng, c, 'emite update:pageSize antes que update:page', emitted[0] === 'update:pageSize 25' && emitted[1] === 'update:page 1', JSON.stringify(emitted))

    // 3 · 25 → 100: la fila sigue; si el control fuera a salir de la pantalla, el control gana (salvo B, acoplado)
    await setSize(p, c, 100)
    const h = await p.evaluate(() => window.__pg.S.lastHold)
    const ctl = await inView(p, controlSel[c])
    rec(eng, c, '25→100: el control sigue a la vista', ctl)
    if (c === 'B') rec(eng, c, '25→100: la fila 15 no se mueve con el pie acoplado', Math.abs(h.after - h.before) <= 1 && !h.controlWon, JSON.stringify(h))
    else rec(eng, c, '25→100: la fila cede al control (control gana)', h.controlWon === true, JSON.stringify(h))

    // 4 · 100 → 10 desde la mitad de la página. B: el pie acoplado está a la vista con la fila 62 arriba → página 7 (61–70),
    //     sin desplazar nada. Base, A y C: para llegar al control hay que bajar al pie (Playwright lo desplaza como lo haría
    //     la persona); la regla se comprueba con la fila que queda arriba en ese momento
    await p.evaluate(() => { const tr = document.querySelector('tr[data-key="LT-0062"]'); scrollBy(0, tr.getBoundingClientRect().top - 2) })
    await wait(80)
    if (c === 'B') {
      const bx = await p.evaluate(() => { const r = document.querySelector('.pgB-seg:has(input[value="10"])').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, vis: r.bottom <= innerHeight } })
      rec(eng, c, '100 filas: el control está a la vista sin bajar al pie', bx.vis, JSON.stringify(bx))
      await p.mouse.click(bx.x, bx.y)
      await wait(120)
      const st4 = await p.evaluate(() => ({ page: window.__pg.S.page, hold: window.__pg.S.lastHold }))
      rec(eng, c, '100→10 con la fila 62 arriba: página 7', st4.page === 7 && st4.hold.key === 'LT-0062', JSON.stringify(st4))
      rec(eng, c, '100→10: la fila 62 no se mueve', Math.abs(st4.hold.after - st4.hold.before) <= 1, JSON.stringify(st4.hold))
    } else {
      await p.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'nearest' }), controlSel[c])
      await wait(80)
      const a = await p.evaluate(() => window.__pg.capture())
      await setSize(p, c, 10)
      const st4 = await p.evaluate(() => ({ page: window.__pg.S.page, hold: window.__pg.S.lastHold }))
      const want = Math.floor(a.index / 10) + 1
      rec(eng, c, `100→10: la página la decide la fila a la vista (${a.key} → ${want})`, st4.page === want && st4.hold.key === a.key, JSON.stringify({ a, st4 }))
      rec(eng, c, '100→10: esa fila sigue a la vista', await p.evaluate((k) => { const r = document.querySelector(`tr[data-key="${k}"]`).getBoundingClientRect(); return r.top >= -1 && r.bottom <= innerHeight + 1 }, a.key))
    }

    // 5 · filtrar vuelve a la 1 y conserva el tamaño
    await setSize(p, c, 25)
    await p.evaluate(() => window.__pgFilter())
    const f = await p.evaluate(() => ({ page: window.__pg.S.page, size: window.__pg.S.size, total: window.__pg.total() }))
    rec(eng, c, 'filtrar: página 1, tamaño 25 conservado', f.page === 1 && f.size === 25 && f.total === 38, JSON.stringify(f))
    await context.close()
  }
  // 6 · servidor: esqueleto con las filas que VAN a llegar y la ranura del ancla en su sitio; anuncios «cargando» y rango
  {
    const { p, context, errs } = await open(b, `?c=${c}&server=1`)
    await p.evaluate(() => window.__pg.goPage(2))
    await wait(900)
    await p.evaluate(() => { const tr = document.querySelector('tr[data-key="LT-0015"]'); scrollBy(0, tr.getBoundingClientRect().top - 2) })
    await wait(50)
    const n0 = await p.evaluate(() => window.__pg.S.events.length)
        await setSize(p, c, 25)
    await p.waitForFunction(() => document.querySelector('tbody tr[data-slot]'), null, { timeout: 2000 })
    const sk = await p.evaluate(() => ({ n: document.querySelectorAll('tbody tr[data-slot]').length, top: document.querySelector('tbody tr[data-slot="14"]')?.getBoundingClientRect().top, busy: document.querySelector('table').getAttribute('aria-busy') }))
    rec(eng, c, 'servidor: esqueleto de 25 filas (las que llegan)', sk.n === 25, JSON.stringify(sk))
    rec(eng, c, 'servidor: la ranura de la fila 15 en su sitio (Δ ≤ 1 px)', Math.abs(sk.top - 2) <= 1, sk.top)
    rec(eng, c, 'servidor: aria-busy durante la carga', sk.busy === 'true')
    await p.waitForFunction(() => !window.__pg.S.loading, null, { timeout: 3000 })
    await wait(150)
    const h = await p.evaluate(() => window.__pg.S.lastHold)
    rec(eng, c, 'servidor: al llegar, la fila 15 no se mueve', h && Math.abs(h.after - h.before) <= 1, JSON.stringify(h))
    const said = await p.evaluate((n) => window.__pg.S.events.slice(n).filter((e) => e.kind === 'say').map((e) => e.text), n0)
    rec(eng, c, 'servidor: anuncios «Cargando lotes…» y «Filas 1–25 de 240»', JSON.stringify(said) === JSON.stringify(['Cargando lotes…', 'Filas 1–25 de 240']), JSON.stringify(said))
    rec(eng, c, 'servidor: sin errores', errs.length === 0, errs.join(' | '))
    await context.close()
  }
  // 7 · móvil: 360 px, puntero grueso; el control mide ≥ 44 px y la paginación pasa a compacta
  {
    const mob = eng === 'firefox' ? { vw: 360, vh: 760, hasTouch: true } : { vw: 360, vh: 760, hasTouch: true, isMobile: eng === 'chromium' }
    const { p, context } = await open(b, `?c=${c}`, mob)
    const coarse = await p.evaluate(() => matchMedia('(pointer: coarse)').matches)
    const sel = { base: '.pgBase-size select', A: '.pgA-range', B: '.pgB-seg span', C: '.pgC-tick' }[c]
    const box = await p.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { w: r.width, h: r.height } }, sel)
    if (coarse) rec(eng, c, 'móvil: el control mide ≥ 44 px de alto', box.h >= 44 - 0.5, JSON.stringify(box))
    else rec(eng, c, 'móvil: puntero grueso no emulable en este motor (no medido)', true)
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    rec(eng, c, 'móvil: sin desplazamiento horizontal', over <= 0, over)
    const cards = await p.evaluate(() => document.getElementById('tbl').classList.contains('g-table--mode-cards'))
    rec(eng, c, 'móvil: la tabla en tarjetas', cards)
    await context.close()
  }
}

async function conceptA(b, eng) {
  const { p, context } = await open(b, '?c=A')
  await park(p)
  const name = await p.evaluate(() => document.querySelector('.pgA-range').textContent.trim())
  rec(eng, 'A', 'el nombre del botón empieza por el rango visible (WCAG 2.5.3)', name.startsWith('11–20 de 240'), name)
  await p.focus('.pgA-range')
  await p.keyboard.press('ArrowDown')
  const m = await p.evaluate(() => ({
    exp: document.querySelector('.pgA-range').getAttribute('aria-expanded'),
    role: document.querySelector('.pgA-menu').getAttribute('role'),
    items: [...document.querySelectorAll('.pgA-item')].map((i) => [i.getAttribute('role'), i.getAttribute('aria-checked'), [...i.children].map((c) => c.textContent.trim()).filter(Boolean).join(' ')]),
    focus: document.activeElement.dataset.size
  }))
  rec(eng, 'A', '↓ abre el menú y enfoca la opción marcada', m.exp === 'true' && m.role === 'menu' && m.focus === '10', JSON.stringify(m))
  rec(eng, 'A', 'opciones menuitemradio con aria-checked', m.items.every((i) => i[0] === 'menuitemradio') && m.items.filter((i) => i[1] === 'true').length === 1)
  rec(eng, 'A', 'vista previa: «25 por página 1–25» y «100 … 1–100»', m.items[1][2] === '25 por página 1–25' && m.items[3][2] === '100 por página 1–100', JSON.stringify(m.items))
  await p.keyboard.press('5')
  rec(eng, 'A', 'escribir «5» lleva a 50', await p.evaluate(() => document.activeElement.dataset.size === '50'))
  await p.keyboard.press('Escape')
  rec(eng, 'A', 'Esc cierra y devuelve el foco al botón', await p.evaluate(() => document.activeElement.classList.contains('pgA-range') && document.querySelector('.pgA-menu').hidden))
  await p.evaluate(() => window.__pgFilter())
  await p.click('.pgA-range')
  const t = await p.evaluate(() => [...document.querySelectorAll('.pgA-item .pgA-to')].map((e) => e.textContent))
  rec(eng, 'A', 'con 38 resultados, 50 y 100 dicen «todas»', t[2] === '1–38 · todas' && t[3] === '1–38 · todas', JSON.stringify(t))
  await p.mouse.click(5, 5)
  rec(eng, 'A', 'clic fuera cierra', await p.evaluate(() => document.querySelector('.pgA-menu').hidden))
  await context.close()
}

async function conceptB(b, eng) {
  const { p, context } = await open(b, '?c=B')
  const g = await p.evaluate(() => ({ role: document.querySelector('.pgB-size').getAttribute('role'), name: document.getElementById(document.querySelector('.pgB-size').getAttribute('aria-labelledby')).textContent, radios: document.querySelectorAll('.pgB-size input[type=radio]').length }))
  rec(eng, 'B', 'radiogroup con nombre y 4 radios nativos', g.role === 'radiogroup' && g.name === 'Filas por página' && g.radios === 4, JSON.stringify(g))
  await park(p)
  await p.focus('.pgB-seg input:checked')
  await p.keyboard.press('ArrowRight')
  await wait(120)
  rec(eng, 'B', '→ en el grupo cambia a 25', await p.evaluate(() => window.__pg.S.size === 25))
  rec(eng, 'B', 'la fila ancla lleva la marca «aquí estabas»', await p.evaluate(() => document.querySelector('tr[data-key="LT-0015"]').classList.contains('pgB-here')))
  rec(eng, 'B', 'las filas nuevas aparecen (pgB-new) y las de antes no', await p.evaluate(() => document.querySelector('tr[data-key="LT-0001"]').classList.contains('pgB-new') && !document.querySelector('tr[data-key="LT-0015"]').classList.contains('pgB-new')))
  await setSize(p, 'B', 100)
  await p.evaluate(() => scrollBy(0, 300))
  await wait(80)
  const stuck = await p.evaluate(() => { const n = document.querySelector('.g-pagination'); const r = n.getBoundingClientRect(); return { stuck: n.classList.contains('is-stuck'), bottom: Math.round(r.bottom), vh: innerHeight, pad: getComputedStyle(document.documentElement).scrollPaddingBlockEnd } })
  rec(eng, 'B', 'con 100 filas el pie se acopla al borde inferior', stuck.stuck && Math.abs(stuck.bottom - stuck.vh) <= 1, JSON.stringify(stuck))
  rec(eng, 'B', 'receta: scroll-padding-block-end = alto del pie', parseFloat(stuck.pad) > 0, stuck.pad)
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
  await wait(80)
  rec(eng, 'B', 'al final de la tabla el pie vuelve a su sitio', await p.evaluate(() => !document.querySelector('.g-pagination').classList.contains('is-stuck')))
  await context.close()
  // Movimiento reducido: la marca existe, sin animación
  const r = await open(b, '?c=B', { reducedMotion: 'reduce' })
  await park(r.p)
  await setSize(r.p, 'B', 25)
  const an = await r.p.evaluate(() => { const td = document.querySelector('tr[data-key="LT-0015"] td'); return { name: getComputedStyle(td).animationName, bg: getComputedStyle(td).backgroundColor } })
  rec(eng, 'B', 'movimiento reducido: marca quieta, sin animación', an.name === 'none' && an.bg !== 'rgba(0, 0, 0, 0)', JSON.stringify(an))
  await r.context.close()
}

async function conceptC(b, eng) {
  const { p, context } = await open(b, '?c=C')
  const s = await p.evaluate(() => { const g = document.querySelector('.pgC-grip'); return [g.getAttribute('role'), g.getAttribute('aria-valuenow'), g.getAttribute('aria-valuetext'), g.getAttribute('aria-label')] })
  rec(eng, 'C', 'slider con valor, texto y nombre', s.join('|') === 'slider|10|10 por página|Filas por página', s.join('|'))
  await p.focus('.pgC-grip')
  await p.keyboard.press('End')
  await wait(100)
  rec(eng, 'C', 'Fin → 100', await p.evaluate(() => window.__pg.S.size === 100 && document.querySelector('.pgC-grip').getAttribute('aria-valuetext') === '100 por página'))
  await p.keyboard.press('Home')
  await wait(100)
  rec(eng, 'C', 'Inicio → 10', await p.evaluate(() => window.__pg.S.size === 10))
  const tick = await p.evaluate(() => { const t = document.querySelector('.pgC-ticks'); return [t.getAttribute('aria-hidden'), document.querySelector('.pgC-tick').tabIndex] })
  rec(eng, 'C', 'marcas: alternativa de puntero fuera del árbol y del Tab', tick[0] === 'true' && tick[1] === -1, JSON.stringify(tick))
  await p.click('.pgC-tick[data-size="25"]')
  await wait(100)
  rec(eng, 'C', 'tocar «25» aplica 25', await p.evaluate(() => window.__pg.S.size === 25))
  // Arrastre: dos muescas hacia abajo = 25 → 100; Esc cancela
  // El agarre a media pantalla: cerca del borde inferior no queda recorrido para tirar (límite anotado en la declaración)
  await p.evaluate(() => scrollBy(0, document.querySelector('.pgC-grip').getBoundingClientRect().top - 300))
  await wait(80)
  const g = await p.evaluate(() => { const r = document.querySelector('.pgC-grip').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, notch: parseFloat(getComputedStyle(document.getElementById('tbl')).getPropertyValue('--g-space-1')) * 12 } })
  // --g-space-1 está en px en el tema por defecto
  await p.mouse.move(g.x, g.y)
  await p.mouse.down()
  await p.mouse.move(g.x, g.y + g.notch * 2, { steps: 6 })
  const ghost = await p.evaluate(() => { const e = document.querySelector('.pgC-ghost'); return { hidden: e.hidden, text: e.textContent } })
  rec(eng, 'C', 'al arrastrar, la línea fantasma dice adónde', !ghost.hidden && ghost.text.startsWith('100 por página'), JSON.stringify(ghost))
  await p.mouse.up()
  await wait(120)
  rec(eng, 'C', 'soltar aplica 100', await p.evaluate(() => window.__pg.S.size === 100))
  await p.mouse.move(g.x, g.y)
  await context.close()
}

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  for (const c of PARTS) {
    try {
      await common(b, eng, c)
      if (c === 'A') await conceptA(b, eng)
      if (c === 'B') await conceptB(b, eng)
      if (c === 'C') await conceptC(b, eng)
    } catch (e) { rec(eng, c, 'excepción', false, String(e).slice(0, 300)) }
  }
  await b.close()
}
server.close()
const by = {}
for (const r of R) { const k = `${r.eng} ${r.part}`; by[k] = by[k] || [0, 0]; by[k][1]++; if (r.ok) by[k][0]++ }
for (const [k, [a, n]] of Object.entries(by)) console.log(`${k}: ${a}/${n}`)
const ok = R.filter((r) => r.ok).length
console.log(`TOTAL ${ok}/${R.length}`)
process.exit(ok === R.length ? 0 : 1)
