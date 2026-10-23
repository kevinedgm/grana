// GbOfferList · lo que comparten las tres variantes (dueño: bruno; offer-list.md «Anatomía de una oferta», avisos C1 a C7,
// K1 a K5 y OL1). Cada oferta lista para pintar: su interacción (una sola acción principal por tarjeta: la tarjeta-enlace
// con «Elegir» secundario, o la tarjeta-botón que elige), lo no disponible con su motivo y sin elegir (§15 regla 7), el
// precio tal cual a GPrice (con la cuenta solo si hay consulta, #773) y las fotos del visor único de la sección.
import { computed, nextTick, ref } from 'vue'
import { availability, checkRegion, priceSpec, useLocale, useQueryLine } from '../common/booking.js'
import { useItems } from '../common/list.js'
import { checkMedia } from '../common/media.js'
import { isUnsafeHref, safeHref } from '../common/navigate.js'
import { has } from '../common/text.js'
import { MAX_OFFERS } from './props.js'

/** `media`: si la variante pinta la portada (01, 02; OL1 sin fotos). `facts`: cuántos datos a la vista (03: dos). */
export function useOfferList(props, emit, warn, { media = true, facts = Infinity, perks = true } = {}) {
  const locale = useLocale(props)
  const query = useQueryLine(props, warn, { locale })
  const L = computed(() => props.labels || {})
  const list = useItems(() => props.offers, { required: ['name'], what: 'offers', range: [1, MAX_OFFERS], warn })
  const sep = computed(() => (L.value.query && typeof L.value.query.separator === 'string' ? L.value.query.separator : ' '))
  /** La línea de la consulta, una vez por lista: «Para …» y, en stay, la salida en palabras. */
  const line = computed(() => (query.value ? [query.value.line, query.value.checkout].filter(Boolean).join(sep.value) : ''))

  const rows = computed(() => list.value.map((e) => {
    const o = e.item
    const at = `offers[${e.index}]`
    let key = e.key
    if (o.id === undefined || o.id === null || o.id === '') {
      try { if (process.env.NODE_ENV !== 'production') warn(`K5:${e.index}`, `${at} sin id (obligatorio para select): se usa el índice (K5).`) } catch {}
      key = `i:${e.index}`
    }
    const av = availability(o, L.value, at, warn)
    const pics = Array.isArray(o.photos) ? o.photos.filter((p) => p && has(p.src)) : []
    const cover = media && pics.length ? pics[0] : null
    if (cover) checkMedia(cover, `${at}.photos[0]`, warn)
    try { if (process.env.NODE_ENV !== 'production' && media && !pics.length) warn(`OL1:${e.index}`, `${at} sin photos: se pinta sin media (OL1).`) } catch {}
    // Interacción: enlace con href (también no disponible: se puede leer); botón que elige sin href y disponible
    let card = { interaction: 'none' }
    let external = false
    if (o.href !== undefined && o.href !== null && o.href !== '') {
      const href = safeHref(o.href)
      if (!href) {
        try { if (process.env.NODE_ENV !== 'production' && isUnsafeHref(o.href)) warn(`C6:${at}`, `${at} tiene un href javascript:; se ignora el enlace (C6).`) } catch {}
      } else if (o.external) {
        external = true
        card = { interaction: 'link', href, target: '_blank', rel: 'noopener' }
        try { if (process.env.NODE_ENV !== 'production' && !has(L.value.external)) warn('C5:external', 'hay una oferta externa y falta labels.external («se abre en otra pestaña»): la marca queda decorativa (C5).') } catch {}
      } else card = { interaction: 'link', href }
    } else if (av.ok) card = { interaction: 'button' }
    const link = card.interaction === 'link'
    const choose = link && av.ok
    if (choose && !has(L.value.select)) {
      try { if (process.env.NODE_ENV !== 'production') warn('C5:select', 'hay ofertas con href disponibles y falta labels.select («Elegir»): se pintan sin el botón (C5).') } catch {}
    }
    const gallery = pics.length >= 2
    let photosLabel = ''
    if (gallery) {
      const t = L.value.photos
      photosLabel = typeof t === 'function' ? String(t(pics.length)) : has(t) ? String(t).replace(/\{count\}/g, String(pics.length)) : ''
      try { if (process.env.NODE_ENV !== 'production' && !photosLabel) warn('C5:photos', 'hay ofertas con dos o más fotos y falta labels.photos («Ver {count} fotos»): sin el botón (C5).') } catch {}
    }
    const price = priceSpec(o.price, `${at}.price`, warn)
    // La cuenta (el total de lo pedido) solo responde a una consulta: sin consulta, la tarifa sola
    if (price && !query.value) delete price.total
    const factList = (Array.isArray(o.facts) ? o.facts : []).filter((f) => f && has(f.label) && has(f.value))
    try { if (process.env.NODE_ENV !== 'production' && factList.length > 6) warn(`C7:${at}:facts`, `${at}.facts con ${factList.length} datos; se recomiendan hasta 6 (C7).`) } catch {}
    return {
      key,
      offer: o,
      available: av,
      card,
      external,
      cover,
      pics,
      photosLabel,
      selectLabel: choose && has(L.value.select) ? L.value.select : '',
      price,
      meta: factList.slice(0, facts).map((f) => ({ label: f.label, value: f.value })),
      perks: perks && Array.isArray(o.perks) ? o.perks.filter(has) : []
    }
  }))
  const region = computed(() => checkRegion(props.prices, rows.value.some((r) => r.price), warn))

  // Un solo visor de fotos por sección: el de la oferta que se abrió; el foco vuelve a su botón al cerrar
  const viewer = ref(null)
  const open = ref(false)
  async function openPhotos(event, row) {
    viewer.value = { offer: row.offer, photos: row.pics, from: event && event.currentTarget }
    emit('photos', { event, offer: row.offer, index: 0 })
    await nextTick()
    open.value = true
  }
  const select = (event, row) => { if (row.available.ok) emit('select', { event, offer: row.offer, query: query.value ? query.value.query : null }) }
  return { locale, line, rows, region, viewer, open, openPhotos, select }
}
