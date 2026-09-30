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
    expect(w.find('.g-select__error').attributes('aria-live')).toBe('polite')
    expect(w.find('.g-select__error').text()).toBe('')
    expect(btn(w).attributes('aria-invalid')).toBeUndefined()
    w.unmount()
    const e = mk({ id: 's', error: 'Elige una opción', hint: 'Ayuda' })
    expect(btn(e).attributes('aria-invalid')).toBe('true')
    expect(btn(e).attributes('aria-describedby')).toBe('s-hint s-error')
    expect(e.find('.g-select__error').text()).toBe('Elige una opción')
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
    expect(w.find('.g-select__error u').exists()).toBe(true)
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
