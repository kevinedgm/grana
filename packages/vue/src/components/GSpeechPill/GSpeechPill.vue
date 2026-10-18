<script setup>
// GSpeechPill · pill colocable de la captura de voz (dueño: bruno)
// Contrato: design/contracts/speech.md §7 · Estructura: design/lab/speech/r01/ · Estilo: GSpeechPill.css (coco)
// Opcional y UNA por gestor (la segunda no pinta nada y avisa). Con la sesión en idle su raíz existe con `hidden`: el
// anfitrión la observa en cuanto se muestra y decide si es la pill visible (§6.3). En el servidor pinta su raíz oculta.
import { inject, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue'
import SpeechPillView from './SpeechPillView.vue'
import { INTERNAL, speechKey } from '../GSpeechHost/speech.js'

defineOptions({ name: 'GSpeechPill' })

const props = defineProps({
  // Gestor que pinta; por defecto, el provisto con app.use(speech)
  speech: { type: Object, default: undefined }
})

const injected = inject(speechKey, null)
const manager = toRaw(props.speech) || injected
const api = manager && manager[INTERNAL] ? manager[INTERNAL] : null
try { if (process.env.NODE_ENV !== 'production' && !api) console.warn('[Grana Speech] <GSpeechPill> sin prop `speech` y sin gestor provisto (app.use(createSpeech(…))): no pinta nada.') } catch {}

// En el servidor (y hasta montar) se pinta; al montar, la segunda pill del mismo gestor deja de pintar
const active = ref(Boolean(api))
const view = ref(null)
let owner = false

onMounted(() => {
  if (!api) return
  if (!api.attachPill()) {
    try { if (process.env.NODE_ENV !== 'production') console.warn('[Grana Speech] dos <GSpeechPill> para el mismo gestor: la segunda no pinta nada.') } catch {}
    active.value = false
    return
  }
  owner = true
  watch(() => view.value && view.value.root, (el) => api.setPillEl(el || null), { immediate: true, flush: 'post' })
})
onBeforeUnmount(() => { if (owner) api.detachPill() })
</script>

<template>
  <SpeechPillView v-if="active" ref="view" :speech="manager" placement="placed" />
</template>
