// Imágenes de los bloques (dueño: bruno; _comun.md §1 regla 9, §2 `Media`, aviso C4). Nunca fetchpriority="high": la foto
// prioritaria de la página es la de GHero (#726, H-L5).
import { has } from './text.js'

/** Aviso C4: sin width/height, o sin alt ni decorative. */
export function checkMedia(media, what, warn) {
  try {
    if (process.env.NODE_ENV !== 'production' && media && typeof media === 'object') {
      if (!(media.width > 0 && media.height > 0)) warn(`C4:size:${what}`, `${what} sin width/height: se pinta sin reservar el hueco (C4).`)
      if (!has(media.alt) && !media.decorative) warn(`C4:alt:${what}`, `${what} sin alt ni decorative: se pinta con alt="" (C4).`)
    }
  } catch {}
}

/** Atributos de un `<img>` de bloque. */
export function imgAttrs(media) {
  const ok = media.width > 0 && media.height > 0
  return {
    src: media.src,
    srcset: media.srcset || undefined,
    sizes: media.sizes || undefined,
    width: ok ? media.width : undefined,
    height: ok ? media.height : undefined,
    alt: !media.decorative && has(media.alt) ? media.alt : '',
    loading: 'lazy',
    decoding: 'async'
  }
}
