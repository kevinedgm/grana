// GPageHeader (page-header.md «Verificación · bruno»). jsdom no tiene maquetación: las medidas (rect de la raíz, del
// zócalo y del hN, offsetHeight, clientWidth) se simulan por elemento y se fuerza la medida con un evento resize.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, onMounted, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GPageHeader from './GPageHeader.vue'
import { EDGE_ORDER, edgeReserve, setEdgeReserve, clearEdgeReserve } from '../../utils/edgeReserve.js'

const wait = (ms = 40) => new Promise((r) => setTimeout(r, ms))
const warns = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
const warned = (spy, re) => spy.mock.calls.some((c) => re.test(String(c[0])))

enableAutoUnmount(afterEach)
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const rect = (top, height, left = 0, width = 800) => ({ top, bottom: top + height, left, right: left + width, width, height, x: left, y: top })

// Geometría simulada de una instancia: `scrollTop` mueve la raíz (sticky la detendría en −lift); `width` es el de la raíz
function geometry(wrapper, g) {
  const root = wrapper.element
  const base = root.querySelector('.g-page-header__base')
  const title = root.querySelector('.g-page-header__title')
  const LIFT = 200
  Object.defineProperty(root, 'clientWidth', { configurable: true, get: () => g.width })
  root.getBoundingClientRect = () => rect(Math.max(-g.scroll, g.sticky === false ? -Infinity : -LIFT), LIFT + 48, 10, g.width)
  if (base) {
    Object.defineProperty(base, 'offsetHeight', { configurable: true, get: () => g.baseH ?? 48 })
    base.getBoundingClientRect = () => { const r = root.getBoundingClientRect(); return rect(r.top + LIFT, g.baseH ?? 48, 10, g.width) }
  }
  title.getBoundingClientRect = () => rect(80 - g.scroll, 40)
  const dock = root.querySelector('.g-page-header__dock')
  if (dock) Object.defineProperty(dock, 'offsetHeight', { configurable: true, get: () => g.dockH ?? 56 })
}
async function remeasure() {
  window.dispatchEvent(new Event('resize'))
  await wait()
  await nextTick()
  await wait()
}

// Acción con estado propio: cuenta montajes y guarda un contador interno
let mounts = 0
const Stateful = defineComponent({
  setup() {
    const n = ref(0)
    onMounted(() => { mounts++ })
    return () => h('button', { type: 'button', class: 'act', onClick: () => n.value++ }, `Validar ${n.value}`)
  }
})

function full(props = {}, extra = {}) {
  return mount(GPageHeader, {
    attachTo: document.body,
    props: { title: 'Muestra M-0007', labels: { actions: 'Acciones de la página' }, ...props },
    slots: {
      trail: () => h('nav', { 'aria-label': 'Ruta', class: 'trail' }, 'Inicio'),
      eyebrow: () => 'Hematología',
      description: () => 'Hemograma completo',
      meta: () => h('span', { class: 'badge' }, 'En análisis'),
      default: () => h('div', { class: 'metric' }, '18'),
      tabs: () => h('div', { role: 'tablist', class: 'tl' }, [h('button', { role: 'tab', 'aria-selected': 'true', id: 't1' }, 'Resumen'), h('button', { role: 'tab', 'aria-selected': 'false', id: 't2' }, 'Resultados')]),
      actions: (scope) => [h(Stateful), h('span', { class: 'scope' }, JSON.stringify(scope))],
      ...extra
    }
  })
}

