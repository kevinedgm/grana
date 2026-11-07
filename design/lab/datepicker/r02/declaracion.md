# Declaración · GDatePicker · r02 · un mes y salto a mes y año

**Estado:** propuesta; **pendiente de elección del usuario** (concepto, defecto de `months` y cómo se activa lo compacto). Lo demás deriva de estándares (APG *date picker dialog* y *grid*, WCAG 2.2 AA: 1.3.1, 1.4.1, 1.4.4, 1.4.10, 1.4.11, 2.1.1, 2.4.3, 2.4.7, 2.5.3, 2.5.7, 2.5.8, 3.2.1, 4.1.2, 4.1.3) y de contratos vigentes (#63 a #66, #358, #739, #778, #952, #977, #1002, #1019).
**Ruta:** R1 · **Fidelidad:** F2 con los **tokens y el CSS reales** de `packages/vue/dist/grana.css` (tema por defecto, claro y oscuro); lo nuevo va en `@layer grana.propuesta`.
**Prototipo:** `index.html` (servir desde la raíz: `python3 -m http.server 4231` → `/design/lab/datepicker/r02/`, o abrir por `file://`). Parámetros `?theme=dark`, `?motion=reduce`, `?lang=en|de`, `?dir=rtl`.
**Verificación:** `node design/lab/datepicker/r02/verificar.mjs` → **384/384** (128 por motor en Chromium, Firefox y WebKit).
**Siguiente dueño:** el usuario elige; después lima (`design/contracts/datepicker.md` y `DECISIONS.md`).

## Base funcional (común a A, B y C)

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | **Un mes es la forma principal.** Propuesta: `months` pasa a valer **`1` por defecto**, en `single` y en `range`; `auto` y `2` siguen existiendo como opción explícita. Lo decide el usuario (pregunta 2) | Petición del usuario; #65 ya dice «es preferible un mes bien resuelto a dos comprimidos». Medido: un mes ocupa 390 × 398 px; dos, 720 × 398 |
| 2 | **Rango en un mes: «la franja que sigue».** Si el rango continúa fuera de lo visible, la franja no se redondea en el último (o primer) día visible: llega al borde y se desvanece (`k-open-end` / `k-open-start`). El resumen sigue diciendo las dos fechas y los días siguen nombrando «dentro del rango» | WCAG 1.4.1 (la continuidad se lee por forma y por texto); sin ella, un rango de noviembre a diciembre parece acabar el día 6 |
| 3 | **Compacto:** la celda baja a `space × 10 × 0,75` (30 px con el tema por defecto; nunca < 24 px; **44 px con puntero grueso**), el relleno de la superficie a `space × 3`, el título a `body-sm`, los botones de mes al tamaño de la celda. Superficie medida: **236 px** de ancho frente a 390 (−40 %). En táctil a 320 px el relleno lateral baja a `space × 1` para que quepan 7 × 44 | Petición del usuario; mínimos de `CLAUDE.md` (24/44 px, texto ≥ 12 px) |
| 4 | **El salto a mes y año existe en todos los tamaños**, no solo en el compacto: es comportamiento, no tamaño (una fecha de nacimiento en el tamaño normal también lo necesita) | Heurística de eficiencia de uso; el contrato lo listaba como límite («sin vista de años ni de meses») |
| 5 | **El panel no cambia de tamaño al saltar** (A: los meses y los años ocupan la caja de los días; B y C: la cabecera tiene alto fijo). Medido en A: Δ 0,00 px al abrir los meses | #358 (paneles anclados estables), #281 |
| 6 | **Un tabstop por rejilla** (días, meses, años) con `tabindex` móvil; los días siguen como hoy (flechas, Inicio/Fin, RePág/AvPág, Mayús = año, Intro/Espacio) | APG *grid*; WCAG 2.1.1 |
| 7 | **Esc sube un nivel** antes de cerrar: años → meses → días → (popover) cerrar. El foco vuelve al control que abrió el nivel | APG (Esc cierra lo de arriba primero); WCAG 2.4.3 |
| 8 | **Anuncios:** el cambio de mes sigue en el título vivo; el cambio de vista se anuncia por la región `status` existente («Meses de 2026», «Años de 2022 a 2033»); sin región viva nueva | WCAG 4.1.3; #792 (sin regiones vivas de más) |
| 9 | **Textos nuevos solo en `labels`** (sin valor por defecto): `chooseMonth`, `chooseYear`, `prevYear`, `nextYear`, `prevYears`, `nextYears`, `viewMonths`, `viewYears`, `typeYear` (A); `laneYear`, `laneMonth` (B); `goTo`, `goHint` (C); `current`, `hasValue` (sufijos). Meses y años, con `Intl` y `locale` | #64 |
| 10 | **Movimiento** según la tabla única (#1002): entrada `--g-duration-press` + `--g-ease-out`; salida instantánea; con movimiento reducido, solo fundido `--g-duration-fast` + `linear` (#1019), sin escala ni desplazamiento suave | #1002, #1019; `rubrica-movimiento.md` |
| 11 | **Iconos solo Lucide** (`chevron-left/right/down`, `arrow-right`, `circle` relleno para las marcas). Ningún carácter pictográfico (verificado) | `icons.md`, #85 a #87 |
| 12 | **Marcas en meses y años:** aro = el actual (como «hoy»); relleno = el que contiene la fecha elegida (`single`); punto = contiene lo elegido sin estar elegido (rango, u otro año). Mismo lenguaje que los días, sin color como única señal | WCAG 1.4.1; coherencia con los estados de día |

## Los tres conceptos

### A · Zoom de escala

El título son **dos botones**, el mes y el año («Noviembre ⌄ 2026 ⌄», con `chevron-down` de Lucide). El mes abre los **doce meses en la misma caja** que ocupaban los días (rejilla 3 × 4); el año abre **doce años** (3 × 4, RePág/AvPág ±12). Bajar de nivel es acercarse: el mes elegido **se abre en sus días desde su propia celda** (escala 0,25 → 1 con origen en la celda); subir es alejarse hacia la pieza de la que vienes (2,4 → 1). En la rejilla de años, **escribir cuatro cifras salta al año** («1985»), con la pista «Escribe un año» y las cifras tecleadas visibles («19··»). Elegir un año baja a sus meses; elegir un mes, a sus días con el foco en el mismo día del mes (recortado si no existe).

- Teclado: Tab llega a «mes», «año» y la rejilla. En meses: flechas ±1/±3 (cruza de año), Inicio/Fin de fila, RePág/AvPág ±1 año, Intro elige, Esc vuelve a los días con el foco en el botón del mes. En años: flechas, RePág/AvPág ±12, cifras, Retroceso borra una cifra.
- Semántica: título `h3` con dos `button` cuyo nombre contiene el texto visible («noviembre, elegir mes», 2.5.3); meses y años como `role="grid"` con `gridcell` y `aria-selected`.
- Móvil: rejillas de 44 px; la hoja no cambia de alto.
- Coste: dos rejillas más y la animación con origen (WAAPI o clases con variables).

### B · Regla del tiempo

Sin título: **dos reglas que se deslizan**, años arriba (de `min` a `max`, o de hoy −100 a hoy +10) y **meses abajo, continuos entre años** (con la marca del año entre diciembre y enero). Un toque o una flecha **cambia el mes y la rejilla lo sigue al momento**; arrastrar la regla recorre los meses como hojear (al soltar, el mes centrado queda elegido y se anuncia). Lo elegido se ve aunque esté lejos: **la franja del rango se pinta en la regla de meses** (minimapa: noviembre y diciembre llevan la franja) y un punto marca el año que contiene la fecha.

- Teclado: tres paradas (año, mes, días). Cada regla es un `radiogroup` con selección que sigue al foco; ←/→, Inicio/Fin, RePág/AvPág ±10 años en la de años; Intro lleva el foco a los días.
- Arrastrar no es obligatorio (2.5.7): cada pieza visible es un objetivo de un toque.
- Coste: desplazamiento con ajuste, centrado del elegido, recorte por `min`/`max`, regla de años larga (110 botones; en el componente, virtualizada o por décadas). Alto: +2 filas (326 px frente a 288 de A).

### C · El salto dicho

El título **es un campo**: se escribe a dónde ir como se diría — «marzo», «mar 27», «3/2031», «1985», «dic», en el idioma de `locale` (los nombres salen de `Intl`, sin tildes ni puntos). Mientras se escribe, **la rejilla enseña ese mes** y una línea bajo el título dice cómo se ha leído («→ marzo de 2027», con `arrow-right` de Lucide), que es lo que desambigua («85» → 1985, «27» → 2027, «12» → diciembre). Intro confirma y deja el foco en el mismo día del mes nuevo; Esc lo deshace. **Desde los días basta con empezar a escribir**: la primera letra o cifra salta al título sin perderse. ↑/↓ en el título mueven un mes; RePág/AvPág, un año.

- Semántica: `input type="text"` con `aria-label` (`labels.goTo`) y `aria-describedby` a la línea de lectura; anuncio cortés diferido (600 ms) del mes interpretado.
- Reutiliza la idea (y si se elige, la utilidad) de «La hora dicha» de `GTimeField` (`utils/timeInput.js`).
- Débil en táctil: abrir el teclado del sistema tapa media hoja; en móvil seguiría necesitando flechas (o A) para no depender de escribir.
- Coste: intérprete por idioma (meses por prefijo, años de 2 y 4 cifras con siglo cercano).

## Comparativa

| | A · Zoom de escala | B · Regla del tiempo | C · El salto dicho |
| --- | --- | --- | --- |
| Ir a otro mes del año | 2 gestos | 1 gesto | 1 a 3 letras + Intro |
| Ir a 1985 desde 2026 | Año → «1985» → mes → día | Arrastrar años o RePág ×4 | «1985» + Intro |
| Alto del compacto (medido) | **288 px** (Δ 0 al saltar) | 326 px | 304 px |
| Tabstops | Mes, año, días | Año, mes, días | Título, días |
| Táctil | Bueno | **El mejor** | Flojo (teclado del sistema) |
| Lector de pantalla | Patrón conocido (rejilla) | Dos `radiogroup` | Campo + lectura viva |
| Se descubre | Alto | Muy alto | Bajo sin pista |
| Rango entre meses | Franja que sigue | **Minimapa en la regla** | Franja que sigue |
| Riesgo | Bajo | Medio (scroll, centrado, rendimiento de la regla larga) | Medio (idiomas y ambigüedad) |

**Recomendación de kiwi: A como forma**, con **las cifras de C dentro de la rejilla de años** (ya prototipado) y **la «franja que sigue»** en rango. Es la única que no añade alto al panel (cumple #358 sin excepciones), funciona igual con ratón, teclado, táctil y lector, y su personalidad (zoom con origen en la pieza) es espacial y útil: dice de dónde vienes y a dónde bajas. B es la más bonita en táctil pero añade dos filas y una regla larga que hay que virtualizar; su minimapa del rango puede volver como mejora de A en una segunda tanda. C, como forma principal, deja fuera a quien no sabe que se puede escribir y estorba en móvil; como acelerador (empezar a escribir desde los días) podría sumarse a A más adelante.

## Qué lo hace distinto

1. **Zoom semántico con origen en la pieza (A).** No es un cambio de vista que se funde en el centro: el mes que eliges se abre en sus días **desde su celda**, y al subir la rejilla se aleja hacia la pieza de la que vienes. Sirve para saber dónde estás en la jerarquía día · mes · año sin leer el título, y el panel **no cambia de tamaño** (Δ 0 medido), así que nada se mueve alrededor. Con movimiento reducido, solo fundido.
2. **Escribir el año en lugar de buscarlo (A + C).** En la rejilla de años, «1985» salta a 1985: la fecha de nacimiento deja de ser 40 pulsaciones de Mayús+RePág. Las cifras tecleadas se ven («19··»), así que el atajo se descubre al usarlo.
3. **La franja que sigue (base).** En un mes, un rango que continúa no «termina» falsamente en el borde: la franja se abre y se desvanece. Con un mes por defecto, es lo que hace que el rango no pierda información frente a los dos meses de hoy.
4. **Minimapa del rango en la regla (B).** El rango entero se ve en la regla de meses aunque la rejilla muestre solo uno.
5. **Empezar a escribir desde los días (C).** La primera letra salta al título sin perderse: el control se encuentra escribiendo, no buscándolo.

## Preguntas para el usuario

1. **Concepto:** ¿A · Zoom de escala (recomendado, con las cifras de año), B · Regla del tiempo o C · El salto dicho? ¿Alguna mezcla (por ejemplo A + minimapa de B, o A + escribir desde los días de C)?
2. **Un mes por defecto:** hoy `months="auto"` da dos meses en cualquier escritorio. Opciones:
   - **(a) `1` por defecto en `single` y en `range`** (recomendado); `auto` y `2` siguen disponibles. Cambia lo que ve quien hoy no escribe `months`: **`GBookingBar`** (sus `GDatePicker` con campo, líneas 495, 583 y 590 de `GBookingBar.vue`, hoy en `auto`) pasaría a un mes salvo que lima le fije `months="auto"` en su contrato (Δ 0 para la reserva); `GbAvailability01` ya escribe `months="auto"` (sin cambio). Es un cambio de comportamiento en `0.1.0-beta`: va al `CHANGELOG`.
   - (b) `1` en `single` y `auto` en `range` (los rangos de hotel siguen con dos meses).
   - (c) Dejar `auto` y documentar `months="1"`.
3. **Cómo se activa lo compacto:**
   - **(a) La superficie sigue `density`** (recomendado): hoy `density` solo cambia el campo, pero #977 ya dice que el panel en su sitio sigue la región de su disparador; con `compact`, celda × 0,75 (30 px, 44 táctil); `comfortable`, × 0,875. Sin prop nueva y coherente con el resto del sistema; consecuencia: en una región `data-g-density="compact"` el calendario también se compacta.
   - (b) Prop nueva solo del panel (`panelSize="sm|md"` o `appearance="compact"`): independiente de la densidad del campo, a costa de API nueva. `size` ya existe y es del campo: no se reutiliza.
4. **¿El salto a mes y año en todos los tamaños** (recomendado) **o solo en el compacto?**

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta |
| --- | --- | --- | --- |
| L1 | Defecto de `months` | Alta | Según la pregunta 2; si (a), fijar `months="auto"` en los `GDatePicker` de `booking-bar.md` para Δ 0 y nota en `CHANGELOG` |
| L2 | Salto a mes y año | Alta | Según el concepto elegido: vistas `days`/`months`/`years`, teclado (decisiones 6 y 7), clases nuevas (p. ej. `g-datepicker__title-part`, `__view`, `__pick`, `is-current`), evento `navigate` también al saltar (mismo payload) |
| L3 | Compacto | Alta | Según la pregunta 3; la celda sale de `--g-space-1 × 10 × densidad` con los mínimos fuera del tema; en táctil a 320 px el relleno lateral debe dejar sitio a 7 × 44 |
| L4 | Textos | Media | Claves nuevas de `labels` de la decisión 9 (solo las del concepto elegido); ninguna con valor por defecto; `viewMonths`/`viewYears` con marcadores `{year}`, `{from}`, `{to}` |
| L5 | Franja que sigue | Media | Clases `is-open-start`/`is-open-end` en la celda (sustituyen a `is-cap-*` en el borde visible cuando el rango continúa); solo con un mes |
| L6 | Límites | Media | Meses y años fuera de `[min, max]` como los días: tachados, `aria-disabled`, reciben foco, no se eligen. En B, la regla de años acaba en los límites |
| L7 | Contrato «Límites conocidos» | Baja | Quitar «sin vista de años ni de meses» cuando se construya |
| L8 | Tabla de movimiento | Baja | El zoom de A es un «cambio de vista dentro de un panel»: no tiene fila en `motion.json`. Proponer fila (entrada `press` + `ease-out`, origen en la pieza, salida instantánea, reducido = fundido `fast` + `linear`) o tratarlo como excepción con número |
| L9 | Peso | Media | Valorar con #506: dos rejillas y el intérprete de C no son pequeños; si no caben en el principal, medir antes de contratar |

## Hallazgos para coco (no verificados en el componente real)

- **Hoja móvil a 320 px con puntero grueso:** el CSS real pone `padding-inline: var(--g-space-4)` en la superficie de la hoja: 7 × 44 + 2 × 16 = 340 px > 320. En el prototipo compacto lo resolví bajando el relleno a `space × 1`; en el componente real **no lo medí** (el r01 solo verificó 375 px).
- La regla de B usa `mask-image` con `#000`/`transparent` como canal alfa (no es color de tema); si B se elige, coco decide cómo desvanecer los bordes.

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| 1.3.1 / 4.1.2 | Cumple en el prototipo | Rejillas con `gridcell` y `aria-selected`; `radiogroup`/`radio` en B; nombres completos de día, mes y año con sufijos |
| 1.4.1 Uso del color | Cumple | Aro, relleno, punto, tachado, franja; no solo color |
| 1.4.4 / texto ≥ 12 px | Cumple | Mínimo medido 12 px (caption) |
| 1.4.10 Reajuste | Cumple a 320 px | El compacto cabe en su sección a 320 px; táctil en hoja de 320 px |
| 1.4.11 Contraste no textual | Por diseño, sin medir | Reutiliza los pares del día (`{color}`, `{color}-text`, `border-control`); lo mide coco |
| 2.1.1 / 2.4.3 | Cumple | Un tabstop por rejilla; Esc sube un nivel y devuelve el foco (verificado en A) |
| 2.5.3 | Cumple | «noviembre, elegir mes» contiene «noviembre» |
| 2.5.7 Movimientos de arrastre | Cumple | En B arrastrar es opcional: cada pieza es un toque |
| 2.5.8 | Cumple | Objetivos ≥ 24 px (mín. medido 30 px con puntero fino; 44 px táctil) |
| 3.2.1 Al recibir el foco | Cumple | En B la selección sigue al foco dentro de un `radiogroup` (patrón APG) y solo cambia el mes a la vista, no el valor |
| 4.1.3 | Por diseño | Región `status` existente; título vivo |

## Comprobaciones ejecutadas

`verificar.mjs`, **384/384** en Chromium, Firefox y WebKit, con tema claro, oscuro, movimiento reducido y `lang=en`:
- un tabstop por superficie; texto ≥ 12 px; objetivos ≥ 24 px; solo iconos Lucide; nombre completo por día;
- hoy dos meses (720 px) frente a uno (390 px); la franja que sigue se abre en un solo extremo;
- compacto 236 px frente a 390, día 30 px;
- A: doce meses con el foco en noviembre, Δ 0 de alto, ↓ + Intro → 18 de febrero de 2027, «1985» en años, Intro baja a los meses de 1985, Esc vuelve con el foco en el botón del mes; zoom de 160 ms con origen; con movimiento reducido sin escala;
- B: → elige diciembre y la rejilla lo sigue, franja en la regla sobre noviembre y diciembre, RePág −10 años, un tabstop por `radiogroup`;
- C: escribir desde los días salta al título con la primera letra, lectura «marzo de 2031», Intro deja el foco en el 18 de marzo de 2031, intérprete («85», «1985», «3/27», «12», «dic», texto sin sentido), Esc deshace;
- 320 px con puntero fino sin desborde; hoja de 320 px con 44 px por día;
- sin errores de consola.
Capturas revisadas a ojo en claro y oscuro (A en días, meses y años; B; C escribiendo).

## Comprobaciones NO ejecutadas

- **Lector de pantalla real** (VoiceOver, NVDA): cómo suenan el título con dos botones, el cambio de vista y la lectura de C.
- **Táctil real** (el desplazamiento y el ajuste de B solo con ratón y teclado; `pointer: coarse` simulado con una clase).
- **Popover y hoja reales**: los conceptos se prototiparon en línea; abrir/cerrar, foco al abrir y Esc en dos niveles dentro del popover no se probaron.
- **RTL** (las flechas invierten en el motor; el espejo visual no se revisó), `forced-colors`, contraste medido de las marcas nuevas.
- Rendimiento de la regla de años de B con 110 botones en un dispositivo lento.
- `GBookingBar` con un mes por defecto (solo se leyó el código).

## Cumplimientos / Correcciones / Pendientes

- **Cumplimientos:** base funcional común, tres conceptos divergentes con tokens reales, comparativa, recomendación y preguntas; mínimos y movimiento reducido verificados en tres motores; sin tocar archivos de otros roles.
- **Correcciones durante la ronda:** el compacto medía todo el ancho (el `max-content` de la tabla al 100 %): se acotó como el popover real; la regla de B no centraba lo elegido (`offsetLeft` respecto a otro padre); la regla de meses de B pasó a ser continua entre años y perdió las flechas para ganar ancho; el táctil a 320 px no cabía con `space × 3` de relleno.
- **Pendientes:** elección del usuario (cuatro preguntas); después lima (L1 a L9), coco (hoja a 320 px, tabla de movimiento) y bruno.
