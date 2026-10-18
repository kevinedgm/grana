// GDialog · niveles anidados: `from`, `dismiss` con `depth`, modo pasos (GDialogStep, v-model:steps, push/back/backTo,
// evento step, «Volver», el hilo), pliegues dentro (fondo) y la llegada. dialog.md §«Niveles anidados» (#581 a #586, #589).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GDialog from './GDialog.vue'
import GDialogStep from '../GDialogStep/GDialogStep.vue'
import GInput from '../GInput/GInput.vue'
import GFormFold from '../GFormFold/GFormFold.vue'
import { useDialogSteps } from './dialogContext.js'
import { resetDialogStack } from '../../utils/dialogStack.js'
import { LANDED } from '../../utils/landing.js'
import { pageLiveNode } from '../../utils/liveRegion.js'
import { installTopLayer } from '../GSpeechHost/speechTestEnv.js'

let warn
let restoreTopLayer
beforeEach(() => {
  restoreTopLayer = installTopLayer() // showModal/close y :modal, que jsdom no trae
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => { restoreTopLayer(); vi.restoreAllMocks(); resetDialogStack(); document.body.innerHTML = '' })

const ticks = async (n = 3) => { for (let i = 0; i < n; i++) await nextTick() }
const wait = (ms = 60) => new Promise((r) => setTimeout(r, ms))
const warned = (re) => warn.mock.calls.some((c) => re.test(String(c[0])))
const key = (el, k, extra = {}) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...extra })
  el.dispatchEvent(e)
  return e
}
const $ = (sel) => document.querySelector(sel)

/** Tres pasos: detalle → ingreso → partida, con o sin v-model:steps. */
function setup(opts = {}) {
  const open = ref(opts.open ?? true)
  const steps = ref(opts.steps ?? (opts.vmodel === false ? undefined : []))
  const events = []
  const exposed = ref(null)
  const foldOpen = ref(false)
  const App = defineComponent({
    setup() {
      return () => h(GDialog, {
        ref: exposed,
        id: 'dlg',
        modelValue: open.value,
        'onUpdate:modelValue': (v) => { open.value = v },
        ...(opts.vmodel === false ? {} : { steps: steps.value, 'onUpdate:steps': (v) => { steps.value = v } }),
        ...(opts.uncontrolledEvents ? { 'onUpdate:steps': (v) => events.push(['update:steps', v]) } : {}),
        closeLabel: 'Cerrar',
        from: opts.from,
        labels: opts.labels ?? { back: 'Volver a {title}', trail: 'Recorrido' },
        onStep: (e) => events.push(['step', e]),
        onDismiss: (e) => { events.push(['dismiss', { reason: e.reason, depth: e.depth }]); if (opts.prevent) e.preventDefault() },
        onClosed: () => events.push(['closed'])
      }, {
        default: (scope) => [
          h(GDialogStep, { name: 'detalle', title: 'Ácido clorhídrico 37 %', description: 'Detalle de producto', summary: 'Existencia 48 L' }, {
            default: ({ push }) => [h('button', { id: 'to-ingreso', type: 'button', onClick: () => push('ingreso') }, 'Registrar ingreso…')]
          }),
          h(GDialogStep, { name: 'ingreso', title: 'Ingreso', description: 'Entrará en el producto', summary: 'OC-2291 · 3 partidas', class: 'mine' }, {
            default: ({ push }) => [
              h(GInput, { id: 'nota', label: 'Nota' }),
              h('input', { id: 'libre' }),
              h('button', { id: 'p3', type: 'button', onClick: () => push('partida', opts.pushFrom ? { from: opts.pushFrom } : undefined) }, 'Completar partida 3'),
              opts.withFold ? h(GFormFold, { open: foldOpen.value, 'onUpdate:open': (v) => { foldOpen.value = v }, title: 'Producto nuevo' }, { default: () => h('input', { id: 'fold-in' }), actions: () => h('button', { type: 'button' }, 'Ok') }) : null
            ],
            footer: ({ back }) => [h('button', { id: 'ingreso-cancel', type: 'button', onClick: () => back() }, 'Cancelar')]
          }),
          h(GDialogStep, { name: 'partida', title: 'Partida 3' }, {
            default: ({ back }) => [
              h('input', { id: 'partida-in' }),
              h('button', { id: 'partida-ok', type: 'button', onClick: () => back({ result: { id: 7 }, focus: 'p3', announce: 'Partida 3 guardada.' }) }, 'Guardar')
            ],
            footer: () => [h('button', { id: 'partida-foot', type: 'button' }, 'Pie')]
          }),
          opts.extra ? opts.extra(scope) : null
        ]
      })
    }
  })
  const w = mount(App, { attachTo: document.body })
  const d = () => document.getElementById('dlg')
  const history = () => (opts.vmodel === false ? null : steps.value)
  return { w, open, steps, events, exposed, foldOpen, d, history }
}
const stepEvents = (s) => s.events.filter(([n]) => n === 'step').map(([, e]) => e)

