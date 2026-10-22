// GbStats (dueño: bruno): stats.md «Verificación propia» + la batería común de _comun.md §8.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { GMetric } from '@grana/vue'
import meta from './GbStats.meta.json'
import * as bank from './stats.bank.js'
import * as section from './props.js'
import GbStats01 from './GbStats01.vue'
import GbStats02 from './GbStats02.vue'
import GbStats03 from './GbStats03.vue'
import { sectionSuite } from '../bank/suite.js'
import { mountBlock } from '../bank/harness.js'

const variants = { GbStats01, GbStats02, GbStats03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbStats' })
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); document.body.innerHTML = '' })

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbStats${n}]`) && t.includes(`(${code})`))
const ALL = { '01': GbStats01, '02': GbStats02, '03': GbStats03 }

describe('GbStats · cifras quietas y con su origen (#820)', () => {
  it('un GMetric size="lg" por cifra con label, value tal cual, unit y context = source', () => {
    for (const C of Object.values(ALL)) {
      const metrics = run(C).w.findAllComponents(GMetric)
      expect(metrics.map((m) => [m.props('size'), m.props('label'), m.props('value'), m.props('unit'), m.props('context')])).toEqual(
        bank.props.items.map((s) => ['lg', s.label, String(s.value), s.unit, s.source])
      )
    }
  })
  it('la lista: role="list" con listitem g-adapt-short', () => {
    for (const C of Object.values(ALL)) {
      const list = run(C).w.find('[role="list"]').element
      expect([...list.children].every((k) => k.getAttribute('role') === 'listitem' && k.className === 'g-adapt-short')).toBe(true)
    }
  })
  it('02: la raíz es la zona de marca (data-g-zone="brand")', () => {
    const { w } = run(GbStats02)
    expect(w.element.getAttribute('data-g-zone')).toBe('brand')
    expect(w.element.getAttribute('data-gb')).toBe('stats-02')
  })
  it('03: el párrafo junto a las cifras (dos párrafos de description), dentro de g-adapt-wide; la sección sin descripción', () => {
    const { w } = run(GbStats03)
    expect(w.find('.g-section__desc').exists()).toBe(false)
    expect(w.findAll('.g-adapt-wide p')).toHaveLength(2)
  })
  it('03 sin description pinta lo mismo que 01', () => {
    const a = run(GbStats01, { description: undefined }).w.html().replace('stats-01', 'X')
    const b = run(GbStats03, { description: undefined }).w.html().replace('stats-03', 'X')
    expect(b).toBe(a)
  })
  it('el slot description sustituye al párrafo de 03 y a la descripción en 01 y 02', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const { w } = mountBlock(C, { props: bank.props, slots: { description: () => 'DESC' } })
      expect(n === '03' ? w.find('.g-adapt-wide').text() : w.find('.g-section__desc').text()).toBe('DESC')
    }
  })
  it('nada anima: ni requestAnimationFrame ni temporizadores del bloque al montar', () => {
    const raf = vi.spyOn(globalThis, 'requestAnimationFrame')
    const timer = vi.spyOn(globalThis, 'setTimeout')
    const interval = vi.spyOn(globalThis, 'setInterval')
    for (const C of Object.values(ALL)) run(C)
    expect(raf).not.toHaveBeenCalled()
    expect(timer).not.toHaveBeenCalled()
    expect(interval).not.toHaveBeenCalled()
  })
})

describe('GbStats · avisos', () => {
  it('C1: lista vacía no pinta nada', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const { w, warnings } = run(C, { items: [] })
      expect(w.find('[data-gb]').exists()).toBe(false)
      expect(own(warnings, n, 'C1')).toHaveLength(1)
    }
  })
  it('C2: sin label o sin value se omite; C3: id repetido', () => {
    const items = [{ id: 1, value: '1', label: 'A', source: 's' }, { id: 1, value: '2', label: 'B', source: 's' }, { value: '3', source: 's' }, { label: 'D', source: 's' }]
    for (const [n, C] of Object.entries(ALL)) {
      const { w, warnings } = run(C, { items })
      expect(w.findAllComponents(GMetric)).toHaveLength(2)
      expect(own(warnings, n, 'C2')).toHaveLength(2)
      expect(own(warnings, n, 'C3')).toHaveLength(1)
    }
  })
  it('C7: fuera de 2 a 6 se pinta igual y avisa', () => {
    const one = [bank.props.items[0]]
    const seven = Array.from({ length: 7 }, (_, i) => ({ ...bank.props.items[0], id: i }))
    expect(own(run(GbStats01, { items: one }).warnings, '01', 'C7')).toHaveLength(1)
    const { w, warnings } = run(GbStats01, { items: seven })
    expect(w.findAllComponents(GMetric)).toHaveLength(7)
    expect(own(warnings, '01', 'C7')).toHaveLength(1)
  })
  it('S1: una cifra sin source avisa una vez por instancia y se pinta igual', () => {
    const items = bank.props.items.map(({ source, ...s }) => s)
    for (const [n, C] of Object.entries(ALL)) {
      const { w, warnings } = run(C, { items })
      expect(w.findAllComponents(GMetric)).toHaveLength(items.length)
      expect(own(warnings, n, 'S1')).toHaveLength(1)
    }
  })
  it('S2: dos bandas de marca en el documento avisan al montar la segunda', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const first = run(GbStats02, {}, { attachTo: host })
    expect(own(first.warnings, '02', 'S2')).toHaveLength(0)
    const other = document.createElement('div')
    document.body.append(other)
    const second = run(GbStats02, {}, { attachTo: other })
    expect(own(second.warnings, '02', 'S2')).toHaveLength(1)
    first.w.unmount(); second.w.unmount()
  })
})
