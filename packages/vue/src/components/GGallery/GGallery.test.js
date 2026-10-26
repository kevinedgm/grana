// GGallery y GGalleryViewer (gallery.md; #730 a #735, #742, #758): miniaturas-enlace, espacios, tira, visor sobre GDialog.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GGallery from './GGallery.vue'
import GGalleryViewer from './GGalleryViewer.vue'
import GSection from '../GSection/GSection.vue'
import { resetDialogStack } from '../../utils/dialogStack.js'

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); resetDialogStack(); document.body.innerHTML = '' })

const PHOTOS = [
  { id: 'a', src: '/hab-1.jpg', thumb: '/t/hab-1.jpg', width: 1600, height: 1067, alt: 'Cama con colcha de telar', group: 'hab' },
  { id: 'b', src: '/hab-2.jpg', width: 1600, height: 1067, alt: 'Lámparas de barro', group: 'hab', caption: 'Lámparas' },
  { id: 'c', src: '/bano-1.jpg', width: 1067, height: 1600, alt: 'Lavabo de talavera', group: 'bano' },
  { id: 'd', src: '/bano-2.jpg', width: 1600, height: 1067, alt: 'Regadera', group: 'bano' }
]
const FLAT = PHOTOS.map(({ group, ...p }) => p)
const LABELS = {
  total: '{count} fotos', count: '{index} de {total}', groupCount: '{group} · {index} de {total}', position: '{index} de {total}',
  announce: '{position}. {alt}.', first: 'Primera foto.', last: 'Última foto.', prev: 'Foto anterior', next: 'Foto siguiente',
  close: 'Cerrar', zoom: 'Ampliar', viewer: '{title}, galería', groups: 'Espacios', groupLink: (n, v) => `${v.group}, ${v.count} ${n === 1 ? 'foto' : 'fotos'}`,
  broken: 'No se pudo cargar esta foto: {alt}', carousel: 'carrusel', slide: 'foto'
}
const mk = (props = {}, opts = {}) => mount(GGallery, { attachTo: document.body, props: { title: 'Habitación Jardín', photos: FLAT, labels: LABELS, locale: 'es', ...props }, ...opts })
const quiet = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
const warns = (spy) => spy.mock.calls.map((c) => String(c[0]))
const click = (el, init = {}) => { const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init }); el.dispatchEvent(ev); return ev }
const dialog = () => document.querySelector('dialog.g-gallery-viewer')
const flush = async () => { await nextTick(); await nextTick(); await vi.advanceTimersByTimeAsync(100); await nextTick() }

describe('GGallery · base', () => {
  it('región con nombre, título h2, total contado y miniaturas-enlace a la foto grande con aria-haspopup', () => {
    const w = mk()
    const s = w.find('section.g-gallery')
    expect(s.classes()).toEqual(expect.arrayContaining(['g-gallery--appearance-grid']))
    expect(s.classes()).not.toContain('g-gallery--grouped')
    expect(s.attributes('aria-labelledby')).toBe(w.find('h2.g-gallery__title').attributes('id'))
    expect(w.find('.g-gallery__total').text()).toBe('4 fotos')
    const a = w.findAll('ul.g-gallery__grid[role="list"] > li.g-gallery__item > a.g-gallery__thumb')
    expect(a).toHaveLength(4)
    expect(a[0].attributes('href')).toBe('/hab-1.jpg')
    expect(a[0].attributes('aria-haspopup')).toBe('dialog')
    expect(a[0].find('img').attributes()).toMatchObject({ src: '/t/hab-1.jpg', alt: 'Cama con colcha de telar', width: '1600', height: '1067', decoding: 'async' })
  })

  it('eager: las primeras N sin lazy, el resto lazy', () => {
    const w = mk({ eager: 2 })
    expect(w.findAll('.g-gallery__img').map((i) => i.attributes('loading'))).toEqual(['eager', 'eager', 'lazy', 'lazy'])
  })

  it('el nivel del título sigue a GSection (h3 dentro de una sección de nivel 2) o a headingLevel', () => {
    const w = mount({ render: () => h(GSection, { title: 'Fotos' }, () => h(GGallery, { title: 'G', photos: FLAT, labels: LABELS })) }, { attachTo: document.body })
    expect(w.find('h3.g-gallery__title').exists()).toBe(true)
    expect(mk({ headingLevel: 4 }).find('h4.g-gallery__title').exists()).toBe(true)
  })

  it('photos vacío: no se pinta (aviso 5)', () => {
    const spy = quiet()
    const w = mk({ photos: [] })
    expect(w.find('section').exists()).toBe(false)
    expect(warns(spy).some((m) => m.includes('aviso 5'))).toBe(true)
  })

  it('miniatura rota: is-broken e icono image', async () => {
    const w = mk()
    await w.findAll('.g-gallery__img')[1].trigger('error')
    const t = w.findAll('.g-gallery__thumb')[1]
    expect(t.classes()).toContain('is-broken')
    expect(t.find('svg').exists()).toBe(true)
  })
})

