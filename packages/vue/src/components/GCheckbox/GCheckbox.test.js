import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, provide } from 'vue'
import GCheckbox from './GCheckbox.vue'
import GForm from '../GForm/GForm.vue'
import { formKey } from '../GForm/formContext.js'

const root = (w) => w.find('.g-checkbox')
const input = (w) => w.find('input')

afterEach(() => vi.restoreAllMocks())

describe('GCheckbox · render y clases', () => {
  it('renderiza un <input type="checkbox"> nativo con las clases por defecto', () => {
    const w = mount(GCheckbox, { props: { label: 'Acepto' } })
    expect(input(w).attributes('type')).toBe('checkbox')
    expect(root(w).classes()).toEqual(expect.arrayContaining([
      'g-checkbox', 'g-checkbox--layout-default', 'g-checkbox--size-md', 'g-checkbox--density-default', 'g-checkbox--color-brand'
    ]))
    expect(w.find('.g-checkbox__row').element.tagName).toBe('LABEL')
    expect(w.find('.g-checkbox__row').attributes('for')).toBe(input(w).attributes('id'))
  })

  it('las clases siguen a las props', () => {
    const w = mount(GCheckbox, { props: { label: 'x', layout: 'chip', size: 'lg', density: 'compact', color: 'accent', disabled: true, readonly: true, error: 'Mal' } })
    expect(root(w).classes()).toEqual(expect.arrayContaining([
      'g-checkbox--layout-chip', 'g-checkbox--size-lg', 'g-checkbox--density-compact', 'g-checkbox--color-accent', 'is-disabled', 'is-readonly', 'is-invalid'
    ]))
  })

  it('cada prop enumerada tiene validador; `variant` no existe (DECISIONS.md #36)', () => {
    for (const name of ['layout', 'size', 'density', 'color']) expect(GCheckbox.props[name].validator('valor-invalido')).toBe(false)
    expect(GCheckbox.props.layout.validator('card')).toBe(true)
    expect(GCheckbox.props.variant).toBeUndefined()
  })

  it('genera un id estable y deriva de él los de etiqueta, ayuda, dato y error', () => {
    const w = mount(GCheckbox, { props: { label: 'Acepto', id: 'c' } })
    expect(input(w).attributes('id')).toBe('c')
    expect(w.find('.g-checkbox__label').attributes('id')).toBe('c-label')
    expect(w.find('.g-checkbox__message').attributes('id')).toBe('c-message')
    expect(input(mount(GCheckbox, { props: { label: 'x' } })).attributes('id')).toMatch(/^g-checkbox-/)
  })
})

describe('GCheckbox · modelo', () => {
  it('booleano: refleja modelValue y emite true/false al alternar', async () => {
    const w = mount(GCheckbox, { props: { label: 'x', modelValue: false } })
    expect(input(w).element.checked).toBe(false)
    await input(w).setValue(true)
    expect(w.emitted('update:modelValue')).toEqual([[true]])
    await w.setProps({ modelValue: true })
    expect(input(w).element.checked).toBe(true)
    await input(w).setValue(false)
    expect(w.emitted('update:modelValue')[1]).toEqual([false])
  })

  it('con `value`, el modelo es un arreglo: agrega y quita', async () => {
    const w = mount(GCheckbox, { props: { label: 'x', value: 'a', modelValue: ['b'] } })
    expect(input(w).element.checked).toBe(false)
    await input(w).setValue(true)
    expect(w.emitted('update:modelValue')[0]).toEqual([['b', 'a']])
    await w.setProps({ modelValue: ['b', 'a'] })
    expect(input(w).element.checked).toBe(true)
    await input(w).setValue(false)
    expect(w.emitted('update:modelValue')[1]).toEqual([['b']])
  })

  it('con `value` y modelo booleano parte de un arreglo vacío', async () => {
    const w = mount(GCheckbox, { props: { label: 'x', value: 3 } })
    await input(w).setValue(true)
    expect(w.emitted('update:modelValue')[0]).toEqual([[3]])
  })

  it('el valor nativo del <input> es `value`', () => {
    expect(input(mount(GCheckbox, { props: { label: 'x', value: 'plan-a' } })).element.value).toBe('plan-a')
  })

  it('es controlada: si el consumidor no actualiza el modelo, el <input> vuelve a su estado', async () => {
    const w = mount(GCheckbox, { props: { label: 'x', modelValue: false } })
    await input(w).setValue(true)
    await nextTick()
    expect(input(w).element.checked).toBe(false)
  })
})

