# Contrato · GMenu

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/menu/r01/` (kiwi) · **Complementa:** `design/contracts/widget.md`
**Tag:** `g-menu` · **Categoría:** superposiciones

Menú de acciones anclado a un **botón de menú** (patrón *Menu Button* y *Menu* de APG): acciones, separadores, grupos con título, casillas, opciones, submenús y elementos peligrosos. Alcance decidido por el usuario (DECISIONS.md #82 a #84): botón de menú (sin menú contextual ni anclaje libre), contenido por arreglo de `items` con slots, y `GWidget` pasa a usarlo.

## Principios

- **El disparador es de la aplicación** (slot `trigger`): el menú no trae un botón propio ni textos. El componente le da los atributos de ARIA y los manejadores de teclado.
- **Presenta y emite intención** (como el resto de Grana): el estado de casillas y opciones es `checked` de `items`; el componente emite `select` y **la aplicación actualiza `items`**.
- **Datos, no hijos:** los elementos salen de un arreglo (como `GSidebar`); los slots personalizan icono y contenido.
- **El significado nunca depende solo del color:** peligroso (▲ y negrita), deshabilitado (tachado), casilla (✓) y opción (●) llevan forma y texto.
- **Sin textos ni iconos por defecto:** todo lo pone la aplicación.

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | Boolean | abierto (con `update:modelValue`) | `false` | compartida |
| `items` | Array | ver «Elementos» | `[]` | propia |
| `label` | String | nombre accesible de la lista (por defecto, el del disparador) | sin valor | propia |
| `align` | String | `start` `end` (borde del disparador con el que se alinea) | `start` | propia |
| `side` | String | `auto` `bottom` `top` | `auto` | propia |
| `closeOnSelect` | String | `auto` `always` `never` | `auto` | propia |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `id` | String | | generado | propia |

### Reglas de props

- **`modelValue`:** abre y cierra. El componente **no cambia el prop por su cuenta**: ante una acción, Esc, Tab o un clic fuera, emite `update:modelValue` con `false`.
- **`label`:** la lista se nombra por el disparador (`aria-labelledby`); con `label` se usa este texto (`aria-label`). Sin disparador con nombre ni `label`, avisa en desarrollo. **Cada submenú se nombra por su elemento padre.**
- **`align`:** `start` alinea la lista con el borde de **inicio** del disparador (izquierdo en LTR, derecho en RTL); `end`, con el borde final.
- **`side`:** `auto` abre **debajo** y, si no cabe y hay más espacio arriba, **arriba**; `bottom` y `top` fijan el lado (siempre con ajuste al visor).
- **`closeOnSelect`:** `auto` (por defecto): las **acciones cierran** el menú y las **casillas y opciones no**; `always`, todo cierra; `never`, nada cierra (la aplicación cierra con `modelValue`).
- **`density`:** multiplica el alto y el relleno de los elementos (1×, 0.875×, 0.75×), con piso de 24px.
- **Resto de atributos:** `class`, `style` y `data-*` van a la **lista** (el `ul` del menú).

## Elementos (`items`)

```js
[
  { id: 'rename', label: 'Renombrar', icon: 'pencil', shortcut: 'F2', keyshortcuts: 'F2' },
  { id: 'move', label: 'Mover a…', disabled: true },
  { type: 'separator' },
  { type: 'group', label: 'Mostrar', items: [
    { type: 'checkbox', id: 'grid', label: 'Cuadrícula', checked: true },
    { type: 'radio', id: 'by-name', label: 'Por nombre', checked: true }
  ] },
  { label: 'Exportar como', items: [{ id: 'pdf', label: 'PDF' }] },      // submenú
  { id: 'del', label: 'Eliminar', danger: true }
]
```

| Campo | Tipo | Uso |
| --- | --- | --- |
| `type` | `item` (por defecto) · `checkbox` · `radio` · `separator` · `group` | Un elemento con `items` es un **submenú** (su `type` es `item`) |
| `id` | String \| Number | **Obligatorio** en `item` (que no sea un padre de submenú), `checkbox` y `radio` (si no, se ignora y avisa); único en todo el menú. Un padre de submenú no emite `select`: su `id` es opcional |
| `label` | String | **Obligatorio** salvo en `separator`; es el **nombre accesible** del elemento |
| `icon` | cualquier valor | De la aplicación: llega al slot `icon` (Grana no trae iconos); decorativo |
| `shortcut` | String | Texto visible al final («Ctrl+D»), `aria-hidden` |
| `keyshortcuts` | String | Valor de `aria-keyshortcuts` (sintaxis de ARIA, «Control+D»); sin valor, no se pone |
| `disabled` | Boolean | `aria-disabled="true"`, **sigue enfocable**, atenuado y tachado; no se activa ni abre submenú |
| `danger` | Boolean | Marca de forma (▲) y negrita, además del color |
| `checked` | Boolean | Estado de `checkbox` y `radio` (`aria-checked`) |
| `items` | Array | En `group`: sus elementos; en un `item`: el submenú |

- **Grupo:** `{ type: 'group', label, items }`; el título es visible y **nombra** el grupo (`role="group"`). Las **opciones** de un grupo se presentan como exclusivas, pero **el componente no fuerza la exclusividad**: la aplicación marca `checked` tras `select`.
- **Submenús:** hasta **tres niveles** verificados; un submenú sin elementos no se abre.
- Un tipo desconocido o un elemento sin `label` se ignora y avisa una vez en desarrollo.

## Comportamiento

1. **Abrir:** clic, Enter, Espacio y ↓ abren con el foco en el **primer** elemento; ↑ abre en el **último**; un segundo clic cierra.
2. **Foco:** *roving tabindex*: solo el elemento activo es tabulable; ↑ ↓ recorren de forma **cíclica**, Inicio y Fin saltan a los extremos; una letra salta al siguiente elemento que empieza por ella (búfer de 500ms). El elemento activo **siempre se ve** (se desplaza la lista). Los deshabilitados **siguen enfocables**.
3. **Activar:** Enter y Espacio. Emite `select`. Con `closeOnSelect="auto"`, una **acción cierra** y devuelve el foco al disparador; una **casilla o una opción no cierran**. Un elemento deshabilitado no hace nada ni cierra.
4. **Cerrar:** **Esc** cierra y devuelve el foco al disparador (y **no llega** a un ancestro, como un `GDialog`); **Tab** cierra y el foco sigue su curso (no vuelve al disparador); un **clic fuera** cierra sin robar el foco.
5. **Submenús:** → (en RTL, ←), Enter o Espacio abren con el foco en su primer elemento; ← (en RTL, →) o **Esc cierran solo ese nivel** y devuelven el foco al padre. El puntero encima abre tras **180ms** y cierra al pasar a otro elemento; tocar un padre lo abre (sin depender del puntero). Un padre deshabilitado no abre.
6. **Posición:** debajo del disparador (`side`), ajustada al visor; si no cabe, se abre hacia el lado con más espacio y **el alto se limita al espacio disponible** (la lista se desplaza). El submenú se abre hacia el borde **final** del padre y **cambia de lado** si no cabe; con poco ancho se superpone al padre (cascada). Variables CSS dinámicas `--_x`, `--_y` y `--_max` (excepción justificada a «sin estilos en línea»).
7. **Sigue a su disparador** al desplazar o redimensionar; si el disparador **sale del visor, se cierra**. Desplazar dentro de la propia lista no la recoloca.
8. **Sin anuncios propios:** el cambio de una casilla u opción lo lee el lector por `aria-checked`; al cerrar, el foco vuelve al disparador. Anunciar el resultado de una acción es de la aplicación.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `select` | `{ id, item, type, checked?, group?, event }` | El usuario activa un elemento (no un padre de submenú ni uno deshabilitado). `checked` es el valor **nuevo** de una casilla (`!checked`) y `true` de una opción; `group` es el elemento de grupo que la contiene |
| `update:modelValue` | Boolean | El menú se abre o cierra por una vía de usuario |
| `open`, `closed` | | La lista ya se muestra / ya se ocultó |

`event` es el evento nativo; `event.preventDefault()` **impide el cierre** de ese `select`.

## Slots

| Slot | Propósito | Alcance | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `trigger` | El **disparador** (obligatorio) | `{ open, attrs }` | La aplicación enlaza `attrs` (`v-bind="attrs"`): `id`, `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`, `onClick`, `onKeydown` y una referencia al elemento. Debe ser un elemento enfocable (un `<button>`) con nombre accesible |
| `icon` | Icono de un elemento (decorativo) | `{ item }` | Dentro de `g-menu__icon` (`aria-hidden`) |
| `item` | Contenido de un elemento, en lugar de icono y etiqueta | `{ item, active, checked }` | **Conserva el texto de la etiqueta** (es el nombre accesible) |

## Estructura accesible

```html
<button id="ID-trigger" type="button" aria-haspopup="menu" aria-expanded="true" aria-controls="ID-list">Acciones</button>
<ul class="g-menu__list" id="ID-list" role="menu" popover="manual" aria-labelledby="ID-trigger">
  <li role="none"><button class="g-menu__item" role="menuitem" tabindex="0">
    <span class="g-menu__icon" aria-hidden="true">…</span><span class="g-menu__label">Renombrar</span>
    <span class="g-menu__shortcut" aria-hidden="true">F2</span></button></li>
  <li role="none"><div class="g-menu__separator" role="separator"></div></li>
  <li role="none"><div class="g-menu__group-title" id="ID-g1" role="presentation">Mostrar</div>
    <ul role="group" aria-labelledby="ID-g1">
      <li role="none"><button class="g-menu__item" role="menuitemcheckbox" aria-checked="true" tabindex="-1"><span class="g-menu__mark" aria-hidden="true"></span><span class="g-menu__label">Cuadrícula</span></button></li>
    </ul></li>
  <li role="none"><button class="g-menu__item" role="menuitem" tabindex="-1" aria-haspopup="menu" aria-expanded="false" aria-controls="ID-s1" id="ID-i1">…Exportar como</button>
    <ul class="g-menu__list" id="ID-s1" role="menu" popover="manual" aria-labelledby="ID-i1">…</ul></li>
  <li role="none"><button class="g-menu__item g-menu__item--danger" role="menuitem" tabindex="-1" aria-disabled="true"><span class="g-menu__icon" aria-hidden="true"></span><span class="g-menu__label">Eliminar</span></button></li>
