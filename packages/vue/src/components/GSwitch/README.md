# GSwitch

Interruptor de efecto inmediato: activa o desactiva una opción. Usa el `<input type="checkbox" role="switch">` nativo, con una marca de estado dibujada en el pulgar, ayuda, error, iconos opcionales y un estado de carga que no bloquea.

**Etiqueta:** `<g-switch>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/switch/auditoria.md`](../../../../../design/lab/switch/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0` (usa `useId`).

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

```vue
<g-switch v-model="notificaciones" label="Notificaciones" hint="Te avisamos por correo." />
```

Los atributos nativos (`name`, `form`, `aria-*`, `data-*`, escuchas como `@change`) van al `<input>`; solo `class` y `style` van a la raíz. Una escucha `@change` ya ve el `v-model` actualizado, igual que con un `<input v-model>` nativo.

> **En plantillas dentro del HTML** (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-switch ...></g-switch>`.

## Cuándo usarlo

Un interruptor **aplica el cambio al instante** (un ajuste, una función). Si la opción se confirma con un botón "Guardar", usa [`GCheckbox`](../GCheckbox/README.md). Si activarla tiene consecuencias graves (borrar datos, exponer información), no es un interruptor: usa una confirmación (`GDialog` con `role="alertdialog"`). El interruptor **no pregunta**.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` (`v-model`) | Boolean | | `false` |
| `labelPosition` | String | `end` `start` | `end` |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` |
| `disabled` | Boolean | | `false` |
| `readonly` | Boolean | | `false` |
| `loading` | Boolean | | `false` |
| `label` | String | | sin valor |
| `hint` | String | | sin valor |
| `error` | String | | sin valor |
| `id` | String | | generado |

Un valor fuera de la lista muestra una advertencia en desarrollo. No hay `variant` (la estructura del interruptor no es un botón) ni `required` (un interruptor de efecto inmediato no se "rellena"; si una opción debe estar encendida para continuar, usa `error`).

- **`modelValue`:** booleano. Sin `value`, arreglo, `true-value` ni `false-value` en v0.1. Es **controlado**: si no actualizas el prop, el interruptor vuelve a mostrar su valor.
- **`labelPosition`:** `start` pone la etiqueta antes del riel y el riel al final de la fila (como una fila de ajustes). En RTL, el orden y el sentido del pulgar se espejan solos.
- **`color`:** color del riel encendido. El error usa siempre `danger`.
- **`readonly`:** el input nativo no admite `readonly`. El componente pone `aria-readonly="true"`, cancela el cambio (con ratón y con Espacio) y no emite nada; sigue enfocable.
- **`loading`:** `aria-busy="true"` y un anillo giratorio en lugar de la marca del pulgar. **No bloquea:** el cambio se emite igual y tú decides si lo revierte (guardado asíncrono).
- **`label`:** el componente necesita un nombre accesible. Sin `label`, sin slot `label` y sin `aria-label` ni `aria-labelledby`, en desarrollo se emite `console.warn`.
- **`error`:** con texto, el interruptor queda inválido (`aria-invalid="true"`) y se muestra el mensaje. **El componente no valida:** tú decides cuándo hay error.
- **El rol es siempre `switch`:** un `role` que pases como atributo no lo cambia.

```vue
<!-- guardado asíncrono: el interruptor no se bloquea y el consumidor decide -->
<g-switch v-model="auto" :loading="guardando" label="Guardado automático" @change="guardar" />

<!-- opción que debe estar encendida para continuar -->
<g-switch v-model="cookies" label="Aceptar cookies" :error="error" @change="error = cookies ? '' : 'Actívalo para continuar.'" />
```

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `Boolean` | El usuario alterna el interruptor (no con `readonly`) |

Los demás eventos (`focus`, `blur`, `change`, `keydown`…) no se declaran: tus escuchas reciben el evento nativo del `<input>`.

## Slots

| Slot | Contenido |
| --- | --- |
| `label` | Etiqueta con contenido rico (sustituye a `label`) |
| `hint` | Ayuda con contenido rico (sustituye a `hint`) |
| `error` | Mensaje de error con contenido rico; solo se muestra si `error` tiene valor |
| `icon-on` | Icono del pulgar encendido. Decorativo: el componente lo marca con `aria-hidden="true"` |
| `icon-off` | Icono del pulgar apagado. Decorativo: igual |

Sin iconos, el pulgar lleva un icono de Lucide (`check` encendido, `minus` apagado; `loader-circle` mientras carga). Con `icon-on` o `icon-off`, el icono sustituye a la marca de **su** estado. Los iconos se dimensionan al pulgar (`1em` de un SVG funciona bien). Grana no trae iconos; el playground usa SVG de [Lucide](https://lucide.dev).

```vue
<g-switch v-model="bloqueado" label="Bloqueo" size="lg">
  <template #icon-on><LockIcon /></template>
  <template #icon-off><UnlockIcon /></template>
</g-switch>
```

No pongas botones, enlaces ni campos dentro de la etiqueta, la ayuda ni el error: un contenido interactivo dentro de un `<label>` rompe el control.

## Accesibilidad

- **Control nativo:** un `<input type="checkbox" role="switch">`, dibujado con `appearance: none`. Teclado, foco, formularios y estado los resuelve el navegador. **Espacio** alterna; **Enter no** (comportamiento nativo del checkbox).
- **Nombre:** la etiqueta se asocia con `for`/`id` y `aria-labelledby`. La ayuda va aparte, como descripción (`aria-describedby`).
- **Ayuda y error:** se enlazan con `aria-describedby`, sumándose a uno tuyo si lo pasas. La región del error existe siempre (vacía si no hay error), está fuera del `<label>` y es `aria-live="polite"`.
- **El estado no depende solo del color ni de la posición:** el pulgar lleva un icono que cambia de forma (`check` o `minus`), el error engrosa el contorno y lleva un icono `triangle-alert` que los lectores no leen, y `readonly` usa contorno discontinuo.
- **Foco:** anillo de `--g-focus-width` alrededor del riel, con transición de apertura.
- **Área táctil:** la fila completa (riel y texto) es el objetivo; con `pointer: coarse` mide al menos 44px reales y el riel queda centrado con la etiqueta.
- **Contraste:** con el tema por defecto, el riel apagado, el pulgar y la marca llegan a 3.45:1 y el encendido a 5.33:1 o más; el texto, a 5.49:1 o más. Con el tema de prueba de la auditoría, 4.86:1 y 5.16:1 o más.
- **Texto largo:** la etiqueta y la ayuda saltan de línea, incluso una palabra larguísima sin espacios.

## Movimiento

- **El pulgar se desliza** con `translate` (`--g-duration-press`, `--g-ease-out`), en el sentido lógico: en RTL se invierte solo.
- **Pulsar:** el riel se hunde un poco (`--g-press-scale`), igual que el botón y la casilla.
- **Foco:** el anillo se abre desde el borde hasta su separación.
- **Cargando:** el anillo gira una vuelta por `--g-duration-spin`.
- Con `prefers-reduced-motion: reduce` se quitan las transiciones y el giro (queda el anillo quieto).

## Tema

El componente solo lee tokens `--g-*`. **`brand` sí cambia los interruptores** (es el relleno del riel encendido por defecto). Ejemplo:

```css
:root {
  --g-color-primary: #7a1f5c;          /* relleno del riel encendido */
  --g-color-primary-strong: #5e184a;   /* al pasar el ratón */
  --g-color-border-control: #8a6a30; /* contorno del riel apagado y pulgar apagado (≥ 3:1) */
}
```

Tokens que consume: `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-border-control`, `--g-color-border-strong`, `--g-color-{color}` (y `-strong`), `--g-color-on-{color}`, `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle`, `--g-color-danger-text`, `--g-color-focus`, `--g-radius-pill`, `--g-space-1..4`, `--g-font-ui`, `--g-text-{caption|body-sm|body}-{size|line}`, `--g-text-action-weight`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset`, `--g-shadow-1`, `--g-duration-{fast|press|spin}`, `--g-ease-{standard|out}` y `--g-press-scale`. La definición de cada uno está en `docs/contract/tokens.md`.

El riel mide, en unidades de `--g-space-1`, alto × ancho de 5 × 9, 5.5 × 10, 6 × 11, 7.5 × 13 y 9 × 16 para `xs`, `sm`, `md`, `lg` y `xl` (con espacio 4: 36×20, 40×22, 44×24, 52×30 y 64×36px). El pulgar y su recorrido salen de ese alto y del ancho del borde: cambiar el espacio base o el borde escala todo sin descentrar nada.

## Dentro de un formulario

Con un `GForm` alrededor el campo lee su contexto: densidad, solo lectura, deshabilitado, ancho completo y el error de `errors[name]` (que `GForm` muestra cuando toca: al salir tras escribir, al elegir o al enviar). **La prop explícita del campo siempre gana**; fuera de `GForm` se comporta exactamente como antes. Guía completa del sistema: [`GForm/README.md`](../GForm/README.md).

- **Va en su propia fila** (hijo directo de `GFormLayout`), nunca junto a otros campos en una `GFormRow`.
- **Sin marcas** (un interruptor no es obligatorio).
- **Un solo mensaje** bajo el campo, `g-switch__message` (región viva siempre presente): `error` (icono `circle-alert`), `warning` (`triangle-alert`; borde discontinuo de un trazo en el control) o `valid` (`circle-check`), en ese orden de prioridad, con un prefijo oculto («Error: », «Advertencia: », «Correcto: », de `labels` de `GForm`). Sustituye a la antigua región `__error`.
- **Solo lectura:** pista hundida con borde discontinuo y el pulgar en `--g-color-text`.

## Clases

Las emite el componente y las estiliza `GSwitch.css`: `g-switch`, `g-switch--size-*`, `g-switch--density-*`, `g-switch--color-*`, `g-switch--label-*`, `g-switch--icons`, `is-disabled`, `is-readonly`, `is-invalid`, `is-loading`, y los elementos `g-switch__row`, `g-switch__control`, `g-switch__input`, `g-switch__icon` (con `--on` y `--off`), `g-switch__text`, `g-switch__label`, `g-switch__hint` y `g-switch__message`. El estado encendido se estiliza con `:checked`, sin clase propia.

## Limitaciones conocidas

- **Marca y pulgar solo verificados en Chromium.** Son pseudo-elementos del `<input>` con `appearance: none` (mismo patrón que `GCheckbox`); conviene revisarlos en Firefox y Safari, junto con `:dir()` y `:has()`.
- **Sin tarjeta ni grupo** de interruptores, y valor solo booleano en v0.1.
- **`loading` no bloquea:** si quieres impedir cambios mientras guarda, usa `disabled` o ignora el evento.
- No hay tema oscuro todavía.
- **Sin verificar:** un lector de pantalla real (rol `switch`, "activado", ayuda, error y `aria-busy`), las preferencias reales de `prefers-reduced-motion` y `forced-colors` (las reglas están escritas y se comprobaron aplicadas sin condición), el zoom al 200% y un dispositivo táctil real.

## Fuentes

- API: [`GSwitch.meta.json`](./GSwitch.meta.json) · Contrato: [`design/contracts/switch.md`](../../../../../design/contracts/switch.md) · Prototipo: [`design/lab/switch/r01/`](../../../../../design/lab/switch/r01/) · Auditoría: [`design/lab/switch/auditoria.md`](../../../../../design/lab/switch/auditoria.md)
