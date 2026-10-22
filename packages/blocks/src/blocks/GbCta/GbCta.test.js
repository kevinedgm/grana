// GbCta (dueño: bruno): cta.md «Verificación propia» + la batería común de _comun.md §8.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h } from 'vue'
import { GBtn, GCard, GDivider, GSection } from '@grana/vue'
import meta from './GbCta.meta.json'
import * as bank from './cta.bank.js'
import * as section from './props.js'
import GbCta01 from './GbCta01.vue'
import GbCta02 from './GbCta02.vue'
import GbCta03 from './GbCta03.vue'
import GbStats02 from '../GbStats/GbStats02.vue'
import * as statsBank from '../GbStats/stats.bank.js'
import { sectionSuite } from '../bank/suite.js'
import { click, mountBlock } from '../bank/harness.js'

const variants = { GbCta01, GbCta02, GbCta03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbCta' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbCta${n}]`) && t.includes(`(${code})`))
const ALL = { '01': GbCta01, '02': GbCta02, '03': GbCta03 }
const SECOND = { '01': 'outline', '02': 'outline', '03': 'link' }

describe('GbCta · dice qué pasa después, y es una sola (#822)', () => {
  it('dos acciones: la principal solid y la secundaria según la forma; aria-describedby de la principal → assurance', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const { w } = run(C)
      const btns = w.findAllComponents(GBtn)
      expect(btns.map((b) => b.props('variant'))).toEqual(['solid', SECOND[n]])
      const els = w.findAll('.g-btn')
      const id = els[0].attributes('aria-describedby')
      expect(id, n).toBeTruthy()
      expect(w.find(`[id="${id}"]`).text()).toBe(bank.props.assurance)
      expect(els[1].attributes('aria-describedby')).toBeUndefined()
    }
  })
  it('sin assurance no hay párrafo ni aria-describedby', () => {
    for (const C of Object.values(ALL)) {
      const { w } = run(C, { assurance: undefined })
      expect(w.find('.g-btn').attributes('aria-describedby')).toBeUndefined()
      expect(w.text()).not.toContain('Sin pago ahora')
    }
  })
  it('01: la raíz es la zona de marca (data-g-zone="brand"); ignora media', () => {
    const { w } = run(GbCta01)
    expect(w.element.getAttribute('data-g-zone')).toBe('brand')
    expect(w.find('img').exists()).toBe(false)
  })
  it('02: GCard as="section" (auto, media start) con el encabezado al nivel de sección; foto con width, height, alt, lazy', () => {
    const { w } = run(GbCta02)
    const card = w.findComponent(GCard)
    expect(card.element.tagName).toBe('SECTION')
    expect([card.props('orientation'), card.props('mediaPosition'), card.props('headingLevel')]).toEqual(['auto', 'start', 2])
    expect(w.find('h2').text()).toContain(bank.props.title)
    const img = w.find('img')
    expect([img.attributes('width'), img.attributes('height'), img.attributes('loading'), img.attributes('decoding')]).toEqual(['1200', '900', 'lazy', 'async'])
    expect(img.attributes('alt')).toBeTruthy()
    expect(img.attributes('fetchpriority')).toBeUndefined()
    const nested = run(GbCta02, {}, { wrap: (render) => h(GSection, { title: 'Página' }, render) })
    expect(nested.w.findComponent(GCard).props('headingLevel')).toBe(3)
  })
  it('02 sin media: tarjeta sin foto', () => {
    expect(run(GbCta02, { media: undefined }).w.find('img').exists()).toBe(false)
  })
  it('03: GDivider decorativo y el grupo de acciones del encabezado nombrado con labels.actions', () => {
    const { w } = run(GbCta03)
    expect(w.findComponent(GDivider).props('decorative')).toBe(true)
    const sec = w.findComponent(GSection)
    expect(sec.props('labels')).toEqual({ actions: bank.props.labels.actions })
    expect(w.find(`[aria-label="${bank.props.labels.actions}"]`).exists()).toBe(true)
    expect(w.find('img').exists()).toBe(false)
  })
  it('navigate con clic primario (item = la acción); no con modificadores, ni con la externa; preventDefault impide navegar', () => {
    for (const C of Object.values(ALL)) {
      const { w } = mountBlock(C, { props: { ...bank.props, onNavigate: ({ event }) => event.preventDefault() } })
      const [a, ext] = w.findAll('a.g-btn').map((x) => x.element)
      const e = click()
      a.dispatchEvent(e)
      expect(e.defaultPrevented).toBe(true)
      for (const m of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) a.dispatchEvent(click(m))
      expect(ext.getAttribute('target')).toBe('_blank')
      expect(ext.getAttribute('aria-label')).toBe('Escríbenos por WhatsApp, se abre en otra pestaña')
      ext.dispatchEvent(click())
      const ev = w.findComponent(C).emitted('navigate')
      expect(ev).toHaveLength(1)
      expect(ev[0][0]).toMatchObject({ href: '#reservar', item: bank.props.actions[0] })
    }
  })
  it('activate en una acción sin href (item = la acción)', async () => {
    const actions = [{ id: 'abrir', label: 'Ver disponibilidad' }]
    for (const C of Object.values(ALL)) {
      const { w } = run(C, { actions })
      await w.find('button.g-btn').trigger('click')
      expect(w.findComponent(C).emitted('activate')[0][0].item).toBe(actions[0])
    }
  })
  it('slot actions sustituye a los botones generados', () => {
    for (const C of Object.values(ALL)) {
      const { w } = mountBlock(C, { props: bank.props, slots: { actions: () => h(GBtn, null, () => 'PROPIO') } })
      expect(w.findAllComponents(GBtn).map((b) => b.text())).toEqual(['PROPIO'])
    }
  })
})

