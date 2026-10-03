// GTranscript en jsdom (speech.md §22 a §25, §31): marcado de §22.4/§29, una parada de tabulación y teclado APG, edición
// en la celda sin pisar parciales, selección, menús (GMenu real), anuncios (región propia o canales del anfitrión),
// destinos, copia, modos y «Revisar» (superficie o GDialog real de respaldo). Playwright cubre foco real, selección de
// texto, portapapeles, 320px y la compuerta de rendimiento (design/lab/theme-playground/tests/speech-f2.spec.mjs).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, provide, reactive, ref } from 'vue'
import GTranscript from './GTranscript.vue'
import GSpeechHost from '../GSpeechHost/GSpeechHost.vue'
import { createTranscript, TRANSCRIPT_LIMITS, TX } from './transcript.js'
import GForm from '../GForm/GForm.vue'
import { formKey } from '../GForm/formContext.js'
import { createSpeech, useSpeechTarget } from '../GSpeechHost/speech.js'
import { createSimulatedSpeechAdapter } from '../GSpeechHost/simulatedAdapter.js'
import { installSpeechEnv, installTopLayer, LABELS } from '../GSpeechHost/speechTestEnv.js'

let warn
let restoreTopLayer
const wrappers = []
beforeEach(() => {
  restoreTopLayer = installTopLayer()
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame'] })
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  expect(warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes('[Vue warn]'))).toEqual([])
  while (wrappers.length) wrappers.pop().unmount()
  restoreTopLayer()
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const flush = async () => { await nextTick(); await nextTick(); await nextTick() }
const tick = async (ms) => { await vi.advanceTimersByTimeAsync(ms); await flush() }
const key = (k, o = {}) => new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...o })
const press = async (k, o) => { const e = key(k, o); document.activeElement.dispatchEvent(e); await flush(); return e }
const ROLES = [{ id: 'pro', label: 'Profesional' }, { id: 'pac', label: 'Paciente' }]

function sample(n = 4) {
  const tx = createTranscript({ mode: 'conversation', expectedSpeakers: 2 })
  const texts = ['Buenos días, cuénteme.', 'Me duele la cabeza por la tarde.', 'Y a veces me mareo.', '¿Ha tomado algo?', 'Un analgésico.', 'Bien.']
  for (let i = 0; i < n; i++) tx[TX].final({ id: `s${i + 1}`, text: texts[i % texts.length], speaker: i % 3 === 0 ? 'spk_0' : 'spk_1', t0: i * 3000, t1: i * 3000 + 2000 })
  return tx
}

function setup(props = {}, { slot, before } = {}) {
  const App = defineComponent({
    setup() {
      return () => h('div', [
        h('h2', { id: 'title' }, 'Consulta'),
        h('button', { id: 'outside' }, 'Fuera'),
        before ? before() : null,
        h(GTranscript, { labelledby: 'title', labels: LABELS, roles: ROLES, ...props }),
        slot ? slot() : null
      ])
    }
  })
  const w = mount(App, { attachTo: document.body })
  wrappers.push(w)
  return w
}
const root = () => document.querySelector('.g-transcript')
const grid = () => root().querySelector('[role="grid"]')
const rows = () => [...root().querySelectorAll('.g-transcript__row')]
const row = (id) => rows().find((r) => r.dataset.id === id)
const tabStops = () => grid().querySelectorAll('[tabindex="0"]')
const own = () => root().querySelector('.g-transcript__live')
const statusRegions = () => [...root().querySelectorAll('[role="status"], [role="alert"], [aria-live]:not([aria-live="off"])')]
const menuList = () => document.querySelector('.g-transcript ul[role="menu"]')
const items = () => [...menuList().querySelectorAll('[role^="menuitem"]')]

