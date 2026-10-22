# GbFaq · GbFaq01, GbFaq02 y GbFaq03

Las preguntas que el viajero haría por WhatsApp, contestadas en la página: **plegadas con su primera línea a la vista, todas abiertas o con un buscador**, y cada respuesta con su propio enlace. El bloque compone `GSection`, `GAccordion` y `GAccordionItem`, `GContainer`, `GStack`, `GInput`, `GEmpty` y `GText`; no trae color, CSS ni textos propios (el tema lo pone y lo que no viene en tus datos va en `labels`).

**Etiquetas:** `<gb-faq-01>`, `<gb-faq-02>`, `<gb-faq-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/marketing`

```js
import { GbFaq01, GbFaq02, GbFaq03 } from '@grana/blocks/marketing'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/marketing/faq.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**Cada respuesta tiene su enlace, y asoma cerrada** (DECISIONS #823). Con `id` en la pregunta, queda un ancla estable (`#mascotas`): quien atiende el WhatsApp contesta con `…/preguntas#mascotas` y la persona llega **a la respuesta abierta**. Cerrada, la primera línea de la respuesta ya está a la vista (muchas veces basta) y la búsqueda del navegador encuentra el texto plegado (`hidden="until-found"`). El buscador de 03 mira también dentro de las respuestas y no mueve nada mientras se escribe.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbFaqProps`, el mismo objeto `props` de `props.js`). Lo que una forma no usa, lo ignora.

| Variante | Concepto | Compone | Usa | Ignora |
| --- | --- | --- | --- | --- |
| `GbFaq01` | Acordeón: plegadas, cada una con su primera línea a la vista | `GSection` > `GAccordion` (un nivel por debajo) > `GAccordionItem` (`id` = `faq.id`, `title` = `question`, `peek` = primer párrafo de `answer`) > párrafos | `title`, `description`, `items` | `labels` |
| `GbFaq02` | Todo a la vista: todas abiertas, una tras otra, a medida de lectura | `GSection` > `GContainer width="reading" horizontal="start"` > `GStack as="ul" divided` > `li` > `GSection` anidada (`id` = `faq.id`, `title` = `question`) > párrafos | `title`, `description`, `items` | `labels` |
| `GbFaq03` | Con buscador: el acordeón de 01 con un campo que filtra mientras se escribe | `GSection` > `GInput type="search"` (`output` = la cuenta) + el `GAccordion` de 01 con las que coinciden; sin coincidencias, `GEmpty cause="filtered"` | todas | — |

