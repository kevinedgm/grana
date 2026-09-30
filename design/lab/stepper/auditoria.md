# Auditoría de coco · GStepper (paso 5)

**Componente:** `packages/vue/src/components/GStepper/` (el real, `.vue` + `.css`, con `dist/` reconstruido).
**Método:** Chromium con el build real (`dist/grana.umd.js` y `grana.css`) y Vue global. Se montaron 14 steppers: 7 colores (con error, advertencia, bloqueado y opcional), 5 indicadores, vertical con contenido y compacto. Se midió con `getComputedStyle` antes y después de cambiar el tema, y en oscuro, RTL, movimiento reducido y colores forzados.

## Resultado: aprobado, con 1 corrección

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | Con un tema distinto (`primary` granate, `accent` verde azulado, radio 2px/0, borde 2px, `space` 5, serif, peso de título 800) cambian **4 850 de 13 338** propiedades medidas; las que no cambian son las que el tema no toca (padding o ancho de elementos que el tema no redefine, estilos como `solid`) y **los colores de texto y borde que no cambian (39 y 30) pertenecen a elementos que ya coincidían con la nueva `surface`**. Ningún color conserva el valor del tema por defecto |
| Medidas con `space` 5 | Indicador 30px, punto 15px, conector 4px (con `--g-border-width` 2px): todo deriva de tokens |
| Contraste, tema por defecto (7 colores) | Texto del número hecho sobre su relleno **5.33 a 16.48:1**; relleno hecho ≥ 3:1 en los siete colores y anillo del actual **5.73:1**; etiqueta pendiente 5.10 y hecha 17.40; error 5.49 y advertencia 5.73 (borde y texto); borde del indicador pendiente **3.45** y tramo pendiente **3.45** (≥ 3:1) |
| Contraste, tema distinto | Borde y tramo pendiente **3.99**; etiquetas 8.20; anillo 5.64; relleno hecho 10.94 |
| **Tema oscuro** (`data-theme="dark"`) | Número hecho sobre su relleno **4.81 a 16.19** en los siete colores; relleno hecho ≥ **4.52**; anillo del actual 4.54; error 4.52 y advertencia 4.54 (borde y texto); borde y tramo pendiente 4.32; etiqueta 8.59. Todo ≥ 4.5:1 en texto y ≥ 3:1 en controles |
| RTL | Los degradados del conector y del tramo giran (`90deg` → `270deg`); el orden de los pasos se invierte; los indicadores quedan a la derecha del texto; sin desborde |
| Movimiento reducido | `transition-duration`: 0.12s → **0s** |
| Hover | Subrayado de la etiqueta solo en pasos navegables |
| Foco visible | Contorno sólido 2px con `--g-color-focus` |
| Colores forzados | Indicadores, conectores y tramos con colores de sistema; se conservan forma, candado, icono y subrayados |
| Táctil (`hasTouch`, 390px) | Pasos navegables y botón de desplegar: **44px** |
| Consola | Sin errores ni avisos |

## Hallazgos y correcciones

1. **«(opcional)» ocupaba una línea propia**, entre la etiqueta y la descripción (tres líneas por paso). **Corregido en `GStepper.css`**: el texto del paso pasa a una rejilla de dos columnas (etiqueta con elipsis y «opcional» a su lado) con la descripción debajo. Verificado: etiqueta y «opcional» a 1px de diferencia vertical; el paso mide 45px.
2. **Falso positivo propio de la auditoría** (no es un defecto del componente): el primer paso `pending` del montaje era el **bloqueado**, que usa `--g-color-border` (exento de contraste, WCAG 1.4.3); al medirlo como «pendiente» daba 1.65:1. Re-medido con `:not(.is-disabled)`: 3.45 y 3.99:1.

## Observaciones

- **Con 5 pasos a 600px** la etiqueta «Confirmación» se trunca (`Confir…`): es el efecto esperado del umbral `n × space × 32` (DECISIONS.md #98). Si se quiere más holgura, se sube el factor en bruno y lima; el CSS no cambia.
- **El tema oscuro queda justo:** error 4.52:1, advertencia 4.54:1 y anillo 4.54:1 pasan el mínimo de texto por muy poco. Cualquier tema oscuro con `danger-text` o `warning-text` más apagados falla; lo vigila el CLI (validación de mínimos), no el componente.
- **Sin ejecutar:** lector de pantalla real, Firefox y Safari, `forced-colors` real (se usó la emulación de Chromium), zoom al 200% y dispositivo táctil real.
