# Declaración de cumplimiento · GSelect · r02

**Estado:** aprobada. Extiende `r01` (aprobada y auditada) sin reabrir sus decisiones. Las decisiones de estructura y accesibilidad se derivan de estándares (patrón *select-only combobox* de WAI-ARIA APG, WCAG 2.2 AA). El usuario decidió el alcance: **fila «Agregar nuevo…» al final de la lista** (sin búsqueda ni escritura en el selector) y **prefijo en el selector + icono en cada opción** (sin sufijo).
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises.
**Siguiente dueño:** lima → actualizar `design/contracts/select.md` (props y slots nuevos, eventos, clases).

`con prefijo`, `con iconos en las opciones`, `valor con icono`, `solo prefijo`, `fila crear` en reposo, activa y en la hoja inferior (375px), `lista vacía + crear`, `lista larga (30) + crear al final`, `solo lectura` y `deshabilitado` (sin fila), texto largo con iconos, inválido con prefijo, selector al fondo (hacia arriba con fila crear).

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | La fila «Agregar nuevo…» es un `role="option"` (hijo directo del `listbox`, fuera de los grupos) con `aria-selected="false"`; **no** es un botón aparte dentro de la lista | El listbox solo admite `option` y `group`; un botón rompería el patrón APG y la navegación con `aria-activedescendant`. La diferencia con las opciones es visual (línea superior, «+», peso) y de comportamiento (no se elige) |
| 2 | Es la **última fila navegable**: ↓ llega a ella; Fin va a ella (verificado: `ArrowDown`, `End` → «Agregar nuevo cliente…» activa) | Consistente con «Fin = última opción»; la acción queda siempre a mano |
| 3 | Enter o Espacio con la fila activa (y el clic) **cierra la lista, no cambia el valor, devuelve el foco al selector y emite `create`** (verificado con Enter real: valor sin cambio y foco en el botón; luego la app agrega y elige) | El valor solo lo cambia la aplicación; control y libertad del usuario |
| 4 | **Tab** con la fila activa cierra **sin crear** (verificado: no se creó nada) | Una acción no se dispara por pasar de largo; las opciones sí se eligen con Tab, la acción no |
| 5 | **Esc** cierra sin hacer nada | Igual que en `r01` |
| 6 | La fila **no participa en la escritura rápida** (verificado: «a», «g» no la alcanzan) | Buscar por letras debe llevar a opciones reales |
| 7 | Con la lista vacía, se ve el mensaje vacío y **debajo** la fila crear, activa por defecto (verificado); con `readonly` o `disabled` no hay lista ni fila (verificado) | Salida para el usuario que no encuentra nada |
| 8 | Prefijo: icono decorativo (`aria-hidden`) **dentro del botón**, antes del valor | El área de clic sigue siendo todo el botón; mismo criterio que `prepend` de `GInput` |
| 9 | Icono de opción: decorativo (`aria-hidden`) antes del texto de cada opción **y** junto al valor mostrado; **el icono de la opción elegida sustituye al prefijo** (una sola posición inicial; verificado: con opción elegida con icono se oculta el prefijo, sin icono se mantiene) | Dos iconos seguidos (prefijo + icono de la opción) se ven recargados; el prefijo es el icono por defecto del campo |
| 10 | Los iconos **no cambian el nombre accesible**: sigue siendo etiqueta + texto del valor (verificado: `aria-labelledby` = etiqueta + botón; 100% de los iconos con `aria-hidden`) | WCAG 4.1.2, 2.5.3 |
| 11 | Los iconos los pone la aplicación con slots: `prepend` (sin alcance) e `icon` (alcance `{ option }`, para la lista y el valor) | Grana no trae iconos |
| 12 | En la hoja inferior (375px) la fila crear mide 44px y las opciones con icono también (verificado); sin desborde horizontal | WCAG 2.5.8, 1.4.10 |
| 13 | El texto de la fila (`createLabel`) lo da la aplicación, **sin valor por defecto**, y se recomienda explícito («Agregar nuevo país…») | Internacionalización; un lector de pantalla la anuncia como una opción más («Agregar nuevo…, opción 7 de 7») |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.3.1 Información y relaciones | Cumple | La fila es `option` del `listbox`; los iconos son decorativos |
| WCAG 1.4.1 Uso del color | Cumple | La fila se distingue por la línea superior, el «+» y el peso, no solo por el color |
| WCAG 1.4.10 Reajuste | Cumple | 375px sin desborde; texto largo con iconos recortado o partido |
| WCAG 2.1.1 Teclado | Cumple | ↓, Fin, Enter y Tab verificados con teclado real |
| WCAG 2.4.3 Orden del foco | Cumple | Tras crear, el foco vuelve al selector |
| WCAG 2.5.8 Tamaño del objetivo | Cumple | Fila y opciones de 44px con `pointer: coarse` |
| WCAG 4.1.2 Nombre, función, valor | Cumple por diseño, sin confirmar con lector real | Roles y estados ARIA del APG; iconos `aria-hidden` |
| Heurística: control y libertad | Cumple | Crear no altera el valor; Esc y Tab no crean |
| Heurística: consistencia | Cumple | Prefijo como en `GInput`; mismas alturas y estados que `r01` |

