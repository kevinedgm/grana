// @vitest-environment node
// GPrice en el servidor · price.md «SSR» (#775): con locale (en el precio o en su región), el precio formateado y la frase;
// sin locale, la forma canónica «1850 MXN», idéntica en servidor y primer render del cliente; sin tocar el DOM.
import { describe, it, expect } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GPrice from './GPrice.vue'
import GPriceScope from '../GPriceScope/GPriceScope.vue'

const L = { range: '{min} a {max}', total: 'Total', legend: 'Precios en {name} ({code})' }
const render = (props, scope) => renderToString(createSSRApp({
  render: () => (scope ? h(GPriceScope, scope, () => h(GPrice, props)) : h(GPrice, { labels: L, ...props }))
}))

describe('SSR · GPrice', () => {
  it('sin entorno de navegador', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
  })
  it('con locale: formateado y frase', async () => {
    const html = await render({ value: { amount: 1850, currency: 'MXN' }, locale: 'es-MX', total: { value: { amount: 3700, currency: 'MXN' }, label: 'por 2 noches' } })
    expect(html).toContain('<span class="g-price__number">1,850</span>')
    expect(html).toContain('Total por 2 noches: 3,700 pesos mexicanos. 1,850 pesos mexicanos')
    expect(html).not.toContain('is-rolling')
  })
  it('con locale en la región: el de la región', async () => {
    const html = await render({ value: { amount: 1850, currency: 'MXN' } }, { currency: 'MXN', locale: 'es-MX', labels: L })
    expect(html).toContain('1,850 pesos mexicanos')
    expect(html).toContain('Precios en pesos mexicanos (MXN)')
  })
  it('sin locale: forma canónica «1850 MXN» en lo visible y en la frase', async () => {
    const html = await render({ value: { amount: 1850.5, currency: 'MXN' } })
    expect(html).toMatch(/<span class="g-price__number">1850.5<\/span>(<!---->)?<span class="g-price__code">MXN<\/span>/)
    expect(html).toContain('<span class="g-price__spoken">1850.5 MXN</span>')
    const again = await render({ value: { amount: 1850.5, currency: 'MXN' } })
    expect(again).toBe(html)
  })
})
