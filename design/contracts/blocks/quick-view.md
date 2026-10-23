# Contrato · Quick view (`GbQuickView01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #909 a #914 y #919, 2026-10-23) · **Plan:** E5 (§4.2) · **Entrada:** `@grana/blocks/ecommerce` · **Común:** `_comun.md` §1 a §5 y §26 a §38; el panel es el de `product-overview.md` · **Compone:** `GDialog`, `GGallery` (`@grana/vue/gallery`), el panel de Product overview (`GRadioGroup`, `GNumberField`, `GBtn`, `GPrice` + `GPriceScope`, `GText`), `GBtn` · **Parte de bruno:** B · **Compleja: coco y bruno en Opus** (superficie modal con foco y la elección del panel)

## Promesa

Ver un producto y elegirlo **sin salir de la lista**: una superficie con lo esencial de la ficha (fotos, precio, opciones, cantidad, «Añadir») y un enlace a la ficha completa; al cerrar, vuelves a la tarjeta que la abrió.

## Props

```ts
interface GbQuickViewProps {
  product: ProductDetail
  open?: boolean                       // v-model:open
  from?: string | HTMLElement | null   // el disparador, tal cual a `from` de GDialog (#583: el foco vuelve a él); la aplicación lo toma de `open { event }` (event.currentTarget)
  selection?: Record<string, string | number>   // v-model:selection
  quantity?: number                    // v-model:quantity
  prices?: PriceRegion
  busy?: boolean
  locale?: string
  labels: OverviewLabels & {           // los de product-overview.md, tal cual
    close: string                      // nombre del botón de cerrar (GDialog closeLabel)
    full?: string                      // «Ver la ficha completa» (con product.href)
    dialog?: GranaLabels               // a GDialog
  }
}
```

**Misma `Props` que Product overview más `open`, `from` y tres textos** (plan §4.2): los mismos datos abren la ficha en la página o en la superficie. Es una sección propia (su `interface` y su `meta.json`), y comparte el panel con E4 por `common/` (no importa una variante de E4: cada variante se importa sola, §32).

## Piezas (comunes)

- **La superficie**: `GDialog` con `v-model` = `open` (→ `update:open`), `title` = `product.name`, `closeLabel` = `labels.close`, `from`, `labels` = `labels.dialog`. Foco, atrapado, Esc, fondo y **devolución del foco al disparador** son de `GDialog` (`dialog.md`). La raíz del bloque es el `GDialog` (con `data-gb`).
- **Encabezados**: el título del diálogo es su encabezado (nivel de `GDialog`); lo de dentro (la galería) va un nivel por debajo (`h3`); el bloque no usa `useSectionLevel` aquí (el diálogo empieza su propio esquema).
- **El panel**: el de Product overview (orden, opciones, variante, cantidad, «Añadir», no disponible, `add` y `select` con sus cargas), **sin** el texto largo (descripción, ficha técnica y apartados quedan en la ficha completa).
- **Ficha completa**: con `product.href`, un `GBtn variant="link"` `labels.full` al final del panel (`navigate`; con `preventDefault()` la aplicación cierra y navega con su router).
- **Tras «Añadir»**: el bloque **no cierra solo** (la aplicación sabe si añadió: cierra con `open = false` y da su acuse con `GToast`; o lo deja abierto con el error). Mientras, `busy`.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Diálogo** | Centrado en escritorio, hoja inferior en el teléfono: fotos en tira y el panel | `GDialog size="lg" mobile="sheet"` › `GStack gap="md"` › `GGallery appearance="strip"` + panel + ficha completa | — |
| **02 · Hoja lateral** | Una hoja al borde final que deja ver la lista detrás; pantalla completa en el teléfono | `GDialog placement="end" size="md" mobile="fullscreen"` › `GStack gap="md"` › `GGallery` (cuadrícula) + panel + ficha completa | — |
| **03 · Elegir y añadir** | Solo lo que hace falta para añadir: la portada pequeña, las opciones, la cantidad y el botón | `GDialog size="sm" mobile="sheet"` › `GStack gap="md"` › `GText` con `maker` + panel (sin galería; la portada como `img` decorativa, `photos[0]`, dentro de un `GCard level="flat" mediaPosition="start"` con el precio) + ficha completa | `labels.photos`, `labels.gallery`, `photos` más allá de la primera |

**03 es el destino de «Elegir opciones»** de la tarjeta compacta (`product-card.md`): quien ya vio el producto en la lista solo necesita elegir la talla. Con un valor con `photo`, 03 cambia su portada a esa foto (la portada sigue a la elección).

## Eventos

`update:open`, `update:selection`, `update:quantity`, `add`, `select` (cargas de `product-overview.md`) y `navigate` de la ficha completa.

## Slots

`panel` `{ product, variant }` (el de E4).

## Estructura accesible

`dialog` con nombre (el del producto) y su descripción si la aplicación la pasa por `labels.dialog`; foco al abrir en el primer control (regla de `GDialog`, #292: la primera pregunta sin responder), atrapado, Esc cierra, devolución al disparador; el error de una opción sin elegir como en E4. Nada se abre solo: `open` lo pone la aplicación por un gesto.

## Qué lo hace distinto (#919)

**Mirar no te saca de la lista, y cerrar te devuelve a donde estabas.** El foco vuelve a la tarjeta exacta que abriste (no al principio de la rejilla), y lo que elegiste queda en la aplicación (`v-model:selection`) para cuando vuelvas a abrirla: la talla no se pierde por haber cerrado para comparar. En el teléfono la hoja sube desde abajo, al alcance del pulgar, y «Elegir y añadir» (03) pide solo lo que falta para añadir, sin repetir la ficha que ya viste en la tarjeta.

## Textos (`labels`)

Los de `product-overview.md` y además:

| Clave | Requerido |
| --- | --- |
| `close` | Sí (C5) |
| `full` | Sí, con `product.href` (C5; sin él, sin enlace) |
| `dialog` | Los de `GDialog` (avisa él) |

## Avisos propios (`[Grana GbQuickView<NN>]`)

Los de Product overview (con este prefijo) y además: **QV1** · `open` sin `from` y sin un disparador previo enfocado (el foco vuelve a donde `GDialog` decida; una vez por instancia).

## Banco (`quick-view.bank.js`)

El banco de Product overview (el huipil) con `open: true` para el playground y un botón disparador; `labels` de E4 más `close` y `full`.

## Verificación propia

Vitest: las tres con el mismo banco sin avisos; `add`/`select` con las cargas de E4; sin cierre automático tras `add`; el panel es el de E4 (mismo DOM con el mismo producto); 03 sin `GGallery` y con la portada que sigue al color. Chromium: abrir desde una tarjeta, elegir talla, cerrar con Esc y el foco vuelve a esa tarjeta; 01 como hoja inferior a 390 × 844 con «Añadir» visible sin tapar el campo enfocado (2.4.11); 02 al borde final a 1440 y a pantalla completa a 390.
