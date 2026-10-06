// GFileField en GForm · error propio del campo (file-field.md «Envío bloqueado», form.md §2 «Error propio del componente»,
// #372): solo al enviar o con showErrors(); precedencia prop › propio › errors[name]; resumen y foco al «Reintentar» del
// primer fallido o al control; al terminar desaparece sin enviar; inactivo y formnovalidate no bloquean.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import GForm from '../GForm/GForm.vue'
import GErrorSummary from '../GErrorSummary/GErrorSummary.vue'
import GFormReveal from '../GFormReveal/GFormReveal.vue'
import GFormLayout from '../GFormLayout/GFormLayout.vue'
import GFileField from './GFileField.vue'
import { LABELS, file, flush, frame, manualUploader } from './fileFieldTestEnv.js'

enableAutoUnmount(afterEach)
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const FORM_LABELS = { error: 'Error:', warning: 'Advertencia:', valid: 'Correcto:', optional: '(opcional)', summaryTitle: 'Hay errores' }

function setup({ fieldProps = {}, errors = {}, summary = false, extra = null } = {}) {
  const up = manualUploader()
  const errs = ref(errors)
  const when = ref(true)
  const fieldError = ref(fieldProps.error)
  const Host = defineComponent({
    setup: () => () => h(GForm, { errors: errs.value, labels: FORM_LABELS, onSubmit: (e) => submits.push(e), onInvalid: (e) => invalids.push(e) }, () => [
      summary ? h(GErrorSummary, { title: 'Hay errores' }) : null,
      h(GFileField, { id: 'ff', name: 'fotos', label: 'Fotos', labels: LABELS, multiple: true, uploader: up, ...fieldProps, error: fieldError.value }),
      extra ? extra(when) : null,
      h('button', { type: 'submit', id: 'send' }, 'Enviar'),
      h('button', { type: 'submit', id: 'draft', formnovalidate: true }, 'Borrador')
    ])
  })
  const submits = []
  const invalids = []
  const w = mount(Host, { attachTo: document.body })
  const f = () => w.findComponent(GFileField)
  const submit = async (id = 'send') => {
    const form = w.find('form').element
    const btn = document.getElementById(id)
    const ev = new Event('submit', { bubbles: true, cancelable: true })
    Object.defineProperty(ev, 'submitter', { value: btn })
    form.dispatchEvent(ev)
    await flush()
    await frame()
    await flush()
  }
  return { w, f, up, errs, when, fieldError, submits, invalids, submit }
}

