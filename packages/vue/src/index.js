import './styles/grana.css'
import GBtn from './components/GBtn/GBtn.vue'
import GInput from './components/GInput/GInput.vue'
import GNumberField from './components/GNumberField/GNumberField.vue'
import GCheckbox from './components/GCheckbox/GCheckbox.vue'
import GCheckboxGroup from './components/GCheckboxGroup/GCheckboxGroup.vue'
import GRadioGroup from './components/GRadioGroup/GRadioGroup.vue'
import GCalendar from './components/GCalendar/GCalendar.vue'
import GDialog from './components/GDialog/GDialog.vue'
import GSwitch from './components/GSwitch/GSwitch.vue'
import GTextarea from './components/GTextarea/GTextarea.vue'
import GSelect from './components/GSelect/GSelect.vue'
import GBadge from './components/GBadge/GBadge.vue'
import GDatePicker from './components/GDatePicker/GDatePicker.vue'
import GSidebar from './components/GSidebar/GSidebar.vue'
import GWidget from './components/GWidget/GWidget.vue'
import GMetric from './components/GMetric/GMetric.vue'
import GProgress from './components/GProgress/GProgress.vue'
import GDataList from './components/GDataList/GDataList.vue'
import GWidgetGrid from './components/GWidgetGrid/GWidgetGrid.vue'
import GWidgetGallery from './components/GWidgetGallery/GWidgetGallery.vue'
import GWidgetConfig from './components/GWidgetConfig/GWidgetConfig.vue'
import GMenu from './components/GMenu/GMenu.vue'
import GStepper from './components/GStepper/GStepper.vue'
import GSurface from './components/GSurface/GSurface.vue'
import GHelper from './components/GHelper/GHelper.vue'
import GHelperScope from './components/GHelperScope/GHelperScope.vue'
import GAvatarMotion from './components/GAvatarMotion/GAvatarMotion.vue'
import GAvatar from './components/GAvatar/GAvatar.vue'
import GTable from './components/GTable/GTable.vue'
import GTooltip from './components/GTooltip/GTooltip.vue'
import GPagination from './components/GPagination/GPagination.vue'
import GFilterBar from './components/GFilterBar/GFilterBar.vue'
import GTabs from './components/GTabs/GTabs.vue'
import GTabPanel from './components/GTabs/GTabPanel.vue'
import GCard from './components/GCard/GCard.vue'
import GToaster from './components/GToast/GToaster.vue'
import GForm from './components/GForm/GForm.vue'
import GFormSection from './components/GFormSection/GFormSection.vue'
import GFormLayout from './components/GFormLayout/GFormLayout.vue'
import GFormRow from './components/GFormRow/GFormRow.vue'
import GAdaptiveLayout from './components/GAdaptiveLayout/GAdaptiveLayout.vue'
import GFormReveal from './components/GFormReveal/GFormReveal.vue'
import GInputGroup from './components/GInputGroup/GInputGroup.vue'
import GInputGroupInput from './components/GInputGroup/GInputGroupInput.vue'
import GInputGroupSelect from './components/GInputGroup/GInputGroupSelect.vue'
import GInputGroupText from './components/GInputGroup/GInputGroupText.vue'
import GFieldGroup from './components/GFieldGroup/GFieldGroup.vue'
import GFormActions from './components/GFormActions/GFormActions.vue'
import GErrorSummary from './components/GErrorSummary/GErrorSummary.vue'
import GDivider from './components/GDivider/GDivider.vue'
import GIcon from './components/GIcon/GIcon.vue'
import GSummary from './components/GSummary/GSummary.vue'
import { summaryDiff } from './components/GSummary/diff.js'
import { formKey, useFormField } from './components/GForm/formContext.js'
import { createToaster, useToast, toasterKey } from './components/GToast/toaster.js'
import { createIcons, iconsKey } from './components/GIcon/registry.js'
import { shared } from './shared.js'

// Registro de componentes (lo mantiene bruno).
// Al agregar uno: importarlo, exportarlo por nombre y añadirlo a `components`.
export { GBtn, GInput, GNumberField, GCheckbox, GCheckboxGroup, GRadioGroup, GCalendar, GDialog, GSwitch, GTextarea, GSelect, GBadge, GDatePicker, GSidebar, GWidget, GMetric, GProgress, GDataList, GWidgetGrid, GWidgetGallery, GWidgetConfig, GMenu, GStepper, GSurface, GHelper, GHelperScope, GAvatarMotion, GAvatar, GTable, GPagination, GFilterBar, GTabs, GTabPanel, GCard, GToaster, GForm, GFormSection, GFormLayout, GFormRow, GAdaptiveLayout, GFormReveal, GInputGroup, GInputGroupInput, GInputGroupSelect, GInputGroupText, GFieldGroup, GFormActions, GErrorSummary, GDivider, GIcon, GSummary, GTooltip }
// Formularios: composable para campos (de Grana y propios) y clave del contexto para `provide` manual (form.md §2)
export { useFormField, formKey }
// Avisos: servicio imperativo (gestor de la app + región), docs/contract/api.md «Servicios imperativos»
export { createToaster, useToast, toasterKey }
// Iconos de la aplicación: registro por aplicación con cadenas de lucide-static (docs/contract/icons.md §5, #200)
export { createIcons, iconsKey }
// Ficha de resumen: contraste entre homónimos de una lista (design/contracts/summary.md, #354)
export { summaryDiff }
// El campo de hora (GTimeField) NO está aquí: va en su propia entrada `@grana/vue/time-field` (más de 8 KB gzip, criterio de #328).
// La captura de voz (createSpeech, GSpeechHost…) NO está aquí: va en su propia entrada `@grana/vue/speech` (#238).
// Uso INTERNO de esa entrada (no es API pública, puede cambiar sin aviso): las piezas que comparte con el principal (src/shared.js)
export { shared as __shared }


const components = { GBtn, GInput, GNumberField, GCheckbox, GCheckboxGroup, GRadioGroup, GCalendar, GDialog, GSwitch, GTextarea, GSelect, GBadge, GDatePicker, GSidebar, GWidget, GMetric, GProgress, GDataList, GWidgetGrid, GWidgetGallery, GWidgetConfig, GMenu, GStepper, GSurface, GHelper, GHelperScope, GAvatarMotion, GAvatar, GTable, GPagination, GFilterBar, GTabs, GTabPanel, GCard, GToaster, GForm, GFormSection, GFormLayout, GFormRow, GAdaptiveLayout, GFormReveal, GInputGroup, GInputGroupInput, GInputGroupSelect, GInputGroupText, GFieldGroup, GFormActions, GErrorSummary, GDivider, GIcon, GSummary, GTooltip }

export function install(app) {
  for (const [name, component] of Object.entries(components)) {
    app.component(name, component)
  }
  // Vue resuelve <g-datepicker> como GDatepicker (mayúscula solo la inicial de cada palabra con guion):
  // el tag del contrato (g-datepicker) necesita este alias además de GDatePicker (<g-date-picker>).
  app.component('GDatepicker', GDatePicker)
}

export default { install }
