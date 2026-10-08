// GSlider · personalidad B «El valor es el asa» (design/contracts/slider.md «Personalidad», DECISIONS.md #452) sobre el
// COMPONENTE REAL del playground (#sec-slider), en Chromium, Firefox y WebKit: B1 la cifra vive en el asa (ancho fijo,
// dentro del riel, texto = valuetext), B2 las píldoras se funden sin solaparse, B3 el tramo se arrastra entero (en suspenso
// hasta 10px), B4 se teclea la cifra, B5 el tope (≤ space × 0.5, vuelve, el valor no cambia; nada en readonly), B6 el salto
// se desliza (solo el salto). Con prefers-reduced-motion: reduce, ni salto deslizado, ni tope, ni transición de esquinas, y
// no quedan datos puestos. Un solo proceso por puerto: GRANA_PW_PORT=4212.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'
async function open(page, { motion = 'no-preference', width = 1280, target = '#sec-slider' } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height: 900 })
  await page.goto(PAGE)
  await page.waitForSelector('#sl-vol')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: s === '#sec-slider' ? 'start' : 'center' }), target)
  await settle(page)
}
const settle = (page, ms = 30) => page.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms)
const model = async (page) => JSON.parse(await page.locator('#sl-model').textContent())
const nb = (s) => (s == null ? s : s.replace(/[\s  ]/g, ' '))
const rootOf = (id) => `.g-slider:has(#${id})`
const box = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, cx: r.x + r.width / 2, cy: r.y + r.height / 2 } }, sel)
const press = async (page, id, keys) => { await page.focus('#' + id); for (const k of [].concat(keys)) await page.keyboard.press(k); await settle(page) }
const pt = (page, id, f) => page.evaluate(([i, f]) => {
  const root = document.getElementById(i).closest('.g-slider')
  const a = root.querySelector('.g-slider__area').getBoundingClientRect()
  const pw = parseFloat(getComputedStyle(root).getPropertyValue('--_pill-w')) || 0
  return [a.left + pw / 2 + f * (a.width - pw), a.top + a.height / 2]
}, [id, f])
const space = (page) => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')) || 4)
/** Empieza a muestrear (ya instalado al volver) el desplazamiento del asa enfocada y el data-bump de la raíz; devuelve la
 *  función que espera `ms` desde el inicio y da el resultado */
async function sampleBump(page, id, ms = 500) {
  await page.evaluate(([i, ms]) => {
    const n = document.getElementById(i)
    const t = n.parentElement
    const root = n.closest('.g-slider')
    const x0 = t.getBoundingClientRect().left
    const out = (window.__bump = { max: 0, seen: [], done: false })
    const seen = new Set()
    const obs = new MutationObserver(() => { if (root.dataset.bump) seen.add(root.dataset.bump) })
    obs.observe(root, { attributes: true, attributeFilter: ['data-bump'] })
    const t0 = performance.now()
    const f = () => {
      out.max = Math.max(out.max, Math.abs(t.getBoundingClientRect().left - x0))
      if (performance.now() - t0 < ms) requestAnimationFrame(f)
      else {
        obs.disconnect()
        Object.assign(out, { seen: [...seen], end: Math.abs(t.getBoundingClientRect().left - x0), left: root.dataset.bump || null, done: true })
      }
    }
    requestAnimationFrame(f)
  }, [id, ms])
  return async () => {
    await page.waitForFunction(() => window.__bump && window.__bump.done, null, { timeout: ms + 10000 })
    return page.evaluate(() => window.__bump)
  }
}