describe('GPageHeader · estructura', () => {
  it('h1 por defecto; headingLevel 2 y 3; fuera de lista usa h1 y avisa', async () => {
    const w = warns()
    expect(full().find('h1.g-page-header__title').exists()).toBe(true)
    expect(full({ headingLevel: 2 }).find('h2.g-page-header__title').exists()).toBe(true)
    const three = full({ headingLevel: 3 })
    expect(three.find('h3').exists()).toBe(true)
    const id = three.find('h3').attributes('id')
    await three.setProps({ headingLevel: 2 })
    expect(three.find('h2').attributes('id')).toBe(id) // cambia la etiqueta, conserva el id
    expect(full({ headingLevel: 4 }).find('h1.g-page-header__title').exists()).toBe(true)
    expect(warned(w, /headingLevel=4/)).toBe(true)
  })

  it('raíz header sin role ni aria-label; id y {id}-title; tabindex=-1 y dir=auto', () => {
    const wr = full({ id: 'muestra' })
    const root = wr.element
    expect(root.tagName).toBe('HEADER')
    expect(root.hasAttribute('role')).toBe(false)
    expect(root.hasAttribute('aria-label')).toBe(false)
    expect(root.id).toBe('muestra')
    const t = wr.find('h1')
    expect(t.attributes('id')).toBe('muestra-title')
    expect(t.attributes('tabindex')).toBe('-1')
    expect(t.attributes('dir')).toBe('auto')
    const gen = full()
    expect(gen.find('h1').attributes('id')).toMatch(/^g-page-header-.+-title$/)
    expect(gen.element.hasAttribute('id')).toBe(false)
  })

  it('orden del DOM: ruta → antetítulo → título → descripción → meta → contenido → pestañas → acciones → muelle', () => {
    const root = full().element
    const order = ['.trail', '.g-page-header__eyebrow', '.g-page-header__title', '.g-page-header__desc', '.g-page-header__meta', '.g-page-header__content', '.g-page-header__tabs', '.g-page-header__actions', '.g-page-header__dock'].map((s) => root.querySelector(s))
    expect(order.every(Boolean)).toBe(true)
    for (let i = 1; i < order.length; i++) expect(order[i - 1].compareDocumentPosition(order[i]) & 4, `${i}`).toBeTruthy()
    expect(root.firstElementChild.classList.contains('trail')).toBe(true)
    expect(root.lastElementChild.classList.contains('g-page-header__dock')).toBe(true)
  })

  it('props eyebrow/description sin slots; title del hN sin el slot; slot title solo sustituye el hN', () => {
    const wr = mount(GPageHeader, { props: { title: '  Pedido 42  ', eyebrow: 'Ventas', description: 'Pendiente' }, slots: { title: () => h('bdi', 'P-42'), actions: () => h('button', 'Ok') } })
    expect(wr.find('.g-page-header__eyebrow').text()).toBe('Ventas')
    expect(wr.find('.g-page-header__desc').text()).toBe('Pendiente')
    expect(wr.find('h1').html()).toContain('<bdi>P-42</bdi>')
    expect(wr.find('.g-page-header__base-title').text()).toBe('Pedido 42')
    expect(wr.find('.g-page-header__dock-title').text()).toBe('Pedido 42')
  })

  it('zócalo solo con tabs o actions; sin acciones no hay muelle; clases has-*', () => {
    const none = mount(GPageHeader, { props: { title: 'X' } })
    expect(none.find('.g-page-header__base').exists()).toBe(false)
    expect(none.find('.g-page-header__dock').exists()).toBe(false)
    expect(none.classes()).not.toContain('has-base')
    const tabs = mount(GPageHeader, { props: { title: 'X' }, slots: { tabs: () => h('div', 'tabs') } })
    expect(tabs.find('.g-page-header__base').exists()).toBe(true)
    expect(tabs.find('.g-page-header__dock').exists()).toBe(false)
    expect(tabs.classes()).toEqual(expect.arrayContaining(['has-base', 'has-tabs']))
    const all = full()
    expect(all.classes()).toEqual(expect.arrayContaining(['g-page-header', 'has-base', 'has-tabs', 'has-actions']))
  })

  it('grupo de acciones con nombre; título compacto aria-hidden; muelle cerrado hidden + inert, enlace al hN', () => {
    const wr = full({ id: 'm' })
    const g = wr.find('.g-page-header__actions')
    expect(g.attributes('role')).toBe('group')
    expect(g.attributes('aria-label')).toBe('Acciones de la página')
    expect(wr.find('.g-page-header__base-title').attributes('aria-hidden')).toBe('true')
    const dock = wr.find('.g-page-header__dock')
    expect(dock.attributes('hidden')).toBeDefined()
    expect(dock.attributes('inert')).toBeDefined()
    expect(dock.find('a.g-page-header__dock-title').attributes('href')).toBe('#m-title')
    expect(dock.find('.g-page-header__dock-host').exists()).toBe(true)
    expect(wr.find('.scope').text()).toBe('{"narrow":false,"docked":false}')
  })

  it('zone="brand" pone data-g-zone en la raíz; fuera de lista, none y aviso; con data-theme, aviso', () => {
    const w = warns()
    expect(full({ zone: 'brand' }).attributes('data-g-zone')).toBe('brand')
    expect(full().attributes('data-g-zone')).toBeUndefined()
    const bad = full({ zone: 'inverse' })
    expect(bad.attributes('data-g-zone')).toBeUndefined()
    expect(warned(w, /zone="inverse"/)).toBe(true)
    mount(GPageHeader, { props: { title: 'X', zone: 'brand' }, attrs: { 'data-theme': 'dark' } })
    expect(warned(w, /data-theme/)).toBe(true)
  })

  it('focus() enfoca el hN con las opciones', () => {
    const wr = full()
    const spy = vi.spyOn(wr.find('h1').element, 'focus')
    wr.vm.focus({ preventScroll: true })
    expect(spy).toHaveBeenCalledWith({ preventScroll: true })
    expect(document.activeElement).toBe(wr.find('h1').element)
  })
})