describe('GbCta · avisos', () => {
  it('A1: actions vacía avisa y se pinta sin acción', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const { w, warnings } = run(C, { actions: [] })
      expect(w.find('[data-gb]').exists()).toBe(true)
      expect(w.findAllComponents(GBtn)).toHaveLength(0)
      expect(own(warnings, n, 'A1')).toHaveLength(1)
    }
  })
  it('C2: una acción sin label se omite; C8: más de dos se pintan las dos primeras', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const a = run(C, { actions: [{ href: '#x' }, { label: 'B', href: '#b' }] })
      expect(a.w.findAllComponents(GBtn)).toHaveLength(1)
      expect(own(a.warnings, n, 'C2')).toHaveLength(1)
      const b = run(C, { actions: [{ label: 'A', href: '#a' }, { label: 'B', href: '#b' }, { label: 'C', href: '#c' }] })
      expect(b.w.findAllComponents(GBtn)).toHaveLength(2)
      expect(own(b.warnings, n, 'C8')).toHaveLength(1)
    }
  })
  it('C4 solo en 02; C5: externa sin labels.external; C6: javascript: deja un GBtn deshabilitado sin enlace', () => {
    expect(own(run(GbCta02, { media: { src: 'x.jpg' } }).warnings, '02', 'C4')).toHaveLength(2)
    expect(own(run(GbCta01, { media: { src: 'x.jpg' } }).warnings, '01', 'C4')).toHaveLength(0)
    for (const [n, C] of Object.entries(ALL)) {
      const { w, warnings } = run(C, { actions: [{ label: 'Mal', href: 'javascript:void(0)' }, { label: 'Ext', href: 'https://x', external: true }], labels: { actions: 'Acciones' } })
      expect(own(warnings, n, 'C5')).toHaveLength(1)
      expect(own(warnings, n, 'C6')).toHaveLength(1)
      expect(w.find('[href^="javascript"]').exists()).toBe(false)
      expect(w.findAllComponents(GBtn)[0].props('disabled')).toBe(true)
    }
  })
  it('A2: dos GbCta en el documento avisan al montar el segundo', () => {
    const at = () => { const d = document.createElement('div'); document.body.append(d); return d }
    const first = run(GbCta03, {}, { attachTo: at() })
    expect(own(first.warnings, '03', 'A2')).toHaveLength(0)
    const second = run(GbCta02, {}, { attachTo: at() })
    expect(own(second.warnings, '02', 'A2')).toHaveLength(1)
    first.w.unmount(); second.w.unmount()
  })
  it('A2: un GbCta01 junto a un GbStats02 (dos bandas de marca)', () => {
    const at = () => { const d = document.createElement('div'); document.body.append(d); return d }
    const stats = mountBlock(GbStats02, { props: statsBank.props, attachTo: at() })
    const cta = run(GbCta01, {}, { attachTo: at() })
    expect(own(cta.warnings, '01', 'A2')).toHaveLength(1)
    stats.w.unmount(); cta.w.unmount()
  })
})
