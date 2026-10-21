// GContainer (container.md «Verificación · bruno»). El ancho, el margen, el sangrado y la medida son CSS (Playwright:
// design/lab/theme-playground/tests/container.spec.mjs); aquí, el elemento, las clases, $attrs, los avisos y el servidor.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GContainer from './GContainer.vue'
import GAppShell from '../GAppShell/GAppShell.vue'

const wait = (ms = 60) => new Promise((r) => setTimeout(r, ms))
const warns = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
const warned = (spy, re) => spy.mock.calls.some((c) => re.test(String(c[0])))

enableAutoUnmount(afterEach)
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const cls = (w) => [...w.element.classList]

describe('GContainer · elemento y clases', () => {
  it('div por defecto con las clases de los cuatro ejes siempre (también las de los defaults) y la columna', () => {
    const w = mount(GContainer, { slots: { default: () => h('p', 'Hola') } })
    expect(w.element.tagName).toBe('DIV')
    expect(cls(w)).toEqual(['g-container', 'g-container--width-lg', 'g-container--horizontal-center', 'g-container--gutter-auto'])
    const body = w.element.firstElementChild
    expect(body.className).toBe('g-container__body')
    expect(w.element.children).toHaveLength(1)
    expect(body.innerHTML).toBe('<p>Hola</p>')
    expect(w.element.getAttribute('role')).toBeNull()
  })

  it('as: main, section, article; fuera de lista, div y aviso 4', () => {
    const spy = warns()
    for (const as of ['main', 'section', 'article']) expect(mount(GContainer, { props: { as } }).element.tagName).toBe(as.toUpperCase())
    const bad = mount(GContainer, { props: { as: 'button' } })
    expect(bad.element.tagName).toBe('DIV')
    expect(warned(spy, /\[Grana GContainer\] as="button"/)).toBe(true)
  })

  it('width, horizontal, gutter y prose ponen su clase; fuera de lista, el default y aviso (1 width, 4 gutter y horizontal)', () => {
    const spy = warns()
    for (const width of ['sm', 'md', 'lg', 'xl', '2xl', 'full', 'reading']) expect(cls(mount(GContainer, { props: { width } }))).toContain(`g-container--width-${width}`)
    for (const gutter of ['auto', 'none', 'sm', 'md', 'lg']) expect(cls(mount(GContainer, { props: { gutter } }))).toContain(`g-container--gutter-${gutter}`)
    expect(cls(mount(GContainer, { props: { horizontal: 'start' } }))).toContain('g-container--horizontal-start')
    expect(cls(mount(GContainer, { props: { prose: true } }))).toContain('g-container--prose')
    expect(cls(mount(GContainer))).not.toContain('g-container--prose')
    const bad = mount(GContainer, { props: { width: 'huge', gutter: 'xl', horizontal: 'end' } })
    expect(cls(bad)).toEqual(['g-container', 'g-container--width-lg', 'g-container--horizontal-center', 'g-container--gutter-auto'])
    expect(warned(spy, /width="huge" no está en/)).toBe(true)
    expect(warned(spy, /gutter="xl" no está en/)).toBe(true)
    expect(warned(spy, /horizontal="end" no está en/)).toBe(true)
  })

  it('$attrs a la raíz: id, aria-*, data-g-zone, tabindex y style (--g-container-max va en la raíz)', () => {
    const w = mount(GContainer, { props: { as: 'section' }, attrs: { id: 'pag', 'aria-labelledby': 't', 'data-g-zone': 'brand', tabindex: '-1', style: '--g-container-max: 70rem', class: 'mi-vista' } })
    const el = w.element
    expect(el.id).toBe('pag')
    expect(el.getAttribute('aria-labelledby')).toBe('t')
    expect(el.getAttribute('data-g-zone')).toBe('brand')
    expect(el.getAttribute('tabindex')).toBe('-1')
    expect(el.getAttribute('style')).toContain('--g-container-max: 70rem')
    expect(el.classList.contains('mi-vista')).toBe(true)
    expect(el.firstElementChild.getAttributeNames()).toEqual(['class'])
  })
})

