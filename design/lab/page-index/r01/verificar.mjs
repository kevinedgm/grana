// Verificación del prototipo de GPageIndex appearance="list" r01 (kiwi): columna y forma plegada, en el marco calcado.
// Ejecutar desde la raíz: node design/lab/page-index/r01/verificar.mjs
//   Puerto 4238 (GRANA_PW_PORT lo cambia; no a la vez que navbar/r01/verificar.mjs). ENGINES=…  SHOTS=0  VERBOSE=1
// Requiere packages/vue/dist y node_modules/vue. Escribe proto-*.png en esta carpeta. No toca nada más.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const HERE = fileURLToPath(new URL('./', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4238)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/page-index/r01/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const SHOTS = process.env.SHOTS !== '0'
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }
const wait = (p, ms) => p.waitForTimeout(ms)

// Lo que dice la regla (#1039) en este momento, calculado aparte del prototipo
const expected = (page) => page.evaluate(() => {
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingBlockStart) || 0
  const line = pad + (innerHeight - pad) / 3
  const ids = [...document.querySelectorAll('#pi-list .pi__link')].map((a) => a.dataset.id)
  const doc = document.scrollingElement
  const atEnd = Math.abs(doc.scrollTop + innerHeight - doc.scrollHeight) <= 1
  let id = null
  if (atEnd) { for (let i = ids.length - 1; i >= 0; i--) if (document.getElementById(ids[i]).getBoundingClientRect().top < innerHeight) { id = ids[i]; break } }
  else for (const x of ids) if (document.getElementById(x).getBoundingClientRect().top <= line) id = x
  return id
})
const state = (page, sel = '#pi-list') => page.evaluate((s) => {
  const r = document.querySelector(s)
  const cur = [...r.querySelectorAll('[aria-current]')]
  const a = cur[0]
  const m = r.querySelector('.pi__marker')
  const sc = r.querySelector('.pi__scroll')
  const ab = a && a.getBoundingClientRect(); const mb = m && m.getBoundingClientRect(); const sb = sc && sc.getBoundingClientRect()
  return { n: cur.length, value: cur.map((x) => x.getAttribute('aria-current')), id: a ? a.dataset.id : null,
    markerDy: a && mb ? Math.abs((mb.top + mb.height / 2) - (ab.top + ab.height / 2)) : null, markerOp: m ? getComputedStyle(m).opacity : null,
    visibleInColumn: a && sb ? ab.top >= sb.top - 1 && ab.bottom <= sb.bottom + 1 : null, colBottom: sb ? sb.bottom : null, scrollY }
}, sel)

