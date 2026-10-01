// @vitest-environment node
// SSR: importar @grana/vue y crear el gestor no toca document, window, navigator ni matchMedia;
// en el servidor GToaster no pinta nada (ni raíz ni Teleport) y los métodos del gestor no fallan.
import { describe, it, expect, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

describe('GToaster · SSR (entorno node)', () => {
  it('no hay DOM en este entorno', () => {
    expect(typeof document).toBe('undefined')
    expect(typeof window).toBe('undefined')
  })

  it('importar el paquete y crear el gestor no toca el DOM; los métodos no fallan ni arrancan temporizadores', async () => {
    const { createToaster } = await import('../../index.js')
    const timer = vi.spyOn(globalThis, 'setTimeout')
    const t = createToaster({ labels: { region: 'Notificaciones', close: 'Cerrar' } })
    expect(t.success('Hecho')).toBe('toast-1')
    t.update('toast-1', { title: 'Hecho otra vez' })
    t.promise(Promise.resolve(1), { loading: 'Cargando', success: 'Listo' })
    t.configure({ position: 'top-center' })
    t.dismiss('toast-1')
    t.clear()
    expect(timer).not.toHaveBeenCalled()
    timer.mockRestore()
  })

  it('renderToString con GToaster: sin marcado de la región ni errores', async () => {
    const { createToaster, GToaster } = await import('../../index.js')
    const t = createToaster({ labels: { region: 'Notificaciones', close: 'Cerrar' } })
    t.info('Antes de hidratar')
    const app = createSSRApp({ render: () => h('main', [h('p', 'Hola'), h(GToaster)]) })
    app.use(t)
    const html = await renderToString(app)
    expect(html).toContain('<p>Hola</p>')
    expect(html).not.toContain('g-toaster')
    expect(html).not.toContain('g-toast')
    expect(html).not.toContain('popover')
  })
})
