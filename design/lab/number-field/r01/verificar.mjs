// Verificación de GNumberField r01 (kiwi): Chromium, Firefox y WebKit.
// Ejecutar: node design/lab/number-field/r01/verificar.mjs   (usa el Playwright de design/lab/theme-playground)
// Sirve la raíz del repo en GRANA_PW_PORT (por defecto 4209). Prototipo: componentes reales de packages/vue/dist +
// XNumberField de la página. Requiere `npm run build` previo. ENGINES=chromium,firefox VERBOSE=1 para filtrar o ver todo.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4209)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(path)
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(body)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const url = `http://127.0.0.1:${PORT}/design/lab/number-field/r01/index.html`
const report = []

for (const engine of (process.env.ENGINES || 'chromium,firefox,webkit').split(',')) {
  const b = await pw[engine].launch()
  let pass = 0; const fails = []; const notes = []; const errs = []
  let lastStep = 'inicio'
  const ok = (c, m) => { lastStep = m.slice(0, 50); if (c) pass++; else fails.push(m); if (process.env.VERBOSE) console.log(engine, c ? 'ok ' : 'NO ', m) }
  const open = async (opts = {}) => {
    const { vw = 1280, vh = 900, ...ctx } = opts
    const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
    const p = await context.newPage()
    p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(`${vw} [tras «${lastStep}»]: ${m.text()}`) })
    p.on('pageerror', (e) => errs.push(`${vw}: ${e}`))
    await p.goto(url)
    await p.waitForFunction(() => window.__nf && window.__nf.size >= 40)
    await p.waitForTimeout(120)
    return p
  }
  const st = (p, id) => p.evaluate((i) => { const r = __nf.get(i); const el = document.getElementById(i); return { text: el.value, model: r.model.value, type: r.model.value === null ? 'null' : typeof r.model.value, sel: [el.selectionStart, el.selectionEnd] } }, id)
  const setVal = async (p, id, text) => { await p.click('#' + id); await p.evaluate((i) => document.getElementById(i).select(), id); await p.keyboard.press('Backspace'); if (text) await p.keyboard.type(text) }
  const act = (p) => p.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)
  const center = async (p, sel) => { const r = await p.locator(sel).boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2] }

  // ============ 1. Carga y modelo ============
  let p = await open()
  ok((await st(p, 'c-peso')).text === '72,5' && (await st(p, 'c-pob')).text === '12.345', `Al cargar, formato del idioma de la página (es): «72,5», «12.345» (${(await st(p, 'c-peso')).text}, ${(await st(p, 'c-pob')).text})`)
  ok((await st(p, 's-value')).text === '1234,50', `precision 2 y la regla de miles de es («1234,50», sin punto en 4 cifras) (${(await st(p, 's-value')).text})`)
  ok(await p.evaluate(() => [...__nf.values()].every((r) => r.model.value === null || typeof r.model.value === 'number')), 'Todos los modelos son Number o null, nunca cadena')

  // ============ 2. Árbol accesible ============
  const snap = await p.locator('#c-form').ariaSnapshot()
  ok(/spinbutton "Peso \(opcional\)": 72,5/.test(snap), `Árbol: spinbutton con nombre y valor legible en el idioma («Peso (opcional)»: 72,5)`)
  ok(/spinbutton "Edad"\n/.test(snap + '\n') || /spinbutton "Edad"$/m.test(snap), 'Árbol: vacío = spinbutton sin valor')
  ok(/button "Restar Cantidad" \[disabled\]/.test(snap) && /button "Sumar Cantidad"/.test(snap), 'Árbol: −/+ con nombre (acción + etiqueta); − deshabilitado en el mínimo')
  ok(await p.evaluate(() => { const i = document.getElementById('c-peso'); return i.type === 'text' && i.getAttribute('role') === 'spinbutton' && i.getAttribute('inputmode') === 'decimal' && document.getElementById('c-edad').getAttribute('inputmode') === 'numeric' && i.getAttribute('dir') === 'ltr' }),
    'input type=text, role=spinbutton, inputmode decimal (peso) / numeric (edad, precision 0), dir=ltr')
  ok(await p.evaluate(() => { const ids = document.getElementById('c-peso').getAttribute('aria-describedby').split(' '); return ids[0] === 'c-peso-suffix' && document.getElementById(ids[0]).textContent === 'kilogramos' && ids[1] === 'c-peso-hint' }),
    'Descripción: la unidad (expansión «kilogramos») antes de la ayuda (#166)')
  if (engine === 'chromium') {
    const cdp = await p.context().newCDPSession(p)
    await cdp.send('Accessibility.enable')
    const ax = async (sel) => {
      const { nodes } = await cdp.send('Accessibility.queryAXTree', { backendNodeId: (await cdp.send('DOM.describeNode', { objectId: (await cdp.send('Runtime.evaluate', { expression: `document.querySelector('${sel}')` })).result.objectId })).node.backendNodeId })
      const n = nodes[0]; const props = Object.fromEntries((n.properties || []).map((x) => [x.name, x.value.value]))
      return { role: n.role?.value, name: n.name?.value, value: n.value?.value, desc: n.description?.value, ...props }
    }
    const peso = await ax('#c-peso')
    notes.push('Chromium AX «Peso»: ' + JSON.stringify(peso))
    ok(peso.role === 'spinbutton' && peso.valuemin === 0 && peso.valuemax === 400 && peso.value === 72.5 && peso.valuetext === '72,5' && /kilogramos/.test(peso.desc) && peso.editable === 'plaintext',
      'Chromium AX: spinbutton editable (plaintext), valuenow 72.5 con valuetext «72,5», valuemin/max, descripción con «kilogramos»')
    const out = await ax('#s-out')
    notes.push(`Chromium recorta aria-valuenow al rango (150 → ${out.value}); aria-valuetext conserva lo escrito («${out.valuetext}»)`)
    ok(out.invalid === 'true' && out.valuetext === '150', `Chromium AX: fuera de rango, valuetext dice lo escrito («150») aunque valuenow se recorte (${out.value}); invalid por el error de la aplicación`)
    const nat = await ax('#m-native'), aria = await ax('#m-aria'), plain = await ax('#m-plain')
    notes.push(`#270 medido en Chromium: required nativo → invalid=${nat.invalid}, required=${nat.required}; aria-required → invalid=${aria.invalid}, required=${aria.required}`)
    ok(aria.required === true && aria.invalid !== 'true', '#270: con aria-required, obligatorio y NO inválido antes de interactuar')
    ok(plain.role === 'textbox' && plain.valuenow === undefined, `Alternativa sin rol: textbox sin valor numérico ni límites en el árbol (${plain.role})`)
    const ro = await ax('#s-ro')
    notes.push('Chromium AX «Solo lectura»: ' + JSON.stringify(ro))
    ok(ro.role === 'spinbutton' && ro.focusable === true, `Chromium AX: solo lectura sigue siendo spinbutton enfocable (readonly=${ro.readonly}, editable=${ro.editable})`)
  }

  // ============ 3. Teclado ============
  await setVal(p, 'c-edad', '36')
  let s = await st(p, 'c-edad')
  ok(s.model === 36 && s.type === 'number', `Escribir «36» → modelo 36 (Number) (${JSON.stringify(s)})`)
  await p.keyboard.press('ArrowUp'); ok((await st(p, 'c-edad')).model === 37, '↑ suma step')
  await p.keyboard.press('Shift+ArrowUp'); ok((await st(p, 'c-edad')).model === 47, 'Shift+↑ suma 10 × step')
  await p.keyboard.press('PageDown'); ok((await st(p, 'c-edad')).model === 37, 'Av Pág resta 10 × step')
  await p.keyboard.press('ArrowDown'); ok((await st(p, 'c-edad')).model === 36, '↓ resta step')
  await p.keyboard.press('Home')
  s = await st(p, 'c-edad')
  ok(s.model === 36, `Inicio no cambia el valor (edición de texto) (${s.model})`)
  if (engine === 'chromium') ok(s.sel[0] === 0, `Inicio mueve el cursor al principio (${s.sel})`)
  else notes.push(`${engine} (macOS): Inicio/Fin no mueven el cursor en un campo de texto (convención del sistema); solo se comprueba que no cambian el valor`)
  await p.keyboard.press('End'); ok((await st(p, 'c-edad')).model === 36, 'Fin no cambia el valor')
  const f0 = await p.evaluate(() => window.__filtered || 0)
  await p.keyboard.type('a,e')
  s = await st(p, 'c-edad')
  ok(s.text === '36' && (await p.evaluate(() => window.__filtered)) - f0 === 3, `Edad (entero): «a», «,» y «e» no entran (${s.text})`)
  await setVal(p, 'c-edad', '150'); await p.keyboard.press('Tab')
  s = await st(p, 'c-edad')
  ok(s.model === 150 && s.text === '150', `Fuera de rango escrito: NO se recorta (modelo 150; la aplicación decide el error, #157) (${JSON.stringify(s)})`)
  await p.focus('#c-edad'); await p.keyboard.press('ArrowUp')
  ok((await st(p, 'c-edad')).model === 150, '↑ por encima de max: no cambia')
  await p.keyboard.press('ArrowDown')
  ok((await st(p, 'c-edad')).model === 120, `↓ desde fuera de rango: entra al límite (120) (${(await st(p, 'c-edad')).model})`)
  // separador y precisión
  await setVal(p, 'c-temp', '36.5')
  s = await st(p, 'c-temp')
  ok(s.text === '36,5' && s.model === 36.5, `Temperatura: «.» tecleado se convierte en «,» al instante; modelo 36.5 (${JSON.stringify(s)})`)
  await setVal(p, 'c-temp', '36,55')
  s = await st(p, 'c-temp')
  ok(s.text === '36,55' && s.model === 36.6, `precision 1: el modelo ya va redondeado (36.6) y el texto sigue crudo mientras se escribe (${JSON.stringify(s)})`)
  await p.keyboard.press('Tab')
  ok((await st(p, 'c-temp')).text === '36,6', `Al salir, el texto se redondea y formatea («36,6») (${(await st(p, 'c-temp')).text})`)
  await setVal(p, 'c-temp', '1,')
  s = await st(p, 'c-temp')
  ok(s.text === '1,' && s.model === 1, `Texto parcial «1,»: se respeta y el modelo es 1 (${JSON.stringify(s)})`)
  await p.keyboard.type(',.'); ok((await st(p, 'c-temp')).text === '1,', 'Un segundo separador no entra')
  await setVal(p, 'c-temp', '')
  ok((await st(p, 'c-temp')).model === null, 'Vacío → null')
  await p.keyboard.press('ArrowUp')
  ok((await st(p, 'c-temp')).model === 30, `Vacío + ↑ → punto de partida: 0 recortado al límite más cercano (min 30) (${(await st(p, 'c-temp')).model})`)
  await setVal(p, 'c-temp', '-'); ok((await st(p, 'c-temp')).text === '', 'Sin negativos (min ≥ 0): «-» no entra')
  // flotantes
  await setVal(p, 'c-peso', '72,5')
  for (let i = 0; i < 3; i++) await p.keyboard.press('ArrowUp')
  ok((await st(p, 'c-peso')).model === 72.8, `Pasos decimales sin error de coma flotante: 72,5 + 3 × 0,1 = 72,8 (${(await st(p, 'c-peso')).model})`)
  await setVal(p, 'c-peso', '72,53'); await p.keyboard.press('ArrowUp')
  ok((await st(p, 'c-peso')).model === 72.6, `Un paso desde fuera de la rejilla encaja en ella (72,53 → 72,6, no 72,63) (${(await st(p, 'c-peso')).model})`)
  // miles: crudo al entrar, formateado al salir
  await setVal(p, 'c-pob', '1234567'); await p.keyboard.press('Tab')
  ok((await st(p, 'c-pob')).text === '1.234.567', `Al salir, separador de miles del idioma («1.234.567») (${(await st(p, 'c-pob')).text})`)
  await p.keyboard.press('Shift+Tab')
  s = await st(p, 'c-pob')
  ok(s.text === '1234567' && s.model === 1234567, `Al entrar, texto crudo sin miles («1234567») (${s.text})`)
  // pegar
  const paste = (id, txt) => p.evaluate(([i, t]) => { const el = document.getElementById(i); el.focus(); el.select(); const dt = new DataTransfer(); dt.setData('text/plain', t); el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })) }, [id, txt])
  const synthetic = await p.evaluate(() => { const dt = new DataTransfer(); dt.setData('text/plain', 'x'); return new ClipboardEvent('paste', { clipboardData: dt }).clipboardData?.getData('text/plain') === 'x' })
  if (synthetic) {
  await paste('c-pob', '12.345'); ok((await st(p, 'c-pob')).model === 12345, `Pegar «12.345» en es → 12345 (punto de miles) (${(await st(p, 'c-pob')).model})`)
  await paste('c-peso', '1,234.5'); ok((await st(p, 'c-peso')).model === 1234.5, `Pegar «1,234.5» (formato en-US) → 1234,5 (el último separador es el decimal) (${(await st(p, 'c-peso')).model})`)
  await paste('c-peso', 'setenta'); ok((await st(p, 'c-peso')).model === 1234.5, 'Pegar texto que no es número: se ignora')
  } else {
    notes.push(`${engine}: un ClipboardEvent sintético llega sin datos; la regla de pegado se comprueba con el motor de la página (__engine.parsePasted)`)
    const r = await p.evaluate(() => { const L = __engine.loc('es'); return [__engine.parsePasted('12.345', L), __engine.parsePasted('1,234.5', L), __engine.parsePasted('setenta', L)] })
    ok(r[0] === 12345 && r[1] === 1234.5 && r[2] === null, `Regla de pegado en es: «12.345» → 12345, «1,234.5» → 1234.5, «setenta» → nada (${r})`)
    await setVal(p, 'c-pob', '12345'); await p.keyboard.press('Tab')
  }
  // Envío: FormData canónico
  await setVal(p, 'c-edad', '40'); await setVal(p, 'c-peso', '72,5'); await p.keyboard.press('Enter')
  await p.waitForTimeout(80)
  const fd = await p.textContent('#c-fd')
  ok(/edad="40"/.test(fd) && /peso="72.5"/.test(fd) && /poblacion="12345"/.test(fd), `FormData con el valor canónico (punto decimal, sin miles), no el texto del idioma (${fd})`)
  ok((await st(p, 'c-peso')).text === '72,5', 'Enter confirma (formatea) antes de enviar')

  // ============ 4. −/+ con puntero ============
  await p.focus('#c-pob')
  await p.click('#c-qty-inc')
  ok((await st(p, 'c-qty')).model === 2 && (await act(p)) === 'c-pob', `Pulsar +: suma y el foco no se mueve (sigue en ${await act(p)})`)
  await p.evaluate(() => document.activeElement.blur())
  await p.click('#c-qty-inc')
  ok((await act(p)) === 'BODY', `Sin foco previo, pulsar + no enfoca el campo (sin teclado virtual en móvil) (${await act(p)})`)
  await p.click('#c-qty-dec'); await p.click('#c-qty-dec')
  ok((await st(p, 'c-qty')).model === 1 && await p.isDisabled('#c-qty-dec'), '− hasta el mínimo y queda deshabilitado')
  let [x, y] = await center(p, '#c-qty-inc')
  await p.mouse.move(x, y); await p.mouse.down(); await p.waitForTimeout(1000); await p.mouse.up()
  const held = (await st(p, 'c-qty')).model
  await p.waitForTimeout(250)
  ok(held >= 6 && held <= 14 && (await st(p, 'c-qty')).model === held, `Mantener + 1 s: repite tras ${400}ms cada ${60}ms y se detiene al soltar (1 → ${held})`)
  await p.evaluate(() => document.getElementById('c-qty-inc').click())
  ok((await st(p, 'c-qty')).model === held + 1, 'Activación sin puntero (click de lector de pantalla, detail 0) suma un paso')
  // Tab no pasa por los botones
  await p.focus('#c-pct'); await p.keyboard.press('Tab')
  ok((await act(p)) === 'c-qty', `Tab: del campo «Descuento» al campo «Cantidad», sin pasar por −/+ (tabindex −1) (${await act(p)})`)
  // tamaños
  const sizes = await p.evaluate(() => ['xs', 'sm', 'md', 'lg', 'xl', 'compact'].map((s) => { const b = document.getElementById('z-' + s + '-inc').getBoundingClientRect(); const c = document.getElementById('z-' + s).closest('.g-input__control').getBoundingClientRect(); return [s, Math.round(b.width * 10) / 10, Math.round(b.height * 10) / 10, Math.round(c.height * 10) / 10] }))
  ok(sizes.every(([, w, h, ch]) => w >= 24 && h >= 24 && Math.abs(h - ch) <= 0.5), `−/+ ≥ 24 × 24 y de la altura de la caja en cada tamaño: ${JSON.stringify(sizes)}`)
  // ============ 5. Estados ============
  await p.focus('#s-ro'); await p.keyboard.press('ArrowUp')
  ok((await act(p)) === 's-ro' && (await st(p, 's-ro')).model === 72.5 && !(await p.$('#s-ro-inc')), 'Solo lectura: enfocable, ↑ no cambia y sin −/+')
  ok(await p.evaluate(() => document.getElementById('s-dis').disabled && document.getElementById('s-dis-inc').disabled && document.getElementById('s-dis-dec').disabled), 'Deshabilitado: campo y −/+ deshabilitados')
  ok(await p.evaluate(() => document.getElementById('s-out-inc').disabled && !document.getElementById('s-out-dec').disabled), 'Fuera de rango (150 > 120): + deshabilitado, − habilitado')
  ok(await p.evaluate(() => document.getElementById('s-neg').value === '-18' && document.getElementById('s-neg').getAttribute('inputmode') === 'numeric'), 'Negativos: «-18» y entrada numérica')

  // ============ 6. P1 sufijo pegado ============
  const gapOf = (id) => p.evaluate((i) => { const el = document.getElementById(i); const v = el.closest('.x-num__value').getBoundingClientRect(); const sf = el.closest('.g-input__control').querySelector('.g-input__suffix').getBoundingClientRect(); return Math.round((sf.left - v.right) * 10) / 10 }, id)
  const fromField = (id) => p.evaluate((i) => { const el = document.getElementById(i); const sf = el.closest('.g-input__control').querySelector('.g-input__suffix').getBoundingClientRect(); return Math.round(sf.left - el.getBoundingClientRect().left) }, id)
  const gaps = []
  for (const t of ['7', '72,5', '1234,5']) { await setVal(p, 'c-peso', t); await p.keyboard.press('Tab'); gaps.push(await gapOf('c-peso')) }
  ok(Math.max(...gaps) - Math.min(...gaps) <= 0.5 && gaps[0] <= 10, `P1: el sufijo va a la misma distancia del valor con 1, 3 o 6 caracteres (${gaps.join(', ')}px)`)
  await setVal(p, 'c-peso', '7'); await p.keyboard.press('Tab')
  const tight = await fromField('c-peso')
  await p.click('#t-glue')
  const loose = await fromField('c-peso')
  ok(tight <= 32 && loose > 150, `Con «7»: con P1 el sufijo empieza a ${tight}px del inicio del valor; sin P1 (como GInput hoy), a ${loose}px (al final de la caja)`)
  await p.click('#t-glue')
  await p.locator('#c-peso').evaluate((el) => el.blur())
  // clic en el área vacía de la caja enfoca con el cursor al final
  const ctl = await p.locator('#c-temp').evaluate((el) => { const c = el.closest('.g-input__control').getBoundingClientRect(); return [c.right - 20, c.top + c.height / 2] })
  await p.mouse.click(ctl[0], ctl[1])
  s = await st(p, 'c-temp')
  ok((await act(p)) === 'c-temp' && s.sel[0] === s.text.length, `Pulsar el área vacía de la caja enfoca el campo con el cursor al final (${await act(p)}, ${s.sel})`)

  // ============ 7. P2 cifras que ruedan ============
  await setVal(p, 'c-qty', '19'); await p.keyboard.press('Tab')
  const sampler = p.evaluate(() => new Promise((res) => {
    const root = document.getElementById('c-qty').closest('.x-num'); const out = []; const t0 = performance.now()
    ;(function f() { const sl = [...root.querySelectorAll('.x-roll__slot .x-roll__new')]; out.push({ t: performance.now() - t0, n: sl.length, tr: sl.map((e) => String(Math.round((e.getBoundingClientRect().top - e.parentElement.getBoundingClientRect().top) * 10) / 10)), val: document.getElementById('c-qty').value, rolling: !!root.querySelector('.is-rolling') }); if (performance.now() - t0 < 500) requestAnimationFrame(f); else res(out) })()
  }))
  await p.waitForTimeout(30); await p.click('#c-qty-inc')
  let fr = await sampler
  const during = fr.filter((f) => f.n > 0); if (process.env.VERBOSE) console.log(JSON.stringify(during.map((f) => [Math.round(f.t), f.tr])))
  const mids = new Set(during.map((f) => f.tr[0]).filter((t) => t !== '0'))
  ok(during.length >= 3 && during.every((f) => f.n === 2) && mids.size >= 2, `P2: al pasar de 19 a 20 ruedan solo las dos cifras que cambian (${during.length} cuadros, ${mids.size} posiciones intermedias)`)
  ok(during.every((f) => f.val === '20'), 'P2: el valor del <input> (y del árbol) ya es el nuevo desde el primer cuadro; la capa es aria-hidden')
  ok(fr.at(-1).n === 0 && !fr.at(-1).rolling && during.at(-1).t < 160 + 120, `P2: termina en ${Math.round(during.at(-1)?.t)}ms (--g-duration-press 160ms) y retira la capa`)
  await p.click('#c-qty-inc')
  const slots1 = await p.evaluate(() => document.querySelectorAll('#c-form .x-roll__slot').length)
  ok(slots1 === 1, `P2: de 20 a 21 rueda una sola cifra (${slots1})`)
  // al mantener, no rueda
  await p.waitForTimeout(300)
  ;[x, y] = await center(p, '#c-qty-inc')
  const holdS = p.evaluate(() => new Promise((res) => { let max = 0, n = 0; const t0 = performance.now(); (function f() { const k = document.querySelectorAll('#c-form .x-roll__slot').length; if (k) n++; if (performance.now() - t0 > 450) max = Math.max(max, k); if (performance.now() - t0 < 1100) requestAnimationFrame(f); else res({ n, max }) })() }))
  await p.mouse.move(x, y); await p.mouse.down(); await p.waitForTimeout(1000); await p.mouse.up()
  const hs = await holdS
  ok(hs.max === 0, `P2: al repetir (mantener +, un paso cada 60ms) las cifras van al instante, sin rodar (${JSON.stringify(hs)})`)
  await p.context().close()

  // movimiento reducido
  p = await open({ reducedMotion: 'reduce' })
  const rs = p.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); (function f() { n += document.querySelectorAll('.x-roll__slot').length; if (performance.now() - t0 < 400) requestAnimationFrame(f); else res(n) })() }))
  await p.waitForTimeout(20); await p.click('#c-qty-inc')
  ok((await rs) === 0 && (await st(p, 'c-qty')).model === 2, 'Movimiento reducido: el valor cambia sin capa de rodillo')
  await p.focus('#s-max'); await p.keyboard.press('ArrowUp')
  ok((await p.evaluate(() => window.__bumps || 0)) === 0, 'Movimiento reducido: sin tope')
  await p.context().close()

  // ============ 8. P3 tope ============
  p = await open()
  await p.focus('#s-max')
  const bumpS = p.evaluate(() => new Promise((res) => { const v = document.getElementById('s-max').closest('.x-num__value'); const y0 = v.getBoundingClientRect().top; let dy = 0, up = 0; const t0 = performance.now(); (function f() { const d = v.getBoundingClientRect().top - y0; dy = Math.max(dy, Math.abs(d)); if (d < -0.1) up++; if (performance.now() - t0 < 400) requestAnimationFrame(f); else res({ dy, up, end: v.getBoundingClientRect().top - y0 }) })() }))
  await p.waitForTimeout(20); await p.keyboard.press('ArrowUp')
  const bs = await bumpS
  ok(bs.dy > 0.5 && bs.dy <= 2.01 && bs.up > 0 && Math.abs(bs.end) < 0.01 && (await st(p, 's-max')).model === 9, `P3: ↑ en el máximo: el valor sube ≤ space × 0,5 y vuelve; el valor no cambia (máx ${bs.dy.toFixed(2)}px)`)
  await p.focus('#s-value'); const b0 = await p.evaluate(() => window.__bumps || 0); await p.keyboard.press('ArrowUp')
  ok((await p.evaluate(() => window.__bumps || 0)) === b0, 'P3: fuera del límite no hay tope')

  // ============ 9. Fila: tres pistas ============
  for (const w of [1100, 720, 320]) {
    const rows = await p.evaluate((w) => {
      const lines = new Map()
      for (const f of document.getElementById('r-row-' + w).children) {
        const c = f.querySelector('.g-input__control, .g-select__control, .g-select__field, button, [class*="__control"]').getBoundingClientRect()
        const line = f.getBoundingClientRect().top
        const k = [...lines.keys()].find((t) => Math.abs(t - line) < 40) ?? line
        if (!lines.has(k)) lines.set(k, [])
        lines.get(k).push({ id: f.id || f.className.split(' ')[0], top: c.top, h: c.height })
      }
      return [...lines.values()]
    }, w)
    const spread = rows.map((l) => Math.max(...l.map((x) => x.top)) - Math.min(...l.map((x) => x.top)))
    const hs2 = rows.flat().map((x) => x.h)
    ok(spread.every((d) => d <= 1) && Math.max(...hs2) - Math.min(...hs2) <= 1, `Fila a ${w}px: las cajas de cada línea comparten top (±1px: ${spread.map((d) => d.toFixed(2)).join(', ')}) y altura (${Math.min(...hs2).toFixed(1)}–${Math.max(...hs2).toFixed(1)})`)
  }
  // ============ 10. RTL ============
  const rtl = await p.evaluate(() => { const i = document.getElementById('rtl-ar'); const c = i.closest('.g-input__control').getBoundingClientRect(); const st = document.getElementById('rtl-ar-inc').closest('.x-num__steppers').getBoundingClientRect(); const v = i.closest('.x-num__value').getBoundingClientRect(); return { text: i.value, dir: getComputedStyle(i).direction, stepLeft: st.left - c.left, valueRight: c.right - v.right } })
  ok(rtl.text === '-٤٫٥' && rtl.dir === 'ltr', `RTL ar-EG: «-٤٫٥» (cifras arábigo-índicas, menos delante: input dir=ltr) (${rtl.text})`)
  ok(rtl.stepLeft <= 1 && rtl.valueRight < 20, `RTL: −/+ al final lógico (izquierda) y el valor al principio (derecha) (${JSON.stringify(rtl)})`)
  await setVal(p, 'rtl-ar', '٣٫٥'); await p.keyboard.press('Tab')
  s = await st(p, 'rtl-ar')
  ok(s.model === 3.5 && s.text === '٣٫٥', `RTL ar-EG: escribir «٣٫٥» → modelo 3.5; al salir «٣٫٥» (${JSON.stringify(s)})`)
  await setVal(p, 'rtl-ar', '-7'); await p.keyboard.press('Tab')
  s = await st(p, 'rtl-ar')
  ok(s.model === -7 && s.text === '-٧٫٠', `RTL ar-EG: cifras latinas tecleadas se aceptan y salen en las del idioma con su precisión («-7» → «-٧٫٠») (${s.text})`)
  ok((await st(p, 'rtl-he')).text === '72.5', `he: «72.5» (punto decimal del idioma, sin marca LRM en el campo) (${JSON.stringify((await st(p, 'rtl-he')).text)})`)

  // ============ 11. Envío con GForm ============
  await p.click('#e-save'); await p.waitForTimeout(60)
  ok(/invalid · edad, dosis/.test(await p.textContent('#e-out')), 'Envío vacío: invalid con los dos campos')
  ok(await p.evaluate(() => document.getElementById('e-edad').getAttribute('aria-invalid') === 'true' && document.getElementById('e-edad').closest('.g-input').classList.contains('is-invalid')), 'Error visible: aria-invalid en el spinbutton e is-invalid en la raíz')
  const rej = await p.evaluate(() => ['e-edad', 'e-dosis'].map((i) => document.getElementById(i).closest('.g-input').classList.contains('is-rejected') || document.getElementById(i).closest('.g-input').getAnimations({ subtree: true }).some((a) => a.animationName?.startsWith('g-reject'))))
  ok(rej.every(Boolean), `is-rejected (I2 real) llega a los dos campos (${rej})`)
  await setVal(p, 'e-edad', '150'); await p.keyboard.press('Tab'); await p.waitForTimeout(30)
  ok(/entre 0 y 120/.test(await p.textContent('#e-edad-message')), 'La aplicación calcula el error de rango desde el Number; GForm lo muestra')
  await setVal(p, 'e-edad', '50'); await p.click('#e-dosis-inc'); await p.click('#e-save'); await p.waitForTimeout(60)
  ok(/submit · edad="50"\s+dosis="0"/.test(await p.textContent('#e-out')), `Corregido y dosis con +: submit con valores canónicos (${await p.textContent('#e-out')})`)
  await p.context().close()

  // ============ 12. Táctil (puntero grueso) ============
  if (engine !== 'firefox') {
    p = await open({ hasTouch: true, isMobile: engine === 'chromium' })
    const coarse = await p.evaluate(() => matchMedia('(pointer: coarse)').matches)
    if (coarse) {
      const t = await p.evaluate(() => ['xs', 'md'].map((s) => { const b = document.getElementById('z-' + s + '-inc').getBoundingClientRect(); return [b.width, b.height] }))
      ok(t.every(([w, h]) => w >= 44 && h >= 44), `Puntero grueso: −/+ ≥ 44 × 44 (${JSON.stringify(t)})`)
      await p.tap('#c-qty-inc')
      ok((await st(p, 'c-qty')).model === 2 && (await act(p)) === 'BODY', 'Toque en +: suma y no enfoca el campo (no abre el teclado)')
    } else notes.push(`${engine}: hasTouch no activa pointer: coarse; táctil no medido aquí`)
    await p.context().close()
  } else notes.push('Firefox: sin emulación de puntero grueso en Playwright; táctil medido en Chromium y WebKit')

  // ============ 13. 320 sin desborde ============
  p = await open({ vw: 360, vh: 800 })
  const ov = await p.evaluate(() => { const fr = document.getElementById('n-frame').getBoundingClientRect(); const bad = [...document.querySelectorAll('#n-frame .g-input')].filter((e) => { const r = e.getBoundingClientRect(); return r.left < fr.left - 0.5 || r.right > fr.right + 0.5 }).map((e) => e.querySelector('input').id); const ctl = [...document.querySelectorAll('#n-frame .g-input__control')].filter((c) => c.scrollWidth > c.clientWidth + 1).length; return { bad, ctl, doc: document.documentElement.scrollWidth - innerWidth } })
  ok(ov.bad.length === 0 && ov.ctl === 0 && ov.doc <= 0, `320px: ningún campo sale del marco ni desborda su caja; sin desplazamiento horizontal (${JSON.stringify(ov)})`)
  const big = await p.evaluate(() => { const i = document.getElementById('n-pob'); const s = i.closest('.g-input__control').querySelector('.g-input__suffix').getBoundingClientRect(); const c = i.closest('.g-input__control').getBoundingClientRect(); return s.right <= c.right + 0.5 })
  ok(big, 'P1 a 320px: con número largo el sufijo sigue dentro de la caja (el valor se recorta antes que la unidad)')
  await p.context().close()

  ok(errs.length === 0, `Consola limpia (${errs.length}: ${errs.slice(0, 3).join(' | ')})`)
  await b.close()
  report.push({ engine, pass, fails, notes })
}
server.close()
let total = 0, failed = 0
for (const r of report) {
  total += r.pass + r.fails.length; failed += r.fails.length
  console.log(`\n== ${r.engine}: ${r.pass}/${r.pass + r.fails.length}`)
  r.fails.forEach((f) => console.log('  NO ' + f))
  r.notes.forEach((n) => console.log('  · ' + n))
}
console.log(`\nTotal: ${total - failed}/${total}`)
process.exit(failed ? 1 : 0)
