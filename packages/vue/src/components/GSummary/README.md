# GSummary

El **resumen de una entidad** (persona, paciente, diagnóstico, cliente, producto): identidad, título, línea secundaria, **datos con prioridad** y estado, que se adapta **al ancho de su propio contenedor y al texto real**. Decide qué se ve y qué calla, nunca desborda y nunca deja al lector de pantalla sin un dato.

No es una tarjeta: no tiene superficie, selección, enlace ni media. Es **contenido de frase** (`span`) que vive dentro de una opción, un campo, una celda, una tarjeta o un panel. No tiene eventos, teclado ni foco propios.

**Etiqueta:** `<g-summary>` · **Estado:** `candidate` (auditoría de coco aprobada, sin defectos bloqueantes; ver [`design/lab/summary/auditoria.md`](../../../../../design/lab/summary/auditoria.md)) · **Desde:** 0.1.0 · **Entrada:** paquete principal `@grana/vue`

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`, sección `GSummary`, y el banco `summary.html`). Exige Vue `^3.5.0` y un navegador actual: la ficha usa la unidad `lh` y `:has()`.

## Qué la hace distinta: prioridad líquida

Una tarjeta de resumen habitual tiene dos maquetas y un umbral que las cambia, o deja que el texto se parta y crezca. `GSummary` no tiene maquetas ni umbrales: siempre es **identidad, título y una corriente de datos en orden de prioridad**, y en cada ancho contesta «qué cabe aquí, con este texto».

- Al estrechar, la corriente se bebe **por el final**, dato a dato. Antes de soltar el primero, **calla los rótulos que se explican solos** («22 años», «Dra. Ruiz»). «+N» dice cuántos no se ven.
- Al ensanchar, cada dato que vuelve a caber **entra deslizándose** desde su sitio.
- **Ceder no es ocultar:** todo lo cedido sigue en el árbol de accesibilidad.
- Entre fichas vecinas con el **mismo título** (homónimos), lo que **distingue** a cada una pesa y lo que **comparten** se apaga (el contraste entre homónimos, `diff`).

Medido sobre la opción de una lista (cuatro datos): se ven **1 de 4 datos a 240 px, 2 de 4 a 360 px y 4 de 4 a 520 px**, con el mismo alto y sin desborde.

## Uso

```js
import { createApp } from 'vue'
import Grana, { summaryDiff } from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')   // install registra <g-summary> / <GSummary>
```

También se puede importar solo el componente: `import { GSummary, summaryDiff } from '@grana/vue'`.

```vue
<script setup>
const datos = [
  { label: 'Expediente', short: 'Exp.', value: '001000', priority: 1 },
  { label: 'Edad', value: '22 años', bare: true },
  { label: 'Última visita', value: '03/02/2026' },
  { label: 'Médico', value: 'Dra. Ruiz', bare: true }
]
</script>

<template>
  <!-- Una fila de dos líneas: título y una línea de datos. 44 px de alto en cualquier ancho -->
  <g-summary title="María García López" avatar :facts="datos"></g-summary>

  <!-- Con código, estado y línea secundaria -->
  <g-summary
    code="E11.9" title="Diabetes mellitus tipo 2" subtitle="Sin complicaciones"
    icon="user" :status="{ label: 'Activo', color: 'success' }" :facts="datos"
  ></g-summary>
</template>
```

> **En plantillas dentro del HTML** (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-summary ...></g-summary>`.

### Cuándo usarla (y cuándo no)

| Necesidad | Usar | Relación |
| --- | --- | --- |
| Resumir una entidad dentro de un espacio de ancho que no controlas (opción, campo, celda) | **`GSummary`** | Elige qué cabe y dice cuánto calla |
| Contenedor con superficie, selección, enlace, media o acciones | [`GCard`](../GCard/README.md) o [`GSurface`](../GSurface/README.md) | **La ficha va dentro**, en el slot por defecto. No sustituye a `title`/`meta` de `GCard` |
| Todos los pares clave-valor, siempre visibles | [`GDataList`](../GDataList/README.md) | Intacta. La ficha elige cuáles caben |
| Una cifra protagonista con tendencia | [`GMetric`](../GMetric/README.md) | Intacta |
| Solo la identidad (la cara) | [`GAvatar`](../GAvatar/README.md) | La ficha lo compone |
| Título y subtítulo en una celda, sin datos | Columna compuesta de [`GTable`](../GTable/README.md) | La ficha entra por `cell-{key}` cuando hay datos que priorizar |
| Opción, valor y vista previa de `GCombobox` | **`GSummary`** (ya va por dentro) | Ver «Dentro de `GCombobox`» |

Frente a una **fila de tabla**, la ficha no reparte el ancho en columnas fijas: cada dato sigue el orden de prioridad, no una posición. Frente a una **tarjeta**, no tiene superficie ni interacción: es lo que va dentro.

## Los tres `layout`

El anfitrión decide el `layout` (conoce su fila); **la ficha nunca lo cambia sola** (no hay `auto` ni umbrales).

