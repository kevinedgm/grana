// @vitest-environment node
// SSR (status.md «SSR»): importar el gestor y los componentes no toca document, window ni navigator; en el servidor
// GStatusIsland no pinta nada, GStatus no hace nada, GStatusMark de texto renderiza normal y con `for` no renderiza.
import { describe, it, expect, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

describe('Isla de estado · SSR (entorno node)', () => {
  it('no hay DOM en este entorno', () => {
    expect(typeof document).toBe('undefined')
    expect(typeof window).toBe('undefined')
  })

  it('crear el gestor y usar sus métodos no toca el DOM ni arranca temporizadores', async () => {
    const { createStatus } = await import('./status.js')
    const timer = vi.spyOn(globalThis, 'setTimeout')
    const interval = vi.spyOn(globalThis, 'setInterval')
    const s = createStatus({ labels: { types: { error: 'Error', success: 'Correcto', info: 'Información' } } })
    expect(s.set('save', { type: 'error', title: 'No se pudo guardar', deadline: Date.now() + 1000, action: { label: 'Reintentar', onClick: () => Promise.resolve() } })).toBe('save')
    s.update('save', { description: 'x' })
    s.announce('save')
    s.open('save', { focus: true })
    s.close()
    s.acknowledge()
    s.resolve('save', 'Guardada')
    s.info('i', 'i')
    s.remove('i')
    s.clear()
    s.configure({ position: 'top-end' })
    expect(s.state).toEqual({ form: 'empty', count: 0, mobile: false })
    expect(timer).not.toHaveBeenCalled()
    expect(interval).not.toHaveBeenCalled()
    timer.mockRestore()
    interval.mockRestore()
  })

  it('renderToString: sin marcado de la isla; GStatus no registra; la marca de texto sí renderiza y la marca enlace no', async () => {
    const { createStatus } = await import('./status.js')
    const { default: GStatusIsland } = await import('./GStatusIsland.vue')
    const { default: GStatusMark } = await import('../GStatusMark/GStatusMark.vue')
    const { default: GStatus } = await import('../GStatus/GStatus.vue')
    const s = createStatus({ labels: { types: { warning: 'Advertencia', error: 'Error' } } })
    s.error('pre', 'Antes de hidratar')
    const app = createSSRApp({ render: () => h('main', [
      h('p', 'Hola'),
      h(GStatus, { id: 'view', type: 'error', title: 'No se pudo cargar' }),
      h(GStatusMark, { for: 'pre' }),
      h(GStatusMark, { type: 'warning' }, { default: () => 'Tu tarjeta caduca este mes.' }),
      h(GStatusIsland)
    ]) })
    app.use(s)
    const html = await renderToString(app)
    expect(html).toContain('<p>Hola</p>')
    expect(html).not.toContain('g-status-island')
    expect(html).not.toContain('g-status-item')
    expect(html).not.toContain('popover')
    expect(html).not.toContain('g-status-mark--link')
    expect(html).toContain('g-status-mark g-status-mark--text g-status-mark--type-warning')
    expect(html).toContain('Advertencia: </span>')
    expect(html).toContain('Tu tarjeta caduca este mes.')
    expect(s.has('view')).toBe(false)
    expect(s.conditions.map((c) => c.id)).toEqual(['pre'])
  })
})
