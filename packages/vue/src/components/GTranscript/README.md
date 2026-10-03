# GTranscript (`GTranscript`, `createTranscript`, `useSpeechTarget`)

Vista de **revisión de un transcript** de la captura de voz: corregir lo que entendió el motor, eliminar fragmentos, asignar hablantes y roles, ver qué cambió frente al original, copiar e **insertar** lo revisado en los campos del formulario, con deshacer en todo. Funciona con la conversación en curso (el transcript de la sesión) y con un transcript que tu aplicación guardó (`createTranscript(json)`), sin micrófono ni sesión. Es una **rejilla de datos** (patrón *data grid* de APG): una fila por fragmento y **una sola parada de tabulación** para todo el transcript.

**Etiqueta:** `<g-transcript>` · **Entrada:** `@grana/vue/speech` (no viaja en `@grana/vue`) · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/speech/auditoria-f2.md`](../../../../../design/lab/speech/auditoria-f2.md)) · **Desde:** 0.1.0 · **Fase:** 2 de 3 de la captura de voz

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (playground en `packages/vue/playground/`, sección «Captura de voz», con `?speech=self`: revisión junto a un `GForm` real, diálogo de respaldo forzable, transcript guardado y botones de 320 y 1000 fragmentos). Exige Vue `^3.5.0`. La captura en sí (`createSpeech`, el anfitrión, la pill y los disparadores) está en [`GSpeechHost/README.md`](../GSpeechHost/README.md).

## Qué es y qué no es

- **Tres piezas, un modelo.** `createTranscript` es el **modelo** (capas, historial, usos); `GTranscript` es la **vista** que lo muestra y lo edita; los **destinos** son los campos de tu formulario a los que se inserta. Varias vistas del mismo transcript (el panel del anfitrión, tu revisión en la página, el diálogo de respaldo) **comparten modelo e historial**: lo que corriges en una aparece en las otras y Ctrl+Z en una deshace lo hecho en otra.
- **El original del motor es intocable.** Cada corrección vive en su propia capa y se puede deshacer o devolver al original. **Nada es irreversible** (eliminar es lógico), así que no hay confirmaciones al eliminar ni al reasignar.
- **Grana no certifica revisiones** (DECISIONS #241): no hay marca de «revisado» en v0.1.
- **Privacidad como en la Fase 1:** sin red ni almacenamiento; el historial vive en memoria y no entra en `toJSON()`; **ningún anuncio, evento ni aviso de desarrollo lleva texto transcrito** (los anuncios dicen la hora del fragmento, no su contenido). Solo las entradas de `derived` de una inserción llevan el texto insertado, porque son datos de tu aplicación.
- **No es `GTable`:** `GTable` es una tabla de datos sin edición en la celda. `GTranscript` copia sus convenciones (`v-model:selected` con claves, «Seleccionar todo» mixto, tono de la fila seleccionada, apilado por el ancho del contenedor).

## Capas de un fragmento

| Capa | Campos | Quién la escribe |
| --- | --- | --- |
| **Literal** | `literal`, `engineSpeaker`, `t0`, `t1` | Solo el motor. Ninguna operación del usuario ni deshacer la toca |
| **Corregido** | `corrected` (`null` = igual al literal), `speaker` (`null` = el del motor), `removed` (borrado lógico) | El usuario, solo con las operaciones del modelo |
| **Derivado** | `derived[]` del transcript | Grana (usos por inserción, `kind: 'insert'`) y tu aplicación (`addDerived` con su `kind`) |

- **Guardar un texto igual al literal** deja `corrected = null` (no es una corrección). **Guardar vacío no borra:** equivale a eliminar (`removed = true`, el texto se conserva; «Restaurar» lo recupera).
- **Eliminado** se queda en su sitio, tachado y con la marca «Eliminado»; se excluye de copiar, de insertar y del recuento de «Todo».
- **«Volver al original»** (menú de la fila) devuelve texto **y** hablante al del motor; no restaura un eliminado (para eso, «Restaurar»).
- **«Mostrar cambios»** (barra) y **«Ver original»** (menú de la fila) muestran debajo del texto el original del motor y la diferencia por palabras con `<del>` (tachado) e `<ins>` (subrayado), cada uno envuelto en un prefijo y un sufijo ocultos sacados de `labels.transcript.diff.deleted` / `inserted`. El texto principal de la fila es **siempre el corregido**.

## Uso

### Con la sesión: revisión en la página (recomendada)

Coloca la vista **junto a tu formulario** con el transcript de la sesión. Solo tu aplicación conoce su maquetación; un panel superpuesto taparía campos.

```vue
<script setup>
import { reactive } from 'vue'
import { useSpeech, useSpeechTarget } from '@grana/vue/speech'

