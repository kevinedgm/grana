// @vitest-environment node
// GFileField en el servidor · design/contracts/file-field.md «SSR»: importar y renderizar no toca document, window,
// navigator, URL.createObjectURL ni DataTransfer. Pinta etiqueta, caja con las fichas del modelo (guardados con su url como
// miniatura; los demás con su icono), la cara, el pie y los ocultos. El arrastre, la cola y las URL de objeto, al montar.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GFileField from './GFileField.vue'
import FileField, { formatFileSize } from '../../file-field.js'
import { LABELS } from './fileFieldTestEnv.js'

afterEach(() => vi.restoreAllMocks())
const render = (props) => renderToString(createSSRApp({ render: () => h(GFileField, { label: 'Fotos', labels: LABELS, ...props }) }))

describe('SSR · GFileField', () => {
  it('vacío: sin window ni document; control, cara, pista copiada, región viva vacía; sin avisos', async () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const html = await render({ id: 'ff', name: 'fotos', hint: 'PNG', multiple: true })
    expect(html).toContain('class="g-file-field g-file-field--size-md g-file-field--variant-outline g-file-field--density-default is-multiple"')
    expect(html).toMatch(/<input class="g-file-field__input"[^>]*id="ff"[^>]*type="file"[^>]*name="fotos"[^>]*multiple[^>]*aria-labelledby="ff-label ff-action"/)
    expect(html).toContain('<span id="ff-action" class="g-file-field__action">Adjuntar archivos</span>')
    expect(html).toMatch(/<span class="g-file-field__add-hint" aria-hidden="true">(<!--\[-->)?PNG(<!--\]-->)?<\/span>/)
    expect(html).toContain('<div class="g-file-field__live" role="status" aria-live="polite" aria-atomic="true"></div>')
    expect(html).not.toContain('is-ready')
    expect(warn).not.toHaveBeenCalled()
  })

  it('con guardados: fichas, miniatura con la url del servidor, tamaños con formato fijo y ocultos con el value', async () => {
    const html = await render({ id: 'ff', name: 'fotos', multiple: true, modelValue: [
      { key: 'g1', name: 'Receta.pdf', size: 220000, type: 'application/pdf', value: 'doc-118' },
      { key: 'g2', name: 'foto.jpg', size: 1240000, type: 'image/jpeg', value: 'doc-119', url: 'https://x/t.jpg' }
    ] })
    expect(html).toContain('has-files')
    expect(html).toMatch(/<ul class="g-file-field__list" role="list" aria-label="Archivos de Fotos">/)
    expect(html.match(/class="g-file-field__chip"/g)).toHaveLength(2)
    expect(html).toContain('data-state="done" data-stored=""')
    expect(html).toContain('220 kB')
    expect(html).toContain('1.2 MB')
    expect(html).toContain('src="https://x/t.jpg"')
    expect(html).toContain('<input type="hidden" name="fotos" value="doc-118">')
    expect(html).toContain('<input type="hidden" name="fotos" value="doc-119">')
    expect(html).toContain('Añadir más')
  })

  it('la entrada se importa en el servidor (formatFileSize, plugin)', () => {
    expect(formatFileSize(1240000, 'en-US')).toBe('1.2 MB')
    expect(typeof FileField.install).toBe('function')
  })
})
