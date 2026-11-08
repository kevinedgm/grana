// GNavBar (nav-bar.md, #1053): modelo y avisos, la actual, externos, navigate con la guarda de #505, separadores,
// «…», pantalla de menú (foco, bucle, cover() con chasis), ids y SSR.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { Fragment, createSSRApp, h, nextTick, provide } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GNavBar from './GNavBar.vue'
import { appShellKey } from '../../utils/appShell.js'

const ITEMS = [
  { id: 'guide', label: 'Guía', href: '/getting-started', activeMatch: '^/(getting-started|theming)' },
  { id: 'components', label: 'Componentes', href: '/components/btn', activeMatch: '^/components/' },
  { id: 'changelog', label: 'Cambios', href: '/changelog' },
  { id: 'github', label: 'GitHub', href: 'https://github.com/x/y', external: true, activeMatch: '.*' }
]
const LABELS = { more: 'Más opciones', menu: 'Menú', newTab: 'se abre en otra pestaña' }
let mqs
let warn

beforeEach(() => {
  mqs = []
  vi.stubGlobal('matchMedia', (q) => {
    const m = { media: q, matches: false, l: [], addEventListener: (_, f) => m.l.push(f), removeEventListener: (_, f) => { m.l = m.l.filter((x) => x !== f) } }
    mqs.push(m)
    return m
  })
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); document.body.innerHTML = ''; document.documentElement.style.overflow = '' })

const make = (props = {}, slots = {}, opts = {}) => mount(GNavBar, { props: { items: ITEMS, label: 'Secciones', labels: LABELS, id: 'nb', ...props }, slots, attachTo: document.body, ...opts })
const warnings = () => warn.mock.calls.map((c) => c[0]).join('\n')

describe('GNavBar · modelo, actual y avisos', () => {
  it('anatomía: raíz sin landmark, nav con nombre, luz como primer hijo de la lista, ids', () => {
    const w = make()
    const root = w.get('.g-nav-bar')
    expect(root.attributes('id')).toBe('nb')
    expect(root.element.tagName).toBe('DIV')
    expect(w.get('.g-nav-bar__nav').attributes('aria-label')).toBe('Secciones')
    const first = w.get('.g-nav-bar__list').element.firstElementChild
    expect(first.className).toBe('g-nav-bar__highlight')
    expect(first.getAttribute('aria-hidden')).toBe('true')
    expect(first.getAttribute('role')).toBe('none')
    expect(w.findAll('.g-nav-bar__link')).toHaveLength(4)
    expect(w.get('.g-nav-bar__more-btn').attributes()).toMatchObject({ id: 'nb-more-btn', 'aria-controls': 'nb-more', 'aria-expanded': 'false', 'aria-label': 'Más opciones', popovertarget: 'nb-more' })
    expect(w.get('.g-nav-bar__more-panel').attributes()).toMatchObject({ id: 'nb-more', popover: 'auto' })
    expect(w.get('.g-nav-bar__toggle').attributes()).toMatchObject({ id: 'nb-toggle', 'aria-controls': 'nb-screen', 'aria-expanded': 'false', 'aria-label': 'Menú' })
    expect(w.get('.g-nav-bar__screen').attributes('hidden')).toBeDefined()
    expect(w.get('.g-nav-bar__screen-nav').attributes('aria-label')).toBe('Secciones')
    w.unmount()
  })

  it('una sola actual por activeMatch o href; nunca un externo; ninguna sin current', async () => {
    const w = make({ current: '/components/combobox' })
    const cur = () => w.findAll('.g-nav-bar__link[aria-current="page"]').map((a) => a.text())
    expect(cur()).toEqual(['Componentes'])
    expect(w.findAll('.g-nav-bar__screen-link[aria-current="page"]').map((a) => a.text())).toEqual(['Componentes'])
    await w.setProps({ current: '/changelog' })
    expect(cur()).toEqual(['Cambios'])
    await w.setProps({ current: '/otra' })
    expect(cur()).toEqual([]) // GitHub casa con .* pero es externo
    await w.setProps({ current: null })
    expect(cur()).toEqual([])
    w.unmount()
  })

  it('activeMatch se compila una vez por cambio de items (no en cada render)', async () => {
    const Real = RegExp
    let n = 0
    vi.stubGlobal('RegExp', function (...a) { n++; return new Real(...a) })
    const w = make({ current: '/getting-started' })
    const first = n
    expect(first).toBe(3)
    await w.setProps({ current: '/theming' })
    await w.setProps({ current: '/components/x' })
    expect(n).toBe(first)
    await w.setProps({ items: ITEMS.slice(0, 2) })
    expect(n).toBe(first + 2)
    w.unmount()
  })

  it('avisos 1 a 6 con su número', () => {
    const w = mount(GNavBar, { props: { items: [{ id: 'a', label: 'A', href: '/a' }, { id: 'a', label: 'B', href: '/b' }, { id: 'c', label: ' ', href: '/c' }, { id: 'd', label: 'D', href: '/d', activeMatch: '(' }, { id: 'e', label: 'E', href: 'https://e', external: true }], current: '/d' } })
    const t = warnings()
    for (const k of [1, 2, 3, 4, 5, 6]) expect(t).toContain(`(aviso ${k})`)
    expect(t).toContain('[Grana GNavBar]')
    expect(w.findAll('.g-nav-bar__link').map((a) => a.text())).toEqual(['A', 'D', 'E'])
    expect(w.get('.g-nav-bar__link[aria-current]').text()).toBe('D') // activeMatch inválido: href === current
    w.unmount()
  })
})

