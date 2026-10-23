// @grana/blocks/ecommerce · entrada de la familia Ecommerce (dueño: bruno; _comun.md §26 a §38, #909 a #926). Sin efectos en
// el nivel superior (#444) y sin CSS (los bloques estructurales no llevan, #763): quien importa solo `GbProductCard01` no
// arrastra las demás variantes, y quien importa solo `cartTotals` no arrastra Vue. `vue`, `@grana/vue` y sus entradas
// `/price`, `/gallery`, `/tag` y `/load-region` son *peer* y externos; **no** `/booking` (Ecommerce no tiene consulta, §34).
// Las políticas de la tienda son GbPolicies de @grana/blocks/booking y no se reexportan aquí (§35).
//
// Cómo añadir una sección de Ecommerce (partes B y C, §38):
//   1. Carpeta src/blocks/Gb<Sección>/ con props.js (UN objeto `props` y `emits` para las tres variantes), Gb<Sección>01..03.vue
//      (<script setup>, sin <style>, raíz con data-gb="<seccion>-NN"), Gb<Sección>.meta.json (kind "block-section", family
//      "ecommerce", variants, props con su `ts`, events, slots, types, status "draft", bundle.entry "@grana/blocks/ecommerce"),
//      <seccion>.bank.js (exporta `props`, `slots` y, si hace falta, `appIcons`, `each` y `states`; los datos de la tienda,
//      de bank/ecommerce.js) y Gb<Sección>.test.js con `sectionSuite` de bank/suite.js más su «Verificación propia».
//   2. Lo común de la familia en src/blocks/common/: ecommerce.js (EC1 a EC6, calificación en palabras, elección que viaja,
//      variante resuelta), ProductCard.js (la tarjeta de E1, para la rejilla y el carrito), price.js, locale.js, list.js…
//      Nunca common/booking.js (arrastra describeQuery; la compuerta de §34 lo vigila).
//   3. Aquí: importar las tres variantes, exportarlas por nombre y añadirlas a `variants` del plugin. build-types.mjs se
//      detiene si una variante del meta.json no se exporta aquí o al revés (los valores sueltos, como cartTotals, van en
//      FAMILIES.ecommerce.values de scripts/section-types.mjs).
//   4. Los tipos de datos y textos de la sección, al final de types/ecommerce.d.ts (los que citan los `ts` del meta.json).
//   5. Su banco en src/types.test.js (vue-tsc), su página en playground/ecommerce/<seccion>.html (mountBank de app.js) y
//      sus casos en design/lab/theme-playground/tests/blocks-ecommerce.spec.mjs (PAGES y «Verificación propia»; puerto
//      propio: B 4218, C 4219).
//   6. Medir: `node scripts/measure-partial.mjs 5120 ecommerce +cartTotals=1024` (VERBOSE=1 las lista) y
//      `node scripts/measure-entry.mjs ecommerce`; anotar `bundle.measured` en el meta.json (sin `cap` hasta que lima fije
//      los topes, #909) y en CHANGELOG.md.
import GbProductCard01 from './blocks/GbProductCard/GbProductCard01.vue'
import GbProductCard02 from './blocks/GbProductCard/GbProductCard02.vue'
import GbProductCard03 from './blocks/GbProductCard/GbProductCard03.vue'
import GbCategoryPreviews01 from './blocks/GbCategoryPreviews/GbCategoryPreviews01.vue'
import GbCategoryPreviews02 from './blocks/GbCategoryPreviews/GbCategoryPreviews02.vue'
import GbCategoryPreviews03 from './blocks/GbCategoryPreviews/GbCategoryPreviews03.vue'
import GbTrust01 from './blocks/GbTrust/GbTrust01.vue'
import GbTrust02 from './blocks/GbTrust/GbTrust02.vue'
import GbTrust03 from './blocks/GbTrust/GbTrust03.vue'
import GbPromo01 from './blocks/GbPromo/GbPromo01.vue'
import GbPromo02 from './blocks/GbPromo/GbPromo02.vue'
import GbPromo03 from './blocks/GbPromo/GbPromo03.vue'

export { cartTotals } from './cartTotals.js'

export {
  GbProductCard01, GbProductCard02, GbProductCard03,
  GbCategoryPreviews01, GbCategoryPreviews02, GbCategoryPreviews03,
  GbTrust01, GbTrust02, GbTrust03,
  GbPromo01, GbPromo02, GbPromo03
}

/** Plugin: `app.use(ecommerce)` registra todas las variantes (`<gb-product-card-01>`, `<GbProductCard01>`…). */
export const ecommerce = {
  install(app) {
    const variants = {
      GbProductCard01, GbProductCard02, GbProductCard03,
      GbCategoryPreviews01, GbCategoryPreviews02, GbCategoryPreviews03,
      GbTrust01, GbTrust02, GbTrust03,
      GbPromo01, GbPromo02, GbPromo03
    }
    for (const [name, component] of Object.entries(variants)) app.component(name, component)
  }
}