describe('GTranscript · marcado (§22.4, §29)', () => {
  it('rejilla con nombre, descripción, selección múltiple, cabeceras ocultas y una fila por fragmento', async () => {
    const tx = sample()
    tx.edit('s2', 'Me duele la cabeza por las tardes.')
    setup({ transcript: tx })
    await flush()
    const r = root()
    expect(r.dataset.mode).toBe('edit')
    expect(r.hasAttribute('data-compact')).toBe(false)
    const g = grid()
    expect(g.getAttribute('aria-labelledby')).toBe('title')
    expect(g.getAttribute('aria-describedby')).toBe(r.querySelector('.g-transcript__kbd').id)
    expect(g.getAttribute('aria-multiselectable')).toBe('true')
    expect([...g.querySelectorAll('.g-transcript__head [role="columnheader"]')].map((c) => c.textContent)).toEqual(['Selección', 'Hora', 'Hablante', 'Texto', 'Acciones'])
    expect(rows()).toHaveLength(4)
    const r2 = row('s2')
    expect(r2.getAttribute('role')).toBe('row')
    expect(r2.getAttribute('aria-selected')).toBe('false')
    expect(r2.classList.contains('is-corrected')).toBe(true)
    expect(r2.querySelector('.g-transcript__cell--time').getAttribute('role')).toBe('rowheader')
    expect(r2.querySelector('time').getAttribute('datetime')).toBe('PT3S')
    expect(r2.querySelector('.g-transcript__cell--select input').getAttribute('aria-label')).toBe('Seleccionar fragmento de las 00:03')
    const spk = r2.querySelector('.g-transcript__speaker.g-btn')
    expect(spk.getAttribute('aria-haspopup')).toBe('menu')
    expect(spk.querySelector('.g-transcript__mark').getAttribute('aria-hidden')).toBe('true')
    expect(spk.querySelector('.g-transcript__mark').textContent).toBe('B')
    expect(spk.querySelector('.g-transcript__mark').hasAttribute('data-cat')).toBe(false)
    expect(spk.querySelector('.g-transcript__sr').textContent).toBe(', cambiar hablante')
    expect(r2.querySelector('.g-transcript__text').textContent).toBe('Me duele la cabeza por las tardes.')
    expect(r2.querySelector('.g-transcript__flag--corrected').textContent).toBe('Corregido')
    expect(r2.querySelector('.g-transcript__flag--corrected svg.g-icon')).not.toBeNull()
    expect(r2.querySelector('.g-transcript__actions').getAttribute('aria-label')).toBe('Acciones del fragmento de las 00:03')
    expect(tabStops()).toHaveLength(1)
    expect(tabStops()[0]).toBe(row('s1').querySelector('.g-transcript__cell--text'))
    // Barra: GBtn sm ghost neutral; Deshacer/Rehacer con flip-rtl y aria-disabled con la pila vacía
    const bar = r.querySelector('.g-transcript__bar')
    expect(bar.getAttribute('role')).toBe('group')
    expect(bar.getAttribute('aria-label')).toBe('Acciones de la transcripción')
    const undo = [...bar.querySelectorAll('.g-btn')].find((b) => b.textContent.includes('Deshacer'))
    expect(undo.classList.contains('g-btn--variant-ghost')).toBe(true)
    expect(undo.getAttribute('aria-keyshortcuts')).toBe('Control+Z')
    expect(undo.querySelector('svg').classList.contains('g-icon--flip-rtl')).toBe(true)
    expect(document.getElementById(undo.getAttribute('aria-describedby')).textContent).toBe('Deshacer: corrección de las 00:03')
    const redo = [...bar.querySelectorAll('.g-btn')].find((b) => b.textContent.includes('Rehacer'))
    expect(redo.getAttribute('aria-disabled')).toBe('true')
    expect(document.getElementById(redo.getAttribute('aria-describedby')).textContent).toBe('Nada que rehacer')
  })

  it('ninguna región role="status" salvo la propia (presente y vacía desde el montaje); ningún g-btn__status (#257)', async () => {
    setup({ transcript: sample(6) })
    await flush()
    expect(root().querySelectorAll('.g-btn').length).toBeGreaterThan(12)
    expect(root().querySelectorAll('.g-btn__status')).toHaveLength(0)
    expect([...root().querySelectorAll('[role="status"], [role="alert"]')]).toEqual([own()])
    // #262: las casillas van con field: false, sin región de mensaje; sin destinos no hay otra región viva en la vista
    expect(root().querySelectorAll('.g-checkbox__message')).toHaveLength(0)
    expect(statusRegions()).toEqual([own()])
    expect(own().getAttribute('role')).toBe('status')
    expect(own().getAttribute('aria-live')).toBe('polite')
    expect(own().textContent).toBe('')
  })

  it('provisional en su fila (última, con prefijo oculto y marca), fallido sin __text, «Sin asignar» sin letra, data-cat solo con k ≤ speakerColors', async () => {
    const tx = sample(2)
    tx[TX].failed({ id: 'f1', t0: 7000, t1: 8000 })
    tx[TX].final({ id: 'n1', text: 'Sin hablante.', t0: 9000, t1: 9500 })
    tx[TX].partial({ id: 'p1', text: 'entonces le pido', speaker: 'spk_2' })
    setup({ transcript: tx, speakerColors: 1 })
    await flush()
    const p = row('p1')
    expect(rows().at(-1)).toBe(p)
    expect(p.classList.contains('is-partial')).toBe(true)
    expect(p.hasAttribute('aria-selected')).toBe(false)
    expect(p.querySelector('.g-transcript__text .g-transcript__sr').textContent).toBe('Texto provisional: ')
    expect(p.querySelector('.g-transcript__flag--partial').textContent).toBe('provisional')
    expect(p.querySelector('span.g-transcript__speaker')).not.toBeNull()
    expect(p.querySelector('.g-btn')).toBeNull()
    const f = row('f1')
    expect(f.classList.contains('is-failed')).toBe(true)
    expect(f.querySelector('.g-transcript__text')).toBeNull()
    expect(f.querySelector('.g-transcript__flag--failed').textContent).toBe('No se pudo transcribir')
    expect(f.querySelector('.g-transcript__cell--speaker').children).toHaveLength(0)
    expect(f.querySelector('.g-transcript__cell--select input')).toBeNull()
    const n = row('n1').querySelector('.g-transcript__mark')
    expect(n.classList.contains('is-unassigned')).toBe(true)
    expect(n.textContent).toBe('')
    expect(row('s1').querySelector('.g-transcript__mark').getAttribute('data-cat')).toBe('1')
    expect(row('s2').querySelector('.g-transcript__mark').hasAttribute('data-cat')).toBe(false)
  })

  it('sin transcript o sin nombre avisa; vacío pinta un <p class="__empty"> sin barra', async () => {
    setup({ transcript: undefined, labelledby: undefined })
    await flush()
    const msgs = warn.mock.calls.map((c) => String(c[0]))
    expect(msgs.some((m) => m.includes('sin transcript'))).toBe(true)
    expect(msgs.some((m) => m.includes('labelledby'))).toBe(true)
    expect(root().querySelector('.g-transcript__empty').textContent).toBe('Todavía no hay texto.')
    expect(root().querySelector('.g-transcript__bar')).toBeNull()
  })
})

