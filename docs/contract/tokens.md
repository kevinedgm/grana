# Contrato de tokens · v0.1

**Dueño:** lima. Cualquier token nuevo se agrega aquí antes de que un componente lo use.

## 1. Entradas del usuario

Todas opcionales. Lo que no se define conserva el valor por defecto de Grana.

| Clave | Tipo | Ejemplo | Controla |
| --- | --- | --- | --- |
| `brand` | color hex | `"#F5B940"` | Acción principal |
| `accent` | color hex | `"#5B3FE0"` | Foco, enlaces, selección, estados activos. Sin valor: se deriva de `brand` (su `text`) |
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
--g-duration-{fast|press|spin}
--g-ease-{standard|out}
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
| `--g-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Curva de los cambios de estado |
| `--g-ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Curva de entradas y respuesta al pulsar |
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

**Excepción documentada (DECISIONS.md #34):** las consultas de contenedor no admiten `var()`, así que el **umbral de ancho** con que un componente cambia de disposición (hoy solo `GInput` con el slot `action`, ~300px) se escribe como constante literal en el CSS del componente. Es una constante de diseño, no un valor de tema: el CLI no la valida ni el usuario la sobrescribe. Cada uso nuevo se anota aquí antes de escribirlo. `GDialog` agrega consultas de medios sobre el visor (§11).

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

Lenguaje reutilizable de **superficies anidadas**: una carcasa (`shell`) que contiene una segunda superficie interior (`inset`) a una separación pequeña (`gap`), con radio concéntrico (`radius-inset` = `radius` − `gap`). Lo usa `GDialog`; drawers, paneles, tarjetas y popovers lo reutilizarán. Reglas: bordes de `--g-border-width` con `--g-color-border`, sombras solo de `--g-shadow-*`, sin desenfoque de fondo y sin más de dos niveles de superficie por defecto. Nota: `--g-surface-radius-inset` se resuelve en `:root`; si alguien cambia `--g-surface-radius` solo dentro de una sección, el radio de la inset no lo sigue (§10). *(Agregado con el contrato de `GDialog`.)*

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
| `border-control` | ≥ 3:1 sobre `surface` y `surface-sunken` |
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

`brand` = identidad. `primary` = acción o jerarquía interactiva principal. En v0.x comparten valor: `primary` es alias de `brand` (y `primary-strong`, `-soft`, `-text`, `on-primary`, `on-primary-soft`, de sus equivalentes). Con solo `{ "brand": … }` se resuelve `primary = derived(brand)`. **Extensión futura:** una clave `primary` propia sin cambiar el contrato de ningún componente (porque ya leen `primary`).

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
| §17.2: **componentes de `--g-color-brand*` / `--g-color-on-brand*` a `primary*`** (16 hojas de estilo, verificado: 0 diferencias en 3290 elementos, claro y oscuro) y el ítem activo de `GSidebar` a `active`; una prueba impide volver a leer `brand` | Hecho |
| §17.2: variantes `color="accent"` y la barra de carga de `GDialog` | Se quedan en `accent`: la prop `color` elige la **familia** (`brand`, `accent`, `success`…), y `accent` es también un rol semántico (§17.1). `link` y `selection` aún no tienen consumidores en los componentes |
| §17.4 clave de configuración `primary` propia | Pendiente (futuro) |
| Regla «sin saltar niveles» y «sin tokens de componente que solo renombran» como comprobación automática | Pendiente (hoy es norma de revisión) |
| `--g-data-*` para gráficas | Fuera de alcance |
