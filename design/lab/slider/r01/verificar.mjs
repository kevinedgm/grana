// Verificación del deslizador (kiwi, r01): la base y los conceptos A, B y C, en Chromium, Firefox y WebKit.
// Ejecutar: node design/lab/slider/r01/verificar.mjs   (solo puerto 4212; ENGINES=chromium,firefox,webkit; PARTS=base,A,B,C; VERBOSE=1)
// Requiere packages/vue/dist (npm run build). Solo lee; no toca packages/.
import { serve, pw } from './serve.mjs'

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'base,A,B,C').split(',')
const V = !!process.env.VERBOSE
const R = []
const NOTES = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok, info }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info ? ' · ' + info : ''}`) }

const { server, base } = await serve()

const H = () => {
  window.__rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  window.__ratio = (a, b) => { const L1 = __lum(__rgb(a)), L2 = __lum(__rgb(b)); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05) }
  window.__bgOf = (el) => { for (let a = el; a; a = a.parentElement) { const c = getComputedStyle(a).backgroundColor; if (__rgb(c)[3] > 0.95) return c } return 'rgb(255,255,255)' }
}

async function open(b, path, opts = {}) {
  const { vw = 1100, vh = 1400, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(base + path)
  await p.waitForFunction(() => window.__ready && window.__sl && window.__sl.size > 0)
  await p.evaluate(H)
  await p.waitForTimeout(250)
  p.__errs = errs
  return p
}
const model = (p) => p.evaluate(() => JSON.parse(document.querySelector('#out-model').textContent))
const attr = (p, sel, a) => p.evaluate(([s, x]) => document.querySelector(s).getAttribute(x), [sel, a])
const nbsp = (s) => (s == null ? s : s.replace(/[\s  ]/g, ' '))
const rootOf = (id) => `.x-sl:has(#${id})`
const box = (p, sel) => p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 } }, sel)
const noOverflow = (p) => p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
const press = async (p, sel, keys) => { await p.focus(sel); for (const k of [].concat(keys)) await p.keyboard.press(k) }
const changes = (p, k) => p.evaluate((key) => document.querySelector('#out-log').textContent.split('\n').filter((l) => l.startsWith(`change ${key} `)).length, k)
// Puntero táctil sintético (la lógica del componente mira pointerType; el desplazamiento real lo decide touch-action)
const synth = (p, sel, steps) => p.evaluate(([s, st]) => {
  const el = document.querySelector(s)
  for (const [type, x, y] of st) el.dispatchEvent(new PointerEvent(type, { pointerType: 'touch', pointerId: 7, isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y, bubbles: true, cancelable: true }))
}, [sel, steps])
const ringOn = (p, id) => p.evaluate((i) => { const t = document.getElementById(i).parentElement; const cs = getComputedStyle(t); return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 }, id)