## Comprobaciones ejecutadas

- Chromium, `localhost:4174`. Sin errores en consola.
- Teclado real: ↓ (abre), Fin (fila crear activa), Enter (`create`, sin cambio de valor, foco en el botón).
- Simulación de la aplicación: al recibir `create`, agrega «Cliente nuevo N» a `options` y actualiza el valor; la lista pasa de 5 a 6 filas y el selector muestra el valor nuevo.
- Tab sobre la fila (no crea), escritura rápida (no llega a la fila), ratón sobre la fila (se vuelve activa), lista vacía + crear, `readonly` sin fila, prefijo/iconos, hoja inferior a 375px.

## Comprobaciones NO ejecutadas

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): cómo anuncia la fila crear como opción, el orden de los iconos y `aria-activedescendant` en la hoja.
- Contraste, movimiento reducido y colores forzados de la fila y de los iconos: lo audita coco con el tema real.
- **Diálogo de la aplicación tras `create`** (dónde vuelve el foco al cerrarlo): lo resuelve la aplicación; el selector devuelve el foco al botón antes de emitir.
- Firefox y Safari.

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | Cómo se pide la fila | Alta | Prop `createLabel` (String, **sin valor por defecto**); sin ella, no hay fila. Evento `create` (sin payload) |
| 2 | La fila en el modelo | Alta | Es un `role="option"` con `aria-selected="false"`, sin `value`, fuera de los grupos, siempre la última; no entra en `options` ni en el typeahead ni en el `modelValue` |
| 3 | Prefijo | Media | Slot `prepend` (sin alcance): icono decorativo (`aria-hidden`) dentro del botón, antes del valor; clase `g-select__prepend` |
| 4 | Icono de opción | Media | Slot `icon` con alcance `{ option }`, usado en cada opción (`g-select__icon`) y junto al valor mostrado; el icono de la opción elegida sustituye al prefijo |
| 5 | Interacción del `option` slot | Baja | `option` sigue siendo el slot de contenido completo; `icon` solo añade el icono delante del texto (si se usa `option`, el consumidor pone su icono) |
| 6 | Teclado | Media | Fin y ↓ alcanzan la fila; Enter/Espacio/clic la activan; Tab y Esc no crean; el typeahead no la considera |
| 7 | Clases | Baja | `g-select__prepend`, `g-select__icon`, `g-select__create` (la fila, además de `g-select__option`), `is-active` también en ella |
| 8 | `readonly`, `disabled` | Baja | No hay lista, luego no hay fila |
| 9 | Foco tras `create` | Media | El selector devuelve el foco a su botón **antes** de emitir `create`; después la aplicación decide |
| 10 | Diálogos de la aplicación | Baja | Un `GDialog` abierto desde `create` devuelve el foco a quien lo tenía (el botón del selector) al cerrarse (nativo) |
