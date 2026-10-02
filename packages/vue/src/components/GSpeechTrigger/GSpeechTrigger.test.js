// GSpeechTrigger en jsdom: dictado conmutable y conversación, sesión ocupada, sesión que sobrevive al desmontaje,
// dictado al cursor sin mover el foco (GTextarea real con v-model), campo desmontado, deshacer propio y tipos de campo.
// Contrato: design/contracts/speech.md §8 y §17 (Disparador, Dictado).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import GSpeechTrigger from './GSpeechTrigger.vue'
import GSpeechHost from '../GSpeechHost/GSpeechHost.vue'
import GTextarea from '../GTextarea/GTextarea.vue'
import { createSpeech } from '../GSpeechHost/speech.js'
import { createSimulatedSpeechAdapter } from '../GSpeechHost/simulatedAdapter.js'
import { installSpeechEnv, installTopLayer, LABELS } from '../GSpeechHost/speechTestEnv.js'

let env
let restoreTopLayer
let warn
const wrappers = []
beforeEach(() => {
  restoreTopLayer = installTopLayer()
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame'] })
  env = installSpeechEnv()
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(async () => {
  expect(warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes('[Vue warn]'))).toEqual([])
  while (wrappers.length) {
    const { w, speech } = wrappers.pop()
    if (speech.state.status !== 'idle' && speech.state.status !== 'processing') await speech.discard()
    w.unmount()
  }
  env.restore()
  restoreTopLayer()
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const flush = async () => { await nextTick(); await nextTick() }
const tick = async (ms) => { await vi.advanceTimersByTimeAsync(ms); await flush() }
const warned = (s) => warn.mock.calls.some((c) => String(c[0]).includes(s))

async function setup({ script = ['Primera frase.', 'Segunda frase.', 'Tercera frase.'], adapter: adapterOptions = {}, value = 'Inicio' } = {}) {
  const adapter = createSimulatedSpeechAdapter({ latency: 100, script: { dictation: script, conversation: [{ speaker: 'A', text: 'Hola.' }] }, ...adapterOptions })
  const speech = createSpeech({ adapter, labels: LABELS })
  const obs = ref(value)
  const plan = ref('')
  const showObs = ref(true)
  const tab = ref('a')
  const changes = []
  const App = defineComponent({
    setup() {
      return () => h('div', [
        h('button', { id: 'other' }, 'Otro'),
        tab.value === 'a' ? h('section', { id: 'tab-a' }, [
          showObs.value ? h(GTextarea, { id: 'obs', label: 'Observaciones', modelValue: obs.value, 'onUpdate:modelValue': (v) => { obs.value = v; changes.push(v) } }) : null,
          h(GSpeechTrigger, { for: 'obs' }),
          h(GSpeechTrigger, { mode: 'conversation', id: 'conv' })
        ]) : h('section', { id: 'tab-b' }, [h('p', 'Otra pestaña')]),
        h(GTextarea, { id: 'plan', label: 'Plan', modelValue: plan.value, 'onUpdate:modelValue': (v) => { plan.value = v } }),
        h(GSpeechTrigger, { for: 'plan', targetLabel: 'Plan de tratamiento' }),
        h(GSpeechHost)
      ])
    }
  })
  const w = mount(App, { attachTo: document.body, global: { plugins: [speech] } })
  wrappers.push({ w, speech })
  await flush()
  return { speech, adapter, obs, plan, showObs, tab, changes, w }
}
// El disparador va justo después de su campo (GTextarea)
const trig = (forId) => [...document.querySelectorAll('.g-speech-trigger--mode-dictation')].find((t) => {
  const prev = t.previousElementSibling
  return prev && (prev.id === forId || prev.querySelector(`#${forId}`))
})
const btnOf = (forId) => trig(forId).querySelector('.g-speech-trigger__btn')
const noteOf = (forId) => trig(forId).querySelector('.g-speech-trigger__note')
const convBtn = () => document.querySelector('.g-speech-trigger--mode-conversation .g-speech-trigger__btn')
// Dicta una frase: voz (provisional) y silencio (confirmado tras la latencia del simulado)
async function say() {
  env.level = 0.6
  await tick(900)
  env.level = 0.01
  await tick(1600)
}

describe('GSpeechTrigger · estructura y conmutación', () => {
  it('raíz <div> con la nota <p> (#229); dictado: botón de solo icono con nombre fijo y aria-pressed', async () => {
    await setup()
    const root = trig('obs')
    expect(root.localName).toBe('div')
    expect(root.classList.contains('g-speech-trigger--mode-dictation')).toBe(true)
    expect(root.dataset.status).toBe('idle')
    const b = btnOf('obs')
    expect(b.getAttribute('aria-label')).toBe('Dictar en Observaciones') // nombre visible del campo (labels[0])
    expect(b.getAttribute('aria-pressed')).toBe('false')
    expect(b.classList.contains('g-btn--icon')).toBe(true)
    expect(b.classList.contains('g-btn--variant-ghost')).toBe(true)
    const note = noteOf('obs')
    expect(note.localName).toBe('p')
    expect(note.hidden).toBe(true)
    expect(btnOf('plan').getAttribute('aria-label')).toBe('Dictar en Plan de tratamiento') // targetLabel gana
    expect(convBtn().textContent.trim()).toBe('Grabar conversación')
    expect(convBtn().getAttribute('aria-pressed')).toBeNull()
  })

  it('pulsar inicia el dictado; con la sesión en captura pulsar finaliza; el nombre no cambia', async () => {
    const { speech } = await setup()
    const b = btnOf('obs')
    b.click()
    await tick(10)
    expect(speech.state.status).toMatch(/listening|speech|transcribing/)
    expect(speech.state.target).toEqual({ id: 'obs', label: 'Observaciones' })
    expect(b.getAttribute('aria-pressed')).toBe('true')
    expect(b.getAttribute('aria-label')).toBe('Dictar en Observaciones')
    expect(trig('obs').dataset.status).toBe(speech.state.status)
    b.click()
    await flush()
    expect(speech.state.status).toMatch(/processing|completed/)
    await tick(1000)
    expect(speech.state.status).toBe('completed')
    expect(b.getAttribute('aria-pressed')).toBe('false')
  })

  it('conversación: prepare() → ready y abre el panel con el foco en su título; con su sesión, «Ver grabación»', async () => {
    const { speech } = await setup()
    convBtn().click()
    await flush()
    await flush()
    expect(speech.state.status).toBe('ready')
    expect(speech.state.panelOpen).toBe(true)
    expect(document.activeElement.classList.contains('g-speech-panel__title')).toBe(true)
    expect(convBtn().textContent.trim()).toBe('Ver grabación')
  })

  it('con otra sesión activa: aria-disabled, descripción, anuncio y foco a la pill visible, SIN sesión nueva', async () => {
    const { speech } = await setup()
    btnOf('obs').click()
    await tick(10)
    const id = speech.state.sessionId
    const other = btnOf('plan')
    expect(other.getAttribute('aria-disabled')).toBe('true')
    const busy = document.getElementById(other.getAttribute('aria-describedby'))
    expect(busy.classList.contains('g-speech-trigger__busy')).toBe(true)
    expect(busy.textContent).toBe('Hay una grabación en curso. Mayús+F8 para ir a ella.')
    expect(trig('plan').classList.contains('is-busy')).toBe(true)
    other.focus()
    other.click()
    await flush()
    expect(speech.state.sessionId).toBe(id)
    expect(speech.state.target.id).toBe('obs')
    expect(document.activeElement.classList.contains('g-speech-pill__main')).toBe(true)
    await tick(100)
    expect(document.querySelector('.g-speech-host__live[role="status"]').textContent).toContain('Ya hay una grabación en curso.')
    expect(convBtn().getAttribute('aria-disabled')).toBe('true')
  })

  it('el disparador se desmonta (otra pestaña) y la sesión sigue con la misma sessionId; al volver se reconoce', async () => {
    const { speech, tab } = await setup()
    btnOf('obs').click()
    await flush()
    const id = speech.state.sessionId
    tab.value = 'b'
    await flush()
    expect(document.getElementById('obs')).toBeNull()
    await tick(500)
    expect(speech.state.sessionId).toBe(id)
    expect(speech.state.status).toMatch(/listening|speech|transcribing/)
    tab.value = 'a'
    await flush()
    expect(btnOf('obs').getAttribute('aria-pressed')).toBe('true')
    expect(speech.state.sessionId).toBe(id)
  })

  it('tipos de campo no admitidos (password, email) y for inexistente: aviso y no inicia sesión', async () => {
    const adapter = createSimulatedSpeechAdapter()
    const speech = createSpeech({ adapter, labels: LABELS })
    const App = defineComponent({
      setup: () => () => h('div', [
        h('label', { for: 'pw' }, 'Clave'), h('input', { id: 'pw', type: 'password' }), h(GSpeechTrigger, { for: 'pw' }),
        h('input', { id: 'em', type: 'email' }), h(GSpeechTrigger, { for: 'em', targetLabel: 'Correo' }),
        h(GSpeechTrigger, { for: 'nada', targetLabel: 'Nada' }),
        h(GSpeechHost)
      ])
    })
    const w = mount(App, { attachTo: document.body, global: { plugins: [speech] } })
    wrappers.push({ w, speech })
    await flush()
    for (const b of document.querySelectorAll('.g-speech-trigger__btn')) { b.click(); await flush() }
    expect(speech.state.status).toBe('idle')
    expect(env.gum).toBe(0)
    expect(warned('tipo de campo no admitido')).toBe(true)
    expect(warned('no existe ningún elemento con ese id')).toBe(true)
  })

  it('dictado sin for: aviso', async () => {
    const speech = createSpeech({ adapter: createSimulatedSpeechAdapter(), labels: LABELS })
    const w = mount(GSpeechTrigger, { attachTo: document.body, global: { plugins: [speech] } })
    await flush()
    expect(warned('sin `for`')).toBe(true)
    w.unmount()
  })
})

describe('GSpeechTrigger · dictado al cursor (§8.3 a §8.6)', () => {
  it('solo el confirmado entra, en el cursor del inicio, con separador, sin mover el foco y actualizando v-model', async () => {
    const { speech, obs, changes } = await setup({ value: 'Inicio fin' })
    const ta = document.getElementById('obs')
    ta.setSelectionRange(6, 6) // tras «Inicio»
    btnOf('obs').focus()
    btnOf('obs').click()
    await flush()
    env.level = 0.6
    await tick(900)
    // el provisional NO toca el valor; se ve en la nota (no es región viva)
    expect(obs.value).toBe('Inicio fin')
    const note = noteOf('obs')
    expect(note.hidden).toBe(false)
    expect(note.classList.contains('is-partial')).toBe(true)
    expect(note.querySelector('.g-speech-trigger__sr').textContent).toBe('Texto provisional: ')
    expect(note.querySelector('.g-speech-trigger__note-text').textContent).toMatch(/^primera/)
    expect(note.getAttribute('aria-live')).toBeNull()
    env.level = 0.01
    await tick(1600)
    expect(obs.value).toBe('Inicio Primera frase. fin')
    expect(changes.at(-1)).toBe('Inicio Primera frase. fin')
    expect(document.activeElement).toBe(btnOf('obs')) // el foco sigue en el disparador
    await say()
    expect(obs.value).toBe('Inicio Primera frase. Segunda frase. fin')
    await tick(3000)
    expect(document.querySelector('.g-speech-host__live[role="status"]').textContent).toBe('Texto añadido a Observaciones.')
    expect(speech.state.status).toMatch(/listening|transcribing/)
  })

  it('una selección al empezar se sustituye con el primer texto; con el foco en el campo, se inserta en su cursor', async () => {
    const { obs } = await setup({ value: 'Hola XXX adiós' })
    const ta = document.getElementById('obs')
    ta.setSelectionRange(5, 8)
    btnOf('obs').click()
    await flush()
    await say()
    expect(obs.value).toBe('Hola Primera frase. adiós')
    ta.focus()
    ta.setSelectionRange(0, 0)
    await say()
    expect(obs.value).toBe('Segunda frase.Hola Primera frase. adiós')
  })

  it('el dictado se cierra solo al completarse si todo se insertó; la nota ofrece «Deshacer dictado», que revierte y lleva el foco al campo', async () => {
    const { speech, obs } = await setup({ value: 'Base' })
    btnOf('obs').click()
    await flush()
    await say()
    btnOf('obs').click() // finaliza
    await tick(500)
    expect(speech.state.status).toBe('completed')
    await tick(1600) // autoCloseMs
    expect(speech.state.status).toBe('idle')
    const note = noteOf('obs')
    expect(note.hidden).toBe(false)
    expect(note.querySelector('.g-speech-trigger__note-text').textContent).toBe('Dictado insertado.')
    const undo = note.querySelector('.g-speech-trigger__note-action')
    expect(undo.textContent.trim()).toBe('Deshacer dictado')
    undo.click()
    await flush()
    expect(obs.value).toBe('Base')
    expect(document.activeElement).toBe(document.getElementById('obs'))
    expect(note.hidden).toBe(true)
    await tick(1000)
    expect(document.querySelector('.g-speech-host__live[role="status"]').textContent).toBe('Inserción deshecha.')
  })

  it('el deshacer se invalida si el usuario edita el campo', async () => {
    const { obs } = await setup({ value: 'Base' })
    btnOf('obs').click()
    await flush()
    await say()
    btnOf('obs').click()
    await tick(2500)
    const ta = document.getElementById('obs')
    expect(noteOf('obs').hidden).toBe(false)
    ta.value = `${ta.value} editado`
    ta.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    expect(obs.value).toBe('Base Primera frase. editado')
    expect(noteOf('obs').hidden).toBe(true)
  })

  it('campo desmontado: no se inserta a ciegas, los siguientes esperan en orden y «Insertar» los pone al final', async () => {
    const { speech, obs, showObs } = await setup({ value: 'A' })
    btnOf('obs').click()
    await flush()
    showObs.value = false
    await flush()
    await say()
    await say()
    expect(obs.value).toBe('A')
    showObs.value = true
    await flush()
    const note = noteOf('obs')
    expect(note.querySelector('.g-speech-trigger__note-text').textContent).toBe('2 fragmentos sin insertar.')
    btnOf('obs').click() // finalizar: no se cierra solo con pendientes de insertar
    await tick(3000)
    expect(speech.state.status).toBe('completed')
    note.querySelector('.g-speech-trigger__note-action').click()
    await flush()
    expect(obs.value).toBe('A Primera frase. Segunda frase.')
    await tick(1600)
    expect(speech.state.status).toBe('idle')
  })
})