describe('GPageHeader · pegado y medidas', () => {
  it('is-sticky con --_lift; is-stuck al llegar; --_p ligado al desplazamiento; reserva de arriba con order 15', async () => {
    const wr = full()
    const g = { width: 1000, scroll: 0 }
    geometry(wr, g)
    await remeasure()
    const root = wr.element
    expect(root.classList.contains('is-sticky')).toBe(true)
    expect(root.style.getPropertyValue('--_lift')).toBe('200px')
    expect(root.classList.contains('is-stuck')).toBe(false)
    expect(root.style.getPropertyValue('--_p')).toBe('0')
    g.scroll = 100 // el hN (top 80, alto 40) va por la mitad bajo el borde
    await remeasure()
    expect(root.style.getPropertyValue('--_p')).toBe('0.5')
    expect(root.classList.contains('is-stuck')).toBe(false)
    expect(edgeReserve('top')).toBe(0)
    g.scroll = 400
    await remeasure()
    expect(root.classList.contains('is-stuck')).toBe(true)
    expect(root.style.getPropertyValue('--_p')).toBe('1')
    expect(edgeReserve('top', { before: EDGE_ORDER.status })).toBe(48) // la isla queda debajo del zócalo
    expect(edgeReserve('top', { before: EDGE_ORDER.pageHeader })).toBe(0)
    g.scroll = 0
    await remeasure()
    expect(root.classList.contains('is-stuck')).toBe(false)
    expect(edgeReserve('top')).toBe(0)
  })

  it('movimiento reducido: --_p ∈ {0, 1}', async () => {
    const mm = vi.fn((q) => ({ matches: /reduce/.test(q), addEventListener() {}, removeEventListener() {} }))
    vi.stubGlobal('matchMedia', mm)
    const wr = full()
    const g = { width: 1000, scroll: 95 }
    geometry(wr, g)
    await remeasure()
    expect(wr.element.style.getPropertyValue('--_p')).toBe('0') // 0,375 → 0
    g.scroll = 105
    await remeasure()
    expect(wr.element.style.getPropertyValue('--_p')).toBe('1') // 0,625 → 1
    vi.unstubAllGlobals()
  })

  it('regla del cuarto: un zócalo de más del 25 % del visor no se pega', async () => {
    const wr = full()
    geometry(wr, { width: 1000, scroll: 400, baseH: Math.ceil(window.innerHeight * 0.25) + 1 })
    await remeasure()
    expect(wr.element.classList.contains('is-sticky')).toBe(false)
    expect(wr.element.style.getPropertyValue('--_lift')).toBe('')
  })

  it('sticky: false no pega; en vivo retira las reservas', async () => {
    const wr = full()
    const g = { width: 1000, scroll: 400 }
    geometry(wr, g)
    await remeasure()
    expect(wr.element.classList.contains('is-stuck')).toBe(true)
    await wr.setProps({ sticky: false })
    await remeasure()
    expect(wr.element.classList.contains('is-sticky')).toBe(false)
    expect(wr.element.classList.contains('is-stuck')).toBe(false)
    expect(edgeReserve('top')).toBe(0)
  })

  it('is-narrow por el ancho de la raíz (< space × 150); en estrecho no se pinta el título compacto', async () => {
    const wr = full()
    geometry(wr, { width: 599, scroll: 0 })
    await remeasure()
    expect(wr.classes()).toContain('is-narrow')
    expect(wr.find('.g-page-header__base-title').exists()).toBe(false)
    expect(wr.find('.scope').text()).toBe('{"narrow":true,"docked":false}')
    geometry(wr, { width: 600, scroll: 0 })
    await remeasure()
    expect(wr.classes()).not.toContain('is-narrow')
  })
})

