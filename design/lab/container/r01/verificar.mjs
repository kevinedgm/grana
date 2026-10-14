// Verificación del prototipo del contenedor de página (kiwi r01): base y conceptos A, B y C en Chromium, Firefox y WebKit.
// Ejecutar desde la raíz: node design/lab/container/r01/verificar.mjs
//   Puerto 4217 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  PARTS=base,widths,A,B,C  VERBOSE=1
// Requiere packages/vue/dist/grana.css (npm run build). Solo lee; no toca packages/.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4217)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    const data = await readFile(path)
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(data)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/container/r01/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'base,widths,A,B,C').split(',')
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }
const near = (a, b, t = 1.5) => Math.abs(a - b) <= t

async function open (b, qs, opts = {}) {
  const { vw = 1440, vh = 900, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  // fonts.css puede faltar en dist mientras otro rol reconstruye: se tolera (no es del prototipo)
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/404/.test(m.text())) errs.push(m.text()) })
  p.on('requestfailed', (r) => errs.push('fallo ' + r.url()))
  p.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/fonts.css')) errs.push(r.status() + ' ' + r.url()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE + qs)
  await p.waitForFunction(() => window.__ct && window.__ct.ready)
  await settle(p)
  p.__errs = errs
  p.__ctx = context
  return p
}
const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30)))))
const rect = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height } }, sel)
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const prop = (p, sel, name) => p.evaluate(([sel, name]) => parseFloat(getComputedStyle(document.querySelector(sel)).getPropertyValue(name)), [sel, name])
const scrollTo = async (p, sel) => { await p.evaluate((sel) => { const e = document.querySelector(sel); scrollTo(0, e.getBoundingClientRect().top + scrollY - 200) }, sel); await settle(p) }
const close = async (p, eng, part, label) => { rec(eng, part, `consola limpia (${label})`, p.__errs.length === 0, p.__errs.slice(0, 2).join(' | ')); await p.__ctx.close() }
const expectG = (box) => Math.min(48, Math.max(16, box * 0.04))
const MAX = { sm: 640, md: 768, lg: 1024, xl: 1280, full: Infinity }

