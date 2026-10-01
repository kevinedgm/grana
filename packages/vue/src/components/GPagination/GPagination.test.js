import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import GPagination, { pageItems } from './GPagination.vue'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.innerHTML = '' })
const L = { nav: 'Paginación', previous: 'Anterior', next: 'Siguiente', page: 'Página {page}', range: '{from}–{to} de {total}', compact: 'Página {page} de {pages}' }
const mk = (props = {}) => mount(GPagination, { attachTo: document.body, props: { total: 120, pageSize: 10, labels: L, ...props } })

describe('pageItems', () => {
  it('primera, última, actual ± siblings y elipsis', () => {
    expect(pageItems(1, 12, 1)).toEqual([1, 2, null, 12])
    expect(pageItems(6, 12, 1)).toEqual([1, null, 5, 6, 7, null, 12])
    expect(pageItems(12, 12, 1)).toEqual([1, null, 11, 12])
  })
  it('un solo hueco se muestra como página', () => {
    expect(pageItems(4, 12, 1)).toEqual([1, 2, 3, 4, 5, null, 12])
  })
  it('pocas páginas, sin elipsis', () => {
    expect(pageItems(2, 3, 1)).toEqual([1, 2, 3])
    expect(pageItems(1, 1, 1)).toEqual([1])
  })
})

describe('GPagination', () => {
  it('nav con nombre, rango y página actual con aria-current', () => {
    const w = mk({ page: 2 })
    expect(w.element.tagName).toBe('NAV')
    expect(w.attributes('aria-label')).toBe('Paginación')
    expect(w.find('.g-pagination__range').text()).toBe('11–20 de 120')
    const cur = w.find('[aria-current="page"]')
    expect(cur.text()).toBe('2')
    expect(cur.attributes('aria-label')).toBe('Página 2')
    w.unmount()
  })
  it('anterior deshabilitado en la primera; siguiente en la última', () => {
    const a = mk({ page: 1 })
    expect(a.findAll('.g-pagination__step')[0].attributes('disabled')).toBeDefined()
    expect(a.findAll('.g-pagination__step')[1].attributes('disabled')).toBeUndefined()
    const b = mk({ page: 12 })
    expect(b.findAll('.g-pagination__step')[1].attributes('disabled')).toBeDefined()
    a.unmount(); b.unmount()
  })
  it('emite update:page con anterior, siguiente y una página; no con la actual', async () => {
    const w = mk({ page: 5 })
    await w.findAll('.g-pagination__step')[0].trigger('click')
    await w.findAll('.g-pagination__step')[1].trigger('click')
    await w.find('[aria-current="page"]').trigger('click')
    await w.findAll('.g-pagination__page').at(-1).trigger('click')
    expect(w.emitted('update:page').map((e) => e[0])).toEqual([4, 6, 12])
    w.unmount()
  })
  it('elipsis no interactiva', () => {
    const w = mk({ page: 6 })
    const e = w.findAll('.g-pagination__ellipsis')
    expect(e).toHaveLength(2)
    expect(e[0].attributes('aria-hidden')).toBe('true')
    w.unmount()
  })
  it('compacta por prop', () => {
    const w = mk({ page: 3, responsive: 'compact' })
    expect(w.classes()).toContain('g-pagination--compact')
    expect(w.find('.g-pagination__compact').text()).toBe('Página 3 de 12')
    w.unmount()
  })
  it('compacta medida: estrecha si no caben los botones', async () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ width: 200, height: 0, top: 0, left: 0, right: 200, bottom: 0 })
    const w = mount(GPagination, { attachTo: document.body, props: { total: 120, pageSize: 10, labels: L, page: 6 }, attrs: { style: '--g-space-1: 4px' } })
    await nextTick()
    expect(w.classes()).toContain('g-pagination--compact') // 7 elementos + 4 = 11 × 36 = 396 > 200
    w.unmount()
  })
  it('el foco va a la página actual tras cambiar si el control pulsado desaparece', async () => {
    const w = mount({
      components: { GPagination },
      data: () => ({ p: 1 }),
      template: '<GPagination v-model:page="p" :total="120" :page-size="10" :labels="L" />',
      setup: () => ({ L })
    }, { attachTo: document.body })
    const last = w.findAll('.g-pagination__page').at(-1)
    last.element.focus()
    await last.trigger('click'); await nextTick(); await nextTick()
    expect(document.activeElement.getAttribute('aria-current')).toBe('page')
    expect(document.activeElement.textContent).toBe('12')
    w.unmount()
  })
  it('sin total: una página y rango 0', () => {
    const w = mk({ total: 0 })
    expect(w.find('.g-pagination__range').text()).toBe('0–0 de 0')
    expect(w.findAll('.g-pagination__page')).toHaveLength(1)
    w.unmount()
  })
  it('avisa sin labels.nav', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GPagination, { props: { total: 10 } })
    expect(warn.mock.calls.some((c) => /labels\.nav/.test(c[0]))).toBe(true)
  })
})
