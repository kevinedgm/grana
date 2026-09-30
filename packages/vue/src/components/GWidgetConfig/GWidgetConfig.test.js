import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, h } from 'vue'
import GWidgetConfig from './GWidgetConfig.vue'

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const LABELS = { tabs: 'Secciones de la configuración', apply: 'Aplicar', cancel: 'Cancelar', close: 'Cerrar sin aplicar', reset: 'Restablecer', discardTitle: '¿Descartar los cambios?', keepEditing: 'Seguir editando', discard: 'Descartar', errorSummary: 'Corrige {count} campos', errorCount: '{count} errores' }
const TABS = [{ id: 'data', label: 'Datos' }, { id: 'style', label: 'Estilo' }, { id: 'set', label: 'Ajustes' }]
const slots = () => ({
  'tab-data': () => h('input', { id: 'f-goal', class: 'goal' }),
  'tab-style': () => h('input', { id: 'f-dens', class: 'dens' }),
  'tab-set': () => h('input', { id: 'f-title', class: 'title' }),
  preview: () => h('i', { class: 'pv' }, 'vista')
})
const mk = (props = {}, opts = {}) => mount(GWidgetConfig, { attachTo: document.body, props: { modelValue: true, title: 'Configurar Ingresos', tabs: TABS, labels: LABELS, ...props }, slots: slots(), ...opts })
const tab = (w, id) => w.find(`[role="tab"][id$="-t-${id}"]`)
const panel = (w, id) => w.find(`[role="tabpanel"][id$="-p-${id}"]`)
const settle = async () => { for (let i = 0; i < 4; i++) await nextTick() }
const footBtns = (w) => w.findAll('.g-dialog__footer button')
const foot = (w, text) => footBtns(w).find((b) => b.text() === text)

