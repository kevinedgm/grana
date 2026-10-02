// Verificación de iconos públicos r01 (kiwi), Chromium. Ejecutar desde la raíz: node design/lab/icons/r01/verificar.mjs
// (usa el Playwright de design/lab/theme-playground; sirve la raíz del repo por HTTP porque el prototipo importa
// módulos ES de node_modules/lucide-static y lee packages/vue/scripts/icons.json)
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const { chromium } = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = resolve(fileURLToPath(new URL('../../../../', import.meta.url)))
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css' }
const server = createServer(async (req, res) => {
  const path = resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!path.startsWith(ROOT + sep)) { res.writeHead(403).end(); return }
  try { const body = await readFile(path); res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(body) } catch { res.writeHead(404).end() }
}).listen(0)
const url = `http://127.0.0.1:${server.address().port}/design/lab/icons/r01/index.html`

const b = await chromium.launch()
let pass = 0; const fails = []
const ok = (c, m) => { if (c) pass++; else fails.push(m) }
const errs = []
const open = async (vw) => {
  const p = await b.newPage({ viewport: { width: vw, height: 900 } })
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(vw + ': ' + m.text()) })
  p.on('pageerror', (e) => errs.push(vw + ': ' + String(e)))
  p.on('requestfailed', (r) => errs.push(vw + ': falla ' + r.url()))
  p.on('response', (r) => { if (r.status() >= 400) errs.push(vw + ': ' + r.status() + ' ' + r.url()) })
  await p.goto(url); await p.waitForFunction(() => window.__ready === true); return p
}

const p = await open(1280)

// 1) Árbol de accesibilidad real (CDP): cada icono de los ejemplos frente a lo esperado
const cdp = await p.context().newCDPSession(p)
await cdp.send('DOM.enable'); await cdp.send('Accessibility.enable')
const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true })
const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: 'svg[data-expect]' })
const expected = await p.$$eval('svg[data-expect]', (els) => els.map((e) => ({ icon: e.dataset.icon, expect: e.dataset.expect })))
const axLines = []
for (let i = 0; i < nodeIds.length; i++) {
  const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId: nodeIds[i], fetchRelatives: false })
  const n = nodes[0]; const e = expected[i]
  const got = n.ignored ? 'oculto' : `${n.role?.value}:${n.name?.value}`
  axLines.push(`${e.icon.padEnd(14)} esperado ${e.expect.padEnd(26)} real ${got}`)
  if (e.expect === 'oculto') ok(n.ignored, `${e.icon}: debería estar fuera del árbol, es ${got}`)
  else ok(!n.ignored && n.role?.value === 'image' && 'img:' + n.name?.value === e.expect, `${e.icon}: se esperaba ${e.expect}, es ${got}`)
}
ok(nodeIds.length >= 20, 'iconos con expectativa: ' + nodeIds.length)
const named = expected.filter((e) => e.expect.startsWith('img:')).map((e) => e.expect)
ok(JSON.stringify(named) === JSON.stringify(['img:Bloqueado', 'img:Edición permitida']), 'solo los dos iconos de la tabla tienen nombre: ' + named)

// Botones: nombre real (CDP) — solo icono: el del botón; con texto (y con label mal puesto): solo el texto
const axOf = async (sel) => {
  const { root: r } = await cdp.send('DOM.getDocument', { depth: -1 })
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: r.nodeId, selector: sel })
  const n = (await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false })).nodes[0]
  return `${n.role?.value}:${n.name?.value}`
}
ok(await axOf('[data-case="btn-icono"]') === 'button:Desbloquear', 'GBtn icon: button «Desbloquear»')
ok(await axOf('[data-case="btn-texto"]') === 'button:Permitir edición', 'botón con icono decorativo: solo el texto')
ok(await axOf('[data-case="btn-mal"]') === 'button:Permitir edición', 'label dentro del hueco aria-hidden: se pierde (por eso el aviso)')
// Encabezado con icono decorativo: nombre solo el texto
ok(await p.getByRole('heading', { name: 'Antes de empezar', exact: true }).count() === 1, 'encabezado con icono: nombre «Antes de empezar»')
ok(await p.getByRole('heading', { name: 'Bloqueo de edición', exact: true }).count() === 1, 'sección con lead: nombre «Bloqueo de edición»')
// Pestañas desde datos: icono decorativo; la que no tiene icono, sin hueco
ok(await p.getByRole('tab', { name: 'Ubicación', exact: true }).count() === 1, 'pestaña «Ubicación» con nombre exacto')
ok(await p.$$eval('#tabs .wf-tab', (t) => t.map((x) => Boolean(x.querySelector('.g-tabs__icon svg'))).join()) === 'true,true,true,true,false', 'icono por nombre en 4 pestañas; «Notas» sin hueco')

