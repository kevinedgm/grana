import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, h } from 'vue'
import GDialog from './GDialog.vue'

// jsdom no implementa showModal/close: se simulan con el mismo contrato (atributo open y evento close).
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})
afterEach(() => vi.restoreAllMocks())

const base = { modelValue: true, title: 'Título', closeLabel: 'Cerrar' }
const mountOpen = (props = {}, opts = {}) => mount(GDialog, { attachTo: document.body, props: { ...base, ...props }, ...opts })
const dlg = (w) => w.find('dialog').element

describe('GDialog · render y clases', () => {
  it('la raíz es un <dialog> con las clases por defecto', () => {
    const w = mountOpen()
    expect(w.find('dialog').exists()).toBe(true)
    expect(w.find('dialog').classes()).toEqual(expect.arrayContaining([
      'g-dialog', 'g-dialog--size-md', 'g-dialog--density-default', 'g-dialog--mobile-sheet', 'g-dialog--inset'
    ]))
    w.unmount()
  })

  it('las clases siguen a las props', () => {
    const w = mountOpen({ size: 'lg', density: 'compact', mobile: 'fullscreen', fullscreen: true, inset: false, role: 'alertdialog', loading: true })
    expect(w.find('dialog').classes()).toEqual(expect.arrayContaining([
      'g-dialog--size-lg', 'g-dialog--density-compact', 'g-dialog--mobile-fullscreen', 'g-dialog--fullscreen', 'g-dialog--alert', 'is-loading'
    ]))
    expect(w.find('dialog').classes()).not.toContain('g-dialog--inset')
    expect(w.find('.g-dialog__inset').exists()).toBe(false)
    w.unmount()
  })

  it('placement: center por defecto y end añade la clase de la hoja lateral', () => {
    const a = mountOpen()
    expect(a.find('dialog').classes()).toContain('g-dialog--placement-center')
    const b = mountOpen({ placement: 'end' })
    expect(b.find('dialog').classes()).toContain('g-dialog--placement-end')
    expect(b.find('dialog').classes()).not.toContain('g-dialog--placement-center')
    a.unmount(); b.unmount()
  })

  it('cada prop enumerada tiene validador', () => {
    for (const name of ['size', 'density', 'mobile', 'role', 'placement']) expect(GDialog.props[name].validator('valor-invalido')).toBe(false)
  })

  it('estructura con inset: encabezado, inset con cuerpo y pie', () => {
    const w = mountOpen({ description: 'Ayuda' }, { slots: { default: '<p>Hola</p>', footer: '<button>OK</button>' } })
    expect(w.find('.g-dialog__header h2.g-dialog__title').text()).toBe('Título')
    expect(w.find('.g-dialog__description').text()).toBe('Ayuda')
    expect(w.find('.g-dialog__inset .g-dialog__body').text()).toBe('Hola')
    expect(w.find('.g-dialog__inset .g-dialog__footer').text()).toBe('OK')
    w.unmount()
  })

  it('sin inset, cuerpo y pie cuelgan de la carcasa', () => {
    const w = mountOpen({ inset: false }, { slots: { default: 'x', footer: 'y' } })
    expect(w.find('dialog > .g-dialog__body').exists()).toBe(true)
    expect(w.find('dialog > .g-dialog__footer').exists()).toBe(true)
    w.unmount()
  })

  it('sin slot footer no hay pie; la descripción solo aparece si existe', () => {
    const w = mountOpen()
    expect(w.find('.g-dialog__footer').exists()).toBe(false)
    expect(w.find('.g-dialog__description').exists()).toBe(false)
    w.unmount()
  })
})

describe('GDialog · abrir y cerrar', () => {
  it('modelValue true abre con showModal y emite open', async () => {
    const spy = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
    const w = mountOpen()
    await nextTick()
    expect(spy).toHaveBeenCalled()
    expect(dlg(w).open).toBe(true)
    expect(w.emitted('open')).toBeTruthy()
    w.unmount()
  })

  it('cerrado: el contenido no se monta y el diálogo no está abierto', () => {
    const w = mountOpen({ modelValue: false }, { slots: { default: '<p id="c">x</p>' } })
    expect(dlg(w).open).toBe(false)
    expect(w.find('#c').exists()).toBe(false)
    expect(w.find('.g-dialog__header').exists()).toBe(false)
    w.unmount()
  })

  it('cambiar modelValue abre y cierra; al cerrar emite closed y desmonta el contenido', async () => {
    const w = mountOpen({ modelValue: false }, { slots: { default: '<p id="c">x</p>' } })
    await w.setProps({ modelValue: true })
    expect(dlg(w).open).toBe(true)
    expect(w.find('#c').exists()).toBe(true)
    await w.setProps({ modelValue: false })
    expect(dlg(w).open).toBe(false)
    expect(w.emitted('closed')).toBeTruthy()
    expect(w.find('#c').exists()).toBe(false)
    expect(w.emitted('dismiss')).toBeFalsy()
    w.unmount()
  })

  it('un cierre nativo con el prop aún en true pide el cambio (form method="dialog")', () => {
    const w = mountOpen()
    dlg(w).close()
    expect(w.emitted('update:modelValue').at(-1)).toEqual([false])
    w.unmount()
  })

  it('al desmontar con el diálogo abierto, lo cierra', () => {
    const w = mountOpen()
    const el = dlg(w)
    w.unmount()
    expect(el.open).toBe(false)
  })
})

