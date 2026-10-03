// @vitest-environment node
// GAvatar en el servidor · design/contracts/avatar.md «Imagen» (SSR) y «Iniciales» (mayúsculas sin configuración regional).
// Entorno node: sin window ni document. Con src, el servidor emite is-loading y el respaldo; al hidratar, onMounted comprueba
// complete/naturalWidth (eso se prueba en el navegador y en GAvatar.test.js).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GAvatar from './GAvatar.vue'

afterEach(() => vi.restoreAllMocks())

const render = (props) => renderToString(createSSRApp({ render: () => h(GAvatar, props) }))

describe('SSR · GAvatar', () => {
  it('con src: is-loading, respaldo presente (primero) y la <img alt=""> última', async () => {
    expect(typeof window).toBe('undefined')
    const html = await render({ src: '/ana.png', name: 'Ana María López', size: 'lg', categories: 8 })
    expect(html).toBe(
      '<span class="g-avatar g-avatar--size-lg g-avatar--shape-circle g-avatar--content-initials is-loading" data-cat="2" aria-hidden="true">' +
      '<span class="g-avatar__initials" dir="auto" translate="no">AL</span>' +
      // Vue serializa alt="" como «alt» sin valor: en HTML es exactamente la cadena vacía (imagen decorativa)
      '<img class="g-avatar__img" src="/ana.png" alt loading="lazy" decoding="async" draggable="false"></span>'
    )
  })

  it('con label: role="img" + aria-label; icono de respaldo del servidor', async () => {
    const html = await render({ src: '/logo.png', label: 'Grana Labs', shape: 'square' })
    expect(html).toMatch(/^<span class="g-avatar g-avatar--size-md g-avatar--shape-square g-avatar--content-icon is-loading" role="img" aria-label="Grana Labs">/)
    expect(html).toMatch(/<svg class="g-icon g-avatar__icon"[^>]*aria-hidden="true"/)
    expect(html).not.toMatch(/aria-hidden="true" role/)
  })

  it('servidor y cliente dan las mismas iniciales y la misma categoría (sin configuración regional)', async () => {
    const html = await render({ name: 'łukasz żółw', categories: 12, colorKey: 'Zoë' })
    expect(html).toContain('>ŁŻ<')
    expect(html).toContain('data-cat="11"')
  })

  it('sin avisos de Vue ni de Grana en un render limpio', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await render({ src: '/a.png', name: 'Ana', label: 'Ana' })
    expect(warn).not.toHaveBeenCalled()
  })
})
