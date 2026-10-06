# Contrato de tokens · v0.1

**Dueño:** lima. Cualquier token nuevo se agrega aquí antes de que un componente lo use.

## 1. Entradas del usuario

Todas opcionales. Lo que no se define conserva el valor por defecto de Grana.

| Clave | Tipo | Ejemplo | Controla |
| --- | --- | --- | --- |
| `brand` | color hex | `"#F5B940"` | Acción principal |
| `accent` | color hex | `"#5B3FE0"` | Foco, enlaces, selección, estados activos. Sin valor: se deriva de `brand` (su `text`) |
| `primary` | color hex | `"#7D1230"` | Color de la **acción principal** cuando es distinto de `brand` (§17.4). Sin valor: `primary` es un alias de `brand`. Con valor, `primary`, `primary-strong`, `-soft`, `-text`, `on-primary` y `on-primary-soft` se derivan de él (claro y oscuro, con `dark: { primary }` opcional) y **cuenta como ancla de colisión** con los semánticos. Los componentes ya leen `primary`, así que no cambia ningún contrato |
| `radius` | número (px) | `20` | Paso `md` de la escala de radios |
| `shape` | `"rounded"` \| `"pill"` | `"pill"` | Con `pill`, botones, chips e insignias usan `radius-pill` |
| `space` | número (px) | `4` | Unidad de espaciado |
| `font` | familia CSS | `"Instrument Sans"` | Toda la interfaz |
| `fontDisplay` | familia CSS | `"Instrument Serif"` | Rol `display` y clase `g-font-display`. Sin valor: igual a `font` |
| `fontSize` | número (px) | `16` | Tamaño `body` |
| `typeScale` | número | `1.4` | Razón de la escala de títulos |
| `name` | texto | `"Lustre"` | Nombre del sistema en `tokens.json` (§16). Por defecto «Grana» |
| `neutralsHue` | `"brand"` \| `"accent"` | `"accent"` | De qué color se toma el **tono** de los neutros teñidos (§16.2). Por defecto `brand`. Solo define el tono: el croma, la luminosidad y el contraste no cambian. No se infiere |
| `semanticCollision` | `"warn"` \| `"adjust"` | `"adjust"` | Qué hace el CLI si un semántico se parece a la marca o al acento (§16.1, §17.12). `warn` (por defecto): avisa y propone la alternativa; `adjust`: la aplica |
| `neutrals` | `"tinted"` \| `"pure"` | `"pure"` | Neutros teñidos con el tono de la marca (§16). `tinted` (por defecto); `pure`: los grises por defecto |
| `categories` | entero 0 a 12 | `6` | Serie de colores de categoría `--g-color-cat-1` a `cat-N` (§16). Por defecto 0 (ninguna) |
| `dark` | `true` \| `false` \| objeto | `{ "brand": "#F5B940" }` | Tema oscuro (§15). `true` (por defecto): el CLI deriva la variante oscura de `brand` y `accent`. `false`: sin tema oscuro (el sistema oscuro no lo activa). Objeto: `brand`, `accent` (colores del oscuro, en lugar de los derivados) y `overrides` (solo para el oscuro) |

Cualquier token derivado puede sobrescribirse explícitamente (uso avanzado). En el CLI, la clave `overrides` es un objeto `{ "--g-token": "valor" }`; se aplica después de generar y el resultado se valida igual. Los colores semánticos (`success`, `warning`, `danger`, `info`, `neutral`) no tienen entrada propia: se cambian con `overrides`.

## 2. Color

### Derivados por color

Se calculan en OKLCH conservando el tono (H). Aplican a `brand`, `accent` y a cada semántico.

| Derivado | Regla |
| --- | --- |
| `strong` | Oscurece L 0.08. Si la base es muy oscura (L < 0.3), aclara L 0.08. Si el resultado baja de 4.5:1 con su `on`, usa la dirección contraria |
| `soft` | L = 0.955, C × 0.3 |
| `on` | Casi negro (`#17151A`) o blanco: el de mayor contraste WCAG |
| `text` | Baja L en pasos de 0.01 hasta contraste ≥ 4.5:1 sobre `surface` |
| `on-soft` | Baja L hasta contraste ≥ 4.5:1 sobre `soft` |

Si al reducir L el color sale de la gama sRGB, se reduce C hasta volver a ella.

Valores iniciales (0.08, 0.955, 0.3): validados con los colores del tema por defecto y con casos extremos (azul marino, amarillo pálido, gris medio): todos los pares pasan 4.5:1. La regla de `strong` se corrigió tras encontrar que aclarar un azul de L 0.49 dejaba el texto blanco en 4.4:1. Caso conocido: bases muy claras producen un `soft` casi igual a la base (aceptable).

### Semánticos (fijos por defecto)

`neutral`, `success`, `warning`, `danger`, `info`, con los mismos derivados. (`neutral` faltaba en esta lista aunque ya era un valor del prop `color`.)

### Neutros (fijos por defecto)

`bg`, `surface`, `surface-sunken`, `text`, `text-muted`, `text-subtle`, `border`, `border-strong`, `border-control` (≥ 3:1 sobre `surface`), `focus` (= `accent-text`).

### Uso

- `brand`: un solo elemento sólido de `brand` por vista.
- `accent`: señala; nunca es el relleno de la acción principal.

## 3. Radios

Escala geométrica, razón 1.4, redondeo a entero.

| Paso | Regla |
| --- | --- |
| `xs` | radius ÷ 1.4² |
| `sm` | radius ÷ 1.4 |
| `md` | radius |
| `lg` | radius × 1.4 |
| `xl` | radius × 1.4² |
| `none` / `pill` | 0 / 999px |

Paso por rol: campo → `sm`; tarjeta → `lg`; botón, chip, insignia → `md` (o `pill` si `shape: "pill"`). El prop `rounded` de la instancia gana sobre todo.

## 4. Espaciado

`space-n` = `space` × n, n ∈ {1, 2, 3, 4, 5, 6, 8, 12, 16}.

Alturas de control por tamaño: `xs` 6, `sm` 7, `md` 9, `lg` 11, `xl` 13 unidades de `space`, **nunca por debajo de los mínimos de accesibilidad** (sección 7).

**Casilla (`GCheckbox`):** el cuadro mide `space` × 4, 4, 5, 6 y 7 unidades para `xs`, `sm`, `md`, `lg` y `xl` (con `space` 4: 16, 16, 20, 24 y 28px). La **fila** es el objetivo de toque: mínimo 24px y, con `pointer: coarse`, 44px reales (§7). Ambos valores se derivan de `space`; no son tokens nuevos. (Agregado con el contrato de `GCheckbox`.)

**Interruptor (`GSwitch`):** el riel mide, en unidades de `space`, alto × ancho de 5 × 9, 5.5 × 10, 6 × 11, 7.5 × 13 y 9 × 16 para `xs`, `sm`, `md`, `lg` y `xl` (con `space` 4: 36×20, 40×22, 44×24, 52×30 y 64×36px). El pulgar mide el alto del riel menos el borde y la separación de cada lado (`--g-border-width` y media unidad de `space`). La **fila** es el objetivo de toque, con la altura de la casilla (6, 6, 6, 8 y 10 unidades, con piso de 24px por `density`) y, con `pointer: coarse`, 44px reales (§7). No son tokens nuevos. (Agregado con el contrato de `GSwitch`.)

**Campo de varias líneas (`GTextarea`):** con `rows` 1, la altura iguala la de `GInput` del mismo `size` y `density` (6, 7, 9, 11 y 13 unidades de `space`); el relleno vertical se calcula desde esa altura y el interlineado, y cada fila extra suma un interlineado. La altura mínima con `pointer: coarse` es 44px reales (§7). No son tokens nuevos. (Agregado con el contrato de `GTextarea`.)

**Selector (`GSelect`):** la caja mide lo mismo que la de `GInput` del mismo `size` y `density`. La **opción** de la lista mide como esa caja, con piso de 24px y 44px reales con `pointer: coarse` (§7). La lista flotante tiene un alto máximo de unas 8 opciones (derivado de esa altura) y nunca más del 60% del visor. No son tokens nuevos. (Agregado con el contrato de `GSelect`.)

El prop `density` multiplica localmente **la altura, el padding y la separación** (1×, 0.875×, 0.75×), sin cambiar la tipografía. La altura resultante tiene piso de 24px. `space` es global; `density` es local. (Precisado tras la ronda r01 de `GBtn`.)

## 5. Tipografía

| Rol | Regla |
| --- | --- |
| `caption` | fontSize × 0.75, mínimo 12px |
| `body-sm` | fontSize × 0.875 |
| `body` | fontSize |
| `title-sm` | fontSize × typeScale |
| `title` | fontSize × typeScale² |
| `title-lg` | fontSize × typeScale³ |
| `display` | fontSize × typeScale⁴, familia `fontDisplay` |

- Interlineado: razón fija por rol × tamaño, redondeado a múltiplos de 4px (mínimo 4px). Razones: `caption` 1.333, `body-sm` 1.43, `body` 1.5, `title-sm` 1.4, `title` 1.44, `title-lg` 1.28, `display` 1.23. (Sustituye a la regla «interpolado»: no reproducía el tema por defecto; la tabla sí, exactamente.)
- Tracking (em): `caption`/`body-sm`/`body` 0, `title-sm` −0.004, `title` −0.008, `title-lg` −0.014, `display` −0.022.
- Peso: `caption` 500, `body-sm`/`body` 400, títulos y `display` 600.
- Salida en `rem`.
- Fuente por defecto: **Instrument Sans** (OFL), incluida en `@grana/vue` como archivos `.woff2` separados, con su propia hoja `@grana/vue/fonts.css` (opcional). No se aloja en un CDN de terceros. Como `@font-face` solo descarga una fuente cuando un texto visible la usa, y cada archivo cubre un rango de caracteres, el navegador descarga solo lo necesario.
- La fuente **no** va dentro de `grana.css`: en modo librería, Vite incrusta en base64 todo archivo que el CSS referencie, y eso obligaría a todos a descargarla.
- `fontDisplay` por defecto es igual a `font`: sin segunda descarga.
- Si el usuario solo da un nombre de familia, Grana agrega la pila del sistema sans; para respaldo serif, escribir la pila completa.
- Qué rol usa cada título, subtítulo, etiqueta y eyebrow de los componentes, y la regla de uso: §23.

## 6. Nombres en CSS

```
--g-color-{brand|accent|success|warning|danger|info}[-strong|-soft|-text]
--g-color-on-{…}[-soft]
--g-color-{bg|surface|surface-sunken|text|text-muted|text-subtle|border|border-strong|border-control|focus}
--g-radius-{none|xs|sm|md|lg|xl|pill}
--g-space-{1|2|3|4|5|6|8|12|16}
--g-font-{ui|title|display}
--g-text-{caption|body-sm|body|title-sm|title|title-lg|display}-{size|line|tracking|weight}
--g-shadow-{1|2|3}
--g-radius-shape
--g-border-width
--g-focus-{width|offset}
--g-duration-{fast|press|spin|slow}
--g-ease-{standard|out|spring|bounce}
--g-press-scale
--g-text-action-weight
--g-calendar-{grid-color|unavailable-color|now-color}
--g-surface-{shell|inset|gap|radius|radius-inset|backdrop}
--g-glass-{tint|opacity|filter|edge|sheen}
```

### Tokens de estructura (agregados al escribir `GBtn.css`)

El contrato original no cubría bordes, foco ni movimiento, y sin ellos el CSS de un componente tendría que usar literales.

