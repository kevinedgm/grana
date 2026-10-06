// @vitest-environment node
// GTooltip en el servidor · design/contracts/tooltip.md §«SSR»: el nodo y las referencias se renderizan en el servidor
// con ids estables; kind="auto" se comporta como label hasta medir; ninguna lectura de document ni window.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GTooltip from './GTooltip.vue'
import GBtn from '../GBtn/GBtn.vue'
import GInput from '../GInput/GInput.vue'
import GTextarea from '../GTextarea/GTextarea.vue'
import GSelect from '../GSelect/GSelect.vue'

afterEach(() => vi.restoreAllMocks())
const render = (fn) => renderToString(createSSRApp({ render: fn }))

describe('SSR · GTooltip', () => {
  it('nodo persistente detrás del control, referencias al texto y auto como label', async () => {
    expect(typeof window).toBe('undefined')
    const html = await render(() => h(GTooltip, { text: 'Duplicar', shortcut: 'Ctrl D', keyshortcuts: 'Control+D', id: 'tt' }, () => h('button', { type: 'button' }, 'Copiar')))
    expect(html).toBe(
      '<!--[--><button type="button" data-g-tooltip aria-labelledby="tt-name" aria-keyshortcuts="Control+D">Copiar</button>' +
      '<div id="tt" class="g-tooltip" role="tooltip" popover="manual"><span class="g-tooltip__tab" aria-hidden="true"></span>' +
      '<span class="g-tooltip__body"><span class="g-tooltip__text" id="tt-name">Duplicar</span><kbd class="g-tooltip__kbd" aria-hidden="true">Ctrl D</kbd></span></div><!--]-->'
    )
  })
  it('con detail: segunda etapa en el marcado y aria-describedby al detalle', async () => {
    const html = await render(() => h(GTooltip, { text: 'Marcar', detail: 'Avisa', id: 'm' }, () => h('button', { type: 'button' })))
    expect(html).toContain('aria-describedby="m-detail"')
    expect(html).toContain('<span class="g-tooltip__more"><span class="g-tooltip__more-in"><span class="g-tooltip__detail" id="m-detail">Avisa</span>')
  })
  it('ids estables sin id explícito; GBtn tooltip en el servidor; sin avisos de Vue', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const tpl = () => h('div', [h(GTooltip, { text: 'A' }, () => h('button')), h(GBtn, { icon: true, tooltip: 'Duplicar' }, () => 'x')])
    const a = await render(tpl)
    const b = await render(tpl)
    expect(a).toBe(b)
    expect(a).toMatch(/<button[^>]*aria-labelledby="g-tooltip-[^"]+-name"/)
    expect((a.match(/role="tooltip"/g) || []).length).toBe(2)
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('[Vue warn]'))).toHaveLength(0)
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('<GBtn icon> necesita'))).toHaveLength(0)
  })
  it('caja visible (#395): data-g-tooltip-box estático también en el servidor', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const html = await render(() => h('div', [h(GTooltip, { text: 'A' }, () => h(GInput, { label: 'Correo' })), h(GTextarea, { label: 'Nota' }), h(GSelect, { label: 'País', options: [] })]))
    expect(html).toMatch(/<div class="g-input__control" data-g-tooltip-box>/)
    expect(html).toMatch(/<div class="g-textarea__control" data-g-tooltip-box>/)
    expect(html).toMatch(/<div class="g-select__control" data-g-tooltip-box>/)
  })
})