describe('GContainer · avisos de desarrollo', () => {
  it('2 horizontal="start" con width="full"; con center (el defecto) no avisa', () => {
    const spy = warns()
    mount(GContainer, { props: { width: 'full' } })
    expect(warned(spy, /con width="full"/)).toBe(false)
    mount(GContainer, { props: { width: 'full', horizontal: 'start' } })
    expect(warned(spy, /horizontal="start" con width="full": no hay sobrante/)).toBe(true)
  })

  it('3 as="main" con otro main visible en el documento; uno oculto no cuenta', () => {
    const spy = warns()
    const hidden = document.createElement('main')
    hidden.hidden = true
    document.body.appendChild(hidden)
    mount(GContainer, { props: { as: 'main' }, attachTo: document.body })
    expect(warned(spy, /otro main/)).toBe(false)
    document.body.appendChild(document.createElement('main'))
    mount(GContainer, { props: { as: 'main' }, attachTo: document.body })
    expect(warned(spy, /as="main" y ya hay otro main/)).toBe(true)
  })

  it('3 as="main" dentro de GAppShell (S10): aviso del contenedor y aviso 3 del chasis', async () => {
    const spy = warns()
    mount(GAppShell, { attachTo: document.body, props: { labels: { skip: 'Saltar' } }, slots: { default: () => h(GContainer, { as: 'main' }, () => 'x') } })
    await wait()
    expect(warned(spy, /\[Grana GContainer\] as="main" y ya hay otro main \(en el documento o alrededor, como el del chasis g-app-shell\)/)).toBe(true)
    expect(warned(spy, /\[Grana GAppShell\] hay un main dentro del main del chasis/)).toBe(true)
  })

  it('dentro de GAppShell con as="div" no avisa nada', async () => {
    const spy = warns()
    mount(GAppShell, { attachTo: document.body, props: { labels: { skip: 'Saltar' } }, slots: { default: () => h(GContainer, null, () => h('p', 'x')) } })
    await wait()
    expect(spy).not.toHaveBeenCalled()
  })

  it('5 una banda que no ocupa la columna (medida contra .g-container__body); una bien sangrada o de un anidado, no', () => {
    const spy = warns()
    const real = Element.prototype.getBoundingClientRect
    const box = (left, right) => ({ left, right, width: right - left, top: 0, bottom: 10, height: 10, x: left, y: 0 })
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.classList.contains('g-container__body')) return box(100, 900)
      if (this.classList.contains('ok')) return box(0, 1000) // sangrada a la caja: −100 y −100 de margen
      if (this.classList.contains('mal')) return box(40, 960) // dentro de una superficie con relleno
      return real.call(this)
    })
    const band = (c) => h('section', { class: `g-bleed ${c}`, style: 'margin-left: -100px; margin-right: -100px' }, 'banda')
    mount(GContainer, { attachTo: document.body, slots: { default: () => band('ok') } })
    expect(warned(spy, /no ocupa la columna/)).toBe(false)
    mount(GContainer, { attachTo: document.body, slots: { default: () => h('div', { class: 'g-surface' }, band('mal')) } })
    expect(warned(spy, /\[Grana GContainer\] una banda g-bleed \/ g-bleed-raw no ocupa la columna/)).toBe(true)
  })

  it('una vez por instancia y motivo; en producción no avisa', async () => {
    const spy = warns()
    const w = mount(GContainer, { props: { width: 'x' } })
    await w.setProps({ gutter: 'auto' })
    expect(spy.mock.calls.filter((c) => /width="x"/.test(c[0]))).toHaveLength(1)
    spy.mockClear()
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try { mount(GContainer, { props: { width: 'x', as: 'p', gutter: 'y' } }) } finally { process.env.NODE_ENV = prev }
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('GContainer · servidor', () => {
  it('se pinta en el servidor con su elemento y sus clases, sin window', async () => {
    const app = createSSRApp({ render: () => h(GContainer, { as: 'main', width: 'reading', prose: true }, () => h('p', 'Texto')) })
    const html = await renderToString(app)
    expect(html).toBe('<main class="g-container g-container--width-reading g-container--horizontal-center g-container--gutter-auto g-container--prose"><div class="g-container__body"><p>Texto</p></div></main>')
  })
})
