// Verificación de la ronda r01 «una sola luz» (kiwi). Mide el prototipo (componentes reales de dist/ + hg.js/hg.css).
// Uso: python3 -m http.server 4212 -d <raíz del repo> & ; copiar este archivo a design/lab/theme-playground/ (para que
// resuelva playwright) y ejecutarlo allí: node hg-verificar.mjs [chromium|firefox|webkit|all]. Luego borrar la copia.
import { chromium, firefox, webkit } from 'playwright'

const BASE = 'http://localhost:4212/design/lab/hover-glide/r01/index.html'
const which = process.argv[2] || 'all'
const engines = { chromium, firefox, webkit }
const list = which === 'all' ? Object.keys(engines) : [which]

const out = {}
for (const name of list) {
  const r = out[name] = { pass: 0, fail: 0, fails: [], data: {} }
  const ok = (cond, label, info) => { if (cond) r.pass++; else { r.fail++; r.fails.push(label + (info !== undefined ? ' ' + JSON.stringify(info) : '')) } }
  const browser = await engines[name].launch()

  async function open (q = '', ctxOpts = {}) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 2400 }, ...ctxOpts })
    const p = await ctx.newPage()
    const errs = []
    p.on('pageerror', (e) => errs.push(String(e)))
    p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
    await p.goto(BASE + q)
    await p.waitForSelector('.g-table__row')
    await p.waitForTimeout(500)
    return { p, ctx, errs }
  }
  // Abre «Proyectos» (los hijos son de la lista del padre)
  async function openSub (p) {
    await p.locator('.g-sidebar__parent').first().click()
    await p.mouse.move(5, 5)
    await p.waitForTimeout(400)
  }
  const ownBg = (p) => p.evaluate(() => {
    const bg = (e) => { const c = getComputedStyle(e).backgroundColor; return c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent' }
    const rows = new Set([...document.querySelectorAll('.g-table__row:not(.is-selected) > td')].filter(bg).map((td) => td.parentElement)).size
    const links = [...document.querySelectorAll('.g-sidebar__link')].filter(bg).length
    return rows + links
  })
  // Caja visible de la luz que contiene (x, y) en su lista, o null
  const lightAt = (p, hostSel) => p.evaluate((hostSel) => {
    const hosts = [...document.querySelectorAll(hostSel)].filter((h) => h.classList.contains('has-highlight'))
    return hosts.map((h) => {
      const l = h.querySelector(':scope > .g-sidebar__highlight, :scope > .g-table__highlight')
      const b = l.getBoundingClientRect(); const o = +getComputedStyle(l).opacity
      return { x: b.x, y: b.y, w: b.width, h: b.height, o }
    })
  }, hostSel)

  async function sweep (p, rowsSel, hostSel, xOf, label) {
    const boxes = await p.$$eval(rowsSel, (els) => els.map((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } }))
    const x = xOf(boxes[0])
    const y0 = boxes[0].y + 2, y1 = boxes[boxes.length - 1].y + boxes[boxes.length - 1].h - 2
    let maxOwn = 0, maxLights = 0, dark = 0, samples = 0
    for (let y = y0; y <= y1; y += 1) {
      await p.mouse.move(x, y)
      if (Math.round(y - y0) % 3 !== 0) continue
      await p.waitForTimeout(16)
      samples++
      maxOwn = Math.max(maxOwn, await ownBg(p))
      const ls = await lightAt(p, hostSel)
      maxLights = Math.max(maxLights, ls.length)
      const inRow = boxes.some((b) => y >= b.y && y < b.y + b.h)
      if (inRow && ls.length === 0) dark++
    }
    return { label, rows: boxes.length, samples, maxOwn, maxLights, dark }
  }

  // ---------- 1 · Hoy (sin la luz): la evidencia del problema ----------
  {
    const { p, ctx } = await open('?glide=0')
    await openSub(p)
    const tb = await sweep(p, '#hg-t1 tbody .g-table__row', '.g-table__scroll', (b) => b.x + b.w * 0.6, 'hoy · tabla')
    const sb = await sweep(p, '.g-sidebar__group:nth-child(2) .g-sidebar__link:not([aria-disabled="true"])', '.g-sidebar__list', (b) => b.x + 40, 'hoy · sidebar')
    r.data.hoy = [tb, sb]
    await ctx.close()
  }

  // ---------- 2 · Propuesta: barrido ----------
  const { p, ctx, errs } = await open('?glide=1')
  await openSub(p)
  const cases = [
    ['#hg-t1 tbody .g-table__row', '#hg-t1 .g-table__scroll', (b) => b.x + b.w * 0.6, 'tabla llana'],
    ['#hg-t2 tbody td.g-table__cell--primary', '#hg-t2 .g-table__scroll', (b) => b.x + b.w / 2, 'A · puerta (columna principal)'],
    ['#hg-t3 tbody .g-table__row', '#hg-t3 .g-table__scroll', (b) => b.x + b.w * 0.6, 'B · despliegue'],
    ['.g-sidebar__group:nth-child(1) .g-sidebar__link', '.g-sidebar__list', (b) => b.x + 40, 'sidebar · grupo 1'],
    ['.g-sidebar__group:nth-child(2) .g-sidebar__item:nth-child(-n+3) .g-sidebar__link', '.g-sidebar__list', (b) => b.x + 40, 'sidebar · grupo 2 con hijos y actual']
  ]
  r.data.propuesta = []
  for (const [rows, host, xOf, label] of cases) {
    const s = await sweep(p, rows, host, xOf, label)
    r.data.propuesta.push(s)
    ok(s.maxOwn === 0, `${label}: 0 filas con fondo propio`, s.maxOwn)
    ok(s.maxLights <= 1, `${label}: como máximo una luz`, s.maxLights)
    ok(s.dark === 0, `${label}: sin apagón dentro de las filas`, s.dark)
  }

  // ---------- 3 · Termina exacto y viaja (cuadros intermedios) ----------
  async function travel (rowsSel, hostSel, i, j, xOf, inset = 0) {
    const boxes = await p.$$eval(rowsSel, (els) => els.map((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } }))
    const a = boxes[i], b = boxes[j]
    await p.mouse.move(xOf(a), a.y + a.h / 2); await p.waitForTimeout(350)
    await p.mouse.move(xOf(b), b.y + b.h / 2)
    const ys = new Set()
    for (let k = 0; k < 14; k++) { const l = (await lightAt(p, hostSel))[0]; if (l) ys.add(Math.round(l.y)); await p.waitForTimeout(16) }
    await p.waitForTimeout(300)
    const l = (await lightAt(p, hostSel))[0]
    const exact = l && Math.abs(l.y - (b.y + inset)) <= 1 && Math.abs(l.h - (b.h - 2 * inset)) <= 1 && Math.abs(l.x - b.x) <= 1 && Math.abs(l.w - b.w) <= 1
    return { frames: ys.size, exact, l, b }
  }
  const half = 1 // la mitad del hueco de 2px que la luz del sidebar recorta por cada lado
  for (const [rows, host, i, j, xOf, inset, label] of [
    ['#hg-t1 tbody .g-table__row', '#hg-t1 .g-table__scroll', 0, 3, (b) => b.x + b.w * 0.6, 0, 'tabla llana'],
    ['#hg-t2 tbody td.g-table__cell--primary', '#hg-t2 .g-table__scroll', 1, 4, (b) => b.x + b.w / 2, 0, 'A · puerta'],
    ['.g-sidebar__group:nth-child(1) .g-sidebar__link', '.g-sidebar__group:nth-child(1) .g-sidebar__list', 0, 3, (b) => b.x + 40, half, 'sidebar']
  ]) {
    const t = await travel(rows, host, i, j, xOf, inset)
    ok(t.frames >= 3, `${label}: viaja con cuadros intermedios`, t.frames)
    ok(t.exact, `${label}: termina exacto sobre el destino`, { l: t.l, b: t.b })
  }

  // ---------- 4 · Reglas ----------
  // Entrar desde fuera: aparece donde aterriza, sin viajar
  {
    await p.mouse.move(5, 5); await p.waitForTimeout(300)
    const b = await p.locator('#hg-t1 tbody .g-table__row').nth(5).boundingBox()
    await p.mouse.move(b.x + b.width * 0.6, b.y + b.height / 2)
    await p.waitForTimeout(40)
    const l = (await lightAt(p, '#hg-t1 .g-table__scroll'))[0]
    ok(l && Math.abs(l.y - b.y) <= 1, 'entrar desde fuera: aparece en su sitio (sin viajar)', { l, b })
  }
  // A · la puerta: fuera de la celda principal no hay luz
  {
    const b = await p.locator('#hg-t2 tbody .g-table__row').nth(2).locator('td').nth(1).boundingBox()
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.waitForTimeout(150)
    ok((await lightAt(p, '#hg-t2 .g-table__scroll')).length === 0, 'A: en otra celda de la fila, ninguna luz (no promete un clic)')
  }
  // Cabecera pegada: no se registra
  {
    const b = await p.locator('#hg-t1 thead th').nth(2).boundingBox()
    await p.mouse.move(b.x + 5, b.y + b.height / 2); await p.waitForTimeout(150)
    ok((await lightAt(p, '#hg-t1 .g-table__scroll')).length === 0, 'cabecera: ninguna luz')
  }
  // Seleccionada: conserva su fondo; la luz queda debajo
  {
    const row = p.locator('#hg-t1 tbody .g-table__row.is-selected')
    const b = await row.boundingBox()
    await p.mouse.move(b.x + b.width * 0.6, b.y + b.height / 2); await p.waitForTimeout(250)
    const bg = await row.locator('td').nth(1).evaluate((td) => getComputedStyle(td).backgroundColor)
    ok(bg !== 'rgba(0, 0, 0, 0)', 'seleccionada: conserva su fondo propio (#564)', bg)
  }
  // Deshabilitado: no se posa
  {
    const dis = p.locator('.g-sidebar__link[aria-disabled="true"]')
    const b = await dis.boundingBox()
    await p.mouse.move(b.x + 40, b.y + b.height / 2); await p.waitForTimeout(200)
    const lit = await dis.evaluate((a) => a.closest('.g-sidebar__list').classList.contains('has-highlight'))
    ok(!lit, 'deshabilitado: la luz no se posa')
  }
  // Actual: la luz pasa por él y el asiento no cambia
  {
    const cur = p.locator('.g-sidebar__link[aria-current="page"]')
    const seat0 = await cur.locator('.g-sidebar__icon').evaluate((e) => getComputedStyle(e, '::before').backgroundColor + '|' + getComputedStyle(e, '::after').backgroundColor)
    const b = await cur.boundingBox()
    await p.mouse.move(b.x + 40, b.y + b.height / 2); await p.waitForTimeout(250)
    const lit = await cur.evaluate((a) => a.closest('.g-sidebar__list').classList.contains('has-highlight'))
    const seat1 = await cur.locator('.g-sidebar__icon').evaluate((e) => getComputedStyle(e, '::before').backgroundColor + '|' + getComputedStyle(e, '::after').backgroundColor)
    ok(lit, 'actual: la luz pasa por el item actual (sin apagón)')
    ok(seat0 === seat1, 'actual: el asiento no cambia con la luz', [seat0, seat1])
  }
  // Grupos: entre dos grupos (título) la luz se apaga
  {
    const t = await p.locator('.g-sidebar__group-title').nth(1).boundingBox()
    await p.mouse.move(t.x + 40, t.y + t.height / 2); await p.waitForTimeout(150)
    ok((await lightAt(p, '.g-sidebar__list')).length === 0, 'título de grupo: ninguna luz (otra lista)')
  }
  // El puntero no mueve el foco
  {
    await p.locator('.hg-switch a').first().focus()
    const before = await p.evaluate(() => document.activeElement.textContent)
    await sweep(p, '.g-sidebar__group:nth-child(1) .g-sidebar__link', '.g-sidebar__list', (b) => b.x + 40, 'foco')
    await sweep(p, '#hg-t3 tbody .g-table__row', '#hg-t3 .g-table__scroll', (b) => b.x + b.w * 0.6, 'foco')
    const after = await p.evaluate(() => document.activeElement.textContent)
    ok(before === after, 'el puntero no mueve el foco (sidebar y tabla)', [before, after])
  }
  // Con el botón pulsado la luz no se mueve
  {
    const rows = p.locator('#hg-t1 tbody .g-table__row')
    const a = await rows.nth(1).boundingBox(), b = await rows.nth(4).boundingBox()
    await p.mouse.move(a.x + a.width * 0.6, a.y + a.height / 2); await p.waitForTimeout(250)
    await p.mouse.down()
    await p.mouse.move(b.x + b.width * 0.6, b.y + b.height / 2, { steps: 6 }); await p.waitForTimeout(250)
    const l = (await lightAt(p, '#hg-t1 .g-table__scroll'))[0]
    await p.mouse.up(); await p.waitForTimeout(300)
    const l2 = (await lightAt(p, '#hg-t1 .g-table__scroll'))[0]
    ok(l && Math.abs(l.y - a.y) <= 1, 'pulsado: la luz se queda en lo pulsado', { l, a })
    ok(l2 && Math.abs(l2.y - b.y) <= 1, 'al soltar: va a la fila bajo el puntero', { l2, b })
  }
  // Desplazar con el puntero quieto: la luz sigue a lo que queda bajo el puntero
  {
    await p.setViewportSize({ width: 1280, height: 900 })
    const rows = p.locator('#hg-t1 tbody .g-table__row')
    await rows.nth(4).scrollIntoViewIfNeeded(); await p.waitForTimeout(200)
    const b = await rows.nth(2).boundingBox()
    const x = b.x + b.width * 0.6, y = b.y + b.height / 2
    await p.mouse.move(x, y); await p.waitForTimeout(250)
    await p.evaluate(() => window.scrollBy(0, 53)); await p.waitForTimeout(300)
    const under = await p.evaluate(([x, y]) => { const r = document.elementFromPoint(x, y).closest('tr'); const b = r.getBoundingClientRect(); return { y: b.y, h: b.height } }, [x, y])
    const l = (await lightAt(p, '#hg-t1 .g-table__scroll'))[0]
    ok(l && Math.abs(l.y - under.y) <= 1, 'scroll con el puntero quieto: la luz va a la fila bajo el puntero', { l, under })
    await p.evaluate(() => window.scrollTo(0, 0))
    await p.setViewportSize({ width: 1280, height: 2400 })
  }
  ok(errs.length === 0, 'consola limpia', errs)
  await ctx.close()

  // ---------- 5 · Movimiento reducido, colores forzados, táctil, RTL ----------
  {
    const { p, ctx } = await open('?glide=1', { reducedMotion: 'reduce' })
    const tp = await p.locator('.g-table__highlight').first().evaluate((l) => getComputedStyle(l).transitionProperty)
    ok(!/translate|size/.test(tp), 'reduce: la luz no viaja (solo opacidad)', tp)
    await ctx.close()
  }
  if (name === 'chromium') {
    const { p, ctx } = await open('?glide=1', { forcedColors: 'active' })
    const d = await p.locator('.g-table__highlight').first().evaluate((l) => getComputedStyle(l).display)
    ok(d === 'none', 'forced-colors: la capa se oculta', d)
    await ctx.close()
  }
  if (name !== 'firefox') { // Firefox no admite hasTouch en el contexto
    const { p, ctx } = await open('?glide=1', { hasTouch: true, isMobile: name === 'chromium' })
    const b = await p.locator('#hg-t1 tbody .g-table__row').nth(3).boundingBox()
    await p.touchscreen.tap(b.x + b.width * 0.6, b.y + b.height / 2); await p.waitForTimeout(250)
    ok((await p.locator('.has-highlight').count()) === 0, 'táctil: ninguna luz')
    await ctx.close()
  }
  {
    const { p, ctx } = await open('?glide=1&dir=rtl')
    const rows = p.locator('#hg-t2 tbody td.g-table__cell--primary')
    const b = await rows.nth(2).boundingBox()
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.waitForTimeout(350)
    const l = (await lightAt(p, '#hg-t2 .g-table__scroll'))[0]
    ok(l && Math.abs(l.x - b.x) <= 1 && Math.abs(l.w - b.width) <= 1, 'RTL: la luz de la puerta cae sobre su celda', { l, b })
    const s = await p.locator('.g-sidebar__group:nth-child(1) .g-sidebar__link').nth(1).boundingBox()
    await p.mouse.move(s.x + s.width - 40, s.y + s.height / 2); await p.waitForTimeout(350)
    const ls = (await lightAt(p, '.g-sidebar__list'))[0]
    ok(ls && Math.abs(ls.x - s.x) <= 1 && Math.abs(ls.w - s.width) <= 1, 'RTL: la luz del sidebar cae sobre su fila', { ls, s })
    await ctx.close()
  }
  await browser.close()
}
for (const [n, r] of Object.entries(out)) {
  console.log(`\n${n}: ${r.pass}/${r.pass + r.fail}`)
  console.log(JSON.stringify(r.data))
  r.fails.forEach((f) => console.log('  FALLA ' + f))
}
