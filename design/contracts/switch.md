# Contrato · GSwitch

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/switch/r01/` (kiwi)
**Tag:** `g-switch` · **Categoría:** entradas

Interruptor de efecto inmediato: activa o desactiva una opción. Alcance decidido por el usuario (DECISIONS.md #47 a #49): interruptor completo, sin tarjeta ni grupo; marca de estado dibujada en el pulgar; `loading` con anillo y sin bloquear.

## Principios

- **Es un `<input type="checkbox" role="switch">` nativo**, dibujado con `appearance: none`; no se oculta ni se sustituye por un `div` con `role`. Espacio alterna; Enter no (comportamiento nativo).
- **Presenta y emite intención.** Cambia el estado del `<input>` y emite `update:modelValue`; si el consumidor no actualiza el prop, el interruptor vuelve a mostrar el valor del prop.
- **No es una casilla.** Efecto inmediato, sin estado mixto y sin valor de arreglo.

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | Boolean | | `false` | compartida |
| `labelPosition` | String | `end` `start` | `end` | propia |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | compartida |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` | compartida |
| `disabled` | Boolean | | `false` | compartida |
| `readonly` | Boolean | | `false` | compartida (precisada en `api.md`) |
| `loading` | Boolean | | `false` | compartida (precisada en `api.md`) |
| `label` | String | texto libre | sin valor | propia |
| `hint` | String | texto libre | sin valor | propia |
| `error` | String | texto libre | sin valor | propia |
| `id` | String | | generado | propia |

### Reglas de props

