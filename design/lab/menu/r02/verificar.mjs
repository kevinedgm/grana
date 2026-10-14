// Verificación del prototipo r02 de GMenu (elementos-enlace, kiwi): base y conceptos A, B y C en Chromium, Firefox y WebKit.
// Ejecutar desde la raíz: node design/lab/menu/r02/verificar.mjs
//   Puerto 4216 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  VERBOSE=1
// Requiere packages/vue/dist (npm run build) para el CSS real de GMenu y los tokens. Solo lee; no toca packages/.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4216)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(path))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/menu/r02/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }

async function open(b, qs, opts = {}) {
  const { vw = 1280, vh = 900 } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh } })
  await context.route(/example\.org/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>externo</title>' }))
  const p = await context.newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push(String(e)))
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  await p.goto(BASE + qs)
  await p.waitForFunction(() => window.__r02 && window.__r02.ready)
  await p.evaluate(() => document.fonts.ready)
  p.__errs = errs
  p.__ctx = context
  return p
}
const acc = (p) => p.locator('#demo-account')
const openAcc = async (p) => { await acc(p).locator('[aria-haspopup="menu"]').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(60) }
const isOpen = (p) => p.evaluate(() => window.__r02.menus.account.isOpen())
const active = (p) => p.evaluate(() => document.activeElement?.textContent?.trim() || document.activeElement?.tagName)
const navs = (p) => p.evaluate(() => window.__r02.navigates.map((n) => n.id))
const item = (p, label) => acc(p).locator('.g-menu__item', { hasText: label })
const focusOn = async (p, label) => { await item(p, label).hover(); await p.waitForTimeout(30) }

