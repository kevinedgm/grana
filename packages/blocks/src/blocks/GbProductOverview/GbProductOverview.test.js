// GbProductOverview (dueño: bruno): product-overview.md «Verificación propia» + la batería común de _comun.md §8 y §33.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h, nextTick } from 'vue'
import meta from './GbProductOverview.meta.json'
import * as bank from './product-overview.bank.js'
import * as section from './props.js'
import GbProductOverview01 from './GbProductOverview01.vue'
import GbProductOverview02 from './GbProductOverview02.vue'
import GbProductOverview03 from './GbProductOverview03.vue'
import { sectionSuite } from '../bank/suite.js'
import { mountBlock } from '../bank/harness.js'
import { GAccordion, GBtn, GNumberField, GRadioGroup, GTabs } from '@grana/vue'
import { GGallery } from '@grana/vue/gallery'
import { GPrice, GPriceScope } from '@grana/vue/price'

const variants = { GbProductOverview01, GbProductOverview02, GbProductOverview03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbProductOverview' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const ALL = Object.entries(variants).map(([k, C]) => [k.slice(-2), C])
const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, attachTo: document.body, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbProductOverview${n}]`) && t.includes(`(${code})`))
const group = (w, key) => w.findAllComponents(GRadioGroup).find((g) => g.props('label') === (key === 'talla' ? 'Talla' : 'Color'))
const radio = (w, key, label) => [...group(w, key).element.querySelectorAll('input[type="radio"]')].find((r) => r.closest('label').textContent.trim().startsWith(label))
const pick = async (w, key, label) => { const r = radio(w, key, label); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); await nextTick() }
const addBtn = (w) => w.findAll('button.g-btn').find((b) => /Añadi/.test(b.text()))

describe('GbProductOverview · nada preelegido y nunca a ciegas (#918, §27 regla 3)', () => {
  it('sin selection ningún valor viene elegido; una opción de un solo valor se elige sola', async () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      for (const g of w.findAllComponents(GRadioGroup)) expect(g.props('modelValue')).toBeNull()
      w.unmount()
    }
    const one = { ...bank.props.product, options: [bank.props.product.options[0], { key: 'color', label: 'Color', values: [{ value: 'natural', label: 'Natural' }] }] }
    const { w } = run(GbProductOverview01, { product: one })
    expect(group(w, 'color').props('modelValue')).toBe('natural')
    expect(group(w, 'talla').props('modelValue')).toBeNull()
  })
  it('«Añadir» sin talla no emite, pone el error en Talla y enfoca su primer radio', async () => {
    for (const [, C] of ALL) {
      const onAdd = vi.fn()
      const { w } = run(C, { onAdd })
      await addBtn(w).trigger('click')
      await nextTick()
      expect(onAdd).not.toHaveBeenCalled()
      expect(group(w, 'talla').props('error')).toBe('Elige Talla')
      expect(document.activeElement).toBe(radio(w, 'talla', 'CH'))
      w.unmount()
    }
  })
  it('con todo elegido emite add con la variante, la selección, las opciones dichas y la cantidad exactas', async () => {
    for (const [, C] of ALL) {
      const onAdd = vi.fn()
      const { w } = run(C, { onAdd, quantity: 2 })
      await pick(w, 'talla', 'M')
      await pick(w, 'color', 'Grana')
      expect(group(w, 'talla').props('error')).toBeUndefined()
      await addBtn(w).trigger('click')
      expect(onAdd).toHaveBeenCalledTimes(1)
      const x = onAdd.mock.calls[0][0]
      expect(x.event).toBeInstanceOf(Event)
      expect(x.product).toBe(bank.props.product)
      expect(x.variant.id).toBe('huipil-m-grana')
      expect(x.selection).toEqual({ talla: 'm', color: 'grana' })
      expect(x.options).toEqual([{ key: 'talla', label: 'Talla', value: 'M' }, { key: 'color', label: 'Color', value: 'Grana' }])
      expect(x.quantity).toBe(2)
      w.unmount()
    }
  })
  it('busy: el botón se carga con labels.busy y no emite', async () => {
    const onAdd = vi.fn()
    const { w } = run(GbProductOverview01, { onAdd, busy: true, selection: { talla: 'm', color: 'natural' } })
    expect(addBtn(w).attributes('aria-busy')).toBe('true')
    await addBtn(w).trigger('click')
    expect(onAdd).not.toHaveBeenCalled()
  })
})

describe('GbProductOverview · preguntas sin name fuera de un formulario (#934, PO-L2)', () => {
  it('dos paneles del mismo producto en una página: elegir en uno no desmarca el otro', async () => {
    const { w } = mountBlock(GbProductOverview01, { props: bank.props, slots: bank.slots, attachTo: document.body, wrap: (render) => h('div', [render(), h(GbProductOverview03, bank.props, bank.slots)]) })
    const [a, b] = w.findAllComponents(GbProductOverview01).concat(w.findAllComponents(GbProductOverview03))
    const names = (x) => [...x.element.querySelectorAll('input[type="radio"]')].map((r) => r.name)
    for (const n of names(a)) expect(names(b)).not.toContain(n)
    expect(names(a).some((n) => n === 'talla' || n === 'color')).toBe(false)
    await pick(a, 'talla', 'M')
    await pick(b, 'talla', 'CH')
    expect(radio(a, 'talla', 'M').checked).toBe(true)
    expect(radio(b, 'talla', 'CH').checked).toBe(true)
    expect(group(a, 'talla').props('modelValue')).toBe('m')
    expect(group(b, 'talla').props('modelValue')).toBe('ch')
  })
})

describe('GbProductOverview · la foto, el precio y las existencias siguen a la elección', () => {
  it('elegir Grana pone index en su primera foto sin mover el foco; update:selection y select con su carga', async () => {
    for (const [, C] of ALL) {
      const onSel = vi.fn()
      const onSelect = vi.fn()
      const { w } = run(C, { 'onUpdate:selection': onSel, onSelect })
      const before = document.activeElement
      await pick(w, 'color', 'Grana')
      expect(w.findComponent(GGallery).props('index')).toBe(3)
      expect(document.activeElement).toBe(before)
      expect(onSel).toHaveBeenLastCalledWith({ color: 'grana' })
      expect(onSelect).toHaveBeenCalledTimes(1)
      expect(onSelect.mock.calls[0][0]).toMatchObject({ product: bank.props.product, key: 'color', value: 'grana', variant: null })
      expect(onSelect.mock.calls[0][0].event).toBeInstanceOf(Event)
      w.unmount()
    }
  })
  it('G se queda deshabilitada con «agotada» al elegir Natural y vuelve al elegir Grana', async () => {
    const { w } = run(GbProductOverview01)
    await pick(w, 'color', 'Natural')
    let g = group(w, 'talla').props('options').find((o) => o.value === 'g')
    expect(g).toMatchObject({ label: 'G, agotada', disabled: true })
    // CH y EG sí tienen Natural
    expect(group(w, 'talla').props('options').find((o) => o.value === 'ch').disabled).toBe(false)
    await pick(w, 'color', 'Grana')
    g = group(w, 'talla').props('options').find((o) => o.value === 'g')
    expect(g).toMatchObject({ label: 'G', disabled: false })
    // En Grana no hay CH ni EG: se ven, con su motivo, y no se eligen
    expect(group(w, 'talla').props('options').find((o) => o.value === 'eg')).toMatchObject({ label: 'EG, agotada', disabled: true })
  })
  it('el precio es el de la variante y max de GNumberField el de la variante', async () => {
    const { w } = run(GbProductOverview02, { selection: { talla: 'm', color: 'grana' } })
    expect(w.findComponent(GPrice).props('value')).toEqual({ amount: 3400, currency: 'MXN' })
    expect(w.findComponent(GNumberField).props('max')).toBe(2)
    expect(w.findComponent(GNumberField).props('min')).toBe(1)
    const x = run(GbProductOverview02)
    expect(x.w.findComponent(GPrice).props('value')).toEqual({ amount: 3200, currency: 'MXN' })
    expect(x.w.findComponent(GPrice).props('lead')).toBe('desde')
    expect(x.w.findComponent(GNumberField).props('max')).toBeUndefined()
  })
  it('una combinación sin existencias: sin botón y el motivo en texto (el valor elegido no se deshabilita)', () => {
    const { w } = run(GbProductOverview01, { selection: { talla: 'g', color: 'natural' } })
    expect(addBtn(w)).toBeUndefined()
    expect(w.text()).toContain(bank.props.labels.unavailable)
    expect(group(w, 'talla').props('options').find((o) => o.value === 'g')).toMatchObject({ label: 'G, agotada', disabled: false })
    expect(w.findComponent(GNumberField).exists()).toBe(false)
  })
  it('un solo GPriceScope alrededor del precio; ningún precio fuera de GPrice', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      expect(w.findAllComponents(GPriceScope)).toHaveLength(1)
      expect(w.findAllComponents(GPrice)).toHaveLength(1)
      w.unmount()
    }
  })
  it('update:quantity al cambiar la cantidad', async () => {
    const onQ = vi.fn()
    const { w } = run(GbProductOverview01, { 'onUpdate:quantity': onQ })
    w.findComponent(GNumberField).vm.$emit('update:modelValue', 3)
    expect(onQ).toHaveBeenCalledWith(3)
  })
})

describe('GbProductOverview · texto largo, encabezados y enlaces', () => {
  it('01 y 02 con GAccordion; 03 con GTabs y su contenido en panel-{id}', () => {
    for (const C of [GbProductOverview01, GbProductOverview02]) {
      const { w } = run(C)
      expect(w.findComponent(GAccordion).exists()).toBe(true)
      expect(w.findComponent(GTabs).exists()).toBe(false)
      expect(w.find('#cuidados').exists()).toBe(true)
      w.unmount()
    }
    const { w } = run(GbProductOverview03)
    const tabs = w.findComponent(GTabs)
    expect(tabs.props('label')).toBe('Sobre el huipil')
    expect(tabs.props('items').map((t) => t.id)).toEqual(['details', 'facts', 'cuidados', 'envio'])
    expect(w.find('dl').exists()).toBe(true)
  })
  it('el nombre es el h2 de la sección y la galería va un nivel por debajo', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      expect(w.find('h2').text()).toBe(bank.props.product.name)
      expect(w.findComponent(GGallery).props('headingLevel')).toBe(3)
      w.unmount()
    }
  })
  it('el enlace a las opiniones emite navigate con item = product.reviews', async () => {
    const onNavigate = vi.fn((p) => p.event.preventDefault())
    const { w } = run(GbProductOverview01, { onNavigate })
    const a = w.findAll('a.g-btn').find((x) => x.text() === 'Leer las opiniones')
    a.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(onNavigate.mock.calls[0][0]).toMatchObject({ href: '#opiniones', item: bank.props.product.reviews })
  })
  it('la calificación es texto', () => {
    const { w } = run(GbProductOverview01)
    expect(w.text()).toMatch(/4\.6 de 5 · 128 opiniones/)
  })
})

describe('GbProductOverview · avisos propios (una vez por instancia)', () => {
  it('PO1 sin fotos (sin galería), PO2 un valor que no está, PO3 cantidad fuera de rango, EC4 variante mal formada', () => {
    const product = { ...bank.props.product, photos: [], variants: [...bank.props.product.variants, { id: 'x', options: { talla: 'm' } }] }
    const { w, warnings } = run(GbProductOverview02, { product, selection: { talla: 'xl', color: 'grana' }, quantity: 9 })
    expect(w.findComponent(GGallery).exists()).toBe(false)
    expect(own(warnings, '02', 'PO1')).toHaveLength(1)
    expect(own(warnings, '02', 'PO2')).toHaveLength(1)
    expect(own(warnings, '02', 'EC4')).toHaveLength(1)
    const q = run(GbProductOverview02, { selection: { talla: 'm', color: 'grana' }, quantity: 9 })
    expect(own(q.warnings, '02', 'PO3')).toHaveLength(1)
  })
  it('C5 sin labels.add ni labels.tabs (03)', () => {
    const { add, tabs, ...labels } = bank.props.labels
    const { warnings } = run(GbProductOverview03, { labels })
    expect(own(warnings, '03', 'C5').some((t) => t.includes('labels.add'))).toBe(true)
    expect(own(warnings, '03', 'C5').some((t) => t.includes('labels.tabs'))).toBe(true)
  })
})
