# GbStats · GbStats01, GbStats02 y GbStats03

Dos a seis cifras que sostienen la promesa del sitio («12 habitaciones», «4,8 de 5», «desde 1998»), **quietas, legibles al primer pintado y con su origen a la vista**: en una fila que se parte sola, dentro de una banda de marca o junto a un párrafo que las explica. El bloque compone `GSection`, `GAdaptiveLayout`, `GMetric`, `GSurface`, `GContainer` y `GText`; no trae color, CSS ni textos propios (el tema lo pone y todo el texto viene en tus datos).

**Etiquetas:** `<gb-stats-01>`, `<gb-stats-02>`, `<gb-stats-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/marketing`

```js
import { GbStats01, GbStats02, GbStats03 } from '@grana/blocks/marketing'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/marketing/stats.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**Ninguna cifra sin su origen, y ninguna cuenta hacia arriba** (DECISIONS #820). Cada cifra lleva su `source` a la vista («312 opiniones en Google, octubre de 2026») en el contexto de la métrica: quien llega desde una red social sabe de dónde sale el número. Y se descarta el contador animado que es costumbre en esta sección: la cifra se lee en el primer pintado, en una captura de pantalla y con conexión lenta, y nada se mueve solo (2.2.2).

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbStatsProps`, el mismo objeto `props` de `props.js`). Lo que una forma no usa, lo ignora.

| Variante | Concepto | Compone | Notas |
| --- | --- | --- | --- |
| `GbStats01` | Fila: las cifras en una línea que se parte sola | `GSection` > `GAdaptiveLayout role="list"` > `div role="listitem"` (pista `g-adapt-short`) > `GMetric size="lg"` | `label`, `value`, `unit`; `source` como `context` |
| `GbStats02` | Banda: las cifras dentro de una banda de marca | `GSurface zone="brand" level="flat" padding="lg"` (raíz) > `GSection` > la lista de 01 | Sin borde ni radio, también a sangre. La zona cuenta como el sólido de marca de la región: **una banda de marca por página** además del héroe |
| `GbStats03` | Junto a un párrafo: el párrafo que explica y las cifras que lo prueban | `GSection` (sin descripción) > `GAdaptiveLayout` > [`div g-adapt-wide` > `GContainer width="reading"` > `GText as="div"` con los párrafos] + [`GAdaptiveLayout role="list"` con las cifras de 01] | Sin `description` ni slot, 03 se pinta como 01 |

- **`value` se pinta tal cual:** una cadena ya formateada por tu aplicación en su idioma (un `Number` se pinta con `String()`). El bloque no formatea, no redondea y no anima.
- **Banda a sangre (02):** dentro de un `GContainer`, `class="g-bleed"` va en la raíz y llega por `$attrs`.

## Dónde va `GText`

`GText` es la primitiva de texto suelto de `@grana/vue` ([`GText/README.md`](../../../../vue/src/components/GText/README.md)). Aquí la usa en un solo sitio, el que no cabe en una prop de componente:

| Variante | Texto suelto | `GText` |
| --- | --- | --- |
| 03 | Los párrafos de `description` (y el slot `description`) junto a las cifras | `as="div"` envolviendo los párrafos o el slot, dentro de `GContainer width="reading"` |
| 01 y 02 | La descripción de la sección | La prop `description` de `GSection`; no lleva `GText` |

Los párrafos de 03 quedan separados por la pausa de `body` (12 px con `space` 4), sin aire antes del primero ni tras el último. El slot de escape recibe la misma tipografía.

## Uso

```vue
<script setup>
import { GbStats01 } from '@grana/blocks/marketing'

const stats = {
  title: 'Casa Alcalá en cifras',
  description: 'Una casa pequeña, con los mismos dueños desde que abrió.',
  items: [
    { id: 'habitaciones', value: 12, unit: 'habitaciones', label: 'Casa pequeña', source: 'Registro de la casa, 2026' },
    { id: 'google', value: '4,8', unit: 'de 5', label: 'Calificación de huéspedes', source: '312 opiniones en Google, octubre de 2026' },
    { id: 'desde', value: '1998', label: 'Abierta desde', source: 'Acta de apertura' }
  ]
}
</script>

<template>
  <GbStats01 v-bind="stats" />
</template>
```

