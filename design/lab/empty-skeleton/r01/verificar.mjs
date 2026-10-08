// Verificación del prototipo de vacío y carga (kiwi r01): base funcional y conceptos A, B y C en Chromium, Firefox y WebKit.
// Ejecutar desde la raíz: node design/lab/empty-skeleton/r01/verificar.mjs
//   Solo el puerto 4212 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  PARTS=base,A,B,C  VERBOSE=1
//   SHOTS=<carpeta> guarda capturas además de comprobar.
// Requiere packages/vue/dist (npm run build) para los tokens y la fuente. Solo lee; no toca packages/.
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
const BASE = `http://127.0.0.1:${PORT}/design/lab/empty-skeleton/r01/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'base,A,B,C').split(',')
const V = !!process.env.VERBOSE
const SHOTS = process.env.SHOTS
if (SHOTS) await mkdir(SHOTS, { recursive: true })
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }

async function open (b, c, qs = '', opts = {}) {
  const { vw = 1100, vh = 1400, reduce = false, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: reduce ? 'reduce' : 'no-preference', ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(`${BASE}?c=${c}&manual=1${qs}`, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => window.__lab && window.__lab.ready)
  await p.evaluate(() => document.fonts.ready)
  await p.evaluate(H.rgb)
  p.__errs = errs
  return p
}
const IDS = ['list', 't1', 't2', 't3', 'detail']
const idle = (p) => p.waitForFunction((ids) => ids.every((id) => __lab[id].el.getAttribute('aria-busy') === 'false' && /content|empty/.test(__lab[id].el.dataset.phase)), IDS, { timeout: 15000 })
async function loadAll (p, lat = 900, out = 'data') {
  await p.evaluate(([lat, out]) => { __lab.setLatency(lat); __lab.outcome = out; document.getElementById('out').value = out; __lab.spoken.length = 0; __lab.log.length = 0; __lab.loadAll() }, [lat, out])
  await idle(p); await p.waitForTimeout(120)
}
async function refresh (p, lat = 900, out = null) {
  await p.evaluate(([lat, out]) => { __lab.setLatency(lat); if (out) { __lab.outcome = out; document.getElementById('out').value = out } __lab.spoken.length = 0; __lab.log.length = 0; __lab.refresh() }, [lat, out])
}
const listIdle = (p) => p.waitForFunction(() => __lab.list.el.getAttribute('aria-busy') === 'false' && /content|empty/.test(__lab.list.el.dataset.phase), null, { timeout: 15000 })
const ev = (p, id) => p.evaluate((id) => __lab[id].ev, id)
const at = (e, what) => e.find((x) => x.what === what)

const H = {
  rgb: () => {
    window.__rgb = (c) => { const m = /^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/.exec(c); if (m) return [m[1] * 255, m[2] * 255, m[3] * 255, 1]; const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
    window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
    window.__bgOf = (el) => { for (let a = el; a; a = a.parentElement) { const c = __rgb(getComputedStyle(a).backgroundColor); if (c[3] > 0.95) return c } return __rgb(getComputedStyle(document.body).backgroundColor) }
    window.__ratio = (fg, bg) => { const a = __lum(fg), b = __lum(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
    window.__contrast = (el, prop = 'color') => __ratio(__rgb(getComputedStyle(el)[prop]), __bgOf(el))
  }
}

// ======================= Base funcional (se comprueba en los cuatro conceptos) =======================
async function partCommon (b, eng, c) {
  const ck = (n, ok, i) => rec(eng, c, n, ok, i)

  // 1 · Retraso: una respuesta de 100 ms no enseña esqueleto ni anuncia «cargando»
  let p = await open(b, c)
  await loadAll(p, 100)
  let e = await ev(p, 'list')
  ck('100 ms: el esqueleto nunca se ve', !e.some((x) => x.what === 'skeleton' || x.what === 'stale'), JSON.stringify(e.map((x) => x.what)))
  let sp = await p.evaluate(() => __lab.spoken.join(' | '))
  ck('100 ms: sin anuncio de «cargando», sí del resultado', !/Cargando/.test(sp) && /3 muestras/.test(sp), sp)
  ck('100 ms: sin desplazamiento al llegar (sitio reservado desde el inicio)', at(e, 'busy').y === at(e, 'content').y, `${at(e, 'busy').y} → ${at(e, 'content').y}`)

  // 2 · Tiempo mínimo: a 250 ms se ve a los ~200 y se queda ≥ 400 ms
  await loadAll(p, 250)
  e = await ev(p, 'list')
  const sk = at(e, 'skeleton'), ct = at(e, 'content')
  ck('250 ms: aparece tras el retraso (200 ms)', sk && sk.t >= 195 && sk.t <= 290, sk && sk.t)
  ck('250 ms: a la vista al menos 400 ms (sin parpadeo)', sk && ct && ct.t - sk.t >= 395, sk && ct && `${ct.t - sk.t} ms`)

  // 3 · Δ0 en lo de forma conocida, y anuncios por ciclo
  await loadAll(p, 900)
  e = await ev(p, 'list')
  ck('Lista: Δ0 al llegar el contenido (3 filas)', at(e, 'skeleton').y === at(e, 'content').y, `${at(e, 'skeleton').y} → ${at(e, 'content').y}`)
  const et = await ev(p, 't3')
  ck('Teselas: Δ0', at(et, 'skeleton').y === at(et, 'content').y, `${at(et, 'skeleton').y} → ${at(et, 'content').y}`)
  const ed = await ev(p, 'detail')
  const dDelta = at(ed, 'content').y - at(ed, 'skeleton').y
  ck(`Ficha de texto libre: Δ medido (${dDelta}px; solo A promete 0)`, c !== 'A' || dDelta === 0, `${dDelta}px`)
  const log = await p.evaluate(() => __lab.log)
  const listSaid = log.filter((l) => l.src === 'list').map((l) => l.text)
  ck('Lista: dos anuncios por ciclo (empieza, resultado)', listSaid.length === 2 && /Cargando muestras/.test(listSaid[0]) && /3 muestras/.test(listSaid[1]), listSaid.join(' | '))
  const dashSaid = log.filter((l) => /^t\d|dash/.test(l.src)).map((l) => l.text)
  ck('Panel de tres teselas: un anuncio al empezar y uno al terminar', dashSaid.length === 2 && dashSaid[0] === 'Cargando el panel' && dashSaid[1] === 'Panel actualizado', dashSaid.join(' | '))
  sp = await p.evaluate(() => __lab.spoken)
  ck('Lo que empieza en el mismo ciclo se escribe una vez (fusión)', sp.length <= 3 && /Cargando muestras.*Cargando el panel.*Cargando el lote/.test(sp[0]), JSON.stringify(sp))
  ck('El canal vivo está fuera de toda zona aria-busy y existe desde el principio', await p.evaluate(() => { const l = document.getElementById('ld-live'); return !l.closest('[aria-busy]') && l.getAttribute('aria-live') === 'polite' }))
  await p.context().close()

  // 4 · Durante la carga: aria-busy, esqueleto oculto e inerte, nada enfocable
  p = await open(b, c)
  await p.evaluate(() => { __lab.setLatency(2500); __lab.loadAll() })
  await p.waitForTimeout(450)
  const during = await p.evaluate(() => {
    const el = __lab.list.el, g = el.querySelector('.ld-ghost')
    const foc = g ? [...g.querySelectorAll('a,button,input,[tabindex]')].filter((n) => !n.closest('[inert]')).length : -1
    return { busy: el.getAttribute('aria-busy'), hidden: g && g.getAttribute('aria-hidden'), foc, phase: el.dataset.phase }
  })
  ck('Durante: aria-busy="true" en la región', during.busy === 'true', during.busy)
  ck('Durante: el marcador de posición es aria-hidden', during.hidden === 'true', during.hidden)
  ck('Durante: nada enfocable en el marcador', during.foc === 0, during.foc)
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/${eng}-${c}-carga.png`, fullPage: true })
  await idle(p)
  ck('Después: aria-busy="false"', await p.evaluate(() => __lab.list.el.getAttribute('aria-busy') === 'false'))
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/${eng}-${c}-contenido.png`, fullPage: true })

  // 5 · Foco: fuera de la región no se toca; dentro, vuelve al mismo elemento por clave
  await p.focus('#go-refresh')
  await p.keyboard.press('Enter')
  await listIdle(p); await p.waitForTimeout(80)
  ck('Foco fuera de la región: se queda donde estaba', await p.evaluate(() => document.activeElement.id === 'go-refresh'))
  await p.evaluate(() => { __lab.setLatency(900) })
  await p.focus('[data-key="m8"] a')
  await refresh(p, 900)
  await p.waitForTimeout(260)
  const mid = await p.evaluate(() => ({ id: document.activeElement.id, body: document.activeElement === document.body }))
  ck('Refresco con el foco en una fila: pasa a la región, nunca a body', mid.id === 'list' && !mid.body, JSON.stringify(mid))
  await listIdle(p); await p.waitForTimeout(80)
  ck('Al llegar: vuelve a la misma fila (por clave)', await p.evaluate(() => document.activeElement.closest('[data-key]')?.dataset.key === 'm8'))

  // 6 · Vacío con causa y su acción; anuncio = título
  const CAUSES = { none: /Aún no hay muestras/, forbidden: /No tienes permiso/, error: /No se pudieron cargar|No se pudo actualizar/ }
  for (const [out, rx] of Object.entries(CAUSES)) {
    await p.evaluate(() => { __lab.list.lastItems = null; __lab.list.el.dataset.phase = 'idle' })
    await refresh(p, 150, out); await listIdle(p); await p.waitForTimeout(80)
    const r = await p.evaluate(() => {
      const el = __lab.list.el, box = el.querySelector('[data-cause]')
      const svg = box && box.querySelector('svg')
      const acts = box ? [...box.querySelectorAll('button')].map((x) => x.textContent.trim()) : []
      const t = box && box.querySelector('.e-title')
      return { cause: box && box.dataset.cause, text: box && box.textContent, icon: !!svg && !!svg.closest('[aria-hidden="true"]'), acts, tc: t ? __contrast(t) : 0 }
    })
    sp = await p.evaluate(() => __lab.spoken.join(' | '))
    ck(`Vacío «${out}»: causa, texto, ${c === 'B' ? 'sin icono (B)' : 'icono decorativo'} y acción`, r.cause === out && rx.test(r.text) && (c === 'B' || r.icon) && r.acts.length >= 1, JSON.stringify({ c: r.cause, acts: r.acts, icon: r.icon }))
    ck(`Vacío «${out}»: se anuncia su título, una vez`, rx.test(sp) && sp.split('|').length === 1, sp)
    ck(`Vacío «${out}»: título ≥ 4,5:1`, r.tc >= 4.5, r.tc.toFixed(2))
    if (SHOTS) await (await p.$('#list')).screenshot({ path: `${SHOTS}/${eng}-${c}-vacio-${out}.png` })
  }
  // Reintentar desde el teclado: el botón desaparece y el foco pasa a la región (no a body)
  await p.focus('#list [data-act="retry"]').catch(() => {})
  const hadRetry = await p.evaluate(() => document.activeElement?.dataset.act === 'retry')
  await p.evaluate(() => { __lab.setLatency(600) })
  if (hadRetry) {
    await p.keyboard.press('Enter'); await p.waitForTimeout(250)
    const f1 = await p.evaluate(() => document.activeElement.id)
    await listIdle(p); await p.waitForTimeout(80)
    const f2 = await p.evaluate(() => ({ id: document.activeElement.id, body: document.activeElement === document.body }))
    ck('Reintentar: el foco pasa a la región y se queda allí al llegar', f1 === 'list' && f2.id === 'list' && !f2.body, `${f1} → ${JSON.stringify(f2)}`)
  } else ck('Reintentar: botón presente', false, 'sin botón')
  // Filtro que vacía
  await p.evaluate(() => { __lab.outcome = 'data'; document.getElementById('out').value = 'data' })
  await p.click('[data-f-toggle="closed"]'); await listIdle(p); await p.waitForTimeout(80)
  const fil = await p.evaluate(() => { const box = __lab.list.el.querySelector('[data-cause]'); return { cause: box && box.dataset.cause, text: box && box.textContent, acts: box ? [...box.querySelectorAll('button')].map((x) => x.textContent.trim()) : [] } })
  ck('Vacío por filtro: dice los filtros y ofrece quitarlos', fil.cause === 'filtered' && /Cerradas/.test(fil.text) && fil.acts.some((a) => /Quitar/.test(a)), JSON.stringify(fil))
  if (SHOTS) await (await p.$('#list')).screenshot({ path: `${SHOTS}/${eng}-${c}-vacio-filtered.png` })
  await p.click('#list [data-act="clear"], #list [data-act="relax"]'); await listIdle(p); await p.waitForTimeout(80)
  ck('Quitar el filtro desde el vacío devuelve resultados', await p.evaluate(() => __lab.list.el.querySelectorAll('.row').length > 0 && document.activeElement !== document.body))
  ck('Consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.context().close()

  // 7 · Espera larga: a los 5 s, texto visible y nada se mueve
  p = await open(b, c)
  await p.evaluate(() => { __lab.setLatency(6000); __lab.spoken.length = 0; __lab.loadAll() })
  await p.waitForTimeout(1200)
  const anim1 = await p.evaluate(() => document.getElementById('list').getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length)
  await p.waitForTimeout(4000)
  const slow = await p.evaluate(() => {
    const el = __lab.list.el
    const t = el.querySelector('.say-text') || el.querySelector('.ld-slow')
    const vis = t && getComputedStyle(t).display !== 'none' && t.getBoundingClientRect().height > 0
    return { slow: el.hasAttribute('data-slow'), text: t && t.textContent, vis, ratio: t ? __contrast(t) : 0, running: el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length }
  })
  ck('5 s: la región entra en espera larga', slow.slow)
  ck('5 s: texto visible «Sigue cargando» ≥ 4,5:1', slow.vis && /Sigue cargando/.test(slow.text) && slow.ratio >= 4.5, `${slow.text} · ${slow.ratio.toFixed(2)}`)
  ck('5 s: ninguna animación en curso (WCAG 2.2.2)', slow.running === 0, `${anim1} a 1,2 s → ${slow.running} a 5,2 s`)
  sp = await p.evaluate(() => __lab.log.filter((l) => l.src === 'list').map((l) => l.text))
  ck('5 s: «Sigue cargando» se anuncia una vez', sp.filter((x) => /Sigue/.test(x)).length === 1, sp.join(' | '))
  await p.context().close()

  // 8 · Movimiento reducido
  p = await open(b, c, '', { reduce: true })
  await p.evaluate(() => { __lab.setLatency(1500); __lab.loadAll() })
  await p.waitForTimeout(500)
  const ra = await p.evaluate(() => document.getElementById('list').getAnimations({ subtree: true }).map((a) => ({ d: a.effect.getTiming().duration, it: a.effect.getTiming().iterations, name: a.animationName || a.transitionProperty })))
  ck('Reducido: sin barrido ni pulso (solo el giro de C, más lento y finito)', c === 'C' ? ra.every((a) => a.it <= 2 && a.d >= 1900) : ra.length === 0, JSON.stringify(ra))
  await p.context().close()

  // 9 · RTL y móvil
  p = await open(b, c, '&dir=rtl')
  await loadAll(p, 300)
  const rtl = await p.evaluate(() => {
    const row = document.querySelector('#list .row'), av = row.querySelector('.row-av').getBoundingClientRect(), main = row.querySelector('.row-main').getBoundingClientRect()
    return { right: av.left > main.left, over: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }
  })
  ck('RTL: la fila sigue el orden lógico (avatar a la derecha), sin desbordar', rtl.right && !rtl.over, JSON.stringify(rtl))
  await p.evaluate(() => { __lab.setLatency(1500); __lab.loadAll() })
  await p.waitForTimeout(500)
  const rtlSk = await p.evaluate(() => { const g = document.querySelector('#list .ld-ghost'); const r = g.getBoundingClientRect(); const first = g.querySelector('.sk, .row-av, .say-icon'); return first ? first.getBoundingClientRect().right > r.left + r.width / 2 : false })
  ck('RTL: el marcador empieza por la derecha', rtlSk)
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/${eng}-${c}-rtl.png` })
  await p.context().close()

  const touch = eng === 'chromium' ? { isMobile: true, hasTouch: true } : { hasTouch: true }
  p = await open(b, c, '', { vw: 390, vh: 900, ...touch })
  await p.evaluate(() => { __lab.outcome = 'none' })
  await loadAll(p, 200, 'none')
  const tch = await p.evaluate(() => ({ min: Math.min(...[...document.querySelectorAll('#list [data-cause] button')].map((x) => Math.min(parseFloat(getComputedStyle(x, '::after').height), parseFloat(getComputedStyle(x, '::after').width)))), over: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }))
  ck('Táctil 390 px: área de las acciones del vacío ≥ 44 × 44 (::after de GBtn), sin desbordar', tch.min >= 44 && !tch.over, JSON.stringify(tch))
  await p.context().close()
}

