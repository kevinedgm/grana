// @vitest-environment node
// GNumberField en el servidor · number-field.md «SSR» (#310): sin locale, servidor y primer render escriben el canónico;
// con locale, el formateado; el oculto lleva el canónico; sin is-ready; sin tocar window, document, navigator ni matchMedia.
import { describe, it, expect } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GNumberField from './GNumberField.vue'

const render = (props) => renderToString(createSSRApp({ render: () => h(GNumberField, { label: 'Peso', name: 'peso', ...props }) }))

describe('SSR · GNumberField', () => {
  it('sin entorno de navegador', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
  })

  it('sin locale: el texto canónico en el campo, el espejo y aria-valuetext; oculto canónico', async () => {
    const html = await render({ modelValue: 1234.5, steppers: true, decrementLabel: 'Restar', incrementLabel: 'Sumar' })
    expect(html).toMatch(/<input[^>]*class="g-input__field g-number-field__field"[^>]*value="1234.5"/)
    expect(html).toContain('aria-valuetext="1234.5"')
    expect(html).toContain('<span class="g-number-field__mirror" aria-hidden="true">1234.5</span>')
    expect(html).toMatch(/<input type="hidden" name="peso" value="1234.5"/)
    expect(html).toContain('role="spinbutton"')
    expect(html).toContain('g-number-field__steppers')
    expect(html).not.toContain('is-ready')
    expect(html).not.toContain('g-number-field__roll')
  })

  it('con locale: el texto ya formateado (idéntico al primer render del cliente)', async () => {
    const html = await render({ modelValue: 12345.5, locale: 'es', precision: 1 })
    expect(html).toMatch(/value="12\.345,5"/)
    expect(html).toContain('aria-valuetext="12.345,5"')
    expect(html).toMatch(/<input type="hidden" name="peso" value="12345.5"/)
  })
})
