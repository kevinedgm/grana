// @vitest-environment node
// GTag y GTagGroup en el servidor (tag.md; #444: sin efectos en el nivel superior ni lecturas de document/window fuera de
// los ganchos de montaje). Entorno node: sin window ni document. La categoría es la misma que en el cliente (el hash de
// GAvatar, utils/categoryHash.js).
import { describe, it, expect } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GTag from './GTag.vue'
import GTagGroup from '../GTagGroup/GTagGroup.vue'
import { categoryOf } from '../../utils/categoryHash.js'

const render = (C, props) => renderToString(createSSRApp({ render: () => h(C, props) }))

describe('SSR · GTag', () => {
  it('quitable con categoría: marcado del contrato y data-cat del hash', async () => {
    expect(typeof window).toBe('undefined')
    const html = await render(GTag, { label: 'Penicilina', removable: true, categories: 8, labels: { remove: 'Quitar {label}' } })
    expect(html).toMatch(new RegExp(`^<span class="g-tag g-tag--size-md is-removable" data-cat="${categoryOf('Penicilina', 8)}">`))
    expect(html).toContain('<span class="g-tag__body"><span class="g-tag__text" dir="auto">Penicilina</span></span>')
    expect(html).toContain('<button type="button" class="g-tag__remove" aria-keyshortcuts="Delete Backspace">')
    expect(html).toContain('<span class="g-tag__sr">Quitar Penicilina</span>')
    // La pista visual: nodo <span> cerrado, aria-hidden
    expect(html).toMatch(/<span class="g-tooltip" popover="manual" aria-hidden="true">/)
  })
  it('alternar: aria-pressed y la marca', async () => {
    const html = await render(GTag, { label: 'Solo pendientes', pressed: true })
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('class="g-tag__check" aria-hidden="true"')
  })
})

describe('SSR · GTagGroup', () => {
  it('lista con nombre, región viva vacía, racimos', async () => {
    const html = await render(GTagGroup, {
      label: 'Filtros',
      layout: 'facets',
      categories: 8,
      labels: { remove: 'Quitar {label}', removeIn: 'Quitar {label} de {facet}' },
      items: [{ id: 1, label: 'Pendiente', facet: 'Estado', removable: true }, { id: 2, label: 'Suelta' }]
    })
    expect(html).toMatch(/<ul id="g-tag-group-[^"]+-list" class="g-tag-group__list" aria-label="Filtros" role="list">/)
    expect(html).toContain(`class="g-tag-group__facet" data-cat="${categoryOf('Estado', 8)}"`)
    expect(html).toContain('Quitar Pendiente de Estado')
    expect(html).toContain('<span class="g-tag-group__live" role="status"></span>')
  })
})
