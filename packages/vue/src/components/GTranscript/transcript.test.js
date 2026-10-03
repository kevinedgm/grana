// Modelo del transcript (speech.md §21, §26.4, §30; DECISIONS #242, #243, #245, #247) y destinos (§24, #248) en node/jsdom.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { isReactive, reactive, watch, nextTick, effectScope } from 'vue'
import { createTranscript, TRANSCRIPT_LIMITS, TX, diffWords, letterAt, formatTime } from './transcript.js'
import { createTargetStore } from './targets.js'

afterEach(() => vi.restoreAllMocks())
const quiet = () => vi.spyOn(console, 'warn').mockImplementation(() => {})

// Un transcript de conversación con dos hablantes del motor (como lo dejaría una sesión)
function sample() {
  const tx = createTranscript({ mode: 'conversation', expectedSpeakers: 2 })
  const e = tx[TX]
  e.final({ id: 's1', text: 'Buenos días, cuénteme.', speaker: 'spk_0', t0: 0, t1: 2000 })
  e.final({ id: 's2', text: 'Me duele la cabeza por la tarde.', speaker: 'spk_1', t0: 3000, t1: 6000 })
  e.final({ id: 's3', text: 'Y a veces me mareo.', speaker: 'spk_1', t0: 7000, t1: 9000 })
  e.final({ id: 's4', text: '¿Ha tomado algo?', speaker: 'spk_0', t0: 10000, t1: 12000 })
  return tx
}
const literals = (tx) => tx.segments.map((s) => [s.literal, s.engineSpeaker])
const name = (tx) => (id) => `Hablante ${tx.letter(id)}`

describe('createTranscript · forma y carga (§1.4, §21.1, §21.9)', () => {
  it('vacío: conversación, many, id y createdAt generados, sin historial; no toca el DOM', () => {
    const tx = createTranscript()
    expect(tx.mode).toBe('conversation')
    expect(tx.expectedSpeakers).toBe('many')
    expect(tx.id).toMatch(/\S/)
    expect(new Date(tx.createdAt).toString()).not.toBe('Invalid Date')
    expect(tx.segments).toEqual([])
    expect(tx.speakers).toEqual([])
    expect(tx.derived).toEqual([])
    expect(tx.partial).toBeNull()
    expect(tx.canUndo).toBe(false)
    expect(tx.nextUndo).toBeNull()
  })

  it('carga un JSON de la F1 sin conversión: los campos que faltan toman su valor inicial', () => {
    const f1 = {
      id: 'speech-x', mode: 'conversation', createdAt: '2026-09-01T10:00:00.000Z', expectedSpeakers: 2,
      speakers: [{ id: 'A' }, { id: 'B' }],
      segments: [
        { id: 's2', t0: 3000, t1: 4000, literal: 'Dos.', engineSpeaker: 'B', corrected: null, speaker: null, removed: false, failed: false },
        { id: 's1', t0: 0, t1: 1000, literal: 'Uno.', engineSpeaker: 'A', corrected: null, speaker: null, removed: false, failed: false }
      ],
      derived: []
    }
    const tx = createTranscript(f1)
    expect(tx.speakers).toEqual([{ id: 'A', role: null, mergedInto: null, origin: 'engine' }, { id: 'B', role: null, mergedInto: null, origin: 'engine' }])
    expect(tx.segments.map((s) => s.id)).toEqual(['s1', 's2']) // ordenados por t0
    expect(tx.canUndo).toBe(false)
    expect(tx.toJSON()).toEqual({ ...f1, speakers: tx.speakers.map((s) => ({ ...s })), segments: [f1.segments[1], f1.segments[0]] })
  })

  it('campos desconocidos, ids repetidos, hablantes ausentes y mergedInto roto: avisa y corrige; partial se ignora', () => {
    const warn = quiet()
    const tx = createTranscript({
      mode: 'conversation', propio: 1, partial: { id: 'p', text: 'x' },
      speakers: [{ id: 'A', mergedInto: 'Z' }, { id: 'B', mergedInto: 'C' }, { id: 'C', mergedInto: 'B' }],
      segments: [{ id: 's1', literal: 'a', engineSpeaker: 'D', extra: true }, { id: 's1', literal: 'b' }]
    })
    const msgs = warn.mock.calls.map((c) => c[0])
    expect(msgs.some((m) => m.includes('«propio»'))).toBe(true)
    expect(msgs.some((m) => m.includes('«extra»'))).toBe(true)
    expect(msgs.some((m) => m.includes('repetido «s1»'))).toBe(true)
    expect(msgs.every((m) => m.startsWith('[Grana Speech]'))).toBe(true)
    expect(tx.segments).toHaveLength(1)
    expect(tx.segments[0].literal).toBe('a')
    expect(tx.partial).toBeNull()
    expect(tx.speakers.find((s) => s.id === 'D')).toEqual({ id: 'D', role: null, mergedInto: null, origin: 'engine' })
    expect(tx.speakers.find((s) => s.id === 'A').mergedInto).toBeNull()
    expect(tx.speakers.filter((s) => s.mergedInto === null).map((s) => s.id)).toContain('B')
  })

  it('se lee reactivamente; escribir directamente no está soportado (en desarrollo avisa y no cambia)', async () => {
    const warn = quiet()
    const tx = sample()
    const seen = []
    const scope = effectScope()
    scope.run(() => watch(() => tx.segment('s2').corrected, (v) => seen.push(v)))
    tx.edit('s2', 'Me duele la cabeza por las tardes.')
    await nextTick()
    expect(seen).toEqual(['Me duele la cabeza por las tardes.'])
    tx.segments = []
    tx.segment('s1').literal = 'otro'
    expect(tx.segments).toHaveLength(4)
    expect(tx.segment('s1').literal).toBe('Buenos días, cuénteme.')
    expect(warn.mock.calls.some((c) => String(c[0]).includes('escribir «segments» directamente'))).toBe(true)
    scope.stop()
  })

  it('guardarla en un estado reactivo no la vuelve reactiva (la instancia es la misma)', () => {
    const tx = createTranscript()
    const state = reactive({ tx })
    expect(state.tx).toBe(tx)
    expect(isReactive(state.tx)).toBe(false)
  })
})

