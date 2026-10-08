// @vitest-environment node
// GSlider en el servidor · slider.md «SSR»: importar y renderizar no toca document, window, navigator, matchMedia ni
// ResizeObserver; sin locale, la píldora, aria-valuetext y las referencias llevan el canónico; con locale, el formateado;
// las posiciones salen de fracciones; --_pill-w en 0px; los ocultos con el canónico; sin is-ready.
import { describe, it, expect } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GSlider from './GSlider.vue'

const render = (props) => renderToString(createSSRApp({ render: () => h(GSlider, { label: 'Precio', name: 'p', ...props }) }))

describe('SSR · GSlider', () => {
  it('sin entorno de navegador', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(typeof navigator === 'undefined' || typeof navigator.language === 'string').toBe(true)
  })

  it('sin locale: el canónico en la píldora y en aria-valuetext; fracciones; --_pill-w 0px; ocultos canónicos', async () => {
    const html = await render({ range: true, modelValue: [800, 2400], max: 5000, step: 50, format: { style: 'currency', currency: 'MXN' }, labels: { start: 'mínimo', end: 'máximo' } })
    expect(html).toContain('<span class="g-slider__pill-text" dir="auto">2400</span>')
    expect(html).toContain('aria-valuetext="800"')
    expect(html).toContain('--_at:0.16')
    expect(html).toContain('--_to:0.48')
    expect(html).toContain('--_pill-w:0px')
    expect(html).toMatch(/<input type="hidden" name="p" value="800">/)
    expect(html).toMatch(/<input type="hidden" name="p" value="2400">/)
    expect(html).not.toContain('is-ready')
    expect(html).toContain('role="group"')
  })

  it('con locale: el texto ya formateado (idéntico al primer render del cliente)', async () => {
    const html = await render({ modelValue: 2400, max: 5000, locale: 'es-MX', format: { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 } })
    expect(html).toContain('>$2,400</span>')
    expect(html).toContain('aria-valuetext="$2,400"')
    expect(html).toMatch(/<input type="hidden" name="p" value="2400">/)
  })
})
