import './styles/grana.css'
import GBtn from './components/GBtn/GBtn.vue'
import GInput from './components/GInput/GInput.vue'
import GCheckbox from './components/GCheckbox/GCheckbox.vue'
import GCheckboxGroup from './components/GCheckboxGroup/GCheckboxGroup.vue'
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

// Registro de componentes (lo mantiene bruno).
// Al agregar uno: importarlo, exportarlo por nombre y añadirlo a `components`.
export { GBtn, GInput, GCheckbox, GCheckboxGroup, GCalendar, GDialog, GSwitch, GTextarea, GSelect, GBadge, GDatePicker, GSidebar, GWidget, GMetric, GProgress, GDataList, GWidgetGrid, GWidgetGallery, GWidgetConfig }

const components = { GBtn, GInput, GCheckbox, GCheckboxGroup, GCalendar, GDialog, GSwitch, GTextarea, GSelect, GBadge, GDatePicker, GSidebar, GWidget, GMetric, GProgress, GDataList, GWidgetGrid, GWidgetGallery, GWidgetConfig }

export function install(app) {
  for (const [name, component] of Object.entries(components)) {
    app.component(name, component)
  }
  // Vue resuelve <g-datepicker> como GDatepicker (mayúscula solo la inicial de cada palabra con guion):
  // el tag del contrato (g-datepicker) necesita este alias además de GDatePicker (<g-date-picker>).
  app.component('GDatepicker', GDatePicker)
}

export default { install }
