# Contrato · Features (`GbFeatures01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #815 a #817 y #819, 2026-10-22; remates #833, #834) · **Plan:** M3 (§4.1) · **Entrada:** `@grana/blocks/marketing` · **Común:** `_comun.md` · **Compone:** `GSection`, `GAdaptiveLayout`, `GStack`, `GContainer`, `GCard`, `GIcon`, `GBtn`

## Promesa

Lo que ofrece el lugar en piezas cortas que se leen de un vistazo (tres a seis ventajas), en rejilla, alternadas con foto o en una columna de lectura, **con el mismo esquema de encabezados** en las tres formas.

## Props

```ts
interface GbFeaturesProps {
  title: string
  description?: string
  items: Feature[]                     // 1 a 12 (C7 por encima de 12)
  labels?: { external?: string }
}
```

## Variantes

| Variante | Concepto | Compone | Usa | Ignora |
| --- | --- | --- | --- | --- |
| **01 · Rejilla** | Tarjetas iguales lado a lado con icono | `GSection` › `GAdaptiveLayout role="list"` › `div role="listitem" class="g-adapt-standard"` › `GCard` | `icon` (slot `lead`, `GIcon` decorativo), `title`, `description`, `action` | `media` |
| **02 · Alternada** | Texto y foto, la foto a un lado y al otro | `GSection` › `GStack as="ul" gap="lg"` › `GCard as="li" orientation="auto"` con `mediaPosition` `start` en los pares y `end` en los impares | `media` (slot `media`; sin `media`, `icon` en `lead`), `title`, `description`, `action` | `icon` cuando hay `media` |
| **03 · Lectura** | Una columna a medida de lectura, una ventaja tras otra | `GSection` › `GContainer width="reading"` › `GStack as="ul" divided` › `li` › `GSection` anidada (título = ventaja, descripción) | `title`, `description`, `icon` (slot `title`, antes del texto, decorativo), `action` (`GBtn variant="link"` en el cuerpo) | `media` |

- **Títulos:** en 01 y 02, `GCard headingLevel` = un nivel por debajo de la sección (`useSectionLevel()`, regla 6 de `_comun.md`); en 03, la `GSection` anidada lo pone sola. Las tres dan el mismo esquema: sección › una entrada por ventaja.
- **`action`:** en 01 y 02 la tarjeta entera es el enlace (`GCard interaction="link"`, `href`; sin `href`, `interaction="button"` y `activate`); en 03, un `GBtn variant="link"` con `action.label`.
- **Alternancia de 02:** solo cambia `mediaPosition`; el orden del DOM es siempre texto y foto según `GCard`, y en estrecho la tarjeta pasa a columna sola (`orientation="auto"`, #130).

## Eventos y slots

Eventos `navigate` (reemite el de la tarjeta en 01 y 02) y `activate`; en las tres variantes **`item` es la `Feature`**, no su `action` (`item.action` lleva el destino; #833). Con un `href` `javascript:` (C6) la tarjeta queda sin interacción y en 03 el enlace es un `GBtn` deshabilitado (#834). Slots: `item` `{ item, index }` (escape: sustituye **el cuerpo** del elemento —slot por defecto de la `GCard` en 01 y 02, cuerpo de la `GSection` anidada en 03—; título, descripción, icono, nivel, acción y tarjeta-enlace siguen saliendo de los datos, #833), `description` (sustituye a la prop en la `GSection`).

## Qué lo hace distinto (#819)

**La ventaja lleva a su prueba.** Cada ventaja puede llevar una `action`: «Terraza con vista a Santo Domingo» abre las fotos de la terraza; «Desayuno oaxaqueño» abre la carta. En 01 y 02 la tarjeta entera es la puerta (un toque grande en el teléfono, sin un «Saber más» genérico repetido seis veces); en 03, el enlace dice a dónde va. El viajero no tiene que creerse la lista: la comprueba desde ella.

## Textos (`labels`)

`external` («se abre en otra pestaña»), requerido con una `action` externa (C5).

## Avisos propios (`[Grana GbFeatures<NN>]`)

Comunes C1 a C7. Además: **F1** · en 02, ningún elemento con `media` (se pinta, pero sin la alternancia que da sentido a la forma).

## Banco (`features.bank.js`)

Seis ventajas de Casa Alcalá (patio, terraza, desayuno, ubicación, wifi, traslado): cuatro con `icon` de Lucide (dos de la lista de la librería y dos registrados por la página con `createIcons`), cuatro con `media` 1200 × 900, dos con `action` (una con `href`, una externa a Google Maps), una ventaja mínima (solo `title`) y una con la palabra larga de §7.

## Verificación propia

Vitest: 01 lista con `role="list"` y seis `listitem` hijos directos, todos con la misma pista; 02 `ul > li` con `mediaPosition` alterno; 03 `ul > li > section` con encabezado; tarjeta con `action` = enlace y `navigate`. Chromium: rejilla sin desbordamiento a 320 (una columna) y reparto parejo a 1440; coco anota en la auditoría si la última línea de 01 queda con tarjetas más anchas que la primera (si molesta, la salida es `--g-adapt-chars` como tope, hallazgo para lima).
