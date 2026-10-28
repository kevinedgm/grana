# `GSplit` · auditoría de coco (paso 5)

**Dueño:** coco · **Fecha:** 2026-10-28 · **Sobre:** el componente real (`GSplit.vue` de bruno fdb65eb, `GSplit.css` de coco 8db1877) en `dist/` de `@grana/vue` reconstruido, en el banco `packages/vue/playground/split.html` y en `#sec-split` del playground · **Contrato:** `design/contracts/split.md` (#946 a #951) · **Estilo:** `design/lab/split/estilo.md`

**Verificación propia:** `GRANA_PW_PORT=4216 node design/lab/split/auditoria-verificar.mjs [--engines=chromium] [--verbose]`. Chromium, Firefox y WebKit; tema por defecto y los dos del CLI (rústico, cuerpo 17 px, y lujo; `packages/blocks/playground/marketing/temas/`), claro y oscuro. La predicción de la regla es independiente de la hoja: `space` y el cuerpo se miden con sondas y el umbral esperado es `max(space × k, cuerpo × k / 4) × (a + b) / min(a, b) + separación`. Complementarias: `estilo-verificar.mjs` (los casos K1 a K11 de kiwi con el CSS real) y `estilo-tema.mjs` (otro `space` y otro cuerpo).

## Auditoría previa (`docs/documentacion/auditoria-visual.md` §1)

- **Estructura y jerarquía:** `GSplit` no pinta. Dos `div` de región, sin rol ni foco; la semántica es la de `as` y la del contenido. Orden del DOM = orden de lectura = orden de Tab = orden visual (sin `order` ni `reverse`).
- **Contraste, delimitación, controles, estados:** no aplica; es del contenido. Medido que la raíz y las regiones no llevan fondo, borde, sombra, contorno, `transform`, posición ni contención en los 18 contextos (3 temas × claro/oscuro × 3 motores).
- **Espaciado:** solo `--g-space-1` (separación `× 6 × factor × densidad`, y mínimo del lado estrecho `× 64 · 80 · 96`) y `--g-text-body-size`. Ningún literal (`estilo-tema.mjs` comprueba la hoja: sin colores, sin respaldos de `var()`, sin consultas ni `!important`, sin medidas literales, cuatro capas en la primera línea).
- **Consistencia:** vocabulario de `gap` y `density` de `GStack`; fronteras con `GAdaptiveLayout` (regla 10) y `GContainer prose` (regla 11) medidas abajo.
- **Movimiento:** ninguno. Pasar de dos columnas a una no es un suceso del usuario; la rúbrica de movimiento **no aplica** y se confirma: transición y animación computadas en 0 / `none` en la raíz y en las regiones, con `prefers-reduced-motion: reduce` y sin él.

## Resultado

| Qué | Cómo | Resultado |
| --- | --- | --- |
| Componente real, banco y playground | `auditoria-verificar.mjs` | **2241/2241** (747 por motor: Chromium, Firefox y WebKit; tres temas, claro y oscuro, `forced-colors` y `#sec-split`) |
| K1 y K2 | 5 proporciones × `sm`/`md`/`lg` × gap `none`/`md`/`lg` × densidad `default`/`compact`, en cada tema | apila a umbral − 1, al lado en el umbral, proporción exacta ±1,5 px; K2 literal (2:1 `md`, gap `md`): 983 apila, 984 al lado con el estrecho a 320 |
| `--_narrow` | `sm`/`md`/`lg` contra `max(space × k, cuerpo × k / 4)` | iguales (±0,2 px) en los tres temas: rústico (17 px) da 340 en `md`, no 320 |
| K3 · K4 · K5 | cajón de 480 en visor de 1440; anidado a 1400 y 700; RTL | apila a todo el ancho; cada `GSplit` decide por su caja; en RTL `start` a la derecha, 3:2 conservada, sin desplazamiento |
| K6 · K7 · K8 · K9 · K10 | región vacía, separaciones 0·12·24·48 y `compact` 18 (los dos ejes), `align`, palabra larga, Tab real | región vacía no se pinta (las dos vacías: raíz sin hijos); separaciones exactas; palabra larga partida sin desplazar la página; Tab 1 → 2 → 3 al lado y apilado (WebKit con Alt+Tab) |
| Umbral exacto y texto al 200 % | `font-size: 200 %` en la raíz | el cuerpo se dobla y el umbral de 3:2 `md` pasa de ~850 a 1624 (default) y 1724 (rústico): apila a umbral − 1, al lado en el umbral; en una caja de 1000 se apila (al 100 % iría al lado) |
| Secuencia de cambios | 700 → 1400 → 900 → 1400 → 300 → 1400 | la decisión no depende del camino (sin histéresis) |
| 320 px y 320 al 200 % | los 28 fixtures del banco | sin desplazamiento horizontal; todas las parejas apiladas a todo el ancho de su caja |
| Fronteras | dentro de `GAdaptiveLayout`; dentro de `GContainer prose` | `.g-split` es bloque de línea completa y el siguiente va debajo; la prosa de una región se mide a ≤ 66ch y nunca más que su región; la pareja no se corta |
| `as="section"` | `aria-labelledby` | etiqueta correcta, sin rol ni `tabindex` en raíz ni regiones |
| `forced-colors: active` | geometría y pintura | misma geometría que sin colores forzados; nada que perder |
| Consola | `[Vue warn]` y `[Grana …]` | limpia |
| `estilo-verificar.mjs` (casos K1 a K11 de kiwi con el CSS real) | los tres motores | 28/29 por motor; el fallo es `K8 align center`, **reservado** (no existe en el CSS, #951). K9 (contenido rígido de 520 px en 325: sobresale 207) y K11 (`sticky`) son los límites ya contratados |
| `estilo-tema.mjs` | `space` 5 y cuerpo 17 px | **95/95** en los tres motores |

El tramo «bloques» de `estilo-verificar.mjs` mide «antes: dos piezas», una comparación con los bloques sin `GSplit` que ya no existe (bruno recompuso los cuatro en 8710e80): queda obsoleto y lo sustituyen las medidas de los verificadores de los bloques (`design/lab/blocks/split-comun.mjs`; ver los addenda de `ecommerce/auditoria.md` y `booking/auditoria.md`). En Firefox lanza una excepción del propio script (`spill` de una referencia ausente), no del componente.

## Hallazgos

| # | Gravedad | Dueño | Hallazgo | Estado |
| --- | --- | --- | --- | --- |
| SP-N1 | Informativa | lima / mora-docs | **El umbral depende del cuerpo del tema, no solo del `space`:** con rústico (cuerpo 17 px) el lado estrecho de `md` sube de 320 a 340 y Availability 03 (`2:1 md lg`) pide 1068 px y se apila a 1440 (caja de 1024); con el tema por defecto y lujo (16 px) pide 1008 y va al lado. Es la regla del contrato (crece con el texto), no un defecto. | Anotado: la tabla de umbrales del README debe decir que es del tema por defecto (ya está en «Límites conocidos») y que un cuerpo mayor apila antes |
| SP-N2 | Informativa | kiwi (script) | `design/lab/split/r01/verificar.mjs` («bloques», `estilo-verificar.mjs`) compara con un «antes» que ya no existe; falla 40 comprobaciones por motor por construcción y en Firefox lanza una excepción | Obsoleto; sustituido por `split-comun.mjs`. Se puede dejar o retirar el tramo |
| AV-C1 | **Media** | coco (CSS de `GDatePicker`) con decisión de lima | **Con el texto al 200 %, el precio de cada día del calendario (24 px, ~58 px de ancho) no cabe en una columna de 32 a 46 px y se solapa con el de los días vecinos** (18 pares solapados de 26 días, en los tres temas, los tres motores, a 320 y también a 1440; con el texto al 100 % no hay ninguno: 29 px en 32). No es de `GSplit` ni de la recomposición (es anterior: el verificador de Booking solo medía el desbordamiento de la caja). Una columna que crezca con el texto (7 × ~60 px) no cabe en 320 y deshace S-L11(a); la salida «no pintar el precio cuando no cabe» deja el precio solo en el nombre accesible y en la tarjeta. | **Abierto.** Pide decisión de producto (lima) antes de tocar el CSS; no se corrige con una regla de tema ni sin un literal |

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** `GSplit` cumple su contrato en los tres motores, tres temas, claro y oscuro: K1 a K10, umbral exacto, texto al 200 %, RTL, anidado, región vacía, `GAdaptiveLayout`, `GContainer prose`, `as="section"`, `forced-colors`, consola limpia y sin movimiento. La hoja no pinta nada y no tiene un solo literal, respaldo, consulta ni `!important`. Accesibilidad: ni rol ni foco propios; orden de Tab = orden del DOM; sin desplazamiento horizontal a 320 (también al 200 %).

**Correcciones:** ninguna de `GSplit.css` (sin defecto). Se añadió `auditoria-verificar.mjs` (componente real, 747 comprobaciones por motor).

**Pendientes:**
- **lima:** AV-C1 (el precio del día a 200 % de texto); SP-N1 (aclarar en el contrato que un cuerpo mayor sube el umbral, ya implícito en la regla 4).
- **mora-docs:** `GSplit/README.md` con la tabla de umbrales **del tema por defecto**, SP-N1 y la receta del contenido rígido; los README de los cuatro bloques.
- **No verificado:** lector de pantalla real (no hay nada que anunciar, no se escuchó); zoom de página real del navegador (se midió el texto al 200 % y los anchos de 768 a 320); Safari y táctil reales; SSR real (razonado y cubierto por la prueba de bruno, no ejecutado en un servidor); `forced-colors` real en Firefox y WebKit (se emuló en los tres, que lo aceptan en distinto grado); `sticky`, `ratio="auto"` y `align="center"` siguen reservados.

**Veredicto de `GSplit`:** ningún defecto bloqueante; `GSplit.meta.json` pasa a `"status": "candidate"` (lo pone coco en la auditoría, como manda el flujo del paso 5; el resto del archivo sigue siendo de bruno).
