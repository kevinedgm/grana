<script setup>
// Imagen de la propia demo: un SVG en línea (sin red). En tu aplicación, la foto real.
const foto = (a, b, w, h) =>
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`
  )
const patio = foto('#3f6b52', '#c9b27c', 1600, 2000)
</script>

<template>
  <g-hero
    title="Casa Alcalá"
    eyebrow="Hotel boutique · Centro histórico"
    lead="Doce habitaciones alrededor de un patio de cantera."
    aside="Desayuno incluido · Llegada desde las 15:00"
    :media="{ src: patio, width: 1600, height: 2000, alt: 'Patio de cantera verde al atardecer' }"
  >
    <template #actions>
      <g-btn size="lg" href="#reservar">Reservar</g-btn>
      <g-btn size="lg" variant="link" href="#habitaciones">Ver habitaciones</g-btn>
    </template>
  </g-hero>
</template>
