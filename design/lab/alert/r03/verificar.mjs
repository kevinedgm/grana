// Verificación de la isla r03 (kiwi): los tres conceptos (A, B, C) en Chromium, Firefox y WebKit.
// Ejecutar: node design/lab/alert/r03/verificar.mjs   (Playwright de design/lab/theme-playground; GRANA_PW_PORT, por defecto 4213)
// Requiere `npm run build` (tokens y fuentes de dist/). ENGINES=chromium CONCEPTS=A VERBOSE=1 para filtrar o ver todo.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4213)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(path))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/alert/r03/index.html`
const READ = 1500
const ERR = 'Error: No se pudo guardar la factura. El servidor no respondió; tus datos siguen en el formulario.'
const total = { pass: 0, fail: 0 }
const out = []

// En la página: estado visible de la isla
const look = () => {
  const isle = document.querySelector('.isle'), shape = isle.querySelector('.isle__shape')
  const r = shape.hidden ? null : shape.getBoundingClientRect()
  return { form: isle.dataset.form, rect: r && { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right }, focus: document.activeElement && (document.activeElement.id || document.activeElement.dataset.do || document.activeElement.className || document.activeElement.tagName), live: window.__live.length }
}
const refs = () => ['ref-h1', 'cliente', 'save', 'ref-row1'].map((id) => { const e = document.getElementById(id); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x * 10) / 10, Math.round(r.y * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10] })