- **`answer` es texto plano:** cada bloque separado por una línea en blanco es un `p`. Para enlaces o listas, el slot `answer`.
- **Títulos:** la pregunta es un nivel por debajo del título de la sección; en 01 y 03 baja al tamaño de cuerpo con peso de título dentro de una `GSection` (MK-C5, cerrado con #848).
- **La columna de 02 va al inicio** (`horizontal="start"`, #845): centrada flotaría 160 px a la derecha del título de la sección a 1440 px.

### Buscador (03)

- **Coincidencia:** lo escrito, sin mayúsculas ni diacríticos, contenido en `question` o en `answer`. Las que no coinciden **no se pintan** (están fuera del orden de lectura); las abiertas siguen abiertas; **ninguna se abre sola** al coincidir.
- **Cuenta:** el `output` del campo dice `labels.matches({ count, total })` 300 ms después de la última tecla y nada con el campo vacío. Es la única voz: el bloque no tiene región viva propia.
- **Vacío:** `GEmpty cause="filtered"`; su acción de borrar vacía el campo y devuelve el foco al campo. Los textos salen de `labels.none` y `labels.clear`.
- **Sin envío:** el campo no está en un `form` y Intro no hace nada.

## Dónde va `GText`

`GText` es la primitiva de texto suelto de `@grana/vue` ([`GText/README.md`](../../../../vue/src/components/GText/README.md)). Aquí envuelve las respuestas:

| Variante | Texto suelto | `GText` |
| --- | --- | --- |
| 01 y 03 (panel de `GAccordionItem`) | Los `p` de `answer` (y el slot `answer`) | `as="div"` envolviendo los párrafos o el slot |
| 02 (cuerpo de la `GSection` anidada) | ídem | `as="div"` envolviendo los párrafos o el slot |

- **`as="div"` porque lleva párrafos dentro:** un `p` dentro de un `p` sería HTML no válido.
- Entre párrafos queda la pausa de `body` y ninguna antes del primero ni tras el último. El slot `answer` recibe la misma tipografía. En 02 las respuestas quedan en `body` del tema (en un tema con otra escala ya no caen a 16 px fuera de ella).
- El `peek` es de un slot de `GAccordionItem` con rol propio: **no** lleva `GText`.

## Uso

```vue
<script setup>
import { GbFaq01 } from '@grana/blocks/marketing'

const faq = {
  title: 'Preguntas frecuentes',
  description: 'Lo que suelen preguntarnos por WhatsApp antes de llegar.',
  items: [
    { id: 'mascotas', question: '¿Aceptan perros o gatos?', answer: 'Sí, una mascota pequeña por habitación, avisando al reservar.\n\nNo cobramos suplemento; solo pedimos que no se quede sola en el cuarto.' },
    { id: 'llegada', question: '¿A qué hora puedo llegar?', answer: 'La habitación está lista a partir de las 15:00.' },
    { id: 'factura', question: '¿Emiten factura?', answer: 'Sí.' }
  ]
}
</script>

<template>
  <GbFaq01 v-bind="faq" />
</template>
```

El mismo `faq` sirve para `GbFaq02` y, añadiéndole `labels`, para `GbFaq03`.

## Ejemplos

### e1 · Muchas preguntas sin pared de texto (`GbFaq01`)

**Por qué:** cuando hay más de cuatro preguntas y la primera línea de cada respuesta ya contesta a muchos. Cada una asoma cerrada con esa línea; un enlace con `#mascotas` abre justo esa.

```vue
<GbFaq01 v-bind="faq" />
```

### e2 · Pocas preguntas que se leen de corrido (`GbFaq02`)

**Por qué:** cuando son pocas y quieres que la persona las lea todas sin pulsar nada. Van abiertas, a medida de lectura, con una línea entre ellas; la columna arranca a ras del título de la sección.

```vue
<GbFaq02 v-bind="faq" />
```

### e3 · Cuarenta preguntas y un buscador (`GbFaq03`)

**Por qué:** cuando la lista es larga y la persona sabe qué busca. El campo filtra en `question` y en `answer`, sin mayúsculas ni acentos («nino» encuentra «niños»), y dice cuántas coinciden sin mover nada. Los cuatro textos de `labels` son obligatorios aquí.

```vue
<GbFaq03
  v-bind="faq"
  :labels="{
    search: 'Buscar en las preguntas',
    matches: '{count} de {total} preguntas',
    none: 'Ninguna pregunta coincide',
    clear: 'Borrar búsqueda'
  }"
/>
```

### e4 · Una respuesta con enlace (slot `answer`)

**Por qué:** cuando la respuesta lleva un enlace o una lista que el texto plano no cubre. El slot sustituye el contenido de la respuesta (dentro de la misma `GText`); el título, el ancla y el avance cerrado siguen saliendo de los datos, y el `peek` sale del primer párrafo de `answer`.

```vue
<GbFaq01 v-bind="faq">
  <template #answer="{ item }">
    <p>{{ item.answer }} <a href="/cancelacion">Condiciones de cancelación</a></p>
  </template>
</GbFaq01>
```

## Props

Una sola interfaz para las tres variantes (`GbFaqProps`). `Faq` y `FaqLabels` salen de `@grana/blocks/marketing`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | El título de la sección (`GSection`) |
| `description` | `string` | Descripción de la sección; el slot `description` la sustituye |
| `items` | `Faq[]` (requerida) | De 1 a 40 (por encima de 40, aviso C7 y se pintan todas) |
| `labels` | `FaqLabels = {}` | Los textos del buscador de 03: `search`, `matches`, `none` y `clear`; 01 y 02 los ignoran |

`Faq` es `{ id?, question, answer }`. `id` es el ancla estable de la pregunta: un identificador sin espacios. `FaqLabels` es `{ search?, matches?, none?, clear? }`; `matches` es una cadena con `{count}` y `{total}` o una función `({ count, total }) => string`.

## Eventos

`GbFaq` no emite eventos propios: abrir y cerrar es estado del acordeón y buscar no es una intención para tu aplicación.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `answer` | `{ item: Faq }` | Contenido rico de la respuesta (enlaces, listas), dentro de la `GText`. En 01 y 03 el `peek` sigue saliendo del primer párrafo de `answer` en texto |
| `description` | — | Sustituye a la prop `description` en la `GSection` |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `search`, `matches`, `none`, `clear` | Sí, en 03 (C5; sin `search`, el campo no tiene nombre: se pinta con la etiqueta vacía) |

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md)) sobre las 27 variantes de Marketing, tres motores, tres temas, claro y oscuro:

a. Preguntas como encabezados un nivel por debajo de la sección y sin saltos; dentro de una `GSection` de la aplicación (`?anidado=1`), el nivel baja solo (`medido`, auditoría).
b. Contraste de todo el texto pintado de Marketing de 4,68:1 como mínimo, también el avance cerrado en `text-muted` y el vacío del buscador (`medido`, auditoría).
c. En 03, la cuenta de coincidencias va en el `output` del campo, la única región viva; «Borrar búsqueda» mide al menos 24 px y devuelve el foco al campo (`medido`, auditoría).
d. Una respuesta cerrada se encuentra con la búsqueda del navegador (`hidden="until-found"`) y un `#id` en la URL abre esa respuesta en 01 y 03: es comportamiento de `GAccordionItem`, auditado con el componente; sobre el bloque real, `sin verificar` (el contrato lo pide en Chromium y la auditoría no lo midió).
e. Sin desplazamiento horizontal a 1440, 390 y 320 px, ni a 320 con el texto al 200 % (`medido`, auditoría).
f. Movimiento: el de `GAccordion` «Avance», auditado en la rúbrica de movimiento de la auditoría; el bloque no añade ninguno, y mientras se escribe en el buscador nada se mueve.

