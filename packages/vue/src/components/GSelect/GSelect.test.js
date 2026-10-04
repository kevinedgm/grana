import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import GSelect from './GSelect.vue'

// jsdom no implementa popover: se simula (showPopover/hidePopover y :popover-open).
beforeEach(() => {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
  const orig = HTMLElement.prototype.matches
  HTMLElement.prototype.matches = function (sel) { return sel === ':popover-open' ? this.hasAttribute('data-popover-open') : orig.call(this, sel) }
  HTMLElement.prototype.scrollIntoView = function () {}
})
afterEach(() => vi.restoreAllMocks())

const OPTIONS = [
  { value: 'mx', label: 'México' },
  { value: 'us', label: 'Estados Unidos' },
  { value: 'de', label: 'Alemania', disabled: true },
  { label: 'Sudamérica', options: [{ value: 'ar', label: 'Argentina' }, { value: 'cl', label: 'Chile' }] },
  { value: 'es', label: 'España' }
]
const base = { label: 'País', options: OPTIONS, placeholder: 'Elige' }
const mk = (props = {}, opts = {}) => mount(GSelect, { attachTo: document.body, props: { ...base, ...props }, ...opts })
const btn = (w) => w.find('button.g-select__button')
const opts = (w) => w.findAll('[role="option"]')
const key = async (w, k, extra = {}) => { await btn(w).trigger('keydown', { key: k, ...extra }); await nextTick() }
const activeText = (w) => {
  const id = btn(w).attributes('aria-activedescendant')
  return id ? document.getElementById(id)?.textContent : null
}

describe('GSelect · render y clases', () => {
  it('renderiza un <button role="combobox"> y una lista role="listbox" con popover', () => {
    const w = mk()
    expect(btn(w).attributes('role')).toBe('combobox')
    expect(btn(w).attributes('aria-haspopup')).toBe('listbox')
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    const list = w.find('ul.g-select__list')
    expect(list.attributes('role')).toBe('listbox')
    expect(list.attributes('popover')).toBe('manual')
    expect(btn(w).attributes('aria-controls')).toBe(list.attributes('id'))
    w.unmount()
  })

  it('clases por defecto y siguen a las props', () => {
    const w = mk({ variant: 'soft', size: 'lg', density: 'compact', color: 'accent', rounded: 'lg', block: true, disabled: true, readonly: true, loading: true, error: 'Mal' })
    expect(w.find('.g-select').classes()).toEqual(expect.arrayContaining([
      'g-select--variant-soft', 'g-select--size-lg', 'g-select--density-compact', 'g-select--color-accent', 'g-select--rounded-lg', 'g-select--block', 'is-disabled', 'is-readonly', 'is-loading', 'is-invalid'
    ]))
    w.unmount()
    const d = mk().find('.g-select').classes().join(' ')
    expect(d).toContain('g-select--variant-outline')
    expect(d).not.toContain('--color-')
  })

  it('cada prop enumerada tiene validador; `solid` no es variante válida', () => {
    for (const n of ['variant', 'size', 'density', 'color', 'rounded']) expect(GSelect.props[n].validator('valor-invalido')).toBe(false)
    expect(GSelect.props.variant.validator('solid')).toBe(false)
  })

  it('las opciones se pintan con grupos; el encabezado no es una opción', () => {
    const w = mk()
    expect(opts(w).map((o) => o.text())).toEqual(['México', 'Estados Unidos', 'Alemania', 'Argentina', 'Chile', 'España'])
    const grp = w.find('[role="group"]')
    expect(grp.exists()).toBe(true)
    expect(document.getElementById(grp.attributes('aria-labelledby')).textContent).toBe('Sudamérica')
    expect(opts(w)[2].attributes('aria-disabled')).toBe('true')
    w.unmount()
  })

  it('genera ids estables: botón, etiqueta, lista y opciones', () => {
    const w = mk({ id: 's' })
    expect(btn(w).attributes('id')).toBe('s')
    expect(w.find('.g-select__label').attributes('id')).toBe('s-label')
    expect(w.find('.g-select__label').attributes('for')).toBe('s')
    expect(w.find('.g-select__list').attributes('id')).toBe('s-list')
    expect(opts(w)[0].attributes('id')).toBe('s-opt-0')
    expect(btn(mk()).attributes('id')).toMatch(/^g-select-/)
    w.unmount()
  })

  it('opciones inválidas se ignoran y los value duplicados avisan', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ options: [{ value: 'a', label: 'A' }, { value: 'a', label: 'A2' }, { label: 'Sin valor' }, { value: 'c' }] })
    expect(opts(w).map((o) => o.text())).toEqual(['A', 'A2'])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('mismo value'))
    w.unmount()
  })
})

