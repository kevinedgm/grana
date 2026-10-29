# Declaración · pieza 3 · el texto sigue la densidad (r01, kiwi)

**Estado:** propuesta para el usuario (dos preguntas, §9) y después para lima. **Prototipo:** `index.html` con componentes reales de `dist/` y `proto/*.css`, generado por `gen-proto.mjs` desde el CLI real. **Verificación:** `verificar.mjs`, **74/74 en Chromium**. **Antecedentes que no se reabren:** #966, #967, #969, #970 a #973, #974 a #985, §5 y §7 de `tokens.md`.

## 1. Qué es «un escalón»: dos escalas medidas

Cuentas hechas con `escala.mjs` sobre los valores del CLI real (tamaño/interlineado en px):

| Rol | Por defecto (16 / 1,25) | **B · Hermano menor** | A · Peldaño | A0 · Peldaño puro (descartada) |
| --- | --- | --- | --- | --- |
| `caption` | 12/16 | 12/16 | 12/16 | 12/16 |
| `body-sm` | 14/20 | **13,13/20** (−6,3 %) | 13/20 (−7,1 %) | 12/16, **choca con `caption`** |
| `body` | 16/24 | **15/24** (−6,3 %) | 14/20 (−12,5 %) | 14/20 |
| `title-sm` | 20/28 | **18,75/28** (−6,3 %) | 16/24 (−20 %) | 16/24 |
| `title` | 25/36 | **23,44/32** | 20/28 (−20 %) | 20/28 |
| `title-lg` | 31,25/40 | **29,3/36** | 25/36 | 25/36 |
| `display` | 39,06/48 | **36,62/44** | 31,25/40 | 31,25/40 |

| Tema del CLI | B | A |
| --- | --- | --- |
| 14 / 1,2 | Todo −6,3 %; `body-sm` 12,25 → **12** (piso) = `caption`: el choque **ya lo trae el tema** (12,25 frente a 12 en el paso normal) | Títulos −16,7 %; choca `caption` ≈ `body-sm` ≈ `body` (12 · 12,13 · 12,25) |
| 18 / 1,333 | Todo −6,3 %, incluido `caption` (13,5 → 12,66) | Títulos **−25 %** (`display` 56,8 → 42,6); `caption` no se mueve |

- **A · Peldaño** es la lectura literal: cada rol toma el tamaño y el interlineado del rol de abajo. Como en el piso de 12 `body-sm` cae sobre `caption`, necesita un parche: el punto medio, que es el «~13» que lima anticipó en el inventario. Lo que baja depende del tema: con `typeScale` alto, los títulos caen hasta un 25 %.
- **B · Hermano menor** recalcula **la misma escala** con `fontSize × 15/16`, con las mismas razones de interlineado, el mismo redondeo a 4 px de §5 y el piso de 12. Es el paso de 1 px de FF en el cuerpo (13 → 12, 16 → 15). Baja lo mismo en todos los roles y en todos los temas, y no necesita parche.
- **Recomendación: B.** Conserva la jerarquía entera: los cuatro niveles de la cadena del diálogo siguen distintos, con 18,75 · 15 · 13,13 · 12 (verificado 1.10). Es predecible en cualquier tema y en el CLI es una sola llamada más a `typography()`. En los controles, A y B se ven casi iguales (13 frente a 13,13); la diferencia de identidad está en `body` y en los títulos, y se ve en `index.html` §2. **Pregunta P1.**
- **A0 queda descartada:** pone la etiqueta de campo, la ayuda, el título y el subtítulo de celda y el título de `GWidget` todos a 12.
- **Factor × 0,875** (el que se mencionó en el encargo): queda descartado. `body-sm` daría 12,25 frente a `caption` 12, un choque de 0,25 px, y los títulos bajarían el 12,5 %.

## 2. Interlineado

- **Acompaña al tamaño con la regla de §5**, sin regla nueva: razón por rol × tamaño, redondeada a 4 px. Con B, `caption`, `body-sm`, `body` y `title-sm` **conservan su renglón** (16, 20, 24 y 28) y los demás bajan 4 px.
- **Cuadra en la caja compacta:** la caja la fija `--g-density` (pieza 2) y el relleno se calcula desde la altura menos el renglón (lección de `min-block-size`). En `md`, 27 = 3,5 + 20 + 3,5. El texto queda centrado en la caja del botón con una diferencia ≤ 1 px y sin desbordar en los cinco casos medidos. En `GTable`, la fila sigue al relleno de la pieza 2. El item de `GMenu` mide lo mismo que su disparador (verificado 1.x y 2.5).
- **No se rompe la rejilla de 4 px** para acercar el renglón al de FF (18 en 28). Un renglón de 16 para un texto de 13 da una razón de 1,23, demasiado justa para textos de varias líneas (`GTextarea`, descripciones). El de 20 da 1,52. A daría 13/20 en `body-sm`, igual que B, y 14/20 en `body`.
- **Mejora de paso con temas grandes:** con 18/1,333, hoy el compacto pone un renglón de 24 en una caja de 27 (relleno de 1,5). Con B queda en 20 (relleno de 3,5).

