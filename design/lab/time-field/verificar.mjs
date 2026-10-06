// Verificación del campo de hora (kiwi): la base (r01) y los conceptos A, B y C (r02), en Chromium, Firefox y WebKit.
// Ejecutar: node design/lab/time-field/verificar.mjs   (solo puerto 4212; ENGINES=chromium,firefox,webkit; PARTS=base,A,B,C; VERBOSE=1)
// Requiere packages/vue/dist (npm run build). Solo lee; no toca packages/.
import { serve, pw } from './serve.mjs'

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'base,A,B,C').split(',')
const V = !!process.env.VERBOSE
const R = [], NOTES = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok, info }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info ? ' · ' + info : ''}`) }

const { server, base } = await serve()

const H = () => {
  window.__rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  window.__contrast = (el) => {
    const fg = __rgb(getComputedStyle(el).color); let bg = null
    for (let a = el; a; a = a.parentElement) { const c = __rgb(getComputedStyle(a).backgroundColor); if (c[3] > 0.95) { bg = c; break } }
    bg = bg || [255, 255, 255]; const L1 = __lum(fg), L2 = __lum(bg); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
  }
  window.__box = (root) => root.querySelector('.g-input__control, .g-select__control, .g-datepicker__field')
}

async function open(b, path, opts = {}) {
  const { vw = 1280, vh = 900, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(base + path)
  await p.waitForFunction(() => window.__tf && window.__tf.size > 0)
  await p.evaluate(H)
  await p.waitForTimeout(150)
  p.__errs = errs
  return p
}
// Escribir en un campo: foco, seleccionar todo (Ctrl+A en macOS es «inicio de línea»), teclear
async function typeIn(p, sel, text, { blur = true } = {}) {
  await p.click(sel)
  await p.evaluate((s) => document.querySelector(s).select(), sel)
  if (text) await p.keyboard.type(text); else await p.keyboard.press('Backspace')
  if (blur) await p.evaluate((s) => document.querySelector(s).blur(), sel)
  await p.waitForTimeout(40)
}
const val = (p, sel) => p.evaluate((s) => document.querySelector(s).value.replace(/\s/g, ' '), sel) // Intl usa U+202F o U+0020 según el motor
const model = (p, out) => p.evaluate((o) => JSON.parse(document.querySelector(o).textContent.replace(/^[^{]*/, '')), out)
const hiddenOf = (p, sel) => p.evaluate((s) => { const r = document.querySelector(s).closest('.g-input'); const h = r.querySelector('input[type=hidden]'); return h ? { name: h.name, value: h.value, disabled: h.disabled } : null }, sel)
const attr = (p, sel, a) => p.evaluate(([s, x]) => document.querySelector(s).getAttribute(x), [sel, a])
const act = (p) => p.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)
const noOverflow = (p) => p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)

// ===================================================== BASE (r01) =====================================================
async function partBase(b, eng) {
  const ck = (n, ok, i) => rec(eng, 'base', n, ok, i)
  let p = await open(b, '/r01/index.html?now=10:40')
  // Carga y formato por idioma
  ck('24 h: «9:07» (es)', await val(p, '#t-cita') === '9:07', await val(p, '#t-cita'))
  ck('segundos: «14:05:30»', await val(p, '#t-evento') === '14:05:30', await val(p, '#t-evento'))
  const t12 = await val(p, '#t12-toma')
  ck('12 h por el bloque lang="es-MX": «9:30 p.m.»', /^9:30\s?p\.\s?m\.$/.test(t12), t12)
  ck('ar-EG: cifras arábigo-índicas y dir=rtl', await val(p, '#t-ar') === '٩:٣٠ م' && await attr(p, '#t-ar', 'dir') === 'rtl', await val(p, '#t-ar'))
  ck('fi: separador «.»', await val(p, '#t-fi') === '21.30')
  ck('ko: la mitad del día delante («오후 9:30»)', await val(p, '#t-ko') === '오후 9:30', await val(p, '#t-ko'))
  ck('he (24 h): «21:30», dir=rtl', await val(p, '#t-he') === '21:30' && await attr(p, '#t-he', 'dir') === 'rtl')
  const all = { ...(await model(p, '#out-models')), ...(await model(p, '#out-12')), ...(await model(p, '#out-intl')) }
  ck('todos los modelos son «HH:mm[:ss]» o null', Object.values(all).every((v) => v === null || /^\d\d:\d\d(:\d\d)?$/.test(v)), JSON.stringify(all))

  // Semántica
  const a = await p.evaluate(() => { const i = document.querySelector('#t-cita'); return { type: i.type, role: i.getAttribute('role'), im: i.inputMode, now: i.getAttribute('aria-valuenow'), txt: i.getAttribute('aria-valuetext'), mn: i.getAttribute('aria-valuemin'), mx: i.getAttribute('aria-valuemax'), name: i.name } })
  ck('type=text, role=spinbutton, inputmode=numeric', a.type === 'text' && a.role === 'spinbutton' && a.im === 'numeric')
  ck('aria-valuenow = minutos (547), aria-valuetext «9:07», min/max 480/1080', a.now === '547' && a.txt === '9:07' && a.mn === '480' && a.mx === '1080', JSON.stringify(a))
  ck('el campo visible no lleva name; el oculto sí, canónico', a.name === '' && JSON.stringify(await hiddenOf(p, '#t-cita')) === JSON.stringify({ name: 'cita', value: '09:07', disabled: false }))
  ck('límites que cruzan medianoche: sin aria-valuemin/max', await attr(p, '#t-turno', 'aria-valuemin') === null && await attr(p, '#t-turno', 'aria-valuemax') === null)
  ck('obligatorio: aria-required y sin required nativo', await attr(p, '#t-toma', 'aria-required') === 'true' && await attr(p, '#t-toma', 'required') === null)
  const snap = await p.locator('#t-cita').ariaSnapshot().catch(() => '')
  ck('árbol: spinbutton con nombre de la etiqueta', /spinbutton "Hora de la cita/.test(snap), snap.split('\n')[0])
  const sn12 = await p.locator('#case-12 .x-tf__halves').first().ariaSnapshot().catch(() => '')
  ck('12 h: a. m./p. m. son botones con nombre «p.m. Hora de la toma» y estado', /button "p\.\s?m\. Hora de la toma/.test(sn12) && /pressed/.test(sn12), sn12.replace(/\n/g, ' | '))
  if (eng === 'chromium') {
    const cdp = await p.context().newCDPSession(p)
    await cdp.send('Accessibility.enable')
    const ax = async (sel) => {
      const { result } = await cdp.send('Runtime.evaluate', { expression: `document.querySelector('${sel}')` })
      const { node } = await cdp.send('DOM.describeNode', { objectId: result.objectId })
      const { nodes } = await cdp.send('Accessibility.queryAXTree', { backendNodeId: node.backendNodeId })
      const n = nodes[0]; return { role: n.role?.value, name: n.name?.value, value: n.value?.value, ...Object.fromEntries((n.properties || []).map((x) => [x.name, x.value.value])) }
    }
    const c = await ax('#t-cita'), tu = await ax('#t-turno'), ro = await ax('#s-ro')
    NOTES.push(`Chromium AX «Hora de la cita»: ${JSON.stringify(c)}`)
    NOTES.push(`Chromium AX turno (cruza medianoche, sin aria-valuemin/max): ${JSON.stringify(tu)}`)
    NOTES.push(`Chromium AX solo lectura: ${JSON.stringify(ro)}`)
    ck('Chromium AX: spinbutton editable con valuetext «9:07»', c.role === 'spinbutton' && c.valuetext === '9:07' && c.editable === 'plaintext', JSON.stringify(c))
  }

  // Escritura libre
  const cases = [['930', '09:30', '9:30'], ['2130', '21:30', '21:30'], ['9h30', '09:30', '9:30'], ['9.30', '09:30', '9:30'], ['21', '21:00', '21:00'], ['0005', '00:05', '0:05'], ['24', '00:00', '0:00']]
  for (const [t, m, shown] of cases) {
    await typeIn(p, '#t-toma', t)
    const mm = (await model(p, '#out-models')).toma
    ck(`«${t}» → ${m}, se muestra «${shown}» al salir`, mm === m && await val(p, '#t-toma') === shown, `${mm} «${await val(p, '#t-toma')}»`)
  }
  await typeIn(p, '#t-toma', 'xyz!')
  ck('letras que no son de un marcador no entran («xyz!» → vacío)', await val(p, '#t-toma') === '' && (await model(p, '#out-models')).toma === null)
  await typeIn(p, '#t-toma', '99:99')
  const bad = await p.evaluate(() => { const i = document.querySelector('#t-toma'); const r = i.closest('.g-input'); return { v: i.value, inv: i.getAttribute('aria-invalid'), msg: r.querySelector('.g-input__message').textContent, vt: i.getAttribute('aria-valuetext'), now: i.getAttribute('aria-valuenow') } })
  ck('sin interpretar («99:99»): se conserva, modelo null, error propio al salir', bad.v === '99:99' && (await model(p, '#out-models')).toma === null && /Escribe una hora/.test(bad.msg) && bad.inv === 'true', JSON.stringify(bad))
  ck('sin interpretar: aria-valuetext = lo escrito, sin aria-valuenow', bad.vt === '99:99' && bad.now === null)
  await typeIn(p, '#t-toma', '9:3')
  ck('«9:3» (minuto de una cifra) no se adivina', (await model(p, '#out-models')).toma === null)
  // Pegar una fecha y hora ISO
  await p.click('#t-toma'); await p.evaluate(() => document.querySelector('#t-toma').select())
  const pasted = await p.evaluate(() => {
    const el = document.querySelector('#t-toma'); const dt = new DataTransfer(); dt.setData('text/plain', '2026-10-06T14:05')
    let ev; try { ev = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt }) } catch { return 'sin-constructor' }
    if (!ev.clipboardData || !ev.clipboardData.getData('text')) return 'sintético-sin-datos'
    el.dispatchEvent(ev); return 'ok'
  })
  if (pasted === 'ok') { await p.evaluate(() => document.querySelector('#t-toma').blur()); ck('pegar «2026-10-06T14:05» → 14:05', (await model(p, '#out-models')).toma === '14:05') }
  else NOTES.push(`${eng}: pegado no verificable con evento sintético (${pasted})`)

  // Pasos
  await typeIn(p, '#t-cita', '9:07', { blur: false })
  const key = async (sel, k) => { await p.focus(sel); await p.keyboard.press(k); await p.waitForTimeout(20); return (await model(p, '#out-models'))[sel.slice(3)] }
  ck('↑ encaja en la rejilla de 15 desde min: 9:07 → 09:15', await key('#t-cita', 'ArrowUp') === '09:15')
  ck('↓ → 09:00', await key('#t-cita', 'ArrowDown') === '09:00')
  ck('Mayús+↑ = una hora → 10:00', await key('#t-cita', 'Shift+ArrowUp') === '10:00')
  ck('Av Pág = una hora menos → 09:00', await key('#t-cita', 'PageDown') === '09:00')
  await typeIn(p, '#t-cita', '17:50', { blur: false })
  ck('17:50 ↑ → 18:00 (máx.)', await key('#t-cita', 'ArrowUp') === '18:00')
  ck('en el máximo ↑ no cambia', await key('#t-cita', 'ArrowUp') === '18:00')
  await typeIn(p, '#t-turno', '23:30', { blur: false })
  ck('arco 22:00–06:00: 23:30 ↑ → 00:00 (cruza medianoche)', await key('#t-turno', 'ArrowUp') === '00:00')
  await typeIn(p, '#t-turno', '5:30', { blur: false })
  ck('arco: 05:30 ↑ → 06:00 y se queda', await key('#t-turno', 'ArrowUp') === '06:00' && await key('#t-turno', 'ArrowUp') === '06:00')
  await typeIn(p, '#t-turno', '12:00', { blur: false })
  ck('fuera del arco: ↑ entra por min (22:00)', await key('#t-turno', 'ArrowUp') === '22:00')
  await typeIn(p, '#t-tele', '23:45', { blur: false })
  ck('sin límites da la vuelta: 23:45 ↑ → 00:00', await key('#t-tele', 'ArrowUp') === '00:00')
  await typeIn(p, '#t-toma', '', { blur: false })
  ck('vacío ↑ → la hora actual (10:40 en la prueba)', await key('#t-toma', 'ArrowUp') === '10:40')
  // change: una vez por gesto
  await p.evaluate(() => document.querySelector('#t-cita').blur())
  const cnt = () => p.evaluate(() => +document.querySelector('#change-count').textContent)
  const before = await cnt()
  await p.focus('#t-cita'); await p.keyboard.down('ArrowDown'); await p.keyboard.up('ArrowDown')
  await p.waitForTimeout(30)
  const after = await cnt()
  ck('change una vez por gesto de paso (al soltar la tecla)', after - before === 1, `${after - before}`)
  await p.evaluate(() => document.querySelector('#t-cita').blur()); await p.waitForTimeout(30)
  ck('salir sin cambiar no emite change', await cnt() === after)

  // 12 h: a. m./p. m. y teclas a/p
  await typeIn(p, '#t12-cita', '9')
  ck('12 h: «9» a secas → 09:00 (mañana)', (await model(p, '#out-12')).cita === '09:00')
  await typeIn(p, '#t12-cita', '9.30p')
  ck('12 h: «9.30p» → 21:30', (await model(p, '#out-12')).cita === '21:30')
  await typeIn(p, '#t12-cita', '2130')
  ck('12 h: escribir en 24 h vale («2130» → 9:30 p.m.)', (await model(p, '#out-12')).cita === '21:30' && /^9:30/.test(await val(p, '#t12-cita')))
  await p.focus('#t12-cita'); await p.evaluate(() => document.querySelector('#t12-cita').select()); await p.keyboard.press('a')
  ck('12 h: «a» sobre la hora escrita cambia a la mañana (09:30)', (await model(p, '#out-12')).cita === '09:30')
  await typeIn(p, '#t12-cita', '9')
  ck('12 h: con un valor previo de la mañana, «9» sigue en la mañana', (await model(p, '#out-12')).cita === '09:00')
  await p.evaluate(() => document.body.focus())
  const pmBtn = p.locator('#case-12 [data-half=pm]').nth(1)
  await pmBtn.click()
  ck('12 h: pulsar «p.m.» → 21:00 sin mover el foco al campo', (await model(p, '#out-12')).cita === '21:00' && await act(p) !== 't12-cita')
  ck('12 h: a. m./p. m. fuera del Tab (tabindex=-1) y con aria-pressed', await pmBtn.getAttribute('tabindex') === '-1' && await pmBtn.getAttribute('aria-pressed') === 'true')
  const hb = await pmBtn.boundingBox()
  ck('12 h: botón ≥ 24×24px', hb.width >= 24 && hb.height >= 24, `${hb.width}×${hb.height}`)
  // Otros idiomas
  await typeIn(p, '#t-ar', '٢١٣٠')
  ck('ar-EG: escribir cifras arábigo-índicas («٢١٣٠» → 21:30)', (await model(p, '#out-intl')).ar === '21:30')
  await typeIn(p, '#t-ko', '오전 7:15')
  ck('ko: «오전 7:15» → 07:15', (await model(p, '#out-intl')).ko === '07:15')
  await typeIn(p, '#t-fi', '7.45')
  ck('fi: «7.45» → 07:45', (await model(p, '#out-intl')).fi === '07:45')

  // Fila con GInput, GDatePicker y GSelect
  for (const w of [1100, 720, 320]) {
    const r = await p.evaluate((w) => {
      const kids = [...document.querySelector('#row-' + w).children]
      const byLine = {}
      kids.forEach((k) => { const b = __box(k); if (!b) return; const r = b.getBoundingClientRect(); (byLine[k.dataset.line] ||= []).push([r.top, r.height]) })
      return Object.values(byLine).map((l) => [Math.max(...l.map((x) => x[0])) - Math.min(...l.map((x) => x[0])), Math.max(...l.map((x) => x[1])) - Math.min(...l.map((x) => x[1]))])
    }, w)
    ck(`fila a ${w}px: cajas de cada línea con el mismo top y alto (Δ ≤ 1px)`, r.length > 0 && r.every(([dt, dh]) => dt <= 1 && dh <= 1), JSON.stringify(r))
  }
  // Estados
  const ro = await p.evaluate(() => { const i = document.querySelector('#s-ro'); return { ro: i.readOnly, aria: i.getAttribute('aria-readonly'), halves: !!i.closest('.g-input').querySelector('.x-tf__halves') } })
  await p.focus('#s-ro'); await p.keyboard.press('ArrowUp')
  ck('solo lectura: readonly + aria-readonly, ↑ no cambia, oculto en el envío', ro.ro && ro.aria === 'true' && await val(p, '#s-ro') === '7:45' && !(await hiddenOf(p, '#s-ro')).disabled)
  ck('deshabilitado: campo y oculto disabled', await p.evaluate(() => document.querySelector('#s-dis').disabled) && (await hiddenOf(p, '#s-dis')).disabled)
  // Envío y error de la aplicación
  await typeIn(p, '#t-toma', '')
  await p.click('#b-casos'); await p.waitForTimeout(200)
  ck('envío con «Hora de la toma» vacía: foco al campo y resumen', await act(p) === 't-toma' || (await p.locator('.g-error-summary a[href="#t-toma"]').count()) > 0, await act(p))
  await typeIn(p, '#t-toma', '8:05'); await typeIn(p, '#t-cita', '9:15')
  await p.click('#b-casos'); await p.waitForTimeout(200)
  const sent = await p.locator('#out-sent').textContent()
  ck('FormData: canónicos (toma="08:05", evento="14:05:30")', /toma="08:05"/.test(sent) && /evento="14:05:30"/.test(sent), sent)
  ck('consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.context().close()

  for (const dir of ['ltr', 'rtl']) {
    p = await open(b, '/r01/index.html?dir=' + dir, { vw: 320, vh: 800 })
    ck(`320px ${dir}: sin desbordamiento horizontal`, await noOverflow(p))
    await p.context().close()
  }
}

// ===================================================== A =====================================================
async function partA(b, eng) {
  const ck = (n, ok, i) => rec(eng, 'A', n, ok, i)
  const p = await open(b, '/r02/index.html?c=A')
  const m = () => model(p, '#out-model')
  await typeIn(p, '#a-toma', '9', { blur: false })
  const ch = await p.evaluate(() => [...document.querySelectorAll('#case-a1 .x-tfa__choice')].map((b) => [b.dataset.choice, b.getAttribute('aria-pressed'), b.getAttribute('tabindex'), b.textContent]))
  ck('24 h: «9» a secas ofrece dos lecturas (09:00 elegida, 21:00)', ch.length === 2 && ch[0][0] === '09:00' && ch[0][1] === 'true' && ch[1][0] === '21:00', JSON.stringify(ch))
  ck('las lecturas: fuera del Tab y con la hora en el nombre', ch.every((c) => c[2] === '-1') && /21:00/.test(ch[1][3]) && /noche/.test(ch[1][3]))
  await p.locator('#case-a1 [data-choice="21:00"]').click()
  ck('un toque en «de la noche» → 21:00 y el foco sigue en el campo', (await m()).toma === '21:00' && await act(p) === 'a-toma')
  for (const [t, want] of [['9 noche', '21:00'], ['7 de la tarde', '19:00'], ['mediodía', '12:00'], ['3 madrugada', '03:00'], ['930', '09:30']]) {
    await typeIn(p, '#a-toma', t)
    ck(`se escribe como se dice: «${t}» → ${want}`, (await m()).toma === want, (await m()).toma)
  }
  await typeIn(p, '#a-toma', '21:30')
  const rd = await p.evaluate(() => { const i = document.querySelector('#a-toma'); const r = i.closest('.g-input'); const rd = r.querySelector('.x-tfa__reading'); const mir = r.querySelector('.x-tfa__mirror'); return { vt: i.getAttribute('aria-valuetext'), txt: rd?.textContent, gap: rd.getBoundingClientRect().left - mir.getBoundingClientRect().right, hidden: rd.getAttribute('aria-hidden') } })
  ck('lectura en palabras pegada a la hora («de la noche», a la separación de la caja)', rd.txt === 'de la noche' && rd.gap >= 4 && rd.gap <= 12 && rd.hidden === 'true', JSON.stringify(rd))
  ck('aria-valuetext lleva la lectura («21:30, de la noche»)', rd.vt === '21:30, de la noche', rd.vt)
  // Cruzar una franja con ↑ anima la lectura (y con reduce no)
  await typeIn(p, '#a-toma', '11:30', { blur: false })
  await p.keyboard.press('Shift+ArrowUp'); await p.waitForTimeout(30)
  const an = await p.evaluate(() => { const r = document.querySelector('#a-toma').closest('.g-input').querySelector('.x-tfa__reading'); return { t: r.textContent, n: r.getAnimations().length } })
  ck('↑ que cruza a «del mediodía»: la lectura cambia y entra con movimiento', /mediod/.test(an.t) && an.n > 0, JSON.stringify(an))
  // 12 h
  await typeIn(p, '#a-toma12', '9', { blur: false })
  ck('12 h: «9» ofrece mañana/noche', await p.locator('#case-a2 .x-tfa__choice').count() === 2)
  await p.evaluate(() => document.querySelector('#a-toma12').blur())
  // Fila
  const r = await p.evaluate(() => { const l = [...document.querySelector('#a-row').children].map((k) => __box(k).getBoundingClientRect()); return [Math.max(...l.map((x) => x.top)) - Math.min(...l.map((x) => x.top)), Math.max(...l.map((x) => x.height)) - Math.min(...l.map((x) => x.height))] })
  ck('en una fila con GInput y GDatePicker: Δ top y alto ≤ 1px', r[0] <= 1 && r[1] <= 1, JSON.stringify(r))
  ck('contraste de la lectura ≥ 4.5:1', eng !== 'chromium' || await p.evaluate(() => __contrast(document.querySelector('.x-tfa__reading'))) >= 4.5)
  ck('consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.context().close()
  const q = await open(b, '/r02/index.html?c=A', { reducedMotion: 'reduce' })
  await typeIn(q, '#a-toma', '11:30', { blur: false }); await q.keyboard.press('Shift+ArrowUp'); await q.waitForTimeout(30)
  ck('reduce: la lectura cambia sin movimiento', await q.evaluate(() => document.querySelector('#a-toma').closest('.g-input').querySelector('.x-tfa__reading').getAnimations().length) === 0)
  await q.context().close()
  const s = await open(b, '/r02/index.html?c=A', { vw: 320, vh: 800 })
  ck('320px: sin desbordamiento', await noOverflow(s))
  await s.context().close()
}

// ===================================================== B =====================================================
async function partB(b, eng) {
  const ck = (n, ok, i) => rec(eng, 'B', n, ok, i)
  const p = await open(b, '/r02/index.html?c=B&now=10:40')
  const m = () => model(p, '#out-model')
  const btn = p.locator('#case-b1 .x-tfb__open').first()
  ck('botón de abrir: fuera del Tab, aria-haspopup=dialog, aria-expanded=false, con nombre', await btn.getAttribute('tabindex') === '-1' && await btn.getAttribute('aria-haspopup') === 'dialog' && await btn.getAttribute('aria-expanded') === 'false' && await btn.getAttribute('aria-label') === 'Elegir hora')
  ck('el campo sigue siendo spinbutton (aria-keyshortcuts Alt+ArrowDown)', await attr(p, '#b-cita', 'role') === 'spinbutton' && await attr(p, '#b-cita', 'aria-keyshortcuts') === 'Alt+ArrowDown')
  const box0 = await p.evaluate(() => __box(document.querySelector('#b-cita').closest('.g-input')).getBoundingClientRect().toJSON())
  await p.focus('#b-cita'); await p.keyboard.press('Alt+ArrowDown'); await p.waitForTimeout(200)
  const box1 = await p.evaluate(() => __box(document.querySelector('#b-cita').closest('.g-input')).getBoundingClientRect().toJSON())
  const dlg = await p.evaluate(() => { const d = document.querySelector('#b-cita-pop'); return { role: d.getAttribute('role'), name: d.getAttribute('aria-label'), open: d.matches(':popover-open'), hours: d.querySelectorAll('[data-hour]').length, off: [...d.querySelectorAll('[data-hour][aria-disabled=true]')].map((x) => +x.dataset.hour), tab0: [...d.querySelectorAll('[data-hour][tabindex="0"]')].map((x) => +x.dataset.hour) } })
  ck('Alt+↓ abre un diálogo no modal con nombre', dlg.role === 'dialog' && dlg.name === 'Elegir hora' && dlg.open, JSON.stringify(dlg))
  ck('24 horas en cuatro filas; una sola parada de Tab en la rejilla', dlg.hours === 24 && dlg.tab0.length === 1)
  ck('fuera de 8:00–18:00: 0–7 y 19–23 con aria-disabled', JSON.stringify(dlg.off) === JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 19, 20, 21, 22, 23]), JSON.stringify(dlg.off))
  ck('el foco va a la primera hora válida (8)', await p.evaluate(() => document.activeElement.dataset.hour) === '8')
  ck('abrir no mueve el campo (Δ0)', Math.abs(box0.top - box1.top) < 0.5 && Math.abs(box0.height - box1.height) < 0.5)
  const nm = await p.evaluate(() => document.activeElement.getAttribute('aria-label'))
  ck('nombre de la hora con la franja («8:00, de la mañana»)', /8:00, de la mañana/.test(nm), nm)
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowDown')
  ck('flechas: → y ↓ recorren la rejilla (8 → 9 → 15)', await p.evaluate(() => document.activeElement.dataset.hour) === '15')
  await p.keyboard.press('ArrowUp'); await p.keyboard.press('Enter'); await p.waitForTimeout(80)
  const mins = await p.evaluate(() => [...document.querySelectorAll('#b-cita-pop [data-minute]')].map((x) => +x.dataset.minute))
  ck('Intro despliega los minutos de esa hora según el paso (0, 15, 30, 45)', JSON.stringify(mins) === '[0,15,30,45]', JSON.stringify(mins))
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('Enter'); await p.waitForTimeout(80)
  ck('Intro en «:15» → 09:15, cierra y devuelve el foco al campo', (await m()).cita === '09:15' && await act(p) === 'b-cita' && !(await p.evaluate(() => document.querySelector('#b-cita-pop').matches(':popover-open'))))
  await p.keyboard.press('Alt+ArrowDown'); await p.waitForTimeout(120); await p.keyboard.press('Escape'); await p.waitForTimeout(60)
  ck('Esc cierra y devuelve el foco', await act(p) === 'b-cita' && !(await p.evaluate(() => document.querySelector('#b-cita-pop').matches(':popover-open'))))
  await btn.click(); await p.waitForTimeout(120)
  ck('el botón abre (aria-expanded=true)', await btn.getAttribute('aria-expanded') === 'true')
  await p.locator('#b-cita-pop [data-suggest="19:00"]').dispatchEvent('click'); await p.waitForTimeout(40)
  ck('habitual fuera de horario: aria-disabled y no cambia', (await m()).cita === '09:15')
  await p.locator('#b-cita-pop [data-suggest="13:30"]').click(); await p.waitForTimeout(60)
  ck('habitual: un toque → 13:30 y cierra', (await m()).cita === '13:30')
  const sz = await p.evaluate(() => { document.querySelector('#case-b1 .x-tfb__open').click(); return new Promise((r) => setTimeout(() => r([...document.querySelectorAll('#b-cita-pop .x-tfb__hour, #b-cita-pop .x-tfb__habit')].map((e) => { const b = e.getBoundingClientRect(); return Math.min(b.width, b.height) })), 150)) })
  ck('objetivos de la rejilla y habituales ≥ 24px', sz.every((x) => x >= 24), Math.min(...sz).toFixed(1))
  if (eng === 'chromium') {
    const c = await p.evaluate(() => Math.min(...[...document.querySelectorAll('#b-cita-pop .x-tfb__hour:not(.is-off), #b-cita-pop .x-tfb__rowhead, #b-cita-pop .x-tfb__habit-label, #b-cita-pop .x-tfb__hour.is-on')].map(__contrast)))
    ck('contraste mínimo en la rejilla ≥ 4.5:1', c >= 4.5, c.toFixed(2))
    const off = await p.evaluate(() => __contrast(document.querySelector('#b-cita-pop .x-tfb__hour.is-off')))
    NOTES.push(`B: hora deshabilitada (tachada) contraste ${off.toFixed(2)}:1 (exenta, 1.4.3, pero se lee tachada)`)
  }
  await p.keyboard.press('Escape')
  // Cruza medianoche
  await p.focus('#b-turno'); await p.keyboard.press('Alt+ArrowDown'); await p.waitForTimeout(150)
  const offT = await p.evaluate(() => [...document.querySelectorAll('#b-turno-pop [data-hour]:not([aria-disabled])')].map((x) => +x.dataset.hour))
  ck('arco 22:00–06:00: válidas 0–6 y 22–23', JSON.stringify(offT) === '[0,1,2,3,4,5,6,22,23]', JSON.stringify(offT))
  await p.keyboard.press('Escape')
  ck('consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.context().close()
  // Móvil: hoja inferior
  const mob = await open(b, '/r02/index.html?c=B', { vw: 375, vh: 740, ...(eng === 'firefox' ? {} : { hasTouch: true, isMobile: eng === 'chromium' }) })
  await mob.locator('#case-b1 .x-tfb__open').first().click(); await mob.waitForTimeout(200)
  const sh = await mob.evaluate(() => { const d = document.querySelector('#b-cita-pop'); const r = d.getBoundingClientRect(); const hs = [...d.querySelectorAll('.x-tfb__hour')].map((e) => e.getBoundingClientRect().height); return { sheet: d.classList.contains('is-sheet'), bottom: Math.round(r.bottom), w: Math.round(r.width), vh: innerHeight, vw: innerWidth, minH: Math.min(...hs), coarse: matchMedia('(pointer:coarse)').matches } })
  ck('≤ 520px: hoja inferior a todo el ancho', sh.sheet && Math.abs(sh.bottom - sh.vh) <= 1 && Math.abs(sh.w - sh.vw) <= 1, JSON.stringify(sh))
  if (sh.coarse) ck('puntero grueso: horas ≥ 44px de alto', sh.minH >= 44, sh.minH)
  ck('375px: sin desbordamiento', await noOverflow(mob))
  await mob.context().close()
}

// ===================================================== C =====================================================
async function partC(b, eng) {
  const ck = (n, ok, i) => rec(eng, 'C', n, ok, i)
  const p = await open(b, '/r02/index.html?c=C')
  const m = () => model(p, '#out-model')
  const st = () => p.evaluate(() => { const end = document.querySelector('#c-turno-end'); const out = end.closest('.g-input').querySelector('.g-input__output'); return { out: out?.textContent, outId: out?.id, desc: end.getAttribute('aria-describedby'), pieces: document.querySelectorAll('#c-turno .x-tfc__span').length, group: document.querySelector('#c-turno').getAttribute('role') } })
  let s = await st()
  ck('grupo con nombre (role=group + leyenda)', s.group === 'group' && await attr(p, '#c-turno', 'aria-labelledby') === 'c-turno-legend')
  ck('22:00–06:00: «8 h · +1 día» junto al fin', /8\s?h/.test(s.out) && /\+1 día/.test(s.out), s.out)
  ck('la duración describe el campo de fin (aria-describedby)', s.desc.split(' ').includes(s.outId), s.desc)
  ck('cruza medianoche: la regla pinta dos piezas', s.pieces === 2)
  await typeIn(p, '#c-turno-end', '+8:30')
  ck('fin escrito como duración «+8:30» → 06:30', (await m()).turno.end === '06:30', JSON.stringify((await m()).turno))
  await typeIn(p, '#c-turno-start', '21:00')
  ck('mover el inicio conserva la duración: 21:00 → fin 05:30', JSON.stringify((await m()).turno) === JSON.stringify({ start: '21:00', end: '05:30' }), JSON.stringify((await m()).turno))
  s = await st()
  ck('la duración sigue siendo «8 h 30 min»', /8\s?h/.test(s.out) && /30\s?min/.test(s.out), s.out)
  await typeIn(p, '#c-turno-end', '23:00')
  s = await st()
  ck('fin posterior al inicio: sin «+1 día», una pieza', !/\+1/.test(s.out) && s.pieces === 1, s.out)
  await p.locator('#c-cita [data-dur="60"]').click(); await p.waitForTimeout(40)
  ck('duración de un toque «+1 h» → fin 10:00', (await m()).cita.end === '10:00')
  await p.click('#case-c1 button[type=submit]'); await p.waitForTimeout(150)
  const sent = await p.locator('#out-sent').textContent()
  ck('FormData: turno-start y turno-end canónicos', /turno-start="21:00"/.test(sent) && /turno-end="23:00"/.test(sent), sent)
  const twelve = await p.evaluate(() => document.querySelector('#c-12-end').value)
  ck('12 h (es-MX): fin «7:00 a.m.»', /^7:00\s?a\.\s?m\.$/.test(twelve), twelve)
  ck('consola limpia', p.__errs.length === 0, p.__errs.join(' | '))
  await p.context().close()
  const n = await open(b, '/r02/index.html?c=C', { vw: 320, vh: 800 })
  ck('320px: sin desbordamiento', await noOverflow(n))
  await n.context().close()
  const r = await open(b, '/r02/index.html?c=C&dir=rtl', { vw: 1024 })
  const rtl = await r.evaluate(() => { const t = document.querySelector('#c-turno .x-tfc__track').getBoundingClientRect(); const sp = [...document.querySelectorAll('#c-turno .x-tfc__span')].map((e) => e.getBoundingClientRect()); return { firstRight: sp[0].right, trackRight: t.right } })
  ck('RTL: la regla empieza a la derecha (la pieza de 22:00 a 24 toca el borde izquierdo)', rtl.firstRight < rtl.trackRight, JSON.stringify(rtl))
  await r.context().close()
}

const PARTFN = { base: partBase, A: partA, B: partB, C: partC }
for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  for (const part of PARTS) {
    try { await PARTFN[part](b, eng) } catch (e) { rec(eng, part, 'excepción', false, String(e).split('\n')[0]) }
  }
  await b.close()
}
server.close()
const tally = {}
for (const r of R) { const k = `${r.eng} ${r.part}`; tally[k] ||= [0, 0]; tally[k][1]++; if (r.ok) tally[k][0]++ }
console.log('\n' + Object.entries(tally).map(([k, [a, t]]) => `${k}: ${a}/${t}`).join('\n'))
const pass = R.filter((r) => r.ok).length
console.log(`\nTotal: ${pass}/${R.length}`)
if (NOTES.length) console.log('\nNotas:\n- ' + NOTES.join('\n- '))
process.exit(pass === R.length ? 0 : 1)
