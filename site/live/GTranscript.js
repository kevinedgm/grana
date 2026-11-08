// Ficha interactiva de GTranscript. Controles desde GTranscript.meta.json. Servicio de voz (@grana/vue/speech):
// monta un transcript guardado (createTranscript con lo que devolvió toJSON()), sin sesión ni micrófono.
// Los textos son los de GSpeechHost.js (español o inglés según la página).
import { defineComponent, h, ref, shallowRef } from 'vue'
import { GBtn, GTextarea } from '@grana/vue'
import { GTranscript, createTranscript } from '@grana/vue/speech'
import { columna, idUnico, nota, rolesFor, labelsFor, useLang, useT } from './GSpeechHost.js'

// Lo que guardó la aplicación con toJSON(): literal del motor, correcciones, roles y un uso.
const GUARDADO = {
  id: 'consulta-guardada', mode: 'conversation', createdAt: '2026-09-12T10:04:00.000Z', expectedSpeakers: 2,
  speakers: [{ id: 'spk_0', role: 'pro', mergedInto: null, origin: 'engine' }, { id: 'spk_1', role: 'pac', mergedInto: null, origin: 'engine' }],
  segments: [
    { id: 's1', t0: 0, t1: 3200, literal: 'Buenos días, ¿cómo ha seguido?', engineSpeaker: 'spk_0', corrected: null, speaker: null, removed: false, failed: false },
    { id: 's2', t0: 3600, t1: 8100, literal: 'Mejor, el dolor bajo bastante desde el martes.', engineSpeaker: 'spk_1', corrected: 'Mejor, el dolor bajó bastante desde el martes.', speaker: null, removed: false, failed: false },
    { id: 's3', t0: 8400, t1: 9900, literal: 'Eh, bueno.', engineSpeaker: 'spk_1', corrected: null, speaker: null, removed: true, failed: false },
    { id: 's4', t0: 10200, t1: 14800, literal: '¿Ha vuelto a tener molestias con la luz?', engineSpeaker: 'spk_1', corrected: null, speaker: 'spk_0', removed: false, failed: false },
    { id: 's5', t0: 15100, t1: 18300, literal: 'Solo una vez, el jueves por la noche.', engineSpeaker: 'spk_1', corrected: null, speaker: null, removed: false, failed: false },
    { id: 's6', t0: 18700, t1: 23900, literal: 'Bien. Mantenemos el plan y revisamos en dos semanas.', engineSpeaker: 'spk_0', corrected: null, speaker: null, removed: false, failed: false }
  ],
  derived: [{ id: 'd1', kind: 'insert', createdBy: 'user', at: '2026-09-12T10:20:00.000Z', target: { id: 'plan', label: 'Plan' }, position: 'end', sourceSegmentIds: ['s6'], text: 'Mantenemos el plan y revisamos en dos semanas.', sources: { s6: 'Bien. Mantenemos el plan y revisamos en dos semanas.' } }]
}
const textos = (lang) => { const l = labelsFor(lang); return { speaker: l.speaker, unassigned: l.unassigned, speakerRole: l.speakerRole, transcript: l.transcript } }

const ficha = defineComponent({
  name: 'GranaLiveTranscript',
  inheritAttrs: false,
  setup(_, { attrs }) {
    const t = useT()
    const lang = useLang().value
    const labels = textos(lang)
    const roles = rolesFor(lang)
    const transcript = shallowRef(createTranscript(GUARDADO))
    const plan = ref('Ibuprofeno 400 mg cada 8 h si hay dolor.\nMantenemos el plan y revisamos en dos semanas.')
    const titulo = idUnico('gl-tx-title')
    const campo = titulo + '-plan'
    // Destino: el modelo del formulario, no el DOM (funciona aunque el campo no esté montado)
    const destinos = [{ id: 'plan', label: 'Plan', get: () => plan.value, set: (v) => { plan.value = v }, field: campo }]
    return () => h('div', { style: columna }, [
      h('div', { style: 'display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--g-space-2)' }, [
        h('h3', { id: titulo, style: 'margin:0' }, t('Consulta del 12 de septiembre', 'Consultation of 12 September')),
        h(GBtn, { size: 'sm', variant: 'ghost', color: 'neutral', onClick: () => { transcript.value = createTranscript(GUARDADO) } }, () => t('Volver a la guardada', 'Back to the saved one'))
      ]),
      h(GTranscript, { ...attrs, transcript: transcript.value, labelledby: titulo, labels, roles, targets: destinos, maxHeight: '420px' }),
      h(GTextarea, { id: campo, name: 'plan', label: t('Plan', 'Plan'), rows: 3, modelValue: plan.value, 'onUpdate:modelValue': (v) => { plan.value = v } }),
      nota(t('Edita un fragmento (Intro), cambia el hablante o inserta texto en el Plan desde el menú de un fragmento.', 'Edit a segment (Enter), change the speaker or insert text into the Plan from a segment’s menu.'))
    ])
  }
})

