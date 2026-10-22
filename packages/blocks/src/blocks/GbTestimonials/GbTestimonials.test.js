// GbTestimonials (dueño: bruno): testimonials.md «Verificación propia» + la batería común de _comun.md §8.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h } from 'vue'
import { GAccordionItem, GAvatar, GCard, GSection } from '@grana/vue'
import meta from './GbTestimonials.meta.json'
import * as bank from './testimonials.bank.js'
import * as section from './props.js'
import GbTestimonials01 from './GbTestimonials01.vue'
import GbTestimonials02 from './GbTestimonials02.vue'
import GbTestimonials03 from './GbTestimonials03.vue'
import { sectionSuite } from '../bank/suite.js'
import { click, mountBlock } from '../bank/harness.js'
import { paragraphs } from '../common/text.js'

const variants = { GbTestimonials01, GbTestimonials02, GbTestimonials03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbTestimonials' })
afterEach(() => vi.restoreAllMocks())

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbTestimonials${n}]`) && t.includes(`(${code})`))
const ALL = { '01': GbTestimonials01, '02': GbTestimonials02, '03': GbTestimonials03 }
const ITEMS = bank.props.items
const N = ITEMS.length

describe('GbTestimonials · anatomía de una opinión (#821)', () => {
  it('figure > blockquote + figcaption en las tres, una por opinión', () => {
    for (const C of Object.values(ALL)) {
      const { w } = run(C)
      const figs = w.findAll('figure')
      expect(figs).toHaveLength(N)
      for (const f of figs) expect([...f.element.children].map((k) => k.tagName)).toEqual(['BLOCKQUOTE', 'FIGCAPTION'])
    }
  })
  it('la cita entera, en párrafos y sin recortar; lang en el blockquote', () => {
    for (const C of Object.values(ALL)) {
      const { w } = run(C)
      const quotes = w.findAll('blockquote')
      quotes.forEach((q, i) => {
        expect(q.findAll('p').map((p) => p.text())).toEqual(paragraphs(ITEMS[i].quote))
        expect(q.attributes('lang')).toBe(ITEMS[i].lang)
      })
      expect(quotes[2].attributes('lang')).toBe('en')
      expect(w.findAllComponents(GCard).every((c) => c.props('descriptionLines') === 'none')).toBe(true)
    }
  })
  it('figcaption: nombre (y papel) y la fuente en cite; con href, GBtn variant="link"; blockquote[cite] = href', () => {
    for (const C of Object.values(ALL)) {
      const { w } = run(C)
      const caps = w.findAll('figcaption')
      expect(caps[0].text()).toContain('Lucía Hernández, Viajó en pareja')
      expect(caps[0].find('cite a.g-btn--variant-link').attributes('href')).toBe('#opiniones-google')
      expect(w.findAll('blockquote')[0].attributes('cite')).toBe('#opiniones-google')
      // mínima: la fuente en texto, sin enlace
      expect(caps[3].find('cite').text()).toBe('Libro de visitas de la casa')
      expect(caps[3].find('cite a').exists()).toBe(false)
      expect(w.findAll('blockquote')[3].attributes('cite')).toBeUndefined()
    }
  })
  it('fuente externa: otra pestaña, nombre «{label}, {labels.external}» y sin navigate', () => {
    for (const C of Object.values(ALL)) {
      const { w } = run(C)
      const a = w.findAll('figcaption')[1].find('cite a')
      expect(a.attributes('target')).toBe('_blank')
      expect(a.attributes('rel')).toBe('noopener')
      expect(a.attributes('aria-label')).toBe('TripAdvisor, se abre en otra pestaña')
      a.element.dispatchEvent(click())
      expect(w.findComponent(C).emitted('navigate')).toBeUndefined()
    }
  })
  it('navigate con clic primario en una fuente interna, item = la opinión; no con modificadores ni botón central', () => {
    for (const C of Object.values(ALL)) {
      const { w } = run(C)
      const a = w.findAll('figcaption')[0].find('cite a').element
      a.dispatchEvent(click())
      for (const m of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) a.dispatchEvent(click(m))
      const ev = w.findComponent(C).emitted('navigate')
      expect(ev).toHaveLength(1)
      expect(ev[0][0]).toMatchObject({ href: '#opiniones-google', item: ITEMS[0] })
    }
  })
  it('preventDefault() en la escucha de navigate impide la navegación', () => {
    const { w } = mountBlock(GbTestimonials01, { props: { ...bank.props, onNavigate: ({ event }) => event.preventDefault() } })
    const e = click()
    w.find('cite a').element.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
  })
  it('slot quote: contenido rico dentro del blockquote', () => {
    for (const C of Object.values(ALL)) {
      const { w } = mountBlock(C, { props: bank.props, slots: { quote: ({ item }) => h('p', null, `RICO ${item.author.name}`) } })
      expect(w.findAll('blockquote')[1].text()).toBe('RICO Marco Ruiz')
    }
  })
})

describe('GbTestimonials · cada forma', () => {
  it('01: role="list" con listitem g-adapt-wide; GCard as="div" sin título, nombrada por el autor; GAvatar lg decorativo en lead', () => {
    const { w } = run(GbTestimonials01)
    const list = w.find('[role="list"]').element
    expect([...list.children].map((k) => [k.getAttribute('role'), k.className])).toEqual(Array(N).fill(['listitem', 'g-adapt-wide']))
    const cards = w.findAllComponents(GCard)
    expect(cards).toHaveLength(N)
    cards.forEach((c, i) => {
      expect(c.element.tagName).toBe('DIV')
      expect(c.props('title')).toBeUndefined()
      expect(c.attributes('role')).toBe('group')
      expect(c.find(`[id="${c.attributes('aria-labelledby')}"]`).text()).toBe(ITEMS[i].author.name)
    })
    const avatars = w.findAllComponents(GAvatar)
    expect(avatars.map((a) => [a.props('size'), a.props('name'), a.props('label')])).toEqual(ITEMS.map((t) => ['lg', t.author.name, undefined]))
    expect(avatars[3].props('src')).toBeUndefined()
    // El avatar va fuera de la figure
    for (const a of avatars) expect(a.element.closest('figure')).toBeNull()
  })
  it('02: la primera en una GCard (auto, media start) con GAvatar xl en media; las demás en ul divided › li › figure', () => {
    const { w } = run(GbTestimonials02)
    const cards = w.findAllComponents(GCard)
    expect(cards).toHaveLength(1)
    expect([cards[0].props('orientation'), cards[0].props('mediaPosition')]).toEqual(['auto', 'start'])
    expect(cards[0].findComponent(GAvatar).props('size')).toBe('xl')
    expect(cards[0].find('blockquote').text()).toContain('Despertar')
    const lis = w.findAll('ul > li')
    expect(lis).toHaveLength(N - 1)
    for (const li of lis) expect(li.element.firstElementChild.tagName).toBe('FIGURE')
  })
  it('02 con una sola opinión: sin lista vacía', () => {
    const { w } = run(GbTestimonials02, { items: [ITEMS[0]] })
    expect(w.find('ul').exists()).toBe(false)
    expect(w.findAll('figure')).toHaveLength(1)
  })
  it('03: un GAccordionItem por opinión (title = autor, meta = fuente, peek = primer párrafo en su idioma), la figure en el panel', () => {
    const { w } = run(GbTestimonials03)
    const items = w.findAllComponents(GAccordionItem)
    expect(items.map((i) => [i.props('title'), i.props('meta')])).toEqual(ITEMS.map((t) => [t.author.name, t.source.label]))
    items.forEach((it, i) => {
      const peek = it.find('.g-accordion-item__peek span')
      expect(peek.text()).toBe(paragraphs(ITEMS[i].quote)[0])
      expect(peek.attributes('lang')).toBe(ITEMS[i].lang)
      expect(it.find('.g-accordion-item__content figure').exists()).toBe(true)
    })
  })
  it('títulos de dentro un nivel por debajo (03): h3 en la raíz, h4 dentro de una GSection de la aplicación', () => {
    expect(run(GbTestimonials03).w.findAll('h3')).toHaveLength(N)
    const nested = run(GbTestimonials03, {}, { wrap: (render) => h(GSection, { title: 'Página' }, render) })
    expect(nested.w.find('[data-gb]').findAll('h4')).toHaveLength(N)
  })
  it('nada se mueve solo: sin temporizadores ni requestAnimationFrame al montar 01 y 02', () => {
    const timer = vi.spyOn(globalThis, 'setTimeout')
    const interval = vi.spyOn(globalThis, 'setInterval')
    run(GbTestimonials01); run(GbTestimonials02)
    expect(interval).not.toHaveBeenCalled()
    expect(timer).not.toHaveBeenCalled()
  })
})

describe('GbTestimonials · avisos (una vez por instancia y motivo)', () => {
  it('C1: lista vacía no pinta nada', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const { w, warnings } = run(C, { items: [] })
      expect(w.find('[data-gb]').exists()).toBe(false)
      expect(own(warnings, n, 'C1')).toHaveLength(1)
    }
  })
  it('C2: sin quote o sin author.name se omite; C3: id repetido usa el índice', () => {
    const src = { label: 'Google' }
    const items = [{ id: 'a', quote: 'Uno', author: { name: 'A' }, source: src }, { id: 'a', quote: 'Dos', author: { name: 'B' }, source: src }, { quote: 'Tres', author: {}, source: src }, { author: { name: 'D' }, source: src }]
    for (const [n, C] of Object.entries(ALL)) {
      const { w, warnings } = run(C, { items })
      expect(w.findAll('figure')).toHaveLength(2)
      expect(own(warnings, n, 'C2')).toHaveLength(2)
      expect(own(warnings, n, 'C3')).toHaveLength(1)
    }
  })
  it('C5: fuente externa sin labels.external; C6: href javascript: deja un GBtn deshabilitado sin enlace', () => {
    const items = [{ quote: 'A', author: { name: 'A' }, source: { label: 'Ext', href: 'https://x', external: true } }, { quote: 'B', author: { name: 'B' }, source: { label: 'Mal', href: 'javascript:alert(1)' } }]
    for (const [n, C] of Object.entries(ALL)) {
      const { w, warnings } = run(C, { items, labels: {} })
      expect(own(warnings, n, 'C5')).toHaveLength(1)
      expect(own(warnings, n, 'C6')).toHaveLength(1)
      expect(w.find('[href^="javascript"]').exists()).toBe(false)
      expect(w.find('[cite^="javascript"]').exists()).toBe(false)
      expect(w.findAll('figcaption')[1].find('cite button[disabled], cite .g-btn[aria-disabled="true"], cite [disabled]').exists()).toBe(true)
    }
  })
  it('C7: más de doce se pintan todas y avisa', () => {
    const items = Array.from({ length: 13 }, (_, i) => ({ id: i, quote: `Q${i}`, author: { name: `A${i}` }, source: { label: 'S' } }))
    const { w, warnings } = run(GbTestimonials01, { items })
    expect(w.findAll('[role="listitem"]')).toHaveLength(13)
    expect(own(warnings, '01', 'C7')).toHaveLength(1)
  })
  it('T1: una opinión sin source avisa una vez por instancia y se pinta', () => {
    const items = ITEMS.map(({ source, ...t }) => t)
    for (const [n, C] of Object.entries(ALL)) {
      const { w, warnings } = run(C, { items })
      expect(w.findAll('figure')).toHaveLength(N)
      expect(w.find('cite').exists()).toBe(false)
      expect(own(warnings, n, 'T1')).toHaveLength(1)
    }
  })
  it('T2: una cita de más de 600 caracteres avisa y se pinta entera', () => {
    const long = 'a '.repeat(320).trim()
    for (const [n, C] of Object.entries(ALL)) {
      const { w, warnings } = run(C, { items: [{ ...ITEMS[0], quote: long }] })
      expect(w.find('blockquote').text()).toBe(long)
      expect(own(warnings, n, 'T2')).toHaveLength(1)
    }
  })
})
