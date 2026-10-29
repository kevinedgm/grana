# Contrato · GMenu

**Dueño:** lima · **Estado:** aprobado; motivo de no disponible y confirmación en el sitio contratados el 2026-10-20 para `GResourceList` (#790) y buscar al escribir el 2026-10-21 (#797), pendientes de coco y bruno · **Basado en:** `design/lab/menu/r01/` y `design/lab/menu/r02/` (elementos-enlace, §«Elementos-enlace») (kiwi) · **Complementa:** `design/contracts/widget.md`
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
| `density` | String | `default` `comfortable` `compact` | sin valor: la región (`density.md`, #975) | compartida |
| `labels` | Object | textos de los elementos-enlace (§«Elementos-enlace», «Textos»), `cancel` de la confirmación en el sitio (#790) y `findHint`, `matches`, `matchesOne`, `none` de buscar al escribir (#797) | `{}` | compartida (sin valores por defecto, #226) |
| `id` | String | | generado | propia |

### Reglas de props

- **`modelValue`:** abre y cierra. El componente **no cambia el prop por su cuenta**: ante una acción, Esc, Tab o un clic fuera, emite `update:modelValue` con `false`.
- **`label`:** la lista se nombra por el disparador (`aria-labelledby`); con `label` se usa este texto (`aria-label`). Sin disparador con nombre ni `label`, avisa en desarrollo. **Cada submenú se nombra por su elemento padre.**
- **`align`:** `start` alinea la lista con el borde de **inicio** del disparador (izquierdo en LTR, derecho en RTL); `end`, con el borde final.
- **`side`:** `auto` abre **debajo** y, si no cabe y hay más espacio arriba, **arriba**; `bottom` y `top` fijan el lado (siempre con ajuste al visor).
- **`closeOnSelect`:** `auto` (por defecto): las **acciones cierran** el menú y las **casillas y opciones no**; `always`, todo cierra; `never`, nada cierra (la aplicación cierra con `modelValue`).
- **`density`:** multiplica el alto y el relleno de los elementos (1×, 0.875×, 0.75×), con piso de 24px. Sin prop, la lista sigue la región de su disparador (el `popover` vive en su sitio; `density.md` §5.1); con prop, `data-g-density` y la clase van en `g-menu__list` (#975).
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
| `disabled` | Boolean \| String | `aria-disabled="true"`, **sigue enfocable**, atenuado y tachado; no se activa ni abre submenú. **Con String** (#790), ese **motivo** es su descripción visible (§«Motivo y confirmación en el sitio») |
| `danger` | Boolean | Marca de forma (▲) y negrita, además del color |
| `confirm` | String | Solo con `danger` (#790): la **pregunta** de la confirmación en el sitio. Sin `confirm`, el elemento peligroso se activa **como hoy** (sin confirmar ni aviso) |
| `confirmLabel` | String | Solo con `danger` y `confirm`: texto del botón que confirma; sin él, la `label` |
| `checked` | Boolean | Estado de `checkbox` y `radio` (`aria-checked`) |
| `items` | Array | En `group`: sus elementos; en un `item`: el submenú |
| `href` | String | Con valor, el elemento es un **enlace** `<a role="menuitem" href>` y emite `navigate` en lugar de `select` (§«Elementos-enlace», #572) |
| `target`, `rel` | String | Atributos del `<a>`; solo con `href` (§«Elementos-enlace») |
| `lang`, `hreflang` | String | Idioma de la etiqueta (cualquier elemento) e idioma del destino (solo con `href`); selector de idioma (§«Elementos-enlace», #743) |
| `external` | Boolean | El destino es **otro sitio**: marca «sale de aquí» y texto para lectores; solo con `href` |
| `current` | Boolean | Es la **página actual**: `aria-current="page"`; solo con `href`; como mucho uno por menú |

- **Grupo:** `{ type: 'group', label, items }`; el título es visible y **nombra** el grupo (`role="group"`). Las **opciones** de un grupo se presentan como exclusivas, pero **el componente no fuerza la exclusividad**: la aplicación marca `checked` tras `select`.
- **Submenús:** hasta **tres niveles** verificados; un submenú sin elementos no se abre.
- Un tipo desconocido o un elemento sin `label` se ignora y avisa una vez en desarrollo.

## Comportamiento

1. **Abrir:** clic, Enter, Espacio y ↓ abren con el foco en el **primer** elemento; ↑ abre en el **último**; un segundo clic cierra.
2. **Foco:** *roving tabindex*: solo el elemento activo es tabulable; ↑ ↓ recorren de forma **cíclica**, Inicio y Fin saltan a los extremos; una letra salta al siguiente elemento que empieza por ella (búfer de 500ms). El elemento activo **siempre se ve** (se desplaza la lista). Los deshabilitados **siguen enfocables**.
3. **Activar:** Enter y Espacio. Emite `select` (un **elemento-enlace** emite `navigate`, §«Elementos-enlace»). Con `closeOnSelect="auto"`, una **acción cierra** y devuelve el foco al disparador; una **casilla o una opción no cierran**. Un elemento deshabilitado no hace nada ni cierra.
4. **Cerrar:** **Esc** cierra y devuelve el foco al disparador (y **no llega** a un ancestro, como un `GDialog`); **Tab** cierra y el foco sigue su curso (no vuelve al disparador); un **clic fuera** cierra sin robar el foco.
5. **Submenús:** → (en RTL, ←), Enter o Espacio abren con el foco en su primer elemento; ← (en RTL, →) o **Esc cierran solo ese nivel** y devuelven el foco al padre. El puntero encima abre tras **180ms** y cierra al pasar a otro elemento; tocar un padre lo abre (sin depender del puntero). Un padre deshabilitado no abre. **El puntero mueve el foco** y los submenús respetan el **movimiento diagonal** del puntero (§«Personalidad», M1 y M4, #305).
6. **Posición:** debajo del disparador (`side`), ajustada al visor; si no cabe, se abre hacia el lado con más espacio y **el alto se limita al espacio disponible** (la lista se desplaza). El submenú se abre hacia el borde **final** del padre y **cambia de lado** si no cabe; con poco ancho se superpone al padre (cascada). Variables CSS dinámicas `--_x`, `--_y` y `--_max` (excepción justificada a «sin estilos en línea»).
7. **Sigue a su disparador** al desplazar o redimensionar; si el disparador **sale del visor, se cierra**. Desplazar dentro de la propia lista no la recoloca. «Sale de la vista» incluye el contenedor con desplazamiento que contiene al disparador; reglas comunes (lado con histéresis, `--_max` fijo): `docs/contract/api.md` «Paneles anclados» (#358).
8. **Sin anuncios propios:** el cambio de una casilla u opción lo lee el lector por `aria-checked`; al cerrar, el foco vuelve al disparador. Anunciar el resultado de una acción es de la aplicación.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `select` | `{ id, item, type, checked?, group?, event }` | El usuario activa un elemento (no un padre de submenú ni uno deshabilitado). `checked` es el valor **nuevo** de una casilla (`!checked`) y `true` de una opción; `group` es el elemento de grupo que la contiene |
| `navigate` | `{ id, item, event }` | El usuario activa un **elemento-enlace** con activación primaria sin modificadores y sin `target` de otro contexto (§«Elementos-enlace», regla común de `api.md` «Enlaces y `navigate`», #505 y #574). Un enlace **nunca** emite `select`. `event.preventDefault()` deja la navegación al router y **no** impide el cierre |
| `update:modelValue` | Boolean | El menú se abre o cierra por una vía de usuario |
| `open`, `closed` | | La lista ya se muestra / ya se ocultó |

`event` es el evento nativo; `event.preventDefault()` **impide el cierre** de ese `select` (en `navigate`, no: significa «navego yo», #573).

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
- **Aviso de desarrollo** (una vez, con la guarda canónica de #653): al montar y al abrir, si el elemento del disparador (por su referencia) tiene un `id` distinto de `{id}-trigger`: «[Grana GMenu] el disparador tiene `id="…"`; GMenu necesita `…-trigger` (usa la prop `id` de GMenu)». Es obligatorio aunque el menú se abra.
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
| Intro / Espacio (en un enlace) | Activación del enlace: emite `navigate` (sin `target` de otro contexto), cierra y devuelve el foco al disparador. Espacio lo provoca `GMenu` (§«Elementos-enlace», Teclado) |
| Ctrl/⌘+Intro (en un enlace) | Pestaña en segundo plano del navegador; sin `navigate`; el menú sigue abierto con la huella «Abierta» (C) |
| Mayús+Intro (en un enlace) | Ventana nueva del navegador; sin `navigate`; cierra |
| Ctrl/⌘+C (en un enlace) | Copia la URL absoluta con la huella «Enlace copiado» (C) |

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
| `g-menu__list` (+ `--density-*`) | Lista y submenús (`ul`) | Siempre (`--density-*` solo con la prop explícita, junto a `data-g-density`; #975) |
| `g-menu__item` (+ `--danger`, `is-expanded`) | Elemento | Siempre (`is-expanded` en un padre con el submenú abierto) |
| `g-menu__icon`, `__label`, `__shortcut` | Partes del elemento | Según el elemento |
| `g-menu__mark` | Marca de casilla u opción | En `checkbox` y `radio` |
| `g-menu__group-title`, `g-menu__separator` | Título de grupo y separador | Según el elemento |
| `has-highlight` | Lista o submenú (`g-menu__list`) | Hay elemento activo en esa lista (§«Personalidad», M1) |
| `is-highlight-instant` | Lista o submenú | Primera colocación del resaltado, sin viajar; se quita a los dos cuadros |
| `a.g-menu__item` | Elemento-enlace | Con `href` válido en un `item` (§«Elementos-enlace»); la página actual se selecciona por `[aria-current="page"]` |
| `is-branch` | `g-menu__item` padre de submenú | Su submenú (a cualquier profundidad) contiene la página actual (#576) |
| `g-menu__leave` | Marca «sale de aquí» (`aria-hidden`) | Enlace con `external` o con `target` de otra pestaña |
| `g-menu__sr` | Texto para lectores (patrón de texto oculto) | Enlace con `external` o con `target` de otra pestaña y su texto en `labels` |
| `g-menu__dest` (+ `is-empty`), `__dest-icon`, `__dest-host`, `__dest-path`, `__dest-tag` | Pie de destino (B) y sus partes | Lista con algún elemento que sale de la aplicación (#578) |
| `g-menu__trace` | Huella «Abierta» / «Enlace copiado» (C) | En cada enlace; vacía hasta el gesto (#577) |
| `is-modifier` | Lista o submenú | Ctrl/⌘ pulsado con el menú abierto (C, vista previa) |

## Personalidad (DECISIONS.md #305; lenguaje común, #299 y `tokens.md` §29)

Ronda de kiwi `design/lab/personalidad/r01/` §8 (M1 prototipada sobre el componente real; M4 no). Ninguna prop, slot ni evento nuevo.

### M1 · Una sola luz que viaja

- **Un único resaltado por lista** (la lista raíz y cada submenú, cada uno el suyo), una capa bajo el contenido que **se desplaza** al elemento activo; los elementos **no** pintan fondo propio al tener hover o foco (hoy, al barrer, dos elementos tienen fondo a la vez: la estela que se corrige).
- **El puntero mueve el foco:** al entrar el puntero (`pointerenter`/`pointermove` con `pointerType` `mouse` o `pen`) en un elemento **habilitado**, pasa a ser el activo del *roving tabindex* y recibe el foco con `preventScroll: true`, **en el acto** (sin los 180ms, que siguen solo para **abrir** un submenú). Un foco puesto así no muestra el anillo de `:focus-visible` (heurística del navegador tras puntero). Sobre un **deshabilitado**, el puntero no mueve foco ni resaltado; con teclado, el deshabilitado se enfoca y se resalta (como hoy).
- **Elemento activo de cada lista:** el que tiene el foco en ella; si el foco está en un submenú, el **padre expandido** en la lista de arriba. Sin activo, la lista pierde `has-highlight` y el resaltado se funde.
- **Datos** (bruno, `GMenu.vue`), en cada `g-menu__list`: **`--_active-y`** y **`--_active-h`** (px: `offsetTop` y `offsetHeight` del activo respecto de su lista; el resaltado se desplaza con el contenido si la lista tiene scroll), **`has-highlight`** mientras haya activo, e **`is-highlight-instant`** en la primera colocación tras abrir o tras no tener activo (aparece en su sitio sin viajar desde 0; se quita a los dos cuadros). Escrituras solo si cambian. **`is-highlight-instant` solo en la primera colocación** (#308): cuando el puntero entra desde fuera con la lista ya abierta y con el foco en otro elemento (p. ej. el primero, abierta por teclado o por clic), el resaltado **viaja desde el elemento que tenía el foco hasta el del puntero**: es el comportamiento buscado (una sola luz que viaja, y el foco **sí** estaba allí); no hay una segunda «primera colocación» por entrar el puntero.
- El **anillo de foco** de cada elemento no cambia. En **`forced-colors`**, el resaltado se oculta y manda el estilo de foco del sistema (como hoy).
- Movimiento: `--g-duration-press`, `--g-ease-out` para posición y alto; fundido `--g-duration-fast`. Nunca `--g-ease-spring` ni `--g-ease-bounce` (#299).
- **`GMenu` no cambia con «una sola luz» de `GSidebar` y `GTable`** (#957 a #963, `api.md` «Una sola luz»): allí la luz sigue al **puntero** y el puntero no mueve el foco, porque esas listas viven en la secuencia de Tab de la página; aquí la lista es un compuesto que ya tiene el foco dentro mientras está abierto, así que la luz sigue al **foco** y el puntero mueve el foco, como hasta ahora. Comparten el movimiento (mismos tokens, sin muelle) y la utilidad de geometría solo si bruno hace que `createHighlight` delegue en `placeHighlight` de `utils/glide.js` **sin cambiar** los datos de `GMenu` (`--_active-y`, `--_active-h`, `has-highlight`, `is-highlight-instant`) y con `GMenu.test.js` y `tests/personalidad-menu*.spec.mjs` en verde **sin tocarlos** (#962); si no, conviven. Una prueba de que `GMenu` no cambia va con el lote.
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

## Elementos-enlace (r02; #571 a #579)

**Origen:** hallazgo 12 (P2) de la integración real en NisaNabani: un menú de cuenta resolvía sus destinos en `select` con `window.location`, sin pestaña nueva, sin copiar el enlace, sin URL a la vista y con la guarda de modificadores repetida en cada aplicación. **Ronda:** `design/lab/menu/r02/` (kiwi; `declaracion.md` puntos 1 a 14 y hallazgos L1 a L12; `verificar.mjs` 160/160 en los tres motores). **Forma elegida por el usuario: B + C** (#571): el enlace llano de la base, **más el pie de destino** en las listas con algo que sale de la aplicación, **más varias pestañas** (Ctrl/⌘ y clic central sin cerrar, con huella «Abierta», vista previa del modificador y Ctrl/⌘+C para copiar). Ninguna prop de modo: B aparece sola donde hace falta y C es comportamiento.

**Frontera (sin cambios):** `GMenu` sigue siendo un **botón de menú de acciones** (`role="menu"`) que puede llevar **algunos destinos** (menú de cuenta, «Abrir ficha», «Ver documentación»), como el ejemplo «Navigation Menu Button» de APG. La navegación del sitio sigue en `GSidebar`; los hermanos de un nivel, en las puertas de `GBreadcrumbs`. Comparte con ellos los nombres de campo, la regla de `navigate` y el trato del enlace deshabilitado.

### Campos (L1, L6; #572)

| Campo | Tipo | Regla |
| --- | --- | --- |
| `href` | String | Con valor, el elemento se pinta como `<a class="g-menu__item" role="menuitem" href>`. **Cadena vacía o solo espacios = ausente** (como `tag.md`). Grana no sanea la URL (como `GTag`, `GCard` y `GSidebar`): un `javascript:` es responsabilidad de la aplicación |
| `target` | String | Atributo del `<a>`. Sin valor (o vacío), la misma pestaña. **«Otra pestaña»** = `_blank` o un nombre de ventana (que no empieza por `_`); `_self` = la misma; `_parent` y `_top` no son otra pestaña (no llevan marca ni texto), pero **tampoco emiten `navigate`** (#574) |
| `rel` | String | Atributo del `<a>` tal cual. **Grana no añade nada** (con `_blank` los navegadores ya aplican `noopener`) |
| `external` | Boolean | El destino es **otro sitio**. Explícito: Grana **no compara orígenes** (sin `location` en el render, sin desajuste en SSR) |
| `current` | Boolean | Página actual: `aria-current="page"` (#576) |
| `lang` | String | Idioma de la **etiqueta** (BCP 47): atributo `lang` en el elemento (`<a>` o `<button>`), para que el lector pronuncie «English» o «Deutsch» en su idioma (WCAG 3.1.2). Vale en **cualquier** `item`, enlace o no; con `dir="auto"` en su texto (#282). Un valor que `Intl.getCanonicalLocales` rechaza se ignora y avisa (aviso E8). #743, M-L3 del inventario de marketing |
| `hreflang` | String | Idioma del **destino** (BCP 47): atributo `hreflang` del `<a>`. Solo con `href` (sin él, aviso E2). Selector de idioma: cada idioma es una página (`href`), con `lang` **y** `hreflang` (#743) |

- **Dónde vale:** solo en `type: 'item'` **sin** `items` (no padre de submenú). En `checkbox`, `radio`, `group`, `separator` o un padre de submenú, `href` **se ignora** y avisa (aviso E1): un padre que también navega sería un botón dividido, fuera de alcance.
- `target`, `rel`, `external`, `current` y `hreflang` **sin `href` válido** se ignoran y avisan (aviso E2). `lang` vale también sin `href` (#743).
- `id` sigue **obligatorio** (clave, carga del evento y pruebas), como en cualquier `item`. `icon`, `shortcut`, `keyshortcuts`, `danger` y `disabled` funcionan igual que en un `<button>`; los slots `icon` e `item` pintan **dentro** del `<a>`.
- **Reservados** (L11): `download`, `referrerpolicy` (sin caso en la integración; `hreflang` sale de la reserva por #743, con `lang`) y abrir el menú con el foco en la página actual (el foco sigue empezando en el primero, APG).
- **Sin slot `link` ni `RouterLink` dentro del menú** (L10): el router entra por `navigate`. Por eso **no aplica la excepción #523**; un slot `link` queda reservado y, si llega, la citará.

### Anatomía y ARIA

```html
<li role="none">
  <a class="g-menu__item" role="menuitem" href="https://example.org/docs" target="_blank" tabindex="-1" id="ID-i-4">
    <span class="g-menu__icon" aria-hidden="true">…</span>
    <span class="g-menu__label">Documentación</span>
    <span class="g-menu__sr">, otro sitio, abre en una pestaña nueva</span>
    <span class="g-menu__trace" aria-hidden="true"></span>
    <span class="g-menu__leave" aria-hidden="true"><!-- GLibIcon external-link --></span>
  </a>
</li>
<li role="none"><a class="g-menu__item" role="menuitem" href="/perfil" aria-current="page" tabindex="0">…Mi perfil</a></li>
<li role="none"><a class="g-menu__item" role="menuitem" aria-disabled="true" tabindex="-1">…Facturación</a></li>
<!-- B: pie de destino, último hijo de la lista -->
<li class="g-menu__dest is-empty" role="none" aria-hidden="true">
  <span class="g-menu__dest-icon"></span><span class="g-menu__dest-host" dir="ltr"></span><span class="g-menu__dest-path" dir="ltr"></span><span class="g-menu__dest-tag"></span>
</li>
```

- **Orden de las partes del `<a>`:** icono, etiqueta, texto oculto, atajo (si hay), huella, marca. `g-menu__trace` y `g-menu__leave` comparten la columna final con `g-menu__shortcut` (la disposición es de coco).
- **Texto oculto (L8):** `g-menu__sr` va **dentro** del enlace (forma parte del nombre accesible), con el patrón de texto oculto accesible. Contiene `labels.external` (si `external`) seguido de `labels.newTab` (si `target` de otra pestaña), **tal cual, sin puntuación añadida por Grana** (la separación depende del idioma; la receta del README usa `', otro sitio'` y `', abre en una pestaña nueva'`). Se prefiere al `aria-describedby`, que los lectores no siempre leen en un `menuitem`. Chromium une las piezas con un espacio («Documentación , otro sitio»): es una pausa, no un error (como `g-sidebar__sr`).
- **Enlace deshabilitado:** `<a role="menuitem" aria-disabled="true">` **sin `href`, `target` ni `rel`** (no se abre en otra pestaña, no se copia, el clic central y el menú contextual no ofrecen el enlace). **Sigue enfocable** con flechas (regla de `GMenu`, distinta de `GSidebar`: dentro de un compuesto los deshabilitados se descubren). Lleva su texto oculto y su marca si los tendría habilitado. Intro y Espacio no hacen nada y el menú sigue abierto; el puntero no se posa (M1).
- **Búsqueda por letra:** solo sobre `g-menu__label`, nunca sobre el texto oculto ni la huella.

### Activación: `navigate`, no `select` (#573, #574)

- Un enlace **emite `navigate` `{ id, item, event }`** y **nunca `select`**: un gesto, una intención. `select` queda para acciones, casillas y opciones.
- **Guarda común** (`api.md` «Enlaces y `navigate`», #505 con la enmienda #574): se emite **solo** con clic primario (`button === 0`) sin Ctrl, ⌘, Mayús ni Alt, con `event.defaultPrevented` falso y con el `target` del `<a>` vacío o `_self`; o con Intro o Espacio sin modificadores. Con `target` de otro contexto **no se emite** (como `RouterLink`): un destino en otra pestaña no pasa por el router, y el manejador típico `event.preventDefault(); router.push(item.href)` rompería la pestaña nueva. La guarda lee el atributo `target` del propio `<a>`; un `<base target>` del documento no se tiene en cuenta (límite).
- **`event.preventDefault()`** (síncrono) en `navigate` deja la navegación al router y **no impide el cierre** (diferencia con `select`, donde impide el cierre). Si la aplicación quiere el menú abierto, `closeOnSelect="never"`.
- **`closeOnSelect`:** un enlace cuenta como **acción** (`auto` y `always` cierran; `never` no).
- **Orden:** se emite `navigate` y después se cierra y se devuelve el foco al disparador. Si la ruta nueva desmonta el disparador, el foco es de la gestión de rutas de la aplicación (README).

### Teclado (foco en un enlace)

| Tecla | Qué hace | Origen |
| --- | --- | --- |
| Intro | **`GMenu` no la cancela**: la activación nativa del `<a>` produce el `click` que pasa por la guarda → `navigate`, cierre, foco al disparador | HTML |
| **Espacio** (L9) | El `<a>` no se activa con Espacio y desplazaría la página: **`GMenu` lo cancela** y, sin modificadores y habilitado, llama a `el.click()` (clic sintético: botón 0, sin modificadores, pasa por la guarda). Todo elemento del menú responde igual a Espacio | APG (coherencia con los `<button>`) |
| Ctrl/⌘+Intro | Lo del navegador (pestaña en segundo plano); sin `navigate`; **el menú sigue abierto con la huella «Abierta»** (C, como Ctrl/⌘+clic) | HTML, #505, #577 |
| Mayús+Intro | Ventana nueva del navegador; sin `navigate`; cierra y devuelve el foco al disparador | HTML |
| Espacio con modificadores | Se cancela y no hace nada (sin equivalente en el navegador) | — |
| Ctrl/⌘+C | Copia la URL absoluta (C, §«Varias pestañas») | #577 |
| Tecla de menú contextual, Mayús+F10 | Menú contextual **de enlace** del navegador; `GMenu` no lo intercepta y sigue abierto | Navegador |
| ↑ ↓ Inicio Fin, letra, Esc, Tab, → ← | Sin cambios | §«Teclado» |

### Puntero y toque

| Gesto | Navegador | `navigate` | Menú |
| --- | --- | --- | --- |
| Clic primario sin modificadores | Sigue el `href` (o el router lo cancela) | **Sí** (sin `target` de otro contexto) | Cierra, foco al disparador |
| Ctrl/⌘+clic | Pestaña en segundo plano | No | **Sigue abierto** con huella «Abierta» (C) |
| Clic central (`auxclick`, `button === 1`) | Pestaña en segundo plano | No | **Sigue abierto** con huella «Abierta» (C) |
| Mayús+clic | Ventana nueva (toma el foco) | No | Cierra, foco al disparador |
| Alt+clic | Descarga (algunos navegadores) | No | Cierra, foco al disparador |
| Clic primario con `target` de otro contexto | Abre en ese contexto | No | Cierra, foco al disparador |
| Clic derecho (o Ctrl+clic en macOS) | Menú contextual de enlace | No | Sigue abierto |
| Toque | Como clic primario | Sí | Cierra |
| Toque largo | Vista previa o menú de enlace del sistema | No | Sigue abierto |
| Arrastrar | El enlace se suelta en la barra de pestañas | No | Sin cambios |
| Puntero encima (M1) | — | No | Mueve el foco como en cualquier elemento; no se posa en un deshabilitado |

- **`GMenu` no cancela** `pointerdown`, `mousedown`, `dragstart` ni `contextmenu` sobre un enlace (rompería arrastrar, el clic central y el menú contextual). En el `click` solo cancela el de un deshabilitado (que, sin `href`, no navega de todos modos).
- **Móvil:** coco **no** anula `-webkit-touch-callout` ni `-webkit-user-drag` en `a.g-menu__item` (L7).

### Marca «sale de aquí» y textos (#575)

- Se pinta `g-menu__leave` (icono **`external-link`** de Lucide, decorativo, del `GLibIcon` interno) si el enlace tiene `external` **o** `target` de otra pestaña. **Una sola marca para los dos casos** (L4): lo que el usuario necesita distinguir en un menú no es «enlace o acción» ni «otra pestaña u otro sitio», sino **«me saca de aquí o no»**; el matiz lo dan el texto oculto y el pie (B). Sin subrayado: en un menú todo es activable.
- **`external-link` no está en la lista de la librería:** entra con este contrato (`icons.md` §4, v0.10). **Bruno** lo añade a la lista `library` de `packages/vue/scripts/icons.json` con su nombre canónico (`external-link`: módulo `dist/esm/icons/external-link.mjs`, marca `lucide-external-link`, comprobado por lima en `lucide-static` 1.49.0), regenera `src/icons/lucide.js` y deja `node packages/vue/scripts/check-icons.mjs` en verde **antes** de usarlo; también a `lab` si un prototipo lo necesita.
- Color de la marca: `--g-color-text-muted` (kiwi midió ≥ 3:1 en el tema por defecto); en un elemento `danger`, coco decide si sigue al color del elemento.

### Textos (`labels`, L3)

Sin valores por defecto (#226): todo lo pone la aplicación. Cadenas; las que llevan `{label}` admiten también una función `({ label, item }) => string` (como `tag.md`).

| Clave | Para qué | Cuándo hace falta | Sin ella |
| --- | --- | --- | --- |
| `external` | Texto oculto de un enlace con `external` («, otro sitio») | Algún enlace con `external` | Sin texto oculto; aviso E4 |
| `newTab` | Texto oculto de un enlace con `target` de otra pestaña («, abre en una pestaña nueva»; WCAG 3.2.5, G201) | Algún enlace con `target` de otra pestaña | Sin texto oculto; aviso E4 |
| `destExternal` | Etiqueta visible del pie (B) para otro sitio («Otro sitio») | Hay pie | Sin etiqueta en el pie; aviso E5 |
| `destNewTab` | Etiqueta visible del pie (B) para otra pestaña («Pestaña nueva»); gana a `destExternal` si se dan los dos | Hay pie con un enlace a otra pestaña | Sin etiqueta en el pie; aviso E5 |
| `opened` | Huella visible tras abrir en segundo plano («Abierta») | Algún enlace habilitado | **Ctrl/⌘+clic, central y Ctrl/⌘+Intro cierran** (como A); aviso E6 |
| `openedLive` | Anuncio cortés («{label} abierta en otra pestaña») | Igual | Igual que sin `opened` (van juntas) |
| `copied` | Huella visible tras copiar («Enlace copiado») | Algún enlace habilitado | **Ctrl/⌘+C no se intercepta**; aviso E6 |
| `copiedLive` | Anuncio cortés («Enlace de {label} copiado») | Igual | Igual que sin `copied` (van juntas) |

**Regla de C sin textos:** el gesto de C solo se activa si la aplicación da **sus dos textos** (visible y anuncio): un menú que se queda abierto sin decir por qué, o que copia sin confirmarlo, es peor que el comportamiento nativo.

### Página actual y rama (#576, L5)

- `current: true` → `aria-current="page"` en el `<a>`. **Como mucho uno por menú** (en todo el árbol, en orden de documento): si hay más, se marca el primero y avisa (aviso E3).
- Se ve con una **barra al inicio lógico** en `--g-color-accent-text` (la idea de la barra activa de `GSidebar`, #228; kiwi midió ≥ 3:1) **y peso** `--g-text-action-weight`: nunca solo color (1.4.1). En `forced-colors`, la barra en `CanvasText`. **Sin tokens nuevos.**
- Sigue siendo un enlace activable (copiar, pestaña nueva, recargar): qué hace la aplicación al «navegar» a la página actual es suyo.
- **Rama:** el padre de un submenú que contiene la página actual (a cualquier profundidad) lleva la clase **`is-branch`** (mismo nombre que en `GSidebar`) y peso, **sin** `aria-current`.
- No cambia dónde se abre el menú ni dónde empieza el foco (APG); el resaltado M1 sigue al foco.

### B · Pie de destino (#578)

- **Cuándo existe:** en **cada lista** (la raíz y cada submenú, como el resaltado de M1) que contiene **directamente** al menos un enlace que sale de la aplicación (`external` o `target` de otra pestaña, deshabilitados incluidos). Una lista solo con enlaces internos y acciones **no** lo lleva. Sin prop.
- **Qué es:** `li.g-menu__dest` `role="none"` `aria-hidden="true"`, **último hijo** de la lista, pegado abajo (`position: sticky`, de coco) sobre `--g-color-surface-sunken`. Fuera del árbol accesible: el lector ya oye «otro sitio, abre en una pestaña nueva» en el nombre.
- **Qué dice:** el destino del **activo de esa lista** (el mismo de M1, puntero o teclado):
  - URL `http(s)` de **otro origen**: `__dest-host` = `URL.host` (sin protocolo ni credenciales; los dominios internacionales salen en **punycode**, `xn--…`, a propósito: es lo que protege de la suplantación) y `__dest-path` = ruta + búsqueda sin la barra final (atenuada);
  - URL del **mismo origen**: `__dest-host` vacío y `__dest-path` = ruta (o el `#hash` si la ruta es la misma);
  - otro esquema (`mailto:`, `tel:`…): `__dest-path` con el `href` tal cual;
  - `__dest-tag` = `labels.destNewTab` si va a otra pestaña, si no `labels.destExternal` si `external`, si no vacío;
  - `__dest-icon` = `external-link` si sale de la aplicación; vacío si no.
  - Se resuelve con `new URL(href, document.baseURI)` **solo en el cliente** y al cambiar el activo (nada en el render del servidor).
- **Callado:** con una acción, una casilla, un padre de submenú, un deshabilitado o sin activo, el pie lleva **`is-empty`** (texto transparente) **sin cambiar de alto** (kiwi midió 0 px).
- **Dirección:** host y ruta llevan `dir="ltr"` (una URL se lee en LTR también en RTL); la etiqueta sigue la dirección de la lista.
- **Recorte:** la ruta se recorta con elipsis; el host nunca se recorta antes que la ruta (lo que identifica el sitio es el host).
- **Movimiento:** solo fundido del texto (`--g-duration-fast`), que con movimiento reducido se queda. En `forced-colors`, borde superior en `CanvasText`.
- **Por qué:** la barra de estado del navegador, que dice adónde lleva un enlace, **no existe** en una PWA instalada, en pantalla completa ni en muchos móviles, y con el foco de teclado no todos los navegadores la muestran.

### C · Varias pestañas (#577)

1. **Ctrl/⌘+clic, clic central y Ctrl/⌘+Intro** sobre un enlace **habilitado** (con `opened` y `openedLive`): **no cierran**. El navegador abre la pestaña en segundo plano; `GMenu` no emite `navigate`, escribe `labels.opened` en `g-menu__trace` de ese elemento y anuncia `labels.openedLive` por el **canal cortés de página** (`utils/liveRegion.js`, `announcePage`, #533; ninguna región propia). «Ctrl/⌘» = `ctrlKey` **o** `metaKey` (los dos, en todo sistema: en macOS Ctrl+clic es el menú contextual y no llega `click`).
2. **Vista previa del modificador:** mientras Ctrl o ⌘ está pulsado con el menú abierto (`keydown` de `Control`/`Meta` con el foco en la lista, o `pointermove` con `ctrlKey`/`metaKey` sobre ella), **cada lista abierta** lleva **`is-modifier`**: lo que no puede abrirse aparte (acciones, casillas, opciones, padres de submenú y deshabilitados, es decir, todo `g-menu__item` sin `href`) pasa a `--g-color-text-subtle` (kiwi midió ≥ 4.5:1). Se quita en `keyup` de la tecla, en `pointermove` sin modificador, en `blur` de la ventana (un ⌘+Tab pierde el `keyup`) y al cerrar. El icono no cambia de forma (1.4.1: el pie y la huella dicen el resto).
3. **Ctrl/⌘+C** (sin Mayús ni Alt) con el foco en un enlace **habilitado** (con `copied` y `copiedLive`) y **sin texto seleccionado** en el documento: `GMenu` cancela la tecla y llama a `navigator.clipboard.writeText` con la URL **absoluta** (`new URL(href, document.baseURI).href`). **Al resolverse**, escribe `labels.copied` en la huella y anuncia `labels.copiedLive`. Si `navigator.clipboard` no existe (contexto no seguro) **no cancela** la tecla y no hace nada; si la promesa se rechaza (permisos), sin huella ni anuncio y un aviso de desarrollo (E7). Sin controles anidados en el elemento (prohibidos en `menuitem`). Ningún evento nuevo.
4. **Huellas:** una por elemento (la última gana: «Enlace copiado» sustituye a «Abierta»); se borran todas al cerrar el menú. `aria-hidden` (el anuncio ya lo dijo). Movimiento: fundido; con `reduce`, aparece.
5. **Lo que no cambia:** Mayús+clic, Alt+clic y la activación sin modificadores cierran como en A; `closeOnSelect` no afecta a estos gestos (ninguno es una selección).

### Avisos de desarrollo (nuevos)

Una vez por menú, con la guarda canónica de #653 (`try { if (process.env.NODE_ENV !== 'production' …) … } catch {}`, `api.md` «Avisos de desarrollo»).

| # | Cuándo | Qué hace el componente |
| --- | --- | --- |
| E1 | `href` en `checkbox`, `radio`, `group`, `separator` o un padre de submenú | Lo ignora (sigue siendo lo que era) |
| E2 | `target`, `rel`, `external` o `current` sin `href` válido | Los ignora |
| E3 | Más de un `current` | Marca el primero |
| E4 | Falta `labels.external` o `labels.newTab` y algún enlace lo necesita | Sin texto oculto (la marca sigue) |
| E5 | Hay pie y falta `labels.destExternal` o `labels.destNewTab` necesario | Pie sin etiqueta (host y ruta siguen) |
| E6 | Hay enlaces habilitados y falta alguno de `opened`/`openedLive` o `copied`/`copiedLive` | Ese gesto de C cae al comportamiento nativo (cierra / no copia) |
| E7 | `navigator.clipboard.writeText` se rechaza | Sin huella ni anuncio |
| E8 | `lang` o `hreflang` que `Intl.getCanonicalLocales` rechaza (#743) | Lo ignora (sin atributo) |

### Clases nuevas (para coco, L7)

- `a.g-menu__item`: **mismo aspecto** que el `<button>` (sin subrayado; color heredado también en `:visited`, `:hover` y `:active`; sin `text-decoration` en ningún estado), mismo resaltado M1 y mismo foco.
- `[aria-current="page"]`: barra al inicio lógico (`accent-text`) y peso; `is-branch`: peso.
- `g-menu__leave` (`text-muted`), `g-menu__sr` (patrón de texto oculto), `g-menu__trace` (columna final, `text-muted`), `g-menu__dest` y partes (`text` para el host, `text-muted` para la ruta y la etiqueta, ≥ 12 px, contraste ≥ 4.5:1 sobre `surface-sunken`), `is-empty`, `is-modifier`.
- Tokens: los de §«Tokens consumidos» más `--g-color-accent-text` y `--g-text-action-weight`. **Sin tokens nuevos.**

### Peso (#579, #636, L12)

`GMenu` **sigue en el paquete principal**: es una extensión de un componente existente, no un componente nuevo (#550 abre la valoración para componentes **nuevos**), y `GCard`, `GWidget` y `GTranscript` lo usan por dentro; sacarlo a una entrada propia rompería la importación de quien ya lo usa. **Compuerta:** bruno mide el crecimiento del `grana.js` gzip (KiB, #550) de toda la extensión (base, B y C) frente al `main` anterior y lo registra en `CHANGELOG.md`; **con más de 2 KiB vuelve a lima antes del commit** (opciones a valorar entonces: cargar el motor de C y del pie bajo demanda en el primer enlace, o recortar). Nada nuevo en el nivel superior del módulo (#444).

**Enmienda #636 (tope de 2,5 KiB).** bruno midió +2 275 a +2 343 B sobre 196 336 B (±60 B de ruido) tras recortar avisos E1 a E7, unificar el clic central con el clic y compactar el pie. **El tope de la extensión pasa a ≤ 2560 B** de crecimiento del `grana.js` gzip (base, B, C, `utils/link.js` e iconos `external-link` y `arrow-right`), medido y registrado en `CHANGELOG.md` con la base, el rango de varias compilaciones y el tramo de `GMenu` comprimido aparte. Todo sigue en el principal y sin carga diferida. **Con más de 2560 B vuelve a lima y el tope no se sube otra vez:** el paso siguiente es cargar el motor de C y el del pie bajo demanda en el primer enlace que los necesite.

**Avisos E1 a E7 y la regla de #636.** Los textos de los avisos no se quitan. Cuando bruno aplique la regla de avisos de `api.md` («Avisos de desarrollo»), cada llamada a `warnOnce` de `GMenu` y de `utils/link.js` (y el recorrido `scan` que solo sirve a E3 a E6) queda **dentro** de la guarda en línea, no solo el ayudante, para que el empaquetador de la aplicación los elimine en producción. Esa tarea no bloquea el commit de la extensión; al hacerla, bruno registra también cuánto pesa el tramo de `GMenu` en un paquete de producción de la aplicación (cifra informativa, sin compuerta).

### Pruebas (bruno)

Vitest (`GMenu.test.js`, jsdom) y Playwright en los tres motores (`tests/menu-links.spec.mjs` y `tests/personalidad-menu-links.spec.mjs`, trasladando `design/lab/menu/r02/verificar.mjs`):

1. **Anatomía:** `<a role="menuitem" href>` solo en `item` sin hijos; `href` vacío o con espacios = `<button>`; `checkbox`/`radio`/padre con `href` siguen siendo lo que eran (E1); deshabilitado sin `href`/`target`/`rel`, con `aria-disabled` y alcanzable con flechas; un solo `aria-current` (E3); `is-branch` en el padre a dos niveles; `target`/`rel` tal cual, sin `rel` añadido.
2. **Nombre accesible** con el texto oculto (árbol de accesibilidad de Playwright); la letra busca solo en la etiqueta.
3. **`navigate`:** clic primario, Intro y Espacio emiten `{ id, item, event }` y **no** `select`; Ctrl, ⌘, Mayús, Alt, botón central, clic derecho y `target` `_blank`, nombre, `_parent` y `_top` **no** emiten; `_self` y vacío sí; `preventDefault()` deja la URL intacta y **cierra igual**; sin `preventDefault`, el navegador sigue el `href`; `closeOnSelect` `never` deja abierto; foco al disparador tras cerrar.
4. **Espacio** no desplaza la página y activa; con modificadores, nada; Intro no se cancela (Ctrl/⌘+Intro abre en segundo plano en Chromium).
5. **Deshabilitado:** Intro, Espacio y clic no hacen nada ni cierran; el puntero no se posa.
6. **M1** con enlaces mezclados; clic derecho con el menú abierto; ningún `preventDefault` en `pointerdown`/`dragstart` de un enlace.
7. **B:** pie solo en la lista que sale (y en un submenú que sale, no en su padre si este no sale); `aria-hidden`; contenido por caso (interno, externo en pestaña nueva, externo en la misma, `mailto:`, acción callada, deshabilitado callado); punycode; sigue al teclado y al puntero; alto constante; pegado abajo con scroll; RTL con la URL en LTR; SSR sin `document`.
8. **C:** Ctrl/⌘+clic, central y Ctrl/⌘+Intro dejan abierto con huella y **un** anuncio en el canal de página; sin `opened`/`openedLive`, cierran (E6); `is-modifier` con Ctrl/⌘ y fuera con `keyup`, `blur` y cierre; Ctrl/⌘+C copia la URL absoluta (permiso de portapapeles en Chromium; en Firefox y WebKit, `navigator.clipboard` simulado) con huella y anuncio solo al resolverse; con texto seleccionado no se intercepta; sin `copied`, no se intercepta; huellas borradas al cerrar.
9. **Avisos** E1 a E7, una vez cada uno.
10. **`meta.json`** (#443): `labels` con sus ocho claves, `navigate` con su carga, y los campos nuevos de `items` en la forma del elemento (`packages/vue/types/`, `overrides.mjs` o `shared.d.ts`); `src/types.test.js` en verde.
11. **Peso:** la medida de §«Peso».

### No verificado (de la ronda)

Lectores reales (cómo leen VoiceOver y NVDA un `<a role="menuitem">` con `aria-current` y si VoiceOver ofrece sus acciones de enlace sobre un `menuitem`); toque largo real en iOS y Android dentro de un `popover`; que Firefox y WebKit **abran** la pestaña con un clic modificado sintético (solo Chromium en headless); la escritura real del portapapeles; Safari con ⌘+Intro. Van a los guiones de entorno real (Fase D).

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

## Resolución de hallazgos de r02 (elementos-enlace)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | Contrato del enlace | `href`, `target`, `rel`, `external`, `current`; `navigate` `{ id, item, event }`; sin `select`; `preventDefault` no impide el cierre; `closeOnSelect` lo trata como acción | #572, #573 |
| L2 | `target` en la regla común | Enmienda de #505: sin `navigate` con `target` distinto de vacío o `_self` (`GMenu`, `GTag`, `GCard`) | #574 |
| L3 | Textos | `labels` con `external`, `newTab`, `destExternal`, `destNewTab`, `opened`, `openedLive`, `copied`, `copiedLive`; C solo con sus dos textos | #575, #577 |
| L4 | Glifo | Una sola marca `external-link` (entra en la lista de la librería, `icons.md` v0.10; bruno la añade) | #575 |
| L5 | Página actual | `aria-current="page"`, como mucho uno; barra `accent-text` + peso; `is-branch` | #576 |
| L6 | Combinaciones ignoradas | Avisos E1 y E2; vacío = ausente | #572 |
| L7 | CSS | §«Clases nuevas»; sin anular `-webkit-touch-callout` ni `-webkit-user-drag` | — (coco) |
| L8 | Nombre con texto oculto | `g-menu__sr` dentro del `<a>`, sin puntuación añadida | #575 |
| L9 | Espacio | `GMenu` lo cancela y llama a `el.click()` sin modificadores | #573 |
| L10 | Sin slot `link` | Reservado; #523 no aplica | #572 |
| L11 | Reservados | `download`, `hreflang`, `referrerpolicy`; foco inicial en la página actual | #572 |
| L12 | Peso | Sigue en el principal; compuerta de 2,5 KiB gzip para toda la extensión (era 2 KiB); avisos con la guarda en línea | #579, #636 |

## Buscar al escribir (#797; decisión del usuario del 2026-10-21, cambia la v1)

`GMenu` adopta la regla común de `api.md` «Letras en listas de comandos» → «Buscar al escribir en todos los menús»: con los cuatro textos **`labels.findHint`**, **`labels.matches`** (`{count}`), **`labels.matchesOne`** y **`labels.none`**, escribir **filtra** la lista (sin campo, la semántica sigue siendo `menu`); sin ellos, **salta por letra como hoy** (500 ms) y sin aviso. Primera fila `li.g-menu__find` (`aria-hidden`) con la pista y, al escribir, lo escrito y el recuento; anuncio por el canal cortés de página (#533). Foco al primer visible que empieza por lo escrito, cíclico con la misma letra, deshabilitados incluidos (con su motivo como descripción buscable), cada submenú con su propio texto, Esc limpia y la siguiente cierra. Elementos-enlace: se filtran igual (su `label`). El motor es `utils/menuNav.js`, el mismo que `GFab`. Clases nuevas: `g-menu__find` (+ `is-empty-result` sin coincidencias), `g-menu__find-query` (lo escrito) y `g-menu__find-count` (el recuento o `labels.none`), los nombres de `GFab` (#798); `is-filtering` (lista) y `hidden` en los que no coinciden. Tokens: los existentes (`--g-text-body-sm-*`, `--g-color-text-muted`). Peso en el lote propio de #797 (≤ +1 KiB gzip de `grana.js`). Pruebas: `GMenu.test.js` (sin textos, el salto de hoy sin cambios en sus aserciones; con textos, las seis condiciones, el ciclo, deshabilitados y submenús) y `tests/menu.spec.mjs` en los tres motores.

## Motivo y confirmación en el sitio (#790; enmienda para `GResourceList`, cambia la v1)

La pide el primer block de `@grana/blocks` (`design/contracts/resource-list.md` «Permisos» y «Acciones de la fila»; L5 de `design/lab/resource-list/r01/declaracion.md` §13): permisos por fila con motivo legible (regla 1 de «Acciones con acuse», #643) y la baja de una fila confirmada **sin mover la tabla**. Trae a `GMenu` lo que `GFab` ya tiene (#662, #663), con una diferencia deliberada: aquí la confirmación es **opcional** (opt-in con `confirm`), para no cambiar el comportamiento de los menús que ya existen.

### Motivo de no disponible

- `disabled: String` → `aria-disabled="true"` (sigue enfocable, como hoy) y una **segunda línea visible** `g-menu__reason` con el motivo, **último hijo del elemento** (la fila se parte con `flex-wrap`, #798), referida por `aria-describedby` del elemento (ids únicos). `disabled: true` sigue como hoy (sin línea). Cadena vacía o solo espacios = `true`.
- Vale en `item`, `checkbox`, `radio` y en un padre de submenú (no abre). No cambia el nombre accesible (la `label`).
- Texto `--g-text-body-sm-*` en `--g-color-text-muted` (≥ 4,5:1 sobre `surface` y sobre el elemento activo `surface-sunken`); la etiqueta conserva su tachado de deshabilitado, el motivo **no** se tacha.

### Confirmación en el sitio (patrón de `GFab`, `fab.md` «Peligrosas», #662)

1. Activar un elemento `danger` con `confirm` **no emite `select`**: **arma** su fila, que se parte en «Cancelar» (`labels.cancel`) **con el foco y bajo el punto de la pulsación** (con teclado, al inicio lógico) y la confirmación (`confirmLabel` o la `label`, relleno `--g-color-danger` + `--g-color-on-danger`, borde `--g-color-danger-text` por §7.1) al lado, dentro de un `div role="group"` cuyo **nombre es la pregunta** (`confirm`). Los dos son `menuitem` del foco itinerante (↑ ↓ y ← → los recorren; el `li` de la fila lleva `is-armed`).
2. **Se deshace sin temporizador** (2.2.1): «Cancelar», Esc (desarma; **no** cierra el menú: un nivel por gesto, #565), o el foco que sale del par (flechas, puntero, Tab). La fila vuelve con el foco en ella.
3. **Un doble clic nunca ejecuta** (#661): el segundo clic de la ráfaga se ignora y, si cae, cae en «Cancelar». Con teclado: Intro en el elemento, → (o ↓) a la confirmación, Intro: se ejecuta **una vez**.
4. **Confirmar emite `select`** del elemento (misma carga de siempre; `item` es el elemento peligroso) y sigue `closeOnSelect` (una acción cierra y devuelve el foco al disparador).
5. **Nada se mueve:** el ancho de la lista no cambia al armar (el `.vue` escribe en el `li` armado **`--_armed-w`**, px, el ancho de la fila al armar, y lo retira al desarmar o confirmar; el CSS lo aplica como `min-inline-size`; como `GFab`, #677). La lista **no** cambia de alto: el par ocupa la fila.
6. **Sin `labels.cancel`** con algún elemento que confirma, esos elementos quedan `aria-disabled` (fallo seguro: nada destructivo sin poder cancelar) y aviso **E8** (`[Grana] <GMenu>`, una vez). `confirm` sin `danger`: se ignora y aviso **E9**.
7. **Sin ticket** en `select` (el acuse de #663 es del FAB; en un menú de fila lo da la aplicación con `GToast`). Reservado: `select` con ticket en `GMenu`, si un caso lo pide.
8. **Movimiento:** ninguno propio (el par aparece en el sitio); con movimiento reducido, igual. Reutiliza el motor de menú compartido (`utils/menuNav.js`, #657) para el foco del par; la lógica de armado puede compartirse con `GFab` por `utils/` si bruno lo ve (sin cambiar `GFab`).

### Clases nuevas (para coco)

`g-menu__reason` (motivo); `is-armed` (el `li` armado); `g-menu__confirm` (`role="group"`), `g-menu__confirm-cancel` y `g-menu__confirm-ok` (los dos `menuitem`). Tokens: los de §«Tokens consumidos» más `--g-color-danger`, `--g-color-on-danger` y `--g-text-body-sm-*`. **Sin tokens nuevos.**

### Peso y pruebas

Sigue en el principal (ampliación de un componente existente, #550). Cuenta en el **lote de #793** junto con las enmiendas de `GTable` (≤ +1,5 KiB gzip de `grana.js`; `resource-list.md` «Enmiendas»). `GMenu.test.js`: motivo (`aria-describedby`, enfocable, no se activa), armado y desarmado (Cancelar, Esc sin cerrar, foco que sale), confirmación con teclado y puntero, doble clic, `--_armed-w`, E8 y E9, y que un `danger` sin `confirm` sigue emitiendo `select` al activarse. Playwright en los tres motores dentro de `tests/resource-list.spec.mjs` (la tabla quieta, Δ0) y un caso suelto en `tests/menu.spec.mjs`.

## Límites conocidos

- **Elementos-enlace:** sin botón dividido (un padre de submenú no navega), sin slot `link`, sin `download`; un `<base target>` del documento no cuenta para la guarda de `navigate`.
- **Sin menú contextual**, sin anclaje a un elemento arbitrario y sin barra de menús (*menubar*); **sin elementos con contenido libre o campos**.
- **El componente no fuerza la exclusividad** de las opciones: la aplicación marca `checked`.
- **Submenús:** tres niveles verificados; en pantallas muy angostas se superponen en cascada.
- **Lector de pantalla:** cómo se leen los submenús, los grupos y las opciones está por verificar con lectores reales; Firefox y Safari (`popover`, `:dir()`), por verificar.

## Abierto (no bloquea el paso siguiente)

- Valores estéticos (lista, marcas, sombra, movimiento, chevron espejado en RTL): los decide coco con los tokens listados.

## Contraste de la marca marcada (`tokens.md` §7.1; DECISIONS.md #431 y #432)

La marca de `menuitemcheckbox` y `menuitemradio` con `aria-checked="true"` conserva el relleno `--g-color-primary` y la marca `--g-color-on-primary`, y su **borde pasa a `--g-color-primary-text`** (antes `primary`): con una marca pálida, `primary` como forma da 1,77:1 contra la superficie del menú. Sin cambio en el tema por defecto. Pendiente de **coco** (encargo único en `checkbox.md` §«Contraste de lo marcado»).
