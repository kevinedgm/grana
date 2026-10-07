// data-g-key-focus · anillo de foco en los radios al navegar con el teclado (auditoría de la pista,
// design/lab/tooltip/auditoria-pista.md, hallazgo 1; WCAG 2.4.7). WebKit no marca :focus-visible en el radio al que llevan
// las flechas; el .vue escribe data-g-key-focus (utils/keyFocus.js) y el CSS de coco dibuja el mismo anillo con
// :is(:focus-visible, :where([data-g-key-focus]):focus). Sobre el playground real, en Chromium, Firefox y WebKit:
// GRadioGroup (list, segmented, chip, card, solo icono), GCard selectType="radio" y las categorías de GWidgetGallery.
// Tab y → dejan el atributo y el anillo (contorno sólido con ancho > 0); el clic de ratón no lo pone.
// Un solo proceso por puerto: GRANA_PW_PORT=4210 (bruno, este encargo).
import { test, expect } from '@playwright/test'
import { TAB, watchConsole, open, frames } from './visual-tip-helpers.mjs'

/** Anillo del radio enfocado según dónde lo dibuja el CSS: el propio radio, su opción, la tarjeta (::after) o el chip */
const RING = {
  input: '(e) => [e, null]',
  option: "(e) => [e.closest('.g-radio-group__option'), null]",
  card: "(e) => [e.closest('.g-card'), '::after']",
  chip: '(e) => [e.nextElementSibling, null]'
}
const state = (page, ring) => page.evaluate((ring) => {
  const e = document.activeElement
  const [el, pseudo] = (0, eval)(ring)(e)
  const o = getComputedStyle(el, pseudo)
  return { radio: e.localName === 'input' && e.type === 'radio', id: e.id || e.value, attr: e.hasAttribute('data-g-key-focus'), fv: e.matches(':focus-visible'), style: o.outlineStyle, w: parseFloat(o.outlineWidth) || 0, color: o.outlineColor }
}, ring)
/** El mismo anillo sin el atributo (lo que se veía antes): se quita y se vuelve a poner */
const without = (page, ring) => page.evaluate((ring) => {
  const e = document.activeElement
  e.removeAttribute('data-g-key-focus')
  const [el, pseudo] = (0, eval)(ring)(e)
  const o = getComputedStyle(el, pseudo)
  const r = { style: o.outlineStyle, w: parseFloat(o.outlineWidth) || 0, color: o.outlineColor }
  e.setAttribute('data-g-key-focus', '')
  return r
}, ring)
// Visible: sólido, con ancho y no transparente (list e inline llevan un contorno transparente en reposo para animarlo)
const clear = (c) => c === 'transparent' || /,\s*0(\.0+)?\)$|\/\s*0(\.0+)?\)$/.test(c)
const solid = (s) => s.style === 'solid' && s.w > 0 && !clear(s.color)
/** Botón de partida justo antes de `sel`, enfocado por programa (no cuenta como entrada de teclado) */
const before = (page, sel) => page.evaluate((sel) => {
  document.getElementById('__kf')?.remove()
  const t = document.querySelector(sel)
  const b = document.createElement('button')
  b.id = '__kf'
  b.textContent = 'antes'
  t.parentElement.insertBefore(b, t)
  b.focus()
}, sel)
const marked = (page, scope) => page.evaluate((scope) => document.querySelectorAll(`${scope} [data-g-key-focus]`).length, scope)

// El anillo de list e inline anima su color: sin transiciones, el estilo calculado es el final al instante
const still = (page) => page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })

async function keyboardThenClick(page, browserName, { scope, start, ring, radios, clickBox }) {
  await still(page)
  const note = (k, v) => test.info().annotations.push({ type: k, description: `${browserName} ${scope}: ${v}` })
  await before(page, start)
  await page.keyboard.press(TAB(browserName))
  await frames(page)
  const a = await state(page, ring)
  expect(a.radio, `${scope}: Tab no lleva a un radio`).toBe(true)
  expect(a.attr, `${scope}: Tab no deja data-g-key-focus`).toBe(true)
  expect(solid(a), `${scope}: Tab sin anillo ${JSON.stringify(a)}`).toBe(true)

  await page.keyboard.press('ArrowRight')
  await frames(page)
  const b = await state(page, ring)
  expect(b.radio).toBe(true)
  expect(b.id, `${scope}: → no movió el foco`).not.toBe(a.id)
  expect(b.attr, `${scope}: → no deja data-g-key-focus`).toBe(true)
  expect(solid(b), `${scope}: → sin anillo ${JSON.stringify(b)}`).toBe(true)
  expect(await marked(page, scope), `${scope}: más de un radio marcado`).toBe(1)
  const prev = await without(page, ring)
  note('antes / después', `:focus-visible nativo ${b.fv}; anillo sin el atributo ${prev.style} ${prev.w}px ${prev.color} → con él ${b.style} ${b.w}px ${b.color}`)
  if (browserName === 'webkit' && !b.fv) expect(solid(prev), 'WebKit sin :focus-visible: el anillo ya salía sin el atributo').toBe(false)

  // Clic de ratón en otra opción: ni atributo ni anillo (WebKit no enfoca el radio con el clic; Chromium y Firefox sí)
  const box = await page.locator(clickBox).boundingBox()
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await frames(page)
  expect(await marked(page, scope), `${scope}: el clic deja data-g-key-focus`).toBe(0)
  const c = await page.evaluate(({ radios }) => {
    const e = document.activeElement
    return { radio: e.matches(radios), attr: e.hasAttribute('data-g-key-focus') }
  }, { radios })
  expect(c.attr).toBe(false)
  if (c.radio) expect(solid(await state(page, ring)), `${scope}: el clic pinta el anillo`).toBe(false)
  await page.mouse.move(2, 2)
}

