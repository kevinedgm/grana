// Entrada `@grana/vue/time-field` (dueño: bruno). design/contracts/time-field.md «Paquete y peso», DECISIONS.md #400: el
// campo de hora creció más de 8 KB gzip (criterio de #328, #337, #367), así que no viaja en `@grana/vue`: quien no lo usa no
// lo paga. Se construye aparte (vite.time-field.config.js → dist/time-field.js y dist/time-field.umd.js, global
// GranaTimeField) con Vue y `@grana/vue` como externos: lo compartido (GInput, useFormField con las claves de contexto y
// ownFieldKey, oneOf, sizeObserver) llega de `@grana/vue` vía `__shared` (src/shared.js), sin copia: una copia propia de
// formContext.js crearía otro Symbol y el campo no vería su GForm ni su GInput el error propio (N4). El motor
// (utils/timeInput.js) vive aquí. El CSS sigue en grana.css. Los cambios de GInput (N4) y de GForm (ownReveal, #409) sí van
// en el principal.
import GTimeField from './components/GTimeField/GTimeField.vue'

export { GTimeField }

export function install(app) {
  if (!app.component('GTimeField')) app.component('GTimeField', GTimeField)
}

export default { install }
