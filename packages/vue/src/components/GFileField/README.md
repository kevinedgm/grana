# GFileField

Campo para **adjuntar archivos a un formulario**: la receta escaneada, las fotos de una lesión, el comprobante de domicilio, los estudios de un expediente que ya tiene adjuntos. Se elige con el diálogo del sistema, se arrastra o se pega. **Grana no hace red:** la subida es un adaptador de tu aplicación (`uploader`) y, sin adaptador, los archivos viajan con el envío nativo. Etiqueta, pie, mensajes, marcas y contexto de [`GForm`](../GForm/README.md) son los de [`GInput`](../GInput/README.md); la caja mide lo mismo que la de un `GInput` y comparte fila con él en una [`GFormRow`](../GFormRow/README.md).

**Etiqueta:** `<g-file-field>` · **Estado:** `candidate` (auditoría de coco aprobada, sin defectos bloqueantes; ver [`design/lab/file-field/auditoria.md`](../../../../../design/lab/file-field/auditoria.md)) · **Desde:** 0.1.0 · **Entrada:** propia, `@grana/vue/file-field` (global UMD `GranaFileField`)

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`, sección `GFileField`, `#sec-file-field`, con el adaptador simulado). Exige Vue `^3.5.0` (usa `useId`) y un navegador actual: `DataTransfer` construible (para reescribir `input.files`) y `:has()`.

## Instalación: entrada propia

`GFileField` **no** viaja en `@grana/vue`: ni lo exporta ni lo registra su `install`. Va en su propia entrada y quien no lo usa no lo paga.

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import FileField, { GFileField, formatFileSize } from '@grana/vue/file-field'
import '@grana/vue/style.css'          // el CSS del campo ya está en esta hoja única

createApp(App).use(Grana).use(FileField).mount('#app')   // registra <g-file-field>
// o, sin plugin: components: { GFileField }
```

Sin empaquetador, carga en orden `vue.global.js`, `dist/grana.umd.js` (global `Grana`) y `dist/file-field.umd.js` (global `GranaFileField`): `app.use(Grana).use(GranaFileField)`. En plantillas dentro del HTML (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-file-field ...></g-file-field>`.

La entrada exporta tres cosas: `GFileField`, la utilidad `formatFileSize(bytes, locale?)` (con la misma función con la que el campo escribe tamaños y límites; úsala para escribir tu `hint` igual) y, por defecto, el plugin (`install`).

