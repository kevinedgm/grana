# GbPolicies · GbPolicies01, GbPolicies02 y GbPolicies03

Las condiciones del lugar (cancelación, llegada y salida, mascotas, niños, pagos) con **lo importante en una línea** y el texto completo a un toque, cada una con su enlace propio. Va como acordeón, como secciones abiertas o como tarjetas con icono. Compone `GSection`, `GAccordion` y `GAccordionItem`, `GAdaptiveLayout`, `GCard`, `GContainer`, `GIcon`, `GBtn` y `GText`; no trae color, CSS ni textos propios. Sigue el modelo de [`GbFaq`](../GbFaq/README.md) (anclas y avance).

**Etiquetas:** `<gb-policies-01>`, `<gb-policies-02>`, `<gb-policies-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/booking`

```js
import { GbPolicies01, GbPolicies02, GbPolicies03 } from '@grana/blocks/booking'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/booking/policies.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Esta sección solo necesita `@grana/vue`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**Lo que decide en una línea, lo legal completo y cada política con su enlace** (DECISIONS #877). El viajero quiere saber «¿puedo cancelar?» sin leer tres párrafos: la línea (`summary`) está a la vista en las tres variantes y quien usa lector la oye junto al título. El texto completo nunca se recorta. Y cada política tiene su **ancla estable**: el formulario de reserva enlaza «Acepto la política de cancelación» a `#cancelacion` ([`GbGuestForm`](../GbGuestForm/README.md)) y el dueño contesta un WhatsApp con ese enlace; el acordeón la abre al llegar y la búsqueda del navegador encuentra lo que está plegado.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbPoliciesProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbPolicies01` | Avance: un acordeón con el título y la línea que decide a la vista; el texto completo al abrir | `GSection` > `GAccordion` > un `GAccordionItem` por política (`id`, `title`, `peek` = `summary` o el primer párrafo, panel = `GText as="div"` con los párrafos de `body` y el `link`) | `icon` |
| `GbPolicies02` | Todo a la vista: cada política como una sección corta, todas abiertas | `GSection` > `GContainer width="reading" horizontal="start"` > `GStack gap="lg"` > una `GSection` anidada por política (`id`, `title`, `description` = `summary`) con `GText as="div"` de `body` y el `link` | `icon` |
| `GbPolicies03` | Tarjetas: una tarjeta por tema con su icono y la línea; el texto completo dentro | `GSection` > `GAdaptiveLayout role="list"` > `div role="listitem" class="g-adapt-wide"` > `GCard as="div"` (`id`, `title`, `description` = `summary`, `lead` = un `GIcon` decorativo, cuerpo = `GText as="div" size="body-sm"` de `body`, el `link` en `actions`) | — |

- **`Policy.summary`** es la línea que decide («Cancelación gratis hasta 48 h antes de la llegada»). **`body`** es el texto completo, en texto plano con los párrafos separados por una línea en blanco; no se recorta nunca. **`link`** lleva al documento completo si existe (un `GBtn variant="link"` al final del cuerpo).
- **`Policy.id`** es el ancla estable (`#cancelacion`, como `Faq.id`): abre esa política en 01 (`GAccordionItem id`, con `hidden="until-found"`) y lleva al sitio en 02 y 03 (el `id` va en la raíz de su `GSection` o `GCard`). Es lo que citan `Consent.policy` del formulario y los enlaces de la confirmación.
- **`icon`** solo lo usa 03 y debe estar registrado en la aplicación con `createIcons` (si no, lo avisa `GIcon`, P3).

## Uso

