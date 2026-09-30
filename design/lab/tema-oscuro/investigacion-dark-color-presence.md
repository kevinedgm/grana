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

### Revisión visual (paso 1 del plan, hecha)

Herramienta: `packages/cli/scripts/dark-presence-variants.mjs` y `dark-presence-compare.html` (se generan el CSS actual y tres variantes con un piso de L de 0.66, 0.70 y 0.74 en la base oscura de `brand`, `accent` y los cuatro semánticos, **sin tocar la derivación del CLI**). Se compararon cuatro columnas en el playground, tema oscuro, con tres marcas: **carmesí** (`#9D1635` / `#D85A70`), **Lustre** (oro / violeta) y **azul marino** (`#0B1F4D` / `#6D28D9`). Revisión de una sola persona (la del asistente) sobre capturas del playground, **no** una prueba con usuarios.

- **Piso 0.66:** casi indistinguible de la regla actual (la base actual ya queda en L 0.60 a 0.64). Es la menor diferencia y la menor presencia ganada.
- **Piso 0.70:** botones, enlaces e insignias se ven más claros y más «presentes»; el coral de la marca carmesí sigue leyéndose como rojo.
- **Piso 0.74:** la presencia sube, pero con **coste de identidad**: el coral de la marca carmesí tira a **rosa salmón**, y **`danger` se vuelve un salmón pastel** (pierde la urgencia: el peligro se reconoce por saturación y por oscuridad relativa, no solo por contraste). Con marino y Lustre la marca no cambia (ya estaba clara), pero `danger` sí.
- **El piso solo afecta a los colores de luminosidad media**: el oro y el azul marino reflejado no cambian con ningún piso; los que cambian son `accent`, los rojos y los semánticos.
- **Hallazgo de método:** la primera versión de la variante subía también las bases que la reflexión ya había subido (azul marino) y las **bajaba**; se corrigió para subir solo lo que queda por debajo del piso. Un piso mal definido puede empeorar colores que ya estaban bien.

**Lectura provisional (no es una decisión; corregida por la ampliación de abajo):** a 0.66 casi no cambia nada, a 0.74 cuesta identidad y urgencia en rojos y semánticos, y el punto intermedio es ≈ 0.70. **La sospecha inicial de que `danger` y `warning` necesitaban una regla propia no se confirma con 9 familias:** el efecto pastel a 0.74 aparece por igual en todas las familias cromáticas.

## Ampliación: 9 familias y tres hipótesis (evidencia; sin adoptar ninguna regla)

**Alcance pedido:** comparar tres hipótesis sobre la derivación oscura actual **sin cambiarla**, con rojo, naranja, amarillo, verde, cian, azul, violeta, magenta y gris, y con los roles `brand`, `accent`, `success`, `warning`, `danger` e `info`.

- **A.** Solo contraste ≥ 4.5:1 (la regla actual, `deriveDarkColor`).
- **B.** Piso de luminosidad perceptual: la base oscura sube hasta **L ≥ 0.70**.
- **C.** Distancia perceptual mínima a la superficie: **ΔE (OKLab) ≥ 0.50**, sin imponer un L absoluto.

**Herramientas y datos** (todo en `design/lab/tema-oscuro/dark-presence/`, generado por `packages/cli/scripts/dark-presence-matrix.mjs <carpeta>`; ninguna toca el Theme Engine):

| Archivo | Contenido |
| --- | --- |
| `muestras.json` | 31 muestras (27 de familia + los 4 semánticos por defecto) con, para A, B y C: HEX oscuro, OKLCH (L, C, h), contraste WCAG contra `surface`, |APCA|, ΔL y ΔE respecto a `surface`, croma conservado, desvío de tono, contraste del texto `on`, `visual` y `proxy` |
| `matriz.md` | La misma tabla legible, con el HEX y el OKLCH claros originales, y la tabla de sensibilidad |
| `hojas.html` | Hoja visual A / B / C (botón sólido, chip suave, texto de color y botón de línea, sobre `#1C1C1C`) |
| `sensibilidad.html` | La misma hoja con B·0.66, B·0.74, C·0.45 y C·0.55 (dónde empieza a sobrecorregir) |