// ======================= Contraste y colores forzados =======================
async function partColor (b, eng, c) {
  const ck = (n, ok, i) => rec(eng, c, n, ok, i)
  for (const theme of ['light', 'dark']) {
    const p = await open(b, c, `&theme=${theme}`)
    await p.evaluate(() => { __lab.setLatency(2000); __lab.loadAll() })
    await p.waitForTimeout(500)
    const r = await p.evaluate(() => {
      const el = __lab.list.el
      const probe = document.createElement('i'); probe.style.cssText = 'position:absolute;inline-size:1px;block-size:1px;background:var(--_tone)'
      el.append(probe); const tone = __rgb(getComputedStyle(probe).backgroundColor); probe.remove()
      return { tone: __ratio(tone, __bgOf(el)) }
    })
    ck(`Tono del marcador frente a la superficie (${theme}): ≥ 1,3:1 (no es texto; se distingue)`, r.tone >= 1.3, r.tone.toFixed(2))
    await p.context().close()
  }
  if (eng === 'chromium') {
    const p = await open(b, c)
    await p.emulateMedia({ forcedColors: 'active' })
    await p.evaluate(() => { __lab.setLatency(2000); __lab.loadAll() })
    await p.waitForTimeout(500)
    const f = await p.evaluate(() => {
      const g = document.querySelector('#list .ld-ghost')
      const leaf = g.querySelector('.row-title, .sk, .say-text')
      const cs = getComputedStyle(leaf)
      return { cls: leaf.className, color: cs.color, deco: cs.textDecorationColor, bg: cs.backgroundColor, line: cs.textDecorationLine }
    })
    let ok
    if (c === 'A') ok = f.color === 'rgba(0, 0, 0, 0)' && f.line.includes('line-through') && f.deco !== 'rgba(0, 0, 0, 0)'
    else if (c === 'C') ok = f.color !== 'rgba(0, 0, 0, 0)'
    else ok = f.bg !== 'rgba(0, 0, 0, 0)'
    ck('Colores forzados: el marcador se ve (GrayText) y la muestra del molde no se lee como texto', ok, JSON.stringify(f))
    await p.context().close()
  }
}

