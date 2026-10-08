// @vitest-environment node
// GLoadRegion, GEmpty y el motor en el servidor (load-region.md «Motor compartido»: sin efectos al importar, #444, y sin
// tocar document ni window en el servidor; los temporizadores se programan al montar, no en el servidor).
import { describe, it, expect, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

describe('SSR · GLoadRegion y GEmpty', () => {
  it('importar las entradas no toca document ni window', async () => {
    const touched = []
    const trap = (name) => new Proxy({}, { get(_, k) { touched.push(`${name}.${String(k)}`); return undefined } })
    globalThis.window = trap('window')
    globalThis.document = trap('document')
    try {
      await import('../../index.js')
      await import('../../load-region.js')
      await import('../../utils/loadPhase.js')
    } finally {
      delete globalThis.window
      delete globalThis.document
    }
    expect(touched).toEqual([])
  })

  it('se renderiza cargando (molde, aria-busy) sin programar temporizadores ni crear el canal', async () => {
    vi.useFakeTimers()
    const { GLoadRegion } = await import('../../load-region.js')
    const { GEmpty, GTable } = await import('../../index.js')
    const app = createSSRApp({
      render: () => [
        h(GLoadRegion, { loading: true, items: null, sample: [{ id: 's1', name: 'Tipo' }], label: 'Muestras', labels: { loading: 'C', slow: 'S', loaded: 'L' } }, {
          default: ({ items, itemAttrs }) => h('ul', items.map((i) => h('li', { key: i.id, ...itemAttrs(i) }, i.name)))
        }),
        h(GEmpty, { cause: 'filtered', title: 'Ninguna', filters: [{ key: 'a', label: 'A', count: 2 }], labels: { relax: 'Quitar {label}', returns: '{count} vuelven', clear: 'Todos' } }),
        h(GTable, { columns: [{ key: 'a', label: 'A' }], rows: [], caption: 'T', loading: true, labels: { loading: 'C', results: '{count}' } })
      ]
    })
    const html = await renderToString(app)
    expect(html).toContain('class="g-load-region is-busy is-pending is-mold"')
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('data-g-key="s1"')
    expect(html).toContain('g-empty__relax')
    expect(html).toContain('g-table__skeleton')
    expect(html).not.toContain('g-load-live')
    expect(vi.getTimerCount()).toBe(0)
    vi.useRealTimers()
  })
})