</ul>
```

- **La lista no vive dentro del disparador:** se inserta a continuación (en el mismo contenedor), con `popover="manual"` (capa superior, sin foco automático: el foco lo gestiona el componente).
- **Un submenú** es un `ul role="menu"` **dentro del `li`** de su padre, con su propio `popover`.
- **`aria-disabled`** (nunca `disabled`): los deshabilitados siguen enfocables.
- **Objetivo ≥ 24px; 44px con `pointer: coarse`.** Foco visible siempre.

## Teclado

| Tecla | Acción |
| --- | --- |
| Enter / Espacio / ↓ (en el disparador) | Abre con el foco en el primer elemento |
| ↑ (en el disparador) | Abre con el foco en el último |
| ↑ ↓ | Anterior / siguiente (cíclico) |
| Inicio / Fin | Primero / último |
| Letra | Salta al siguiente elemento que empieza por ella (500ms) |
| Enter / Espacio | Activa (casilla y opción alternan sin cerrar) |
| → (en RTL ←) | Abre el submenú del elemento enfocado |
| ← (en RTL →) o Esc (en un submenú) | Cierra ese nivel y vuelve al padre |
| Esc | Cierra y devuelve el foco al disparador |
| Tab | Cierra; el foco sigue su curso |

## Tokens consumidos

| Token | Para qué |
| --- | --- |
| `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-border-control` (3:1), `--g-color-border` | Lista, elemento activo y separadores |
| `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Etiqueta, deshabilitado, atajo y título de grupo |
| `--g-color-danger-text`, `--g-color-brand`, `--g-color-on-brand` | Peligroso y marca de casilla y opción |
| `--g-color-focus`, `--g-focus-width`, `--g-focus-offset` | Foco |
| `--g-radius-*`, `--g-border-width`, `--g-shadow-2`, `--g-space-*`, `--g-text-*`, `--g-duration-*`, `--g-ease-*` | Forma, separación, sombra y movimiento |