// ===================================================== BASE =====================================================
async function partBase(b, eng) {
  const ck = (n, ok, i) => rec(eng, 'base', n, ok, i)
  let p = await open(b, '/index.html?v=base')

  // Semántica
  const s = await p.evaluate(() => { const i = document.querySelector('#s-vol'); return { type: i.type, step: i.getAttribute('step'), min: i.min, max: i.max, vt: i.getAttribute('aria-valuetext'), name: i.name, label: document.querySelector('label[for=s-vol]') !== null } })
  ck('cada asa es un input type=range nativo (step="any", sin name)', s.type === 'range' && s.step === 'any' && s.name === '' && s.label, JSON.stringify(s))
  ck('el nativo ocupa el interior del asa (el foco de VoiceOver dibuja el asa, no un punto de 1px)', await p.evaluate(() => { const n = document.querySelector('#s-vol'); const i = n.getBoundingClientRect(); const t = n.parentElement; return Math.abs(i.width - t.clientWidth) < 1 && Math.abs(i.height - t.clientHeight) < 1 && i.width >= 16 }))
  ck('aria-valuetext con el formato del idioma («40 %»)', /^40\s?%$/.test(nbsp(s.vt)), s.vt)
  ck('rol slider con el nombre de la etiqueta', await p.getByRole('slider', { name: /^Volumen de los avisos/ }).count() === 1)
  ck('rango: group «Precio» con dos slider «Precio mínimo» y «Precio máximo»', await p.getByRole('group', { name: /^Precio/ }).count() === 1 && await p.getByRole('slider', { name: /Precio.*mínimo/ }).count() === 1 && await p.getByRole('slider', { name: /Precio.*máximo/ }).count() === 1)
  const lim = await p.evaluate(() => [document.querySelector('#s-precio').max, document.querySelector('#s-precio-end').min])
  ck('rango: límites dinámicos (inicio ≤ fin − minGap; fin ≥ inicio + minGap)', lim[0] === '2300' && lim[1] === '900', lim.join(' '))
  const hid = await p.evaluate(() => [...document.querySelectorAll('#f-base input[type=hidden]')].map((h) => `${h.name}=${h.value}${h.disabled ? '(off)' : ''}`).join(' '))
  ck('envío canónico en ocultos (uno por asa; sin elegir = "")', hid.includes('volumen=40') && hid.includes('dolor=') && hid.includes('precio=800 precio=2400') && hid.includes('brillo=60(off)'), hid)

  // Teclado (APG): flechas, Mayús, Re Pág/Av Pág, Inicio/Fin
  const seq = []
  await p.focus('#s-vol')
  for (const k of ['ArrowRight', 'ArrowUp', 'ArrowLeft', 'Shift+ArrowRight', 'PageUp', 'PageDown', 'ArrowDown', 'Home', 'End', 'ArrowRight']) { await p.keyboard.press(k); seq.push((await model(p)).vol) }
  ck('teclado: → ↑ ← Mayús+→ RePág AvPág ↓ Inicio Fin → = 45 50 45 55 65 55 50 0 100 100', seq.join(' ') === '45 50 45 55 65 55 50 0 100 100', seq.join(' '))
  ck('change: una vez por pulsación', await changes(p, 'volumen') === 9, String(await changes(p, 'volumen')))
  ck('aria-valuetext sigue al valor («100 %»)', /^100\s?%$/.test(nbsp(await attr(p, '#s-vol', 'aria-valuetext'))))

  // Rango que no se cruza
  await press(p, '#s-precio', 'End')
  let m = await model(p)
  ck('rango: Fin en el inicio se detiene en fin − minGap (2300)', m.precio[0] === 2300 && m.precio[1] === 2400, JSON.stringify(m.precio))
  await press(p, '#s-precio-end', ['Home'])
  m = await model(p)
  ck('rango: Inicio en el fin se detiene en inicio + minGap (2400)', m.precio[1] === 2400, JSON.stringify(m.precio))
  await press(p, '#s-precio', ['Home'])
  await press(p, '#s-precio-end', ['ArrowLeft', 'ArrowLeft'])
  m = await model(p)
  ck('rango: cada asa con su teclado (fin − 2 pasos = 2300)', m.precio[0] === 0 && m.precio[1] === 2300, JSON.stringify(m.precio))

  // Rejilla de marcas
  await press(p, '#s-pag', ['ArrowRight'])
  const pg1 = (await model(p)).pag
  await press(p, '#s-pag', ['ArrowRight', 'ArrowRight'])
  const pg2 = (await model(p)).pag
  ck('snap="marks": las flechas van de marca en marca (25 → 50 → 100, y se queda)', pg1 === 50 && pg2 === 100, `${pg1} ${pg2}`)

  // Puntero (ratón): clic en el riel, en una marca, arrastre con un solo change
  let area = await box(p, `${rootOf('s-vol')} .x-sl__area`)
  await p.mouse.click(5, 5)
  await p.mouse.click(area.x + area.w * 0.75, area.cy)
  ck('clic en el riel: el asa salta (75)', (await model(p)).vol === 75, String((await model(p)).vol))
  const before = await changes(p, 'volumen')
  await p.mouse.move(area.x + area.w * 0.75, area.cy); await p.mouse.down()
  for (let k = 1; k <= 6; k++) await p.mouse.move(area.x + area.w * (0.75 - k * 0.05), area.cy)
  await p.mouse.up()
  ck('arrastre: el valor sigue al puntero (45) y emite un solo change', (await model(p)).vol === 45 && await changes(p, 'volumen') === before + 1, `${(await model(p)).vol} · ${(await changes(p, 'volumen')) - before}`)
  ck('foco en el asa tras el clic, sin anillo (no fue teclado)', await p.evaluate(() => document.activeElement.id) === 's-vol' && !(await ringOn(p, 's-vol')))
  await p.keyboard.press('ArrowRight')
  ck('anillo en cuanto se usa el teclado (data-g-key-focus)', await ringOn(p, 's-vol'))
  // WebKit (como Safari sin «Tab resalta cada elemento») salta el range con Tab, igual que casillas y botones: Opción+Tab
  await p.focus('a[href="?v=base&dir=rtl"]'); await p.keyboard.press(eng === 'webkit' ? 'Alt+Tab' : 'Tab')
  ck(eng === 'webkit' ? 'anillo al llegar con Opción+Tab (Tab solo lo salta, como a casillas y botones)' : 'anillo al llegar con Tab', await p.evaluate(() => document.activeElement.id) === 's-vol' && await ringOn(p, 's-vol'))
  const mark = await box(p, `${rootOf('s-dolor')} .x-sl__mark[data-value="5"] > span`)
  await p.mouse.click(mark.cx, mark.cy)
  ck('clic en el nombre de una marca: «Moderado» = 5', (await model(p)).dolor === 5, String((await model(p)).dolor))
  ck('valuetext con el nombre de la marca («5, Moderado»)', await attr(p, '#s-dolor', 'aria-valuetext') === '5, Moderado')
  const desc = await attr(p, '#s-dolor', 'aria-describedby')
  ck('aria-describedby = ayuda', desc && desc.includes('s-dolor-hint'), desc)

  // Ajuste de un lector móvil: el nativo cambia solo y llega `input` → un paso en esa dirección
  await p.evaluate(() => { const i = document.querySelector('#s-vol'); i.value = String(Number(i.value) + 0.4); i.dispatchEvent(new Event('input', { bubbles: true })) })
  ck('ajuste del lector (input sin tecla): un paso en esa dirección (50 → 55)', (await model(p)).vol === 55, String((await model(p)).vol))

  // Solo lectura y deshabilitado
  await p.focus('#s-edad'); await p.keyboard.press('ArrowRight')
  const ab = await box(p, `${rootOf('s-edad')} .x-sl__area`)
  await p.mouse.click(ab.x + ab.w * 0.9, ab.cy)
  m = await model(p)
  ck('solo lectura: enfocable, aria-readonly, ni teclado ni puntero cambian', JSON.stringify(m.edad) === '[30,45]' && await attr(p, '#s-edad', 'aria-readonly') === 'true' && await p.evaluate(() => document.activeElement.id.startsWith('s-edad')), JSON.stringify(m.edad))
  const dis = await p.evaluate(() => ({ d: document.querySelector('#s-brillo').disabled, focus: (document.querySelector('#s-brillo').focus(), document.activeElement.id) }))
  ck('deshabilitado: disabled nativo, no enfocable', dis.d && dis.focus !== 's-brillo')

  // Sin elegir y GForm: error, resumen y foco; después FormData
  p = await open(b, '/index.html?v=base')
  ck('sin elegir: valuetext «Sin elegir», sin relleno', await attr(p, '#s-dolor', 'aria-valuetext') === 'Sin elegir' && await p.locator(`${rootOf('s-dolor')} .x-sl__fill`).count() === 0)
  await p.click('#b-base')
  await p.waitForTimeout(150)
  const sumFocus = await p.evaluate(() => !!document.activeElement.closest('.g-error-summary'))
  await p.focus('.g-error-summary a[href="#s-dolor"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(100)
  ck('Intro en el enlace del resumen: foco en el asa con anillo', await p.evaluate(() => document.activeElement.id) === 's-dolor' && await ringOn(p, 's-dolor'))
  const err = await p.evaluate(() => ({ act: document.activeElement.id, inv: document.querySelector('#s-dolor').getAttribute('aria-invalid'), msg: document.querySelector('.x-sl:has(#s-dolor) .x-sl__message').textContent, sent: document.querySelector('#out-sent').textContent, link: [...document.querySelectorAll('.g-error-summary a')].map((a) => a.getAttribute('href')).join(' ') }))
  ck('enviar sin elegir: no se envía, foco al resumen y su enlace lleva al asa; aria-invalid y mensaje', sumFocus && err.act === 's-dolor' && err.inv === 'true' && /Indica la intensidad/.test(err.msg) && /^Envía/.test(err.sent) && err.link.includes('#s-dolor'), JSON.stringify(err))
  ck('mensaje con icono Lucide (svg) y describedby', await p.locator(`${rootOf('s-dolor')} .x-sl__message svg`).count() === 1 && (await attr(p, '#s-dolor', 'aria-describedby')).includes('-message'))
  await p.keyboard.press('ArrowUp')
  ck('sin elegir + ↑ = el mínimo (0); el error se va', (await model(p)).dolor === 0 && await attr(p, '#s-dolor', 'aria-invalid') === null, String((await model(p)).dolor))
  await p.keyboard.press('ArrowRight')
  await p.click('#b-base'); await p.waitForTimeout(150)
  const sent = await p.evaluate(() => document.querySelector('#out-sent').textContent)
  ck('FormData: canónico, dos entradas por rango, solo lectura sí, deshabilitado no', sent.includes('volumen="40"') && sent.includes('dolor="1"') && sent.includes('precio="800"  precio="2400"') && sent.includes('edad="30"  edad="45"') && !sent.includes('brillo'), sent)

  // GFormRow: la caja del vecino y el riel comparten centro; etiquetas alineadas
  for (const vw of [1100, 720, 320]) {
    const q = await open(b, '/index.html?v=base', { vw })
    const r = await q.evaluate(() => {
      const c = (s) => { const r = document.querySelector(s).getBoundingClientRect(); return r.top + r.height / 2 }
      const bot = (s) => document.querySelector(s).getBoundingClientRect().bottom
      return {
        d1: Math.abs(c('#row-1 .g-input__control') - c('.x-sl:has(#s-dosis) .x-sl__track')),
        d2: Math.abs(c('#row-2 .g-input__control') - c('.x-sl:has(#s-vol2) .x-sl__track')),
        l1: Math.abs(bot('#row-1 .g-input__label') - bot('.x-sl:has(#s-dosis) .x-sl__head')),
        lines: document.querySelector('#row-1').getAttribute('data-lines')
      }
    })
    if (vw === 320) ck('320px: sin desbordamiento horizontal', await noOverflow(q))
    else ck(`fila a ${vw}px: centro del riel = centro de la caja vecina (Δ ≤ 1px) y etiquetas abajo alineadas`, r.d1 <= 1 && r.d2 <= 1 && r.l1 <= 1.5, JSON.stringify(r))
    await q.context().close()
  }

  // RTL: el riel se invierte y ← sube
  const r = await open(b, '/index.html?v=base&dir=rtl', { vw: 900 })
  const f = await r.evaluate(() => { const t = document.querySelector('.x-sl:has(#s-vol) .x-sl__thumb').getBoundingClientRect(); const a = document.querySelector('.x-sl:has(#s-vol) .x-sl__area').getBoundingClientRect(); return (a.right - (t.left + t.width / 2)) / a.width })
  ck('RTL: el 40 % está a 40 % desde la derecha', Math.abs(f - 0.4) < 0.01, f.toFixed(3))
  await press(r, '#s-vol', ['ArrowLeft'])
  const up = (await model(r)).vol
  await press(r, '#s-vol', ['ArrowRight', 'ArrowRight'])
  ck('RTL: ← sube (45) y → baja (35)', up === 45 && (await model(r)).vol === 35, `${up} ${(await model(r)).vol}`)
  ck('RTL: 320px sin desbordamiento', await (async () => { await r.setViewportSize({ width: 320, height: 900 }); await r.waitForTimeout(100); return noOverflow(r) })())
  ck('consola limpia (LTR y RTL)', !p.__errs.length && !r.__errs.length, [...p.__errs, ...r.__errs].join(' | '))
  await r.context().close()

  // Táctil: toque = salto; gesto vertical = desplazar (sin cambio); área ≥ 44px; touch-action pan-y
  const ctxT = eng === 'firefox' ? null : { hasTouch: true, isMobile: eng === 'chromium' }
  if (ctxT) {
    const t = await open(b, '/index.html?v=base', { vw: 390, vh: 900, ...ctxT })
    const coarse = await t.evaluate(() => matchMedia('(pointer: coarse)').matches)
    const a2 = await box(t, `${rootOf('s-vol')} .x-sl__area`)
    const hit = await t.evaluate(() => { const th = document.querySelector('.x-sl:has(#s-vol) .x-sl__thumb'); const cs = getComputedStyle(th, '::after'); return [parseFloat(cs.width), parseFloat(cs.height)] })
    if (coarse) ck('puntero grueso: área del asa ≥ 44×44 y alto del riel ≥ 44', hit[0] >= 44 && hit[1] >= 44 && a2.h >= 44, `${hit} · ${a2.h}`)
    ck('touch-action: pan-y en el área', await t.evaluate(() => getComputedStyle(document.querySelector('.x-sl__area')).touchAction) === 'pan-y')
    await synth(t, `${rootOf('s-vol')} .x-sl__area`, [['pointerdown', a2.x + a2.w * 0.2, a2.cy], ['pointermove', a2.x + a2.w * 0.2 + 2, a2.cy + 30], ['pointerup', a2.x + a2.w * 0.2 + 2, a2.cy + 30]])
    const v1 = (await model(t)).vol
    await synth(t, `${rootOf('s-vol')} .x-sl__area`, [['pointerdown', a2.x + a2.w * 0.2, a2.cy], ['pointerup', a2.x + a2.w * 0.2 + 3, a2.cy + 2]])
    const v2 = (await model(t)).vol
    ck('táctil: un gesto vertical sobre el riel no cambia nada (40); un toque salta (20)', v1 === 40 && v2 === 20, `${v1} ${v2}`)
    await t.context().close()
  }

  // Movimiento reducido: el salto no se anima
  const rm = await open(b, '/index.html?v=base', { reducedMotion: 'reduce' })
  const ar = await box(rm, `${rootOf('s-vol')} .x-sl__area`)
  await rm.mouse.click(ar.x + ar.w * 0.9, ar.cy)
  const tp = await rm.evaluate(() => getComputedStyle(document.querySelector('.x-sl:has(#s-vol) .x-sl__thumb')).transitionProperty)
  ck('prefers-reduced-motion: el asa no se desliza al saltar', !/inset/.test(tp), tp)
  await rm.context().close()

  // El nativo a secas (nota de diseño, no criterio)
  const n = await open(b, '/index.html?v=base')
  const nat = {}
  for (const k of ['PageUp', 'ArrowRight']) { await n.evaluate(() => { const i = document.querySelector('#native'); i.value = '500' }); await n.focus('#native'); await n.keyboard.press(k); nat[k] = Number(await n.evaluate(() => document.querySelector('#native').value)) - 500 }
  // Lo que el nativo no resuelve: readonly no existe en range; un min dinámico mueve la rejilla; en RTL, → baja
  await n.evaluate(() => { const s = document.querySelector('#case-native'); s.insertAdjacentHTML('beforeend', '<input id="n-ro" type="range" min="0" max="100" value="50" readonly><input id="n-grid" type="range" min="0" max="100" step="5" value="50"><div dir="rtl"><input id="n-rtl" type="range" min="0" max="100" value="50"></div>') })
  await n.focus('#n-ro'); await n.keyboard.press('ArrowRight')
  nat.ro = await n.evaluate(() => document.querySelector('#n-ro').value)
  nat.grid = await n.evaluate(() => { const i = document.querySelector('#n-grid'); i.min = '23'; i.value = '50'; return i.value })
  await n.focus('#n-rtl'); await n.keyboard.press('ArrowRight')
  nat.rtl = await n.evaluate(() => document.querySelector('#n-rtl').value)
  NOTES.push(`${eng}: nativo 0–1000, Re Pág = +${nat.PageUp}, → = +${nat.ArrowRight}; readonly + → = ${nat.ro} (no se respeta); paso 5 con min 23 → 50 se vuelve ${nat.grid} (la rejilla cuenta desde min); RTL + → = ${nat.rtl}`)
  await n.context().close()
  await p.context().close()
}

// ===================================================== A =====================================================
async function partA(b, eng) {
  const ck = (n, ok, i) => rec(eng, 'A', n, ok, i)
  const p = await open(b, '/index.html?v=A')
  const big = await p.evaluate(() => document.querySelector('.x-sl:has(#a-peso) .x-sl__big').textContent)
  ck('lectura grande con el idioma de la página (es-MX «72.4 kg») = aria-valuetext', nbsp(big) === '72.4 kg' && nbsp(await attr(p, '#a-peso', 'aria-valuetext')) === '72.4 kg', big)
  const a = await box(p, `${rootOf('a-peso')} .x-sl__area`)
  const needle = await box(p, `${rootOf('a-peso')} .x-sl__needle`)
  ck('aguja fija en el centro', Math.abs(needle.cx - a.cx) <= 1)
  await p.mouse.move(a.cx, a.cy); await p.mouse.down()
  for (let k = 1; k <= 5; k++) await p.mouse.move(a.cx - k * 10, a.cy)
  await p.mouse.up()
  ck('arrastrar la cinta 50px a la izquierda sube 5 pasos (72.9) con un change', (await model(p)).peso === 72.9 && await changes(p, 'peso') === 1, String((await model(p)).peso))
  const st = await p.evaluate(() => { const t = document.querySelector('.x-sl:has(#a-peso) .x-sl__tape'); return getComputedStyle(t).insetInlineStart })
  await p.mouse.move(a.cx, a.cy); await p.mouse.down()
  await p.mouse.move(a.cx, a.cy + 150)
  const fineOn = await p.evaluate(() => document.querySelector('.x-sl:has(#a-peso)').classList.contains('is-fine'))
  for (let k = 1; k <= 4; k++) await p.mouse.move(a.cx - k * 10, a.cy + 150)
  await p.mouse.up()
  ck('ajuste fino: lejos de la cinta, 40px = 1 paso (73.0)', fineOn && (await model(p)).peso === 73, String((await model(p)).peso))
  const mk = await p.evaluate(() => { const el = [...document.querySelectorAll('.x-sl:has(#a-peso) .x-sl__major')].find((e) => /^75/.test(e.textContent)); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height - 4 } })
  await p.mouse.click(mk.x, mk.y)
  ck('tocar un número de la escala lo lleva a la aguja (75)', (await model(p)).peso === 75, String((await model(p)).peso))
  await press(p, '#a-peso', ['ArrowRight', 'PageUp'])
  ck('teclado: → = +0.1 y Re Pág = +1 (76.1)', (await model(p)).peso === 76.1, String((await model(p)).peso))
  await press(p, '#a-peso', ['End', 'ArrowRight'])
  ck('tope: Fin y → en el máximo marca el rebote (data-bump)', (await model(p)).peso === 200 && await attr(p, rootOf('a-peso'), 'data-bump') === 'up')
  const c = await p.evaluate(() => ({ needle: __ratio(getComputedStyle(document.querySelector('.x-sl:has(#a-peso) .x-sl__needle')).backgroundColor, __bgOf(document.querySelector('.x-sl:has(#a-peso) .x-sl__area'))), big: __ratio(getComputedStyle(document.querySelector('.x-sl:has(#a-peso) .x-sl__big')).color, __bgOf(document.querySelector('.x-sl__big'))) }))
  ck('contraste: aguja ≥ 3:1 sobre la cinta, lectura ≥ 4,5:1', c.needle >= 3 && c.big >= 4.5, `${c.needle.toFixed(2)} ${c.big.toFixed(2)}`)
  const q = await open(b, '/index.html?v=A', { vw: 320 })
  ck('320px: sin desbordamiento', await noOverflow(q))
  ck('consola limpia', !p.__errs.length, p.__errs.join(' | '))
  await q.context().close(); await p.context().close()
  void st
}

