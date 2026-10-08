import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import GAccordion from './GAccordion.vue'
import GAccordionItem from './GAccordionItem.vue'
import GForm from '../GForm/GForm.vue'
import { requestOpen } from '../GForm/formContext.js'
import { keepInPlace } from '../../utils/collapse.js'

// Δ0 (#481): se espía la compensación sin cambiarla (en jsdom no hay geometría: no desplaza nada)
vi.mock('../../utils/collapse.js', async (importOriginal) => {
  const mod = await importOriginal()
  return { ...mod, keepInPlace: vi.fn(mod.keepInPlace) }
})

const components = { GAccordion, GAccordionItem, GForm }
const wait = (ms = 40) => new Promise((r) => setTimeout(r, ms))
// is-ready tras dos cuadros y respaldo del motor (transitionMs = 0 en jsdom → 50 ms)
const settleAll = () => wait(120)
const mounted = []
function make(template, setup = () => ({}), opts = {}) {
  const w = mount(defineComponent({ components, setup, template }), { attachTo: document.body, ...opts })
  mounted.push(w)
  return w
}
const warns = (spy, tag) => spy.mock.calls.map((c) => c[0]).filter((m) => typeof m === 'string' && m.startsWith(tag))
const groupWarns = (spy) => warns(spy, '[Grana GAccordion]')
const itemWarns = (spy) => warns(spy, '[Grana GAccordionItem]')
const quiet = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
const exp = (w, id) => w.find(`#${id}-toggle`).attributes('aria-expanded')
const hiddenOf = (w, id) => w.find(`#${id}-content`).attributes('hidden')
const FAQ = `
  <g-accordion-item id="cambiar" title="¿Puedo cambiar la cita?" peek="Sí, hasta 24 horas antes.">Sí, hasta 24 horas antes.</g-accordion-item>
  <g-accordion-item id="documentos" title="¿Qué documentos necesito?">Una identificación.</g-accordion-item>
  <g-accordion-item id="resultados" title="¿Cuánto tardan los resultados?">48 horas.</g-accordion-item>`

afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  vi.restoreAllMocks()
  keepInPlace.mockClear()
  if (location.hash) history.replaceState(null, '', location.pathname)
})