El mismo `stats` sirve para `GbStats02` y `GbStats03`.

## Ejemplos

### e1 · Las cifras de un vistazo (`GbStats01`)

**Por qué:** cuando las cifras son cortas y pueden ir en una sola línea que se parte sola a 320 px. Con menos de dos o más de seis avisa (C7) y se pinta igual.

```vue
<GbStats01 v-bind="stats" />
```

### e2 · Las cifras como remate de la página (`GbStats02`)

**Por qué:** cuando las cifras merecen una banda de tinta de marca. La banda de marca es una por página: si montas también `GbCta01`, avisa S2.

```vue
<GContainer>
  <GbStats02 v-bind="stats" class="g-bleed" />
</GContainer>
```

### e3 · Un párrafo que se prueba con las cifras (`GbStats03`)

**Por qué:** cuando la descripción es un argumento de varios párrafos y las cifras son su prueba. Los párrafos se separan con una línea en blanco en `description`; para enlaces o listas, usa el slot `description`.

```vue
<GbStats03
  :title="stats.title"
  :description="'Una casa pequeña, con los mismos dueños desde que abrió.\n\nNada de esto cuenta hacia arriba: se lee igual en una captura.'"
  :items="stats.items"
/>
```

## Props

Una sola interfaz para las tres variantes (`GbStatsProps`). `Stat` sale de `@grana/blocks/marketing`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | El título de la sección; la lista de cifras toma de él su nombre |
| `description` | `string` | En 01 y 02, la descripción de la sección; en 03, el párrafo junto a las cifras (párrafos separados por una línea en blanco). El slot `description` la sustituye |
| `items` | `Stat[]` (requerida) | De 2 a 6 (fuera de ese rango, aviso C7 y se pintan todas) |

`Stat` es `{ id?, value, unit?, label, source? }`. `value` es `string | number`.

## Eventos

`GbStats` no emite eventos: no tiene acciones ni cambia con el uso.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `description` | — | Sustituye al párrafo de 03 y a la descripción de la sección en 01 y 02 |

## Textos (`labels`)

Ninguno: todo el texto viene en tus datos.

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md)) sobre las 27 variantes de Marketing, tres motores, tres temas, claro y oscuro:

