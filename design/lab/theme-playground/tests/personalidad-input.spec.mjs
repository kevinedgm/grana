// GInput · personalidad (DECISIONS.md #299 y #304; design/contracts/input.md «Personalidad»; form.md §2 «Rechazo al
// enviar»; plan 018). I1 «el mensaje sale del campo» e I2 «un solo aviso al enviar», medidos sobre GForm + GInput REALES
// del UMD (window.Grana), montados en la página del playground como en personalidad-btn.spec.mjs. I2 también en
// GTextarea y GSelect (misma regla en su caja). Criterio de hecho: la medida de kiwi (design/lab/personalidad/r01 §7):
// I1 con cuadros intermedios de −space × 1 a 0 y 0 animaciones con error al montar; I2 con desplazamiento máximo
// ≤ space × 1, tres cambios de sentido y vuelta a 0, una sola vez; escribir y salir, 0 animaciones; reduce sin movimiento.
// Las curvas se miden de forma determinista (se pausa la animación o transición real y se recorre su tiempo); la retirada
// de la clase, en tiempo real con el animationend del navegador.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

// Monta un GForm con dos GInput (a, b), un GTextarea (c) y un GSelect (d), todos con error (se ven al enviar), y un
// GInput suelto (z) que ya viene con error al montar. window.__errors es reactivo; window.__form, la instancia de GForm.
const mount = async (page, { reduce = false } = {}) => {
  await page.emulateMedia({ reducedMotion: reduce ? 'reduce' : 'no-preference' })
  await page.goto(PAGE)
  await page.waitForSelector('.g-btn')
  await page.evaluate(() => {
    const host = document.createElement('div')
    host.id = 'pi-host'
    host.style.padding = '48px'
    document.body.prepend(host)
    const { createApp, h, reactive, ref } = window.Vue
    const G = window.Grana
    const errors = reactive({ a: 'Escribe tu nombre.', b: 'Escribe tu correo.', c: 'Cuéntanos el motivo.', d: 'Elige un país.' })
    const v = reactive({ a: '', b: '', c: '', d: null })
    const form = ref(null)
    window.__errors = errors
    window.__form = () => form.value
    createApp({
      render: () => h('div', [
        h(G.GForm, { ref: form, id: 'pi-form', errors, showErrorsOn: 'submit' }, () => [
          h(G.GInput, { id: 'pi-a', name: 'a', label: 'Nombre', modelValue: v.a, 'onUpdate:modelValue': (x) => { v.a = x } }),
          h(G.GInput, { id: 'pi-b', name: 'b', label: 'Correo', modelValue: v.b, 'onUpdate:modelValue': (x) => { v.b = x } }),
          h(G.GTextarea, { id: 'pi-c', name: 'c', label: 'Motivo', modelValue: v.c, 'onUpdate:modelValue': (x) => { v.c = x } }),
          h(G.GSelect, { id: 'pi-d', name: 'd', label: 'País', placeholder: 'Elige', options: [{ value: 'mx', label: 'México' }, { value: 'es', label: 'España' }], modelValue: v.d, 'onUpdate:modelValue': (x) => { v.d = x } }),
          h('button', { id: 'pi-submit', type: 'submit' }, 'Enviar')
        ]),
        h(G.GInput, { id: 'pi-z', label: 'Suelto', error: 'Ya venía con error.' })
      ])
    }).mount(host)
    const probe = document.createElement('div'); probe.style.inlineSize = 'var(--g-space-1)'; document.body.appendChild(probe)
    window.__space1 = probe.getBoundingClientRect().width; probe.remove()
    // Root del campo por id del <input>/<textarea>/botón (los id del consumidor van al control) → raíz .g-*
    window.__root = (id) => document.getElementById(id).closest('.g-input, .g-textarea, .g-select')
    window.__mover = (id) => window.__root(id).querySelector(':scope > .g-input__row, :scope > .g-textarea__control, :scope > .g-select__control')
    window.__msg = (id) => window.__root(id).querySelector('.g-input__message, .g-textarea__message, .g-select__message')
    window.__tx = (el) => { const t = getComputedStyle(el).translate; if (!t || t === 'none') return 0; return parseFloat(t.split(' ')[0]) }
    window.__ty = (el) => { const t = getComputedStyle(el).translate; if (!t || t === 'none') return 0; const [, y = '0px'] = t.split(' '); return parseFloat(y) }
    window.__cssAnims = (el) => el.getAnimations().filter((a) => a.animationName !== undefined)
    // Registro de animaciones de toda la página: cada animationstart/transitionrun con su objetivo
    window.__log = []
    for (const type of ['animationstart', 'transitionrun']) {
      document.addEventListener(type, (e) => { window.__log.push({ type, name: e.animationName || e.propertyName, cls: e.target.className && String(e.target.className), id: e.target.closest('[class*="g-"]')?.id }) }, true)
    }
    window.__sample = (fn, ms) => new Promise((res) => {
      const xs = []; const t0 = performance.now()
      ;(function f() { xs.push({ t: performance.now() - t0, v: fn() }); if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(xs) })()
    })
  })
  await page.waitForSelector('#pi-a')
  // is-ready llega dos cuadros después de montar
  await page.waitForFunction(() => ['pi-a', 'pi-b', 'pi-z'].every((id) => window.__root(id).classList.contains('is-ready')))
  await page.waitForTimeout(100)
}

