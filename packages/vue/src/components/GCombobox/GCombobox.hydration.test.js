// Hidratación de GCombobox (combobox.md «SSR y RTL»): el primer pintado del cliente coincide con el del servidor aunque
// el idioma por defecto del entorno no sea el mismo en los dos lados. Caso real: el sitio de documentación en WebKit, que
// toma el idioma del sistema (es) mientras Node pinta en en-US: la frase y `ID-about` decían «and» en el servidor y «y»
// al hidratar. Antes de montar, el idioma es fijo; al montar, el `lang` del ancestro.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GCombobox from './GCombobox.vue'

const ML = { clear: 'Quitar', close: 'Cerrar', selected: '{count} seleccionadas', about: '{count}: {list}', chosen: 'Elegidas', done: 'Listo', rest: '{count} más', remove: 'Quitar {label}', undo: 'Deshacer', trace: '{label} quitada', customItem: '{text} (texto libre)' }
const OPTIONS = [{ value: 'pen', label: 'Penicilina' }, { value: 'lat', label: 'Látex' }, { value: 'pol', label: 'Polen' }]
const App = (lang) => ({ render: () => h('div', { lang }, [h(GCombobox, { id: 'c', label: 'Alergias', multiple: true, clearable: true, labels: ML, options: OPTIONS, modelValue: ['pen', 'lat'] })]) })

/** El navegador con otro idioma por defecto: Intl sin locale resuelve a `locale`. */
function clientDefault(locale) {
  const { ListFormat, NumberFormat } = Intl
  Intl.ListFormat = class extends ListFormat { constructor(l, o) { super(l === undefined ? locale : l, o) } }
  Intl.NumberFormat = class extends NumberFormat { constructor(l, o) { super(l === undefined ? locale : l, o) } }
  return () => { Intl.ListFormat = ListFormat; Intl.NumberFormat = NumberFormat }
}

let restore = null
afterEach(() => { restore?.(); restore = null; vi.restoreAllMocks(); document.body.innerHTML = '' })

describe('hidratación · GCombobox multiple', () => {
  it('servidor en en-US y navegador en es: hidrata sin desajustes y, al montar, la frase toma el lang del ancestro', async () => {
    const html = await renderToString(createSSRApp(App('es-MX')))
    expect(html).toContain('2: Penicilina and Látex')
    const el = document.createElement('div')
    el.innerHTML = html
    document.body.append(el)
    restore = clientDefault('es')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    createSSRApp(App('es-MX')).mount(el)
    const mismatch = [...warn.mock.calls, ...error.mock.calls].map((c) => String(c[0])).filter((t) => /hydration/i.test(t))
    expect(mismatch).toEqual([])
    await nextTick()
    expect(el.querySelector('#c-about').textContent).toBe('2: Penicilina y Látex')
    expect(el.querySelector('.g-combobox__sentence-sep').textContent).toBe(' y ')
  })

  it('sin lang en los ancestros, al montar usa el idioma del entorno', async () => {
    const html = await renderToString(createSSRApp(App(undefined)))
    const el = document.createElement('div')
    el.innerHTML = html
    document.body.append(el)
    restore = clientDefault('es')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    createSSRApp(App(undefined)).mount(el)
    expect(warn.mock.calls.filter((c) => /hydration/i.test(String(c[0])))).toEqual([])
    await nextTick()
    expect(el.querySelector('#c-about').textContent).toBe('2: Penicilina y Látex')
  })
})
