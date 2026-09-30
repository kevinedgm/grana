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

// Registro de componentes (lo mantiene bruno).
// Al agregar uno: importarlo, exportarlo por nombre y añadirlo a `components`.
export { GBtn, GInput, GCheckbox, GCheckboxGroup, GCalendar, GDialog, GSwitch, GTextarea, GSelect, GBadge }

const components = { GBtn, GInput, GCheckbox, GCheckboxGroup, GCalendar, GDialog, GSwitch, GTextarea, GSelect, GBadge }

export function install(app) {
  for (const [name, component] of Object.entries(components)) {
    app.component(name, component)
  }
}

export default { install }
