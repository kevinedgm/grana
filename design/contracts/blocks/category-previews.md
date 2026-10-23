# Contrato · Category previews (`GbCategoryPreviews01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #909 a #914 y #917, 2026-10-23) · **Plan:** E3 (§4.2) · **Entrada:** `@grana/blocks/ecommerce` · **Común:** `_comun.md` §1 a §5 y §26 a §38 · **Compone:** `GSection`, `GAdaptiveLayout`, `GStack`, `GCard`, `GBtn`, `GText` · **Parte de bruno:** A

## Promesa

Las puertas de la tienda: **cada categoría con una foto de lo que hay dentro y cuánto hay**, para entrar a lo que se busca en un toque. Una categoría vacía no engaña: se dice y no se abre.

## Props

```ts
interface GbCategoryPreviewsProps {
  title: string
  description?: string
  categories: Category[]               // 1 a 12 (C7 por encima de 12)
  action?: Action                      // «Ver toda la tienda» (una sola acción de la sección, secundaria)
  locale?: string                      // formato de la cuenta
  labels?: {
    count?: string | ((count: number) => string)   // «{count} piezas»
    empty?: string                     // «Vuelve pronto» (count: 0)
    external?: string
  }
}
```

## Anatomía de una categoría (común)

```
GCard interaction "link" (category.href) · la tarjeta es el enlace
├─ media: <img> de category.media (01: top; 02: background, con velo de GCard)
├─ title: category.name (nivel de dentro; lang si lo trae) · description: category.description
└─ meta | subtitle: la cuenta (labels.count con Intl), si hay count
```

- **Categoría vacía** (`count: 0`, §27 regla 1): la tarjeta se queda **sin interacción** (no es enlace: una puerta a una página vacía hace perder un viaje con datos móviles) y dice `labels.empty` en el lugar de la cuenta. Sin `count`, no se sabe y la tarjeta es enlace.
- **La acción de la sección** (`action`): un `GBtn variant="outline"` (secundaria; la puerta principal es cada tarjeta) en el slot `actions` de `GSection`.
- **Externa** (`external`): marca y `labels.external` dentro del título (§3).

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Puertas con foto** | Tarjetas iguales, foto arriba y el nombre debajo | `GSection` › `GAdaptiveLayout role="list"` › `div role="listitem" class="g-adapt-standard"` › `GCard as="div" mediaPosition="top"` | — |
| **02 · Tira** | Tarjetas más bajas con el nombre sobre la foto, muchas en poco alto | `GSection` › `GAdaptiveLayout role="list"` › `div role="listitem" class="g-adapt-short"` › `GCard as="div" mediaPosition="background" density="compact"` (velo y `--g-card-on-scrim` de `GCard`) | `description` |
| **03 · Lista con cuenta** | Una lista de nombres con su cuenta, sin foto, para un menú de la tienda | `GSection` › `GStack as="ul" gap="sm"` › `GCard as="li" level="flat" density="compact"` con la cuenta en `subtitle` | `media` |

**02 sin desplazamiento horizontal:** «tira» es la forma de la tarjeta, no un carrusel (§1 regla 10): las tarjetas se reparten en filas con `GAdaptiveLayout`, nada se desplaza de lado ni avanza solo.

## Eventos

`navigate` `{ event, href, item: category }` (reemite el de `GCard`; nunca con `external`, #574), y `navigate`/`activate` de `action` (§4).

## Slots

`category` `{ category }` (escape: contenido al final del cuerpo de la tarjeta), `description`.

## Estructura accesible

`GSection` con su título (nivel automático); lista real (§1 regla 5); cada tarjeta-enlace con el nombre de la categoría (y la cuenta en el nombre por estar en la tarjeta: «Barro negro, 24 piezas»); la foto es decorativa (la tarjeta ya lo dice; en 02 el texto sobre la foto cumple contraste por el velo de `GCard`, que coco mide). Sin `h1`.

## Qué lo hace distinto (#917)

**Cada puerta dice cuánto hay detrás y ninguna lleva a una sala vacía.** La cuenta va con el nombre («Barro negro · 24 piezas»), se lee en el enlace y se formatea en el idioma de la página; una categoría sin existencias se queda a la vista con «Vuelve pronto» en lugar de un enlace a «0 resultados», que en el teléfono cuesta un viaje y una vuelta atrás. La tira enseña muchas categorías sin un carrusel que se mueva solo.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `count` | Sí, con alguna categoría con `count` > 0 (C5; sin él, sin cuenta) |
| `empty` | Sí, con alguna `count: 0` (C5) |
| `external` | Sí, con una categoría o `action` externa (C5) |

## Avisos propios (`[Grana GbCategoryPreviews<NN>]`)

C1 a C7. Además: **CP1** · una categoría sin `media` en 01 o 02 (se pinta sin media).

## Banco (`category-previews.bank.js`)

Barro y Agave: Mezcal (`count` 18), Textiles (32), Barro negro (24), Barro verde (`count: 0`), Cocina oaxaqueña (`description`, sin `count`), una en inglés con `lang="en"` («Gifts») y una externa (el mercado de la cooperativa); `action` «Ver toda la tienda».

## Verificación propia

Vitest: lista real con un `listitem` por categoría; cuenta con `Intl` y en el nombre del enlace; `count: 0` sin enlace y con `labels.empty`; 02 con `mediaPosition="background"`; 03 sin `media`. Chromium: 02 sin desplazamiento horizontal a 320 y el texto sobre la foto ≥ 4.5:1 en los tres temas (coco).
