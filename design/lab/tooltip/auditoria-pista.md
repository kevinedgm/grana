# Auditoría de coco · pista de solo icono (modo visual del motor de `GTooltip`, #433 a #437)

**Qué se audita:** la entrega de bruno en 0a4008a: el motor de `GTooltip` en modo visual en `GTabs` (#434), `GRadioGroup labelMode="icon"` (#435) y el riel de `GSidebar` (#436; la navbar queda fuera por #437). Contratos: `design/contracts/tooltip.md` §«Modo visual», `tabs.md` y `radio-group.md` §«Pista de solo icono», `sidebar.md` §«Pista del riel» (encargos a coco).

**Sobre qué:** el componente real (`dist/grana.umd.js` y `dist/grana.css` tras `npm run build`) en `auditoria-pista-banco.html`, con el tema por defecto y el **tema de auditoría del tooltip** (`auditoria-tema.css`: brand #14532D, accent #B45309, `space` 5, `radius` 14, borde 2px), claro y oscuro; el contraste además con los once temas de `design/lab/tema-oscuro/dark-color-presence/generated/` (claro y oscuro) en Chromium.

**Verificación propia:** `GRANA_PW_PORT=4212 node design/lab/tooltip/auditoria-pista-verificar.mjs` (`--engines=…`, `--only=1,3,4,5,7,8`, `--shots`). Resultado sobre el estado final: **31 347/31 347** (Chromium 10 537, Firefox 10 405, WebKit 10 405). Además, los specs de bruno (`tabs-pista`, `radio-group-pista`, `sidebar-pista`) y `radio-group.spec.mjs`, `personalidad-tabs`, `personalidad-card` en Chromium, Firefox y WebKit con los cambios de esta auditoría: todos pasan (53 en Chromium, 52 en Firefox + WebKit).

## Matriz medida

| Componente | Casos |
| --- | --- |
| `GTabs` (`labelMode="icon"`) | `underline`, `pill`, `segmented`, `contained`; densidades `compact`, `default`, `comfortable`; vertical `underline` y `pill` (y `compact`); «Más» (`overflow="more"` a 190px); RTL horizontal, segmentado y vertical; una sola pestaña. Pestaña deshabilitada incluida (con el puntero abre, como pide el contrato) |
| `GRadioGroup` (`labelMode="icon"`) | `segmented` y `chip` de `xs` a `xl`; densidades `compact`/`comfortable`; segmentado apilado (`is-stacked`, 120px); chips en dos líneas (170px); RTL segmentado, chips en dos líneas y apilado |
| `GSidebar` riel | densidades `default`, `compact`, `comfortable`; `variant` `fixed` y `floating`; RTL `fixed` y `floating`+`compact`; items, padres (por teclado: con el puntero abre su panel a los 150 ms), búsqueda y contraer. Además `expanded`, `navbar` y `drawer` para #383 |

## Cifras por motor (estado final)

| Medida | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| Pestaña de la pista contra el control (ancho y bordes abajo; alto y bordes a los lados), máx. | 0,25 px | 0,25 px | 0,25 px |
| La pestaña toca el control; hueco `space × 1,5`; etiqueta ≥ control; texto = nombre oculto, ≥ 12px, sin recorte, `dir="auto"`, dentro del visor; una sola abierta; `aria-hidden` sin `role` ni `id` | todos | todos | todos |
| Lado | abajo en una línea; derecha lógica en vertical, apilado y riel; a la izquierda física en RTL | igual | igual |
| #383: Δ0 de todos los descendientes con y sin nodos (cerrados, y con una pista abierta); nodos cerrados `display: none` | 0 en los 39 casos | 0 | 0 |
| Barrido con movimiento normal: cuadros con dos etiquetas | 0 | 0 | 0 |
| ídem, cuadros en viaje (pestaña entre dos controles) | 10–25 por barrido | 10–23 | 10–25 |
| Barrido con movimiento reducido: cuadros intermedios (salta) | 0 | 0 | 0 |
| Marca de `underline` tapada por la pestaña con la pista abierta (horizontal, RTL y vertical) | 0 % | 0 % | 0 % |
| La marca reaparece intacta al cerrar | sí | sí | sí |
| Riel: cuadros con panel flotante y pista a la vez (puntero desde `SKIP` e Intro por teclado) | 0 | 0 | 0 |
| Insignias del riel en RTL frente a LTR | espejo exacto (Δ0) | Δ0 | Δ0 |
| Pestaña de la pista sobre una insignia | 0 px² | 0 px² | 0 px² |
| Contraste del nombre (mín., 4 temas + 22 generados en Chromium) | 15,20:1 | 15,20:1 | 15,20:1 |
| Etiqueta y pestaña contra la página (mín.) | 15,20:1 | 15,20:1 | 15,20:1 |
| `forced-colors` emulado: pestaña con sus lados `CanvasText` sobre `Canvas`; etiqueta con borde `CanvasText` | sí (6 casos) | no se emula | no se emula |
| Táctil (`pointer: coarse`): sin selección ni menú del sistema en control y caja (`<label>` del radio incluida) | sí | no se emula | sí |
| Pista fuera del riel (`expanded`, `navbar`, `drawer`) | no abre | no abre | no abre |
| Consola | limpia | limpia | limpia |

La pestaña nunca tapa la marca de `underline`: cuelga del borde exterior de la pestaña (`tab.t = control.b`) y la marca vive dentro de la caja de la pestaña. Lo aceptado en #434 no llega a pasar con la geometría actual.

## Hallazgos

| # | Hallazgo | Gravedad | Dueño | Estado |
| --- | --- | --- | --- | --- |
| 1 | **WebKit: el radio al que llevan las flechas no cumple `:focus-visible`** y el anillo no se dibuja (WCAG 2.4.7). Medido en el playground: tras Tab y →, `:focus-visible` falso en los seis grupos (`list`, `segmented`, `chip`, `card`, los dos solo icono) y en `GCard selectType="radio"`; en el banco, falso en el segmentado (en `chip` y apilado la heurística a veces lo da). Chromium y Firefox lo marcan siempre. WebKit tampoco enfoca el radio con un clic de ratón; Chromium y Firefox sí, sin `:focus-visible`, así que `:focus` solo no sirve: pintaría el anillo al hacer clic. No hay otra técnica en Grana para esto | Alta (accesibilidad) | coco (CSS, hecho) · **bruno** (atributo) · lima (contrato) | CSS listo: `GRadioGroup.css` (las doce reglas de foco), `GCard.css` (anillo de la tarjeta) y `GWidgetGallery.css` (chips de categoría) dibujan el mismo anillo con `:is(:focus-visible, :where([data-g-key-focus]):focus)`, sin subir la especificidad. Con el atributo puesto a mano el anillo aparece en los tres motores; el clic de ratón no lo pinta. **Falta que el `.vue` escriba el atributo** |
| 2 | **Contador recortado en las pestañas verticales solo icono**: la columna tenía el tope `min(space × 64, 50 %)`; en un contenedor que se ajusta a su contenido (fila flex, `fit-content`) el 50 % se resolvía contra el propio componente y dejaba la columna en 43,7px frente a 63px de pestaña («3» cortado a la mitad), en los tres motores | Media (visual) | coco | **Corregido** en `GTabs.css`: con `g-tabs--icon-only` el tope es solo `space × 64`. Medido: columna 63,4px = pestaña; ningún control recortado en los 39 casos. Nota en `design/lab/tabs/estilo.md` §7 |
| 3 | **Insignias del riel en RTL «desplazadas»**: medidas en espejo exacto de LTR (inicio 20,8px, fin 4px, arriba 4px, en los tres motores; en `floating`+`compact` también) y la pestaña de la pista nunca las toca. Están arriba a la izquierda del icono en RTL, que es su sitio (`inset-inline-end`) | — | coco | **Sin defecto**; no se cambia CSS |
| 4 | CSS muerto de `g-sidebar__tip` e `is-instant` (siete reglas, incluidas las de movimiento reducido y `forced-colors`) | Baja | coco | **Retirado** de `GSidebar.css` tras confirmar con grep que solo lo nombran la prueba que comprueba que ya no existe y el README. Nota en `design/lab/sidebar/estilo.md` |
| 5 | El contrato dice que los nodos del riel «existen en todos los formatos»; en `navbar` y `drawer` el componente dibuja otro árbol y hay **0 nodos** (en `expanded`, los 8 del riel, cerrados). No afecta a nada (la pista solo vive en el riel y #437 deja la navbar sin pista) | Baja (redacción) | lima | Anotado: precisar en `sidebar.md` §«Pista del riel» que los nodos persisten entre riel y `expanded` (mismo DOM) y que `navbar`/`drawer` no los llevan |
| 6 | `GSidebar/README.md` sigue listando `__tip (con is-instant)` entre las clases | Baja | mora-docs | Anotado |

### #383 (encargo 4 del coordinador)

Los nodos al final de `g-tabs__header`, de `g-radio-group__options` y de la raíz de `GSidebar` no cambian nada: Δ0 de todos los descendientes (caja relativa, márgenes, rellenos, bordes, `display`, `grid-*`, `order`) quitando los nodos del DOM y volviéndolos a poner, en los 39 casos, cuatro temas y tres motores, y también con una pista abierta (va en la capa superior). Los únicos selectores estructurales sobre esos hijos son `:first-child` de `GRadioGroup` (las opciones van antes que los nodos) y `.g-form-row > … > *` (los nodos no son hijos de la raíz del grupo). Ninguna regla nueva necesitó `:where(.g-tooltip)`.

## Lo que se pide a bruno

**Atributo `data-g-key-focus`** (nombre exacto) en el **`<input type="radio">`** de `GRadioGroup` (`g-radio-group__input`, las cinco apariencias), de `GCard` con `selectType="radio"` (`g-card__select`) y de las categorías de `GWidgetGallery` (`g-widget-gallery__cat > input`):

- se pone en el `focus` del radio cuando la última entrada del usuario en el documento fue una **tecla de navegación** (flechas, Inicio, Fin, Re Pág, Av Pág, Tab y Mayús+Tab) **sin un `pointerdown` después** (el motor ya sigue esto en `utils/tooltip.js`, `state.navKey`; puede servir una utilidad común);
- se quita en el `blur` y en cualquier `pointerdown` sobre el grupo;
- no se pone con foco por programa salvo que la última entrada fuera de teclado (como hace `:focus-visible` en Chromium);
- pruebas: en WebKit, Tab + → deja el atributo en el radio de destino y el anillo visible (`outline-style: solid` en la opción o en la tarjeta); el clic de ratón no lo pone en ningún motor.

El CSS ya está; sin el atributo no cambia nada. Hasta entonces, en WebKit el anillo falta al navegar con flechas.

## Lo que se pide a lima

- Registrar `data-g-key-focus` en las tablas de clases y datos de `radio-group.md`, `card.md` y `widget-gallery.md`, con su porqué (hallazgo 1), y su entrada en `DECISIONS.md`.
- Hallazgo 5: precisar en `sidebar.md` qué formatos llevan nodos.

## No verificado

- `forced-colors` en Firefox y WebKit (Playwright no lo emula) y en Windows con contraste alto real.
- Táctil real (Safari en iPad, Android): solo emulado en Chromium y WebKit; la pulsación larga ya la prueban los specs de bruno.
- Lector de pantalla real: la pista es `aria-hidden` y el árbol accesible no cambia (lo prueban los specs de bruno con `ariaSnapshot`).
- El anillo de foco por flechas en WebKit con el atributo escrito por el componente (falta la parte de bruno); medido poniéndolo a mano.
- Zoom 200/400 %.
