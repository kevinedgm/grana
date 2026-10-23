// GbPromo (dueño: bruno): promo.md «Verificación propia» + la batería común de _comun.md §8 y §33.
import { describe, it, expect, afterEach, vi } from 'vitest'
import meta from './GbPromo.meta.json'
import * as bank from './promo.bank.js'
import * as section from './props.js'
import GbPromo01 from './GbPromo01.vue'
import GbPromo02 from './GbPromo02.vue'
import GbPromo03 from './GbPromo03.vue'
import { sectionSuite } from '../bank/suite.js'

const variants = { GbPromo01, GbPromo02, GbPromo03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbPromo', headless: ['GbPromo03'] })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

import { beforeAll, afterAll } from 'vitest'
import { GBtn, GCard, GSurface } from '@grana/vue'
import { mountBlock } from '../bank/harness.js'

// La oferta vale hasta el 2 de noviembre de 2026: las pruebas fijan «hoy» (EC7 no depende del día en que corran)
beforeAll(() => { vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-23T18:00:00Z') }) })
afterAll(() => { vi.useRealTimers() })
const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbPromo${n}]`) && t.includes(`(${code})`))
const ALL = Object.entries(variants).map(([k, C]) => [k.slice(-2), C])

describe('GbPromo · la fecha, no un reloj (#925)', () => {
  it('until en <time datetime> con la frase y el día de la tienda', () => {
    for (const [, C] of ALL) {
      const t = run(C).w.find('time')
      expect(t.attributes('datetime')).toBe('2026-11-02T23:59')
      expect(t.text()).toBe('lunes, 2 de noviembre')
      expect(t.element.parentElement.textContent).toContain('Hasta el lunes, 2 de noviembre')
    }
  })
  it('con zona (Z) se dice en la de la tienda, también con el sistema en otra zona', () => {
    const tz = process.env.TZ
    try {
      process.env.TZ = 'Asia/Tokyo'
      const t = run(GbPromo01, { until: '2026-11-03T05:59:00Z' }).w.find('time')
      expect(t.text()).toBe('lunes, 2 de noviembre')
      // Sin zona: el día escrito, sea cual sea la del sistema
      expect(run(GbPromo01).w.find('time').text()).toBe('lunes, 2 de noviembre')
    } finally { process.env.TZ = tz }
  })
  it('ningún temporizador al montar', () => {
    const si = vi.spyOn(globalThis, 'setInterval')
    const st = vi.spyOn(globalThis, 'setTimeout')
    for (const [, C] of ALL) run(C)
    expect(si).not.toHaveBeenCalled()
    expect(st).not.toHaveBeenCalled()
  })
  it('EC7 con until pasado (se pinta igual) y PM1 con until que no es ISO (sin fecha)', () => {
    const past = run(GbPromo01, { until: '2026-10-01' })
    expect(own(past.warnings, '01', 'EC7')).toHaveLength(1)
    expect(past.w.find('time').exists()).toBe(true)
    const bad = run(GbPromo02, { until: '2 de noviembre' })
    expect(own(bad.warnings, '02', 'PM1')).toHaveLength(1)
    expect(bad.w.find('time').exists()).toBe(false)
  })
})

describe('GbPromo · el código y las condiciones', () => {
  it('«Copiar código» emite activate con el código, síncrono en el gesto; el valor con translate="no"', () => {
    for (const [, C] of ALL) {
      const onActivate = vi.fn()
      const { w } = run(C, { onActivate })
      expect(w.find('[translate="no"]').text()).toBe('OAXACA10')
      const b = w.findAll('button.g-btn').find((x) => x.text() === 'Copiar código')
      b.element.click()
      expect(onActivate).toHaveBeenCalledTimes(1)
      expect(onActivate.mock.calls[0][0].item).toBe(bank.props.code)
    }
  })
  it('las condiciones a la vista y en el aria-describedby de la principal', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      const terms = w.findAll('.g-text').find((t) => t.text() === bank.props.terms)
      expect(terms.attributes('id')).toBeTruthy()
      const main = w.findAll('a.g-btn')[0]
      expect(main.text()).toBe('Ver el barro negro')
      expect(main.attributes('aria-describedby')).toBe(terms.attributes('id'))
    }
  })
  it('acciones: 01 y 02 solid + outline; 03 una sola, link, dentro de un grupo con nombre y sin encabezado', () => {
    for (const C of [GbPromo01, GbPromo02]) expect(run(C).w.findAllComponents(GBtn).filter((b) => b.text() !== 'Copiar código').map((b) => b.props('variant'))).toEqual(['solid', 'outline'])
    const w3 = run(GbPromo03).w
    expect(w3.element.getAttribute('role')).toBe('group')
    expect(w3.element.getAttribute('aria-label')).toBe(bank.props.title)
    expect(w3.findAll('h1, h2, h3, h4, h5, h6')).toHaveLength(0)
    expect(w3.findAllComponents(GBtn).filter((b) => b.text() !== 'Copiar código').map((b) => b.props('variant'))).toEqual(['link'])
  })
  it('formas: 01 banda de marca plana, 02 tarjeta con la foto de fondo, 01 y 03 ignoran media', () => {
    expect(run(GbPromo01).w.findComponent(GSurface).props()).toMatchObject({ zone: 'brand', level: 'flat' })
    expect(run(GbPromo02).w.findComponent(GCard).props()).toMatchObject({ mediaPosition: 'background', as: 'section' })
    expect(run(GbPromo02).w.find('img').exists()).toBe(true)
    for (const C of [GbPromo01, GbPromo03]) expect(run(C).w.find('img').exists()).toBe(false)
  })
  it('C5 sin labels.until (la fecha sin frase) y sin labels.copy (sin botón)', () => {
    const { w, warnings } = run(GbPromo02, { labels: {} })
    expect(own(warnings, '02', 'C5')).toHaveLength(2)
    expect(w.find('time').element.parentElement.textContent.trim()).toBe('lunes, 2 de noviembre')
    expect(w.findAll('button.g-btn').some((b) => b.text() === 'Copiar código')).toBe(false)
  })
})
