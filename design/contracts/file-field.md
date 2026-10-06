# Contrato · GFileField

**Dueño:** lima · **Estado:** aprobado (concepto **A «Línea de adjuntos»** por defecto, subida al añadir, envío bloqueado con subidas pendientes o fallidas y página entera que responde al arrastre: decisiones del usuario del 2026-10-05; **C** y **B** reservados para entregas siguientes; el resto deriva de HTML, WCAG 2.2 y los contratos vigentes; **ninguna pregunta de producto abierta**) · **Basado en:** `design/lab/file-field/r01/` (kiwi; base funcional: 29 decisiones, L1 a L16) y `design/lab/file-field/r02/` (kiwi, commit `3e6f81f`; conceptos A, B y C, comparativa, L17 a L25; `verificar.mjs` 558/558 en los tres motores) · **Decisiones:** DECISIONS.md **#366 a #379** (#379: enmienda tras el estilo de coco, commit `7e3c7df`) · **Convive con:** `form.md` (contexto, `useFormField`, `GFormRow`, envío; Fase 5; error propio, #372), `summary.md` (cada archivo es una `GSummary`), `widget.md` (`GProgress`, nueva prop `showLabel`, #375), `btn.md` (acciones), `icons.md` v0.8 (`file-text`, `image`, #377), `speech.md` §4 (patrón de adaptador), `combobox.md` (entrada propia, sin `fetch`), `tokens.md` §35 · **Estilo medido:** `design/lab/file-field/estilo.md` (coco)
**Tag:** `g-file-field` · **Categoría:** entradas · **Entrada del paquete:** `@grana/vue/file-field` (#367)
**Componente complejo** (CLAUDE.md, «Modelos por rol»: compone `GSummary`, `GProgress`, `GBtn` y `GIcon`; lleva un motor de estado: cola de subida, validación y arrastre de página; cambia `GForm`): **coco en Opus; bruno en el modelo avanzado de tareas pesadas**.

Un campo para **adjuntar archivos** a un formulario: la receta escaneada, las fotos de una lesión, el comprobante de domicilio, los estudios en PDF de un expediente que ya tiene adjuntos. Se elige con el diálogo del sistema, se arrastra o se pega; la subida la hace la aplicación (Grana no hace red); sin subida, el archivo viaja con el envío nativo.

---

## Principios

- **El control es el `<input type="file">` real** (r01, 1 a 3), oculto a la vista y enfocable, y lleva **siempre** los archivos que están en la lista: el envío nativo y `new FormData(form)` funcionan sin código de la aplicación.
- **Un campo mide lo que un campo** (#366): sin rectángulo permanente para soltar. Comparte fila con `GInput` en una `GFormRow`.
- **Sin `fetch`** (#369): la subida es un **adaptador** de la aplicación (`uploader`), como el motor de la captura de voz (`speech.md` §4).
- **Nada sale a medio subir** (#372): el envío de `GForm` se bloquea con subidas pendientes o fallidas, **solo al enviar**, y nunca se envía solo al terminar (WCAG 3.2.2).
- **Soltar mal no destruye la página** (#373): un archivo que cae fuera de un campo no se abre encima del formulario.
- **Nada salta** (r01, 12 y 19): arrastrar, subir y fallar son pintura; solo crece la caja cuando se añade.
- **Sin textos propios** (#226): todos en `labels`, sin valores por defecto. **Grana no valida el formulario** (#157): `error` lo pone la aplicación; lo único que el campo decide solo es lo que **solo él sabe** (tipo, tamaño, número y estado de subida).

## Qué lo hace distinto (identidad, #366; decisión del usuario)

Todos los frameworks reservan un rectángulo con borde discontinuo, una nube y «Arrastra tus archivos aquí» para un gesto que en móvil y con teclado no existe. `GFileField` no:

| | Qué hace | Por qué sirve |
| --- | --- | --- |
| **No reserva sitio para el gesto** | El campo tiene la anatomía y la medida de un `GInput`: etiqueta · caja · pie. Los archivos son **fichas dentro de la caja**; la última pieza es «Adjuntar archivo», que es el control. Con archivos, la caja crece **hacia abajo** por líneas | Un formulario con tres adjuntos conserva el ritmo de un formulario, y la receta va **en la misma línea** que su folio (kiwi: 64px vacío frente a 126px de la zona de r01; caja alineada al píxel con `GInput` en los tres motores) |
| **La página entera despierta** | Al entrar arrastrando archivos en la ventana, **todos** los campos de archivos encienden a la vez un **destino** más grande que su caja: los que admiten lo que llevas dicen «Soltar aquí», los que no, lo dicen en otra forma. Al pasar por uno, el destino se llena con su nombre | Nadie adivina en qué zona discontinua cabe su PDF: el formulario contesta **dónde va esto** antes de soltar |
| **La ficha es su barra** | Mientras sube, la ficha se llena hacia el final de la lectura; al terminar, un filo de éxito. El progreso está **en el objeto**, no en otra línea | Se ve qué archivo va por dónde sin buscar una barra aparte, y nada cambia de alto |
| **Pegar** | Con el foco en el campo, ⌘V / Ctrl+V añade la captura que acabas de hacer | Sin guardarla en el escritorio para buscarla después |
| **Nada sale a medias** | El envío se detiene con fotos a medio subir o fallidas, y el resumen de errores lleva al archivo | Nadie guarda un expediente creyendo que lleva la radiografía que no subió |

**Decisiones del usuario del 2026-10-05:** (1) **A** es la forma por defecto; **C «Lo que falta»** (una casilla con nombre por documento esperado) y **B «Mesa de luz»** (miniaturas grandes) llegan en entregas siguientes con sus nombres reservados («Fuera de v0.1»); (2) la subida **empieza sola al añadir**; (3) enviar con subidas pendientes o fallidas **se bloquea**, con enlace desde el resumen; (4) **la página entera responde al arrastre**. **Semillas descartadas por kiwi** (r02, sin reserva de nombres): la pila que se abre en abanico al pasar el puntero (esconde los nombres en reposo, mueve piezas bajo el puntero) y la zona circular que «absorbe» el archivo (forma por la forma). El reparto automático de C ocurre **solo al soltar en el grupo**, se anuncia y se cambia con un gesto (L17; se contrata con C).

## Cuándo usarlo (frontera)

| Necesidad | Usar | Relación |
| --- | --- | --- |
| Adjuntar uno o varios archivos a un formulario | **`GFileField`** | — |
| Un `<input type="file">` suelto sin lista, sin quitar, sin validar | El nativo (`GInput` no lo envuelve) | Cada selección reemplaza a la anterior, no se puede quitar uno, el texto lo pone el navegador |
| Varios documentos **distintos** con nombre («INE frente», «INE reverso», «Comprobante») | Hoy, un `GFileField` por documento en una `GFormRow` o en su `GFormLayout`; **C** (`expected`, reservado, #378) cuando llegue | No una ayuda en texto sobre un solo campo |
| Galería de fotos donde comprobar la imagen es la tarea | Hoy, `GFileField` (miniatura pequeña); **B** (`appearance="gallery"`, reservado) cuando llegue | — |
| Cada archivo, su nombre, tamaño, miniatura y estado | `GSummary` **por dentro** (#375) | La ficha no lleva acciones dentro: «Quitar» y «Reintentar» van al lado |
| Progreso de subida | `GProgress` **por dentro**, sin fila de texto (`showLabel: false`, #375) | Es la semántica; la pintura es la ficha |
| Fallo de un archivo | **En su ficha** (mensaje, «Reintentar») y en la región viva del campo | **No** `GToast` ni la isla de estado (como el error de carga de `GCombobox`); la aplicación puede publicar además una condición de página en la isla («Sin conexión: 3 archivos esperan») |
| Dentro de `GInputGroup` o de `GFieldGroup` | No admitido en v0.1 (aviso 8, #378) | El error propio no llegaría al envío (un grupo resuelve una pregunta) |
| Dentro de `GAdaptiveLayout` (#361) | Como cualquier campo; si hace falta, `g-adapt-wide` en su raíz (#364) | Perfil propio, no en v0.1 |

---

## Entrega y empaquetado (#367)

```js
import FileField, { GFileField, formatFileSize } from '@grana/vue/file-field'
app.use(FileField)            // registra <g-file-field>; o: components: { GFileField }
```

- **Entrada propia `@grana/vue/file-field`** (`dist/file-field.js` y `dist/file-field.umd.js`, global UMD **`GranaFileField`**, requiere `Vue` y `Grana`). `@grana/vue` **no** lo exporta ni lo registra. Exporta `GFileField`, la utilidad **`formatFileSize(bytes, locale?)`** (la misma con la que el campo escribe tamaños y límites, para que la aplicación escriba su `hint` igual, kiwi L9) y, por defecto, un plugin que registra `GFileField`. Sin gestor: no es un servicio.
- **Por qué ya** (criterio de #238, #328 y #337, lección de #317 → #328): cola de subida, adaptador, arrastre de página, vista previa y anuncios; kiwi estima **7 a 10 KB gzip** y el tope para entrar en el principal es 8 KB. No todos los formularios adjuntan archivos. Bruno **mide y anota** el peso en `GFileField.meta.json`; el resultado no cambia la decisión.
- **Lo compartido llega por `__shared`** (#240) **sin duplicarse**: `GSummary`, `GProgress`, `GBtn`, `GAvatar` (vía `GSummary`), `GIcon` y `GLibIcon`, `utils/liveRegion.js`, `utils/topModal.js`, `utils/template.js`, `utils/oneOf.js` y **`useFormField` con las claves de contexto** (`formKey`, `sectionKey`, `fieldGroupKey`, `layoutKey` y la interna `revealKey`): una copia propia de `formContext.js` crearía **otro `Symbol`** y el campo no vería su `GForm`. Bruno añade a `src/shared.js` lo que falte (hoy faltan `useFormField` y `revealKey`) y lo comprueba como en `combobox.test.js`.
- **El módulo de arrastre de página** (`utils/fileDrag.js`, interno, #373) vive en la entrada `file-field` (solo lo usan los campos de archivos).
- **El CSS sigue en `grana.css`** (`GFileField.css`, registrado en `components.css`; inerte sin su marcado).
- **Pruebas:** `@grana/vue/testing` gana **`createSimulatedUploader(options)`** (el adaptador simulado de kiwi, `engine.js`, sin red: progreso por pasos, fallo al primer intento, lento, sin conexión, `AbortError` al cancelar). Sus opciones y controles los fija bruno en el `meta.json`; no son contrato del adaptador.
- **Compuertas:** `grep -q "g-file-field__chip" packages/vue/dist/grana.css`, `! grep -q "GFileField" packages/vue/dist/grana.js`, `test -f packages/vue/dist/file-field.js`, `! grep -q "g-summary__" packages/vue/dist/file-field.js` (la ficha llega por `__shared`). Siguen las de #337 y #350.

---

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | Array | entradas (ver «Modelo») | `undefined` (sin `v-model`, el campo guarda su lista) | compartida |
| `accept` | String | sintaxis del atributo nativo (`.pdf,image/*`) | sin valor (todo) | propia (nombre de HTML) |
| `multiple` | Boolean | | `false` | propia (nombre de HTML) |
| `max` | Number | entero ≥ 1 (solo con `multiple`) | sin valor (sin límite) | propia |
| `maxSize` | Number | bytes, > 0 | sin valor (sin límite) | propia |
| `uploader` | Function | `(file, { signal, progress }) => Promise<{ value, url? }>` | sin valor (sin subida: envío nativo) | propia (#369) |
| `concurrency` | Number | entero ≥ 1 | `2` | propia |
| `locale` | String | etiqueta BCP 47 | sin valor (cadena de `GNumberField`) | compartida (`api.md`) |
| `labels` | Object | ver «Textos» | `{}` | compartida (nombre) |
| `name` | String | | sin valor | propia |
| `label` | String | texto libre | sin valor | propia |
| `hint` | String | texto libre | sin valor | propia |
| `error` | String | texto libre | sin valor | propia (form.md C4) |
| `warning` | String | texto libre | sin valor | propia (form.md C5) |
| `valid` | String | texto libre | sin valor | propia (form.md C5) |
| `required` | Boolean | | `false` | propia |
| `mark` | Boolean | | `undefined` | propia (form.md §2) |
| `readonly` | Boolean | | `undefined` → `false` | compartida |
| `disabled` | Boolean | | `undefined` → `false` | compartida |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | compartida (la altura de la caja vacía, como `GInput`) |
| `variant` | String | `outline` `soft` | `outline` | compartida (subconjunto, como `GInput`) |
| `density` | String | `default` `comfortable` `compact` | `undefined` → contexto o `default` | compartida |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor (`sm`) | compartida |
| `block` | Boolean | | `undefined` → `false` (dentro del layout, `true`) | compartida |
| `id` | String | | generado | propia |

**No existen** (#378): `appearance` (reservado para B, `gallery`), `expected` (reservado para C), `color` (el foco usa `--g-color-focus`; reservado), `capture` como prop (como **atributo** llega al `<input>` y abre la cámara en móvil, nativo, sin interfaz propia), `validate` (validación propia de la aplicación: reservada), `autoUpload` (la subida empieza al añadir, decisión del usuario 2; «subir al enviar» queda fuera), `placeholder`, `prefix`, `suffix`, `output`, `clearable`, `loading` (el estado de subida es por archivo), `directory`/`webkitdirectory` (carpetas: reservado), `minSize` (un archivo vacío se rechaza siempre).

### Reglas de props

- **`accept`:** la misma cadena va al atributo nativo (filtra el diálogo) **y** la comprueba el componente en las tres vías, por extensión (`.pdf`, sin mayúsculas) y por MIME (`application/pdf`, `image/*`): el diálogo filtra, pero arrastrar y pegar no. Un archivo sin MIME casa solo por extensión.
- **`multiple`:** con él, **cada gesto suma** a la lista (el nativo reemplazaría la selección anterior). Sin él, el campo admite **uno**: el archivo nuevo **reemplaza** al que había (si estaba subiendo, se cancela; si era un archivo guardado, sale de la lista) y se anuncia `labels.replaced`; de varios soltados o pegados entra el primero que pasa la validación y el resto se rechaza con motivo `count`.
- **`max`:** solo con `multiple` (sin él, se ignora con aviso 3: el máximo es 1). Cuentan **todas** las entradas, guardadas incluidas. Al llegar, el campo está **lleno** (ver «Estados»).
- **`maxSize`:** bytes. El tamaño se compara con `File.size`.
- **`uploader`:** ver «Adaptador». Con él, cada archivo añadido **empieza a subir solo** (decisión del usuario 2). Sin él, los archivos quedan en estado `ready` y viajan con el envío.
- **`concurrency`:** subidas a la vez (cola en el orden de la lista). Un valor < 1 avisa y usa `2`.
- **`locale`:** idioma de las cifras y tamaños (`Intl`). Resolución de `GNumberField` (`number-field.md` «Idioma»): la prop › el `lang` del ancestro más cercano › `navigator.language`; se lee al montar y al cambiar la prop.
- **`name`:** registra el campo en `GForm` (clave de `errors`) y nombra lo que se envía (ver «Envío»). **Sin `name` el campo no se registra** (como el resto de campos, `form.md` §2): no cuenta en el resumen ni **bloquea el envío** con subidas pendientes o fallidas (#372), y sin `uploader` no lleva los binarios. En la práctica, dentro de un `GForm`, **un `GFileField` con `uploader` necesita `name`**. No hay aviso de desarrollo para esto (un campo sin `name` es válido fuera de un formulario): lo cubre el README.
- **`required`:** marca según la convención de `GForm` y **`aria-required="true"`** en el `<input>`; **nunca `required` nativo** (#270, #334: los archivos guardados no están en el `<input>` y el nativo los daría por ausentes). El campo no valida la obligatoriedad: la decide la aplicación con `errors`, como en `GSelect`.
- **`readonly`:** lista visible y sin acciones; el `<input>` **sigue enfocable y en el envío** con `aria-disabled="true"`; no abre el diálogo, no admite soltar ni pegar (r01, 28; C7, #165, #266). **`disabled`:** `disabled` nativo en el `<input type="file">` y en los ocultos (fuera del Tab y del envío), lista atenuada, sin acciones, no despierta al arrastrar.
- **`size`, `density`, `variant`, `rounded`, `block`:** los de `GInput`, con el mismo sentido: la **caja vacía** mide lo que la caja de un `GInput` del mismo `size` y `density` (L18). Con fichas, la caja crece hacia abajo lo que pidan sus líneas (ver «Disposición»).
- **`label`, `hint`, `error`, `warning`, `valid`, `mark`, `id`:** los de un campo (`form.md` §2); `hint` es texto de la aplicación («PDF o imagen · hasta 5 MB»): Grana no describe `accept` ni el límite (para escribirlo con el mismo formato, `formatFileSize`).
- **Atributos** (`form`, `capture`, `aria-*`, `data-*`, escuchas no declaradas): al `<input type="file">`; `class` y `style`, a la raíz. `form` se copia a los ocultos. `type`, `accept`, `multiple`, `name`, `required`, `disabled`, `id`, `aria-describedby`, `aria-labelledby`, `aria-disabled` y `aria-required` los pone el componente y **ganan**; un `aria-describedby` del consumidor se **añade al final** de la descripción; `aria-invalid` se ignora con aviso 7 (no admitido en el rol del control, #374).

---

## Modelo (#368)

`v-model` es un **arreglo de entradas**, una por archivo de la lista, en el orden en que se ve:

```js
[
  { key: 'doc-118', name: 'Receta médica.pdf', size: 220000, type: 'application/pdf', state: 'done', value: 'doc-118', url: null, error: null, file: null },   // guardado (edición)
  { key: 'f3', name: 'lesion-frontal.png', size: 48211, type: 'image/png', state: 'uploading', value: null, url: null, error: null, file: File },
  { key: 'f4', name: 'radiografia.png', size: 51022, type: 'image/png', state: 'error', value: null, url: null, error: 'Se interrumpió la conexión', file: File }
]
```

| Campo | Tipo | Qué |
| --- | --- | --- |
| `key` | String | Identidad estable y **única** en la lista. La pone el componente en los archivos que se añaden; la aplicación, en los guardados. Nunca se usa para construir un `id` del DOM (los ids son internos, #374) |
| `name` | String | Nombre del archivo (el de `File.name`; en los guardados, el que da la aplicación) |
| `size` | Number | Bytes |
| `type` | String | MIME (puede ser `''`) |
| `state` | String | `ready` · `queued` · `uploading` · `done` · `error` (abajo) |
| `value` | String \| Number \| null | Lo que identifica al archivo en el servidor: lo que resolvió el adaptador, o el de la aplicación en los guardados. Es lo que se envía |
| `url` | String \| null | Miniatura o enlace del servidor (guardados, o lo que resolvió el adaptador). La URL de objeto propia del componente **no** está en el modelo |
| `error` | String \| null | Mensaje del fallo de subida (de la aplicación o `labels.uploadFailed`) |
| `file` | `File` \| null | El archivo. `null` en los **guardados** |

| `state` | Cuándo | Se envía |
| --- | --- | --- |
| `ready` | Sin `uploader`: añadido, esperando al envío | El binario, en el `<input type="file">` |
| `queued` | Con `uploader`: en cola | No (bloquea el envío de `GForm`) |
| `uploading` | Con `uploader`: subiendo | No (bloquea) |
| `done` | Subido (`value` del adaptador) **o guardado** (sin `file`) | `value`, en un oculto |
| `error` | El adaptador rechazó | No (bloquea) |

**Reglas:**

- **Guardados:** una entrada **sin `file`** es un archivo que ya está en el servidor: su `state` es `done` (si falta, se toma `done`; cualquier otro avisa y se toma `done`) y necesita `value` (sin él avisa: no se puede enviar). Nunca se suben ni se cuentan como duplicados.
- **El progreso no está en el modelo** (r01, 14): el componente lo lleva por dentro y lo pinta. `update:modelValue` se emite al cambiar la lista o el `state`/`value`/`url`/`error` de una entrada, **nunca en cada tic** de progreso.
- **Fuente de verdad (#368).** Con `v-model`, la lista es **la de la aplicación**; el componente guarda por `key` solo lo que no está en el modelo (progreso, `AbortController`, URL de objeto, si la ficha ya aterrizó). Sin `v-model` (`modelValue` `undefined`), el componente guarda la lista y la emite igual. Al cambiar `modelValue`, se concilia **por `key`**:
  - una `key` que **desaparece** = quitada por la aplicación: se cancela su subida (`signal`) y se revoca su URL, en silencio;
  - una `key` **nueva** se toma tal cual (es dato de la aplicación: **no** se valida contra `accept`, `maxSize` ni `max`); con `file` y `state` `queued`, `uploading` o sin `state`, y con `uploader`, **entra en la cola**; con `file` y sin `uploader`, es `ready`;
  - **el estado de subida de una entrada que el componente está gestionando es del componente**: si la aplicación devuelve otro `state`, `value` o `error` para esa `key` mientras está en `queued` o `uploading`, gana el del componente (aviso 5). Una entrada en `error` o `done` sí la puede cambiar la aplicación.
- **Al montar** (también tras un desmontaje con subidas a medias), las entradas con `file` en `queued` o `uploading` **vuelven a la cola** desde cero; las `error` se quedan en `error`.
- **Al desmontar,** las subidas en curso se **cancelan** (`signal`) y las URL de objeto se revocan; no se emite nada. La aplicación conserva su último modelo (README: un `v-if` que desmonta a media subida deja entradas `uploading` que reanudarán al volver a montar).
- **Duplicado:** mismo `name`, `size` y `file.lastModified` que una entrada con `file`.
- **El `<input type="file">` lleva siempre los `File` de la lista** (se reescribe `input.files` con un `DataTransfer` tras cada cambio, r01, 3): quitar un archivo lo saca de `FormData`; lo rechazado nunca entra. **Una selección vacía no borra** (cancelar el diálogo; algunos navegadores disparan `change` con cero archivos).

## Adaptador y subida (#369; decisión del usuario 2)

```ts
type Uploader = (file: File, ctx: {
  signal: AbortSignal                          // se aborta al cancelar, al quitar, al reemplazar y al desmontar
  progress(loaded: number, total: number): void // bytes; se puede llamar cuantas veces se quiera
}) => Promise<{ value: string | number, url?: string }>
```

- **Grana define la interfaz; la aplicación la implementa** (`fetch`, XHR, S3 prefirmado, tus…) y **respeta `signal`**: es su responsabilidad, y así se documenta. Grana no hace red ni puede comprobar lo que el adaptador hace (`speech.md` §4, mismo patrón; sin `fetch`, `AGENTS.md`).
- **Empieza al añadir:** cada archivo aceptado entra en la cola (`queued`) y sube en cuanto haya hueco (`concurrency`), en el orden de la lista. El error aparece cuando la persona aún tiene el archivo a mano.
- **Resuelve** `{ value, url? }` → `done`, con `value` (y `url`, si la da) en la entrada. **Un `value` `null` o `undefined`** no se puede enviar: la entrada pasa a `error` con `labels.uploadFailed` y aviso 6 (nunca un `done` que no viaja).
- **Rechaza** con `{ message }` → `error` con ese texto (es de la aplicación); sin `message`, `labels.uploadFailed`. Un **`AbortError` que el componente no pidió** (la aplicación abortó por su cuenta) también es `error` con `labels.uploadFailed`: una entrada nunca se queda en `uploading`.
- **`progress`:** el componente lo pinta como mucho una vez por cuadro. `total` 0 o ausente: se usa `file.size`. El valor se recorta a `[0, total]`.
- **Sin reintentos automáticos** ni límite de tiempo en v0.1 (los pone el adaptador; «Reintentar» es de la persona). Sin conexión: el adaptador rechaza con su mensaje («Sin conexión»).
- **Cancelar es quitar** (r01, 22): aborta (`signal`) y saca el archivo.

## Añadir y validar (#370)

**Tres vías, ninguna exclusiva** (WCAG 2.5.7): **elegir** (diálogo del sistema; en móvil, la hoja con cámara, fotos y archivos), **arrastrar y soltar** sobre el destino del campo (#373) y **pegar** (⌘V / Ctrl+V con el foco en el control: una captura, un archivo copiado). Arrastrar nunca es la única vía.

**Validación al añadir, en este orden, por archivo:** tipo (`accept`) › vacío (0 bytes) › tamaño (`maxSize`) › duplicado › número (`max`; entran los primeros que caben). **Lo rechazado no entra** en el modelo ni en el envío. Motivos: `type`, `empty`, `size`, `duplicate`, `count`.

- **Aviso de no añadidos, uno por gesto** (r01, 10): `role="group"` con nombre `labels.notAdded`; cada archivo con su motivo en texto (`labels.reasons.*`: «enorme.png: pesa 9 MB, el máximo es 8 MB»); icono `triangle-alert`. **No desaparece solo** (WCAG 2.2.1); «Descartar» (`labels.dismiss`) lo quita y devuelve el foco al control; el siguiente gesto lo sustituye (también uno sin rechazos, que lo retira).
- **Tamaños** (L9): `formatFileSize` = `Intl.NumberFormat(locale, { style: 'unit', unitDisplay: 'short' })` con unidades **decimales** (byte, kilobyte, megabyte, gigabyte; como Finder, iOS y Android), una cifra decimal por debajo de 10. El tamaño de la ficha, el `{size}` y el `{limit}` del aviso y el `hint` que escriba la aplicación usan la misma función.
- **Lleno** (`max` alcanzado): elegir no abre el diálogo; soltar no se admite (destino `labels.dropFull`); pegar valida y rechaza con `count` (el aviso lo explica).

## Envío (#371)

| Caso | `<input type="file">` | Ocultos `<input type="hidden" name>` |
| --- | --- | --- |
| **Sin `uploader`** | **Con `name`**: lleva los binarios (`ready`) | Uno por **guardado** (`done` sin `file`) con su `value` |
| **Con `uploader`** | **Sin `name`** (no se envían binarios) | Uno por entrada **`done`** (subidas y guardados) con su `value` |
| `readonly` | Igual que su caso (sigue en el envío) | Igual |
| `disabled` (propio o heredado) | `disabled` | `disabled` |

- Con `uploader`, las entradas `queued`, `uploading` y `error` **no se envían** (y bloquean el envío de `GForm`, #372). Sin `uploader`, todo lo de la lista viaja (kiwi midió `FormData` con el `File` y cinco ocultos con el `value` del servidor).
- **Sin `uploader` con guardados:** el mismo `name` lleva partes de archivo (nuevas) y partes de texto (guardadas). El servidor las distingue por el tipo de parte; quitar un guardado es que su `value` ya no llega (README).
- **Fuera de `GForm`** (un `<form>` nativo sin `novalidate`): el `<input type="file">` lleva **`setCustomValidity`** con el mismo mensaje del error propio (#372; `''` sin él), así un envío nativo o `form.checkValidity()` tampoco salen con subidas a medias. Dentro de `GForm` (`novalidate`) no interfiere.

## Envío bloqueado: el error propio del campo (#372; decisión del usuario 3; L7)

El campo **bloquea el envío de `GForm` por sí mismo**, sin que la aplicación lo ponga en `errors`, y **solo al enviar**: añadir un archivo nunca pinta un error.

**Cuándo hay error propio:** con `uploader`, si alguna entrada está en `error` → **`labels.failed`** (`{count}` de fallidas, `{name}` de la primera); si no, si alguna está en `queued` o `uploading` → **`labels.pending`** (`{count}`, `{name}`). Sin ninguna, no hay. Sin `uploader`, nunca. **Sin `labels.failed` o `labels.pending`** (que el aviso 2 ya señala al montar), el campo **bloquea igual**: el error propio es **un espacio** (` `), no `''`, porque `''` significa «sin error» y desbloquearía el envío. El resumen y el pie mostrarían un mensaje en blanco; por eso el aviso es al montar y no al necesitarse.

**Cómo entra en `GForm`** (cambio interno de `formContext.js`; `form.md` §2 «Error propio del componente»):

| Pieza | Regla |
| --- | --- |
| `useFormField` | Dos **opciones internas** nuevas (no contractuales para campos del consumidor en v0.1, como `markRule`): **`ownError`** (getter → String; `''` = sin error) y **`ownTarget`** (getter → elemento enfocable del error propio). El registro gana `ownError` y `ownTarget` |
| Precedencia | Error resuelto del registro = **prop `error` con texto** › **error propio** › `errors[name]`. La prop con texto es de la aplicación y siempre gana (#158); el error propio describe un hecho que solo el campo conoce y gana a un `errors[name]` calculado sin él. **Una prop `error=""` explícita no oculta el error propio** (si lo hiciera, el envío se bloquearía sin pintar nada: nunca sale nada a medias), **pero sí sigue ocultando `errors[name]`** (#158). Con el error propio revelado y `error=""`, gana el propio |
| `GForm` · `blocking()` | Usa la precedencia de arriba. Con el error propio ganando, el `id` del elemento es el de **`ownTarget()`** (abajo); así el resumen enlaza **al archivo** |
| Visibilidad | `GForm` guarda un conjunto interno de nombres con el error propio **revelado**: entran en el paso 3 de «Envío» y en `showErrors()` (`revealAll`), **y solo ahí** (ni `blur`, ni `change`, ni `notifyChange`); salen cuando su `ownError()` pasa a `''` (como un error corregido, #162: el siguiente espera a otro envío) y con `reset`/`resetState()`. `useFormField` pinta el error propio solo si está revelado |
| `focusFirstError()` / `visibleTarget()` | Con el error propio visible, el destino es `ownTarget()` |
| `is-rejected` | Como cualquier error que bloquea (#304); la sacudida es de la caja (`g-reject-file-field…`) |
| Fuera de `GForm` | El error propio nunca se pinta (no hay envío que revelar); queda `setCustomValidity` (#371) |
| Inactivo (`GFormReveal` cerrado, `addable` sin agregar) | Como todo registro inactivo (#276, #288): no bloquea. Las subidas siguen dentro de un bloque cerrado (no se desmonta) |
| `formnovalidate` («Guardar borrador») | `GForm` no comprueba nada (§1 paso 2): el borrador sale **sin** lo pendiente ni lo fallido. Es la semántica del atributo; README |

**Destino del enlace y del foco (`ownTarget`):** con alguna entrada en `error`, el botón **«Reintentar {nombre}»** de la **primera** fallida en orden de la lista (su `aria-describedby` es el mensaje del fallo: quien llega oye qué pasó y puede reintentar); con solo pendientes, el **`<input type="file">`** (su descripción dice «2 de 5 · 1 subiendo»; enfocar un «Cancelar subida» invitaría a cancelar con Intro).

**Nunca se envía solo** al terminar las subidas (WCAG 3.2.2): cuando lo pendiente termina, el error propio desaparece en silencio y la persona vuelve a enviar.

---

## Estructura accesible (#374)

```html
<div class="g-file-field g-file-field--size-md g-file-field--variant-outline g-file-field--density-default
            [is-ready] [has-files] [is-multiple] [is-full] [is-readonly] [is-disabled] [is-invalid] [is-rejected]
            [is-awake is-awake-ok | is-awake is-awake-no] [is-over]">
  <label class="g-file-field__label" id="ID-label" for="ID">Fotos de la lesión{ (opcional)| *}</label>
  <div class="g-file-field__box">                                                   <!-- un clic fuera de fichas y botones llama a input.click() -->
    <ul class="g-file-field__list" role="list" aria-label="Archivos de Fotos de la lesión">   <!-- solo con archivos; labels.list; role="list" explícito: VoiceOver deja de anunciar como lista un <ul> sin viñetas -->
      <li class="g-file-field__chip [is-landing]" data-state="uploading" [data-stored]>
        <span class="g-summary g-summary--layout-inline g-summary--size-xs">…</span>  <!-- nombre, tamaño, miniatura o icono; en error, el mensaje -->
        <div class="g-progress g-progress--size-sm g-file-field__progress">…role="progressbar"…</div>   <!-- queued/uploading; showLabel: false y showValue: false: sin g-progress__row -->
        <span class="g-file-field__error" id="ID-e3-error" hidden>Error: Se interrumpió la conexión</span>   <!-- solo en error -->
        <button class="g-btn … g-file-field__retry" id="ID-e3-retry" aria-label="Reintentar radiografia.png" aria-describedby="ID-e3-error">[GIcon rotate-ccw]</button>   <!-- solo en error -->
        <button class="g-btn … g-file-field__remove" aria-label="Quitar lesion-frontal.png | Cancelar subida de lesion-frontal.png">[GIcon x]</button>
      </li>
    </ul>
    <span class="g-file-field__add">
      <input class="g-file-field__input" type="file" id="ID" [name] accept multiple
             aria-labelledby="ID-label ID-action" aria-describedby="ID-hint ID-status [ID-message]"
             [aria-required="true"] [aria-disabled="true"] [disabled]>                  <!-- EL control: texto oculto accesible, enfocable -->
      <span class="g-file-field__add-icon" aria-hidden="true">[GIcon plus | lock | check]</span>
      <span class="g-file-field__action" id="ID-action">Adjuntar archivos</span>
      <span class="g-file-field__add-hint" aria-hidden="true">Imagen · hasta 8 MB · máximo 5</span>   <!-- solo vacío y editable -->
    </span>
    <div class="g-file-field__target" aria-hidden="true"><span class="g-file-field__target-text">Soltar aquí · …</span></div>   <!-- destino; solo pintura -->
  </div>
  <div class="g-file-field__foot">
    <p class="g-file-field__meta"><span class="g-file-field__hint" id="ID-hint">…</span> <span class="g-file-field__status" id="ID-status">2 de 5 · 1 subiendo</span></p>
    <div class="g-file-field__notice" role="group" aria-label="Archivos no añadidos">[GIcon triangle-alert]<ul class="g-file-field__notice-list">…</ul>[GBtn Descartar]</div>
    <div class="g-file-field__message" id="ID-message" aria-live="polite">…prefijo oculto, icono, texto…</div>  <!-- siempre presente -->
    <input type="hidden" name="fotos" value="srv-a81f2c">                                 <!-- por entrada que se envía (#371) -->
  </div>
  <div class="g-file-field__live" role="status" aria-live="polite" aria-atomic="true"></div>   <!-- fuera de flujo; existe desde el montaje -->
</div>
```

- **Tres hijos en flujo** (etiqueta · caja · pie), como `GInput` (L18): comparte línea en una `GFormRow` (`form.md` §2, C12). Destino y región viva quedan fuera de flujo. **No compone `GInput`** (kiwi r01: su caja no es un texto); repite su anatomía y sus mínimos.
- **El control** (r01, 1 y 2): el `<input type="file">` real con el **patrón de texto oculto accesible** (una de las tres excepciones literales), **enfocable**; su foco se pinta en la caja (`:has(.g-file-field__input:focus-visible)`). La caja no es un segundo control: sin rol ni `tabindex`. Espacio (e Intro donde el navegador lo admite) abre el diálogo nativo. El control **es el que se envía**: el foco al primer inválido, el desplazamiento y el envío nativo coinciden.
- **Nombre:** `aria-labelledby="ID-label ID-action"` = la etiqueta del campo **y** el texto de la cara («Fotos de la lesión Adjuntar archivos»): los dos textos visibles del control están en su nombre (WCAG 2.5.3; cambio sobre r01, que lo llamaba solo por la etiqueta: **medirlo**). Sin `label` (ni slot), el `aria-label` o `aria-labelledby` del consumidor sustituye a `ID-label` (regla de `GNumberField`, #311).
- **Descripción, no `aria-invalid`** (r01, 5; L10): `aria-invalid` no está admitido en el rol `button` que exponen los navegadores para `input[type=file]`. `aria-describedby` = pista + estado + mensaje (el mensaje con su prefijo oculto `labels.error` de `GForm`) + los ids del consumidor. La raíz lleva `is-invalid` para la pintura.
- **`aria-disabled="true"`** en lleno, solo lectura y deshabilitado por contexto sin `disabled` nativo; nunca `disabled` para lleno ni solo lectura (sacaría los archivos del Tab y del envío, r01, 11).
- **Estado en la descripción** (r01, 25): `ID-status` (`labels.status`) dice cuántos hay y qué pasa («2 de 5 · 1 subiendo · 1 con error»). **No es región viva**: quien vuelve al campo lo oye sin que nada se haya anunciado.
- **Lista:** `<ul>` con nombre `labels.list` (`{label}`), solo con archivos. Cada ficha (`<li>`) lleva una `GSummary` (sin rol: es contenido) y, al lado, sus acciones (#375).
- **Ids internos** por entrada (`ID-e{n}`), nunca derivados de `key` (una `key` de la aplicación puede llevar espacios o repetirse entre campos).
- **Región viva propia** (`g-file-field__live`, cortés, `aria-atomic`), vacía desde el montaje, escrita con `createLiveWriter` (`utils/liveRegion.js`). **Si un `<dialog>` modal tapa el campo** (página inerte, `utils/topModal.js`), el anuncio se escribe en una región propia que el campo monta dentro de ese modal mientras exista (traslado al modal, como `GToaster`): un fallo de subida que llega con un diálogo abierto se oye.

### Foco (r01, 21; #374)

| Gesto | El foco va a |
| --- | --- |
| Quitar / Cancelar subida | El «Quitar» de la **siguiente** ficha; si no hay, de la **anterior**; si no queda ninguna, al **control**. Nunca al `body` |
| Reintentar | Al botón de la **misma** ficha, que pasa a «Cancelar subida de {nombre}» |
| Descartar el aviso | Al control |
| Elegir en el diálogo | Al control (nativo) |
| Enlace del resumen / primer inválido con error propio | `ownTarget` (#372) |

### Anuncios (región viva cortés; WCAG 4.1.3; r01, 24)

| Suceso | Un anuncio | Textos |
| --- | --- | --- |
| **Gesto de añadir** (elegir, soltar, pegar, `add()`) | Lo añadido y lo rechazado **juntos**, más «Subiendo» si hay adaptador | `added` / `addedMany` / `replaced` + `rejected` / `rejectedMany` + `uploading` |
| **Fallo** de un archivo | Cada uno | `uploadError` |
| **Cierre de lote** (todo lo añadido en un tramo terminó) | Uno, no uno por archivo | `uploaded` / `uploadedMany` |
| Quitar | | `removed` (con lo que queda) |
| Cancelar | | `canceled` (con lo que queda) |
| Reintentar | | `retrying` |

**No se anuncia:** cada tic de progreso, el estado al enfocar (está en la descripción), despertar o dormir los destinos, el error propio al enviar (lo anuncia el resumen; si no hay resumen, el foco llega al destino con su descripción).

### Mínimos (no son tema)

| Mínimo | Cómo se cumple |
| --- | --- |
| Área táctil ≥ 24px (≥ 44px con `pointer: coarse`) | La caja entera es el objetivo del control (≥ el alto de `GInput`, piso 24px; 44px táctil). «Quitar» y «Reintentar» ≥ 24px (44px táctil): la ficha mide **al menos** lo que sus botones y la caja crece por líneas si hace falta (L23, resuelto por coco en `fc3bf9c`: `GBtn` de solo icono ya no encoge en un flex) |
| Texto ≥ 12px | El rol más pequeño es `caption` (pie) |
| Contraste ≥ 4.5:1 (texto), 3:1 (controles y gráficos) | Texto de la cara, pista, estado, nombre y mensaje del fallo; **el avance de la ficha** se lee por un borde de `--g-color-on-accent-soft` ≥ 3:1 (WCAG 1.4.11; medido ≥ 4,51:1 contra el relleno y ≥ 4,74:1 contra la ficha en los once temas; `accent` no llegaba a 3:1 en claro, #379), no solo por el relleno suave (#375). Texto de la cara en `soft`: `on-accent-soft` (≥ 4,74:1; `accent-text` sobre `surface-sunken` bajaba a 4,19:1) |
| Foco siempre visible | Anillo en la caja con el control enfocado; anillo propio de cada `GBtn` |
| No solo color | Error: mensaje en la ficha + «Reintentar»; subida: la forma del relleno + el estado; destino que no admite: texto y borde discontinuo (`border-control` ≥ 3:1); completado: filo + estado del pie |

---

## La ficha de cada archivo (#375)

Una **`GSummary` `layout="inline"` `size="xs"`** (`summary.md`) más acciones y progreso, todo dentro del `<li class="g-file-field__chip">`. La ficha **no lleva interactivos dentro** de la `GSummary`.

| Dato de la entrada | Prop de `GSummary` | Regla |
| --- | --- | --- |
| `name` | `title` | Siempre. Recortado con elipsis y `title` nativo (regla de la ficha): **la ficha recortada no es la única fuente** del nombre (está entero en el árbol y en los nombres de «Quitar» y «Reintentar») |
| `size` | `subtitle` = `formatFileSize(size)` | Cede antes que el nombre (regla de `inline`) |
| Miniatura | `avatar: { src, shape: 'square', icon: 'image' }` | Solo imágenes que el navegador pinta (PNG, JPG, GIF, WebP, AVIF, BMP, SVG) con una **URL de objeto propia** que se revoca al quitar y al desmontar; en los guardados, `url`. Decorativa (`aria-hidden`). Si la imagen no carga, `GAvatar` cae a `image` |
| Sin miniatura | `icon: 'image'` (imagen que no se pinta: HEIC…) o `'file-text'` (el resto) | Iconos de la librería (#377) |
| `state` `queued` | `status: { label: labels.queued }` | En `inline` el estado solo lo recibe el lector |
| `state` `done` subido en esta sesión | `status: { label: labels.done }` | Ídem. Los **guardados** no llevan estado |
| `state` `error` | `facts: [{ label: labels.error, value: error, bare: true }]` | El mensaje **se ve** en la ficha (el tamaño pasa al lector, regla de `inline`); `bare` deja callar el rótulo si aprieta |

- **Acciones al lado** (r01, 20): **«Reintentar {nombre}»** (`GBtn` de solo icono `rotate-ccw`, `labels.retry`, `aria-describedby` = el `g-file-field__error` oculto con `labels.error` + el mensaje) solo en `error`, y **un mismo botón** en el mismo sitio que dice **«Quitar {nombre}»** (`labels.remove`) o **«Cancelar subida de {nombre}»** (`labels.cancel`, en `queued` y `uploading`), icono `x`. Variante `ghost`, `color="neutral"`, `size="xs"`; ≥ 24px (44px táctil). Ninguna en solo lectura ni deshabilitado.
- **Progreso: `GProgress` dentro de la ficha** en `queued` y `uploading` (L13, L20): `class="g-file-field__progress"`, `size="sm"`, `color="accent"`, **`showLabel: false`** y **`showValue: false`** (sin fila de texto: prop nueva de `GProgress`, `widget.md`), `label` = `labels.progress` (`{name}`, nombre accesible de la barra), `valueText` = `labels.progressText` (`{percent}`, `{loaded}`, `{total}`, formateados con `Intl`) y, en cola, `labels.queued` con `value` 0. `GProgress` pasa `$attrs` a su **raíz** (`g-progress`; `widget.md`) para que llegue `g-file-field__progress`. **La ficha es la barra:** coco coloca el `GProgress` como **capa** de la ficha (detrás del contenido, sin puntero, sin alto propio) y pinta su relleno como el relleno de la ficha; el avance usa el `translate` del relleno de `GProgress` (sin layout; espejo en RTL por `GProgress`). Así la semántica (`role="progressbar"` con `aria-valuenow` y `aria-valuetext`) **es** lo que se ve, sin una barra oculta duplicada.
- **Altos:** **Δ0 de la ficha** entre `queued`, `uploading`, `done` y `error` (kiwi lo midió en los tres motores). La ficha mide lo mismo en todos los estados.

## Disposición (concepto A; L18)

- **Caja vacía** = la caja de un `GInput` del mismo `size` y `density` (mismo alias de alto, derivado de `--g-space-1`; piso 24px, 44px táctil): borde, radio, fondo y foco de la familia de los campos.
- **Con archivos:** las fichas fluyen **en línea** dentro de la caja (salto de línea al llenarse) y la última pieza es «Adjuntar»; la caja crece **hacia abajo** por líneas; nada de encima se mueve. Cada línea de fichas mide al menos lo que sus botones (24px; 44px táctil): en `xs`, `sm` o `compact` la caja con fichas puede ser más alta que la de un `GInput` vecino, **con la parte superior alineada** (pista 2 de la fila, `align-self: start`).
- **«Adjuntar»** muestra el texto de la cara (`ID-action`): vacío y editable, `labels.add` (sin `multiple`) o `labels.addMany`; con archivos, `labels.addMore` (con `multiple`) o `labels.change` (sin él); lleno, `labels.full` (`{count}`, `{max}`); solo lectura, `labels.readonly` (o `labels.none` sin archivos). Vacío y editable, la **pista** se ve a su lado (copia `aria-hidden`; la de `ID-hint` va al pie, oculta a la vista mientras está la copia y visible con archivos).
- **En una `GFormRow`:** admitido como hijo; tres pistas por `subgrid` como `GInput` (coco). Para que la fila se parta **antes** de que «Adjuntar» quede sin sitio, coco **mide** el ancho mínimo funcional de A (una ficha con el nombre en su suelo y «Quitar», y «Adjuntar archivo» entero, en `md`) y declara **`--g-form-min: 62`** (en `space`) sobre `.g-form-row > .g-file-field` (propiedad pública de entrada, `form.md` §4: el consumidor la sobrescribe), como `GCombobox` (`--g-form-min: 60`). **Medido** (`estilo.md`): borde 2 + relleno 6 + lista en su suelo 96 + separación 4 + «Adjuntar archivo» 137 = 245 px = `space × 61,3`; con 60 «Adjuntar archivo» bajaba de línea entre 552 y 536 px (#379). Depende de la fuente y del idioma de `labels.add`: el consumidor lo sube con `style`. Sin `setIntrinsicMin`.
- Fuera de una fila, el ancho es del consumidor; A funciona a cualquier ancho (las fichas se apilan; a 320px, sin desbordamiento ni en LTR ni en RTL, medido por kiwi).

## Arrastre de página y destino (#373; decisión del usuario 4; L11, L19)

**Módulo compartido** `utils/fileDrag.js` (interno, en la entrada `file-field`): **un** juego de escuchas en `document` (`dragenter`, `dragleave`, `dragover`, `drop`, `dragend`) que se instala con el **primer** campo montado y se retira con el **último** (cuenta de referencias); estado reactivo de solo lectura `{ dragging, types, count }` (solo arrastres con `Files` en `dataTransfer.types`; `types` son los MIME de `dataTransfer.items` de tipo archivo).

- **Protección siempre activa** (no es opción): mientras haya un campo montado, un `dragover` con archivos que nadie atendió (`!defaultPrevented`) recibe `preventDefault()` y `dropEffect = 'none'`, y un `drop` con archivos que nadie atendió recibe `preventDefault()`: el navegador **no** navega al archivo y la página no pierde lo escrito (r01, 13). Las escuchas van en fase de burbuja: un destino propio de la aplicación que llama a `preventDefault()` sigue funcionando.
- **Despertar:** con `dragging`, un campo **despierta** (`is-awake`) si **no** está en solo lectura ni deshabilitado, **no** está dentro de un subárbol `inert` (un `GFormReveal` cerrado, una sección plegada, la página bajo un modal), **está a la vista** (tiene cajas de layout) y, si hay un `<dialog>` modal abierto, **está dentro del superior** (`topModal.js`). Además lleva **`is-awake-ok`** si admite lo que se arrastra y no está lleno, o **`is-awake-no`** si no.
- **Tipos durante el arrastre** (`dragAccepts`, r01, 12): el navegador solo da el MIME (Safari a veces ni eso; nunca el nombre). Si `accept` lleva alguna extensión, o no hay tipos, **se da por bueno** y la decisión final es al soltar (con el aviso de no añadidos si toca); si no, cada MIME debe casar con `accept`.
- **El destino** (`g-file-field__target`, `aria-hidden`): capa encima de la caja, **más grande que ella** (kiwi medía `space × 2` por lado; **medido por coco y vigente: `space × 1`** por lado, acotado en línea por `column-gap × 0.375`, #379; con `space × 2` dos destinos vecinos se solapaban en `compact`), **solo pintura** (Δ0 de la caja y de lo que la sigue). Recibe el puntero **solo** con `is-awake-ok` (hace el blanco más fácil); en reposo no existe para el puntero. Textos: despierto y admite, `labels.drop` (`{hint}` = la prop `hint`); despierto y no admite, `labels.dropRejected`; lleno, `labels.dropFull`; **encima** (`is-over`, la raíz o el destino reciben `dragenter`), `labels.dropInto` (`{label}`) si admite o `labels.dropRejected` si no (`dropEffect = 'none'`: el navegador no entrega el `drop`).
- **Soltar en un campo** añade (vía `drop`) con la validación de siempre. **Al soltar en cualquier sitio, salir de la ventana o `dragend`**, todo se apaga.
- **Lo que no hace:** no hay zona fija; los destinos no anuncian nada (arrastrar es un gesto de puntero; las tres vías siguen); dos destinos vecinos de una `GFormRow` **no se solapan** (el sobresaliente en línea es `min(space × 1, column-gap × 0.375)`: `0,375` = densidad `compact` 0,75 / 2, así no depende de la densidad del campo; medido: 4 px por lado y 4 px entre vecinos en `compact`).

## Teclado

| Tecla | Dónde | Qué |
| --- | --- | --- |
| Tab / Mayús+Tab | Campo | Recorre, en orden del DOM, los botones de cada ficha («Reintentar», «Quitar») y después el **control**. Orden del DOM = orden visual (WCAG 1.3.2, 2.4.3) |
| Espacio (Intro donde el navegador lo admita) | Control | Abre el diálogo del sistema; en lleno o solo lectura, nada (`aria-disabled`) |
| ⌘V / Ctrl+V | Control | Pega archivos del portapapeles (si los hay; si no, nada) |
| Intro / Espacio | Botón de una ficha | Reintentar / Quitar / Cancelar subida |

Sin atajos propios: Retroceso o Supr en el control **no** quitan fichas (no es un campo de etiquetas; quitar es un botón con nombre). WebKit con los ajustes por defecto de Safari llega al control con **Opción+Tab**, como a cualquier botón (no es propio de este campo).

## Estados

Vacío · foco · con archivos · arrastre de página (despierto y admite / despierto y no admite / lleno) · encima (admite / no admite) · aviso de no añadidos · en cola · subiendo · subido · error con «Reintentar» · cancelado · lleno · uno solo que reemplaza · guardados con miniatura de la aplicación · solo lectura (con y sin archivos) · deshabilitado · error, advertencia y válido del campo · error propio tras enviar (pendiente / fallido) y resumen · `is-rejected` · envío nativo · 320px · RTL · reduced motion · `forced-colors` · tema oscuro.

---

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `Entry[]` (copias planas) | Cambia la lista o el `state`/`value`/`url`/`error` de una entrada; nunca por progreso |
| `change` | `{ added: Entry[], removed: Entry[], via }` | **Una vez por gesto** que cambia qué archivos hay, después de `update:modelValue`: `via` = `picker` · `drop` · `paste` · `api` (añadir; `removed` lleva el reemplazado sin `multiple`) · `remove` · `cancel`. No por cambios de estado de subida |
| `reject` | `{ items: [{ file, name, reason }], via }` | Un gesto con archivos rechazados (`reason` ∈ `type` `empty` `size` `duplicate` `count`), para que la aplicación registre o explique más (L4) |

- Todos en `emits` (lección de `emits`): el `@change` del consumidor recibe el objeto y **no** llega al `<input>` nativo (que dispararía con un `FileList`). Sin eventos de subida (`upload`, `uploaded`, `progress`): el modelo ya cambia de estado (L4); un evento de progreso queda reservado.
- **Para `GForm`** (`useFormField`, `trigger: 'change'`): añadir, quitar, cancelar y reemplazar llaman a **`notifyChange()`** (suben `dirty`, revelan el error de la aplicación y retiran `is-rejected`); los cambios de estado de subida no. Con `readonly` o `disabled` no se emite nada.

## Métodos expuestos (`defineExpose`)

| Método | Hace |
| --- | --- |
| `add(files)` | Añade un `FileList` o un arreglo de `File` con la validación, el aviso, los anuncios y los eventos de siempre (`via: 'api'`). Devuelve `{ added: Entry[], rejected: [{ file, name, reason }] }`. No hace nada en solo lectura ni deshabilitado. Para cámaras propias, otro destino de soltar o pruebas |
| `open()` | Abre el diálogo del sistema (`input.click()`), si no está lleno, en solo lectura ni deshabilitado. El navegador exige que se llame dentro de un gesto de la persona |
| `focus()` | Enfoca el control |

## Slots

| Slot | Propósito | Anatomía que debe conservar |
| --- | --- | --- |
| `label` | Etiqueta | Como `GInput` (dentro del `<label>`; `ID-label` sigue en el nombre) |
| `hint` | Pista | Dentro de `ID-hint` (sigue en la descripción); la copia de la caja repite su texto |
| `error` | Mensaje de error del campo | Como `GInput` (dentro de `ID-message`, tras el prefijo oculto) |

**Sin slots de ficha** en v0.1 (`item`, `lead`: reservados, #378): la ficha es la pieza que garantiza Δ0, el nombre completo en el árbol y los botones con nombre.

## Textos (`labels`, sin valores por defecto; #226)

Marcadores con `fill` (`utils/template.js`). Los **contados** admiten String con marcador o **Function** (plurales del idioma). Las cifras de `{count}`, `{max}` y `{limit}` de `count` se formatean con `Intl.NumberFormat(locale)`; los tamaños, con `formatFileSize`.

| Clave | Marcadores / firma | Dónde | Si falta |
| --- | --- | --- | --- |
| `add` · `addMany` | | Cara vacía (sin / con `multiple`) | Cara sin texto; aviso al montar |
| `addMore` · `change` | | Cara con archivos (con / sin `multiple`) | Ídem, al necesitarse |
| `full` | `{count}`, `{max}` · Function `(count, max)` | Cara llena («5 de 5») | Ídem, con `max` |
| `readonly` · `none` | | Cara en solo lectura con / sin archivos | Ídem, con `readonly` |
| `status` | Function `({ count, max, active, failed }) => String` (`active` = en cola + subiendo; `max` es `null` sin límite y `1` sin `multiple`) **o String** con `{count}`, `{max}`, `{active}`, `{failed}` (cifras con `Intl.NumberFormat(locale)`; `{max}` vacío sin límite) | `ID-status` (pie y descripción) | Sin estado; aviso al montar |
| `list` | `{label}` | Nombre de la lista | Lista sin nombre; aviso |
| `drop` | `{hint}` | Destino despierto que admite | Destino sin texto; aviso al primer arrastre |
| `dropInto` | `{label}` | Destino con el puntero encima | Usa `drop`; aviso |
| `dropRejected` | `{label}` | Destino que no admite (despierto o encima) | Destino sin texto; aviso |
| `dropFull` | `{label}` | Destino de un campo lleno | Usa `dropRejected`; aviso |
| `remove` · `cancel` · `retry` | `{name}` | Nombres de los botones de la ficha | **Aviso al montar**: un botón sin nombre no cumple 4.1.2 |
| `queued` · `done` | | Estado de la ficha (al lector) y `valueText` en cola | Sin estado; aviso al necesitarse |
| `error` | | Rótulo del mensaje de fallo en la ficha y prefijo de su descripción | Ídem |
| `progress` | `{name}` | Nombre de la barra de cada ficha | Barra sin nombre; aviso al necesitarse |
| `progressText` | `{percent}`, `{loaded}`, `{total}` | `aria-valuetext` de la barra | `GProgress` usa su porcentaje; sin aviso |
| `uploadFailed` | | Mensaje cuando el adaptador rechaza sin `message` (y `value` nulo, `AbortError` ajeno) | Mensaje vacío; aviso |
| `notAdded` · `dismiss` | | Nombre del aviso de no añadidos · su botón | Aviso al necesitarse |
| `reasons.type` · `reasons.empty` · `reasons.duplicate` | | Motivo en el aviso y en el anuncio | Ídem |
| `reasons.size` | `{size}`, `{limit}` | Ídem | Ídem |
| `reasons.count` | `{limit}` | Ídem | Ídem |
| `added` · `uploaded` · `retrying` | `{name}` | Anuncios | Sin ese anuncio; aviso al necesitarse |
| `addedMany` · `uploadedMany` · `uploading` | `{count}` · Function | Anuncios | Ídem |
| `replaced` | `{old}`, `{name}` | Anuncio de reemplazo (sin `multiple`) | Ídem |
| `rejected` | `{name}`, `{reason}` | Anuncio de un rechazo | Ídem |
| `rejectedMany` | `{count}`, `{list}` · Function `(items) => String` con `items: [{ file, name, reason, text }]` (`reason` = motivo de `reject`; `text` = el motivo ya escrito) | Anuncio de varios (`{list}` = «nombre, motivo» unidos con «; ») | Ídem |
| `uploadError` | `{name}`, `{message}` | Anuncio de un fallo | Ídem |
| `removed` · `canceled` | `{name}`, `{count}` (los que quedan) · Function `(count, name)` | Anuncios | Ídem |
| `pending` · `failed` | `{count}`, `{name}` · Function `(count, name)` | Error propio al enviar (#372) | **Aviso al montar con `uploader`**: sin ellos el bloqueo no tendría mensaje (bloquea igual, con un espacio como mensaje: `''` sería «sin error») |

---

**Firmas de las funciones** (todas devuelven String; un valor `null`/`undefined` se toma como `''`): `full(count, max)` · `removed(count, name)` y `canceled(count, name)` (`count` = los que quedan) · `pending(count, name)` y `failed(count, name)` (`name` = el primero) · `addedMany(count)` · `uploadedMany(count)` · `uploading(count)` · `rejectedMany(items)` · `status({ count, max, active, failed })`. `count` y `max` llegan **sin formatear** (la función los escribe con el plural de su idioma); en la forma String los formatea el componente.

**Texto que compone el componente** (lo único que no está entero en `labels`; la puntuación es de Grana, no del idioma, y por eso `labels` no la lleva):

| Dónde | Composición |
| --- | --- |
| Aviso de no añadidos (`g-file-field__notice-list`) | Por archivo: `<strong dir="auto">{nombre}</strong>` + `: ` + el motivo (`reasons.*`); sin motivo, solo el nombre. Los dos puntos los pone el componente |
| Descripción del fallo de una ficha (`g-file-field__error`, oculta, a la que apunta `aria-describedby` de «Reintentar») | `labels.error` + un espacio + el mensaje (`error` de la entrada); sin mensaje, solo `labels.error`. Si se quiere puntuación («Error:»), va dentro de `labels.error` |
| Anuncio de varios rechazos sin función | `labels.rejectedMany` con `{list}` = `nombre, motivo` unidos con `; ` |
| Anuncio de un gesto | Las partes (reemplazo o añadidos, rechazos, «subiendo») unidas con un espacio |
| «Descartar» del aviso | **Botón de solo icono** (`GBtn` `ghost` `neutral` `sm` con `x`): su nombre accesible es `labels.dismiss` (`aria-label`); no pinta texto. Sin `labels.dismiss`, aviso 2 |

## Movimiento (#376)

Con `prefers-reduced-motion: reduce` **nada se desplaza ni se escala** (§29.3); quedan los fundidos de color y opacidad. **Nada se anima al montar** (`is-ready`, como `GInput`).

| Pieza | Qué | Duración y curva |
| --- | --- | --- |
| La ficha **aterriza** | Al añadirse por un gesto (no al montar, no al conciliar el modelo): opacidad y escala desde **`0.86`** (constante de §29.6, la del nacer de la isla). Bruno pone **`is-landing`** en la ficha y la retira en `animationend`/`animationcancel` de keyframes **`g-file-field-land…`**, o en el acto sin animación calculada (patrón de #313 y #336) | **`--g-duration-press`, `--g-ease-out`**. **No el muelle**: es una entrada (§29.1 «Nunca: entradas»); el prototipo usaba `--g-ease-spring` y se corrige como el despliegue de `GCombobox` y el nacer de la isla |
| Los destinos **despiertan** | Todos a la vez: fundido de opacidad | `--g-duration-press`, `--g-ease-out`; dormirse, `--g-duration-fast`. Sin escala (el `0.97` del prototipo sería una constante nueva sin necesidad: lo que distingue es que **todos** despiertan) |
| La ficha **se llena** | El relleno de `GProgress` avanza (`translate`, sin layout) | La transición de `GProgress` (`--g-duration-press`, `--g-ease-out`; ninguna con `reduce`) |
| Subido | Aparece el filo de éxito | Fundido, `--g-duration-fast` |
| Error, encima, lleno | Color y fondo | `--g-duration-fast`, `--g-ease-standard` |
| Rechazo al enviar | `is-rejected`: sacudida de la caja, keyframes `g-reject-file-field…` (`form.md` §2, #304) | La de `input.md` I2 |

**Sin usos nuevos de `--g-ease-spring` ni de `--g-ease-bounce`** (L24).

## Tokens consumidos (#376)

**Tokens nuevos: ninguno** (`tokens.md` §35; §17.6: ningún existente se queda corto). Lo propio:

| Token | Para qué |
| --- | --- |
| Los de la caja de `GInput` (`--g-color-surface`, `--g-color-border-control`, `--g-color-surface-sunken` en `soft` y solo lectura, `--g-radius-{rounded}`, `--g-border-width`, `--g-space-1`) | Caja, alto, rellenos y separaciones (piso 24px, 44px táctil) |
| `--g-focus-width`, `--g-focus-offset`, `--g-color-focus` | Anillo de la caja con el control enfocado |
| `--g-color-surface-sunken`, `--g-radius-xs` | Fondo y radio de la ficha |
| `--g-color-accent-soft` + `--g-color-on-accent-soft` | Relleno de la ficha que sube + su **frente de avance** (≥ 3:1, WCAG 1.4.11; `accent` no llega en claro, #379) |
| `--g-color-success-text` | Filo de la ficha subida en esta sesión |
| `--g-color-danger-soft`, `--g-color-on-danger-soft`, `--g-color-danger-text` | Ficha en error; borde de la caja con error (`is-invalid`) y mensaje |
| `--g-color-warning-soft`, `--g-color-on-warning-soft` | Aviso de no añadidos |
| `--g-color-accent-text`, `--g-color-on-accent-soft` | Texto de «Adjuntar» (kiwi: 5.69:1 sobre la superficie); en la variante `soft` (sobre `surface-sunken`), `on-accent-soft` (4,74:1; `accent-text` daba 4,19:1 en apple claro, #379) |
| `--g-color-text-muted`, `--g-color-text-subtle` | Pista, estado, cara llena y en solo lectura; deshabilitado |
| `--g-color-accent`, `--g-color-on-accent`, `--g-color-accent-soft`, `--g-color-on-accent-soft`, `--g-color-border-control`, `--g-color-text-muted`, `--g-radius-md` | Destino: admite (relleno `accent-soft`, texto y **borde `on-accent-soft`**), encima (relleno `accent` con `on-accent`), no admite (borde discontinuo `border-control` ≥ 3:1, no `border-strong`: es translúcido, ≈ 1,5:1; texto `text-muted`) |
| Roles `body-sm`, `caption` y el peso `action` (`tokens.md` §23) | Etiqueta y cara, pie |
| `--g-duration-fast`, `--g-duration-press`, `--g-ease-out`, `--g-ease-standard` | «Movimiento» |

- **Fondo del destino (L25):** `--g-color-accent-soft` **sólido** por defecto (el texto del destino ya nombra el campo: no hace falta ver la caja debajo). Si coco prefiere dejar ver la caja con `color-mix`, el porcentaje es una **constante de diseño** que anota en su `estilo.md` y mide el contraste del texto del destino sobre el resultado **en el tema claro, en el oscuro y en uno distinto**.
- **No son tokens:** `0.86` (§29.6); el sobresaliente del destino (`space × 1` por lado, acotado en línea por `column-gap × 0.375`) y la base de ancho de una ficha (`space × 52`): constantes de diseño derivadas de `space` que fija coco en su `estilo.md`; **`--g-form-min: 62`** que declara el CSS en una `GFormRow` (propiedad de entrada de §21, no del tema); `concurrency` (prop) y el coalescido del progreso a un cuadro (JS); `24px`/`44px` (§7).

## Clases y datos (contrato bruno ↔ coco)

Bruno emite estas; coco las estiliza.

| Clase / dato | Elemento | Cuándo |
| --- | --- | --- |
| `g-file-field`, `--size-{xs\|sm\|md\|lg\|xl}`, `--variant-{outline\|soft}`, `--density-{…}`, `--rounded-{…}`, `--block` | Raíz | Según props (como `GInput`) |
| `is-ready` | Raíz | Tras montar (nada se anima antes: las transiciones del destino y del mensaje solo existen con ella) |
| `has-files`, `is-multiple`, `is-full` | Raíz | Hay entradas; `multiple` (cambia la disposición: sin ella, una ficha que llena la línea y «Cambiar archivo» al final); `max` alcanzado |
| `is-readonly`, `is-disabled` | Raíz | Resueltos con la precedencia de `GForm` |
| `is-invalid`, `is-warning`, `is-valid` | Raíz | Mensaje visible de ese tipo (error de la aplicación o propio) |
| `is-rejected` | Raíz | Rechazo al enviar (#304) |
| `is-awake`, `is-awake-ok`, `is-awake-no` | Raíz | Arrastre de archivos sobre la página (#373) |
| `is-over` | Raíz | El arrastre está sobre este campo (con `is-awake-ok` admite; con `is-awake-no`, no) |
| `g-file-field__label`, `__optional`, `__required` | Etiqueta y marcas | Como `GInput` |
| `g-file-field__box` | Caja | Siempre |
| `g-file-field__list` | `<ul role="list">` | Con archivos (`role="list"` explícito: con `list-style: none` VoiceOver dejaría de anunciarlo como lista) |
| `g-file-field__chip` + **`data-state`** (`ready` `queued` `uploading` `done` `error`) + **`data-stored`** (atributo vacío, solo guardados) + `is-landing` | `<li>` de cada archivo | Por entrada. Se estiliza por atributo (no `is-ready`, que ya es de la raíz); el filo de éxito sale de `[data-state="done"]:not([data-stored])` |
| `is-landing` | `<li>` (`__chip`) | Solo al añadir por un gesto (nunca al montar ni al conciliar el modelo). Bruno la retira en `animationend`/`animationcancel` cuyo `animationName` empiece por **`g-file-field-land`** (con `reduce` también hay animación: `g-file-field-land-fade`, solo fundido), o en el acto si `animationName` es `none` |
| `g-file-field__progress` | El `GProgress` de la ficha (`class`) | `queued`, `uploading`; con `showLabel: false` y `showValue: false`: **sin `g-progress__row`** (su texto quedaría dentro de la capa) |
| `g-file-field__error` | Texto oculto (`hidden`) del fallo | `error` |
| `g-file-field__retry`, `__remove` | Los `GBtn` de la ficha | Según estado; editable |
| `g-file-field__add`, `__input`, `__add-icon`, `__action`, `__add-hint` | Pieza «Adjuntar» y el control | Siempre (`__add-hint` **solo** vacío y editable: su presencia oculta a la vista la pista del pie, `:has`) |
| `g-file-field__target`, `__target-text` | Destino | Siempre en el DOM; visible con `is-awake` |
| `g-file-field__foot`, `__meta`, `__hint`, `__status` | Pie | Siempre (`__status` con texto) |
| `g-file-field__notice`, `__notice-list` | Aviso de no añadidos | Tras un gesto con rechazos |
| `g-file-field__message` | Región de mensaje | Siempre (vacía = sin nodos de texto, `form.md` §1) |
| `g-file-field__message-type`, `__message-icon` | Prefijo oculto (`labels.error` de `GForm`) y `GIcon` del mensaje | Con mensaje, como las partes de `GInput` |
| `g-file-field__live` | Región viva | Siempre (y su copia en el modal superior, cuando toca) |

**Para coco:**

- **La caja es la de un campo:** mismo alto que `GInput` vacía (Δ0 de `top` y alto con un `GInput` vecino en una `GFormRow`, en los tres motores); `:has(.g-file-field__input:focus-visible)` pinta el anillo; `cursor: pointer` en la caja editable; con archivos, flex con salto; la pieza «Adjuntar» ocupa el resto de la última línea vacía y su ancho natural con fichas.
- **Ficha:** `GSummary` `inline` `xs` reapuntada si hace falta sobre `danger-soft` (como `GCombobox` sobre `selection`: selectores propios sobre `g-summary__*`, `GSummary.css` no conoce al anfitrión); **medir** nombre, tamaño y mensaje de fallo ≥ 4.5:1 sobre `surface-sunken`, `accent-soft` (subiendo) y `danger-soft`, en claro, oscuro y un tema distinto. `GProgress` como capa: barra sin contorno ni fondo, del tamaño de la ficha, detrás del contenido, `pointer-events: none`; relleno `accent-soft` con su **borde de avance `on-accent-soft`** (≥ 3:1 contra el relleno y contra la ficha, medido; #379); el resto de `GProgress.css` intacto. Botones `flex: none`, ≥ 24px (44px táctil).
- **Destino:** capa absoluta mayor que la caja, sin layout (Δ0 de la caja y del siguiente elemento al despertar), puntero solo con `is-awake-ok`; tres apariencias distinguibles **sin color** (admite: borde sólido; encima: relleno sólido `accent` con `on-accent`; no admite o lleno: borde discontinuo `border-control` y tono apagado), con texto ≥ 4.5:1; el borde del que admite es `on-accent-soft` (#379). Sobresaliente `space × 1` acotado. Dos destinos vecinos no se solapan.
- **`--g-form-min`** de A medido (ver «Disposición»).
- **`forced-colors`:** ficha con borde `CanvasText`; destino con `Highlight`; progreso visible (la barra de `GProgress` ya tiene regla; comprobar que la capa no la oculta); anillo del control con `Highlight`; error con texto (no depende del fondo).
- **Movimiento** de la tabla, con `reduce` y sin nada al montar; nombres de keyframes `g-file-field-land…` y `g-reject-file-field…`.

## RTL

La caja, las fichas y la pieza «Adjuntar» usan propiedades lógicas; el relleno de la ficha avanza hacia el final de la lectura (lo refleja `GProgress` con `--_dir`). Los iconos no son direccionales (`x`, `rotate-ccw`, `plus`, `lock`, `check`, `image`, `file-text`: sin `flip-rtl`). Los nombres de archivo llevan `dir="auto"` (los pone `GSummary`).

## SSR

Importar y renderizar en el servidor no toca `document`, `window`, `navigator`, `URL.createObjectURL` ni `DataTransfer`. El servidor pinta la etiqueta, la caja con las fichas del `modelValue` (los guardados con su `url` como miniatura; los demás con su icono), la cara, el pie y los ocultos; sin `locale`, **antes de montar** (servidor y primer render de la hidratación) las cifras y los tamaños se formatean con **`en-US`**, para que servidor y cliente coincidan; al montar pasa a la resolución normal (`locale` › `lang` del ancestro › `navigator.language`) y puede cambiar el texto de la ficha. README: en SSR, pasar `locale`. El módulo de arrastre, la cola de subida, las URL de objeto, la sincronía de `input.files` y la región en el modal, solo al montar.

---

## Avisos de desarrollo (`[Grana GFileField]`, una vez por instancia y motivo)

Con el patrón `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`.

1. Sin nombre accesible: sin `label`, slot `label`, `aria-label` ni `aria-labelledby`.
2. Un texto de `labels` que hace falta y no está (tabla de «Textos»; los marcados «al montar», al montar; el resto, la primera vez).
3. `max` sin `multiple` (se ignora); `max` < 1, `maxSize` ≤ 0 o `concurrency` < 1 (además del validador: se ignora o se usa el valor por defecto).
4. Entrada sin `key` o sin `name` (se ignora); `key` repetida (se ignora la segunda); guardado (sin `file`) con `state` distinto de `done` (se toma `done`) o sin `value` (no se enviará).
5. La aplicación cambió `state`, `value` o `error` de una entrada que el componente está subiendo (gana el del componente).
6. El adaptador resolvió sin `value` (la entrada pasa a `error`).
7. `type`, `webkitdirectory`, `directory` o `aria-invalid` en `$attrs` (se ignoran); `appearance` o `expected` (reservados, #378).
8. Dentro de un `GInputGroup` o de un `GFieldGroup` (no admitido en v0.1).

## Resolución de hallazgos

### r01 (`design/lab/file-field/r01/declaracion.md`)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | Nombre y contrato | `GFileField`, `g-file-field`, contrato propio; en `form.md` Fase 5 pasa a «contratado» | #367 |
| L2 | Props | Tabla de «Props». Se añaden `warning`, `valid`, `size`, `variant`, `density`, `rounded`, `block` (familia de los campos, A comparte fila); `uploader` y `concurrency` tal cual; `locale` con la cadena de `GNumberField`; `color` no (reservado) | #370, #367 |
| L3 | Modelo | Entrada `{ key, name, size, type, state, value, url, error, file }`; guardados sin `file` y `done`; progreso fuera del modelo **y sin slot** en v0.1; fuente de verdad y conciliación por `key`; reanudar al volver a montar | #368 |
| L4 | Eventos | `update:modelValue`, **`reject`** (`{ items, via }`) y **`change`** (`{ added, removed, via }`, uno por gesto); sin eventos de subida; métodos `add`, `open`, `focus` | #370 |
| L5 | Adaptador | `uploader(file, { signal, progress }) → Promise<{ value, url? }>`; rechazo `{ message }`; `AbortError` ajeno y `value` nulo son `error` (nada queda colgado ni se da por enviado); `createSimulatedUploader` en `@grana/vue/testing` | #369 |
| L6 | Envío | Tabla de «Envío»; guardados como ocultos también sin adaptador; `setCustomValidity` fuera de `GForm` | #371 |
| L7 | Bloqueo del envío | Error **propio** del campo por las opciones internas `ownError`/`ownTarget` de `useFormField`; revelado **solo** por envío o `showErrors()`; precedencia prop › propio › `errors[name]`; enlace al «Reintentar» del primer fallido o al control; `labels.pending`/`labels.failed` | #372 |
| L8 | Textos | Tabla de «Textos». Cambios: `choose*` → `add`/`addMany`/`addMore`/`change` (lo que dice la cara de A), `drop*` según el destino de A, `uploadFailed` (mensaje) y `uploadError` (anuncio) separados, `failed` es el error propio | #370 |
| L9 | Tamaños | Unidades decimales con `Intl`; **`formatFileSize`** exportada para la pista de la aplicación | #370 |
| L10 | ARIA | Sin `aria-invalid` (aviso si llega por atributo); descripción; `aria-disabled` para lleno y solo lectura; **nombre = etiqueta + texto de la cara** (2.5.3). Lector real: «No verificado» | #374 |
| L11 | Soltar fuera | **Siempre** (decisión del usuario 4), con la protección solo para lo que nadie atendió | #373 |
| L12 | Entrada | **Entrada propia `@grana/vue/file-field`** (`GranaFileField`); `useFormField` y claves por `__shared` | #367 |
| L13 | `GProgress` sin texto | Prop nueva **`showLabel`** (Boolean, `true`), hermana de `showValue`: con las dos a `false` no hay fila; `label` sigue obligatorio (nombre accesible). `widget.md` | #375 |
| L14 | Iconos | Entran en la lista de la librería **`file-text`** e **`image`**; **`inbox` no** (A no lo usa: era la cara de la zona de r01); «Reintentar» usa **`rotate-ccw`** (como `GCombobox` y la captura de voz), no `refresh-cw`. Lista `lab`: `upload`, `paperclip`, `file`, `camera`, `clipboard-paste` (bruno, para siguientes rondas) | #377 |
| L15 | Tokens | Ninguno nuevo | #376 |
| L16 | Reservas | «Fuera de v0.1» | #378 |

### r02 (`design/lab/file-field/r02/declaracion.md`)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L17 | Identidad | A por defecto, C y B en entregas siguientes (decisión del usuario); semillas descartadas y reparto de C solo al soltar en el grupo, registrados | #366 |
| L18 | A · anatomía | Tres hijos; `subgrid` en `GFormRow`; caja vacía = `GInput` del mismo `size`/`density`; `--g-form-min` **medido por coco** | «Disposición» |
| L19 | A · destinos | `utils/fileDrag.js` compartido; `is-awake` + `is-awake-ok`/`is-awake-no` + `is-over`; capa `__target` (`aria-hidden`; «portal» evocaba un teletransporte que no hay); `dragAccepts`; despertar solo lo alcanzable (ni `inert`, ni fuera del modal superior) | #373 |
| L20 | A · ficha-barra | La semántica y la pintura son **el mismo** `GProgress` (`showLabel: false`), colocado como capa; sin `--_p` aparte ni barra oculta duplicada; borde de avance ≥ 3:1 | #375 |
| L21 | B · `gallery` | Reservado | #378 |
| L22 | C · casillas | Reservado con forma, **con el nombre `expected`** (no `slots`) | #378 |
| L23 | `GBtn` en flex | **Resuelto por coco** (`fc3bf9c`, spec `btn-icon-flex`); el contrato exige ≥ 24px en la ficha | — |
| L24 | Movimiento | Sin tokens nuevos y **sin usos nuevos del muelle**: aterrizaje con `--g-ease-out` (era una entrada); destino con fundido | #376 |
| L25 | Superficie del destino | `accent-soft` sólido por defecto; `color-mix` solo con contraste medido y constante anotada | #376 |

### Estilo de coco (`design/lab/file-field/estilo.md`, commit `7e3c7df`; DECISIONS #379)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L26 | Colores que no cumplían en todos los temas | El frente de avance de la ficha y el borde del destino que admite pasan de `accent` a **`on-accent-soft`** (`accent` en claro: spotify 1,15, amazon 1,88, stripe 2,34, linear 2,86; `on-accent-soft` ≥ 4,51:1 en los once temas); el discontinuo del destino que no admite, de `border-strong` (translúcido, ≈ 1,5:1) a **`border-control`** (≥ 3,43:1); la cara de la variante `soft`, de `accent-text` a **`on-accent-soft`** (4,19 → 4,74:1 en apple claro) | #379 |
| L27 | Sobresaliente del destino | `space × 1` acotado en línea por `column-gap × 0.375` (con `space × 2`, dos vecinos se solapaban en `compact`) | #379 |
| L28 | `--g-form-min` | **62**, medido (suma 245 px; con 60 «Adjuntar archivo» bajaba de línea) | #379 |
| L29 | Clases y datos | Añadidas a «Clases y datos»: `is-multiple`, `data-state`, `data-stored`, `__message-type`, `__message-icon`, `__add-hint`, `is-landing` y su retirada, `is-ready`, `role="list"`, `GProgress` con `class="g-file-field__progress"`, `showLabel: false`, `showValue: false` | #379 |

**Pendiente fuera de este componente (coco; no es de `GFileField`):** dentro de una `GFormRow`, la caja de `GInput`, `GSelect`, `GInputGroup` y `GDatePicker` **se estira** cuando un vecino es más alto (medido: 156 px de `GInput` junto a un `GFileField` con cuatro fichas en dos líneas; `estilo.md`, «Pendientes»). Solución propuesta: `align-self: start` en esas cajas dentro de la fila (`.g-form-row > .g-input > .g-input__row` y equivalentes). La regla de `form.md` §4 «Caja» se precisa para que lo cubra (una caja más alta alarga su línea, no estira a sus vecinas); está escrita allí.

## Límites conocidos (para el README)

- **Lector de pantalla real sin verificar:** cómo se lee el `<input type="file">` oculto con su nombre compuesto, su descripción y el recuento nativo del navegador («2 archivos»).
- **Arrastre del sistema real** y **pegar real** sin verificar (eventos construidos con `DataTransfer`; Firefox no admite archivos en un `ClipboardEvent` construido). Safari puede no dar tipos durante el arrastre: el destino dice «Soltar aquí» y la decisión es al soltar.
- **Un destino de soltar propio de la aplicación** que escuche en `document` **después** de que monte el primer campo puede ver el `drop` ya cancelado: debe escuchar en su elemento.
- **Sin reintentos automáticos ni límite de tiempo:** son del adaptador. Un adaptador que nunca resuelve deja la entrada subiendo (y el envío bloqueado) hasta que la persona cancela.
- **Desmontar a media subida** cancela; las entradas vuelven a la cola al montar de nuevo.
- **`formnovalidate`** envía sin lo pendiente ni lo fallido.
- **Sin `uploader`** el formulario lleva binarios: `GForm` emite `FormData` con los `File`; la aplicación envía `multipart/form-data`.
- **Miniatura pequeña** (`xs`): para comprobar «es la foto correcta», B (reservado).
- **Documentos distintos** en un solo campo: una ayuda en texto; C (reservado) o un campo por documento.
- **Navegadores:** exige `DataTransfer` construible (para reescribir `input.files`) y `:has()`.

## Verificación (cómo se da por hecho)

**Criterio de hecho:** la batería de kiwi (`design/lab/file-field/verificar.mjs`, base y A: 49 y 59 comprobaciones en Chromium) reproducida **sobre el componente real**, más lo nuevo de este contrato (error propio, nombre compuesto, `showLabel`, iconos, aterrizaje sin muelle). Verificación por niveles (CLAUDE.md): durante la ronda, el spec afectado en Chromium; la pasada completa en los tres motores, una vez al cierre. Puerto propio de Playwright por agente.

### bruno (vitest + jsdom)

- **Modelo:** estados y transiciones; guardados; conciliación por `key` (quitar desde la aplicación aborta; nueva con `file` entra en la cola; estado de una entrada que sube no se pisa, aviso 5); sin `v-model`; reanudar al montar; `update:modelValue` no por progreso.
- **Validación:** orden tipo › vacío › tamaño › duplicado › número; `accept` por extensión y por MIME en las tres vías; `multiple` suma; sin `multiple` reemplaza (y cancela); lleno; selección vacía no borra; `reject` y `change` con su `via`; `add()` devuelve lo añadido y lo rechazado.
- **Adaptador** (con `createSimulatedUploader`): cola con `concurrency`; `progress` coalescido; `{ message }`; sin `message`; `AbortError` ajeno; `value` nulo (aviso 6); cancelar aborta `signal`; desmontar aborta y revoca.
- **Envío:** `FormData` sin adaptador (binarios + guardados) y con adaptador (ocultos de `done`, `<input>` sin `name`); `readonly` se envía; `disabled` no; `form` en los ocultos; `setCustomValidity` con pendientes y vacía al terminar.
- **`GForm` y error propio:** añadir con subida en curso **no** pinta error; enviar bloquea, emite `invalid` con el `id` de `ownTarget` (Reintentar del primer fallido / el control), pinta el mensaje, `is-rejected`, foco; al terminar la subida el error desaparece **sin** enviar; el siguiente pendiente no se pinta hasta otro envío; precedencia prop › propio › `errors`; inactivo no bloquea; `formnovalidate` no bloquea; `GErrorSummary` enlaza al archivo. **Las pruebas existentes de `GForm` y `useFormField` siguen en verde** (las opciones nuevas son opcionales).
- **Semántica:** `aria-labelledby` = etiqueta + cara; `aria-describedby` con pista, estado, mensaje y los ids del consumidor; sin `aria-invalid`; `aria-required` sin `required`; `aria-disabled` en lleno y solo lectura (no abre: `click` cancelado); ids internos; nombres de los botones; `GProgress` con `showLabel: false` sin fila; foco tras quitar (siguiente, anterior, control) y tras reintentar; anuncios por gesto, por fallo, por lote, al quitar, cancelar y reintentar (texto exacto con `labels` de prueba); manejadores primero (prueba de orden).
- **Arrastre:** cuenta de referencias del módulo; despertar y `is-awake-ok`/`-no` con tipos; inerte y fuera del modal no despiertan; solo lectura y deshabilitado no; `drop` fuera cancelado solo si nadie lo atendió; `dragAccepts` con extensiones.
- **SSR** (`renderToString` con guardados y ocultos, sin `window`); **avisos** 1 a 8; **empaquetado**: `__shared` sin duplicados (con `useFormField`), compuertas, peso gzip en el `meta.json`; `GProgress` con `showLabel` (sus pruebas en verde).

### Playwright (Chromium, Firefox, WebKit; `design/lab/theme-playground/`)

- `tests/file-field.spec.mjs`: la batería de kiwi sobre el componente real: control real con nombre compuesto, Tab (Opción+Tab en WebKit), foco visible ≥ 2px en la caja, Espacio y clic abren (`filechooser`), elegir tres, `input.files` sincronizado, rechazos con motivo, lleno que no abre, progreso con valor, Δ0 de la ficha entre subiendo, subido y error, ocultos, foco tras quitar y reintentar, cancelar, envío bloqueado y resumen que enlaza al «Reintentar», pegar (Chromium y WebKit), solo lectura, deshabilitado, uno solo que reemplaza, `FormData` nativo, 320px LTR y RTL, objetivos ≥ 24px (44px táctil), consola limpia.
- `tests/file-field-forma.spec.mjs`: en una `GFormRow` con `GInput` (Δ0 de `top` y alto de la caja vacía en los tres motores); la fila se parte antes de `--g-form-min` y respeta el del consumidor; arrastre de página: despiertan los que admiten y los que no lo dicen, Δ0 de todas las cajas, destino mayor que la caja, vecinos sin solape, soltar fuera no navega, un campo en un `GFormReveal` cerrado y uno bajo un `GDialog` modal no despiertan.
- `tests/personalidad-file-field.spec.mjs`: aterrizaje (≥ 2 escalas intermedias, termina en 1, retira `is-landing`, **sin rebase**: nunca > 1), destinos que despiertan juntos, relleno que avanza; con `reduce`, nada se escala ni se desplaza y no quedan clases.
- Prueba obligatoria de distribución (`tests/form-distribution.spec.mjs`, #184): sigue pasando.

### coco (CSS y auditoría)

Solo `var(--g-*)` y `--_*` más las constantes de `tokens.md` §35 y §7; A medido en los tres motores; auditoría con un tema distinto y con el oscuro (caja, ficha en sus cinco estados, borde de avance ≥ 3:1, destino en sus cuatro apariencias, aviso, mensaje); `forced-colors` emulado con medida. Resultado en `design/lab/file-field/auditoria.md`.

### No verificado (entorno real)

Lector de pantalla (VoiceOver, NVDA, TalkBack): el control oculto con nombre compuesto y descripción, el recuento nativo, la lista y sus botones, el aviso, los anuncios por lote y la barra dentro de la ficha; diálogo del sistema real y hoja móvil de iOS y Android (cámara); arrastre real desde el escritorio; pegar real; `forced-colors` real; zoom de texto al 200 %; archivos de varios GB; HEIC; memoria de URL de objeto con fotos grandes; la escucha de `document` con varios campos montados y desmontados en una SPA.

## Fuera de v0.1 (reservado, #378)

| Qué | Nombres y forma reservados | Requiere |
| --- | --- | --- |
| **C · «Lo que falta»** (segunda entrega, decisión del usuario) | Prop **`expected`**: `[{ key, label, accept?, maxSize?, multiple?, max?, optional?, hint? }]`. Con ella el campo es un **`<fieldset>`** con `<legend>` (la `label`) y una **casilla por documento**, cada una con su `<input type="file">`, su etiqueta, su marca y su error; **modelo objeto por clave** `{ [key]: Entry[] }`; `name` de cada casilla y de sus ocultos **`${name}[${key}]`**, cada casilla registrada en `GForm` con ese nombre (error, `is-rejected` y enlace del resumen **por casilla**); recuento con `labels.tally` (`{done}`, `{total}`; kiwi lo llamó `progress`, que aquí ya es el nombre de la barra) y `labels.missing` (`{list}`); reparto **solo al soltar en el grupo** (primera casilla libre que admite, con preferencia por coincidencia de palabras con su etiqueta), anunciado con `labels.assigned` (`{name}`, `{slot}`) y `labels.unassigned`; marca que salta con `--g-ease-bounce` (sería un uso nuevo: decisión al contratar) | Ronda corta de kiwi sobre el componente real (medir el `fieldset` con varios controles con lector real) y contrato de su modelo. Kiwi y la recomendación lo llamaron `slots`: se reserva **`expected`** porque `slots` choca con los slots de Vue (`$slots`, `useSlots`, la documentación de cada componente) |
| **B · «Mesa de luz»** (tercera entrega, decisión del usuario) | **`appearance="gallery"`** (y `appearance` con `field` por defecto, que hoy no se declara): pieza 4:3 con mínimo `space × 30`, «Añadir» como última pieza (≥ 44px), velo que se retira de abajo arriba al subir, «Soltar N» al arrastrar, tipo en grande para documentos | Ronda de kiwi sobre el componente real; el revelado de la subida se podrá llevar a las miniaturas de A y C |
| Validación propia de la aplicación | Prop **`validate`** `(file) => true \| String \| Promise<…>` (dimensiones de imagen, páginas de PDF), motivo `custom` | Orden con la validación propia y con la subida |
| Cámara con interfaz propia | Prop **`capture`** (hoy, el atributo nativo llega al `<input>`) | Ronda: hoja con cámara y galería |
| Reordenar, ampliar la imagen, carpetas | Nombres `reorderable`, `zoomable` (o vista con `GDialog`), `directory` | Rondas propias (teclado de reordenar) |
| Subida por trozos y reanudable | Del adaptador (sin API en Grana) | — |
| Reintentos automáticos, evento de progreso | `retry` (política) y evento `progress` | Motivo de producto |
| Slots de ficha | `item` (`{ entry, progress }`), `lead` | Que una aplicación lo pida; deben conservar Δ0 y los nombres |
| Parte de `GInputGroup`, de `GFieldGroup`; perfil en `GAdaptiveLayout` | — | Que el error propio llegue al grupo (`useCompositeField`) |
| Color del foco | `color` | Como en `GInput`, si se pide |
| Semillas descartadas por kiwi (r02) | Pila en abanico; zona circular | Motivo nuevo |

## Encargos

### coco (Opus) · `GFileField.css`

1. **Concepto A** con los tokens de «Tokens consumidos» y las clases de «Clases y datos», siguiendo «Para coco». Plan de movimiento en `plans/` si lo necesita.
2. **Medir y declarar `--g-form-min`** de A (en `space`) sobre `.g-form-row > .g-file-field`.
3. **Ficha:** `GProgress` como capa con frente de avance `on-accent-soft` ≥ 3:1 (medido, #379); reapuntar la `GSummary` sobre `danger-soft` y `accent-soft` con contraste medido en claro, oscuro y un tema distinto.
4. **Destino:** cuatro apariencias distinguibles sin color, Δ0, vecinos sin solape en `compact`; decidir sólido o `color-mix` (L25) y anotarlo en `design/lab/file-field/estilo.md`.
5. **Movimiento:** `g-file-field-land…` (`--g-duration-press`, `--g-ease-out`, escala desde `0.86`), fundido de los destinos, `g-reject-file-field…`; nada con `reduce`; nada al montar.
6. **`forced-colors`** con medida. Registrar `GFileField.css` en `components.css` lo hace bruno.
7. Después de bruno: **auditoría** (paso 5) en `design/lab/file-field/auditoria.md`.

### bruno (modelo avanzado) · `GFileField.vue`, motor, pruebas y entrada

1. **Entrada `@grana/vue/file-field`** (`src/file-field.js`, `vite.file-field.config.js`, global `GranaFileField`), plugin por defecto, `GFileField` y **`formatFileSize`**; **añadir a `src/shared.js` `useFormField` y `revealKey`** (y lo que falte) y comprobar en `src/file-field.test.js` que no hay copias; compuertas de «Entrega»; peso gzip en `GFileField.meta.json` (`status: "draft"`).
2. **`formContext.js` y `GForm.vue`** (`form.md` §2 «Error propio del componente», #372): opciones internas `ownError` y `ownTarget`, precedencia, conjunto de revelados por envío, `blocking()`/`visibleTarget()`/`focusFirstError()` con `ownTarget`; pruebas de `GForm` en verde y nuevas del error propio.
3. **`GProgress`:** prop **`showLabel`** (Boolean, `true`), `widget.md`; prueba de que sin fila no se pinta `g-progress__row` y el `aria-label` sigue.
4. **`GFileField.vue`** y el motor (validación, cola, conciliación por `key`, URL de objeto, `input.files`, aviso, anuncios con traslado al modal, foco) según este contrato; **`utils/fileDrag.js`** (#373).
5. **Iconos:** `file-text` e `image` a la lista `library` de `scripts/icons.json` (y la regeneración de `src/icons/lucide.js`); `upload`, `paperclip`, `file`, `camera` y `clipboard-paste` a `lab`; `node packages/vue/scripts/check-icons.mjs` en verde.
6. **`createSimulatedUploader`** en `@grana/vue/testing`.
7. Registro de `GFileField.css` en `components.css`; playground `#sec-file-field` (los tres casos de kiwi: receta junto a su folio en una `GFormRow`, fotos con subida simulada y un fallo, y documentos de identidad como tres campos).
8. Pruebas de «Verificación» (vitest y los tres specs de Playwright con puerto propio).

### mora-docs · `GFileField/README.md`

Al cierre, desde `GFileField.meta.json`: el adaptador con una receta de `fetch` con `signal` y progreso (XHR), `formatFileSize` para la pista, envío con y sin adaptador, el bloqueo al enviar y `formnovalidate`, y «Límites conocidos».

## Dudas para el usuario

Ninguna de producto. Dos desviaciones del prototipo, derivadas de reglas vigentes, para que conste: (1) la ficha **aterriza sin muelle** (`--g-ease-out`): el muelle no se usa en entradas (§29.1, #299); (2) el modo C se reservará como **`expected`** y no como `slots` (choque de nombres con Vue). Si el usuario quiere el muelle en el aterrizaje, es un uso nuevo que se decide aparte.