describe('capas (§21.2): el literal del motor es intocable para el usuario', () => {
  it('tras editar, eliminar, reasignar, unir, volver al original y deshacer, el literal sigue igual', () => {
    const tx = sample()
    const before = literals(tx)
    expect(tx.edit('s2', '  Me   duele la cabeza\npor las tardes. ')).toBe('edited')
    expect(tx.segment('s2').corrected).toBe('Me duele la cabeza por las tardes.')
    expect(tx.remove(['s3'])).toBe(true)
    expect(tx.assignSpeaker(['s4'], 'spk_1')).toBe(true)
    expect(tx.mergeSpeakers('spk_1', 'spk_0')).toBe(true)
    expect(tx.revert('s2')).toBe(true)
    while (tx.canUndo) tx.undo()
    expect(literals(tx)).toEqual(before)
    expect(tx.segments.every((s) => s.corrected === null && s.speaker === null && !s.removed)).toBe(true)
  })

  it('igual al literal → corrected null; vacío → eliminado (emptied) con corrected intacto; sin cambios → false sin entrada', () => {
    const tx = sample()
    expect(tx.edit('s1', 'Hola.')).toBe('edited')
    expect(tx.edit('s1', 'Buenos   días, cuénteme.')).toBe('edited')
    expect(tx.segment('s1').corrected).toBeNull()
    expect(tx.edit('s1', 'Buenos días, cuénteme.')).toBe(false)
    tx.edit('s2', 'Corregido.')
    expect(tx.edit('s2', '   ')).toBe('emptied')
    expect(tx.segment('s2').removed).toBe(true)
    expect(tx.segment('s2').corrected).toBe('Corregido.')
    expect(tx.nextUndo.kind).toBe('remove')
    expect(tx.edit('s2', 'otra')).toBe(false) // un eliminado no se edita (primero restore)
  })

  it('operaciones imposibles: nunca lanzan, devuelven false sin entrada y avisan', () => {
    const warn = quiet()
    const tx = sample()
    tx[TX].failed({ id: 'f1', t0: 13000, t1: 14000 })
    expect(tx.edit('nada', 'x')).toBe(false)
    expect(tx.edit('f1', 'x')).toBe(false)
    expect(tx.revert('nada')).toBe(false)
    expect(tx.remove(['s1', 'nada'])).toBe(false)
    expect(tx.remove(['f1'])).toBe(false)
    expect(tx.assignSpeaker(['s1'], 'zzz')).toBe(false)
    expect(tx.setRole('zzz', 'pro')).toBe(false)
    expect(tx.mergeSpeakers('spk_0', 'spk_0')).toBe(false)
    expect(tx.unmerge('spk_0')).toBe(false)
    expect(tx.canUndo).toBe(false)
    expect(warn).toHaveBeenCalled()
  })

  it('hablante efectivo, «sin cambio» al reasignar al del motor y relabel solo en la capa literal (§21.8)', () => {
    const tx = sample()
    expect(tx.assignSpeaker(['s3'], 'spk_1')).toBe(false) // ya es el del motor
    expect(tx.assignSpeaker(['s3'], 'spk_0')).toBe(true)
    expect(tx.segment('s3').speaker).toBe('spk_0')
    // El motor revisa su diarización: spk_1 → spk_0. No toca speaker del usuario ni el historial
    const entries = tx.canUndo
    tx[TX].relabel({ spk_1: 'spk_0' })
    expect(tx.segment('s2').engineSpeaker).toBe('spk_0')
    expect(tx.segment('s3').speaker).toBe('spk_0')
    expect(tx.speakerOf('s3')).toBe(tx.resolve(tx.segment('s3').engineSpeaker)) // la marca «hablante cambiado» desaparece al mostrar
    expect(tx.canUndo).toBe(entries)
    tx.undo()
    expect(tx.segment('s3').speaker).toBeNull()
    expect(tx.segment('s2').engineSpeaker).toBe('spk_0') // deshacer no toca la capa literal
  })

  it('relabel con un hablante del usuario se ignora con aviso', () => {
    const warn = quiet()
    const tx = sample()
    const u = tx.addSpeaker()
    tx[TX].relabel({ spk_0: u })
    expect(tx.segment('s1').engineSpeaker).toBe('spk_0')
    expect(warn.mock.calls.some((c) => String(c[0]).includes('relabel'))).toBe(true)
  })
})

