// Tipos compartidos de Marketing (dueño: bruno; design/contracts/blocks/_comun.md §2, #815). Escritos a mano y
// reexportados desde dist/marketing.d.ts (scripts/build-types.mjs los copia a dist/types/marketing.d.ts). Sin
// `[key: string]: unknown`: un dato de marketing con un nombre mal escrito debe fallar al compilar.
import type { ComponentOptionsMixin, DefineComponent, EmitsToProps, PublicProps, SlotsType, VNode } from 'vue'

/** Imagen. La forma de `GHero`, para que una misma foto sirva al héroe y a una tarjeta. */
export interface Media {
  src: string
  srcset?: string
  sizes?: string
  /** Obligatorios: reservan el hueco (CLS 0). */
  width: number
  height: number
  /** Informativa. */
  alt?: string
  /** alt="" (lo que dice ya lo dice el texto). */
  decorative?: boolean
  /** Solo lo pinta GHero. */
  credit?: string
}

/** Una acción. La jerarquía (cuál es la principal) la pone la sección, no el dato. */
export interface Action {
  /** Identidad en `activate`. */
  id?: string | number
  label: string
  /** Con href: enlace (`navigate`); sin href: botón (`activate`). */
  href?: string
  /** Nombre canónico de Lucide; la aplicación lo registra con `createIcons` si no es de la librería. */
  icon?: string
  /** Otro sitio: target="_blank" rel="noopener", marca `external-link` y `labels.external`; sin `navigate`. */
  external?: boolean
}

/** Un enlace de navegación (pie, legales, redes, canales). */
export interface NavLink {
  label: string
  /** También tel:, mailto:, https://wa.me/… */
  href: string
  external?: boolean
  /** aria-current="page". */
  current?: boolean
  /** Idioma del texto del enlace («English»), 3.1.2. */
  lang?: string
  /** Idioma del destino. */
  hreflang?: string
}

export interface LinkGroup { title: string; links: NavLink[] }

export interface Brand { name: string; href?: string; logo?: Media }

export interface Feature {
  id?: string | number
  title: string
  description?: string
  /** Lucide (como Action.icon). */
  icon?: string
  media?: Media
  /** «La ventaja lleva a su prueba» (#819). */
  action?: Action
}

export interface Stat {
  id?: string | number
  /** La cifra tal como se lee («4,8», «12», «1998»); el bloque no formatea ni anima. */
  value: string | number
  /** «habitaciones», «%». */
  unit?: string
  label: string
  /** De dónde sale («Google, octubre de 2026»); #820. */
  source?: string
}

export interface Testimonial {
  id?: string | number
  /** Texto plano; párrafos separados por una línea en blanco. */
  quote: string
  /** Idioma de la cita si no es el de la página (3.1.2). */
  lang?: string
  /** avatar: URL de la foto (GAvatar src). */
  author: { name: string; role?: string; avatar?: string }
  /** Dónde se publicó; #821. */
  source?: { label: string; href?: string; external?: boolean }
}

export interface Faq {
  /** Ancla estable de la pregunta (#482); #823. */
  id?: string
  question: string
  /** Texto plano; párrafos separados por una línea en blanco (rico: slot `answer`). */
  answer: string
}

/** Textos del buscador de `GbFaq03` (faq.md, #823). Sin valores por defecto (#226). */
export interface FaqLabels {
  /** Etiqueta del buscador. */
  search?: string
  /** «{count} de {total} preguntas»: String con {count}/{total} o función (#51). */
  matches?: string | ((p: { count: number; total: number }) => string)
  /** Título del vacío de la búsqueda. */
  none?: string
  /** «Borrar búsqueda». */
  clear?: string
}

export interface Post {
  id?: string | number
  title: string
  href: string
  /** ISO 8601 (AAAA-MM-DD o fecha y hora). */
  date: string
  /** ISO 8601; #825. */
  updated?: string
  excerpt?: string
  media?: Media
  /** Etiquetas estáticas (GTag sin href). */
  tags?: string[]
  external?: boolean
}

/** Reservado para M9 Team (fuera del lote 2): se fija aquí para que no cambie de forma. */
export interface Member { id?: string | number; name: string; role: string; avatar?: string; bio?: string; links?: NavLink[] }

/** El de `price.md` (#769). Ninguna sección del lote 2 lo usa. */
export type Money = import('@grana/vue/price').Money

/** Carga de `navigate` (_comun.md §4): síncrona, antes de la navegación; `event.preventDefault()` la deja al router. */
export interface BlockNavigate<T> { event: MouseEvent | KeyboardEvent; href: string; item: T }
/** Carga de `activate` (_comun.md §4): una `Action` sin `href`. */
export interface BlockActivate<T> { event: MouseEvent | KeyboardEvent; item: T }

/** Contenido que devuelve un slot. */
export type BlockSlotContent = VNode[] | VNode | string | null | undefined | void

/** Una variante de bloque: `DefineComponent` con la `Props` de su sección, sus eventos y sus slots. */
export type BlockComponent<
  P extends object,
  E extends Record<string, (...args: any[]) => void> = {},
  S extends Record<string, any> = {}
> = DefineComponent<
  P,
  {},
  {},
  {},
  {},
  ComponentOptionsMixin,
  ComponentOptionsMixin,
  E,
  string,
  PublicProps,
  Readonly<P> & Readonly<EmitsToProps<E>>,
  {},
  SlotsType<S>
>

/** Carga de `submit` de GbNewsletter (newsletter.md, #824): envío válido; `email` sin espacios a los lados. */
export interface BlockSubmit { event: Event; email: string }

/** «Actualizado {date}» de GbBlogList (blog-list.md, #825): cadena con {date} o función. Sin valor por defecto (#226). */
export type DateLabel = string | ((p: { date: string }) => string)

/** Raíz de GbFooter (footer.md): `footer` suelto; `div` dentro del slot footer de GAppShell (que ya da el contentinfo). */
export type FooterAs = 'footer' | 'div'