describe('GDialog · dismiss', () => {
  it('Esc (cancel) emite dismiss "escape" y update:modelValue false; cancela el cierre nativo', async () => {
    const w = mountOpen()
    const ev = new Event('cancel', { cancelable: true })
    dlg(w).dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    const [payload] = w.emitted('dismiss')[0]
    expect(payload.reason).toBe('escape')
    expect(w.emitted('update:modelValue').at(-1)).toEqual([false])
    w.unmount()
  })

  it('Esc por keydown y cancel juntos cuentan una sola vez', () => {
    const w = mountOpen()
    dlg(w).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    dlg(w).dispatchEvent(new Event('cancel', { cancelable: true }))
    expect(w.emitted('dismiss')).toHaveLength(1)
    w.unmount()
  })

  it('un Esc que un descendiente ya canceló (aviso, menú) no es para el diálogo; uno sin cancelar sí', () => {
    const w = mountOpen({}, { slots: { default: '<button id="inner">x</button>' } })
    const inner = w.find('#inner').element
    inner.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !e.target.dataset.free) e.preventDefault() })
    const ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    inner.dispatchEvent(ev)
    expect(w.emitted('dismiss')).toBeFalsy()
    inner.dataset.free = '1'
    inner.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    expect(w.emitted('dismiss')).toHaveLength(1)
    w.unmount()
  })

  it('preventDefault() en dismiss mantiene el diálogo abierto (no hay update:modelValue)', () => {
    const w = mountOpen({}, { attrs: { onDismiss: (e) => e.preventDefault() } })
    dlg(w).dispatchEvent(new Event('cancel', { cancelable: true }))
    expect(w.emitted('update:modelValue')).toBeFalsy()
    w.unmount()
  })

  it('el botón de cierre emite dismiss "close"', async () => {
    const w = mountOpen()
    await w.find('.g-dialog__close').trigger('click')
    expect(w.emitted('dismiss')[0][0].reason).toBe('close')
    expect(w.emitted('update:modelValue').at(-1)).toEqual([false])
    w.unmount()
  })

  it('close() del slot cierra por la vía "close"', async () => {
    const w = mountOpen({}, { slots: { footer: ({ close }) => h('button', { id: 'x', onClick: close }, 'Cerrar') } })
    await w.find('#x').trigger('click')
    expect(w.emitted('dismiss')[0][0].reason).toBe('close')
    w.unmount()
  })

  const backdrop = (w, down, up) => {
    const el = dlg(w)
    el.getBoundingClientRect = () => ({ left: 100, right: 300, top: 100, bottom: 300, width: 200, height: 200 })
    el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: down[0], clientY: down[1] }))
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: up[0], clientY: up[1] }))
  }

  it('clic en el fondo emite dismiss "backdrop"', () => {
    const w = mountOpen()
    backdrop(w, [10, 10], [10, 10])
    expect(w.emitted('dismiss')[0][0].reason).toBe('backdrop')
    w.unmount()
  })

  it('un clic en el relleno de la carcasa (dentro de su rectángulo) no es el fondo', () => {
    const w = mountOpen()
    backdrop(w, [105, 105], [105, 105])
    expect(w.emitted('dismiss')).toBeFalsy()
    w.unmount()
  })

  it('un arrastre que empieza dentro y termina en el fondo no cierra', () => {
    const w = mountOpen()
    backdrop(w, [150, 150], [10, 10])
    expect(w.emitted('dismiss')).toBeFalsy()
    w.unmount()
  })

  it('closeOnBackdrop=false lo desactiva; alertdialog lo ignora', () => {
    const a = mountOpen({ closeOnBackdrop: false })
    backdrop(a, [10, 10], [10, 10])
    expect(a.emitted('dismiss')).toBeFalsy()
    a.unmount()
    const b = mountOpen({ role: 'alertdialog', closeOnBackdrop: true })
    backdrop(b, [10, 10], [10, 10])
    expect(b.emitted('dismiss')).toBeFalsy()
    b.unmount()
  })
})

