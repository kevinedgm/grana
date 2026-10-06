# Contrato · GBtn

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/btn/r01/` (kiwi)
**Tag:** `g-btn` · **Categoría:** acciones

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` | compartida |
| `variant` | String | `solid` `soft` `outline` `ghost` `link` | `solid` | compartida |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | compartida |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor: `md`, o `pill` si el tema tiene `shape: "pill"` | compartida |
| `block` | Boolean | | `false` | compartida |
| `disabled` | Boolean | | `false` | compartida |
| `loading` | Boolean | | `false` | compartida |
| `type` | String | `button` `submit` `reset` | `button` | propia |
| `href` | String | URL | sin valor | propia |
| `icon` | Boolean | | `false` | propia |
| `loadingText` | String | texto libre | sin valor | propia |
| `tooltip` | String | texto libre | sin valor | propia (#390; atajo de `GTooltip`, `tooltip.md`) |

### Reglas de props propias

- **`type`:** se ignora cuando hay `href`.
- **`href`:** renderiza `<a>`. Con `disabled` (o `loading`), el `<a>` se renderiza **sin** `href`, con `aria-disabled="true"`, `tabindex="-1"` y `role="link"` (un `<a>` sin `href` pierde su rol de enlace; WCAG 4.1.2).
- **`icon`:** botón cuadrado (ancho = altura). Exige un nombre: `aria-label`, `aria-labelledby` o **`tooltip`** (#390); en desarrollo, si falta, se emite `console.warn`. En producción no hay advertencia.
- **`aria-disabled` del consumidor** (#236): sin `loading`, `GBtn` **respeta** el `aria-disabled` que le pase el consumidor (control enfocable que no actúa; p. ej. el disparador de voz con otra sesión activa, `speech.md` §8.2). En ese caso `GBtn` **sigue emitiendo `click`** (el consumidor decide qué hacer: explicar, mover el foco) y **no** añade `is-disabled` (el aspecto lo da `[aria-disabled="true"]` en el CSS del componente que lo usa). Con `loading`, `aria-disabled="true"` lo fija `GBtn` y gana. En `<a>` (con `href`) no cambia la regla de arriba.
- **`tooltip`** (#390, decisión del usuario del 2026-10-06; `tooltip.md` §«Atajo `GBtn tooltip`»): azúcar de `<GTooltip :text="tooltip"><GBtn …/></GTooltip>` con todo lo demás por defecto (`kind="auto"`, sin `detail`, sin atajo, lado por defecto). Para `detail`, `shortcut`, `kind` o `placement`, el envoltorio.
  - **Nombre accesible:** no cambia salvo por `kind="auto"`: sin `aria-label` (el caso de `icon`), el `tooltip` **es** el nombre (`aria-labelledby` → su texto); con `aria-label` igual, un solo nombre; con `aria-label` distinto o con etiqueta propia («Publicar»), el `tooltip` **describe** (`aria-describedby`, añadido).
  - **Estructura:** `button` (o `a`), el nodo `g-tooltip` (`role="tooltip"`, hermano, `popover="manual"`) y, si hay `loadingText`, `g-btn__status`, en ese orden. `$attrs` sigue yendo al botón.
  - **Con un `GTooltip` envolviendo el mismo `GBtn`** (hijo directo): gana el envoltorio; `GBtn` no crea el suyo y avisa en desarrollo. Un `GBtn tooltip` más adentro de lo envuelto (p. ej. en el `append` de un `GInput`) conserva el suyo.
  - Con `disabled` (nativo) el tooltip no abre (aviso de `GTooltip`: usar `aria-disabled` si el motivo importa, #236); con `loading`, sigue nombrando.
- **`loadingText`:** texto que se anuncia a lectores de pantalla cuando `loading` pasa a `true`. **Sin valor por defecto**, porque Grana es internacional: un texto fijo estaría en el idioma equivocado para la mayoría. Sin `loadingText`, solo queda `aria-busy`.

## Mecanismo de `loadingText`

**Hechos que condicionan la estructura:**

1. Los hijos de un `role="button"` son **presentacionales**: una región viva dentro del botón es ignorada por las tecnologías de asistencia. El anuncio tiene que vivir **fuera** del botón.
2. Una región viva solo se anuncia de forma confiable si **ya existe en el DOM** antes de que cambie su contenido.

**Estructura resultante:**

```html
<button class="g-btn is-loading" aria-disabled="true" aria-busy="true">…</button>
<span class="g-btn__status" role="status">Guardando…</span>  <!-- visualmente oculto; presente mientras haya loadingText (#257) -->
```

- La región `role="status"` (educada, `aria-live="polite"` implícito) se renderiza **mientras `loadingText` tenga valor** (cadena no vacía), con o sin `loading` (#257, acota #14). Está vacía mientras no hay carga. **Sin `loadingText` no se renderiza**: por contrato, sin `loadingText` solo queda `aria-busy` y la región nunca podría anunciar nada.
- Al entrar en `loading`, recibe `loadingText`. Al salir, se vacía.
- **La región existe antes del texto (#14):** si se monta con `loading` ya activo (`loadingText` y `loading` llegan en el mismo cambio), se monta **vacía** y el texto se escribe **en el ciclo siguiente** (el retardo de los canales, como `utils/liveRegion.js`), nunca en el mismo render. Si ya existía, el texto se escribe al entrar en `loading`, como hasta ahora.
- **Recomendación** (README): quien quiera el anuncio pone `loadingText` **fijo desde el principio**, no solo durante la carga.
- El nombre accesible del botón no cambia: sigue siendo su etiqueta.
- **Dentro de otros componentes que no ponen `loadingText`** (los avisos de `GToast`, la captura de voz y `GTranscript`, con un `GBtn` o dos por fila) **no hay región**: #257 sustituye a las excepciones de regiones vacías aceptadas en #149 y #227. Motivo: con `GTranscript` (320 filas → ~640 regiones `role="status"` vacías) el coste para los lectores de pantalla (cada región se registra y se recorre con el cursor virtual) y para el pintado ya no es despreciable, y una región que nunca puede recibir texto no aporta nada.
- Con `loadingText`, el componente tiene **dos nodos raíz**. Por eso usa `inheritAttrs: false` y pasa `$attrs` al botón (o enlace), no a la región.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `click` | `MouseEvent` | Activación con puntero o teclado, **nunca** con `disabled` o `loading` |

**Nota para bruno:** `click` debe declararse en `emits`. Si no se declara, el `@click` del consumidor llegaría al `<button>` a través de `$attrs` y se dispararía aunque el botón esté cargando, porque `aria-disabled` no bloquea el evento nativo.

## Slots

| Slot | Propósito | Anatomía que debe conservar |
| --- | --- | --- |
| `default` | Etiqueta (o el icono, si `icon`) | Contenido de texto; nunca elementos interactivos |
| `prepend` | Icono antes de la etiqueta | Decorativo: el componente lo envuelve con `aria-hidden="true"` |
| `append` | Icono después de la etiqueta | Igual que `prepend` |

### Tamaño del icono (#205)

El icono de un hueco se dimensiona con un **alias local `--_icon`** de `GBtn.css` (coco), en `em` del texto del botón (`--_fs`), **sin token nuevo**. Se aplica al `svg` hijo directo del hueco (`GIcon` o un `svg` del slot); otro contenido (una imagen, un logotipo) lo dimensiona la aplicación.

| Hueco | Tamaño | Nota |
| --- | --- | --- |
| `prepend`, `append` | **1.15em** (16,1px en `md`) | La misma proporción que los iconos junto a texto de `GTabs`, `GTable` y `GPagination`. Antes, 1em (14px junto a texto de 14px: el trazo visible de Lucide, ~20/24 de su caja, quedaba en ~11,7px y se leía flojo junto a la etiqueta en peso 600; auditoría de iconos de coco, hallazgo 3) |
| Slot por defecto con `icon` (solo icono) | **Mayor que el de `prepend`**; valor de coco | En `em` (sigue a `size`, **no** a `density`, que nunca cambia la tipografía); cabe dentro del botón sin tocar el borde en todos los tamaños y densidades, incluidos los de piso de 24px (`xs` y `sm` en `compact`) |
| `g-btn__loader` | `--_icon` del modo (1.15em; el de solo icono con `icon`) | El indicador de carga ocupa el lugar del icono: no encoge al cargar |

- Sin props nuevas ni clases nuevas. **Una clase de tamaño de la aplicación sobre el `GIcon` del hueco gana** (capa, #204): no se pone; el tamaño lo manda el botón (`size`).
- `GInput` (1em) y la caja de 1,1em de `GBadge` **no cambian** (auditoría, hallazgo 4).

## Tokens consumidos

| Token | Para qué |
| --- | --- |
| `--g-color-{color}`, `--g-color-on-{color}` | `solid`: fondo y texto |
| `--g-color-{color}-strong` | `solid`: hover y activo |
| `--g-color-{color}-soft`, `--g-color-on-{color}-soft` | `soft`: fondo y texto; hover de `outline` y `ghost` |
| `--g-color-{color}-text` | Texto de `outline`, `ghost` y `link`; borde de `outline` |
| `--g-color-focus` | Anillo de foco |
| `--g-radius-{rounded}` | Esquinas |
| `--g-space-1` | Unidad para altura (6, 7, 9, 11 y 13 unidades), padding y separación |
| `--g-font-ui` | Familia |
| `--g-text-caption-size` (`xs`), `--g-text-body-sm-size` (`sm`, `md`), `--g-text-body-size` (`lg`, `xl`) | Tamaño de la etiqueta |

**Tokens nuevos:** `--g-radius-shape`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset`, `--g-duration-fast`, `--g-duration-press`, `--g-duration-spin`, `--g-ease-standard`, `--g-ease-out`, `--g-press-scale`, `--g-text-action-weight`. Surgieron al escribir el CSS (coco) y se agregaron al contrato global (lima).

## Clases (contrato entre bruno y coco)

Bruno las emite; coco las estiliza. Ninguno usa otras.

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-btn` | Raíz (`button` o `a`) | Siempre |
| `g-btn--color-{color}` | Raíz | Siempre (valor del prop, incluido el defecto) |
| `g-btn--variant-{variant}` | Raíz | Siempre |
| `g-btn--size-{size}` | Raíz | Siempre |
| `g-btn--density-{density}` | Raíz | Siempre |
| `g-btn--rounded-{rounded}` | Raíz | Solo si el prop tiene valor; si no, rige `--g-radius-shape` |
| `g-btn--block` | Raíz | `block` |
| `g-btn--icon` | Raíz | `icon` |
| `is-disabled` | Raíz | `disabled` (junto al atributo nativo o a `aria-disabled` en `<a>`) |
| `is-loading` | Raíz | `loading` |
| `g-btn__prepend` | Envoltura del slot `prepend` | Si hay slot |
| `g-btn__label` | Envoltura del slot `default` | Siempre |
| `g-btn__append` | Envoltura del slot `append` | Si hay slot |
| `g-btn__loader` | `span` vacío, `aria-hidden="true"` | Siempre presente; visible solo con `is-loading` |
| `g-btn__status` | Región `role="status"`, hermana de la raíz | Mientras `loadingText` tenga valor (#257) |
| `g-tooltip` (clases de `GTooltip`, `tooltip.md`) | Nodo `role="tooltip"`, hermano de la raíz, antes de `g-btn__status` | Con `tooltip` (#390) |

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Entra y sale en el orden del documento |
| Enter | Activa (botón y enlace) |
| Espacio | Activa (solo botón) |

Sin manejadores de teclado propios: el comportamiento es el nativo.

## Personalidad (DECISIONS.md #300; lenguaje común, #299 y `tokens.md` §29)

Ronda de kiwi `design/lab/personalidad/r01/` §3 (B1 y B2, prototipadas sobre el componente real). **Solo CSS** (coco): sin props, clases, eventos ni slots nuevos; bruno no cambia `GBtn.vue`.

### B1 · Rebote al soltar

| Momento | Escala | Duración y curva |
| --- | --- | --- |
| Apretar (`:active`, mismas exclusiones que hoy: `:disabled`, `is-disabled`, `is-loading`, `--variant-link`) | `--g-press-scale` | `--g-duration-fast`, `--g-ease-out` |
| Soltar (regla base) | 1 | `--g-duration-slow`, `--g-ease-bounce` (dentro de `@supports (transition-timing-function: linear(0, 1))`; fuera, la vuelta vigente) |

- Las dos listas de `transition` son **completas** (colores + `transform`/`scale`): ninguna pierde una propiedad al cambiar de estado (defecto que corrigió el plan 004 en `GStepper`).
- Sin escala en el hover. Un tema con `--g-press-scale: 1` no tiene pulsación ni rebote.

### B2 · La etiqueta cede el sitio

- Al entrar en `is-loading`: `g-btn__label`, `g-btn__prepend` y `g-btn__append` pasan a **`opacity: 0`** con fundido (`--g-duration-fast`) y suben **`--g-space-1 × 1`** (`--g-duration-press`, `--g-ease-out`); `g-btn__loader` entra con fundido desde `× 1` **abajo**. Al salir de la carga, a la inversa. **El indicador no usa `display: none` ni `@starting-style`** (corregido por la medida del plan 015; #306): queda **siempre en el árbol de cajas** (absoluto, sin ocupar sitio) con `opacity: 0` y `visibility: hidden` y su giro **en pausa** (`animation-play-state: paused`) fuera de la carga; en `is-loading` pasa a `opacity: 1`, `visibility: visible` y el giro corre. Así **anima también la salida** (con `display: none` no hay transición de vuelta sin `allow-discrete`) y **montar ya en carga no anima nada** (#299 (4); con `@starting-style` el indicador se animaría al montar). El indicador es `aria-hidden`: ocultarlo con `visibility` no toca el nombre accesible (la regla de la etiqueta, abajo, sigue siendo `opacity` solo).
- **La etiqueta nunca se oculta con `visibility: hidden` ni `display: none`**: sigue en el árbol accesible y el nombre del botón no cambia (regla de «Mecanismo de `loadingText`»; corrección de coco `597ab17`, prueba `design/lab/theme-playground/tests/btn-loading-name.spec.mjs`). Los iconos de los huecos son `aria-hidden` y pueden ocultarse del todo al terminar el fundido.
- El ancho del botón no cambia (la etiqueta sigue ocupando su sitio).

### Movimiento reducido

Sin escala al apretar ni al soltar (como hoy). B2: solo fundido, sin desplazamiento. Colores, como hoy.

### Tokens

Además de los de «Tokens consumidos»: **`--g-duration-slow`** y **`--g-ease-bounce`** (nuevo, `tokens.md` §6 y §29). Ninguna constante de coreografía propia salvo el multiplicador `× 1` de `--g-space-1` (#299).

### Verificación (criterio de hecho: la medida de kiwi)

| Qué | Medida |
| --- | --- |
| B1 | Pulsado: escala 0,970; tras soltar, pico **≈ 1,006** (kiwi: 1,0060) y asentado en 1 antes de `--g-duration-slow`; hoy, máximo 1,0000. Con `reduce`: escala 1 siempre. Tres motores |
| B2 | Cuadros intermedios (kiwi: 5) en etiqueta e indicador; ancho Δ 0px (128,67 → 128,67); etiqueta a −`space × 1` en carga; nombre accesible en carga = la etiqueta (Chromium, árbol AX; la prueba `btn-loading-name.spec.mjs` sigue en verde). Con `reduce`: sin desplazamiento |
| Reservadas | B3 (relleno desde el punto de pulsación) y B4 (confirmación breve tras la carga, prop nueva): fuera de esta tanda |

## Resolución de hallazgos de r01

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | ¿`density` reduce la altura? | **Sí:** altura × 1, 0.875 o 0.75, con piso de 24px. Actualizado en `docs/contract/tokens.md` §4 | Una tabla compacta con botones de altura completa no gana densidad |
| 2 | ¿Texto de carga para lectores de pantalla? | Prop `loadingText` con región viva externa (ver arriba) | Decisión del usuario; mecanismo por WCAG 4.1.3 (mensajes de estado) |
| 3 | `href` + `disabled` | Regla incorporada en "Reglas de props propias" | Un enlace no tiene estado deshabilitado nativo |
| 4 | `type` fuera de la API compartida | Prop propia, por defecto `button` | Evita envíos accidentales |
