# Contrato · Product card (`GbProductCard01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #909 a #914 y #915, 2026-10-23) · **Plan:** E1 (§4.2) · **Entrada:** `@grana/blocks/ecommerce` · **Común:** `_comun.md` §1 a §5 y §26 a §38 · **Compone:** `GCard`, `GPrice` + `GPriceScope` (`@grana/vue/price`), `GBadge` (vía `GCard badge`), `GBtn`, `GText` · **Parte de bruno:** A

## Promesa

Un producto en una tarjeta: **su foto, su nombre, lo que cuesta de verdad, cuántos lo calificaron y si se puede pedir**; un toque lleva a su ficha y, en la compacta, otro lo añade sin equivocarse de talla. Es la pieza de Product grid (E2) y la que la aplicación pone en sus propias rejillas (relacionados, «lo que viste»).

## Props

```ts
interface GbProductCardProps {
  product: Product
  prices?: PriceRegion                 // un GPriceScope alrededor de esta tarjeta (suelta); en una rejilla lo pone la rejilla
  busy?: boolean                       // 03: añadiendo (GBtn loading)
  locale?: string
  labels?: ProductCardLabels
}
type ProductCardLabels = {
  add?: string                         // «Añadir al carrito» (03)
  choose?: string                      // «Elegir opciones» (03, producto con opciones obligatorias)
  busy?: string                        // «Añadiendo…» (loadingText de GBtn)
  unavailable?: string                 // «No disponible» (available: false)
  rating?: string | ((r: { average: string; max: string; count: number; countText: string }) => string)   // «{average} de {max} · {count} opiniones»
  noReviews?: string                   // «Todavía sin opiniones» (rating con count 0)
  price?: PriceLabels & { legend?: string }
  external?: string
}
```

`ProductCardLabels` es **el mismo tipo** que llevan Product grid (`labels.card`) y Cart para la tarjeta: la tarjeta se lee igual en todas partes (§27 regla 3).

## Anatomía (común)

```
GCard [data-gb] as="article" · interaction "link" si product.href, "button" si no (→ open)
├─ media: <img> portada (photos[0]) — 01 y 02 (03: la portada en pequeño, mediaPosition top, density compact)
├─ eyebrow: product.maker · title: product.name (nivel min(sección + 1, 6), useSectionLevel) · subtitle: product.optionsSummary
├─ badge: product.badge (texto; badgeColor neutral)
├─ meta: product.facts (≤ 2; 02 todos hasta 4)
├─ default: GPrice (product.price tal cual, size "md"; 03 "sm")
│           + GText size="body-sm" tone="muted" › la calificación en palabras (con rating)
│           + (no disponible) GText size="body-sm" › motivo
└─ actions: 03 · una sola acción rápida (ver abajo)
```

