# Declaración de cumplimiento · GCard · r01

**Estado:** en revisión. Fuente de verdad: `brief.md` de esta ronda.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises, iconos solo Lucide (`design/lab/lucide-icons.js`).
**Siguiente dueño:** lima -> `design/contracts/card.md` (y, por el hallazgo 1, una nota en `design/contracts/surface.md`).
**Prototipo:** `index.html` (15 secciones funcionales; una fábrica genera todas las composiciones con el mismo marcado).
**Convención:** «propuesta kiwi pendiente de visto bueno» = recomendación que se asume si el usuario no responde. Los valores de color, grosor, radio, sombra, duración y curva del prototipo son de wireframe, **no** propuestas.

## 1. Decisión estructural (decidida por kiwi, derivada de estándares y de lo ya decidido)

**Una sola primitiva `GCard`, compuesta sobre `GSurface`, con regiones por slots y props de atajo; sin subcomponentes; y una acción principal por «enlace estirado» con elemento real.** Las seis decisiones:

| # | Pregunta | Decisión | Fundamento |
| --- | --- | --- | --- |
| 1.1 | ¿Qué relación con `GSurface`? | **`GCard` compone `GSurface`** (no la extiende ni la copia): la raíz es una `GSurface` (`as="article"` por defecto) y le pasa `level`, `density`, `rounded` y el relleno. **Lo que no duplica:** fondo, borde, sombra, escala de relleno, `density`, radio concéntrico y tono relativo de la `inset` (todo eso es de `GSurface`, #99). **Lo que añade:** regiones, orden del DOM, acción principal, selección, estado, medición del propio tamaño. `level` de la card = `flat` · `outlined` · `raised` · `inset` (el «elevated» del brief es `raised`; `floating` no se expone: es de superficies flotantes). `interactive` y `selected` **no son niveles**: son comportamiento y estado (§3, §4), así que cambian el aspecto sin tocar la estructura | `surface.md` dice «una tarjeta pulsable será otro componente»; un solo lenguaje de profundidad (#99); estructura y variantes de superficie separadas (brief) |
| 1.2 | ¿Una Metric Card es un componente? | **No: es `GCard` + `GMetric` en el slot por defecto** (más un gráfico pequeño en un slot con `role="img"`). El título de la card es la etiqueta de la métrica (el prototipo la enlaza con `aria-labelledby` del grupo para no duplicar el nombre) | #72/#74 (el contenido va en slots, sin catálogo de tipos); la métrica domina por su tamaño, no por una estructura propia |
| 1.3 | ¿Qué relación con `GWidget`? | **Independientes en v0.1.** `GWidget` sigue siendo la carcasa de **dashboard** (mide ancho y alto, tres niveles de detalle `s`/`m`/`l`, estados `populated`/`loading`/`empty`/`error`/`stale`/`disabled`, rejilla, galería, configuración). `GCard` es la primitiva **general** (media, orientación, interacción, selección) y se **reorganiza** en vez de ocultar zonas. Solapan en eyebrow/título/descripción/badge/menú/pie/esqueleto/vacío/error: eso se resuelve igual (mismo vocabulario, `GMenu`, `GBadge`, `labels` sin valores) pero **no se migra** `GWidget` ahora (mismo criterio que #99: la primitiva primero, la migración en ronda propia). Ver pregunta 3 | Alcance de #72–#76 ya entregado; una carcasa que oculta partes por nivel y una tarjeta que las recoloca son comportamientos distintos |
| 1.4 | ¿Y `GCheckbox layout="card"`? | **Complementarias, no duplicadas.** `GCheckbox card` es un **campo de formulario** (toda la tarjeta es su `<label>`, sin contenido interactivo dentro, #36). `GCard` seleccionable es una **tarjeta de contenido con acciones** en la que la selección es un control más. Regla: si solo se elige un valor y no hay otra acción, `GCheckbox card`; si hay media, metadata o acciones, `GCard` | #36 prohíbe interactivos dentro del `<label>`; esta ronda necesita acciones internas |
| 1.5 | ¿Subcomponentes (`GCardHeader`, `GCardMedia`…) o solo slots? | **Solo slots y props de atajo en un único `GCard`.** Orden, posición de la media, orden de foco y reorganización por contenedor los gobierna la card: un consumidor que montara las regiones a mano podría romper el orden DOM y el enlace estirado | #44 (un solo componente, composiciones por props y slots), #67 (sin `GSidebarItem`), #109 (columna compuesta por slots) |
| 1.6 | ¿La card entera es un botón? | **Nunca.** La acción principal es un `<a>` o `<button>` **dentro del título** cuyo `::after` cubre la card; las demás acciones van por encima, hermanas | Un `<button>` solo admite contenido de frase y aplana a sus hijos; una card con varios controles no puede ser un control (brief, APG, WCAG 4.1.2). Ver §4 |

**Consecuencia para las doce composiciones:** Basic = header+content; Content = + eyebrow/subtítulo/lista/pie; Media = + media; Entity = + lead/badge/meta/acciones; Profile = lead avatar + meta + acciones; Metric = content con `GMetric`; Status = status + badge + pie con enlace secundario; Interactive = principal enlace + secundarias + menú; Selectable = casilla real; Horizontal = media lateral + `orientation="auto"`; Action = principal botón; Inset = `level="inset"`. Cada celda del prototipo muestra las regiones que realmente tiene (calculadas del DOM).

## 2. Anatomía y regiones

Orden del DOM (es también el orden de lectura y de foco): `[media top/start]` -> `main` { `body` { `stack` { `header` { casilla · lead · titles (eyebrow, **título con la principal**, subtítulo) · aside (badge, indicador «actual», menú) } · `content` (media inline, descripción, estado, vacío, slot por defecto) · `meta` (`<dl>`) · `more` (secundario plegable) } · `actions` } · `footer` } -> `[media end]` · `[media background]` (primer hijo, detrás con escrim).

| Región | Slot / prop | Opcional | Nota |
| --- | --- | --- | --- |
| Raíz | `as` (`article` defecto, `li`, `div`, `section`) | No | `GSurface`. En colecciones: `ul > li > article` o `ul > li.g-card` (modo lista) |
| `media` | slot `media` + `mediaPosition` (`top` · `start` · `end` · `background` · `inline`) | Sí | Decorativa (`aria-hidden`) o informativa (`role="img"` con nombre); la media **no** es un control: el clic en ella activa la principal. `inline` se renderiza **dentro** del cuerpo (decisión de render, no de CSS) |
| `lead` | slot `lead` (icono) / `avatar` | Sí | Decorativo (`aria-hidden`); el nombre lo da el título. Avatar: ver pregunta 1 |
| `eyebrow`, `title`, `subtitle` | props o slots | Título: **obligatorio** (nombre) | `headingLevel` 2 a 6, defecto 3 (como `GWidget`); aviso si falta |
| `aside` | `badge` / slot `badge`, `menu` | Sí | Badge con **forma y texto**; menú = `GMenu` (§4) |
| `description` | prop o slot | Sí | Recorte por `descriptionLines`; «Mostrar más» solo si realmente se recorta |
| `status` | `status` (`info` `success` `warning` `error`) + texto | Sí | Icono + texto + marca de borde; **no** solo color |
| contenido libre | slot `default` | Sí | `GMetric`, `GProgress`, `GDataList`, listas, gráfico (con `role="img"`) |
| `meta` | `meta` (`[{ label, value, priority? }]`) o slot | Sí | `<dl>`; los de prioridad baja desaparecen en `compact` |
| `more` | slot `more` | Sí | Región secundaria que en **estrecho** se pliega con disclosure |
| `actions` | slot `actions` (`GBtn`) | Sí | Principal · secundarias · terciarias · solo-icono (§6); anclado al fondo (alturas iguales) |
| `footer` | slot `footer` | Sí | Línea fina de separación; metadata, marcas de tiempo, estado, **navegación secundaria** |
| `inset` | slot (cualquiera) con `GSurface level="inset"` | Sí | Resumen/métricas/estado con radio concéntrico (§9) |

El **orden de las regiones es de la card**; solo cambia su **colocación** por contenedor (§7).

## 3. Estados

Cambian poco la superficie y **ninguno cambia el tamaño**.

| Estado | Representación | No solo color / forma |
| --- | --- | --- |
| Default | | |
| Hover | Solo con puntero real y solo si el puntero está sobre la principal (no sobre una acción interna): fondo y borde, **sin transformación** | Cambio de fondo + borde; hover desaparece al pasar a una acción interna (la acción manda) |
| Focus | Anillo **sobre toda la card** (el `::after` del título) con `:focus-visible`; las acciones internas llevan su propio anillo | Anillo continuo, distinto de selected |
| Pressed | Fondo un paso más fuerte mientras se pulsa la principal | |
| Selected | `aria-checked` nativo (casilla/radio) o `aria-pressed`; `aria-current="true"` si es el elemento actual de una lista | **Borde de doble grosor + casilla marcada con icono (check/círculo) + fondo**; distinto de hover y de focus |
| Disabled | `<a role="link" aria-disabled="true">` **sin `href`** (no enfocable, sigue leyéndose), botones `disabled`, casilla `disabled` | Atenuada + tachado del título (las exenciones de contraste de WCAG aplican; propuesta, ver §14) |
| Loading | `aria-busy="true"`, región `role="status"` **que ya existe** antes del cambio, y un **esqueleto con la misma anatomía** (media, lead, título, subtítulo, N líneas de descripción, metadata, acciones y pie, cada uno con la altura de línea real); no hay controles enfocables | Forma de las líneas, no una caja gris; la altura no cambia (verificado en cuatro composiciones) |
| Error / warning / success | `status` con icono (`circle-alert` · `triangle-alert` · `circle-check`) y texto; el error de carga lleva `role="alert"` y «Reintentar» | Icono + texto + borde de inicio de distinta forma (sólido/discontinuo); sin color |
| Empty | Slot `empty` (icono, mensaje, acción) dentro del área de contenido; el encabezado se conserva | Texto |

`error`, `warning` y `success` son **estados de contenido de la card** (no de un campo): su mensaje va en el cuerpo, no en el borde.

## 4. Interacción

**Modelo (una sola activación principal por card):**

| Modelo | Elemento principal | Qué cubre | Notas |
| --- | --- | --- | --- |
| Navegable | `<a href>` en el título (`navigate` cancelable, como #70) | Todo el clic en la card | Clic derecho, «abrir en pestaña», arrastrar enlace: **funcionan** (es un enlace real). `aria-describedby` apunta a la descripción |
| Acción | `<button>` en el título | Una card con un solo propósito (Action Card) | Sigue siendo el **título** (un encabezado puede contener un botón; un botón no puede contener un encabezado) |
| Seleccionable | `<input type="checkbox\|radio">` real; el **título es su `<label>`** | La card entera es la etiqueta | Casilla/radio de verdad: estado, formulario y teclado nativos. Radio: `role="radiogroup"` del consumidor, `name` común, flechas nativas |
| Alternar | `<button aria-pressed>` en el título | Filtros, preferencias | Para estado **de la interfaz**, no un valor de formulario |
| Navegable + casilla | Enlace en el título + casilla **explícita** por encima | Abrir una cosa y elegir otra a la vez | La casilla va **antes** del título en el DOM (Tab: casilla -> título) |
| Varias acciones | Principal + `actions` + `menu` | Cards ricas | Las demás acciones **no** activan la principal (verificado) |

**Reglas:** (1) **Navegar y seleccionar con toda la card son excluyentes** (un solo clic principal): la combinación se hace con la casilla explícita; el aviso en desarrollo lo comprueba. (2) Nada interactivo dentro de otro (verificado: 0 anidados en las 90 cards). (3) **Por encima del estirado** va todo control que no sea la principal: la regla es genérica (`a`, `button`, `input`, `select`, `textarea`, `summary`, `label`, `[tabindex]` dentro de la card que no sea la principal) para que también valga con contenido libre del consumidor. (4) El enlace estirado **impide seleccionar texto con el puntero** dentro de una card navegable (concesión asumida: el brief pide «clic en toda la Card»; la alternativa es un enlace «Abrir» explícito). (5) El hover solo existe si la principal está bajo el puntero. (6) La media decorativa **no** es interactiva; un control dentro de la media (reproducir) sería un interactivo más, por encima.

**Menú contextual:** el del brief es el **menú de acciones** (botón de tres puntos, patrón *Menu Button* de APG) con **`GMenu`** (`menu` = `items` de `GMenu`; el disparador lo pone la card con `labels.menu` + título como nombre). Un menú de clic derecho **no** entra: `GMenu` no lo cubre (#82–#84) y no es accesible por sí solo; si algún día se añade, debe **duplicar** el menú de botón. El menú está en la capa superior (popover), así que el `overflow` de la card no lo recorta (probado con el menú del prototipo).

## 5. Teclado y orden de foco

| Contexto | Teclas |
| --- | --- |
| Card navegable / de acción | **Tab** entra en el título (el anillo cubre la card); **Enter** activa el enlace, **Enter o Espacio** el botón |
| Card con varias acciones | Orden **del DOM**: [casilla] -> título -> menú -> acciones (principal, secundarias, solo-icono) -> controles del contenido -> enlace del pie. Verificado: `primary, menu, action:open, action:share` |
| Seleccionable | **Espacio** (checkbox) marca/desmarca; en un grupo de radios, **Tab** entra en el seleccionado y las **flechas** mueven la selección (nativo) |
| Alternar | Enter o Espacio cambian `aria-pressed` |
| Menú de acciones | **Enter/Espacio/↓** abren (primer ítem), **↑** abre (último); ↑/↓/Inicio/Fin con vuelta; deshabilitados siguen enfocables; **Esc** cierra, devuelve el foco al botón y **no llega** a un ancestro (un `GDialog`); **Tab** cierra |
| Lista de cards | Sin *roving tabindex*: es una lista de enlaces; Tab recorre enlace -> menú de cada fila |
| «Mostrar más» / «Más detalles» | Botones; `aria-expanded` + `aria-controls`; se anuncian al activar |

Una acción interna con foco **no** activa la principal; Enter en el título **no** abre el menú. El orden visual coincide con el del DOM (la media `end` se coloca arriba en columna con `order`, solo visual y decorativa; el modo lista usa `order` para poner la metadata antes del menú: ver §14 sobre el orden de lectura).

## 6. ARIA

- Raíz: `article` (o `li`). **Con título y principal propia** no lleva `aria-labelledby` (el enlace ya da el nombre y se evita «artículo, Título … enlace, Título»); sin principal se nombra por su título. *Propuesta pendiente de verificar con lector real* (§13).
- Título: `h2` a `h6` que **contiene** `<a>`, `<button>` o `<label>`; el nombre del enlace es el título; `aria-describedby` -> descripción (opcional). `aria-current="true"` en el enlace del elemento actual (lista maestro-detalle).
- Selección: `<input>` nativo (`aria-labelledby` -> título si la etiqueta no es el título); alternar: `aria-pressed`. **Sin** `aria-selected` (no es un `option`/`tab`).
- Estados: `aria-busy` en carga; región `role="status"` oculta presente desde el montaje con `labels.loading`; `role="alert"` en el error de carga (solo cuando aparece); disabled: `aria-disabled` en el pseudo-enlace, `disabled` en el resto.
- Solo iconos: botón con `aria-label` **obligatorio** (aviso en desarrollo si falta; verificado). El tooltip visible sigue siendo la pregunta abierta de `GTabs r02` (no se resuelve aquí).
- Iconos, lead, escrim y marca de «actual»: `aria-hidden`. Media informativa: `role="img"` + nombre; decorativa: `aria-hidden`.
- Métrica: el grupo `role="group"` con `aria-labelledby` al título; la tendencia lleva icono **y** texto (`GMetric`, #74).
- Región plegable: botón con `aria-expanded`/`aria-controls`; plegada = `hidden` (fuera del árbol de accesibilidad).
- Sin textos por defecto (`labels`: `menu`, `loading`, `expand`, `collapse`, `more`, `less`, `retry`), como #70, #73 y #97.

## 7. Responsive por contenedor (un solo sistema)

- **Mecanismo:** `ResizeObserver` sobre la propia raíz -> `data-size` (`wide` ≥ `--g-space-1 × 130` = 520px · `medium` ≥ `× 80` = 320px · `narrow` por debajo) y `data-layout` (`row`/`column`). **No** `@container` ni `@media` con valores fijos: una consulta de contenedor no admite `var()` (#34, #39) y esta familia ya mide (`GWidget` #73, `GSidebar` #69, `GStepper` #98, `GTable` #109). Los umbrales derivan de `space`, sin excepción nueva a §7 de `tokens.md`.
- **Orientación** (`orientation`): `vertical` (siempre columna), `horizontal` (fila mientras no sea `narrow`) y `auto` (fila solo en `wide`). Con media lateral se usa `auto`.
- **Amplio:** media lateral (o lead) + contenido + acciones al final (columna). **Intermedio:** media arriba + contenido; acciones debajo. **Estrecho/móvil:** columna simplificada, acciones **apiladas a ancho completo** (≥ 40px; 44px táctil), la media lateral pasa arriba y `more` se pliega. La adaptación es del **espacio de la card**, no del dispositivo: en un visor de escritorio, la card de un sidebar es `narrow` y la del área principal es `wide` (verificado), y en un `GDialog` de 360px o de 680px también (verificado).
- **Requisito:** la card debe tener un **ancho definido por su contenedor** (`inline-size: 100%`), no por su contenido, para que medir no dependa de su propio contenido. Documentar.
- **Rejilla:** `align-items: stretch` = alturas iguales (acciones y pie anclados al fondo); `start` = naturales. La card no sabe cuántas columnas hay. Alinear regiones entre cards (títulos y acciones a la misma altura) con `subgrid`: **no incluido** (§13).
- **Densidad** (`density`): la compartida `default`/`comfortable`/`compact` (1×, 0.875×, 0.75×; el `spacious` del brief es `default`, #114). Cambia relleno, separación, tamaño de la media lateral y la metadata de prioridad baja; **no** la semántica ni la tipografía; objetivos ≥ 24px siempre, 44px en táctil.
- **Lista (tipo `ListItem`):** `orientation="horizontal"` + `density="compact"` + `level="flat"` + raíz `li`: lead + título/subtítulo + metadata + menú en una fila, radio menor y línea fina entre filas. **No hay `GListItem`**: la lista es `GCard`.
- **Táctil/móvil:** objetivos ≥ 44px con `pointer: coarse` (verificado con el interruptor), anillo visible, información secundaria plegable.

## 8. Contenido: truncado, vacío, carga

- **Truncado:** `titleLines` y `descriptionLines` (1 a 4 o `none`); recorte con `line-clamp`; el texto completo sigue en el DOM. «Mostrar más» aparece **solo** si hay recorte (verificado: visible, visible, sin, oculto) y alterna `aria-expanded`. Un título de 120 caracteres con `1` línea pierde información visible: el valor por defecto sugerido es `2` y `none` queda disponible.
- **Vacío:** slot `empty` (icono, mensaje, acción). La métrica sin datos deja su sitio al vacío sin cambiar el encabezado.
- **Carga:** ver §3. La forma del esqueleto sigue lo que la card **declara** (regiones presentes y líneas esperadas); ver hallazgo 8.

## 9. Jerarquía de superficies

- Una card es un nivel de superficie (`GSurface`); una región `inset` dentro es el **segundo** nivel y toma **radio concéntrico** (radio de la card − su relleno; en el prototipo, `max(4px, r − pad)`).
- **Máximo dos pasos de tono:** un `inset` dentro de otro se aplana (solo contorno); un tercero no se admite. **Card dentro de Card dentro de Card** -> aviso en desarrollo (verificado) y la guía es una región `inset` o una lista.
- La card `inset` sobre una superficie hundida (Inset Card) toma el tono contrario al padre (`surface.md`); el relleno de la card **entra en el cálculo** del radio de sus hijas (hallazgo 1).
- Jerarquía visual (brief): 1 información principal (título, valor de la métrica) · 2 estado o métrica · 3 metadata · 4 auxiliar (`more`, pie) · 5 acciones secundarias. Por tamaño y peso, no por color.

## 10. Qué reutiliza y qué no

| Reutiliza | Para |
| --- | --- |
| `GSurface` | Superficie, relleno, `density`, `rounded`, radio concéntrico |
| `GMenu` | Menú de acciones (`menu`) |
| `GBadge` | Badge (texto con forma) |
| `GMetric`, `GProgress`, `GDataList` | Contenido de las composiciones Metric, Status, Entity |
| `GBtn` | `actions`, «Reintentar», acciones del pie |
| `GIcon` | Los iconos internos (§11, hallazgo 9) |
| Dibujo de `GCheckbox` | Casilla/radio de la selección (si no es separable, coco repite el dibujo sobre el `<input>` nativo) |
| Patrón de medición | `ResizeObserver` + `data-*` (`GWidget`, `GSidebar`, `GTable`) |

| No duplica / no hace | Razón |
| --- | --- |
| Fondo, borde, sombra, radio, escala de relleno | Son de `GSurface` |
| Menú contextual de clic derecho | `GMenu` no lo cubre; no es accesible solo |
| Tabla de datos en tarjetas | `GTable` mantiene su modo tarjetas (#109) |
| Campo de formulario en tarjeta | `GCheckbox layout="card"` (#36) |
| Dashboard con niveles de detalle, rejilla y configuración | `GWidget` (#72–#76) |
| Avatar, tooltip, imagen, gráfico, mapa, vídeo | Del consumidor por slot (avatar: pregunta 1) |
| Grupo de selección (`GCardGroup`) | Pregunta 2 |

## 11. Hallazgos para lima (API propuesta y tokens necesarios, sin valores)

| # | Hallazgo | Severidad | Propuesta |
| --- | --- | --- | --- |
| 1 | **Relleno de `GSurface` y regiones a sangre** | Alta | La media y el pie **sangran** hasta el borde, pero el relleno de la `GSurface` es parte del radio concéntrico de sus hijas (`surface.md`). Opciones: (a) `GSurface padding` = relleno de la card y la media/pie sangran con margen negativo derivado de una propiedad **publicada** (hoy los alias son privados `--_*`); (b) `GSurface padding="none"` y `GCard` define el relleno por región y **publica** el mismo alias que lee la `inset`. Kiwi recomienda (b) con una propiedad pública documentada (nombre y valor de lima/coco). Resolver también el **límite conocido** de `surface.md` («una no-inset dentro de una inset»), que aquí ocurre con la card sobre una superficie hundida |
| 2 | Entrega y nombres | Alta | Props: `as`, `level` (`flat` `outlined` `raised` `inset`; defecto `outlined`), `density`, `rounded`, `orientation` (`vertical` `horizontal` `auto`; defecto `vertical`), `mediaPosition` (`top` `start` `end` `background` `inline`; defecto `top`), `eyebrow`, `title`, `subtitle`, `description`, `headingLevel` (2–6, 3), `titleLines` y `descriptionLines` (1–4 o `none`), `expandable`, `badge`/`badgeColor` (como `GWidget`), `meta` (`[{ label, value, priority? }]`), `menu` (`items` de `GMenu`), `status` (`info` `success` `warning` `error`) + `statusText`, `empty` (Boolean), `loading`, `disabled`, `labels`, `id` |
| 3 | Acción principal y selección | Alta | `interaction`: `none` (defecto) · `link` · `button` · `toggle` · `select`; `href` (+ `navigate` cancelable con el evento nativo antes de `update:modelValue`, como #70); `current` (Boolean -> `aria-current` y marca); `modelValue` (Boolean para `toggle`/`select`); `selectType` (`checkbox` `radio`), `name`, `value`; **la casilla explícita** (modo navegable + casilla) como `selectable="corner"` o equivalente. Se valida la **exclusión** de §4 (aviso en desarrollo) |
| 4 | Slots | Alta | `media`, `lead` (icono) y `avatar`, `eyebrow`, `title`, `subtitle`, `badge`, `description`, `default`, `status`, `empty`, `meta`, `more`, `actions`, `footer`, `loading`. `title` conserva el texto para el nombre. Alcance `{ size, layout, state }` donde sirva (como `GWidget`) |
| 5 | Eventos | Alta | `navigate`, `update:modelValue`, `action` (`{ id }` del `GMenu`), `retry`, `expand` (`{ expanded }`); los `click`/`keydown` nativos no se declaran. **Verificar** que los `emits` declarados impiden el reenvío por `$attrs` al elemento equivocado |
| 6 | Medición | Alta | `data-size`, `data-layout` y clases `g-card--size-*`/`--layout-*`; umbrales `space × 130` y `space × 80` (constantes de diseño derivadas de `space`, **sin excepción nueva**) |
| 7 | Textos | Alta | `labels` sin valores por defecto: `menu` (prefijo de «Acciones de»), `loading`, `expand`, `collapse`, `more`, `less`, `retry`; aviso en desarrollo si falta el que corresponda |
| 8 | **Esqueleto sin datos** | Alta | Con `loading` los datos no existen: la forma sale de lo que la card **declara**. Propuesta: `skeleton` (Object: `{ media, lead, eyebrow, subtitle, descriptionLines, meta, actions, footer }`) o el slot `loading`; sin ellos, forma mínima (título + 2 líneas). No verificado con datos reales (§13) |
| 9 | Iconos | Media | `icons.md`: `check` (casilla y alternar), `circle` rellena (radio), `ellipsis-vertical` (menú), `circle-alert`, `triangle-alert`, `circle-check` y `info` (estados; `info` **no está** en `lucide-icons.js`), `chevron-right` (marca de «actual», opcional). Fuera de lista, para la **documentación** del consumidor (media): `image`, `play`, `map-pin` |
| 10 | Tokens (sin valores) | Media | **Reutilizar:** superficie, borde, sombra, radios, `space`, tipografía de título/cuerpo/caption, foco, `duration`/`ease`, colores semánticos `-soft`/`-text`. **Necesidades no cubiertas** (decide lima con coco): (a) fondo de **hover**, **pressed** y **selected** **relativos a la superficie anfitriona** (patrón de `--g-tabs-*`, #120); (b) borde de selected (grosor doble: ¿token de grosor o regla?); (c) **escrim** de la media de fondo (con contraste mínimo del texto); (d) **anillo de foco hacia dentro** (el actual `--g-focus-offset` es hacia fuera y la card recorta); (e) ancho de la media lateral por densidad (derivado de `space`); (f) línea del pie (existente `--g-color-border`); (g) tono del esqueleto (existente en `GWidget`). La mayoría son aliases locales `--_*`, no tokens de tema (`tokens.md` §17.6) |
| 11 | `overflow` y esquinas | Media | Para recortar la media a las esquinas, la raíz usa `overflow: clip` (el menú de `GMenu` está en capa superior, no se recorta; el anillo de foco va **dentro**). Alternativa: media con radio concéntrico propio sin `clip` en la raíz |
| 12 | Subgrid | Baja | Alinear títulos y acciones entre cards de una fila con `subgrid`: diferido; la card no asume la rejilla |
| 13 | Selección de grupo | Media | Radio con `name` común y `role="radiogroup"` del consumidor funciona nativo; `GCardGroup` (v-model, límites) es la pregunta 2 |
| 14 | `GWidget` | Baja | Sin cambios. Documentar en `widget.md` y `card.md` la frontera (§1.3) para que `GWidgetGallery` no ofrezca cards como widgets sin pasar por la carcasa |
| 15 | Contraste y forma | Alta (coco) | La marca de selected, el anillo de foco, la casilla y la línea del pie con 3:1 (controles) y texto 4.5:1 sobre el escrim; `forced-colors`; `prefers-contrast`; el hover no basta como único cambio de la selección |

## 12. Comprobaciones ejecutadas

Playwright (Chromium, `file://`), `index.html`, sin errores ni avisos de consola en carga (los avisos de desarrollo salen solo en los usos incorrectos que provoca el botón de la §14):

- **Estructura:** 90 cards, todas con encabezado y nombre; **0** interactivos anidados; ids únicos; 86 `article` y 5 `li` (modo lista).
- **Enlace estirado:** con el puntero sobre el cuerpo `elementFromPoint` devuelve el enlace principal; clic en el vacío activa la principal; clic en **Compartir**, **Abrir** y en el menú **no** la activan (el registro lo confirma).
- **Hover:** con el puntero sobre el cuerpo la card cambia de fondo; sobre una acción interna **no** (el fondo vuelve al de reposo); fuera, tampoco.
- **Anillo de foco:** `::after` del enlace con `outline: solid 3px` al enfocar con teclado.
- **Teclado:** orden de Tab `título -> menú -> acción 1 -> acción 2` (+ casilla antes del título en el modo navegable + casilla); menú: clic abre y enfoca el primero, ↓ recorre incluyendo el deshabilitado, **Esc** devuelve el foco y cierra, ↓ + Enter activa.
- **Selección:** clic en cualquier punto de la card marca la casilla real (`data-selected`); Espacio desmarca; radios: la flecha derecha mueve la selección y el estado de cada card; alternar: `aria-pressed` cambia; la casilla explícita de la card navegable **no** navega.
- **Disabled:** sin `href`, `aria-disabled="true"`, botones `disabled`.
- **Contenedor:** marco redimensionable 700/540/400/300/240px -> `wide/row`, `medium/column`, `medium/column`, `narrow/column`, `narrow/column`; en `narrow` aparece «Más detalles» y la región queda plegada, y en 540px no hay botón; tres anchos fijos (560/380/260) = `wide/row`, `medium/column`, `narrow/column`; **sidebar `narrow` y área principal `wide` con el mismo visor**; diálogo de 360px -> `medium/column` (326px de card) y de 680px -> `wide/row` (646px).
- **Esqueleto:** misma altura que la card cargada en Entity (239px), Media (353px), Horizontal (372px) y Metric (130px); `aria-busy` y `role="status"` presentes; al terminar se retira.
- **Truncado:** «Mostrar más» visible, visible, ausente (título completo) y oculto (texto corto); expandir crece y marca `aria-expanded="true"`.
- **Avisos de desarrollo:** sin título, selección de card completa **y** enlace, solo-icono sin etiqueta, y card dentro de card dentro de card (cuatro mensajes).
- **Objetivos:** ≥ 24px siempre y ≥ 44px con el interruptor táctil (acciones, solo-icono y casilla).
- **Móvil:** **320px y 375px sin desborde** de la página (`scrollWidth` = ancho de visor); también en RTL a 375px; región plegable en un marco de 300px (colapsada y desplegada con `aria-expanded`).
- **Movimiento:** con el interruptor «reducir movimiento» el esqueleto no anima; el hover no mueve la card (no hay `transform`).
- `check-icons.mjs`: 0 infracciones (solo Lucide, sin glifos).

## 13. Qué NO verifiqué

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): cómo se anuncia un título-enlace dentro de un `article`, el `aria-describedby` de la descripción, la casilla con el título como etiqueta, `aria-busy`/`role="status"` en el esqueleto, el `role="alert"` del error y la región plegable. **La decisión de no poner `aria-labelledby` en una card con enlace propio es una hipótesis.**
- **Firefox y WebKit/Safari:** `:has()`, `line-clamp` multilínea, `popover`, `overflow: clip`, `isolation`, `ResizeObserver`. Ningún navegador distinto de Chromium.
- **Táctil real:** objetivos con dedo, pulsación larga sobre el enlace estirado, `touch-action`; zoom al 200% y reajuste real.
- **`forced-colors` y `prefers-contrast`**: solo se añadió un contorno de prueba; sin comprobar.
- **Contraste** del texto sobre el escrim de la media de fondo, de la marca de selected y de los grises del kit con tema real (lo audita coco).
- **Selección de texto** y copiado con el enlace estirado en lectores y navegadores; arrastrar y soltar el enlace.
- **Esqueleto con datos reales ausentes** (§11.8): el prototipo lo construye desde las mismas props y por eso conserva la altura; no hay prueba de qué hace una card cuando el consumidor no declara nada.
- **Rendimiento** con cientos de cards (un `ResizeObserver` por card; ¿uno compartido?).
- **Rejilla** con alturas iguales y contenido muy desigual; `subgrid`.
- **Menú dentro de un diálogo** con la card anidada (Esc cierra solo el menú: probado en la regla del menú, no dentro del diálogo del prototipo).
- **RTL** más allá de que no hay desborde (flechas, orden visual de la fila y del modo lista no se revisaron uno a uno).
- **Cambio en caliente** de `orientation`/`density`/`level` con el menú abierto.
- El sistema real de tokens y los componentes `GSurface`, `GMenu`, `GBadge`, `GBtn`: el prototipo los imita sin usarlos.
- **Orden de lectura del modo lista:** el modo lista reordena visualmente (metadata antes del menú) sin cambiar el DOM; la metadata no es interactiva, pero no se contrastó con un lector.

## 14. Preguntas de producto realmente abiertas

1. **Avatar.** El brief lo cita como pieza (`avatar`) y no existe `GAvatar` (`GAvatarMotion` está aplazado, #104). ¿`GCard` recibe el avatar **siempre por slot** del consumidor (iniciales, imagen o icono, como los iconos de #86) o se crea antes un `GAvatar` primitivo (imagen, iniciales, icono, tamaños, estado)? **Recomendación:** por slot en v0.1; `GAvatar` en ronda propia si más de un componente lo necesita.
2. **Grupo de selección.** Radios con `name` común y un `role="radiogroup"` del consumidor funcionan sin más, pero `GCheckbox` sí tiene grupo (`GCheckboxGroup`, #36). ¿Entra un `GCardGroup` (`v-model`, mínimo/máximo, casilla maestra) en v0.1? **Recomendación:** diferir; v0.1 con `modelValue` por card y `name`.
3. **Convergencia con `GWidget`.** ¿La carcasa de widgets acabará **reconstruida sobre `GCard`** (una migración como la de `GDialog` a `GSurface`) o permanece independiente por tener niveles de detalle propios? **Recomendación:** independiente en v0.1 y revisar cuando `GCard` esté verificada, porque la migración cambia el comportamiento medido de `GWidget`.

Sin pregunta (asumidas como propuesta kiwi pendiente de visto bueno): `GCard` compone `GSurface`; sin subcomponentes; enlace estirado con elemento real, nunca la card como botón; navegar y seleccionar con toda la card son excluyentes (casilla explícita para ambos); menú de acciones con `GMenu` y sin clic derecho; el hover no mueve la card; adaptación por medición (`space × 130` y `space × 80`) y no por `@container`; el `spacious` del brief es el `default` compartido; lista = `GCard` (sin `GListItem`); tooltip de solo-icono pendiente de lo decidido en `GTabs`.
