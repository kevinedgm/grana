// GFileField · movimiento (file-field.md «Movimiento», #376; estilo de coco en GFileField.css) sobre el componente real del
// playground: la ficha ATERRIZA desde «Adjuntar» (escala desde 0.86, ≥ 2 escalas intermedias, termina en 1, nunca > 1, sin
// muelle) y se retira is-landing; los destinos DESPIERTAN juntos con un fundido sin mover nada; la ficha SE LLENA (el relleno
// de GProgress avanza); la caja SE SACUDE al rechazar el envío y se retira is-rejected. Con reduced motion: solo fundidos.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

async function open(page, motion) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.addInitScript(() => { window.__ffFast = true })
  await page.goto(PAGE)
  await page.waitForSelector('#ff-photos')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.locator('#ff-photos').scrollIntoViewIfNeeded()
}

/**
 * Añade un archivo por un gesto (change del control) y muestrea la animación de la ficha con la Web Animations API: se pausa
 * y se recorre por currentTime (determinista en los tres motores, sin depender de la cadencia de los cuadros)
 */
const sampleLanding = (page) => page.evaluate(async () => {
  const root = document.getElementById('ff-rx').closest('.g-file-field')
  const field = document.getElementById('ff-rx')
  await new Promise((r) => requestAnimationFrame(r)) // un cuadro tras el desplazamiento, como en un gesto real
  const dt = new DataTransfer()
  dt.items.add(new File([new Uint8Array(400)], 'aterriza.pdf', { type: 'application/pdf' }))
  field.files = dt.files
  field.dispatchEvent(new Event('change', { bubbles: true }))
  await new Promise((r) => setTimeout(r, 0))
  const chip = root.querySelector('.g-file-field__chip')
  const out = { scales: [], opacities: [], names: [], landingBefore: chip.classList.contains('is-landing'), landing: [], origin: getComputedStyle(chip).transformOrigin }
  const anim = chip.getAnimations().find((a) => String(a.animationName || '').startsWith('g-file-field-land'))
  if (anim) {
    out.names.push(anim.animationName)
    anim.pause()
    const d = anim.effect.getComputedTiming().duration
    for (let i = 0; i <= 10; i++) {
      anim.currentTime = (d * i) / 10
      const cs = getComputedStyle(chip)
      out.scales.push(cs.scale === 'none' ? 1 : parseFloat(cs.scale))
      out.opacities.push(parseFloat(cs.opacity))
    }
    anim.play()
  }
  await new Promise((r) => setTimeout(r, 500))
  out.landing.push(chip.classList.contains('is-landing'))
  out.scales.push(getComputedStyle(chip).scale === 'none' ? 1 : parseFloat(getComputedStyle(chip).scale))
  return out
})

