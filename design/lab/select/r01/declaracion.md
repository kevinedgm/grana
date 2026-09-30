# Declaración de cumplimiento · GSelect · r01

**Estado:** aprobada. Las decisiones de estructura y accesibilidad se derivan de estándares (WCAG 2.2 AA y el patrón *select-only combobox* de WAI-ARIA APG). El usuario decidió el alcance: **lista propia (listbox), selección única con campo completo** (sin múltiple ni búsqueda) y **hoja inferior en móvil**.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises.
**Siguiente dueño:** lima → `design/contracts/select.md`.

`cerrado`, `abierto`, `hover`, `focus-visible`, `disabled`, `readonly`, `invalid` con error, `loading`, con valor, con placeholder, con `clearable`, `soft`, tamaños `sm`/`md`/`lg`; lista con grupos, opción deshabilitada, 40 opciones con scroll, hacia arriba, vacía, texto largo y hoja inferior (375px).

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | Patrón *select-only combobox*: `<button role="combobox" aria-haspopup="listbox" aria-expanded aria-controls>` y `<ul role="listbox">` con `<li role="option" aria-selected>` | APG; un `<button>` admite el rol `combobox` y da Enter/Espacio nativos; WCAG 4.1.2 |
| 2 | **El foco no sale del selector:** la opción activa se indica con `aria-activedescendant` (verificado: el foco sigue en el botón con la lista abierta) | APG; evita perder el contexto |
| 3 | Nombre accesible = etiqueta + valor mostrado (`aria-labelledby` = etiqueta y el propio botón) | WCAG 4.1.2, 2.5.3; lo que el usuario ve es lo que se anuncia |
| 4 | Abrir con clic, Enter, Espacio, ↓, ↑ o Alt+↓; al abrir, la activa es la elegida o la primera habilitada | APG; WCAG 2.1.1 |
| 5 | Con la lista abierta: ↓ ↑ (saltan deshabilitadas y encabezados: verificado, Francia → Italia), Inicio, Fin, Re Pág y Av Pág (10), Enter elige, **Esc cierra sin cambiar y el foco sigue en el selector** (verificado), Tab elige la activa y sigue el orden (verificado: "Alto" y el foco pasa al siguiente campo) | APG; consistente con el `<select>` nativo |
| 6 | *Typeahead*: un carácter imprimible abre la lista y mueve la activa a la siguiente opción con ese prefijo; varias letras (< ~500ms) forman el prefijo (verificado con teclado real: "c", "o" → Colombia) | APG |
| 7 | La lista es un `popover="manual"` en la **capa superior**, anclada al selector con su ancho mínimo (verificado: 308px ambos); no la recorta ningún `overflow` ni queda bajo un `<dialog>` | Evita atrapar la lista dentro de contenedores y diálogos |
| 8 | Hacia arriba si no cabe debajo y hay más sitio arriba (verificado: el selector fijo al fondo abre la lista sobre él); alto máximo con scroll interno y la activa siempre visible (verificado en 40 opciones: 320px, la última visible) | Usabilidad |
| 9 | Cierre: clic fuera, clic en una opción (la elige), Esc o Tab. Una opción deshabilitada **no se elige y no cierra** (verificado) | Control y libertad; `aria-disabled` |
| 10 | Grupos con `role="group"` y `aria-labelledby` del encabezado; el encabezado no es una opción | WCAG 1.3.1 |
| 11 | La elegida se marca con ✓ y peso; la activa con relleno y contorno; la deshabilitada con opacidad y tachado: **ninguna depende solo del color** | WCAG 1.4.1 |
| 12 | `<input type="hidden">` con `name` y el valor para formularios nativos | El botón no envía valor |
| 13 | `readonly` = `aria-readonly="true"`: enfocable, no abre (verificado con clic y con ↓). `disabled` = atributo nativo del botón. `loading` = `aria-busy` y anillo, sin bloquear | Semántica; mismo criterio que `GInput` |
| 14 | `clearable`: botón aparte, con nombre propio, solo con valor; devuelve el foco al selector (verificado) | WCAG 4.1.2, 2.4.3 |
| 15 | Ayuda y error se enlazan con `aria-describedby`; el error va en región viva con marca ⚠ | WCAG 1.3.1, 3.3.1, 4.1.3, 1.4.1 |
| 16 | Móvil (≤ ~520px): la lista es una **hoja inferior** pegada abajo con fondo (`::backdrop`), esquinas superiores redondeadas y la misma lista y teclado; opciones y selector de 44px (verificado a 375px) | Requisito del usuario; WCAG 2.5.8 |
| 17 | El valor mostrado se recorta con elipsis; las opciones parten palabras largas (`overflow-wrap: anywhere`) | WCAG 1.4.10 |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.3.1 Información y relaciones | Cumple | `role` combobox/listbox/option/group; etiqueta asociada |
| WCAG 1.4.1 Uso del color | Cumple | ✓, contorno y tachado |
| WCAG 1.4.10 Reajuste | Cumple | 375px sin desborde; valor con elipsis |
| WCAG 2.1.1 Teclado | Cumple | Todo el flujo con teclado real (ver decisiones 4 a 6) |
| WCAG 2.4.3 Orden del foco | Cumple | Foco fijo en el selector; Tab sigue el orden |
| WCAG 2.5.8 Tamaño del objetivo | Cumple | 44px con `pointer: coarse` (verificado con emulación táctil) |
| WCAG 4.1.2 Nombre, función, valor | Cumple por diseño, sin confirmar con lector real | Roles y estados ARIA del APG |
| WCAG 4.1.3 Mensajes de estado | Cumple por diseño, sin confirmar con lector real | Región del error presente antes del cambio |
| Heurística: control y libertad | Cumple | Esc, clic fuera y `clearable` |
| Heurística: consistencia | Cumple | `variant` (`outline`, `soft`), `size`, `density`, `disabled`, `readonly`, `loading` y anatomía de `GInput` |

