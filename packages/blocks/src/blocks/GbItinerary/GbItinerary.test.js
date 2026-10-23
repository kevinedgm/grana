// GbItinerary (dueño: bruno): itinerary.md «Verificación propia» + la batería común de _comun.md §8 y §20.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { GAccordion, GAccordionItem, GCard, GTable } from '@grana/vue'
import meta from './GbItinerary.meta.json'
import * as bank from './itinerary.bank.js'
import * as section from './props.js'
import GbItinerary01 from './GbItinerary01.vue'
import GbItinerary02 from './GbItinerary02.vue'
import GbItinerary03 from './GbItinerary03.vue'
import { sectionSuite } from '../bank/suite.js'
import { mountBlock, ssr } from '../bank/harness.js'
import { markDay, placeNow } from './useItinerary.js'

const variants = { GbItinerary01, GbItinerary02, GbItinerary03 }
// Fuera de la batería común el reloj se fija; dentro, el banco (2026) no coincide con hoy: sin marca
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbItinerary' })

const TZ = process.env.TZ
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); process.env.TZ = TZ; document.body.innerHTML = '' })

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbItinerary${n}]`) && t.includes(`(${code})`))
const ALL = { '01': GbItinerary01, '02': GbItinerary02, '03': GbItinerary03 }
/** Monta y espera el render tras onMounted (la marca se calcula al montar). */
const runM = async (C, props = {}, extra = {}) => { const r = run(C, props, extra); await nextTick(); return r }
const at = (iso) => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(iso)) }

/** La parada marcada como «ahora» (aria-current="time") y las insignias, por variante. */
function marks(w, n) {
  const current = w.findAll('[aria-current="time"]')
  if (n === '03') {
    const cells = w.findAll('td').map((c) => c.text().replace(/^Parada/, '')) // en tarjetas, la celda lleva su cabecera
    return { now: current.map((c) => c.text()), badges: cells.filter((t) => / · (Ahora|Siguiente)$/.test(t)) }
  }
  const cards = w.findAllComponents(GCard)
  return {
    now: current.map((c) => c.find('h3, h4, h5, h6').text()),
    badges: cards.filter((c) => c.props('badge')).map((c) => `${c.props('title')} · ${c.props('badge')}`)
  }
}

describe('GbItinerary · horas y estructura', () => {
  it('01 y 02: ol real con un li (GCard) por parada; 03: una GTable por día', () => {
    for (const C of [GbItinerary01, GbItinerary02]) {
      const { w } = run(C)
      const ols = w.findAll('ol')
      expect(ols).toHaveLength(2)
      expect(ols[0].findAll(':scope > li')).toHaveLength(6)
    }
    const t = run(GbItinerary03).w.findAllComponents(GTable)
    expect(t).toHaveLength(2)
    expect(t[0].props('caption')).toBe('Día 1 · Monte Albán · sábado, 14 de noviembre')
    expect(t[0].props('columns').map((c) => c.label)).toEqual(['Hora', 'Parada', 'Lugar'])
    expect(t[0].props('responsive')).toBe('auto')
  })
  it('las horas en <time datetime="HH:mm"> con el texto del idioma; la fecha del día en <time> ISO', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const { w } = run(C)
      const times = w.findAll('time').map((t) => [t.attributes('datetime'), t.text()])
      expect(times, n).toContainEqual(['07:45', '7:45'])
      if (n !== '03') expect(times, n).toContainEqual(['14:30', '14:30'])
      if (n !== '03') expect(times, n).toContainEqual(['2026-11-14', 'sábado, 14 de noviembre'])
    }
    const en = run(GbItinerary01, { locale: 'en-US' }).w.findAll('time').map((t) => t.text())
    expect(en).toContain('7:45 AM')
  })
  it('01: varios días en GSection anidadas (h3) y las paradas un nivel más (h4); 02: acordeón h3 y paradas h4', () => {
    const one = run(GbItinerary01)
    expect(one.w.findAll('h3').map((x) => x.text())).toEqual(['Día 1 · Monte Albán', 'Día 2 · Mercado'])
    expect(one.w.findAll('h4')).toHaveLength(8)
    const solo = run(GbItinerary01, { days: [bank.props.days[0]] })
    expect(solo.w.findAll('h3')).toHaveLength(6)
    expect(solo.w.find('time[datetime="2026-11-14"]').exists()).toBe(true)
    const acc = run(GbItinerary02)
    expect(acc.w.findComponent(GAccordion).props('headingLevel')).toBe(3)
    expect(acc.w.findComponent(GAccordion).props('arrows')).toBe(true)
    expect(acc.w.findAllComponents(GAccordionItem).map((i) => i.props('peek'))).toEqual(['Zona arqueológica por la mañana y comida en Arrazola', '9:00 · Mercado 20 de Noviembre'])
  })
  it('03 ignora media y description; 01 pinta la foto como <img> en media', () => {
    const t = run(GbItinerary03).w
    expect(t.findAll('img')).toHaveLength(0)
    expect(t.text()).not.toContain('Entramos antes')
    expect(run(GbItinerary01).w.findAll('img')).toHaveLength(1)
  })
})

describe('GbItinerary · «ahora» por la hora del lugar (#874)', () => {
  const cases = [
    ['antes de la primera', '2026-11-14T07:00:00-06:00', [], ['Punto de encuentro · Siguiente']],
    ['durante una parada (Gran Plaza)', '2026-11-14T09:30:00-06:00', ['Gran Plaza'], ['Gran Plaza · Ahora', 'Museo de sitio · Siguiente']],
    ['durante una parada sin end (hasta la siguiente)', '2026-11-14T08:10:00-06:00', ['Punto de encuentro'], ['Punto de encuentro · Ahora', 'Llegada a Monte Albán · Siguiente']],
    ['entre paradas (Gran Plaza terminó a las 10:30)', '2026-11-14T10:35:00-06:00', [], ['Museo de sitio · Siguiente']],
    ['después de la última', '2026-11-14T15:00:00-06:00', [], []],
    ['otro día del recorrido', '2026-11-15T09:10:00-06:00', ['Mercado 20 de Noviembre'], ['Mercado 20 de Noviembre · Ahora', 'Regreso al hotel · Siguiente']],
    ['un día sin recorrido', '2026-11-13T09:30:00-06:00', [], []]
  ]
  for (const [name, iso, now, badges] of cases) {
    it(`${name}: aria-current e insignias en la parada correcta, en las tres`, async () => {
      at(iso)
      for (const [n, C] of Object.entries(ALL)) {
        const { w } = await runM(C)
        const m = marks(w, n)
        expect(m.now, n).toEqual(now)
        expect(m.badges, n).toEqual(badges)
      }
    })
  }
  it('con el navegador en otra zona (America/Toronto) marca por la hora del lugar', async () => {
    process.env.TZ = 'America/Toronto'
    at('2026-11-14T09:30:00-06:00') // 10:30 en Toronto: allí sería «entre paradas»
    expect(new Date().getHours()).toBe(10)
    for (const [n, C] of Object.entries(ALL)) expect(marks((await runM(C)).w, n).now, n).toEqual(['Gran Plaza'])
  })
  it('placeNow y markDay: la hora del lugar y el intervalo [time, end ?? siguiente)', () => {
    expect(placeNow('America/Mexico_City', new Date('2026-11-14T05:30:00Z'))).toEqual({ date: '2026-11-13', minutes: 23 * 60 + 30 })
    const s = [{ key: 'a', start: 60, end: null }, { key: 'b', start: 120, end: 150 }, { key: 'c', start: 200, end: null }]
    expect(markDay(s, 30)).toEqual({ now: null, next: 'a' })
    expect(markDay(s, 90)).toEqual({ now: 'a', next: 'b' })
    expect(markDay(s, 160)).toEqual({ now: null, next: 'c' })
    expect(markDay(s, 300)).toEqual({ now: null, next: null })
  })
  it('sin temporizador: no cambia sola; visibilitychange a visible recalcula', async () => {
    at('2026-11-14T09:30:00-06:00')
    const interval = vi.spyOn(globalThis, 'setInterval')
    const { w } = await runM(GbItinerary01, {}, { attachTo: document.body })
    expect(interval).not.toHaveBeenCalled()
    expect(marks(w, '01').now).toEqual(['Gran Plaza'])
    vi.setSystemTime(new Date('2026-11-14T12:10:00-06:00'))
    await nextTick()
    expect(marks(w, '01').now).toEqual(['Gran Plaza'])
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
    await nextTick()
    expect(marks(w, '01').now).toEqual(['Gran Plaza'])
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
    document.dispatchEvent(new Event('visibilitychange'))
    await nextTick()
    expect(marks(w, '01').now).toEqual(['Taller de alebrijes'])
    w.unmount()
    delete document.visibilityState
  })
  it('02: el día de hoy no se abre solo y su meta dice «Ahora» en texto', async () => {
    at('2026-11-14T09:30:00-06:00')
    const { w } = await runM(GbItinerary02)
    expect(w.findAll('[aria-expanded="true"]')).toHaveLength(0)
    expect(w.findAllComponents(GAccordionItem)[0].text()).toContain('sábado, 14 de noviembre · Ahora')
    expect(w.findAllComponents(GAccordionItem)[1].text()).not.toContain('Ahora')
  })
  it('SSR: sin marca aunque el reloj diga que es hoy (la hora del servidor no es la del lugar)', async () => {
    at('2026-11-14T09:30:00-06:00')
    for (const C of Object.values(ALL)) {
      const { html } = await ssr(C, { props: bank.props })
      expect(html).not.toContain('aria-current')
      expect(html).not.toContain('Ahora')
    }
  })
  it('sin date no hay «ahora»', async () => {
    at('2026-11-14T09:30:00-06:00')
    const days = bank.props.days.map(({ date, ...d }) => d)
    for (const [n, C] of Object.entries(ALL)) expect(marks((await runM(C, { days })).w, n).now).toEqual([])
  })
})

describe('GbItinerary · avisos', () => {
  it('I1 date sin timeZone; I2 time que no es HH:mm (sin «ahora» para esa parada); I3 fuera de orden', () => {
    for (const [n, C] of Object.entries(ALL)) {
      expect(own(run(C, { timeZone: undefined }).warnings, n, 'I1')).toHaveLength(1)
      const bad = [{ ...bank.props.days[0], stops: [{ time: '9 h', title: 'Raro' }, { time: '08:00', title: 'Antes' }, { time: '07:00', title: 'Más antes' }] }]
      const { w, warnings } = run(C, { days: bad })
      expect(own(warnings, n, 'I2')).toHaveLength(1)
      expect(own(warnings, n, 'I3')).toHaveLength(1)
      expect(w.text()).toContain('9 h')
    }
  })
  it('C5: now/next al marcar sin labels (queda aria-current); time/stop/place en 03', async () => {
    at('2026-11-14T09:30:00-06:00')
    for (const [n, C] of Object.entries(ALL)) {
      const { w, warnings } = await runM(C, { labels: { time: 'Hora', stop: 'Parada', place: 'Lugar' } })
      expect(own(warnings, n, 'C5').length).toBeGreaterThanOrEqual(1)
      expect(w.findAll('[aria-current="time"]')).toHaveLength(1)
    }
    vi.useRealTimers()
    expect(own(run(GbItinerary03, { labels: { now: 'Ahora', next: 'Siguiente' } }).warnings, '03', 'C5')).toHaveLength(1)
    expect(own(run(GbItinerary01, { labels: { now: 'Ahora', next: 'Siguiente' } }).warnings, '01', 'C5')).toHaveLength(0)
  })
  it('C1 sin días; C2 parada sin title; C7 más de 14 días', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const e = run(C, { days: [] })
      expect(own(e.warnings, n, 'C1')).toHaveLength(1)
      expect(e.w.find('[data-gb]').exists()).toBe(false)
      expect(own(run(C, { days: [{ label: 'x', stops: [{ time: '09:00' }, { title: 'y' }] }], timeZone: 'America/Mexico_City' }).warnings, n, 'C2')).toHaveLength(1)
      expect(own(run(C, { days: Array.from({ length: 15 }, (_, i) => ({ label: `D${i}`, stops: [{ title: 's' }] })) }).warnings, n, 'C7')).toHaveLength(1)
    }
  })
  it('C4: foto sin width/height (01 y 02; 03 la ignora)', () => {
    const days = [{ label: 'x', stops: [{ title: 'y', media: { src: 'a.jpg', alt: 'a' } }] }]
    expect(own(run(GbItinerary01, { days }).warnings, '01', 'C4')).toHaveLength(1)
    expect(own(run(GbItinerary03, { days }).warnings, '03', 'C4')).toHaveLength(0)
  })
})
