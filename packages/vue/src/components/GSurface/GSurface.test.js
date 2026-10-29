import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import GSurface from './GSurface.vue'

afterEach(() => vi.restoreAllMocks())

describe('GSurface · render y clases', () => {
  it('es un <div> con las clases por defecto', () => {
    const w = mount(GSurface)
    expect(w.element.tagName).toBe('DIV')
    expect(w.classes()).toEqual(['g-surface', 'g-surface--level-outlined', 'g-surface--tone-surface', 'g-surface--padding-md'])
  })

  it('las clases siguen a las props', () => {
    const w = mount(GSurface, { props: { level: 'floating', tone: 'sunken', padding: 'xs', density: 'compact', rounded: 'xl' } })
    expect(w.classes()).toEqual(expect.arrayContaining([
      'g-surface--level-floating', 'g-surface--tone-sunken', 'g-surface--padding-xs', 'g-surface--density-compact', 'g-surface--rounded-xl'
    ]))
  })

  it('sin rounded no hay clase de radio (lo decide el nivel)', () => {
    const w = mount(GSurface)
    expect(w.classes().some((c) => c.startsWith('g-surface--rounded'))).toBe(false)
  })

  it('cada nivel emite su clase', () => {
    for (const level of ['flat', 'outlined', 'raised', 'floating', 'inset']) {
      expect(mount(GSurface, { props: { level } }).classes()).toContain(`g-surface--level-${level}`)
    }
  })
})

describe('GSurface · elemento y semántica', () => {
  it('as elige el elemento', () => {
    expect(mount(GSurface, { props: { as: 'section' } }).element.tagName).toBe('SECTION')
    expect(mount(GSurface, { props: { as: 'form' } }).element.tagName).toBe('FORM')
  })

  it('no añade rol ni aria', () => {
    const w = mount(GSurface)
    expect(w.attributes('role')).toBeUndefined()
    expect(Object.keys(w.attributes()).filter((a) => a.startsWith('aria-'))).toEqual([])
  })

  it('el resto de atributos va a la raíz (el rol del consumidor es suyo)', () => {
    const w = mount(GSurface, { attrs: { id: 's1', role: 'region', 'aria-label': 'Resumen', 'data-x': '1', class: 'mia' } })
    expect(w.attributes()).toMatchObject({ id: 's1', role: 'region', 'aria-label': 'Resumen', 'data-x': '1' })
    expect(w.classes()).toContain('mia')
    expect(w.classes()).toContain('g-surface')
  })

  it('avisa en desarrollo si as es un elemento interactivo, pero lo renderiza', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GSurface, { props: { as: 'button' } })
    expect(w.element.tagName).toBe('BUTTON')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toMatch(/no es interactiva/)
  })

  it('no avisa con elementos no interactivos', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const as of ['div', 'section', 'article', 'aside', 'form', 'fieldset', 'ul']) mount(GSurface, { props: { as } })
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('GSurface · contenido y anidación', () => {
  it('renderiza el slot default directamente dentro de la raíz', () => {
    const w = mount(GSurface, { slots: { default: () => h('p', { class: 'x' }, 'Hola') } })
    expect(w.element.firstElementChild.className).toBe('x')
    expect(w.text()).toBe('Hola')
  })

  it('sin slot queda vacía', () => {
    expect(mount(GSurface).element.childNodes.length).toBe(0)
  })

  it('se anida: una inset dentro de otra superficie conserva sus clases (la relación la resuelve el CSS)', () => {
    const w = mount(GSurface, {
      props: { level: 'floating', tone: 'sunken', padding: 'xs' },
      slots: { default: () => h(GSurface, { level: 'inset' }, () => 'Cuerpo') }
    })
    const inner = w.findAll('.g-surface')[1]
    expect(inner.classes()).toContain('g-surface--level-inset')
    expect(inner.text()).toBe('Cuerpo')
  })

  it('no es interactiva: sin tabindex ni escuchas propias', () => {
    const w = mount(GSurface)
    expect(w.attributes('tabindex')).toBeUndefined()
    expect(GSurface.emits).toBeUndefined()
  })
})

