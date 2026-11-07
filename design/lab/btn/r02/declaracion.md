# Declaración · GBtn r02 · estados, carga y éxito

> kiwi, 2026-11-07. **Estado: elegida por el usuario el 2026-11-07: «Solo A · Retén».** B y C quedan descartadas para `GBtn`. F1 a F3 (§3) entran con A: son la base común de cualquier concepto. Siguiente dueño: lima.
> Prototipo: `index.html`. Medida del componente real: `node design/lab/btn/r02/medir-actual.mjs`. Verificación del prototipo: `node design/lab/btn/r02/verificar.mjs`, **252/252** (84 por motor en Chromium, Firefox y WebKit).

## 1. Qué hay hoy, medido

Medido sobre el `GBtn` real de `dist/` en los tres motores (`medir-actual.json`).

| Medida | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| Clic con ratón de 60 ms: escala mínima y pico | 0,9706 / 1,0058 | 0,9703 / 1,0059 | 0,9719 / 1,0055 |
| Clic con ratón de 150 ms | 0,97 / 1,006 | 0,97 / 1,006 | 0,97 / 1,006 |
| Clic de 0 ms (el que da tocar para hacer clic en un panel táctil) | **1 / 1** | **1 / 1** | **1 / 1** |
| Enter | **1 / 1** | **1 / 1** | **1 / 1** |
| Espacio, pulsación instantánea | **1 / 1** | **1 / 1** | **1 / 1** |
| Espacio mantenido 120 ms | 0,97 / 1,006 | **1 / 1** | 0,97 / 1,006 |
| Fondo `solid` en carga, sin puntero y con puntero encima | rgb 31 → **51** | rgb 31 → **51** | rgb 31 → **51** |
| Carga de 100 ms: cuadros con etiqueta por debajo de 0,5 | 7 | 8 | 6 |
| Región `role="status"` al terminar | vacía | vacía | vacía |

El dato de Espacio mantenido en Firefox sale de teclado sintético de Playwright. Hay que confirmarlo con teclado real.

## 2. Análisis por estado

