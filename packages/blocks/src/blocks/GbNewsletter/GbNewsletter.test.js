// GbNewsletter (dueño: bruno): newsletter.md «Verificación propia» + la batería común de _comun.md §8.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { GBtn, GCard, GForm, GInput, GSection } from '@grana/vue'
import meta from './GbNewsletter.meta.json'
import * as bank from './newsletter.bank.js'
import * as section from './props.js'
import GbNewsletter01 from './GbNewsletter01.vue'
import GbNewsletter02 from './GbNewsletter02.vue'
import GbNewsletter03 from './GbNewsletter03.vue'
import { sectionSuite } from '../bank/suite.js'
import { click, mountBlock } from '../bank/harness.js'

const variants = { GbNewsletter01, GbNewsletter02, GbNewsletter03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbNewsletter' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, icons: bank.appIcons, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbNewsletter${n}]`) && t.includes(`(${code})`))
const ALL = Object.entries({ '01': GbNewsletter01, '02': GbNewsletter02, '03': GbNewsletter03 })

async function send(w, value) {
  const input = w.find('input[type="email"]')
  if (value !== undefined) {
    await input.setValue(value)
  }
  await w.find('form').trigger('submit')
  await flushPromises()
  await nextTick()
}

describe('GbNewsletter · el formulario (igual en las tres)', () => {
  it('GInput type="email" autocomplete="email" required con el slot action = GBtn type="submit"', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      const input = w.find('input')
      expect(input.attributes('type')).toBe('email')
      expect(input.attributes('autocomplete')).toBe('email')
      expect(input.attributes('required')).toBeDefined()
      expect(input.attributes('name')).toBe('email')
      expect(input.attributes('placeholder')).toBe('nombre@correo.com')
      const btn = w.findComponent(GInput).find('.g-input__action button')
      expect(btn.attributes('type')).toBe('submit')
      expect(btn.text()).toContain('Suscribirme')
      expect(w.findAllComponents(GInput)).toHaveLength(1) // un solo dato
      expect(w.findAll('input')).toHaveLength(1)
    }
  })
  it('la promesa (field.hint) describe el campo antes de escribir: aria-describedby → hint', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      const ids = w.find('input').attributes('aria-describedby').split(' ')
      const hint = ids.map((id) => w.element.querySelector(`[id="${id}"]`)).filter(Boolean).map((n) => n.textContent)
      expect(hint).toContain('Un correo al mes con fechas libres y nada más.')
    }
  })
  it('correo vacío o mal formado → error en el campo (GForm) y SIN submit', async () => {
    for (const [, C] of ALL) {
      const onSubmit = vi.fn()
      const { w } = run(C, { onSubmit }, { attachTo: document.body })
      await send(w)
      expect(onSubmit).not.toHaveBeenCalled()
      expect(w.find('input').attributes('aria-invalid')).toBe('true')
      expect(w.find('.g-input__message').text()).not.toBe('')
      await send(w, 'no-es-un-correo')
      expect(onSubmit).not.toHaveBeenCalled()
      expect(w.find('input').attributes('aria-invalid')).toBe('true')
      w.unmount()
    }
  })
  it('vacío → labels.required y mal formado → labels.invalid, no el validationMessage del navegador (#839)', async () => {
    for (const [, C] of ALL) {
      const { w, warnings } = run(C, {}, { attachTo: document.body })
      await send(w)
      expect(w.findComponent(GForm).props('errors')).toEqual({ email: bank.props.labels.required })
      expect(w.find('.g-input__message').text()).toContain(bank.props.labels.required)
      await send(w, 'no-es-un-correo')
      expect(w.findComponent(GForm).props('errors')).toEqual({ email: bank.props.labels.invalid })
      expect(warnings.filter((t) => t.includes('(C5)'))).toHaveLength(0)
      w.unmount()
    }
  })
  it('sin labels.required ni labels.invalid: C5 una vez por estado y, de último recurso, el validationMessage (#839)', async () => {
    for (const [n, C] of ALL) {
      const { w, warnings } = run(C, { labels: { busy: 'x' } }, { attachTo: document.body })
      await send(w)
      await send(w)
      const empty = w.findComponent(GForm).props('errors').email
      expect(empty).toBeTruthy()
      expect(empty).not.toBe(bank.props.labels.required)
      await send(w, 'mal')
      expect(w.findComponent(GForm).props('errors').email).toBeTruthy()
      const c5 = own(warnings, n, 'C5')
      expect(c5.filter((t) => t.includes('labels.required'))).toHaveLength(1)
      expect(c5.filter((t) => t.includes('labels.invalid'))).toHaveLength(1)
      w.unmount()
    }
  })
  it('labels.form va tal cual a labels de GForm, sin avisos de GForm (#840)', () => {
    for (const [, C] of ALL) {
      const { w, warnings } = run(C, bank.states.done)
      expect(w.findComponent(GForm).props('labels')).toEqual(bank.props.labels.form)
      expect(warnings.filter((t) => t.includes('GForm'))).toHaveLength(0)
    }
    expect(run(GbNewsletter01, { labels: {} }).w.findComponent(GForm).props('labels')).toEqual({})
  })
  it('03: la banda de marca es g-surface--level-flat (#830)', () => {
    expect(run(GbNewsletter03).w.classes()).toContain('g-surface--level-flat')
  })
  it('válido → submit { event, email } con el correo sin espacios a los lados; el error se va al corregir', async () => {
    for (const [, C] of ALL) {
      const onSubmit = vi.fn()
      const { w } = run(C, { onSubmit }, { attachTo: document.body })
      await send(w, 'mal')
      await send(w, '  ana@correo.mx  ')
      expect(onSubmit).toHaveBeenCalledTimes(1)
      const p = onSubmit.mock.calls[0][0]
      expect(p.email).toBe('ana@correo.mx')
      expect(p.event).toBeInstanceOf(Event)
      expect(w.find('input').attributes('aria-invalid')).toBeUndefined()
      w.unmount()
    }
  })
  it('busy → GBtn loading con loadingText = labels.busy', () => {
    for (const [, C] of ALL) {
      const { w } = run(C, bank.states.busy)
      const btn = w.findComponent(GInput).findComponent(GBtn)
      expect(btn.props('loading')).toBe(true)
      expect(btn.props('loadingText')).toBe('Suscribiendo…')
    }
  })
  it('error (servidor) en el campo, revelado en el acto; done como mensaje valid; con los dos gana error (N2)', async () => {
    for (const [n, C] of ALL) {
      const { w } = run(C, bank.states.done, { attachTo: document.body })
      expect(w.findComponent(GInput).props('valid')).toBe('Listo: revisa tu correo para confirmar.')
      expect(w.find('.g-input__message').text()).toContain('Listo: revisa tu correo')
      w.unmount()
      const both = run(C, { ...bank.states.done, ...bank.states.error }, { attachTo: document.body })
      await flushPromises()
      expect(both.w.findComponent(GInput).props('valid')).toBeUndefined()
      expect(both.w.findComponent(GForm).props('errors')).toEqual({ email: 'No pudimos suscribirte; inténtalo de nuevo.' })
      expect(own(both.warnings, n, 'N2')).toHaveLength(1)
      both.w.unmount()
    }
  })
  it('error presente al montar se ve en el campo (MK-B1)', async () => {
    for (const [, C] of ALL) {
      const { w } = run(C, bank.states.error, { attachTo: document.body })
      await flushPromises()
      await nextTick()
      expect(w.find('input').attributes('aria-invalid')).toBe('true')
      expect(w.find('.g-input__message').text()).toContain('No pudimos suscribirte')
      w.unmount()
    }
  })
  it('error que llega después (respuesta del servidor) se ve sin esperar al blur', async () => {
    const { w } = run(GbNewsletter01, {}, { attachTo: document.body })
    await w.setProps({ error: 'No pudimos suscribirte; inténtalo de nuevo.' })
    await flushPromises()
    await nextTick()
    expect(w.find('.g-input__message').text()).toContain('No pudimos suscribirte')
    expect(w.find('input').attributes('aria-invalid')).toBe('true')
    w.unmount()
  })
  it('legal: p con el texto y el enlace interno (GBtn link) que emite navigate con item = legal.link', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      const a = w.find('form p a.g-btn--variant-link')
      w.element.addEventListener('click', (e) => e.preventDefault()) // jsdom no navega (después de la guarda: burbuja)
      expect(a.attributes('href')).toBe('/privacidad')
      expect(w.find('form p').text()).toContain('Puedes darte de baja cuando quieras.')
      a.element.dispatchEvent(click())
      a.element.dispatchEvent(click({ ctrlKey: true }))
      const ev = w.findComponent(C).emitted('navigate')
      expect(ev).toHaveLength(1)
      expect(ev[0][0]).toMatchObject({ href: '/privacidad', item: bank.props.legal.link })
    }
  })
  it('legal externo: otra pestaña, nombre con labels.external y sin navigate', () => {
    const legal = { text: 'Ver', link: { label: 'Aviso', href: 'https://ejemplo.mx/privacidad', external: true } }
    const { w } = run(GbNewsletter01, { legal })
    const a = w.find('form p a')
    w.element.addEventListener('click', (e) => e.preventDefault())
    expect(a.attributes('target')).toBe('_blank')
    expect(a.attributes('aria-label')).toBe('Aviso, se abre en otra pestaña')
    a.element.dispatchEvent(click())
    expect(w.findComponent(GbNewsletter01).emitted('navigate')).toBeUndefined()
  })
  it('slots legal y description', () => {
    for (const [, C] of ALL) {
      const { w } = mountBlock(C, { props: bank.props, icons: bank.appIcons, slots: { legal: () => 'LEGAL', description: () => 'DESC' } })
      expect(w.find('form p').text()).toBe('LEGAL')
      expect(w.text()).toContain('DESC')
    }
  })
})

