// GDialog · personalidad (DECISIONS.md #281, #299 y #301; design/contracts/dialog.md «Personalidad»; plan 019).
// D1 «viene de donde lo llamaste» y D2 «crece hacia abajo», medidos sobre el GDialog REAL del UMD (window.Grana),
// montado en la página del playground. Criterio de hecho: la medida de kiwi (personalidad/r01 §4).
// El primer cuadro de D1 se lee de forma determinista: se pausa la transición CSS real (Web Animations) en t = 0. Los
// cuadros intermedios y la salida sí se cuentan en tiempo real (rAF), como hizo kiwi. WebKit no enfoca un botón con un
// clic: allí se abre con teclado (como kiwi) o enfocando el disparador por programa.
import { test, expect } from '@playwright/test'

// Página ligera (el listado de dist/ que sirve http.server) con el CSS y el UMD reales: en el playground completo, con
// la máquina cargada, el primer cuadro tras cerrar llegó a tardar más de 1s y la salida (120ms) no dejaba cuadros.
const PAGE = '/packages/vue/dist/'

// Monta un GDialog real con un disparador fijo en (x, y) del visor. window.__open(v), window.__grow(px).
const mount = async (page, { x = 100, y = 100, reduce = false, viewport, props = {} } = {}) => {
  if (reduce) await page.emulateMedia({ reducedMotion: 'reduce' })
  // Visor fijo (el proyecto «Desktop Chrome» trae 1280×720): las posiciones del disparador se dan sobre 1280×900
  await page.setViewportSize(viewport || { width: 1280, height: 900 })
  await page.goto(PAGE)
  // Se inyectan a mano y en orden, esperando cada `load` (addStyleTag falló a veces en Firefox con este listado)
  await page.evaluate(async () => {
    // Con reintentos: otro agente puede estar reconstruyendo dist/ en ese instante
    const once = (tag, attrs) => new Promise((res, rej) => {
      const el = Object.assign(document.createElement(tag), attrs)
      el.onload = res; el.onerror = () => { el.remove(); rej(new Error('no cargó ' + (attrs.href || attrs.src))) }
      document.head.appendChild(el)
    })
    const add = async (tag, attrs) => {
      for (let i = 0; ; i++) {
        try { return await once(tag, attrs) } catch (e) { if (i >= 20) throw e; await new Promise((r) => setTimeout(r, 500)) }
      }
    }
    await add('link', { rel: 'stylesheet', href: '/packages/vue/dist/grana.css' })
    await add('script', { src: '/node_modules/vue/dist/vue.global.js' })
    await add('script', { src: '/packages/vue/dist/grana.umd.js' })
  })
  await page.evaluate(({ x, y, props }) => {
    const host = document.createElement('div')
    host.id = 'pd-host'
    document.body.prepend(host)
    const { createApp, h, ref } = window.Vue
    const open = ref(false)
    const grow = ref(0)
    window.__open = (v) => { open.value = v }
    window.__grow = (v) => { grow.value = v }
    const { GDialog, GBtn } = window.Grana
    createApp({
      render: () => [
        h('button', {
          id: 'pd-trigger', type: 'button',
          style: `position:fixed;left:${x}px;top:${y}px;transform:translate(-50%,-50%);z-index:1;inline-size:120px;block-size:40px`,
          onClick: () => { open.value = true }
        }, 'Abrir'),
        h(GDialog, {
          id: 'pd', title: 'Editar fila', modelValue: open.value, ...props,
          'onUpdate:modelValue': (v) => { open.value = v }
        }, {
          default: () => [
            h('p', 'Contenido del diálogo.'),
            h('div', { id: 'pd-block', style: `block-size:${grow.value}px` })
          ],
          footer: () => h(GBtn, { id: 'pd-save' }, () => 'Guardar')
        })
      ]
    }).mount(host)
    const probe = document.createElement('div'); probe.style.inlineSize = 'var(--g-space-1)'; document.body.appendChild(probe)
    window.__space1 = probe.getBoundingClientRect().width; probe.remove()
    window.__tr = (el) => {
      const t = getComputedStyle(el).translate
      if (!t || t === 'none') return { x: 0, y: 0 }
      const [a = '0px', b = '0px'] = t.split(' ')
      return { x: parseFloat(a), y: parseFloat(b) }
    }
    // El watcher de GDialog llama a showModal() tras el render (flush post): basta con esperar microtareas
    window.__opened = async () => {
      for (let i = 0; i < 20; i++) { const d = document.querySelector('dialog.g-dialog[open]'); if (d) return d; await window.Vue.nextTick() }
      return new Promise((res) => { (function f() { const d = document.querySelector('dialog.g-dialog[open]'); d ? res(d) : requestAnimationFrame(f) })() })
    }
    window.__sample = (fn, ms) => new Promise((res) => {
      const xs = []; const t0 = performance.now()
      ;(function f() { xs.push({ t: performance.now() - t0, v: fn() }); if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(xs) })()
    })
  }, { x, y, props })
  await page.waitForSelector('#pd-trigger')
  await page.waitForTimeout(50)
}

