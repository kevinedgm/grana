// Personalidad y movimiento de GBreadcrumbs sobre el componente real del playground (#sec-breadcrumbs), en Chromium,
// Firefox y WebKit: breadcrumbs.md §«Movimiento» (#500) y la regla de subir o bajar (L13). Bajar: el nivel nuevo entra con
// g-breadcrumbs-enter (translate desde space × 3 hacia el inicio, --g-ease-spring) + g-breadcrumbs-enter-fade y pierde
// is-entering al acabar TODAS sus animaciones; subir: copia saliente inerte con g-breadcrumbs-leave que se retira; nada al
// montar ni al cambiar de etapa; escalera escalón a escalón; giros de la puerta (90°) y de la divulgación (180°); con
// movimiento reducido, solo el fundido del que llega, sin copia y sin giros animados.
// Un solo proceso por puerto: GRANA_PW_PORT=4215.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

async function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana GBreadcrumbs/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
async function open(page, motion = 'no-preference') {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.goto(PAGE)
  await page.waitForSelector('#bc-spa.is-ready')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => document.querySelector('#bc-box').scrollIntoView({ block: 'start' }))
  await page.mouse.move(2, 2)
  await frames(page)
}
const frames = (page, n = 2) => page.evaluate((k) => new Promise((r) => { const f = () => (k-- > 0 ? requestAnimationFrame(f) : setTimeout(r, 20)); f() }), n)
async function setW(page, w) {
  await page.evaluate((w) => { const r = document.getElementById('bc-range'); r.value = w; r.dispatchEvent(new Event('input')) }, w)
  await frames(page, 4)
}
// Animaciones de fotogramas (no transiciones) dentro de las migas
const keyframeAnims = (page, sel = '.g-breadcrumbs') => page.evaluate((sel) => document.getAnimations().filter((a) => a.animationName && a.effect && a.effect.target && a.effect.target.closest(sel)).map((a) => a.animationName), sel)

