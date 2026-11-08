// Hidratación de GPageIndex (page-index.md «SSR»): el primer render no lee location, matchMedia ni cajas; pinta items y
// modelValue. El HTML del servidor ya trae el índice (la pila con todas las etiquetas) y el cliente hidrata sin desajustes.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GPageIndex from './GPageIndex.vue'

const ITEMS = [{ id: 'uso', label: 'Ejemplos' }, { id: 'api', label: 'API' }]
const App = () => ({ render: () => h('div', [h(GPageIndex, { id: 'pi', label: 'En esta página', items: ITEMS, modelValue: 'api' })]) })

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

describe('hidratación · GPageIndex', () => {
  it('el servidor pinta el índice con la actual y el cliente hidrata sin desajustes', async () => {
    const html = await renderToString(createSSRApp(App()))
    expect(html).toContain('g-page-index__stack')
    expect(html).toContain('>API</span>')
    expect(html).toContain('aria-label="En esta página"')
    const el = document.createElement('div')
    el.innerHTML = html
    document.body.append(el)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    createSSRApp(App()).mount(el)
    await nextTick()
    const mismatch = [...warn.mock.calls, ...error.mock.calls].map((c) => String(c[0])).filter((t) => /hydration/i.test(t))
    expect(mismatch).toEqual([])
    expect(el.querySelector('.g-page-index__current').textContent).toBe('API')
  })
})