## 3. `comfortable`: el texto se queda en el paso 1

En Grana, `comfortable` **no es más amplio que `default`**: su caja es × 0,875, entre los dos (#15, #967). Subir el texto «un escalón» invertiría la escalera, con letra mayor en una caja menor que la de `default`. Medio escalón de B serían 0,4 px, algo imperceptible que costaría un juego de reglas más. **Decisión:** `comfortable` lleva el texto de `default`, con 14/20 en una caja de 31,5 (relleno de 5,75), entre los 8 de `default` y los 3,5 de `compact`. Comparte la regla de vuelta con `default` (§5), sin coste propio.

## 4. Títulos y jerarquía

- **Los títulos bajan con la escala** (#966: «cada rol»). Con B bajan lo mismo que el texto (−6,3 %) mientras la caja baja un 25 %. El peso (600) y el tracking de §5 **no cambian**.
- **Regla de §23.4, «nunca un título por debajo de `body-sm` (14)»:** se reescribe en relativo, **«nunca por debajo del `body-sm` de su paso»**. Con el tema por defecto queda en 14 en `default` y `comfortable` y en 13,13 en `compact`. El motivo de la regla (un título siempre por encima de rótulos de 12 y ayudas) se conserva: el título de `GWidget` y el de celda quedan en 13,13, sobre el subtítulo de 12 (verificado). Mantener 14 absoluto obligaría a los títulos de `body-sm` a leer un token que no se reasigna (un token nuevo por rol) y aplanaría la cadena contra la etiqueta de campo. **Para lima** (`tokens.md` §23.4).
- **Cadena del diálogo en compacto (B):** `GDialog __title` 18,75/28 › `GFormSection __title` 15/24 › etiqueta 13,13/20 (500) › ayuda 12/16. Los cuatro niveles siguen distintos.

## 5. Mecanismo (para lima): M1 · reglas de región en el tema

Los componentes leen `var(--g-text-{rol}-size|line)` en unas 900 declaraciones y no cambian. El tema reasigna esos tokens **en el elemento de la región** con valores literales del propio tema:

```css
[data-g-density="compact"] { /* valores compactos que cambian */ }
[data-g-density="default"], [data-g-density="comfortable"] { /* valores del paso 1 (vuelta dentro de una compacta) */ }
@media (pointer: coarse) {                                         /* P2 */
  [data-g-density] { /* paso 1 */ }
  [data-g-density="compact"][class*="--density-compact"] { /* compacto: la prop explícita no cede */ }
}
/* Solo con la clave density "compact" del CLI: */
:root:where(:not([data-g-density])) { /* compacto */ }  @media (pointer: coarse) { :root:where(:not([data-g-density])) { /* paso 1 */ } }
```

- **Dónde va:** en `defaults.css` (capa `grana.defaults`, coco) con el tema por defecto, y **en el `tokens.css` del CLI, sin capa, con los valores de su tema** (bruno), justo después de su bloque `:root`. Solo se escriben los tokens que cambian: 9 con el tema por defecto, 8 y 12 en los temas de prueba. `sync-defaults` las deja fuera de `DEFAULTS`, igual que las reglas de atributo de la pieza 2.
- **Por qué el CLI también las emite** (medido, 4.t14 y 4.t18 «solo defaults»): el `:root` del tema del CLI va sin capa y le gana a la regla en capa sobre `<html data-g-density="compact">`, así que la preferencia de quien usa la aplicación no bajaría el texto. Además, una región compacta tomaría los valores compactos **del tema por defecto**, no los del tema. Con las reglas del CLI, `<html>`, las regiones y la anidación toman los valores de su tema (verificado).
- **Si el tema no fija `fontSize` ni `typeScale`,** el CLI no emite texto y mandan las reglas de `defaults.css`: Δ0 bytes en `tokens.css`. **Si el tema fija la clave `density` sin tipografía,** el CLI emite la regla de la clave con los valores por defecto.
- **Lo que comprueba el prototipo:**
  - Región más cercana y anidación: `default` dentro de una compacta vuelve a 14 (2.1).
  - La prop gana: `density="default"` dentro de una compacta da 14 y 36; `density="compact"` en la página da 13,13 y 27 (2.2, 2.4).
  - Las raíces fijadas en `default` (avisos, isla, voz) quedan en Δ0 (2.3).
  - `GMenu` en la capa superior y `GDialog` heredado siguen la región (2.5, 2.6).
  - `<html>` y la clave del CLI, también con la preferencia `default` sobre la clave (4.1, 5.1, 5.2).
  - P2: la región cede a 14 y la prop explícita conserva 13,13 (6.1, 6.3).
  - Pieza 1: el texto editable sigue en 16 en la región que cede y con `GInput density="compact"` explícito, con caja de 44 (6.2, 6.4).
- **Descartados:**
  - **M2 · fuentes + resolutor.** El tema emitiría dos juegos con otros nombres (`…-default` y `…-compact`) y `defaults.css` resolvería los públicos con `var()`. Deja la lógica en un solo sitio, pero exige que el CLI **deje de emitir** los nombres públicos (si no, vuelve el fallo de `<html>`) y añade 28 tokens de tema. Sería un cambio de contrato del tema mayor que el beneficio.
  - **M3 · `calc()` en CSS.** Un token no puede derivarse de sí mismo en la misma regla (ciclo), así que también necesita una fuente con otro nombre. Además, el redondeo a 4 px exigiría `round()` y copiaría en CSS las razones de §5.
- **Peso medido** (gzip -9, solo las reglas): `defaults.css` ≈ **+272 B** en `grana.css`, y `tokens.css` del CLI de **+262 a +311 B** cuando el tema fija la tipografía. Sin JS: Δ0 en `grana.js`. Lo valida lima con su tope.

## 6. Alcance: qué sigue la densidad

Sigue **todo el texto que lee un rol dentro de la región**, porque el token se reasigna en la región y no en el componente:

- controles, filas, etiquetas, ayudas, mensajes, celdas y opciones;
- títulos de contenedor (`GDialog`, `GSection`, `GCard`, `GFormSection`, `GWidget`, `GTable caption`);
- el valor de `GMetric` (title 25 → 23,44);
- `GText` y el texto propio de la aplicación que lea `--g-text-*` (verificado 1.x: «texto propio sigue la región»).

**Pregunta P2:** la prosa de la aplicación y `GMetric`.

**No lo siguen:**

- `GToaster`, `GStatusIsland`, `GSpeechHost` y el diálogo de revisión: su raíz fija `default` y la regla de vuelta lo resuelve sola.
- El texto de la aplicación que no lee tokens (hereda el `font-size` que ella misma ponga).
- `--g-hero-title-max`, que se resuelve en `:root` (hallazgo H4).

Los iconos de los componentes que se miden desde el texto (`GBtn`: `--_icon = --_fs × 1,15`) bajan con él, de 16,1 a 15,1, como el 16 → 14 de FF, sin regla nueva.

## 7. Qué lo hace distinto

1. **Ritmo compartido (propio de Grana, más allá de FF).** Con B, los renglones de `caption`, `body-sm`, `body` y `title-sm` **son los mismos en los tres pasos** (16, 20, 24 y 28), sobre la rejilla de 4 px. Una tabla compacta junto a un formulario normal (en `GSplit` o `GAppShell`) lleva los renglones al mismo paso: los párrafos y las listas de las dos columnas comparten pauta. Al cambiar de densidad, el texto de varias líneas solo se reparte en horizontal y no cambia de paso vertical (estabilidad, rúbrica de movimiento). FF cambia el renglón (20 → 18) y rompe esa pauta. Verificado en 1.11 y 1.12 (la escala A sí cambia el renglón de `body`); `index.html` §3 lo enseña sobre una rejilla de 20 px.
2. **La jerarquía se aprieta menos que la caja.** La caja baja un 25 % y el texto un 6,25 % en todos los roles, con el peso y el tracking de título intactos. En una pantalla densa, donde más se escanea, los títulos ganan presencia relativa en vez de perderla, y ningún nivel colapsa contra el piso de 12. FF baja `display` un 14 % y deja `caption` y `micro` a 1 px.
3. **El hermano menor se calcula, no se elige.** El compacto de cualquier marca sale de la misma función que su escala normal: la misma `typeScale`, las mismas razones, el mismo redondeo y el mismo piso. Quien configura el tema no diseña una segunda tabla, y un tema del CLI nunca lleva un compacto incoherente.

Sin movimiento nuevo: el cambio de densidad sigue sin animarse (`density.md` §9).

## 8. Hallazgos para cada dueño

| # | Para | Hallazgo |
| --- | --- | --- |
| H1 | bruno | `grana theme … --stdout` escribe los avisos «ℹ Sobre la marca…» **en la misma salida que el CSS** (`cli.js`: `(result.ok ? out : err)(formatIssues(...))`). Al redirigir `--stdout > tokens.css`, la primera regla (`:root`) queda inválida y el tema entero se pierde en silencio. Medido al generar este prototipo, que pasó a usar `--out`. Los avisos deberían ir a `stderr` con `--stdout`. |
| H2 | lima | Reescribir `tokens.md` §5 (roles compactos: B), la línea 90 y `api.md` fila `density` («sin cambiar la tipografía»), y §23.4 en relativo (§4). Registrar en `DECISIONS.md` la escala elegida y el «Qué lo hace distinto» (ritmo compartido). |
| H3 | lima | **G5 y `GCalendar` siguen la región a medias hasta la pieza 4:** su texto sí, porque lee los roles, y su caja no. Ejemplo: `GPagination` o `GTag` con texto de 13,13 en una caja de 36. Es inofensivo y transitorio; se anota como límite en `density.md` §12 o se adelanta la pieza 4. |
| H4 | lima | `--g-hero-title-max` se calcula en `:root` desde `--g-text-display-size`, así que no sigue la región. Se acepta (el héroe es de página), pero hay que escribirlo. Regla para tokens futuros: un token derivado de un rol que deba seguir la región no se declara en `:root`. |
| H5 | lima / mora-docs | Un `tokens.css` escrito a mano que sobrescribe `--g-text-*` en `:root` solo vale fuera de las regiones: dentro de una región las reglas del tema lo reasignan. Para tocar el texto, las claves del CLI; a mano, también las reglas de región. Va como límite en `tokens.md` §58. |
| H6 | coco / bruno | Criterios para el contrato: los de `verificar.mjs`. Destacan el piso de 12 en todo texto, Δ0 sin regiones, el fallo de «solo defaults» como prueba del CLI, P2 con pieza 1 y la cadena del diálogo con cuatro tamaños. Solo se midió en Chromium. |

## 9. Preguntas para el usuario (identidad)

**P1 · ¿Qué escala tiene el texto compacto?** *Recomendación: B · Hermano menor.*
- **B:** la misma escala, un 1/16 menor. Todo baja un 6 %, los títulos conservan su distancia y ningún nivel se junta.
- **A:** cada rol toma el de abajo. Los títulos caen entre un 20 y un 25 %, la pantalla gana más sitio y la diferencia con el paso normal se nota más.

Compáralas en `index.html` §2.

**P2 · Dentro de una región compacta, ¿también baja el texto de lectura?** Se refiere a la prosa de la aplicación que use los tokens, `GText` y el valor de `GMetric`. *Recomendación: sí.*
- **Sí:** una región es una región. Con B la bajada es de 1 px en el cuerpo y no estorba la lectura, y la preferencia «vista compacta» en `<html>` aprieta toda la página de forma coherente.
- **No:** haría falta una excepción con tokens fuente propios (§5, M2), y la regla «la región manda» dejaría de ser única.

Lo demás se deriva sin preguntar:

- **«Escalón»:** pendiente de P1.
- **Interlineado:** regla de §5.
- **`comfortable`:** sin cambio de texto (§3).
- **Títulos:** bajan, y la regla de §23.4 pasa a relativa.
- **Mecanismo:** M1.
- **Avisos, isla y voz:** fijos en `default`.

## 10. Cumplimiento (auditoría previa, `auditoria-visual.md`)

- **Estructura y jerarquía:** no cambian; cuatro niveles distintos en la cadena del diálogo.
- **Contraste:** sin cambio de color. Un texto menor mantiene el contraste; los mínimos de 4,5:1 no dependen del tamaño por encima de 12.
- **Mínimos de §7:**
  - Texto ≥ 12: verificado en los tres temas.
  - 24 y 44 px: intactos.
  - 16 px editable en táctil: intacto.
- **Consistencia:** la pieza solo reasigna tokens existentes, sin token, componente ni prop nuevos.
- **Movimiento:** ninguno.