describe('GGallery · abrir el visor (guarda de #505, #731)', () => {
  it('clic primario abre el visor en esa foto y cancela la navegación; v-model:open e index', async () => {
    const w = mk()
    const ev = click(w.findAll('.g-gallery__thumb')[2].element)
    await flush()
    expect(ev.defaultPrevented).toBe(true)
    expect(w.emitted('update:open')).toEqual([[true]])
    expect(w.emitted('update:index')).toEqual([[2]])
    expect(dialog().hasAttribute('open')).toBe(true)
  })

  it('con Ctrl, ⌘, Mayús, Alt, botón central o target de otro contexto, el navegador hace lo suyo', async () => {
    const w = mk()
    const t = w.findAll('.g-gallery__thumb')[0].element
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      expect(click(t, init).defaultPrevented).toBe(false)
    }
    t.setAttribute('target', '_blank')
    expect(click(t).defaultPrevented).toBe(false)
    t.setAttribute('target', '_self')
    expect(click(t).defaultPrevented).toBe(true)
    expect(w.emitted('update:open')).toHaveLength(1)
  })

  it('una activación por gesto: el segundo clic de un doble clic no vuelve a abrir', async () => {
    const w = mk()
    const t = w.findAll('.g-gallery__thumb')[0].element
    click(t, { detail: 1 })
    const ev = click(t, { detail: 2 })
    expect(ev.defaultPrevented).toBe(true)
    expect(w.emitted('update:open')).toHaveLength(1)
  })
})