- **Una acción principal**: la tarjeta. Con `href`, es el enlace a la ficha (`navigate`, reemite el de `GCard`, #505, #574); sin `href`, la tarjeta entera es el botón «ver» (`interaction="button"`) y emite **`open { event, product }`** (la aplicación abre la vista rápida). **Nunca un `GBtn solid`** en una tarjeta (en una rejilla de doce competirían doce principales, §3; como Offer list, #868).
- **La acción rápida (solo 03)**: un `GBtn variant="outline"` en `actions`, interno a la tarjeta (no activa la principal, `card.md` «Eventos»). Si el producto tiene `options` con alguna obligatoria (`required` por defecto), dice **`labels.choose`** y emite **`open { event, product }`**; si no, dice **`labels.add`** y emite **`add { event, product, variant: null, selection: {}, options: [], quantity: 1 }`**. Sin `labels.choose` y con opciones: **EC3** y la acción no se pinta (§27 regla 3: nunca a ciegas). Con `busy`: `loading` y `loadingText = labels.busy`.
- **Precio**: `GPrice` con el `PriceSpec` tal cual (`compareAt` + `compareLabel` en C · «el antes y el ahora» de `price.md`: la referencia nombrada, encima, con el ahorro en texto; sin `compareLabel` ni `labels.price.before`, no se pinta). Ningún distintivo «−20 %» como única señal (`price.md` «Fronteras»).
- **Calificación** (§27 regla 5): `GText` con `labels.rating` y `average` formateado con `Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })`, `max` (5 por defecto) y `count` con agrupación. `count: 0` → `labels.noReviews`. Sin estrellas ni icono. EC2 si el dato es inválido.
- **No disponible** (§27 regla 1): sin acción rápida, el motivo en texto en el cuerpo y el precio a la vista; con `href` la tarjeta sigue siendo enlace (se puede leer la ficha).
- **`lang`**: con `product.lang`, a la raíz de lo que pinta el nombre y el resumen (como `Offer.lang`, #885; límite #891: marca también los `labels` del mismo nodo, así que va en el título y la descripción, no en la raíz de la tarjeta).
- **Región**: con `prices`, la tarjeta va dentro de **un** `GPriceScope` (`as="div"`, `legend` de `prices`). Sin `prices`, el `GPrice` con su código (regla `auto`); suelta, una tarjeta no avisa EC1 (es un solo precio).

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Foto arriba** | La tarjeta de escaparate: la foto domina, el nombre y el precio debajo | `GCard mediaPosition="top"` (anatomía común) | `busy`, `labels.add`/`choose`/`busy`; `facts` más allá de dos |
| **02 · Horizontal** | Foto al lado y todo el detalle a la vista, para listas y resultados | `GCard orientation="auto" mediaPosition="start"` con `summary` como `description` y `facts` hasta 4 | `busy`, `labels.add`/`choose`/`busy` |
| **03 · Compacta con acción rápida** | Mucho producto en poco sitio y «Añadir» sin salir de la lista | `GCard density="compact" mediaPosition="top"` + la acción rápida en `actions` | `summary`, `optionsSummary`, `facts` |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href, item: product }` | La tarjeta-enlace |
| `open` | `{ event, product }` | La tarjeta-botón (sin `href`) o «Elegir opciones» (03) |
| `add` | `{ event, product, variant: null, selection: {}, options: [], quantity: 1 }` | «Añadir» (03), producto sin opciones obligatorias y disponible |

## Slots

`product` `{ product }` (escape: contenido al final del cuerpo, después del precio), `media` `{ product }` (escape: la portada propia de la aplicación, p. ej. una `picture`; se respeta §1 regla 9).

## Estructura accesible

Raíz `article` con nombre por su título (`GCard`); título al nivel de dentro (`useSectionLevel`); la portada es decorativa en una tarjeta-enlace (`GCard media` `aria-hidden`: el nombre ya lo dice); el precio se lee con su frase (`GPrice` `__spoken`); la calificación es texto llano; el `badge` es texto. Sin `h1`, sin región viva. El orden de lectura (nombre → precio → calificación → acción) es el del DOM.

## Qué lo hace distinto (#915)

**Lo que cuesta de verdad, cuántos lo dicen y nunca a ciegas.** La referencia de precio siempre lleva su nombre («Precio de lista $1,850 → $1,650 · Ahorras $200»), nunca un tachado sin origen; la calificación dice cuántas personas la sostienen («4,8 de 5 · 312 opiniones»: un 5,0 de dos opiniones se lee como lo que es); lo agotado se queda con cuándo vuelve. Y la acción rápida de la compacta **no añade un huipil sin talla**: si hay que elegir, dice «Elegir opciones» y abre la elección, así quien compra con el pulgar no descubre en el carrito que pidió la talla equivocada.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `add` | Sí, en 03 con un producto sin opciones obligatorias y disponible (C5) |
| `choose` | Sí, en 03 con un producto con opciones obligatorias (EC3) |
| `busy` | Sí, con `busy` (C5) |
| `unavailable` | Sí, con `available: false` (C5) |
| `rating`, `noReviews` | Sí, con `rating` (`noReviews` con `count: 0`) (C5) |
| `price` | Los de `GPriceScope`/`GPrice` (avisa `GPrice`) |
| `external` | Sí, con `external` (C5) |

## Avisos propios (`[Grana GbProductCard<NN>]`)

C2 (sin `name` o sin `price`: no pinta nada), C4, C5, C6, K3, K4, EC2, EC3, EC5. Además: **PC1** · un producto sin `photos` en 01 o 02 (se pinta sin media; la tarjeta no reserva hueco vacío).

## Banco (`product-card.bank.js`)

Del banco común (§33): el Huipil bordado (con `maker`, `badge` «Últimas 3 piezas», `optionsSummary`, `facts`, opciones obligatorias, `rating`), el Mezcal tobalá (`compareAt` con `compareLabel`), el Plato de barro verde (no disponible con motivo), el mínimo; `prices` MXN; `labels` comunes. El banco monta una tarjeta por producto en cada variante.

## Verificación propia

Vitest: una sola acción principal (enlace o botón) y ningún `GBtn solid`; 03 con el huipil dice `choose` y emite `open`, con el jarro dice `add` y emite `add` con la carga exacta; sin `labels.choose` (EC3) no hay acción; no disponible sin acción y con motivo; la calificación es texto con `Intl` (`es-MX` «4,8», `en-US` «4.8») y `count: 0` dice `noReviews`; `compareAt` sin nombre no se pinta; `lang` en el título y no en la raíz. Chromium: 01 y 03 a 320 sin desbordar con el nombre largo de §7; 02 con la foto al lado a 1440 y arriba a 320.
