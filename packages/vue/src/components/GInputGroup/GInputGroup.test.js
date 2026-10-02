import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, reactive, ref } from 'vue'
import GInputGroup from './GInputGroup.vue'
import GInputGroupInput from './GInputGroupInput.vue'
import GInputGroupSelect from './GInputGroupSelect.vue'
import GInputGroupText from './GInputGroupText.vue'
import GForm from '../GForm/GForm.vue'
import GErrorSummary from '../GErrorSummary/GErrorSummary.vue'
import GInput from '../GInput/GInput.vue'

const components = { GInputGroup, GInputGroupInput, GInputGroupSelect, GInputGroupText, GForm, GErrorSummary, GInput }
const LABELS = { optional: '(opcional)', requiredHint: 'Los campos con * son obligatorios.', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ' }
const PAISES = [{ value: '+52', label: 'MX +52' }, { value: '+1', label: 'US +1' }]
const frame = () => new Promise((r) => setTimeout(r, 40))
const mounted = []
function make(template, setup = () => ({})) {
  const w = mount(defineComponent({ components, setup, template }), { attachTo: document.body })
  mounted.push(w)
  return w
}
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  vi.restoreAllMocks()
})
// Nombre accesible simplificado (aria-labelledby › <label for>, sin lo aria-hidden), suficiente para estas estructuras
const visibleText = (node) => {
  const c = node.cloneNode(true)
  c.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove())
  return c.textContent.trim()
}
function accName(el) {
  const by = el.getAttribute('aria-labelledby')
  if (by) return by.split(' ').map((id) => visibleText(document.getElementById(id))).join(' ')
  const l = document.querySelector(`label[for="${el.id}"]`)
  return l ? visibleText(l) : ''
}
const describedTexts = (el) => (el.getAttribute('aria-describedby') || '').split(' ').filter(Boolean).map((id) => document.getElementById(id)?.textContent.trim())

const PHONE = `<GInputGroup id="tel" label="Teléfono" name="telefono" required hint="Solo para la cita" style="--g-form-min: 50" class="g-form-w-md">
    <GInputGroupSelect id="pais" v-model="v.pais" name="tel-pais" part-label="Código de país" :options="paises" autocomplete="tel-country-code" />
    <GInputGroupInput id="num" v-model="v.num" name="tel-numero" principal type="tel" autocomplete="tel-national" placeholder="951 123 4567" />
  </GInputGroup>`
const PRESSURE = `<GInputGroup id="pa" label="Presión arterial" name="presion">
    <GInputGroupInput id="sis" name="pa-sistolica" principal part-label="sistólica" inputmode="numeric" />
    <GInputGroupText text="/" decorative />
    <GInputGroupInput id="dia" name="pa-diastolica" part-label="diastólica" inputmode="numeric" />
    <GInputGroupText id="u" text="mmHg" label="milímetros de mercurio" />
  </GInputGroup>`