test.describe('data-g-key-focus · anillo al navegar con flechas (auditoría de la pista, hallazgo 1)', () => {
  const GROUPS = [
    { id: 'rg-list', ring: RING.input },
    { id: 'rg-segmented', ring: RING.option },
    { id: 'rg-chip', ring: RING.option },
    { id: 'rg-card', ring: RING.option },
    { id: 'rg-icon', ring: RING.option }
  ]
  for (const g of GROUPS) {
    test(`GRadioGroup #${g.id}: Tab y → dejan el atributo y el anillo; el clic no`, async ({ page, browserName }) => {
      const errs = await watchConsole(page)
      await open(page, `#${g.id}`)
      // La opción que se pulsa: la última habilitada que no tenga el foco
      const last = await page.evaluate((id) => {
        const r = [...document.querySelectorAll(`#${id} .g-radio-group__input`)]
        return r.map((x, i) => (x.disabled ? -1 : i)).filter((i) => i >= 0).pop()
      }, g.id)
      await keyboardThenClick(page, browserName, {
        scope: `#${g.id}`,
        start: `#${g.id}`,
        ring: g.ring,
        radios: `#${g.id} .g-radio-group__input`,
        clickBox: `#${g.id} .g-radio-group__options > .g-radio-group__option:nth-child(${last + 1})`
      })
      // Un pointerdown sobre el grupo quita la marca del radio enfocado por teclado
      await before(page, `#${g.id}`)
      await page.keyboard.press(TAB(browserName))
      expect(await marked(page, `#${g.id}`)).toBe(1)
      const lb = await page.locator(`#${g.id} .g-radio-group__label`).boundingBox()
      await page.mouse.move(lb.x + 2, lb.y + lb.height / 2)
      await page.mouse.down()
      expect(await marked(page, `#${g.id}`)).toBe(0)
      await page.mouse.up()
      expect(errs).toEqual([])
    })
  }

  test('GCard selectType="radio": Tab y → dejan el atributo y el anillo de la tarjeta; el clic no', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page, '.g-card__select[name="cd-plan"]')
    await page.evaluate(() => document.querySelector('.g-card__select[name="cd-plan"]').closest('.g-card').parentElement.setAttribute('data-kf-scope', ''))
    const cards = await page.locator('.g-card:has(.g-card__select[name="cd-plan"])').count()
    expect(cards).toBeGreaterThan(1)
    await keyboardThenClick(page, browserName, {
      scope: '[data-kf-scope]',
      start: '.g-card:has(.g-card__select[name="cd-plan"])',
      ring: RING.card,
      radios: '.g-card__select[name="cd-plan"]',
      clickBox: `.g-card:has(.g-card__select[name="cd-plan"]) >> nth=${cards - 1}`
    })
    expect(errs).toEqual([])
  })

  test('GWidgetGallery, categorías: Tab y → dejan el atributo y el anillo del chip; el clic no', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page, '.wg-demo, #sec-widget, body')
    await still(page)
    await page.locator('button', { hasText: 'Añadir widget' }).first().click()
    await page.waitForSelector('.g-widget-gallery__cat > input')
    await frames(page, 6)
    // Desde la búsqueda (enfocada al abrir) con Tab hasta la primera categoría
    for (let i = 0; i < 6; i++) {
      if (await page.evaluate(() => document.activeElement.matches('.g-widget-gallery__cat > input'))) break
      await page.keyboard.press(TAB(browserName))
    }
    const st = await state(page, RING.chip)
    expect(st.radio, 'Tab no llega a una categoría').toBe(true)
    expect(st.attr).toBe(true)
    expect(solid(st), `categoría con Tab sin anillo ${JSON.stringify(st)}`).toBe(true)
    await page.keyboard.press('ArrowRight')
    await frames(page)
    const b = await state(page, RING.chip)
    expect(b.radio).toBe(true)
    expect(b.id, '→ no movió el foco').not.toBe(st.id)
    expect(b.attr).toBe(true)
    expect(solid(b), `categoría con → sin anillo ${JSON.stringify(b)}`).toBe(true)
    const prev = await without(page, RING.chip)
    test.info().annotations.push({ type: 'antes / después', description: `${browserName} galería: :focus-visible nativo ${b.fv}; anillo sin el atributo ${prev.style} ${prev.w}px ${prev.color} → con él ${b.style} ${b.w}px ${b.color}` })
    if (browserName === 'webkit' && !b.fv) expect(solid(prev)).toBe(false)
    const n = await page.locator('.g-widget-gallery__cat').count()
    const box = await page.locator('.g-widget-gallery__cat').nth(n - 1).boundingBox()
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await frames(page)
    expect(await marked(page, '.g-widget-gallery')).toBe(0)
    if (await page.evaluate(() => document.activeElement.matches('.g-widget-gallery__cat > input'))) expect(solid(await state(page, RING.chip))).toBe(false)
    expect(errs).toEqual([])
  })
})