describe('GSelect · valor mostrado', () => {
  it('sin valor muestra el placeholder; con valor, la etiqueta de la opción', async () => {
    const w = mk()
    expect(w.find('.g-select__value').text()).toBe('Elige')
    expect(w.find('.g-select__value').classes()).toContain('g-select__value--placeholder')
    await w.setProps({ modelValue: 'us' })
    expect(w.find('.g-select__value').text()).toBe('Estados Unidos')
    expect(w.find('.g-select__value').classes()).not.toContain('g-select__value--placeholder')
    expect(opts(w)[1].attributes('aria-selected')).toBe('true')
    expect(opts(w)[0].attributes('aria-selected')).toBe('false')
    w.unmount()
  })

  it('un valor sin opción correspondiente, null o Number se tratan bien', async () => {
    const w = mk({ options: [{ value: 1, label: 'Uno' }, { value: 2, label: 'Dos' }], modelValue: 2 })
    expect(w.find('.g-select__value').text()).toBe('Dos')
    await w.setProps({ modelValue: 99 })
    expect(w.find('.g-select__value').text()).toBe('Elige')
    await w.setProps({ modelValue: null })
    expect(w.find('.g-select__value').text()).toBe('Elige')
    w.unmount()
  })

  it('el nombre accesible es etiqueta + valor mostrado (aria-labelledby: etiqueta y el propio botón)', () => {
    const w = mk({ id: 's' })
    expect(btn(w).attributes('aria-labelledby')).toBe('s-label s')
    w.unmount()
  })

  it('name crea un <input type="hidden"> con el valor (o vacío)', async () => {
    const w = mk({ name: 'pais', modelValue: 'mx' })
    const h = w.find('input[type="hidden"]')
    expect(h.attributes('name')).toBe('pais')
    expect(h.element.value).toBe('mx')
    await w.setProps({ modelValue: null })
    expect(w.find('input[type="hidden"]').element.value).toBe('')
    expect(mk().find('input[type="hidden"]').exists()).toBe(false)
    w.unmount()
  })

  it('los slots value y option reciben el alcance', async () => {
    const w = mk({ modelValue: 'mx' }, { slots: { value: '<template #value="{ option }"><b class="v">{{ option.label }}!</b></template>', option: '<template #option="{ option, selected, active }"><i class="o">{{ option.label }}|{{ selected }}|{{ active }}</i></template>' } })
    expect(w.find('.v').text()).toBe('México!')
    expect(w.findAll('.o')[0].text()).toBe('México|true|false')
    w.unmount()
  })
})