describe('GInputGroup · estructura y nombres (form.md §13)', () => {
  it('raíz role="group" nombrada por la etiqueta; tres hijos (etiqueta, caja, pie); label for → principal; clases', async () => {
    const w = make(PHONE, () => ({ v: reactive({ pais: '+52', num: '' }), paises: PAISES }))
    await nextTick()
    const root = w.find('.g-input-group')
    expect(root.attributes('role')).toBe('group')
    expect(root.attributes('aria-labelledby')).toBe('tel-label')
    expect(root.attributes('aria-describedby')).toBeUndefined()
    expect(root.attributes('style')).toContain('--g-form-min: 50')
    expect(root.classes()).toEqual(expect.arrayContaining(['g-input-group', 'g-input-group--size-md', 'g-input-group--variant-outline', 'g-input-group--density-default', 'g-form-w-md']))
    expect([...root.element.children].map((c) => c.className)).toEqual(['g-input-group__label', 'g-input-group__box', 'g-input-group__support'])
    expect(w.find('label').attributes('for')).toBe('num')
    expect(w.find('label').attributes('id')).toBe('tel-label')
    const [sel, inp] = w.findAll('.g-input-group__part')
    expect(sel.classes()).toEqual(['g-input-group__part', 'g-input-group__part--select'])
    expect(inp.classes()).toEqual(['g-input-group__part', 'g-input-group__part--input'])
    expect(sel.find('select.g-input-group__control').exists()).toBe(true)
    expect(sel.find('svg.g-input-group__select-icon').exists()).toBe(true)
    expect(w.find('.g-input-group__support .g-input-group__message').attributes('aria-live')).toBe('polite')
  })

  it('nombre de cada parte = etiqueta visible + nombre de la parte; la principal sin partLabel, por el <label for>', async () => {
    const w = make(PHONE + PRESSURE, () => ({ v: reactive({ pais: '+52', num: '' }), paises: PAISES }))
    await nextTick()
    expect(accName(w.find('#pais').element)).toBe('Teléfono Código de país')
    expect(w.find('#num').attributes('aria-labelledby')).toBeUndefined()
    expect(accName(w.find('#num').element)).toBe('Teléfono')
    expect(accName(w.find('#sis').element)).toBe('Presión arterial sistólica')
    expect(accName(w.find('#dia').element)).toBe('Presión arterial diastólica')
    expect(w.find('#pais-name').classes()).toContain('g-input-group__part-name')
  })

  it('descripción de cada parte: textos no decorativos, ayuda y (con mensaje) el mensaje, en ese orden', async () => {
    const err = ref('')
    const w = make(`<GInputGroup id="pa" label="Presión" hint="Sentado" :error="err">
      <GInputGroupInput id="sis" principal part-label="sistólica" />
      <GInputGroupText text="/" decorative />
      <GInputGroupInput id="dia" part-label="diastólica" />
      <GInputGroupText id="u" text="mmHg" label="milímetros de mercurio" />
      <GInputGroupText id="t" text="sentado" />
    </GInputGroup>`, () => ({ err }))
    await nextTick()
    expect(w.find('#sis').attributes('aria-describedby')).toBe('u t pa-hint')
    expect(describedTexts(w.find('#dia').element)).toEqual(['milímetros de mercurio', 'sentado', 'Sentado'])
    // el texto con label: visible aria-hidden + expansión oculta hermana; el decorativo, aria-hidden y fuera
    const texts = w.findAll('.g-input-group__part--text')
    expect(texts[0].attributes('aria-hidden')).toBe('true')
    expect(texts[1].attributes('aria-hidden')).toBe('true')
    expect(texts[1].element.nextElementSibling.className).toBe('g-input-group__text-label')
    expect(texts[2].attributes('id')).toBe('t')
    err.value = 'Escribe las dos cifras'
    await nextTick()
    expect(w.find('#sis').attributes('aria-describedby')).toBe('u t pa-hint pa-message')
  })

  it('autocomplete, inputmode y placeholder por parte (1.3.5); chars → __part--chars y --_input-group-chars', async () => {
    const w = make(`${PHONE}<GInputGroup label="Folio"><GInputGroupInput id="serie" part-label="Serie" :chars="3" /><GInputGroupInput id="folio" principal inputmode="numeric" /></GInputGroup>`, () => ({ v: reactive({ pais: '+52', num: '' }), paises: PAISES }))
    expect(w.find('#pais').attributes('autocomplete')).toBe('tel-country-code')
    expect(w.find('#num').attributes('autocomplete')).toBe('tel-national')
    expect(w.find('#num').attributes('placeholder')).toBe('951 123 4567')
    expect(w.find('#num').attributes('type')).toBe('tel')
    const serie = w.find('#serie').element.parentElement
    expect(serie.classList.contains('g-input-group__part--chars')).toBe(true)
    expect(serie.style.getPropertyValue('--_input-group-chars')).toBe('3')
    expect(w.find('#folio').attributes('inputmode')).toBe('numeric')
  })

  it('v-model en las partes; los manejadores propios van primero (la escucha del consumidor ve el modelo actualizado)', async () => {
    const v = reactive({ pais: '+52', num: '' })
    const seen = []
    const w = make(`<GInputGroup label="T"><GInputGroupSelect id="p" v-model="v.pais" part-label="País" :options="paises" @change="onChange" /><GInputGroupInput id="n" v-model="v.num" principal @input="onInput" /></GInputGroup>`,
      () => ({ v, paises: PAISES, onInput: () => seen.push(['input', v.num]), onChange: () => seen.push(['change', v.pais]) }))
    await w.find('#n').setValue('951')
    await w.find('#p').setValue('+1')
    expect(v).toEqual({ pais: '+1', num: '951' })
    expect(seen).toEqual([['input', '951'], ['change', '+1']])
  })

  it('opciones planas y en grupos (<optgroup>); placeholder como primera opción vacía, deshabilitada si es obligatoria', () => {
    const w = make(`<GInputGroup label="T" required><GInputGroupSelect id="p" part-label="País" placeholder="Elige" :options="[{ label: 'América', options: paises }, { value: 'x', label: 'Otro', disabled: true }]" /><GInputGroupInput principal /></GInputGroup>`, () => ({ paises: PAISES }))
    const opts = w.findAll('#p option')
    expect(opts.map((o) => o.text())).toEqual(['Elige', 'MX +52', 'US +1', 'Otro'])
    expect(opts[0].attributes('value')).toBe('')
    expect(opts[0].attributes('disabled')).toBeDefined()
    expect(opts[3].attributes('disabled')).toBeDefined()
    expect(w.find('#p optgroup').attributes('label')).toBe('América')
  })
})

