// @vitest-environment node
// GTimeField en el servidor · time-field.md «SSR»: sin locale, servidor y primer render escriben el canónico; con locale, el
// formateado; el oculto lleva el canónico; la lectura en palabras, su parte de aria-valuetext, las dos lecturas y el
// medidor solo existen en el cliente; sin tocar window, document, navigator ni matchMedia.
import { describe, it, expect } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GTimeField from './GTimeField.vue'

const render = (props) => renderToString(createSSRApp({ render: () => h(GTimeField, { label: 'Hora', name: 'hora', labels: { invalid: 'Escribe una hora' }, ...props }) }))

describe('SSR · GTimeField', () => {
  it('sin entorno de navegador', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
  })

  it('sin locale: el canónico en el campo, el espejo y aria-valuetext; oculto canónico; sin lectura', async () => {
    const html = await render({ modelValue: '09:07' })
    expect(html).toMatch(/<input[^>]*class="g-input__field g-time-field__field"[^>]*value="09:07"/)
    expect(html).toContain('aria-valuetext="09:07"')
    expect(html).toContain('aria-valuenow="547"')
    expect(html).toContain('<span class="g-time-field__mirror" aria-hidden="true">09:07</span>')
    expect(html).toMatch(/<input type="hidden" name="hora" value="09:07"/)
    expect(html).toContain('role="spinbutton"')
    expect(html).not.toContain('g-time-field__reading')
    expect(html).not.toContain('g-time-field__choices')
    expect(html).not.toContain('is-ready')
  })

  it('con locale: el texto ya formateado, sin la franja en aria-valuetext; 12 h con a. m./p. m.', async () => {
    const html = await render({ modelValue: '21:30', locale: 'es-MX' })
    expect(html).toMatch(/value="9:30\s?p\.\s?m\."/)
    expect(html).toMatch(/aria-valuetext="9:30\s?p\.\s?m\."/)
    expect(html).toContain('dir="ltr"')
    expect(html).toMatch(/<input type="hidden" name="hora" value="21:30"/)
    expect(html).toContain('g-time-field--h12')
    expect(html).toContain('g-time-field__halves')
    expect(html).not.toContain('de la noche')
  })

  it('ar-EG: cifras del idioma y dir=rtl desde el servidor', async () => {
    const html = await render({ modelValue: '21:30', locale: 'ar-EG' })
    expect(html).toContain('value="٩:٣٠ م"')
    expect(html).toContain('dir="rtl"')
  })
})