| `layout` | Qué es | Alto | Dónde |
| --- | --- | --- | --- |
| `inline` | **Una línea**: identidad `xs`, [código] título, identificador y datos que ceden. El estado y la línea secundaria (si hay datos) solo los recibe el lector. Hereda tipografía del anfitrión | **Δ0**: no cambia el alto de su anfitrión (medido dentro de un campo `sm`, `md` y `lg`, en todos los anchos) | Dentro de un campo, una celda densa, un item de menú |
| `row` (por defecto) | Cabecera ([código] título, estado) y la corriente de datos, `lines` líneas en total | Con `lines: 2`, **constante en cualquier ancho** (con el tema por defecto: `xs`/`sm` 40, `md` y `lg` 44, `xl` 64 px). Con más líneas, como máximo `lines` | Opción, celda, fila de lista; con `lines` 3 o 4, tarjeta; con `0`, panel |
| `stack` | Cabecera y **rejilla de pares** (rótulo sobre valor). **No cede ni recorta**: crece en alto y los valores saltan de línea. Acción al pie | Variable | Vista previa, detalle, tarjeta de alto libre |

`stack` no es la identidad de la ficha: es **la vista completa**. Existe porque la corriente es menos escaneable cuando sobra sitio y porque la ficha recortada nunca es la única fuente de un dato.

```vue
<!-- inline: dentro de un campo, el alto del campo no cambia -->
<g-summary layout="inline" title="María García López" code="001000" avatar></g-summary>

<!-- row con lines 4: tarjeta; la secundaria se ve, y identificador y datos fluyen juntos -->
<g-summary layout="row" :lines="4" size="lg" title="María García López" subtitle="Medicina interna" avatar :facts="datos"></g-summary>

<!-- stack: vista previa completa, con acción -->
<g-summary layout="stack" title="María García López" avatar :facts="datos">
  <template #action><g-btn size="sm" variant="outline">Abrir expediente</g-btn></template>
</g-summary>
```

### `lines` (solo en `row`)

Líneas **totales** de la ficha (título más lo demás).

| `lines` | Qué pasa |
| --- | --- |
| `2` (por defecto) | Título y una línea de datos. Si hay datos, `subtitle` solo lo recibe el lector; sin datos, ocupa esa línea con elipsis |
| `3` o más | La línea secundaria (si existe) se ve; identificador y datos **fluyen juntos** en el resto de líneas (clase `g-summary--multi`). El alto es como máximo `lines` y solo **decrece** al ensanchar |
| `0` | Sin límite: la corriente ocupa lo que necesite (`g-summary--multi g-summary--free`) |
| `1`, negativo o no entero | Aviso y se usa `2` (una línea es `layout="inline"`) |

Fuera de `row`, `lines` se ignora con aviso.

### `size`

El lado de la identidad es `space × n` y el título cambia de escala. Sin `size`: `inline` `xs`, `row` `md`, `stack` `lg`.

| `size` | Identidad | Título | Datos y línea secundaria | Rótulos de `stack`, «+N» |
| --- | --- | --- | --- | --- |
| `xs` | `space × 5` | `body-sm` | `body-sm` | `caption` |
| `sm` | `space × 6` | `body-sm` | `body-sm` | `caption` |
| `md` | `space × 8` | `body` | `body-sm` | `caption` |
| `lg` | `space × 10` | `body` | `body-sm` | `caption` |
| `xl` | `space × 16` | `title-sm` (con `--g-font-title`) | `body-sm` | `caption` |

El título lleva siempre el peso `--g-text-title-sm-weight`. En `inline` la tipografía es **heredada del anfitrión** (el texto del campo y el de la ficha coinciden: al editar no hay salto) y `size` solo fija la identidad. Las cifras son tabulares en toda la ficha.

## Datos (`facts`)

```js
[
  { label: 'Expediente', short: 'Exp.', value: '001000', priority: 1 },
  { label: 'Edad', value: '22 años', bare: true },
  { label: 'Última visita', value: '03/02/2026' },
  { label: 'Médico', value: 'Dra. Ruiz', bare: true }
]
```

| Campo | Tipo | Qué |
| --- | --- | --- |
| `label` | String (obligatorio) | Rótulo y **clave** del dato (única en la ficha; para `diff`). Sin `label`, el dato se omite con aviso |
| `value` | String o Number (obligatorio) | Valor **ya formateado** por la aplicación (la ficha no formatea ni traduce). Vacío, `null` o `undefined`: el dato se omite sin aviso |
| `short` | String | Rótulo abreviado que se ve **en lugar** de `label` («Exp.»). El lector recibe ese mismo texto |
| `priority` | Number | Menor es más importante. Sin ella, después de los que la declaran, en el orden del arreglo. Los empates, por orden del arreglo |
| `bare` | Boolean | El valor **se explica solo** («22 años», «Dra. Ruiz»): su rótulo puede callarse a la vista antes de soltar un dato. `false` por defecto: «03/02/2026» sin rótulo es ambiguo |

- **El arreglo no se muta.** El DOM sigue el orden de prioridad: orden visual y orden de lectura coinciden (WCAG 1.3.2).
- **Identificador:** `code` si lo hay; si no, **el dato de mayor prioridad** (`is-anchor`). No hay prop aparte. Con `code`, ningún dato ancla.
- Los campos de más en un dato se ignoran. No hay slot por dato.

