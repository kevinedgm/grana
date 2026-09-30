# Declaración de cumplimiento · Galería y configuración de widgets · r02

**Estado:** aprobada. Las decisiones de estructura y accesibilidad se derivan de estándares (WCAG 2.2 AA: 1.3.1, 1.4.1, 2.1.1, 2.4.3, 2.4.7, 2.5.8, 3.3.1, 3.3.3, 4.1.2, 4.1.3; patrones de diálogo modal y de pestañas de APG). El usuario decidió el alcance: hoja lateral, tarjeta con vista previa, búsqueda, categorías, tamaños y marca de añadidos, panel con pestañas cuyo contenido pone la aplicación, apertura por la acción «Configurar».
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises.
**Siguiente dueño:** lima → contratos de la galería y del panel (`design/contracts/widget-gallery.md`, `design/contracts/widget-config.md`) y la acción `configure` de `GWidget`.

Prototipo: `index.html` (sin dependencias): un panel de ejemplo con dos widgets, «Añadir widget» (galería) y el botón «Configurar» de cada widget (en Grana, la acción del menú). Verificado en Chromium con eventos reales de teclado y de ratón.

## Decisiones de estructura: galería

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | La galería es un **`<dialog>` modal** presentado como hoja lateral (borde final; en móvil, hoja inferior de 92% del alto); nombre por su título (`aria-labelledby`) y descripción; se cierra con Esc, con «Cerrar» y con la ✕; el foco **vuelve al botón «Añadir widget»** | Patrón de diálogo modal de APG; WCAG 2.4.3 |
| 2 | Al abrir, el foco va al **campo de búsqueda** (el primer control útil, no el botón de cerrar) | Acción más probable; WCAG 2.4.3 |
| 3 | **Búsqueda:** `<input type="search">` con etiqueta visible, filtra en vivo por título, descripción y categoría; `aria-controls` a la lista | WCAG 1.3.1, 3.3.2 |
| 4 | **Categorías:** grupo de botones de radio nativos (`fieldset` + leyenda oculta) con forma de píldora; la selección se marca con **relleno y una marca ✓** (no solo con color); «Todas» por defecto | WCAG 1.4.1, 4.1.2 |
| 5 | **Contador de resultados** en una región `role="status"` («6 widgets», «1 widget», «0 widgets») y **estado vacío** con mensaje visible | WCAG 4.1.3 |
| 6 | **Tarjeta:** `<article>` dentro de una lista con nombre; encabezado `h3` con el nombre del widget, categoría, descripción (`aria-describedby` del botón), **vista previa**, **selector de tamaño** y **botón Añadir** | WCAG 1.3.1, 4.1.2 |
| 7 | **La vista previa es decorativa:** un widget real (mismo aspecto) dentro de un contenedor `aria-hidden` e `inert`, sin foco ni lectura; el nombre y la descripción de la tarjeta dicen lo mismo en texto | WCAG 1.1.1, 4.1.2; evita duplicar la lectura y controles inactivos |
| 8 | **Tamaño inicial:** `<select>` nativo con etiqueta visible «Tamaño inicial» y los nombres de los tamaños permitidos por ese widget (Pequeño 1×1, Mediano 2×1, Grande 2×2) | WCAG 3.3.2 |
| 9 | **Añadir** se hace al **final del panel**, sin arrastrar; el foco **se queda en el botón** (se pueden añadir varios seguidos) y se **anuncia** «X añadido al final. Posición 3 de 3.» | WCAG 2.5.7, 4.1.3 |
| 10 | **Marca de añadidos:** la tarjeta lleva una etiqueta de **texto** («Ya añadido» o «En el panel: 2»). Un widget **único** ya añadido deja su botón en `aria-disabled="true"` con el texto «Añadido» (sigue enfocable) y, al pulsarlo, anuncia «X ya está en el panel»; uno **repetible** se puede añadir otra vez | WCAG 1.4.1; `aria-disabled` mantiene el foco y explica |
| 11 | La región de anuncios vive **dentro de la hoja**: fuera de un diálogo modal el resto de la página es inerte y un aviso allí puede no leerse | Hallazgo del prototipo (verificado que el anuncio salía fuera) |
| 12 | Objetivos: botones y controles de ≥ 36px (44px con `pointer: coarse`) | WCAG 2.5.8 |

## Decisiones de estructura: configuración