> **Peligro.** Una pregunta sin `id` se pinta (aviso Q1), pero no se puede enlazar: la respuesta de WhatsApp «mira esto» no llega a ninguna parte. Y en 03, sin `labels.search` el campo de búsqueda no tiene nombre accesible: quien usa lector de pantalla encuentra un campo sin etiqueta.

## Avisos de desarrollo

Prefijo `[Grana GbFaq<NN>]`, una vez por instancia y motivo, solo en desarrollo.

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| C1 | `items` vacío | No pinta nada |
| C2 | Una pregunta sin `question` o sin `answer` | Esa pregunta se omite |
| C3 | `id` repetido | Se usa el índice |
| C5 | En 03, falta un texto de `labels` | Se pinta sin él |
| C7 | Más de 40 preguntas | Se pintan todas |
| Q1 | Una pregunta sin `id` | Se pinta sin ancla estable |
| Q2 | Un `id` que no es un identificador válido de fragmento (con espacios) | Se pinta sin ancla |

## Banco de datos de ejemplo

`faq.bank.js` exporta `{ props, slots }`: ocho preguntas de Casa Alcalá con `id` (`mascotas`, `estacionamiento`, `llegada`, `desayuno`, `ninos`, `cancelacion`, `factura`, `idiomas`), una respuesta de tres párrafos, una en inglés con una palabra larga sin espacios para la prueba de 320 px, una mínima («Sí.») y `labels` completos. Búsquedas de prueba: «mascota» (1), «MASCOTA» (1), «nino» con «niños» en el texto (1) y «xyz» (vacío). Con él ninguna variante avisa.

## Peso

`dist/marketing.js` pesa **17 446 B gzip** (`medido`, 2026-10-22, según `GbFaq.meta.json`; tope conjunto de la entrada **18 432 B**, DECISIONS #844). Una variante importada sola (esbuild minificado, `vue` y `@grana/vue*` externos): `GbFaq01` 1478 B, `GbFaq02` 1445 B, `GbFaq03` 1946 B; tope por variante 4096 B. `@grana/vue` es *peer*: lo paga la aplicación.

## Alcance

- **Sin envío ni eventos:** el buscador no está en un `form` y no avisa a tu aplicación de lo que se escribe.
- **El corte del avance a una línea es de `GAccordion`** (#483), no del bloque; que `GAccordion` lea solo el nivel de su sección es B-L4 (reservado; `useSectionLevel()` lo resuelve para quien lo lee).
- **Sin CSS ni utilidades** (#763, #807). Las únicas clases que escribe son las pistas de `GAdaptiveLayout`.
- **Sin `fetch`, sin estado de negocio, sin región viva propia** (#780, #792).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbFaq` (tres variantes con el mismo banco, sin avisos, `props` compartidas, `id` en el elemento o la sección, respuesta dentro de una `GText` `div`, `peek`, búsqueda sin diacríticos ni mayúsculas, cuenta tras 300 ms con temporizadores falsos, vacío con `GEmpty` y `clear`, ninguna se abre sola, SSR) | 46/46 (`npm test -w @grana/blocks`, 2026-10-22) | `prueba` |
| Verificador propio de la familia con `GText` real, 27 variantes, tema por defecto, rústico y lujo, claro y oscuro (8 `GText` reales en FAQ 02, 0 `p` desnudos; FAQ 02 con las respuestas a `space × 3`) | 4327/4327 en Chromium, Firefox y WebKit (coco, addendum de `design/lab/blocks/marketing/auditoria.md`, tras baea37f) | `medido` |
| Veredicto de coco | FAQ puede pasar a `candidate`: MK-L1 en 0; MK-B2 y MK-C5 cerrados | auditoría |

**No verificado:** lector de pantalla real (la cuenta del buscador en el `output`, el título de la pregunta como encabezado); la búsqueda del navegador sobre texto plegado y `#mascotas` en la URL sobre el bloque real, en los tres motores; `forced-colors` en Firefox y WebKit; teléfono real y puntero grueso.

**Pendientes abiertos:** ninguno de la auditoría afecta a FAQ. B-L1 a B-L7 en `design/contracts/blocks/_comun.md` §11.

## Fuentes

- Contrato: [`design/contracts/blocks/faq.md`](../../../../../design/contracts/blocks/faq.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§11 B-L5, reparto de `GText`).
- Decisiones: #815 a #817, #823, #841, #844, #845, #848, #851 a #856 en `DECISIONS.md`.
- Metadatos: [`GbFaq.meta.json`](./GbFaq.meta.json). Pruebas: [`GbFaq.test.js`](./GbFaq.test.js). Auditoría: [`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md).
