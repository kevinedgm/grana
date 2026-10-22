// GbHero (dueño: bruno): hero.md «Verificación propia» + la batería común de _comun.md §8.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { GHero } from '@grana/vue/hero'
import { GBtn } from '@grana/vue'
import meta from './GbHero.meta.json'
import * as bank from './hero.bank.js'
import * as section from './props.js'
import GbHero01 from './GbHero01.vue'
import GbHero02 from './GbHero02.vue'
import GbHero03 from './GbHero03.vue'
import { sectionSuite } from '../bank/suite.js'
import { click, mountBlock } from '../bank/harness.js'

const variants = { GbHero01, GbHero02, GbHero03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbHero', h1: 1 })
afterEach(() => vi.restoreAllMocks())

const run = (C, props = {}, slots = bank.slots) => mountBlock(C, { props: { ...bank.props, ...props }, slots })
const heroProps = (w) => w.findComponent(GHero).vm.$.vnode.props
const variantsOf = (w) => w.findAllComponents(GBtn).filter((b) => b.element.closest('.g-hero__actions')).map((b) => b.props('variant'))

describe('GbHero · cada variante pasa a GHero solo lo de su columna (regla 3)', () => {
  it('01: window con detail; sin views ni consult', () => {
    const { w } = run(GbHero01)
    const p = heroProps(w)
    expect(p.appearance).toBe('window')
    expect(p.detail).toEqual(bank.props.detail)
    expect('views' in p).toBe(false)
    expect(p.labels).toEqual({ pause: bank.props.labels.pause })
    expect(w.find('.g-hero__consult').exists()).toBe(false)
  })
  it('02: views con labels.views; sin detail ni consult', () => {
    const { w } = run(GbHero02)
    const p = heroProps(w)
    expect(p.appearance).toBe('views')
    expect(p.views).toEqual(bank.props.views)
    expect('detail' in p).toBe(false)
    expect(p.labels).toEqual({ views: 'Vistas', pause: bank.props.labels.pause })
    expect(w.find('.g-hero__consult').exists()).toBe(false)
  })
  it('03: threshold con consult; sin detail ni views', () => {
    const { w } = run(GbHero03)
    const p = heroProps(w)
    expect(p.appearance).toBe('threshold')
    expect('detail' in p || 'views' in p).toBe(false)
    expect(w.find('.g-hero__consult form').exists()).toBe(true)
  })
  it('03: la consulta va antes de las acciones en el DOM', () => {
    const { w } = run(GbHero03)
    const consult = w.find('.g-hero__consult').element
    const actions = w.find('.g-hero__actions').element
    expect(consult.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
  it('el slot media llega a GHero en las tres', () => {
    for (const C of Object.values(variants)) {
      const { w } = run(C, {}, { media: () => 'VIDEO' })
      expect(w.find('.g-hero').text()).toContain('VIDEO')
    }
  })
})

describe('GbHero · jerarquía de acciones por posición (#818)', () => {
  it('01 y 02: solid + link, tamaño lg', () => {
    for (const C of [GbHero01, GbHero02]) {
      const { w } = run(C)
      expect(variantsOf(w)).toEqual(['solid', 'link'])
      expect(w.findAllComponents(GBtn).filter((b) => b.element.closest('.g-hero__actions')).every((b) => b.props('size') === 'lg')).toBe(true)
    }
  })
  it('03 con consult: las dos outline; 03 sin consult: solid + link', () => {
    expect(variantsOf(run(GbHero03).w)).toEqual(['outline', 'outline'])
    expect(variantsOf(run(GbHero03, {}, {}).w)).toEqual(['solid', 'link'])
  })
  it('sin acciones no hay fila de acciones; el slot actions las sustituye', () => {
    expect(run(GbHero01, { actions: [] }).w.find('.g-hero__actions').exists()).toBe(false)
    const { w } = run(GbHero01, {}, { actions: () => 'PROPIA' })
    expect(w.find('.g-hero__actions').text()).toBe('PROPIA')
  })
  it('C8: más de dos acciones pinta las dos primeras y avisa una vez', () => {
    const extra = [...bank.props.actions, { label: 'Tercera', href: '#t' }]
    const { w, warnings } = run(GbHero01, { actions: extra })
    expect(w.findAll('.g-hero__actions .g-btn').length).toBe(2)
    expect(warnings.filter((t) => t.includes('[Grana GbHero01]') && t.includes('C8'))).toHaveLength(1)
  })
})

describe('GbHero · eventos de intención (_comun.md §4)', () => {
  it('navigate con clic primario; no con modificadores, botón central ni ya cancelado', async () => {
    const { w } = run(GbHero01)
    const a = w.find('.g-hero__actions a').element
    a.dispatchEvent(click())
    for (const m of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) a.dispatchEvent(click(m))
    const ev = w.findComponent(GbHero01).emitted('navigate')
    expect(ev).toHaveLength(1)
    expect(ev[0][0].href).toBe('#reservar')
    expect(ev[0][0].item).toBe(bank.props.actions[0])
    expect(ev[0][0].event).toBeInstanceOf(MouseEvent)
  })
  it('preventDefault() en la escucha impide la navegación', () => {
    let prevented = null
    const { w } = mountBlock(GbHero01, { props: { ...bank.props, onNavigate: ({ event }) => { event.preventDefault(); prevented = event } } })
    const e = click()
    w.find('.g-hero__actions a').element.dispatchEvent(e)
    expect(prevented).toBe(e)
    expect(e.defaultPrevented).toBe(true)
  })
  it('externa: target _blank, rel noopener, nombre con labels.external y sin navigate', () => {
    const actions = [{ label: 'Instagram', href: 'https://instagram.com/casa', external: true }]
    const { w } = run(GbHero01, { actions })
    const a = w.find('.g-hero__actions a')
    expect(a.attributes('target')).toBe('_blank')
    expect(a.attributes('rel')).toBe('noopener')
    expect(a.attributes('aria-label')).toBe('Instagram, se abre en otra pestaña')
    expect(a.find('.g-icon').exists()).toBe(true)
    a.element.dispatchEvent(click())
    expect(w.findComponent(GbHero01).emitted('navigate')).toBeUndefined()
  })
  it('activate en una acción sin href', async () => {
    const actions = [{ id: 'consulta', label: 'Consultar' }]
    const { w } = run(GbHero01, { actions })
    await w.find('.g-hero__actions button').trigger('click')
    const ev = w.findComponent(GbHero01).emitted('activate')
    expect(ev).toHaveLength(1)
    expect(ev[0][0].item).toBe(actions[0])
  })
})

describe('GbHero · avisos propios', () => {
  const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbHero${n}]`) && t.includes(code))
  it('H1: 02 con menos de dos views se pinta como 01 (window, sin detail) y avisa una vez', () => {
    const { w, warnings } = run(GbHero02, { views: bank.props.views.slice(0, 1) })
    const p = heroProps(w)
    expect(p.appearance).toBe('window')
    expect('detail' in p || 'views' in p).toBe(false)
    expect(own(warnings, '02', 'H1')).toHaveLength(1)
    expect(warnings.filter((t) => t.includes('[Grana GHero]'))).toEqual([])
  })
  it('C4: detail sin width/height en 01; views[].media sin alt en 02; las demás no lo miran', () => {
    const detail = { src: 'x.jpg' }
    expect(own(run(GbHero01, { detail }).warnings, '01', 'C4').length).toBe(2)
    expect(own(run(GbHero03, { detail }).warnings, '03', 'C4')).toHaveLength(0)
    const views = bank.props.views.map((v, i) => (i ? v : { ...v, media: { ...v.media, alt: undefined } }))
    expect(own(run(GbHero02, { views }).warnings, '02', 'C4').length).toBeGreaterThan(0)
  })
  it('C5: una acción externa sin labels.external avisa y la marca queda decorativa', () => {
    const { w, warnings } = run(GbHero01, { actions: [{ label: 'Instagram', href: 'https://i.com', external: true }], labels: {} })
    expect(own(warnings, '01', 'C5')).toHaveLength(1)
    expect(w.find('.g-hero__actions a').attributes('aria-label')).toBeUndefined()
  })
  it('C6: href javascript: se ignora (sin enlace) y avisa', () => {
    const { w, warnings } = run(GbHero01, { actions: [{ label: 'Mal', href: 'javascript:alert(1)' }] })
    expect(w.find('.g-hero__actions a').exists()).toBe(false)
    expect(w.find('.g-hero__actions button').exists()).toBe(true)
    expect(own(warnings, '01', 'C6')).toHaveLength(1)
  })
})