describe('GSelect · abrir, elegir y cerrar', () => {
  it('clic abre (aria-expanded, is-open, showPopover, evento open) y otro clic cierra (close)', async () => {
    const w = mk()
    await btn(w).trigger('click')
    await nextTick()
    expect(btn(w).attributes('aria-expanded')).toBe('true')
    expect(w.find('.g-select').classes()).toContain('is-open')
    expect(w.find('.g-select__list').attributes('data-popover-open')).toBeDefined()
    expect(w.emitted('open')).toHaveLength(1)
    await btn(w).trigger('click')
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    expect(w.emitted('close')).toHaveLength(1)
    expect(w.find('.g-select__list').attributes('data-popover-open')).toBeUndefined()
    w.unmount()
  })

  it('al abrir, la activa es la elegida o la primera habilitada; el foco no sale del botón', async () => {
    const w = mk({ modelValue: 'ar' })
    btn(w).element.focus()
    await btn(w).trigger('click')
    await nextTick()
    expect(activeText(w)).toBe('Argentina')
    expect(document.activeElement).toBe(btn(w).element)
    w.unmount()
    const v = mk()
    await btn(v).trigger('click')
    await nextTick()
    expect(activeText(v)).toBe('México')
    v.unmount()
  })

  it('clic en una opción la elige, cierra y emite; en la ya elegida no emite', async () => {
    const w = mk({ modelValue: 'mx' })
    await btn(w).trigger('click')
    await opts(w)[1].trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['us']])
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    await btn(w).trigger('click')
    await opts(w)[0].trigger('click')
    expect(w.emitted('update:modelValue')).toHaveLength(1)
    w.unmount()
  })

  it('una opción deshabilitada no se elige y no cierra', async () => {
    const w = mk()
    await btn(w).trigger('click')
    await opts(w)[2].trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(btn(w).attributes('aria-expanded')).toBe('true')
    w.unmount()
  })

  it('es controlado: sin actualizar el prop, el valor mostrado no cambia', async () => {
    const w = mk({ modelValue: 'mx' })
    await btn(w).trigger('click')
    await opts(w)[1].trigger('click')
    expect(w.find('.g-select__value').text()).toBe('México')
    w.unmount()
  })

  it('un pointerdown fuera cierra sin cambiar; uno dentro de la lista no', async () => {
    const w = mk({ modelValue: 'mx' })
    await btn(w).trigger('click')
    await opts(w)[1].trigger('pointerdown')
    expect(btn(w).attributes('aria-expanded')).toBe('true')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    w.unmount()
  })

  it('el pointerdown en la lista se cancela (el foco no sale del botón)', async () => {
    const w = mk()
    await btn(w).trigger('click')
    const e = new Event('pointerdown', { bubbles: true, cancelable: true })
    w.find('.g-select__list').element.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
    w.unmount()
  })

  it('el movimiento del puntero sobre una opción la vuelve activa (no las deshabilitadas)', async () => {
    const w = mk()
    await btn(w).trigger('click')
    await opts(w)[1].trigger('pointermove')
    expect(activeText(w)).toBe('Estados Unidos')
    await opts(w)[2].trigger('pointermove')
    expect(activeText(w)).toBe('Estados Unidos')
    w.unmount()
  })
})