// Abre con el disparador enfocado y lee el primer cuadro (transición de translate pausada en t = 0).
const openAndFirstFrame = (page) => page.evaluate(async () => {
  const trigger = document.getElementById('pd-trigger')
  trigger.focus()
  const r = trigger.getBoundingClientRect()
  const vec = { x: r.left + r.width / 2 - innerWidth / 2, y: r.top + r.height / 2 - innerHeight / 2 }
  window.__open(true)
  const dlg = await window.__opened()
  // Sin esperar un cuadro: getAnimations() calcula el estilo y crea la transición desde @starting-style ahora mismo,
  // así una máquina cargada no la deja terminar antes de leerla
  const a = dlg.getAnimations().find((x) => x.transitionProperty === 'translate')
  const out = {
    vec,
    hasOrigin: dlg.classList.contains('has-origin'),
    ox: parseFloat(dlg.style.getPropertyValue('--_origin-x')),
    oy: parseFloat(dlg.style.getPropertyValue('--_origin-y')),
    animated: Boolean(a),
    space1: window.__space1
  }
  if (a) {
    a.pause()
    out.dur = a.effect.getComputedTiming().duration
    a.currentTime = 0; out.first = window.__tr(dlg)
    a.currentTime = out.dur / 2; out.mid = window.__tr(dlg)
    a.play()
  }
  else out.first = window.__tr(dlg)
  return out
})

const centerDelta = (page) => page.evaluate(() => {
  const d = document.getElementById('pd').getBoundingClientRect()
  return { x: d.left + d.width / 2 - innerWidth / 2, y: d.top + d.height / 2 - innerHeight / 2 }
})