describe('GDialog · from (#583)', () => {
  it('con from (id) el foco vuelve a él al cerrar, aunque el foco al abrir estuviera en otro sitio', async () => {
    document.body.insertAdjacentHTML('beforeend', '<button id="trig">Abrir</button><button id="other">Otro</button>')
    document.getElementById('other').focus()
    const open = ref(false)
    const w = mount(defineComponent({ setup: () => () => h(GDialog, { modelValue: open.value, 'onUpdate:modelValue': (v) => { open.value = v }, title: 'T', closeLabel: 'Cerrar', from: 'trig' }, () => h('input', { id: 'in' })) }), { attachTo: document.body })
    open.value = true
    await ticks()
    expect(w.find('dialog').classes()).toContain('g-dialog--placement-center')
    open.value = false
    await ticks()
    expect(document.activeElement.id).toBe('trig')
    w.unmount()
  })

  it('from como elemento; un id sin elemento cuenta como sin valor', async () => {
    document.body.insertAdjacentHTML('beforeend', '<button id="trig2">Abrir</button>')
    const el = document.getElementById('trig2')
    const open = ref(true)
    const w = mount(defineComponent({ setup: () => () => h(GDialog, { modelValue: open.value, title: 'T', closeLabel: 'Cerrar', from: el }, () => h('input')) }), { attachTo: document.body })
    await ticks()
    open.value = false
    await ticks()
    expect(document.activeElement).toBe(el)
    w.unmount()
  })
})

