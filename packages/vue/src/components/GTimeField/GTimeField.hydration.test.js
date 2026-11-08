// Hidratación de GTimeField: sin `locale`, servidor y primer render escriben el canónico «HH:mm»; al montar, el idioma del
// documento. El idioma del navegador no entra en el primer render.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h, nextTick } from 'vue'
import GTimeField from './GTimeField.vue'
import { clientLocale, hydrate } from '../../utils/hydrationTestEnv.js'

const App = (props) => ({ render: () => h(GTimeField, { id: 't', label: 'Hora', name: 'hora', labels: { invalid: 'Escribe una hora' }, ...props }) })
let undo = null
afterEach(() => { undo?.(); undo = null; vi.restoreAllMocks(); document.body.innerHTML = '' })

describe('hidratación · GTimeField', () => {
  it('sin locale y navegador en es-MX: hidrata sin desajustes y, al montar, la hora en 12 h del idioma', async () => {
    const r = await hydrate(App({ modelValue: '21:30' }), () => clientLocale('es-MX'))
    undo = r.undo
    expect(r.mismatch).toEqual([])
    await nextTick(); await nextTick()
    expect(r.el.querySelector('input[role="spinbutton"]').value).toMatch(/^9:30\s?p\.\s?m\.$/)
  })

  it('con locale: hidrata sin desajustes', async () => {
    const r = await hydrate(App({ modelValue: '21:30', locale: 'es-MX' }), () => clientLocale('en-US'))
    undo = r.undo
    expect(r.mismatch).toEqual([])
  })
})