test.describe('GDialog · D1 viene de donde lo llamaste', () => {
  test('lejos: parte del disparador con el tope space × 8 por eje y termina centrado', async ({ page }) => {
    await mount(page, { x: 100, y: 100 })
    const m = await openAndFirstFrame(page)
    const cap = m.space1 * 8
    expect(m.hasOrigin).toBe(true)
    // El vector completo, escrito antes de showModal() (lo ve @starting-style)
    expect(m.ox).toBeCloseTo(m.vec.x, 0)
    expect(m.oy).toBeCloseTo(m.vec.y, 0)
    expect(m.animated, 'hay transición de translate').toBe(true)
    expect(m.dur).toBe(160) // --g-duration-press
    // Un cuarto del vector supera el tope: queda en −32px por eje (hacia arriba a la izquierda)
    expect(m.first.x).toBeCloseTo(-cap, 1)
    expect(m.first.y).toBeCloseTo(-cap, 1)
    // A mitad de la entrada: entre el origen y el centro, del mismo lado (ease-out: ya pasó más de la mitad)
    expect(m.mid.x).toBeLessThan(0); expect(m.mid.x).toBeGreaterThan(-cap / 2)
    expect(m.mid.y).toBeLessThan(0); expect(m.mid.y).toBeGreaterThan(-cap / 2)
    // Termina centrado (se espera a que acabe: con tres motores en paralelo un cuadro puede llegar tarde)
    await expect.poll(() => page.evaluate(() => document.getElementById('pd').getAnimations().length)).toBe(0)
    const end = await page.evaluate(() => window.__tr(document.getElementById('pd')))
    expect(end.x).toBeCloseTo(0, 2)
    expect(end.y).toBeCloseTo(0, 2)
    const c = await centerDelta(page)
    expect(Math.abs(c.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(c.y)).toBeLessThanOrEqual(1)
  })

  test('cerca: un cuarto exacto del vector, con su signo', async ({ page }) => {
    await mount(page, { x: 640 + 60, y: 450 + 40 })
    const m = await openAndFirstFrame(page)
    expect(m.hasOrigin).toBe(true)
    expect(m.first.x).toBeGreaterThan(0)
    expect(m.first.y).toBeGreaterThan(0)
    expect(m.first.x).toBeCloseTo(m.ox * 0.25, 1)
    expect(m.first.y).toBeCloseTo(m.oy * 0.25, 1)
    expect(Math.abs(m.first.x)).toBeLessThanOrEqual(m.space1 * 8)
    expect(Math.abs(m.first.y)).toBeLessThanOrEqual(m.space1 * 8)
  })

  test('entra con cuadros intermedios entre el origen y el centro, sin sobrepaso', async ({ page, browserName }) => {
    await mount(page, { x: 1180, y: 820 })
    const xs = await page.evaluate(async () => {
      document.getElementById('pd-trigger').focus()
      window.__open(true)
      const dlg = await window.__opened()
      return window.__sample(() => window.__tr(dlg), 260)
    })
    const cap = await page.evaluate(() => window.__space1 * 8)
    const mid = xs.filter((s) => s.v.x > 0.5 && s.v.x < cap - 0.5)
    test.info().annotations.push({ type: 'cuadros intermedios de entrada', description: String(mid.length) })
    // En tiempo real solo se exige en Chromium: con tres motores en paralelo, Firefox y WebKit pueden saltarse los
    // ~10 cuadros de 160ms; la mitad de la entrada se comprueba en los tres de forma determinista («lejos»)
    if (browserName === 'chromium') expect(mid.length, 'cuadros intermedios').toBeGreaterThan(0)
    // Sin muelle (#299): nunca cruza al otro lado ni pasa del tope
    for (const s of xs) {
      expect(s.v.x).toBeGreaterThanOrEqual(-0.01)
      expect(s.v.y).toBeGreaterThanOrEqual(-0.01)
      expect(s.v.x).toBeLessThanOrEqual(cap + 0.01)
      expect(s.v.y).toBeLessThanOrEqual(cap + 0.01)
    }
    expect(xs.at(-1).v.x).toBeCloseTo(0, 2)
  })

  test('con teclado: has-origin y el foco vuelve al disparador al cerrar', async ({ page }) => {
    await mount(page, { x: 100, y: 800 })
    await page.locator('#pd-trigger').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('dialog.g-dialog[open]')).toHaveCount(1)
    await expect(page.locator('#pd')).toHaveClass(/has-origin/)
    await page.waitForTimeout(250)
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog.g-dialog[open]')).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('pd-trigger')
  })

  test('sale hacia el disparador (Chromium; Firefox y WebKit cierran sin cuadros intermedios, #152)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Solo Chromium anima la salida (overlay allow-discrete)')
    await mount(page, { x: 1180, y: 120 }) // arriba a la derecha: sale hacia +x, −y
    await openAndFirstFrame(page)
    await page.waitForTimeout(300)
    // Determinista: la transición de translate de la salida, pausada en su mitad y en su final
    const m = await page.evaluate(async () => {
      const dlg = document.getElementById('pd')
      const d = dlg.getBoundingClientRect()
      const t = document.getElementById('pd-trigger').getBoundingClientRect()
      const vec = { x: t.left + t.width / 2 - (d.left + d.width / 2), y: t.top + t.height / 2 - (d.top + d.height / 2) }
      window.__open(false)
      let a
      for (let i = 0; i < 10 && !a; i++) {
        a = dlg.getAnimations().find((x) => x.transitionProperty === 'translate')
        if (!a) await new Promise(requestAnimationFrame)
      }
      if (!a) return { vec, animated: false }
      a.pause()
      const dur = a.effect.getComputedTiming().duration
      a.currentTime = dur / 2; const mid = window.__tr(dlg)
      a.currentTime = dur; const end = window.__tr(dlg)
      a.play()
      return {
        vec, animated: true, dur, mid, end,
        ox: parseFloat(dlg.style.getPropertyValue('--_origin-x')), oy: parseFloat(dlg.style.getPropertyValue('--_origin-y'))
      }
    })
    const cap = await page.evaluate(() => window.__space1 * 8)
    expect(m.animated, 'hay transición de translate al salir').toBe(true)
    expect(m.dur).toBe(120) // --g-duration-fast: la salida es más corta que la entrada
    // Remedido desde el centro REAL del diálogo (con D2 ya no es el del visor)
    expect(m.ox).toBeCloseTo(m.vec.x, 0)
    expect(m.oy).toBeCloseTo(m.vec.y, 0)
    // Se aleja hacia el disparador: signo del vector, a mitad ya desplazado, al final en el tope
    expect(m.mid.x).toBeGreaterThan(0)
    expect(m.mid.y).toBeLessThan(0)
    expect(m.end.x).toBeCloseTo(Math.min(cap, m.vec.x * 0.25), 1)
    expect(m.end.y).toBeCloseTo(Math.max(-cap, m.vec.y * 0.25), 1)
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('pd-trigger')
  })

  test('salida en tiempo real: cuadros intermedios hacia el disparador (Chromium)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Solo Chromium anima la salida (overlay allow-discrete)')
    await mount(page, { x: 1180, y: 120 })
    await openAndFirstFrame(page)
    await page.waitForTimeout(300)
    const xs = await page.evaluate(async () => {
      const dlg = document.getElementById('pd')
      window.__open(false)
      return window.__sample(() => window.__tr(dlg), 400)
    })
    const cap = await page.evaluate(() => window.__space1 * 8)
    const mid = xs.filter((s) => s.v.x > 0.5 && s.v.x < cap - 0.5)
    expect(mid.length, 'cuadros intermedios de salida').toBeGreaterThan(0)
    for (const s of mid) expect(s.v.y).toBeLessThan(0)
  })

  test('sin disparador (foco en body): ni has-origin ni desplazamiento horizontal', async ({ page }) => {
    await mount(page)
    const m = await page.evaluate(async () => {
      document.activeElement?.blur()
      window.__open(true)
      const dlg = await window.__opened()
      const a = dlg.getAnimations().find((x) => x.transitionProperty === 'translate')
      let first = window.__tr(dlg)
      if (a) { a.pause(); a.currentTime = 0; first = window.__tr(dlg); a.play() }
      return { hasOrigin: dlg.classList.contains('has-origin'), first, space2: window.__space1 * 2 }
    })
    expect(m.hasOrigin).toBe(false)
    expect(m.first.x).toBe(0)
    expect(m.first.y).toBeCloseTo(m.space2, 1) // la entrada de siempre (#152)
  })

  test('movimiento reducido: solo fundido, sin desplazamiento ni escala', async ({ page }) => {
    await mount(page, { x: 100, y: 100, reduce: true })
    const m = await openAndFirstFrame(page)
    expect(m.animated, 'sin transición de translate').toBe(false)
    expect(m.first).toEqual({ x: 0, y: 0 })
    const props = await page.evaluate(() => {
      const dlg = document.getElementById('pd')
      return { list: getComputedStyle(dlg).transitionProperty, scale: getComputedStyle(dlg).scale, anim: dlg.getAnimations().map((a) => a.transitionProperty) }
    })
    expect(props.list).not.toMatch(/translate|scale/)
    expect(props.anim).not.toContain('translate')
    expect(props.anim).not.toContain('scale')
  })
})

