// @vitest-environment node
// GAccordion en el servidor · design/contracts/accordion.md «Estructura accesible» (SSR, #477): se pinta según el modelo,
// plegado con hidden="until-found" desde el primer HTML (la búsqueda de la página funciona antes de hidratar), abierto sin
// él; sin inert, sin is-ready y sin leer el fragmento. Entorno node: sin window ni document.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GAccordion from './GAccordion.vue'
import GAccordionItem from './GAccordionItem.vue'

afterEach(() => vi.restoreAllMocks())

const item = (id, extra = {}) => h(GAccordionItem, { id, title: `T ${id}`, ...extra }, { default: () => `contenido ${id}` })
const render = (props, children) => renderToString(createSSRApp({ render: () => h(GAccordion, props, { default: () => children }) }))

describe('SSR · GAccordion', () => {
  it('plegado: hidden="until-found" como atributo (no booleano); abierto: sin hidden; sin inert ni is-ready', async () => {
    expect(typeof window).toBe('undefined')
    const html = await render({ modelValue: ['b'] }, [item('a', { peek: 'Avance de a' }), item('b')])
    expect(html).toContain('id="a-content" class="g-accordion-item__content" role="region" aria-labelledby="a-toggle" hidden="until-found"')
    expect(html).not.toMatch(/hidden(?!=)/)
    expect(html).toMatch(/id="b-content" class="g-accordion-item__content" role="region" aria-labelledby="b-toggle">/)
    expect(html).not.toContain('inert')
    expect(html).not.toContain('is-ready')
    expect(html).toContain('<h3 class="g-accordion-item__heading"><button id="a-toggle" type="button" class="g-accordion-item__toggle" aria-expanded="false" aria-controls="a-content" aria-describedby="a-peek">')
    expect(html).toContain('aria-expanded="true" aria-controls="b-content">')
    expect(html).toContain('contenido a')
  })

  it('la regla de region sale igual que en el cliente: 7 elementos sin rol, exclusive con rol', async () => {
    const seven = Array.from({ length: 7 }, (_, i) => item(`i${i}`))
    const html = await render({}, seven)
    expect(html).not.toContain('role="region"')
    const ex = await render({ exclusive: true }, Array.from({ length: 7 }, (_, i) => item(`e${i}`)))
    expect(ex.match(/role="region"/g)).toHaveLength(7)
  })

  it('exclusive con dos valores: solo el primero en orden del documento, también en el servidor', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const html = await render({ exclusive: true, modelValue: ['c', 'a'] }, [item('a'), item('b'), item('c')])
    expect(html).toContain('id="a-toggle" type="button" class="g-accordion-item__toggle" aria-expanded="true"')
    expect(html).toContain('id="c-toggle" type="button" class="g-accordion-item__toggle" aria-expanded="false"')
  })

  it('lazy sin abrir: cuerpo vacío; suelto abierto con open', async () => {
    const html = await renderToString(createSSRApp({
      render: () => [h(GAccordionItem, { id: 'l', title: 'L', lazy: true }, { default: () => 'pesado' }), h(GAccordionItem, { id: 's', title: 'S', open: true }, { default: () => 'suelto' })]
    }))
    expect(html).not.toContain('pesado')
    expect(html).toContain('<div class="g-accordion-item__body"><!----></div>')
    expect(html).toContain('class="g-accordion-item is-open is-standalone"')
    expect(html).toContain('suelto')
  })

  it('sin avisos de Vue ni de Grana en un render limpio', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await render({ modelValue: ['a'], sticky: true }, [item('a', { value: 'a', meta: 'm' }), item('b', { value: 'b' })])
    expect(warn).not.toHaveBeenCalled()
  })
})