describe('GTranscript · teclado APG y una parada (§22.11)', () => {
  it('flechas, Inicio/Fin, Ctrl+Inicio/Fin, RePág/AvPág mueven el foco; siempre un solo tabindex="0"', async () => {
    setup({ transcript: sample(14) })
    await flush()
    tabStops()[0].focus()
    await flush()
    await press('ArrowDown')
    expect(document.activeElement).toBe(row('s2').querySelector('.g-transcript__cell--text'))
    expect(tabStops()).toHaveLength(1)
    await press('ArrowLeft')
    expect(document.activeElement).toBe(row('s2').querySelector('.g-transcript__speaker'))
    await press('Home')
    expect(document.activeElement).toBe(row('s2').querySelector('.g-transcript__cell--select input'))
    await press('End')
    expect(document.activeElement).toBe(row('s2').querySelector('.g-transcript__actions'))
    await press('End', { ctrlKey: true })
    expect(document.activeElement).toBe(row('s14').querySelector('.g-transcript__actions'))
    await press('PageUp')
    expect(document.activeElement).toBe(row('s4').querySelector('.g-transcript__actions'))
    await press('Home', { ctrlKey: true })
    expect(document.activeElement).toBe(row('s1').querySelector('.g-transcript__actions'))
    await press('ArrowRight')
    expect(document.activeElement).toBe(row('s1').querySelector('.g-transcript__actions')) // última columna: se queda
    expect(tabStops()).toHaveLength(1)
    expect(tabStops()[0]).toBe(document.activeElement)
  })

  it('con IME no se trata ninguna tecla', async () => {
    setup({ transcript: sample() })
    await flush()
    tabStops()[0].focus()
    const e = await press('ArrowDown', { isComposing: true })
    expect(e.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(row('s1').querySelector('.g-transcript__cell--text'))
  })
})

describe('GTranscript · edición en la celda (§22.6, §22.7)', () => {
  it('Intro abre el editor (textarea con el corregido, cursor al final); Intro guarda, anuncia y devuelve el foco', async () => {
    const tx = sample()
    const w = setup({ transcript: tx })
    await flush()
    tabStops()[0].focus()
    await press('Enter')
    const ta = document.activeElement
    expect(ta.localName).toBe('textarea')
    expect(ta.classList.contains('g-transcript__field')).toBe(true)
    expect(ta.value).toBe('Buenos días, cuénteme.')
    expect(ta.selectionStart).toBe(ta.value.length)
    const ed = ta.closest('.g-transcript__editor')
    expect(ed.getAttribute('role')).toBe('group')
    expect(ed.getAttribute('aria-label')).toBe('Editar fragmento de las 00:00')
    expect(ta.getAttribute('aria-label')).toBe('Texto del fragmento de las 00:00')
    expect(document.getElementById(ta.getAttribute('aria-describedby').split(' ')[0]).textContent).toBe('Original del motor: Buenos días, cuénteme.')
    expect(row('s1').classList.contains('is-editing')).toBe(true)
    expect(tabStops()).toHaveLength(1)
    ta.value = 'Buenos días, dígame.'
    await press('Enter')
    expect(tx.segment('s1').corrected).toBe('Buenos días, dígame.')
    expect(document.activeElement).toBe(row('s1').querySelector('.g-transcript__cell--text'))
    await tick(400)
    expect(own().textContent).toBe('Fragmento de las 00:00 corregido. El original se conserva.')
    const change = w.findComponent(GTranscript).emitted('change')
    expect(change).toEqual([[{ kind: 'edit', ids: ['s1'] }]])
  })

  it('Esc cancela sin guardar, con preventDefault y sin propagarse (no cierra un panel ni un diálogo, #143)', async () => {
    const tx = sample()
    setup({ transcript: tx })
    await flush()
    tabStops()[0].focus()
    await press('F2')
    document.activeElement.value = 'Otra cosa'
    const outer = vi.fn()
    document.addEventListener('keydown', outer)
    const e = await press('Escape')
    document.removeEventListener('keydown', outer)
    expect(e.defaultPrevented).toBe(true)
    expect(outer).not.toHaveBeenCalled()
    expect(tx.segment('s1').corrected).toBeNull()
    expect(document.activeElement).toBe(row('s1').querySelector('.g-transcript__cell--text'))
  })

  it('salir del editor a otro elemento guarda; perder la ventana no; vaciar = eliminado (emptied)', async () => {
    const tx = sample()
    setup({ transcript: tx })
    await flush()
    tabStops()[0].focus()
    await press('Enter')
    let ta = document.activeElement
    ta.value = 'Cambio por salida.'
    // La ventana pierde el foco: el editor sigue abierto
    const hasFocus = vi.spyOn(document, 'hasFocus').mockReturnValue(false)
    ta.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }))
    await flush()
    expect(row('s1').classList.contains('is-editing')).toBe(true)
    hasFocus.mockReturnValue(true)
    document.getElementById('outside').focus()
    await flush()
    expect(tx.segment('s1').corrected).toBe('Cambio por salida.')
    expect(row('s1').classList.contains('is-editing')).toBe(false)
    row('s2').querySelector('.g-transcript__cell--text').focus()
    await press('Enter')
    ta = document.activeElement
    ta.value = '   '
    await press('Enter')
    expect(tx.segment('s2').removed).toBe(true)
    await tick(400)
    expect(own().textContent).toBe('Texto vacío: el fragmento de las 00:03 queda eliminado. Puedes restaurarlo.')
  })

  it('con el editor abierto llegan confirmados, provisionales y un relabel: foco, borrador y cursor intactos; la otra vista refleja el guardado', async () => {
    const tx = sample(3)
    setup({ transcript: tx }, { slot: () => h('div', { id: 'other' }, [h(GTranscript, { transcript: tx, label: 'Otra vista', labels: LABELS, editable: false })]) })
    await flush()
    row('s2').querySelector('.g-transcript__cell--text').focus()
    await press('Enter')
    const ta = document.activeElement
    ta.value = 'Borrador a medias'
    ta.setSelectionRange(3, 3)
    const e = tx[TX]
    e.partial({ id: 'p1', text: 'uno' })
    await flush()
    e.partial({ id: 'p1', text: 'uno dos' })
    e.final({ id: 'p1', text: 'Uno dos.', speaker: 'spk_1', t0: 20000, t1: 21000 })
    await flush()
    e.partial({ id: 'p2', text: 'tres' })
    e.final({ id: 'n2', text: 'Antes.', speaker: 'spk_0', t0: 4000, t1: 4500 })
    e.relabel({ spk_1: 'spk_0' })
    await flush()
    expect(document.activeElement).toBe(ta)
    expect(ta.isConnected).toBe(true)
    expect(ta.value).toBe('Borrador a medias')
    expect(ta.selectionStart).toBe(3)
    ta.value = 'Guardado.'
    await press('Enter')
    const otherText = [...document.querySelectorAll('#other .g-transcript__row')].find((r) => r.dataset.id === 's2').querySelector('.g-transcript__text')
    expect(otherText.textContent).toBe('Guardado.')
  })
})

