// Filtro del índice (sidebar.md §«Filtro del índice», #1035) y código del item (§«Código del item», #1036)
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import GSidebar from './GSidebar.vue'
import { pageLiveNode } from '../../utils/liveRegion.js'

const LABELS = {
  collapse: 'Contraer', expand: 'Expandir', more: 'Más', drawer: 'Navegación', close: 'Cerrar',
  filter: 'Filtrar el índice', filterPlaceholder: 'Nombre o número', filterHint: '/', filterClear: 'Vaciar el filtro',
  filterCount: (n, t) => `${n} de ${t} páginas`, filterNone: (q) => `Ningún título con «${q}»`
}
const ITEMS = [
  { label: 'Empezar', items: [{ id: 'intro', label: 'Introducción', href: '/intro', icon: 'home' }] },
  { label: 'Formularios', items: [
    { id: 'btn', label: 'GBtn', href: '/btn', code: '02' },
    { id: 'combo', label: 'GCombobox', href: '/combo', code: '24', keywords: ['combobox', 'autocompletar'] },
    { id: 'chk', label: 'GCheckbox', href: '/chk', code: '21' },
    { id: 'off', label: 'Apagado', href: '/off', code: '29', disabled: true }
  ] },
  { label: 'Blocks', items: [
    { id: 'rl', label: 'Lista de recursos', children: [
      { id: 'rl-a', label: 'Árbol', href: '/rl/a' },
      { id: 'rl-b', label: 'Filas', href: '/rl/b' }
    ] }
  ] }
]
const mk = (props = {}) => mount(GSidebar, { attachTo: document.body, props: { items: ITEMS, label: 'Componentes', labels: LABELS, modelValue: 'combo', mode: 'expanded', filter: true, ...props } })
const input = (w) => w.find('.g-sidebar__filter-input')
const type = async (w, v) => { await input(w).setValue(v); await nextTick() }
const visibleIds = (w) => w.findAll('.g-sidebar__nav .g-sidebar__link').filter((l) => !l.element.closest('[hidden]')).map((l) => l.attributes('data-id'))

let warn
afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); vi.useRealTimers() })

