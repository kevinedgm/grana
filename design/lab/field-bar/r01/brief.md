# Brief — barra de campos (`GFieldBar`, nombre de trabajo), r01: base funcional y tres conceptos

> kiwi, 2026-10-13. Origen: idea del usuario (resumen fiel en el encargo del orquestador). Componente nuevo: base funcional (WAI-ARIA APG, WCAG 2.2 AA) **y** tres conceptos divergentes de forma y comportamiento (A/B/C) con los tokens reales del tema por defecto (CLAUDE.md, «Personalidad e innovación» y «conceptos antes que caja»).

## Para qué

Agrupar **campos de Grana que ya existen** (`GCombobox`, `GSelect`, `GDatePicker`, `GInput`, `GTimeField`, `GNumberField`…) y **una acción** (`GBtn`) en **una sola superficie** visual y funcional: buscador de vuelos (Origen · Destino · Salida · Buscar), filtro de catálogo (Categoría · Buscar «Nombre, código o descripción»), reservas, formularios compactos de una línea. Lo usan sitios públicos (portada con la barra sobre una imagen), administraciones (filtro encima de una tabla) y móvil (320px, dedo). Cada campo sigue siendo **una pregunta propia** con su etiqueta visible, su foco, su teclado y su mensaje; la barra solo decide cómo se ven y se reparten juntos.

## Por qué se llama así (carpeta `field-bar`)