describe('GTranscript · selección (§22.8)', () => {
  it('Mayús+Espacio, Mayús+↓, Ctrl+A ida y vuelta con anuncio; aria-selected y v-model:selected', async () => {
    const selected = ref([])
    const w = setup({ transcript: sample(5), selected: selected.value, 'onUpdate:selected': (v) => { selected.value = v } })
    await flush()
    tabStops()[0].focus()
    await press(' ', { shiftKey: true })
    expect(row('s1').getAttribute('aria-selected')).toBe('true')
    expect(row('s1').classList.contains('is-selected')).toBe(true)
    await press('ArrowDown', { shiftKey: true })
    expect(selected.value).toEqual(['s1', 's2'])
    expect(document.activeElement).toBe(row('s2').querySelector('.g-transcript__cell--text'))
    expect(root().querySelector('.g-transcript__count').textContent).toBe('2 seleccionados')
    await press('a', { ctrlKey: true })
    expect(selected.value).toEqual(['s1', 's2', 's3', 's4', 's5'])
    await tick(400)
    expect(own().textContent).toBe('5 fragmentos seleccionados.')
    await press('a', { ctrlKey: true })
    expect(selected.value).toEqual([])
    await tick(400)
    expect(own().textContent).toBe('Ningún fragmento seleccionado.')
    expect(w.findComponent(GTranscript).emitted('update:selected').length).toBeGreaterThan(3)
  })

  it('Mayús+clic en la casilla marca el rango; «Seleccionar todo» con estado mixto; selected inválido se descarta con aviso', async () => {
    const tx = sample(5)
    tx[TX].partial({ id: 'p1', text: 'x' })
    setup({ transcript: tx, selected: ['s1', 'p1', 'zz'] })
    await flush()
    expect(warn.mock.calls.some((c) => String(c[0]).includes('selected trae ids'))).toBe(true)
    expect(row('s1').getAttribute('aria-selected')).toBe('true')
    const all = root().querySelector('.g-transcript__all input')
    expect(all.indeterminate).toBe(true)
    const box = row('s4').querySelector('.g-transcript__cell--select input')
    box.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }))
    await flush()
    expect(rows().filter((r) => r.getAttribute('aria-selected') === 'true').map((r) => r.dataset.id)).toEqual(['s1', 's2', 's3', 's4'])
    all.click()
    await flush()
    expect(rows().filter((r) => r.getAttribute('aria-selected') === 'true')).toHaveLength(5)
  })
})

describe('GTranscript · casillas sin región ni contexto de GForm (#262)', () => {
  it('ninguna g-checkbox__message en la vista; cero regiones aria-live dentro de la rejilla y de la barra', async () => {
    const { targets } = (() => {
      const model = reactive({ motivo: '' })
      return { targets: [{ id: 'motivo', label: 'Motivo', get: () => model.motivo, set: (v) => { model.motivo = v } }] }
    })()
    setup({ transcript: sample(8), targets })
    await flush()
    expect(grid().querySelectorAll('.g-checkbox')).toHaveLength(8)
    expect(root().querySelector('.g-transcript__all')).not.toBeNull()
    expect(root().querySelector('.g-transcript__insert .g-checkbox')).not.toBeNull()
    expect(root().querySelectorAll('.g-checkbox__message')).toHaveLength(0)
    expect(grid().querySelectorAll('[aria-live]')).toHaveLength(0)
    expect(grid().querySelectorAll('[role="status"], [role="alert"]')).toHaveLength(0)
    expect(root().querySelector('.g-transcript__bar').querySelectorAll('[aria-live]')).toHaveLength(0)
    // Las únicas otras regiones son las de los GSelect de la inserción, que sí son campos (C4)
    expect(statusRegions().filter((r) => r !== own()).every((r) => r.classList.contains('g-select__message'))).toBe(true)
  })

  it('dentro de un GForm readonly y disabled: la selección sigue operable y las casillas no usan el contexto', async () => {
    const register = vi.fn(() => () => {})
    const notifyChange = vi.fn()
    const Fake = defineComponent({
      setup(_, { slots }) {
        provide(formKey, { readonly: true, disabled: true, density: 'compact', live: 'polite', register, notifyChange, notifyInput: vi.fn(), notifyBlur: vi.fn(), labels: {} })
        return () => slots.default()
      }
    })
    const selected = ref([])
    const tx = sample(4)
    const w = mount(defineComponent({ setup: () => () => h(Fake, null, { default: () => [h('h2', { id: 'title' }, 'Consulta'), h(GTranscript, { transcript: tx, labelledby: 'title', labels: LABELS, roles: ROLES, selected: selected.value, 'onUpdate:selected': (v) => { selected.value = v } })] }) }), { attachTo: document.body })
    wrappers.push(w)
    await flush()
    const boxes = [...root().querySelectorAll('.g-checkbox')]
    expect(boxes.length).toBe(5) // 4 filas + «Seleccionar todo»
    for (const b of boxes) {
      expect(b.classList.contains('is-readonly')).toBe(false)
      expect(b.classList.contains('is-disabled')).toBe(false)
      expect(b.classList.contains('g-checkbox--density-default')).toBe(true)
      expect(b.querySelector('input').hasAttribute('aria-readonly')).toBe(false)
      expect(b.querySelector('input').disabled).toBe(false)
    }
    row('s2').querySelector('.g-transcript__cell--select input').click()
    await flush()
    expect(selected.value).toEqual(['s2'])
    root().querySelector('.g-transcript__all input').click()
    await flush()
    expect(selected.value).toEqual(['s1', 's2', 's3', 's4'])
    expect(register).not.toHaveBeenCalled()
    expect(notifyChange).not.toHaveBeenCalled()
  })

  it('dentro de un GForm real en solo lectura se marca una fila con el ratón', async () => {
    const selected = ref([])
    const tx = sample(3) // fuera del render: crearlo dentro lo rastrearía el efecto de GForm
    const w = mount(defineComponent({ setup: () => () => h(GForm, { readonly: true }, { default: () => [h('h2', { id: 'title' }, 'Consulta'), h(GTranscript, { transcript: tx, labelledby: 'title', labels: LABELS, roles: ROLES, selected: selected.value, 'onUpdate:selected': (v) => { selected.value = v } })] }) }), { attachTo: document.body })
    wrappers.push(w)
    await flush()
    row('s3').querySelector('.g-transcript__cell--select input').click()
    await flush()
    expect(selected.value).toEqual(['s3'])
  })

  it('TRANSCRIPT_LIMITS.selectionBatch = 40 (#263)', () => {
    expect(TRANSCRIPT_LIMITS.selectionBatch).toBe(40)
  })
})