a. Lista real de cifras: `role="list"` con los `listitem` como hijos directos, con el nombre de la sección; cada métrica se lee en el orden etiqueta, cifra, unidad y contexto (`medido`, auditoría; `prueba`, Vitest).
b. Contraste de todo el texto pintado de Marketing de 4,68:1 como mínimo, también las cifras dentro de la banda de marca de 02 (`medido`, auditoría).
c. Contexto y unidad de `GMetric` en la escala del tema, sin texto por debajo de 12 px (hallazgos MK-C1 y MK-C2, corregidos en `GMetric.css` y medidos después; `medido`).
d. Sin desplazamiento horizontal a 1440, 390 y 320 px, ni a 320 con el texto al 200 % (`medido`, auditoría).
e. Nada se mueve: ni contadores ni aparición al desplazar, y sin `aria-live` (regla 10 de `_comun.md`).
f. En 02, banda `flat` sin radio ni borde lateral (hallazgo MK-C3, cerrado por #830; `medido`).

> **Peligro.** Una cifra sin `source` se pinta igual (aviso S1), pero pierde lo que distingue a este bloque: un número sin origen no se puede comprobar. Y `value` se pinta tal cual: si pasas `4.8` en una página en español, la persona lee «4.8», no «4,8»; el formato es de tu aplicación.

## Avisos de desarrollo

Prefijo `[Grana GbStats<NN>]`, una vez por instancia y motivo, solo en desarrollo.

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| C1 | `items` vacío | No pinta nada |
| C2 | Una cifra sin `label` o sin `value` | Esa cifra se omite |
| C3 | `id` repetido | Se usa el índice |
| C7 | Menos de 2 o más de 6 cifras | Se pintan todas |
| S1 | Una cifra sin `source` | Se pinta igual |
| S2 | Más de un `[data-gb="stats-02"]` o `[data-gb="cta-01"]` en el documento (al montar) | Dos bandas de marca compiten (R5); se pintan las dos |

## Banco de datos de ejemplo

`stats.bank.js` exporta `{ props, slots }`: cuatro cifras de Casa Alcalá (12 habitaciones; 4,8 de 5 con su `source` de Google; 1998; 3 min a pie de Santo Domingo; la de 1998 va sin `unit`) y una `description` de dos párrafos con una palabra larga sin espacios para la prueba de 320 px. Todas con `source`: con él ninguna variante avisa.

## Peso

`dist/marketing.js` pesa **17 446 B gzip** (`medido`, 2026-10-22, según `GbStats.meta.json`; tope conjunto de la entrada **18 432 B**, DECISIONS #844). Una variante importada sola (esbuild minificado, `vue` y `@grana/vue*` externos): `GbStats01` 1229 B, `GbStats02` 1265 B, `GbStats03` 1353 B; tope por variante 4096 B. `@grana/vue` es *peer*: lo paga la aplicación.

## Alcance

- **Sin contadores animados ni formato de números** (#820): el bloque no cambia la cifra que le das.
- **Una banda de marca por página** (R5): 02 y `GbCta01` compiten; el aviso S2 lo dice.
- **Sin CSS ni utilidades** (#763, #807). Las únicas clases que escribe son las pistas `g-adapt-*` de `GAdaptiveLayout`; la banda a sangre es `g-bleed` en tu raíz.
- **Sin `fetch`, sin estado de negocio, sin región viva propia** (#780, #792).
- **Límite aceptado:** en oscuro, el trazo interior de la zona plana de 02 también se ve en los lados de una banda a sangre; quitarlo dejaría la banda sin separarse de la página arriba y abajo.

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbStats` (tres variantes con el mismo banco, sin avisos, `props` compartidas, `GMetric` por cifra con `context` = `source`, párrafos de 03 dentro de una `GText` `div`, banda de 02 en zona de marca, 03 sin `description` igual a 01, sin temporizadores al montar, SSR) | 42/42 (`npm test -w @grana/blocks`, 2026-10-22) | `prueba` |
| Verificador propio de la familia con `GText` real, 27 variantes, tema por defecto, rústico y lujo, claro y oscuro | 4327/4327 en Chromium, Firefox y WebKit (coco, addendum de `design/lab/blocks/marketing/auditoria.md`, tras baea37f) | `medido` |
| Veredicto de coco | Stats puede pasar a `candidate`: MK-L1 en 0; MK-C1, MK-C2 y MK-C3 cerrados | auditoría |

**No verificado:** lector de pantalla real (el orden etiqueta, cifra, unidad y contexto de cada métrica); `forced-colors` en Firefox y WebKit; teléfono real y puntero grueso.

**Pendientes abiertos:** MK-L2 (filas de tarjetas de distinto alto) no afecta a Stats. B-L1 a B-L7 en `design/contracts/blocks/_comun.md` §11.

## Fuentes

- Contrato: [`design/contracts/blocks/stats.md`](../../../../../design/contracts/blocks/stats.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§11 B-L5, reparto de `GText`).
- Decisiones: #815 a #817, #820, #829, #830, #841, #844, #851 a #856 en `DECISIONS.md`.
- Metadatos: [`GbStats.meta.json`](./GbStats.meta.json). Pruebas: [`GbStats.test.js`](./GbStats.test.js). Auditoría: [`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md).