for (const engine of (process.env.ENGINES || 'chromium,firefox,webkit').split(',')) {
  const browser = await pw[engine].launch()
  for (const C of (process.env.CONCEPTS || 'A,B,C').split(',')) {
    let pass = 0; const fails = []; const errs = []
    const ok = (c, m) => { if (c) pass++; else fails.push(m); if (process.env.VERBOSE) console.log(engine, C, c ? 'ok ' : 'NO ', m) }
    const open = async ({ vw = 1100, vh = 760, q = '', ...ctx } = {}) => {
      const context = await browser.newContext({ viewport: { width: vw, height: vh }, ...ctx })
      const p = await context.newPage()
      p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
      p.on('pageerror', (e) => errs.push(String(e)))
      await p.goto(`${BASE}?c=${C}&t=${READ}${q}`)
      await p.waitForFunction(() => window.__S && document.querySelector('.isle.is-ready'))
      await p.waitForTimeout(50)
      return { p, context }
    }
    // Filma el nacimiento por cuadros (ancho de la superficie visible) mientras corre `act`
    const filmBirth = async (p, act) => {
      await p.evaluate(() => {
        const shape = document.querySelector('.isle__shape'); window.__fr = []
        const t0 = performance.now()
        const tick = () => { if (!shape.hidden && getComputedStyle(shape).visibility !== 'hidden') { const r = shape.getBoundingClientRect(); window.__fr.push({ t: performance.now() - t0, w: r.width, op: +getComputedStyle(shape).opacity }) } if (performance.now() - t0 < 1400) requestAnimationFrame(tick) }
        requestAnimationFrame(tick)
      })
      await act()
      await p.waitForTimeout(1450)
      return p.evaluate(() => window.__fr)
    }

    // ---------- 1. Carga y error al guardar ----------
    {
      const { p, context } = await open()
      const s0 = await p.evaluate(look)
      ok(s0.form === 'empty' && s0.live === 0, `carga: vacía y 0 anuncios (${s0.form}, ${s0.live})`)
      const before = await p.evaluate(refs)
      await p.locator('#save').focus()
      const frames = await filmBirth(p, () => p.keyboard.press('Enter'))
      const s1 = await p.evaluate(look)
      const live = await p.evaluate(() => window.__live)
      ok(live.length === 1 && live[0].text === ERR && live[0].ch === 'assertive', `error: un anuncio enérgico exacto (${JSON.stringify(live)})`)
      ok(s1.focus === 'save', `error: el foco sigue en «Guardar» (${s1.focus})`)
      const after = await p.evaluate(refs)
      ok(JSON.stringify(before) === JSON.stringify(after), `D1: referencias Δ0 (${JSON.stringify(before)} → ${JSON.stringify(after)})`)
      const vis = frames.filter((f) => f.op > 0.05)
      const maxW = Math.max(...vis.map((f) => f.w))
      const openW = await p.evaluate(() => { const s = document.querySelector('.isle__shape'); return s.hidden ? 0 : Math.max(s.getBoundingClientRect().width, parseFloat(getComputedStyle(document.querySelector('.isle')).getPropertyValue('--_open')) || 0) })
      const cap = Math.ceil(418 * 1.05)
      ok(vis.length > 0 && maxW <= cap, `nacer: ningún cuadro visible más ancho que la isla abierta (máx ${Math.round(maxW)}px, tope ${cap}px; final ${Math.round(openW)}px)`)
      ok(s1.rect && s1.rect.x >= 0 && s1.rect.right <= 1100, `nacer: dentro del visor (${JSON.stringify(s1.rect)})`)
      if (C === 'A') {
        ok(s1.form === 'compact', `A: no se abre sola, aterriza replegada (${s1.form})`)
        const txt = await p.locator('.isle__text').innerText()
        ok(/No se pudo guardar la factura/.test(txt), `A: título a la vista en la replegada («${txt}»)`)
        ok(await p.locator('#mark-save').isVisible(), 'A: la marca está junto a «Guardar»')
        ok(await p.evaluate(() => document.querySelectorAll('.flight').length === 0), 'A: el vuelo no deja clones')
        await p.locator('#isle-summary').click(); await p.waitForTimeout(350)
        const close = p.locator('[data-do=close]')
        ok((await p.evaluate(look)).form === 'open' && await close.isVisible() && /Replegar/.test(await close.innerText()), 'A: abierta con «Replegar» a la vista')
        await close.click(); await p.waitForTimeout(300)
        const s2 = await p.evaluate(look)
        ok(s2.form === 'compact' && s2.focus === 'isle-summary', `A: «Replegar» → replegada, foco en el resumen (${s2.form}, ${s2.focus})`)
        await p.locator('#isle-summary').click(); await p.waitForTimeout(300)
        await p.locator('[data-id=save] [data-do=hide]').click(); await p.waitForTimeout(300)
        const s3 = await p.evaluate(look)
        ok(s3.form === 'empty' && await p.locator('#mark-save').isVisible() && s3.focus === 'mark-save', `A: «Ocultar» → la isla se va, la marca queda y recibe el foco (${s3.form}, ${s3.focus})`)
        await p.locator('#mark-save').click(); await p.waitForTimeout(300)
        const s4 = await p.evaluate(look)
        ok(s4.form === 'open' && s4.focus === 'act', `A: la marca devuelve la condición y enfoca «Reintentar» (${s4.form}, ${s4.focus})`)
        await p.locator('#fails').uncheck({ force: true })
        await p.locator('#mark-save').click(); await p.waitForTimeout(250)
        await p.locator('[data-id=save] [data-do=act]').click()
        await p.waitForTimeout(150)
        ok(await p.locator('[data-id=save][aria-busy=true]').count() === 1, 'A: reintentando con aria-busy')
        await p.waitForTimeout(800)
        const l2 = await p.evaluate(() => window.__live.map((x) => x.text))
        ok(l2.includes('Correcto: Factura guardada con el folio F-0042'), `A: el éxito se anuncia (${l2.join(' | ')})`)
        await p.mouse.move(5, 700); await p.locator('#cliente').focus()
        await p.waitForTimeout(READ + 700)
        const s5 = await p.evaluate(look)
        ok(s5.form === 'empty' && /Guardada/.test(await p.locator('#mark-save').innerText()), `A: leído, vuelve a su marca («Guardada») y la isla se vacía (${s5.form})`)
        const n0 = (await p.evaluate(() => window.__live)).length
        await p.locator('#s-leave').click(); await p.waitForTimeout(200)
        ok(await p.evaluate(() => !window.__S.B.conds.has('save')) && (await p.evaluate(() => window.__live)).length === n0, 'A: salir del formulario retira lo que nació ahí, sin anuncio')
      }
      if (C === 'B') {
        ok(s1.form === 'open', `B: se abre sola en un segundo tiempo (${s1.form})`)
        const early = frames.find((f) => f.t < 300 && f.op > 0.5)
        ok(!!early && early.w < 400, `B: primero la píldora (${early && Math.round(early.w)}px antes de 300 ms), después la abierta`)
        ok(await p.locator('.drain').isVisible() && await p.locator('[data-do=close]').isVisible(), 'B: «Replegar» y la línea de lectura a la vista')
        ok(await p.locator('.item__note').count() === 1, 'B: la condición dice que se quitará cuando se resuelva')
        await p.mouse.move(550, 120); await p.waitForTimeout(READ + 400)
        ok((await p.evaluate(look)).form === 'open', 'B: con el puntero encima no se recoge (pausa, 2.2.1)')
        await p.mouse.move(5, 700); await p.waitForTimeout(READ + 400)
        const s2 = await p.evaluate(look)
        ok(s2.form === 'compact' && s2.focus === 'save', `B: sin usarla, se recoge sola a replegada sin mover el foco (${s2.form}, ${s2.focus})`)
        await p.locator('#isle-summary').click(); await p.waitForTimeout(300)
        ok(await p.locator('.drain').count() === 0, 'B: abierta por la persona no se recoge sola')
        await p.locator('[data-do=ack]').click(); await p.waitForTimeout(350)
        const s3 = await p.evaluate(look)
        ok(s3.form === 'dot' && s3.rect.w >= 24 && s3.rect.h >= 24, `B: «Entendido» → punto ≥ 24px (${s3.form}, ${s3.rect && Math.round(s3.rect.w)})`)
        await p.mouse.move(5, 700); await p.locator('#cliente').focus(); await p.locator('#isle-summary').focus(); await p.waitForTimeout(250)
        const tip = await p.evaluate(() => { const t = document.querySelector('.isle__tip'); return { op: getComputedStyle(t).opacity, txt: t.textContent, hidden: t.getAttribute('aria-hidden') } })
        ok(+tip.op > 0.9 && /No se pudo guardar/.test(tip.txt) && tip.hidden === 'true', `B: el punto enfocado dice qué guarda (${tip.op}, «${tip.txt}»)`)
        await p.locator('#s-offline').click(); await p.waitForTimeout(300)
        await p.locator('[data-do]').count()
        const s4 = await p.evaluate(look)
        ok(s4.form === 'compact', `B: lo nuevo saca al punto a replegada (${s4.form})`)
        await p.evaluate(() => { window.__S.B.list().forEach((c) => { c.ack = true }); window.__S.paint() })
        await p.waitForTimeout(200)
        ok(await p.locator('.count').innerText() === '2', 'B: el punto lleva la cuenta')
        await p.locator('#s-online').click(); await p.mouse.move(5, 700); await p.locator('#cliente').focus()
        await p.waitForTimeout(READ + 500)
        ok(await p.evaluate(() => !window.__S.B.conds.has('offline')), 'B: un resultado sin enlace se lee y se va')
        const l = await p.evaluate(() => window.__live.map((x) => x.text))
        ok(l.includes('Correcto: Conexión restablecida'), `base r03: resolver limpia la descripción (${l[l.length - 1]})`)
      }
      if (C === 'C') {
        await p.mouse.move(5, 700)
        const early = await p.evaluate(look)
        ok(s1.form === 'headline' || early.form === 'headline', `C: llega como titular, sin abrirse (${s1.form})`)
        ok(/No se pudo guardar la factura/.test(await p.locator('.isle__text').innerText()), 'C: el titular dice el título')
        ok(await p.locator('#isle-panel').isHidden(), 'C: ningún panel se abre solo')
        await p.waitForTimeout(READ + 400)
        const s2 = await p.evaluate(look)
        const num = await p.locator('.ctr[data-type=error] .num').innerText()
        ok(s2.form === 'tab' && num === '1', `C: el titular se recoge en su cifra (${s2.form}, ${num})`)
        await p.locator('#isle-summary').click(); await p.waitForTimeout(300)
        ok((await p.evaluate(look)).form === 'open' && /Cerrar/.test(await p.locator('[data-do=close]').innerText()), 'C: abierta con «Cerrar» a la vista')
        await p.locator('[data-id=save] [data-do=seen]').click(); await p.waitForTimeout(200)
        await p.locator('[data-do=close]').click(); await p.waitForTimeout(300)
        ok(await p.locator('.ctr[data-type=error][data-seen]').count() === 1 && (await p.evaluate(look)).focus === 'isle-summary', 'C: «Visto» → la cifra pasa a contorno; «Cerrar» deja el foco en la lengüeta')
        ok(/1 error vistos?/.test(await p.locator('#isle-summary').textContent()), 'C: el nombre accesible dice «visto»')
        await p.locator('#isle-summary').click(); await p.waitForTimeout(250)
        await p.locator('[data-id=save] [data-do=hide]').click(); await p.waitForTimeout(250)
        const s3 = await p.evaluate(look)
        ok(s3.form === 'empty' && s3.focus === 'mark-save', `C: ocultar lo último → la lengüeta se va y el foco va a la marca, no a body (${s3.form}, ${s3.focus})`)
        await p.locator('#cliente').focus(); await p.keyboard.press('Alt+F8'); await p.waitForTimeout(300)
        ok((await p.evaluate(look)).focus === 'isle-summary' && await p.locator('.hidden-h').isVisible(), 'C: Alt+F8 llega también a lo oculto')
      }
      ok(errs.length === 0, `sin errores de consola (${errs.join(' | ')})`)
      await context.close()
    }

    // ---------- 2. Teclado: Alt+F8 ida y vuelta, Esc, Enter ----------
    {
      const { p, context } = await open()
      await p.locator('#s-offline').click(); await p.waitForTimeout(400)
      await p.locator('#cliente').focus()
      await p.keyboard.press('Alt+F8'); await p.waitForTimeout(300)
      const a = await p.evaluate(look)
      ok(a.form === 'open' && a.focus === 'isle-summary', `Alt+F8: abre y enfoca el resumen (${a.form}, ${a.focus})`)
      await p.keyboard.press('Escape'); await p.waitForTimeout(250)
      const b = await p.evaluate(look)
      ok(b.form !== 'open' && b.focus === 'isle-summary', `Esc: repliega y deja el foco en el resumen (${b.form})`)
      await p.keyboard.press('Enter'); await p.waitForTimeout(250)
      ok((await p.evaluate(look)).form === 'open', 'Enter en el resumen abre')
      await p.keyboard.press('Alt+F8'); await p.waitForTimeout(250)
      ok((await p.evaluate(look)).focus === 'cliente', 'Alt+F8 dentro: vuelve al campo')
      const a11y = await p.evaluate(() => ({ lives: document.querySelectorAll('[aria-live],[role=status],[role=alert]').length, shapeLive: document.querySelector('.isle__shape').hasAttribute('aria-live') }))
      ok(a11y.lives === 2 && !a11y.shapeLive, `un solo par de canales; la isla no es región viva (${a11y.lives})`)
      const texts = await p.evaluate(() => window.__live.map((x) => x.text))
      ok(texts.length === new Set(texts).size, 'sin anuncios repetidos')
      // abrir, replegar, ocultar: sin anuncios
      ok(texts.length === 1, `abrir y replegar no anuncian (${texts.length})`)
      await context.close()
    }

    // ---------- 3. Contraste (tema por defecto) y áreas ----------
    {
      const { p, context } = await open()
      await p.evaluate(() => {
        const B = window.__S.B
        B.set('e', { type: 'error', title: 'Error de prueba', description: 'Texto de la descripción.', action: { label: 'Reintentar', onClick () {} } })
        B.set('w', { type: 'warning', title: 'Advertencia de prueba', description: 'Texto.' })
        B.set('i', { type: 'info', title: 'Información de prueba', description: 'Texto.', dismissible: true })
        B.set('s', { type: 'success', title: 'Resultado de prueba', link: { label: 'Ver', href: '#x' } })
      })
      await p.waitForTimeout(500)
      await p.evaluate(() => window.__S.setOpen(true)); await p.waitForTimeout(500)
      const m = await p.evaluate(() => {
        const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
        const rgb = (c) => { cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = c; cv.fillRect(0, 0, 1, 1); const d = cv.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
        const over = (top, bot) => top.slice(0, 3).map((v, i) => v * top[3] + bot[i] * (1 - top[3]))
        const L = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
        const cr = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
        const shape = document.querySelector('.isle__shape')
        const bg = rgb(getComputedStyle(shape).backgroundColor)
        const tile = over(rgb(getComputedStyle(document.querySelector('.item')).backgroundColor), bg)
        const r = { text: cr(rgb(getComputedStyle(document.querySelector('.isle__summary')).color), bg), desc: cr(rgb(getComputedStyle(document.querySelector('.item__desc')).color), tile), btn: cr(rgb(getComputedStyle(document.querySelector('.ibtn')).borderTopColor), tile) }
        for (const t of ['error', 'warning', 'info', 'success']) {
          const b = document.querySelector(`.item .badge[data-type=${t}]`)
          r['icon-' + t] = cr(rgb(getComputedStyle(b).color), rgb(getComputedStyle(b).backgroundColor))
        }
        r.ring = cr(rgb(getComputedStyle(document.querySelector('.item .badge')).outlineColor), tile)
        const small = [...document.querySelectorAll('.isle button, .isle a')].filter((b) => b.getClientRects().length).map((b) => b.getBoundingClientRect()).filter((x) => x.width < 24 || x.height < 24).length
        return { ...Object.fromEntries(Object.entries(r).map(([k, v]) => [k, Math.round(v * 100) / 100])), small }
      })
      ok(m.text >= 4.5 && m.desc >= 4.5, `contraste del texto ≥ 4.5 (resumen ${m.text}, descripción ${m.desc})`)
      ok(['error', 'warning', 'info', 'success'].every((t) => m['icon-' + t] >= 3) && m.ring >= 3 && m.btn >= 3, `insignias, anillo y bordes de botón ≥ 3 (${JSON.stringify(m)})`)
      ok(m.small === 0, `controles de la isla ≥ 24×24 (${m.small} pequeños)`)
      await context.close()
    }

    // ---------- 4. 320px ----------
    {
      const { p, context } = await open({ vw: 320, vh: 640 })
      await p.locator('#save').click(); await p.waitForTimeout(900)
      await p.evaluate(() => window.__S.setOpen(true)); await p.waitForTimeout(400)
      const m = await p.evaluate(() => { const r = document.querySelector('.isle__shape').getBoundingClientRect(); return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, l: r.left, r: r.right, form: document.querySelector('.isle').dataset.form } })
      ok(m.sw <= m.cw && m.l >= 0 && m.r <= 320, `320px: sin desplazamiento horizontal y la isla abierta cabe (${JSON.stringify(m)})`)
      if (C === 'B') {
        const { p: p2, context: c2 } = await open({ vw: 375, vh: 700 })
        await p2.locator('#save').click(); await p2.waitForTimeout(1000)
        ok((await p2.evaluate(look)).form !== 'open', 'B: en móvil nunca se abre sola')
        await c2.close()
      }
      await context.close()
    }

    // ---------- 5. Movimiento reducido ----------
    {
      const { p, context } = await open({ reducedMotion: 'reduce' })
      await p.evaluate(() => {
        window.__moving = []
        const mo = () => { for (const a of document.getAnimations()) { const k = a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : []; const props = new Set(k.flatMap((f) => Object.keys(f)).filter((x) => !['offset', 'easing', 'composite', 'computedOffset'].includes(x))); const name = a.animationName || a.transitionProperty || [...props].join('+'); if (a.transitionProperty) props.add(a.transitionProperty); if ([...props].some((x) => /transform|translate|scale|rotate|clip|inline-size|block-size|width|height/i.test(x))) window.__moving.push(name) } if (performance.now() - t0 < 1600) requestAnimationFrame(mo) }
        const t0 = performance.now(); requestAnimationFrame(mo)
      })
      await p.locator('#save').click(); await p.waitForTimeout(1000)
      await p.locator('#s-offline').click(); await p.waitForTimeout(500)
      const mv = await p.evaluate(() => [...new Set(window.__moving)])
      ok(mv.length === 0, `reducido: nada se mueve ni cambia de tamaño animado (${mv.join(', ')})`)
      ok((await p.evaluate(() => document.querySelectorAll('.flight').length)) === 0, 'reducido: sin vuelo')
      await context.close()
    }

    total.pass += pass; total.fail += fails.length
    out.push(`${engine} ${C}: ${pass}/${pass + fails.length}${fails.length ? '\n   - ' + fails.join('\n   - ') : ''}`)
    console.log(out[out.length - 1])
  }
  await browser.close()
}
server.close()
console.log(`\nTotal: ${total.pass}/${total.pass + total.fail}`)
process.exitCode = total.fail ? 1 : 0
