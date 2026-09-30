import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, h } from 'vue'
import GHelper from './GHelper.vue'

// jsdom no implementa <dialog> modal ni la API popover: se simulan con el mismo contrato.
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
  const matches = Element.prototype.matches
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (sel) {
    if (sel === ':popover-open') return this.hasAttribute('data-popover-open')
    return matches.call(this, sel)
  })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.innerHTML = '' })

const base = { ariaLabel: 'Abrir ayuda', contentLabel: 'Ayuda del formulario', closeLabel: 'Cerrar' }
const mk = (props = {}, opts = {}) => mount(GHelper, {
  attachTo: document.body,
  props: { ...base, ...props },
  slots: { content: ({ close }) => [h('p', 'Puedo ayudarte.'), h('button', { class: 'accion', onClick: close }, 'Explicar')] },
  ...opts
})
const btn = (w) => w.find('button.g-helper__trigger')
const flush = async () => { await nextTick(); await nextTick(); await nextTick() }

describe('GHelper · render y clases', () => {
  it('inline por defecto: un <button> con el icono por defecto y sin clases de float', () => {
    const w = mk()
    expect(w.classes()).toEqual(['g-helper', 'g-helper--inline'])
    expect(btn(w).classes()).toContain('g-helper__trigger--default')
    expect(btn(w).find('svg.g-icon').exists()).toBe(true)
    expect(btn(w).attributes('type')).toBe('button')
    w.unmount()
  })

  it('float emite lado, alineación y attach; offset como variable en línea', () => {
    const w = mk({ mode: 'float', placement: 'top-end', attach: 'edge', offset: 3 })
    expect(w.classes()).toEqual(expect.arrayContaining(['g-helper--float', 'g-helper--side-top', 'g-helper--align-end', 'g-helper--attach-edge']))
    expect(w.attributes('style')).toContain('--_offset: 3')
    const c = mk({ mode: 'float', placement: 'left' })
    expect(c.classes()).toEqual(expect.arrayContaining(['g-helper--side-left', 'g-helper--align-center']))
    w.unmount(); c.unmount()
  })

  it('slot trigger va dentro del botón, con { open }', async () => {
    const w = mk({}, { slots: { trigger: ({ open }) => h('span', { class: 'avatar' }, open ? 'abierto' : 'cerrado'), content: () => 'x' } })
    expect(btn(w).classes()).toContain('g-helper__trigger--custom')
    expect(btn(w).find('.avatar').text()).toBe('cerrado')
    await btn(w).trigger('click'); await flush()
    expect(btn(w).find('.avatar').text()).toBe('abierto')
    w.unmount()
  })
})

describe('GHelper · accesibilidad', () => {
  it('botón con aria-label, aria-expanded, aria-controls y aria-haspopup', () => {
    const w = mk({ id: 'h1' })
    const b = btn(w)
    expect(b.attributes()).toMatchObject({ 'aria-label': 'Abrir ayuda', 'aria-expanded': 'false', 'aria-controls': 'h1-content', 'aria-haspopup': 'dialog' })
    const c = w.find('#h1-content')
    expect(c.attributes()).toMatchObject({ role: 'dialog', 'aria-label': 'Ayuda del formulario', popover: 'manual', tabindex: '-1' })
    w.unmount()
  })

  it('el contenido va justo después del botón en el DOM', () => {
    const w = mk()
    expect(btn(w).element.nextElementSibling.classList.contains('g-helper__content')).toBe(true)
    w.unmount()
  })

  it('avisa sin ariaLabel (disparador por defecto), sin contentLabel y sin closeLabel con adaptive', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({ ariaLabel: undefined, contentLabel: undefined, closeLabel: undefined }).unmount()
    const msgs = warn.mock.calls.map((c) => c[0]).join('\n')
    expect(msgs).toMatch(/ariaLabel/)
    expect(msgs).toMatch(/contentLabel/)
    expect(msgs).toMatch(/closeLabel/)
  })

  it('con slot trigger no exige ariaLabel', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({ ariaLabel: undefined }, { slots: { trigger: () => 'Ayuda', content: () => 'x' } }).unmount()
    expect(warn.mock.calls.some((c) => /ariaLabel/.test(c[0]))).toBe(false)
  })
})

