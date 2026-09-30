# GHelper

Ayuda contextual asociada a una región de la interfaz: un **disparador** (en el flujo del layout o flotando sobre un borde de la región) que abre un **contenido libre**: texto, acciones, un formulario o un asistente. `GHelper` no asume qué es ese contenido.

**Etiqueta:** `<g-helper>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/helper/auditoria.md`](../../../../../design/lab/helper/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0` y un navegador con la API `popover` y `<dialog>`: los actuales.

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

```vue
<!-- En línea, junto a una acción -->
<g-btn>Guardar</g-btn>
<g-helper aria-label="Abrir ayuda" content-label="Ayuda del formulario" close-label="Cerrar">
  <template #content="{ close }">
    <p>Puedo ayudarte con este formulario.</p>
    <g-btn variant="ghost" size="sm" @click="close">Entendido</g-btn>
  </template>
</g-helper>

<!-- Flotando sobre el borde superior de una región -->
<g-helper-scope>
  <form>…</form>
  <g-helper mode="float" placement="top-end" attach="edge" content-placement="bottom-end"
            aria-label="Ayuda" content-label="Ayuda del formulario" close-label="Cerrar">
    <template #content>Completa los campos obligatorios.</template>
  </g-helper>
</g-helper-scope>
```

**Los textos no tienen valor por defecto** (Grana es internacional): `ariaLabel` nombra el botón, `contentLabel` el contenido (y es el título de la hoja) y `closeLabel` el cierre de la hoja. Si faltan, en desarrollo se emite `console.warn`.

> **En plantillas dentro del HTML** (sin compilar), escribe `<g-helper ...></g-helper>`: Vue no admite etiquetas de componente autocerradas.

## Cómo funciona

`GHelper` tiene **dos posiciones independientes**:

1. **El disparador** (con `mode="float"`) se coloca **solo con CSS** respecto al **ancestro posicionado más cercano**: un [`GHelperScope`](../GHelperScope/README.md) o, sin él, cualquier elemento con `position` (por ejemplo, el cuerpo de un diálogo).
2. **El contenido** se abre en la **capa superior** del navegador, junto al disparador. Ningún `overflow: hidden` lo recorta, y va justo después del botón en el DOM, así que Tab entra en él con naturalidad.

### Colocar el disparador: `placement` × `attach` × `offset`

- **`placement`:** lado (`top`, `right`, `bottom`, `left`) y alineación sobre el otro eje (`-start`, centro, `-end`). Doce valores.
- **`attach`:** relación con el borde: `inside` (dentro), `edge` (el centro sobre el borde) u `outside` (fuera).
- **`offset`:** distancia al borde en unidades de `--g-space-1` (`2` = 8px con `space` 4).

`left` y `right` son **lógicos**: significan inicio y fin de línea, así que en RTL se reflejan.

### Dónde se abre el contenido

`contentPlacement` (por defecto, igual que `placement`) es una **preferencia**. Si no cabe, el contenido prueba el lado opuesto y luego los perpendiculares; en el lado elegido, se desplaza hasta quedar dentro del visor.

### Popover u hoja

Con `adaptive` (por defecto), al abrir se decide por el espacio real:

| Condición | Presentación |
| --- | --- |
| El visor mide al menos `space × 130` (520px con `space` 4) **y** alguna posición cabe | Popover no modal junto al disparador |
| Si no | **Hoja inferior** con [`GDialog`](../GDialog/README.md): foco atrapado, Esc, fondo inerte y retorno del foco ya resueltos |

La presentación se mantiene mientras está abierto. Con `:adaptive="false"`, siempre popover.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `mode` | String | `inline` `float` | `inline` |
| `placement` | String | `top-start` `top` `top-end` `right-start` `right` `right-end` `bottom-end` `bottom` `bottom-start` `left-end` `left` `left-start` | `bottom-end` |
| `attach` | String | `inside` `edge` `outside` | `inside` |
| `offset` | Number | ≥ 0 | `2` |
| `contentPlacement` | String | los 12 de `placement` | igual que `placement` |
| `open` (`v-model:open`) | Boolean | | no controlado |
| `disabled` | Boolean | | `false` |
| `adaptive` | Boolean | | `true` |
| `ariaLabel` | String | | sin valor |
| `contentLabel` | String | | sin valor |
| `closeLabel` | String | | sin valor |
| `id` | String | | generado |

- **`open`:** con `v-model:open` el componente **no cambia el prop por su cuenta**; sin él, gestiona su estado.
- **`disabled`:** el botón se deshabilita y, si estaba abierto, se cierra.
- **`ariaLabel`:** obligatorio cuando el disparador no tiene texto visible (el por defecto, o un slot con solo un icono o un avatar).
- **`id`:** base de los ids internos (`{id}-content`, `{id}-sheet`).
- **Resto de atributos** (`class`, `style`, `data-*`, escuchas): van a la raíz.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:open` | `Boolean` | El usuario abre o cierra (botón, Esc, clic fuera, foco que sale, cierre de la hoja) |
| `toggle` | `{ open, presentation }` | Tras abrir o cerrar; `presentation` es `popover` o `sheet` |

## Slots

| Slot | Alcance | Contenido |
| --- | --- | --- |
| `trigger` | `{ open }` | Lo que va **dentro** del botón: un icono, un texto, un avatar. **Sin controles**: un `GBtn` aquí sería un botón dentro de otro |
| `content` | `{ close, presentation }` | El contenido. Se monta al abrir y se desmonta al cerrar |
| `default` | `{ close, presentation }` | Alias de `content` (`content` gana) |

`close()` cierra y devuelve el foco al disparador.

```vue
<g-helper aria-label="Asistente" content-label="Asistente" close-label="Cerrar">
  <template #trigger="{ open }">
    <MiAvatar :state="open ? 'open' : 'idle'" />   <!-- decorativo: el nombre lo da ariaLabel -->
  </template>
  <template #content><MiAsistente /></template>
</g-helper>
```

## Teclado y foco

| Tecla | Acción |
| --- | --- |
| Enter / Espacio (en el disparador) | Abre o cierra |
| Esc | Cierra y devuelve el foco al disparador |
| Tab / Shift+Tab | Navegación normal: del disparador entra al contenido; al salir de ambos, el popover se cierra |

- **Clic fuera:** cierra sin mover el foco.
- **Un solo helper abierto a la vez:** abrir uno cierra el anterior.
- **Sin trampa de foco** en el popover. En la hoja, foco y Esc son los de `GDialog`.

## Accesibilidad

- **Disparador:** siempre un `<button type="button">` con `aria-expanded`, `aria-controls` (el popover o la hoja) y `aria-haspopup="dialog"`.
- **Contenido:** un diálogo **no modal** (`role="dialog"`) con el nombre de `contentLabel`.
- **Foco visible** con `--g-focus-width`, `--g-focus-offset` y `--g-color-focus`, sin estilo propio. Con `pointer: coarse`, el área del disparador mide 44px.
- **Contraste medido:** icono del disparador ≥ 7.46:1 y su borde ≥ 3.45:1 (claro); texto del popover ≥ 15.2:1, con el tema por defecto, con un tema de prueba y en oscuro.
- **Movimiento:** el popover entra con una transición breve solo con `prefers-reduced-motion: no-preference`.

## Tema

Sin tokens propios. El disparador por defecto mide `space × 8` (32px) y el popover usa el lenguaje de [`GSurface`](../GSurface/README.md) `floating`: `--g-color-surface`, `--g-color-border`, `--g-radius-lg`, `--g-shadow-2`, con un ancho máximo de `space × 80`. Consume también `--g-color-text`, `--g-color-text-muted`, `--g-color-border-control`, `--g-color-focus`, `--g-radius-pill`, `--g-radius-sm`, `--g-shadow-1`, `--g-border-width`, `--g-focus-{width|offset}`, `--g-font-ui`, `--g-text-body-sm-{size|line}`, `--g-duration-{fast|press}` y `--g-ease-{standard|out}`.

## Clases

`g-helper`, `g-helper--{inline|float}`, `g-helper--side-*`, `g-helper--align-*`, `g-helper--attach-*` (solo en `float`), `is-open`, `is-disabled`; `g-helper__trigger` con `--default` o `--custom`; `g-helper__content` con `data-side` (el lado usado tras el volteo). Variable en línea: `--_offset`.

## Limitaciones conocidas

- **Sin avatar incluido:** `GAvatarMotion` está aplazado (DECISIONS.md #104); el slot `trigger` ya acepta cualquier avatar sin cambiar esta API.
- **Sin flecha** en el popover (v0.1).
- **Contenido más alto que el visor** en escritorio: cuenta como «no cabe» y se abre como diálogo centrado.
- La presentación (popover u hoja) no cambia mientras está abierto.
- **Sin verificar:** lector de pantalla real, Firefox y Safari (la animación de entrada usa `@starting-style`: sin él, aparece sin animación), `forced-colors` real, zoom al 200% y táctil real.

## Fuentes

- API: [`GHelper.meta.json`](./GHelper.meta.json) · Contrato: [`design/contracts/helper.md`](../../../../../design/contracts/helper.md) · Prototipo: [`design/lab/helper/r01/`](../../../../../design/lab/helper/r01/) · Estilo: [`design/lab/helper/estilo.md`](../../../../../design/lab/helper/estilo.md) · Auditoría: [`design/lab/helper/auditoria.md`](../../../../../design/lab/helper/auditoria.md)
