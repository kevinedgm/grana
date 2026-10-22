# Declaración — consulta de reserva (propuesta `GBookingBar`) y campo de grupo (propuesta `GPartyField`), r01

> kiwi, 2026-10-21. **Estado: en revisión** (la base se aprueba sola porque deriva de WAI-ARIA APG y WCAG 2.2; la forma es una pregunta de producto). Prototipo: `index.html?c=base|A|B|C&t=hotel|restaurante|tour` (`&dir=rtl`, `&theme=dark`, `&state=disabled`, `&w=<px>` ancho del escenario, `&today=YYYY-MM-DD`; por defecto hoy = 2026-11-02 y las noches del 6, 7 y 13 de noviembre están agotadas). `GDatePicker`, `GNumberField`, `GTimeField`, `GSelect`, `GRadioGroup` y `GBtn` **reales** de `packages/vue/dist/` con Vue global; la consulta, el campo de grupo, el popover, la frase, el muelle y el conserje son del prototipo (`booking.js`, `booking.css`, solo tokens del tema por defecto). Fotos: marcadores locales de `design/lab/marketing/r01/fotos.js`. Iconos solo Lucide (`design/lab/lucide-icons.js`). Verificación: `node design/lab/booking-bar/r01/verificar.mjs` (puerto 4233), **413 de 413** en Chromium, Firefox y WebKit. Brief, solapes y auditoría previa: `brief.md`. **Preguntas de producto: una (la forma).**
>
> **Nombres del prototipo → propuesta:** `.bk-bar` = `.g-booking-bar`, `LabParty` = `GPartyField` (`.g-party-field`), `.bk-pop`/`.bk-panel` = el popover interno del campo de grupo.

---

## Anatomía (base)

```
form.g-booking-bar  role="search"  aria-labelledby=<título>  novalidate     ← un solo landmark de búsqueda, con nombre
├─ h2.g-booking-bar__title                     ← «Consulta disponibilidad» (labels.title; nivel por prop)
├─ input[type=hidden] × n                      ← el estado con nombre (names): envío nativo GET al motor si la app pone action
├─ div.g-booking-bar__row   (si cabe en una fila)
│  ├─ [campo] GDatePicker range split | GDatePicker | GSelect | GTimeField | GNumberField    ← según la plantilla (fields)
│  ├─ [campo] GPartyField                      ← personas por tipo (popover no modal)
│  └─ GBtn type=submit                          ← acción única; aria-describedby → resumen
├─ div.g-booking-bar__compact (si no cabe)      ← la barra NO se parte: resumen + acción
│  ├─ button.g-booking-bar__summary  aria-haspopup="dialog"   ← «Tu consulta · 13–15 nov · 2 noches · 2 adultos» + «Cambiar»
│  └─ GBtn type=submit
├─ p.g-booking-bar__digest  id                  ← resumen legible (visible en fila; oculto accesible en compacto)
└─ GDialog (hoja)                               ← los mismos campos en línea (GDatePicker inline, filas del grupo a la vista)

GPartyField (primitiva aparte)
├─ span.g-party-field__label  id               ← etiqueta visible (rótulo oculto en la frase de A)
├─ button.g-party-field__trigger  aria-haspopup="dialog" aria-expanded aria-controls aria-labelledby="<label> <valor>"
│  └─ span#valor  «2 adultos · 1 niño · 1 habitación»
├─ div.g-party-field__panel  role="dialog" aria-label  popover="manual"   ← capa superior, colocada respecto al disparador
│  ├─ GNumberField steppers × filas (Adultos, Niños, Habitaciones; label + hint + min/max)
│  └─ GBtn «Listo»
└─ input[type=hidden] name[key] × filas
```

## Decisiones de la base

**Semántica y nombre**

