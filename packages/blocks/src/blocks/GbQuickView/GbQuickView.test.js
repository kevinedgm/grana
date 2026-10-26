// GbQuickView (dueño: bruno): quick-view.md «Verificación propia» + la batería común de _comun.md §8 y §33.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'

// jsdom no implementa showModal/close: se simulan con el contrato de GDialog.test.js (atributo open y evento close)
HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
HTMLDialogElement.prototype.close = function () {
  if (!this.hasAttribute('open')) return
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
}

import meta from './GbQuickView.meta.json'
import * as bank from './quick-view.bank.js'
import * as section from './props.js'
import GbQuickView01 from './GbQuickView01.vue'
import GbQuickView02 from './GbQuickView02.vue'
import GbQuickView03 from './GbQuickView03.vue'
import GbProductOverview02 from '../GbProductOverview/GbProductOverview02.vue'
import { sectionSuite } from '../bank/suite.js'
import { UTILITY, mountBlock, ownAnchor } from '../bank/harness.js'
import { GDialog, GRadioGroup } from '@grana/vue'
import { GGallery } from '@grana/vue/gallery'

const variants = { GbQuickView01, GbQuickView02, GbQuickView03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbQuickView', dialogs: Object.keys(variants) })
beforeEach(() => { document.body.innerHTML = '<button id="qv-disparador" type="button">Ver huipil</button>' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const ALL = Object.entries(variants).map(([k, C]) => [k.slice(-2), C])
const flush = async () => { await nextTick(); await nextTick() }
const run = async (C, props = {}, extra = {}) => { const r = mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, attachTo: document.body, ...extra }); await flush(); return r }
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbQuickView${n}]`) && t.includes(`(${code})`))
const group = (w, label) => w.findAllComponents(GRadioGroup).find((g) => g.props('label') === label)
const radio = (w, label, value) => [...group(w, label).element.querySelectorAll('input[type="radio"]')].find((r) => r.closest('label').textContent.trim().startsWith(value))
const pick = async (w, label, value) => { const r = radio(w, label, value); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); await nextTick() }
const addBtn = (w) => w.findAll('button.g-btn').find((b) => /Añadir al carrito/.test(b.text()))
// El DOM del panel sin los ids generados (useId difiere entre instancias) ni `g-input--block`: GDialog cierra el contexto de
// formulario (provide(layoutKey, null)), así que el ancho del campo de cantidad depende de dónde está el panel, no del bloque
const norm = (el) => el.outerHTML.replace(/\s(id|for|aria-labelledby|aria-describedby|aria-controls|name)="[^"]*"/g, '').replace(/ g-input--block/g, '').replace(/<!---->/g, '')

describe('GbQuickView · el banco abierto, ya pintado', () => {
  for (const [n, C] of ALL) {
    it(`${n}: ningún aviso tras abrir; sin utilidades ni <a> ajenos; el diálogo se llama como el producto`, async () => {
      const { w, warnings } = await run(C)
      expect(warnings).toEqual([])
      const dlg = w.find('dialog')
      expect(dlg.attributes('data-gb')).toBe(`quick-view-${n}`)
      expect(dlg.attributes('open')).toBeDefined()
      expect(w.find('h2').text()).toBe(bank.props.product.name)
      for (const el of w.element.querySelectorAll('[class]')) expect(el.getAttribute('class')).not.toMatch(UTILITY)
      for (const a of w.element.querySelectorAll('a')) expect(ownAnchor(a), a.outerHTML.slice(0, 120)).toBe(true)
    })
  }
})

describe('GbQuickView · el panel es el de Product overview (#919)', () => {
  it('mismo DOM del panel con el mismo producto (01 frente a GbProductOverview02, sin la ficha completa)', async () => {
    const qv = await run(GbQuickView01, { product: { ...bank.props.product, href: undefined } })
    const po = mountBlock(GbProductOverview02, { props: { ...bank.props, product: { ...bank.props.product, href: undefined }, open: undefined, from: undefined }, attachTo: document.body })
    const panel = (w) => w.findComponent(GRadioGroup).element.closest('.g-stack')
    expect(norm(panel(qv.w))).toBe(norm(panel(po.w)))
  })
  it('add y select con las cargas de E4; sin cierre automático tras add', async () => {
    for (const [, C] of ALL) {
      const onAdd = vi.fn()
      const onSelect = vi.fn()
      const onOpen = vi.fn()
      const { w } = await run(C, { onAdd, onSelect, 'onUpdate:open': onOpen })
      await pick(w, 'Talla', 'M')
      await pick(w, 'Color', 'Natural')
      expect(onSelect).toHaveBeenCalledTimes(2)
      expect(onSelect.mock.calls[1][0]).toMatchObject({ key: 'color', value: 'natural', product: bank.props.product })
      expect(onSelect.mock.calls[1][0].variant.id).toBe('huipil-m-natural')
      await addBtn(w).trigger('click')
      expect(onAdd).toHaveBeenCalledTimes(1)
      expect(onAdd.mock.calls[0][0]).toMatchObject({ product: bank.props.product, selection: { talla: 'm', color: 'natural' }, options: [{ key: 'talla', label: 'Talla', value: 'M' }, { key: 'color', label: 'Color', value: 'Natural' }], quantity: 1 })
      await flush()
      expect(onOpen).not.toHaveBeenCalled()
      expect(w.find('dialog').attributes('open')).toBeDefined()
      w.unmount()
    }
  })
  it('«Añadir» sin talla no emite y enfoca la talla', async () => {
    const onAdd = vi.fn()
    const { w } = await run(GbQuickView03, { onAdd })
    await addBtn(w).trigger('click')
    expect(onAdd).not.toHaveBeenCalled()
    expect(group(w, 'Talla').props('error')).toBe('Elige Talla')
    expect(document.activeElement).toBe(radio(w, 'Talla', 'CH'))
  })
})

describe('GbQuickView · la superficie', () => {
  it('cerrar emite update:open false (y sin v-model el bloque se cierra igual)', async () => {
    const onOpen = vi.fn()
    const { w } = await run(GbQuickView01, { 'onUpdate:open': onOpen })
    w.findComponent(GDialog).vm.$emit('update:modelValue', false)
    expect(onOpen).toHaveBeenCalledWith(false)
    const x = await run(GbQuickView02, { open: undefined })
    expect(x.w.findComponent(GDialog).props('modelValue')).toBe(false)
  })
  it('from va tal cual a GDialog; el id de la aplicación es el del diálogo', async () => {
    const { w } = await run(GbQuickView02, {}, { attrs: { id: 'vista' } })
    expect(w.findComponent(GDialog).props('from')).toBe('qv-disparador')
    expect(w.find('dialog').attributes('id')).toBe('vista')
  })
  it('las formas: 01 hoja inferior, 02 al borde final y pantalla completa en el teléfono, 03 pequeño', async () => {
    const forms = { '01': { size: 'lg', mobile: 'sheet', placement: 'center' }, '02': { size: 'md', mobile: 'fullscreen', placement: 'end' }, '03': { size: 'sm', mobile: 'sheet', placement: 'center' } }
    for (const [n, C] of ALL) {
      const { w } = await run(C)
      expect(w.findComponent(GDialog).props()).toMatchObject(forms[n])
      w.unmount()
    }
  })
  it('la galería va un nivel por debajo del título del diálogo (h3); 03 sin galería', async () => {
    for (const C of [GbQuickView01, GbQuickView02]) {
      const { w } = await run(C)
      expect(w.findComponent(GGallery).props('headingLevel')).toBe(3)
      w.unmount()
    }
    const { w } = await run(GbQuickView03)
    expect(w.findComponent(GGallery).exists()).toBe(false)
  })
  it('03: la portada decorativa sigue al color elegido', async () => {
    const { w } = await run(GbQuickView03)
    const img = () => w.find('.g-card img')
    expect(img().attributes('src')).toBe(bank.props.product.photos[0].src)
    expect(img().attributes('alt')).toBe('')
    await pick(w, 'Color', 'Grana')
    await flush()
    expect(img().attributes('src')).toBe(bank.props.product.photos[3].src)
  })
  it('la ficha completa emite navigate con item = product; sin href no hay enlace', async () => {
    const onNavigate = vi.fn((p) => p.event.preventDefault())
    const { w } = await run(GbQuickView01, { onNavigate })
    const a = w.findAll('a.g-btn').find((x) => x.text() === 'Ver la ficha completa')
    a.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
    expect(onNavigate.mock.calls[0][0]).toMatchObject({ href: bank.props.product.href, item: bank.props.product })
    const x = await run(GbQuickView01, { product: { ...bank.props.product, href: undefined } })
    expect(x.w.findAll('a.g-btn').some((y) => y.text() === 'Ver la ficha completa')).toBe(false)
  })
})

describe('GbQuickView · avisos propios', () => {
  it('QV1 abierto sin from y sin disparador enfocado (una vez); con el disparador enfocado, no', async () => {
    const { warnings } = await run(GbQuickView01, { from: undefined })
    expect(own(warnings, '01', 'QV1')).toHaveLength(1)
    document.getElementById('qv-disparador').focus()
    const x = await run(GbQuickView01, { from: undefined })
    expect(own(x.warnings, '01', 'QV1')).toHaveLength(0)
  })
  it('C5 sin labels.close', async () => {
    const { close, ...labels } = bank.props.labels
    const { warnings } = await run(GbQuickView02, { labels })
    expect(own(warnings, '02', 'C5').some((t) => t.includes('labels.close'))).toBe(true)
  })
})
