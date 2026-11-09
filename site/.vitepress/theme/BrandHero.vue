<script setup>
// Portada del sitio con la marca (manual de marca de Grana v1, octubre 2026). Solo la portada: el resto del sitio sigue
// calcado del anterior (Layout.vue). Va en el hueco `home-hero-before` de VPHome; las ventajas (features) y el cuerpo
// de la portada siguen debajo, como antes.
//
//   section.site-hero  (GContainer as="section" width="xl")
//     GStack.site-hero__stack (vertical, gap md)
//       h1.site-hero__title > svg.grana-w2[.grana-mov][role=img][aria-label=Grana]   logo W2: el h1 real de la página
//       p.site-hero__motto                       lema, aparte del logo («Estructura fija, color tuyo.»)
//       p.site-hero__lead > span[lang=en].site-hero__bug + texto     entradilla del manual
//       p.site-hero__origin                      la frase del nombre (grana cochinilla)
//       GStack.site-hero__actions (horizontal, gap sm)
//         GBtn.site-hero__start (solid, lg)  «Empezar»       GBtn.site-hero__browse (outline, lg)  «Ver componentes»
//         (lg: 44 px de alto propios; con md, el área táctil de 44 px quedaba bajo las ventajas de VPHome, que empiezan
//         justo debajo y se pintan encima)
//
// Lo que este componente espera de grana-site.css (coco; aquí no hay valores de tema ni <style>):
//   - la paleta de documentación de la marca: carmín, nopal, cera y tinta en claro y oscuro (manual), con los nombres que
//     elija coco (propuesta: --site-carmin, --site-nopal, --site-cera, --site-tinta);
//   - en .site-hero, --g-color-brand con el carmín: el tinte del logo y del nombre lee --g-color-brand (hoja propia del
//     SVG, sin respaldo) y GBtn solid lo usa de fondo (texto oscuro en el modo oscuro, manual); la estructura del logo
//     es currentColor, el color de .site-hero__title;
//   - tamaño del logo: el <svg> lleva width/height de su viewBox (250.5 × 72) para no mover nada al cargar ni desbordar
//     a 320 px; la escala de exhibición (manual: min(100%, 560px)) la pone el CSS sobre `.site-hero__title svg`
//     con height:auto;
//   - tipografía y ritmo de .site-hero__motto, __lead, __bug, __origin y de las márgenes de los <p>, y el espacio entre
//     la cabecera y las ventajas;
//   - CLS por la fuente: con Instrument Sans ya cargada o bloqueada el CLS es 0; el cambio de la fuente de respaldo a la
//     web re-parte la entradilla (0,0127 a 1280 px). Toca a las métricas de respaldo o a la medida de la línea (coco).
//
// «La impresión» (brandMark.js, hoja del propio SVG) corre UNA vez: cuando la portada es la página con la que se cargó
// el documento y en su primer montaje (también en el HTML del servidor, para que empiece con el primer pintado, sin
// esperar a la hidratación). Si se llega a la portada navegando dentro del sitio (SPA), o se vuelve a ella, el logo se
// pinta completo, sin `grana-mov`. Con «reducir movimiento», completo siempre (regla de la propia hoja).
import { computed, onMounted } from 'vue'
import { inBrowser, useData, withBase } from 'vitepress'
import { UI, LOCALES } from '../i18n.mjs'
import { brandMark } from './brandMark.js'

const { localeIndex } = useData()
const locale = computed(() => (localeIndex.value === 'en' ? 'en' : 'es'))
const H = computed(() => UI[locale.value].hero)
const prefix = computed(() => LOCALES[locale.value].prefix)
const startHref = computed(() => withBase(`/${prefix.value}getting-started`))
const browseHref = computed(() => withBase(`/${prefix.value}components/`))
// En el servidor siempre con impresión (el HTML es el de la primera carga); en el cliente, solo si esta es la primera
// portada del documento: así la hidratación ve el mismo marcado y una visita SPA no la repite.
const print = !inBrowser || (!printed && location.pathname === BOOT_PATH)
const mark = brandMark({ print })
onMounted(() => { printed = true })
</script>

<script>
// Estado del documento, no del componente: la ruta con la que se cargó y si la impresión ya se dio.
const BOOT_PATH = typeof location !== 'undefined' ? location.pathname : null
let printed = false
</script>

<template>
  <GContainer as="section" width="xl" class="site-hero" aria-labelledby="site-hero-title">
    <GStack class="site-hero__stack" gap="md">
      <h1 id="site-hero-title" class="site-hero__title" v-html="mark" />
      <p class="site-hero__motto">{{ H.motto }}</p>
      <p class="site-hero__lead"><span class="site-hero__bug" lang="en">{{ H.bug }}</span> {{ H.lead }}</p>
      <p class="site-hero__origin">{{ H.origin }}</p>
      <GStack class="site-hero__actions" orientation="horizontal" gap="sm">
        <GBtn class="site-hero__start" size="lg" :href="startHref">{{ H.start }}</GBtn>
        <GBtn class="site-hero__browse" size="lg" variant="outline" :href="browseHref">{{ H.components }}</GBtn>
      </GStack>
    </GStack>
  </GContainer>
</template>