describe('GTranscript · acciones, historial y anuncios (§22.10 a §22.13)', () => {
  it('Supr elimina la fila (y restaura si ya lo estaba); tres Supr seguidos → un anuncio; Ctrl+Z / Ctrl+Mayús+Z desde la rejilla', async () => {
    const tx = sample(5)
    setup({ transcript: tx })
    await flush()
    const writes = []
    const obs = new MutationObserver(() => { if (own().textContent) writes.push(own().textContent) })
    obs.observe(own(), { childList: true, characterData: true, subtree: true })
    tabStops()[0].focus()
    await press('Delete')
    await press('ArrowDown')
    await press('Delete')
    await press('ArrowDown')
    await press('Delete')
    await tick(400)
    obs.disconnect()
    expect(['s1', 's2', 's3'].every((id) => tx.segment(id).removed)).toBe(true)
    expect(row('s1').classList.contains('is-removed')).toBe(true)
    expect(row('s1').querySelector('.g-transcript__flag--removed').textContent).toBe('Eliminado')
    expect(writes).toEqual(['Fragmento de las 00:06 eliminado. Puedes restaurarlo.'])
    await press('z', { ctrlKey: true })
    expect(tx.segment('s3').removed).toBe(false)
    expect(document.activeElement).toBe(row('s3').querySelector('.g-transcript__cell--text'))
    await tick(400)
    expect(own().textContent).toBe('Deshecho: eliminación.')
    await press('Z', { ctrlKey: true, shiftKey: true })
    expect(tx.segment('s3').removed).toBe(true)
    await press('Backspace')
    expect(tx.segment('s3').removed).toBe(false)
  })

  it('Supr sobre una fila de la selección actúa sobre toda la selección; la barra cambia a «Restaurar selección»', async () => {
    const tx = sample(4)
    setup({ transcript: tx, selected: ['s2', 's3'] })
    await flush()
    row('s2').querySelector('.g-transcript__cell--text').focus()
    await press('Delete')
    expect(tx.segment('s2').removed && tx.segment('s3').removed).toBe(true)
    await tick(400)
    expect(own().textContent).toBe('2 fragmentos eliminados. Puedes restaurarlos.')
    const btn = [...root().querySelectorAll('.g-transcript__bar .g-btn')].find((b) => b.textContent.includes('selección'))
    expect(btn.textContent.trim()).toBe('Restaurar selección')
  })

  it('Deshacer desde la barra: el foco se queda en el botón; sin nada que deshacer, aria-disabled y anuncio', async () => {
    const tx = sample(3)
    setup({ transcript: tx })
    await flush()
    const undo = () => [...root().querySelectorAll('.g-transcript__bar .g-btn')].find((b) => b.textContent.includes('Deshacer'))
    undo().focus()
    undo().click()
    await tick(400)
    expect(own().textContent).toBe('Nada que deshacer.')
    tx.remove(['s2'])
    await flush()
    expect(undo().hasAttribute('aria-disabled')).toBe(false)
    undo().focus()
    undo().click()
    await flush()
    expect(tx.segment('s2').removed).toBe(false)
    expect(document.activeElement).toBe(undo())
  })

  it('menú de fila (GMenu real, compartido): abre con el botón, Editar texto abre el editor; Esc cierra y vuelve al botón sin propagarse', async () => {
    const tx = sample(3)
    tx.edit('s2', 'Corregido.')
    setup({ transcript: tx })
    await flush()
    const btn = row('s2').querySelector('.g-transcript__actions')
    btn.focus()
    btn.click()
    await flush()
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    expect(menuList().getAttribute('aria-label')).toBe('Acciones del fragmento de las 00:03')
    expect(items().map((i) => i.textContent.trim())).toEqual(['Editar texto', 'Ver original', 'Volver al original', 'Eliminar', 'Copiar fragmento'])
    const outer = vi.fn()
    document.addEventListener('keydown', outer)
    const e = key('Escape')
    document.activeElement.dispatchEvent(e)
    await flush()
    document.removeEventListener('keydown', outer)
    expect(e.defaultPrevented).toBe(true)
    expect(outer).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(btn)
    btn.click()
    await flush()
    items()[1].click() // Ver original
    await flush()
    const orig = row('s2').querySelector('.g-transcript__orig')
    expect([...orig.children].map((p) => p.localName)).toEqual(['p', 'p'])
    expect(orig.children[0].textContent).toBe('Original del motor: Me duele la cabeza por la tarde.')
    const diff = orig.querySelector('span.g-transcript__diff')
    expect(diff.querySelector('del').textContent).toBe('(eliminado: Me duele la cabeza por la tarde.)')
    expect(diff.querySelector('del .g-transcript__sr').textContent).toBe('(eliminado: ')
    expect(diff.querySelector('ins').textContent).toBe('(añadido: Corregido.)')
    btn.click()
    await flush()
    items()[0].click() // Editar texto
    await flush()
    expect(document.activeElement.localName).toBe('textarea')
  })

  it('menú del hablante: menuitemradio por hablante + Nuevo hablante; reasignar marca «Hablante cambiado» y anuncia', async () => {
    const tx = sample(3)
    tx.setRole('spk_0', 'pro')
    setup({ transcript: tx })
    await flush()
    const btn = row('s2').querySelector('.g-transcript__speaker')
    btn.click()
    await flush()
    expect(items().map((i) => [i.getAttribute('role'), i.textContent.trim(), i.getAttribute('aria-checked')])).toEqual([
      ['menuitemradio', 'Profesional (A)', 'false'], ['menuitemradio', 'Hablante B', 'true'], ['menuitem', 'Nuevo hablante', null]
    ])
    items()[0].click()
    await flush()
    expect(tx.segment('s2').speaker).toBe('spk_0')
    expect(row('s2').classList.contains('is-speaker-changed')).toBe(true)
    expect(row('s2').querySelector('.g-transcript__flag--speaker').textContent).toBe('Hablante cambiado (motor: Hablante B)')
    expect(document.activeElement).toBe(row('s2').querySelector('.g-transcript__speaker'))
    await tick(400)
    expect(own().textContent).toBe('Fragmento de las 00:03: Profesional (A).')
    row('s2').querySelector('.g-transcript__speaker').click()
    await flush()
    expect(items().at(-1).textContent.trim()).toBe('Volver al del motor (Hablante B)')
  })

  it('«Mostrar cambios» (aria-pressed) muestra original y cambios de todas las filas cambiadas y lo anuncia', async () => {
    const tx = sample(3)
    tx.edit('s1', 'Hola.')
    setup({ transcript: tx })
    await flush()
    const b = [...root().querySelectorAll('.g-transcript__bar .g-btn')].find((x) => x.textContent.includes('Mostrar cambios'))
    expect(b.getAttribute('aria-pressed')).toBe('false')
    b.click()
    await flush()
    expect(b.getAttribute('aria-pressed')).toBe('true')
    expect(root().querySelectorAll('.g-transcript__orig')).toHaveLength(1)
    await tick(400)
    expect(own().textContent).toBe('Cambios visibles.')
  })

  it('gestor de hablantes: disclosure, rol con GSelect, unir y separar, añadir; marcado de §23.5', async () => {
    const tx = sample(4)
    setup({ transcript: tx })
    await flush()
    const b = [...root().querySelectorAll('.g-transcript__bar .g-btn')].find((x) => x.textContent.trim() === 'Hablantes')
    const sec = root().querySelector('.g-transcript__speakers')
    expect(b.getAttribute('aria-controls')).toBe(sec.id)
    expect(b.getAttribute('aria-expanded')).toBe('false')
    expect(sec.hidden).toBe(true)
    b.click()
    await flush()
    expect(sec.hidden).toBe(false)
    expect(sec.children[0].localName).toBe('h3')
    expect(sec.children[1].localName).toBe('p')
    const li = [...sec.querySelectorAll('li.g-transcript__speaker-row')]
    expect(li).toHaveLength(2)
    expect(li[0].querySelector('span.g-transcript__speaker').textContent).toBe('AHablante A')
    expect(li[0].querySelector(':scope > span:not([class])').textContent).toBe('2 fragmentos')
    const merge = [...li[1].querySelectorAll('.g-btn')].find((x) => x.textContent.includes('Unir'))
    merge.click()
    await flush()
    expect(tx.resolve('spk_1')).toBe('spk_0')
    const merged = [...sec.querySelectorAll('li.g-transcript__speaker-row')].find((x) => x.textContent.includes('Unido a'))
    expect(merged.querySelector(':scope > span:not([class])').textContent).toBe('Unido a Hablante A')
    ;[...merged.querySelectorAll('.g-btn')].find((x) => x.textContent.includes('Separar')).click()
    await flush()
    expect(tx.resolve('spk_1')).toBe('spk_1')
    ;[...sec.querySelectorAll(':scope > div .g-btn')][0].click()
    await flush()
    expect(tx.speakers.at(-1).origin).toBe('user')
    await tick(400)
    expect(own().textContent).toBe('Hablante C añadido.')
  })
})

