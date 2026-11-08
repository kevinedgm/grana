// Hidratación de GNumberField: el primer pintado del cliente coincide con el del servidor aunque el idioma por defecto del
// entorno no sea el mismo (Node en-US frente a WebKit con el idioma del sistema). Antes de montar, sin `locale`, el texto
// canónico; al montar, el idioma del documento.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h, nextTick } from 'vue'
import GNumberField from './GNumberField.vue'
import { clientLocale, hydrate } from '../../utils/hydrationTestEnv.js'

const App = (props) => ({ render: () => h(GNumberField, { id: 'n', label: 'Peso', name: 'peso', ...props }) })
let undo = null
afterEach(() => { undo?.(); undo = null; vi.restoreAllMocks(); document.body.innerHTML = '' })

describe('hidratación · GNumberField', () => {
  it('sin locale y navegador en es: hidrata sin desajustes y, al montar, formatea en español', async () => {
    const r = await hydrate(App({ modelValue: 12345.5 }), () => clientLocale('es'))
    undo = r.undo
    expect(r.mismatch).toEqual([])
    await nextTick(); await nextTick()
    expect(r.el.querySelector('input[role="spinbutton"]').value).toBe('12.345,5')
  })

  it('con moneda y sin locale: hidrata sin desajustes', async () => {
    const r = await hydrate(App({ modelValue: 12345.5, currency: 'MXN' }), () => clientLocale('es-MX'))
    undo = r.undo
    expect(r.mismatch).toEqual([])
  })

  it('con locale: hidrata sin desajustes', async () => {
    const r = await hydrate(App({ modelValue: 12345.5, locale: 'es-MX', precision: 1 }), () => clientLocale('de'))
    undo = r.undo
    expect(r.mismatch).toEqual([])
  })
})
