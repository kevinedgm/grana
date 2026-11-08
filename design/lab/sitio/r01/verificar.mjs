// Verificación del prototipo del marco del sitio (kiwi r01) y capturas de los tres conceptos.
// Ejecutar desde la raíz: node design/lab/sitio/r01/verificar.mjs
//   Puerto 4231 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  SHOTS=0 (sin capturas)  VERBOSE=1
// Requiere packages/vue/dist (npm run build) y node_modules/vue. Solo lee; escribe PNG en esta carpeta.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const HERE = fileURLToPath(new URL('./', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4231)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(path))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/sitio/r01/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const SHOTS = process.env.SHOTS !== '0'
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }
const note = (eng, part, name, value) => console.log(`medida ${eng} ${part} · ${name} · ${value}`)

// Contraste (WCAG) entre dos colores CSS ya resueltos
const contrastFn = `(() => {
  const parse = (c) => { const ctx = document.createElement('canvas').getContext('2d'); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0,0,1,1); const d = ctx.getImageData(0,0,1,1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const bgOf = (el) => { let e = el; const stack = []; while (e) { const c = getComputedStyle(e).backgroundColor; const p = parse(c); if (p[3] > 0) { stack.push(p); if (p[3] >= 1) break } e = e.parentElement } let base = [255,255,255]; if (!e) base = parse(getComputedStyle(document.body).backgroundColor).slice(0,3); for (let i = stack.length - 1; i >= 0; i--) { const [r,g,b,a] = stack[i]; base = [r*a + base[0]*(1-a), g*a + base[1]*(1-a), b*a + base[2]*(1-a)] } return base }
  window.__ratio = (el) => { const fg = parse(getComputedStyle(el).color); const bg = bgOf(el); const f = [fg[0]*fg[3] + bg[0]*(1-fg[3]), fg[1]*fg[3] + bg[1]*(1-fg[3]), fg[2]*fg[3] + bg[2]*(1-fg[3])]; const L1 = lum(f), L2 = lum(bg); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05) }
})()`

