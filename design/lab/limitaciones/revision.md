# Revisión de «Limitaciones conocidas» · 47 README de componentes

**mora-docs · 2026-10-18 · Modo: M0 Auditoría documental + M3 corrección** — porque la sección 12 del contrato (`docs/documentacion/contrato.md`: «límites medidos, motores, lo no verificado y lo reservado con su decisión») se había quedado con viñetas caducadas tras decisiones posteriores (hasta la #674) y con «por verificar» que se podían medir.

## Qué se hizo

Se leyeron las **360 viñetas** de `## Limitaciones conocidas` de los 47 README (20 README no tienen la sección: componentes de forma o partes de otro, como `GFormRow`, `GWidgetGrid`, `GStatusMark`; `GFilterBar` la lleva como párrafo) y se clasificó cada una:

| Clase | Criterio | Qué se hizo |
| --- | --- | --- |
| **(a) límite de alcance decidido** | reservado o aceptado con su número de `DECISIONS.md` | se queda |
| **(b) sin verificar, solo en entorno real** | lector de pantalla, Safari real, móvil o táctil real, `forced-colors` de Windows, zoom real, motores reales | se queda; coincide con `PENDIENTES.md` §7 |
| **(c) caducada** | resuelta por una decisión, un componente o una medida posterior | se quita, o se reescribe con la cifra y el enlace a la evidencia |
| **(d) «por verificar» automatizable** | Firefox y WebKit con Playwright, `prefers-reduced-motion` emulado | se midió en `design/lab/theme-playground` (puerto 4212) y pasó a `medido` |

Solo se tocaron README (y un spec nuevo). Ningún CSS ni `.vue`. Un defecto real nuevo fue a `PENDIENTES.md` §6 (`GFormFold`, `letter-spacing` de la descripción; coco).

## Mediciones (nivel `medido`)

Todo sobre el `dist/` del 2026-10-18 11:35, servido con `python3 -m http.server 4212` en la raíz, Playwright 1.63, `--workers=2`, Node 20.20.2 de la máquina (el repo pide 22; Playwright no lo exige). WebKit es el motor de Safari, no Safari.

| Spec | Chromium · Firefox · WebKit | Qué cierra |
| --- | --- | --- |
| **`tests/limitaciones.spec.mjs` (nuevo)** | 6 · 6 · 6 = **18/18** | cristal de `GBadge` (`backdrop-filter`, velo con alfa ≥ 0,55, brillo); marca de `GCheckbox` (icono dentro del cuadro, `clip-path` de `inset(0 100% 0 0)` a `inset(0)`); pulgar de `GSwitch` (recorrido, marca que lo acompaña, espejo con `dir="rtl"` por `:dir()`); tirador y anillo por `:has()` de `GTextarea`; pivotes `transform-box: fill-box` de `GAvatarMotion` (centro Δ ≤ 0,5 px al respirar y parpadear); **`prefers-reduced-motion` emulado** sobre 12 componentes (`GCheckbox`, `GCheckboxGroup`, `GSwitch`, `GInput`, `GTextarea`, `GSelect`, `GDatePicker`, `GCalendar`, `GSidebar`, `GDialog`, `GStepper`, `GHelper`): con `reduce` cargado como preferencia, 0 transiciones y 0 animaciones de movimiento en sus elementos y en sus paneles de la capa superior; sin la preferencia, los mismos declaran movimiento (así se sabe que el bloque cambia de verdad). Las transiciones de `translate` de B2 de `GBtn` dentro de `GInput`/`GDatePicker` quedan en su identidad con `reduce` y se informan como inertes |
| `tests/library.spec.mjs` | 15 · 15 · 15 | el playground entero sin errores de consola en los tres motores; menú, diálogo modal, `GSelect` (listbox), checkbox y switch, `GStepper` «Siguiente», `GHelper` (popover), tema oscuro, `GTabs`, `GCard`, `GToaster`, `GForm`, `GDivider`, `GIcon` |
| `tests/panel-estable.spec.mjs` | 16 · 16 · 16 | `GSelect`, `GMenu`, `GDatePicker`, `GHelper`, editor de `GFilterBar`, `GCombobox`: lado y alto estables, cierre al salir el ancla |
| `tests/page-header.spec.mjs` | 19 · 19 · 19 | `GPageHeader` (el README decía «pasada en los tres motores pendiente») |
| `tests/table-page-size.spec.mjs` | 10 · 10 · 10 | filas por página de `GTable` + `GPagination` (pie acoplado, fila ancla, 360 px) |
| `tests/table-load.spec.mjs` | 9 · 9 · 9 | carga, error con `retry` y vacío de `GTable` |
| `tests/sidebar-asiento.spec.mjs`, `sidebar-activo.spec.mjs`, `sidebar-pista.spec.mjs` | 4+1+6 por motor | asiento, `is-rep`, cortes, pista del riel de `GSidebar` |
| `tests/radio-group.spec.mjs` | 8 · 8 · 8 | roles, estados y teclado de `GRadioGroup` |
| `tests/zone.spec.mjs` | 41 · 41 · 41 | zona de marca de `GSurface` |
| `tests/form-section.spec.mjs` | 9 · 9 · 9 | `is-actions-below` sin parpadeo (1280 ↔ 720, `MutationObserver`) tras `c1d0af4` |
| `tests/summary.spec.mjs` | 9 · 9 · 9 | `GSummary` tras `001c1e3` (la auditoría de coco era anterior) |
| `tests/form-fold.spec.mjs` | 7 · 7 · 7 | `GFormFold` (el README solo tenía Chromium y WebKit) |
| `tests/form-reveal.spec.mjs` | 6 · 6 · 6 | `GFormReveal` |

Totales: lote 1 **382 pasan, 5 omitidas por diseño del spec, 0 fallan (27,2 min)**; lote 2 **93/93 (6,7 min)**; `limitaciones` **18/18 (2,1 min)**. Un primer intento del lote 1 falló en Firefox y WebKit por `NS_ERROR_CONNECTION_REFUSED`: el `webServer` de Playwright se cayó a mitad; se repitió con un servidor propio en el 4212 (regla de «un solo proceso por puerto» de `CLAUDE.md`).

**Lección del spec nuevo:** cambiar `prefers-reduced-motion` **en caliente** con `page.emulateMedia` deja en WebKit una transición `transform` viva en `g-stepper__indicator`; cargando la página ya con la preferencia (`browser.newContext({ reducedMotion })`, que es lo que hace el sistema) los tres motores dan 0. El spec mide así.

## Resumen por componente

«Quedan» = viñetas que siguen (a o b, incluidas las reescritas). «Quitadas» = caducadas que ya no son límite. «Medidas» = viñetas que pasaron de «por verificar» a `medido` o se reescribieron con evidencia.

| Componente | Antes | Quedan | Quitadas | Medidas / reescritas | Notas |
| --- | --- | --- | --- | --- | --- |
| GAccordion | 13 | 12 | 1 | — | hallazgo 1 (`--_head-size` en `GDialog`) resuelto en `4343069` y re-medido por coco (48/60 y 57/72 px, Δ ≤ 0,05 px): no es límite |
| GAdaptiveLayout | 0 | 0 | — | — | sin sección (los límites van en el contrato) |
| GAvatar | 12 | 12 | — | — | todo (a) o (b); `GAvatarGroup` reservada |
| GAvatarMotion | 3 | 4 | — | 1 | `transform-box` medido en tres motores; queda Safari real y móvil |
| GBadge | 7 | 7 | — | 2 | «componente aparte» → `GTag`; cristal medido en tres motores |
| GBreadcrumbs | 10 | 10 | — | — | (a) con #505, #522, #523 |
| GBtn | 5 | 5 | — | — | ya estaba todo medido (`btn-limitaciones.spec.mjs`) |
| GCalendar | 7 | 7 | — | 1 | reduced motion medido; Firefox/WebKit solo montaje sin errores (declarado así) |
| GCard | 7 | 6 | 1 | 1 | chevron ya se renderiza (`GCard.vue` 558/588); `GCardGroup` y `GAvatar` existen (#603–#611) |
| GCardGroup | 9 | 9 | — | — | (a) #608, #609, #611 y (b) |
| GCheckbox | 6 | 6 | — | 3 | marca medida en tres motores; detalle condicional → `GFormReveal`; reduced motion medido |
| GCheckboxGroup | 5 | 5 | — | 1 | reduced motion medido |
| GCombobox | 16 | 16 | — | — | orden de cesión por anfitrión sigue abierto (lima; `PENDIENTES.md` §3) |
| GDatePicker | 9 | 9 | — | 2 | franja del rango: resuelta por #89 (bordes `border-control`), reescrita con su porqué; popover medido (`panel-estable`), reduced motion medido; #563 sigue abierto |
| GDialog | 10 | 10 | — | 1 | reduced motion medido; peso de los niveles sigue sin cifra (bruno) |
| GDivider | 4 | 4 | — | — | (a) #194 y (b) |
| GEmpty | 7 | 7 | — | — | (a) #543, #553 |
| GFileField | 12 | 12 | — | — | el trozo de cifra en `GSummary` sigue en `PENDIENTES.md` (coco) |
| GFilterBar | párrafo | párrafo | — | 1 | editor medido en tres motores (`panel-estable`) |
| GForm | 6 | 6 | — | — | fases pendientes (a) |
| GFormFold | 4 | 4 | — | 2 | Firefox medido (7/7); H1 pasa a coco y a `PENDIENTES.md` |
| GFormReveal | 7 | 7 | — | 1 | «pendiente de coco ajustar el verificador» ya hecho en `ece7e04` |
| GFormSection | 9 | 9 | — | 2 | Ctrl+F: #487 lo adopta en un segundo paso; consola de Firefox cubierta por `form-section.spec.mjs` en tres motores |
| GHelper | 5 | 5 | — | 2 | `GAvatarMotion` existe (ya va en el `trigger`); popover medido en tres motores |
| GIcon | 7 | 7 | — | — | `IconName = string` sigue sin autocompletado (a) |
| GInput | 7 | 7 | — | 2 | partes → `GInputGroup`; reduced motion medido |
| GLoadRegion | 10 | 10 | — | — | (a) #543, #558 |
| GNumberField | 11 | 11 | — | — | 1 px de WebKit sigue abierto (constante de #313; lima) |
| GPageHeader | 6 | 6 | — | 2 | H1 aceptado por #652; tres motores 19/19 |
| GPagination | 1 | 1 | — | 1 | Firefox y WebKit medidos (`table-page-size`) |
| GRadioGroup | 10 | 10 | — | 1 | árbol en Firefox/WebKit: lo que cubre `radio-group.spec.mjs` |
| GSelect | 8 | 8 | — | 2 | múltiple y búsqueda → `GCombobox`; popover medido; #563 sigue abierto |
| GSidebar | 9 | 9 | — | 3 | item activo → asiento (#612–#619); menú del usuario → `GMenu`; motores medidos |
| GSlider | 12 | 12 | — | 1 | hallazgo 3 resuelto por #509 (hueco 8,3 · 6,39 · 8,37 px); queda el límite del contenedor de 320 px |
| GSpeechHost | 6 | 6 | — | — | (b) |
| GStatusIsland | 7 | 7 | — | 1 | `GTable` ya tiene error con `retry` (#540) |
| GStepper | 4 | 4 | — | 1 | Firefox/WebKit por `library.spec`; reduced motion medido |
| GSummary | 15 | 15 | — | 1 | `summary.spec.mjs` en tres motores tras `001c1e3` |
| GSurface | 5 | 5 | — | 3 | `GCard` y `GToaster` ya la componen; zona de marca construida (`zone.spec`, #637 como límite); Firefox/WebKit por `library` y `zone` |
| GSwitch | 5 | 5 | — | 2 | pulgar y `:dir()` medidos; reduced motion medido |
| GTable | 4 | 4 | — | 1 | `table-load` y `table-page-size` en tres motores; se anota el hallazgo 1 de WebKit (bruno) |
| GTabs | 8 | 8 | — | — | (a) y (b); la nueva medida de la marca al cambiar la fuente en caliente sigue siendo de bruno |
| GTag | 10 | 10 | — | — | (a) #514 y (b) |
| GTextarea | 7 | 7 | — | 1 | tirador y `:has()` medidos; reduced motion medido; #563 sigue abierto |
| GTimeField | 12 | 12 | — | — | 1 px de WebKit (compartido con `GNumberField`) y `GDatePicker` de 37 px siguen en `PENDIENTES.md` |
| GToast | 5 | 5 | — | — | (b) |
| GTooltip | 11 | 11 | — | — | hallazgo 2 (esquinas) sigue siendo decisión de lima |
| GTranscript | 7 | 6 | 1 | — | hallazgos 3 y 4 cerrados en `d60d60b` (27 708/27 708) |

**Total:** 360 viñetas → 357; 3 quitadas, 42 reescritas con evidencia (incluidas las 12 de «`prefers-reduced-motion` real», que pasan a medido con la preferencia emulada); el resto, 315, se queda como (a) o (b).

## Lo que sigue abierto con dueño (no es de mora-docs)

| Qué | Dueño | Dónde consta |
| --- | --- | --- |
| `GNumberField`/`GTimeField`: 1 px del hueco del cursor en WebKit (constante de #313) | lima → coco | `design/lab/number-field/auditoria.md` hallazgo 1 |
| `GSelect`, `GTextarea`, `GDatePicker` sin contención en línea (#563) | bruno / coco | `api.md` «Contención en línea» |
| `GCombobox`: orden de cesión de la ficha del valor por anfitrión | lima | `PENDIENTES.md` §3 |
| `GTooltip`: esquinas de la pestaña junto a controles con radio grande (token del radio del control) | lima | auditoría, hallazgo 2 |
| `GDialog`: peso del modo pasos (tope +4 KiB de #590) sin cifra registrada | bruno | `GDialog/README.md` |
| `GTable`: WebKit no muestra «aquí estabas» al volver de la puerta con el ratón | bruno | `design/lab/table/auditoria-rows.md` hallazgo 1 |
| `GFormFold`: `letter-spacing` de la descripción | coco | `PENDIENTES.md` §6 (nuevo) |
| `GFormSection`: `hidden="until-found"` en un segundo paso (#487), con la condición de las filas | bruno | `DECISIONS.md` #487 |
| `GTabs`: la marca no se vuelve a medir si cambia la familia tipográfica en caliente | bruno | `GTabs/README.md` |

## Fuera de esta revisión

- `check-readme-props.mjs` avisa `SIN README GFab`: `GFab` está en construcción en otra sesión; no es de esta revisión.
- Lo de la clase (b) no se tocó más que para separar lo medido de lo real: sigue en `PENDIENTES.md` §7 y en `CLAUDE.md` «Solo en entorno real».