// 2) Registro: nombres derivados de lucide-static, rechazos y sin inyección
const reg = await p.$$eval('#reg-table tbody tr', (rs) => rs.map((r) => [r.cells[0].textContent, r.cells[1].textContent, r.dataset.reg]))
const regOk = Object.fromEntries(reg.map(([l, n, s]) => [l, n + ':' + s]))
ok(regOk.LockOpen === 'lock-open:ok' && regOk['Unlock (alias)'] === 'lock-open:ok' && regOk.MapPin === 'map-pin:ok' && regOk.Image === 'image:ok' && regOk.Play === 'play:ok', 'nombres derivados de la marca de lucide-static: ' + JSON.stringify(regOk))
ok(regOk.Lock === 'lock:ok', 'registrar un icono que ya trae la librería se acepta')
ok(regOk['un SVG escrito a mano'].endsWith(':no') && regOk['un SVG con script disfrazado de Lucide'].endsWith(':no') && regOk["'lock-open' (texto)"].endsWith(':no'), 'rechazos: a mano, script disfrazado, texto')
ok(await p.evaluate(() => window.__pwned === undefined && !document.querySelector('main script, svg [onload]')), 'la cadena con script no se ejecutó ni entró al DOM')
// Lo dibujado desde el registro es exactamente lo de lucide-static
const same = await p.evaluate(async () => {
  const m = await import('../../../../node_modules/lucide-static/dist/esm/icons/map-pin.mjs')
  const inner = m.default.slice(m.default.indexOf('>', m.default.indexOf('<svg')) + 1, m.default.lastIndexOf('</svg>'))
  const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); tmp.innerHTML = inner
  // misma lista de elementos y atributos (los espacios entre etiquetas de la cadena original no cuentan)
  const sig = (svg) => [...svg.children].map((c) => c.tagName + [...c.attributes].map((a) => a.name + '=' + a.value).sort().join(',')).join('|')
  return sig(document.querySelector('svg[data-icon="map-pin"]')) === sig(tmp) && tmp.children.length > 0
})
ok(same, 'map-pin dibujado = trazos de lucide-static')

// 3) Avisos de desarrollo esperados (en el panel, no en la consola)
const warns = await p.evaluate(() => window.__devWarnings.map((w) => w.key))
for (const k of ['name-search', 'label-hidden-lock-open', 'reg-un SVG escrito a mano', 'reg-un SVG con script disfrazado de Lucide', "reg-'lock-open' (texto)"]) ok(warns.includes(k), 'aviso esperado: ' + k)
ok(warns.length === 5, 'sin avisos de más: ' + warns.join(' | '))
ok(await p.$$eval('#devlog li', (l) => l.length) === 5, 'panel de avisos con 5 entradas')

// 4) Tamaño, color y RTL
const sz = await p.$eval('svg[data-case="vacio"]', (e) => [e.getBoundingClientRect().width, e.getBoundingClientRect().height])
ok(sz[0] === 48 && sz[1] === 48, 'clase de la aplicación gana a :where(.g-icon): ' + sz)
const em = await p.$eval('.prose-ic svg', (e) => [e.getBoundingClientRect().width, parseFloat(getComputedStyle(e.parentElement).fontSize)])
ok(em[0] === em[1], 'sin clase, 1em del texto: ' + em)
const col = await p.$eval('.wf-btn--primary svg', (e) => [getComputedStyle(e).color, getComputedStyle(e.closest('button')).color])
ok(col[0] === col[1], 'currentColor hereda el color del botón: ' + col)
const tf = await p.$$eval('svg[data-flip]', (els) => Object.fromEntries(els.map((e) => [e.dataset.flip, getComputedStyle(e).transform])))
ok(tf.ltr === 'none' && tf.rtl === 'matrix(-1, 0, 0, 1, 0, 0)' && tf['rtl-sin'] === 'none', 'flip-rtl solo espeja en RTL y solo donde se pide: ' + JSON.stringify(tf))

// 5) Interacción: bloqueo y teclado de pestañas
await p.click('#lock-toggle')
ok(await p.$eval('#lock-state', (e) => e.textContent.trim() + '|' + e.querySelector('svg').dataset.icon) === 'Edición permitida|lock-open', 'interruptor: texto y lock-open')
await p.focus('#tab-fotos'); await p.keyboard.press('ArrowRight')
ok(await p.evaluate(() => document.activeElement.id) === 'tab-ubic', 'flecha derecha mueve a «Ubicación»')

// 6) Móvil: sin desplazamiento horizontal
const m = await open(375)
ok(await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), '375 px sin desplazamiento horizontal')

ok(errs.length === 0, 'consola limpia: ' + errs.join(' | '))
await b.close(); server.close()
console.log(axLines.join('\n'))
console.log(`\n${pass} correctas, ${fails.length} fallos`)
for (const f of fails) console.log('FALLO ' + f)
process.exit(fails.length ? 1 : 0)
