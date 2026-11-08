// Verificación del prototipo de GNavBar r01 (kiwi) dentro del marco calcado, y paridad con el sitio anterior.
// Ejecutar desde la raíz: node design/lab/navbar/r01/verificar.mjs
//   Puerto 4238 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  SHOTS=0 (sin capturas)  VERBOSE=1
// Requiere packages/vue/dist y node_modules/vue. Lee la referencia de design/lab/sitio/referencia/medidas.json.
// Escribe proto-*.png y paridad.json en esta carpeta. No toca nada más.
import http from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const HERE = fileURLToPath(new URL('./', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4238)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/navbar/r01/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const REF = JSON.parse(await readFile(join(ROOT, 'design/lab/sitio/referencia/medidas.json'), 'utf8'))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const SHOTS = process.env.SHOTS !== '0'
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }
const PAR = []

const ratioFn = `window.__ratio = (a, b) => { const parse = (c) => { const x = document.createElement('canvas').getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0,0,1,1); const d = x.getImageData(0,0,1,1).data; return [d[0], d[1], d[2]] }; const lum = (p) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]) }; const A = lum(parse(a)), B = lum(parse(b)); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05) }`

const box = (page, sel) => page.evaluate((s) => { const e = [...document.querySelectorAll(s)].find((x) => x.getClientRects().length); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 } }, sel)

