// Hidratación de GPrice: sin `locale`, la forma canónica «1850 MXN» antes de montar; al montar, el idioma del documento.
// El idioma del navegador no entra en el primer render.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h, nextTick } from 'vue'
import GPrice from './GPrice.vue'
import { clientLocale, hydrate } from '../../utils/hydrationTestEnv.js'

const L = { range: '{min} a {max}', total: 'Total', legend: 'Precios en {name} ({code})' }
const App = (props) => ({ render: () => h(GPrice, { labels: L, value: { amount: 1850.5, currency: 'MXN' }, ...props }) })
let undo = null
afterEach(() => { undo?.(); undo = null; vi.restoreAllMocks(); document.body.innerHTML = '' })

describe('hidratación · GPrice', () => {
  it('sin locale y navegador en es-MX: hidrata sin desajustes y, al montar, el precio formateado', async () => {
    const r = await hydrate(App({}), () => clientLocale('es-MX'))
    undo = r.undo
    expect(r.html).toContain('1850.5 MXN')
    expect(r.mismatch).toEqual([])
    await nextTick(); await nextTick()
    expect(r.el.querySelector('.g-price__spoken').textContent).toMatch(/peso/)
  })

  it('con locale y total: hidrata sin desajustes', async () => {
    const r = await hydrate(App({ locale: 'es-MX', total: { value: { amount: 3700, currency: 'MXN' }, label: 'por 2 noches' } }), () => clientLocale('de'))
    undo = r.undo
    expect(r.mismatch).toEqual([])
  })
})
