// GbCategoryPreviews (dueño: bruno): category-previews.md «Verificación propia» + la batería común de _comun.md §8 y §33.
import { describe, it, expect, afterEach, vi } from 'vitest'
import meta from './GbCategoryPreviews.meta.json'
import * as bank from './category-previews.bank.js'
import * as section from './props.js'
import GbCategoryPreviews01 from './GbCategoryPreviews01.vue'
import GbCategoryPreviews02 from './GbCategoryPreviews02.vue'
import GbCategoryPreviews03 from './GbCategoryPreviews03.vue'
import { sectionSuite } from '../bank/suite.js'

const variants = { GbCategoryPreviews01, GbCategoryPreviews02, GbCategoryPreviews03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbCategoryPreviews' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

import { GBtn, GCard } from '@grana/vue'
import { click, mountBlock } from '../bank/harness.js'

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbCategoryPreviews${n}]`) && t.includes(`(${code})`))
const ALL = Object.entries(variants).map(([k, C]) => [k.slice(-2), C])
const cats = bank.props.categories
const cardOf = (w, id) => w.findAllComponents(GCard).find((c) => c.props('title') === cats.find((x) => x.id === id).name)

describe('GbCategoryPreviews · las puertas (#917)', () => {
  it('lista real: un elemento por categoría', () => {
    for (const [n, C] of ALL) {
      const { w } = run(C)
      const items = n === '03' ? w.findAll('ul > li') : w.findAll('[role="list"] > [role="listitem"]')
      expect(items).toHaveLength(cats.length)
    }
  })
  it('la cuenta con Intl va en el nombre del enlace («Mezcal · 18 piezas», «1,240» en es-MX)', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      expect(cardOf(w, 'mezcal').find('a.g-card__primary').text()).toBe('Mezcal · 18 piezas')
      expect(cardOf(w, 'gifts').find('a.g-card__primary').text()).toBe('Gifts · 1,240 piezas')
      // Sin count no se sabe: enlace sin cuenta
      expect(cardOf(w, 'cocina').find('a.g-card__primary').text()).toBe('Cocina oaxaqueña')
    }
    expect(run(GbCategoryPreviews01, { locale: 'de' }).w.text()).toContain('Gifts · 1.240 piezas')
    expect(run(GbCategoryPreviews01, { labels: { ...bank.props.labels, count: (n) => `${n} pieces` } }).w.text()).toContain('Mezcal · 18 pieces')
  })
  it('count 0: sin enlace, con labels.empty en el lugar de la cuenta', () => {
    for (const [, C] of ALL) {
      const card = cardOf(run(C).w, 'barro-verde')
      expect(card.props('interaction')).toBe('none')
      expect(card.find('a').exists()).toBe(false)
      expect(card.find('.g-card__title').text()).toBe('Barro verde · Vuelve pronto')
    }
  })
  it('lang en el título; externa con target _blank, su marca con nombre y sin navigate', () => {
    const onNavigate = vi.fn()
    const { w } = run(GbCategoryPreviews01, { onNavigate }, { attachTo: document.body })
    expect(cardOf(w, 'gifts').find('.g-card__title [lang="en"]').text()).toBe('Gifts')
    const ext = cardOf(w, 'mercado').find('a.g-card__primary')
    expect(ext.attributes('target')).toBe('_blank')
    expect(ext.find('[aria-label="se abre en otra pestaña"], svg[aria-label]').exists() || ext.html().includes('se abre en otra pestaña')).toBe(true)
    ext.element.dispatchEvent(click())
    expect(onNavigate).not.toHaveBeenCalled()
  })
  it('navigate con clic primario (item = la categoría); no con Ctrl', () => {
    const onNavigate = vi.fn((p) => p.event.preventDefault())
    const { w } = run(GbCategoryPreviews03, { onNavigate }, { attachTo: document.body })
    const a = cardOf(w, 'textiles').find('a.g-card__primary').element
    a.dispatchEvent(click({ ctrlKey: true }))
    expect(onNavigate).not.toHaveBeenCalled()
    a.dispatchEvent(click())
    expect(onNavigate.mock.calls[0][0]).toMatchObject({ href: '/tienda/textiles', item: cats[1] })
  })
  it('formas: 01 foto arriba, 02 foto de fondo y sin descripción, 03 sin media', () => {
    const c1 = run(GbCategoryPreviews01).w
    expect(cardOf(c1, 'mezcal').props('mediaPosition')).toBe('top')
    const c2 = run(GbCategoryPreviews02).w
    expect(cardOf(c2, 'mezcal').props()).toMatchObject({ mediaPosition: 'background', density: 'compact' })
    expect(cardOf(c2, 'textiles').find('.g-card__description').exists()).toBe(false)
    const c3 = run(GbCategoryPreviews03).w
    expect(c3.find('img').exists()).toBe(false)
    expect(cardOf(c3, 'textiles').find('.g-card__description').exists()).toBe(true)
  })
  it('la acción de la sección es secundaria (outline) y la única', () => {
    for (const [, C] of ALL) {
      const btns = run(C).w.findAllComponents(GBtn)
      expect(btns).toHaveLength(1)
      expect(btns[0].props('variant')).toBe('outline')
      expect(btns[0].text()).toBe('Ver toda la tienda')
    }
  })
  it('avisos: CP1 sin media en 01 y 02 (no en 03), C5 sin labels.count/empty, C7 con más de 12, C1 vacía', () => {
    const noMedia = cats.map(({ media, ...c }) => c)
    for (const n of ['01', '02']) expect(own(run(variants[`GbCategoryPreviews${n}`], { categories: noMedia }).warnings, n, 'CP1')).toHaveLength(cats.length)
    expect(own(run(GbCategoryPreviews03, { categories: noMedia }).warnings, '03', 'CP1')).toHaveLength(0)
    const a = run(GbCategoryPreviews03, { labels: {} })
    expect(own(a.warnings, '03', 'C5')).toHaveLength(3)
    expect(a.w.text()).not.toContain('piezas')
    const many = Array.from({ length: 13 }, (_, i) => ({ id: `c${i}`, name: `C${i}`, href: `/c${i}` }))
    expect(own(run(GbCategoryPreviews03, { categories: many }).warnings, '03', 'C7')).toHaveLength(1)
    const empty = run(GbCategoryPreviews03, { categories: [] })
    expect(empty.w.find('[data-gb]').exists()).toBe(false)
    expect(own(empty.warnings, '03', 'C1')).toHaveLength(1)
  })
})

describe('GbCategoryPreviews 02 · el título con su dato entero (EC-B1, EC-B3)', () => {
  it('titleLines="none" en sus tarjetas y la pista g-adapt-standard', () => {
    const { w } = run(GbCategoryPreviews02)
    const cards = w.findAllComponents(GCard)
    expect(cards.length).toBeGreaterThan(0)
    for (const c of cards) expect(c.props('titleLines')).toBe('none')
    for (const li of w.findAll('[role="listitem"]')) expect(li.classes()).toEqual(['g-adapt-standard'])
  })
})