const submit = (page) => page.evaluate(() => document.getElementById('pi-form').requestSubmit())

// Envía y, en cuanto llega is-rejected (MutationObserver: microtarea tras el parche de Vue, antes del siguiente cuadro, así
// la medida no depende de la carga de la máquina), pausa la sacudida real del campo y recorre su tiempo cada 2ms
const seekShake = (page, id) => page.evaluate((id) => new Promise((resolve) => {
  const root = window.__root(id); const mover = window.__mover(id)
  const timer = setTimeout(() => { mo.disconnect(); resolve({ found: false, rejected: root.classList.contains('is-rejected') }) }, 3000)
  const mo = new MutationObserver(() => {
    if (!root.classList.contains('is-rejected')) return
    mo.disconnect(); clearTimeout(timer)
    const a = window.__cssAnims(mover).find((x) => x.animationName.startsWith('g-reject'))
    if (!a) return resolve({ found: false, rejected: true, anim: getComputedStyle(mover).animationName })
    a.pause()
    const dur = a.effect.getComputedTiming().duration
    const xs = []
    for (let t = 0; t <= dur; t += 2) { a.currentTime = t; xs.push({ t, x: window.__tx(mover) }) }
    a.currentTime = 0
    a.play()
    resolve({ found: true, name: a.animationName, dur, iterations: a.effect.getComputedTiming().iterations, xs, s1: window.__space1 })
  })
  mo.observe(root, { attributes: true, attributeFilter: ['class'] })
  document.getElementById('pi-form').requestSubmit()
}), id)

const signChanges = (xs) => {
  const signs = xs.map((p) => Math.sign(Math.round(p.x * 100) / 100)).filter((s) => s !== 0)
  let n = 0
  for (let i = 1; i < signs.length; i++) if (signs[i] !== signs[i - 1]) n++
  return n
}