describe('GHelper · abrir y cerrar', () => {
  it('clic abre: aria-expanded, is-open, popover visible, contenido montado y toggle', async () => {
    const w = mk()
    await btn(w).trigger('click'); await flush()
    expect(btn(w).attributes('aria-expanded')).toBe('true')
    expect(w.classes()).toContain('is-open')
    const c = w.find('.g-helper__content')
    expect(c.attributes('data-popover-open')).toBeDefined()
    expect(c.text()).toContain('Puedo ayudarte')
    expect(w.emitted('update:open')[0]).toEqual([true])
    expect(w.emitted('toggle')[0][0]).toEqual({ open: true, presentation: 'popover' })
    w.unmount()
  })

  it('el contenido no se monta mientras está cerrado', () => {
    const w = mk()
    expect(w.find('.g-helper__content').text()).toBe('')
    w.unmount()
  })

  it('segundo clic cierra', async () => {
    const w = mk()
    await btn(w).trigger('click'); await flush()
    await btn(w).trigger('click'); await flush()
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    expect(w.find('.g-helper__content').attributes('data-popover-open')).toBeUndefined()
    expect(w.emitted('toggle')[1][0]).toEqual({ open: false, presentation: 'popover' })
    w.unmount()
  })

  it('Esc cierra y devuelve el foco al disparador', async () => {
    const w = mk()
    await btn(w).trigger('click'); await flush()
    w.find('.accion').element.focus()
    await w.find('.accion').trigger('keydown', { key: 'Escape' }); await flush()
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(btn(w).element)
    w.unmount()
  })

  it('clic fuera cierra; dentro no', async () => {
    const w = mk()
    await btn(w).trigger('click'); await flush()
    w.find('.g-helper__content p').element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flush()
    expect(btn(w).attributes('aria-expanded')).toBe('true')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })); await flush()
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    w.unmount()
  })

  it('el foco que sale del disparador y del contenido cierra', async () => {
    const outside = document.createElement('button'); document.body.appendChild(outside)
    const w = mk()
    await btn(w).trigger('click'); await flush()
    btn(w).element.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: w.find('.accion').element }))
    await flush()
    expect(btn(w).attributes('aria-expanded')).toBe('true')
    btn(w).element.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }))
    await flush()
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    w.unmount()
  })

  it('close() del slot cierra y devuelve el foco', async () => {
    const w = mk()
    await btn(w).trigger('click'); await flush()
    await w.find('.accion').trigger('click'); await flush()
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(btn(w).element)
    w.unmount()
  })

  it('un solo helper abierto a la vez', async () => {
    const a = mk(); const b = mk()
    await btn(a).trigger('click'); await flush()
    await btn(b).trigger('click'); await flush()
    expect(btn(a).attributes('aria-expanded')).toBe('false')
    expect(btn(b).attributes('aria-expanded')).toBe('true')
    a.unmount(); b.unmount()
  })

  it('disabled: botón deshabilitado, no abre, y cierra si estaba abierto', async () => {
    const w = mk()
    await btn(w).trigger('click'); await flush()
    await w.setProps({ disabled: true }); await flush()
    expect(btn(w).attributes('disabled')).toBeDefined()
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    expect(w.classes()).toContain('is-disabled')
    w.unmount()
  })
})

describe('GHelper · controlado (v-model:open)', () => {
  it('no cambia por su cuenta: emite update:open', async () => {
    const w = mk({ open: false })
    await btn(w).trigger('click'); await flush()
    expect(w.emitted('update:open')[0]).toEqual([true])
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    await w.setProps({ open: true }); await flush()
    expect(btn(w).attributes('aria-expanded')).toBe('true')
    expect(w.find('.g-helper__content').text()).toContain('Puedo ayudarte')
    w.unmount()
  })
})