for (const eng of ENGINES) {
  const b = await pw[eng].launch()

  // ---------------- Base: la página de la aplicación con el ancho completo por composición ----------------
  if (PARTS.includes('base')) {
    const p = await open(b, '?c=base')
    rec(eng, 'base', 'un solo main', await p.evaluate(() => document.querySelectorAll('main').length === 1))
    const sec = await rect(p, '#ct'), body = await rect(p, '#body')
    rec(eng, 'base', 'columna md = 768 y centrada en su caja', near(body.width, 768) && near(body.left - sec.left, sec.right - body.right), `${body.width}`)
    const nb = await rect(p, '#nested-body')
    rec(eng, 'base', 'anidado sin margen acumulado (borde = columna)', near(nb.left, body.left))
    const host = await rect(p, '#host'), ihb = await rect(p, '#in-host-body')
    const hostPad = await p.evaluate(() => { const s = getComputedStyle(document.querySelector('#host')); return parseFloat(s.paddingInlineStart) + parseFloat(s.borderInlineStartWidth) })
    rec(eng, 'base', 'dentro de GSurface sin margen propio (solo el relleno de la superficie)', near(ihb.left - host.left, hostPad), `${ihb.left - host.left} / ${hostPad}`)
    const bw = await rect(p, '#band-wrap'), bb = await rect(p, '#band-body')
    rec(eng, 'base', 'banda de composición de borde a borde de la columna de la app', near(bw.left, sec.left) && near(bw.right, sec.right))
    rec(eng, 'base', 'contenido de la banda alineado con la columna', near(bb.left, body.left))
    await scrollTo(p, '#rule')
    const base = await rect(p, '#base')
    rec(eng, 'base', 'coste del emparedado: el zócalo deja de pegarse al acabar su tramo', !near(base.top, 56), `top ${Math.round(base.top)}`)
    rec(eng, 'base', 'sin desplazamiento horizontal', !(await overflow(p)))
    await close(p, eng, 'base', '1440')
  }

  // ---------------- Anchos en todos los visores, con y sin barra lateral ----------------
  if (PARTS.includes('widths')) {
    for (const vw of [320, 390, 768, 1024, 1280, 1920]) {
      for (const side of ['wide', 'none']) {
        if (vw <= 700 && side === 'wide') continue
        for (const w of ['sm', 'md', 'lg', 'xl', 'full']) {
          const p = await open(b, `?c=B&w=${w}&side=${side}`, { vw, vh: 800 })
          const main = await rect(p, '#main'), body = await rect(p, '#body')
          const g = expectG(main.width)
          const col = Math.min(main.width - 2 * g, MAX[w])
          const ok = near(body.width, col, 1) && near(body.left - main.left, main.right - body.right, 1) && !(await overflow(p))
          rec(eng, 'widths', `${vw} ${side} ${w}: columna = min(caja − 2·margen, máx), centrada, sin desbordar`, ok, `caja ${main.width} col ${body.width} esperado ${col.toFixed(1)}`)
          await p.__ctx.close()
        }
      }
    }
    // al inicio, LTR y RTL
    for (const dir of ['ltr', 'rtl']) {
      const p = await open(b, `?c=B&w=md&h=start${dir === 'rtl' ? '&dir=rtl' : ''}`)
      const main = await rect(p, '#main'), body = await rect(p, '#body')
      const g = expectG(main.width)
      rec(eng, 'widths', `al inicio (${dir}): el margen va al inicio lógico`, dir === 'ltr' ? near(body.left - main.left, g) : near(main.right - body.right, g), `${body.left - main.left} / ${main.right - body.right}`)
      const hd = await rect(p, '#ph')
      rec(eng, 'widths', `al inicio (${dir}): el sangrado sigue llegando a los dos bordes`, near(hd.left, main.left) && near(hd.right, main.right))
      await p.__ctx.close()
    }
    // el margen sigue a la caja, no al visor: barra ancha ↔ riel con el mismo visor
    const pw1 = await open(b, '?c=B&w=xl&side=wide'), pw2 = await open(b, '?c=B&w=xl&side=rail')
    const m1 = await rect(pw1, '#main'), m2 = await rect(pw2, '#main'), g1 = await prop(pw1, '#body', '--g-container-inset-start'), g2 = await prop(pw2, '#body', '--g-container-inset-start')
    rec(eng, 'widths', 'barra ↔ riel: la caja cambia y el margen sigue a la caja (sin punto de corte del visor)', m2.width > m1.width && near(g1, expectG(m1.width)) && near(g2, expectG(m2.width)), `${g1} ${g2}`)
    await pw1.__ctx.close(); await pw2.__ctx.close()
    // zoom 400 % ≈ visor de 320 px: margen mínimo y nada desborda
    const pz = await open(b, '?c=B&w=md', { vw: 320, vh: 256 })
    rec(eng, 'widths', '320 × 256 (zoom 400 %): margen 16 y sin desbordar', near(await prop(pz, '#body', '--g-container-inset-start'), 16) && !(await overflow(pz)))
    await pz.__ctx.close()
  }

  // ---------------- A · Medida ----------------
  if (PARTS.includes('A')) {
    const p = await open(b, '?c=A')
    const body = await rect(p, '#body'), p1 = await rect(p, '#p1'), measure = await prop(p, '#body', '--_ct-measure')
    const chars = await p.evaluate(() => { const b = document.querySelector('#body'); const s = document.createElement('span'); s.textContent = '0'.repeat(10); s.style.cssText = 'position:absolute;visibility:hidden'; b.appendChild(s); const w = s.getBoundingClientRect().width / 10; s.remove(); return document.querySelector('#p1').getBoundingClientRect().width / w })
    rec(eng, 'A', 'la prosa se queda en 66ch aunque la columna sea ancha', near(p1.width, measure) && body.width > measure + 100 && chars > 62 && chars < 70, `p ${p1.width} col ${body.width} ${chars.toFixed(1)} car.`)
    rec(eng, 'A', 'la prosa empieza en el borde de la columna', near(p1.left, body.left))
    const sc = await rect(p, '#scroller')
    rec(eng, 'A', 'lo ancho (tabla) usa toda la columna', near(sc.width, body.width))
    const hp = await p.evaluate(() => document.querySelector('#in-host-body p').getBoundingClientRect().width)
    const ihb = await rect(p, '#in-host-body')
    rec(eng, 'A', 'la prosa dentro de un componente (GSurface) no se limita', near(hp, ihb.width))
    // texto al 200 %: la medida es en caracteres, crece con el texto y nunca pasa de la columna
    await p.evaluate(() => { document.documentElement.style.fontSize = '200%' }); await settle(p)
    const p1z = await rect(p, '#p1'), bz = await rect(p, '#body')
    rec(eng, 'A', 'texto al 200 %: la medida crece con el texto, acotada por la columna, sin desbordar', p1z.width > p1.width && p1z.width <= bz.width + 0.5 && !(await overflow(p)))
    await close(p, eng, 'A', '1440')
  }

  // ---------------- B · Sangrado alineado ----------------
  if (PARTS.includes('B')) {
    for (const [vw, side] of [[1440, 'wide'], [1440, 'rail'], [390, 'wide']]) {
      const tag = `${vw} ${side}`
      const p = await open(b, `?c=B&side=${side}`, { vw, vh: 800 })
      const main = await rect(p, '#main'), body = await rect(p, '#body')
      const ph = await rect(p, '#ph'), h1 = await rect(p, '#page-title'), band = await rect(p, '#s-band'), bp = await rect(p, '#band-p'), media = await rect(p, '#media'), rule = await rect(p, '#rule')
      rec(eng, 'B', `${tag}: encabezado de marca de borde a borde de la caja (no bajo la barra lateral)`, near(ph.left, main.left) && near(ph.right, main.right), `${ph.left}–${ph.right} / ${main.left}–${main.right}`)
      rec(eng, 'B', `${tag}: el h1 sigue alineado con la columna`, near(h1.left, body.left))
      rec(eng, 'B', `${tag}: banda al borde y su texto en la columna`, near(band.left, main.left) && near(band.right, main.right) && near(bp.left, body.left) && near(bp.right, body.right, 2))
      rec(eng, 'B', `${tag}: media y línea en crudo de borde a borde`, near(media.left, main.left) && near(media.right, main.right) && near(rule.left, main.left) && near(rule.right, main.right))
      const sc = await rect(p, '#scroller'), t0 = await rect(p, '#table')
      rec(eng, 'B', `${tag}: tabla desplazable: llega al borde y en reposo empieza en la columna`, near(sc.left, main.left) && near(sc.right, main.right) && near(t0.left, body.left))
      await p.evaluate(() => { document.querySelector('#scroller').scrollLeft = 1e5 }); await settle(p)
      const t1 = await rect(p, '#table')
      rec(eng, 'B', `${tag}: al final del desplazamiento termina en la columna`, near(t1.right, body.right, 2), `${t1.right} / ${body.right}`)
      rec(eng, 'B', `${tag}: margen publicado en px y heredado (descendiente profundo)`, near(await prop(p, '#band-p', '--g-container-inset-start'), body.left - main.left))
      rec(eng, 'B', `${tag}: sin desplazamiento horizontal`, !(await overflow(p)))
      await scrollTo(p, '#rule')
      const base = await rect(p, '#base'), dock = await rect(p, '#dock')
      rec(eng, 'B', `${tag}: el zócalo sigue pegado toda la página (padre largo)`, near(base.top, 56), `top ${base.top}`)
      rec(eng, 'B', `${tag}: lo fijo no queda atrapado (container-type: inline-size)`, near(dock.bottom, 800) && near(dock.left, 0))
      await close(p, eng, 'B', tag)
    }
    const pr = await open(b, '?c=B&dir=rtl')
    const m = await rect(pr, '#main'), bd = await rect(pr, '#body'), bp = await rect(pr, '#band-p'), ph = await rect(pr, '#ph')
    rec(eng, 'B', 'RTL: sangrado a los dos bordes y texto en la columna', near(ph.left, m.left) && near(ph.right, m.right) && near(bp.right, bd.right))
    await close(pr, eng, 'B', 'rtl')
  }

  // ---------------- C · Medida a la mano ----------------
  if (PARTS.includes('C')) {
    const p = await open(b, '?c=C')
    const g = p.locator('#grip')
    rec(eng, 'C', 'separador con nombre, orientación y valores', await p.evaluate(() => { const e = document.querySelector('#grip'); return e.getAttribute('role') === 'separator' && e.getAttribute('aria-label') === 'Ancho de lectura' && e.getAttribute('aria-orientation') === 'vertical' && e.getAttribute('aria-valuenow') === '66' && e.getAttribute('aria-valuemin') === '45' && /caracteres por línea/.test(e.getAttribute('aria-valuetext')) && e.getAttribute('aria-controls') === 'body' }))
    rec(eng, 'C', 'el asa va después del contenido en el orden del Tab', await p.evaluate(() => { const f = [...document.querySelectorAll('#main a, #main button, #main input, #main [tabindex="0"]')]; return f[f.length - 1].id === 'grip' }))
    const w0 = (await rect(p, '#body')).width
    await g.focus(); await p.keyboard.press('ArrowRight'); await settle(p)
    const w1 = (await rect(p, '#body')).width
    rec(eng, 'C', '→ ensancha 2 caracteres', (await g.getAttribute('aria-valuenow')) === '68' && w1 > w0)
    await p.keyboard.press('Home'); await settle(p)
    rec(eng, 'C', 'Inicio = mínimo (45)', (await g.getAttribute('aria-valuenow')) === '45')
    await p.keyboard.press('End'); await settle(p)
    rec(eng, 'C', 'Fin = el máximo que cabe', Number(await g.getAttribute('aria-valuenow')) === Number(await g.getAttribute('aria-valuemax')))
    const vis = await p.evaluate(() => getComputedStyle(document.querySelector('#grip')).opacity)
    rec(eng, 'C', 'con el foco, el asa se ve', vis === '1')
    await g.dblclick(); await settle(p)
    rec(eng, 'C', 'doble clic restablece 66', (await g.getAttribute('aria-valuenow')) === '66')
    // arrastre: guías, la columna no cambia hasta soltar
    const gr = await rect(p, '#grip'), bd = await rect(p, '#body')
    await p.mouse.move(gr.left + gr.width / 2, gr.top + gr.height / 2); await p.mouse.down()
    await p.mouse.move(gr.left + 60, gr.top + gr.height / 2, { steps: 4 }); await settle(p)
    const during = await rect(p, '#body')
    const guides = await p.evaluate(() => document.querySelectorAll('.ct__guide').length)
    rec(eng, 'C', 'arrastrando: dos guías y la columna quieta (Δ0, sin reflujo por cuadro)', guides === 2 && near(during.width, bd.width, 0.5) && near(during.left, bd.left, 0.5))
    await p.mouse.up(); await settle(p)
    const after = await rect(p, '#body')
    rec(eng, 'C', 'al soltar se aplica y las guías se van', after.width > bd.width + 20 && (await p.evaluate(() => document.querySelectorAll('.ct__guide').length)) === 0, `${bd.width} → ${after.width}`)
    const before = await g.getAttribute('aria-valuenow')
    const gr2 = await rect(p, '#grip')
    await p.mouse.move(gr2.left + gr2.width / 2, gr2.top + gr2.height / 2); await p.mouse.down()
    await p.mouse.move(gr2.left - 80, gr2.top + gr2.height / 2, { steps: 4 }); await p.keyboard.press('Escape'); await p.mouse.up(); await settle(p)
    rec(eng, 'C', 'Esc cancela el arrastre', (await g.getAttribute('aria-valuenow')) === before)
    rec(eng, 'C', 'sin desplazamiento horizontal', !(await overflow(p)))
    await close(p, eng, 'C', '1440')
    const pt = await open(b, '?c=C', { vw: 390, vh: 800 })
    rec(eng, 'C', '390: sin holgura no hay asa', await pt.evaluate(() => document.querySelector('#main').classList.contains('is-tight') && getComputedStyle(document.querySelector('#grips')).display === 'none'))
    await close(pt, eng, 'C', '390')
    const prt = await open(b, '?c=C&dir=rtl')
    await prt.locator('#grip').focus(); await prt.keyboard.press('ArrowLeft'); await settle(prt)
    rec(eng, 'C', 'RTL: ← ensancha (el asa está a la izquierda)', (await prt.locator('#grip').getAttribute('aria-valuenow')) === '68')
    await close(prt, eng, 'C', 'rtl')
  }
  await b.close()
}
server.close()

const tally = {}
for (const r of R) { const k = `${r.eng} ${r.part}`; tally[k] = tally[k] || [0, 0]; tally[k][1]++; if (r.ok) tally[k][0]++ }
for (const [k, [a, t]] of Object.entries(tally)) console.log(`${k}: ${a}/${t}`)
const ok = R.filter((r) => r.ok).length
console.log(`\n${ok} de ${R.length} pasan`)
process.exitCode = ok === R.length ? 0 : 1
