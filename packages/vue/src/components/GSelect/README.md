# GSelect

Selector de **una** opción con lista propia, completo: etiqueta, ayuda, mensaje de error, prefijo e iconos, grupos, opciones deshabilitadas, teclado con escritura rápida y una fila «Agregar nuevo…» para catálogos incompletos. Sigue el patrón *select-only combobox* de WAI-ARIA y comparte el lenguaje de [`GInput`](../GInput/README.md): mismas variantes, tamaños, densidad, colores de foco y estados. En móvil, la lista es una hoja inferior.

**Etiqueta:** `<g-select>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/select/auditoria.md`](../../../../../design/lab/select/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0` (usa `useId`) y un navegador con `popover`, `::backdrop` de popover, `:popover-open` y `:has()`: los actuales.

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

```vue
<g-select v-model="pais" :options="paises" label="País" placeholder="Elige un país" name="pais" hint="Escribe para saltar." />
```

```js
const paises = [
  { label: 'Norteamérica', options: [{ value: 'mx', label: 'México' }, { value: 'us', label: 'Estados Unidos' }] },
  { label: 'Europa', options: [{ value: 'es', label: 'España' }, { value: 'de', label: 'Alemania', disabled: true }] },
  { value: 'other', label: 'Otro' }
]
```

Los atributos nativos (`aria-*`, `data-*`, escuchas como `@focus`) van al **botón** (`role="combobox"`); solo `class` y `style` van a la raíz.

> **En plantillas dentro del HTML** (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-select ...></g-select>`.

## Opciones

`options` es un arreglo de **opciones** y de **grupos**, mezclables:

- **Opción:** `{ value, label, disabled? }`. `value` es String o Number y **único** en toda la lista (un duplicado avisa en desarrollo). `label` es el texto que se muestra, se anuncia y se busca al escribir. Puedes añadir tus propios campos (por ejemplo `icon` o `meta`): llegan a los slots en `option`.
- **Grupo:** `{ label, options }`. No se anida. Su `label` es su nombre accesible.
- Una opción sin `value` o sin `label` se ignora y avisa en desarrollo.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` (`v-model`) | String \| Number \| null | | `null` |
| `options` | Array | opciones y grupos | `[]` |
| `variant` | String | `outline` `soft` | `outline` |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | sin valor (usa `--g-color-focus`) |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor (`sm`) |
| `block` | Boolean | | `false` |
| `disabled` | Boolean | | `false` |
| `readonly` | Boolean | | `false` |
| `loading` | Boolean | | `false` |
| `placeholder` | String | | sin valor |
| `clearable` | Boolean | | `false` |
| `clearLabel` | String | | sin valor |
| `emptyText` | String | | sin valor |
| `createLabel` | String | | sin valor |
| `label` | String | | sin valor |
| `hint` | String | | sin valor |
| `error` | String | | sin valor |
| `required` | Boolean | | `false` |
| `name` | String | | sin valor |
| `id` | String | | generado (es el `id` del botón) |

Un valor fuera de la lista muestra una advertencia en desarrollo. `variant` solo admite `outline` y `soft`.

- **`modelValue`:** el `value` de la opción elegida, comparado con `===`. `null` o un valor sin opción muestra el `placeholder`. **Es controlado**: si no actualizas el prop, el selector sigue mostrando el valor anterior. No hay selección múltiple.
- **Textos sin valor por defecto** (Grana es internacional): `placeholder` (sin él, el selector sin valor queda vacío), `clearLabel`, `emptyText` y `createLabel`.
- **`clearable`:** con valor, muestra un botón aparte para borrar (`null`). **Solo se renderiza con `clearLabel`** (su nombre accesible); sin él, en desarrollo hay `console.warn`. No se muestra con `readonly` ni `disabled`.
- **`label`:** el selector necesita un nombre accesible. Sin `label`, sin slot `label` y sin `aria-label` ni `aria-labelledby`, en desarrollo hay `console.warn`. El nombre que se anuncia es **etiqueta + texto del valor**.
- **`error`:** con texto, el selector queda inválido (`aria-invalid="true"`) y se muestra el mensaje. **El componente no valida.**
- **`required`:** `aria-required` y una marca visual. **Límite:** el campo oculto de `name` no participa en la validación nativa de un `<form>` (los navegadores no validan campos ocultos); si necesitas bloquear el envío, valida tú y usa `error`.
- **`name`:** crea un `<input type="hidden" name>` con el valor (`String(value)`, o `''` sin valor) para formularios nativos.
- **`readonly`:** `aria-readonly`; enfocable, pero **no abre** (ni con clic ni con teclado). El valor se envía. **`disabled`:** atributo nativo del botón.
- **`loading`:** `aria-busy="true"` y un anillo. **No bloquea** la apertura ni la elección.

## Agregar una opción que no está en el catálogo

```vue
<g-select v-model="cliente" :options="clientes" label="Cliente" placeholder="Elige un cliente"
          create-label="Agregar nuevo cliente…" @create="abrirNuevoCliente" />
```

- Con **`createLabel`** (sin valor por defecto), la lista termina con una **fila de acción** «Agregar nuevo…», separada por una línea y con un «+». Sin él, no hay fila.
- **El selector no crea nada:** al activar la fila (Enter, Espacio o clic) **cierra la lista, no cambia el valor, devuelve el foco al selector y emite `create`**. Tu app abre su diálogo o formulario, agrega la opción a `options` y, si quiere, actualiza `modelValue`. Si el usuario cancela, no pasa nada.
- **Para lectores de pantalla es una opción más** («…, opción 7 de 7»): usa un texto explícito («Agregar nuevo cliente…»).
- Es la **última fila navegable** (↓ y Fin llegan a ella), **no entra en `options`, ni en `modelValue`, ni en la escritura rápida**. **Tab** sobre la fila cierra **sin crear**; **Esc** cierra sin hacer nada.
- Con la lista vacía sigue visible (se ve `emptyText` y, debajo, la fila). Con `readonly` o `disabled` no hay lista, luego no hay fila.
- Si abres un `GDialog` desde `create`, al cerrarlo el foco vuelve al selector (nativo).

## Prefijo e iconos

```vue
<g-select v-model="cliente" :options="clientes" label="Cliente">
  <template #prepend><UserIcon /></template>
  <template #icon="{ option }"><component :is="option.icon" /></template>
</g-select>
```

- **`prepend`:** icono decorativo dentro del botón, antes del valor.
- **`icon`** (alcance `{ option }`): icono decorativo antes del texto de **cada opción** y **junto al valor mostrado**. **El icono de la opción elegida sustituye al prefijo:** una sola posición inicial, sin dos iconos seguidos; sin opción elegida, o con una sin icono, se ve el prefijo.
- El icono solo se pinta si el slot devuelve contenido para esa opción, y **una opción sin icono no reserva espacio**: da icono a todas las opciones o a ninguna para que el texto quede alineado.
- Si usas el slot `option` (o `value`), reemplaza el contenido completo y `icon` no se usa en esa zona.
- Los iconos son decorativos (`aria-hidden`) y **no forman parte del nombre accesible**. Grana no trae iconos; el playground usa SVG de [Lucide](https://lucide.dev). No hay sufijo antes de la flecha.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `String \| Number \| null` | El usuario elige una opción distinta o borra con `clearable` (`null`) |
| `open` | | La lista se abre |
| `close` | | La lista se cierra, por el motivo que sea |
| `create` | | El usuario activa la fila «Agregar nuevo…» |

Elegir la opción ya elegida cierra sin emitir. Los demás eventos (`focus`, `blur`, `keydown`…) no se declaran: tus escuchas reciben el evento nativo del botón.

## Slots

| Slot | Alcance | Contenido |
| --- | --- | --- |
| `label` | | Etiqueta con contenido rico (sustituye a `label`) |
| `hint` | | Ayuda con contenido rico |
| `error` | | Mensaje de error con contenido rico; solo con `error` |
| `option` | `{ option, selected, active }` | Contenido completo de una opción, sin interactivos (el texto sigue siendo `option.label` para la escritura rápida) |
| `value` | `{ option }` | Contenido del valor mostrado (solo con una opción elegida) |
| `icon` | `{ option }` | Icono decorativo de una opción y del valor |
| `prepend` | | Icono decorativo antes del valor |
| `empty` | | Contenido de la lista vacía (sustituye a `emptyText`) |

## Teclado

El foco **nunca** sale del selector mientras la lista está abierta: la opción activa se indica con `aria-activedescendant`.

| Tecla | Acción |
| --- | --- |
| Enter / Espacio / ↓ / ↑ / Alt+↓ | Con la lista cerrada, la abre con la elegida (o la primera habilitada) activa |
| ↓ / ↑ | Con la lista abierta: siguiente o anterior opción **habilitada** (no cicla; salta encabezados y deshabilitadas; la fila «Agregar nuevo…» cuenta como la última) |
| Inicio / Fin | Primera o última fila habilitada |
| Re Pág / Av Pág | Diez opciones atrás o adelante |
| Enter | Elige la activa, cierra y devuelve el foco al selector (sobre la fila «Agregar nuevo…», emite `create`) |
| Espacio | Elige, salvo que se esté escribiendo un prefijo |
| Esc | Cierra **sin cambiar**; el foco sigue en el selector. **No se propaga:** dentro de un `GDialog`, el primer Esc cierra solo la lista |
| Tab | Elige la opción activa, cierra y sigue el orden (sobre la fila «Agregar nuevo…», cierra sin crear) |
| Carácter imprimible | Abre la lista si estaba cerrada y activa la siguiente opción cuyo texto empieza así; varios seguidos (< ~500ms) forman el prefijo |

Un clic fuera cierra sin cambiar; el clic en una opción deshabilitada no elige ni cierra.

## Lista y móvil

- **Capa superior:** la lista es un `popover="manual"`: no la recorta ningún `overflow` ni queda bajo un `<dialog>` modal (funciona dentro de `GDialog`).
- **Posición:** debajo del selector, con al menos su ancho; **hacia arriba** si no cabe debajo y hay más sitio arriba. Alto máximo de unas 8 opciones (o el 60% del visor) con scroll interno; la opción activa siempre se ve.
- **Móvil (≤ ~520px de visor):** la lista es una **hoja inferior** pegada abajo, de ancho completo y con fondo, con las superficies de `GDialog` (`--g-surface-*`); opciones de 44px.

## Accesibilidad

- **Patrón APG:** `<button role="combobox" aria-haspopup="listbox" aria-expanded aria-controls>` y `<ul role="listbox">` con `role="option"` (`aria-selected`, `aria-disabled`) y `role="group"` para los grupos.
- **Ayuda y error:** `aria-describedby` (se suma a uno tuyo). La región del error existe siempre (vacía si no hay error) y es `aria-live="polite"`.
- **El estado no depende solo del color:** la elegida lleva un icono `check` de Lucide y más peso, la activa un contorno, la deshabilitada opacidad y tachado, el error engrosa el contorno y lleva un icono `triangle-alert`.
- **Foco:** anillo fino y pegado al borde de la caja, con transición de color.
- **Área táctil:** con `pointer: coarse`, la caja, las opciones, la fila crear y el botón de limpiar miden al menos 44px.
- **Contraste:** con el tema por defecto, el borde y el contorno de la lista llegan a 3.45:1 y el texto a 4.5:1 o más; con el tema de prueba de la auditoría, 4.86:1.

## Tema

El componente solo lee tokens `--g-*` (los mismos que [`GInput`](../GInput/README.md#tema)), más los de la lista y la hoja móvil: `--g-color-border-control` (contorno de la lista), `--g-shadow-2`, `--g-radius-md`, y `--g-surface-inset`, `--g-surface-gap`, `--g-surface-radius`, `--g-surface-backdrop` (hoja inferior). La altura de la caja sale de `--g-space-1` (6, 7, 9, 11 y 13 unidades para `xs` a `xl`, igual que `GInput`) y la opción mide como la caja.

## Clases

Las emite el componente y las estiliza `GSelect.css`: `g-select`, `g-select--variant-*`, `--size-*`, `--density-*`, `--color-*` y `--rounded-*` (solo con valor), `g-select--block`, `is-open`, `is-disabled`, `is-readonly`, `is-invalid`, `is-loading`, y los elementos `g-select__label`, `__required`, `__control`, `__button`, `__prepend`, `__value` (con `--placeholder`), `__icon`, `__arrow`, `__clear`, `__loader`, `__list` (con `is-up`), `__option` (con `is-active`), `__create`, `__group`, `__group-label`, `__empty`, `__hint` y `__error`. Elegida y deshabilitada se estilizan con `aria-selected` y `aria-disabled`.

## Limitaciones conocidas

- **Sin selección múltiple ni búsqueda** en v0.1 (otro patrón ARIA). Tampoco se crea una opción escribiendo: solo se **pide** con «Agregar nuevo…».
- **Sin validación nativa de `required`** (el campo oculto no se valida).
- **Sin virtualización:** listas de miles de opciones pueden ser lentas.
- **Lectores de pantalla táctiles en móvil:** `aria-activedescendant` puede no exponer las opciones de la hoja inferior; por verificar. Si falla, la alternativa prevista es mover el foco real a la lista en móvil.
- **Estilos globales sin capa ganan:** una regla global tuya sobre `label`, `ul` o `li` (sin capa) gana al CSS de Grana (capa `grana.components`); acótala con un selector más específico.
- No hay tema oscuro todavía.
- **Sin verificar:** un lector de pantalla real (incluido cómo anuncia la fila «Agregar nuevo…» y los iconos), la hoja inferior con el teclado virtual, un dispositivo táctil real, las preferencias reales de `prefers-reduced-motion` y `forced-colors` (las reglas están escritas y se comprobaron aplicadas sin condición), y Firefox y Safari (`popover`, `::backdrop`, `:popover-open`, `:has()`).

## Fuentes

- API: [`GSelect.meta.json`](./GSelect.meta.json) · Contrato: [`design/contracts/select.md`](../../../../../design/contracts/select.md) · Prototipos: [`design/lab/select/r01/`](../../../../../design/lab/select/r01/) y [`r02/`](../../../../../design/lab/select/r02/) · Auditoría: [`design/lab/select/auditoria.md`](../../../../../design/lab/select/auditoria.md)