| Estado | Disparador | Reglas | Retroalimentación | Bucles y modos | Existe | Falta |
| --- | --- | --- | --- | --- | --- | --- |
| **Reposo** | Forma, color y etiqueta dicen qué hace | `type="button"` por defecto | Ninguna, es la base | Sin modo | Todo; contorno #672 | Nada |
| **Hover** | Puntero, solo con `hover: hover` | Color, sin escala (#300) | Fondo `-strong` en 120 ms | Sin modo | Correcto en reposo | **F1:** sigue reaccionando en carga, cuando el botón no actúa, y contradice el cursor `progress` |
| **Pulsado** | Puntero, Espacio | Escala a 0,97 y rebote al soltar (B1) | Pico 1,006, asienta antes de 240 ms | Sin modo | Correcto con ratón | **F4:** Enter, Espacio instantáneo y el clic de 0 ms no dan pulsación. Teclado y panel táctil se quedan sin la firma del botón |
| **Foco** | Teclado, `:focus-visible` | Anillo con separación, sin transición | Inmediato, tema y `forced-colors` auditados | Sin modo | Todo | Nada. El foco se conserva en carga en botón y enlace |
| **Deshabilitado** | Atributo nativo | Sin foco, sin activación; motivo por `aria-disabled` (#236) | Neutro, `not-allowed` | Sin modo | Todo | Nada en esta ronda |
| **Carga** | La aplicación, `loading` | Inerte sin perder el foco; nombre intacto; ancho Δ 0 | B2: la etiqueta cede el sitio, giro, `aria-busy`, `loadingText` | Bucle abierto: gira hasta que la aplicación diga | B2 y el canal | **F2:** sin retraso ni mínimo, una carga de 100 ms parpadea. **F3:** el giro se para de golpe al salir. **F5:** una espera larga es igual que una corta |
| **Éxito** | No existe | No existe | **Ninguna:** vuelve la etiqueta y la región se vacía | No existe | Nada (B4 reservada) | **Todo.** Tampoco se distingue del fallo ni de cancelar |

### Diagnóstico de la skill (8 filas)

| Fila | Hoy | A | B | C |
| --- | --- | --- | --- | --- |
| Disparador claro | Pasa | Pasa | Pasa | Pasa |
| Muestra su estado | **Falla** (hover en carga, final mudo) | Pasa | Pasa | Pasa |
| Reglas simples | Pasa | Pasa | Pasa | Pasa |
| Respuesta inmediata | **Falla** (Enter, 0 ms) | Pasa | Pasa (por color) | Pasa (por color) |
| Proporcional al suceso | **Falla** (el final no pesa nada) | Pasa | Pasa | Pasa |
| Evoluciona con el tiempo | **Falla** (F5) | **Falla** (F5) | **Falla** (F5) | **Falla** (F5) |
| Sin modos innecesarios | Pasa | Pasa | **Falla** (dice «Guardado» y vuelve a guardar) | Pasa |
| Se entiende sin ayuda | Pasa | Pasa | Pasa | Pasa |
| **Puntuación** | **5/10** | **9/10** | **8/10** | **9/10** |

La fila de evolución falla en los tres porque F5 no está prototipada. Ver «Pendientes».

## 3. Base común, sea cual sea el concepto

**Correcciones sin API (F1 a F3).** Se derivan de estándares y del motor existente:

| # | Corrección | Dueño | Medido en el prototipo |
| --- | --- | --- | --- |
| F1 | En carga, hover y activo no cambian el fondo | coco | Fondo igual con y sin puntero, tres motores |
| F2 | `GBtn` usa el motor de carga: el giro aparece a los 200 ms y dura al menos 400 ms. Hasta entonces la etiqueta sigue ahí, el botón ya es inerte y el acuse inmediato es el relleno de hover | bruno y coco | Con 100 ms: etiqueta a 1, giro a 0 en los tres motores |
| F3 | El giro sigue mientras se funde | coco | Clase `is-leaving` en el prototipo. **Solo revisado a ojo**, sin medida propia |

F2 enmienda `btn.md` en dos puntos: B2 empieza a los 200 ms y `loadingText` se escribe entonces, no al entrar. Una carga que no se ve tampoco se anuncia. Rompe medidas de `personalidad-btn.spec.mjs`, que habría que actualizar. El motor debe crearse la primera vez que haya `loading`: `GTranscript` monta cientos de `GBtn`.

**Reglas del éxito (las tres propuestas comparten API):**

1. **Solo la aplicación afirma el éxito** (#643). Prop `done` con `v-model:done`, y `doneText`. `loading` a `false` sin `done` es reposo.
2. **Sin modos.** Durante el acuse el botón sigue activable: un clic cierra el acuse y actúa.
3. **Fallo = reposo sin marca.** El error lo dice la aplicación en su canal (`GForm`, `GToast`, isla). Una marca de fallo en el botón queda reservada.
4. **Sin verde automático.** La marca usa `currentColor`, así hereda los 35 pares ya auditados.
5. **Anuncio** por la región `g-btn__status`, que pasa a existir con `loadingText` o `doneText`. El foco nunca se mueve.
6. **Interrupciones.** `loading` o `disabled` durante el acuse lo cierran. Desmontar limpia los temporizadores. Con `href`, `done` se ignora: lo que navega no vuelve.
7. **Sin ticket propio.** `done` es la prop sobre la que un anfitrión con ticket (#643) puede apoyarse.

## 4. Los tres conceptos

### Qué lo hace distinto

Cada concepto pone el resultado en un sitio distinto: en el gesto, en la palabra o fuera del botón. Ninguno es «verde con `check`».

### A · Retén (el resultado vive en el gesto)

Un pulsador mecánico que se queda abajo mientras trabaja. El botón se hunde a `--g-press-scale` en cuanto hay `loading` y sube con el rebote de B1 cuando termina. El `check` de Lucide se dibuja en el sitio del giro y dura 960 ms (`--g-duration-slow × 4`). Pulsar y acabar son las dos mitades de un mismo gesto.

- **Por qué sirve:** resuelve de paso F4 en las acciones con carga (Enter se hunde en el primer cuadro) y da acuse de movimiento durante los 200 ms sin giro. Es el que menos cuesta: 192 B de CSS sobre la base.
- **Cuesta:** sin texto visible, y quien mira a otro lado puede perderlo. Lo mitiga que la aplicación ya cambie algo en la página.
- **Encaje con la tabla única de movimiento** (`design/lab/movimiento/r01/tabla.md`, aprobada hoy): la familia «Pulsar» fija aprieta `fast` + `ease-out` y suelta `slow` + `ease-bounce`, justo lo que A usa. Lo que cambia es cuándo se suelta.
- **Decisiones que necesita:** `--g-ease-bounce` sigue en la misma escala de `GBtn`, pero ahora la dispara el sistema y no el dedo. #299 dice que un uso nuevo es una decisión nueva, así que lima lo registra. `× 4` es una constante de coreografía nueva (#187, `tokens.md` §29.6).

### B · Rodillo (el resultado vive en la palabra)

La etiqueta se conjuga: Guardar sube, llega el giro, sube y llega «✓ Guardado» durante 4 s. Al volver, Guardar entra desde abajo. Los estados solo giran hacia arriba, con el `× 1` de B2.

- **Por qué sirve:** se lee en palabras donde ya estabas mirando. Encaja con las cifras que ruedan de `GNumberField`.
- **Cuesta:**
  - El botón reserva el texto más ancho **también en reposo**. Medido: «Eliminar» 88 → 119 px, «Publicar» 87 → 119 px, «Enviar» 75 → 106 px. Cambia maquetaciones y no sale gratis en alemán.
  - Dice «Guardado» y pulsarlo vuelve a guardar: es el único con un modo en su etiqueta.
  - Por WCAG 2.5.3 el nombre accesible tiene que pasar a «Guardado» con el foco dentro, más el anuncio de la región: posible doble lectura, **sin comprobar con lector real**.
  - Solo icono no tiene palabra: cae a la marca de A.
  - `doneText` pasa a ser obligatorio.

### C · Pestaña (el resultado vive fuera del botón)

El botón vuelve a reposo al instante y nunca cambia de modo. El acuse cuelga de él con el nodo real de `GTooltip`, 4 s (`RECEIPT_MS`), con sitio para texto largo y «Deshacer». Se pausa con puntero o foco dentro, Esc lo cierra y se aparta si el foco va a otro control (2.4.11).

- **Por qué sirve:** es la forma más propia de Grana, da texto a los botones de solo icono y es el único que deja deshacer. Sin cambio de medidas en el botón.
- **Cuesta:**
  - Tapa lo que hay debajo durante 4 s: en el prototipo tapa la línea de registro.
  - Es la pieza más grande en el `.vue`: colocación, pausa, foco, Esc, desplazamiento.
  - Necesita API para «Deshacer» (`undo` o slot).
  - Se solapa con `GToast` y hace falta una frontera clara (#643 regla 4 la apoya: junto a la acción).
  - Se cierra al desplazar la página; un acuse perdido así no se recupera.
  - En un pie de `GDialog` o junto al borde necesita `placeAround`, **no prototipado**: el prototipo solo abre hacia abajo.

## 5. Rúbrica de movimiento

Escala de `rubrica-movimiento.md`. H (inmersión) no aplica a ninguno. Contexto: web, ratón, teclado y toque; uso frecuente; interacción momentánea.

### A · Retén

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| A. Propósito | Cumple | Hundido = trabajando, subida = terminado; causa y efecto del propio gesto. Una sola reacción por operación | Bajo | Mantener sin añadidos |
| B. Comodidad visual | Parcial | Sin profundidad nueva ni cambio de brillo. Una escala 0,97 sostenida puede suavizar el borde (hallazgo de `auditoria.md`) | Bajo | coco mide nitidez a 1× con carga larga |
| C. Estabilidad | Cumple | 3 % de escala fijo, sin oscilación durante la espera; pico 1,006 | Bajo | En `block` muy ancho el borde se mueve más: medirlo |
| D. Transiciones | Cumple | Clic durante el acuse: cierra y actúa; durante la carga: ignorado, medido en tres motores. Curvas por transición, interrumpibles | Bajo | Ninguna |
| E. Control | Cumple | Sin bloqueo ni foco movido; no hay nada que esperar | Bajo | Ninguna |
| F. Accesibilidad | Parcial | Con `reduce`, sin escala y trazo completo; marca distinguible en `forced-colors`; `role="status"`. **Sin texto visible** | Medio | Exigir `doneText` para el anuncio (aviso de desarrollo). Lector real: No verificable |
| G. Rendimiento | Cumple | Solo `transform`, opacidad y un trazo; 192 B de CSS sobre la base | Bajo | bruno mide `grana.js` |

### B · Rodillo

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| A. Propósito | Cumple | La dirección dice que el tiempo avanza; el texto dice qué pasó | Bajo | Ninguna |
| B. Comodidad visual | Cumple | Desplazamiento de `space × 1` y fundido; texto legible 4 s | Bajo | Ninguna |
| C. Estabilidad | Cumple | Sin escala; el ancho no cambia entre estados, medido | Bajo | Ninguna |
| D. Transiciones | Parcial | Interrumpible, medido. Hay salto invisible de la etiqueta y estado temporal `is-rolling`: más piezas que limpiar | Medio | Si se elige, probar interrupciones a mitad de salida |
| E. Control | Parcial | Sigue activable, pero la etiqueta en pasado no dice lo que hará el clic | Medio | Valorar una etiqueta que no engañe o un acuse más corto |
| F. Accesibilidad | Parcial | Con `reduce`, sin desplazamiento. Nombre cambiante con foco dentro por 2.5.3. Lectura real: No verificable | Medio | Probar con VoiceOver y NVDA antes de contratar |
| G. Rendimiento | Parcial | El CSS más caro, 448 B sobre la base; un nodo más por botón; **cambia el ancho en reposo** | Medio | Solo si `doneText` existe; nunca por defecto |

### C · Pestaña

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| A. Propósito | Cumple | Texto y acción junto a lo que los causó | Bajo | Ninguna |
| B. Comodidad visual | Parcial | Superficie inversa ≥ 4,5:1 en claro y oscuro; tapa contenido debajo 4 s | Medio | Abrir hacia el lado libre |
| C. Estabilidad | Cumple | Solo fundido; el botón no se mueve | Bajo | Ninguna |
| D. Transiciones | Cumple | Clic, Esc, foco ajeno y Deshacer cierran, medido en tres motores | Bajo | Reposicionar en vez de cerrar al desplazar |
| E. Control | Cumple | Pausa con foco dentro medida más allá de 4 s; Esc; foco devuelto al botón tras Deshacer. Pausa con puntero implementada, **sin medir** | Bajo | Medirla |
| F. Accesibilidad | Parcial | Texto visible para todos; `forced-colors` medido por emulación en los tres motores; «Deshacer» de 22 px visibles con diana de 24. Lector y toque real: No verificable | Medio | En `pointer: coarse`, comprobar que la diana de 44 px no invade el botón |
| G. Rendimiento | Parcial | 252 B de CSS, pero el `.vue` es el mayor; **peso de JS no medido** | Medio | Valorar carga bajo demanda por #506 |

**Riesgos principales, por severidad:** (1) en B, una etiqueta que dice lo contrario de lo que hará el clic; (2) en C, tapar contenido y no tener colocación real; (3) en B, el nombre cambiante sin comprobar con lector; (4) en A, un acuse que se pierde si miras a otro lado; (5) en todos, el peso de JS en un principal sin margen.

**Limitaciones de la evaluación:** el prototipo es HTML y una máquina de estados, no `GBtn.vue`. Ver «Pendientes».

## 6. Comparativa

| | A · Retén | B · Rodillo | C · Pestaña |
| --- | --- | --- | --- |
| Mejor para | Guardar, copiar, aplicar: lo frecuente y repetible | Publicar, enviar: un resultado que se nombra | Archivar, eliminar: lo que merece detalle o se deshace |
| Acuse inmediato | Se hunde, también con Enter | Relleno de hover | Relleno de hover |
| Dura | 960 ms | 4 s | 4 s, con pausa |
| Texto visible | No | Sí | Sí |
| Solo icono | Sí | Cae a A | Sí, y con texto |
| Ancho en reposo | Igual | **+31 px en los ejemplos cortos** | Igual |
| Deshacer | No | No | Sí |
| CSS gzip (+482 B de base) | 192 B | 448 B | 252 B |
| Diagnóstico | 9/10 | 8/10 | 9/10 |
| Rúbrica | 5 cumple, 2 parcial | 3 cumple, 4 parcial | 4 cumple, 3 parcial |

**Recomendación de kiwi:** **A por defecto, C como opción** para lo que se puede deshacer, y B descartada. A hace del final parte del gesto que ya es de Grana, cuesta casi nada y tiene los menores riesgos. C cubre lo que A no puede, pero solo merece su peso con un caso real de «Deshacer», y puede ir en una segunda entrega.

## 7. Pregunta de elección

**Respuesta del usuario (2026-11-07): solo A · Retén.** Y sobre la marca con `disabled`: **se queda como está** (regla 6: `disabled` cierra el acuse y `doneText` se anuncia igual; la receta del README es mantener el botón habilitado hasta `update:done`).

**`block` con carga larga (2026-11-07, el usuario lo delegó en kiwi): se hunde igual.** Un solo gesto para todos los botones y sin excepción que contratar; el coste (35,5 px más estrecho a 1280 px mientras carga) es visual, no mueve la maquetación y ya consta en «Alcance» del README.

**¿Qué concepto quieres para el éxito de `GBtn`?**

- **A · Retén** solo.
- **A por defecto y C como opción** (recomendado).
- **C · Pestaña** o **B · Rodillo** por defecto.
- Ninguno, y solo las correcciones F1 a F3.

Después se sigue kiwi → lima → coco → bruno → coco → mora-docs.

## 8. Cierre

### Cumplimientos

- Los siete estados, analizados con el modelo de la skill y separados en lo que existe y lo que falta, con medida real en tres motores.
- Tres conceptos divergentes con tokens reales, comparativa y pregunta de elección; cada uno evaluado con la rúbrica.
- Prototipo verificado: 252/252 en tres motores. Cubre ancho Δ 0 entre estados, foco, interrupciones, sin parpadeo, ≤ 240 ms, `reduce` real, `forced-colors`, 320 px, RTL y contraste en claro y oscuro.
- Sin cambios en `GBtn.vue`, `GBtn.css`, contratos ni `DECISIONS.md`.

### Correcciones

- La prueba de ancho contaba «Deshacer» como botón de la fila; corregido en `verificar.mjs`.
- Lecturas de `aria-busy` tras un hover lento en Firefox y arranque en frío en WebKit: eran tiempos de la prueba. Corregidos, sin relajar lo que se comprueba.
- En WebKit se usa Alt+Tab: por defecto Safari no pasa por botones con Tab.
- El encargo daba el rebote de A como «uso ya aprobado». Es la misma escala, pero la dispara el sistema: se trata como decisión que lima debe registrar.

### Pendientes

- **La elección del usuario.**
- **F4:** pulsación con Enter y clic de 0 ms en acciones sin carga. Ningún concepto lo resuelve ahí; necesita un pulso mínimo en el `.vue`.
- **F5:** qué cambia en una espera larga (5 s, el `SLOW` del motor). Sin prototipar, y por eso la fila de evolución falla en los tres.
- **No verificado:**
  - lector de pantalla real (VoiceOver, NVDA), incluido el nombre cambiante de B y el anuncio de `doneText`;
  - toque real, `:active` en iOS, y la diana de 44 px de «Deshacer»;
  - `forced-colors` solo por emulación del navegador, no en Windows real;
  - la nitidez de la escala sostenida y el movimiento en `block` ancho (A);
  - el corte del giro de F3 y la pausa con puntero de C, sin medida propia;
  - colocación de C junto a bordes y en `GDialog`, no prototipada;
  - temas distintos al por defecto y la zona de marca;
  - **el peso real en `grana.js`:** solo hay CSS gzip del prototipo. No existe `.vue` que medir, y #506 mide JS.
