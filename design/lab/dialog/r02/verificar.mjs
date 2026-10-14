// Verificación del prototipo de niveles anidados (kiwi dialog r02): «Hoy» (GDialog real anidado) y conceptos A, B, C
// en Chromium, Firefox y WebKit.
// Ejecutar desde la raíz: node design/lab/dialog/r02/verificar.mjs
//   Puerto 4212 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  PARTS=hoy,A,B,C  VERBOSE=1  SHOTS=<carpeta>
// Requiere packages/vue/dist (npm run build). Solo lee; no toca packages/.
import http from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4212)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(path))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/dialog/r02/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'hoy,A,B,C').split(',')
const V = !!process.env.VERBOSE
const SHOTS = process.env.SHOTS
if (SHOTS) await mkdir(SHOTS, { recursive: true })
const R = []
const M = [] // medidas que se informan (no son criterios)
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }
const meas = (eng, part, name, value) => { M.push({ eng, part, name, value }); console.log(`medida ${eng} ${part} · ${name}: ${JSON.stringify(value)}`) }

async function open(b, qs, opts = {}) {
  const { vw = 1280, vh = 900, reduced = false, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: reduced ? 'reduce' : 'no-preference', ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/\[Grana\]/.test(m.text())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE + qs)
  await p.waitForFunction(() => window.__r02 && document.querySelector('main'))
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(150)
  p.__errs = errs
  return p
}
const T = 280 // espera tras cada paso (más que --g-duration-slow)
const settle = (p, ms = T) => p.waitForTimeout(ms)
const active = (p) => p.evaluate(() => document.activeElement && document.activeElement.id)
const stack = (p) => p.evaluate(() => window.__r02.flow.stack.filter((l) => !l.leaving).map((l) => l.key))
// Lista de GSelect: abrir y activar la fila «Crear…» (la última)
async function createFrom(p, id) {
  await p.click('#' + id)
  await settle(p, 150)
  await p.keyboard.press('End')
  await p.keyboard.press('Enter')
  await settle(p)
}
async function toFive(p) {
  await p.click('#opener'); await settle(p)
  await p.click('#f-detalle-ingreso'); await settle(p)
  await p.click('#f-ingreso-p3'); await settle(p)
  await createFrom(p, 'f-partida-producto')
  await createFrom(p, 'f-producto-categoria')
}
// Fondos visibles: alfa compuesto de los ::backdrop de los <dialog> modales abiertos
const backdrops = (p) => p.evaluate(() => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return 0; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return v.length > 3 ? v[3] : 1 }
  const ds = [...document.querySelectorAll('dialog[open]')].filter((d) => d.matches(':modal'))
  const alphas = ds.map((d) => { const cs = getComputedStyle(d, '::backdrop'); return parse(cs.backgroundColor) * Number(cs.opacity || 1) }).filter((a) => a > 0.001)
  return { visible: alphas.length, composite: Math.round((1 - alphas.reduce((k, a) => k * (1 - a), 1)) * 1000) / 1000 }
})
const nameOf = (p, sel) => p.evaluate((sel) => {
  const n = document.querySelector(sel); if (!n) return null
  const ids = (n.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)
  return ids.map((i) => document.getElementById(i)?.textContent.trim()).join(' ') || n.getAttribute('aria-label')
}, sel)
const liveHost = (p) => p.evaluate(() => { const n = document.getElementById('flow-live'); const d = n && n.closest('dialog'); return { inTop: !!d && d === [...document.querySelectorAll('dialog[open]')].filter((x) => x.matches(':modal')).pop(), text: n && n.textContent } })