describe('GbNewsletter · cada forma', () => {
  it('01: GSection con el formulario dentro', () => {
    const { w } = run(GbNewsletter01)
    expect(w.findComponent(GSection).find('form').exists()).toBe(true)
    expect(w.element.tagName).toBe('SECTION')
  })
  it('02: GCard as="section" es la raíz y su encabezado está al nivel de la sección (h2; h3 dentro de una GSection)', () => {
    const { w } = run(GbNewsletter02)
    expect(w.element.tagName).toBe('SECTION')
    expect(w.findComponent(GCard).props('headingLevel')).toBe(2)
    expect(w.find('h2').text()).toBe(bank.props.title)
    const nested = run(GbNewsletter02, {}, { wrap: (render) => h(GSection, { title: 'Página' }, render) })
    expect(nested.w.find('[data-gb] h3').text()).toBe(bank.props.title)
  })
  it('03: zona de marca (data-g-zone="brand") con la GSection dentro', () => {
    const { w } = run(GbNewsletter03)
    expect(w.element.getAttribute('data-g-zone')).toBe('brand')
    expect(w.findComponent(GSection).find('form').exists()).toBe(true)
  })
})

describe('GbNewsletter · avisos (una vez por instancia y motivo)', () => {
  it('N1: sin field.hint se pinta sin la promesa', () => {
    for (const [n, C] of ALL) {
      const { w, warnings } = run(C, { field: { label: 'Tu correo' } })
      expect(own(warnings, n, 'N1')).toHaveLength(1)
      expect(w.find('input').exists()).toBe(true)
    }
  })
  it('N3: sin escucha de submit', () => {
    for (const [n, C] of ALL) {
      const { onSubmit, ...rest } = bank.props
      const { warnings } = mountBlock(C, { props: rest, icons: bank.appIcons })
      expect(own(warnings, n, 'N3')).toHaveLength(1)
    }
  })
  it('C5: busy sin labels.busy; legal.link externo sin labels.external', () => {
    for (const [n, C] of ALL) {
      const legal = { text: 'Ver', link: { label: 'Aviso', href: 'https://ejemplo.mx', external: true } }
      const { warnings } = run(C, { busy: true, legal, labels: {} })
      expect(own(warnings, n, 'C5')).toHaveLength(2)
    }
  })
  it('C6: un href javascript: en legal deja un GBtn deshabilitado sin enlace', () => {
    for (const [n, C] of ALL) {
      const legal = { text: 'Ver', link: { label: 'Aviso', href: 'javascript:alert(1)' } }
      const { w, warnings } = run(C, { legal })
      expect(own(warnings, n, 'C6')).toHaveLength(1)
      expect(w.find('a[href^="javascript"]').exists()).toBe(false)
      expect(w.find('form p button[disabled]').text()).toBe('Aviso')
    }
  })
})