describe('GFileField en GForm · error propio (#372)', () => {
  it('añadir con subida en curso NO pinta error; enviar bloquea (invalid con el id del control), pinta el mensaje, is-rejected y foco', async () => {
    const { f, up, submits, invalids, submit } = setup()
    f().vm.add([file('a.png')])
    await flush()
    expect(f().find('.g-file-field__message').text()).toBe('')
    expect(f().classes()).not.toContain('is-invalid')
    await submit()
    expect(submits).toHaveLength(0)
    expect(invalids).toHaveLength(1)
    expect(invalids[0].errors).toEqual([{ name: 'fotos', message: 'Espera a que termine de subir a.png.', id: 'ff' }])
    expect(f().find('.g-file-field__message').text()).toContain('Espera a que termine de subir a.png.')
    expect(f().find('.g-file-field__message-type').text()).toBe('Error:')
    expect(f().classes()).toContain('is-invalid')
    expect(f().classes()).toContain('is-rejected')
    expect(document.activeElement.id).toBe('ff')
    expect(f().find('input[type="file"]').attributes('aria-describedby')).toContain('ff-message')
    expect(up.calls).toHaveLength(1)
  })

  it('con una fallida: el error es labels.failed y el destino es el «Reintentar» del primer fallido (enlace del resumen)', async () => {
    const { w, f, up, invalids, submit } = setup({ summary: true })
    f().vm.add([file('a.png'), file('b.png'), file('c.png')])
    await flush()
    up.byName('b.png').reject({ message: 'Sin red' })
    up.byName('c.png') // aún en cola
    await flush()
    await submit()
    const err = invalids[0].errors[0]
    expect(err.message).toBe('No se pudo subir b.png: reinténtalo o quítalo.')
    expect(err.id).toMatch(/^ff-e\d+-retry$/)
    expect(document.getElementById(err.id).getAttribute('aria-label')).toBe('Reintentar b.png')
    const link = w.find('.g-error-summary__link')
    expect(link.attributes('href')).toBe(`#${err.id}`)
    expect(link.text()).toBe(err.message)
    await link.trigger('click')
    await flush()
    expect(document.activeElement.id).toBe(err.id)
  })

  it('al terminar lo pendiente el error desaparece SIN enviar; el siguiente pendiente no se pinta hasta otro envío', async () => {
    const { f, up, submits, submit } = setup()
    f().vm.add([file('a.png')])
    await flush()
    await submit()
    expect(f().classes()).toContain('is-invalid')
    up.calls[0].resolve({ value: 'srv-a' })
    await flush()
    expect(f().classes()).not.toContain('is-invalid')
    expect(f().find('.g-file-field__message').text()).toBe('')
    expect(submits).toHaveLength(0) // nunca se envía solo (WCAG 3.2.2)
    f().vm.add([file('b.png')])
    await flush()
    expect(f().find('.g-file-field__message').text()).toBe('')
    await submit()
    expect(f().find('.g-file-field__message').text()).toContain('Espera a que termine de subir b.png.')
    up.calls[1].resolve({ value: 'srv-b' })
    await flush()
    await submit()
    expect(submits).toHaveLength(1)
  })

  it('precedencia: prop error explícita › error propio › errors[name]', async () => {
    const { f, errs, fieldError, invalids, submit } = setup({ errors: { fotos: 'Adjunta al menos una foto' } })
    f().vm.add([file('a.png')])
    await flush()
    await submit()
    expect(invalids.at(-1).errors[0].message).toBe('Espera a que termine de subir a.png.')
    expect(f().find('.g-file-field__message').text()).toContain('Espera a que termine')
    fieldError.value = 'Error de la aplicación'
    await flush()
    expect(f().find('.g-file-field__message').text()).toContain('Error de la aplicación')
    await submit()
    expect(invalids.at(-1).errors[0].message).toBe('Error de la aplicación')
    fieldError.value = undefined
    errs.value = {}
    await flush()
    expect(f().find('.g-file-field__message').text()).toContain('Espera a que termine')
  })

  it('sin uploader nunca hay error propio; con labels.pending ausente bloquea igual', async () => {
    const a = setup({ fieldProps: { uploader: undefined } })
    a.f().vm.add([file('a.png')])
    await a.submit()
    expect(a.submits).toHaveLength(1)
    expect(a.submits[0].data).toBeInstanceOf(FormData)
    a.w.unmount()
    const b = setup({ fieldProps: { labels: { ...LABELS, pending: undefined } } })
    b.f().vm.add([file('a.png')])
    await flush()
    await b.submit()
    expect(b.submits).toHaveLength(0)
    expect(b.invalids).toHaveLength(1)
  })

  it('formnovalidate («Guardar borrador») no comprueba nada: sale sin lo pendiente', async () => {
    const { f, submits, invalids, submit } = setup()
    f().vm.add([file('a.png')])
    await flush()
    await submit('draft')
    expect(invalids).toHaveLength(0)
    expect(submits).toHaveLength(1)
    expect(submits[0].novalidate).toBe(true)
  })

  it('inactivo (dentro de un GFormReveal cerrado) no bloquea; abierto sí; las subidas siguen dentro del bloque cerrado', async () => {
    const up2 = manualUploader()
    const { w, when, submits, invalids, submit } = setup({
      fieldProps: { name: 'otro', id: 'otro-ff' },
      extra: (on) => h(GFormLayout, null, () => h(GFormReveal, { when: on.value }, () => h(GFileField, { id: 'rv', name: 'rv', label: 'Extra', labels: LABELS, multiple: true, uploader: up2 })))
    })
    await flush()
    const inner = w.findAllComponents(GFileField).find((c) => c.props('name') === 'rv')
    inner.vm.add([file('a.png')])
    await flush()
    await submit()
    expect(invalids).toHaveLength(1)
    expect(invalids[0].errors[0].id).toBe('rv')
    when.value = false
    await flush()
    await submit()
    expect(invalids).toHaveLength(1)
    expect(submits).toHaveLength(1)
    expect(up2.calls[0].signal.aborted).toBe(false)
  })

  it('showErrors() también revela el error propio; resetState() lo oculta', async () => {
    const { w, f } = setup()
    f().vm.add([file('a.png')])
    await flush()
    const form = w.findComponent(GForm)
    await form.vm.showErrors()
    await flush()
    expect(f().classes()).toContain('is-invalid')
    form.vm.resetState()
    await nextTick()
    expect(f().classes()).not.toContain('is-invalid')
  })

  it('añadir, quitar y cancelar retiran is-rejected (notifyChange); reintentar no marca sucio', async () => {
    const { f, submit } = setup()
    f().vm.add([file('a.png')])
    await flush()
    await submit()
    expect(f().classes()).toContain('is-rejected')
    f().vm.add([file('b.png')])
    await flush()
    expect(f().classes()).not.toContain('is-rejected')
  })
})
