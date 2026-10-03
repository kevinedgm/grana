import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, provide, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GRadioGroup from './GRadioGroup.vue'
import GForm from '../GForm/GForm.vue'
import { formKey } from '../GForm/formContext.js'
import GFormLayout from '../GFormLayout/GFormLayout.vue'
import GFormRow from '../GFormRow/GFormRow.vue'
import GErrorSummary from '../GErrorSummary/GErrorSummary.vue'
import GInput from '../GInput/GInput.vue'

const SEXO = [{ value: 'F', label: 'Femenino' }, { value: 'M', label: 'Masculino' }, { value: 'X', label: 'Otro' }]
const MODALIDAD = [
  { value: 'presencial', label: 'Presencial', description: 'En el consultorio.', icon: 'globe' },
  { value: 'linea', label: 'En línea', description: 'Videollamada.' },
  { value: 'tel', label: 'Por teléfono', disabled: true }
]
const LABELS = { optional: '(opcional)', requiredHint: 'Los campos con * son obligatorios.', sectionOptional: 'Opcional', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ' }
const APPEARANCES = ['list', 'inline', 'segmented', 'chip', 'card']
const frame = () => new Promise((r) => setTimeout(r, 40))

const mounted = []
const track = (w) => { mounted.push(w); return w }
const make = (props = {}, opts = {}) => track(mount(GRadioGroup, { props: { id: 'g', label: 'Sexo', options: SEXO, ...props }, attachTo: document.body, ...opts }))
const components = { GRadioGroup, GForm, GFormLayout, GFormRow, GErrorSummary, GInput }
const makeT = (template, setup = () => ({}), opts = {}) => track(mount(defineComponent({ components, setup, template }), { attachTo: document.body, ...opts }))
const radios = (w) => w.findAll('input[type="radio"]')
const root = (w) => w.find('.g-radio-group')
const warns = (spy) => spy.mock.calls.map((c) => c[0]).filter((m) => typeof m === 'string' && m.startsWith('[Grana GRadioGroup]'))

afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------------------------------------------
describe('GRadioGroup · estructura (#268, #269)', () => {
  it('inline y segmented: <div role="radiogroup"> con tres hijos (etiqueta <span> · caja · pie)', () => {
    for (const appearance of ['inline', 'segmented']) {
      const w = make({ appearance })
      const r = root(w)
      expect(r.element.tagName).toBe('DIV')
      expect(r.attributes('role')).toBe('radiogroup')
      expect(r.attributes('aria-labelledby')).toBe('g-label')
      expect([...r.element.children].map((c) => `${c.tagName}.${c.className}`)).toEqual(['SPAN.g-radio-group__label', 'DIV.g-radio-group__options', 'DIV.g-radio-group__support'])
      expect(w.find('#g-label').text()).toBe('Sexo')
      w.unmount()
    }
  })

  it('list, chip y card: <fieldset role="radiogroup"> con <legend> y aria-labelledby a la leyenda', () => {
    for (const appearance of ['list', 'chip', 'card']) {
      const w = make({ appearance })
      const r = root(w)
      expect(r.element.tagName).toBe('FIELDSET')
      expect(r.attributes('role')).toBe('radiogroup')
      expect(r.attributes('aria-labelledby')).toBe('g-label')
      expect([...r.element.children].map((c) => `${c.tagName}.${c.className}`)).toEqual(['LEGEND.g-radio-group__label', 'DIV.g-radio-group__options', 'DIV.g-radio-group__support'])
      w.unmount()
    }
  })

  it('clases de raíz siempre (también list por defecto) y validadores de las props enumeradas', () => {
    const w = make()
    expect(root(w).classes()).toEqual(['g-radio-group', 'g-radio-group--appearance-list', 'g-radio-group--size-md', 'g-radio-group--density-default', 'g-radio-group--color-brand'])
    const v = make({ id: 'v', appearance: 'card', size: 'xl', density: 'compact', color: 'danger' })
    expect(root(v).classes()).toEqual(expect.arrayContaining(['g-radio-group--appearance-card', 'g-radio-group--size-xl', 'g-radio-group--density-compact', 'g-radio-group--color-danger']))
    for (const name of ['appearance', 'labelMode', 'size', 'density', 'color']) expect(GRadioGroup.props[name].validator('valor-invalido')).toBe(false)
    expect(GRadioGroup.props.appearance.validator('chips')).toBe(false)
    expect(GRadioGroup.props.labelMode.validator('auto')).toBe(false)
  })

  it('cada radio es hijo DIRECTO de su <label class="__option" for>, con name común y value = String(value)', () => {
    const w = make({ name: 'sexo', options: [{ value: 1, label: 'Uno' }, { value: true, label: 'Sí' }, { value: 'x', label: 'Equis' }] })
    const labels = w.findAll('label.g-radio-group__option')
    expect(labels).toHaveLength(3)
    labels.forEach((l, i) => {
      const input = l.element.firstElementChild
      expect(input.matches('input.g-radio-group__input[type="radio"]')).toBe(true)
      expect(input.parentElement).toBe(l.element)
      expect(l.attributes('for')).toBe(`g-${i}`)
      expect(input.id).toBe(`g-${i}`)
    })
    expect(radios(w).map((r) => r.attributes('name'))).toEqual(['sexo', 'sexo', 'sexo'])
    expect(radios(w).map((r) => r.element.value)).toEqual(['1', 'true', 'x'])
  })

  it('sin name genera uno estable y común; dos grupos de la misma aplicación no comparten el suyo', async () => {
    const model = ref(null)
    const w = makeT('<div><GRadioGroup id="a" label="A" :options="opts" v-model="model" /><GRadioGroup id="b" label="B" :options="opts" /></div>', () => ({ opts: SEXO, model }))
    const na = w.findAll('#a input').map((r) => r.attributes('name'))
    expect(new Set(na).size).toBe(1)
    expect(na[0]).toBeTruthy()
    expect(w.find('#b input').attributes('name')).not.toBe(na[0])
    await w.findAll('#a input')[1].setValue(true)
    expect(model.value).toBe('M')
    expect(w.find('#a input').attributes('name')).toBe(na[0])
  })

  it('nombre del radio = su etiqueta (aria-labelledby, dir="auto"); descripción solo en list y card, por aria-describedby; icono aria-hidden', () => {
    for (const appearance of APPEARANCES) {
      const w = make({ appearance, options: MODALIDAD })
      const [r0, r1] = radios(w)
      expect(r0.attributes('aria-labelledby')).toBe('g-0-label')
      const lab = w.find('#g-0-label')
      expect(lab.classes()).toContain('g-radio-group__option-label')
      expect(lab.attributes('dir')).toBe('auto')
      expect(lab.text()).toBe('Presencial')
      const withDesc = appearance === 'list' || appearance === 'card'
      expect(w.find('#g-0-description').exists()).toBe(withDesc)
      expect(r0.attributes('aria-describedby')).toBe(withDesc ? 'g-0-description' : undefined)
      if (withDesc) expect(w.find('#g-0-description').classes()).toContain('g-radio-group__description')
      expect(r1.attributes('aria-describedby')).toBe(withDesc ? 'g-1-description' : undefined)
      const icon = w.find('.g-radio-group__icon')
      expect(icon.attributes('aria-hidden')).toBe('true')
      expect(icon.find('svg').exists()).toBe(true)
      // __segment solo en segmented, envolviendo icono y texto
      expect(w.findAll('.g-radio-group__segment').length).toBe(appearance === 'segmented' ? 3 : 0)
      if (appearance === 'segmented') expect([...w.find('.g-radio-group__segment').element.children].map((c) => c.className)).toEqual(['g-radio-group__icon', 'g-radio-group__text'])
      w.unmount()
    }
  })

  it('sin etiqueta visible: sin __label; el aria-label / aria-labelledby del consumidor va en la raíz', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = make({ label: undefined }, { attrs: { 'aria-labelledby': 'fuera' } })
    expect(w.find('.g-radio-group__label').exists()).toBe(false)
    expect(root(w).attributes('aria-labelledby')).toBe('fuera')
    const v = make({ id: 'v', label: undefined }, { attrs: { 'aria-label': 'Sexo' } })
    expect(root(v).attributes('aria-label')).toBe('Sexo')
    expect(root(v).attributes('aria-labelledby')).toBeUndefined()
    // con etiqueta visible, la propia gana a la del consumidor
    const x = make({ id: 'x' }, { attrs: { 'aria-labelledby': 'fuera' } })
    expect(root(x).attributes('aria-labelledby')).toBe('x-label')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GRadioGroup · estados del grupo solo en la raíz (#269)', () => {
  it('required: aria-required en la raíz y asterisco aria-hidden; nunca required nativo ni aria-required en los radios', () => {
    for (const appearance of APPEARANCES) {
      const w = make({ appearance, required: true })
      expect(root(w).attributes('aria-required')).toBe('true')
      expect(w.findAll('input[required]')).toHaveLength(0)
      expect(w.findAll('input[aria-required]')).toHaveLength(0)
      expect(w.find('.g-radio-group__label .g-radio-group__required').attributes('aria-hidden')).toBe('true')
      w.unmount()
    }
  })

  it('error: aria-invalid y el mensaje en el aria-describedby de la raíz, nunca en los radios; icono y región siempre presente', async () => {
    const w = make({ hint: 'Ayuda' }, { attrs: { 'aria-describedby': 'ext' } })
    const msg = () => w.find('.g-radio-group__message')
    expect(msg().exists()).toBe(true)
    expect(msg().attributes('id')).toBe('g-message')
    expect(msg().attributes('aria-live')).toBe('polite')
    expect(msg().text()).toBe('')
    expect(root(w).attributes('aria-describedby')).toBe('ext g-hint')
    expect(root(w).attributes('aria-invalid')).toBeUndefined()
    await w.setProps({ error: 'Elige el sexo' })
    expect(root(w).attributes('aria-invalid')).toBe('true')
    expect(root(w).attributes('aria-describedby')).toBe('ext g-hint g-message')
    expect(root(w).classes()).toContain('is-invalid')
    expect(msg().find('svg.g-radio-group__message-icon').exists()).toBe(true)
    expect(msg().text()).toBe('Elige el sexo')
    expect(w.findAll('input[aria-invalid]')).toHaveLength(0)
    expect(w.findAll('input[aria-describedby]')).toHaveLength(0)
  })

  it('warning y valid: is-warning / is-valid sin aria-invalid', async () => {
    const w = make({ warning: 'Revisa' })
    expect(root(w).classes()).toContain('is-warning')
    expect(root(w).attributes('aria-invalid')).toBeUndefined()
    await w.setProps({ warning: undefined, valid: 'Bien' })
    expect(root(w).classes()).toContain('is-valid')
    expect(w.find('.g-radio-group__message').text()).toBe('Bien')
  })

  it('readonly: aria-readonly e is-readonly en la raíz; radios habilitados', () => {
    const w = make({ readonly: true, modelValue: 'M' })
    expect(root(w).attributes('aria-readonly')).toBe('true')
    expect(root(w).classes()).toContain('is-readonly')
    expect(radios(w).every((r) => !r.element.disabled)).toBe(true)
    expect(w.findAll('input[aria-readonly]')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GRadioGroup · modelo (v-model)', () => {
  it('modelValue String, Number y Boolean: marca la opción por === y emite el value con su tipo original', async () => {
    const cases = [
      [[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], 'a', 'b'],
      [[{ value: 1, label: 'Uno' }, { value: 2, label: 'Dos' }], 1, 2],
      [[{ value: true, label: 'Sí' }, { value: false, label: 'No' }], true, false]
    ]
    for (const [options, initial, next] of cases) {
      const w = make({ options, modelValue: initial })
      expect(radios(w).map((r) => r.element.checked)).toEqual([true, false])
      await radios(w)[1].setValue(true)
      expect(w.emitted('update:modelValue').at(-1)).toEqual([next])
      expect(typeof w.emitted('update:modelValue').at(-1)[0]).toBe(typeof next)
      w.unmount()
    }
  })

  it("'1' no marca la opción 1 (comparación ===)", () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = make({ options: [{ value: 1, label: 'Uno' }, { value: 2, label: 'Dos' }], modelValue: '1' })
    expect(radios(w).some((r) => r.element.checked)).toBe(false)
  })

  it('la prop ausente es null (no false): un «No» con value false no sale marcado; null/undefined = sin selección', async () => {
    const yesNo = [{ value: true, label: 'Sí' }, { value: false, label: 'No' }]
    const w = make({ options: yesNo })
    expect(w.props('modelValue')).toBeNull()
    expect(radios(w).some((r) => r.element.checked)).toBe(false)
    await w.setProps({ modelValue: false })
    expect(radios(w).map((r) => r.element.checked)).toEqual([false, true])
    await w.setProps({ modelValue: null })
    expect(radios(w).some((r) => r.element.checked)).toBe(false)
  })

  it("'' no se convierte en true (String antes de Boolean)", () => {
    const w = make({ options: [{ value: '', label: 'Ninguno' }, { value: 'a', label: 'A' }], modelValue: '' })
    expect(w.props('modelValue')).toBe('')
    expect(radios(w)[0].element.checked).toBe(true)
  })

  it('controlado: si el consumidor no actualiza el modelo, el checked del DOM vuelve a alinearse', async () => {
    const w = make({ modelValue: 'F' })
    await radios(w)[2].setValue(true)
    expect(w.emitted('update:modelValue')[0]).toEqual(['X'])
    await nextTick()
    expect(radios(w).map((r) => r.element.checked)).toEqual([true, false, false])
  })

  it('v-model real: el padre recibe el valor y una sola emisión por elección; cambiar el modelo desde fuera no emite', async () => {
    const model = ref(null)
    const w = makeT('<GRadioGroup id="g" label="Sexo" :options="opts" v-model="model" />', () => ({ model, opts: SEXO }))
    await radios(w)[1].trigger('click')
    expect(model.value).toBe('M')
    expect(radios(w)[1].element.checked).toBe(true)
    model.value = 'X'
    await nextTick()
    expect(radios(w).map((r) => r.element.checked)).toEqual([false, false, true])
    expect(w.findComponent(GRadioGroup).emitted('update:modelValue')).toHaveLength(1)
  })

  it('FormData: el grupo envía String(value) de la elegida; sin selección no aparece', async () => {
    const w = makeT('<form id="f"><GRadioGroup id="a" name="a" label="A" :options="[{ value: 1, label: \'Uno\' }, { value: 2, label: \'Dos\' }]" :model-value="2" /><GRadioGroup id="b" name="b" label="B" :options="opts" /></form>', () => ({ opts: SEXO }))
    const fd = new FormData(w.find('form').element)
    expect(fd.get('a')).toBe('2')
    expect(fd.has('b')).toBe(false)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GRadioGroup · teclado nativo y solo lectura (#272)', () => {
  const key = (w, k, i = 0) => {
    const ev = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
    radios(w)[i].element.dispatchEvent(ev)
    return ev.defaultPrevented
  }

  it('sin readonly no intercepta ninguna tecla (flechas, Espacio, Enter, Tab)', () => {
    const w = make({ modelValue: 'F' })
    for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', ' ', 'Enter', 'Tab']) expect(key(w, k), k).toBe(false)
  })

  it('readonly: cancela el keydown de las cuatro flechas; Tab, Espacio y Enter pasan', () => {
    const w = make({ modelValue: 'M', readonly: true })
    for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) expect(key(w, k, 1), k).toBe(true)
    for (const k of ['Tab', ' ', 'Enter']) expect(key(w, k, 1), k).toBe(false)
  })

  it('readonly: el clic en el radio y en su etiqueta se cancela, sin emitir; la elegida sigue en FormData', async () => {
    const up = vi.fn()
    const w = makeT('<form><GRadioGroup id="g" name="sexo" label="Sexo" :options="opts" model-value="M" readonly @update:model-value="up" /></form>', () => ({ opts: SEXO, up }))
    const r = w.findAll('input[type="radio"]')
    r[0].element.click()
    w.find('label[for="g-2"]').element.click()
    await nextTick()
    expect(r.map((x) => x.element.checked)).toEqual([false, true, false])
    expect(new FormData(w.find('form').element).get('sexo')).toBe('M')
    expect(w.findComponent(GRadioGroup).emitted('update:modelValue')).toBeUndefined()
    expect(r.every((x) => !x.element.disabled)).toBe(true)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GRadioGroup · deshabilitado', () => {
  it('fieldset (list, chip, card): disabled nativo en el <fieldset> e is-disabled; fuera de FormData', () => {
    const w = makeT('<form><GRadioGroup id="g" name="m" label="M" appearance="card" :options="opts" model-value="F" disabled /></form>', () => ({ opts: SEXO }))
    const fs = w.find('fieldset')
    expect(fs.attributes('disabled')).toBeDefined()
    expect(fs.classes()).toContain('is-disabled')
    expect(w.findAll('input').every((r) => r.element.matches(':disabled'))).toBe(true)
    expect(new FormData(w.find('form').element).has('m')).toBe(false)
  })

  it('div (inline, segmented): disabled en cada radio; la raíz no lleva disabled', () => {
    const w = make({ appearance: 'segmented', disabled: true })
    expect(root(w).attributes('disabled')).toBeUndefined()
    expect(root(w).classes()).toContain('is-disabled')
    expect(radios(w).every((r) => r.element.disabled)).toBe(true)
  })

  it('por opción: is-disabled en su <label> y disabled en su radio; elegirla no es posible', async () => {
    const w = make({ options: MODALIDAD })
    const labels = w.findAll('label.g-radio-group__option')
    expect(labels.map((l) => l.classes().includes('is-disabled'))).toEqual([false, false, true])
    expect(radios(w).map((r) => r.element.disabled)).toEqual([false, false, true])
    radios(w)[2].element.click()
    await nextTick()
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('la opción elegida deshabilitada se pinta como se pide y avisa (usa readonly)', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = make({ options: MODALIDAD, modelValue: 'tel' })
    expect(radios(w)[2].element.checked).toBe(true)
    expect(warns(spy).some((m) => /elegida.*deshabilitada.*readonly/.test(m))).toBe(true)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GRadioGroup · solo icono (labelMode="icon")', () => {
  const ICONS = [{ value: 'l', label: 'Lista', icon: 'circle' }, { value: 't', label: 'Tabla', icon: 'square' }, { value: 'g', label: 'Gráfica' }]

  it('segmented y chip: is-icon-only en cada opción con icono; la etiqueta sigue en el DOM como nombre; la que no tiene icono la conserva y avisa', () => {
    for (const appearance of ['segmented', 'chip']) {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const w = make({ appearance, labelMode: 'icon', options: ICONS })
      expect(root(w).classes()).toContain('g-radio-group--icon-only')
      const labels = w.findAll('label.g-radio-group__option')
      expect(labels.map((l) => l.classes().includes('is-icon-only'))).toEqual([true, true, false])
      expect(w.find('#g-0-label').text()).toBe('Lista')
      expect(radios(w)[0].attributes('aria-labelledby')).toBe('g-0-label')
      expect(warns(spy).some((m) => /necesita `icon` en cada opción/.test(m))).toBe(true)
      w.unmount()
      spy.mockRestore()
    }
  })

  it('fuera de segmented y chip cuenta como full y avisa; con slot option no tiene efecto y avisa', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = make({ appearance: 'list', labelMode: 'icon', options: ICONS })
    expect(w.findAll('.is-icon-only')).toHaveLength(0)
    expect(root(w).classes()).not.toContain('g-radio-group--icon-only')
    const v = make({ id: 'v', appearance: 'chip', labelMode: 'icon', options: ICONS }, { slots: { option: '<b>x</b>' } })
    expect(v.findAll('.is-icon-only')).toHaveLength(0)
    const m = warns(spy)
    expect(m.some((x) => /solo se admite en segmented y chip/.test(x))).toBe(true)
    expect(m.some((x) => /no tiene efecto con el slot `option`/.test(x))).toBe(true)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GRadioGroup · slots', () => {
  it('label, hint y error con contenido rico en sus sitios', () => {
    const w = make({ error: 'x' }, { slots: { label: '<em>Sexo</em>', hint: '<b>Ayuda</b>', error: '<i>Elige</i>' } })
    expect(w.find('#g-label em').text()).toBe('Sexo')
    expect(w.find('#g-hint b').text()).toBe('Ayuda')
    expect(root(w).attributes('aria-describedby')).toBe('g-hint g-message')
    expect(w.find('#g-message i').text()).toBe('Elige')
  })

  it('option: sustituye a icono, etiqueta y descripción dentro de ID-i-label (todo es el nombre); recibe option, index, checked y disabled', () => {
    const w = make({ appearance: 'card', options: MODALIDAD, modelValue: 'linea' }, {
      slots: { option: ({ option, index, checked, disabled }) => h('span', { class: 'mine' }, `${index}:${option.label}:${checked}:${disabled}`) }
    })
    const lab = w.find('#g-1-label')
    expect(lab.classes()).toContain('g-radio-group__option-label')
    expect(lab.find('.mine').text()).toBe('1:En línea:true:false')
    expect(w.find('#g-2-label .mine').text()).toBe('2:Por teléfono:false:true')
    expect(w.find('.g-radio-group__icon').exists()).toBe(false)
    expect(w.find('.g-radio-group__description').exists()).toBe(false)
    expect(radios(w)[0].attributes('aria-describedby')).toBeUndefined()
    // el <input> lo sigue poniendo el componente, hijo directo de la <label>
    expect(w.find('label[for="g-0"] > input.g-radio-group__input').exists()).toBe(true)
  })

  it('icon: manda sobre option.icon; solo en las opciones con icon (cualquier valor); recibe option, index y checked', () => {
    const opts = [{ value: 'a', label: 'A', icon: { custom: 1 } }, { value: 'b', label: 'B', icon: 'globe' }, { value: 'c', label: 'C' }]
    const w = make({ appearance: 'chip', options: opts, modelValue: 'b' }, {
      slots: { icon: ({ option, index, checked }) => h('i', { class: 'own' }, `${index}${option.value}${checked}`) }
    })
    const icons = w.findAll('.g-radio-group__icon')
    expect(icons).toHaveLength(2)
    expect(icons.map((i) => i.find('.own').text())).toEqual(['0afalse', '1btrue'])
    expect(w.find('.g-radio-group__icon svg').exists()).toBe(false)
    icons.forEach((i) => expect(i.attributes('aria-hidden')).toBe('true'))
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GRadioGroup · field: false (#262)', () => {
  it('sin __message ni aria-live; pie solo con ayuda; error, warning, valid, required y mark se ignoran con un aviso', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = make({ field: false, error: 'Mal', warning: 'Ojo', valid: 'Bien', required: true, mark: true })
    expect(w.find('.g-radio-group__message').exists()).toBe(false)
    expect(w.find('[aria-live]').exists()).toBe(false)
    expect(w.find('.g-radio-group__support').exists()).toBe(false)
    expect(root(w).attributes('aria-invalid')).toBeUndefined()
    expect(root(w).attributes('aria-required')).toBeUndefined()
    expect(w.find('.g-radio-group__required').exists()).toBe(false)
    const m = warns(spy).filter((x) => /field: false/.test(x))
    expect(m).toHaveLength(1)
    for (const k of ['error', 'warning', 'valid', 'required', 'mark']) expect(m[0]).toContain(`\`${k}\``)
    const v = make({ id: 'v', field: false, hint: 'Ayuda' })
    expect(v.find('.g-radio-group__support').exists()).toBe(true)
    expect(v.find('.g-radio-group__support > .g-radio-group__hint').exists()).toBe(true)
  })

  it('no lee el contexto de GForm: ni readonly, ni disabled, ni densidad, ni errores', () => {
    const w = makeT('<GForm readonly disabled density="compact" :errors="{ v: \'Mal\' }"><GRadioGroup id="g" name="v" label="Vista" :options="opts" :field="false" /></GForm>', () => ({ opts: SEXO }))
    const r = w.find('.g-radio-group')
    expect(r.classes()).toEqual(expect.arrayContaining(['g-radio-group--density-default']))
    expect(r.classes()).not.toContain('is-readonly')
    expect(r.classes()).not.toContain('is-disabled')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GRadioGroup · dentro de GForm (form.md §2; trigger change, control, marcas)', () => {
  it('un cambio revela el error (trigger change); aria-invalid en la raíz, prefijo oculto e icono', async () => {
    const w = makeT('<GForm :errors="{ sexo: \'Elige otra\' }" :labels="labels"><GRadioGroup id="g" name="sexo" label="Sexo" :options="opts" /></GForm>', () => ({ opts: SEXO, labels: LABELS }))
    const msg = () => w.find('.g-radio-group__message')
    expect(msg().text()).toBe('')
    await w.find('.g-radio-group').trigger('focusout')
    expect(msg().text()).toBe('')
    await w.findAll('input')[1].setValue(true)
    await nextTick()
    expect(msg().text()).toBe('Error: Elige otra')
    expect(msg().find('.g-radio-group__message-type').text()).toBe('Error:')
    expect(w.find('.g-radio-group').attributes('aria-invalid')).toBe('true')
    expect(w.findAll('input[aria-invalid]')).toHaveLength(0)
  })

  it('marcas (markRule both): «(opcional)» con marks optional; asterisco con marks required; readonly heredado sin marca ni bloqueo', () => {
    const w = makeT('<GForm :labels="labels"><GRadioGroup id="a" name="a" label="A" :options="opts" /><GRadioGroup id="b" name="b" label="B" :options="opts" required /></GForm>', () => ({ opts: SEXO, labels: LABELS }))
    expect(w.find('#a-label').text()).toBe('A (opcional)')
    expect(w.find('#a-label .g-radio-group__optional').exists()).toBe(true)
    expect(w.find('#b-label .g-radio-group__required').exists()).toBe(false)
    expect(w.find('#b').attributes('aria-required')).toBe('true')
    const r = makeT('<GForm marks="required" :labels="labels"><GRadioGroup id="c" name="c" label="C" :options="opts" required /></GForm>', () => ({ opts: SEXO, labels: LABELS }))
    expect(r.find('#c-label .g-radio-group__required').attributes('aria-hidden')).toBe('true')
    const ro = makeT('<GForm readonly :labels="labels"><GRadioGroup id="d" name="d" label="D" :options="opts" required model-value="F" /></GForm>', () => ({ opts: SEXO, labels: LABELS }))
    const d = ro.find('#d')
    expect(d.classes()).toContain('is-readonly')
    expect(d.attributes('aria-readonly')).toBe('true')
    expect(d.find('.g-radio-group__required').exists()).toBe(false)
    expect(d.find('.g-radio-group__optional').exists()).toBe(false)
    expect(ro.findAll('#d input').every((x) => !x.element.disabled)).toBe(true)
  })

  it('el envío revela; invalid y GErrorSummary apuntan al radio por el que entraría Tab (la elegida, o la primera habilitada)', async () => {
    const onInvalid = vi.fn()
    const model = ref(null)
    const w = makeT(`<GForm :errors="{ m: 'Elige la modalidad' }" :labels="labels" @invalid="onInvalid"><GErrorSummary :labels="{ title: 'x' }" /><GRadioGroup id="g" name="m" label="Modalidad" :options="opts" v-model="model" /></GForm>`, () => ({ opts: [{ value: 'a', label: 'A', disabled: true }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }], labels: LABELS, onInvalid, model }))
    await w.find('form').trigger('submit')
    await frame()
    expect(onInvalid.mock.calls[0][0].errors).toEqual([{ name: 'm', message: 'Elige la modalidad', id: 'g-1' }])
    const link = w.find('.g-error-summary__link')
    expect(link.attributes('href')).toBe('#g-1')
    const rootEl = w.find('.g-radio-group').element
    rootEl.scrollIntoView = vi.fn()
    await link.trigger('click')
    await nextTick()
    expect(rootEl.scrollIntoView).toHaveBeenCalled()
    expect(document.activeElement.id).toBe('g-1')
    // con elegida, el destino es la elegida
    model.value = 'c'
    await nextTick()
    await w.find('form').trigger('submit')
    await frame()
    expect(onInvalid.mock.calls.at(-1)[0].errors[0].id).toBe('g-2')
  })

  it('hereda densidad y disabled del contexto; la prop explícita gana', () => {
    const w = makeT('<GForm density="compact" disabled><GRadioGroup id="a" name="a" label="A" :options="opts" /><GRadioGroup id="b" name="b" label="B" :options="opts" density="default" :disabled="false" /></GForm>', () => ({ opts: SEXO }))
    expect(w.find('#a').classes()).toEqual(expect.arrayContaining(['g-radio-group--density-compact', 'is-disabled']))
    expect(w.find('#b').classes()).toContain('g-radio-group--density-default')
    expect(w.find('#b').classes()).not.toContain('is-disabled')
  })

  it('orden de manejadores (C8): contexto, propio y después el @change del consumidor, que ya ve el modelo actualizado', async () => {
    const order = []
    const Fake = defineComponent({
      setup(_, { slots }) {
        provide(formKey, { notifyInput: () => {}, notifyBlur: () => order.push('ctx:blur'), notifyChange: (n, reveal) => order.push(`ctx:change${reveal ? ':reveal' : ''}`), register: () => () => {} })
        return () => slots.default()
      }
    })
    const model = ref('F')
    const w = makeT('<Fake><GRadioGroup id="g" name="n" label="x" :options="opts" v-model="model" @change="c" @focusout="order.push(\'blur\')" /></Fake>', () => ({ opts: SEXO, model, order, c: () => order.push(`change:${model.value}`) }), { global: { components: { Fake } } })
    await w.findAll('input')[1].setValue(true)
    await w.findAll('input')[1].trigger('focusout')
    expect(order).toEqual(['ctx:change:reveal', 'change:M', 'ctx:blur', 'blur'])
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GRadioGroup · segmentado: medida, apilado y mínimo intrínseco (#271)', () => {
  class FakeRO {
    static all = []
    constructor(cb) { this.cb = cb; this.els = []; FakeRO.all.push(this) }
    observe(el) { this.els.push(el) }
    unobserve(el) { this.els = this.els.filter((e) => e !== el) }
    disconnect() { this.els = [] }
    fire(el, width) { this.cb([{ target: el, contentBoxSize: [{ inlineSize: width, blockSize: 40 }], contentRect: { width, height: 40 } }]) }
  }
  const roOf = (el) => FakeRO.all.find((o) => o.els.includes(el))
  // Maquetación simulada: cada __segment mide SEG px; la caja __options, BOX px; la fila, su ancho por FakeRO
  let SEG = 100
  let BOX = 400
  let measured = []
  beforeEach(() => {
    FakeRO.all = []
    SEG = 100
    BOX = 400
    measured = []
    vi.stubGlobal('ResizeObserver', FakeRO)
    const orig = Element.prototype.getBoundingClientRect
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.classList.contains('g-radio-group__segment')) {
        measured.push(this.closest('.g-radio-group').classList.contains('g-radio-group--measure'))
        return { width: SEG, height: 20, top: 0, left: 0, right: SEG, bottom: 20 }
      }
      if (this.classList.contains('g-radio-group__options')) return { width: BOX, height: 36, top: 0, left: 0, right: BOX, bottom: 36 }
      return orig.call(this)
    })
  })

  it('mide con g-radio-group--measure puesta y la quita; cabe → una línea; no cabe → is-stacked (tolerancia 0,5px)', async () => {
    BOX = 300
    const w = make({ appearance: 'segmented' })
    expect(measured.length).toBe(3)
    expect(measured.every(Boolean)).toBe(true)
    expect(root(w).classes()).not.toContain('g-radio-group--measure')
    await nextTick()
    expect(root(w).classes()).not.toContain('is-stacked')
    // la caja se estrecha: el observador decide en el cuadro siguiente (no en su devolución)
    BOX = 299.4
    const box = w.find('.g-radio-group__options').element
    roOf(box).fire(box, BOX)
    await nextTick()
    expect(root(w).classes()).not.toContain('is-stacked')
    await frame()
    expect(root(w).classes()).toContain('is-stacked')
    BOX = 299.6
    roOf(box).fire(box, BOX)
    await frame()
    expect(root(w).classes()).not.toContain('is-stacked')
  })

  it('al cambiar options, labelMode, size, density o appearance vuelve a medir; fuera de segmented no hay is-stacked', async () => {
    BOX = 250
    const w = make({ appearance: 'segmented', options: SEXO.slice(0, 2) })
    await nextTick()
    expect(root(w).classes()).not.toContain('is-stacked')
    await w.setProps({ options: SEXO })
    await nextTick()
    expect(root(w).classes()).toContain('is-stacked')
    SEG = 50
    await w.setProps({ size: 'sm' })
    await nextTick()
    expect(root(w).classes()).not.toContain('is-stacked')
    SEG = 100
    await w.setProps({ appearance: 'inline' })
    await nextTick()
    expect(root(w).classes()).not.toContain('is-stacked')
  })

  it('un solo ResizeObserver para todos los segmentados; al desmontar deja de observar', () => {
    const a = make({ id: 'a', appearance: 'segmented' })
    make({ id: 'b', appearance: 'segmented' })
    make({ id: 'c', appearance: 'list' })
    const ro = roOf(a.find('.g-radio-group__options').element)
    expect(FakeRO.all).toHaveLength(1)
    expect(ro.els).toHaveLength(2)
    a.unmount()
    expect(ro.els).toHaveLength(1)
  })

  it('publica su ancho natural a GFormRow (setIntrinsicMin): la fila se parte antes de que el segmentado se apile', async () => {
    const opts = ref(SEXO)
    const appearance = ref('segmented')
    const w = makeT('<GFormRow id="r"><GInput label="Fecha" /><GRadioGroup id="s" name="s" label="Sexo" :options="opts" :appearance="appearance" /></GFormRow>', () => ({ opts, appearance }))
    const row = w.find('#r').element
    // 2 × md (mínimo 160px) en 400px cabrían en una línea; el segmentado necesita 3 × 100 = 300px
    roOf(row).fire(row, 400)
    await frame()
    expect(row.dataset.lines).toBe('2')
    // menos opciones: 2 × 100 = 200 > 400/2 → aún dos líneas; con 1 opción (100) y dos hijos: una línea
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    opts.value = SEXO.slice(0, 1)
    await nextTick()
    await frame()
    expect(row.dataset.lines).toBe('1')
    // dejar de ser segmentado retira el mínimo
    opts.value = SEXO
    await nextTick()
    await frame()
    expect(row.dataset.lines).toBe('2')
    appearance.value = 'inline'
    await nextTick()
    await frame()
    expect(row.dataset.lines).toBe('1')
  })

  it('al desmontar retira el mínimo publicado', async () => {
    const show = ref(true)
    const w = makeT('<GFormRow id="r"><GInput label="Fecha" /><GInput label="Otro" /><GRadioGroup v-if="show" id="s" name="s" label="Sexo" :options="opts" appearance="segmented" /></GFormRow>', () => ({ show, opts: SEXO }))
    const row = w.find('#r').element
    roOf(row).fire(row, 600)
    await frame()
    expect(row.dataset.lines).toBe('2')
    show.value = false
    await nextTick()
    await frame()
    expect(row.dataset.lines).toBe('1')
  })

  it('SSR (renderToString, sin medir): una línea, sin is-stacked ni clase de medida', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(GRadioGroup, { id: 's', label: 'Sexo', name: 'sexo', appearance: 'segmented', options: SEXO, modelValue: 'M' }) }))
    expect(html).toContain('g-radio-group--appearance-segmented')
    expect(html).not.toContain('is-stacked')
    expect(html).not.toContain('g-radio-group--measure')
    expect(html).toContain('role="radiogroup"')
    expect((html.match(/class="g-radio-group__segment"/g) || []).length).toBe(3)
    expect(html).toMatch(/id="s-1"[^>]*checked/)
  })

  it('sin ResizeObserver: mide al montar y no falla', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    BOX = 200
    const w = make({ appearance: 'segmented' })
    return nextTick().then(() => expect(root(w).classes()).toContain('is-stacked'))
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GRadioGroup · en GFormRow y GErrorSummary (encargos del contrato)', () => {
  it('GFormRow avisa si list, chip o card comparten fila; inline y segmented son admitidos', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    makeT('<div><GFormRow><GInput label="A" /><GRadioGroup label="L" :options="opts" appearance="card" /></GFormRow><GFormRow><GInput label="B" /><GRadioGroup label="I" :options="opts" appearance="inline" /><GRadioGroup label="S" :options="opts" appearance="segmented" /></GFormRow></div>', () => ({ opts: SEXO }))
    const msgs = spy.mock.calls.map((c) => c[0]).filter((m) => m.startsWith('[Grana GFormRow]'))
    expect(msgs.filter((m) => /g-radio-group.*propia fila/.test(m))).toHaveLength(1)
  })

  it('la raíz depende de la apariencia, nunca del contexto (dentro de GFormLayout sigue siendo div)', () => {
    const w = makeT('<GFormLayout><GRadioGroup id="g" label="L" :options="opts" appearance="segmented" /></GFormLayout>', () => ({ opts: SEXO }))
    expect(w.find('#g').element.tagName).toBe('DIV')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GRadioGroup · avisos de desarrollo (una vez por instancia y mensaje)', () => {
  it('los diez avisos', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    make({ id: 'a', label: undefined }) // 1
    make({ id: 'b', options: [{ value: 'a', label: 'A' }] }) // 2 (menos de 2)
    make({ id: 'c', appearance: 'segmented', options: Array.from({ length: 7 }, (_, i) => ({ value: i, label: `O${i}` })) }) // 2 (más de 6)
    make({ id: 'd', options: [{ value: null, label: 'N' }, { value: 'x' }, { label: 'G', options: [] }, ...SEXO] }) // 3
    make({ id: 'e', options: [{ value: 1, label: 'Uno' }, { value: '1', label: 'Uno texto' }] }) // 4
    make({ id: 'f', modelValue: 'Z' }) // 5
    make({ id: 'g2', options: MODALIDAD, modelValue: 'tel' }) // 6
    make({ id: 'h', appearance: 'inline', options: MODALIDAD }) // 7
    make({ id: 'i', appearance: 'card', labelMode: 'icon' }) // 8
    makeT('<form><GRadioGroup label="Sin name" :options="opts" /></form>', () => ({ opts: SEXO })) // 9
    make({ id: 'k', field: false, error: 'x' }) // 10
    const m = warns(spy).join('\n')
    expect(m).toMatch(/nombre accesible/)
    expect(m).toMatch(/1 opción\(es\) válida/)
    expect(m).toMatch(/más de 6/)
    expect(m).toMatch(/sin value .* se ignora/)
    expect(m).toMatch(/con `options` \(grupo\) se ignora/)
    expect(m).toMatch(/value repetido/)
    expect(m).toMatch(/«Z» no está en options/)
    expect(m).toMatch(/elegida .*deshabilitada/)
    expect(m).toMatch(/`description` solo se muestra en list y card/)
    expect(m).toMatch(/labelMode="icon" solo se admite/)
    expect(m).toMatch(/<form> sin `name`/)
    expect(m).toMatch(/field: false/)
  })

  it('una vez por instancia: re-renderizar no repite el aviso; sin problemas no avisa', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = make({ modelValue: 'Z' })
    await w.setProps({ hint: 'a' })
    await w.setProps({ modelValue: 'Z', hint: 'b' })
    expect(warns(spy).filter((x) => /«Z»/.test(x))).toHaveLength(1)
    spy.mockClear()
    make({ id: 'ok', name: 'ok', modelValue: 'F' })
    expect(warns(spy)).toEqual([])
  })

  it('las opciones inválidas se descartan y los ids siguen el índice tras descartarlas', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = make({ options: [{ value: undefined, label: 'U' }, { value: 'a', label: 'A' }, { value: 'b', label: '' }, { value: 'c', label: 'C' }] })
    expect(radios(w).map((r) => [r.attributes('id'), r.element.value])).toEqual([['g-0', 'a'], ['g-1', 'c']])
  })
})
