import './styles/grana.css'
import GBtn from './components/GBtn/GBtn.vue'
import GInput from './components/GInput/GInput.vue'

// Registro de componentes (lo mantiene bruno).
// Al agregar uno: importarlo, exportarlo por nombre y añadirlo a `components`.
export { GBtn, GInput }

const components = { GBtn, GInput }

export function install(app) {
  for (const [name, component] of Object.entries(components)) {
    app.component(name, component)
  }
}

export default { install }
