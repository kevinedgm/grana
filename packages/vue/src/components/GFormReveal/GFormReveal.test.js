import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, reactive, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GFormReveal from './GFormReveal.vue'
import GForm from '../GForm/GForm.vue'
import { useFormField } from '../GForm/formContext.js'
import GFormSection from '../GFormSection/GFormSection.vue'
import GFormLayout from '../GFormLayout/GFormLayout.vue'
import GFormRow from '../GFormRow/GFormRow.vue'
import GFieldGroup from '../GFieldGroup/GFieldGroup.vue'
import GErrorSummary from '../GErrorSummary/GErrorSummary.vue'
import GInput from '../GInput/GInput.vue'
import GSelect from '../GSelect/GSelect.vue'
import GDatePicker from '../GDatePicker/GDatePicker.vue'
import GCheckbox from '../GCheckbox/GCheckbox.vue'
import GCheckboxGroup from '../GCheckboxGroup/GCheckboxGroup.vue'
import GRadioGroup from '../GRadioGroup/GRadioGroup.vue'
import GInputGroup from '../GInputGroup/GInputGroup.vue'
import GInputGroupInput from '../GInputGroup/GInputGroupInput.vue'
import GInputGroupSelect from '../GInputGroup/GInputGroupSelect.vue'

const components = { GFormReveal, GForm, GFormSection, GFormLayout, GFormRow, GFieldGroup, GErrorSummary, GInput, GSelect, GDatePicker, GCheckbox, GCheckboxGroup, GRadioGroup, GInputGroup, GInputGroupInput, GInputGroupSelect }
const LABELS = { optional: '(opcional)', requiredHint: 'Los campos con * son obligatorios.', sectionOptional: 'Opcional', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ' }
const SINO = [{ value: 'si', label: 'Sí' }, { value: 'no', label: 'No' }]
const PERSONA = [{ value: 'fisica', label: 'Física' }, { value: 'moral', label: 'Moral' }]
const wait = (ms = 40) => new Promise((r) => setTimeout(r, ms))
const mounted = []
function make(template, setup = () => ({}), opts = {}) {
  const w = mount(defineComponent({ components, setup, template }), { attachTo: document.body, ...opts })
  mounted.push(w)
  return w
}
const warns = (spy, tag) => spy.mock.calls.map((c) => c[0]).filter((m) => typeof m === 'string' && m.startsWith(tag))
const keys = (fd) => [...fd.keys()]

beforeEach(() => {
  // jsdom no tiene caja: «con caja» (getClientRects) para el cálculo del foco al cerrar
  vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function () { return this.isConnected ? [{}] : [] })
})
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormReveal · estructura (form.md §14, #275)', () => {
  it('raíz <div> sin rol; hijo directo y único fieldset.g-form-reveal__body role="none" sin <legend>; clase de densidad', () => {
    const w = make('<GFormLayout><GInput label="P" /><GFormReveal id="rv" data-x="1" class="mia" :when="true"><GInput label="A" name="a" /></GFormReveal></GFormLayout>')
    const r = w.find('#rv')
    expect(r.element.tagName).toBe('DIV')
    expect(r.attributes('role')).toBeUndefined()
    expect(r.attributes('data-x')).toBe('1')
    expect(r.classes()).toEqual(expect.arrayContaining(['g-form-reveal', 'g-form-reveal--density-default', 'is-open', 'mia']))
    expect(r.element.children).toHaveLength(1)
    const body = r.element.firstElementChild
    expect(body.tagName).toBe('FIELDSET')
    expect(body.className).toBe('g-form-reveal__body')
    expect(body.getAttribute('role')).toBe('none')
    expect(body.querySelector('legend')).toBeNull()
    expect(r.attributes('inert')).toBeUndefined()
    expect(body.disabled).toBe(false)
  })

  it('cerrado: inert en la raíz y fieldset disabled, sin is-open; el contenido sigue montado', () => {
    const w = make('<GFormLayout><GInput label="P" /><GFormReveal id="rv"><GInput id="a" label="A" name="a" /></GFormReveal></GFormLayout>')
    const r = w.find('#rv')
    expect(r.classes()).not.toContain('is-open')
    expect(r.attributes('inert')).toBe('')
    expect(r.find('fieldset').element.disabled).toBe(true)
    expect(w.find('#a').exists()).toBe(true)
    expect(w.find('#a').element.matches(':disabled')).toBe(true)
  })

  it('is-open, inert y disabled cambian en el acto con when; conserva lo escrito (no controlado) al reabrir', async () => {
    const on = ref(true)
    const w = make('<GFormLayout><GInput label="P" /><GFormReveal id="rv" :when="on"><input id="libre" name="libre"></GFormReveal></GFormLayout>', () => ({ on }))
    w.find('#libre').element.value = 'escrito'
    on.value = false
    await nextTick()
    expect(w.find('#rv').classes()).not.toContain('is-open')
    expect(w.find('#rv').attributes('inert')).toBe('')
    expect(w.find('fieldset').element.disabled).toBe(true)
    on.value = true
    await nextTick()
    expect(w.find('#rv').classes()).toContain('is-open')
    expect(w.find('#rv').attributes('inert')).toBeUndefined()
    expect(w.find('#libre').element.value).toBe('escrito')
  })

  it('cerrado fuera de FormData (también los <input hidden> de GSelect y GDatePicker); abierto, dentro', async () => {
    const on = ref(false)
    const w = make(`<GForm id="f"><GFormLayout>
      <GInput label="P" name="p" model-value="x" />
      <GFormReveal :when="on">
        <GInput label="A" name="a" model-value="1" />
        <GSelect label="S" name="s" :options="[{ value: 'u', label: 'U' }]" model-value="u" />
        <GDatePicker label="D" name="d" model-value="2026-01-02" />
        <GCheckboxGroup label="C" name="c" :model-value="['k']"><GCheckbox value="k" label="K" /></GCheckboxGroup>
      </GFormReveal></GFormLayout></GForm>`, () => ({ on }))
    const fd = () => new FormData(w.find('form').element)
    expect(keys(fd())).toEqual(['p'])
    on.value = true
    await nextTick()
    expect(keys(fd())).toEqual(expect.arrayContaining(['p', 'a', 's', 'd', 'c']))
  })

  it('el anidado conserva su is-open dentro de un padre cerrado (su fieldset hereda el disabled del padre)', async () => {
    const outer = ref(true)
    const w = make(`<GFormLayout><GInput label="P" /><GFormReveal id="o" :when="outer"><GInput label="Q" /><GFormReveal id="n" :when="true"><GInput id="x" label="X" name="x" /></GFormReveal></GFormReveal></GFormLayout>`, () => ({ outer }))
    outer.value = false
    await nextTick()
    expect(w.find('#n').classes()).toContain('is-open')
    expect(w.find('#n').attributes('inert')).toBeUndefined()
    expect(w.find('#x').element.matches(':disabled')).toBe(true)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormReveal · fases de la transición (#278)', () => {
  it('is-ready solo tras el primer pintado (doble cuadro); is-animating no al montar', async () => {
    const w = make('<GFormLayout><GInput label="P" /><GFormReveal id="rv" :when="true"><GInput label="A" /></GFormReveal></GFormLayout>')
    expect(w.find('#rv').classes()).not.toContain('is-ready')
    expect(w.find('#rv').classes()).not.toContain('is-animating')
    await wait(80)
    expect(w.find('#rv').classes()).toContain('is-ready')
  })

  it('is-animating desde el cambio de when hasta el transitionend de grid-template-rows cuya diana es la raíz', async () => {
    const on = ref(false)
    const w = make('<GFormLayout><GInput label="P" /><GFormReveal id="rv" :when="on" style="transition-duration: 5s"><GInput id="a" label="A" /></GFormReveal></GFormLayout>', () => ({ on }))
    on.value = true
    await nextTick()
    const r = w.find('#rv')
    expect(r.classes()).toEqual(expect.arrayContaining(['is-open', 'is-animating']))
    // de otra propiedad, o burbujeado desde un hijo: no cuenta
    r.element.dispatchEvent(Object.assign(new Event('transitionend', { bubbles: true }), { propertyName: 'opacity' }))
    w.find('#a').element.dispatchEvent(Object.assign(new Event('transitionend', { bubbles: true }), { propertyName: 'grid-template-rows' }))
    await nextTick()
    expect(r.classes()).toContain('is-animating')
    r.element.dispatchEvent(Object.assign(new Event('transitionend', { bubbles: true }), { propertyName: 'grid-template-rows' }))
    await nextTick()
    expect(r.classes()).not.toContain('is-animating')
  })

  it('temporizador de respaldo = mayor duration + delay calculados de la raíz + 50ms (movimiento reducido: sin transitionend)', async () => {
    const on = ref(true)
    const w = make('<GFormLayout><GInput label="P" /><GFormReveal id="rv" :when="on" style="transition-duration: 0.1s, 120ms; transition-delay: 0s, 0.08s"><GInput label="A" /></GFormReveal></GFormLayout>', () => ({ on }))
    on.value = false
    await nextTick()
    const r = w.find('#rv')
    expect(r.classes()).toContain('is-animating')
    await wait(160) // 120 + 80 = 200ms + 50 = 250ms
    expect(r.classes()).toContain('is-animating')
    await wait(160)
    expect(r.classes()).not.toContain('is-animating')
  })

  it('sin transiciones el respaldo cierra la fase a los 50ms', async () => {
    const on = ref(false)
    const w = make('<GFormLayout><GInput label="P" /><GFormReveal id="rv" :when="on"><GInput label="A" /></GFormReveal></GFormLayout>', () => ({ on }))
    on.value = true
    await nextTick()
    expect(w.find('#rv').classes()).toContain('is-animating')
    await wait(90)
    expect(w.find('#rv').classes()).not.toContain('is-animating')
  })

  it('la escucha transitionend del consumidor va después de la propia (fusión con la propia primero)', async () => {
    const onEnd = vi.fn()
    const w = make('<GFormLayout><GInput label="P" /><GFormReveal :when="true" @transitionend="onEnd"><GInput label="A" /></GFormReveal></GFormLayout>', () => ({ onEnd }))
    const handlers = w.findComponent(GFormReveal).vm.$.subTree.props.onTransitionend
    expect(Array.isArray(handlers)).toBe(true)
    expect(handlers).toHaveLength(2)
    expect(handlers[1]).toBe(onEnd)
    w.find('.g-form-reveal').element.dispatchEvent(Object.assign(new Event('transitionend'), { propertyName: 'grid-template-rows' }))
    expect(onEnd).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormReveal · --_reveal-gap desde el row-gap del padre (#278)', () => {
  class FakeRO {
    static all = []
    constructor(cb) { this.cb = cb; this.els = []; FakeRO.all.push(this) }
    observe(el) { this.els.push(el) }
    unobserve(el) { this.els = this.els.filter((e) => e !== el) }
    disconnect() { this.els = [] }
    fire() { this.cb(this.els.map((el) => ({ target: el, contentBoxSize: [{ inlineSize: 100, blockSize: 40 }], contentRect: { width: 100, height: 40 } }))) }
  }
  beforeEach(() => { FakeRO.all = []; vi.stubGlobal('ResizeObserver', FakeRO) })

  it('al montar escribe el row-gap del padre en px; 0px si no es un número (normal)', async () => {
    const w = make(`<div>
      <div id="p1" style="display: flex; row-gap: 20px"><span>q</span><GFormReveal id="a"><i /></GFormReveal></div>
      <div id="p2" style="row-gap: normal"><span>q</span><GFormReveal id="b"><i /></GFormReveal></div>
      <div id="p3" style="row-gap: 1.5rem"><span>q</span><GFormReveal id="c"><i /></GFormReveal></div></div>`)
    await nextTick()
    expect(w.find('#a').element.style.getPropertyValue('--_reveal-gap')).toBe('20px')
    expect(w.find('#b').element.style.getPropertyValue('--_reveal-gap')).toBe('0px')
    // un valor que no es px en el estilo calculado (jsdom no resuelve rem) tampoco es un número
    expect(w.find('#c').element.style.getPropertyValue('--_reveal-gap')).toBe('0px')
  })

  it('un ResizeObserver compartido observa a cada padre; relee en el cuadro siguiente y escribe solo si cambia; también al cambiar when', async () => {
    const on = ref(false)
    const w = make(`<div id="p" style="row-gap: 20px"><span>q</span><GFormReveal id="a" :when="on"><i /></GFormReveal><GFormReveal id="b"><i /></GFormReveal></div>`, () => ({ on }))
    await nextTick()
    expect(FakeRO.all).toHaveLength(1)
    const ro = FakeRO.all[0]
    expect(ro.els).toEqual([w.find('#p').element]) // un padre, observado una vez
    await wait(80) // tras is-ready (un nuevo pintado de la raíz reescribe su style entero: es de Vue, no del bloque)
    const el = w.find('#a').element
    const spy = vi.spyOn(el.style, 'setProperty')
    ro.fire()
    await wait(40)
    expect(spy.mock.calls.filter((c) => c[0] === '--_reveal-gap')).toHaveLength(0)
    w.find('#p').element.style.rowGap = '24px'
    ro.fire()
    expect(el.style.getPropertyValue('--_reveal-gap')).toBe('20px') // aún no: en el cuadro siguiente
    await wait(40)
    expect(el.style.getPropertyValue('--_reveal-gap')).toBe('24px')
    w.find('#p').element.style.rowGap = '12px'
    on.value = true
    await nextTick()
    expect(el.style.getPropertyValue('--_reveal-gap')).toBe('12px')
  })

  it('el estilo del consumidor se conserva junto a la variable', async () => {
    const w = make('<div style="row-gap: 8px"><span>q</span><GFormReveal id="a" style="color: red"><i /></GFormReveal></div>')
    await nextTick()
    const s = w.find('#a').element.style
    expect(s.getPropertyValue('--_reveal-gap')).toBe('8px')
    expect(s.color).toBe('red')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormReveal · sub‑contexto de distribución (#278)', () => {
  it('fuera de GFormLayout sus campos llenan su sitio (block) y siguen la densidad de GForm; dentro, la del layout', () => {
    const w = make(`<GForm density="compact"><GInput label="P" />
      <GFormReveal id="r1" :when="true"><GInput id="a" label="A" /><GFormRow><GInput id="b" label="B" /></GFormRow></GFormReveal>
      <GFormLayout density="comfortable"><GInput label="Q" /><GFormReveal id="r2" :when="true"><GInput id="c" label="C" /></GFormReveal></GFormLayout></GForm>`)
    expect(w.find('#r1').classes()).toContain('g-form-reveal--density-compact')
    const box = (id) => w.find(`#${id}`).element.closest('.g-input')
    expect(box('a').classList.contains('g-input--block')).toBe(true)
    expect(box('a').classList.contains('g-input--density-compact')).toBe(true)
    expect(box('b').classList.contains('g-input--block')).toBe(true)
    expect(w.find('#r2').classes()).toContain('g-form-reveal--density-comfortable')
    expect(box('c').classList.contains('g-input--density-comfortable')).toBe(true)
  })

  it('stack, readonly y disabled del sub‑contexto padre pasan; la prop explícita del campo gana', () => {
    const w = make(`<GForm readonly><GFormLayout stack><GInput label="P" /><GFormReveal :when="true"><GInput id="a" label="A" /><GInput id="b" label="B" :block="false" /></GFormReveal></GFormLayout></GForm>`)
    expect(w.find('#a').attributes('readonly')).toBeDefined()
    expect(w.find('#b').element.closest('.g-input').classList.contains('g-input--block')).toBe(false)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormReveal · foco al cerrar con el foco dentro (#275, WCAG 2.4.3)', () => {
  it('va al último enfocable anterior, con preventScroll, antes de aplicar inert; nunca a <body>', async () => {
    const on = ref(true)
    const w = make('<GFormLayout><GInput id="q" label="Q" /><GFormReveal :when="on"><GInput id="a" label="A" /></GFormReveal><GInput id="z" label="Z" /></GFormLayout>', () => ({ on }))
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    w.find('#a').element.focus()
    focus.mockClear()
    on.value = false
    await nextTick()
    expect(document.activeElement.id).toBe('q')
    expect(focus.mock.calls[0][0]).toEqual({ preventScroll: true })
  })

  it('si el anterior es un radio, a la opción elegida de su grupo', async () => {
    const m = reactive({ f: 'si' })
    const w = make(`<GForm><GFormLayout><GRadioGroup id="f" appearance="inline" label="¿Factura?" name="factura" v-model="m.f" :options="sino" />
      <GFormReveal :when="m.f === 'si'"><GInput id="a" label="A" /></GFormReveal></GFormLayout></GForm>`, () => ({ m, sino: SINO }))
    w.find('#a').element.focus()
    m.f = 'no'
    await nextTick()
    expect(document.activeElement.type).toBe('radio')
    expect(document.activeElement.value).toBe('no')
    expect(document.activeElement.checked).toBe(true)
  })

  it('sin anterior, al primero posterior; salta los deshabilitados, los inert y los de otro bloque cerrado', async () => {
    const on = ref(true)
    const w = make(`<div><GFormReveal :when="on"><GInput id="a" label="A" /></GFormReveal><button id="off" disabled>x</button><div inert><button id="in">y</button></div><button id="z">z</button></div>`, () => ({ on }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    w.find('#a').element.focus()
    on.value = false
    await nextTick()
    expect(document.activeElement.id).toBe('z')
  })

  it('con el foco fuera, cerrar no lo mueve', async () => {
    const on = ref(true)
    const w = make('<GFormLayout><GInput id="q" label="Q" /><GFormReveal :when="on"><GInput id="a" label="A" /></GFormReveal><GInput id="z" label="Z" /></GFormLayout>', () => ({ on }))
    w.find('#z').element.focus()
    on.value = false
    await nextTick()
    expect(document.activeElement.id).toBe('z')
    // al abrir, el foco no se mueve
    on.value = true
    await nextTick()
    expect(document.activeElement.id).toBe('z')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormReveal · avisos de desarrollo (#279)', () => {
  it('dentro de una GFormRow y sin hermano anterior avisan (una vez por instancia); bien colocado, ninguno', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    make('<GFormLayout><GFormRow><GInput label="A" /><GFormReveal><GInput label="B" /></GFormReveal></GFormRow></GFormLayout>')
    expect(warns(warn, '[Grana GFormReveal]').filter((m) => /GFormRow/.test(m))).toHaveLength(1)
    warn.mockClear()
    make('<GFormLayout><GFormReveal><GInput label="B" /></GFormReveal></GFormLayout>')
    expect(warns(warn, '[Grana GFormReveal]').filter((m) => /hermano anterior/.test(m))).toHaveLength(1)
    warn.mockClear()
    make('<GFormLayout><GInput label="Q" /><GFormReveal><GInput label="B" /></GFormReveal></GFormLayout>')
    expect(warns(warn, '[Grana GFormReveal]')).toHaveLength(0)
  })

  it('una GFormSection dentro de un bloque avisa desde la sección; fuera, no', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    make('<GFormLayout><GInput label="Q" /><GFormReveal><GFormSection title="T"><GInput label="B" /></GFormSection></GFormReveal></GFormLayout>')
    expect(warns(warn, '[Grana GFormSection]').filter((m) => /GFormReveal/.test(m))).toHaveLength(1)
    warn.mockClear()
    make('<GFormSection title="Facturación"><GFormLayout><GInput label="Q" /><GFormReveal><GInput label="B" /></GFormReveal></GFormLayout></GFormSection>')
    expect(warns(warn, '[Grana GFormSection]')).toHaveLength(0)
    expect(warns(warn, '[Grana GFormReveal]')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormReveal · SSR (#275 punto 8)', () => {
  const render = (when) => renderToString(createSSRApp({ components, data: () => ({ when }), template: '<GForm><GFormLayout><GInput label="Q" name="q" /><GFormReveal id="rv" :when="when"><GInput label="A" name="a" /></GFormReveal></GFormLayout></GForm>' }))
  it('cerrado: inert y fieldset disabled desde el primer HTML; sin is-ready, sin is-animating ni --_reveal-gap', async () => {
    const html = await render(false)
    const root = html.match(/<div[^>]*id="rv"[^>]*>/)[0]
    expect(root).toContain('inert')
    expect(root).not.toMatch(/is-open|is-ready|is-animating|--_reveal-gap/)
    expect(html).toMatch(/<fieldset class="g-form-reveal__body" role="none" disabled/)
  })
  it('abierto: is-open sin inert ni disabled; tampoco is-ready', async () => {
    const html = await render(true)
    const root = html.match(/<div[^>]*id="rv"[^>]*>/)[0]
    expect(root).toContain('is-open')
    expect(root).not.toMatch(/inert|is-ready|--_reveal-gap/)
    expect(html).toMatch(/<fieldset class="g-form-reveal__body" role="none">/)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GForm · registro inactivo (form.md §2, #276)', () => {
  // La «aplicación» calcula errors SIN condiciones (CURP y razón social siempre en sus reglas)
  const factura = () => {
    const m = reactive({ nombre: 'Ana', factura: 'si', persona: 'fisica', curp: '', razon: '' })
    const errors = computed2(m)
    const onSubmit = vi.fn()
    const onInvalid = vi.fn()
    const form = ref(null)
    return { m, errors, onSubmit, onInvalid, form, labels: LABELS, sino: SINO, persona: PERSONA }
  }
  function computed2(m) {
    return reactive({
      get nombre() { return m.nombre ? '' : 'Escribe el nombre' },
      get curp() { return m.curp ? '' : 'Escribe la CURP' },
      get razon() { return m.razon ? '' : 'Escribe la razón social' }
    })
  }
  const TPL = `<GForm ref="form" :errors="errors" :labels="labels" @submit="onSubmit" @invalid="onInvalid">
    <GErrorSummary :labels="{ title: 'Hay {count} problemas' }" />
    <GFormLayout>
      <GInput id="nombre" label="Nombre" name="nombre" v-model="m.nombre" />
      <GRadioGroup id="factura" appearance="inline" label="¿Requiere factura?" name="factura" v-model="m.factura" :options="sino" />
      <GFormReveal id="rv-f" :when="m.factura === 'si'">
        <GRadioGroup id="persona" appearance="inline" label="Tipo de persona" name="persona" v-model="m.persona" :options="persona" />
        <GFormReveal id="rv-fis" :when="m.persona === 'fisica'"><GInput id="curp" label="CURP" name="curp" v-model="m.curp" /></GFormReveal>
        <GFormReveal id="rv-mor" :when="m.persona === 'moral'"><GInput id="razon" label="Razón social" name="razon" v-model="m.razon" /></GFormReveal>
      </GFormReveal>
    </GFormLayout></GForm>`
  const submit = async (w) => { await w.find('form').trigger('submit'); await wait() }
  const summaryLinks = (w) => w.find('.g-error-summary').findAll('a').map((a) => a.attributes('href'))
  const msg = (w, id) => w.find(`#${id}`).element.closest('.g-input').querySelector('.g-input__message').textContent

  it('submit no bloquea por errores de campos inactivos; sus claves NO son errores generales; FormData sin ellos', async () => {
    const w = make(TPL, factura)
    const s = w.vm.$.setupState
    s.m.factura = 'no'
    await nextTick()
    await submit(w)
    expect(s.onInvalid).not.toHaveBeenCalled()
    expect(s.onSubmit).toHaveBeenCalledTimes(1)
    expect(keys(s.onSubmit.mock.calls[0][0].data)).toEqual(['nombre', 'factura'])
  })

  it('invalid no cuenta los inactivos (la rama Moral cerrada con Física abierta)', async () => {
    const w = make(TPL, factura)
    const s = w.vm.$.setupState
    await submit(w)
    expect(s.onInvalid.mock.calls[0][0].errors).toEqual([{ name: 'curp', message: 'Escribe la CURP', id: 'curp' }])
    expect(summaryLinks(w)).toEqual(['#curp'])
  })

  it('cerrar con errores visibles: salen en silencio del resumen (oculto si queda vacío) y de la instantánea; reabrir sin error visible; el siguiente envío sí', async () => {
    const w = make(TPL, factura)
    const s = w.vm.$.setupState
    await submit(w)
    expect(msg(w, 'curp')).toContain('Escribe la CURP')
    const sum = w.find('.g-error-summary')
    expect(sum.attributes('hidden')).toBeUndefined()
    document.activeElement.blur()
    s.m.factura = 'no'
    await nextTick()
    await nextTick()
    expect(sum.attributes('hidden')).toBeDefined()
    expect(document.activeElement).toBe(document.body) // nada enfocó el resumen
    s.m.factura = 'si'
    await nextTick()
    await nextTick()
    expect(msg(w, 'curp')).toBe('')
    expect(w.find('#curp').attributes('aria-invalid')).toBeUndefined()
    expect(sum.attributes('hidden')).toBeDefined() // el resumen no lo recupera hasta el siguiente envío
    await submit(w)
    expect(msg(w, 'curp')).toContain('Escribe la CURP')
    expect(summaryLinks(w)).toEqual(['#curp'])
    expect(s.onInvalid).toHaveBeenCalledTimes(2)
  })

  it('cambiar de rama (Física → Moral) limpia el editado de la que se cierra: al volver, salir sin escribir no revela', async () => {
    const w = make(TPL, factura)
    const s = w.vm.$.setupState
    await w.find('#curp').setValue('X')
    await w.find('#curp').setValue('')
    s.m.persona = 'moral'
    await nextTick()
    s.m.persona = 'fisica'
    await nextTick()
    await w.find('#curp').trigger('focusout')
    await nextTick()
    expect(msg(w, 'curp')).toBe('')
    // las reglas de siempre al reabrir: escribir y salir revela
    await w.find('#curp').setValue('')
    await w.find('#curp').trigger('focusout')
    await nextTick()
    expect(msg(w, 'curp')).toContain('Escribe la CURP')
  })

  it('showErrors() no revela ni lista los inactivos y focusFirstError() los salta (también con error explícito)', async () => {
    const w = make(`<GForm ref="form" :errors="{ a: 'A mal', b: 'B mal' }">
      <GFormLayout><GInput id="q" label="Q" /><GFormReveal :when="false"><GInput id="a" label="A" name="a" /><GInput id="x" label="X" name="x" error="Explícito" /></GFormReveal>
      <GInput id="b" label="B" name="b" /></GFormLayout></GForm>`, () => ({ form: ref(null) }))
    const form = w.vm.$.setupState.form
    const list = await form.showErrors()
    await wait()
    expect(list.map((i) => i.name)).toEqual(['b'])
    expect(w.find('#a').attributes('aria-invalid')).toBeUndefined()
    expect(document.activeElement.id).toBe('b')
    document.activeElement.blur()
    expect(await form.focusFirstError()).toBe(true) // Promise<boolean> desde la Fase 3 de GFormSection (#287)
    expect(document.activeElement.id).toBe('b')
  })

  it('anidado: activo solo con el padre; GFieldGroup, GCheckboxGroup, GInputGroup, GRadioGroup y un campo propio dentro', async () => {
    const Custom = defineComponent({
      props: { name: String },
      setup(props) {
        const el = ref(null)
        const f = useFormField({ name: () => props.name, control: el, root: el })
        return () => h('div', { ref: el, id: 'custom', tabindex: -1, 'data-inactive': String(f.inactive.value) })
      }
    })
    const on = ref(false)
    const inner = ref(true)
    const onInvalid = vi.fn()
    const onSubmit = vi.fn()
    const errors = { fg1: 'Mal', cg: 'Mal', tel: 'Mal', rg: 'Mal', propio: 'Mal' }
    const w = make(`<GForm :errors="errors" @invalid="onInvalid" @submit="onSubmit"><GFormLayout><GInput label="Q" />
      <GFormReveal :when="on"><GInput label="Q2" /><GFormReveal :when="inner">
        <GFieldGroup label="Fecha" name="fg"><GFormRow keep><GInput label="D" name="fg1" /><GInput label="M" name="fg2" /></GFormRow></GFieldGroup>
        <GCheckboxGroup label="CG" name="cg"><GCheckbox value="a" label="A" /></GCheckboxGroup>
        <GInputGroup label="Tel" name="telg"><GInputGroupInput name="tel" principal /></GInputGroup>
        <GRadioGroup label="RG" name="rg" :options="sino" />
        <Custom name="propio" />
      </GFormReveal></GFormReveal></GFormLayout></GForm>`, () => ({ on, inner, errors, onInvalid, onSubmit, sino: SINO }), { global: { components: { Custom } } })
    await nextTick()
    expect(w.find('#custom').attributes('data-inactive')).toBe('true')
    await submit(w)
    expect(onInvalid).not.toHaveBeenCalled()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    on.value = true
    await nextTick()
    expect(w.find('#custom').attributes('data-inactive')).toBe('false')
    await submit(w)
    expect(onInvalid.mock.calls[0][0].errors.map((e) => e.name).sort()).toEqual(['cg', 'fg', 'propio', 'rg', 'telg'].sort())
    inner.value = false
    await nextTick()
    expect(w.find('#custom').attributes('data-inactive')).toBe('true')
    await submit(w)
    expect(onSubmit).toHaveBeenCalledTimes(2)
  })

  it('un campo inactivo no marca editado ni revela; dirty sigue su regla con notifyChange()', async () => {
    let api = null
    const Custom = defineComponent({
      setup() {
        const el = ref(null)
        api = useFormField({ name: 'c', control: el, root: el, trigger: 'change' })
        return () => h('div', { ref: el, id: 'c' }, api.message.value ? api.message.value.text : '')
      }
    })
    const on = ref(false)
    const dirty = ref(false)
    const w = make(`<GForm :errors="{ c: 'Mal' }" v-model:dirty="dirty"><GInput label="Q" /><GFormReveal :when="on"><Custom /></GFormReveal></GForm>`, () => ({ on, dirty }), { global: { components: { Custom } } })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    api.notifyChange()
    await nextTick()
    expect(dirty.value).toBe(true)
    expect(w.find('#c').text()).toBe('')
    on.value = true
    await nextTick()
    expect(w.find('#c').text()).toBe('') // al activarse empieza sin revelar
    api.notifyChange()
    await nextTick()
    expect(w.find('#c').text()).toBe('Mal')
  })

  it('fuera de GForm funciona igual (inert, fieldset), sin registro', async () => {
    const w = make('<div><input id="q"><GFormReveal id="rv" :when="false"><GInput label="A" name="a" /></GFormReveal></div>')
    expect(w.find('#rv').attributes('inert')).toBe('')
    expect(w.find('fieldset').element.disabled).toBe(true)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('Registro (index.js y components.css)', () => {
  it('GFormReveal exportado y su CSS después de GFormLayout/GFormRow; revealKey no se exporta', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const css = readFileSync(resolve(process.cwd(), 'src/styles/components.css'), 'utf8')
    expect(css).toContain('@import url("../components/GFormReveal/GFormReveal.css");')
    expect(css.indexOf('GFormReveal.css')).toBeGreaterThan(css.indexOf('GFormRow.css'))
    expect(css.indexOf('GFormReveal.css')).toBeGreaterThan(css.indexOf('GFormLayout.css'))
    const lib = await import('../../index.js')
    expect(lib.GFormReveal).toBe(GFormReveal)
    expect(lib.revealKey).toBeUndefined()
  })

  it('el .vue no lleva <style> ni literales', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const src = readFileSync(resolve(process.cwd(), 'src/components/GFormReveal/GFormReveal.vue'), 'utf8')
    expect(src).not.toMatch(/<style/)
    const code = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(code).not.toMatch(/#[0-9a-fA-F]{3,8}\b|[0-9]+px|var\(--[a-z-]+,/)
  })
})
