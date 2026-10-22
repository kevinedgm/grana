// @grana/blocks/marketing · entrada de la familia Marketing (dueño: bruno; _comun.md §6, #815). Sin efectos en el nivel
// superior (#444) y sin CSS (los bloques estructurales no llevan, #763): quien importa solo `GbHero01` no arrastra las
// demás variantes. `vue`, `@grana/vue`, `@grana/vue/hero` y `@grana/vue/tag` son *peer* y externos.
//
// Añadir una sección: importar sus variantes, exportarlas por nombre y añadirlas a `variants` (el plugin las registra).
// scripts/build-types.mjs se detiene si una variante del meta.json no se exporta aquí o al revés.
import GbHero01 from './blocks/GbHero/GbHero01.vue'
import GbHero02 from './blocks/GbHero/GbHero02.vue'
import GbHero03 from './blocks/GbHero/GbHero03.vue'
import GbFeatures01 from './blocks/GbFeatures/GbFeatures01.vue'
import GbFeatures02 from './blocks/GbFeatures/GbFeatures02.vue'
import GbFeatures03 from './blocks/GbFeatures/GbFeatures03.vue'
import GbStats01 from './blocks/GbStats/GbStats01.vue'
import GbStats02 from './blocks/GbStats/GbStats02.vue'
import GbStats03 from './blocks/GbStats/GbStats03.vue'

export {
  GbHero01, GbHero02, GbHero03,
  GbFeatures01, GbFeatures02, GbFeatures03,
  GbStats01, GbStats02, GbStats03
}

/** Plugin: `app.use(marketing)` registra todas las variantes (`<gb-hero-01>`, `<GbHero01>`…). */
export const marketing = {
  install(app) {
    const variants = {
      GbHero01, GbHero02, GbHero03,
      GbFeatures01, GbFeatures02, GbFeatures03,
      GbStats01, GbStats02, GbStats03
    }
    for (const [name, component] of Object.entries(variants)) app.component(name, component)
  }
}
