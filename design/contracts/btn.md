# Contrato · GBtn

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/btn/r01/` y `design/lab/btn/r02/` (kiwi)
**Tag:** `g-btn` · **Categoría:** acciones

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` | compartida |
| `variant` | String | `solid` `soft` `outline` `ghost` `link` | `solid` | compartida |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | compartida |
| `density` | String | `default` `comfortable` `compact` | sin valor: la región (`density.md`, #975) | compartida |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor: `md`, o `pill` si el tema tiene `shape: "pill"` | compartida |
| `block` | Boolean | | `false` | compartida |
| `disabled` | Boolean | | `false` | compartida |
| `loading` | Boolean | | `false` | compartida |
| `type` | String | `button` `submit` `reset` | `button` | propia |
| `href` | String | URL | sin valor | propia |
| `icon` | Boolean | | `false` | propia |
| `loadingText` | String | texto libre | sin valor | propia |
| `tooltip` | String | texto libre | sin valor | propia (#390; atajo de `GTooltip`, `tooltip.md`) |
| `done` | Boolean | | `false` | propia (#1011; `v-model:done`) |
| `doneText` | String | texto libre | sin valor | propia (#1011) |

### Reglas de props propias

- **`type`:** se ignora cuando hay `href`.
- **`variant="link"` (#828):** mide su contenido (`inline-size: fit-content`): en una columna flex que estira (`GSection`, `GStack`) el enlace no ocupa toda la fila con el texto centrado. **`block` gana** (a todo el ancho).
- **`href`:** renderiza `<a>`. Con `disabled` (o `loading`), el `<a>` se renderiza **sin** `href`, con `aria-disabled="true"`, `tabindex="-1"` y `role="link"` (un `<a>` sin `href` pierde su rol de enlace; WCAG 4.1.2).
- **`icon`:** botón cuadrado (ancho = altura). Exige un nombre: `aria-label`, `aria-labelledby` o **`tooltip`** (#390); en desarrollo, si falta, se emite `console.warn`. En producción no hay advertencia.
- **`aria-disabled` del consumidor** (#236): sin `loading`, `GBtn` **respeta** el `aria-disabled` que le pase el consumidor (control enfocable que no actúa; p. ej. el disparador de voz con otra sesión activa, `speech.md` §8.2). En ese caso `GBtn` **sigue emitiendo `click`** (el consumidor decide qué hacer: explicar, mover el foco) y **no** añade `is-disabled` (el aspecto lo da `[aria-disabled="true"]` en el CSS del componente que lo usa). Con `loading`, `aria-disabled="true"` lo fija `GBtn` y gana. En `<a>` (con `href`) no cambia la regla de arriba.
- **`tooltip`** (#390, decisión del usuario del 2026-10-06; `tooltip.md` §«Atajo `GBtn tooltip`»): azúcar de `<GTooltip :text="tooltip"><GBtn …/></GTooltip>` con todo lo demás por defecto (`kind="auto"`, sin `detail`, sin atajo, lado por defecto). Para `detail`, `shortcut`, `kind` o `placement`, el envoltorio.
  - **Nombre accesible:** no cambia salvo por `kind="auto"`: sin `aria-label` (el caso de `icon`), el `tooltip` **es** el nombre (`aria-labelledby` → su texto); con `aria-label` igual, un solo nombre; con `aria-label` distinto o con etiqueta propia («Publicar»), el `tooltip` **describe** (`aria-describedby`, añadido).
  - **Estructura:** `button` (o `a`), el nodo `g-tooltip` (`role="tooltip"`, hermano, `popover="manual"`) y, si hay región (`loadingText` o `doneText`), `g-btn__status`, en ese orden. `$attrs` sigue yendo al botón.
  - **Con un `GTooltip` envolviendo el mismo `GBtn`** (hijo directo): gana el envoltorio; `GBtn` no crea el suyo y avisa en desarrollo. Un `GBtn tooltip` más adentro de lo envuelto (p. ej. en el slot `action` de un `GInput`; no en `append`, que es `aria-hidden`, #397) conserva el suyo.
  - Con `disabled` (nativo) el tooltip no abre (aviso de `GTooltip`: usar `aria-disabled` si el motivo importa, #236); con `loading`, sigue nombrando.
- **`loadingText`:** texto que se anuncia a lectores de pantalla cuando la carga **se hace visible** (`is-shown`, 200 ms después de `loading`; #1014): una carga que no se ve tampoco se anuncia. **Sin valor por defecto**, porque Grana es internacional: un texto fijo estaría en el idioma equivocado para la mayoría. Sin `loadingText`, solo queda `aria-busy`.
- **`done`** (#1011): la aplicación afirma que la acción salió bien. Dispara el acuse en su **flanco** de `false` a `true`, y `GBtn` lo devuelve a `false` con `update:done` al retirarse. Reglas en «Carga y acuse».
- **`doneText`** (#1011): texto que se anuncia en `g-btn__status` durante el acuse. **Sin valor por defecto**, por la misma razón que `loadingText`. No se ve: A no tiene texto visible. Con `done` y sin `doneText`, la marca sale y se avisa en desarrollo.

## Mecanismo de `loadingText` y `doneText`

**Hechos que condicionan la estructura:**

1. Los hijos de un `role="button"` son **presentacionales**: una región viva dentro del botón es ignorada por las tecnologías de asistencia. El anuncio tiene que vivir **fuera** del botón.
2. Una región viva solo se anuncia de forma confiable si **ya existe en el DOM** antes de que cambie su contenido.

**Estructura resultante:**

```html
<button class="g-btn is-loading" aria-disabled="true" aria-busy="true">…</button>
<span class="g-btn__status" role="status">Guardando…</span>  <!-- visualmente oculto; presente mientras haya loadingText o doneText (#257, #1014) -->
```

- La región `role="status"` (educada, `aria-live="polite"` implícito) se renderiza **mientras `loadingText` o `doneText` tengan valor** (cadena no vacía), con o sin `loading` (#257, acota #14; #1014). Con `href`, `doneText` no cuenta: `done` se ignora y esa región nunca podría anunciarlo. Está vacía fuera de la carga a la vista y del acuse. **Sin ninguno de los dos no se renderiza**: solo queda `aria-busy` y la región nunca podría anunciar nada.
- Con `is-shown` (a los 200 ms; #1014) recibe `loadingText`. Una carga que no llega a verse no la escribe. A la llegada se vacía.
- **Al empezar el acuse**, se vacía y recibe `doneText` en el ciclo siguiente (`STATUS_DELAY`, 50 ms): así el mismo texto dos veces seguidas se vuelve a anunciar. Al retirarse, se vacía.
- **La región existe antes del texto (#14):** si se monta con `loading` ya activo (`loadingText` y `loading` llegan en el mismo cambio), se monta **vacía** y el texto se escribe **en el ciclo siguiente** (el retardo de los canales, como `utils/liveRegion.js`), nunca en el mismo render. Si ya existía, `loadingText` se escribe con `is-shown`. `doneText` que llega en el mismo cambio que `done` sigue la misma regla: la región se monta vacía.
- **Recomendación** (README): quien quiera el anuncio pone `loadingText` y `doneText` **fijos desde el principio**, no solo durante la carga.
- El nombre accesible del botón no cambia: sigue siendo su etiqueta.
- **Dentro de otros componentes que no ponen `loadingText` ni `doneText`** (los avisos de `GToast`, la captura de voz y `GTranscript`, con un `GBtn` o dos por fila) **no hay región**: #257 sustituye a las excepciones de regiones vacías aceptadas en #149 y #227. Motivo: con `GTranscript` (320 filas → ~640 regiones `role="status"` vacías) el coste para los lectores de pantalla (cada región se registra y se recorre con el cursor virtual) y para el pintado ya no es despreciable, y una región que nunca puede recibir texto no aporta nada.
- Con región, el componente tiene **dos nodos raíz**. Por eso usa `inheritAttrs: false` y pasa `$attrs` al botón (o enlace), no a la región.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `click` | `MouseEvent` | Activación con puntero o teclado, **nunca** con `disabled` o carga efectiva (`loading` y su cola del mínimo, #1014) |
| `update:done` | `Boolean` (siempre `false`) | Al retirarse el acuse por tiempo, clic, `loading` o `disabled`, y al montar con `done` en `true` (#1011). No sale si la aplicación ya lo puso en `false`, ni al desmontar |

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
| `--g-color-{color}-text` | Texto de `outline`, `ghost` y `link`; borde de `outline`; **contorno de `solid`** (#672) |
| `--g-color-focus` | Anillo de foco |
| `--g-radius-{rounded}` | Esquinas |
| `--g-space-1` | Unidad para altura (6, 7, 9, 11 y 13 unidades), padding y separación |
| `--g-font-ui` | Familia |
| `--g-text-caption-size` (`xs`), `--g-text-body-sm-size` (`sm`, `md`), `--g-text-body-size` (`lg`, `xl`) | Tamaño de la etiqueta |

**Tokens nuevos:** `--g-radius-shape`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset`, `--g-duration-fast`, `--g-duration-press`, `--g-duration-spin`, `--g-ease-standard`, `--g-ease-out`, `--g-press-scale`, `--g-text-action-weight`. Surgieron al escribir el CSS (coco) y se agregaron al contrato global (lima).

### Variante `solid`: contorno (DECISIONS.md #672; `tokens.md` §7.1 «Botón sólido»)

El relleno `{color}` está garantizado **con su par** (`on-{color}` ≥ 4,5:1), no **como forma** contra la página: con marcas o `primary` pálidos del CLI medía 1,43–2,73:1, y dentro de una zona de marca clara los `solid` semánticos 2,06–2,90 (segundo addendum del 2026-10-18 de `design/lab/btn/auditoria.md`). Por eso el `solid` lleva el contorno de la misma familia:

| Estado | Relleno | Texto | Contorno |
| --- | --- | --- | --- |
| Reposo, foco, `loading`, `icon` | `--g-color-{color}` | `--g-color-on-{color}` | `--g-color-{color}-text` |
| Hover, active, carga pendiente (#1014) | `--g-color-{color}-strong` | `--g-color-on-{color}` | `--g-color-{color}-text` (no `-strong`, #438) |
| Deshabilitado | El de todos los deshabilitados | El de todos los deshabilitados | **Ninguno** (transparente; 1.4.11 excluye los inactivos) |
| `forced-colors` | Sin cambio | Sin cambio | Sin cambio (`ButtonText` / `Highlight` / `GrayText`) |

- **Regla para coco:** en `.g-btn--variant-solid`, `--_border: var(--_text)` y `--_border-hover: var(--_text)`. El borde de `--g-border-width` ya existe en todas las variantes: **ni el alto ni el ancho cambian**. Sin tokens nuevos; `color="brand"` lee `primary-text` (#671).
- **Las siete familias** tienen `-text` garantizado ≥ 4,5:1 sobre `surface` por el motor (`tokens.md` §2), así que la forma queda ≥ 3:1 contra `surface`, `bg` y `surface-sunken` con cualquier tema del CLI.
- **Dentro de `data-g-zone="brand"`** (`tokens.md` §44.5) es correcto sin excepción: `brand` `solid` es la tinta invertida y su contorno `primary-text` = `on-brand-zone` = el propio relleno (Δ0); `accent` y `neutral` igual (`-text` = relleno de la zona, Δ0); los semánticos conservan su relleno de página y ganan el filo `on-brand-{sem}` (≥ 4,5:1 frente a la zona y al hundido, §44.3), que es el arreglo.
- **Tema por defecto:** `-text` = base en las siete familias, claro y oscuro: **Δ0 en reposo**. En hover aparece, mientras dura, el filo `-text` alrededor de `-strong` ya aceptado en #438; coco lo mide en el botón y lo anota.
- **Fuera de alcance:** un fondo de marca pintado a mano sin `data-g-zone` (la receta es la zona); los anfitriones que redefinen `.g-btn` sobre otra superficie (`GToast`, `GStatusIsland`, `GSpeechPill`, `GFab`) miden y reapuntan por §7.1 «Sobre otra superficie».
- **Verificación (coco):** `design/lab/theme-playground/tests/btn-limitaciones.spec.mjs`, bloques 3, 5 y 6: forma del `solid` ≥ 3:1 en reposo, hover y active en los cinco temas del CLI (T1 a T5) y en `data-g-zone="brand"` claro y oscuro, y Δ0 del color de borde frente al de relleno en el tema por defecto en reposo; las aserciones de texto y de `outline` no cambian. Antes del cambio esas aserciones de forma deben fallar (T2 1,68, T3 2,73, T5 1,43, zona clara 2,06) y después pasar.

## Clases (contrato entre bruno y coco)

Bruno las emite; coco las estiliza. Ninguno usa otras.

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-btn` | Raíz (`button` o `a`) | Siempre |
| `g-btn--color-{color}` | Raíz | Siempre (valor del prop, incluido el defecto) |
| `g-btn--variant-{variant}` | Raíz | Siempre |
| `g-btn--size-{size}` | Raíz | Siempre |
| `g-btn--density-{density}` | Raíz | Con la prop explícita, junto a `data-g-density` (#975) |
| `g-btn--rounded-{rounded}` | Raíz | Solo si el prop tiene valor; si no, rige `--g-radius-shape` |
| `g-btn--block` | Raíz | `block` |
| `g-btn--icon` | Raíz | `icon` |
| `is-disabled` | Raíz | `disabled` (junto al atributo nativo o a `aria-disabled` en `<a>`) |
| `is-loading` | Raíz | Carga efectiva: de `loading` a la llegada, con la cola del mínimo (#1014) |
| `is-shown` | Raíz | Carga a la vista: 200 ms después de `is-loading`, o desde el primer render si se monta con `loading` (#1014) |
| `is-leaving` | Raíz | `LEAVE_MS` tras una llegada con `is-shown` (F3, #1014) |
| `is-done` | Raíz | Acuse (#1011), nunca con `href` ni con `disabled` |
| `g-btn__prepend` | Envoltura del slot `prepend` | Si hay slot |
| `g-btn__label` | Envoltura del slot `default` | Siempre |
| `g-btn__append` | Envoltura del slot `append` | Si hay slot |
| `g-btn__loader` | Icono `loader-circle`, `aria-hidden="true"` | Siempre presente; visible solo con `is-shown` |
| `g-btn__done` | Icono `check`, `aria-hidden="true"` | Desde el primer acuse y para siempre; visible solo con `is-done` (#1014) |
| `g-btn__status` | Región `role="status"`, hermana de la raíz | Mientras `loadingText` o `doneText` tengan valor; `doneText` no cuenta con `href` (#257, #1014) |
| `g-tooltip` (clases de `GTooltip`, `tooltip.md`) | Nodo `role="tooltip"`, hermano de la raíz, antes de `g-btn__status` | Con `tooltip` (#390) |

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Entra y sale en el orden del documento |
| Enter | Activa (botón y enlace) |
| Espacio | Activa (solo botón) |

Sin manejadores de teclado propios: el comportamiento es el nativo.

## Personalidad (DECISIONS.md #300 y #1010; lenguaje común, #299 y `tokens.md` §29)

Ronda de kiwi `design/lab/personalidad/r01/` §3 (B1 y B2, prototipadas sobre el componente real). B1 y B2 son **solo CSS** (coco). Lo que r02 añadió está en «Carga y acuse».

### B1 · Rebote al soltar

| Momento | Escala | Duración y curva |
| --- | --- | --- |
| Apretar (`:active`, mismas exclusiones que hoy: `:disabled`, `is-disabled`, `is-loading`, `--variant-link`), y hundirse con `is-loading` (Retén, #1013) | `--g-press-scale` | `--g-duration-fast`, `--g-ease-out` |
| Soltar (regla base) | 1 | `--g-duration-slow`, `--g-ease-bounce` (dentro de `@supports (transition-timing-function: linear(0, 1))`; fuera, la vuelta vigente) |

- Las dos listas de `transition` son **completas** (colores + `transform`/`scale`): ninguna pierde una propiedad al cambiar de estado (defecto que corrigió el plan 004 en `GStepper`).
- **Soltar lo dispara también el sistema** (#1013): al quitar `is-loading` sube con esta misma regla.
- Sin escala en el hover. Un tema con `--g-press-scale: 1` no tiene pulsación ni rebote.

### B2 · La etiqueta cede el sitio

- Al entrar en **`is-shown`** (no en `is-loading`, #1014): `g-btn__label`, `g-btn__prepend` y `g-btn__append` pasan a **`opacity: 0`** con fundido (`--g-duration-fast`) y suben **`--g-space-1 × 1`** (`--g-duration-press`, `--g-ease-out`); `g-btn__loader` entra con fundido desde `× 1` **abajo**. Al salir de la carga, a la inversa. **El indicador no usa `display: none` ni `@starting-style`** (corregido por la medida del plan 015; #306): queda **siempre en el árbol de cajas** (absoluto, sin ocupar sitio) con `opacity: 0` y `visibility: hidden` y su giro **en pausa** (`animation-play-state: paused`) fuera de la carga; en `is-shown` pasa a `opacity: 1`, `visibility: visible` y el giro corre (y con `is-leaving`, mientras se funde, F3). Así **anima también la salida** (con `display: none` no hay transición de vuelta sin `allow-discrete`) y **montar ya en carga no anima nada** (#299 (4); con `@starting-style` el indicador se animaría al montar). El indicador es `aria-hidden`: ocultarlo con `visibility` no toca el nombre accesible (la regla de la etiqueta, abajo, sigue siendo `opacity` solo).
- **La etiqueta nunca se oculta con `visibility: hidden` ni `display: none`**: sigue en el árbol accesible y el nombre del botón no cambia (regla de «Mecanismo de `loadingText`»; corrección de coco `597ab17`, prueba `design/lab/theme-playground/tests/btn-loading-name.spec.mjs`). Los iconos de los huecos son `aria-hidden` y pueden ocultarse del todo al terminar el fundido.
- El ancho del botón no cambia (la etiqueta sigue ocupando su sitio).

### Movimiento reducido

Sin escala al apretar, en el retén ni al soltar. B2: solo fundido, sin desplazamiento. Colores, como hoy. Trazo de `g-btn__done`: completo desde el primer cuadro.

### Tokens

Además de los de «Tokens consumidos»: **`--g-duration-slow`** y **`--g-ease-bounce`** (nuevo, `tokens.md` §6 y §29). Constantes de coreografía propias: el multiplicador `× 1` de `--g-space-1` (#299), y `DONE_MS` y `LEAVE_MS` (#1012).

### Verificación (criterio de hecho: la medida de kiwi)

| Qué | Medida |
| --- | --- |
| B1 | Pulsado: escala 0,970; tras soltar, pico **≈ 1,006** (kiwi: 1,0060) y asentado en 1 antes de `--g-duration-slow`; hoy, máximo 1,0000. Con `reduce`: escala 1 siempre. Tres motores |
| B2 | Medido desde `is-shown`. Cuadros intermedios (kiwi: 5) en etiqueta e indicador; ancho Δ 0px (128,67 → 128,67); etiqueta a −`space × 1` en carga; nombre accesible en carga = la etiqueta (Chromium, árbol AX; la prueba `btn-loading-name.spec.mjs` sigue en verde). Con `reduce`: sin desplazamiento |
| Reservadas | B3 (relleno desde el punto de pulsación): fuera. B4 (confirmación breve tras la carga) ya no está reservada: es «Carga y acuse» (#1010) |

## Carga y acuse: A · Retén (r02; DECISIONS.md #1010 a #1015)

Ronda `design/lab/btn/r02/` (kiwi; `declaracion.md` §3 y §4). El usuario eligió el 2026-11-07 **«Solo A · Retén»**: el resultado vive en el gesto. Pulsar y acabar son las dos mitades de una misma acción: el botón se queda hundido mientras trabaja, sube con el rebote de siempre y, si la aplicación afirma el éxito, el `check` se dibuja donde estaba el giro. Sin verde, sin texto nuevo a la vista y sin otro modo.

Esta sección manda sobre lo anterior del archivo donde hablen de lo mismo; las reglas de arriba ya están enmendadas para no contradecirla.

### Fases

«Carga efectiva» es de `loading` a `true` hasta la **llegada**: si el giro se vio, `loading` a `false` y cumplidos los 400 ms del mínimo; si no se vio, `loading` a `false`. Durante toda ella `is-loading`, `aria-busy`, `aria-disabled` y la inercia siguen puestos, **también en la cola del mínimo** con `loading` ya en `false`: un botón que enseña el giro no actúa.

| Fase | Desde | Clases | Etiqueta | Indicador o marca | Escala | Fondo | Región |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Reposo | | | Visible | Oculto | 1 | Reposo y hover normales | Vacía |
| Pendiente | `loading` | `is-loading` | Visible | Oculto | `--g-press-scale` | **El de hover**, con o sin puntero (acuse inmediato) | Vacía |
| A la vista | +200 ms | `is-loading` `is-shown` | Cede el sitio (B2) | Giro | `--g-press-scale` | **El de reposo**, con o sin puntero (F1) | `loadingText` |
| Salida | Llegada | `is-leaving`, solo si se vio | Vuelve (B2) | El giro sigue mientras se funde (F3) | Sube (B1) | Reposo | Vacía o `doneText` |
| Acuse | Llegada con `done` | `is-done` | `opacity: 0` | `check` | 1 | Reposo y hover normales | `doneText` |

`is-leaving` y `is-done` pueden coincidir. El ancho y el alto no cambian en ninguna fase (Δ 0).

### Reglas del éxito

1. **Solo la aplicación afirma el éxito** (#643). `loading` a `false` sin `done` es reposo, y el rebote de subida no significa éxito: sale igual si falló o se canceló, porque dice «ya no espero», no «salió bien».
2. **Sin modos.** Durante el acuse el botón sigue siendo el botón: activable, con hover y con pulsación. Un clic cierra el acuse y actúa.
3. **Fallo = reposo sin marca.** El error lo dice la aplicación en su canal (`GForm`, `GToast`, isla). La marca de fallo queda reservada (`PENDIENTES.md` §1).
4. **Sin verde automático.** La marca usa `currentColor`: hereda los 35 pares color × variante ya auditados y `forced-colors`. Una `danger` «Eliminar» sigue siendo `danger`.
5. **Anuncio por `g-btn__status`, foco quieto.** El foco no se mueve en ninguna fase y el nombre accesible sigue siendo la etiqueta (`opacity`, nunca `visibility` ni `display`, regla de B2).
6. **Interrupciones:** la tabla de abajo.
7. **Con `href`, `done` se ignora:** lo que navega no vuelve. Sin clases, sin marca, sin anuncio, sin `update:done`, y `doneText` no crea región. Aviso de desarrollo.

Sin ticket propio (#643): `done` es la prop sobre la que un anfitrión con ticket puede apoyarse (`api.md` «Acciones con acuse»).

### `done` es un flanco, no un estado

El acuse lo dispara el paso de `done` de `false` a `true`. Seguir en `true` no lo repite ni lo alarga.

| Caso | Qué pasa |
| --- | --- |
| `done` a `true` en reposo, sin carga previa (copiar al portapapeles) | Acuse. Sin rebote: no venía hundido |
| `done` a `true` en el mismo cambio que `loading` a `false` | Acuse a la llegada |
| `done` a `true` con carga efectiva, en cualquier orden | **Espera a la llegada**: la marca nunca sale con el giro, ni antes del mínimo. Si `done` vuelve a `false` antes, no hay acuse |
| `loading` a `false` y `done` a `true` en cambios seguidos | Acuse al llegar el segundo; el rebote ya está en curso o terminado |
| **Montar con `done` en `true`** | **Reposo:** sin clase, sin marca, sin anuncio. Al montar (solo en el cliente) emite `update:done(false)` para que el modelo no se quede en `true` y la próxima afirmación sea un flanco. Motivo: el acuse dice «acaba de pasar» y un montaje no es un suceso (#299 (4)); suele ser un `v-if`, un cambio de pestaña o un estado restaurado. En el servidor no se pinta nada |
| Sin `v-model`, con `:done` | Lo mismo, pero la aplicación tiene que devolverlo a `false` con `@update:done` o por su cuenta, o no habrá otro flanco |
| Un clic cierra el acuse y la aplicación vuelve a afirmar `done` en ese mismo ciclo (una acción síncrona repetida) | **Es un acuse nuevo.** Vue no entrega el `false` intermedio a la prop: bruno lo comprueba tras el `nextTick` del clic |

`done` y `loading` al montar a la vez: gana la fila del montaje.

### Interrupciones

| Durante el acuse | Efecto |
| --- | --- |
| Pasa el tiempo (`DONE_MS`) | Se retira: `is-done` fuera, región vacía, `update:done(false)` |
| Clic o activación por teclado | Se retira **antes** de actuar: `update:done(false)` y después `click`, síncronos y en ese orden (conserva la activación del usuario). Con `type="submit"` el envío sigue |
| `loading` a `true` | Se retira con `update:done(false)` y empieza la carga |
| `disabled` a `true` | Se retira la marca con `update:done(false)`. **El anuncio no se cancela:** la región conserva `doneText` hasta `DONE_MS` |
| La aplicación pone `done` en `false` | Se retira sin emitir |
| Se desmonta | Limpia todos los temporizadores (motor, `DONE_MS`, `LEAVE_MS`, región) y no emite |

**`disabled` en el mismo cambio que `done`** (el «Guardar» que se apaga al no quedar cambios): no hay marca, pero sí anuncio, porque el éxito es cierto, y `update:done(false)` sale en el acto. Para que la marca se vea, la aplicación mantiene el botón habilitado hasta `update:done` (receta del README). Es la lectura literal de la regla 6 elegida y queda como límite: ver «Límites».

### Cuánto dura: `DONE_MS`, constante de JS

**960 ms, constante `DONE_MS` en `GBtn.vue`.** Vale `--g-duration-slow × 4` con el tema por defecto, pero **no sigue al token**: un `setTimeout` al empezar el acuse y nada más.

| Opción | Veredicto |
| --- | --- |
| **Constante de JS** | **Elegida.** Es un tiempo de percepción, no un movimiento: de la familia de `DELAY`, `MINIMUM` (#532) y `RECEIPT_MS` (#643), que no son tema. Se retira igual con `reduce`, con el botón en `display: none` y con cualquier tema |
| Leer el token | Un tema que pone las duraciones a 0 para apagar el movimiento se quedaría sin acuse: `update:done` saldría en el acto y la marca no se vería. Exigiría un piso, un lector de `ms`/`s` y `getComputedStyle` |
| Evento de CSS | Con `reduce` no hay transición que termine; con el botón oculto la animación no empieza. Un `update:done` que depende del pintado necesita de todos modos un temporizador de respaldo (como `LANDED_MS`, #589, y `HERE_MS`, #594), que aquí sería el mecanismo entero |

- **Un tema que cambia duraciones** cambia el trazo, no la permanencia. Con `--g-duration-slow` por encima de 960 ms el trazo se corta al retirarse: límite aceptado, ese valor ya incumple el tope de 240 ms (#71).
- **Es una señal de llegada** (`tokens.md` §29.10): decorativa, no bloquea, hasta 960 ms y no cuenta para el tope de una transición. No se mueve nada 960 ms: el trazo dura `--g-duration-slow` y el resto es quietud. Por eso va con `slow` y no con el `press` de «lo que se traza» de una casilla, que es respuesta a un gesto (§29.9). Sin `calc()` con multiplicador en el CSS: no hay entrada en `durationMultipliers` de `motion.json`.
- **El temporizador no se pausa,** ni con puntero, ni con foco, ni con la pestaña oculta. El puntero y el foco están sobre el botón **por construcción** después de pulsarlo: pausar por ellos es no retirarse nunca, con la etiqueta tapada. Además la marca no lleva información exclusiva: el texto va por la región y el resultado está en la página, y el botón no limita ningún tiempo de la persona (WCAG 2.2.1 no aplica). Pausar era cosa de C, que tenía texto que leer y acción que alcanzar.

### A · Retén

- **Hundido:** con `is-loading`, `transform: scale(var(--g-press-scale))` con la lista de `:active` (ida `--g-duration-fast` + `--g-ease-out`), desde el primer cuadro de la carga: con ratón enlaza con `:active` sin rebotar, con Enter se hunde solo. Resuelve F4 **en las acciones con carga**.
- **Exclusiones:** `g-btn--variant-link`, `:disabled`, `is-disabled`. Como `:active`, salvo `is-loading`, que ahora es justo lo contrario.
- **Suelta:** al quitar `is-loading` manda la regla base de B1 (`--g-duration-slow` + `--g-ease-bounce`, pico ≈ 1,006). Sin keyframes ni clase propia, y **sin otra aparición de `--g-ease-bounce` en `GBtn.css`**: `easeUses` de `motion.json` la cuenta y sigue en 1.
- **Sin `--g-press-scale`** (tema con `1`): no hay hundido ni rebote; el acuse inmediato es el relleno.
- **Movimiento reducido:** `transform: none` y lista sin `transform`.
- **Montar en carga:** hundido desde el primer render, sin transición (#299 (4)).

### F1, F2 y F3

- **F1 (coco):** con `is-shown`, hover y `:active` no cambian color, fondo ni borde: leen los de reposo. El cursor sigue en `progress`.
- **F2 (bruno y coco):** `GBtn` usa `utils/loadPhase.js`, **200 ms** y **400 ms** (#532), sin `SLOW` (F5, pendiente).
  - `is-shown` llega a los 200 ms. Una carga más corta no se ve **ni se anuncia**: la etiqueta no llega a moverse.
  - Hasta entonces el botón ya es inerte y lleva `aria-busy`, y el acuse inmediato es el hundido más el relleno de hover. El relleno cubre lo que el hundido no alcanza (`reduce`, `--g-press-scale: 1`). **`link` no tiene relleno ni hundido:** en pendiente toma el indicador de su hover (el grosor del subrayado).
  - **B2 pasa a depender de `is-shown`**, no de `is-loading`.
  - **`loadingText` se escribe con `is-shown`**, no al entrar en `loading`.
  - **El motor se crea la primera vez que hay `loading`,** nunca en `setup` si no hace falta: `GTranscript` monta cientos de `GBtn`. Un botón que nunca carga no paga motor, reactivo ni temporizadores. Se destruye al desmontar si existe.
  - **Montar con `loading`: `is-shown` desde el primer render,** sin fase pendiente, igual que hoy. No hay gesto que acusar ni parpadeo que evitar, y con retraso el giro se animaría 200 ms después sin causa. El mínimo cuenta desde el montaje en el cliente; el servidor pinta `is-loading is-shown` sin temporizadores. El motor necesita esa entrada: la añade bruno.
- **F3 (coco y bruno):** `is-leaving` se pone en la llegada solo si había `is-shown` y dura **`LEAVE_MS` = 120 ms** (constante de JS, `--g-duration-fast` con el tema por defecto; misma razón que `DONE_MS`: si un tema cambia la duración, el peor caso es cosmético). En esa clase, `animation-play-state: running` en `g-btn__loader`. Una carga que vuelve la quita en el acto.

### Nodo `g-btn__done`

- `<GIcon class="g-btn__done" name="check" />` (`GLibIcon`, `check` ya en la lista, `aria-hidden` de serie), hijo del botón, después de `g-btn__loader`.
- **Se crea con el primer acuse y se queda** (`v-if` que nunca vuelve a falso). Un botón sin acuses tiene el mismo DOM que hoy, también en `GTranscript`. No depende de `doneText`.
- **Trazo:** bruno pone `pathLength="1"` en su `path` con `setAttribute` al crearlo. El icono de Lucide no se toca, ni `lucide.js` ni `GLibIcon`.
- **El dibujo son keyframes, no transición (corrige el prototipo):** `g-btn-done…`, `--g-duration-slow` + `--g-ease-out`, bajo `is-done`. Es una reacción única a un suceso y nunca se reproduce al montar (§29.4). Por tres razones: el nodo nace en el mismo render que `is-done` y una transición no tendría estado de partida; en reposo el trazo queda **completo** y lo oculta la opacidad, así que al retirarse funde una marca entera (en el prototipo, el `dashoffset` saltaba al quitar la clase y la salida no se veía); con `reduce`, `animation: none` y ya está.
- **Colocación:** la del indicador (`--_icon` del modo, centrado, absoluto). Opacidad con `--g-duration-fast`. Con `is-done`, `g-btn__label`, `g-btn__prepend` y `g-btn__append` a `opacity: 0`.
- **Movimiento reducido:** trazo completo desde el primer cuadro, se queda el fundido (§29.3).

### Avisos de desarrollo

Guarda canónica de #653, en el sitio del texto, al empezar un acuse o ignorarlo:

| Condición | Texto |
| --- | --- |
| Acuse sin `doneText` | `[Grana] <GBtn done> sin doneText: la marca se ve, pero no se anuncia a los lectores de pantalla.` |
| `done` con `href` | `[Grana] <GBtn done> con href: lo que navega no vuelve, done se ignora.` |

Montar con `done` no avisa: es legítimo (un `v-if` durante un acuse).

### Peso (#1015)

`GBtn` no puede salir del principal, así que esto no es una entrada nueva sino una extensión con compuerta propia, medida con `gzip -9` sobre `dist/`, antes y después en el mismo árbol:

| Qué | Tope | Nota |
| --- | --- | --- |
| `dist/grana.js` | **+1024 B** | El motor ya está en el principal por `GTable` y no cuenta |
| `dist/grana.css` | **+768 B** | Prototipo: 482 B de base + 192 B de A = 674 B |
| `GBtn` importado solo | Se registra, sin tope | Ahora arrastra el motor. En `GBtn.meta.json` `bundle.measured` |
| Entradas propias | Sin crecer más de 64 B | `GBtn` les llega por `__shared` |

Se mide aparte del lote de la tabla de movimiento (#1009), con su propio antes y después. Si se pasa: primero se recorta (texto de los avisos, ramas); si sigue, vuelve a lima y decide el usuario. **El tope no se sube** (#963, #964).

### Rúbrica de movimiento

Contexto: web, ratón, teclado y toque; uso frecuente; interacción momentánea. Parte de `declaracion.md` §5; aquí, lo que el contrato cierra. H no aplica.

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| A. Propósito | Cumple | Hundido = trabajando, subida = ya no espera, trazo = la aplicación confirma; una reacción por suceso | Bajo | Sin añadidos |
| B. Comodidad visual | No verificable | La escala sostenida puede suavizar el borde a 1× en esperas largas | Bajo | coco mide nitidez con carga larga |
| C. Estabilidad | Parcial | 3 % fijo, sin oscilación; en `block` muy ancho el borde recorre más | Bajo | coco mide en `block` a 1280 px |
| D. Transiciones | Cumple | Toda interrupción contratada; curvas por transición; estado temporal limitado a `is-leaving` e `is-done`, con limpieza | Bajo | V7 |
| E. Control | Cumple | Sin bloqueo en el acuse, foco quieto, sin espera forzada salvo la cola del mínimo (≤ 400 ms) | Bajo | Ninguna |
| F. Accesibilidad | Parcial | Reducido sin escala, marca en `forced-colors`, `doneText` con aviso. Sin texto visible. Lector real: No verificable | Medio | Probar en entorno real |
| G. Rendimiento | Cumple | Solo `transform`, opacidad y un trazo; coste cero en reposo; compuertas de peso | Bajo | V10 |

### Verificación

**Medida de cierre:** la tabla de `declaracion.md` §1 repetida sobre el `GBtn` real de `dist/` en Chromium, Firefox y WebKit.

| Medida de kiwi | Hoy | Debe dar |
| --- | --- | --- |
| Carga de 100 ms: cuadros con etiqueta por debajo de 0,5 | 7 / 8 / 6 | **0** |
| Fondo `solid` a la vista, sin puntero y con puntero | rgb 31 → 51 | **Δ 0** |
| Enter en una acción con carga: escala mínima | 1 | **0,970** |
| Región `role="status"` al terminar con `done` | vacía | **`doneText`** durante el acuse, vacía después |

Casos del spec nuevo `design/lab/theme-playground/tests/btn-reten.spec.mjs` (bruno; tres motores, `GBtn` real del UMD) y de `GBtn.test.js`:

| # | Qué | Criterio |
| --- | --- | --- |
| V1 | Hundido | 0,970 sostenido con `loading`, ida 120 ms; escala 1 en `link`, `disabled` y con `reduce` |
| V2 | Suelta | Sin puntero: pico 1,006 ± 0,0005, asentado antes de 240 ms, con la medida determinista de B1. Con `reduce`, 1 siempre |
| V3 | F1 y relleno | En las cinco variantes: a la vista, fondo igual con y sin puntero; pendiente, fondo = hover sin puntero |
| V4 | F2 | 100 ms: etiqueta a 1, giro a 0 en todos los cuadros y región sin escribir. 1,2 s: `is-shown` a 200 ms y texto en región. `loading` a `false` a los 250 ms: giro a la vista al menos 400 ms, `click` ignorado en la cola |
| V5 | F3 | Con `is-leaving` la rotación del indicador avanza entre dos cuadros; después, pausada (kiwi solo lo revisó a ojo) |
| V6 | Acuse | `is-done` a la llegada, retirada a 960 ms ± 50, `update:done(false)` **una sola vez**, `doneText` en la región y después vacía; repetir el mismo texto se reescribe |
| V7 | Interrupciones y flancos | Cada fila de las dos tablas, con el orden `update:done` → `click` y sin temporizadores tras desmontar |
| V8 | Estabilidad | Ancho y alto Δ 0 entre las cinco fases, con `icon`, `block` y RTL; foco quieto; nombre = etiqueta en las cinco (Chromium, árbol AX) |
| V9 | Montaje y servidor | Con `done`: sin `is-done`, sin `g-btn__done` ni texto y un `update:done(false)`. Con `loading`: cero transiciones. `renderToString`: sin `g-btn__done`, sin emitir |
| V10 | Reposo | `createLoadPhase` sin llamar en un botón que no carga; sin `g-btn__done` ni `g-btn__status` en `GTranscript`; `tests/speech-f2-perf.spec.mjs --workers=1` dentro de sus topes |
| V11 | Tema | Marca ≥ 3:1 sobre su fondo en los 35 pares, cinco temas del CLI y zona de marca, claro y oscuro; `forced-colors`; `--g-press-scale: 1` y `--g-duration-slow: 0ms` siguen retirándose a 960 ms |
| V12 | Reducido | Sin keyframes del trazo, marca completa desde el primer cuadro, retirada a 960 ms |
| V13 | Avisos | Los dos textos en desarrollo y ninguno en producción (`src/devWarnings.test.js`, `node design/lab/avisos-dev/verificar.mjs`) |

**Specs existentes que cambian:**

| Archivo | Qué |
| --- | --- |
| `tests/personalidad-btn.spec.mjs` | `seekB2`: tras `__setLoading(true)`, esperar `is-shown` antes de pausar las transiciones (nacen a los 200 ms). Tras `__setLoading(false)`, esperar a la llegada (cola del mínimo). «Sin rebote en disabled, loading ni link» se parte: `disabled` y `link` siguen a escala 1; `loading` pasa a medir 0,970. El conteo en tiempo real necesita ventana de ~520 ms. «Montar ya en carga no anima nada» no cambia |
| `tests/btn-loading-name.spec.mjs` | Sus aserciones no cambian: monta con `loading`, y eso sigue siendo `is-shown` desde el primer render. Se añaden dos casos: nombre en pendiente y en `is-done` |
| `GBtn.test.js` | `loadingText` a los 200 ms, con temporizadores falsos; `loading` a `false` con la cola del mínimo en las pruebas que montan cargando |

Los `tests/speech*.spec.mjs` que cuentan `g-btn__status` no cambian: sin `loadingText` ni `doneText` sigue sin haber región.

### Límites

- **Sin texto visible:** quien mira a otro lado puede perder la marca. Es el coste aceptado de A; lo cubre que la aplicación cambie algo en la página. En botones cuyo resultado no se ve en ningún otro sitio, la aplicación usa además su canal.
- **`disabled` en el mismo cambio que `done`:** sin marca. Ver «Interrupciones».
- **Cola del mínimo:** tras un fallo, el botón puede tardar hasta 400 ms en reaccionar si el giro se vio.
- **`tooltip` y hundido:** `GTooltip` mide la caja escalada si abre durante la carga (3 % menos). coco lo comprueba.
- **No verificado hasta la auditoría:** lector real, toque real, `:active` en iOS, `forced-colors` real, nitidez sostenida.

## Densidad por región (pieza 2; `density.md`, #974 a #982)

- Sin `density`, el botón sigue la región (`data-g-density` más cercano › `<html>` › tema › `default`); con `density`, su raíz lleva `data-g-density` y la clase. Dentro de `GTable`, `GCard`, `GDialog`, `GForm`, `GStack`… con prop, el botón la sigue (B, #975): para salir, `density` en el botón.
- **Límite (L6, #978):** con puntero grueso, una región o el valor global **ceden** a `default` (el botón visible mide 36 con el tema por defecto). Con la **prop explícita** `compact` no cede: el botón **se ve** de 27 px (su 44 px táctil es el área `::after`, invisible) junto a un campo de 44 px en la misma barra. Es deliberado (la instancia lo pidió); para una barra coherente en táctil, usar región y no prop.

## Resolución de hallazgos de r01

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | ¿`density` reduce la altura? | **Sí:** altura × 1, 0.875 o 0.75, con piso de 24px. **Nota (#667):** la altura se redondea a 0,5px con `round()` bajo `@supports` (`--_snap: 0.5px`), antes del piso de 24px; alcance solo `GBtn`. Actualizado en `docs/contract/tokens.md` §4 | Una tabla compacta con botones de altura completa no gana densidad |
| 2 | ¿Texto de carga para lectores de pantalla? | Prop `loadingText` con región viva externa (ver arriba) | Decisión del usuario; mecanismo por WCAG 4.1.3 (mensajes de estado) |
| 3 | `href` + `disabled` | Regla incorporada en "Reglas de props propias" | Un enlace no tiene estado deshabilitado nativo |
| 4 | `type` fuera de la API compartida | Prop propia, por defecto `button` | Evita envíos accidentales |
