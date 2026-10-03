import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import GFormSection from './GFormSection.vue'
import GForm from '../GForm/GForm.vue'
import { OPEN_REQUEST, revealAndFocus, useFormField } from '../GForm/formContext.js'
import GFormLayout from '../GFormLayout/GFormLayout.vue'
import GFormRow from '../GFormRow/GFormRow.vue'
import GFormReveal from '../GFormReveal/GFormReveal.vue'
import GFieldGroup from '../GFieldGroup/GFieldGroup.vue'
import GErrorSummary from '../GErrorSummary/GErrorSummary.vue'
import GDivider from '../GDivider/GDivider.vue'
import GInput from '../GInput/GInput.vue'
import GCheckbox from '../GCheckbox/GCheckbox.vue'
import GIcon from '../GIcon/GIcon.vue'

// Campo propio del consumidor sin control nativo: notifyChange() marca la sección como editada (#288)
const MiCampo = defineComponent({
  props: { name: String },
  setup(props) {
    const ff = useFormField({ name: () => props.name })
    return () => h('button', { type: 'button', class: 'mi-campo', onClick: () => ff.notifyChange() }, 'elegir')
  }
})

const components = { GFormSection, GForm, GFormLayout, GFormRow, GFormReveal, GFieldGroup, GErrorSummary, GDivider, GInput, GCheckbox, GIcon, MiCampo }
const LABELS = { optional: '(opcional)', sectionOptional: 'Opcional', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ', sectionErrors: '{count} errores' }
const FISCAL = { add: 'Agregar datos fiscales', remove: 'Quitar datos fiscales', removeTitle: '¿Quitar los datos fiscales?', removeBody: 'Se descartará lo que escribiste.', removeConfirm: 'Quitar', removeCancel: 'Cancelar' }
const wait = (ms = 40) => new Promise((r) => setTimeout(r, ms))
const mounted = []
function make(template, setup = () => ({}), opts = {}) {
  const w = mount(defineComponent({ components, setup, template }), { attachTo: document.body, ...opts })
  mounted.push(w)
  return w
}
const warns = (spy, tag = '[Grana GFormSection]') => spy.mock.calls.map((c) => c[0]).filter((m) => typeof m === 'string' && m.startsWith(tag))
const quiet = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
const keys = (form) => [...new FormData(form).keys()]
const sec = (w, id) => w.find(`#${id}`)

beforeEach(() => {
  // jsdom no implementa showModal/close: mismo contrato que GDialog.test.js (atributo open y evento close)
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormSection · aviso del cuerpo (form.md §3 y §14, #283)', () => {
  const bodyWarns = (spy) => warns(spy).filter((m) => /GFormLayout/.test(m))
  it('avisa una vez con un campo directo en el cuerpo', () => {
    const warn = quiet()
    make('<g-form-section title="A"><g-input label="Nombre" /><g-checkbox label="Acepto" /></g-form-section>')
    expect(bodyWarns(warn)).toHaveLength(1)
  })
  it('avisa con una GFormRow directa', () => {
    const warn = quiet()
    make('<g-form-section title="A"><g-form-row><g-input label="Nombre" /></g-form-row></g-form-section>')
    expect(bodyWarns(warn)).toHaveLength(1)
  })
  it('avisa con un GFormReveal directo', () => {
    const warn = quiet()
    make('<g-form-section title="A"><g-form-reveal :when="true"><g-input label="Nombre" /></g-form-reveal></g-form-section>')
    expect(bodyWarns(warn)).toHaveLength(1)
  })
  it('calla con un GFormLayout (aunque contenga campos)', () => {
    const warn = quiet()
    make('<g-form-section title="A"><g-form-layout><g-input label="Nombre" /><g-form-row><g-input label="Ciudad" /></g-form-row></g-form-layout></g-form-section>')
    expect(bodyWarns(warn)).toHaveLength(0)
  })
  it('calla con contenido que no son campos', () => {
    const warn = quiet()
    make('<g-form-section title="A"><p>Texto</p><div class="otro">x</div></g-form-section>')
    expect(bodyWarns(warn)).toHaveLength(0)
  })
  it('vale también en collapsible y addable (el cuerpo sigue siendo __body)', () => {
    const warn = quiet()
    make(`<div><g-form-section title="A" mode="collapsible"><g-input label="N" /></g-form-section>
      <g-form-section title="B" mode="addable" :labels="labels"><g-input label="N" /></g-form-section></div>`, () => ({ labels: FISCAL }))
    expect(bodyWarns(warn)).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormSection · props y static sin cambio de DOM (form.md §3)', () => {
  it('validadores de mode y headerPlacement', () => {
    const p = GFormSection.props
    for (const v of ['static', 'collapsible', 'addable']) expect(p.mode.validator(v)).toBe(true)
    expect(p.mode.validator('accordion')).toBe(false)
    expect(p.headerPlacement.validator('top')).toBe(true)
    expect(p.headerPlacement.validator('auto')).toBe(true)
    expect(p.headerPlacement.validator('side')).toBe(false)
    expect(p.mode.default).toBe('static')
    expect(p.headerPlacement.default).toBe('top')
  })

  it('static: el DOM de la Fase 1 + --mode-static (sin is-ready, sin panel, sin id generado en la raíz)', async () => {
    const w = make(`<GForm :labels="labels"><GFormSection title="Datos fiscales" description="Solo si pide factura." optional class="mia" data-x="1">
      <template #lead><span class="ico" /></template><template #actions><button type="button">Copiar</button></template><template #help>?</template><p>cuerpo</p>
    </GFormSection></GForm>`, () => ({ labels: LABELS }))
    await wait(80)
    const s = w.find('section').element
    expect([...s.classList].sort()).toEqual(['g-form-section', 'g-form-section--mode-static', 'g-form-section--optional', 'mia'])
    expect(s.hasAttribute('id')).toBe(false)
    expect(s.getAttribute('data-x')).toBe('1')
    expect([...s.children].map((c) => c.className)).toEqual(['g-form-section__header', 'g-form-section__body'])
    const header = s.firstElementChild
    expect([...header.children].map((c) => c.className)).toEqual(['g-form-section__heading', 'g-form-section__description', 'g-form-section__actions', 'g-form-section__help'])
    const heading = header.firstElementChild
    expect([...heading.children].map((c) => c.tagName + '.' + c.className.split(' ')[0])).toEqual(['SPAN.g-form-section__lead', 'H3.g-form-section__title', 'SPAN.g-badge'])
    expect(heading.children[1].outerHTML).toBe('<h3 class="g-form-section__title">Datos fiscales</h3>')
    expect(s.querySelector('.g-form-section__body').outerHTML).toBe('<div class="g-form-section__body"><p>cuerpo</p></div>')
    expect(s.querySelector('.g-form-section__panel, .g-form-section__toggle, dialog, hr')).toBeNull()
  })

  it('divider: GDivider decorative subtle sin inset, PRIMER hijo de la sección; sin divider no hay línea', () => {
    const w = make(`<div><GFormSection id="a" title="A" divider><p>x</p></GFormSection><GFormSection id="b" title="B" mode="collapsible" divider /><GFormSection id="c" title="C" /></div>`)
    for (const id of ['a', 'b']) {
      const first = sec(w, id).element.firstElementChild
      expect(first.tagName).toBe('HR')
      expect([...first.classList]).toEqual(expect.arrayContaining(['g-divider', 'g-divider--emphasis-subtle', 'g-divider--inset-none', 'g-form-section__divider']))
      expect(first.getAttribute('aria-hidden')).toBe('true')
      expect(first.getAttribute('role')).toBeNull()
    }
    expect(sec(w, 'c').find('hr').exists()).toBe(false)
  })

  it('divider: la primera sección no dibuja línea por una regla de CSS (sin JS): oculta por defecto, visible con una hermana anterior visible', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/GFormSection/GFormSection.css'), 'utf8')
    expect(css).toMatch(/\.g-form-section > \.g-form-section__divider \{[^}]*display: none/)
    expect(css).toMatch(/\.g-form-section:not\(\[hidden\]\) ~ \.g-form-section > \.g-form-section__divider \{\s*display: block/)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormSection · collapsible (APG Disclosure, #285)', () => {
  it('hN > button type=button con aria-expanded y aria-controls → __panel; nombre invariable; inert sin fieldset', async () => {
    const w = make(`<GFormSection id="av" title="Configuración avanzada" mode="collapsible" :heading-level="4"><GFormLayout><GInput label="Idioma" name="idioma" /></GFormLayout></GFormSection>`)
    const btn = w.find('h4.g-form-section__title > button.g-form-section__toggle')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('type')).toBe('button')
    expect(btn.attributes('id')).toBe('av-toggle')
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(btn.attributes('aria-controls')).toBe('av-panel')
    expect(btn.attributes('aria-label')).toBeUndefined()
    const panel = w.find('#av-panel')
    expect(panel.classes()).toEqual(['g-form-section__panel'])
    expect(panel.element.hasAttribute('inert')).toBe(true)
    expect(panel.element.children).toHaveLength(1)
    expect(panel.element.firstElementChild.tagName).toBe('DIV')
    expect(panel.element.firstElementChild.className).toBe('g-form-section__body')
    expect(w.find('fieldset').exists()).toBe(false)
    expect(panel.attributes('role')).toBeUndefined()
    const name = btn.text()
    expect(name).toBe('Configuración avanzada')
    await btn.trigger('click')
    expect(btn.attributes('aria-expanded')).toBe('true')
    expect(panel.element.hasAttribute('inert')).toBe(false)
    expect(sec(w, 'av').classes()).toContain('is-open')
    expect(btn.text()).toBe(name)
    // el contenido sigue montado plegada
    await btn.trigger('click')
    expect(w.find('input[name="idioma"]').exists()).toBe(true)
  })

  it('hijos del botón: chevron (svg.g-icon hijo directo, sin flip-rtl), lead opcional y texto; optional fuera del botón', () => {
    const w = make(`<GForm :labels="labels"><GFormSection title="Avanzada" mode="collapsible" optional><template #lead><GIcon name="settings" /></template></GFormSection></GForm>`, () => ({ labels: LABELS }))
    const btn = w.find('.g-form-section__toggle').element
    expect([...btn.children].map((c) => c.className)).toEqual(['g-form-section__chevron', 'g-form-section__lead', 'g-form-section__toggle-text'])
    const chev = btn.children[0]
    expect(chev.getAttribute('aria-hidden')).toBe('true')
    expect(chev.firstElementChild.tagName.toLowerCase()).toBe('svg')
    expect(chev.firstElementChild.classList.contains('g-icon')).toBe(true)
    expect(chev.firstElementChild.classList.contains('g-icon--flip-rtl')).toBe(false)
    expect(btn.children[1].getAttribute('aria-hidden')).toBe('true')
    // el lead NO va fuera del hN en collapsible
    expect(w.find('.g-form-section__heading > .g-form-section__lead').exists()).toBe(false)
    const badge = w.find('.g-form-section__heading > .g-badge')
    expect(badge.exists()).toBe(true)
    expect(btn.contains(badge.element)).toBe(false)
  })

  it('línea __summary solo plegada y con contenido; aria-describedby solo mientras existe; antes de __description', async () => {
    const w = make(`<GFormSection id="p" title="Preferencias" description="Cómo avisamos." mode="collapsible" summary="Correo · SMS" />`)
    const btn = () => w.find('.g-form-section__toggle')
    const line = w.find('p.g-form-section__summary')
    expect(line.attributes('id')).toBe('p-summary')
    expect(line.find('.g-form-section__summary-text').text()).toBe('Correo · SMS')
    expect(line.find('.g-form-section__status').exists()).toBe(false)
    expect(btn().attributes('aria-describedby')).toBe('p-summary')
    expect(line.element.nextElementSibling.className).toBe('g-form-section__description')
    await btn().trigger('click')
    expect(w.find('.g-form-section__summary').exists()).toBe(false)
    expect(btn().attributes('aria-describedby')).toBeUndefined()
    // sin nada que decir, no hay línea
    const v = make(`<GFormSection title="Otra" mode="collapsible" />`)
    expect(v.find('.g-form-section__summary').exists()).toBe(false)
    expect(v.find('.g-form-section__toggle').attributes('aria-describedby')).toBeUndefined()
  })

  it('slot summary gana a la prop', () => {
    const w = make(`<GFormSection title="P" mode="collapsible" summary="prop"><template #summary><b>rico</b></template></GFormSection>`)
    expect(w.find('.g-form-section__summary-text').html()).toContain('<b>rico</b>')
    expect(w.find('.g-form-section__summary-text').text()).toBe('rico')
  })

  it('sin v-model (estado interno): el botón abre y pliega y emite update:open', async () => {
    const w = mount(GFormSection, { props: { title: 'P', mode: 'collapsible' }, attachTo: document.body })
    mounted.push(w)
    await w.find('button').trigger('click')
    await w.find('button').trigger('click')
    expect(w.emitted('update:open')).toEqual([[true], [false]])
  })

  it('con v-model:open: la prop manda; un cambio de la aplicación no emite; el botón emite y la aplicación lo ve', async () => {
    const open = ref(true)
    const onUpdate = vi.fn()
    const w = make(`<GFormSection id="p" title="P" mode="collapsible" :open="open" @update:open="(v) => { open = v; onUpdate(v) }" />`, () => ({ open, onUpdate }))
    expect(sec(w, 'p').classes()).toContain('is-open')
    open.value = false
    await nextTick()
    expect(sec(w, 'p').classes()).not.toContain('is-open')
    expect(onUpdate).not.toHaveBeenCalled()
    await w.find('button').trigger('click')
    expect(onUpdate).toHaveBeenCalledWith(true)
    expect(open.value).toBe(true)
    // controlado a medias (:open sin escucha): el estado local sigue al usuario y luego a la prop
    const fixed = ref(false)
    const v = make(`<GFormSection id="q" title="Q" mode="collapsible" :open="fixed" />`, () => ({ fixed }))
    await v.find('button').trigger('click')
    expect(sec(v, 'q').classes()).toContain('is-open')
    fixed.value = true
    await nextTick()
    fixed.value = false
    await nextTick()
    expect(sec(v, 'q').classes()).not.toContain('is-open')
  })

  it('plegar por programa con el foco dentro lleva el foco al botón (antes de inert), sin emitir', async () => {
    const open = ref(true)
    const onUpdate = vi.fn()
    const w = make(`<GFormSection id="p" title="P" mode="collapsible" :open="open" @update:open="onUpdate"><GFormLayout><GInput id="dentro" label="X" /></GFormLayout></GFormSection>`, () => ({ open, onUpdate }))
    w.find('#dentro').element.focus()
    expect(document.activeElement.id).toBe('dentro')
    let inertWhenMoved = null
    w.find('.g-form-section__toggle').element.addEventListener('focus', () => { inertWhenMoved = w.find('#p-panel').element.hasAttribute('inert') })
    open.value = false
    await nextTick()
    expect(document.activeElement.id).toBe('p-toggle')
    expect(inertWhenMoved).toBe(false)
    expect(w.find('#p-panel').element.hasAttribute('inert')).toBe(true)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('FormData incluye los campos de una plegada (sin fieldset disabled)', () => {
    const w = make(`<GForm><GFormSection title="P" mode="collapsible"><GFormLayout><GInput label="Idioma" name="idioma" model-value="es" /></GFormLayout></GFormSection></GForm>`)
    expect(keys(w.find('form').element)).toEqual(['idioma'])
  })

  it('GForm readonly/disabled: plegar sigue funcionando y el botón nunca se deshabilita', async () => {
    const w = make(`<GForm readonly><GFormSection id="p" title="P" mode="collapsible" /></GForm>`)
    const b = w.find('.g-form-section__toggle')
    expect(b.attributes('disabled')).toBeUndefined()
    await b.trigger('click')
    expect(sec(w, 'p').classes()).toContain('is-open')
  })

  it('is-animating desde el cambio hasta el temporizador de respaldo; is-ready tras el primer pintado', async () => {
    const w = make(`<GFormSection id="p" title="P" mode="collapsible" />`)
    expect(sec(w, 'p').classes()).not.toContain('is-ready')
    await wait(120)
    expect(sec(w, 'p').classes()).toContain('is-ready')
    await w.find('button').trigger('click')
    expect(sec(w, 'p').classes()).toContain('is-animating')
    // transitionend de otra propiedad o de un descendiente no asienta
    w.find('#p-panel').element.dispatchEvent(Object.assign(new Event('transitionend', { bubbles: true }), { propertyName: 'opacity' }))
    await nextTick()
    expect(sec(w, 'p').classes()).toContain('is-animating')
    const ev = new Event('transitionend', { bubbles: true })
    ev.propertyName = 'grid-template-rows'
    w.find('#p-panel').element.dispatchEvent(ev)
    await nextTick()
    expect(sec(w, 'p').classes()).not.toContain('is-animating')
    await w.find('button').trigger('click')
    await wait(80)
    expect(sec(w, 'p').classes()).not.toContain('is-animating')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormSection · estado de errores por sección (#286)', () => {
  const tpl = (labels = 'labels') => `<GForm ref="form" :labels="${labels}" :errors="errors" :warnings="warnings">
    <GFormSection id="s" title="S" mode="collapsible">
      <GFormLayout>
        <GInput id="a" label="A" name="a" />
        <GInput id="b" label="B" name="b" />
        <GInput id="c" label="C" name="c" disabled />
        <GFieldGroup label="Teléfono" name="tel"><GInput id="p1" label="Lada" name="p1" /><GInput id="p2" label="Número" name="p2" /></GFieldGroup>
        <GInput id="q" label="Q" name="q" />
        <GFormReveal :when="false"><GInput id="r" label="R" name="r" /></GFormReveal>
      </GFormLayout>
    </GFormSection>
  </GForm>`
  const ERR = { a: 'A mal', c: 'C mal', p1: 'P1 mal', p2: 'P2 mal', r: 'R mal' }
  const fold = async (w) => { await w.find('#s-toggle').trigger('click'); await nextTick() }

  it('cuenta preguntas con error visible: un grupo es una; no advertencias, deshabilitados ni inactivos; nada antes de revelar', async () => {
    const form = ref(null)
    const w = make(tpl(), () => ({ form, labels: LABELS, errors: ERR, warnings: { b: 'B dudoso' } }))
    await wait()
    // plegada y sin revelar: «castigar tarde», sin estado
    expect(w.find('.g-form-section__status').exists()).toBe(false)
    await form.value.showErrors()
    await wait()
    // showErrors() abrió la plegada; al volver a plegar, el encabezado lo dice
    expect(sec(w, 's').classes()).toContain('is-open')
    await fold(w)
    const st = w.find('p.g-form-section__summary > span.g-form-section__status')
    expect(st.text()).toBe('2 errores')
    expect(st.element.firstElementChild.tagName.toLowerCase()).toBe('svg')
    expect(st.element.firstElementChild.classList.contains('g-icon')).toBe(true)
    expect(w.find('#s-toggle').attributes('aria-describedby')).toBe('s-summary')
  })

  it('un error explícito (prop) cuenta sin revelar; labels.sectionErrors como Function', async () => {
    const w = make(`<GForm :labels="labels"><GFormSection title="S" mode="collapsible"><GFormLayout><GInput label="A" name="a" error="Mal" /><GInput label="B" error="Mal sin nombre" /></GFormLayout></GFormSection></GForm>`,
      () => ({ labels: { ...LABELS, sectionErrors: (n) => (n === 1 ? '1 problema' : `${n} problemas`) } }))
    await wait()
    expect(w.find('.g-form-section__status').text()).toBe('1 problema')
  })

  it('sin labels.sectionErrors: sin estado y GForm avisa una vez', async () => {
    const warn = quiet()
    const w = make(`<GForm :labels="labels"><GFormSection title="S" mode="collapsible" summary="texto"><GFormLayout><GInput label="A" name="a" error="Mal" /></GFormLayout></GFormSection>
      <GFormSection title="T" mode="collapsible"><GFormLayout><GInput label="B" name="b" error="Mal" /></GFormLayout></GFormSection></GForm>`,
      () => ({ labels: { ...LABELS, sectionErrors: undefined } }))
    await wait()
    expect(w.find('.g-form-section__status').exists()).toBe(false)
    expect(w.find('.g-form-section__summary-text').text()).toBe('texto')
    expect(warns(warn, '[Grana GForm]').filter((m) => /sectionErrors/.test(m))).toHaveLength(1)
  })

  it('se propaga a la sección ancestro; fuera de GForm no hay estado (solo summary)', async () => {
    const w = make(`<GForm :labels="labels"><GFormSection id="out" title="Fuera" mode="collapsible">
      <GFormSection id="in" title="Dentro" mode="collapsible" :open="true"><GFormLayout><GInput label="A" name="a" error="Mal" /></GFormLayout></GFormSection>
    </GFormSection></GForm>`, () => ({ labels: LABELS }))
    await wait()
    expect(sec(w, 'out').find(':scope > .g-form-section__header .g-form-section__status').text()).toBe('1 errores')
    const v = make(`<GFormSection title="S" mode="collapsible" summary="solo texto"><GFormLayout><GInput label="A" name="a" error="Mal" /></GFormLayout></GFormSection>`)
    expect(v.find('.g-form-section__status').exists()).toBe(false)
    expect(v.find('.g-form-section__summary-text').text()).toBe('solo texto')
  })

  it('abierta no hay línea; static y addable no la pintan nunca', async () => {
    const w = make(`<GForm :labels="labels"><GFormSection id="a" title="A" mode="collapsible" :open="true"><GFormLayout><GInput label="A" name="a" error="Mal" /></GFormLayout></GFormSection>
      <GFormSection title="B"><GFormLayout><GInput label="B" name="b" error="Mal" /></GFormLayout></GFormSection></GForm>`, () => ({ labels: LABELS }))
    await wait()
    expect(w.find('.g-form-section__summary').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormSection · abrir antes de enfocar (OPEN_REQUEST, #287)', () => {
  const FORM = `<GForm ref="form" :labels="labels" :errors="errors" @invalid="onInvalid">
      <GErrorSummary v-if="summary" :labels="{ title: '{count} problemas' }" />
      <GFormSection id="ok" title="Sin errores" mode="collapsible" @update:open="(v) => log.push('ok:' + v)"><GFormLayout><GInput id="x" label="X" name="x" /></GFormLayout></GFormSection>
      <GFormSection id="s1" title="Uno" mode="collapsible" @update:open="(v) => log.push('s1:' + v)"><GFormLayout><GInput id="a" label="A" name="a" /></GFormLayout></GFormSection>
      <GFormSection id="s2" title="Dos" mode="collapsible" @update:open="(v) => log.push('s2:' + v)">
        <GFormSection id="s3" title="Tres" mode="collapsible" @update:open="(v) => log.push('s3:' + v)"><GFormLayout><GInput id="b" label="B" name="b" /></GFormLayout></GFormSection>
      </GFormSection>
    </GForm>`
  const setup = (over = {}) => () => ({ form: ref(null), labels: LABELS, errors: { a: 'A mal', b: 'B mal' }, onInvalid: vi.fn(), log: [], summary: false, ...over })

  it('envío con errores: abre, en un cuadro y sin animar (is-instant), TODAS las plegadas con error que bloquea (anidadas incluidas) y enfoca el primer inválido', async () => {
    const log = []
    const w = make(FORM, setup({ log }))
    await wait(80)
    await w.find('form').trigger('submit')
    await wait(0)
    for (const id of ['s1', 's2', 's3']) expect(sec(w, id).classes()).toEqual(expect.arrayContaining(['is-open', 'is-instant']))
    expect(sec(w, 's1').classes()).not.toContain('is-animating')
    expect(sec(w, 'ok').classes()).not.toContain('is-open')
    await wait(40)
    expect(document.activeElement.id).toBe('a')
    expect(log).toEqual(expect.arrayContaining(['s1:true', 's2:true', 's3:true']))
    expect(log).not.toContain('ok:true')
    await wait(80)
    expect(sec(w, 's1').classes()).not.toContain('is-instant')
  })

  it('con GErrorSummary montado: abre igual las plegadas con error y el foco va al resumen', async () => {
    const w = make(FORM, setup({ summary: true }))
    await w.find('form').trigger('submit')
    await wait(60)
    expect(sec(w, 's1').classes()).toContain('is-open')
    expect(sec(w, 's3').classes()).toContain('is-open')
    expect(document.activeElement.classList.contains('g-error-summary')).toBe(true)
  })

  it('showErrors() con un error del servidor en otra plegada: la abre', async () => {
    const errors = ref({})
    const s = setup({ errors })
    const w = make(FORM, () => ({ ...s(), errors }))
    const form = w.vm.$refs.form
    errors.value = { b: 'Ya existe' }
    await nextTick()
    const list = await form.showErrors()
    expect(list.map((i) => i.name)).toEqual(['b'])
    expect(sec(w, 's3').classes()).toContain('is-open')
    expect(sec(w, 's1').classes()).not.toContain('is-open')
    expect(document.activeElement.id).toBe('b')
  })

  it('focusFirstError() abre la sección y resuelve true con el foco ya puesto; sin nada, false', async () => {
    const form = ref(null)
    const w = make(`<GForm ref="form" :labels="labels"><GFormSection id="s" title="S" mode="collapsible"><GFormLayout><GInput id="a" label="A" name="a" error="Mal" /></GFormLayout></GFormSection></GForm>`, () => ({ form, labels: LABELS }))
    const p = form.value.focusFirstError()
    expect(p).toBeInstanceOf(Promise)
    expect(document.activeElement.id).not.toBe('a') // aún no: espera el parche
    expect(await p).toBe(true)
    expect(document.activeElement.id).toBe('a')
    expect(sec(w, 's').classes()).toContain('is-open')
    const v = make(`<GForm ref="f2"><GInput label="X" name="x" /></GForm>`)
    expect(await v.vm.$refs.f2.focusFirstError()).toBe(false)
  })

  it('enlace del resumen dentro de GForm: abre y enfoca', async () => {
    const w = make(FORM, setup({ summary: true }))
    await w.find('form').trigger('submit')
    await wait(60)
    // vuelve a plegar s1 y sigue el enlace
    await w.find('#s1-toggle').trigger('click')
    expect(sec(w, 's1').classes()).not.toContain('is-open')
    await w.find('a.g-error-summary__link[href="#a"]').trigger('click')
    await wait(10)
    expect(sec(w, 's1').classes()).toEqual(expect.arrayContaining(['is-open', 'is-instant']))
    expect(document.activeElement.id).toBe('a')
  })

  it('enlace del resumen fuera de GForm (errors propios): abre la plegada sin conocerla', async () => {
    const w = make(`<div><GErrorSummary :errors="[{ id: 'fuera', message: 'Falta' }]" :labels="{ title: 'Hay {count}' }" />
      <GFormSection id="s" title="S" mode="collapsible"><GFormLayout><GInput id="fuera" label="F" /></GFormLayout></GFormSection></div>`)
    await nextTick()
    await w.find('a.g-error-summary__link').trigger('click')
    await wait(10)
    expect(sec(w, 's').classes()).toContain('is-open')
    expect(document.activeElement.id).toBe('fuera')
  })

  it('una petición desde el encabezado no abre (se escucha en __panel); sin plegadas, revealAndFocus sigue síncrono', async () => {
    const w = make(`<div><GFormSection id="s" title="S" mode="collapsible"><template #actions><button id="acc" type="button">Acc</button></template></GFormSection><input id="libre" /></div>`)
    const ev = new CustomEvent(OPEN_REQUEST, { bubbles: true, cancelable: true })
    w.find('#acc').element.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
    await nextTick()
    expect(sec(w, 's').classes()).not.toContain('is-open')
    const p = revealAndFocus(w.find('#libre').element)
    expect(document.activeElement.id).toBe('libre')
    expect(p).toBeInstanceOf(Promise)
  })

  it('OPEN_REQUEST desde un control de una plegada: la sección lo cancela, se abre con is-instant (sin is-animating) y emite update:open(true)', async () => {
    const onUpdate = vi.fn()
    const w = make(`<GFormSection id="s" title="S" mode="collapsible" @update:open="onUpdate"><GFormLayout><GInput id="a" label="A" /></GFormLayout></GFormSection>`, () => ({ onUpdate }))
    const ev = new CustomEvent(OPEN_REQUEST, { bubbles: true, cancelable: true })
    w.find('#a').element.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    expect(onUpdate).toHaveBeenCalledWith(true)
    await nextTick()
    expect(sec(w, 's').classes()).toEqual(expect.arrayContaining(['is-open', 'is-instant']))
    expect(sec(w, 's').classes()).not.toContain('is-animating')
    expect(w.find('#s-panel').element.hasAttribute('inert')).toBe(false)
    // una agregable sin agregar no se abre por la petición (un inactivo no es destino)
    const v = make(`<GFormSection id="f" title="F" mode="addable" :labels="fiscal"><GFormLayout><GInput id="b" label="B" /></GFormLayout></GFormSection>`, () => ({ fiscal: FISCAL }))
    const ev2 = new CustomEvent(OPEN_REQUEST, { bubbles: true, cancelable: true })
    v.find('#b').element.dispatchEvent(ev2)
    expect(ev2.defaultPrevented).toBe(false)
  })

  it('una abierta no cancela la petición (quien la despachó no espera)', async () => {
    const w = make(`<GFormSection id="s" title="S" mode="collapsible" :open="true"><GFormLayout><GInput id="a" label="A" /></GFormLayout></GFormSection>`)
    const ev = new CustomEvent(OPEN_REQUEST, { bubbles: true, cancelable: true })
    w.find('#a').element.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormSection · addable (#288)', () => {
  const FORM = `<GForm ref="form" :labels="labels" :errors="errors" v-model:dirty="dirty" @submit="onSubmit" @invalid="onInvalid">
      <GErrorSummary :labels="{ title: '{count} problemas' }" />
      <GFormSection id="f" title="Datos fiscales" description="Solo si pide factura." mode="addable" :labels="fiscal" v-model:added="added">
        <GFormLayout><GInput id="rfc" label="RFC" name="rfc" v-model="rfc" /><GInput id="libre" label="Nota" name="nota" /></GFormLayout>
      </GFormSection>
      <GInput id="nombre" label="Nombre" name="nombre" />
    </GForm>`
  const ctx = (over = {}) => {
    const c = { form: ref(null), labels: LABELS, fiscal: FISCAL, errors: { rfc: 'Escribe el RFC' }, dirty: ref(false), added: ref(false), rfc: ref(''), onSubmit: vi.fn(), onInvalid: vi.fn(), ...over }
    return c
  }

  it('sin agregar: sin hN; «Agregar …» (GBtn outline neutral con plus) unido a la descripción; panel inert + fieldset role=none disabled', () => {
    const c = ctx()
    const w = make(FORM, () => c)
    const s = sec(w, 'f').element
    expect([...s.classList]).toEqual(expect.arrayContaining(['g-form-section', 'g-form-section--mode-addable']))
    expect(s.classList.contains('is-open')).toBe(false)
    expect(s.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull()
    expect(s.children).toHaveLength(3)
    expect(s.children[0].className).toBe('g-form-section__add')
    expect(s.children[1].className).toBe('g-form-section__panel')
    expect(s.children[2].classList.contains('g-form-section__confirm')).toBe(true)
    const add = s.querySelector('.g-form-section__add > button')
    expect([...add.classList]).toEqual(expect.arrayContaining(['g-btn', 'g-btn--variant-outline', 'g-btn--color-neutral', 'g-form-section__add-button']))
    expect(add.getAttribute('type')).toBe('button')
    expect(add.textContent.trim()).toBe('Agregar datos fiscales')
    expect(add.querySelector('svg.g-icon')).not.toBeNull()
    expect(add.getAttribute('aria-expanded')).toBeNull()
    expect(add.getAttribute('aria-describedby')).toBe('f-add-description')
    const desc = s.querySelector('#f-add-description')
    expect(desc.className).toBe('g-form-section__description')
    expect(add.nextElementSibling).toBe(desc)
    const panel = s.querySelector('.g-form-section__panel')
    expect(panel.hasAttribute('inert')).toBe(true)
    const fs = panel.firstElementChild
    expect(fs.tagName).toBe('FIELDSET')
    expect(fs.getAttribute('role')).toBe('none')
    expect(fs.disabled).toBe(true)
    expect(fs.querySelector('legend')).toBeNull()
    const dlg = s.lastElementChild
    expect(dlg.tagName).toBe('DIALOG')
    expect(dlg.getAttribute('role')).toBe('alertdialog')
  })

  it('sin agregar: fuera de FormData y registro inactivo (los errores sin condiciones no bloquean ni son generales)', async () => {
    const c = ctx()
    const w = make(FORM, () => c)
    expect(keys(w.find('form').element)).toEqual(['nombre'])
    await w.find('form').trigger('submit')
    await wait()
    expect(c.onInvalid).not.toHaveBeenCalled()
    expect(c.onSubmit).toHaveBeenCalledTimes(1)
    expect([...c.onSubmit.mock.calls[0][0].data.keys()]).toEqual(['nombre'])
  })

  it('agregar (usuario): emite update:added(true), encabezado con hN tabindex=-1 enfocado, «Quitar …» en __actions; dirty no cambia', async () => {
    const c = ctx()
    const w = make(FORM, () => c)
    await w.find('.g-form-section__add-button').trigger('click')
    await nextTick()
    expect(c.added.value).toBe(true)
    const s = sec(w, 'f')
    expect(s.classes()).toEqual(expect.arrayContaining(['is-open', 'is-added']))
    const title = s.find('h3.g-form-section__title')
    expect(title.attributes('id')).toBe('f-title')
    expect(title.attributes('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(title.element)
    const rm = s.find('.g-form-section__actions > button.g-form-section__remove')
    expect(rm.classes()).toEqual(expect.arrayContaining(['g-btn--variant-ghost', 'g-btn--color-neutral']))
    expect(rm.text()).toBe('Quitar datos fiscales')
    expect(s.find('.g-form-section__add').exists()).toBe(false)
    expect(s.find('fieldset').element.disabled).toBe(false)
    expect(s.find('.g-form-section__panel').element.hasAttribute('inert')).toBe(false)
    expect(keys(w.find('form').element)).toEqual(['rfc', 'nota', 'nombre'])
    expect(c.dirty.value).toBe(false)
    // ahora el error cuenta
    await w.find('form').trigger('submit')
    await wait()
    expect(c.onInvalid).toHaveBeenCalledTimes(1)
  })

  it('agregar por programa: sin mover el foco', async () => {
    const c = ctx()
    const w = make(FORM, () => c)
    w.find('#nombre').element.focus()
    c.added.value = true
    await nextTick()
    expect(sec(w, 'f').classes()).toContain('is-added')
    expect(document.activeElement.id).toBe('nombre')
  })

  it('quitar sin nada que perder: directo; foco a «Agregar …»; dirty sube; update:added(false)', async () => {
    const c = ctx()
    const w = make(FORM, () => c)
    await w.find('.g-form-section__add-button').trigger('click')
    await nextTick()
    await w.find('.g-form-section__remove').trigger('click')
    await nextTick()
    expect(c.added.value).toBe(false)
    expect(w.find('dialog').attributes('open')).toBeUndefined()
    expect(document.activeElement.classList.contains('g-form-section__add-button')).toBe(true)
    expect(c.dirty.value).toBe(true)
  })

  it('con edición: alertdialog con «Cancelar» (autofocus) enfocado; Cancelar y Esc no quitan; Confirmar quita y, al cerrarse, enfoca «Agregar …»', async () => {
    const c = ctx()
    const w = make(FORM, () => c)
    await w.find('.g-form-section__add-button').trigger('click')
    await nextTick()
    await w.find('#libre').setValue('algo') // input nativo que burbujea en el cuerpo
    await w.find('.g-form-section__remove').trigger('click')
    await nextTick()
    await nextTick()
    const dlg = w.find('dialog.g-form-section__confirm')
    expect(dlg.attributes('open')).toBeDefined()
    expect(dlg.find('.g-dialog__title').text()).toBe('¿Quitar los datos fiscales?')
    expect(dlg.find('.g-dialog__description').text()).toBe('Se descartará lo que escribiste.')
    const [cancel, confirm] = dlg.findAll('.g-dialog__footer button')
    expect(cancel.text()).toBe('Cancelar')
    expect(cancel.attributes('autofocus')).toBeDefined()
    expect(cancel.classes()).toEqual(expect.arrayContaining(['g-btn--variant-outline', 'g-btn--color-neutral']))
    expect(confirm.text()).toBe('Quitar')
    expect(confirm.classes()).toEqual(expect.arrayContaining(['g-btn--variant-solid', 'g-btn--color-danger']))
    expect(document.activeElement).toBe(cancel.element)
    await cancel.trigger('click')
    await nextTick()
    expect(dlg.attributes('open')).toBeUndefined()
    expect(c.added.value).toBe(true)
    // Esc
    await w.find('.g-form-section__remove').trigger('click')
    await nextTick()
    await dlg.trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(dlg.attributes('open')).toBeUndefined()
    expect(c.added.value).toBe(true)
    // Confirmar
    await w.find('.g-form-section__remove').trigger('click')
    await nextTick()
    await nextTick()
    await dlg.findAll('.g-dialog__footer button')[1].trigger('click')
    await nextTick()
    expect(c.added.value).toBe(false)
    expect(c.dirty.value).toBe(true)
    await nextTick()
    expect(document.activeElement.classList.contains('g-form-section__add-button')).toBe(true)
  })

  it('agregada por la aplicación (added al montar): quitar pide confirmación aunque no se haya escrito', async () => {
    const c = ctx({ added: ref(true) })
    const w = make(FORM, () => c)
    await w.find('.g-form-section__remove').trigger('click')
    await nextTick()
    expect(w.find('dialog').attributes('open')).toBeDefined()
    expect(c.added.value).toBe(true)
  })

  it('notifyChange() de un campo propio dentro marca la sección como editada (sectionKey.notifyEdit)', async () => {
    const added = ref(false)
    const w = make(`<GFormSection id="f" title="F" mode="addable" :labels="fiscal" v-model:added="added"><GFormLayout><MiCampo name="x" /></GFormLayout></GFormSection>`, () => ({ fiscal: FISCAL, added }))
    await w.find('.g-form-section__add-button').trigger('click')
    await nextTick()
    await w.find('.mi-campo').trigger('click')
    await w.find('.g-form-section__remove').trigger('click')
    await nextTick()
    expect(w.find('dialog').attributes('open')).toBeDefined()
  })

  it('quitar descarta: cuerpo con clave nueva al terminar la transición (lo no controlado se vacía), errores fuera del resumen en silencio', async () => {
    const c = ctx({ added: ref(true), labels: LABELS })
    const w = make(FORM, () => ({ ...c, fiscal: { add: FISCAL.add, remove: FISCAL.remove } }))
    await w.find('form').trigger('submit')
    await wait()
    expect(w.findAll('.g-error-summary__link').map((a) => a.text())).toEqual(['Escribe el RFC'])
    await w.find('#libre').setValue('no controlado')
    const before = w.find('#libre').element
    await w.find('.g-form-section__remove').trigger('click') // sin textos de confirmación: directo
    await nextTick()
    expect(c.added.value).toBe(false)
    expect(w.find('.g-error-summary').attributes('hidden')).toBeDefined()
    // aún el mismo cuerpo mientras se funde
    expect(w.find('#libre').element).toBe(before)
    await wait(80)
    expect(w.find('#libre').element).not.toBe(before)
    expect(w.find('#libre').element.value).toBe('')
    // volver a agregar empieza vacía y sin errores revelados
    await w.find('.g-form-section__add-button').trigger('click')
    await nextTick()
    expect(w.find('#rfc').attributes('aria-invalid')).toBeUndefined()
  })

  it('quitar por programa con el foco dentro: a «Agregar …»; sin foco dentro, no lo mueve; no emite', async () => {
    const c = ctx({ added: ref(true) })
    const onAdded = vi.fn()
    const w = make(FORM.replace('v-model:added="added"', ':added="added" @update:added="onAdded"'), () => ({ ...c, onAdded }))
    w.find('#rfc').element.focus()
    c.added.value = false
    await nextTick()
    await nextTick()
    expect(document.activeElement.classList.contains('g-form-section__add-button')).toBe(true)
    expect(onAdded).not.toHaveBeenCalled()
    c.added.value = true
    await nextTick()
    w.find('#nombre').element.focus()
    c.added.value = false
    await nextTick()
    await nextTick()
    expect(document.activeElement.id).toBe('nombre')
  })

  it('readonly/disabled: sin «Agregar …» ni «Quitar …»; sin agregar = hidden', () => {
    for (const st of ['readonly', 'disabled']) {
      const w = make(`<GForm ${st}><GFormSection id="a" title="A" mode="addable" :labels="fiscal" /><GFormSection id="b" title="B" mode="addable" :labels="fiscal" :added="true" /></GForm>`, () => ({ fiscal: FISCAL }))
      expect(sec(w, 'a').attributes('hidden')).toBeDefined()
      expect(sec(w, 'a').find('.g-form-section__add').exists()).toBe(false)
      expect(sec(w, 'b').attributes('hidden')).toBeUndefined()
      expect(sec(w, 'b').find('.g-form-section__remove').exists()).toBe(false)
      expect(sec(w, 'b').find('.g-form-section__actions').exists()).toBe(false)
      expect(sec(w, 'b').find('h3').exists()).toBe(true)
      mounted.pop().unmount()
    }
  })

  it('sin labels.add no hay botón; sin labels.remove no hay «Quitar …»', () => {
    quiet()
    const w = make(`<GFormSection id="a" title="A" mode="addable" description="d" /><GFormSection id="b" title="B" mode="addable" :added="true" />`)
    expect(sec(w, 'a').find('.g-form-section__add-button').exists()).toBe(false)
    expect(sec(w, 'b').find('.g-form-section__remove').exists()).toBe(false)
    expect(sec(w, 'b').find('dialog').exists()).toBe(false)
  })

  it('el aviso 3 de §14 NO sale por una sección dentro de una agregable; SÍ por un GFormReveal por encima', () => {
    const warn = quiet()
    make(`<GFormSection title="Fuera" mode="addable" :labels="fiscal"><GFormSection title="Dentro"><p>x</p></GFormSection></GFormSection>`, () => ({ fiscal: FISCAL }))
    expect(warns(warn).filter((m) => /GFormReveal/.test(m))).toHaveLength(0)
    make(`<GFormLayout><GInput label="Q" /><GFormReveal :when="true"><GFormSection title="Fuera" mode="addable" :labels="fiscal"><GFormSection title="Dentro"><p>x</p></GFormSection></GFormSection></GFormReveal></GFormLayout>`, () => ({ fiscal: FISCAL }))
    expect(warns(warn).filter((m) => /GFormReveal/.test(m))).toHaveLength(2)
  })

  it('campos de una sección anidada en una agregable sin agregar: inactivos', async () => {
    const onSubmit = vi.fn()
    const w = make(`<GForm :errors="{ x: 'Mal' }" @submit="onSubmit"><GFormSection title="F" mode="addable" :labels="fiscal"><GFormSection title="D"><GFormLayout><GInput label="X" name="x" /></GFormLayout></GFormSection></GFormSection></GForm>`, () => ({ fiscal: FISCAL, onSubmit }))
    await w.find('form').trigger('submit')
    await wait()
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormSection · headerPlacement e is-actions-below (#289)', () => {
  class FakeRO {
    static all = []
    constructor(cb) { this.cb = cb; this.els = []; FakeRO.all.push(this) }
    observe(el) { this.els.push(el) }
    unobserve(el) { this.els = this.els.filter((e) => e !== el) }
    disconnect() { this.els = [] }
    fire() { this.cb(this.els.map((el) => ({ target: el }))) }
  }
  // Anchos simulados por clase (jsdom no maqueta): raíz, encabezado y cada hijo de __actions
  let widths
  beforeEach(() => {
    FakeRO.all = []
    vi.stubGlobal('ResizeObserver', FakeRO)
    widths = { root: 1000, header: 1000, action: 100 }
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      let width = 0
      if (this.classList.contains('g-form-section')) width = widths.root
      else if (this.classList.contains('g-form-section__header')) width = widths.header
      else if (this.parentElement && this.parentElement.classList.contains('g-form-section__actions')) width = widths.action
      return { width, height: 20, top: 0, left: 0, right: width, bottom: 20, x: 0, y: 0 }
    })
  })

  it('auto: is-header-side con ancho propio ≥ space × 200 (800 con space 4); arriba por debajo; top nunca', async () => {
    const w = make(`<div><GFormSection id="a" title="A" header-placement="auto"><p>x</p></GFormSection><GFormSection id="t" title="T"><p>x</p></GFormSection></div>`)
    expect(sec(w, 'a').classes()).not.toContain('is-header-side') // antes de medir: arriba
    await wait(60)
    expect(sec(w, 'a').classes()).toContain('is-header-side')
    expect(sec(w, 't').classes()).not.toContain('is-header-side')
    widths.root = 799
    FakeRO.all[0].fire()
    await wait(40)
    expect(sec(w, 'a').classes()).not.toContain('is-header-side')
    widths.root = 800
    FakeRO.all[0].fire()
    await wait(40)
    expect(sec(w, 'a').classes()).toContain('is-header-side')
  })

  it('un solo ResizeObserver compartido por todas las secciones', async () => {
    make(`<div><GFormSection title="A" header-placement="auto" /><GFormSection title="B" header-placement="auto" /><GFormSection title="C"><template #actions><button type="button">x</button></template></GFormSection></div>`)
    await wait(40)
    expect(FakeRO.all).toHaveLength(1)
  })

  it('L9: encabezado − acciones (hijos + separaciones) − separación < space × 40 → is-actions-below; también static; no con is-header-side', async () => {
    widths = { root: 400, header: 400, action: 120 }
    const w = make(`<div><GFormSection id="s" title="Datos del paciente"><template #actions><button type="button">Copiar de la cita</button><button type="button">Otra</button></template><p>x</p></GFormSection></div>`)
    await wait(60)
    // 400 − 240 = 160: no es < 160
    expect(sec(w, 's').classes()).not.toContain('is-actions-below')
    widths.header = 399
    widths.root = 399
    FakeRO.all[0].fire()
    await wait(40)
    expect(sec(w, 's').classes()).toContain('is-actions-below')
    // al lado no aplica
    const v = make(`<GFormSection id="side" title="T" header-placement="auto"><template #actions><button type="button">x</button></template></GFormSection>`)
    widths = { root: 900, header: 100, action: 120 }
    await wait(60)
    expect(sec(v, 'side').classes()).toContain('is-header-side')
    expect(sec(v, 'side').classes()).not.toContain('is-actions-below')
  })

  it('al pasar de «al lado» a arriba, dos medidas en el mismo cuadro no encienden is-actions-below (hallazgo 1)', async () => {
    // El encabezado «al lado» mide su columna (215); arriba, el ancho de la sección: se simula por la clase PINTADA
    widths = { root: 1000, header: 1000, action: 100 }
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      let width = 0
      if (this.classList.contains('g-form-section')) width = widths.root
      else if (this.classList.contains('g-form-section__header')) width = this.parentElement.classList.contains('is-header-side') ? 215 : widths.root
      else if (this.parentElement && this.parentElement.classList.contains('g-form-section__actions')) width = widths.action
      return { width, height: 20, top: 0, left: 0, right: width, bottom: 20, x: 0, y: 0 }
    })
    const w = make(`<GFormSection id="a" title="A" header-placement="auto"><template #actions><button type="button">x</button></template><p>x</p></GFormSection>`)
    await wait(80)
    expect(sec(w, 'a').classes()).toContain('is-header-side')
    expect(sec(w, 'a').classes()).not.toContain('is-actions-below')
    const seen = []
    const mo = new MutationObserver(() => seen.push(sec(w, 'a').element.classList.contains('is-actions-below')))
    mo.observe(sec(w, 'a').element, { attributes: true, attributeFilter: ['class'] })
    widths.root = 720
    // Dos medidas en el mismo cuadro, antes de que Vue pinte la clase (el observador y el cambio de headerPlacement)
    const measureTwice = () => new Promise((r) => requestAnimationFrame(() => { FakeRO.all[0].fire(); FakeRO.all[0].fire(); r() }))
    await measureTwice()
    await wait(60)
    mo.disconnect()
    expect(sec(w, 'a').classes()).not.toContain('is-header-side')
    expect(sec(w, 'a').classes()).not.toContain('is-actions-below')
    expect(seen).not.toContain(true)
  })

  it('escribe solo si cambia (sin mutaciones de clase al volver a medir lo mismo)', async () => {
    const w = make(`<GFormSection id="a" title="A" header-placement="auto"><p>x</p></GFormSection>`)
    await wait(120)
    const muts = []
    const mo = new MutationObserver((r) => muts.push(...r))
    mo.observe(sec(w, 'a').element, { attributes: true, attributeFilter: ['class'] })
    FakeRO.all[0].fire()
    await wait(40)
    mo.disconnect()
    expect(muts).toHaveLength(0)
  })

  it('collapsible y addable: is-ready llega después de la primera medida', async () => {
    const w = make(`<GFormSection id="a" title="A" mode="collapsible" header-placement="auto" />`)
    const seen = []
    const mo = new MutationObserver(() => seen.push(['is-header-side', 'is-ready'].filter((c) => sec(w, 'a').element.classList.contains(c)).join(',')))
    mo.observe(sec(w, 'a').element, { attributes: true, attributeFilter: ['class'] })
    await wait(120)
    mo.disconnect()
    expect(seen[0]).toBe('is-header-side')
    expect(seen.at(-1)).toBe('is-header-side,is-ready')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormSection · SSR (renderToString)', () => {
  const render = (template, data = {}) => renderToString(createSSRApp({ components, data: () => ({ labels: LABELS, fiscal: FISCAL, ...data }), template }))

  it('collapsible plegada: inert desde el primer HTML, aria-expanded=false, sin is-ready; abierta: is-open sin inert', async () => {
    const t = `<GForm :labels="labels"><GFormSection id="s" title="S" mode="collapsible" :open="open" summary="Resumen"><GFormLayout><GInput label="A" name="a" /></GFormLayout></GFormSection></GForm>`
    let html = await render(t, { open: false })
    const root = html.match(/<section[^>]*>/)[0]
    expect(root).not.toMatch(/is-ready|is-open|is-header-side|is-actions-below/)
    expect(html).toMatch(/<div id="s-panel" class="g-form-section__panel" inert/)
    expect(html).toMatch(/aria-expanded="false"/)
    expect(html).toContain('g-form-section__summary')
    html = await render(t, { open: true })
    expect(html.match(/<section[^>]*>/)[0]).toContain('is-open')
    expect(html).not.toMatch(/g-form-section__panel"[^>]*inert/)
    expect(html).not.toContain('g-form-section__summary')
  })

  it('addable: sin agregar, fieldset disabled + panel inert y sin hN; agregada, hN y habilitado', async () => {
    const t = `<GForm :labels="labels"><GFormSection id="f" title="F" mode="addable" :labels="fiscal" :added="added"><GFormLayout><GInput label="A" name="a" /></GFormLayout></GFormSection></GForm>`
    let html = await render(t, { added: false })
    expect(html).toMatch(/<fieldset class="g-form-section__body" role="none" disabled/)
    expect(html).toMatch(/g-form-section__panel" inert/)
    expect(html).not.toMatch(/<h3/)
    expect(html).toContain('g-form-section__add-button')
    html = await render(t, { added: true })
    expect(html).toMatch(/<h3 class="g-form-section__title" id="f-title" tabindex="-1">/)
    expect(html).not.toMatch(/<fieldset[^>]*disabled/)
    expect(html.match(/<section[^>]*>/)[0]).toMatch(/is-open/)
    expect(html.match(/<section[^>]*>/)[0]).toMatch(/is-added/)
  })

  it('headerPlacement auto y acciones: encabezado arriba y acciones al lado (sin medida)', async () => {
    const html = await render(`<GFormSection title="S" header-placement="auto"><template #actions><button type="button">x</button></template></GFormSection>`)
    expect(html.match(/<section[^>]*>/)[0]).not.toMatch(/is-header-side|is-actions-below|is-ready/)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormSection · avisos de desarrollo 1 a 8 y los heredados', () => {
  const only = (spy, re) => warns(spy).filter((m) => re.test(m))
  it('1: open / v-model:open con un modo que no es collapsible', () => {
    const warn = quiet()
    make(`<div><GFormSection title="A" :open="true" /><GFormSection title="B" mode="addable" :labels="fiscal" @update:open="() => {}" /><GFormSection title="C" mode="collapsible" :open="true" /></div>`, () => ({ fiscal: FISCAL }))
    expect(only(warn, /^\[Grana GFormSection\] open/)).toHaveLength(2)
  })
  it('2: added / v-model:added con un modo que no es addable', () => {
    const warn = quiet()
    make(`<div><GFormSection title="A" mode="collapsible" :added="true" /><GFormSection title="B" @update:added="() => {}" /><GFormSection title="C" mode="addable" :labels="fiscal" :added="true" /></div>`, () => ({ fiscal: FISCAL }))
    expect(only(warn, /^\[Grana GFormSection\] added/)).toHaveLength(2)
  })
  it('3: summary (prop o slot) con un modo que no es collapsible; no se pinta', () => {
    const warn = quiet()
    const w = make(`<div><GFormSection title="A" summary="x" /><GFormSection title="B" mode="addable" :labels="fiscal" :added="true"><template #summary>y</template></GFormSection></div>`, () => ({ fiscal: FISCAL }))
    expect(only(warn, /summary \(prop o slot\)/)).toHaveLength(2)
    expect(w.find('.g-form-section__summary').exists()).toBe(false)
  })
  it('4: addable sin add, sin remove o sin los textos de confirmación (sin removeBody no avisa)', () => {
    const warn = quiet()
    make(`<GFormSection title="A" mode="addable" />`)
    expect(only(warn, /labels\.add/)).toHaveLength(1)
    expect(only(warn, /labels\.remove:/)).toHaveLength(1)
    expect(only(warn, /quita sin confirmar/)).toHaveLength(1)
    warn.mockClear()
    const { removeBody: _, ...noBody } = FISCAL
    make(`<GFormSection title="A" mode="addable" :labels="l" />`, () => ({ l: noBody }))
    expect(warns(warn)).toHaveLength(0)
  })
  it('5: optional con addable (sin insignia)', () => {
    const warn = quiet()
    const w = make(`<GForm :labels="labels"><GFormSection title="A" mode="addable" optional :labels="fiscal" :added="true" /></GForm>`, () => ({ labels: LABELS, fiscal: FISCAL }))
    expect(only(warn, /optional con mode="addable"/)).toHaveLength(1)
    expect(w.find('.g-badge').exists()).toBe(false)
    expect(w.find('section').classes()).toContain('g-form-section--optional')
  })
  it('6: sin title ni slot title', () => {
    const warn = quiet()
    make(`<div><GFormSection /><GFormSection><template #title>Rico</template></GFormSection></div>`)
    expect(only(warn, /title/)).toHaveLength(1)
  })
  it('7: algo interactivo en la línea de estado; un GIcon con label no avisa', async () => {
    const warn = quiet()
    make(`<GFormSection title="A" mode="collapsible"><template #summary><GIcon name="circle-check" label="Completa" /> Lista</template></GFormSection>`)
    await nextTick()
    expect(only(warn, /no admite nada interactivo/)).toHaveLength(0)
    make(`<GFormSection title="B" mode="collapsible"><template #summary><a href="#x">ver</a></template></GFormSection>`)
    await nextTick()
    expect(only(warn, /no admite nada interactivo/)).toHaveLength(1)
  })
  it('8: mode cambia tras montar (se pinta en el modo nuevo)', async () => {
    const warn = quiet()
    const mode = ref('static')
    const w = make(`<GFormSection title="A" :mode="mode" :labels="fiscal"><p>x</p></GFormSection>`, () => ({ mode, fiscal: FISCAL }))
    mode.value = 'collapsible'
    await nextTick()
    expect(only(warn, /mode cambió/)).toHaveLength(1)
    expect(w.find('.g-form-section__toggle').exists()).toBe(true)
  })
  it('GDivider a mano entre dos secciones: aviso con el texto nuevo; con divider no', () => {
    const warn = quiet()
    make(`<div><GFormSection title="A" /><GDivider /><GFormSection title="B" /><GFormSection title="C" divider /></div>`)
    const m = only(warn, /GDivider a mano/)
    expect(m).toHaveLength(1)
    expect(m[0]).toMatch(/entre secciones la separación es el espacio; para una línea, usa `divider` en la sección/)
  })
  it('ya no avisa por props reservadas', () => {
    const warn = quiet()
    make(`<GFormSection title="A" mode="collapsible" header-placement="auto" divider />`)
    expect(warns(warn).filter((m) => /reservad|Fase 3/.test(m))).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GFormSection · claves internas', () => {
  it('OPEN_REQUEST, requestOpen, sectionKey y revealKey no se exportan desde src/index.js; el nombre del evento es g-open-request', async () => {
    const lib = await import('../../index.js')
    for (const k of ['OPEN_REQUEST', 'requestOpen', 'sectionKey', 'revealKey']) expect(lib[k]).toBeUndefined()
    expect(lib.GFormSection).toBeDefined()
    expect(OPEN_REQUEST).toBe('g-open-request')
  })
})
