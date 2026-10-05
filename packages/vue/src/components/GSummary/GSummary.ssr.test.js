// @vitest-environment node
// GSummary en el servidor · design/contracts/summary.md «SSR»: sin window, document ni matchMedia; la ficha completa y
// correcta (la cesión es CSS); «+N», data-* y title llegan al montar. El id del título sale de useId (estable al hidratar).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GSummary from './GSummary.vue'
import { summaryDiff } from './diff.js'

afterEach(() => vi.restoreAllMocks())
const render = (props, slots) => renderToString(createSSRApp({ render: () => h(GSummary, props, slots) }))

describe('SSR · GSummary', () => {
  it('row lines 2: marcado completo del contrato, «+N» hidden, sin medida', async () => {
    expect(typeof window).toBe('undefined')
    const html = await render({ title: 'María García López', code: 'E11.9', subtitle: 'C4', status: { label: 'Activa', color: 'success' }, group: true, highlight: 'mar',
      facts: [{ label: 'Edad', value: '22 años', bare: true, priority: 2 }, { label: 'Expediente', short: 'Exp.', value: '001000', priority: 1 }] })
    expect(html).toMatch(/^<span class="g-summary g-summary--layout-row g-summary--size-md" role="group" aria-labelledby="([^"]+)" style="--_lines:1;"><span class="g-summary__body">/)
    const id = html.match(/aria-labelledby="([^"]+)"/)[1]
    expect(html).toContain(`<span class="g-summary__title" id="${id}" dir="auto"><mark class="g-summary__mark">Mar</mark>ía García López</span>`)
    expect(html).toContain('<span class="g-summary__code" dir="auto">E11.9</span><span class="g-summary__sep"> </span>')
    expect(html).toContain('<span class="g-summary__status"><span class="g-badge g-badge--variant-soft g-badge--color-success g-badge--size-sm g-badge--kind-text"')
    expect(html).toContain('<span class="g-summary__subtitle" dir="auto">C4</span><span class="g-summary__sep">; </span>')
    // Con code, ningún dato ancla; el DOM sigue la prioridad
    expect(html).not.toContain('is-anchor')
    expect(html).toMatch(/g-summary__facts"><span class="g-summary__fact"><span class="g-summary__fact-label" dir="auto">Exp\.<\/span> <span class="g-summary__fact-value" dir="auto">001000<\/span><span class="g-summary__sep">; <\/span><\/span><span class="g-summary__fact is-bare">/)
    expect(html).toContain('<span class="g-summary__more" aria-hidden="true" hidden></span>')
    expect(html).not.toMatch(/data-(terse|tight|clipped|enter)|title="|<!--/)
    expect(html).not.toContain('<style')
  })
  it('inline, stack con acción, carga y vacío', async () => {
    const inline = await render({ title: 'Ana', layout: 'inline', facts: [{ label: 'Exp.', value: '1' }] })
    expect(inline).toMatch(/^<span class="g-summary g-summary--layout-inline g-summary--size-xs">/)
    expect(inline).toContain('g-summary__fact is-anchor')
    const stack = await render({ title: 'Ana', layout: 'stack', lines: 2, avatar: true, facts: [{ label: 'Exp.', value: '1' }] }, { action: () => h('span', { class: 'acción' }, 'Abrir') })
    expect(stack).toMatch(/^<span class="g-summary g-summary--layout-stack g-summary--size-lg">/)
    expect(stack).toContain('<span class="g-summary__lead" aria-hidden="true"><span class="g-avatar g-avatar--size-lg')
    expect(stack).toContain('<span class="g-summary__action"><span class="acción">Abrir</span></span></span>')
    expect(stack).not.toContain('g-summary__more')
    const loading = await render({ loading: true, icon: 'user', lines: 0 })
    expect(loading).toBe('<span class="g-summary g-summary--layout-row g-summary--size-md g-summary--multi g-summary--free is-loading" style="--_lines:1;" aria-busy="true"><span class="g-summary__lead" aria-hidden="true"><span class="g-summary__bone"></span></span><span class="g-summary__body" aria-hidden="true"><span class="g-summary__head"><span class="g-summary__bone"></span></span><span class="g-summary__data"><span class="g-summary__bone"></span></span></span></span>')
    const empty = await render({ placeholder: 'Sin paciente' })
    expect(empty).toBe('<span class="g-summary g-summary--layout-row g-summary--size-md is-empty"><span class="g-summary__body"><span class="g-summary__head"><span class="g-summary__name"><span class="g-summary__title" dir="auto">Sin paciente</span></span></span></span></span>')
  })
  it('summaryDiff no toca el DOM', () => {
    expect(summaryDiff([{ title: 'A', facts: [{ label: 'x', value: 1 }] }, { title: 'a', facts: [{ label: 'x', value: 2 }] }])).toEqual([{ x: 'diff' }, { x: 'diff' }])
  })
})