describe('GSidebar · filtro del índice', () => {
  it('anatomía: campo search con label oculto, describedby al recuento, controls al nav, atajo publicado', () => {
    const w = mk({ filterKeyshortcuts: '/ Control+K Meta+K' })
    const i = input(w)
    expect(i.attributes('type')).toBe('search')
    expect(i.attributes('autocomplete')).toBe('off')
    expect(i.attributes('enterkeyhint')).toBe('go')
    expect(i.attributes('placeholder')).toBe('Nombre o número')
    expect(i.attributes('aria-keyshortcuts')).toBe('/ Control+K Meta+K')
    expect(w.find(`label[for="${i.attributes('id')}"]`).text()).toBe('Filtrar el índice')
    expect(document.getElementById(i.attributes('aria-describedby')).textContent).toBe('6 de 6 páginas')
    expect(document.getElementById(i.attributes('aria-controls')).tagName).toBe('NAV')
    expect(w.find('.g-sidebar__filter-hint').text()).toBe('/')
    expect(w.find('.g-sidebar__filter-clear').exists()).toBe(false)
    expect(w.find('.g-sidebar__search').exists()).toBe(false)
  })

  it('texto: oculta con hidden sin desmontar, sin diacríticos ni mayúsculas, por keywords; grupo vacío oculto entero', async () => {
    const w = mk()
    const before = w.findAll('.g-sidebar__item').map((x) => x.element)
    await type(w, '  AUTOCOMPLETAR ')
    expect(visibleIds(w)).toEqual(['combo'])
    expect(w.findAll('.g-sidebar__item').map((x) => x.element)).toEqual(before)
    const groups = w.findAll('.g-sidebar__group')
    expect(groups.map((g) => g.attributes('hidden') !== undefined)).toEqual([true, false, true])
    await type(w, 'introduccion')
    expect(visibleIds(w)).toEqual(['intro'])
    expect(w.emitted('update:query').at(-1)[0]).toBe('introduccion')
    expect(w.find('.g-sidebar__filter-hint').exists()).toBe(false)
    expect(w.find('.g-sidebar__filter-clear').attributes('aria-label')).toBe('Vaciar el filtro')
    expect(w.find('.g-sidebar').classes()).toContain('is-filtering')
  })

  it('consulta numérica: code que empieza por ella o de igual valor; sin code no coincide', async () => {
    const w = mk()
    await type(w, '2')
    expect(visibleIds(w)).toEqual(['btn', 'combo', 'chk', 'off'])
    await type(w, '24')
    expect(visibleIds(w)).toEqual(['combo'])
  })

  it('cuenta destinos (sin padres ni deshabilitados) y, sin coincidencias, filterNone con is-empty', async () => {
    const w = mk()
    await type(w, '2')
    expect(w.find('.g-sidebar__filter-count').text()).toBe('3 de 6 páginas')
    await type(w, 'zzz')
    const c = w.find('.g-sidebar__filter-count')
    expect(c.text()).toBe('Ningún título con «zzz»')
    expect(c.classes()).toContain('is-empty')
  })

  it('padres: coincide un hijo → padre visible y abierto con solo ese hijo; al vaciar vuelve a como estaba', async () => {
    const w = mk()
    const sub = () => w.find('.g-sidebar__sub')
    expect(sub().attributes('inert')).toBeDefined()
    await type(w, 'filas')
    expect(visibleIds(w)).toEqual(['rl', 'rl-b'])
    expect(sub().classes()).toContain('is-open')
    expect(sub().attributes('inert')).toBeUndefined()
    expect(w.find('[data-id="rl"]').attributes('aria-expanded')).toBe('true')
    await type(w, 'lista de')
    expect(visibleIds(w)).toEqual(['rl', 'rl-a', 'rl-b'])
    await type(w, '')
    expect(sub().attributes('inert')).toBeDefined()
    expect(w.find('[data-id="rl"]').attributes('aria-expanded')).toBe('false')
  })

  it('filterable: false (grupo) nunca se oculta ni se cuenta', async () => {
    const w = mk({ items: [...ITEMS, { label: 'En el texto', filterable: false, items: [{ id: 't1', label: 'Página · Sección', href: '/p#s' }] }] })
    await type(w, '24')
    expect(visibleIds(w)).toEqual(['combo', 't1'])
    expect(w.find('.g-sidebar__filter-count').text()).toBe('1 de 6 páginas')
  })

  it('Intro activa el primer destino visible y habilitado con un clic sintético (emite navigate); sin consulta, nada', async () => {
    const w = mk()
    await input(w).trigger('keydown', { key: 'Enter' })
    expect(w.emitted('navigate')).toBeUndefined()
    await type(w, 'lista')
    const clicked = vi.fn((e) => e.preventDefault())
    document.querySelector('[data-id="rl-a"]').addEventListener('click', clicked)
    await input(w).trigger('keydown', { key: 'Enter' })
    expect(clicked).toHaveBeenCalledOnce()
    expect(w.emitted('navigate')[0][0].item.id).toBe('rl-a')
    await input(w).trigger('keydown', { key: 'Enter', isComposing: true })
    expect(clicked).toHaveBeenCalledOnce()
  })

  it('↓ al primer item visible; ↑ en el primero vuelve al campo', async () => {
    const w = mk()
    await type(w, 'gc')
    await input(w).trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement.dataset.id).toBe('combo')
    await w.find('[data-id="combo"]').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement.dataset.id).toBe('chk')
    await w.find('[data-id="chk"]').trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement.dataset.id).toBe('combo')
    await w.find('[data-id="combo"]').trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(input(w).element)
  })

  it('Esc con texto vacía y no se propaga; vacío, se propaga', async () => {
    const w = mk()
    const outer = vi.fn()
    document.body.addEventListener('keydown', outer)
    await type(w, 'gc')
    await input(w).trigger('keydown', { key: 'Escape' })
    expect(w.emitted('update:query').at(-1)[0]).toBe('')
    expect(outer).not.toHaveBeenCalled()
    await input(w).trigger('keydown', { key: 'Escape' })
    expect(outer).toHaveBeenCalledOnce()
  })

  it('botón de vaciar: vacía y deja el foco en el campo', async () => {
    const w = mk()
    await type(w, 'gc')
    await w.find('.g-sidebar__filter-clear').trigger('click')
    expect(w.emitted('update:query').at(-1)[0]).toBe('')
    expect(document.activeElement).toBe(input(w).element)
  })

  it('v-model:query: la consulta llega desde fuera', async () => {
    const w = mk({ query: '24' })
    expect(visibleIds(w)).toEqual(['combo'])
    expect(input(w).element.value).toBe('24')
    await w.setProps({ query: '' })
    expect(visibleIds(w)).toHaveLength(8)
  })

  it('anuncio cortés 600 ms después del último cambio; al vaciar, nada', async () => {
    vi.useFakeTimers()
    const w = mk()
    await type(w, 'g')
    await type(w, 'gc')
    vi.advanceTimersByTime(599)
    expect(pageLiveNode().textContent).toBe('')
    vi.advanceTimersByTime(100)
    expect(pageLiveNode().textContent).toBe('2 de 6 páginas')
  })

  it('riel: botón del filtro con is-filtering y recuento oculto; activarlo expande y enfoca el campo', async () => {
    const w = mk({ mode: 'rail', query: 'gc' })
    await nextTick()
    const b = w.find('.g-sidebar__search')
    expect(b.classes()).toContain('is-filtering')
    expect(b.text()).toContain('Filtrar el índice')
    expect(b.find('.g-sidebar__sr').text()).toBe(', 2 de 6 páginas')
    await b.trigger('click')
    await nextTick(); await nextTick()
    expect(w.emitted('update:collapsed').at(-1)[0]).toBe(false)
    expect(document.activeElement).toBe(input(w).element)
    expect(visibleIds(w)).toEqual(['combo', 'chk'])
  })

  it('focusFilter(): expandida enfoca y selecciona; drawer abre y enfoca; sin filter, nada', async () => {
    const w = mk({ query: 'gc' })
    w.vm.focusFilter()
    expect(document.activeElement).toBe(input(w).element)
    expect([input(w).element.selectionStart, input(w).element.selectionEnd]).toEqual([0, 2])
    w.unmount()
    const d = mk({ mode: 'drawer' })
    d.vm.focusFilter()
    expect(d.emitted('update:open').at(-1)[0]).toBe(true)
    const n = mk({ filter: false })
    n.vm.focusFilter()
    expect(n.emitted('update:open')).toBeUndefined()
  })

  it('avisos F1 a F4', () => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GSidebar, { props: { items: [{ id: 'a', label: 'A', keywords: 'x' }], label: 'N', filter: true, search: true, labels: {} }, slots: { search: () => 'S' } })
    const t = warn.mock.calls.map((c) => c[0]).join('\n')
    for (const k of ['F1', 'F2', 'F3', 'F4']) expect(t).toContain(`(${k})`)
  })
})