1. **`role="search"` con nombre** en el `<form>` (APG *Landmark Regions*: una búsqueda de disponibilidad es «una facilidad de búsqueda»). Nombre = el título visible (`aria-labelledby`). Un solo landmark por consulta; el muelle de B **no** es landmark (duplicaría el nombre).
2. **Etiqueta visible por campo** (WCAG 3.3.2, 2.5.3). En el campo de grupo, el nombre del disparador = etiqueta + valor por `aria-labelledby` («Huéspedes 2 adultos · 1 habitación»), así el nombre contiene lo que se ve. Medido en los tres motores.
3. **Resumen legible** (`p` con id, `aria-describedby` del botón de envío): lo que la persona va a pedir, en palabras; con huecos, **nombra lo que falta** («Sin fechas · 2 adultos · 1 habitación») para que no parezca completo.

**Forma y adaptación**

4. **La barra no se parte en dos filas.** O cabe en una fila, o se vuelve **resumen + acción** y los campos se editan en una **hoja** (`GDialog`). Una barra a medio partir (dos campos arriba, dos abajo y el botón suelto) es la forma más rota de la composición a mano. La decisión **se mide** (la fila desborda su caja), con histéresis (guarda el ancho que necesitaba para volver), **sin puntos de corte literales** (#34). El cambio se aplica **fuera** de la llamada del `ResizeObserver` (en WebKit, cambiar la forma dentro produce el aviso «ResizeObserver loop»; medido y corregido).
5. **En la hoja, los campos van en línea** (`GDatePicker inline` con un mes, filas del grupo a la vista): en un modal no se abre otro popover (regla de `datepicker.md`).
6. **Ocultos con nombre siempre**, en fila y en compacto: el estado puede salir por envío nativo (`action`/`method` de la aplicación hacia su motor) sin escribir JS; el evento `submit` lleva el mismo dato como objeto.

**Validación y envío** (WCAG 3.3.1, 3.3.3, 4.1.3)

7. **Valida al enviar**, no al escribir. Mensaje en el campo que dice qué hacer («Elige las fechas de llegada y salida»), `aria-invalid` y **foco al primer inválido**; si lo marcado es un grupo (radiogroup), el foco va a su opción elegida o a la primera. En compacto, enviar incompleto **abre la hoja** con los errores y el foco en el primero. Un anuncio cortés resume lo que falta («Falta un dato: …»). Sin `GErrorSummary`: con dos o tres campos visibles a la vez, el resumen de errores duplica lo que ya está junto a cada campo (si la consulta crece, la regla de `GForm` manda).
8. **Noche agotada ≠ día de salida.** Una noche agotada **dentro** de la estancia es error con la fecha («No quedan habitaciones la noche del viernes, 6 de noviembre»); **salir** en un día agotado es válido (esa noche no se duerme). `GDatePicker` hoy deshabilita el día entero y no deja elegirlo como salida (B-L5).
9. **Objeto de intención** (lo único que emite): hotel `{ template, from, to, nights, guests: { adults, children }, rooms }`; restaurante `{ template, date, time, guests }`; tour `{ template, tour, date, guests }`. Fechas ISO sin zona (como `GDatePicker`). La aplicación decide si navega, abre WhatsApp o consulta su motor; mientras, pasa `pending` y el botón muestra `loading` con `loadingText` (región viva de `GBtn`). Medido: el objeto es exacto en las tres plantillas y en los tres conceptos.

**Campo de grupo** (APG *Disclosure* que abre un *dialog* no modal; *Spinbutton*)

10. **Es una primitiva aparte (`GPartyField`), no una pieza interna de la barra.** El mismo grupo aparece en el formulario completo de reserva, en la cotización de un tour y en la ficha de una habitación; dentro de la barra es un campo más. Compone `GNumberField steppers` por fila (cada fila con etiqueta, ayuda, `min`/`max`): **no** inventa un contador.
11. **Popover no modal en la capa superior** (`popover="manual"`), colocado respecto al disparador y recolocado al desplazar, dentro del visor (8 px de margen), arriba si abajo no cabe; nunca lo recorta un contenedor (#358). Abrir (clic, Enter, Espacio) lleva el foco al primer contador; **Esc** cierra y devuelve el foco; **salir con Tab** o **tocar fuera** cierra sin robar el foco; tocar el fondo del panel no lo cierra. En WebKit el Tab salta los botones y el foco puede irse al navegador: el cierre por Tab no puede depender solo de `relatedTarget` (medido y corregido).
12. **Reglas del grupo a la vista**: nunca más habitaciones que adultos (la cifra se corrige y la ayuda lo dice: «Hasta una por adulto»); adultos ≥ 1.
13. **Tres modos**: `popover` (por defecto), `inline` (filas a la vista: hoja, conserje) y disparador propio (slot `trigger`, como `GDatePicker`) para la frase de A.

**Accesibilidad transversal**

14. Foco visible en todo (`--g-focus-*`), área ≥ 24 px y 44 px con `pointer: coarse`, texto ≥ 12 px; valores con `dir="auto"` (#282); RTL lógico (el panel se alinea al borde inicial del disparador); `forced-colors` con borde del sistema; movimiento reducido según `tokens.md` §29.3.

## Estados

| Estado | Base | Cómo se ve y se oye |
| --- | --- | --- |
| Vacío | Campos con «Elige»; grupo con su valor por defecto (2 adultos, 1 habitación) | Resumen «Sin fechas · 2 adultos · 1 habitación» |
| Parcial | Lo elegido en cada campo | El resumen nombra lo que falta |
| Inválido | `aria-invalid`, mensaje bajo el campo, foco al primero, anuncio | Incluye la noche agotada con su fecha |
| Enviando | `GBtn loading` + `loadingText` («Consultando disponibilidad») | La aplicación lo controla (`pending`) |
| Enviado | La aplicación navega; en el prototipo, anuncio «Consulta lista: …» y el objeto en la lectura del laboratorio | — |
| Deshabilitado | Todos los campos y la acción con `disabled` | (Hallazgo: la navegación de mes de `GDatePicker` en línea sigue activa, B-L6) |
| Días no disponibles | `disabledDates`/`min` de `GDatePicker`: tachados, `aria-disabled`, en el orden de las flechas; tour: solo los días que sale | Restaurante: turnos llenos deshabilitados con «· lleno» en el texto (no solo el color) |
| Compacto | Resumen + acción; hoja con los campos | Esc cierra la hoja y el foco vuelve al resumen |

## Teclado y ARIA

| Pieza | Teclado | ARIA |
| --- | --- | --- |
| Consulta | Tab recorre campos y acción; Enter en la acción envía | `form role="search"` + `aria-labelledby`; acción `aria-describedby` → resumen |
| Campo de grupo | Enter/Espacio abre; ↑/↓ en cada contador (de `GNumberField`); Esc cierra y vuelve; Tab fuera cierra | Disparador `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`, `aria-labelledby="<etiqueta> <valor>"`, `aria-invalid`/`aria-describedby` con error; panel `role="dialog"` + `aria-label` |
| Resumen compacto | Enter abre la hoja | `aria-haspopup="dialog"`, `aria-expanded` |
| Hoja | Foco atrapado, Esc cierra, foco vuelve al resumen | `GDialog` (nombre = título) |
| Huecos de A | Como el disparador del grupo; el de fecha es el slot `trigger` de `GDatePicker` | Nombre = rótulo oculto + texto visible («Llegada ¿qué día?») |
| Respuestas de C | Tab entre respuestas, Enter responde; «Cambiar» reabre | Grupo de botones con nombre = la pregunta; título de pregunta `tabindex="-1"` |

---

## A · La frase

**Qué es.** La consulta **se escribe como se dice**: «Llego el **[lun 9 de nov]**, me quedo **[2 noches]** y somos **[2 adultos · 1 niño · 1 habitación]**.» Cada hueco es un botón subrayado que abre su editor (calendario real por el slot `trigger` de `GDatePicker`, contador de noches con la salida dicha en palabras, campo de grupo). Restaurante: «Mesa para **[2 personas]** **[hoy]** a las **[20:30]**.» con días rápidos y turnos como opciones (`GRadioGroup chip`, los llenos a la vista y deshabilitados). Tour: «Quiero ir a **[Monte Albán al amanecer]** el **[sáb 7 nov]** y somos **[2 adultos]**.»

### Qué lo hace distinto (A)

- **Noches en lugar de fecha de salida**: el huésped piensa «me quedo dos noches», no «salgo el miércoles 11»; la salida se dice debajo en palabras («Salida el miércoles, 11 de noviembre»). En la barra genérica hay que elegir dos fechas en el mismo calendario y contar noches de cabeza.
- **Es texto, así que refluye como texto**: a 320 px o con zoom 400 % la frase se parte en líneas y **no necesita forma compacta ni hoja** (medido: sin desplazamiento horizontal a 390 y 320). La barra genérica necesita una segunda interfaz en móvil.
- **Se lee igual con lector de pantalla**: en modo lectura la frase se oye entera y en orden, y cada hueco se anuncia con su rótulo y su valor.
- **Hueco vacío y hueco lleno se distinguen por forma** (subrayado discontinuo frente a continuo), no solo por color (1.4.1).

### Gana y arriesga

- **Gana:** cercanía de conserje (identidad para un hotel boutique), una sola forma para todos los anchos, menos cajas, lectura natural.
- **Arriesga:** el orden de los huecos depende del idioma (la frase tiene que ser una plantilla de la aplicación con marcadores, B-L3); descubrir que el subrayado es editable (mitigado con el chevrón y el cursor; a validar con personas); valores largos («Suite Jardín con terraza») hacen la frase larga. `GDatePicker` necesita una raíz en línea para vivir dentro de un párrafo (B-L7; el prototipo lo fuerza con CSS y queda un `div` dentro de un `p`).

## B · El muelle

**Qué es.** La barra de la base vive en el héroe; cuando la persona la deja atrás al leer, aparece **un muelle abajo** con el resumen («Tu consulta · 9–11 nov · 2 noches · 2 adultos · 1 habitación», «Cambiar») y la acción. «Cambiar» abre la hoja de la misma consulta y, al cerrar, el foco vuelve al muelle; la acción envía la misma intención. Mientras hay fechas, **las fechas viajan** a las ofertas: «Reservar Suite Jardín · 9–11 nov» (eso lo hace la aplicación con el resumen que la consulta expone).

### Qué lo hace distinto (B)

- La decisión de un huésped ocurre **al final** de la página (después de ver habitaciones, fotos y ubicación), no arriba: el muelle evita volver a subir y no pierde lo elegido.
- **No tapa lo enfocado** (2.4.11): publica su alto en `scroll-padding-block-end` y la página reserva el hueco; medido con el último botón de la página.
- Aparece y se va **sin robar el foco ni anunciarse**; oculto queda `inert`.

### Gana y arriesga

- **Gana:** conversión en móvil sin repetir la consulta; continuidad entre la consulta y las ofertas.
- **Arriesga:** un elemento fijo más en el borde inferior (compite con el FAB de WhatsApp, avisos y el navbar: necesita lugar en `edgeReserve`, B-L10); en pantallas bajas con zoom roba alto (aplicar el presupuesto del cuarto del chasis, #708–#716); movimiento ligado al desplazamiento.

## C · El conserje

**Qué es.** Una pregunta a la vez; lo respondido **queda como renglón** («Personas · 2 personas · Cambiar») y la siguiente aparece debajo. Restaurante: «¿Para cuántas personas?» (1–8 como respuestas) → «¿Qué día?» (hoy, mañana, los próximos días, «Otro día» abre el calendario) → «¿A qué hora?» (turnos, los llenos deshabilitados) → resumen y «Pedir mesa». Hotel: calendario de rango → «¿Quiénes vienen?» → acción. Tour: recorrido (tarjetas) → fecha (solo los días que sale) → personas.

### Qué lo hace distinto (C)

- **Respuestas en lugar de campos**: para el comensal con prisa, cada pregunta es un toque; no hay que abrir un desplegable de horas para descubrir que las 20:30 están llenas.
- **Lo respondido no desaparece**: el renglón deja ver y cambiar cada respuesta; cambiar una no obliga a repetir las demás (medido: vuelve directo al final).
- **El foco acompaña**: al responder, el foco pasa al título de la siguiente pregunta y se anuncia «2 personas. Siguiente: ¿Qué día?».

### Gana y arriesga

- **Gana:** la experiencia más guiada para quien no conoce el lugar y la mejor para el restaurante; botones grandes, una mano.
- **Arriesga:** más pasos para quien ya sabe lo que quiere; mover el foco tras responder roza 3.2.2 (*On Input*): se mitiga porque solo avanza con una activación explícita (un botón, un rango completo), **nunca con flechas**, y el patrón se anuncia al inicio («Tres preguntas. Puedes cambiar cada respuesta.»); ocupa mucho alto en el héroe (el calendario en línea).

---

## Comparativa

| | Base · Barra | A · La frase | B · El muelle | C · El conserje |
| --- | --- | --- | --- | --- |
| Forma | Cajas en una fila | Una frase con huecos | Base + muelle inferior | Preguntas que se apilan |
| Móvil | Resumen + hoja | **La misma frase, refluida** | Resumen + hoja + muelle | La misma, una columna |
| Hotel: fechas | Llegada y salida (dos fechas) | **Llegada + noches**, salida en palabras | Como la base | Calendario de rango |
| Restaurante: hora | `GTimeField` (escribir) | Turnos con llenos | Como la base | **Turnos como respuestas** |
| Pasos para enviar (hotel, con teclado) | 4 campos + acción | 3 huecos + acción | Como la base | 2 preguntas + acción |
| Identidad | Genérica (la de las agencias) | **Alta, de conserje** | Media | Media-alta |
| Riesgo principal | Ninguno nuevo | Idioma (plantilla de frase); raíz de `GDatePicker` | Borde inferior compartido; alto con zoom | 3.2.2 (foco que avanza); alto |
| Coste | Bajo | Medio | Bajo sobre la base | Medio |
| Combina con | B | B (el muelle puede llevar la frase corta) | Base o A | — |

## Recomendación

**Base funcional + A · La frase por defecto; la barra de la base como apariencia (`appearance="bar"`) para quien la prefiera; B · El muelle como opción combinable (`dock`); C · El conserje reservada.**

- **A por defecto** porque es la única que resuelve el móvil sin segunda interfaz y la que da identidad a un sitio boutique; lo que arriesga (idioma, raíz de `GDatePicker`) es contrato, no accesibilidad.
- **La barra** se queda porque es la base funcional (la misma semántica, validación e intención) y es la forma que esperan quienes vienen de una agencia en línea.
- **B como opción** porque su valor depende de la página (larga, con ofertas) y añade un elemento fijo que la aplicación debe decidir.
- **C reservada** (nombre: `appearance="guided"`), salvo que el restaurante sea la plantilla principal: allí es la mejor.

## Qué lo hace distinto (resumen)

Una consulta que **no se parte nunca** (o cabe, o se vuelve un resumen que abre la hoja), que **dice en palabras lo que vas a pedir y lo que falta**, que distingue **la noche agotada del día de salida**, cuyo contador de personas es **un campo de Grana** que sirve fuera de ella, que **no hace la reserva** sino que entrega una intención limpia, y que, en su forma por defecto, **se escribe como se dice** y refluye como texto a cualquier ancho.

## Rúbrica de movimiento (`docs/documentacion/rubrica-movimiento.md`)

Componente: consulta de reserva en un sitio de marketing; web, móvil y escritorio; toque, ratón, teclado; uso ocasional (una o pocas veces por visita). Evidencia = medido en `verificar.mjs`; inferencia = razonado.

| Dimensión | Base | A | B | C | Riesgo y recomendación |
| --- | --- | --- | --- | --- | --- |
| **A. Propósito** | **Cumple**: solo el chevrón gira al abrir (estado) | **Cumple**: igual | **Cumple**: el muelle entra desde el borde del que viene (evidencia: aparece al dejar atrás la barra) | **Cumple**: la pregunta nueva se funde (no se desliza) | — |
| **B. Comodidad visual** | **Cumple** | **Cumple** | **Cumple**: `duration-slow`, `ease-out`, una sola banda | **Cumple**: fundido de `duration-press` | — |
| **C. Estabilidad** | **Cumple**: el cambio a compacto es uno por cruce (histéresis medida) | **Cumple**: los huecos crecen con el texto; la frase refluye | **Parcial**: elemento fijo que aparece en la visión periférica al desplazar | **Parcial**: el contenido crece hacia abajo al responder | B: umbral = la barra entera fuera del visor; C: lo nuevo siempre debajo |
| **D. Transiciones** | **N/A** | **N/A** | **Cumple**: transición de `translate`/`opacity`, interrumpible al volver a subir (medido: se va e inerte) | **Cumple** (sin estado temporal) | — |
| **E. Control** | **Cumple** | **Cumple** | **Parcial**: la persona no pidió el muelle; lo devuelve subiendo | **Cumple**: avanza solo con activación explícita | B como opción de la aplicación |
| **F. Accesibilidad y opcionalidad** | **Cumple**: foco visible, Esc, 2.4.11 | **Cumple**: refluye a 320/400 % | **Cumple**: reducido = solo fundido (medido), foco nunca tapado (medido) | **Parcial**: foco que avanza (3.2.2, mitigado) | C: a validar con lector real |
| **G. Rendimiento** | **Cumple**: un `ResizeObserver` y la medida en un cuadro | **Cumple** | **Cumple**: `IntersectionObserver`, sin manejador de desplazamiento | **Cumple** | — |
| **H. Inmersión** | **N/A** | **N/A** | **N/A** | **N/A** | — |

---

## Hallazgos para lima

- **B-L1 · Componente, nombre y entrada.** Propuesta `GBookingBar` (alternativas: `GAvailabilitySearch`, `GQuickBook`). Compone `GDatePicker`, `GTimeField` (entrada propia), `GNumberField`, `GSelect`, `GRadioGroup`, `GDialog` y `GPartyField`: **entrada propia** (`@grana/vue/booking`), el margen del principal está agotado (#506, #550). Complejo según `CLAUDE.md` (compone dos o más, popover, motor de estado): coco y bruno en Opus.
- **B-L2 · `GPartyField` como primitiva.** v-model objeto (`{ adults, children, rooms }`, claves de la aplicación), `rows` `[{ key, label, hint, min, max, decrementLabel, incrementLabel }]` (el `max` puede depender de otra fila: habitaciones ≤ adultos), `mode` `popover`/`inline`, slot `trigger`, `name` → un oculto por fila (`name[key]`), `label`/`error`/`required` como `GInput`, mínimo publicado a `GFormRow` (#271). Reservado: `childAges` (muchos motores piden la edad de cada niño).
- **B-L3 · Textos sin valores por defecto (#226).** Título, etiquetas, resumen y plurales por tipo (`{ one, other }` con `Intl.PluralRules`), «Sin fechas», mensajes, anuncios. En A, **la frase es una plantilla de la aplicación** con marcadores (`{from}`, `{nights}`, `{party}`; `{party} {date} {time}` en restaurante): el orden de los huecos sigue al idioma.
- **B-L4 · Intención y envío.** Evento `submit` con el objeto (decisión 9), prop `pending` (la aplicación controla el `loading`), `fields`/`template` para la plantilla, `names` (mapa de nombres de los ocultos para el GET nativo al motor). La consulta no navega.
- **B-L5 · `GDatePicker`: noche agotada ≠ día de salida (enmienda de `datepicker.md`).** Para hoteles: un día agotado puede ser **salida** si la noche anterior está libre, y no puede estar **dentro** de la estancia. Propuesta: `disabledNights(iso)` en `range` (o `unavailable: 'night'`), `minNights`/`maxNights`. Hoy la aplicación tiene que validar con `change` (el prototipo lo hace al enviar) y no puede ofrecer la salida en un día agotado.
- **B-L6 · `GDatePicker inline disabled` deja activos «Mes anterior» y «Mes siguiente»** (medido en Chromium). El contrato dice que `disabled` la deshabilita entera: defecto para **bruno** o aclaración del contrato.
- **B-L7 · Raíz de `GDatePicker` con el slot `trigger`.** Es un bloque (`div`); dentro de una frase (`p`) es HTML no válido para el analizador. Propuesta: la raíz con `trigger` es un `span` (o `display: contents`) y el popover sigue en la capa superior.
- **B-L8 · Precios.** La consulta no muestra precios. Si la aplicación quiere el precio por día en el calendario usa el slot `day` de `GDatePicker` con su `Intl.NumberFormat`; un formato de moneda de Grana espera a la Fase 5 (#154).
- **B-L9 · Iconos.** El prototipo solo usa `calendar`, `users`, `chevron-down` y `x` (en la lista). Si se quiere icono para hora o recorrido, faltan `clock`, `ticket` o `map` en la lista de la librería (`icons.md`); no hacen falta para la base.
- **B-L10 · Muelle (B) en `edgeReserve`.** Si se elige B: entrada `EDGE_ORDER.bookingDock` (propuesta: por debajo de `fab`, que se aparta), alto publicado como `scroll-padding-block-end`, convivencia con el chasis (`GAppShell`) y su presupuesto del cuarto; patrón cercano al muelle de `GPageHeader` en estrecho (#630).
- **B-L11 · Regla de forma compacta** (decisión 4) para el contrato: medida con histéresis, sin puntos de corte, cambio fuera de la llamada del observador.
- **B-L12 · C (si se elige):** respuestas como botones (no radios: una flecha no debe responder), avance del foco solo con activación explícita, anuncio de la siguiente pregunta.

## Hallazgos para otros roles

- **bruno:** B-L6 (navegación de mes activa con `disabled`).
- **coco:** el subrayado de los huecos de A (discontinuo vacío, continuo lleno, sólido `danger-text` con error) y su alto táctil de 44 px con `pointer: coarse` en mitad de una línea de `title`: medir el interlineado (el prototipo usa `title-line × 1,25`).

## Pregunta para el usuario

**¿Qué forma quieres para la consulta de reserva?**
1. **A · La frase por defecto, la barra como apariencia y B · El muelle como opción** (recomendado): la consulta se escribe como se dice y refluye en el móvil; quien prefiera cajas usa la barra; la página larga puede llevar el muelle.
2. **La barra por defecto, A como apariencia y B como opción.**
3. **A por defecto y C · El conserje como apariencia** (para restaurantes), sin muelle.
4. **Solo la barra (base), sin conceptos.**

## Comprobaciones

`node design/lab/booking-bar/r01/verificar.mjs` · 2026-10-21 · puerto 4233 · Playwright de `design/lab/theme-playground` · resultado: **413 de 413 pasan** (Chromium 139/139 · Firefox 137/137 · WebKit 137/137; Firefox y WebKit no emulan `forced-colors`). Una pasada anterior se cortó por un tiempo de espera al abrir una página con la máquina cargada por otros agentes; repetida sin cambios, 413/413.

Qué mide: landmark de búsqueda con nombre; fila a 1440; envío vacío (errores esperados, foco al primer inválido, anuncio, sin envío); objeto de intención exacto en hotel, restaurante y tour; anuncio de consulta lista; ocultos con nombre; sin desplazamiento horizontal a 1440, 390 y 320; noche agotada dentro (error con fecha) y salida en día agotado (válida); campo de grupo (nombre = etiqueta + valor, Enter abre con foco dentro, panel en capa superior dentro del visor, flecha suma, Esc devuelve el foco, Tab fuera cierra, fondo del panel no cierra, toque fuera cierra, habitaciones ≤ adultos); compacto (resumen que nombra lo que falta, hoja modal con nombre y foco, Esc devuelve el foco, enviar incompleto abre la hoja y enfoca el error, histéresis al estrechar y ensanchar); RTL (sin desbordar, panel alineado o recolocado); A (tres huecos con nombre correcto, frase en orden, error y foco, salida en palabras, misma intención, refluye a 390 y 320, turnos llenos deshabilitados, panel dentro del visor a 390); B con y sin movimiento reducido (oculto e inerte, aparece con el resumen, sin `translate` en reducido, foco nunca tapado, ofertas con fechas, «Cambiar» abre la hoja y devuelve el foco, misma intención, se va al subir); C (una pregunta a la vez, foco y anuncio de la siguiente, llenos deshabilitados, foco al resumen final, «Cambiar» reabre, vuelve al final, misma intención, 390 y 320); deshabilitado en base, A y C; tema oscuro; `forced-colors` (Chromium); consola limpia en cada página.

**No verificado:** lector de pantalla real (nombres medidos por `aria-labelledby` y la región viva por su texto, no con VoiceOver ni NVDA; en particular la frase de A en modo lectura y el avance del foco de C); móvil y táctil reales (teclado virtual sobre la hoja, la hoja de `GDatePicker` en un teléfono, el muelle con la barra del navegador que se recoge); zoom real del navegador (simulado con 320 px); `forced-colors` en Firefox y WebKit; `GDialog` real para la hoja (el prototipo usa `<dialog>` nativo) y `GForm` real alrededor (validación propia del prototipo); idiomas distintos del español en la frase (solo se razona); `GCombobox` para listas largas de recorridos; el muelle junto a un `GFab` y un `GToaster` reales; el texto en español con `dir="rtl"` es un artificio (las ayudas de `GNumberField` sin `dir="auto"` se reordenan; con un idioma RTL real no pasaría).

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** una sola superficie con título, campos y acción (nada flota); jerarquía título del sitio › consulta › etiquetas › resumen; delimitación por borde de control y `forced-colors`; espaciado solo con tokens; reutiliza `GDatePicker` (incluido su slot `trigger`), `GNumberField`, `GTimeField`, `GSelect`, `GRadioGroup` y `GBtn` reales; etiquetas visibles o nombre = rótulo + valor; foco visible; validación con mensaje y foco al primero; estados vacío, parcial, inválido, enviando, enviado, deshabilitado y no disponible; sin desplazamiento horizontal a 1440, 390 y 320; RTL; movimiento reducido; consola limpia en los tres motores.

**Correcciones** (dentro de la ronda, sobre el prototipo): el panel del grupo quedaba recortado por la fila → capa superior colocada por el disparador; el aviso «ResizeObserver loop» de WebKit al cambiar de forma → cambio fuera de la llamada; Tab fuera del panel no cerraba en WebKit → comprobación del foco tras el evento; tocar el fondo del panel lo cerraba → se distingue el toque interior; el foco no llegaba a un grupo de radios inválido → va a su opción; la frase se partía por un bloque dentro del párrafo → el campo de grupo en la frase es en línea; dos etiquetas apiladas en las fechas («Fechas» sobre «Llegada/Salida») desalineaban la fila → sin la del grupo; el resumen parecía completo sin fechas → nombra lo que falta; noche agotada no validada → error con la fecha.

**Pendientes:** la elección del usuario (una pregunta); lima: contrato de `GBookingBar` y `GPartyField` (B-L1 a B-L4, B-L10 a B-L12) y enmiendas de `datepicker.md` (B-L5, B-L7); bruno: B-L6; coco: el subrayado de A; lo no verificado de arriba (lector, móvil, zoom y `forced-colors` reales, `GDialog`/`GForm` reales, otros idiomas).