| # | Decisión | Fundamento |
| --- | --- | --- |
| 13 | El panel es un **`<dialog>` modal**, la misma hoja lateral, con título «Configurar <nombre del widget>»; el foco va a la **primera pestaña** y **vuelve al botón «Configurar»** del widget (incluso si la rejilla se volvió a pintar) | Patrón de diálogo modal; WCAG 2.4.3 |
| 14 | **Vista previa en vivo** arriba (widget real con los valores del borrador, `aria-hidden`), para **ver el efecto antes de aplicar** | Brief del usuario; WCAG 3.3.4 |
| 15 | **Pestañas Datos / Estilo / Ajustes** según el patrón de pestañas de APG: `tablist` con nombre, `tab` con `aria-selected` y `aria-controls`, `tabpanel` con `aria-labelledby` y `tabindex="0"`; **← →** mueven (cíclico), **Inicio/Fin**; solo la activa está en la secuencia de Tab; el contenido de cada pestaña lo pone la aplicación | APG tabs; WCAG 2.1.1 |
| 16 | **Campos nativos con etiqueta visible** (`select`, `input`, `checkbox role="switch"`), ayuda con `aria-describedby`; nada se aplica hasta pulsar **Aplicar** | WCAG 1.3.1, 3.3.2 |
| 17 | **Validación al aplicar:** si hay errores, **no se cierra**; un **resumen** (`role="alert"`, `tabindex="-1"`) recibe el foco y lista cada error como **enlace** que cambia a la pestaña y enfoca el campo; cada campo con error lleva `aria-invalid`, **texto de error con el símbolo ▲** y borde doble (no solo color); cada pestaña con errores muestra su **cantidad en texto** («1 error»); al corregir, el resumen se actualiza | WCAG 3.3.1, 3.3.3, 1.4.1; los errores no quedan ocultos en una pestaña inactiva |
| 18 | **Cancelar, ✕ y Esc** piden confirmar **solo si hay cambios**: el pie cambia a «¿Descartar los cambios? · Seguir editando · Descartar» (el foco va a «Seguir editando»); sin cambios, cierra directo. **Sin un diálogo dentro de otro** | WCAG 3.3.4; evita diálogos anidados |
| 19 | **Restablecer** devuelve el borrador a los valores con que se abrió el panel (no a los de fábrica) | Previsible y reversible |
| 20 | **Aplicar** valida, cierra, actualiza el widget y anuncia «X configurado.» en la región de estado de la página | WCAG 4.1.3 |
| 21 | El panel **no conoce las opciones**: la carcasa (título, vista previa, pestañas, pie, validación, confirmación) es de Grana; los **campos de cada pestaña** son de la aplicación | Decisión del usuario |
| 22 | El **cambio de densidad, estilo del badge y subtítulo** del prototipo son **ejemplos** de Estilo; los campos reales son cosa de cada widget | Límite del alcance |

## Hallazgos para lima (contratos)

| # | Hallazgo | Prioridad | Propuesta |
| --- | --- | --- | --- |
| 1 | Nombres y alcance | Alta | **Dos componentes:** `GWidgetGallery` (galería) y `GWidgetConfig` (carcasa del panel de configuración), más la acción `configure` en `GWidget` (ya prevista en el contrato: #13) |
| 2 | La **hoja lateral** | Alta | La galería y el panel comparten la hoja. Decidir si se añade a `GDialog` una colocación lateral (p. ej. `placement="end"`, con la hoja inferior en móvil, como ya hace `mobile="sheet"`) o si cada componente la trae. Lo coherente: **reutilizar `GDialog`** |
| 3 | API de `GWidgetGallery` | Alta | `items` `[{ id, title, category, description, sizes, unique? }]`, `added` (conteo por `id`), slot `preview` con `{ item, size }` (la aplicación pinta un widget con datos simulados), `modelValue` (abierto), `labels`; evento `add` `{ id, size }`; el anuncio «añadido» lo hace el componente (o se delega a `GWidgetGrid`: decidir) |
| 4 | API de `GWidgetConfig` | Alta | `modelValue` (abierto), `title`, `tabs` `[{ id, label }]`, `errors` `[{ tab, field, message }]`, `dirty`; slots `tab-<id>` y `preview`; eventos `apply`, `cancel`, `reset`; `labels` |
| 5 | Validación | Alta | La **validación la hace la aplicación** (conoce sus campos); la carcasa pinta el resumen, marca las pestañas con errores y enfoca el primero. Decidir si `errors` incluye un `id` de campo para el enlace |
| 6 | Vista previa | Media | En ambos, **slot** (la aplicación pinta el widget con sus datos), `aria-hidden` e `inert` puestos por el componente |
| 7 | Anuncios | Media | Textos por `labels` con marcadores (`{title}`, `{position}`, `{count}`, `{results}`), sin valores por defecto |
| 8 | Dónde se anuncia | Media | La región de anuncios va **dentro** de la hoja mientras está abierta |
| 9 | Posición de «añadir» | Baja | Al final del panel; arrastrar desde la galería a una posición queda fuera |
| 10 | Tokens | Baja | Probablemente ninguno nuevo: ancho de la hoja (`--g-space-1 × 110`, 440px) puede salir de `space` como el drawer de `GSidebar` |
