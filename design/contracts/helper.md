# Contrato · GHelper y GHelperScope

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/helper/r01/` (kiwi) y la especificación técnica del usuario «`GHelper` y `GAvatarMotion`».
**Tags:** `g-helper`, `g-helper-scope` · **Categoría:** superposiciones

Ayuda contextual asociada a una región de la interfaz: un **disparador** (en el flujo del layout o flotando sobre un borde de la región) que abre un **contenido agnóstico** (texto, acciones, un formulario, un asistente). Alcance decidido por el usuario (DECISIONS.md #101 a #104): **`GAvatarMotion` queda fuera** de esta entrega; posicionamiento **propio, extraído de `GMenu`, sin dependencias**; la **hoja móvil es `GDialog`**.

---

## Principios

- **`GHelper` no conoce su contenido** ni depende de ningún avatar: el disparador personalizado y el contenido son slots.
- **El disparador es siempre un `<button>`** del propio `GHelper`. Lo que el consumidor pone en el slot `trigger` va **dentro** de ese botón.
- **Dos posicionamientos distintos:** el **disparador** se coloca solo con CSS respecto al ancestro posicionado más cercano; el **contenido** se abre en la capa superior con posición calculada, volteo y desplazamiento.
- **Sin textos propios** (Grana es internacional): nombres y etiquetas los da el consumidor.
- **Sin trampa de foco** en el popover; la hoja reutiliza `GDialog`.

## GHelperScope

Contenedor que fija el contexto de posición de los `GHelper` flotantes que contiene.

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `as` | String | etiqueta HTML no interactiva | `div` | propia |

- Clase `g-helper-scope`: `position: relative` y nada más (sin fondo, borde, relleno ni margen).
- Slot `default`. Sin eventos. El resto de atributos va a la raíz.
- **No es obligatorio:** sin él, un `GHelper` flotante toma como referencia el ancestro posicionado más cercano (semántica nativa de CSS). No hay búsqueda por selector.

## GHelper · Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `mode` | String | `inline` `float` | `inline` | propia |
| `placement` | String | `top-start` `top` `top-end` `right-start` `right` `right-end` `bottom-end` `bottom` `bottom-start` `left-end` `left` `left-start` | `bottom-end` | propia |
| `attach` | String | `inside` `edge` `outside` | `inside` | propia |
| `offset` | Number | ≥ 0 | `2` | propia |
| `contentPlacement` | String | los 12 de `placement` | igual que `placement` | propia |
| `open` | Boolean | | sin valor (no controlado) | propia (`v-model:open`) |
| `disabled` | Boolean | | `false` | compartida |
| `adaptive` | Boolean | | `true` | propia |
| `ariaLabel` | String | texto libre | sin valor | propia |
| `contentLabel` | String | texto libre | sin valor | propia |
| `closeLabel` | String | texto libre | sin valor | propia |
| `id` | String | | generado | propia |

### Reglas de props

- **`mode`:** `inline` participa en el flujo (**nunca** `position: absolute`). `float` se posiciona respecto al ancestro posicionado más cercano (`GHelperScope` o el que haya).
- **`placement`:** en `float`, dónde está el disparador: **lado** (`top`, `right`, `bottom`, `left`) y **alineación** sobre el otro eje (`start`, centro, `end`). **`left` y `right` son lógicos:** significan inicio y fin de línea, así que en RTL se reflejan (DECISIONS.md #101). En `inline` no mueve el disparador; solo es el valor por defecto de `contentPlacement`.
- **`attach`:** relación con el borde del lado: `inside` (dentro, a `offset` del borde), `edge` (el centro del disparador sobre el borde), `outside` (fuera, a `offset` del borde). En la alineación secundaria, `start` y `end` quedan a `offset` del borde; el centro, centrado.
- **`offset`:** número de unidades de `--g-space-1` (con `space` 4: `2` = 8px). Se pasa como variable CSS en línea (`--_offset`), única excepción justificada al «sin estilos en línea». Negativo → validador falla.
- **`contentPlacement`:** dónde se abre el contenido respecto al disparador. Es una **preferencia**: si no cabe, se voltea (ver «Colisión»).
- **`open`:** con `v-model:open`, el componente es controlado y **no cambia el prop por su cuenta**: emite `update:open`. Sin él, gestiona su estado internamente.
- **`disabled`:** `disabled` nativo en el botón; no abre. Si estaba abierto, se cierra.
- **`adaptive`:** con `true`, el contenido se abre como **hoja** cuando no cabe como popover (ver «Adaptación»). Con `false`, siempre popover (se ajusta al visor, aunque quede estrecho).
- **`ariaLabel`:** nombre accesible del botón. **Sin valor por defecto.** Obligatorio cuando el disparador no tiene texto visible (el por defecto, o un slot con solo un icono o un avatar): sin él, en desarrollo se emite `console.warn`. Si el slot `trigger` trae texto visible, puede omitirse.
- **`contentLabel`:** nombre accesible del contenido (`aria-label` del diálogo no modal) y **título de la hoja**. Sin valor por defecto; sin él, `console.warn` en desarrollo.
- **`closeLabel`:** nombre del botón de cierre de la hoja (`GDialog`). Sin valor por defecto; con `adaptive` y sin él, `console.warn` en desarrollo.
- **Resto de atributos** (`class`, `style`, `data-*`, escuchas): van a la raíz (`span.g-helper`). Los `aria-*` del botón se controlan con las props.

## Estructura accesible

```html
<span class="g-helper g-helper--float g-helper--side-top g-helper--align-end g-helper--attach-edge is-open" style="--_offset: 2">
  <button class="g-helper__trigger g-helper__trigger--default" type="button"
          aria-label="Abrir ayuda" aria-expanded="true" aria-controls="ID-content" aria-haspopup="dialog">
    <svg class="g-icon" aria-hidden="true">…circle-help…</svg>           <!-- o el slot trigger -->
  </button>
  <div class="g-helper__content" id="ID-content" role="dialog" aria-label="Ayuda del formulario"
       popover="manual" tabindex="-1" data-side="bottom">…slot content…</div>
