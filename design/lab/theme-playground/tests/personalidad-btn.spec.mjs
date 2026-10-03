// GBtn · personalidad (DECISIONS.md #299 y #300; design/contracts/btn.md «Personalidad»; plan 015).
// B1 «rebote al soltar» y B2 «la etiqueta cede el sitio», medidos sobre el GBtn REAL del UMD (window.Grana), montado en la
// página del playground como en btn-loading-name.spec.mjs. Criterio de hecho: la medida de kiwi (personalidad/r01).
// La curva del rebote se mide de forma determinista: se pausa la transición CSS real (Web Animations) y se recorre su
// tiempo cada 2ms, así el pico no depende de en qué cuadro cae el muestreo. Los cuadros intermedios de B2 sí se cuentan
// en tiempo real (rAF), como hizo kiwi.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

// Monta un GBtn real con `loading` reactivo: window.__setLoading(true|false) lo cambia.
const mount = async (page, { loading = false, reduce = false } = {}) => {
  if (reduce) await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(PAGE)
  await page.waitForSelector('.g-btn')
  await page.evaluate((loading) => {
    const host = document.createElement('div')
    host.id = 'pb-host'
    host.style.padding = '48px'
    document.body.prepend(host)
    const { createApp, h, ref } = window.Vue
    const l = ref(loading)
    window.__setLoading = (v) => { l.value = v }
    createApp({ render: () => h(window.Grana.GBtn, { id: 'pb', loading: l.value }, () => 'Enviar informe') }).mount(host)
    window.__scale = () => { const m = getComputedStyle(document.getElementById('pb')).transform; if (!m || m === 'none') return 1; return +m.slice(m.indexOf('(') + 1).split(',')[0] }
    window.__ty = (el) => { const t = getComputedStyle(el).translate; if (!t || t === 'none') return 0; const [, y = '0px'] = t.split(' '); return parseFloat(y) }
    window.__sample = (fn, ms) => new Promise((res) => {
      const xs = []; const t0 = performance.now()
      ;(function f() { xs.push({ t: performance.now() - t0, v: fn() }); if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(xs) })()
    })
    const probe = document.createElement('div'); probe.style.inlineSize = 'var(--g-space-1)'; document.body.appendChild(probe)
    window.__space1 = probe.getBoundingClientRect().width; probe.remove()
  }, loading)
  await page.waitForSelector('#pb')
  await page.waitForTimeout(100)
}

// Muestrea en cada cuadro mientras se ejecuta la acción (el muestreo arranca antes)
const during = async (page, src, ms, action) => {
  const h = page.evaluate(([s, m]) => window.__sample(new Function('return (' + s + ')()'), m), [src, ms])
  await page.waitForTimeout(16)
  await action()
  return h
}

const press = async (page) => {
  const box = await page.locator('#pb').boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
}

test.describe('GBtn · B1 rebote al soltar', () => {
  test('apretar: 0,970 con --g-duration-fast; soltar: pico ≈ 1,006 con --g-duration-slow y asentado en 1 antes de 240ms', async ({ page }) => {
    await mount(page)
    await press(page)
    // Ida: mientras está apretado, manda la lista de :active (la de transform es la corta: fast = 120ms, ease-out)
    await page.waitForFunction(() => window.__scale() < 1)
    const ida = await page.evaluate(() => {
      const cs = getComputedStyle(document.getElementById('pb'))
      const i = cs.transitionProperty.split(',').map((x) => x.trim()).indexOf('transform')
      return { n: cs.transitionProperty.split(',').length, dur: parseFloat(cs.transitionDuration.split(',')[i]) * 1000 }
    })
    expect(ida.n, 'lista completa').toBe(4)
    expect(ida.dur).toBeCloseTo(120, 0)
    await page.waitForTimeout(260)
    expect(await page.evaluate(() => window.__scale())).toBeCloseTo(0.97, 3)

    await page.mouse.up()
    // Vuelta: se pausa la transición real y se recorre su tiempo
    const curve = await page.evaluate(async () => {
      const el = document.getElementById('pb')
      let a
      for (let i = 0; i < 20 && !a; i++) { a = el.getAnimations().find((x) => x.transitionProperty === 'transform'); if (!a) await new Promise(requestAnimationFrame) }
      if (!a) return null
      a.pause()
      const dur = a.effect.getComputedTiming().duration
      const easing = a.effect.getTiming().easing
      const xs = []
      for (let t = 0; t <= dur; t += 2) { a.currentTime = t; xs.push({ t, v: window.__scale() }) }
      a.finish()
      return { dur, easing, xs }
    })
    expect(curve, 'hay transición de transform al soltar').toBeTruthy()
    expect(curve.dur).toBeCloseTo(240, 0)
    expect(curve.easing.startsWith('linear(')).toBe(true)
    const max = Math.max(...curve.xs.map((x) => x.v))
    expect(Math.abs(max - 1.006), `pico ${max.toFixed(5)}`).toBeLessThanOrEqual(0.0005)
    const off = curve.xs.filter((x) => Math.abs(x.v - 1) > 0.0005)
    expect(off.at(-1).t, `último fuera de 1 ± 0,0005 a ${off.at(-1).t}ms`).toBeLessThan(240)
    expect(await page.evaluate(() => window.__scale())).toBe(1)
    if (process.env.VERBOSE) console.log(`B1 ${test.info().project.name}: ida ${ida.dur}ms, vuelta ${curve.dur}ms, pico ${max.toFixed(5)}, asentado a ${off.at(-1).t + 2}ms`)
  })

  test('con movimiento reducido: escala 1 siempre (al apretar y al soltar)', async ({ page }) => {
    await mount(page, { reduce: true })
    await press(page)
    await page.waitForTimeout(260)
    expect(await page.evaluate(() => window.__scale())).toBe(1)
    const xs = await during(page, '() => window.__scale()', 300, () => page.mouse.up())
    expect(xs.every((x) => x.v === 1)).toBe(true)
  })

  test('sin rebote en disabled, loading ni link (mismas exclusiones)', async ({ page }) => {
    await mount(page, { loading: true })
    await press(page)
    await page.waitForTimeout(200)
    expect(await page.evaluate(() => window.__scale())).toBe(1)
    await page.mouse.up()
  })
})

