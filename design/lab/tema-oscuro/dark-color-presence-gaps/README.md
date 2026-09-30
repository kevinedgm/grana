# Dark Color Presence · Fase 4 · Huecos de evidencia

**Estado:** investigación. **No** modifica el Theme Engine, el contrato de tokens, `primary`, los semánticos ni ninguna regla. La decisión de `Dark Color Presence` sigue pendiente.

Cierra (o deja preparados) los huecos que `../dark-color-presence/recommendation.md` listaba antes de decidir. Reutiliza la misma tubería de la Fase 2 (`packages/cli/scripts/dark-color-presence.mjs <carpeta>`), el mismo playground (`../../theme-playground/`, con `?set=gaps`) y las mismas hipótesis A (actual), B (L ≥ 0.70) y C (ΔE ≥ 0.50).

## Los 5 temas

A diferencia de los 11 del benchmark, **estos temas usan dos propiedades adicionales a propósito** (`semanticCollision` y `neutralsHue`), porque cada uno prueba un hueco concreto.

| Tema | Configuración relevante | Hueco que cubre |
| --- | --- | --- |
| `gris-medio` | brand `#626975` (gris de luminosidad media), accent `#0E7490` (cian oscuro) | Un gris de luminosidad media **dentro de un tema completo** (la Fase 2 solo tuvo marcas casi negras o claras, que la derivación refleja) |
| `ocre-oliva` | brand `#7C6700`, accent `#B8740B` | Amarillo oscuro, oliva y ocre (las familias donde A falló en la Fase 1) en un tema completo |
| `colision-ajustada` | brand `#0F7A55`, accent `#C4321F`, **`semanticCollision: "adjust"`** | Semánticos **ajustados por colisión** (`success` pasa a `#9A9939` y `danger` a `#B9317C`): la regla no se había probado sobre un semántico derivado de otro tono |
| `tinte-acento-violeta` | brand `#F5B940`, accent `#5B3FE0`, **`neutralsHue: "accent"`** | Superficie oscura tintada con **otro tono** (violeta) distinto al de la marca |
| `tinte-acento-rojo` | brand `#0F766E`, accent `#E5483A`, **`neutralsHue: "accent"`** | Superficie tintada con un tono **cálido** opuesto al de la marca (verde azulado) |

Todos pasan `grana check`. La superficie oscura real sigue siendo L ≈ 0.226 a 0.228.

## Contenido

`themes/*.json` · `generated/` (CSS, `tokens.json` y variantes de cada tema) · `results.json` (30 muestras: 5 temas × 6 roles, con A/B/C y las superficies `low`, `medium` y `high`) · `visual.json` · `matrix.md` · `analysis.md`.

Reproducir: `node packages/cli/scripts/dark-color-presence.mjs design/lab/tema-oscuro/dark-color-presence-gaps` y abrir `design/lab/theme-playground/index.html?set=gaps&theme=gris-medio&scheme=dark&strategy=c`.

## Segunda persona evaluadora (hueco que requiere a una persona)

La clasificación visual sigue siendo de **una sola persona**. Se dejó preparada una **hoja de evaluación ciega** (`../../theme-playground/blind/`: 39 imágenes numeradas al azar sin indicar estrategia ni superficie, una plantilla CSV y `score-blind.mjs` para medir el acuerdo). **Falta que alguien la rellene.**