describe('GGalleryViewer · sobre GDialog fullscreen bare', () => {
  const openAt = async (i = 0, props = {}) => {
    const w = mk({ ...props })
    click(w.findAll('.g-gallery__thumb')[i].element)
    await flush()
    return w
  }

  it('dialog con fullscreen y bare, zona de marca y aria-label = labels.viewer', async () => {
    await openAt()
    const d = dialog()
    expect([...d.classList]).toEqual(expect.arrayContaining(['g-dialog--fullscreen', 'g-dialog--bare', 'g-gallery-viewer']))
    expect(d.getAttribute('data-g-zone')).toBe('brand')
    expect(d.getAttribute('aria-label')).toBe('Habitación Jardín, galería')
    expect(d.querySelector('.g-dialog__header')).toBeNull()
    expect(d.querySelector('.g-gallery-viewer__title').getAttribute('aria-hidden')).toBe('true')
    expect(d.querySelector('.g-gallery-viewer__count').getAttribute('aria-hidden')).toBe('true')
  })

  it('viewerZone="none" sin zona', async () => {
    await openAt(0, { viewerZone: 'none' })
    expect(dialog().hasAttribute('data-g-zone')).toBe(false)
  })

  it('foco inicial en «Foto siguiente»; con una sola foto, sin flechas y foco en «Cerrar»', async () => {
    await openAt()
    expect(document.activeElement.classList.contains('g-gallery-viewer__next')).toBe(true)
    document.body.innerHTML = ''
    resetDialogStack()
    const w = mk({ photos: FLAT.slice(0, 1) })
    click(w.find('.g-gallery__thumb').element)
    await flush()
    expect(dialog().querySelector('.g-gallery-viewer__nav')).toBeNull()
    expect(document.activeElement.classList.contains('g-gallery-viewer__close')).toBe(true)
  })

  it('anuncio al abrir y en cada cambio (región viva vacía al montar); extremos aria-disabled y enfocables; anuncio de extremo', async () => {
    const w = mk()
    const live = () => dialog().querySelector('.g-gallery-viewer__live')
    click(w.findAll('.g-gallery__thumb')[0].element)
    await nextTick(); await nextTick()
    expect(live().textContent).toBe('')
    expect(live().getAttribute('aria-live')).toBe('polite')
    expect(live().getAttribute('aria-atomic')).toBe('true')
    await flush()
    expect(live().textContent).toBe('1 de 4. Cama con colcha de telar.')
    const prev = dialog().querySelector('.g-gallery-viewer__prev')
    expect(prev.getAttribute('aria-disabled')).toBe('true')
    expect(prev.disabled).toBe(false)
    prev.click(); await flush()
    expect(live().textContent).toBe('Primera foto.')
    dialog().querySelector('.g-gallery-viewer__next').click(); await flush()
    expect(live().textContent).toBe('2 de 4. Lámparas de barro.')
    expect(dialog().querySelector('.g-gallery-viewer__caption').textContent).toBe('Lámparas')
    expect(w.emitted('update:index').at(-1)).toEqual([1])
  })

  it('llegada: is-arriving + data-direction en el mismo render que cambia la foto, y se quita después', async () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((fn) => setTimeout(fn, 16))
    mk()
    click(document.querySelectorAll('.g-gallery__thumb')[0])
    await flush()
    dialog().querySelector('.g-gallery-viewer__next').click()
    await nextTick()
    const img = dialog().querySelector('.g-gallery-viewer__img')
    expect(img.getAttribute('src')).toBe('/hab-2.jpg')
    expect(img.classList.contains('is-arriving')).toBe(true)
    expect(img.getAttribute('data-direction')).toBe('next')
    await vi.advanceTimersByTimeAsync(40); await nextTick()
    expect(img.classList.contains('is-arriving')).toBe(false)
    raf.mockRestore()
  })

  it('teclado: → / ← (espejo en RTL), Inicio/Fin, +/- ', async () => {
    await openAt(1)
    const d = dialog()
    const key = async (k) => { d.querySelector('.g-gallery-viewer__next').dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })); await flush() }
    const src = () => d.querySelector('.g-gallery-viewer__img').getAttribute('src')
    await key('ArrowRight'); expect(src()).toBe('/bano-1.jpg')
    await key('ArrowLeft'); expect(src()).toBe('/hab-2.jpg')
    await key('End'); expect(src()).toBe('/bano-2.jpg')
    await key('Home'); expect(src()).toBe('/hab-1.jpg')
    await key('+'); expect(d.querySelector('.g-gallery-viewer__stage').classList.contains('is-zoomed')).toBe(true)
    expect(d.querySelector('.g-gallery-viewer__zoom').getAttribute('aria-pressed')).toBe('true')
    expect(d.querySelector('.g-gallery-viewer__zoom').getAttribute('aria-label')).toBe('Ampliar')
    await key('-'); expect(d.querySelector('.g-gallery-viewer__stage').classList.contains('is-zoomed')).toBe(false)
    d.querySelector('.g-gallery-viewer__stage').style.direction = 'rtl'
    await key('ArrowLeft'); expect(src()).toBe('/hab-2.jpg')
  })

  it('Esc escalonado: ampliada, la primera Esc solo reduce (consumida); la siguiente cierra y el foco vuelve a la miniatura de la foto VISTA', async () => {
    const w = await openAt(0)
    const d = dialog()
    d.querySelector('.g-gallery-viewer__next').click(); await flush()
    d.querySelector('.g-gallery-viewer__zoom').click(); await flush()
    const esc = () => { const e = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }); d.querySelector('.g-gallery-viewer__next').dispatchEvent(e); return e }
    const e1 = esc(); await flush()
    expect(e1.defaultPrevented).toBe(true)
    expect(d.querySelector('.g-gallery-viewer__stage').classList.contains('is-zoomed')).toBe(false)
    expect(d.hasAttribute('open')).toBe(true)
    esc(); await flush()
    expect(w.emitted('update:open').at(-1)).toEqual([false])
    await flush()
    expect(d.hasAttribute('open')).toBe(false)
    expect(document.activeElement).toBe(w.findAll('.g-gallery__thumb')[1].element)
  })

  it('zoom ×2 del tamaño contenido (#758): foto apaisada y vertical; recálculo al cambiar el escenario', async () => {
    let size = { w: 1000, h: 600 }
    const cw = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function () { return this.classList?.contains('g-gallery-viewer__stage') ? size.w : 0 })
    const ch = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function () { return this.classList?.contains('g-gallery-viewer__stage') ? size.h : 0 })
    let ro = null
    globalThis.ResizeObserver = class { constructor(fn) { ro = fn } observe() {} unobserve() {} disconnect() {} }
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((fn) => setTimeout(fn, 0))
    await openAt(0)
    const d = dialog()
    const stage = () => d.querySelector('.g-gallery-viewer__stage')
    d.querySelector('.g-gallery-viewer__zoom').click(); await flush()
    // apaisada 1600×1067 en 1000×600: k = min(0,625, 0,5623) → 899,7 × 600 → ×2
    expect(stage().style.getPropertyValue('--_zoom-w')).toBe(`${Math.round(1600 * (600 / 1067) * 2)}px`)
    expect(stage().style.getPropertyValue('--_zoom-h')).toBe('1200px')
    expect(stage().style.getPropertyValue('--_zoom-x')).toBe('')
    // recálculo con el escenario más estrecho
    size = { w: 500, h: 600 }
    ro([{ target: stage() }]); await flush()
    expect(stage().style.getPropertyValue('--_zoom-w')).toBe('1000px')
    expect(stage().style.getPropertyValue('--_zoom-h')).toBe(`${Math.round(1067 * (500 / 1600) * 2)}px`)
    // vertical 1067×1600 en 500×600: k = min(0,4686, 0,375) → 400 × 600 → ×2
    d.querySelector('.g-gallery-viewer__next').dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true })); await flush()
    d.querySelector('.g-gallery-viewer__next').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })); await flush()
    expect(d.querySelector('.g-gallery-viewer__img').getAttribute('src')).toBe('/bano-1.jpg')
    d.querySelector('.g-gallery-viewer__zoom').click(); await flush()
    expect(stage().style.getPropertyValue('--_zoom-w')).toBe(`${Math.round(1067 * (600 / 1600) * 2)}px`)
    expect(stage().style.getPropertyValue('--_zoom-h')).toBe('1200px')
    // reducir quita los datos
    d.querySelector('.g-gallery-viewer__zoom').click(); await flush()
    expect(stage().style.getPropertyValue('--_zoom-w')).toBe('')
    cw.mockRestore(); ch.mockRestore()
  })

  it('zoom ×2 mide la caja de contenido de la img, sin su relleno (G-A1)', async () => {
    const cw = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function () { return this.classList?.contains('g-gallery-viewer__stage') ? 1000 : 0 })
    const ch = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function () { return this.classList?.contains('g-gallery-viewer__stage') ? 600 : 0 })
    globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((fn) => setTimeout(fn, 0))
    await openAt(0)
    const d = dialog()
    d.querySelector('.g-gallery-viewer__img').style.padding = '10px 20px'
    d.querySelector('.g-gallery-viewer__zoom').click(); await flush()
    // contenido 960×580; foto 1600×1067: k = min(0,6, 0,5436) → alto 580 → ×2
    const k = Math.min(960 / 1600, 580 / 1067)
    const st = d.querySelector('.g-gallery-viewer__stage')
    expect(st.style.getPropertyValue('--_zoom-w')).toBe(`${Math.round(1600 * k * 2)}px`)
    expect(st.style.getPropertyValue('--_zoom-h')).toBe(`${Math.round(1067 * k * 2)}px`)
    cw.mockRestore(); ch.mockRestore()
  })

  it('zoom ×2 conserva el relleno de reposo en la segunda medición, con la img ya sin relleno (G-A3)', async () => {
    const cw = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function () { return this.classList?.contains('g-gallery-viewer__stage') ? 1000 : 0 })
    const ch = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function () { return this.classList?.contains('g-gallery-viewer__stage') ? 600 : 0 })
    let ro = null
    globalThis.ResizeObserver = class { constructor(fn) { ro = fn } observe() {} unobserve() {} disconnect() {} }
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((fn) => setTimeout(fn, 0))
    await openAt(0)
    const d = dialog()
    const img = d.querySelector('.g-gallery-viewer__img')
    const st = d.querySelector('.g-gallery-viewer__stage')
    img.style.padding = '10px 20px'
    d.querySelector('.g-gallery-viewer__zoom').click(); await flush()
    const before = [st.style.getPropertyValue('--_zoom-w'), st.style.getPropertyValue('--_zoom-h')]
    // ampliada, GGallery.css pone padding: 0 en la img; el observador dispara una segunda medición
    img.style.padding = '0'
    ro([{ target: st }]); await flush()
    expect([st.style.getPropertyValue('--_zoom-w'), st.style.getPropertyValue('--_zoom-h')]).toEqual(before)
    const k = Math.min(960 / 1600, 580 / 1067)
    expect(before[1]).toBe(`${Math.round(1067 * k * 2)}px`)
    // reducir y volver a ampliar relee el relleno de reposo
    d.querySelector('.g-gallery-viewer__zoom').click(); await flush()
    img.style.padding = '0 10px'
    d.querySelector('.g-gallery-viewer__zoom').click(); await flush()
    const k2 = Math.min(980 / 1600, 600 / 1067)
    expect(st.style.getPropertyValue('--_zoom-h')).toBe(`${Math.round(1067 * k2 * 2)}px`)
    cw.mockRestore(); ch.mockRestore()
  })

  it('zoom=false: sin botón ni +', async () => {
    await openAt(0, { zoom: false })
    const d = dialog()
    expect(d.querySelector('.g-gallery-viewer__zoom')).toBeNull()
    d.querySelector('.g-gallery-viewer__next').dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true, cancelable: true })); await flush()
    expect(d.querySelector('.g-gallery-viewer__stage').classList.contains('is-zoomed')).toBe(false)
  })

  it('foto rota en el visor: p.__broken con el alt', async () => {
    await openAt(0)
    dialog().querySelector('.g-gallery-viewer__img').dispatchEvent(new Event('error')); await flush()
    expect(dialog().querySelector('.g-gallery-viewer__broken').textContent).toBe('No se pudo cargar esta foto: Cama con colcha de telar')
  })

  it('gesto con puntero: arrastrar ≥ 18 % pasa; is-dragging y --_drag-x mientras se arrastra; abajo ≥ 22 % cierra', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function () { return this.classList?.contains('g-gallery-viewer__stage') ? 1000 : 0 })
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function () { return this.classList?.contains('g-gallery-viewer__stage') ? 600 : 0 })
    window.matchMedia = vi.fn().mockReturnValue({ matches: false })
    const w = await openAt(0)
    const stage = dialog().querySelector('.g-gallery-viewer__stage')
    const pe = (type, x, y) => { const e = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 }); Object.defineProperty(e, 'pointerId', { value: 1 }); stage.dispatchEvent(e) }
    pe('pointerdown', 600, 300); pe('pointermove', 450, 305); await nextTick()
    expect(stage.classList.contains('is-dragging')).toBe(true)
    expect(stage.style.getPropertyValue('--_drag-x')).toBe('-150px')
    await vi.advanceTimersByTimeAsync(0)
    pe('pointerup', 300, 305); await flush()
    expect(stage.classList.contains('is-dragging')).toBe(false)
    expect(dialog().querySelector('.g-gallery-viewer__img').getAttribute('src')).toBe('/hab-2.jpg')
    pe('pointerdown', 500, 100); pe('pointerup', 505, 300); await flush()
    expect(w.emitted('update:open').at(-1)).toEqual([false])
  })
})

