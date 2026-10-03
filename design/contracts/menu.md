# Contrato · GMenu

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/menu/r01/` (kiwi) · **Complementa:** `design/contracts/widget.md`
**Tag:** `g-menu` · **Categoría:** superposiciones

Menú de acciones anclado a un **botón de menú** (patrón *Menu Button* y *Menu* de APG): acciones, separadores, grupos con título, casillas, opciones, submenús y elementos peligrosos. Alcance decidido por el usuario (DECISIONS.md #82 a #84): botón de menú (sin menú contextual ni anclaje libre), contenido por arreglo de `items` con slots, y `GWidget` pasa a usarlo.

## Principios

- **El disparador es de la aplicación** (slot `trigger`): el menú no trae un botón propio ni textos. El componente le da los atributos de ARIA y los manejadores de teclado.
- **Presenta y emite intención** (como el resto de Grana): el estado de casillas y opciones es `checked` de `items`; el componente emite `select` y **la aplicación actualiza `items`**.
- **Datos, no hijos:** los elementos salen de un arreglo (como `GSidebar`); los slots personalizan icono y contenido.
- **El significado nunca depende solo del color:** peligroso (▲ y negrita), deshabilitado (tachado), casilla (✓) y opción (●) llevan forma y texto.
- **Sin textos ni iconos por defecto:** todo lo pone la aplicación (los iconos, por nombre en `item.icon` o por slot; #202).

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
| `icon` | String (nombre de Lucide) \| cualquier valor | De la aplicación; decorativo. **Cadena y sin slot `icon`:** el elemento dibuja `GIcon` con ese nombre en `g-menu__icon` (`icons.md` §5, `api.md` «Iconos en los componentes», #202). **Con slot `icon`, manda el slot.** Otro valor: dato opaco que solo recibe el slot |
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
5. **Submenús:** → (en RTL, ←), Enter o Espacio abren con el foco en su primer elemento; ← (en RTL, →) o **Esc cierran solo ese nivel** y devuelven el foco al padre. El puntero encima abre tras **180ms** y cierra al pasar a otro elemento; tocar un padre lo abre (sin depender del puntero). Un padre deshabilitado no abre. **El puntero mueve el foco** y los submenús respetan el **movimiento diagonal** del puntero (§«Personalidad», M1 y M4, #305).
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
| `trigger` | El **disparador** (obligatorio) | `{ open, attrs }` | La aplicación enlaza `attrs` (`v-bind="attrs"`): `id`, `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`, `onClick`, `onKeydown` y una referencia al elemento. Debe ser un elemento enfocable (un `<button>`) con nombre accesible. **El `id` es del menú: la aplicación no lo sobrescribe** (ver «Disparador con `id` propio») |
| `icon` | Icono de un elemento (decorativo); **sustituye** al `GIcon` por nombre de `item.icon`. También un **avatar** (`GAvatar size="xs"`, ver abajo) | `{ item }` | Dentro de `g-menu__icon` (`aria-hidden`). **Con un hijo directo `.g-avatar`, el hueco mide `space × 5`**, y en un menú que mezcla iconos y avatares **todos** los huecos no vacíos miden `space × 5` (etiquetas alineadas; el icono, centrado a su tamaño); alto del elemento sin cambio (#295) |
| `item` | Contenido de un elemento, en lugar de icono y etiqueta | `{ item, active, checked }` | **Conserva el texto de la etiqueta** (es el nombre accesible) |

**Avatar en un elemento** (#296, `avatar.md`): sin campo `item.avatar`. El dato va en `item.icon` como **valor opaco** (un objeto), que solo recibe el slot `icon` (sin slot no se dibuja nada, #202), y el slot pinta el avatar decorativo (el nombre accesible sigue siendo `label`):

```html
<GMenu :items="[{ id: 'ana', label: 'Ana María López', icon: { name: 'Ana María López', src: fotoAna } }]">
  <template #icon="{ item }">
    <GAvatar v-if="typeof item.icon === 'object'" v-bind="item.icon" size="xs" />
    <GIcon v-else :name="item.icon" />
  </template>
