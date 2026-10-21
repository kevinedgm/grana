// GBookingBar y GPartyField (design/contracts/booking-bar.md «Verificación · Playwright»; #736 a #742, #757, #759) y la
// enmienda de GDatePicker (#739: «solo salida») sobre los COMPONENTES REALES (dist/booking.umd.js) en
// packages/vue/playground/booking.html. Chromium, Firefox y WebKit. GRANA_PW_PORT=4242.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/booking.html'
function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
const settle = (p, ms = 60) => p.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms)
async function open(page, qs = '', { width = 1280, height = 800 } = {}) {
  await page.setViewportSize({ width, height })
  await page.goto(PAGE + qs)
  await page.waitForSelector('form.g-booking-bar')
  await page.evaluate(() => document.fonts.ready)
  await settle(page)
}
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const slot = (p, s) => p.locator(`.g-booking-bar__slot[id$="-slot-${s}"]`)

for (const kind of ['stay', 'table', 'tour']) for (const a of ['phrase', 'bar']) {
  test(`${kind} · ${a}: sin desplazamiento horizontal a 1440, 390 y 320 (LTR y RTL); consola limpia`, async ({ page }) => {
    const errs = watchConsole(page)
    for (const dir of ['ltr', 'rtl']) for (const [w, h] of [[1440, 900], [390, 844], [320, 640]]) {
      await open(page, `?kind=${kind}&a=${a}&dir=${dir}`, { width: w, height: h })
      expect(await overflow(page), `${dir} ${w}`).toBe(false)
    }
    expect(errs).toEqual([])
  })
}

test('la frase refluye como texto a 390 y 320 (más de una línea, sin desbordar su caja)', async ({ page }) => {
  for (const w of [390, 320]) {
    await open(page, '', { width: w, height: 800 })
    const g = await page.evaluate(() => { const p = document.querySelector('.g-booking-bar__phrase'); const lh = parseFloat(getComputedStyle(p).lineHeight); return { h: p.getBoundingClientRect().height, lh, sw: p.scrollWidth, cw: p.clientWidth } })
    expect(g.h).toBeGreaterThan(g.lh * 1.5)
    expect(g.sw).toBeLessThanOrEqual(g.cw + 1)
  }
})

test('el panel del grupo y el de noches quedan dentro del visor a 390', async ({ page }) => {
  await open(page, '', { width: 390, height: 700 })
  for (const s of ['party', 'nights']) {
    await slot(page, s).click(); await settle(page, 200)
    const r = await page.evaluate(() => { const el = [...document.querySelectorAll('.g-party-field__panel, .g-booking-bar__slot-panel')].find((x) => x.matches(':popover-open')); const b = el.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, vw: innerWidth, vh: innerHeight } })
    expect(r.l, s).toBeGreaterThanOrEqual(0)
    expect(r.r, s).toBeLessThanOrEqual(r.vw)
    expect(r.t, s).toBeGreaterThanOrEqual(0)
    expect(r.b, s).toBeLessThanOrEqual(r.vh + 1)
    await page.keyboard.press('Escape'); await settle(page, 200)
    expect(await page.evaluate(() => document.activeElement.className), s).toContain('g-booking-bar__slot')
  }
})

test('enviar incompleto: foco al primer hueco, aria-invalid y mensaje; con fechas y noches válidas emite la intención', async ({ page }) => {
  await open(page)
  await page.locator('.g-booking-bar__submit').first().click(); await settle(page, 120)
  expect(await page.evaluate(() => document.activeElement.id)).toMatch(/-slot-from$/)
  await expect(slot(page, 'from')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('.g-booking-bar__messages li')).toHaveText('Elige la llegada y las noches.')
  await page.evaluate(() => { const s = window.bookingState; s.query.value = { from: s.plus(20), to: s.plus(22), party: { adults: 2, children: 0, rooms: 1 } } })
  await settle(page)
  await page.locator('.g-booking-bar__submit').first().click(); await settle(page)
  const it = await page.evaluate(() => window.bookingState.intents.at(-1))
  expect(it).toMatchObject({ kind: 'stay', nights: 2, party: { adults: 2, children: 0, rooms: 1 } })
})

test('noche agotada dentro de la estancia: error con la fecha; salir el día agotado: válido', async ({ page }) => {
  await open(page)
  await page.evaluate(() => { const s = window.bookingState; s.query.value = { from: s.plus(3), to: s.plus(6), party: { adults: 2, children: 0, rooms: 1 } } })
  await page.locator('.g-booking-bar__submit').first().click(); await settle(page)
  await expect(page.locator('.g-booking-bar__messages li')).toHaveText(/^No quedan habitaciones la noche del /)
  await page.evaluate(() => { const s = window.bookingState; s.query.value = { from: s.plus(2), to: s.plus(4), party: { adults: 2, children: 0, rooms: 1 } } })
  await page.locator('.g-booking-bar__submit').first().click(); await settle(page)
  expect(await page.evaluate(() => window.bookingState.intents.length)).toBe(1)
})

