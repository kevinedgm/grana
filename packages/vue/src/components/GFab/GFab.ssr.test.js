// @vitest-environment node
// GFab en el servidor · fab.md «Colores forzados, RTL, SSR»: ids SSR-seguros, sin window ni document al importar ni al
// pintar, sin reservas, velo ni medidas hasta montar en el cliente; importar el módulo no tiene efectos (#444).
import { describe, it, expect } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GFab from './GFab.vue'

const items = [{ id: 'a', label: 'Nueva muestra' }, { id: 'b', label: 'Tomar foto' }, { id: 'c', label: 'Dictar nota' }]

describe('SSR · GFab', () => {
  it('A contraído: raíz con sus datos, FAB con haspopup, lista vacía y velo; sin reservas ni medidas', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(GFab, { label: 'Crear', items }) }))
    expect(html).toContain('class="g-fab"')
    expect(html).toContain('data-state="closed"')
    expect(html).toContain('aria-haspopup="menu"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toMatch(/id="g-fab-[^"]+-trigger"/)
    expect(html).toContain('g-fab__scrim')
    expect(html).not.toContain('--_reserve')
    expect(html).not.toContain('--_x')
    expect(html).not.toContain('role="menuitem"')
  })

  it('C y single en el servidor; abierto por el prop no abre hasta montar', async () => {
    const c = await renderToString(createSSRApp({ render: () => h(GFab, { label: 'Crear', items, main: 'a', labels: { moreShort: 'Más' }, modelValue: true }) }))
    expect(c).toContain('g-fab__main-group')
    expect(c).toContain('data-appearance="main"')
    expect(c).not.toContain('role="menuitem"')
    const s = await renderToString(createSSRApp({ render: () => h(GFab, { items: [items[0]] }) }))
    expect(s).toContain('data-appearance="single"')
    expect(await renderToString(createSSRApp({ render: () => h(GFab, { items: [] }) }))).toBe('<!---->')
  })
})
