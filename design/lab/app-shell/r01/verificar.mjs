// Verificación del prototipo del chasis de aplicación, la pila y la sección (kiwi r01): base y conceptos A, B y C.
// Ejecutar desde la raíz: node design/lab/app-shell/r01/verificar.mjs
//   Puerto 4211 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  PARTS=base,budget,A,B,C,stack  VERBOSE=1
// Requiere packages/vue/dist (npm run build) y node_modules/vue. Solo lee; no toca packages/.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4211)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(path))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/app-shell/r01/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'base,budget,A,B,C,stack').split(',')
const V = !!process.env.VERBOSE
const R = []
const INFO = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }
const note = (eng, part, name, value) => { INFO.push({ eng, part, name, value }); console.log(`medida ${eng} ${part} · ${name} · ${value}`) }
const near = (a, b, t = 1.5) => Math.abs(a - b) <= t

async function open (b, qs, opts = {}) {
  const { vw = 1440, vh = 900, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/fonts\.css|404/.test(m.text())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  p.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/fonts.css')) errs.push(r.status() + ' ' + r.url()) })
  await p.goto(BASE + qs)
  await p.waitForFunction(() => window.__as && window.__as.ready)
  await p.evaluate(() => document.fonts.ready)
  await settle(p, 400)
  p.__errs = errs
  p.__ctx = context
  return p
}
const settle = (p, ms = 60) => p.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms)
const rect = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height } }, sel)
const overflowX = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const css = (p, sel, name) => p.evaluate(([sel, name]) => getComputedStyle(document.querySelector(sel)).getPropertyValue(name).trim(), [sel, name])
const px = async (p, sel, name) => parseFloat(await css(p, sel, name))
const scrollY = (p, y) => p.evaluate((y) => new Promise((r) => { window.scrollTo(0, y); requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 120))) }), y)
const close = async (p, eng, part, label) => { rec(eng, part, `consola limpia (${label})`, p.__errs.length === 0, p.__errs.slice(0, 2).join(' | ')); await p.__ctx.close() }
// Muestra cuadro a cuadro el borde inicial de la región principal y el ancho del sidebar durante `ms` tras un clic en contraer/expandir
const sampleToggle = (p, ms = 450) => p.evaluate((ms) => new Promise((resolve) => {
  const main = document.getElementById('as-main')
  const sb = document.getElementById('sb')
  const out = []
  const t0 = performance.now()
  const rtl = document.documentElement.dir === 'rtl'
  const edge = () => { const r = main.getBoundingClientRect(); return Math.round(rtl ? innerWidth - r.right : r.left) }
  document.querySelector('#sb .g-sidebar__toggle').click()
  const tick = () => {
    const t = performance.now() - t0
    out.push({ t: Math.round(t), main: edge(), sb: Math.round(sb.getBoundingClientRect().width) })
    if (t < ms) requestAnimationFrame(tick); else resolve(out)
  }
  requestAnimationFrame(tick)
}), ms)

