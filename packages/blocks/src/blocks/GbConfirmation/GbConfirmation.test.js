// GbConfirmation (dueño: bruno): confirmation.md «Verificación propia» + la batería común de _comun.md §8 y §20.
import { describe, it, expect, afterEach, vi } from 'vitest'
import meta from './GbConfirmation.meta.json'
import * as bank from './confirmation.bank.js'
import * as section from './props.js'
import GbConfirmation01 from './GbConfirmation01.vue'
import GbConfirmation02 from './GbConfirmation02.vue'
import GbConfirmation03 from './GbConfirmation03.vue'
import { sectionSuite } from '../bank/suite.js'

const variants = { GbConfirmation01, GbConfirmation02, GbConfirmation03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbConfirmation' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

import { GBtn, GCard, GMetric, GStepper, GSummary, GText } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import { describeQuery } from '@grana/vue/booking'
import { click, mountBlock } from '../bank/harness.js'
import { PARTY_ROWS, QUERY, QUERY_LABELS } from '../bank/booking.js'

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, icons: bank.appIcons, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbConfirmation${n}]`) && t.includes(`(${code})`))
const ALL = Object.entries(variants).map(([k, C]) => [k.slice(-2), C])
const TEXT = describeQuery(QUERY, { partyRows: PARTY_ROWS, locale: 'es', labels: QUERY_LABELS }).text

describe('GbConfirmation · lo confirmado', () => {
  it('el código es el primer dato tras el título (GMetric, sin partir)', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      const m = w.findComponent(GMetric)
      expect(m.props('value')).toBe('CA-7K29Q')
      expect(m.props('label')).toBe('Código de reserva')
      const all = [...w.element.querySelectorAll('h2, .g-metric, .g-summary, .g-price')]
      const h = all.findIndex((e) => e.tagName === 'H2')
      expect(all[h + 1].classList.contains('g-metric')).toBe(true)
    }
  })
  it('la ficha dice la consulta con describeQuery (el hilo)', () => {
    for (const [, C] of ALL) {
      const s = run(C).w.findComponent(GSummary)
      expect(s.props('title')).toBe('Suite Jardín')
      expect(s.props('facts')).toEqual([{ label: 'Cuándo y quiénes', value: TEXT, priority: 1 }])
    }
  })
  it('estado en texto: insignia en 01 y 03 (success/warning), GText en 02; F1 pinta requested', () => {
    for (const [n, C] of ALL) {
      for (const [state, text, color] of [['confirmed', 'Confirmada', 'success'], ['requested', 'Pendiente de confirmar', 'warning']]) {
        const { w } = run(C, { state })
        if (n === '02') expect(w.findAllComponents(GText).some((t) => t.text() === text)).toBe(true)
        else {
          expect(w.findComponent(GCard).props('badge')).toBe(text)
          expect(w.findComponent(GCard).props('badgeColor')).toBe(color)
        }
      }
      const { w, warnings } = run(C, { state: 'pagada' })
      expect(own(warnings, n, 'F1')).toHaveLength(1)
      expect(w.text()).toContain('Pendiente de confirmar')
      expect(w.text()).not.toContain('Confirmada')
    }
  })
  it('el total de la aplicación con su unidad; líneas en dl en 01 y 02, no en 03', () => {
    for (const [n, C] of ALL) {
      const { w } = run(C)
      const p = w.findAllComponents(GPrice)[0]
      expect(p.props('value')).toEqual(bank.props.totals.total.value)
      expect(p.props('unit')).toBe('por 2 noches')
      expect(p.props('lead')).toBe('Total')
      expect(w.findAll('dl dt').length).toBe(n === '03' ? 0 : 2)
      expect(w.text()).toContain('Pagas al llegar')
    }
  })
  it('02: GStepper vertical informativo con next; las fechas en <time> en la zona del lugar', () => {
    const { w } = run(GbConfirmation02)
    const s = w.findComponent(GStepper)
    expect(s.props('orientation')).toBe('vertical')
    expect(s.props('navigation')).toBe('none')
    expect(s.props('steps').map((x) => x.label)).toEqual(['Llegada', 'Registro', 'Desayuno'])
    expect(s.props('modelValue')).toBe(s.props('steps')[0].id)
    expect(s.findAll('button').length).toBe(0)
    const t = w.find('time')
    expect(t.attributes('datetime')).toBe('2026-11-13T15:00:00-06:00')
    expect(t.text()).toMatch(/viernes, 13 de noviembre.*15:00/)
    for (const C of [GbConfirmation01, GbConfirmation03]) expect(run(C).w.findComponent(GStepper).exists()).toBe(false)
  })
  it('03: sin foto, sin next ni líneas; 01 con la foto', () => {
    expect(run(GbConfirmation03).w.findAll('img')).toHaveLength(0)
    expect(run(GbConfirmation01).w.findAll('img')).toHaveLength(1)
  })
  it('canales: tel:/mailto: sin navigate; el externo con su nombre; lista con nombre', () => {
    for (const [, C] of ALL) {
      const onNavigate = vi.fn()
      const { w } = run(C, { onNavigate }, { attachTo: document.body })
      const ul = w.find('ul[aria-label="Escríbenos"]')
      expect(ul.exists()).toBe(true)
      for (const a of ul.findAll('a')) a.element.addEventListener('click', (e) => e.preventDefault())
      for (const a of ul.findAll('a')) a.element.dispatchEvent(click())
      expect(onNavigate).not.toHaveBeenCalled()
      expect(ul.find('a[target="_blank"]').attributes('aria-label')).toBe('WhatsApp, se abre en otra pestaña')
      w.unmount()
    }
  })
  it('«Compartir» (sin href) emite activate síncrono; «Añadir al calendario» navigate', () => {
    for (const [, C] of ALL) {
      const onActivate = vi.fn()
      const onNavigate = vi.fn((p) => p.event.preventDefault())
      const { w } = run(C, { onActivate, onNavigate }, { attachTo: document.body })
      const btns = w.findAll('.g-btn').filter((b) => ['Compartir', 'Añadir al calendario'].includes(b.text()))
      btns.find((b) => b.text() === 'Compartir').element.dispatchEvent(click())
      expect(onActivate).toHaveBeenCalledTimes(1)
      expect(onActivate.mock.calls[0][0].item.id).toBe('compartir')
      btns.find((b) => b.text() === 'Añadir al calendario').element.dispatchEvent(click())
      expect(onNavigate.mock.calls[0][0].href).toBe('/reservas/CA-7K29Q.ics')
      w.unmount()
    }
  })
})

describe('GbConfirmation · avisos', () => {
  it('F2: código vacío (sin GMetric); F3: 03 con más de dos acciones', () => {
    for (const [n, C] of ALL) {
      const { w, warnings } = run(C, { reference: { code: '', label: 'Código' } })
      expect(own(warnings, n, 'F2')).toHaveLength(1)
      expect(w.findComponent(GMetric).exists()).toBe(false)
    }
    const three = [...bank.props.actions, { label: 'Cómo llegar', href: '/llegar' }]
    expect(own(run(GbConfirmation03, { actions: three }).warnings, '03', 'F3')).toHaveLength(1)
    expect(own(run(GbConfirmation01, { actions: three }).warnings, '01', 'C8')).toHaveLength(1)
  })
  it('K2 sin labels.query; C5 sin labels.states', () => {
    for (const [n, C] of ALL) {
      expect(own(run(C, { labels: { ...bank.props.labels, query: undefined } }).warnings, n, 'K2')).toHaveLength(1)
      expect(own(run(C, { labels: { ...bank.props.labels, states: undefined } }).warnings, n, 'C5')).toHaveLength(1)
    }
  })
})
