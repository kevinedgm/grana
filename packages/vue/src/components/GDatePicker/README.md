# GDatePicker

Selector de **una fecha o de un rango de fechas**. Muestra uno o dos meses según el ancho disponible, se abre desde un campo (popover en escritorio, hoja inferior en móvil) o vive en línea dentro de un Dialog o una página. El rango es una **franja continua** entre el inicio y el fin, y el valor es una **cadena ISO `YYYY-MM-DD`** (sin hora ni zona: no hay desfase de un día).

**Etiqueta:** `<g-datepicker>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/datepicker/auditoria.md`](../../../../../design/lab/datepicker/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`. Usa `popover`, `Intl` y, para el primer día de la semana, `Intl.Locale.getWeekInfo` cuando el navegador lo trae.

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
const fechas = ref(null) // { start: '2026-10-08', end: '2026-10-12' }

// Todo texto que no es una fecha lo pones tú (Grana no trae textos en ningún idioma)
const labels = {
  prev: 'Mes anterior', next: 'Mes siguiente', dialog: 'Elegir fechas', close: 'Cerrar',
  today: 'hoy', selected: 'seleccionada', rangeStart: 'inicio del rango', rangeEnd: 'fin del rango',
  rangeSingle: 'inicio y fin del rango', inRange: 'dentro del rango', unavailable: 'no disponible',
  clear: 'Limpiar', done: 'Listo', proximityGroup: 'Ampliar el rango'
}
</script>

<template>
  <g-datepicker v-model="fechas" mode="range" label="Fechas" placeholder="Elige fechas" :labels="labels" />
</template>
```

> **Nombre de la etiqueta:** Vue resuelve `<g-datepicker>` como `GDatepicker`; por eso el registro de Grana incluye ese alias además de `GDatePicker` (también funciona `<g-date-picker>`). En plantillas dentro del HTML (sin compilar), escribe `<g-datepicker ...></g-datepicker>`: Vue no admite etiquetas de componente autocerradas.

## Formas de uso

| Forma | Cómo |
| --- | --- |
| **Campo + popover** (por defecto) | Un botón con el valor formateado; abre la superficie debajo (o encima, si no cabe). En móvil (≤ ~520px) es una **hoja inferior** |
| **Rango en un campo** | `mode="range"`: un campo muestra «8–12 oct 2026» |
| **Desde / Hasta** | `mode="range" split`: dos botones que abren la **misma** superficie; `label-start` y `label-end` |
| **En línea** | `inline`: solo la superficie; **es lo que va dentro de un `GDialog`** (nunca abre un popover ni otro Dialog) |
| **Tu propio botón** | Slot `trigger` (por ejemplo, un segmento de una barra de búsqueda) con `anchor` para posicionar la superficie |

```vue
<!-- Barra de búsqueda: Destino / Fecha / Personas / Buscar -->
<div id="barra">
  …
  <g-datepicker v-model="fechas" mode="range" anchor="#barra" :labels="labels" :proximity="proximidad">
    <template #trigger="{ controls, expanded, toggle, text }">
      <button aria-haspopup="dialog" :aria-expanded="String(expanded)" :aria-controls="controls" @click="toggle">
        {{ text || 'Agrega fechas' }}
      </button>
    </template>
  </g-datepicker>
</div>
```

Con el slot `trigger` no se renderizan `label`, `hint`, `error`, `name` ni `split`: los pones tú. Eres responsable del **nombre accesible y del foco visible** de tu botón.

## Selección

- **`single`:** elegir un día lo fija y emite.
- **`range`:** el primer toque es el **inicio** (con vista previa de la franja al mover el puntero o el foco); el segundo es el **fin**; un tercer toque abre un rango nuevo. Tocar un día **anterior** al inicio pendiente **cambia el inicio** (no invierte el rango). Un rango puede ser de un día (inicio = fin).
- **Solo se emiten valores completos.** Elegir el inicio **no** emite `update:modelValue` (una reserva a medias no debe llegar al formulario): usa el evento `start` para consultar disponibilidad o precios. **Cerrar el popover con un inicio pendiente lo descarta.**
- **Un día no disponible** (`min`, `max`, `disabledDates`) se muestra tachado, no se elige y **sigue recibiendo foco** con las flechas. Un rango **puede contener** días no disponibles en medio: valídalo con `change`.
- **Proximidad** (`proximity`): chips «± N días» que amplían **ambos** extremos del rango, respetando `min` y `max`.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` | String \| Object \| null | `single`: `'2026-10-08'`; `range`: `{ start, end }` | `null` |
| `mode` | String | `single` `range` | `single` |
| `inline` | Boolean | | `false` |
| `open` | Boolean | (con `update:open`; solo sin `inline`) | `false` |
| `min`, `max` | String | fecha ISO | sin valor |
| `disabledDates` | Function | `(iso) => boolean` | sin valor |
| `months` | String \| Number | `auto` `1` `2` | `auto` |
| `locale` | String | etiqueta BCP 47 | la de `<html lang>` |
| `firstDay` | Number | 0 (domingo) a 6 | el del idioma (lunes si el navegador no lo sabe) |
| `labels` | Object | ver «Textos» | `{}` |
| `proximity` | Array | `[{ days, label, ariaLabel? }]` | `[]` (solo `range`) |
| `summary` | Boolean | | `true` |
| `closeOnSelect` | Boolean | ver «Cierre» | sin valor |
| `anchor` | String \| Element | selector CSS o elemento | el campo |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` (color de la selección) |
| `variant`, `size`, `density`, `rounded`, `block` | | como `GSelect` (solo el **campo**) | `outline`, `md`, `default` |
| `disabled`, `readonly` | Boolean | | `false` |
| `label`, `hint`, `error`, `placeholder`, `required`, `name`, `id` | | como `GSelect` (campo) | sin valor |
| `split`, `labelStart`, `labelEnd`, `placeholderStart`, `placeholderEnd` | | Desde / Hasta | |

Un valor de prop fuera de su lista avisa en desarrollo. `loading` **no aplica**.

- **`modelValue` inválido** (formato, `2026-02-30`, `start` posterior a `end`, o un tipo que no corresponde al `mode`) se trata como vacío y avisa **una vez** en desarrollo. El componente **no recorta** un valor fuera de `min`/`max`: lo muestra tal cual.
- **`months="auto"`:** dos meses si el ancho disponible los deja con celdas cómodas, uno si no. El umbral **no es un número fijo**: sale de la **celda medida** (`--g-space-1 × 10`, o 44px con puntero táctil): con el tema por defecto, unos 648px (unos 812px con `space` 5). El ancho disponible es el del contenedor (en línea) o el de la ventana (popover), o el del `anchor` si lo das. En móvil es siempre un mes.
- **`inline`:** ignora las props de campo (`label`, `hint`, `error`, `placeholder`, `required`, `name`, `split`, `size`, `density`, `rounded`, `block`, `variant`) y avisa una vez en desarrollo.
- **`name`:** `single` renderiza un `<input type="hidden" name>` con el ISO; `range` renderiza **dos**: `name-start` y `name-end`. Un campo oculto no participa en la validación nativa: valida tú y usa `error`.
- **`error`:** deja el campo inválido (`aria-invalid`, mensaje visible con región viva siempre presente). **El componente no valida.**
- **`readonly`:** el campo se enfoca pero no abre; en `inline`, navega sin elegir. **`disabled`:** sin foco ni envío.
- **Atributos:** `class` y `style` van a la raíz; `aria-*`, `data-*` y escuchas (`onFocus`…) al **botón del campo** (al primero con `split`; en `inline`, a la raíz). Solo se declaran los eventos de la tabla.

## Textos (`labels`)

`labels` es un objeto con **tus** textos; ninguno tiene valor por defecto (Grana es internacional). Los nombres de mes y de día, el orden y el formato de las fechas los da `Intl` con `locale`.

| Clave | Uso | ¿Requerido? |
| --- | --- | --- |
| `prev`, `next` | Nombre de los botones de mes anterior y siguiente | **Sí** (aviso en desarrollo) |
| `dialog` | Nombre accesible del popover | **Sí**, sin `inline` |
| `close` | Nombre del botón de cierre de la hoja móvil | **Sí**, sin `inline` |
| `today`, `selected`, `rangeStart`, `rangeEnd`, `rangeSingle`, `inRange`, `unavailable` | Sufijo del nombre de cada día: «…, hoy», «…, inicio del rango»… | No (recomendados: sin ellos, un día se nombra solo con su fecha) |
| `clear`, `done` | «Limpiar» y «Listo». **Cada botón solo existe si tiene texto** | No (`done` hace falta en la hoja móvil y con `proximity`) |
| `proximityGroup` | Nombre del grupo de chips | No (recomendado con `proximity`) |
| `announceStart`, `announceEnd`, `announceDate`, `announceWiden`, `announceClear` | Mensajes de la región viva; marcadores `{date}`, `{start}`, `{end}`, `{days}` (días **inclusivos**) | No: sin ellos, **no se anuncia** cada paso |

Los `proximity` van con su texto: `[{ days: 3, label: '± 3 días', ariaLabel: 'Ampliar el rango 3 días por cada lado' }]`. Si das `ariaLabel`, debe **contener** el texto visible (WCAG 2.5.3).

## Cierre y foco (sin `inline`)

- Al abrir, el foco va al **día elegido** (o a hoy). Al cerrar con Esc, con «Listo» o al completar la selección, vuelve al campo que abrió (con `split`, al botón que lo abrió).
- **`closeOnSelect`** sin valor: `single` cierra al elegir; `range` cierra al completarse **salvo que haya `proximity`** (entonces se cierra con «Listo»). `true` o `false` lo fuerzan.
- Cierra también con **clic fuera** y cuando **el foco sale** de la superficie con Tab (en ese caso no devuelve el foco). No atrapa el foco.
- **Esc cierra solo el selector:** no llega a un `GDialog` que lo contenga.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | ISO, `{ start, end }` o `null` | El valor completo cambia (elegir, completar un rango, ampliar, limpiar) |
| `change` | igual | Igual que `update:modelValue` |
| `start` | `{ date }` | Solo `range`: se elige el inicio (pendiente) |
| `navigate` | `{ month }` (`YYYY-MM`) | Cambia el mes visible (botones, teclado, deslizamiento) |
| `update:open`, `open`, `close` | Boolean / — | El popover se abre o se cierra |

Métodos expuestos: `open()`, `close()` y `focus()`.

## Slots

| Slot | Contenido |
| --- | --- |
| `label`, `hint`, `error` | Texto rico del campo (sin interactivos) |
| `trigger` | Sustituye al campo. Alcance: `{ id, expanded, controls, toggle, open, close, value, text }` |
| `summary` | Sustituye al resumen. Alcance: `{ start, end, pending, days }` (`days` inclusivos) |
| `day` | Contenido **tras el número** del día (por ejemplo, un precio). Alcance: `{ date, day, selected, inRange, disabled, outside }`. No cambia el nombre accesible ni el tamaño de la celda: si es información, añádela también a tus `labels`/resumen |
| `icon` | Icono del campo (decorativo); por defecto, un calendario dibujado con CSS |

## Teclado

| Tecla | Acción |
| --- | --- |
| Enter / Espacio | En el campo: abre. En un día: lo elige |
| ← / → | Día anterior / siguiente (se invierten en RTL) |
| ↑ / ↓ | Misma fecha en la semana anterior / siguiente |
| Inicio / Fin | Primer / último día de la semana (según `firstDay`) |
| Re Pág / Av Pág | Mes anterior / siguiente (el último día si no existe el mismo) |
| Mayús + Re Pág / Av Pág | Año anterior / siguiente |
| Esc | Cierra el popover, devuelve el foco al campo y descarta un inicio pendiente |
| Tab | Recorre botones de mes, chips y acciones; al salir de la superficie, cierra |

Si el día con foco sale de los meses visibles, se desplazan los meses. En táctil, **deslizar horizontalmente** cambia de mes.

## Accesibilidad

- **Patrón APG *date picker dialog*:** cada mes es un `role="grid"`; **un solo tabstop** (`tabindex` móvil entre los botones de día). El popover es un `role="dialog"` no modal.
- **Cada día tiene su nombre completo** («miércoles, 28 de octubre de 2026, hoy, inicio del rango»): el estado va en el nombre, no solo en `aria-selected`.
- **El estado no depende solo del color** (WCAG 1.4.1): seleccionado = círculo relleno; hoy = aro y punto; no disponible = tachado; inactivo = cursiva; el rango tiene además inicio y fin con nombre propio y un resumen en texto.
- **Objetivos táctiles:** día de `--g-space-1 × 10` (40px por defecto) y **44px** con `pointer: coarse`; chips, acciones y botones de mes de 44px en táctil.
- **Contraste** (auditoría): con el tema por defecto, texto de día 17.4:1, atenuado y tachado 5.10:1, bordes del campo y de los chips 3.45:1; con un tema distinto (espacio 5, foco de 3px), 6.18:1 o más en el texto atenuado. **Con `forced-colors`** la franja pasa a un borde superior e inferior y la selección conserva su borde.
- **Movimiento:** solo transiciones de color y la aparición del popover; con `prefers-reduced-motion` no hay transiciones.
- **RTL:** las propiedades son lógicas; en la auditoría se invirtieron columnas, chevrones y franja, y las flechas siguen la dirección.

## Tema

El componente solo lee tokens `--g-*`; **no crea ninguno**. `color` reasigna la selección (`--g-color-{color}`, `on-`, `-soft`, `on-…-soft`); el foco es siempre `--g-color-focus`. El popover usa `--g-color-surface`, `--g-shadow-2` y `--g-surface-radius`; la hoja móvil, el sistema de superficies (`--g-surface-*`), como `GDialog` y `GSelect`. La celda y el umbral de dos meses derivan de `--g-space-1`.

## Dentro de un formulario

Con un `GForm` alrededor el campo lee su contexto: densidad, solo lectura, deshabilitado, ancho completo y el error de `errors[name]` (que `GForm` muestra cuando toca: al salir tras escribir, al elegir o al enviar). **La prop explícita del campo siempre gana**; fuera de `GForm` se comporta exactamente como antes. Guía completa del sistema: [`GForm/README.md`](../GForm/README.md).

- **Marcas por convención** del formulario (`marks` de `GForm`): «(opcional)» como texto dentro de la etiqueta (forma parte del nombre accesible) o asterisco con `required`, nunca las dos; `mark: false` quita la del campo.
- **Un solo mensaje** bajo el campo, `g-datepicker__message` (región viva siempre presente): `error` (icono `circle-alert`, borde doble), `warning` (`triangle-alert`, borde **discontinuo** doble) o `valid` (`circle-check`, borde sencillo de éxito), en ese orden de prioridad, con un prefijo oculto («Error: », «Advertencia: », «Correcto: », de `labels` de `GForm`). Sustituye a la antigua región `__error`.
- **En una `GFormRow`** (modo campo; `inline` y `split` van en su propia fila) comparte línea con otros campos: la raíz tiene tres hijos (etiqueta, caja y `g-datepicker__support` con ayuda y mensaje) y las cajas de una línea quedan a la misma altura aunque una etiqueta ocupe dos líneas. El tamaño en la fila se da con `g-form-w-xs|sm|md|lg`.
- **`output`**: un valor que calcula la aplicación a partir de la fecha (la edad): `<output>` cortés tras la fecha, dentro de la caja; no se envía.
- **Solo lectura** (propia o por `GForm readonly`): relleno `--g-color-neutral-soft`, borde **discontinuo** `--g-color-border-control` (≥ 3.02:1 sobre el relleno, medido) y texto pleno; enfocable y seleccionable. Distinto de deshabilitado sin depender del color.

## Clases

Las emite el componente y las estiliza `GDatePicker.css`: `g-datepicker` (con `--mode-*`, `--variant-*`, `--size-*`, `--density-*`, `--color-*`, `--rounded-*`, `--block`, `--inline`, `--split`, `is-open`, `is-disabled`, `is-readonly`, `is-invalid`), `__label`, `__field`, `__value`, `__pop`, `__surface`, `__months`, `__month`, `__title`, `__nav`, `__grid`, `__day` (con `is-selected`, `is-today`, `is-disabled`, `is-outside`, `is-inactive`), las celdas de la franja (`is-in-range`, `is-range-start`, `is-range-end`, `is-preview`, `is-cap-start`, `is-cap-end`), `__chip`, `__summary`, `__action`, `__sr`.

## Limitaciones conocidas

- **No se puede escribir la fecha a mano** en el campo (cada idioma tiene su formato): el campo es un botón. **Sin** selección de varias fechas sueltas, hora, ni vistas de meses o años.
- **La franja del rango es muy tenue frente a la superficie** (1.14:1 con el tema por defecto, 1.22:1 con el de la auditoría): los tonos suaves de las marcas no están pensados para un elemento gráfico. Lo que identifica el rango es el inicio y el fin (círculos de alto contraste), el nombre de cada día y el resumen. Está pendiente decidir si se refuerza (borde o tono más fuerte).
- **Sin textos por defecto:** sin `labels.prev` y `labels.next`, los botones de mes no tienen nombre; sin `labels.dialog`, el popover tampoco.
- **`Intl.Locale.getWeekInfo`** no está en todos los navegadores: sin él, la semana empieza en lunes salvo que des `firstDay`.
- **No atrapa el foco:** Tab hacia fuera cierra el popover. En la hoja móvil el fondo lo cubre y el clic fuera cierra.
- **La hoja móvil** se activa con una consulta de medios sobre el visor (~520px), no sobre el contenedor.
- No hay tema oscuro todavía.
- **Sin verificar:** un lector de pantalla real (cuadrícula, rango, título vivo, hoja móvil), RTL con un idioma RTL real, Firefox y Safari (`popover`, `::backdrop`, `scale` y `rotate` individuales), la hoja móvil con teclado virtual, el deslizamiento en un dispositivo táctil real, y `forced-colors` y `prefers-reduced-motion` reales (los bloques se comprobaron aplicados sin condición).

## Fuentes

- API: [`GDatePicker.meta.json`](./GDatePicker.meta.json) · Contrato: [`design/contracts/datepicker.md`](../../../../../design/contracts/datepicker.md) · Prototipo: [`design/lab/datepicker/r01/`](../../../../../design/lab/datepicker/r01/) · Auditoría: [`design/lab/datepicker/auditoria.md`](../../../../../design/lab/datepicker/auditoria.md)