| Candidato del usuario | Por qué no |
| --- | --- |
| `input-group` | **Ya existe y significa otra cosa**: `GInputGroup` es **un dato en varias partes** con **una** etiqueta (#177; teléfono país + número). Aquí hay **varios datos**, cada uno con su etiqueta. Reusar el nombre rompería #177, #397 y `form.md` §13 |
| `control-group` | Sugiere partes sin etiqueta (lo que hace `GInputGroup`); en ARIA, «group» es solo el rol de la raíz |
| `search-bar` | Demasiado estrecho: la misma primitiva sirve a reservas y formularios compactos. La **búsqueda es un uso** (con `role="search"`), no el componente (la decisión central del usuario: primitiva primero) |
| `field-composition` | Correcto pero abstracto; no dice que el resultado es **una barra** (una línea que se pliega) |

**`field-bar`** = varios **campos** (no partes) que se leen como **una barra**. Nombre de trabajo para lima; ver pregunta 3 de la declaración.

## Solapes revisados antes de proponer

| Componente | Qué comparte | Decisión |
| --- | --- | --- |
| `GInputGroup` (+ `Input`/`Select`/`Text`) | Caja compartida, partes fusionadas, un anillo por parte, `layoutKey` | **No se amplía.** Es un campo (un dato, una etiqueta, un mensaje, #177); aquí cada hijo es un campo completo. Sus partes son `<input>`/`<select>` sin caja; la barra admite `GCombobox`, `GDatePicker`… con paneles anclados. #397 prohíbe `GBtn` dentro. **Un `GInputGroup` entero sí puede ser un segmento** (teléfono en una barra de contacto) |
| `GFieldGroup` | Varias partes con etiqueta propia | **No.** Es `fieldset` + `legend` para **una pregunta** compuesta, siempre en su fila (#179); la reserva `joined` se retiró en #179. Aquí son preguntas distintas (Origen y Destino no son una) |
| `GFormRow` + `GFormLayout` | Campos distintos que van juntos, proporción que llena el ancho, **tres pistas** (etiqueta · caja · pie, #176), mínimos publicados (#271, #312) | **Es el pariente más cercano**: una barra es «una `GFormRow` con superficie compartida y una acción». Se **reutiliza su motor** (`formRowPlan.js`, `rowEngine.js`, `setIntrinsicMin`) para decidir si cabe en una línea; no se duplica. No se convierte en prop de `GFormRow` (mezclaría superficie, acción y semántica de búsqueda en una pieza del principal, #550) |
| `GAdaptiveLayout` | Reparto automático | Sin solape: no tiene superficie y deja aire al final (#361) |
| `GFilterBar` | «Barra» de filtros | **Frontera:** `GFilterBar` es **abierta** (reglas que el usuario agrega, chips, `filters` como datos, #111). La barra de campos es **cerrada**: campos fijos que la aplicación conoce. Una tabla puede tener las dos (búsqueda + filtros avanzados) |
| `GInput` slot `action` (#33) | Un campo + un `GBtn` acoplado | Para **un** campo + botón sigue siendo `GInput action`. La barra empieza en **dos campos** (aviso si hay uno) |
| `GCombobox` (`palette`) | Búsqueda con resultados | Es un **segmento** de la barra (Origen, Destino, Buscar). Su panel se ancla a su caja (#358) y en móvil abre su superficie, igual que fuera |
| `GDatePicker` | `anchor` y slot `trigger` **ya pensados para «la barra de búsqueda»** (datepicker r01, punto 18; `datepicker.md`) | La barra **ofrece su raíz como ancla** al selector de fechas que contiene (dos meses con el ancho de la barra), sin que la aplicación lo pase |
| Paneles anclados estables (#358) | `GSelect`, `GMenu`, `GDatePicker`, `GCombobox`… | Deben seguir funcionando dentro de la barra: la barra **no recorta** (`overflow` visible) ni crea un contexto de apilamiento que tape paneles; se mide en el prototipo con los componentes reales |
| `GSummary` | Resumen de una línea que cede | El concepto C pinta el resumen plegado con su lenguaje (cede por prioridad), sin copiarlo |
| `GDialog` (`mobile="sheet"`) | Hoja móvil | El concepto C la usa para editar en móvil; no se inventa otra hoja |
| `edgeReserve.js`, receta #515 | Capas fijas, cabecera fija | Lo flotante y lo fijo son **receta**, no prop (ver «Posicionamiento») |

## Lo que la ronda debe resolver

1. **Frontera** con lo anterior (arriba) y **dónde vive** (#550: margen del principal agotado → entrada propia por defecto).
2. **Cómo cede cada campo su caja** a la superficie sin que la barra conozca sus clases internas (precedente #395: un atributo puesto por cada componente, no una lista de clases ajenas).
3. **Etiqueta dentro del segmento** (arriba la etiqueta, abajo el valor) con la etiqueta **del propio campo** (no una segunda).
4. **Foco, hover, deshabilitado, solo lectura y error por segmento** sin romper el estilo de cada control; un mensaje por campo, debajo de su segmento.
5. **Responsive**: horizontal → vertical cuando no cabe, medido por la propia raíz (#130; `@container` no admite `var()`, #34); qué pasa en móvil.
6. **Posicionamiento**: qué entra en el componente (superficie que se apoya sobre otra) y qué es receta (fijo, pegajoso, superpuesto).
7. **Accesibilidad**: cada campo conserva etiqueta, nombre, teclado y semántica; la agrupación visual **no sustituye** etiquetas (3.3.2, 2.5.3); orden DOM = Tab = visual (1.3.2, 2.4.3); búsqueda como punto de referencia `search` con nombre.
8. **Validación**: combinaciones (2 a 5 campos, con y sin acción), tamaños, estados, anchos extremos (320 a 1440), fondos (superficie, `bg`, banda de color), RTL, movimiento reducido, sin tocar los componentes originales fuera de la barra.

## Qué es esta ronda

1. **Base funcional** (forma convencional, a propósito, con **neutros** del tema): campos en fila con su etiqueta **fuera** de la caja, cajas fusionadas (bordes compartidos, radios solo en los extremos), botón acoplado al final; columna cuando no cabe. Fija semántica, foco, mensajes y reparto, comunes a A, B y C.
2. **Tres conceptos** que cuestionan la premisa de «una caja con divisiones»:
   - **A · Costura**: una superficie; la etiqueta vive dentro del segmento; las costuras se abren alrededor del segmento activo, que **se eleva y gana ancho** para lo que se escribe. Cubre las dos apariencias del usuario (`joined` = píldora, `segmented` = bandeja de segmentos).
   - **B · Frase**: sin caja. La barra **es una frase** con huecos («Vuelo desde [Ciudad de México] a [Cancún] el [12 oct]»); las palabras son las etiquetas visibles; se pliega como un párrafo.
   - **C · Resumen que se abre**: en reposo, la barra es **su resumen** en una línea («MEX → CUN · 12 oct»); al tocar un dato se despliega en sitio (o en hoja en móvil) con todos los campos; al salir, se vuelve a recoger.
3. **Comparativa, recomendación y preguntas de elección.**

Ejemplos en los cuatro: vuelos (Origen · Destino · Salida · Buscar) y filtro (Categoría · Buscar «Nombre, código o descripción»).

## Entregables

- `index.html` (página única, `?c=base|A|B|C`, `?dir=rtl`, `?w=` ancho del marco, `?shape=pill|rounded|square`, `?appearance=joined|segmented`), `bar.js` (prototipo `XFieldBar` en Vue sobre los **componentes reales** de `dist/`), `bar.css` (base con neutros; A/B/C con los tokens reales del tema por defecto; la emulación del estado «unido» de cada campo está marcada como lo que se pedirá a coco en el CSS de cada campo).
- `verificar.mjs` (Playwright en Chromium, Firefox y WebKit, **puerto 4216**).
- `declaracion.md`: decisiones numeradas, «Qué lo hace distinto», comparativa, recomendación, comprobaciones, hallazgos L1… para lima y las preguntas de elección.

## Ver

`python3 -m http.server 4216` desde la raíz del repo (o el servidor de `verificar.mjs`) y abrir `/design/lab/field-bar/r01/index.html`. Requiere `packages/vue/dist` (`npm run build`) y `node_modules/vue`. Verificación: `node design/lab/field-bar/r01/verificar.mjs`.