for (const eng of ENGINES) {
  const b = await pw[eng].launch()

  // ---------------- Base ----------------
  if (PARTS.includes('base')) {
    let p = await open(b, '?c=base')
    const snap = await p.locator('body').ariaSnapshot()
    rec(eng, 'base', 'landmarks: banner, navigation, main, contentinfo', /- banner/.test(snap) && /- navigation "Principal"/.test(snap) && /- main/.test(snap) && /- contentinfo/.test(snap), snap.split('\n').filter((l) => /banner|navigation|main|contentinfo|region/.test(l)).join(' ; '))
    rec(eng, 'base', 'un solo main', await p.evaluate(() => document.querySelectorAll('main').length === 1))
    rec(eng, 'base', 'GSidebar es hijo directo del chasis (su auto mide el chasis)', await p.evaluate(() => document.getElementById('sb').parentElement.classList.contains('as')))
    // Enlace de salto
    // WebKit (Safari por defecto) no lleva el Tab a los enlaces: Opción+Tab (ver S7)
    await p.keyboard.press(eng === 'webkit' ? 'Alt+Tab' : 'Tab')
    const sk = await p.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return { cls: a.className, top: r.top, bottom: r.bottom } })
    rec(eng, 'base', 'el primer Tab llega al enlace de salto, visible', sk.cls.includes('as__skip') && sk.top >= 0 && sk.bottom <= 900, JSON.stringify(sk))
    await p.keyboard.press('Enter')
    await settle(p)
    rec(eng, 'base', 'Intro: el foco va a main', await p.evaluate(() => document.activeElement && document.activeElement.id === 'as-main'))
    // Reserva y cabecera
    const sb = await rect(p, '#sb'), mn = await rect(p, '#as-main'), hd = await rect(p, '.as__header')
    rec(eng, 'base', 'expandida: la página empieza en --g-sidebar-width (264)', near(mn.left, 264) && near(hd.left, 264) && near(sb.width, 264), `${mn.left}`)
    rec(eng, 'base', 'cabecera de contrato: 56 px', near(hd.height, 56), `${hd.height}`)
    rec(eng, 'base', '--g-page-header-top = 56 (publicado por el chasis)', near(await px(p, '#ph', '--g-page-header-top'), 56))
    rec(eng, 'base', '--g-accordion-sticky-top = 56 + 48', near(await px(p, '.as', '--g-accordion-sticky-top'), 104))
    rec(eng, 'base', 'scroll-padding de html = 56 + 48', near(await px(p, 'html', 'scroll-padding-block-start'), 104), await css(p, 'html', 'scroll-padding-block-start'))
    rec(eng, 'base', 'registro de bordes: arriba 56, abajo 0', await p.evaluate(() => window.__as.pub.top === 56 && window.__as.pub.bottom === 0), await p.evaluate(() => JSON.stringify(window.__as.pub)))
    await scrollY(p, 1500)
    const sb2 = await rect(p, '#sb'), hd2 = await rect(p, '.as__header'), base2 = await rect(p, '.g-page-header__base')
    rec(eng, 'base', 'al desplazar: sidebar fijo arriba (0) y del alto del visor', near(sb2.top, 0) && near(sb2.height, 900), `${sb2.top}/${sb2.height}`)
    rec(eng, 'base', 'al desplazar: cabecera pegada en 0', near(hd2.top, 0))
    rec(eng, 'base', 'zócalo de GPageHeader pegado justo bajo la cabecera (56)', base2 && near(base2.top, 56) && await p.evaluate(() => document.getElementById('ph').classList.contains('is-stuck')), base2 && `${base2.top}`)
    await p.evaluate(() => document.getElementById('far-btn').scrollIntoView({ block: 'start' }))
    await settle(p)
    const fb = await rect(p, '#far-btn')
    rec(eng, 'base', 'scrollIntoView: nada queda bajo cabecera + zócalo (2.4.11)', fb.top >= 104 - 1, `${fb.top}`)
    await scrollY(p, 0)
    await p.evaluate(() => { const b = document.getElementById('far-btn'); b.focus() })
    await settle(p, 150)
    const fb2 = await rect(p, '#far-btn')
    rec(eng, 'base', 'focus(): el destino no queda bajo lo pegado', fb2.top >= 104 - 1 && fb2.bottom <= 900, `${fb2.top}`)
    rec(eng, 'base', 'sin desplazamiento horizontal (1440)', !(await overflowX(p)))
    // S1/S5: enfocar algo pegado o fijo no desplaza la página (Chromium y WebKit lo hacían con el scroll-padding)
    for (const sel of ['#sb .g-sidebar__toggle', '#sb .g-sidebar__link', '#hdr-bell', '#ph-pub']) {
      await scrollY(p, 1200)
      await p.evaluate((s) => document.querySelector(s).focus(), sel)
      await settle(p, 200)
      const y = await p.evaluate(() => Math.round(window.scrollY))
      rec(eng, 'base', `enfocar ${sel} con la página desplazada no la mueve (S1/S5)`, near(y, 1200, 2), `${y}`)
    }
    await scrollY(p, 0)
    // Δ0 al cambiar de formato (base: la pista sigue al sidebar cuadro a cuadro, el patrón genérico)
    await p.evaluate(() => { const e = document.getElementById('p2'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 300) })
    await settle(p, 150)
    const a0 = (await rect(p, '#p2')).top
    await p.focus('#sb .g-sidebar__toggle')
    const s = await sampleToggle(p)
    const distinct = new Set(s.map((x) => x.main)).size
    const a1 = (await rect(p, '#p2')).top
    rec(eng, 'base', 'contraer: la página cambia de ancho una vez, al empezar (pista de tokens)', distinct <= 2, `${distinct}`)
    rec(eng, 'base', 'contraer: termina en el riel (64)', near(s.at(-1).main, 64), `${s.at(-1).main}`)
    rec(eng, 'base', 'contraer: el foco sigue en el botón de contraer', await p.evaluate(() => document.activeElement.classList.contains('g-sidebar__toggle')))
    note(eng, 'base', 'contraer: Δ del párrafo que se leía (px)', Math.round(a1 - a0))
    await settle(p, 300)
    const se = await sampleToggle(p, 500)
    const jump = se.find((x) => near(x.main, 264))
    rec(eng, 'base', 'expandir (base): la página salta al empezar y el sidebar crece en un hueco vacío', jump && jump.t <= 60, jump && `${jump.t} ms`)
    await close(p, eng, 'base', 'expandida')

    // Riel superpuesto
    p = await open(b, '?c=base&mode=rail&overlay=1')
    rec(eng, 'base', 'riel: la página empieza en --g-sidebar-rail (64)', near((await rect(p, '#as-main')).left, 64))
    await p.click('#sb .g-sidebar__toggle')
    await settle(p, 400)
    await scrollY(p, 1200)
    const ov = await rect(p, '#sb'), ovm = await rect(p, '#as-main')
    rec(eng, 'base', 'superpuesto: se expande sobre la página (la página sigue en 64)', near(ovm.left, 64) && ov.width > 200, `${ov.width}/${ovm.left}`)
    rec(eng, 'base', 'superpuesto en una página que desplaza: sigue arriba con el alto del visor (S2)', near(ov.top, 0) && near(ov.height, 900), `${ov.top}/${ov.height}`)
    await close(p, eng, 'base', 'superpuesto')

    // Flotante
    p = await open(b, '?c=base&variant=floating')
    rec(eng, 'base', 'flotante: la pista incluye el margen (264 + 2 × 12)', near((await rect(p, '#as-main')).left, 288), `${(await rect(p, '#as-main')).left}`)
    await close(p, eng, 'base', 'flotante')

    // Navbar (teléfono)
    p = await open(b, '?c=base', { vw: 390, vh: 800 })
    rec(eng, 'base', '390: formato navbar', (await css(p, '#sb', 'position')) === 'fixed' || await p.evaluate(() => !!document.querySelector('.g-sidebar--mode-navbar')))
    rec(eng, 'base', 'navbar: la página empieza en 0', near((await rect(p, '#as-main')).left, 0))
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await settle(p, 150)
    const ft = await rect(p, '.as__footer'), bar = await rect(p, '.g-sidebar__bar')
    rec(eng, 'base', 'navbar: el pie termina por encima de la barra (reserva --g-sidebar-bar)', ft.bottom <= bar.top + 1, `${ft.bottom} / ${bar.top}`)
    rec(eng, 'base', 'registro de bordes: abajo = --g-sidebar-bar (68)', await p.evaluate(() => window.__as.pub.bottom === 68), await p.evaluate(() => JSON.stringify(window.__as.pub)))
    rec(eng, 'base', 'sin desplazamiento horizontal (390)', !(await overflowX(p)))
    await close(p, eng, 'base', 'navbar')

    // Drawer
    p = await open(b, '?c=base&mode=drawer')
    rec(eng, 'base', 'drawer: sin reserva (página en 0)', near((await rect(p, '#as-main')).left, 0) && near((await rect(p, '.as__header')).left, 0))
    await p.focus('#menu-btn')
    await p.keyboard.press('Enter') // con teclado: WebKit no enfoca un botón al hacer clic (#307), ver S8
    await settle(p, 400)
    rec(eng, 'base', 'drawer: el botón de la cabecera lo abre (dialog modal)', await p.evaluate(() => !!document.querySelector('dialog.g-sidebar__drawer[open]')))
    await p.keyboard.press('Escape')
    await settle(p, 400)
    rec(eng, 'base', 'drawer: Esc cierra y devuelve el foco al botón', await p.evaluate(() => document.activeElement && document.activeElement.id === 'menu-btn'))
    await close(p, eng, 'base', 'drawer')

    // RTL
    p = await open(b, '?c=base&dir=rtl')
    const rs = await rect(p, '#sb'), rm = await rect(p, '#as-main')
    rec(eng, 'base', 'RTL: sidebar al final del visor y página a su izquierda', near(rs.right, 1440) && near(rm.right, 1176), `${rs.right}/${rm.right}`)
    await close(p, eng, 'base', 'rtl')

    // Zona de marca
    p = await open(b, '?c=base&zone=header')
    const zb = await css(p, '.as__header', 'background-color')
    rec(eng, 'base', 'zona de marca en la cabecera: data-g-zone y fondo de marca', (await p.evaluate(() => document.querySelector('.as__header').dataset.gZone)) === 'brand' && !/255, 255, 255/.test(zb), zb)
    await close(p, eng, 'base', 'zona cabecera')
    p = await open(b, '?c=base&zone=side')
    rec(eng, 'base', 'zona de marca en el sidebar (atributo en su raíz)', await p.evaluate(() => document.getElementById('sb').dataset.gZone === 'brand'))
    await close(p, eng, 'base', 'zona sidebar')

    // Cabecera más alta que el contrato (entrada pública)
    p = await open(b, '?c=base')
    await p.addStyleTag({ content: ':root { --g-app-shell-header: 72px }' })
    await settle(p, 150)
    rec(eng, 'base', '--g-app-shell-header 72: cabecera 72, page-header-top 72, scroll-padding 120', near((await rect(p, '.as__header')).height, 72) && near(await px(p, '#ph', '--g-page-header-top'), 72) && near(await px(p, 'html', 'scroll-padding-block-start'), 120))
    await close(p, eng, 'base', 'cabecera 72')

    if (eng === 'chromium') {
      p = await open(b, '?c=base', { forcedColors: 'active' })
      rec(eng, 'base', 'forced-colors: la cabecera conserva un borde real', (await px(p, '.as__header', 'border-block-end-width')) >= 1 && (await css(p, '.as__header', 'border-block-end-style')) === 'solid')
      await close(p, eng, 'base', 'forced-colors')
    }
  }

  // ---------------- Presupuesto del cuarto (zoom 400 %, teléfono apaisado) ----------------
  if (PARTS.includes('budget')) {
    for (const [vw, vh, pinned] of [[1440, 900, true], [320, 256, false], [800, 400, false], [800, 430, true]]) {
      const p = await open(b, '?c=base', { vw, vh })
      const top = await px(p, '.as', '--g-app-shell-top')
      rec(eng, 'budget', `${vw}×${vh}: cabecera ${pinned ? 'pegada' : 'despegada'} (56 + 48 ${pinned ? '≤' : '>'} 25 %)`, pinned ? near(top, 56) : near(top, 0), `${top}`)
      await scrollY(p, 700)
      const hd = await rect(p, '.as__header')
      rec(eng, 'budget', `${vw}×${vh}: tras desplazar la cabecera ${pinned ? 'sigue' : 'se fue'}`, pinned ? near(hd.top, 0) : hd.bottom <= 0.5, `${hd.top}/${hd.bottom}`)
      rec(eng, 'budget', `${vw}×${vh}: scroll-padding = ${pinned ? '104' : '48 (solo el zócalo)'}`, near(await px(p, 'html', 'scroll-padding-block-start'), pinned ? 104 : 48), await css(p, 'html', 'scroll-padding-block-start'))
      rec(eng, 'budget', `${vw}×${vh}: sin desplazamiento horizontal`, !(await overflowX(p)))
      await close(p, eng, 'budget', `${vw}×${vh}`)
    }
  }

  // ---------------- A · Cortina ----------------
  if (PARTS.includes('A')) {
    let p = await open(b, '?c=A')
    await p.evaluate(() => { const e = document.getElementById('p2'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 300) })
    await settle(p, 150)
    let a0 = (await rect(p, '#p2')).top
    await p.focus('#sb .g-sidebar__toggle')
    let s = await sampleToggle(p)
    let d = new Set(s.map((x) => x.main))
    rec(eng, 'A', 'contraer: la página cambia de ancho UNA vez (dos posiciones)', d.size <= 2 && near(s.at(-1).main, 64), [...d].join(','))
    const firstAt = s.find((x) => near(x.main, 64))
    rec(eng, 'A', 'contraer: el cambio es al empezar (el riel se encoge sobre la página ya ensanchada)', firstAt && firstAt.t <= 60, firstAt && `${firstAt.t} ms`)
    let a1 = (await rect(p, '#p2')).top
    note(eng, 'A', 'contraer: Δ del párrafo que se leía (px)', Math.round(a1 - a0))
    rec(eng, 'A', 'contraer: el foco sigue en el botón', await p.evaluate(() => document.activeElement.classList.contains('g-sidebar__toggle')))
    await settle(p, 300)
    a0 = (await rect(p, '#p2')).top
    s = await sampleToggle(p, 500)
    d = new Set(s.map((x) => x.main))
    rec(eng, 'A', 'expandir: la página cambia de ancho UNA vez', d.size <= 2 && near(s.at(-1).main, 264), [...d].join(','))
    const mid = s.find((x) => x.t >= 90 && x.t <= 160)
    rec(eng, 'A', 'expandir: a mitad, el sidebar crece SOBRE la página (página aún en 64)', mid && near(mid.main, 64) && mid.sb > 64, mid && JSON.stringify(mid))
    const at = s.find((x) => near(x.main, 264))
    rec(eng, 'A', 'expandir: la página se aparta cuando el sidebar ya la cubre (≥ duración lenta)', at && at.t >= 200, at && `${at.t} ms`)
    a1 = (await rect(p, '#p2')).top
    note(eng, 'A', 'expandir: Δ del párrafo que se leía (px)', Math.round(a1 - a0))
    // Interrumpir: expandir y contraer antes de que la página se aparte
    await settle(p, 300)
    await p.evaluate(() => document.querySelector('#sb .g-sidebar__toggle').click()) // a riel
    await settle(p, 400)
    const it = await p.evaluate(() => new Promise((r) => { const t = document.querySelector('#sb .g-sidebar__toggle'); t.click(); setTimeout(() => { t.click(); setTimeout(() => r(Math.round(document.getElementById('as-main').getBoundingClientRect().left)), 450) }, 80) }))
    rec(eng, 'A', 'interrumpible: expandir y contraer a los 80 ms deja la página en el riel sin haber saltado', near(it, 64), `${it}`)
    await close(p, eng, 'A', 'cortina')
    p = await open(b, '?c=A', { reducedMotion: 'reduce' })
    rec(eng, 'A', 'movimiento reducido: sin espera (la página y el sidebar cambian a la vez)', (await css(p, '.as', 'transition-delay')).split(',').every((x) => parseFloat(x) === 0) || (await css(p, '.as', 'transition-property')) === 'all' && (await css(p, '.as', 'transition-duration')) === '0s')
    await close(p, eng, 'A', 'reducido')
  }

  // ---------------- B · Relevo de franja ----------------
  if (PARTS.includes('B')) {
    let p = await open(b, '?c=B')
    for (let y = 0; y <= 1600; y += 200) await scrollY(p, y)
    await settle(p, 300)
    let hd = await rect(p, '.as__header'), base = await rect(p, '.g-page-header__base')
    rec(eng, 'B', 'al bajar: la cabecera cede (fuera del visor)', await p.evaluate(() => window.__as.yielded) && hd.bottom <= 1, `${hd.bottom}`)
    rec(eng, 'B', 'al bajar: el zócalo toma el borde (0)', base && near(base.top, 0), base && `${base.top}`)
    note(eng, 'B', 'GPageHeader sigue is-stuck tras el relevo', await p.evaluate(() => document.getElementById('ph').classList.contains('is-stuck')))
    rec(eng, 'B', 'nunca sin franja: lo pegado arriba suma 48 (no 104)', near(await px(p, '.as', '--g-accordion-sticky-top'), 48))
    await scrollY(p, 1520)
    await scrollY(p, 1440)
    await settle(p, 300)
    hd = await rect(p, '.as__header'); base = await rect(p, '.g-page-header__base')
    rec(eng, 'B', 'al subir: vuelve la cabecera y el zócalo baja a 56', !(await p.evaluate(() => window.__as.yielded)) && near(hd.top, 0) && base && near(base.top, 56), `${hd.top}/${base && base.top}`)
    for (let y = 1440; y <= 2200; y += 200) await scrollY(p, y)
    await settle(p, 300)
    await p.evaluate(() => document.getElementById('hdr-bell').focus())
    await settle(p, 300)
    hd = await rect(p, '.as__header')
    rec(eng, 'B', 'el foco en la cabecera la devuelve (2.4.11)', !(await p.evaluate(() => window.__as.yielded)) && near(hd.top, 0), `${hd.top}`)
    await close(p, eng, 'B', 'relevo')
    p = await open(b, '?c=B', { reducedMotion: 'reduce' })
    rec(eng, 'B', 'movimiento reducido: la cabecera cambia sin deslizarse', (await css(p, '.as__header', 'transition-duration')).split(',').every((x) => parseFloat(x) === 0))
    await close(p, eng, 'B', 'reducido')
  }

  // ---------------- C · Escenario ----------------
  if (PARTS.includes('C')) {
    let p = await open(b, '?c=C')
    const fr = await rect(p, '.as__frame'), sb = await rect(p, '#sb')
    rec(eng, 'C', 'la hoja se separa del marco (radio y margen al final)', fr.left >= sb.right - 0.5 && near(1440 - fr.right, 8) && (await px(p, '.as__frame', 'border-start-start-radius')) > 0, `${fr.left}/${fr.right}`)
    rec(eng, 'C', 'la hoja desplaza (no el documento)', await p.evaluate(() => { const f = document.querySelector('.as__frame'); return f.scrollHeight > f.clientHeight && document.documentElement.scrollHeight <= document.documentElement.clientHeight + 1 }))
    rec(eng, 'C', 'dentro de la hoja: --g-page-header-top 0', near(await px(p, '#ph', '--g-page-header-top'), 0))
    for (const sel of ['#sb .g-sidebar__toggle', '#hdr-bell', '#ph-pub']) {
      await p.evaluate(() => { document.querySelector('.as__frame').scrollTop = 1200 })
      await settle(p, 150)
      await p.evaluate((s) => document.querySelector(s).focus(), sel)
      await settle(p, 200)
      const y = await p.evaluate(() => Math.round(document.querySelector('.as__frame').scrollTop))
      if (eng === 'webkit' && sel === '#ph-pub') note(eng, 'C', 'enfocar la acción del zócalo con la hoja desplazada (WebKit, S5 en un desplazador interior)', y)
      else rec(eng, 'C', `enfocar ${sel} con la hoja desplazada no la mueve`, near(y, 1200, 2), `${y}`)
    }
    await p.evaluate(() => { document.querySelector('.as__frame').scrollTop = 1500 })
    await settle(p, 200)
    const bs = await rect(p, '.g-page-header__base'), fr2 = await rect(p, '.as__frame')
    rec(eng, 'C', 'el zócalo se pega en el borde de la hoja', bs && near(bs.top, fr2.top + 1, 2), bs && `${bs.top}/${fr2.top}`)
    await p.evaluate(() => { document.querySelector('.as__frame').scrollTop = 0 })
    await settle(p)
    // Teclado sin foco: ¿desplaza?
    await p.mouse.click(1200, 880) // un clic en el borde de la hoja, como haría la persona
    await p.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); document.querySelector('.as__frame').scrollTop = 0 })
    await p.keyboard.press('PageDown')
    await settle(p, 400)
    note(eng, 'C', 'Av Pág sin foco (tras clic en la hoja): scrollTop de la hoja', await p.evaluate(() => document.querySelector('.as__frame').scrollTop))
    await close(p, eng, 'C', 'escenario')
    p = await open(b, '?c=C')
    await p.keyboard.press('PageDown')
    await settle(p, 400)
    note(eng, 'C', 'Av Pág al cargar, sin foco ni clic: scrollTop de la hoja', await p.evaluate(() => document.querySelector('.as__frame').scrollTop))
    // Tab desde el salto: ¿la hoja añade una parada?
    await p.keyboard.press('Tab')
    const stops = await p.evaluate(async () => [])
    const seq = []
    for (let i = 0; i < 30; i++) {
      await p.keyboard.press('Tab')
      const d = await p.evaluate(() => { const a = document.activeElement; return a ? (a.id || a.className || a.tagName) : '' })
      seq.push(String(d).slice(0, 24))
      if (d === 'ph-pub') break
    }
    rec(eng, 'C', 'Tab: la hoja desplazable no añade parada (tabindex=-1, #570)', !seq.some((x) => x.includes('as__frame')), seq.join(' › '))
    void stops
    await p.evaluate(() => { const m = document.getElementById('as-main'); m.focus() })
    await p.keyboard.press('PageDown')
    await settle(p, 400)
    rec(eng, 'C', 'tras el enlace de salto (foco en main), Av Pág desplaza la hoja', await p.evaluate(() => document.querySelector('.as__frame').scrollTop > 100))
    await close(p, eng, 'C', 'teclado')
    p = await open(b, '?c=base')
    await p.keyboard.press('PageDown')
    await settle(p, 400)
    const docY = await p.evaluate(() => window.scrollY)
    rec(eng, 'C', 'referencia base (documento): Av Pág al cargar desplaza la página', docY > 100, `${docY}`)
    await close(p, eng, 'C', 'referencia base')
    p = await open(b, '?c=C', { vw: 390, vh: 800 })
    rec(eng, 'C', '390 (navbar): la hoja se funde y desplaza el documento', await p.evaluate(() => document.documentElement.scrollHeight > document.documentElement.clientHeight + 100 && getComputedStyle(document.querySelector('.as__frame')).overflowY !== 'auto'))
    await close(p, eng, 'C', '390')
  }

  // ---------------- GStack y GSection ----------------
  if (PARTS.includes('stack')) {
    let p = await open(b, '?c=base')
    const gap = async (a, z) => { const ra = await rect(p, a), rz = await rect(p, z); return Math.round((rz.top - ra.bottom) * 10) / 10 }
    rec(eng, 'stack', 'gap md = space × 6 (24)', near(await gap('#anchor', '#p2'), 24, 0.6), `${await gap('#anchor', '#p2')}`)
    rec(eng, 'stack', 'gap sm = × 0,5 (12)', near(await gap('#c1', '#c2'), 12, 0.6), `${await gap('#c1', '#c2')}`)
    rec(eng, 'stack', 'gap lg = × 2 (48)', near(await gap('#s1', '#s2'), 48, 0.6), `${await gap('#s1', '#s2')}`)
    const dv = await gap('#d1', '#d2')
    const dp = await px(p, '#d2', 'padding-block-start')
    rec(eng, 'stack', 'divided + compact: línea entre hijos y aire × 0,75 a cada lado (18)', near(dv, 18, 0.6) && near(dp, 18, 0.6) && (await px(p, '#d2', 'border-block-start-width')) >= 1 && (await px(p, '#d1', 'border-block-start-width')) === 0, `${dv}/${dp}`)
    rec(eng, 'stack', 'una sola fuente de aire: los márgenes de los p hijos son 0', (await px(p, '#anchor', 'margin-block-end')) === 0)
    const lv = await p.evaluate(() => ['s1', 's1a', 's1b', 's2'].map((id) => document.querySelector(`#${id} > .sec__head h2, #${id} > .sec__head h3, #${id} > .sec__head h4`)?.tagName))
    rec(eng, 'stack', 'nivel automático: h2 › h3 › h4 por anidación', lv.join() === 'H2,H3,H4,H2', lv.join())
    const fs = await p.evaluate(() => ['s1', 's1a', 's1b'].map((id) => parseFloat(getComputedStyle(document.querySelector(`#${id} > .sec__head .sec__title`)).fontSize)))
    rec(eng, 'stack', 'título: 20 › 16 › 14 (nunca < body-sm)', fs.join() === '20,16,14', fs.join())
    const snap = await p.locator('body').ariaSnapshot()
    rec(eng, 'stack', 'landmark solo si se pide: región «Firmantes» sí, «Liberación automática» no', /region "Firmantes"/.test(snap) && !/region "Liberación automática"/.test(snap))
    const t1 = await rect(p, '#s1 > .sec__head .sec__title'), a1 = await rect(p, '#s1-act')
    rec(eng, 'stack', '1440: acciones en la fila del título', a1.top < t1.bottom)
    await close(p, eng, 'stack', '1440')
    p = await open(b, '?c=base', { vw: 320, vh: 640 })
    const t2 = await rect(p, '#s1 > .sec__head .sec__title'), a2 = await rect(p, '#s1-act')
    rec(eng, 'stack', '320: las acciones bajan bajo el título (sin punto de corte)', a2.top >= t2.bottom - 0.5, `${a2.top}/${t2.bottom}`)
    const chips = await p.evaluate(() => [...document.querySelectorAll('#st-h > .lab-chip')].map((c) => Math.round(c.getBoundingClientRect().top)))
    rec(eng, 'stack', '320: la pila en línea se parte en varias filas', new Set(chips).size > 1, chips.join(','))
    rec(eng, 'stack', '320: sin desplazamiento horizontal', !(await overflowX(p)))
    await close(p, eng, 'stack', '320')
  }
  await b.close()
}
server.close()

const by = {}
for (const r of R) { const k = `${r.eng}|${r.part}`; by[k] = by[k] || [0, 0]; by[k][1]++; if (r.ok) by[k][0]++ }
console.log('\nResumen')
for (const [k, [ok, n]] of Object.entries(by)) console.log(`${k.padEnd(20)} ${ok}/${n}`)
const ok = R.filter((r) => r.ok).length
console.log(`\n${ok} de ${R.length} pasan · ${INFO.length} medidas informativas`)
process.exit(ok === R.length ? 0 : 1)
