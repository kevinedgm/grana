// GAppShell (app-shell.md «Verificación · bruno»). jsdom no tiene maquetación ni aplica GAppShell.css: la cifra de la banda
// (la sonda de --_app-shell-pinned), el relleno del marco y los altos se simulan; la reserva del sidebar, el presupuesto y
// A son CSS y se miden en Playwright (design/lab/theme-playground/tests/app-shell.spec.mjs).
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, inject, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GAppShell from './GAppShell.vue'
import { EDGE_ORDER, edgeReserve } from '../../utils/edgeReserve.js'
import { appShellKey } from '../../utils/appShell.js'

const wait = (ms = 60) => new Promise((r) => setTimeout(r, ms))
const warns = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
const warned = (spy, re) => spy.mock.calls.some((c) => re.test(String(c[0])))
const LABELS = { skip: 'Saltar al contenido' }

enableAutoUnmount(afterEach)

// La banda pegada mide 56 (sonda de --_app-shell-pinned); `band.value` la cambia (0 = despegada por el presupuesto)
const band = { value: 56 }
let realRect
beforeEach(() => {
  band.value = 56
  realRect = Element.prototype.getBoundingClientRect
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.dataset && this.dataset.gProbe === 'pinned') return { top: 0, left: 0, right: 0, bottom: band.value, width: 0, height: band.value, x: 0, y: 0 }
    return realRect.call(this)
  })
  setScroll(0)
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

function setScroll(y) {
  Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: y })
}
async function scrollTo(y) {
  setScroll(y)
  window.dispatchEvent(new Event('scroll'))
  await nextTick()
}

// Lee el canal desde dentro (como GPageHeader)
let channel = null
const Probe = defineComponent({
  setup() {
    channel = inject(appShellKey, null)
    return () => h('span', { class: 'probe' })
  }
})

function shell(props = {}, slots = {}, opts = {}) {
  return mount(GAppShell, {
    attachTo: opts.attachTo || document.body,
    props: { labels: LABELS, ...props },
    slots: {
      header: () => [h('button', { type: 'button', class: 'hb' }, 'Buscar')],
      nav: () => h('nav', { class: 'g-sidebar g-sidebar--mode-expanded', 'aria-label': 'Principal' }, 'nav'),
      default: () => [h(Probe), h('p', { class: 'page' }, 'Página')],
      footer: () => 'Pie',
      ...slots
    }
  })
}

describe('GAppShell · estructura', () => {
  it('landmarks en orden: salto → header → nav → frame (main → footer); main único con tabindex=-1', () => {
    const w = shell({ id: 'app' })
    const root = w.element
    expect(root.tagName).toBe('DIV')
    expect(root.id).toBe('app')
    expect([...root.children].map((c) => c.className.split(' ')[0])).toEqual(['g-app-shell__skip', 'g-app-shell__header', 'g-sidebar', 'g-app-shell__frame'])
    const frame = root.querySelector('.g-app-shell__frame')
    expect([...frame.children].map((c) => c.tagName)).toEqual(['MAIN', 'FOOTER'])
    const main = root.querySelector('main')
    expect(main.id).toBe('app-main')
    expect(main.getAttribute('tabindex')).toBe('-1')
    expect(main.classList.contains('g-app-shell__main')).toBe(true)
    expect(root.querySelectorAll('main')).toHaveLength(1)
    expect(root.querySelector('header').classList.contains('g-app-shell__header')).toBe(true)
    expect(root.querySelector('footer').classList.contains('g-app-shell__footer')).toBe(true)
    const skip = root.querySelector('a.g-app-shell__skip')
    expect(skip.getAttribute('href')).toBe('#app-main')
    expect(skip.textContent).toBe('Saltar al contenido')
    // Sin roles ni nombres propios
    expect(root.getAttribute('role')).toBeNull()
    expect(main.getAttribute('aria-label')).toBeNull()
  })

  it('header y footer solo con slot; clases has-*; sin id, uno generado', () => {
    const w = mount(GAppShell, { props: { labels: LABELS }, slots: { default: () => 'x' } })
    const root = w.element
    expect(root.querySelector('header')).toBeNull()
    expect(root.querySelector('footer')).toBeNull()
    expect(root.classList.contains('has-header')).toBe(false)
    expect(root.classList.contains('has-footer')).toBe(false)
    expect(root.id).toBe('')
    expect(root.querySelector('main').id).toMatch(/^g-app-shell-.+-main$/)
    const full = shell()
    expect(full.element.classList.contains('has-header')).toBe(true)
    expect(full.element.classList.contains('has-footer')).toBe(true)
    expect(full.element.classList.contains('g-app-shell--header-relay')).toBe(false)
    expect(shell({ header: 'relay' }).element.classList.contains('g-app-shell--header-relay')).toBe(true)
  })

  it('headerZone="brand" pone data-g-zone en la banda, nunca en la raíz; fuera de lista o sin header, none y aviso', async () => {
    const spy = warns()
    const w = shell({ headerZone: 'brand' })
    expect(w.element.querySelector('header').getAttribute('data-g-zone')).toBe('brand')
    expect(w.element.getAttribute('data-g-zone')).toBeNull()
    expect(shell().element.querySelector('header').getAttribute('data-g-zone')).toBeNull()
    const bad = shell({ headerZone: 'inverse' })
    expect(bad.element.querySelector('header').getAttribute('data-g-zone')).toBeNull()
    expect(warned(spy, /\[Grana GAppShell\] headerZone="inverse"/)).toBe(true)
    mount(GAppShell, { props: { labels: LABELS, headerZone: 'brand' }, slots: { default: () => 'x' } })
    expect(warned(spy, /headerZone="brand" sin slot header/)).toBe(true)
  })
})