describe('hablantes y roles (§21.4, §23)', () => {
  it('ids user-N únicos, letras por posición estables (A…Z, AA…), visibles y nuevos hablantes deshacibles en una entrada', () => {
    const tx = sample()
    expect(tx.letter('spk_0')).toBe('A')
    expect(tx.letter('spk_1')).toBe('B')
    const u = tx.assignNewSpeaker(['s3', 's4'])
    expect(u).toBe('user-1')
    expect(tx.letter(u)).toBe('C')
    expect(tx.speakers.find((s) => s.id === u).origin).toBe('user')
    expect(tx.addSpeaker()).toBe('user-2')
    tx.undo()
    tx.undo()
    expect(tx.speakers.map((s) => s.id)).toEqual(['spk_0', 'spk_1'])
    expect(tx.segment('s3').speaker).toBeNull()
    tx.redo()
    expect(tx.speakers.map((s) => s.id)).toEqual(['spk_0', 'spk_1', 'user-1'])
    expect(tx.letter('user-1')).toBe('C')
    expect(letterAt(0)).toBe('A')
    expect(letterAt(25)).toBe('Z')
    expect(letterAt(26)).toBe('AA')
    expect(letterAt(27)).toBe('AB')
    const loaded = createTranscript({ speakers: [{ id: 'user-3', origin: 'user' }] })
    expect(loaded.addSpeaker()).toBe('user-4')
  })

  it('unir y separar: el unido se resuelve al destino; ciclo → false; unir no cambia engineSpeaker; deshacer lo revierte', () => {
    const warn = quiet()
    const tx = sample()
    expect(tx.setRole('spk_0', 'pro')).toBe(true)
    expect(tx.speakers.find((s) => s.id === 'spk_0').role).toBe('pro')
    expect(tx.mergeSpeakers('spk_1', 'spk_0')).toBe(true)
    expect(tx.resolve('spk_1')).toBe('spk_0')
    expect(tx.speakerOf('s2')).toBe('spk_0')
    expect(tx.segment('s2').engineSpeaker).toBe('spk_1')
    expect(tx.visibleSpeakers().map((s) => s.id)).toEqual(['spk_0'])
    expect(tx.mergeSpeakers('spk_0', 'spk_1')).toBe(false) // ciclo
    expect(warn).toHaveBeenCalled()
    expect(tx.unmerge('spk_1')).toBe(true)
    expect(tx.speakerOf('s2')).toBe('spk_1')
    tx.undo() // unmerge
    tx.undo() // merge
    expect(tx.resolve('spk_1')).toBe('spk_1')
    expect(tx.speakers.find((s) => s.id === 'spk_0').role).toBe('pro')
  })

  it('las reasignaciones del usuario hacia el unido se redirigen al destino', () => {
    const tx = sample()
    tx.assignSpeaker(['s1'], 'spk_1')
    tx.mergeSpeakers('spk_1', 'spk_0')
    // s1 era del motor spk_0: la reasignación redirigida coincide con el motor y deja de ser un cambio
    expect(tx.segment('s1').speaker).toBeNull()
  })
})