## Comprobaciones ejecutadas

- Chromium, `localhost:4174`. Sin errores en consola.
- Teclado real: ↓ (abre y navega), Enter, Esc, Tab, "c" "o" (typeahead).
- Clics: en una opción, en una deshabilitada, fuera, en el botón de limpiar; `readonly` y `disabled`.
- Geometría: ancho de la lista igual al de la caja; lista hacia arriba; 40 opciones con scroll; lista vacía; texto largo con elipsis; hoja inferior a 375px (375px de ancho, 44px de opciones y selector, fondo).

## Comprobaciones NO ejecutadas

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): anuncio del combobox, la opción activa (`aria-activedescendant`), grupos y el error. **Riesgo conocido:** en lectores táctiles de móvil (exploración por toque) `aria-activedescendant` puede no exponer las opciones de la hoja; si falla, la alternativa es mover el foco real a la lista en móvil.
- **Hoja inferior con el teclado virtual** y un dispositivo táctil real.
- `forced-colors`, `prefers-reduced-motion`: el estilo final es de coco.
- Contraste: no aplica a un wireframe; lo audita coco con el tema real.
- Firefox y Safari (`popover`, `::backdrop`, `:popover-open`).

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | `variant` | Media | Subconjunto `outline` y `soft`, como `GInput` |
| 2 | Cómo se dan las opciones | Alta | Prop `options`: arreglo de `{ value, label, disabled? }` y de grupos `{ label, options }`. `value` String o Number; `label` String |
| 3 | Valor | Alta | `modelValue`: el `value` de la opción elegida; `null` o sin coincidencia muestra el `placeholder`. Sin `multiple` |
| 4 | Textos sin valor por defecto | Alta | `placeholder`, `clearLabel` (nombre del botón de limpiar; sin él no se muestra) y `emptyText` (lista vacía; sin él, una lista vacía no muestra mensaje); Grana es internacional |
| 5 | `name` y formularios | Media | `name` (String) crea el `<input type="hidden">`; el resto de atributos va al botón (`aria-*`, escuchas) |
| 6 | Cierre y eventos | Media | Eventos: `update:modelValue`, `open` y `close`. Sin `change` propio (el `<input type="hidden">` no lo emite) |
| 7 | Contenido de la opción | Baja | Slot con alcance `option` `{ option, selected, active }` y slot `value` `{ option }`; sin interactivos; decorativo si es icono |
| 8 | `loading`, `readonly`, `disabled` | Baja | Como `GInput` (no bloquea, `aria-readonly`, nativo) |
| 9 | Umbral móvil | Baja | Consulta de medios literal (~520px), la misma excepción de DECISIONS.md #42 |
| 10 | Superficie de la lista | Media | Usa el sistema `--g-surface-*` de `GDialog` para carcasa/inset de la hoja inferior, y `--g-shadow-2` para la lista flotante; lo decide coco |
| 11 | Lector táctil en móvil | Media | Verificar en la auditoría; alternativa: foco real en la lista en móvil |