describe('GSurface · validadores', () => {
  it('rechazan valores fuera de la lista', () => {
    const v = (n) => GSurface.props[n].validator
    expect(v('level')('card')).toBe(false)
    expect(v('level')('inset')).toBe(true)
    expect(v('tone')('dark')).toBe(false)
    expect(v('padding')('xl')).toBe(false)
    expect(v('rounded')('pill')).toBe(true)
    expect(v('density')('spacious')).toBe(false)
  })
})

describe('GSurface · zona de marca (surface.md §«Zona de marca»)', () => {
  it('sin zone (o none) no hay atributo ni clase', () => {
    for (const props of [{}, { zone: 'none' }]) {
      const w = mount(GSurface, { props })
      expect(w.attributes('data-g-zone')).toBeUndefined()
      expect(w.classes()).not.toContain('g-surface--zone-brand')
    }
  })

  it('zone="brand" pone data-g-zone="brand" y la clase en la raíz, en cualquier nivel', () => {
    for (const level of ['flat', 'outlined', 'raised', 'floating', 'inset']) {
      const w = mount(GSurface, { props: { zone: 'brand', level } })
      expect(w.attributes('data-g-zone')).toBe('brand')
      expect(w.classes()).toContain('g-surface--zone-brand')
      expect(w.classes()).toContain(`g-surface--level-${level}`)
    }
  })

  it('cambiar zone quita y pone el atributo', async () => {
    const w = mount(GSurface, { props: { zone: 'brand' } })
    await w.setProps({ zone: 'none' })
    expect(w.attributes('data-g-zone')).toBeUndefined()
    expect(w.classes()).not.toContain('g-surface--zone-brand')
  })

  it('los $attrs siguen en la raíz junto a la zona', () => {
    const w = mount(GSurface, { props: { zone: 'brand' }, attrs: { id: 'banda', 'aria-label': 'Resumen', class: 'mia' } })
    expect(w.attributes('id')).toBe('banda')
    expect(w.attributes('aria-label')).toBe('Resumen')
    expect(w.classes()).toEqual(expect.arrayContaining(['mia', 'g-surface--zone-brand']))
  })

  it('el atributo público puesto por la aplicación llega a la raíz sin la prop', () => {
    const w = mount(GSurface, { attrs: { 'data-g-zone': 'brand' } })
    expect(w.attributes('data-g-zone')).toBe('brand')
  })

  it('W1: un valor desconocido (también inverse) avisa una vez por valor y queda sin zona', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GSurface, { props: { zone: 'inverse' } })
    expect(w.attributes('data-g-zone')).toBeUndefined()
    expect(w.classes()).not.toContain('g-surface--zone-brand')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toMatch(/none y brand; inverse está reservado/)
    await w.setProps({ padding: 'lg' })
    expect(warn).toHaveBeenCalledTimes(1)
    await w.setProps({ zone: 'marca' })
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('W2: data-theme en la misma raíz avisa y se renderiza igual', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GSurface, { props: { zone: 'brand' }, attrs: { 'data-theme': 'dark' } })
    expect(w.attributes('data-g-zone')).toBe('brand')
    expect(w.attributes('data-theme')).toBe('dark')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toMatch(/no van en el mismo elemento/)
  })

  it('W2 no avisa sin zona', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GSurface, { attrs: { 'data-theme': 'dark' } })
    expect(warn).not.toHaveBeenCalled()
  })

  it('W3: tone="sunken" con la zona avisa y se ignora', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GSurface, { props: { zone: 'brand', tone: 'sunken' } })
    expect(w.classes()).toContain('g-surface--tone-surface')
    expect(w.classes()).not.toContain('g-surface--tone-sunken')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toMatch(/tone="sunken" se ignora/)
    await w.setProps({ padding: 'sm' })
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('una zona dentro de otra no avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GSurface, { props: { zone: 'brand' }, slots: { default: () => h(GSurface, { zone: 'brand' }) } })
    expect(w.findAll('[data-g-zone="brand"]')).toHaveLength(2)
    expect(warn).not.toHaveBeenCalled()
  })
})