describe('GAppShell · enlace de salto', () => {
  it('clic primario: preventDefault, sin tocar location.hash, foco en main con preventScroll y al inicio', () => {
    const w = shell()
    const main = w.element.querySelector('main')
    const focus = vi.spyOn(main, 'focus')
    main.scrollIntoView = vi.fn()
    const hash = location.hash
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
    w.element.querySelector('.g-app-shell__skip').dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    expect(location.hash).toBe(hash)
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(main.scrollIntoView).toHaveBeenCalledWith({ block: 'start' })
  })

  it('con modificadores o botón central no actúa (lo hace el navegador)', () => {
    const w = shell()
    const main = w.element.querySelector('main')
    const focus = vi.spyOn(main, 'focus')
    const skip = w.element.querySelector('.g-app-shell__skip')
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init })
      skip.addEventListener('click', (e) => e.preventDefault(), { once: true }) // no navegar en jsdom
      skip.dispatchEvent(ev)
    }
    expect(focus).not.toHaveBeenCalled()
  })
})

describe('GAppShell · bordes compartidos y canal', () => {
  it('publica la banda arriba con order 5 y el canal da su sitio final; sin cabecera, 0', async () => {
    const w = shell()
    await wait()
    expect(edgeReserve('top')).toBe(56)
    expect(edgeReserve('top', { before: EDGE_ORDER.appShell })).toBe(0)
    expect(edgeReserve('top', { before: EDGE_ORDER.speech })).toBe(56) // la voz, el zócalo y la isla quedan debajo
    expect(channel.top.value).toBe(56)
    expect(typeof channel.notify).toBe('function')
    w.unmount()
    expect(edgeReserve('top')).toBe(0)
    mount(GAppShell, { props: { labels: LABELS }, slots: { default: () => h(Probe) } })
    await wait()
    expect(edgeReserve('top')).toBe(0)
    expect(channel.top.value).toBe(0)
  })

  it('despegada por el presupuesto (la banda vale 0): no publica arriba', async () => {
    band.value = 0
    shell()
    await wait()
    expect(edgeReserve('top')).toBe(0)
    expect(channel.top.value).toBe(0)
  })

  it('el slot header que desaparece retira la reserva de arriba', async () => {
    const show = ref(true)
    const Host = defineComponent({
      setup: () => () => h(GAppShell, { labels: LABELS }, show.value ? { header: () => h('b', 'Marca'), default: () => 'x' } : { default: () => 'x' })
    })
    mount(Host, { attachTo: document.body })
    await wait()
    expect(edgeReserve('top')).toBe(56)
    show.value = false
    await nextTick()
    await wait()
    expect(edgeReserve('top')).toBe(0)
  })

  it('navbar: publica abajo el relleno inferior real del marco (con área segura) con order 5; al cambiar de forma se retira', async () => {
    const real = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, ...rest) => {
      const cs = real.call(window, el, ...rest)
      if (!el.classList || !el.classList.contains('g-app-shell__frame')) return cs
      return new Proxy(cs, { get: (t, k) => (k === 'paddingBlockEnd' ? '68px' : typeof t[k] === 'function' ? t[k].bind(t) : t[k]) })
    })
    const mode = ref('navbar')
    const Host = defineComponent({
      setup: () => () => h(GAppShell, { labels: LABELS }, { nav: () => h('nav', { class: `g-sidebar g-sidebar--mode-${mode.value}` }), default: () => 'x' })
    })
    const w = mount(Host, { attachTo: document.body })
    await wait()
    expect(edgeReserve('bottom')).toBe(68)
    expect(edgeReserve('bottom', { before: EDGE_ORDER.pageHeader })).toBe(68) // el muelle y el FAB quedan encima
    expect(edgeReserve('bottom', { before: EDGE_ORDER.appShell })).toBe(0)
    mode.value = 'expanded'
    await nextTick()
    await wait()
    expect(edgeReserve('bottom')).toBe(0)
    mode.value = 'navbar'
    await nextTick()
    await wait()
    expect(edgeReserve('bottom')).toBe(68)
    w.unmount()
    expect(edgeReserve('bottom')).toBe(0)
  })

  it('dentro de un <dialog> no publica nada (aviso 7)', async () => {
    const spy = warns()
    const dialog = document.createElement('dialog')
    document.body.appendChild(dialog)
    shell({}, {}, { attachTo: dialog })
    await wait()
    expect(edgeReserve('top')).toBe(0)
    expect(channel.top.value).toBe(0)
    expect(warned(spy, /dentro de un <dialog>/)).toBe(true)
  })
})