describe('GTranscript · destinos (§24)', () => {
  function formTargets() {
    const model = reactive({ motivo: 'Cefalea.', plan: '' })
    const targets = [
      { id: 'motivo', label: 'Motivo', get: () => model.motivo, set: (v) => { model.motivo = v }, field: 'f-motivo' },
      { id: 'plan', label: 'Plan', get: () => model.plan, set: (v) => { model.plan = v } }
    ]
    return { model, targets }
  }

  it('inserción en un campo desmontado por el modelo, vista previa, «Usado en», deshacer y «Cambió después de insertarlo»', async () => {
    const tx = sample(3)
    const { model, targets } = formTargets()
    const w = setup({ transcript: tx, targets })
    await flush()
    const ins = root().querySelector('.g-transcript__insert')
    const kids = [...ins.children].map((c) => c.localName + (c.className ? `.${String(c.className).split(' ')[0]}` : ''))
    expect(kids.slice(0, 7)).toEqual(['h3', 'div.g-select', 'div.g-select', 'div.g-select', 'div.g-checkbox', 'p', 'div.g-transcript__preview'])
    // «Con hablantes» con field: false (#262): sin región de mensaje
    expect(ins.querySelector(':scope > .g-checkbox .g-checkbox__message')).toBeNull()
    const pv = ins.querySelector('.g-transcript__preview')
    expect(pv.getAttribute('tabindex')).toBe('0')
    expect(pv.getAttribute('role')).toBe('region')
    expect(document.getElementById(pv.getAttribute('aria-labelledby')).textContent).toBe('Vista previa')
    expect(pv.textContent).toBe('Hablante A: Buenos días, cuénteme.\nHablante B: Me duele la cabeza por la tarde. Y a veces me mareo.')
    const go = [...ins.querySelectorAll('.g-btn')].find((b) => b.textContent.includes('Insertar en'))
    expect(go.textContent.trim()).toBe('Insertar en Motivo')
    go.focus()
    go.click()
    await flush()
    expect(model.motivo).toBe('Cefalea.\nHablante A: Buenos días, cuénteme.\nHablante B: Me duele la cabeza por la tarde. Y a veces me mareo.')
    expect(document.activeElement).toBe(go) // el foco se queda en «Insertar»
    expect(tx.derived).toHaveLength(1)
    expect(row('s1').querySelector('.g-transcript__flag--used').textContent).toBe('Usado en Motivo')
    expect(w.findComponent(GTranscript).emitted('insert')[0][0]).toMatchObject({ kind: 'insert', target: { id: 'motivo', label: 'Motivo' } })
    await tick(400)
    expect(own().textContent).toBe('Insertado en Motivo: 3 fragmentos. Puedes deshacerlo.')
    tx.edit('s1', 'Buenos días.')
    await flush()
    expect(row('s1').classList.contains('is-stale')).toBe(true)
    expect(row('s1').querySelector('.g-transcript__flag--stale').textContent).toBe('Cambió después de insertarlo')
    const undo = ins.querySelector('.g-transcript__result .g-btn')
    expect(undo.textContent.trim()).toBe('Deshacer inserción')
    // #263: todo undo-2 de la vista lleva flip-rtl, también «Deshacer inserción» (resultado y usos)
    const undoIcons = [...ins.querySelectorAll('.g-btn')].filter((b) => b.textContent.includes('Deshacer inserción')).map((b) => b.querySelector('svg'))
    expect(undoIcons.length).toBeGreaterThan(0)
    expect(undoIcons.every((svg) => svg.classList.contains('g-icon--flip-rtl'))).toBe(true)
    undo.click()
    await flush()
    expect(model.motivo).toBe('Cefalea.')
    expect(tx.derived).toHaveLength(0)
    expect(row('s1').querySelector('.g-transcript__flag--used')).toBeNull()
    expect(w.findComponent(GTranscript).emitted('undo-insert')).toHaveLength(1)
  })

  it('deshacer cuando el campo cambió: no toca nada y anuncia; menú de fila «Insertar en …» al final', async () => {
    const tx = sample(2)
    const { model, targets } = formTargets()
    setup({ transcript: tx, targets })
    await flush()
    row('s2').querySelector('.g-transcript__actions').click()
    await flush()
    const ins = items().find((i) => i.textContent.trim() === 'Insertar en Plan')
    ins.click()
    await flush()
    expect(model.plan).toBe('Hablante B: Me duele la cabeza por la tarde.')
    model.plan += ' Y algo más.'
    await flush()
    root().querySelector('.g-transcript__result .g-btn').click()
    await tick(400)
    expect(model.plan).toBe('Hablante B: Me duele la cabeza por la tarde. Y algo más.')
    expect(own().textContent).toBe('No se puede deshacer: Plan cambió después de la inserción.')
  })
})

