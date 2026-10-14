import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, h, provide, defineComponent } from 'vue'
import GPagination, { pageItems } from './GPagination.vue'
import { pagerKey, pageSizeList } from '../../utils/tablePager.js'

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

describe('pageSizeList', () => {
  it('ordena, depura y añade el tamaño actual', () => {
    expect(pageSizeList([50, 10, 25, 10], 10)).toEqual({ sizes: [10, 25, 50], dropped: true, added: false })
    expect(pageSizeList([10, 0, 2.5, '25', 100], 10)).toEqual({ sizes: [10, 100], dropped: true, added: false })
    expect(pageSizeList([10, 25], 40)).toEqual({ sizes: [10, 25, 40], dropped: false, added: true })
    expect(pageSizeList([0, -1], 10).sizes).toEqual([])
    expect(pageSizeList(undefined, 10).sizes).toEqual([])
  })
})

describe('GPagination · filas por página (#592 a #596)', () => {
  const LS = { ...L, pageSize: 'Filas por página' }
  const mkS = (props = {}, opts = {}) => mount(GPagination, { attachTo: document.body, props: { total: 240, pageSize: 10, pageSizes: [10, 25, 50, 100], labels: LS, ...props }, ...opts })
  // Monta GPagination dentro de un padre que da el contexto interno de GTable
  const inTable = (ctx, props = {}) => mount(defineComponent({
    setup() { provide(pagerKey, ctx); return () => h(GPagination, { total: 240, pageSize: 10, pageSizes: [10, 25, 50, 100], labels: LS, ...props }) }
  }), { attachTo: document.body })

  it('sin pageSizes no hay selector (todo como antes)', () => {
    const w = mk()
    expect(w.find('.g-pagination__meta').exists()).toBe(false)
    expect(w.find('[role="radiogroup"]').exists()).toBe(false)
    expect(w.element.firstElementChild.classList.contains('g-pagination__range')).toBe(true)
    w.unmount()
  })
  it('con una lista vacía tras depurar, tampoco', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mkS({ pageSizes: [0, -3] })
    expect(w.find('[role="radiogroup"]').exists()).toBe(false)
    w.unmount()
  })
  it('radiogroup con nombre visible y un radio nativo por cifra, en orden, dentro de __meta antes del rango', () => {
    const w = mkS({ pageSizes: [100, 10, 50, 25] })
    const g = w.find('.g-pagination__meta > .g-pagination__size')
    expect(g.attributes('role')).toBe('radiogroup')
    const label = document.getElementById(g.attributes('aria-labelledby'))
    expect(label.textContent).toBe('Filas por página')
    expect(label.classList.contains('g-pagination__size-label')).toBe(true)
    const radios = w.findAll('.g-pagination__size-option > input.g-pagination__size-input[type="radio"]')
    expect(radios.map((r) => r.element.value)).toEqual(['10', '25', '50', '100'])
    expect(w.findAll('.g-pagination__size-text').map((t) => t.text())).toEqual(['10', '25', '50', '100'])
    expect(radios[0].element.checked).toBe(true)
    expect(w.find('.g-pagination__meta').element.lastElementChild.classList.contains('g-pagination__range')).toBe(true)
    expect(w.find('.g-pagination__meta + .g-pagination__controls').exists()).toBe(true)
    w.unmount()
  })
  it('name único por instancia (useId: único dentro de la aplicación)', () => {
    const w = mount(defineComponent({
      setup: () => () => [1, 2].map((k) => h(GPagination, { key: k, total: 240, pageSizes: [10, 25], labels: LS }))
    }), { attachTo: document.body })
    const [a, b] = w.findAll('nav')
    const na = a.find('input[type="radio"]').attributes('name')
    const nb = b.find('input[type="radio"]').attributes('name')
    expect(na).toBeTruthy()
    expect(na).not.toBe(nb)
    expect(a.findAll('input[type="radio"]').every((r) => r.attributes('name') === na)).toBe(true)
    w.unmount()
  })
  it('depura la lista y avisa una vez', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mkS({ pageSizes: [25, 10, 10, 0] })
    expect(w.findAll('input[type="radio"]').map((r) => r.element.value)).toEqual(['10', '25'])
    expect(warn.mock.calls.filter((c) => /depurado/.test(c[0]))).toHaveLength(1)
    w.unmount()
  })
  it('un pageSize fuera de la lista se añade en su orden y avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mkS({ pageSize: 40 })
    const radios = w.findAll('input[type="radio"]')
    expect(radios.map((r) => r.element.value)).toEqual(['10', '25', '40', '50', '100'])
    expect(radios[2].element.checked).toBe(true)
    expect(warn.mock.calls.some((c) => /pageSize 40 no está en pageSizes/.test(c[0]))).toBe(true)
    w.unmount()
  })
  it('avisa con pageSizes y sin labels.pageSize', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mkS({ labels: L })
    expect(warn.mock.calls.some((c) => /labels\.pageSize/.test(c[0]))).toBe(true)
    w.unmount()
  })
  it('update:pageSize antes que update:page, síncronos en el mismo manejador', async () => {
    const order = []
    const w = mkS({ page: 7, 'onUpdate:pageSize': (v) => order.push(['size', v, Date.now()]), 'onUpdate:page': (v) => order.push(['page', v]) })
    const r = w.findAll('input[type="radio"]')[1]
    r.element.checked = true
    r.element.dispatchEvent(new Event('change'))
    // Sin esperar ningún ciclo: los dos ya se emitieron
    expect(order.map((o) => o.slice(0, 2))).toEqual([['size', 25], ['page', 3]]) // fila 61 (índice 60) → ⌊60/25⌋+1 = 3
    w.unmount()
  })
  it('sola, el ancla es la primera fila de la página: de la 2 (filas 11–20) a 25 → página 1', async () => {
    const w = mkS({ page: 2 })
    const r = w.findAll('input[type="radio"]')[1]
    r.element.checked = true
    await r.trigger('change')
    expect(w.emitted('update:pageSize')).toEqual([[25]])
    expect(w.emitted('update:page')).toEqual([[1]])
    w.unmount()
  })
  it('sin cambio de página, solo update:pageSize', async () => {
    const w = mkS({ page: 1 })
    const r = w.findAll('input[type="radio"]')[3]
    r.element.checked = true
    await r.trigger('change')
    expect(w.emitted('update:pageSize')).toEqual([[100]])
    expect(w.emitted('update:page')).toBeUndefined()
    w.unmount()
  })
  it('dentro de GTable, el ancla la decide la tabla (se pide una vez): 100 → 10 con la fila 62 arriba da la página 7', async () => {
    const anchor = vi.fn(() => ({ index: 61 }))
    const w = inTable({ anchor, dock: true, announcesRange: true }, { pageSize: 100, page: 1 })
    const p = w.findComponent(GPagination)
    const r = w.findAll('input[type="radio"]')[0]
    r.element.checked = true
    await r.trigger('change')
    expect(anchor).toHaveBeenCalledTimes(1)
    expect(p.emitted('update:pageSize')).toEqual([[10]])
    expect(p.emitted('update:page')).toEqual([[7]])
    w.unmount()
  })
  it('ancla null del contexto: la primera fila de la página', async () => {
    const w = inTable({ anchor: () => null }, { page: 3 })
    const p = w.findComponent(GPagination)
    const r = w.findAll('input[type="radio"]')[2]
    r.element.checked = true
    await r.trigger('change')
    expect(p.emitted('update:page')).toEqual([[1]]) // índice 20 → ⌊20/50⌋+1
    w.unmount()
  })
  it('el foco se queda en el radio y el radio no se recrea', async () => {
    const w = mount({
      components: { GPagination },
      data: () => ({ p: 2, s: 10 }),
      template: '<GPagination v-model:page="p" v-model:page-size="s" :page-sizes="[10, 25, 50, 100]" :total="240" :labels="LS" />',
      setup: () => ({ LS })
    }, { attachTo: document.body })
    const r = w.findAll('input[type="radio"]')[1].element
    r.focus()
    r.checked = true
    r.dispatchEvent(new Event('change'))
    await nextTick(); await nextTick()
    expect(document.activeElement).toBe(r)
    expect(w.findAll('input[type="radio"]')[1].element).toBe(r)
    expect(r.checked).toBe(true)
    expect(w.vm.s).toBe(25)
    expect(w.vm.p).toBe(1)
    expect(w.find('.g-pagination__range').text()).toBe('1–25 de 240')
    w.unmount()
  })
  it('sin v-model, el tamaño elegido se conserva (espejo) y el rango lo sigue', async () => {
    const w = mkS({ page: 1 })
    const r = w.findAll('input[type="radio"]')[1]
    r.element.checked = true
    await r.trigger('change')
    expect(w.findAll('input[type="radio"]')[1].element.checked).toBe(true)
    expect(w.find('.g-pagination__range').text()).toBe('1–25 de 240')
    await w.setProps({ pageSize: 50 })
    expect(w.findAll('input[type="radio"]')[2].element.checked).toBe(true)
    w.unmount()
  })
  it('las cifras mayores que el total no se ocultan ni se deshabilitan', () => {
    const w = mkS({ total: 12 })
    const radios = w.findAll('input[type="radio"]')
    expect(radios).toHaveLength(4)
    expect(radios.some((r) => r.element.disabled)).toBe(false)
    w.unmount()
  })
  it('el rango conserva role="status" sola; sin él dentro de GTable con announcesRange', () => {
    const a = mkS()
    expect(a.find('.g-pagination__range').attributes('role')).toBe('status')
    const b = inTable({ anchor: () => null, announcesRange: true })
    expect(b.find('.g-pagination__range').attributes('role')).toBeUndefined()
    const c = inTable({ anchor: () => null, announcesRange: false })
    expect(c.find('.g-pagination__range').attributes('role')).toBe('status')
    a.unmount(); b.unmount(); c.unmount()
  })
  it('sola no se acopla; con el contexto, g-pagination--dock e is-stuck', () => {
    const a = mkS()
    expect(a.classes()).not.toContain('g-pagination--dock')
    const b = inTable({ anchor: () => null, dock: true, stuck: true })
    expect(b.find('nav').classes()).toEqual(expect.arrayContaining(['g-pagination--dock', 'is-stuck']))
    const c = inTable({ anchor: () => null, dock: true, stuck: false })
    expect(c.find('nav').classes()).toContain('g-pagination--dock')
    expect(c.find('nav').classes()).not.toContain('is-stuck')
    a.unmount(); b.unmount(); c.unmount()
  })
  it('la forma compacta conserva el selector', () => {
    const w = mkS({ responsive: 'compact' })
    expect(w.classes()).toContain('g-pagination--compact')
    expect(w.find('[role="radiogroup"]').exists()).toBe(true)
    w.unmount()
  })
})