test.describe('I2 · un solo aviso al enviar', () => {
  for (const id of ['pi-a', 'pi-c', 'pi-d']) {
    test(`${id}: sacudida decreciente ≤ space × 1, tres cambios de sentido, vuelta a 0, una vez`, async ({ page }) => {
      await mount(page)
      const r = await seekShake(page, id)
      expect(r.found, JSON.stringify(r)).toBe(true)
      expect(r.name.startsWith('g-reject')).toBe(true)
      expect(r.dur).toBeCloseTo(240, 0) // --g-duration-slow
      expect(r.iterations).toBe(1)
      const max = Math.max(...r.xs.map((p) => Math.abs(p.x)))
      expect(max, `máximo ${max}px`).toBeLessThanOrEqual(r.s1 + 0.01)
      expect(max).toBeGreaterThan(r.s1 * 0.9)
      expect(signChanges(r.xs), 'cambios de sentido').toBe(3)
      expect(Math.abs(r.xs.at(-1).x)).toBeLessThan(0.01)
      // Decreciente: cada pico menor que el anterior
      const peaks = [0.16, 0.36, 0.56, 0.76].map((f) => Math.abs(r.xs.reduce((b, p) => (Math.abs(p.t - f * r.dur) < Math.abs(b.t - f * r.dur) ? p : b)).x))
      for (let i = 1; i < peaks.length; i++) expect(peaks[i]).toBeLessThan(peaks[i - 1])
      if (process.env.VERBOSE) console.log(`I2 ${id} ${test.info().project.name}: máx ${max.toFixed(3)}px (space ${r.s1}), picos ${peaks.map((p) => p.toFixed(2)).join(' · ')}, ${signChanges(r.xs)} cambios`)
    })
  }

  test('el animationend real retira is-rejected; no se repite; los dos campos de texto la reciben', async ({ page }) => {
    await mount(page)
    const r = await page.evaluate(async () => {
      const root = window.__root('pi-b')
      const ends = []
      // En captura sobre el documento: llega antes que la escucha del propio campo (que retira la clase)
      document.addEventListener('animationend', (e) => { if (root.contains(e.target)) ends.push({ name: e.animationName, t: performance.now(), had: root.classList.contains('is-rejected') }) }, true)
      const t0 = performance.now()
      document.getElementById('pi-form').requestSubmit()
      let tOn = null, tOff = null
      // Momentos exactos de puesta y retirada de la clase (no dependen de en qué cuadro cae el muestreo)
      new MutationObserver(() => {
        const on = root.classList.contains('is-rejected')
        if (on && tOn === null) tOn = performance.now() - t0
        if (!on && tOn !== null && tOff === null) tOff = performance.now() - t0
      }).observe(root, { attributes: true, attributeFilter: ['class'] })
      await new Promise((res) => setTimeout(res, 1200))
      const a = window.__root('pi-a').classList.contains('is-rejected')
      return { tOn, tOff, ends: ends.map((e) => ({ name: e.name, dt: e.t - t0, had: e.had })), aStill: a, anims: window.__cssAnims(window.__mover('pi-b')).length }
    })
    expect(r.tOn, 'la clase llega').not.toBeNull()
    expect(r.tOff, 'la clase se va').not.toBeNull()
    const shakeEnds = r.ends.filter((e) => e.name.startsWith('g-reject'))
    expect(shakeEnds.length, JSON.stringify(r.ends)).toBe(1)
    expect(shakeEnds[0].had, 'la clase seguía puesta cuando llegó el animationend').toBe(true)
    expect(r.tOff).toBeGreaterThanOrEqual(shakeEnds[0].dt - 1)
    expect(r.tOff - r.tOn, 'la clase dura al menos la sacudida (--g-duration-slow)').toBeGreaterThanOrEqual(230)
    expect(r.aStill, 'el otro campo también la retiró').toBe(false)
    expect(r.anims, 'no queda ninguna animación en la fila').toBe(0)
    if (process.env.VERBOSE) console.log(`I2 retirada ${test.info().project.name}: on ${r.tOn.toFixed(0)}ms, end ${shakeEnds[0].dt.toFixed(0)}ms, off ${r.tOff.toFixed(0)}ms`)
  })

  test('nunca al escribir ni al salir del campo; un segundo envío la repite', async ({ page }) => {
    await mount(page)
    await submit(page)
    await page.waitForFunction(() => !document.querySelector('.is-rejected'), null, { timeout: 2000 })
    await page.waitForTimeout(50)
    await page.evaluate(() => { window.__log.length = 0 })
    // Escribir (sigue con error: errors no cambia) y salir
    await page.locator('#pi-a').click()
    await page.keyboard.type('Ana')
    await page.keyboard.press('Tab')
    await page.locator('#pi-c').click()
    await page.keyboard.type('x')
    await page.keyboard.press('Tab')
    await page.waitForTimeout(300)
    const log = await page.evaluate(() => window.__log.filter((e) => e.type === 'animationstart'))
    expect(log, JSON.stringify(log)).toEqual([])
    expect(await page.evaluate(() => document.querySelectorAll('.is-rejected').length)).toBe(0)
    // Segundo envío: vuelve
    await submit(page)
    await page.waitForFunction(() => window.__log.some((e) => e.type === 'animationstart' && e.name.startsWith('g-reject')), null, { timeout: 5000 })
  })

  test('con movimiento reducido: la clase se pone, pero nada se mueve', async ({ page }) => {
    await mount(page, { reduce: true })
    const xs = await page.evaluate(async () => {
      const p = window.__sample(() => ({ on: ['pi-a', 'pi-c', 'pi-d'].map((id) => window.__root(id).classList.contains('is-rejected')), x: ['pi-a', 'pi-c', 'pi-d'].map((id) => window.__tx(window.__mover(id))), n: ['pi-a', 'pi-c', 'pi-d'].map((id) => window.__cssAnims(window.__mover(id)).length) }), 400)
      document.getElementById('pi-form').requestSubmit()
      return p
    })
    expect(xs.some((s) => s.v.on.every(Boolean)), 'is-rejected presente').toBe(true)
    expect(xs.every((s) => s.v.x.every((x) => x === 0)), 'sin desplazamiento').toBe(true)
    expect(xs.every((s) => s.v.n.every((n) => n === 0)), 'sin animaciones').toBe(true)
  })
})

