// useSectionLevel (#817, section.md «Nivel para componentes y bloques»): nivel de un encabezado puesto en ese sitio.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GSection from '../components/GSection/GSection.vue'
import { useSectionLevel } from '../index.js'

afterEach(() => vi.restoreAllMocks())

// Sonda: pinta «level/depth» leído en su setup
const Probe = defineComponent({
  setup() {
    const { level, depth } = useSectionLevel()
    return () => h('output', `${level.value}/${depth.value}`)
  }
})
const wrap = (levels, inner = () => h(Probe)) => levels.reduceRight((child, hl, i) => () => h(GSection, { title: `S${i}`, headingLevel: hl }, child), inner)
const read = (levels) => mount({ render: wrap(levels) }).find('output').text()

describe('useSectionLevel', () => {
  it('se exporta desde @grana/vue', () => {
    expect(typeof useSectionLevel).toBe('function')
  })
  it('fuera de toda sección: 2 / 0', () => {
    expect(mount(Probe).text()).toBe('2/0')
  })
  it('dentro de una sección: 3 / 1; dentro de dos: 4 / 2', () => {
    expect(read([undefined])).toBe('3/1')
    expect(read([undefined, undefined])).toBe('4/2')
  })
  it('dentro de un h4 el siguiente es 5 (no el tope 4 de GSection); tope 6', () => {
    expect(read([undefined, undefined, undefined])).toBe('5/3')
    expect(read([undefined, undefined, undefined, undefined])).toBe('5/4') // la cuarta GSection sigue en h4
    expect(read([4])).toBe('5/1')
  })
  it('respeta el headingLevel fijado en la sección de fuera (+1)', () => {
    expect(read([3])).toBe('4/1')
    expect(read([4, undefined])).toBe('5/2') // GSection anidada bajo h4 queda en h4 (tope 4)
  })
  it('las refs son de solo lectura (computed)', () => {
    let api
    mount(defineComponent({ setup() { api = useSectionLevel(); return () => null } }))
    expect(api.level.value).toBe(2)
    expect(() => { api.level.value = 9 }).not.toThrow()
    expect(api.level.value).toBe(2)
  })
  it('fuera de un setup devuelve 2 y 0 sin avisar', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { level, depth } = useSectionLevel()
    expect([level.value, depth.value]).toEqual([2, 0])
    expect(spy).not.toHaveBeenCalled()
  })
  it('SSR: el mismo resultado al renderizar en servidor', async () => {
    const html = await renderToString(createSSRApp({ render: wrap([undefined, undefined]) }))
    expect(html).toContain('<output>4/2</output>')
  })
  it('GSection no cambia: sigue con su tope 4 y su profundidad', () => {
    const w = mount({ render: wrap([undefined, undefined, undefined, undefined]) })
    expect(w.findAll('.g-section__title').map((t) => t.element.tagName)).toEqual(['H2', 'H3', 'H4', 'H4'])
  })
})