const B2_SRC = `() => {
  const b = document.getElementById('pb'); const l = b.querySelector('.g-btn__label'); const ld = b.querySelector('.g-btn__loader')
  const cs = getComputedStyle(l)
  return { o: +cs.opacity, vis: cs.visibility, ty: window.__ty(l), lo: +getComputedStyle(ld).opacity, lty: window.__ty(ld), lvis: getComputedStyle(ld).visibility, ld: getComputedStyle(ld).display, w: b.getBoundingClientRect().width }
}`

// Cambia `loading`, pausa las transiciones reales que nacen y recorre su tiempo cada 10ms (determinista en los tres motores)
const seekB2 = (page, to) => page.evaluate(async ([to, src]) => {
  const read = new Function('return (' + src + ')()')
  window.__setLoading(to)
  await window.Vue.nextTick()
  read() // fuerza el cálculo de estilo: crea las transiciones
  const b = document.getElementById('pb')
  const anims = b.getAnimations({ subtree: true }).filter((a) => a.transitionProperty !== undefined)
  anims.forEach((a) => a.pause())
  const info = anims.map((a) => ({ part: [...a.effect.target.classList].find((c) => c.startsWith('g-btn')), prop: a.transitionProperty, dur: a.effect.getComputedTiming().duration }))
  const xs = []
  for (let t = 0; t <= 250; t += 10) { anims.forEach((a) => { a.currentTime = t }); xs.push({ t, v: read() }) }
  anims.forEach((a) => a.finish())
  return { info, xs, end: read() }
}, [to, B2_SRC])

const has = (info, part, prop, dur) => info.some((i) => i.part === part && i.prop === prop && Math.abs(i.dur - dur) < 0.5)

