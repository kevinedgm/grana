// GbProductCard (dueño: bruno): product-card.md «Verificación propia» + la batería común de _comun.md §8 y §33.
import { describe, it, expect, afterEach, vi } from 'vitest'
import meta from './GbProductCard.meta.json'
import * as bank from './product-card.bank.js'
import * as section from './props.js'
import GbProductCard01 from './GbProductCard01.vue'
import GbProductCard02 from './GbProductCard02.vue'
import GbProductCard03 from './GbProductCard03.vue'
import { sectionSuite } from '../bank/suite.js'

const variants = { GbProductCard01, GbProductCard02, GbProductCard03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbProductCard' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

import { GBtn, GCard, GSection } from '@grana/vue'
import { GPrice, GPriceScope } from '@grana/vue/price'
import { h } from 'vue'
import { click, mountBlock } from '../bank/harness.js'
import { CARD_LABELS, PRICES, PRODUCTS } from '../bank/ecommerce.js'

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbProductCard${n}]`) && t.includes(`(${code})`))
const ALL = Object.entries(variants).map(([k, C]) => [k.slice(-2), C])
const EN = { ...CARD_LABELS, rating: '{average} out of {max} · {count} reviews', noReviews: 'No reviews yet' }

describe('GbProductCard · una sola acción principal (#915)', () => {
  it('la tarjeta es la principal (enlace con href, botón sin él) y ningún GBtn solid', () => {
    for (const [, C] of ALL) {
      for (const p of Object.values(PRODUCTS)) {
        const { w } = run(C, { product: p })
        for (const b of w.findAllComponents(GBtn)) expect(b.props('variant')).not.toBe('solid')
        expect(w.findComponent(GCard).props('interaction')).toBe(p.href ? 'link' : 'button')
      }
    }
  })
  it('la tarjeta-botón (sin href) emite open con el producto entero', async () => {
    for (const [, C] of ALL) {
      const onOpen = vi.fn()
      const { w } = run(C, { onOpen })
      await w.find('button.g-card__primary').trigger('click')
      expect(onOpen).toHaveBeenCalledTimes(1)
      expect(onOpen.mock.calls[0][0].product).toBe(bank.props.product)
      expect(onOpen.mock.calls[0][0].event).toBeInstanceOf(Event)
    }
  })
  it('navigate con clic primario en la tarjeta-enlace; no con Ctrl, ⌘ ni con el producto externo', () => {
    const onNavigate = vi.fn((p) => p.event.preventDefault())
    const { w } = run(GbProductCard01, { product: PRODUCTS.espadin, onNavigate }, { attachTo: document.body })
    const a = w.find('a.g-card__primary').element
    a.dispatchEvent(click({ ctrlKey: true }))
    a.dispatchEvent(click({ metaKey: true }))
    expect(onNavigate).not.toHaveBeenCalled()
    a.dispatchEvent(click())
    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(onNavigate.mock.calls[0][0]).toMatchObject({ href: PRODUCTS.espadin.href, item: PRODUCTS.espadin })
    const ext = vi.fn()
    const x = run(GbProductCard01, { product: PRODUCTS.chocolate, onNavigate: ext }, { attachTo: document.body })
    const ea = x.w.find('a.g-card__primary')
    expect(ea.attributes('target')).toBe('_blank')
    expect(ea.text()).toContain(PRODUCTS.chocolate.name)
    expect(x.w.find('.g-card__title [aria-label], .g-card__title [role="img"]').exists() || ea.html().includes(CARD_LABELS.external)).toBe(true)
    ea.element.dispatchEvent(click())
    expect(ext).not.toHaveBeenCalled()
  })
})

describe('GbProductCard03 · la acción rápida nunca añade a ciegas (§27 regla 3)', () => {
  it('con opciones obligatorias dice «Elegir opciones» y emite open', async () => {
    const onOpen = vi.fn()
    const onAdd = vi.fn()
    const { w } = run(GbProductCard03, { onOpen, onAdd })
    const btn = w.findAllComponents(GBtn)
    expect(btn).toHaveLength(1)
    expect(btn[0].text()).toBe(CARD_LABELS.choose)
    expect(btn[0].props('variant')).toBe('outline')
    await w.find('button.g-btn').trigger('click')
    expect(onAdd).not.toHaveBeenCalled()
    expect(onOpen.mock.calls[0][0].product).toBe(bank.props.product)
  })
  it('sin opciones dice «Añadir al carrito» y emite add con la carga exacta', async () => {
    const onAdd = vi.fn()
    const { w } = run(GbProductCard03, { product: PRODUCTS.jarro, onAdd })
    const btn = w.findComponent(GBtn)
    expect(btn.text()).toBe(CARD_LABELS.add)
    await w.find('button.g-btn').trigger('click')
    const p = onAdd.mock.calls[0][0]
    expect(Object.keys(p).sort()).toEqual(['event', 'options', 'product', 'quantity', 'selection', 'variant'])
    expect(p).toMatchObject({ product: PRODUCTS.jarro, variant: null, selection: {}, options: [], quantity: 1 })
  })
  it('una opción con required: false no obliga a elegir', () => {
    const p = { ...PRODUCTS.huipil, options: PRODUCTS.huipil.options.map((o) => ({ ...o, required: false })) }
    expect(run(GbProductCard03, { product: p }).w.findComponent(GBtn).text()).toBe(CARD_LABELS.add)
  })
  it('sin labels.choose y con opciones: EC3 una vez y sin acción', () => {
    const { w, warnings } = run(GbProductCard03, { labels: { ...CARD_LABELS, choose: undefined } })
    expect(w.findAllComponents(GBtn)).toHaveLength(0)
    expect(own(warnings, '03', 'EC3')).toHaveLength(1)
  })
  it('busy: el botón «Añadir» con loading y labels.busy', () => {
    const { w } = run(GbProductCard03, { product: PRODUCTS.jarro, busy: true })
    expect(w.findComponent(GBtn).props()).toMatchObject({ loading: true, loadingText: CARD_LABELS.busy })
  })
  it('01 y 02 no pintan acción rápida', () => {
    for (const C of [GbProductCard01, GbProductCard02]) expect(run(C, { product: PRODUCTS.jarro }).w.findAllComponents(GBtn)).toHaveLength(0)
  })
})

describe('GbProductCard · lo no disponible se dice (§27 regla 1)', () => {
  it('con su motivo en el cuerpo, el precio a la vista, sin acción rápida y la tarjeta sigue siendo enlace', () => {
    for (const [, C] of ALL) {
      const { w } = run(C, { product: PRODUCTS.plato })
      expect(w.text()).toContain('Vuelve el 2 de diciembre')
      expect(w.findComponent(GPrice).exists()).toBe(true)
      expect(w.findAllComponents(GBtn)).toHaveLength(0)
      expect(w.find('a.g-card__primary').exists()).toBe(true)
    }
    const { w } = run(GbProductCard03, { product: { ...PRODUCTS.jarro, available: false } })
    expect(w.text()).toContain(CARD_LABELS.unavailable)
  })
})

describe('GbProductCard · la calificación en palabras (#912)', () => {
  it('texto con Intl y la cuenta: «4,7 de 5 · 58 opiniones» (es), «4.7 de 5» (es-MX), «4.7 out of 5 · 58 reviews» (en-US)', () => {
    expect(run(GbProductCard01, { locale: 'es' }).w.text()).toContain('4,7 de 5 · 58 opiniones')
    expect(run(GbProductCard01, { locale: 'es-MX' }).w.text()).toContain('4.7 de 5 · 58 opiniones')
    expect(run(GbProductCard01, { locale: 'en-US', labels: EN }).w.text()).toContain('4.7 out of 5 · 58 reviews')
    // Agrupación de la cuenta
    expect(run(GbProductCard01, { locale: 'es-MX', product: { ...PRODUCTS.espadin, rating: { average: 4.8, count: 1312 } } }).w.text()).toContain('4.8 de 5 · 1,312 opiniones')
  })
  it('count 0 dice labels.noReviews, nunca «0 de 5»; nunca un img ni un icono', () => {
    const { w } = run(GbProductCard02, { product: PRODUCTS.jarro })
    expect(w.text()).toContain(CARD_LABELS.noReviews)
    expect(w.text()).not.toMatch(/0 de 5/)
    const rating = w.findAll('.g-text').find((t) => t.text() === CARD_LABELS.noReviews)
    expect(rating.find('img, svg, [role="img"]').exists()).toBe(false)
  })
  it('EC2: average fuera de 0..max o sin count no se pinta', () => {
    for (const rating of [{ average: 6, count: 3 }, { average: 4 }, { average: 4, count: 2.5 }]) {
      const { w, warnings } = run(GbProductCard01, { product: { ...PRODUCTS.espadin, rating } })
      expect(own(warnings, '01', 'EC2')).toHaveLength(1)
      expect(w.text()).not.toMatch(/ de 5/)
    }
  })
})

describe('GbProductCard · precio (C de price.md) y región', () => {
  it('GPrice recibe el PriceSpec tal cual (compareAt + compareLabel) y la referencia se pinta nombrada', () => {
    const { w } = run(GbProductCard01, { product: PRODUCTS.tobala })
    const price = w.findComponent(GPrice)
    expect(price.props('value')).toEqual(PRODUCTS.tobala.price.value)
    expect(price.props('compareAt')).toEqual(PRODUCTS.tobala.price.compareAt)
    expect(price.props('compareLabel')).toBe('Precio de lista')
    expect(w.text()).toContain('Precio de lista')
  })
  it('una referencia sin nombre (sin compareLabel ni labels.price.before) no se pinta', () => {
    const { w } = run(GbProductCard01, { product: { ...PRODUCTS.tobala, price: { value: PRODUCTS.tobala.price.value, compareAt: PRODUCTS.tobala.price.compareAt } }, labels: { ...CARD_LABELS, price: { ...CARD_LABELS.price, before: undefined } } })
    expect(w.find('.g-price__compare').exists()).toBe(false)
  })
  it('con prices, la raíz es UNA GPriceScope con la tarjeta dentro; sin prices, la tarjeta article es la raíz', () => {
    for (const [n, C] of ALL) {
      const a = run(C)
      expect(a.w.findAllComponents(GPriceScope)).toHaveLength(1)
      expect(a.w.element.getAttribute('data-gb')).toBe(`product-card-${n}`)
      expect(a.w.element.tagName).toBe('DIV')
      const b = run(C, { prices: undefined })
      expect(b.w.findAllComponents(GPriceScope)).toHaveLength(0)
      expect(b.w.element.tagName).toBe('ARTICLE')
      expect(b.w.element.getAttribute('data-gb')).toBe(`product-card-${n}`)
      expect(b.warnings.filter((t) => t.includes('(EC1)'))).toEqual([])
    }
  })
})

describe('GbProductCard · forma, idioma y avisos', () => {
  it('lang en el título (y en la descripción de 02), no en la raíz', () => {
    for (const [, C] of ALL) {
      const { w } = run(C, { product: PRODUCTS.chocolate, prices: undefined })
      expect(w.element.hasAttribute('lang')).toBe(false)
      expect(w.find('.g-card__title [lang="en"]').text()).toBe(PRODUCTS.chocolate.name)
    }
    expect(run(GbProductCard02, { product: PRODUCTS.chocolate }).w.find('.g-card__description [lang="en"]').exists()).toBe(true)
  })
  it('facts: dos en 01, hasta cuatro en 02, ninguno en 03; 03 ignora summary y optionsSummary', () => {
    const facts = (C) => run(C, { product: PRODUCTS.espadin }).w.findComponent(GCard).props('meta').length
    expect([facts(GbProductCard01), facts(GbProductCard02), facts(GbProductCard03)]).toEqual([2, 4, 0])
    const c3 = run(GbProductCard03).w.findComponent(GCard)
    expect(c3.props('subtitle')).toBeFalsy()
    expect(c3.props('description')).toBeFalsy()
    expect(run(GbProductCard02).w.findComponent(GCard).props('description')).toBe(PRODUCTS.huipil.summary)
  })
  it('badge en texto (neutral) y título al nivel del sitio: h2 suelta, h3 dentro de una GSection', () => {
    const { w } = run(GbProductCard01)
    expect(w.findComponent(GCard).props()).toMatchObject({ badge: 'Últimas 3 piezas', badgeColor: 'neutral', headingLevel: 2 })
    const nested = run(GbProductCard01, {}, { wrap: (r) => h(GSection, { title: 'Relacionados' }, r) })
    expect(nested.w.findComponent(GCard).props('headingLevel')).toBe(3)
  })
  it('C2 sin price: no se pinta nada; EC5 sin id; PC1 sin fotos en 01 y 02 (no en 03)', () => {
    const a = run(GbProductCard01, { product: { id: 'x', name: 'X' } })
    expect(a.w.find('[data-gb]').exists()).toBe(false)
    expect(own(a.warnings, '01', 'C2')).toHaveLength(1)
    const b = run(GbProductCard01, { product: { name: 'X', price: { value: null } } })
    expect(own(b.warnings, '01', 'EC5')).toHaveLength(1)
    for (const n of ['01', '02']) expect(own(run(variants[`GbProductCard${n}`], { product: PRODUCTS.minimo }).warnings, n, 'PC1')).toHaveLength(1)
    expect(run(GbProductCard03, { product: PRODUCTS.minimo }).warnings).toEqual([])
  })
  it('slots product y media con { product }', () => {
    const { w } = run(GbProductCard01, {}, { slots: { product: ({ product }) => h('em', { class: 'x-slot' }, product.id), media: ({ product }) => h('picture', { class: 'x-pic' }, product.id) } })
    expect(w.find('.x-slot').text()).toBe(PRODUCTS.huipil.id)
    expect(w.find('.x-pic').exists()).toBe(true)
  })
  it('las mismas props en las tres: el banco es una sola interfaz con PRICES de la tienda', () => {
    expect(bank.props.prices).toBe(PRICES)
  })
})