</span>
```

- El contenido va **justo después del botón en el DOM**: Tab entra en él sin mover el foco a mano.
- En la capa superior (`popover="manual"`), con posición fija: **ningún `overflow: hidden` lo recorta**.
- `data-side` indica el lado **realmente usado** tras el volteo (para la dirección de la animación y de una flecha futura).
- Con la hoja, el slot `content` se renderiza **dentro de un `GDialog`** (`mobile="sheet"`, `size="sm"`, `title` = `contentLabel`, `closeLabel`) en lugar del popover; nunca en los dos a la vez.

## Colisión (utilidad interna compartida)

El contenido prueba, en orden: el lado pedido, el **opuesto** y los dos **perpendiculares**. En el primero que cabe en el visor (con un margen de `space × 2`), se **desplaza** sobre el eje secundario hasta quedar dentro. La posición se recalcula al desplazar la página o cambiar el tamaño del visor mientras está abierto.

La implementa una utilidad interna (`src/utils/anchor.js`) **extraída de `GMenu`**, que pasa a usarla en la misma entrega (DECISIONS.md #102). No es API pública: los consumidores no dependen de ella.

## Adaptación

Con `adaptive`, al **abrir** se decide la presentación por el **espacio real**:

| Condición | Presentación |
| --- | --- |
| El visor mide al menos **`space × 130`** (520px con `space` 4: el umbral en que `GDialog` pasa a hoja) **y** alguna posición cabe | Popover |
| Si no | Hoja (`GDialog` con `mobile="sheet"`; por encima de ~520px, `GDialog` se muestra centrado) |

La presentación se mantiene mientras está abierto (un cambio de tamaño solo reposiciona el popover). El umbral deriva de `space`; no es un token.

**Corrección de bruno (al construir):** la propuesta de kiwi («ancho cómodo del contenido = `space × 80`», 320px más márgenes) dejaba un popover de 320px en móviles de 360px o más: nunca se veía la hoja que pide la especificación (§21, móvil → hoja). Se alinea con el umbral de `GDialog`: así la hoja es siempre una hoja inferior, nunca un diálogo centrado por falta de ancho. Verificado: 360px → hoja, 520px → popover.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:open` | `Boolean` | El usuario abre o cierra (botón, Esc, clic fuera, foco que sale, cierre de la hoja) |
| `toggle` | `{ open, presentation }` | Tras abrir o cerrar; `presentation`: `popover` o `sheet` |

## Slots

| Slot | Alcance | Propósito | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `trigger` | `{ open }` | Contenido **del** botón (icono, texto, avatar) | Dentro de `button.g-helper__trigger` (clase `--custom`). **Sin controles** (un `GBtn` aquí sería un botón anidado) |
| `content` | `{ close, presentation }` | Contenido agnóstico | Dentro de `g-helper__content` o del cuerpo de la hoja |
| `default` | `{ close, presentation }` | Alias de `content` (`content` gana) | Igual |

`close()` cierra y devuelve el foco al disparador.

## Teclado y foco

