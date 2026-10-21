<script setup>
// Fotos de la propia demo: SVG en línea (sin red). En tu aplicación, tus fotos con width, height y alt.
const foto = (a, b, w, h) =>
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`
  )
const P = (a, b, w, h, alt, group) => ({ src: foto(a, b, w, h), thumb: foto(a, b, w / 4, h / 4), width: w, height: h, alt, group })
const fotos = [
  P('#6f8f72', '#e6dcc2', 1600, 1067, 'Cama con lámparas de barro', 'hab'),
  P('#8a6f4e', '#d9c7a0', 1600, 1067, 'Ventana al patio', 'hab'),
  P('#4f7a8a', '#d6e4e8', 1067, 1600, 'Regadera de lluvia en el baño', 'bano'),
  P('#7a8a96', '#e4e8ec', 1600, 1067, 'Lavabo de cantera', 'bano')
]
const labels = {
  total: (n) => `${n} ${n === 1 ? 'foto' : 'fotos'}`,
  count: '{index} de {total}', groupCount: '{group} · {index} de {total}', position: '{index} de {total}',
  announce: '{position}. {alt}.', first: 'Primera foto.', last: 'Última foto.',
  prev: 'Foto anterior', next: 'Foto siguiente', close: 'Cerrar', zoom: 'Ampliar',
  viewer: '{title}, galería', groups: 'Espacios',
  groupLink: (n, v) => `${v.group}, ${v.count} ${n === 1 ? 'foto' : 'fotos'}`,
  broken: 'No se pudo cargar esta foto: {alt}', carousel: 'carrusel', slide: 'foto'
}
const groups = [{ value: 'hab', label: 'Habitación' }, { value: 'bano', label: 'Baño' }]
</script>

<template>
  <g-gallery title="Habitación Jardín" :photos="fotos" :groups="groups" :labels="labels" />
</template>