// Recoge las transiciones del mensaje justo después de un cambio (en la misma tarea) y recorre su tiempo cada 10ms
const seekMessage = (page, id, change) => page.evaluate(async ([id, change]) => {
  const msg = window.__msg(id)
  const before = { o: +getComputedStyle(msg).opacity, ty: window.__ty(msg), empty: msg.matches(':empty') }
  if (change === 'submit') document.getElementById('pi-form').requestSubmit()
  else window.__errors.a = change
  await window.Vue.nextTick()
  getComputedStyle(msg).opacity // fuerza el cálculo de estilo: crea las transiciones
  const anims = msg.getAnimations()
  anims.forEach((a) => a.pause())
  const info = anims.map((a) => ({ prop: a.transitionProperty, name: a.animationName, dur: a.effect.getComputedTiming().duration }))
  const xs = []
  const dur = Math.max(0, ...info.map((i) => i.dur))
  for (let t = 0; t <= dur; t += 10) { anims.forEach((a) => { a.currentTime = t }); xs.push({ t, o: +getComputedStyle(msg).opacity, ty: window.__ty(msg) }) }
  anims.forEach((a) => a.finish())
  return { before, info, xs, end: { o: +getComputedStyle(msg).opacity, ty: window.__ty(msg), text: msg.textContent }, s1: window.__space1 }
}, [id, change])

