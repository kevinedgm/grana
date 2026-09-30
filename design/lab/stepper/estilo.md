# Entrega de coco · GStepper.css

**Archivo:** `packages/vue/src/components/GStepper/GStepper.css`. No se tocó `defaults.css`: el contrato no pidió tokens nuevos y todos los tokens que lee ya tienen valor por defecto.
**Contrato:** `design/contracts/stepper.md` (DECISIONS.md #97 y #98).
**Estado:** listo para bruno (registro pendiente en `components.css`, que es de bruno; el `.vue` aún no existe).
**Banco de pruebas:** `design/lab/stepper/estilo-banco.html`: marcado exacto del contrato con el CSS real y el tema por defecto (desde la raíz del repo: `/design/lab/stepper/estilo-banco.html`). Trae un botón «Tema de prueba».

## Carácter propio (con tokens, sin literales de tema)

| Detalle | Cómo |
| --- | --- |
| **Ligero** | Indicador de 6 unidades de `space` (24px con `space` 4), conector de `--g-border-width × 2`, sin sombras de profundidad; el único «halo» del actual es un anillo de tono suave |
| **Estado por forma, no por tono** | Hecho = relleno sólido + check; actual = anillo + negrita + conector a medias; pendiente = vacío; error = borde **doble** + subrayado **ondulado**; advertencia = borde **discontinuo** + subrayado **discontinuo**; bloqueado = candado + tono atenuado; opcional = texto |
| **Punto** | El actual es un punto con anillo concéntrico (se distingue del hecho en escala de grises); el punto se centra en la primera línea de texto |
| **Línea** | Sin círculo: la etiqueta con un subrayado que engrosa en el actual; error y advertencia conservan un icono suelto |
| **Segmentado** | Tramos unidos (separados por `--g-border-width × 2`), extremos redondeados, el actual a medias, error y advertencia con **tramas** distintas |
| **Vertical** | Conector absoluto bajo el indicador; el contenido se sangra a la altura del texto |
| **Compacto** | Resumen «nombre + Paso N de M», barra segmentada fina y botón subrayado; la lista desplegada es siempre vertical y numerada (las reglas de variante no aplican con `g-stepper--is-compact`) |
| **Color** | `brand` lee `--g-color-primary*`; error y advertencia usan siempre `danger` y `warning` |
| **Dirección** | Degradados con `--_angle` (90°, 270° con `:dir(rtl)`); todo con propiedades lógicas |

## Estados cubiertos

| Estado | Cómo |
| --- | --- |
| hover | Solo en `button.g-stepper__hit`, dentro de `@media (hover: hover)`: subrayado de la etiqueta y, en hecho, relleno `strong` |
| `:focus-visible` | Contorno de `--g-focus-width` con `--g-color-focus` y `--g-focus-offset` en cada paso navegable y en el botón de desplegar |
| active | Escala de `--g-press-scale` en el indicador, solo sin movimiento reducido |
| disabled | Es el paso bloqueado: candado, tono atenuado (exento de contraste, WCAG 1.4.3); no es botón |
| loading | No aplica (el contrato no lo define) |
| `prefers-reduced-motion` | Transiciones solo con `no-preference`; con `reduce`, sin transición |
| `forced-colors` | Indicadores con `CanvasText`/`Highlight`; conectores y tramos con `GrayText`/`Highlight`; el toggle con `LinkText` |
| `pointer: coarse` | Pasos navegables y botón de desplegar ≥ 44px |

## Verificación en Chromium (banco de pruebas)

| Prueba | Resultado |
| --- | --- |
| Literales | Sin colores ni `var()` con respaldo; medidas literales solo `24px`, `44px` y `1px`/`-1px` (texto oculto); sin `@layer`; sin caracteres de icono |
| Tokens | Todos los `--g-*` que lee existen en `defaults.css` |
| Tamaños medidos | Indicador 24px, punto 12px; sin desborde horizontal a 1000px |
| Contraste, tema por defecto (sobre `surface`) | Borde del indicador pendiente **3.45:1** (≥ 3:1); etiqueta pendiente 7.46; actual 16.26; hecho: texto sobre relleno 16.26; error 5.49; advertencia 5.73; bloqueado 5.10 (exento) |
| Tema de prueba (`brand` #0B1F4D, radio 0, borde 2px, `space` 5, serif) | Nada queda con valores del tema anterior: formas cuadradas, líneas más gruesas, indicadores más grandes, fuente serif |
| Colores forzados (emulación) | Se ven indicadores, conectores y tramos; sin errores |

## Hallazgos devueltos

| # | Para | Hallazgo | Propuesta |
| --- | --- | --- | --- |
| 1 | lima | El texto visible «opcional» no tiene elemento ni clase en el contrato | Agregar `g-stepper__optional` (dentro de `__text`, tras la etiqueta). Ya está estilizado |
| 2 | lima | La clase `is-toward` se describe como conector «hacia el actual», pero visualmente es el conector **que sale del actual** (el tramo hecho a medias entre el actual y el siguiente). Lo mismo con el tramo de la barra compacta | Renombrar la descripción a «saliente del actual». La clase no cambia |
| 3 | bruno | La lista desplegada del compacto debe renderizar sus indicadores como **número** (contenido numérico e iconos de estado), porque el CSS de variantes no aplica con `--is-compact` | Dejarlo en el componente; bruno no necesita otra clase |
| 4 | bruno | En `indicator="line"`, `dot` y `segment` el indicador debe seguir en el DOM (con icono de estado): el CSS decide qué mostrar | Renderizar siempre `g-stepper__indicator` |
| 5 | bruno | Las clases `g-stepper__connector` y `__bar-seg` llevan `is-done`, `is-toward` o `is-pending` (uno solo) | Según el contrato |

## Comprobaciones NO ejecutadas

- Contraste con un tema oscuro y con los demás colores de la prop `color` (solo `brand`, `accent` y `success` se vieron a simple vista; no se midieron).
- `forced-colors` real (solo emulación), RTL real, lector de pantalla, dispositivo táctil y zoom al 200%.
- Comportamiento con etiquetas muy largas y con `size="lg"` en contenedores muy estrechos.
