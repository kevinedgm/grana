// GPageIndex · forma `list` y `fold` (page-index.md «Forma `list`», #1054), pintada por la extensión
// `@grana/vue/page-index-list`. El motor (lectura, navigate, foco) sigue en GPageIndex.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GPageIndex from './GPageIndex.vue'
import PageIndexList from '../../page-index-list.js'

const ITEMS = [
  { id: 'uso', label: 'Uso' },
  { id: 'catalogo', label: 'Catálogo local', level: 3 },
  { id: 'api', label: 'API' },
  { id: 'props', label: 'Props', level: 3 },
  { id: 'eventos', label: 'Eventos', level: 3 }
]
const LONE = [{ id: 'suelto', label: 'Suelto', level: 3 }, { id: 'a', label: 'A' }]
let warn
const mounted = []
beforeEach(() => {
  document.body.innerHTML = '<main><h1>Título</h1>' + [...ITEMS, ...LONE].map((i) => `<h2 id="${i.id}">${i.label}</h2>`).join('') + '</main>'
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})
const mk = (props = {}, plugin = true) => {
  const w = mount(GPageIndex, { props: { label: 'En esta página', items: ITEMS, track: false, id: 'pi', ...props }, global: { plugins: plugin ? [PageIndexList] : [] }, attachTo: document.body })
  mounted.push(w)
  return w
}
const flush = async () => { for (let i = 0; i < 3; i++) await nextTick() }
const warnings = () => warn.mock.calls.map((c) => String(c[0])).join('\n')

describe('GPageIndex list · conexión con la extensión (#1054)', () => {
  it('sin la extensión: aviso 7 y relay; con ella, nav nombrado por el título <p>', () => {
    const r = mk({ appearance: 'list' }, false)
    expect(r.find('.g-page-index--appearance-relay').exists()).toBe(true)
    expect(warnings()).toContain('(aviso 7)')
    const w = mk({ appearance: 'list' })
    const nav = w.get('nav.g-page-index')
    expect(nav.classes()).toEqual(expect.arrayContaining(['g-page-index', 'g-page-index--appearance-list']))
    expect(nav.attributes('id')).toBe('pi')
    expect(nav.attributes('aria-labelledby')).toBe('pi-title')
    const title = w.get('#pi-title')
    expect(title.element.tagName).toBe('P')
    expect(title.text()).toBe('En esta página')
    expect(w.get('.g-page-index__marker').attributes('aria-hidden')).toBe('true')
    expect(w.get('.g-page-index__scroll').attributes('tabindex')).toBe('-1')
  })

  it('level 3 cuelga del 2 anterior; un 3 sin 2 previo va a la raíz; en relay los 3 no se pintan', () => {
    const w = mk({ appearance: 'list', items: [...LONE, ...ITEMS] })
    const top = [...w.get('.g-page-index__list').element.children].map((li) => li.firstElementChild.textContent)
    expect(top).toEqual(['Suelto', 'A', 'Uso', 'API'])
    const subs = w.findAll('.g-page-index__sub').map((u) => u.findAll('a').map((a) => a.text()))
    expect(subs).toEqual([['Catálogo local'], ['Props', 'Eventos']])
    const a = w.get('.g-page-index__link')
    expect(a.attributes()).toMatchObject({ href: '#suelto', dir: 'auto', title: 'Suelto' })
    const r = mk({ items: ITEMS, id: 'r' })
    expect(r.findAll('.g-page-index__ghost').map((g) => g.text())).toEqual(['Uso', 'API'])
  })

  it('una sola aria-current="location" y has-current tras la lectura', async () => {
    const w = mk({ appearance: 'list', modelValue: 'props' })
    expect(w.findAll('[aria-current]').map((a) => [a.text(), a.attributes('aria-current')])).toEqual([['Props', 'location']])
    await w.setProps({ modelValue: 'uso' })
    expect(w.findAll('[aria-current]').map((a) => a.text())).toEqual(['Uso'])
  })

  it('navigate con la guarda de #505 desde list: clic primario emite y el foco va al destino; modificadores no', async () => {
    const w = mk({ appearance: 'list' })
    const links = w.findAll('.g-page-index__link')
    await links[2].trigger('click', { button: 0, ctrlKey: true })
    await links[2].trigger('click', { button: 1 })
    expect(w.emitted('navigate')).toBeUndefined()
    await links[2].trigger('click', { button: 0 })
    expect(w.emitted('navigate')[0][0].item.id).toBe('api')
    expect(w.emitted('update:modelValue').at(-1)).toEqual(['api'])
    await flush()
    expect(document.activeElement).toBe(document.getElementById('api'))
    expect(document.getElementById('api').getAttribute('tabindex')).toBe('-1')
  })

  it('cancelado: ni actual ni foco', async () => {
    const w = mk({ appearance: 'list', onNavigate: ({ event }) => event.preventDefault() })
    await w.findAll('.g-page-index__link')[2].trigger('click', { button: 0 })
    await flush()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(document.activeElement).toBe(document.body)
  })

  it('PI-L5: la instancia sin cajas no lee ni emite (jsdom: getClientRects vacío)', async () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((f) => { f(); return 1 })
    const w = mk({ appearance: 'list', track: true })
    window.dispatchEvent(new Event('scroll'))
    await flush()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    raf.mockRestore()
  })
})