describe('GInputGroup · estados', () => {
  it('required del grupo se propaga a las partes y la parte puede anularlo', () => {
    const w = make('<GInputGroup label="T" required><GInputGroupSelect id="p" part-label="País" :options="[]" /><GInputGroupInput id="n" principal /><GInputGroupInput id="x" part-label="ext" :required="false" /></GInputGroup>')
    expect(w.find('#p').attributes('required')).toBeDefined()
    expect(w.find('#n').attributes('required')).toBeDefined()
    expect(w.find('#x').attributes('required')).toBeUndefined()
    expect(w.find('.g-input-group__required').attributes('aria-hidden')).toBe('true')
  })

  it('una sola marca en la etiqueta según la convención de GForm («(opcional)» dentro del <label>)', () => {
    const w = make('<GForm :labels="labels"><GInputGroup label="Presión"><GInputGroupInput principal /><GInputGroupInput part-label="d" /></GInputGroup></GForm>', () => ({ labels: LABELS }))
    expect(w.find('label.g-input-group__label').element.textContent).toBe('Presión (opcional)')
    expect(w.findAll('.g-input-group__optional')).toHaveLength(1)
  })

  it('aria-invalid solo en la parte que falla (con is-invalid en la parte); un error del grupo marca todas', async () => {
    const groupErr = ref('')
    const w = make(`<GInputGroup id="g" label="T" :error="groupErr"><GInputGroupSelect id="p" part-label="País" :options="paises" error="Elige el código de país" /><GInputGroupInput id="n" principal /></GInputGroup>`, () => ({ groupErr, paises: PAISES }))
    await nextTick()
    expect(w.find('#p').attributes('aria-invalid')).toBe('true')
    expect(w.find('#n').attributes('aria-invalid')).toBeUndefined()
    expect(w.find('#p').element.parentElement.classList.contains('is-invalid')).toBe(true)
    expect(w.find('#n').element.parentElement.classList.contains('is-invalid')).toBe(false)
    expect(w.find('.g-input-group').classes()).toContain('is-invalid')
    expect(w.find('.g-input-group__message').text()).toBe('Elige el código de país')
    expect(w.find('#p').attributes('aria-describedby')).toBe('g-message')
    groupErr.value = 'Revisa el teléfono'
    await nextTick()
    expect(w.find('#n').attributes('aria-invalid')).toBe('true')
    expect(w.find('.g-input-group__message').text()).toBe('Revisa el teléfono')
  })

  it('advertencia y válido del grupo: is-warning / is-valid, sin aria-invalid', async () => {
    const w = make('<GInputGroup label="T" warning="Alta"><GInputGroupInput id="a" principal /><GInputGroupInput part-label="b" /></GInputGroup><GInputGroup label="U" valid="Bien"><GInputGroupInput principal /><GInputGroupInput part-label="b" /></GInputGroup>')
    const [a, b] = w.findAll('.g-input-group')
    expect(a.classes()).toContain('is-warning')
    expect(b.classes()).toContain('is-valid')
    expect(w.find('#a').attributes('aria-invalid')).toBeUndefined()
  })

  it('solo lectura: partes Input readonly; el selector se pinta como texto (input readonly con la etiqueta) + oculto con el valor', () => {
    const w = make('<GInputGroup label="T" readonly><GInputGroupSelect id="p" name="pais" part-label="País" :options="paises" model-value="+52" autocomplete="tel-country-code" /><GInputGroupInput id="n" name="num" principal model-value="951" /></GInputGroup>', () => ({ paises: PAISES }))
    expect(w.find('select').exists()).toBe(false)
    const ro = w.find('#p')
    expect(ro.element.localName).toBe('input')
    expect(ro.attributes('type')).toBe('text')
    expect(ro.attributes('readonly')).toBeDefined()
    expect(ro.element.value).toBe('MX +52')
    expect(ro.attributes('name')).toBeUndefined()
    expect(accName(ro.element)).toBe('T País')
    const hidden = w.find('input[type="hidden"]')
    expect(hidden.attributes('name')).toBe('pais')
    expect(hidden.element.value).toBe('+52')
    expect(w.find('#n').attributes('readonly')).toBeDefined()
    expect(w.find('.g-input-group').classes()).toContain('is-readonly')
    expect(w.find('.g-input-group__select-icon').exists()).toBe(false)
  })

  it('deshabilitado: disabled nativo en todas las partes; dentro de GForm hereda readonly/disabled', () => {
    const w = make('<GInputGroup label="T" disabled><GInputGroupSelect id="p" part-label="País" :options="paises" /><GInputGroupInput id="n" principal /></GInputGroup><GForm readonly><GInputGroup label="U"><GInputGroupInput id="m" principal /><GInputGroupInput part-label="x" /></GInputGroup></GForm>', () => ({ paises: PAISES }))
    expect(w.find('#p').attributes('disabled')).toBeDefined()
    expect(w.find('#n').attributes('disabled')).toBeDefined()
    expect(w.find('.g-input-group').classes()).toContain('is-disabled')
    expect(w.find('#m').attributes('readonly')).toBeDefined()
  })

  it('pulsar un texto enfoca la parte siguiente (o la anterior si es el último)', async () => {
    const w = make(PRESSURE)
    await nextTick()
    await w.findAll('.g-input-group__part--text')[0].trigger('click')
    expect(document.activeElement.id).toBe('dia')
    await w.findAll('.g-input-group__part--text')[1].trigger('click')
    expect(document.activeElement.id).toBe('dia')
  })
})