```vue
<!-- Fragmento: `router` es de tu aplicación -->
<script setup>
import { GbPolicies01 } from '@grana/blocks/booking'

const politicas = {
  title: 'Antes de reservar',
  description: 'Lo que conviene saber de la casa; cada condición tiene su propio enlace.',
  items: [
    {
      id: 'cancelacion',
      title: 'Cancelación',
      summary: 'Cancelación gratis hasta 48 h antes de la llegada.',
      body: 'Puedes cancelar sin costo hasta 48 horas antes de las 15:00 del día de llegada.\n\nDespués de ese plazo cobramos la primera noche.',
      link: { label: 'Leer la política completa', href: '/politicas/cancelacion' }
    },
    {
      id: 'llegada',
      title: 'Llegada y salida',
      summary: 'Llegada desde las 15:00; salida hasta las 12:00.',
      body: 'La recepción atiende las 24 horas. Si llegas antes, guardamos tu equipaje.'
    },
    {
      id: 'pagos',
      title: 'Pagos',
      summary: 'Pagas al llegar con tarjeta o en efectivo.',
      body: 'Aceptamos tarjetas, transferencia y efectivo en pesos.',
      link: { label: 'Formas de pago del banco', href: 'https://example.com/pagos', external: true }
    }
  ],
  labels: { external: 'se abre en otra pestaña' }
}

function abrir({ event, href }) {
  event.preventDefault() // tu router navega
  router.push(href)
}
</script>

<template>
  <GbPolicies01 v-bind="politicas" @navigate="abrir" />
</template>
```

Esta sección solo carga `@grana/vue`.

## Ejemplos

### e1 · Las condiciones en un acordeón (`GbPolicies01`)

**Por qué:** cuando hay entre tres y ocho políticas y la mayoría de la gente solo lee la línea. El título y la línea que decide están a la vista sin abrir; el texto completo se abre debajo sin mover el encabezado.

```vue
<!-- Fragmento: `abrir`, `politicas` son de tu aplicación -->
<GbPolicies01 v-bind="politicas" @navigate="abrir" />
```

### e2 · Todo a la vista (`GbPolicies02`)

**Por qué:** cuando lo legal debe poder leerse, imprimirse o buscarse sin abrir nada. Cada política es una sección corta en una columna de lectura.

```vue
<!-- Fragmento: `abrir`, `politicas` son de tu aplicación -->
<GbPolicies02 v-bind="politicas" @navigate="abrir" />
```

### e3 · Tarjetas con icono (`GbPolicies03`)

**Por qué:** cuando quieres que el viajero escanee los temas por su icono (cancelación, mascotas, niños, pagos). Registra los iconos con `createIcons` antes de usar `icon`.

```vue
<!-- Fragmento: `politicasConIcono` es de tu aplicación (las mismas políticas con `icon: 'calendar-x'`, `'clock'`, `'credit-card'`...) -->
<GbPolicies03 v-bind="{ ...politicas, items: politicasConIcono }" @navigate="abrir" />
```

### e4 · El enlace que abre una política (ancla)

**Por qué:** cuando un correo, un WhatsApp o el formulario de reserva deben llevar directo a una política. `Policy.id` es el ancla: `/politicas#cancelacion` abre esa política en 01 y la enfoca en 02 y 03.

```vue
<a href="/politicas#cancelacion">Política de cancelación</a>
```

## Props

Una sola interfaz para las tres variantes (`GbPoliciesProps`). Los tipos de datos salen de `@grana/blocks/booking`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | Título de la sección (`GSection`). |
| `description` | `string` | Descripción de la sección. |
| `items` | `Policy[]` (requerida) | 1 a 20 (C7). summary = la línea que decide; body en texto plano (párrafos separados por una línea en blanco), nunca recortado; id = ancla estable (#cancelacion) que citan Consent.policy y la confirmación; icon solo en 03 |
| `labels` | `PoliciesLabels = {}` | external, requerido con un link externo (C5); sin valores por defecto |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href, item: policy }` (`BlockNavigate<Policy>`) | El link interno de una política con clic primario (#505); nunca con external (#574) ni con tel:/mailto:/sms: (#834) |

Un `link` externo no emite `navigate`.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `body` | `{ item: Policy }` | Escape: contenido rico del texto completo, dentro de la misma GText (el link sigue después) |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `external` | Sí, con un `link` externo (C5) |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| `Tab` | En 01 recorre los encabezados del acordeón; en 02 y 03, solo los enlaces de `link` |
| `Intro` o `Espacio` en un encabezado de 01 | Abre o cierra la política (el encabezado no se mueve) |

Es el teclado de `GAccordion`; el bloque no añade teclas.

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. La línea (`summary`) está a la vista en las tres, con contraste ≥ 4,5:1.
b. El `id` es ancla estable: en 01 abre y enfoca la política de `location.hash` (con `hidden="until-found"` la encuentra la búsqueda del navegador); en 02 y 03 lleva al sitio (`prueba`, Vitest; el spec de bruno en Chromium).
c. El texto completo nunca se recorta (`prueba`).
d. 01: plegado de 240 ms, encabezado quieto (Δ 0 px), interrumpible; con movimiento reducido no hay desplazamiento.
e. 03 en columnas a 1440 y una a 320; sin desplazamiento horizontal a 1440, 390, 320 ni a 320 con el texto al 200 %.

> **Peligro.** Un `id` con espacios o caracteres que no sirven de ancla se pinta **sin ancla** (aviso P2): `#cancelacion` no llevará a ninguna parte y el formulario de reserva que enlaza a esa política tendrá un enlace que no salta. Usa `id` en minúsculas sin espacios y el mismo que pones en `Consent.policy`.