const speech = useSpeech()
const nota = reactive({ motivo: '', plan: '' })

// Los destinos se registran en el componente QUE TIENE EL MODELO (la página), no en el campo:
// así «Plan» recibe texto aunque su pestaña esté desmontada
useSpeechTarget({ id: 'motivo', label: 'Motivo', get: () => nota.motivo, set: (v) => { nota.motivo = v }, field: 'f-motivo' })
useSpeechTarget({ id: 'plan', label: 'Plan', get: () => nota.plan, set: (v) => { nota.plan = v }, field: 'f-plan' })
</script>

<template>
  <GForm aria-label="Nota de consulta">
    <GTabs v-model="tab" :items="tabs" label="Nota de consulta">…
      <GTextarea v-if="tab === 'motivo'" id="f-motivo" name="motivo" v-model="nota.motivo" label="Motivo de consulta" />
      <GTextarea v-if="tab === 'plan'" id="f-plan" name="plan" v-model="nota.plan" label="Plan" />
    </GTabs>
  </GForm>

  <section v-if="speech.state.transcript && speech.state.mode === 'conversation'">
    <h3 id="rv-title">Revisión de la conversación</h3>
    <GTranscript :transcript="speech.state.transcript" labelledby="rv-title" max-height="420px" v-model:selected="seleccion" />
  </section>
