// Hidratación de GPriceScope: sin `locale`, la leyenda lleva el código en lugar del nombre de la moneda antes de montar; al
// montar, el nombre en el idioma del documento. Los precios de dentro heredan su `locale` y tampoco desajustan.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h, nextTick } from 'vue'
import GPriceScope from './GPriceScope.vue'
import GPrice from '../GPrice/GPrice.vue'
import { clientLocale, hydrate } from '../../utils/hydrationTestEnv.js'

const L = { range: '{min} a {max}', total: 'Total', legend: 'Precios en {name} ({code})' }
const App = (props) => ({ render: () => h(GPriceScope, { currency: 'MXN', legend: true, labels: L, ...props }, () => h(GPrice, { value: { amount: 1850, currency: 'MXN' } })) })
let undo = null
afterEach(() => { undo?.(); undo = null; vi.restoreAllMocks(); document.body.innerHTML = '' })

describe('hidratación · GPriceScope', () => {
  it('sin locale y navegador en es-MX: hidrata sin desajustes y, al montar, la leyenda con el nombre', async () => {
    const r = await hydrate(App({}), () => clientLocale('es-MX'))
    undo = r.undo
    expect(r.mismatch).toEqual([])
    await nextTick(); await nextTick()
    expect(r.el.textContent).toMatch(/Precios en pesos? mexicanos? \(MXN\)/i)
  })

  it('con locale: hidrata sin desajustes', async () => {
    const r = await hydrate(App({ locale: 'es-MX' }), () => clientLocale('de'))
    undo = r.undo
    expect(r.mismatch).toEqual([])
  })
})
