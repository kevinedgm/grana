// Hidratación de GSlider: sin `locale`, la cifra canónica en la píldora y en aria-valuetext antes de montar; al montar, el
// idioma del documento. El idioma del navegador no entra en el primer render.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h, nextTick } from 'vue'
import GSlider from './GSlider.vue'
import { clientLocale, hydrate } from '../../utils/hydrationTestEnv.js'

const App = (props) => ({ render: () => h(GSlider, { label: 'Precio', name: 'p', max: 50000, step: 50, ...props }) })
let undo = null
afterEach(() => { undo?.(); undo = null; vi.restoreAllMocks(); document.body.innerHTML = '' })

describe('hidratación · GSlider', () => {
  it('sin locale y navegador en es: hidrata sin desajustes y, al montar, la cifra en español', async () => {
    const r = await hydrate(App({ modelValue: 12400 }), () => clientLocale('es'))
    undo = r.undo
    expect(r.mismatch).toEqual([])
    await nextTick(); await nextTick()
    expect(r.el.querySelector('.g-slider__pill-text').textContent).toBe('12.400')
  })

  it('tramo con moneda y locale: hidrata sin desajustes', async () => {
    const r = await hydrate(App({ range: true, modelValue: [800, 24000], locale: 'es-MX', format: { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }, labels: { start: 'mínimo', end: 'máximo' } }), () => clientLocale('de'))
    undo = r.undo
    expect(r.mismatch).toEqual([])
  })
})