describe('GNavBar · externos y navigate (#505, #574)', () => {
  it('externo: target, rel, icono arrow-up-right con flip-rtl y texto oculto', () => {
    const w = make()
    const a = w.get('.g-nav-bar__link--external')
    expect(a.attributes()).toMatchObject({ target: '_blank', rel: 'noreferrer' })
    expect(a.get('.g-nav-bar__ext').attributes('aria-hidden')).toBe('true')
    expect(a.get('.g-nav-bar__ext svg').classes()).toContain('g-icon--flip-rtl')
    expect(a.get('.g-nav-bar__sr').text()).toBe('se abre en otra pestaña')
    expect(a.text().replace(/\s+/g, ' ')).toBe('GitHub se abre en otra pestaña')
    w.unmount()
  })

  it('clic primario emite navigate {item, event}; modificadores, botón central, target y externos no', async () => {
    const items = [...ITEMS, { id: 'x', label: 'X', href: '/x', target: '_blank' }]
    const w = make({ items })
    const links = w.findAll('.g-nav-bar__link')
    await links[1].trigger('click', { button: 0 })
    const ev = w.emitted('navigate')
    expect(ev).toHaveLength(1)
    expect(ev[0][0].item.id).toBe('components')
    expect(ev[0][0].event).toBeInstanceOf(Event)
    await links[1].trigger('click', { button: 0, ctrlKey: true })
    await links[1].trigger('click', { button: 0, metaKey: true })
    await links[1].trigger('click', { button: 1 })
    await links[3].trigger('click', { button: 0 })
    await links[4].trigger('click', { button: 0 })
    expect(w.emitted('navigate')).toHaveLength(1)
    // desde la pantalla, el mismo item
    await w.findAll('.g-nav-bar__screen-link')[0].trigger('click', { button: 0 })
    expect(w.emitted('navigate')[1][0].item.id).toBe('guide')
    w.unmount()
  })

  it('cancelado sigue cerrando la pantalla', async () => {
    const w = make({ onNavigate: ({ event }) => event.preventDefault() })
    await w.get('.g-nav-bar__toggle').trigger('click')
    expect(w.get('.g-nav-bar__screen').attributes('hidden')).toBeUndefined()
    await w.findAll('.g-nav-bar__screen-link')[0].trigger('click', { button: 0 })
    expect(w.emitted('navigate')).toHaveLength(1)
    expect(w.get('.g-nav-bar__screen').attributes('hidden')).toBeDefined()
    w.unmount()
  })
})