describe('GTranscript · copia (§22.8)', () => {
  it('Ctrl+C sin texto seleccionado copia la selección (o la fila); «Copiar con hablantes y horas»; copy:false no intercepta', async () => {
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const tx = sample(3)
    const w = setup({ transcript: tx, selected: ['s2', 's3'] })
    await flush()
    tabStops()[0].focus()
    await press('c', { ctrlKey: true })
    await flush()
    expect(writeText).toHaveBeenLastCalledWith('Me duele la cabeza por la tarde. Y a veces me mareo.')
    expect(w.findComponent(GTranscript).emitted('copy')[0][0]).toEqual({ count: 2, withSpeakers: false, withTimes: false })
    const copyBtn = [...root().querySelectorAll('.g-transcript__bar .g-btn')].find((b) => b.textContent.trim() === 'Copiar')
    copyBtn.click()
    await flush()
    const full = [...document.querySelectorAll('[role="menuitem"]')].find((i) => i.textContent.includes('Copiar con hablantes y horas'))
    full.click()
    await flush()
    expect(writeText).toHaveBeenLastCalledWith('[00:03] Hablante B: Me duele la cabeza por la tarde. Y a veces me mareo.')
    await tick(400)
    expect(own().textContent).toBe('Copiado: 2 fragmentos.')
    delete navigator.clipboard
  })

  it('copy:false: sin acciones de copiar ni Ctrl+C', async () => {
    setup({ transcript: sample(2), copy: false })
    await flush()
    expect([...root().querySelectorAll('.g-transcript__bar .g-btn')].some((b) => b.textContent.trim() === 'Copiar')).toBe(false)
    tabStops()[0].focus()
    const e = await press('c', { ctrlKey: true })
    expect(e.defaultPrevented).toBe(false)
  })
})

describe('GTranscript · modos (§22.3)', () => {
  it('solo selección: rejilla con selección y sin edición, eliminar, gestor ni deshacer', async () => {
    const tx = sample(3)
    setup({ transcript: tx, editable: false })
    await flush()
    expect(root().dataset.mode).toBe('select')
    expect(grid().getAttribute('aria-multiselectable')).toBe('true')
    expect(row('s1').querySelector('.g-btn.g-transcript__speaker')).toBeNull()
    expect(row('s1').querySelector('span.g-transcript__speaker')).not.toBeNull()
    expect([...root().querySelectorAll('.g-transcript__bar .g-btn')].map((b) => b.textContent.trim())).toEqual(['Copiar', 'Mostrar cambios'])
    tabStops()[0].focus()
    await press('Enter')
    await press('Delete')
    expect(document.activeElement.localName).not.toBe('textarea')
    expect(tx.segment('s1').removed).toBe(false)
  })

  it('solo lectura: lista <ol> desplazable con tabindex 0, hora, hablante, texto corregido y marcas; sin barra ni rejilla', async () => {
    const tx = sample(3)
    tx.edit('s1', 'Hola.')
    setup({ transcript: tx, editable: false, selectable: false, maxHeight: '200px' })
    await flush()
    expect(root().dataset.mode).toBe('read')
    expect(grid()).toBeNull()
    const list = root().querySelector('ol.g-transcript__list')
    expect(list.getAttribute('tabindex')).toBe('0')
    expect(list.getAttribute('aria-labelledby')).toBe('title')
    expect(list.parentElement.style.getPropertyValue('--_max-height')).toBe('200px')
    const li = list.querySelectorAll('li.g-transcript__item')
    expect(li).toHaveLength(3)
    expect(li[0].querySelector('time.g-transcript__time').textContent).toBe('00:00')
    expect(li[0].querySelector('.g-transcript__text').textContent).toBe('Hola.')
    expect(li[0].querySelector('.g-transcript__flag--corrected')).not.toBeNull()
    expect(root().querySelector('.g-transcript__bar')).toBeNull()
  })

  it('compacto: sin columna de selección, inserción ni gestor; ayuda de teclado oculta (sigue describiendo)', async () => {
    setup({ transcript: sample(2), compact: true, targets: [{ id: 'a', label: 'A', get: () => '', set: () => {} }] })
    await flush()
    expect(root().hasAttribute('data-compact')).toBe(true)
    expect(root().querySelector('.g-transcript__cell--select')).toBeNull()
    expect(root().querySelector('.g-transcript__insert')).toBeNull()
    expect(root().querySelector('.g-transcript__speakers')).toBeNull()
    const kbd = root().querySelector('.g-transcript__kbd')
    expect(kbd.hidden).toBe(true)
    expect(grid().getAttribute('aria-describedby')).toBe(kbd.id)
    expect(grid().hasAttribute('aria-multiselectable')).toBe(false)
  })

  it('sin diarización en conversación: aviso visible (no región viva)', async () => {
    setup({ transcript: sample(2), diarization: false })
    await flush()
    const note = root().querySelector('.g-transcript__note')
    expect(note.textContent).toBe('El motor no distingue hablantes. Marca fragmentos y usa «Asignar hablante».')
    expect(note.hasAttribute('aria-live')).toBe(false)
  })

  it('dentro de un GForm no es un campo y data-narrow se mide bajo space × 160 fuera del callback del ResizeObserver', async () => {
    document.documentElement.style.setProperty('--g-space-1', '4px')
    const callbacks = []
    globalThis.ResizeObserver = class { constructor(cb) { callbacks.push(cb) } observe() {} disconnect() {} }
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () { return { width: this.classList.contains('g-transcript') ? 600 : 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 } })
    setup({ transcript: sample(2) })
    await flush()
    expect(root().hasAttribute('data-narrow')).toBe(true)
    expect(root().querySelector('.g-transcript__more')).not.toBeNull()
    rect.mockImplementation(function () { return { width: 900, height: 0, top: 0, left: 0, right: 0, bottom: 0 } })
    callbacks[0]([])
    await flush()
    expect(root().hasAttribute('data-narrow')).toBe(true) // aún no: se mide en el siguiente fotograma
    await tick(20)
    expect(root().hasAttribute('data-narrow')).toBe(false)
    delete globalThis.ResizeObserver
    document.documentElement.style.removeProperty('--g-space-1')
  })
})