// ======================= Conceptos =======================
async function partA (b, eng) {
  const ck = (n, ok, i) => rec(eng, 'A', n, ok, i)
  const p = await open(b, 'A')
  await p.evaluate(() => { __lab.setLatency(1500); __lab.loadAll() })
  await p.waitForTimeout(500)
  const m = await p.evaluate(() => {
    const g = document.querySelector('#list .ld-ghost.mold')
    const t = g.querySelector('.row-title'), cs = getComputedStyle(t), av = getComputedStyle(g.querySelector('.row-av'))
    const known = getComputedStyle(document.querySelector('#t1 .ld-ghost .known'))
    const box = getComputedStyle(g.querySelector('.row-main'))
    return { rows: g.querySelectorAll('.row').length, color: cs.color, line: cs.textDecorationLine, thick: cs.textDecorationThickness, avBorder: av.borderTopColor, avBg: av.backgroundColor, known: known.color, knownLine: known.textDecorationLine, boxLine: box.textDecorationLine }
  })
  ck('Molde = la plantilla real (3 filas .row) con datos de muestra', m.rows === 3)
  ck('Hojas de texto: tinta transparente y barra (line-through gruesa)', m.color === 'rgba(0, 0, 0, 0)' && m.line.includes('line-through') && parseFloat(m.thick) > 8, JSON.stringify(m))
  ck('Contenedores sin barra (no se propaga ni se apila)', !m.boxLine.includes('line-through'), m.boxLine)
  ck('Cajas en contorno: fondo fuera, borde con el tono', m.avBg === 'rgba(0, 0, 0, 0)' && m.avBorder !== 'rgba(0, 0, 0, 0)', `${m.avBg} / ${m.avBorder}`)
  ck('Lo que ya se sabe conserva la tinta (rótulo de la tesela)', m.known !== 'rgba(0, 0, 0, 0)' && !m.knownLine.includes('line-through'), m.known)
  await p.waitForFunction(() => __lab.list.el.dataset.phase === 'content')
  await p.waitForTimeout(40)
  const rv = await p.evaluate(() => { const c = document.querySelector('#list .ld-content'); return { reveal: c.classList.contains('reveal'), dur: getComputedStyle(c.querySelector('.row-title')).transitionDuration } })
  ck('Llegada: la tinta aparece sobre las barras (transición de color, duration-slow)', rv.reveal && /0\.24s|240ms/.test(rv.dur), JSON.stringify(rv))
  await p.waitForTimeout(400)
  ck('Tras el revelado no queda molde', await p.evaluate(() => !document.querySelector('#list .mold, #list .reveal')))
  // Refresco: el molde de lo último conocido mide lo mismo que el contenido
  await p.evaluate(() => { __lab.setLatency(900); __lab.log.length = 0; __lab.refresh() })
  await p.waitForTimeout(450)
  const hMold = await p.evaluate(() => Math.round(__lab.list.el.getBoundingClientRect().height))
  await p.waitForFunction(() => __lab.list.el.getAttribute('aria-busy') === 'false')
  const e = await ev(p, 'list')
  ck('Refresco: molde de lo último conocido; Δ = cambio real (4.ª fila)', at(e, 'content').y - at(e, 'skeleton').y > 0 && hMold === at(e, 'skeleton').h, `molde ${hMold}px; Δ ${at(e, 'content').y - at(e, 'skeleton').y}px`)
  // Vacío: el primer hueco mide una fila
  await p.evaluate(() => { __lab.outcome = 'none'; __lab.refresh() }); await listIdle(p)
  const slot = await p.evaluate(() => { const s = document.querySelector('#list .e-slot'); return { h: s.getBoundingClientRect().height, row: __lab.list.rowH } })
  ck('Vacío: el primer hueco tiene al menos el alto de una fila', slot.h >= slot.row - 1, JSON.stringify(slot))
  await p.context().close()
}

