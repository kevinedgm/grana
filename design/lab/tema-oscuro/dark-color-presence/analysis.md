# Análisis · Dark Color Presence · Fase 2

Datos: `results.json` (66 muestras × A/B/C × 4 superficies), `visual.json`, `matrix.md` y `screenshots/`. Fase 1 (31 muestras × 9 familias) en `../investigacion-dark-color-presence.md`.

## Criterio de la clasificación visual

Cuatro clases, por **un único criterio**: «dentro del componente real (botón sólido, insignia suave, texto de color, campo, interruptor), ¿el color se distingue claramente de la superficie y conserva el carácter del tono sin dominar?».

| Clase | Qué significa |
| --- | --- |
| `insufficient` | Pierde presencia: se ve apagado o sucio (ocre, oliva, verde mate) |
| `adequate` | Presencia suficiente sin dominar |
| `excessive` | Demasiado luminoso, saturado o dominante (ya lo era el color de entrada) |
| `pastel` | La hipótesis lo aclara hasta perder el carácter del tono (lavanda, celeste, rosa): cuesta croma |

**Es un juicio del asistente** sobre capturas a escala 0.8 (una sola persona, una sola pantalla). Se guarda en `visual.json`, separado de las métricas. `excessive` se reserva a colores que **ya entran** muy luminosos (la regla no los cambia); `pastel` es el efecto de subir L.

## Muestra efectiva (importante)

Los cuatro colores semánticos (`success`, `warning`, `danger`, `info`) son **idénticos en los 11 temas** (ninguno de los 11 temas los ajusta con `semanticCollision: "warn"`). Por eso **las 66 observaciones no son 66 colores independientes**. La muestra efectiva es:

- **22 combinaciones `brand`/`accent`** (11 temas × 2), y
- **4 colores semánticos únicos**,

evaluados dentro de **11 contextos de tema** distintos (superficie tintada, tipografía, formas). Los contextos siguen siendo útiles visualmente (el mismo color se ve con otra superficie y otros vecinos), pero **estadísticamente no deben contarse como colores independientes**. Los recuentos por clase de este documento (por ejemplo, «12 de 66 insuficientes») describen observaciones, no colores: 11 de esas 12 son **el mismo color** (`warning`) en 11 contextos, y la 12.ª es el acento verde de Medium. Del mismo modo, los 44 semánticos adecuados o insuficientes son 4 colores repetidos.

## 1. Validación de los 11 temas (`grana check`)

Los 11 pasan sin errores. 9 tienen 2 avisos de `semantic-close` (Amazon y Spotify, ninguno). Colisiones por tema:

| Tema | Colisión |
| --- | --- |
| Notion, Apple, GitHub, Lustre | `info` ↔ acento (azul frente a azul, o violeta) |
| Medium | `success` ↔ acento (verde frente a verde) |
| Caracol Púrpura | `danger` ↔ acento (rosa) |
| Grana | `danger` ↔ marca (carmín) |
| Linear, Stripe | `info` ↔ marca (índigo, violeta) |
| Amazon, Spotify | ninguna |

Con `semanticCollision: "warn"` (por defecto) ningún semántico cambia: los 4 semánticos son **idénticos en los 11 temas** (`#3F9560`, `#AF792F`, `#E4523D`, `#3383F0` en oscuro). El «66 muestras» equivale a **22 muestras de tema** (brand y accent) **+ 4 semánticos únicos**.

## 2. Resultados, superficie real (L ≈ 0.226)

| | A · actual | B · piso L 0.70 | C · ΔE ≥ 0.50 |
| --- | --- | --- | --- |
| L oscuro (media · mín. a máx.) | 0.641 · 0.601 a 0.901 | 0.709 · 0.699 a 0.901 | 0.716 · 0.693 a 0.901 |
| ΔE a la superficie (media · desv. · mín.) | 0.441 · 0.053 · 0.392 | 0.503 · 0.031 · 0.473 | 0.510 · 0.028 · 0.500 |
| Croma conservado (mínimo) | 0.87 | 0.68 | 0.66 |
| Visual `adequate` | 52 | 60 | 60 |
| Visual `insufficient` | **12** | 0 | 0 |
| Visual `pastel` | 0 | 4 | 4 |
| Visual `excessive` | 2 | 2 | 2 |