**Muestras.** Por familia, 3 colores claros de partida (L 0.40 oscuro, 0.52 medio, 0.68 claro; tono OKLCH: rojo 27, naranja 55, amarillo 95, verde 145, cian 200, azul 255, violeta 290, magenta 335 y gris 260 con croma 0.02; croma 0.11 a 0.17). Se añaden los semánticos por defecto (`success`, `warning`, `danger`, `info`). Hay que tener presente que **la derivación no depende del rol**: `brand`, `accent` y los semánticos pasan por la misma función (`deriveDarkColor`), así que cada muestra vale para todos los roles que se anotan en su fila; lo que cambia por rol es solo cuánto exige la lectura visual.

**Resultado visual.** Criterio único: «¿el botón sólido y el texto de color se distinguen claramente de la superficie y conservan el carácter del tono?». *Insuficiente* = se ve apagado o sucio (oliva, marrón, pizarra). *Excesivo* = se vuelve pastel o casi blanco. **Es un juicio del asistente sobre las hojas** (una sola persona, sobre capturas), no una medición; la columna `proxy` es una regla objetiva simple y **no detecta lo pastel**, por eso no se usa como resultado final.

### Resultados agregados (27 muestras de familia)

| Métrica | A · actual | B · piso L 0.70 | C · ΔE ≥ 0.50 |
| --- | --- | --- | --- |
| L oscuro (mín. a máx., media) | 0.599 a 0.681 (0.641) | 0.699 a 0.701 (0.700) | 0.698 a 0.729 (0.710) |
| ΔE a la superficie (mín. a máx., media) | 0.385 a 0.485 (0.435) | 0.474 a 0.504 (0.493) | 0.500 a 0.506 (0.503) |
| Dispersión de ΔE (desv. típica) | 0.034 | 0.010 | **0.002** |
| Contraste WCAG (mín. a máx.) | 4.50 a 6.22 | 5.86 a 6.75 | 5.86 a 7.24 |
| Croma conservado (mín.) | 0.99 | 0.99 | 0.98 |
| Desvío de tono máximo | 2° | 1° | 2° |
| Contraste del texto `on-*` (mín.) | 4.79 | 6.24 | 6.23 |
| Visual: insuficiente | **7 de 27** | 0 | 0 |
| Visual: excesivo | 0 | 0 | 0 |

### Por familia (A / B / C)

| Familia | A · actual | B · piso 0.70 | C · ΔE ≥ 0.50 |
| --- | --- | --- | --- |
| rojo | adecuado (L 0.65) | adecuado (coral algo más claro) | igual que B |
| naranja | **oscura insuficiente** (marrón arena), media y clara adecuadas | adecuado | adecuado (durazno más claro, L 0.71) |
| amarillo | **oscura y media insuficientes** (oliva fangoso), clara adecuada | adecuado (mostaza/caqui desaturado) | adecuado (caqui más claro, L 0.72) |
| verde | adecuado (algo apagado en la oscura) | adecuado | adecuado |
| cian | **oscura y media insuficientes** (verde azulado apagado) | adecuado | adecuado (L 0.72) |
| azul | adecuado | adecuado (azul más claro) | adecuado |
| violeta | adecuado | adecuado (lavanda) | adecuado |
| magenta | adecuado | adecuado (rosa más claro) | adecuado |
| gris | **oscura y media insuficientes** (pizarra apagada), clara adecuada | adecuado (ΔE 0.474) | adecuado (gris claro, L 0.73) |
| `success` por defecto | adecuado | adecuado | adecuado |
| `warning` por defecto | **insuficiente** (ocre apagado, ΔE 0.407) | adecuado | adecuado |
| `danger` por defecto | adecuado | adecuado | adecuado |
| `info` por defecto | adecuado | adecuado (croma 0.159 frente a 0.181 por la gama) | adecuado |

### Sensibilidad: dónde empieza a sobrecorregir

| Variante | L medio | ΔE medio | Croma conservado (mín.) | Visual |
| --- | --- | --- | --- | --- |
| B·0.66 | 0.667 | 0.461 | 0.97 | 5 insuficientes (amarillo oscuro y medio, cian oscuro, gris oscuro y medio): casi como A |
| **B·0.70** | 0.700 | 0.493 | 0.99 | **0 insuficientes, 0 excesivos** |
| B·0.74 | 0.740 | 0.529 | 0.85 | **excesivo en 7 de 9 familias**: rojo a salmón, naranja a durazno, amarillo a crema, azul a celeste, violeta a lavanda, magenta a rosa, gris a casi blanco (verde y cian siguen adecuados) |
| C·0.45 | 0.666 | 0.460 | 0.96 | 5 insuficientes (mismos casos que B·0.66) |
| **C·0.50** | 0.710 | 0.503 | 0.98 | **0 insuficientes, 0 excesivos** |
| C·0.55 | 0.764 | 0.552 | 0.76 | **excesivo en todas**; además el croma cae hasta el 76 % |

