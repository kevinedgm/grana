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

---

## Addendum · Zona de marca (#620–#625 + #637)

**Fecha:** 2026-10-14  
**Alcance:** `data-g-zone="brand"` como mecanismo público; `g-surface--zone-brand` como clase interna; bloque `[data-g-zone="brand"]` en `defaults.css`; 11 fuentes de color; herencia de la zona a paneles abiertos dentro; contraste ≥ 4.5:1 sobre el fondo de marca; filo `--g-color-zone-edge`; regla #637 (sin `--g-glass-filter`, sin sombras literales fuera del rango coco, no en `<html>` con CLI).  
**Método:** `GSurface.css` revisado en los bloques de zona (líneas 114–145). `defaults.css` revisado en el bloque `[data-g-zone="brand"]` (líneas 573–678). Spec `zone.spec.mjs` en `GRANA_PW_PORT=4230 npx playwright test --project=chromium` (41 pruebas, 4 temas × claro/oscuro + un test de avisos W1/W3).

### Resultado: aprobado, con 1 corrección en GInput.css

| Prueba | Resultado |
| --- | --- |
| Token-only | `GSurface.css` y el bloque `[data-g-zone="brand"]` de `defaults.css` usan solo `var(--g-*)` y `var(--_*)`; sin literales de tema ni valores de respaldo en ninguno de los dos archivos |
| 11 fuentes de color | El bloque declara `--g-color-bg`, `--g-color-surface`, `-sunken`, `-inset`, `--g-color-text`, `-muted`, `-subtle`, `--g-color-accent*` , `--g-color-focus`, `--g-color-zone-edge` y las ranuras de `--g-sidebar-current*` — todas dentro de la zona, ninguna fuera |
| Sin `--g-glass-filter` (#637) | El bloque `[data-g-zone="brand"]` no re-declara `--g-glass-filter`; verificado con grep |
| Sombras literales | `rgb(0 0 0 / 0.30)`, `rgb(0 0 0 / 0.50)`, `rgb(0 0 0 / 0.60)` en `--g-shadow-{1,2,3}` dentro de la zona son valores propios de coco (contrato surface.md §«Zona de marca»), no violaciones del token-only |
| No en `<html>` con CLI (#637) | El mecanismo `data-g-zone="brand"` solo aplica a instancias de `GSurface` o a elementos propios de la aplicación; el CLI no lo emite en `<html>`; sin cambio necesario |
| Filo (outline / box-shadow) | `outline: var(--g-border-width) solid var(--g-color-zone-edge)` en niveles con borde; `box-shadow: inset 0 0 0 var(--g-border-width) var(--g-color-zone-edge)` en `level-flat`; sin interferencia con el `box-shadow` de la sombra del nivel |
| Colores forzados | Zona no-flat: `outline: none` (el borde de CanvasText del nivel no-flat basta); flat: `outline: var(--g-border-width) solid CanvasText; outline-offset: calc(var(--g-border-width) * -1)` |
| Herencia en paneles | Un GMenu abierto dentro de la zona hereda `[data-g-zone="brand"]` y sus items cumplen 4.5:1 (verificado por `zone.spec.mjs`) |
| Contraste general | Todos los pares de componentes dentro de la zona cumplen su mínimo en los 4 temas × claro/oscuro (spec `zone.spec.mjs`) |
| Specs Playwright (foco) | Los 6 fallos originales de «foco por teclado ≥ 3:1» eran causados por `GInput.css`: la transición `outline-color` no estaba guardada por `prefers-reduced-motion: no-preference`; con movimiento reducido activo, Playwright capturaba el anillo a mitad de la transición. Corregido en `GInput.css` (ver más abajo). Tras la corrección: **0 fallos de foco** |
| Specs Playwright (total) | 38/41 pasan solos; 3 fallos de la pasada completa son flaky por concurrencia de workers (timeout de montaje de `palida` y `consola limpia` de `defecto-dark`): pasan todos al correrlos solos en un proceso aparte |

### Corrección aplicada en GInput.css

La transición `outline-color var(--g-duration-fast) var(--g-ease-standard)` del anillo de foco de `.g-input__row` estaba dentro de `@media (forced-colors: none)` pero no dentro de `@media (prefers-reduced-motion: no-preference)`. Con `reducedMotion: 'reduce'` activo (emulado por el spec), la transición de 120ms se ejecutaba igual y Playwright capturaba el anillo a mitad de la transición, devolviendo un color semitransparente con contraste < 3:1.

Corrección: la declaración `transition:` se movió a `@media (forced-colors: none) and (prefers-reduced-motion: no-preference)`. El anillo aparece ahora de forma inmediata cuando el usuario prefiere movimiento reducido, tanto para la accesibilidad (WCAG 2.3) como para la estabilidad de los tests.

**Para bruno:** el bloque `@media (forced-colors: none)` de `.g-input__row` ya no incluye `transition:`; el nuevo bloque combinado va a continuación. Sin cambio de comportamiento visible con movimiento estándar. Sin impacto en pruebas de vitest.

### Sin verificar

Lector de pantalla real con la zona (texto `color: var(--g-color-text)` frente al fondo de marca); `forced-colors` real (el filo `outline` en modo Windows HCM); Safari con `color-mix()` dentro de la zona si el CLI genera OKLCH; tema oscuro generado por CLI dentro de la zona.