### Orden de cesión

Al estrechar, en este orden (contrato, medido en los tres motores):

1. Los **rótulos `bare`** dejan de verse, todos a la vez, en cuanto un dato no cabe (`data-terse`). El rótulo del **identificador** no se calla aquí.
2. Los **datos**, por el final (menor prioridad primero). Aparece «+N».
3. El **estado**, cuando el título ya no conserva su suelo a su lado (salta a una línea recortada de la cabecera). En `inline` nunca se ve.
4. El **título**, con elipsis, hasta su suelo: `7ch` en `row`, `4ch` en `inline`.
5. «+N» y el **rótulo del identificador** (`data-tight`). En `inline` y en `row` de una línea de datos, `data-tight` retira también de la vista los demás datos (si no, al callar el rótulo cabría otro dato y el orden se invertiría). En `inline`, el suelo del título cede aquí también.
6. El **valor del identificador**, con elipsis. Es lo último.

La **identidad** (el hueco inicial) no cede. En una línea, **el identificador gana al título**: entre cuatro «María García López», «Mar… 001000» distingue y «María García Ló…» no. El **código** no cede por reparto ante los demás datos; si él solo no cabe (por debajo de 160 px con `code` e icono, o un código muy largo), lleva elipsis y su `title` conserva el texto completo.

## Identidad: `avatar`, `icon`, slot `lead`

Precedencia del hueco inicial: **slot `lead`, luego `avatar`, luego `icon`**.

- `avatar: true` pinta un [`GAvatar`](../GAvatar/README.md) con `name` igual a `title`. Con un **objeto**, se pasan sus props (`src`, `name`, `initials`, `icon`, `color`, `categories`, `colorKey`, `shape`; sin identidad propia, `name = title`). **`size` y `label` del objeto se ignoran:** el lado es el de la ficha y la identidad es siempre decorativa.
- `icon` es un **nombre** de Lucide que resuelve [`GIcon`](../GIcon/README.md) (registro de la aplicación y luego la lista de la librería). Va en una caja `surface-sunken`; solo se usa si no hay `avatar`.
- El slot `lead` recibe `{ size }`. Un hijo directo `.g-avatar` manda su caja (el hueco pierde su marco, como en los demás componentes).

```vue
<!-- «building-complex» debe estar registrado con createIcons (ver GAvatar) -->
<g-summary title="Grana Labs" :avatar="{ icon: 'building-complex', shape: 'square' }" :facts="datos"></g-summary>
<g-summary title="María García López" :avatar="{ src: foto, colorKey: p.id, categories: 8 }"></g-summary>
```

## Estado (`status`)

`status` es `{ label, color? }` y se pinta como una [`GBadge`](../GBadge/README.md) `size="sm"` con `color` (`neutral` por defecto). Para otra cosa, el slot `status` (texto real, sin interactivos, una línea). En `inline` el estado solo lo recibe el lector.

**El estado es de lo primero que cede.** Si lo que dice es crítico (una alergia), ponlo como **dato con `priority` alta**, no como `status`.

## Contraste entre homónimos: `diff` y `summaryDiff`

Cuando una lista de resultados trae varias fichas con el mismo título, `summaryDiff` compara y la ficha pinta: el valor **único** en el grupo **pesa** (peso de título) y el que **comparten** se apaga (`text-subtle`). Las fichas sin homónimos no llevan marcas.

```vue
<script setup>
import { summaryDiff } from '@grana/vue'
import { computed } from 'vue'
const diffs = computed(() => summaryDiff(visibles.value))   // [{ Edad: 'same', Expediente: 'diff', … } | null, …]
</script>

<template>
  <g-summary v-for="(p, i) in visibles" :key="p.id" v-bind="p" :diff="diffs[i]"></g-summary>
</template>
```

- **Quién compara es el anfitrión de la lista** (ve a todas); la ficha solo pinta lo que recibe en `diff` (`{ [label]: 'same' | 'diff' }`). Una clave con otro valor se ignora con aviso.
- `summaryDiff(list)` es una **función pura**: recibe objetos con `title` y `facts` y devuelve un arreglo paralelo con el `diff` de cada uno, o `null` si no tiene homónimos.
  - **Homónimos:** mismo `title` sin acentos ni mayúsculas, recortado y con los espacios colapsados.
  - Un valor es `diff` si ninguna otra ficha del grupo lo tiene en un dato con el **mismo `label`**; es `same` si lo comparte. Un dato que las otras no tienen es `diff`. Los datos sin valor no entran.
- **Solo entre fichas a la vista:** comparar con resultados que el usuario no ve produce marcas que no se explican.
- El identificador conserva siempre su peso y nunca se apaga. Aplica en los tres `layout`.
- **`diff` no cambia la cesión:** no reordena ni protege datos. Lo que distingue se asegura con `priority`.
- **Nunca solo color:** lo único pesa y lo compartido se apaga por tono (WCAG 1.4.1). Con un tema cuyo peso de título sea igual al del cuerpo, lo único se distingue solo por tono.