describe('GGallery · A · Recorrido por espacios', () => {
  it('índice de enlaces a los espacios con nombre contado y cifra aria-hidden; espacios role=group con h3', () => {
    const w = mk({ photos: PHOTOS, groups: [{ value: 'hab', label: 'Habitación' }, { value: 'bano', label: 'Baño', id: 'fotos-bano' }] })
    expect(w.find('section').classes()).toContain('g-gallery--grouped')
    const nav = w.find('nav.g-gallery__index')
    expect(nav.attributes('aria-label')).toBe('Espacios')
    const links = nav.findAll('a.g-gallery__index-link')
    expect(links.map((l) => l.attributes('href'))).toEqual([expect.stringMatching(/-g-1$/), '#fotos-bano'])
    expect(links[1].attributes('aria-label')).toBe('Baño, 2 fotos')
    expect(links[1].find('span[aria-hidden="true"]').text()).toBe('2')
    const g = w.find('#fotos-bano')
    expect(g.attributes('role')).toBe('group')
    expect(g.find('h3.g-gallery__group-title').text()).toBe('Baño')
    expect(g.attributes('aria-labelledby')).toBe(g.find('h3').attributes('id'))
  })

  it('espacios derivados de photo.group en orden de aparición; group fuera de groups va al final (aviso 4)', () => {
    const spy = quiet()
    const a = mk({ photos: PHOTOS })
    expect(a.findAll('.g-gallery__group-title').map((t) => t.text())).toEqual(['hab', 'bano'])
    const b = mk({ photos: PHOTOS, groups: [{ value: 'bano', label: 'Baño' }] })
    expect(b.findAll('.g-gallery__group-title').map((t) => t.text())).toEqual(['Baño', 'hab'])
    expect(warns(spy).some((m) => m.includes('aviso 4'))).toBe(true)
  })

  it('visor: contador en el espacio, hilo con aria-current y Av Pág salta al espacio siguiente', async () => {
    const w = mk({ photos: PHOTOS, groups: [{ value: 'hab', label: 'Habitación' }, { value: 'bano', label: 'Baño' }] })
    click(w.findAll('.g-gallery__thumb')[0].element)
    await flush()
    const d = dialog()
    expect(d.querySelector('.g-gallery-viewer__count').textContent).toBe('Habitación · 1 de 2')
    const thread = d.querySelector('nav.g-gallery-viewer__thread')
    expect(thread.getAttribute('tabindex')).toBe('-1')
    expect(thread.getAttribute('aria-label')).toBe('Espacios')
    expect([...thread.querySelectorAll('[aria-current="true"]')].map((b) => b.textContent)).toEqual(['Habitación'])
    d.querySelector('.g-gallery-viewer__next').dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true })); await flush()
    expect(d.querySelector('.g-gallery-viewer__count').textContent).toBe('Baño · 1 de 2')
    expect(d.querySelector('.g-gallery-viewer__live').textContent).toBe('Baño · 1 de 2. Lavabo de talavera.')
    thread.querySelectorAll('button')[0].click(); await flush()
    expect(d.querySelector('.g-gallery-viewer__img').getAttribute('src')).toBe('/hab-1.jpg')
  })
})

