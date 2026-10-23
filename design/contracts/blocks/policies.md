# Contrato · Policies (`GbPolicies01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #860 a #866 y #877, 2026-10-22) · **Plan:** B11 (§4.3) · **Entrada:** `@grana/blocks/booking` · **Común:** `_comun.md` §1 a §5 y §14 a §25 · **Compone:** `GSection`, `GAccordion` + `GAccordionItem`, `GAdaptiveLayout`, `GCard`, `GContainer`, `GText`, `GIcon`, `GBtn` · **Parte de bruno:** B · **Modelo:** `faq.md` (anclas y avance, #823)

## Promesa

Las condiciones del lugar (cancelación, llegada y salida, mascotas, niños, pagos) con **lo importante en una línea** y el texto completo a un toque, cada una con su enlace propio.

## Props

```ts
interface GbPoliciesProps {
  title: string
  description?: string
  items: Policy[]                        // 1 a 20 (C7)
  labels?: { external?: string }
}
```

- **`Policy.summary`** es la línea que decide («Cancelación gratis hasta 48 h antes de la llegada»); **`body`** el texto completo (párrafos separados por una línea en blanco); `link` lleva al documento completo si existe (`GBtn variant="link"` al final del cuerpo).
- **`Policy.id`** es el **ancla estable** (`#cancelacion`, como `Faq.id`, #482): abre esa política en 01 (`GAccordionItem id`, `hidden="until-found"`) y es la que citan `Consent.policy` del formulario y los enlaces de la confirmación.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Avance** | Un acordeón: el título y la línea que decide a la vista; el texto completo al abrir | `GSection` › `GAccordion` (`headingLevel` un nivel por debajo) › `GAccordionItem` (`id`, `title`, `peek` = `summary` o el primer párrafo, panel = `GText as="div"` con los párrafos de `body` + `link`) | `icon` |
| **02 · Todo a la vista** | Cada política como una sección corta, todas abiertas | `GSection` › `GContainer width="reading" horizontal="start"` (#845) › `GStack gap="lg"` › `GSection` anidada por política (`id`, `title`, `description` = `summary`) con `GText as="div"` de `body` + `link` | `icon` |
| **03 · Tarjetas** | Una tarjeta por tema con su icono y la línea; el texto completo dentro | `GSection` › `GAdaptiveLayout role="list"` › `div role="listitem" class="g-adapt-wide"` › `GCard as="div"` (`id`, `title`, `description` = `summary`, `lead` = `GIcon` decorativo, cuerpo = `GText as="div" size="body-sm"` de `body`, `link` en `actions`) | — |

En 02 y 03 el `id` de la política va en la raíz de su `GSection`/`GCard` (llega por `$attrs`/prop `id`): `#cancelacion` lleva al sitio.

## Eventos y slots

`navigate` (`link` internos). Slot `body` `{ item }` (escape: contenido rico del texto completo, dentro de la misma `GText`).

## Qué lo hace distinto (#877)

**Lo que decide en una línea, lo legal completo y cada política con su enlace.** El viajero quiere saber «¿puedo cancelar?» sin leer tres párrafos: la línea (`summary`) está a la vista en las tres variantes, y quien usa lector la oye junto al título. El texto completo nunca se recorta. Y cada política tiene su ancla estable: el formulario de reserva enlaza «Acepto la política de cancelación» a `#cancelacion` y el dueño contesta un WhatsApp con ese enlace; el acordeón la abre al llegar y la búsqueda del navegador encuentra lo que está plegado.

## Textos (`labels`)

`external`, requerido con un `link` externo (C5).

## Avisos propios (`[Grana GbPolicies<NN>]`)

C1 a C3, C5 a C7. Además: **P1** · una política sin `summary` (se usa el primer párrafo en 01 y nada en 02 y 03; una vez por instancia), **P2** · `id` con caracteres que no sirven de ancla (espacios; se pinta sin ancla), **P3** · `icon` en 03 que no está registrado (lo avisa `GIcon`; el bloque no repite).

## Banco (`policies.bank.js`)

Casa Alcalá: cancelación (`id: 'cancelacion'`, `summary`, dos párrafos, `link` interno al documento), llegada y salida, mascotas (`icon: 'paw-print'` registrado con `createIcons`), niños, pagos (con `link` externo); una mínima con `title`, `summary` y `body`; `labels` completos.

## Verificación propia

Vitest: `summary` a la vista en las tres; `id` como ancla en las tres; 01 abre la política de `location.hash` y usa `hidden="until-found"` (de `GAccordion`); el cuerpo nunca se recorta; enlaces con la guarda de `navigate`. Chromium: `#cancelacion` abre y enfoca en 01 y lleva al sitio en 02 y 03; 03 en columnas a 1440 y una a 320.

## Límites aceptados tras la auditoría (#905)

- **BK-L12:** en 03 la línea que decide (`summary`) va como `description` de `GCard` (tono atenuado, ≥ 4,5:1) y el texto completo en tono normal. Se acepta: el título de la tarjeta es el que lleva el peso, y el tono de `description` es el de `GCard` en toda la librería. Si el usuario quiere invertirlo, es una enmienda de `GCard` (otra ronda).