describe('GSelect · teclado', () => {
  it('cerrada: Enter, Espacio, ↓ y ↑ abren', async () => {
    for (const k of ['Enter', ' ', 'ArrowDown', 'ArrowUp']) {
      const w = mk()
      await key(w, k)
      expect(btn(w).attributes('aria-expanded')).toBe('true')
      w.unmount()
    }
  })

  it('abierta: ↓ ↑ saltan las deshabilitadas y los encabezados, y no ciclan', async () => {
    const w = mk()
    await key(w, 'ArrowDown') // abre: México
    expect(activeText(w)).toBe('México')
    await key(w, 'ArrowDown'); expect(activeText(w)).toBe('Estados Unidos')
    await key(w, 'ArrowDown'); expect(activeText(w)).toBe('Argentina') // salta Alemania
    await key(w, 'ArrowDown'); await key(w, 'ArrowDown'); expect(activeText(w)).toBe('España')
    await key(w, 'ArrowDown'); expect(activeText(w)).toBe('España') // no cicla
    await key(w, 'ArrowUp'); expect(activeText(w)).toBe('Chile')
    w.unmount()
  })

  it('Inicio, Fin, Re Pág y Av Pág', async () => {
    const w = mk()
    await key(w, 'ArrowDown')
    await key(w, 'End'); expect(activeText(w)).toBe('España')
    await key(w, 'Home'); expect(activeText(w)).toBe('México')
    await key(w, 'PageDown'); expect(activeText(w)).toBe('España')
    await key(w, 'PageUp'); expect(activeText(w)).toBe('México')
    w.unmount()
  })

  it('Enter elige la activa, cierra y emite; el foco sigue en el botón', async () => {
    const w = mk()
    btn(w).element.focus()
    await key(w, 'ArrowDown'); await key(w, 'ArrowDown')
    await key(w, 'Enter')
    expect(w.emitted('update:modelValue')).toEqual([['us']])
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(btn(w).element)
    w.unmount()
  })

  it('Espacio elige con la lista abierta', async () => {
    const w = mk()
    await key(w, 'ArrowDown'); await key(w, 'ArrowDown')
    await key(w, ' ')
    expect(w.emitted('update:modelValue')).toEqual([['us']])
    w.unmount()
  })

  it('Esc cierra sin cambiar y el foco sigue en el botón', async () => {
    const w = mk({ modelValue: 'mx' })
    btn(w).element.focus()
    await key(w, 'ArrowDown'); await key(w, 'ArrowDown')
    await key(w, 'Escape')
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(document.activeElement).toBe(btn(w).element)
    w.unmount()
  })

  it('Esc con la lista abierta NO se propaga (un GDialog contenedor no debe cerrarse); cerrada, sí', async () => {
    const parent = vi.fn()
    const w = mount({ components: { GSelect }, template: '<div @keydown="parent"><g-select label="x" :options="o"></g-select></div>', data: () => ({ o: OPTIONS }), methods: { parent } }, { attachTo: document.body })
    const b = w.find('button.g-select__button')
    await b.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    parent.mockClear()
    await b.trigger('keydown', { key: 'Escape' })
    expect(parent).not.toHaveBeenCalled()
    expect(b.attributes('aria-expanded')).toBe('false')
    await b.trigger('keydown', { key: 'Escape' })
    expect(parent).toHaveBeenCalledTimes(1)
    w.unmount()
  })

  it('Tab elige la activa y cierra (sin cancelar el Tab)', async () => {
    const w = mk({ modelValue: 'mx' })
    await key(w, 'ArrowDown'); await key(w, 'ArrowDown')
    const ev = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    btn(w).element.dispatchEvent(ev)
    await nextTick()
    expect(ev.defaultPrevented).toBe(false)
    expect(w.emitted('update:modelValue')).toEqual([['us']])
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    w.unmount()
  })

  it('typeahead: una letra abre y activa la siguiente coincidencia; varias forman el prefijo', async () => {
    vi.useFakeTimers()
    const w = mk()
    await key(w, 'e') // abre y busca "e" desde la siguiente a la activa
    await vi.advanceTimersByTimeAsync(0)
    expect(btn(w).attributes('aria-expanded')).toBe('true')
    expect(activeText(w)).toBe('Estados Unidos')
    await key(w, 's'); expect(activeText(w)).toBe('Estados Unidos') // "es": la primera con ese prefijo desde la activa
    await key(w, 'p'); expect(activeText(w)).toBe('España')
    await vi.advanceTimersByTimeAsync(600) // el prefijo caduca
    await key(w, 'c'); expect(activeText(w)).toBe('Chile')
    vi.useRealTimers()
    w.unmount()
  })

  it('con readonly o disabled el teclado no abre', async () => {
    const r = mk({ readonly: true })
    await key(r, 'ArrowDown')
    expect(btn(r).attributes('aria-expanded')).toBe('false')
    r.unmount()
    const d = mk({ disabled: true })
    await btn(d).trigger('click')
    expect(btn(d).attributes('aria-expanded')).toBe('false')
    d.unmount()
  })

  it('Alt+↓ abre', async () => {
    const w = mk()
    await key(w, 'ArrowDown', { altKey: true })
    expect(btn(w).attributes('aria-expanded')).toBe('true')
    w.unmount()
  })
})

