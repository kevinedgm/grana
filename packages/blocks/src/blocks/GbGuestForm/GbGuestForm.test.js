// GbGuestForm (dueño: bruno): guest-form.md «Verificación propia» + la batería común de _comun.md §8 y §20.
import { describe, it, expect, afterEach, vi } from 'vitest'
import meta from './GbGuestForm.meta.json'
import * as bank from './guest-form.bank.js'
import * as section from './props.js'
import GbGuestForm01 from './GbGuestForm01.vue'
import GbGuestForm02 from './GbGuestForm02.vue'
import GbGuestForm03 from './GbGuestForm03.vue'
import { sectionSuite } from '../bank/suite.js'

const variants = { GbGuestForm01, GbGuestForm02, GbGuestForm03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbGuestForm' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

import { beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { GCheckbox, GForm, GFormActions, GFormSection, GInput, GSelect, GStepper, GTextarea } from '@grana/vue'
import { GPartyField, describeQuery } from '@grana/vue/booking'
import { click, mountBlock } from '../bank/harness.js'
import { PARTY_ROWS, QUERY, QUERY_LABELS } from '../bank/booking.js'

beforeEach(() => {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
})
const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, icons: bank.appIcons, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbGuestForm${n}]`) && t.includes(`(${code})`))
const ALL = Object.entries(variants).map(([k, C]) => [k.slice(-2), C])
const FULL = { nombre: 'Rosa', apellidos: 'Martínez López', correo: 'rosa@correo.mx', telefono: '+52 951 555 0101', hora: 'tarde', peticiones: '  Cuna, por favor  ' }
const flush = async () => { await flushPromises(); for (let i = 0; i < 4; i++) await nextTick() }
const send = async (w) => { w.find('form').element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await flush() }
const check = async (w, name) => { await w.find(`input[type="checkbox"][name="${name}"]`).trigger("click"); await flush() }

describe('GbGuestForm · los campos', () => {
  it('un control por campo con su tipo, autocomplete y ayuda (hint + why en aria-describedby)', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      expect(w.findAll('input[name="nombre"], input[name="apellidos"], input[name="correo"], input[name="telefono"]')).toHaveLength(4)
      expect(w.findAllComponents(GSelect)).toHaveLength(1)
      expect(w.findAllComponents(GTextarea)).toHaveLength(1)
      const tel = w.find('input[name="telefono"]')
      expect(tel.attributes('type')).toBe('tel')
      expect(tel.attributes('autocomplete')).toBe('tel')
      expect(w.find('input[name="correo"]').attributes('type')).toBe('email')
      expect(w.find('input[name="nombre"]').attributes('autocomplete')).toBe('given-name')
      const help = tel.attributes('aria-describedby').split(' ').map((id) => w.element.querySelector(`[id="${id}"]`)).filter(Boolean).map((n) => n.textContent).join(' ')
      expect(help).toContain('Para avisarte por WhatsApp si cambia algo de tu llegada.')
      // nombre y apellidos comparten fila
      expect(w.find('input[name="nombre"]').element.closest('.g-form-row')).toBe(w.find('input[name="apellidos"]').element.closest('.g-form-row'))
    }
  })
  it('el grupo arranca con query.party (lo ya dicho no se vuelve a escribir)', () => {
    for (const [, C] of ALL) {
      const p = run(C).w.findComponent(GPartyField)
      expect(p.props('modelValue')).toEqual(QUERY.party)
      expect(p.props('mode')).toBe('inline')
      expect(p.props('rows')).toBe(PARTY_ROWS)
    }
  })
  it('el enlace del consentimiento va fuera de la etiqueta; ninguna casilla marcada al empezar', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      for (const box of w.findAll('input[type="checkbox"]')) expect(box.element.checked).toBe(false)
      const a = w.find('a[href="#cancelacion"]')
      expect(a.exists()).toBe(true)
      expect(a.element.closest('label')).toBe(null)
    }
  })
})

describe('GbGuestForm · validación y envío', () => {
  it('vacío → labels.required con {label}; mal formado → labels.invalid; sin submit', async () => {
    for (const [n, C] of ALL) {
      const onSubmit = vi.fn()
      const { w } = run(C, { onSubmit, values: { ...FULL, correo: '' } }, { attachTo: document.body })
      if (n === '02') { await w.findAll('button').find((b) => b.text() === 'Siguiente').trigger('click'); await flush() }
      else await send(w)
      expect(onSubmit).not.toHaveBeenCalled()
      expect(w.findComponent(GForm).props('errors').correo).toBe('Escribe Correo.')
      const input = w.find('input[name="correo"]')
      await input.setValue('no-es-correo')
      await flush()
      expect(w.findComponent(GForm).props('errors').correo).toBe('Revisa Correo.')
      w.unmount()
    }
  })
  it('consentimiento required sin marcar bloquea; marcado, submit con su carga exacta', async () => {
    for (const [n, C] of ALL) {
      const onSubmit = vi.fn()
      const onValues = vi.fn()
      const { w } = run(C, { onSubmit, 'onUpdate:values': onValues, values: FULL }, { attachTo: document.body })
      if (n === '02') { await w.findAll('button').find((b) => b.text() === 'Siguiente').trigger('click'); await flush() }
      await send(w)
      expect(onSubmit).not.toHaveBeenCalled()
      expect(w.findComponent(GForm).props('errors').politica).toBe('Marca esta casilla para continuar.')
      await check(w, 'politica')
      await send(w)
      expect(onSubmit).toHaveBeenCalledTimes(1)
      const p = onSubmit.mock.calls[0][0]
      expect(p.values).toEqual({ ...FULL, peticiones: 'Cuna, por favor' })
      expect(p.consents).toEqual({ politica: true, ofertas: false })
      expect(p.party).toEqual(QUERY.party)
      expect(p.query).toEqual(QUERY)
      expect(p.data).toBeInstanceOf(FormData)
      expect(p.data.get('nombre')).toBe('Rosa')
      expect(p.data.get('huespedes[adults]')).toBe('2')
      expect(Object.keys(p).sort()).toEqual(['consents', 'data', 'event', 'party', 'query', 'values'])
      w.unmount()
    }
  })
  it('la party corregida viaja en la consulta del envío', async () => {
    const onSubmit = vi.fn()
    const { w } = run(GbGuestForm01, { onSubmit, values: FULL }, { attachTo: document.body })
    w.findComponent(GPartyField).vm.$emit('update:modelValue', { adults: 3, children: 0, rooms: 2 })
    await check(w, 'politica')
    await send(w)
    expect(onSubmit.mock.calls[0][0].party).toEqual({ adults: 3, children: 0, rooms: 2 })
    expect(onSubmit.mock.calls[0][0].query).toEqual({ ...QUERY, party: { adults: 3, children: 0, rooms: 2 } })
    w.unmount()
  })
  it('errors de la aplicación ganan y se ven; error general al final del resumen', async () => {
    for (const [, C] of ALL) {
      const { w } = run(C, { values: FULL, ...bank.states.errors, ...bank.states.error }, { attachTo: document.body })
      await flush()
      expect(w.findComponent(GForm).props('errors').telefono).toBe(bank.states.errors.errors.telefono)
      const summary = w.find('.g-error-summary')
      expect(summary.text()).toContain(bank.states.error.error)
      w.unmount()
    }
  })
  it('busy: el envío carga con labels.busy', () => {
    const { w } = run(GbGuestForm01, bank.states.busy)
    expect(w.find('button[type="submit"]').classes()).toContain('is-loading')
  })
})

describe('GbGuestForm · 02 por pasos', () => {
  it('un paso por grupo; «Siguiente» no avanza con errores del paso y enfoca el primero; avanza y enfoca el primer control', async () => {
    const onStep = vi.fn()
    const { w } = run(GbGuestForm02, { 'onUpdate:step': onStep, values: { nombre: 'Rosa' } }, { attachTo: document.body })
    expect(w.findComponent(GStepper).props('steps').map((s) => s.label)).toEqual(['Quién viene', 'Tu llegada'])
    const sections = w.findAllComponents(GFormSection)
    expect(sections[1].element.parentElement.hidden).toBe(true)
    const next = () => w.findAll('button').find((b) => b.text() === 'Siguiente')
    await next().trigger('click')
    await flush()
    expect(onStep).not.toHaveBeenCalled()
    expect(document.activeElement.name).toBe('apellidos')
    // Los errores del paso siguiente no se conocen aún
    expect(w.findComponent(GForm).props('errors').hora).toBeUndefined()
    await w.setProps({ values: { ...FULL } })
    await flush()
    await next().trigger('click')
    await flush()
    expect(onStep).toHaveBeenCalledWith('llegada')
    expect(w.findAllComponents(GFormSection)[0].element.parentElement.hidden).toBe(true)
    expect(w.findAllComponents(GFormSection)[1].element.parentElement.hidden).toBe(false)
    expect(document.activeElement.id).toBe(w.findComponent(GSelect).props('id'))
    // «Atrás» no valida
    await w.findAll('button').find((b) => b.text() === 'Atrás').trigger('click')
    await flush()
    expect(onStep).toHaveBeenLastCalledWith('quien')
    w.unmount()
  })
  it('los grupos ocultos montados entran en el FormData', async () => {
    const onSubmit = vi.fn()
    const { w } = run(GbGuestForm02, { onSubmit, values: FULL, step: 'llegada' }, { attachTo: document.body })
    await check(w, 'politica')
    await send(w)
    expect(onSubmit.mock.calls[0][0].data.get('nombre')).toBe('Rosa')
    expect(w.findAllComponents(GFormSection)[0].element.parentElement.hidden).toBe(true)
    w.unmount()
  })
  it('un error de la aplicación en otro paso lleva a ese paso al enviar', async () => {
    const onStep = vi.fn()
    const { w } = run(GbGuestForm02, { 'onUpdate:step': onStep, values: FULL }, { attachTo: document.body })
    await w.findAll('button').find((b) => b.text() === 'Siguiente').trigger('click')
    await flush()
    await check(w, 'politica')
    await w.setProps({ errors: { telefono: 'Ese número no recibe mensajes.' } })
    await flush()
    await send(w)
    expect(onStep).toHaveBeenLastCalledWith('quien')
    w.unmount()
  })
})

describe('GbGuestForm · 03 con lo pedido a la vista', () => {
  it('GFormActions sticky y lo pedido arriba igual a describeQuery', () => {
    const { w } = run(GbGuestForm03)
    expect(w.findComponent(GFormActions).props('sticky')).toBe(true)
    const d = describeQuery(QUERY, { partyRows: PARTY_ROWS, locale: 'es', labels: QUERY_LABELS })
    expect(w.text()).toContain(`Para ${d.text} · ${d.checkout}`)
    for (const C of [GbGuestForm01, GbGuestForm02]) expect(run(C).w.findComponent(GFormActions).props('sticky')).toBe(false)
  })
})

describe('GbGuestForm · avisos', () => {
  it('G1, G2, G4, G5, G6 y G3, una vez', () => {
    for (const [n, C] of ALL) {
      const f = [...bank.props.fields, { name: 'x', label: 'X', type: 'color' }, { name: 'y', label: 'Y', type: 'email' }, { name: 'z', label: 'Z', group: 'nada' }]
      const { warnings } = run(C, { fields: f })
      for (const code of ['G1', 'G2', 'G5']) expect(own(warnings, n, code), code).toHaveLength(1)
      expect(own(run(C, { partyRows: undefined }).warnings, n, 'G4')).toHaveLength(1)
      expect(own(run(C, { onSubmit: undefined }).warnings, n, 'G6')).toHaveLength(1)
      const g3 = run(C, { values: { politica: 'true' } })
      expect(own(g3.warnings, n, 'G3')).toHaveLength(1)
      expect(g3.w.find('input[name="politica"]').element.checked).toBe(false)
    }
  })
  it('C1 con fields vacío: no pinta nada', () => {
    for (const [n, C] of ALL) {
      const { w, warnings } = run(C, { fields: [] })
      expect(own(warnings, n, 'C1')).toHaveLength(1)
      expect(w.find('form').exists()).toBe(false)
    }
  })
})
