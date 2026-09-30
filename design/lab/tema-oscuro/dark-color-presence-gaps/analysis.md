# Análisis · Fase 4 · Huecos de evidencia

Datos: `results.json` (30 muestras × A/B/C × 4 superficies), `visual.json` y `../../theme-playground/screenshots/gaps-sheet.png`.

**Muestra efectiva.** Los semánticos vuelven a ser los mismos 4 colores del tema por defecto en 4 de los 5 temas; en `colision-ajustada` **dos cambian** (`success` y `danger`). Colores nuevos e independientes de esta fase: `#626975`, `#0E7490`, `#7C6700`, `#B8740B`, `#0F7A55`, `#0F766E`, `#E5483A` (más `#C4321F`, que coincide con el `danger` por defecto) y los dos semánticos ajustados `#9A9939` y `#B9317C`: **unos 10 colores nuevos**, no 30 observaciones independientes.

## Hueco 1 · gris de luminosidad media (`gris-medio`)
- **Con A queda corto**, como en la Fase 1: el brand gris pasa a `#7F8693` (L 0.619, ΔE 0.393, apagado) y el acento cian a `#368FAC` (ΔE 0.394). Se ven como pizarra y verde azulado mate.
- **B** los lleva a L 0.70 y **C** a L 0.729 y 0.718 (ΔE 0.50): presencia suficiente, sin pasteles (el gris casi no tiene croma que perder).
- **A superficie alta C exagera el gris:** se vuelve plateado claro (clasificado `excessive`). Es el mismo patrón de C a superficie alta, y en un gris es más evidente porque no hay tono que se diluya, solo luminosidad.

## Hueco 2 · ocre y oliva (`ocre-oliva`)
- El brand oliva `#7C6700` queda como `#97822C` con A (ΔE 0.396): **fangoso, insuficiente**; el acento ocre `#B8740B` queda en `#BB7712` (ΔE 0.42): adecuado pero justo.
- B (`#B39E4A`) y C (`#B9A451`) dan un caqui/mostaza legible; ninguno produce pastel a superficie real.
- Confirma que **amarillos oscuros y olivas** son la zona donde A falla, en un tema completo y no solo en muestras aisladas.

## Hueco 3 · semánticos ajustados por colisión (`colision-ajustada`)
- Con `semanticCollision: "adjust"`, el CLI separa `success` del brand esmeralda (`#9A9939`, verde oliva amarillento) y `danger` del acento rojo (`#B9317C`, magenta).
- **Los semánticos ajustados se comportan bien con A:** `success` ajustado L 0.665, ΔE 0.454 y `danger` ajustado L 0.643, ΔE 0.46 (ambos `adequate`). Es decir, **la derivación oscura de un semántico ajustado es tan robusta como la de los por defecto**.
- B y C los aclaran sin efectos negativos a superficie real (`#A5A445` y `#A9A94A`; `#F065AC` y `#EC62A8`).
- `warning` sigue insuficiente con A (es el mismo de los 11 temas). El brand esmeralda `#37956F` se ve adecuado (ΔE 0.391, L 0.604, verde vivo).
- **No aparece ningún patrón nuevo:** el ajuste por colisión no cambia la conclusión.

## Hueco 4 · superficies tintadas con otro tono (`tinte-acento-*`)
- Las superficies reales son `#1B1C21` (azulada, tono del acento violeta) y `#1F1B1A` (cálida, tono del acento rojo), ambas L 0.226 a 0.228. **Los resultados de A, B y C son los mismos que con superficies tintadas por la marca** (diferencias ≤ 0.01 en L y ΔE).
- El tono de la superficie **no cambia** cuándo A queda corta ni cuándo C exagera: lo determina L de la superficie, no su tono. **Límite:** el tinte es de croma muy bajo (≤ 0.01 por la regla de los neutros teñidos); una superficie muy cromática no se probó.
- El acento violeta de `tinte-acento-violeta` repite el patrón de Lustre: B y C lo vuelven **pastel** (croma conservado 0.71).

## Resultados agregados (30 observaciones)

| | A | B | C |
| --- | --- | --- | --- |
| Superficie real · visual | 21 adecuadas, **9 insuficientes** | 29 adecuadas, 1 pastel | 29 adecuadas, 1 pastel |
| Superficie alta · visual | 16 adecuadas, **14 insuficientes** | 29 adecuadas, 1 pastel | **23 pastel**, 6 adecuadas, 1 excesiva |
| L media (low · medium · high) | 0.593 · 0.614 · 0.662 | 0.704 · 0.704 · 0.704 | 0.624 · 0.686 · 0.764 |
| ΔE medio (low · medium · high) | 0.481 · 0.440 · 0.412 | 0.587 · 0.523 · 0.451 | 0.512 · 0.508 · 0.504 |
| Croma conservado mínimo (high) | 0.80 | 0.71 | 0.55 |

Las 9 insuficientes con A en superficie real: los 5 `warning` (mismo color), el brand y el acento de `gris-medio`, el brand oliva y el brand verde azulado de `tinte-acento-rojo`.

## Qué cambia respecto a la Fase 2 y qué no

- **Confirma** los patrones de las Fases 1 y 2: A deja corto el ocre, el oliva, el gris de luminosidad media y el verde azulado apagado; B y C los corrigen con superficie real; C exagera con superficie alta (23 de 30 pastel) y B se mantiene estable (con ΔE cayendo a 0.451 en superficie alta).
- **No aparece** ningún caso que cambie la dirección provisional: los semánticos ajustados y las superficies tintadas con otro tono **no** añaden un problema.
- **Refuerza** el hallazgo del gris: C a superficie alta lleva un gris a plateado claro (`excessive`), el caso más visible de sobrecorrección por luminosidad pura.

## Limitaciones
- **Sigue siendo una sola persona la que clasifica.** Este hueco **no se cerró**: solo se preparó la evaluación ciega (`../../theme-playground/blind/`).
- La clasificación a **superficie alta** de esta fase se hizo sobre una hoja de contacto de baja resolución (`gaps-sheet.png`), y parte de ella sigue la misma regla que la Fase 2 (los roles con croma pasan a pastel en C); es la menos firme.
- Las superficies tintadas tienen croma muy bajo; no se probó una superficie oscura muy cromática.
- Se añadieron dos propiedades de configuración (`semanticCollision`, `neutralsHue`) a propósito; las conclusiones sobre esos temas no son comparables con los 11 del benchmark en ese aspecto.
