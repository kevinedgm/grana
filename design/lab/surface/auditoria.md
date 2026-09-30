# Auditoría de coco · GSurface (paso 5)

**Componente:** `packages/vue/src/components/GSurface/` (el real, `.vue` + `.css`, con `dist/` reconstruido).
**Método:** Chromium con el build real (`dist/grana.umd.js` y `grana.css`) y Vue global. Se montaron **109 superficies** reales: 5 niveles × 2 tonos × 3 densidades, cada una con una inset y una inset de tercer nivel; 7 valores de `rounded` en una carcasa con inset; una tarjeta estrecha; y el caso límite «tarjeta dentro de una inset». Se midió con `getComputedStyle` en claro, con un tema distinto, en oscuro, en RTL, con colores forzados emulados y a 320px.

## Resultado: aprobado, sin correcciones

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | Con un tema distinto (crema, radios 6/8/12/16/24, `space` 5, borde 2px, `gap` 10, sombras cálidas) cambian **628 de 763** propiedades medidas. Las 135 que no cambian son las que no dependen del tema: fondos **transparentes** (flat, tercer nivel), **sin sombra** (outlined, flat, inset sobre padre claro) y `flat` sin borde. Ningún valor conserva el del tema por defecto |
| Radio concéntrico (defecto) | Carcasa `xl` 12px con relleno 6 → inset **6px**; con `none`, `xs`…`lg` la inset cae al mínimo (3px); con `pill` la inset es también píldora (993px) |
| Radio concéntrico (tema distinto) | `xl` 24px con relleno 10 → **14px**; mínimo 6px (`radius-xs` del tema) |
| Densidad | Relleno 16 / 14 / 12px |
| Contraste del texto sobre su fondo efectivo | Mínimo **16.10:1** (defecto), **12.08:1** (tema distinto), **15.22:1** (oscuro), en las 109 superficies |
| Oscuro | Tarjeta `#1C1C1C` con inset `#101010`; carcasa hundida `#101010` con inset `#1C1C1C`: el paso de tono se invierte igual que en claro |
| RTL | Sin cambios de geometría (el radio es simétrico); sin desborde |
| Colores forzados (emulación) | Todos los niveles no planos con borde; `flat` sin borde; ninguna sombra |
| 320px | La tarjeta estrecha no desborda (`scrollWidth` = `clientWidth` = 318) |
| Caso límite: tarjeta dentro de una inset | Inset `#F6F6F6` → tarjeta blanca → la inset de la tarjeta queda **transparente** (la regla de tercer nivel alcanza a cualquier inset descendiente de otra inset): se ven dos tonos, el límite se respeta |
| Consola | Sin errores ni avisos |

## Observaciones

- **El caso límite funciona «por accidente favorable»:** la regla `.g-surface--level-inset .g-surface--level-inset` aplana cualquier inset que tenga otra inset como ancestro, aunque entre ellas haya una tarjeta. El resultado respeta los dos pasos de tono, pero la inset de la tarjeta pierde su tono hundido. Se documenta como comportamiento; si se quiere otro, es una ronda de kiwi.
- La medición de desborde a 320px del **banco** dio 336 por el relleno del propio banco (16px + 320px fijos); la superficie no desborda.
- **Sin ejecutar:** `forced-colors` real, Firefox y Safari (`:not()` con selectores complejos), zoom al 200%.
