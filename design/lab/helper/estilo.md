# Entrega de coco · GHelper.css y GHelperScope.css

**Archivos:** `packages/vue/src/components/GHelper/GHelper.css` y `packages/vue/src/components/GHelperScope/GHelperScope.css`. No se tocó `defaults.css`: sin tokens nuevos.
**Contrato:** `design/contracts/helper.md` (DECISIONS.md #101 a #104).
**Estado:** listo para bruno (registro pendiente en `components.css`; los `.vue` aún no existen).
**Banco de pruebas:** `design/lab/helper/estilo-banco.html` (desde la raíz del repo), con «Tema de prueba» y «Oscuro». El script del banco solo abre el popover y le da `--_x`, `--_y` y `--_max`, como hará bruno.

## Carácter propio (con tokens, sin literales)

| Detalle | Cómo |
| --- | --- |
| **Scope invisible** | `.g-helper-scope { position: relative }` y nada más |
| **Disparador por defecto** | Círculo de `space × 8` (32px), fondo `surface`, borde `border-control` (≥ 3:1), `shadow-1` muy leve para que flote sobre cualquier región; icono `circle-help` al 56% del círculo, en `text-muted`. Abierto: icono y borde en `text` |
| **Disparador personalizado** | El botón no aporta aspecto (sin borde ni fondo): solo foco, área táctil y cursor; hereda el color |
| **Área táctil** | `::after` centrado de `max(100%, 24px)`, y 44px con `pointer: coarse`, sin cambiar el aspecto |
| **Geometría float** | Solo propiedades lógicas y `translate` con `--_dir` (−1 en RTL) para `edge` y el centro |
| **Popover** | Lenguaje de `GSurface level="floating"`: `surface`, borde tenue, `radius-lg`, `shadow-2`; relleno `space × 3/4`; ancho máximo `space × 80`; alto máximo `--_max` con scroll interno |
| **Coordenadas** | `left`/`top` físicos (como `GMenu`): el componente calcula en coordenadas del visor |
| **Entrada** | Opacidad + desplazamiento de `space` desde el lado del disparador (`data-side`), con `@starting-style`, solo con `prefers-reduced-motion: no-preference` |

## Estados cubiertos

| Estado | Cómo |
| --- | --- |
| hover | `@media (hover: hover)`, solo cerrado y habilitado: icono y borde más oscuros |
| `:focus-visible` | Disparador y contenido: `--g-focus-width`, `--g-color-focus`, `--g-focus-offset` (sin estilo propio) |
| abierto (`is-open`) | Icono y borde en `text` |
| disabled | `cursor: not-allowed` y opacidad 0.5 (exento de contraste) |
| active, loading | No aplican (el contrato no los define) |
| `prefers-reduced-motion` | Sin desplazamiento; fundido de entrada de 120 ms (`linear`). Sin salida animada: el contenido se desmonta al cerrar |
| `forced-colors` | Disparador con `ButtonText`/`ButtonFace`; contenido con borde `CanvasText` |

## Verificación en Chromium (banco de pruebas)

| Prueba | Resultado |
| --- | --- |
| Literales | Solo `24px` y `44px` (área táctil); sin colores, sin `var()` con respaldo, sin `@layer` |
| Tamaño | Disparador 32px (40px con `space` 5); icono 17.9px (22.4px) |
| Contraste del disparador | Icono sobre su fondo **7.46:1** (claro), **8.59:1** (oscuro), **17.4:1** (tema de prueba); borde sobre el fondo de página **3.45:1** (claro), **4.66:1** (oscuro), **7.46:1** (tema de prueba) |
| Geometría (top-end, offset 2) | `inside` a 9px del borde (8 + 1 de borde de la región); `edge` centro a 1px del borde; `outside` 8px fuera; `bottom` + centro: centro al 50% y sobre el borde inferior (−1px). Con `space` 5: 11px y 10px |
| RTL | Todo se refleja: el disparador `end` queda a la izquierda (8% del ancho) |
| Popover | Ancho máximo 320px con texto largo; radio 8px; sombra; texto **17.4:1** |
| Abierto con el puntero encima | Borde en `text` (el hover no lo pisa: se corrigió en la entrega) |

## Hallazgo corregido en la entrega

- **El hover pisaba el estado abierto:** con el puntero sobre el disparador abierto, el borde volvía al tono de hover. El hover ahora solo aplica con el helper cerrado.

## Hallazgos para bruno

1. El contenido necesita `data-side` con el **lado realmente usado** tras el volteo (la entrada depende de él).
2. `--_max`: alto disponible en el lado elegido (menos el margen), para el scroll interno del popover.
3. En la hoja (`GDialog`), el contenido no usa `g-helper__content`: lo estiliza `GDialog`.

## No ejecutado

`forced-colors` real (emulado: los colores de sistema se aplican), Firefox y Safari (`@starting-style`: si no existe, el popover aparece sin animación), zoom al 200%.
