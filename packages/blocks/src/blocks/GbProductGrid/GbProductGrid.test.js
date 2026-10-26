// GbProductGrid (dueño: bruno): product-grid.md «Verificación propia» + la batería común de _comun.md §8 y §33.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h, nextTick } from 'vue'
import meta from './GbProductGrid.meta.json'
import * as bank from './product-grid.bank.js'
import * as section from './props.js'
import GbProductGrid01 from './GbProductGrid01.vue'
import GbProductGrid02 from './GbProductGrid02.vue'
import GbProductGrid03 from './GbProductGrid03.vue'
import GbProductCard01 from '../GbProductCard/GbProductCard01.vue'
import { sectionSuite } from '../bank/suite.js'
import { mountBlock } from '../bank/harness.js'
import { GCard, GEmpty, GPagination, GSection, GSelect } from '@grana/vue'
import { GTag, GTagGroup } from '@grana/vue/tag'
import { GLoadRegion } from '@grana/vue/load-region'
import { GPriceScope } from '@grana/vue/price'

const variants = { GbProductGrid01, GbProductGrid02, GbProductGrid03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbProductGrid' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const ALL = Object.entries(variants).map(([k, C]) => [k.slice(-2), C])
const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, attachTo: document.body, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbProductGrid${n}]`) && t.includes(`(${code})`))
const tag = (w, text) => w.findAllComponents(GTag).find((t) => t.props('label').startsWith(text))
const names = (w) => w.findAll('.g-card__title').map((t) => t.text())

describe('GbProductGrid · facetas de alternar (#916)', () => {
  it('cada valor dice su cuenta; el elegido está pulsado; EG (count 0, no elegido) a la vista y deshabilitado', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      expect(tag(w, 'Barro') === undefined).toBe(true)
      expect(tag(w, 'Grana cochinilla').props('label')).toBe('Grana cochinilla · 12')
      expect(tag(w, 'Grana cochinilla').props('pressed')).toBe(true)
      expect(tag(w, 'Añil').props('pressed')).toBe(false)
      expect(tag(w, 'EG').props('disabled')).toBe(true)
      expect(tag(w, 'EG').exists()).toBe(true)
      w.unmount()
    }
  })
  it('alternar emite un objeto NUEVO y no muta filters; «Quitar filtros» vacía', async () => {
    for (const [, C] of ALL) {
      const filters = { tinte: ['grana'] }
      const frozen = JSON.stringify(filters)
      const onF = vi.fn()
      const { w } = run(C, { filters, 'onUpdate:filters': onF })
      const group = w.findAllComponents(GTagGroup).find((g) => g.props('items').some((i) => i.label.startsWith('Añil')))
      const item = group.props('items').find((i) => i.label.startsWith('Añil'))
      group.vm.$emit('toggle', { item: { ...item, pressed: true }, pressed: true })
      expect(onF).toHaveBeenLastCalledWith({ tinte: ['grana', 'anil'] })
      expect(onF.mock.calls[0][0]).not.toBe(filters)
      expect(onF.mock.calls[0][0].tinte).not.toBe(filters.tinte)
      expect(JSON.stringify(filters)).toBe(frozen)
      await nextTick()
      await w.findAll('button.g-btn').find((b) => b.text() === 'Quitar filtros').trigger('click')
      expect(onF).toHaveBeenLastCalledWith({})
      w.unmount()
    }
  })
  it('sin v-model el bloque guarda su copia (la faceta queda pulsada)', async () => {
    const { w } = run(GbProductGrid01, { filters: undefined })
    const group = w.findComponent(GTagGroup)
    const item = group.props('items').find((i) => i.label.startsWith('Lana'))
    group.vm.$emit('toggle', { item, pressed: true })
    await nextTick()
    expect(tag(w, 'Lana').props('pressed')).toBe(true)
  })
  it('01 y 03 en un GTagGroup facets con el nombre del grupo; 02 en un GAccordion con lo elegido en palabras', () => {
    for (const C of [GbProductGrid01, GbProductGrid03]) {
      const { w } = run(C)
      const g = w.findComponent(GTagGroup)
      expect(g.props('layout')).toBe('facets')
      expect(g.props('label')).toBe('Filtrar')
      w.unmount()
    }
    const { w } = run(GbProductGrid02)
    expect(w.find('[role="group"][aria-label="Filtrar"]').exists()).toBe(true)
    expect(w.findAllComponents(GTagGroup)).toHaveLength(3)
    expect(w.text()).toContain('Grana cochinilla')
  })
})

describe('GbProductGrid · resultados', () => {
  it('ningún producto se filtra ni ordena: salen en el orden de la aplicación', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      expect(names(w)).toEqual(bank.PRODUCTS.map((p) => p.name))
      w.unmount()
    }
  })
  it('un solo GPriceScope alrededor de los resultados; la tarjeta es la de E1 (mismo DOM)', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      expect(w.findAllComponents(GPriceScope)).toHaveLength(1)
      w.unmount()
    }
    const { w } = run(GbProductGrid01)
    const card = mountBlock(GbProductCard01, { props: { product: bank.PRODUCTS[2], prices: bank.props.prices, labels: bank.LABELS.card, locale: 'es-MX' }, wrap: (render) => h(GSection, { title: 'Textiles' }, render) })
    const strip = (s) => s.replace(/\s(id|aria-labelledby|aria-describedby|data-g-key)="[^"]*"/g, '').replace(/ data-gb="[^"]*"/g, '').replace(/<!---->/g, '')
    expect(strip(w.findAll('article.g-card')[2].element.outerHTML)).toBe(strip(card.w.find('article.g-card').element.outerHTML))
  })
  it('la cuenta con total; el orden con GSelect y update:sort; la paginación con update:page sin mover el foco', async () => {
    const onSort = vi.fn()
    const onPage = vi.fn()
    const { w } = run(GbProductGrid03, { 'onUpdate:sort': onSort, 'onUpdate:page': onPage })
    expect(w.text()).toContain('32 productos')
    const sel = w.findComponent(GSelect)
    expect(sel.props('label')).toBe('Ordenar por')
    expect(sel.props('modelValue')).toBe('nuevo')
    sel.vm.$emit('update:modelValue', 'precio-asc')
    expect(onSort).toHaveBeenCalledWith('precio-asc')
    const pag = w.findComponent(GPagination)
    expect(pag.props()).toMatchObject({ page: 1, total: 32, pageSize: 12 })
    const before = document.activeElement
    pag.vm.$emit('update:page', 2)
    await nextTick()
    expect(onPage).toHaveBeenCalledWith(2)
    expect(document.activeElement).toBe(before)
  })
  it('03 son renglones (ul › li con la tarjeta horizontal); 02 tarjetas compactas con acción rápida', () => {
    const r = run(GbProductGrid03)
    expect(r.w.find('ul.g-stack > li article, ul.g-stack > li .g-card').exists()).toBe(true)
    const c = run(GbProductGrid02)
    expect(c.w.findAllComponents(GCard).filter((x) => x.props('density') === 'compact').length).toBe(bank.PRODUCTS.length)
  })
  it('add, open y navigate de la tarjeta, reemitidos', async () => {
    const onAdd = vi.fn()
    const onOpen = vi.fn()
    const { w } = run(GbProductGrid02, { onAdd, onOpen })
    await w.findAll('button.g-btn').find((b) => b.text() === 'Elegir opciones').trigger('click')
    expect(onOpen.mock.calls[0][0].product).toBe(bank.PRODUCTS[0])
    await w.findAll('button.g-btn').find((b) => b.text() === 'Añadir al carrito').trigger('click')
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd.mock.calls[0][0]).toMatchObject({ variant: null, selection: {}, options: [], quantity: 1 })
  })
  it('GLoadRegion con la página, keyBy id, refresh keep, nombre = título; la primera carga es el molde de sample', () => {
    const { w } = run(GbProductGrid01)
    expect(w.findComponent(GLoadRegion).props()).toMatchObject({ keyBy: 'id', refresh: 'keep', label: 'Textiles', loading: false })
    const x = run(GbProductGrid01, bank.states.carga)
    expect(x.w.findComponent(GLoadRegion).props('items')).toBeNull()
    expect(x.w.findComponent(GLoadRegion).props('sample')).toHaveLength(3)
  })
  it('retry de la región, reemitido', () => {
    const onRetry = vi.fn()
    const { w } = run(GbProductGrid01, { onRetry, error: true })
    w.findComponent(GLoadRegion).vm.$emit('retry')
    expect(onRetry).toHaveBeenCalledWith({ event: null })
  })
})

describe('GbProductGrid · vacíos', () => {
  it('sin filtros: GEmpty cause none con labels.empty', () => {
    const { w } = run(GbProductGrid01, bank.states.vacio)
    const e = w.findComponent(GEmpty)
    expect(e.props()).toMatchObject({ cause: 'none', title: bank.LABELS.empty.title })
  })
  it('por filtros: cause filtered, un filtro por valor elegido con su cuenta y total; relax quita ese valor; clear todos', () => {
    for (const [, C] of ALL) {
      const onF = vi.fn()
      const { w } = run(C, { ...bank.states.filtrado, 'onUpdate:filters': onF })
      const e = w.findComponent(GEmpty)
      expect(e.props('cause')).toBe('filtered')
      expect(e.props('title')).toBe(bank.LABELS.emptyFiltered.title)
      expect(e.props('filters').map((f) => [f.label, f.count])).toEqual([['Grana cochinilla', 12], ['G', 4]])
      e.vm.$emit('relax', e.props('filters')[1].key)
      expect(onF).toHaveBeenLastCalledWith({ tinte: ['grana'] })
      e.vm.$emit('clear')
      expect(onF).toHaveBeenLastCalledWith({})
      w.unmount()
    }
  })
  it('el slot empty sustituye al vacío ({ filtered })', () => {
    const { w } = run(GbProductGrid01, bank.states.filtrado, { slots: { empty: ({ filtered }) => `vacío propio ${filtered}` } })
    expect(w.text()).toContain('vacío propio true')
    expect(w.findComponent(GEmpty).exists()).toBe(false)
  })
})

describe('GbProductGrid · avisos propios (una vez por instancia)', () => {
  it('PG1 valor fuera de facets, PG2 sort fuera de sorts, PG3 total menor que la página, EC1 sin prices, C7 más de 48', () => {
    const many = Array.from({ length: 49 }, (_, i) => ({ id: `p${i}`, name: `P ${i}`, price: { value: { amount: 10, currency: 'MXN' } } }))
    const { w, warnings } = run(GbProductGrid02, { filters: { tinte: ['oro'] }, sort: 'raro', total: 3, prices: undefined, products: many })
    for (const code of ['PG1', 'PG2', 'PG3', 'EC1', 'C7']) expect(own(warnings, '02', code), code).toHaveLength(1)
    expect(w.findComponent(GSelect).props('modelValue')).toBeNull()
  })
  it('labels.facetOption (#935): la plantilla manda el orden, la función recibe etiqueta y cuenta, la cuenta con Intl', () => {
    const big = [{ key: 'tinte', label: 'Tinte', options: [{ value: 'grana', label: 'Grana', count: 1240 }] }]
    let { w, warnings } = run(GbProductGrid01, { facets: big, filters: {}, labels: { ...bank.LABELS, facetOption: '{count} — {label}' } })
    expect(tag(w, '1,240').props('label')).toBe('1,240 — Grana')
    expect(own(warnings, '01', 'PG4')).toHaveLength(0)
    w.unmount()
    ;({ w } = run(GbProductGrid01, { facets: big, filters: {}, labels: { ...bank.LABELS, facetOption: (label, count) => `${label} (${count})` } }))
    expect(tag(w, 'Grana').props('label')).toBe('Grana (1240)')
    w.unmount()
  })
  it('PG4 facetOption sin {label} y C5 sin facetOption: la etiqueta sola, sin separador del bloque', () => {
    let { w, warnings } = run(GbProductGrid01, { labels: { ...bank.LABELS, facetOption: '{count}' } })
    expect(own(warnings, '01', 'PG4')).toHaveLength(1)
    expect(tag(w, 'Grana cochinilla').props('label')).toBe('Grana cochinilla')
    w.unmount()
    const { facetOption, ...labels } = bank.LABELS
    ;({ w, warnings } = run(GbProductGrid01, { labels }))
    expect(own(warnings, '01', 'C5').some((t) => t.includes('labels.facetOption'))).toBe(true)
    expect(tag(w, 'Grana cochinilla').props('label')).toBe('Grana cochinilla')
    expect(w.findAllComponents(GTag).some((t) => t.props('label').includes(' · '))).toBe(false)
  })
  it('C5 sin labels.count', () => {
    const { count, ...labels } = bank.LABELS
    const { warnings } = run(GbProductGrid01, { labels })
    expect(own(warnings, '01', 'C5').some((t) => t.includes('labels.count'))).toBe(true)
  })
})