</template>
```

- **`app.use(speech)`** registra también `GTranscript` (`<g-transcript>`). Los textos, los roles y los destinos se toman del gestor; la prop `labels` añade o sustituye claves sueltas.
- Un `GTranscript` **montado, no compacto y ligado al transcript de la sesión** se registra como **superficie de revisión**: el botón «Revisar» del panel (y `speech.review()`) cierra el panel y lleva el foco al título de `labelledby` (Grana le pone `tabindex="-1"` si no es enfocable) y lo desplaza a la vista. Si hay varias, manda la última montada.
- **Sin superficie** (tu página no coloca la vista), «Revisar» abre el **diálogo de respaldo** del anfitrión (ver abajo).
- Mientras se graba, **en el panel** del anfitrión hay un `GTranscript compact` del mismo transcript: se puede corregir, eliminar, cambiar de hablante y deshacer en plena captura.

### Sin sesión: un transcript guardado

```js
import { createTranscript } from '@grana/vue/speech'
// lo que entregó onComplete (o lo que guardaste tú), de la Fase 1 o de la Fase 2, sin conversión
const guardado = createTranscript(await cargarBorrador(id))
```

```vue
<h3 id="tx-title">Transcripción guardada</h3>
<GTranscript :transcript="guardado" labelledby="tx-title" :speech="speech" />
```

- Carga lo que devolvió `toJSON()` en la Fase 1 o la Fase 2: correcciones, roles y usos. Los campos que faltan toman su valor inicial; `partial` se ignora; los fragmentos se ordenan por `t0`; un id repetido conserva el primero; **campos desconocidos se ignoran con aviso** (tus datos propios van en `derived` con su `kind`). **El historial empieza vacío.**
- Sin sesión, la vista monta **su propia región de anuncios** (`role="status"`, presente y vacía desde el montaje). Sin gestor, pasa `labels`, `roles` y `targets` como props.
- `createTranscript` es estado puro: no toca `document`, `window` ni `navigator` (SSR).

### Guardar y observar

```js
const off = guardado.onChange(({ source, kind, ids }) => autoguardar(guardado.toJSON()))   // sin texto; nunca por el provisional
```

`source` es `'user'` (operaciones, deshacer, insertar), `'engine'` (fragmentos del motor) o `'app'` (`addDerived`, `removeDerived`). La instancia se lee reactivamente y **se escribe solo con sus operaciones** (en desarrollo es de solo lectura y avisa).

## Modos

| Modo | Props | Qué hay |
| --- | --- | --- |
| **Editable** (por defecto) | `editable` + `selectable` | Selección, edición en la celda, hablantes y roles, barra completa, ayuda de teclado visible e inserción (si hay destinos) |
| **Solo selección** | `:editable="false"` | Rejilla con selección, copiar, «Ver original» / «Mostrar cambios» e inserción; sin edición, eliminar, cambio de hablante, gestor de hablantes ni deshacer |
| **Solo lectura** | `:editable="false" :selectable="false"` | **Lista simple** `<ol>` desplazable con `tabindex="0"`: hora, hablante y texto corregido con sus marcas; sin barra ni inserción |
| **Compacto** | `compact` | El del panel del anfitrión: sin columna de selección, sin inserción, sin gestor de hablantes y **sin la línea visible** de ayuda de teclado (la rejilla la conserva como descripción oculta). Conserva editar, eliminar/restaurar, volver al original, cambiar hablante, deshacer/rehacer, copiar y «Mostrar cambios» |

## Props

| Prop | Tipo | Valores | Default |
| --- | --- | --- | --- |
| `transcript` | Object | instancia de `createTranscript` | **obligatoria** (sin ella: raíz vacía y aviso; cambiarla vacía selección, editor y foco) |
| `editable` | Boolean | | `true` |
| `selectable` | Boolean | | `true` (`compact` la ignora) |
| `selected` | Array | ids de fragmentos confirmados (también eliminados) | `[]` · `v-model:selected`; el provisional, los fallidos y los inexistentes se descartan con aviso |
| `compact` | Boolean | | `false` |
| `copy` | Boolean | | `true` · con `false` no hay acciones de copiar ni se intercepta Ctrl+C ni la copia nativa |
| `targets` | Array | destinos (ver «Destinos») | sin valor: los del gestor; con valor, **solo esos** |
| `roles` | Array | `[{ id, label }]` | sin valor: la opción `roles` del gestor; sin gestor, `[]` (sin selector de rol) |
| `diarization` | Boolean | | sin valor: la capacidad del motor si es el transcript de la sesión; si no, `true`. `false`: aviso visible y asignación manual |
| `speakerColors` | Number | `0` a `12` | sin valor: la opción del gestor; sin gestor, `0` |
| `labelledby` | String | id del título visible | nombre de la rejilla (`aria-labelledby`) y destino de «Revisar» |
| `label` | String | texto | `aria-label` sin título visible; sin `labelledby` ni `label`: aviso |
| `headingLevel` | Number | `2` a `6` | `3` (títulos del gestor de hablantes y de la inserción) |
| `maxHeight` | String | longitud CSS | sin valor (la lista crece con la página); con valor, área desplazable propia |
| `labels` | Object | forma de `createSpeech({ labels })` | `{}` · se fusionan por clave sobre las del gestor |
| `speech` | Object | gestor | el inyectado |

El resto de atributos (`id`, `class`, `style`, `data-*`) va a la raíz.

## Eventos y métodos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `update:selected` | ids, en el orden de las filas | Cambia la selección |
| `change` | `{ kind, ids }` | Tras una operación **iniciada en esta vista** (`edit`, `revert`, `remove`, `restore`, `assignSpeaker`, `assignNewSpeaker`, `addSpeaker`, `setRole`, `mergeSpeakers`, `unmerge`, `undo`, `redo`). Para cambios de cualquier origen, `transcript.onChange`. **Sin texto** |
| `insert` | copia de la entrada de `derived` | Tras insertar en un destino |
| `undo-insert` | copia de la entrada de `derived` | Tras deshacer una inserción |
| `copy` | `{ count, withSpeakers, withTimes }` | Tras copiar al portapapeles. **Sin texto** |

**Métodos** (por `ref`): `focus()` (a la celda activa; en solo lectura, a la lista; vacía, al título de `labelledby` si es enfocable o a la raíz), `undo()` y `redo()` (como los botones de la barra: anuncio y fila a la vista, el foco no se mueve). **Sin slots en v0.1.**

## El modelo: `createTranscript(data?)`

**Lectura:** `segment(id)`, `textOf(segmento|id)` (corregido o literal), `speakerOf(segmento|id)`, `resolve(speakerId)` (sigue las uniones), `letter(speakerId)` (A…Z, AA… por posición: unir, separar o añadir no reletra a nadie), `visibleSpeakers()`, `usesOf(segmentId)`, `compose(source, options)`, `canUndo`, `canRedo`, `nextUndo`, `nextRedo` (`{ kind, ids, t0 }` o `null`), `onChange(cb)` y `toJSON()`.

**Operaciones** (síncronas, **nunca lanzan**: un id inexistente o una operación imposible devuelve `false` sin entrada en el historial y avisa en desarrollo; cada llamada es **una** entrada aunque toque varios fragmentos):

| Operación | Devuelve |
| --- | --- |
| `edit(id, text)` (normaliza blancos; igual al literal → `corrected = null`; vacío → eliminado, y la entrada del historial es «eliminación») | `'edited'` · `'emptied'` · `false` |
| `revert(id)` · `remove(ids)` · `restore(ids)` | Boolean |
| `assignSpeaker(ids, speakerId \| null)` (`null` = el del motor; nunca cambia `engineSpeaker`) | Boolean |
| `assignNewSpeaker(ids)` · `addSpeaker()` (ids `user-1`, `user-2`…) | id nuevo · `false` |
| `setRole(speakerId, roleId \| null)` · `mergeSpeakers(fromId, intoId)` · `unmerge(speakerId)` | Boolean |
| `undo()` · `redo()` | `{ kind, ids, t0 }` o `null` |
| `addDerived(entry)` (`kind` obligatorio; `'insert'` reservado) · `removeDerived(id)` (no quita un `insert`) | copia · Boolean |

- **Historial** de 200 entradas en el modelo, compartido por todas las vistas. Deshacer restaura solo los campos del usuario que tocó la operación: lo que llegó del motor después **no se pierde**. Una operación nueva vacía rehacer. Las **inserciones no entran** (tienen su propio deshacer: son otro documento, el formulario).
- **`compose(source, { withSpeakers, withTimes, multiline, speakerName })`** → `{ text, ids }`: usa el corregido, excluye eliminados y fallidos, agrupa fragmentos seguidos del mismo hablante en un **turno** (un salto de línea entre turnos en conversación) y con `withSpeakers` antepone el nombre (el rol si es único entre los hablantes visibles; si no, la etiqueta completa). Un trozo de texto seleccionado se compone tal cual (es una cita).

## Teclado (rejilla)

Columnas: selección · hora · hablante · texto · acciones. La celda que recibe el foco es el control si la celda tiene uno (casilla, botón de hablante, botón de acciones) y la propia celda en hora y texto. **Siempre hay un solo `tabindex="0"` en la rejilla.**

| Tecla | Acción |
| --- | --- |
| **Tab** / **Mayús+Tab** | Entra y sale de la rejilla (una parada); en el editor recorre `textarea` → Guardar → Cancelar |
| **↑ ↓** | Fila anterior / siguiente, misma columna |
| **← →** | Columna anterior / siguiente (**invertidas en RTL**) |
| **Inicio** / **Fin** · **Ctrl+Inicio** / **Ctrl+Fin** | Primera / última columna · primera / última fila |
| **RePág** / **AvPág** | 10 filas |
| **Intro** / **F2** | Texto u hora: **edita**. Hablante o acciones: abre su menú. Casilla: nada |
| **Espacio** | Casilla: la marca. Otra celda: alterna la selección de la fila |
| **Mayús+Espacio** · **Mayús+↑/↓** | Alterna la fila · amplía la selección |
| **Ctrl/Cmd+A** | Selecciona todo; otra vez, nada (lo anuncia) |
| **Supr** / **Retroceso** | Elimina la fila o la selección (o la restaura si ya lo estaba) |
| **Ctrl/Cmd+Z** · **Ctrl/Cmd+Mayús+Z** · **Ctrl+Y** | Deshacer · rehacer, **solo con el foco en la rejilla y fuera del editor** (en el `textarea` manda el deshacer nativo); el foco va a la primera fila afectada |
| **Ctrl/Cmd+C** | Sin texto seleccionado: copia las filas seleccionadas (o la enfocada) |
| En el editor: **Intro** · **Esc** | Guarda · cancela. Esc **no** cierra el panel, la hoja ni un `GDialog` |
| En un menú | `GMenu` (APG): ↑ ↓ Inicio Fin, Intro/Espacio elige, Esc cierra y vuelve al botón (sin cerrar panel ni diálogo), Tab cierra |

- **Edición en la celda:** Intro o F2 (o doble clic en el texto, o «Editar texto» del menú) abren un `textarea` dentro de la celda con el corregido y el cursor al final, el original del motor debajo y la ayuda. **Salir del editor guarda** (el foco va a otra parte de la página); cambiar de ventana **no** guarda. Un editor a la vez; no se edita un eliminado, el provisional ni un fallido.
- **Mientras llegan fragmentos:** el provisional es su propia fila (la última); **el editor abierto no se repinta** aunque lleguen confirmados, provisionales o un cambio de hablante del motor. La lista sigue el final solo si ya estaba al final y no hay foco en otra fila, editor ni menú abiertos; si no, aparece «N fragmentos nuevos · Ir al final» (no es región viva), que lleva el foco a la última fila.
- **Sin atajos de una sola tecla fuera de la rejilla** (WCAG 2.1.4). Con composición de texto (IME) no se trata ninguna tecla.
- **Copia nativa:** al copiar un texto seleccionado con el ratón dentro de la vista, el portapapeles recibe **texto limpio** (sin horas, marcas, original ni prefijos ocultos).

## Hablantes y roles

- **Etiquetas neutras** por orden de aparición: «Hablante A», «Hablante B»… (`labels.speaker`). Los ids del motor son opacos y **nunca se muestran**. **Sin nombres propios.** Con rol, «Profesional (A)» (`labels.speakerRole`): la letra distingue a dos hablantes con el mismo rol. Sin hablante, «Sin asignar» (`labels.unassigned`).
- **Roles:** la lista es **de tu aplicación** (sin valores por defecto), como opción del gestor o prop: `createSpeech({ roles: [{ id: 'pro', label: 'Profesional' }, { id: 'pac', label: 'Paciente' }] })`. Se asignan **por hablante** en el gestor de hablantes («Hablantes» en la barra) y viven en `speakers[].role`. Lista vacía: sin selector de rol.
- **Reasignar un fragmento:** el botón de hablante de la fila abre un menú con un elemento por hablante (el actual marcado), «Nuevo hablante» y, si se cambió, «Volver al del motor (Hablante B)». Con varias filas seleccionadas actúa sobre la selección (o desde «Asignar hablante» de la barra). Marca «Hablante cambiado (motor: …)».
- **Unir** dos hablantes (el motor partió a una persona en dos): «Unir con» + «Unir» en el gestor; «Separar» lo revierte. **Separar** a dos personas que el motor juntó no es automático: selecciona sus fragmentos y «Asignar hablante» → «Nuevo hablante».
- **Sin depender del color:** cada hablante se distingue por su **etiqueta** y por una **marca cuadrada con su letra** (oculta al lector: el texto ya la dice); «Sin asignar» lleva la marca **discontinua y sin letra**.
- **Color por hablante, solo si tu tema define categorías:** `speakerColors` (opción del gestor o prop, de 0 a 12) dice cuántas categorías `--g-color-cat-k` trae tu tema (`categories` en la configuración de `@grana/cli`). El hablante en la posición `k ≤ speakerColors` lleva la marca rellena de `cat-k-soft`, la letra en `on-cat-k-soft` y el borde en `cat-k-text`; por encima, o con `0` (por defecto), sin color. Esas variables **no tienen respaldo** y ningún tema sin `categories` las define: no declares un `speakerColors` mayor que las categorías de tu tema.
- **Motor sin diarización** (`diarization: false`) en conversación: aviso visible en la vista y todos «Sin asignar»; se asignan a mano por fragmento o por selección.

## Destinos: insertar en el formulario

El destino se liga **al modelo de tu formulario**, no al DOM: así Grana resuelve igual para todas las aplicaciones la posición, los separadores, el deshacer seguro y la marca de uso, y **el destino funciona con el campo desmontado** (otra pestaña o paso).

```ts
interface SpeechTarget {
  id: string          // único; recomendado: el name del campo en useFormField
  label: string       // nombre visible del campo («Plan»)
  get?(): string      // valor actual del modelo (el mismo que usa tu v-model)
  set?(value: string): void
  field?: string      // id del control, solo para recordar su cursor y su selección
  multiline?: boolean // false: campo de una línea (los saltos pasan a espacios). Default true
  insert?(text: string, ctx: { position: 'end' | 'cursor' }): { undo(): boolean }   // vía de escape
}
```

- Obligatorio: `id`, `label` y **o** `get` + `set` **o** `insert` (si hay los dos, manda `insert`). Sin ellos, el destino se rechaza con aviso.
- **Registro:** `useSpeechTarget(target)` registra en `onMounted` y da de baja en `onBeforeUnmount` del componente que lo llama (devuelve la función para darlo de baja antes); `speech.targets.register(target)` / `speech.targets.list` sin composable; `<GTranscript :targets="[…]">` suelto, sin gestor. Un `id` repetido sustituye al anterior con aviso.
- **Qué** (`GSelect`): «Todo (N)», «Fragmentos marcados (N)» (deshabilitada sin selección) o «Texto seleccionado «…»» (una selección de texto con el ratón en la vista la activa). Por defecto, la fuente más específica disponible.
- **Dónde** (`GSelect`): **«Al final»** (por defecto: predecible; salto de línea delante si el valor no acaba en blanco, espacio en una línea), «En la posición del cursor» (solo si Grana conoce el cursor del `field` y el valor no cambió desde entonces; si no, deshabilitada con «(sin posición conocida)») y «Sustituir la selección del campo «…»» (solo con una selección conocida). En el cursor: un espacio a cada lado si hace falta, pero no delante de un signo de cierre (`. , ; : ! ? ) ] } » ” …`) ni detrás de uno de apertura.
- **«Con hablantes»** (casilla): activada por defecto en conversación (sin prefijo se mezclarían las palabras de dos personas); no aparece en dictado ni con texto seleccionado.
- **Vista previa** del texto exacto antes de insertar (WCAG 3.3.4), con rótulo, desplazable y enfocable con el teclado (`tabindex="0"`, `role="region"`; no es región viva).
- **«Insertar en Plan»** escribe en el modelo; **el foco se queda en el botón** (no se roba al campo) y el campo montado se actualiza por su `v-model`. Cada fragmento usado lleva **«Usado en Plan»** y, si lo corriges después, **«Cambió después de insertarlo»**: el campo **no** se actualiza solo (lo insertado ya es del usuario).
- **Deshacer la inserción:** solo la **última** de cada destino y solo si el campo **no cambió después** (si cambió, no toca nada y lo anuncia). Aparece junto al resultado y en «Usos de esta transcripción». No entra en el historial de la revisión y no es un `GToast` (un aviso efímero con acción no daría tiempo suficiente, WCAG 2.2.1).
- **Formularios (`GForm`, `useFormField`): sin API nueva en los campos.** La validación de tu aplicación reacciona al valor como a cualquier cambio programático (no lo marca como «tocado»). `GTranscript` dentro de un `GForm` **no es un campo** (sus casillas no heredan el contexto del formulario: `GCheckbox :field="false"`, #262).
- En el menú de cada fila hay además «Insertar en {destino}» por destino (ese fragmento, al final).
- **Con `insert`** (destinos que no son texto plano), «Dónde» ofrece «Al final» y «En la posición del cursor»; tu destino resuelve su cursor, sus separadores y su `undo()` (`false` = no se pudo).

## «Revisar» y el diálogo de respaldo

- En conversación, el panel del anfitrión añade **«Revisar»** (captura, pausa, reconexión) y, al terminar, **«Revisar transcripción»** como acción principal (`file-pen-line`). `speech.review()` hace lo mismo desde código.
- **Con superficie** (tu `GTranscript` en la página): cierra el panel y lleva el foco **al título** de la revisión, a la vista.
- **Sin superficie:** abre un **`GDialog` real** del anfitrión (`class="g-speech-review"`, `size="lg"`, **pantalla completa en móvil**, título `labels.review.title`, cierre `labels.review.close`) con un `GTranscript` editable del mismo transcript y **los mismos destinos**: inserta por el modelo aunque el formulario quede inerte detrás. Al abrir, el foco va al título del diálogo; al cerrar, a «Revisar» o, si ya no existe, a la pill visible. Los canales de anuncios se trasladan al diálogo y vuelven al cerrarlo. **Esc en el editor o en un menú no lo cierra**; Esc en la rejilla, sí.
- **Descartar con usos:** lo insertado **se queda** en los campos (ya es de tu aplicación) y la confirmación lo dice (`actions.discardAskUsed`).

## Anuncios y accesibilidad (medido)

Auditoría de coco sobre los componentes reales del playground en Chromium, Firefox y WebKit ([`auditoria-f2.md`](../../../../../design/lab/speech/auditoria-f2.md), `node design/lab/speech/auditoria-f2-verificar.mjs`): tema por defecto, dos temas generados (`spotify`, acento pálido `#A7F3C1`, y `lustre`) y tres temas con categorías para `speakerColors` (`spotify-cat6`, `default-cat12`, `lustre-cat8`), claro y oscuro. Contraste compuesto sobre el fondo real de cada pieza:

