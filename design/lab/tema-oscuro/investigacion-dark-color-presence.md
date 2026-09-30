# Investigación pendiente · Dark Color Presence

**Estado:** abierta; **fase de medición hecha** (sin cambios de código ni de reglas). **Dueño de la pregunta:** lima (reglas) · **Pruebas:** bruno (CLI) y coco (estética). **Abierta:** ver DECISIONS.md #96.

## Pregunta

En el tema oscuro, ¿basta el mínimo WCAG de 4.5:1 para derivar el `accent` y los semánticos (`success`, `warning`, `danger`, `info`), o hace falta una regla adicional que garantice que un color **se vea** (presencia visual), además de que se lea?

## Principio acordado

**4.5:1 es una restricción mínima de accesibilidad, no el objetivo estético de la derivación.** Un color puede cumplir contraste y aun así tener poca presencia visual sobre una superficie oscura.

## Qué hace hoy la derivación (no se modifica)

- `accent` y cada semántico, en oscuro: la base se conserva si L ≥ 0.5 o se refleja (1 − L); después sube L **solo hasta** 4.5:1 sobre la superficie oscura (`deriveDarkColor`, tokens.md §15). Los semánticos que no chocan con la marca ni se emiten: valen los del tema por defecto oscuro.

## Evidencia que originó la duda (un solo caso, insuficiente para cambiar la regla global)

Comparación del caso **Lustre** (oro `#F5B940` + violeta `#5B3FE0`) entre la derivación del CLI y los valores escritos a mano por el diseñador, en oscuro:

| Token | Derivado | Lustre (a mano) |
| --- | --- | --- |
| accent / violeta | `#7D72FF` | `#B2A4FF` |
| success / éxito | `#3F9560` | `#4ED3A0` |
| warning / alerta | `#AF792F` | `#F2B55A` |
| danger / peligro | `#E4523D` | `#FF8A80` |

Todos los derivados cumplen 4.5:1; los de Lustre son más luminosos y, a simple vista, con más presencia.

## Por qué no se cambia la regla ahora

Un único ejemplo no justifica modificar una regla global que afecta a todas las marcas. Hay que comprobar si el efecto aparece con **distintas familias cromáticas** y si una regla nueva no degrada otras (colores ya vivos, amarillos, azules saturados).

## Plan de la investigación

1. **Muestra:** marcas y acentos de familias variadas (rojos, naranjas, amarillos, verdes, verdes azulados, azules, violetas, magentas y grises), con croma bajo, medio y alto.
2. **Medir por token derivado** (oscuro): L y C en OKLCH, contraste WCAG contra `surface` y `bg`, y **luminosidad perceptual** (por ejemplo L OKLCH y el contraste APCA como segunda opinión, sin sustituir a WCAG).
3. **Definir presencia:** una métrica candidata, por ejemplo distancia OKLab a `surface` (ΔE) o `L` mínima por familia de tono, y un umbral.
4. **Probar reglas candidatas** (solo en una rama de pruebas): (a) subir L hasta un piso perceptual además de 4.5:1; (b) un piso de croma; (c) una combinación L y C con tope por tono (para no deslumbrar a amarillos y verdes).
5. **Revisión visual** en el playground con el tema oscuro: botones sólidos, insignias `soft`, texto de color, íconos, foco y bordes; y en `tokens.json` comparar con los valores de referencia.
6. **Criterio de decisión:** la regla adicional se adopta solo si mejora la presencia en la mayoría de las familias **sin** romper contraste, ni empeorar otras familias, ni cambiar los resultados del claro. Si no, se deja 4.5:1 como suelo y se documenta la opción de `overrides` / `dark: { accent, overrides }`.

## Fuera de alcance

Tema claro, colores de gráficas de datos (§17.14) y cualquier cambio del mínimo de 4.5:1.

## Resultado de la fase de medición

Herramienta: `packages/cli/scripts/dark-presence.mjs` (`node scripts/dark-presence.mjs [--simulate] [--json]`). **Solo mide**: deriva el oscuro con el CLI actual sobre 32 muestras (rueda de 12 tonos a L 0.52 y C 0.15, más 20 marcas reales de familias distintas) como `accent` y como `brand`, y mide contra la superficie oscura `#1C1C1C`: contraste WCAG, **APCA** (segunda opinión, informativa), L y C en OKLCH y distancia OKLab (ΔE) a la superficie.

### Hallazgos