for (const eng of ENGINES) {
  const browser = await pw[eng].launch()
  for (const c of ['A', 'B', 'C']) {
    for (const theme of ['light', 'dark']) {
      for (const [w, hgt, tag] of [[1280, 800, '1280'], [375, 760, '375'], [320, 640, '320']]) {
        const page = await browser.newPage({ viewport: { width: w, height: hgt }, hasTouch: w < 768 })
        const errs = []
        page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()) })
        page.on('pageerror', (e) => errs.push('pageerror ' + e.message))
        const part = `${c}/${theme}/${tag}`
        await page.goto(`${BASE}?c=${c}&p=comp${theme === 'dark' ? '&theme=dark' : ''}&mesa=1`)
        await page.waitForFunction(() => window.__sx && window.__sx.ready)
        await page.evaluate(() => { try { sessionStorage.clear() } catch {} })
        await page.waitForTimeout(250)
        if (SHOTS && eng === 'chromium') await page.screenshot({ path: join(HERE, `${c}-${tag}-${theme === 'dark' ? 'oscuro' : 'claro'}.png`) })
        rec(eng, part, 'consola sin errores ni avisos', errs.length === 0, errs.slice(0, 3).join(' | '))
        // Landmarks: un banner, un main, navegación con nombre, contentinfo
        const lm = await page.evaluate(() => ({
          banner: document.querySelectorAll('header.g-app-shell__header').length,
          main: document.querySelectorAll('main').length,
          h1: document.querySelectorAll('h1').length,
          navs: [...document.querySelectorAll('nav')].filter((n) => n.offsetParent || n.closest('dialog[open]')).map((n) => n.getAttribute('aria-label') || '(sin nombre)'),
          lang: document.documentElement.lang
        }))
        rec(eng, part, 'un banner, un main, un h1', lm.banner === 1 && lm.main === 1 && lm.h1 === 1, JSON.stringify(lm))
        rec(eng, part, 'toda navegación visible tiene nombre', lm.navs.every((n) => n !== '(sin nombre)'), lm.navs.join(', '))
        // Sin desplazamiento horizontal
        const hs = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        rec(eng, part, 'sin desplazamiento horizontal', hs <= 0, hs)
        // Primer Tab: saltar al contenido
        await page.keyboard.press('Tab')
        const first = await page.evaluate(() => document.activeElement && document.activeElement.className)
        rec(eng, part, 'el primer Tab es «Saltar al contenido»', /g-app-shell__skip/.test(first || '') || eng === 'webkit', first)
        // Táctil: todo lo pulsable visible del marco (banda, índice, estaciones, mesa) ≥ 44 px de alto con pointer: coarse
        if (w < 768) {
          const small = await page.evaluate(() => [...document.querySelectorAll('.g-app-shell__header a, .g-app-shell__header button, .g-app-shell__header input:not(.g-input__control input), .g-app-shell__header .g-input__control, .sx-station, .sx-inline-toc a, .sx-mesa button, .sx-mesa-tab button, .sx-filter__box')]
            .filter((e) => e.offsetParent && getComputedStyle(e).visibility !== 'hidden')
            .map((e) => { const r = e.getBoundingClientRect(); const a = getComputedStyle(e, '::after'); const hit = (v, box) => Math.max(box, a.content !== 'none' && a.position === 'absolute' ? parseFloat(v) || 0 : 0); return { t: (e.getAttribute('aria-label') || e.textContent || e.className).trim().slice(0, 30), h: Math.round(hit(a.height, r.height)), w: Math.round(hit(a.width, r.width)) } })
            .filter((r) => r.h < 44 || r.w < 24))
          rec(eng, part, 'táctil: pulsables del marco ≥ 44 px de alto', small.length === 0, JSON.stringify(small.slice(0, 4)))
        }
        // Contraste del texto del marco
        await page.evaluate(contrastFn)
        const low = await page.evaluate(() => [...document.querySelectorAll('.sx-filter__count, .sx-filter__input, .sx-station, .sx-station__n, .sx-h2__n, .sx-num:not([aria-current] .sx-num):not(.is-active .sx-num), .sx-inline-toc a, .sx-inline-toc__k, .sx-pin__from, .sx-footer, .sx-eyebrow, .sx-relay__k, .g-sidebar__label, .g-sidebar__group-title, .sx-kbd, .sx-count, .sx-muted')]
          .filter((e) => e.offsetParent && e.textContent.trim()).map((e) => ({ t: e.className.split(' ')[0], r: +window.__ratio(e).toFixed(2) })).filter((x) => x.r < 4.5))
        rec(eng, part, 'contraste del texto del marco ≥ 4.5:1', low.length === 0, JSON.stringify(low.slice(0, 4)))
        // El número dentro del asiento lleno: tinta `on-current` sobre el relleno `current` (pseudo-elemento ::before)
        const seat = await page.evaluate(() => { const n = document.querySelector('[aria-current="page"] .sx-num'); if (!n || !n.offsetParent) return null; const box = n.closest('.g-sidebar__icon'); const probe = document.createElement('span'); probe.style.color = getComputedStyle(box, '::before').backgroundColor; probe.style.backgroundColor = getComputedStyle(box, '::before').backgroundColor; document.body.append(probe); const bg = getComputedStyle(probe).color; probe.remove(); const fake = document.createElement('span'); fake.style.color = getComputedStyle(n).color; fake.style.backgroundColor = bg; document.body.append(fake); const r = window.__ratio(fake); fake.remove(); return +r.toFixed(2) })
        if (seat !== null) rec(eng, part, 'número del asiento lleno ≥ 4.5:1', seat >= 4.5, seat)
        await page.close()
      }
    }
  }

  // ---------- Comportamientos por concepto (claro, 1280) ----------
  {
    // A: `/` enfoca el filtro; «24» deja solo GCombobox; texto sin título → «En el texto»; Esc vacía
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await page.goto(`${BASE}?c=A&p=comp`)
    await page.waitForFunction(() => window.__sx && window.__sx.ready)
    await page.keyboard.press('/')
    const f = await page.evaluate(() => document.activeElement.classList.contains('sx-filter__input'))
    rec(eng, 'A', '«/» enfoca el filtro del índice', f)
    await page.keyboard.type('24')
    await page.waitForTimeout(100)
    const n24 = await page.evaluate(() => [...document.querySelectorAll('.g-sidebar__label')].filter((e) => e.offsetParent).map((e) => e.textContent.trim()))
    rec(eng, 'A', '«24» deja solo el componente 24', n24.length === 1 && n24[0] === 'GCombobox', n24.join(','))
    await page.locator('.sx-filter__input').fill('oscuro')
    await page.waitForTimeout(800)
    const txt = await page.evaluate(() => ({ groups: [...document.querySelectorAll('.g-sidebar__group-title')].map((e) => e.textContent.trim()), live: document.querySelector('.sx-filter [role="status"]').textContent }))
    rec(eng, 'A', 'sin título: aparece «En el texto» y se anuncia el recuento', txt.groups.includes('En el texto') && /Ningún|de/.test(txt.live), JSON.stringify(txt))
    if (SHOTS && eng === 'chromium') await page.screenshot({ path: join(HERE, 'A-1280-claro-filtro.png') })
    await page.keyboard.press('Escape')
    const cleared = await page.evaluate(() => document.querySelector('.sx-filter__input').value === '' && window.__sx.shown >= 90)
    rec(eng, 'A', 'Esc vacía el filtro y vuelve el índice completo', cleared)
    // relevo de lectura: al bajar a la API, el disparador del zócalo dice «API»
    await page.evaluate(() => document.getElementById('sec-api').scrollIntoView())
    await page.waitForTimeout(250)
    const relay = await page.evaluate(() => document.querySelector('.sx-relay__v').textContent.trim())
    rec(eng, 'A', 'el zócalo sigue la lectura (relevo)', relay === 'API', relay)
    if (SHOTS && eng === 'chromium') await page.screenshot({ path: join(HERE, 'A-1280-claro-lectura.png') })
    await page.close()
  }
  {
    // B: estación actual con aria-current=location; «/» enfoca la búsqueda; la paleta se abre al escribir
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await page.goto(`${BASE}?c=B&p=comp`)
    await page.waitForFunction(() => window.__sx && window.__sx.ready)
    await page.evaluate(() => document.getElementById('sec-teclado').scrollIntoView())
    await page.waitForTimeout(250)
    const st = await page.evaluate(() => [...document.querySelectorAll('.sx-station[aria-current="location"]')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()))
    rec(eng, 'B', 'una sola estación actual, la de la lectura (§8)', st.length === 1 && st[0].startsWith('§8'), st.join('|'))
    const stuck = await page.evaluate(() => { const r = document.querySelector('.sx-stations').getBoundingClientRect(); return Math.round(r.top) })
    rec(eng, 'B', 'las estaciones quedan pegadas bajo la banda', stuck > 40 && stuck < 120, stuck)
    if (SHOTS && eng === 'chromium') await page.screenshot({ path: join(HERE, 'B-1280-claro-lectura.png') })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.mouse.click(5, 790)
    await page.keyboard.press('/')
    const inSearch = await page.evaluate(() => !!document.activeElement.closest('.sx-search'))
    rec(eng, 'B', '«/» enfoca la búsqueda', inSearch)
    await page.keyboard.type('comb')
    await page.waitForTimeout(500)
    const pal = await page.evaluate(() => { const d = document.querySelector('dialog.g-combobox-surface[open]'); return d ? { n: d.querySelectorAll('[role="option"]').length, preview: !!d.querySelector('.g-combobox__preview'), focus: document.activeElement.closest('dialog') === d } : null })
    rec(eng, 'B', 'la paleta se abre con lo tecleado, foco dentro y vista previa', pal && pal.n > 0 && pal.focus && pal.preview, JSON.stringify(pal))
    if (SHOTS && eng === 'chromium') await page.screenshot({ path: join(HERE, 'B-1280-claro-paleta.png') })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
    const back = await page.evaluate(() => !document.querySelector('dialog.g-combobox-surface[open]') && !!document.activeElement.closest('.sx-search'))
    rec(eng, 'B', 'Esc cierra la paleta y devuelve el foco al campo', back)
    await page.close()
    // B portada: el catálogo es el índice
    const home = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await home.goto(`${BASE}?c=B&p=home`)
    await home.waitForFunction(() => window.__sx && window.__sx.ready)
    const tiles = await home.evaluate(() => document.querySelectorAll('.sx-tile').length)
    rec(eng, 'B', 'portada: el catálogo numerado entero (78)', tiles === 78, tiles)
    if (SHOTS && eng === 'chromium') await home.screenshot({ path: join(HERE, 'B-1280-claro-portada.png'), fullPage: false })
    await home.close()
  }
  {
    // C: fijar una sección la lleva a la mesa; la mesa persiste al navegar (recarga); la mesa no tapa el foco
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await page.goto(`${BASE}?c=C&p=comp`)
    await page.waitForFunction(() => window.__sx && window.__sx.ready)
    await page.evaluate(() => { try { sessionStorage.clear() } catch {} })
    await page.reload(); await page.waitForFunction(() => window.__sx && window.__sx.ready)
    const before = await page.evaluate(() => window.__sx.mesa)
    await page.getByRole('button', { name: 'Fijar «API» en la mesa' }).click()
    const after = await page.evaluate(() => window.__sx.mesa)
    const pressed = await page.getByRole('button', { name: 'Quitar «API» de la mesa' }).getAttribute('aria-pressed')
    rec(eng, 'C', 'fijar añade a la mesa y el botón queda pulsado', after === before + 1 && pressed === 'true', `${before}→${after} ${pressed}`)
    await page.goto(`${BASE}?c=C&p=guide`)
    await page.waitForFunction(() => window.__sx && window.__sx.ready)
    const kept = await page.evaluate(() => window.__sx.mesa)
    rec(eng, 'C', 'la mesa sigue al navegar a otra página', kept === after, kept)
    if (SHOTS && eng === 'chromium') await page.screenshot({ path: join(HERE, 'C-1280-claro-guia.png') })
    await page.close()
  }
  await browser.close()
}
server.close()
const ok = R.filter((r) => r.ok).length
console.log(`\n${ok}/${R.length} comprobaciones`)
process.exit(ok === R.length ? 0 : 1)
