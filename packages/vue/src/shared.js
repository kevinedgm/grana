// Piezas del paquete principal que usan las entradas secundarias (dueño: bruno). NO es API pública: se exporta desde
// `@grana/vue` como `__shared` solo para que `@grana/vue/speech` (#238) las tome del paquete principal en vez de
// llevar su propia copia. Así una página con GToaster y la captura de voz comparte un solo registro de reservas de
// borde (edgeReserve), un solo seguimiento del modal superior (topModal), la misma lista de iconos de la librería y los
// mismos GBtn, GSelect, GCheckbox y GProgress. La isla de estado (`@grana/vue/status`, #328) usa el mismo mecanismo
// (vite.status.config.js; src/status.test.js comprueba sus importaciones).
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
import { fieldGroupKey, formKey, layoutKey, sectionKey } from './components/GForm/formContext.js'
import GLibIcon from './components/GIcon/GLibIcon.js'
import { ANNOUNCE, MOBILE_SPACES, POSITIONS, matchesHotkey, parseHotkey } from './components/GToast/toaster.js'
import { placeBlock } from './utils/anchor.js'
import { EDGE_ORDER, clearEdgeReserve, edgeReserve, setEdgeReserve } from './utils/edgeReserve.js'
import { createLiveWriter } from './utils/liveRegion.js'
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
  'components/GForm/formContext.js': { fieldGroupKey, formKey, layoutKey, sectionKey },
  'components/GIcon/GLibIcon.js': { default: GLibIcon },
  'components/GToast/toaster.js': { ANNOUNCE, MOBILE_SPACES, POSITIONS, matchesHotkey, parseHotkey },
  'utils/anchor.js': { placeBlock },
  'utils/edgeReserve.js': { EDGE_ORDER, clearEdgeReserve, edgeReserve, setEdgeReserve },
  'utils/liveRegion.js': { createLiveWriter },
  'utils/oneOf.js': { oneOf },
  'utils/template.js': { fill },
  'utils/topModal.js': { createTopModal }
}