describe('GWidgetConfig · estructura', () => {
  it('hoja lateral de GDialog con nombre, clases y formulario sin validación nativa', () => {
    const w = mk({}, { attrs: { class: 'mi' } })
    expect(w.find('dialog').classes()).toEqual(expect.arrayContaining(['g-dialog', 'g-dialog--placement-end', 'g-widget-config', 'g-widget-config--density-default', 'mi']))
    expect(w.find('h2.g-dialog__title').text()).toBe('Configurar Ingresos')
    expect(w.find('.g-dialog__close').attributes('aria-label')).toBe('Cerrar sin aplicar')
    expect(w.find('form.g-widget-config__form').attributes('novalidate')).toBeDefined()
  })

  it('vista previa aria-hidden e inert arriba; sin slot no hay vista previa', () => {
    const w = mk()
    expect(w.find('.g-widget-config__preview').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-widget-config__preview').element.hasAttribute('inert')).toBe(true)
    expect(w.find('.pv').exists()).toBe(true)
    expect(mount(GWidgetConfig, { attachTo: document.body, props: { modelValue: true, title: 'X', labels: LABELS } }).find('.g-widget-config__preview').exists()).toBe(false)
  })

  it('región de estado dentro de la hoja', () => {
    expect(mk().find('.g-dialog .g-widget-config__sr[role="status"]').exists()).toBe(true)
  })
})

describe('GWidgetConfig · pestañas (patrón APG)', () => {
  it('tablist con nombre; pestañas con aria-selected y aria-controls; paneles con aria-labelledby y tabindex 0', () => {
    const w = mk()
    expect(w.find('[role="tablist"]').attributes('aria-label')).toBe('Secciones de la configuración')
    expect(w.findAll('[role="tab"]').map((t) => t.text())).toEqual(['Datos', 'Estilo', 'Ajustes'])
    const t = tab(w, 'data'), p = panel(w, 'data')
    expect(t.attributes('aria-selected')).toBe('true')
    expect(t.attributes('aria-controls')).toBe(p.attributes('id'))
    expect(p.attributes('aria-labelledby')).toBe(t.attributes('id'))
    expect(p.attributes('tabindex')).toBe('0')
    expect(tab(w, 'style').attributes('tabindex')).toBe('-1')
    expect(tab(w, 'data').attributes('tabindex')).toBe('0')
  })

  it('solo el panel activo se ve, pero todos permanecen montados (no se pierde el borrador)', async () => {
    const w = mk()
    expect(panel(w, 'style').attributes('hidden')).toBeDefined()
    expect(w.find('.dens').exists()).toBe(true)
    await tab(w, 'style').trigger('click')
    expect(panel(w, 'style').attributes('hidden')).toBeUndefined()
    expect(panel(w, 'data').attributes('hidden')).toBeDefined()
    expect(w.emitted('update:tab')[0]).toEqual(['style'])
  })

  it('la primera pestaña recibe el foco inicial (autofocus)', () => {
    const w = mk()
    expect(tab(w, 'data').attributes('autofocus')).toBeDefined()
    expect(tab(w, 'style').attributes('autofocus')).toBeUndefined()
  })

  it('← → Inicio Fin cambian de pestaña (cíclico) y mueven el foco', async () => {
    const w = mk()
    await tab(w, 'data').trigger('keydown', { key: 'ArrowRight' }); await settle()
    expect(tab(w, 'style').attributes('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(tab(w, 'style').element)
    await tab(w, 'style').trigger('keydown', { key: 'End' }); await settle()
    expect(tab(w, 'set').attributes('aria-selected')).toBe('true')
    await tab(w, 'set').trigger('keydown', { key: 'ArrowRight' }); await settle()
    expect(tab(w, 'data').attributes('aria-selected')).toBe('true')
    await tab(w, 'data').trigger('keydown', { key: 'ArrowLeft' }); await settle()
    expect(tab(w, 'set').attributes('aria-selected')).toBe('true')
    await tab(w, 'set').trigger('keydown', { key: 'Home' }); await settle()
    expect(tab(w, 'data').attributes('aria-selected')).toBe('true')
  })

  it('`tab` controla la pestaña activa', async () => {
    const w = mk({ tab: 'set' })
    expect(tab(w, 'set').attributes('aria-selected')).toBe('true')
    await w.setProps({ tab: 'style' })
    expect(tab(w, 'style').attributes('aria-selected')).toBe('true')
  })

  it('con una o ninguna pestaña no hay tablist y se muestra el contenido', () => {
    const one = mk({ tabs: [{ id: 'data', label: 'Datos' }] })
    expect(one.find('[role="tablist"]').exists()).toBe(false)
    expect(one.find('.goal').exists()).toBe(true)
    const none = mount(GWidgetConfig, { attachTo: document.body, props: { modelValue: true, title: 'X', labels: LABELS }, slots: { default: () => h('i', { class: 'def' }) } })
    expect(none.find('.def').exists()).toBe(true)
    expect(none.find('[role="tablist"]').exists()).toBe(false)
  })

  it('al abrir vuelve a la primera pestaña', async () => {
    const w = mk()
    await tab(w, 'set').trigger('click')
    expect(tab(w, 'set').attributes('aria-selected')).toBe('true')
    await w.setProps({ modelValue: false }); await w.setProps({ modelValue: true }); await settle()
    expect(tab(w, 'data').attributes('aria-selected')).toBe('true')
  })
})

describe('GWidgetConfig · pestaña controlada', () => {
  it('al abrir pide la primera pestaña a la aplicación (update:tab) aunque `tab` tuviera otra', async () => {
    const w = mk({ modelValue: false, tab: 'set' })
    await w.setProps({ modelValue: true }); await settle()
    expect(w.emitted('update:tab').at(-1)).toEqual(['data'])
  })
})

describe('GWidgetConfig · errores', () => {
  const ERRORS = [{ tab: 'data', field: 'f-goal', message: 'La meta debe ser mayor que 0.' }, { tab: 'set', field: 'f-title', message: 'El título es obligatorio.' }]

  it('sin errores no hay resumen ni marcas', () => {
    const w = mk()
    expect(w.find('.g-widget-config__summary').exists()).toBe(false)
    expect(w.find('.g-widget-config__mark').exists()).toBe(false)
  })

  it('con errores: resumen role=alert con el conteo y un enlace por error; marca con la cantidad en cada pestaña', () => {
    const w = mk({ errors: ERRORS })
    const s = w.find('.g-widget-config__summary')
    expect(s.attributes('role')).toBe('alert')
    expect(s.attributes('tabindex')).toBe('-1')
    expect(s.find('b').text()).toBe('Corrige 2 campos')
    expect(s.findAll('a').map((a) => a.text())).toEqual(['La meta debe ser mayor que 0.', 'El título es obligatorio.'])
    expect(tab(w, 'data').find('.g-widget-config__mark').text()).toBe('1 errores')
    expect(tab(w, 'style').find('.g-widget-config__mark').exists()).toBe(false)
    expect(tab(w, 'set').find('.g-widget-config__mark').exists()).toBe(true)
  })

  it('un enlace del resumen activa la pestaña y enfoca el campo', async () => {
    const w = mk({ errors: ERRORS })
    await w.findAll('.g-widget-config__summary a')[1].trigger('click'); await settle()
    expect(tab(w, 'set').attributes('aria-selected')).toBe('true')
    expect(document.activeElement.id).toBe('f-title')
  })

  it('el resumen recibe el foco al aplicar con errores, y no al validar en vivo', async () => {
    const w = mk()
    await w.setProps({ errors: ERRORS }); await settle()
    expect(document.activeElement).not.toBe(w.find('.g-widget-config__summary').element)
    await w.setProps({ errors: [] })
    await w.find('form').trigger('submit')
    await w.setProps({ errors: ERRORS }); await settle()
    expect(document.activeElement).toBe(w.find('.g-widget-config__summary').element)
  })

  it('al vaciar errors desaparece el resumen; los errores sin mensaje se ignoran', async () => {
    const w = mk({ errors: [...ERRORS, { tab: 'data' }] })
    expect(w.findAll('.g-widget-config__summary a')).toHaveLength(2)
    await w.setProps({ errors: [] })
    expect(w.find('.g-widget-config__summary').exists()).toBe(false)
  })

  it('al abrir con errores se muestra la pestaña del primero', async () => {
    const w = mk({ modelValue: false, errors: [{ tab: 'set', message: 'x' }] })
    await w.setProps({ modelValue: true }); await settle()
    expect(tab(w, 'set').attributes('aria-selected')).toBe('true')
  })

  it('el alcance de cada slot de pestaña trae sus errores', () => {
    let seen
    mk({ errors: ERRORS }, { slots: { 'tab-data': (s) => { seen = s; return h('i') }, 'tab-style': () => h('i'), 'tab-set': () => h('i') } })
    expect(seen.errors).toHaveLength(1)
  })
})

describe('GWidgetConfig · aplicar y restablecer', () => {
  it('Aplicar es un botón de envío asociado al formulario y emite apply sin cerrar', async () => {
    const w = mk()
    const apply = foot(w, 'Aplicar')
    expect(apply.attributes('type')).toBe('submit')
    expect(apply.attributes('form')).toBe(w.find('form').attributes('id'))
    await w.find('form').trigger('submit')
    expect(w.emitted('apply')).toHaveLength(1)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('applying: aria-busy en la hoja y Aplicar aria-disabled; no vuelve a emitir', async () => {
    const w = mk({ applying: true })
    expect(w.find('dialog').attributes('aria-busy')).toBe('true')
    expect(w.find('dialog').classes()).toContain('is-applying')
    expect(foot(w, 'Aplicar').attributes('aria-disabled')).toBe('true')
    await w.find('form').trigger('submit')
    expect(w.emitted('apply')).toBeUndefined()
  })

  it('Restablecer solo con resettable y emite reset', async () => {
    expect(foot(mk(), 'Restablecer')).toBeUndefined()
    const w = mk({ resettable: true })
    await foot(w, 'Restablecer').trigger('click')
    expect(w.emitted('reset')).toHaveLength(1)
  })

  it('el slot footer-start se añade al pie', () => {
    const w = mk({}, { slots: { ...slots(), 'footer-start': () => h('button', { class: 'extra' }, 'más') } })
    expect(w.find('.g-dialog__footer .extra').exists()).toBe(true)
  })
})

describe('GWidgetConfig · cerrar y descartar', () => {
  it('sin cambios: Cancelar, ✕ y Esc cierran directo (cancel y update:modelValue false)', async () => {
    const w = mk()
    await foot(w, 'Cancelar').trigger('click')
    expect(w.emitted('cancel')).toHaveLength(1)
    expect(w.emitted('update:modelValue').at(-1)).toEqual([false])
    await w.find('.g-dialog__close').trigger('click')
    expect(w.emitted('cancel')).toHaveLength(2)
    await w.find('dialog').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('cancel')).toHaveLength(3)
  })

  it('con cambios: pide confirmación en el pie y no cierra', async () => {
    const w = mk({ dirty: true })
    await foot(w, 'Cancelar').trigger('click'); await settle()
    const c = w.find('.g-widget-config__confirm')
    expect(c.exists()).toBe(true)
    expect(c.attributes('role')).toBe('alert')
    expect(c.text()).toContain('¿Descartar los cambios?')
    expect(footBtns(w).map((b) => b.text())).toEqual(['Seguir editando', 'Descartar'])
    expect(document.activeElement.textContent).toBe('Seguir editando')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('cancel')).toBeUndefined()
  })

  it('Esc y ✕ con cambios también piden confirmación (sin cerrar)', async () => {
    const w = mk({ dirty: true })
    await w.find('dialog').trigger('keydown', { key: 'Escape' }); await settle()
    expect(w.find('.g-widget-config__confirm').exists()).toBe(true)
    expect(w.emitted('update:modelValue')).toBeUndefined()
    const x = mk({ dirty: true })
    await x.find('.g-dialog__close').trigger('click'); await settle()
    expect(x.find('.g-widget-config__confirm').exists()).toBe(true)
  })

  it('«Seguir editando» vuelve a Cancelar/Aplicar con el foco en Cancelar', async () => {
    const w = mk({ dirty: true })
    await foot(w, 'Cancelar').trigger('click'); await settle()
    await foot(w, 'Seguir editando').trigger('click'); await settle()
    expect(w.find('.g-widget-config__confirm').exists()).toBe(false)
    expect(document.activeElement.textContent).toBe('Cancelar')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('«Descartar» cierra (cancel y update:modelValue false)', async () => {
    const w = mk({ dirty: true })
    await foot(w, 'Cancelar').trigger('click'); await settle()
    await foot(w, 'Descartar').trigger('click')
    expect(w.emitted('cancel')).toHaveLength(1)
    expect(w.emitted('update:modelValue').at(-1)).toEqual([false])
    expect(w.find('.g-widget-config__confirm').exists()).toBe(false)
  })

  it('la confirmación se reinicia al abrir de nuevo', async () => {
    const w = mk({ dirty: true })
    await foot(w, 'Cancelar').trigger('click'); await settle()
    await w.setProps({ modelValue: false }); await w.setProps({ modelValue: true }); await settle()
    expect(w.find('.g-widget-config__confirm').exists()).toBe(false)
  })
})

describe('GWidgetConfig · anuncios, avisos y validadores', () => {
  it('announce() escribe en la región de la hoja', async () => {
    const w = mk()
    w.vm.announce('Listo')
    await settle()
    expect(w.find('.g-widget-config__sr[aria-live="polite"]').text()).toBe('Listo')
  })

  it('avisa sin title, sin los textos requeridos, sin labels.tabs y resettable sin labels.reset', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GWidgetConfig, { props: { modelValue: false, tabs: TABS, resettable: true } })
    const msgs = warn.mock.calls.map((c) => String(c[0]))
    expect(msgs.some((m) => m.includes('necesita `title`'))).toBe(true)
    for (const k of ['apply', 'cancel', 'close', 'tabs', 'reset']) expect(msgs.some((m) => m.includes(`labels.${k}`))).toBe(true)
  })

  it('validadores de size y density', () => {
    expect(GWidgetConfig.props.size.validator('xl')).toBe(false)
    expect(GWidgetConfig.props.density.validator('dense')).toBe(false)
  })
})