describe('GCheckbox · indeterminada', () => {
  it('se aplica a la PROPIEDAD del DOM (no al atributo)', async () => {
    const w = mount(GCheckbox, { props: { label: 'x', indeterminate: true } })
    expect(input(w).element.indeterminate).toBe(true)
    expect(input(w).attributes('indeterminate')).toBeUndefined()
    await w.setProps({ indeterminate: false })
    expect(input(w).element.indeterminate).toBe(false)
  })

  it('al activarla emite update:indeterminate=false y la vuelve a aplicar si el prop sigue en true', async () => {
    const w = mount(GCheckbox, { props: { label: 'x', indeterminate: true, modelValue: false } })
    await input(w).setValue(true)
    expect(w.emitted('update:indeterminate')).toEqual([[false]])
    await nextTick()
    expect(input(w).element.indeterminate).toBe(true)
  })

  it('sin indeterminate no emite update:indeterminate', async () => {
    const w = mount(GCheckbox, { props: { label: 'x' } })
    await input(w).setValue(true)
    expect(w.emitted('update:indeterminate')).toBeUndefined()
  })
})

describe('GCheckbox · estados', () => {
  it('disabled y required usan atributos nativos; required trae marca aria-hidden', () => {
    const w = mount(GCheckbox, { props: { label: 'x', disabled: true, required: true } })
    expect(input(w).attributes('disabled')).toBeDefined()
    expect(input(w).attributes('required')).toBeDefined()
    expect(w.find('.g-checkbox__required').attributes('aria-hidden')).toBe('true')
  })

  it('readonly: aria-readonly, enfocable, y el clic se cancela sin emitir', async () => {
    const w = mount(GCheckbox, { props: { label: 'x', readonly: true, modelValue: true } })
    expect(input(w).attributes('aria-readonly')).toBe('true')
    expect(input(w).attributes('disabled')).toBeUndefined()
    await input(w).trigger('click')
    expect(input(w).element.checked).toBe(true)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('sin error: región viva vacía y sin aria-invalid', () => {
    const w = mount(GCheckbox, { props: { label: 'x', id: 'c' } })
    const region = w.find('.g-checkbox__message')
    expect(region.attributes('aria-live')).toBe('polite')
    expect(region.text()).toBe('')
    expect(input(w).attributes('aria-invalid')).toBeUndefined()
    expect(input(w).attributes('aria-describedby')).toBeUndefined()
  })

  it('con error: aria-invalid, aria-describedby y texto en la región viva (fuera del <label>)', () => {
    const w = mount(GCheckbox, { props: { label: 'x', id: 'c', hint: 'Ayuda', error: 'Obligatoria' } })
    expect(input(w).attributes('aria-invalid')).toBe('true')
    expect(input(w).attributes('aria-describedby')).toBe('c-hint c-message')
    expect(w.find('.g-checkbox__message').text()).toBe('Obligatoria')
    expect(w.find('label').text()).not.toContain('Obligatoria')
  })

  it('respeta un aria-describedby del consumidor', () => {
    const w = mount(GCheckbox, { props: { label: 'x', id: 'c', hint: 'Ayuda' }, attrs: { 'aria-describedby': 'ext' } })
    expect(input(w).attributes('aria-describedby')).toBe('ext c-hint')
  })
})

describe('GCheckbox · nombre accesible y atributos', () => {
  it('aria-labelledby apunta a la etiqueta; la ayuda queda fuera del nombre', () => {
    const w = mount(GCheckbox, { props: { label: 'Envío', hint: 'Llega mañana', id: 'c' } })
    expect(input(w).attributes('aria-labelledby')).toBe('c-label')
    expect(w.find('#c-hint').exists()).toBe(true)
  })

  it('sin label, conserva el aria-label del consumidor (no pone aria-labelledby)', () => {
    const w = mount(GCheckbox, { attrs: { 'aria-label': 'Marcar fila' } })
    expect(input(w).attributes('aria-label')).toBe('Marcar fila')
    expect(input(w).attributes('aria-labelledby')).toBeUndefined()
  })

  it('class y style van a la raíz; el resto de atributos, al <input>', () => {
    const w = mount(GCheckbox, { props: { label: 'x' }, attrs: { class: 'mio', style: 'margin: 0', name: 'plan', 'data-x': '1' } })
    expect(root(w).classes()).toContain('mio')
    expect(root(w).attributes('style')).toContain('margin')
    expect(input(w).attributes('name')).toBe('plan')
    expect(input(w).attributes('data-x')).toBe('1')
    expect(root(w).attributes('name')).toBeUndefined()
  })

  it('las escuchas del consumidor llegan al <input> nativo', async () => {
    const onFocus = vi.fn()
    const w = mount(GCheckbox, { props: { label: 'x' }, attrs: { onFocus } })
    await input(w).trigger('focus')
    expect(onFocus).toHaveBeenCalledTimes(1)
  })

  it('avisa en desarrollo sin nombre accesible; no avisa con label, aria-label o aria-labelledby', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GCheckbox)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('nombre accesible'))
    warn.mockClear()
    mount(GCheckbox, { props: { label: 'x' } })
    mount(GCheckbox, { attrs: { 'aria-label': 'x' } })
    mount(GCheckbox, { attrs: { 'aria-labelledby': 'x' } })
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('GCheckbox · estructura tarjeta', () => {
  const slots = { icon: '<i class="mi-icono">i</i>', meta: '$99' }

  it('icon (aria-hidden) y meta solo existen en layout="card"', () => {
    const card = mount(GCheckbox, { props: { label: 'Express', layout: 'card', id: 'c' }, slots })
    expect(card.find('.g-checkbox__icon').attributes('aria-hidden')).toBe('true')
    expect(card.find('.g-checkbox__meta').text()).toBe('$99')
    expect(card.find('.g-checkbox__meta').attributes('aria-hidden')).toBeUndefined()
    const plain = mount(GCheckbox, { props: { label: 'Express' }, slots })
    expect(plain.find('.g-checkbox__icon').exists()).toBe(false)
    expect(plain.find('.g-checkbox__meta').exists()).toBe(false)
  })

  it('en la tarjeta el dato destacado forma parte del nombre; la descripción, de la descripción', () => {
    const w = mount(GCheckbox, { props: { label: 'Express', hint: '24 horas', layout: 'card', id: 'c' }, slots })
    expect(input(w).attributes('aria-labelledby')).toBe('c-label c-meta')
    expect(input(w).attributes('aria-describedby')).toBe('c-hint')
  })

  it('los slots label, hint y error sustituyen a las props (el error solo con error)', async () => {
    const w = mount(GCheckbox, { props: { id: 'c', error: 'x' }, slots: { label: 'Etiqueta <b>rica</b>', hint: 'Ayuda rica', error: 'Error <i>rico</i>' } })
    expect(w.find('.g-checkbox__label').html()).toContain('<b>rica</b>')
    expect(w.find('#c-hint').text()).toBe('Ayuda rica')
    expect(w.find('.g-checkbox__message').html()).toContain('<i>rico</i>')
    await w.setProps({ error: undefined })
    expect(w.find('.g-checkbox__message').text()).toBe('')
  })
})

describe('GCheckbox · orden de las escuchas', () => {
  it('una escucha @change del consumidor ya ve el v-model actualizado (como un <input v-model> nativo)', async () => {
    let seen = null
    const Wrap = {
      components: { GCheckbox },
      data: () => ({ v: false }),
      methods: { onChange() { seen = this.v } },
      template: '<g-checkbox v-model="v" label="x" @change="onChange"></g-checkbox>'
    }
    const w = mount(Wrap)
    await w.find('input').setValue(true)
    expect(seen).toBe(true)
    await w.find('input').setValue(false)
    expect(seen).toBe(false)
  })
})


describe('GCheckbox · indeterminate al insertarse (plan 012)', () => {
  it('con indeterminate, el input ya es mixto al insertarse', () => {
    let seen = null
    const mo = new MutationObserver((recs) => {
      for (const r of recs) for (const n of r.addedNodes) {
        const el = n.nodeType === 1 ? (n.matches('input') ? n : n.querySelector('input')) : null
        if (el && seen === null) seen = el.indeterminate
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })
    const w = mount(GCheckbox, { attachTo: document.body, props: { label: 'x', indeterminate: true } })
    mo.takeRecords().forEach((r) => r.addedNodes.forEach((n) => { const el = n.nodeType === 1 ? (n.matches('input') ? n : n.querySelector('input')) : null; if (el && seen === null) seen = el.indeterminate }))
    mo.disconnect()
    expect(w.find('input').element.indeterminate).toBe(true)
    expect(seen).toBe(true)
    w.unmount()
  })
})

describe('GCheckbox · field (#262)', () => {
  it('con field: true (por defecto) el HTML no cambia respecto al de antes de #262', () => {
    const html = (props, slots) => mount(GCheckbox, { props, slots }).html()
    expect(html({ label: 'Acepto', id: 'a' })).toMatchInlineSnapshot(`
      "<div class="g-checkbox g-checkbox--layout-default g-checkbox--size-md g-checkbox--density-default g-checkbox--color-brand"><label class="g-checkbox__row" for="a"><span class="g-checkbox__box"><input type="checkbox" id="a" aria-labelledby="a-label" class="g-checkbox__input"><svg class="g-icon g-checkbox__mark g-checkbox__check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg><svg class="g-icon g-checkbox__mark g-checkbox__dash" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true"><path d="M5 12h14"></path></svg></span>
          <!--v-if--><span class="g-checkbox__text"><span id="a-label" class="g-checkbox__label"><!--v-if-->Acepto<!--v-if--></span>
          <!--v-if--></span>
          <!--v-if-->
        </label>
        <div id="a-message" class="g-checkbox__message" aria-live="polite">
          <!--v-if-->
        </div>
      </div>"
    `)
    expect(html({ label: 'Acepto', id: 'b', hint: 'Ayuda', error: 'Mal', required: true, modelValue: true })).toMatchInlineSnapshot(`
      "<div class="g-checkbox g-checkbox--layout-default g-checkbox--size-md g-checkbox--density-default g-checkbox--color-brand is-invalid"><label class="g-checkbox__row" for="b"><span class="g-checkbox__box"><input type="checkbox" id="b" checked="" required="" aria-invalid="true" aria-labelledby="b-label" aria-describedby="b-hint b-message" class="g-checkbox__input"><svg class="g-icon g-checkbox__mark g-checkbox__check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg><svg class="g-icon g-checkbox__mark g-checkbox__dash" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true"><path d="M5 12h14"></path></svg></span>
          <!--v-if--><span class="g-checkbox__text"><span id="b-label" class="g-checkbox__label"><!--v-if-->Acepto<span class="g-checkbox__required" aria-hidden="true">*</span></span><span id="b-hint" class="g-checkbox__hint">Ayuda</span></span>
          <!--v-if-->
        </label>
        <div id="b-message" class="g-checkbox__message" aria-live="polite"><svg class="g-icon g-checkbox__message-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <!--v-if-->Mal
        </div>
      </div>"
    `)
    expect(html({ label: 'Express', id: 'c', layout: 'card', warning: 'Ojo', readonly: true }, { meta: '5 €' })).toMatchInlineSnapshot(`
      "<div class="g-checkbox g-checkbox--layout-card g-checkbox--size-md g-checkbox--density-default g-checkbox--color-brand is-readonly is-warning"><label class="g-checkbox__row" for="c"><span class="g-checkbox__box"><input type="checkbox" id="c" aria-readonly="true" aria-labelledby="c-label c-meta" aria-describedby="c-message" class="g-checkbox__input"><svg class="g-icon g-checkbox__mark g-checkbox__check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg><svg class="g-icon g-checkbox__mark g-checkbox__dash" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true"><path d="M5 12h14"></path></svg></span>
          <!--v-if--><span class="g-checkbox__text"><span id="c-label" class="g-checkbox__label"><!--v-if-->Express<!--v-if--></span>
          <!--v-if--></span><span id="c-meta" class="g-checkbox__meta">5 €</span>
        </label>
        <div id="c-message" class="g-checkbox__message" aria-live="polite"><svg class="g-icon g-checkbox__message-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path>
            <path d="M12 9v4"></path>
            <path d="M12 17h.01"></path>
          </svg>
          <!--v-if-->Ojo
        </div>
      </div>"
    `)
  })

  it('con field: false no pinta g-checkbox__message ni ninguna región aria-live', () => {
    const w = mount(GCheckbox, { props: { label: 'Fila', id: 'f', field: false } })
    expect(w.find('.g-checkbox__message').exists()).toBe(false)
    expect(w.find('[aria-live]').exists()).toBe(false)
    expect(w.find('#f-message').exists()).toBe(false)
    expect(input(w).attributes('aria-describedby')).toBeUndefined()
    // El resto sigue igual: nombre, modelo, tamaño propio
    expect(input(w).attributes('aria-labelledby')).toBe('f-label')
    expect(root(w).classes()).toEqual(expect.arrayContaining(['g-checkbox', 'g-checkbox--size-md', 'g-checkbox--density-default']))
  })

  it('con field: false sigue el v-model, el indeterminado, disabled y readonly propios', async () => {
    const w = mount(GCheckbox, { props: { 'aria-label': 'Fila', field: false, modelValue: false, indeterminate: true } })
    await input(w).setValue(true)
    expect(w.emitted('update:modelValue')[0]).toEqual([true])
    expect(w.emitted('update:indeterminate')[0]).toEqual([false])
    const ro = mount(GCheckbox, { props: { 'aria-label': 'x', field: false, readonly: true } })
    expect(input(ro).attributes('aria-readonly')).toBe('true')
    const dis = mount(GCheckbox, { props: { 'aria-label': 'x', field: false, disabled: true, density: 'compact' } })
    expect(input(dis).attributes('disabled')).toBeDefined()
    expect(root(dis).classes()).toContain('g-checkbox--density-compact')
  })

  it('con field: false avisa (una vez) si llegan error, warning, valid, required o mark, y los ignora', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GCheckbox, { props: { label: 'x', id: 'f', field: false, error: 'Mal', warning: 'Ojo', valid: 'Bien', required: true, mark: true } })
    const msgs = warn.mock.calls.map((c) => c[0]).filter((m) => /field: false/.test(m))
    expect(msgs).toHaveLength(1)
    for (const k of ['error', 'warning', 'valid', 'required', 'mark']) expect(msgs[0]).toContain(`\`${k}\``)
    expect(input(w).attributes('aria-invalid')).toBeUndefined()
    expect(input(w).attributes('required')).toBeUndefined()
    expect(w.find('.g-checkbox__required').exists()).toBe(false)
    expect(root(w).classes()).not.toEqual(expect.arrayContaining(['is-invalid']))
    expect(root(w).classes()).not.toContain('is-warning')
    expect(root(w).classes()).not.toContain('is-valid')
    // Un error que llega después también avisa (si no se avisó antes)
    warn.mockClear()
    const late = mount(GCheckbox, { props: { label: 'x', field: false } })
    expect(warn).not.toHaveBeenCalled()
    await late.setProps({ error: 'Tarde' })
    expect(warn.mock.calls.some((c) => /field: false/.test(c[0]) && c[0].includes('`error`'))).toBe(true)
    expect(late.find('.g-checkbox__message').exists()).toBe(false)
  })

  it('sin field: false los props de campo no avisan', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GCheckbox, { props: { label: 'x', error: 'Mal', required: true } })
    expect(warn.mock.calls.some((c) => /field: false/.test(c[0]))).toBe(false)
  })

  it('con field: false dentro de un GForm en solo lectura y deshabilitado sigue operable y no se registra', async () => {
    const register = vi.fn(() => () => {})
    const notifyChange = vi.fn()
    const Fake = defineComponent({
      setup(_, { slots }) {
        provide(formKey, { readonly: true, disabled: true, density: 'compact', marks: 'required', live: 'off', register, notifyChange, notifyInput: vi.fn(), notifyBlur: vi.fn(), visible: () => 'Error del formulario', labels: { error: 'Error:' } })
        return () => slots.default()
      }
    })
    const w = mount({ components: { Fake, GCheckbox }, data: () => ({ v: false }), template: '<Fake><GCheckbox v-model="v" :field="false" name="fila" aria-label="Fila" /></Fake>' })
    const el = w.find('input')
    expect(el.attributes('aria-readonly')).toBeUndefined()
    expect(el.attributes('disabled')).toBeUndefined()
    expect(el.attributes('aria-invalid')).toBeUndefined()
    expect(w.find('.g-checkbox').classes()).toContain('g-checkbox--density-default')
    expect(w.find('.g-checkbox').classes()).not.toContain('is-readonly')
    expect(w.find('.g-checkbox__message').exists()).toBe(false)
    await el.setValue(true)
    expect(w.vm.v).toBe(true)
    expect(register).not.toHaveBeenCalled()
    expect(notifyChange).not.toHaveBeenCalled()
    // Testigo: la misma casilla con field (por defecto) sí lee el contexto y se registra
    const field = mount({ components: { Fake, GCheckbox }, template: '<Fake><GCheckbox name="fila" aria-label="Fila" /></Fake>' })
    expect(field.find('input').attributes('aria-readonly')).toBe('true')
    expect(register).toHaveBeenCalledTimes(1)
  })

  it('con field: false dentro de un GForm real readonly: se marca y desmarca con el ratón', async () => {
    const w = mount({ components: { GForm, GCheckbox }, data: () => ({ v: false }), template: '<GForm  readonly><GCheckbox v-model="v" :field="false" aria-label="Fila" /></GForm>' }, { attachTo: document.body })
    await w.find('.g-checkbox__input').trigger('click')
    expect(w.vm.v).toBe(true)
    expect(w.find('.g-checkbox__message').exists()).toBe(false)
    w.unmount()
    // Testigo: como campo hereda el solo lectura y el clic no cambia nada
    const ctl = mount({ components: { GForm, GCheckbox }, data: () => ({ v: false }), template: '<GForm readonly><GCheckbox v-model="v" aria-label="Fila" /></GForm>' }, { attachTo: document.body })
    await ctl.find('.g-checkbox__input').trigger('click')
    expect(ctl.vm.v).toBe(false)
    ctl.unmount()
  })
})
