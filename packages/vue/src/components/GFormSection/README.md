# GFormSection

Sección de un formulario (una idea: Información básica, Contacto, Datos fiscales): título `hN`, descripción, acciones secundarias y ayuda, separada por aire y tipografía, sin tarjeta ni punto de referencia. Con `optional`, una insignia «Opcional» sustituye a los «(opcional)» de sus campos.

Tiene **tres modos** (`mode`):

| Modo | Quién decide | Cerrada o sin agregar | Sus datos |
| --- | --- | --- | --- |
| `static` (por defecto) | — | — | Como cualquier sección |
| `collapsible` | El usuario, con el botón del título | Plegada: el cuerpo es `inert`, **sin** `fieldset disabled` | **Siguen en el formulario** plegada: van en `FormData`, se registran, bloquean el envío y salen en el resumen |
| `addable` | El usuario, con «Agregar …» | Sin agregar: `inert` + `fieldset role="none" disabled` y registro **inactivo** | Sin agregar **no existen** para el formulario (ni `FormData`, ni Tab, ni errores, ni resumen). «Quitar» **descarta** |

Además, el encabezado puede ir **al lado** del cuerpo según el ancho propio de la sección (`headerPlacement="auto"`) y la sección puede dibujar una **línea** con la anterior (`divider`).

**Etiqueta:** `<g-form-section>` · **Estado:** `candidate` (la Fase 1 con la auditoría r02 de [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md); la Fase 3, plegable, agregable, al lado y con línea, con la de [`design/lab/form-section/auditoria.md`](../../../../../design/lab/form-section/auditoria.md)) · **Desde:** 0.1.0