for (const eng of ENGINES) {
  const browser = await pw[eng].launch()
  for (const theme of ['claro', 'oscuro']) {
    for (const p of ['comp', 'guide', 'blocks', 'home']) {
      for (const w of [1280, 1024, 768, 375, 320]) {
        const page = await browser.newPage({ viewport: { width: w, height: w < 768 ? 740 : 800 } })
        const errs = []
        page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()) })
        page.on('pageerror', (e) => errs.push('pageerror ' + e.message))
        const part = `${p}/${theme}/${w}`
        await page.goto(`${BASE}?p=${p}${theme === 'oscuro' ? '&theme=dark' : ''}`, { waitUntil: 'networkidle' })
        await page.evaluate(() => document.fonts.ready)
        await page.waitForTimeout(250)
        rec(eng, part, 'consola limpia', errs.length === 0, errs.slice(0, 2).join(' | '))
        const s = await page.evaluate(() => ({
          sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
          banners: document.querySelectorAll('header.g-app-shell__header').length,
          mains: document.querySelectorAll('main').length,
          navs: [...document.querySelectorAll('nav')].filter((n) => n.getClientRects().length).map((n) => n.getAttribute('aria-label') || (n.getAttribute('aria-labelledby') && document.getElementById(n.getAttribute('aria-labelledby'))?.textContent) || ''),
          current: [...document.querySelectorAll('.nb [aria-current="page"]')].filter((a) => a.getClientRects().length).map((a) => a.textContent.trim()),
          bandH: document.querySelector('.g-app-shell__header')?.getBoundingClientRect().height
        }))
        rec(eng, part, 'sin desplazamiento horizontal', s.sw <= s.cw, `${s.sw}/${s.cw}`)
        rec(eng, part, 'un banner y un main', s.banners === 1 && s.mains === 1)
        rec(eng, part, 'toda nav visible con nombre', s.navs.every((n) => n.trim()), JSON.stringify(s.navs))
        rec(eng, part, 'banda de 64', Math.abs(s.bandH - 64) < 0.6, s.bandH)
        const expect = { comp: 'Componentes', guide: 'Guía', blocks: 'Blocks', home: null }[p]
        if (w >= 768) rec(eng, part, 'un solo actual en la barra (activeMatch)', expect ? s.current.length === 1 && s.current[0] === expect : s.current.length === 0, JSON.stringify(s.current))
        if (SHOTS && eng === 'chromium') await page.screenshot({ path: join(HERE, `proto-${p}-${w}-${theme}.png`) })

        // Paridad con la referencia (Chromium; vista por vista con la misma página y ancho)
        if (eng === 'chromium') {
          const ref = REF.paginas[`${{ comp: 'combobox', guide: 'empezar', blocks: 'blocks', home: 'portada' }[p]}-${w}-${theme}`]
          const pairs = [
            ['banda (alto)', '.g-app-shell__header', ref.nav, 'h'],
            ['búsqueda (botón)', '.mk-search', ref.searchButton, 'xywh'],
            ['primer enlace', '.nb__link', ref.menuLink, 'xh'],
            ['enlace actual', '.nb__link[aria-current="page"]', ref.menuLinkActive, 'xw'],
            ['idioma', '.nb__actions .mk-lang', ref.translationsButton, 'xw'],
            ['«…»', '.nb__more .nb__iconbtn', ref.extraButton, 'xw'],
            ['hamburguesa', '.nb__toggle .nb__iconbtn', ref.hamburger, 'x'],
            ['h1', '.mk-content h1', ref.h1, 'xyw'],
            ['«En esta página» (título)', '#pi-list .pi__title', ref.outlineTitle, 'xy'],
            ['«En esta página» (enlace)', '#pi-list .pi__link', ref.outlineLink, 'xh'],
            ['barra local', '.mk-local', ref.localNav, 'yh'],
            ['desplegable', '#pi-fold .pi__fold', ref.localNavOutline, 'x']
          ]
          for (const [name, sel, r, keys] of pairs) {
            const b = await box(page, sel)
            if (!r && !b) continue
            const row = { vista: part, pieza: name, ref: r ? r.box : null, proto: b }
            if (r && b) row.delta = Object.fromEntries([...keys].map((k) => [k, Math.round((b[k] - r.box[k]) * 10) / 10]))
            else row.delta = r ? 'falta en el prototipo' : 'sobra en el prototipo'
            PAR.push(row)
          }
        }
        await page.close()
      }
    }

    // ---------- Comportamiento (1280 y 375) ----------
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await page.goto(`${BASE}?p=comp${theme === 'oscuro' ? '&theme=dark' : ''}&glide=1&mark=1`, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.addScriptTag({ content: ratioFn })
    const part = `comportamiento/${theme}`
    // Contraste: actual vs reposo (G183), actual y reposo sobre el fondo
    const c = await page.evaluate(() => { const cur = document.querySelector('.nb__link[aria-current="page"]'); const rest = document.querySelector('.nb__link:not([aria-current])'); const bg = getComputedStyle(document.querySelector('.g-app-shell__header')).backgroundColor; return { curRest: window.__ratio(getComputedStyle(cur).color, getComputedStyle(rest).color), cur: window.__ratio(getComputedStyle(cur).color, bg), rest: window.__ratio(getComputedStyle(rest).color, bg), mark: window.__ratio(getComputedStyle(document.querySelector('.nb__mark')).backgroundColor, bg) } })
    rec(eng, part, 'enlace en reposo ≥ 4,5:1', c.rest >= 4.5, c.rest.toFixed(2))
    rec(eng, part, 'enlace actual ≥ 4,5:1', c.cur >= 4.5, c.cur.toFixed(2))
    rec(eng, part, 'marca P2 ≥ 3:1 (forma)', c.mark >= 3, c.mark.toFixed(2))
    console.log(`medida ${eng} ${part} · actual/reposo ${c.curRest.toFixed(2)}:1 (G183 pide ≥ 3 y otra señal al pasar o enfocar)`)
    // P2: la marca está bajo el actual, cubriendo su texto
    const mk = await page.evaluate(() => { const a = document.querySelector('.nb__link[aria-current="page"] span').getBoundingClientRect(); const m = document.querySelector('.nb__mark').getBoundingClientRect(); return { dx: Math.abs(m.left - a.left), dw: Math.abs(m.width - a.width), bottom: m.bottom, op: getComputedStyle(document.querySelector('.nb__mark')).opacity } })
    rec(eng, part, 'P2 · marca bajo el texto del actual (±2 px) en el borde de la banda', mk.dx <= 2 && mk.dw <= 3 && Math.abs(mk.bottom - 64) <= 1 && mk.op === '1', JSON.stringify(mk))
    // P1: la luz sigue al puntero, no mueve el foco y apaga el color de hover
    await page.locator('.nb__link').nth(2).hover()
    await page.waitForTimeout(400)
    const g = await page.evaluate(() => { const l = document.querySelector('.nb__light'); const a = document.querySelectorAll('.nb__link')[2]; const lb = l.getBoundingClientRect(); const ab = a.getBoundingClientRect(); return { op: getComputedStyle(l).opacity, dx: Math.abs(lb.left - ab.left), focus: document.activeElement === document.body || !document.activeElement.closest('.nb'), color: getComputedStyle(a).color, text: getComputedStyle(document.querySelector('.nb__link:not([aria-current])')).color } })
    rec(eng, part, 'P1 · la luz se posa en el enlace bajo el puntero', g.op === '1' && g.dx <= 1, JSON.stringify(g))
    rec(eng, part, 'P1 · el puntero no mueve el foco', g.focus)
    rec(eng, part, 'P1 · con la luz, el hover no pinta como el actual', g.color === g.text)
    // Tab: salto → (marca en el sidebar) → … → búsqueda → enlaces → idioma → tema
    await page.mouse.move(640, 700)
    await page.evaluate(() => { document.activeElement && document.activeElement.blur(); scrollTo(0, 0) })
    const order = []
    for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => { const e = document.activeElement; const lb = e.getAttribute('aria-labelledby'); return (e.getAttribute('aria-label') || (lb && document.getElementById(lb)?.textContent) || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28) })) }
    if (V) console.log(eng, 'Tab', order.join(' › '))
    const iSearch = order.indexOf('Buscar en la documentación'); const iGuide = order.indexOf('Guía'); const iLang = order.indexOf('Cambiar idioma')
    if (eng !== 'webkit') rec(eng, part, 'Tab: búsqueda → enlaces → idioma → tema, en orden visual', iSearch >= 0 && iGuide > iSearch && iLang > iGuide && order[iLang + 1]?.startsWith('Tema oscuro'), order.join(' › '))
    // Idioma: GMenu real con el actual marcado y lang/hreflang
    await page.locator('.nb__actions .mk-lang').click()
    await page.waitForTimeout(250)
    const lang = await page.evaluate(() => [...document.querySelectorAll('.g-menu__list [role="menuitem"]')].filter((a) => a.getClientRects().length).map((a) => `${a.textContent.trim()}|${a.getAttribute('lang')}|${a.getAttribute('hreflang')}|${a.getAttribute('aria-current')}`))
    rec(eng, part, 'idioma: dos enlaces con lang/hreflang y el actual con aria-current=page', lang.length === 2 && lang[0] === 'Español|es|es|page' && lang[1].startsWith('English|en|en|'), JSON.stringify(lang))
    await page.keyboard.press('Escape')
    // Cambiar el tema con el interruptor real
    await page.locator('.nb__actions .mk-theme input').click()
    await page.waitForTimeout(150)
    const themeNow = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    rec(eng, part, 'el interruptor de tema cambia data-theme', themeNow === (theme === 'oscuro' ? 'light' : 'dark'), themeNow)
    await page.close()

    // «…» a 1024: disclosure con aria-expanded, Esc devuelve el foco
    const p2 = await browser.newPage({ viewport: { width: 1024, height: 800 } })
    await p2.goto(`${BASE}?p=comp${theme === 'oscuro' ? '&theme=dark' : ''}`, { waitUntil: 'networkidle' })
    const more = p2.locator('.nb__more .nb__iconbtn')
    await more.click()
    await p2.waitForTimeout(150)
    const mo = await p2.evaluate(() => { const b = document.querySelector('.nb__more .nb__iconbtn'); const pnl = document.getElementById(b.getAttribute('aria-controls')); return { exp: b.getAttribute('aria-expanded'), name: b.getAttribute('aria-label'), vis: !!pnl.getClientRects().length, text: pnl.innerText.replace(/\s+/g, ' ').trim() } })
    rec(eng, `mas/${theme}`, '«…» abre su panel (aria-expanded=true, nombre en español) con idioma y apariencia', mo.exp === 'true' && mo.vis && mo.name === 'Más opciones' && /Español.*English.*Apariencia/.test(mo.text), JSON.stringify(mo))
    await p2.keyboard.press('Escape')
    await p2.waitForTimeout(100)
    rec(eng, `mas/${theme}`, 'Esc cierra «…» y devuelve el foco al botón', await p2.evaluate(() => document.activeElement === document.querySelector('.nb__more .nb__iconbtn') && document.querySelector('.nb__more .nb__iconbtn').getAttribute('aria-expanded') === 'false'))
    await p2.close()

    // Pantalla del menú a 375: disclosure, foco dentro, bucle de Tab, Esc devuelve el foco
    const p3 = await browser.newPage({ viewport: { width: 375, height: 740 }, hasTouch: true })
    await p3.goto(`${BASE}?p=comp${theme === 'oscuro' ? '&theme=dark' : ''}`, { waitUntil: 'networkidle' })
    await p3.locator('.nb__toggle .nb__iconbtn').click()
    await p3.waitForTimeout(200)
    const sc = await p3.evaluate(() => { const b = document.querySelector('.nb__toggle .nb__iconbtn'); const s = document.getElementById(b.getAttribute('aria-controls')); const r = s.getBoundingClientRect(); return { exp: b.getAttribute('aria-expanded'), name: b.getAttribute('aria-label'), top: r.top, h: r.height, inside: s.contains(document.activeElement), rows: [...s.querySelectorAll('.nb__screen-link')].map((a) => Math.round(a.getBoundingClientRect().height)), current: s.querySelector('[aria-current="page"]')?.textContent.trim() } })
    rec(eng, `pantalla/${theme}`, 'abre bajo la banda con el foco dentro', sc.exp === 'true' && Math.abs(sc.top - 64) <= 1 && sc.inside, JSON.stringify(sc))
    rec(eng, `pantalla/${theme}`, 'filas de 48 y el actual marcado', sc.rows.length === 6 && sc.rows.every((h) => h >= 44) && sc.current === 'Componentes', JSON.stringify(sc.rows))
    // Bucle: Mayús+Tab desde el primero va al último; Tab desde el último vuelve al botón
    await p3.keyboard.press('Shift+Tab')
    await p3.keyboard.press('Shift+Tab')
    const loop = await p3.evaluate(() => document.activeElement.closest('.nb__screen, .nb__toggle') ? 'dentro' : 'fuera')
    rec(eng, `pantalla/${theme}`, 'el foco no sale de la pantalla abierta (bucle botón ↔ pantalla)', loop === 'dentro', loop)
    await p3.keyboard.press('Escape')
    await p3.waitForTimeout(100)
    rec(eng, `pantalla/${theme}`, 'Esc cierra y devuelve el foco al botón', await p3.evaluate(() => document.activeElement === document.querySelector('.nb__toggle .nb__iconbtn') && document.querySelector('.nb__toggle .nb__iconbtn').getAttribute('aria-expanded') === 'false'))
    const touch = await p3.evaluate(() => [...document.querySelectorAll('.nb__toggle .nb__iconbtn, .mk-search, .mk-local__menu, .pi__fold')].filter((e) => e.getClientRects().length).map((e) => { const r = e.getBoundingClientRect(); return Math.round(Math.min(r.width, r.height)) }))
    rec(eng, `pantalla/${theme}`, 'táctil ≥ 44 en la barra y la barra local', touch.every((v) => v >= 44), JSON.stringify(touch))
    if (SHOTS && eng === 'chromium') {
      await p3.locator('.nb__toggle .nb__iconbtn').click(); await p3.waitForTimeout(200)
      await p3.screenshot({ path: join(HERE, `proto-estado-menu-movil-375-${theme}.png`) })
    }
    await p3.close()
    if (SHOTS && eng === 'chromium') {
      const p4 = await browser.newPage({ viewport: { width: 1280, height: 800 } })
      await p4.goto(`${BASE}?p=comp${theme === 'oscuro' ? '&theme=dark' : ''}&glide=1&mark=1`, { waitUntil: 'networkidle' })
      await p4.evaluate(() => document.fonts.ready)
      await p4.locator('.nb__link').nth(3).hover(); await p4.waitForTimeout(400)
      await p4.screenshot({ path: join(HERE, `proto-estado-p1-p2-1280-${theme}.png`), clip: { x: 272, y: 0, width: 1008, height: 120 } })
      await p4.locator('.nb__actions .mk-lang').click(); await p4.waitForTimeout(300)
      await p4.screenshot({ path: join(HERE, `proto-estado-idioma-1280-${theme}.png`), clip: { x: 640, y: 0, width: 640, height: 260 } })
      await p4.keyboard.press('Escape')
      await p4.keyboard.press('Control+k'); await p4.waitForTimeout(400)
      await p4.screenshot({ path: join(HERE, `proto-estado-busqueda-1280-${theme}.png`) })
      await p4.close()
      const p5 = await browser.newPage({ viewport: { width: 1024, height: 800 } })
      await p5.goto(`${BASE}?p=comp${theme === 'oscuro' ? '&theme=dark' : ''}`, { waitUntil: 'networkidle' })
      await p5.locator('.nb__more .nb__iconbtn').click(); await p5.waitForTimeout(200)
      await p5.screenshot({ path: join(HERE, `proto-estado-mas-1024-${theme}.png`), clip: { x: 512, y: 0, width: 512, height: 320 } })
      await p5.close()
    }
  }
  await browser.close()
}

server.close()
await writeFile(join(HERE, 'paridad.json'), JSON.stringify(PAR, null, 1))
const fails = R.filter((r) => !r.ok)
for (const eng of ENGINES) { const mine = R.filter((r) => r.eng === eng); console.log(`${eng}: ${mine.filter((r) => r.ok).length}/${mine.length}`) }
console.log(`total ${R.length - fails.length}/${R.length}`)
process.exitCode = fails.length ? 1 : 0