// ===================================================== B =====================================================
async function partB(b, eng) {
  const ck = (n, ok, i) => rec(eng, 'B', n, ok, i)
  const p = await open(b, '/index.html?v=B')
  ck('las dos edades juntas se funden (is-merged) sin solaparse', await p.evaluate(() => { const r = document.querySelector('.x-sl:has(#b-edad)'); const [a, c] = [...r.querySelectorAll('.x-sl__thumb')].map((t) => t.getBoundingClientRect()); return r.classList.contains('is-merged') && Math.abs(a.right - c.left) <= 1 }))
  const txt = await p.evaluate(() => [...document.querySelectorAll('.x-sl:has(#b-edad) .x-sl__pilltext')].map((t) => t.textContent).join('|'))
  ck('el texto de cada píldora es su valor (= aria-valuetext)', nbsp(txt) === nbsp(`${await attr(p, '#b-edad', 'aria-valuetext')}|${await attr(p, '#b-edad-end', 'aria-valuetext')}`), txt)
  await press(p, '#b-edad-end', 'End')
  ck('al separarse vuelven a ser dos', await p.evaluate(() => !document.querySelector('.x-sl:has(#b-edad)').classList.contains('is-merged')))
  const w0 = (await box(p, `${rootOf('b-vol')} .x-sl__thumb`)).w
  await press(p, '#b-vol', 'End')
  const w1 = (await box(p, `${rootOf('b-vol')} .x-sl__thumb`)).w
  await press(p, '#b-vol', 'Home')
  const w2 = (await box(p, `${rootOf('b-vol')} .x-sl__thumb`)).w
  ck('la píldora no cambia de ancho con el valor (0 %, 40 %, 100 %)', Math.abs(w0 - w1) < 0.5 && Math.abs(w0 - w2) < 0.5, `${w0} ${w1} ${w2}`)
  const area = await box(p, `${rootOf('b-vol')} .x-sl__area`)
  const t0 = await box(p, `${rootOf('b-vol')} .x-sl__thumb`)
  ck('la píldora no se sale del riel en los extremos', t0.x >= area.x - 0.5)
  // Tramo arrastrable
  const fill = await box(p, `${rootOf('b-precio')} .x-sl__fill`)
  await p.mouse.move(fill.cx, fill.cy); await p.mouse.down()
  for (let k = 1; k <= 5; k++) await p.mouse.move(fill.cx + k * 20, fill.cy)
  await p.mouse.up()
  let m = await model(p)
  ck('arrastrar el tramo mueve las dos y conserva la anchura (1600)', m.precio[0] > 800 && m.precio[1] - m.precio[0] === 1600, JSON.stringify(m.precio))
  // Teclear la cifra
  await p.focus('#b-vol'); await p.keyboard.type('35'); await p.keyboard.press('Enter')
  ck('teclear «35» + Intro lleva al 35 con un change', (await model(p)).vol === 35, String((await model(p)).vol))
  await p.keyboard.type('7')
  const typing = await p.evaluate(() => document.querySelector('.x-sl:has(#b-vol) .x-sl__thumb').classList.contains('is-typing'))
  await p.waitForTimeout(1100)
  ck('teclear «7» y esperar confirma solo (7); mientras, la píldora es campo', typing && (await model(p)).vol === 7, String((await model(p)).vol))
  await p.keyboard.type('5'); await p.keyboard.press('Escape')
  ck('Esc anula lo tecleado', (await model(p)).vol === 7)
  await p.keyboard.type('250'); await p.keyboard.press('Enter')
  ck('una cifra fuera de los límites va al límite (100)', (await model(p)).vol === 100)
  // Empate: la dirección del gesto decide
  for (const [dx, want] of [[30, 1], [-30, 0]]) {
    await p.evaluate(() => { window.__m.b.edad = [50, 50] }); await p.waitForTimeout(60)
    const th = await box(p, `${rootOf('b-edad')} .x-sl__thumb[data-thumb="1"]`)
    const x0 = th.x + 2
    await p.mouse.move(x0, th.cy); await p.mouse.down()
    for (let k = 1; k <= 3; k++) await p.mouse.move(x0 + (dx * k) / 3, th.cy)
    await p.mouse.up()
    m = await model(p)
    ck(`asas juntas: arrastrar hacia ${dx > 0 ? 'arriba mueve el fin' : 'abajo mueve el inicio'}`, want === 1 ? m.edad[0] === 50 && m.edad[1] > 50 : m.edad[1] === 50 && m.edad[0] < 50, JSON.stringify(m.edad))
  }
  const c = await p.evaluate(() => { const t = document.querySelector('.x-sl:has(#b-precio) .x-sl__thumb'); const cs = getComputedStyle(t); const f = getComputedStyle(document.querySelector('.x-sl:has(#b-precio) .x-sl__fill')); const bg = __bgOf(document.querySelector('.x-sl:has(#b-precio)')); return { text: __ratio(cs.color, cs.backgroundColor), edge: __ratio(cs.borderTopColor, bg), fill: __ratio(f.backgroundColor, bg) } })
  ck('contraste: texto de la píldora ≥ 4,5:1, filo y tramo ≥ 3:1 (§7.1, #439)', c.text >= 4.5 && c.edge >= 3 && c.fill >= 3, JSON.stringify(c, (k, v) => (typeof v === 'number' ? +v.toFixed(2) : v)))
  const hit = await p.evaluate(() => { const cs = getComputedStyle(document.querySelector('.x-sl:has(#b-vol) .x-sl__thumb'), '::after'); return [parseFloat(cs.width), parseFloat(cs.height)] })
  ck('área de la píldora ≥ 44 de ancho y ≥ 24 de alto', hit[0] >= 44 && hit[1] >= 24, String(hit))
  const q = await open(b, '/index.html?v=B&dir=rtl', { vw: 320 })
  ck('RTL a 320px: sin desbordamiento y el fin a la izquierda del inicio', await noOverflow(q) && await q.evaluate(() => { const [a, c] = [...document.querySelectorAll('.x-sl:has(#b-precio) .x-sl__thumb')].map((t) => t.getBoundingClientRect().left); return c < a }))
  ck('consola limpia', !p.__errs.length && !q.__errs.length, [...p.__errs, ...q.__errs].join(' | '))
  await q.context().close(); await p.context().close()
}