describe('GNavBar · acciones y separadores', () => {
  it('un separador antes de cada nodo de primer nivel de bar (fragmentos aplanados, sin comentarios ni textos vacíos); place en los tres sitios', () => {
    const places = []
    const w = make({}, {
      actions: ({ place }) => {
        places.push(place)
        return place === 'bar' ? [h(Fragment, [h('i', { class: 'a1' }), h('i', { class: 'a2' })]), ' ', h('i', { class: 'a3' })] : [h('b', { class: `p-${place}` })]
      }
    })
    expect(places.sort()).toEqual(['bar', 'more', 'screen'])
    const kids = [...w.get('.g-nav-bar__actions').element.children].map((e) => e.className)
    expect(kids).toEqual(['g-nav-bar__sep', 'a1', 'g-nav-bar__sep', 'a2', 'g-nav-bar__sep', 'a3'])
    expect(w.get('.g-nav-bar__sep').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-nav-bar__more-panel .p-more').exists()).toBe(true)
    expect(w.find('.g-nav-bar__screen-actions .p-screen').exists()).toBe(true)
    expect(w.findAll('.g-nav-bar__more-panel .g-nav-bar__sep')).toHaveLength(0)
    w.unmount()
  })

  it('brand y search en sus huecos', () => {
    const w = make({}, { brand: () => h('a', { class: 'mi-marca', href: '/' }, 'Grana'), search: () => h('button', { class: 'mi-busca' }) })
    expect(w.find('.g-nav-bar__brand .mi-marca').exists()).toBe(true)
    expect(w.find('.g-nav-bar__search .mi-busca').exists()).toBe(true)
    w.unmount()
  })
})

describe('GNavBar · «…» (disclosure con popover)', () => {
  it('aria-expanded sigue al evento toggle del popover; Esc cierra y devuelve el foco; un enlace dentro cierra', async () => {
    const w = make({}, { actions: ({ place }) => h('a', { href: `#${place}`, class: `l-${place}` }, place) })
    const panel = w.get('.g-nav-bar__more-panel')
    panel.element.hidePopover = vi.fn()
    const toggle = (s) => { const e = new Event('toggle'); e.newState = s; panel.element.dispatchEvent(e) }
    toggle('open')
    await nextTick()
    expect(w.get('.g-nav-bar__more-btn').attributes('aria-expanded')).toBe('true')
    w.get('.l-more').element.focus()
    await w.get('.l-more').trigger('keydown', { key: 'Escape' })
    expect(panel.element.hidePopover).toHaveBeenCalled()
    expect(document.activeElement).toBe(w.get('.g-nav-bar__more-btn').element)
    await w.get('.l-more').trigger('click')
    expect(panel.element.hidePopover).toHaveBeenCalledTimes(2)
    toggle('closed')
    await nextTick()
    expect(w.get('.g-nav-bar__more-btn').attributes('aria-expanded')).toBe('false')
    w.unmount()
  })
})

describe('GNavBar · pantalla de menú', () => {
  it('sin chasis: abre con el foco en el primer enlace, bucle Tab, Esc devuelve el foco, bloquea el documento', async () => {
    const w = make({}, { actions: ({ place }) => h('button', { class: `b-${place}` }, place) })
    const btn = w.get('.g-nav-bar__toggle')
    await btn.trigger('click')
    await nextTick()
    expect(btn.attributes('aria-expanded')).toBe('true')
    expect(w.get('.g-nav-bar').classes()).toContain('is-open')
    expect(btn.find('svg').exists()).toBe(true)
    expect(document.activeElement).toBe(w.findAll('.g-nav-bar__screen-link')[0].element)
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(w.get('.g-nav-bar__screen').attributes('style')).toContain('--_screen-top')
    // Tab desde el último de la pantalla vuelve a la hamburguesa; Mayús+Tab desde ella va al último
    const last = w.get('.b-screen').element
    last.focus()
    await w.get('.b-screen').trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(btn.element)
    await btn.trigger('keydown', { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
    await w.get('.b-screen').trigger('keydown', { key: 'Escape' })
    expect(w.get('.g-nav-bar__screen').attributes('hidden')).toBeDefined()
    expect(document.activeElement).toBe(btn.element)
    expect(document.documentElement.style.overflow).toBe('')
    w.unmount()
  })

  it('con chasis: cover(true) al abrir y cover(false) al cerrar, sin tocar el documento', async () => {
    const cover = vi.fn()
    const Host = { setup: () => { provide(appShellKey, { cover }); return () => h(GNavBar, { items: ITEMS, label: 'S', labels: LABELS }) } }
    const w = mount(Host, { attachTo: document.body })
    await w.get('.g-nav-bar__toggle').trigger('click')
    expect(cover).toHaveBeenLastCalledWith(true)
    expect(document.documentElement.style.overflow).toBe('')
    await w.get('.g-nav-bar__toggle').trigger('click')
    expect(cover).toHaveBeenLastCalledWith(false)
    await w.get('.g-nav-bar__toggle').trigger('click')
    w.unmount() // desmontar abierta deshace
    expect(cover).toHaveBeenLastCalledWith(false)
  })

  it('se cierra al cambiar current y al cruzar un corte del visor (matchMedia tras montar)', async () => {
    const w = make()
    expect(mqs.map((m) => m.media)).toEqual(['(min-width: 48rem)', '(min-width: 80rem)'])
    await w.get('.g-nav-bar__toggle').trigger('click')
    await w.setProps({ current: '/changelog' })
    expect(w.get('.g-nav-bar__screen').attributes('hidden')).toBeDefined()
    await w.get('.g-nav-bar__toggle').trigger('click')
    mqs[0].l.forEach((f) => f({ matches: true }))
    await nextTick()
    expect(w.get('.g-nav-bar__screen').attributes('hidden')).toBeDefined()
    w.unmount()
    expect(mqs[0].l).toHaveLength(0)
  })
})

describe('GNavBar · SSR e hidratación', () => {
  it('el servidor pinta enlaces, actual, «…» y pantalla cerrados; el cliente hidrata sin desajustes', async () => {
    const App = () => ({ render: () => h(GNavBar, { items: ITEMS, current: '/components/btn', label: 'Secciones', labels: LABELS }, { actions: ({ place }) => h('span', { class: `s-${place}` }) }) })
    const html = await renderToString(createSSRApp(App()))
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('popover="auto"')
    expect(html).toMatch(/class="g-nav-bar__screen"[^>]*hidden/)
    const el = document.createElement('div')
    el.innerHTML = html
    document.body.append(el)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    createSSRApp(App()).mount(el)
    await nextTick()
    const mismatch = [...warn.mock.calls, ...error.mock.calls].map((c) => String(c[0])).filter((t) => /hydration/i.test(t))
    expect(mismatch).toEqual([])
    expect(el.querySelector('.g-nav-bar').id).toMatch(/^g-nav-bar-/)
  })
})