describe('GSelect · estados', () => {
  it('readonly: aria-readonly, enfocable (sin disabled) y clic no abre', async () => {
    const w = mk({ readonly: true, modelValue: 'mx' })
    expect(btn(w).attributes('aria-readonly')).toBe('true')
    expect(btn(w).attributes('disabled')).toBeUndefined()
    await btn(w).trigger('click')
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    w.unmount()
  })

  it('disabled usa el atributo nativo; required pone aria-required y la marca aria-hidden', () => {
    const w = mk({ disabled: true, required: true })
    expect(btn(w).attributes('disabled')).toBeDefined()
    expect(btn(w).attributes('aria-required')).toBe('true')
    expect(w.find('.g-select__required').attributes('aria-hidden')).toBe('true')
    w.unmount()
  })

  it('loading: aria-busy, anillo y NO bloquea', async () => {
    const w = mk({ loading: true })
    expect(btn(w).attributes('aria-busy')).toBe('true')
    expect(w.find('.g-select__loader').exists()).toBe(true)
    await btn(w).trigger('click')
    expect(btn(w).attributes('aria-expanded')).toBe('true')
    w.unmount()
  })

  it('sin error: región viva vacía y sin aria-invalid; con error: aria-invalid, describedby y texto', () => {
    const w = mk({ id: 's' })
    expect(w.find('.g-select__message').attributes('aria-live')).toBe('polite')
    expect(w.find('.g-select__message').text()).toBe('')
    expect(btn(w).attributes('aria-invalid')).toBeUndefined()
    w.unmount()
    const e = mk({ id: 's', error: 'Elige una opción', hint: 'Ayuda' })
    expect(btn(e).attributes('aria-invalid')).toBe('true')
    expect(btn(e).attributes('aria-describedby')).toBe('s-hint s-message')
    expect(e.find('.g-select__message').text()).toBe('Elige una opción')
    e.unmount()
  })

  it('respeta un aria-describedby del consumidor', () => {
    const w = mk({ id: 's', hint: 'a' }, { attrs: { 'aria-describedby': 'ext' } })
    expect(btn(w).attributes('aria-describedby')).toBe('ext s-hint')
    w.unmount()
  })

  it('lista vacía: mensaje con emptyText o slot empty; sin ellos, nada', () => {
    const a = mk({ options: [], emptyText: 'Sin opciones' })
    expect(a.find('.g-select__empty').text()).toBe('Sin opciones')
    a.unmount()
    expect(mk({ options: [] }).find('.g-select__empty').exists()).toBe(false)
    const b = mk({ options: [] }, { slots: { empty: '<b class="e">Nada</b>' } })
    expect(b.find('.e').exists()).toBe(true)
    b.unmount()
  })

  it('los slots label, hint y error sustituyen a las props', () => {
    const w = mk({ error: 'x' }, { slots: { label: '<b id="lb">Rico</b>', hint: '<i>Ayuda</i>', error: '<u>Falla</u>' } })
    expect(w.find('#lb').exists()).toBe(true)
    expect(w.find('.g-select__hint i').exists()).toBe(true)
    expect(w.find('.g-select__message u').exists()).toBe(true)
    w.unmount()
  })
})

describe('GSelect · limpiar', () => {
  it('con clearable, clearLabel y valor: botón con nombre; borra (null) y devuelve el foco', async () => {
    const w = mk({ clearable: true, clearLabel: 'Limpiar país', modelValue: 'mx' })
    const c = w.find('.g-select__clear')
    expect(c.attributes('aria-label')).toBe('Limpiar país')
    await c.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[null]])
    expect(document.activeElement).toBe(btn(w).element)
    w.unmount()
  })

  it('no se muestra sin valor, sin clearLabel, ni con readonly o disabled; sin clearLabel avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(mk({ clearable: true, clearLabel: 'x' }).find('.g-select__clear').exists()).toBe(false)
    expect(mk({ clearable: true, modelValue: 'mx' }).find('.g-select__clear').exists()).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('clearLabel'))
    expect(mk({ clearable: true, clearLabel: 'x', modelValue: 'mx', readonly: true }).find('.g-select__clear').exists()).toBe(false)
    expect(mk({ clearable: true, clearLabel: 'x', modelValue: 'mx', disabled: true }).find('.g-select__clear').exists()).toBe(false)
  })
})

describe('GSelect · posición', () => {
  it('al abrir pone las variables CSS de posición sobre la lista (hacia abajo por defecto)', async () => {
    const w = mk()
    const box = w.find('.g-select__control').element
    box.getBoundingClientRect = () => ({ left: 40, right: 280, top: 100, bottom: 136, width: 240, height: 36 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    await btn(w).trigger('click')
    await nextTick(); await nextTick()
    const s = w.find('.g-select__list').element.style
    expect(s.getPropertyValue('--_x')).toBe('40px')
    expect(s.getPropertyValue('--_min')).toBe('240px')
    expect(s.getPropertyValue('--_top')).toBe('140px')
    expect(s.getPropertyValue('--_bottom')).toBe('auto')
    expect(w.find('.g-select__list').classes()).not.toContain('is-up')
    w.unmount()
  })

  it('si no cabe debajo y hay más sitio arriba, se abre hacia arriba (is-up)', async () => {
    const w = mk()
    const list = w.find('.g-select__list').element
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 300 })
    w.find('.g-select__control').element.getBoundingClientRect = () => ({ left: 10, right: 250, top: 700, bottom: 736, width: 240, height: 36 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 760 })
    await btn(w).trigger('click')
    await nextTick(); await nextTick()
    expect(w.find('.g-select__list').classes()).toContain('is-up')
    expect(list.style.getPropertyValue('--_top')).toBe('auto')
    expect(list.style.getPropertyValue('--_bottom')).toBe('64px')
    w.unmount()
  })
})

