import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, h, ref, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GSplit from './GSplit.vue'

afterEach(() => vi.restoreAllMocks())
const warns = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
const two = { start: () => h('p', 'A'), end: () => h('p', 'B') }

describe('GSplit · render y clases', () => {
  it('es un div con los defaults y dos regiones', () => {
    const w = mount(GSplit, { slots: two })
    expect(w.element.tagName).toBe('DIV')
    expect(w.classes()).toEqual(['g-split', 'g-split--ratio-3-2', 'g-split--collapse-md', 'g-split--gap-md', 'g-split--align-start'])
    const regions = w.findAll('.g-split__region')
    expect(regions).toHaveLength(2)
    expect(regions[0].classes()).toContain('g-split__region--start')
    expect(regions[1].classes()).toContain('g-split__region--end')
    expect(regions[0].text()).toBe('A')
    expect(regions[1].text()).toBe('B')
  })

  it.each(['div', 'section', 'article', 'aside', 'header', 'footer', 'form'])('as=%s pinta esa etiqueta', (as) => {
    expect(mount(GSplit, { props: { as }, slots: two }).element.tagName).toBe(as.toUpperCase())
  })

  it('las props siguen a las clases, con ":" convertido en "-"', () => {
    const w = mount(GSplit, { props: { ratio: '2:1', collapse: 'lg', gap: 'none', density: 'compact', align: 'stretch' }, slots: two })
    expect(w.classes()).toEqual(['g-split', 'g-split--ratio-2-1', 'g-split--collapse-lg', 'g-split--gap-none', 'g-split--align-stretch', 'g-split--density-compact'])
    expect(w.attributes('data-g-density'), 'la prop es la región (#975)').toBe('compact')
    for (const r of ['1:1', '3:2', '2:1', '2:3', '1:2']) {
      expect(mount(GSplit, { props: { ratio: r }, slots: two }).classes()).toContain(`g-split--ratio-${r.replace(':', '-')}`)
    }
  })

  it('$attrs llegan a la raíz y la clase de la aplicación se suma', () => {
    const w = mount(GSplit, { attrs: { id: 's', lang: 'en', dir: 'rtl', 'aria-labelledby': 'h', class: 'mia', style: 'color: red' }, props: { as: 'section' }, slots: two })
    expect(w.attributes()).toMatchObject({ id: 's', lang: 'en', dir: 'rtl', 'aria-labelledby': 'h' })
    expect(w.classes()).toContain('mia')
    expect(w.classes()).toContain('g-split')
    expect(w.attributes('style')).toContain('color')
  })
})

