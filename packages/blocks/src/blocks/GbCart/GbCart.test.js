// GbCart (dueño: bruno): cart.md «Verificación propia» + la batería común de _comun.md §8 y §33.
import { describe, it, expect, afterEach, vi } from 'vitest'
// jsdom no implementa showModal/close (GbCart03 es un GDialog): se simulan con el contrato de GDialog.test.js
HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
HTMLDialogElement.prototype.close = function () {
  if (!this.hasAttribute('open')) return
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
}
import meta from './GbCart.meta.json'
import * as bank from './cart.bank.js'
import * as section from './props.js'
import GbCart01 from './GbCart01.vue'
import GbCart02 from './GbCart02.vue'
import GbCart03 from './GbCart03.vue'
import { sectionSuite } from '../bank/suite.js'

const variants = { GbCart01, GbCart02, GbCart03 }
// 03 cerrado (el banco) no pinta su contenido: sin encabezados; abierto, ver «GbCart03 · el cajón»
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbCart', headless: ['GbCart03'] })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

import { nextTick } from 'vue'
import { GBtn, GCard, GDialog, GEmpty, GNumberField, GProgress } from '@grana/vue'
import { GPrice, GPriceScope } from '@grana/vue/price'
import { mountBlock } from '../bank/harness.js'
import { mxn } from '../bank/ecommerce.js'

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbCart${n}]`) && t.includes(`(${code})`))
const LISTS = [['01', GbCart01], ['02', GbCart02]]
const tick = async () => { await nextTick(); await nextTick() }
const input = (w, name) => w.findAll('input').find((i) => i.element.closest('.g-number-field') && i.element.closest('li').textContent.includes(name))

describe('GbCart · la cantidad cambia por gesto (cart.md «Anatomía de una línea»)', () => {
  it('escribir no emite; Intro (el change de GNumberField) emite change una vez con la línea, la cantidad y event: null (#936)', async () => {
    for (const [, C] of LISTS) {
      const onChange = vi.fn()
      const { w } = run(C, { onChange }, { attachTo: document.body })
      const i = input(w, 'espadín')
      await i.trigger('focus')
      i.element.value = '3'
      await i.trigger('input')
      expect(onChange).not.toHaveBeenCalled()
      await i.trigger('keydown', { key: 'Enter' })
      expect(onChange).toHaveBeenCalledTimes(1)
      const p = onChange.mock.calls[0][0]
      expect(p.line).toBe(bank.props.lines[0])
      expect(p.quantity).toBe(3)
      expect(p.event).toBeNull()
      expect('event' in p).toBe(true)
      w.unmount()
    }
  })
  it('con la línea en busy, su cantidad y su «Quitar» quedan disabled', () => {
    const { w } = run(GbCart01, bank.states.ocupado)
    const nf = w.findAllComponents(GNumberField)
    expect(nf[0].props('disabled')).toBe(true)
    expect(nf[1].props('disabled')).toBe(false)
    const quitar = w.findAllComponents(GBtn).filter((b) => b.text() === 'Quitar')
    expect(quitar[0].props('disabled')).toBe(true)
  })
  it('el nombre del campo y de «Quitar» llevan el producto (2.4.6); el texto visible es «Quitar»', () => {
    const { w } = run(GbCart02)
    expect(w.findAllComponents(GNumberField)[0].props('label')).toBe(`Cantidad de ${bank.props.lines[0].product.name}`)
    const q = w.findAll('button').find((b) => b.text() === 'Quitar')
    expect(q.attributes('aria-label')).toBe(`Quitar ${bank.props.lines[0].product.name}`)
  })
})

describe('GbCart · quitar deja huella (§27 regla 3, #921)', () => {
  it('«Quitar» emite remove; al salir la línea, la huella queda en su índice con el foco en «Deshacer»; «Deshacer» emite restore; al volver, el foco a su cantidad', async () => {
    for (const [n, C] of LISTS) {
      const onRemove = vi.fn()
      const onRestore = vi.fn()
      const { w } = run(C, { onRemove, onRestore }, { attachTo: document.body })
      const lines = bank.props.lines
      await w.findAll('button').find((b) => b.attributes('aria-label') === `Quitar ${lines[0].product.name}`).trigger('click')
      expect(onRemove).toHaveBeenCalledTimes(1)
      expect(onRemove.mock.calls[0][0]).toMatchObject({ line: lines[0], index: 0 })
      await w.setProps({ lines: lines.slice(1) })
      await tick()
      const items = [...w.element.querySelectorAll('ul.g-stack > li')]
      expect(items[0].textContent, n).toContain(`Quitaste ${lines[0].product.name}`)
      expect(document.activeElement.textContent).toBe('Deshacer')
      document.activeElement.click()
      expect(onRestore.mock.calls[0][0]).toMatchObject({ line: lines[0], index: 0 })
      await w.setProps({ lines })
      await tick()
      expect(w.text()).not.toContain('Quitaste')
      expect(document.activeElement.closest('.g-number-field')).toBeTruthy()
      expect(document.activeElement.closest('li').textContent).toContain('espadín')
      w.unmount()
    }
  })
  it('cantidad 0 = quitar (remove, no change)', async () => {
    const onRemove = vi.fn()
    const onChange = vi.fn()
    const lines = bank.props.lines.map((l, i) => (i === 0 ? { ...l, min: 0 } : l))
    const { w } = run(GbCart01, { lines, onRemove, onChange }, { attachTo: document.body })
    const i = input(w, 'espadín')
    await i.trigger('focus')
    i.element.value = '0'
    await i.trigger('input')
    await i.trigger('keydown', { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
    expect(onRemove.mock.calls[0][0]).toMatchObject({ line: lines[0], index: 0 })
    expect(onRemove.mock.calls[0][0].event).toBeNull()
  })
  it('la huella se va cuando foco y puntero salen (no por tiempo); si la aplicación no quita la línea, no hay huella', async () => {
    vi.useFakeTimers()
    const { w } = run(GbCart02, {}, { attachTo: document.body })
    const lines = bank.props.lines
    await w.findAll('button').find((b) => b.attributes('aria-label') === `Quitar ${lines[1].product.name}`).trigger('click')
    await tick()
    expect(w.text()).not.toContain('Quitaste')
    await w.setProps({ lines: [lines[0], lines[2]] })
    await tick()
    vi.advanceTimersByTime(60000)
    await tick()
    const trace = [...w.element.querySelectorAll('ul.g-stack > li')][1]
    expect(trace.textContent).toContain('Quitaste')
    trace.dispatchEvent(new FocusEvent('focusout', { relatedTarget: document.body }))
    await tick()
    expect(w.text()).not.toContain('Quitaste')
    vi.useRealTimers()
  })
  it('sin escucha de restore, la huella sin «Deshacer» (CA3) y el foco en la huella', async () => {
    const { w, warnings } = run(GbCart01, { onRestore: undefined }, { attachTo: document.body })
    expect(own(warnings, '01', 'CA3')).toHaveLength(1)
    const lines = bank.props.lines
    await w.findAll('button').find((b) => b.attributes('aria-label') === `Quitar ${lines[0].product.name}`).trigger('click')
    await w.setProps({ lines: lines.slice(1) })
    await tick()
    expect(w.text()).toContain('Quitaste')
    expect(w.findAll('button').some((b) => b.text() === 'Deshacer')).toBe(false)
    expect(document.activeElement.tagName).toBe('LI')
  })
})

describe('GbCart · lo que no entra, el total y el umbral', () => {
  it('la línea no disponible: a la vista con su motivo, sin cantidad y solo «Quitar»; el resumen lo dice antes de pagar', () => {
    for (const [, C] of LISTS) {
      const { w } = run(C)
      const plato = [...w.element.querySelectorAll('ul.g-stack > li')].find((li) => li.textContent.includes('Plato'))
      expect(plato.textContent).toContain('Ya no queda')
      expect(plato.querySelector('.g-number-field')).toBeNull()
      expect([...plato.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Quitar'])
      const summary = w.element.querySelector('section.g-card')
      expect(summary.textContent).toContain('Un artículo ya no está disponible y no entra en tu pedido.')
      const text = summary.textContent
      expect(text.indexOf('no entra en tu pedido')).toBeLessThan(text.indexOf('Pagar'))
    }
  })
  it('el total es el de totals (uno que no es la suma se pinta tal cual), último par; lo incluido después; un solo GPriceScope', () => {
    const odd = { ...bank.props.totals, total: { value: mxn(1234), label: 'por 3 piezas' } }
    for (const [, C] of LISTS) {
      const { w } = run(C, { totals: odd })
      expect(w.findAllComponents(GPriceScope)).toHaveLength(1)
      const terms = [...w.element.querySelectorAll('.g-text > dl > div > dt')].map((d) => d.textContent)
      expect(terms).toEqual(['Subtotal', 'Envío', 'Total', 'Incluye IVA'])
      const totalPair = [...w.element.querySelectorAll('.g-text > dl > div')][2]
      expect(totalPair.textContent).toContain('1,234')
      expect(totalPair.textContent).toContain('por 3 piezas')
      expect([...w.element.querySelectorAll('.g-text > dl > div')][1].textContent).toContain('Se calcula en el siguiente paso')
    }
  })
  it('el umbral sin alcanzar: la frase y GProgress con su rol y la misma frase; alcanzado, solo la frase', () => {
    const { w } = run(GbCart01, bank.states.umbral)
    const p = w.findComponent(GProgress)
    expect(p.props('label')).toBe('Te faltan $1,220 para el envío gratis')
    expect(p.find('[role="progressbar"]').exists() || p.attributes('role') === 'progressbar').toBe(true)
    const reached = run(GbCart01)
    expect(reached.w.findComponent(GProgress).exists()).toBe(false)
    expect(reached.w.text()).toContain('Ya tienes el envío gratis')
  })
  it('la garantía en aria-describedby de «Pagar» (solid a lo ancho) y «Seguir comprando» outline', () => {
    const { w } = run(GbCart02)
    const btns = w.findAllComponents(GBtn).filter((b) => ['Pagar', 'Seguir comprando'].includes(b.text()))
    expect(btns.map((b) => [b.props('variant'), Boolean(b.props('block'))])).toEqual([['solid', true], ['outline', false]])
    const pagar = [...w.element.querySelectorAll('a.g-btn')].find((x) => x.textContent.includes('Pagar'))
    const id = pagar.getAttribute('aria-describedby')
    expect(w.element.querySelector(`[id="${id}"]`).textContent).toBe(bank.props.assurance)
  })
  it('vacío: GEmpty con la segunda acción; sin resumen ni «Pagar»', () => {
    for (const [, C] of LISTS) {
      const { w } = run(C, bank.states.vacio)
      expect(w.findComponent(GEmpty).props('title')).toBe('Tu carrito está vacío')
      expect(w.findAll('.g-btn').map((b) => b.text())).toEqual(['Seguir comprando'])
    }
  })
  it('la línea con su total: GPrice A · la cuenta (unitario c/u y el total por N piezas); la elección en meta', () => {
    const { w } = run(GbCart01)
    const prices = w.findAllComponents(GPrice).filter((p) => p.element.closest('ul.g-stack'))
    expect(prices[0].props('total')).toEqual({ value: mxn(1780), label: 'por 2 piezas' })
    expect(prices[0].props('unit')).toBe('c/u')
    const rebozo = [...w.element.querySelectorAll('ul.g-stack > li')][1]
    expect(rebozo.querySelector('dl').textContent).toContain('Color')
    expect(rebozo.querySelector('dl').textContent).toContain('Grana')
    expect(rebozo.textContent).toContain('Precio de lista')
  })
})

describe('GbCart03 · el cajón', () => {
  it('GDialog placement end, sm, pantalla completa en el teléfono, from y closeLabel; v-model:open', async () => {
    const onOpen = vi.fn()
    const { w } = run(GbCart03, { open: true, from: 'abrir-carrito', 'onUpdate:open': onOpen }, { attachTo: document.body })
    const d = w.findComponent(GDialog)
    expect(d.props()).toMatchObject({ placement: 'end', size: 'sm', mobile: 'fullscreen', from: 'abrir-carrito', closeLabel: 'Cerrar el carrito', title: 'Tu carrito', modelValue: true })
    d.vm.$emit('update:modelValue', false)
    expect(onOpen).toHaveBeenCalledWith(false)
  })
  it('las líneas sin foto y el resumen solo con el total (y lo que falta por calcular)', async () => {
    const { w } = run(GbCart03, { open: true }, { attachTo: document.body })
    await tick()
    expect(w.element.querySelector('.g-card__media')).toBeNull()
    const terms = [...document.querySelectorAll('[data-gb="cart-03"] .g-text > dl > div > dt')].map((d) => d.textContent)
    expect(terms).toEqual(['Envío', 'Total'])
  })
  it('abierto: el título del cajón es el h2 y lo de dentro, h3', async () => {
    const { w } = run(GbCart03, { open: true }, { attachTo: document.body })
    await tick()
    const hs = [...document.querySelectorAll('[data-gb="cart-03"] h2, [data-gb="cart-03"] h3, [data-gb="cart-03"] h4')].map((x) => x.tagName)
    expect(hs[0]).toBe('H2')
    expect(hs.slice(1).every((t) => t === 'H3')).toBe(true)
    expect(hs.length).toBeGreaterThan(2)
    w.unmount()
  })
})

describe('GbCart · avisos propios', () => {
  it('CA1 cantidad fuera de min/max; CA2 total sin label; EC5 sin id; EC1 sin prices; una vez', () => {
    const lines = bank.props.lines.map((l, i) => (i === 0 ? { ...l, quantity: 9 } : i === 1 ? { ...l, id: undefined } : l))
    const totals = { ...bank.props.totals, total: { value: mxn(1) } }
    const { warnings } = run(GbCart02, { lines, totals, prices: undefined })
    for (const code of ['CA1', 'CA2', 'EC5', 'EC1']) expect(own(warnings, '02', code), code).toHaveLength(1)
  })
})

describe('GbCart · el nombre del producto entero (EC-B1)', () => {
  it('las líneas de 01, 02 y 03 llevan titleLines="none"', async () => {
    for (const [n, C] of [...LISTS, ['03', GbCart03]]) {
      const { w } = run(C, n === '03' ? { open: true } : {}, { attachTo: document.body })
      await nextTick()
      const lines = w.findAllComponents(GCard).filter((c) => c.props('as') === 'li')
      expect(lines.length, n).toBeGreaterThan(0)
      for (const c of lines) expect(c.props('titleLines'), n).toBe('none')
      w.unmount()
    }
  })
})

describe('GbCart01 · dos regiones con GSplit (§40, #950, CR-L1)', () => {
  it('GSplit 3:2 lg: las líneas en start, el resumen en end, en ese orden y sin pistas de GAdaptiveLayout', () => {
    const { w } = run(GbCart01)
    expect(w.find('.g-adaptive-layout').exists()).toBe(false)
    expect(w.find('[class*="g-adapt-"]').exists()).toBe(false)
    const split = w.find('.g-split')
    expect(split.classes()).toEqual(expect.arrayContaining(['g-split--ratio-3-2', 'g-split--collapse-md', 'g-split--gap-lg']))
    const [start, end, ...rest] = split.element.children
    expect(rest).toHaveLength(0)
    expect(start.classList.contains('g-split__region--start')).toBe(true)
    expect(end.classList.contains('g-split__region--end')).toBe(true)
    expect(start.querySelector('ul')).not.toBeNull()
    expect(end.querySelector('ul')).toBeNull()
    expect(end.textContent).toContain('Pagar')
    expect(split.attributes('style')).toBeUndefined()
  })
  it('02 y 03 no usan GSplit (una columna y cajón)', () => {
    expect(run(GbCart02).w.find('.g-split').exists()).toBe(false)
  })
})