test.describe('GDialog · D2 crece hacia abajo', () => {
  const geom = (page) => page.evaluate(() => {
    const d = document.getElementById('pd').getBoundingClientRect()
    const b = document.getElementById('pd-save').getBoundingClientRect()
    return { top: d.top, bottom: d.bottom, btn: b.top, vh: innerHeight, space4: window.__space1 * 4 }
  })

  test('al abrir un bloque de 240px: Δ 0px en el borde superior y en el botón del pie, dentro del visor', async ({ page }) => {
    await mount(page)
    await page.locator('#pd-trigger').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#pd')).toHaveClass(/is-pinned/)
    await page.waitForTimeout(300)
    const pin = await page.evaluate(() => parseFloat(document.getElementById('pd').style.getPropertyValue('--_pin-top')))
    const a = await geom(page)
    // offsetTop es entero: el borde fijado queda a ≤ 0,5px del centrado (nota para lima en estilo.md)
    expect(Math.abs(a.top - pin)).toBeLessThanOrEqual(0.5)
    await page.evaluate(() => window.__grow(240))
    await page.waitForTimeout(100)
    const b = await geom(page)
    expect(b.top - a.top).toBeCloseTo(0, 2)
    expect(b.btn - a.btn).toBeGreaterThan(200) // el botón baja con el contenido: no sube hacia el usuario
    expect(b.bottom).toBeLessThanOrEqual(b.vh - b.space4 + 0.5)
    // Botón del pie: Δ 0 mientras se queda visible al crecer otro poco y cuando ya no cabe (desplaza el cuerpo)
    await page.evaluate(() => window.__grow(2000))
    await page.waitForTimeout(100)
    const c = await geom(page)
    expect(c.top - a.top).toBeCloseTo(0, 2)
    expect(c.bottom).toBeLessThanOrEqual(c.vh - c.space4 + 0.5)
    const scrollable = await page.evaluate(() => { const b = document.querySelector('#pd .g-dialog__body'); return b.scrollHeight > b.clientHeight })
    expect(scrollable).toBe(true)
    // Ya en el máximo: crecer más no mueve el botón (Δ 0)
    await page.evaluate(() => window.__grow(2400))
    await page.waitForTimeout(100)
    const d = await geom(page)
    expect(d.btn - c.btn).toBeCloseTo(0, 2)
    expect(d.top - a.top).toBeCloseTo(0, 2)
  })

  test('el borde superior fijo es el del centrado: abrir con el bloque ya abierto no lo mueve al encoger', async ({ page }) => {
    await mount(page)
    await page.evaluate(() => window.__grow(240))
    await page.locator('#pd-trigger').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#pd')).toHaveClass(/is-pinned/)
    await page.waitForTimeout(300)
    const a = await geom(page)
    expect(Math.abs((a.top + a.bottom) / 2 - a.vh / 2)).toBeLessThanOrEqual(1) // abrió centrado
    await page.evaluate(() => window.__grow(0))
    await page.waitForTimeout(100)
    const b = await geom(page)
    expect(b.top - a.top).toBeCloseTo(0, 2)
  })

  test('movimiento reducido: D2 rige igual', async ({ page }) => {
    await mount(page, { reduce: true })
    await page.locator('#pd-trigger').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#pd')).toHaveClass(/is-pinned/)
    await page.waitForTimeout(200)
    const a = await geom(page)
    await page.evaluate(() => window.__grow(240))
    await page.waitForTimeout(100)
    const b = await geom(page)
    expect(b.top - a.top).toBeCloseTo(0, 2)
  })
})

