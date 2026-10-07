# GRadioGroup

Una **pregunta con una sola respuesta** (Sí/No, sexo, modalidad de consulta, tipo de sangre, frecuencia) con **radios nativos** (`<input type="radio">`) de `name` común. Cinco apariencias (`list`, `inline`, `segmented`, `chip`, `card`) que cambian la **forma**, no la semántica; todas exponen un `role="radiogroup"` con nombre visible. El navegador hace el trabajo: estado, teclado, envío y agrupación son los del radio nativo.

**Etiqueta:** `<g-radio-group>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/radio-group/auditoria.md`](../../../../../design/lab/radio-group/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`, sección `GRadioGroup`). Exige Vue `^3.5.0`.

> **No es un radio suelto.** No hay `GRadio` en v0.1 (el nombre está reservado): un radio solo no se puede desmarcar y no tiene sentido. La lista de opciones **es** el orden, así que no hay hijas que registrar (a diferencia de `GCheckboxGroup`).

## Uso

```vue
<script setup>
import { ref } from 'vue'

const modalidad = ref('presencial')
const modalidades = [
  { value: 'presencial', label: 'Presencial', description: 'En el consultorio de Reforma 120.', icon: 'map-pin' },
  { value: 'linea', label: 'En línea', description: 'Videollamada; el enlace llega por correo.', icon: 'globe' },
  { value: 'tel', label: 'Por teléfono', description: 'No disponible este mes.', icon: 'message-circle', disabled: true }
]
</script>

<template>
  <g-radio-group
    v-model="modalidad"
    name="modalidad"
    label="Modalidad de consulta"
    hint="Puedes cambiarla hasta un día antes."
    :options="modalidades"
  ></g-radio-group>
</template>
```

> **En plantillas dentro del HTML** (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-radio-group ...></g-radio-group>`.

**El componente no trae textos propios** (Grana es internacional): la pregunta va en `label` (o en el slot `label`, o en `aria-label`/`aria-labelledby`; sin ninguno, aviso en desarrollo) y los textos de las opciones en `options`.

### Las cinco apariencias

```vue
<g-radio-group v-model="modalidad" name="modalidad" label="Modalidad" :options="modalidades"></g-radio-group>                              <!-- list (por defecto) -->
<g-radio-group v-model="fuma" name="fuma" appearance="inline" label="¿Fuma?" :options="[{ value: true, label: 'Sí' }, { value: false, label: 'No' }]"></g-radio-group>
<g-radio-group v-model="sexo" name="sexo" appearance="segmented" label="Sexo" required :options="sexos"></g-radio-group>
<g-radio-group v-model="frecuencia" name="frecuencia" appearance="chip" color="accent" label="Frecuencia de recordatorios" :options="frecuencias"></g-radio-group>
<g-radio-group v-model="plan" name="plan" appearance="card" label="Plan" :options="planes"></g-radio-group>
```

| Apariencia | Raíz | Cómo se ve | `description` | Opciones (guía) | Fila de `GFormRow` |
| --- | --- | --- | --- | --- | --- |
| `list` (por defecto) | `<fieldset>` | Columna de círculos con etiqueta | Sí | 2 a ~7 | Propia |
| `inline` | `<div>` | Círculos en una fila que envuelve, dentro de una caja del alto de un campo | No | 2 a ~4 cortas (Sí/No) | **Comparte línea** |
| `segmented` | `<div>` | Caja de campo dividida en segmentos; la elegida se rellena | No | 2 a 6 | **Comparte línea** |
| `chip` | `<fieldset>` | Píldoras en una fila que envuelve | No | Muchas, cortas | Propia |
| `card` | `<fieldset>` | Rejilla de tarjetas con círculo, icono, etiqueta y descripción | Sí | 2 a ~6 | Propia |

**Cuándo usar cada una**

- **`inline`** y **`segmented`** son los que caben **junto a otros campos** en una `GFormRow`: son tan bajos como una caja de campo. `inline` para un Sí/No; `segmented` para 2 a 6 opciones cortas (sexo, frecuencia).
- **`list`**, **`chip`** y **`card`** van **en su propia fila** (hijo directo de `GFormLayout`); en una fila con más hijos, `GFormRow` avisa en desarrollo. `list` es el caso general y el único que muestra bien opciones con texto largo; `chip` para opciones cortas y numerosas; `card` cuando cada opción merece una descripción.
- La raíz depende **solo de la apariencia**, nunca del contexto: no hay saltos de marcado ni diferencias en SSR.

**Cuándo no usarlo**

| Necesidad | Usa |
| --- | --- |
| Muchas opciones o poco espacio | `GSelect` |
| Varias respuestas | `GCheckboxGroup` |
| Encender o apagar un ajuste que se aplica en el acto | `GSwitch` |
| Cada opción es una entidad con contenido propio (media, métricas, acciones) | `GCard` con `select-type="radio"` dentro de un `role="radiogroup"` tuyo |
| Cambiar **lo que se ve** (vistas, paneles) | `GTabs` (incluido `segmented`) |
| «Ninguna» es una respuesta válida | Una opción más («No sé», «Prefiero no decirlo»): no se puede deseleccionar |

`appearance="card"` es una **opción de formulario** (indicador, icono, etiqueta, descripción); no lleva `GSurface`, acciones ni media. El segmentado se lee como **caja de campo**, no como la pista de `GTabs`: una respuesta no debe parecer una navegación.

### Dentro de un formulario

Con un `GForm` alrededor, el grupo lee su contexto (densidad, solo lectura, deshabilitado, error por `name`, marcas) y se registra con `name`. `inline` y `segmented` comparten línea:

```vue
<g-form-layout>
  <g-form-row>
    <g-date-picker v-model="m.nacimiento" class="g-form-w-sm" style="--g-form-min: 44" label="Fecha de nacimiento" name="nacimiento" />
    <g-radio-group v-model="m.sexo" appearance="segmented" label="Sexo" name="sexo" required
                   :error="errores.sexo" :options="[{ value: 'f', label: 'Femenino' }, { value: 'm', label: 'Masculino' }, { value: 'x', label: 'Prefiero no decir' }]" />
    <g-radio-group v-model="m.primera" class="g-form-w-sm" appearance="inline" label="¿Primera consulta?" name="primera"
                   :options="[{ value: true, label: 'Sí' }, { value: false, label: 'No' }]" />
  </g-form-row>
  <g-radio-group v-model="m.modalidad" label="Modalidad" name="modalidad" :options="modalidades" />   <!-- list: su propia fila -->
</g-form-layout>
```

Tamaños recomendados (guía, no regla): un Sí/No `inline` con `g-form-w-xs` o `g-form-w-sm`; un segmentado de 3 opciones cortas con `g-form-w-sm` o `g-form-w-md`. La guía completa del sistema está en [`GForm/README.md`](../GForm/README.md).

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` (`v-model`) | String \| Number \| Boolean \| `null` | el `value` de la opción elegida | `null` (sin selección) |
| `options` | Array | ver «Opciones» | `[]` |
| `appearance` | String | `list` `inline` `segmented` `chip` `card` | `list` |
| `labelMode` | String | `full` `icon` | `full` |
| `name` | String | | generado |
| `label` | String | | sin valor |
| `hint` | String | | sin valor |
| `error` | String | | sin valor |
| `warning` | String | | sin valor |
| `valid` | String | | sin valor |
| `required` | Boolean | | `false` |
| `mark` | Boolean | | sin valor (lo decide `GForm`) |
| `readonly` | Boolean | | sin valor → contexto o `false` |
| `disabled` | Boolean | | sin valor → contexto o `false` |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` |
| `density` | String | `default` `comfortable` `compact` | sin valor → contexto o `default` |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` |
| `field` | Boolean | | `true` |
| `id` | String | | generado |

No hay `orientation`, `variant`, `rounded` ni `block`: la apariencia ya fija la disposición, el apilado del segmentado es automático y el grupo siempre ocupa su sitio en `GFormLayout` y `GFormRow`.

### Opciones

```js
[{ value: 'presencial', label: 'Presencial', description: 'En el consultorio.', icon: 'map-pin', disabled: false }]
```

| Campo | Tipo | Notas |
| --- | --- | --- |
| `value` | String \| Number \| Boolean | **Obligatorio y único** en la lista, comparado con `===` **y** con `String(value)` (es lo que se envía: `1` y `'1'` chocarían en `FormData`). `null` y `undefined` no son valores |
| `label` | String | **Obligatorio.** Texto visible, nombre accesible del radio y, en solo icono, el texto oculto accesible |
| `description` | String | Solo en `list` y `card`; va **fuera del nombre**, por `aria-describedby` del radio. En las demás se ignora con aviso |
| `icon` | String | Nombre de Lucide (ver [`GIcon`](../GIcon/README.md)); siempre decorativo. Con slot `icon` manda el slot (ver «Slots») |
| `disabled` | Boolean | Esa opción no se elige, las flechas la saltan y no se envía |

- **Sin grupos:** una opción con `options` (como los grupos de `GSelect`) se ignora y avisa: un grupo de opciones dentro de una pregunta de radios es otra pregunta.
- Las opciones inválidas (sin `value`, sin `label`, grupos) se **descartan**; los ids siguen el índice de las que quedan.

### Reglas de las props

- **`v-model`:** el `value` elegido **con su tipo original** (un `true` sigue siendo booleano; un `3`, número). `null` o `undefined` = sin selección: ningún radio marcado y el grupo **no aparece** en `FormData`. Un valor que no está en `options` se trata como sin selección y avisa. `''` no se convierte en `true` y la prop ausente no se convierte en `false`, así que un «No» con `value: false` no sale marcado por omisión.
- **Controlado:** al elegir, el componente emite `update:modelValue` y **no cambia nada por su cuenta**; si el consumidor no actualiza el modelo, la marca del DOM **vuelve** al valor de `modelValue`.
- **`name`:** nombre común de los radios, clave del grupo en `errors`/`warnings` de `GForm` y en `FormData`. Sin `name`, el componente **genera uno estable** (los radios lo necesitan para agruparse y para las flechas); dentro de un `<form>` sin `name` avisa, porque el envío llevaría una clave aleatoria y `GForm` no podría asociarle errores.
- **Valor enviado:** `String(value)` de la elegida (`'true'`, `'3'`, `'presencial'`).
- **`required`:** pone **`aria-required="true"` en el grupo** y la marca visual según la convención de `GForm` (asterisco `aria-hidden` o «(opcional)» como parte del nombre, `markRule` `both`: un grupo de radios **sí** lleva «(opcional)»). **No pone `required` nativo en los radios** (DECISIONS #269): en Chromium un radio obligatorio sin elegir se expone como **inválido desde el primer momento**, aunque el `<form>` tenga `novalidate`, y `GForm` castiga tarde, no al cargar. Consecuencia: un `<form>` nativo **sin** `GForm` no bloquea el envío; valida tú y pasa `error`. El componente nunca valida.
- **`mark`:** `false` quita la marca; `true` no inventa otra convención.
- **`readonly`:** `aria-readonly="true"` en el grupo e `is-readonly`. Los radios siguen **habilitados**, enfocables, legibles y dentro de `FormData`; se **cancelan el `keydown` de las cuatro flechas y el `click`** (también el de la etiqueta y el que dispara Espacio), así que ni la selección ni el foco cambian de opción. Nunca emite `update:modelValue`. Dentro de `GForm readonly` lo hereda, sin marca ni bloqueo (DECISIONS #266, #272). Se distingue de `disabled` sin depender del color: contraste completo, fondo `neutral-soft`, borde discontinuo y cursor normal.
- **`disabled`:** en `list`, `chip` y `card`, el atributo nativo del `<fieldset>` (deshabilita en cascada); en `inline` y `segmented`, `disabled` en **cada** radio. Fuera del Tab y de `FormData`. Clase `is-disabled`.
- **La opción elegida no puede estar deshabilitada.** Si lo está, se pinta como se pide pero **avisa**: con ella deshabilitada, una flecha elegiría otra y la elegida se perdería y no se enviaría (medido en Chromium y Firefox). Si el valor no se puede cambiar, usa `readonly`.
- **`labelMode="icon"`:** solo en `segmented` y `chip`. La etiqueta **no sale del DOM**: se oculta con el patrón de texto oculto accesible y sigue siendo el nombre del radio. Con **pista visual** del nombre (ver [Pista de solo icono](#pista-de-solo-icono)). Una opción **sin icono** conserva su etiqueta visible y avisa; con el slot `option` no tiene efecto (aviso); en otra apariencia cuenta como `full` (aviso). Pensado para iconos inequívocos (vista, alineación); en una pregunta de formulario se prefiere texto. No hay `auto`: un segmentado que no cabe se apila, no reduce etiquetas.
- **`size`:** en `inline` y `segmented`, la **caja** mide lo mismo que la caja de un `GInput` del mismo `size` (y `density`); en `list`, `chip` y `card`, el tamaño del indicador y del texto, como `GCheckbox`.
- **`color`:** relleno de lo elegido (punto del círculo, segmento, chip; borde y fondo de la tarjeta). El error usa siempre `danger`.
- **`field`:** con `true` (por defecto) el grupo es un **campo**: región de mensaje siempre presente y contexto de `GForm`. Con **`:field="false"`** es un **control suelto dentro de otro componente** (un selector de vista en una barra de herramientas): sin región de mensaje ni `aria-live`, sin leer el contexto de `GForm` (no se registra ni hereda densidad, solo lectura, deshabilitado, errores ni marcas) y sin marca; `error`, `warning`, `valid`, `required` y `mark` se **ignoran con aviso**. El pie solo existe si hay `hint`. Se lee al crear el grupo.
- **`id`:** el de la raíz; sin él se genera. De él derivan `ID-label`, `ID-hint`, `ID-message` y, por opción `i`, `ID-i` (el radio), `ID-i-label` y `ID-i-description`.
- **Resto de atributos** (`aria-*`, `data-*`, `class`, `style`, escuchas): a la **raíz** (`inheritAttrs: false`). Un `@change` en la raíz recibe el `change` nativo que sube del radio, **ya con el modelo actualizado**; los manejadores del contexto de `GForm` van primero.

## Mensajes: `hint`, `error`, `warning` y `valid`

Todos son **del grupo**, nunca de una opción, y viven en el pie:

- **`hint`:** ayuda del grupo (`ID-hint`), en el `aria-describedby` de la raíz. Si hay etiqueta visible, la raíz usa `aria-labelledby`; sin ella, el `aria-label`/`aria-labelledby` del consumidor va en la raíz.
- **`error`, `warning`, `valid`:** una **sola región** `g-radio-group__message` (siempre presente con `field`, vacía sin nodos de texto), con icono de Lucide (`circle-alert`, `triangle-alert`, `circle-check`) y un prefijo oculto («Error: », «Advertencia: », «Correcto: », tomados de `labels` de `GForm`; fuera de `GForm`, sin prefijo). Prioridad: `error`, `warning`, `valid`.
- Solo un `error` visible pone **`aria-invalid="true"` en el grupo** (nunca en los radios) y entra en su `aria-describedby`; `warning` y `valid` no bloquean ni marcan inválido.
- **Dentro de `GForm`:** el error de `errors[name]` se revela cuando toca: el control de elección revela **al cambiar** (`trigger: 'change'`) o al enviar; antes de interactuar, el mensaje queda vacío. El destino del enlace de `GErrorSummary` (y del foco al primer inválido) es **el radio por el que Tab entraría**: el elegido si está habilitado; si no, el primero habilitado.
- **Fuera de `GForm`**, el mensaje se ve en cuanto pasas `error`/`warning`/`valid`. El componente no valida.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | el `value` de la opción, con su tipo original | El usuario elige otra opción. Una sola emisión por elección. Nunca con `readonly` ni `disabled`, ni cuando `modelValue` cambia desde fuera |

Solo se declara ese evento: `change`, `focusin`, `focusout`, `keydown`… no se declaran y suben del radio a la raíz con su `Event` nativo.

## Slots

| Slot | Props | Contenido |
| --- | --- | --- |
| `label` | | Pregunta con contenido rico (sustituye a `label`); nada interactivo |
| `hint` | | Ayuda con contenido rico (sustituye a `hint`) |
| `error` | | Mensaje de error con contenido rico; solo con un `error` visible, tras el icono y el prefijo |
| `option` | `{ option, index, checked, disabled }` | Contenido rico de **una opción**: sustituye a icono, etiqueta y descripción. Todo el contenido es el **nombre accesible** del radio (sin descripción automática); el `<input>` lo pone el componente; **nada interactivo dentro**. Con él, `labelMode="icon"` no tiene efecto |
| `icon` | `{ option, index, checked }` | Icono de una opción (manda sobre `option.icon`; «dato → nombre, plantilla → slot»). Se muestra solo en las opciones con `icon` con valor, dentro de un hueco `aria-hidden`. Lo que no es Lucide va aquí, nunca en `GIcon` |

```vue
<g-radio-group v-model="plan" name="plan" appearance="card" label="Plan" :options="planes">
  <template #option="{ option, checked }">
    <strong>{{ option.label }}</strong> · {{ option.precio }} <span v-if="checked">(actual)</span>
  </template>
</g-radio-group>
```

## Apariencias en detalle

- **Círculo** (`list`, `inline`, `card`): el propio `<input>` dibujado con `appearance: none`; el estado lo dice el punto.
- **Relleno** (`segmented`, `chip`): el `<input>` **cubre** la opción con `opacity: 0` (nunca `display: none` ni `visibility: hidden`, para no perder el foco ni el teclado) y el estado lo dice el relleno de la elegida, con el texto en `on-{color}`.
- **Objetivo de clic:** la **opción entera** (la fila, la píldora, la tarjeta o el segmento).
- **`inline`:** la caja tiene el alto mínimo de la caja de un campo y centra sus opciones, así el texto de «Sí · No» queda a la altura del de sus vecinas en la fila.
- **`segmented`:** caja de campo con el marco hacia dentro; cada segmento ocupa el alto entero; la elegida **se rellena en su sitio**, sin pista ni marca deslizante. Icono y etiqueta forman un bloque que no se parte mientras el segmentado está en una línea.
- **`card`:** rejilla que se adapta al ancho; una columna en estrecho. La elegida lleva fondo suave y borde más grueso (no depende solo del color).

## Segmentado: se apila cuando no cabe

El segmentado **nunca recorta** una etiqueta. Mide su **ancho natural** (todas las opciones en una línea, iguales a la más larga) y, si ese ancho supera el de su propia caja, se **apila** (`is-stacked`): una opción por línea, misma caja y mismo orden (el orden del DOM, de lectura, de Tab y visual coinciden), mismas flechas; las etiquetas pueden partirse. No pasa a rejilla, ni a scroll, ni a `list`.

- Se decide por **su ancho propio**, no por el de la ventana, y **en los dos sentidos**: al volver a haber sitio, se desapila (medido de 1280 a 320 y de vuelta sin recargar).
- Se mide al montar, al cambiar `options`, `labelMode`, `size`, `density` o `appearance`, al terminar de cargar las fuentes y en cada cambio de tamaño de su caja (un `ResizeObserver` compartido; las escrituras van en el cuadro siguiente y solo si cambian).
- **Publica su ancho natural a la `GFormRow`** que lo contiene, que lo suma a su mínimo efectivo (el mayor entre el de `g-form-w-*`, `--g-form-min` y el del segmentado). Resultado: **la fila se parte en líneas antes de que el segmentado se apile**; en el banco real, a 480px «Sexo» pasa a su propia línea y cabe sin apilarse. Solo cuenta si el grupo es **hijo directo** de la fila. Al desmontarse o dejar de ser `segmented`, retira lo publicado.
- **Sin medida** (render en servidor, entorno sin `ResizeObserver`): una sola línea, como se pidió, y no publica mínimo. El apilado se decide al montar en el cliente.

## Pista de solo icono

Con `labelMode="icon"` (solo `segmented` y `chip`) cada opción con icono lleva una **pista visual** con su nombre. Es el motor interno de [`GTooltip`](../GTooltip/README.md#modo-visual-clientes-internos) en modo visual (DECISIONS #433 y #435): no hay prop ni texto que configurar.

- **Cuándo aparece:** en cada opción solo icono. No con el slot `option` (ahí `labelMode="icon"` no tiene efecto), ni en las opciones que conservan su etiqueta por no tener icono, ni en otra apariencia.
- **Qué dice:** `option.label`, el mismo texto oculto que ya es el nombre del radio.
- **No duplica el nombre accesible:** la pista es un nodo `aria-hidden`, sin `role`, `id` ni referencias; el nombre (`aria-labelledby` a la etiqueta) y la descripción no cambian y ningún `aria-*` se añade al radio. Los nodos van al final de `g-radio-group__options`: nunca dentro de la `<label>` (pulsarlos elegiría el radio) ni como hijo de la raíz (en `inline` y `segmented` la raíz tiene tres hijos que comparten la fila de `GFormRow`). La pestaña de la pista mide el segmento o el chip, no el radio: la `__option` lleva `data-g-tooltip-box`.
- **Cuándo se abre:** con el puntero tras 350 ms; con el foco, al instante, solo si llegó por navegación (Tab o flechas); un clic no la abre. Solo hay una pista abierta en todo el documento.
- **Viaje:** la pista viaja de opción en opción con el puntero y con las flechas (que además eligen), con movimiento reducido salta. Va debajo en una línea (también cuando los chips pasan a otra línea) y a la derecha lógica con el segmentado apilado (`is-stacked`). Con `readonly` funciona igual (el radio sigue siendo enfocable).
- **Esc:** cierra la pista sin mover el foco ni cambiar lo elegido.
- **Pulsación larga (táctil):** muestra el nombre y **no elige**: no cambia `checked`, no se emiten `update:modelValue` ni `change` y no cuenta para el momento de revelado de `GForm`. Un toque normal elige sin pista.
- **Límite: opción `disabled` sin pista.** Un radio deshabilitado nativo no abre la pista, así que con el puntero no se puede leer el nombre de una opción solo icono deshabilitada. Para un valor que no se puede cambiar, usa `readonly` (#270), y una opción imposible conviene que no sea solo icono.
- **Medido** (coco, [`design/lab/tooltip/auditoria-pista.md`](../../../../../design/lab/tooltip/auditoria-pista.md); Chromium, Firefox y WebKit; `segmented` y `chip` de `xs` a `xl`, dos densidades, apilado, chips en dos líneas y RTL): la pestaña coincide con el segmento o el chip con un máximo de 0,25 px; el nombre contra la página, 15,20:1 como mínimo; los nodos no cambian ninguna medida de las opciones (Δ0). Resultado de la auditoría completa de las tres pistas: 31 347/31 347.
- **Peso:** +253 B gzip en `grana.js` y +220 B en `grana.umd.js` sobre `GTabs`, que ya cuenta el motor visual compartido (`GRadioGroup.meta.json`, medido por bruno el 2026-10-06).

## Teclado

Nativo (patrón *Radio Group* de APG), **sin manejadores propios** salvo el bloqueo de `readonly`.

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Entra **una sola vez** en el grupo: en la elegida; sin elegida, en la primera habilitada. La siguiente Tab sale del grupo. Shift+Tab sin elegida entra en la última en Chromium y en la primera en Firefox |
| ← ↑ → ↓ | Mueven el foco **y eligen**; saltan las opciones deshabilitadas. Chromium y Firefox envuelven (de la última a la primera) y siguen la dirección visual en RTL |
| Espacio | Elige la opción enfocada si no lo estaba |
| Enter | Sin acción propia |
| Con `readonly` | Flechas, Espacio y clic no cambian nada; el foco se queda en la elegida; Tab entra y sale |

**WebKit:** las flechas **no envuelven** y **no invierten ← y → en RTL**, y en macOS Tab no llega a los radios con la preferencia por defecto (Safari: «Acceso total por teclado» u Opción+Tab). Es el comportamiento de todos los radios de esa plataforma y **no se normaliza** (DECISIONS #272): hacerlo obligaría a reimplementar el teclado de los radios en todos los motores.

## Accesibilidad

- **Dos raíces, una semántica:** `inline` y `segmented` son un `<div role="radiogroup" aria-labelledby>` de tres hijos (etiqueta `<span>` · caja de opciones · pie); `list`, `chip` y `card` son un `<fieldset role="radiogroup">` con `<legend>` y `aria-labelledby` a ella (Chromium toma la leyenda sin él; los demás motores lo necesitan). El `<fieldset>` conserva `disabled` en cascada. Un `<legend>` no puede tomar las pistas de una `GFormRow`, por eso las dos apariencias bajas usan `<div>`.
- **Estados en el grupo, nunca en los radios:** `aria-required`, `aria-invalid` (solo con error visible), `aria-readonly` y `aria-describedby` (ayuda y mensaje) van en la raíz. ARIA 1.2 admite esos estados en `radiogroup`, no en `group` ni en `radio`. Ningún radio lleva `required`, `aria-required`, `aria-invalid` ni `aria-readonly` (comprobado en las cinco apariencias).
- **Nombre del radio = su etiqueta** (`aria-labelledby` a `ID-i-label`); la descripción, por `aria-describedby` (solo `list` y `card`); el icono, `aria-hidden`; `dir="auto"` en la etiqueta (aislamiento bidi: «A+» en una página RTL no se lee «+A»).
- **Región de mensaje** `aria-live="polite"` siempre presente (con `field`); dentro de `GForm`, el valor de `live` lo da el formulario.
- **Sin depender del color:** lo elegido lleva punto o relleno con texto en `on-{color}`; la tarjeta, además, borde doble; `readonly` se distingue de `disabled` por borde discontinuo; el error lleva icono y prefijo oculto.
- **Foco por opción:** anillo visible por opción (dentro del segmento en `segmented`). El anillo se ve también en WebKit al moverse con las flechas: el componente marca el radio con un atributo interno `data-g-key-focus` cuando el foco llegó por una tecla de navegación (flechas, Inicio, Fin, Re Pág, Av Pág, Tab, Mayús+Tab) sin un `pointerdown` después, y el CSS lo suma a `:focus-visible` (WebKit no marca `:focus-visible` en el radio al que llevan las flechas; DECISIONS #441). Con un clic de ratón el atributo no aparece. La elegida de solo lectura enfocada conserva su marca y su anillo.
- **Tamaños:** con puntero fino toda opción mide ≥ 24×24; con `pointer: coarse`, ≥ 44×44 (también las cajas de `inline` y `segmented`).
- **Contraste medido** (27 configuraciones por motor: tema por defecto, un tema de auditoría generado con `@grana/cli`, «Tema de prueba», Spotify y los once generados de Dark Color Presence, claro y oscuro): texto (etiquetas, opciones, descripción, ayuda, mensajes y `on-{color}` sobre lo elegido) ≥ 4.51:1; borde del círculo ≥ 3.02:1; contorno del chip y marco del segmentado ≥ 3.43:1; punto sobre el relleno ≥ 4.51:1; trazo de lo elegido ≥ 4.51:1; icono de solo icono ≥ 4.70:1; **hover** (puntero real, cinco apariencias): texto ≥ 4.52:1 y controles ≥ 4.07:1; anillo de foco ≥ 3:1 contra lo que tiene a los dos lados.
- **Alturas:** la caja de `segmented` e `inline` mide lo que la de `GInput` (±0,5px) de `xs` a `xl` y en densidad compacta; en una `GFormRow` las cajas de una misma línea comparten `top` (±1px).
- **Movimiento:** el relleno de la elegida y el punto que crece usan transición; con `prefers-reduced-motion: reduce` no hay `box-shadow`, `scale` ni hundimiento al pulsar (se conservan los fundidos de color) y no se anima nada al montar.
- **Colores forzados** (`forced-colors`, emulado en Chromium): elegida con `SelectedItem`/`SelectedItemText` (segmento, chip y círculo distintos entre sí), marco del segmentado sólido, tarjeta elegida con borde más grueso, solo lectura elegida marcada, y foco `Highlight` distinto de lo que tiene a los dos lados en todas las apariencias, también en la elegida de solo lectura.
- **RTL:** propiedades lógicas; la primera opción queda a la derecha en `segmented` e `inline` (local con `dir="rtl"` y de página).
- **Zoom y escalas:** sin recortes ni desborde en un visor de 640px con DPR 2 (aproxima el 200 %), y con marcos de al menos 1 píxel de dispositivo a DPR 1.25, 1.5 y 2.
- **Navegadores:** medido en Chromium, Firefox y WebKit (Playwright); la comprobación de nombres y roles accesibles (`getByRole`, descripción) en los tres, y el árbol de accesibilidad completo solo en Chromium.

## Tema

El grupo solo lee tokens `--g-*` (sin valores de respaldo) y **no define tokens propios**: el segmentado es una **caja de campo** con los tokens de los campos y el relleno de una casilla marcada; **no** lee `--g-tabs-*`. Cambiar el tema no deja ningún valor fijo en el CSS publicado (auditado en 27 configuraciones de tema por motor).

| Token | Para qué |
| --- | --- |
| `--g-color-surface` | Fondo del círculo, de la caja del segmentado, del chip y de la tarjeta sin elegir |
| `--g-color-surface-sunken` | Tesela del icono de la tarjeta, hover del segmento, fondo de lo deshabilitado |
| `--g-color-border-control` | Borde del círculo, del chip y marco del segmentado (≥ 3:1) |
| `--g-color-border`, `--g-color-border-strong` | Separadores entre segmentos; borde de la tarjeta sin elegir y de lo deshabilitado |
| `--g-color-{color}`, `--g-color-on-{color}` | Punto del círculo; segmento y chip elegidos y su texto |
| `--g-color-{color}-strong` | Hover de lo elegido |
| `--g-color-{color}-soft`, `--g-color-on-{color}-soft` | Fondo de la tarjeta elegida |
| `--g-color-{color}-text` | Borde del círculo, del chip y de la tarjeta elegidos; trazo interior del segmento elegido |
| `--g-color-neutral-soft` | Fondo de `readonly` |
| `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Etiquetas; ayuda y descripción; `disabled` |
| `--g-color-{danger\|warning\|success}-text` | Mensajes, marca de obligatorio, caja del segmentado inválida |
| `--g-color-focus`, `--g-focus-width`, `--g-focus-offset` | Anillo de foco por opción |
| `--g-radius-sm`, `--g-radius-md`, `--g-radius-lg`, `--g-radius-pill` | Caja del segmentado; tesela del icono de la tarjeta; tarjeta; círculo y chip |
| `--g-space-1` … `--g-space-5` | Unidad del círculo y de las alturas por `size`; rellenos y separaciones |
| `--g-font-ui`, `--g-text-{caption\|body-sm\|body}-{size\|line}`, `--g-text-body-sm-weight`, `--g-text-action-weight` | Tipografía |
| `--g-border-width` | Bordes y marcos |
| `--g-duration-fast`, `--g-duration-press`, `--g-ease-standard`, `--g-ease-out`, `--g-press-scale` | Hover, relleno de la elegida, punto que crece y hundimiento al pulsar |

Los colores `{color}` se resuelven por el rol de la familia (`brand` → `primary`, etc.), que el tema garantiza con contraste suficiente. Las alturas de `inline` y `segmented` salen de `--g-space-1` (6, 7, 9, 11 y 13 unidades por `size`, × densidad), con piso de 24px y 44px con `pointer: coarse`; una escala de espaciado distinta (p. ej. `space` 5) las escala sin recortes.

> Los chips de opción usan `--g-radius-pill` fijo, **no** `--g-radius-shape`: un tema con `shape` distinto de `pill` no los cambia (igual que en `GCheckbox`).

```css
:root {
  --g-color-primary: #0B1F4D;        /* relleno de lo elegido */
  --g-color-border-control: #6B7280; /* borde del círculo y marco del segmentado: debe llegar a 3:1 */
  --g-radius-sm: 0px;                /* la caja del segmentado pasa a esquinas rectas */
}
```

## Avisos de desarrollo

Prefijo `[Grana GRadioGroup]`; una vez por instancia y mensaje; solo fuera de producción.

1. Sin nombre accesible (`label`, slot `label`, `aria-label` ni `aria-labelledby`).
2. Menos de 2 opciones válidas; `segmented` con más de 6.
3. Opción sin `value` (o `null`/`undefined`, o de otro tipo que String, Number o Boolean) o sin `label`; opción con `options` (grupo): se ignoran.
4. `value` repetido (por `===` o por `String(value)`).
5. `modelValue` que no está en `options`: se trata como sin selección.
6. Opción elegida deshabilitada («usa `readonly` si el valor no se puede cambiar»).
7. `description` fuera de `list` y `card`: se ignora.
8. `labelMode="icon"` fuera de `segmented` y `chip` (cuenta como `full`); con opciones sin icono (conservan su etiqueta); con el slot `option` (sin efecto).
9. Dentro de un `<form>` sin `name`.
10. Con `field: false`: `error`, `warning`, `valid`, `required` o `mark` (se ignoran).

Además, `GFormRow` avisa si `list`, `chip` o `card` comparten fila con otros campos.

## Cambio colateral: `GCheckbox`

La misma regla que en este componente se aplicó a `GCheckbox` (DECISIONS #270): con `required`, el `<input>` lleva **`aria-required="true"` y ya no el atributo nativo `required`**. La marca visual, `aria-invalid` con error visible y `field: false` no cambian. Motivo: el mismo que en los radios (Chromium expone una casilla obligatoria sin marcar como inválida antes de interactuar). Consecuencia para quien dependía de la validación nativa de `GCheckbox`: ya no bloquea el envío de un `<form>` nativo; valida y pasa `error`. Comprobado por coco: una casilla obligatoria queda **idéntica** a la no obligatoria (borde, fondo, sombra, contorno, tamaño y alto con la marca); ni `GCheckbox.css`, ni `GCheckboxGroup.css`, ni `GRadioGroup.css` leen `[required]`, `:required`, `:invalid`, `:valid` ni `:user-invalid`. **No se extendió** a `GInput`, `GTextarea` ni al `<select>` de `GInputGroupSelect`: queda pendiente de medirlo.

## Clases

Las emite el componente y las estiliza `GRadioGroup.css`:

- **Raíz:** `g-radio-group`, `g-radio-group--appearance-*` (siempre, también `list`), `--size-*`, `--density-*`, `--color-*`, `--icon-only`, `--measure` (interna: solo durante la medida síncrona del segmentado), `is-disabled`, `is-readonly`, `is-invalid`, `is-warning`, `is-valid` e `is-stacked`.
- **Elementos:** `__label` (con `__required` u `__optional`), `__options`, `__option` (con `is-disabled` e `is-icon-only`), `__input`, `__segment` (solo `segmented`), `__icon`, `__text`, `__option-label`, `__description` (solo `list` y `card`), `__support`, `__hint`, `__message`, `__message-icon` y `__message-type`.

Elegida, foco y hover se estilizan con `:checked`, `:focus-visible` y `:has()`, sin clases propias. Datos internos que no son API: `data-g-key-focus` en `g-radio-group__input` (foco por teclado, #441) y, en solo icono, `data-g-tooltip` en el radio, `data-g-tooltip-box` en la `__option` y los nodos `g-tooltip` (con `aria-hidden`) al final de `__options`.

## Limitaciones conocidas

- **Sin `required` nativo:** un `<form>` nativo sin `GForm` no bloquea el envío; valida tú y usa `error`. El componente no valida.
- **`<form>` externo no soportado en v0.1:** no se admite el atributo `form` para asociar los radios a un formulario fuera de su árbol.
- **WebKit:** las flechas no envuelven ni invierten ←/→ en RTL, y en macOS Tab no llega a los radios sin «Acceso total por teclado» (DECISIONS #272).
- **Ancho natural del segmentado medido en el cliente:** en render de servidor sale en una línea hasta montar.
- **Opción solo icono `disabled` sin pista:** con el puntero no se lee su nombre (ver [Pista de solo icono](#pista-de-solo-icono)).
- **Sin grupos de opciones**, sin deseleccionar, sin `GRadio` suelto.
- **Chips de opción con `pill` fijo:** no siguen `--g-radius-shape`.
- **Sin tema oscuro propio:** se verificó con los temas generados claro y oscuro, pero no hay tema oscuro opcional de Grana todavía.
- **Playground:** `#sec-radio` no muestra `warning`/`valid`, colores distintos de `brand`/`accent` ni la elegida de solo lectura en `chip`; esos casos se cubrieron en el banco de la auditoría (`design/lab/radio-group/auditoria-banco.html`).
- **Sin verificar:**
  - un **lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): cómo anuncian el `fieldset role="radiogroup"` frente al `div`, si `aria-required`/`aria-invalid`/`aria-readonly` del grupo se leen (y si se repiten al moverse), la descripción por opción y el modo solo icono;
  - el árbol de accesibilidad completo en Firefox y WebKit;
  - **Safari real** (Tab con «Acceso total por teclado», y si su envolvimiento coincide con el WebKit de Playwright);
  - un dispositivo **táctil real** (el puntero grueso se probó emulado en Chromium);
  - **`forced-colors` real** de Windows (se probó emulado en Chromium; en Firefox y WebKit no se emula);
  - el **zoom real** del navegador al 200 % y 400 % (se aproximó con un visor a la mitad y DPR 2);
  - fuentes de los temas generados (Inter, DM Sans): el contraste no depende de ellas, pero el ancho natural del segmentado sí; se midió con la fuente disponible.

## Verificación

- **Pruebas** (`GRadioGroup.test.js`, vitest con jsdom): 49 pruebas de estructura por apariencia, estados del grupo, modelo con tipos originales y controlado, `FormData`, teclado y solo lectura, deshabilitado, solo icono, slots, `field: false`, contexto de `GForm` (revelado al cambiar y al enviar, `control`, marcas, orden de manejadores), medida y apilado del segmentado (también en render de servidor y sin `ResizeObserver`), `GFormRow`/`GErrorSummary` y los diez avisos. La suite completa de `@grana/vue` pasó 1670/1670 al entregar bruno.
- **Navegador** (Playwright en Chromium, Firefox y WebKit, sobre el componente real del playground): `radio-group.spec.mjs` (teclado, solo lectura, semántica y nombres accesibles, geometría y apilado, formulario con `GErrorSummary`, movimiento y, solo en Chromium, táctil y `forced-colors`) y la fila «Fecha · Sexo · ¿Primera consulta?» de `form-distribution.spec.mjs`: 49 pasan y 8 se omiten por diseño (puntero grueso y colores forzados solo se emulan en Chromium).
- **Auditoría de coco** con el componente real y un tema distinto: `node design/lab/radio-group/auditoria-verificar.mjs`, 81093/81093 comprobaciones en los tres motores; el banco de estilo, 61357/61357.

## Fuentes

- API: [`GRadioGroup.meta.json`](./GRadioGroup.meta.json) · Contrato: [`design/contracts/radio-group.md`](../../../../../design/contracts/radio-group.md) (DECISIONS #267 a #273) · Prototipo: [`design/lab/radio-group/r01/`](../../../../../design/lab/radio-group/r01/) · Estilo: [`design/lab/radio-group/estilo.md`](../../../../../design/lab/radio-group/estilo.md) · Auditoría: [`design/lab/radio-group/auditoria.md`](../../../../../design/lab/radio-group/auditoria.md)