describe('GPageHeader · muelle (estrecho y pegado)', () => {
  it('Teleport conmutado: los mismos nodos van al muelle y vuelven, sin volver a montarse y con su estado', async () => {
    mounts = 0
    const wr = full()
    const g = { width: 390, scroll: 0 }
    geometry(wr, g)
    await remeasure()
    const btn = wr.element.querySelector('.act')
    btn.click()
    await nextTick()
    expect(btn.textContent).toBe('Validar 1')
    expect(mounts).toBe(1)
    g.scroll = 400
    await remeasure()
    const root = wr.element
    expect(root.classList.contains('is-docked')).toBe(true)
    const dock = root.querySelector('.g-page-header__dock')
    expect(dock.querySelector('.g-page-header__dock-host .g-page-header__actions .act')).toBe(btn)
    expect(dock.hasAttribute('hidden')).toBe(false)
    expect(dock.hasAttribute('inert')).toBe(false)
    expect(dock.classList.contains('is-open')).toBe(true)
    expect(root.querySelectorAll('.act').length).toBe(1)
    expect(root.querySelector('.scope').textContent).toBe('{"narrow":true,"docked":true}')
    expect(dock.style.getPropertyValue('--_dock-left')).toBe('10px')
    expect(edgeReserve('bottom')).toBe(56)
    g.scroll = 0
    await remeasure()
    await wait(60)
    expect(root.classList.contains('is-docked')).toBe(false)
    expect(root.querySelector('.g-page-header__actions-home .act')).toBe(btn)
    expect(btn.textContent).toBe('Validar 1')
    expect(mounts).toBe(1)
    expect(dock.hasAttribute('inert')).toBe(true)
    expect(dock.hasAttribute('hidden')).toBe(true)
    expect(dock.classList.contains('is-open')).toBe(false)
    expect(edgeReserve('bottom')).toBe(0)
  })

  it('en escritorio pegado no hay muelle (0 mudanzas)', async () => {
    const wr = full()
    geometry(wr, { width: 1000, scroll: 400 })
    await remeasure()
    expect(wr.element.classList.contains('is-stuck')).toBe(true)
    expect(wr.element.classList.contains('is-docked')).toBe(false)
    expect(wr.element.querySelector('.g-page-header__actions-home .act')).toBeTruthy()
  })

  it('lo enfocado no se muda: espera al focusout', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const wr = full()
    const g = { width: 390, scroll: 0 }
    geometry(wr, g)
    await remeasure()
    const btn = wr.element.querySelector('.act')
    btn.focus()
    g.scroll = 400
    await remeasure()
    expect(wr.element.classList.contains('is-docked')).toBe(false)
    expect(wr.element.querySelector('.g-page-header__actions-home .act')).toBe(btn)
    outside.focus()
    await remeasure()
    expect(wr.element.classList.contains('is-docked')).toBe(true)
    expect(wr.element.querySelector('.g-page-header__dock-host .act')).toBe(btn)
  })

  it('lo abierto no se muda: espera a que aria-expanded deje de ser true', async () => {
    const wr = full({}, { actions: () => [h(Stateful), h('button', { type: 'button', class: 'menu', 'aria-expanded': 'true' }, 'Más')] })
    const g = { width: 390, scroll: 0 }
    geometry(wr, g)
    await remeasure()
    g.scroll = 400
    await remeasure()
    expect(wr.element.classList.contains('is-docked')).toBe(false)
    wr.element.querySelector('.menu').setAttribute('aria-expanded', 'false')
    await remeasure()
    expect(wr.element.classList.contains('is-docked')).toBe(true)
  })

  it('el muelle lee la reserva de la voz (before: 15) y se coloca encima', async () => {
    const speech = Symbol('speech')
    setEdgeReserve(speech, 'bottom', 70, { order: EDGE_ORDER.speech })
    const wr = full()
    geometry(wr, { width: 390, scroll: 400 })
    await remeasure()
    const dock = wr.element.querySelector('.g-page-header__dock')
    expect(dock.style.getPropertyValue('--_dock-offset')).toBe('70px')
    setEdgeReserve(speech, 'bottom', 80, { order: EDGE_ORDER.speech })
    await nextTick()
    expect(dock.style.getPropertyValue('--_dock-offset')).toBe('80px')
    expect(edgeReserve('bottom')).toBe(80 + 56) // GToaster suma todo
    clearEdgeReserve(speech)
    wr.unmount()
    expect(edgeReserve('bottom')).toBe(0)
    expect(edgeReserve('top')).toBe(0)
  })

  it('regla del cuarto para zócalo + muelle: si no cabe, las acciones se quedan en el zócalo', async () => {
    const wr = full()
    geometry(wr, { width: 390, scroll: 400, dockH: Math.ceil(window.innerHeight * 0.25) })
    await remeasure()
    await remeasure()
    expect(wr.element.classList.contains('is-docked')).toBe(false)
    expect(wr.element.querySelector('.g-page-header__actions-home .act')).toBeTruthy()
  })

  it('enlace del muelle: clic primario sin modificadores enfoca el hN; con modificadores lo hace el navegador', async () => {
    const wr = full()
    const a = wr.element.querySelector('.g-page-header__dock-title')
    const t = wr.element.querySelector('h1')
    const by = vi.fn()
    window.scrollBy = by
    const plain = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
    a.dispatchEvent(plain)
    expect(plain.defaultPrevented).toBe(true)
    expect(by).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(t)
    const ctrl = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ctrlKey: true })
    a.addEventListener('click', (e) => { if (e.ctrlKey) { expect(e.defaultPrevented).toBe(false); e.preventDefault() } })
    a.dispatchEvent(ctrl)
    expect(by).toHaveBeenCalledTimes(1)
  })

  it('dentro de un <dialog>: sin muelle ni reservas', async () => {
    const dlg = document.createElement('dialog')
    document.body.append(dlg)
    const wr = mount(GPageHeader, { attachTo: dlg, props: { title: 'X', headingLevel: 2, labels: { actions: 'A' } }, slots: { actions: () => h(Stateful) } })
    await nextTick()
    expect(wr.find('.g-page-header__dock').exists()).toBe(false)
    geometry(wr, { width: 390, scroll: 400 })
    await remeasure()
    expect(wr.element.classList.contains('is-stuck')).toBe(true)
    expect(wr.element.classList.contains('is-docked')).toBe(false)
    expect(edgeReserve('top')).toBe(0)
    expect(edgeReserve('bottom')).toBe(0)
  })
})