describe('GSplit · valores fuera de lista (aviso 1)', () => {
  it('as fuera de lista -> div con aviso (una vez)', async () => {
    const spy = warns()
    const w = mount(GSplit, { props: { as: 'button' }, slots: two })
    expect(w.element.tagName).toBe('DIV')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toContain('[Grana GSplit]')
    expect(spy.mock.calls[0][0]).toContain('as="button"')
    await w.setProps({ density: 'x' })
    await w.setProps({ density: 'x', gap: 'huge' })
    expect(spy).toHaveBeenCalledTimes(3)
    await w.setProps({ density: 'y' })
    await w.setProps({ density: 'x' })
    expect(spy).toHaveBeenCalledTimes(4)
  })

  it.each([['ratio', '5:5', 'g-split--ratio-3-2'], ['collapse', 'xl', 'g-split--collapse-md'], ['gap', 'xl', 'g-split--gap-md'], ['align', 'center', 'g-split--align-start']])('%s=%s cae al default y avisa con prop y valor', (name, value, cls) => {
    const spy = warns()
    const w = mount(GSplit, { props: { [name]: value }, slots: two })
    expect(w.classes()).toContain(cls)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toContain(`${name}="${value}"`)
  })

  it('density=tight avisa y no pinta clase ni atributo (sin prop válida, sigue la región, #975)', () => {
    const spy = warns()
    const w = mount(GSplit, { props: { density: 'tight' }, slots: two })
    expect(w.classes().some((c) => c.includes('--density-'))).toBe(false)
    expect(w.attributes('data-g-density')).toBeUndefined()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toContain('density="tight"')
  })

  it('sin valores raros no avisa', () => {
    const spy = warns()
    mount(GSplit, { slots: two })
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('GSplit · región vacía = no se pinta', () => {
  const regionsOf = (slots) => mount(GSplit, { slots }).findAll('.g-split__region').map((r) => r.classes().find((c) => /--(start|end)$/.test(c)))
  it('slot ausente', () => {
    expect(regionsOf({ start: () => h('p', 'A') })).toEqual(['g-split__region--start'])
    expect(regionsOf({ end: () => h('p', 'B') })).toEqual(['g-split__region--end'])
  })
  it('solo espacios, comentario o fragmento vacío', () => {
    expect(regionsOf({ start: () => '   ', end: () => h('p', 'B') })).toEqual(['g-split__region--end'])
    const w = mount({ components: { GSplit }, data: () => ({ on: false }), template: '<g-split><template #start><i v-if="on">a</i></template><template #end><b>B</b></template></g-split>' })
    expect(w.findAll('.g-split__region')).toHaveLength(1)
    const f = mount(GSplit, { slots: { start: () => [h('span', ' ')].slice(0, 0), end: () => h('b', 'B') } })
    expect(f.findAll('.g-split__region')).toHaveLength(1)
  })
  it('las dos vacías: raíz sin hijos y sin aviso', () => {
    const spy = warns()
    const w = mount(GSplit, { attrs: { id: 'x' }, slots: { start: () => '  ' } })
    expect(w.find('#x').exists()).toBe(true)
    expect(w.element.children).toHaveLength(0)
    expect(spy).not.toHaveBeenCalled()
  })
  it('aparece y desaparece una región con el contenido', async () => {
    const on = ref(false)
    const w = mount({ components: { GSplit }, setup: () => ({ on }), template: '<g-split><template #start><p>A</p></template><template #end><p v-if="on">B</p></template></g-split>' })
    expect(w.findAll('.g-split__region')).toHaveLength(1)
    on.value = true
    await nextTick()
    expect(w.findAll('.g-split__region')).toHaveLength(2)
    expect(w.findAll('.g-split__region')[1].text()).toBe('B')
    on.value = false
    await nextTick()
    expect(w.findAll('.g-split__region')).toHaveLength(1)
  })
})

describe('GSplit · slot default (aviso 2)', () => {
  it('va al final de start y avisa una vez', async () => {
    const spy = warns()
    const w = mount(GSplit, { slots: { start: () => h('p', 'A'), default: () => h('p', 'D'), end: () => h('p', 'B') } })
    const regions = w.findAll('.g-split__region')
    expect(regions[0].text()).toBe('AD')
    expect(regions[1].text()).toBe('B')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toContain('default')
    await w.setProps({ gap: 'lg' })
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('sin start, default hace de start', () => {
    warns()
    const w = mount(GSplit, { slots: { default: () => h('p', 'D'), end: () => h('p', 'B') } })
    const regions = w.findAll('.g-split__region')
    expect(regions[0].classes()).toContain('g-split__region--start')
    expect(regions[0].text()).toBe('D')
  })
  it('un default vacío no avisa', () => {
    const spy = warns()
    mount(GSplit, { slots: { default: () => '  ', start: () => h('p', 'A') } })
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('GSplit · SSR y producción', () => {
  it('el HTML del servidor es el del cliente, con regiones vacías omitidas', async () => {
    const slots = { start: () => h('p', 'A'), end: () => '  ' }
    const html = await renderToString(createSSRApp({ render: () => h(GSplit, { id: 's', as: 'section' }, slots) }))
    expect(html).toContain('<section')
    expect(html).toContain('g-split__region--start')
    expect(html).not.toContain('g-split__region--end')
    const w = mount(GSplit, { attrs: { id: 's' }, props: { as: 'section' }, slots })
    expect(w.html().replace(/\s+/g, '')).toBe(html.replace(/\s+/g, ''))
  })
  it('en producción no avisa y no falla', () => {
    const spy = warns()
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      expect(mount(GSplit, { props: { ratio: 'x' }, slots: { default: () => h('p', 'D') } }).classes()).toContain('g-split--ratio-3-2')
    } finally { process.env.NODE_ENV = prev }
    expect(spy).not.toHaveBeenCalled()
  })
  it('importar el módulo no deja efectos', () => {
    const spy = warns()
    expect(typeof GSplit.name).toBe('string')
    expect(spy).not.toHaveBeenCalled()
  })
})