async function partB (b, eng) {
  const ck = (n, ok, i) => rec(eng, 'B', n, ok, i)
  const p = await open(b, 'B')
  await loadAll(p, 300)
  await refresh(p, 1200)
  await p.waitForTimeout(100)
  ck('Refresco, antes del retraso: lo de antes sigue, ya inerte', await p.evaluate(() => { const c = __lab.list.el.querySelector('.ld-content'); const pill = __lab.list.el.querySelector('.b-pill'); return c.inert && c.querySelectorAll('.row').length === 3 && (!pill || getComputedStyle(pill).display === 'none') }))
  await p.waitForTimeout(250)
  const st = await p.evaluate(() => {
    const el = __lab.list.el, pill = el.querySelector('.b-pill'), edge = getComputedStyle(el, '::before')
    return { phase: el.dataset.phase, rows: el.querySelectorAll('.row').length, sk: el.querySelectorAll('.sk, .mold').length, pill: pill && pill.textContent.trim(), pillC: pill ? __contrast(pill) : 0, edge: __ratio(__rgb(edge.backgroundColor), __bgOf(el)) }
  })
  ck('Tras el retraso: fase «stale», las 3 filas siguen, sin esqueleto', st.phase === 'stale' && st.rows === 3 && st.sk === 0, JSON.stringify(st))
  ck('«Actualizando» visible ≥ 4,5:1 y filo ≥ 3:1', /Actualizando/.test(st.pill) && st.pillC >= 4.5 && st.edge >= 3, `${st.pillC.toFixed(2)} / ${st.edge.toFixed(2)}`)
  if (SHOTS) await (await p.$('#list')).screenshot({ path: `${SHOTS}/${eng}-B-stale.png` })
  await listIdle(p); await p.waitForTimeout(80)
  const nw = await p.evaluate(() => { const n = [...document.querySelectorAll('#list .row[data-new]')]; return { n: n.length, text: n[0] && n[0].textContent } })
  const sp = await p.evaluate(() => __lab.spoken.join(' | '))
  ck('Llegada: la fila nueva va marcada con texto («Nueva»), no solo color', nw.n === 1 && /Nueva/.test(nw.text), JSON.stringify(nw))
  ck('Anuncio: «4 muestras, 1 nueva»', /4 muestras, 1 nueva/.test(sp), sp)
  if (SHOTS) await (await p.$('#list')).screenshot({ path: `${SHOTS}/${eng}-B-nueva.png` })
  // Error al refrescar: lo conocido se queda
  await refresh(p, 400, 'error'); await listIdle(p); await p.waitForTimeout(80)
  const er = await p.evaluate(() => ({ rows: document.querySelectorAll('#list .row').length, fail: !!document.querySelector('#list .b-fail'), inert: document.querySelector('#list .ld-content').inert }))
  ck('Error al refrescar: las filas se quedan, interactivas, con el fallo encima', er.rows === 4 && er.fail && !er.inert, JSON.stringify(er))
  if (SHOTS) await (await p.$('#list')).screenshot({ path: `${SHOTS}/${eng}-B-error.png` })
  // Vacío por filtro: la salida con cuentas
  await p.evaluate(() => { __lab.outcome = 'data'; document.getElementById('out').value = 'data' })
  await p.click('[data-f-toggle="urg"]'); await listIdle(p)
  await p.click('[data-f-toggle="closed"]'); await listIdle(p); await p.waitForTimeout(80)
  const ex = await p.evaluate(() => { const box = document.querySelector('#list .b-exit'); return { trace: box.querySelector('.b-trace').textContent, acts: [...box.querySelectorAll('button')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()) } })
  ck('Salida: dice cuántas había y ofrece solo lo que devuelve algo, con la cuenta', /Antes había/.test(ex.trace) && ex.acts.some((a) => /Cerradas.*· 2/.test(a)) && !ex.acts.some((a) => /Urgentes/.test(a)), JSON.stringify(ex))
  if (SHOTS) await (await p.$('#list')).screenshot({ path: `${SHOTS}/${eng}-B-salida.png` })
  await p.click('#list [data-act="relax"][data-f="closed"]'); await listIdle(p); await p.waitForTimeout(80)
  ck('Quitar «Cerradas» devuelve las 2 anunciadas', await p.evaluate(() => document.querySelectorAll('#list .row').length === 2))
  await p.context().close()
}

