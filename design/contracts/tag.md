# Contrato · GTag + GTagGroup

**Dueño:** lima · **Estado:** aprobado (concepto **A «Huella»** como comportamiento de toda etiqueta quitable dentro de `GTagGroup` y **B «Racimo»** como opción del grupo; **C «Palabra»** reservada con su nombre; **alternar (`aria-pressed`) entra en `GTag`** para filtros de la vista que actúan en el acto: decisiones del usuario del 2026-10-07. El resto deriva de HTML, WAI-ARIA APG (*Button* con `aria-pressed`, *Disclosure*), WCAG 2.2 y los contratos vigentes; **ninguna pregunta de producto abierta**) · **Basado en:** `design/lab/chip/r01/` (kiwi, commit `cf2f928`: `brief.md`, `declaracion.md` con las decisiones 1 a 22 de la base, los conceptos A/B/C y los hallazgos L1 a L12; `tag.js`, `tag.css`, `verificar.mjs` 223/223 en Chromium, Firefox y WebKit, puerto 4213)
**Tags:** `g-tag`, `g-tag-group` · **Categoría:** datos y selección ligera · **Entrada del paquete:** **`@grana/vue/tag`** (global UMD `GranaTag`; **#510**, enmienda de #472: la compuerta de 8 KB gzip del principal se superó, +9,2 KB medidos) · **Avisos:** `[Grana GTag]`, `[Grana GTagGroup]`
**Decisiones:** DECISIONS.md #460 a #473 (integradas el 2026-10-07; cambios en archivos compartidos aplicados, rastro en `design/contracts/tag.pendientes.md`; tokens en `tokens.md` §39) y **#510 a #514** (remates con la construcción de coco y bruno, 2026-10-08: entrada propia, tokens leídos, `disabled` y «Ver N más», avatar con las categorías del grupo, anuncios por último gesto). y **#524 a #528** (remates tras la auditoría de coco, 2026-10-08: alto y tope, los cuatro «Para lima», «Deshacer todas», clave del color en todo grupo, tope en px)
**Componente complejo** (CLAUDE.md, «Modelos por rol»: compone `GAvatar`, `GBtn`, `GIcon` y el motor del tooltip, y se solapa con `GBadge`, `GFilterBar`, `GCheckbox`/`GRadioGroup` chip y `GSummary`): **coco y bruno en Opus**.

Una **etiqueta** es un elemento de un conjunto que **clasifica o resume una elección**: las alergias de un expediente, los filtros aplicados sobre una lista, los temas de un artículo que llevan a su página, el «Solo pendientes» de la cabecera de una tabla. Se **lee**, se **quita**, se **alterna** o se **sigue**. `GTag` es una etiqueta; `GTagGroup`, un conjunto dirigido por datos que añade lo que una etiqueta suelta no puede tener: la huella al quitar, los racimos por faceta, el tope, «Quitar todas» y el foco que nunca se pierde.

---

## Principios

- **Quitar no mueve nada bajo tu mano** (A, #466). Dentro de un grupo, la etiqueta quitada deja su **huella** del mismo ancho con «Deshacer» en el sitio y con el foco; nada se recoloca hasta que puntero y foco salen del grupo. **El modelo cambia en el acto**: la huella es solo visual.
- **La categoría se dice con palabras** (B, #467). Con `layout="facets"`, las etiquetas con la misma faceta forman un racimo con el nombre de la faceta una vez y un lomo de color; el color agrupa, el nombre informa.
- **El color nunca va solo** (WCAG 1.4.1). El texto dice qué es la etiqueta; el estado pulsado lleva la marca `check`; el color de categoría es un complemento.
- **Neutro o categoría, nunca semántico** (#461, #469). Una etiqueta roja diría «peligro»: el estado y la cantidad de otra cosa son `GBadge`.
- **Sin widget compuesto** (#465). Cada control es una parada de Tab nativa; sin *roving tabindex* ni flechas.
- **No es un campo** (#461, L10). No se envía, no tiene `name` ni se registra en `GForm`.
- **Sin textos propios** (#226, #468): todo texto visible o accesible sale de `labels`.
- **Iconos solo Lucide**, todos ya en la lista de la librería (`x`, `check`, `undo-2`; #471).

## Frontera con otros componentes (#461)

| Necesidad | Usar | No usar |
| --- | --- | --- |
| Estado o cantidad de **otra cosa** que no se toca («Pagado», «3», «En línea») | `GBadge` (#59; colores semánticos) | `GTag` con color semántico |
| Un elemento de un conjunto que clasifica o resume una elección (alergias, temas, áreas) | **`GTag` en un `GTagGroup`** (estática, enlace, alternar o quitable; mismo aspecto en lectura y en edición) | `GBadge` (no se quita ni se alterna) |
| Un filtro de la **vista** que actúa en el acto («Solo pendientes», facetas de una tabla) | **`GTag` de alternar** (`aria-pressed`) | Una casilla con etiqueta, ayuda y registro en `GForm` que aquí sobran |
| Una elección que **se envía con el formulario** (tiene `name`, error, `GForm`) | `GCheckboxGroup layout="chip"` · `GRadioGroup appearance="chip"` | `GTag` de alternar (no se envía) |
| Filtros con regla y valor (editor) | `GFilterBar` (sus chips aplicados son internos; adopción de `GTag` reservada, #473) | `GTagGroup` con un editor a mano |
| Elegir varios de un catálogo | `GCombobox multiple` («la frase», sin fichas, #417) | `GTagGroup` + un buscador a mano |
| Escribir etiquetas de texto libre | **`GTagInput` (reservado, #338)**, que compondrá `GTagGroup` con la huella | `GInput` + `GTagGroup` a mano (la huella resuelve el «Retroceso que borra la última sin querer») |
| Una pieza con varios datos (título, código, hechos) | `GSummary` | `GTag` (un solo texto corto, más un icono o avatar opcional) |
| Un adjunto | La ficha de `GFileField` (#375) | `GTag` |
| Una acción que no es quitar, alternar ni navegar | `GBtn size="sm"` | `GTag` con `click` |

**Regla de una línea** (para el README): *¿dice el estado o la cantidad de otra cosa y no se toca? → `GBadge`. ¿Es un elemento de un conjunto que clasifica o resume una elección? → `GTag`. ¿Se envía con el formulario? → `GCheckboxGroup`/`GRadioGroup` chip.*

---

## GTag

### Props (#462)

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `label` | String | texto de la etiqueta | — (**obligatoria**) | propia: es el texto visible (salvo slot), la base de los nombres de «Quitar» y la clave del color sin `colorKey` |
| `href` | String | URL | sin valor | propia: con valor, el cuerpo es un enlace |
| `pressed` | Boolean \| `null` | `true` · `false` · `null` | `null` | propia (`v-model:pressed`): `null` = no alterna; `true`/`false` = botón de alternar |
| `removable` | Boolean | | `false` | propia: añade «Quitar» |
| `disabled` | Boolean | | `false` | compartida (`api.md`) |
| `size` | String | `sm` `md` | `md` | compartida, subconjunto (es la **altura**: `sm` = `space × 6`, `md` = `space × 8`) |
| `color` | String \| Number | `'neutral'` o una categoría `1` a `12` | sin valor | compartida con valores propios, **como `GAvatar`** (nunca semántico) |
| `categories` | Number | `0` a `12` | `0` | propia (mismo nombre y valor que la entrada `categories` del tema y que `GAvatar`) |
| `colorKey` | String \| Number | id estable | sin valor | propia (como `GAvatar`) |
| `labels` | Object | `{ remove }` | `{}` | compartida (`labels` sin valores por defecto, #226) |

- **`pressed`** se declara `{ type: Boolean, default: null }` (sin `default`, Vue lo convertiría en `false` y toda etiqueta alternaría). Funciona **con o sin** `v-model:pressed`: sin él, la etiqueta guarda su estado y lo sincroniza cuando cambia la prop.
- **`href` gana a `pressed`**: navegar y cambiar un estado son dos intenciones; con los dos, `pressed` se ignora (aviso 2).
- **`color`:** `'neutral'` = neutro y gana a `categories`; `k` (1 a 12, número o cadena numérica) = categoría fija. Otro valor (incluidos `brand`, `danger` y el resto de semánticos) se ignora (sigue el derivado o el neutro) y avisa (aviso 3). Sin valor: derivado si `categories > 0`, si no, neutro.
- **`categories`:** con `n > 0` y sin `color`, la categoría se deriva de **`colorKey ?? label`** con el hash de `GAvatar` (§«Color»). Fuera de 0..12 o no entero, `0` y aviso 4.
- **`labels.remove`** (`{label}`; cadena o función): nombre de «Quitar». Obligatorio con `removable` (aviso 5).
- Una cadena vacía o solo con espacios en `label`, `href` o `colorKey` **cuenta como ausente**.
- **Sin** `icon`, `avatar`, `variant`, `rounded`, `density`, `value`, `name` ni `to`. El icono o el avatar de una etiqueta escrita en plantilla van en el slot `lead` («plantilla → slot», #202); en un grupo llegan como datos (`item.icon`, `item.avatar`).

### Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `update:pressed` | Boolean | El usuario alterna (clic, Espacio, Intro). No con `disabled` |
| `remove` | `{ event, source: 'button' \| 'key' }` | El usuario pulsa «Quitar» o <kbd>Supr</kbd>/<kbd>Retroceso</kbd> sobre un control de la etiqueta. **Una `GTag` suelta no se quita sola ni deja huella**: la aplicación la quita y decide el foco (la huella exige un grupo, #466) |
| `navigate` | `{ event, href }` | El usuario activa el enlace. Se emite con el evento nativo; `event.preventDefault()` (síncrono) evita la navegación y permite un router (como `GCard`, #70). **Solo se emite con activación primaria sin modificadores** (`api.md` «Enlaces y `navigate`», #505). **Sin prop `to`** |

Todos en `emits` (lección de `CLAUDE.md`: si no, una escucha del consumidor llega por `$attrs` a la raíz y se dispara con cualquier clic interno). **Sin evento `click`** (aviso 7).

### Slots

| Slot | Alcance | Qué |
| --- | --- | --- |
| `default` | — | Sustituye el **texto visible** dentro de `g-tag__text` (p. ej. «Vue · **12**»). Solo contenido de frase **no interactivo** (aviso 6). `label` sigue siendo obligatoria: da los nombres y la clave del color |
| `lead` | — | Icono (`<GIcon>`) o `<GAvatar size="xs">` antes del texto. Hueco decorativo (`aria-hidden="true"`); el avatar manda su caja y el hueco la adopta (#295) |

### Atributos (`inheritAttrs: false`)

`class`, `style`, `id`, `data-*` y `lang` van a la **raíz**. Con `href`, `target`, `rel`, `download`, `hreflang` y `referrerpolicy` van al `<a>`. `aria-describedby` va al **control del cuerpo** (enlace o botón de alternar); sin control, se ignora. `role`, `tabindex` y el resto de `aria-*` **se ignoran** y avisan (aviso 1): el nombre lo da el texto.

---

## GTagGroup

### Props (#463)

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `items` | Array | `TagItem[]` (abajo) | — (**obligatoria**) | propia (`v-model:items`): las etiquetas presentes, en orden |
| `label` | String | nombre del grupo | sin valor | propia; **uno de** `label`/`labelledby` es obligatorio (aviso G1) |
| `labelledby` | String | id de un elemento visible | sin valor | propia (como `GTranscript`) |
| `layout` | String | `flow` `facets` | `flow` | propia (`facets` = B «Racimo», #467) |
| `size` | String | `sm` `md` | `md` | compartida, subconjunto; se aplica a todas las etiquetas |
| `categories` | Number | `0` a `12` | `0` | propia; se aplica a todas (un `item.color` gana) |
| `limit` | Number | entero ≥ 1 | sin valor | propia: muestra las primeras N y «Ver N más» |
| `clearable` | Boolean | | `false` | compartida en espíritu con `GSelect`/`GCombobox`: «Quitar todas» con ≥ 2 quitables |
| `emptyFocus` | String \| Object \| Function | selector CSS, elemento (o instancia con `$el`) o función que lo devuelve | sin valor | propia: a dónde va el foco si el grupo se queda sin controles |
| `disabled` | Boolean | | `false` | compartida: deshabilita **los controles de las etiquetas** (cuerpos interactivos, «Quitar», «Deshacer») y «Quitar todas». **«Ver N más» (divulgación) sigue activo** (#512) |
| `labels` | Object | §«Textos» | `{}` | compartida (sin valores por defecto, #226) |

**`TagItem`** (cada elemento de `items`; un objeto de datos):

| Campo | Tipo | Qué |
| --- | --- | --- |
| `id` | String \| Number | **Obligatorio y único** en el grupo (aviso G2). La huella, el foco y el deshacer se apoyan en él |
| `label` | String | **Obligatorio** (aviso G3). Como `GTag.label` |
| `href` | String | Enlace (como `GTag.href`) |
| `pressed` | Boolean | Presente (`true`/`false`) = etiqueta de alternar |
| `removable` | Boolean | Añade «Quitar» (con huella) |
| `disabled` | Boolean | Como `GTag.disabled` |
| `color`, `colorKey` | como `GTag` | Color de la etiqueta (o del racimo, #467) |
| `facet` | String | Nombre visible de la faceta («Estado», «Alergias»). Agrupa con `layout="facets"` y es parte de la clave del color (#469) |
| `icon` | String | Nombre de Lucide («dato → nombre», #202): `GIcon` público en el hueco `lead` |
| `avatar` | Boolean \| Object | `true` = `GAvatar` con `name = label`; objeto = props de `GAvatar` (`src`, `name`, `initials`, `icon`, `color`, `categories`, `colorKey`, `shape`; `size` y `label` se ignoran: siempre `xs` y decorativo). Gana a `icon` (como `GCombobox`, #335). **Hereda las `categories` del grupo** (#513): un avatar que no trae `color` ni `categories` propios usa el `categories` del grupo (la clave sigue siendo la de `GAvatar`: `colorKey ?? name`, con `name = label` por defecto, así que `avatar: true` en un grupo con `categories` ya colorea las iniciales); si el objeto trae `color` o `categories`, manda lo suyo. El grupo con `categories: 0` no cambia nada |

Otros campos se conservan tal cual (la aplicación los recibe en los eventos y en los slots).

- **`v-model:items`** (#463): toda acción del usuario que cambia el conjunto emite **`update:items` con un arreglo nuevo** (nunca muta el recibido; los elementos que no cambian conservan su referencia; el que se alterna es un objeto nuevo con `pressed` invertido). **Funciona con o sin `v-model`**: sin él, el grupo guarda su copia y la sustituye cuando la prop cambia. No hay `modelValue`: las etiquetas presentes **son** los datos; un arreglo de ids aparte duplicaría la fuente.
- **Cambios de la aplicación** en `items` se respetan siempre: un `id` que vuelve mientras su huella está a la vista sustituye a la huella; un elemento que desaparece mientras tiene el foco sigue la regla de foco de #465.
- **Sin slot por defecto**: el grupo pinta sus `GTag` desde `items` (aviso G9 si recibe hijos). Una `GTag` suelta dentro de un grupo no es parte de él.

### Eventos

Una vez por gesto, **después** de `update:items` (como el `change` de `GCombobox`, #421):

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `update:items` | `TagItem[]` | Quitar, deshacer, quitar todas, deshacer todas, alternar |
| `remove` | `{ item, index, source: 'button' \| 'key' }` | El usuario quita una etiqueta (deja huella) |
| `restore` | `{ items, source: 'undo' \| 'undo-all' }` | «Deshacer» de una huella o de «Quitar todas» |
| `clear` | `{ items }` | «Quitar todas» |
| `toggle` | `{ item, pressed }` | El usuario alterna (`item` es el objeto nuevo) |
| `navigate` | `{ event, href, item }` | Como `GTag` (`preventDefault()` para un router; misma guarda de modificadores, #505) |
| `settle` | `{ items }` | Lo quitado **deja de poder deshacerse**: las huellas se recogen o el «Deshacer» de «Quitar todas» se va (§«Huella»). Para la aplicación que prefiera confirmar el borrado en el servidor solo entonces. También al desmontar con huellas pendientes |

### Slots

| Slot | Alcance | Qué |
| --- | --- | --- |
| `label` | `{ item, index }` | Texto visible de cada etiqueta (como el `default` de `GTag`; no interactivo) |
| `lead` | `{ item }` | Hueco inicial de cada etiqueta. Con el slot, manda el slot (como `GCombobox`, #202) |

---

## Semántica por caso (#464)

| Caso | Cuerpo | Rol y nombre | Estado |
| --- | --- | --- | --- |
| Estática | `<span class="g-tag__body">` | Ninguno: su texto es contenido de la lista. **Sin `tabindex`** | — |
| Enlace | `<a class="g-tag__body" href>` | «enlace, Vue» | — |
| Enlace `disabled` | `<a class="g-tag__body" role="link" aria-disabled="true">` **sin `href`** | «enlace, Vue, no disponible»; fuera del orden de Tab | — |
| Alternar | `<button type="button" class="g-tag__body" aria-pressed>` | El texto; **no cambia con el estado** (APG *Button*) | `aria-pressed="true\|false"`; marca `check` decorativa; **sin anuncio propio** (el lector ya dice «presionado») |
| Quitable | El cuerpo de su caso **más** `<button type="button" class="g-tag__remove">` | Nombre de `labels.remove` (o `removeIn`, #467): «Quitar Penicilina»; **único entre hermanos** (WCAG 2.4.6, 4.1.2; aviso G4) | `aria-keyshortcuts="Delete Backspace"` |
| Huella (grupo) | `<span class="g-tag__body" aria-hidden="true">` + `<button type="button" class="g-tag__undo">` | Nombre de `labels.undo` (o `undoIn`): «Deshacer: quitar Látex». El texto tachado está **fuera del árbol** | — |

- **Enlace y «Quitar» son hermanos**, nunca anidados (HTML no permite interactivos dentro de `<a>`).
- **«Quitar» y «Deshacer» son de solo icono** (`x`, `undo-2`): su nombre va en un **texto oculto** (`g-tag__sr`, patrón de texto oculto estándar) dentro del botón, que es lo que enseña la pista visual (#470; `tooltip.md` §«Modo visual»: el nombre ya vive en el DOM). Nunca `title`.
- **El texto** lleva `dir="auto"` (contenido de la aplicación, escrituras mezcladas, como #282). El avatar decorativo conserva su `translate="no"`.

### El grupo

```html
<!-- flow: lista con nombre; la raíz no tiene rol -->
<div class="g-tag-group g-tag-group--layout-flow g-tag-group--size-md">
  <ul class="g-tag-group__list" role="list" aria-label="Alergias" id="…-list">
    <li class="g-tag-group__item" data-id="pen">
      <span class="g-tag g-tag--size-md is-removable" data-cat="3">
        <span class="g-tag__body"><span class="g-tag__lead" aria-hidden="true">…</span><span class="g-tag__text" dir="auto">Penicilina</span></span>
        <button type="button" class="g-tag__remove" aria-keyshortcuts="Delete Backspace"><svg class="g-icon" aria-hidden="true">…x…</svg><span class="g-tag__sr">Quitar Penicilina</span></button>
      </span>
    </li>
    …
  </ul>
  <span class="g-tag-group__tools">                       <!-- solo si hay alguna herramienta -->
    <button class="g-btn … g-tag-group__more" aria-expanded="false" aria-controls="…-list">Ver 3 más</button>
    <button class="g-btn … g-tag-group__clear">Quitar todas</button>
  </span>
  <span class="g-tag-group__live" role="status"></span>   <!-- oculta visualmente; existe desde el montaje -->
  <!-- nodos de la pista visual (modo visual de #433), al final de la raíz -->
</div>
```

- **`role="list"` explícito** en el `<ul>`: Safari quita la semántica de lista a un `<ul>` con `list-style: none`, y la cuenta («lista, 4 elementos») informa en filtros aplicados.
- **Todas de alternar** (todos los `items` con `pressed` booleano y sin `href`): el contenedor es `<div class="g-tag-group__list" role="group">` con el mismo nombre y los elementos `<span class="g-tag-group__item">` (un conjunto de interruptores, sin cuenta).
- **El nombre** va en el contenedor (`aria-label` = `label`, o `aria-labelledby` = `labelledby`), no en la raíz.
- **`layout="facets"`** (#467): la lista exterior contiene racimos; cada racimo con faceta es `<li class="g-tag-group__facet" data-cat>` con `<span class="g-tag-group__facet-name" id dir="auto">Estado</span>` y una lista interior `<ul class="g-tag-group__values" role="list" aria-labelledby>` (o `<span role="group" aria-labelledby>` si todas sus etiquetas son de alternar) con `<li class="g-tag-group__value">`. Una etiqueta **sin faceta** va directamente en su `<li class="g-tag-group__item">` de la lista exterior (sin lista interior de un solo elemento).
- **Vacío:** el contenedor sigue en el DOM con su rol y su nombre, sin hijos; `g-tag-group__empty` (texto `labels.empty`, con `id`) se pinta después y el contenedor lo referencia con `aria-describedby` mientras está vacío. No se pinta mientras haya huellas o el «Deshacer» de «Quitar todas».
- **`__more` y `__clear` son `GBtn`** `variant="link"` `color="accent"`, `size` `sm` con etiquetas `md` y `xs` con etiquetas `sm` (coco puede ajustar el tamaño para alinear las alturas, siempre ≥ 24px y 44px táctil); `__clear` en modo «Deshacer» lleva el icono `undo-2` (con `flip-rtl`) en `prepend`.

---

## Teclado y foco (#465)

- **Sin widget compuesto.** Cada cuerpo interactivo y cada «Quitar»/«Deshacer» es una parada de Tab nativa, en orden del documento. Sin *roving tabindex* ni flechas: APG no define un patrón de etiquetas, ← → chocarían con la edición de `GTagInput` y la rejilla 2D de fichas ya se descartó (`combobox/r02`).
- **Atajo de quitar:** <kbd>Supr</kbd> o <kbd>Retroceso</kbd> sobre el cuerpo interactivo o sobre «Quitar» de una etiqueta quitable y habilitada la quita (`source: 'key'`, `preventDefault()`). Es un atajo: la vía principal es el botón con nombre (WCAG 2.1.1). En una etiqueta estática no hay control que lo reciba.
- **El foco se mueve por programa, también tras un clic** (WebKit no enfoca un botón al pulsarlo): quitar → «Deshacer» de la huella; deshacer → «Quitar» de la etiqueta devuelta; «Quitar todas» → el mismo botón ya convertido en «Deshacer»; deshacer todas → «Quitar todas». Un foco por programa **no abre la pista visual** (regla del motor).
- **Si el control con el foco desaparece por otra causa** (la aplicación cambia `items`, una etiqueta deja de ser quitable, «Ver N más» se va), el foco va, en este orden (WCAG 2.4.3; nunca a `<body>`):
  1. al control **equivalente** de la siguiente etiqueta con control («Quitar» → «Quitar», cuerpo → cuerpo; si no lo tiene, a su otro control); en `facets`, primero dentro del mismo racimo;
  2. si no hay siguiente, al de la anterior más cercana;
  3. si no queda ninguno, a `emptyFocus` (resuelto en ese momento; si no se encuentra, aviso G10 y sigue);
  4. sin él, al **contenedor** del grupo con `tabindex="-1"` (se quita al salir), que lee su nombre y, vacío, `labels.empty`.
  Las etiquetas estáticas se saltan.
- **«Ver N más»** (`limit`; APG *Disclosure*): `aria-expanded`, `aria-controls` al contenedor; las ocultas con `hidden` (fuera del árbol). Al desplegar o plegar, **el foco se queda en el botón**, que pasa a `labels.less`. No es un «+3» sin texto. **Con `disabled` en el grupo sigue activo** (#512): deshabilitar no debe esconder etiquetas sin forma de leerlas (WCAG 1.3.1, 4.1.2); el botón lleva `aria-expanded` y despliega igual, mientras los controles de las etiquetas y «Quitar todas» quedan `disabled`.
- **Esc** no hace nada propio (no hay nada abierto; la pista visual la cierra el motor).

## Personalidad A · Huella (#466; decisión del usuario del 2026-10-07)

Comportamiento de **toda** etiqueta quitable de un `GTagGroup` (sin prop para desactivarlo en v1). Una `GTag` suelta tiene la forma (tapa entera y vista previa) pero no huella.

1. **Tapa entera.** «Quitar» ocupa **toda la altura** de la etiqueta (`space × 8` × `space × 8` en `md`; 24 × 24 en `sm`) al final lógico, separada del texto por un filo, con las esquinas finales de la etiqueta; con `pointer: coarse`, un área de 44px centrada sin cambiar el dibujo (como `GBtn`). Es la forma de toda etiqueta quitable, suelta o en grupo.
2. **Vista previa.** Apuntar o enfocar con teclado la tapa **tacha el texto** de su etiqueta antes de quitar (CSS: `:has(.g-tag__remove:hover, .g-tag__remove:focus-visible)`): se ve cuál se va.
3. **Quitar = el modelo cambia en el acto.** Se emite `update:items` sin el elemento y `remove`. El grupo guarda una **huella** (copia del elemento y sus vecinos) como estado interno: **no es un `item` del modelo**.
4. **La huella conserva la caja.** El `.vue` mide el ancho de la etiqueta (`border-box`) **antes** del cambio y lo escribe en la huella como `--_ghost-w` (px); la huella mide eso (**Δ0** en posición y ancho de todas las etiquetas, por construcción y no por coincidencia de CSS). Se ve: contorno discontinuo, texto tachado y atenuado (fuera del árbol), el avatar o icono atenuados, y la tapa convertida en «Deshacer» (`undo-2` con `flip-rtl`), **con el foco**. Anuncio `labels.removed`.
5. **Deshacer** devuelve el elemento **a su sitio**: delante del primer elemento que le seguía al quitarlo y que aún existe; si no, detrás del anterior más cercano que exista; si no, al final. Emite `update:items` y `restore` (`source: 'undo'`), anuncia `labels.restored` y lleva el foco a su «Quitar».
6. **Se recogen cuando nadie apunta.** Las huellas se recogen **todas a la vez** cuando el foco **no** está dentro del grupo **y** ningún puntero con hover (ratón, lápiz) está sobre él; se evalúa en `focusout`, en `pointerleave` del grupo y en un `pointerdown` fuera del grupo. En táctil cuenta solo el foco. Recoger = `inline-size` de la huella a 0 y opacidad a 0 (`--g-duration-fast` + `--g-ease-out`; con movimiento reducido, al instante) y después salen del DOM. Emite **`settle`** con los elementos recogidos.
7. **Varias huellas** pueden convivir (cada una con su «Deshacer»). Un doble clic rápido sobre la misma tapa quita y deshace (la vecina sigue en su sitio: medido por kiwi).
8. **Con `limit`**, la ventana visible cuenta las huellas (nada sube desde las ocultas hasta recoger); «Ver N más» cuenta solo las etiquetas vivas ocultas.
9. **«Quitar todas»** (`clearable`, ≥ 2 etiquetas quitables y habilitadas): quita todas las quitables habilitadas **sin huella** (no queda nada que pueda moverse bajo la mano), recoge al instante las huellas que hubiera (y las incluye en su `settle`), emite `update:items` y `clear`, anuncia `labels.cleared` y **el mismo botón** pasa a `labels.undoAll` con el foco (la acción contraria aparece donde actuaste). Deshacer las devuelve a sus posiciones (`restore`, `source: 'undo-all'`, anuncio `labels.restoredAll`) y el foco vuelve a «Quitar todas». El «Deshacer» se retira con **la misma regla que las huellas** (#466.6, enmienda #526): cuando **ni el foco ni un puntero con hover (ratón, lápiz)** están en el grupo, evaluado en `focusout`, `pointerleave` y `pointerdown` fuera; en táctil cuenta solo el foco. No basta con el `focusout`: en WebKit el `mousedown` sobre un botón saca el foco antes del clic, y el botón se iría (con su `settle`) antes de poder pulsarlo; el hover del puntero lo retiene. Al retirarse se emite `settle` con esos elementos.
10. **Desmontar** con huellas o con «Deshacer todas» pendientes emite `settle` (en `onBeforeUnmount`).

**Qué lo hace distinto (A).** El error clásico de las etiquetas —quitar dos seguidas y que la segunda sea la que estaba al lado— desaparece **por construcción**: lo que hay bajo el puntero no cambia mientras el puntero está ahí. «Deshacer» vive **en el sitio del gesto**, no en un aviso que hay que ir a buscar, y lleva el foco. Una tapa entera en vez de una × diminuta, con vista previa tachada de lo que se va.

## Personalidad B · Racimo (#467; decisión del usuario del 2026-10-07)

`layout="facets"`: opción del grupo cuando los datos traen faceta. Es ortogonal a A: un racimo también deja huella.

- **Agrupación:** por `item.facet` (recortado; vacío = sin faceta), racimos en **orden de primera aparición**, valores en el orden de `items`. Las etiquetas sin faceta van sueltas, cada una en su lugar de aparición, **con lomo neutro** (#525.1): la suelta **conserva el aspecto de una etiqueta** (relleno, forma y control propios, `is-plain` no) y solo **gana un lomo `border-control`** al inicio lógico; no se convierte en un racimo sin nombre (no hay `role="group"` ni nombre de faceta que leer).
- **Forma:** el nombre de la faceta **una vez** (`caption`, peso de acción, `text-muted`), un **lomo** al inicio lógico en `cat-k-text` (forma sin par, #439; grosor `space × 0.75`) y los valores en fila separados por filos. Las etiquetas de un racimo **no llevan relleno propio**: el racimo es la caja.
- **Color del racimo:** la categoría de su **primer** elemento (`color` o el derivado de `colorKey ?? facet ?? label`, #469); por la clave, todas las de la misma faceta coinciden.
- **Nombres:** «Quitar» usa `labels.removeIn` (`{label}`, `{facet}`): «Quitar Alta de Prioridad», único aunque «Alta» exista en dos facetas; «Deshacer» usa `labels.undoIn`; el anuncio, `labels.removedIn`. Cada uno, si falta, cae a su forma sin faceta (`remove`, `undo`, `removed`) y avisa (G5).
- **Alternar en un racimo:** el racimo es un `role="group"` nombrado por la faceta («Estado: Pendiente · En curso · Cerrado»): un filtro de facetas en una línea. Pulsada = relleno `cat-k-soft` + texto `on-cat-k-soft` + marca `check` + **raya inferior** `cat-k-text` (§«Contraste»).
- **Foco** (regla de #465): primero dentro del mismo racimo; si el racimo se vacía al recoger, el racimo sale con las huellas.
- **`limit` no se combina con `facets`** en v1: se ignora con aviso G6 (reservado, #473).
- `layout="facets"` sin ningún `item.facet` funciona como `flow` con lomo neutro y avisa una vez (G7).

**Qué lo hace distinto (B).** Lee como piensa la persona: «Estado: pendiente o en curso; prioridad: alta», no seis píldoras de colores. El color deja de ser la pista de la categoría (lo es el nombre) y pasa a ser un lomo que agrupa a la vista; caben más valores por línea porque la faceta no se repite. Es la forma natural de los filtros aplicados (O dentro de una faceta, Y entre facetas, #111).

## C · Palabra (reservada, #473)

El nombre de la apariencia queda reservado: **`appearance="text"`** en `GTagGroup` (etiquetas como palabras en la línea, la caja solo cuando significa «encendido», pestaña «Quitar» que cuelga) con su raíz en línea (`<span role="list">` + `<span role="listitem">`, para frases y celdas). No se declara la prop en v1. Antes de publicarla, kiwi la mide dentro de una celda real de `GTable`.

## Textos (`labels`) y anuncios (#468)

Sin valores por defecto (#226). Cada clave es una **cadena con marcadores** (`fill` de `utils/template.js`) **o una función** que recibe las mismas variables y devuelve la cadena. Se avisa una vez por clave que falte **cuando se va a usar** (G5).

| Clave | Variables | Dónde | Ejemplo (es) |
| --- | --- | --- | --- |
| `remove` | `{label}` | Nombre de «Quitar» (`GTag` y grupo) | «Quitar {label}» |
| `removeIn` | `{label}`, `{facet}` | Ídem en un racimo | «Quitar {label} de {facet}» |
| `removed` | `{label}` | Anuncio al quitar (con huella) | «{label} quitada. Deshacer disponible» |
| `removedIn` | `{label}`, `{facet}` | Ídem en un racimo | «{label} quitada de {facet}. Deshacer disponible» |
| `undo` | `{label}` | Nombre de «Deshacer» de la huella | «Deshacer: quitar {label}» |
| `undoIn` | `{label}`, `{facet}` | Ídem en un racimo | «Deshacer: quitar {label} de {facet}» |
| `restored` | `{label}` | Anuncio al deshacer | «{label} restaurada» |
| `more` | `{count}` | «Ver N más» | «Ver {count} más» |
| `less` | — | Desplegado | «Ver menos» |
| `clearAll` | — | «Quitar todas» | «Quitar todas» |
| `cleared` | `{count}` | Anuncio | «Se quitaron {count} etiquetas» |
| `undoAll` | `{count}` | El botón en modo deshacer | «Deshacer: volver a poner {count}» |
| `restoredAll` | `{count}` | Anuncio | «{count} etiquetas restauradas» |
| `empty` | — | Grupo vacío | «Sin etiquetas» |

- **Una región viva cortés por grupo** (`g-tag-group__live`, `role="status"`, oculta visualmente), **vacía al montar** y escrita con `createLiveWriter` de `utils/liveRegion.js` (vaciar y escribir en el ciclo siguiente; se vacía sola). Se anuncian quitar, deshacer, quitar todas y deshacer todas. **No** se anuncian alternar (lo dice `aria-pressed`), desplegar (lo dice `aria-expanded`) ni recoger.
- Una `GTag` suelta **no anuncia** (la aplicación quita la etiqueta y sabe qué decir).
- **Manda el último gesto** (#514): la región viva es una sola y se escribe con `createLiveWriter` (vaciar y escribir en el ciclo siguiente), así que un anuncio nuevo **sustituye** al anterior si aún no se leyó. Quitar y deshacer seguidos (o dos quitar rápidos) anuncian lo último («restaurada»), no una cola de mensajes. Es el comportamiento aceptado: una cola retrasaría el estado actual detrás de uno ya caduco, y el estado real está en el árbol (la huella con su «Deshacer», o la etiqueta devuelta).

## Color por categoría (#469)

| Entrada | Resultado | `data-cat` |
| --- | --- | --- |
| Sin `color` y `categories` 0 | **Neutro** | — |
| `color="neutral"` | Neutro (gana a `categories`) | — |
| `color="k"` (1 a 12) | Categoría `k` | `k` |
| `categories="n"` sin `color` | `k = categoryOf(clave, n)` | `k` |
| `k` mayor que las categorías del tema | Sin relleno (el `var()` sin respaldo no resuelve); texto legible en el color heredado. **No se puede detectar** sin leer estilos: límite, como `GAvatar` | `k` |

- **Clave:** `colorKey ?? facet ?? label` (en un grupo; una `GTag` suelta no tiene `facet`: `colorKey ?? label`). La faceta va antes que el texto para que las etiquetas de una misma categoría compartan color; `colorKey` permite fijarlo. **Vale con cualquier `layout`, también `flow`** (#527): si el elemento trae `facet`, el color se deriva de ella aunque el grupo no pinte racimos; así dos «Alta» de facetas distintas no comparten color por casualidad y las de una misma faceta sí.
- **El hash es el de `GAvatar`, sin copia** (L5): FNV-1a de 32 bits sobre los octetos UTF-8 de la clave normalizada (NFC, recorte, espacios colapsados, `toLowerCase()` sin configuración regional) + `fmix32`, `mod n + 1` (`avatar.md` §«Hash», #294). **bruno lo saca de `GAvatar.vue` a `packages/vue/src/utils/categoryHash.js`** (`categoryOf(key, n)`, interna, no exportada desde `src/index.js`), lo usan `GAvatar`, `GTag` y `GTagGroup`, y los **siete vectores** de `avatar.md` pasan a `utils/categoryHash.test.js`. La misma clave da la misma categoría en una etiqueta y en un avatar, entre motores y en el servidor.
- **`data-cat="k"`** en la raíz de la `GTag` (y en el racimo, `g-tag-group__facet`) **solo** cuando hay categoría.
- **Familia condicional y `CAT_FAMILY_READERS`:** `GTag.css` lee `--g-color-cat-k-soft`, `--g-color-on-cat-k-soft`, `--g-color-cat-k`, `--g-color-on-cat-k`, `--g-color-cat-k-strong` y `--g-color-cat-k-text`; `GTagGroup.css` solo `--g-color-cat-k-text` (lomo). bruno añade a `CAT_FAMILY_READERS` de `packages/vue/src/tokens/levels.test.js`: `'GTag/GTag.css': 'etiqueta por categoría: relleno, pulsada, contorno y raya (color / categories)'` y `'GTagGroup/GTagGroup.css': 'lomo del racimo (layout facets)'`. Sin respaldo; `defaults.css` sigue sin definirlas.

## Contraste, medida y lectura (#470)

| Estado | Relleno | Texto e icono | Forma | Base |
| --- | --- | --- | --- | --- |
| Estática y quitable, neutra | `neutral-soft` | `on-neutral-soft` | — | Par garantizado (6,54:1 claro, 4,56:1 oscuro, tema por defecto; `avatar.md`) |
| Estática y quitable, categoría | `cat-k-soft` | `on-cat-k-soft` | — | Par garantizado ≥ 4,5:1 (kiwi: 4,60 a 5,10 claro, mín. 4,52 oscuro) |
| Filo de la tapa | — | — | `border-strong` | Decorativo: la tapa la identifica su icono (≥ 3:1 por ser `on-*-soft`) |
| Alternar sin pulsar | `surface` | `text` | contorno `border-control` | WCAG 1.4.11 (3,45:1 medido) |
| **Alternar pulsada**, neutra | `primary` | `on-primary` | contorno **`primary-text`** | §7.1 (#431) |
| **Alternar pulsada**, categoría | `cat-k` | `on-cat-k` | contorno **`cat-k-text`** | §7.1 (kiwi: 5,86:1) |
| Pulsada al pasar | `{familia}-strong` (`primary-strong`, `cat-k-strong`) | `on-{familia}` | contorno sigue en `-text` | #438 |
| Racimo: valor pulsado | `cat-k-soft` (neutro: `primary-soft`) | `on-cat-k-soft` (`on-primary-soft`) | **raya inferior** `cat-k-text` (`primary-text`) + `check` | #439 (raya sin par); el estado lo lleva el `check` |
| Lomo del racimo | — | — | `cat-k-text` (neutro: `border-control`) | #439; kiwi: 5,26 a 5,86:1 |
| **Tapa («Quitar» y «Deshacer») al pasar o pulsar** | el **texto del par del estado** (`on-soft` / `on-fill` / `on-pick`) | el **fondo del par** (`soft` / `fill` / `pick`) | — | **Se invierte sobre el par del estado** (#525.4): el motor garantiza el par ≥ 4,5:1 (medido ≥ 4,51), así que el icono pasa de sobra el 3:1; ninguna combinación nueva |
| Huella | transparente | `text-muted` (tachado) | contorno **discontinuo** `border-control`; «Deshacer» en `text` | 1.4.11 en el «Deshacer» |
| Deshabilitada | — | `text-subtle` | `border` | 1.4.11 excluye lo inactivo |

- **Pulsado: el estado no depende del color.** La marca `check` aparece (`g-tag__check`, decorativa, siempre en el DOM de una etiqueta de alternar; ancho 0 sin pulsar) y cambia el relleno.
- coco mide la tabla en el tema por defecto, lustre, spotify y un tema con `primary` propia (#107), claro y oscuro, con 8 y 12 categorías (`design/lab/chip/r01/tema-cat8.css`), y el «Deshacer» y la tapa al pasar (el icono ≥ 3:1 contra su fondo de hover).
- **Foco visible** en todos los controles: `--g-focus-width`, `--g-color-focus`, `--g-focus-offset` (en un racimo, desplazamiento hacia dentro para no cortarlo; coco).
- **Tamaños:** `md` = `space × 8`, rol `body-sm`; `sm` = `space × 6`, rol `caption` (≥ 12px). **Alto = `max(space × n, línea + 2 × borde)`** (#524.1; `n` = 8 o 6): `space × n` es el alto de diseño y la línea del rol más los dos bordes es el mínimo que el texto necesita, como la caja de `GInput`; así un tema con `space` pequeño y texto grande no recorta ni desborda el texto. Sin cambio en el tema por defecto. Tapa del alto de la etiqueta; cuerpo interactivo ≥ 24px de alto; 44px de área con `pointer: coarse` en tapa, «Deshacer» y cuerpo interactivo (`::after` centrado, también en RTL). Separación entre etiquetas `space × 2`. Avatar del hueco: `GAvatar size="xs"` (20px) en los dos tamaños; icono 1em.
- **Recorte:** solo se recorta (una línea, `…`, tope de ancho `space × 60`, constante de coco) el texto de una etiqueta **con control enfocable**; su nombre accesible es el texto entero y la **pista visual** lo enseña. **Una etiqueta estática no se recorta: se parte en líneas** (`overflow-wrap: anywhere`), porque sin foco no habría forma de leerla con teclado. **Tampoco la deshabilitada** (#525.2): sin foco no hay pista, así que se parte como la estática. **El tope también va en el contenedor** (#524.2): `GTagGroup__item` y `__value` llevan el mismo `max-inline-size: min(100%, space × 60)`; el porcentaje del tope de la etiqueta no resuelve al medir el ancho intrínseco de su contenedor, que de otro modo medía el texto entero y dejaba un hueco tras la etiqueta recortada.
- **Pista visual** (modo visual del motor de `GTooltip`, #433; `useVisualTips` de `utils/visualTip.js`): un nodo por control con pista, `aria-hidden`, sin `role` ni `id`. Cuerpo interactivo: texto = `label`, **desactivada** (`disabled()`) mientras el texto **no** esté recortado (`scrollWidth ≤ clientWidth + 1`, medido por lotes con el observador de tamaño). «Quitar» y «Deshacer»: texto = su nombre (`g-tag__sr`), siempre activa. **Lugar del nodo:** al final de la raíz del grupo (fuera de la lista, que exige `li`); en una `GTag` suelta, al final de su raíz. Como la raíz de `GTag` es un `<span>`, bruno añade a `useVisualTips` la opción de crear el nodo como `span` (contenido de frase válido); el CSS de `g-tooltip` no cambia (el `popover` lo coloca en la capa superior). El grupo del motor es el ancestro con rol de grupo o, si no hay, el padre del nodo: en un `GTagGroup` la pista **viaja** entre etiquetas del mismo grupo.
- **RTL:** tapa al final lógico, lomo al inicio lógico, `check` y avatar al inicio lógico; `undo-2` con `flip-rtl` (`icons.md` §4); `x` y `check` no se espejan.
- **`forced-colors`:** borde `CanvasText` de `--g-border-width` en cada etiqueta (sin cambiar su tamaño) y en el racimo; pulsada con `Highlight` (borde o contorno); huella discontinua; el estado sigue en el `check`.

## Tokens y movimiento (#471)

**Tokens nuevos: ninguno** (`tokens.md` §17.6: ningún existente se queda corto; registro en `tokens.md` §39).

| Token | Para qué |
| --- | --- |
| `--g-space-1` | Alturas (`× 6`, `× 8`), relleno, separación (`× 2`), lomo (`× 0.75`), tope de recorte (`× 60`) |
| `--g-color-neutral-soft`, `--g-color-on-neutral-soft` | Etiqueta neutra |
| `--g-color-cat-k-soft`, `-on-cat-k-soft`, `-cat-k`, `-on-cat-k`, `-cat-k-strong`, `-cat-k-text` (k = 1 a 12) | Categoría (familia condicional, `CAT_FAMILY_READERS`) |
| `--g-color-primary`, `-on-primary`, `-primary-strong`, `-primary-text`, `-primary-soft`, `-on-primary-soft` | Alternar pulsada neutra (§7.1) y valor pulsado de un racimo neutro |
| `--g-color-surface`, `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Alternar sin pulsar, huella, faceta, deshabilitada |
| `--g-color-surface-sunken` | Valor de alternar **sin pulsar** de un racimo al pasar (`is-plain`, `@media (hover: hover)`; #511) |
| `--g-press-scale` | `scale` del icono de «Quitar» y «Deshacer» mientras se pulsan (#511; con `1` se desactiva; no es movimiento de posición, §29) |
| `--g-radius-sm` | Radio del anillo de foco del contenedor del grupo cuando el foco llega por programa (`tabindex="-1"`, #465) y del grupo vacío (#511) |
| `--g-color-border`, `--g-color-border-strong`, `--g-color-border-control` | Filos, filo de la tapa, contorno de alternar, huella, lomo neutro |
| `--g-color-focus`, `--g-focus-width`, `--g-focus-offset` | Foco |
| `--g-radius-shape` | Forma de la etiqueta y del racimo (la forma de las acciones del tema, #8, #23; no la píldora fija) |
| `--g-border-width` | Contornos, filo, `forced-colors` |
| `--g-font-ui`, `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-action-weight` | Texto (`md`/`sm`) y nombre de la faceta (§23) |
| `--g-duration-fast`, `--g-duration-press`, `--g-ease-out`, `--g-ease-standard` | Movimiento (abajo) |

**Movimiento** (§29; ningún uso nuevo de `--g-ease-spring` ni de `--g-ease-bounce`: la recogida es una **salida** y la marca, una respuesta):

- **Recoger huellas:** `inline-size` (desde `--_ghost-w` a 0), margen y opacidad con `--g-duration-fast` + `--g-ease-out` (una salida, §29.2). Transición, no keyframes.
- **Marca `check` al pulsar:** se abre (ancho 0 → 1em) con `--g-duration-press` + `--g-ease-out`, como el chip de `GCheckbox`.
- **Huella que aparece** y relleno al pulsar: color y fondo con `--g-duration-fast` + `--g-ease-standard`.
- **Vista previa:** el tachado aparece sin animar.
- **Nada se anima al montar** (`is-ready` si coco lo necesita, §29.3); con `prefers-reduced-motion: reduce`, la recogida es instantánea y la marca aparece sin abrirse (solo color).

**No son tokens:** el tope de recorte `space × 60` (en `GTag` y en `__item`/`__value`) y el grosor del lomo `space × 0.75` (constantes de diseño de coco desde `space`; el lomo es un borde y **el navegador lo redondea a píxel entero** con `space` fraccionario —3,75 se queda en 3—, a diferencia de la raya, que es una sombra interior; diferencia ≤ 1px, límite aceptado, #525.3); `24px`/`44px` (§7). **Datos del `.vue` al CSS** (§29.5): `--_ghost-w` (px, ancho medido de la etiqueta al quitarla) e `is-ghost` en la `GTag`, `is-settling` en el `__item`/`__value` mientras se recoge.

**Iconos** (`icons.md` §4): `x` (quitar), `check` (pulsada), `undo-2` (deshacer, con `flip-rtl`), todos ya en la lista de la librería: **ninguno nuevo**. `circle` (rellena) queda para C (reservada). Los iconos de `item.icon` y del slot `lead` son de la aplicación.

## Clases y datos (contrato bruno ↔ coco)

| Clase / atributo | Elemento | Cuándo |
| --- | --- | --- |
| `g-tag` | Raíz `<span>` de la etiqueta | Siempre |
| `g-tag--size-{sm\|md}` | Raíz | Siempre |
| `is-removable` · `is-toggle` · `is-pressed` · `is-link` · `is-disabled` | Raíz | Según el caso (`is-pressed` solo con `is-toggle`) |
| `is-ghost` + `--_ghost-w` | Raíz | Huella (solo en un grupo) |
| `is-plain` | Raíz | Valor dentro de un racimo (sin relleno propio; lo pone el grupo por su contexto interno) |
| `data-cat="k"` | Raíz | Solo con categoría |
| `g-tag__body` | `<span>`, `<a>` o `<button>` | Siempre |
| `g-tag__lead` | `<span aria-hidden="true">` | Con slot `lead`, `item.icon` o `item.avatar` |
| `g-tag__check` | `<span aria-hidden="true">` con `check` | Solo etiquetas de alternar |
| `g-tag__text` | `<span dir="auto">` | Siempre |
| `g-tag__remove` · `g-tag__undo` | `<button>` | Quitable · huella |
| `g-tag__sr` | `<span>` oculto visualmente | Nombre de «Quitar»/«Deshacer» |
| `g-tag-group` | Raíz `<div>` del grupo | Siempre |
| `g-tag-group--layout-{flow\|facets}` · `g-tag-group--size-{sm\|md}` · `is-disabled` | Raíz del grupo | Siempre / con `disabled` |
| `g-tag-group__list` | `<ul role="list">` o `<div role="group">` | Siempre |
| `g-tag-group__item` | `<li>` o `<span>` | Cada etiqueta (y cada suelta en `facets`) |
| `g-tag-group__facet` · `__facet-name` · `__values` · `__value` | Racimo, nombre, lista interior, valor | `layout="facets"` |
| `is-settling` | `__item` / `__value` | Mientras se recoge |
| `g-tag-group__tools` · `__more` · `__clear` (`is-undo` en modo deshacer) | Herramientas (`GBtn`) | Con `limit` que oculta algo / `clearable` |
| `g-tag-group__empty` | `<p>` | Grupo vacío |
| `g-tag-group__live` | `<span role="status">` oculto | Siempre |

**Mecanismo interno** (#463): un `GTag` dentro del grupo recibe la huella, `is-plain`, el nombre de faceta y el encaminamiento de «Quitar»/Supr por una clave **interna** provista por `GTagGroup` e inyectada solo por `GTag` (no exportada desde `src/index.js`): **ninguna prop, slot ni evento público** (como N4 de `input.md`).

**CSS nuevo con `> *`, `:last-child`, `+` o `~`** sobre hijos de la raíz del grupo o de la etiqueta: excluir `.g-tooltip` con `:where()` (#383, #394): los nodos de la pista son hermanos de esas piezas.

## Avisos de desarrollo (#462, #463)

`typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'` (nunca `import.meta.env.DEV`), una vez por instancia, causa y valor.

**`[Grana GTag]`**

| # | Causa | Qué hace |
| --- | --- | --- |
| 1 | `role`, `tabindex` o `aria-*` (salvo `aria-describedby`) como atributos | Los ignora; remite a `label` |
| 2 | `href` con `pressed` no `null` | Ignora `pressed` (enlace) |
| 3 | `color` que no es `'neutral'` ni un entero de 1 a 12 (texto propio para los semánticos: «una etiqueta no lleva color semántico; para estado, `GBadge`») | Lo ignora: derivado o neutro |
| 4 | `categories` fuera de 0..12 o no entero | Lo trata como `0` |
| 5 | `removable` sin `labels.remove` | Pinta «Quitar» sin nombre (error del desarrollador, avisado) |
| 6 | Contenido interactivo en el slot `default` o `label` (comprobado al montar: `a`, `button`, `input`, `select`, `textarea`, `[tabindex]`) | Lo pinta; remite a `href`, `pressed` o `GBtn` |
| 7 | Escucha `onClick` en la etiqueta | No se enlaza; remite a `navigate`, `update:pressed` o `remove` |
| 8 | `label` ausente o vacía | No pinta la etiqueta |

**`[Grana GTagGroup]`**

| # | Causa | Qué hace |
| --- | --- | --- |
| G1 | Sin `label` ni `labelledby` | Pinta la lista sin nombre |
| G2 | Un `item` sin `id` o con `id` repetido | Omite ese elemento (la huella y el foco dependen del `id`) |
| G3 | Un `item` sin `label` | Lo omite |
| G4 | Dos etiquetas con control y el mismo texto (normalizado) y la misma faceta | Las pinta; los nombres de «Quitar» no son únicos (usa `facet` o textos distintos) |
| G5 | Falta una clave de `labels` que se va a usar (o la forma con faceta, que cae a la base) | Sin texto en ese sitio, o la forma base |
| G6 | `limit` con `layout="facets"` | Ignora `limit` |
| G7 | `layout="facets"` sin ningún `item.facet` | Funciona como `flow` con lomo neutro |
| G8 | Un `item` con `href` y `pressed`; `color` o `categories` inválidos | Como avisos 2 a 4 de `GTag` |
| G9 | Hijos en el slot por defecto | No los pinta; remite a `items` |
| G10 | `emptyFocus` no se encuentra cuando hace falta | Foco al contenedor del grupo |

## Paquete, `meta.json` y tipos (#472, enmendado por #510)

- **`GTag` y `GTagGroup` van en la entrada propia `@grana/vue/tag`** (`dist/tag.js` y `dist/tag.umd.js`, global UMD **`GranaTag`**, requiere `Vue` y `Grana`; **#510**). #472 los puso en el principal con una compuerta de 8 KB gzip; bruno midió **+9,2 KB** (más que el tope de #238, #328, #337, #380, #415), así que la compuerta mandó la decisión a esta entrada: *quien no las usa no las paga*. `@grana/vue` **no** las exporta ni las registra. La entrada exporta `GTag`, `GTagGroup` y, por defecto, un plugin que solo registra los dos (`app.use(Tag)`); el CSS sigue en `grana.css`. Lo que ya está en el principal llega por **`__shared`** sin duplicarse (una copia propia crearía otro `Symbol` o duplicaría el motor): `GAvatar`, `GBtn`, `GLibIcon` y el `GIcon` público, `useVisualTips` (`utils/visualTip.js`), `createLiveWriter` (`utils/liveRegion.js`), `fill` (`utils/template.js`) y `categoryOf` (`utils/categoryHash.js`); bruno añade a `src/shared.js` lo que falte. El motor de las huellas, el foco y la agrupación viaja **solo** en esta entrada. `GTagInput` (#338), cuando exista, irá en la misma entrada o en una que componga esta por `__shared`. `GFilterBar` no las usa (adopción reservada, #473): si lo hace, su ronda decide si pasan a `__shared`.
- **Paquete y tipos** (#442, #443): `./tag` en `exports` (`types`/`import`/`default`), `typesVersions`, `ENTRIES` de `scripts/build-types.mjs` y `src/types.test.js`; `GlobalComponents` gana `GTag` y `GTagGroup` desde el `install` de la entrada. `GTag.meta.json` y `GTagGroup.meta.json` declaran todas las props (tipos, valores, default y obligatoriedad: `label` y `items` obligatorias; `pressed` `boolean | null`), los eventos con su carga, los slots con su alcance, los `labels` y los tokens (la familia condicional anotada «`CAT_FAMILY_READERS`», como `GAvatar.meta.json`) y el **peso gzip de la entrada**. Lo que el JSON no expresa (la forma de `TagItem`, la carga de los eventos, `labels` como cadena o función, `emptyFocus`) va en `packages/vue/types/` (`overrides.mjs` por `GTagGroup.items`, `GTagGroup.labels`, `GTag.labels`…; `TagItem` en `api/tag.d.ts`). Importación parcial (#444): ningún efecto en el nivel superior de sus módulos.
- **Compuertas de build** (bruno las añade a `.github/scripts/gates.sh`): `grep -q "g-tag__undo" packages/vue/dist/grana.css`, `grep -q "g-tag-group__facet" packages/vue/dist/grana.css`, **`! grep -q "GTag" packages/vue/dist/grana.js`** (cubre también `GTagGroup`) y **`test -f packages/vue/dist/tag.js`**; el bucle `for entry in …` de `gates.sh` gana `tag`.
- **Efecto en el peso conjunto de la Fase C** (#506): `GTag`/`GTagGroup` dejan de sumar al `grana.js` del principal; la medida conjunta de #506 cuenta solo `GAccordion` y `GBreadcrumbs` (y lo que `GTag` haya movido a `__shared`, que sí crece).

## Resolución de hallazgos (kiwi r01)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | Nombre y entrega | **Confirmado el nombre:** `GTag` + `GTagGroup`. **Entrega enmendada:** entrada propia `@grana/vue/tag` (la compuerta de 8 KB del principal se superó, +9,2 KB) | #461, #472, #510 |
| L2 | API de `GTag` | **Confirmada con cambios:** sin `icon`/`avatar` (slot `lead`, #202); `pressed` con `default: null`; evento `navigate`; slot `default` para el texto; atributos repartidos | #462 |
| L3 | API de `GTagGroup` | **Confirmada con cambios:** `items` con `v-model:items` (las etiquetas presentes son el modelo; sin `modelValue`), `layout` `flow`/`facets` en vez de `groupBy`, `as="inline"` reservado con C, eventos `remove`/`restore`/`clear`/`toggle`/`navigate`/`settle`, slots `label` y `lead` en vez de `tag` (la anatomía no se cede) | #463 |
| L4 | `labels` | **Confirmados**, con `undoIn`; el anuncio con huella es `removed` (no hay `removedUndo`: con A siempre hay deshacer); cadena o función | #468 |
| L5 | Color y `CAT_FAMILY_READERS`; hash compartido | **Confirmado:** seis familias en `GTag.css` (añade `-strong`, por #438), `cat-k-text` en `GTagGroup.css`; hash a `utils/categoryHash.js` con los vectores de `avatar.md` | #469 |
| L6 | Tokens | **Ninguno nuevo** | #471 |
| L7 | Iconos | **Ninguno nuevo**; `circle` solo con C | #471 |
| L8 | Pista visual | **Confirmado** con `useVisualTips`; opción `span` para la raíz de `GTag` | #470 |
| L9 | Movimiento | **Confirmado**; recogida con `--g-duration-fast` (salida) | #471 |
| L10 | `GTag` no es un campo | **Confirmado** (frontera) | #461 |
| L11 | Adopción en `GFilterBar` | **Reservada** con su ronda (cuarto cuerpo «botón de acción») | #473 |
| L12 | `GTagInput` | **Reservado** (#338); compondrá `GTagGroup` con A | #473 |

## Límites conocidos (para el README)

- **Lectores de pantalla reales** (VoiceOver, NVDA): cómo se anuncian la huella (el `li` sigue contando en «lista, N elementos» mientras la huella está a la vista), el racimo anidado y el grupo vacío enfocado; sin verificar.
- **La cuenta de la lista incluye las huellas** hasta recogerlas (el `li` contiene «Deshacer»).
- **Una `GTag` suelta quitable** no gestiona el foco ni anuncia: es de la aplicación; para eso existe el grupo.
- **Categoría inexistente en el tema** (`k` > `categories` real): sin relleno y sin aviso. **Cambiar `categories`** reparte los colores de nuevo.
- **Rendimiento con cientos de etiquetas** sin medir (un nodo de pista por control); `limit` lo acota.
- **`disabled` en el grupo** deja «Ver N más» activo (#512): se puede leer todo lo que hay aunque no se pueda tocar; «Quitar todas» y los controles de las etiquetas sí se deshabilitan.
- **Anuncios:** manda el último gesto (#514); dos acciones muy seguidas no se leen juntas.
- **El tope de recorte no crece con el texto** (#528): `space × 60` va en px (desde `space`, no desde `em`); con el texto al 200 % se recortan más etiquetas con control (todas con pista y nombre entero) y las estáticas y deshabilitadas se parten en más líneas. Una deshabilitada quitable partida lleva la tapa del alto entero (alto de la etiqueta partida), como manda «tapa del alto entero». Sin pérdida de contenido.
- **Lomo en `space` fraccionario:** el borde se redondea a píxel entero (≤ 1px de diferencia con la raya, #525.3).
- Táctil real (el área de 44px con dedo) y `forced-colors` real, sin verificar.

## Fuera de v1 (reservado con nombre)

- **C «Palabra»**: `appearance="text"` y su raíz en línea (#473).
- **`GTagInput`** (#338): etiquetas de texto libre que componen `GTagGroup` con la huella.
- **Adopción de `GTag` en `GFilterBar`**: ronda propia (cuarto cuerpo «botón de acción», `aria-haspopup="dialog"`).
- **`limit` con `facets`**, reordenar etiquetas, <kbd>Ctrl/⌘</kbd>+<kbd>Z</kbd> en el grupo, desactivar la huella (`undo: false`), exportar `categoryOf`, un `categories` por aplicación (`provide`). Cada uno, solo con un consumidor.

## Verificación (cómo se da por hecho)

### bruno (vitest + jsdom)

- **Hash:** los siete vectores de `avatar.md` en `utils/categoryHash.test.js` (y `GAvatar` sigue pasando los suyos sin cambio); clave `colorKey ?? facet ?? label`.
- **`GTag`:** los seis casos de §«Semántica» (instantánea y roles); `pressed` ausente = no alterna (`default: null`), con y sin `v-model:pressed`; `href` gana a `pressed`; `navigate` cancelable; `remove` por botón y por Supr/Retroceso con su `source`; `disabled` en los tres cuerpos (enlace sin `href` y `aria-disabled`); `color`/`categories`/`data-cat`; atributos repartidos; los ocho avisos.
- **`GTagGroup`:** `update:items` con arreglo nuevo y referencias conservadas, con y sin `v-model`; orden de eventos (`update:items` antes del específico); huella: el elemento sale del modelo en el acto, `--_ghost-w` escrito, foco a «Deshacer», anuncio; deshacer a su sitio (vecinos que existen, que ya no existen, al final) con foco a «Quitar»; recogida con foco fuera (y `settle`); `id` que vuelve sustituye a la huella; «Quitar todas» → «Deshacer» con foco, deshacer todas en sus posiciones; foco cuando el control desaparece (siguiente equivalente, anterior, `emptyFocus` en sus tres formas, contenedor con `tabindex="-1"`); `limit` con `aria-expanded`/`aria-controls`/`hidden` y huellas en la ventana; `facets`: racimos en orden de aparición, listas nombradas por `aria-labelledby`, sueltas sin lista interior, `removeIn`/`undoIn`/`removedIn` y su caída; todas de alternar → `role="group"`; los diez avisos; región viva vacía al montar.
- **Tipos:** `src/types.test.js` con `TagItem`, eventos y `labels` (cadena y función).

### Playwright (Chromium, Firefox, WebKit; `design/lab/theme-playground/`, **puerto propio**)

`tests/tag.spec.mjs` (adaptar `design/lab/chip/r01/verificar.mjs` al componente real) y `tests/personalidad-tag.spec.mjs`: `ariaSnapshot` por caso; `aria-pressed` con clic, Espacio e Intro; nombres «Quitar X» únicos; Supr y Retroceso; **Δ0** en posición y ancho de todas las etiquetas al quitar (también con avatar, con `check` pulsada y en un racimo); vista previa tachada al apuntar y al enfocar con teclado; foco a «Deshacer» tras un **clic** en WebKit; doble clic sobre la misma tapa no quita la vecina; recogida al salir puntero y foco, y al tocar fuera; `settle` emitido; tamaños 32/24, tapa del alto, área de 44px (Chromium y WebKit con `pointer: coarse`); recorte con pista solo si recortado y estática partida; pista de «Quitar»/«Deshacer» siempre; nombre accesible igual con y sin pista; RTL (tapa, lomo, `undo-2` espejado); 320px sin desplazamiento horizontal; movimiento reducido (recogida en 0s); consola limpia.

### coco (CSS y auditoría)

Banco de estilo con los temas de §«Contraste» y 8/12 categorías (`design/lab/chip/estilo.md`); auditoría del componente real en `design/lab/chip/auditoria.md` con verificación propia `node design/lab/chip/auditoria-verificar.mjs` en los tres motores (contraste de cada fila de la tabla, §7.1 de la pulsada, lomo y raya, forma con `--g-radius-shape` en un tema con `shape: "pill"` y otro `square`, `forced-colors` en Chromium sin cambio de tamaño, cambiar el tema no deja ningún valor fijo).

### No verificado (entorno real)

Lectores de pantalla (huella, racimo, grupo vacío), táctil real, `forced-colors` real, cientos de etiquetas, C dentro de `GTable`.

## Encargos

### coco (Opus) · `GTag.css`, `GTagGroup.css`

Estética según §«Contraste», §«Tokens y movimiento» y §«Clases»; la tapa, la huella (discontinua, con `inline-size: var(--_ghost-w)`), la recogida (`is-settling`), el racimo (lomo, filos, `is-plain`, raya del pulsado), `forced-colors`, RTL y movimiento reducido; excluir `.g-tooltip` con `:where()` en todo selector estructural sobre hijos. Mide y anota en `design/lab/chip/estilo.md` los contrastes en los temas pedidos. Sin tokens nuevos; si alguno se queda corto, vuelve a lima.

### bruno (Opus) · `GTag.vue`, `GTagGroup.vue`, pruebas, `meta.json`, registro

1. `utils/categoryHash.js` (`categoryOf`) con sus pruebas; `GAvatar.vue` pasa a usarlo sin cambio de resultado.
2. `GTag.vue` y `GTagGroup.vue` según este contrato (clave interna de contexto; `useVisualTips` con opción `span`; `createLiveWriter`; huella con `--_ghost-w`; foco por programa).
3. `CAT_FAMILY_READERS` en `levels.test.js` (dos entradas, §«Color»).
4. `GTag.meta.json`, `GTagGroup.meta.json`, tipos en `packages/vue/types/`, **entrada propia `@grana/vue/tag`** (`src/tag.js`, configuración de Vite, global `GranaTag`, lo compartido por `src/shared.js`; `exports`, `typesVersions`, `ENTRIES`, `types.test.js`; `src/index.js` **no** los exporta, #510), CSS en `components.css`, compuertas en `gates.sh`, medida del peso (§«Paquete»).
5. Playground `#sec-tag` (flow con huella, facets con alternar, `limit`, `clearable`, categorías con el tema de 8, RTL) y specs de Playwright con puerto propio.

### mora-docs · `GTag/README.md` (tras la auditoría)

Desde los `meta.json`; la regla de una línea de §«Frontera», la huella y el racimo con ejemplos, la receta de `navigate` con un router y la de `settle` para borrar en el servidor; límites conocidos.