test.describe('GSlider · personalidad B (#452)', () => {
  test('B1: la píldora no cambia de ancho (0 %, 40 %, 100 %), no se sale del riel y su texto es el valuetext', async ({ page }) => {
    await open(page)
    const w0 = (await box(page, `${rootOf('sl-vol')} .g-slider__thumb`)).w
    await press(page, 'sl-vol', 'End')
    const t1 = await box(page, `${rootOf('sl-vol')} .g-slider__thumb`)
    await press(page, 'sl-vol', 'Home')
    const t2 = await box(page, `${rootOf('sl-vol')} .g-slider__thumb`)
    const a = await box(page, `${rootOf('sl-vol')} .g-slider__area`)
    expect(Math.abs(w0 - t1.w)).toBeLessThan(0.5)
    expect(Math.abs(w0 - t2.w)).toBeLessThan(0.5)
    expect(t2.x).toBeGreaterThanOrEqual(a.x - 0.5)
    expect(t1.r).toBeLessThanOrEqual(a.r + 0.5)
    const txt = await page.evaluate(() => [...document.querySelectorAll('.g-slider:has(#sl-precio) .g-slider__pill-text')].map((t) => t.textContent))
    const vt = await page.evaluate(() => ['sl-precio', 'sl-precio-end'].map((i) => document.getElementById(i).getAttribute('aria-valuetext')))
    expect(txt.map(nb)).toEqual(vt.map(nb))
  })

  test('B2: las edades juntas se funden sin solaparse (Δ ≤ 1px) con transición de esquinas; separadas vuelven a ser dos', async ({ page }) => {
    await open(page, { target: '#sl-edad' })
    const m = await page.evaluate(() => {
      const r = document.getElementById('sl-edad').closest('.g-slider')
      const [a, c] = [...r.querySelectorAll('.g-slider__thumb')].map((t) => t.getBoundingClientRect())
      const tp = getComputedStyle(r.querySelector('.g-slider__thumb')).transitionProperty
      return { merged: r.classList.contains('is-merged'), gap: c.left - a.right, tp }
    })
    expect(m.merged).toBe(true)
    expect(Math.abs(m.gap)).toBeLessThanOrEqual(1)
    expect(m.tp).toMatch(/radius/)
    await press(page, 'sl-edad-end', 'End')
    expect(await page.evaluate(() => document.getElementById('sl-edad').closest('.g-slider').classList.contains('is-merged'))).toBe(false)
  })

  test('B3: el tramo en suspenso hasta 10px (un toque lleva el asa más cercana); arrastrarlo conserva la anchura (1600)', async ({ page }) => {
    await open(page, { target: '#sl-precio' })
    const [x, y] = await pt(page, 'sl-precio', 1300 / 5000)
    expect(await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('.g-slider__fill'), [x, y])).toBe(true)
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + 5, y)
    expect((await model(page)).precio, 'en suspenso').toEqual([800, 2400])
    await page.mouse.up()
    await settle(page)
    expect((await model(page)).precio, 'toque: el inicio al punto').toEqual([1300, 2400])
    await page.evaluate(() => { window.__sl.precio = [800, 2400] })
    await settle(page, 300)
    const f = await box(page, `${rootOf('sl-precio')} .g-slider__fill`)
    await page.mouse.move(f.cx, f.cy)
    await page.mouse.down()
    for (let k = 1; k <= 5; k++) await page.mouse.move(f.cx + k * 20, f.cy)
    expect(await page.evaluate(() => document.getElementById('sl-precio').closest('.g-slider').classList.contains('is-dragging'))).toBe(true)
    await page.mouse.up()
    const p = (await model(page)).precio
    expect(p[0]).toBeGreaterThan(800)
    expect(p[1] - p[0]).toBe(1600)
  })

  test('B4: «35» + Intro, «7» y la pausa, Esc anula, una cifra fuera de los límites va al límite con el tope', async ({ page }) => {
    await open(page)
    await page.focus('#sl-vol')
    await page.keyboard.type('35')
    await page.keyboard.press('Enter')
    expect((await model(page)).vol).toBe(35)
    await page.keyboard.type('7')
    const typing = await page.evaluate(() => document.getElementById('sl-vol').parentElement.classList.contains('is-typing'))
    const vt = await page.evaluate(() => document.getElementById('sl-vol').getAttribute('aria-valuetext'))
    await page.waitForTimeout(1100)
    expect(typing).toBe(true)
    expect(nb(vt), 'aria-valuetext no cambia mientras se teclea').toMatch(/^35 ?%$/)
    expect((await model(page)).vol).toBe(7)
    await page.keyboard.type('5')
    await page.keyboard.press('Escape')
    await settle(page)
    expect((await model(page)).vol).toBe(7)
    await page.keyboard.type('250')
    const sample = await sampleBump(page, 'sl-vol', 400)
    await page.keyboard.press('Enter')
    const b = await sample()
    expect((await model(page)).vol).toBe(100)
    expect(b.seen).toEqual(['up'])
  })

  test('B5: el tope desplaza el asa ≤ space × 0.5 y vuelve, una vez; el valor no cambia; nada en readonly', async ({ page }) => {
    await open(page)
    const s = await space(page)
    await press(page, 'sl-vol', 'End')
    const sample = await sampleBump(page, 'sl-vol', 500)
    await page.keyboard.press('ArrowUp')
    const b = await sample()
    expect((await model(page)).vol).toBe(100)
    expect(b.seen).toEqual(['up'])
    expect(b.max).toBeGreaterThan(0)
    expect(b.max).toBeLessThanOrEqual(s * 0.5 + 0.1)
    expect(b.end).toBeLessThan(0.1)
    expect(b.left, 'el dato se retira al acabar').toBe(null)
    await page.locator('#sl-ro').scrollIntoViewIfNeeded()
    await press(page, 'sl-ro', 'End')
    const ro = await sampleBump(page, 'sl-ro', 300)
    await page.keyboard.press('ArrowUp')
    expect((await ro()).seen).toEqual([])
  })

  test('B6: el clic en el riel se desliza (is-jumping con transición de posición); arrastrar y teclear no', async ({ page }) => {
    await open(page)
    const [x, y] = await pt(page, 'sl-vol', 0.9)
    await page.evaluate(() => {
      const root = document.getElementById('sl-vol').closest('.g-slider')
      const out = (window.__jump = { jumping: false, tp: '' })
      const obs = new MutationObserver(() => {
        if (root.classList.contains('is-jumping') && !out.jumping) {
          out.jumping = true
          out.tp = getComputedStyle(root.querySelector('.g-slider__thumb')).transitionProperty
        }
      })
      obs.observe(root, { attributes: true, attributeFilter: ['class'] })
      setTimeout(() => { obs.disconnect(); out.end = root.classList.contains('is-jumping') }, 700)
    })
    await page.mouse.click(x, y)
    await page.waitForTimeout(800)
    const j = await page.evaluate(() => window.__jump)
    expect((await model(page)).vol).toBe(90)
    expect(j.jumping).toBe(true)
    expect(j.tp).toMatch(/inset|left|right/)
    expect(j.end, 'is-jumping se retira al acabar').toBe(false)
    await press(page, 'sl-vol', ['ArrowLeft', 'ArrowLeft'])
    expect(await page.evaluate(() => document.getElementById('sl-vol').closest('.g-slider').classList.contains('is-jumping'))).toBe(false)
    const t = await box(page, `${rootOf('sl-vol')} .g-slider__pill`)
    await page.mouse.move(t.cx, t.cy)
    await page.mouse.down()
    await page.mouse.move(t.cx - 40, t.cy)
    expect(await page.evaluate(() => document.getElementById('sl-vol').closest('.g-slider').classList.contains('is-jumping'))).toBe(false)
    await page.mouse.up()
  })

  test('prefers-reduced-motion: ni salto deslizado, ni tope, ni transición de esquinas; no quedan datos puestos', async ({ page }) => {
    await open(page, { motion: 'reduce' })
    const [x, y] = await pt(page, 'sl-vol', 0.9)
    await page.mouse.click(x, y)
    await settle(page)
    const r = await page.evaluate(() => {
      const root = document.getElementById('sl-vol').closest('.g-slider')
      const th = getComputedStyle(root.querySelector('.g-slider__thumb'))
      return { jumping: root.classList.contains('is-jumping'), tp: th.transitionProperty, td: th.transitionDuration }
    })
    expect((await model(page)).vol, 'el clic llegó al riel').toBe(90)
    expect(r.jumping).toBe(false)
    expect(r.td.split(',').every((d) => parseFloat(d) === 0), `transición del asa: ${r.tp} ${r.td}`).toBe(true)
    await press(page, 'sl-vol', 'End')
    const b = await sampleBump(page, 'sl-vol', 400)
    await page.keyboard.press('ArrowUp')
    const out = await b()
    expect(out.max).toBe(0)
    expect(out.left).toBe(null)
    await page.locator('#sl-edad').scrollIntoViewIfNeeded()
    const e = await page.evaluate(() => {
      const root = document.getElementById('sl-edad').closest('.g-slider')
      return { merged: root.classList.contains('is-merged'), td: getComputedStyle(root.querySelector('.g-slider__thumb')).transitionDuration }
    })
    expect(e.merged).toBe(true)
    expect(e.td.split(',').every((d) => parseFloat(d) === 0)).toBe(true)
  })
})
