# GCombobox

Campo para **elegir una opción de un catálogo grande escribiendo**: un paciente entre miles, un diagnóstico CIE-10, un medicamento, un cliente, una colonia. Sigue el patrón *combobox with list autocomplete* de WAI-ARIA sobre [`GInput`](../GInput/README.md): etiqueta, caja, ayuda, mensajes, marcas y contexto de `GForm` son los de `GInput`. **Grana no pide datos:** el componente emite `search`, `more` y `create`, y tu aplicación entrega `options`, `loading`, `total` y `loadError`. El modelo es el `value` de la opción elegida y, si lo permites, un texto libre aparte.

**Etiqueta:** `<g-combobox>` · **Estado:** `candidate` (auditoría de coco aprobada, sin defectos bloqueantes; ver [`design/lab/combobox/auditoria.md`](../../../../../design/lab/combobox/auditoria.md)) · **Desde:** 0.1.0 · **Entrada:** propia, `@grana/vue/combobox` (global UMD `GranaCombobox`)

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

**Por qué va aparte (DECISIONS #337).** Tiene dos presentaciones, un motor de datos, la ficha y el texto fantasma: supera el tope de 8 KB gzip que fija #328 para entrar en el paquete principal. Medido por bruno el 2026-10-04: `dist/combobox.js` **13 563 bytes gzip** y `dist/combobox.umd.js` **12 263**; `dist/grana.js` 168 553. Lo compartido con el principal (`GInput`, `GDialog`, `GSummary` y `summaryDiff`, el `GIcon` interno, `anchor`, `liveRegion`, la utilidad de coincidencias, etc.) llega de `@grana/vue` por `__shared` **sin copia**: la entrada no contiene la cadena `g-summary__` (compuerta del build). Requiere `Vue` y `Grana` (o `@grana/vue`) como externos. Antes de adoptar `GSummary` la entrada pesaba 14 111 bytes; la ficha, el avatar y la coincidencia salieron del `.vue`.

> Estas cifras de peso son las del `meta.json`; **no se volvieron a medir al documentar** (el `dist/` del árbol de trabajo no traía `combobox.js` en ese momento).

## Qué lo hace distinto

Tres ideas, elegidas por el usuario mirando los prototipos de kiwi (`design/lab/combobox/r02/`, decisión #329). No son opciones sueltas: A y B son dos presentaciones del mismo campo y C vale en las dos.

| | Concepto | Qué hace | Por qué sirve |
| --- | --- | --- | --- |
| **A** | **El campo se abre** (`appearance="field"`, por defecto) | No hay un menú flotante aparte: abierto, el contorno, el anillo de foco y la sombra abrazan **campo y lista como una sola forma**. La primera coincidencia por prefijo se completa en el propio campo como **texto fantasma** | En un formulario denso nadie tiene que relacionar un menú con su campo; «diab» y Tab captura un diagnóstico entero sin mirar la lista |
| **B** | **Paleta con vista previa** (`appearance="palette"`) | El campo se eleva a una superficie modal con su propio campo de búsqueda, los resultados y la **ficha de la opción activa**. Con el visor de 520 px o menos, siempre se usa esta estructura como hoja anclada arriba, sin vista previa | Entre cuatro «María García López» hay que ver a la persona antes de elegirla |
| **C** | **El valor es un objeto** (en A y en B) | En reposo el campo enseña la ficha de lo elegido (avatar, nombre, datos) o la marca de texto libre; los resultados son fichas; y la elegida **viaja** de su fila al campo sin cambiar su alto | Un combobox pasa casi toda su vida cerrado: el formulario en reposo dice a quién y qué, verificable de un vistazo, y distingue catálogo de texto tecleado |

Las reglas de seguridad del teclado (Tab no elige, Intro no elige un resultado obsoleto, la lista no parpadea a vacío; ver «Teclado») son parte de la identidad y no se reabren sin motivo nuevo (#333).

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
| `facts` | `facts` | Sin valor vacío. Un dato **sin `label`** no se pinta y avisa. `priority`, `short` y `bare` son opcionales (ver el README de `GSummary`, «Datos») |
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
| `modelValue` | String o Number | el `value` de la opción elegida (`===`) | `null` |
| `custom` | String | el texto libre (`v-model:custom`) | `''` |
| `options` | Array | opciones y grupos | `[]` |
| `selectedOption` | Object o `null` | la opción de `modelValue` si no está en `options` | `null` |
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

**No existen:** `multiple` (reservado, ver «Limitaciones»), `remote` (es `filter: false`), `selectedOptions`, `expandable`, `autoHighlight`, `createLabel` y `clearLabel` (van en `labels`), `emptyText`, `placeholder` como prop (es un atributo, como en `GInput`), `prefix`, `suffix`, `type`, `surface`, `mode`.

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

Todos están declarados en `emits`: el `@change` del consumidor recibe el objeto y no llega al `<input>` nativo. Los demás eventos nativos (`focus`, `blur`, `keydown`, `input`…) llegan al `<input>` visible **después** de los manejadores propios, así que un `@keydown` tuyo ve el estado ya actualizado.

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

**No hay `append` ni `action`:** el final de la caja es de limpiar y de la flecha, y una caja fusionada rompería la forma única de A. Si se pasan, no se pintan y se avisa. El slot `preview` solo se pinta con `appearance="palette"` por encima de 520 px.

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

Los eventos de lista **no actúan mientras hay composición IME** (`isComposing`).

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
- **En la superficie** (paleta y hoja): el disparador abre con Intro, Espacio, ↓, ↑, Alt+↓ o un carácter. Dentro rige la tabla de «Lista abierta» sobre el campo de búsqueda, salvo que **Tab se mueve dentro del diálogo** (campo, cierre) y **nunca elige**, y Esc cierra la superficie (un nivel).
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

## Personalidad

Cuatro gestos de movimiento y una regla de forma; todos con tokens (`--g-duration-*`, `--g-ease-*`), sin constantes de tema nuevas y **con `prefers-reduced-motion: reduce` ninguno se mueve** (nada se anima al montar). Origen: rondas de kiwi `design/lab/combobox/r01/` y `r02/` y comparación de coco con lo aprobado (decisiones #329 y #336; el usuario eligió A, B y C).

1. **A · La forma única.** Abierto, el campo no tiene un menú debajo: *crece*. El panel empieza en el borde superior de la caja (o termina en el inferior, `is-up`), mide lo que ella y su zona alta es transparente y no captura el puntero. Contorno, anillo de foco y sombra son de la forma completa; entre campo y lista queda **una línea fina** que cae sobre el borde de la caja. Medido sobre el componente real: diferencia caja a forma **menor de 1 px** (izquierda, arriba y ancho; también hacia arriba), costura **0,00 px** (WebKit −0,02), anillo de `--g-focus-width` **sin cortes** del campo a la lista, y el punto central del campo devuelve el `<input>`.
2. **A · El despliegue.** La lista crece desde la línea del campo (`grid-template-rows` de 0 a 1 con `@starting-style`), solo **al abrir**, en `--g-duration-slow` con `--g-ease-out`. No usa el muelle: es una entrada, no un desplazamiento que llega. Cambiar de resultados no anima y cerrar es inmediato.
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

Abrir no mueve nada: el campo, la página y el alto del documento quedan en Δ0. Medido con desplazamiento real de la página (defecto y tema de la auditoría): 16 a 17 cuadros con la forma abierta, **0 rotos**, 1 cambio de lado, 0 cambios de alto sin cambio de lado, y se cierra al salir del visor. Con la rueda dentro del panel, `scrollTop` de 0 a 360 sin retroceso y la página quieta. Hay un spec propio, `tests/panel-estable.spec.mjs`, que **no se ejecutó al documentar**.

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
| 9 | `multiple` o `type` en los atributos; slots `append` o `action`; slot `preview` con `appearance="field"` | Se ignoran y no se pintan |
| 10 | Dentro de un `GInputGroup` | Avisa (no admitido) |
| 11 | `limit` menor que 1, `delay` negativo o `minChars` negativo | Se usa el valor por defecto (50, 250, 0) |

Además, un dato de `facts` sin `label` lo omite la ficha y avisa (`[Grana GSummary]`).

## Clases

Las de `GInput` (raíz, caja, etiqueta, pie, `is-*`, `is-ready`, `is-rejected`) siguen siendo de `GInput`.

- **Raíz:** `g-combobox`, `g-combobox--appearance-{field|palette}`; estados `is-open`, `is-up`, `is-surface`, `is-token`, `is-custom`.
- **Campo:** `g-combobox__value`, `__field`, `__ghost` (`__ghost-typed`, `__ghost-rest`), `__token` (con `is-arriving` y `--_travel-x`, `--_travel-y`, que contiene una `g-summary--layout-inline`), `__about`, `__clear`, `__clear-text`, `__arrow`, `__live`.
- **Panel de A:** `g-combobox__popup` (con `is-empty` y las variables en línea `--_x`, `--_top`, `--_bottom`, `--_w`, `--_max`, `--_field-h`), `__popup-body`, `__panel`, `__status` (`--hint`, `--loading`, `--empty`, `--error`), `__list`, `__group`, `__group-label`, `__option` (`is-active`), `__check`.
- **Filas de acción:** `__action--{retry|more|custom|create}` con `__lead`, `__main` y `__label`.
- **Superficie:** `g-combobox-surface`, `--palette`, `--sheet`, `__search`, `__search-icon`, `__search-field`, `__search-loader`, `__surface-body` (`has-preview`), `__preview` (con una `g-summary--layout-stack`), `__preview-empty`.
- La opción por defecto contiene una `g-summary g-summary--layout-row`; los tonos por estado se reapuntan sobre sus partes `g-summary__*`. **Desde #356 ya no se emiten** `__description`, `__facts`, `__fact`, `__fact-label`, `__token-label`, `__token-meta`, `__preview-head`, `__preview-title`, `__preview-facts` y, en las opciones, `__lead`, `__code`, `__main`, `__label` y `__mark`.
- `aria-selected` y `aria-disabled` estilizan la elegida y la deshabilitada.

## Limitaciones conocidas

- **`multiple` está reservado, no existe** (DECISIONS #338, Fase 2 con ronda propia por decisión del usuario): se ignora con aviso. Forma reservada: `modelValue` Array, `custom` Array, `selectedOptions`, un oculto por valor y `change` con arreglos. Tampoco existen `GTagInput` (etiquetas sin catálogo), `expandable` (ampliar a la paleta desde `field`), `GInputGroupCombobox`, el editor de valor de `GFilterBar` ni `autoHighlight`. Varias opciones hoy: no uses este campo.
- **En el campo, la ficha del valor recorta el título antes que el identificador.** `GSummary inline` cede el título hasta `4ch` antes de tocar el identificador, por el orden de cesión de la ficha: con cuatro datos, un paciente aparece como «Daniela C… Exp. 001399 +3» en un campo de **290 px**. Es el orden del contrato de `GSummary` (el identificador es lo último), pero en el campo la regla anterior era la contraria y deja el nombre corto. Si quieres el nombre primero hay que decidir un orden de cesión por anfitrión: decisión de contrato abierta (nota de coco a lima). Mientras tanto, ofrece más ancho al campo (`--g-form-min`) o sustituye la ficha con el slot `value`. La ficha del valor es `aria-hidden`, así que la etiqueta completa siempre está en el `<input>`.
- **Una ficha recortada nunca es la única fuente de un dato:** el `title` nativo de lo cortado solo sirve al puntero. La vista completa está en la vista previa de la paleta (o en tu slot `preview`, que debe cumplir esa regla).
- **Sin virtualización:** se pinta hasta `limit` filas con filtro local (`aria-activedescendant` necesita que la opción exista), y con `filter: false` todo lo entregado: cientos de filas acumuladas con «Mostrar más» pueden ir lentas. Entrega páginas de `limit` o menos.
- **Respuestas fuera de orden y caché son tuyas.** Si no pones `loading` al recibir `search`, Intro no elige la opción resaltada sola (hay que moverse con las flechas).
- **Tab solo elige en A**, con etiqueta única y lista completa; en la paleta y en móvil, nunca.
- **El texto fantasma** solo existe con coincidencia por prefijo (no al buscar por código o expediente) y no durante la composición IME.
- **`diff` entre homónimos** exige que las fichas vecinas traigan los mismos rótulos en `facts`; con listas heterogéneas casi todo sale distinto. Se calcula sobre lo pintado: si la homónima no está a la vista, no hay marca.
- **Un dato sin `label`** no se pinta en la ficha, pero **sí cuenta para la búsqueda y para la descripción accesible del valor** (que une los valores sin rótulo): ponle siempre `label`. Es una discrepancia anotada a bruno.
- **Paleta dentro de un `GDialog`:** modal sobre modal; funciona pero tapa el contexto.
- **`required`** no participa en la validación nativa: valida tu aplicación y usa `error`.
- **WebKit:** Tab no llega al botón de cierre de la superficie (ni a «Limpiar») salvo el ajuste de teclado del sistema; Esc y el fondo cierran, y «Limpiar» se alcanza con Alt+Tab en las pruebas.
- **Sin autocompletado del navegador** (`autocomplete="off"`).
- **Navegadores:** exige `popover`, `@starting-style` y `<dialog>`; sin `@starting-style`, A se abre sin despliegue.
- **Dos `combobox`** conviven con la superficie abierta (el disparador y el campo de búsqueda): sin verificar con lector real.

## Verificación

- **Pruebas** (vitest con jsdom y, para el servidor, entorno node), **125 de 125 en verde al documentar** (ejecutadas de nuevo): `GCombobox.test.js` (106), `GCombobox.ssr.test.js` (4), `engine.test.js` (5) y `combobox.test.js` de la entrada (10). Cubren el modelo y el texto libre, los datos y la búsqueda pendiente en sus tres tramos, el teclado completo, la salida del campo, la semántica, la superficie, los anuncios, la ficha con `GSummary` (+7 casos de contrato en la adopción), los avisos, el empaquetado y SSR.
- **Rendimiento:** abrir con **500 opciones** (se pintan 50, con «Mostrar más (50 de 500)») tarda **44 ms en Chromium, 46 en Firefox y 122 en WebKit** (informe de bruno, `1e57a05`, `combobox.spec.mjs`); el contrato exige menos de 150 ms. En WebKit el margen es estrecho. **No se repitió al documentar.**
- **Navegador** (Playwright en Chromium, Firefox y WebKit, sobre el componente real del playground): `combobox.spec.mjs`, `combobox-forma.spec.mjs` y `personalidad-combobox.spec.mjs` junto con `summary.spec.mjs` pasaron **129 de 129** (43 por motor) tras el remate de coco (`eac1971`); la batería cubre semántica, foco, Δ0, capa superior, grupos, fila de tres, dentro de `GDialog`, móvil 375 y 320, RTL, contraste, la forma única, el fantasma, Tab con homónimas y con etiqueta única, la paleta, la ficha, el despliegue, la llegada y reduced motion. También `form-distribution.spec.mjs` (#184) y `panel-estable.spec.mjs` (#358): estos dos **no se ejecutaron al documentar**.
- **Auditoría de coco** con el componente real, un tema distinto al por defecto (`@grana/cli`: marca `#0F5C5C`, radio 2, `space` 3, cuerpo de 15) y el oscuro, más los once temas de Dark Color Presence: `node design/lab/combobox/auditoria-verificar.mjs`. La pasada sobre el componente con `GSummary` (`eac1971`, cifra tomada de `design/lab/combobox/estilo.md`) fue de **2415 de 2415** comprobaciones en Chromium, Firefox y WebKit; la pasada anterior a la adopción (`d9225bf`, en `auditoria.md`) fue de 1125, 480 y 485. **No se repitió al documentar.**
- **CSS:** sin colores literales, sin `var()` con respaldo, sin `@layer`, `@property` ni `!important` (comprobado en `GCombobox.css` al documentar y en `dist/grana.css` en la auditoría); solo `--g-*` existentes en `defaults.css`.
- **Iconos:** solo Lucide (`search`, `chevron-down`, `chevrons-up-down`, `x`, `check`, `pencil`, `plus`, `rotate-ccw`, `circle-alert`, `loader-circle`, más los de las opciones); `node packages/vue/scripts/check-icons.mjs` en verde.
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

## Fuentes

- API: [`GCombobox.meta.json`](./GCombobox.meta.json) · Contrato: [`design/contracts/combobox.md`](../../../../../design/contracts/combobox.md) (DECISIONS #329 a #338, «Fichas con `GSummary`» #356 y paneles anclados #358) · Prototipos: [`design/lab/combobox/r01/`](../../../../../design/lab/combobox/r01/) y [`r02/`](../../../../../design/lab/combobox/r02/) · Estilo: [`design/lab/combobox/estilo.md`](../../../../../design/lab/combobox/estilo.md) · Auditoría: [`design/lab/combobox/auditoria.md`](../../../../../design/lab/combobox/auditoria.md) · Ficha: [`GSummary`](../GSummary/README.md)
