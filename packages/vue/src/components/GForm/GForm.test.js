import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, provide, reactive, ref } from 'vue'
import GForm from './GForm.vue'
import { formKey, useFormField } from './formContext.js'
import GFormSection from '../GFormSection/GFormSection.vue'
import GFormLayout from '../GFormLayout/GFormLayout.vue'
import GFormRow from '../GFormRow/GFormRow.vue'
import GFieldGroup from '../GFieldGroup/GFieldGroup.vue'
import GFormActions from '../GFormActions/GFormActions.vue'
import GErrorSummary from '../GErrorSummary/GErrorSummary.vue'
import GInput from '../GInput/GInput.vue'
import GTextarea from '../GTextarea/GTextarea.vue'
import GSelect from '../GSelect/GSelect.vue'
import GCheckbox from '../GCheckbox/GCheckbox.vue'
import GCheckboxGroup from '../GCheckboxGroup/GCheckboxGroup.vue'
import GSwitch from '../GSwitch/GSwitch.vue'
import GDatePicker from '../GDatePicker/GDatePicker.vue'
import GBtn from '../GBtn/GBtn.vue'

const components = { GForm, GFormSection, GFormLayout, GFormRow, GFieldGroup, GFormActions, GErrorSummary, GInput, GTextarea, GSelect, GCheckbox, GCheckboxGroup, GSwitch, GDatePicker, GBtn }
const LABELS = { optional: '(opcional)', requiredHint: 'Los campos con * son obligatorios.', sectionOptional: 'Opcional', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ' }
const frame = () => new Promise((r) => setTimeout(r, 40))
const mounted = []
function make(template, setup = () => ({}), opts = {}) {
  const w = mount(defineComponent({ components, setup, template }), { attachTo: document.body, ...opts })
  mounted.push(w)
  return w
}
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// ResizeObserver simulado: cada prueba decide el ancho medido
class FakeRO {
  static all = []
  constructor(cb) { this.cb = cb; this.els = []; FakeRO.all.push(this) }
  observe(el) { this.els.push(el) }
  disconnect() { this.els = [] }
  fire(width, height = 40) { for (const el of this.els) this.cb([{ target: el, contentBoxSize: [{ inlineSize: width, blockSize: height }], contentRect: { width, height } }]) }
}
const observersOf = (el) => FakeRO.all.filter((o) => o.els.includes(el))

// ---------------------------------------------------------------------------------------------------------------
describe('Precedencia: prop explícita › contexto › default de siempre (form.md §2, C1)', () => {
  const FIELDS = [
    ['GInput', GInput, 'g-input', { label: 'L' }],
    ['GTextarea', GTextarea, 'g-textarea', { label: 'L' }],
    ['GSelect', GSelect, 'g-select', { label: 'L', options: [{ value: 1, label: 'a' }] }],
    ['GCheckbox', GCheckbox, 'g-checkbox', { label: 'L' }],
    ['GCheckboxGroup', GCheckboxGroup, 'g-checkbox-group', { label: 'L' }],
    ['GSwitch', GSwitch, 'g-switch', { label: 'L' }],
    ['GDatePicker', GDatePicker, 'g-datepicker', { label: 'L' }]
  ]
  const OLD = { GInput: { density: 'default', block: false, disabled: false, readonly: false }, GTextarea: { density: 'default', block: false, disabled: false, readonly: false }, GSelect: { density: 'default', block: false, disabled: false, readonly: false }, GCheckbox: { disabled: false, readonly: false }, GCheckboxGroup: { density: 'default', disabled: false }, GSwitch: { density: 'default', disabled: false, readonly: false }, GDatePicker: { density: 'default', block: false, disabled: false, readonly: false } }

  for (const [name, comp, , props] of FIELDS) {
    it(`${name}: fuera de GForm el marcado es idéntico al de los defaults de siempre`, () => {
      const a = mount(comp, { props: { id: 'x', ...props } })
      const b = mount(comp, { props: { id: 'x', ...props, ...OLD[name] } })
      expect(a.html()).toBe(b.html())
      expect(a.html()).not.toContain('is-readonly')
      expect(a.html()).not.toContain('--block')
    })
  }

  for (const [name, , cls, props] of FIELDS) {
    if (name === 'GCheckboxGroup') continue
    it(`${name}: dentro de GForm hereda densidad, solo lectura y deshabilitado; la prop explícita (también false) gana`, () => {
      const tag = name === 'GDatePicker' ? 'GDatePicker' : name
      const p = Object.entries(props).map(([k, v]) => (typeof v === 'string' ? `${k}="${v}"` : `:${k}='${JSON.stringify(v)}'`)).join(' ')
      const w = make(`<GForm density="compact" readonly disabled><${tag} ${p} /><${tag} ${p} density="comfortable" :readonly="false" :disabled="false" /></GForm>`)
      const [inh, own] = w.findAll(`.${cls}`).filter((x) => x.classes().includes(cls))
      expect(inh.classes()).toEqual(expect.arrayContaining([`${cls}--density-compact`, 'is-readonly', 'is-disabled']))
      expect(own.classes()).toContain(`${cls}--density-comfortable`)
      expect(own.classes()).not.toContain('is-readonly')
      expect(own.classes()).not.toContain('is-disabled')
    })
  }

  it('block: dentro de GFormLayout (y de GFormRow) los campos llenan su sitio; la prop explícita block=false gana', () => {
    const w = make('<GForm><GFormLayout><GFormRow><GInput label="a" /><GInput label="b" :block="false" /></GFormRow><GSelect label="c" /><GDatePicker label="d" /><GTextarea label="e" /></GFormLayout></GForm>')
    const ins = w.findAll('.g-input')
    expect(ins[0].classes()).toContain('g-input--block')
    expect(ins[1].classes()).not.toContain('g-input--block')
    expect(w.find('.g-select').classes()).toContain('g-select--block')
    expect(w.find('.g-datepicker').classes()).toContain('g-datepicker--block')
    expect(w.find('.g-textarea').classes()).toContain('g-textarea--block')
  })

  it("error explícito (incluido '') gana a errors[name]; un error explícito se ve siempre, sin momento", async () => {
    const w = make('<GForm :errors="{ a: \'del form\', b: \'del form\' }"><GInput label="a" name="a" error="" /><GInput label="b" name="b" error="propio" /></GForm>')
    await w.find('form').trigger('submit')
    await frame()
    const [a, b] = w.findAll('.g-input')
    expect(a.find('.g-input__message').text()).toBe('')
    expect(b.find('.g-input__message').text()).toContain('propio')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GForm · momento de los errores (#157)', () => {
  const setup = () => {
    const errors = reactive({ email: 'Escribe el correo' })
    const warnings = reactive({})
    return { errors, warnings, labels: LABELS }
  }
  const input = (w) => w.find('input[name="email"]')
  const msg = (w) => w.find('.g-input__message')

  it('salir sin haber escrito no revela; escribir y salir revela (aria-invalid, describedby, icono y prefijo)', async () => {
    const w = make('<GForm :errors="errors" :labels="labels"><GInput id="e" label="Correo" name="email" /></GForm>', setup)
    await input(w).trigger('focusout')
    expect(msg(w).text()).toBe('')
    expect(msg(w).element.childNodes.length === 0 || [...msg(w).element.childNodes].every((n) => n.nodeType === 8)).toBe(true)
    expect(input(w).attributes('aria-invalid')).toBeUndefined()
    await input(w).setValue('ana@')
    await input(w).trigger('focusout')
    await nextTick()
    expect(msg(w).text()).toBe('Error: Escribe el correo')
    expect(msg(w).find('.g-input__message-type').text()).toBe('Error:')
    expect(msg(w).find('svg.g-input__message-icon').exists()).toBe(true)
    expect(input(w).attributes('aria-invalid')).toBe('true')
    expect(input(w).attributes('aria-describedby')).toBe('e-message')
    expect(msg(w).attributes('aria-live')).toBe('polite')
  })

  it('al corregir se oculta y el siguiente error espera al siguiente blur; mientras está revelado, se actualiza al escribir', async () => {
    const w = make('<GForm :errors="errors" :labels="labels"><GInput label="Correo" name="email" /></GForm>', setup)
    const vm = w.vm
    await input(w).setValue('a')
    await input(w).trigger('focusout')
    await nextTick()
    expect(msg(w).text()).toContain('Escribe el correo')
    vm.errors.email = 'Otro mensaje'
    await nextTick()
    expect(msg(w).text()).toContain('Otro mensaje')
    vm.errors.email = ''
    await nextTick()
    expect(msg(w).text()).toBe('')
    vm.errors.email = 'Vuelve el error'
    await nextTick()
    expect(msg(w).text()).toBe('')
    await input(w).trigger('focusout')
    await nextTick()
    expect(msg(w).text()).toContain('Vuelve el error')
  })

  it('un control de elección revela al cambiar (casilla)', async () => {
    const w = make('<GForm :errors="{ ok: \'Acepta\' }" :labels="labels"><GCheckbox label="Acepto" name="ok" /></GForm>', () => ({ labels: LABELS }))
    expect(w.find('.g-checkbox__message').text()).toBe('')
    await w.find('input').setValue(true)
    await nextTick()
    expect(w.find('.g-checkbox__message').text()).toContain('Acepta')
  })

  it('el envío revela todos; con showErrorsOn="submit" salir del campo no revela', async () => {
    const w = make('<GForm :errors="errors" :labels="labels" show-errors-on="submit"><GInput label="Correo" name="email" /></GForm>', setup)
    await input(w).setValue('a')
    await input(w).trigger('focusout')
    await nextTick()
    expect(msg(w).text()).toBe('')
    await w.find('form').trigger('submit')
    await frame()
    expect(msg(w).text()).toContain('Escribe el correo')
  })

  it('las advertencias siguen la misma tabla y no bloquean el envío; is-warning y su icono', async () => {
    const onSubmit = vi.fn()
    const w = make('<GForm :warnings="{ t: \'Alta\' }" :labels="labels" @submit="onSubmit"><GInput label="Temp" name="t" /></GForm>', () => ({ labels: LABELS, onSubmit }))
    await w.find('input').trigger('focusout')
    expect(w.find('.g-input__message').text()).toBe('')
    await w.find('form').trigger('submit')
    await frame()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(w.find('.g-input__message').text()).toBe('Advertencia: Alta')
    expect(w.find('.g-input').classes()).toContain('is-warning')
    expect(w.find('input').attributes('aria-invalid')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GForm · envío (#157)', () => {
  it('siempre cancela el envío nativo; sin errores emite submit con FormData y submitter', async () => {
    const onSubmit = vi.fn()
    const w = make('<GForm @submit="onSubmit"><GInput label="Nombre" name="nombre" model-value="Ana" /><button type="submit" name="intent" value="save">Guardar</button></GForm>', () => ({ onSubmit }))
    const form = w.find('form').element
    expect(form.hasAttribute('novalidate')).toBe(true)
    form.requestSubmit(w.find('button').element)
    await frame()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    const p = onSubmit.mock.calls[0][0]
    expect(p.novalidate).toBe(false)
    expect(p.submitter).toBe(w.find('button').element)
    expect(p.data.get('nombre')).toBe('Ana')
    expect(p.data.get('intent')).toBe('save')
    expect(p.event.defaultPrevented).toBe(true)
  })

  it('un submitter con formnovalidate emite submit con novalidate: true sin revelar nada', async () => {
    const onSubmit = vi.fn()
    const onInvalid = vi.fn()
    const w = make('<GForm :errors="{ a: \'Mal\' }" @submit="onSubmit" @invalid="onInvalid"><GInput label="A" name="a" /><button type="submit" formnovalidate>Borrador</button></GForm>', () => ({ onSubmit, onInvalid }))
    w.find('form').element.requestSubmit(w.find('button').element)
    await frame()
    expect(onInvalid).not.toHaveBeenCalled()
    expect(onSubmit.mock.calls[0][0].novalidate).toBe(true)
    expect(w.find('.g-input__message').text()).toBe('')
  })

  it('con errores emite invalid en orden del DOM (generales al final, id null) y enfoca el primer inválido; los deshabilitados no bloquean', async () => {
    const onInvalid = vi.fn()
    const onSubmit = vi.fn()
    const w = make(`<GForm :errors="{ general: 'Folio duplicado', b: 'B mal', a: 'A mal', c: 'C mal' }" @invalid="onInvalid" @submit="onSubmit">
      <GInput id="ia" label="A" name="a" /><GInput id="ib" label="B" name="b" /><GInput id="ic" label="C" name="c" disabled /></GForm>`, () => ({ onInvalid, onSubmit }))
    await w.find('form').trigger('submit')
    await frame()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(onInvalid.mock.calls[0][0].errors).toEqual([
      { name: 'a', message: 'A mal', id: 'ia' },
      { name: 'b', message: 'B mal', id: 'ib' },
      { name: 'general', message: 'Folio duplicado', id: null }
    ])
    expect(document.activeElement.id).toBe('ia')
  })

  it('con un GErrorSummary montado el foco va al resumen', async () => {
    const w = make(`<GForm :errors="{ a: 'A mal' }"><GErrorSummary :labels="{ title: 'Hay {count} problemas' }" /><GInput id="ia" label="A" name="a" /></GForm>`)
    await w.find('form').trigger('submit')
    await frame()
    expect(document.activeElement.classList.contains('g-error-summary')).toBe(true)
  })

  it('showErrors() revela y enfoca sin emitir invalid; focusFirstError() y resetState()', async () => {
    const onInvalid = vi.fn()
    const form = ref(null)
    const w = make(`<GForm ref="form" :errors="{ a: 'A mal' }" @invalid="onInvalid"><GInput id="x" label="X" name="x" /><GInput id="ia" label="A" name="a" /></GForm>`, () => ({ onInvalid, form }))
    await form.value.showErrors()
    await frame()
    expect(onInvalid).not.toHaveBeenCalled()
    expect(w.findAll('.g-input__message')[1].text()).toContain('A mal')
    expect(document.activeElement.id).toBe('ia')
    document.activeElement.blur()
    expect(form.value.focusFirstError()).toBe(true)
    expect(document.activeElement.id).toBe('ia')
    form.value.resetState()
    await nextTick()
    expect(w.findAll('.g-input__message')[1].text()).toBe('')
  })

  it('reset nativo: se cancela, limpia el estado, baja dirty y emite reset', async () => {
    const onReset = vi.fn()
    const dirty = ref(true)
    const w = make(`<GForm v-model:dirty="dirty" :errors="{ a: 'A mal' }" @reset="onReset"><GInput label="A" name="a" /><button type="reset">Restablecer</button></GForm>`, () => ({ onReset, dirty }))
    await w.find('form').trigger('submit')
    await frame()
    expect(w.find('.g-input__message').text()).toContain('A mal')
    const ev = new Event('reset', { cancelable: true })
    w.find('form').element.dispatchEvent(ev)
    await nextTick()
    expect(ev.defaultPrevented).toBe(true)
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(dirty.value).toBe(false)
    expect(w.find('.g-input__message').text()).toBe('')
  })

  it('action y method se ignoran con aviso; los demás atributos van al <form>', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = make('<GForm id="f1" action="/x" method="post" aria-label="Paciente"></GForm>')
    const f = w.find('form')
    expect(f.attributes('action')).toBeUndefined()
    expect(f.attributes('method')).toBeUndefined()
    expect(f.attributes('id')).toBe('f1')
    expect(f.attributes('aria-label')).toBe('Paciente')
    expect(warn.mock.calls.some((c) => /action/.test(c[0]))).toBe(true)
  })

  it('un GForm dentro de otro avisa y pinta <div>, pero sigue proveyendo su contexto', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = make('<GForm><GForm density="compact"><GInput label="A" /></GForm></GForm>')
    expect(w.findAll('form')).toHaveLength(1)
    expect(w.find('form div.g-form').exists()).toBe(true)
    expect(w.find('.g-input').classes()).toContain('g-input--density-compact')
    expect(warn.mock.calls.some((c) => /otro GForm/.test(c[0]))).toBe(true)
  })

  it('el submit del consumidor no se dispara dos veces (eventos declarados)', async () => {
    const onSubmit = vi.fn()
    const w = make('<GForm @submit="onSubmit"></GForm>', () => ({ onSubmit }))
    await w.find('form').trigger('submit')
    await frame()
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GForm · silencio al enviar (#164, C8)', () => {
  it('las regiones van en off mientras se escriben los mensajes del envío y vuelven a polite en el cuadro siguiente', async () => {
    const w = make('<GForm :errors="{ a: \'A mal\' }"><GInput label="A" name="a" /></GForm>')
    await w.find('form').trigger('submit')
    await nextTick()
    await nextTick()
    expect(w.find('.g-input__message').attributes('aria-live')).toBe('off')
    await frame()
    expect(w.find('.g-input__message').text()).toContain('A mal')
    expect(w.find('.g-input__message').attributes('aria-live')).toBe('polite')
  })

  it('al salir del campo la región está en polite todo el tiempo', async () => {
    const w = make('<GForm :errors="{ a: \'A mal\' }"><GInput label="A" name="a" /></GForm>')
    await w.find('input').setValue('x')
    await w.find('input').trigger('focusout')
    await nextTick()
    expect(w.find('.g-input__message').attributes('aria-live')).toBe('polite')
    expect(w.find('.g-input__message').text()).toContain('A mal')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GForm · dirty', () => {
  it('sube con el primer input y con notifyChange(); nada lo baja salvo reset', async () => {
    const dirty = ref(false)
    const w = make('<GForm v-model:dirty="dirty"><GInput label="A" name="a" /><GSelect label="S" name="s" :options="[{ value: 1, label: \'Uno\' }]" /></GForm>', () => ({ dirty }))
    await w.find('input').setValue('x')
    expect(dirty.value).toBe(true)
    dirty.value = false
    await nextTick()
    await w.find('.g-select__button').trigger('click')
    await nextTick()
    await w.find('[role="option"]').trigger('click')
    expect(dirty.value).toBe(true)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('Marcas (#153, §2)', () => {
  it('marks="optional": «(opcional)» con un espacio delante dentro de la etiqueta; los obligatorios sin asterisco', () => {
    const w = make('<GForm :labels="labels"><GInput label="Nombre" required /><GInput label="Segundo apellido" /><GTextarea label="Notas" /><GSelect label="Estado" /><GDatePicker label="Fecha" /></GForm>', () => ({ labels: LABELS }))
    const labs = w.findAll('.g-input__label')
    expect(labs[0].find('.g-input__required').exists()).toBe(false)
    expect(labs[0].find('.g-input__optional').exists()).toBe(false)
    expect(labs[1].element.textContent).toBe('Segundo apellido (opcional)')
    expect(labs[1].find('.g-input__optional').element.previousSibling.nodeType).toBe(3)
    expect(w.find('.g-textarea__optional').exists()).toBe(true)
    expect(w.find('.g-select__optional').exists()).toBe(true)
    expect(w.find('.g-datepicker__optional').exists()).toBe(true)
  })

  it('marks="required": asterisco aria-hidden en los obligatorios, nada en los opcionales, y la frase al principio', () => {
    const w = make('<GForm marks="required" :labels="labels"><GInput label="Nombre" required /><GInput label="Segundo" /><GCheckboxGroup label="Avisos" required /></GForm>', () => ({ labels: LABELS }))
    expect(w.find('.g-form__required-hint').text()).toBe(LABELS.requiredHint)
    expect(w.find('.g-form').element.firstElementChild.classList.contains('g-form__required-hint')).toBe(true)
    const [a, b] = w.findAll('.g-input__label')
    expect(a.find('.g-input__required').attributes('aria-hidden')).toBe('true')
    expect(b.find('.g-input__required').exists()).toBe(false)
    expect(b.find('.g-input__optional').exists()).toBe(false)
    expect(w.find('.g-checkbox-group__required').exists()).toBe(true)
  })

  it('excepciones: GSwitch nunca, casilla suelta sin «(opcional)», sección opcional, solo lectura, mark=false', () => {
    const w = make(`<GForm :labels="labels"><GSwitch label="Avisos" /><GCheckbox label="Acepto" /><GInput label="RO" readonly /><GInput label="Sin" :mark="false" />
      <GFormSection title="Fiscales" optional><GInput label="RFC" /></GFormSection></GForm>`, () => ({ labels: LABELS }))
    expect(w.html()).not.toContain('g-switch__optional')
    expect(w.find('.g-checkbox').html()).not.toContain('(opcional)')
    const labs = w.findAll('.g-input__label')
    expect(labs.map((l) => l.find('.g-input__optional').exists())).toEqual([false, false, false])
    expect(w.find('.g-form-section .g-badge').text()).toBe('Opcional')
  })

  it('sin labels.optional avisa una vez y el campo va sin marca', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = make('<GForm><GInput label="A" /><GInput label="B" /></GForm>')
    expect(w.find('.g-input__optional').exists()).toBe(false)
    expect(warn.mock.calls.filter((c) => /labels\.optional/.test(c[0]))).toHaveLength(1)
  })

  it('fuera de GForm: el asterisco de siempre con required', () => {
    const w = mount(GInput, { props: { label: 'A', required: true } })
    expect(w.find('.g-input__required').exists()).toBe(true)
    expect(w.find('.g-input__optional').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFieldGroup (#160)', () => {
  const PHONE = `<GFieldGroup id="tel" label="Teléfono" name="telefono" required hint="Solo para la cita">
      <GSelect id="pais" class="g-form-w-sm" label="País" name="tel-pais" required :options="[{ value: 52, label: '+52' }]" />
      <GInput id="num" label="Número" name="tel-numero" required />
      <GInput id="ext" class="g-form-w-xs" label="Extensión" name="tel-ext" />
    </GFieldGroup>`

  it('fieldset + legend; marca de la parte solo si difiere; aria-describedby a ayuda (y mensaje)', () => {
    const w = make(`<GForm :labels="labels">${PHONE}</GForm>`, () => ({ labels: LABELS }))
    const fs = w.find('fieldset.g-field-group')
    expect(fs.find('legend.g-field-group__label').text()).toBe('Teléfono')
    expect(fs.attributes('aria-describedby')).toBe('tel-hint')
    expect(fs.find('.g-field-group__message').exists()).toBe(true)
    expect(w.find('label[for="num"]').text()).toBe('Número')
    expect(w.find('label[for="pais"]').text()).toBe('País')
    expect(w.find('label[for="ext"]').element.textContent).toBe('Extensión (opcional)')
    expect(w.findAll('.g-input')[0].classes()).toContain('g-input--block')
  })

  it('un solo mensaje (primera parte inválida); aria-invalid en las partes y no en el fieldset; el resumen lleva a la parte', async () => {
    const onInvalid = vi.fn()
    const w = make(`<GForm :errors="{ 'tel-numero': 'Diez dígitos', 'tel-ext': 'Solo números' }" :labels="labels" @invalid="onInvalid">
      <GErrorSummary :labels="{ title: (n) => n + ' problemas' }" />${PHONE}</GForm>`, () => ({ labels: LABELS, onInvalid }))
    await w.find('form').trigger('submit')
    await frame()
    const fs = w.find('fieldset.g-field-group')
    expect(fs.find('.g-field-group__message').text()).toBe('Error: Diez dígitos')
    expect(fs.classes()).toContain('is-invalid')
    expect(fs.attributes('aria-invalid')).toBeUndefined()
    expect(fs.attributes('aria-describedby')).toBe('tel-hint tel-message')
    expect(w.find('#num').attributes('aria-invalid')).toBe('true')
    expect(w.find('#ext').attributes('aria-invalid')).toBe('true')
    expect(w.findAll('.g-input__message').every((m) => m.text() === '')).toBe(true)
    expect(onInvalid.mock.calls[0][0].errors).toEqual([{ name: 'telefono', message: 'Diez dígitos', id: 'num' }])
    const links = w.findAll('.g-error-summary__link')
    expect(links).toHaveLength(1)
    expect(links[0].attributes('href')).toBe('#num')
  })

  it('deshabilitado: is-disabled y disabled en el fieldset; las partes reciben is-disabled y no bloquean', async () => {
    const onSubmit = vi.fn()
    const w = make(`<GForm :errors="{ 'tel-numero': 'Mal' }" @submit="onSubmit"><GFieldGroup label="T" disabled><GInput label="N" name="tel-numero" /></GFieldGroup></GForm>`, () => ({ onSubmit }))
    const fs = w.find('fieldset')
    expect(fs.classes()).toContain('is-disabled')
    expect(fs.attributes('disabled')).toBeDefined()
    expect(w.find('.g-input').classes()).toContain('is-disabled')
    await w.find('form').trigger('submit')
    await frame()
    expect(onSubmit).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GErrorSummary (#162)', () => {
  it('raíz enfocable con role="alert" interior; oculto sin errores; título String con {count}', () => {
    const w = make('<GForm><GErrorSummary id="sum" :labels="{ title: \'Hay {count} problemas\' }" /></GForm>')
    const s = w.find('.g-error-summary')
    expect(s.attributes('tabindex')).toBe('-1')
    expect(s.attributes('hidden')).toBeDefined()
    expect(s.attributes('aria-labelledby')).toBe('sum-title')
    expect(s.element.firstElementChild.getAttribute('role')).toBe('alert')
    expect(s.find('h3.g-error-summary__title svg.g-error-summary__icon').exists()).toBe(true)
  })

  it('tras el envío: enlaces href reales con el texto en línea, generales sin enlace; foco una vez por envío; al corregir sale en silencio', async () => {
    const errors = reactive({ a: 'A mal', b: 'B mal', srv: 'Folio duplicado' })
    const w = make(`<GForm :errors="errors" :heading-level="2"><GErrorSummary :labels="{ title: (n) => (n === 1 ? 'Hay 1 problema' : 'Hay ' + n + ' problemas') }" /><GInput id="ia" label="A" name="a" /><GInput id="ib" label="B" name="b" /></GForm>`, () => ({ errors }))
    const s = () => w.find('.g-error-summary')
    // un error revelado al salir del campo no hace aparecer el resumen
    await w.find('#ia').setValue('x')
    await w.find('#ia').trigger('focusout')
    await nextTick()
    expect(s().attributes('hidden')).toBeDefined()
    await w.find('form').trigger('submit')
    await frame()
    expect(s().attributes('hidden')).toBeUndefined()
    expect(s().find('h2').text()).toBe('Hay 3 problemas')
    expect(s().findAll('a').map((a) => [a.attributes('href'), a.text()])).toEqual([['#ia', 'A mal'], ['#ib', 'B mal']])
    expect(s().find('li.g-error-summary__item').text()).toBe('Folio duplicado')
    expect(document.activeElement).toBe(s().element)
    document.activeElement.blur()
    errors.a = ''
    await nextTick()
    expect(s().findAll('a')).toHaveLength(1)
    expect(document.activeElement).not.toBe(s().element)
    errors.b = ''
    errors.srv = ''
    await nextTick()
    expect(s().attributes('hidden')).toBeDefined()
  })

  it('navigate: sin cancelar enfoca el control con preventScroll y la etiqueta a la vista; con preventDefault no hace nada', async () => {
    const onNav = vi.fn()
    const w = make(`<GForm :errors="{ a: 'A mal' }"><GErrorSummary :labels="{ title: 'x' }" @navigate="onNav" /><GInput id="ia" label="A" name="a" /></GForm>`, () => ({ onNav }))
    await w.find('form').trigger('submit')
    await frame()
    const root = w.find('.g-input').element
    root.scrollIntoView = vi.fn()
    const focus = vi.spyOn(w.find('#ia').element, 'focus')
    await w.find('.g-error-summary__link').trigger('click')
    await nextTick()
    expect(onNav.mock.calls[0][0]).toMatchObject({ name: 'a', id: 'ia' })
    expect(root.scrollIntoView).toHaveBeenCalled()
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    onNav.mockImplementation((e) => e.preventDefault())
    focus.mockClear()
    await w.find('.g-error-summary__link').trigger('click')
    await nextTick()
    expect(focus).not.toHaveBeenCalled()
  })

  it('fuera de GForm: visible con errors y enfoca al pasar de vacío a con elementos', async () => {
    const list = ref([])
    const w = make('<GErrorSummary :errors="list" :labels="{ title: \'{count}\' }" />', () => ({ list }))
    expect(w.find('.g-error-summary').attributes('hidden')).toBeDefined()
    list.value = [{ id: 'x', message: 'Mal' }, { message: 'General' }]
    await nextTick()
    await nextTick()
    expect(w.find('.g-error-summary').attributes('hidden')).toBeUndefined()
    expect(document.activeElement.classList.contains('g-error-summary')).toBe(true)
    expect(w.find('h3').text()).toBe('2')
  })

  it('avisa sin labels.title y fuera de GForm sin errors no pinta nada', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GErrorSummary)
    expect(w.find('.g-error-summary').exists()).toBe(false)
    expect(warn.mock.calls.map((c) => c[0]).join()).toMatch(/labels\.title/)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormActions (#155, #163)', () => {
  beforeEach(() => { FakeRO.all = []; vi.stubGlobal('ResizeObserver', FakeRO) })

  it('región role="status" siempre presente y vacía sin estado; botones en __buttons', () => {
    const w = make('<GFormActions><GBtn variant="ghost">Cancelar</GBtn><GBtn type="submit">Guardar</GBtn></GFormActions>')
    const st = w.find('.g-form-actions__status')
    expect(st.attributes('role')).toBe('status')
    expect(st.element.childNodes.length === 0 || [...st.element.childNodes].every((n) => n.nodeType === 8 || n.textContent === '')).toBe(true)
    expect(w.findAll('.g-form-actions__buttons .g-btn')).toHaveLength(2)
  })

  it('apila bajo space × 104 (data-stacked y g-form-actions--stacked)', async () => {
    const w = make('<GFormActions status="Cambios sin guardar"><GBtn>Guardar</GBtn></GFormActions>')
    const el = w.find('.g-form-actions')
    const ro = observersOf(el.element)[0]
    ro.fire(360)
    await frame()
    expect(el.classes()).toContain('g-form-actions--stacked')
    expect(el.attributes('data-stacked')).toBeDefined()
    ro.fire(600)
    await frame()
    expect(el.classes()).not.toContain('g-form-actions--stacked')
    expect(el.attributes('data-stacked')).toBeUndefined()
    expect(w.find('.g-form-actions__status').text()).toBe('Cambios sin guardar')
  })

  it('sticky: GForm publica --g-form-actions-size y g-form--sticky-actions (en el cuadro siguiente)', async () => {
    const w = make('<GForm><GInput label="A" /><GFormActions sticky><GBtn type="submit">Guardar</GBtn></GFormActions></GForm>')
    const bar = w.find('.g-form-actions').element
    Object.defineProperty(bar, 'offsetHeight', { configurable: true, value: 64 })
    observersOf(bar)[0].fire(600, 64)
    await frame()
    const form = w.find('form')
    expect(form.classes()).toContain('g-form--sticky-actions')
    expect(form.element.style.getPropertyValue('--g-form-actions-size')).toBe('64px')
  })

  it('respaldo JS en focusin: si el campo enfocado queda bajo el pie, desplaza la diferencia', async () => {
    const w = make('<div id="sc" style="overflow:auto"><GForm><GInput id="a" label="A" /><GFormActions sticky><GBtn type="submit">Guardar</GBtn></GFormActions></GForm></div>')
    const bar = w.find('.g-form-actions').element
    Object.defineProperty(bar, 'offsetHeight', { configurable: true, value: 64 })
    observersOf(bar)[0].fire(600, 64)
    await frame()
    bar.getBoundingClientRect = () => ({ top: 500, bottom: 564, left: 0, right: 600, width: 600, height: 64 })
    const input = w.find('#a').element
    input.getBoundingClientRect = () => ({ top: 480, bottom: 516, left: 0, right: 200, width: 200, height: 36 })
    const sc = document.scrollingElement || document.documentElement
    sc.scrollBy = vi.fn()
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await frame()
    expect(sc.scrollBy).toHaveBeenCalledWith({ top: 32, behavior: 'instant' })
  })

  it('avisa con más de una primaria y con una primaria que no es el último botón', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    make('<GFormActions><GBtn>Uno</GBtn><GBtn>Dos</GBtn></GFormActions>')
    make('<GFormActions><GBtn>Guardar</GBtn><GBtn variant="ghost">Cancelar</GBtn></GFormActions>')
    const msgs = warn.mock.calls.map((c) => c[0]).join('\n')
    expect(msgs).toMatch(/más de una acción primaria/)
    expect(msgs).toMatch(/último botón/)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormSection (#161)', () => {
  it('section sin aria-labelledby, título hN del GForm (o propio), descripción, slots actions y help', () => {
    const w = make('<GForm :heading-level="2" :labels="labels"><GFormSection id="dir" title="Dirección" description="Como en el comprobante"><template #actions><button>Copiar</button></template><template #help>?</template><p>cuerpo</p></GFormSection><GFormSection title="Otra" :heading-level="4" /></GForm>', () => ({ labels: LABELS }))
    const s = w.find('section#dir')
    expect(s.attributes('aria-labelledby')).toBeUndefined()
    expect(s.find('h2.g-form-section__title').text()).toBe('Dirección')
    expect(s.find('p.g-form-section__description').text()).toBe('Como en el comprobante')
    expect(s.find('.g-form-section__actions button').exists()).toBe(true)
    expect(s.find('.g-form-section__help').text()).toBe('?')
    expect(s.find('.g-form-section__body p').text()).toBe('cuerpo')
    expect(w.findAll('section')[1].find('h4').exists()).toBe(true)
  })

  it('las props reservadas de la Fase 3 avisan y no llegan al DOM; sin título avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GFormSection, { attrs: { mode: 'collapsible' } })
    expect(w.find('section').attributes('mode')).toBeUndefined()
    const msgs = warn.mock.calls.map((c) => c[0]).join('\n')
    expect(msgs).toMatch(/Fase 3/)
    expect(msgs).toMatch(/title/)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('Orden de manejadores: contexto y propios antes que el consumidor (C8/C9)', () => {
  // Contexto simulado con provide manual (formKey es pública para esto)
  const order = []
  const Fake = defineComponent({
    setup(_, { slots }) {
      provide(formKey, {
        notifyInput: () => order.push('ctx:input'),
        notifyBlur: () => order.push('ctx:blur'),
        notifyChange: (n, reveal) => order.push(`ctx:change${reveal ? ':reveal' : ''}`),
        register: () => () => {}
      })
      return () => slots.default()
    }
  })
  const cases = [
    ['GInput', '<GInput label="x" name="n" @input="c(\'input\')" @focusout="c(\'blur\')" />', async (w) => { await w.find('input').setValue('a'); await w.find('input').trigger('focusout') }, ['ctx:input', 'input', 'ctx:blur', 'blur']],
    ['GTextarea', '<GTextarea label="x" name="n" @input="c(\'input\')" @focusout="c(\'blur\')" />', async (w) => { await w.find('textarea').setValue('a'); await w.find('textarea').trigger('focusout') }, ['ctx:input', 'input', 'ctx:blur', 'blur']],
    ['GCheckbox', '<GCheckbox label="x" name="n" @change="c(\'change\')" />', async (w) => { await w.find('input').setValue(true) }, ['ctx:change:reveal', 'change']],
    ['GSwitch', '<GSwitch label="x" name="n" @change="c(\'change\')" />', async (w) => { await w.find('input').setValue(true) }, ['ctx:change:reveal', 'change']],
    ['GSelect', '<GSelect label="x" name="n" :options="[]" @focusout="c(\'blur\')" />', async (w) => { await w.find('button').trigger('focusout') }, ['ctx:blur', 'blur']],
    ['GDatePicker', '<GDatePicker label="x" name="n" @focusout="c(\'blur\')" />', async (w) => { await w.find('button.g-datepicker__field').trigger('focusout') }, ['ctx:blur', 'blur']],
    ['GCheckboxGroup', '<GCheckboxGroup label="x" name="n" @change="c(\'change\')"><GCheckbox label="a" value="a" /></GCheckboxGroup>', async (w) => { await w.find('input').setValue(true) }, ['ctx:change:reveal', 'change']]
  ]
  for (const [name, tpl, act, expected] of cases) {
    it(`${name}`, async () => {
      order.length = 0
      const w = make(`<Fake>${tpl}</Fake>`, () => ({ c: (x) => order.push(x) }), { global: { components: { Fake } } })
      await act(w)
      expect(order.filter((x) => expected.includes(x))).toEqual(expected)
    })
  }
})

// ---------------------------------------------------------------------------------------------------------------
describe('GInput · prefijo y sufijo de texto (C13, #166)', () => {
  it('sin *Label el texto visible entra en aria-describedby antes de ayuda y mensaje', () => {
    const w = mount(GInput, { props: { id: 'p', label: 'Monto', prefix: '$', suffix: '%', hint: 'Ayuda', error: 'Mal' } })
    expect(w.find('.g-input').classes()).toEqual(expect.arrayContaining(['g-input--has-prefix', 'g-input--has-suffix']))
    expect(w.find('input').attributes('aria-describedby')).toBe('p-prefix p-suffix p-hint p-message')
    expect(w.find('#p-prefix').text()).toBe('$')
    expect(w.find('#p-prefix').attributes('aria-hidden')).toBeUndefined()
  })

  it('con *Label el visible es aria-hidden y el texto oculto (tras el visible, dentro de __control) lleva el id', () => {
    const w = mount(GInput, { props: { id: 'p', label: 'Peso', suffix: 'kg', suffixLabel: 'kilogramos' } })
    const vis = w.find('.g-input__suffix')
    expect(vis.attributes('aria-hidden')).toBe('true')
    expect(vis.attributes('id')).toBeUndefined()
    const lab = w.find('.g-input__control .g-input__suffix-label')
    expect(lab.attributes('id')).toBe('p-suffix')
    expect(lab.text()).toBe('kilogramos')
    expect(vis.element.nextElementSibling).toBe(lab.element)
    expect(w.find('input').attributes('aria-describedby')).toBe('p-suffix')
  })

  it('orden en la caja: prepend · prefijo · input · sufijo · append; pulsar sobre la unidad enfoca el input', async () => {
    const w = mount(GInput, { attachTo: document.body, props: { label: 'x', prefix: '$', suffix: 'MXN' }, slots: { prepend: '<i>p</i>', append: '<i>a</i>' } })
    const kids = [...w.find('.g-input__control').element.children].map((e) => e.className)
    expect(kids).toEqual(['g-input__prepend', 'g-input__prefix', 'g-input__field', 'g-input__suffix', 'g-input__append'])
    await w.find('.g-input__suffix').trigger('click')
    expect(document.activeElement).toBe(w.find('input').element)
    w.unmount()
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('Registro y GCheckboxGroup name (C10, C11)', () => {
  it('las casillas de un grupo toman su name y no se registran sueltas; el grupo es un elemento con enlace a la primera casilla', async () => {
    const onInvalid = vi.fn()
    const sel = ref([])
    const w = make(`<GForm :errors="{ avisos: 'Elige uno' }" @invalid="onInvalid"><GCheckboxGroup v-model="sel" label="Avisos" name="avisos"><GCheckbox id="c1" label="Correo" value="mail" /><GCheckbox label="SMS" value="sms" name="propio" /></GCheckboxGroup></GForm>`, () => ({ onInvalid, sel }))
    const [a, b] = w.findAll('input[type="checkbox"]')
    expect(a.attributes('name')).toBe('avisos')
    expect(b.attributes('name')).toBe('propio')
    await w.find('form').trigger('submit')
    await frame()
    expect(onInvalid.mock.calls[0][0].errors).toEqual([{ name: 'avisos', message: 'Elige uno', id: 'c1' }])
    expect(w.find('.g-checkbox-group__message').text()).toContain('Elige uno')
  })

  it('dos campos con el mismo name avisan en desarrollo', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    make('<GForm><GInput label="a" name="x" /><GInput label="b" name="x" /></GForm>')
    expect(warn.mock.calls.some((c) => /mismo name/.test(c[0]))).toBe(true)
  })

  it('useFormField sirve a campos propios del consumidor (registro, mensaje y marca)', async () => {
    const Custom = defineComponent({
      props: { name: String },
      setup(props) {
        const el = ref(null)
        const f = useFormField({ name: () => props.name, control: el, root: el, trigger: 'change' })
        return () => h('div', { ref: el, id: 'custom', tabindex: -1, 'data-mark': f.mark.value, 'data-invalid': String(f.invalid.value), onClick: f.notifyChange }, f.message.value ? f.message.value.text : '')
      }
    })
    const onInvalid = vi.fn()
    const w = make('<GForm :errors="{ c: \'Mal\' }" :labels="labels" @invalid="onInvalid"><Custom name="c" /></GForm>', () => ({ labels: LABELS, onInvalid }), { global: { components: { Custom } } })
    expect(w.find('#custom').attributes('data-mark')).toBe('optional')
    await w.find('#custom').trigger('click')
    await nextTick()
    expect(w.find('#custom').text()).toBe('Mal')
    await w.find('form').trigger('submit')
    await frame()
    expect(onInvalid.mock.calls[0][0].errors[0]).toEqual({ name: 'c', message: 'Mal', id: 'custom' })
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('Registro de las piezas (index.js y components.css)', () => {
  it('los seis CSS están en components.css y los componentes, useFormField y formKey se exportan', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const css = readFileSync(resolve(process.cwd(), 'src/styles/components.css'), 'utf8')
    for (const n of ['GForm', 'GFormSection', 'GFormLayout', 'GFormRow', 'GInputGroup', 'GFieldGroup', 'GFormActions', 'GErrorSummary']) {
      expect(css, n).toContain(`@import url("../components/${n}/${n}.css");`)
    }
    const lib = await import('../../index.js')
    for (const n of ['GForm', 'GFormSection', 'GFormLayout', 'GFormRow', 'GInputGroup', 'GInputGroupInput', 'GInputGroupSelect', 'GInputGroupText', 'GFieldGroup', 'GFormActions', 'GErrorSummary', 'useFormField', 'formKey']) expect(lib[n], n).toBeTruthy()
    // r02 (#183): GFormGrid se retira sin alias, y su hoja también
    expect(lib.GFormGrid).toBeUndefined()
    expect(css).not.toContain('GFormGrid')
    // Orden: los estilos del formulario van después de los campos (las filas leen sus pistas)
    expect(css.indexOf('GFormRow.css')).toBeGreaterThan(css.indexOf('GDatePicker.css'))
    expect(css.indexOf('GInputGroup.css')).toBeGreaterThan(css.indexOf('GInput.css'))
  })
})