describe('GHelper · posición y adaptación', () => {
  it('coloca el popover con --_x, --_y, --_max y data-side', async () => {
    const w = mk({ contentPlacement: 'bottom-end' })
    await btn(w).trigger('click'); await flush()
    const c = w.find('.g-helper__content')
    expect(c.attributes('style')).toMatch(/--_x: .*px/)
    expect(c.attributes('style')).toMatch(/--_max/)
    expect(c.attributes('data-side')).toBe('bottom')
    w.unmount()
  })

  it('visor por debajo del umbral de hoja (space × 130 = 520px): se abre en la hoja (GDialog)', async () => {
    vi.stubGlobal('innerWidth', 360)
    const w = mk({ id: 'h2' }, { attrs: { style: '--g-space-1: 4px' } })
    await btn(w).trigger('click'); await flush()
    const dlg = w.find('dialog')
    expect(dlg.attributes('open')).toBeDefined()
    expect(dlg.attributes('id')).toBe('h2-sheet')
    expect(btn(w).attributes('aria-controls')).toBe('h2-sheet')
    expect(dlg.text()).toContain('Puedo ayudarte')
    expect(dlg.text()).toContain('Ayuda del formulario') // título de la hoja
    expect(w.find('.g-helper__content').text()).toBe('')
    expect(w.emitted('toggle')[0][0]).toEqual({ open: true, presentation: 'sheet' })
    w.unmount()
  })

  it('cerrar la hoja cierra el helper', async () => {
    vi.stubGlobal('innerWidth', 320)
    const w = mk({}, { attrs: { style: '--g-space-1: 4px' } })
    await btn(w).trigger('click'); await flush()
    await w.find('.g-dialog__close').trigger('click'); await flush()
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    w.unmount()
  })

  it('adaptive=false: siempre popover y sin GDialog', async () => {
    vi.stubGlobal('innerWidth', 320)
    const w = mk({ adaptive: false }, { attrs: { style: '--g-space-1: 4px' } })
    await btn(w).trigger('click'); await flush()
    expect(w.find('dialog').exists()).toBe(false)
    expect(w.find('.g-helper__content').text()).toContain('Puedo ayudarte')
    w.unmount()
  })
})

describe('GHelper · umbral de hoja', () => {
  it('a 520px o más, popover', async () => {
    vi.stubGlobal('innerWidth', 520)
    const w = mk({}, { attrs: { style: '--g-space-1: 4px' } })
    await btn(w).trigger('click'); await flush()
    expect(w.emitted('toggle')[0][0].presentation).toBe('popover')
    w.unmount()
  })
  it('con space 5 el umbral sube a 650px', async () => {
    vi.stubGlobal('innerWidth', 600)
    const w = mk({}, { attrs: { style: '--g-space-1: 5px' } })
    await btn(w).trigger('click'); await flush()
    expect(w.emitted('toggle')[0][0].presentation).toBe('sheet')
    w.unmount()
  })
})

describe('GHelper · slots de contenido', () => {
  it('default es alias de content (content gana)', async () => {
    const a = mount(GHelper, { attachTo: document.body, props: base, slots: { default: () => 'por defecto' } })
    await btn(a).trigger('click'); await flush()
    expect(a.find('.g-helper__content').text()).toBe('por defecto')
    const b = mount(GHelper, { attachTo: document.body, props: base, slots: { default: () => 'por defecto', content: () => 'contenido' } })
    await btn(b).trigger('click'); await flush()
    expect(b.find('.g-helper__content').text()).toBe('contenido')
    a.unmount(); b.unmount()
  })
})

describe('GHelper · validadores', () => {
  it('rechazan valores fuera de la lista', () => {
    const v = (n) => GHelper.props[n].validator
    expect(v('mode')('fixed')).toBe(false)
    expect(v('placement')('top-end')).toBe(true)
    expect(v('placement')('center')).toBe(false)
    expect(v('attach')('edge')).toBe(true)
    expect(v('offset')(-1)).toBe(false)
    expect(v('offset')(0)).toBe(true)
  })
})