describe('GDialog · modo pasos', () => {
  it('con GDialogStep: g-dialog--steps; empieza en el primer paso declarado; solo su panel montado', async () => {
    const s = setup()
    await ticks()
    expect(s.d().classList.contains('g-dialog--steps')).toBe(true)
    const panels = [...s.d().querySelectorAll('.g-dialog__step')]
    expect(panels).toHaveLength(1)
    expect(panels[0].getAttribute('role')).toBe('group')
    expect(panels[0].classList.contains('is-current')).toBe(true)
    expect(s.d().getAttribute('aria-labelledby')).toBe('dlg-step-detalle-title')
    expect(document.getElementById('dlg-step-detalle-title').textContent).toBe('Ácido clorhídrico 37 %')
    expect(s.d().getAttribute('aria-describedby')).toBe('dlg-step-detalle-desc')
    // Un paso: sin «Volver», sin hilo, sin pie (detalle no tiene footer)
    expect($('.g-dialog__back')).toBeNull()
    expect($('.g-dialog__trail')).toBeNull()
    expect($('.g-dialog__footer')).toBeNull()
  })

  it('push: historial, update:steps, step {push}, paneles de debajo hidden + inert y montados; foco #292 en el paso nuevo', async () => {
    const s = setup()
    await ticks()
    $('#to-ingreso').click()
    await ticks()
    await wait(20)
    expect(s.steps.value).toEqual(['detalle', 'ingreso'])
    const ev = stepEvents(s)
    expect(ev[0]).toEqual({ from: 'detalle', to: 'ingreso', direction: 'forward', reason: 'push', result: undefined })
    const panels = [...s.d().querySelectorAll('.g-dialog__step')]
    expect(panels).toHaveLength(2)
    expect(panels[0].hidden).toBe(true)
    expect(panels[0].hasAttribute('inert')).toBe(true)
    expect(panels[1].classList.contains('mine')).toBe(true) // atributos al panel
    expect(s.d().getAttribute('aria-labelledby')).toBe('dlg-step-ingreso-title')
    expect(document.activeElement.id).toBe('nota')
    // Pie del paso actual, «Volver» con labels.back y el hilo
    expect($('.g-dialog__footer #ingreso-cancel')).not.toBeNull()
    expect($('.g-dialog__back').getAttribute('aria-label')).toBe('Volver a Ácido clorhídrico 37 %')
    const nav = $('nav.g-dialog__trail')
    expect(nav.getAttribute('aria-label')).toBe('Recorrido')
    const items = nav.querySelectorAll('.g-dialog__trail-item')
    expect(items[0].classList.contains('is-parent')).toBe(true)
    expect(items[0].querySelector('button').textContent).toBe('1Ácido clorhídrico 37 %, Existencia 48 L')
    expect(items[1].querySelector('[aria-current="step"]').tagName).toBe('SPAN')
  })

  it('back con resultado: foco a focus, llegada en su caja, anuncio en el canal de página, step con result; el paso que sale se desmonta', async () => {
    const s = setup()
    await ticks()
    $('#to-ingreso').click(); await ticks(); await wait(10)
    $('#p3').focus()
    $('#p3').click(); await ticks(); await wait(10)
    expect(s.steps.value).toEqual(['detalle', 'ingreso', 'partida'])
    expect(document.activeElement.id).toBe('partida-in')
    $('#partida-ok').click(); await ticks(); await wait(80)
    expect(s.steps.value).toEqual(['detalle', 'ingreso'])
    expect($('#partida-in')).toBeNull()
    expect(document.activeElement.id).toBe('p3')
    expect(document.getElementById('p3').getAttribute(LANDED)).toBe('')
    expect(pageLiveNode().textContent).toBe('Partida 3 guardada.')
    expect(pageLiveNode().closest('dialog')).toBe(s.d())
    const last = stepEvents(s).at(-1)
    expect(last).toEqual({ from: 'partida', to: 'ingreso', direction: 'back', reason: 'back', result: { id: 7 } })
  })

  it('back sin resultado: foco al from del paso que sale; volver no borra lo escrito en el paso de debajo', async () => {
    const s = setup()
    await ticks()
    $('#to-ingreso').click(); await ticks(); await wait(10)
    const nota = document.getElementById('libre') // sin modelo: solo el DOM montado lo conserva
    nota.value = 'a medias'
    $('#p3').focus(); $('#p3').click(); await ticks(); await wait(10)
    $('.g-dialog__back').click(); await ticks(); await wait(10)
    expect(document.activeElement.id).toBe('p3')
    expect(document.getElementById('libre')).toBe(nota)
    expect(nota.value).toBe('a medias')
  })

  it('Esc con más de un paso baja uno sin dismiss (reason escape); repetida, ignorada; con un paso, dismiss', async () => {
    const s = setup()
    await ticks()
    $('#to-ingreso').click(); await ticks(); await wait(10)
    $('#p3').click(); await ticks(); await wait(10)
    key(document.activeElement, 'Escape', { repeat: true })
    await ticks()
    expect(s.steps.value).toHaveLength(3)
    key(document.activeElement, 'Escape')
    await ticks(); await wait(10)
    expect(s.steps.value).toEqual(['detalle', 'ingreso'])
    expect(stepEvents(s).at(-1).reason).toBe('escape')
    expect(s.events.some(([n]) => n === 'dismiss')).toBe(false)
    key(document.activeElement, 'Escape'); await ticks(); await wait(10)
    key(document.activeElement, 'Escape'); await ticks()
    expect(s.events.find(([n]) => n === 'dismiss')[1]).toEqual({ reason: 'escape', depth: 1 })
  })

  it('Esc ya tratada por un descendiente no baja', async () => {
    const s = setup()
    await ticks()
    $('#to-ingreso').click(); await ticks(); await wait(10)
    const t = document.activeElement
    t.addEventListener('keydown', (e) => e.preventDefault(), { once: true })
    key(t, 'Escape'); await ticks()
    expect(s.steps.value).toHaveLength(2)
  })

  it('el cierre (X) cierra el recorrido entero: dismiss close con depth; preventDefault lo mantiene', async () => {
    const s = setup({ prevent: true })
    await ticks()
    $('#to-ingreso').click(); await ticks(); await wait(10)
    $('.g-dialog__close').click(); await ticks()
    expect(s.events.find(([n]) => n === 'dismiss')[1]).toEqual({ reason: 'close', depth: 2 })
    expect(s.open.value).toBe(true)
  })

  it('back con un solo paso = close() (dismiss close, cancelable)', async () => {
    const s = setup()
    await ticks()
    s.exposed.value.back()
    await ticks()
    expect(s.events.find(([n]) => n === 'dismiss')[1]).toEqual({ reason: 'close', depth: 1 })
    expect(s.open.value).toBe(false)
  })

  it('fondo: con dos pasos no hace nada; con uno, dismiss backdrop', async () => {
    const s = setup()
    await ticks()
    const d = s.d()
    d.getBoundingClientRect = () => ({ left: 100, right: 500, top: 100, bottom: 500, width: 400, height: 400 })
    const clickOut = () => {
      d.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 }))
      d.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 10, clientY: 10 }))
    }
    $('#to-ingreso').click(); await ticks(); await wait(10)
    clickOut(); await ticks()
    expect(s.events.some(([n]) => n === 'dismiss')).toBe(false)
    s.exposed.value.back(); await ticks(); await wait(10)
    clickOut(); await ticks()
    expect(s.events.find(([n]) => n === 'dismiss')[1]).toEqual({ reason: 'backdrop', depth: 1 })
  })

  it('fondo con un GFormFold abierto dentro: sin dismiss (registro interno)', async () => {
    const s = setup({ withFold: true, steps: ['detalle', 'ingreso'] })
    await ticks()
    s.exposed.value.backTo('detalle'); await ticks(); await wait(10)
    // Pliegue en el paso 1? no: vuelve a abrir el ingreso con un solo paso en el historial
    s.steps.value = ['ingreso']
    await ticks()
    s.foldOpen.value = true
    await ticks(); await wait(20)
    const d = s.d()
    d.getBoundingClientRect = () => ({ left: 100, right: 500, top: 100, bottom: 500, width: 400, height: 400 })
    d.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 }))
    d.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 10, clientY: 10 }))
    await ticks()
    expect(s.events.some(([n]) => n === 'dismiss')).toBe(false)
    // Esc en el pliegue lo recoge solo a él (el diálogo ni baja ni emite dismiss)
    key(document.getElementById('fold-in'), 'Escape'); await ticks()
    expect(s.foldOpen.value).toBe(false)
    expect(s.events.some(([n]) => n === 'dismiss')).toBe(false)
  })

  it('el hilo: salto con backTo (reason trail), foco al from del paso de encima, un solo step', async () => {
    const s = setup()
    await ticks()
    $('#to-ingreso').click(); await ticks(); await wait(10)
    $('#p3').focus(); $('#p3').click(); await ticks(); await wait(10)
    const n0 = stepEvents(s).length
    const first = $('.g-dialog__trail-item button')
    first.click(); await ticks(); await wait(10)
    expect(s.steps.value).toEqual(['detalle'])
    expect(stepEvents(s).length).toBe(n0 + 1)
    expect(stepEvents(s).at(-1)).toMatchObject({ from: 'partida', to: 'detalle', direction: 'back', reason: 'trail' })
    expect(document.activeElement.id).toBe('to-ingreso')
  })

  it('backTo de la API (reason back) con focus y announce', async () => {
    const s = setup()
    await ticks()
    $('#to-ingreso').click(); await ticks(); await wait(10)
    $('#p3').click(); await ticks(); await wait(10)
    s.exposed.value.backTo('ingreso', { focus: 'nota', announce: 'Listo.' }); await ticks(); await wait(80)
    expect(document.activeElement.id).toBe('nota')
    expect(stepEvents(s).at(-1).reason).toBe('back')
    expect(pageLiveNode().textContent).toBe('Listo.')
  })

  it('push con from explícito: al volver, el foco va a él', async () => {
    document.body.insertAdjacentHTML('beforeend', '<span></span>')
    const s = setup({ pushFrom: 'nota' })
    await ticks()
    $('#to-ingreso').click(); await ticks(); await wait(10)
    $('#p3').click(); await ticks(); await wait(10)
    s.exposed.value.back(); await ticks(); await wait(10)
    expect(document.activeElement.id).toBe('nota')
  })

  it('sin v-model:steps: historial interno, emite update:steps, y vuelve al primer paso tras closed', async () => {
    const s = setup({ vmodel: false, uncontrolledEvents: true })
    await ticks()
    $('#to-ingreso').click(); await ticks(); await wait(10)
    expect(s.d().querySelector('.g-dialog__step.is-current #nota')).not.toBeNull()
    expect(s.events.find(([n]) => n === 'update:steps')[1]).toEqual(['detalle', 'ingreso'])
    s.open.value = false; await ticks(); await wait(20)
    expect(s.events.some(([n]) => n === 'closed')).toBe(true)
    s.open.value = true; await ticks()
    expect(s.d().getAttribute('aria-labelledby')).toBe('dlg-step-detalle-title')
  })

  it('labels.back como función; sin labels.back no hay «Volver» y avisa; sin trail, nav sin nombre y aviso', async () => {
    const s = setup({ labels: { back: (t) => `Atrás: ${t}`, trail: 'Recorrido' } })
    await ticks()
    $('#to-ingreso').click(); await ticks(); await wait(10)
    expect($('.g-dialog__back').getAttribute('aria-label')).toBe('Atrás: Ácido clorhídrico 37 %')
    s.w.unmount()
    const t = setup({ labels: {} })
    await ticks()
    $('#to-ingreso').click(); await ticks(); await wait(10)
    expect($('.g-dialog__back')).toBeNull()
    expect($('nav.g-dialog__trail').hasAttribute('aria-label')).toBe(false)
    expect(warned(/labels\.back/)).toBe(true)
    expect(warned(/labels\.trail/)).toBe(true)
  })

  it('avisos: historial con un nombre desconocido o repetido; push con el diálogo cerrado; paso sin title; GDialogStep fuera', async () => {
    const s = setup({ steps: ['detalle', 'nada', 'detalle'] })
    await ticks()
    expect(warned(/«nada», que no es de ningún GDialogStep/)).toBe(true)
    expect(warned(/«detalle» está repetido/)).toBe(true)
    expect(s.d().querySelectorAll('.g-dialog__step')).toHaveLength(1)
    s.open.value = false; await ticks()
    s.exposed.value.push('ingreso')
    expect(warned(/`push` con el diálogo cerrado/)).toBe(true)
    mount(defineComponent({ setup: () => () => h(GDialogStep, { name: 'x' }) }))
    expect(warned(/fuera de un GDialog/)).toBe(true)
  })

  it('aviso 1: title, description o footer de GDialog con pasos; aviso 5: tabs con pasos', () => {
    mount(GDialog, { props: { title: 'X', closeLabel: 'C' }, slots: { default: () => h(GDialogStep, { name: 'a', title: 'A' }), tabs: () => h('i') } })
    expect(warned(/en modo pasos no se usan/)).toBe(true)
    expect(warned(/`tabs` no se combina con pasos/)).toBe(true)
    // Y no avisa de que falte el nombre del diálogo (lo da el paso)
    expect(warned(/necesita title, slot title o header/)).toBe(false)
  })

  it('el aviso 1 mira el slot sin invocarlo fuera del render: un slot escrito con h() en el render del padre no da [Vue warn]', () => {
    const App = (step) => defineComponent({ setup: () => () => h(GDialog, { title: 'X', closeLabel: 'C' }, { default: () => (step ? h(GDialogStep, { name: 'a', title: 'A' }) : h('p', 'Contenido')) }) })
    mount(App(false))
    mount(App(true))
    expect(warned(/\[Vue warn\]/)).toBe(false)
    expect(warned(/en modo pasos no se usan/)).toBe(true)
  })

  it('useDialogSteps(): dentro del contenido da { steps, current, depth, push, back, backTo }; fuera, null', async () => {
    let api = 'sin llamar'
    const Probe = defineComponent({ setup() { api = useDialogSteps(); return () => h('i') } })
    let outside = 'sin llamar'
    mount(defineComponent({ setup() { outside = useDialogSteps(); return () => h('i') } }))
    expect(outside).toBeNull()
    const s = setup({ extra: () => h(Probe) })
    await ticks()
    expect(Object.keys(api).sort()).toEqual(['back', 'backTo', 'current', 'depth', 'push', 'steps'])
    expect(api.current.value).toBe('detalle')
    api.push('ingreso'); await ticks(); await wait(10)
    expect(api.steps.value).toEqual(['detalle', 'ingreso'])
    expect(api.depth.value).toBe(2)
    expect(s.steps.value).toEqual(['detalle', 'ingreso'])
  })

  it('hoja: --_sheet-hold y has-sheet-hold en modo pasos; se borra tras closed', async () => {
    const s = setup()
    await ticks()
    s.d().getBoundingClientRect = () => ({ left: 0, right: 400, top: 0, bottom: 300, width: 400, height: 300 })
    $('#to-ingreso').click(); await ticks(); await wait(10)
    expect(s.d().classList.contains('has-sheet-hold')).toBe(true)
    expect(s.d().style.getPropertyValue('--_sheet-hold')).toBe('300px')
    s.open.value = false; await ticks(); await wait(20)
    expect(s.d().classList.contains('has-sheet-hold')).toBe(false)
  })

  it('SSR de un GDialog cerrado con pasos: sin contenido', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(GDialog, { closeLabel: 'C' }, () => [h(GDialogStep, { name: 'a', title: 'A' }, () => h('input', { id: 'x' }))]) }))
    expect(html).toContain('g-dialog')
    expect(html).not.toContain('id="x"')
  })
})