// ===================================================== C =====================================================
async function partC(b, eng) {
  const ck = (n, ok, i) => rec(eng, 'C', n, ok, i)
  const p = await open(b, '/index.html?v=C')
  ck('escala 0–10: once columnas que crecen', await p.evaluate(() => { const c = [...document.querySelectorAll('.x-sl:has(#c-dolor) .x-sl__cell')].map((e) => e.getBoundingClientRect().height); return c.length === 11 && c.every((h, i) => !i || h > c[i - 1]) }))
  ck('sin elegir: ninguna pintada, sin raya', await p.evaluate(() => document.querySelectorAll('.x-sl:has(#c-dolor) .x-sl__cell.is-on').length === 0))
  const cell = await box(p, `${rootOf('c-dolor')} .x-sl__cell:nth-child(8)`)
  await p.mouse.click(cell.cx, cell.y + cell.h - 4)
  ck('tocar la columna 7: valor 7 y ocho columnas pintadas', (await model(p)).dolor === 7 && await p.locator(`${rootOf('c-dolor')} .x-sl__cell.is-on`).count() === 8, String((await model(p)).dolor))
  await press(p, '#c-dolor', ['ArrowLeft', 'ArrowLeft'])
  ck('teclado: ← ← = 5 y valuetext «5, Moderado»', (await model(p)).dolor === 5 && await attr(p, '#c-dolor', 'aria-valuetext') === '5, Moderado')
  const n0 = await p.evaluate(() => document.querySelector('.x-sl:has(#c-precio) .x-sl__count').textContent)
  await press(p, '#c-precio-end', 'End')
  const n1 = await p.evaluate(() => document.querySelector('.x-sl:has(#c-precio) .x-sl__count').textContent)
  const vt = await attr(p, '#c-precio-end', 'aria-valuetext')
  ck('la consecuencia cambia con el valor («N de 480 productos») y va en el valuetext', /^\d+ de 480 productos$/.test(n0) && n0 !== n1 && vt.endsWith(n1), `${n0} → ${n1} · ${vt}`)
  ck('las columnas siguen el reparto de los datos (la más alta = el tramo con más productos)', await p.evaluate(() => { const c = [...document.querySelectorAll('.x-sl:has(#c-precio) .x-sl__cell')].map((e) => e.getBoundingClientRect().height); return c.indexOf(Math.max(...c)) === 4 }))
  const c = await p.evaluate(() => { const bg = __bgOf(document.querySelector('.x-sl:has(#c-precio)')); const on = getComputedStyle(document.querySelector('.x-sl:has(#c-precio) .x-sl__cell.is-on')).backgroundColor; const off = getComputedStyle(document.querySelector('.x-sl:has(#c-precio) .x-sl__cell:not(.is-on)')).backgroundColor; return { on: __ratio(on, bg), off: __ratio(off, bg) } })
  ck('contraste: columna elegida y no elegida ≥ 3:1 sobre la superficie', c.on >= 3 && c.off >= 3, JSON.stringify(c, (k, v) => (typeof v === 'number' ? +v.toFixed(2) : v)))
  const q = await open(b, '/index.html?v=C&dir=rtl', { vw: 320 })
  ck('RTL a 320px: sin desbordamiento; la columna 0 a la derecha', await noOverflow(q) && await q.evaluate(() => { const c = [...document.querySelectorAll('.x-sl:has(#c-dolor) .x-sl__cell')]; return c[0].getBoundingClientRect().left > c[10].getBoundingClientRect().left }))
  ck('consola limpia', !p.__errs.length && !q.__errs.length, [...p.__errs, ...q.__errs].join(' | '))
  await q.context().close(); await p.context().close()
}

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  try {
    if (PARTS.includes('base')) await partBase(b, eng)
    if (PARTS.includes('A')) await partA(b, eng)
    if (PARTS.includes('B')) await partB(b, eng)
    if (PARTS.includes('C')) await partC(b, eng)
  } catch (e) { rec(eng, '—', 'excepción', false, String(e).split('\n')[0]) }
  await b.close()
}
server.close()
const by = {}
for (const r of R) { const k = `${r.eng} ${r.part}`; by[k] = by[k] || [0, 0]; by[k][1]++; if (r.ok) by[k][0]++ }
console.log('\n' + Object.entries(by).map(([k, [a, t]]) => `${k}: ${a}/${t}`).join('\n'))
console.log(`\nTotal: ${R.filter((r) => r.ok).length}/${R.length}`)
if (NOTES.length) console.log('Notas:\n  ' + NOTES.join('\n  '))
process.exit(R.every((r) => r.ok) ? 0 : 1)