## Coincidencia: `highlight`

Con texto, la ficha marca con `<mark class="g-summary__mark">` la **primera aparición de cada palabra** (sin acentos ni mayúsculas) en `title`, `code`, `subtitle` y los **valores** de los datos (no en los rótulos). La marca es **peso de título y subrayado**, no color. Si la forma sin acentos no mide lo mismo que el texto, no se marca. No busca ni filtra: solo pinta.

```vue
<g-summary v-for="o in resultados" :key="o.id" v-bind="o" :highlight="texto"></g-summary>
```

## Ficha suelta: `group`

Con `group`, la raíz lleva `role="group"` y `aria-labelledby` apuntando al título (`id` generado con `useId`, estable en la hidratación). Úsalo para una ficha **suelta** (tarjeta, vista previa, lista propia). **Nunca** dentro de un anfitrión interactivo (`option`, `button`, `a`) ni de un contenedor `aria-hidden`. No es `article` ni lleva encabezado: si hace falta uno, lo pone el anfitrión (`GCard` con `headingLevel`). `group` sin `title` avisa.

## Carga y vacío

- **`loading`:** `aria-busy="true"` y formas decorativas (`aria-hidden`) del alto del `layout`; no pinta contenido ni mide. Medido: el alto es **Δ0** al llegar los datos en `row` `lines: 2`, `inline` y `row` con `lines: 4` (al máximo). El anuncio de «cargando» es del anfitrión (no hay región viva en la ficha). Sin pulso: la carga no tiene movimiento.
- **Vacío:** sin `title` y con `placeholder`, pinta ese texto atenuado en el sitio del título («Sin paciente»), conservando la identidad si la hay. Sin `title`, sin `placeholder` y sin `loading`, no pinta nada y avisa. El `placeholder` lo entrega la aplicación (la ficha no tiene textos propios, así que no hay `labels`).

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `title` | String | nombre de la entidad | sin valor |
| `subtitle` | String | línea secundaria | sin valor |
| `code` | String | identificador corto («E11.9»); va antes del título y no cede | sin valor |
| `avatar` | Boolean o Object | `true` o props de `GAvatar` | `false` |
| `icon` | String | nombre de Lucide | sin valor |
| `facts` | Array | `[{ label, value, short?, priority?, bare? }]` | `[]` |
| `status` | Object | `{ label, color? }` | sin valor |
| `layout` | String | `inline` `row` `stack` | `row` |
| `lines` | Number | `0` o entero ≥ 2 (solo `row`) | `2` |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `inline` `xs`, `row` `md`, `stack` `lg` |
| `diff` | Object | `{ [label]: 'same' \| 'diff' }` | sin valor |
| `highlight` | String | texto buscado | sin valor |
| `group` | Boolean | | `false` |
| `loading` | Boolean | | `false` |
| `placeholder` | String | texto para la ficha vacía | sin valor |

`layout` y `size` fuera de su lista muestran la advertencia de Vue (`layout="panel"` y `"auto"` están reservados y se rechazan). **No existen** `label` ni `description` (son `title` y `subtitle`; en Grana `label` es el nombre accesible de un control), `labels`, `color`, `variant`, `density`, `rounded`, `disabled`, `href`, `selected`, `modelValue`, `heading`, `locale` ni `anchor`. Reservados sin implementar: `align`, `heading`, `expandable`, `surface`, `layout="panel"` y `"auto"`, y un slot por dato.

Los atributos (`class`, `style`, `id`, `data-*`, `aria-*`, `lang`, `dir`) van a la raíz.

## Slots

| Slot | Propósito | Alcance | Notas |
| --- | --- | --- | --- |
| `lead` | Identidad propia (sustituye a `avatar` e `icon`) | `{ size }` | Dentro de `g-summary__lead` (`aria-hidden`): decorativo, sin interactivos |
| `status` | Estado propio (sustituye a la `GBadge` de `status`) | | Texto real (se lee), sin interactivos, una línea |
| `action` | Acción al pie | | **Solo en `stack`.** En `inline` y `row` no se pinta y avisa. Nunca dentro de un anfitrión interactivo |

Un slot vacío (comentarios, espacios) cuenta como ausente. No hay slot por defecto.

## Eventos y teclado

**Ninguno.** La ficha no es interactiva y el recorte no es una intención del usuario: no hay evento por cambio de tamaño ni por «+N». Todo lo que llegue por `$attrs` va a la raíz. No tiene foco propio: los controles del slot `action` son de la aplicación. En `inline` y `row` no hay `action` porque un control recortado seguiría recibiendo foco sin verse.

## Accesibilidad

```html
<span class="g-summary g-summary--layout-row g-summary--size-md" style="--_lines: 1">
  <span class="g-summary__lead" aria-hidden="true">…</span>
  <span class="g-summary__body">
    <span class="g-summary__head">
      <span class="g-summary__name">
        <span class="g-summary__code" dir="auto">E11.9</span><span class="g-summary__sep"> </span>
        <span class="g-summary__title" dir="auto">María García López</span><span class="g-summary__sep">; </span>
      </span>
      …
    </span>
    <span class="g-summary__data">…<span class="g-summary__more" aria-hidden="true" hidden>+2</span></span>
  </span>
</span>
```

