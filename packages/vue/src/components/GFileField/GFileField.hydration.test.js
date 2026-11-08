// Hidratación de GFileField: los tamaños de las fichas guardadas usan un formato fijo antes de montar (sin `locale`); al
// montar, el idioma del documento. El idioma del navegador no entra en el primer render.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h, nextTick } from 'vue'
import GFileField from './GFileField.vue'
import { LABELS } from './fileFieldTestEnv.js'
import { clientLocale, hydrate } from '../../utils/hydrationTestEnv.js'

const FILES = [
  { key: 'g1', name: 'Receta.pdf', size: 220000, type: 'application/pdf', value: 'doc-118' },
  { key: 'g2', name: 'foto.jpg', size: 1240000, type: 'image/jpeg', value: 'doc-119' }
]
const App = (props) => ({ render: () => h(GFileField, { id: 'ff', label: 'Fotos', name: 'fotos', multiple: true, labels: LABELS, modelValue: FILES, ...props }) })
let undo = null
afterEach(() => { undo?.(); undo = null; vi.restoreAllMocks(); document.body.innerHTML = '' })

describe('hidratación · GFileField', () => {
  it('sin locale y navegador en es: hidrata sin desajustes y, al montar, los tamaños en español', async () => {
    const r = await hydrate(App({}), () => clientLocale('es'))
    undo = r.undo
    expect(r.html).toContain('1.2 MB')
    expect(r.mismatch).toEqual([])
    await nextTick(); await nextTick()
    expect(r.el.textContent).toContain('1,2 MB')
  })

  it('con locale: hidrata sin desajustes', async () => {
    const r = await hydrate(App({ locale: 'de' }), () => clientLocale('en-US'))
    undo = r.undo
    expect(r.mismatch).toEqual([])
  })
})
