// GTimeField · personalidad A «La hora dicha» (design/contracts/time-field.md «Movimiento», DECISIONS.md #407) sobre el
// componente real del playground (#sec-time). La palabra entra (is-entering, keyframes g-time-reading-rise) cuando la franja
// cambia con el foco: al cruzar las 12:00 con ↑ sube desde --g-space-1 × 1 con posiciones intermedias; no al montar, no al
// escribir cifras que no cambian la franja, no al pasar por un texto sin hora y volver a la misma franja, no al cambiar el
// valor desde la aplicación. Las dos lecturas entran al aparecer (texto rise, par fade). Con reduce, 0 animaciones.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

async function open(page, motion = 'no-preference') {
  await page.emulateMedia({ reducedMotion: motion })
  await page.goto(PAGE)
  await page.waitForSelector('#tf-tele')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.locator('#sec-time').scrollIntoViewIfNeeded()
  await page.evaluate(() => {
    window.__anims = []
    document.addEventListener('animationstart', (e) => { if (/^g-time-reading/.test(e.animationName)) window.__anims.push({ name: e.animationName, cls: String(e.target.className) }) }, true)
    const probe = document.createElement('div'); probe.style.inlineSize = 'var(--g-space-1)'; document.body.appendChild(probe)
    window.__space1 = probe.getBoundingClientRect().width; probe.remove()
    // Estado de la aplicación (Vue de desarrollo): para cambiar el valor «desde la aplicación»
    window.__tf = document.getElementById('app').__vue_app__._instance.setupState.tf
  })
}
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30)))))
const anims = (page) => page.evaluate(() => window.__anims.length)
const word = (page, id) => page.evaluate((i) => {
  const w = document.getElementById(i).closest('.g-input').querySelector('.g-time-field__reading-word')
  return w ? { text: w.textContent, entering: w.classList.contains('is-entering'), running: w.getAnimations().filter((a) => /^g-time-reading/.test(a.animationName)).length } : null
}, id)
async function typeIn(page, id, text) {
  await page.click('#' + id)
  await page.evaluate((i) => document.getElementById(i).select(), id)
  await page.keyboard.press('Backspace')
  await page.keyboard.type(text)
  await settle(page)
}

test.describe('GTimeField · personalidad (A, #407)', () => {
  test('al montar no entra nada', async ({ page }) => {
    await open(page)
    await page.waitForTimeout(400)
    expect(await anims(page)).toBe(0)
    expect(await page.locator('#sec-time .g-time-field__reading-word.is-entering').count()).toBe(0)
  })

  test('↑ que cruza las 12:00: la palabra cambia y sube desde space × 1 con posiciones intermedias', async ({ page }) => {
    await open(page)
    await typeIn(page, 'tf-tele', '11:59')
    await page.evaluate(() => { window.__anims.length = 0 })
    await page.keyboard.press('ArrowUp')
    const r = await page.evaluate(() => {
      const w = document.getElementById('tf-tele').closest('.g-input').querySelector('.g-time-field__reading-word')
      const a = w.getAnimations().find((x) => x.animationName === 'g-time-reading-rise')
      if (!a) return { text: w.textContent, entering: w.classList.contains('is-entering'), none: true }
      a.pause()
      const d = a.effect.getComputedTiming().duration
      const ys = []
      for (const f of [0, 0.25, 0.5, 0.75]) {
        a.currentTime = d * f
        const t = getComputedStyle(w).translate
        ys.push(t && t !== 'none' ? parseFloat(t.split(' ')[1] || '0') : 0)
      }
      a.finish()
      return { text: w.textContent, entering: w.classList.contains('is-entering'), ys, d }
    })
    expect(r.text).toBe('del mediodía')
    expect(r.entering).toBe(true)
    expect(r.none, 'hay animación g-time-reading-rise').toBeUndefined()
    const space = await page.evaluate(() => window.__space1)
    expect(Math.abs(r.ys[0] - space), `empieza en space × 1 (${r.ys})`).toBeLessThanOrEqual(0.5)
    const mid = r.ys.slice(1).filter((y) => y > 0.05 && y < space - 0.05)
    expect(new Set(mid.map((y) => y.toFixed(2))).size, `posiciones intermedias ${r.ys}`).toBeGreaterThanOrEqual(2)
  })

  test('escribir cifras que no cambian la franja, o pasar por un texto sin hora, no hace entrar la palabra', async ({ page }) => {
    await open(page)
    await typeIn(page, 'tf-tele', '12:30')
    await page.evaluate(() => { window.__anims.length = 0 })
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowUp')
    await settle(page)
    await page.keyboard.press('Backspace') // «12:3»: sin hora
    await settle(page)
    await page.keyboard.type('5') // «12:35»: la misma franja
    await settle(page)
    expect((await word(page, 'tf-tele')).text).toBe('del mediodía')
    expect(await anims(page)).toBe(0)
  })

  test('un cambio desde la aplicación sin foco no anima', async ({ page }) => {
    await open(page)
    await page.evaluate(() => { window.__anims.length = 0; window.__tf.tele = '21:30' })
    await settle(page)
    expect((await word(page, 'tf-tele')).text).toBe('de la noche')
    await page.evaluate(() => { window.__tf.tele = '08:00' })
    await settle(page)
    expect((await word(page, 'tf-tele')).entering).toBe(false)
    expect(await anims(page)).toBe(0)
  })

  test('las dos lecturas entran al aparecer: el par aparece (fade) y su texto sube (rise)', async ({ page }) => {
    await open(page)
    await page.click('#tf-toma')
    await page.evaluate(() => { window.__anims.length = 0 })
    await page.keyboard.type('9')
    await settle(page)
    const names = await page.evaluate(() => [...new Set(window.__anims.map((a) => a.name))].sort())
    expect(names).toEqual(['g-time-reading-fade', 'g-time-reading-rise'])
  })

  test('reduced motion: cruzar la franja y las lecturas cambian en su sitio, 0 animaciones', async ({ page }) => {
    await open(page, 'reduce')
    await typeIn(page, 'tf-tele', '11:59')
    await page.keyboard.press('ArrowUp')
    await settle(page)
    expect((await word(page, 'tf-tele')).text).toBe('del mediodía')
    await page.click('#tf-toma')
    await page.keyboard.type('9')
    await settle(page)
    expect(await page.locator('#sec-time .g-time-field__choice').count()).toBe(2)
    expect(await anims(page)).toBe(0)
    expect(await page.evaluate(() => document.getAnimations().filter((a) => /^g-time-reading/.test(a.animationName || '')).length)).toBe(0)
  })
})
