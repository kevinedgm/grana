# GStepper

Indicador de avance para procesos de **pasos discretos y conocidos**: formularios de varios pasos, onboarding, checkout, asistentes o flujos de aprobación. Responde tres preguntas de un vistazo: **dónde estoy, qué ya hice y qué falta**. Una sola lógica de pasos se dibuja en horizontal o vertical, con número, punto, icono, segmento o línea, y se transforma en un resumen compacto cuando el contenedor es estrecho.

**Etiqueta:** `<g-stepper>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/stepper/auditoria.md`](../../../../../design/lab/stepper/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`.

> **No es una barra de progreso continuo** (porcentaje o indeterminado): ese es otro componente, todavía por diseñar (DECISIONS.md #97).

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

```vue
<script setup>
import { ref } from 'vue'
const pasos = [
  { id: 'plan', label: 'Plan', description: 'Elige tu plan' },
  { id: 'cuenta', label: 'Cuenta', description: 'Datos de acceso' },
  { id: 'pago', label: 'Pago', description: 'Tarjeta o transferencia' },
  { id: 'fin', label: 'Confirmación' }
]
const textos = {
  complete: 'completado', current: 'paso actual', pending: 'pendiente',
  error: 'con error', warning: 'con advertencia', disabled: 'bloqueado', optional: 'opcional',
  progress: 'Paso {current} de {total}', showAll: 'Ver todos los pasos', hideAll: 'Ocultar pasos'
}
const actual = ref('cuenta')
</script>

<template>
  <g-stepper v-model="actual" :steps="pasos" :labels="textos" navigation="back" aria-label="Registro de cuenta"></g-stepper>
</template>
```

**Los textos no tienen valor por defecto** (Grana es internacional): los pasas en `labels`. El nombre del `<nav>` va en `aria-label` o `aria-labelledby`. Si falta alguno, en desarrollo se emite `console.warn`.

> **En plantillas dentro del HTML** (sin compilar), escribe `<g-stepper ...></g-stepper>`: Vue no admite etiquetas de componente autocerradas.

## Cómo se decide el estado de cada paso

**Lógica → estado → variante.** El estado se calcula siempre igual; `orientation` e `indicator` solo cambian cómo se dibuja.

1. **Derivado del paso actual** (`modelValue`): los anteriores están `complete`, el actual `current` y los siguientes `pending`.
2. **Marcas tuyas**, que se suman a lo derivado: `status: 'error' | 'warning'`, `disabled` (bloqueado) y `optional`. Un paso hecho puede tener advertencia; uno pendiente puede ser opcional o estar bloqueado.

| Estado | Cómo se ve (nunca solo por color) |
| --- | --- |
| Hecho | Relleno sólido con `check` |
| Actual | Anillo, etiqueta en negrita y conector de salida a medias |
| Pendiente | Indicador vacío |
| Error | Borde doble, icono `circle-alert` y etiqueta con subrayado ondulado |
| Advertencia | Borde discontinuo, icono `triangle-alert` y subrayado discontinuo |
| Bloqueado | Candado (`lock`), tono atenuado y nunca es botón |
| Opcional | Texto «(opcional)» junto a la etiqueta (de `labels.optional`) |

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `steps` | Array | `{ id?, label, description?, status?, optional?, disabled? }` | `[]` |
| `modelValue` (`v-model`) | String \| Number | `id` del paso actual | primer paso |
| `orientation` | String | `horizontal` `vertical` | `horizontal` |
| `indicator` | String | `number` `dot` `icon` `segment` `line` | `number` |
| `navigation` | String | `none` `back` `free` | `none` |
| `responsive` | String | `auto` `never` `compact` | `auto` |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` |
| `size` | String | `sm` `md` `lg` | `md` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `disabled` | Boolean | | `false` |
| `expandAll` | Boolean | | `false` |
| `labels` | Object | ver abajo | `{}` |

Un valor fuera de la lista muestra una advertencia en desarrollo. No hay `variant`: la forma sale de `orientation` × `indicator`.

- **`steps[].id`:** si falta, el `id` es el índice (0, 1, 2…). `label` es obligatorio y es el nombre accesible del paso.
- **`modelValue`:** `id` del paso actual. Si no coincide con ninguno, ningún paso es el actual y en desarrollo hay `console.warn`. El componente **nunca cambia el prop por su cuenta**.
- **`indicator`:** `number` (número; `check` al completar), `dot` (nodo pequeño; el actual lleva un anillo concéntrico), `icon` (el icono lo pones tú en el slot `icon`; sin él, el número), `segment` (cada paso es un tramo de una barra única, con la etiqueta debajo) y `line` (solo etiqueta y subrayado; error y advertencia conservan su icono).
- **`navigation`:** `none` (informativo, ningún paso es control), `back` (los pasos anteriores al actual son botones) o `free` (todos menos el actual y los bloqueados). **Las reglas de negocio son tuyas:** para «solo avanzar en secuencia», controla `modelValue`; el componente no valida pasos.
- **`responsive`:** `auto` (se adapta al ancho de su contenedor; ver «Adaptación»), `never` (siempre completo) o `compact` (siempre compacto). En `vertical`, `auto` no pasa a compacto.
- **`color`:** color de los pasos hechos, el actual y el conector hecho. `brand` lee `--g-color-primary*`. Error y advertencia usan siempre `danger` y `warning`.
- **`size`:** escala indicador y tipografía (indicador de 20, 24 y 32px con `space` 4).
- **`density`:** multiplica la separación y el relleno vertical (1×, 0.875×, 0.75×). No cambia la tipografía ni el indicador.
- **`disabled`:** ningún paso es botón. No marca pasos como bloqueados.
- **`expandAll`:** en `vertical`, muestra el contenido de **todos** los pasos; por defecto, solo el del actual.
- **Resto de atributos** (`class`, `style`, `data-*`, `aria-*`, escuchas): van al `<nav>`.

### `labels`

| Clave | Uso | Si falta |
| --- | --- | --- |
| `complete`, `current`, `pending`, `error`, `warning`, `disabled`, `optional` | Texto oculto que sigue a la etiqueta de cada paso («Plan, completado, con advertencia»). `optional` también se muestra entre paréntesis | Ese estado no se anuncia; un solo aviso en desarrollo |
| `progress` | Plantilla del resumen compacto con `{current}` y `{total}` | Se muestra `2/5` |
| `showAll`, `hideAll` | Nombre del botón que despliega u oculta la lista en el compacto | Sin `showAll` el botón no existe (aviso en desarrollo); sin `hideAll` se mantiene `showAll` |

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `id` del paso | El usuario activa un paso navegable y nadie impidió `select` |
| `select` | `{ id, index, preventDefault() }` | El usuario activa un paso navegable. **Cancelable** |

```vue
<g-stepper v-model="actual" :steps="pasos" :labels="textos" navigation="free" aria-label="Registro"
  @select="(e) => { if (hayCambiosSinGuardar) e.preventDefault() }"></g-stepper>
```

Llama a `preventDefault()` de forma síncrona para impedir el cambio. Un cambio de `modelValue` desde fuera (tus botones «Anterior» y «Siguiente») **no** emite `select`.

## Slots

| Slot | Alcance | Contenido |
| --- | --- | --- |
| `content` | `{ step, index, state }` | Contenido asociado al paso. Solo en `vertical`: el del actual, o todos con `expandAll` |
| `icon` | `{ step, index, state }` | Icono del paso con `indicator="icon"`. Grana no trae iconos; usa [Lucide](https://lucide.dev). Es decorativo: el nombre lo da la etiqueta |
| `label` | `{ step, index, state }` | Etiqueta con contenido rico. Sin controles dentro |
| `description` | `{ step, index, state }` | Descripción con contenido rico. Sin controles dentro |

`state` es `complete`, `current` o `pending`.

```vue
<g-stepper v-model="actual" :steps="pasos" :labels="textos" orientation="vertical" navigation="back" aria-label="Configuración">
  <template #content="{ step }">
    <FormularioDelPaso :paso="step.id" />
  </template>
</g-stepper>
```

## Adaptación

El stepper se adapta al ancho **de su contenedor**, no al de la ventana, así que funciona igual dentro de un diálogo o un panel lateral. Los umbrales dependen del número de pasos `n` y del espacio base (`--g-space-1`):

| Ancho del contenedor (horizontal, `responsive="auto"`) | Se muestra |
| --- | --- |
| ≥ `n × space × 32` (5 pasos con `space` 4: 640px) | Etiquetas y descripciones |
| ≥ `n × space × 28` (560px) | Solo etiquetas |
| menos | **Compacto:** nombre del paso actual, «Paso 2 de 5», barra segmentada fina y un botón que despliega la lista completa en vertical |

- Con muchos pasos, el mismo cálculo lleva antes a compacto: nueve pasos pasan a compacto por debajo de 1008px. No hay scroll horizontal.
- La lista desplegada del compacto es siempre **vertical y numerada**, sea cual sea `indicator`.
- Sin medición (render en servidor o sin `ResizeObserver`) se muestra completo.
- **Etiquetas truncadas:** en horizontal cada etiqueta ocupa una línea con elipsis (5 pasos a 600px: «Confir…»). El texto completo sigue en el DOM y lo lee el lector de pantalla. En vertical las etiquetas se ajustan en varias líneas.

## Teclado y foco

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Recorre **solo** los pasos navegables y, en compacto, el botón de desplegar |
| Enter / Espacio | Activa el paso o el botón enfocado (nativo) |

- **Sin flechas:** no es un `tablist`; no cambia paneles por sí mismo.
- **Tras activar un paso**, si actualizas `modelValue`, el foco pasa al paso actual nuevo (el botón pulsado deja de ser botón al volverse el actual). Si impides el cambio, el foco se queda donde estaba.

## Accesibilidad

- **Estructura:** `<nav>` con nombre (tu `aria-label`) y una lista `<ol>`. La lista anuncia el total de pasos; el actual lleva `aria-current="step"`.
- **Estado:** cada paso lleva un texto oculto con su estado, tomado de `labels`. Los indicadores e iconos son decorativos (`aria-hidden`).
- **Controles:** solo los pasos navegables son `<button>`; el actual y los bloqueados son texto.
- **Sin depender del color:** cada estado tiene forma, icono, peso o subrayado propios.
- **Contraste medido** con el tema por defecto, con un tema de prueba y con el tema oscuro: texto ≥ 4.5:1 y bordes de indicador pendientes ≥ 3:1. En oscuro, error y advertencia quedan justo por encima del mínimo (4.52 y 4.54:1).
- **Foco visible:** contorno de `--g-focus-width` con `--g-color-focus`. Con `pointer: coarse`, los pasos navegables y el botón de desplegar miden 44px.
- **Movimiento:** las transiciones de estado solo existen con `prefers-reduced-motion: no-preference`.
- **RTL:** los degradados del conector y del tramo se invierten con `:dir(rtl)`.
- **Colores forzados:** indicadores, conectores y tramos usan colores de sistema y conservan su forma.

## Tema

El componente solo lee tokens `--g-*` y **no añade tokens propios**: el indicador, el conector y la separación se derivan de `--g-space-1` y `--g-border-width`. Cambiar el espacio base escala todo, incluidos los umbrales de adaptación.

```css
:root {
  --g-color-primary: #7A1E3A;        /* pasos hechos, actual y conector hecho (color="brand") */
  --g-color-border-control: #7D7590; /* borde de los pasos pendientes: debe llegar a 3:1 */
  --g-border-width: 2px;             /* el conector mide el doble */
  --g-space-1: 5px;                  /* indicador de 30px en lugar de 24px */
}
```

Consume también las familias `--g-color-{accent|neutral|success|warning|danger|info}` (con `-strong`, `-soft`, `-text` y `on-`), `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle`, `--g-color-border`, `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-focus`, `--g-radius-pill`, `--g-radius-xs`, `--g-font-ui`, `--g-text-{caption|body-sm|body}-{size|line}`, `--g-text-caption-weight`, `--g-text-title-weight`, `--g-text-action-weight`, `--g-focus-width`, `--g-focus-offset`, `--g-duration-{fast|press}`, `--g-ease-{standard|out}` y `--g-press-scale`.

## Clases

Las emite el componente y las estiliza `GStepper.css`:

- **Raíz:** `g-stepper`, `g-stepper--{horizontal|vertical}`, `--indicator-*`, `--color-*`, `--size-*`, `--density-*`, `--navigable`, `--condensed`, `--is-compact` e `is-disabled`.
- **Paso:** `g-stepper__step` con `is-complete|is-current|is-pending` y las marcas `is-error`, `is-warning`, `is-disabled` e `is-optional`.
- **Elementos del paso:** `__hit`, `__indicator`, `__text`, `__label`, `__optional`, `__description`, `__status`, `__connector` y `__content`.
- **Conectores y tramos:** `is-done`, `is-toward` (saliente del actual) o `is-pending`.
- **Compacto:** `__compact`, `__summary`, `__summary-name`, `__summary-count`, `__bar`, `__bar-seg` y `__toggle`.

## Limitaciones conocidas

- **Sin scroll horizontal** ni «condensar pasos completados» en v0.1: el desbordamiento se resuelve con el compacto.
- **Iconos de estado fijos** (`check`, `circle-alert`, `triangle-alert`, `lock`). Los de cada paso, con `indicator="icon"`, los pones tú.
- **No es un `progressbar`:** el compacto comunica el avance con texto; la barra es decorativa.
- **Sin verificar:** un lector de pantalla real (anuncio de la lista, `aria-current` y texto de estado), Firefox y Safari, `forced-colors` real (se probó emulado), zoom al 200% y un dispositivo táctil real.

## Fuentes

- API: [`GStepper.meta.json`](./GStepper.meta.json) · Contrato: [`design/contracts/stepper.md`](../../../../../design/contracts/stepper.md) · Prototipo: [`design/lab/stepper/r01/`](../../../../../design/lab/stepper/r01/) · Estilo: [`design/lab/stepper/estilo.md`](../../../../../design/lab/stepper/estilo.md) · Auditoría: [`design/lab/stepper/auditoria.md`](../../../../../design/lab/stepper/auditoria.md)
