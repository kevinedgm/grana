// @vitest-environment node
// GMenu en el servidor · menu.md «Personalidad» (#305): la lista abierta trae su resaltado único, pero sin activo,
// sin has-highlight ni variables (las escribe el cliente al enfocar), y sin tocar window ni document.
import { describe, it, expect } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GMenu from './GMenu.vue'

describe('SSR · GMenu', () => {
  it('abierto en el servidor: g-menu__highlight presente, sin has-highlight, is-highlight-instant ni --_active-*', async () => {
    const app = createSSRApp({
      render: () => h(GMenu, { modelValue: true, items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] }, {
        trigger: ({ attrs }) => h('button', { ...attrs, type: 'button' }, 'Acciones')
      })
    })
    const html = await renderToString(app)
    expect(html).toContain('g-menu__highlight')
    expect(html).toContain('aria-labelledby="g-menu-')
    expect(html).not.toContain('has-highlight')
    expect(html).not.toContain('is-highlight-instant')
    expect(html).not.toContain('--_active')
  })
})
