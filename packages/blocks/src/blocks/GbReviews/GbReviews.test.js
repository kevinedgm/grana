// GbReviews (dueño: bruno): reviews.md «Verificación propia» + la batería común de _comun.md §8 y §33.
import { describe, it, expect, afterEach, vi } from 'vitest'
import meta from './GbReviews.meta.json'
import * as bank from './reviews.bank.js'
import * as section from './props.js'
import GbReviews01 from './GbReviews01.vue'
import GbReviews02 from './GbReviews02.vue'
import GbReviews03 from './GbReviews03.vue'
import { sectionSuite } from '../bank/suite.js'
import { click, mountBlock } from '../bank/harness.js'
import { GEmpty, GMetric, GPagination, GProgress } from '@grana/vue'

const variants = { GbReviews01, GbReviews02, GbReviews03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbReviews' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const ALL = Object.entries(variants).map(([k, C]) => [k.slice(-2), C])
const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, attachTo: document.body, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbReviews${n}]`) && t.includes(`(${code})`))
const EN = {
  ...bank.LABELS,
  average: 'Average rating', outOf: 'out of {max}', count: '{count} reviews', score: '{value} out of {max}',
  row: '{value} out of {max}: {count} ({percent})', distribution: 'How they split', bought: 'Bought', verified: 'Verified purchase'
}

describe('GbReviews · la calificación en palabras (#912, #920)', () => {
  it('el resumen es un GMetric con Intl (es-MX y en-US) y la cuenta', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      expect(w.findComponent(GMetric).props()).toMatchObject({ label: 'Calificación media', value: '4.6', unit: 'de 5', context: '128 opiniones' })
      w.unmount()
    }
    const en = run(GbReviews01, { locale: 'en-US', labels: EN })
    expect(en.w.findComponent(GMetric).props()).toMatchObject({ label: 'Average rating', value: '4.6', unit: 'out of 5', context: '128 reviews' })
    const de = run(GbReviews01, { locale: 'de-DE', labels: EN })
    expect(de.w.findComponent(GMetric).props('value')).toBe('4,6')
  })
  it('la puntuación de cada opinión en texto, antes de la cita; sin img, icono ni progressbar en el árbol accesible', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      const fig = w.find('figure')
      expect(fig.element.firstElementChild.textContent).toMatch(/^5 de 5 · Igual que en la foto/)
      expect(fig.element.firstElementChild.nextElementSibling.tagName).toBe('BLOCKQUOTE')
      expect(w.find('img').exists()).toBe(false)
      for (const el of w.element.querySelectorAll('svg, [role="progressbar"]')) expect(el.closest('[aria-hidden="true"]'), el.outerHTML.slice(0, 80)).not.toBeNull()
      w.unmount()
    }
  })
})

describe('GbReviews · la distribución (02)', () => {
  it('todas las filas de 5 a 1, también las de 0, con el porcentaje redondeado y la cuenta tal cual', () => {
    const dist = [{ value: 5, count: 92 }, { value: 4, count: 21 }, { value: 3, count: 15 }]
    const { w } = run(GbReviews02, { summary: { average: 4.6, count: 128, distribution: dist } })
    const ul = w.find('ul[aria-label="Cómo se reparten"]')
    expect(ul.exists()).toBe(true)
    const rows = ul.findAll(':scope > li').map((li) => li.find('p').text())
    const pct = (x) => new Intl.NumberFormat('es-MX', { style: 'percent', maximumFractionDigits: 0 }).format(x)
    expect(rows).toEqual([`5 de 5: 92 (${pct(0.72)})`, `4 de 5: 21 (${pct(0.16)})`, `3 de 5: 15 (${pct(0.12)})`, `2 de 5: 0 (${pct(0)})`, `1 de 5: 0 (${pct(0)})`])
  })
  it('las barras son GProgress decorativas dentro de un div aria-hidden, con max = summary.count', () => {
    const { w } = run(GbReviews02)
    const bars = w.findAllComponents(GProgress)
    expect(bars).toHaveLength(5)
    for (const b of bars) {
      expect(b.element.closest('[aria-hidden="true"]')).not.toBeNull()
      expect(b.props()).toMatchObject({ max: 128, showLabel: false, showValue: false, size: 'sm', color: 'neutral' })
    }
    expect(bars[0].props('value')).toBe(92)
  })
  it('01 y 03 ignoran la distribución', () => {
    for (const C of [GbReviews01, GbReviews03]) {
      const { w } = run(C)
      expect(w.findComponent(GProgress).exists()).toBe(false)
      w.unmount()
    }
  })
})

describe('GbReviews · cada opinión', () => {
  it('la cita entera en su idioma; time con datetime; lo que compró y la compra verificada en el pie', () => {
    const { w } = run(GbReviews01)
    const quotes = w.findAll('blockquote')
    expect(quotes[1].attributes('lang')).toBe('en')
    expect(quotes[1].findAll('p')).toHaveLength(2)
    expect(quotes[1].attributes('cite')).toBe(bank.REVIEWS[1].source.href)
    expect(quotes[3].text()).toContain(bank.REVIEWS[3].quote.slice(-30))
    const t = w.find('figcaption time')
    expect(t.attributes('datetime')).toBe('2026-10-12')
    expect(t.text()).toBe('12 de octubre de 2026')
    const cap = w.find('figcaption').text()
    expect(cap).toContain('Compra verificada')
    expect(cap).toContain('Compró Talla M · Color Grana')
    expect(w.findAll('figcaption')[3].text()).toContain('Compra en la tienda de Oaxaca')
  })
  it('la respuesta de la tienda va después de la figure, fuera de ella, con su autor y su fecha', () => {
    const { w } = run(GbReviews01)
    const li = w.findAll('ul.g-stack > li')[2]
    const fig = li.find('figure')
    const reply = fig.element.nextElementSibling
    expect(reply).not.toBeNull()
    expect(fig.element.contains(reply)).toBe(false)
    expect(reply.textContent).toContain('Respuesta de Barro y Agave')
    expect(reply.querySelector('time').getAttribute('datetime')).toBe('2026-09-03')
  })
  it('03: cada tarjeta es un group nombrado por el autor', () => {
    const { w } = run(GbReviews03)
    const card = w.find('[role="listitem"] [role="group"]')
    const id = card.attributes('aria-labelledby')
    expect(document.getElementById(id).textContent).toBe('Mariana López')
  })
  it('la fuente externa no navega; la acción sí (navigate) y sin href activa', () => {
    const onNavigate = vi.fn((p) => p.event.preventDefault())
    const { w } = run(GbReviews01, { onNavigate })
    const ext = w.findAll('a.g-btn').find((a) => a.text().startsWith('Google'))
    expect(ext.attributes('target')).toBe('_blank')
    ext.element.dispatchEvent(click())
    expect(onNavigate).not.toHaveBeenCalled()
    const act = w.findAll('a.g-btn').find((a) => a.text() === 'Escribir una opinión')
    act.element.dispatchEvent(click())
    expect(onNavigate).toHaveBeenCalledTimes(1)
    const onActivate = vi.fn()
    const x = run(GbReviews01, { onActivate, action: { label: 'Escribir una opinión' } })
    x.w.findAll('button.g-btn').find((b) => b.text() === 'Escribir una opinión').element.dispatchEvent(click())
    expect(onActivate).toHaveBeenCalledTimes(1)
  })
  it('la paginación emite update:page', () => {
    const onPage = vi.fn()
    const { w } = run(GbReviews02, { 'onUpdate:page': onPage })
    w.findComponent(GPagination).vm.$emit('update:page', 3)
    expect(onPage).toHaveBeenCalledWith(3)
  })
})

describe('GbReviews · vacío y avisos', () => {
  it('sin opiniones (summary count 0): GEmpty con labels.noReviews y la acción en su slot, sin aviso C1', () => {
    for (const [n, C] of ALL) {
      const { w, warnings } = run(C, bank.states.vacio)
      const e = w.findComponent(GEmpty)
      expect(e.props()).toMatchObject({ cause: 'none', title: 'Todavía sin opiniones' })
      expect(e.text()).toContain('Escribir una opinión')
      expect(w.text()).not.toMatch(/0 de 5/)
      expect(own(warnings, n, 'C1')).toHaveLength(0)
      w.unmount()
    }
  })
  it('C1 sin opiniones ni summary; C2 opinión sin rating; RV1 rating fuera de rango; RV2 suma distinta; RV3 cita larga; EC2', () => {
    const e = run(GbReviews01, { summary: undefined, reviews: [] })
    expect(own(e.warnings, '01', 'C1')).toHaveLength(1)
    const bad = [{ ...bank.REVIEWS[0], rating: undefined }, { ...bank.REVIEWS[1], rating: 7 }, { ...bank.REVIEWS[4], id: 'r9', quote: 'x'.repeat(1201) }]
    const { w, warnings } = run(GbReviews02, { reviews: bad, summary: { average: 4.6, count: 100, distribution: bank.props.summary.distribution } })
    expect(own(warnings, '02', 'C2')).toHaveLength(1)
    expect(own(warnings, '02', 'RV1')).toHaveLength(1)
    expect(own(warnings, '02', 'RV2')).toHaveLength(1)
    expect(own(warnings, '02', 'RV3')).toHaveLength(1)
    expect(w.findAll('figure')).toHaveLength(2)
    const x = run(GbReviews01, { summary: { average: 7, count: 3 } })
    expect(own(x.warnings, '01', 'EC2')).toHaveLength(1)
    expect(x.w.findComponent(GMetric).exists()).toBe(false)
  })
})