describe('GSelect · nombre accesible y atributos', () => {
  it('sin label conserva el aria-label del consumidor; avisa sin nombre', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GSelect, { props: { options: OPTIONS } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('nombre accesible'))
    warn.mockClear()
    const w = mount(GSelect, { props: { options: OPTIONS }, attrs: { 'aria-label': 'País' } })
    expect(w.find('button').attributes('aria-label')).toBe('País')
    expect(w.find('.g-select__list').attributes('aria-label')).toBe('País')
    expect(warn).not.toHaveBeenCalled()
  })

  it('class y style van a la raíz; el resto de atributos y las escuchas, al botón', async () => {
    const onFocus = vi.fn()
    const w = mk({}, { attrs: { class: 'mio', style: 'color: red', 'data-x': '1', onFocus } })
    expect(w.find('.g-select').classes()).toContain('mio')
    expect(btn(w).attributes('data-x')).toBe('1')
    expect(w.find('.g-select').attributes('data-x')).toBeUndefined()
    await btn(w).trigger('focus')
    expect(onFocus).toHaveBeenCalledTimes(1)
    w.unmount()
  })
})

describe('GSelect · prefijo e iconos (r02)', () => {
  it('el slot prepend va dentro del botón, antes del valor, y es decorativo', () => {
    const w = mk({}, { slots: { prepend: '<i class="p">P</i>' } })
    const pre = btn(w).find('.g-select__prepend')
    expect(pre.exists()).toBe(true)
    expect(pre.attributes('aria-hidden')).toBe('true')
    const kids = [...btn(w).element.children].map((c) => (c.getAttribute('class') ?? '').split(' ')[0])
    expect(kids.indexOf('g-select__prepend')).toBeLessThan(kids.indexOf('g-select__value'))
    w.unmount()
    expect(mk().find('.g-select__prepend').exists()).toBe(false)
  })

  it('las marcas son iconos de Lucide decorativos: flecha, limpiar, elegida, cargando y agregar', async () => {
    const w = mk({ modelValue: 'us', clearable: true, clearLabel: 'Limpiar', loading: true, createLabel: 'Agregar' })
    expect(w.find('svg.g-select__arrow').attributes('aria-hidden')).toBe('true')
    expect(w.find('svg.g-select__arrow').html()).toContain('m6 9 6 6 6-6')
    expect(w.find('.g-select__clear svg').html()).toContain('M18 6 6 18')
    expect(w.find('svg.g-select__loader').html()).toContain('M21 12a9 9 0 1 1-6.219-8.56')
    await btn(w).trigger('click')
    const sel = w.find('.g-select__option[aria-selected="true"]')
    expect(sel.find('svg.g-select__check').html()).toContain('M20 6 9 17l-5-5')
    expect(w.find('.g-select__create svg.g-select__create-icon').html()).toContain('M5 12h14')
    expect(w.findAll('.g-select__option[aria-selected="false"] svg.g-select__check')).toHaveLength(0)
    w.unmount()
  })

  it('el slot icon se pinta en cada opción y junto al valor, decorativo, con la opción como alcance', () => {
    const icon = '<template #icon="{ option }"><i class="ic">{{ option.value }}</i></template>'
    const w = mk({ modelValue: 'mx' }, { slots: { icon } })
    const inOpts = w.findAll('[role="option"] .g-select__icon')
    expect(inOpts.length).toBe(6)
    expect(inOpts[0].attributes('aria-hidden')).toBe('true')
    expect(inOpts[0].text()).toBe('mx')
    const val = w.find('.g-select__value > .g-select__icon')
    expect(val.exists()).toBe(true)
    expect(val.text()).toBe('mx')
    w.unmount()
  })

  it('el icono solo se pinta si el slot devuelve contenido para esa opción (sin reservar espacio)', () => {
    const icon = '<template #icon="{ option }"><i v-if="option.value === \'us\'" class="ic">US</i></template>'
    const w = mk({}, { slots: { icon } })
    const rows = opts(w)
    expect(rows[0].find('.g-select__icon').exists()).toBe(false)
    expect(rows[1].find('.g-select__icon').exists()).toBe(true)
    expect(rows[3].find('.g-select__icon').exists()).toBe(false)
    w.unmount()
  })

  it('sin opción elegida no hay icono en el valor; con una sin icono, tampoco', async () => {
    const icon = '<template #icon="{ option }"><i v-if="option.value === \'us\'" class="ic">US</i></template>'
    const w = mk({}, { slots: { icon } })
    expect(w.find('.g-select__value > .g-select__icon').exists()).toBe(false)
    await w.setProps({ modelValue: 'mx' })
    expect(w.find('.g-select__value > .g-select__icon').exists()).toBe(false)
    await w.setProps({ modelValue: 'us' })
    expect(w.find('.g-select__value > .g-select__icon').exists()).toBe(true)
    w.unmount()
  })

  it('con los slots option o value, el slot icon no se usa en esa zona', () => {
    const w = mk({ modelValue: 'mx' }, { slots: { icon: '<template #icon><i class="ic">I</i></template>', option: '<template #option="{ option }"><b class="o">{{ option.label }}</b></template>', value: '<template #value="{ option }"><b class="v">{{ option.label }}</b></template>' } })
    expect(w.findAll('[role="option"] .g-select__icon').length).toBe(0)
    expect(w.find('.g-select__value > .g-select__icon').exists()).toBe(false)
    expect(w.find('.v').exists()).toBe(true)
    w.unmount()
  })

  it('los iconos no cambian el nombre accesible (aria-labelledby: etiqueta + botón)', () => {
    const w = mk({ id: 's', modelValue: 'mx' }, { slots: { icon: '<template #icon><i class="ic">I</i></template>', prepend: '<i>P</i>' } })
    expect(btn(w).attributes('aria-labelledby')).toBe('s-label s')
    w.unmount()
  })
})