**Sin tokens nuevos**: el ancho mínimo y el máximo de la lista derivan de `space` (200 y 320px con `space` 4).

## Clases (contrato entre bruno y coco)

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-menu__list` (+ `--density-*`) | Lista y submenús (`ul`) | Siempre |
| `g-menu__item` (+ `--danger`, `is-expanded`) | Elemento | Siempre (`is-expanded` en un padre con el submenú abierto) |
| `g-menu__icon`, `__label`, `__shortcut` | Partes del elemento | Según el elemento |
| `g-menu__mark` | Marca de casilla u opción | En `checkbox` y `radio` |
| `g-menu__group-title`, `g-menu__separator` | Título de grupo y separador | Según el elemento |

## Resolución de hallazgos de r01

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | Nombre y alcance | `GMenu`; `GWidget` lo usa | DECISIONS.md #82 |
| 2 | Modelo de datos | `items` con `type`, `checked`, `items` (grupo y submenú) | DECISIONS.md #82 |
| 3 | Estado de casillas y opciones | La aplicación lo guarda; `select` emite la intención | DECISIONS.md #83 |
| 4 | Apertura | `modelValue` y el slot `trigger` con `attrs` | DECISIONS.md #83 |
| 5 | Posición | `align` y `side` | DECISIONS.md #83 |
| 6 | Slots | `icon` e `item` | DECISIONS.md #83 |
| 7 | Cierre al elegir | `closeOnSelect` (`auto`, `always`, `never`) | DECISIONS.md #83 |
| 8 | `GWidget` | Ver `widget.md` | DECISIONS.md #84 |
| 9 | Teclado y foco | El componente gestiona *roving focus*, letra, Esc y Tab | APG |
| 10 | Tokens | Ninguno nuevo | — |
| 11 | Pantallas angostas | Cascada (el submenú se superpone al padre) | — |

## Límites conocidos

- **Sin menú contextual**, sin anclaje a un elemento arbitrario y sin barra de menús (*menubar*); **sin elementos con contenido libre o campos**.
- **El componente no fuerza la exclusividad** de las opciones: la aplicación marca `checked`.
- **Submenús:** tres niveles verificados; en pantallas muy angostas se superponen en cascada.
- **Lector de pantalla:** cómo se leen los submenús, los grupos y las opciones está por verificar con lectores reales; Firefox y Safari (`popover`, `:dir()`), por verificar.

## Abierto (no bloquea el paso siguiente)

- Valores estéticos (lista, marcas, sombra, movimiento, chevron espejado en RTL): los decide coco con los tokens listados.
