// GbCheckout (dueño: bruno): checkout.md «Verificación propia» + la batería común de _comun.md §8 y §33.
import { describe, it, expect, afterEach, vi } from 'vitest'
import meta from './GbCheckout.meta.json'
import * as bank from './checkout.bank.js'
import * as section from './props.js'
import GbCheckout01 from './GbCheckout01.vue'
import GbCheckout02 from './GbCheckout02.vue'
import GbCheckout03 from './GbCheckout03.vue'
import { sectionSuite } from '../bank/suite.js'

const variants = { GbCheckout01, GbCheckout02, GbCheckout03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbCheckout' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { GFormActions, GFormSection, GRadioGroup, GSummary } from '@grana/vue'
import { GPrice, GPriceScope } from '@grana/vue/price'
import { mountBlock } from '../bank/harness.js'
import { ORDER } from '../bank/ecommerce.js'

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbCheckout${n}]`) && t.includes(`(${code})`))
const ALL = Object.entries(variants)
const settle = async () => { await flushPromises(); await nextTick(); await flushPromises() }
const type = async (w, name, value) => {
  const el = w.find(`[name="${name}"]`)
  el.element.value = value
  await el.trigger('input')
}
const send = async (w) => { await w.find('form').trigger('submit'); await settle() }
const CONTACT = { email: 'ana@example.com', tel: '9511234567' }

describe('GbCheckout · un paso a la vez, cancelable (checkout.md «Anatomía»)', () => {
  it('un paso con errores no emite y enfoca el primero', async () => {
    for (const [n, C] of ALL) {
      const onSubmit = vi.fn()
      const { w } = run(C, { onSubmit }, { attachTo: document.body })
      await send(w)
      expect(onSubmit, n).not.toHaveBeenCalled()
      expect(document.activeElement && document.activeElement.getAttribute('name'), n).toBe('email')
      w.unmount()
    }
  })
  it('un paso válido emite submit con su carga exacta, avanza (update:step) y enfoca el primer control del paso nuevo', async () => {
    for (const [n, C] of ALL) {
      const onSubmit = vi.fn()
      const onStep = vi.fn()
      const { w } = run(C, { onSubmit, 'onUpdate:step': onStep }, { attachTo: document.body })
      await type(w, 'email', CONTACT.email)
      await type(w, 'tel', CONTACT.tel)
      await send(w)
      expect(onSubmit, n).toHaveBeenCalledTimes(1)
      const p = onSubmit.mock.calls[0][0]
      expect(p.step).toBe('contacto')
      expect(p.final).toBe(false)
      expect(p.values).toMatchObject(CONTACT)
      expect(p.consents).toEqual({ condiciones: false })
      expect(p.data).toBeInstanceOf(FormData)
      expect(typeof p.preventDefault).toBe('function')
      expect(p.defaultPrevented).toBe(false)
      expect(onStep).toHaveBeenLastCalledWith('envio')
      await settle()
      expect(document.activeElement.getAttribute('name'), n).toBe('calle')
      w.unmount()
    }
  })
  it('con preventDefault() no avanza hasta que la aplicación cambia step; entonces enfoca el primer control', async () => {
    const onStep = vi.fn()
    const onSubmit = vi.fn((p) => p.preventDefault())
    const { w } = run(GbCheckout01, { onSubmit, 'onUpdate:step': onStep, step: 'contacto', values: CONTACT }, { attachTo: document.body })
    await send(w)
    expect(onSubmit.mock.calls[0][0].defaultPrevented).toBe(true)
    expect(onStep).not.toHaveBeenCalled()
    await w.setProps({ step: 'envio' })
    await settle()
    expect(document.activeElement.getAttribute('name')).toBe('calle')
  })
  it('los pasos ocultos van montados en el FormData (01, 03) y en 02 los posteriores al actual están inert', async () => {
    const onSubmit = vi.fn()
    const { w } = run(GbCheckout01, { onSubmit, values: { ...CONTACT, calle: 'Macedonio Alcalá 202' } }, { attachTo: document.body })
    await send(w)
    expect(onSubmit.mock.calls[0][0].data.get('calle')).toBe('Macedonio Alcalá 202')
    const two = run(GbCheckout02).w
    const inert = [...two.element.querySelectorAll('[inert]')].filter((x) => !x.closest('.g-form-section__panel') || x.parentElement.tagName === 'FORM')
    expect(inert.length).toBe(3)
  })
})

describe('GbCheckout · volver no borra (§27 regla 3)', () => {
  it('«Atrás» (01, 03) y «Cambiar» conservan lo escrito; el resumen del paso hecho dice las respuestas (el choice con su etiqueta)', async () => {
    const values = { ...CONTACT, calle: 'Macedonio Alcalá 202', cp: '68000', ciudad: 'Oaxaca de Juárez', estado: 'Oaxaca', forma: 'estandar' }
    for (const [n, C] of ALL) {
      const onStep = vi.fn()
      const { w } = run(C, { step: 'pago', values, 'onUpdate:step': onStep }, { attachTo: document.body })
      const summaries = w.findAllComponents(GSummary)
      if (n !== 'GbCheckout02') {
        const envio = summaries.find((s) => s.props('title') === 'Envío')
        expect(envio.props('facts')).toContainEqual({ label: 'Forma de envío', value: 'Estándar' })
        expect(envio.props('facts')).toContainEqual({ label: 'Calle y número', value: 'Macedonio Alcalá 202' })
      } else {
        const sec = w.findAllComponents(GFormSection).find((s) => s.props('title') === 'Envío')
        expect(sec.props('summary')).toContain('Estándar')
        expect(sec.props('summary')).toContain('Macedonio Alcalá 202')
      }
      const cambiar = w.findAll('button').find((b) => b.text() === 'Cambiar Envío')
      await cambiar.trigger('click')
      expect(onStep).toHaveBeenLastCalledWith('envio')
      expect(w.find('[name="calle"]').element.value).toBe('Macedonio Alcalá 202')
      if (n !== 'GbCheckout02') {
        await w.setProps({ step: 'envio' })
        const atras = w.findAll('button').find((b) => b.text() === 'Atrás')
        await atras.trigger('click')
        expect(onStep).toHaveBeenLastCalledWith('contacto')
        expect(w.find('[name="email"]').element.value).toBe(CONTACT.email)
      }
      w.unmount()
    }
  })
})

describe('GbCheckout · el pago es de la aplicación (EC6) y el total va junto al botón', () => {
  it('el slot step-pago se pinta en su paso y el bloque no lo lee', async () => {
    const slot = vi.fn(() => 'PASARELA')
    const { w } = run(GbCheckout01, { step: 'pago' }, { slots: { 'step-pago': slot } })
    expect(w.text()).toContain('PASARELA')
    expect(slot.mock.calls[0][0].step.id).toBe('pago')
  })
  it('un campo cc-number o card* no se pinta (EC6, una vez)', () => {
    const steps = [{ ...bank.STEPS[0], fields: [...bank.STEPS[0].fields, { name: 'tarjeta', label: 'Tarjeta', autocomplete: 'cc-number' }, { name: 'cardCvc', label: 'CVC' }] }, ...bank.STEPS.slice(1)]
    const { w, warnings } = run(GbCheckout01, { steps })
    expect(w.find('[name="tarjeta"]').exists()).toBe(false)
    expect(w.find('[name="cardCvc"]').exists()).toBe(false)
    expect(own(warnings, '01', 'EC6')).toHaveLength(2)
  })
  it('el total del pie es order.totals.total, en el status de GFormActions (sticky en 03), dentro del único GPriceScope', () => {
    for (const [n, C] of ALL) {
      const { w } = run(C)
      expect(w.findAllComponents(GPriceScope)).toHaveLength(1)
      const fa = w.findComponent(GFormActions)
      expect(fa.props('sticky'), n).toBe(n === 'GbCheckout03')
      const price = fa.findComponent(GPrice)
      expect(price.props('value')).toEqual(ORDER.totals.total.value)
      expect(fa.text()).toContain('Total')
    }
  })
  it('el precio de cada forma de envío está en el nombre del radio (slot option); la deshabilitada dice su motivo', () => {
    const { w } = run(GbCheckout03, { step: 'envio' })
    const rg = w.findComponent(GRadioGroup)
    expect(rg.props('appearance')).toBe('card')
    const labels = [...w.element.querySelectorAll('.g-radio-group__option-label')].map((x) => x.textContent)
    expect(labels[0]).toMatch(/Estándar.*de 3 a 5 días.*99 pesos mexicanos/)
    expect(labels[2]).toMatch(/Gratis/)
    expect(labels[3]).toContain('No llega a tu código postal')
    expect(rg.props('options')[3].disabled).toBe(true)
  })
})

describe('GbCheckout · errores de la aplicación', () => {
  it('un error del servidor en un campo de otro paso lleva a ese paso', async () => {
    const onStep = vi.fn()
    const { w } = run(GbCheckout01, { step: 'pago', values: bank.states.servidor.values, 'onUpdate:step': onStep }, { attachTo: document.body })
    await w.setProps({ errors: { cp: 'Ese código postal no existe en Oaxaca' } })
    await settle()
    expect(onStep).toHaveBeenLastCalledWith('envio')
    expect(w.text()).toContain('Ese código postal no existe en Oaxaca')
  })
})

describe('GbCheckout · un paso que empieza por un choice (#940, CK-L1)', () => {
  it('al avanzar, el foco no cae en body: se queda en el formulario (el botón del paso sigue montado)', async () => {
    for (const [n, C] of ALL) {
      const forma = bank.STEPS[1].fields.find((f) => f.type === 'choice')
      const steps = [bank.STEPS[0], { id: 'forma', title: 'Forma de envío', fields: [forma], action: 'Continuar' }, bank.STEPS[3]]
      const onStep = vi.fn()
      const { w } = run(C, { steps, 'onUpdate:step': onStep }, { attachTo: document.body })
      await type(w, 'email', CONTACT.email)
      await type(w, 'tel', CONTACT.tel)
      const submitter = [...w.element.querySelectorAll('button[type="submit"]')].find((b) => b.textContent.includes('Continuar al envío'))
      submitter.focus()
      await send(w)
      expect(onStep, n).toHaveBeenLastCalledWith('forma')
      expect(w.findAllComponents(GRadioGroup).some((g) => g.props('label') === 'Forma de envío'), n).toBe(true)
      expect(document.activeElement, n).not.toBe(document.body)
      expect(w.element.contains(document.activeElement), n).toBe(true)
      w.unmount()
    }
  })
})

describe('GbCheckout · avisos propios', () => {
  it('CK1 sin slot del paso de la aplicación; CK2 sin escucha de submit; CK3 step fuera de steps; una vez', () => {
    const a = run(GbCheckout02, { onSubmit: undefined, step: 'nada' }, { slots: {} })
    expect(own(a.warnings, '02', 'CK1')).toHaveLength(1)
    expect(own(a.warnings, '02', 'CK2')).toHaveLength(1)
    expect(own(a.warnings, '02', 'CK3')).toHaveLength(1)
  })
  it('CK4 (#938): un name de un grupo que no está en los fields del paso se ignora y avisa una vez; un campo sin grupo va después de los grupos', async () => {
    const steps = bank.STEPS.map((s) => (s.id === 'envio' ? { ...s, groups: [{ id: 'direccion', title: 'Dirección', fields: ['calle', 'colonia', 'cp', 'ciudad', 'estado', 'calle2'] }] } : s))
    const { w, warnings } = run(GbCheckout03, { steps, step: 'envio' }, { attachTo: document.body })
    await settle()
    expect(own(warnings, '03', 'CK4')).toHaveLength(1)
    expect(own(warnings, '03', 'CK4')[0]).toContain('calle2')
    expect(own(warnings, '03', 'G5')).toHaveLength(0)
    const names = [...w.element.querySelectorAll('input[name], select[name]')].map((x) => x.getAttribute('name'))
    expect(names.indexOf('forma')).toBeGreaterThan(names.indexOf('estado'))
    w.unmount()
  })
  it('las claves del pedido son opcionales: con el slot order, sin lines ni quantity no hay C5 (#938)', () => {
    const { lines, quantity, pending, placedAt, delivery, reference, ...labels } = bank.LABELS
    const { warnings } = run(GbCheckout03, { labels }, { slots: { ...bank.slots, order: () => 'El pedido de la aplicación' } })
    for (const k of ['lines', 'quantity', 'reference']) expect(warnings.some((t) => t.includes(`labels.${k}`) && t.includes('(C5)')), k).toBe(false)
    const b = run(GbCheckout03, { labels })
    expect(b.warnings.some((t) => t.includes('labels.lines') && t.includes('(C5)'))).toBe(true)
    expect(b.warnings.some((t) => t.includes('labels.quantity') && t.includes('(C5)'))).toBe(true)
  })
  it('EC5: un paso sin id se omite; C7 con más de cinco pasos', () => {
    const steps = [...bank.STEPS, { title: 'Sin id', action: 'Ir' }, { id: 'a', title: 'A', action: 'A', fields: [] }, { id: 'b', title: 'B', action: 'B', fields: [] }]
    const { warnings } = run(GbCheckout01, { steps })
    expect(own(warnings, '01', 'EC5')).toHaveLength(1)
    expect(own(warnings, '01', 'C7')).toHaveLength(1)
  })
})

describe('GbCheckout03 · dos regiones con GSplit (§40, #950)', () => {
  it('GSplit 3:2 lg: pasos y formulario en start, el pedido en end, en ese orden', () => {
    const { w } = run(GbCheckout03)
    expect(w.find('.g-adaptive-layout').exists()).toBe(false)
    const split = w.find('.g-split')
    expect(split.classes()).toEqual(expect.arrayContaining(['g-split--ratio-3-2', 'g-split--collapse-md', 'g-split--gap-lg']))
    const [start, end, ...rest] = split.element.children
    expect(rest).toHaveLength(0)
    expect(start.classList.contains('g-split__region--start')).toBe(true)
    expect(end.classList.contains('g-split__region--end')).toBe(true)
    expect(start.querySelector('form')).not.toBeNull()
    expect(end.querySelector('form')).toBeNull()
    expect(end.querySelector('.g-price')).not.toBeNull()
    expect(split.attributes('style')).toBeUndefined()
  })
  it('01 y 02 no usan GSplit', () => {
    for (const C of [GbCheckout01, GbCheckout02]) expect(run(C).w.find('.g-split').exists()).toBe(false)
  })
})
