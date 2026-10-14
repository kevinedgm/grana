// Entrada `@grana/vue/form-fold` (dueño: bruno). design/contracts/form.md §15 y dialog.md «Paquete y peso», DECISIONS.md
// #590: el pliegue de formulario no viaja en `@grana/vue` (el margen del principal está agotado, #506, #550); quien no lo
// usa no lo paga. Se construye aparte (vite.form-fold.config.js → dist/form-fold.js y dist/form-fold.umd.js, global
// GranaFormFold) con Vue y `@grana/vue` como externos: el motor de formulario (formEngine.js, el mismo de GForm, #588),
// useFormField y las claves de contexto (formKey, foldKey…; una copia crearía otro Symbol y los campos no verían su
// pliegue), la clave de pliegues de GDialog, el motor de plegado (collapse.js), la llegada (landing.js), el canal de página
// (liveRegion.js) y template llegan de `@grana/vue` vía `__shared` (src/shared.js), sin copia. El CSS sigue en grana.css.
// Sin gestor: no es un servicio.
import GFormFold from './components/GFormFold/GFormFold.vue'

export { GFormFold }

export function install(app) {
  if (!app.component('GFormFold')) app.component('GFormFold', GFormFold)
}

export default { install }