> Forma parte del **sistema de formularios**. La guía completa (cuándo usar cada pieza, recetas, API, teclado, accesibilidad medida y limitaciones) está en [`GForm/README.md`](../GForm/README.md#secciones-gformsection). `@grana/vue` está en la versión 0.0.0 y aún no se publica: por ahora se usa desde el repositorio (playground, «Alta de paciente» `#fm-medium` y el marco `#fx-frame`).

> **En plantillas dentro del HTML** (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-form-section ...></g-form-section>`.

## Uso

```vue
<GFormSection title="Datos fiscales" description="Solo si el paciente pide factura." optional>
  <GFormLayout>…</GFormLayout>
</GFormSection>
```

### Icono antes del título: slot `lead` (#203)

```vue
<GFormSection title="Acceso y seguridad" description="Quién puede editar este registro.">
  <template #lead><GIcon name="lock-open" /></template>
  <GFormLayout>…</GFormLayout>
</GFormSection>
```

El `lead` es **decorativo** (`aria-hidden`) y no entra en el nombre del encabezado. En `static` y `addable` va **fuera** del `hN`; en `collapsible` va **dentro del botón**, después del chevron (fuera, pulsar el icono no plegaría). Sin el slot no hay hueco ni aire; **no hay icono por defecto**. El icono toma el tamaño del título (16px con el tema por defecto) y el color `text-muted`, y queda centrado en la **primera línea** del título aunque este ocupe varias, con o sin insignia `optional` y en RTL (medido: 0px de diferencia; contraste ≥ 7,38:1 en claro y ≥ 8,59:1 en oscuro con doce temas; ver [`design/lab/icons/auditoria.md`](../../../../../design/lab/icons/auditoria.md)). Usa un [`GIcon`](../GIcon/README.md) sin `label` y sin clases de tamaño (un `GIcon` con `label` dentro del `lead` avisa).

### Los campos van en un `GFormLayout` (#283)

El cuerpo de la sección **no es una pila**: no separa sus hijos ni pasa la densidad ni da el ancho completo. Pon los campos (con sus `GFormRow` y `GFormReveal`) dentro de un `GFormLayout`. Una sección sin campos (texto, una tabla) pone su contenido directo. En desarrollo, `GFormSection` avisa una vez, al montar, si un campo de Grana, una `GFormRow` o un `GFormReveal` es hijo directo del cuerpo; un campo propio tuyo no se detecta. Dentro de un `GFormReveal` también avisa («la sección contiene la pregunta y el bloque, no al revés»).

## Plegable: `mode="collapsible"`

Para lo **secundario, avanzado o ya completo**; **nunca para lo esencial**. El título entero es un botón (`hN > button`, patrón *Disclosure* de APG), con un chevron al inicio.

```vue
<script setup>
import { reactive, ref, computed } from 'vue'

const abierta = ref(false)
const m = reactive({ idioma: 'es', horario: '' })
const resumen = computed(() => `${m.idioma === 'es' ? 'Español' : 'English'}${m.horario ? ' · ' + m.horario : ''}`)
</script>

<template>
  <g-form-section title="Preferencias" description="Cómo avisamos de las citas." mode="collapsible" v-model:open="abierta" :summary="resumen" divider>
    <g-form-layout>
      <g-select v-model="m.idioma" label="Idioma de los avisos" name="idioma" :options="[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]"></g-select>
      <g-input v-model="m.horario" label="Horario preferido" name="horario"></g-input>
    </g-form-layout>
  </g-form-section>
</template>
```

- **El botón.** `hN > button type="button"`: el título entero es el botón, su nombre es el título y no cambia; el estado lo dice `aria-expanded` (`"true"`/`"false"`, siempre presente) y `aria-controls` apunta al panel. El panel **no** lleva `role="region"` ni nombre (diez regiones serían ruido). La insignia `optional` va **fuera** del botón, así que ser opcional no cambia su nombre. La sección es una `<section>` sin `aria-labelledby`: no es un punto de referencia, la navegación la dan los encabezados.
- **Plegada.** El panel pasa a `inert` y `visibility: hidden` (Tab lo salta, no se lee), con altura 0 y sin hueco: la sección acaba donde acaba su encabezado. **Los campos siguen montados, registrados y en `FormData`**, y bloquean el envío si tienen errores (lo contrario a propósito de `GFormReveal` cerrado y de `addable` sin agregar). Descripción, acciones y ayuda se ven plegada y abierta, para que el título no se mueva al abrir.
- **Línea de resumen.** Plegada y solo si hay algo que decir, debajo del título aparece una línea con, en este orden: el **recuento de errores** (automático, ver abajo) y el **texto de tu aplicación** (`summary` o slot `summary`; el slot gana). Grana **no sabe** si una sección está completa (no valida): no hay estado «completa» automático, lo escribes tú («Completa», «Español · CDMX», «Falta el teléfono»). Abierta, la línea no existe. Está unida al botón con `aria-describedby` solo mientras existe, de modo que al llegar al botón se oye título, botón, contraído y el estado. No es una región viva. El slot admite texto, un `GIcon` (con o sin `label`) o un `GBadge`; **nada interactivo** (un enlace o botón en la línea avisa en desarrollo: es la descripción del botón y no se puede usar).
- **Guía de contenido.** Si una acción de la sección cambia campos de ella (por ejemplo, «Usar el correo del paciente»), refleja su efecto en `summary` para que, plegada, se vea el resultado (`#fx-2` del playground).
- **Recuento de errores.** Plegada, la sección dice «N errores» con el icono `circle-alert` (texto e icono, nunca solo color). Cuenta **preguntas** con **error ya visible**: las que el campo pinta, por la prop `error` o porque `errors[name]` ya se reveló por las reglas de siempre. Un grupo (`GFieldGroup`, `GCheckboxGroup`, `GInputGroup`, `GRadioGroup`) cuenta **uno**; sus partes no. No cuentan advertencias, campos deshabilitados ni inactivos (un `GFormReveal` cerrado dentro). Una sección que contiene otra suma también las preguntas de la interior. El texto es `labels.sectionErrors` de `GForm`, compartido por todas las secciones (ver [Textos](#textos-de-gform)); sin texto no se pinta el estado y `GForm` avisa una vez. **Fuera de `GForm` no hay estado de errores**: la línea solo muestra `summary`. Una plegada no anuncia lo que el usuario aún no provocó.
- **Se abre sola cuando hace falta.** Al **enviar con un error que bloquea** y con `showErrors()`, se abren, en un cuadro y **sin animar**, todas las plegadas que contienen un error que bloquea, antes de mover el foco (al resumen o al primer inválido); las plegadas sin errores siguen plegadas. El **enlace del resumen de errores** (`GErrorSummary`) y `focusFirstError()` abren la que contiene el control y luego desplazan y enfocan. Sin animar porque con la transición el desplazamiento hacia el campo recortaba el cuerpo (80px de desplazamiento interno medidos por kiwi en los tres motores antes de adoptarlo; en la auditoría, con esta apertura, 0px y la etiqueta a la vista). Funciona dentro y fuera de `GForm` (resumen con `errors` propios) y con secciones anidadas. Cada apertura emite `update:open(true)`: tu `v-model:open` ve el estado real.
- **Foco.** Con el teclado, el foco se queda en el botón al abrir y al plegar (con el ratón en WebKit, ver [Limitaciones conocidas](#limitaciones-conocidas)). **Plegar por programa** (`open` pasa a `false` desde tu aplicación) **con el foco dentro** lo lleva al botón **antes** de aplicar `inert` y sin desplazar: nunca queda en `<body>`.
- **`readonly` y `disabled` de `GForm`.** Plegar y abrir siguen funcionando (consultar no es editar); el botón nunca se deshabilita.
- **Sin teclas propias ni flechas** entre encabezados: las secciones no forman un grupo (puede haber varias abiertas y campos entre ellas), así que no es un acordeón de APG con navegación por flechas.
- **`open`** (`v-model:open`): controlado y no controlado. La sección guarda un estado local que parte de `open` y lo sigue cuando la prop cambia; sin `v-model` funciona igual (tu aplicación no se entera).

### Movimiento

Altura y margen del panel con `--g-duration-slow`; fundido con `--g-duration-fast` (al abrir termina con la altura; al plegar es corto desde el principio); el chevron gira con `--g-duration-fast`. Es la transición de [`GFormReveal`](../GFormReveal/README.md#movimiento): una rejilla de una pista `0fr → 1fr` (no se mide ninguna altura). **No se anima al montar** (`is-ready` llega tras el primer pintado). Con `prefers-reduced-motion: reduce`, altura y margen cambian en un cuadro y el **fundido se conserva**; al plegar el panel sigue visible mientras se funde y ya es `inert`; el chevron cambia sin giro.

Lo medido con clic real en los tres motores (ver [Accesibilidad](#accesibilidad-y-cifras-medidas)): el botón y el desplazamiento no se mueven en ningún cuadro al abrir y al plegar (Δ0), a media vista, pegado arriba, en RTL y con el encabezado al lado.

## Agregable: `mode="addable"`

Para un bloque que **el usuario decide incluir** («Datos fiscales», «Acompañante»). Sin agregar es **una acción, no un encabezado**: un botón «Agregar …» con la descripción debajo. «Quitar» **descarta**.

```vue
<script setup>
import { reactive, ref, watch } from 'vue'

const fiscal = ref(false)
const m = reactive({ rfc: '', razon: '' })
const labels = {
  add: 'Agregar datos fiscales',
  remove: 'Quitar datos fiscales',
  removeTitle: '¿Quitar los datos fiscales?',
  removeBody: 'Se descartará lo que escribiste en esta sección.',
  removeConfirm: 'Quitar',
  removeCancel: 'Cancelar'
}

// update:added(false) ES «el usuario quitó la sección»: el modelo es tuyo, vacíalo aquí
watch(fiscal, (agregada) => { if (!agregada) Object.assign(m, { rfc: '', razon: '' }) })
</script>

<template>
  <g-form-section title="Datos fiscales" description="Solo si el paciente pide factura." mode="addable" :labels="labels" v-model:added="fiscal" divider>
    <g-form-layout>
      <g-input v-model="m.rfc" label="RFC" name="rfc"></g-input>
      <g-input v-model="m.razon" label="Razón social" name="razon"></g-input>
    </g-form-layout>
  </g-form-section>
</template>
```

- **`labels`: textos completos, sin valores por defecto.** `add` es el texto y el nombre accesible de «Agregar …»; el título solo («Datos fiscales») no dice la acción y una plantilla con `{title}` rompería mayúsculas y concordancia. `remove` es único en la página («Quitar datos fiscales»). `removeTitle`, `removeBody` (opcional), `removeConfirm` y `removeCancel` son el diálogo de confirmación. **Sin `add`** no se pinta «Agregar …» (tu aplicación aún puede agregar con `added`); **sin `remove`** no se pinta «Quitar …»; **sin `removeTitle`, `removeConfirm` o `removeCancel`, «Quitar …» quita sin confirmar** (no se pinta un diálogo sin nombre ni botones sin texto). Cada situación avisa en desarrollo.
- **Sin agregar.** `GBtn` `outline` neutral con `plus` y `labels.add`; la descripción de la sección, debajo, unida al botón por `aria-describedby`. **Sin `hN`**: un encabezado sin contenido mentiría al navegar por encabezados. La raíz es una `<section>` siempre (el `id` del anclaje no salta). Sin `aria-expanded`: inserta, no divulga. Los campos del cuerpo (montados, `inert`, `fieldset role="none" disabled`) **no van en `FormData` ni en la validación nativa, no se pueden enfocar y su registro es inactivo**: aunque tu aplicación calcule `errors` sin condiciones, no bloquean el envío ni salen en el resumen (la misma técnica que [`GFormReveal`](../GFormReveal/README.md#datos-errores-y-envío-con-gform), #276).
- **Agregar** (por el usuario): emite `update:added(true)`, el botón se sustituye por el encabezado y el panel crece con la transición. **El foco va al título** (`tabindex="-1"`, sin desplazar): contexto antes que campo; Tab desde ahí llega a las acciones, a «Quitar …» y al primer campo. No cambia `dirty` (aún no hay datos). **Agregar por programa** (`added` pasa a `true` desde tu aplicación: datos ya guardados) **no mueve el foco** y hace que quitar pida confirmación.
- **Quitar descarta.** Emite `update:added(false)`, el cuerpo **se vuelve a montar** (lo no controlado se vacía) y la sección vuelve a «Agregar …». Tu aplicación vacía **su** modelo al recibir `false` (receta de arriba); Grana no posee los valores. Sus campos vuelven a inactivos y a «sin editar ni revelar», y sus errores salen **en silencio** del resumen. Volver a agregar empieza **vacía y sin errores a la vista**. Quitar (del usuario) **sube `dirty`** de `GForm`: descartar datos es un cambio. Quitar **por programa** (`added` pasa a `false` desde tu aplicación) descarta igual.
- **Confirmación con `alertdialog`.** Solo **cuando hay algo que perder**: el usuario escribió en la sección desde que la agregó (un `input` o `change` nativo en el cuerpo, o el cambio de un campo de Grana dentro), **o la sección la agregó la aplicación** (datos guardados que no se recuperan repitiendo una acción; WCAG 3.3.4). Si la agregó el usuario y no escribió nada, quita directo. El diálogo es un `GDialog` `role="alertdialog"` `size="sm"`, último hijo de la `<section>`, con `title` = `removeTitle`, `description` = `removeBody`, **«Cancelar»** primero (`outline` neutral, con `autofocus`: la acción segura) y **`removeConfirm`** (`solid` `danger`). Cancelar o Esc cierran y el foco vuelve a «Quitar …». Confirmar quita en el acto y, al terminar de cerrarse el diálogo, enfoca «Agregar …».
- **`readonly` y `disabled` de `GForm`.** No hay «Agregar …» ni «Quitar …» (editar la estructura es editar); una agregada se ve con sus datos; una **sin agregar no se pinta** (`hidden` en la raíz: en modo vista no hay nada que mostrar).
- **`optional` en `addable`:** no se pinta la insignia (el botón «Agregar …» ya dice que es opcional) y avisa; sigue suprimiendo el «(opcional)» de sus campos.
- **`added`** (`v-model:added`): controlado y no controlado, como `open`.

### Frente a `GFormReveal`

| | `GFormReveal` | `GFormSection addable` |
| --- | --- | --- |
| Lo decide | **Una respuesta** (`when`, de tu aplicación) | **El usuario**, con un botón explícito |
| Cerrado o quitado | **Conserva** lo escrito (3.3.7: una respuesta cambia de paso con las flechas) | **Descarta** (con confirmación si hay algo que perder) |
| Título y encabezado | Ninguno | `hN` cuando existe |

`GFormSection collapsible` no saca nada del envío. Los tres comparten la técnica de transición.

## Encabezado al lado: `headerPlacement="auto"` y acciones que bajan de línea

`headerPlacement` vale `top` (el encabezado arriba, por defecto) o `auto`: con `auto`, el encabezado va **al lado** del cuerpo (`is-header-side`) cuando el **ancho propio** de la sección es ≥ `space × 200` (800px con el tema por defecto, `space` = `--g-space-1` = 4px; con menos, arriba). Lo mide un `ResizeObserver` **compartido** por todas las secciones, y las escrituras van en `requestAnimationFrame` y solo si cambian. No usa `@container` (su condición no admite `var()`). Con SSR y antes de la primera medida, arriba.

```vue
<g-form-section title="Contacto" optional header-placement="auto" divider>
  <g-form-layout>…</g-form-layout>
</g-form-section>
```

- **Al lado:** dos columnas, encabezado · cuerpo, en proporción 1 : 2 separadas por el aire de sección (40px). En la columna del encabezado se apilan título, línea de resumen, descripción, **acciones (debajo, al inicio)** y ayuda. El título queda alineado con la **primera etiqueta** de la primera fila (medido: Δ 0px). En RTL el encabezado va a la derecha. En `collapsible` plegada, la fila mide el encabezado; en `addable` sin agregar, «Agregar …» ocupa el ancho entero.
- **Receta: todas las secciones de un formulario con el mismo `headerPlacement`.** Mezclar `top` y `auto` en un mismo formulario hace que unas secciones tengan el título arriba y otras al lado; elige uno para el formulario. Dentro de un `GDialog` o un panel estrecho, `auto` cae en `top` solo.
- **Acciones que bajan de línea (L9, vale también para la sección fija).** Con acciones en el encabezado, el título conserva al menos **`space × 40`** (160px con el tema por defecto). Cuando no cabe junto a las acciones, estas pasan a su propia línea, **al inicio y después de la descripción** (`is-actions-below`), y el orden visual vuelve a ser el del DOM. Lo mide la propia sección con el ancho natural de las acciones. Medido a 320px: título de **286px** en «Información básica» (Fase 1, `static`) y en `#fx-2` (plegable); a 480px, «Información básica» conserva la acción al lado. Una acción `ghost` apilada se alinea por su texto con la descripción (±0,5px a 320px en la Fase 1 y en la plegable).

## Línea con la sección anterior: `divider`

Por defecto dos secciones se separan **solo por espacio** (`--g-form-section-gap` × densidad) y por su título; #192 no se reabre. Donde aporta una línea es en las cabeceras de secciones **plegadas**, que no tienen cuerpo que dé aire. Para eso está `divider`:

```vue
<g-form-section title="Preferencias" mode="collapsible" divider>…</g-form-section>
```

- Dibuja un `GDivider` real (`<hr aria-hidden="true">`, `decorative`, `emphasis="subtle"`, `inset="none"`), primer hijo de la `<section>`, **dentro del hueco** que ya separa las secciones: **ninguna distancia cambia**, ni dentro ni fuera de `GForm`. La línea queda centrada en el hueco (±0,5px) y a todo el ancho de la sección, también con el encabezado al lado.
- **No hay línea en la primera sección** (una regla de CSS, sin JS): vale en SSR, con secciones que aparecen por `v-if` y con una agregable `[hidden]` en `readonly`. Nunca va entre la última sección y `GFormActions`.
- Medido en los tres motores: separación entre secciones de **40 / 35 / 30px** en las densidades `default` / `comfortable` / `compact` dentro de `GForm`, y **40px** en `#fx-frame` (fuera de `GForm`), con plegada y con abierta, agregable sin agregar y agregada.
- **No pongas un `GDivider` a mano entre dos secciones**: rompe el ritmo (81px en lugar de 40 dentro de `GForm`; 1px fuera). `GFormSection` avisa en desarrollo: «entre secciones la separación es el espacio; para una línea, usa `divider` en la sección».

## Textos de `GForm`

Dos claves de `labels` de `GForm` (sin valores por defecto) son de las secciones:

| Clave | Para qué | Si falta |
| --- | --- | --- |
| `sectionOptional` | Insignia de `GFormSection optional` («Opcional») | Aviso en desarrollo; sin insignia |
| `sectionErrors` | Estado de errores de una sección plegable plegada: **String** con `{count}` o **Function** `(count) => String` (plurales del idioma) | Aviso de `GForm` la primera vez que una plegada tiene errores visibles; **sin estado** (un icono solo no basta, 1.4.1) |

```js
const labels = {
  sectionOptional: 'Opcional',
  sectionErrors: (n) => (n === 1 ? '1 error' : `${n} errores`) // o 'errores: {count}'
}
```

## API

### Props

| Prop | Tipo | Valores | Por defecto | Qué es |
| --- | --- | --- | --- | --- |
| `title` | String | | | Título (o slot `title`); sin él avisa |
| `description` | String | | | Descripción (o slot `description`) |
| `headingLevel` | Number | 2 a 6 | el de `GForm` (3) | Nivel del `hN` |
| `optional` | Boolean | | `false` | Insignia `labels.sectionOptional` de `GForm` (fuera del botón en `collapsible`; no se pinta en `addable`) y sin «(opcional)» en sus campos |
| `mode` | String | `static` `collapsible` `addable` | `static` | Estructural: se espera fijo (si cambia tras montar, avisa y se pinta en el modo nuevo) |
| `open` | Boolean | | `false` | `v-model:open`; solo `collapsible` |
| `added` | Boolean | | `false` | `v-model:added`; solo `addable` |
| `summary` | String | | | Texto de estado de tu aplicación en la línea de resumen; solo `collapsible` y solo plegada (el slot `summary` gana) |
| `headerPlacement` | String | `top` `auto` | `top` | `auto`: al lado con ancho propio ≥ `space × 200` |
| `divider` | Boolean | | `false` | Línea decorativa con la sección anterior |
| `labels` | Object | `add` `remove` `removeTitle` `removeBody` `removeConfirm` `removeCancel` | `{}` | Solo `addable`; textos completos, sin valores por defecto |

`id`, `class` y demás atributos van a la `<section>`. El `id` (el tuyo, o uno generado) es la **base** de los `id` internos (`{id}-toggle`, `{id}-panel`, `{id}-summary`, `{id}-add-description`, `{id}-title`); el generado no se escribe en la raíz. Los anclajes usan el `id` que tú pongas.

### Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:open` | Boolean | `collapsible`: el usuario abre o pliega con el botón, **y también** al abrirse para llevar a un campo (envío con error, `showErrors()`, enlace del resumen, `focusFirstError()`): tu aplicación ve el estado real |
| `update:added` | Boolean | `addable`: «Agregar …» (`true`) o quitar (`false`, tras confirmar si hubo diálogo). `false` **es** «el usuario quitó la sección»: tu aplicación vacía su modelo |

**No hay otros** (ni `toggle`, `add` ni `remove`). Quien necesite el final de la animación escucha el `transitionend` nativo en `__panel`.

### Slots

| Slot | Contenido |
| --- | --- |
| `lead` | Icono decorativo antes del título (normalmente un `GIcon`; ver arriba) |
| `title` | Título rico (dentro del `hN`; en `collapsible`, dentro del botón); nada interactivo |
| `description` | Descripción rica (en `addable` sin agregar, debajo de «Agregar …» y unida a él por `aria-describedby`) |
| `summary` | Texto de estado de tu aplicación (solo `collapsible` plegada); admite `GIcon` o `GBadge`, nada interactivo |
| `actions` | Acciones secundarias de la sección (`GBtn` `ghost` u `outline`), visibles abierta y plegada; en `addable`, antes de «Quitar …». Nunca la acción primaria del formulario |
| `help` | Ayuda contextual (`GHelper`) |
| por defecto | Un `GFormLayout` con los campos, o contenido que no son campos |

### Métodos del formulario que tocan a la sección

`GForm` expone `showErrors()` y `focusFirstError()`, que **abren** antes las plegadas que contienen el error. `focusFirstError()` devuelve **`Promise<boolean>`** (`true` si encontró un control): con una sección que abrir, el foco llega tras un `nextTick`; si necesitas el foco ya puesto, espéralo (`await form.focusFirstError()`). Ver [`GForm/README.md`](../GForm/README.md#api).

## Teclado

**Sin teclas propias.**

| Tecla | Acción |
| --- | --- |
| Tab / Mayús+Tab | Botón del título (`collapsible`), acciones, campos del panel abierto. Salta el panel plegado y la agregable sin agregar |
| Enter / Espacio en el botón del título | Abre o pliega (nativo); el foco se queda en el botón |
| Enter / Espacio en «Agregar …» | Agrega; el foco va al título |
| Enter / Espacio en «Quitar …» | Quita (el foco va a «Agregar …») o abre la confirmación (el foco, en «Cancelar») |
| Esc en la confirmación | Cancela; el foco vuelve a «Quitar …» |

## Accesibilidad y cifras medidas

Estructura según APG *Disclosure* (`hN > button`, nombre invariable, `aria-expanded`, `aria-controls`) y *Alert Dialog* para la confirmación; el estado de errores es texto + icono (1.4.1) en `aria-describedby`; el foco nunca queda en `<body>` al plegar o quitar (2.4.3); las plegadas con error se abren, así los errores siguen alcanzables (3.3.1); descartar con algo que perder pide confirmación (3.3.4); abrir no cambia el contexto (3.2.2); el título conserva `space × 40` de ancho (1.4.10).

Medido en el componente real con el tema por defecto y **28 combinaciones de tema** (por defecto, el de la auditoría de `GRadioGroup`, el «Tema de prueba» del playground y los once generados de Dark Color Presence, claros y oscuros), tres densidades, LTR y RTL, 1280/720/480/320px, `prefers-reduced-motion`, `pointer: coarse` y `forced-colors` emulado (Chromium). Resultados iguales en los tres motores (Chromium, Firefox y WebKit):

| Qué | Cifra |
| --- | --- |
| Contraste del título y del botón | **15,2:1** mínimo |
| Contraste de la descripción, de la línea de resumen y del chevron | **7,38:1** mínimo |
| Contraste del estado de errores | **4,51:1** (oscuro) y **5,49:1** (claro) |
| Contraste del texto de «Agregar …» | **4,58:1** (`neutral-text`) |
| Anillo de foco del botón (teclado) | **2px** sólido a **5,69:1**; no cambia la caja del título y ningún antepasado lo recorta |
| Objetivo del botón | ≥ 24px con puntero fino; **44px** con `pointer: coarse`, sin cambiar la caja del título |
| Título a 320px | **286px** (mínimo exigido `space × 40` = 160px) |
| Sangría de la descripción, la línea de resumen y las acciones abajo | = texto del título (±0,5px; también con `lead` y en RTL) |
| Chevron y `lead` | Centrados en la primera línea de un título de dos líneas (±0,75px) |
| Separación entre secciones con `divider` | **40 / 35 / 30px** (tres densidades) dentro de `GForm`, **40px** fuera; línea centrada ±0,5px |
| Anchos | Con todo abierto y agregado, a 320px sin desborde horizontal en `#fm-medium` ni en `#fx-frame` |
| Δ al abrir, plegar, agregar y quitar | **0** en el botón y en el desplazamiento, en cada cuadro |
| `is-ready` | Llega ≥ 2 cuadros después de montar; al cargar no corre ninguna transición |
| `forced-colors` (emulado, Chromium) | Chevron y botón en `ButtonText` con trazo `currentColor`; la línea del `divider` es un borde visible a **21:1**; el anillo se ve a **11,3:1**; el chevron se espeja en RTL |
| Quitar sin «salto a gris» | En el primer cuadro del fundido, con `disabled` e `inert` ya puestos, el color, fondo, borde y opacidad de un `GInput` y un `GSelect` no cambian (captura del panel igual, ≤ 8/255) |

## Tema y tokens

La sección **no añade tokens propios** (DECISIONS #291). Lee, con los valores de `defaults.css`:

| Token | Para qué |
| --- | --- |
| `--g-form-section-gap` | Separación entre secciones (× densidad) y posición de la línea de `divider` |
| `--g-space-1`, `--g-space-2`, `--g-space-3`, `--g-space-4` | Separaciones internas, sangría del chevron; `--g-space-1` es la unidad `space` de los umbrales `× 200` y `× 40` (constantes leídas por el JS) |
| `--g-duration-slow` | Altura y margen del panel |
| `--g-duration-fast` | Fundido y giro del chevron |
| `--g-ease-out`, `--g-ease-standard` | Curvas |
| `--g-color-text`, `--g-color-text-muted` | Título y botón; descripción y línea de resumen |
| `--g-color-danger-text` | Estado de errores |
| `--g-text-body-*`, `--g-text-body-sm-*`, `--g-text-title-sm-*`, `--g-font-ui` | Título (body, 600) y línea de resumen (body-sm) |
| `--g-focus-width`, `--g-focus-offset`, `--g-color-focus`, `--g-radius-xs` | Anillo del botón y del título enfocado |
| `--g-border-width` | Borde |

Las piezas que compone (`GBtn`, `GDialog`, `GDivider`, `GBadge`) traen los suyos. La sección **no redefine `--g-divider-inset`** (la línea va sin inset). Los valores van sin literales ni valores de respaldo; las únicas medidas literales son `24px` y `44px` (objetivo táctil) y `0s`.

## Clases

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-form-section` | `<section>` | Siempre |
| `g-form-section--mode-{static\|collapsible\|addable}` | Raíz | Siempre |
| `g-form-section--optional` | Raíz | `optional` (también en `addable`, aunque sin insignia) |
| `is-open` | Raíz | Panel visible: `collapsible` abierta o `addable` agregada (en el acto) |
| `is-added` | Raíz | `addable` agregada |
| `is-animating` | Raíz | Desde el cambio hasta que termina la transición del panel (o un temporizador de respaldo) |
| `is-ready` | Raíz | Tras el primer pintado; **no se pone en `static`** (sin transición) |
| `is-instant` | Raíz | Apertura para llevar a un campo: sin transición; en el mismo parche que `is-open`; se retira tras dos cuadros |
| `is-header-side` | Raíz | `headerPlacement="auto"` medido ≥ `space × 200` |
| `is-actions-below` | Raíz | Acciones en su propia línea (L9) |
| `[hidden]` | Raíz | `addable` sin agregar con `GForm` `readonly` o `disabled` |
| `__divider`, `__header`, `__heading`, `__lead`, `__title`, `__description`, `__actions`, `__help` | | Como en la sección fija |
| `__toggle`, `__chevron`, `__toggle-text` | Botón del título, su chevron y su texto | `collapsible` |
| `__summary`, `__status`, `__summary-text` | Línea de resumen; recuento de errores; texto de la aplicación | `collapsible` plegada con contenido |
| `__add`, `__add-button` | Contenedor y botón «Agregar …» | `addable` sin agregar y editable |
| `__remove` | «Quitar …» | `addable` agregada y editable |
| `__panel`, `__body` | Panel (rejilla; `inert` cerrado) y cuerpo (`div`; `fieldset role="none"` en `addable`) | `collapsible` y `addable` (el cuerpo, siempre) |
| `__confirm` | El `GDialog` de la confirmación | `addable` con los tres textos |

## Render de servidor (SSR)

Se pinta según `open` y `added` desde el primer HTML: `inert` (y, en `addable`, `disabled`) ya puestos, de modo que una plegada o una agregable sin agregar quedan fuera de Tab y, en `addable`, fuera del envío, antes de hidratar. Sin `is-ready`, y con el encabezado **arriba** y las acciones **al lado** hasta medir (renderizar lo pedido sin medida). Verificado con `renderToString` en las pruebas.

## Avisos de desarrollo

Prefijo `[Grana GFormSection]`; una vez por instancia; solo fuera de producción. **Ninguno cambia lo que se pinta.**

1. `open` (o `v-model:open`) con un modo que no es `collapsible`: se ignora.
2. `added` (o `v-model:added`) con un modo que no es `addable`: se ignora.
3. `summary` (prop o slot) con un modo que no es `collapsible`: no se pinta.
4. `addable` sin `labels.add` (sin «Agregar …»), sin `labels.remove` (sin «Quitar …») o sin `removeTitle`, `removeConfirm` o `removeCancel` (quita sin confirmar). Uno por situación; sin `removeBody` no avisa.
5. `optional` con `addable`: sin insignia.
6. Sin `title` ni slot `title`.
7. Algo interactivo (`a[href]`, `button`, `input`, `select`, `textarea`, `[tabindex]`) en la línea de resumen, comprobado al pintarse; un `GIcon` con `label` no avisa.
8. `mode` cambia tras montar.

Y los que ya existían: dentro de un `GFormReveal` («la sección contiene la pregunta y el bloque, no al revés»; solo por un `GFormReveal` por encima, no por una sección agregable); campos, `GFormRow` o `GFormReveal` directos en el cuerpo (#283); un `GDivider` a mano entre dos secciones. Además, `GForm` avisa si falta `labels.sectionErrors` cuando una plegada tiene errores visibles (aviso 2 de `GForm`).

## Limitaciones conocidas

- **Buscar en la página (Ctrl+F) no encuentra ni abre el contenido plegado** (`inert`). `hidden="until-found"` existe en los tres motores, pero nadie midió su convivencia con la rejilla, `inert` y la transición: pendiente no bloqueante (DECISIONS #291).
- **Al abrir una plegada desaparece la línea de resumen y lo de abajo salta (auditoría, hallazgo 3, aceptado).** La línea existe solo plegada («abierta no existe»), así que sale de golpe: en el primer cuadro lo que hay bajo el encabezado se mueve exactamente lo que mide la línea (22px hacia arriba al abrir y hacia abajo al plegar, medidos en los tres motores; con el encabezado al lado, −22 y +12) y después sigue el panel de forma continua. El botón y el desplazamiento están en Δ0 en cada cuadro: lo que el usuario mira no se mueve. Hacerlo continuo es un cambio de estructura (decide lima) y no se resuelve con CSS.
- **Corregido: `is-actions-below` parpadeaba un cuadro al pasar de «al lado» a arriba (auditoría, hallazgo 1).** Con acciones junto al título (`#fx-2` y `#fx-3` de 1280 a 720px) las acciones bajaban y subían en un cuadro, y en Firefox, tras varios cruces del umbral, la consola avisaba de que el anclaje del desplazamiento se desactivaba. Bruno lo corrigió en `c1d0af4`: la sección decide con el estado ya pintado (`is-header-side` en el DOM) y cada cruce del umbral cambia la clase una sola vez (prueba de vitest con dos medidas en el mismo cuadro y caso de Playwright con `MutationObserver`, 1280 ↔ 720 varias veces). No re-medí la consola de Firefox con `auditoria-verificar.mjs` tras la corrección.
- **WebKit: un clic de ratón no enfoca un botón** (comportamiento de macOS; hallazgo 4, sin verificar en Safari real). Tras plegar con el ratón el foco no queda en el botón, y si la confirmación de «Quitar …» se abrió con el ratón, Cancelar o Esc devuelven el foco a `<body>` y no a «Quitar …», porque `GDialog` lo devuelve a lo que estaba enfocado y no había nada. Con el teclado funciona en los tres motores. Afecta a cualquier `GDialog` abierto con el ratón en Safari; es un asunto de `GDialog` (bruno).
- **Plegar con la página desplazada hasta el final recorta el desplazamiento** (el navegador encoge la página; heredado de `GFormReveal`, #283): no se compensa.
- **`mode` se espera fijo.** Cambiarlo tras montar avisa y pinta en el modo nuevo con el estado de las props, pero no está pensado como una forma de alternar el comportamiento.
- **Si envías tu modelo, no el `FormData`**, tu aplicación recibe también los valores de una agregable sin agregar si no los vacía: hazlo con `update:added(false)` (receta de arriba). Grana no posee los valores.
- **Sin navegación lateral de secciones** (`GFormNav`) ni «Agregar …» de varias instancias de una misma sección: la Fase 3 los deja pendientes.
- **Sin verificar:**
  - un **lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): cómo se anuncia `hN > button` (encabezado y botón), el estado en `aria-describedby`, el `fieldset role="none"` sin grupo y el `alertdialog`;
  - **Safari, iOS y un dispositivo táctil reales**; `pointer: coarse` no se emula en Firefox;
  - **`forced-colors` real** de Windows (solo emulado en Chromium; en Firefox y WebKit no se emula);
  - el **zoom** del navegador al 200 %;
  - `GDatePicker` y `GCheckboxGroup` dentro de una agregable que se quita (en el playground solo hay `GInput` y `GSelect`; el «salto a gris» de `GBtn` y `GCheckboxGroup` está medido en el banco de coco), y `GSelect`, `GDatePicker`, `GCheckboxGroup` y `GFormReveal` dentro de plegadas;
  - **secciones dentro de un `GDialog`**;
  - **rendimiento con muchas secciones** y el `ResizeObserver` compartido.

## Verificación

- **Pruebas** (`GFormSection.test.js`, vitest con jsdom): 68 pruebas de avisos 1 a 8, `static` sin cambio de DOM, `collapsible` (estructura APG, nombre invariable, `aria-describedby` solo con línea de resumen, `inert` sin `fieldset`, `FormData` con las plegadas, controlado y no controlado, foco al plegar por programa), recuento de errores (preguntas, solo visibles, sin advertencias ni inactivos, propagado a la sección ancestro, `String` y `Function`), abrir antes de enfocar (envío, `showErrors()`, enlace del resumen dentro y fuera de `GForm`, `focusFirstError()`, anidadas), `addable` (registro inactivo, foco, confirmación, descartar, `dirty`, `readonly`), `headerPlacement` e `is-actions-below` con anchos simulados, SSR y claves internas. La suite completa de `@grana/vue` pasó 1778/1778 al cierre de la auditoría.
- **Navegador** (Playwright en Chromium, Firefox y WebKit sobre el componente real del playground): `form-section.spec.mjs`, con `form-distribution.spec.mjs` (plegable abierta en la prueba obligatoria de distribución) y `form-reveal.spec.mjs`: 72 pasan y 6 se omiten por diseño (puntero grueso y colores forzados solo se emulan en Chromium).
- **Auditoría de coco** con el componente real y temas distintos: `node design/lab/form-section/auditoria-verificar.mjs`, **1440/1440** comprobaciones en los tres motores, más 4 pendientes de bruno (hallazgo 1, corregido después en `c1d0af4`) que el verificador medía y listaba aparte; banco de estilo (`estilo-verificar.mjs`) 948/948. Detalle en [`design/lab/form-section/auditoria.md`](../../../../../design/lab/form-section/auditoria.md).

## Fuentes

- API: [`GFormSection.meta.json`](./GFormSection.meta.json) · Contrato: [`design/contracts/form.md`](../../../../../design/contracts/form.md), §3 «`GFormSection`» · Prototipo: [`design/lab/form/r02/`](../../../../../design/lab/form/r02/) (Fase 1) y [`design/lab/form-section/r01/`](../../../../../design/lab/form-section/r01/) (Fase 3) · Estilo: [`GFormSection.css`](./GFormSection.css) · Auditorías: [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md) y [`design/lab/form-section/auditoria.md`](../../../../../design/lab/form-section/auditoria.md)
- Decisiones en `DECISIONS.md`: #161 (sección fija), #192 y #290 (línea y `divider`), #203 (`lead`), #283 (el cuerpo no es una pila), #284 (API de la Fase 3), #285 (estructura plegable), #286 (recuento de errores), #287 (abrir antes de enfocar), #288 (agregable), #289 (encabezado al lado y acciones que bajan), #291 (sin tokens nuevos y pendientes), #292 (foco inicial de `GDialog`, que la confirmación usa)
- Sistema de formularios: [`GForm/README.md`](../GForm/README.md) · Bloque condicional: [`GFormReveal/README.md`](../GFormReveal/README.md)