describe('GInputGroup · dentro de GForm', () => {
  it('FormData con un valor por parte (el grupo no tiene valor propio)', async () => {
    const onSubmit = vi.fn()
    const v = reactive({ pais: '+1', num: '951 123 4567' })
    const w = make(`<GForm @submit="onSubmit">${PHONE}</GForm>`, () => ({ v, paises: PAISES, onSubmit }))
    await w.find('form').trigger('submit')
    await frame()
    const data = onSubmit.mock.calls[0][0].data
    expect([...data.entries()]).toEqual([['tel-pais', '+1'], ['tel-numero', '951 123 4567']])
  })

  it('momento de los errores del grupo: salir de una parte tras escribir revela; cambiar el selector revela', async () => {
    const v = reactive({ pais: '+52', num: '' })
    const w = make(`<GForm :errors="{ telefono: 'Escribe el número a 10 dígitos' }" :labels="labels">${PHONE}</GForm>`, () => ({ v, paises: PAISES, labels: LABELS }))
    const msg = () => w.find('.g-input-group__message').text()
    await w.find('#num').trigger('focusout')
    expect(msg()).toBe('')
    await w.find('#num').setValue('95')
    await w.find('#num').trigger('focusout')
    await nextTick()
    expect(msg()).toBe('Error: Escribe el número a 10 dígitos')
    expect(w.find('#num').attributes('aria-invalid')).toBe('true')
    expect(w.find('#pais').attributes('aria-invalid')).toBe('true')

    const w2 = make(`<GForm :errors="{ 'tel-pais': 'Elige el código de país' }" :labels="labels">${PHONE}</GForm>`, () => ({ v: reactive({ pais: '+52', num: '' }), paises: PAISES, labels: LABELS }))
    await w2.find('#pais').setValue('+1')
    await nextTick()
    expect(w2.find('.g-input-group__message').text()).toBe('Error: Elige el código de país')
    expect(w2.find('#pais').attributes('aria-invalid')).toBe('true')
    expect(w2.find('#num').attributes('aria-invalid')).toBeUndefined()
  })

  it('un elemento del resumen que lleva a la primera parte inválida (o a la principal con un error del grupo)', async () => {
    const onInvalid = vi.fn()
    const errors = reactive({ 'tel-pais': 'Elige el código de país' })
    const w = make(`<GForm :errors="errors" :labels="labels" @invalid="onInvalid"><GErrorSummary :labels="{ title: (n) => n + ' problemas' }" />${PHONE}</GForm>`, () => ({ v: reactive({ pais: '', num: '' }), paises: PAISES, labels: LABELS, onInvalid, errors }))
    await w.find('form').trigger('submit')
    await frame()
    expect(onInvalid.mock.calls[0][0].errors).toEqual([{ name: 'telefono', message: 'Elige el código de país', id: 'pais' }])
    expect(w.findAll('.g-error-summary__link').map((a) => a.attributes('href'))).toEqual(['#pais'])
    delete errors['tel-pais']
    errors.telefono = 'Revisa el teléfono'
    await w.find('form').trigger('submit')
    await frame()
    expect(onInvalid.mock.calls[1][0].errors).toEqual([{ name: 'telefono', message: 'Revisa el teléfono', id: 'num' }])
  })
})