describe('GGallery · B · La tira', () => {
  const mkB = (props = {}) => mk({ appearance: 'strip', ...props })

  it('carrusel sin rotación: roledescription, diapositivas role=group con nombre, contenedor tabindex=-1, una parada de Tab', () => {
    const w = mkB()
    const s = w.find('.g-gallery__strip')
    expect(s.attributes('aria-roledescription')).toBe('carrusel')
    expect(s.attributes('tabindex')).toBe('-1')
    expect(s.attributes('aria-labelledby')).toBe(w.find('.g-gallery__title').attributes('id'))
    const slides = w.findAll('.g-gallery__slide')
    expect(slides[0].attributes()).toMatchObject({ role: 'group', 'aria-roledescription': 'foto', 'aria-label': '1 de 4' })
    expect(w.findAll('.g-gallery__thumb').map((t) => t.attributes('tabindex'))).toEqual(['0', '-1', '-1', '-1'])
    expect(w.find('.g-gallery__strip-count').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-gallery__live').text()).toBe('')
  })

  it('flechas mueven la actual y el foco; los botones anuncian; en el extremo, anuncio de extremo', async () => {
    const w = mkB()
    Element.prototype.scrollIntoView = vi.fn()
    await w.findAll('.g-gallery__thumb')[0].trigger('keydown', { key: 'ArrowRight' })
    await flush()
    expect(w.findAll('.g-gallery__thumb')[1].attributes('tabindex')).toBe('0')
    expect(document.activeElement).toBe(w.findAll('.g-gallery__thumb')[1].element)
    expect(w.find('.g-gallery__live').text()).toBe('')
    await w.find('.g-gallery__next').trigger('click'); await flush()
    expect(w.find('.g-gallery__live').text()).toBe('3 de 4. Lavabo de talavera.')
    expect(w.find('.g-gallery__strip-count').text()).toBe('3 / 4')
    await w.find('.g-gallery__thumb').trigger('keydown', { key: 'End' }); await flush()
    await w.find('.g-gallery__next').trigger('click'); await flush()
    expect(w.find('.g-gallery__live').text()).toBe('Última foto.')
    expect(w.find('.g-gallery__next').attributes('aria-disabled')).toBe('true')
  })

  it('un estado, dos profundidades: lo recorrido en el visor deja la tira en esa foto', async () => {
    Element.prototype.scrollIntoView = vi.fn()
    const w = mkB()
    click(w.findAll('.g-gallery__thumb')[1].element)
    await flush()
    dialog().querySelector('.g-gallery-viewer__next').click(); await flush()
    expect(w.findAll('.g-gallery__slide')[2].classes()).toContain('is-current')
    expect(w.findAll('.g-gallery__thumb')[2].attributes('tabindex')).toBe('0')
  })

  it('un index que cambia desde fuera (#937): mueve la actual y desplaza SOLO la tira (scrollTo), sin foco ni anuncio', async () => {
    const intoView = vi.fn()
    Element.prototype.scrollIntoView = intoView
    const before = document.createElement('button')
    document.body.appendChild(before)
    before.focus()
    const w = mkB({ index: 0 })
    const strip = w.find('.g-gallery__strip').element
    strip.scrollTo = vi.fn()
    strip.getBoundingClientRect = () => ({ left: 0, right: 400, top: 0, bottom: 300, width: 400, height: 300 })
    w.findAll('.g-gallery__slide').forEach((s, i) => { s.element.getBoundingClientRect = () => ({ left: i * 320, right: i * 320 + 300, top: 0, bottom: 300, width: 300, height: 300 }) })
    await w.setProps({ index: 2 })
    await flush()
    expect(w.findAll('.g-gallery__slide')[2].classes()).toContain('is-current')
    expect(w.findAll('.g-gallery__thumb')[2].attributes('tabindex')).toBe('0')
    expect(w.find('.g-gallery__strip-count').text()).toBe('3 / 4')
    expect(strip.scrollTo).toHaveBeenCalledTimes(1)
    expect(strip.scrollTo.mock.calls[0][0].left).toBe(640)
    expect(intoView).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(before)
    expect(w.find('.g-gallery__live').text()).toBe('')
    expect(w.emitted('update:index')).toBeUndefined()
  })
  it('con movimiento reducido el desplazamiento externo es instantáneo; la vuelta por v-model de un cambio propio no vuelve a desplazar', async () => {
    Element.prototype.scrollIntoView = vi.fn()
    const mm = window.matchMedia
    window.matchMedia = (q) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })
    try {
      const w = mkB({ index: 0, 'onUpdate:index': (v) => w.setProps({ index: v }) })
      const strip = w.find('.g-gallery__strip').element
      strip.scrollTo = vi.fn()
      strip.getBoundingClientRect = () => ({ left: 0, right: 400, top: 0, bottom: 300, width: 400, height: 300 })
      w.findAll('.g-gallery__slide').forEach((s, i) => { s.element.getBoundingClientRect = () => ({ left: i * 320, right: i * 320 + 300, top: 0, bottom: 300, width: 300, height: 300 }) })
      await w.find('.g-gallery__next').trigger('click'); await flush()
      expect(w.props('index')).toBe(1)
      expect(strip.scrollTo).not.toHaveBeenCalled()
      await w.setProps({ index: 3 }); await flush()
      expect(strip.scrollTo).toHaveBeenCalledWith({ left: 960, behavior: 'instant' })
    } finally { window.matchMedia = mm }
  })

  it('sin labels.carousel o slide: sin aria-roledescription (aviso 6)', () => {
    const spy = quiet()
    const w = mkB({ labels: { ...LABELS, carousel: undefined } })
    expect(w.find('.g-gallery__strip').attributes('aria-roledescription')).toBeUndefined()
    expect(w.find('.g-gallery__slide').attributes('aria-roledescription')).toBeUndefined()
    expect(warns(spy).some((m) => m.includes('aviso 6'))).toBe(true)
  })
})