| Tecla | Acción |
| --- | --- |
| Enter / Espacio (en el disparador) | Abre o cierra (nativo del botón) |
| Esc (con el foco en el disparador o en el contenido) | Cierra y devuelve el foco al disparador |
| Tab / Shift+Tab | Navegación normal: del disparador entra al contenido abierto; al salir de ambos, el popover se cierra |

- **Clic fuera** del disparador y del contenido: cierra sin mover el foco.
- **Un solo helper abierto a la vez:** abrir uno cierra el anterior.
- En la **hoja**, foco, Esc, inercia y retorno del foco son los de `GDialog`.
- Foco visible con `--g-focus-width`, `--g-focus-offset` y `--g-color-focus`; sin estilos propios. Con `pointer: coarse`, disparador ≥ 44px.

## Tokens consumidos

Existentes: `--g-color-surface`, `--g-color-text`, `--g-color-text-muted`, `--g-color-border`, `--g-color-border-control`, `--g-color-focus`, `--g-radius-pill`, `--g-radius-lg`, `--g-shadow-2`, `--g-space-1`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset`, `--g-font-ui`, `--g-text-body-sm-{size|line}`, `--g-duration-fast`, `--g-duration-press`, `--g-ease-standard`, `--g-ease-out`.

**Sin tokens nuevos.** El popover usa el mismo lenguaje que `GSurface level="floating"` (`--g-shadow-2`, `--g-radius-lg`, borde tenue), escrito en `GHelper.css`. Disparador por defecto: `space × 8` (32px) en círculo, icono `circle-help` (añadido a `icons.md` §4).

## Clases (contrato entre bruno y coco)

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-helper-scope` | Raíz de `GHelperScope` | Siempre |
| `g-helper` | Raíz de `GHelper` | Siempre |
| `g-helper--{inline\|float}` | Raíz | Siempre |
| `g-helper--side-{top\|right\|bottom\|left}`, `g-helper--align-{start\|center\|end}`, `g-helper--attach-{inside\|edge\|outside}` | Raíz | Solo en `float` |
| `is-open`, `is-disabled` | Raíz | Según estado |
| `g-helper__trigger` con `--default` o `--custom` | Botón | Siempre |
| `g-helper__content` con `data-side` | Popover | Presentación popover |

Variable dinámica en línea: `--_offset` (número).

## Resolución de hallazgos

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | `ariaLabel` con `'Abrir ayuda'` | Sin valor por defecto; obligatorio sin texto visible; aviso en desarrollo. Se conserva el nombre `ariaLabel` de la especificación | Regla de Grana (textos del consumidor), como `closeLabel` |
| 2 | Nombre del contenido | `contentLabel` (también título de la hoja) | WCAG 4.1.2 |
| 3 | `left`/`right` | Lógicos (inicio/fin de línea); nombres de la especificación conservados | Especificación §10 (RTL) |
| 4 | Estado abierto | `open` + `update:open`; no controlado sin `v-model:open` | `api.md` (`modelValue` y análogos) |
| 5 | Slot `trigger` | Dentro del botón; sin controles; alcance `{ open }` | WCAG 4.1.2 (sin botones anidados); ejemplos de la especificación |
| 6 | Slot `default` | Alias de `content` | Especificación §14 |
| 7 | Hoja | `GDialog` con `title` = `contentLabel` y `closeLabel` | Decisión del usuario (DECISIONS.md #103) |
| 8 | Umbral de adaptación | `space × 130` (umbral de hoja de `GDialog`), derivado; no token. Corregido al construir: `space × 80` no llegaba a hoja en móviles | `tokens.md` §17.6; especificación §21 |
| 9 | `offset` | Unidades de `space`, variable en línea `--_offset` | Especificación §12 |
| 10 | Eventos | `update:open` y `toggle` | Patrón de Grana |
| 11 | Posicionamiento compartido | `src/utils/anchor.js` extraído de `GMenu`; `GMenu` lo usa | Decisión del usuario (DECISIONS.md #102) |
| 12 | `disabled` | Nativo; cierra si estaba abierto | `api.md` |
| 13 | Tokens | Ninguno nuevo | `tokens.md` §17.6 |

## Límites conocidos

- **`GAvatarMotion` no existe todavía:** el slot `trigger` ya admite cualquier contenido, incluido un avatar futuro, sin cambiar esta API (DECISIONS.md #104).
- **Sin flecha** del popover en v0.1 (`data-side` la deja preparada).
- **Contenido más alto que el visor** en escritorio: cuenta como «no cabe» y va a hoja (centrada por encima de ~520px).
- La presentación no cambia mientras está abierto.
- Lector de pantalla real, táctil real y zoom al 200%: por verificar.
