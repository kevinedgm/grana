# GHero · auditoría de coco (paso 5)

**Dueño:** coco · **Fecha:** 2026-10-21 · **Sobre:** el componente real (`GHero.vue` de bruno, 3353d75; `dist/hero.umd.js`), banco `packages/vue/playground/hero.html` · **Contrato:** `design/contracts/hero.md` (#725 a #729, #742, #744, #745, #755, #756, #759) · **Estilo:** `estilo.md`, `GHero.css` (6945cda + esta auditoría)

**Verificación propia:** `node design/lab/hero/auditoria-verificar.mjs` (puerto `GRANA_PW_PORT`, 4244 por defecto; común en `auditoria-comun.mjs`, que también usan galería y consulta: Vue servido desde `node_modules`, tema inyectado en el `<head>` antes de montar). **1114/1114 en Chromium, Firefox y WebKit** sobre el estado final con `dist/` reconstruido. Además: specs de bruno `hero.spec.mjs` en verde en los tres motores (WebKit con un worker), banco de estilo `estilo-verificar.mjs` 811/811 (Chromium), compuertas 99/99, vitest de `GHero` y `GDatePicker` 127/127.

## Auditoría previa (qué se iba a mirar)

Estructura (contenido antes que la foto en el DOM; región con su `h1`), jerarquía (título fluido, bajada, acción), texto nunca sobre la foto (A en la página, B en placa opaca de zona, C en tarjeta), controles (vistas de B, pausa del vídeo), estados (carga con el marco hundido, vídeo en pausa y en marcha, vista elegida, foco), consistencia con tokens. Temas: por defecto, terracota, añil y pálida (CLI de coco) y stripe, apple, spotify y lustre (generados), claro y oscuro.

## Hallazgos

| # | Gravedad | Dueño | Hallazgo | Estado |
| --- | --- | --- | --- | --- |
| H-A1 | **Alta** | coco | En A, con el vídeo del slot `media` dentro de `span.g-hero__frame` (#755) el vano se estiraba a la altura intrínseca del `<video>` (2000 px a 1280×860): el arco salía del visor y el título quedaba fuera de la primera pantalla. Dos causas en `GHero.css`: el `<video>` dentro del marco no recibía `inline-size/block-size: 100%` ni `object-fit` (la regla era `.g-hero__media > video`, hijo directo) y el marco, caja con `aspect-ratio`, conservaba su mínimo automático de contenido (una foto vertical más alta que 4:5 lo estiraba igual). | **Corregido:** `.g-hero__frame > video` en las dos reglas de la media y `min-block-size: 0` en el vano. Medido: vídeo y foto 2:3 en 4:5 exacto, ≤ 80svh, título en la primera pantalla y pausa dentro del vano (1280 y 390, tres motores). Antes, visto en captura. |
| H-A2 | Baja | lima / mora-docs | En C con `consult`, el banco pone la acción del héroe («Reservar», `GBtn` sólido `lg`) debajo del envío de la consulta («Ver disponibilidad», sólido): dos acciones principales rellenas compiten en la misma tarjeta. | Pendiente: receta en el contrato o el README («en C con consulta, la acción del héroe es secundaria o no va»). No es del CSS. |
| H-A3 | Info | — | Pausa sobre «cielo», «noche» y «papel picado»: peor caso por píxeles **4,34:1** (Chromium) y 5,97:1 (Firefox, WebKit) en A, B y C con cuatro temas, claro y oscuro; mínimo exigido 3:1. El anillo de foco va sobre el halo `surface` (17,4:1), nunca sobre la foto. | Cumple. |

## Auditoría posterior

- **Jerarquía y estructura:** título `clamp(title-lg, 7.5cqi, tope)` en los tres motores; nada flota (A: texto y vano partidos por mínimo intrínseco; B y C: placa y tarjeta muerden la foto sin pasar de la mitad).
- **Contraste** (ocho temas × claro/oscuro × tres apariencias en Chromium; tres temas en Firefox y WebKit): eyebrow, título, bajada, dato, crédito, legend y nombre de vista ≥ 4,5:1 (mínimo 5,68:1); borde de la vista ≥ 3:1 (mínimo 5,68:1).
- **Estados:** vista elegida por forma (borde doble y peso), foco visible tras Tab + → (WebKit con Opción+Tab y `data-g-key-focus`) y ≥ 3:1 contra la placa en tres temas, claro y oscuro; pausa 44 × 44 con foco ≥ 3:1.
- **Anchos:** 1440, 390, 320 y 320×256 (zoom 400 %), LTR y RTL: sin desplazamiento horizontal; vano 4:5 ≤ 80svh.
- **Puntero grueso:** vistas y pausa ≥ 44 px.
- **forced-colors** (Chromium): placa y tarjeta con borde `CanvasText`, vista elegida en `Highlight` (resuelto con el `color-scheme` de la zona), pausa `ButtonText`.
- **Sin literales:** `GHero.css` sin color literal, sin respaldos, sin `@layer`, colores de sistema solo en `forced-colors`; `GHero.vue` sin `<style>`.

## Rúbrica de movimiento (`docs/documentacion/rubrica-movimiento.md`)

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| A · Propósito | Cumple | El fundido de B dice «esta es la vista elegida»; la mirada de A da profundidad al vano, el marco y el texto quietos; la pausa responde al apretar. | Bajo | — |
| B · Comodidad visual | Cumple | La mirada recorre ≤ 3 % (medido ≤ 6 % del alto con la escala que la cubre), lineal; sin señales de profundidad contradictorias. | Bajo | — |
| C · Estabilidad | Cumple | Marco y texto se desplazan juntos (Δ < 1 px); solo la foto se mueve dentro; sin oscilación propia (ligado al desplazamiento). | Bajo | — |
| D · Transiciones | Cumple | B sin vacío: a mitad la anterior sigue a opacidad 1; elegir otra a mitad termina con una sola vista entera; `slow` (reducido `fast`). | Bajo | — |
| E · Control | Cumple | Nada cambia solo (2.2.2): el vídeo tiene pausa visible y arranca en pausa con reducido; las vistas las elige la persona. | Bajo | — |
| F · Accesibilidad | Cumple | Reducido: mirada quieta, fundido `fast`, la pausa sin escala; `look=false` y vídeo la apagan. | Bajo | — |
| G · Rendimiento | Parcial | Solo `transform`/`opacity` y `animation-timeline: view()` sin JS. | Bajo | LCP con fotos reales sin medir. |
| H · Inmersión | N/A | — | — | — |

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** contraste del texto y de la pausa (H-L14 confirmado por píxeles en el componente real); vano, detalle y muro; placa y tarjeta opacas; fundido sin vacío e interrumpible; mirada solo con soporte, sin reducido, con marco y sin vídeo; foco visible en los tres motores; 44 px con puntero grueso; RTL; 320×256; forced-colors.

**Correcciones (coco, `GHero.css`):** H-A1 (vídeo y foto vertical en el vano de A).

**Pendientes:** H-A2 (lima o mora-docs). **No verificado:** zoom de solo texto al 200 % con el título fluido; lector de pantalla real; LCP con fotos reales; un vídeo real con fuente (el banco usa `poster` sin fuente); la mirada en Safari real; `forced-colors` en Firefox y WebKit (Playwright solo lo emula en Chromium).

**Veredicto:** sin defectos bloqueantes. `GHero` puede pasar a `"status": "candidate"` (el cambio de `GHero.meta.json` es de bruno).
