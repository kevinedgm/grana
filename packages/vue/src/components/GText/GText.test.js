import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, h, ref, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GText from './GText.vue'

afterEach(() => vi.restoreAllMocks())
const warns = () => vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('GText · render y clases', () => {
  it('es un p body default', () => {
    const w = mount(GText, { slots: { default: 'Hola' } })
    expect(w.element.tagName).toBe('P')
    expect(w.classes()).toEqual(['g-text', 'g-text--size-body', 'g-text--tone-default'])
    expect(w.text()).toBe('Hola')
  })

  it.each(['p', 'div', 'span', 'small', 'blockquote', 'figure', 'figcaption', 'address'])('as=%s pinta esa etiqueta', (as) => {
    expect(mount(GText, { props: { as }, slots: { default: 'x' } }).element.tagName).toBe(as.toUpperCase())
  })

  it('size y tone siguen a las props', () => {
    const w = mount(GText, { props: { size: 'body-sm', tone: 'muted' }, slots: { default: 'x' } })
    expect(w.classes()).toEqual(['g-text', 'g-text--size-body-sm', 'g-text--tone-muted'])
    expect(mount(GText, { props: { size: 'caption' }, slots: { default: 'x' } }).classes()).toContain('g-text--size-caption')
  })

  it('$attrs llegan a la raíz y la clase de la aplicación se suma', () => {
    const w = mount(GText, { attrs: { lang: 'en', dir: 'auto', id: 't', cite: 'https://x.test', 'aria-describedby': 'd', class: 'mia', style: 'color: red' }, props: { as: 'blockquote' }, slots: { default: 'x' } })
    expect(w.attributes()).toMatchObject({ lang: 'en', dir: 'auto', id: 't', cite: 'https://x.test', 'aria-describedby': 'd' })
    expect(w.classes()).toContain('mia')
    expect(w.classes()).toContain('g-text')
    expect(w.attributes('style')).toContain('color')
  })
})

describe('GText · vacío = no se pinta', () => {
  const none = (slot) => mount(GText, { attrs: { id: 'x' }, slots: slot ? { default: slot } : {} }).find('.g-text').exists()
  it('sin slot', () => expect(none(null)).toBe(false))
  it('solo espacios', () => expect(none('   ')).toBe(false))
  it('solo un comentario de v-if falso', () => expect(none(() => [h('!')].slice(0, 0))).toBe(false))
  it('fragmento vacío y comentario', () => {
    const w = mount({ components: { GText }, data: () => ({ on: false }), template: '<g-text id="x"><span v-if="on">a</span></g-text>' })
    expect(w.find('.g-text').exists()).toBe(false)
    expect(w.html()).not.toContain('id="x"')
  })
  it('aparece y desaparece con el contenido', async () => {
    const on = ref(false)
    const w = mount({ components: { GText }, setup: () => ({ on }), template: '<g-text><b v-if="on">a</b></g-text>' })
    expect(w.find('.g-text').exists()).toBe(false)
    on.value = true
    await nextTick()
    expect(w.find('.g-text').exists()).toBe(true)
    on.value = false
    await nextTick()
    expect(w.find('.g-text').exists()).toBe(false)
  })
  it('con texto o un hijo, la raíz', () => {
    expect(none('a')).toBe(true)
    expect(none(() => h('b', 'a'))).toBe(true)
  })
})

describe('GText · avisos', () => {
  it('as, size o tone fuera de lista caen al default y avisan una vez por motivo', async () => {
    const spy = warns()
    const w = mount(GText, { props: { as: 'h1', size: 'xl', tone: 'subtle' }, slots: { default: 'x' } })
    expect(w.element.tagName).toBe('P')
    expect(w.classes()).toEqual(['g-text', 'g-text--size-body', 'g-text--tone-default'])
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls.every((c) => c[0].startsWith('[Grana GText]'))).toBe(true)
    await w.setProps({ as: 'h1' })
    expect(spy).toHaveBeenCalledTimes(3)
    await w.setProps({ as: 'ul' })
    expect(spy).toHaveBeenCalledTimes(4)
  })
  it('valores válidos no avisan', () => {
    const spy = warns()
    mount(GText, { props: { as: 'figure', size: 'caption', tone: 'muted' }, slots: { default: 'x' } })
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('GText · SSR', () => {
  const ssr = (props, text) => renderToString(createSSRApp({ render: () => h(GText, props, () => text) }))
  it('renderiza igual que el cliente', async () => {
    const html = await ssr({ as: 'div', size: 'body-sm', tone: 'muted', lang: 'en' }, 'Hola')
    expect(html).toBe('<div lang="en" class="g-text g-text--size-body-sm g-text--tone-muted">Hola</div>')
    expect(mount(GText, { props: { as: 'div', size: 'body-sm', tone: 'muted' }, attrs: { lang: 'en' }, slots: { default: 'Hola' } }).html()).toContain('g-text--size-body-sm g-text--tone-muted')
  })
  it('vacío no deja elemento', async () => {
    expect(await ssr({}, '')).not.toContain('<p')
  })
})
