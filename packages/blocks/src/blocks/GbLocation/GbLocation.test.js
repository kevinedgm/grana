// GbLocation (dueño: bruno): location.md «Verificación propia» + la batería común de _comun.md §8 y §20.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h } from 'vue'
import { GCard, GSection } from '@grana/vue'
import meta from './GbLocation.meta.json'
import * as bank from './location.bank.js'
import * as section from './props.js'
import GbLocation01 from './GbLocation01.vue'
import GbLocation02 from './GbLocation02.vue'
import GbLocation03 from './GbLocation03.vue'
import { sectionSuite } from '../bank/suite.js'
import { click, mountBlock } from '../bank/harness.js'

const variants = { GbLocation01, GbLocation02, GbLocation03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbLocation' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, icons: bank.appIcons, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbLocation${n}]`) && t.includes(`(${code})`))
const ALL = { '01': GbLocation01, '02': GbLocation02, '03': GbLocation03 }

describe('GbLocation · la dirección se puede copiar (#876)', () => {
  it('address real (GText as="address") con el nombre, las líneas, los canales y el horario dentro, en las tres', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const { w } = run(C)
      const addr = w.find('address')
      expect(addr.exists(), n).toBe(true)
      expect(addr.classes()).toContain('g-text')
      const first = addr.find('p')
      expect(first.findAll('br')).toHaveLength(2)
      expect(first.text()).toContain('Casa Alcalá')
      expect(first.text()).toContain('Macedonio Alcalá 307, Centro')
      const ul = addr.find('ul[aria-label="Escríbenos"]')
      expect(ul.findAll(':scope > li')).toHaveLength(3)
      expect(addr.text()).toContain('Horario')
      expect(addr.text()).toContain('Recepción las 24 horas')
      expect(ul.find('a[lang="en"]').exists()).toBe(true)
    }
  })
  it('el mapa es un <img> con su alt dentro del media de GCard (01, 02), nunca fuera; 03 lo ignora', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const { w } = run(C)
      const map = w.findAll('img').filter((i) => i.attributes('alt') === bank.props.map.alt)
      if (n === '03') { expect(map).toHaveLength(0); continue }
      expect(map, n).toHaveLength(1)
      expect(map[0].element.closest('.g-card'), n).not.toBeNull()
      expect(map[0].attributes('loading')).toBe('lazy')
      expect(map[0].attributes('width')).toBe('1200')
    }
    const two = run(GbLocation02).w.findAllComponents(GCard)
    expect(two).toHaveLength(1)
    expect(two[0].props('title')).toBe('Mapa de la zona')
    expect(two[0].props('level')).toBe('flat')
  })
  it('«Cómo llegar» externo: solid en 01 y outline en 02 y 03, nombre «{label}, {external}» y sin navigate', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const onNavigate = vi.fn()
      const { w } = run(C, { onNavigate }, { attachTo: document.body })
      const a = w.findAll('a').find((x) => x.text().includes('Cómo llegar') && x.attributes('href') === bank.props.directions.href)
      expect(a.attributes('aria-label')).toBe('Cómo llegar, se abre en otra pestaña')
      expect(a.attributes('target')).toBe('_blank')
      expect(a.classes()).toContain(n === '01' ? 'g-btn--variant-solid' : 'g-btn--variant-outline')
      a.element.addEventListener('click', (e) => e.preventDefault())
      a.element.dispatchEvent(click())
      expect(onNavigate).not.toHaveBeenCalled()
      w.unmount()
    }
  })
  it('canales: tel: y externos sin navigate', () => {
    for (const C of Object.values(ALL)) {
      const onNavigate = vi.fn()
      const { w } = run(C, { onNavigate }, { attachTo: document.body })
      for (const a of w.find('address ul').findAll('a')) { a.element.addEventListener('click', (e) => e.preventDefault()); a.element.dispatchEvent(click()) }
      expect(onNavigate).not.toHaveBeenCalled()
      w.unmount()
    }
  })
  it('03: un li (GCard outlined) por punto con su hora en <time>; la ruta interna de un punto emite navigate con el punto', () => {
    const onNavigate = vi.fn((p) => p.event.preventDefault())
    const { w } = run(GbLocation03, { onNavigate }, { attachTo: document.body })
    const lis = w.findAll('ul.g-stack > li.g-card')
    expect(lis).toHaveLength(3)
    expect(lis[0].find('time').attributes('datetime')).toBe('07:45')
    expect(lis[0].find('time').text()).toBe('7:45')
    expect(lis[0].find('address').text()).toContain('Av. de la Independencia')
    expect(w.findAllComponents(GCard)[0].props('level')).toBe('outlined')
    expect(w.findAll('h3').map((x) => x.text())).toEqual(['Puntos de encuentro'])
    expect(w.findAll('h4')).toHaveLength(3)
    lis[1].find('a').element.dispatchEvent(click())
    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(onNavigate.mock.calls[0][0].href).toBe('/llegar#puerta')
    expect(onNavigate.mock.calls[0][0].item.id).toBe('hotel')
    w.unmount()
  })
  it('01: la raíz es GCard as="section" con el título al nivel de la sección (h2; h3 anidado)', () => {
    const { w } = run(GbLocation01)
    expect(w.element.tagName).toBe('SECTION')
    expect(w.element.classList.contains('g-card')).toBe(true)
    const nested = run(GbLocation01, {}, { wrap: (render) => h(GSection, { title: 'Página' }, render) })
    expect(nested.w.find('[data-gb] h3').text()).toBe('Dónde estamos')
  })
  it('slots map y address', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const { w } = mountBlock(C, { props: bank.props, slots: { map: () => h('div', { class: 'fachada' }), address: () => h('p', { class: 'mia' }, 'Otra') }, icons: bank.appIcons })
      expect(w.find('address .mia').exists(), n).toBe(true)
      expect(w.find('.fachada').exists(), n).toBe(n !== '03')
    }
  })
})

describe('GbLocation · avisos', () => {
  it('L1 sin address ni points; L2 alt «Mapa»; L3 points en 01/02 sin address', () => {
    for (const [n, C] of Object.entries(ALL)) {
      expect(own(run(C, { address: undefined, points: undefined }).warnings, n, 'L1')).toHaveLength(1)
      if (n !== '03') {
        expect(own(run(C, { map: { ...bank.props.map, alt: 'Mapa' } }).warnings, n, 'L2')).toHaveLength(1)
        expect(own(run(C, { address: undefined }).warnings, n, 'L3')).toHaveLength(1)
        expect(own(run(C).warnings, n, 'L3')).toHaveLength(0)
      }
    }
  })
  it('C4 mapa sin width/height; C5 hours/channels/map/points sin su texto; C7 más de 8 puntos', () => {
    expect(own(run(GbLocation01, { map: { src: 'm.png', alt: 'Esquina de Alcalá y Murguía' } }).warnings, '01', 'C4')).toHaveLength(1)
    for (const [n, C] of Object.entries(ALL)) {
      const { warnings } = run(C, { labels: { external: 'se abre en otra pestaña' } })
      const c5 = own(warnings, n, 'C5').map((t) => t.match(/labels\.(\w+)/)[1]).sort()
      expect(c5, n).toEqual({ '01': ['channels', 'hours'], '02': ['channels', 'hours', 'map'], '03': ['channels', 'hours', 'points'] }[n])
    }
    expect(own(run(GbLocation03, { points: Array.from({ length: 9 }, (_, i) => ({ name: `P${i}` })) }).warnings, '03', 'C7')).toHaveLength(1)
  })
})
