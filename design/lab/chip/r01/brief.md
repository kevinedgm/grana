# Brief — etiqueta suelta (`GTag`, nombre de trabajo), r01: base funcional y tres conceptos

> kiwi, 2026-10-07. Origen: Fase C del plan de v1, punto 11 («chip / etiqueta suelta: estados, filtros aplicados, categorías; quizá seleccionable y quitable, con frontera clara con `GBadge`»); `PENDIENTES.md` §3 («chip/etiqueta suelta: sin ronda; candidato»); `badge.md` «Límites conocidos» («ni chips pulsables ni cerrables en v0.1: un componente aparte»); #59 (`GBadge` descartó «chip pulsable o cerrable»).

## Para qué

Las etiquetas que una persona **ve, quita, alterna o sigue**: las alergias de un expediente, los filtros aplicados sobre una lista, los destinatarios de un mensaje, las áreas de un caso, los temas de un artículo que llevan a su página, el «Solo pendientes» de la cabecera de una tabla. Se leen de un vistazo (muchas en poco espacio, a veces en una fila de tabla), se quitan con prisa (y a veces la que no era), se usan con ratón, con el dedo, con teclado y con lector de pantalla, y en idiomas que se escriben de derecha a izquierda.

## El problema de lo que hay

- **La «píldora con ×» de los frameworks:** la × mide 16px junto al texto (por debajo de WCAG 2.5.8); al quitar una, las siguientes **saltan bajo el puntero** y el segundo clic quita la que no era; el foco se pierde (vuelve a `<body>`); no hay vuelta atrás salvo un aviso aparte; el color de categoría es la única pista de la categoría; el texto largo se recorta sin forma de leerlo con teclado; la × a menudo no llega con Tab (solo Retroceso desde un campo).
- **En Grana**, las piezas con forma de chip ya existen pero cada una dentro de su componente: `GCheckbox layout="chip"` y `GRadioGroup appearance="chip"` (opciones de formulario), los chips aplicados de `GFilterBar` (internos, dos botones), los de proximidad de `GDatePicker` (internos), la ficha de `GFileField` (`GSummary`). `GBadge` es **no interactiva** a propósito (#59). Falta la etiqueta **suelta** que se quita, se alterna o se sigue, y la etiqueta de **categoría** (color del tema por clave, como `GAvatar`).

## Qué es esta ronda

Una sola ronda con las dos partes (a diferencia de `time-field`, que las repartió en r01 y r02):

1. **Base funcional** en kit gris: semántica por caso (estática, enlace, alternar con `aria-pressed`, quitable con «Quitar X» nombrado), grupos (lista y `role="group"`), teclado, foco tras quitar, anuncio, área táctil, color por categoría del tema con el hash de `GAvatar`, recorte, RTL, tamaños. La forma es la convencional **a propósito**.
2. **Tres conceptos divergentes** con los tokens reales del tema por defecto (más 8 categorías generadas por el motor, `tema-cat8.css`), que cuestionan la premisa de la «píldora con ×»: **A · Huella** (comportamiento al quitar), **B · Racimo** (estructura del grupo), **C · Palabra** (forma en reposo). Comparativa y una pregunta de elección.

Deriva de HTML, WAI-ARIA APG (*Button* con `aria-pressed`, *Disclosure*; ningún widget compuesto), WCAG 2.2 (1.4.1, 1.4.3, 1.4.11, 1.4.13, 2.1.1, 2.4.3, 2.4.7, 2.5.3, 2.5.8, 4.1.2, 4.1.3) y los contratos vigentes (`badge.md`, `avatar.md`, `checkbox.md`, `radio-group.md`, `filter-bar.md`, `tooltip.md`, `tokens.md` §7.1 y §16.3, `icons.md`).

## Solapes revisados antes de proponer

| Componente | Qué comparte | Decisión |
| --- | --- | --- |
| `GBadge` | Píldora con texto, figura o icono; `label`; RTL | **Frontera:** `GBadge` dice el **estado o la cantidad de otra cosa**, no se toca, colores **semánticos**. `GTag` es **un elemento de un conjunto** (clasifica o resume una elección), se puede quitar, alternar o seguir, colores **de categoría**. Una etiqueta estática de categoría es `GTag` (mismo aspecto que cuando se puede quitar) |
| `GCheckbox layout="chip"`, `GCheckboxGroup`, `GRadioGroup appearance="chip"` | Chip que se marca | **Frontera:** si la elección **se envía con el formulario** (tiene `name`, error, `GForm`), es casilla o radio. `GTag` alternable cambia **la vista en el acto** y no es un valor de formulario (pregunta 2) |
| `GFilterBar` | Chip aplicado = resumen + quitar; foco al siguiente o a «Agregar filtro» | **Mismo patrón**, generalizado. `GFilterBar` podría adoptar `GTag` para sus chips aplicados en una ronda propia (hallazgo L11); hoy no se toca |
| `GCombobox multiple` | Elegidos con quitar | **No se usa:** el usuario eligió «la frase», sin fichas (#417). `GTagInput` (reservado, #338) sí compondrá `GTag` |
| `GSummary` | Ficha de resumen | Una pieza con varios datos (título, código, hechos) es `GSummary`; `GTag` es **un solo texto corto** (más un avatar o icono opcional) |
| `GFileField` | Ficha de un adjunto | Sigue siendo `GSummary` + `GProgress` (#375). Sin cambio |
| `GAvatar` | Color por clave con hash estable | **Se reutiliza:** mismo hash (FNV-1a UTF-8 + `fmix32`), mismas categorías del tema, `GAvatar size="xs"` como lead (el hueco adopta su caja, #295) |
| `GTooltip` | Texto entero de lo recortado; nombre de un botón de solo icono | **Se reutiliza** el modo visual (`aria-hidden`, #433): la pista nunca es el nombre, solo lo enseña |
| `GBtn` | Botón pequeño | Una pieza que ejecuta otra acción (no quitar, no alternar, no navegar) es `GBtn size="sm"`, no `GTag` |

## Entregables

- `index.html`: base (seis casos) + A + B + C + comparativa con los mismos datos. `tag.js` (motor del prototipo, sin dependencias), `tag.css` (geometría y estados con tokens; no es el CSS de coco), `tema-cat8.css` (generado por `generar-tema.mjs` con `@grana/cli`, `{ categories: 8 }`).
- `verificar.mjs` + `serve.mjs`: la base y los tres conceptos en Chromium, Firefox y WebKit, **solo puerto 4213**.
- `declaracion.md`: decisiones numeradas, conceptos, comparativa, recomendación, «Qué lo hace distinto», comprobaciones, hallazgos L1… para lima y las preguntas de producto.

## Ver

`index.html` (`?dir=rtl`, `?theme=dark`). Verificación: `node design/lab/chip/r01/verificar.mjs` (`ENGINES=chromium`, `VERBOSE=1`; requiere `npm run build` por `dist/grana.css`).