| Token | Defecto | Para qué |
| --- | --- | --- |
| `--g-radius-shape` | `var(--g-radius-md)` | Radio de botón, chip e insignia. El CLI lo pone en `var(--g-radius-pill)` si el tema tiene `shape: "pill"` |
| `--g-border-width` | 1px | Grosor de bordes de controles |
| `--g-focus-width` / `--g-focus-offset` | 2px / 2px | Anillo de foco |
| `--g-duration-fast` | 120ms | Cambios de estado (hover, activo) |
| `--g-duration-press` | 160ms | Respuesta al pulsar |
| `--g-duration-spin` | 800ms | Una vuelta del indicador de carga |
| `--g-duration-slow` | valor de coco (derivación vigente `calc(var(--g-duration-press) * 1.5)` = 240ms) | Movimientos grandes: altura, ancho y desplazamiento de bloques (`GFormReveal`, `GSidebar`, `GStepper`); el máximo de la interfaz (DECISIONS.md #71, #280) |
| `--g-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Curva de los cambios de estado |
| `--g-ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Curva de entradas y respuesta al pulsar |
| `--g-ease-spring` | valor de coco; propuesta de kiwi: `linear(0, 0.081, 0.258, 0.46, 0.644, 0.793, 0.901, 0.972, 1.013, 1.033, 1.038, 1.036, 1.029, 1.021, 1.014, 1.008, 1.004, 1.001, 1, 0.999, 1)` | Muelle amortiguado (rebasa 3,8 %): **solo desplazamientos que llegan**; usos aprobados: el borde de atrás de la marca de `GTabs` y el **cambio de tamaño y el toque de la isla de estado** (§31, #324). Con `--g-duration-slow` (§29, DECISIONS.md #299) |
| `--g-ease-bounce` | valor de coco; propuesta de kiwi: `linear(0, 0.124, 0.401, 0.708, 0.963, 1.127, 1.199, 1.197, 1.151, 1.088, 1.029, 0.987, 0.964, 0.958, 0.964, 0.976, 0.989, 0.999, 1.006, 1.008, 1.008, 1.006, 1)` | Rebote: **solo escalas pequeñas**; uso aprobado, soltar `GBtn` (pico 1,006 con `--g-press-scale` 0,97). Con `--g-duration-slow` (§29, #299) |
| `--g-press-scale` | 0.97 | Escala al pulsar (1 lo desactiva) |
| `--g-text-action-weight` | 500 | Peso de las etiquetas de acción |
| `--g-calendar-grid-color` | `var(--g-color-border)` | Líneas de la cuadrícula de `GCalendar` |
| `--g-calendar-unavailable-color` | `var(--g-color-border-strong)` | Patrón de indisponibilidad y de bloqueo de `GCalendar` |
| `--g-calendar-now-color` | `var(--g-color-danger)` | Línea y marca de la hora actual de `GCalendar` (≥ 3:1 contra la superficie) |

| `--g-surface-shell` | `var(--g-color-surface-sunken)` | Fondo de la **carcasa** (superficie exterior) |
| `--g-surface-inset` | `var(--g-color-surface)` | Fondo de la superficie **inset** (interior). Debe diferir poco de `shell`: la profundidad viene de la diferencia mínima, el borde fino y la sombra suave |
| `--g-surface-gap` | `calc(var(--g-space-1) * 1.5)` | Separación entre carcasa e inset |
| `--g-surface-radius` | `var(--g-radius-xl)` | Radio de la carcasa |
| `--g-surface-radius-inset` | `max(0px, calc(var(--g-surface-radius) - var(--g-surface-gap)))` | Radio de la inset: **concéntrico** con el de la carcasa |
| `--g-surface-backdrop` | `rgb(0 0 0 / 0.32)` | Tinte del fondo tras una superposición modal |

**Límite:** `--g-focus-width` es sobrescribible, pero el CLI rechaza un tema con valor menor a 2px (WCAG 2.4.13 recomienda al menos 2px).

Tokens de componente (`--g-btn-radius`) solo cuando un caso real lo justifique, y se registran aquí.

## 7. Mínimos de accesibilidad (no son tema)

| Regla | Valor |
| --- | --- |
| Área táctil | ≥ 24px; ≥ 44px con `pointer: coarse`, sin importar `density` |
| Texto | ≥ 12px |
| Contraste de texto | ≥ 4.5:1 |
| Contraste de controles | ≥ 3:1 |
| Foco | Siempre visible |

El CLI rechaza un tema que no los cumpla.

**Excepción documentada (DECISIONS.md #34):** las consultas de contenedor no admiten `var()`, así que el **umbral de ancho** con que un componente cambia de disposición (hoy solo `GInput` con el slot `action`, ~300px) se escribe como constante literal en el CSS del componente. Es una constante de diseño, no un valor de tema: el CLI no la valida ni el usuario la sobrescribe. Cada uso nuevo se anota aquí antes de escribirlo. **Literales de unidad** (DECISIONS.md #187): `1ch` en `GInputGroup.css` (factor que convierte el entero `--_input-group-chars` en longitud) y `left: 50%` en el área táctil de `GBtn` (centrado simétrico, también en RTL) no son medidas de tema ni de diseño: son unidades de conversión o posición relativa, como `100%` o `1fr`; no se tematizan ni las valida el CLI; **ampliado en #298:** la constante geométrica `50% - 50%/sqrt(2)` de `GBadge.css` (punto a 45° del contorno de un círculo), el factor `0.5` del icono de respaldo de `GAvatar` respecto del lado y el `1.06` de su asentamiento (constante de coreografía, como las de #106). **Ampliado en #299** (lenguaje de movimiento, §29): la fracción `0.25` del vector de origen de `GDialog`, los multiplicadores `× 8` (tope de ese vector), `× 4` (panel de `GTabs`) y `× 1` (etiqueta de `GBtn`, mensaje de `GInput`) de `--g-space-1`, y las amplitudes `1 · 0.75 · 0.5 · 0.25` de `--g-space-1` con sus instantes `16 · 36 · 56 · 76 %` de la sacudida de un campo rechazado. `GDialog` agrega consultas de medios sobre el visor (§11). **Ampliado en #313** (`GNumberField`): el **`1px`** del hueco del cursor al final del espejo de P1 (ancho del cursor del sistema, no tema) y el `1ch` de ancho mínimo del espejo (unidad, como el de `GInputGroup`). `GAvatarMotion` escribe literales sus **constantes de coreografía** (duraciones, distancias y ángulos en unidades de su `viewBox`), que son parte del dibujo y no tema (DECISIONS.md #106).

Como no son tema, **no son tokens**: si fueran variables, un `tokens.css` sin capa podría sobrescribirlos. El CSS de los componentes los escribe como constantes literales, y son los **únicos** literales de medida permitidos fuera de `defaults.css`: `24px` y `44px` (área táctil). También se permite el patrón estándar de texto oculto para lectores de pantalla (`1px`, `-1px`, `clip-path: inset(50%)`), que es una técnica de accesibilidad y no un valor estético. Ejemplo: `min-block-size: max(24px, calc(var(--g-space-1) * 9 * var(--_density)))`.

## 8. Mecanismo

```css
@layer grana.defaults, grana.components;
```

- `grana.defaults`: tema por defecto. Sigue siendo de coco (`styles/defaults.css`); el CLI **no** lo regenera. Al revés: `packages/cli/src/defaults.js` se copia de `defaults.css` (`node packages/cli/scripts/sync-defaults.mjs`) y una prueba falla si se desfasan.
- `grana.components`: CSS de los componentes.
- El `tokens.css` del usuario va **sin capa**: gana siempre, sin importar el orden de carga.

Modo principal: en build (`npx @grana/cli theme grana.config.json` o plugin de Vite). Modo en tiempo de ejecución: opcional, con parpadeo documentado.

## 9. Pendiente (no bloquea la v0.1)

- Tema opcional **grana + añil** (`brand` #9E1452, `accent` #2E3A8C, neutros cálidos), ya verificado en contraste; se publicará como tema alternativo.
- ~~Tema oscuro~~: definido en §15 (DECISIONS.md #79 a #81).
- Sombras configurables (`elevation`).

## 10. Límites conocidos

- Los derivados se resuelven en `:root`. Si alguien cambia `--g-color-brand` solo dentro de una sección, sus derivados no lo siguen.

## 11. Superficies (sistema `--g-surface-*`)

Lenguaje reutilizable de **superficies anidadas**: una carcasa (`shell`) que contiene una segunda superficie interior (`inset`) a una separación pequeña (`gap`), con radio concéntrico (`radius-inset` = `radius` − `gap`). Lo usan `GDialog` y la primitiva `GSurface` (`design/contracts/surface.md`, DECISIONS.md #99: niveles, tono y `inset` relativa al padre con radio concéntrico calculado desde el relleno real); drawers, paneles, tarjetas y popovers lo reutilizarán. Reglas: bordes de `--g-border-width` con `--g-color-border`, sombras solo de `--g-shadow-*`, sin desenfoque de fondo y sin más de dos niveles de superficie por defecto. Nota: `--g-surface-radius-inset` se resuelve en `:root`; si alguien cambia `--g-surface-radius` solo dentro de una sección, el radio de la inset no lo sigue (§10). *(Agregado con el contrato de `GDialog`.)*

**Excepción documentada (DECISIONS.md #42):** además del umbral de contenedor (#34, #39), `GDialog` usa **consultas de medios sobre el visor** (~900px y ~520px), también literales, porque un diálogo se ancla a la ventana y no a un contenedor.

## 12. Cristal (sistema `--g-glass-*`)

Lenguaje reutilizable de **superficies de cristal** (liquid glass): un velo translúcido que desenfoca y satura lo que hay detrás, con borde luminoso y brillo. Lo usa la variante `glass` de `GBadge`; otros componentes (dialog, popover, barras) podrán reutilizarlo. *(Agregado con el contrato de `GBadge`.)*

| Token | Defecto | Para qué |
| --- | --- | --- |
| `--g-glass-tint` | `#FFFFFF` | Color del velo, **opaco** (con `color`, el velo usa el tono suave del color: siempre claro) |
| `--g-glass-opacity` | `0.62` | Opacidad del velo (número de 0 a 1). Ver regla de legibilidad |
| `--g-glass-filter` | `blur(14px) saturate(1.8)` | Filtro de fondo (`backdrop-filter`); `none` lo desactiva |
| `--g-glass-edge` | `rgb(255 255 255 / 0.75)` | Borde luminoso y línea de luz superior |
| `--g-glass-sheen` | `rgb(255 255 255 / 0.55)` | Inicio del brillo especular (degradado de arriba hacia transparente) |

**Regla de legibilidad (no es tema):** el texto sobre cristal debe llegar a **4.5:1 contra el peor fondo posible**, que es el negro. Con el velo por defecto (0.62) y `--g-color-text` (#1F1F1F) el peor caso es **6.15:1** (10.58 sobre gris, 16.48 sobre blanco). El CLI rechaza un tema cuyo `--g-glass-opacity` sea < 0.55, o cuyo texto, compuesto sobre negro con ese velo (neutro y con cada tono suave de color), baje de 4.5:1. **La regla real es el contraste, no la opacidad sola:** con un texto más claro o un velo teñido, hace falta más opacidad (con texto #3B2A1A y velo #FFF6E5, 0.60 dio 4.06:1 y **no** cumple; 0.72 sí).

**Respaldos:** sin `backdrop-filter` (`@supports`), con `prefers-reduced-transparency: reduce` y con `forced-colors: active`, un componente de cristal se ve **opaco** (su variante `soft`). Estas condiciones son consultas del navegador, no umbrales de tema.

**Límite:** sobre un fondo claro, el borde del cristal casi desaparece; los componentes no interactivos no exigen contorno de 3:1, los interactivos no deben usar cristal sin un borde adicional.

## 13. Sidebar (`--g-sidebar-*`)

**Tokens de estructura** de `GSidebar`, para que la aplicación reserve espacio en su diseño (el componente no empuja el contenido). Todos derivan de `--g-space-1`. *(Agregados con el contrato de `GSidebar`; los valores por defecto los escribe coco en `defaults.css`.)*

| Token | Defecto | Para qué |
| --- | --- | --- |
| `--g-sidebar-width` | `calc(var(--g-space-1) * 66)` | Ancho del sidebar **expandido** (264px con `space` 4) |
| `--g-sidebar-rail` | `calc(var(--g-space-1) * 16)` | Ancho del **riel** (64px) |
| `--g-sidebar-bar` | `calc(var(--g-space-1) * 17)` | Alto reservado del **navbar** inferior con su margen (68px) |

**Umbrales de adaptación** (no son tokens; los mide bruno): expandida a partir de `--g-space-1 × 240` (960px) de ancho del contenedor; riel a partir de `--g-space-1 × 150` (600px); por debajo, formato móvil. Con `space` 5 son 1200px y 750px: la adaptación sigue a la unidad de espacio.

**Límite:** los tokens se resuelven en `:root` (§10): si alguien cambia `--g-space-1` solo dentro de una sección, los tokens de sidebar no lo siguen.

## 14. Widgets (`--g-widget-*`)

**Tokens de estructura** de `GWidgetGrid` (la rejilla del dashboard), para que la aplicación pueda alinear su propio diseño con la celda. Derivan de `--g-space-1`. *(Agregados con el contrato del sistema de widgets; los valores por defecto los escribe coco en `defaults.css`.)*

| Token | Defecto | Para qué |
| --- | --- | --- |
| `--g-widget-row` | `calc(var(--g-space-1) * 28)` | Alto de una fila de la rejilla (112px con `space` 4) |
| `--g-widget-gap` | `calc(var(--g-space-1) * 4)` | Separación entre celdas (16px) |

**Umbrales de adaptación** (no son tokens; los miden los componentes): **niveles de `GWidget`** por su ancho propio: `s` < `space × 60`, `m` < `space × 110`, `l` a partir de ahí; **forma** `tall` a partir de un alto de `space × 80`; **columnas de `GWidgetGrid`** por su ancho: 4 a partir de `space × 240`, 2 a partir de `space × 140`, 1 por debajo. Con `space` 5, todos suben un 25%.

**Límite:** los tokens se resuelven en `:root` (§10).

## 15. Tema oscuro

**Dueño:** lima (reglas) · coco (valores de `defaults.css`) · bruno (derivación en el CLI). DECISIONS.md #79 a #81. **Estado:** candidate (auditoría de coco aprobada: `design/lab/tema-oscuro/auditoria.md`). **Sin tokens nuevos**: el tema oscuro redeclara los mismos tokens de color; los componentes no cambian (solo leen `var(--g-*)`).

### Activación (automática y forzable)

| Situación | Resultado |
| --- | --- |
| Sin atributo | **Sigue el sistema** (`prefers-color-scheme: dark`) |
| `data-theme="dark"` en un elemento | Oscuro en ese elemento y sus descendientes (`<html>`, un contenedor, una sección) |
| `data-theme="light"` en un elemento | Claro en ese elemento, **aunque el sistema sea oscuro** (y dentro de un oscuro) |

- **Atributo, no clase:** `data-theme` con los valores `light` y `dark` (sin otros; `auto` es la ausencia del atributo).
- **Anidado:** una sección `data-theme="dark"` dentro de una página clara (y al revés) funciona: cada elemento con el atributo **redeclara todos los tokens de color**.
- **`color-scheme`:** el tema declara `color-scheme: light` (o `dark`) junto a los tokens, para que los controles nativos, los selectores y las barras de desplazamiento sigan el tema.
- **Quien no quiera oscuro:** `data-theme="light"` en `<html>`, o `dark: false` en el CLI.

### Qué redeclara el oscuro (el «grupo de color»)

Los tokens que cambian con el tema, **todos** (incluidos los que se definen con `var()`: se resuelven donde se declaran, así que una sección no los hereda):

`--g-color-*` (marca, semánticos, neutros, foco) · `--g-surface-shell`, `--g-surface-inset`, `--g-surface-backdrop` · `--g-shadow-1..3` · `--g-glass-*` · `--g-calendar-*-color`.

Lo demás (radios, espaciado, tipografía, movimiento, bordes, estructura) **no cambia** y no se repite.

### Reglas de los valores del oscuro

**Neutros (fijos por defecto; los decide coco dentro de estas reglas):**

| Regla | Valor |
| --- | --- |
| Fondo | Gris casi negro (~`#141414`), no negro puro (decisión del usuario) |
| Orden de superficies | `surface-sunken` ≤ `bg` < `surface`: **lo elevado es más claro**; la profundidad sale de la luminosidad, no de sombras |
| `text`, `text-muted`, `text-subtle` | ≥ 4.5:1 sobre `bg`, `surface` y `surface-sunken` |
| `border-control` | ≥ 3:1 sobre `surface` y `surface-sunken`; **pendiente (#186):** también sobre `neutral-soft` (relleno de solo lectura de los campos; 3.02:1 en el tema por defecto) |
| `border`, `border-strong` | Blanco translúcido (mismo principio que el claro) |
| `surface-backdrop` | Negro con alfa ≥ 0.5 |
| Sombras | Las del claro con el alfa duplicado aproximadamente (sobre oscuro se ven menos); el tema sigue prefiriendo bordes |
| Cristal | `tint` oscuro y opacidad tal que el peor caso (sobre blanco) dé ≥ 4.5:1 con `text` (más alta que la del claro) |

**Colores (`brand`, `accent` y semánticos), reglas de derivación en OKLCH (las usa el CLI; los semánticos por defecto están fijos, derivados con las mismas):**

| Derivado | Regla en el oscuro (S = `surface` oscuro) |
| --- | --- |
| Base | Si L de la base clara ≥ 0.5, se conserva; si es menor, se **refleja** (L' = 1 − L). Luego sube L en pasos de 0.01 hasta ≥ 4.5:1 con S (sirve de relleno y de texto). Si sale de la gama, baja C |
| `on` | Casi negro (`#17151A`) o blanco: el de mayor contraste WCAG con la base |
| `strong` | Sube L 0.06 (se aleja del fondo); si el contraste con `on` baja de 4.5:1, baja L 0.08 |
| `soft` | L = 0.26, C × 0.35 (un velo oscuro del color) |
| `text` | La base, subiendo L hasta ≥ 4.5:1 sobre S |
| `on-soft` | Sube L desde la base hasta ≥ 4.5:1 sobre `soft` |

- **`brand` de tinta** (oscuro en el claro): se refleja a un tono claro; el tema por defecto fija `brand` en un casi blanco y `on-brand` casi negro.
- **`focus`** sigue siendo `accent-text` (oscuro).

### Mecanismo y capas

```css
/* defaults.css, capa grana.defaults (coco) */
:root, [data-theme="light"] { color-scheme: light; /* grupo de color, claro */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { color-scheme: dark; /* grupo de color, oscuro */ }
}
[data-theme="dark"] { color-scheme: dark; /* grupo de color, oscuro */ }
```

El `:root` de los tokens no relacionados con el color no cambia. **Orden obligatorio:** claro, consulta oscura, `[data-theme="dark"]` (con igual especificidad, el último gana).

### Lo que emite el CLI (sin capa)

El `tokens.css` del usuario va **sin capa y gana siempre** (§8): si define `brand` claro y el oscuro de los defaults se activa, el `brand` claro **ganaría también en el oscuro** y no tendría contraste. Por eso, **con `dark: true` (por defecto) el CLI emite la variante oscura de lo que el usuario cambia**:

```css
:root, [data-theme="light"] { /* derivados claros (hoy solo :root) */ }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { /* derivados oscuros */ } }
[data-theme="dark"] { /* derivados oscuros */ }
```

- **`dark: { brand, accent }`** sustituye a los derivados automáticos (colores explícitos del oscuro, derivados con las mismas reglas). **`dark.overrides`** se aplica solo al oscuro y se valida igual.
- **`dark: false`:** no hay tema oscuro. El CLI emite, dentro de la consulta oscura y con `:root:not([data-theme="dark"])`, el **grupo de color claro completo** (defaults y derivados), para que el sistema oscuro no active el oscuro de los defaults. `data-theme="dark"` sigue funcionando (oscuro de los defaults, con los avisos del CLI).
- **`check` valida los dos esquemas** con los mínimos de §7 (texto 4.5:1, controles 3:1): un tema cuyo oscuro no los cumpla se rechaza igual que uno claro.
- El tema oscuro **no** cambia `radius`, `space`, `font`, `fontSize` ni `typeScale` (valen para ambos).

### Límites

- Como en §10, **los derivados se resuelven donde se declaran**: cambiar `--g-color-brand` solo dentro de una sección no mueve sus derivados (en el oscuro tampoco).
- **Sin tercer esquema** (alto contraste o sepia) ni modo «automático por hora»: solo claro y oscuro.
- **Sin cambio de tema animado** ni persistencia: alternar `data-theme` y guardar la preferencia es de la aplicación.
- **Imágenes e iconos** de la aplicación no se adaptan solos.
- **Usuarios actuales:** sin `data-theme`, una aplicación que use solo los defaults pasará a oscuro en un sistema oscuro. Quien no lo quiera debe fijar `data-theme="light"` (o `dark: false`).

## 16. Derivación de paleta (DECISIONS.md #93)

**Dueño:** lima (reglas) · bruno (implementación en `@grana/cli`, `palette.js`). **Estado:** candidate. Todo en OKLCH, determinista y validado como el resto del tema (§7, §12 y §15): la derivación **nunca** rompe un mínimo de accesibilidad, y cualquier token se puede fijar con `overrides` (que gana a la derivación).

### 16.1 Semánticos sin choque con la marca

> **Política (DECISIONS.md #94):** por defecto es `semanticCollision: "warn"`: el CLI **no cambia** el semántico, avisa y propone la alternativa calculada (la misma que aplica `adjust`). Lo de abajo describe cómo se calcula esa alternativa.

`success`, `warning`, `danger` e `info` parten de su color claro por defecto. Si el más cercano de `brand` o `accent` (claros **y** sus variantes oscuras derivadas) queda a una **distancia OKLab < 0.12**, o si el semántico resultante se parecería a otro semántico (< 0.09; el tema por defecto ya está en ≈ 0.10), se busca el **menor giro**: tono ±45° (pasos de 5°) y luminosidad ±0.15 (pasos de 0.05), con el coste `|Δtono| / 45 + 0.6 · |ΔL| / 0.15`. Se conserva el croma, se reduce a la gama sRGB y se derivan `strong`, `soft`, `text`, `on-*` y su variante oscura como cualquier color (§2, §15). Si ningún giro llega a 0.12, se elige el de mayor distancia y se avisa (`semantic-close`). **Los semánticos que no chocan no se tocan** (no se emiten), y con `warn` tampoco los que chocan. Si el usuario fija uno con `overrides` y queda a < 0.12 de la marca, también avisa.

### 16.2 Neutros teñidos (`neutrals: "tinted"`, por defecto con `brand`)

`text`, `text-muted`, `text-subtle`, `border`, `border-strong`, `border-control`, `surface-sunken` y la base de `neutral` (y, en el oscuro, también `bg` y `surface`) conservan la **luminosidad del tema por defecto** y toman el **tono de `brand`** con croma = 8 % del de la marca, entre 0.006 y 0.02 (0.008 sobre L > 0.9 y 0.01 bajo L < 0.3, donde el mismo croma se nota más). Después se aleja L, paso a paso, hasta cumplir: texto ≥ 7:1 (`text`) y ≥ 4.5:1 (`muted`, `subtle`) sobre `surface` y `surface-sunken`; `border-control` ≥ 3:1. Los bordes son la tinta del texto con la transparencia por defecto. Con una marca casi gris (croma < 0.02) no se tiñe nada. **`neutralsHue: "brand" | "accent"`** (por defecto `brand`) elige **solo de qué color se toma el tono**; el croma sale siempre de la marca y las reglas de luminosidad y contraste no cambian. No se infiere cuál conviene: lo decide quien configura. `surface` y `bg` claros siguen siendo blancos.

### 16.3 Categorías (`categories: N`)

`--g-color-cat-k`, `-strong`, `-soft`, `-text`, `on-cat-k`, `on-cat-k-soft` (k = 1 a N), para iconos, etiquetas y gráficas. Mismo **L = 0.52** y **C = 0.12**; tonos repartidos por igual (**360° / N**) empezando **medio paso** después del de la marca. Hasta 8 categorías los vecinos se distinguen bien (pasos ≥ 45°); hasta 12 es el máximo aceptado. Los seis derivados siguen las reglas de §2 y §15 y se validan como cualquier color.

### 16.4 Hover (`strong`)

`strong` siempre se **aleja del fondo de su texto**: más oscuro si lleva texto blanco, más claro si lleva texto oscuro (la regla ya vigente de §2, ahora con prueba: ΔL ≥ 0.05 y en la dirección correcta).

### 16.5 `tokens.json` (`grana theme --doc[=archivo]`)

Documento con el formato de un sistema de diseño: `{ name, version, color: { themes, tokens[] }, radius, spacing, meta }`. Cada token de color lleva `name`, `cssVar`, `value: { light, dark }`, `usage` (texto, en `usage.js`) y, si es texto o control, `contrast: { against, light, dark }` (razón WCAG medida). `buildTheme` lo devuelve como `doc`.

### 16.6 Límites

- Es una propuesta calculada, no una decisión de diseño: si una marca roja obliga a un «danger» anaranjado, el CLI lo dice (`notes`) y el usuario puede fijarlo con `overrides`.
- Con `dark: false` no se deriva el oscuro de nada de esto.
- **Presencia de los colores en oscuro (investigación pendiente, «Dark Color Presence»):** la derivación oscura de `accent` y de los semánticos solo garantiza el mínimo WCAG de 4.5:1; puede cumplirlo y tener poca presencia visual. No se modifica la regla hasta probarla con distintas familias cromáticas (`design/lab/tema-oscuro/investigacion-dark-color-presence.md`).
- Los colores de gráficas de datos (series) no se derivan: las categorías son para iconos y etiquetas.

## 17. Arquitectura de tokens y roles de color (propuesta v0.2)

**Estado:** Proposed (parcialmente implementado, ver §17.23) · **Dueño:** lima · **Ámbito:** `@grana/cli`, `@grana/vue`, Design Hub. No reemplaza §1 a §16: formaliza sus relaciones para que las equivalencias de v0.1 (`brand ≈ primary`, `accent → focus`) no se vuelvan dependencias permanentes. DECISIONS.md #94.

### 17.1 Cinco niveles

```
Seed (config) → Reference → Semantic → Component → Instance
```

| Nivel | Qué es | Ejemplos | Consume |
| --- | --- | --- | --- |
| 1 · **Seed** | Decisiones de identidad que da el usuario (`grana.config.json`). No las leen los componentes | `brand`, `accent`, `radius`, `space`, `font`, `fontSize`, `typeScale` | — |
| 2 · **Reference** | Escalas y valores derivados de los seeds; materia prima, sin intención de interfaz | `brand`, `brand-strong`, `-soft`, `-text`, `on-brand`, `accent-*`, `neutral-*`, `cat-*`, `radius-*`, `space-*`, `text-*` | Seed |
| 3 · **Semantic** | Intención de interfaz: responde «¿para qué se usa?», no «¿qué color es?». **Los componentes dependen sobre todo de este nivel** | `primary`, `on-primary`, `link`, `selection`, `active`, `focus`, `surface`, `surface-sunken`, `text*`, `border*`, `success`, `warning`, `danger`, `info` | Reference |
| 4 · **Component** | Solo si el componente tiene una necesidad que no cabe en un token semántico | `--g-btn-radius`, `--g-dialog-surface`, `--g-sidebar-width`, `--g-widget-gap` | Semantic |
| 5 · **Instance** | Props, variantes y overrides locales de una instancia | `<g-btn color="danger">`, `rounded="pill"` | Component / Semantic |

Un nivel consume tokens de los anteriores y **no se salta niveles** sin una excepción documentada. La **precedencia efectiva es la inversa**: Instance > Component > Semantic > Reference > Seed, y un nivel más específico solo sobrescribe a uno anterior si el contrato del componente lo permite.

### 17.2 Los componentes no leen seeds

Un componente lee `var(--g-color-primary)`, nunca un seed ni (a largo plazo) `var(--g-color-brand)`.

**Alcance de un override en una sección.** Los roles son alias resueltos donde se declaran (§10): para cambiar el color principal dentro de una sección hay que fijar `--g-color-primary` y sus derivados (`primary-strong`, `primary-soft`, `primary-text`, `on-primary`, `on-primary-soft`), no `--g-color-brand`.

### 17.3 Tema claro y oscuro

Comparten la misma arquitectura semántica: los componentes no saben qué esquema está activo; el cambio ocurre **solo** por la redeclaración de tokens (§15).

### 17.4 `brand` y `primary` son conceptos distintos

`brand` = identidad. `primary` = acción o jerarquía interactiva principal. En v0.x comparten valor: `primary` es alias de `brand` (y `primary-strong`, `-soft`, `-text`, `on-primary`, `on-primary-soft`, de sus equivalentes). Con solo `{ "brand": … }` se resuelve `primary = derived(brand)`. **Clave `primary` propia (implementada, DECISIONS.md #107):** `{ "brand": "#9D1635", "primary": "#7D1230" }` deriva los seis tokens `primary*` del color dado sin cambiar el contrato de ningún componente (porque ya leen `primary`); `brand` y sus derivados no cambian.

### 17.5 Roles derivados de `accent`

`accent` sigue siendo una sola entrada. Internamente se separan los roles: `focus ← accent-text`, `link ← accent-text`, `selection ← accent-soft`, `active ← accent`. Se pueden sobrescribir con `overrides` (`--g-color-focus`, `--g-color-link`…) y la validación corre **después** del override.

### 17.6 Tokens de componente

Un token `--g-{componente}-{nombre}` solo se crea cuando no basta (en este orden) un Reference, un Semantic, un token estructural existente o una prop. **No se crea para renombrar** un semántico (`--g-btn-primary-color: var(--g-color-primary)` es incorrecto). Antes de usarse, se registra en el contrato.

### 17.7 Semánticos de estado

`success`, `warning`, `danger`, `info` y `neutral` conservan su significado aunque cambie su color: `danger` significa siempre crítico o destructivo.

### 17.12 Colisiones entre marca y semánticos: `semanticCollision`

Se detecta con la distancia OKLab (§16.1). La **corrección** es una política:

| Valor | Comportamiento |
| --- | --- |
| **`warn`** (por defecto) | Conserva el semántico, **calcula la alternativa**, avisa (`semantic-close`, con `recommended`) y la documenta en `tokens.json` (`recommended` en el token y en `diagnostics`). No cambia en silencio el significado visual que fijó el diseñador |
| `adjust` | Aplica la separación de §16.1 (tono ±45°, luminosidad ±0.15, croma ≈ original; el cambio mínimo que cumpla). Sigue sujeto a validación de contraste |

**Valor configurado y valor derivado.** Sin `accent` del usuario, el acento se deriva de `brand` (§1). Los avisos y diagnósticos lo distinguen: «`danger` se parece a la marca (a través del acento derivado)» frente a «`danger` se parece al acento» (cuando el usuario lo definió). Internamente la colisión sigue registrándose con `accent` (`collidedWith: "accent"`, `accentDerived: true`).

### 17.13 Transparencia del motor

Toda decisión cromática automática relevante es observable: `buildTheme` devuelve `diagnostics` (`code`, `token`, `source`, `input`, `value`, `status`, `reason`, `message`; y `recommended`/`distance` en colisiones), el CLI imprime las notas y `tokens.json` las incluye. Estados posibles: `default`, `derived`, `adjusted`, `override`. **No se hacen cambios cromáticos significativos en silencio.**

### 17.14 Categorías ≠ paleta de datos

`categories` genera **colores categóricos de interfaz** (iconos, badges, etiquetas, estados categóricos, identificación visual). **No son una paleta de visualización de datos**, que exige además discriminación perceptual, daltonismo, orden secuencial, escalas divergentes y contraste entre series. Una futura especificación podrá definir `--g-data-series-*`, `--g-data-sequential-*` y `--g-data-diverging-*` sin tocar `--g-color-cat-*`.

### 17.16 Neutros

`neutrals: "tinted" | "pure"` (§16.2). Los teñidos mantienen croma bajo: una superficie neutral **no** debe percibirse claramente como superficie de marca; la identidad se siente antes de identificarse.

### 17.17 La accesibilidad es una restricción de la generación

`generar → validar → ¿pasa? → sí: emitir; no: ajustar y volver a validar`. El motor no emite un tema como válido si incumple los mínimos (§7, §12, §15): en el CLI, un error de contraste impide escribir nada.

### 17.18 `tokens.json` como representación del sistema

No es solo una exportación: cada token de color documenta `name`, `cssVar`, **`level`** (`reference` o `semantic`), **`source`** (la entrada o el token del que sale), `value` (`light`/`dark`), `usage`, `contrast` (si es texto o control), **`status`** (`default`, `derived`, `adjusted`, `override`) y, en colisiones, `recommended` y `notes`. La raíz añade `diagnostics`.

### 17.20 Fuente única

```
grana.config.json → Theme Engine → tokens.css · tokens.json · diagnostics → @grana/vue · Design Hub · tooling
```

La misma derivación alimenta CSS, documentación, Design Hub, validación y CLI: **no hay implementaciones independientes** de las reglas cromáticas en cada consumidor.

### 17.23 Estado de implementación (v0.1.x)

| Parte | Estado |
| --- | --- |
| §17.4 y §17.5: tokens `primary*`, `on-primary*`, `link`, `selection`, `active` como **alias** (en los tres bloques de `defaults.css`, `@layer grana.defaults`) | Hecho |
| §17.12 `semanticCollision` (`warn` por defecto, `adjust`) | Hecho |
| §17.13 `diagnostics` y §17.18 `level` / `source` / `status` / `recommended` en `tokens.json` | Hecho |
| §17.14 `categories` documentado como colores categóricos | Hecho |
| §17.2: **componentes de `--g-color-brand*` / `--g-color-on-brand*` a `primary*`** (16 hojas de estilo, verificado: 0 diferencias en 3290 elementos, claro y oscuro) y el ítem activo de `GSidebar` a `active` (**corregido en #239**: la barra activa va hoy en `--g-color-accent-text`, porque como trazo `active` no llega a 3:1 con un acento pálido, #228); una prueba impide volver a leer `brand` | Hecho |
| §17.2: variantes `color="accent"` y la barra de carga de `GDialog` | Se quedan en `accent`: la prop `color` elige la **familia** (`brand`, `accent`, `success`…), y `accent` es también un rol semántico (§17.1). `link` y `selection` aún no tienen consumidores en los componentes |
| §17.4 clave de configuración `primary` propia | **Hecho** (#107) |
| Regla «sin saltar niveles» como comprobación automática (`packages/vue/src/tokens/levels.test.js` y `roles.test.js`): los componentes no leen semillas ni `brand`, no escriben colores literales, todo `var(--g-*)` existe en el tema o lo declara el propio componente y ningún componente redeclara un token del tema | **Hecho** (#107). «Sin tokens de componente que solo renombran» sigue siendo norma de revisión (no es decidible automáticamente) |
| `--g-data-*` para gráficas | Fuera de alcance |

## 18. Tabs (`--g-tabs-*`)

**Tokens de componente de `GTabs`** (`design/contracts/tabs.md`, DECISIONS.md #120). Se agregan porque el aspecto de `segmented` y `contained` depende de la **superficie anfitriona** y de la densidad, y ningún token existente lo expresa sin literales. Los **valores** los fija coco en `defaults.css` (capa `grana.defaults`); aquí solo se nombran y se acota la regla. Sin valores de respaldo en el componente.

| Token | Para qué | Regla |
| --- | --- | --- |
| `--g-tabs-track` | Fondo de la pista de `segmented` | Un paso de tono **relativo a la superficie anfitriona** (más oscuro sobre superficie clara; más claro sobre oscura), como la `inset` de `GSurface` (#99); se redeclara en el tema oscuro (§15) |
| `--g-tabs-thumb` | Fondo del segmento seleccionado de `segmented` | Distinto de la pista y del anfitrión; borde o contorno ≥ 3:1 si el contraste de fondo no basta (#89) |
| `--g-tabs-band` | Fondo de la banda de pestañas de `contained` | Relativo a la anfitriona; se redeclara en el oscuro |
| `--g-tabs-panel` | Tono de la pestaña activa fundida con el panel (`contained`) | Debe coincidir con la superficie del panel contiguo |
| `--g-tabs-mark-default`, `--g-tabs-mark-comfortable`, `--g-tabs-mark-compact` | Grosor de la marca (línea de `underline` y vertical) por `density` | La densidad elige uno; no se multiplica un único valor; piso de 24px del área táctil no se ve afectado (la marca no es el objetivo táctil) |
| `--g-tabs-inset` | Sangrado inline de la cabecera dentro de su anfitrión | Vive en `GTabs.css` con valor `0px` (excepción a `levels.test.js`); lo sobrescribe la **anfitriona** con un selector más cercano (`GDialog` en `g-dialog__tabs`, un panel) para alinear con su contenido; sin definir, cero. Es la única que un componente anfitrión escribe |

Duración y curva de la marca y de la entrada del contenido: los existentes (`--g-duration-press`, `--g-ease-standard`, `--g-ease-out`); tamaños de contador e insignia: los de `GBadge` `sm`. **Umbral de adaptación** (no es token; lo mide bruno): vertical pasa a horizontal con un ancho de contenedor menor que `--g-space-1 × 120` (480px con `space` 4).

**Límite:** como el resto, los tokens se resuelven en `:root` (§10) salvo `--g-tabs-inset`, que se declara en el anfitrión y se hereda.

**Pendiente no bloqueante:** el CLI no emite `--g-tabs-*`; los temas de usuario usan los valores de `defaults.css`.

## 19. Card y superficie (`--g-card-*`, `--g-surface-padding`)

**Tokens de componente de `GCard`** (`design/contracts/card.md`, DECISIONS.md #134). Se agregan porque el hover, la pulsación y la selección dependen de la **superficie anfitriona** y la media de fondo necesita un velo con contraste, y ningún token existente lo expresa sin literales. Los **valores** los fija coco en `defaults.css` (capa `grana.defaults`); aquí solo se nombran y se acota la regla. Sin valores de respaldo en el componente.

| Token | Para qué | Regla |
| --- | --- | --- |
| `--g-card-hover` | Fondo en hover de una tarjeta interactiva | Un paso de tono **relativo a la superficie anfitriona** (patrón de §18, #120); se redeclara en el oscuro (§15) |
| `--g-card-pressed` | Fondo mientras se pulsa | Un paso más fuerte que el hover |
| `--g-card-selected` | Fondo de la tarjeta seleccionada o «actual» | Relativo a la anfitriona; nunca es la única señal (borde de doble grosor + indicador con icono; #89) |
| `--g-card-scrim` | Velo sobre la media de fondo | Con `--g-card-on-scrim`, el texto cumple ≥ 4.5:1 sobre el peor caso del velo; se redeclara en el oscuro |
| `--g-card-on-scrim` | Color del texto e iconos sobre el velo | |

**No son tokens** (reglas o alias locales `--_*`, §17.6): grosor doble del borde de selected (`2 × --g-border-width`), anillo de foco hacia dentro (`calc(-1 * var(--g-focus-offset))`), línea del pie (`--g-color-border`, separador decorativo sin 3:1), tono del esqueleto (`--g-color-border-strong`; #136), ancho de la media lateral (derivado de `space` y `density`) y caja de `lead` (`space × 10`). Los umbrales de adaptación (`space × 130` y `space × 80`) tampoco: los mide bruno.

**Propiedad pública de `GSurface`: `--g-surface-padding`** (`design/contracts/surface.md`, «Cambio aparte»; #131). La declara `GSurface.css` en cada `.g-surface` con el relleno **ya resuelto** (escala de `padding` × `density`) para que una región a sangre de un componente que la compone (`GCard`) pueda calcular su margen negativo. **Solo lectura**: no es del tema, el usuario no la sobrescribe y no se emite en `tokens.json`; la superficie más cercana gana. Excepción documentada a `levels.test.js` (un componente puede leerla sin declararla; es el caso inverso de `--g-tabs-inset`, que el anfitrión escribe).

**Pendiente no bloqueante:** el CLI no emite `--g-card-*`; los temas de usuario usan los valores de `defaults.css`.

## 20. Toast (sin tokens nuevos)

**`GToast`/`GToaster` no añade tokens** (`design/contracts/toast.md`, DECISIONS.md #146; §17.6: ningún existente se queda corto). Cada aviso es una `GSurface level="floating"` (sombra `--g-shadow-2`, radio y borde de `floating`, #100); tipo con `--g-color-{info|success|warning|danger}-text`/`-soft` y `--g-color-neutral*`; movimiento con `--g-duration-*` y `--g-ease-*`; objetivos de `GBtn`.

**No son tokens** (constantes de diseño derivadas de `space`, fijadas por coco en `GToast.css`, #148): ancho `min(space × 90, 100% − 2 × margen)`, separación entre avisos `space × 2`, margen al borde `space × 4` (`space × 2` en móvil) combinado con `env(safe-area-inset-*)`, entrada `space × 4`, marca de inicio `space-1` (solo `error` sólida y `warning` discontinua). **Variables dinámicas en línea** (alias `--_*`, excepción justificada como `--_mark-*` de `GTabs`; `GToast.css` las declara con su valor neutro y las de línea ganan): `--_toaster-offset-top`, `--_toaster-offset-bottom` (opción `offset`), `--_toast-swipe` (arrastre) y `--_toast-y` (posición fija del aviso que sale: con `data-edge="top"` su `offsetTop`; con `bottom`, `lista.clientHeight − offsetTop − offsetHeight`). **Umbral móvil** `space × 130` (el de `GDialog`, #103), medido por bruno. Las duraciones de autocierre son **comportamiento** del gestor, no tema.

## 21. Formularios (`--g-form-*`)

**Tokens de componente del sistema de formularios** (`design/contracts/form.md` §9, DECISIONS.md #167, revisados en r02 por #182). Se agregan porque el **ritmo** del formulario (aire entre filas, entre campos de una línea y entre secciones) es una decisión que un producto puede querer ajustar (captura densa frente a configuración aireada) y se usa en CSS (admite `var()`); ningún token existente lo expresa. Los **valores** los fija coco en `defaults.css` (capa `grana.defaults`); aquí solo se nombran. Sin valores de respaldo en los componentes. No son de color: no se redeclaran en el oscuro (§15).

| Token | Para qué | Regla |
| --- | --- | --- |
| `--g-form-gap` | Separación entre hijos de `GFormLayout` (filas) y entre las líneas de una `GFormRow` partida; las partes de `GFieldGroup`, la mitad | Base de `density="default"`; se multiplica por el factor compartido (1, 0.875, 0.75; #15, #114) |
| `--g-form-column-gap` | Separación entre campos de una misma línea de `GFormRow`; las partes de `GFieldGroup`, la mitad | Ídem |
| `--g-form-section-gap` | Separación entre `GFormSection` consecutivas y antes de `GFormActions` | Ídem; del orden de 2× `--g-form-gap` (la sección se distingue por espacio, no por cajas) |

**Retirados en r02** (#182): `--g-form-max-xs` y `--g-form-max-sm` (anchos máximos de lo compacto en una columna). La distribución ya no usa anchos máximos: lo compacto es un **peso dentro de una fila** que siempre llena el ancho (#171). Se quitan de `defaults.css` (coco) y de `packages/cli/src/defaults.js` (bruno).

**No son tokens:** los **pesos y mínimos** de los tamaños `g-form-w-{xs|sm|md|lg}` (2/`space × 20`, 3/`× 32`, 4/`× 40`, 8/`× 60`): constantes de diseño leídas por el JS de `GFormRow`, que deciden qué campos comparten línea (comportamiento, no aspecto; #174, como #130); el umbral de apilado de `GFormActions` (`space × 104`); la separación interna de una sección, el ritmo etiqueta → caja → pie, el margen del pie fijo, el alto de los enlaces del resumen y las separaciones internas de `GInputGroup`, derivados de `space` en el CSS de coco; el **solo lectura** (`--g-color-neutral-soft` + borde discontinuo `--g-color-border-control` + `--g-color-text`, #165 revisado por #186: en oscuro `neutral-soft` queda un paso por encima de la superficie, no un pozo); advertencia y válido (`--g-color-warning-text`, `--g-color-success-text`); los alias de colocación `--_form-row-*` de `GFormRow` (variables dinámicas en línea y alias registrados de coco, form.md §4).

**Propiedad pública de entrada: `--g-form-min`** (#174). El consumidor la pone en un hijo de `GFormRow` (`style="--g-form-min: 50"`) para darle un **mínimo propio**, como **número sin unidad en múltiplos de `space`**; el mínimo efectivo es el mayor entre el de su tamaño y este. coco la registra con `@property` (`syntax: '<number>'`, `inherits: false`, valor inicial `0`) para que no pase a las partes del hijo. **No es del tema**: no se emite en `tokens.json`; excepción documentada en `levels.test.js`, como `--g-form-actions-size`.

**Propiedad pública de `GForm`: `--g-form-actions-size`** (#163). `GForm` la escribe **en línea** en el `<form>` con la altura medida de su `GFormActions sticky`, y `GForm.css` la declara con `0px` en `.g-form` (la de línea gana). La usa `GForm.css` para el `scroll-margin-block-end` de lo enfocable (WCAG 2.4.11). **Solo lectura**: no es del tema, no se emite en `tokens.json`; excepción documentada a `levels.test.js` como `--g-surface-padding` (§19).

**Reservado para la Fase 3** (se nombrará con su contrato): ancho de la navegación de secciones (`GFormNav`). La **barra del bloque condicional** (`GFormReveal`) se resolvió **sin tokens propios** (§26, #280), y las secciones **plegables, agregables, al lado y con línea** también (§27, #291).

**Pendiente no bloqueante:** el CLI no emite `--g-form-*`; los temas de usuario usan los valores de `defaults.css`.

## 22. Divider (`--g-divider-inset`)

**Token de componente de `GDivider`** (`design/contracts/divider.md`, DECISIONS.md #191). Se agrega porque la **cantidad** que acorta la línea con `inset="both"` o `inset="start"` depende de la **anfitriona** (relleno, icono y densidad de una lista, relleno de una barra), que el divider no conoce, y se usa en CSS; ninguna prop ni token existente lo expresa sin repetir la medida en cada instancia (patrón de `--g-tabs-inset`, §18, #120). Sin valor aquí.

| Token | Para qué | Regla |
| --- | --- | --- |
| `--g-divider-inset` | Cuánto se acorta la línea por cada extremo con `inset="both"` y por el inicio con `inset="start"`, en ambas orientaciones | Valor por defecto en `defaults.css` (capa `grana.defaults`) **en `:root`**: **`space × 2`** (coco, #193). Condición del valor por defecto: un solo token sirve a las dos orientaciones y el vertical lo resta **dos veces** del alto de la fila, así que debe dejar visible un vertical con `inset="both"` en filas de `GBtn` `xs` y `sm` (con `space × 4`, el del prototipo, mediría 0). **Se hereda**: una anfitriona lo redefine en su propio elemento y gana por cercanía; `GDivider.css` solo lo lee (no lo declara). No es de color: no se redeclara en el oscuro (§15). No se multiplica por densidad: si la cantidad depende de la densidad, la anfitriona la calcula con la suya |

**Diferencia con `--g-tabs-inset`:** aquel vale `0px` sin anfitriona (una cabecera de pestañas no se sangra por defecto); este necesita un valor visible por defecto, porque `inset="both"` pedido sin anfitriona que lo defina debe acortar la línea.

**Límite de la anfitriona** (#194): un valor redefinido mayor que la mitad del alto de contenido de la fila deja el vertical con `inset="both"` en 0, sin aviso (medirlo daría falsos positivos en contenedores ocultos); lo documentan el contrato y el README.

**Solo consumidores lo redefinen** (#195): ningún componente de Grana lo declara; `levels.test.js` lleva un mapa nombrado de anfitrionas, vacío, con `GFormSection` (Fase 3) como único candidato previsto y solo por decisión de lima. **Decidido (#290):** la línea de `divider` va sin inset, así que `GFormSection` **no** lo redefine y el mapa sigue vacío.

**No son tokens** (§17.6): el tono de la línea (`subtle` = `--g-color-border`; `strong` = `--g-color-border-control`, ≥ 3:1, #89; con `prefers-contrast: more`, las dos `border-control`), el grosor (`--g-border-width`), el texto (rol `body-sm` completo: `--g-text-body-sm-size`, `-line`, `-weight`, `-tracking`, en `--g-color-text-muted`; `--g-color-text` con `prefers-contrast: more`), y la separación texto ↔ línea y el mínimo de cada línea (alias locales de coco derivados de `space`).

**Regla de líneas internas (#195; hallazgo 7 de kiwi, resuelto por coco sin unificar):** `--g-color-border` es la línea **entre secciones que ya tienen aire o título** (secciones y pies de `GDialog`, pies de `GCard` y `GFormActions`, filas de `GTable`, línea base de `GTabs`, `GDivider subtle`); `--g-color-border-strong` es la línea **estructural dentro de un componente denso con relleno**, donde es la señal principal (separador de `GMenu`, cabecera de `GTable`); cuando una línea es la **única** señal, `--g-color-border-control` (≥ 3:1, #89). Un componente nuevo elige por esta regla.

**Límite:** como `--g-tabs-inset`, se resuelve por herencia y no en `:root` solamente (§10): una anfitriona que lo redefine afecta a todos los `GDivider` que contiene, también a los de un componente anidado que no lo redefina.

**Pendiente no bloqueante:** el CLI no emite `--g-divider-inset`; los temas de usuario usan el valor de `defaults.css`.

## 23. Jerarquía tipográfica de los componentes (DECISIONS.md #196)

**Solo documenta lo que hay** en los `G<Nombre>.css` (coco) con la escala de `defaults.css` (§5, fontSize 16, typeScale 1.25). No agrega tokens ni cambia valores. Sirve para que quien compone una pantalla sepa qué tamaño tendrá cada título sin leer los CSS. Si un CSS cambia, esta tabla se actualiza (lima).

**Escala por defecto** (tamaño/interlineado en px, peso): `caption` 12/16 w500 · `body-sm` 14/20 w400 · `body` 16/24 w400 · `title-sm` 20/28 w600 · `title` 25/36 w600 · `title-lg` 31/40 w600 · `display` 39/48 w600. Peso de acción (`--g-text-action-weight`): 500.

**Cómo leer la tabla.** «body 16/600» = tamaño e interlineado del rol `body` con el peso (y el tracking) de un título (`--g-text-title-sm-weight` o `--g-text-title-weight`, ambos 600). Color: `text` = `--g-color-text`; `muted` = `--g-color-text-muted`; `subtle` = `--g-color-text-subtle`. El nivel del encabezado (`h2`…`h6`, prop `headingLevel`) es semántico y **no** cambia el tamaño.

### 23.1 Contenedores con título

| Componente | Título | Subtítulo / descripción | Eyebrow | Notas |
| --- | --- | --- | --- | --- |
| `GDialog` | `__title` (`h2`): **title-sm 20/28, 600**, `text` (heredado) | `__description`: body-sm 14/20, 400, `muted` | — | El título más alto de la librería en un componente |
| `GFormSection` | `__title` (`h{headingLevel}`, por defecto `h3`): **body 16/24, 600**, tracking title-sm, `text` | `__description`: body-sm 14/20, 400, `muted` | — | Sin icono ni línea: se reconoce por el aire y el título |
| `GCard` | `__title` (`h3` por defecto): **body 16/24, 600**, tracking title-sm, `text` | `__subtitle` y `__description`: body-sm 14/20 (heredado de la raíz), 400, `muted` | `__eyebrow`: caption 12/16, **500**, `muted` | `lead` (icono o imagen, decorativo) es el hueco opcional antes del texto |
| `GErrorSummary` | `__title`: body 16/24, 600, tracking title-sm, `text` | lista: body-sm 14/20 | — | Mismo rol que `GFormSection`: vive al lado de las secciones |
| `GWidget` | `__title`: **body-sm 14/20, 600**, `text` | `__sub`: caption 12/16, 400, `muted` | `__eyebrow`: caption 12/16, **400**, `subtle` | Denso: un rol por debajo de `GCard` |
| `GToast` | `__title`: body-sm 14/20, 600, `text` | `__description`: body-sm 14/20, 400, `muted` | — | Título y descripción del mismo tamaño; los separa el peso |
| `GTable` | `__caption` (título de la tabla, `<caption>`): body 16/24, 600, `text` | — | — | En celdas: `__title` body-sm 14/600 `text` y `__subtitle` caption 12/16 `muted` (texto de celda, no encabezado de página) |
| `GFilterBar` | `__editor-title`: body-sm 14, 600 | — | — | Título del editor de un filtro |
| `GCalendar` / `GDatePicker` | mes: body 16/24; `GCalendar` 500, `GDatePicker` 400 con el mes en 600 | `GDatePicker __summary`: body-sm 14/20, `muted` | — | Rótulo de navegación, no encabezado de sección |
| `GSpeechHost` (panel de la captura de voz) | `__title` (`h2`): **body 16/24, 600**, `text` (panel compacto, no un diálogo) | `__mode`: body-sm 14/20, `muted`; estado body-sm 600; secundarios body-sm `muted`; privacidad caption 12/16 `muted` | — | Título del transcript (`h3`): **body-sm 14/20, 600**; metadatos de fragmento caption `muted` con el hablante 600 `text`; texto del fragmento body-sm `text`; provisional en cursiva `text-muted` (≥ 4.5:1); nota del dictado body-sm `muted`; duraciones con cifras tabulares (`design/lab/speech/estilo.md`) |
| `GTranscript` (revisión de la captura de voz, F2) | títulos internos (gestor de hablantes, inserción; `h{headingLevel}`, por defecto `h3`): **body-sm 14/20, 600**, `text` (vista densa, un rol por debajo de `GCard`; nunca menos de 14) | ayuda del gestor, original y ayuda del editor: caption 12/16, `muted`; aviso sin diarización body-sm `text` | — | Texto del fragmento body-sm `text`; hablante body-sm **600** `text`; hora caption `muted` con cifras tabulares; marcas caption `muted`; original y cambios body-sm (`muted`, el cambio en `text`); contador body-sm `muted`; rótulo de la vista previa body-sm 500 `muted` (`design/lab/speech/estilo.md` «Fase 2») |
| `GMetric` | valor: tamaño propio del componente (`--_value`), 600, tracking title | — | `__label`: caption 12/16, `muted` | El valor es dato, no título |

### 23.2 Etiquetas, ayudas y mensajes de campo

| Componente | Etiqueta | Ayuda | Mensaje |
| --- | --- | --- | --- |
| `GInput`, `GTextarea`, `GSelect`, `GDatePicker`, `GInputGroup`, `GFieldGroup`, `GCheckboxGroup`, `GRadioGroup` (etiqueta del grupo) | body-sm 14/20, **500**, `text` (`subtle` deshabilitada); dentro de `GFieldGroup__parts`, 400 `muted` | **caption 12/16, 400, `muted`** | caption 12/16; error y aviso 500 (`danger-text` / `warning-text`), válido 400 (`success-text`) |
| `GCheckbox`, `GSwitch` | tamaño del control (`--_fs`/`--_lh`, body-sm en `md`), 400, `text`; en `layout="card"`/`"chip"`, 500 | caption 12/16, `muted` | igual que arriba |
| Opciones de `GRadioGroup` | como `GCheckbox`: tamaño del control, 400, `text`; en `appearance="card"`/`"chip"`/`"segmented"`, 500 (propuesta para coco) | descripción de la opción: caption 12/16, `muted` | — (el mensaje es del grupo) |
| `GForm` | `__required-hint`: body-sm 14/20, `muted` | — | — |

### 23.3 Navegación y listas

| Componente | Texto | Rótulo de grupo |
| --- | --- | --- |
| `GTabs` | body-sm 14; 500, activa 600 (ancho reservado con `data-text`) | — |
| `GSidebar` | body-sm 14/20; logo 600; pestaña 500 | `__group-title` / `__fly-title`: caption 12/16, 500, `subtle` |
| `GMenu` | body-sm 14/20, 400; `danger` 600 | `__group-title`: caption 12/16, 500, `subtle` |
| `GSelect` (lista) | body-sm | `__group-label`: caption 12/16, 500, `muted` |
| `GStepper` | `__label`: tamaño del stepper (body-sm en `md`, caption en `sm`), `muted`; completado `text`; actual `text` 600 | `__description`: caption 12/16, `muted` |
| `GDivider` (con texto) | body-sm 14/20, 400, `muted` | — |

Un **rótulo de grupo** (caption 12) clasifica elementos de una lista; **no** es un título y no cuenta para la regla de abajo.

### 23.4 Regla de uso

- **El título lo decide el contenedor**, no quien lo usa: `GDialog` title-sm 20; `GFormSection`, `GCard`, `GErrorSummary` body 16; `GWidget`, `GToast` body-sm 14. Se pasa por props (`title`, `description`) o slots del componente; no hay primitivas `Text`/`Heading` (#196).
- **El subtítulo o descripción de un contenedor con encabezado es body-sm atenuado** (`GDialog`, `GFormSection`, `GCard`, `GToast`). Excepción de los densos, que bajan un rol: `GWidget __sub`, `GTable __subtitle` y `GStepper __description` son caption 12/16 `muted`.
- **Un solo recurso de jerarquía:** tamaño + peso del título. Sin cambiar de familia, sin mayúsculas forzadas, sin color de acento en el título y sin líneas ni fondos añadidos para «marcar» un título.
- **Nunca un título por debajo de body-sm (14).** Los rótulos de grupo a 12 no son títulos.

**Cadena de un diálogo con formulario** (valores por defecto):

| Nivel | Pieza | Rol |
| --- | --- | --- |
| 1 | `GDialog __title` | title-sm 20/28, 600, `text` |
| 2 | `GFormSection __title` | body 16/24, 600, `text` |
| 3 | etiqueta de campo (`GInput __label`, etc.) | body-sm 14/20, 500, `text` |
| 4 | ayuda de campo | caption 12/16, 400, `muted` |

La descripción del diálogo y la de la sección (body-sm 14, `muted`) van entre su título y el nivel siguiente.

### 23.5 Observaciones vigiladas (sin cambio ahora)

- **(a) `GFormSection` y `GCard` comparten rol de título (body 16/600).** Si una sección contiene tarjetas, la jerarquía se aplana: el título de la sección y el de cada tarjeta miden y pesan lo mismo, y solo el aire los separa. Se vigila en la **Fase 3** de formularios; no se cambia ningún valor ahora.
- **(b) Sección anidada:** hoy no hay regla propia; una `GFormSection` dentro de otra repite body 16/600. Criterio acordado para cuando se trate (coco, Fase 3): **14 px (body-sm) peso 600, nunca más pequeño** (regla de §23.4).
- **(c) Eyebrow:** `GCard __eyebrow` es caption 500 `muted`; `GWidget __eyebrow` es caption 400 `subtle`. Se registra la diferencia; unificar o no es de coco.

### 23.6 Iconos en títulos

Los títulos de sección (`GFormSection`, `GDialog`) **no llevan icono por defecto**. **Resuelto (DECISIONS.md #203, ronda de iconos públicos `design/lab/icons/r01/`):** `GFormSection` gana un **hueco opcional `lead`** como el de `GCard` (decorativo, `aria-hidden`, fuera del `hN`; `design/contracts/form.md` §3); `GDialog` ya tenía el suyo, el slot **`icon`** (`design/contracts/dialog.md`; la redacción anterior de esta sección decía, por error, que no lo tenía) y no gana `lead`. Sin tokens nuevos: el tamaño del icono lo fija cada hueco con su alias local; la jerarquía de esta §23 no cambia.

## 24. Captura de voz (sin tokens nuevos)

**`GSpeechHost`, `GSpeechPill` y `GSpeechTrigger` no añaden tokens** (`design/contracts/speech.md` §13, DECISIONS.md #223; §17.6: ningún existente se queda corto). Pill flotante y panel son `GSurface level="floating"` (sombra `--g-shadow-2`, radio y borde de `floating`, #100); botones de `GBtn`; procesamiento con `GProgress`; texto con `--g-color-text`, `--g-color-text-muted` y los roles `body-sm`/`caption` (§23); foco con `--g-color-focus`; movimiento con `--g-duration-*` y `--g-ease-*`.

**Color por estado** (siempre con icono y texto; los estados de problema llevan además una señal de forma, no solo color):

| Estado | Rol |
| --- | --- |
| Captura viva (`listening`, `speech`, `transcribing`; `reconnecting` con captura) | **Relleno** de la lámpara en **`--g-color-active`** (rol `active ← accent`, §17.5 y §17.23) con el icono en **`--g-color-on-accent`**; tinte `--g-color-accent-soft`; **trazos** (borde vivo y medidor) en **`--g-color-on-accent-soft`** sobre el tinte y la onda en **`--g-color-accent-text`** sobre la superficie (#228). **Nunca `danger`**: grabar no es crítico ni destructivo (§17.7) |
| `denied`, `unavailable`, `error` | `--g-color-danger-text` |
| `reconnecting`, señal plana, fragmento fallido | `--g-color-warning-text` |
| `completed` | `--g-color-success-text` |
| Resto, provisional | Neutros (`--g-color-text-muted` o el que elija coco para el provisional, **≥ 4.5:1**) |

**`active` es un relleno, no un trazo (#228).** El motor garantiza `on-accent` ≥ 4.5:1 sobre `accent` (y `active`), `on-accent-soft` sobre `accent-soft` y `accent-text` sobre `surface` (§2), pero **no** que `accent`/`active` llegue a 3:1 como trazo o elemento gráfico sobre la superficie: con un acento pálido no llega (medido por coco: `spotify` `#A7F3C1` 1.4:1 y `amazon` `#FF9900` 2.1:1 sobre blanco). Regla para todo componente: `active` como **relleno con su par `on-accent`**; para un trazo, borde, barra o icono sobre la superficie que deba cumplir 3:1 (WCAG 1.4.11), `accent-text`; sobre el tinte `accent-soft`, `on-accent-soft`. El CLI no rechaza acentos pálidos (son marcas legítimas como relleno); se le pide un **diagnóstico informativo** en `tokens.json` cuando `active` quede por debajo de 3:1 sobre `surface` (bruno, no bloquea).

**No son tokens** (constantes de diseño derivadas de `space`, fijadas por coco en `estilo.md`): pill de 34px con `space` 4, lámpara `space × 5`, ancho del panel `min(space × 110, 100vw − space × 8)`, separaciones, barras de la onda y del medidor, márgenes al borde combinados con `env(safe-area-inset-*)`, alto máximo de la hoja (~88 % del visor dinámico). **Umbral móvil** `space × 130` (el de `GDialog`, #103), medido por bruno. **Variables dinámicas en línea** (alias `--_*`, excepción justificada como `--_toaster-offset-*`): `--_speech-offset-top`, `--_speech-offset-bottom` (opción `offset`), `--_speech-bar` (nivel de cada barra), `--_speech-x`, `--_speech-y` (posición física del panel, de `placeBlock`) y `--_speech-max-block` (alto disponible del panel). Los tiempos de captura (`SPEECH_TIMING`: fotograma, vigilante, señal plana, agrupación de anuncios) son **comportamiento** del gestor, no tema.

**Borde compartido con `GToaster`** (#225): la reserva del borde de la pill flotante se suma a las variables existentes `--_toaster-offset-*`; no hay token ni variable nueva en `GToast.css`.

**Fase 2 (`GTranscript`; `speech.md` §28.1, DECISIONS.md #254): tampoco añade tokens.** Fila seleccionada con el tono de `GTable` (`--g-color-primary-soft`) **más un borde de inicio** en `--g-color-text` (forma, 3:1; `Highlight` en `forced-colors`); foco de celda con `--g-color-focus`; provisional como en la F1 y eliminado en `--g-color-text-muted` con tachado (≥ 4.5:1); `<del>`/`<ins>` con tachado/subrayado y, si coco añade color, `--g-color-danger-text`/`--g-color-success-text`, nunca solos; marcas en `caption` atenuado con icono («cambió después de insertarlo» en `--g-color-warning-text`); marca de letra del hablante con borde `--g-color-border-control` (discontinuo si no tiene hablante); editor con la apariencia de `GTextarea` y sus mismos tokens. **Color por hablante** solo como complemento y solo si la aplicación declara `speakerColors: n` (las categorías que su tema define, §16.3): la marca del hablante `k ≤ n` (con `data-cat="k"`) lleva **relleno `--g-color-cat-k-soft`, letra `--g-color-on-cat-k-soft` (par garantizado) y borde `--g-color-cat-k-text`** (medido por coco: borde ≥ 3.94:1 sobre la fila seleccionada en el peor tema con categorías, #260); sin declaración, ninguno (un componente no usa valores de respaldo y no puede saber cuántas `cat-*` hay). **Excepción nombrada a `levels.test.js`:** `CAT_FAMILY_READERS` permite **solo a `GTranscript.css`** (y, desde #294, a `GAvatar.css`, §28) leer la familia condicional `cat-k` (`-strong`, `-soft`, `-text`, `on-cat-k`, `on-cat-k-soft`, `k` de 1 a 12) sin que exista en `defaults.css` (que no la define: por defecto `categories: 0`) y sin respaldo; ninguna hoja la declara. Es también, con `GAvatar` (§28), la única lectura documentada de un token Reference (`cat-*`, §16.3) desde un componente. «Cambió después de insertarlo» sobre una fila seleccionada: texto en `--g-color-text` e icono en `warning-text` (`warning-text` no garantiza 4.5:1 sobre `primary-soft`). Separaciones y alto de fila derivan de `space` en el CSS de coco. **Umbral de «Más» y de apilado de la fila: `space × 160`, medido en ejecución** (`data-narrow` en la raíz, #258): una consulta de contenedor no admite `var(--g-space-1)` y un ancho literal no está permitido, igual que el umbral móvil de la F1. Variable en línea: `--_max-height` (prop `maxHeight`, como `GTable`).

## 25. Grupo de radio (sin tokens nuevos)

**`GRadioGroup` no añade tokens** (`design/contracts/radio-group.md`, DECISIONS.md #273; §17.6: ningún existente se queda corto). El **círculo** usa los tokens del cuadro de `GCheckbox` (`--g-color-surface`, `--g-color-border-control`, relleno `--g-color-{color}`/`--g-color-on-{color}`, `--g-radius-pill`); el **chip** y la **tarjeta**, los del chip y la tarjeta de `GCheckbox` (`border-strong`, `{color}-soft`, `{color}-text`, `--g-radius-pill`, `--g-radius-lg`); el **segmentado** es una **caja de campo** (fondo `surface`, marco `border-control` hacia dentro, radio `--g-radius-sm` de la caja por defecto, alturas de `size` derivadas de `space` como `GInput`) con la elegida **rellena** en `--g-color-{color}` y su texto en `--g-color-on-{color}`; separadores decorativos en `--g-color-border`. **No** lee `--g-tabs-track`, `--g-tabs-thumb` ni ningún `--g-tabs-*`: son de navegación (#112, #120) y el segmentado de radios es una respuesta. Solo lectura, advertencia y válido como el resto de campos (§21). Movimiento con `--g-duration-fast`, `--g-duration-press` y `--g-ease-standard` (relleno en su sitio, sin marca que se desliza).

**No son tokens:** el **ancho natural** del segmentado (medido en px por el `.vue` y publicado a `GFormRow` con la función interna `setIntrinsicMin`, `form.md` §4, #271), el umbral de apilado (ese mismo ancho natural) y las separaciones internas, derivadas de `space` en el CSS de coco.

## 26. Bloque condicional (`GFormReveal`; un token global nuevo, ninguno de componente)

**`GFormReveal` no añade tokens de componente** (`design/contracts/form.md` §14, DECISIONS.md #280; §17.6). La **barra** de pertenencia es un borde de inicio con grosor de `--g-border-width` o `--g-space-1` y color de borde existente (`--g-color-border-strong` o `--g-color-border-control`; nunca `accent`, `brand` ni `active`: no es estado ni acción); no se le exige 3:1 porque no es la única señal (orden y sangría), como `GDivider subtle` (#89); en `forced-colors` es un borde y toma el color del sistema. La **sangría**, de `--g-space-*`. Separación del cuerpo: `--g-form-gap` × densidad (§21). Fundido con `--g-duration-fast`; curvas `--g-ease-*`.

**Token global nuevo: `--g-duration-slow`** (§6): movimientos grandes (altura, ancho, desplazamiento de bloques). Nace porque `GFormReveal` es el **tercer** componente que necesita los 240ms que `GSidebar` y `GStepper` derivaban como alias local `--_t-slow` (regla anotada en `plans/README.md`: promoverlo al tercer uso). Valor de coco en `defaults.css`; la derivación vigente (`calc(var(--g-duration-press) * 1.5)`) no cambia nada de lo que se ve. `GSidebar.css` y `GStepper.css` pasan su `--_t-slow` a `var(--g-duration-slow)` (coco); `packages/cli/src/defaults.js` se regenera con `scripts/sync-defaults.mjs` (bruno). No es de color: no se redeclara en el oscuro (§15).

**No son tokens:** la separación del contenedor que el bloque compensa al cerrarse, **`--_reveal-gap`** (variable dinámica en línea, px leídos del `row-gap` calculado del padre; coco declara `0px` neutro; excepción justificada como `--_form-row-*`, #173, #278).

## 27. Secciones de formulario, Fase 3 (sin tokens nuevos)

**`GFormSection` `collapsible`, `addable`, `headerPlacement` y `divider` no añaden tokens** (`design/contracts/form.md` §3, DECISIONS.md #291; §17.6: ningún existente se queda corto). Panel: altura y margen con `--g-duration-slow` (§6, #280), fundido y giro del chevron con `--g-duration-fast`, curvas `--g-ease-*`, como `GFormReveal` (§26). Estado de errores de una plegada: `--g-color-danger-text` con el icono `circle-alert` y texto (nunca solo color). Título, botón y línea de estado con los roles de §23 (título body 16/600; estado y `summary` body-sm). Línea de `divider`: un `GDivider` `subtle` sin inset (sus tokens, §22; `--g-divider-inset` no se redefine, #290). Botones y confirmación: los de `GBtn` y `GDialog`. Separación entre secciones y posición de la línea: `--g-form-section-gap` × densidad (§21).

**No son tokens:** el umbral del encabezado al lado (**`space × 200`**) y el mínimo del título frente a las acciones (**`space × 40`**, L9): constantes que lee el JS de la sección (deciden comportamiento, como #130); la proporción de columnas al lado, la sangría del chevron y las separaciones internas, derivadas de `space` en el CSS de coco.

## 28. Avatar (sin tokens nuevos)

**`GAvatar` no añade tokens** (`design/contracts/avatar.md`, DECISIONS.md #293 a #295; §17.6: ningún existente se queda corto). Lado `space × n` (`xs` 5 · `sm` 6 · `md` 8 · `lg` 10 · `xl` 16) con `--g-space-1`; neutro con `--g-color-neutral-soft` / `--g-color-on-neutral-soft`; iniciales con `--g-font-ui` y un rol `--g-text-{rol}-*` por tamaño (≥ 12px, §7; los elige coco); radio del `square` por tamaño desde `--g-radius-xs` … `--g-radius-lg` (alias local; el `circle` es 50 %, geometría) y **nunca** `--g-radius-shape` (#8, #23: es la forma de las acciones); borde `CanvasText` de `--g-border-width` en `forced-colors`; fundido opcional de la imagen con `--g-duration-fast` y `--g-ease-standard`.

**Categorías:** con `color="k"` o `categories: n`, relleno **`--g-color-cat-k-soft`** y texto/icono **`--g-color-on-cat-k-soft`** (par garantizado ≥ 4.5:1, §2 y §16.3). **`GAvatar.css` entra en la excepción nombrada `CAT_FAMILY_READERS`** de `levels.test.js` (§24, #260, #294), limitada a esas dos familias (`k` de 1 a 12), sin respaldo; `defaults.css` sigue sin definirlas. La categoría derivada usa un hash estable documentado en el contrato (FNV-1a de 32 bits sobre UTF-8 + `fmix32`, `mod n + 1`).

**No son tokens:** el número de letras por tamaño y la regla de escrituras anchas (estructura); el tamaño del icono de respaldo y la separación interna (alias locales de coco desde `space`); la posición de una `GBadge` anclada sobre el contorno de un círculo (constante geométrica `1 − 1/√2` del lado, `GBadge.css`, #297).

## 29. Personalidad: lenguaje de movimiento (dos curvas nuevas, ninguna duración nueva)

Ronda transversal de kiwi (`design/lab/personalidad/r01/`, §2) y decisiones del usuario del 2026-10-03 (DECISIONS.md #299; por componente, #300 a #305).

### 29.1 Curvas

| Token | Para qué | Uso aprobado | Nunca |
| --- | --- | --- | --- |
| `--g-ease-spring` | Desplazamientos que **llegan** con masa: rebasa 3,8 % y asienta antes del 70 % del tiempo | Borde de atrás de la marca de `GTabs` (#302); **cambio de forma (punto ↔ compacta ↔ abierta) y toque de `GStatusIsland`** (#324, decisión del usuario del 2026-10-04: tercer uso, sutil); **la ficha elegida que llega al campo en `GCombobox`** (#336: cuarto uso; el despliegue de su lista **no**, va con `--g-ease-out`); con `multiple`, el renglón que llega a la cesta de la paleta es **ese mismo uso** (#427), no uno nuevo | Entradas, diálogos, menús, paneles, bloques (la isla **nace** con `--g-ease-out`, no con el muelle) |
| `--g-ease-bounce` | Escalas **pequeñas**: rebasa 20 % de un cambio de `1 − --g-press-scale` (pico 1,006 con 0,97) | Soltar `GBtn` (#300); **la marca de la casilla de `GCombobox multiple` al marcar por un gesto**, desde la escala `0.4` (#427: segundo uso; una marca de 1em, rebase ≈ 12 %) | Desplazamientos (en 200px serían 40px), superficies grandes |

- **Valores:** los de §6, como valor por defecto; coco los escribe en `defaults.css` (capa `grana.defaults`) y bruno regenera `packages/cli/src/defaults.js` (`node packages/cli/scripts/sync-defaults.mjs`). No son de color: no se redeclaran en el oscuro (§15). El CLI no valida curvas; un tema puede escribir cualquier `<easing-function>`.
- **Duración:** siempre `--g-duration-slow`. El máximo de la interfaz sigue en 240ms (#71, #280).
- **Apagar el rebote** en un producto sobrio: `--g-ease-bounce: var(--g-ease-out); --g-ease-spring: var(--g-ease-out);` en su tema. Ningún componente cambia.
- **Límite conocido:** el pico de `--g-ease-bounce` es proporcional a `1 − --g-press-scale`; un tema con `--g-press-scale` 0,9 lo lleva a ~1,02. Se documenta; el CLI no lo limita.
- **Soporte:** la transición que usa una de las dos curvas va dentro de `@supports (transition-timing-function: linear(0, 1))`; fuera queda la vigente. No basta con declarar antes la vigente: con `var()`, una curva no soportada invalida la declaración en tiempo de cálculo y `transition` queda sin valor.
- **Un uso nuevo** de cualquiera de las dos es una decisión nueva (lima; si cambia la identidad, el usuario).

### 29.2 Duraciones por jerarquía (tokens existentes)

| Nivel | Token | Qué |
| --- | --- | --- |
| Color y fundidos | `--g-duration-fast` | Hover, selección, opacidad de piezas pequeñas, salidas |
| Respuesta | `--g-duration-press` | Pulsar, entrada de un popover, borde que avanza, mensaje que aparece |
| Bloques y asentamiento | `--g-duration-slow` | Paneles, alturas, muelles, sacudida, vuelta de una pulsación |

La salida es más corta que la entrada (#152). Lo frecuente usa el nivel más bajo posible.

### 29.3 Movimiento reducido (regla transversal; amplía el plan 007)

| Con `prefers-reduced-motion: reduce` | Se queda | Se va |
| --- | --- | --- |
| Colores, bordes, opacidad | Sí: fundido de `--g-duration-fast` | — |
| Desplazamiento, escala, rebote, sacudida, escalonado | — | Sí: el estado final aparece en su sitio |
| Halo que sigue al puntero | — | Sí (movimiento continuo) |
| Fijar el borde de un diálogo (`is-pinned`) | Sí: no es movimiento | — |

La información que daba el movimiento (dirección, origen, cuál falló) es siempre redundante con texto, foco, forma o marca. Además: **nada se anima al montar** (`is-ready`, plan 012) y los efectos de puntero solo existen con `@media (hover: hover)`.

### 29.4 Transiciones y keyframes

Transiciones por defecto (#71). **Keyframes** solo para reacciones únicas a un suceso que no se expresan como cambio de estado (la sacudida de un campo rechazado, #304; las cifras que ruedan y el tope de `GNumberField`, `g-number-roll…` y `g-number-bump…`, #313) y para el giro de carga; **el mensaje de un campo que aparece es una transición**, con su estado de partida en `.g-input__message:empty` y la `transition` solo bajo `is-ready` (corregido por la medida del plan 018, #306): unas keyframes condicionadas a `is-ready` se reproducirían al llegar la clase en un campo que monta con error. Las keyframes llevan nombre con prefijo `g-` (la sacudida, `g-reject…`: `GForm` filtra su `animationend` por ese prefijo), finitas, nunca al montar.

### 29.5 Datos del `.vue` al CSS (no son tokens)

Variables dinámicas en línea (excepción justificada a «sin estilos en línea», como `--_mark-*` de `GTabs`, #121 y #122, y `--_x`/`--_y` de `GMenu`) y atributos: `data-direction` y `data-orientation` (`GTabs`, `GTabPanel`; #306), `--_origin-x`/`--_origin-y` y `--_pin-top` (`GDialog`), `--_pointer-x`/`--_pointer-y` (`GCard`; se retiran al quitar las escuchas, no en `pointerleave`; `--_select-x`/`--_select-y` reservados **sin uso**: C2 sale por anclaje CSS), `--_active-y`/`--_active-h` (`GMenu`). `data-direction` en la capa de P2 y `data-bump` en P3 (`GNumberField`, #313). `--_island-w`/`--_island-h` (px del tamaño natural de la forma actual), `--_status-offset-top`, `data-form` e `is-nudge` (`GStatusIsland`, #324). `--_x`, `--_top`, `--_bottom`, `--_w`, `--_max` y `--_field-h` (colocación de la lista de `GCombobox`), `--_travel-x`/`--_travel-y` e `is-arriving` (llegada de su ficha, #336). `--_x`, `--_y`, `--_yb`, `--_tooltip-ax`/`-ay`/`-aw`/`-ah` (geometría de la pestaña) y `data-side`, `data-instant`, `data-travel`, `data-dwell`, `data-touch` (`GTooltip`, #388, #389). `is-entering` en la palabra de la lectura y `data-compact` en las dos lecturas (`GTimeField`, #407). Las clases de estado que los acompañan (`has-origin`, `is-pinned`, `has-highlight`, `is-highlight-instant`, `is-rejected`, `is-ready` de `GInput`, `is-rolling` e `is-bumping` de `GNumberField`) se fijan en cada contrato.

### 29.6 Constantes de coreografía (neutras, #187)

| Constante | Dónde |
| --- | --- |
| `0.25` (fracción del vector de origen) y tope `--g-space-1 × 8` por eje | Entrada y salida de `GDialog` desde el disparador (#301) |
| `--g-space-1 × 4` | Entrada lateral del panel de `GTabs` (#302) |
| `--g-space-1 × 1` | Etiqueta de `GBtn` que cede el sitio (#300); mensaje de `GInput` que baja (#304); la franja del día que entra en `GTimeField` (`g-time-reading…`, #407) |
| Amplitudes `1 · 0.75 · 0.5 · 0.25` × `--g-space-1`, instantes `16 · 36 · 56 · 76 %` | Sacudida de un campo rechazado (#304) |
| `--g-space-1 × 0.5` | Tope de `GNumberField` (P3): el número sube o baja y vuelve (#313) |
| `0.4` (escala de partida) | La marca de la casilla de `GCombobox multiple` al marcar (`g-combobox-tick…`, #427) |
| `12` y `6` (constantes de **JS**: filas antes de «Ver las N») | `GCombobox multiple`: «Elegidas» y la cesta (12), la receta en reposo (6) (#425, #426) |
| `0.86` (escala de partida) | Toque (`g-status-nudge`) y nacer de `GStatusIsland` (#324; valor del prototipo que vio el usuario) |
| `300 000 · 60 000 · 30 000` ms (constantes de **JS**) | Umbrales de anuncio de la cuenta atrás de una condición (`status.md`, #320) |
| `600ms` (retardo del anuncio de resultados) y `10` (filas de Av Pág / Re Pág), constantes de **JS** | `GCombobox` (#334, #336); `delay` (250 ms) es una **prop**, no una constante |
| `400ms` y `60ms` (constantes de **JS**: primera repetición y cadencia) | −/+ de `GNumberField` mantenidos (#313); como `HOVER_MS`, no son tema |
| `180ms` (`HOVER_MS`, constante de **JS**, no un token ni un valor del tema) | Pausa del puntero: abre un submenú al pasar y, en M4, cambia el elemento si el puntero se **detiene** dentro del triángulo (`GMenu.vue`, #305 y #308) |
| `OPEN` 350 · `CLOSE` 100 · `SKIP` 600 · `NAV` 1000 · `DWELL` 700 · `LONG` 500 · `LINGER` 1500 ms, `MOVE` 10px y lectura en táctil `min(6000, max(1500, 1000 + 50 × caracteres))` ms (constantes de **JS**) | Motor de `GTooltip` (`utils/tooltip.js`; `tooltip.md`, #384, #385, #389); 350 y 600 son los de la pista de `GSidebar` |

**No son constantes:** `0.97` es `--g-press-scale`; `1.006` es un resultado **medido** (criterio de verificación de #300), no un valor escrito; `32px`, `±16px` y `4px` se escriben siempre como múltiplos de `--g-space-1` y siguen a `space`.

### 29.7 Alias locales y propiedades registradas privadas (no son tokens)

Variables `--_*` **internas** del CSS de un componente (no se leen desde fuera, no se tematizan, el CLI no las conoce). Las que van con `@property` **llevan el nombre del componente** porque `@property` es global (como `--_card-selected` de `GCard`):

| Variable | Dónde | Qué es |
| --- | --- | --- |
| `--_tabs-s` y `--_tabs-e` (`@property`, `<length>`) | `GTabs.css` | Los **dos bordes** de la marca (inicio y fin en el eje de las pestañas), derivados de `--_mark-x/y/w/h` para que cada uno interpole con su propio tiempo (T1, #302) |
| `--_tabs-clip` (`@property`, `<length>`) | `GTabs.css` | Margen del recorte de `g-tabs__panels` (= `--g-focus-width` + `--g-focus-offset`); registrada porque Chromium calcula `overflow-clip-margin: calc(…)` como `0px` y con una longitud ya resuelta sí lo aplica (#306) |
| `--_from-x` y `--_from-y` | `GDialog.css` | **Alias** de la entrada y la salida de D1: el vector escrito por el `.vue` (`--_origin-x/y`) × `0.25`, acotado a ± `--g-space-1 × 8` por `clamp` (#301) |
| `--_active-y` y `--_active-h` | `GMenu` (`.vue` → CSS) | **Dato** del `.vue` (px: posición y alto del elemento activo de cada lista), ya listado en §29.5; el CSS los lee y no los reescribe |
| `--_card-veil`, `--_card-selected` (`<color>`) y `--_card-reach` (`<percentage>`, 0 % a 100 %) (`@property`) | `GCard.css` | **Velo de hover/pulsación, tinte de seleccionada y alcance del círculo** de C2 (#303). Se animan **en la raíz** y el `::before` los hereda (`inherit`), porque WebKit cancela las transiciones de un elemento colocado con `anchor()`; `--_card-reach` es `<percentage>` porque WebKit no interpola `<length-percentage>` entre longitud y porcentaje |
| `--_card-glow` (`@property`, `<color>`) | `GCard.css` | Color del halo de C1 (dos capas del mismo `--g-card-hover`); se funde en `--g-duration-press` y se apaga al apretar |
| `--g-card-select` (`anchor-name`, **no es un token**) | `GCard.css` | Nombre de anclaje **neutro** del indicador de selección (`g-card__selectbox`, `g-card__tick--static`); con `anchor-scope` en cada tarjeta. No se tematiza ni se lee desde fuera |
| `--_pdir`, `--_shift` | `GTabs.css` | Sentido (±1, por `:dir(rtl)`) y magnitud (`--g-space-1 × 4`) de la entrada lateral del panel (T2, #302) |
| `--_tooltip-ax`, `--_tooltip-ay`, `--_tooltip-aw`, `--_tooltip-ah` (si se registran: `@property`, `<length>`) | `GTooltip` (`.vue` → CSS) | **Dato** del `.vue` (px): posición y tamaño de la pestaña relativos a la etiqueta; registradas solo si coco necesita interpolarlas en el viaje (#388) |

Un alias o propiedad registrada nueva de este tipo **no necesita decisión** mientras solo derive de tokens y constantes de §29.6; una **constante nueva** sí (#187).

## 30. Campo numérico (`GNumberField`; sin tokens nuevos)

**`GNumberField` no añade tokens** (`design/contracts/number-field.md`, DECISIONS.md #309 a #313; §17.6: ningún existente se queda corto). **Compone `GInput`** (#309), así que la caja, el prefijo/sufijo, el `output`, el pie, el mensaje, el solo lectura (§21), el foco e I1/I2 usan los tokens de `GInput`. Lo propio: −/+ **cuadrados del alto de la caja** (`--_h` de `GInput`, derivado de `--g-space-1`; piso de 24px y 44px con `pointer: coarse`, §7), separador `--g-border-width` en `--g-color-border-control` (`--g-color-border-strong` con el campo deshabilitado), anillo de seguridad por dentro de −/+ con `--g-focus-width` y el color de foco del campo (si una tecnología de apoyo los enfoca), `cursor: pointer` en −/+, alias locales **`--_nf-border`** (borde real de la caja) y **`--_nf-stroke`** (trazo visible por estado; ×2 en error y advertencia) para que −/+ cubran la caja de borde a borde, icono `--g-color-text-muted` (reposo), `--g-color-text` (al pasar y pulsar) y `--g-color-text-subtle` (deshabilitado), fondo al pasar y pulsar `--g-color-neutral-soft`, transición de color y fondo con `--g-duration-fast` y `--g-ease-standard`. **Personalidad** (#313): P1 sin tokens (la separación es la de la caja de `GInput`: `space × 2` en `md`); P2 y P3 con **`--g-duration-press`** y **`--g-ease-out`** (ninguna curva nueva, §29.1), keyframes con nombre `g-number-roll…` y `g-number-bump…` (§29.4: reacciones únicas a un suceso, nunca `g-reject…`).

**No son tokens:** la repetición de −/+ (**400ms / 60ms**, constantes de JS, §29.6), la amplitud de P3 (**`--g-space-1 × 0.5`**, §29.6), el **`1px`** del cursor y el **`1ch`** del espejo (§7), el **100 %** del desplazamiento de P2 (geometría de la celda de la cifra); el **mínimo intrínseco** que un campo con −/+ publica a su `GFormRow` (px medidos por posiciones por el `.vue` con `setIntrinsicMin`, form.md §4, #271, #312; «Cantidad» 1–99 con −/+ = 112px en `md`, `space` 4), como el ancho natural del segmentado (§25).

## 31. Isla de estado (`GStatusIsland`, `GStatusMark`; sin tokens nuevos)

**La isla de estado no añade tokens** (`design/contracts/status.md`, DECISIONS.md #324 y #325; §17.6: ningún existente se queda corto).

**Superficie inversa** (#325): la isla y la marca enlace usan **`--g-color-text` de fondo y `--g-color-surface` de texto**, icono, borde de insignia y anillo de foco interior (par ≥ 4.5:1 por construcción del tema; se invierte solo en el oscuro, §15; precedentes de `--g-color-text` como relleno: `GSwitch`, `GSidebar`, `GWidgetGrid`). **No usa `brand`** (§2 «Uso»: un solo elemento sólido de `brand` por vista, y la isla es permanente). Insignia de tipo: `--g-color-{info|success|warning|danger}` con su `--g-color-on-{…}`; `error` lee `danger` (#133). Marca de texto: `--g-color-{…}-text` sobre la superficie de la página. Elevación `--g-shadow-2`; radios `pill`, `xl` y `lg`; texto con los roles `body-sm`, `body` y `caption` (§23).

**Movimiento:** cambio de forma y toque con `--g-ease-spring` + `--g-duration-slow` (§29.1, tercer uso); nacer con `--g-ease-out` + `--g-duration-press`; salidas y fundidos con `--g-duration-fast`; giro con `--g-duration-spin`; recolocación por la reserva de borde con `--g-duration-press`. Con movimiento reducido, solo fundidos (§29.3).

**No son tokens:** `0.86` y los umbrales de la cuenta atrás (§29.6); ancho de la isla abierta `min(space × 104, 100% − 2 × margen)`, alto de la compacta `space × 12`, insignia `space × 8` (`× 6` en punto y en la marca), margen al borde `space × 2` combinado con `env(safe-area-inset-top)` (constantes de diseño derivadas de `space`; las fija coco y las anota en su `estilo.md`); el borde de insignia por tipo (sólido, discontinuo, punteado: señal no cromática, no tema). **Variables en línea** (§29.5): `--_island-w`, `--_island-h`, `--_status-offset-top`.

## 32. Combobox (`GCombobox`; sin tokens nuevos)

**`GCombobox` no añade tokens** (`design/contracts/combobox.md`, DECISIONS.md #336; §17.6: ningún existente se queda corto). **Compone `GInput`** (#330) y su superficie es un **`GDialog`** real, así que caja, foco, mensajes, solo lectura, I1/I2 y la hoja usan los tokens de esos dos. Lo propio: fondo de lista `--g-color-surface`; costura campo–lista `--g-color-border` y contorno de la forma abierta `--g-color-border-control`, con el anillo (`--g-focus-width`, `--g-focus-offset`, color de foco del campo) y la sombra (`--g-shadow-2` o `--g-shadow-3`, la que mida mejor coco) sobre **la forma completa**; opción activa `--g-color-surface-sunken` con barra de `--g-focus-width` (o borde de ficha y `--g-shadow-1`); en la paleta, activa con el **par inverso** `--g-color-text` / `--g-color-surface` (#325); línea secundaria, rótulos, grupos y texto fantasma en `--g-color-text-muted` (≥ 4.5:1), deshabilitada `--g-color-text-subtle`; error de carga `--g-color-danger-text`; vista previa sobre `--g-color-surface-sunken`; texto con los roles `body`, `body-sm`, `caption`, `title-sm` y el peso `action` (§23). **Primer consumidor de `--g-color-selection`** (§17.5, `selection ← accent-soft`): fondo del resto fantasma y de la ficha «seleccionada» con el foco.

**Movimiento:** despliegue de la lista con `--g-duration-slow` + `--g-ease-out`; llegada de la ficha con `--g-duration-slow` + `--g-ease-spring` (§29.1, cuarto uso; keyframes `g-combobox-arrive…`); la paleta, la entrada de `GDialog`; color y fondo con `--g-duration-fast` + `--g-ease-standard`; giro con `--g-duration-spin`. Con movimiento reducido, nada se desplaza (§29.3).

**No son tokens:** `delay` (prop, 250 ms); **600 ms** del anuncio y **10** filas de Av Pág (constantes de JS, §29.6); los 240px del criterio «abre hacia arriba» (de `utils/anchor.js`); el umbral literal **520px** (#42, #56); **`--g-form-min: 60`** que el CSS del componente declara en una `GFormRow` con `appearance="field"` (propiedad de entrada de §21, no del tema: el consumidor la sobrescribe); el alto máximo de la lista, el alto del cuerpo de la superficie y la proporción lista–vista previa (constantes de diseño derivadas de `space`; las fija coco y las anota en su `estilo.md`); `24px`/`44px` (área táctil, §7). **Variables en línea** (§29.5): `--_x`, `--_top`, `--_bottom`, `--_w`, `--_max`, `--_field-h`, `--_travel-x`, `--_travel-y`, `--_row-h` (con `multiple`).

**Con `multiple` (Fase 2, `combobox.md` «Fase 2», DECISIONS.md #417 a #428): sin tokens nuevos.** Casilla con `--g-color-border-control` (≥ 3:1) y marcada con relleno `--g-color-brand`, marca `--g-color-on-brand` y contorno `--g-color-text` (`--g-color-surface` en la activa invertida; `brand` solo como forma no llega a 3:1, #429); elemento o renglón marcado para quitar con `--g-color-selection` **y** tachado; «Nueva» con el par `--g-color-accent-soft` / `--g-color-on-accent-soft` y su barra en `--g-color-accent-text` (`accent` no es un trazo, #228); estado del tope con `--g-color-warning-soft` / `--g-color-on-warning-soft`; «Deshacer» como píldora `--g-color-accent-soft` / `--g-color-on-accent-soft` (al pasar `--g-color-accent` / `--g-color-on-accent`); «Ver las N» y «Ver los N» en `--g-color-text` con peso de acción (#429); frase con el foco, número, rastro y recuentos en `--g-color-text-muted`; separación de renglones `--g-color-border`. **Movimiento** (§29): cifras que ruedan (`g-combobox-roll…`) con `--g-duration-press` + `--g-ease-out` (como `g-number-roll`, #313); la casilla salta (`g-combobox-tick…`) con `--g-duration-slow` + `--g-ease-bounce` desde `0.4` (§29.1, segundo uso; §29.6); el renglón nuevo y el pliegue del rastro con `--g-duration-slow` + `--g-ease-out`; el viaje a la cesta con `--g-ease-spring` (el uso de #336). **No son tokens:** los topes `12` y `6` (§29.6), la proporción frase/texto con el foco (coco, `estilo.md`). **Datos del `.vue` al CSS** (§29.5): `is-rolling`, `is-ticking`, `is-entering`, `is-leaving`, `is-arriving` con `--_travel-x`/`--_travel-y` en el renglón de la cesta, y **`--_row-h`** (px: alto medido del renglón, escrito al convertirlo en rastro para que mida lo mismo con cualquier slot `chosen`, #429).


## 33. Distribución automática (`GAdaptiveLayout`; sin tokens nuevos)

**`GAdaptiveLayout` no añade tokens** (`design/contracts/adaptive-layout.md`, DECISIONS.md #339 a #348 y #359 a #364). Es opt-in y no tiene superficie ni movimiento propios. Consume **`--g-form-column-gap`** (separación en línea entre los hijos de una línea) y **`--g-form-gap`** (separación entre líneas), las dos × densidad (1 · 0,875 · 0,75) × el factor de `gap` (`none` 0 · `sm` 0,5 · `md` 1 · `lg` 2). Las fuentes que mide son las **reales** de cada elemento (estilo calculado), no un token. No añade valores al `.vue` ni a `defaults.css`.

**No son tokens:**

- **Política del motor** (constantes de JS, como los pesos y mínimos de `GFormRow`, #174): los perfiles mínimo / preferido / máximo medidos en px a partir de etiquetas, glifos y chrome; el coeficiente experimental de pérdida **24**; el límite de optimización exacta de **64 hijos** y el respaldo lineal; las capacidades de referencia **8 · 16 · 24 · 40 glifos**; el peso 3 del texto libre y de `GSummary`. Son adaptación relativa y límites de trabajo, no tamaños estéticos en píxeles.
- **Factores** de densidad y de `gap` (arriba): multiplicadores geométricos.
- **Variables en línea** (amplían §29.5; nunca en `--g-*` públicos ni con respaldo): `--_adaptive-line`, `--_adaptive-track`, `--_adaptive-width` y `--_adaptive-start` en cada hijo, y `--_adaptive-rows` en la raíz; atributos `data-lines`, `data-line` y `data-strategy`; clases `is-ready` y `has-shared-tracks`.
- `24px` y `44px` del área táctil (§7) como suelo del mínimo de un control.
- **Clases de pista** `g-adapt-{short|standard|wide|full|natural}` (#364): eligen una familia de la política de arriba en el propio hijo, como `g-form-w-*` en `GFormRow` (#174); constantes, no tokens.

**Propiedades públicas de entrada: `--g-adapt-chars` y `--g-adapt-weight`** (#364; sustituyen a los campos `characters` y `weight` de la prop retirada `hints`). El consumidor las pone en un **hijo directo** de `GAdaptiveLayout` (`style="--g-adapt-chars: 5"`, o una regla de su hoja de estilos): `--g-adapt-chars` es la longitud esperada en glifos de referencia de la fuente del hijo (entero positivo) y `--g-adapt-weight` el peso del reparto del sobrante (número positivo); `0`, el valor inicial, significa «sin pista, inferido». Ninguna baja los mínimos de etiqueta, chrome o área táctil (§7). coco las registra con `@property` en `GAdaptiveLayout.css` (`syntax: '<number>'`, `inherits: false`, valor inicial `0`) para que la pista de un grupo no pase a sus hijos; las lee el motor del estilo calculado y ninguna regla de estilo las usa. **No son del tema**: no van en `defaults.css` ni se emiten en `tokens.json`; excepción documentada como `--g-form-min` (§21).

No cambian la política de `GFormRow` ni los mínimos de accesibilidad de §7.

## 34. Ficha de resumen (`GSummary`; sin tokens nuevos)

**`GSummary` no añade tokens** (`design/contracts/summary.md`, DECISIONS.md #355; §17.6: ningún existente se queda corto). Compone `GAvatar` (§28), `GBadge` y `GIcon`, que usan los suyos. Lo propio: lado de la identidad `space × 5/6/8/10/16` con `--g-space-1` (los de `GAvatar`); título y valores en `--g-color-text` (heredado del anfitrión), línea secundaria y código en `--g-color-text-muted`, **rótulos y valores compartidos entre homónimos (`is-same`) en `--g-color-text-subtle`** (los tres ≥ 4.5:1 sobre `bg`, `surface` y `surface-sunken`, §2; sobre otra superficie reapunta y mide el anfitrión); separador entre datos, un filete corto de `--g-border-width` en `--g-color-border-strong` (no un carácter); «+N» con el par garantizado `--g-color-accent-soft` / `--g-color-on-accent-soft` y `--g-radius-pill`; caja del icono de identidad sobre `--g-color-surface-sunken` con `--g-radius-sm`; **formas de carga en `--g-color-border-strong`** con `--g-radius-xs` (como `GCard`; sobre `surface-sunken`, la vista previa de la paleta, no se verían: forma/fondo ≥ 1,45:1 medido); subrayado de la coincidencia (`highlight`) de `--g-border-width` a `--g-space-1 / 2` de la línea base. Lo único entre homónimos (`is-diff`), el identificador y el título pesan `--g-text-title-sm-weight` (nunca un `600` literal).

**Tipografía** (amplía §23; valores del tema por defecto): título **body-sm 14/20** en `xs` y `sm`, **body 16/24** en `md` y `lg`, **title-sm 20/28** en `xl`, siempre con peso de título y `text`; datos y línea secundaria body-sm 14/20 (`text` y `muted`); rótulos de la rejilla de `stack` y «+N», caption 12/16. En `layout="inline"` la ficha **hereda** tamaño, interlineado y familia de su anfitrión (el campo). El título de la ficha no es un encabezado: el nivel lo pone el anfitrión (§23.4).

**Movimiento** (amplía §29): una sola pieza, el dato que vuelve a caber, con `--g-duration-slow` y `--g-ease-out` y keyframes `g-summary-enter…` (§29.4: reacción única a un suceso medido, nunca al montar). **No usa `--g-ease-spring` ni `--g-ease-bounce`** (§29.1: no es un uso nuevo). Con movimiento reducido, nada entra (§29.3).

**No son tokens:**

- **Literales de unidad** (amplían la lista de §7, DECISIONS.md #187): **`7ch`** y **`4ch`** (suelo del título en `row` y en `inline`: lo mínimo que se conserva antes de que ceda el identificador) y **`1lh`** (alto de una línea de la corriente y de su centinela). Siguen al texto, no al tema; el CLI no los valida.
- **Constante de coreografía** (amplía §29.6): **`--g-space-1 × 3`**, desplazamiento de entrada de un dato, reflejado en RTL.
- **Constante de diseño:** el mínimo de columna de la rejilla de pares de `stack` (`space × 28` en el prototipo; lo fija coco y lo anota en su `estilo.md`); y las proporciones propias del CSS que coco anota allí (relleno del icono `lado / 5`, relleno de «+N» `space × 1,5`, filete `space × 1` más corto por extremo, anchos de las formas de carga 60 / 85 / 70 %, `--g-space-1 / 2` del subrayado).
- **Variable en línea y atributos** (amplían §29.5): `--_lines` (líneas de datos de `row`), `data-clipped`, `data-terse`, `data-tight` y `data-enter` (estados **medidos** por el `.vue`, escritos fuera del render), más las clases `is-anchor`, `is-bare`, `is-diff` e `is-same`.
- Los 240px, 360px y 520px de las medidas de kiwi son **anchos de prueba**, no umbrales: la ficha no tiene ninguno.

Pendiente de integrar cuando el archivo no tenga otra sesión abierta: una fila de `GSummary` en §23.1, la constante en la tabla de §29.6 y los literales en el párrafo de §7 (hoy quedan registrados solo aquí).

## 35. Campo de archivos (`GFileField`; sin tokens nuevos)

**`GFileField` no añade tokens** (`design/contracts/file-field.md`, DECISIONS.md #376; §17.6: ningún existente se queda corto). La caja vacía usa los tokens y el alto de la caja de `GInput` del mismo `size` y `density` (piso 24px, 44px táctil, §7); compone `GSummary` (§34), `GProgress`, `GBtn` y `GIcon`, que usan los suyos. Lo propio: ficha sobre `--g-color-surface-sunken` con `--g-radius-xs`; **la ficha que sube** se llena con `--g-color-accent-soft` y su avance se lee por un **frente de `--g-color-on-accent-soft`** (≥ 4,51:1 contra el relleno en los once temas; `--g-color-accent` no llega a 3:1 en claro, #379; WCAG 1.4.11); filo de la subida terminada `--g-color-success-text`; ficha en error `--g-color-danger-soft` / `--g-color-on-danger-soft`; aviso de no añadidos `--g-color-warning-soft` / `--g-color-on-warning-soft`; texto de «Adjuntar» `--g-color-accent-text` (en la variante `soft`, sobre `surface-sunken`, `--g-color-on-accent-soft`: 4,74:1 frente a 4,19:1); pista y estado `--g-color-text-muted`; **destino** de soltar con `--g-color-accent-soft` y borde y texto `--g-color-on-accent-soft` (admite), `--g-color-accent` / `--g-color-on-accent` (encima), `--g-color-border-control` (no admite, discontinuo; `border-strong` es translúcido, ≈ 1,5:1) y `--g-radius-md`; roles `body-sm` y `caption` y el peso `action` (§23).

**Movimiento** (amplía §29): la ficha aterriza con `--g-duration-press` + `--g-ease-out` desde la escala `0.86` (§29.6) y keyframes `g-file-field-land…`; los destinos despiertan con un fundido (`--g-duration-press`, `--g-ease-out`; dormir, `--g-duration-fast`); el relleno avanza con la transición de `GProgress`; la sacudida al enviar es `g-reject-file-field…` (§29.4). **Sin usos nuevos de `--g-ease-spring` ni de `--g-ease-bounce`** (§29.1: el aterrizaje es una entrada). Con movimiento reducido, nada se escala ni se desplaza (§29.3).

**No son tokens:** el alto mínimo de la ficha `max(24px, --_h − space × 2, space × 6)` (`min-block-size`; el último término es el alto de sus botones `xs`; con un archivo, en `xs`, `sm` y `compact` la caja queda más alta que `GInput`, permitido por «Disposición»; auditoría de coco, hallazgo 6), el sobresaliente del destino (`space × 1` por lado, acotado en línea por `column-gap × 0.375`: con `space × 2` dos vecinos se solapaban en `compact`, #379) y la base de ancho de una ficha (`space × 52`), constantes de diseño derivadas de `space` que fija coco en su `estilo.md`; el porcentaje de un `color-mix` del destino, si coco lo usa (constante anotada y contraste medido en claro, oscuro y un tema distinto); **`--g-form-min: 62`** que declara el CSS en una `GFormRow` (propiedad de entrada de §21; medido por coco: 245 px = `space × 61,3`); `concurrency` (prop) y el coalescido del progreso a un cuadro (JS). **Datos del `.vue` al CSS** (amplían §29.5): `data-state` y `data-stored` en cada ficha, `is-landing` (retirada en `animationend`/`animationcancel` de `g-file-field-land…`, también la variante `-fade` con reduced motion), y en la raíz `is-ready`, `is-awake`, `is-awake-ok`, `is-awake-no`, `is-over`, `is-full`, `has-files`, `is-multiple`.

## 36. Tooltip (`GTooltip`; sin tokens nuevos)

**`GTooltip` no añade tokens** (`design/contracts/tooltip.md`, DECISIONS.md #393; §17.6: ningún existente se queda corto). **Superficie inversa** como la isla de estado (§31, #325): etiqueta y pestaña con `--g-color-text` de fondo y `--g-color-surface` de texto (nombre, detalle y borde `currentColor` del `<kbd>`); se invierte sola en el oscuro (§15). Etiqueta `--g-radius-md`, esquinas de la pestaña `--g-radius-sm`, `<kbd>` `--g-radius-xs`; `--g-shadow-2`; borde transparente de `--g-border-width` (aparece en `forced-colors`); `--g-font-ui`; nombre y detalle `body-sm` (`--g-text-body-sm-{size|line|weight|tracking}`; el nombre con `--g-text-action-weight`), atajo `caption` (`--g-text-caption-{size|line|weight|tracking}`; §23; #394 completa la lista: `weight` y `tracking` ya existían y el CSS los lee); `--g-space-1` para relleno, separación, pestaña, ancho máximo (`min(× 70, visor − × 4)`) y margen al visor (`× 2`).

**Movimiento** (amplía §29): aparecer y cerrar con fundido `--g-duration-fast`; **viaje** entre controles de un grupo y **segunda etapa** (`grid-template-rows`) con `--g-duration-press` + **`--g-ease-out`**. **No es un uso de `--g-ease-spring`** (§29.1; decisión del usuario del 2026-10-06: viaje sobrio). Con movimiento reducido, el viaje salta y la segunda etapa aparece sin crecer (§29.3). Transiciones, sin keyframes.

**No son tokens:** las constantes de tiempo del motor (§29.6); el largo de la pestaña y el relleno de la etiqueta (constantes de diseño de coco desde `space`, en `design/lab/tooltip/estilo.md`; kiwi: pestaña `space × 1.5`); las variables en línea y atributos de §29.5 y §29.7.

## 37. Campo de hora (`GTimeField`; sin tokens nuevos)

**`GTimeField` no añade tokens** (`design/contracts/time-field.md`, DECISIONS.md #412; §17.6: ningún existente se queda corto). **Compone `GInput`** (#400), así que la caja, el prefijo/sufijo, el `output`, el pie, el mensaje, el solo lectura (§21), el foco e I1/I2 usan los tokens de `GInput`. Lo propio: la **lectura en palabras** en `--g-color-text-muted` (texto, ≥ 4.5:1; `--g-color-text-subtle` deshabilitado), a la separación de la caja (`space × 2` en `md`, la de cada tamaño en los demás); **a. m./p. m. y las dos lecturas** del alto de la caja (`--_h` de `GInput`; piso 24px y 44px con `pointer: coarse`, §7), de borde a borde, separador `--g-border-width` en `--g-color-border-control` (`--g-color-border-strong` deshabilitado), texto `--g-color-text-muted` en reposo y `--g-color-text` al pasar, fondo al pasar `--g-color-neutral-soft`, **pulsado** con el par `--g-color-accent-soft` / `--g-color-on-accent-soft` **y** `--g-text-action-weight` (un solo estilo para los dos pares; el estado no depende solo del color), esquinas del último botón `--g-radius-{rounded}`, anillo de seguridad interior con `--g-focus-width` y el color de foco del campo; color y fondo con `--g-duration-fast` + `--g-ease-standard`; tamaños de texto `--g-text-caption-size` … `--g-text-body-size` (los del texto escrito de cada `size`).

**Movimiento** (amplía §29): la palabra de la franja que **entra** cuando cambia con el foco en el campo, y las dos lecturas al aparecer, con `--g-duration-press` + `--g-ease-out` desde `--g-space-1 × 1` (§29.6) y keyframes `g-time-reading…` (§29.4: reacción única a un suceso, nunca al montar): **`g-time-reading-rise`** (opacidad y subida; el **texto** de la palabra y de las lecturas) y **`g-time-reading-fade`** (solo opacidad; el **par** de lecturas, que va de borde a borde y no puede desplazarse sin sacar su fondo y sus separadores de la caja), con los mismos tokens. **Sin usos nuevos de `--g-ease-spring` ni de `--g-ease-bounce`** (§29.1: es una entrada). Con movimiento reducido, el texto cambia en su sitio (§29.3).

**No son tokens:** el **mínimo intrínseco** que el campo publica a su `GFormRow` (px medidos por posiciones por el `.vue` con `setIntrinsicMin`, form.md §4, #271, #410), como el de `GNumberField` (§30) y medido por posiciones (12 h: `tail = gap + halvesW`, con las copias de a. m./p. m. al peso de pulsado; referencias `md`, `space` 4: 186px en 12 h `es-MX`, 66px en 24 h `es`); el `1px` del cursor y el `1ch` del espejo (§7, como P1 de `GNumberField`; en WebKit el hueco de 1px desplaza la hora 1px en algunos anchos, **límite compartido con `GNumberField`**, #313, pendiente de enmienda conjunta); `24px`/`44px` (§7). **Datos del `.vue` al CSS** (§29.5): `is-entering`, `data-compact`, `data-half`, y las clases `g-time-field--h12`, `has-choices`, `is-on`. **Reservado para C** (`mode="range"`, #413): la regla del día con el tramo en `--g-color-accent` (el del prototipo; coco mide 1.4.11 al construirlo: en claro `accent` puede no llegar a 3:1, #379) y su crecimiento con `--g-duration-press` + `--g-ease-out`; **para B** (`picker`, #414): el despliegue de los minutos con `--g-duration-slow` + `--g-ease-out`. Ninguno pide token nuevo.
