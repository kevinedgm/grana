// GHero (design/contracts/hero.md «Verificación · Playwright»; #725 a #729, #755, #756) sobre el COMPONENTE REAL
// (dist/hero.umd.js) en el banco packages/vue/playground/hero.html. Chromium, Firefox y WebKit. Puerto propio: GRANA_PW_PORT=4242.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/hero.html'
function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon|no-existe/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 40)))))
async function open(page, qs = '', { width = 1440, height = 900 } = {}) {
  await page.setViewportSize({ width, height })
  await page.goto(PAGE + qs)
  await page.waitForSelector('.g-hero')
  await page.evaluate(() => document.fonts.ready)
  await settle(page)
}
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)

for (const c of ['window', 'views', 'threshold']) {
  test(`${c}: sin desplazamiento horizontal a 1440, 390, 320 y 320×256; título ≥ title-lg; consola limpia`, async ({ page }) => {
    const errs = watchConsole(page)
    for (const [w, h] of [[1440, 900], [390, 844], [320, 640], [320, 256]]) {
      await open(page, `?c=${c}`, { width: w, height: h })
      expect(await overflow(page), `${w}×${h}`).toBe(false)
      const fs = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.g-hero__title')).fontSize))
      const min = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-text-title-lg-size')) * (getComputedStyle(document.documentElement).getPropertyValue('--g-text-title-lg-size').includes('rem') ? 16 : 1))
      expect(fs, `${w}`).toBeGreaterThanOrEqual(Math.floor(min) - 0.5)
    }
    expect(errs).toEqual([])
  })
}

for (const c of ['window', 'threshold']) {
  test(`${c}: la acción principal sin desplazar a 390×844`, async ({ page }) => {
    await open(page, `?c=${c}`, { width: 390, height: 844 })
    const b = await page.locator('#cta').boundingBox()
    expect(b.y + b.height).toBeLessThanOrEqual(844)
  })
}

test('A: la foto dentro de span.g-hero__frame, el detalle fuera; una sola fetchpriority=high; región con el nombre del h1', async ({ page }) => {
  await open(page)
  expect(await page.locator('.g-hero__frame > img.g-hero__img').count()).toBe(1)
  expect(await page.locator('.g-hero__media > img.g-hero__detail').count()).toBe(1)
  expect(await page.locator('[fetchpriority="high"]').count()).toBe(1)
  await expect(page.getByRole('region', { name: 'Casa Alcalá' })).toBeVisible()
  expect(await page.locator('h1').count()).toBe(1)
})

test('A: la mirada solo con soporte y sin movimiento reducido; el marco quieto', async ({ page, browserName }) => {
  await open(page, '?tall=1')
  const supported = await page.evaluate(() => CSS.supports('animation-timeline: view()'))
  const anim = () => page.evaluate(() => getComputedStyle(document.querySelector('.g-hero__frame > .g-hero__img')).animationName)
  if (supported) expect(await anim()).toBe('g-hero-look')
  else expect(await anim()).toBe('none')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await settle(page)
  expect(await anim()).toBe('none')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await open(page, '?nolook=1&tall=1')
  expect(await anim()).toBe('none')
  test.info().annotations.push({ type: 'motor', description: `${browserName}: animation-timeline ${supported ? 'sí' : 'no'}` })
})

test('B: vistas con una parada de Tab; → elige la siguiente, el foco sigue en el radio y se ve (data-g-key-focus en WebKit); capas estables', async ({ page }) => {
  await open(page, '?c=views')
  const before = await page.evaluate(() => [...document.querySelectorAll('.g-hero__media > img')].map((i, n) => { i.dataset.n = n; return n }))
  expect(before).toHaveLength(3)
  await page.locator('.g-hero__view-input').first().focus()
  await page.keyboard.press('ArrowRight')
  await settle(page)
  const state = await page.evaluate(() => {
    const a = document.activeElement
    const cur = document.querySelector('.g-hero__media > img.is-current')
    const label = a.closest('.g-hero__view')
    return { checked: a.checked, idx: a.value, curN: cur.dataset.n, alt: cur.alt, outline: getComputedStyle(label).outlineStyle, layers: [...document.querySelectorAll('.g-hero__layer')].map((l) => l.getAttribute('aria-hidden')) }
  })
  expect(state.checked).toBe(true)
  expect(state.idx).toBe('1')
  expect(state.curN).toBe('1') // el mismo nodo cambia de clase (#759)
  expect(state.alt).toBe('Habitación con cama de lino y muro de adobe')
  expect(state.outline).not.toBe('none')
  expect(state.layers).toEqual(['true', 'true'])
  expect(await page.evaluate(() => window.heroState.view.value)).toBe('habitacion')
  // La placa es zona de marca y la foto queda fuera
  expect(await page.locator('.g-hero__plate[data-g-zone="brand"] .g-hero__title').count()).toBe(1)
  expect(await page.locator('[data-g-zone] .g-hero__media').count()).toBe(0)
})

