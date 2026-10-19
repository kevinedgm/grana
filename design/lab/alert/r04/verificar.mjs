// Auditoría posterior de las tres propuestas de r04 (kiwi): D1 · Cápsula de relevo, D2 · Tarjetas en mazo, D3 · Repisa.
// Chromium, Firefox y WebKit; tema por defecto claro y oscuro; contraste sobre tres fondos (página, superficie de
// formulario/tabla y zona de marca de la cabecera); 320 px y 640 px (texto al 200 %); movimiento reducido; foco, teclado y
// anuncios; movimiento cuadro a cuadro al nacer y al recogerse.
// Ejecutar: node design/lab/alert/r04/verificar.mjs  (Playwright de design/lab/theme-playground; GRANA_PW_PORT, por defecto 4213)
// Requiere `npm run build`. ENGINES=chromium PROPS=D1 VERBOSE=1 para filtrar o ver todo.
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
const BASE = `http://127.0.0.1:${PORT}/design/lab/alert/r04/index.html`
const RT = 2600
const ERR = 'Error: No se pudo guardar la factura. El servidor no respondió; tus datos siguen en el formulario.'
const total = { pass: 0, fail: 0 }
const SHAPE = { D1: '.d1', D2: '.d2', D3: '.d3' }

const refs = () => ['ref-h1', 'cliente', 'save', 'ref-row1'].map((id) => { const e = document.getElementById(id); const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] })