export default {
  host: ficha,
  controls: ['editable', 'selectable', 'compact', 'copy'],
  exclude: ['transcript', 'selected', 'labelledby', 'label', 'headingLevel', 'speech', 'speakerColors', 'maxHeight', 'targets', 'roles', 'diarization', 'labels'],
  block: true,
  codeFor: (state) => {
    const a = ['  :transcript="transcript"', '  labelledby="titulo"', '  :labels="textos"', '  :roles="roles"', '  :targets="destinos"']
    if (state.editable === false) a.push('  :editable="false"')
    if (state.selectable === false) a.push('  :selectable="false"')
    if (state.compact) a.push('  compact')
    if (state.copy === false) a.push('  :copy="false"')
    if (state.diarization === false) a.push('  :diarization="false"')
    return `<script setup>
import { shallowRef } from 'vue'
import { createTranscript, GTranscript } from '@grana/vue/speech'

// guardado: lo que tu aplicación guardó con transcript.toJSON() (literal, correcciones, roles y usos)
const transcript = shallowRef(createTranscript(guardado))
const roles = [{ id: 'pro', label: 'Profesional' }, { id: 'pac', label: 'Paciente' }]
// destinos: el modelo del formulario, no el DOM
const destinos = [{ id: 'plan', label: 'Plan', get: () => plan.value, set: (v) => { plan.value = v } }]
</` + `script>

<template>
  <h3 id="titulo">Consulta del 12 de septiembre</h3>
  <GTranscript
${a.join('\n')}
  />
</template>`
  },
  cases: [
    {
      title: { es: 'Revisar y corregir una consulta', en: 'Review and correct a consultation' },
      why: { es: 'Rejilla editable: quien revisa corrige texto, reasigna hablantes e inserta en el formulario; el original del motor nunca cambia (se ve con «Ver original»).', en: 'Editable grid: the reviewer corrects text, reassigns speakers and inserts into the form; the engine original never changes (see it with “Show original”).' },
      props: {}
    },
    {
      title: { es: 'Transcripción solo de lectura', en: 'Read-only transcript' },
      why: { es: 'editable false para quien consulta pero no debe cambiar nada (auditoría, historial clínico firmado); se puede seguir seleccionando y copiando.', en: 'editable false for someone who reads but must not change anything (audit, signed clinical record); selecting and copying still work.' },
      props: { editable: false }
    },
    {
      title: { es: 'Compacta en un panel lateral', en: 'Compact in a side panel' },
      why: { es: 'compact quita casillas y ayuda de teclado para columnas estrechas (es la variante que usa el panel de la grabación); para revisar de verdad, usa la rejilla completa.', en: 'compact drops checkboxes and keyboard help for narrow columns (it is the variant the recording panel uses); to really review, use the full grid.' },
      props: { compact: true }
    },
    {
      title: { es: 'Sin copiar al portapapeles', en: 'No clipboard copy' },
      why: { es: 'copy false quita las acciones de copiar y no intercepta Ctrl+C: para contenido sensible que no debe salir de la pantalla.', en: 'copy false removes the copy actions and does not intercept Ctrl+C: for sensitive content that must not leave the screen.' },
      props: { copy: false }
    }
  ]
}