describe('GPageHeader · cambio de pestaña pegado', () => {
  it('con is-stuck, al cambiar aria-selected la página se coloca bajo el zócalo al instante; sin pegar, nada', async () => {
    const host = document.createElement('main')
    document.body.append(host)
    const wr = full({}, {})
    host.append(wr.element)
    const after = document.createElement('section')
    host.append(after)
    const g = { width: 1000, scroll: 400 }
    geometry(wr, g)
    after.getBoundingClientRect = () => rect(300, 1000)
    after.getClientRects = () => [rect(300, 1000)]
    const by = vi.fn()
    window.scrollBy = by
    await remeasure()
    expect(wr.element.classList.contains('is-stuck')).toBe(true)
    wr.element.querySelector('#t1').setAttribute('aria-selected', 'false')
    wr.element.querySelector('#t2').setAttribute('aria-selected', 'true')
    await wait()
    expect(by).toHaveBeenCalledWith({ top: 300 - 48, behavior: 'instant' })
    by.mockClear()
    g.scroll = 0
    await remeasure()
    wr.element.querySelector('#t1').setAttribute('aria-selected', 'true')
    await wait()
    expect(by).not.toHaveBeenCalled()
  })
})

describe('GPageHeader · avisos de desarrollo', () => {
  it('1 sin title; 4 acciones sin labels.actions; una vez por instancia y motivo', () => {
    const w = warns()
    mount(GPageHeader, { props: { title: '   ' }, slots: { actions: () => h('button', 'A') } })
    expect(warned(w, /falta title/)).toBe(true)
    expect(warned(w, /labels\.actions/)).toBe(true)
    const n = w.mock.calls.length
    const wr = mount(GPageHeader, { props: { title: '' } })
    wr.setProps({ eyebrow: 'x' })
    expect(w.mock.calls.filter((c) => /falta title/.test(c[0])).length).toBe(2) // una por instancia
    expect(w.mock.calls.length).toBe(n + 1)
  })

  it('2 otro h1 en el documento al montar con headingLevel 1', () => {
    const w = warns()
    document.body.insertAdjacentHTML('beforeend', '<h1>Otra</h1>')
    mount(GPageHeader, { attachTo: document.body, props: { title: 'X' } })
    expect(warned(w, /otro h1/)).toBe(true)
  })

  it('5 padre del mismo alto; 6 zócalo con contenido más alto; 7 dos sólidas de marca; 9 GTabs con paneles', async () => {
    const w = warns()
    const wr = mount(GPageHeader, {
      attachTo: document.body,
      props: { title: 'X', labels: { actions: 'A' } },
      slots: {
        tabs: () => h('div', { class: 'g-tabs' }, [h('div', { class: 'g-tabs__panels' })]),
        actions: () => [h('button', { class: 'g-btn g-btn--variant-solid g-btn--color-brand big' }, 'Uno'), h('button', { class: 'g-btn g-btn--variant-solid g-btn--color-brand' }, 'Dos')]
      }
    })
    geometry(wr, { width: 1000, scroll: 0 })
    wr.element.querySelector('.big').getBoundingClientRect = () => rect(0, 60)
    wr.element.parentElement.getBoundingClientRect = () => rect(0, 248)
    await remeasure()
    await remeasure()
    expect(warned(w, /más alto que el zócalo/)).toBe(true)
    expect(warned(w, /más de una acción sólida/)).toBe(true)
    expect(warned(w, /paneles integrados/)).toBe(true)
    expect(warned(w, /padre del encabezado mide lo mismo/)).toBe(true)
  })

  it('8 el muelle abierto no llega al borde inferior', async () => {
    const w = warns()
    const wr = full()
    geometry(wr, { width: 390, scroll: 400 })
    const dock = wr.element.querySelector('.g-page-header__dock')
    dock.getBoundingClientRect = () => rect(100, 56)
    await remeasure()
    await wait(120)
    expect(warned(w, /muelle no llega al borde inferior/)).toBe(true)
  })

  it('en producción no avisa', () => {
    const w = warns()
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try { mount(GPageHeader, { props: { title: '' } }) } finally { process.env.NODE_ENV = prev }
    expect(w).not.toHaveBeenCalled()
  })
})

describe('GPageHeader · servidor', () => {
  it('se pinta en el servidor sin window ni pegado; las acciones en su sitio', async () => {
    const app = createSSRApp({ render: () => h(GPageHeader, { title: 'Muestra', labels: { actions: 'A' } }, { actions: () => h('button', 'Validar'), tabs: () => h('div', 'tabs') }) })
    const html = await renderToString(app)
    expect(html).toContain('<header class="g-page-header has-base has-tabs has-actions"')
    expect(html).toContain('id="v-0-title"'.replace('v-0', html.match(/id="([^"]+)-title"/)[1]))
    expect(html).toMatch(/g-page-header__actions-home[^]*Validar/)
    expect(html).not.toContain('is-sticky')
    expect(html).toMatch(/class="g-page-header__dock"[^>]*hidden/)
  })
})