describe('GTranscript · dentro de una sesión (§22.12, §25)', () => {
  let env
  beforeEach(() => { env = installSpeechEnv() })
  afterEach(() => env.restore())

  async function session(options = {}, { page = true, form } = {}) {
    const adapter = createSimulatedSpeechAdapter({ latency: 200, script: { conversation: [{ speaker: 'A', text: 'Uno.' }, { speaker: 'B', text: 'Dos.' }] } })
    const speech = createSpeech({ adapter, labels: LABELS, roles: ROLES, ...options })
    const Page = defineComponent({
      setup() {
        if (form) useSpeechTarget(form)
        return () => h('section', [h('h2', { id: 'rv-title' }, 'Revisión'), h(GTranscript, { transcript: speech.state.transcript, labelledby: 'rv-title' })])
      }
    })
    const show = ref(page)
    const App = defineComponent({ setup() { return () => h('div', [h('button', { id: 'before' }, 'Antes'), show.value && speech.state.transcript ? h(Page) : null, h(GSpeechHost)]) } })
    const w = mount(App, { attachTo: document.body, global: { plugins: [speech] } })
    wrappers.push({ unmount: async () => { if (speech.state.status !== 'idle' && speech.state.status !== 'processing') await speech.discard(); w.unmount() } })
    await flush()
    await speech.start({ mode: 'conversation' })
    await flush()
    adapter.emit('final', { id: 's1', text: 'Hola.', speaker: 'A', t0: 0, t1: 1000 })
    adapter.emit('final', { id: 's2', text: 'Qué tal.', speaker: 'B', t0: 1000, t1: 2000 })
    await flush()
    return { speech, adapter, w, show }
  }
  const hostLive = () => document.querySelector('.g-speech-host__live[role="status"]')

  it('usa los canales del anfitrión: sin región propia; el anuncio sale por el canal cortés', async () => {
    const { speech } = await session()
    const page = document.querySelector('section .g-transcript')
    expect(page.querySelector('.g-transcript__live')).toBeNull()
    page.querySelector('[role="grid"] [tabindex="0"]').focus()
    await press('Delete')
    await tick(1500)
    expect(hostLive().textContent).toBe('Fragmento de las 00:00 eliminado. Puedes restaurarlo.')
    expect(speech.state.transcript.segment('s1').removed).toBe(true)
  })

  it('«Revisar» con superficie registrada: cierra el panel y lleva el foco al título (tabindex -1)', async () => {
    const { speech } = await session()
    await speech.openPanel()
    await flush()
    const btn = [...document.querySelectorAll('.g-speech-panel__controls .g-btn')].find((b) => b.textContent.trim() === 'Revisar')
    expect(btn.querySelector('svg')).not.toBeNull()
    btn.click()
    await flush()
    expect(speech.state.panelOpen).toBe(false)
    expect(document.activeElement.id).toBe('rv-title')
    expect(document.activeElement.getAttribute('tabindex')).toBe('-1')
  })

  it('sin superficie: GDialog real de respaldo (g-speech-review, lg, pantalla completa en móvil) con foco al título; canales trasladados; Esc en el editor no lo cierra; al cerrar vuelve', async () => {
    const { speech } = await session({}, { page: false })
    await speech.openPanel()
    await flush()
    await speech.review()
    await flush()
    await flush()
    const dlg = document.querySelector('dialog.g-speech-review')
    expect(dlg).not.toBeNull()
    expect(dlg.classList.contains('g-dialog--size-lg')).toBe(true)
    expect(dlg.classList.contains('g-dialog--mobile-fullscreen')).toBe(true)
    expect(dlg.hasAttribute('open')).toBe(true)
    expect(document.activeElement.classList.contains('g-dialog__title')).toBe(true)
    expect(document.activeElement.textContent).toBe('Revisar transcripción')
    expect(dlg.contains(hostLive())).toBe(true)
    const gt = dlg.querySelector('.g-transcript')
    expect(gt.querySelector('[role="grid"]').getAttribute('aria-labelledby')).toBe(document.activeElement.id)
    gt.querySelector('[role="grid"] [tabindex="0"]').focus()
    await press('Enter')
    expect(document.activeElement.localName).toBe('textarea')
    const e = await press('Escape')
    expect(e.defaultPrevented).toBe(true)
    expect(dlg.hasAttribute('open')).toBe(true)
    // Esc en la rejilla sí cierra (dismiss de GDialog)
    await tick(10) // con Date simulado, Vue ignora un evento con la misma marca de tiempo en que se montó su escucha
    const e2 = await press('Escape')
    expect(e2.defaultPrevented).toBe(true)
    await tick(50)
    expect(speech.state.status).not.toBe('idle')
    expect(dlg.hasAttribute('open')).toBe(false)
    expect(dlg.querySelector('.g-transcript')).toBeNull()
    expect(dlg.contains(hostLive())).toBe(false)
    expect(document.activeElement.classList.contains('g-speech-pill__main')).toBe(true) // sin «Revisar» a la vista: a la pill visible
  })

  it('destinos del gestor con useSpeechTarget (registra y da de baja con el componente); descarte con usos; onComplete con las tres capas', async () => {
    const model = reactive({ plan: '' })
    const onComplete = vi.fn()
    const { speech, show } = await session({ onComplete }, { form: { id: 'plan', label: 'Plan', get: () => model.plan, set: (v) => { model.plan = v } } })
    expect(speech.targets.list.map((t) => t.id)).toEqual(['plan'])
    const page = document.querySelector('section .g-transcript')
    ;[...page.querySelectorAll('.g-transcript__insert .g-btn')].find((b) => b.textContent.includes('Insertar en Plan')).click()
    await flush()
    expect(model.plan).toBe('Hablante A: Hola.\nHablante B: Qué tal.')
    await speech.openPanel()
    await flush()
    ;[...document.querySelectorAll('.g-speech-panel__controls .g-btn')].find((b) => b.textContent.trim() === 'Descartar').click()
    await flush()
    expect(document.querySelector('.g-speech-panel__confirm p').textContent).toBe('¿Descartar la grabación? El texto insertado en 1 campo se queda.')
    document.activeElement.click() // Cancelar
    await flush()
    show.value = false
    await flush()
    expect(speech.targets.list).toHaveLength(0)
    const fin = speech.finish()
    await tick(3000)
    await fin
    await speech.close()
    const json = onComplete.mock.calls[0][0]
    expect(json.derived).toHaveLength(1)
    expect(json.derived[0]).toMatchObject({ kind: 'insert', target: { id: 'plan', label: 'Plan' } })
    expect(json.speakers[0]).toEqual({ id: 'A', role: null, mergedInto: null, origin: 'engine' })
    expect(json.partial).toBeUndefined()
  })
})