describe('GInputGroup · avisos de desarrollo', () => {
  it('sin label, menos de dos partes, dos principales, parte sin partLabel, hijo que no es parte', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    make('<GInputGroup><GInputGroupInput principal /></GInputGroup>')
    make('<GInputGroup label="A"><GInputGroupInput principal /><GInputGroupInput principal /><GInputGroupInput /><GInput label="x" /></GInputGroup>')
    await nextTick()
    const msgs = warn.mock.calls.map((c) => c[0]).join('\n')
    expect(msgs).toMatch(/necesita label/)
    expect(msgs).toMatch(/menos de dos partes/)
    expect(msgs).toMatch(/más de una parte con `principal`/)
    expect(msgs).toMatch(/sin `partLabel`/)
    expect(msgs).toMatch(/no es una parte/)
  })

  it('parte fuera de un GInputGroup (pinta el control nativo solo); chars no entero; opciones repetidas', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = make('<div><GInputGroupInput id="solo" name="n" /><GInputGroup label="A"><GInputGroupInput principal :chars="2.5" /><GInputGroupSelect part-label="b" :options="[{ value: 1, label: \'a\' }, { value: 1, label: \'b\' }]" /></GInputGroup></div>')
    expect(w.find('#solo').element.parentElement.classList.contains('g-input-group__part')).toBe(false)
    const msgs = warn.mock.calls.map((c) => c[0]).join('\n')
    expect(msgs).toMatch(/fuera de un GInputGroup/)
    expect(msgs).toMatch(/chars debe ser un entero positivo/)
    expect(msgs).toMatch(/valores repetidos/)
  })
})