## Avisos de desarrollo

Prefijo `[Grana GbPolicies<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C3, C5 a C7) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-booking). Los propios:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| P1 | Una política sin `summary` | 01 asoma el primer párrafo; 02 y 03 se pintan sin la línea |
| P2 | `id` con caracteres que no sirven de ancla (espacios) | Se pinta sin ancla |
| P3 | `icon` sin registrar en 03 | Lo avisa `GIcon`; el bloque no lo repite |

## Banco de datos de ejemplo

`policies.bank.js` exporta `{ appIcons, props, slots }`: Casa Alcalá con cancelación (`id: 'cancelacion'`, `summary`, dos párrafos y un `link` interno), llegada y salida, mascotas (`icon: 'paw-print'`), niños, pagos (con un `link` externo) y una política mínima con `title`, `summary` y `body`; `appIcons` son los iconos que la página registra con `createIcons`. Con el banco por defecto ninguna variante avisa. Banco real: `packages/blocks/playground/booking/policies.html`.

## Peso

`dist/booking.js` pesa **36 851 B gzip** con su trozo compartido de `common/` (las 11 secciones y 33 variantes; `medido` con `node packages/blocks/scripts/measure-entry.mjs booking`  2026-10-23); tope de la entrada **37 888 B** (DECISIONS #907; el tope inicial de 36 KiB no se vuelve a subir). Una variante importada sola (esbuild minificado  `vue` y `@grana/vue*` externos; `node packages/blocks/scripts/measure-partial.mjs 5120 booking GbGuestForm=7168`): `GbPolicies01` 2 404 B  `GbPolicies02` 2 372 B  `GbPolicies03` 2 474 B; tope por variante **5 120 B** (#887). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **No recorta el texto legal:** el `body` se pinta entero.
- **El texto es plano:** `body` es texto con párrafos; para contenido rico, el slot `body`.
- **Límite aceptado BK-L12 (#905):** en 03 la línea que decide va como `description` de `GCard` (tono atenuado, contraste ≥ 4,5:1) y el texto completo en tono normal. Se acepta: el título lleva el peso. Invertirlo sería una enmienda de `GCard` en otra ronda.
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbPolicies` (`summary` a la vista en las tres; `id` como ancla en las tres; 01 abre la política de `location.hash` con `hidden="until-found"`; cuerpo nunca recortado; enlaces con la guarda de `navigate`) | 41/41 (`npm test -w @grana/blocks`, 2026-10-23) | `prueba` |
| Auditoría de coco: Policies 01, 02 y 03; ancla estable; plegado de 01 (240 ms, Δ 0 px, interrumpible) | Veredicto `candidate`; BK-L12 anotado como límite | `medido` |

**No verificado:** lector de pantalla real (la línea junto al título, el cambio de estado del acordeón); `forced-colors` real; rendimiento con el perfilador. **Pendientes abiertos:** BK-L12 (límite aceptado); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/policies.md`](../../../../../design/contracts/blocks/policies.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§15 a §25); [`faq.md`](../../../../../design/contracts/blocks/faq.md) (modelo).
- Decisiones: #860 a #866, #877, #905, #907 en `DECISIONS.md`.
- Metadatos: [`GbPolicies.meta.json`](./GbPolicies.meta.json). Pruebas: [`GbPolicies.test.js`](./GbPolicies.test.js). Auditoría: [`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md).