describe('historial (§21.5)', () => {
  it('compartido por todos los lectores de la instancia, límite de 200 entradas, rehacer se vacía con una operación nueva', () => {
    const tx = sample()
    for (let i = 0; i < TRANSCRIPT_LIMITS.history + 5; i++) tx.edit('s1', `Versión ${i}.`)
    let n = 0
    while (tx.undo()) n++
    expect(n).toBe(200)
    expect(tx.segment('s1').corrected).toBe('Versión 4.')
    expect(tx.canRedo).toBe(true)
    tx.edit('s2', 'Nueva.')
    expect(tx.canRedo).toBe(false)
  })

  it('deshacer conserva lo que llegó del motor después; nextUndo describe la entrada sin texto', () => {
    const tx = sample()
    tx.edit('s2', 'Corrección.')
    expect(tx.nextUndo).toEqual({ kind: 'edit', ids: ['s2'], t0: 3000 })
    tx[TX].final({ id: 's5', text: 'Después.', speaker: 'spk_2', t0: 13000, t1: 14000 })
    const back = tx.undo()
    expect(back).toEqual({ kind: 'edit', ids: ['s2'], t0: 3000 })
    expect(tx.segment('s5').literal).toBe('Después.')
    expect(tx.speakers.map((s) => s.id)).toContain('spk_2')
    expect(tx.nextRedo.kind).toBe('edit')
    expect(tx.redo().ids).toEqual(['s2'])
  })

  it('una operación sobre varios fragmentos es una entrada; restaurar; ignora fallidos', () => {
    const tx = sample()
    tx[TX].failed({ id: 'f1', t0: 15000, t1: 16000 })
    expect(tx.remove(['s1', 's2', 'f1'])).toBe(true)
    expect(tx.segment('f1').removed).toBe(false)
    expect(tx.nextUndo.ids).toEqual(['s1', 's2'])
    expect(tx.restore(['s1', 's2'])).toBe(true)
    tx.undo()
    expect(tx.segment('s1').removed).toBe(true)
    tx.undo()
    expect(tx.segment('s1').removed).toBe(false)
  })

  it('toJSON sin historial ni provisional; recargado, el historial empieza vacío', () => {
    const tx = sample()
    tx.edit('s1', 'Hola.')
    tx[TX].partial({ id: 'p', text: 'algo', speaker: 'spk_0' })
    const json = tx.toJSON()
    expect(json.partial).toBeUndefined()
    expect(Object.keys(json)).toEqual(['id', 'mode', 'createdAt', 'expectedSpeakers', 'speakers', 'segments', 'derived'])
    const again = createTranscript(JSON.parse(JSON.stringify(json)))
    expect(again.canUndo).toBe(false)
    expect(again.segment('s1').corrected).toBe('Hola.')
  })
})

describe('observación (§21.10): onChange sin texto', () => {
  it('source user/engine/app, una llamada por cambio, nunca el provisional, sin texto transcrito', () => {
    const tx = sample()
    const calls = []
    const off = tx.onChange((c) => calls.push(c))
    tx[TX].partial({ id: 'p1', text: 'secreto provisional' })
    tx[TX].final({ id: 'p1', text: 'Secreto confirmado.', t0: 20000, t1: 21000 })
    tx.edit('s1', 'Texto secreto corregido.')
    tx.undo()
    tx.addDerived({ kind: 'nota', valor: 1 })
    expect(calls).toEqual([
      { source: 'engine', kind: 'final', ids: ['p1'] },
      { source: 'user', kind: 'edit', ids: ['s1'] },
      { source: 'user', kind: 'undo', ids: ['s1'] },
      { source: 'app', kind: 'addDerived', ids: [] }
    ])
    expect(JSON.stringify(calls)).not.toMatch(/secreto/i)
    off()
    tx.edit('s1', 'Más.')
    expect(calls).toHaveLength(4)
  })
})