describe('GAppShell · B · Relevo de franja (header="relay")', () => {
  const stuckHeader = (stuck = true) => h('header', { class: ['g-page-header', { 'is-stuck': stuck }] }, 'Encabezado')
  function relayShell(slots = {}, props = {}) {
    return shell({ header: 'relay', ...props }, { default: () => [h(Probe), slots.page ? slots.page() : stuckHeader(), h('p', 'texto')], ...slots.rest })
  }

  it('cede al bajar space × 4 con el zócalo pegado: is-yielded, top = 0 en el canal y en el registro; vuelve al subir', async () => {
    const w = relayShell()
    await wait()
    const root = w.element
    await scrollTo(10) // por debajo del umbral (16 px con space 4)
    expect(root.classList.contains('is-yielded')).toBe(false)
    await scrollTo(400)
    expect(root.classList.contains('is-yielded')).toBe(true)
    expect(channel.top.value).toBe(0)
    expect(edgeReserve('top')).toBe(0)
    await scrollTo(390) // temblor menor que el umbral
    expect(root.classList.contains('is-yielded')).toBe(true)
    await scrollTo(370)
    expect(root.classList.contains('is-yielded')).toBe(false)
    expect(channel.top.value).toBe(56)
    expect(edgeReserve('top')).toBe(56)
  })

  it('vuelve cuando el zócalo deja de estar pegado (notify) y al entrar el foco en la cabecera', async () => {
    const stuck = ref(true)
    const w = relayShell({ page: () => stuckHeader(stuck.value) })
    await wait()
    const root = w.element
    await scrollTo(400)
    expect(root.classList.contains('is-yielded')).toBe(true)
    stuck.value = false
    await nextTick()
    channel.notify()
    expect(root.classList.contains('is-yielded')).toBe(false)
    stuck.value = true
    await nextTick()
    channel.notify()
    await scrollTo(800)
    expect(root.classList.contains('is-yielded')).toBe(true)
    root.querySelector('.hb').focus()
    expect(root.classList.contains('is-yielded')).toBe(false)
    // Con el foco dentro de la cabecera no cede
    await scrollTo(1400)
    expect(root.classList.contains('is-yielded')).toBe(false)
  })

  it('no cede sin un zócalo pegado, ni con la cabecera despegada por el presupuesto, ni con header="pinned"', async () => {
    const a = relayShell({ page: () => stuckHeader(false) })
    await wait()
    await scrollTo(400)
    expect(a.element.classList.contains('is-yielded')).toBe(false)
    a.unmount()
    setScroll(0)
    band.value = 0
    const b = relayShell()
    await wait()
    await scrollTo(400)
    expect(b.element.classList.contains('is-yielded')).toBe(false)
    b.unmount()
    setScroll(0)
    band.value = 56
    const c = shell({}, { default: () => [h(Probe), stuckHeader()] })
    await wait()
    await scrollTo(400)
    expect(c.element.classList.contains('is-yielded')).toBe(false)
  })

  it('header en vivo: de relay a pinned con la cabecera cedida vuelve al instante y deja de escuchar', async () => {
    const w = relayShell()
    await wait()
    await scrollTo(400)
    expect(w.element.classList.contains('is-yielded')).toBe(true)
    const off = vi.spyOn(window, 'removeEventListener')
    await w.setProps({ header: 'pinned' })
    expect(w.element.classList.contains('is-yielded')).toBe(false)
    expect(w.element.classList.contains('g-app-shell--header-relay')).toBe(false)
    expect(off.mock.calls.some((c) => c[0] === 'scroll')).toBe(true)
    await scrollTo(0)
    await scrollTo(900)
    expect(w.element.classList.contains('is-yielded')).toBe(false)
  })

  it('el desplazamiento no vuelve a pintar el chasis (is-yielded va directo a la raíz) y un repintado no la borra', async () => {
    const renders = vi.fn()
    const Spy = defineComponent({ setup: () => () => { renders(); return h('i') } })
    const w = shell({ header: 'relay' }, { default: () => [h(Probe), stuckHeader(), h(Spy)] })
    await wait()
    const before = renders.mock.calls.length
    for (let y = 40; y <= 800; y += 40) await scrollTo(y)
    expect(w.element.classList.contains('is-yielded')).toBe(true)
    expect(renders.mock.calls.length).toBe(before)
    await w.setProps({ labels: { skip: 'Ir al contenido' } })
    expect(w.element.classList.contains('is-yielded')).toBe(true)
  })
})

