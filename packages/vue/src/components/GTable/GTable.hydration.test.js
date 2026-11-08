// Hidratación de GTable con otro día en el cliente (#1033): el filtro de fecha «últimos N días» depende de hoy, que se lee
// al montar. Antes, ese filtro aún no filtra (el servidor y el primer pintado del cliente pintan las mismas filas).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { h, nextTick } from 'vue'
import GTable from './GTable.vue'
import { hydrate } from '../../utils/hydrationTestEnv.js'

const columns = [{ key: 'nombre', label: 'Nombre', primary: true }, { key: 'alta', label: 'Alta', filter: { type: 'date' } }]
const rows = [{ id: 'a', nombre: 'Ana', alta: '2026-11-06' }, { id: 'b', nombre: 'Bruno', alta: '2026-11-07' }, { id: 'c', nombre: 'Carla', alta: '2026-11-08' }]
const labels = { empty: 'Sin filas', emptyFiltered: 'Ninguna cumple', clearFilters: 'Limpiar', results: '{count} resultados', filters: { group: 'Filtros', add: 'Agregar', clear: 'Limpiar', filterBy: 'Filtrar por {label}', edit: 'Editar {summary}', remove: 'Quitar {summary}', apply: 'Aplicar', cancel: 'Cancelar', required: 'Falta', days: '{n} días' } }
const App = { render: () => h(GTable, { columns, rows, caption: 'Altas', labels, filters: [{ key: 'alta', op: 'last', value: 1 }] }) }
const at = (y, m, d) => new Date(y, m - 1, d, 10, 0, 0)
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); document.body.innerHTML = '' })

describe('hidratación · GTable · otro día en el cliente', () => {
  it('«últimos N días»: sin desajustes; al montar, filtra con el día del cliente', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(at(2026, 11, 7))
    const r = await hydrate(App, () => { vi.setSystemTime(at(2026, 11, 8)); return null })
    expect(r.mismatch).toEqual([])
    for (let i = 0; i < 3; i++) await nextTick()
    const text = r.el.querySelector('tbody').textContent
    expect(text).toContain('Bruno')
    expect(text).toContain('Carla')
    expect(text).not.toContain('Ana')
  })
})
