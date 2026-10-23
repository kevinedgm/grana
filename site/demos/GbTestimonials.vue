<script setup>
// Datos: el banco de la sección (los mismos de sus pruebas y de su playground). En tu aplicación pasas los tuyos
// (ver «Uso» más abajo).
import * as Blocks from '@grana/blocks/marketing'
import * as bank from '../../packages/blocks/src/blocks/GbTestimonials/testimonials.bank.js'
import meta from '../../packages/blocks/src/blocks/GbTestimonials/GbTestimonials.meta.json'
</script>

<template>
  <GranaBlockBank :blocks="Blocks" :meta="meta" :bank="bank" />
</template>
