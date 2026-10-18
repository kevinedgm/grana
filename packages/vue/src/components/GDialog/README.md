# GDialog

Diálogo modal genérico con una **carcasa** exterior y una **superficie inset** interior: el contenido queda alojado dentro de la carcasa, a poca distancia de su borde y con radio concéntrico, como una sola pieza ensamblada. Sirve de base para formularios, confirmaciones, detalles, configuraciones, vistas previas y recorridos con pasos; no conoce ningún caso concreto.

**Etiqueta:** `<g-dialog>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/dialog/auditoria.md`](../../../../../design/lab/dialog/auditoria.md)) · **Desde:** 0.1.0

**Etiqueta:** `<g-dialog-step>` (pasos) · **Estado:** `candidate` (reauditoría de coco aprobada en los tres motores; ver [`design/lab/dialog/auditoria-pasos.md`](../../../../../design/lab/dialog/auditoria-pasos.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0` y un navegador con `<dialog>` (`showModal()`), `::backdrop` que herede variables y `:has()`: los actuales.

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

```vue
<!-- Fragmento: `abierto` y `guardar` son de tu aplicación -->
<g-dialog v-model="abierto" title="Guardar cambios" description="Se aplicarán a todo el equipo." close-label="Cerrar">
  <p>Contenido del diálogo.</p>
  <template #footer="{ close }">
    <g-btn variant="outline" @click="close">Cancelar</g-btn>
    <g-btn @click="guardar">Guardar</g-btn>
  </template>
</g-dialog>
```

El diálogo se abre y se cierra con `v-model`. **`closeLabel` no tiene valor por defecto** (Grana es internacional): sin él, el botón de cierre no se renderiza y en desarrollo se emite `console.warn`.

> **En plantillas dentro del HTML** (sin compilar), escribe `<g-dialog ...></g-dialog>`: Vue no admite etiquetas de componente autocerradas.

## En esta página

[§ Uso](#uso) · [§ Props](#props) · [§ Eventos](#eventos) · [§ Slots](#slots) · [§ Niveles anidados](#niveles-anidados-pasos-y-pliegues-580-a-591) · [§ Teclado y foco](#teclado-y-foco) · [§ Accesibilidad](#accesibilidad) · [§ Personalidad](#personalidad) · [§ Limitaciones conocidas](#limitaciones-conocidas)

## Estructura

**Carcasa → encabezado → superficie inset → cuerpo / secciones / pie.**

- **Carcasa:** un `<dialog>` nativo abierto con `showModal()`. El navegador resuelve la capa superior, el resto de la página inerte, el foco atrapado y Esc; no hay `Teleport` ni trampa de foco propia.
- **Encabezado:** título (`h2`), descripción opcional, icono opcional y acción de cierre.
- **Inset (`inset`, por defecto):** segunda superficie a poca distancia de la carcasa, con radio concéntrico. Aloja el cuerpo y el pie. Con `:inset="false"`, el contenido vive en la carcasa (diálogo simple).
- **Pie:** siempre fijo; solo el cuerpo se desplaza.
- **Con pasos** (§[Niveles anidados](#niveles-anidados-pasos-y-pliegues-580-a-591)): el encabezado lleva «Volver» al inicio y, con más de un paso, el hilo entre el encabezado y la inset; cada paso es un panel dentro del cuerpo y el pie es el del paso actual.

La profundidad viene de diferencias mínimas de fondo, bordes finos y sombras suaves, sin desenfoque de fondo.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` (`v-model`) | Boolean | | `false` |
| `title` | String | | sin valor |
| `description` | String | | sin valor |
| `size` | String | `sm` `md` `lg` | `md` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `inset` | Boolean | | `true` |
| `fullscreen` | Boolean | | `false` |
| `placement` | String | `center` `end` | `center` |
| `mobile` | String | `sheet` `full-width` `fullscreen` | `sheet` |
| `role` | String | `dialog` `alertdialog` | `dialog` |
| `closeLabel` | String | | sin valor |
| `closeOnBackdrop` | Boolean | | `true` |
| `loading` | Boolean | | `false` |
| `id` | String | | generado |
| `from` | String \| HTMLElement | `id` o elemento del disparador | sin valor |
| `steps` | Array\<String\> | historial de pasos (`v-model:steps`) | sin valor |
| `labels` | Object | `{ back, trail }` (pasos) | `{}` |

Un valor fuera de la lista muestra una advertencia en desarrollo. No hay `variant`: las composiciones salen de las props y los slots.

- **`modelValue`:** `true` abre, `false` cierra. El componente **nunca cambia el prop por su cuenta**: ante Esc, clic en el fondo o el botón de cierre emite `dismiss` y, si nadie lo impide, `update:modelValue` con `false`.
- **`title`:** nombre accesible del diálogo. Sin `title`, sin slot `title` ni `header` y sin `aria-label` ni `aria-labelledby`, en desarrollo hay `console.warn`. **En modo pasos no se usa:** el nombre es el `title` del paso actual.
- **`size`:** ancho de la carcasa en escritorio, derivado de `space` (con `space` 4: 400, 560 y 760px), siempre menor que el visor menos 8 unidades de `space`. No usa `xs`…`xl`, que son de controles.
- **`density`:** multiplica relleno y separación de la carcasa y la inset (1×, 0.875×, 0.75×). La tipografía no cambia, y el radio de la inset sigue siendo concéntrico.
- **`fullscreen`:** ocupa todo el visor en todos los anchos y conserva las dos superficies.
- **`placement`:** dónde se ancla en escritorio y tableta. `center` (por defecto), centrado. **`end`: hoja lateral** pegada al borde final (derecha en LTR, izquierda en RTL), de alto completo y con el ancho de `size` (400px con `space` 4 y `size="sm"`); entra deslizando desde el borde. Con un visor de hasta ~520px actúa `mobile` (hoja inferior por defecto) y `placement` no cambia nada; `fullscreen` gana sobre `placement`. Lo usan [`GWidgetGallery`](../GWidgetGallery/README.md) y [`GWidgetConfig`](../GWidgetConfig/README.md).
- **`mobile`:** estructura con un visor de hasta ~520px: `sheet` (hoja inferior pegada abajo, con esquinas superiores redondeadas y `safe-area-inset-bottom`), `full-width` (ancho completo con un margen pequeño) o `fullscreen`. `fullscreen` gana sobre `mobile`.
- **`role`:** `alertdialog` para una confirmación que exige decisión. Ver "Confirmaciones".
- **`closeOnBackdrop`:** un clic en el fondo emite `dismiss` con `reason: 'backdrop'`. Debe empezar y terminar en el fondo: un arrastre que empieza dentro no cuenta, y un clic en el relleno de la carcasa tampoco. **No descarta trabajo:** no hace nada con otro modal debajo (el diálogo apilado, #568), con más de un paso en el historial ni con un `GFormFold` abierto dentro.
- **`loading`:** `aria-busy="true"` en la carcasa y una barra fina de acento sobre la inset, **quieta** (sin animación infinita, #539). **No bloquea nada:** las acciones las controlas tú.
- **`from` (#583):** el elemento que abrió el diálogo, como `id` de cadena o como elemento. Se resuelve al abrir. Con `from`: el foco vuelve a él al cerrar (si sigue conectado y es usable) y es el origen de la animación de entrada (D1) también en WebKit con un clic de ratón (cierra el límite conocido de WebKit para quien lo pasa). Sin `from`, el comportamiento actual: `document.activeElement` al abrir, si está fuera y no es `body`.
- **`steps` y `labels`** (`back`, `trail`): ver §[Niveles anidados](#niveles-anidados-pasos-y-pliegues-580-a-591). `labels.back` admite `String` con `{title}` o función `(title) => string`.
- **Resto de atributos** (`class`, `style`, `data-*`, `aria-*`, escuchas): van al `<dialog>`.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `false` | El usuario intenta cerrar y nadie lo impidió; también ante un cierre nativo con el prop en `true` (por ejemplo un `<form method="dialog">`) |
| `dismiss` | `{ reason, depth, preventDefault() }` | El usuario intenta cerrar **el diálogo entero**. `reason`: `escape`, `backdrop` o `close`. **`depth`** (#582): número de pasos en el historial (1 sin pasos), para que la aplicación decida si confirma borradores. **Cancelable.** Bajar un paso no lo emite (emite `step`); Esc repetida (tecla mantenida) tampoco |
| `open` | | El diálogo ya se muestra |
| `closed` | | El diálogo ya se cerró, por el motivo que sea |
| `update:steps` | Array\<String\> | El historial de pasos cambia (§[Niveles anidados](#niveles-anidados-pasos-y-pliegues-580-a-591)) |
| `step` | `{ from, to, direction, reason, result }` | Tras un cambio de paso, ya pintado y con el foco puesto. `direction`: `'forward'` o `'back'`; `reason`: `'push'` \| `'back'` \| `'escape'` \| `'trail'`; `result`: el de `back({ result })`. No cancelable |

**`dismiss` es cancelable:** llama a `preventDefault()` de forma síncrona para mantenerlo abierto (por ejemplo, con cambios sin guardar). Esc funciona igual con y sin `preventDefault`, también en la segunda pulsación seguida.

```vue
<!-- Fragmento: `abierto` y `sinGuardar` son de tu aplicación -->
<g-dialog v-model="abierto" title="Editar" close-label="Cerrar" @dismiss="(e) => { if (sinGuardar && e.reason !== 'close') e.preventDefault() }">
  …
</g-dialog>
```

Un cierre por cambio de `modelValue` desde fuera **no** emite `dismiss`; solo `closed`.

## Slots

| Slot | Alcance | Contenido |
| --- | --- | --- |
| `default` | `{ close, push, back, backTo, steps }` | Cuerpo. Con pasos, aquí van los `GDialogStep`. Fuera del modo pasos, `steps` es `[]` y `push`, `back` y `backTo` no tienen uso |
| `footer` | `{ close, push, back, backTo, steps }` | Acciones. Solo se renderiza si el slot existe. **En modo pasos no se usa** (aviso en desarrollo): el pie es el `footer` del paso actual |
| `title` | | Título con contenido rico (sustituye a `title`) |
| `description` | | Descripción con contenido rico (sustituye a `description`) |
| `header` | `{ titleId, descriptionId }` | Sustituye título y descripción por completo. Usa esos ids si quieres el nombre accesible; el botón de cierre se conserva |
| `icon` | | Icono decorativo antes del título (normalmente un `GIcon`; sin icono por defecto). Va fuera del `h2`, con `aria-hidden`: no entra en el nombre del diálogo |

`close()` cierra por la vía `close`: emite `dismiss` (cancelable) y luego `update:modelValue`; no admite opciones. Para cerrar sin `dismiss`, cambia `modelValue`. El **contenido se monta al abrir y se desmonta al cerrar**: un formulario no conserva su estado entre aperturas. No pongas botones ni enlaces dentro de `title` ni `description`.

## Niveles anidados: pasos y pliegues (#580 a #591)

Un recorrido a veces necesita otra tarea cuyo resultado vuelve a la anterior (del detalle de un producto a registrar su ingreso). En vez de abrir un diálogo sobre otro, `GDialog` lo resuelve con **pasos** (`GDialogStep`): un solo `<dialog>`, un solo fondo, una sola trampa de foco y un hilo en el encabezado para volver a cualquier punto. Lo que falta para **un campo** de la tarea actual se crea en un **pliegue** (`GFormFold`) bajo ese campo. Los dos se combinan en el mismo recorrido.

> **Dónde vive cada pieza.** `GDialogStep`, `useDialogSteps` y el modo pasos están en el paquete principal (`@grana/vue`) y `app.use(Grana)` registra `GDialogStep`. `GFormFold` viene de la entrada propia [`@grana/vue/form-fold`](../GFormFold/README.md) (global UMD `GranaFormFold`): regístrala con `app.use` si usas pliegues. **Estado:** `GDialogStep` es `candidate` (reauditoría de coco, ver [Verificación de los niveles](#verificación-de-los-niveles)).

### Cuándo usar cada forma

| Situación | Forma | Por qué |
| --- | --- | --- |
| Falta un valor para un campo de la tarea actual (una categoría que no existe) | `GFormFold` bajo el campo ([README](../GFormFold/README.md)) | Lo que se está llenando no se tapa y no hay capas nuevas |
| Otra tarea del mismo recorrido cuyo resultado vuelve a la anterior (del detalle al ingreso) | Un paso, `GDialogStep` | Un solo modal; el hilo deja volver a cualquier punto |
| Algo independiente que no devuelve un valor (confirmar un descarte) | Otro `GDialog` encima, normalmente `role="alertdialog"` | No es un nivel del recorrido; funciona con un solo fondo y Esc de uno en uno (#565 a #568) |
| Un proceso conocido y lineal (paso 1 de 4) | [`GStepper`](../GStepper/README.md) | El historial de pasos **crece por lo que falta**; no es un indicador de progreso |
| Navegar entre páginas | `GBreadcrumbs` | El hilo son botones de un historial interno, no enlaces |

### Pasos: uso mínimo

```vue
<!-- Fragmento: `abierto`, `pasos` y `boton` son de tu aplicación -->
<g-dialog
  v-model="abierto"
  v-model:steps="pasos"
  :from="boton"
  close-label="Cerrar"
  :labels="{ back: 'Volver a {title}', trail: 'Recorrido' }">

  <g-dialog-step name="detalle" title="Ácido clorhídrico 37 %" description="Detalle de producto">
    <template #default="{ push }">
      <p>Existencias: 200 L</p>
      <g-btn id="ir-ingreso" @click="push('ingreso', { from: 'ir-ingreso' })">Registrar ingreso</g-btn>
    </template>
  </g-dialog-step>

  <g-dialog-step name="ingreso" title="Ingreso desde orden de compra" description="Entrará en Ácido clorhídrico 37 %">
    <template #default>
      <!-- formulario del ingreso -->
    </template>
    <template #footer="{ back }">
      <g-btn variant="ghost" color="neutral" @click="back()">Cancelar</g-btn>
    </template>
  </g-dialog-step>
</g-dialog>
```

- **Los pasos se declaran como hijos** de `GDialog`, todos los posibles y en cualquier orden. El modo pasos (clase `g-dialog--steps`) se activa con al menos un `GDialogStep`.
- **`steps` es el historial:** un arreglo de nombres cuyo último elemento es el paso actual. Con `v-model:steps` la aplicación lo guarda; sin él, el historial es interno, empieza en el **primer paso declarado** y vuelve a él tras `closed`. Con `v-model:steps`, tras `closed` decides tú qué hace el historial (receta: reiniciarlo en `@closed`). Para abrir directamente en un paso hondo, pon `steps` antes de abrir. Un nombre que no es de ningún paso, o repetido en el historial, se ignora con un aviso en desarrollo: el mismo paso no se abre dos veces.
- **Montaje:** un paso solo se monta mientras está en el historial. Los que quedan debajo del actual siguen montados, ocultos (`hidden`) e inertes; el paso que sale del historial se desmonta.
- **Lo que en modo pasos no se usa:** las props `title` y `description` y los slots `title`, `description`, `header` y `footer` de `GDialog` (el nombre, la descripción y el pie son los del paso actual; dan aviso en desarrollo). El slot `icon` sí se conserva, común a todos los pasos. El slot `tabs` no se combina con pasos (aviso; reservado). `size` es **uno para todos los pasos**: `size` por paso está reservado.
- **Cierre (X):** cierra el recorrido entero, no un paso (`dismiss` con `reason: 'close'` y `depth`).

### Referencia · `GDialogStep`

| Prop | Tipo | Requerida | Descripción |
| --- | --- | --- | --- |
| `name` | String | Sí | Único entre los pasos del mismo `GDialog` (aviso si se repite). Es lo que lleva el historial |
| `title` | String | No (aviso si falta) | Nombre del paso: `h2` del encabezado, nombre del panel y del hilo |
| `description` | String | No | Propósito del paso (adónde va su resultado): descripción del diálogo mientras el paso es el actual |
| `summary` | String | No | Lo que el paso espera o lleva, en corto («OC-2291 · 3 partidas»): se **lee** en el hilo tras el título (texto oculto accesible); no se pinta |

| Slot | Alcance | Contenido |
| --- | --- | --- |
| `default` | `{ close, push, back, backTo, steps }` | Contenido del paso, en su panel (`g-dialog__step`) dentro del cuerpo |
| `footer` | `{ close, push, back, backTo, steps }` | Acciones del paso: `GDialog` lo pinta en su pie cuando el paso es el actual |

`GDialogStep` no tiene eventos propios (el diálogo emite `step`) y `class`, `data-*` y las escuchas van al panel. Fuera de un `GDialog` no pinta nada y avisa en desarrollo.

### Referencia · navegar entre pasos

Estas operaciones están en el alcance de los slots `default` y `footer` de `GDialog` y de `GDialogStep`, en `useDialogSteps()` y en la instancia del `GDialog` (`ref` con `push`, `back` y `backTo`).

| Operación | Efecto |
| --- | --- |
| `push(name, { from } = {})` | Añade `name` al historial y lo hace actual. `from` (`id` o elemento) es el disparador al que se vuelve; por defecto, el elemento con el foco dentro del diálogo. Con el diálogo cerrado no hace nada y avisa (abrir es `modelValue`); un `name` desconocido o ya abierto se ignora con aviso |
| `back({ result, focus, announce } = {})` | Quita el paso actual y vuelve al de abajo. `focus` y `announce`: ver «Devolver un resultado» abajo. `result` (cualquier valor) **no lo usa Grana**: viaja en el evento `step`. Con un solo paso en el historial equivale a `close()` |
| `backTo(name, { focus, announce } = {})` | Salta de un golpe a un paso anterior del historial y quita todos los de encima. Un solo evento `step` |
| `close()` | Cierra el recorrido entero por la vía `close`: emite `dismiss` (cancelable) y luego `update:modelValue`. **No admite opciones** (a diferencia del `close` de `GFormFold`) |
| `steps` | Copia del historial (arreglo de nombres) |

```js
import { useDialogSteps } from '@grana/vue'

// Dentro del contenido de un GDialog (en un componente hijo); fuera de un GDialog devuelve null
const { steps, current, depth, push, back, backTo } = useDialogSteps()
// steps, current y depth son refs de solo lectura: steps.value → ['detalle', 'ingreso'], depth.value → 2
```

**Evento `step`** (`{ from, to, direction, reason, result }`): se emite **tras pintar el paso nuevo y poner el foco**; no es cancelable (bajar nunca borra: no hay nada que confirmar).

| Campo | Valores |
| --- | --- |
| `from` · `to` | Nombre del paso que se deja · nombre del paso al que se llega |
| `direction` | `'forward'` al ir más hondo · `'back'` al bajar |
| `reason` | `'push'` · `'back'` (`back`, `backTo` o «Volver») · `'escape'` (Esc) · `'trail'` (un paso del hilo) |
| `result` | El `result` de `back({ result })`, si se dio |

Cada cambio de historial emite también `update:steps`.

### Referencia · el encabezado, «Volver» y el hilo

- **Encabezado:** muestra el `title` y la `description` del **paso actual** en el `h2` y el `p` de siempre; el `<dialog>` cambia su nombre y su descripción accesibles a los del paso actual.
- **«Volver»** (`g-dialog__back`): con más de un paso, un botón al inicio del encabezado, con el icono `chevron-left` (se espeja en RTL) y el nombre de `labels.back`. Baja exactamente un paso. Sin `labels.back` no se pinta y avisa en desarrollo (Esc y el hilo siguen bajando).
- **El hilo** (`g-dialog__trail`): con más de un paso, un `nav` bajo el encabezado con el nombre de `labels.trail` (sin él, `nav` sin nombre y aviso). Un `li` por paso del historial. Los pasos anteriores son **botones** (`type="button"`) que llevan a ese paso de un salto (`backTo`, `reason: 'trail'`); el actual es un `span` con `aria-current="step"`, no enfocable. El nombre de cada botón es el título, una coma y el `summary` del paso, si lo hay. **Visible:** los lejanos, solo su número; el **padre** (adonde lleva «Volver») enseña número y título; el actual, número y título en acento. En anchos estrechos el título del padre cede con puntos suspensivos (el nombre sigue en el árbol de accesibilidad).

| Clave de `labels` | Para qué | Obligatoria si… |
| --- | --- | --- |
| `back` | Texto de «Volver». `String` con `{title}` (el título del paso de abajo: `'Volver a {title}'`) o función `(title) => string` | Hay más de un paso |
| `trail` | Nombre accesible del `nav` del hilo (`String`) | Hay más de un paso |

### El pie de cada paso

Cada `GDialogStep` trae **su propio slot `footer`** y `GDialog` solo pinta el del paso actual; el `footer` de `GDialog` no se usa en modo pasos. Por qué:

- Las acciones dependen del paso: «Cancelar» baja con `back()` y el botón de enviar apunta al formulario de **ese** paso (`<g-btn type="submit" form="f-ingreso">`).
- El pie queda fuera del `<form>` del paso: `form="id"` es lo que une su botón de enviar con el formulario de ese paso.
- Al cambiar de paso el pie se vuelve a montar con una clave por paso, de modo que `id`, `type`, `form`, `variant` y `color` de los botones son siempre los del paso actual (cerrado en 8e3c300 con una prueba de plantilla compilada: antes, Vue reutilizaba el pie del paso anterior y dejaba sus atributos estáticos).
- Si el botón que abrió un paso estaba **en el pie** del paso de abajo, ese pie se reconstruyó: dale un `id` (o pasa `from` con su `id`) y al volver el foco lo encuentra por `id`.
- Un paso sin `footer` no tiene pie.

### Ejemplo 1 · Del detalle de un producto a registrar su ingreso

**Por qué un paso:** registrar el ingreso es otra tarea con su formulario y sus propias acciones, y su resultado vuelve al detalle. No es un campo que falte (sería un pliegue) ni algo independiente (sería otro diálogo). Con el hilo, quien se pierde vuelve al detalle de un toque.

```vue
<!-- Fragmento: `abierto`, `pasos`, `boton`, `errores` y `guardarIngreso` son de tu aplicación -->
<script setup>
function registrar(back) {
  guardarIngreso()                      // la aplicación escribe el valor en SU modelo
  back({ focus: 'ir-ingreso', announce: 'Ingreso registrado: 3 partidas en Almacén central.' })
}
</script>

<template>
  <g-dialog v-model="abierto" v-model:steps="pasos" :from="boton" close-label="Cerrar"
            :labels="{ back: 'Volver a {title}', trail: 'Recorrido' }" @closed="pasos = []">
    <g-dialog-step name="detalle" title="Ácido clorhídrico 37 %" description="Detalle de producto">
      <template #default="{ push }">
        <p>Existencia: 48 L en Almacén central.</p>
        <g-btn id="ir-ingreso" @click="push('ingreso', { from: 'ir-ingreso' })">Registrar ingreso…</g-btn>
      </template>
    </g-dialog-step>

    <g-dialog-step name="ingreso" title="Ingreso desde orden de compra" description="Entrará en Ácido clorhídrico 37 %" summary="OC-2291 · 3 partidas">
      <template #default="{ back }">
        <g-form id="f-ingreso" :errors="errores" :labels="{ error: 'Error:' }" @submit="registrar(back)">
          <!-- campos del ingreso -->
        </g-form>
      </template>
      <template #footer="{ back }">
        <g-btn variant="ghost" color="neutral" @click="back()">Cancelar</g-btn>
        <g-btn type="submit" form="f-ingreso">Registrar ingreso</g-btn>
      </template>
    </g-dialog-step>
  </g-dialog>
</template>
```

**Devolver un resultado:** Grana presenta y emite intención, no toca tus datos. Tú escribes el valor en tu modelo y bajas con `focus` y `announce`:

1. **`focus`** (`id` o elemento): el campo que recibió el valor recibe el foco y una marca breve de llegada (`data-g-landed`, decorativa). Si no lo das o no es utilizable, el foco va al `from` del paso que se cierra y, si tampoco, al orden de #292 del paso de abajo.
2. **`announce`:** un texto **tuyo**, sin valor por defecto (sin él no se anuncia nada). Va al canal cortés (`aria-live="polite"`) de la página, dentro del `<dialog>` modal; nunca asertivo.

**Confirmar con error no baja:** si el valor no es válido, no llames a `back()`; el `GForm` del paso revela y enfoca el primer error.

### Ejemplo 2 · Crear lo que falta dentro de un paso

**Por qué un pliegue y no otro paso:** el producto «Tris base» no está en el catálogo y es un valor para un **campo** del ingreso. Un pliegue bajo el campo no tapa lo que se llena, no abre otra capa y el diálogo crece hacia abajo con su borde superior fijo. Si crear el producto fuera una tarea grande por sí misma, sería otro paso.

```vue
<!-- Fragmento: `productos`, `producto`, `creando`, `nuevo`, `errores`, `erroresProducto`, `crearProducto` y `registrar` son de tu aplicación -->
<g-dialog-step name="ingreso" title="Ingreso desde orden de compra" description="Entrará en Ácido clorhídrico 37 %">
  <template #default>
    <g-form id="f-ingreso" :errors="errores" :labels="{ error: 'Error:' }" @submit="registrar">
      <g-form-layout>
        <g-select
          id="f-ingreso-producto"
          v-model="producto"
          label="Producto"
          name="producto"
          :options="productos"
          create-label="Crear producto…"
          @create="creando = true" />
        <g-form-fold
          v-model:open="creando"
          title="Producto nuevo"
          description="Se elegirá en el campo Producto."
          for="f-ingreso-producto"
          :errors="erroresProducto"
          :labels="{ pending: 'Termina o cancela «{title}» antes de registrar.' }"
          @confirm="({ close }) => crearProducto(close)">
          <g-form-layout>
            <g-input v-model="nuevo" label="Nombre" name="nuevo" />
          </g-form-layout>
          <template #actions="{ confirm, cancel }">
            <g-btn variant="ghost" color="neutral" type="button" @click="cancel()">Cancelar</g-btn>
            <g-btn type="button" @click="confirm()">Crear y elegir</g-btn>
          </template>
        </g-form-fold>
      </g-form-layout>
    </g-form>
  </template>
</g-dialog-step>
```

Lo que `GDialog` hace por un pliegue abierto dentro:

- **Esc** recoge **solo** el pliegue de arriba; el diálogo no baja de paso ni emite `dismiss`.
- **El clic en el fondo** no cierra el diálogo mientras haya un pliegue abierto.
- **Un paso que sale del historial** desmonta con él sus pliegues abiertos.

El contrato completo del pliegue (cierre con resultado, anidar pliegues, `labels.pending`) está en el [README de `GFormFold`](../GFormFold/README.md).

### Ejemplo 3 · Confirmar el cierre solo si hay trabajo sin guardar

**Por qué `depth`:** solo cerrar el recorrido entero (la X, Esc con un solo paso, el fondo con un solo paso) emite `dismiss`; bajar un paso emite `step`. `depth` dice cuántos pasos hay abiertos para que decidas si pides confirmación sin abrir un diálogo por cada bajada. La confirmación va en otro `GDialog` encima (`role="alertdialog"`), porque no devuelve un valor al recorrido.

```vue
<!-- Fragmento: `abierto`, `pasos`, `hayBorrador`, `confirmarDescarte` y `reiniciar` son de tu aplicación -->
<g-dialog
  v-model="abierto"
  v-model:steps="pasos"
  close-label="Cerrar"
  :labels="{ back: 'Volver a {title}', trail: 'Recorrido' }"
  @dismiss="(e) => { if (e.depth > 1 || hayBorrador) { e.preventDefault(); confirmarDescarte() } }"
  @closed="reiniciar">
  <!-- g-dialog-step … -->
</g-dialog>
```

### Receta · el borrador de cada nivel vive en tu modelo

**Volver nunca borra:** bajar un paso no reinicia nada, y los pasos que siguen en el historial siguen montados (un formulario a medias se conserva aun sin modelo) y **el desplazamiento del cuerpo se restaura** al volver a uno. Pero un paso que **sale** del historial se desmonta, y un pliegue que se cierra también. Por eso el borrador de cada nivel debe ser un objeto de **tu modelo** (los campos ya tienen `v-model`) que solo reinicias al confirmar ese nivel o al cerrar el recorrido (`@closed`). Tampoco hay un «¿Descartar cambios?» al bajar: sería otro nivel.

## Composiciones

- **Simple:** `:inset="false"`. El contenido vive en la carcasa.
- **Con pie:** slot `footer` dentro de la inset.
- **Con secciones:** elementos con la clase `g-dialog__section` dentro del cuerpo. Se separan con una línea fina, sin cajas, y el cuerpo pierde su relleno.
- **Superficie secundaria:** `g-dialog__well` agrupa algo que lo necesite (un nivel, no se anida).
- **Con scroll:** si el contenido no cabe, solo el cuerpo se desplaza; el encabezado y el pie quedan fijos. Mientras queda contenido por desplazar, el pie se funde con la carcasa.
- **Formulario:** el pie está fuera del `<form>`; asocia el botón con `form="id"`. Si el formulario no valida, el diálogo **no se cierra**: cerrarlo es decisión tuya.
- **Hoja lateral:** `placement="end"` (con `size="sm"` para una hoja de 400px): paneles de filtros, configuración o galerías que dejan el contenido a la vista.
- **Pantalla completa:** `fullscreen`.
- **Adaptativo:** escritorio centrado, tableta (≤ ~900px) con relleno menor y móvil (≤ ~520px) según `mobile`.

```vue
<!-- Fragmento: `abierto` es de tu aplicación -->
<g-dialog v-model="abierto" title="Preferencias" close-label="Cerrar" size="lg">
  <section class="g-dialog__section">General…</section>
  <section class="g-dialog__section"><div class="g-dialog__well">Avisos…</div></section>
  <template #footer="{ close }"><g-btn variant="outline" @click="close">Cancelar</g-btn><g-btn type="submit" form="prefs">Aplicar</g-btn></template>
</g-dialog>
```

## Confirmaciones (`role="alertdialog"`)

```vue
<!-- Fragmento: `abierto` y `eliminar` son de tu aplicación -->
<g-dialog v-model="abierto" role="alertdialog" size="sm" title="¿Eliminar el proyecto?" description="Esta acción no se puede deshacer.">
  <template #footer="{ close }">
    <g-btn variant="outline" autofocus @click="close">Cancelar</g-btn>
    <g-btn color="danger" @click="eliminar">Eliminar</g-btn>
  </template>
</g-dialog>
```

Con `alertdialog`: el clic en el fondo **no** cierra (`closeOnBackdrop` se ignora), no se muestra el botón de cierre (las acciones del pie son la salida) y Esc sigue cerrando con `reason: 'escape'`. **El foco inicial sigue el orden de arriba** (DECISIONS #292), y lo que decides tú es la acción segura: pon `autofocus` en ella (o colócala primera, porque sin `autofocus` va al primer control del contenido) para que sea la que reciba el foco.

## Teclado y foco

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Recorre los controles del diálogo; no sale de él (nativo). Con pasos, también «Volver», el cierre y los pasos anteriores del hilo |
| Esc | Emite `dismiss` (`escape`) y cierra si nadie lo impide. **Con pasos y más de uno en el historial:** baja un paso (`step` con `reason: 'escape'`), sin `dismiss`. **Con un `GFormFold` abierto dentro:** recoge solo el pliegue de arriba. **Mantenida (`event.repeat`):** se ignora, un nivel por pulsación (#565). Un descendiente que ya la trató (la lista de un `GSelect`, un aviso) la consume |
| Enter / Espacio | Activa el control enfocado (nativo); en el hilo, un paso anterior lleva a ese paso |
| Flechas / Re Pág / Av Pág | Desplazan el cuerpo cuando está enfocado |

- **Al abrir**, tras montar el contenido, el foco va al primer elemento con `autofocus` y, si no hay, al primer control del contenido en orden del DOM **sin contar el botón de cierre ni el cuerpo desplazable**; si no hay ninguno, al botón de cierre y, por último, al propio `<dialog>`. Si el foco ya está dentro, no se mueve (DECISIONS #292). **Al cerrar**, vuelve a `from` si lo diste y sigue usable; si no, al elemento que lo tenía (nativo).
- **La página no se desplaza** con un diálogo abierto (`html:has(.g-dialog[open])`).

**Foco entre pasos** (medido, auditoría de los niveles; nunca queda en `body`):

- **Al ir más hondo:** al primer elemento con `autofocus` o, si no hay, al primer control **del paso nuevo** (el orden de #292 dentro del paso). Nunca a «Volver», al cierre ni a un botón del hilo.
- **Al volver sin resultado** («Volver», Esc, `back()` de un «Cancelar»): al `from` del paso que se cierra (el botón que lo abrió); si ya no es utilizable, al orden de #292 del paso de abajo.
- **Al volver con `focus`:** al campo que recibió el valor, que además recibe la marca de llegada.
- **Al saltar desde el hilo** (o `backTo` sin `focus`): al `from` del paso que estaba justo encima del destino.
- **Un paso que sale del historial con el foco dentro** (la aplicación cambió `steps`): el foco va al orden de #292 del paso actual.
- **Un botón del pie que abrió un paso:** dale `id` o pasa `from` con su `id` (ver «El pie de cada paso»).

## Accesibilidad

a. **Nombre y descripción:** `aria-labelledby` (título) y `aria-describedby` (descripción, si la hay; se suma al tuyo). Un `aria-label` o `aria-labelledby` tuyo sustituye al título como nombre. El rol nativo de `<dialog>` no se repite; solo se anuncia `alertdialog`.

b. **Cuerpo desplazable:** solo cuando su contenido no cabe recibe `tabindex="0"`, `role="region"` y el nombre del título, para que el teclado pueda desplazarlo. Cuando cabe, no es tabulable. Con pasos, se mide por paso al entrar.

c. **Cierre:** botón con nombre (`closeLabel`); la cruz es el icono `x` de Lucide (decorativo, toma `currentColor`), así que se ve también con colores forzados. Con `pointer: coarse` mide 44×44px (medido en Chromium con el bloque aplicado sin condición, auditoría de coco).

d. **Contraste:** con el tema por defecto y con el de prueba de la auditoría, todo texto llega a 4.5:1 o más en 10 instancias reales (medido, Chromium, [`auditoria.md`](../../../../../design/lab/dialog/auditoria.md)); el borde del icono de alerta, a 3:1 o más.

e. **Movimiento:** la entrada es breve (`--g-duration-press`, `--g-ease-out`) y la salida más corta (`--g-duration-fast`, #152); con `prefers-reduced-motion: reduce` solo hay fundido. En escritorio, el diálogo centrado entra desde su disparador y crece hacia abajo con el borde superior fijo (ver [Personalidad](#personalidad)). La salida solo se anima en Chromium: en Firefox y WebKit el diálogo cierra sin cuadros intermedios.

f. **Colores forzados:** carcasa, inset, pie y secciones usan `CanvasText`; el cierre, `ButtonText`.

g. **Pasos · nombre y paneles:** el `aria-labelledby` y el `aria-describedby` del `<dialog>` pasan a los ids del paso actual (`ID-step-{name}-title` y `-desc`); el título se sustituye en un nodo nuevo por paso, para que el cambio de nombre no se quede en un nodo reutilizado. Cada panel es un `section` con `role="group"` y `aria-labelledby`; los de debajo llevan `hidden` e `inert` (medido: marcado real a profundidad 3 y 5, claro LTR y oscuro RTL; auditoría de los niveles).

h. **Pasos · el hilo:** `nav` con el nombre de `labels.trail`; un `li` por paso; los anteriores son `button type="button"` y el actual un `span` con `aria-current="step"` no enfocable; el número es `aria-hidden` y el `summary` se lee tras el título como texto oculto (medido, mismo marcado). «Volver» tiene nombre (`labels.back`) y su icono es decorativo y se espeja en RTL.

i. **Pasos · contraste y tamaño** (medido en 26 configuraciones —tema de la auditoría y once temas de prueba, claro y oscuro— en dos motores): texto ≥ 4,5:1 y formas ≥ 3:1. Mínimos: paso actual del hilo (`on-accent-soft` sobre `accent-soft`) 4,50; número del actual 4,51; forma del número actual frente a su píldora 3,96; anillo de foco frente a la carcasa 4,19. Texto ≥ 12px en todas. «Volver», cierre y pasos del hilo ≥ 24×24px y, con `pointer: coarse` (emulado en Chromium; no en Firefox), ≥ 44×44px.

j. **Pasos · foco visible:** «Volver», los pasos del hilo, el cierre y el cuerpo desplazable se alcanzan con Mayús+Tab; el anillo es sólido, del grosor de `--g-focus-width` (2px y 3px medidos), con `:focus-visible` y ≥ 3:1 frente a lo que lo rodea, en claro y oscuro (medido).

k. **Pasos · anuncio del resultado:** `announce` se escribe en un canal `aria-live="polite"` de la página, dentro del `<dialog>` modal superior; nunca asertivo (medido: spec `dialog-levels`, «resultado»; prueba en `GDialog.steps.test.js`). La marca de llegada (`data-g-landed`) es decorativa.

l. **Pasos · reflujo y colores forzados:** sin desborde horizontal a 320px ni con el texto al 200 % (1280px y 640px), y a 375px en las cinco profundidades; con `forced-colors`, el paso actual, su número y su tramo usan `Highlight`, «Volver» `ButtonText` y el anillo de foco del hilo `Highlight` (medido en Chromium y Firefox; en WebKit `forced-colors` es emulado).

> **Peligro.** En modo pasos el nombre accesible del diálogo es el `title` de **cada paso**: un `GDialogStep` sin `title` deja vacíos su `h2` y el nombre del `<dialog>` mientras es el actual (aviso en desarrollo), y el `title` de `GDialog` no se usa. Lo mismo con `labels.back` y `labels.trail`: sin ellos no hay «Volver» y el hilo queda como un `nav` sin nombre. Pásalos siempre, como el `closeLabel`.

## Personalidad

Dos detalles que no cambian dónde aparece el diálogo (sigue centrado) ni su API: sin props, slots ni eventos nuevos. Origen: ronda de kiwi [`design/lab/personalidad/r01/`](../../../../../design/lab/personalidad/r01/) (§4) y decisión del usuario de que el diálogo **sí** aparezca desde su disparador; decisiones #281 (resuelto para `center`), #299, #301 y #307 en `DECISIONS.md`.

**Viene de donde lo llamaste.** Con `placement="center"` (sin `fullscreen`) y un visor de más de 520px, el diálogo entra desplazado **un cuarto** del camino entre el centro y el botón que lo abrió, con un tope de `--g-space-1 × 8` (32px) por eje, junto al fundido y la escala de siempre (`--g-duration-press`, `--g-ease-out`, sin muelle: nunca hay rebote en un diálogo). Al cerrar sale hacia el elemento al que vuelve el foco (`--g-duration-fast`). Se insinúa el origen, no se recorre; por qué: en una tabla con «Editar» por fila se ve qué fila lo abrió, y el movimiento anticipa adónde vuelve el foco (WCAG 2.4.3).

- **El disparador** es el `document.activeElement` al abrir, si está fuera del diálogo y no es `body`. Sin disparador (apertura por programa sin foco previo), la entrada y la salida son las de siempre. Si al cerrar el disparador ya no está conectado o no tiene caja, sale como antes. **Límite en WebKit:** un clic no enfoca el botón allí, así que con un disparador de ratón el diálogo **solo se funde**; con teclado sí hay origen. No se busca el disparador por otra vía (sería una prop o un oyente global nuevos).
- **Hoja lateral (`end`), hoja móvil, ancho completo móvil y pantalla completa** conservan su entrada.

**Crece hacia abajo, con el borde superior fijo.** Al abrir centrado, el diálogo se coloca como siempre; después de montar el contenido y poner el foco, mide su borde superior y lo **fija**. Desde ahí solo crece hacia abajo, y cuando no cabe desplaza su cuerpo (como antes). Por qué: un bloque que se abre (`GFormReveal`), un error que aparece o un `GTextarea autosize` empujan el contenido hacia abajo y **nunca mueven lo que estás mirando**. Al redimensionar la ventana se vuelve a centrar y a fijar, y mientras dura la salida el diálogo sigue fijo (no salta al centro). Este límite resuelve el «Abierto» de #281 para `placement="center"`; la hoja inferior que conserva su borde superior sigue abierta.

- **Alcance:** solo con el visor por encima de **520px** (`min-width: 521px`, escrito únicamente en el CSS). Por debajo, la clase y las variables existen pero quedan inertes: el diálogo entra y crece como antes.
- **Precisión:** el borde se mide con `offsetTop`, que es un entero; con bordes en fracción de píxel el diálogo puede moverse **hasta 0,5px** al fijarse en Firefox y WebKit (0px medido en los tres motores en la prueba de coco, que no reprodujo un caso fraccionario).

**Con `prefers-reduced-motion: reduce`:** el desplazamiento y la escala desaparecen; solo queda el fundido. Fijar el borde superior **no es movimiento**, así que sigue rigiendo.

Datos que escribe `GDialog` (internos): la clase `has-origin` con `--_origin-x` y `--_origin-y` (px, el vector completo hacia el disparador, escrito antes de `showModal()` y remedido al cerrar; la fracción y el tope los aplica el CSS), y la clase `is-pinned` con `--_pin-top` (px).

### Niveles anidados · movimiento, alto y llegada

Los pasos añaden cuatro movimientos, todos con los tokens del tema, **sin muelle** (`--g-ease-spring` y `--g-ease-bounce` no se usan en diálogos, #299) y sin props, slots ni eventos nuevos. Por qué: que quien baja y sube entre pasos sepa en todo momento de dónde viene, sin que lo que mira se mueva.

- **El paso llega de su lado.** Al ir más hondo entra desde el final del eje en línea; al volver, desde el inicio (espejado en RTL). Es un desplazamiento de `--g-space-1 × 6` más un fundido, en `--g-duration-slow` con `--g-ease-out`; un salto del hilo anima una sola vez, al destino. D1 (el origen desde el disparador) solo rige al abrir y cerrar el diálogo, no entre pasos.
- **El alto cambia con el borde superior fijo.** La carcasa pasa del alto del paso que sale al del que entra (`g-dialog-resize`, `--g-duration-slow` + `--g-ease-out`) con la clase `is-resizing` y las variables `--_step-from-h` y `--_step-to-h`, que se retiran al terminar. Medido: el borde superior no se mueve (Δ 0,00px) al ir y al volver, y el alto pasa por valores intermedios sin vaivén.
- **La hoja móvil no encoge durante el recorrido.** Con un visor de hasta ~520px, la hoja conserva como alto mínimo el máximo alcanzado (`has-sheet-hold`): puede subir al ir más hondo, pero no baja al volver ni al avanzar (medido a 375px).
- **La llegada.** Al volver con `focus`, la caja visible del campo que recibió el valor (el propio campo o su ancestro con `data-g-tooltip-box`) lleva un instante un anillo de `--g-focus-width` en `--g-color-accent-text` que se recoge hacia la caja en `--g-duration-slow × 3`. Es decorativa; lo que se dice va por el foco y por `announce`. El atributo `data-g-landed` es interno, no API, y se retira solo.
- **Un pliegue que se abre** hace crecer el diálogo hacia abajo con el borde superior fijo (D2): lo de arriba no se mueve (Δ 0,00px dentro del cuerpo).

**Con `prefers-reduced-motion: reduce`:** entre pasos solo hay un fundido corto (`--g-duration-fast`), sin desplazamiento; el alto cambia de golpe, con el borde fijo; la llegada solo se funde. Medido en los tres motores (auditoría de los niveles).

### Verificación

Spec `design/lab/theme-playground/tests/personalidad-dialog.spec.mjs` sobre el `GDialog` real del UMD en una página ligera, con un visor de 1280×900 (coco, [`estilo.md`](../../../../../design/lab/dialog/estilo.md), «Personalidad»). El primer cuadro y la mitad de la entrada y la salida se leen pausando la transición real; los cuadros intermedios se cuentan en tiempo real.

| Medida | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| Disparador lejano (100, 100): primer cuadro | −32 / −32px (el tope) | igual | igual |
| Disparador cercano (vector 60, 40): primer cuadro | 15 / 10px (un cuarto, con su signo) | igual | igual |
| A la mitad de la entrada (`ease-out`) | −1,09 / −1,09px, del mismo lado | igual | igual |
| Termina | a ≤ 1px del centro | igual | igual |
| Salida hacia el disparador | 120ms; a la mitad 30,9 / −30,9px; final 32 / −32px | cierra sin cuadros (#152) | cierra sin cuadros (#152) |
| Foco de vuelta al disparador (abrir con teclado) | sí | sí | sí |
| Sin disparador | sin `has-origin`; entra desde 0 / 8px | igual | igual |
| `reduce` | sin transición de `translate` ni `scale` | igual | igual |
| Crece hacia abajo: bloque de 240px con el diálogo abierto | Δ borde superior 0,000px; el botón del pie baja +240px (antes subía ~126px) | igual | igual |
| Al no caber | dentro del visor, el cuerpo desplaza; Δ del botón al crecer más 0px | igual | igual |
| Crecer con `reduce` | Δ 0px | igual | igual |
| ≤ 520px (500px de ancho completo; 375px de hoja) | entra como antes; el centrado sube más de 100px al crecer; la hoja sigue pegada abajo | igual | igual |

Con las reglas de D1 y D2 quitadas del CSS, las ocho pruebas de comportamiento fallan en Chromium y las de guarda (sin disparador, `reduce`, ≤ 520px, foco) pasan igual, como deben. Los cuadros intermedios en tiempo real, sin sobrepaso, se exigen solo en Chromium.

**Sin verificar:** un caso de borde fraccionario en Firefox y WebKit (el ≤ 0,5px es un límite aceptado, no medido), lector de pantalla real, táctil real y Safari real (WebKit solo en Playwright).

## Tema

El componente solo lee tokens `--g-*`. La superficie inset forma parte de un sistema reutilizable de **superficies anidadas** (`--g-surface-*`, ver `docs/contract/tokens.md` §11):

```css
:root {
  --g-surface-shell: #f1ddb6;   /* fondo de la carcasa */
  --g-surface-inset: #fffbf2;   /* fondo de la inset */
  --g-surface-gap: 8px;         /* separación entre carcasa e inset */
  --g-surface-radius: 28px;     /* radio de la carcasa; el de la inset se deriva */
  --g-surface-backdrop: rgb(59 42 26 / 0.45); /* tinte del fondo */
}
```

`--g-surface-radius-inset` (radio de la carcasa menos la separación y el borde) mantiene la inset concéntrica; el componente lo corrige además por la densidad. Consume también `--g-color-border`, `--g-color-border-control`, `--g-color-text`, `--g-color-text-muted`, `--g-color-focus`, `--g-color-accent`, `--g-radius-md`, `--g-radius-pill`, `--g-space-1..12`, `--g-font-ui`, `--g-text-{body|body-sm}-{size|line}`, `--g-text-title-sm-{size|line|tracking|weight}`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset`, `--g-shadow-1`, `--g-shadow-3`, `--g-duration-{fast|press|slow}`, `--g-ease-{standard|out}` y `--g-press-scale`; para la personalidad lee `--g-space-1` (el tope de `× 8`). **Los niveles anidados no añaden tokens:** el paso actual del hilo usa el par `--g-color-accent-soft` / `--g-color-on-accent-soft`; su número, `--g-color-accent` / `--g-color-on-accent`; los demás números, `--g-color-neutral-soft` / `--g-color-on-neutral-soft`; el tramo del hilo y la llegada, `--g-color-accent-text`; y el movimiento, `--g-duration-slow` y `--g-ease-out` con el desplazamiento `--g-space-1 × 6`. El ancho y el relleno se derivan de `--g-space-1`: cambiar el espacio base escala todo.

## Clases

Las emite el componente y las estiliza `GDialog.css`: `g-dialog`, `g-dialog--size-*`, `g-dialog--density-*`, `g-dialog--placement-*`, `g-dialog--mobile-*`, `g-dialog--inset`, `g-dialog--fullscreen`, `g-dialog--alert`, `is-loading`, y los elementos `g-dialog__header`, `__titles`, `__title`, `__description`, `__icon`, `__close`, `__inset`, `__body` (con `is-scrollable`), `__footer` e `is-scrolled` (en la inset, o en la raíz sin inset), más `has-origin` e `is-pinned` (ver [Personalidad](#personalidad)) e `is-stacked` (se abrió con otro modal debajo: su `::backdrop` es transparente). Con pasos: `g-dialog--steps`, `is-forward` / `is-back` (mientras dura el cambio), `is-resizing` (con `--_step-from-h` y `--_step-to-h`), `has-sheet-hold` (con `--_sheet-hold`), `g-dialog__back`, el hilo (`g-dialog__trail`, `__trail-list`, `__trail-item`, `__trail-step`, `__trail-number`, `__trail-title`, con `is-parent` e `is-current` en el `li`), `g-dialog__step` (con `is-current` e `is-entering`) y `g-dialog__sr` (texto oculto del `summary`). El atributo `data-g-landed` es interno. Las utilitarias `g-dialog__section` y `g-dialog__well` las pones tú.

## Limitaciones conocidas

- **Estilos globales sin capa ganan.** El CSS de Grana va en la capa `grana.components`; una regla global tuya sobre `h2` o `p` (por ejemplo `h2 { margin-top: 2rem }`) desplaza el título o la descripción. Es el comportamiento buscado del sistema de capas: acota tus reglas globales con `:not(.g-dialog__title)` o un selector más específico.
- **Diálogos apilados:** un `GDialog` abierto sobre otro funciona (un solo fondo, Esc de uno en uno, el fondo no cierra con otro modal debajo y los formularios son independientes, #565 a #568); es la forma para algo independiente que no devuelve un valor. Para niveles que devuelven un valor usa pasos o `GFormFold`. **Sin diálogos no modales**, y sin arrastre de la hoja ni gesto para cerrarla. La salida solo se anima en Chromium (en Firefox y WebKit cierra sin cuadros intermedios, #152).
- **Reservado en los niveles:** `size` por paso (con el borde superior fijo y el cambio de ancho animado pediría una ronda propia, kiwi L10), el slot `tabs` combinado con pasos (el hilo ocupa su sitio), el paso recursivo (el mismo paso dos veces en el historial) y un indicador de «paso N de M» (para un proceso lineal usa `GStepper`). No hay límite duro de profundidad; más de cinco niveles es una señal de diseño del flujo, no del componente.
- **Niveles · Tab en Safari y WebKit de macOS:** Safari solo tabula a campos de texto salvo que esté activo el acceso total por teclado del sistema o del navegador; con él apagado, «Volver», el cierre y los pasos del hilo (botones) se alcanzan con Opción+Tab. Es del navegador, no del componente: la verificación de coco en WebKit usa Opción+Tab y Opción+Mayús+Tab (el criterio del resto del repo) y Tab en Chromium y Firefox.
- **Niveles · `pointer: coarse`** no se emula en Firefox y `forced-colors` de WebKit es emulado (auditoría de los niveles).
- **Personalidad:** en WebKit un clic no da `has-origin` (solo fundido), el borde superior fijo puede moverse hasta 0,5px con bordes fraccionarios, y ambos detalles se limitan a visores de más de 520px.
- **`::backdrop` con variables:** hereda `--g-surface-backdrop` de la raíz `<dialog>` en navegadores de 2024 en adelante; en uno anterior, el fondo quedaría transparente.
- **Heading fijo:** el título es un `h2`; el nivel no se cambia en v0.1.
- **Tema oscuro:** `grana.css` ya trae el esquema oscuro por defecto (`defaults.css`): sigue `prefers-color-scheme` y se fuerza con `data-theme="dark"` o `data-theme="light"` en cualquier elemento (ver [«Tema oscuro» del README raíz](../../../../../README.md#tema-oscuro)). Al documentar no se repitieron en oscuro las cifras de contraste de este README.
- **Sin verificar:** un lector de pantalla real (nombre, descripción, `alertdialog` y cuerpo desplazable; con pasos, además el cambio de nombre del `<dialog>` por paso, el `role="group"` al recibir el foco, el orden de la frase tras el foco y el hilo), el teclado virtual en móvil (el visor se reduce y una hoja alta puede tapar campos), un dispositivo táctil real y el zoom real, `forced-colors` real de Windows (solo emulado en Chromium), Safari real (WebKit solo en Playwright) y `dvh` en Safari móvil. `prefers-reduced-motion` está medido con la preferencia emulada en Chromium, Firefox y WebKit (`design/lab/theme-playground/tests/limitaciones.spec.mjs`, 18/18 el 2026-10-18: con `reduce` ningún elemento conserva transiciones ni animaciones de movimiento). **Peso de los niveles:** el contrato (#590) fija un tope de +4 KiB gzip en el paquete principal para el modo pasos y pide a bruno medirlo; no consta una cifra registrada, así que no se afirma ninguna.

## Verificación de los niveles

Lo que respalda esta documentación (nivel `medido` = verificación propia o spec en verde con su recuento):

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Auditoría de coco sobre el componente real, [`design/lab/dialog/auditoria-pasos.md`](../../../../../design/lab/dialog/auditoria-pasos.md) (addendum del 2026-10-18, tras 8e3c300): estático (CSS fuente y publicado, tabla de clases) | 44/44 | medido |
| Misma verificación (`GRANA_PW_PORT=4209 node design/lab/dialog/auditoria-pasos-verificar.mjs`) en Chromium · Firefox · WebKit | 748/748 · 747/747 (sin `pointer: coarse`) · 748/748 (con `pointer: coarse` y `forced-colors` emulados) | medido |
| Specs `design/lab/theme-playground/tests/dialog-levels.spec.mjs` (10) y `form-fold.spec.mjs` (7), en WebKit (auditoría) y en Chromium (reejecutados por mora-docs el 2026-10-18) | 17/17 · 17/17 | medido |
| Vitest de la carpeta `GDialog` (`GDialog.steps.test.js` 23, `GDialog.compiled.test.js` 5 —pie de cada paso con plantilla compilada—, `GDialog.test.js` 77 y SSR 1) | 106/106 (ejecutado por mora-docs el 2026-10-18) | prueba |
| Lector de pantalla real, táctil y zoom reales, Safari real | no comprobados | sin verificar |

Banco para verlo en el componente real: `packages/vue/playground/dialog-levels.html` (`?mode=steps` o `mix`, `?dir=rtl`, `?long=1`; requiere `npm run build`).

## Fuentes

- API: [`GDialog.meta.json`](./GDialog.meta.json) · Contrato: [`design/contracts/dialog.md`](../../../../../design/contracts/dialog.md) · Prototipo: [`design/lab/dialog/r01/`](../../../../../design/lab/dialog/r01/) · Estilo: [`design/lab/dialog/estilo.md`](../../../../../design/lab/dialog/estilo.md) · Personalidad: [`design/lab/personalidad/r01/`](../../../../../design/lab/personalidad/r01/) · Auditoría: [`design/lab/dialog/auditoria.md`](../../../../../design/lab/dialog/auditoria.md)
- Niveles anidados: [`GDialogStep.meta.json`](../GDialogStep/GDialogStep.meta.json) · [`GFormFold`](../GFormFold/README.md) · Contrato: [`design/contracts/dialog.md`](../../../../../design/contracts/dialog.md) §«Niveles anidados» y [`form.md`](../../../../../design/contracts/form.md) §15 · Decisiones: #580 a #591 y #651 en [`DECISIONS.md`](../../../../../DECISIONS.md) · Prototipo de kiwi: [`design/lab/dialog/r02/`](../../../../../design/lab/dialog/r02/) · Auditoría: [`design/lab/dialog/auditoria-pasos.md`](../../../../../design/lab/dialog/auditoria-pasos.md) · Pruebas: [`GDialog.steps.test.js`](./GDialog.steps.test.js), [`GDialog.compiled.test.js`](./GDialog.compiled.test.js) y los specs `dialog-levels` y `form-fold` · Banco: [`dialog-levels.html`](../../../playground/dialog-levels.html)