describe('GSelect · fila «Agregar nuevo…» (r02)', () => {
  const mkc = (props = {}, opts = {}) => mk({ createLabel: 'Agregar nuevo país…', ...props }, opts)
  const createRow = (w) => w.find('.g-select__create')

  it('con createLabel hay una fila al final: role option, aria-selected false, id create, clases; sin él, no', () => {
    const w = mkc({ id: 's' })
    const row = createRow(w)
    expect(row.exists()).toBe(true)
    expect(row.attributes('role')).toBe('option')
    expect(row.attributes('aria-selected')).toBe('false')
    expect(row.attributes('id')).toBe('s-opt-create')
    expect(row.classes()).toEqual(expect.arrayContaining(['g-select__option', 'g-select__create']))
    expect(row.text()).toBe('Agregar nuevo país…')
    expect(w.find('[role="listbox"]').element.lastElementChild).toBe(row.element)
    expect(row.element.parentElement.getAttribute('role')).toBe('listbox') // hijo directo, fuera de los grupos
    w.unmount()
    expect(mk().find('.g-select__create').exists()).toBe(false)
  })

  it('no hay fila con readonly ni disabled', () => {
    expect(mkc({ readonly: true }).find('.g-select__create').exists()).toBe(false)
    expect(mkc({ disabled: true }).find('.g-select__create').exists()).toBe(false)
  })

  it('↓ y Fin llegan a la fila, que se resalta (is-active y aria-activedescendant)', async () => {
    const w = mkc({ id: 's' })
    await key(w, 'ArrowDown')
    await key(w, 'End')
    expect(btn(w).attributes('aria-activedescendant')).toBe('s-opt-create')
    expect(createRow(w).classes()).toContain('is-active')
    await key(w, 'ArrowUp')
    expect(activeText(w)).toBe('España')
    await key(w, 'ArrowDown')
    expect(btn(w).attributes('aria-activedescendant')).toBe('s-opt-create')
    w.unmount()
  })

  it('Enter sobre la fila: cierra, NO cambia el valor, devuelve el foco y emite create', async () => {
    const w = mkc({ modelValue: 'mx' })
    btn(w).element.focus()
    await key(w, 'ArrowDown')
    await key(w, 'End')
    await key(w, 'Enter')
    expect(w.emitted('create')).toHaveLength(1)
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(btn(w).element)
    expect(w.find('.g-select__value').text()).toBe('México')
    w.unmount()
  })

  it('el foco vuelve al selector ANTES de emitir create', async () => {
    let focusAtCreate = null
    const w = mkc({}, { attrs: { onCreate: () => { focusAtCreate = document.activeElement } } })
    btn(w).element.focus()
    await key(w, 'ArrowDown'); await key(w, 'End'); await key(w, 'Enter')
    expect(focusAtCreate).toBe(btn(w).element)
    w.unmount()
  })

  it('Espacio y el clic también la activan', async () => {
    const w = mkc()
    await key(w, 'ArrowDown'); await key(w, 'End'); await key(w, ' ')
    expect(w.emitted('create')).toHaveLength(1)
    await btn(w).trigger('click')
    await createRow(w).trigger('click')
    expect(w.emitted('create')).toHaveLength(2)
    expect(w.emitted('update:modelValue')).toBeUndefined()
    w.unmount()
  })

  it('Tab sobre la fila cierra SIN crear; Esc cierra sin hacer nada', async () => {
    const w = mkc({ modelValue: 'mx' })
    await key(w, 'ArrowDown'); await key(w, 'End'); await key(w, 'Tab')
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    expect(w.emitted('create')).toBeUndefined()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await key(w, 'ArrowDown'); await key(w, 'End'); await key(w, 'Escape')
    expect(btn(w).attributes('aria-expanded')).toBe('false')
    expect(w.emitted('create')).toBeUndefined()
    w.unmount()
  })

  it('el typeahead no considera la fila', async () => {
    vi.useFakeTimers()
    const w = mkc()
    await key(w, 'ArrowDown') // abre: México
    await key(w, 'a') // «Agregar…» también empieza por a, pero no cuenta: salta Alemania (deshabilitada) y llega a Argentina
    expect(activeText(w)).toBe('Argentina')
    await vi.advanceTimersByTimeAsync(600)
    await key(w, 'a') // otra vez: no hay más opciones con «a» tras Argentina (Alemania está deshabilitada); da la vuelta a Argentina y no cae en la fila
    expect(activeText(w)).toBe('Argentina')
    await vi.advanceTimersByTimeAsync(600)
    vi.useRealTimers()
    w.unmount()
  })

  it('con la lista vacía, la fila sigue visible y es la activa por defecto; con emptyText, el mensaje va antes', async () => {
    const w = mkc({ options: [], emptyText: 'No hay países.', id: 's' })
    expect(w.find('.g-select__empty').text()).toBe('No hay países.')
    expect(createRow(w).exists()).toBe(true)
    const kids = [...w.find('[role="listbox"]').element.children]
    expect(kids.indexOf(w.find('.g-select__empty').element)).toBeLessThan(kids.indexOf(createRow(w).element))
    await btn(w).trigger('click')
    await nextTick()
    expect(btn(w).attributes('aria-activedescendant')).toBe('s-opt-create')
    w.unmount()
  })

  it('el ratón sobre la fila la vuelve activa; el elegido no se marca en ella', async () => {
    const w = mkc({ modelValue: 'mx', id: 's' })
    await btn(w).trigger('click')
    await createRow(w).trigger('pointermove')
    expect(btn(w).attributes('aria-activedescendant')).toBe('s-opt-create')
    expect(createRow(w).attributes('aria-selected')).toBe('false')
    w.unmount()
  })
})

