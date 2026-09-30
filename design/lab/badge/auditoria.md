# Auditoría de coco · GBadge (paso 5)

**Componente:** `packages/vue/src/components/GBadge/` (el real, `.vue` + `.css`, con `dist/` reconstruido).
**Método:** Chromium, playground (`localhost:4173`). Se montaron 77 insignias reales: 4 variantes × 7 colores de texto, 3 tamaños con texto y figura, contador, solo icono y solo figura; 4 formas × 3 variantes; cristal sobre fondo negro, tipo foto y de rayas; anclada en las cuatro esquinas y en RTL; texto largo en 160px. Se compararon los estilos computados bajo el tema por defecto y bajo un tema distinto (ámbar, texto marrón, velo `#FFF6E5` al 0.72, borde 2px, espacio base 5, Georgia). Los bloques `forced-colors` y `prefers-reduced-transparency` se aplicaron sin condición.

## Resultado: aprobado, con 1 corrección

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | Las 206 propiedades medidas cambian; ninguna conserva el valor por defecto |
| Contraste de texto | `solid` 5.33:1 · `soft` 4.76 · `outline` 5.33 (por defecto) y 5.16 (tema de prueba) · figuras sueltas 5.35 (por defecto) y 5.18 |
| **Cristal, peor caso** (compuesto sobre negro, blanco, gris, rojo saturado y verde azulado) | Texto y marcas (figura, punto, icono): **5.77:1** por defecto y **5.73:1** con el tema de prueba, en los siete colores |
| Alturas con `space` 5 | Texto 25, 30 y 35px; icono solo 25, 30 y 35px; figura sola 15, 20 y 25px |
| Anclada | Las cuatro esquinas centran la insignia en la esquina del destino (±21px en un avatar de 42px); en RTL, la esquina final cae a la izquierda |
| Clic en la esquina compartida | Llega al botón (`pointer-events: none`); 0 insignias enfocables de las 77 |
| Nombre accesible | Insignias sin texto: todas con `g-badge__sr` y partes visibles `aria-hidden` |
| Texto largo (160px) | Elipsis; el contenedor no desborda |
| Respaldo por transparencia reducida (bloque aplicado sin condición) | `backdrop-filter: none`, fondo opaco `rgb(223 248 229)` (tono suave de `success`), sin sombra ni brillo |
| Colores forzados (bloque aplicado sin condición) | Borde `ButtonText`, fondo `Canvas`, figura `CanvasText` (**la forma se mantiene**), `backdrop-filter: none` |
| Formas | Círculo `999px`, cuadrado `3px`, rombo girado 45°, triángulo con `clip-path`: distinguibles sin color |
| Consola | Sin errores |

## Hallazgos y correcciones

1. **Un contador (y un icono o una figura) se recortaba en una fila flex.** El texto del contador lleva `overflow: hidden` y `text-overflow: ellipsis` (para el texto largo de una insignia de texto); en una fila flex apretada, el navegador encogía la insignia hasta «1…». Corregido en `GBadge.css`: los modos `count`, `icon` y `figure` llevan `flex: none` (no se encogen) y el texto de un contador `overflow: visible`; solo el texto de una insignia de texto conserva la elipsis. Verificado: los contadores de los tres tamaños miden 26, 30 y 38px con todo su texto visible, y los iconos y figuras mantienen su tamaño.

## Observaciones

- **El cristal depende de que el tema cumpla la regla de legibilidad** (`tokens.md` §12): con `--g-glass-opacity` 0.60, texto marrón y velo teñido, el peor caso baja a 4.06:1. Con 0.72 cumple (5.73:1). Es la regla que validará el CLI.
- **El cristal sobre fondo claro casi pierde el borde:** la insignia se reconoce por su texto, su brillo y su sombra (documentado en el contrato).

## Sin verificar (no bloquea `candidate`)

Lector de pantalla real (insignia sin texto y anclada junto a su destino), `prefers-reduced-transparency` real (se aplicó el bloque sin condición), `backdrop-filter` y `color-mix` en Firefox y Safari, el cristal sobre fotografías reales y el tema oscuro (no existe).
