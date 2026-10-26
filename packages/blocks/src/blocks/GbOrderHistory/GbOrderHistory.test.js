// GbOrderHistory (dueño: bruno): order-history.md «Verificación propia» + la batería común de _comun.md §8 y §33.
import { describe, it, expect, afterEach, vi } from 'vitest'
import meta from './GbOrderHistory.meta.json'
import * as bank from './order-history.bank.js'
import * as section from './props.js'
import GbOrderHistory01 from './GbOrderHistory01.vue'
import GbOrderHistory02 from './GbOrderHistory02.vue'
import GbOrderHistory03 from './GbOrderHistory03.vue'
import { sectionSuite } from '../bank/suite.js'

const variants = { GbOrderHistory01, GbOrderHistory02, GbOrderHistory03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbOrderHistory' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

import { nextTick } from 'vue'
import { GBadge, GCard, GEmpty, GStepper, GTable } from '@grana/vue'
import { GPrice, GPriceScope } from '@grana/vue/price'
import { click, mountBlock } from '../bank/harness.js'
import { ORDERS } from '../bank/ecommerce.js'

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbOrderHistory${n}]`) && t.includes(`(${code})`))
const COLORS = { pending: 'neutral', preparing: 'neutral', shipped: 'info', delivered: 'success', cancelled: 'warning' }
const NO_LINES = ORDERS.map(({ lines, ...o }) => o)

describe('GbOrderHistory · el estado se dice en palabras y con su color (order-history.md «El estado»)', () => {
  it('01: GBadge soft con statusText y el color por estado; el cancelado lleva rowStatus warning en la celda del estado', () => {
    const { w } = run(GbOrderHistory01)
    const badges = w.findAllComponents(GBadge).filter((b) => b.element.closest('td') && !b.element.closest('.g-table__composite'))
    for (const o of ORDERS) {
      const b = badges.find((x) => x.text() === o.statusText)
      expect(b, o.statusText).toBeTruthy()
      expect(b.props('color')).toBe(COLORS[o.status])
      expect(b.props('variant')).toBe('soft')
    }
    const cancelled = [...w.element.querySelectorAll('tr.g-table__row')].find((tr) => tr.textContent.includes('BYA-2610-03'))
    expect(cancelled.getAttribute('data-status')).toBe('warning')
  })
  it('02 y 03: la tarjeta con el código como título, el estado como badge con su texto y su color', () => {
    for (const C of [GbOrderHistory02, GbOrderHistory03]) {
      const { w } = run(C)
      const cards = w.findAllComponents(GCard)
      expect(cards).toHaveLength(ORDERS.length)
      for (const [i, o] of ORDERS.entries()) {
        expect(cards[i].props('title')).toBe(o.reference.code)
        expect(cards[i].props('badge')).toBe(o.statusText)
        expect(cards[i].props('badgeColor')).toBe(COLORS[o.status])
      }
    }
  })
})

describe('GbOrderHistory02 · el seguimiento', () => {
  it('GStepper informativo (navigation none, dot) con la fecha de cada paso; solo el enviado; el cancelado sin pasos', () => {
    const { w } = run(GbOrderHistory02)
    const steppers = w.findAllComponents(GStepper)
    expect(steppers).toHaveLength(1)
    const s = steppers[0]
    expect(s.props('navigation')).toBe('none')
    expect(s.props('indicator')).toBe('dot')
    expect(s.props('modelValue')).toBe('enviado')
    expect(s.attributes('aria-label')).toBe('Seguimiento del pedido BYA-2611-07')
    expect(s.props('steps')[0].description).toMatch(/7 de noviembre/)
    const withProgress = ORDERS.map((o) => (o.status === 'cancelled' ? { ...o, progress: ORDERS[2].progress } : o))
    expect(run(GbOrderHistory02, { orders: withProgress }).w.findAllComponents(GStepper)).toHaveLength(1)
  })
  it('OH2: un progress.current que no está en sus pasos no pinta GStepper', () => {
    const bad = ORDERS.map((o) => (o.progress ? { ...o, progress: { ...o.progress, current: 'perdido' } } : o))
    const { w, warnings } = run(GbOrderHistory02, { orders: bad })
    expect(w.findAllComponents(GStepper)).toHaveLength(0)
    expect(own(warnings, '02', 'OH2')).toHaveLength(1)
  })
  it('el transportista externo: enlace con target _blank, nombre con «se abre en otra pestaña» y sin navigate', () => {
    const onNavigate = vi.fn()
    const { w } = run(GbOrderHistory02, { onNavigate }, { attachTo: document.body })
    const a = w.find('a[target="_blank"]')
    expect(a.attributes('aria-label')).toBe('Seguir el envío, se abre en otra pestaña')
    a.element.dispatchEvent(click())
    expect(onNavigate).not.toHaveBeenCalled()
  })
})

describe('GbOrderHistory · abrir un pedido', () => {
  it('01 sin lo comprado: rowHref y activatable; la fila sin href emite open con el pedido', async () => {
    const onOpen = vi.fn()
    const onNavigate = vi.fn((p) => p.event.preventDefault())
    const { w } = run(GbOrderHistory01, { orders: NO_LINES, onOpen, onNavigate }, { attachTo: document.body })
    const t = w.findComponent(GTable)
    expect(t.props('activatable')).toBe(true)
    const btn = [...w.element.querySelectorAll('tr.g-table__row button')].find((b) => b.textContent.includes('BYA-2610-21'))
    btn.click()
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onOpen.mock.calls[0][0].order).toBe(NO_LINES[3])
    const a = [...w.element.querySelectorAll('tr.g-table__row a')].find((x) => x.textContent.includes('BYA-2611-12'))
    a.dispatchEvent(click())
    expect(onNavigate.mock.calls[0][0]).toMatchObject({ href: NO_LINES[0].href, item: NO_LINES[0] })
  })
  it('01 con lo comprado: el slot detail despliega lo comprado y «Ver el pedido {reference}» (open sin href)', async () => {
    const onOpen = vi.fn()
    const { w } = run(GbOrderHistory01, { onOpen }, { attachTo: document.body })
    expect(w.findComponent(GTable).props('activatable')).toBe(false)
    const door = [...w.element.querySelectorAll('tr.g-table__row button')].find((b) => b.textContent.includes('BYA-2610-21'))
    door.click()
    await nextTick()
    await nextTick()
    const detail = w.element.querySelector('.g-table__detail')
    expect(detail.textContent).toContain('Stone-ground Oaxacan chocolate')
    expect(detail.querySelector('[lang="en"]')).toBeTruthy()
    const open = [...detail.querySelectorAll('button')].find((b) => b.textContent === 'Ver el pedido BYA-2610-21')
    open.click()
    expect(onOpen.mock.calls[0][0].order).toBe(ORDERS[3])
  })
  it('02: la tarjeta sin href es botón (open); con href, enlace (navigate con item = el pedido)', async () => {
    const onOpen = vi.fn()
    const onNavigate = vi.fn((p) => p.event.preventDefault())
    const { w } = run(GbOrderHistory02, { onOpen, onNavigate }, { attachTo: document.body })
    const cards = w.findAllComponents(GCard)
    expect(cards[3].props('interaction')).toBe('button')
    await cards[3].find('button.g-card__primary').trigger('click')
    expect(onOpen.mock.calls[0][0].order).toBe(ORDERS[3])
    cards[0].find('a.g-card__primary').element.dispatchEvent(click())
    expect(onNavigate.mock.calls[0][0]).toMatchObject({ href: ORDERS[0].href, item: ORDERS[0] })
  })
})

describe('GbOrderHistory · fechas, precios, estados de carga', () => {
  it('la fecha en <time datetime> (ISO tal cual) y el pedido en USD con su código dentro de la región MXN', () => {
    for (const C of [GbOrderHistory01, GbOrderHistory02, GbOrderHistory03]) {
      const { w } = run(C)
      const times = w.findAll('time').map((t) => t.attributes('datetime'))
      for (const o of ORDERS) expect(times).toContain(o.placedAt)
      expect(w.findAllComponents(GPriceScope)).toHaveLength(1)
      const usd = w.findAllComponents(GPrice).find((p) => p.props('value') && p.props('value').currency === 'USD')
      expect(usd.text()).toMatch(/USD|US\$/)
    }
  })
  it('vacío: GEmpty con labels.empty (01 en el slot de GTable; 02 y 03 en la región)', () => {
    for (const C of [GbOrderHistory01, GbOrderHistory02, GbOrderHistory03]) {
      const { w } = run(C, bank.states.vacio)
      const e = w.findComponent(GEmpty)
      expect(e.exists()).toBe(true)
      expect(e.props('title')).toBe(bank.props.labels.empty.title)
    }
  })
  it('02 y 03: el fallo sin nada conocido pinta GEmpty error con «Reintentar» que emite retry', async () => {
    for (const C of [GbOrderHistory02, GbOrderHistory03]) {
      const onRetry = vi.fn()
      const { w } = run(C, { ...bank.states.error, onRetry })
      const e = w.findComponent(GEmpty)
      expect(e.props('cause')).toBe('error')
      expect(e.props('title')).toBe(bank.states.error.error)
      await e.find('button').trigger('click')
      expect(onRetry).toHaveBeenCalledWith({ event: null })
    }
  })
  it('paginación: update:page de GPagination (02, 03) y de GTable (01)', async () => {
    for (const C of [GbOrderHistory02, GbOrderHistory03]) {
      const onPage = vi.fn()
      const { w } = run(C, { 'onUpdate:page': onPage })
      const next = [...w.element.querySelectorAll('nav button')].find((b) => b.getAttribute('aria-label') === 'Página 2' || b.textContent.trim() === '2')
      next.click()
      expect(onPage).toHaveBeenCalledWith(2)
    }
    expect(run(GbOrderHistory01).w.findComponent(GTable).props('total')).toBe(12)
  })
})

describe('GbOrderHistory · avisos propios', () => {
  it('OH1 con un status fuera de la lista (neutral con su texto); EC5 sin id; EC1 sin prices; una vez', () => {
    const odd = ORDERS.map((o, i) => (i === 0 ? { ...o, status: 'lost' } : i === 1 ? { ...o, id: undefined } : o))
    const { w, warnings } = run(GbOrderHistory03, { orders: odd, prices: undefined })
    expect(own(warnings, '03', 'OH1')).toHaveLength(1)
    expect(own(warnings, '03', 'EC5')).toHaveLength(1)
    expect(own(warnings, '03', 'EC1')).toHaveLength(1)
    expect(w.findAllComponents(GCard)[0].props('badgeColor')).toBe('neutral')
  })
  it('C5 sin labels.tracking (01 y 02, no 03) y sin labels.progress (02)', () => {
    const labels = { ...bank.props.labels, tracking: undefined, progress: undefined }
    expect(own(run(GbOrderHistory02, { labels }).warnings, '02', 'C5')).toHaveLength(2)
    expect(own(run(GbOrderHistory01, { labels }).warnings, '01', 'C5')).toHaveLength(1)
    expect(own(run(GbOrderHistory03, { labels }).warnings, '03', 'C5')).toHaveLength(0)
  })
})
