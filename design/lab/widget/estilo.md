# Entrega de coco · sistema de widgets (GWidget, GMetric, GProgress, GDataList, GWidgetGrid)

**Archivos:** `packages/vue/src/components/GWidget/GWidget.css`, `GMetric/GMetric.css`, `GProgress/GProgress.css`, `GDataList/GDataList.css` y `GWidgetGrid/GWidgetGrid.css` · **Defaults:** `packages/vue/src/styles/defaults.css` (`--g-widget-row` y `--g-widget-gap`) y `packages/cli/src/defaults.js` (sincronizado; las 51 pruebas del CLI pasan).
**Contratos:** `design/contracts/widget.md` y `design/contracts/widget-grid.md` (DECISIONS.md #72 a #75) y `docs/contract/tokens.md` §14.
**Estado:** listo para bruno (registro pendiente en `components.css`, que es de bruno; los `.vue` aún no existen).
**Banco de pruebas:** `design/lab/widget/estilo-banco.html`: marcado exacto de los contratos con el CSS real y el tema por defecto (desde la raíz del repo: `/design/lab/widget/estilo-banco.html`). Trae un botón «Tema de prueba» y un **motor mínimo** (niveles por tamaño propio, estados, menú, rejilla con puntero y teclado) que imita lo que hará bruno. Los gráficos y el diseño interno de cada widget de muestra son de la «aplicación» y se estilizan con clases `bk-*`.

## Decisiones estéticas

| Detalle | Cómo |
| --- | --- |
| **Superficie suave, sin sombras** | El widget es `--g-color-surface` con un borde fino (`--g-color-border`) y `--g-radius-lg`; **sin sombra**. La jerarquía sale del espaciado (`space × 4`, `× 3` en el nivel `s`), la tipografía y el contraste, no de capas |
| **Encabezado compacto** | Icono de `space × 7` sobre `surface-sunken`; categoría en `caption` y `text-subtle`; título en `body-sm` con peso de título pequeño (una línea con elipsis); subtítulo en `caption`; badge en píldora con el tono suave del color (`badgeColor`); menú de `space × 8` (44px táctil) con **tres puntos dibujados con CSS** (un punto y dos sombras: Grana no trae iconos) |
| **Pie discreto** | `caption` en `text-subtle`; el enlace de detalle es texto subrayado, no un botón |
| **Estados que no mueven nada** | Cargando: **esqueleto** de barras y un bloque en `surface-sunken` con la estructura del nivel y un pulso de 1.4s (solo con `no-preference`); vacío y error: contenido centrado; desactualizado: línea discontinua con el texto, **datos intactos**; deshabilitado: borde **punteado** y cuerpo atenuado |
| **Métrica** | Valor con la escala de título (`title-sm`, `title`, `title-lg` según `size`), peso de título, cifras tabulares; **tendencia con un símbolo recortado con `clip-path`** (triángulo hacia arriba, hacia abajo o barra) y texto: nunca solo color |
| **Progreso** | Barra de `space × 2` con un contorno interior (`--g-color-border`) y relleno del color (`--g-color-{color}`); el avance entra con una transición corta |
| **Lista y leyenda** | Filas etiqueta–valor con elipsis; muestras de **tono y forma** (círculo, cuadrado, rombo, triángulo), cuatro a la vez, para no depender del color |
| **Rejilla** | `display: grid` con `--_cols` columnas iguales, filas de `--g-widget-row` (112px), separación `--g-widget-gap` (16px), flujo denso; la celda llena su espacio |
| **Modo de edición** | El widget pasa a **borde discontinuo** en `--g-color-border-control`; el badge y el enlace de detalle se ocultan; las **asas** (28px, 44px táctil) van en la esquina superior junto al menú (mover: tres barras dibujadas) y en la inferior (redimensionar: una esquina dibujada, espejada en RTL) |
| **Recogido / arrastrado** | Recogido con el teclado: contorno de `--g-focus-width` en el color de foco alrededor del widget y el asa se invierte (`--g-color-text` sobre `--g-color-surface`); arrastrado con el puntero: opacidad 0.55 |
| **Menú** | Superficie con borde `--g-color-border-control` (3:1), `--g-radius-lg` y `--g-shadow-2`; nace de la esquina de su botón con un fundido y una escala de 0.96; entradas de 36px (44px táctil) |

## Sin literales de tema

Colores, radios, tipografía y medidas solo de tokens y de `space`. Únicos literales de medida: `24px` (piso del menú y de las asas), `44px` (área táctil) y el `1px` del texto oculto. **Sin consultas de medios de ancho**: el nivel del widget y las columnas de la rejilla los decide bruno (por el tamaño propio y por el ancho de la rejilla) y llegan como clases y como la variable `--_cols`; solo `pointer: coarse`, `hover`, `prefers-reduced-motion` y `forced-colors`.

## Verificación en Chromium (banco de pruebas)

| Prueba | Resultado |
| --- | --- |
| Literales | Sin colores; medidas solo `24px`, `44px`, `0px` en `max()` y `1px` del texto oculto; ningún `var()` con respaldo; sin `@layer` ni `<style>` |
| Medidas por defecto | Relleno 16px, radio 8px, icono 28px, menú 32px, borde de 1px, **sin sombra** |
| Los seis estados | Todos **286×196px** (mismo espacio con esqueleto, datos, vacío, error, desactualizado y deshabilitado); el esqueleto tiene 3 barras y un bloque con el pulso activo; el deshabilitado, `inert` y opacidad 0.55, con borde punteado |
| Contraste (tema por defecto) | Título 17.4:1 · categoría y pie 5.10 · subtítulo y etiqueta de métrica 7.46 · tendencia 5.33 · badge 6.54 · relleno del progreso frente al carril **15.25:1** |
| Contraste (tema de prueba) | Título 13.48 · categoría 6.18 · subtítulo 8.2 · tendencia 5.24 · badge 6.54 |
| Nivel `s` | El banco oculta categoría, subtítulo, badge y pie (el componente **no los renderizará**); relleno 15px con `space` 5 |
| Métrica | Valor de 25px (`title`), peso 600; el símbolo de la tendencia es un triángulo de 10px recortado (`polygon`) |
| Lista y leyenda | Círculo, cuadrado (radio xs), rombo (`clip-path`) y triángulo, con cuatro tonos |
| Rejilla | 1000px → 4 columnas; 700px → 2; 420px → 1; sin desborde horizontal; con `space` 5 la fila mide 140px y la separación 20px |
| Asas en edición | 28×28px, sin solaparse con el menú (a su izquierda; en RTL, a su derecha); la de redimensionar queda dentro del widget; el cursor `nwse-resize` (y `nesw-resize` en RTL); los glifos se dibujan con CSS |
| Recogido con el teclado | El `<li>` lleva `is-grabbed` con contorno de 2px; el asa se invierte (fondo `#1A1A1A`, texto blanco) |
| Menú | A 4px del botón, alineado a su borde final, 200px, radio 8px, borde 3.45:1, entradas de 36px, deshabilitadas y encabezado a 5.10:1; el estilo del foco se hereda del widget |
| Táctil (bloque aplicado sin condición) | Menú y asas de **44px** |
| Colores forzados (bloque aplicado sin condición, 12 reglas) | Borde del widget `CanvasText`; símbolo de la tendencia `CanvasText`; relleno del progreso `Highlight` |
| Movimiento reducido (bloque aplicado sin condición) | El menú pierde la escala y queda solo un fundido |
| RTL | Las asas pasan al lado contrario, el cursor de redimensionar cambia y el glifo se espeja |
| Tema de prueba (ámbar, marrón, espacio 5, radios y borde de 2px, Georgia) | Todo lo que depende del tema cambia; lo que no cambia es intencional (tamaños de fuente y los tonos neutros que la prueba no tematiza) |
| Consola | Sin errores del CSS |

## Observaciones (no bloquean; requieren atención de la auditoría)

- **El reordenamiento no se anima:** la posición cambia con `order` de CSS Grid, que no se puede animar con una transición. El contrato pedía una transición corta de posición; para animarla hace falta una técnica FLIP en JavaScript (bruno) o aceptar el cambio inmediato con el fundido del arrastrado. Lo dejo a decisión de bruno.
- **El esqueleto es muy suave frente a la superficie** (1.08:1 por defecto): es decorativo (no comunica un valor) y el estado lo da `aria-busy` y el aviso oculto; no exige 3:1.
- **El borde del widget** es translúcido y sutil (superficie suave): el widget no es un control, así que no exige 3:1; el modo de edición lo pasa a `border-control` discontinuo.
- **Las asas y el menú comparten la esquina superior:** con títulos largos, el título se recorta antes (elipsis); en el nivel `s` con 1×1 el título queda muy corto.

## Notas para bruno

- **El menú de acciones va dentro del widget** (dentro de `g-widget__head`), no en `body`, para heredar las variables. Variables dinámicas sobre `g-widget__actions`: `--_x`, `--_top`, `--_bottom`, `--_max`. Persistente: `showPopover()`/`hidePopover()`.
- **La rejilla:** `--_cols` sobre `g-widget-grid__list`; en cada `<li>` `grid-column: span N`, `grid-row: span M` y `order` (estilos dinámicos justificados). El widget dentro de la celda mide `block-size: 100%`.
- **El nivel `s` no renderiza** categoría, subtítulo, badge ni pie; `is-editing` solo lo pone la rejilla en el widget.
- **`--_value`** (porcentaje) sobre `g-progress__fill`; **`data-swatch`** en las muestras; **`data-direction`** en la tendencia; los modificadores `g-widget__badge--color-*`, `g-metric--trend-*`, `g-progress--color-*`.
- Las asas (`g-widget-grid__grab` y `__resize`) deben ir **vacías** (los glifos se dibujan con CSS); si llevan contenido propio, se dibuja encima.

## Sin verificar (lo audita el paso 5 o queda pendiente)

Lector de pantalla real; `forced-colors` y `prefers-reduced-motion` reales (bloques aplicados sin condición); RTL con datos en un idioma RTL real; Firefox y Safari; el arrastre y el redimensionado con un dedo (`touch-action`); muchos widgets; tema oscuro (no existe).

---

# Entrega de coco · galería y configuración de widgets (segunda entrega)

**Archivos:** `packages/vue/src/components/GWidgetGallery/GWidgetGallery.css`, `GWidgetConfig/GWidgetConfig.css` y la colocación `placement="end"` en `GDialog/GDialog.css` · **Sin tokens nuevos** (ni cambios en `defaults.css`).
**Contratos:** `design/contracts/widget-gallery.md`, `widget-config.md` y `dialog.md` (DECISIONS.md #76 a #78).
**Estado:** listo para bruno (registro en `components.css`; los `.vue` aún no existen; `GDialog.vue` necesita la prop `placement` y la clase `g-dialog--placement-*`).
**Banco de pruebas:** `design/lab/widget/estilo-banco-2.html` (desde la raíz: `/design/lab/widget/estilo-banco-2.html`): marcado exacto de los contratos con el CSS real; botones para abrir la galería, la configuración (normal, con errores y con la confirmación de descarte) y un `GDialog` centrado; «Tema de prueba».

## Decisiones estéticas

| Detalle | Cómo |
| --- | --- |
| **Hoja lateral** | `placement="end"`: pegada al borde final, **alto completo**, ancho de `size` (400px con `space` 4), sin borde ni esquinas del lado del borde; esquinas redondeadas solo del lado interior (espejadas en RTL: verificado). Entra deslizando desde el borde con `translate` (`--_dir` invierte el sentido en RTL con `:dir(rtl)`) y un fundido; sin `no-preference` no hay movimiento. Solo fuera del móvil: a ≤ 520px actúa `mobile` (hoja inferior) |
| **Categorías** | Píldoras con el radio nativo invisible encima (clic y foco correctos). Seleccionada: relleno de `--g-color-brand`, texto `on-brand`, peso de acción y una **marca ✓**; no seleccionada: borde `border-control` (3:1) sobre la superficie |
| **Tarjeta** | Borde fino y `--g-radius-lg`; categoría en `caption`/`text-subtle`; nombre en `body` con peso de título; descripción en `body-sm`/`text-muted`. Con la marca de añadido, la tarjeta pasa a `surface-sunken` |
| **Marca de añadido** | Texto en píldora con borde `border-control` (no solo color) |
| **Vista previa** | Recuadro discontinuo sobre `surface-sunken`, sin interacción; el widget conserva su aspecto real (nivel `m` por el ancho de la tarjeta) |
| **Botones** | Propios (un componente no importa a otro): borde `border-control`, radio `md`; el principal, `brand` con `on-brand`; **`aria-disabled`** (widget único ya añadido o aplicando): fondo hundido y texto atenuado, cursor `not-allowed` o `progress`, sin perder el foco |
| **Pestañas** | Subrayado de `border-width × 3` (en `--g-color-text` la activa), texto pleno y peso de título; las inactivas en `text-muted`; línea base fina. Marca de errores: píldora con borde `danger` y texto `danger-text` |
| **Resumen de errores** | Borde doble grosor en `--g-color-danger`, fondo `danger-soft`, texto `on-danger-soft`; los mensajes son enlaces subrayados; foco visible en el resumen y en cada enlace |
| **Vista previa de la configuración** | Alto fijo de `--g-widget-row × 1.75` (no salta al cambiar los valores) |
| **Pie y confirmación** | «Restablecer» a la izquierda (`margin-inline-end: auto`); la confirmación ocupa todo el pie y alinea al final |
| **Sin literales de tema** | Solo tokens y `space`; literales de medida: `24px` y `44px` (área táctil) y el `1px` del texto oculto. Sin consultas de medios de ancho (salvo el `min-width: 521px` de la hoja, el mismo umbral de `GDialog`) |

## Verificación en Chromium (banco de pruebas)

| Prueba | Resultado |
| --- | --- |
| Hoja lateral | 400×737px en un visor de 688×737 (alto completo) pegada a la derecha; con `space` 5, 500px; en RTL, a la izquierda con radios `12px 0 0 12px` (lado interior) |
| Móvil (375px) | Hoja inferior de 375×622 pegada abajo, sin desborde horizontal (`scrollWidth` 375) |
| Contraste (tema por defecto) | Categoría activa 16.48:1 · inactiva 17.4 · contador 7.46 · categoría del widget 4.72 · marca de añadido 16.1 · botón principal 16.48 · botón con `aria-disabled` 6.9 · pestaña activa 17.4 · inactiva 7.46 · marca de errores 5.49 · texto del resumen **4.8** |
| Contraste de controles (3:1) | Borde de la búsqueda y de las píldoras **3.45:1** · marca de añadido 3.19 · borde del resumen 5.49 |
| Contraste (tema de prueba) | Categoría activa 5.02 · inactiva 13.3 · contador 8.91 · botón principal 5.02 · pestaña inactiva 8.91 · bordes 6.05 |
| Áreas de acción | Búsqueda 36px, píldoras 36px, selector 36px, Añadir 36px, cerrar 36px, pestañas 36px, Aplicar 36px (todas ≥ 24px; con `space` 5, 45px); el bloque `pointer: coarse` los lleva a 44px |
| Estados | Galería (con un único ya añadido, un repetible y uno nuevo), configuración normal, con errores (resumen, marcas de pestaña y campo con error) y con la confirmación de descarte |
| Consola | Sin errores |

## Hallazgos y observaciones

1. **Los botones de los pies (Restablecer, Cancelar, Aplicar, Cerrar y Añadir) no tenían clase en los contratos.** Coco añadió las clases a las tablas de los contratos de lima (`g-widget-gallery__btn`, `g-widget-config__btn`, con `--primary` y `--reset`): **lima debe revisarlo**; bruno debe emitirlas. Sin ellas, los botones saldrían sin estilo (un componente no importa `GBtn`).
2. **Texto del resumen de errores a 4.8:1** con los tokens actuales (`on-danger-soft` sobre `danger-soft`): cumple 4.5, pero con poco margen; un tema con un `danger-soft` más intenso podría bajarlo (no es del componente).
3. **La marca de añadido (3.19:1 de borde) y la pista de la vista previa** no son información que dependa del color: el texto dice lo mismo.

## Sin verificar (no bloquea `candidate`)

Lector de pantalla real; `forced-colors`, `pointer: coarse` y `prefers-reduced-motion` reales (solo comprobé que las reglas existen); Firefox y Safari (`:dir()`, `<dialog>`, `inert`); el movimiento de entrada de la hoja en un dispositivo real; teclado virtual en móvil; textos largos o traducidos en las píldoras.
