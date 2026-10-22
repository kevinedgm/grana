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
// Las etiquetas (`@grana/vue/tag`, #472: vite.tag.config.js y src/tag.test.js) toman de aquí GBtn, GAvatar, los dos GIcon,
// liveRegion, template, el modo visual del motor del tooltip (visualTip: un solo estado del motor en la página) y el hash de
// categorías (categoryHash, el mismo de GAvatar) y la guarda de `target` de navigate (utils/link.js, #574).
// La región que carga (`@grana/vue/load-region`, #530: vite.load-region.config.js y src/load-region.test.js) toma de aquí
// GEmpty, GBtn, el GIcon interno, el motor de carga (utils/loadPhase.js) con la clave loadRegionKey —una copia crearía
// otro Symbol y el GEmpty del principal no vería su región—, el canal de página (liveRegion), oneOf y template.
// El pliegue de formulario (`@grana/vue/form-fold`, #590: vite.form-fold.config.js y src/form-fold.test.js) toma de aquí el
// motor de formulario (formEngine.js, el mismo de GForm, #588), useFormField y las claves de contexto (incluida foldKey), la
// clave interna de pliegues de GDialog (dialogFoldKey), el motor de plegado (collapse.js), la llegada y el foco de los
// niveles (landing.js), el canal de página (liveRegion) y template.
// El grupo de tarjetas que filtran (`@grana/vue/card-group`, #610: vite.card-group.config.js y src/card-group.test.js) toma
// de aquí la clave del contexto (utils/cardGroup.js, el mismo Symbol que lee GCard) y transitionMs (utils/motion.js).
// El encabezado de página (`@grana/vue/page-header`, #633: vite.page-header.config.js y src/page-header.test.js) toma de
// aquí el registro de reservas de borde (edgeReserve con EDGE_ORDER.pageHeader: un solo registro por documento, o la isla y
// los avisos no verían el zócalo ni el muelle), sizeObserver, spaceUnit y nextFrame (formContext) y transitionMs.
// El chasis de aplicación (`@grana/vue/app-shell`, #716: vite.app-shell.config.js y src/app-shell.test.js) toma de aquí el
// registro de reservas de borde (edgeReserve con EDGE_ORDER.appShell: uno por documento), el canal interno con
// GPageHeader (utils/appShell.js, appShellKey: el mismo Symbol que inyecta el encabezado, #710), el observador de tamaño y
// spaceUnit y nextFrame (formContext).
// El botón flotante con acciones (`@grana/vue/fab`, #656: vite.fab.config.js y src/fab.test.js) toma de aquí GBtn, GTooltip,
// los dos GIcon, el motor de menú compartido con GMenu (utils/menuNav.js, #657), el registro de reservas de borde
// (edgeReserve con EDGE_ORDER.fab: uno por documento), el modal superior (topModal), el canal de página (liveRegion),
// followFrame y anchorGone (anchor), el observador de tamaño, spaceUnit y nextFrame (formContext), transitionMs y oneOf.
// El lote de marketing (#742): el héroe (`@grana/vue/hero`: vite.hero.config.js y src/hero.test.js) toma de aquí GLibIcon y
// utils/keyFocus.js; la galería (`@grana/vue/gallery`) GDialog (con bare y from vivo, #732), GBtn, GLibIcon, la clave de
// anidación de GSection (utils/sectionKey.js: el mismo Symbol, o el título no bajaría de nivel dentro de una sección),
// template, link, sizeObserver y nextFrame; la consulta (`@grana/vue/booking`) GDatePicker, GNumberField, GSelect,
// GRadioGroup, GDialog, GBtn, GLibIcon, useFormField con las claves de contexto, el registro de reservas de borde
// (edgeReserve con EDGE_ORDER.bookingDock), anchor, liveRegion, template, dates, sizeObserver y oneOf.
//
// El precio (`@grana/vue/price`, #776: vite.price.config.js y src/price.test.js) toma de aquí los datos de la moneda
// (utils/currency.js con la tabla de símbolos compartidos, la misma que usa GNumberField currency), template, oneOf, nextFrame
// (formContext) y GLibIcon; su regla (utils/price.js, formatPrice) vive en la entrada.
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
import GEmpty from './components/GEmpty/GEmpty.vue'
import GTooltip from './components/GTooltip/GTooltip.vue'
import GDatePicker from './components/GDatePicker/GDatePicker.vue'
import GNumberField from './components/GNumberField/GNumberField.vue'
import GRadioGroup from './components/GRadioGroup/GRadioGroup.vue'
import { summaryDiff } from './components/GSummary/diff.js'
import { fieldGroupKey, foldKey, formKey, layoutKey, messageIcon, nextFrame, ownFieldKey, revealKey, sectionKey, spaceUnit, useFormField } from './components/GForm/formContext.js'
import { createFormEngine } from './components/GForm/formEngine.js'
import { dialogFoldKey } from './components/GDialog/dialogContext.js'
import { useCollapse } from './utils/collapse.js'
import { observeParent, rowGapOf } from './components/GFormReveal/revealGap.js'
import { firstFocusable, focusChain, land, resolveFrom, resolveTarget, usable } from './utils/landing.js'
import GLibIcon from './components/GIcon/GLibIcon.js'
import { ANNOUNCE, MOBILE_SPACES, POSITIONS, RESUME_MIN, TOAST_DURATION, matchesHotkey, parseHotkey } from './components/GToast/toaster.js'
import { anchorGone, followFrame, isPhone, placeBlock, px, setVar, stickySide } from './utils/anchor.js'
import { EDGE_ORDER, clearEdgeReserve, edgeReserve, setEdgeReserve } from './utils/edgeReserve.js'
import { acquirePageLive, announcePage, createLiveWriter } from './utils/liveRegion.js'
import { createLoadPhase, loadRegionKey, rememberFocus, restoreFocus } from './utils/loadPhase.js'
import { observeSize } from './utils/sizeObserver.js'
import { useKeyFocus } from './utils/keyFocus.js'
import { fold, parts, tokens } from './utils/match.js'
import { oneOf } from './utils/oneOf.js'
import { addDays, daysBetween, isISO, parseISO, todayISO } from './utils/dates.js'
import { fill } from './utils/template.js'
import { createTopModal } from './utils/topModal.js'
import { useVisualTips } from './utils/visualTip.js'
import { categoryOf } from './utils/categoryHash.js'
import { otherContext } from './utils/link.js'
import { cardGroupKey } from './utils/cardGroup.js'
import { appShellKey } from './utils/appShell.js'
import { sectionKey as gSectionKey } from './utils/sectionKey.js'
import { transitionMs } from './utils/motion.js'
import { createHighlight, createPointer, createTypeahead, focusItem, repeatGesture, stepTo } from './utils/menuNav.js'
import { warnMissingCategory } from './utils/categoryToken.js'
import { BIDI, currencyCode, currencyDigits, currencyName, isShared, nf } from './utils/currency.js'

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
  'components/GEmpty/GEmpty.vue': { default: GEmpty },
  'components/GTooltip/GTooltip.vue': { default: GTooltip },
  'components/GDatePicker/GDatePicker.vue': { default: GDatePicker },
  'components/GNumberField/GNumberField.vue': { default: GNumberField },
  'components/GRadioGroup/GRadioGroup.vue': { default: GRadioGroup },
  'components/GForm/formContext.js': { fieldGroupKey, foldKey, formKey, layoutKey, messageIcon, nextFrame, ownFieldKey, revealKey, sectionKey, spaceUnit, useFormField },
  'components/GForm/formEngine.js': { createFormEngine },
  'components/GDialog/dialogContext.js': { dialogFoldKey },
  'utils/collapse.js': { useCollapse },
  'components/GFormReveal/revealGap.js': { observeParent, rowGapOf },
  'utils/landing.js': { firstFocusable, focusChain, land, resolveFrom, resolveTarget, usable },
  'components/GIcon/GLibIcon.js': { default: GLibIcon },
  'components/GToast/toaster.js': { ANNOUNCE, MOBILE_SPACES, POSITIONS, RESUME_MIN, TOAST_DURATION, matchesHotkey, parseHotkey },
  'utils/anchor.js': { anchorGone, followFrame, isPhone, placeBlock, px, setVar, stickySide },
  'utils/edgeReserve.js': { EDGE_ORDER, clearEdgeReserve, edgeReserve, setEdgeReserve },
  'utils/liveRegion.js': { acquirePageLive, announcePage, createLiveWriter },
  'utils/loadPhase.js': { createLoadPhase, loadRegionKey, rememberFocus, restoreFocus },
  'utils/match.js': { fold, parts, tokens },
  'utils/sizeObserver.js': { observeSize },
  'utils/keyFocus.js': { useKeyFocus },
  'utils/oneOf.js': { oneOf },
  'utils/dates.js': { addDays, daysBetween, isISO, parseISO, todayISO },
  'utils/template.js': { fill },
  'utils/topModal.js': { createTopModal },
  'utils/visualTip.js': { useVisualTips },
  'utils/categoryHash.js': { categoryOf },
  'utils/link.js': { otherContext },
  'utils/cardGroup.js': { cardGroupKey },
  'utils/appShell.js': { appShellKey },
  'utils/sectionKey.js': { sectionKey: gSectionKey },
  'utils/motion.js': { transitionMs },
  'utils/menuNav.js': { createHighlight, createPointer, createTypeahead, focusItem, repeatGesture, stepTo },
  'utils/categoryToken.js': { warnMissingCategory },
  'utils/currency.js': { BIDI, currencyCode, currencyDigits, currencyName, isShared, nf }
}