test.describe('I1 · el mensaje sale del campo', () => {
  test('al aparecer: fundido y baja de −space × 1 a 0 con --g-duration-press, con cuadros intermedios', async ({ page }) => {
    await mount(page)
    const r = await seekMessage(page, 'pi-a', 'submit')
    expect(r.before.empty).toBe(true)
    expect(r.before.o).toBe(0)
    expect(r.before.ty).toBeCloseTo(-r.s1, 2)
    expect(r.info.map((i) => i.prop).sort(), JSON.stringify(r.info)).toEqual(['opacity', 'translate'])
    expect(r.info.every((i) => Math.abs(i.dur - 160) < 0.5)).toBe(true) // --g-duration-press
    const mid = r.xs.filter((p) => p.ty < -0.05 && p.ty > -r.s1 + 0.05 && p.o > 0.02 && p.o < 0.98)
    expect(mid.length, 'cuadros intermedios (10ms)').toBeGreaterThanOrEqual(5)
    expect(r.xs.every((p, i) => i === 0 || p.ty >= r.xs[i - 1].ty - 0.001), 'baja sin volver atrás').toBe(true)
    expect(r.end).toMatchObject({ o: 1, ty: 0 })
    expect(r.end.text).toContain('Escribe tu nombre.')
    if (process.env.VERBOSE) console.log(`I1 ${test.info().project.name}: ${mid.length} muestras intermedias de 10ms, ${r.xs[0].ty.toFixed(2)} → ${r.end.ty}px`)
  })

  test('cambiar el texto con el mensaje visible no la repite', async ({ page }) => {
    await mount(page)
    await submit(page)
    // La entrada terminó: opacidad 1 y ninguna transición viva en el mensaje
    await page.waitForFunction(() => { const m = window.__msg('pi-a'); return !m.matches(':empty') && +getComputedStyle(m).opacity === 1 && m.getAnimations().length === 0 })
    const r = await seekMessage(page, 'pi-a', 'Mínimo dos letras.')
    expect(r.before, 'partía visible').toMatchObject({ o: 1, ty: 0, empty: false })
    expect(r.info, JSON.stringify(r.info)).toEqual([])
    expect(r.end).toMatchObject({ o: 1, ty: 0 })
    expect(r.end.text).toContain('Mínimo dos letras.')
  })

  test('un error que ya viene al montar no se anima (ni al llegar is-ready)', async ({ page }) => {
    // Se registra antes de montar: ninguna animación ni transición en el mensaje de #pi-z en todo el arranque
    await page.addInitScript(() => {
      window.__early = []
      for (const type of ['animationstart', 'transitionrun']) document.addEventListener(type, (e) => { if (e.target.classList?.contains('g-input__message')) window.__early.push({ type, name: e.animationName || e.propertyName, txt: e.target.textContent }) }, true)
    })
    await mount(page)
    const early = await page.evaluate(() => window.__early.filter((e) => e.txt.includes('Ya venía')))
    expect(early, JSON.stringify(early)).toEqual([])
    const st = await page.evaluate(() => { const m = window.__msg('pi-z'); return { o: +getComputedStyle(m).opacity, ty: window.__ty(m), n: m.getAnimations().length, ready: window.__root('pi-z').classList.contains('is-ready') } })
    expect(st).toEqual({ o: 1, ty: 0, n: 0, ready: true })
  })

  test('con movimiento reducido: solo fundido (--g-duration-fast), sin desplazamiento', async ({ page }) => {
    await mount(page, { reduce: true })
    const r = await seekMessage(page, 'pi-a', 'submit')
    expect(r.before.ty).toBe(0)
    expect(r.info.map((i) => i.prop), JSON.stringify(r.info)).toEqual(['opacity'])
    expect(r.info[0].dur).toBeCloseTo(120, 0) // --g-duration-fast
    expect(r.xs.every((p) => p.ty === 0)).toBe(true)
    expect(r.xs.filter((p) => p.o > 0.02 && p.o < 0.98).length).toBeGreaterThanOrEqual(3)
    expect(r.end).toMatchObject({ o: 1, ty: 0 })
  })
})

// ---------------------------------------------------------------------------------------------------------------------
// I2 en el resto de campos (form.md §2 «Rechazo al enviar»): GCheckbox, GSwitch, GRadioGroup, GCheckboxGroup, GFieldGroup,
// GInputGroup y GDatePicker (también split). Cada uno mueve su pieza (la caja / el riel / las opciones / la lista / las
// partes / la caja fusionada / el campo) con keyframes `g-reject-shake-<campo>`: una vez, decreciente, ≤ space × 1, vuelta a 0.
// ---------------------------------------------------------------------------------------------------------------------
const FIELDS = [
  { key: 'chk', root: '.g-checkbox', mover: '.g-checkbox__box' },
  { key: 'sw', root: '.g-switch', mover: '.g-switch__control' },
  { key: 'rad', root: '.g-radio-group', mover: '.g-radio-group__options' },
  { key: 'cg', root: '.g-checkbox-group', mover: '.g-checkbox-group__list' },
  { key: 'fg', root: '.g-field-group', mover: '.g-field-group__parts' },
  { key: 'ig', root: '.g-input-group', mover: '.g-input-group__box' },
  { key: 'dp', root: '.g-datepicker', mover: '.g-datepicker__field' },
  { key: 'dps', root: '.g-datepicker', mover: '.g-datepicker__fields' }
]

