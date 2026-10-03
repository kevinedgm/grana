// @vitest-environment node
// SSR de la Fase 2 (speech.md §30): createTranscript y useSpeechTarget no tocan document, window ni navigator; GTranscript
// renderiza su estructura en el servidor sin leer el DOM (sin selección de texto, portapapeles ni observadores);
// useSpeechTarget registra solo en el cliente.
import { describe, it, expect, vi } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { F2_LABELS } from './transcriptTestEnv.js'

const LABELS = { speaker: 'Hablante {letter}', unassigned: 'Sin asignar', ...F2_LABELS, transcript: { title: 'Transcripción', empty: 'Vacío', partialFlag: 'provisional', partialPrefix: 'Texto provisional:', failed: 'No se pudo transcribir', ...F2_LABELS.transcript } }
const SAVED = {
  id: 'guardado', mode: 'conversation', createdAt: '2026-09-12T10:04:00.000Z', expectedSpeakers: 2,
  speakers: [{ id: 'spk_0', role: 'pro' }, { id: 'spk_1' }],
  segments: [
    { id: 's1', t0: 0, t1: 3200, literal: 'Buenos días.', engineSpeaker: 'spk_0' },
    { id: 's2', t0: 3600, t1: 8100, literal: 'Mejor, el dolor bajo.', engineSpeaker: 'spk_1', corrected: 'Mejor, el dolor bajó.' }
  ],
  derived: [{ id: 'd1', kind: 'insert', createdBy: 'user', at: '2026-09-12T10:20:00.000Z', target: { id: 'plan', label: 'Plan' }, position: 'end', sourceSegmentIds: ['s1'], text: 'Buenos días.', sources: { s1: 'Buenos días.' } }]
}

describe('captura de voz F2 · SSR (entorno node)', () => {
  it('no hay DOM; el modelo se crea, opera y compone sin tocarlo', async () => {
    expect(typeof document).toBe('undefined')
    const { createTranscript } = await import('./transcript.js')
    const tx = createTranscript(SAVED)
    expect(tx.edit('s1', 'Hola.')).toBe('edited')
    expect(tx.compose({ kind: 'all' }).text).toBe('Hola.\nMejor, el dolor bajó.')
    expect(tx.undo().kind).toBe('edit')
  })

  it('GTranscript (editable y solo lectura) se renderiza en el servidor con su marcado; useSpeechTarget no registra', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { createTranscript, GTranscript, createSpeech, useSpeechTarget } = await import('../../speech.js')
    const { createSimulatedSpeechAdapter } = await import('../../testing.js')
    const speech = createSpeech({ adapter: createSimulatedSpeechAdapter(), labels: LABELS, roles: [{ id: 'pro', label: 'Profesional' }] })
    const tx = createTranscript(SAVED)
    const Page = defineComponent({
      setup() {
        useSpeechTarget({ id: 'plan', label: 'Plan', get: () => '', set: () => {} })
        return () => h('div', [
          h('h2', { id: 't' }, 'Consulta'),
          h(GTranscript, { transcript: tx, labelledby: 't', id: 'gt-edit' }),
          h(GTranscript, { transcript: tx, labelledby: 't', editable: false, selectable: false, id: 'gt-read' })
        ])
      }
    })
    const html = await renderToString(createSSRApp(Page).use(speech))
    expect(html).toContain('class="g-transcript" data-mode="edit"')
    expect(html).toContain('role="grid"')
    expect(html).toContain('Profesional (A)')
    expect(html).toContain('g-transcript__flag--used')
    expect(html).toContain('class="g-transcript__list"')
    expect(html).toContain('class="g-transcript__live" role="status"')
    expect(speech.targets.list).toHaveLength(0)
    expect(warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes('[Vue warn]'))).toEqual([])
    warn.mockRestore()
  })
})
