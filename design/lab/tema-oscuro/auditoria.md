# Auditoría de coco · tema oscuro (paso 5)

**Alcance:** `defaults.css` (bloques claro y oscuro), la derivación y el `tokens.css` del CLI, y **todos los componentes reales** del playground en oscuro con un tema propio.
**Método:** Chromium, playground (`localhost:4173`). Tema propio generado con el CLI real (`brand` `#7A1F5C`, `accent` `#0F766E`, `radius` 10, `shape` pill, `dark: true`; el CLI deriva `brand` oscuro `#C3639F` y `accent` oscuro `#379188`), cargado como `tokens.css` sin capa junto a `dist/grana.css`, con `data-theme="dark"` y con el sistema oscuro emulado. Barrido automático del contraste de cada texto visible contra su fondo compuesto, más el de los bordes de los controles, con los overlays abiertos (diálogos, galería, configuración, menú de widget, lista del select, selector de fechas). Revisión visual de capturas del sidebar, del selector de fechas, de los widgets y del cristal.

## Resultado: aprobado, sin correcciones

| Prueba | Resultado |
| --- | --- |
| Colores literales en componentes | **Ninguno**: un `grep` de `#hex`, `rgb()`, `hsl()`, `white` y `black` sobre los CSS de los 18 componentes solo encuentra `white-space`. El oscuro no exigió cambiar ningún componente |
| Texto de la página entera (tema propio, oscuro) | **436 textos** visibles: **0 fallos** en componentes (la única excepción es el avatar del playground, una `<span class="g-btn">` sobre `surface-sunken`) |
| Con overlays abiertos | Diálogo con inset y pie, con secciones, de confirmación y con formulario (441 a 446 textos); galería (481); menú de un widget (447); configuración con errores (448) y con la confirmación de descarte (449); **lista del select** (13) y **selector de fechas** (97): **0 fallos** en todos |
| Bordes de controles (≥ 3:1) | De 50 controles, **11** quedan bajo 3:1: los **7 de variante `soft`** (sin borde: se distinguen por el relleno, igual que en el claro) y los **4 deshabilitados** (exentos del contraste). Los controles `outline` habilitados **pasan** |
| Tema propio | Con `dark: true`, la variante oscura se deriva sola y el barrido no encuentra un solo texto de color ilegible; `brand` oscuro `#C3639F` (9 a 10:1 con el texto de `on-brand`) y `accent` oscuro `#379188` |
| Activación (del paso anterior) | Automático, forzado, anidado y `dark: false` verificados de extremo a extremo con un `tokens.css` real |
| Cristal | Las insignias `glass` mantienen el texto legible sobre el degradado (velo oscuro de opacidad 0.72, texto `#F2F2F2`) |
| Revisión visual | El sidebar (item activo con contorno, contador y punto con `brand` oscuro), el selector de fechas (día de hoy, rango y fechas bloqueadas), los widgets (progreso, leyenda con formas, tendencia) y los diálogos se ven coherentes; la profundidad sale de la luminosidad |
| Consola | Sin errores |

## Observaciones (no bloquean)

- **Los controles de variante `soft` no tienen borde** y su relleno se distingue del fondo por 1.03:1 en oscuro (1.07:1 en el claro): es una variante de relleno, como ya estaba en el claro; quien necesite un límite claro usa `outline`.
- **El día de hoy y la selección** del selector de fechas se apoyan en un anillo y un punto (forma), no solo en el color, y se leen bien en oscuro.
- **Texto semántico sobre `surface` cerca del mínimo** (4.52 a 4.62:1, ver `estilo.md`): si una aplicación pinta texto de color sobre una superficie más clara que `surface`, bajaría del mínimo; el tema no define ninguna.
- **El barrido mide contraste de texto y de bordes de controles**, no el de todos los indicadores no textuales (por ejemplo el riel del interruptor o la pista del progreso): esos se revisaron a ojo en capturas.

## Sin verificar (no bloquea)

Lector de pantalla; Firefox y Safari (`color-scheme`, `:dir()`, `:not([data-theme])` con `prefers-color-scheme`); `forced-colors` junto al oscuro (los bloques existen, no se aplicaron); el oscuro con un tema propio que sobrescriba neutros con `overrides` (probado por pruebas del CLI, no visualmente); imágenes e iconos de la aplicación; el plugin de Vite (no existe).