</GMenu>
```

### Disparador con `id` propio (hallazgo 8 de kiwi `personalidad/r01`, #305 y #308)

- El `id` del disparador lo genera `GMenu` (`{id}-trigger`, con `{id}` la prop `id` o el generado) y es el que `aria-labelledby` de la lista usa **cuando el disparador no trae otro**. **Regla:** la aplicación **no** pone su propio `id` al disparador; si necesita conocerlo o fijarlo, usa la **prop `id`** de `GMenu`.
- **Causa raíz (medida por bruno, #308):** `GBtn` tiene **dos raíces** (el botón y su región de estado), así que la referencia del slot `trigger` es una instancia cuyo `$el` es el **ancla vacía del fragmento**, no el botón. Antes, `GMenu` solo encontraba el botón por `document.getElementById('{id}-trigger')`; con un `id` propio (p. ej. `id` después de `v-bind="attrs"`) no había ancla, `place` no llamaba a `showPopover` y **el menú no se abría, sin avisar**. **Ahora** `GMenu` resuelve el elemento del disparador por la **referencia**: si es un componente de varias raíces, toma **el primer hermano elemento** del ancla (que no sea una lista de menú); la búsqueda por `{id}-trigger` queda solo de respaldo.
- **Un `id` propio ya no rompe el menú, pero sigue sin ser el camino** (#308): el menú **se abre** y la lista usa **ese `id` real en `aria-labelledby`** (el nombre accesible de la lista no se pierde). Esto **no es** «adoptar en silencio» el `id` de la aplicación (alternativa descartada en #305): el **aviso de desarrollo se mantiene** y la regla de arriba sigue vigente; solo se evita que un descuido deje el menú muerto o sin nombre.
- **Aviso de desarrollo** (una vez, `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`): al montar y al abrir, si el elemento del disparador (por su referencia) tiene un `id` distinto de `{id}-trigger`: «[Grana GMenu] el disparador tiene `id="…"`; GMenu necesita `…-trigger` (usa la prop `id` de GMenu)». Es obligatorio aunque el menú se abra.
- mora-docs: documentarlo en el README de `GMenu` («El disparador»), con la causa de las dos raíces de `GBtn`.

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
| `has-highlight` | Lista o submenú (`g-menu__list`) | Hay elemento activo en esa lista (§«Personalidad», M1) |
| `is-highlight-instant` | Lista o submenú | Primera colocación del resaltado, sin viajar; se quita a los dos cuadros |

## Personalidad (DECISIONS.md #305; lenguaje común, #299 y `tokens.md` §29)

Ronda de kiwi `design/lab/personalidad/r01/` §8 (M1 prototipada sobre el componente real; M4 no). Ninguna prop, slot ni evento nuevo.

### M1 · Una sola luz que viaja

- **Un único resaltado por lista** (la lista raíz y cada submenú, cada uno el suyo), una capa bajo el contenido que **se desplaza** al elemento activo; los elementos **no** pintan fondo propio al tener hover o foco (hoy, al barrer, dos elementos tienen fondo a la vez: la estela que se corrige).
- **El puntero mueve el foco:** al entrar el puntero (`pointerenter`/`pointermove` con `pointerType` `mouse` o `pen`) en un elemento **habilitado**, pasa a ser el activo del *roving tabindex* y recibe el foco con `preventScroll: true`, **en el acto** (sin los 180ms, que siguen solo para **abrir** un submenú). Un foco puesto así no muestra el anillo de `:focus-visible` (heurística del navegador tras puntero). Sobre un **deshabilitado**, el puntero no mueve foco ni resaltado; con teclado, el deshabilitado se enfoca y se resalta (como hoy).
- **Elemento activo de cada lista:** el que tiene el foco en ella; si el foco está en un submenú, el **padre expandido** en la lista de arriba. Sin activo, la lista pierde `has-highlight` y el resaltado se funde.
- **Datos** (bruno, `GMenu.vue`), en cada `g-menu__list`: **`--_active-y`** y **`--_active-h`** (px: `offsetTop` y `offsetHeight` del activo respecto de su lista; el resaltado se desplaza con el contenido si la lista tiene scroll), **`has-highlight`** mientras haya activo, e **`is-highlight-instant`** en la primera colocación tras abrir o tras no tener activo (aparece en su sitio sin viajar desde 0; se quita a los dos cuadros). Escrituras solo si cambian. **`is-highlight-instant` solo en la primera colocación** (#308): cuando el puntero entra desde fuera con la lista ya abierta y con el foco en otro elemento (p. ej. el primero, abierta por teclado o por clic), el resaltado **viaja desde el elemento que tenía el foco hasta el del puntero**: es el comportamiento buscado (una sola luz que viaja, y el foco **sí** estaba allí); no hay una segunda «primera colocación» por entrar el puntero.
- El **anillo de foco** de cada elemento no cambia. En **`forced-colors`**, el resaltado se oculta y manda el estilo de foco del sistema (como hoy).
- Movimiento: `--g-duration-press`, `--g-ease-out` para posición y alto; fundido `--g-duration-fast`. Nunca `--g-ease-spring` ni `--g-ease-bounce` (#299).
- **Cambia una nota de estilo de coco** (`design/lab/menu/estilo.md`, fila «Elemento»: «el activo (foco, ratón o submenú abierto) en `--g-color-surface-sunken`» pasa a la capa única con ese mismo color).

### M4 · Submenú con intención

- Con un submenú abierto, mientras el puntero se mueve del padre **hacia** él dentro del **triángulo** formado por la posición del puntero al salir del padre (actualizada en cada movimiento) y las **dos esquinas del borde cercano** del submenú (el de su lado de apertura: final en LTR, inicio en RTL; si se abrió hacia el otro lado por falta de sitio, ese), cruzar otros elementos del padre **no** cambia el activo, **no** mueve el foco ni cierra el submenú.
- Si el puntero **se detiene** 180ms sobre otro elemento del padre (o sale del triángulo), cambia como hoy. **Los 180ms son la constante neutra `HOVER_MS = 180`** de `GMenu.vue` (#187, #299 (8)): **la misma pausa que abre un submenú** al pasar el puntero, no un token ni un valor del tema. En cascada (submenú superpuesto al padre en pantallas estrechas) no aplica.
- El teclado y el toque no cambian.

### Movimiento reducido

El resaltado **salta** (sin desplazamiento), con fundido. M4 no es movimiento: rige igual.

### Verificación (criterio de hecho: la medida de kiwi)

| Qué | Medida |
| --- | --- |
| M1 | Al barrer con el puntero: **0** elementos con fondo propio y como máximo **una** superficie de resaltado por lista; cuadros intermedios entre elementos (kiwi: 7); termina exacto sobre el elemento (kiwi: 114/114); con teclado, sigue al foco (kiwi: 42/42); el puntero mueve el foco (`document.activeElement`); deshabilitado con puntero: nada cambia; con `reduce`, salta |
| M4 | Trayecto diagonal hacia el submenú cruzando otro elemento: sin cambio de `path` ni de foco; trayecto recto o parada: cambio a los 180ms, como hoy; RTL espejado |
| Aviso | `id` propio en el disparador (también con `GBtn`, de dos raíces): el menú **se abre**, `aria-labelledby` de la lista apunta a ese `id` y sale **un** aviso de desarrollo (#308) |
| Reservadas | M2 (cascada al abrir; medida, pero un menú es frecuente) y M3 (parpadeo de confirmación): fuera de esta tanda |
| No verificado | Lector de pantalla real con el foco siguiendo al puntero (VoiceOver, NVDA) |

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
