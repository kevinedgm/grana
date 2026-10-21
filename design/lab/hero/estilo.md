# GHero · estilo (coco)

**Dueño:** coco · **Contrato:** `design/contracts/hero.md` (#725 a #729, #742, #744, #745; `tokens.md` §29.6, §29.8, §51) · **Estructura:** `design/lab/hero/r01/` (kiwi)
**Entrega:** `packages/vue/src/components/GHero/GHero.css`, `--g-hero-title-max` en `packages/vue/src/styles/defaults.css`, banco `estilo-banco.html`, verificación `estilo-verificar.mjs`, temas de prueba del CLI en `estilo-temas/` (terracota, añil, pálida; también los usan los bancos de galería y consulta).

## Qué le da personalidad

- **A · La ventana es un lugar, no un rectángulo.** La foto se ve por el vano de arco de un portal (semicírculo arriba, radio de tarjeta abajo; con radios 0 del tema, la base queda recta y el arco sigue). El detalle es una segunda ventana que **muerde la esquina de inicio del vano** y asoma `space × 12` por fuera; entre las dos, el **muro**: un contorno `space × 2` del color de la página que sigue a la curva. Al pasar por delante, lo de dentro del vano se mueve un 3 % (**la mirada**, §29.8); el marco y el texto no se mueven.
- **B · La vista nueva se revela sobre la anterior.** La elegida llega encima (z 1) con un fundido `slow` + `ease-out`; la de antes se queda entera debajo hasta que la nueva la cubre y entonces se va (salto con retardo `slow`). El cambio nunca pasa por el vacío (medido: a mitad del fundido la anterior sigue a opacidad 1). Interrumpible.
- **C · El umbral:** la tarjeta cruza el borde de la foto con el título y la consulta antes de la acción.
- **La pausa no depende de la foto:** relleno `surface` + contorno de la tinta `text`; sea cual sea la foto, uno de los dos contrasta (peor caso = √(contraste text/surface), 4,06:1 con el tema por defecto). El foco lleva un halo de `surface` bajo el anillo.

## Medidas

| Pieza | Valor |
| --- | --- |
| Título | `clamp(title-lg, 7.5cqi, --g-hero-title-max)`, interlineado `1.08`, `balance`, familia y peso de `display` |
| `--g-hero-title-max` | `calc(var(--g-text-display-size) * 1.5625)` = display × typeScale² (61 px con el tema por defecto) |
| Margen | `clamp(space-4, 4cqi, space-12)` en los hijos (en la raíz, `cqi` sería de un contenedor de fuera) |
| A | Texto `flex-basis space × 88 + 2 × margen`, vano `space × 80 + 2 × margen` (tope `space × 130`); columna del vano ≤ `64svh` (alto ≤ 80svh: el arco no se aplana); 4:5; detalle = 40 % del vano |
| B | Foto 16:9, mín. `space × 56`, tope `64svh`; labio `min(space × 40, 12cqi)`; placa `min(100% − 2 × margen, space × 150)`, relleno `clamp(space-5, 4cqi, space × 10)`, radio `xl` |
| C | Foto 16:7, mín. `space × 60`, tope `68svh`; labio `min(space × 28, 16cqi)`; tarjeta `min(100% − 2 × margen, space × 220)`, relleno `clamp(space-5, 4cqi, space-12)`, `shadow-2` |
| Vistas | 44 px de alto, miniatura `space × 12` 4:3; elegida: borde doble de tinta + `text-action-weight` |
| Pausa | 44 × 44, píldora, `shadow-1`; A abajo al final del vano, B arriba al final, C sobre el labio |

## Verificación (`GRANA_PW_PORT=4241 node design/lab/hero/estilo-verificar.mjs`)

Resultado sobre el estado final: ver el informe de entrega (Chromium, Firefox y WebKit). Cubre: estático (sin color literal, sin respaldo, sin capa, tokens de §51, sin muelle ni rebote, literales de medida acotados, la regla del título); las tres apariencias a 1440, 390, 320 y 320×256 (zoom 400 %) en LTR y RTL (sin desplazamiento horizontal, título dentro de la regla, el texto nunca toca la foto, placa y tarjeta encima de la foto y sin tapar la mitad, 4:5, detalle 40 % mordiendo la esquina de inicio, muro, vano ≤ 80svh, acción sin desplazar a 390×844); contraste de eyebrow, título, bajo, dato y crédito ≥ 4,5:1 en el tema por defecto, terracota, añil, pálida, stripe, apple, spotify y lustre, claro y oscuro; la placa es la marca opaca; vistas (borde ≥ 3:1, nombre ≥ 4,5:1, anillo tras → con `data-g-key-focus`); el fundido sin vacío y su duración (y `fast` con reducido); H-L14 con «cielo», «noche» y «papel picado» en cuatro temas; la mirada (activa solo con marco, soporte y sin reducido; el marco quieto respecto al texto; la foto se mueve ≤ 6 % del alto; quieta sin marco, con `look=false`, reducido o vídeo); forced-colors (Chromium); A dentro de una zona; consola limpia.

## H-L14 (encargo de lima): resuelto

`border-strong` + `shadow-1` **no** llega a 3:1 sobre «cielo» (borde translúcido ~1,2:1 sobre casi blanco). Se aplica la alternativa del contrato: contorno de `--g-color-text`. Medido con los colores de «cielo», «noche» y «papel picado» en el tema por defecto, oscuro, terracota y añil: el peor caso de max(relleno, contorno) frente a la foto ≥ 3:1. Garantía general: √(text/surface); con un tema cuyo `text` sobre `surface` baje de 9:1 el mínimo podría quedar < 3:1 (ninguno de los once generados ni los tres de prueba).

## Encargos

**bruno (`GHero.vue`):**
1. **H-C1 · marco de la mirada** (pendiente de lima, abajo): en A, envolver la foto del vano en `span.g-hero__frame` (`<span class="g-hero__frame"><img class="g-hero__img" …></span>`). Sin él, el CSS pinta el arco en la propia `img` y la mirada queda quieta (nada se rompe, solo no hay mirada).
2. La pausa: icono `pause`/`play` + **texto oculto** `span.g-hero__motion-label` con `labels.pause` (nombre constante). **No pintar `labels.resume` visible**: un texto visible distinto del nombre rompe 2.5.3 (abajo, a lima).
3. B: los `img` de las vistas como elementos **estables** (con `key`): la elegida lleva `g-hero__img is-current` y su `alt`; las demás `g-hero__layer`. Cambiar de clase, no de nodo: si se crea un nodo nuevo, no hay transición (comprobado en el banco).
4. Vídeo del slot `media`: el CSS lo trata como la foto (`.g-hero__media > video`); en A, dentro del marco si existe.
5. Clases que emite: las de la tabla del contrato más `g-hero__views-legend` (el `legend`) y `g-hero__view-label` (el `span` del nombre de la vista), que el contrato no nombra.

**lima:**
- **H-C1:** añadir `span.g-hero__frame` a la anatomía de A (la regla §29.8.1 «solo dentro de un marco» no se puede cumplir con la `img` como marco: un recorte en la propia `img` viaja con el `transform`). Alternativa sin marcado: animar `object-view-box` (solo Chromium) o `clip-path` contra `transform` (dos hilos, riesgo de temblor); no recomendadas.
- **H-C2:** `labels.resume` como texto visible del botón contradice 2.5.3 con el nombre constante; propuesta: quitarlo del contrato o usarlo solo como `title`. Coco pinta solo el icono.
- **H-C3 · §51 consumidos:** el bajo usa `--g-text-title-sm-size/-line` (un bajo de 16 px bajo un título de 61 px salta demasiado); la pausa, `--g-press-scale` y `--g-ease-standard`; las vistas, `--g-text-action-weight` (el contrato dice «peso de acción»). Añadirlos a la lista de §51.
- **H-C4 · §29.6:** registrar como constantes de geometría de `GHero` las proporciones y topes de B y C (16:9 y 16:7; `64svh` y `68svh`; mínimos `space × 56` y `× 60`), el tope `64svh` de la columna del vano de A, el relleno `4cqi` de placa y tarjeta y el bajo de `space × 150`.

## No verificado

Zoom de solo texto al 200 % con el título fluido (H-L3); lector de pantalla real; LCP con fotos reales; un vídeo real (el banco usa `<video poster>` sin fuente); la mirada en Safari real (WebKit de Playwright: ver informe); `forced-colors` en Firefox y WebKit.
