// @vitest-environment node
// GDialog en el servidor · dialog.md «Personalidad» (#301): sin window ni document, ni origen ni borde fijado.
import { describe, it, expect } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GDialog from './GDialog.vue'

describe('SSR · GDialog', () => {
  it('abierto en el servidor: sin has-origin, sin is-pinned y sin variables dinámicas', async () => {
    const app = createSSRApp({ render: () => h(GDialog, { modelValue: true, title: 'Título', closeLabel: 'Cerrar' }, () => 'Cuerpo') })
    const html = await renderToString(app)
    expect(html).toContain('g-dialog--placement-center')
    expect(html).not.toContain('has-origin')
    expect(html).not.toContain('is-pinned')
    expect(html).not.toContain('--_origin')
    expect(html).not.toContain('--_pin-top')
  })
})