const mountFields = async (page, { reduce = false } = {}) => {
  await page.emulateMedia({ reducedMotion: reduce ? 'reduce' : 'no-preference' })
  await page.goto(PAGE)
  await page.waitForSelector('.g-btn')
  await page.evaluate((fields) => {
    const host = document.createElement('div')
    host.id = 'pj-host'
    host.style.padding = '48px'
    document.body.prepend(host)
    const { createApp, h, reactive } = window.Vue
    const G = window.Grana
    const errors = reactive({ chk: 'Acepta los términos.', sw: 'Activa esta opción.', rad: 'Elige una.', cg: 'Elige al menos una.', fg: 'Completa el grupo.', ig: 'Completa el teléfono.', dp: 'Elige una fecha.', dps: 'Elige un rango.' })
    const opts = [{ value: 'a', label: 'Alfa' }, { value: 'b', label: 'Beta' }]
    window.__errors = errors
    createApp({
      render: () => h(G.GForm, { id: 'pj-form', errors, showErrorsOn: 'submit' }, () => [
        h('div', { id: 'pj-chk' }, [h(G.GCheckbox, { name: 'chk', label: 'Acepto', modelValue: false })]),
        h('div', { id: 'pj-sw' }, [h(G.GSwitch, { name: 'sw', label: 'Notificaciones', modelValue: false })]),
        h('div', { id: 'pj-rad' }, [h(G.GRadioGroup, { name: 'rad', label: 'Plan', options: opts, modelValue: null })]),
        h('div', { id: 'pj-cg' }, [h(G.GCheckboxGroup, { name: 'cg', label: 'Intereses', options: opts, modelValue: [] })]),
        h('div', { id: 'pj-fg' }, [h(G.GFieldGroup, { name: 'fg', label: 'Datos' }, () => [h(G.GInput, { label: 'Uno' }), h(G.GInput, { label: 'Dos' })])]),
        h('div', { id: 'pj-ig' }, [h(G.GInputGroup, { name: 'ig', label: 'Teléfono' }, () => [h(G.GInputGroupText, { text: '+52', decorative: true }), h(G.GInputGroupInput, { name: 'ig-n', principal: true, type: 'tel' })])]),
        h('div', { id: 'pj-dp' }, [h(G.GDatePicker, { name: 'dp', label: 'Fecha', modelValue: null })]),
        h('div', { id: 'pj-dps' }, [h(G.GDatePicker, { name: 'dps', label: 'Rango', mode: 'range', split: true, labelStart: 'Desde', labelEnd: 'Hasta', modelValue: null })]),
        h('button', { id: 'pj-submit', type: 'submit' }, 'Enviar')
      ])
    }).mount(host)
    const probe = document.createElement('div'); probe.style.inlineSize = 'var(--g-space-1)'; document.body.appendChild(probe)
    window.__space1 = probe.getBoundingClientRect().width; probe.remove()
    const F = Object.fromEntries(fields.map((f) => [f.key, f]))
    window.__root = (key) => document.querySelector(`#pj-${key} ${F[key].root}`)
    window.__mover = (key) => window.__root(key).querySelector(F[key].mover)
    window.__tx = (el) => { const t = getComputedStyle(el).translate; if (!t || t === 'none') return 0; return parseFloat(t.split(' ')[0]) }
    window.__cssAnims = (el) => el.getAnimations().filter((a) => a.animationName !== undefined)
  }, FIELDS)
  await page.waitForSelector('#pj-dps .g-datepicker__fields')
  await page.waitForTimeout(150)
}

