// Hidratación de GDatePicker: el primer pintado del cliente coincide con el del servidor. Casos reales del sitio de
// documentación en WebKit: (1) formatRange depende de los datos de ICU de cada motor («26–29 de oct de 2026» en Node,
// «26 – 29 de oct de 2026» en WebKit); (2) sin `locale`, el idioma salía de document/navigator ya en el render.
// Antes de montar, nada del entorno: 'en' sin `locale` y los tramos sin formatRange; al montar, lo del entorno.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GDatePicker from './GDatePicker.vue'

vi.mock('../../utils/dates.js', async (orig) => ({ ...(await orig()), todayISO: () => '2026-10-15' }))

const LABELS = { prev: 'Mes anterior', next: 'Mes siguiente', clear: 'Limpiar', done: 'Listo' }
const App = (props) => ({ render: () => h(GDatePicker, { inline: true, labels: LABELS, label: 'Estancia', ...props }) })

async function hydrate(props, client) {
  const html = await renderToString(createSSRApp(App(props)))
  const el = document.createElement('div')
  el.innerHTML = html
  document.body.append(el)
  const undo = client()
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  createSSRApp(App(props)).mount(el)
  const mismatch = [...warn.mock.calls, ...error.mock.calls].map((c) => String(c[0])).filter((t) => /hydration/i.test(t))
  return { el, html, mismatch, undo }
}

let undo = null
afterEach(() => { undo?.(); undo = null; vi.restoreAllMocks(); document.body.innerHTML = ''; document.documentElement.removeAttribute('lang') })

describe('hidratación · GDatePicker', () => {
  it('tramo: formatRange distinto en el cliente (otro ICU) no desajusta; al montar, el resumen usa formatRange', async () => {
    const r = await hydrate({ mode: 'range', locale: 'es-MX', modelValue: { start: '2026-10-26', end: '2026-10-29' } }, () => {
      const orig = Intl.DateTimeFormat.prototype.formatRange
      Intl.DateTimeFormat.prototype.formatRange = function (a, b) { return `«${orig.call(this, a, b)}»` }
      return () => { Intl.DateTimeFormat.prototype.formatRange = orig }
    })
    undo = r.undo
    expect(r.mismatch).toEqual([])
    await nextTick()
    expect(r.el.querySelector('.g-datepicker__summary').textContent).toMatch(/^«.*»$/)
  })

  it('sin locale y con <html lang="es"> en el cliente: hidrata sin desajustes y, al montar, pinta en español', async () => {
    const r = await hydrate({ modelValue: '2026-10-20' }, () => { document.documentElement.lang = 'es'; return null })
    expect(r.mismatch).toEqual([])
    await nextTick()
    expect(r.el.querySelector('.g-datepicker__summary').textContent).toMatch(/oct/)
    expect(r.el.querySelector('.g-datepicker__summary').textContent).not.toMatch(/Oct /)
  })
})