// ============================================================================================
async function hoy(b, eng) {
  const P = 'hoy'
  const p = await open(b, '?c=hoy')
  const openAll = async () => {
    await p.click('#hoy-open'); await settle(p)
    for (const i of [1, 2, 3, 4]) { await p.click('#hoy-b' + i); await settle(p) }
  }
  await openAll()
  const n = await p.evaluate(() => [...document.querySelectorAll('dialog[open]')].filter((d) => d.matches(':modal')).length)
  rec(eng, P, 'cinco GDialog reales abiertos (la pila nativa funciona)', n === 5, n)
  const bd = await backdrops(p)
  meas(eng, P, 'fondos visibles y opacidad compuesta con cinco niveles', bd)
  rec(eng, P, 'HALLAZGO: los fondos se suman (más de uno visible)', bd.visible > 1, JSON.stringify(bd))
  // Aviso con el quinto abierto: GToaster ya se traslada al modal superior
  await p.click('#hoy-toast'); await settle(p, 400)
  const toastIn = await p.evaluate(() => { const r = document.querySelector('.g-toaster'); return r && r.closest('dialog') && r.closest('dialog').id })
  rec(eng, P, 'GToaster se traslada al quinto nivel (topModal ya sigue la pila)', toastIn === 'hoy-d5', toastIn)
  // Enviar el formulario del quinto nivel: el submit sube por el DOM a los cuatro formularios de abajo
  await p.fill('#hoy-cat', 'Reactivos')
  const owner = await p.evaluate(() => { const b = document.getElementById('hoy-save5'); return { owner: b.form && b.form.id, nested: [...document.querySelectorAll('form form')].map((f) => f.id) } })
  meas(eng, P, 'formulario dueño del botón «Crear categoría» del nivel 5 y formularios anidados en el DOM', owner)
  await p.click('#hoy-save5'); await settle(p, 500)
  const forms = await p.evaluate(() => JSON.parse(JSON.stringify(window.__r02.today)))
  meas(eng, P, 'tras enviar el formulario del nivel 5: submit e invalid por formulario', { subs: forms.subs, inval: forms.inval, open: forms.hoy })
  rec(eng, P, 'HALLAZGO: el GForm del nivel 5 se pinta como <div> (GForm anidado por inject a través de GDialog) y su botón envía el formulario del nivel 2', owner.owner === 'hoy-f2' && forms.subs.categoria === 0 && forms.subs.ingreso === 1, JSON.stringify({ owner, forms }))
  const after = await active(p)
  meas(eng, P, 'foco tras enviar el nivel 5', after)
  // Volver al quinto y mantener Esc pulsada (repetición de tecla)
  await p.evaluate(() => { const t = window.__r02.today; t.hoy.splice(0, 5, false, false, false, false, false) }); await settle(p, 400)
  await openAll()
  await p.keyboard.press('Escape'); await settle(p)
  const back1 = await active(p)
  rec(eng, P, 'un Esc baja un nivel y el foco vuelve a su disparador (nativo; en WebKit al <dialog>, porque el clic no enfoca, #307)', back1 === 'hoy-b4' || (eng === 'webkit' && back1 === 'hoy-d4'), back1)
  await p.click('#hoy-b4'); await settle(p)
  await p.focus('#hoy-cat')
  await p.keyboard.down('Escape')
  for (let i = 0; i < 6; i++) { await p.waitForTimeout(40); await p.keyboard.down('Escape') }
  await p.keyboard.up('Escape'); await settle(p, 400)
  const left = await p.evaluate(() => window.__r02.today.hoy.filter(Boolean).length)
  meas(eng, P, 'niveles abiertos tras mantener Esc (7 pulsaciones, 6 repetidas) desde el nivel 5', left)
  rec(eng, P, 'HALLAZGO: Esc mantenida cierra más de un nivel', left < 4, left)
  rec(eng, P, 'sin errores en consola', !p.__errs.length, p.__errs.join(' | '))
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/${eng}-hoy.png` })
  await p.context().close()
}

// ============================================================================================
async function concept(b, eng, C) {
  const P = C
  const p = await open(b, '?c=' + C)
  await toFive(p)
  let s = await stack(p)
  rec(eng, P, 'cinco niveles abiertos', s.join() === 'detalle,ingreso,partida,producto,categoria', s.join())
  rec(eng, P, 'foco inicial del nivel 5 en su primer campo (#292)', (await active(p)) === 'f-categoria-nombre', await active(p))
  const sel = C === 'A' ? 'dialog[data-level=categoria]' : C === 'B' ? '.xb-panel:not([hidden])' : '.xc-fold[data-level=categoria]'
  const nm = await nameOf(p, sel)
  rec(eng, P, 'el nivel actual tiene nombre accesible «Categoría nueva»', nm === 'Categoría nueva', nm)
  if (C !== 'C') {
    const dn = await nameOf(p, C === 'A' ? 'dialog[data-level=categoria]' : 'dialog.xb')
    rec(eng, P, 'el <dialog> modal superior se llama como el nivel actual', dn === 'Categoría nueva', dn)
  }
  const bd = await backdrops(p)
  rec(eng, P, 'un solo fondo visible con cinco niveles', bd.visible === 1, JSON.stringify(bd))
  // Lo de abajo no es operable
  const below = await p.evaluate(() => { const n = document.getElementById('f-ingreso-p3'); n.focus(); return document.activeElement === n })
  rec(eng, P, C === 'C' ? 'la fila de la partida sigue a la vista y operable (C no tapa)' : 'los niveles de abajo no reciben el foco', C === 'C' ? below : !below, below)
  await p.focus('#f-categoria-nombre')
  if (C === 'A') {
    const sp = await p.evaluate(() => [...document.querySelectorAll('.xa-card.is-below .xa-spine')].map((n) => { const r = n.getBoundingClientRect(); return { h: Math.round(r.height), vis: getComputedStyle(n).display !== 'none' } }))
    rec(eng, P, 'cuatro lomos visibles con al menos 28px de alto (escalados)', sp.length === 4 && sp.every((x) => x.vis && x.h >= 28), JSON.stringify(sp))
    const tops = await p.evaluate(() => [...document.querySelectorAll('.xa-card[open]')].map((d) => Math.round(d.getBoundingClientRect().top)))
    rec(eng, P, 'bordes superiores escalonados (cada nivel más abajo)', tops.every((t, i) => i === 0 || t > tops[i - 1] + 30), tops.join())
  }
  if (C === 'B') {
    const crumbs = await p.evaluate(() => [...document.querySelectorAll('.xb-crumb')].map((n) => n.textContent.replace(/\s+/g, ' ').trim()))
    rec(eng, P, 'el hilo da nombre completo a cada nivel (también a los reducidos a número)', crumbs.length === 5 && crumbs[1].includes('Ingreso desde orden de compra') && crumbs[4].includes('Categoría nueva'), crumbs.join(' | '))
    const cur = await p.evaluate(() => document.querySelector('[aria-current=step]')?.textContent.trim())
    rec(eng, P, 'el actual lleva aria-current="step"', /Categoría nueva/.test(cur || ''), cur)
  }
  if (C === 'B' || C === 'C') {
    // Del nivel 3 al 5 el borde superior del diálogo no se mueve (D2, #301): B cambia de paso, C abre pliegues
    const q = await open(b, '?c=' + C)
    await q.click('#opener'); await settle(q)
    await q.click('#f-detalle-ingreso'); await settle(q)
    await q.click('#f-ingreso-p3'); await settle(q, 400)
    const sel2 = C === 'B' ? 'dialog.xb' : 'dialog[data-level=ingreso]'
    const t3 = await q.evaluate((s) => document.querySelector(s).getBoundingClientRect().top, sel2)
    await createFrom(q, 'f-partida-producto')
    await createFrom(q, 'f-producto-categoria'); await settle(q, 300)
    const t5 = await q.evaluate((s) => document.querySelector(s).getBoundingClientRect().top, sel2)
    rec(eng, P, 'del nivel 3 al 5 el borde superior del diálogo no se mueve (D2)', Math.abs(t5 - t3) <= 1, `${Math.round(t3)} → ${Math.round(t5)}`)
    await q.context().close()
  }
  // Volver nunca borra: escribir, Esc, reabrir, sigue ahí
  await p.fill('#f-categoria-nombre', 'Borrador')
  await p.keyboard.down('Escape')
  for (let i = 0; i < 5; i++) { await p.waitForTimeout(40); await p.keyboard.down('Escape') }
  await p.keyboard.up('Escape'); await settle(p)
  s = await stack(p)
  rec(eng, P, 'Esc mantenida baja un solo nivel (la repetición se ignora)', s.length === 4, s.join())
  rec(eng, P, 'tras Esc el foco vuelve a Categoría (quien abrió el nivel)', (await active(p)) === 'f-producto-categoria', await active(p))
  await createFrom(p, 'f-producto-categoria')
  const kept = await p.inputValue('#f-categoria-nombre').catch(() => null)
  rec(eng, P, 'volver no borró el borrador del nivel', kept === 'Borrador', kept)
  // Fondo desde el nivel 2: no descarta nada
  const vp = p.viewportSize()
  await p.mouse.click(4, vp.height - 4); await settle(p)
  s = await stack(p)
  rec(eng, P, 'clic en el fondo con cinco niveles no cierra nada', s.length === 5, s.join())
  // Confirmar categoría: el valor baja, el foco va al campo que lo recibe, se anuncia en el modal superior
  await p.fill('#f-categoria-nombre', 'Biología molecular')
  await p.click('#a-categoria-ok'); await settle(p)
  s = await stack(p)
  rec(eng, P, 'Crear y elegir baja al nivel 4', s.length === 4, s.join())
  rec(eng, P, 'el foco va al campo que recibió el valor', (await active(p)) === 'f-producto-categoria', await active(p))
  const val = await p.evaluate(() => document.getElementById('f-producto-categoria')?.textContent.trim())
  rec(eng, P, 'la categoría nueva queda elegida en el producto', /Biología molecular/.test(val || ''), val)
  await p.waitForTimeout(120)
  const lh = await liveHost(p)
  rec(eng, P, 'se anuncia «creada y elegida» en un canal dentro del modal superior', lh.inTop && /creada y elegida/.test(lh.text || ''), JSON.stringify(lh))
  const landed = await p.evaluate(() => !!document.querySelector('.is-landed'))
  rec(eng, P, 'el campo que recibe el valor marca la llegada (is-landed)', landed)
  // Producto
  await p.click('#a-producto-ok'); await settle(p)
  rec(eng, P, 'producto creado: foco en Producto de la partida', (await active(p)) === 'f-partida-producto', await active(p))
  const pv = await p.evaluate(() => document.getElementById('f-partida-producto')?.textContent.trim())
  rec(eng, P, '«Tris base» elegido en la partida', /Tris base/.test(pv || ''), pv)
  // Partida: sin cantidad, error y foco en el campo; con cantidad, baja al ingreso
  await p.click('#a-partida-ok'); await settle(p, 150)
  rec(eng, P, 'confirmar con error deja el nivel y enfoca el campo', (await active(p)) === 'f-partida-cantidad' && (await stack(p)).length === 3, await active(p))
  await p.fill('#f-partida-cantidad', '5')
  await p.click('#a-partida-ok'); await settle(p)
  rec(eng, P, 'partida guardada: foco en su fila del ingreso', (await active(p)) === 'f-ingreso-p3', await active(p))
  const row = await p.evaluate(() => document.getElementById('xr-row-3')?.textContent.replace(/\s+/g, ' ').trim())
  rec(eng, P, 'la fila 3 muestra el producto nuevo', /Tris base/.test(row || ''), row)
  // Volver a un nivel por el lomo (A), el hilo (B) o recoger (C)
  if (C === 'A' || C === 'B') {
    await p.click('#f-ingreso-p3'); await settle(p)
    await createFrom(p, 'f-partida-producto')
    if (C === 'A') {
      const r = await p.evaluate(() => { const n = document.querySelector('.xa-card[data-level=ingreso] .xa-spine').getBoundingClientRect(); return { x: n.left + n.width / 2, y: n.top + n.height / 2 } })
      await p.mouse.click(r.x, r.y); await settle(p, 450)
    } else {
      await p.click('#xb-crumb-1'); await settle(p, 450)
    }
    s = await stack(p)
    rec(eng, P, C === 'A' ? 'clic en el lomo del ingreso vuelve a ese nivel' : 'el hilo vuelve al ingreso de un salto', s.join() === 'detalle,ingreso', s.join())
    rec(eng, P, 'el foco cae en el ingreso (quien abrió la partida)', (await active(p)) === 'f-ingreso-p3', await active(p))
  }
  // Registrar ingreso y cerrar
  await p.click('#a-ingreso-ok'); await settle(p)
  rec(eng, P, 'ingreso registrado: foco en el botón del detalle', (await active(p)) === 'f-detalle-ingreso', await active(p))
  rec(eng, P, 'sin errores en consola', !p.__errs.length, p.__errs.join(' | '))
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/${eng}-${C}-fin.png` })
  await p.context().close()

  // C: Esc en un pliegue recoge solo ese pliegue
  if (C === 'C') {
    const q = await open(b, '?c=C')
    await toFive(q)
    await q.keyboard.press('Escape'); await settle(q)
    const st = await stack(q)
    rec(eng, P, 'Esc dentro del pliegue de categoría recoge solo ese pliegue', st.length === 4 && (await q.evaluate(() => document.querySelectorAll('dialog[open]').length)) === 2, st.join())
    await q.context().close()
  }

  // Móvil 375 × 812
  const m = await open(b, '?c=' + C, { vw: 375, vh: 812 })
  await toFive(m)
  const ov = await m.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 || [...document.querySelectorAll('dialog[open]')].some((d) => d.scrollWidth > d.clientWidth + 1))
  rec(eng, P, 'móvil: sin desborde horizontal', !ov)
  if (C === 'A') {
    const tops = await m.evaluate(() => [...document.querySelectorAll('.xa-card[open]')].map((d) => Math.round(d.getBoundingClientRect().top)))
    rec(eng, P, 'móvil: las hojas de abajo asoman por arriba (lomos)', tops.every((t, i) => i === 0 || t > tops[i - 1] + 30), tops.join())
  }
  if (C === 'B') {
    const h5 = await m.evaluate(() => Math.round(document.querySelector('dialog.xb').getBoundingClientRect().top))
    await m.click('#a-categoria-back'); await settle(m)
    const h4 = await m.evaluate(() => Math.round(document.querySelector('dialog.xb').getBoundingClientRect().top))
    rec(eng, P, 'móvil: al volver, el borde superior de la hoja no baja', h4 <= h5 + 1, `${h5} → ${h4}`)
  }
  if (SHOTS) await m.screenshot({ path: `${SHOTS}/${eng}-${C}-375.png` })
  rec(eng, P, 'móvil: sin errores en consola', !m.__errs.length, m.__errs.join(' | '))
  await m.context().close()

  // Movimiento reducido: sin desplazamientos (solo fundido)
  const r = await open(b, '?c=' + C, { reduced: true })
  await r.click('#opener'); await settle(r)
  await r.click('#f-detalle-ingreso'); await r.waitForTimeout(30)
  const anim = await r.evaluate((C) => {
    if (C === 'B') return [...document.querySelectorAll('.xb-panel.is-entering')].map((n) => getComputedStyle(n).animationName).join()
    if (C === 'A') return getComputedStyle(document.querySelector('.xa-card[data-level=ingreso]')).translate
    return getComputedStyle(document.querySelector('dialog[data-level=ingreso]')).translate
  }, C)
  rec(eng, P, 'reduce: sin desplazamiento al entrar', C === 'B' ? /xb-fade/.test(anim) : (anim === 'none' || /^0px( 0px)?$/.test(anim)), anim)
  await r.context().close()

  // RTL: Volver apunta al inicio (espejado)
  const t = await open(b, '?c=' + C + '&dir=rtl')
  await t.click('#opener'); await settle(t)
  await t.click('#f-detalle-ingreso'); await settle(t)
  const flip = await t.evaluate(() => { const n = document.querySelector('.xa-back .g-icon, .xb-back .g-icon'); return n ? getComputedStyle(n).scale : null })
  rec(eng, P, 'RTL: el chevron de Volver se espeja', flip && flip.startsWith('-1'), flip)
  await t.context().close()
}

for (const name of ENGINES) {
  const b = await pw[name].launch()
  for (const part of PARTS) {
    try { if (part === 'hoy') await hoy(b, name); else await concept(b, name, part) } catch (e) { rec(name, part, 'sin excepción', false, String(e).split('\n')[0]) }
  }
  await b.close()
}
server.close()
const pass = R.filter((r) => r.ok).length
const by = {}
for (const r of R) { const k = r.eng + ' ' + r.part; by[k] = by[k] || [0, 0]; by[k][1]++; if (r.ok) by[k][0]++ }
for (const [k, [a, n]] of Object.entries(by)) console.log(`${k}: ${a}/${n}`)
console.log(`\n${pass} de ${R.length} pasan`)
process.exit(pass === R.length ? 0 : 1)
