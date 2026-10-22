// Entrada `@grana/vue/hero` (dueño: bruno). design/contracts/hero.md «Peso y paquete», DECISIONS.md #742: el héroe de un sitio
// no viaja en `@grana/vue` (#506, #550: el margen del principal está agotado); quien no lo usa no lo paga. Se construye aparte
// (vite.hero.config.js → dist/hero.js y dist/hero.umd.js, global GranaHero) con Vue y `@grana/vue` como externos: el icono
// interno (GLibIcon, pause/play) y la modalidad de foco (utils/keyFocus.js) llegan de `__shared` (src/shared.js), sin copia.
// El CSS sigue en grana.css.
import GHero from './components/GHero/GHero.vue'

export { GHero }

export function install(app) {
  if (!app.component('GHero')) app.component('GHero', GHero)
}

export default { install }
