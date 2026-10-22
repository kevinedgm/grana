// GText sobre el COMPONENTE REAL del playground (#sec-text; text.md «Verificación»). Chromium.
// Cubre: render por as, clases por prop, vacío sin nodo, ritmo medido (body-sm 10, caption 8, body 12; 0 antes del primero y
// tras el último), anidada (cita y pie con el ritmo de la figura, párrafos con el de la cita), raíz sin margen, 320 px sin
// desplazamiento y consola limpia. Un puerto propio: GRANA_PW_PORT=4218 npx playwright test tests/text.spec.mjs --project=chromium
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

async function open(page, { width = 1280 } = {}) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana GText/.test(t)) errs.push(`warning: ${t}`)
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width, height: 900 })
  await page.goto(PAGE)
  await page.waitForSelector('#txt-a.g-text')
  return errs
}

const gapsOf = (page, sel) => page.$eval(sel, (el) => {
  const kids = [...el.children].filter((c) => getComputedStyle(c).display !== 'none')
  return kids.slice(1).map((c, i) => Math.round((c.getBoundingClientRect().top - kids[i].getBoundingClientRect().bottom) * 100) / 100)
})

test.describe('GText', () => {
  test('etiqueta y clases por as, size y tone; la vacía no deja nodo', async ({ page }) => {
    const errs = await open(page)
    expect(await page.$eval('#txt-a', (e) => [e.tagName, e.className])).toEqual(['P', 'g-text g-text--size-body g-text--tone-default'])
    expect(await page.$eval('#txt-b', (e) => e.className)).toBe('g-text g-text--size-body-sm g-text--tone-muted')
    expect(await page.$eval('#txt-fig', (e) => e.tagName)).toBe('FIGURE')
    expect(await page.$eval('#txt-quote', (e) => [e.tagName, e.lang])).toEqual(['BLOCKQUOTE', 'en'])
    expect(await page.$eval('#txt-cap', (e) => e.tagName)).toBe('FIGCAPTION')
    expect(await page.$$('#txt-empty')).toHaveLength(0)
    expect(errs).toEqual([])
  })

  test('la raíz no pone aire: dentro de una pila sm los vecinos quedan a 12 (la vacía no suma)', async ({ page }) => {
    await open(page)
    expect(await gapsOf(page, '#txt-stack')).toEqual([12, 12])
    const m = await page.$eval('#txt-a', (e) => { const s = getComputedStyle(e); return [s.marginBlockStart, s.marginBlockEnd, s.fontStyle] })
    expect(m).toEqual(['0px', '0px', 'normal'])
  })

  test('ritmo entre bloques: body 12, 0 antes del primero y tras el último', async ({ page }) => {
    await open(page)
    expect(await gapsOf(page, '#txt-div')).toEqual([12, 12])
    const edges = await page.$eval('#txt-div', (el) => [getComputedStyle(el.firstElementChild).marginBlockStart, getComputedStyle(el.lastElementChild).marginBlockEnd])
    expect(edges).toEqual(['0px', '0px'])
  })

  test('anidada: cita y pie a 10 (ritmo de la figura), párrafos de la cita a 10 (el suyo)', async ({ page }) => {
    await open(page)
    expect(await gapsOf(page, '#txt-fig')).toEqual([10])
    expect(await gapsOf(page, '#txt-quote')).toEqual([10])
    const m = await page.$eval('#txt-quote', (e) => getComputedStyle(e).marginInlineStart)
    expect(m).toBe('0px')
  })

  test('a 320 px no hay desplazamiento horizontal', async ({ page }) => {
    await open(page, { width: 320 })
    const w = await page.$eval('#txt-demo', (e) => [e.scrollWidth, e.clientWidth])
    expect(w[0]).toBeLessThanOrEqual(w[1])
  })
})
