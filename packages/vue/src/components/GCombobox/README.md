# GCombobox

Campo para **elegir una opción de un catálogo grande escribiendo**: un paciente entre miles, un diagnóstico CIE-10, un medicamento, un cliente, una colonia. Sigue el patrón *combobox with list autocomplete* de WAI-ARIA sobre [`GInput`](../GInput/README.md): etiqueta, caja, ayuda, mensajes, marcas y contexto de `GForm` son los de `GInput`. **Grana no pide datos:** el componente emite `search`, `more` y `create`, y tu aplicación entrega `options`, `loading`, `total` y `loadError`. El modelo es el `value` de la opción elegida y, si lo permites, un texto libre aparte. Con **`multiple`** (Fase 2) elige **varias**: el modelo pasa a ser un arreglo de `value`, junto a un arreglo de textos libres. Todo lo de **varias opciones** está en su propia sección, [Selección múltiple](#selección-múltiple-multiple-fase-2); lo que sigue, hasta ella, describe una sola opción.

**Etiqueta:** `<g-combobox>` · **Estado:** `candidate` (auditoría de coco aprobada, sin defectos bloqueantes; ver [`design/lab/combobox/auditoria.md`](../../../../../design/lab/combobox/auditoria.md) y, para `multiple`, [`auditoria-multiple.md`](../../../../../design/lab/combobox/auditoria-multiple.md)) · **Desde:** 0.1.0 · **Entrada:** propia, `@grana/vue/combobox` (global UMD `GranaCombobox`)

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`, sección `GCombobox`, con un servidor simulado, y «Alta de paciente»). Exige Vue `^3.5.0` (usa `useId`) y un navegador actual: `popover`, `@starting-style` y `<dialog>`.

## Instalación: entrada propia

`GCombobox` **no** viaja en `@grana/vue`: ni lo exporta ni lo registra su `install`. Va en su propia entrada y quien no lo usa no lo paga.

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import Combobox, { GCombobox } from '@grana/vue/combobox'
import '@grana/vue/style.css'          // el CSS del combobox ya está en esta hoja única

createApp(App).use(Grana).use(Combobox).mount('#app')   // registra <g-combobox>
// o, sin plugin: components: { GCombobox }
```

Sin empaquetador, carga en orden `vue.global.js`, `dist/grana.umd.js` (global `Grana`) y `dist/combobox.umd.js` (global `GranaCombobox`): `app.use(Grana).use(GranaCombobox)`. En plantillas dentro del HTML (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-combobox ...></g-combobox>`.

**Por qué va aparte (DECISIONS #337).** Tiene dos presentaciones, un motor de datos, la ficha y el texto fantasma: supera el tope de 8 KB gzip que fija #328 para entrar en el paquete principal. Medido por bruno el 2026-10-06, con la Fase 2 (`multiple`) incluida: `dist/combobox.js` **21 665 bytes gzip** (21,7 KB) y `dist/combobox.umd.js` **19 569**; `dist/grana.js` 168 553. La Fase 2 añadió **7 592 bytes (7,4 KB)** sobre los 14 073 de antes, por debajo del tope de 8 KB que fija #428, y **también los paga quien use una sola opción** (ver «Peso y rendimiento» en la sección de varias opciones). Antes de la Fase 2 (2026-10-04) eran 13 563 y 12 263. Lo compartido con el principal (`GInput`, `GDialog`, `GSummary` y `summaryDiff`, el `GIcon` interno, `anchor`, `liveRegion`, la utilidad de coincidencias, etc.) llega de `@grana/vue` por `__shared` **sin copia**: la entrada no contiene la cadena `g-summary__` (compuerta del build). Requiere `Vue` y `Grana` (o `@grana/vue`) como externos. Antes de adoptar `GSummary` la entrada pesaba 14 111 bytes; la ficha, el avatar y la coincidencia salieron del `.vue`.

> Estas cifras de peso son las del `meta.json`. Al documentar la Fase 2 se midió de nuevo el `dist/` del árbol de trabajo con `gzip -9`: `combobox.js` **21 685 bytes** y `combobox.umd.js` **19 662** (la diferencia con el `meta.json`, menos de 100 bytes, es del compresor y de la reconstrucción; no hay un valor medido por bruno posterior).

## Qué lo hace distinto

Tres ideas, elegidas por el usuario mirando los prototipos de kiwi (`design/lab/combobox/r02/`, decisión #329). No son opciones sueltas: A y B son dos presentaciones del mismo campo y C vale en las dos.

| | Concepto | Qué hace | Por qué sirve |
| --- | --- | --- | --- |
| **A** | **El campo se abre** (`appearance="field"`, por defecto) | No hay un menú flotante aparte: abierto, el contorno, el anillo de foco y la sombra abrazan **campo y lista como una sola forma**. La primera coincidencia por prefijo se completa en el propio campo como **texto fantasma** | En un formulario denso nadie tiene que relacionar un menú con su campo; «diab» y Tab captura un diagnóstico entero sin mirar la lista |
| **B** | **Paleta con vista previa** (`appearance="palette"`) | El campo se eleva a una superficie modal con su propio campo de búsqueda, los resultados y la **ficha de la opción activa**. Con el visor de 520 px o menos, siempre se usa esta estructura como hoja anclada arriba, sin vista previa | Entre cuatro «María García López» hay que ver a la persona antes de elegirla |
| **C** | **El valor es un objeto** (en A y en B) | En reposo el campo enseña la ficha de lo elegido (avatar, nombre, datos) o la marca de texto libre; los resultados son fichas; y la elegida **viaja** de su fila al campo sin cambiar su alto | Un combobox pasa casi toda su vida cerrado: el formulario en reposo dice a quién y qué, verificable de un vistazo, y distingue catálogo de texto tecleado |

Las reglas de seguridad del teclado (Tab no elige, Intro no elige un resultado obsoleto, la lista no parpadea a vacío; ver «Teclado») son parte de la identidad y no se reabren sin motivo nuevo (#333).

Con `multiple` hay otras tres ideas (la frase, la receta y la cesta; decisiones #417 a #430): ver [«Qué es distinto con varias»](#las-tres-formas-de-elegir-varias).

## Uso

Los ejemplos son los casos del playground.

### Catálogo local: diagnóstico CIE-10

Con `filter` por defecto (`true`) el componente filtra solo: todas las palabras escritas, sin acentos ni mayúsculas, sobre `label`, `code`, `description` y los valores de `facts`.

```vue
<script setup>
import { ref } from 'vue'

const dx = ref(null)                       // el value de la opción, o null
const labels = {                           // sin valores por defecto: los textos son tuyos
  clear: 'Limpiar', close: 'Cerrar',
  noResults: 'Sin resultados para «{text}»',
  results: (n) => (n === 1 ? '1 resultado' : `${n} resultados`),
  more: 'Mostrar más ({shown} de {total})'
}
const diagnosticos = [
  { label: 'Endocrinas, nutricionales y metabólicas (E00–E89)', options: [
    { value: 'E11.9', code: 'E11.9', label: 'Diabetes mellitus tipo 2, sin mención de complicación', description: 'Endocrinas, nutricionales y metabólicas' }
  ] },
  { label: 'Sistema circulatorio (I00–I99)', options: [
    { value: 'I10', code: 'I10', label: 'Hipertensión esencial (primaria)', description: 'Sistema circulatorio' }
  ] }
]
</script>

<template>
  <g-combobox v-model="dx" label="Diagnóstico principal" placeholder="Código o descripción"
              clearable required :labels="labels" :options="diagnosticos"></g-combobox>
</template>
```

Los atributos nativos (`placeholder`, `form`, `aria-*`, `data-*`, escuchas como `@blur`) van al `<input>` visible; solo `class` y `style` van a la raíz.

### Pacientes entre miles: el servidor lo pones tú (sin `fetch`)

Con `:filter="false"` la aplicación filtra: el componente solo pinta lo que llega. **Regla del contrato (#332): al recibir `search` o `more`, pon `loading` a `true` en el mismo manejador** y a `false` al terminar, aunque respondas de caché. Si no, el componente no sabe que hay una respuesta en camino (avisa en desarrollo) y, por seguridad, Intro no elige la opción resaltada sola. **Descartar respuestas fuera de orden es tuyo** (el componente no sabe a qué texto corresponde una respuesta): un número de secuencia basta.

```vue
<script setup>
import { reactive } from 'vue'

// Un «servidor» simulado. En tu aplicación aquí va tu cliente HTTP.
const todos = Array.from({ length: 2400 }, (_, i) => ({
  value: `p${i}`, label: i < 4 ? 'María García López' : `Paciente ${i}`, avatar: true,
  description: `Exp. ${String(1000 + i).padStart(6, '0')} · ${20 + (i % 60)} años`,
  facts: [
    { label: 'Expediente', short: 'Exp.', value: String(1000 + i).padStart(6, '0'), priority: 1 },
    { label: 'Edad', value: `${20 + (i % 60)} años`, bare: true },
    { label: 'Última visita', value: '03/02/2026' }
  ]
}))
const PAGE = 20
const fakeServer = (q, offset) => new Promise((resolve) => setTimeout(() => {
  const hits = todos.filter((p) => `${p.label} ${p.description}`.toLowerCase().includes(q.toLowerCase()))
  resolve({ items: hits.slice(offset, offset + PAGE), total: hits.length })
}, 380))

// labels: el objeto del ejemplo anterior, más retry, partial y minChars
const labels = {
  clear: 'Limpiar', close: 'Cerrar', loading: 'Buscando…', noResults: 'Sin resultados para «{text}»',
  minChars: 'Escribe al menos {count} caracteres', results: (n) => (n === 1 ? '1 resultado' : `${n} resultados`),
  partial: '{count} de {total} resultados', more: 'Mostrar más ({shown} de {total})', retry: 'Reintentar la búsqueda'
}
const pac = reactive({ value: null, options: [], loading: false, total: null, err: '', seq: 0, q: '' })

function buscar(texto) {
  const mia = ++pac.seq                    // descarta respuestas fuera de orden
  pac.q = texto
  pac.loading = true                       // EN EL MISMO manejador (regla de #332)
  pac.err = ''
  fakeServer(texto, 0)
    .then((r) => { if (mia !== pac.seq) return; pac.options = r.items; pac.total = r.total; pac.loading = false })
    .catch(() => { if (mia !== pac.seq) return; pac.loading = false; pac.err = 'No se pudieron cargar los resultados.' })
}
function masResultados() {
  const mia = ++pac.seq
  pac.loading = true
  fakeServer(pac.q, pac.options.length)
    .then((r) => { if (mia !== pac.seq) return; pac.options = pac.options.concat(r.items); pac.loading = false })
    .catch(() => { if (mia !== pac.seq) return; pac.loading = false; pac.err = 'No se pudieron cargar los resultados.' })
}
</script>

<template>
  <g-combobox v-model="pac.value" label="Paciente" placeholder="Buscar paciente" clearable
              :filter="false" :min-chars="2" :labels="labels"
              :options="pac.options" :loading="pac.loading" :total="pac.total" :load-error="pac.err"
              @search="buscar" @more="masResultados"></g-combobox>
</template>
```

- **Valor inicial que no está en `options`** (cargas un expediente guardado): pásalo en `selectedOption` con `value === modelValue`; si su `value` no es `modelValue`, se ignora y avisa. El componente recuerda toda opción que haya pintado y elegido, así que después de elegir ya no hace falta.
- **Un valor sin opción conocida** deja el campo vacío y avisa, **pero se envía igual**.
- **«Mostrar más»** aparece cuando `total` es mayor que las opciones entregadas; al llegar las nuevas, la opción activa pasa a **la primera nueva**. Es una fila de acción, sin desplazamiento infinito.

### Texto libre: `allowCustom` y `v-model:custom`

```vue
<g-combobox v-model="med" v-model:custom="medLibre" label="Medicamento" hint="Elige del cuadro básico o escribe otro"
            allow-custom name="medicamento" custom-name="medicamento_libre"
            :labels="{ ...labels, useCustom: 'Usar «{text}» como texto libre', custom: 'Texto libre' }"
            :options="cuadroBasico"></g-combobox>
```

`modelValue` es **siempre** un `value` de opción o `null`: nunca cambia de tipo, y un texto libre «I10» no se confunde con el `value` «I10». El texto libre va en `custom` (String) y exactamente uno de los dos tiene valor:

| Estado | `modelValue` | `custom` | Campo | Oculto `name` | Oculto `customName` |
| --- | --- | --- | --- | --- | --- |
| Sin valor | `null` | `''` | vacío | `''` | `''` |
| Opción elegida | su `value` | `''` | ficha de la opción | `String(value)` | `''` |
| Texto libre | `null` | el texto | ficha «texto libre» (`is-custom`) | `''` | el texto |

- Solo actúa con `allowCustom`: sin ella, un `custom` no vacío se ignora con aviso. Con los dos a la vez gana `modelValue` (aviso).
- **Con `name` y `allowCustom` pon también `customName`:** sin él, el texto libre no viaja en `FormData` (aviso).
- Aparece la fila «Usar «texto» como texto libre» (con `labels.useCustom`) salvo que ya haya una opción a la vista con esa misma etiqueta. **Al salir del campo, el texto es el valor** (`custom`), aunque coincida con la etiqueta de una opción: nadie elige una opción por pasar de largo.
- `creatable` añade otra fila, «Agregar «texto»…» (con `labels.create`), que **no cambia el valor**: emite `create(texto)` con el foco ya de vuelta en el campo, y tu aplicación decide si crea la opción.

### Paleta con vista previa (B)

```vue
<g-combobox v-model="pac.value" appearance="palette" label="Paciente"
            hint="Para homónimos: la ficha de la opción activa antes de elegir"
            :filter="false" :min-chars="2" :labels="{ ...labels, preview: 'Vista previa', previewEmpty: 'Recorre la lista para ver el detalle antes de elegir.' }"
            :options="pac.options" :loading="pac.loading" :total="pac.total" :load-error="pac.err"
            @search="buscar" @more="masResultados"></g-combobox>
```

El campo de la página pasa a ser el **disparador** (`aria-haspopup="dialog"`, `inputmode="none"`: no abre el teclado virtual) y la superficie es un [`GDialog`](../GDialog/README.md) real: foco atrapado, Esc, fondo y vuelta del foco son los suyos. Abre con clic, Intro, Espacio, ↓, ↑, Alt+↓ **o al escribir**: la primera tecla, o lo pegado, no se pierde (es el texto inicial de la búsqueda). Enfocar no abre. Elegir cierra y devuelve el foco al campo; Esc, el fondo y el botón de cierre cierran **sin elegir**. No hay confirmación de texto al cerrar: en la superficie el texto libre solo entra por su fila.

- **Para qué casos:** homónimos y registros que hay que comprobar antes de elegir. Para un código postal o un medicamento, `field`: la paleta tapa el contexto. Dentro de un `GDialog`, la paleta es un modal sobre otro (funciona, con el anfitrión abierto detrás).
- **Hoja móvil:** con el visor de **520 px o menos** (`matchMedia`, el literal de #42 y #56) cualquier `appearance` usa la misma superficie como **hoja anclada arriba**, de ancho completo y **sin vista previa**, con opciones de 44 px como mínimo. Arriba, para que el teclado virtual no tape la lista. Cruzar el umbral con la lista abierta la cierra.
- **Título de la superficie:** la prop `label`; sin ella, el `aria-label`; sin ninguno, `labels.surfaceTitle`.
- **Vista previa:** `aside` con nombre `labels.preview`; pinta la opción activa con la ficha completa. No es región viva. **La vista previa nunca es la única fuente del dato que distingue:** lo que distingue a una opción también va en su fila (`description` o `facts`). La vista previa por defecto lo cumple por construcción (solo pinta datos de la fila); si la sustituyes con el slot `preview`, es responsabilidad tuya.
- Con `loading`, la superficie lleva el indicador en su campo de búsqueda (no en la caja de la página).

### El valor es un objeto (C)

En reposo, con valor y sin texto a medio escribir, el campo enseña la **ficha** de lo elegido sobre el propio campo: la caja conserva su alto (Δ0). Con el foco, la ficha se pinta **seleccionada entera**: lo siguiente que se escribe la reemplaza y Retroceso la vacía. El valor del `<input>` sigue siendo la etiqueta; la ficha es visual (`aria-hidden`, sin puntero).

Al elegir desde la lista de `field`, la ficha **llega**: sale de su fila y se asienta en el campo con el muelle (ver «Personalidad»). No viaja al elegir desde la superficie (el campo está detrás del modal), al cargar con valor ni al cambiar `modelValue` desde la aplicación.

## Opciones

`options` es un arreglo de **opciones** y de **grupos** (sin anidar), como en [`GSelect`](../GSelect/README.md):

```js
[
  { value: 'p001000', label: 'María García López', avatar: true, description: 'Exp. 001000 · 22 años',
    facts: [{ label: 'Expediente', short: 'Exp.', value: '001000', priority: 1 },
            { label: 'Edad', value: '22 años', bare: true },
            { label: 'Última visita', value: '03/02/2026' }] },
  { label: 'Sistema circulatorio (I00–I99)', options: [{ value: 'I10', code: 'I10', label: 'Hipertensión esencial (primaria)' }] }
]
```

| Campo | Tipo | Qué | Dónde se ve |
| --- | --- | --- | --- |
| `value` | String o Number | Identidad; **única** en la lista | Modelo y campo oculto |
| `label` | String (obligatorio) | Texto del campo, nombre de la opción y lo que se busca | Fila, campo, ficha, vista previa |
| `description` | String | **Línea secundaria**: lo que distingue («Exp. 001000 · 22 años») | Fila (solo si no hay `facts`), ficha en reposo, descripción accesible del valor, vista previa |
| `code` | String | Código en su caja («E11.9»); se busca | Antes del título, en fila, ficha y vista previa |
| `facts` | Array de `{ label, value }` y, opcionales, `priority`, `short`, `bare` | Datos que distinguen, con rótulo. **El de mayor prioridad (o el primero) es el identificador y lo último en ceder** | Fila (en lugar de `description`), ficha del valor y vista previa |
| `avatar` | Boolean u Object | `true`: [`GAvatar`](../GAvatar/README.md) con `name` igual a `label`; objeto: props de `GAvatar` (`src`, `name`, `initials`, `icon`, `color`, `categories`, `colorKey`, `shape`; `size` y `label` se ignoran) | Hueco inicial, decorativo |
| `icon` | String | Nombre de Lucide (resuelve [`GIcon`](../GIcon/README.md)); se usa si no hay `avatar` | Hueco inicial |
| `disabled` | Boolean | No elegible, sigue visible; `aria-disabled="true"` | Fila |

- **Grupo:** `{ label, options }`; `label` es su nombre accesible (`role="group"`).
- Una opción sin `value` o sin `label` se ignora y avisa; un `value` repetido avisa.
- **Línea secundaria accesible** (la que describe el valor elegido): `description`; sin ella, los `facts` unidos como «rótulo valor · rótulo valor»; sin ninguno, nada.
- Los campos de más se conservan y llegan a los slots (`option`, `value`, `preview`, `lead`).

### Cómo se pintan: con `GSummary`

La opción, la ficha del valor y la vista previa se pintan con [`GSummary`](../GSummary/README.md) (DECISIONS #356). El mapeo de campos:

| Dónde | `GSummary` | Notas |
| --- | --- | --- |
| **Opción** por defecto (sin slot `option`) | `layout="row"` `lines="2"`, `size` `md` (`sm` con el campo en `xs` o `sm`) | Título y una línea de datos que **se adapta al ancho de su contenedor**; recibe `highlight` con el texto buscado y `diff` |
| **Ficha del valor** (sin slot `value`) | `layout="inline"` `size="xs"` | Una línea, dentro del campo. Con texto libre: `title` = el texto, `subtitle` = `labels.custom` y lápiz en el hueco inicial |
| **Vista previa** (sin slot `preview`) | `layout="stack"` `size="lg"` | La vista completa: rejilla de pares, sin recorte. Sin `highlight`; el mismo `diff` de su opción |

| Campo de la opción | Prop de la ficha | Regla |
| --- | --- | --- |
| `label` | `title` | Siempre |
| `description` | `subtitle` | **Solo si la opción no trae `facts`**: con `facts` no se pinta ni se lee dos veces, y sigue alimentando la descripción accesible del valor |
| `code` | `code` | Identificador: no cede por reparto |
| `facts` | `facts` | Solo es **visible** un dato con `label` (cadena no vacía tras recortar) y `value` (cadena no vacía tras recortar, o número). Uno sin `label` no se pinta, no se busca ni se lee en la descripción accesible, y avisa (#12). `priority`, `short` y `bare` son opcionales (ver el README de `GSummary`, «Datos») |
| `avatar`, `icon` | `avatar`, `icon` | Tal cual |
| slot `lead` | slot `lead` de la ficha | Manda sobre `avatar` e `icon` |

`value`, `disabled` y los campos de más no llegan a la ficha.

Lo que esto da en la lista:

- **Alto estable:** una opción con datos mide lo que una ficha de dos líneas (**44 px** en `md`) más el relleno de la fila, igual a 240, 320 y 480 px de campo; sin datos ni descripción, una línea. Nada desborda y el identificador siempre se ve entero. Los datos de menor prioridad se ceden por el final y «+N» dice cuántos no se ven: con cuatro datos, **1 de 4 a la vista a 240 px, 2 a 320 y 2 a 480** con el tema por defecto (1, 2 y 3 con el tema de la auditoría, de `space` 3).
- **Contraste entre homónimos:** `GCombobox` calcula `summaryDiff` sobre las **opciones pintadas** (no sobre el total del servidor) y lo recalcula cuando cambian: en cada ficha, lo que distingue pesa y lo que comparten se apaga. Completa la regla de Tab: entre cuatro «María García López» no elige, y ahora se ve en qué se diferencian. Sin homónimos a la vista, ninguna marca. Funciona porque las fichas vecinas traen los mismos rótulos en `facts`.
- **Coincidencia:** la primera aparición de cada palabra buscada se marca con peso y subrayado, **no solo color** (WCAG 1.4.1), en `label`, `code`, `description` y los valores de `facts`.
- **La elegida:** `aria-selected="true"` y un icono `check`; el título de la ficha ya lleva peso de título en todas las opciones, así que la señal no cromática es el `check`.

**Texto accesible de la opción.** La ficha es `span` y su texto incluye **todos los datos con sus rótulos**, se vean o no (lo recortado y lo callado no usa `display: none`); el nombre accesible de la opción es ese texto. La ficha del valor, en cambio, es `aria-hidden`: el lector recibe la etiqueta en el `<input>` y la línea secundaria por `aria-describedby`. Detalle en el README de `GSummary`, «Accesibilidad».

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` | String o Number; con `multiple`, Array | el `value` de la opción elegida (`===`); con `multiple`, arreglo de `value` en el orden de elección | `null`; con `multiple`, `[]` |
| `custom` | String; con `multiple`, Array de String | el texto libre (`v-model:custom`) | `''`; con `multiple`, `[]` |
| `options` | Array | opciones y grupos | `[]` |
| `selectedOption` | Object o `null` | la opción de `modelValue` si no está en `options` | `null` |
| `multiple` | Boolean | elegir varias (ver [Selección múltiple](#selección-múltiple-multiple-fase-2)); se lee al montar | `false` |
| `selectedOptions` | Array | solo con `multiple`: las opciones de los `value` elegidos que no están en `options` | `[]` |
| `selection` | String | solo con `multiple`: `inline` (la frase) `list` (la receta) | `inline` |
| `numbered` | Boolean | solo con `multiple`: numera los renglones de la receta y de la cesta | `false` |
| `max` | Number | solo con `multiple`: entero ≥ 1 | sin valor (sin límite) |
| `appearance` | String | `field` `palette` | `field` |
| `filter` | Boolean o Function | `true` · `false` · `(option, query) => Boolean` | `true` |
| `loading` | Boolean | | `false` |
| `total` | Number o `null` | entero ≥ 0 | `null` |
| `loadError` | String | texto del error de carga | sin valor |
| `minChars` | Number | entero ≥ 0 | `0` |
| `delay` | Number | ms ≥ 0 (antirrebote de `search`) | `250` |
| `limit` | Number | entero ≥ 1 | `50` |
| `allowCustom` | Boolean | | `false` |
| `customName` | String | `name` del oculto con el texto libre | sin valor |
| `creatable` | Boolean | | `false` |
| `clearable` | Boolean | | `false` |
| `labels` | Object | ver «Textos» | `{}` |
| `name` | String | | sin valor |
| `label` | String | | sin valor |
| `hint` | String | | sin valor |
| `error` | String | | sin valor |
| `warning` | String | | sin valor |
| `valid` | String | | sin valor |
| `required` | Boolean | | `false` |
| `mark` | Boolean | | sin valor |
| `readonly` | Boolean | | sin valor, equivale a `false` |
| `disabled` | Boolean | | sin valor, equivale a `false` |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` |
| `variant` | String | `outline` `soft` | `outline` |
| `density` | String | `default` `comfortable` `compact` | contexto de `GForm` o `default` |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | sin valor (el color de foco del tema) |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor (`sm`) |
| `block` | Boolean | | sin valor, equivale a `false` (dentro del layout de formulario, `true`) |
| `id` | String | | generado |

**No existen:** `remote` (es `filter: false`), `expandable`, `autoHighlight`, `createLabel` y `clearLabel` (van en `labels`), `emptyText`, `placeholder` como prop (es un atributo, como en `GInput`), `prefix`, `suffix`, `type`, `surface`, `mode`. Con `multiple` tampoco existen `order`, `reorderable`, `chips` ni `display` (ver «Límites» de la sección de varias opciones).

### `filter`: quién filtra

| Valor | Quién filtra | Qué cambia |
| --- | --- | --- |
| `true` (por defecto) | El componente, con su regla | `limit` es el tope de filas pintadas y lo que añade «Mostrar más» |
| Función | El componente, con tu regla `(option, query) => Boolean` (`query` llega recortado) | Igual |
| `false` | **La aplicación**; el componente pinta lo que llega | Cuatro cosas, y solo con `false`: abrir emite `search('')`, «Mostrar más» emite `more`, `total` cuenta y existe la **búsqueda pendiente** |

- **Pendiente** (solo `filter: false`): hay una búsqueda sin asentar mientras corre el antirrebote, mientras `loading` es `true`, y desde que se emite `search` o `more` hasta que la aplicación responde (cambia `loading` a `true`, o cambian `options`, `total` o `loadError`). Pendiente quiere decir: Intro no elige la opción resaltada sola, no hay texto fantasma y no se anuncia el recuento.
- **`loading` no vacía la lista:** las opciones anteriores siguen visibles y navegables con `aria-busy="true"`; «Buscando…» (`labels.loading`) solo aparece sin opciones previas, y **no se anuncia**.
- **`total` con filtro local** se ignora y avisa; **menor que las opciones entregadas** también avisa.
- **`minChars`:** con 1 a `minChars − 1` caracteres no se emite `search` ni se pinta lista: se muestra la pista `labels.minChars`. El texto vacío no cuenta (abrir enseña lo que la aplicación entregue, p. ej. «Recientes»).
- **`delay`:** el primer `search` al escribir lleva antirrebote (una emisión por pausa); `0` lo desactiva. Abrir sin escribir y «Reintentar» emiten sin esperar. Con filtro local, `search` también se emite al escribir, solo informativo.

### `loadError`

Con texto, el panel lo muestra (fuera del `listbox`, con `circle-alert` y `danger-text`), lo anuncia y añade la fila **«Reintentar»**, que re-emite `search` con el texto actual sin esperar (no hay evento `retry`). Las opciones anteriores siguen a la vista. **No marca el campo inválido**: un fallo de red no es un error del valor (Grana no valida, DECISIONS #157); si quieres, publícalo además en la isla de estado.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `String`, `Number` o `null` | Se elige una opción distinta; se limpia; al salir con el texto vacío; al confirmar un texto libre (`null`). Solo si cambia |
| `update:custom` | `String` | Se confirma un texto libre (el texto); se elige una opción, se limpia o se vacía (`''`). Solo si cambia |
| `change` | `{ value, custom, option }` | **Una vez por cambio confirmado**, después de los `update:*`; `option` es la opción elegida o `null` |
| `search` | `String` (texto recortado) | Al escribir tras `delay` (también con filtro local, informativo); al abrir sin escribir con `filter: false`; con «Reintentar» |
| `more` | `String` (el texto actual) | «Mostrar más» con `filter: false` |
| `create` | `String` (el texto) | Fila «Agregar «texto»…»; el foco ya volvió al campo |
| `open` | | El panel o la superficie pasan a verse |
| `close` | | Dejan de verse, por el motivo que sea |

Con `multiple`, `update:modelValue` y `update:custom` emiten arreglos nuevos y `change` lleva `{ value, custom, options, added, removed }` (ver «Eventos con `multiple`»). Todos están declarados en `emits`: el `@change` del consumidor recibe el objeto y no llega al `<input>` nativo. Los demás eventos nativos (`focus`, `blur`, `keydown`, `input`…) llegan al `<input>` visible **después** de los manejadores propios, así que un `@keydown` tuyo ve el estado ya actualizado.

## Slots

| Slot | Propósito | Alcance | Notas |
| --- | --- | --- | --- |
| `label`, `hint`, `error` | Los de `GInput` (`error` es el mensaje del campo) | | |
| `prepend` | Icono decorativo del campo (lupa, icono del dominio) | | Envuelto en `aria-hidden`; se oculta mientras hay ficha |
| `option` | Contenido de una fila de opción | `{ option, active, selected, query }` | Dentro del `li role="option"`, sin interactivos; **debe conservar el texto que distingue**: el nombre accesible es su texto |
| `lead` | Hueco inicial de una opción, ficha y vista previa | `{ option }` | Pasa al slot `lead` de la ficha: decorativo, manda sobre `avatar` e `icon` |
| `value` | Contenido de la ficha en reposo | `{ option, custom }` (`option` es `null` con texto libre) | `aria-hidden`, una línea, sin interactivos y sin cambiar el alto |
| `preview` | Ficha de la opción activa en la paleta | `{ option }` | Sin interactivos; nunca la única fuente del dato que distingue |
| `empty` | Estado sin resultados | `{ query }` | El anuncio sigue usando `labels.noResults` |
| `load-error` | Estado de error de carga | `{ message, query }` | Se conservan la fila «Reintentar» y el anuncio |
| `chosen` | Renglón de la receta y de la cesta (solo con `multiple`) | `{ option, custom }` | Ver «Slots con `multiple`» |

**No hay `append` ni `action`:** el final de la caja es de limpiar y de la flecha, y una caja fusionada rompería la forma única de A. Si se pasan, no se pintan y se avisa. El slot `preview` solo se pinta con `appearance="palette"` por encima de 520 px y **sin `multiple`** (con `multiple` la cesta ocupa su sitio; el slot `value` tampoco se pinta).

`option`, `value` y `preview` **ganan** a la ficha por defecto; la [`GSummary`](../GSummary/README.md) pública es lo recomendado dentro de ellos:

```vue
<g-combobox v-model="pac.value" label="Paciente" :labels="labels" :options="pac.options" :filter="false" @search="buscar">
  <template #option="{ option, query }">
    <g-summary :title="option.label" :subtitle="option.description" :highlight="query" avatar></g-summary>
  </template>
</g-combobox>
```

## Textos (`labels`)

Sin valores por defecto (Grana es internacional, DECISIONS #226): todo lo que el componente dice sale de `labels`. Los marcadores se escriben `{texto}`; los **contados** admiten un String con marcador o una **función** (para el plural).

| Clave | Marcadores o firma | Dónde | Si falta |
| --- | --- | --- | --- |
| `clear` | | Nombre del botón de limpiar | Sin botón; aviso con `clearable` |
| `close` | | Botón de cierre de la superficie | Sin botón de cierre; **aviso al montar** |
| `loading` | | Estado «Buscando…» | Estado sin texto; aviso al usarse |
| `noResults` | `{text}` | Estado y anuncio sin resultados | Ídem |
| `minChars` | `{count}` | Pista de mínimo | Aviso con `minChars > 0` |
| `results` | `{count}` o `(count) => String` | Anuncio con todos los resultados a la vista | Sin anuncio; aviso al usarse |
| `partial` | `{count}`, `{total}` o `(count, total) => String` | Anuncio con más resultados que los pintados | Usa `results`; aviso |
| `more` | `{shown}`, `{total}` | Fila «Mostrar más» | Fila sin texto; aviso al usarse |
| `retry` | | Fila «Reintentar» | Ídem |
| `useCustom` | `{text}` | Fila «Usar «texto» como texto libre» | Sin fila; aviso con `allowCustom` |
| `custom` | | Marca «Texto libre» de la ficha y su descripción accesible | Ficha sin marca; aviso con `allowCustom` |
| `create` | `{text}` | Fila «Agregar «texto»…» | Sin fila; aviso con `creatable` |
| `preview` | | Nombre de la región de vista previa | Aviso con `appearance="palette"` |
| `previewEmpty` | | Vista previa sin opción activa | Vacía, sin aviso |
| `surfaceTitle` | | Título de la superficie sin `label` ni `aria-label` | Aviso solo en ese caso |

Las cifras de `{count}`, `{shown}` y `{total}` se formatean con `Intl.NumberFormat` del `lang` del ancestro más cercano (no hay prop `locale`).

## Teclado

Los eventos de lista **no actúan mientras hay composición IME** (`isComposing`). Esta tabla es la de **una sola opción**; con `multiple` rige la de «Teclado con `multiple`».

| Tecla | Lista cerrada | Lista abierta |
| --- | --- | --- |
| Carácter | Abre y busca | Busca |
| ↓ / ↑ | Abre; activa la elegida, o la primera / la última | Siguiente / anterior fila habilitada; **no cicla**; salta encabezados y deshabilitadas; las filas de acción cuentan |
| Alt+↓ | Abre sin mover la activa | |
| Alt+↑ | | Cierra |
| Av Pág / Re Pág | | Diez adelante / atrás |
| Inicio / Fin / ← | Edición del texto | Edición del texto (no son de lista) |
| → | Edición del texto | Con texto fantasma y el cursor al final: **acepta el texto** (el campo queda con la etiqueta completa) **sin elegir** y sin nueva búsqueda; la opción pasa a contar como activada por la persona. Si no, edición |
| Intro | Nativo (envío implícito, como `GInput`) | Elige la activa y cierra; sobre una fila de acción, la ejecuta; **sin activa, nada** (y no envía). Si la activa quedó resaltada sola y hay búsqueda pendiente, **no hace nada** |
| Esc | Con texto sin confirmar: restaura el de la opción elegida y lo selecciona (sin propagar). Si no, nativo | Cierra y conserva el texto; `preventDefault` y `stopPropagation`: **no cierra un `GDialog` anfitrión** |
| Tab | Sale; aplica «al salir del campo» | Cierra y sale. **No elige**, salvo la excepción de abajo. Sobre una fila de acción, no la ejecuta |

- **Enfocar no abre.** Abren: escribir, ↓, ↑, Alt+↓ y el clic en la caja. Al entrar con valor, y tras elegir, **el texto queda seleccionado**: lo siguiente que se teclea lo reemplaza.
- **Tab no elige** (difiere de `GSelect` a propósito). En `GSelect` la opción activa la puso la persona con las flechas; aquí la puso el componente. Elegir un paciente por pasar de largo es un cambio de contexto inesperado (WCAG 3.2.2).
- **Única excepción (A):** Tab elige la opción del **texto fantasma** cuando, además de las condiciones del fantasma, su etiqueta es **única** entre las opciones a la vista (sin acentos ni mayúsculas) **y no quedan resultados sin pintar** (no hay fila «Mostrar más»). Con homónimas, o con más resultados de los pintados, el campo completa el nombre pero Tab no elige. Es lo que la persona ve escrito en el campo, no una fila que no miró.
- **Intro y resultados obsoletos:** una opción activada por la persona (flechas, puntero, →) sí se elige con Intro; una resaltada sola, mientras la búsqueda está pendiente, no.
- **Al salir del campo** (blur o Tab, `field`): texto **vacío** borra (`null` y `''`); texto que no es el de la opción elegida **se descarta** y vuelve el de la opción; con `allowCustom`, el texto es el valor (`custom`). Elegir la opción ya elegida cierra sin emitir.
- **En la superficie** (paleta y hoja): el disparador abre con Intro, Espacio, ↓, ↑, Alt+↓ o un carácter. Dentro rige la tabla de «Lista abierta» sobre el campo de búsqueda, salvo que **Tab se mueve dentro del diálogo** (campo, cierre) y **nunca elige**, y Esc cierra la superficie (un nivel). **Al abrir con ↓ desde el disparador no queda ninguna fila activa:** hace falta otra ↓ antes de Intro (también en la hoja a 375 y 320 px; hallazgo 4 de la auditoría de la Fase 2: es lo que manda el contrato en «Superficie», y su tabla de teclado, que dice «la primera / la última fila», vale para `field`).
- **Puntero:** pasar sobre una fila la activa (exige un movimiento real: el primer evento tras abrir solo anota la posición) y el clic elige o ejecuta la acción. Un `pointerdown` fuera cierra. Pulsar el panel no quita el foco del campo.
- **Texto fantasma** (solo A, existe si todo se cumple): lista abierta, texto escrito, sin búsqueda pendiente, sin composición IME, el cursor al final, la primera opción es la activa y su etiqueta **empieza por** lo escrito (sin acentos ni mayúsculas) y es más larga. Es `aria-hidden`: el lector recibe la opción por `aria-activedescendant`. Con coincidencia por código, por expediente o por el medio de la etiqueta no hay fantasma.

## Accesibilidad

```html
<div class="g-input g-combobox g-combobox--appearance-field is-open is-token">
  <label class="g-input__label" id="ID-label" for="ID">Paciente</label>
  <div class="g-input__row"><div class="g-input__control">
    <span class="g-combobox__value">
      <input class="g-input__field g-combobox__field" id="ID" type="text" role="combobox"
             aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="true" aria-controls="ID-list"
             aria-activedescendant="ID-opt-0" aria-required="true" aria-describedby="ID-about ID-hint ID-message"
             autocomplete="off" autocapitalize="none" spellcheck="false">
      <span class="g-combobox__ghost" aria-hidden="true">…</span>
      <span class="g-combobox__token" aria-hidden="true"><span class="g-summary g-summary--layout-inline">…</span></span>
      <span class="g-combobox__about" id="ID-about">Exp. 001000 · 22 años</span>
      <input type="hidden" name="paciente" value="p001000">
    </span>
    <button type="button" class="g-combobox__clear" aria-labelledby="ID-clear-text ID-label">…</button>
    <span class="g-combobox__arrow" aria-hidden="true">…</span>
  </div></div>
  <div class="g-combobox__live" role="status" aria-live="polite" aria-atomic="true"></div>
  <div class="g-combobox__popup" popover="manual"><ul class="g-combobox__list" role="listbox" id="ID-list">…</ul></div>
</div>
```

- **Patrón APG:** `<input type="text" role="combobox">` y un `listbox`; el foco real **nunca sale del campo** con la lista abierta (`aria-activedescendant`); las opciones no tienen manejadores de teclado ni `tabindex`. `aria-expanded="true"` solo con panel visible (con filas o con estado: «Sin resultados», «Buscando…», pista); `aria-controls` y `aria-activedescendant` apuntan siempre a elementos que existen.
- **Opciones:** `aria-selected="true"` **solo en la elegida**; la activa lleva `is-active`; las no elegibles, `aria-disabled="true"`. Las **filas de acción** («Mostrar más», «Reintentar», «Usar… como texto libre», «Agregar…») son `role="option"` con `aria-selected="false"`, hijas directas del `listbox`, fuera de los grupos y siempre al final; cuentan en la navegación y se anuncian como una opción más («…, opción 21 de 21»): sus textos deben ser explícitos.
- **Estado** (fuera del `listbox`, a lo sumo uno): error de carga, pista de mínimo, nada si hay opciones, «Buscando…» y «Sin resultados».
- **Descripción del valor:** con un valor y sin texto a medio escribir, `aria-describedby` empieza por la línea secundaria de la opción (o por `labels.custom` si es texto libre).
- **«Limpiar»:** se nombra con `aria-labelledby` = su texto oculto + la etiqueta («Limpiar Paciente»; respeta el slot `label`). Sin etiqueta visible: con `aria-labelledby` tuyo, su texto + tus ids; con `aria-label`, «{labels.clear} {aria-label}». Es un botón aparte en el orden de Tab, de 24 px (44 px con puntero grueso); pulsarlo borra, vacía el texto y devuelve el foco al campo. Ausente en solo lectura y deshabilitado.
- **`required`:** marca visual y `aria-required="true"`; **nunca `required` nativo** (el `<input>` visible no es el que se envía). Valida tu aplicación y pasa `error`.
- **Solo lectura:** `readonly` nativo y `aria-readonly`; enfocable y legible, **no abre**, sin limpiar ni flecha, **se envía**. **Deshabilitado:** nativo en el visible y en los ocultos (no se envía).
- **Región viva propia**, presente desde el montaje (con la superficie abierta, la de dentro de la superficie, porque la página queda inerte): al asentarse una búsqueda hay **un** anuncio educado a los **600 ms** (para no pisar el eco de escritura): `partial` («20 de 1 240 resultados»), `results`, `noResults` o `loadError`. Tras «Mostrar más», el recuento nuevo. **No se anuncia** «Buscando…», la pista de mínimo, la elección, abrir ni cerrar.
- **Superficie:** el disparador conserva `role="combobox"` con `aria-haspopup="dialog"`, `aria-expanded` y `aria-controls`, sin `aria-autocomplete` ni `aria-activedescendant`; la superficie tiene dentro su propio `combobox` de APG con el título como nombre. El cuerpo del diálogo no se desplaza ni recibe `tabindex`: se desplaza el panel.
- **Coincidencia y homónimos** nunca dependen solo del color: peso y subrayado en la marca, peso y tono en `diff`; la elegida lleva `check`.
- **Mínimos** (auditoría de coco): área táctil de «Limpiar» 24 × 24 px con puntero fino y **44 × 44** con puntero grueso (emulado en Chromium y WebKit); filas y filas de acción de **44 px** con puntero grueso y en la hoja; texto de 12 px o más; foco siempre visible.
- **Foco al abrir y cerrar rápido:** medido con clics reales en la flecha y teclas (86 cuadros en Chromium, 101 en Firefox, 67 en WebKit): **0 cuadros sin contorno y 0 sin anillo** con el foco puesto. Antes de la corrección del hallazgo 1 de la auditoría había 1 y 2 en Chromium.
- **Contraste** (compuesto real, 28 configuraciones en Chromium y 8 en Firefox y WebKit: tema por defecto, «Tema de prueba», el de la auditoría —`space` 3, cuerpo de 15— y los once de Dark Color Presence, claro y oscuro). Mínimos medidos: título y valor de la activa en la paleta (invertida) **15,18:1**; rótulo de dato en opción, ficha del valor y activa de `field` **5,05:1**; «+N» **4,51:1**; vista previa, rótulo **4,70:1**; **sobre la selección** (ficha enfocada: rótulo, dato compartido, código y capítulo) **6,49:1** como mínimo (por defecto claro 6,56; oscuro 7,84; tema de la auditoría 6,60 y 7,75); texto fantasma **6,49:1**; error de carga **4,51:1**; contorno de la forma **4,52:1** (se exige 3:1); iniciales del avatar `md` **4,53:1** (color de categoría del tema). Los que rozan 4,5 (error de carga, contorno, iniciales, «+N») vienen del rol del tema, no del componente: si un tema generado bajara de 4,5, el aviso es del motor de tema.
- **`forced-colors`** (emulado en los tres motores): con ficha, la ficha se retira y el `<input>` pinta `FieldText`; forma `CanvasText`, anillo `Highlight`, opción activa `Highlight` / `HighlightText` (también sus datos, incluido el compartido) en A y en la paleta, fantasma `GrayText`, y la coincidencia conserva el subrayado.
- **RTL:** la forma de A se alinea al borde de inicio de la caja, el hueco inicial va al inicio, la barra de la activa se refleja y el fantasma árabe coincide con la tinta del campo (Δ 0,00 px). `--_x` es físico.

## Dentro de un formulario

`name` va al `<input type="hidden">` del `value` y registra el campo en [`GForm`](../GForm/README.md) (clave de `errors`); **el `<input>` visible no lleva `name`**. `form` por `$attrs` se copia a los ocultos. Escribir es escritura (el error se revela al salir); elegir, limpiar y confirmar un texto libre llaman a `notifyChange` (suben `dirty` y retiran `is-rejected`). Con `readonly` no se emite nada.

```vue
<g-form aria-label="Consulta" :labels="fm.labels" @submit="enviar">
  <g-form-layout>
    <g-form-row>
      <g-combobox v-model="pac.value" name="paciente" label="Paciente" :selected-option="pacienteGuardado"
                  :filter="false" :min-chars="2" :labels="labels"
                  :options="pac.options" :loading="pac.loading" :total="pac.total" :load-error="pac.err"
                  @search="buscar" @more="masResultados"></g-combobox>
      <g-select v-model="servicio" label="Servicio" :options="servicios"></g-select>
      <g-input v-model="nota" label="Nota" name="nota"></g-input>
    </g-form-row>
  </g-form-layout>
</g-form>
```

Un `<form>` nativo recibe `paciente=p001000` (el `value`, no la etiqueta) y, con `customName`, la segunda clave con el texto libre.

### En una `GFormRow`

Admitido como hijo de una fila con más de un hijo (raíz de `GInput`, tres hijos). Para que la fila se parta **antes** de que el campo quede estrecho, `GCombobox.css` declara **`--g-form-min: 60`** sobre `.g-form-row > .g-combobox--appearance-field`: `space × 60` = **240 px** con `space` 4, el ancho en que kiwi midió A funcional. Es la propiedad pública de entrada de `GForm`: **sobrescríbela con `style`** (súbela para fichas anchas, bájala para catálogos de etiqueta corta). `palette` no la declara (su superficie no depende del campo). Medido en el playground: con el ancho de 1280 px la fila de tres va en línea (293 px el combobox); a 900 y 600 se parte (530 y 542 px) y la forma mide siempre lo que el campo. Fuera de una fila el ancho es tuyo; A funciona a cualquier ancho porque las fichas se adaptan.

**No es parte de un [`GInputGroup`](../GInputGroup/README.md)** en v0.1 (reservado): dentro de uno, aviso. Tampoco admite el slot `action` de `GInput`.

## Selección múltiple (`multiple`, Fase 2)

`multiple` es un **modo del mismo componente** y de la misma entrada (`@grana/vue/combobox`): no hay otra etiqueta ni otro paquete. Con `multiple`, **esta sección manda** sobre lo que el resto del README diga del modelo, el envío, la ficha del valor, el teclado, los textos y los anuncios. Lo que aquí no se nombra **sigue como en una sola opción**: los datos sin `fetch` (`filter`, `search`, `more`, búsqueda pendiente, `loading`, `loadError`, «Mostrar más»), el texto fantasma y su aceptación con →, la forma única de A, la superficie sobre `GDialog`, las fichas de `GSummary`, los paneles estables, `--g-form-min`, `aria-required`, la región viva propia y la composición IME.

Estado: `candidate`, con auditoría de coco sin defectos bloqueantes ([`design/lab/combobox/auditoria-multiple.md`](../../../../../design/lab/combobox/auditoria-multiple.md)). Contrato: [`design/contracts/combobox.md`](../../../../../design/contracts/combobox.md), «Fase 2 · Selección múltiple» (DECISIONS #417 a #430). Se puede ver en el playground, sección `GCombobox · multiple` (`#sec-combobox-multiple`); con `?cm=A`, `?cm=B` o `?cm=C` en la dirección, todos sus casos toman ese concepto.

### Cuándo usarlo

| Necesidad | Usa | Por qué no el otro |
| --- | --- | --- |
| Varias de hasta unas 7 opciones, todas a la vista | [`GCheckboxGroup`](../GCheckboxGroup/README.md) | No hay nada que buscar: verlas todas es mejor que escribir |
| Una de una lista corta y conocida | [`GSelect`](../GSelect/README.md) | `GSelect` **no gana `multiple`** |
| **Varias de un catálogo grande o del servidor**; cada una es un `value` con su etiqueta; texto libre opcional y marcado | **`GCombobox` con `multiple`** | |
| Etiquetas de texto **sin catálogo** (correos, palabras clave, folios): lo escrito es el valor, con separadores y validación por etiqueta | `GTagInput` (**reservado, no existe**) | Aquí pegar «penicilina, látex» es **un texto de búsqueda**, no dos valores; el texto libre es la excepción marcada y entra solo por su fila |
| Archivos | [`GFileField`](../GFileField/README.md) | Sus fichas en la caja son para archivos |
| Elegidos con prioridad que se reordena (el primero es el principal) | Fuera de esta fase | Hoy el orden es el de elección, y `numbered` lo enseña |

### Las tres formas de elegir varias

Como en una sola opción, las tres ideas no son opciones sueltas: A y B se piden con una prop, y C es lo que hace la paleta con `multiple`. En los tres, **quitar nunca es irreversible ni accidental**: Intro no borra lo que ya está, Retroceso sostenido no se lleva nada, quitar con Retroceso pide una segunda pulsación y todo quitar se deshace con Ctrl/⌘+Z (con rastro visible y «Deshacer» en B y C). Ninguna regla añade pasos al camino normal: escribir, Intro, escribir, Intro.

| | Concepto | Cómo se pide | Qué hace | Por qué sirve |
| --- | --- | --- | --- | --- |
| **A** | **La frase** (por defecto) | `multiple` (`selection="inline"`, `appearance="field"`) | Lo elegido se **escribe en la línea del campo** como una frase de `Intl.ListFormat` («Penicilina, Látex y 3 más»), sin fichas ni ×; cede **por texto**, no con una insignia; al abrir, el grupo **«Elegidas»** va arriba. **El campo nunca crece** | Formularios densos sin saltos (Δ0 medido de 0 a 40 elegidas); lo elegido se lee en reposo, impreso o en una captura; ningún objetivo diminuto junto a otro |
| **B** | **La receta** | `selection="list"` | La caja es solo la búsqueda; lo elegido va **debajo**, como renglones completos en orden (numerados con `numbered`); lo agregado en la pasada dice «Nueva» y quitar deja un **rastro con «Deshacer» en el mismo sitio** | Diagnósticos, medicamentos, órdenes: cada elegido se verifica **entero**; quitar por error no mueve ni pierde nada; quien revisa ve qué cambió |
| **C** | **La cesta** | `appearance="palette"` con `multiple` | La paleta con **los resultados a un lado y la cesta de lo elegido al otro**, en el sitio de la vista previa; lo marcado **viaja** a la cesta; quitar deja rastro con «Deshacer». En reposo, la frase de A (o la receta, con `selection="list"`) | Revisar y quitar **mientras se busca**; entre homónimos, la marca de contraste compara en resultados y cesta |

Descartado, sin reserva de nombre (#417): fichas con × dentro de una caja que crece (la referencia: +168 px de 2 a 8 elegidas), fichas navegables con ← →, carril con desplazamiento horizontal, «+N» como única cesión, solo el recuento en el campo, borrador con «Aplicar» y Tab que agrega.

### Uso

Los tres casos son del playground. Los textos son tuyos (`labels` no trae valores por defecto): con `multiple` hacen falta, además de los de una opción, los de «Textos nuevos». Este objeto sirve a los tres ejemplos.

```js
const labels = {
  // los de una opción
  clear: 'Quitar todas', close: 'Cerrar', noResults: 'Sin resultados para «{text}»',
  results: (n) => (n === 1 ? '1 resultado' : `${n} resultados`),
  useCustom: 'Usar «{text}» como texto libre', custom: 'Texto libre',
  // los de multiple
  selected: (n) => (n === 1 ? '1 seleccionada' : `${n} seleccionadas`),
  about: (n, list) => `${n === 1 ? '1 seleccionada' : `${n} seleccionadas`}: ${list}`,
  customItem: '{text} (texto libre)',
  added: (label, n) => `Se agregó ${label}. ${n} seleccionadas.`,
  removed: (label, n) => `Se quitó ${label}. ${n} seleccionadas.`,
  restored: (label, n) => `Se restauró ${label}. ${n} seleccionadas.`,
  clearedAll: 'Se quitaron todas', restoredAll: (n) => `Se restauraron ${n}`,
  armed: 'Pulsa Retroceso otra vez para quitar {label}', already: '{label} ya está elegida',
  max: 'Máximo {max}: quita una para elegir otra', ofMax: '{count} de {max}',
  chosen: 'Elegidas', rest: '{count} más', showAll: 'Ver las {count}', showLess: 'Ver menos',
  done: 'Listo', remove: 'Quitar {label}', undo: 'Deshacer', trace: '{label} quitada',
  fresh: 'Nueva', basketEmpty: 'Aún no hay ninguna. Las que marques aparecen aquí.'
}
```

#### A · La frase: alergias, con texto libre

```vue
<script setup>
import { ref } from 'vue'

const alergias = ref(['penicilina', 'latex'])   // arreglo de value, nunca null
const libres = ref([])                           // los textos libres, aparte
</script>

<template>
  <g-combobox v-model="alergias" v-model:custom="libres" multiple label="Alergias"
              hint="Medicamento, alimento, ambiental o material. Si no está, escríbela."
              placeholder="Buscar alergia" clearable allow-custom
              name="alergias" custom-name="alergias_libre"
              :labels="labels" :options="catalogoAlergias"></g-combobox>
</template>
```

`catalogoAlergias` es un arreglo de opciones y grupos como el de una sola opción. Con `allowCustom`, la fila «Usar «texto» como texto libre» **agrega** el texto a `libres` y la lista sigue abierta.

#### B · La receta: diagnósticos numerados, con tope

```vue
<g-combobox v-model="dx" multiple selection="list" numbered :max="3"
            label="Diagnósticos secundarios" hint="Hasta 3, en orden de importancia"
            placeholder="Código o descripción" name="dx_sec"
            :labels="labels" :options="diagnosticos"></g-combobox>
```

La caja es solo la búsqueda; los elegidos van debajo, uno por renglón, con el número, la ficha completa y «Quitar».

#### C · La cesta: responsables, con homónimos

```vue
<g-combobox v-model="responsables" multiple appearance="palette"
            label="Responsables" placeholder="Nombre o área"
            :labels="labels" :options="personas"></g-combobox>
```

Con el visor de 520 px o menos, la paleta es la hoja móvil de siempre y **no lleva cesta** (ver «C · La cesta»).

#### Búsqueda remota

Igual que con una opción: `:filter="false"`, `loading` en el mismo manejador de `search` y `more`. Lo nuevo es que lo elegido que ya no está en `options` (porque la búsqueda cambió) se describe con **`selectedOptions`**, el arreglo de las opciones de esos `value`:

```vue
<g-combobox v-model="pacientes" multiple :selected-options="pacientesGuardados"
            :filter="false" :min-chars="2" label="Pacientes" :labels="labels"
            :options="pac.options" :loading="pac.loading" :total="pac.total" :load-error="pac.err"
            @search="buscar" @more="masResultados"></g-combobox>
```

El componente recuerda toda opción que haya pintado y elegido; `selectedOptions` hace falta para lo que llega **ya elegido** (un expediente guardado). Un `value` sin opción conocida **no queda invisible**: se pinta con `String(value)` como etiqueta, se puede quitar y se envía (y avisa). Es distinto de una sola opción, donde el campo quedaba vacío: entre varios, un valor que se envía sin que nadie pueda verlo ni quitarlo sería peor.

### Props con `multiple`

| Prop | Con `multiple` |
| --- | --- |
| `multiple` | Boolean, `false` por defecto. **Se lee al montar**: cambiarlo después no tiene efecto y avisa (aviso 13); para cambiar de modo, cambia la `key` |
| `modelValue` | **Array** de `value` (String o Number) en el orden de elección, **nunca `null`**. `null`, `undefined` y `''` cuentan como `[]` sin aviso; cualquier otro valor que no sea arreglo cuenta como `[v]` y avisa. Comparación `===`; un repetido se pinta y se envía una vez y avisa. Cada emisión es un **arreglo nuevo** (nunca se muta el de la prop). El componente no guarda copia: pinta las props |
| `custom` | **Array** de textos libres recortados y no vacíos, solo con `allowCustom` (sin ella, uno no vacío se ignora con aviso). Dos textos iguales sin acentos ni mayúsculas son el mismo: se pinta el primero y avisa. **Valores y textos libres conviven** (con una opción era uno u otro) |
| `selectedOptions` | Array de opciones: las de los `value` elegidos que no están en `options`. Las que no son de `modelValue` se ignoran. `selectedOption` (singular) con `multiple` se ignora con aviso |
| `selection` | `inline` (A, la frase; por defecto) o `list` (B, la receta). Decide dónde viven los elegidos **en reposo**. Con `appearance="palette"` decide igual el reposo; la paleta abierta enseña siempre la cesta. En la hoja móvil el reposo conserva su `selection` |
| `numbered` | Boolean. Numera los renglones de la receta y de la cesta en el orden de elección (el número **se lee** y cuenta solo los renglones vivos). Con `selection="inline"` y `appearance="field"` no hay renglones: se ignora con aviso |
| `max` | Entero ≥ 1; sin valor, sin límite. Ver «Tope» |
| `clearable` | Con elegidos, el botón **«Quitar todas»** (`labels.clear`; misma regla de nombre: «Quitar todas Alergias»). Quita valores y textos libres en un gesto, lo anuncia, devuelve el foco al campo y se deshace con Ctrl/⌘+Z |
| `allowCustom` | La fila de texto libre **agrega** el texto a `custom` y la lista sigue abierta. No se pinta si hay una opción a la vista con esa etiqueta **ni si el texto ya está en `custom`**. **Salir nunca agrega**, tampoco en `field` |
| `creatable` | Como con una opción: cierra, deja el foco en el campo y emite `create(texto)`; no cambia el valor. Si tu aplicación crea la opción y quiere elegirla, la añade ella a `modelValue` |
| `required` | `aria-required="true"` en el `<input>` visible; «vacío» es sin elegidos. Valida tu aplicación |
| `readonly` | No abre; sin «Quitar», «Quitar todas», flecha ni rastros; lo elegido visible y leído en `aria-describedby`; **se envía** |
| `disabled` | Sin botones; los ocultos van `disabled` (no se envía) |

`filter`, `loading`, `total`, `loadError`, `minChars`, `delay`, `limit`, `appearance`, `name`, `customName` y las demás props compartidas: **como con una opción**.

### Modelo, orden y envío

| Estado | `modelValue` | `custom` | Ocultos `name` | Ocultos `customName` |
| --- | --- | --- | --- | --- |
| Sin elegidos | `[]` | `[]` | **ninguno** | ninguno |
| Solo valores | `['I10', 'E11.9']` | `[]` | uno por valor, en orden | ninguno |
| Valores y textos libres | `['penicilina']` | `['Polen de olivo']` | uno por valor | uno por texto, en orden |

- **Orden de elección:** agregar pone al **final** de su arreglo; deshacer devuelve **a su posición**; marcar o desmarcar **no reordena** nada a la vista. No se puede reordenar en esta versión.
- **No existe un orden mezclado entre valores y textos libres.** Lo elegido se pinta, se lee y se envía **primero los valores, en su orden, y después los textos libres, en el suyo**: en la frase, la receta, «Elegidas», la cesta, la descripción accesible y `FormData`. Así lo que se ve es lo que se envía y lo que vuelve al recargar. Consecuencia: un valor agregado después de un texto libre se pinta **antes** que él (en la receta, el texto libre baja un renglón). Si un texto libre debe ocupar un puesto (el diagnóstico principal), la vía es `creatable`: pasa a ser una opción del catálogo.
- **Envío:** un `<input type="hidden">` **por valor** (`String(value)`) con el mismo `name`, en orden; **sin elegidos, ninguno** (como un `<select multiple>`: `FormData` sin la clave y `getAll(name)` igual a `[]`). Igual con `customName` para los textos libres. `form` se copia a todos. El `<input>` visible sigue **sin `name`**. Con `allowCustom`, `name` y sin `customName`, el texto libre no viaja (aviso 6).
- **Dentro de [`GForm`](../GForm/README.md):** registro por `name` (clave de `errors`) como con una opción; cada gesto que cambia lo elegido llama **una vez** a `notifyChange`.

### Eventos con `multiple`

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | Array nuevo | Un gesto cambia los valores. Solo si cambian |
| `update:custom` | Array de String nuevo | Un gesto cambia los textos libres. Solo si cambian |
| `change` | `{ value, custom, options, added, removed }` | **Una vez por gesto**, después de los `update:*` |

- **Elemento:** `{ value, custom: '', option }` para un valor (`option` es `null` si no se conoce) y `{ value: null, custom: texto, option: null }` para un texto libre. **`added` y `removed`** son arreglos de elementos: dicen qué cambió sin comparar arreglos. **`options`** es el arreglo de opciones alineado con `value` (`null` donde no se conoce).
- **Gestos que emiten:** marcar o desmarcar (Intro o clic), la fila de texto libre, la segunda pulsación de Retroceso, «Quitar» de un renglón, «Quitar todas» (`removed` con todo), Ctrl/⌘+Z y «Deshacer» (`added` con lo restaurado). **Un cambio de `modelValue` o `custom` hecho por tu aplicación no emite.**
- `search`, `more`, `create`, `open` y `close`, como con una opción. Elegir no cierra, así que no emite `close`.

```js
function alCambiar({ added, removed, value, custom }) {
  // added: [{ value: 'latex', custom: '', option: {...} }]  removed: []
  console.log(`+${added.length} −${removed.length} · ${value.length + custom.length} elegidos`)
}
```

### Tope (`max`)

- **Lleno** cuando `modelValue.length + custom.length` llega a `max`: la raíz lleva `is-full`; las opciones **no elegidas** llevan `aria-disabled="true"` **pero se recorren con las flechas** (las deshabilitadas del catálogo se siguen saltando): se leen y se sabe por qué. Intro o clic sobre una no cambian nada y anuncian `labels.max`. La fila de texto libre lleva `aria-disabled="true"`; las elegidas siguen activas para desmarcar; «Agregar…» (`creatable`) sigue, porque no cambia el valor.
- **Estado del tope** (`labels.max`, con icono, fuera del `listbox`): su lugar en el orden de estados es error de carga, **tope**, pista de mínimo, nada si hay opciones, «Buscando…» y «Sin resultados».
- El recuento con tope usa `labels.ofMax` («3 de 3») en «Elegidas», en la cesta y en el pie de la superficie.
- Un `modelValue` que llega con **más** elegidos que `max` se pinta y se envía **entero** (no se recorta) y avisa (aviso 16). `max` es un límite del control, como `maxlength`: Grana no valida.
- Si lo restaurado con Ctrl/⌘+Z o «Deshacer» ya no cabe en `max` (lo bajó tu aplicación), no restaura nada y anuncia el tope.

### A · La frase

- **Qué se escribe:** `Intl.ListFormat` (`type: 'conjunction'`) con el `lang` del ancestro más cercano (sin prop `locale`, como las cifras). Cada elemento es el **`code`** de la opción si lo tiene (así se escriben los diagnósticos: «E11.9, I10 y J45.9»); si no, su `label`; un texto libre, su texto en cursiva con el icono `pencil`. La frase es `aria-hidden`: la dice la descripción accesible.
- **Cede por el final y por texto:** cuando no caben todos, el último elemento de la frase es `labels.rest` con `{count}` («3 más»), con peso de acción y la cifra en `__num`: «Penicilina, Látex y 3 más». Si ni el primero cabe, se recorta con elipsis y «y N más» se conserva. La medida se hace **por lotes** (una lectura del ancho y una escritura por cuadro; sin consultas de contenedor) y se rehace con `ResizeObserver`, al cambiar lo elegido o el `lang` y al cargar las fuentes.
- **Con el foco**, la frase cede sitio al texto que se escribe: ocupa **como máximo el 55 % de la celda** y se apaga a `text-muted`. Sin elegidos, la celda es toda del `<input>`.
- **La caja mide siempre lo mismo.** Δ0 de 0 a 40 elegidas (ver «Accesibilidad con `multiple`»).
- **Grupo «Elegidas»** (A en `field`, y la hoja móvil en los tres): al abrir con el texto vacío, y cada vez que el texto vuelve a quedar vacío con la lista abierta, es el **primer grupo** (`role="group"`, nombre `labels.chosen` y su recuento). Es una **instantánea**: desmarcar deja la fila en su sitio, sin marca, hasta cerrar o escribir. Con texto escrito no hay «Elegidas»: las elegidas salen marcadas en su sitio del catálogo; **la que está en «Elegidas» no se repite** en los grupos de debajo. Tope de **12** filas: con más, una fila de acción **«Ver las N»** (`labels.showAll`) al final del propio grupo; ejecutarla pinta el resto y deja activa la fila 13.
- **Casilla** en cada opción (`g-combobox__box`, decorativa): forma de control como la de `GCheckbox`, con la marca `check`. Es la señal no cromática de «aquí se eligen varias» y de su estado. Con `multiple` no se pinta el `check` del final de la fila.
- **Selección y opción activa son independientes:** mover la activa (flechas, puntero) nunca cambia la selección.
- **El `<input>` contiene siempre el texto de búsqueda**, nunca la etiqueta de un elegido: con `multiple` no hay ficha en el campo, ni llegada de la ficha, ni slot `value`.

### B · La receta

- **Dónde va:** en el slot interno `below` de `GInput` (N5), al **final de `g-input__support`**, después de la región del mensaje; por tanto en la **tercera pista** de una `GFormRow`, sin añadir un cuarto hijo. No va en la ayuda (sería descripción del campo con botones dentro).
- **La caja es solo la búsqueda** (tu `placeholder`, p. ej. «Agregar…»); sin frase y sin «Elegidas» en `field`.
- **Renglón:** número (con `numbered`), la ficha de [`GSummary`](../GSummary/README.md) en `layout="row"` de dos líneas (o tu slot `chosen`), «Nueva» si es de la pasada y el botón «Quitar». Mismas props que la opción, sin resaltado de búsqueda; la marca de homónimos se calcula sobre los renglones pintados.
- **«Nueva»** (`labels.fresh`, texto que se lee, más una barra de acento al inicio) marca lo agregado **en la pasada actual**.
- **Quitar no cierra el hueco:** el renglón pasa a un **rastro** del **mismo alto** con el nombre tachado (`labels.trace`) y el botón **«Deshacer»**; **el foco pasa a «Deshacer», en el mismo sitio**. «Deshacer» devuelve el elemento a su posición (si cabe en `max`) y deja el foco en su «Quitar». «Quitar todas» convierte todos los renglones en rastros y el foco vuelve al campo.
- **Pasada:** una pasada nueva empieza cuando la persona, **después de haber salido del componente, vuelve a escribir** en el campo. Entonces los rastros se pliegan y se retiran las marcas «Nueva». **Salir no pliega nada** (la línea a la que salta no se mueve bajo su atención). Un cambio de `modelValue` o `custom` que el componente no emitió (tu aplicación reinicia el formulario) retira rastros y marcas sin animación.
- **Tope de 6** renglones en reposo (constante de diseño): los seis primeros **más** los nuevos, los rastros y el marcado por Retroceso, que se ven siempre. Si quedan más, el botón **«Ver los N»** (`aria-expanded`, `aria-controls`), que pasa a «Ver menos».
- **Crece:** lo de debajo baja un renglón por elección (límite aceptado: es su promesa, y la razón de que no sea el valor por defecto). **Mientras la lista está abierta, la forma de A tapa la receta**: lo nuevo se ve al cerrar, con «Nueva».

### C · La cesta

- La superficie de una sola opción (`GDialog`) con su campo de búsqueda; en el cuerpo, **los resultados a un lado y la cesta al otro, en el sitio de la vista previa** (clase `has-basket`), en proporción 6 : 5. **Con `multiple` la vista previa no se pinta** (y su slot se ignora con aviso): la fila ya lleva el dato que distingue y la marca de contraste entre homónimos.
- La cesta es una sección con título (`labels.chosen` y su recuento, `selected` u `ofMax`) y, vacía, `labels.basketEmpty`. Sus renglones son los de B (con `numbered`, «Quitar» y rastro con «Deshacer» y el foco en él) **sin «Nueva»**; los rastros duran **hasta cerrar** la superficie; tope de **12** con «Ver las N» y «Ver menos». Los homónimos se marcan también en la cesta.
- **Elegir no cierra.** Pie con el recuento (texto visible) y **«Listo»** (`labels.done`, un [`GBtn`](../GBtn/README.md) con el tamaño del campo). **Esc, el fondo, el cierre y «Listo» cierran conservando** lo elegido: **no hay borrador**, el modelo cambia en cada gesto. El foco vuelve al campo.
- **Hoja móvil** (visor de 520 px o menos), la misma para A, B y C: búsqueda, lista con **«Elegidas» arriba** y el pie; opciones de 44 px como mínimo. **La cesta no cabe y no existe ahí.** Los anuncios van a la región viva de dentro de la superficie.

### Teclado con `multiple`

Los eventos de lista **no actúan mientras hay composición IME**.

| Tecla | Lista cerrada | Lista abierta |
| --- | --- | --- |
| Carácter | Abre y busca | Busca |
| ↓ / ↑ | Abre; la primera / la última fila | Siguiente / anterior; no cicla; salta las deshabilitadas **del catálogo**; las no elegibles **por el tope sí se recorren** |
| Alt+↓ / Alt+↑ | Como con una opción | Alt+↑ cierra |
| Av Pág / Re Pág | | Diez adelante / atrás |
| → | Edición | Con texto fantasma y el cursor al final: acepta el texto **sin elegir** |
| **Intro** | Nativo (envío implícito, como `GInput`) | **Alterna** la activa (marca o desmarca) y **la lista sigue abierta** con el texto buscado **seleccionado**; sobre una fila de acción, la ejecuta |
| Esc | Con texto: lo vacía (sin propagar). Si no, nativo | Cierra y conserva el texto (`stopPropagation`: no cierra un `GDialog` anfitrión) |
| Tab | Sale (descarta el texto) | Cierra y sale. **Nunca elige** |
| **Retroceso** | Con texto, edita. **Campo vacío: en dos tiempos** | Igual |
| **Ctrl/⌘+Z** | Si lo último fue quitar, lo devuelve; si no, el deshacer nativo del texto | Igual |
| Espacio | Escribe un espacio (es un campo de texto: no marca) | Igual |

- **Intro alterna y la lista se queda.** Tras marcar o desmarcar, los resultados siguen a la vista, la activa no se mueve y **el texto buscado queda seleccionado** (medido: «ibu» queda seleccionado de 0 a 3): lo siguiente que se teclea lo reemplaza, y se pueden marcar varias del mismo resultado («amoxi» da dos presentaciones). Marcar o desmarcar **no reordena**; el orden se rehace al abrir y al cambiar el texto. El clic alterna igual.
- **Seguridad** (la de una opción, llevada a varias):
  - **Intro sobre una opción ya elegida que quedó activa sola** (resaltado automático al escribir) **no la quita**: anuncia `labels.already` y selecciona el texto. Desmarcar con Intro exige haberla activado la persona (flechas, puntero o →). Con la activa puesta sola y búsqueda pendiente, Intro no hace nada.
  - **Tab nunca elige.** Con `multiple` no hay la excepción del texto fantasma: Intro es la tecla de agregar y Tab es salir.
  - **Salir descarta** el texto a medio escribir (blur, Tab, `pointerdown` fuera): nunca se agrega al pasar, tampoco con `allowCustom`.
- **Retroceso en dos tiempos** (con el campo vacío; también en el campo de búsqueda de la superficie): la primera pulsación **marca** el último elegido (el último en el orden pintado) con **tachado y fondo de selección** (no solo color) en la frase, el renglón o la fila de «Elegidas»; si estaba cedido en «y N más» o pasado el tope de renglones, se saca a la vista. Anuncia `labels.armed`. La segunda lo quita (un gesto, con `change`). **Desarman:** cualquier otra tecla, el puntero, salir del campo, cerrar la superficie o un cambio del modelo. **Con la tecla sostenida (`event.repeat`), ni marca ni quita.**
- **En la superficie:** rige la tabla de «Lista abierta» sobre el campo de búsqueda; Tab se mueve dentro del diálogo (campo, botones de la cesta, «Listo», cierre) y nunca elige; Esc la cierra (un nivel) conservando lo elegido. **Al abrir el disparador con ↓ no queda ninguna fila activa:** hace falta otra ↓ antes de Intro, en la paleta y en la hoja a 375 y 320 px (igual que con una opción; la tabla del contrato dice «la primera / la última fila» en general y vale para `field`; la precisión está avisada a su dueño).

#### Deshacer (Ctrl/⌘+Z) y rastro

- Si lo último que cambió lo elegido **en este campo** fue **quitar** (desmarcar, Retroceso, «Quitar», «Quitar todas»), Ctrl/⌘+Z lo devuelve **a su posición**, anuncia `restored` (o `restoredAll`) y llama a `preventDefault`. **Un solo nivel.**
- El deshacer **caduca** al escribir en el campo, con cualquier otro gesto que cambie lo elegido o si tu aplicación cambia `modelValue` o `custom`; caducado, Ctrl/⌘+Z es el deshacer nativo del texto. Ctrl/⌘+Mayús+Z no se intercepta.
- En B y C el mismo quitar deja además el **rastro visible** con «Deshacer» (ver arriba); en A solo existe el atajo y la marca previa de Retroceso.
- «Deshacer» del rastro y Ctrl/⌘+Z hacen lo mismo y emiten `change` con `added`.

### Textos nuevos (`labels`)

Sin valores por defecto, como el resto. Los contados admiten un String con marcadores **o una Function** (plural y género los pones tú: «seleccionadas», «diagnósticos», «Ver los 8» frente a «Ver las 40»). Las cifras se formatean con `Intl.NumberFormat` del `lang` del ancestro.

| Clave | Marcadores o firma | Dónde | Si falta |
| --- | --- | --- | --- |
| `selected` | `{count}` o `(count) => String` | Recuento del pie de la superficie y título de la cesta («3 seleccionadas») | Sin recuento; aviso al montar |
| `about` | `{count}`, `{list}` o `(count, list) => String` | Descripción accesible («3 seleccionadas: Penicilina, Látex y Sulfonamidas») | La descripción dice solo la lista; aviso |
| `customItem` | `{text}` | Nombre de un texto libre en la descripción y en los anuncios | El texto solo; aviso con `allowCustom` |
| `added`, `removed`, `restored` | `{label}`, `{count}` o `(label, count) => String` | Anuncios | Sin ese anuncio; aviso al necesitarse |
| `clearedAll`, `restoredAll` | `{count}` o `(count) => String` | Anuncios de «Quitar todas» y de su deshacer | Ídem |
| `armed` | `{label}` | Anuncio de la primera pulsación de Retroceso | Ídem |
| `already` | `{label}` | Intro sobre una elegida resaltada sola | Ídem |
| `max` | `{max}` o `(max) => String` | Estado del tope y su anuncio | Estado sin texto; aviso con `max` |
| `ofMax` | `{count}`, `{max}` o `(count, max) => String` | Recuento con tope («3 de 3») | Usa `selected`; aviso con `max` |
| `chosen` | | Nombre del grupo «Elegidas» y título de la cesta | Sin nombre visible; aviso al montar |
| `rest` | `{count}` o `(count) => String` | Último elemento de la frase cedida («3 más») | La frase se recorta con elipsis sin decir cuántas faltan; aviso con `selection="inline"` |
| `showAll` | `{count}` o `(count) => String` | «Ver las 40» («Elegidas», cesta) y «Ver los 8» (receta) | Sin fila ni botón: se pinta todo, sin tope; aviso |
| `showLess` | | «Ver menos» de la receta y de la cesta | Desplegada, no se vuelve a plegar; aviso |
| `done` | | «Listo» del pie de la superficie | Sin botón (cierran Esc, el fondo y el cierre); aviso al montar |
| `remove` | `{label}` | Nombre de «Quitar» de un renglón | Sin «Quitar» (se quita desde la lista o con Retroceso); aviso |
| `undo` | | «Deshacer» del rastro | Sin rastro: quitar retira el renglón (Ctrl/⌘+Z sigue); aviso |
| `trace` | `{label}` | Texto del rastro («Diabetes mellitus tipo 2 quitada») | Ídem |
| `fresh` | | Marca «Nueva» de la receta | Solo la barra; aviso con `selection="list"` |
| `basketEmpty` | | Cesta vacía | Vacía, sin texto; aviso con `appearance="palette"` |
| `clear` | | Con `multiple`, el texto de «Quitar todas» | Como con una opción |

### Slots con `multiple`

| Slot | Con `multiple` |
| --- | --- |
| `option`, `lead`, `empty`, `load-error`, `label`, `hint`, `error`, `prepend` | Como con una opción (el slot `option` va **después** de la casilla, que no se sustituye) |
| **`chosen`** | Contenido de un renglón de la receta y de la cesta. Alcance `{ option, custom }` (`option` es `null` con un texto libre). Sin interactivos; **conserva el texto que distingue**. Por defecto, la `GSummary` de fila. Sin `multiple`, se ignora con aviso |
| `value` | No aplica (no hay ficha): se ignora con aviso |
| `preview` | No se pinta con `appearance="palette"` (la cesta ocupa su sitio): aviso |

Con un slot `chosen` alto (cuatro líneas), el rastro sigue midiendo lo que el renglón (ver «Accesibilidad con `multiple`»).

### Anuncios

| Suceso | Texto |
| --- | --- |
| Agregar (Intro, clic, fila de texto libre) | `added` (`{label}`: el nombre del elemento; `{count}`: elegidos después) |
| Quitar (desmarcar, Retroceso, «Quitar») | `removed` |
| Deshacer de uno (Ctrl/⌘+Z o «Deshacer») | `restored` |
| «Quitar todas» y su deshacer | `clearedAll` y `restoredAll` |
| Primera pulsación de Retroceso | `armed` |
| Intro sobre una elegida resaltada sola | `already` |
| Intento con el tope alcanzado | `max` |

- Los de un gesto se anuncian **en el acto** (los 600 ms de una opción son para los recuentos de resultados, que siguen igual); **un anuncio por gesto**, que sustituye al recuento pendiente. No se anuncian abrir, cerrar, «Ver las N» ni el pliegue de los rastros. Con la superficie abierta van a la región viva de dentro.
- **Se anuncia también al marcar dentro de la lista:** `aria-selected` cambia, pero con `aria-activedescendant` no todos los lectores lo dicen y nadie más da el recuento. Puede **duplicarse con algún lector** (ver «No verificado»).
- **Nombre de un elemento** en anuncios y descripción: `code`, un espacio y `label` si la opción tiene `code`; si no, `label`; un texto libre, `labels.customItem`.

### Accesibilidad con `multiple`

```html
<div class="g-input g-combobox g-combobox--appearance-field g-combobox--multiple g-combobox--selection-inline has-chosen is-open">
  <label class="g-input__label" id="ID-label" for="ID">Alergias</label>
  <div class="g-input__row"><div class="g-input__control">
    <span class="g-combobox__value">
      <span class="g-combobox__sentence" aria-hidden="true">…<span class="g-combobox__sentence-rest"><span class="g-combobox__num">3</span> más</span></span>
      <input class="g-input__field g-combobox__field" id="ID" type="text" role="combobox" aria-autocomplete="list"
             aria-haspopup="listbox" aria-expanded="true" aria-controls="ID-list" aria-activedescendant="ID-opt-c0"
             aria-describedby="ID-about ID-hint ID-message">
      <span class="g-combobox__about" id="ID-about">5 seleccionadas: Penicilina, Látex, Ibuprofeno, Sulfonamidas y Polen de olivo (texto libre)</span>
      <input type="hidden" name="alergias" value="penicilina">   <!-- uno por valor; ninguno sin elegidos -->
    </span>
  </div></div>
  <div class="g-combobox__popup" popover="manual">
    <ul class="g-combobox__list" id="ID-list" role="listbox" aria-multiselectable="true" aria-labelledby="ID-label">…</ul>
  </div>
</div>
```

- **`aria-multiselectable="true"`** en el `listbox`; **todas** las opciones con `aria-selected` explícito (`"true"` o `"false"`). No hay `aria-checked`: APG admite uno u otro, nunca los dos. La casilla es decorativa (`aria-hidden`).
- **Descripción del valor** (primera en `aria-describedby`, solo con elegidos): `labels.about` con la cuenta y la lista formateada con `Intl.ListFormat` de los **nombres** en el orden pintado. **No tiene tope de longitud** (40 elegidas son 40 nombres): sin revisar con lector real.
- **La frase (A) es `aria-hidden`**; la receta (B) y la cesta (C) son **listas con nombre** (la etiqueta del campo; la cesta, su título) con botones reales.
- **«Quitar»** de un renglón: `aria-label` = `labels.remove` con el nombre del elemento, icono `x`, aislado al final del renglón. **«Deshacer»**: texto visible con icono `undo-2` decorativo y `aria-describedby` = el texto del rastro. El grupo «Elegidas» es un `role="group"` con nombre; sus filas llevan ids propios (`ID-opt-c{n}`) para no repetirse en el catálogo.
- **Mínimos** (auditoría de coco, tres motores): área táctil de «Quitar» **24 × 24 px con puntero fino y 44 × 44 con puntero grueso**; «Deshacer» y «Ver los N» de 24 de alto como mínimo y **44 × 44** con puntero grueso (emulado en Chromium y WebKit; Firefox no lo emula).
- **Δ0 de A** (`#cm-row`, una `GFormRow` con folio, etiquetas y servicio): con 0, 1, 2, 3, 5, 8, 12, 20 y 40 elegidas, la caja, la raíz, las vecinas, el alto de la fila y la línea de debajo cambian **0,00 px**, con el tema por defecto, el de la auditoría (`space` 3, cuerpo de 15), el de `primary` propia y el oscuro; también con el texto al 200 %. La frase mide una línea centrada en la del campo, con todos los trozos a la misma altura; los elementos a la vista más «N más» son siempre las elegidas.
- **Con el foco**, la frase ocupa el **55,0 %** de la celda con 8 elegidas («y 7 más») y el campo conserva al menos el 45 %.
- **Rastro con Δ0:** el rastro mide **lo mismo que el renglón** (Δ 0,00 px de alto y de posición): lo escribe el componente en `--_row-h` al convertir el renglón y el CSS lo usa como alto mínimo. Con un slot `chosen` de cuatro líneas, la receta mide 93 px y la cesta 94 antes y después de quitar, y lo de debajo no se mueve (la auditoría encontró que antes de la corrección pasaba de 93 a 52 px; corregido y verificado en los tres motores).
- **Receta (B):** con `numbered` y `max` 3, agregar con el puntero añade un renglón «Nueva»; la caja y la etiqueta no se mueven y **lo de debajo baja exactamente un renglón** (52 px con el tema por defecto, 50 con `space` 3). Con 40 elegidas la receta enseña 6 renglones y «Ver los 40» (`aria-expanded="false"`); desplegada, 40 y «Ver menos» con el chevron girado 180°.
- **Cesta (C):** resultados y cesta en proporción **6 : 5 (1,200 medido)** sin solaparse; dos «Ana López Ruiz» con **4 datos marcados** de contraste en la cesta; pie con «2 seleccionados» y «Listo» dentro del diálogo, bajo el cuerpo. En la hoja a **375 × 812 y 320 × 640**: arriba, ancho completo, sin cesta, «Elegidas» primer grupo, opciones de 62 px o más (44 como mínimo exigido), sin desborde de la página ni de la hoja y «Listo» dentro del visor.
- **Contraste** (compuesto real; mínimo de 28 configuraciones en Chromium —tema por defecto, el de la auditoría, el de `primary` propia y los once de Dark Color Presence, claros y oscuros— y de 6 en Firefox y WebKit, con mínimos iguales o mayores):

| Elemento | Mínimo medido |
| --- | --- |
| Frase, texto libre, «y N más», «Elegidas», título del renglón, «Ver los N» | 15,18:1 |
| Frase con el foco, recuento, número, «Quitar», pie, lápiz | 7,38:1 |
| Elemento marcado por Retroceso (frase) / renglón marcado | 14,51:1 / 14,60:1 |
| Casilla: borde sin marcar (control, ≥ 3:1) | 3,43:1 |
| Casilla marcada: contorno `text` / marca `on-primary` sobre `primary` (también en la activa invertida de la paleta) | 15,18:1 / 4,70:1 |
| Estado del tope (y su icono) | 4,66:1 |
| «Nueva» / su barra | 4,51:1 / 4,52:1 |
| Rastro / «Deshacer» (también al pasar el puntero y en la cesta) | 6,87:1 / 4,51:1 |
| Cesta: título / recuento y vacía / renglón | 16,06:1 / 6,87:1 / 15,18:1 |
| Casilla de una opción **no elegible por el tope** | 1,17:1 (ver abajo) |

  La casilla no elegible por el tope se apaga con su fila, igual que una deshabilitada: WCAG 1.4.11 exime a los componentes inactivos, y la razón se lee de tres formas (el estado del tope con su icono, `aria-disabled` y el anuncio). Los valores que rozan 4,5 («Nueva», «Deshacer», barra, tope) vienen de los pares del tema (`accent-soft`, `warning-soft`), no del componente.
- **`forced-colors`** (emulado en los tres motores): casilla sin marcar `CanvasText`, marcada `Highlight` con la marca `HighlightText`; elemento marcado por Retroceso `Highlight` / `HighlightText` más tachado; «Nueva» con borde y barra `CanvasText`; rastro `CanvasText` tachado.
- **RTL:** la frase empieza en el borde de inicio (Δ 0); la barra de «Nueva» va a la derecha y «Quitar» a la izquierda de la ficha, sin desborde; la cesta queda a la izquierda de los resultados.
- **Texto al 200 %** (raíz a 32 px; los tamaños del tema son `rem`): campo a 28 px; A con Δ0 de 0 a 40 en la fila, frase en una línea y sin desplazamiento horizontal; B sin renglones desbordados («Quitar» dentro y de 24 px o más); C con cesta sin solape ni desborde.
- **Con un `GTooltip` envolviendo el campo** (A, B y C): `aria-describedby` lleva la descripción de lo elegido **primero** y después el del tooltip (también tras elegir); se cierra al abrir la lista o la paleta (no tapa el panel); tras «Listo» el foco devuelto al campo no lo enciende; tras Esc, cerrado.
- **Sin errores de consola** en los tres motores.

### Personalidad de la Fase 2

Cinco gestos, todos con tokens y **sin movimiento con `prefers-reduced-motion: reduce`** (medido en los tres motores: ninguna animación `g-combobox-*` tras marcar en A, agregar en B y marcar en C, y ninguna clase pendiente; los fundidos de color y opacidad se quedan). **Nada se anima al montar, al abrir, al cambiar el texto ni cuando tu aplicación cambia el modelo**: solo tras un gesto. Origen: ronda de kiwi `design/lab/combobox/r03/`; decisiones #417 a #430, elegidas por el usuario.

1. **A · El campo nunca crece.** Lo elegido se *escribe* en la línea del campo, con el ritmo de `Intl.ListFormat`: sin fichas, sin ×, sin insignia, y con el alto de la línea (Δ0 medido de 0 a 40, también al 200 %). Cede **por texto** («y N más» con peso de acción) y su cifra **rueda** desde abajo cuando cambia por un gesto (`--g-duration-press` con `--g-ease-out`, no el muelle; recortada a su hueco). Con el foco la frase **se aparta** para el texto que se escribe y se apaga.
2. **La casilla salta.** Al marcar, la marca entra **desde 0,4 con `--g-ease-bounce`** (segundo uso aprobado del rebote; el pico medido es de 1,12 en Chromium, Firefox y WebKit). Al desmarcar, solo se funde. Es lo único que rebota: un control pequeño que responde con un golpe seco.
3. **Quitar deja huella.** Retroceso marca antes de quitar con **tachado y selección**; en B y C el renglón se convierte en un **rastro del mismo alto** (Δ 0,00 px) con «Deshacer» como **la única pieza de color**: «Deshacer» es una píldora `accent-soft`, para que se encuentre sin buscarlo.
4. **B · La receta registra la pasada.** Lo nuevo dice «Nueva» y lleva una **barra de acento al inicio** (en RTL, a la derecha); el renglón nuevo **crece desde la línea anterior** (`grid-template-rows` de 0 a 1, `--g-duration-slow` con `--g-ease-out`) y lo de debajo baja con él, sin salto; en la pasada siguiente los rastros se pliegan al revés. Quien revisa ve qué cambió.
5. **C · Lo marcado viaja a la cesta.** El renglón llega desde la fila marcada con el muelle de la ficha de una opción (`--g-ease-spring`, el mismo uso aprobado de #336: algo elegido que llega). Con el tema por defecto, el vector parte de 214 px medidos (la cota `space × 2 / 0,038` da 210,5; la diferencia es el redondeo del primer cuadro) y llega a 0; con `space` 3 parte de 162. Esta medida se tomó con la duración dilatada a 1500 ms, porque WebKit sin cabeza pinta cada 40 a 75 ms y con los 300 ms reales apenas dejaba 3 o 4 cuadros.

Reservado (no adoptado): un resaltado único que viaja entre opciones, como el de `GMenu`.

### Tema con `multiple`

**Ningún token nuevo.** Además de los de una opción:

| Token | Para qué |
| --- | --- |
| `--g-color-border-control`, `--g-color-primary`, `--g-color-on-primary`, `--g-color-text`, `--g-color-surface` | Casilla: borde (≥ 3:1); marcada con relleno `primary`, marca `on-primary` y contorno `text` (`surface` en la activa invertida de la paleta) |
| `--g-color-selection` | Elemento o renglón marcado para quitar (con tachado) |
| `--g-color-accent-soft`, `--g-color-on-accent-soft`, `--g-color-accent`, `--g-color-on-accent` | «Deshacer» (píldora; al pasar, `accent` / `on-accent`) y «Nueva» |
| `--g-color-accent-text`, `--g-focus-width` | Barra de «Nueva» |
| `--g-color-warning-soft`, `--g-color-on-warning-soft` | Estado del tope |
| `--g-color-text`, `--g-text-action-weight` | «Ver los N» y «Ver las N» |
| `--g-color-text-muted` | Frase con el foco, número, rastro, recuentos |
| `--g-color-border` | Separación entre renglones y contorno de la receta y la cesta |
| `--g-ease-bounce`, `--g-ease-spring`, `--g-ease-out`, `--g-duration-fast`, `--g-duration-press`, `--g-duration-slow` | Movimiento (`--g-ease-bounce` y `--g-ease-spring` solo dentro de `@supports`; fuera, `--g-ease-out`) |

- **La casilla marcada lee `primary`, no `brand`** (#430, y #429): es una selección, no la marca, y sigue al mismo token que `GCheckbox`; con un tema de clave `primary` propia las dos casillas siguen juntas. El contorno `text` sigue haciendo falta: `primary` solo como forma da 1,77 en `lustre` y 1,92 en `spotify`.
- «Nueva» y «Deshacer» usan el **par del tinte** (`accent-soft` / `on-accent-soft`) porque `accent-text` no está garantizado sobre `surface-sunken`; el tope usa `warning-soft` / `on-warning-soft` porque `warning-text` sobre el tinte da 4,15:1 en el tema por defecto oscuro. Lo mide el motor de tema, no el componente.
- **Constantes de diseño (no son tema):** 12 (filas de «Elegidas» y de la cesta antes de «Ver las N») y 6 (renglones de la receta en reposo), en JS; 0,4 (escala de partida de la marca de la casilla); 55 % (ancho máximo de la frase con el foco); casilla de `space × 5` (`space × 4` con el campo `xs` o `sm`) con la marca al 0,72; renglón con alto mínimo `body-line + body-sm-line + space × 2` (52 px con el tema por defecto, 50 con `space` 3); 6 : 5 de la cesta; `--_travel-x` y `--_travel-y` (el vector del viaje) y `--_row-h` (el alto del rastro): variables en línea del componente, no tokens.

### Clases con `multiple`

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-combobox--multiple`, `g-combobox--selection-{inline\|list}` | Raíz | Con `multiple` |
| `has-chosen`, `is-full` | Raíz | Con elegidos; tope alcanzado |
| `g-combobox__sentence`, `__sentence-item` (`is-custom`, `is-armed`), `__sentence-sep`, `__sentence-rest`, `__sentence-icon` | Frase (A) | `selection="inline"` con elegidos |
| `g-combobox__num`, `is-rolling` | Cifra de un recuento | Siempre; `is-rolling` mientras rueda |
| `g-combobox__box`, `is-ticking` | Casilla de una opción | Cada opción; `is-ticking` mientras salta |
| `g-combobox__group.is-chosen`, `__group-tally`, `__action--all` | «Elegidas» y «Ver las N» | A y hoja, con el texto vacío |
| `g-combobox__option.is-armed` | Fila de «Elegidas» marcada para quitar | Retroceso |
| `g-combobox__status--max` | Estado del tope | `is-full` con el panel abierto |
| `g-combobox__chosen`, `__rows`, `__rows-all` | Receta (B) y su «Ver los N» | `selection="list"` con elegidos o rastros |
| `g-combobox__row` (`is-fresh`, `is-trace`, `is-armed`, `is-custom`, `is-entering`, `is-leaving`, `is-arriving`) y `__row-number`, `__row-fresh`, `__remove`, `__trace`, `__undo` | Renglón (B y C) y sus partes | Por elemento |
| `g-combobox__surface-body.has-basket`, `__basket`, `__basket-title`, `__basket-tally`, `__basket-empty` | Cesta (C) | Paleta con `multiple`, por encima de 520 px |
| `g-combobox__foot`, `__foot-tally`, `__done` | Pie de la superficie («Listo» es un `GBtn` con esa clase) | Superficie con `multiple` |

### En una `GFormRow` con `multiple`

- **A y C:** la caja no cambia de alto (Δ0); comparte fila como con una opción (`--g-form-min: 60` sigue declarado sobre `field`).
- **B:** la caja y la etiqueta no se mueven; la receta crece en la **tercera pista** (la del pie) y lo de debajo baja. En una fila estrecha la receta ocupa la columna del campo: sube `--g-form-min` o dale al campo su propia fila.
- En el playground, las filas `#cm-row`, `#cm-row-b` y `#cm-row2` (solo lectura y deshabilitado) cubren estos casos.

### SSR y RTL con `multiple`

- **SSR:** el servidor pinta los ocultos (uno por valor y por texto libre), la receta (B), la frase **completa** (sin cesión) y la descripción accesible, con `Intl` **sin `locale`**; al montar se lee el `lang` del ancestro, se rehacen frase, descripción y cifras y se mide la cesión. Nada se anima. Cubierto por `GCombobox.ssr.test.js` (6 pruebas).
- **RTL:** propiedades lógicas; frase y renglones empiezan en el borde de inicio; la casilla y la barra de «Nueva» van al inicio; `Intl.ListFormat` sigue al `lang`, no a `dir`; los textos de los elementos llevan `dir="auto"`.

### Avisos con `multiple`

Prefijo `[Grana GCombobox]`; una vez por instancia y motivo; solo fuera de producción. Siguen a los de una opción.

| # | Causa | Qué hace el componente |
| --- | --- | --- |
| 13 | `multiple` cambiado después de montar | Sin efecto; cambia la `key` |
| 14 | `modelValue` o `custom` que no son arreglos; repetidos; `value` sin opción conocida ni en `selectedOptions` | Se normalizan; se pinta y se envía uno solo; se pinta `String(value)` |
| 15 | `selectedOption` con `multiple`; `selectedOptions`, `selection`, `numbered` o `max` sin él; `numbered` sin renglones (`inline` en `field`); slot `value` con `multiple`; slot `preview` con `multiple` en `palette`; slot `chosen` sin `multiple` | Se ignoran |
| 16 | `max` menor que 1 o no entero; más elegidos que `max` | Sin límite; se pinta y se envía todo |
| 17 | Faltan textos de `labels`: `selected`, `chosen` y `done` al montar; `customItem` con `allowCustom`; `rest` con `selection="inline"`; `fresh` con `selection="list"`; `basketEmpty` con `palette`; `undo` y `trace` con renglones; `max` y `ofMax` con `max`; `about`, `added`, `removed`… la primera vez que se necesitan | Pinta sin ese texto o no pinta la pieza |

### Peso y rendimiento

- **Peso:** `dist/combobox.js` **21 665 bytes gzip** (21,7 KB) y `dist/combobox.umd.js` **19 569**, medidos por bruno el 2026-10-06. La Fase 2 añadió **7 592 bytes (7,4 KB)**, por debajo del tope de 8 KB de #328 y #428, y **queda poco margen**: crecer más pediría la entrada aparte `@grana/vue/combobox-multiple` que prevé el contrato. `GBtn` («Listo») llega por `__shared` sin copia; el motor puro de `multiple` (`multi.js`) va en la entrada. El CSS va en `grana.css`; las compuertas `g-combobox__sentence` y `g-combobox__trace` en `dist/grana.css` y la ausencia de `g-summary__` en `dist/combobox.js` pasan (auditoría; comprobadas de nuevo al documentar con `grep` sobre el `dist/` del árbol de trabajo). No viaja nada en `dist/grana.js` (0 apariciones de `GCombobox`).
- **Rendimiento** (abrir con **500 opciones locales y 40 elegidas**, hasta el segundo cuadro; compuerta #428: menos de 150 ms en Chromium y Firefox y de 200 en WebKit, con un solo worker, mediana de tres):

| Caso | Chromium | Firefox | WebKit | Fuente |
| --- | --- | --- | --- | --- |
| A con «Elegidas» | 31 ms | 50 ms | 71 ms | auditoría de coco |
| C la cesta | 42 ms | 67 ms | **133 ms** | auditoría de coco |
| A con «Elegidas» | 36 ms | 58 ms | 69 ms | bruno, banco `combobox-multiple.html` |
| C la cesta | 49 ms | 73 ms | 169 ms | bruno, banco `combobox-multiple.html` |

  Las cifras de coco se tomaron con la máquina cargada (carga media de 8,4 por otras sesiones), así que sin carga serían iguales o menores; las de bruno son anteriores. En el **playground completo** la cesta mide 167, 288 y 404 ms: según bruno, el 57 % es `showModal` recalculando el estilo de miles de elementos de las demás secciones (cifra de la página, no del componente). La compuerta de una sola opción (500 opciones, menos de 150 ms) en WebKit, con cinco repeticiones y un worker: 97, 101, 109, 116 y 120 ms. Los topes de 12 y de 6 existen también por esto.

### Límites con `multiple`

- **No se reordena** (reservado: la prop `reorderable`, con ronda propia). El orden es el de elección, valores primero y textos libres después; un valor agregado tras un texto libre se pinta antes que él.
- **Pegar varios valores no los separa:** «penicilina, látex» es un texto de búsqueda. Para etiquetas sin catálogo está `GTagInput`, reservado.
- **Un solo nivel de deshacer**, que caduca al escribir, con otro gesto o con un cambio de tu aplicación.
- **La receta empuja lo de debajo** un renglón por elección, y la forma de A la tapa mientras la lista está abierta.
- **La cesta no existe en móvil** (visor de 520 px o menos): ahí rige la hoja común, con «Elegidas» arriba.
- **Los topes de 12 y de 6 son de diseño** (no configurables); lo demás se ve con «Ver las N» y «Ver los N».
- **Salir descarta el texto a medio escribir**, también con `allowCustom`: un texto libre entra solo por su fila.
- **La descripción accesible no tiene tope de longitud:** con 40 elegidas son 40 nombres.
- **`GSelect` no gana `multiple`;** tampoco existe `multiple` en el editor de valor de `GFilterBar`.
- **WebKit** (y Safari sin «Acceso total por teclado») llega con Tab a los botones de la receta, la cesta y «Listo» solo con el ajuste del sistema; en las pruebas, con Alt+Tab. Esc y el fondo cierran la superficie.
- **El pliegue de un rastro con un slot `chosen` alto** (`g-combobox-row-out` parte de `--_row-h`) tiene la regla en el CSS, pero solo lo cubre el spec de personalidad con la `GSummary` por defecto.

### Verificación de `multiple`

- **Pruebas** (vitest con jsdom): **167 de 167 en verde en `src/components/GCombobox`**, ejecutadas de nuevo al documentar (`GCombobox.test.js` 110, `GCombobox.multiple.test.js` 39, `GCombobox.ssr.test.js` 6, `engine.test.js` 6 y `multi.test.js` 6), más las **10** de `src/combobox.test.js` (la entrada). Las de `multiple` cubren el modelo (normalización, repetidos, valor desconocido, textos libres, orden), el envío, `change` una vez por gesto, Intro, Tab, Esc, Espacio e IME, Retroceso en dos tiempos, Ctrl/⌘+Z y su caducidad, «Quitar todas», el tope, «Elegidas», `aria-multiselectable`, la receta, el rastro y la pasada, la cesta, el pie, los anuncios, las clases de movimiento, la cesión de la frase, los avisos 13, 15 y 17 y SSR.
- **Navegador:** `node design/lab/combobox/auditoria-multiple-verificar.mjs` sobre el componente real: **2656 de 2656** comprobaciones (estático 20, Chromium 1398, Firefox 610, WebKit 628), con los temas por defecto, el de la auditoría y el de `primary` propia, claros y oscuros, y 28 configuraciones en Chromium. Los specs de bruno (`combobox-multiple`, `personalidad-combobox-multiple` y `combobox-despliegue`): 57 de 57 por motor. Estos números son los de la auditoría de coco (`cd0a1e0`); **no se repitieron al documentar** (solo vitest, `check-icons`, el peso y las compuertas de `dist/grana.css`).
- **Dentro de un `GDialog`:** el spec `combobox-multiple.spec.mjs` cubre que elegir funciona, que Esc cierra la lista (o la paleta) y **no el diálogo**, y que el anuncio sale dentro de él; el caso está en el playground (`#cm-dlg`).
- **La Fase 1 no cambia:** el estilo calculado de **todas** las cajas de los combobox de una sola opción, en reposo, con A abierta y con la paleta abierta, con y sin el CSS de la Fase 2: **0 diferencias** en los tres motores. Sus pruebas siguen en verde.
- **Hallazgos de la auditoría:** el 1 (el rastro no medía lo mismo que el renglón con un slot alto: 93 a 52 px) **corregido** en `GCombobox.css` y verificado; el 2 (un pendiente obsoleto en el `meta.json` sobre el despliegue) retirado por su dueño; el 3 (la casilla no elegible, 1,17:1) intencionado; el 4 (la superficie abre sin fila activa con ↓) anotado para el contrato; el 5, del arnés de pruebas.

### No verificado con `multiple`

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): `aria-selected` con `aria-activedescendant` y el anuncio propio (puede duplicarse), la descripción accesible con 40 nombres, la frase `aria-hidden` junto al campo, «Elegidas», la receta y la cesta como listas con botones, el foco en «Deshacer» y el rastro descrito, `GTooltip` junto a la descripción en `aria-describedby`, y los dos `combobox` de la superficie. Solo se comprobó la estructura.
- **`forced-colors` real** (solo emulado), **Safari real**, **táctil real** y **teclado virtual real** sobre la hoja, **IME real con varios elegidos**, **zoom real del navegador** (el 200 % se emuló con el tamaño de la raíz; el 400 % no se midió) y **`pointer: coarse` en Firefox** (no se puede emular).
- **Cifras de peso y de rendimiento:** son las anotadas por bruno y coco (arriba); solo el peso se volvió a medir de forma aproximada al documentar.

## Personalidad

Cuatro gestos de movimiento y una regla de forma; todos con tokens (`--g-duration-*`, `--g-ease-*`), sin constantes de tema nuevas y **con `prefers-reduced-motion: reduce` ninguno se mueve** (nada se anima al montar). Origen: rondas de kiwi `design/lab/combobox/r01/` y `r02/` y comparación de coco con lo aprobado (decisiones #329 y #336; el usuario eligió A, B y C).

1. **A · La forma única.** Abierto, el campo no tiene un menú debajo: *crece*. El panel empieza en el borde superior de la caja (o termina en el inferior, `is-up`), mide lo que ella y su zona alta es transparente y no captura el puntero. Contorno, anillo de foco y sombra son de la forma completa; entre campo y lista queda **una línea fina** que cae sobre el borde de la caja. Medido sobre el componente real: diferencia caja a forma **menor de 1 px** (izquierda, arriba y ancho; también hacia arriba), costura **0,00 px** (WebKit −0,02), anillo de `--g-focus-width` **sin cortes** del campo a la lista, y el punto central del campo devuelve el `<input>`.
2. **A · El despliegue.** La lista crece desde la línea del campo (`grid-template-rows` de 0 a 1 con `@starting-style`), solo **al abrir**, en `--g-duration-slow` con `--g-ease-out`. No usa el muelle: es una entrada, no un desplazamiento que llega. Cambiar de resultados no anima y cerrar es inmediato. Mientras corre, la opción activa se lleva a la vista midiendo contra el alto final de la lista (ver «Panel estable»).
3. **El texto se completa.** El resto de la primera coincidencia se escribe en el propio campo sobre `--g-color-selection`, en `text-muted`: se lee como «texto propuesto, aceptable de un toque». Entra con un fundido corto.
4. **C · La ficha llega.** Al elegir desde la lista de `field`, la ficha **viaja** de su fila a su sitio con `--g-ease-spring` (cuarto uso aprobado del muelle: un desplazamiento que llega), opaca todo el trayecto. El vector lo escribe el componente en `--_travel-x` y `--_travel-y` y marca la ficha con `is-arriving`, que retira al terminar. El vector se acota en el CSS para que el rebase del muelle no pase de `space × 2`: medido con la fila más lejana (Δy 309 px) parte de 210,5 px, rebasa **8,00 px** (= `space × 2`) en **240 ms** y termina en 0; con el tema de la auditoría (`space` 3) parte de 157,9 y rebasa 6,00 px.
5. **B · La entrada y la vista previa.** La paleta entra desde el campo con la entrada de `GDialog`, sin cambios. La vista previa **entra desde la lista**: con ↑ y ↓ la ficha se vuelve a crear y entra con un fundido de `--g-duration-fast` y un desplazamiento de `space × 2` desde el lado de la lista (el otro en RTL), como si la fila activa se proyectara en el panel. Con movimiento reducido, solo el fundido.
6. **La paleta, con la búsqueda protagonista.** El campo de búsqueda ocupa de borde a borde con el foco como línea al pie, y la opción activa se **invierte** (par texto y superficie). Lista y vista previa en proporción 6 : 5, con un cuerpo de alto fijo (`space × 96`, **384 px** con `space` 4): la superficie no salta al cambiar los resultados.
7. **La hoja va arriba.** En móvil, para que el teclado virtual no tape la lista; entra desde arriba.
8. **La activa cambia en el acto.** En A, la opción activa se **levanta** (borde de tinta y sombra), sin transición por fila: dos fichas fundiéndose a la vez parecían dos marcos (reporte del usuario). Medido con puntero real, ida y vuelta por cinco filas, con y sin movimiento reducido: **como máximo 1 superficie resaltada por cuadro**, `scrollTop` constante y la forma quieta.

Con movimiento reducido: sin despliegue, la flecha sin giro, la ficha no viaja (la clase se retira en el acto) y los fundidos que quedan son solo de color y opacidad. **Reservada** (idea de coco para lima, no adoptada): un resaltado único que viaja entre opciones, como el de `GMenu`.

## Panel estable (#358)

Las cuatro reglas comunes de los paneles anclados nacieron aquí, tras un reporte del usuario («la lista pivoteaba» al desplazar):

1. **El lado se decide al abrir** (abajo, o arriba si debajo quedan menos de 240 px y arriba hay más) y solo cambia con histéresis: el actual ofrece menos de `space × 40` y el otro al menos `space × 12` más.
2. **`--_max` queda fijo durante el desplazamiento** (se recalcula al abrir, al cambiar los resultados, en `resize` y al cambiar de lado): el panel no «respira».
3. **Si el campo sale del visor o de su contenedor con desplazamiento, la lista se cierra sin devolver el foco** (salvo en la hoja móvil).
4. **El puntero quieto nunca desplaza la lista:** la opción activa se lleva a la vista (desplazando el panel, nunca la página) solo cuando la puso el teclado o un cambio de resultados.

Abrir no mueve nada: el campo, la página y el alto del documento quedan en Δ0. **Tampoco el despliegue de A** (corregido en `fca3496`, vale para una opción y para `multiple`): mientras el cuerpo de la lista crece de 0 a su alto final (`--g-duration-slow`), la opción activa se lleva a la vista midiendo contra el **alto final** y no contra el que tiene a medias. Antes, abrir con ↓ con movimiento desplazaba el panel (82 px en un caso del playground) y la primera opción activa quedaba bajo el campo. Medido por coco con la duración real y sin movimiento reducido (por defecto, tema de la auditoría y oscuro; A en una `GFormRow`, B, con «Elegidas» y sin ella): en todos los cuadros (Chromium 51 a 52, Firefox 32 a 52, WebKit 13 a 38) `scrollTop` vale 0, la forma no se mueve, la primera opción está activa y nunca queda bajo el campo ni fuera del panel, y al terminar se ve entera (spec `tests/combobox-despliegue.spec.mjs`, 21 de 21 en los tres motores; fallaban antes del arreglo). Medido con desplazamiento real de la página (defecto y tema de la auditoría): 16 a 17 cuadros con la forma abierta, **0 rotos**, 1 cambio de lado, 0 cambios de alto sin cambio de lado, y se cierra al salir del visor. Con la rueda dentro del panel, `scrollTop` de 0 a 360 sin retroceso y la página quieta. Hay un spec propio, `tests/panel-estable.spec.mjs`, que **no se ejecutó al documentar**.

## Tema

El componente solo lee tokens `--g-*` y alias locales (`--_cb-*` propios; `--_focus`, `--_radius`, `--_fs`, `--_lh`, `--_gap` y `--_density` de `GInput`, y `--_gap` e `--_inset-radius` de `GDialog`). **No define tokens nuevos** (DECISIONS #336), no usa valores de respaldo y no lleva colores literales: las reglas `g-combobox*` van en la capa `grana.components` de `dist/grana.css`, con literales solo de `24px`, `44px`, `1px` y `0px` (según la auditoría); los colores de sistema aparecen solo dentro de `forced-colors`. Más los de [`GInput`](../GInput/README.md#tema) (caja, texto, foco, mensajes, solo lectura, `is-rejected`) y los de [`GDialog`](../GDialog/README.md) (la superficie), los de la ficha ([`GSummary`](../GSummary/README.md#tema)) y estos propios, tomados de `GCombobox.css`:

| Token | Para qué |
| --- | --- |
| `--g-color-surface`, `--g-color-border`, `--g-color-border-control` | Fondo de la lista; costura campo a lista; contorno de la forma abierta |
| `--g-color-border-strong` | Borde de la marca «Texto libre» |
| `--g-focus-width`, `--g-focus-offset` (y el color de foco o el `color` del campo) | Anillo de la forma completa; barra de la opción activa; línea de la búsqueda de la paleta |
| `--g-shadow-1`, `--g-shadow-3` | Ficha activa; elevación de la forma abierta |
| `--g-color-surface-sunken` | Fondo de la opción activa y de la vista previa |
| `--g-color-text`, `--g-color-surface` (par inverso) | Opción activa de la paleta |
| `--g-color-text-muted`, `--g-color-text-subtle` | Línea secundaria, rótulos, encabezado de grupo, texto fantasma; deshabilitada |
| `--g-color-selection` | Fondo del resto del fantasma y de la ficha «seleccionada» con foco |
| `--g-color-on-accent-soft` | Perfil de «+N» sobre la ficha seleccionada |
| `--g-color-neutral-soft` | Fondo de «Limpiar» al pasar |
| `--g-color-danger-text` | Estado de error de carga |
| `--g-radius-xs`, `--g-radius-sm`, `--g-radius-md`, `--g-surface-radius` | Ficha, marca, filas, remate de la superficie |
| `--g-space-1` a `--g-space-6`, `--g-border-width` | Rellenos, alturas de fila (la caja del mismo `size` y `density`, con piso de 24 px y 44 px táctil), alto del panel y la superficie, entrada de la hoja |
| `--g-text-body-*`, `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-title-sm-*`, `--g-text-action-weight`, `--g-font-ui` | Tipografía por rol |
| `--g-duration-fast`, `--g-duration-slow`, `--g-duration-spin`, `--g-ease-standard`, `--g-ease-out`, `--g-ease-spring` | Movimiento |

**Constantes de diseño que no son tema** (`tokens.md` §32): `space × 9` (alto mínimo de fila), `space × 96` (alto máximo de la lista y del cuerpo de la superficie), 6 : 5 (lista a vista previa), `space × 14` (columna de códigos, sobre `g-summary__code`), `space × 12` (campo de búsqueda, piso de 44 px), `space × 2 / 0.038` (cota del vector de la llegada), el literal `520px` del umbral móvil, `--g-form-min: 60`, y en JS los 600 ms del anuncio y las 10 filas de Av Pág.

**Reglas de tematización:** el tema de la aplicación va sin capa y siempre gana a `grana.defaults`. Una columna de códigos que se alinea (`CIE-10`) cuelga de `g-summary__code`; el reapunte de rótulos y valor compartido a `text-muted` sobre la selección es **de `GCombobox`**, no de `GSummary`. Un tema cuyo `--g-color-selection` sea muy distinto del claro por defecto debe seguir llegando a 4,5:1 con `text-muted`: lo mide el motor de tema, no el componente.

```css
:root {
  --g-color-selection: #cfe3ff;   /* fondo del texto fantasma y de la ficha seleccionada: text-muted debe llegar a 4,5:1 sobre él */
}
.mi-formulario { --g-form-min: 48; }   /* un catálogo de etiqueta corta: la fila no se parte hasta 192 px */
```

## SSR

Importar el componente y renderizarlo en el servidor no toca `document`, `window`, `navigator` ni `matchMedia`. El servidor pinta el campo con la etiqueta de la opción elegida (de `options` o `selectedOption`) o el texto libre, la ficha, los ocultos y el panel cerrado; la superficie, cerrada. `is-surface` y el umbral móvil se resuelven **al montar** (el servidor pinta según `appearance`). Los temporizadores, la colocación, las medidas y las animaciones son solo del cliente. Cubierto por `GCombobox.ssr.test.js` (4 pruebas).

## Avisos de desarrollo

Prefijo `[Grana GCombobox]`; una vez por instancia y motivo; solo fuera de producción.

| # | Causa | Qué hace el componente |
| --- | --- | --- |
| 1 | Sin nombre accesible (sin `label`, slot `label`, `aria-label` ni `aria-labelledby`) | Avisa |
| 2 | Falta un texto de `labels`: `close` al montar; `clear`, `useCustom`, `custom`, `create`, `minChars`, `preview` y `surfaceTitle` según la prop que lo necesita; `loading`, `noResults`, `results`, `partial`, `more` y `retry`, la primera vez que se usan | Pinta sin ese texto o no pinta la fila |
| 3 | Opción sin `value` o sin `label`; `value` repetido | Se ignora la opción; avisa del repetido |
| 4 | `modelValue` sin opción conocida y sin `selectedOption`; `selectedOption` cuyo `value` no es `modelValue` | El campo queda vacío (el valor se envía); se ignora `selectedOption` |
| 5 | `modelValue` y `custom` a la vez; `custom` no vacío sin `allowCustom` | Gana `modelValue`; se ignora `custom` |
| 6 | `allowCustom` con `name` y sin `customName` | El texto libre no viaja en `FormData` |
| 7 | `filter: false` y, tras emitir `search` o `more`, la aplicación no responde en el siguiente ciclo | Avisa; Intro no elige la opción resaltada sola |
| 8 | `total` con filtro local, o menor que las opciones entregadas | Se ignora el primero; avisa el segundo |
| 9 | `type` en los atributos; slots `append` o `action`; slot `preview` con `appearance="field"` | Se ignoran y no se pintan |
| 10 | Dentro de un `GInputGroup` | Avisa (no admitido) |
| 11 | `limit` menor que 1, `delay` negativo o `minChars` negativo | Se usa el valor por defecto (50, 250, 0) |
| 12 | Una opción trae un dato de `facts` sin `label` (cadena vacía tras recortar o ausente) | El dato no se pinta, no se busca ni se lee en la descripción accesible; avisa una vez por instancia |

Los avisos 13 a 17 son de `multiple`: ver [«Avisos con `multiple`»](#avisos-con-multiple).

## Clases

Las de `GInput` (raíz, caja, etiqueta, pie, `is-*`, `is-ready`, `is-rejected`) siguen siendo de `GInput`.

- **Raíz:** `g-combobox`, `g-combobox--appearance-{field|palette}`; estados `is-open`, `is-up`, `is-surface`, `is-token`, `is-custom`.
- **Campo:** `g-combobox__value`, `__field`, `__ghost` (`__ghost-typed`, `__ghost-rest`), `__token` (con `is-arriving` y `--_travel-x`, `--_travel-y`, que contiene una `g-summary--layout-inline`), `__about`, `__clear`, `__clear-text`, `__arrow`, `__live`.
- **Panel de A:** `g-combobox__popup` (con `is-empty` y las variables en línea `--_x`, `--_top`, `--_bottom`, `--_w`, `--_max`, `--_field-h`), `__popup-body`, `__panel`, `__status` (`--hint`, `--loading`, `--empty`, `--error`), `__list`, `__group`, `__group-label`, `__option` (`is-active`), `__check`.
- **Filas de acción:** `__action--{retry|more|custom|create}` con `__lead`, `__main` y `__label`.
- **Superficie:** `g-combobox-surface`, `--palette`, `--sheet`, `__search`, `__search-icon`, `__search-field`, `__search-loader`, `__surface-body` (`has-preview`), `__preview` (con una `g-summary--layout-stack`), `__preview-empty`.
- La opción por defecto contiene una `g-summary g-summary--layout-row`; los tonos por estado se reapuntan sobre sus partes `g-summary__*`. **Desde #356 ya no se emiten** `__description`, `__facts`, `__fact`, `__fact-label`, `__token-label`, `__token-meta`, `__preview-head`, `__preview-title`, `__preview-facts` y, en las opciones, `__lead`, `__code`, `__main`, `__label` y `__mark`.
- `aria-selected` y `aria-disabled` estilizan la elegida y la deshabilitada.
- Las clases de `multiple` (frase, casilla, receta, cesta, pie) están en [«Clases con `multiple`»](#clases-con-multiple).

## Limitaciones conocidas

- **Varias opciones: `multiple`** existe desde la Fase 2 (ver [su sección](#selección-múltiple-multiple-fase-2), con sus propios límites). Siguen **sin existir**: `GTagInput` (etiquetas sin catálogo), `expandable` (ampliar a la paleta desde `field`), `GInputGroupCombobox`, el editor de valor de `GFilterBar` ni `autoHighlight`.
- **En el campo, la ficha del valor recorta el título antes que el identificador.** `GSummary inline` cede el título hasta `4ch` antes de tocar el identificador, por el orden de cesión de la ficha: con cuatro datos, un paciente aparece como «Daniela C… Exp. 001399 +3» en un campo de **290 px**. Es el orden del contrato de `GSummary` (el identificador es lo último), pero en el campo la regla anterior era la contraria y deja el nombre corto. Si quieres el nombre primero hay que decidir un orden de cesión por anfitrión: decisión de contrato abierta (nota de coco a lima). Mientras tanto, ofrece más ancho al campo (`--g-form-min`) o sustituye la ficha con el slot `value`. La ficha del valor es `aria-hidden`, así que la etiqueta completa siempre está en el `<input>`.
- **Una ficha recortada nunca es la única fuente de un dato:** el `title` nativo de lo cortado solo sirve al puntero. La vista completa está en la vista previa de la paleta (o en tu slot `preview`, que debe cumplir esa regla).
- **Sin virtualización:** se pinta hasta `limit` filas con filtro local (`aria-activedescendant` necesita que la opción exista), y con `filter: false` todo lo entregado: cientos de filas acumuladas con «Mostrar más» pueden ir lentas. Entrega páginas de `limit` o menos.
- **Respuestas fuera de orden y caché son tuyas.** Si no pones `loading` al recibir `search`, Intro no elige la opción resaltada sola (hay que moverse con las flechas).
- **Tab solo elige en A y sin `multiple`**, con etiqueta única y lista completa; en la paleta, en móvil y con `multiple`, nunca.
- **El texto fantasma** solo existe con coincidencia por prefijo (no al buscar por código o expediente) y no durante la composición IME.
- **`diff` entre homónimos** exige que las fichas vecinas traigan los mismos rótulos en `facts`; con listas heterogéneas casi todo sale distinto. Se calcula sobre lo pintado: si la homónima no está a la vista, no hay marca.
- **Un dato de `facts` sin `label` no existe para el componente:** ni se pinta, ni se busca, ni entra en la descripción accesible del valor (que une «rótulo valor · rótulo valor»). Ponle siempre `label`; el aviso 12 solo sale en desarrollo.
- **Paleta dentro de un `GDialog`:** modal sobre modal; funciona pero tapa el contexto.
- **`required`** no participa en la validación nativa: valida tu aplicación y usa `error`.
- **WebKit:** Tab no llega al botón de cierre de la superficie (ni a «Limpiar») salvo el ajuste de teclado del sistema; Esc y el fondo cierran, y «Limpiar» se alcanza con Alt+Tab en las pruebas.
- **Sin autocompletado del navegador** (`autocomplete="off"`).
- **Navegadores:** exige `popover`, `@starting-style` y `<dialog>`; sin `@starting-style`, A se abre sin despliegue.
- **Dos `combobox`** conviven con la superficie abierta (el disparador y el campo de búsqueda): sin verificar con lector real.

## Verificación

- **Pruebas** (vitest con jsdom y, para el servidor, entorno node): **177 de 177 en verde al documentar la Fase 2** (ejecutadas de nuevo): `GCombobox.test.js` (110), `GCombobox.multiple.test.js` (39, ver «Verificación de `multiple`»), `GCombobox.ssr.test.js` (6), `engine.test.js` (6), `multi.test.js` (6) y `combobox.test.js` de la entrada (10). Al documentar la primera versión eran 125 (106, 4, 5 y 10). Cubren el modelo y el texto libre, los datos y la búsqueda pendiente en sus tres tramos, el teclado completo, la salida del campo, la semántica, la superficie, los anuncios, la ficha con `GSummary` (+7 casos de contrato en la adopción), los avisos, el empaquetado y SSR.
- **Rendimiento:** abrir con **500 opciones** (se pintan 50, con «Mostrar más (50 de 500)») tarda **44 ms en Chromium, 46 en Firefox y 122 en WebKit** (informe de bruno, `1e57a05`, `combobox.spec.mjs`); el contrato exige menos de 150 ms. En WebKit el margen es estrecho: la auditoría de la Fase 2, con un solo worker y cinco repeticiones, midió **97, 101, 109, 116 y 120 ms** en WebKit (la cifra de bruno, tomada con la máquina cargada, era mayor). **No se repitió al documentar.**
- **Navegador** (Playwright en Chromium, Firefox y WebKit, sobre el componente real del playground): `combobox.spec.mjs`, `combobox-forma.spec.mjs` y `personalidad-combobox.spec.mjs` junto con `summary.spec.mjs` pasaron **129 de 129** (43 por motor) tras el remate de coco (`eac1971`); la batería cubre semántica, foco, Δ0, capa superior, grupos, fila de tres, dentro de `GDialog`, móvil 375 y 320, RTL, contraste, la forma única, el fantasma, Tab con homónimas y con etiqueta única, la paleta, la ficha, el despliegue, la llegada y reduced motion. También `form-distribution.spec.mjs` (#184) y `panel-estable.spec.mjs` (#358): estos dos **no se ejecutaron al documentar**.
- **Auditoría de coco** con el componente real, un tema distinto al por defecto (`@grana/cli`: marca `#0F5C5C`, radio 2, `space` 3, cuerpo de 15) y el oscuro, más los once temas de Dark Color Presence: `node design/lab/combobox/auditoria-verificar.mjs`. La pasada sobre el componente con `GSummary` (`eac1971`, cifra tomada de `design/lab/combobox/estilo.md`) fue de **2415 de 2415** comprobaciones en Chromium, Firefox y WebKit; la pasada anterior a la adopción (`d9225bf`, en `auditoria.md`) fue de 1125, 480 y 485. **No se repitió al documentar.**
- **CSS:** sin colores literales, sin `var()` con respaldo, sin `@layer`, `@property` ni `!important` (comprobado en `GCombobox.css` al documentar y en `dist/grana.css` en la auditoría); solo `--g-*` existentes en `defaults.css`.
- **Iconos:** solo Lucide (`search`, `chevron-down`, `chevrons-up-down`, `x`, `check`, `pencil`, `plus`, `rotate-ccw`, `circle-alert`, `loader-circle`, y con `multiple` `triangle-alert` y `undo-2`, más los de las opciones); `node packages/vue/scripts/check-icons.mjs` en verde.
- **Consola:** sin errores en los tres motores (auditoría).

## No verificado

- **Lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): el eco de escritura con la primera opción activa, el texto fantasma junto a `aria-activedescendant`, los dos `combobox` con la superficie abierta, la vista previa, `aria-describedby` con la línea secundaria, las filas de acción y los recuentos. Solo se comprobó el árbol de accesibilidad de Playwright.
- **Safari real** y táctil real; `pointer: coarse` en Firefox (no se puede emular; en Chromium y WebKit se emuló).
- **Teclado virtual real** sobre la hoja móvil, e **IME real** con el texto fantasma (la composición se probó con eventos sintéticos).
- **`forced-colors` real** (Windows): solo emulado en los tres motores.
- **Zoom real del navegador** al 200 % y 400 %: se aproximó con un visor a la mitad y DPR 2 (la forma queda dentro del visor y sin desplazamiento horizontal, sin desborde en las fichas); el 400 % no se midió.
- **Vista previa en RTL dentro de la paleta:** se midió la forma de A, la ficha, el fantasma árabe y `#cb-rtl` en RTL, pero no la vista previa de la paleta (su entrada desde el lado de la lista se espeja por CSS sin medir).
- **Pegado de texto largo.**
- **Cifras de peso y de rendimiento** de este README: son las anotadas por bruno y coco (ver arriba), no remedidas al documentar.
- **Lo de `multiple`** (lector con `aria-selected` y el anuncio propio, descripción de 40 nombres, rastro y foco en «Deshacer», IME con varios, entre otros) está en [«No verificado con `multiple`»](#no-verificado-con-multiple).

## Fuentes

- API: [`GCombobox.meta.json`](./GCombobox.meta.json) · Contrato: [`design/contracts/combobox.md`](../../../../../design/contracts/combobox.md) (DECISIONS #329 a #338, «Fichas con `GSummary`» #356 y paneles anclados #358) · Prototipos: [`design/lab/combobox/r01/`](../../../../../design/lab/combobox/r01/) y [`r02/`](../../../../../design/lab/combobox/r02/) · Estilo: [`design/lab/combobox/estilo.md`](../../../../../design/lab/combobox/estilo.md) · Auditoría: [`design/lab/combobox/auditoria.md`](../../../../../design/lab/combobox/auditoria.md) · Ficha: [`GSummary`](../GSummary/README.md)
- **Fase 2 (`multiple`):** contrato [`design/contracts/combobox.md`](../../../../../design/contracts/combobox.md), «Fase 2 · Selección múltiple» (DECISIONS #417 a #430) · Prototipos: [`design/lab/combobox/r03/`](../../../../../design/lab/combobox/r03/) · Estilo: [`design/lab/combobox/estilo.md`](../../../../../design/lab/combobox/estilo.md), «Fase 2» · Auditoría: [`design/lab/combobox/auditoria-multiple.md`](../../../../../design/lab/combobox/auditoria-multiple.md) · Despliegue de A corregido en `fca3496`