for (const eng of ENGINES) {
  const browser = await pw[eng].launch()
  for (const theme of ['claro', 'oscuro']) {
    const T = theme === 'oscuro' ? '&theme=dark' : ''
    // ---------- Columna a 1280 ----------
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    const errs = []
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()) })
    page.on('pageerror', (e) => errs.push('pageerror ' + e.message))
    await page.goto(`${BASE}?p=comp${T}&landing=1`, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await wait(page, 300)
    let part = `columna/${theme}`
    const a11y = await page.evaluate(() => { const n = document.getElementById('pi-list'); const t = document.getElementById(n.getAttribute('aria-labelledby')); return { tag: n.tagName, name: t && t.textContent, heading: !!n.querySelector('h1,h2,h3,h4,h5,h6'), scrollerTab: n.querySelector('.pi__scroll').getAttribute('tabindex') } })
    rec(eng, part, 'nav con nombre «En esta página», sin encabezado propio, desplazador tabindex=-1 (#570)', a11y.tag === 'NAV' && a11y.name === 'En esta página' && !a11y.heading && a11y.scrollerTab === '-1', JSON.stringify(a11y))
    // La columna nunca pasa del visor bajo la banda (PI-N3)
    const s0 = await state(page)
    rec(eng, part, 'la columna cabe en el visor (desplazamiento propio)', s0.colBottom <= 800, s0.colBottom)
    // Lectura: llevar varias secciones a la vista y comparar con la regla
    const ids = await page.evaluate(() => [...document.querySelectorAll('#pi-list .pi__link')].map((a) => a.dataset.id))
    for (const k of [1, 6, 20, 40]) {
      await page.evaluate((id) => { const el = document.getElementById(id); scrollTo(0, el.getBoundingClientRect().top + scrollY - 150) }, ids[k])
      await wait(page, 350)
      const s = await state(page); const e = await expected(page)
      rec(eng, part, `lectura en ${ids[k]}: una sola actual (location) y es la de la regla`, s.n === 1 && s.value[0] === 'location' && s.id === e, `${s.id} / ${e}`)
      rec(eng, part, `marcador centrado en la fila actual (${ids[k]})`, s.markerDy !== null && s.markerDy <= 1.5 && s.markerOp === '1', `${s.markerDy} op ${s.markerOp}`)
      rec(eng, part, `PI-P1 · la actual se ve dentro de la columna (${ids[k]}) sin mover la página`, s.visibleInColumn, JSON.stringify(s))
    }
    // Final del documento: la última que se ve
    await page.evaluate(() => scrollTo(0, document.scrollingElement.scrollHeight))
    await wait(page, 900) // la columna se sigue con desplazamiento suave si el salto es corto: Firefox tarda más
    { const s = await state(page); const e = await expected(page); rec(eng, part, 'al final del documento, la última visible', s.id === e && s.visibleInColumn, `${s.id} / ${e}`) }
    // Elegir una sección corta del final: pasa al instante, se sostiene, el foco va al destino, llegada
    await page.evaluate(() => scrollTo(0, 0)); await wait(page, 300)
    const pick = ids[ids.length - 3]
    await page.mouse.move(1100, 400)
    await page.locator(`#pi-list .pi__link[data-id="${pick}"]`).click()
    await wait(page, 60)
    const landedNow = await page.evaluate((id) => document.getElementById(id).hasAttribute('data-g-landed'), pick)
    await wait(page, 600)
    { const s = await state(page); const f = await page.evaluate(() => document.activeElement.id)
      rec(eng, part, 'elegir: la elegida es la actual y se sostiene tras el salto (#1048)', s.id === pick, `${s.id} / ${pick}`)
      rec(eng, part, 'elegir: el foco va al destino', f === pick, f)
      rec(eng, part, 'PI-P2 · llegada: el destino lleva data-g-landed un instante', landedNow, landedNow) }
    await page.mouse.move(600, 400); await page.mouse.wheel(0, -300); await wait(page, 450)
    { const s = await state(page); const e = await expected(page); rec(eng, part, 'el primer desplazamiento reanuda la lectura', s.id === e, `${s.id} / ${e}`) }
    // PI-P1 no mueve la columna con el puntero encima (quien mira la lista manda)
    await page.evaluate(() => scrollTo(0, 0)); await wait(page, 300)
    await page.locator('#pi-list .pi__scroll').hover()
    const before = await page.evaluate(() => document.querySelector('#pi-list .pi__scroll').scrollTop)
    await page.evaluate((id) => { const el = document.getElementById(id); scrollTo(0, el.getBoundingClientRect().top + scrollY - 150) }, ids[50])
    await wait(page, 450)
    const after = await page.evaluate(() => document.querySelector('#pi-list .pi__scroll').scrollTop)
    rec(eng, part, 'PI-P1 · con el puntero sobre la columna, la columna no se mueve sola', before === after, `${before} → ${after}`)
    rec(eng, part, 'consola limpia', errs.length === 0, errs.slice(0, 2).join(' | '))
    if (SHOTS && eng === 'chromium') {
      await page.mouse.move(600, 400)
      await page.evaluate((id) => { const el = document.getElementById(id); scrollTo(0, el.getBoundingClientRect().top + scrollY - 150) }, ids[6]); await wait(page, 500)
      await page.screenshot({ path: join(HERE, `proto-columna-1280-${theme}-lectura.png`) })
      await page.evaluate((id) => { const el = document.getElementById(id); scrollTo(0, el.getBoundingClientRect().top + scrollY - 150) }, ids[50]); await wait(page, 700)
      await page.screenshot({ path: join(HERE, `proto-columna-1280-${theme}-sigue.png`) })
    }
    await page.close()

    // ---------- Movimiento reducido: el marcador solo funde ----------
    const pr = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
    await pr.goto(`${BASE}?p=comp${T}`, { waitUntil: 'networkidle' })
    const tr = await pr.evaluate(() => getComputedStyle(document.querySelector('#pi-list .pi__marker')).transitionProperty)
    rec(eng, `reducido/${theme}`, 'marcador: solo opacidad con movimiento reducido', tr === 'opacity', tr)
    await pr.close()

    // ---------- Plegada a 1024 y a 375 ----------
    for (const [w, touch] of [[1024, false], [375, true]]) {
      const p2 = await browser.newPage({ viewport: { width: w, height: w < 768 ? 740 : 800 }, hasTouch: touch })
      await p2.goto(`${BASE}?p=comp${T}`, { waitUntil: 'networkidle' })
      part = `plegada-${w}/${theme}`
      const btn = p2.locator('#pi-fold .pi__fold')
      rec(eng, part, 'la columna no se ve; el botón sí, con aria-expanded=false', await p2.evaluate(() => !document.getElementById('pi-list').getClientRects().length && document.querySelector('#pi-fold .pi__fold').getAttribute('aria-expanded') === 'false'))
      await btn.click(); await wait(p2, 150)
      const o = await p2.evaluate(() => { const b = document.querySelector('#pi-fold .pi__fold'); const d = document.getElementById(b.getAttribute('aria-controls')); const r = d.getBoundingClientRect(); return { exp: b.getAttribute('aria-expanded'), vis: !!d.getClientRects().length, right: r.right, left: r.left, bottom: r.bottom, first: d.querySelector('a').textContent.trim(), sizes: [...d.querySelectorAll('a')].slice(0, 4).map((a) => Math.round(a.getBoundingClientRect().height)) } })
      rec(eng, part, 'abre: aria-expanded=true, «Volver arriba» primero, dentro del visor', o.exp === 'true' && o.vis && o.first === 'Volver arriba' && o.left >= 0 && o.right <= w && o.bottom <= (w < 768 ? 740 : 800), JSON.stringify(o))
      if (touch) rec(eng, part, 'táctil ≥ 44 (botón y filas)', o.sizes.every((h) => h >= 44) && (await p2.evaluate(() => document.querySelector('#pi-fold .pi__fold').getBoundingClientRect().height)) >= 44, JSON.stringify(o.sizes))
      if (SHOTS && eng === 'chromium') await p2.screenshot({ path: join(HERE, `proto-plegada-${w}-${theme}.png`) })
      await p2.keyboard.press('Escape'); await wait(p2, 100)
      rec(eng, part, 'Esc cierra y devuelve el foco al botón', await p2.evaluate(() => document.activeElement === document.querySelector('#pi-fold .pi__fold') && document.querySelector('#pi-fold .pi__fold').getAttribute('aria-expanded') === 'false'))
      await btn.click(); await wait(p2, 150)
      const target = await p2.evaluate(() => document.querySelectorAll('#pi-fold .pi__link')[5].dataset.id)
      await p2.locator('#pi-fold .pi__link').nth(5).click(); await wait(p2, 500)
      const after2 = await p2.evaluate(() => ({ exp: document.querySelector('#pi-fold .pi__fold').getAttribute('aria-expanded'), focus: document.activeElement.id, top: document.activeElement.getBoundingClientRect().top, local: document.querySelector('.mk-local').getBoundingClientRect().bottom }))
      rec(eng, part, 'elegir cierra, lleva el foco al destino y el destino no queda bajo lo pegado', after2.exp === 'false' && after2.focus === target && after2.top >= after2.local - 1, JSON.stringify(after2))
      await btn.click(); await wait(p2, 150)
      await p2.locator('#pi-fold .pi__top').click(); await wait(p2, 300)
      const top = await p2.evaluate(() => ({ y: Math.round(scrollY), focus: document.activeElement.tagName, exp: document.querySelector('#pi-fold .pi__fold').getAttribute('aria-expanded') }))
      rec(eng, part, '«Volver arriba» desplaza a 0, cierra y lleva el foco al h1', top.y === 0 && top.focus === 'H1' && top.exp === 'false', JSON.stringify(top))
      await p2.close()
    }
  }
  await browser.close()
}
server.close()
const fails = R.filter((r) => !r.ok)
for (const eng of ENGINES) { const mine = R.filter((r) => r.eng === eng); console.log(`${eng}: ${mine.filter((r) => r.ok).length}/${mine.length}`) }
console.log(`total ${R.length - fails.length}/${R.length}`)
process.exitCode = fails.length ? 1 : 0