for (const engine of (process.env.ENGINES || 'chromium,firefox,webkit').split(',')) {
  const browser = await pw[engine].launch()
  for (const P of (process.env.PROPS || 'D1,D2,D3').split(',')) {
    let pass = 0; const fails = []; const errs = []
    const ok = (c, m) => { if (c) pass++; else fails.push(m); if (process.env.VERBOSE) console.log(engine, P, c ? 'ok ' : 'NO ', m) }
    const sel = SHAPE[P]
    const open = async ({ vw = 1100, vh = 760, q = '', ...ctx } = {}) => {
      const context = await browser.newContext({ viewport: { width: vw, height: vh }, ...ctx })
      const p = await context.newPage()
      p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
      p.on('pageerror', (e) => errs.push(String(e)))
      await p.goto(`${BASE}?p=${P}&t=${RT}${q}`)
      await p.waitForFunction(() => window.__S && document.querySelector('.isle.is-ready'))
      await p.waitForTimeout(60)
      return { p, context }
    }
    const st = (p) => p.evaluate((sel) => {
      const el = document.querySelector(sel)
      const r = el && !el.hidden ? el.getBoundingClientRect() : null
      const a = document.activeElement
      return { form: document.querySelector('.isle').dataset.form, rect: r && { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right }, visible: !!r, focus: a && (a.id || a.dataset.do || a.className || a.tagName), live: window.__live.length, shown: [...window.__S.shown], list: window.__S.list }
    }, sel)
    // Filma la superficie (o la tarjeta de arriba) por cuadros
    const film = async (p, ms) => p.evaluate(({ sel, ms }) => new Promise((done) => {
      const out = []; const t0 = performance.now()
      const tick = () => {
        const el = sel === '.d2' ? document.querySelector('.d2 .card') : document.querySelector(sel)
        if (el && !el.hidden && !(el.closest('[hidden]'))) {
          const r = el.getBoundingClientRect(); const cs = getComputedStyle(el)
          const inner = el.firstElementChild
          out.push({ t: performance.now() - t0, w: r.width, y: r.top, op: +cs.opacity, io: inner ? +getComputedStyle(inner).opacity : 1 })
        } else out.push({ t: performance.now() - t0, hidden: true })
        if (performance.now() - t0 < ms) requestAnimationFrame(tick); else done(out)
      }
      requestAnimationFrame(tick)
    }), { sel, ms })

    // ---------- 1. Nacer, leer, pausa, recogerse, marca ----------
    {
      const { p, context } = await open()
      const s0 = await st(p)
      ok(!s0.visible && s0.live === 0, `carga: nada a la vista y 0 anuncios (${s0.form}, ${s0.live})`)
      const before = await p.evaluate(refs)
      await p.locator('#save').focus()
      const filmP = film(p, 900)
      await p.keyboard.press('Enter')
      const fr = (await filmP).filter((f) => !f.hidden)
      const s1 = await st(p)
      const live = await p.evaluate(() => window.__live)
      ok(live.length === 1 && live[0].text === ERR && live[0].ch === 'assertive', `error: un anuncio enérgico exacto (${live.length})`)
      ok(s1.focus === 'save', `error: el foco sigue en «Guardar» (${s1.focus})`)
      ok(JSON.stringify(before) === JSON.stringify(await p.evaluate(refs)), 'nada se mueve en la página (Δ0 en cuatro referencias)')
      const vis = fr.filter((f) => f.op > 0.05)
      const fin = vis[vis.length - 1]
      ok(vis.length && Math.max(...vis.map((f) => f.w)) <= fin.w * 1.06 + 2, `nacer: ningún cuadro más ancho que la isla (máx ${Math.round(Math.max(...vis.map((f) => f.w)))}px, final ${fin && Math.round(fin.w)}px)`)
      const f0 = vis[0]
      ok(f0 && (f0.op < 0.9 || f0.y < fin.y - 1), `nacer: el primer cuadro visible entra desde el borde, no de golpe (op ${f0 && f0.op.toFixed(2)}, y ${f0 && Math.round(f0.y)} → ${fin && Math.round(fin.y)})`)
      let opJump = 0; for (let i = 1; i < vis.length; i++) opJump = Math.max(opJump, vis[i].op - vis[i - 1].op)
      ok(opJump <= 0.75, `nacer: sin saltos de opacidad (máx +${opJump.toFixed(2)} por cuadro)`)
      if (P === 'D1') ok(f0 && f0.io < 0.1 && f0.w <= 100, `D1: nace como cápsula sin texto (${f0 && Math.round(f0.w)}px, contenido ${f0 && f0.io})`)
      ok(s1.rect && s1.rect.x >= 0 && s1.rect.right <= 1100, 'dentro del visor')
      // pausa con el puntero
      await p.locator(sel).hover(); await p.waitForTimeout(RT + 300)
      ok((await st(p)).visible, 'pausa: con el puntero encima no se recoge')
      if (P === 'D1') ok(await p.locator('.d1 [data-do=act]').isVisible(), 'D1: al pasar, la acción asoma')
      // recogerse
      const echo = p.evaluate(() => new Promise((r) => { const m = document.getElementById('mark-save'); const mo = new MutationObserver(() => { if (m.classList.contains('is-echo')) { mo.disconnect(); r(true) } }); mo.observe(m, { attributes: true }); setTimeout(() => r(false), 6000) }))
      const lvP = film(p, RT + 1200)
      await p.mouse.move(5, 740)
      const lv = await lvP
      const shownF = lv.filter((f) => !f.hidden)
      const y0 = shownF.length ? shownF[0].y : 0
      ok(shownF.some((f) => f.y < y0 - 2 && (P === 'D3' || f.op < 1)) && lv[lv.length - 1].hidden, `se recoge subiendo (fundiéndose en D1 y D2; D3 se mete bajo la cabecera) (${shownF.filter((f) => f.y < y0 - 2).length} cuadros subiendo)`)
      ok(await echo, 'al recogerse, la marca recibe el eco')
      const s2 = await st(p)
      ok(!s2.visible && await p.evaluate(() => window.__S.B.conds.has('save')) && await p.locator('#mark-save').isVisible(), 'sin punto: el error sigue vigente en la marca')
      await p.locator('#mark-save').click(); await p.waitForTimeout(450)
      const s3 = await st(p)
      ok(s3.list && s3.focus === 'act', `la marca trae lo pendiente con el foco en «Reintentar» (${s3.focus})`)
      ok(await p.locator('.isle [data-do=act]').first().isVisible(), 'la acción está a la vista en la lista')
      await p.keyboard.press('Escape'); await p.waitForTimeout(800)
      const s4 = await st(p)
      ok(!s4.visible && s4.focus === 'mark-save', `Esc la recoge y el foco vuelve a la marca (${s4.focus})`)
      ok(errs.length === 0, `sin errores de consola (${errs.join(' | ')})`)
      await context.close()
    }

    // ---------- 2. Varias a la vez ----------
    {
      const { p, context } = await open()
      await p.locator('#s-three').click(); await p.mouse.move(5, 740); await p.waitForTimeout(700)
      if (P === 'D1') {
        const a = await st(p)
        const txt = await p.locator('.d1__text').innerText()
        ok(/No se pudo guardar/.test(txt) && (await p.evaluate(() => window.__S.queue.length)) === 2, `D1: lo más grave pasa delante y las otras esperan (+2) («${txt}»)`)
        const fr = film(p, RT + 600)
        await p.waitForTimeout(RT + 700)
        const f = await fr
        ok(f.every((x) => !x.hidden) && (await p.evaluate(() => window.__S.queue.length)) === 1, 'D1: se releva a la siguiente sin desaparecer')
        ok(/Sin conexión|Mantenimiento/.test(await p.locator('.d1__text').innerText()), 'D1: la cápsula dice la siguiente')
      }
      if (P === 'D2') {
        const n = await p.locator('.card:not(.is-out)').count()
        const top = await p.locator('.card:not(.is-out)').first().getAttribute('data-id')
        ok(n === 3 && top === 'save', `D2: tres tarjetas en mazo, la última arriba (${n}, ${top})`)
        ok(await p.evaluate(() => [...document.querySelectorAll('.card:not(.is-out)')].slice(1).every((c) => c.hasAttribute('inert'))), 'D2: las de debajo no reciben foco plegadas')
        await p.locator('.d2 .card').first().hover(); await p.waitForTimeout(400)
        const fan = await p.evaluate(() => { const cs = [...document.querySelectorAll('.card:not(.is-out)')].map((c) => c.getBoundingClientRect()); return { inert: [...document.querySelectorAll('.card:not(.is-out)')].some((c) => c.hasAttribute('inert')), overlap: cs.some((r, i) => i && r.top < cs[i - 1].bottom - 1) } })
        ok(!fan.inert && !fan.overlap, `D2: al pasar, el mazo se despliega sin solapes (${JSON.stringify(fan)})`)
        await p.locator('.card[data-id=offline] [data-do=hide-card]').click(); await p.waitForTimeout(500)
        ok((await p.locator('.card:not(.is-out)').count()) === 2 && await p.evaluate(() => window.__S.B.conds.has('offline')), 'D2: cerrar una tarjeta la quita de la vista, no del estado')
        ok(await p.locator('.card[data-id=save] .card__bar').count() === 1, 'D2: cada tarjeta lleva su línea de tiempo')
      }
      if (P === 'D3') {
        ok(/No se pudo guardar/.test(await p.locator('.d3__text').innerText()) && /2 más/.test(await p.locator('[data-do=list]').innerText()), 'D3: lo último sustituye y «2 más» lo dice')
        await p.locator('[data-do=pin]').click(); await p.mouse.move(5, 740); await p.locator('#cliente').focus()
        ok((await p.locator('[data-do=pin]').getAttribute('aria-pressed')) === 'true', 'D3: «Fijar» con aria-pressed')
        await p.waitForTimeout(RT + 400)
        ok((await st(p)).visible, 'D3: fijada no se recoge')
        await p.locator('[data-do=pin]').click(); await p.mouse.move(5, 740); await p.locator('#cliente').focus()
        await p.waitForTimeout(RT + 900)
        ok(!(await st(p)).visible, 'D3: sin fijar, se recoge')
        await p.keyboard.press('Alt+F8'); await p.waitForTimeout(400)
        ok(await p.locator('.d3__list .item').count() === 3, 'D3: Alt+F8 abre las tres pendientes')
      }
      await context.close()
    }

    // ---------- 3. Cuenta atrás, resultado, teclado y anuncios ----------
    {
      const { p, context } = await open()
      await p.locator('#s-session').click(); await p.mouse.move(5, 740); await p.locator('#cliente').focus()
      await p.waitForTimeout(RT + 900)
      ok((await st(p)).visible && /^\d+:\d\d$/.test((await p.locator('.isle [role=timer]').first().innerText()).trim()), 'una cuenta atrás se queda (2.2.1) y se ve como m:ss en role=timer')
      await p.evaluate(() => window.__S.B.remove('session'))
      await p.waitForTimeout(700)
      await p.locator('#s-offline').click(); await p.waitForTimeout(200)
      await p.locator('#s-online').click(); await p.mouse.move(5, 740); await p.locator('#cliente').focus()
      await p.waitForTimeout(RT + 1200)
      ok(await p.evaluate(() => !window.__S.B.conds.has('offline')) && !(await st(p)).visible, 'un resultado sin enlace se lee y se va')
      const lv = await p.evaluate(() => window.__live.map((x) => x.text))
      ok(lv.includes('Correcto: Conexión restablecida'), '`resolve` limpia la descripción')
      await p.locator('#save').click(); await p.locator('#cliente').focus(); await p.waitForTimeout(300)
      await p.keyboard.press('Alt+F8'); await p.waitForTimeout(400)
      const a = await st(p)
      ok(a.list && /summary|act|close|hide-card/.test(a.focus), `Alt+F8: lista de lo pendiente con el foco dentro (${a.focus})`)
      await p.keyboard.press('Alt+F8'); await p.waitForTimeout(700)
      ok((await st(p)).focus === 'cliente', 'Alt+F8 dentro: vuelve al campo')
      await p.keyboard.press('Alt+F8'); await p.waitForTimeout(400)
      await p.keyboard.press('Escape'); await p.waitForTimeout(800)
      const b = await st(p)
      ok(!b.visible && b.focus === 'cliente', `Esc: la recoge y devuelve el foco (${b.focus})`)
      const a11y = await p.evaluate(() => ({ lives: document.querySelectorAll('[aria-live],[role=status],[role=alert]').length, regionLive: document.getElementById('region').hasAttribute('aria-live') }))
      ok(a11y.lives === 2 && !a11y.regionLive, `un solo par de canales; la isla no es región viva (${a11y.lives})`)
      const texts = await p.evaluate(() => window.__live.map((x) => x.text))
      ok(texts.filter((t) => /^Error/.test(t)).length === 1, `abrir, cerrar y recoger no anuncian (${texts.length} anuncios)`)
      await context.close()
    }

    // ---------- 4. Contraste sobre tres fondos, claro y oscuro; áreas ----------
    for (const theme of ['', '&theme=dark']) {
      const { p, context } = await open({ q: theme })
      await p.evaluate(() => {
        const B = window.__S.B
        B.set('e', { type: 'error', title: 'Error de prueba', description: 'Descripción.', action: { label: 'Reintentar', onClick () {} } })
        B.set('w', { type: 'warning', title: 'Advertencia de prueba', description: 'Texto.' })
        B.set('i', { type: 'info', title: 'Información de prueba', description: 'Texto.', dismissible: true })
        B.set('s', { type: 'success', title: 'Resultado de prueba', link: { label: 'Ver', href: '#x' } })
        window.__S.openList()
      })
      await p.waitForTimeout(700)
      const m = await p.evaluate(({ P }) => {
        const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
        const rgb = (c) => { cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = c; cv.fillRect(0, 0, 1, 1); const d = cv.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
        const over = (top, bot) => top.slice(0, 3).map((v, i) => v * top[3] + bot[i] * (1 - top[3]))
        const L = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
        const cr = (a, b) => { const x = L(a), y = L(b); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100 }
        const shell = P === 'D2' ? document.querySelector('.card') : document.querySelector(P === 'D1' ? '.d1' : '.d3')
        const cs = getComputedStyle(shell)
        const fill = rgb(cs.backgroundColor)
        const ringM = cs.boxShadow.match(/rgba?\([^)]*\)|#[0-9a-f]+/i)
        const ring = P === 'D3' ? rgb(cs.borderBottomColor) : ringM ? rgb(ringM[0]) : fill
        const bgs = { pagina: rgb(getComputedStyle(document.body).backgroundColor), superficie: rgb(getComputedStyle(document.getElementById('form-card')).backgroundColor), zona: rgb(getComputedStyle(document.getElementById('hdr')).backgroundColor) }
        const edge = Object.fromEntries(Object.entries(bgs).map(([k, b]) => [k, Math.max(cr(fill, b), cr(ring, b))]))
        const item = document.querySelector('.isle .item, .isle .card')
        const tile = over(rgb(getComputedStyle(item).backgroundColor), fill)
        const title = cr(rgb(getComputedStyle(document.querySelector('.isle .item__title, .isle .card__title')).color), tile)
        const desc = cr(rgb(getComputedStyle(document.querySelector('.isle .item__desc, .isle .card__desc')).color), tile)
        const btn = cr(rgb(getComputedStyle(document.querySelector('.isle [data-do=act]')).borderTopColor), tile)
        const icons = Object.fromEntries(['error', 'warning', 'info', 'success'].map((t) => { const b = document.querySelector(`.isle .badge[data-type=${t}]`) || document.querySelector(`.isle [data-type=${t}] .badge`); return [t, b ? cr(rgb(getComputedStyle(b).color), rgb(getComputedStyle(b).backgroundColor)) : 0] }))
        const small = [...document.querySelectorAll('.isle button, .isle a')].filter((b) => b.getClientRects().length && !b.closest('[inert]')).map((b) => b.getBoundingClientRect()).filter((r) => r.width < 24 || r.height < 24).length
        return { edge, title, desc, btn, icons, small }
      }, { P })
      const tag = theme ? 'oscuro' : 'claro'
      ok(m.title >= 4.5 && m.desc >= 4.5, `${tag}: texto ≥ 4,5 (título ${m.title}, descripción ${m.desc})`)
      ok(Object.values(m.icons).every((v) => v >= 3) && m.btn >= 3, `${tag}: insignias y bordes de control ≥ 3 (${JSON.stringify(m.icons)}, botón ${m.btn})`)
      ok(Object.values(m.edge).every((v) => v >= 3), `${tag}: la isla se delimita ≥ 3 frente a página, superficie y zona de marca (${JSON.stringify(m.edge)})`)
      ok(m.small === 0, `${tag}: controles ≥ 24×24 (${m.small} pequeños)`)
      await context.close()
    }

    // ---------- 5. 320 px y 640 px (texto al 200 %) ----------
    for (const vw of [320, 640]) {
      const { p, context } = await open({ vw, vh: 700 })
      await p.locator('#save').click(); await p.mouse.move(2, 690); await p.waitForTimeout(800)
      const line = await p.evaluate((sel) => { const el = document.querySelector(sel === '.d2' ? '.d2 .card' : sel); const r = el.getBoundingClientRect(); return { l: r.left, r: r.right, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth } }, sel)
      await p.evaluate(() => window.__S.openList()); await p.waitForTimeout(600)
      const lst = await p.evaluate((sel) => { const el = document.querySelector(sel === '.d2' ? '.d2 .card' : sel); const r = el.getBoundingClientRect(); return { l: r.left, r: r.right, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth } }, sel)
      ok(line.sw <= line.cw && line.l >= 0 && line.r <= vw && lst.sw <= lst.cw && lst.l >= 0 && lst.r <= vw, `${vw}px: cabe sin desplazamiento horizontal (${JSON.stringify(line)} · ${JSON.stringify(lst)})`)
      await context.close()
    }

    // ---------- 6. Movimiento reducido ----------
    {
      const { p, context } = await open({ reducedMotion: 'reduce' })
      await p.evaluate(() => {
        window.__moving = []
        const t0 = performance.now()
        const mo = () => {
          for (const a of document.getAnimations()) {
            const k = a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : []
            const props = new Set(k.flatMap((f) => Object.keys(f)).filter((x) => !['offset', 'easing', 'composite', 'computedOffset'].includes(x)))
            if (a.transitionProperty) props.add(a.transitionProperty)
            if ([...props].some((x) => /transform|translate|scale|rotate|clip|inline-size|block-size|width|height/i.test(x))) window.__moving.push(a.animationName || a.transitionProperty)
          }
          if (performance.now() - t0 < RT + 1500) requestAnimationFrame(mo)
        }
        const RT = 2600
        requestAnimationFrame(mo)
      })
      await p.locator('#s-three').click(); await p.mouse.move(5, 740); await p.locator('#cliente').focus()
      await p.waitForTimeout(RT + 1600)
      const mv = await p.evaluate(() => [...new Set(window.__moving)])
      ok(mv.length === 0, `reducido: nada se mueve ni cambia de tamaño animado (${mv.join(', ')})`)
      await context.close()
    }

    total.pass += pass; total.fail += fails.length
    console.log(`${engine} ${P}: ${pass}/${pass + fails.length}${fails.length ? '\n   - ' + fails.join('\n   - ') : ''}`)
  }
  await browser.close()
}
server.close()
console.log(`\nTotal: ${total.pass}/${total.pass + total.fail}`)
process.exitCode = total.fail ? 1 : 0
