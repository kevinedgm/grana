// Piezas del paquete principal que usan las entradas secundarias (dueño: bruno). NO es API pública: se exporta desde
// `@grana/vue` como `__shared` solo para que `@grana/vue/speech` (#238) las tome del paquete principal en vez de
// llevar su propia copia. Así una página con GToaster y la captura de voz comparte un solo registro de reservas de
// borde (edgeReserve), un solo seguimiento del modal superior (topModal), la misma lista de iconos de la librería y los
// mismos GBtn, GSelect, GCheckbox y GProgress. La isla de estado (`@grana/vue/status`, #328) usa el mismo mecanismo
// (vite.status.config.js; src/status.test.js comprueba sus importaciones), y también la entrada `@grana/vue/combobox`
// (#337: vite.combobox.config.js y src/combobox.test.js), que toma de aquí GInput, GAvatar, GDialog y los dos GIcon. La ficha de resumen (GSummary, summaryDiff y
// utils/match.js; summary.md, #350) vive en el principal y las entradas secundarias la reciben por aquí, sin copia. El campo de
// archivos (`@grana/vue/file-field`, #367: vite.file-field.config.js y src/file-field.test.js) toma de aquí GSummary,
// GProgress, GBtn, el GIcon interno y useFormField con las claves de contexto (formKey, revealKey…): una copia propia de
// formContext.js crearía otro Symbol y el campo no vería su GForm.
// El campo de hora (`@grana/vue/time-field`, #400: vite.time-field.config.js y src/time-field.test.js) toma de aquí GInput,
// useFormField con las claves de contexto (incluida ownFieldKey, el añadido N4 de GInput, #409), oneOf y el observador de
// tamaño compartido (sizeObserver); su motor (utils/timeInput.js) vive en la entrada.
// El deslizador (`@grana/vue/slider`, #455: vite.slider.config.js y src/slider.test.js) toma de aquí useFormField con las
// claves de contexto (layoutKey para publicar su mínimo en GFormRow), GLibIcon, oneOf, sizeObserver y utils/keyFocus.js (la
// escucha única de documento con recuento y la regla de modalidad de #450); su motor (utils/slider.js) vive en la entrada.
//
// vite.speech.config.js redirige cada importación relativa de la entrada speech que sale de sus carpetas
// (GSpeechHost, GSpeechPill, GSpeechTrigger, GTranscript) a la clave correspondiente de este mapa (ruta relativa a src/). Si la
// captura empieza a importar un módulo nuevo del principal, hay que añadirlo aquí: el build se detiene si falta la
// clave y src/speech.test.js comprueba que cada nombre importado existe.
import GBtn from './components/GBtn/GBtn.vue'
import GSelect from './components/GSelect/GSelect.vue'
import GCheckbox from './components/GCheckbox/GCheckbox.vue'
import GProgress from './components/GProgress/GProgress.vue'
import GMenu from './components/GMenu/GMenu.vue'
import GDialog from './components/GDialog/GDialog.vue'
import GInput from './components/GInput/GInput.vue'
import GAvatar from './components/GAvatar/GAvatar.vue'
import GIcon from './components/GIcon/GIcon.vue'
import GSummary from './components/GSummary/GSummary.vue'
import { summaryDiff } from './components/GSummary/diff.js'
import { fieldGroupKey, formKey, layoutKey, messageIcon, nextFrame, ownFieldKey, revealKey, sectionKey, spaceUnit, useFormField } from './components/GForm/formContext.js'
import GLibIcon from './components/GIcon/GLibIcon.js'
import { ANNOUNCE, MOBILE_SPACES, POSITIONS, matchesHotkey, parseHotkey } from './components/GToast/toaster.js'
import { placeBlock } from './utils/anchor.js'
import { EDGE_ORDER, clearEdgeReserve, edgeReserve, setEdgeReserve } from './utils/edgeReserve.js'
import { createLiveWriter } from './utils/liveRegion.js'
import { observeSize } from './utils/sizeObserver.js'
import { useKeyFocus } from './utils/keyFocus.js'
import { fold, parts, tokens } from './utils/match.js'
import { oneOf } from './utils/oneOf.js'
import { fill } from './utils/template.js'
import { createTopModal } from './utils/topModal.js'

// Literal de objetos sin llamadas: quien importa @grana/vue sin usar la captura lo poda entero.
export const shared = {
  'components/GBtn/GBtn.vue': { default: GBtn },
  'components/GSelect/GSelect.vue': { default: GSelect },
  'components/GCheckbox/GCheckbox.vue': { default: GCheckbox },
  'components/GProgress/GProgress.vue': { default: GProgress },
  'components/GMenu/GMenu.vue': { default: GMenu },
  'components/GDialog/GDialog.vue': { default: GDialog },
  'components/GInput/GInput.vue': { default: GInput },
  'components/GAvatar/GAvatar.vue': { default: GAvatar },
  'components/GIcon/GIcon.vue': { default: GIcon },
  'components/GSummary/GSummary.vue': { default: GSummary },
  'components/GSummary/diff.js': { summaryDiff },
  'components/GForm/formContext.js': { fieldGroupKey, formKey, layoutKey, messageIcon, nextFrame, ownFieldKey, revealKey, sectionKey, spaceUnit, useFormField },
  'components/GIcon/GLibIcon.js': { default: GLibIcon },
  'components/GToast/toaster.js': { ANNOUNCE, MOBILE_SPACES, POSITIONS, matchesHotkey, parseHotkey },
  'utils/anchor.js': { placeBlock },
  'utils/edgeReserve.js': { EDGE_ORDER, clearEdgeReserve, edgeReserve, setEdgeReserve },
  'utils/liveRegion.js': { createLiveWriter },
  'utils/match.js': { fold, parts, tokens },
  'utils/sizeObserver.js': { observeSize },
  'utils/keyFocus.js': { useKeyFocus },
  'utils/oneOf.js': { oneOf },
  'utils/template.js': { fill },
  'utils/topModal.js': { createTopModal }
}
