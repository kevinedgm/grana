import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import GHelperScope from './GHelperScope.vue'

describe('GHelperScope', () => {
  it('es un <div> con la clase g-helper-scope y su contenido', () => {
    const w = mount(GHelperScope, { slots: { default: () => h('p', 'Formulario') } })
    expect(w.element.tagName).toBe('DIV')
    expect(w.classes()).toEqual(['g-helper-scope'])
    expect(w.text()).toBe('Formulario')
  })
  it('as elige el elemento y los atributos van a la raíz; sin rol propio', () => {
    const w = mount(GHelperScope, { props: { as: 'section' }, attrs: { id: 'x', 'aria-label': 'Alta' } })
    expect(w.element.tagName).toBe('SECTION')
    expect(w.attributes()).toMatchObject({ id: 'x', 'aria-label': 'Alta' })
    expect(w.attributes('role')).toBeUndefined()
  })
})
