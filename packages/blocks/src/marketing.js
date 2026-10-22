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
import GbTestimonials01 from './blocks/GbTestimonials/GbTestimonials01.vue'
import GbTestimonials02 from './blocks/GbTestimonials/GbTestimonials02.vue'
import GbTestimonials03 from './blocks/GbTestimonials/GbTestimonials03.vue'
import GbCta01 from './blocks/GbCta/GbCta01.vue'
import GbCta02 from './blocks/GbCta/GbCta02.vue'
import GbCta03 from './blocks/GbCta/GbCta03.vue'
import GbFaq01 from './blocks/GbFaq/GbFaq01.vue'
import GbFaq02 from './blocks/GbFaq/GbFaq02.vue'
import GbFaq03 from './blocks/GbFaq/GbFaq03.vue'
import GbNewsletter01 from './blocks/GbNewsletter/GbNewsletter01.vue'
import GbNewsletter02 from './blocks/GbNewsletter/GbNewsletter02.vue'
import GbNewsletter03 from './blocks/GbNewsletter/GbNewsletter03.vue'
import GbBlogList01 from './blocks/GbBlogList/GbBlogList01.vue'
import GbBlogList02 from './blocks/GbBlogList/GbBlogList02.vue'
import GbBlogList03 from './blocks/GbBlogList/GbBlogList03.vue'
import GbFooter01 from './blocks/GbFooter/GbFooter01.vue'
import GbFooter02 from './blocks/GbFooter/GbFooter02.vue'
import GbFooter03 from './blocks/GbFooter/GbFooter03.vue'

export {
  GbHero01, GbHero02, GbHero03,
  GbFeatures01, GbFeatures02, GbFeatures03,
  GbStats01, GbStats02, GbStats03,
  GbTestimonials01, GbTestimonials02, GbTestimonials03,
  GbCta01, GbCta02, GbCta03,
  GbFaq01, GbFaq02, GbFaq03,
  GbNewsletter01, GbNewsletter02, GbNewsletter03,
  GbBlogList01, GbBlogList02, GbBlogList03,
  GbFooter01, GbFooter02, GbFooter03
}

/** Plugin: `app.use(marketing)` registra todas las variantes (`<gb-hero-01>`, `<GbHero01>`…). */
export const marketing = {
  install(app) {
    const variants = {
      GbHero01, GbHero02, GbHero03,
      GbFeatures01, GbFeatures02, GbFeatures03,
      GbStats01, GbStats02, GbStats03,
      GbTestimonials01, GbTestimonials02, GbTestimonials03,
      GbCta01, GbCta02, GbCta03,
      GbFaq01, GbFaq02, GbFaq03,
      GbNewsletter01, GbNewsletter02, GbNewsletter03,
      GbBlogList01, GbBlogList02, GbBlogList03,
      GbFooter01, GbFooter02, GbFooter03
    }
    for (const [name, component] of Object.entries(variants)) app.component(name, component)
  }
}