describe('GDialog · accesibilidad', () => {
  it('nombre con aria-labelledby (título) y descripción con aria-describedby', () => {
    const w = mountOpen({ description: 'Ayuda' })
    const d = w.find('dialog')
    expect(d.attributes('aria-labelledby')).toBe(w.find('.g-dialog__title').attributes('id'))
    expect(d.attributes('aria-describedby')).toBe(w.find('.g-dialog__description').attributes('id'))
    w.unmount()
  })

  it('sin descripción no hay aria-describedby; el rol nativo no se repite', () => {
    const w = mountOpen()
    expect(w.find('dialog').attributes('aria-describedby')).toBeUndefined()
    expect(w.find('dialog').attributes('role')).toBeUndefined()
    w.unmount()
  })

  it('alertdialog pone role="alertdialog" y no muestra botón de cierre', () => {
    const w = mountOpen({ role: 'alertdialog' })
    expect(w.find('dialog').attributes('role')).toBe('alertdialog')
    expect(w.find('.g-dialog__close').exists()).toBe(false)
    w.unmount()
  })

  it('aria-label del consumidor sustituye al título como nombre; aria-describedby se suma', () => {
    const w = mountOpen({ description: 'Ayuda' }, { attrs: { 'aria-label': 'Nombre', 'aria-describedby': 'ext' } })
    const d = w.find('dialog')
    expect(d.attributes('aria-label')).toBe('Nombre')
    expect(d.attributes('aria-labelledby')).toBeUndefined()
    expect(d.attributes('aria-describedby')).toContain('ext')
    expect(d.attributes('aria-describedby')).toContain(w.find('.g-dialog__description').attributes('id'))
    w.unmount()
  })

  it('el botón de cierre usa closeLabel, sin texto y con un x de Lucide decorativo; sin closeLabel no se renderiza', () => {
    const w = mountOpen({ closeLabel: 'Cerrar ventana' })
    const b = w.find('.g-dialog__close')
    expect(b.attributes('aria-label')).toBe('Cerrar ventana')
    expect(b.text()).toBe('')
    expect(b.element.children.length).toBe(1)
    expect(b.find('svg.g-icon').attributes('aria-hidden')).toBe('true')
    expect(b.find('svg').html()).toContain('M18 6 6 18')
    w.unmount()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const s = mountOpen({ closeLabel: undefined })
    expect(s.find('.g-dialog__close').exists()).toBe(false)
    s.unmount()
  })

  it('aria-busy con loading', () => {
    const w = mountOpen({ loading: true })
    expect(w.find('dialog').attributes('aria-busy')).toBe('true')
    w.unmount()
  })

  it('el icono es decorativo (aria-hidden)', () => {
    const w = mountOpen({}, { slots: { icon: '!' } })
    expect(w.find('.g-dialog__icon').attributes('aria-hidden')).toBe('true')
    w.unmount()
  })

  it('el slot header sustituye título y descripción y recibe los ids', () => {
    let scope
    const w = mountOpen({ title: undefined }, { slots: { header: (s) => { scope = s; return h('h2', { id: s.titleId }, 'Propio') } } })
    expect(w.find('.g-dialog__title').exists()).toBe(false)
    expect(w.find('dialog').attributes('aria-labelledby')).toBe(scope.titleId)
    w.unmount()
  })

  it('avisos de desarrollo: sin nombre y sin closeLabel', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mountOpen({ title: undefined, closeLabel: undefined }).unmount()
    const msgs = warn.mock.calls.map((c) => c[0]).join('\n')
    expect(msgs).toContain('nombre accesible')
    expect(msgs).toContain('closeLabel')
  })
})

