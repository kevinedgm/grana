# Auditoría de coco · GTabs, GTabPanel y slot `tabs` de GDialog (paso 5)

**Componentes:** `packages/vue/src/components/GTabs/` (`GTabs.vue`, `GTabPanel.vue`, `GTabs.css`), `GDialog` con el slot `tabs` (`.g-dialog__tabs`), los reales con `dist/` reconstruido (`npm run build`).
**Método:** Chromium con el build real y Vue global, en el playground (`/playground/`, sección «Pestañas», diálogo incluido) y en una página de medición propia con la matriz completa: 4 apariencias × 2 orientaciones × 3 densidades (24 combinaciones, seis pestañas con icono, contador, insignia, `attention`, `loading` y una deshabilitada) más cuatro instancias de activación manual (una por apariencia, para medir el foco sobre una pestaña **no activa**) y tres de desbordamiento (`scroll`, `arrows`, `more`) en 300px. Contraste **medido** sobre el compuesto real de capas (`elementsFromPoint`), no estimado. Temas: **defecto** (claro y oscuro), **Spotify** (marca pálida `#1ED760`; claro y oscuro, generado por el CLI), **Apple** (claro y oscuro, generado) y **granate** (serif, `space` 5, borde 2px, foco de 3px verde azulado, radios distintos; solo claro). Además: RTL, `prefers-reduced-motion` y `forced-colors` emulados, táctil (`pointer: coarse`, 390px), 320px, y **Firefox y WebKit** (alineación de la marca en las 24 combinaciones, foco, «Más» abierto, flechas y RTL).

## Resultado: aprobado. Sin defectos de CSS (no se tocó `GTabs.css`, `defaults.css` ni `GDialog.css`); un hallazgo menor para bruno

### Contraste (mínimo de las 12 combinaciones por apariencia; texto sobre su fondo efectivo)

| Medida | Defecto claro | Defecto oscuro | Spotify claro / oscuro | Apple claro / oscuro | Granate |
| --- | --- | --- | --- | --- | --- |
| Texto activo: underline | 17.40 | 16.46 | 17.41 / 16.54 | 17.40 / 16.46 | 16.23 |
| Texto activo: pill (`on-primary-soft`) | 16.48 | 16.46 | **5.14** / 9.60 | 16.83 / 8.81 | 12.60 |
| Texto activo: segmented / contained | 15.55 / 15.96 | 13.44 / 14.56 | 15.55 / 13.52 · 15.97 / 14.64 | 15.55 / 13.44 · 15.96 / 14.56 | 14.51 / 14.90 |
| Texto inactivo (el peor de las cuatro apariencias) | 6.66 | 7.59 | 6.60 / 7.61 | 6.66 / 7.59 | 8.20 |
| Marca underline (3:1 exigido) | 16.48 | 16.46 | **4.53** / 9.60 | 16.83 / 8.81 | 9.39 |
| Línea de `contained` (3:1) | 15.12 | 14.56 | 4.16 / 8.50 | 15.44 / 7.79 | 8.61 |
| Contorno de la píldora / anfitriona (3:1) | 3.45 | 4.66 | 3.43 / 4.70 | 3.45 / 4.66 | 5.24 |
| Contorno del segmento / pista (3:1) | 3.08 | 3.81 | 3.07 / 3.84 | 3.08 / 3.81 | 4.68 |
| Anillo de foco / pestaña inactiva (3:1), underline, pill, contained | 5.22 a 5.69 | 4.38 a 4.95 | 4.23 a 4.61 / 12.6 a 14.2 | 4.15 a 4.52 / 4.42 a 5.00 | 4.66 a 5.08 |
| Anillo de foco / pista (`segmented`, exterior) | 5.08 | 4.05 | 4.12 / 11.64 | 4.04 / 4.09 | 4.54 |

El peor caso de marca (4.53, Spotify claro) y de texto activo en píldora (5.14) sigue sobre el mínimo gracias a que la marca lee el rol `-text` de la familia y no `primary` (decisión de coco en `estilo.md`). La superficie de la píldora sola da 1.1 a 1.3:1 contra la anfitriona (esperado): la señal de forma es el contorno de `border-control` (3.4 a 5.2:1), más el peso 600 y el color del texto.