test('GDatePicker en la barra: el día agotado cuya noche anterior no lo está es «solo salida» (is-checkout-only, sufijo)', async ({ page }) => {
  await open(page, '?a=bar')
  await page.locator('.g-booking-bar__row .g-datepicker__field').first().click(); await settle(page, 200)
  const d = await page.evaluate(() => window.bookingState.plus(4))
  const day = page.locator(`.g-datepicker__pop:popover-open [data-date="${d}"]`)
  if (await day.count() === 0) { await page.locator('.g-datepicker__pop:popover-open .g-datepicker__nav--next').first().click(); await settle(page) }
  await expect(page.locator(`.g-datepicker__pop:popover-open [data-date="${d}"]`)).toHaveClass(/is-checkout-only/)
  await expect(page.locator(`.g-datepicker__pop:popover-open [data-date="${d}"]`)).toHaveAttribute('aria-label', /, solo salida$/)
})

test('barra compacta a 390: resumen + acción; el resumen abre la hoja con los campos en línea y Esc devuelve el foco', async ({ page }) => {
  await open(page, '?a=bar', { width: 390, height: 800 })
  await settle(page, 200)
  await expect(page.locator('form.g-booking-bar')).toHaveClass(/is-compact/)
  await page.locator('.g-booking-bar__summary').click(); await settle(page, 300)
  await expect(page.locator('dialog.g-booking-bar__sheet')).toHaveAttribute('open', '')
  expect(await page.locator('dialog.g-booking-bar__sheet .g-datepicker--inline').count()).toBe(1)
  expect(await page.locator('dialog.g-booking-bar__sheet .g-party-field--mode-inline').count()).toBe(1)
  await page.keyboard.press('Escape'); await settle(page, 400)
  expect(await page.evaluate(() => document.activeElement.className)).toContain('g-booking-bar__summary')
  await page.setViewportSize({ width: 1440, height: 800 }); await settle(page, 300)
  await expect(page.locator('form.g-booking-bar')).not.toHaveClass(/is-compact/)
})

for (const reduced of [false, true]) {
  test(`muelle${reduced ? ' (reducido)' : ''}: aparece al pasar la consulta, alto de contrato, el último botón nunca queda tapado (cola #757) y se va al volver`, async ({ page }) => {
    if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, '?dock=1&tail=0', { width: 1024, height: 700 })
    const dock = page.locator('.g-booking-bar__dock')
    await expect(dock).toHaveAttribute('hidden', '')
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await settle(page, 500)
    await expect(dock).toHaveClass(/is-shown/)
    await expect(dock).not.toHaveAttribute('hidden', '')
    const g = await page.evaluate(() => { const d = document.querySelector('.g-booking-bar__dock').getBoundingClientRect(); return { h: d.height, top: d.top, sp: getComputedStyle(document.documentElement).scrollPaddingBlockEnd } })
    expect(Math.round(g.h)).toBe(64)
    expect(parseFloat(g.sp)).toBe(64)
    await page.locator('#last').focus(); await settle(page, 200)
    const last = await page.locator('#last').boundingBox()
    expect(last.y + last.height).toBeLessThanOrEqual(g.top + 1)
    await page.evaluate(() => window.scrollTo(0, 0)); await settle(page, 500)
    await expect(dock).toHaveAttribute('hidden', '')
    const tail = await page.evaluate(() => getComputedStyle(document.documentElement, '::after').content)
    expect(['none', 'normal']).toContain(tail)
  })
}

test('GPartyField suelto: resumen, + corrige el grupo, ocultos', async ({ page }) => {
  await open(page, '?party=1')
  const t = page.locator('#pf, .g-party-field:not(.g-party-field--trigger) .g-party-field__trigger').last()
  await expect(t).toHaveAccessibleName(/Huéspedes 2 adultos · 1 habitación/)
  await t.click(); await settle(page, 200)
  expect(await page.evaluate(() => document.activeElement.tagName)).toBe('INPUT')
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  expect(await page.evaluate(() => [...document.querySelectorAll('input[type=hidden][name^="guests["]')].length)).toBeGreaterThanOrEqual(3)
})

test('tema oscuro y RTL sin desbordar; forced-colors con bordes reales (Chromium)', async ({ page, browserName }) => {
  await open(page, '?dark=1&dir=rtl', { width: 390, height: 800 })
  expect(await overflow(page)).toBe(false)
  if (browserName !== 'chromium') return
  await page.emulateMedia({ forcedColors: 'active' })
  await open(page, '?a=bar', { width: 390, height: 800 })
  await settle(page, 200)
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.g-booking-bar__summary')).borderTopStyle)).toBe('solid')
})