| Medida (umbral) | Mínimo |
| --- | --- |
| Texto confirmado, hablante, «Cambió después de insertarlo» sobre fila seleccionada (4.5) | 12.82 |
| **Provisional** en la página y en el panel, eliminado (tachado), hora, contador, ayudas, rótulos (4.5) | 6.49 |
| Marcas («Corregido», «Usado en»…) (4.5) · sus iconos (3) | 4.54 · 3.83 |
| `<del>` · `<ins>` (4.5) | 4.53 · 4.51 |
| Letra de la marca (4.5) · con color de categoría (4.5) | 15.22 · 4.51 |
| Borde de la marca (3) · sobre fila seleccionada (3) · con categoría (3) · «Sin asignar» (3) | 3.19 · 3.01 · 3.82 · 3.43 |
| Borde de la fila seleccionada, sobre la fila y fuera (3) | 12.82 |
| Anillo de foco de celda sobre una fila (3) · sobre una fila seleccionada (3) | 4.58 · 3.86 |
| Texto de botones (4.5) · borde `outline` (3) · iconos de botón (3) | 4.62 · 3.43 · 3.89 |
| Borde del editor (3) · marca de fallido (3) · borde de una casilla sin marcar (3) | 4.58 · 4.54 · 3.19 |

- **El color nunca es la única señal:** eliminado tachado, `<del>` tachado y `<ins>` subrayado de ≥ 2px con envoltura oculta, fila seleccionada con borde de inicio en el color del texto (y `Highlight` en colores forzados), «Sin asignar» discontinua, fallido con borde discontinuo; cada marca lleva texto e icono.
- **Foco:** anillo sólido de 2px **interior** a la celda, visible y dentro del área desplazable tras cada tecla de la rejilla (medido con 320 fragmentos) en los tres motores.
- **Anuncios:** dentro de la sesión, los **canales del anfitrión**; sin anfitrión, **una** región `role="status"` propia. **Ninguna otra región viva en la vista**: ni `g-btn__status` (ningún botón lleva `loadingText`, #257) ni regiones de mensaje de las casillas (#262); medido con 320 filas. Uno por acción (si se encadenan, gana el último). Nunca provisionales, fragmentos nuevos, `relabel`, foco ni casillas, y **ningún anuncio con texto transcrito** (verificado sobre todos los anuncios de una sesión con edición e inserción).
- **Ancho estrecho:** bajo `space × 160` (640px con el espacio por defecto) de ancho **de la vista** (no del visor) la raíz lleva `data-narrow`: «Copiar», «Mostrar cambios» y «Hablantes» pasan al menú **«Más»** y las filas se **apilan** (casilla, hora, hablante y acciones arriba; texto a todo el ancho debajo). Medido justo por debajo y por encima del umbral; a 320×640, sin desbordamiento horizontal (página, vistas, hoja del panel, diálogo y menús) en LTR y RTL.
- **Tamaños:** todos los objetivos ≥ 24px; con `pointer: coarse`, ≥ 44px sin pisarse (la casilla de fila ocupa toda su columna de 44px).
- **RTL:** columnas y flechas invertidas; Deshacer, Rehacer y «Deshacer inserción» espejados (`flip-rtl`); marcas de selección y de fallido al inicio (derecha).
- **Movimiento:** dentro de la rejilla las filas y las casillas cambian **sin fundido** (rendimiento); solo el anillo de foco de la casilla se abre. Con `prefers-reduced-motion`, el chevron de «Más» tampoco gira.
- **Colores forzados** (emulados): selección y foco en `Highlight`; marcas, «Sin asignar», `del`/`ins`, fallido y eliminado conservan su forma. **`prefers-contrast: more`:** secundarios a `text` y bordes a `border-control`.

## Rendimiento

**Sin virtualizar en la Fase 2:** una lista virtual rompería buscar con Ctrl+F, seleccionar texto de varios fragmentos, la copia nativa, la lectura completa con el lector y las anclas del foco. Solo se repinta lo que cambia (filas con clave, celdas que se reescriben solo si cambia lo que muestran, un solo `GMenu` compartido creado al abrirse) y una selección masiva de más de 40 filas pinta primero las visibles y el resto en tramos por fotograma (el modelo, el evento y el contador cambian en el acto).

| Event Timing máximo por tecla (Playwright, `--workers=1`) | 320 fragmentos | 1000 fragmentos |
| --- | --- | --- |
| Chromium (compuerta < 100 ms) | 48–56 ms | 104–112 ms |
| Firefox (compuerta < 100 ms) | 32–64 ms | 56 ms |
| WebKit (compuerta propia < 200 ms, #264) | 120–152 ms | 576–728 ms (informativo) |

Cifras de bruno y de la auditoría de coco (última pasada: Chromium 48 ms, Firefox 32 ms, WebKit 120 y 128 ms). Con la máquina cargada el reloj salta: una pasada aislada de WebKit dio 408 ms y, repetida, 120 y 128 ms; por eso la compuerta solo se exige con un worker.

Ctrl+A ida y vuelta con 320 fragmentos en Chromium: **~35 ms de estilo** (mediana; ~150 ms antes de quitar los fundidos de fila y casilla dentro de la rejilla). En WebKit casi todo el tiempo es estilo, maquetación y pintado del motor (~12 ms de JS). Por encima de **~2 000 fragmentos** hará falta virtualizar (Fase 3); ese umbral se revisará con Safari real.

## Tamaño

`GTranscript`, `createTranscript` y `useSpeechTarget` van en `@grana/vue/speech`: **`dist/speech.js` 55,4 KB gzip** con la Fase 2 (54,8 KB en DECISIONS #264, antes de #262 y #263; 27,2 KB en la Fase 1); `@grana/vue` no cambia. Su CSS va en `grana.css` (+2,3 KB gzip con la Fase 2, inerte sin su marcado).

## Privacidad de los eventos

`change`, `copy` y `onChange` llevan **tipos, ids y recuentos, nunca texto**. Los avisos de desarrollo (`[Grana Speech]`) tampoco. Solo `insert` / `undo-insert` llevan la entrada de `derived`, que contiene el texto que tu aplicación recibió en su campo.

## Textos

**Sin valores por defecto:** todo va en `labels` (del gestor o de la prop), con las claves `speaker`, `speakerRole`, `unassigned` y `transcript.*` (`cols`, `row`, `flags`, `diff`, `editor`, `menu`, `bar`, `history`, `keyboard`, `noDiarization`, `newer`, `speakers`, `insert`, `what`, `announce`), más `actions.review`, `actions.reviewCompleted`, `actions.discardAskUsed` y `review.*` en el anfitrión. Las claves contadas admiten String con `{count}` o una función `(count) => String`. Falta una clave: aviso la primera vez que se necesita. Un juego completo en español está en el playground (`packages/vue/playground/index.html`, `transcript: { … }`); la lista, en [`GTranscript.meta.json`](./GTranscript.meta.json) y en el contrato §27.

## SSR

`createTranscript` y `useSpeechTarget` no tocan `document`, `window` ni `navigator`; `useSpeechTarget` registra solo en el cliente. `GTranscript` renderiza en el servidor su estructura sin leer el DOM (sin selección de texto, portapapeles ni observadores, que existen solo montado).

## Tema

**Sin tokens propios** (`tokens.md` §24). Fila seleccionada: `--g-color-primary-soft` + borde de inicio en `--g-color-text`; foco: `--g-color-focus`, `--g-focus-width`; provisional y eliminado: `--g-color-text-muted` (cursiva y tachado); marcas: `--g-color-text-muted` y `--g-color-warning-text` («Cambió después de insertarlo»; sobre fila seleccionada el texto pasa a `--g-color-text`); marca de letra: borde `--g-color-border-control` y, con `speakerColors`, `--g-color-cat-k-soft` / `--g-color-on-cat-k-soft` / `--g-color-cat-k-text` (la **única** lectura de la familia `cat-*` en un componente); editor con la apariencia de `GTextarea`; además `--g-color-surface*`, `--g-color-border*`, `--g-radius-*`, `--g-space-*`, `--g-text-*` y `--g-duration-*`/`--g-ease-*`. Umbral de «Más» y de apilado: `space × 160`, medido en ejecución. Variable en línea: `--_max-height` (prop `maxHeight`).

## Clases

Raíz `g-transcript` con `data-mode` (`edit` · `select` · `read`), `data-compact` y `data-narrow`; partes `__note`, `__bar`, `__all`, `__count`, `__more`, `__scroll`, `__grid`, `__head`, `__body`, `__row` (`is-partial`, `is-corrected`, `is-speaker-changed`, `is-removed`, `is-failed`, `is-selected`, `is-editing`, `is-stale`), `__cell--{select|time|speaker|text|actions}`, `__speaker`, `__mark` (`is-unassigned`, `data-cat`), `__actions`, `__text`, `__flags`, `__flag--*`, `__orig`, `__diff`, `__editor`, `__field`, `__newer`, `__kbd`, `__empty`, `__live`, `__list`, `__item`, `__speakers`, `__speaker-row`, `__insert`, `__preview`, `__result`, `__uses`; el diálogo de respaldo, `g-speech-review`. Las clases de elemento no son API estable (#204).

## Limitaciones conocidas

- **Sin verificar con lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): la rejilla en modo foco y la lectura de corrido en exploración, la doble información de `aria-selected` y la casilla, `<del>`/`<ins>` con su envoltura, el editor dentro de la celda y el anuncio de una selección masiva. **Es el riesgo principal.**
- **Sin verificar en Safari real** (WebKit de Playwright no es Safari): `selectionchange`, `ClipboardEvent`, permisos del portapapeles, Esc en `<dialog>` con el editor, y el rendimiento con cientos de fragmentos.
- **Sin verificar en móvil real:** selección táctil con asas, teclado virtual con el editor en la hoja o en el diálogo a pantalla completa.
- **Teclados no QWERTY e IME** con los atajos de la rejilla: solo comprobado que con composición activa no se trata ninguna tecla.
- **Firefox:** el área desplazable (`maxHeight`) es hoy una parada de tabulación más antes de la rejilla (pendiente de bruno; ver la auditoría). Cambiar de transcript en una vista montada muestra un «N fragmentos nuevos» que no corresponde (pendiente de bruno).
- **Sin marca de «revisado»** (#241): Grana no certifica revisiones.
- **Fase 3 pendiente:** virtualización por encima de ~2 000 fragmentos, sesiones de horas, transcript a pantalla completa en móvil fuera del diálogo de respaldo, recuperación tras cerrar la aplicación. Escuchar el audio de un fragmento queda fuera de la v0.1.

## Fuentes

- API: [`GTranscript.meta.json`](./GTranscript.meta.json) · Captura: [`GSpeechHost/README.md`](../GSpeechHost/README.md) · Contrato: [`design/contracts/speech.md`](../../../../../design/contracts/speech.md) §20 a §32 · Prototipo: [`design/lab/speech/r02/`](../../../../../design/lab/speech/r02/) · Estilo: [`design/lab/speech/estilo.md`](../../../../../design/lab/speech/estilo.md) («Fase 2») · Auditoría: [`design/lab/speech/auditoria-f2.md`](../../../../../design/lab/speech/auditoria-f2.md) · Decisiones #241 a #264