### Pruebas por comportamiento

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | Granate cambia alturas (55px = `space` 5 × 10 × 1.1; 48.75 y 42.5 según densidad), rellenos, borde 2px del contorno, foco de 3px, tipografía y colores; Spotify y Apple cambian marca, pista, banda y foco. Nada queda fijo en el componente: solo cambian valores de `--g-*` |
| Foco | Contorno **sólido** con `--g-focus-width` y `--g-color-focus` del tema (2px por defecto, 3px en granate), **interior** en underline, pill y contained, **exterior** en `segmented`; solo en la pestaña **enfocada**, la activa no lo lleva (`outline: none`) → distinto del estado activo en las cuatro apariencias |
| Tamaños (puntero fino) | Pestaña 40 / 35 / 30px (default / comfortable / compact), segmento 32 / 27 / 24px (piso de 24) |
| Táctil (`pointer: coarse`, 390px) | **44px** en las 12 combinaciones horizontales, en el botón de borde de `arrows` y en el «Más» (mínimo medido 44×44) |
| Apariencias × densidades × orientación | Las 24 combinaciones: marca **alineada** con la pestaña activa (0 a 0.02px de diferencia en ancho y posición, también en las 12 de cada orientación), `is-ready` presente, sin desborde de la raíz |
| Desbordamiento | `scroll`: sin botones, 14 pestañas, activa a la vista al montar; `arrows`: 2 botones, el siguiente desplaza (+142px); `more`: 2 pestañas y el botón «Más» (`aria-haspopup="menu"`, `aria-expanded`) con un menú de 14 elementos `radio`, la activa marcada y el foco dentro; **Esc** devuelve el foco al botón y cierra el menú; Intro elige y la pestaña pasa a la barra. Igual en Firefox y WebKit |
| RTL | Marca alineada en las 24 combinaciones (Chromium) y en píldora y segmento (Firefox, WebKit); chevrones de los botones espejados |
| Movimiento reducido | `transition-duration` de la marca `0s`; el icono `loading` sin animación (`animation-name: none` en todos) |
| Colores forzados (emulados) | Marca `Highlight`; texto de la activa `HighlightText` en pill, segmented y contained y `CanvasText` en underline; línea base y deshabilitada en `GrayText`; legible en captura. La paleta emulada no es la de Windows |
| Diálogo con pestañas (`slot tabs`) | `.g-dialog__tabs` entre encabezado y cuerpo, `tablist` con `GTabs detached`, `tabpanel` con `aria-labelledby` de su pestaña y `tabindex="0"`; el cuerpo no se anuncia además como `region` (0 regiones); sin desborde a 320px (diálogo de 320px, desborde 0) |
| 320px | Página de medición a 390px sin desborde horizontal; en el playground a 320px **ningún** elemento de la sección «Pestañas» sobresale (las listas con scroll se recortan en su scroller); el diálogo a 320px sin desborde |
| Consola | Sin errores ni avisos (Chromium; Firefox y WebKit sin errores) |
| `.vue` y CSS | `GTabs.vue` y `GTabPanel.vue` sin `<style>`, sin colores ni medidas en píxeles salvo el texto oculto (`1px`); `GTabs.css` y `.g-dialog__tabs` solo con `var(--g-*)`/`--_*` y las medidas permitidas (`24px`, `44px`, `0px`); sin valores de respaldo |

## Hallazgos

| # | Severidad | Dueño | Hallazgo |
| --- | --- | --- | --- |
| 1 | **Menor** (no bloquea) | bruno | **La marca queda desfasada si el ancho de las pestañas cambia sin que cambie el de la raíz ni el del `scroller`.** El `ResizeObserver` de `GTabs.vue` observa solo `rootEl` y `scrollerEl`. Reproducido al cambiar en caliente un tema que altera la familia tipográfica (Spotify): la marca de la píldora queda 1.5px más estrecha que la pestaña y 0.5px corrida, y no se corrige ni al redimensionar la ventana. Las cargas de fuente por `@font-face` sí se cubren (`document.fonts.ready` y `loadingdone`); el hueco son los cambios de tema en tiempo de ejecución. Propuesta: observar también `listEl()` (o cada pestaña) con el mismo `fit()` / `refresh()`. |
| 2 | Informativo | coco / lima | **Contorno del segmento, lado interior, en oscuro: 2.59:1** (3.45 en claro). Es la excepción ya documentada en `estilo.md` (un contorno a la vez ≥ 3:1 contra la pista y contra un segmento más claro no es posible); el límite contra la pista es 3.8:1 y el segmento se distingue además por forma, sombra y peso del texto. Se mantiene. |
| 3 | Informativo | lima | `--g-tabs-inset` sigue declarado en `GTabs.css` (`:root`) y no en `defaults.css` (por `levels.test.js`); conviene anotarlo en `tokens.md` §18, como ya pidió coco. |
| 4 | Informativo | bruno / lima | El CLI aún no emite los `--g-tabs-*`; los temas generados usan los de `defaults.css` (translúcidos sobre la anfitriona), y funcionan en los cuatro temas medidos. Solo `--g-tabs-panel` se resuelve contra `--g-color-surface`. |

## Sin ejecutar

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): anuncio de estado y contador, `aria-setsize`/`posinset` con pestañas ocultas, el menú «Más».
- **Táctil con dedo**, `snap` con dedo y zoom al 200%.
- **`forced-colors` real de Windows** (solo emulado) y `prefers-contrast: more` con un tema real de alto contraste.
- **Rendimiento** con decenas de pestañas y redimensionar con «Más» abierto.
- Tooltip para solo iconos: no existe todavía (decisión #113).

## Seguimiento (bruno)

El `ResizeObserver` de `GTabs.vue` observa ahora también la lista de pestañas (se vuelve a observar si cambia el elemento), de modo que un cambio de ancho de las pestañas sin cambiar raíz ni scroller (p. ej. otra fuente en caliente) recoloca la marca. Hallazgo menor cerrado; 1006 pruebas, build y compuertas bien.