1. **Todo lo derivado queda en el mínimo WCAG, sea cual sea el tono.** Con la regla actual (subir L solo hasta 4.5:1), los 12 tonos de la rueda y las marcas de luminosidad media terminan en **WCAG 4.5 a 4.7, L 0.60 a 0.64, ΔE 0.38 a 0.45 y |APCA Lc| 35 a 37**. Los 4 semánticos oscuros por defecto también (WCAG 4.5 a 4.6, |Lc| 35 a 36). No hay una familia de tono «peor»: el suelo de 4.5:1 iguala a todos.
2. **Lo que cambia la presencia es la luminosidad de partida, no el tono.** Los colores que ya eran claros (oro `#F5B940` y amarillo, L 0.82) se conservan y llegan a WCAG 9.7 y |Lc| 69; los muy oscuros (azul marino, casi negro) se **reflejan** (1 − L) y terminan en WCAG 7.5 a 8 y |Lc| 56 a 59. Los de luminosidad media, que son la mayoría de las marcas, quedan en el mínimo.
3. **La referencia hecha a mano (Lustre) está bastante por encima:** L 0.76 a 0.82, WCAG 7.6 a 9.8, |Lc| 56 a 69, ΔE 0.56 a 0.62. Es decir, el diseñador no se quedó en el mínimo en ninguno de los cuatro colores.
4. **Lectura de APCA (no normativo):** un |Lc| de 35 está por debajo de los 45 (texto grande) y 60 (texto de contenido) que APCA suele recomendar, y cerca de su mínimo para elementos no textuales. Es coherente con la duda original: 4.5:1 de WCAG 2 puede ser poco exigente en oscuro.

### Simulación de reglas candidatas (solo medición)

Subir L de la base oscura hasta un piso, con C = 0.15 fijo y gama sRGB:

| Piso de L | WCAG | \|Lc\| APCA | Croma conservado (media / mín.) | `on-*` (ink `#17151A`) |
| --- | --- | --- | --- | --- |
| 0.66 | 5.1 a 5.8 | 39 a 45 | 95 % / 76 % | ≥ 5.4:1 |
| 0.70 | 5.9 a 6.8 | 45 a 52 | 97 % / 81 % | ≥ 6.3:1 |
| 0.74 | 6.9 a 7.9 | 52 a 59 | 97 % / 85 % | ≥ 7.3:1 |

L mínimo para llegar a |Lc| 45: **0.66 a 0.70** según el tono; a |Lc| 60: **0.75 a 0.79**. Los tonos verdes azulados (150 a 210) necesitan menos L y los rojos y magentas (300 a 30) más.

Conclusiones de la simulación: (a) un piso de L de 0.66 a 0.74 **no rompe** `on-*` ni el contraste y conserva casi todo el croma en la mayoría de los tonos; (b) el piso necesario **depende ligeramente del tono** (0.66 en verdes azulados, 0.70 en rojos), así que un piso de L único es una aproximación y una regla basada en ΔE o APCA lo absorbería mejor; (c) el mayor coste es el croma en algunos tonos (mínimo 76 % a 0.66, en cian y azul).

### Lo que esta fase NO prueba

- Es una sola superficie oscura (`#1C1C1C`) y croma fijo 0.15 en la simulación.
- APCA es una segunda opinión **no normativa**; WCAG 2 sigue siendo el suelo del contrato.
- **No hay revisión visual ni con personas.** Las cifras sugieren menor presencia, pero «se ve apagado» es un juicio estético que falta comprobar en el playground.
- No se simuló el efecto sobre `strong` (hover), `soft`, `text` y `on-soft`, ni sobre los semánticos que sí se derivan.

### Decisiones abiertas (para el usuario y lima)

1. **Objetivo de presencia:** un piso de L (p. ej. 0.70), un ΔE mínimo a la superficie (p. ej. ≥ 0.50), o un APCA mínimo (p. ej. |Lc| ≥ 45). Recomendación provisional: un ΔE mínimo, que no depende de la norma APCA y cubre el tono.
2. **Alcance:** solo `accent` y `brand` derivados, o también los semánticos por defecto del oscuro (que son parte del tema de `coco`, `defaults.css`).
3. **Interacción con `strong`:** hoy `strong` oscuro sube L +0.06; con un piso más alto se acerca a 1 y habría que revisar su dirección.

### Siguientes pasos

1. Revisión visual en el playground con una rama de pruebas (piso de L 0.66, 0.70 y 0.74) en las 20 marcas y los 4 semánticos.
2. Decidir el objetivo y el alcance (arriba) y, si se adopta una regla, escribirla en `tokens.md` §15 y §16 con su prueba.
3. Si no se adopta, dejar 4.5:1 como suelo y documentar `dark: { accent, overrides }` como la salida para quien quiera más presencia.

## Resultado

**Medición hecha; decisión pendiente.** Ninguna regla de derivación cambió.