describe('GGallery · avisos', () => {
  it('sin title (1), sin width/height (2), sin alt (3), inline reservada (8), index fuera de rango (9), label que falta (7)', () => {
    const spy = quiet()
    mk({ title: undefined, photos: [{ src: '/x.jpg' }], appearance: 'inline', index: 9, labels: {} })
    const m = warns(spy)
    for (const n of [1, 2, 3, 7, 8, 9]) expect(m.some((x) => x.includes(`aviso ${n})`)), `aviso ${n}`).toBe(true)
  })
})

describe('GGalleryViewer suelto', () => {
  it('abre con v-model, el foco vuelve a from al cerrar y update:index', async () => {
    const btn = document.createElement('button'); btn.textContent = 'Ver fotos'
    document.body.append(btn)
    btn.focus()
    const w = mount(GGalleryViewer, { attachTo: document.body, props: { modelValue: false, photos: FLAT, title: 'Suite', labels: LABELS, from: btn } })
    await w.setProps({ modelValue: true }); await flush()
    expect(dialog().getAttribute('aria-label')).toBe('Suite, galería')
    dialog().querySelector('.g-gallery-viewer__next').click(); await flush()
    expect(w.emitted('update:index')).toEqual([[1]])
    dialog().querySelector('.g-gallery-viewer__close').click(); await flush()
    expect(w.emitted('update:modelValue').at(-1)).toEqual([false])
    await w.setProps({ modelValue: false }); await flush()
    expect(document.activeElement).toBe(btn)
  })

  it('con photos vacío no abre', async () => {
    quiet()
    mount(GGalleryViewer, { attachTo: document.body, props: { modelValue: true, photos: [], title: 'S', labels: LABELS } })
    await flush()
    expect(dialog().hasAttribute('open')).toBe(false)
  })
})

describe('GGallery · SSR', () => {
  it.each(['grid', 'strip'])('%s se renderiza en el servidor', async (appearance) => {
    const html = await renderToString(createSSRApp({ render: () => h(GGallery, { title: 'G', photos: PHOTOS, labels: LABELS, appearance }) }))
    expect(html).toContain('g-gallery--appearance-' + appearance)
    expect(html).toContain('aria-haspopup="dialog"')
  })
})
