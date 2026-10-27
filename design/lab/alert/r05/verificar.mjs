// Auditoría posterior de r05 (kiwi): progreso determinado en la isla, conceptos A, B y C, sobre el CSS real de la isla.
// Ejecutar: node design/lab/alert/r05/verificar.mjs  (GRANA_PW_PORT, por defecto 4214; ENGINES=chromium,firefox,webkit;
// PROPS=A,B,C; VERBOSE=1). No necesita build: el prototipo enlaza el CSS fuente. Usa el Playwright de
// design/lab/theme-playground si existe y, si no, el global. Un motor que no está instalado se informa y se salta.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

let pw
try { pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url)) } catch { pw = createRequire(import.meta.url)('playwright') }
const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4214)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(path))
  } catch { res.writeHead(404).end() }
}).listen(PORT)
const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PROPS = (process.env.PROPS || 'A,B,C').split(',')
const URL0 = (p, extra = '') => `http://localhost:${PORT}/design/lab/alert/r05/index.html?p=${p}&t=1500&speed=0${extra}`
let pass = 0, fail = 0
const skipped = []
const ok = (cond, name, detail = '') => { cond ? pass++ : fail++; if (!cond || process.env.VERBOSE) console.log(`${cond ? '  ✓' : '  ✗'} ${name}${detail ? ' · ' + detail : ''}`) }
const wait = (pg, ms) => pg.waitForTimeout(ms)