const seekField = (page, key) => page.evaluate((key) => new Promise((resolve) => {
  const root = window.__root(key); const mover = window.__mover(key)
  const timer = setTimeout(() => { mo.disconnect(); resolve({ found: false, rejected: root.classList.contains('is-rejected') }) }, 3000)
  const mo = new MutationObserver(() => {
    if (!root.classList.contains('is-rejected')) return
    mo.disconnect(); clearTimeout(timer)
    const a = window.__cssAnims(mover).find((x) => x.animationName.startsWith('g-reject'))
    if (!a) return resolve({ found: false, rejected: true, anim: getComputedStyle(mover).animationName })
    a.pause()
    const dur = a.effect.getComputedTiming().duration
    const xs = []
    for (let t = 0; t <= dur; t += 2) { a.currentTime = t; xs.push({ t, x: window.__tx(mover) }) }
    a.currentTime = 0
    a.play()
    resolve({ found: true, name: a.animationName, dur, iterations: a.effect.getComputedTiming().iterations, xs, s1: window.__space1 })
  })
  mo.observe(root, { attributes: true, attributeFilter: ['class'] })
  document.getElementById('pj-form').requestSubmit()
}), key)

test.describe('I2 · el aviso al enviar en el resto de campos', () => {
  for (const f of FIELDS) {
    test(`${f.key} (${f.mover}): sacudida decreciente ≤ space × 1, tres cambios de sentido, vuelta a 0, una vez, nombre g-reject-`, async ({ page }) => {
      await mountFields(page)
      const r = await seekField(page, f.key)
      expect(r.found, JSON.stringify(r)).toBe(true)
      expect(r.name).toMatch(/^g-reject-/)
      expect(r.dur).toBeCloseTo(240, 0)
      expect(r.iterations).toBe(1)
      const max = Math.max(...r.xs.map((p) => Math.abs(p.x)))
      expect(max, `máximo ${max}px`).toBeLessThanOrEqual(r.s1 + 0.01)
      expect(max).toBeGreaterThan(r.s1 * 0.9)
      expect(signChanges(r.xs), 'cambios de sentido').toBe(3)
      expect(Math.abs(r.xs.at(-1).x)).toBeLessThan(0.01)
      const peaks = [0.16, 0.36, 0.56, 0.76].map((p) => Math.abs(r.xs.reduce((b, q) => (Math.abs(q.t - p * r.dur) < Math.abs(b.t - p * r.dur) ? q : b)).x))
      for (let i = 1; i < peaks.length; i++) expect(peaks[i]).toBeLessThan(peaks[i - 1])
      // La retirada real: el animationend retira is-rejected y no queda animación
      await page.waitForFunction((key) => !window.__root(key).classList.contains('is-rejected'), f.key, { timeout: 2000 })
      expect(await page.evaluate((key) => window.__cssAnims(window.__mover(key)).length, f.key)).toBe(0)
      if (process.env.VERBOSE) console.log(`I2 ${f.key} ${test.info().project.name}: máx ${max.toFixed(3)}px (space ${r.s1}), ${r.name}`)
    })
  }

  test('en reposo nada se mueve; con movimiento reducido la clase se pone pero no hay animación ni desplazamiento', async ({ page }) => {
    await mountFields(page, { reduce: true })
    const rest = await page.evaluate((keys) => keys.map((k) => window.__tx(window.__mover(k))), FIELDS.map((f) => f.key))
    expect(rest.every((x) => x === 0)).toBe(true)
    const xs = await page.evaluate(async (keys) => {
      const xs = []; const t0 = performance.now()
      document.getElementById('pj-form').requestSubmit()
      await new Promise((res) => { (function f() { xs.push({ on: keys.map((k) => window.__root(k).classList.contains('is-rejected')), x: keys.map((k) => window.__tx(window.__mover(k))), n: keys.map((k) => window.__cssAnims(window.__mover(k)).length) }); if (performance.now() - t0 < 400) requestAnimationFrame(f); else res() })() })
      return xs
    }, FIELDS.map((f) => f.key))
    expect(xs.some((s) => s.on.every(Boolean)), 'is-rejected presente en todos').toBe(true)
    expect(xs.every((s) => s.x.every((x) => x === 0)), 'sin desplazamiento').toBe(true)
    expect(xs.every((s) => s.n.every((n) => n === 0)), 'sin animaciones').toBe(true)
  })
})