- **Todo `span`** (y `mark`): contenido de frase, válido dentro de `option`, `button`, `a` y `td`. **Dentro de un anfitrión interactivo no lleva roles**: el nombre accesible del anfitrión es su texto, que **incluye todos los datos con sus rótulos**, se vean o no.
- **Todo lo cedido se lee.** Los datos recortados por `overflow`, los rótulos callados, el estado y la línea secundaria en `inline` están en el árbol de accesibilidad. Lo que se retira de la vista sin recorte usa el patrón de texto oculto accesible; nunca `display: none` ni `visibility: hidden` (la excepción es «+N», que es decorativo). Comprobado en los tres motores en el barrido del banco: ningún dato con `display: none`, `visibility: hidden` ni ancestro `aria-hidden`, y la opción con los cuatro datos a 240 px se lee entera en el árbol de accesibilidad de Playwright.
- **«+N» es decorativo** (`aria-hidden`), porque el lector ya recibe todos los datos. Es texto, no un pictograma, y no existe sin recorte (`hidden`) ni en estado apretado. **No se localiza** (cifras latinas).
- **Separadores para el lector:** cada parte termina con un separador oculto (`g-summary__sep`, «; »), para que el nombre de una opción no se lea «001000Edad». Es puntuación, no texto de interfaz.
- **Identidad decorativa:** `aria-hidden` en el hueco inicial; el título ya nombra.
- **Sin `dl`:** dentro de `option` no es válido; cada dato se lee «rótulo valor».
- **`title` nativo** solo en lo que lleva elipsis (título, código, identificador, y los datos o la secundaria cuando se cortan), con el texto completo. Es ayuda de **puntero**: no llega a teclado ni a táctil. Por eso **la ficha recortada nunca es la única fuente de un dato**: el anfitrión ofrece la vista completa (`stack`, vista previa, detalle).
- **Bidi:** título, línea secundaria, código, rótulo y valor llevan `dir="auto"`. Medido con árabe, hebreo y latino en contenedor RTL a 160, 240, 360 y 520 px: el rótulo queda a la derecha del valor, la identidad a la derecha, el filete al inicio y el anfitrión no se desplaza (el texto oculto va contenido en su parte).
- **Mínimos** (auditoría de coco, tres motores): texto ≥ 12 px en todo (el rol más pequeño es `caption`); sin desplazamiento horizontal a 320 px; la ficha no aporta ancho a su anfitrión.
- **Contraste** (compuesto real, 26 configuraciones en Chromium: el tema por defecto y el de auditoría, claro y oscuro, y los once temas generados): título y valor único ≥ 13,65:1; código y marcador vacío ≥ 6,47:1; rótulo y valor compartido **5,05:1** sobre `bg` y **4,70:1** sobre `surface-sunken` con el tema por defecto; «+N» **4,51:1** (el mínimo medido). **Sobre `--g-color-selection` rótulo y compartido miden 4,43:1** (tema por defecto; 4,47 con el tema de auditoría): menos de 4,5. La ficha no reapunta sola: el **anfitrión** que la pinta sobre la selección reapunta esos tonos a `--g-color-text-muted` (lo hace `GCombobox`, ver más abajo). Con `prefers-contrast: more` (emulado) rótulo y compartido pasan a `text-muted` y todo queda ≥ 4,5:1.
- **`forced-colors`** (emulado, Chromium y Firefox; en WebKit solo se comprueban las reglas propias): filete y «+N» (borde y texto) en `CanvasText`, caja del icono con contorno `CanvasText`, formas de carga en `GrayText`, el peso de lo único (600 frente a 400) y el subrayado de la coincidencia se conservan.

## Personalidad

