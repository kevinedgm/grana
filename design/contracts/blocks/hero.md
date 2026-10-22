# Contrato · Hero (`GbHero01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #815 a #818, 2026-10-22) · **Plan:** M2 (§4.1) · **Entrada:** `@grana/blocks/marketing` · **Común:** `_comun.md` · **Compone:** `GHero` (`@grana/vue/hero`, `design/contracts/hero.md`), `GBtn`, `GIcon`

## Promesa

La apertura de una página de sitio con **un `h1`, la foto que vende y una sola acción principal**, con las tres formas de `GHero` y los mismos datos en las tres. El bloque no añade forma: decide la **jerarquía de las acciones** y filtra lo que cada apariencia no usa.

## Props

```ts
interface GbHeroProps {
  title: string
  eyebrow?: string
  lead?: string
  aside?: string                       // dato corto bajo las acciones («Desayuno incluido · Llegada desde las 15:00»)
  media: Media                         // foto principal: la prioritaria de la página
  detail?: Media                       // segunda ventana (solo la usa 01)
  views?: { value: string | number; label: string; media: Media }[]   // 2 a 4 (solo la usa 02)
  actions?: Action[]                   // 0 a 2 (§3 de _comun.md)
  labels?: { views?: string; pause?: string; external?: string }
}
```

- `views[].media` con `alt` obligatorio (cambia la foto informativa; aviso 3 de `GHero`).
- `labels.views` lo necesita 02 (nombre del grupo de vistas); `labels.pause`, cualquier variante con vídeo en el slot `media`.
- **Sin `headingLevel`:** el héroe siempre es el `h1` (`GHero headingLevel=1`, `priority` por defecto).

## Variantes

| Variante | Concepto | Compone | Pasa a `GHero` | Ignora |
| --- | --- | --- | --- | --- |
| **01 · La ventana** | Foto vista por el vano junto al texto, con la ventana de detalle | `GHero appearance="window"` | `title`, `eyebrow`, `lead`, `aside`, `media`, `detail`, `labels.pause` | `views`, slot `consult` |
| **02 · Vistas** | Foto a sangre y placa de marca con dos a cuatro vistas que la persona elige | `GHero appearance="views"` | `title`, `eyebrow`, `lead`, `aside`, `media`, `views`, `labels.views`, `labels.pause` | `detail`, slot `consult` |
| **03 · El umbral** | Foto a sangre y tarjeta que cruza su borde con la consulta | `GHero appearance="threshold"` + slot `consult` | `title`, `eyebrow`, `lead`, `aside`, `media`, `labels.pause`, slot `consult` | `detail`, `views` |

El bloque **no pasa** a `GHero` nada que su apariencia no use (regla 3 de `_comun.md`): así el banco completo no dispara el aviso 6 de `GHero` en ninguna variante.

**Acciones** (slot `actions` de `GHero`, `GBtn size="lg"`): 01 y 02, la primera `solid` y la segunda `link`; **03 con slot `consult`**, las dos `outline` (la consulta es la acción principal de la tarjeta, #762); 03 sin `consult`, como 01. En 02 la placa es zona de marca: la principal se invierte sola (§44.1).

## Eventos

`navigate` y `activate` (§4 de `_comun.md`). Las vistas de 02 no emiten: elegir una vista no es una intención que la aplicación deba atender (`v-model:view` de `GHero` queda **reservado** en el bloque).

## Slots

| Slot | Variantes | Qué va |
| --- | --- | --- |
| `consult` | 03 | La consulta (`GBookingBar`); en 01 y 02 se ignora |
| `media` | todas | Un `<video muted playsinline loop poster>` de la aplicación en lugar de la foto (`hero.md` «Movimiento del vídeo») |
| `actions` | todas | Escape: sustituye a los botones generados desde `actions` (la jerarquía la cuida entonces la aplicación) |

## Estructura accesible

La de `GHero`: `section` con nombre por el `h1`, contenido antes que la foto en el DOM, foto con `fetchpriority="high"`. En 03 la consulta va **antes** de las acciones. Ningún otro bloque pinta `h1`; un segundo héroe en la página avisa (aviso 5 de `GHero`).

## Qué lo hace distinto (#818)

**Una sola acción principal, decidida por la forma.** El dato no dice qué botón es el principal: lo dice el bloque, por posición y por apariencia. En el teléfono del viajero el primer toque es siempre «Reservar» (01, 02) o «Ver disponibilidad» dentro de la consulta (03), nunca dos botones sólidos que compiten; en el umbral, la receta de #762 deja de depender de que quien monta la página la recuerde. Y como el bloque filtra lo que cada forma no usa, el dueño del hotel cambia de 01 a 03 sin tocar sus datos y sin avisos.

## Textos (`labels`)

| Clave | Uso | Requerido |
| --- | --- | --- |
| `views` | Nombre del grupo de vistas (02) | Sí, en 02 (lo avisa `GHero`, aviso 8) |
| `pause` | Nombre del botón de pausa del vídeo | Sí, con vídeo (lo avisa `GHero`, aviso 10) |
| `external` | «se abre en otra pestaña» | Sí, con una acción `external` (C5) |

## Avisos propios (`[Grana GbHero<NN>]`)

Los comunes C4 (solo para `detail` y `views[].media`; `media` lo avisa `GHero`), C5, C6 y C8. Además: **H1** · 02 con menos de dos `views` (se pinta como 01, que es lo que hace `GHero`).

## Banco (`hero.bank.js`)

Casa Alcalá: `title`, `eyebrow`, `lead`, `aside`; `media` 1600 × 2000 con `alt` descriptivo; `detail` 600 × 600; tres `views` (Patio, Terraza, Habitación Cantera) con `alt`; `actions` = «Reservar» (`href="#reservar"`) y «Ver habitaciones» (`href="#habitaciones"`); `labels` completos; slot `consult` con un `GBookingBar` mínimo (lo usa solo 03).

## Verificación propia

Vitest: cada variante pasa a `GHero` solo lo de su columna; jerarquía de acciones (01/02: `solid` + `link`; 03 con `consult`: dos `outline`; 03 sin `consult`: `solid` + `link`); exactamente un `h1`. Chromium: acción principal sin desplazar a 390 × 844 en 01 y 03 (medida de `GHero`); sin desbordamiento a 320.
