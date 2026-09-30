# Entrega de coco · GBadge.css

**Archivos:** `packages/vue/src/components/GBadge/GBadge.css` y los valores de `--g-glass-*` en `packages/vue/src/styles/defaults.css`.
**Contrato:** `design/contracts/badge.md` (DECISIONS.md #59 y #60).
**Estado:** listo para bruno (registro pendiente en `components.css`, que es de bruno; el `.vue` aún no existe).
**Banco de pruebas:** `design/lab/badge/estilo-banco.html`: marcado exacto del contrato con el CSS real y el tema por defecto (desde la raíz del repo: `/design/lab/badge/estilo-banco.html`). Trae un botón "Tema de prueba" y un interruptor para simular transparencia reducida.

## Carácter propio (con tokens, sin literales de tema)

| Detalle | Cómo |
| --- | --- |
| **No interactiva** | Sin `:hover`, `:focus` ni `:active`; la anclada tiene `pointer-events: none` |
| **Figuras dibujadas con CSS** | Círculo (`radius-pill`), cuadrado (`radius-xs`), rombo (girado 45°) y triángulo (`clip-path`), rellenas con el color de la marca; en `forced-colors` se rellenan con `CanvasText` (`forced-color-adjust: none`), así **conservan su forma** |
| **Modos** | `kind-text` (elipsis), `kind-count` (cifras de ancho fijo, mínimo circular), `kind-icon` (círculo de `--_h`) y `kind-figure` (sin caja; `--_fig` = 3, 4 y 5 unidades de `space`) |
| **Tamaños desde `space`** | Altura 5, 6 y 7 unidades (20, 24 y 28px con `space` 4; 25, 30 y 35 con `space` 5); texto de `caption` en `sm` y `md`, de `body-sm` en `lg`; sin piso táctil |
| **Texto para lectores** | `g-badge__sr` con el patrón estándar de texto oculto |
| **Anclada** | Envoltorio posicionado; la insignia centra su esquina en la del destino con `translate` lógico (`--_dir` −1 con `:dir(rtl)`) |
| **Liquid glass** | Velo (`--g-glass-tint` al `--g-glass-opacity`, con `color-mix`), `backdrop-filter: var(--g-glass-filter)`, línea de luz superior (`--g-glass-edge`), línea inferior tenue y `--g-shadow-2`, y un brillo especular en `::before` (`--g-glass-sheen`, de arriba hacia transparente) |
| **Cristal con color** | El velo toma el tono **suave** del color (`--g-color-{color}-soft`, siempre claro); texto, figura, punto e icono usan `--g-color-text` |
| **Figura sola en cristal** | Lleva una **placa** de cristal (figura + 1 unidad de relleno por lado) para que su contraste no dependa del fondo |
| **Respaldo opaco** | `@supports not (backdrop-filter…)`, `prefers-reduced-transparency: reduce` y `forced-colors: active`: relleno `soft`, sin desenfoque, sin sombra, sin brillo |

## Valores por defecto agregados (`defaults.css`, capa `grana.defaults`)

`--g-glass-tint` = `#FFFFFF` · `--g-glass-opacity` = `0.62` · `--g-glass-filter` = `blur(14px) saturate(1.8)` · `--g-glass-edge` = `rgb(255 255 255 / 0.75)` · `--g-glass-sheen` = `rgb(255 255 255 / 0.55)`.

## Hallazgo devuelto a lima y corregido

Al calcular el contraste real se vio que **el contrato original no se sostenía**: (1) las **figuras y los iconos de color** (por ejemplo `accent-text` #0B63CE) dan 2.2:1 sobre el velo compuesto con un fondo negro (< 3:1); (2) el velo **no** podía ser un único color con opacidad, porque para teñirlo con el tono suave de cada color hace falta separar el color de la opacidad. Correcciones (en `tokens.md` §12, `badge.md` y DECISIONS.md #60): el velo pasa a **dos tokens** (`--g-glass-tint` opaco y `--g-glass-opacity`), `color` tiñe el velo con el tono suave, y texto, figura, punto e icono usan `--g-color-text`. La regla de legibilidad del CLI pasa de «opacidad ≥ 0.55» a **contraste ≥ 4.5:1 sobre negro** (la opacidad sola no basta: con un texto más claro y un velo teñido, 0.60 dio 4.06:1).

## Verificación en Chromium (banco de pruebas)

| Prueba | Resultado |
| --- | --- |
| Literales | Sin colores; medidas solo `0px`, `1px` (texto oculto); sin `var()` con respaldo, sin `@layer` |
| Alturas de texto por tamaño | 20, 24 y 28px con `space` 4; figuras solas de 12, 16 y 20px; contador mínimo circular (24 a 25px) |
| Contraste de texto (tema por defecto) | `solid` 5.33 a 9.64:1 · `soft` 4.76 a 10.11 · `outline` 5.16 a 9.34 · figuras sueltas ≥ 5.18 |
| Contraste de texto (tema de prueba) | `solid` 5.33 a 16.48 · `soft` 4.76 a 14.46 · `outline` 5.33 a 16.48 · figuras sueltas ≥ 5.35 |
| **Cristal, peor caso** (compuesto sobre negro, blanco, gris, rojo saturado y verde azulado) | Texto: brand 5.80 · accent 5.81 · neutral 6.50 · success 5.87 · warning 5.78 · danger 5.77 · info 5.81 (**mínimo 5.77:1**). Marcas (figura, punto, icono): mínimo 5.77:1 |
| Cristal con el tema de prueba | Con `--g-glass-opacity` 0.60 y texto marrón: mínimo **4.06:1 (no cumple: es la regla del CLI)**; con 0.72: mínimo **5.73:1** |
| Cambio de tema | Las **602** propiedades medidas cambian; ninguna conserva el valor por defecto |
| Respaldo opaco (transparencia reducida simulada) | `backdrop-filter: none`, fondo opaco `rgb(223 248 229)` (el tono suave de `success`), sin sombra |
| Cristal activo | `backdrop-filter: blur(14px) saturate(1.8)`; sombra con la línea de luz; `::before` con el degradado de brillo |
| Colores forzados (bloque aplicado sin condición) | Borde `ButtonText`, fondo `Canvas`, figura `CanvasText` (**la forma se mantiene**), `backdrop-filter: none` |
| Anclada | Las cuatro esquinas centran la insignia en la esquina del destino (±21px en un avatar de 42px); RTL: la esquina final pasa a la izquierda |
| Clic en la esquina compartida | Llega al botón (`pointer-events: none`); 0 insignias enfocables |
| Texto largo (160px) | Elipsis, sin desborde horizontal |
| Texto para lectores | Todos los `g-badge__sr` ocultos (≤ 1px) |
| Errores de consola | Ninguno |

## Notas para bruno

- `g-badge__text` de un contador o de una insignia con `label` lleva `aria-hidden="true"` (lo pone el componente).
- `g-badge--kind-*` va siempre; el modo lo deduce bruno del contenido (contrato).
- Las variables de posición de la anclada no hacen falta: todo va con clases.
- **No pongas `overflow: hidden` en el destino anclado** (recortaría la insignia, que sobresale de la esquina).

## Sin verificar (lo audita el paso 5 o queda pendiente)

Lector de pantalla real; `prefers-reduced-transparency` real (se simuló) y `backdrop-filter`/`color-mix` en Firefox y Safari; tema oscuro (no existe); cristal sobre imágenes fotográficas reales.
