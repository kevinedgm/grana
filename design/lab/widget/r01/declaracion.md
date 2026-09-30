# Declaración de cumplimiento · Sistema de widgets (GWidget, primitivas y GWidgetGrid) · r01

**Estado:** aprobada. Las decisiones de estructura y accesibilidad se derivan de estándares (WCAG 2.2 AA: 1.3.1, 1.3.2, 1.4.1, 1.4.10, 2.1.1, 2.4.3, 2.5.7, 2.5.8, 4.1.2, 4.1.3; patrones *menu button* y *dragging* de APG). El usuario decidió el alcance: **`GWidget` (carcasa con estados), primitivas de contenido y `GWidgetGrid`**; la **galería y el panel de configuración quedan para una segunda entrega**; el widget **mide su propio tamaño** y elige un nivel de detalle; la rejilla se **reordena y redimensiona con puntero y teclado, con anuncios**.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises (el significado se lee por forma y texto, no por color).
**Siguiente dueño:** lima → `design/contracts/widget.md` (carcasa y primitivas) y `design/contracts/widget-grid.md` (rejilla).

Prototipo: `index.html` (sin dependencias). Contiene: un widget en un marco redimensionable (niveles en vivo), los cinco widgets de muestra en los tres niveles, los seis estados, y una rejilla con modo de edición, menú de acciones, anuncios y el layout como dato.

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | El widget es un `<article>` con nombre por su título (`aria-labelledby`); el título es un encabezado (`<h3>` en el prototipo) cuyo **nivel configura la aplicación**; la carcasa **no interpreta su contenido** | WCAG 1.3.1, 4.1.2 |
| 2 | **El widget mide su propio ancho y alto**, no la ventana: nivel `s` < ~240px, `m` ~240 a 439px, `l` ≥ ~440px (constantes del prototipo; el contrato las derivará de `space`); **forma** `wide` (ancho ≥ 1.9 × alto), `tall` (alto ≥ 1.3 × ancho y ≥ 320px) o `square`. Verificado con un marco redimensionable: 200×200 → `s`; 340×260 → `m`; 560×300 → `l · wide`; 300×460 → `m · tall`; 700×200 → `l · wide` | Petición del usuario: menos espacio = menos detalle; funciona igual en una rejilla, un panel o un diálogo |
| 3 | El contenido se entrega **por nivel**: slots `compact` (s), `default` (m) y `detail` (l), con cadena de respaldo (`detail` → `default`, `compact` → `default`); o un solo `default` que recibe `{ level, shape, state }`. El widget **oculta zonas de la carcasa** según el nivel: en `s`, sin categoría, subtítulo, badge ni pie | Divulgación progresiva (petición del usuario) |
| 4 | **Estados sin saltos:** *cargando* conserva la estructura con un **esqueleto por nivel** (misma altura y ancho que con datos: 283×192 en los seis estados) y marca `aria-busy` más un aviso oculto `role="status"`; *vacío* (mensaje y acción) y *error* (`role="alert"`, mensaje y «Reintentar») ocupan el área del contenido; *desactualizado* añade una marca (`◔` y «Desactualizado» en el badge) y una línea con la hora **sin ocultar los datos**; *deshabilitado* atenúa (`aria-disabled="true"`) y vuelve inerte el cuerpo | WCAG 1.4.1, 4.1.3; petición del usuario |
| 5 | **Menú de acciones** = *menu button* de APG: botón `aria-haspopup="menu"` con `aria-expanded` y nombre «Acciones de <título>»; `role="menu"` con `menuitem`; Enter, Espacio y ↓ abren con foco en el primero, ↑ en el último; ↑ ↓ Inicio Fin y escritura rápida se mueven; **Esc** cierra y devuelve el foco (y no llega a un ancestro); Tab cierra; los elementos deshabilitados son `aria-disabled` y siguen enfocables. Verificado | APG; WCAG 2.1.1 |
| 6 | **Interacción limitada:** acciones simples (botón, enlace); el detalle se pide fuera con un enlace de *drill-down* en el pie (`drilldown`: la aplicación abre página, diálogo o panel); el widget no contiene aplicaciones completas | Petición del usuario |
| 7 | **Primitivas:** *métrica* (etiqueta, valor con unidad y tendencia con **símbolo ▲ ▼ ■ y texto**: no depende del color), *progreso* (`role="progressbar"` con `aria-valuenow`/`min`/`max` y nombre), *lista de datos* (filas etiqueta–valor con muestra) que sirve también de **leyenda**, y el *estado* es una insignia (`GBadge`). **Sin gráficos propios**: el gráfico va en un slot y **debe llevar `role="img"` con nombre** | WCAG 1.1.1, 1.4.1 |
| 8 | **La rejilla** es una lista (`<ul role="list">` con nombre) de widgets; su **layout es un dato**: arreglo ordenado de `{ id, w, h }` (columnas y filas ocupadas, 1 a 4) que la aplicación guarda y restaura | Petición del usuario (persistencia) |
| 9 | **Columnas por el ancho del contenedor:** 4 con ≥ ~960px, 2 con ≥ ~560px y 1 por debajo (constantes del prototipo; se derivarán de `space`); los widgets **conservan su orden** y las columnas ocupadas se **recortan** al máximo disponible (`span min(w, columnas)`). Verificado: 1000px → 4; 698px → 2 (spans 2,1,2,2,2); 418px → 1; sin desborde horizontal | Petición del usuario: tableta y móvil sin widgets distintos |
| 10 | **Reordenar con teclado (patrón de arrastre de APG):** el **asa de mover** (`aria-roledescription="elemento reordenable"`, `aria-pressed`, nombre con la posición «Mover Ingresos. Posición 1 de 5») se recoge con Espacio o Enter; ← ↑ mueven antes, → ↓ después (sin recoger, las flechas no hacen nada); Espacio o Enter suelta; **Esc cancela y devuelve** a su lugar. Cada paso se **anuncia** (`role="status"`): «recogido. Posición 1 de 5…», «Posición 2 de 5», «soltado en la posición 3 de 5», «Movimiento cancelado…». Verificado; el foco no se pierde al reordenar | WCAG 2.1.1, 4.1.3; APG |
| 11 | **Reordenar con puntero:** arrastrar el asa reordena **en vivo** sobre el widget bajo el puntero y anuncia el resultado al soltar. Verificado (Ingresos pasó de la posición 1 a la 4) | Petición del usuario |
| 12 | **Orden visual y orden del DOM:** durante un movimiento la posición visual cambia con `order` de CSS (el foco no se pierde) y **al soltar, cancelar o terminar el arrastre el DOM se reordena para coincidir** (el foco se restaura). Verificado: tras soltar, el DOM y el layout coinciden | WCAG 1.3.2, 2.4.3 |
| 13 | **Redimensionar:** el **asa de la esquina** (botón con nombre «Cambiar el tamaño de X: 2 columnas por 1 fila», que se actualiza) responde a ← → (columnas) y ↑ ↓ (filas) con anuncio del tamaño nuevo, y a arrastrar la esquina (celda a celda, espejado en RTL). Verificado: 1×1 → 2×1 por teclado; 1×1 → 2×2 por puntero, y el nivel pasó a `l · wide` | Petición del usuario; WCAG 2.1.1 |
| 14 | **Alternativa sin arrastre (WCAG 2.5.7):** el menú del widget incluye «Mover antes», «Mover después» (deshabilitados en los extremos), tamaños predefinidos (Pequeño 1×1, Mediano 2×1, Grande 2×2, Ancho 4×1, Alto 1×2) y «Quitar». Verificado: mover después, «Ancho» (4 × 1, nivel `l/wide`) y quitar (el foco pasa al menú del siguiente widget) con su anuncio | WCAG 2.5.7 |
| 15 | **Quitar** es una petición: el widget lo pide desde el menú (nunca desde un asa) y la aplicación decide si confirma | Riesgo de la acción |
| 16 | El cuerpo del widget **recorta** lo que no cabe (`overflow: hidden`): el contenido debe adaptarse a su nivel; el prototipo ocultó, en modo de edición, el badge y el enlace de detalle para que no choquen con las asas | Contenido predecible; a resolver con coco |
| 17 | **Actualizar** desde el menú pone el widget en *cargando* sin cambiar su tamaño (verificado: mismo ancho y alto), y al terminar se anuncia «Servicios actualizado» | WCAG 4.1.3 |
| 18 | **Objetivos:** menú de 32px y asas de 28px (44px con `pointer: coarse`); anillo de foco de 3px | WCAG 2.5.8 |
| 19 | **Movimiento:** el reordenamiento se anima con una transición corta de posición (no del contenido); con `prefers-reduced-motion` se quita; el esqueleto pulsa solo con `no-preference` | WCAG 2.3.3 |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.3.1 / 4.1.2 | Cumple por diseño, sin confirmar con lector real | `article` con nombre, encabezado, `role="menu"`, `progressbar` con valores, `aria-pressed`/`aria-roledescription` |
| WCAG 1.3.2 / 2.4.3 Orden | Cumple | El DOM se reordena para coincidir con el visual al confirmar; el foco se conserva |
| WCAG 1.4.1 Uso del color | Cumple por diseño | Tendencias con símbolo y texto; estados con texto y marca; el prototipo es en grises |
| WCAG 2.1.1 / 2.5.7 Teclado y arrastre | Cumple | Recoger, mover, soltar, cancelar y redimensionar con teclado; el menú ofrece las mismas acciones sin arrastrar |
| WCAG 4.1.3 Mensajes de estado | Cumple por diseño, sin confirmar con lector real | Región `status` para cada paso; `role="alert"` en el error; aviso de carga |
| WCAG 1.4.10 Reajuste | Cumple | Una columna a 418px, sin desborde horizontal de la rejilla |
| WCAG 2.5.8 Tamaño del objetivo | Cumple | Asas y menú de 28 a 32px (44px táctil) |
| WCAG 1.4.3 / 1.4.11 Contraste | Sin verificar con tema real | Grises del kit (texto atenuado #757575, 4.6:1); lo audita coco |

## Comprobaciones ejecutadas

- Chromium, `localhost:4174`, ventana de 1240px. Sin errores en consola.
- **Niveles:** 15 widgets de muestra en tres tamaños (`s`, `m`, `l`) y el marco redimensionable (cinco combinaciones de ancho y alto con su nivel y su forma).
- **Estados:** los seis estados ocupan **283×192px** cada uno; el esqueleto tiene la estructura del nivel; `aria-busy` y `aria-disabled` puestos.
- **Teclado en la rejilla:** recoger con Espacio (`aria-pressed`, anuncio con la posición), mover con → (foco en el asa), cancelar con Esc (vuelve, anuncio), soltar con Enter (nueva posición, DOM reordenado), flechas sin recoger (no hacen nada); redimensionar con ← → ↑ ↓ con anuncio y etiqueta actualizada.
- **Puntero:** arrastre del asa (reorden en vivo y anuncio) y de la esquina (2×2, nivel `l · wide`).
- **Menú:** abre con ↓ (foco en «Actualizar»), ↑ ↓ se mueven, Esc cierra y devuelve el foco; «Mover después», tamaño «Ancho», «Actualizar» (esqueleto del mismo tamaño y vuelta) y «Quitar» (foco al siguiente widget) con sus anuncios.
- **Responsive:** 1000px → 4 columnas; 698px → 2 (spans recortados); 418px → 1; sin desborde.

## Comprobaciones NO ejecutadas

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): anuncios de recoger, mover y redimensionar; el menú; el aviso de carga.
- **Contraste**, `forced-colors` y `prefers-reduced-motion` reales con el tema real: lo audita coco.
- **Táctil real** (el arrastre y el redimensionado con dedo; `touch-action`) y el teclado virtual.
- **RTL** con un idioma RTL real (el redimensionado espeja el eje; solo se escribió).
- **Firefox y Safari** (`popover`, `ResizeObserver`, `order` de CSS Grid).
- **Muchos widgets** (decenas) y el rendimiento de las mediciones; la **persistencia** real (la hace la aplicación).
- **Colisión visual** entre asas, badge y enlaces de detalle sin ocultarlos: se resolvió ocultándolos en edición; falta una decisión de composición.

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | Nombres y alcance | Alta | Tres contratos: `GWidget` (carcasa), primitivas (`GMetric`, `GProgress`, `GDataList`; el estado es `GBadge`) y `GWidgetGrid`; la galería y la configuración quedan fuera (segunda entrega) |
| 2 | `GWidget`: props | Alta | `title`, `eyebrow`, `description` (subtítulo), `headingLevel` (2 a 6), `state` (`populated` `loading` `empty` `error` `stale` `disabled`), `badge` (texto; la aplicación puede pasar el slot), `actions` (`[{ id, label, disabled? }]`, sin valor por defecto), `labels` (textos requeridos: `actions`, `retry`, `loading`, `stale`, `disabled`…), `updatedText` (pie), `drilldownLabel`; `size` **no existe** (mide su propio tamaño) |
| 3 | `GWidget`: niveles | Alta | Umbrales derivados de `--g-space-1` (≈ `space × 60` y `space × 110`), medidos sobre el propio elemento con un observador de tamaño; forma por proporción; expuestos como `data-level`/`data-shape` y en el alcance de los slots |
| 4 | `GWidget`: slots | Alta | `icon`, `eyebrow`, `title`, `badge`, `actions` (sustituye al menú), `compact`, `default`, `detail`, `empty`, `error`, `footer`; alcance `{ level, shape, state }` |
| 5 | `GWidget`: eventos | Alta | `action` (`{ id }` del menú), `retry` y `drilldown` (el estado es un prop, no un evento) |
| 6 | Primitivas | Media | `GMetric` (`label`, `value`, `unit`, `trend` con `direction` `up` `down` `flat` y texto obligatorio, `context`), `GProgress` (`value`, `max`, `label` obligatorio), `GDataList` (`rows` con `swatch` opcional; con `swatch`, además del color, un patrón o forma para no depender del color) |
| 7 | `GWidgetGrid`: props | Alta | `modelValue` (`[{ id, w, h }]`), `editable`, `columns` (opcional; por defecto por ancho), `min`/`max` (columnas y filas: 1 a 4), `rowHeight` (token), `presets` (tamaños predefinidos con nombre), `labels`, `label` (nombre de la lista) |
| 8 | `GWidgetGrid`: slots y eventos | Alta | Slot por widget (`item`, con `{ id, editing }`) y `controls`; eventos `update:modelValue` (con el motivo: `move` `resize` `remove`), `remove-request` (la aplicación confirma) y `announce` (o región propia); la rejilla **no** crea widgets: la aplicación pone un `GWidget` por celda |
| 9 | Orden visual y DOM | Alta | Documentar el patrón del prototipo: `order` mientras dura el movimiento y reordenar el DOM al confirmar |
| 10 | Tokens | Media | Alto de fila y separación de la rejilla derivados de `space` (`--g-widget-row`? a decidir); superficie del widget con los tokens de superficie (`--g-surface-*`) y sin sombras fuertes |
| 11 | Persistencia | Baja | Solo el dato; la aplicación guarda; sin `localStorage` |
| 12 | Modo de edición | Media | Qué se oculta o se reubica para que las asas no choquen con el badge y el pie (decisión de composición con coco) |
| 13 | Galería y configuración | Media | **Segunda entrega**: galería (búsqueda, categorías, vista previa con datos simulados) y panel Datos/Estilo/Ajustes; el contrato de `GWidget` debe dejar `configurable` y un evento `configure` para no romperse después |