Una sola pieza de movimiento, el resto es forma y peso (DECISIONS #349 a #357):

1. **Prioridad líquida.** Sin maquetas ni umbrales: la corriente de datos se bebe por el final, y antes de soltar un dato se callan los rótulos que se explican solos. El orden de cesión es contrato y se midió de 160 a 720 px en el tema por defecto y en uno distinto (espaciado 5, cuerpo de 17 px, Georgia): sin desborde, sin datos cortados a medias, identificador entero y anclado, «+N» igual a lo recortado, y los recortados son siempre el final de la prioridad.
2. **Contraste entre homónimos.** Lo único pesa, lo compartido se apaga: una lista de resultados se vuelve una comparación sin abrir nada.
3. **Filetes cortos.** Los datos se separan con un filete de `--g-border-width` en `border-strong`, `space × 1` más corto que la línea por arriba y por abajo, no con un carácter ni una raya de lado a lado: la corriente se lee como una frase con pausas. Es un pseudoelemento con propiedades lógicas, así que se espeja en RTL sin reglas propias.
4. **El identificador manda.** Su valor va en peso de título y su rótulo en `text-subtle`; nunca se apaga, ni siendo compartido entre homónimos.
5. **«+N» es el único acento de color:** una píldora `accent-soft` / `on-accent-soft` que dice «hay más» sin competir con los datos.
6. **El dato que vuelve entra deslizándose.** Al **ensanchar**, cada dato que pasa de recortado a visible entra desde el **inicio** de su sitio (izquierda en LTR, derecha en RTL): opacidad de 0 a 1 y un desplazamiento de `--g-space-1 × 3`, con `--g-duration-slow` y `--g-ease-out`. Como su sitio ya era suyo, no hay salto de layout. Medido: 240 ms con el tema por defecto, desde −12 px (+12 px en RTL; ±15 px con `space` 5), con opacidad 0,78 al 25 %. **Salir no se anima.** No hay muelle ni rebote.

**Cuándo entra y cuándo no:** solo por un **cambio de tamaño** entre dos anchos reales. Nunca al montar, al mostrarse, al cambiar los datos ni con `prefers-reduced-motion: reduce`. Con `reduce` no se pone el atributo `data-enter` ni hay animación: el dato aparece en su sitio. Comprobado en los tres motores: al ensanchar de 190 a 520 px hay datos entrando en al menos dos posiciones intermedias, terminan en cero y el atributo se retira; nada al montar y nada con `reduce`.

## Dentro de `GCombobox`

`GCombobox` ya usa la ficha por dentro (DECISIONS #356): opción por defecto en `row` con `lines: 2` (`md`; `sm` con el campo en `xs` o `sm`), ficha del valor en `inline` `xs` dentro de la ficha (`__token`) del campo y vista previa en `stack` `lg`. El mapeo de campos de la opción no cambia (`label` a `title`; `description` a `subtitle` solo si no trae `facts`; `code`, `avatar`, `icon` y `facts` tal cual) y, **en la opción, `facts` admite `priority`, `short` y `bare`** de forma aditiva. Recibe `highlight` con el texto buscado y `summaryDiff` sobre las opciones pintadas. `GCombobox` reapunta rótulo y compartido a `text-muted` sobre la ficha seleccionada. Los slots `option`, `value` y `preview` de `GCombobox` siguen ganando, y la `GSummary` pública se puede usar dentro de ellos.

`GCombobox` aún no tiene README propio; el detalle normativo está en [`design/contracts/combobox.md`](../../../../../design/contracts/combobox.md) y la nota sobre `priority`, `short` y `bare` queda pendiente para su README.

## Tema

La ficha solo lee tokens `--g-*` y alias locales `--_su-*` y `--_lines`; **no añade tokens nuevos**. No usa valores de respaldo. Los literales de unidad (`7ch` y `4ch` de suelo del título, `1lh`) no son medidas de tema; tampoco el mínimo de columna de la rejilla de `stack` (`space × 28`) ni el desplazamiento de entrada (`space × 3`).

| Token | Para qué |
| --- | --- |
| `--g-space-1` a `--g-space-4` | Lado de la identidad (`× 5, 6, 8, 10, 16`), separaciones, columnas de `stack` |
| `--g-font-ui`, `--g-font-title` | Familia de la ficha; título en `xl` |
| `--g-text-body-*`, `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-title-sm-*` (tamaño, interlineado, peso, tracking) | «Tamaños». Peso de título: `--g-text-title-sm-weight` |
| `--g-color-text-muted`, `--g-color-text-subtle` | Línea secundaria y código; rótulos y valores compartidos. El color de título y valores se hereda del anfitrión |
| `--g-color-border-strong` | Filete entre datos y formas de carga |
| `--g-color-border-control` | Contorno de la caja del icono |
| `--g-color-accent-soft`, `--g-color-on-accent-soft` | «+N» (par garantizado ≥ 4,5:1) |
| `--g-color-surface-sunken` | Caja del icono de identidad |
| `--g-radius-pill`, `--g-radius-sm`, `--g-radius-xs` | «+N»; caja del icono; formas de carga |
| `--g-border-width` | Filete; subrayado de la coincidencia |
| `--g-duration-slow`, `--g-ease-out` | Entrada del dato que vuelve |

**Reglas de tematización:** el tema de la aplicación va sin capa y siempre gana a `grana.defaults`. Los tonos de la ficha sobre otra superficie (opción activa invertida, selección) los reapunta el **anfitrión** con selectores propios sobre las clases de las partes; `GSummary.css` no conoce a ningún anfitrión. Las clases de las partes (`g-summary__title`, `__fact-label`, `is-same`…) son contrato público para los anfitriones de Grana.

## Clases y atributos medidos

`g-summary`, `g-summary--layout-{inline|row|stack}`, `g-summary--size-{xs|sm|md|lg|xl}`, `g-summary--multi`, `g-summary--free`, `is-loading`, `is-empty`; partes `g-summary__{lead|body|head|name|code|title|status|subtitle|data|flow|facts|fact|fact-label|fact-value|more|action|sep|mark|bone}`; en cada dato `is-anchor`, `is-bare`, `is-diff`, `is-same`. `--_lines` va como variable en línea en la raíz.

La medida escribe **atributos** (no clases, que el siguiente parche de Vue borraría): `data-terse` y `data-tight` en la raíz; `data-clipped` y `data-enter` en cada dato; `hidden` en «+N»; `title` en lo que lleva elipsis.

## Medida y rendimiento

CSS intrínseco; el JavaScript solo cuenta. Un `ResizeObserver` compartido mide **por lotes** (se lee todo y se escribe después): todas las fichas que lo piden en el mismo turno se miden juntas, con tres pasadas como máximo (`data-terse`, luego «+N», luego `data-tight`). No hay estado reactivo por dato. Se mide al montar (antes del primer pintado), al cambiar de tamaño, al cambiar el contenido y en `document.fonts.ready`; **no** con `loading` ni en `stack`. Las fichas a más de un visor de distancia se aplazan hasta acercarse. Sin `ResizeObserver` (SSR, antes de montar) la ficha **ya está bien por CSS**: cede y recorta; solo faltan «+N», el silencio de rótulos y el estado apretado.

Cifras medidas con 500 fichas en una rejilla (`summary.spec.mjs`, contrato: < 150 ms):

| Medida | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| Medida al montar (informe de bruno) | 14 ms | 10 ms | 21 ms |
| Cambio de ancho, la devolución del observador (informe de bruno) | ≤ 81 ms en los tres motores | | |

Las cifras de los tres motores son del informe de bruno tras sus remates (`001c1e3`: el banco cambia el ancho con `grid-template-columns` en el contenedor, como un redimensionado real, y no con una variable heredada, que inflaba WebKit). Al documentar se **volvió a ejecutar solo Chromium** con un worker: medida al montar 18,8 ms y cambios de ancho de 18, 31 y 30 ms con 500 fichas (la prueba pasa; las cifras varían entre ejecuciones). El CSS de la ficha, aislado, cuesta unos 35 ms sobre una página sin él en WebKit (auditoría, hallazgo 3).

**Peso:** el paquete principal creció **5077 bytes gzip** al añadirla (`dist/grana.js`, mismo árbol; límite del contrato: 8192), cifra anotada por bruno en `GSummary.meta.json` y **no remedida** al documentar. `GCombobox` la recibe por `__shared`, sin copia (su entrada no lleva la cadena `g-summary__`).

## Render de servidor (SSR)

Sin `window` ni `document`: el servidor pinta la ficha completa y correcta, porque la cesión es CSS; «+N», los atributos `data-*` y los `title` llegan al montar. El `id` del título viene de `useId`. Cubierto por `GSummary.ssr.test.js` (3 pruebas).

## Avisos de desarrollo

Con `NODE_ENV` distinto de `production`, `console.warn` con el prefijo `[Grana GSummary]`, **una vez por instancia y motivo**. En producción no avisa.

| # | Causa | Qué hace el componente |
| --- | --- | --- |
| 1 | Sin `title`, sin `placeholder` y sin `loading` | Ficha vacía: no pinta nada |
| 2 | Un dato sin `label`; dos datos con el mismo `label` | El primero se omite; los dos se pintan y `diff` es ambiguo |
| 3 | `lines` igual a `1`, negativo o no entero; `lines` distinto de `2` fuera de `row` | Se usa `2`; se ignora |
| 4 | Slot `action` fuera de `stack` | No se pinta |
| 5 | `diff` con un valor que no es `same` ni `diff` | Se ignora esa clave |
| 6 | `status` sin `label` y sin slot `status` | No se pinta |
| 7 | `group` sin `title` | Avisa |
| 8 | Tras montar, la ficha mide 0 de ancho | Avisa: el anfitrión no le da sitio |

## Limitaciones conocidas

- **La ficha recortada nunca es la única fuente de un dato:** el anfitrión debe ofrecer la vista completa (vista previa, detalle, `stack`). El `title` nativo de lo cortado solo sirve al puntero.
- **El estado es de lo primero que cede.** Si es crítico, va como dato con `priority` alta.
- **`bare` mal marcado** deja un valor sin rótulo a la vista (el lector siempre recibe el rótulo).
- **`diff`** exige que las fichas vecinas traigan los mismos rótulos; en listas heterogéneas casi todo sale `diff`.
- **Un anfitrión de ancho automático** (celda de tabla, fila flex) debe dar ancho a la ficha: la raíz lleva `contain: inline-size` y no aporta ancho. Dale `min` a la columna de `GTable`, o `min-inline-size` o `flex: 1` en una fila flex (si no, aviso 8).
- **`stack` a muy poco ancho:** el estado puede llevar la elipsis propia de `GBadge` (antes que desbordar) y un `GBtn` del slot `action` (`white-space: nowrap`) puede desbordar: es contenido de la aplicación, que le da sitio.
- **Por debajo de 160 px con `code` e icono** el código puede llevar elipsis; el barrido garantizado del contrato es de 160 a 720 px. Fuera de ese rango (se midió a 120 y 140 px, informativo) la identidad y el código no ceden y puede haber desbordes esperables en una ficha más estrecha que su identidad (por ejemplo, la identidad `xl` con `space` 5 mide 80 px).
- **«+N» no se localiza** (cifras latinas).
- **Sin virtualización:** cada ficha se mide; con cientos, la medida de las que no están a la vista puede llegar un instante después.
- **Un cambio en caliente de la métrica del texto** que no altere el ancho ni el alto de la ficha no repite la medida (se mide al montar, al cambiar de tamaño, de contenido y con `document.fonts.ready`). En la prueba hecha (Chromium, cuerpo a 1,25rem en caliente) el recuento siguió correcto; no se encontró un caso que lo rompa.
- **En `inline`, un desborde del cuerpo de 1 a 2 px** se medía con anchos redondeados y no pasaba a estado apretado (hallazgo 2 de la auditoría); bruno lo corrigió después midiendo por cajas con tolerancia de 0,5 px (`001c1e3`). Esta corrección tiene prueba unitaria; **no se repitió la auditoría de coco** después de ella.
- **Estilos globales sin capa ganan:** una regla global tuya sobre `span` (sin capa) gana al CSS de Grana (capa `grana.components`); acótala con un selector más específico.
- **Navegadores:** exige la unidad `lh` y `:has()`.
- **Reservado, no implementado** (DECISIONS #357): casillas alineadas con fila de rótulos (`align`, `heading`), `layout="auto"` y `"panel"`, segunda cara con «+N» como botón (`expandable`), superficie propia (`surface`), slot por dato, `status` en la opción de `GCombobox`. La adopción en `GCard`, `cell-{key}` de `GTable`, `GMenu`, `GSelect` y `GSidebar` es una ronda por anfitrión; hoy la ficha ya puede ir en sus slots.

## Verificación

- **Pruebas** (vitest con jsdom y, para el servidor, entorno node): `GSummary.test.js` y `GSummary.ssr.test.js` **41 en verde** al documentar (ejecutadas de nuevo: 2 archivos, 41 pruebas). Cubren datos y orden, disposición, semántica, identidad y estado, `diff` y `summaryDiff`, `highlight`, la medida con cajas simuladas (pasadas, `title` solo en lo cortado, `data-enter` y su retirada, `reduce`, `multi`, `stack` y `loading` sin medida, sin `ResizeObserver`), los avisos, el empaquetado y SSR.
- **Navegador** (Playwright en Chromium, Firefox y WebKit, sobre el componente real de `dist/` en `packages/vue/playground/summary.html`): `summary.spec.mjs`, **27/27 en los tres motores** según la auditoría de coco con el `dist/` reconstruido. Barrido de 160 a 720 px, ficha en opción, campo `sm`/`md`/`lg`, vista previa, tarjetas, celda, árabe, hebreo, latino en RTL, carga, entrada, móvil 320, semántica y rendimiento. De nuevo se ejecutó solo la prueba de rendimiento en Chromium (ver «Medida y rendimiento»).
- **Auditoría de coco** con el componente real, un tema distinto al por defecto (`@grana/cli`: marca `#7A2E0E`, `space` 5, cuerpo de 17 px, Georgia) y el oscuro, más los once temas generados: `node design/lab/summary/auditoria-verificar.mjs`, **8315/8315** comprobaciones (Chromium 3243, Firefox 2527, WebKit 2527, más 18 estáticas), sin defectos bloqueantes. Cifras tomadas de `auditoria.md`; no se repitió esa pasada al documentar. Banco de estilo previo: 4015/4015.
- **CSS:** sin colores literales, sin `var()` con respaldo, sin `@layer`/`@container`/`!important`, sin `@media` por ancho; en `dist/grana.css` las reglas están en `grana.components` y no hay fuente incrustada.
- **Iconos:** la ficha no escribe pictogramas propios; el icono es `GIcon` por nombre y «+N» es texto.

## No verificado

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack) sobre la opción, la ficha suelta con `group` y la carga: solo se comprobó el árbol de accesibilidad de Playwright. En particular, que lo recortado por `overflow` y los rótulos callados se lean como en el árbol, y el `title` nativo dentro de una `option`.
- **`forced-colors` real** (Windows): solo emulado, y en WebKit solo se comprueban las reglas propias.
- **Safari real y táctil real.** En WebKit de Playwright el botón del slot `action` no recibe el Tab (como Safari sin «Acceso total por teclado»); en Chromium y Firefox el foco es visible.
- **Zoom de texto al 200 %** real.
- **CJK, palabras muy largas sin espacios en el título e idiomas de palabras largas.** Con árabe y hebreo sí se midió (texto RTL real).
- **`prefers-contrast: more`:** emulado, no real.
- **`GCombobox` dentro de la auditoría de esta ficha:** la adopción se audita en la tarea de `GCombobox.css`, no en esta.

## Fuentes

- API: [`GSummary.meta.json`](./GSummary.meta.json) · Contrato: [`design/contracts/summary.md`](../../../../../design/contracts/summary.md) (DECISIONS #349 a #357) · Prototipos: [`design/lab/summary/r01/`](../../../../../design/lab/summary/r01/) y [`r02/`](../../../../../design/lab/summary/r02/) · Estilo: [`design/lab/summary/estilo.md`](../../../../../design/lab/summary/estilo.md) · Auditoría: [`design/lab/summary/auditoria.md`](../../../../../design/lab/summary/auditoria.md)