describe('GAppShell · avisos de desarrollo', () => {
  it('1 sin labels.skip (o vacío); 9 header fuera de lista (usa pinned); una vez por instancia y motivo', async () => {
    const spy = warns()
    const w = mount(GAppShell, { props: { labels: { skip: '  ' }, header: 'sticky' }, slots: { default: () => 'x' } })
    expect(w.element.querySelector('.g-app-shell__skip').textContent).toBe('')
    expect(warned(spy, /\[Grana GAppShell\] falta labels.skip/)).toBe(true)
    expect(warned(spy, /header="sticky" no está en pinned \| relay/)).toBe(true)
    expect(w.element.classList.contains('g-app-shell--header-relay')).toBe(false)
    const n = spy.mock.calls.length
    await w.setProps({ labels: {} })
    expect(spy.mock.calls.length).toBe(n)
  })

  it('2 dos chasis; 3 un main dentro; 4 nav sin GSidebar hijo directo; 5 sidebar contained', async () => {
    const spy = warns()
    shell({}, { default: () => h('main', 'otro') })
    shell({}, { nav: () => h('div', { class: 'envoltorio' }, [h('nav', { class: 'g-sidebar g-sidebar--contained' })]) })
    await wait()
    expect(warned(spy, /más de un GAppShell/)).toBe(true)
    expect(warned(spy, /hay un main dentro del main del chasis/)).toBe(true)
    expect(warned(spy, /el slot nav no tiene un GSidebar como hijo directo/)).toBe(true)
    expect(warned(spy, /GSidebar con contained/)).toBe(true)
  })

  it('4 no avisa con el drawer (span[hidden] + dialog.g-sidebar__drawer como hijos directos)', async () => {
    const spy = warns()
    shell({}, { nav: () => [h('span', { hidden: true }), h('dialog', { class: 'g-sidebar__drawer' })] })
    await wait()
    expect(warned(spy, /slot nav/)).toBe(false)
  })

  it('6 el contenido de la cabecera es más alto que la banda', async () => {
    const spy = warns()
    Element.prototype.getBoundingClientRect.mockImplementation(function () {
      if (this.dataset && this.dataset.gProbe === 'pinned') return { top: 0, bottom: 56, left: 0, right: 0, width: 0, height: 56 }
      if (this.classList && this.classList.contains('g-app-shell__header')) return { top: 0, bottom: 56, left: 0, right: 800, width: 800, height: 56 }
      if (this.classList && this.classList.contains('hb')) return { top: 0, bottom: 80, left: 0, right: 80, width: 80, height: 80 }
      return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }
    })
    shell()
    await wait()
    expect(warned(spy, /más alto que la banda: declara --g-app-shell-header en :root/)).toBe(true)
  })

  it('10 la aplicación escribe su propia receta; 11 --g-app-shell-header fuera de :root', async () => {
    const spy = warns()
    const real = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, ...rest) => {
      const cs = real.call(window, el, ...rest)
      const vals = el.classList && el.classList.contains('g-app-shell')
        ? { '--g-app-shell-top': '56px', '--_app-shell-base': '48px', '--g-app-shell-header': '72px' }
        : el.classList && el.classList.contains('g-app-shell__main')
          ? { '--g-page-header-top': '80px' }
          : el === document.documentElement ? { '--g-app-shell-header': '0px' } : null
      if (!vals) return cs
      return new Proxy(cs, { get: (t, k) => (k === 'getPropertyValue' ? (n) => (n in vals ? vals[n] : t.getPropertyValue(n)) : k === 'scrollPaddingBlockStart' && el === document.documentElement ? '104px' : typeof t[k] === 'function' ? t[k].bind(t) : t[k]) })
    })
    shell()
    await wait()
    expect(warned(spy, /escribe su propia receta de cabecera/)).toBe(true)
    expect(warned(spy, /--g-app-shell-header se declaró en el chasis/)).toBe(true)
  })

  it('sin receta propia ni entrada fuera de :root, no avisa 10 ni 11', async () => {
    const spy = warns()
    const real = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, ...rest) => {
      const cs = real.call(window, el, ...rest)
      const vals = el.classList && el.classList.contains('g-app-shell')
        ? { '--g-app-shell-top': '56px', '--_app-shell-base': '48px', '--g-app-shell-header': '0px' }
        : el.classList && el.classList.contains('g-app-shell__main')
          ? { '--g-page-header-top': '56px' }
          : el === document.documentElement ? { '--g-app-shell-header': '0px' } : null
      if (!vals) return cs
      return new Proxy(cs, { get: (t, k) => (k === 'getPropertyValue' ? (n) => (n in vals ? vals[n] : t.getPropertyValue(n)) : k === 'scrollPaddingBlockStart' && el === document.documentElement ? '104px' : typeof t[k] === 'function' ? t[k].bind(t) : t[k]) })
    })
    shell()
    await wait()
    expect(warned(spy, /receta|--g-app-shell-header/)).toBe(false)
  })

  it('un chasis bien montado no avisa nada', async () => {
    const spy = warns()
    shell()
    await wait()
    expect(spy).not.toHaveBeenCalled()
  })

  it('en producción no avisa', async () => {
    const spy = warns()
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      mount(GAppShell, { props: { header: 'x', headerZone: 'y' }, slots: { default: () => h('main') } })
      await wait()
    } finally {
      process.env.NODE_ENV = prev
    }
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('GAppShell · servidor', () => {
  it('se pinta en el servidor sin window: landmarks, salto e id SSR-seguros; sin is-yielded', async () => {
    const app = createSSRApp({ render: () => h(GAppShell, { labels: LABELS, header: 'relay' }, { header: () => 'Marca', default: () => 'Página', footer: () => 'Pie' }) })
    const html = await renderToString(app)
    expect(html).toMatch(/^<div class="g-app-shell g-app-shell--header-relay has-header has-footer">/)
    const id = html.match(/<main id="([^"]+)-main"/)[1]
    expect(html).toContain(`<a class="g-app-shell__skip" href="#${id}-main">Saltar al contenido</a>`)
    expect(html).toMatch(/<header class="g-app-shell__header">(<!--\[-->)?Marca/)
    expect(html).toContain('tabindex="-1"')
    expect(html).not.toContain('is-yielded')
  })
})
