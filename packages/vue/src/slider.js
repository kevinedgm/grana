// Entrada `@grana/vue/slider` (dueño: bruno). design/contracts/slider.md «Paquete y peso», DECISIONS.md #455: el deslizador
// (motor, teclado, teclear la cifra, puntero con tres modos, fusión, medida y GForm) supera el tope de 8 KB gzip del
// principal (criterio de #328, #337, #367, #415) y C viene detrás: quien no lo usa no lo paga. Se construye aparte
// (vite.slider.config.js → dist/slider.js y dist/slider.umd.js, global GranaSlider) con Vue y `@grana/vue` como externos: lo
// compartido (useFormField con las claves de contexto, GLibIcon, oneOf, sizeObserver y utils/keyFocus.js con su escucha
// única de documento) llega de `@grana/vue` vía `__shared` (src/shared.js), sin copia: una copia propia de formContext.js
// crearía otro Symbol y el campo no vería su GForm ni su GFormRow. El motor (utils/slider.js) vive aquí (#456). El CSS sigue
// en grana.css.
import GSlider from './components/GSlider/GSlider.vue'

export { GSlider }

export function install(app) {
  if (!app.component('GSlider')) app.component('GSlider', GSlider)
}

export default { install }