describe('GSidebar · código del item (#1036)', () => {
  it('se pinta en el asiento con data-code en lugar del icono y va al principio del nombre accesible', () => {
    const w = mk({ filter: false })
    const a = w.find('[data-id="combo"]')
    const seat = a.find('.g-sidebar__icon')
    expect(seat.attributes('data-code')).toBe('24')
    expect(seat.text()).toBe('24')
    expect(seat.attributes('aria-hidden')).toBe('true')
    const sr = a.find('.g-sidebar__sr')
    expect(sr.text()).toBe('24')
    expect(sr.element.textContent).toBe('24 ')
    expect(sr.element.nextElementSibling.classList.contains('g-sidebar__label')).toBe(true)
    expect(w.find('[data-id="intro"] .g-sidebar__icon').attributes('data-code')).toBeUndefined()
  })

  it('con slot icon manda el slot (sin code); avisos C1, C2 y C3; en un hijo se ignora', () => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GSidebar, { props: { label: 'N', labels: LABELS, mode: 'expanded', items: [
      { id: 'a', label: 'A', href: '/a', code: '1', icon: 'home' },
      { id: 'b', label: 'B', href: '/b', code: '1234' },
      { id: 'p', label: 'P', children: [{ id: 'c', label: 'C', href: '/c', code: '9' }] }
    ] } })
    expect(w.find('[data-id="c"] .g-sidebar__sr').exists()).toBe(false)
    const t = warn.mock.calls.map((c) => c[0]).join('\n')
    for (const k of ['C1', 'C2', 'C3']) expect(t).toContain(`(${k})`)
    const s = mount(GSidebar, { props: { label: 'N', labels: LABELS, mode: 'expanded', items: [{ id: 'a', label: 'A', href: '/a', code: '1' }] }, slots: { icon: () => 'I' } })
    expect(s.find('.g-sidebar__icon').attributes('data-code')).toBeUndefined()
    expect(s.find('.g-sidebar__sr').exists()).toBe(false)
  })

  it('navbar: la celda pinta el código', () => {
    const w = mount(GSidebar, { attachTo: document.body, props: { label: 'N', labels: LABELS, mode: 'navbar', items: [{ id: 'a', label: 'A', href: '/a', code: '07' }] } })
    expect(w.find('.g-sidebar__tab .g-sidebar__icon').attributes('data-code')).toBe('07')
  })
})
