// GbTrust (dueño: bruno): trust.md «Verificación propia» + la batería común de _comun.md §8 y §33.
import { describe, it, expect, afterEach, vi } from 'vitest'
import meta from './GbTrust.meta.json'
import * as bank from './trust.bank.js'
import * as section from './props.js'
import GbTrust01 from './GbTrust01.vue'
import GbTrust02 from './GbTrust02.vue'
import GbTrust03 from './GbTrust03.vue'
import { sectionSuite } from '../bank/suite.js'

const variants = { GbTrust01, GbTrust02, GbTrust03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbTrust' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

import { GBtn, GCard } from '@grana/vue'
import { click, mountBlock } from '../bank/harness.js'

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, icons: bank.appIcons, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbTrust${n}]`) && t.includes(`(${code})`))
const ALL = Object.entries(variants).map(([k, C]) => [k.slice(-2), C])
const items = bank.props.items

describe('GbTrust · cada promesa lleva a su letra pequeña (#926)', () => {
  it('lista real con un elemento por promesa; el icono es decorativo', () => {
    for (const [n, C] of ALL) {
      const { w } = run(C)
      const li = n === '03' ? w.findAll('ul > li') : w.findAll('[role="list"] > [role="listitem"]')
      expect(li).toHaveLength(items.length)
      for (const svg of w.findAll('svg')) {
        const hidden = svg.attributes('aria-hidden') === 'true' || Boolean(svg.element.closest('[aria-hidden="true"]'))
        expect(hidden).toBe(true)
      }
    }
  })
  it('la prueba de una policy es un enlace link a #{policy} con labels.policy; navigate con item = la promesa', () => {
    for (const [, C] of ALL) {
      const onNavigate = vi.fn((p) => p.event.preventDefault())
      const { w } = run(C, { onNavigate }, { attachTo: document.body })
      const a = w.findAll('a.g-btn').find((x) => x.attributes('href') === '#devoluciones')
      expect(a.text()).toBe('Ver la política: Devoluciones en 30 días')
      a.element.dispatchEvent(click({ ctrlKey: true }))
      expect(onNavigate).not.toHaveBeenCalled()
      a.element.dispatchEvent(click())
      expect(onNavigate.mock.calls[0][0]).toMatchObject({ href: '#devoluciones', item: items[1] })
      for (const b of w.findAllComponents(GBtn)) expect(b.props('variant')).toBe('link')
      w.unmount()
    }
  })
  it('la action gana a la policy; sin href es botón con activate', async () => {
    const onActivate = vi.fn()
    const list = [{ title: 'Hecho a mano', policy: 'x', action: { label: 'Ver el taller' } }]
    const { w } = run(GbTrust02, { items: list, onActivate })
    expect(w.find('a.g-btn').exists()).toBe(false)
    await w.find('button.g-btn').trigger('click')
    expect(onActivate.mock.calls[0][0].item).toBe(list[0])
  })
  it('01 y 02: el título de la promesa al nivel de dentro; 03: ninguna promesa es encabezado', () => {
    for (const C of [GbTrust01, GbTrust02]) expect(run(C).w.findAll('h3')).toHaveLength(items.length)
    const w3 = run(GbTrust03).w
    expect(w3.findAll('h3, h4, h5, h6')).toHaveLength(0)
    expect(w3.findAll('strong').map((s) => s.text())).toEqual(items.map((i) => i.title))
    // El título y la descripción se leen separados («México Sale…», no «MéxicoSale…»)
    expect(w3.find('ul > li').text()).toContain('Envío a todo México Sale del taller')
    expect(run(GbTrust01).w.findComponent(GCard).props()).toMatchObject({ level: 'flat', density: 'compact' })
  })
  it('PR1 una vez por instancia; C5 sin labels.policy (sin enlace)', () => {
    const bare = [{ title: 'A' }, { title: 'B' }]
    expect(own(run(GbTrust01, { items: bare }).warnings, '01', 'PR1')).toHaveLength(1)
    const a = run(GbTrust03, { labels: {} })
    expect(own(a.warnings, '03', 'C5')).toHaveLength(1)
    expect(a.w.findAll('a.g-btn').map((x) => x.attributes('href'))).toEqual(['/talleres'])
  })
})