La **ventana válida es estrecha**: por debajo de B·0.66 / C·0.45 los casos apagados siguen apagados; por encima de B·0.74 / C·0.55 todo se vuelve pastel. **0.70 y 0.50 están justo dentro de la ventana, sin mucho margen por arriba.**

### Conclusiones por hipótesis

**A · solo 4.5:1.**
- *Mejora:* nada (es la referencia). Conserva el carácter de los tonos saturados (rojo, azul, violeta, magenta, verde): ahí se ve bien.
- *Empeora:* nada.
- *Sobrecorrige:* nunca.
- *Familias con problema:* las de **croma bajo a luminosidad media**, donde el mínimo WCAG deja un color sucio: **amarillo** (oscuro y medio), **naranja oscuro**, **cian** (oscuro y medio), **gris** (oscuro y medio) y el `warning` por defecto. La causa no es el tono sino «croma bajo + L 0.60».
- *Consistencia:* la peor: todas las muestras quedan en el suelo (WCAG 4.5 a 4.7), con ΔE de 0.385 a 0.485.

**B · piso de L ≥ 0.70.**
- *Mejora:* los 7 casos apagados de A (y el `warning`). Da un resultado muy predecible en L (desv. 0.001) y mantiene el tono (≤ 1°) y el croma (≥ 0.99).
- *Empeora:* nada visible a 0.70. A 0.74 sobrecorrige (ver sensibilidad).
- *Sobrecorrige:* solo por encima de ≈ 0.72.
- *Familias con problema:* ninguna a 0.70; el piso da ΔE algo menor en **gris** (0.474) y **cian**: con croma bajo, el mismo L da menos distancia, así que esas familias quedan algo por debajo de las demás.
- *Consistencia:* constante en L, pero la distancia perceptual varía (0.474 a 0.504).

**C · ΔE ≥ 0.50.**
- *Mejora:* los mismos 7 casos y el `warning`, con la distancia perceptual casi constante (desv. 0.002).
- *Empeora:* nada visible a 0.50.
- *Sobrecorrige:* cuando el umbral sube a 0.55 (todas pastel) y, dentro de 0.50, empuja a L más alto a las familias de croma bajo (gris 0.73, cian 0.72, amarillo 0.72), que quedan algo más claras que el resto.
- *Familias con problema:* ninguna a 0.50; el riesgo está en el umbral, que es muy sensible (0.45 → casi A; 0.55 → pastel).
- *Consistencia:* la mejor **en distancia perceptual**; en L varía de 0.70 a 0.73.

**B y C dan resultados casi idénticos**: en las 27 muestras la diferencia de L entre ambas es de 0.01 de media y 0.03 como máximo (gris). La elección entre ellas es de principio (un número fijo de L frente a una distancia que se adapta al croma), no de resultado visible.

### ¿`danger` y `warning` justifican una excepción?

**No, con estos resultados.**
- **`danger`** (rojo, naranja rojizo, magenta; y `danger` por defecto): es adecuado con A, B·0.70 y C·0.50. Solo se sobrecorrige (salmón pastel) en B·0.74 y C·0.55, igual que el resto de familias: es un problema del umbral, no de `danger`.
- **`warning`** (ámbar, amarillo, naranja; y `warning` por defecto): es el que **más gana** con B o C (con A queda ocre apagado). Con B·0.74 y C·0.55 se vuelve crema pálido, también como las demás familias.
- No hay un patrón consistente que muestre que la regla general produzca problemas específicos en ellos: no se propone ninguna excepción. Queda una nota sobre `warning` y `danger` a 0.74: el efecto pastel **se nota más** en ellos porque su función es alertar, lo que refuerza mantener el umbral bajo (≤ 0.70 / 0.50).

### ¿Qué regla produce el comportamiento más consistente?