describe('GSelect · personalidad I1: is-ready (#304, #306)', () => {
  it('is-ready no está al montar y llega dos cuadros después (tras el primer pintado)', async () => {
    const w = mount(GSelect, { props: { ...base, error: 'Mal' }, attachTo: document.body })
    const r = () => w.find('.g-select')
    expect(r().classes()).not.toContain('is-ready')
    await new Promise((res) => requestAnimationFrame(() => res()))
    await nextTick()
    expect(r().classes()).not.toContain('is-ready') // un cuadro no basta
    await vi.waitFor(() => expect(r().classes()).toContain('is-ready'), { timeout: 1000 })
    w.unmount()
  })
  it('desmontado antes de los dos cuadros: no escribe nada ni falla', async () => {
    const w = mount(GSelect, { props: { ...base, error: 'Mal' }, attachTo: document.body })
    const el = w.find('.g-select').element
    w.unmount()
    await new Promise((res) => setTimeout(res, 80))
    expect(el.classList.contains('is-ready')).toBe(false)
  })
  it('en SSR (renderToString) no hay is-ready', async () => {
    const { createSSRApp, h } = await import('vue')
    const { renderToString } = await import('vue/server-renderer')
    const html = await renderToString(createSSRApp({ render: () => h(GSelect, { ...base, error: 'Mal' }) }))
    expect(html).toContain('g-select')
    expect(html).not.toContain('is-ready')
  })
})