// ---------------------------------------------------------------------------------------------------------------
describe('GAccordion · estructura accesible (#477)', () => {
  it('raíz sin rol; hN > button[type=button] con aria-expanded, aria-controls → __content e ids derivados', () => {
    const w = make(`<g-accordion>${FAQ}</g-accordion>`)
    const root = w.find('.g-accordion')
    expect(root.attributes('role')).toBeUndefined()
    const btn = w.find('#cambiar-toggle')
    expect(btn.element.tagName).toBe('BUTTON')
    expect(btn.attributes('type')).toBe('button')
    expect(btn.element.parentElement.tagName).toBe('H3')
    expect(btn.element.parentElement.classList.contains('g-accordion-item__heading')).toBe(true)
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(btn.attributes('aria-controls')).toBe('cambiar-content')
    expect(w.find('#cambiar').classes()).toContain('g-accordion-item')
    expect(w.find('#cambiar-content').classes()).toContain('g-accordion-item__content')
    expect(w.find('#cambiar-peek').classes()).toContain('g-accordion-item__peek')
  })

  it('título, meta y avance con dir="auto"; chevron aria-hidden con el icono como hijo directo', () => {
    const w = make('<g-accordion><g-accordion-item id="a" title="A" meta="3 activas" peek="Correo y push">x</g-accordion-item></g-accordion>')
    expect(w.find('#a .g-accordion-item__title').attributes('dir')).toBe('auto')
    expect(w.find('#a .g-accordion-item__meta').attributes('dir')).toBe('auto')
    expect(w.find('#a-peek').attributes('dir')).toBe('auto')
    const chev = w.find('#a .g-accordion-item__chevron')
    expect(chev.attributes('aria-hidden')).toBe('true')
    expect(chev.element.firstElementChild.tagName.toLowerCase()).toBe('svg')
    expect(chev.element.firstElementChild.classList.contains('g-icon')).toBe(true)
    // El orden dentro del botón: título, meta, chevron al final (A)
    const kids = [...w.find('#a-toggle').element.children].map((c) => c.className)
    expect(kids).toEqual(['g-accordion-item__title', 'g-accordion-item__meta', 'g-accordion-item__chevron'])
  })

  it('el orden en el elemento es encabezado → acciones → avance → panel; las acciones van fuera del hN', () => {
    const w = make('<g-accordion><g-accordion-item id="a" title="Notificaciones" peek="Correo"><template #actions><button class="reset">Restablecer</button></template>x</g-accordion-item></g-accordion>')
    const kids = [...w.find('#a').element.children].map((c) => c.className)
    expect(kids).toEqual(['g-accordion-item__heading', 'g-accordion-item__actions', 'g-accordion-item__peek', 'g-accordion-item__panel'])
    expect(w.find('.reset').element.closest('h3')).toBeNull()
    expect(w.find('#a').classes()).toEqual(expect.arrayContaining(['has-actions', 'has-peek']))
  })

  it('nivel de encabezado: del grupo, el del elemento gana, suelto 3; validador 2 a 6', () => {
    const w = make('<div><g-accordion :heading-level="2"><g-accordion-item id="a" title="A">x</g-accordion-item><g-accordion-item id="b" title="B" :heading-level="4">y</g-accordion-item></g-accordion><g-accordion-item id="c" title="C">z</g-accordion-item></div>')
    expect(w.find('#a-toggle').element.parentElement.tagName).toBe('H2')
    expect(w.find('#b-toggle').element.parentElement.tagName).toBe('H4')
    expect(w.find('#c-toggle').element.parentElement.tagName).toBe('H3')
    expect(GAccordion.props.headingLevel.validator(1)).toBe(false)
    expect(GAccordion.props.headingLevel.validator(7)).toBe(false)
    expect(GAccordion.props.headingLevel.validator(6)).toBe(true)
    expect(GAccordionItem.props.headingLevel.validator(2)).toBe(true)
    expect(GAccordionItem.props.headingLevel.validator(2.5)).toBe(false)
  })

  it('region + aria-labelledby → botón con 6 elementos; sin rol con 7; con exclusive siempre; suelto siempre', () => {
    const items = (n) => Array.from({ length: n }, (_, i) => `<g-accordion-item id="i${i}" title="T${i}">c</g-accordion-item>`).join('')
    const six = make(`<g-accordion>${items(6)}</g-accordion>`)
    expect(six.find('#i0-content').attributes('role')).toBe('region')
    expect(six.find('#i0-content').attributes('aria-labelledby')).toBe('i0-toggle')
    const seven = make(`<g-accordion>${items(7)}</g-accordion>`)
    expect(seven.find('#i0-content').attributes('role')).toBeUndefined()
    expect(seven.find('#i0-content').attributes('aria-labelledby')).toBeUndefined()
    expect(seven.find('#i6-content').attributes('role')).toBeUndefined()
    const ex = make(`<g-accordion exclusive>${items(8)}</g-accordion>`)
    expect(ex.find('#i0-content').attributes('role')).toBe('region')
    const solo = make('<g-accordion-item id="s" title="S">c</g-accordion-item>')
    expect(solo.find('#s-content').attributes('role')).toBe('region')
    expect(solo.find('#s').classes()).toContain('is-standalone')
  })

  it('la regla de region sigue a la lista: de 7 (v-for) a 6 pasa a region', async () => {
    const list = ref([1, 2, 3, 4, 5, 6, 7])
    const w = make('<g-accordion><g-accordion-item v-for="n in list" :key="n" :id="`n${n}`" :title="`T${n}`">c</g-accordion-item></g-accordion>', () => ({ list }))
    expect(w.find('#n1-content').attributes('role')).toBeUndefined()
    list.value = [1, 2, 3, 4, 5, 6]
    await nextTick()
    await nextTick()
    expect(w.find('#n1-content').attributes('role')).toBe('region')
  })

  it('aria-describedby → avance solo cerrado y con avance', async () => {
    const w = make(`<g-accordion>${FAQ}</g-accordion>`)
    expect(w.find('#cambiar-toggle').attributes('aria-describedby')).toBe('cambiar-peek')
    expect(w.find('#documentos-toggle').attributes('aria-describedby')).toBeUndefined()
    await w.find('#cambiar-toggle').trigger('click')
    expect(w.find('#cambiar-toggle').attributes('aria-describedby')).toBeUndefined()
  })

  it('clases del grupo: --exclusive y --sticky', () => {
    const w = make('<g-accordion exclusive sticky><g-accordion-item title="A">x</g-accordion-item></g-accordion>')
    expect(w.find('.g-accordion').classes()).toEqual(['g-accordion', 'g-accordion--exclusive', 'g-accordion--sticky'])
  })

  it('id generado: raíz con id y los internos derivados de él', () => {
    const w = make('<g-accordion-item title="A">x</g-accordion-item>')
    const id = w.find('.g-accordion-item').attributes('id')
    expect(id).toBeTruthy()
    expect(w.find('.g-accordion-item__toggle').attributes('id')).toBe(`${id}-toggle`)
    expect(w.find('.g-accordion-item__content').attributes('id')).toBe(`${id}-content`)
  })

  it('atributos no declarados van a la raíz del grupo y del elemento', () => {
    const w = make('<g-accordion data-x="1" class="mine"><g-accordion-item data-y="2" class="it" title="A">x</g-accordion-item></g-accordion>')
    expect(w.find('.g-accordion').attributes('data-x')).toBe('1')
    expect(w.find('.g-accordion').classes()).toContain('mine')
    expect(w.find('.g-accordion-item').attributes('data-y')).toBe('2')
    expect(w.find('.g-accordion-item').classes()).toContain('it')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GAccordion · modelo (#478)', () => {
  it('no controlado: parte de [] y abre/cierra solo', async () => {
    const w = make(`<g-accordion>${FAQ}</g-accordion>`)
    expect(exp(w, 'cambiar')).toBe('false')
    await w.find('#cambiar-toggle').trigger('click')
    expect(exp(w, 'cambiar')).toBe('true')
    expect(w.find('#cambiar').classes()).toContain('is-open')
    await w.find('#cambiar-toggle').trigger('click')
    expect(exp(w, 'cambiar')).toBe('false')
  })

  it('orden del documento, no de apertura: abrir 3 y luego 1 → [1, 3]', async () => {
    const onUpdate = vi.fn()
    const w = make(`<g-accordion @update:model-value="onUpdate">${FAQ}</g-accordion>`, () => ({ onUpdate }))
    await w.find('#resultados-toggle').trigger('click')
    await w.find('#cambiar-toggle').trigger('click')
    expect(onUpdate.mock.calls.map((c) => c[0])).toEqual([['resultados'], ['cambiar', 'resultados']])
  })

  it('controlado con v-model; emite una copia nueva', async () => {
    const open = ref(['documentos'])
    const w = make(`<g-accordion v-model="open">${FAQ}</g-accordion>`, () => ({ open }))
    expect(exp(w, 'documentos')).toBe('true')
    const before = open.value
    await w.find('#cambiar-toggle').trigger('click')
    expect(open.value).toEqual(['cambiar', 'documentos'])
    expect(open.value).not.toBe(before)
    open.value = []
    await nextTick()
    expect(exp(w, 'cambiar')).toBe('false')
    expect(exp(w, 'documentos')).toBe('false')
  })

  it('no emite cuando el cambio llega del modelo', async () => {
    const open = ref([])
    const onUpdate = vi.fn()
    const w = make(`<g-accordion :model-value="open" @update:model-value="onUpdate">${FAQ}</g-accordion>`, () => ({ open, onUpdate }))
    open.value = ['resultados']
    await nextTick()
    expect(exp(w, 'resultados')).toBe('true')
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it(':model-value sin escuchar: abre al principio y luego el grupo funciona solo', async () => {
    const w = make(`<g-accordion :model-value="['documentos']">${FAQ}</g-accordion>`)
    expect(exp(w, 'documentos')).toBe('true')
    await w.find('#documentos-toggle').trigger('click')
    expect(exp(w, 'documentos')).toBe('false')
  })

  it('null y undefined cuentan como [] sin aviso', () => {
    const warn = quiet()
    const w = make(`<g-accordion :model-value="null">${FAQ}</g-accordion>`)
    expect(exp(w, 'cambiar')).toBe('false')
    expect(groupWarns(warn)).toHaveLength(0)
  })

  it('valores sin elemento se conservan al final, en su orden', async () => {
    const onUpdate = vi.fn()
    const w = make(`<g-accordion :model-value="['zeta', 'resultados', 'alfa']" @update:model-value="onUpdate">${FAQ}</g-accordion>`, () => ({ onUpdate }))
    await w.find('#cambiar-toggle').trigger('click')
    expect(onUpdate).toHaveBeenLastCalledWith(['cambiar', 'resultados', 'zeta', 'alfa'])
  })

  it('un elemento montado después (v-if) se abre con su valor conservado', async () => {
    const show = ref(false)
    const w = make(`<g-accordion :model-value="['tarde']"><g-accordion-item id="a" title="A">x</g-accordion-item><g-accordion-item v-if="show" id="tarde" title="T">y</g-accordion-item></g-accordion>`, () => ({ show }))
    show.value = true
    await nextTick()
    expect(exp(w, 'tarde')).toBe('true')
  })

  it('value numérico y value por defecto = id', async () => {
    const onUpdate = vi.fn()
    const w = make('<g-accordion @update:model-value="onUpdate"><g-accordion-item :value="7" id="siete" title="7">x</g-accordion-item><g-accordion-item id="ocho" title="8">y</g-accordion-item></g-accordion>', () => ({ onUpdate }))
    await w.find('#siete-toggle').trigger('click')
    await w.find('#ocho-toggle').trigger('click')
    expect(onUpdate).toHaveBeenLastCalledWith([7, 'ocho'])
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GAccordion · exclusive (#478)', () => {
  it('abrir otro sustituye; cerrar el abierto → []', async () => {
    const onUpdate = vi.fn()
    const w = make(`<g-accordion exclusive @update:model-value="onUpdate">${FAQ}</g-accordion>`, () => ({ onUpdate }))
    await w.find('#cambiar-toggle').trigger('click')
    await w.find('#resultados-toggle').trigger('click')
    expect(exp(w, 'cambiar')).toBe('false')
    expect(exp(w, 'resultados')).toBe('true')
    await w.find('#resultados-toggle').trigger('click')
    expect(onUpdate.mock.calls.map((c) => c[0])).toEqual([['cambiar'], ['resultados'], []])
    // El abierto se puede cerrar: nunca aria-disabled
    expect(w.find('#resultados-toggle').attributes('aria-disabled')).toBeUndefined()
  })

  it('modelo con dos valores: solo el primero en orden del documento, sin emitir, aviso 2', () => {
    const warn = quiet()
    const onUpdate = vi.fn()
    const w = make(`<g-accordion exclusive :model-value="['resultados', 'cambiar']" @update:model-value="onUpdate">${FAQ}</g-accordion>`, () => ({ onUpdate }))
    expect(exp(w, 'cambiar')).toBe('true')
    expect(exp(w, 'resultados')).toBe('false')
    expect(onUpdate).not.toHaveBeenCalled()
    expect(groupWarns(warn).filter((m) => /exclusive/.test(m))).toHaveLength(1)
  })

  it('pasar a exclusive con varios abiertos: queda el primero y avisa', async () => {
    const warn = quiet()
    const ex = ref(false)
    const w = make(`<g-accordion :exclusive="ex" :model-value="['documentos', 'resultados']">${FAQ}</g-accordion>`, () => ({ ex }))
    expect(exp(w, 'resultados')).toBe('true')
    ex.value = true
    await nextTick()
    expect(exp(w, 'documentos')).toBe('true')
    expect(exp(w, 'resultados')).toBe('false')
    expect(groupWarns(warn).filter((m) => /exclusive/.test(m))).toHaveLength(1)
  })

  it('abrir en exclusive quita los valores sin elemento', async () => {
    const onUpdate = vi.fn()
    const w = make(`<g-accordion exclusive :model-value="['zeta']" @update:model-value="onUpdate">${FAQ}</g-accordion>`, () => ({ onUpdate }))
    await w.find('#cambiar-toggle').trigger('click')
    expect(onUpdate).toHaveBeenLastCalledWith(['cambiar'])
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GAccordionItem · suelto (v-model:open)', () => {
  it('no controlado y controlado; emite update:open', async () => {
    const open = ref(false)
    const w = make('<g-accordion-item id="s" title="Ver condiciones" v-model:open="open">x</g-accordion-item>', () => ({ open }))
    await w.find('#s-toggle').trigger('click')
    expect(open.value).toBe(true)
    expect(exp(w, 's')).toBe('true')
    open.value = false
    await nextTick()
    expect(exp(w, 's')).toBe('false')
    const solo = make('<g-accordion-item id="t" title="T">x</g-accordion-item>')
    await solo.find('#t-toggle').trigger('click')
    expect(exp(solo, 't')).toBe('true')
  })

  it('open = true al montar: abierto y sin hidden', () => {
    const w = make('<g-accordion-item id="s" title="S" open>x</g-accordion-item>')
    expect(exp(w, 's')).toBe('true')
    expect(hiddenOf(w, 's')).toBeUndefined()
  })

  it('open y v-model:open dentro de un grupo: se ignoran, sin emitir, aviso 5', async () => {
    const warn = quiet()
    const onOpen = vi.fn()
    const w = make('<g-accordion><g-accordion-item id="a" title="A" :open="true" @update:open="onOpen">x</g-accordion-item></g-accordion>', () => ({ onOpen }))
    expect(exp(w, 'a')).toBe('false')
    await w.find('#a-toggle').trigger('click')
    expect(exp(w, 'a')).toBe('true')
    expect(onOpen).not.toHaveBeenCalled()
    expect(itemWarns(warn).filter((m) => /solo vale suelto/.test(m))).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GAccordion · anidados', () => {
  it('un suelto dentro de un panel no se une al grupo exterior', async () => {
    const onUpdate = vi.fn()
    const w = make(`<g-accordion :model-value="['fuera']" @update:model-value="onUpdate"><g-accordion-item id="fuera" title="Fuera"><g-accordion-item id="dentro" title="Dentro">x</g-accordion-item></g-accordion-item></g-accordion>`, () => ({ onUpdate }))
    expect(w.find('#dentro').classes()).toContain('is-standalone')
    await w.find('#dentro-toggle').trigger('click')
    expect(exp(w, 'dentro')).toBe('true')
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('un grupo anidado tiene su propio modelo, su exclusive y sus flechas', async () => {
    const outer = vi.fn()
    const inner = vi.fn()
    const w = make(`<g-accordion :model-value="['p']" @update:model-value="outer">
      <g-accordion-item id="p" title="P"><g-accordion exclusive @update:model-value="inner"><g-accordion-item id="q1" title="Q1">a</g-accordion-item><g-accordion-item id="q2" title="Q2">b</g-accordion-item></g-accordion></g-accordion-item>
      <g-accordion-item id="r" title="R">c</g-accordion-item></g-accordion>`, () => ({ outer, inner }))
    await w.find('#q1-toggle').trigger('click')
    await w.find('#q2-toggle').trigger('click')
    expect(inner.mock.calls.map((c) => c[0])).toEqual([['q1'], ['q2']])
    expect(outer).not.toHaveBeenCalled()
    // Flechas: ↓ en Q2 no salta al encabezado R del grupo exterior
    w.find('#q2-toggle').element.focus()
    await w.find('#q2-toggle').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement.id).toBe('q2-toggle')
    // Y ↓ en P va a R (los encabezados del grupo de dentro no cuentan)
    w.find('#p-toggle').element.focus()
    await w.find('#p-toggle').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement.id).toBe('r-toggle')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GAccordionItem · plegado (#480)', () => {
  it('inert solo mientras se cierra; hidden="until-found" al asentar (respaldo del motor)', async () => {
    const w = make(`<g-accordion :model-value="['cambiar']">${FAQ}</g-accordion>`)
    await settleAll()
    const panel = () => w.find('#cambiar .g-accordion-item__panel')
    expect(panel().attributes('inert')).toBeUndefined()
    expect(hiddenOf(w, 'cambiar')).toBeUndefined()
    await w.find('#cambiar-toggle').trigger('click')
    expect(w.find('#cambiar').classes()).toContain('is-animating')
    expect(panel().attributes('inert')).toBeDefined()
    expect(hiddenOf(w, 'cambiar')).toBeUndefined()
    await settleAll()
    expect(w.find('#cambiar').classes()).not.toContain('is-animating')
    expect(panel().attributes('inert')).toBeUndefined()
    expect(hiddenOf(w, 'cambiar')).toBe('until-found')
  })

  it('al abrir, hidden se quita en el mismo parche que entra is-open (y sin inert)', async () => {
    const w = make(`<g-accordion>${FAQ}</g-accordion>`)
    await settleAll()
    expect(hiddenOf(w, 'documentos')).toBe('until-found')
    await w.find('#documentos-toggle').trigger('click')
    expect(w.find('#documentos').classes()).toContain('is-open')
    expect(hiddenOf(w, 'documentos')).toBeUndefined()
    expect(w.find('#documentos .g-accordion-item__panel').attributes('inert')).toBeUndefined()
  })

  it('transitionend de grid-template-rows del panel asienta; otra propiedad no', async () => {
    const w = make(`<g-accordion :model-value="['cambiar']">${FAQ}</g-accordion>`)
    await settleAll()
    await w.find('#cambiar-toggle').trigger('click')
    const panel = w.find('#cambiar .g-accordion-item__panel').element
    const end = (prop) => {
      const e = new Event('transitionend', { bubbles: true })
      e.propertyName = prop
      panel.dispatchEvent(e)
    }
    end('opacity')
    await nextTick()
    expect(w.find('#cambiar').classes()).toContain('is-animating')
    end('grid-template-rows')
    await nextTick()
    expect(w.find('#cambiar').classes()).not.toContain('is-animating')
    expect(hiddenOf(w, 'cambiar')).toBe('until-found')
  })

  it('is-ready tras el primer pintado; nada animado al montar', async () => {
    const w = make(`<g-accordion :model-value="['cambiar']">${FAQ}</g-accordion>`)
    expect(w.find('#cambiar').classes()).not.toContain('is-ready')
    expect(w.find('#cambiar').classes()).not.toContain('is-animating')
    await settleAll()
    expect(w.find('#cambiar').classes()).toContain('is-ready')
  })

  it('beforematch abre en el acto (is-instant), emite y no compensa', async () => {
    const onUpdate = vi.fn()
    const w = make(`<g-accordion @update:model-value="onUpdate">${FAQ}</g-accordion>`, () => ({ onUpdate }))
    await settleAll()
    const c = w.find('#resultados-content').element
    c.removeAttribute('hidden') // lo hace el navegador antes de beforematch
    c.dispatchEvent(new Event('beforematch'))
    await nextTick()
    expect(exp(w, 'resultados')).toBe('true')
    expect(w.find('#resultados').classes()).toContain('is-instant')
    expect(w.find('#resultados').classes()).not.toContain('is-animating')
    expect(onUpdate).toHaveBeenLastCalledWith(['resultados'])
    expect(keepInPlace).not.toHaveBeenCalled()
    await settleAll()
    expect(w.find('#resultados').classes()).not.toContain('is-instant')
  })

  it('beforematch en exclusive: el otro se cierra sin animar', async () => {
    const w = make(`<g-accordion exclusive :model-value="['cambiar']">${FAQ}</g-accordion>`)
    await settleAll()
    w.find('#resultados-content').element.dispatchEvent(new Event('beforematch'))
    await nextTick()
    expect(exp(w, 'cambiar')).toBe('false')
    expect(w.find('#cambiar').classes()).toContain('is-instant')
    expect(w.find('#cambiar').classes()).not.toContain('is-animating')
    expect(hiddenOf(w, 'cambiar')).toBe('until-found')
  })

  it('OPEN_REQUEST: abre sin animar, emite y cancela; abierto, no cancela', async () => {
    const onUpdate = vi.fn()
    const w = make(`<g-accordion @update:model-value="onUpdate"><g-accordion-item id="a" title="A"><input id="ciudad"></g-accordion-item></g-accordion>`, () => ({ onUpdate }))
    await settleAll()
    expect(requestOpen(w.find('#ciudad').element)).toBe(true)
    await nextTick()
    expect(exp(w, 'a')).toBe('true')
    expect(w.find('#a').classes()).toContain('is-instant')
    expect(onUpdate).toHaveBeenLastCalledWith(['a'])
    expect(keepInPlace).not.toHaveBeenCalled()
    expect(requestOpen(w.find('#ciudad').element)).toBe(false)
  })

  it('OPEN_REQUEST en exclusive: solo la primera petición del tick abre', async () => {
    const w = make(`<g-accordion exclusive><g-accordion-item id="a" title="A"><input id="ia"></g-accordion-item><g-accordion-item id="b" title="B"><input id="ib"></g-accordion-item></g-accordion>`)
    await settleAll()
    expect(requestOpen(w.find('#ia').element)).toBe(true)
    expect(requestOpen(w.find('#ib').element)).toBe(false)
    await nextTick()
    expect(exp(w, 'a')).toBe('true')
    expect(exp(w, 'b')).toBe('false')
    // En el tick siguiente sí se atiende
    await Promise.resolve()
    expect(requestOpen(w.find('#ib').element)).toBe(true)
    await nextTick()
    expect(exp(w, 'b')).toBe('true')
  })

  it('OPEN_REQUEST en exclusive: la primera del tick cuenta aunque su elemento ya esté abierto', async () => {
    const w = make(`<g-accordion exclusive :model-value="['a']"><g-accordion-item id="a" title="A"><input id="ia"></g-accordion-item><g-accordion-item id="b" title="B"><input id="ib"></g-accordion-item></g-accordion>`)
    await settleAll()
    expect(requestOpen(w.find('#ia').element)).toBe(false)
    expect(requestOpen(w.find('#ib').element)).toBe(false)
    await nextTick()
    expect(exp(w, 'a')).toBe('true')
    expect(exp(w, 'b')).toBe('false')
  })

  it('OPEN_REQUEST abre los anidados (no detiene la propagación)', async () => {
    const w = make(`<g-accordion><g-accordion-item id="p" title="P"><g-accordion><g-accordion-item id="q" title="Q"><input id="iq"></g-accordion-item></g-accordion></g-accordion-item></g-accordion>`)
    await settleAll()
    expect(requestOpen(w.find('#iq').element)).toBe(true)
    await nextTick()
    expect(exp(w, 'p')).toBe('true')
    expect(exp(w, 'q')).toBe('true')
  })

  it('plegar por programa con el foco dentro: el foco va al botón antes de inert (nunca a body)', async () => {
    const open = ref(['a'])
    const w = make(`<g-accordion v-model="open"><g-accordion-item id="a" title="A"><input id="ia"></g-accordion-item></g-accordion>`, () => ({ open }))
    await settleAll()
    w.find('#ia').element.focus()
    expect(document.activeElement.id).toBe('ia')
    open.value = []
    await nextTick()
    expect(document.activeElement.id).toBe('a-toggle')
  })

  it('abrir no mueve el foco', async () => {
    const w = make(`<g-accordion>${FAQ}</g-accordion>`)
    w.find('#cambiar-toggle').element.focus()
    await w.find('#cambiar-toggle').trigger('click')
    expect(document.activeElement.id).toBe('cambiar-toggle')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GAccordionItem · lazy (#480)', () => {
  it('sin montar antes del primer abrir; un montaje tras abrir-cerrar-abrir', async () => {
    let mounts = 0
    const Heavy = defineComponent({ setup() { mounts++; return () => h('p', { class: 'heavy' }, 'mapa') } })
    const w = mount(defineComponent({
      components: { GAccordion, GAccordionItem, Heavy },
      template: '<g-accordion><g-accordion-item id="m" title="Mapa" lazy><heavy /></g-accordion-item></g-accordion>'
    }), { attachTo: document.body })
    mounted.push(w)
    expect(mounts).toBe(0)
    expect(w.find('.heavy').exists()).toBe(false)
    await w.find('#m-toggle').trigger('click')
    await settleAll()
    await w.find('#m-toggle').trigger('click')
    await settleAll()
    await w.find('#m-toggle').trigger('click')
    await settleAll()
    expect(mounts).toBe(1)
    expect(w.find('.heavy').exists()).toBe(true)
  })

  it('sin lazy, el contenido plegado está montado (búsqueda, anclas, impresión)', () => {
    const w = make(`<g-accordion>${FAQ}</g-accordion>`)
    expect(w.find('#resultados-content').text()).toContain('48 horas')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GAccordion · teclado (#481)', () => {
  const ARROWS = `<g-accordion>
    <g-accordion-item id="a" title="A">x</g-accordion-item>
    <g-accordion-item id="b" title="B" disabled meta="Disponible tras tu primera cita">y</g-accordion-item>
    <g-accordion-item id="c" title="C"><button id="dentro">dentro</button></g-accordion-item>
    <g-accordion-item id="d" title="D">z</g-accordion-item></g-accordion>`
  const press = async (w, id, key, extra = {}) => {
    w.find(`#${id}`).element.focus()
    await w.find(`#${id}`).trigger('keydown', { key, ...extra })
    return document.activeElement.id
  }
  it('↓/↑ sin vuelta (incluye deshabilitados), Inicio y Fin', async () => {
    const w = make(ARROWS)
    expect(await press(w, 'a-toggle', 'ArrowDown')).toBe('b-toggle')
    expect(await press(w, 'b-toggle', 'ArrowDown')).toBe('c-toggle')
    expect(await press(w, 'd-toggle', 'ArrowDown')).toBe('d-toggle')
    expect(await press(w, 'a-toggle', 'ArrowUp')).toBe('a-toggle')
    expect(await press(w, 'c-toggle', 'Home')).toBe('a-toggle')
    expect(await press(w, 'a-toggle', 'End')).toBe('d-toggle')
  })
  it('previene el desplazamiento al moverse; sin efecto con Alt, Ctrl o ⌘', async () => {
    const w = make(ARROWS)
    w.find('#a-toggle').element.focus()
    const ev = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
    w.find('#a-toggle').element.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    for (const mod of ['altKey', 'ctrlKey', 'metaKey']) expect(await press(w, 'a-toggle', 'ArrowDown', { [mod]: true })).toBe('a-toggle')
  })
  it('no actúan dentro de un panel ni con arrows = false', async () => {
    const w = make(ARROWS.replace('<g-accordion>', '<g-accordion :model-value="[\'c\']">'))
    expect(await press(w, 'dentro', 'ArrowDown')).toBe('dentro')
    const off = make(ARROWS.replace('<g-accordion>', '<g-accordion :arrows="false">'))
    expect(await press(off, 'a-toggle', 'ArrowDown')).toBe('a-toggle')
  })
  it('un elemento suelto no tiene flechas', async () => {
    const w = make('<div><g-accordion-item id="s" title="S">x</g-accordion-item><g-accordion-item id="t" title="T">y</g-accordion-item></div>')
    expect(await press(w, 's-toggle', 'ArrowDown')).toBe('s-toggle')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GAccordionItem · deshabilitado (#481)', () => {
  it('aria-disabled (sin disabled nativo), enfocable, is-disabled; no abre por clic, teclado ni avance', async () => {
    const onUpdate = vi.fn()
    const w = make('<g-accordion @update:model-value="onUpdate"><g-accordion-item id="h" title="Historial" meta="Disponible tras tu primera cita" peek="Tus pagos" disabled>x</g-accordion-item></g-accordion>', () => ({ onUpdate }))
    const btn = w.find('#h-toggle')
    expect(btn.attributes('aria-disabled')).toBe('true')
    expect(btn.attributes('disabled')).toBeUndefined()
    expect(w.find('#h').classes()).toContain('is-disabled')
    btn.element.focus()
    expect(document.activeElement.id).toBe('h-toggle')
    await btn.trigger('click')
    await w.find('#h-peek').trigger('click')
    expect(exp(w, 'h')).toBe('false')
    expect(onUpdate).not.toHaveBeenCalled()
  })
  it('la búsqueda de la página y OPEN_REQUEST sí lo abren; el botón sigue deshabilitado', async () => {
    const w = make('<g-accordion><g-accordion-item id="h" title="H" disabled><input id="ih"></g-accordion-item><g-accordion-item id="k" title="K" disabled>texto</g-accordion-item></g-accordion>')
    await settleAll()
    expect(requestOpen(w.find('#ih').element)).toBe(true)
    w.find('#k-content').element.dispatchEvent(new Event('beforematch'))
    await nextTick()
    expect(exp(w, 'h')).toBe('true')
    expect(exp(w, 'k')).toBe('true')
    expect(w.find('#h-toggle').attributes('aria-disabled')).toBe('true')
    // Abierto y deshabilitado: el botón no lo cierra
    await w.find('#h-toggle').trigger('click')
    expect(exp(w, 'h')).toBe('true')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GAccordionItem · avance (A, #483)', () => {
  it('clic en el avance cerrado abre (con Δ0)', async () => {
    const w = make(`<g-accordion>${FAQ}</g-accordion>`)
    await w.find('#cambiar-peek').trigger('click')
    expect(exp(w, 'cambiar')).toBe('true')
    expect(keepInPlace).toHaveBeenCalledTimes(1)
  })
  it('con una selección de texto, no abre', async () => {
    const w = make(`<g-accordion>${FAQ}</g-accordion>`)
    const peek = w.find('#cambiar-peek').element
    const range = document.createRange()
    range.selectNodeContents(peek)
    getSelection().removeAllRanges()
    getSelection().addRange(range)
    await w.find('#cambiar-peek').trigger('click')
    expect(exp(w, 'cambiar')).toBe('false')
    getSelection().removeAllRanges()
  })
  it('abierto, el clic en el avance no cierra', async () => {
    const w = make(`<g-accordion :model-value="['cambiar']">${FAQ}</g-accordion>`)
    await w.find('#cambiar-peek').trigger('click')
    expect(exp(w, 'cambiar')).toBe('true')
  })
  it('slot peek y slots title/meta/actions con { open }', async () => {
    const w = make(`<g-accordion><g-accordion-item id="n" title="Notificaciones">
      <template #title="{ open }"><span class="t">{{ open ? 'abierto' : 'cerrado' }}</span></template>
      <template #meta="{ open }"><span class="m">{{ open }}</span></template>
      <template #peek="{ open }"><span class="p">{{ open }}</span></template>
      <template #actions="{ open }"><span class="a">{{ open }}</span></template>
      x</g-accordion-item></g-accordion>`)
    expect(w.find('.t').text()).toBe('cerrado')
    expect(w.find('#n').classes()).toContain('has-peek')
    await w.find('#n-toggle').trigger('click')
    expect(w.find('.t').text()).toBe('abierto')
    expect(w.find('.m').text()).toBe('true')
    expect(w.find('.p').text()).toBe('true')
    expect(w.find('.a').text()).toBe('true')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GAccordionItem · Δ0 (#481)', () => {
  it('compensa lo que toca el usuario (botón y avance), no lo que llega del modelo, la búsqueda o un #id', async () => {
    const open = ref([])
    const w = make(`<g-accordion v-model="open">${FAQ}</g-accordion>`, () => ({ open }))
    await w.find('#documentos-toggle').trigger('click')
    expect(keepInPlace).toHaveBeenCalledTimes(1)
    expect(keepInPlace.mock.calls[0][0]).toBe(w.find('#documentos .g-accordion-item__heading').element)
    open.value = ['resultados']
    await nextTick()
    w.find('#cambiar-content').element.dispatchEvent(new Event('beforematch'))
    await nextTick()
    expect(keepInPlace).toHaveBeenCalledTimes(1)
  })
  it('también suelto', async () => {
    const w = make('<g-accordion-item id="s" title="S">x</g-accordion-item>')
    await w.find('#s-toggle').trigger('click')
    expect(keepInPlace).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GAccordionItem · #id del elemento (#482)', () => {
  it('al montar: abre sin Δ0, emite, no mueve el foco y lo trae arriba con scrollIntoView({ block: start })', async () => {
    history.replaceState(null, '', '#documentos')
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    const onUpdate = vi.fn()
    const w = make(`<g-accordion @update:model-value="onUpdate">${FAQ}</g-accordion>`, () => ({ onUpdate }))
    await nextTick()
    expect(exp(w, 'documentos')).toBe('true')
    expect(w.find('#documentos').classes()).toContain('is-instant')
    expect(onUpdate).toHaveBeenLastCalledWith(['documentos'])
    expect(keepInPlace).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(document.body)
    await nextTick()
    expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' })
    expect(scroll.mock.contexts[0]).toBe(w.find('#documentos-toggle').element)
    delete Element.prototype.scrollIntoView
  })

  it('en hashchange (fragmento codificado) abre el elemento', async () => {
    const w = make(`<g-accordion><g-accordion-item id="pago-ñ" title="P">x</g-accordion-item></g-accordion>`)
    history.replaceState(null, '', '#pago-%C3%B1')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await nextTick()
    expect(w.find('[id="pago-ñ-toggle"]').attributes('aria-expanded')).toBe('true')
  })

  it('una sola escucha de hashchange compartida; se quita con el último elemento', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const w = make(`<g-accordion>${FAQ}</g-accordion>`)
    const w2 = make('<g-accordion-item title="S">x</g-accordion-item>')
    expect(add.mock.calls.filter((c) => c[0] === 'hashchange')).toHaveLength(1)
    w.unmount()
    mounted.splice(mounted.indexOf(w), 1)
    expect(remove.mock.calls.filter((c) => c[0] === 'hashchange')).toHaveLength(0)
    w2.unmount()
    mounted.splice(mounted.indexOf(w2), 1)
    expect(remove.mock.calls.filter((c) => c[0] === 'hashchange')).toHaveLength(1)
  })

  it('lee el fragmento, nunca lo escribe', async () => {
    const w = make(`<g-accordion>${FAQ}</g-accordion>`)
    await w.find('#cambiar-toggle').trigger('click')
    expect(location.hash).toBe('')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GAccordion · sticky (#484)', () => {
  it('el elemento suelto o de un grupo sin sticky no lleva --_head-size', async () => {
    const w = make(`<g-accordion :model-value="['cambiar']">${FAQ}</g-accordion>`)
    await settleAll()
    expect(w.find('#cambiar').attributes('style')).toBeUndefined()
    expect(w.find('.g-accordion').attributes('style')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('GAccordion · avisos de desarrollo (#488)', () => {
  it('1 · modelValue que no es arreglo: se trata como [v]', () => {
    const warn = quiet()
    const w = make(`<g-accordion model-value="documentos">${FAQ}</g-accordion>`)
    expect(exp(w, 'documentos')).toBe('true')
    expect(groupWarns(warn).filter((m) => /arreglo/.test(m))).toHaveLength(1)
  })
  it('3 · dos elementos con el mismo value: se abren juntos', async () => {
    const warn = quiet()
    const w = make('<g-accordion><g-accordion-item id="a" value="x" title="A">1</g-accordion-item><g-accordion-item id="b" value="x" title="B">2</g-accordion-item></g-accordion>')
    expect(groupWarns(warn).filter((m) => /mismo value/.test(m))).toHaveLength(1)
    await w.find('#a-toggle').trigger('click')
    expect(exp(w, 'b')).toBe('true')
  })
  it('4 · sin title, meta ni sus slots', () => {
    const warn = quiet()
    make('<g-accordion-item>x</g-accordion-item>')
    make('<g-accordion-item meta="Solo meta">x</g-accordion-item>')
    expect(itemWarns(warn).filter((m) => /no tiene nombre/.test(m))).toHaveLength(1)
  })
  it('6 · algo interactivo en title o meta', () => {
    const warn = quiet()
    make('<g-accordion-item><template #title>Ver <a href="#x">enlace</a></template>x</g-accordion-item>')
    make('<g-accordion-item title="T"><template #meta><button>b</button></template>x</g-accordion-item>')
    make('<g-accordion-item title="T" meta="texto">x</g-accordion-item>')
    expect(itemWarns(warn).filter((m) => /title o meta/.test(m))).toHaveLength(2)
  })
  it('7 · algo interactivo en el avance', () => {
    const warn = quiet()
    make('<g-accordion-item title="T"><template #peek>Lee <a href="#x">esto</a></template>x</g-accordion-item>')
    expect(itemWarns(warn).filter((m) => /avance/.test(m))).toHaveLength(1)
  })
  it('8 · dentro de un GForm con controles en su contenido (al montar y al montarse un lazy)', async () => {
    const warn = quiet()
    make('<g-form><g-accordion><g-accordion-item title="A"><input name="a"></g-accordion-item><g-accordion-item title="B"><input type="hidden" name="b"><p>texto</p></g-accordion-item></g-accordion></g-form>')
    expect(itemWarns(warn).filter((m) => /GFormSection/.test(m))).toHaveLength(1)
    const w = make('<g-form><g-accordion-item id="lz" title="L" lazy><select name="s"><option>1</option></select></g-accordion-item></g-form>')
    expect(itemWarns(warn).filter((m) => /GFormSection/.test(m))).toHaveLength(1)
    await w.find('#lz-toggle').trigger('click')
    await nextTick()
    await nextTick()
    expect(itemWarns(warn).filter((m) => /GFormSection/.test(m))).toHaveLength(2)
    // Fuera de un GForm, no
    make('<g-accordion-item title="C"><input name="c"></g-accordion-item>')
    expect(itemWarns(warn).filter((m) => /GFormSection/.test(m))).toHaveLength(2)
  })
  it('9 · id repetido en el documento', () => {
    const warn = quiet()
    const other = document.createElement('div')
    other.id = 'repetido'
    document.body.appendChild(other)
    make('<g-accordion-item id="repetido" title="T">x</g-accordion-item>')
    other.remove()
    expect(itemWarns(warn).filter((m) => /repetido/.test(m))).toHaveLength(1)
  })
  it('10 · en un grupo con v-model, sin value ni id', () => {
    const warn = quiet()
    const open = ref([])
    make('<g-accordion v-model="open"><g-accordion-item title="A">x</g-accordion-item><g-accordion-item id="b" title="B">y</g-accordion-item><g-accordion-item value="c" title="C">z</g-accordion-item></g-accordion>', () => ({ open }))
    make('<g-accordion><g-accordion-item title="D">x</g-accordion-item></g-accordion>')
    expect(itemWarns(warn).filter((m) => /id generado/.test(m))).toHaveLength(1)
  })
  it('un uso correcto no avisa (Vue ni Grana)', async () => {
    const warn = quiet()
    const open = ref(['envio'])
    const w = make(`<g-accordion v-model="open" exclusive sticky>
      <g-accordion-item value="envio" title="Envío" meta="2 días" peek="Gratis desde 500">Gratis desde 500.<template #actions><button>Editar</button></template></g-accordion-item>
      <g-accordion-item value="pago" title="Pago" lazy>Tarjeta.</g-accordion-item></g-accordion>`, () => ({ open }))
    await w.find('#' + w.findAll('.g-accordion-item')[1].attributes('id') + '-toggle').trigger('click')
    await settleAll()
    expect(warn).not.toHaveBeenCalled()
  })
})
