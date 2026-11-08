// Ficha interactiva de GGallery. Controles desde GGallery.meta.json. Entrada propia: @grana/vue/gallery.
// Fotos de la propia ficha: SVG en línea (sin red). En tu aplicación, tus fotos con width, height y alt.
const foto = (a, b, w, h) =>
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`
  )
const P = (a, b, w, h, alt, group) => ({ src: foto(a, b, w, h), thumb: foto(a, b, w / 4, h / 4), width: w, height: h, alt, group })
const E = (es, en) => ({ es, en })
const fotos = [
  P('#6f8f72', '#e6dcc2', 1600, 1067, E('Cama con lámparas de barro', 'Bed with clay lamps'), 'hab'),
  P('#8a6f4e', '#d9c7a0', 1600, 1067, E('Ventana al patio', 'Window onto the courtyard'), 'hab'),
  P('#4f7a8a', '#d6e4e8', 1067, 1600, E('Regadera de lluvia en el baño', 'Rain shower in the bathroom'), 'bano'),
  P('#7a8a96', '#e4e8ec', 1600, 1067, E('Lavabo de cantera', 'Stone sink'), 'bano')
]
const labelsDe = (en) => {
  const t = (a, b) => (en ? b : a)
  const f = (n) => `${n} ${n === 1 ? t('foto', 'photo') : t('fotos', 'photos')}`
  return {
    total: f,
    count: t('{index} de {total}', '{index} of {total}'), groupCount: t('{group} · {index} de {total}', '{group} · {index} of {total}'), position: t('{index} de {total}', '{index} of {total}'),
    announce: '{position}. {alt}.', first: t('Primera foto.', 'First photo.'), last: t('Última foto.', 'Last photo.'),
    prev: t('Foto anterior', 'Previous photo'), next: t('Foto siguiente', 'Next photo'), close: t('Cerrar', 'Close'), zoom: t('Ampliar', 'Enlarge'),
    viewer: t('{title}, galería', '{title}, gallery'), groups: t('Espacios', 'Spaces'),
    groupLink: (n, v) => `${v.group}, ${f(n)}`,
    broken: t('No se pudo cargar esta foto: {alt}', 'This photo could not be loaded: {alt}'), carousel: t('carrusel', 'carousel'), slide: t('foto', 'photo')
  }
}
const labels = { es: labelsDe(false), en: labelsDe(true) }

export default {
  exclude: ['id', 'locale', 'eager', 'index', 'open'],
  text: ['title'],
  block: true,
  imports: ["import { GGallery } from '@grana/vue/gallery'"],
  script: '// fotos, espacios y textos son de tu aplicación: ver «Datos de foto» y «Textos» del README',
  base: {
    title: { es: 'Habitación Jardín', en: 'Garden Room' },
    photos: fotos,
    groups: [{ value: 'hab', label: E('Habitación', 'Room') }, { value: 'bano', label: E('Baño', 'Bathroom') }],
    labels
  },
  code: { photos: ':photos="fotos"', groups: ':groups="espacios"', labels: ':labels="textos"' },
  cases: [
    {
      title: { es: 'Una habitación contada por espacios', en: 'A room told by spaces' },
      why: { es: 'Con group en las fotos, la galería se ordena por espacios con un índice: responde «¿cómo es el baño?» en un toque. Úsala cuando vendes un lugar con varias partes.', en: 'With group on the photos, the gallery is ordered by spaces with an index: it answers “what is the bathroom like?” in one tap. Use it when you sell a place with several parts.' },
      props: {}
    },
    {
      title: { es: 'La foto grande ya en la página', en: 'The large photo already on the page' },
      why: { es: 'La tira (strip) evita un clic cuando la página se apoya en pocas fotos; necesita labels.carousel y labels.slide. Con muchas fotos, la cuadrícula.', en: 'The strip avoids a click when the page relies on a few photos; it needs labels.carousel and labels.slide. With many photos, use the grid.' },
      props: { appearance: 'strip' }
    },
    {
      title: { es: 'Galería dentro de una sección con su encabezado', en: 'Gallery inside a section with its heading' },
      why: { es: 'headingLevel 3 cuando el título de la galería cuelga de un h2; sin él toma el nivel de la sección.', en: 'headingLevel 3 when the gallery title hangs under an h2; without it, it takes the section level.' },
      props: { headingLevel: 3 }
    },
    {
      title: { es: 'Solo miniaturas, sin visor', en: 'Thumbnails only, no viewer' },
      why: { es: 'zoom false deja las fotos como imágenes, sin enlace a la grande: para fotos decorativas o que ya se ven completas.', en: 'zoom false leaves the photos as images, with no link to the large one: for decorative photos or ones already seen in full.' },
      props: { zoom: false }
    },
    {
      title: { es: 'Visor con el fondo del tema', en: 'Viewer on the theme background' },
      why: { es: 'viewerZone none abre el visor sin la zona de marca oscura; úsalo si tu marca no admite un fondo tintado.', en: 'viewerZone none opens the viewer without the dark brand zone; use it if your brand does not allow a tinted background.' },
      props: { viewerZone: 'none' }
    }
  ]
}
