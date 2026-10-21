// GStack y GSection sobre el COMPONENTE REAL del playground (packages/vue/playground, #sec-stack y #sec-section).
// Cubre lo que el contrato pide a bruno (stack.md y section.md «Verificación»): separación 12 / 24 / 48 / 0 y compact 18,
// márgenes de los hijos a 0, divided con un hijo hidden, horizontal sin desbordar a 320, niveles h2 › h3 › h4 con tamaños
// 20 › 16 › 14, headingLevel fijado (etiqueta distinta, tamaño por profundidad), aria-labelledby solo con landmark y
// consola sin avisos. Un solo proceso por puerto: GRANA_PW_PORT=4213 npx playwright test tests/stack-section.spec.mjs --project=chromium
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

async function open(page, { width = 1280 } = {}) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana GStack|\[Grana GSection/.test(t)) errs.push(`warning: ${t}`)
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width, height: 900 })
  await page.goto(PAGE)
  await page.waitForSelector('#stk-sm.g-stack')
  return errs
}

// Aire en bloque entre los hijos visibles consecutivos de un contenedor
const gaps = (page, sel) => page.$eval(sel, (el) => {
  const kids = [...el.children].filter((c) => getComputedStyle(c).display !== 'none')
  return kids.slice(1).map((c, i) => Math.round((c.getBoundingClientRect().top - kids[i].getBoundingClientRect().bottom) * 100) / 100)
})

test.describe('GStack', () => {
  test('gap sm, md, lg y none con space 4; compact 18; márgenes de los hijos en 0', async ({ page }) => {
    const errs = await open(page)
    expect(await gaps(page, '#stk-sm')).toEqual([12, 12])
    expect(await gaps(page, '#stk-md')).toEqual([24, 24])
    expect(await gaps(page, '#stk-lg')).toEqual([48, 48])
    expect(await gaps(page, '#stk-none')).toEqual([0, 0])
    expect(await gaps(page, '#stk-compact')).toEqual([18])
    const margins = await page.$eval('#stk-md', (el) => [...el.children].map((c) => getComputedStyle(c).marginBlockStart + '/' + getComputedStyle(c).marginBlockEnd))
    expect(margins).toEqual(['0px/0px', '0px/0px', '0px/0px'])
    expect(errs).toEqual([])
  })

  test('divided: línea en cada visible salvo el primero y un hijo hidden no cuenta', async ({ page }) => {
    await open(page)
    const r = await page.$eval('#stk-divided', (el) => [...el.children].map((c) => ({ hidden: c.hidden, bt: parseFloat(getComputedStyle(c).borderBlockStartWidth) })))
    expect(r.map((x) => x.hidden)).toEqual([false, false, true, false])
    const visible = r.filter((x) => !x.hidden)
    expect(visible[0].bt).toBe(0)
    expect(visible[1].bt).toBeGreaterThan(0)
    expect(visible[2].bt).toBeGreaterThan(0)
    expect(r[2].bt).toBe(0)
  })

  test('horizontal: se parte y no desborda a 320', async ({ page }) => {
    await open(page, { width: 320 })
    const r = await page.$eval('#stk-row', (el) => ({ over: el.scrollWidth - el.clientWidth, page: document.documentElement.scrollWidth - document.documentElement.clientWidth, tops: new Set([...el.children].map((c) => Math.round(c.getBoundingClientRect().top))).size }))
    expect(r.over).toBeLessThanOrEqual(0)
    expect(r.page).toBeLessThanOrEqual(0)
    expect(r.tops).toBeGreaterThan(1)
  })
})

test.describe('GSection', () => {
  test('niveles h2 › h3 › h4 y tamaños 20 › 16 › 14', async ({ page }) => {
    const errs = await open(page)
    const r = await page.$$eval('#sct-a .g-section__title', (els) => els.map((e) => ({ id: e.closest('section').id, tag: e.tagName, size: getComputedStyle(e).fontSize })))
    expect(r.map((x) => `${x.id}:${x.tag}:${x.size}`)).toEqual(['sct-a:H2:20px', 'sct-b:H3:16px', 'sct-c:H4:14px', 'sct-d:H3:16px'])
    expect(errs).toEqual([])
  })

  test('landmark solo en la que lo pide; acciones con nombre; separación del cuerpo md', async ({ page }) => {
    await open(page)
    const r = await page.evaluate(() => {
      const a = document.querySelector('#sct-a')
      const titleId = a.querySelector(':scope > .g-section__head .g-section__title').id
      const body = a.querySelector(':scope > .g-section__body')
      const kids = [...body.children]
      return {
        labelledby: a.getAttribute('aria-labelledby') === titleId,
        others: ['#sct-b', '#sct-c', '#sct-d'].map((s) => document.querySelector(s).getAttribute('aria-labelledby')),
        group: a.querySelector('.g-section__actions').getAttribute('role') + '|' + a.querySelector('.g-section__actions').getAttribute('aria-label'),
        gap: Math.round(kids[1].getBoundingClientRect().top - kids[0].getBoundingClientRect().bottom)
      }
    })
    expect(r.labelledby).toBe(true)
    expect(r.others).toEqual([null, null, null])
    expect(r.group).toBe('group|Acciones de firmantes')
    expect(r.gap).toBe(24)
  })

  test('las acciones bajan bajo el título a 320 sin desbordar', async ({ page }) => {
    await open(page, { width: 320 })
    const r = await page.$eval('#sct-a', (el) => {
      const t = el.querySelector('.g-section__title').getBoundingClientRect()
      const a = el.querySelector('.g-section__actions').getBoundingClientRect()
      return { page: document.documentElement.scrollWidth - document.documentElement.clientWidth, below: a.top >= t.bottom - 1 || a.left >= t.right }
    })
    expect(r.page).toBeLessThanOrEqual(0)
    expect(r.below).toBe(true)
  })
})