- **En distancia perceptual a la superficie:** **C** (desv. 0.002; B 0.010; A 0.034).
- **En luminosidad:** **B** (desv. 0.001; C 0.010; A 0.029).
- **En resultado visual:** B y C empatan a 0.70 y 0.50 (0 insuficientes, 0 excesivos) y ambas son mejores que A (7 insuficientes). **Ambas dependen de un umbral con una ventana estrecha.**

### Limitaciones de esta ampliación

- Una sola superficie oscura (`#1C1C1C`, el `surface` por defecto); un solo tono por familia y croma fijo por familia; 3 luminosidades de partida.
- El resultado visual es de una sola persona, sobre capturas. No hay prueba con usuarios ni con pantallas distintas (brillo y gamut). «Pastel» y «apagado» son juicios.
- Solo se midió la base sólida y sus texto, suave y línea. No se revisó el efecto sobre `strong` (hover), `soft` ni `text` a nivel de componente real (la hoja sí los dibuja).
- El proxy objetivo no detecta el aspecto pastel.
- No se probó `accent` ni los semánticos dentro de los componentes reales del playground en esta ampliación (sí en la primera revisión, con pisos 0.66, 0.70 y 0.74).

### Qué queda por decidir (sin cambiar nada todavía)

1. Elegir **B o C** (los resultados son casi iguales) y, si se elige, el valor del umbral dentro de la ventana, con margen de seguridad (p. ej. no pasar de L 0.72 o ΔE 0.52).
2. Si se adopta C: **un tope de L** (p. ej. ≤ 0.75) para que el gris y las familias de croma bajo no vayan a casi blanco.
3. Si la regla se aplica solo a `accent`/`brand` derivados o también a los semánticos por defecto del oscuro (que son de coco, en `defaults.css`).
4. La misma comparación con **más de una superficie oscura** y con dispositivos distintos.

### Pendientes abiertos por separado (no dependen de esta investigación)

- Clave `primary` propia en la configuración.
- Regla automática de «sin saltar niveles».
- Pruebas manuales en Firefox, Safari y con lector de pantalla.

### Lo que la primera fase NO probaba

- Es una sola superficie oscura (`#1C1C1C`) y croma fijo 0.15 en la simulación.
- APCA es una segunda opinión **no normativa**; WCAG 2 sigue siendo el suelo del contrato.
- **La revisión visual es de una sola persona y sobre capturas** (ver arriba); no hay prueba con usuarios ni con pantallas distintas. «Se ve apagado» sigue siendo un juicio estético.
- No se simuló el efecto sobre `strong` (hover), `soft`, `text` y `on-soft`, ni sobre los semánticos que sí se derivan.

### Decisiones abiertas (para el usuario y lima)

1. **Objetivo de presencia:** un piso de L (p. ej. 0.70), un ΔE mínimo a la superficie (p. ej. ≥ 0.50), o un APCA mínimo (p. ej. |Lc| ≥ 45). Recomendación provisional: un ΔE mínimo, que no depende de la norma APCA y cubre el tono.
2. **Alcance:** solo `accent` y `brand` derivados, o también los semánticos por defecto del oscuro (que son parte del tema de `coco`, `defaults.css`).
3. **Interacción con `strong`:** hoy `strong` oscuro sube L +0.06; con un piso más alto se acerca a 1 y habría que revisar su dirección.

### Siguientes pasos

1. ~~Revisión visual en el playground (pisos 0.66, 0.70 y 0.74)~~ hecha con 3 temas; falta ampliarla a más marcas (amarillos, verdes, magentas, grises) y a los estados `strong`, `soft` y `text`.
2. Decidir el objetivo y el alcance (arriba) y, si se adopta una regla, escribirla en `tokens.md` §15 y §16 con su prueba.
3. Si no se adopta, dejar 4.5:1 como suelo y documentar `dark: { accent, overrides }` como la salida para quien quiera más presencia.

## Resultado

**Medición, revisión visual y ampliación a 9 familias hechas; decisión pendiente.** Ninguna regla de derivación cambió. La ampliación **corrige** la lectura provisional anterior: con 9 familias **no hay evidencia de que `danger` o `warning` necesiten una regla propia**, y **B (L ≥ 0.70) y C (ΔE ≥ 0.50) dan resultados casi idénticos**; lo decisivo es el umbral, con una ventana estrecha (0.74 / 0.55 sobrecorrigen).