for (const eng of ENGINES) {
  let browser
  try { browser = await pw[eng].launch() } catch (e) { skipped.push(eng); console.log(`— ${eng}: no disponible en este entorno (${String(e.message).split('\n')[0]})`); continue }
  for (const P of PROPS) {
    console.log(`${eng} · ${P}`)
    const pg = await browser.newPage({ viewport: { width: 1024, height: 760 } })
    const errors = []; pg.on('pageerror', (e) => errors.push(e.message))
    await pg.goto(URL0(P)); await wait(pg, 300)
    const live = () => pg.evaluate(() => window.__live.map((x) => x.ch + '|' + x.text))
    const box = (sel) => pg.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } }, sel)
    const st = () => pg.evaluate(() => ({ stage: proto.stage, witness: proto.witness, peek: proto.peek, hidden: document.getElementById('shape').hidden, w: document.getElementById('shape').getBoundingClientRect().width, cur: proto.cur && proto.cur.id, type: proto.cur && proto.cur.type }))

    ok((await live()).length === 0, 'carga sin anuncios')
    const ref0 = await box('#x-ref'), btn0 = await box('#x-start')
    await pg.click('#x-start'); await pg.evaluate(() => proto.stopSim())
    ok(await pg.evaluate(() => document.activeElement.id) === 'x-start', 'la isla no toma el foco al empezar')
    let L = await live()
    ok(L.length === 1 && L[0] === 'polite|Información: Subiendo informe-t3.pdf. 30 MB · puedes seguir trabajando', 'un anuncio cortés al empezar', L.join(' / '))
    await wait(pg, 600)
    let s = await st()
    ok(!s.hidden && s.stage == null && s.w > 200, 'titular a la vista tras drop + grow', JSON.stringify(s))
    const ref1 = await box('#x-ref'), btn1 = await box('#x-start')
    ok(ref0.y === ref1.y && btn0.x === btn1.x && btn0.y === btn1.y, 'nada se mueve en la página (Δ 0px)')

    // El avance no cambia el ancho de la cápsula (cifra con ancho reservado) y no anuncia
    await pg.evaluate(() => proto.progress(9)); await wait(pg, 50)
    const w9 = (await st()).w
    await pg.evaluate(() => proto.progress(18)); await wait(pg, 50)
    const w18 = (await st()).w
    ok(Math.abs(w9 - w18) < 0.5, 'el avance no cambia el ancho del titular', `${w9} → ${w18}`)
    ok((await live()).length === 1, 'el avance entre hitos no anuncia')

    // Anillo: de avance en A y C (se llena), de tiempo en B; nunca los dos en la misma insignia
    const rings = await pg.evaluate(() => ({ p: !!document.querySelector('#badge .x-pring'), t: !!document.querySelector('#badge .g-status-island__ring'), xp: getComputedStyle(document.getElementById('shape')).getPropertyValue('--x-p').trim() }))
    if (P === 'B') ok(rings.t && !rings.p, 'B: el anillo dice el tiempo (sin anillo de avance)', JSON.stringify(rings))
    else ok(rings.p && !rings.t && Math.abs(parseFloat(rings.xp) - 0.18) < 0.001, `${P}: el anillo dice el avance (0,18) y no hay anillo de tiempo`, JSON.stringify(rings))
    const name = await pg.evaluate(() => document.getElementById('text').textContent)
    ok(/Información: Subiendo informe-t3\.pdf, 18\s?%/.test(name), 'el titular nombra la cifra', name)

    // Hitos: 25 y 75 cruzados dentro de la ventana de 5 s desde el anuncio de inicio → un solo anuncio, el último
    await pg.evaluate(() => proto.progress(30)); await wait(pg, 100)
    await pg.evaluate(() => proto.progress(80)); await wait(pg, 100)
    ok((await live()).length === 1, 'un hito dentro de la ventana espera')

    // La lectura (t = 1500 ms) acaba: cada concepto hace lo suyo (sigue dentro de la ventana de 5 s del hito)
    await wait(pg, 1700); s = await st()
    if (P === 'A') ok(!s.hidden && !s.witness && s.w > 200, 'A: el titular se queda mientras dura la actividad', JSON.stringify(s))
    if (P === 'B') ok(s.hidden, 'B: la isla se recogió con su lectura', JSON.stringify(s))
    if (P === 'C') ok(!s.hidden && s.witness && Math.abs(s.w - 96) < 1.5, 'C: queda la cápsula testigo (96px)', JSON.stringify(s))
    const mk = await pg.evaluate(() => ({ hidden: document.getElementById('x-mark').hidden, txt: document.getElementById('x-mark').textContent.replace(/\s+/g, ' ').trim(), ring: !!document.querySelector('#x-mark .x-pring') }))
    ok(!mk.hidden && /80\s?%/.test(mk.txt) && mk.ring, 'la marca lleva el avance (anillo y cifra)', JSON.stringify(mk))
    await wait(pg, 3600)
    L = await live()
    ok(L.length === 2 && /^polite\|Subiendo informe-t3\.pdf: 75\s?%$/.test(L[1]), 'hitos coalescidos: solo «75 %», cortés', L.join(' / '))

    // C: pasar por la testigo la abre en el sitio y al salir vuelve
    if (P === 'C') {
      const c = await box('#shape'); await pg.mouse.move(c.x + c.w / 2, c.y + c.h / 2); await wait(pg, 400)
      s = await st(); ok(s.peek && !s.witness && s.w > 200, 'C: el puntero abre la testigo en el sitio (asomo)', JSON.stringify(s))
      const a = await box('#act'); ok(a.h >= 24 && a.w >= 24, 'C: «Cancelar» ≥ 24px', JSON.stringify(a))
      await pg.mouse.move(10, 700); await wait(pg, 400)
      s = await st(); ok(s.witness && !s.peek && Math.abs(s.w - 96) < 1.5, 'C: al salir vuelve a la testigo', JSON.stringify(s))
    }

    // Lo más grave pasa delante (sin la mano encima)
    await pg.evaluate(() => proto.otherError()); await wait(pg, 600)
    s = await st(); L = await live()
    ok(s.cur === 'save' && s.type === 'error' && !s.hidden, 'un error de otra parte releva a la actividad', JSON.stringify(s))
    ok(L.at(-1) === 'assertive|Error: No se pudo guardar la factura. El servidor no respondió.', 'el error, por el canal enérgico', L.at(-1))
    await wait(pg, 2400); s = await st()
    if (P === 'A') ok(s.cur === 'upload' && !s.hidden && !s.witness, 'A: tras el error vuelve el titular de la actividad', JSON.stringify(s))
    if (P === 'C') { await wait(pg, 2000); s = await st(); ok(s.cur === 'upload' && s.witness, 'C: tras el error, la actividad se relee y vuelve a la testigo', JSON.stringify(s)) }

    // Final: resolve → resultado en el mismo elemento, anillo de tiempo; se lee y se va
    await pg.evaluate(() => proto.resolve()); await wait(pg, 700)
    s = await st(); L = await live()
    ok(L.at(-1) === 'polite|Correcto: Informe subido', 'el final se anuncia una vez, cortés', L.at(-1))
    ok(!s.hidden && s.cur === 'upload' && s.type === 'success' && !s.witness, 'el final vuelve a la isla (titular de éxito)', JSON.stringify(s))
    const rg = await pg.evaluate(() => ({ p: !!document.querySelector('#badge .x-pring'), t: !!document.querySelector('#badge .g-status-island__ring') }))
    ok(rg.t && !rg.p, 'tras el final, el anillo vuelve a ser de tiempo', JSON.stringify(rg))
    await wait(pg, 2600); s = await st()
    ok(s.hidden, 'el resultado sin enlace se lee y se va', JSON.stringify(s))
    ok(errors.length === 0, 'sin errores de página', errors.join(' | '))
    await pg.close()

    // 320px: el titular cabe, sin desplazamiento horizontal
    const sm = await browser.newPage({ viewport: { width: 320, height: 640 } })
    await sm.goto(URL0(P)); await wait(sm, 300)
    await sm.evaluate(() => { proto.start(); proto.stopSim() }); await wait(sm, 600)
    await sm.evaluate(() => proto.progress(55)); await wait(sm, 100)
    const fit = await sm.evaluate(() => { const r = document.getElementById('shape').getBoundingClientRect(); return { l: r.left, r: r.right, vw: innerWidth, sw: document.documentElement.scrollWidth } })
    ok(fit.l >= 0 && fit.r <= fit.vw && fit.sw <= fit.vw, '320px: el titular cabe', JSON.stringify(fit))
    await sm.close()

    // Movimiento reducido: sin caída y el anillo de avance cambia sin transición
    const rm = await browser.newPage({ viewport: { width: 1024, height: 760 }, reducedMotion: 'reduce' })
    await rm.goto(URL0(P)); await wait(rm, 300)
    await rm.evaluate(() => { proto.start(); proto.stopSim() }); await wait(rm, 80)
    const tr = await rm.evaluate(() => getComputedStyle(document.getElementById('shape')).translate)
    ok(tr === 'none' || /^0px( 0px)?$/.test(tr), 'reducido: la cápsula no se desplaza al nacer', tr)
    const ptr = await rm.evaluate(() => { const p = document.querySelector('#badge .x-pring'); return p ? getComputedStyle(p).transitionDuration : 'n/a' })
    ok(ptr === 'n/a' || ptr === '0s', 'reducido: el anillo de avance cambia sin transición', ptr)
    await rm.close()
  }
  await browser.close()
}
server.close()
console.log(`\n${pass}/${pass + fail}${skipped.length ? ` · sin ejecutar: ${skipped.join(', ')}` : ''}`)
process.exit(fail ? 1 : 0)
