# Recomendación · Dark Color Presence

**Estado:** propuesta para revisión. **No** modifica el contrato de tokens, el Theme Engine, `primary`, la regla de niveles ni los semánticos. Se apoya en la Fase 1 (31 muestras × 9 familias) y en la Fase 2 (11 temas, componentes reales, 4 superficies). Detalle en `analysis.md`.

## Estado de la decisión

| Hipótesis | Estado |
| --- | --- |
| **A** · solo WCAG 4.5:1 | **Descartada como candidata preferida** (12 de 66 observaciones insuficientes; ver la muestra efectiva en `analysis.md`) |
| **B** · L ≥ 0.70 | **Válida como baseline simple**, pero no se adapta a cambios de `surface` |
| **C** · ΔE ≥ 0.50 | **Conceptualmente más adaptable, pero incompleta:** sobre superficies más claras puede elevar demasiado L, reducir croma y producir colores pastel |
| **Regla definitiva** | **Pendiente.** Ninguna de las tres se adopta como regla de producción |

## Conclusión que se conserva

La evidencia de las Fases 1 y 2 indica que `Dark Color Presence` **no puede resolverse de forma suficientemente robusta utilizando únicamente** (a) contraste WCAG, (b) un piso absoluto de Lightness o (c) una distancia perceptual mínima respecto a `surface`.

La dirección que debe investigarse es una **restricción compuesta**:

> **contraste mínimo + presencia perceptual + límite superior de transformación**

**Esto es una hipótesis, no una especificación.** No se definen `max L`, `max ΔE`, reducción obligatoria de croma ni fórmulas por tono.

**Muestra efectiva:** 22 combinaciones `brand`/`accent` y 4 colores semánticos únicos, evaluados en 11 contextos de tema (los 66 no son 66 colores independientes).

## Conclusión corta

1. **A (solo 4.5:1) queda descartada como regla preferida:** deja 12 de 66 muestras visualmente insuficientes (18 %; en la Fase 1, 7 de 27). Lo que falla de forma consistente es el **ocre de `warning` (11 de 11 temas)** y los colores de croma bajo y luminosidad media.
2. **B y C empatan con la superficie real** (60/66 adecuadas cada una, 4 pastel, 0 insuficientes). **No hay evidencia suficiente para elegir entre ellas con los datos actuales.**
3. **Ninguna, tal como está definida, sirve si la superficie cambia:** B no se adapta (ΔE 0.59 a superficie baja, 0.46 a alta) y C sobrecorrige sobre superficies claras (L 0.77, croma conservado 0.52, 10 de 12 muestras pastel).
4. **No hay motivo para tratar `danger` ni `warning` de forma especial.** Ambos se resuelven con la regla general.

## Dirección recomendada (a validar, no a adoptar)

Una regla de **tres condiciones**, en el orden conceptual del propio experimento:

> **contraste mínimo** (WCAG 4.5:1) **+ distancia perceptual mínima a `surface`** (la idea de C) **+ límite de presencia** (un freno para no aclarar de más)

- **Por qué la distancia (C) y no un piso de L (B):** se adapta a la superficie (la ΔE mínima se conserva en las 4 superficies) y no impone un L absoluto a todas las familias (un mismo L da menos distancia en un gris que en un rojo).
- **Por qué hace falta el límite de presencia:** C sube L hasta 0.77 sobre superficie alta y el croma conservado cae a 0.52 (pastel). Además, Spotify muestra que hay colores que **ya entran demasiado luminosos** y que una regla «solo hacia arriba» no ayuda. El límite podría ser un **tope de L** o un **mínimo de croma conservado** (p. ej. no aclarar un color si con ello pierde más de una cuarta parte de su croma). **No se ha definido ni probado ningún valor.**
- **Qué no resuelve:** el tono. El ocre se ve más apagado que el verde a igual L y ΔE; una regla de L o de ΔE lo corrige **subiendo todo**, no discriminando. Si se quiere discriminar por tono, haría falta otra métrica (por ejemplo, una luminosidad perceptual que dependa del tono), que queda fuera de esta investigación.

### Si solo se quiere una regla simple ahora
**B (L ≥ 0.70)** da el mismo resultado que C con la superficie real (la de los 11 temas, L ≈ 0.226) y es más fácil de explicar y de probar. Su coste es que no se adapta a una superficie sobrescrita por el usuario. La decisión depende de si se quiere **garantizar la presencia también con `--g-color-surface` personalizada**: si sí, C con límite; si no, B.

## Qué se necesita decidir

1. **¿La regla debe adaptarse a superficies distintas de la real?** (Es la decisión que separa B de C.)
2. **Si es que sí:** qué forma tiene el **límite de presencia** (tope de L, mínimo de croma conservado u otro) y su valor.
3. **Alcance:** solo `brand` y `accent` derivados, o también los semánticos (hoy son los del tema por defecto oscuro, que son de coco, en `defaults.css`).
4. **Umbrales:** los valores 0.70 y 0.50 **no deben adoptarse tal cual**: están cerca del borde del pastel (0.74 y 0.55 sobrecorrigen). Si se elige una regla, conviene fijarla con margen.

## Lo que falta antes de decidir

> **Actualización (Fase 4, `../dark-color-presence-gaps/`):** el gris de luminosidad media dentro de un tema completo (1), el semántico ajustado por colisión (5) y las superficies tintadas con otro tono (nuevo) **ya se probaron** y **no cambian** la dirección. Siguen pendientes la segunda persona evaluadora (hoja ciega preparada en `../../theme-playground/blind/`), los estados reales (resueltos en el playground de la Fase 3) y la revisión por rol de más temas a superficie alta.

1. Un **gris de luminosidad media** (y otros colores de croma bajo: amarillos, cian) dentro de un tema completo: la Fase 2 solo tuvo marcas neutras muy oscuras o muy claras, que la derivación refleja.
2. **Revisión visual por rol** de las superficies experimentales en más temas (solo `stripe` y `grana` se revisaron a ojo; B a superficie alta es el resultado menos firme).
3. **Una segunda persona** (o pantalla distinta) que repita la clasificación visual; hoy es un solo evaluador.
4. **Estados reales** (`:hover`, `:active`, foco con teclado) en los componentes.
5. **Un semántico ajustado por colisión** (`semanticCollision: "adjust"`): en estos 11 temas ningún semántico cambia, así que la regla no se probó sobre un semántico derivado de otro tono.
6. Decidir si el **tono** merece una corrección propia.

## Lo que NO se recomienda

- Adoptar 0.70 o 0.50 como valores definitivos, o cualquier «tope» sin probarlo.
- Crear excepciones para `danger` o `warning`.
- Cambiar el mínimo de 4.5:1 (sigue siendo el suelo de accesibilidad).
- Tocar el contrato, el Theme Engine, `primary` o la regla de niveles hasta decidir.

## Pendientes abiertos por separado (no dependen de esta decisión)

- `primary` como clave propia de configuración.
- Regla automática «sin saltar niveles».
- Pruebas manuales en Firefox, Safari y con lector de pantalla.