// Contraste (WCAG) de dos colores calculados
const contrast = (p, sel, fgProp, bgSel, bgProp) => p.evaluate(([sel, fgProp, bgSel, bgProp]) => {
  const rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = c; x.fillRect(0, 0, 1, 1); return [...x.getImageData(0, 0, 1, 1).data].slice(0, 3) }
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const a = lum(rgb(getComputedStyle(document.querySelector(sel))[fgProp]))
  const b = lum(rgb(getComputedStyle(document.querySelector(bgSel))[bgProp]))
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}, [sel, fgProp, bgSel, bgProp])

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  try {
    // ---------- Base ----------
    {
      const P = 'base'
      let p = await open(b, '?c=base')
      // Anatomía
      const anat = await p.evaluate(() => {
        const l = document.querySelector('#demo-account .g-menu__list')
        const links = [...l.querySelectorAll('a.g-menu__item')]
        const dis = links.find((a) => a.textContent.includes('Facturación'))
        return {
          links: links.length, allMenuitem: links.every((a) => a.getAttribute('role') === 'menuitem'),
          disHref: dis.hasAttribute('href'), disAria: dis.getAttribute('aria-disabled'), disTab: dis.getAttribute('tabindex'),
          current: l.querySelectorAll('[aria-current="page"]').length,
          currentTag: l.querySelector('[aria-current="page"]').tagName,
          buttons: l.querySelectorAll('button.g-menu__item').length
        }
      })
      rec(eng, P, 'seis enlaces <a role=menuitem>', anat.links === 6 && anat.allMenuitem, JSON.stringify(anat))
      rec(eng, P, 'deshabilitado: <a> sin href, aria-disabled, tabindex -1', !anat.disHref && anat.disAria === 'true' && anat.disTab === '-1')
      rec(eng, P, 'aria-current="page" una vez, en un <a>', anat.current === 1 && anat.currentTag === 'A')
      rec(eng, P, 'acciones y casilla siguen siendo <button>', anat.buttons === 2)
      await openAcc(p)
      if (V) console.log(await p.evaluate(() => [...document.querySelectorAll('#demo-account a.g-menu__item')].map((a) => a.textContent)))
      rec(eng, P, 'nombre accesible: externo + pestaña nueva', await p.getByRole('menuitem', { name: /^Documentación ?, otro sitio, abre en una pestaña nueva$/ }).count() === 1)
      rec(eng, P, 'nombre accesible: externo en la misma pestaña', await p.getByRole('menuitem', { name: /^Estado del servicio ?, otro sitio$/ }).count() === 1)
      rec(eng, P, 'Intro abre con el foco en el primero', (await isOpen(p)) && (await active(p)) === 'Mi perfil')
      // Intro en un enlace → navigate, cierra, foco al disparador
      await p.keyboard.press('Enter'); await p.waitForTimeout(60)
      rec(eng, P, 'Intro en enlace: navigate', JSON.stringify(await navs(p)) === '["perfil"]')
      rec(eng, P, 'Intro en enlace: cierra y devuelve el foco', !(await isOpen(p)) && (await active(p)) === 'Kevin García')
      rec(eng, P, 'router simulado: la URL no cambia', (await p.evaluate(() => location.hash)) === '')
      // Espacio en un enlace → navigate, sin desplazar la página
      await openAcc(p); await p.keyboard.press('ArrowDown')
      const y0 = await p.evaluate(() => scrollY)
      await p.keyboard.press(' '); await p.waitForTimeout(60)
      rec(eng, P, 'Espacio en enlace: navigate', (await navs(p)).at(-1) === 'ajustes')
      rec(eng, P, 'Espacio en enlace: no desplaza y cierra', (await p.evaluate(() => scrollY)) === y0 && !(await isOpen(p)))
      // Deshabilitado: alcanzable con flechas, Intro no hace nada, el menú sigue abierto
      await openAcc(p)
      for (let i = 0; i < 5; i++) await p.keyboard.press('ArrowDown')
      rec(eng, P, 'deshabilitado alcanzable con flechas', (await active(p)) === 'Facturación')
      const n0 = (await navs(p)).length
      await p.keyboard.press('Enter'); await p.keyboard.press(' '); await p.waitForTimeout(60)
      rec(eng, P, 'deshabilitado: sin navigate y sigue abierto', (await navs(p)).length === n0 && (await isOpen(p)))
      // Puntero sobre deshabilitado no mueve el foco (M1)
      await focusOn(p, 'Ajustes')
      rec(eng, P, 'M1: el puntero mueve el foco', (await active(p)).startsWith('Ajustes'))
      await focusOn(p, 'Facturación')
      rec(eng, P, 'M1: el puntero mueve el foco y no se posa en el deshabilitado', (await active(p)) !== 'Facturación' && (await active(p)) !== 'Kevin García')
      // Ctrl/⌘+clic → sin navigate; el navegador abre; el menú cierra (base)
      const pages0 = p.__ctx.pages().length
      await item(p, 'Ajustes').click({ modifiers: ['ControlOrMeta'] }); await p.waitForTimeout(250)
      rec(eng, P, 'Ctrl/⌘+clic: sin navigate', (await navs(p)).length === n0)
      // Solo Chromium headless abre la pestaña con un clic modificado sintético; en Firefox y WebKit se informa
      if (eng === 'chromium') rec(eng, P, 'Ctrl/⌘+clic: el navegador abre otra pestaña', p.__ctx.pages().length > pages0, `páginas ${pages0}→${p.__ctx.pages().length}`)
      else if (V) console.log(`info ${eng}: páginas ${pages0}→${p.__ctx.pages().length} tras Ctrl/⌘+clic`)
      rec(eng, P, 'Ctrl/⌘+clic: cierra (base, como un menú nativo)', !(await isOpen(p)))
      // Mayús+clic → sin navigate, cierra
      await openAcc(p)
      await item(p, 'Mi perfil').click({ modifiers: ['Shift'] }); await p.waitForTimeout(250)
      rec(eng, P, 'Mayús+clic: sin navigate y cierra', (await navs(p)).length === n0 && !(await isOpen(p)))
      // Clic central → sin navigate
      await openAcc(p)
      await item(p, 'Mi perfil').click({ button: 'middle' }); await p.waitForTimeout(250)
      rec(eng, P, 'clic central: sin navigate', (await navs(p)).length === n0)
      // target=_blank con clic primario → sin navigate (como RouterLink), cierra
      if (await isOpen(p)) await p.keyboard.press('Escape')
      await openAcc(p)
      await item(p, 'Documentación').click(); await p.waitForTimeout(250)
      rec(eng, P, 'target=_blank: sin navigate y cierra', (await navs(p)).length === n0 && !(await isOpen(p)))
      // Clic derecho: no navega, el menú sigue abierto
      await p.bringToFront()
      await openAcc(p)
      await item(p, 'Estado del servicio').click({ button: 'right' }); await p.waitForTimeout(80)
      rec(eng, P, 'clic derecho: sin navigate y sigue abierto', (await navs(p)).length === n0 && (await isOpen(p)))
      await p.keyboard.press('Escape')
      // Casilla: no cierra
      await openAcc(p); await focusOn(p, 'Tema oscuro'); await p.keyboard.press('Enter'); await p.waitForTimeout(60)
      rec(eng, P, 'casilla: alterna sin cerrar', (await isOpen(p)) && (await item(p, 'Tema oscuro').getAttribute('aria-checked')) === 'true')
      await p.keyboard.press('Escape')
      // Router apagado: el navegador sigue el href
      await p.uncheck('#router')
      await openAcc(p); await p.keyboard.press('Enter'); await p.waitForTimeout(80)
      rec(eng, P, 'sin router: el navegador sigue el href', (await p.evaluate(() => location.hash)) === '#/perfil')
      // Contraste: barra de la página actual (forma, 3:1) y etiqueta
      await openAcc(p)
      const bar = await p.evaluate(() => {
        const el = document.querySelector('#demo-account [aria-current="page"]')
        return getComputedStyle(el, '::before').backgroundColor
      })
      const cBar = await p.evaluate((c) => {
        const rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = c; x.fillRect(0, 0, 1, 1); return [...x.getImageData(0, 0, 1, 1).data].slice(0, 3) }
        const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
        const s = lum(rgb(getComputedStyle(document.querySelector('#demo-account .g-menu__list')).backgroundColor)); const a = lum(rgb(c))
        return (Math.max(a, s) + 0.05) / (Math.min(a, s) + 0.05)
      }, bar)
      rec(eng, P, 'barra de página actual ≥ 3:1 sobre la lista', cBar >= 3, cBar.toFixed(2))
      const cLeave = await contrast(p, '#demo-account .r02-leave', 'color', '#demo-account .g-menu__list', 'backgroundColor')
      rec(eng, P, 'marca «sale de aquí» ≥ 3:1', cLeave >= 3, cLeave.toFixed(2))
      rec(eng, P, 'sin errores de página', p.__errs.length === 0, p.__errs.join(' | '))
      await p.__ctx.close()

      // Móvil: sin desborde de página con el menú abierto
      p = await open(b, '?c=B', { vw: 375, vh: 740 })
      await openAcc(p)
      const fit = await p.evaluate(() => {
        const r = document.querySelector('#demo-account .g-menu__list').getBoundingClientRect()
        return { over: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, inside: r.left >= 0 && r.right <= innerWidth }
      })
      rec(eng, 'móvil', '375 px: sin desborde y la lista dentro del visor', !fit.over && fit.inside, JSON.stringify(fit))
      await p.__ctx.close()
    }

    // ---------- RTL ----------
    {
      const p = await open(b, '?c=B&dir=rtl')
      await openAcc(p)
      const r = await p.evaluate(() => {
        const el = document.querySelector('#demo-account [aria-current="page"]')
        const bar = getComputedStyle(el, '::before')
        const er = el.getBoundingClientRect()
        return { right: parseFloat(bar.right), left: bar.left }
      })
      rec(eng, 'rtl', 'barra de página actual al inicio lógico (derecha)', r.right === 0, JSON.stringify(r))
      await focusOn(p, 'Documentación')
      const dir = await p.evaluate(() => getComputedStyle(document.querySelector('#demo-account .r02-dest__host')).direction)
      rec(eng, 'rtl', 'la URL del pie se lee en LTR', dir === 'ltr')
      await p.__ctx.close()
    }

    // ---------- B · Pie de destino ----------
    {
      const P = 'B'
      const p = await open(b, '?c=B')
      const has = await p.evaluate(() => ({ acc: !!document.querySelector('#demo-account .r02-dest'), file: !!document.querySelector('#demo-file .r02-dest'), hidden: document.querySelector('#demo-account .r02-dest').getAttribute('aria-hidden'), role: document.querySelector('#demo-account .r02-dest').getAttribute('role') }))
      rec(eng, P, 'pie solo en el menú que sale de la aplicación', has.acc && !has.file)
      rec(eng, P, 'pie fuera del árbol accesible (li role=none aria-hidden)', has.hidden === 'true' && has.role === 'none')
      await openAcc(p)
      const h0 = await p.evaluate(() => document.querySelector('#demo-account .g-menu__list').offsetHeight)
      const read = () => p.evaluate(() => { const d = document.querySelector('#demo-account .r02-dest'); return { empty: d.hasAttribute('data-empty'), host: d.querySelector('.r02-dest__host').textContent, path: d.querySelector('.r02-dest__path').textContent, tag: d.querySelector('.r02-dest__tag').textContent } })
      let d = await read()
      rec(eng, P, 'interno: la ruta', !d.empty && d.path === '#/perfil' && d.host === '', JSON.stringify(d))
      await focusOn(p, 'Documentación'); d = await read()
      rec(eng, P, 'externo en pestaña nueva: dominio + «Pestaña nueva»', d.host === 'example.org' && d.path === '/docs/grana/menu' && d.tag.includes('Pestaña nueva'), JSON.stringify(d))
      await focusOn(p, 'Estado del servicio'); d = await read()
      rec(eng, P, 'externo misma pestaña: «Otro sitio»', d.host === 'status.example.org' && d.tag.includes('Otro sitio'), JSON.stringify(d))
      await focusOn(p, 'Invitar al equipo'); d = await read()
      rec(eng, P, 'acción: el pie se calla', d.empty)
      await p.keyboard.press('End'); await p.waitForTimeout(40); d = await read()
      rec(eng, P, 'con teclado sigue al foco', !d.empty && d.path === '#/salir', JSON.stringify(d))
      const h1 = await p.evaluate(() => document.querySelector('#demo-account .g-menu__list').offsetHeight)
      rec(eng, P, 'el alto de la lista no cambia al recorrer', h0 === h1, `${h0} / ${h1}`)
      const pos = await p.evaluate(() => { const l = document.querySelector('#demo-account .g-menu__list').getBoundingClientRect(); const f = document.querySelector('#demo-account .r02-dest').getBoundingClientRect(); return Math.abs(l.bottom - f.bottom) })
      rec(eng, P, 'pie pegado al borde inferior de la lista', pos <= 2, pos.toFixed(1))
      await focusOn(p, 'Documentación')
      const cHost = await contrast(p, '#demo-account .r02-dest__host', 'color', '#demo-account .r02-dest', 'backgroundColor')
      const cPath = await contrast(p, '#demo-account .r02-dest__path', 'color', '#demo-account .r02-dest', 'backgroundColor')
      rec(eng, P, 'texto del pie ≥ 4.5:1', cHost >= 4.5 && cPath >= 4.5, `${cHost.toFixed(2)} / ${cPath.toFixed(2)}`)
      const fs = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#demo-account .r02-dest')).fontSize))
      rec(eng, P, 'texto del pie ≥ 12px', fs >= 12, fs)
      rec(eng, P, 'sin errores de página', p.__errs.length === 0, p.__errs.join(' | '))
      await p.__ctx.close()
    }

    // ---------- C · Varias pestañas ----------
    {
      const P = 'C'
      const p = await open(b, '?c=C')
      await openAcc(p)
      await item(p, 'Ajustes').click({ modifiers: ['ControlOrMeta'] }); await p.waitForTimeout(250)
      await p.bringToFront()
      rec(eng, P, 'Ctrl/⌘+clic: el menú sigue abierto', await isOpen(p))
      rec(eng, P, 'Ctrl/⌘+clic: huella «Abierta»', (await item(p, 'Ajustes').locator('.r02-trace').textContent()) === 'Abierta')
      await p.waitForTimeout(120)
      rec(eng, P, 'Ctrl/⌘+clic: anuncio cortés', (await p.textContent('#live')).includes('Ajustes abierta'))
      await item(p, 'Mi perfil').click({ button: 'middle' }); await p.waitForTimeout(250)
      await p.bringToFront()
      rec(eng, P, 'clic central: sigue abierto con huella', (await isOpen(p)) && (await item(p, 'Mi perfil').locator('.r02-trace').textContent()) === 'Abierta')
      rec(eng, P, 'sin navigate en ningún gesto con modificador', (await navs(p)).length === 0)
      // Ctrl/⌘+C copia el enlace enfocado
      await item(p, 'Estado del servicio').focus()
      await p.evaluate(() => { const l = document.querySelector('#demo-account .g-menu__item[href*="status"]'); l.focus() })
      await p.keyboard.press('ControlOrMeta+c'); await p.waitForTimeout(60)
      rec(eng, P, 'Ctrl/⌘+C copia la URL absoluta', (await p.evaluate(() => window.__r02.copied)) === 'https://status.example.org/')
      rec(eng, P, 'Ctrl/⌘+C: huella «Enlace copiado»', (await item(p, 'Estado del servicio').locator('.r02-trace').textContent()) === 'Enlace copiado')
      // Vista previa con el modificador pulsado
      await p.keyboard.down(process.platform === 'darwin' && eng !== 'firefox' ? 'Meta' : 'Control')
      await p.waitForTimeout(40)
      const mod = await p.evaluate(() => document.querySelector('#demo-account .g-menu__list').hasAttribute('data-mod'))
      const cAct = await contrast(p, '#demo-account button.g-menu__item:not([aria-disabled])', 'color', '#demo-account .g-menu__list', 'backgroundColor')
      await p.keyboard.up(process.platform === 'darwin' && eng !== 'firefox' ? 'Meta' : 'Control')
      rec(eng, P, 'Ctrl/⌘ pulsado: las acciones se apartan', mod)
      rec(eng, P, 'acción apartada sigue ≥ 4.5:1', cAct >= 4.5, cAct.toFixed(2))
      await p.keyboard.press('Escape')
      rec(eng, P, 'al cerrar se borran las huellas', (await p.evaluate(() => [...document.querySelectorAll('#demo-account .r02-trace')].every((t) => t.textContent === ''))))
      rec(eng, P, 'sin errores de página', p.__errs.length === 0, p.__errs.join(' | '))
      await p.__ctx.close()
    }
  } finally { await b.close() }
}
server.close()
const ok = R.filter((r) => r.ok).length
for (const eng of ENGINES) { const e = R.filter((r) => r.eng === eng); console.log(`${eng}: ${e.filter((r) => r.ok).length}/${e.length}`) }
console.log(`Total: ${ok}/${R.length}`)
process.exit(ok === R.length ? 0 : 1)