describe('capa derivada (§21.6)', () => {
  it('addDerived rechaza insert y sin kind; completa id, at y createdBy; removeDerived no quita un insert', () => {
    const warn = quiet()
    const tx = sample()
    expect(tx.addDerived({ kind: 'insert' })).toBe(false)
    expect(tx.addDerived({})).toBe(false)
    const d = tx.addDerived({ kind: 'resumen', texto: 'x' })
    expect(d.id).toMatch(/\S/)
    expect(d.createdBy).toBe('app')
    expect(new Date(d.at).toString()).not.toBe('Invalid Date')
    const use = tx[TX].recordUse({ target: { id: 'plan', label: 'Plan' }, position: 'end', sourceSegmentIds: ['s1'], text: 'x', sources: { s1: 'x' } })
    expect(tx.usesOf('s1').map((u) => u.id)).toEqual([use.id])
    expect(tx.removeDerived(use.id)).toBe(false)
    expect(tx.removeDerived(d.id)).toBe(true)
    expect(warn).toHaveBeenCalled()
  })
})

describe('composición (§21.7)', () => {
  it('corregido, sin eliminados ni fallidos; turnos por hablante; horas y nombres; una línea; cita tal cual', () => {
    const tx = sample()
    tx.edit('s3', 'Y a veces me mareo al levantarme.')
    tx[TX].failed({ id: 'f1', t0: 9500, t1: 9900 })
    expect(tx.compose({ kind: 'all' }).text).toBe('Buenos días, cuénteme.\nMe duele la cabeza por la tarde. Y a veces me mareo al levantarme.\n¿Ha tomado algo?')
    expect(tx.compose({ kind: 'all' }, { withSpeakers: true, withTimes: true, speakerName: name(tx) }).text)
      .toBe('[00:00] Hablante A: Buenos días, cuénteme.\n[00:03] Hablante B: Me duele la cabeza por la tarde. Y a veces me mareo al levantarme.\n[00:10] Hablante A: ¿Ha tomado algo?')
    tx.remove(['s2'])
    const r = tx.compose({ kind: 'segments', ids: ['s2', 's3', 's4'] }, { multiline: false })
    expect(r).toEqual({ text: 'Y a veces me mareo al levantarme. ¿Ha tomado algo?', ids: ['s3', 's4'] })
    expect(tx.compose({ kind: 'text', parts: [{ id: 's4', start: 0, end: 6, text: '¿Ha to' }] }, { withSpeakers: true, withTimes: true, speakerName: name(tx) }).text).toBe('¿Ha to')
    const d = createTranscript({ mode: 'dictation', segments: [{ id: 'a', literal: 'Uno.' }, { id: 'b', t0: 1, literal: 'Dos.' }] })
    expect(d.compose({ kind: 'all' }).text).toBe('Uno. Dos.')
  })

  it('diferencia por palabras con del/ins; por encima de diffCells, un del y un ins', () => {
    expect(diffWords('me duele la cabeza por la tarde', 'me duele la cabeza por las tardes')).toEqual([
      { t: 'eq', text: 'me duele la cabeza por' }, { t: 'del', text: 'la tarde' }, { t: 'ins', text: 'las tardes' }
    ])
    const big = Array.from({ length: 250 }, (_, i) => `p${i}`).join(' ')
    expect(diffWords(big, `${big} más`)).toEqual([{ t: 'del', text: big }, { t: 'ins', text: `${big} más` }])
    expect(formatTime(3_725_000)).toBe('1:02:05')
  })
})