**Por grupo de rol** (visual): brand y accent (22): A 19 adecuadas, 1 insuficiente, 2 excesivas; B y C 16 adecuadas, 4 pastel, 2 excesivas. Semánticos (44): A 33 adecuadas y **11 insuficientes** (todas `warning`); B y C 44 adecuadas.

**Por rol**: `warning` es insuficiente con A en **11 de 11 temas**; `brand`, `accent`, `success`, `danger` e `info` no lo son (salvo el acento verde de Medium). El efecto pastel de B y C aparece **solo en brand y accent** (Apple accent, Stripe brand, Lustre accent, Caracol brand), nunca en semánticos.

### Qué separa `insufficient` de `adequate` con A

| Clase (A) | ΔE | L | WCAG | ΔL |
| --- | --- | --- | --- | --- |
| insufficient (12) | 0.404 a 0.413 | 0.601 a 0.618 | 4.53 a 4.64 | 0.375 a 0.392 |
| adequate (52) | 0.392 a 0.610 | 0.603 a 0.821 | 4.51 a 9.64 | 0.375 a 0.594 |

**No hay separación nítida por ninguna métrica.** Los 12 insuficientes están en la franja ΔE 0.40 a 0.41 y L 0.60 a 0.62, pero `success` (#3F9560) está en ΔE 0.392 a 0.398 y L 0.603 y se ve adecuado. El ocre de `warning` (tono 71°) se ve más apagado que el verde de `success` (tono 154°) **a la misma L y ΔE**: el tono importa, y ni L ni ΔE lo capturan. Por eso B (0.70) y C (0.50) no «discriminan» el caso malo: **lo arreglan subiendo todo por encima de la zona ambigua** (0.39 a 0.42).

## 3. Superficie oscura: dónde se rompe cada hipótesis

Cifras de las 66 muestras (`results.json` → `surfaces`).

| Superficie | A: L · ΔE (media) | B: L · ΔE (media · mín.) | C: L · ΔE (media · mín.) | C: croma conservado mín. |
| --- | --- | --- | --- | --- |
| `low` (L 0.135) | 0.610 · 0.499 | 0.709 · **0.592** · 0.565 | 0.636 · 0.524 · 0.500 | 0.94 |
| `medium` (0.20) | 0.630 · 0.456 | 0.709 · 0.528 · 0.499 | 0.691 · 0.513 · 0.500 | 0.74 |
| real (0.226) | 0.641 · 0.441 | 0.709 · 0.503 · 0.473 | 0.716 · 0.510 · 0.500 | 0.66 |
| `high` (0.275) | 0.672 · 0.423 | 0.709 · **0.456** · 0.422 | **0.767** · 0.506 · 0.500 | **0.52** |

- **B no se adapta:** el L es constante (0.709), así que la distancia a la superficie varía de 0.592 (sobra) a 0.456 (se queda corta, con mínimo 0.422 de ΔE).
- **C se adapta en distancia** (ΔE ≥ 0.50 en todas) pero **sube L hasta 0.767 de media (mínimo 0.75) sobre la superficie alta**, y el croma conservado llega a 0.52: los colores se vuelven pasteles.
- **A mejora sola con superficies más oscuras** (a `low`, ΔE medio 0.499): ahí no hace falta nada.

Revisión visual (Stripe y Grana, 12 muestras por celda):

| Superficie | A | B | C |
| --- | --- | --- | --- |
| `low` | 12 adecuadas | 11 adecuadas, 1 pastel (Stripe brand) | 12 adecuadas (igual a A) |
| `high` | 8 adecuadas, **4 insuficientes** (`success` y `warning`) | 11 adecuadas, 1 pastel | **10 pastel**, 2 adecuadas |

**En superficie alta, C es la hipótesis que más cambia el aspecto**: los botones de brand, accent, danger e info se ven pálidos (salmón, lavanda, celeste). B queda casi igual que en la superficie real. A deja corto a `success` y `warning`.

> La revisión visual de B a `high` fue sobre la página completa (cada rol no se inspeccionó por separado); su ΔE mínimo es 0.422 (cerca de la zona ambigua). **Ese resultado es el menos firme.**

## 4. Patrones y anomalías

1. **Los semánticos no varían entre temas**, así que no prueban «distintas familias cromáticas»: prueban 4 colores. Lo que varía entre temas es brand y accent.
2. **`warning` es el único semántico que A deja insuficiente**, en todos los temas (11/11), con ΔE 0.404 a 0.410, L 0.618. B y C lo corrigen en 11/11 sin efectos secundarios.
3. **El «pastel» viene de la gamut, no del L por sí solo:** aparece cuando subir L a 0.70 obliga a recortar croma en tonos azules y violetas saturados (Stripe brand: croma conservado 0.68; Apple accent: 0.73; Lustre accent: 0.71), o cuando el tono cambia de carácter al aclararse (Caracol brand: de mauve a rosa).
4. **Las marcas casi negras y los neutros oscuros se reflejan** (Notion, Apple, Medium, GitHub, Amazon): su marca oscura sube a L 0.68 a 0.77 por el espejo de la derivación, así que A ya les da presencia y B/C casi no los tocan. **No se probó un gris de luminosidad media** en esta fase (la Fase 1 sí: `gris-oscura` y `gris-media` eran insuficientes con A).
5. **Spotify:** el neón `#1ED760` y la menta `#A7F3C1` **ya son demasiado luminosos con A** (ΔE 0.58 y 0.68, WCAG 8.9 y 13.2); B y C no los cambian. Es evidencia de que **una regla de «presencia mínima» no debe aclarar lo que ya es excesivo**, y de que hay una necesidad distinta (un límite superior) que ninguna hipótesis cubre.
6. **Linear:** brand y accent casi idénticos en oscuro (`#6F7DE6` y `#8A7CFF`); B y C los acercan más (`#8393FF` y `#958CFF`). Es una colisión brand/accent, no de presencia.
7. **Grana:** `danger` y brand son casi el mismo coral en oscuro con A (`#E4523D` y `#DE5869`); con B y C se separan algo menos (`#FC6852` y `#F46C7B`). Es la colisión conocida (`semantic-close`).
8. **Los 11 temas comparten la misma superficie real** (L 0.225 a 0.228): la variación de superficie solo existiría si una aplicación sobrescribe `--g-color-surface`.

## 5. Las tres hipótesis

### A · solo contraste ≥ 4.5:1
- **Mejora:** nada. Conserva el carácter de los tonos saturados y no sobrecorrige.
- **Empeora:** nada.
- **Sobrecorrige:** nunca.
- **Falla en:** `warning` (11/11 temas), el acento verde de Medium, y (Fase 1) amarillo, naranja oscuro, cian y gris de luminosidad media. A 4.5:1 el ocre queda apagado; con superficies altas también `success`.
- **Estabilidad:** la menos estable en presencia (ΔE 0.39 a 0.68; desv. 0.053).

### B · piso de L ≥ 0.70
- **Mejora:** los 12 insuficientes (11 `warning` y el verde de Medium) y es simple y predecible en L.
- **Empeora:** 4 muestras pasan a pastel (Stripe brand, Apple accent, Lustre accent, Caracol brand).
- **Sobrecorrige:** con superficies bajas (ΔE medio 0.592 a `low`: aclara más de lo necesario) y, en Fase 1, por encima de 0.72 (0.74 es pastel en 7 de 9 familias).
- **Falla en:** no se adapta a la superficie (ΔE 0.456 a `high`, mínimo 0.422).
- **Estabilidad:** constante en L, **no** en distancia perceptual.

### C · ΔE ≥ 0.50
- **Mejora:** los mismos 12 casos, con la distancia casi constante (desv. 0.028 a superficie real; ΔE mínimo 0.500 en todas).
- **Empeora:** los mismos 4 pastel.
- **Sobrecorrige:** **sobre superficies más claras**: a `high` sube L a 0.767 de media, el croma conservado cae a 0.52 y 10 de 12 muestras revisadas se ven pastel.
- **Falla en:** la superficie alta (necesitaría una segunda restricción) y en no distinguir el tono (mismo problema que B).
- **Estabilidad:** la mejor en ΔE, pero inestable en aspecto cuando crece la superficie.

### ¿Necesita C una segunda restricción?
**Sí, si la regla ha de funcionar con superficies distintas de la real.** Con la superficie real (L 0.226) B y C dan resultados casi idénticos (60/66 adecuadas, 4 pastel). Con superficie alta, C sobrecorrige y necesita un límite de presencia (por ejemplo, un tope de L o un mínimo de croma conservado). **No se ha implementado ni definido ningún valor.**

## 6. Respuestas a las 10 preguntas

1. **¿4.5:1 produce suficiente presencia en oscuro?** **No siempre.** 54/66 muestras son adecuadas y 12 (18 %) insuficientes (11 `warning` y 1 acento verde); la Fase 1 sumó amarillos, naranjas oscuros, cian y grises de luminosidad media (7 de 27).
2. **¿Un piso de L funciona entre hues?** Corrige todos los insuficientes, pero **no de forma uniforme**: pastel en azules y violetas saturados (croma conservado 0.68 a 0.73) y poco efecto sobre colores ya claros. La L necesaria varía con el tono (Fase 1: 0.66 a 0.70 para APCA 45).
3. **¿La distancia perceptual funciona mejor?** En distancia sí (desv. 0.028 frente a 0.031 de B a superficie real y ΔE ≥ 0.50 en todas las superficies), pero **solo se ve mejor que B con superficies bajas**; con la alta es peor (pastel).
4. **¿Qué umbral separa insufficient de adequate?** **Ninguno separa nítidamente:** hay solape entre ΔE 0.39 y 0.42 (el verde se ve bien y el ocre mal a igual L y ΔE). B=0.70 y C=0.50 quedan por encima de la zona ambigua, pero arreglan **subiendo todo**, no discriminando.
5. **¿Funciona con croma bajo?** Con marcas neutras (Notion, Apple, Medium, GitHub, Amazon) A ya da presencia (reflejo a L 0.68 a 0.77) y B/C casi no cambian nada. Fase 1: un gris de luminosidad media es insuficiente con A y B/C lo corrigen. **Falta probar un gris de luminosidad media dentro de un tema completo.**
6. **¿`danger` necesita tratamiento especial?** **No:** es adecuado con A, B y C en los 11 temas; solo se ve pálido con C a superficie alta, igual que brand y accent.
7. **¿`warning` necesita tratamiento especial?** **No con estas pruebas:** es el que más falla con A (11/11) y B y C lo arreglan sin efectos. El tono (ocre) pesa, pero la misma regla general lo resuelve: no justifica una excepción.
8. **¿Brand y accent pueden usar la misma regla que los semánticos?** Sí, provisionalmente: las dos hipótesis se comportan igual en ambos grupos. La diferencia es el **riesgo de pastel, que solo afecta a brand y accent saturados** (4/22), no a semánticos (0/44).
9. **¿Sobrecorrección en amarillos o verdes?** **No a L 0.70 ni a ΔE 0.50 con superficie real:** `success` (#5EB47C / #62B880) y `warning` (#CA924A / #CF9850) siguen siendo verde y ocre. Sí a 0.74 o 0.55 (Fase 1) y con C a superficie alta.
10. **¿Qué hipótesis es más estable entre los 11 temas?** **A superficie real: B y C empatan** (60/66 adecuadas cada una, 4 pastel). **Entre superficies: ninguna es estable**; B falla por no adaptarse y C por sobrecorregir.

## 7. Limitaciones

- Una sola persona evaluó el aspecto visual, sobre capturas; nunca con usuarios ni con pantallas distintas.
- Solo dos temas (`stripe`, `grana`) se revisaron a ojo con superficies experimentales; los demás tienen cifras.
- Las muestras semánticas son 4 únicas; los roles `success`, `warning`, `danger` e `info` no se probaron con otras entradas.
- Los umbrales (0.70 y 0.50) son experimentales y las variantes B y C solo cambian la base oscura de los 6 roles (el resto de la paleta se mantiene).
- Hover y active se representan con los tokens `strong`; el foco, con el anillo del token de foco: no se forzaron estados `:hover` reales ni se probó con teclado.
- Las fuentes de los temas no se cargaron (solo Instrument Sans).
- Falta un gris de luminosidad media, colores amarillos y cian en temas completos y superficies oscuras tintadas de otro tono.