async function partC (b, eng) {
  const ck = (n, ok, i) => rec(eng, 'C', n, ok, i)
  const p = await open(b, 'C')
  await p.evaluate(() => { __lab.setLatency(1500); __lab.loadAll() })
  await p.waitForTimeout(500)
  const s = await p.evaluate(() => {
    const el = __lab.list.el, t = el.querySelector('.say-text'), a = el.getAnimations({ subtree: true })[0]
    return { shapes: el.querySelectorAll('.sk, .mold').length, text: t && t.textContent, ratio: t ? __contrast(t) : 0, it: a && a.effect.getTiming().iterations, known: document.querySelector('#t1 .known')?.textContent }
  })
  ck('Sin formas inventadas: ninguna barra ni molde', s.shapes === 0)
  ck('La frase en palabras de la aplicación, ≥ 4,5:1', /Cargando muestras/.test(s.text) && s.ratio >= 4.5, `${s.text} · ${s.ratio.toFixed(2)}`)
  ck('El giro es finito (6 vueltas = 4,8 s < 5 s)', s.it === 6, s.it)
  ck('Teselas: dicen lo que ya saben (su rótulo)', s.known === 'Muestras hoy', s.known)
  await idle(p)
  await p.evaluate(() => { __lab.outcome = 'none'; __lab.refresh() }); await listIdle(p); await p.waitForTimeout(80)
  const e = await p.evaluate(() => { const b = document.querySelector('#list .e-say'); const btns = [...b.querySelectorAll('button')]; return { h: b.getBoundingClientRect().height, inline: btns.every((x) => x.classList.contains('g-btn--variant-link')), n: btns.length } })
  ck('Vacío: una frase con sus acciones dentro (≤ 2 líneas a 1100 px)', e.h <= 80 && e.inline && e.n === 2, JSON.stringify(e))
  await p.context().close()
}

async function partBase (b, eng) {
  const ck = (n, ok, i) => rec(eng, 'base', n, ok, i)
  const p = await open(b, 'base')
  await p.evaluate(() => { __lab.setLatency(1500); __lab.loadAll() })
  await p.waitForTimeout(500)
  const r = await p.evaluate(() => ({ bars: document.querySelectorAll('#list .sk').length, anim: document.getElementById('list').getAnimations({ subtree: true }).length }))
  ck('Barras convencionales, quietas (sin barrido ni pulso)', r.bars === 9 && r.anim === 0, JSON.stringify(r))
  await p.context().close()
}

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  try {
    for (const c of PARTS) {
      await partCommon(b, eng, c)
      await partColor(b, eng, c)
      if (c === 'A') await partA(b, eng)
      if (c === 'B') await partB(b, eng)
      if (c === 'C') await partC(b, eng)
      if (c === 'base') await partBase(b, eng)
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