test.describe('GBtn · B2 la etiqueta cede el sitio', () => {
  test('entrar en carga: la etiqueta se funde y sube space × 1, el indicador llega desde abajo, el ancho no cambia', async ({ page }) => {
    await mount(page)
    const s1 = await page.evaluate(() => window.__space1)
    expect(s1).toBeGreaterThan(0)
    const w0 = await page.evaluate(() => document.getElementById('pb').getBoundingClientRect().width)
    const { info, xs, end } = await seekB2(page, true)
    expect(has(info, 'g-btn__label', 'opacity', 120), JSON.stringify(info)).toBe(true)
    expect(has(info, 'g-btn__label', 'translate', 160)).toBe(true)
    expect(has(info, 'g-btn__loader', 'opacity', 120)).toBe(true)
    expect(has(info, 'g-btn__loader', 'translate', 160)).toBe(true)
    expect(xs.every((x) => Math.abs(x.v.w - w0) < 0.01), `ancho ${w0} → ${end.w}`).toBe(true)
    expect(xs.every((x) => x.v.vis === 'visible'), 'la etiqueta nunca pasa a visibility: hidden').toBe(true)
    expect(xs.filter((x) => x.v.o > 0.02 && x.v.o < 0.98).length, 'valores intermedios de la etiqueta').toBeGreaterThanOrEqual(2)
    expect(xs.filter((x) => x.v.lo > 0.02 && x.v.lo < 0.98).length, 'valores intermedios del indicador').toBeGreaterThanOrEqual(2)
    expect(xs[0].v.lty, 'el indicador llega desde abajo').toBeCloseTo(s1, 2)
    expect(Math.min(...xs.map((x) => x.v.ty)), 'la etiqueta sube').toBeLessThan(-1)
    expect(end.o).toBe(0)
    expect(end.vis).toBe('visible')
    expect(end.ty).toBeCloseTo(-s1, 2)
    expect(end.lo).toBe(1)
    expect(end.lty).toBe(0)
    expect(end.ld).toBe('block')
    expect(Math.abs(end.w - w0)).toBeLessThan(0.01)
    if (process.env.VERBOSE) console.log(`B2 ${test.info().project.name}: ancho ${w0.toFixed(2)} → ${end.w.toFixed(2)}, etiqueta ${xs.filter((x) => x.v.o > 0.02 && x.v.o < 0.98).length} muestras intermedias, indicador ${xs.filter((x) => x.v.lo > 0.02 && x.v.lo < 0.98).length}, etiqueta ${end.ty}px, indicador desde +${xs[0].v.lty}px`)
  })

  test('entrar en carga en tiempo real: cuadros intermedios en etiqueta e indicador (medida de kiwi, Chromium)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'el conteo rAF en tiempo real es inestable con carga en paralelo fuera de Chromium; los tres motores se miden arriba de forma determinista')
    await mount(page)
    const xs = await during(page, B2_SRC, 320, () => page.evaluate(() => window.__setLoading(true)))
    const label = xs.filter((x) => x.v.o > 0.02 && x.v.o < 0.98).length
    const loader = xs.filter((x) => x.v.lo > 0.02 && x.v.lo < 0.98).length
    expect(label).toBeGreaterThanOrEqual(2)
    expect(loader).toBeGreaterThanOrEqual(1)
    if (process.env.VERBOSE) console.log(`B2 tiempo real chromium: etiqueta ${label} cuadros, indicador ${loader}`)
  })

  test('nombre accesible en carga = la etiqueta (Chromium, árbol AX)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'árbol de accesibilidad por CDP: solo Chromium')
    await mount(page)
    await page.evaluate(() => window.__setLoading(true))
    await page.waitForTimeout(300)
    await expect(page.getByRole('button', { name: 'Enviar informe' })).toHaveCount(1)
    const client = await page.context().newCDPSession(page)
    const { nodes } = await client.send('Accessibility.getFullAXTree')
    expect(nodes.some((n) => !n.ignored && n.role?.value === 'button' && n.name?.value === 'Enviar informe')).toBe(true)
  })

  test('salir de la carga: a la inversa (la etiqueta vuelve, el indicador se va con fundido)', async ({ page }) => {
    await mount(page, { loading: true })
    const w0 = await page.evaluate(() => document.getElementById('pb').getBoundingClientRect().width)
    const { info, xs, end } = await seekB2(page, false)
    expect(has(info, 'g-btn__label', 'opacity', 120), JSON.stringify(info)).toBe(true)
    expect(has(info, 'g-btn__loader', 'opacity', 120)).toBe(true)
    expect(xs.every((x) => Math.abs(x.v.w - w0) < 0.01)).toBe(true)
    expect(xs.filter((x) => x.v.o > 0.02 && x.v.o < 0.98).length).toBeGreaterThanOrEqual(2)
    expect(xs.filter((x) => x.v.lo > 0.02 && x.v.lo < 0.98).length, 'el indicador sale con fundido').toBeGreaterThanOrEqual(2)
    expect(xs.filter((x) => x.v.lo > 0.02).every((x) => x.v.lvis === 'visible'), 'visible mientras se funde').toBe(true)
    expect(end.o).toBe(1)
    expect(end.ty).toBe(0)
    expect(end.lo).toBe(0)
    expect(end.lvis).toBe('hidden')
  })

  test('montar ya en carga no anima nada (#299 (4)) y el indicador queda centrado', async ({ page }) => {
    await mount(page, { loading: true })
    const r = await page.evaluate(() => {
      const b = document.getElementById('pb'); const s = b.querySelector('.g-btn__loader')
      const br = b.getBoundingClientRect(); const sr = s.getBoundingClientRect()
      const trans = b.getAnimations({ subtree: true }).filter((a) => a.transitionProperty !== undefined)
      return { trans: trans.length, dx: Math.abs((sr.left + sr.right) / 2 - (br.left + br.right) / 2), dy: Math.abs((sr.top + sr.bottom) / 2 - (br.top + br.bottom) / 2), lo: +getComputedStyle(s).opacity }
    })
    expect(r.trans).toBe(0)
    expect(r.lo).toBe(1)
    expect(r.dx).toBeLessThan(1)
    expect(r.dy).toBeLessThan(1)
  })

  test('con movimiento reducido: solo fundido, sin desplazamiento', async ({ page }) => {
    await mount(page, { reduce: true })
    const { info, xs, end } = await seekB2(page, true)
    expect(info.some((i) => i.prop === 'translate'), JSON.stringify(info)).toBe(false)
    expect(has(info, 'g-btn__label', 'opacity', 120)).toBe(true)
    expect(has(info, 'g-btn__loader', 'opacity', 120)).toBe(true)
    expect(xs.every((x) => x.v.ty === 0 && x.v.lty === 0)).toBe(true)
    expect(xs.filter((x) => x.v.o > 0.02 && x.v.o < 0.98).length).toBeGreaterThanOrEqual(2)
    expect(end.o).toBe(0)
    expect(end.lo).toBe(1)
  })
})
