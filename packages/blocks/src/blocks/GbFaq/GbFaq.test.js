// GbFaq (dueño: bruno): faq.md «Verificación propia» + la batería común de _comun.md §8.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h, nextTick } from 'vue'
import { GAccordion, GAccordionItem, GEmpty, GInput, GSection } from '@grana/vue'
import meta from './GbFaq.meta.json'
import * as bank from './faq.bank.js'
import * as section from './props.js'
import GbFaq01 from './GbFaq01.vue'
import GbFaq02 from './GbFaq02.vue'
import GbFaq03 from './GbFaq03.vue'
import { sectionSuite } from '../bank/suite.js'
import { mountBlock } from '../bank/harness.js'
import { paragraphs } from '../common/text.js'

const variants = { GbFaq01, GbFaq02, GbFaq03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbFaq' })
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); document.body.innerHTML = '' })

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbFaq${n}]`) && t.includes(`(${code})`))
const ALL = { '01': GbFaq01, '02': GbFaq02, '03': GbFaq03 }
const ITEMS = bank.props.items
const N = ITEMS.length
const type = async (w, text) => { await w.find('input[type="search"]').setValue(text) }
const visible = (w) => w.findAllComponents(GAccordionItem).map((i) => i.props('id'))

describe('GbFaq · cada respuesta tiene su enlace, y asoma cerrada (#823)', () => {
  it('01 y 03: un GAccordionItem por pregunta con id = faq.id en el elemento, title = question y peek = primer párrafo', () => {
    for (const C of [GbFaq01, GbFaq03]) {
      const { w } = run(C)
      const items = w.findAllComponents(GAccordionItem)
      expect(items.map((i) => [i.props('id'), i.props('title'), i.props('peek')])).toEqual(ITEMS.map((f) => [f.id, f.question, paragraphs(f.answer)[0]]))
      for (const f of ITEMS) expect(w.find(`[id="${f.id}"]`).classes()).toContain('g-accordion-item')
      // La respuesta entera en el panel, en párrafos
      expect(items[2].findAll('.g-accordion-item__content p').map((p) => p.text())).toEqual(paragraphs(ITEMS[2].answer))
    }
  })
  it('01 y 03: cerradas al montar y el acordeón un nivel por debajo (h3; h4 dentro de una GSection de la aplicación)', () => {
    for (const C of [GbFaq01, GbFaq03]) {
      const { w } = run(C)
      expect(w.findComponent(GAccordion).props('headingLevel')).toBe(3)
      expect(w.findAll('[aria-expanded="true"]')).toHaveLength(0)
      expect(w.findAll('h3')).toHaveLength(N)
      const nested = run(C, {}, { wrap: (render) => h(GSection, { title: 'Página' }, render) })
      expect(nested.w.find('[data-gb]').findAll('h4')).toHaveLength(N)
    }
  })
  it('02: GContainer reading alineado al inicio, no centrado (MK-B2)', () => {
    const { w } = run(GbFaq02)
    expect(w.find('.g-container--width-reading').classes()).toContain('g-container--horizontal-start')
  })
  it('02: GContainer reading › ul divided › li › GSection anidada con id = faq.id y su h3', () => {
    const { w } = run(GbFaq02)
    const lis = w.findAll('ul > li')
    expect(lis).toHaveLength(N)
    lis.forEach((li, i) => {
      const sec = li.element.firstElementChild
      expect(sec.tagName).toBe('SECTION')
      expect(sec.id).toBe(ITEMS[i].id)
      expect(sec.querySelector('h3').textContent).toContain(ITEMS[i].question)
    })
    expect(w.findAll(`[id="llegada"] p`).map((p) => p.text())).toEqual(paragraphs(ITEMS[2].answer))
  })
  it('slot answer: contenido rico de la respuesta; el peek sigue saliendo de answer', () => {
    for (const C of Object.values(ALL)) {
      const { w } = mountBlock(C, { props: bank.props, slots: { answer: ({ item }) => h('p', null, `RICO ${item.id}`) } })
      expect(w.text()).toContain('RICO mascotas')
      if (C !== GbFaq02) expect(w.findComponent(GAccordionItem).props('peek')).toBe(paragraphs(ITEMS[0].answer)[0])
    }
  })
})

describe('GbFaq03 · el buscador', () => {
  it('GInput type="search" con label = labels.search, el output presente y vacío al montar, sin form', () => {
    const { w } = run(GbFaq03)
    const input = w.findComponent(GInput)
    expect([input.props('type'), input.props('label'), input.props('output')]).toEqual(['search', bank.props.labels.search, ''])
    expect(w.find('output').exists()).toBe(true)
    expect(w.find('form').exists()).toBe(false)
  })
  it('coincide sin mayúsculas ni diacríticos, en la pregunta o en la respuesta', async () => {
    const { w } = run(GbFaq03)
    for (const [q, ids] of [['mascota', ['mascotas']], ['MASCOTA', ['mascotas']], ['nino', ['ninos']], ['NIÑO', ['ninos']], ['english', ['idiomas']], ['  ', ITEMS.map((f) => f.id)]]) {
      await type(w, q)
      expect(visible(w), q).toEqual(ids)
    }
  })
  it('las que no coinciden no se pintan; las abiertas siguen abiertas y ninguna se abre sola', async () => {
    const { w } = run(GbFaq03, {}, { attachTo: document.body })
    await w.findAll('.g-accordion-item__toggle')[0].trigger('click')
    await nextTick()
    expect(w.find('[id="mascotas"] [aria-expanded="true"]').exists()).toBe(true)
    await type(w, 'a')
    expect(w.findAll('[aria-expanded="true"]')).toHaveLength(1)
    await type(w, 'nino')
    expect(w.find('[id="mascotas"]').exists()).toBe(false)
    expect(w.findAll('[aria-expanded="true"]')).toHaveLength(0)
    await type(w, '')
    expect(w.find('[id="mascotas"] [aria-expanded="true"]').exists()).toBe(true)
    expect(w.findAll('[aria-expanded="true"]')).toHaveLength(1)
    w.unmount()
  })
  it('la cuenta va al output SEARCH_MS después de la última tecla, y nada con el campo vacío', async () => {
    vi.useFakeTimers()
    const { w } = run(GbFaq03)
    await type(w, 'm')
    await type(w, 'mascota')
    vi.advanceTimersByTime(section.SEARCH_MS - 1)
    await nextTick()
    expect(w.find('output').text()).toBe('')
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(w.find('output').text()).toBe(`1 de ${N} preguntas`)
    await type(w, '')
    await nextTick()
    expect(w.find('output').text()).toBe('')
    vi.advanceTimersByTime(section.SEARCH_MS * 2)
    await nextTick()
    expect(w.find('output').text()).toBe('')
  })
  it('labels.matches como función', async () => {
    vi.useFakeTimers()
    const { w } = run(GbFaq03, { labels: { ...bank.props.labels, matches: ({ count, total }) => `${count}/${total}` } })
    await type(w, 'xyz')
    vi.advanceTimersByTime(section.SEARCH_MS)
    await nextTick()
    expect(w.find('output').text()).toBe(`0/${N}`)
  })
  it('sin coincidencias: GEmpty cause="filtered" con la búsqueda como filtro; su clear vacía el campo y le devuelve el foco', async () => {
    const { w } = run(GbFaq03, {}, { attachTo: document.body })
    await type(w, 'xyz')
    expect(w.findComponent(GAccordion).exists()).toBe(false)
    const empty = w.findComponent(GEmpty)
    expect([empty.props('cause'), empty.props('title'), empty.props('filters')]).toEqual(['filtered', bank.props.labels.none, [{ key: 'search', label: 'xyz' }]])
    const btn = empty.find('button')
    expect(btn.text()).toBe(bank.props.labels.clear)
    await btn.trigger('click')
    expect(w.find('input').element.value).toBe('')
    expect(document.activeElement).toBe(w.find('input').element)
    expect(w.findAllComponents(GAccordionItem)).toHaveLength(N)
    w.unmount()
  })
  it('Intro no hace nada (sin envío)', async () => {
    const { w } = run(GbFaq03)
    await type(w, 'mascota')
    await w.find('input').trigger('keydown', { key: 'Enter' })
    expect(visible(w)).toEqual(['mascotas'])
    expect(w.findComponent(GbFaq03).emitted()).not.toHaveProperty('submit')
  })
})

describe('GbFaq · avisos', () => {
  it('C1: lista vacía no pinta nada', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const { w, warnings } = run(C, { items: [] })
      expect(w.find('[data-gb]').exists()).toBe(false)
      expect(own(warnings, n, 'C1')).toHaveLength(1)
    }
  })
  it('C2: sin question o answer se omite; C3: id repetido usa el índice y solo el primero lleva el ancla', () => {
    const items = [{ id: 'a', question: 'Uno', answer: 'x' }, { id: 'a', question: 'Dos', answer: 'y' }, { id: 'c', question: 'Tres' }, { id: 'd', answer: 'z' }]
    for (const [n, C] of Object.entries(ALL)) {
      const { w, warnings } = run(C, { items })
      expect(w.text()).toContain('Dos')
      expect(w.text()).not.toContain('Tres')
      expect(w.findAll('[id="a"]')).toHaveLength(1)
      expect(own(warnings, n, 'C2')).toHaveLength(2)
      expect(own(warnings, n, 'C3')).toHaveLength(1)
    }
  })
  it('C5 en 03: sin search, matches o none avisa y se pinta sin ese texto; 01 y 02 no lo necesitan', async () => {
    vi.useFakeTimers()
    const { w, warnings } = run(GbFaq03, { labels: {} })
    expect(own(warnings, '03', 'C5').filter((t) => t.includes('labels.search'))).toHaveLength(1)
    expect(w.findComponent(GInput).props('label')).toBe('')
    await type(w, 'xyz')
    vi.advanceTimersByTime(section.SEARCH_MS)
    await nextTick()
    expect(own(warnings, '03', 'C5').filter((t) => t.includes('labels.matches'))).toHaveLength(1)
    expect(own(warnings, '03', 'C5').filter((t) => t.includes('labels.none'))).toHaveLength(1)
    expect(w.find('output').text()).toBe('')
    for (const [n, C] of [['01', GbFaq01], ['02', GbFaq02]]) expect(own(run(C, { labels: {} }).warnings, n, 'C5')).toHaveLength(0)
  })
  it('C7: más de cuarenta se pintan todas y avisa', () => {
    const items = Array.from({ length: 41 }, (_, i) => ({ id: `q${i}`, question: `P${i}`, answer: 'R' }))
    const { w, warnings } = run(GbFaq01, { items })
    expect(w.findAllComponents(GAccordionItem)).toHaveLength(41)
    expect(own(warnings, '01', 'C7')).toHaveLength(1)
  })
  it('Q1: una pregunta sin id avisa una vez por instancia; Q2: un id con espacios se pinta sin ancla', () => {
    const items = [{ question: 'Uno', answer: 'x' }, { question: 'Dos', answer: 'y' }, { id: 'con espacio', question: 'Tres', answer: 'z' }]
    for (const [n, C] of Object.entries(ALL)) {
      const { w, warnings } = run(C, { items })
      expect(own(warnings, n, 'Q1')).toHaveLength(1)
      expect(own(warnings, n, 'Q2')).toHaveLength(1)
      expect(w.find('[id="con espacio"]').exists()).toBe(false)
      expect(w.text()).toContain('Tres')
    }
  })
})
