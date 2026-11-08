// Hidratación de la línea de la consulta (#1033): con `locale` dado, el servidor y el primer pintado del cliente dicen el rango
// sin formatRange (cuya salida cambia con el ICU de cada motor); al montar, con formatRange y «hoy»/«mañana».
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createIcons } from '@grana/vue'
import GbBookingSummary03 from '../GbBookingSummary/GbBookingSummary03.vue'
import * as bank from '../GbBookingSummary/booking-summary.bank.js'

const App = () => ({ render: () => h(GbBookingSummary03, bank.props, bank.slots) })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

describe('useQueryLine · hidratación', () => {
  it('formatRange distinto en el cliente: sin desajustes; al montar, con formatRange', async () => {
    const make = () => { const a = createSSRApp(App()); a.use(createIcons([])); return a }
    const html = await renderToString(make())
    const el = document.createElement('div')
    el.innerHTML = html
    document.body.append(el)
    const orig = Intl.DateTimeFormat.prototype.formatRange
    Intl.DateTimeFormat.prototype.formatRange = function (a, b) { return `«${orig.call(this, a, b)}»` }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      make().mount(el)
      const mismatch = [...warn.mock.calls, ...error.mock.calls].map((c) => String(c[0])).filter((t) => /hydration/i.test(t))
      expect(html).not.toContain('«')
      expect(mismatch).toEqual([])
      await nextTick(); await nextTick()
      expect(el.textContent).toContain('«')
    } finally { Intl.DateTimeFormat.prototype.formatRange = orig }
  })
})