- **`modelValue`:** booleano (encendido = `true`). Sin `value`, arreglo, `true-value` ni `false-value` en v0.1. Dentro de un `<form>`, el `name` del consumidor (en `$attrs`) viaja con el `<input>` nativo.
- **`variant`:** no existe. La `variant` compartida (`solid soft outline ghost link`) no describe un interruptor (mismo criterio que `GCheckbox`, DECISIONS.md #36).
- **`labelPosition`:** `end` pone la etiqueta después del riel; `start`, antes. La fila se invierte con propiedades lógicas: en RTL, el orden y el sentido del pulgar se espejan.
- **`color`:** color del riel encendido. El error usa siempre `danger`.
- **`disabled`:** atributo nativo en el `<input>`; sin foco, sin envío.
- **`readonly`:** el `<input type="checkbox">` no admite `readonly` nativo. El componente pone `aria-readonly="true"`, cancela el cambio (`preventDefault` en el clic y en Espacio) y **no** emite `update:modelValue`. El interruptor sigue enfocable.
- **`loading`:** `aria-busy="true"` en el `<input>`, clase `is-loading` y un anillo giratorio en el pulgar. **No bloquea:** el cambio se emite igual (guardado asíncrono) y el consumidor decide si lo revierte. No cambia el tamaño.
- **`label`:** el componente necesita un nombre accesible. Sin `label`, sin slot `label` y sin `aria-label` ni `aria-labelledby` (en `$attrs`), en desarrollo se emite `console.warn`.
- **`hint`:** texto de ayuda, enlazado como descripción.
- **`error`:** si tiene valor (cadena no vacía), el interruptor está en estado inválido: `aria-invalid="true"`, clase `is-invalid` y mensaje visible. **El componente no valida.**
- **`required`:** no existe. Un interruptor de efecto inmediato no se "rellena"; si una opción debe estar encendida para continuar, se usa `error`.
- **`id`:** si no se da, se genera uno estable (`useId`); de él derivan los ids de etiqueta, ayuda y error.
- **Resto de atributos** (`name`, `form`, `aria-*`, `data-*`, escuchas de eventos): van al `<input>`, **no** a la raíz. `class` y `style` van a la raíz (`inheritAttrs: false`).

## Estructura accesible

```html
<div class="g-switch g-switch--size-md g-switch--density-default g-switch--color-brand g-switch--label-end g-switch--icons …">
  <label class="g-switch__row" for="ID">
    <span class="g-switch__control">
      <input class="g-switch__input" type="checkbox" role="switch" id="ID" aria-labelledby="ID-label" aria-describedby="ID-hint ID-error" aria-invalid="true" aria-readonly="true" aria-busy="true">
      <span class="g-switch__icon g-switch__icon--on" aria-hidden="true">…</span>    <!-- solo con slot icon-on -->
      <span class="g-switch__icon g-switch__icon--off" aria-hidden="true">…</span>   <!-- solo con slot icon-off -->
    </span>
    <span class="g-switch__text">
      <span class="g-switch__label" id="ID-label">Notificaciones</span>
      <span class="g-switch__hint" id="ID-hint">…</span>
    </span>
  </label>
  <div class="g-switch__error" id="ID-error" aria-live="polite">…</div>
</div>
```

- El `<input>` es el riel: lleva el foco, el estado y el teclado, y se **dibuja** (`appearance: none`). El pulgar y su marca son pseudo-elementos suyos; durante `loading`, el anillo reutiliza el mismo pseudo-elemento de la marca.
- `g-switch__control` es el contenedor posicionado del riel; los iconos opcionales van encima del pulgar (no dentro del `<input>`, que no admite hijos) y se colocan con `:checked ~ …`.
- **Nombre accesible:** `aria-labelledby` = `ID-label`. La ayuda queda fuera del nombre y se anuncia como descripción.
- `aria-describedby` lista `ID-hint` si hay ayuda e `ID-error` solo mientras hay error.
- La región `ID-error` (`aria-live="polite"`) **se renderiza siempre**, fuera del `<label>`, vacía mientras no hay error (WCAG 4.1.3), con una señal no cromática (marca ⚠ que el lector no lee) además del texto.
- **La fila completa** (`<label>`) es el objetivo de toque. **Sin contenido interactivo** dentro del `<label>`.
- **Altura real ≥ 44px con `pointer: coarse`**, sin importar `density`. El riel se mantiene pequeño y centrado con la primera línea.
- El estado no depende solo del color ni de la posición: el pulgar lleva una marca dibujada (✓ encendido, − apagado), o los iconos del consumidor.
- Los iconos `icon-on` e `icon-off` son decorativos (`aria-hidden`); al haber al menos uno, la raíz lleva `g-switch--icons` y coco oculta la marca dibujada del estado correspondiente.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `Boolean` | El usuario alterna el interruptor (no con `readonly`) |

**Nota para bruno:** los demás eventos (`focus`, `blur`, `change`, `keydown`…) **no se declaran**: como los atributos van al `<input>`, las escuchas del consumidor llegan al elemento nativo. El manejador propio va **primero** (`mergeProps({ onChange }, attrs)`) para que un `@change` del consumidor ya vea el modelo actualizado, igual que con un `<input v-model>` nativo (mismo criterio que `GInput` y `GCheckbox`).

## Slots

| Slot | Propósito | Anatomía que debe conservar |
| --- | --- | --- |
| `label` | Etiqueta con contenido rico (sustituye a `label`) | Dentro de `ID-label`; nunca elementos interactivos |
| `hint` | Ayuda con contenido rico (sustituye a `hint`) | Conserva el `id` `ID-hint` |
| `error` | Mensaje de error con contenido rico | Solo se muestra si `error` tiene valor; conserva el `id` `ID-error` y la región viva |
| `icon-on` | Icono del pulgar encendido | Decorativo: se envuelve con `aria-hidden="true"` |
| `icon-off` | Icono del pulgar apagado | Decorativo: se envuelve con `aria-hidden="true"` |

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Entra y sale en el orden del documento |
| Espacio | Alterna el interruptor (nativo) |

Enter **no** alterna (comportamiento nativo del checkbox; dentro de un formulario, envía). Sin manejadores de teclado propios, salvo el bloqueo de `readonly`.

## Tokens consumidos

| Token | Para qué |
| --- | --- |
| `--g-color-surface` | Fondo del riel apagado |
| `--g-color-border-control` | Contorno del riel apagado (≥ 3:1) y pulgar apagado |
| `--g-color-{color}`, `--g-color-on-{color}` | Relleno del riel encendido; pulgar y marca encendidos |
| `--g-color-surface-sunken` | Fondo de `readonly` |
| `--g-color-border-strong` | Estado `disabled` |
| `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Etiqueta; ayuda; estado `disabled` |
| `--g-color-danger-text` | Texto, marca y contorno del error |
| `--g-color-focus` | Anillo de foco |
| `--g-radius-pill` | Riel y pulgar |
| `--g-space-1` | Unidad del riel, de la fila y de la separación (ver `tokens.md` §4) |
| `--g-font-ui` | Familia |
| `--g-text-caption-size`, `--g-text-caption-line` | Ayuda y error |
| `--g-text-body-sm-size`, `--g-text-body-size` | Etiqueta según `size` |
| `--g-border-width`, `--g-focus-width`, `--g-focus-offset` | Bordes y foco |
| `--g-shadow-1` | Sombra del pulgar |
| `--g-duration-fast`, `--g-duration-press`, `--g-duration-spin`, `--g-ease-standard`, `--g-ease-out` | Cambio de color; deslizamiento del pulgar; giro del anillo |

Sin tokens de componente: el riel se dimensiona desde `space` (`tokens.md` §4).

## Clases (contrato entre bruno y coco)

Bruno las emite; coco las estiliza. Ninguno usa otras. El estado encendido se estiliza con `:checked` del `<input>`, sin clase propia.

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-switch` | Raíz (`div`) | Siempre |
| `g-switch--size-{size}` | Raíz | Siempre |
| `g-switch--density-{density}` | Raíz | Siempre |
| `g-switch--color-{color}` | Raíz | Siempre (incluido `brand`) |
| `g-switch--label-{end\|start}` | Raíz | Siempre |
| `g-switch--icons` | Raíz | Con `icon-on` o `icon-off` |
| `is-disabled` | Raíz | `disabled` |
| `is-readonly` | Raíz | `readonly` |
| `is-invalid` | Raíz | `error` con valor |
| `is-loading` | Raíz | `loading` |
| `g-switch__row` | `label` | Siempre |
| `g-switch__control` | `span` | Siempre |
| `g-switch__input` | `<input>` | Siempre |
| `g-switch__icon`, `g-switch__icon--on`, `g-switch__icon--off` | `span` `aria-hidden` | Con el slot correspondiente |
| `g-switch__text` | Columna de etiqueta y ayuda | Siempre |
| `g-switch__label` | Etiqueta | Siempre |
| `g-switch__hint` | Ayuda | Si hay ayuda |
| `g-switch__error` | Región viva | Siempre presente |

## Límites conocidos

- **Sin tarjeta ni grupo** de interruptores en v0.1.
- **Valor solo booleano.**
- **Marca dibujada solo verificada en Chromium**, con el mismo patrón que `GCheckbox` (pseudo-elementos del `<input>` con `appearance: none`); conviene revisarla en Firefox y Safari.
- **Lector de pantalla:** cómo se anuncian "interruptor, activado", la ayuda, el error y `aria-busy` está por verificar con lectores reales.

## Abierto (no bloquea el paso siguiente)

- Valores estéticos (contraste del pulgar, sombra, movimiento): los decide coco con los tokens listados.

## Cambio por el sistema de formularios (Fase 1)

**Origen:** `design/contracts/form.md` §10 (DECISIONS.md #153, #158, #164, #165). **Estado:** aprobado por lima; pendiente de **bruno** (`.vue`, pruebas, `meta.json`) y **coco** (CSS). Lo que aquí se dice **sustituye** a lo anterior de este contrato donde choque; fuera de `GForm` el componente se ve y se comporta como hoy salvo C4, C5, C6 y C7, que aplican siempre.

| # | Cambio | Detalle |
| --- | --- | --- |
| C1 | Lee el contexto con `useFormField()` | `density`, `readonly`, `disabled` y `error` pasan a default `undefined`; valor = prop explícita › contexto de `GForm` › default de siempre. Error por `name` desde `errors` de `GForm` (y `warnings`), con su momento (`showErrorsOn`) |
| C2 | `block` en la rejilla | Sin cambio visual; dentro de la rejilla ocupa su celda. |
| C3 | Marcas | **Nunca lleva marca** (no tiene `required`, #47), en ninguna convención. |
| C4 | Región de mensaje unificada | `g-switch__error` / `ID-error` pasa a **`g-switch__message`** / `ID-message`: un hueco para error, advertencia o válido, siempre presente; `aria-live` = `live` del contexto (`polite`, u `off` mientras se escriben mensajes revelados por un envío; fuera de `GForm`, `polite`). Dentro: `GIcon` (`g-switch__message-icon`) + prefijo oculto `g-switch__message-type` (`labels.error\|warning\|valid` de `GForm`; fuera, sin prefijo) + texto. `aria-describedby` incluye `ID-message` mientras haya mensaje. |
| C5 | Estados `warning` y `valid` | Props nuevas **`warning`** y **`valid`** (String, sin valor). Sin `aria-invalid`; no bloquean; prioridad error › advertencia › válido. Clases `is-warning`, `is-valid` en la raíz. Borde de estilo distinto del error (no solo color) |
| C6 | Iconos | Error **`circle-alert`** (antes `triangle-alert`), advertencia `triangle-alert`, válido `circle-check` (`icons.md`) |
| C7 | Solo lectura homogéneo | Contraste completo (`--g-color-text`, sin opacidad), fondo `--g-color-surface-sunken`, borde **discontinuo** `--g-color-border-control`, cursor normal, enfocable; distinto de `disabled` sin depender del color (#165). Ya usaba `surface-sunken`; se añade el borde discontinuo. `aria-readonly` sin cambios. |
| C8 | Manejadores primero | `mergeProps(handlers, propios, attrs)` con prueba de orden. |
| C9 | Registro | Con `name` en `$attrs`, se registra (control de elección: revela al cambiar). Recordatorio de la guía: en un formulario con Guardar se usa `GCheckbox`, no `GSwitch`. |
| C10 | Pistas para *subgrid* | Etiqueta, caja, ayuda y mensaje como hijos directos de la raíz; dentro de `.g-form-row`, coco los coloca en cuatro pistas con nombre (`form.md` §4) |

**Clases nuevas** (contrato bruno–coco): `g-switch__message`, `__message-icon`, `__message-type`, `is-warning`, `is-valid` (`g-switch__error` desaparece).
