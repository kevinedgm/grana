// useFormField · opciones internas ownError y ownTarget (form.md §2 «Error propio del componente», #372), con un campo mínimo
// (sin GFileField): revelado solo por envío o showErrors(), precedencia, destino del resumen y del foco, salida al corregirse.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import GForm from './GForm.vue'
import { useFormField } from './formContext.js'

enableAutoUnmount(afterEach)
afterEach(() => { document.body.innerHTML = '' })
vi.spyOn(console, 'warn').mockImplementation(() => {})

const own = ref('')
const explicit = ref(undefined)
const Field = defineComponent({
  props: { name: String },
  setup(props) {
    const control = ref(null)
    const target = ref(null)
    const root = ref(null)
    const ff = useFormField({ id: 'c', name: () => props.name, error: () => explicit.value, control, root, ownError: () => own.value, ownTarget: () => target.value })
    return () => h('div', { ref: root }, [
      h('input', { ref: control, id: 'c', 'data-msg': ff.message.value?.text ?? '' }),
      h('button', { ref: target, id: 't', type: 'button' }, 'Reintentar'),
      ff.inForm ? null : null
    ])
  }
})

function setup(errors = {}) {
  own.value = ''
  explicit.value = undefined
  const errs = ref(errors)
  const invalids = []
  const w = mount(defineComponent({ setup: () => () => h(GForm, { errors: errs.value, labels: { error: 'Error:' }, onInvalid: (e) => invalids.push(e) }, () => [h(Field, { name: 'x' })]) }), { attachTo: document.body })
  const msg = () => w.find('#c').attributes('data-msg')
  const submit = async () => {
    w.find('form').element.dispatchEvent(new Event('submit', { cancelable: true }))
    await new Promise((r) => setTimeout(r, 40))
  }
  return { w, errs, invalids, msg, submit }
}

describe('useFormField · error propio (#372)', () => {
  it('nunca se pinta por sí mismo; el envío lo revela, bloquea y enlaza a ownTarget; al vaciarse sale y el siguiente espera', async () => {
    const { invalids, msg, submit } = setup()
    own.value = 'Pendiente'
    await nextTick()
    expect(msg()).toBe('')
    await submit()
    expect(invalids[0].errors).toEqual([{ name: 'x', message: 'Pendiente', id: 't' }])
    expect(msg()).toBe('Pendiente')
    expect(document.activeElement.id).toBe('t')
    own.value = ''
    await nextTick()
    await nextTick()
    expect(msg()).toBe('')
    own.value = 'Otra vez'
    await nextTick()
    await nextTick()
    expect(msg()).toBe('')
  })

  it('precedencia: explícita no vacía › propia › errors[name]; una explícita vacía no oculta el error propio', async () => {
    const { invalids, msg, submit } = setup({ x: 'De la aplicación' })
    own.value = 'Propio'
    await submit()
    expect(invalids.at(-1).errors[0]).toMatchObject({ message: 'Propio', id: 't' })
    expect(msg()).toBe('Propio')
    explicit.value = 'Explícito'
    await nextTick()
    expect(msg()).toBe('Explícito')
    await submit()
    expect(invalids.at(-1).errors[0]).toMatchObject({ message: 'Explícito', id: 'c' })
    explicit.value = ''
    await nextTick()
    expect(msg()).toBe('Propio')
    own.value = ''
    await nextTick()
    await nextTick()
    expect(msg()).toBe('') // la explícita vacía oculta errors[name], como siempre
  })
})