test.describe('GFileField · personalidad (#376)', () => {
  test('aterrizaje: escala desde 0.86 hacia 1 con escalas intermedias, nunca > 1, origen al final de la lectura; is-landing se retira', async ({ page }) => {
    await open(page, 'no-preference')
    const s = await sampleLanding(page)
    expect(s.names).toContain('g-file-field-land')
    const mids = s.scales.filter((x) => x > 0.86 + 1e-3 && x < 1 - 1e-3)
    expect(mids.length, JSON.stringify(s.scales)).toBeGreaterThanOrEqual(2)
    expect(Math.max(...s.scales), 'sin rebase: nunca > 1').toBeLessThanOrEqual(1 + 1e-6)
    expect(s.scales.at(-1)).toBe(1)
    for (let i = 1; i < s.scales.length; i++) expect(s.scales[i], 'monótona').toBeGreaterThanOrEqual(s.scales[i - 1] - 1e-6)
    expect(s.landingBefore).toBe(true)
    expect(s.scales[0], 'parte de 0.86').toBeCloseTo(0.86, 2)
    expect(s.landing.at(-1), 'is-landing se retira al terminar').toBe(false)
    const box = await page.evaluate(() => document.querySelector('#ff-rx').closest('.g-file-field__chip, .g-file-field').querySelector('.g-file-field__chip').getBoundingClientRect().width)
    expect(parseFloat(s.origin), 'origen en el lado del final de la lectura (derecha en LTR)').toBeGreaterThan(box / 2)
  })

  test('reduced motion: la ficha solo se funde (g-file-field-land-fade), sin escala; no quedan clases', async ({ page }) => {
    await open(page, 'reduce')
    const s = await sampleLanding(page)
    expect(s.names).toContain('g-file-field-land-fade')
    expect(s.scales.every((x) => x === 1)).toBe(true)
    expect(s.landing.at(-1)).toBe(false)
  })

  test('los destinos despiertan juntos con un fundido, sin mover nada (Δ0 de cajas y raíces); dormir al soltar fuera', async ({ page }) => {
    await open(page, 'no-preference')
    const geo = () => page.evaluate(() => [...document.querySelectorAll('#sec-file-field .g-file-field')].map((r) => { const a = r.getBoundingClientRect(); const b = r.querySelector('.g-file-field__box').getBoundingClientRect(); return [a.top, a.height, b.top, b.height] }))
    const g0 = await geo()
    const t = await page.evaluate(async () => {
      await new Promise((r) => requestAnimationFrame(r)) // un cuadro entre el desplazamiento y el dragenter, como en un arrastre real
      const dt = new DataTransfer()
      dt.items.add(new File([new Uint8Array(5)], 'x.png', { type: 'image/png' }))
      document.body.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }))
      await new Promise((r) => setTimeout(r, 0))
      const targets = ['ff-rx', 'ff-photos', 'ff-ine-a'].map((id) => document.getElementById(id).closest('.g-file-field').querySelector('.g-file-field__target'))
      targets.forEach((x) => getComputedStyle(x).opacity) // fuerza el cálculo de estilo: la transición empieza
      const fades = targets.map((x) => x.getAnimations().find((a) => a.transitionProperty === 'opacity'))
      const samples = []
      if (fades.every(Boolean)) {
        fades.forEach((f) => f.pause())
        const d = fades[0].effect.getComputedTiming().duration
        for (let i = 0; i <= 8; i++) {
          fades.forEach((f) => { f.currentTime = (d * i) / 8 })
          samples.push(targets.map((x) => parseFloat(getComputedStyle(x).opacity)))
        }
        fades.forEach((f) => f.finish())
      }
      return { samples, fades: fades.map((f) => (f ? f.effect.getComputedTiming().duration : null)), awake: targets.map((x) => x.closest('.g-file-field').classList.contains('is-awake')), end: targets.map((x) => parseFloat(getComputedStyle(x).opacity)) }
    })
    expect(t.awake).toEqual([true, true, true])
    // Los tres declaran el mismo fundido de despertar (--g-duration-press)
    const durs = await page.evaluate(() => ['ff-rx', 'ff-photos', 'ff-ine-a'].map((id) => getComputedStyle(document.getElementById(id).closest('.g-file-field').querySelector('.g-file-field__target')).transitionDuration.split(',')[0].trim()))
    expect(new Set(durs).size, 'la misma transición en todos').toBe(1)
    expect(parseFloat(durs[0])).toBeGreaterThan(0)
    const mids = t.samples.filter((row) => row.some((o) => o > 0.02 && o < 0.98))
    expect(mids.length, 'fundido con valores intermedios ' + JSON.stringify(t)).toBeGreaterThanOrEqual(1)
    for (const row of t.samples) expect(Math.max(...row) - Math.min(...row), 'juntos').toBeLessThan(0.15)
    expect(new Set(t.fades).size, 'la misma transición en todos').toBe(1)
    expect(t.end).toEqual([1, 1, 1])
    expect(await geo(), 'despertar es pintura').toEqual(g0)
    await page.evaluate(() => {
      const dt = new DataTransfer()
      dt.items.add(new File([new Uint8Array(5)], 'x.png', { type: 'image/png' }))
      document.body.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }))
    })
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => document.querySelectorAll('#sec-file-field .g-file-field.is-awake').length)).toBe(0)
    expect(await geo()).toEqual(g0)
  })

  test('la ficha se llena: el relleno de GProgress avanza hacia el final de la lectura con su frente', async ({ page }) => {
    await open(page, 'no-preference')
    await page.setInputFiles('#ff-photos', [{ name: 'foto-lento.png', mimeType: 'image/png', buffer: Buffer.alloc(3000, 1) }])
    const read = () => page.evaluate(() => {
      const chip = document.getElementById('ff-photos').closest('.g-file-field').querySelector('.g-file-field__chip')
      const fill = chip.querySelector('.g-progress__fill')
      if (!fill) return null
      const c = chip.getBoundingClientRect()
      const f = fill.getBoundingClientRect()
      return { reach: Math.min(f.right, c.right) - c.left, width: c.width, edge: parseFloat(getComputedStyle(fill).borderInlineEndWidth) }
    })
    await page.waitForTimeout(400)
    const a = await read()
    await page.waitForTimeout(500)
    const b = await read()
    expect(a && b).toBeTruthy()
    expect(b.reach).toBeGreaterThan(a.reach)
    expect(b.edge, 'frente de avance visible').toBeGreaterThanOrEqual(2)
  })

  test('rechazo al enviar: la caja se sacude (g-reject-file-field) y is-rejected se retira al terminar', async ({ page }) => {
    await open(page, 'no-preference')
    await page.setInputFiles('#ff-photos', [{ name: 'foto-lento.png', mimeType: 'image/png', buffer: Buffer.alloc(3000, 1) }])
    await page.locator('#ff-photos-send').click()
    const s = await page.evaluate(() => new Promise((resolve) => {
      const root = document.getElementById('ff-photos').closest('.g-file-field')
      const box = root.querySelector('.g-file-field__box')
      const seen = { names: new Set(), moved: false, rejected: false }
      const t0 = performance.now()
      const tick = () => {
        const cs = getComputedStyle(box)
        seen.names.add(cs.animationName)
        if (cs.translate && cs.translate !== 'none' && parseFloat(cs.translate) !== 0) seen.moved = true
        if (root.classList.contains('is-rejected')) seen.rejected = true
        if (performance.now() - t0 < 900) requestAnimationFrame(tick)
        else resolve({ names: [...seen.names], moved: seen.moved, rejected: seen.rejected, end: root.classList.contains('is-rejected') })
      }
      requestAnimationFrame(tick)
    }))
    expect(s.rejected).toBe(true)
    expect(s.names).toContain('g-reject-file-field')
    expect(s.moved).toBe(true)
    expect(s.end).toBe(false)
  })
})