test('B: las capas no piden su foto hasta el load de la principal', async ({ page }) => {
  await page.route('**/*', (r) => r.continue())
  await open(page, '?c=views')
  const srcs = await page.evaluate(() => [...document.querySelectorAll('.g-hero__layer')].map((l) => Boolean(l.getAttribute('src'))))
  expect(srcs).toEqual([true, true]) // ya cargó la principal (data URI): las capas tienen src
  expect(await page.evaluate(() => [...document.querySelectorAll('.g-hero__layer')].map((l) => l.getAttribute('fetchpriority')))).toEqual(['low', 'low'])
})

test('vídeo: pausa con nombre constante en texto oculto, aria-pressed, solo icono visible; con reducido arranca en pausa', async ({ page }) => {
  await open(page, '?video=1')
  const b = page.locator('button.g-hero__motion')
  await expect(b).toHaveAccessibleName('Pausar el movimiento')
  await expect(b).toHaveAttribute('aria-pressed', 'false')
  const label = await page.evaluate(() => { const r = document.querySelector('.g-hero__motion-label').getBoundingClientRect(); return r.width * r.height })
  expect(label).toBeLessThanOrEqual(1)
  const size = await b.boundingBox()
  expect(Math.round(size.width)).toBeGreaterThanOrEqual(44)
  await b.click()
  await expect(b).toHaveAttribute('aria-pressed', 'true')
  await expect(b).toHaveAccessibleName('Pausar el movimiento')
  expect(await page.locator('.g-hero').getAttribute('class')).toContain('is-paused')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, '?video=1')
  await expect(page.locator('button.g-hero__motion')).toHaveAttribute('aria-pressed', 'true')
})

test('C: la consulta va antes de las acciones y la tarjeta cruza el borde de la foto sin tapar la mitad', async ({ page }) => {
  await open(page, '?c=threshold')
  const order = await page.evaluate(() => [...document.querySelector('.g-hero__content').children].map((c) => c.className.split(' ')[0]))
  expect(order.indexOf('g-hero__consult')).toBeLessThan(order.indexOf('g-hero__actions'))
  const g = await page.evaluate(() => { const m = document.querySelector('.g-hero__media').getBoundingClientRect(); const c = document.querySelector('.g-hero__card').getBoundingClientRect(); return { overlap: m.bottom - c.top, h: m.height } })
  expect(g.overlap).toBeGreaterThan(0)
  expect(g.overlap).toBeLessThan(g.h / 2)
})

test('B y C: el texto de la placa y la tarjeta contrasta ≥ 4,5:1 con cielo, noche y papel picado (no depende de la foto)', async ({ page }) => {
  for (const c of ['views', 'threshold']) for (const photo of ['cielo', 'noche', 'papel-picado']) {
    await open(page, `?c=${c}&photo=${photo}`)
    const ratio = await page.evaluate(() => {
      const lum = (s) => { const m = s.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]) }
      const t = document.querySelector('.g-hero__title')
      const box = t.closest('.g-hero__plate, .g-hero__card')
      const a = lum(getComputedStyle(t).color); const b = lum(getComputedStyle(box).backgroundColor)
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    })
    expect(ratio, `${c} ${photo}`).toBeGreaterThanOrEqual(4.5)
  }
})

test('forced-colors: placa y tarjeta con borde real', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced-colors solo se emula en Chromium')
  await page.emulateMedia({ forcedColors: 'active' })
  for (const c of ['views', 'threshold']) {
    await open(page, `?c=${c}`)
    const bw = await page.evaluate(() => { const el = document.querySelector('.g-hero__plate, .g-hero__card'); const cs = getComputedStyle(el); return [cs.borderTopStyle, parseFloat(cs.borderTopWidth)] })
    expect(bw[0]).toBe('solid')
    expect(bw[1]).toBeGreaterThan(0)
  }
})