test.describe('GBreadcrumbs · movimiento (#500)', () => {
  test('nada se anima al montar ni al cambiar de etapa', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    expect(await keyframeAnims(page)).toEqual([])
    const trans = []
    await page.exposeFunction('__bcTrans', (p) => trans.push(p))
    await page.evaluate(() => document.addEventListener('transitionrun', (e) => { if (e.target.closest && e.target.closest('#bc-main, #bc-plain')) window.__bcTrans(e.propertyName) }))
    for (const w of [1100, 300, 1100]) {
      await setW(page, w)
      expect(await keyframeAnims(page, '#bc-main, #bc-plain'), `${w}px`).toEqual([])
    }
    await page.waitForTimeout(200)
    // Solo color y fondo de las pastillas (data-clipped), nunca tamaño ni posición
    expect(trans.filter((p) => !/^(color|background-color|box-shadow)$/.test(p)), trans.join(',')).toEqual([])
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('bajar: el nuevo último entra con el muelle desde detrás del anterior y pierde is-entering al acabar; es la página actual desde el primer cuadro', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    // Pulsar y leer en la misma tarea de la página (en WebKit sin cabeza el reloj de la animación corre más que la ida y
    // vuelta de Playwright)
    const m = await page.evaluate(async () => {
      document.getElementById('bc-down').click()
      await new Promise((r) => setTimeout(r, 0))
      const li = [...document.querySelectorAll('#bc-spa > .g-breadcrumbs__list > li')].pop()
      const cs = getComputedStyle(li)
      const anims = li.getAnimations().map((a) => ({ name: a.animationName, d: a.effect.getTiming().duration }))
      return { cls: li.className, cur: li.querySelector('[aria-current="page"]')?.textContent, anims, tf: cs.animationTimingFunction, z: cs.zIndex, tx: parseFloat(String(cs.translate).split(' ')[0]) || 0 }
    })
    expect(m.cls).toContain('is-entering')
    expect(m.cur).toBe('2026')
    expect(m.anims.map((a) => a.name).sort()).toEqual(['g-breadcrumbs-enter', 'g-breadcrumbs-enter-fade'])
    expect(m.z).toBe('0')
    expect(m.tx, 'parte del inicio (detrás del anterior)').toBeLessThan(0)
    if (await page.evaluate(() => CSS.supports('transition-timing-function', 'linear(0, 1)'))) expect(m.tf.split(',')[0] + m.tf, 'el translate con --g-ease-spring').toMatch(/linear\(/)
    expect(await page.evaluate(() => document.querySelectorAll('#bc-spa [aria-current="page"]').length)).toBe(1)
    await page.waitForFunction(() => !document.querySelector('#bc-spa .is-entering'), null, { timeout: 2000 })
    const end = await page.evaluate(() => { const li = [...document.querySelectorAll('#bc-spa > .g-breadcrumbs__list > li')].pop(); return { anims: li.getAnimations().length, tx: getComputedStyle(li).translate } })
    expect(end.anims).toBe(0)
    expect(end.tx).toMatch(/^(none|0px)/)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('subir: copia saliente al final, inerte y sin ids, que se recoge con g-breadcrumbs-leave y se retira', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const c = await page.evaluate(async () => {
      document.getElementById('bc-up').click()
      await new Promise((r) => setTimeout(r, 0))
      const li = document.querySelector('#bc-spa > .g-breadcrumbs__list > li.is-leaving')
      if (!li) return null
      return { last: li === li.parentElement.lastElementChild, hidden: li.getAttribute('aria-hidden'), inert: li.inert, ids: li.querySelectorAll('[id]').length, w: li.getBoundingClientRect().width, anims: li.getAnimations().map((a) => a.animationName), pe: getComputedStyle(li).pointerEvents, clip: getComputedStyle(li.parentElement).overflowX }
    })
    expect(c).not.toBeNull()
    expect(c).toMatchObject({ last: true, hidden: 'true', inert: true, ids: 0, w: 0, anims: ['g-breadcrumbs-leave'], pe: 'none', clip: 'clip' })
    expect(await page.evaluate(() => document.querySelectorAll('#bc-spa [aria-current="page"]').length)).toBe(1)
    await page.waitForFunction(() => !document.querySelector('#bc-spa .is-leaving'), null, { timeout: 2000 })
    // Cualquier otro cambio: sin animación (navegar desde la fila a un nivel anterior quita dos de golpe)
    await page.click('#bc-down')
    await page.click('#bc-down')
    await page.waitForFunction(() => !document.querySelector('#bc-spa .is-entering'), null, { timeout: 2000 })
    await page.click('#bc-spa > .g-breadcrumbs__list > li:nth-child(2) > .g-breadcrumbs__link')
    expect(await page.evaluate(() => Boolean(document.querySelector('#bc-spa .is-entering, #bc-spa .is-leaving')))).toBe(false)
    expect(await page.textContent('#bc-log')).toBe('navigate (SPA) · path · Laboratorio central (índice 1)')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('escalera escalón a escalón (retardo acotado) y giros: puerta 90°, divulgación 180°', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.click('#bc-main > .g-breadcrumbs__list > li:nth-child(5) > .g-breadcrumbs__door')
    await page.waitForTimeout(400)
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('#bc-main > .g-breadcrumbs__list > li:nth-child(5) > .g-breadcrumbs__door .g-icon')).rotate)).toBe('90deg')
    await page.keyboard.press('Escape')
    await setW(page, 320)
    await page.click('#bc-main .g-breadcrumbs__toggle')
    await frames(page)
    const st = await page.evaluate(() => [...document.querySelectorAll('#bc-main .g-breadcrumbs__stair')].map((li) => ({ names: li.getAnimations().map((a) => a.animationName), delay: li.getAnimations()[0] ? li.getAnimations()[0].effect.getTiming().delay : null })))
    expect(st.every((s) => s.names.join() === 'g-breadcrumbs-stair'), JSON.stringify(st)).toBe(true)
    const d = st.map((s) => s.delay)
    expect(d[0]).toBe(0)
    expect(d.every((v, i) => i === 0 || v >= d[i - 1]), d.join(',')).toBe(true)
    expect(d[5], 'acotado a min(i, 4)').toBe(d[4])
    await page.waitForTimeout(500)
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('#bc-main .g-breadcrumbs__chevron')).rotate)).toBe('180deg')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('movimiento reducido: el que llega solo funde, no hay copia saliente ni escalera animada; los chevrons giran sin transición', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, 'reduce')
    await page.click('#bc-down')
    const a = await page.evaluate(() => { const li = [...document.querySelectorAll('#bc-spa > .g-breadcrumbs__list > li')].pop(); return { cls: li.className, anims: li.getAnimations().map((x) => x.animationName) } })
    expect(a.anims).toEqual(a.cls.includes('is-entering') ? ['g-breadcrumbs-enter-fade'] : [])
    await page.waitForFunction(() => !document.querySelector('#bc-spa .is-entering'), null, { timeout: 2000 })
    await page.click('#bc-up')
    await frames(page)
    expect(await page.evaluate(() => Boolean(document.querySelector('#bc-spa .is-leaving')))).toBe(false)
    await setW(page, 320)
    await page.click('#bc-main .g-breadcrumbs__toggle')
    await frames(page)
    expect(await keyframeAnims(page, '#bc-main')).toEqual([])
    expect(await page.evaluate(() => { const c = getComputedStyle(document.querySelector('#bc-main .g-breadcrumbs__chevron')); return { r: c.rotate, t: c.transitionProperty.includes('rotate') } })).toEqual({ r: '180deg', t: false })
    expect(errs, errs.join('\n')).toEqual([])
  })
})