**Por qué va aparte (DECISIONS #367).** Lleva una cola de subida, el adaptador, el arrastre de página, la vista previa y los anuncios: supera el tope de 8 KB gzip que fija #328 para entrar en el paquete principal, y no todos los formularios adjuntan archivos. Peso anotado por bruno el 2026-10-05 en `GFileField.meta.json`: `dist/file-field.js` **12 444 bytes gzip** y `dist/file-field.umd.js` **11 113**, frente a 171 422 de `dist/grana.js` (ES sin minificar, como el resto de entradas). **Remedido al documentar** sobre el `dist/` del árbol de trabajo, con `gzip -9`: 12 406 y 11 112 bytes (la diferencia es del nivel de compresión). Kiwi estimaba de 7 a 10 KB; el tope se supera y la entrada propia se confirma. Lo compartido con el principal (`GSummary`, `GProgress`, `GBtn`, el `GIcon` interno, `useFormField` y sus claves de contexto, `liveRegion`, `topModal`, etc.) llega por `__shared` **sin copia**: `dist/file-field.js` no contiene la cadena `g-summary__` y `dist/grana.js` no contiene `GFileField` (comprobado al documentar). Requiere `Vue` y `Grana` (o `@grana/vue`) como externos. El CSS va en `grana.css`.

## Qué lo hace distinto

Concepto **A «Línea de adjuntos»**, elegido por el usuario mirando los prototipos de kiwi (`design/lab/file-field/r02/`, DECISIONS #366). Los otros dos conceptos de la ronda quedan reservados (ver «Reservado»).

| | Qué hace | Por qué sirve |
| --- | --- | --- |
| **Un campo que mide lo que un campo** | No reserva un rectángulo para soltar. La caja vacía mide lo que la de un `GInput` del mismo `size` y `density`; los archivos son **fichas dentro de la caja** y la última pieza, «Adjuntar», es el control. Con archivos, la caja crece hacia abajo por líneas | Un formulario con tres adjuntos conserva el ritmo de un formulario: la receta va **en la misma línea** que su folio. Medido en la auditoría: caja vacía Δ0 de posición y alto con un `GInput` vecino, en cinco tamaños y tres densidades, en los tres motores |
| **La ficha es su barra** | Mientras sube, la propia ficha se llena hacia el final de la lectura con un frente de avance nítido; al terminar queda un filo de éxito. El progreso está **en el objeto**, no en otra línea. Es un `GProgress` real, puesto como capa detrás del contenido: lo que se ve es lo que lee el lector (`role="progressbar"`) | Se ve qué archivo va por dónde sin buscar una barra aparte, y la ficha mide **lo mismo** en cola, subiendo, subida y con error (Δ0 entre estados) |
| **La página entera despierta** | Al entrar arrastrando archivos en la ventana, **todos** los campos alcanzables encienden a la vez un **destino** un poco mayor que su caja: los que admiten lo que llevas dicen «Soltar aquí», los que no lo dicen en otra forma (borde discontinuo y texto). Al pasar por uno, el destino se llena con su nombre | Nadie adivina en qué zona cabe su PDF: el formulario contesta **dónde va esto** antes de soltar. Todo es pintura: nada se mueve (Δ0 de cajas, raíces y pies al despertar) |
| **Pegar** | Con el foco en el campo, ⌘V / Ctrl+V añade la captura que acabas de hacer | Sin guardarla en el escritorio para buscarla después |
| **Nada sale a medias** | Con subidas pendientes o fallidas, el campo **bloquea el envío de `GForm` por sí mismo**, solo al enviar, y el resumen de errores lleva al archivo (al «Reintentar» del fallido) | Nadie guarda un expediente creyendo que lleva la radiografía que no subió |

Soltar un archivo fuera de un campo **no abre el archivo encima de tu formulario**: mientras haya un campo montado, un arrastre con archivos que nadie atendió se cancela (ver «Arrastre y pegado»).

## Uso

### Sin adaptador: el envío nativo

Sin `uploader`, los archivos quedan en estado `ready` y **viajan con el envío**: el `<input type="file">` real del campo lleva siempre los `File` que están en la lista. Con `name`, un `<form>` nativo o `new FormData(form)` los recibe sin código tuyo.

```vue
<script setup>
import { ref } from 'vue'
import { formatFileSize } from '@grana/vue/file-field'

const receta = ref([])          // el v-model es un arreglo de entradas (ver «Modelo»)
const folio = ref('')
const labels = { /* ver «Textos»: todo lo que el campo dice sale de aquí */ }
const hint = `PDF o imagen · hasta ${formatFileSize(5_000_000, 'es-MX')}`   // «PDF o imagen · hasta 5 MB»
</script>

<template>
  <g-form aria-label="Receta" :labels="formLabels" @submit="enviar">
    <g-form-layout>
      <g-form-row>
        <g-input v-model="folio" name="folio" label="Folio de la receta"></g-input>
        <g-file-field v-model="receta" name="receta" label="Receta escaneada"
                      accept=".pdf,image/*" :max-size="5000000" :hint="hint" :labels="labels"></g-file-field>
      </g-form-row>
    </g-form-layout>
    <g-btn type="submit">Guardar</g-btn>
  </g-form>
</template>
```

`GForm` emite `submit` con un `FormData` que lleva el `File` bajo `receta` (la aplicación lo envía como `multipart/form-data`).

### Con adaptador: la subida es tuya

Con `uploader`, cada archivo aceptado **empieza a subir solo** (en cuanto hay hueco: `concurrency`, 2 por defecto, en el orden de la lista). El adaptador es una función de tu aplicación:

```ts
type Uploader = (file: File, ctx: {
  signal: AbortSignal                            // se aborta al cancelar, al quitar, al reemplazar y al desmontar
  progress(loaded: number, total: number): void  // bytes; llámalo cuantas veces quieras
}) => Promise<{ value: string | number, url?: string }>
```

- **Resuelve** `{ value, url? }` → la entrada pasa a `done`; `value` es lo que identifica al archivo en tu servidor y lo que se envía. Un `value` `null` o ausente no se puede enviar: la entrada pasa a `error` con `labels.uploadFailed` y aviso 6.
- **Rechaza** con `{ message }` → `error` con ese texto (es de tu aplicación); sin `message`, `labels.uploadFailed`. Un `AbortError` que el campo **no pidió** también es `error` con `labels.uploadFailed`: una entrada nunca se queda en `uploading`.
- **Respeta `signal`:** es responsabilidad tuya. Grana no hace red ni puede comprobar lo que el adaptador hace.
- **`progress`** se pinta como mucho una vez por cuadro; `total` 0 o ausente usa `file.size`, y el valor se recorta a `[0, total]`. El progreso **no está en el modelo**: no emite `update:modelValue`.
- **Sin reintentos automáticos ni límite de tiempo:** son del adaptador. «Reintentar» es de la persona. Sin conexión, el adaptador rechaza con su mensaje.
- **Cancelar es quitar:** aborta `signal` y saca el archivo.

**Receta con `XMLHttpRequest`** (`fetch` no expone el progreso de la subida; si usas `fetch`, pasa `signal` y no llames a `progress`). Es una receta de ejemplo: **las pruebas de Grana no la ejecutan** (usan el adaptador simulado).

```js
function xhrUploader(url) {
  return (file, { signal, progress }) => new Promise((resolve, reject) => {
    const aborted = () => reject(new DOMException('Subida cancelada', 'AbortError'))
    if (signal.aborted) return aborted()
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) progress(e.loaded, e.total) }
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) return reject({ message: `El servidor respondió ${xhr.status}` })
      try {
        const body = JSON.parse(xhr.responseText)
        resolve({ value: body.id, url: body.thumbnail })     // value: obligatorio
      } catch {
        reject({ message: 'Respuesta inválida del servidor' })
      }
    }
    xhr.onerror = () => reject({ message: 'Se interrumpió la conexión' })
    xhr.onabort = aborted
    signal.addEventListener('abort', () => xhr.abort(), { once: true })
    const body = new FormData()
    body.append('file', file)
    xhr.send(body)
  })
}
```

```vue
<g-file-field v-model="fotos" name="fotos" label="Fotos de la lesión" multiple :max="5"
              accept="image/*" :max-size="8000000" :uploader="xhrUploader('/api/adjuntos')" :labels="labels"></g-file-field>
```

### Adaptador simulado, para demos y pruebas

`@grana/vue/testing` exporta `createSimulatedUploader(options)`: sin red ni dependencias, con progreso por pasos y `AbortError` al abortar `signal`. **No es contrato del adaptador** y no viaja en la entrada del campo ni en el paquete principal.

```js
import { createSimulatedUploader } from '@grana/vue/testing'

const uploader = createSimulatedUploader({
  interval: 140, steps: 12,
  failMessage: 'Se interrumpió la conexión', serverMessage: 'El servidor no admite este archivo', offlineMessage: 'Sin conexión'
})
// un nombre que contiene «falla» falla al primer intento; «servidor», siempre; «lento», sube despacio
uploader.setOffline(true)     // rechaza también lo que esté en curso
uploader.stats()              // { calls, active, done, failed, aborted }
```

Opciones (todas opcionales): `interval` 120 ms, `steps` 12, `slowSteps` 40, `speed` 1, `failOnce` (`/falla|fail/i`, falla al primer intento al llegar a `failAt` 0,45), `failAlways` (`/servidor|server/i`, al 20 %), `slow` (`/lento|slow/i`), `noValue` (`false`; si casa, resuelve sin `value`), `failMessage`, `serverMessage`, `offlineMessage`, `offline` (`false`), `value(file, n)` (`srv-n` por defecto) y `url(file)` (ninguna). Los predicados admiten `RegExp`, función o booleano. Controles: `setOffline(bool)`, `setSpeed(n)`, `stats()`, `attempts(name)` y `reset()`.

### Archivos ya guardados (edición)

Una entrada **sin `file`** es un archivo que ya está en tu servidor: no se sube, no cuenta como duplicado, se ve con su miniatura (`url`) o su icono y **no lleva estado «Subido»** ni filo de éxito.

```js
const estudios = ref([
  { key: 'doc-118', name: 'Receta médica.pdf', size: 220000, type: 'application/pdf', value: 'doc-118' },
  { key: 'doc-119', name: 'Biometría hemática marzo 2026.pdf', size: 1240000, type: 'application/pdf', value: 'doc-119' }
])
```

Necesitan `value` (sin él, aviso 4: no se podrán enviar). Su `state` es `done`; cualquier otro avisa y se toma `done`. **Quitar un guardado** lo saca de la lista: es que su `value` deja de llegar al envío, y tu servidor decide qué hacer con él. Con `max`, los guardados **cuentan**.

## Modelo

`v-model` es un **arreglo de entradas**, una por archivo, en el orden en que se ve:

```js
[
  { key: 'doc-118', name: 'Receta médica.pdf', size: 220000, type: 'application/pdf', state: 'done', value: 'doc-118', url: null, error: null, file: null },   // guardado
  { key: 'f3', name: 'lesion-frontal.png', size: 48211, type: 'image/png', state: 'uploading', value: null, url: null, error: null, file: File },
  { key: 'f4', name: 'radiografia.png', size: 51022, type: 'image/png', state: 'error', value: null, url: null, error: 'Se interrumpió la conexión', file: File }
]
```

| Campo | Tipo | Qué |
| --- | --- | --- |
| `key` | String | Identidad estable y **única** en la lista. La pone el campo en lo que se añade; tu aplicación, en los guardados |
| `name` | String | `File.name`; en los guardados, el que das |
| `size` | Number | Bytes |
| `type` | String | MIME (puede ser `''`) |
| `state` | String | `ready` · `queued` · `uploading` · `done` · `error` |
| `value` | String, Number o `null` | Lo que identifica al archivo en el servidor; es lo que se envía |
| `url` | String o `null` | Miniatura o enlace del servidor (guardados, o lo que resolvió el adaptador) |
| `error` | String o `null` | Mensaje del fallo de subida |
| `file` | `File` o `null` | El archivo; `null` en los guardados |

| `state` | Cuándo | Se envía |
| --- | --- | --- |
| `ready` | Sin `uploader`: añadido, esperando al envío | El binario, en el `<input type="file">` |
| `queued` | Con `uploader`: en cola | No (bloquea el envío de `GForm`) |
| `uploading` | Con `uploader`: subiendo | No (bloquea) |
| `done` | Subido (`value` del adaptador) o guardado | `value`, en un oculto |
| `error` | El adaptador rechazó | No (bloquea) |

**Conciliación por `key` (DECISIONS #368).** Con `v-model`, la lista es **la de tu aplicación**; el campo guarda aparte solo lo que no está en el modelo (progreso, `AbortController`, URL de objeto). Sin `v-model` (`modelValue` indefinido), el campo guarda la lista y la emite igual. Al cambiar `modelValue`:

- una `key` que **desaparece** se da por quitada por la aplicación: se cancela su subida y se revoca su URL, en silencio;
- una `key` **nueva** se toma tal cual (es dato tuyo: **no** se valida contra `accept`, `maxSize` ni `max`); con `file` y con `uploader` entra en la cola, con `file` y sin `uploader` es `ready`;
- **el estado de subida de una entrada que el campo está gestionando es del campo:** si devuelves otro `state`, `value` o `error` para esa `key` mientras está en `queued` o `uploading`, gana el del campo (aviso 5). Una entrada en `error` o `done` sí la puedes cambiar.

`update:modelValue` se emite al cambiar la lista o el `state`, `value`, `url` o `error` de una entrada; **nunca por progreso**. Al montar, las entradas con `file` en `queued` o `uploading` **vuelven a la cola** desde cero; las `error` se quedan en `error`. Al desmontar, las subidas en curso se cancelan y las URL de objeto se revocan sin emitir nada: tu modelo conserva su último valor, así que un `v-if` que desmonta a media subida deja entradas `uploading` que reanudarán al volver a montar.

## Validar al añadir

Tres vías, ninguna exclusiva (WCAG 2.5.7): **elegir** (diálogo del sistema), **arrastrar** y **pegar**. La validación es la misma en las tres, en este orden, por archivo: tipo (`accept`), vacío (0 bytes), tamaño (`maxSize`), duplicado y número (`max`; entran los primeros que caben). **Lo rechazado no entra** en el modelo ni en el envío.

| Motivo (`reason`) | Cuándo |
| --- | --- |
| `type` | No casa con `accept` (por extensión sin mayúsculas y por MIME, `application/pdf` o `image/*`; un archivo sin MIME casa solo por extensión). El atributo nativo filtra el diálogo; arrastrar y pegar no, por eso el campo lo comprueba |
| `empty` | 0 bytes (siempre) |
| `size` | Más que `maxSize` (bytes) |
| `duplicate` | Mismo `name`, `size` y `lastModified` que una entrada con `file` |
| `count` | Pasaría de `max` (o, sin `multiple`, de varios soltados entra el primero que pasa y el resto se rechaza con `count`) |

- **`multiple`:** cada gesto **suma**. Sin él, el campo admite **uno**: el nuevo **reemplaza** al anterior (si subía, se cancela; si era guardado, sale de la lista) y se anuncia `labels.replaced`.
- **`max`** solo con `multiple` (sin él se ignora con aviso 3). Al llegar, el campo está **lleno**: elegir no abre el diálogo, soltar no se admite (destino `labels.dropFull`) y pegar valida y rechaza con `count`.
- **Aviso de no añadidos**, uno por gesto: un grupo con nombre `labels.notAdded` y cada archivo con su motivo en texto («enorme.png: pesa 9 MB, el máximo es 8 MB»). **No desaparece solo** (WCAG 2.2.1): «Descartar» lo quita y devuelve el foco al control; el siguiente gesto lo sustituye.
- **El evento `reject`** (`{ items: [{ file, name, reason }], via }`) te deja registrar o explicar más. `add()` también devuelve lo rechazado.
- **Una selección vacía no borra** la lista: cancelar el diálogo (algunos navegadores disparan `change` con cero archivos) no quita nada.
- **Tamaños:** `formatFileSize` usa `Intl.NumberFormat(locale, { style: 'unit', unitDisplay: 'short' })` con unidades **decimales** (byte, kB, MB, GB, como Finder, iOS y Android) y una cifra decimal por debajo de 10. Con `es-MX`: 5 000 000 → «5 MB», 220 000 → «220 kB», 1 240 000 → «1.2 MB». La ficha, el `{size}` y el `{limit}` del aviso y tu `hint` salen de la misma función.

## Envío

| Caso | `<input type="file">` | Ocultos `<input type="hidden" name>` |
| --- | --- | --- |
| **Sin `uploader`** | Con `name`: lleva los binarios (`ready`) | Uno por **guardado** con su `value` |
| **Con `uploader`** | **Sin `name`** (no se envían binarios) | Uno por entrada **`done`** (subidas y guardados) con su `value` |
| `readonly` | Igual que su caso (sigue en el envío) | Igual |
| `disabled` (propio o heredado) | `disabled` | `disabled` |

- Con `uploader`, las entradas `queued`, `uploading` y `error` **no se envían**.
- Sin `uploader` con guardados, el **mismo `name`** lleva partes de archivo (nuevas) y partes de texto (guardadas): tu servidor las distingue por el tipo de parte.
- `form` (por atributo) se copia a los ocultos.

### Bloqueo del envío: nada sale a medias

Con `uploader`, **dentro de un `GForm` el campo bloquea el envío por sí mismo**, sin que lo pongas en `errors` (DECISIONS #372; [`form.md` §2](../../../../../design/contracts/form.md), «Error propio del componente»):

- hay error propio si alguna entrada está en `error` (**`labels.failed`**) o, si no, en `queued` o `uploading` (**`labels.pending`**);
- se revela **solo al enviar** o con `showErrors()`: añadir un archivo nunca pinta un error. Nunca se envía solo al terminar las subidas (WCAG 3.2.2): el error desaparece en silencio y la persona vuelve a enviar;
- **precedencia:** primero la prop `error` con texto, después el error propio y por último `errors[name]`. Una `error=""` explícita **no oculta** el error propio (si lo hiciera, se bloquearía sin pintar nada), pero sí sigue ocultando `errors[name]`;
- el resumen de errores enlaza al **«Reintentar» del primer fallido** (su descripción dice «Error: …»), o al control si solo hay pendientes; el foco va al mismo sitio;
- sin `labels.failed` o `labels.pending` el campo **bloquea igual**, con un espacio como mensaje (aviso 2 al montar); define los dos.

> **`GFileField` necesita `name` para bloquear el envío.** Sin `name` el campo no se registra en `GForm`: no cuenta en el resumen, no bloquea con subidas pendientes o fallidas y, sin `uploader`, tampoco lleva los binarios. Un campo sin `name` es válido fuera de un formulario, así que no hay aviso de desarrollo: dentro de un `GForm`, **pásalo siempre**.

- **Fuera de `GForm`** (un `<form>` nativo sin `novalidate`): el error propio nunca se pinta, pero el `<input type="file">` lleva **`setCustomValidity`** con el mismo mensaje (vacío sin error), así un envío nativo o `form.checkValidity()` tampoco salen con subidas a medias.
- **`formnovalidate`** («Guardar borrador»): `GForm` no comprueba nada y el borrador sale **sin** lo pendiente ni lo fallido. Es la semántica del atributo.
- **Inactivo** (`GFormReveal` cerrado, sección `addable` sin agregar): no bloquea, como todo registro inactivo; las subidas siguen dentro del bloque cerrado.
- **Dentro de `GInputGroup` o `GFieldGroup`:** no admitido en v0.1 (aviso 8); el error propio no llegaría al envío.

## Arrastre y pegado

**Arrastre de página** (DECISIONS #373). Un módulo interno instala **un solo** juego de escuchas en `document` con el primer campo montado y lo retira con el último. Con un arrastre que lleva archivos:

- **Despiertan** (`is-awake`) los campos que no están en solo lectura ni deshabilitados, no están dentro de un subárbol `inert` (un `GFormReveal` cerrado, una sección plegada, la página bajo un modal), están a la vista y, con un `<dialog>` modal abierto, están dentro del superior. En la auditoría, con un modal abierto ningún campo de la página despierta y el del diálogo sí.
- **Admite o no** (`is-awake-ok` / `is-awake-no`): el navegador solo da el MIME de lo que arrastras (Safari a veces ni eso; nunca el nombre). Si `accept` lleva alguna extensión, o no hay tipos, **se da por bueno** y la decisión final es al soltar, con el aviso de no añadidos si toca. Un campo lleno no admite.
- **El destino** (`aria-hidden`, solo pintura) es mayor que la caja: `space × 1` por lado, acotado en línea por `column-gap × 0.375` para que dos vecinos de una fila no se solapen (medido: 4 px por lado y 4 px entre vecinos en `compact`). Recibe el puntero **solo** con `is-awake-ok`. Textos: `labels.drop` (`{hint}` = tu prop `hint`), `labels.dropInto` (`{label}`) encima, `labels.dropRejected` y `labels.dropFull`.
- **Soltar** en un campo añade (con `via: 'drop'`) y todo se apaga; salir de la ventana, soltar en cualquier sitio o `dragend` también lo apagan. Despertar o dormir **no se anuncia**: arrastrar es un gesto de puntero y las otras dos vías siguen.
- **Protección siempre activa** (no es opción): mientras haya un campo montado, un `dragover` con archivos que nadie atendió recibe `preventDefault()` y `dropEffect = 'none'`, y un `drop` con archivos que nadie atendió recibe `preventDefault()`. El navegador no navega al archivo y la página no pierde lo escrito. Las escuchas van en fase de burbuja: un destino propio de tu aplicación que llama a `preventDefault()` sigue funcionando.

**Pegar:** con el foco en el control, ⌘V / Ctrl+V añade los archivos del portapapeles (con `via: 'paste'`); si no hay, no hace nada. En solo lectura o deshabilitado, ni arrastrar ni pegar.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` | Array | entradas (ver «Modelo») | `undefined` (sin `v-model`, el campo guarda su lista) |
| `accept` | String | sintaxis del atributo nativo (`.pdf,image/*`) | sin valor (todo) |
| `multiple` | Boolean | | `false` |
| `max` | Number | entero ≥ 1, solo con `multiple`; cuentan los guardados | sin valor |
| `maxSize` | Number | bytes, > 0 | sin valor |
| `uploader` | Function | `(file, { signal, progress }) => Promise<{ value, url? }>` | sin valor (envío nativo) |
| `concurrency` | Number | entero ≥ 1 | `2` |
| `locale` | String | etiqueta BCP 47 (para tamaños y cifras) | ver «SSR e idioma» |
| `labels` | Object | ver «Textos» | `{}` |
| `name` | String | registra el campo en `GForm` y nombra lo que se envía | sin valor |
| `label` | String | | sin valor |
| `hint` | String | texto tuyo (usa `formatFileSize` para el límite) | sin valor |
| `error` | String | | sin valor |
| `warning` | String | | sin valor |
| `valid` | String | | sin valor |
| `required` | Boolean | `aria-required` y marca; **nunca `required` nativo** | `false` |
| `mark` | Boolean | | sin valor |
| `readonly` | Boolean | | sin valor, equivale a `false` (contexto de `GForm`) |
| `disabled` | Boolean | | sin valor, equivale a `false` (contexto de `GForm`) |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` |
| `variant` | String | `outline` `soft` | `outline` |
| `density` | String | `default` `comfortable` `compact` | contexto de `GForm` o `default` |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor (`sm`) |
| `block` | Boolean | | sin valor, equivale a `false` (dentro del layout de formulario, `true`) |
| `id` | String | | generado |

**No existen** (DECISIONS #378): `appearance` y `expected` (reservados), `color` (el foco usa `--g-color-focus`), `capture` como prop (como **atributo** llega al `<input>` y abre la cámara en móvil, nativo y sin interfaz propia), `validate`, `autoUpload` (la subida empieza al añadir; «subir al enviar» queda fuera), `placeholder`, `prefix`, `suffix`, `output`, `clearable`, `loading` (el estado de subida es por archivo), `directory` y `webkitdirectory` (reservado), `minSize` (un archivo vacío se rechaza siempre).

**Reglas de props**

- **`required`** no valida: la obligatoriedad la decide tu aplicación con `error` o `errors`, como en `GSelect`. Nunca `required` nativo porque los guardados no están en el `<input>` y el nativo los daría por ausentes.
- **`readonly`:** la lista se ve **sin acciones**; el `<input>` sigue enfocable y en el envío, con `aria-disabled="true"`; no abre el diálogo ni admite soltar ni pegar. **`disabled`:** `disabled` nativo en el `<input>` y en los ocultos, lista atenuada, sin acciones, no despierta.
- **`concurrency` < 1, `maxSize` ≤ 0, `max` < 1 o `max` sin `multiple`:** aviso 3; se ignora o se usa el valor por defecto.
- **Atributos:** `class` y `style` van a la raíz; el resto (`form`, `capture`, `aria-*`, `data-*`, escuchas) al `<input type="file">`, con los manejadores propios primero. `type`, `accept`, `multiple`, `name`, `required`, `disabled`, `id`, `aria-describedby`, `aria-labelledby`, `aria-disabled` y `aria-required` los pone el componente y ganan; un `aria-describedby` tuyo se **añade al final** de la descripción. `type`, `webkitdirectory`, `directory` y `aria-invalid` se ignoran con aviso 7. Sin `label` (ni slot), tu `aria-label` o `aria-labelledby` sustituye a la etiqueta en el nombre.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `Entry[]` (copias planas) | Cambia la lista o el `state`, `value`, `url` o `error` de una entrada; **nunca por progreso** |
| `change` | `{ added: Entry[], removed: Entry[], via }` | **Una vez por gesto** que cambia qué archivos hay, después de `update:modelValue`. `via`: `picker` · `drop` · `paste` · `api` · `remove` · `cancel`. Sin `multiple`, `removed` lleva el reemplazado. No por cambios de estado de subida |
| `reject` | `{ items: [{ file, name, reason }], via }` | Un gesto con archivos rechazados (`reason`: `type` `empty` `size` `duplicate` `count`) |

No hay eventos de subida (`upload`, `uploaded`, `progress`): el modelo ya cambia de estado. Los tres están declarados en `emits`, así que el `@change` tuyo recibe el objeto y no llega al `<input>` nativo. Dentro de `GForm`, añadir, quitar, cancelar y reemplazar llaman a `notifyChange()` (suben `dirty`, revelan el error de la aplicación y retiran `is-rejected`); reintentar y el progreso no. Con `readonly` o `disabled` no se emite nada.

## Métodos expuestos

| Método | Hace |
| --- | --- |
| `add(files)` | Añade un `FileList` o un arreglo de `File` con la validación, el aviso, los anuncios y los eventos de siempre (`via: 'api'`). Devuelve `{ added: Entry[], rejected: [{ file, name, reason }] }`. No hace nada en solo lectura ni deshabilitado. Para cámaras propias, otro destino de soltar o pruebas |
| `open()` | Abre el diálogo del sistema (`input.click()`) si no está lleno, ni en solo lectura ni deshabilitado. El navegador exige llamarlo **dentro de un gesto** de la persona |
| `focus()` | Enfoca el control |

## Slots

| Slot | Propósito | Notas |
| --- | --- | --- |
| `label` | Etiqueta | Como `GInput`: dentro del `<label>` |
| `hint` | Pista | Dentro de la descripción; la copia junto a la cara repite el slot |
| `error` | Mensaje de error del campo | Tras el prefijo oculto de `GForm` |

**Sin slots de ficha** en v0.1 (`item`, `lead`: reservados): la ficha es la pieza que garantiza Δ0, el nombre completo en el árbol y los botones con nombre.

## Textos (`labels`)

Sin valores por defecto (Grana es internacional, DECISIONS #226): todo lo que el campo dice sale de `labels`. Los marcadores se escriben `{texto}`. Los **contados** admiten un String con marcador o una **función** (para el plural de tu idioma); `count` y `max` llegan a la función **sin formatear**, y en la forma String el campo los formatea con `Intl.NumberFormat(locale)`. Un valor `null` o `undefined` devuelto por una función se toma como `''`.

| Clave | Marcadores o firma | Dónde | Si falta |
| --- | --- | --- | --- |
| `add` · `addMany` | | Cara vacía (sin / con `multiple`) | Cara sin texto; aviso al montar |
| `addMore` · `change` | | Cara con archivos (con / sin `multiple`) | Ídem, al necesitarse |
| `full` | `{count}`, `{max}` o `(count, max)` | Cara llena («5 de 5») | Ídem, con `max` |
| `readonly` · `none` | | Cara en solo lectura con / sin archivos | Ídem, con `readonly` |
| `status` | `({ count, max, active, failed }) => String` o String con `{count}`, `{max}`, `{active}`, `{failed}` | Estado en el pie y en la descripción del control | Sin estado; aviso al montar |
| `list` | `{label}` | Nombre de la lista | Lista sin nombre; aviso |
| `drop` | `{hint}` | Destino despierto que admite | Destino sin texto; aviso al primer arrastre |
| `dropInto` | `{label}` | Destino con el puntero encima | Usa `drop`; aviso |
| `dropRejected` | `{label}` | Destino que no admite | Destino sin texto; aviso |
| `dropFull` | `{label}` | Destino de un campo lleno | Usa `dropRejected`; aviso |
| `remove` · `cancel` · `retry` | `{name}` | Nombres de los botones de la ficha | **Aviso al montar**: un botón sin nombre no cumple 4.1.2 |
| `queued` · `done` | | Estado de la ficha (para el lector) y texto de la barra en cola | Sin estado; aviso al necesitarse |
| `error` | | Rótulo del mensaje de fallo y prefijo de su descripción | Ídem |
| `progress` | `{name}` | Nombre de la barra de cada ficha | Barra sin nombre; aviso |
| `progressText` | `{percent}`, `{loaded}`, `{total}` | `aria-valuetext` de la barra | `GProgress` usa su porcentaje; sin aviso |
| `uploadFailed` | | Mensaje cuando el adaptador rechaza sin `message`, resuelve sin `value` o aborta por su cuenta | Mensaje vacío; aviso |
| `notAdded` · `dismiss` | | Nombre del aviso y su botón | Aviso al necesitarse |
| `reasons.type` · `reasons.empty` · `reasons.duplicate` | | Motivo en el aviso y en el anuncio | Ídem |
| `reasons.size` | `{size}`, `{limit}` | Ídem | Ídem |
| `reasons.count` | `{limit}` | Ídem | Ídem |
| `added` · `uploaded` · `retrying` | `{name}` | Anuncios | Sin ese anuncio; aviso al necesitarse |
| `addedMany` · `uploadedMany` · `uploading` | `{count}` o `(count)` | Anuncios | Ídem |
| `replaced` | `{old}`, `{name}` | Anuncio de reemplazo (sin `multiple`) | Ídem |
| `rejected` | `{name}`, `{reason}` | Anuncio de un rechazo | Ídem |
| `rejectedMany` | `{count}`, `{list}` o `(items) => String` con `items: [{ file, name, reason, text }]` | Anuncio de varios rechazos | Ídem |
| `uploadError` | `{name}`, `{message}` | Anuncio de un fallo | Ídem |
| `removed` · `canceled` | `{name}`, `{count}` (los que quedan) o `(count, name)` | Anuncios | Ídem |
| `pending` · `failed` | `{count}`, `{name}` o `(count, name)` | Error propio al enviar | **Aviso al montar con `uploader`**: bloquea igual, con un espacio como mensaje |

**Firmas de las funciones** (todas devuelven String): `full(count, max)` · `removed(count, name)` y `canceled(count, name)` (`count` = los que quedan) · `pending(count, name)` y `failed(count, name)` (`name` = el primero) · `addedMany(count)` · `uploadedMany(count)` · `uploading(count)` · `rejectedMany(items)` · `status({ count, max, active, failed })`. En `status`, `active` = en cola + subiendo, y `max` es `null` sin límite y `1` sin `multiple`.

**Texto que compone el componente** (lo único que no está entero en `labels`; la puntuación es de Grana, no del idioma):

| Dónde | Composición |
| --- | --- |
| Aviso de no añadidos | Por archivo: `<strong dir="auto">{nombre}</strong>` + `: ` + el motivo; sin motivo, solo el nombre. Los dos puntos los pone el componente |
| Descripción del fallo de una ficha (`g-file-field__error`, oculta; la usa «Reintentar») | `labels.error` + un espacio + el mensaje. Si quieres puntuación, va dentro de `labels.error` («Error:») |
| Anuncio de varios rechazos sin función | `labels.rejectedMany` con `{list}` = «nombre, motivo» unidos con `; ` |
| Anuncio de un gesto | Las partes (reemplazo o añadidos, rechazos, «subiendo») unidas con un espacio |
| «Descartar» del aviso | Botón de **solo icono**: su nombre accesible es `labels.dismiss`; no pinta texto |

Un juego completo en español está en el playground (`ff.labels` en `packages/vue/playground/index.html`).

## La ficha de cada archivo

Cada archivo es una [`GSummary`](../GSummary/README.md) `layout="inline"` `size="xs"` dentro de un `<li>`, más sus acciones y, mientras sube, su barra (DECISIONS #375).

| Dato | En la ficha |
| --- | --- |
| `name` | Título, recortado con elipsis y `title` nativo. **Una ficha recortada no es la única fuente del nombre:** está entero en el árbol y en los nombres de «Quitar» y «Reintentar» |
| `size` | Subtítulo con `formatFileSize`; cede antes que el nombre. Si no cabe entero junto al título pasa a una segunda línea que el cuerpo recorta (nunca se ve un trozo de cifra) |
| Miniatura | Solo imágenes que el navegador pinta (PNG, JPG, GIF, WebP, AVIF, BMP, SVG), con una URL de objeto propia que se revoca al quitar y al desmontar; en los guardados, `url`. Decorativa. Si la imagen no carga, cae al icono `image` |
| Sin miniatura | Icono `image` (imagen que no se pinta, p. ej. HEIC) o `file-text` (el resto) |
| `queued`, `done` | Estado (`labels.queued`, `labels.done`) **solo para el lector** |
| `error` | El mensaje **se ve** en la ficha (`labels.error` + mensaje) |

- **Acciones al lado** (no dentro de la `GSummary`): **«Reintentar {nombre}»** (icono `rotate-ccw`) solo en `error`, y un mismo botón en el mismo sitio que dice **«Quitar {nombre}»** o, en `queued` y `uploading`, **«Cancelar subida de {nombre}»** (icono `x`). `GBtn` `ghost` `neutral` `xs`, de 24 px o más (44 px con puntero grueso). Ninguna en solo lectura ni deshabilitado.
- **Progreso:** un [`GProgress`](../GProgress/README.md) `size="sm"` `color="accent"` con `showLabel: false` y `showValue: false` (sin fila de texto) como capa de la ficha; `labels.progress` es su nombre y `labels.progressText` su `valueText`. Esta prop `showLabel` es nueva de `GProgress` para este campo.
- **Δ0:** la ficha mide lo mismo en `ready`, en cola, subiendo, subida, con error y guardada (medido en la auditoría en `xs` a `xl` y `soft`).

## Disposición

- **Caja vacía** = la de un `GInput` del mismo `size` y `density` (borde, radio, fondo y foco de la familia de los campos). **Con archivos**, las fichas fluyen en línea dentro de la caja y la última pieza es «Adjuntar»; la caja crece **hacia abajo** por líneas y nada de encima se mueve. Cada línea de fichas mide al menos lo que sus botones: en `xs`, `sm` o `compact` la caja con un archivo puede ser más alta que un `GInput` vecino, **con la parte superior alineada**, y el vecino no se estira (medido en 15 combinaciones y tres temas).
- **La cara «Adjuntar»** muestra `add` o `addMany` vacía; `addMore` (con `multiple`) o `change` (sin él) con archivos; `full` llena; `readonly` o `none` en solo lectura. Vacía y editable, tu `hint` se ve **dentro** de la cara, a su lado, separado por un filete corto (el del pie queda oculto a la vista mientras está esa copia).
- **Sin `multiple`**, una ficha llena la línea y «Cambiar archivo» queda al final, como el valor y la acción de un campo; con `multiple`, las fichas tienen el mismo ancho base (`space × 52`).
- **En una `GFormRow`:** admitido como hijo; la fila se parte antes de que «Adjuntar» quede sin sitio. `GFileField.css` declara **`--g-form-min: 62`** sobre `.g-form-row > .g-file-field`: `space × 62` = 248 px con `space` 4, frente a los 245 px que sumó la medida de coco (borde 2 + relleno 6 + lista en su suelo 96 + separación 4 + «Adjuntar archivo» 137). Con 60, «Adjuntar archivo» bajaba de línea entre 552 y 536 px. Barrido de la auditoría de 960 a 300 px: mientras comparte línea con un `GInput`, «Adjuntar archivo» sigue en la línea de la ficha; la fila se parte a 508 px con el tema por defecto y a 636 px con el de la auditoría (`space` 5). **Depende de la fuente y del idioma de `labels.add`:** sobrescríbelo con `style` (`--g-form-min`, propiedad pública de entrada de `GForm`).
- Fuera de una fila, el ancho es tuyo (por defecto `min(100%, space × 90)`, como `GInput` con acción). Sin desborde a 320 px ni en LTR ni en RTL.

## Teclado

| Tecla | Dónde | Qué |
| --- | --- | --- |
| Tab / Mayús+Tab | Campo | Recorre, en orden del DOM, los botones de cada ficha y después el **control** (orden del DOM = orden visual) |
| Espacio (Intro donde el navegador lo admita) | Control | Abre el diálogo del sistema; lleno o solo lectura: nada (`click` cancelado) |
| ⌘V / Ctrl+V | Control | Pega los archivos del portapapeles |
| Intro / Espacio | Botón de una ficha | Reintentar / Quitar / Cancelar subida |

**Sin atajos propios:** Retroceso o Supr en el control **no** quitan fichas (no es un campo de etiquetas; quitar es un botón con nombre). WebKit con los ajustes por defecto de Safari llega al control con **Opción+Tab**, como a cualquier botón (no es propio de este campo; la auditoría usó `Alt+Tab` en WebKit).

**Foco:** el control es el `<input type="file">` real, enfocable; su foco se pinta como anillo de la caja (`--g-focus-width` en `--g-color-focus`, medido 2 px). El foco nunca cae al `body`:

| Gesto | El foco va a |
| --- | --- |
| Quitar / Cancelar subida | El «Quitar» de la **siguiente** ficha; si no hay, el de la **anterior**; si no queda ninguna, el **control** |
| Reintentar | El botón de la **misma** ficha, que pasa a «Cancelar subida de {nombre}» |
| Descartar el aviso | El control |
| Elegir en el diálogo | El control (nativo) |
| Enlace del resumen tras un envío bloqueado | El «Reintentar» del primer fallido, o el control |

## Accesibilidad

```html
<div class="g-file-field g-file-field--size-md g-file-field--variant-outline has-files is-multiple">
  <label class="g-file-field__label" id="ID-label" for="ID">Fotos de la lesión</label>
  <div class="g-file-field__box">
    <ul class="g-file-field__list" role="list" aria-label="Archivos de Fotos de la lesión">
      <li class="g-file-field__chip" data-state="error">
        <span class="g-summary g-summary--layout-inline g-summary--size-xs">…</span>
        <span class="g-file-field__error" id="ID-e4-error" hidden>Error: Se interrumpió la conexión</span>
        <button class="g-btn g-file-field__retry" id="ID-e4-retry" aria-label="Reintentar radiografia.png" aria-describedby="ID-e4-error">…</button>
        <button class="g-btn g-file-field__remove" aria-label="Quitar radiografia.png">…</button>
      </li>
    </ul>
    <span class="g-file-field__add">
      <input class="g-file-field__input" type="file" id="ID" name="fotos" accept="image/*" multiple
             aria-labelledby="ID-label ID-action" aria-describedby="ID-hint ID-status ID-message">
      <span class="g-file-field__action" id="ID-action">Añadir más</span>
    </span>
    <div class="g-file-field__target" aria-hidden="true">…</div>
  </div>
  <div class="g-file-field__foot">
    <p class="g-file-field__meta"><span class="g-file-field__hint" id="ID-hint">…</span> <span class="g-file-field__status" id="ID-status">2 de 5 · 1 con error</span></p>
    <div class="g-file-field__message" id="ID-message" aria-live="polite">…</div>
  </div>
  <div class="g-file-field__live" role="status" aria-live="polite" aria-atomic="true"></div>
</div>
```

- **El control es el `<input type="file">` real**, con el patrón de texto oculto accesible. La caja no es un segundo control: sin rol ni `tabindex`. Es también el que se envía: el foco al primer inválido, el desplazamiento y el envío nativo coinciden.
- **Nombre compuesto:** `aria-labelledby="ID-label ID-action"` = la etiqueta del campo **y** el texto de la cara («Fotos de la lesión Adjuntar archivos»), de modo que los dos textos visibles están en el nombre (WCAG 2.5.3). Se comprueba por pruebas y en el árbol de accesibilidad de Playwright; **no se oyó con lector real** (ver «No verificado»).
- **Descripción, no `aria-invalid`:** `aria-invalid` no está admitido en el rol `button` que los navegadores exponen para `input[type=file]`, así que se ignora con aviso 7. `aria-describedby` = pista + estado + mensaje (con su prefijo oculto de `GForm`) + tus ids. La raíz lleva `is-invalid` para la pintura.
- **Estado en la descripción** (`ID-status`, `labels.status`: «2 de 5 · 1 subiendo · 1 con error»): **no es región viva**; quien vuelve al campo lo oye sin que nada se haya anunciado.
- **`aria-disabled="true"`** en lleno, solo lectura y deshabilitado heredado sin `disabled` nativo; nunca `disabled` para lleno ni solo lectura (sacaría los archivos del Tab y del envío).
- **Lista:** `<ul role="list">` con nombre `labels.list`, solo con archivos; el `role="list"` explícito evita que VoiceOver deje de anunciar como lista un `<ul>` sin viñetas. Los ids por entrada son internos (`ID-e{n}`), nunca derivados de `key`.
- **Región viva propia**, cortés y atómica, presente desde el montaje. **Si un `<dialog>` modal tapa el campo** (página inerte), el anuncio se escribe en una región que el campo monta dentro de ese modal mientras exista (como `GToaster`); en la auditoría, el anuncio de un campo de la página con un `GDialog` abierto se escribe dentro del diálogo.

**Anuncios** (un anuncio por gesto, no por archivo; el escritor de la región junta lo que llega en 50 ms):

| Suceso | Anuncio | Texto |
| --- | --- | --- |
| Gesto de añadir (elegir, soltar, pegar, `add()`) | Lo añadido y lo rechazado **juntos**, más «Subiendo» si hay adaptador | `added` / `addedMany` / `replaced` + `rejected` / `rejectedMany` + `uploading` |
| Fallo de un archivo | Cada uno | `uploadError` |
| Cierre de lote (todo lo añadido en un tramo terminó) | Uno | `uploaded` / `uploadedMany` |
| Quitar · cancelar · reintentar | Uno | `removed` · `canceled` · `retrying` |

**No se anuncia:** cada tic de progreso, el estado al enfocar (está en la descripción), despertar o dormir los destinos, ni el error propio al enviar (lo anuncia el resumen; si no hay resumen, el foco llega al destino con su descripción). Medido en la auditoría: «Añadidos 2 archivos. Subiendo 2.» y, al terminar el lote, **uno** «2 archivos subidos.».

**Mínimos medidos** (auditoría de coco, tres motores salvo donde se dice):

- **Área táctil:** la caja es el objetivo del control, con el piso del alto de `GInput` (24 px; 44 px táctil); «Quitar», «Reintentar» y «Descartar» de **24 × 24 px o más**. Con `pointer: coarse` (emulado en Chromium, `isMobile`, tema de la auditoría): caja `xs`/`compact` 44, ficha `xs` 44, botones 44.
- **Contraste** (compuesto real, 26 configuraciones en Chromium: tema por defecto, el de la auditoría —`space` 5, cuerpo de 17, borde de 2 px— y los once de Dark Color Presence, claro y oscuro; 6 en Firefox y WebKit). Mínimos: cara de «Adjuntar» **4,52:1**; pista y estado 7,38; nombre de archivo 16,08; **frente de avance 4,50 contra el relleno y 4,74 contra la ficha** (se exigen 3:1); **filo de éxito 4,93 contra la ficha**; ficha en error: nombre, mensaje e icono **4,53**, y botones sobre ella **4,27** (3:1 exigido); destino que admite **4,50**, encima **4,51**, no admite 6,87 (borde 3,43); borde de la caja 3,43; foco 4,52; mensajes 4,51 a 4,60. Los que rozan 4,5 vienen del rol del tema, no del componente: si un tema generado bajara, el aviso es del motor de tema.
- **No solo color:** error con mensaje en la ficha y «Reintentar»; subida con la forma del relleno y el estado; destino que no admite con borde discontinuo y texto; completado con el filo y el estado del pie.
- **Texto al 200 %** (tamaño de letra raíz, no zoom de página): caja vacía Δ0 con `GInput` y la ficha contiene su texto en los seis estados. Medida tras corregir el hallazgo 2 de la auditoría.
- **`forced-colors`** (emulado en los tres motores): anillo `Highlight` de 2 px o más; ficha con contorno `CanvasText` (discontinuo en error); progreso sin relleno, con frente y línea inferior `Highlight`; filo `CanvasText`; destino que admite con borde `Highlight`, encima `Highlight`, no admite discontinuo.
- **RTL y 320 px:** sin desborde en LTR ni RTL con los seis estados; el relleno avanza desde el inicio de la lectura y el frente está en el borde final (derecho en LTR, izquierdo en RTL); la ficha aterriza desde el final de la lectura. Los iconos no son direccionales; los nombres de archivo llevan `dir="auto"`.
- **Consola:** limpia en los tres motores (sin avisos de Vue ni `[Grana GFileField]`).

## Personalidad

Con tokens (`--g-duration-*`, `--g-ease-*`) y sin constantes de tema nuevas; con `prefers-reduced-motion: reduce` **nada se desplaza ni se escala** y quedan solo fundidos de color y opacidad. **Nada se anima al montar** (`is-ready`, como `GInput`). **Sin usos nuevos de `--g-ease-spring` ni `--g-ease-bounce`** (DECISIONS #376): el aterrizaje es una entrada, y las entradas no llevan muelle.

| Pieza | Qué | Duración y curva |
| --- | --- | --- |
| La ficha **aterriza** | Al añadirse por un gesto (no al montar ni al conciliar el modelo): opacidad y escala desde `0.86`, con el origen en el lado del final de la lectura (derecha en LTR, izquierda en RTL). El campo marca `is-landing` y la retira al terminar la animación | `--g-duration-press`, `--g-ease-out`. Medido: escala monótona 0,860 a 1,000, nunca mayor que 1; con `reduce`, `g-file-field-land-fade` sin escala |
| Los destinos **despiertan** | Todos a la vez, con un fundido de opacidad; encima, el que admite se enciende (relleno sólido `accent`) | Despertar 160 ms, dormir 120 ms (medidos); sin escala |
| La ficha **se llena** | El relleno de `GProgress` avanza con `translate`, sin layout | La transición de `GProgress` |
| Subido | Aparece el filo de éxito (solo en lo subido en esta sesión, no en los guardados) | Fundido, `--g-duration-fast` |
| Error, encima, lleno | Color y fondo | `--g-duration-fast`, `--g-ease-standard` |
| Rechazo al enviar | `is-rejected`: sacudida de la caja (`g-reject-file-field`), con desplazamiento real; con `reduce`, ni sacudida ni desplazamiento | La de `GInput` |

## Tema

El componente solo lee tokens `--g-*` y alias locales (`--_*`). **No define tokens nuevos** (DECISIONS #376), no usa valores de respaldo y no lleva colores literales: según la auditoría, en `GFileField.css` solo hay literales de `24px`, `44px` y el patrón de texto oculto; los colores de sistema aparecen solo dentro de `forced-colors`. Sin muelle ni rebote.

| Token | Para qué |
| --- | --- |
| `--g-color-surface`, `--g-color-border-control`, `--g-color-surface-sunken`, `--g-radius-{rounded}`, `--g-border-width`, `--g-space-1` | Caja de la familia de los campos (alto, rellenos, separaciones; piso de 24 px, 44 px táctil); `surface-sunken` en `soft` y solo lectura |
| `--g-focus-width`, `--g-focus-offset`, `--g-color-focus` | Anillo de la caja con el control enfocado |
| `--g-color-surface-sunken`, `--g-radius-xs` | Fondo y radio de la ficha |
| `--g-color-accent-soft`, `--g-color-on-accent-soft` | Relleno de la ficha que sube y su **frente de avance**; borde y texto del destino que admite; cara de «Adjuntar» en `soft` |
| `--g-color-accent`, `--g-color-on-accent` | Destino con el puntero encima |
| `--g-color-accent-text` | Texto de «Adjuntar» |
| `--g-color-success-text` | Filo de la ficha subida en esta sesión |
| `--g-color-danger-soft`, `--g-color-on-danger-soft`, `--g-color-danger-text` | Ficha en error; borde de la caja con error; mensaje |
| `--g-color-warning-soft`, `--g-color-on-warning-soft` | Aviso de no añadidos |
| `--g-color-text-muted`, `--g-color-text-subtle`, `--g-color-border-strong` | Pista, estado, cara llena y en solo lectura; deshabilitado; filete entre cara y pista |
| `--g-radius-md` | Destino de arrastre |
| Roles `body-sm`, `caption` y el peso `action` | Etiqueta, cara y pie |
| `--g-duration-fast`, `--g-duration-press`, `--g-ease-out`, `--g-ease-standard` | Movimiento |

**Por qué `on-accent-soft` y no `accent`** (auditoría y DECISIONS #379). Medido en los once temas generados, `accent` **no** llega a 3:1 en claro sobre la ficha ni sobre la página (spotify 1,15, amazon 1,88, stripe 2,34, linear 2,86); `on-accent-soft` da 4,51:1 o más contra el relleno. Por eso el frente de avance y el borde del destino usan `on-accent-soft`, el discontinuo del destino que no admite usa `border-control` (`border-strong` es translúcido, ≈ 1,5:1) y la cara de la variante `soft` usa `on-accent-soft` (`accent-text` sobre `surface-sunken` daba 4,19:1 en apple claro).

**Constantes de diseño que no son tema** (derivadas de `space`; las fija coco en `design/lab/file-field/estilo.md`): alto **mínimo** de la ficha `max(24px, --_h − space × 2, space × 6)` (el último término es el alto de sus botones), relleno lateral de la caja `space × 0.75`, ancho base de una ficha `space × 52`, suelo de la lista `min(100%, space × 24)`, ancho fuera de una fila `min(100%, space × 90)`, sobresaliente del destino `space × 1`, grosor del frente y del filo `--g-border-width × 2`, escala de partida `0.86` y `--g-form-min: 62`.

**Reglas de tematización:** el tema de la aplicación va sin capa y siempre gana a `grana.defaults`. Un tema cuyo `accent-soft` / `on-accent-soft` bajara de 4,5:1 afecta al destino y al avance: lo mide el motor de tema, no el campo.

```css
.mi-formulario { --g-form-min: 72; }   /* una etiqueta de «Adjuntar» más larga: la fila no se parte hasta 288 px */
```

## SSR e idioma

Importar el componente y renderizarlo en el servidor no toca `document`, `window`, `navigator`, `URL.createObjectURL` ni `DataTransfer`. El servidor pinta la etiqueta, la caja con las fichas de `modelValue` (los guardados con su `url` como miniatura; los demás con su icono), la cara, el pie y los ocultos. El módulo de arrastre, la cola de subida, las URL de objeto, la sincronía de `input.files` y la región en el modal son solo del cliente. Cubierto por `GFileField.ssr.test.js` (3 pruebas).

**Pasa `locale` en SSR.** El idioma de tamaños y cifras se resuelve: primero la prop `locale`, después el `lang` del ancestro más cercano y por último `navigator.language`, **al montar**. **Antes de montar** (el servidor y el primer render de la hidratación) y sin `locale`, se usa **`en-US`**, para que servidor y cliente coincidan; al montar pasa a la resolución normal y el texto de la ficha puede cambiar («220 kB» con otro separador decimal, por ejemplo). Con `locale` explícito no hay cambio. Un `locale` que `Intl` no acepta avisa y se usa el idioma del documento.

## Avisos de desarrollo

Prefijo `[Grana GFileField]`; una vez por instancia y motivo; solo fuera de producción.

| # | Causa | Qué hace el componente |
| --- | --- | --- |
| 1 | Sin nombre accesible (sin `label`, slot `label`, `aria-label` ni `aria-labelledby`) | Avisa |
| 2 | Falta un texto de `labels` que se necesita (al montar o al necesitarse, según la tabla de «Textos») | Pinta sin ese texto o no lo anuncia; sin `pending` o `failed` bloquea igual con un espacio |
| 3 | `max` sin `multiple`, `max` < 1, `maxSize` ≤ 0, `concurrency` < 1 | Se ignora o se usa el valor por defecto (`2`) |
| 4 | Entrada sin `key` o sin `name` (se ignora); `key` repetida (se ignora la segunda); guardado con `state` distinto de `done` (se toma `done`) o sin `value` (no se enviará) | Según el caso |
| 5 | La aplicación cambió una entrada que el campo está subiendo | Gana el estado del campo |
| 6 | El adaptador resolvió sin `value` | La entrada pasa a `error` |
| 7 | `type`, `webkitdirectory`, `directory` o `aria-invalid` en los atributos; `appearance` o `expected` (reservados) | Se ignoran |
| 8 | Dentro de un `GInputGroup` o un `GFieldGroup` | Avisa (no admitido) |

## Clases

- **Raíz:** `g-file-field`, `--size-{xs|sm|md|lg|xl}`, `--variant-{outline|soft}`, `--density-*`, `--rounded-*`, `--block`; estados `is-ready`, `has-files`, `is-multiple`, `is-full`, `is-readonly`, `is-disabled`, `is-invalid`, `is-warning`, `is-valid`, `is-rejected`, `is-awake`, `is-awake-ok`, `is-awake-no`, `is-over`.
- **Etiqueta y caja:** `g-file-field__label` (`__optional`, `__required`), `__box`, `__list` (`role="list"`).
- **Ficha:** `g-file-field__chip` con `data-state` (`ready` `queued` `uploading` `done` `error`), `data-stored` (atributo vacío en los guardados) e `is-landing`; dentro, una `g-summary--layout-inline`, `__progress` (el `GProgress`), `__error` (oculto), `__retry` y `__remove`.
- **«Adjuntar»:** `__add`, `__input` (el `<input type="file">`), `__add-icon`, `__action`, `__add-hint`.
- **Destino:** `__target`, `__target-text`.
- **Pie:** `__foot`, `__meta`, `__hint`, `__status`, `__notice` (`__notice-list`), `__message` (`__message-type`, `__message-icon`) y `__live`.

## Limitaciones conocidas

- **Un destino de soltar propio de tu aplicación** que escuche en `document` **después** de que monte el primer campo puede ver el `drop` ya cancelado: escucha en su propio elemento.
- **Sin reintentos automáticos ni límite de tiempo:** son del adaptador. Un adaptador que nunca resuelve deja la entrada subiendo (y el envío bloqueado) hasta que la persona cancela.
- **Desmontar a media subida** cancela; las entradas vuelven a la cola al montar de nuevo.
- **`formnovalidate`** envía sin lo pendiente ni lo fallido.
- **Sin `uploader`** el formulario lleva binarios: `GForm` emite un `FormData` con los `File`; tu aplicación envía `multipart/form-data`.
- **Safari puede no dar tipos durante el arrastre:** el destino dice «Soltar aquí» y la decisión se toma al soltar, con el aviso de no añadidos si toca.
- **Miniatura pequeña** (`xs`): sirve para reconocer, no para comprobar «es la foto correcta»; para eso queda B (reservado).
- **Documentos distintos en un solo campo:** usa un campo por documento (como en el playground, tres campos en una `GFormRow`) o espera a C (reservado). No una ayuda en texto sobre un solo campo.
- **Dentro de `GInputGroup` o `GFieldGroup`:** no admitido (aviso 8).
- **El campo no valida la obligatoriedad** (`required` es solo marca y `aria-required`).
- **Navegadores:** exige `DataTransfer` construible y `:has()`.
- **El trozo de cifra junto al nombre** nace en `GSummary` `inline` sin datos; aquí se corrigió en el campo y no en `GSummary` (pendiente de coco en una ronda de `GSummary`, hallazgo 3 de la auditoría).

## Reservado (fuera de v0.1, DECISIONS #378)

Nombres y formas apartados para entregas siguientes; **hoy no existen** y, si los pasas, `appearance` y `expected` se ignoran con aviso 7.

- **C «Lo que falta»:** prop `expected` (una casilla con nombre por documento esperado, modelo objeto por clave, un `<fieldset>`), para varios documentos distintos. Segunda entrega, decisión del usuario.
- **B «Mesa de luz»:** `appearance="gallery"` (miniaturas grandes). Tercera entrega, decisión del usuario.
- También reservados: `validate` (validación propia de la aplicación), `capture` como prop, `reorderable`, `zoomable`, `directory`, slots de ficha `item` y `lead`, `color`, reintentos automáticos y evento `progress`, y ser parte de `GInputGroup`, `GFieldGroup` o de un perfil de `GAdaptiveLayout`.

## Verificación

- **Pruebas** (vitest con jsdom y, para el servidor, entorno node), **100 de 101 en verde al documentar** (ejecutadas de nuevo): `GFileField.test.js` (45), `GFileField.form.test.js` (9), `GFileField.ssr.test.js` (3), `engine.test.js` (11), `utils/fileDrag.test.js` (9), `src/file-field.test.js` (8 de 9), `GForm/ownError.test.js` (2), `GProgress.test.js` (5) y `testing.test.js` (8). **La que falla es `src/file-field.test.js:73`, que sigue esperando `status: "draft"` en `GFileField.meta.json` y ahora es `candidate`** (no es un defecto del componente: es la prueba de bruno, pendiente de actualizar).
- **Navegador** (Playwright en Chromium, Firefox y WebKit, puerto propio por agente): según la auditoría de coco, los specs de bruno `file-field.spec.mjs` y `personalidad-file-field.spec.mjs` con el CSS corregido **56 pasan y 1 se omite** (pegar en Firefox, por diseño: Firefox no admite archivos en un `ClipboardEvent` construido) en los tres motores. **No se repitieron al documentar.** Cobertura: control real con nombre compuesto, Tab, foco visible, diálogo (`filechooser`), elegir varios, `input.files` sincronizado, rechazos, lleno, progreso, Δ0 de la ficha, ocultos, foco tras quitar y reintentar, cancelar, envío bloqueado y resumen, pegar (Chromium y WebKit), solo lectura, deshabilitado, reemplazo, `FormData` nativo, 320 px LTR y RTL, áreas táctiles, aterrizaje, destinos y reduced motion.
- **Auditoría de coco** con el componente real publicado (`dist/grana.umd.js` + `dist/file-field.umd.js` + `dist/grana.css`), un adaptador de subida determinista y sin red, y arrastre simulado con `DragEvent` y `DataTransfer` reales: `node design/lab/file-field/auditoria-verificar.mjs` (requiere `npm run build`). **3846 de 3846** comprobaciones: CSS estático 11/11, Chromium 2119/2119, Firefox 858/858 y WebKit 858/858. El banco de estilo (`estilo-verificar.mjs`) sigue en verde: 1737/1737 en Chromium y 969/969 en Firefox y WebKit. **No se repitió al documentar.** La auditoría encontró y corrigió tres defectos de CSS (hallazgos 2 a 4): la ficha tenía alto fijo y con el texto al 200 % salía de ella y la caja vacía crecía más que `GInput`; un trozo de cifra junto al nombre; y con `space` 5 los botones de la ficha sobresalían de ella. Contra el `dist/` anterior, la misma verificación daba 38 fallos y con el CSS corregido 0.
- **Empaquetado** (al documentar): `dist/file-field.js` y `dist/file-field.umd.js` existen; `dist/grana.js` no contiene `GFileField`; `dist/file-field.js` no contiene `g-summary__`; `dist/grana.css` contiene `g-file-field__chip`.
- **CSS:** sin colores literales, sin `var()` con respaldo, sin `@layer`, `@property` ni `!important`; solo `--g-*` que existen en `defaults.css` (según la auditoría, no se repitió al documentar).
- **Iconos:** solo Lucide (`plus`, `lock`, `check`, `x`, `rotate-ccw`, `triangle-alert`, `circle-alert`, `image`, `file-text`); `node packages/vue/scripts/check-icons.mjs` en verde (comprobado al documentar).

## No verificado

- **Lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): cómo se lee el `<input type="file">` oculto con su nombre compuesto y su descripción, el recuento nativo del navegador («2 archivos»), la lista y sus botones, el aviso de no añadidos, los anuncios por lote y la barra dentro de la ficha. Solo se comprobó el árbol de accesibilidad.
- **Arrastre real desde el escritorio:** la auditoría usa `DragEvent` y `DataTransfer` sintéticos. **Pegar real:** eventos construidos; Firefox no admite archivos en un `ClipboardEvent` construido (por eso se omite ahí).
- **Diálogo del sistema y hoja móvil reales** de iOS y Android (cámara, fotos, archivos), y **táctil real** (solo `isMobile` de Chromium).
- **`forced-colors` real** (Windows): solo emulado en los tres motores.
- **Safari real:** solo el WebKit de Playwright.
- **Zoom de página al 200 %:** lo medido es el tamaño de letra raíz al 200 %, no el zoom del navegador.
- **Archivos de varios GB, HEIC y la memoria de las URL de objeto con fotos grandes.**
- **La escucha de `document` con varios campos montados y desmontados en una SPA.**
- **La receta de `XMLHttpRequest` de este README** no se ha ejecutado contra un servidor.
- **Cifras de este README tomadas de otros informes** (peso de bruno, auditoría y estilo de coco) y no remedidas al documentar, salvo las marcadas como «Remedido» o «ejecutadas de nuevo».

## Fuentes

- API: [`GFileField.meta.json`](./GFileField.meta.json) · Contrato: [`design/contracts/file-field.md`](../../../../../design/contracts/file-field.md) (DECISIONS #366 a #379) · Error propio de `GForm`: [`design/contracts/form.md`](../../../../../design/contracts/form.md) (§2) · Prototipos: [`design/lab/file-field/r01/`](../../../../../design/lab/file-field/r01/) y [`r02/`](../../../../../design/lab/file-field/r02/) · Estilo: [`design/lab/file-field/estilo.md`](../../../../../design/lab/file-field/estilo.md) · Auditoría: [`design/lab/file-field/auditoria.md`](../../../../../design/lab/file-field/auditoria.md) · Ficha: [`GSummary`](../GSummary/README.md) · Barra: [`GProgress`](../GProgress/README.md) · Formularios: [`GForm`](../GForm/README.md)