describe('GPageIndex list · plegada (fold)', () => {
  it('botón con aria-expanded y aria-controls; «Volver arriba» primero; Esc devuelve el foco; fuera cierra; alinear', async () => {
    const w = mk({ appearance: 'list', fold: true, align: 'start', labels: { top: 'Volver arriba' } })
    const nav = w.get('nav')
    expect(nav.classes()).toEqual(expect.arrayContaining(['g-page-index--appearance-list', 'g-page-index--fold', 'g-page-index--align-start']))
    expect(nav.attributes('aria-labelledby')).toBe('pi-fold')
    const btn = w.get('#pi-fold')
    expect(btn.attributes()).toMatchObject({ type: 'button', 'aria-expanded': 'false', 'aria-controls': 'pi-drop' })
    expect(btn.get('.g-page-index__chev svg').classes()).toContain('g-icon--flip-rtl')
    expect(w.get('#pi-drop').attributes('hidden')).toBeDefined()
    await btn.trigger('click')
    expect(btn.attributes('aria-expanded')).toBe('true')
    expect(nav.classes()).toContain('is-open')
    const drop = w.get('#pi-drop')
    expect(drop.attributes('hidden')).toBeUndefined()
    expect(drop.element.firstElementChild.className).toBe('g-page-index__top')
    expect(drop.element.firstElementChild.textContent).toBe('Volver arriba')
    drop.get('.g-page-index__link').element.focus()
    await drop.get('.g-page-index__link').trigger('keydown', { key: 'Escape' })
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(btn.element)
    await btn.trigger('click')
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await flush()
    expect(btn.attributes('aria-expanded')).toBe('false')
  })

  it('«Volver arriba» desplaza a 0, cierra y lleva el foco al h1 de main, sin navigate', async () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo
    const w = mk({ appearance: 'list', fold: true, labels: { top: 'Volver arriba' } })
    await w.get('#pi-fold').trigger('click')
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
    w.get('.g-page-index__top').element.dispatchEvent(ev)
    await flush()
    expect(ev.defaultPrevented).toBe(true)
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 })
    expect(document.activeElement).toBe(document.querySelector('main h1'))
    expect(w.get('#pi-fold').attributes('aria-expanded')).toBe('false')
    expect(w.emitted('navigate')).toBeUndefined()
  })

  it('elegir cierra el panel y el foco va al destino', async () => {
    const w = mk({ appearance: 'list', fold: true, labels: { top: 'Arriba' } })
    await w.get('#pi-fold').trigger('click')
    await w.findAll('.g-page-index__link')[0].trigger('click', { button: 0 })
    await flush()
    expect(w.get('#pi-fold').attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(document.getElementById('uso'))
  })

  it('avisos 8 (fold sin list), 9 (level fuera de 2 o 3) y 10 (fold sin labels.top)', () => {
    mk({ fold: true, id: 'a' })
    mk({ appearance: 'list', fold: true, items: [{ id: 'x', label: 'X', level: 4 }], id: 'b' })
    const t = warnings()
    for (const k of [8, 9, 10]) expect(t).toContain(`(aviso ${k})`)
  })
})

describe('GPageIndex list · SSR', () => {
  it('el servidor pinta la lista con la actual de modelValue y sin has-current; el cliente hidrata sin desajustes', async () => {
    const App = () => ({ render: () => h(GPageIndex, { id: 'pi', label: 'En esta página', appearance: 'list', items: ITEMS, modelValue: 'api', track: false }) })
    const html = await renderToString(createSSRApp(App()).use(PageIndexList))
    expect(html).toContain('aria-current="location"')
    expect(html).not.toContain('has-current')
    const el = document.createElement('div')
    el.innerHTML = html
    document.body.append(el)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    createSSRApp(App()).use(PageIndexList).mount(el)
    await flush()
    const mismatch = [...warn.mock.calls, ...error.mock.calls].map((c) => String(c[0])).filter((t) => /hydration/i.test(t))
    expect(mismatch).toEqual([])
  })
})
