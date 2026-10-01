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
import GMenu from './components/GMenu/GMenu.vue'
import GStepper from './components/GStepper/GStepper.vue'
import GSurface from './components/GSurface/GSurface.vue'
import GHelper from './components/GHelper/GHelper.vue'
import GHelperScope from './components/GHelperScope/GHelperScope.vue'
import GAvatarMotion from './components/GAvatarMotion/GAvatarMotion.vue'
import GTable from './components/GTable/GTable.vue'
import GPagination from './components/GPagination/GPagination.vue'
import GFilterBar from './components/GFilterBar/GFilterBar.vue'
import GTabs from './components/GTabs/GTabs.vue'
import GTabPanel from './components/GTabs/GTabPanel.vue'
import GCard from './components/GCard/GCard.vue'

// Registro de componentes (lo mantiene bruno).
// Al agregar uno: importarlo, exportarlo por nombre y añadirlo a `components`.
export { GBtn, GInput, GCheckbox, GCheckboxGroup, GCalendar, GDialog, GSwitch, GTextarea, GSelect, GBadge, GDatePicker, GSidebar, GWidget, GMetric, GProgress, GDataList, GWidgetGrid, GWidgetGallery, GWidgetConfig, GMenu, GStepper, GSurface, GHelper, GHelperScope, GAvatarMotion, GTable, GPagination, GFilterBar, GTabs, GTabPanel, GCard }

const components = { GBtn, GInput, GCheckbox, GCheckboxGroup, GCalendar, GDialog, GSwitch, GTextarea, GSelect, GBadge, GDatePicker, GSidebar, GWidget, GMetric, GProgress, GDataList, GWidgetGrid, GWidgetGallery, GWidgetConfig, GMenu, GStepper, GSurface, GHelper, GHelperScope, GAvatarMotion, GTable, GPagination, GFilterBar, GTabs, GTabPanel, GCard }

export function install(app) {
  for (const [name, component] of Object.entries(components)) {
    app.component(name, component)
  }
  // Vue resuelve <g-datepicker> como GDatepicker (mayúscula solo la inicial de cada palabra con guion):
  // el tag del contrato (g-datepicker) necesita este alias además de GDatePicker (<g-date-picker>).
  app.component('GDatepicker', GDatePicker)
}

export default { install }
