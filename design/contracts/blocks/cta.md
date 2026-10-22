# Contrato · CTA (`GbCta01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #815 a #817 y #822, 2026-10-22) · **Plan:** M7 (§4.1); receta R5 de `design/lab/marketing/r01/` · **Entrada:** `@grana/blocks/marketing` · **Común:** `_comun.md` · **Compone:** `GSurface zone="brand"`, `GSection`, `GStack`, `GCard`, `GDivider`, `GBtn`

## Promesa

La llamada a la acción de la página, **una sola** además del héroe: el título, una frase, la acción y lo que quita la duda antes de pulsarla.

## Props

```ts
interface GbCtaProps {
  title: string
  description?: string
  actions: Action[]                    // 1 a 2: principal + secundaria (§3 de _comun.md)
  assurance?: string                   // lo que pasa después («Sin pago ahora · Respuesta por WhatsApp en menos de 2 h»)
  media?: Media                        // solo la usa 02
  labels?: { actions?: string; external?: string }
}
```

## Variantes

| Variante | Concepto | Compone | Notas |
| --- | --- | --- | --- |
| **01 · Banda de marca** | Una banda de tinta de marca con la acción invertida | `GSurface zone="brand" padding="lg"` (raíz) › `GSection` (título, descripción) › `GStack orientation="horizontal" gap="sm"` (acciones: `solid` + `outline`) + `p` con `assurance` | Banda a sangre con `class="g-bleed"` de la aplicación. `media` ignorada |
| **02 · Tarjeta con imagen** | La acción en una tarjeta con la foto al lado | `GCard as="section" orientation="auto" mediaPosition="start"` (raíz): `media` en el slot `media`, `title` (nivel `useSectionLevel()`), `description`, acciones en `actions`, `assurance` en `footer` | Sin `media`, tarjeta sin foto |
| **03 · Línea sobria** | Sin superficie: un divisor y la sección con su acción al final de la fila del título | `GStack gap="md"` (raíz) › `GDivider decorative` + `GSection` (título, descripción; acciones en su slot `actions` con `labels.actions`) + `p` con `assurance` en el cuerpo | `media` ignorada; acciones `solid` + `link` |

**`assurance` va unida a la acción principal:** `aria-describedby` del `GBtn` principal apunta al `id` del texto (`GBtn` pasa los atributos a su raíz): quien llega a «Reservar» con el lector oye también «Sin pago ahora».

## Eventos y slots

`navigate` y `activate`. Slot `actions` (escape: sustituye a los botones generados; la aplicación cuida entonces la jerarquía y el `aria-describedby`).

## Qué lo hace distinto (#822)

**Dice qué pasa después, y es una sola.** La línea `assurance` responde la pregunta que frena al viajero justo antes de pulsar (¿me cobran?, ¿quién me contesta?, ¿cuándo?) y está ligada al botón para el lector de pantalla, no suelta en la página. Y el bloque defiende la regla R5: si la página monta una segunda banda de marca, avisa.

## Textos (`labels`)

| Clave | Uso | Requerido |
| --- | --- | --- |
| `actions` | Nombre del grupo de acciones del encabezado (03; aviso 2 de `GSection`) | Sí, en 03 |
| `external` | «se abre en otra pestaña» | Sí, con una acción `external` (C5) |

## Avisos propios (`[Grana GbCta<NN>]`)

Comunes C2, C4 a C6 y C8. Además: **A1** · `actions` vacío (se pinta sin acción: una llamada a la acción sin acción no sirve), **A2** · más de un `GbCta*` en el documento, o un `GbCta01` junto a un `GbStats02` (dos bandas de marca, R5), en `onMounted`.

## Banco (`cta.bank.js`)

«Reserva directo y te esperamos con mezcal», `description`, `actions` = «Reservar» (`href="#reservar"`) y «Escríbenos por WhatsApp» (externa, `https://wa.me/…`), `assurance`, `media` 1200 × 900, `labels` completos.

## Verificación propia

Vitest: `aria-describedby` de la principal → `assurance`; 01 con `data-g-zone="brand"`; 02 con encabezado de la tarjeta al nivel de sección; 03 con el grupo de acciones nombrado; aviso A2 con dos bloques montados. Chromium: en 01, la principal invertida con contraste ≥ 4,5:1 en los dos temas del CLI.
