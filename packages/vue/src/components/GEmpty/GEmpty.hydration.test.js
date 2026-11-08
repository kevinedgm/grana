// Hidratación de GEmpty: las cuentas («Antes había {total}») y la lista de filtros («A y B») se formatean con Intl. Antes de
// montar, sin `locale`, nada del entorno; al montar, el idioma del documento.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h, nextTick } from 'vue'
import GEmpty from './GEmpty.vue'
import { clientLocale, hydrate } from '../../utils/hydrationTestEnv.js'

const LABELS = { relax: 'Quitar «{label}»', returns: 'vuelven {count}', clear: 'Quitar todos', before: 'Antes había {total} con {filters}.' }
const FILTERS = [{ key: 'a', label: 'Activos', count: 1200 }, { key: 'b', label: 'Norte', count: 30 }]
const App = (props) => ({ render: () => h(GEmpty, { cause: 'filtered', title: 'Sin resultados', filters: FILTERS, total: 12345, labels: LABELS, ...props }) })
let undo = null
afterEach(() => { undo?.(); undo = null; vi.restoreAllMocks(); document.body.innerHTML = '' })

describe('hidratación · GEmpty', () => {
  it('sin locale y navegador en es: hidrata sin desajustes y, al montar, cuentas y lista en español', async () => {
    const r = await hydrate(App({}), () => clientLocale('es'))
    undo = r.undo
    expect(r.mismatch).toEqual([])
    await nextTick(); await nextTick()
    expect(r.el.textContent).toContain('Antes había 12.345 con Activos y Norte.')
  })

  it('con locale: hidrata sin desajustes', async () => {
    const r = await hydrate(App({ locale: 'es-MX' }), () => clientLocale('de'))
    undo = r.undo
    expect(r.mismatch).toEqual([])
  })
})