describe('destinos (§24): ligados al modelo, no al DOM', () => {
  function form() {
    const model = reactive({ motivo: 'Cefalea.', plan: '', resumen: 'Una línea' })
    const store = createTargetStore({ warn: () => {} })
    store.register({ id: 'motivo', label: 'Motivo', get: () => model.motivo, set: (v) => { model.motivo = v }, field: 'f-motivo' })
    store.register({ id: 'plan', label: 'Plan', get: () => model.plan, set: (v) => { model.plan = v } })
    store.register({ id: 'resumen', label: 'Resumen', get: () => model.resumen, set: (v) => { model.resumen = v }, multiline: false })
    return { model, store }
  }

  it('inserta con el campo desmontado; separadores al final; multiline false; uso en derived con sources', () => {
    const tx = sample()
    const { model, store } = form()
    const use = store.insert(tx, 'motivo', 'Línea uno\nLínea dos', { sourceIds: ['s2'], sources: { s2: tx.textOf('s2') } })
    expect(model.motivo).toBe('Cefalea.\nLínea uno\nLínea dos')
    expect(use).toMatchObject({ kind: 'insert', createdBy: 'user', position: 'end', target: { id: 'motivo', label: 'Motivo' }, sourceSegmentIds: ['s2'] })
    store.insert(tx, 'resumen', 'A\nB')
    expect(model.resumen).toBe('Una línea A B')
    store.insert(tx, 'plan', 'Plan.')
    expect(model.plan).toBe('Plan.')
    expect(tx.usesOf('s2')).toHaveLength(1)
  })

  it('cursor y selección recordados solo si el valor no cambió desde entonces; espacios a cada lado', () => {
    const tx = sample()
    const { model, store } = form()
    const el = document.createElement('textarea')
    el.id = 'f-motivo'
    el.value = model.motivo
    el.setSelectionRange(0, 0)
    store.remember(el)
    expect(store.caret(store.get('motivo'))).toEqual({ start: 0, end: 0, value: 'Cefalea.' })
    store.insert(tx, 'motivo', 'Desde ayer.', { position: 'cursor' })
    expect(model.motivo).toBe('Desde ayer. Cefalea.')
    model.motivo = 'Otro valor'
    expect(store.caret(store.get('motivo'))).toBeNull()
    el.value = 'Cefalea intensa.'
    model.motivo = el.value
    el.setSelectionRange(8, 15)
    store.remember(el)
    store.insert(tx, 'motivo', 'leve', { position: 'selection' })
    expect(model.motivo).toBe('Cefalea leve.')
  })

  it('deshacer: solo la última de cada destino y solo sin cambios; quita el uso; la anterior vuelve a poder deshacerse', () => {
    const tx = sample()
    const { model, store } = form()
    const a = store.insert(tx, 'plan', 'Uno.', { sourceIds: ['s1'] })
    const b = store.insert(tx, 'plan', 'Dos.', { sourceIds: ['s2'] })
    expect(store.undoable(a)).toBe(false)
    expect(store.undoable(b)).toBe(true)
    model.plan += ' editado'
    expect(store.undo(tx, b.id)).toEqual({ ok: false, label: 'Plan' })
    expect(model.plan).toBe('Uno.\nDos. editado')
    model.plan = 'Uno.\nDos.'
    expect(store.undo(tx, b.id)).toEqual({ ok: true, label: 'Plan' })
    expect(model.plan).toBe('Uno.')
    expect(tx.usesOf('s2')).toEqual([])
    expect(store.undoable(a)).toBe(true)
  })

  it('insert como vía de escape; destinos sin id, label o get/set se rechazan; id repetido sustituye', () => {
    const tx = sample()
    const warn = vi.fn()
    const store = createTargetStore({ warn })
    const undo = vi.fn(() => true)
    const insert = vi.fn(() => ({ undo }))
    store.register({ id: 'rico', label: 'Editor', insert })
    const use = store.insert(tx, 'rico', 'Texto', { position: 'cursor' })
    expect(insert).toHaveBeenCalledWith('Texto', { position: 'cursor' })
    expect(store.undo(tx, use.id).ok).toBe(true)
    expect(undo).toHaveBeenCalled()
    store.register({ id: 'x' })
    store.register({ label: 'y', get() {}, set() {} })
    store.register({ id: 'rico', label: 'Otro', insert })
    expect(store.list.map((t) => t.label)).toEqual(['Otro'])
    expect(warn).toHaveBeenCalledTimes(3)
  })
})
