# Entrega de coco · GSurface.css

**Archivo:** `packages/vue/src/components/GSurface/GSurface.css`. No se tocó `defaults.css`: el contrato no pide tokens nuevos.
**Contrato:** `design/contracts/surface.md` (DECISIONS.md #99 y #100).
**Estado:** listo para bruno (registro pendiente en `components.css`; el `.vue` aún no existe).
**Banco de pruebas:** `design/lab/surface/estilo-banco.html` (desde la raíz del repo), con «Tema de prueba» y «Oscuro».

## Carácter propio (con tokens, sin literales)

| Detalle | Cómo |
| --- | --- |
| **Profundidad sutil** | `outlined`: borde `border-strong`, sin sombra. `raised`: borde tenue + `shadow-1`. `floating`: borde tenue + `shadow-2`. Ningún nivel usa `shadow-3` (es de la capa modal) |
| **Inset relativa al padre** | Alias heredados `--_pub-offer`, `--_pub-shadow`, `--_pub-radius` publicados por toda superficie no-inset; la inset solo los lee |
| **Tercer nivel** | `--_pub2-radius` publicado por la inset de segundo nivel; el tercero queda transparente, sin sombra, con línea y radio concéntrico |
| **Inset suelta** | `:not(.g-surface .g-surface--level-inset)`: tono hundido y `radius-lg` |
| **`flat`** | Sin fondo y **sin borde** (`border-style: none`: un borde transparente se pintaría con colores forzados); su inset hija usa `radius-lg` |
| **Radio 0 sin unidad** | `--g-radius-none` es `0` sin unidad y no entra en `calc()` con longitudes: con `rounded="none"` la hija usa `radius-xs` directamente |
| **Texto** | `color: var(--g-color-text)` en la raíz |

## Estados cubiertos

| Estado | Cómo |
| --- | --- |
| hover, `:focus-visible`, active, disabled, loading | **No aplican:** `GSurface` no es interactiva (contrato) |
| `prefers-reduced-motion` | No aplica: sin movimiento |
| `forced-colors` | Todo nivel no plano con borde `CanvasText`; `flat` sin borde |

## Verificación en Chromium (banco de pruebas)

| Prueba | Resultado |
| --- | --- |
| Literales | Ninguno: sin colores, sin medidas, sin `var()` con respaldo, sin `@layer` |
| Niveles (defecto) | flat transparente sin borde · outlined blanco + borde 0.16 · raised blanco + borde 0.08 + sombra · floating blanco + borde 0.08 + sombra mayor · inset suelta `#F6F6F6` + borde, sin sombra |
| Inset en tarjeta (a través de un `<form>` intermedio) | `#F6F6F6`, sin sombra, radio 3px (mínimo): la anidación funciona entre descendientes |
| Carcasa de diálogo (`floating`, `sunken`, `xs`, `rounded="xl"`) | Carcasa `#F6F6F6`, radio 12, relleno 6 → inset blanca con sombra y radio **6** (12 − 6) |
| Radio concéntrico (defecto) | xs 12−6 → 6 · sm 12−8 → 4 · md 12−16 → 3 (mínimo) · padre sin radio → 3 · padre flat → 8 |
| Tema de prueba (crema, radios 16/24, `space` 5, borde 2px, `gap` 10) | Todo cambia; carcasa 24 − 10 → inset **14**; padre flat → 16 |
| Densidad | 16 / 14 / 12px (×1, ×0.875, ×0.75); con `space` 5: 20 / 17.5 / 15 |
| Texto sobre cada tono | Defecto ≥ **16.1:1** · tema de prueba ≥ **12.08:1** · oscuro ≥ **15.22:1** |
| Oscuro | Tarjeta `#1C1C1C`, inset `#101010` sin sombra; carcasa `#101010`, inset `#1C1C1C` con sombra |
| Colores forzados (emulación) | Borde visible en todos los niveles no planos; flat 0px |

## Hallazgos corregidos en la entrega

1. **`flat` con inset daba radio 0:** la regla general (`.g-surface:not(.g-surface--level-inset)`, más específica) calculaba `0 − relleno` con un `0` sin unidad (inválido). Se subió la especificidad de la regla de `flat`.
2. **`flat` mostraba borde en colores forzados:** el borde transparente se pintaba. Ahora `border-style: none`.

## Observaciones

- La distinción `raised` / `floating` sobre el fondo de página es sutil en claro (solo cambia la sombra); en oscuro la sombra casi no se ve y se distinguen por el borde. Es coherente con el brief (profundidad sutil); si se quiere más separación, se ajusta `--g-shadow-2`.
- **Sin ejecutar:** zoom al 200%, `forced-colors` real, Firefox y Safari (`:not()` con selectores complejos: Safari 9+, Firefox 84+).