test.describe('GDialog · por debajo del umbral móvil (≤ 520px) no hay D1 ni D2', () => {
  test('ancho completo centrado a 500px: entra como siempre y crece hacia los dos lados', async ({ page }) => {
    await mount(page, { x: 60, y: 60, viewport: { width: 500, height: 800 }, props: { mobile: 'full-width' } })
    const m = await openAndFirstFrame(page)
    expect(m.first.x).toBe(0) // sin D1
    expect(m.first.y).toBeCloseTo(m.space1 * 2, 1) // la entrada de #152
    await page.waitForTimeout(300)
    const a = await page.evaluate(() => document.getElementById('pd').getBoundingClientRect().top)
    await page.evaluate(() => window.__grow(240))
    await page.waitForTimeout(100)
    const b = await page.evaluate(() => document.getElementById('pd').getBoundingClientRect().top)
    expect(a - b).toBeGreaterThan(100) // sin D2: el centrado sube ~120px
  })

  test('hoja móvil (por defecto) a 375px: sube desde abajo, sin origen ni borde fijo', async ({ page }) => {
    await mount(page, { x: 40, y: 40, viewport: { width: 375, height: 812 } })
    const m = await openAndFirstFrame(page)
    expect(m.first.x).toBe(0)
    expect(m.first.y).toBeCloseTo(m.space1 * 6, 1) // la hoja: space × 6 desde abajo
    await page.waitForTimeout(300)
    const bottom = await page.evaluate(() => document.getElementById('pd').getBoundingClientRect().bottom)
    expect(bottom).toBeCloseTo(812, 0) // sigue pegada abajo
  })
})