describe('GDialog · cuerpo desplazable', () => {
  const setScroll = (w, { scrollHeight, clientHeight, scrollTop = 0 }) => {
    const el = w.find('.g-dialog__body').element
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight })
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight })
    el.scrollTop = scrollTop
    return el
  }

  it('cuando desborda: is-scrollable, tabindex 0 y región con nombre; is-scrolled en la inset', async () => {
    const w = mountOpen({}, { slots: { default: 'x' } })
    const el = setScroll(w, { scrollHeight: 500, clientHeight: 200 })
    el.dispatchEvent(new Event('scroll'))
    await nextTick()
    const body = w.find('.g-dialog__body')
    expect(body.classes()).toContain('is-scrollable')
    expect(body.attributes('tabindex')).toBe('0')
    expect(body.attributes('role')).toBe('region')
    expect(body.attributes('aria-labelledby')).toBe(w.find('.g-dialog__title').attributes('id'))
    expect(w.find('.g-dialog__inset').classes()).toContain('is-scrolled')
    w.unmount()
  })

  it('al llegar al final se apaga is-scrolled; is-scrollable sigue', async () => {
    const w = mountOpen({}, { slots: { default: 'x' } })
    const el = setScroll(w, { scrollHeight: 500, clientHeight: 200, scrollTop: 300 })
    el.dispatchEvent(new Event('scroll'))
    await nextTick()
    expect(w.find('.g-dialog__inset').classes()).not.toContain('is-scrolled')
    expect(w.find('.g-dialog__body').classes()).toContain('is-scrollable')
    w.unmount()
  })

  it('cuando cabe: sin tabindex ni role', async () => {
    const w = mountOpen({}, { slots: { default: 'x' } })
    setScroll(w, { scrollHeight: 100, clientHeight: 200 }).dispatchEvent(new Event('scroll'))
    await nextTick()
    const body = w.find('.g-dialog__body')
    expect(body.attributes('tabindex')).toBeUndefined()
    expect(body.attributes('role')).toBeUndefined()
    w.unmount()
  })

  it('sin inset, is-scrolled va en la raíz', async () => {
    const w = mountOpen({ inset: false }, { slots: { default: 'x' } })
    setScroll(w, { scrollHeight: 500, clientHeight: 200 }).dispatchEvent(new Event('scroll'))
    await nextTick()
    expect(w.find('dialog').classes()).toContain('is-scrolled')
    w.unmount()
  })
})

describe('GDialog · atributos', () => {
  it('class, style y data-* van a la raíz', () => {
    const w = mountOpen({}, { attrs: { class: 'mio', style: 'color: red', 'data-x': '1' } })
    const d = w.find('dialog')
    expect(d.classes()).toContain('mio')
    expect(d.attributes('data-x')).toBe('1')
    expect(d.attributes('style')).toContain('color')
    w.unmount()
  })

  it('id propio o generado; de él derivan título y descripción', () => {
    const w = mountOpen({ id: 'dlg', description: 'a' })
    expect(w.find('dialog').attributes('id')).toBe('dlg')
    expect(w.find('.g-dialog__title').attributes('id')).toBe('dlg-title')
    expect(w.find('.g-dialog__description').attributes('id')).toBe('dlg-desc')
    w.unmount()
    const g = mountOpen()
    expect(g.find('dialog').attributes('id')).toMatch(/^g-dialog-/)
    g.unmount()
  })
})

describe('GDialog · slot tabs (cabecera de pestañas fija, DECISIONS.md #119)', () => {
  const tabsSlot = () => h('div', { class: 'mi-cabecera' }, 'pestañas')

  it('se dibuja entre el encabezado y el cuerpo, fuera de la inset, con g-dialog__tabs', () => {
    const w = mountOpen({}, { slots: { default: 'cuerpo', tabs: tabsSlot } })
    const kids = [...w.find('dialog').element.children].map((c) => c.className.split(' ')[0])
    expect(kids).toEqual(['g-dialog__header', 'g-dialog__tabs', 'g-dialog__inset'])
    expect(w.find('.g-dialog__tabs .mi-cabecera').exists()).toBe(true)
    expect(w.find('.g-dialog__inset').element.contains(w.find('.g-dialog__tabs').element)).toBe(false)
    w.unmount()
  })

  it('sin inset: pestañas, cuerpo y pie son hijos de la carcasa, en ese orden', () => {
    const w = mountOpen({ inset: false }, { slots: { default: 'cuerpo', tabs: tabsSlot, footer: 'pie' } })
    const kids = [...w.find('dialog').element.children].map((c) => c.className.split(' ')[0])
    expect(kids).toEqual(['g-dialog__header', 'g-dialog__tabs', 'g-dialog__body', 'g-dialog__footer'])
    w.unmount()
  })

  it('sin el slot no existe g-dialog__tabs', () => {
    const w = mountOpen({}, { slots: { default: 'x' } })
    expect(w.find('.g-dialog__tabs').exists()).toBe(false)
    w.unmount()
  })

  it('con el slot, el cuerpo que desborda no es región ni tabulable (lo son los tabpanel)', async () => {
    const w = mountOpen({}, { slots: { default: 'x', tabs: tabsSlot } })
    const el = w.find('.g-dialog__body').element
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 500 })
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: 200 })
    el.dispatchEvent(new Event('scroll'))
    await nextTick()
    const body = w.find('.g-dialog__body')
    expect(body.classes()).toContain('is-scrollable')
    expect(body.attributes('tabindex')).toBeUndefined()
    expect(body.attributes('role')).toBeUndefined()
    w.unmount()
  })
})
