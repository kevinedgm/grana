// GBtn · A · Retén (design/contracts/btn.md «Carga y acuse», DECISIONS.md #1010 a #1015; ronda design/lab/btn/r02/).
// V1 a V12 sobre el GBtn REAL del UMD (dist/), en una página mínima con grana.css. V13 (avisos) se mide con Vitest
// (src/devWarnings.test.js, GBtn.test.js) y `node design/lab/avisos-dev/verificar.mjs`: el UMD no avisa (no hay `process`).
// La curva del rebote se mide de forma determinista, como en personalidad-btn.spec.mjs.
// Ejecutar: GRANA_PW_PORT=4210 npx playwright test tests/btn-reten.spec.mjs   (VERBOSE=1 imprime las medidas)
import { test, expect } from '@playwright/test'

const V = !!process.env.VERBOSE
const { buildTheme } = await import('../../../../packages/cli/src/index.js')

const COLORS = ['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']
const VARIANTS = ['solid', 'soft', 'outline', 'ghost', 'link']

const shell = async (page, { css = '', dir = 'ltr', theme, zone = false } = {}) => {
  await page.route('**/__reten.html', (r) => r.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html dir="${dir}"${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/packages/vue/dist/grana.css"><style>body{margin:0;padding:48px;background:var(--g-color-surface);font-family:var(--g-font-ui)}${css}</style></head>
      <body><div id="host"${zone ? ' data-g-zone="brand" style="padding:16px"' : ''}><div id="app"></div></div>
      <script src="/node_modules/vue/dist/vue.global.js"></script><script src="/packages/vue/dist/grana.umd.js"></script></body></html>`
  }))
  await page.goto('/__reten.html')
}

// Un GBtn real con props reactivas: window.__set({...}). `model: true` hace de v-model:done. window.__onClick, opcional
const open = async (page, { props = {}, model = false, reduce = false, label = 'Enviar informe', ...rest } = {}) => {
  if (reduce) await page.emulateMedia({ reducedMotion: 'reduce' })
  await shell(page, rest)
  await page.evaluate(({ props, model, label }) => {
    const { createApp, h, reactive } = Vue
    const s = reactive(props)
    const on = reactive({ show: true })
    window.__ev = []
    window.__set = (p) => Object.assign(s, p)
    window.__unmount = () => { on.show = false }
    window.__nextTick = Vue.nextTick
    createApp({
      render: () => (on.show ? h(Grana.GBtn, {
        id: 'rt', ...s,
        'onUpdate:done': (v) => { window.__ev.push(`done:${v}`); if (model) s.done = v },
        onClick: () => { window.__ev.push('click'); if (window.__onClick) window.__onClick(s) }
      }, () => label) : null)
    }).mount('#app')
    window.__btn = () => document.getElementById('rt')
    window.__has = (c) => window.__btn().classList.contains(c)
    window.__status = () => { const r = document.querySelector('.g-btn__status'); return r ? r.textContent : null }
    window.__scale = () => { const m = getComputedStyle(window.__btn()).transform; return !m || m === 'none' ? 1 : +m.slice(m.indexOf('(') + 1).split(',')[0] }
    // Resuelve en el microtask de la mutación: antes de pintar, sin perderse una clase que dura poco
    window.__until = (pred) => new Promise((res) => {
      if (pred()) return res(performance.now())
      const o = new MutationObserver(() => { if (pred()) { o.disconnect(); res(performance.now()) } })
      o.observe(window.__btn(), { attributes: true, attributeFilter: ['class'] })
    })
    window.__wait = (ms) => new Promise((res) => setTimeout(res, ms))
    window.__frame = () => new Promise(requestAnimationFrame)
    window.__sample = (fn, ms) => new Promise((res) => {
      const xs = []; const t0 = performance.now()
      ;(function f() { xs.push({ t: performance.now() - t0, v: fn() }); if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(xs) })()
    })
  }, { props, model, label })
  await page.waitForSelector('#rt')
}

// Carga de ms milisegundos que se vio: acaba a la llegada
const loadSeen = (page, patch = {}) => page.evaluate(async (patch) => {
  __set({ loading: true })
  await __until(() => __has('is-shown'))
  await __wait(50)
  __set({ loading: false, ...patch })
  await __until(() => !__has('is-loading'))
}, patch)

test.describe('V1 · hundido', () => {
  test('0,970 sostenido con loading, ida en 120 ms, desde el primer cuadro', async ({ page }) => {
    await open(page)
    const r = await page.evaluate(async () => {
      __set({ loading: true })
      await __nextTick()
      const cs = getComputedStyle(__btn())
      const i = cs.transitionProperty.split(',').map((x) => x.trim()).indexOf('transform')
      const ida = parseFloat(cs.transitionDuration.split(',')[i]) * 1000
      await __wait(300)
      const a = __scale()
      await __wait(900)
      return { ida, a, b: __scale() }
    })
    expect(r.ida).toBeCloseTo(120, 0)
    expect(r.a).toBeCloseTo(0.97, 3)
    expect(r.b).toBeCloseTo(0.97, 3)
  })

  test('Enter en una acción con carga: escala mínima 0,970 (medida de kiwi: 1)', async ({ page }) => {
    await open(page)
    await page.evaluate(() => { window.__onClick = (s) => { s.loading = true } })
    await page.locator('#rt').focus()
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => __has('is-loading'))
    // Sin plazo fijo: con la máquina cargada, WebKit puede tardar más de 200 ms en pintar la ida de 120 ms
    await page.waitForFunction(() => __scale() < 0.9705)
    expect(await page.evaluate(() => __scale())).toBeCloseTo(0.97, 3)
  })

  for (const [name, opts] of [['link', { props: { variant: 'link' } }], ['disabled', { props: { disabled: true } }], ['reduce', { reduce: true }]]) {
    test(`escala 1 con ${name}`, async ({ page }) => {
      await open(page, opts)
      await page.evaluate(() => __set({ loading: true }))
      await page.waitForTimeout(260)
      expect(await page.evaluate(() => __scale())).toBe(1)
    })
  }
})

test.describe('V2 · suelta', () => {
  test('sin puntero: pico 1,006 ± 0,0005 y asentado antes de 240 ms', async ({ page }) => {
    await open(page)
    const curve = await page.evaluate(async () => {
      __set({ loading: true })
      await __until(() => __has('is-shown'))
      await __wait(50)
      __set({ loading: false })
      await __until(() => !__has('is-loading'))
      const el = __btn()
      let a
      for (let i = 0; i < 20 && !a; i++) { getComputedStyle(el).transform; a = el.getAnimations().find((x) => x.transitionProperty === 'transform'); if (!a) await __frame() }
      if (!a) return null
      a.pause()
      const dur = a.effect.getComputedTiming().duration
      const easing = a.effect.getTiming().easing
      const xs = []
      for (let t = 0; t <= dur; t += 2) { a.currentTime = t; xs.push({ t, v: __scale() }) }
      a.finish()
      return { dur, easing, xs }
    })
    expect(curve, 'hay transición de transform al llegar').toBeTruthy()
    expect(curve.dur).toBeCloseTo(240, 0)
    expect(curve.easing.startsWith('linear(')).toBe(true)
    const max = Math.max(...curve.xs.map((x) => x.v))
    expect(Math.abs(max - 1.006), `pico ${max.toFixed(5)}`).toBeLessThanOrEqual(0.0005)
    const off = curve.xs.filter((x) => Math.abs(x.v - 1) > 0.0005)
    expect(off.at(-1).t).toBeLessThan(240)
    if (V) console.log(`V2 ${test.info().project.name}: pico ${max.toFixed(5)}, asentado a ${off.at(-1).t + 2} ms`)
  })

  test('con movimiento reducido: 1 siempre', async ({ page }) => {
    await open(page, { reduce: true })
    const xs = await page.evaluate(async () => {
      const run = __sample(() => __scale(), 1000)
      __set({ loading: true })
      await __wait(300)
      __set({ loading: false })
      return run
    })
    expect(xs.every((x) => x.v === 1)).toBe(true)
  })
})

test.describe('V3 · F1 y relleno', () => {
  for (const variant of VARIANTS) {
    test(`${variant}: a la vista, Δ 0 con y sin puntero; pendiente = hover sin puntero`, async ({ page }) => {
      await open(page, { props: { variant }, css: '.g-btn{transition:none!important}' })
      const read = () => page.evaluate(() => {
        const cs = getComputedStyle(__btn())
        return { bg: cs.backgroundColor, fg: cs.color, bd: cs.borderTopColor, deco: cs.textDecorationThickness }
      })
      const away = async () => { await page.mouse.move(0, 0); await page.waitForTimeout(30) }
      const over = async () => { const b = await page.locator('#rt').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(30) }
      await away()
      const rest = await read()
      await over()
      const hover = await read()
      await away()
      const pending = await page.evaluate(async () => {
        __set({ loading: true })
        await __nextTick()
        const cs = getComputedStyle(__btn())
        return { bg: cs.backgroundColor, fg: cs.color, bd: cs.borderTopColor, deco: cs.textDecorationThickness, shown: __has('is-shown') }
      })
      expect(pending.shown).toBe(false)
      expect({ ...pending, shown: undefined }).toEqual({ ...hover, shown: undefined })
      await page.evaluate(() => __until(() => __has('is-shown')))
      expect(await read(), 'a la vista sin puntero = reposo').toEqual({ ...rest, deco: (await read()).deco })
      await over()
      expect((await read()).bg, 'a la vista con puntero = reposo').toBe(rest.bg)
      if (variant !== 'link') expect(await read()).toEqual({ ...rest, deco: (await read()).deco })
      if (V) console.log(`V3 ${test.info().project.name} ${variant}: reposo ${rest.bg}, hover ${hover.bg}`)
    })
  }
})

test.describe('V4 · F2', () => {
  test('100 ms: etiqueta a 1, giro a 0 en todos los cuadros y región sin escribir', async ({ page }) => {
    await open(page, { props: { loadingText: 'Guardando…' } })
    const r = await page.evaluate(async () => {
      const said = []
      const reg = document.querySelector('.g-btn__status')
      new MutationObserver(() => said.push(reg.textContent)).observe(reg, { childList: true, characterData: true, subtree: true })
      const l = __btn().querySelector('.g-btn__label'); const g = __btn().querySelector('.g-btn__loader')
      const run = __sample(() => ({ l: +getComputedStyle(l).opacity, g: +getComputedStyle(g).opacity }), 500)
      __set({ loading: true })
      await __wait(100)
      __set({ loading: false })
      const xs = await run
      return { xs, said, shown: __has('is-shown') }
    })
    expect(r.xs.filter((x) => x.v.l < 0.5).length, 'cuadros con etiqueta < 0,5').toBe(0)
    expect(r.xs.every((x) => x.v.l === 1 && x.v.g === 0)).toBe(true)
    expect(r.said).toEqual([])
    if (V) console.log(`V4 ${test.info().project.name}: ${r.xs.length} cuadros, 0 con etiqueta < 0,5`)
  })

  test('1,2 s: is-shown a 200 ms y texto en la región', async ({ page }) => {
    await open(page, { props: { loadingText: 'Guardando…' } })
    const r = await page.evaluate(async () => {
      const t0 = performance.now()
      __set({ loading: true })
      const t1 = await __until(() => __has('is-shown'))
      await __nextTick()
      const said = __status()
      await __wait(1000)
      return { at: t1 - t0, said }
    })
    expect(r.at).toBeGreaterThanOrEqual(195)
    expect(r.at).toBeLessThan(260)
    expect(r.said).toBe('Guardando…')
  })

  test('loading a false a los 250 ms: giro a la vista ≥ 400 ms y clic ignorado en la cola', async ({ page }) => {
    await open(page)
    const r = await page.evaluate(async () => {
      __set({ loading: true })
      const shown = await __until(() => __has('is-shown'))
      await __wait(50)
      __set({ loading: false })
      await __nextTick()
      const queue = { busy: __btn().getAttribute('aria-busy'), loading: __has('is-loading') }
      __btn().click()
      const arrived = await __until(() => !__has('is-loading'))
      const clicks = __ev.length
      await __nextTick()
      __btn().click()
      return { visible: arrived - shown, queue, clicks, after: __ev.length }
    })
    expect(r.visible).toBeGreaterThanOrEqual(395)
    expect(r.queue).toEqual({ busy: 'true', loading: true })
    expect(r.clicks).toBe(0)
    expect(r.after).toBe(1)
  })
})

test.describe('V5 · F3', () => {
  test('con is-leaving la rotación avanza entre dos cuadros; después, pausada', async ({ page }) => {
    await open(page)
    const r = await page.evaluate(async () => {
      const g = __btn().querySelector('.g-btn__loader')
      const rot = () => parseFloat(getComputedStyle(g).rotate) || 0
      __set({ loading: true })
      await __until(() => __has('is-shown'))
      await __wait(50)
      __set({ loading: false })
      await __until(() => __has('is-leaving'))
      await __nextTick()
      const a = rot(); await __frame(); await __frame(); const b = rot()
      const during = __has('is-leaving')
      await __until(() => !__has('is-leaving'))
      await __wait(30)
      const c = rot(); await __frame(); await __frame(); const d = rot()
      return { a, b, c, d, during }
    })
    expect(r.during, 'dos cuadros caben en is-leaving').toBe(true)
    expect(r.b).not.toBe(r.a)
    expect(r.d).toBe(r.c)
    if (V) console.log(`V5 ${test.info().project.name}: ${r.a} → ${r.b}; después ${r.c} = ${r.d}`)
  })
})

test.describe('V6 · acuse', () => {
  test('is-done a la llegada, retirada a 960 ms ± 50, un update:done, doneText en la región y después vacía; el mismo texto se reescribe', async ({ page }) => {
    await open(page, { props: { doneText: 'Guardado' }, model: true })
    const r = await page.evaluate(async () => {
      __set({ loading: true })
      await __until(() => __has('is-shown'))
      await __wait(50)
      __set({ loading: false, done: true })
      await __nextTick()
      const early = __has('is-done') // cola del mínimo: aún no
      const t0 = await __until(() => __has('is-done'))
      const loadingAtMark = __has('is-loading')
      await __wait(100)
      const said = __status()
      const t1 = await __until(() => !__has('is-done'))
      await __nextTick()
      const gone = __status()
      const ev = [...__ev]
      __set({ done: true })
      await __nextTick()
      const second = [__status()]
      await __wait(70)
      second.push(__status())
      return { early, loadingAtMark, said, gone, ev, ms: t1 - t0, second }
    })
    expect(r.early).toBe(false)
    expect(r.loadingAtMark).toBe(false)
    expect(r.said).toBe('Guardado')
    expect(r.gone).toBe('')
    expect(r.ev).toEqual(['done:false'])
    expect(Math.abs(r.ms - 960), `${r.ms} ms`).toBeLessThanOrEqual(50)
    expect(r.second).toEqual(['', 'Guardado'])
    if (V) console.log(`V6 ${test.info().project.name}: retirada a ${r.ms.toFixed(1)} ms`)
  })

  test('el trazo son keyframes de --g-duration-slow y al retirarse funde una marca entera', async ({ page }) => {
    await open(page, { props: { doneText: 'Guardado' } })
    const r = await page.evaluate(async () => {
      __set({ done: true })
      await __nextTick()
      await __frame()
      const path = __btn().querySelector('.g-btn__done path')
      const anim = path.getAnimations()[0]
      const info = { name: anim && anim.animationName, dur: anim && anim.effect.getComputedTiming().duration, len: path.getAttribute('pathLength') }
      await __until(() => !__has('is-done'))
      await __nextTick()
      const m = __btn().querySelector('.g-btn__done')
      const fade = m.getAnimations().filter((a) => a.transitionProperty === 'opacity').length
      return { ...info, offset: getComputedStyle(path).strokeDashoffset, fade }
    })
    expect(r.name).toBe('g-btn-done-draw')
    expect(r.dur).toBeCloseTo(240, 0)
    expect(r.len).toBe('1')
    expect(parseFloat(r.offset)).toBe(0)
    expect(r.fade).toBe(1)
  })
})

test.describe('V7 · interrupciones y flancos', () => {
  const ack = (page) => page.evaluate(async () => { __set({ done: true }); await __until(() => __has('is-done')); await __wait(80) })
  const after = (page) => page.evaluate(async () => { await __wait(1100); return { ev: __ev, done: __has('is-done'), said: __status() } })

  test('clic con puntero: update:done y después click; la región se vacía', async ({ page }) => {
    await open(page, { props: { doneText: 'Guardado' }, model: true })
    await ack(page)
    await page.locator('#rt').click()
    expect(await after(page)).toEqual({ ev: ['done:false', 'click'], done: false, said: '' })
  })

  test('Enter y Espacio: el mismo orden, sin mover el foco', async ({ page }) => {
    await open(page, { props: { doneText: 'Guardado' }, model: true })
    await page.locator('#rt').focus()
    for (const key of ['Enter', 'Space']) {
      await ack(page)
      await page.keyboard.press(key)
      await page.evaluate(() => __nextTick())
      expect(await page.evaluate(() => __has('is-done'))).toBe(false)
    }
    expect((await after(page)).ev).toEqual(['done:false', 'click', 'done:false', 'click'])
    expect(await page.evaluate(() => document.activeElement.id)).toBe('rt')
  })

  test('con type="submit" el envío sigue', async ({ page }) => {
    await open(page, { props: { type: 'submit' }, model: true })
    await page.evaluate(() => {
      const f = document.createElement('form')
      __btn().parentNode.insertBefore(f, __btn()); f.appendChild(__btn())
      f.addEventListener('submit', (e) => { e.preventDefault(); __ev.push('submit') })
    })
    await ack(page)
    await page.locator('#rt').click()
    expect((await after(page)).ev).toEqual(['done:false', 'click', 'submit'])
  })

  test('una acción síncrona que vuelve a afirmar es un acuse nuevo y el tiempo vuelve a empezar', async ({ page }) => {
    await open(page, { props: { doneText: 'Copiado' }, model: true })
    await page.evaluate(() => { window.__onClick = (s) => { s.done = true } })
    await ack(page)
    await page.waitForTimeout(600)
    const r = await page.evaluate(async () => {
      __btn().click()
      await __nextTick(); await __nextTick()
      const on = __has('is-done')
      const t0 = performance.now()
      const t1 = await __until(() => !__has('is-done'))
      return { on, ms: t1 - t0, ev: [...__ev] }
    })
    expect(r.on).toBe(true)
    expect(Math.abs(r.ms - 960)).toBeLessThanOrEqual(60)
    expect(r.ev).toEqual(['done:false', 'click', 'done:false'])
  })

  test('loading a true: retira con update:done y empieza la carga', async ({ page }) => {
    await open(page, { props: { doneText: 'Guardado' }, model: true })
    await ack(page)
    const r = await page.evaluate(async () => { __set({ loading: true }); await __nextTick(); return { done: __has('is-done'), load: __has('is-loading'), said: __status(), ev: [...__ev] } })
    expect(r).toEqual({ done: false, load: true, said: '', ev: ['done:false'] })
  })

  test('disabled retira la marca, el anuncio sigue hasta 960 ms', async ({ page }) => {
    await open(page, { props: { doneText: 'Guardado' }, model: true })
    const r = await page.evaluate(async () => {
      __set({ done: true })
      const t0 = await __until(() => __has('is-done'))
      await __wait(100)
      __set({ disabled: true })
      await __nextTick()
      const at = { done: __has('is-done'), said: __status(), ev: [...__ev] }
      await __wait(500)
      const still = __status()
      await __wait(450)
      return { at, still, end: __status(), ms: performance.now() - t0, ev: [...__ev] }
    })
    expect(r.at).toEqual({ done: false, said: 'Guardado', ev: ['done:false'] })
    expect(r.still).toBe('Guardado')
    expect(r.end).toBe('')
    expect(r.ev).toEqual(['done:false'])
  })

  test('disabled en el mismo cambio que done: sin marca, con anuncio y update:done en el acto', async ({ page }) => {
    await open(page, { props: { doneText: 'Guardado' }, model: true })
    const r = await page.evaluate(async () => {
      __set({ done: true, disabled: true })
      await __nextTick()
      const ev = [...__ev]
      await __wait(80)
      return { ev, mark: !!__btn().querySelector('.g-btn__done'), said: __status() }
    })
    expect(r).toEqual({ ev: ['done:false'], mark: false, said: 'Guardado' })
  })

  test('la aplicación pone done en false: se retira sin emitir', async ({ page }) => {
    await open(page, { props: { doneText: 'Guardado' } })
    await ack(page)
    await page.evaluate(async () => { __set({ done: false }); await __nextTick() })
    expect(await after(page)).toEqual({ ev: [], done: false, said: '' })
  })

  test('done con carga efectiva, en cualquier orden: espera a la llegada; vuelve a false: sin acuse', async ({ page }) => {
    await open(page, { props: { loading: false }, model: true })
    const r = await page.evaluate(async () => {
      __set({ loading: true })
      await __wait(50)
      __set({ done: true })
      await __until(() => __has('is-shown'))
      const during = __has('is-done')
      await __wait(50)
      __set({ loading: false })
      await __until(() => __has('is-done'))
      const load = __has('is-loading')
      await __until(() => !__has('is-done'))
      __ev.length = 0
      __set({ loading: true })
      await __wait(30)
      __set({ done: true })
      await __wait(30)
      __set({ done: false })
      await __wait(30)
      __set({ loading: false })
      await __wait(100)
      return { during, load, second: __has('is-done'), ev: [...__ev] }
    })
    expect(r).toEqual({ during: false, load: false, second: false, ev: [] })
  })

  test('desmontar: ni emite ni deja errores', async ({ page }) => {
    const errs = []
    page.on('pageerror', (e) => errs.push(e.message))
    await open(page, { props: { doneText: 'Guardado', loadingText: 'Guardando…' } })
    await ack(page)
    await page.evaluate(async () => { __unmount(); await __nextTick(); await __wait(1100) })
    expect(await page.evaluate(() => __ev)).toEqual([])
    expect(errs).toEqual([])
  })
})

test.describe('V8 · estabilidad', () => {
  const SIZE = `() => { const b = __btn(); const cs = getComputedStyle(b); return [cs.inlineSize, cs.blockSize, b.offsetWidth, b.offsetHeight].join(' ') }`
  for (const [name, opts] of [
    ['por defecto', {}],
    ['icon', { props: { icon: true, 'aria-label': 'Enviar' }, label: 'x' }],
    ['block', { props: { block: true } }],
    ['RTL', { dir: 'rtl' }]
  ]) {
    test(`${name}: ancho y alto Δ 0 en las cinco fases y foco quieto`, async ({ page }) => {
      await open(page, { ...opts, props: { ...opts.props, doneText: 'Guardado' }, model: true })
      await page.locator('#rt').focus()
      const r = await page.evaluate(async (src) => {
        const size = new Function('return (' + src + ')()')
        const out = { reposo: size() }
        __set({ loading: true })
        await __nextTick()
        out.pendiente = size()
        await __until(() => __has('is-shown'))
        await __nextTick()
        out.vista = size()
        await __wait(50)
        __set({ loading: false, done: true })
        await __until(() => __has('is-leaving'))
        await __nextTick()
        out.salida = size()
        out.acuse = size()
        const both = __has('is-done')
        await __wait(200)
        out.fin = size()
        return { out, both, focus: document.activeElement.id }
      }, SIZE)
      expect(r.both, 'is-leaving e is-done coinciden').toBe(true)
      expect(new Set(Object.values(r.out)).size, JSON.stringify(r.out)).toBe(1)
      expect(r.focus).toBe('rt')
    })
  }

  test('nombre = etiqueta en las cinco fases (Chromium, árbol AX, reloj detenido)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'árbol de accesibilidad por CDP: solo Chromium')
    await page.clock.install()
    await open(page, { props: { doneText: 'Guardado', loadingText: 'Guardando…' } })
    const client = await page.context().newCDPSession(page)
    const name = async () => {
      const { nodes } = await client.send('Accessibility.getFullAXTree')
      return nodes.find((n) => !n.ignored && n.role?.value === 'button')?.name?.value
    }
    const classes = () => page.evaluate(() => [...__btn().classList].filter((c) => c.startsWith('is-')).join(' '))
    expect(await name()).toBe('Enviar informe')
    await page.evaluate(async () => { __set({ loading: true }); await __nextTick() })
    expect(await classes()).toBe('is-loading')
    expect(await name()).toBe('Enviar informe')
    await page.clock.runFor(200)
    expect(await classes()).toBe('is-loading is-shown')
    expect(await name()).toBe('Enviar informe')
    await page.evaluate(async () => { __set({ loading: false, done: true }); await __nextTick() })
    await page.clock.runFor(400)
    expect(await classes()).toBe('is-leaving is-done')
    expect(await name()).toBe('Enviar informe')
    await page.clock.runFor(120)
    expect(await classes()).toBe('is-done')
    expect(await name()).toBe('Enviar informe')
  })
})

test.describe('V9 · montaje', () => {
  test('con done: sin is-done, sin g-btn__done ni texto y un update:done(false)', async ({ page }) => {
    await open(page, { props: { done: true, doneText: 'Guardado' }, model: true })
    const r = await page.evaluate(async () => { await __wait(1100); return { done: __has('is-done'), mark: !!document.querySelector('.g-btn__done'), said: __status(), ev: __ev } })
    expect(r).toEqual({ done: false, mark: false, said: '', ev: ['done:false'] })
  })

  test('con loading: is-shown desde el primer render y cero transiciones', async ({ page }) => {
    await open(page, { props: { loading: true } })
    const r = await page.evaluate(() => ({ shown: __has('is-shown'), scale: __scale(), trans: __btn().getAnimations({ subtree: true }).filter((a) => a.transitionProperty !== undefined).length }))
    expect(r).toEqual({ shown: true, scale: expect.closeTo(0.97, 3), trans: 0 })
  })
})

test.describe('V10 · reposo', () => {
  test('300 GBtn en reposo: el DOM de hoy, sin marca ni región', async ({ page }) => {
    await shell(page)
    const r = await page.evaluate(async () => {
      const { createApp, h } = Vue
      createApp({ render: () => Array.from({ length: 300 }, (_, i) => h(Grana.GBtn, { size: 'sm' }, () => `B${i}`)) }).mount('#app')
      await Vue.nextTick()
      const b = document.querySelector('.g-btn')
      return { done: document.querySelectorAll('.g-btn__done').length, status: document.querySelectorAll('.g-btn__status').length, kids: [...b.children].map((k) => k.getAttribute('class')) }
    })
    expect(r.done).toBe(0)
    expect(r.status).toBe(0)
    expect(r.kids).toHaveLength(2)
    expect(r.kids[0]).toContain('g-btn__label')
    expect(r.kids[1]).toContain('g-btn__loader')
  })
})

test.describe('V11 · tema', () => {
  const THEMES = [
    { name: 'por defecto', css: '' },
    ...[
      ['T1', { brand: '#1B1F4B', dark: true }],
      ['T2', { brand: '#F2C200', dark: true }],
      ['T3', { brand: '#E6007E', accent: '#00A3FF', dark: true }],
      ['T4', { brand: '#7A1F5C', accent: '#0F766E', dark: false }],
      ['T5', { brand: '#0F3D2E', primary: '#FFD400', dark: true }]
    ].map(([name, config]) => ({ name, css: buildTheme(config).css, noDark: config.dark === false }))
  ]
  const measure = () => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1
    const ctx = cv.getContext('2d', { willReadFrequently: true })
    const rgba = (s) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = s; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
    const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
    const lum = (k) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(k[0]) + 0.7152 * f(k[1]) + 0.0722 * f(k[2]) }
    const ratio = (a, b) => { const x = lum(a); const y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
    const surface = (el) => { const ls = []; for (let n = el.parentElement; n; n = n.parentElement) { const k = rgba(getComputedStyle(n).backgroundColor); if (k[3] > 0) { ls.push(k); if (k[3] >= 1) break } } let b = [255, 255, 255, 1]; for (let i = ls.length - 1; i >= 0; i--) b = over(ls[i], b); return b }
    return [...document.querySelectorAll('.g-btn')].map((b) => {
      const mark = b.querySelector('.g-btn__done')
      const bg = over(rgba(getComputedStyle(b).backgroundColor), surface(b))
      return { key: b.dataset.k, r: ratio(over(rgba(getComputedStyle(mark).color), bg), bg), shown: getComputedStyle(mark).opacity === '1' && b.classList.contains('is-done') }
    })
  }
  for (const t of THEMES) {
    test(`marca ≥ 3:1 en los 35 pares · ${t.name}, claro y oscuro, con y sin zona de marca`, async ({ page }) => {
      test.setTimeout(120000)
      const worst = []
      for (const scheme of ['light', 'dark']) for (const zone of [false, true]) {
        await page.emulateMedia({ colorScheme: scheme })
        await shell(page, { css: `${t.css}.g-btn,.g-btn *{transition:none!important;animation:none!important}`, zone, theme: t.noDark ? undefined : scheme })
        const rows = await page.evaluate(async ({ COLORS, VARIANTS }) => {
          const { createApp, h, reactive, nextTick } = Vue
          const s = reactive({ done: false })
          createApp({ render: () => COLORS.flatMap((color) => VARIANTS.map((variant) => h(Grana.GBtn, { color, variant, done: s.done, doneText: 'Hecho', 'data-k': `${color}/${variant}` }, () => 'Acción'))) }).mount('#app')
          await nextTick()
          s.done = true
          await nextTick()
          return null
        }, { COLORS, VARIANTS }).then(() => page.evaluate(measure))
        expect(rows).toHaveLength(35)
        expect(rows.every((x) => x.shown)).toBe(true)
        for (const x of rows) worst.push({ ...x, at: `${scheme}${zone ? ' zona' : ''}` })
      }
      worst.sort((a, b) => a.r - b.r)
      if (V) console.log(`V11 ${test.info().project.name} ${t.name}: mínimo ${worst[0].r.toFixed(2)}:1 en ${worst[0].key} (${worst[0].at})`)
      expect(worst.filter((x) => x.r < 3).map((x) => `${x.key} ${x.at} ${x.r.toFixed(2)}`)).toEqual([])
    })
  }

  test('forced-colors: la marca se ve y hereda el color del sistema', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'forced-colors emulado: solo Chromium')
    await page.emulateMedia({ forcedColors: 'active' })
    await open(page, { props: { doneText: 'Guardado' } })
    const r = await page.evaluate(async () => {
      __set({ done: true })
      await __until(() => __has('is-done'))
      await __wait(300)
      const m = __btn().querySelector('.g-btn__done')
      return { o: getComputedStyle(m).opacity, same: getComputedStyle(m).color === getComputedStyle(__btn()).color, stroke: getComputedStyle(m).stroke }
    })
    expect(r.o).toBe('1')
    expect(r.same).toBe(true)
  })

  for (const [name, css, press] of [
    ['--g-press-scale: 1', ':root{--g-press-scale:1}', 1],
    ['--g-duration-slow: 0ms', ':root{--g-duration-slow:0ms}', 0.97]
  ]) {
    test(`${name}: sin escala si toca y se sigue retirando a 960 ms`, async ({ page }) => {
      await open(page, { props: { doneText: 'Guardado' }, css })
      const r = await page.evaluate(async () => {
        __set({ loading: true })
        await __wait(300)
        const scale = __scale()
        __set({ loading: false, done: true })
        const t0 = await __until(() => __has('is-done'))
        const t1 = await __until(() => !__has('is-done'))
        return { scale, ms: t1 - t0 }
      })
      expect(r.scale).toBeCloseTo(press, 3)
      expect(Math.abs(r.ms - 960)).toBeLessThanOrEqual(50)
    })
  }
})

test.describe('V12 · reducido', () => {
  test('sin keyframes del trazo, marca completa desde el primer cuadro, retirada a 960 ms', async ({ page }) => {
    await open(page, { props: { doneText: 'Guardado' }, reduce: true })
    const r = await page.evaluate(async () => {
      __set({ done: true })
      const t0 = await __until(() => __has('is-done'))
      await __nextTick()
      const path = __btn().querySelector('.g-btn__done path')
      const first = { anims: path.getAnimations().length, offset: parseFloat(getComputedStyle(path).strokeDashoffset) }
      const t1 = await __until(() => !__has('is-done'))
      return { first, ms: t1 - t0 }
    })
    expect(r.first).toEqual({ anims: 0, offset: 0 })
    expect(Math.abs(r.ms - 960)).toBeLessThanOrEqual(50)
  })
})

test.describe('Playground real (#sec-btn)', () => {
  test('guardar con acuse, guardar que falla y copiar', async ({ page }) => {
    const errs = []
    page.on('pageerror', (e) => errs.push(e.message))
    await page.goto('/packages/vue/playground/index.html')
    const ok = page.locator('#pg-reten-ok'); const fail = page.locator('#pg-reten-fail'); const copy = page.locator('#pg-reten-copy')
    await ok.click()
    await expect(ok).toHaveClass(/is-shown/)
    await expect(ok).toHaveClass(/is-done/, { timeout: 3000 })
    await expect(ok.locator('~ .g-btn__status').first()).toHaveText('Guardado')
    await expect(ok).not.toHaveClass(/is-done/, { timeout: 2000 })
    await fail.click()
    await expect(fail).toHaveClass(/is-loading/)
    await expect(fail).not.toHaveClass(/is-loading/, { timeout: 3000 })
    await expect(fail).not.toHaveClass(/is-done/)
    await expect(fail.locator('.g-btn__done')).toHaveCount(0)
    await copy.click()
    await expect(copy).toHaveClass(/is-done/)
    await expect(copy).not.toHaveClass(/is-done/, { timeout: 2000 })
    await copy.click()
    await expect(copy).toHaveClass(/is-done/)
    expect(errs).toEqual([])
  })
})
