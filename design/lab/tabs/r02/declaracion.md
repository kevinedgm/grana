# Declaración de cumplimiento · GTabs · r02

**Estado:** en revisión. Amplía y **sustituye** `r01` (que queda como historial). Fuente de verdad: `brief.md` de esta ronda; donde `r01` contradice al brief, gana el brief (puntos marcados «cambia respecto a r01»).
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises, iconos solo Lucide (`design/lab/lucide-icons.js`).
**Siguiente dueño:** lima → `design/contracts/tabs.md`.
**Prototipo:** `index.html` (12 secciones funcionales).
**Convención:** «propuesta kiwi pendiente de visto bueno» = recomendación que se asume si el usuario no responde. Los valores de color, grosor, radio, duración y curva del prototipo son de wireframe, **no** propuestas.

## Respuestas implícitas del brief a las preguntas de r01

| r01 | Respuesta del brief | Efecto |
| --- | --- | --- |
| 5 · apariencias | `underline`, `pill`, `segmented`, `contained` + `vertical` | Cuatro apariencias y orientación independiente (§1) |
| 3 · desbordamiento | scroll, anterior/siguiente, «Más» y combinación, **según el espacio** | Cinco estrategias (§5) |
| 6 · contador/menú | badge y contador secundarios | Contador numérico y badge de texto, ambos subordinados (§2) |
| 4 · cerrable | «acción secundaria opcional solo cuando tenga sentido» | Cerrar entra en r02 con límites (§12) |
| Nuevo | densidad `compact`/`comfortable`/`spacious`; `loading` y `attention`; persistencia por URL sin depender de rutas; snap móvil | §§2, 7, 13, 14, 9 |
| 1 · activación | no tocada | Automática por defecto: **propuesta kiwi pendiente de visto bueno** |
| 2 · deshabilitadas | no tocada | Omitidas por las flechas: **propuesta kiwi pendiente de visto bueno** |

## 1. Anatomía

| # | Parte | Obligatoria | Nota |
| --- | --- | --- | --- |
| 1 | Raíz `GTabs` | Sí | Una sola raíz con cabecera, paneles y región de estado |
| 2 | Cabecera | Sí | Agrupa botones de borde, desplazador, y botón «Más» |
| 3 | `tablist` con nombre y `aria-orientation` | Sí | Sin nombre → aviso en desarrollo. Hijos: **solo `tab`**, salvo las pestañas cerrables (§12, cambia respecto a r01) |
| 4 | **Marca de selección** (indicador) | Sí | Un único elemento decorativo `aria-hidden`, **fuera del `tablist`**, que se desliza entre pestañas (§8). Su forma (línea, superficie, segmento, banda fundida) es de coco; no lleva información que no esté en `aria-selected` |
| 5 | `tab` (`<button role="tab">`) | Sí, ≥ 1 | Orden interno fijo: **icono** (opcional, decorativo) · **etiqueta** · **estado** (`loading`/`attention`, icono con texto oculto) · **badge** (texto corto) · **contador** (número). Más de una de las tres informaciones secundarias a la vez genera aviso en desarrollo |
| 6 | Contador | No | Visual `aria-hidden` + texto oculto del consumidor («8 sin leer»); mismo modelo que `GBadge` en modo `count` |
| 7 | Badge | No | Texto breve («Nuevo») con texto oculto equivalente si el visible no basta |
| 8 | Acción secundaria «cerrar» | No | Botón **hermano** del `tab`, no hijo (§12) |
| 9 | Botones de borde | Solo en `arrows`/`combined` | Solo puntero, `aria-hidden`, `tabindex="-1"` (como r01) |
| 10 | Botón «Más» y menú | Solo en `more`/`combined` | **Fuera** del `tablist`; `aria-haspopup="menu"`, `aria-expanded`, `aria-controls` |
| 11 | `tabpanel` por pestaña | Sí | Enlazado en los dos sentidos (`aria-controls`/`aria-labelledby`) |
| 12 | Región `role="status"` | Sí | Existe antes del cambio; anuncia carga y cierre |

Diferencias de contenido secundario: **contador** = cantidad (Mensajes · 8, forma de píldora, tipografía tabular); **badge** = estado o novedad en texto (Novedades · Nuevo, forma rectangular suave). Formas distintas para que no se confundan sin depender del color; ambos más pequeños y pálidos que la etiqueta (jerarquía por tamaño, peso y contraste, no por color fuerte).

## 2. Estados

| Estado | Representación estructural | No solo color |
| --- | --- | --- |
| Default | `aria-selected="false"`, `tabindex="-1"` | |
| Hover | Solo con puntero real (`@media (hover: hover)`); sin función esencial | Cambio de fondo/color; sin hover no se pierde información |
| Focus | Anillo de foco sobre la pestaña enfocada, **independiente de la activa** | Anillo (forma) distinto de la marca de selección; verificado con «Activa» y «Foco» en pestañas distintas (matriz §3) |
| Active | `aria-selected="true"`, `tabindex="0"`, marca + peso tipográfico 600 | Forma (línea, superficie, segmento elevado, pestaña fundida con el panel) **y** peso; el ancho reservado en negrita evita que la activa desplace a las demás |
| Disabled | `aria-disabled="true"`, `tabindex="-1"`, omitida por flechas, no activa | Atenuada (exenta de contraste en WCAG); **propuesta kiwi pendiente de visto bueno** |
| Loading (pestaña) | Marca `status="loading"` con icono (`loader-circle`) y texto oculto; la pestaña **sigue habilitada**; si es la visible, su panel lleva `aria-busy="true"` | Icono (forma); el giro se detiene con movimiento reducido pero el icono permanece |
| Attention | `status="attention"` con icono (`circle-alert`) y texto oculto («requiere atención») | Icono, no punto de color |
| With badge / With counter | Ver §1 puntos 6–7 | Texto visible |
| Empty (sin pestañas) | No se dibuja `tablist`; el consumidor decide el vacío; aviso en desarrollo | |

`loading` y `attention` son del brief (nuevos respecto a r01, que solo tenía carga a nivel de panel). El estado «loading» **no** deshabilita: el usuario puede cambiar de pestaña mientras carga.

## 3. Teclado

Se mantiene r01 y se añade:

| # | Regla |
| --- | --- |
| 1 | Tabindex itinerante; Tab entra en la activa y sale al panel (o a su primer control); Shift+Tab sale antes del `tablist` |
| 2 | Horizontal: →/← con vuelta (invertidas en RTL); vertical: ↓/↑. Las flechas del eje contrario **no se interceptan** |
| 3 | Home/End: primera/última pestaña habilitada y visible |
| 4 | Automática por defecto (enfocar activa); manual: Enter o Espacio activan. **Propuesta kiwi pendiente de visto bueno** |
| 5 | Panel sin controles enfocables: `tabindex="0"`; con controles: no |
| 6 | Cambio **cancelable** (precedente #97): el valor y el foco no cambian si el consumidor lo impide (verificado con «cambios sin guardar») |
| 7 | **Supr (Delete)** sobre una pestaña cerrable la cierra (nuevo); el botón «cerrar» **no** está en el orden de Tab, así que no altera el tabindex itinerante |
| 8 | «Más»: Enter, Espacio, ↓ (primer ítem o el marcado) o ↑ (último) abren; ↑/↓/Home/End; Escape cierra y devuelve el foco; Tab cierra; elegir activa, hace visible y enfoca |
| 9 | Botones de borde: solo puntero; el teclado ya alcanza todas las pestañas |
| 10 | Pestaña enfocada o activada: se desplaza a la vista (`reveal`), sin mover la página |

## 4. ARIA

`tablist` (nombre, `aria-orientation` que sigue al diseño real) › `tab` (`aria-selected`, `aria-controls`, `aria-disabled`, `aria-setsize`/`aria-posinset` con pestañas ocultas, `aria-keyshortcuts="Delete"` si es cerrable); `tabpanel` (`aria-labelledby`, `aria-busy`, `tabindex`, `hidden`); botón «Más» (`aria-haspopup="menu"`, `aria-expanded`, `aria-controls`) › `menu` › `menuitemradio` (`aria-checked`); `role="status"`. Iconos, contador visual, badge visual y estado visual: `aria-hidden`, con texto oculto equivalente: el nombre accesible de la pestaña = etiqueta + estado + badge + contador. **Solo iconos**: la etiqueta se conserva en el DOM como texto oculto (nombre accesible obligatorio). Cerrar: botón con `aria-label` propio («Cerrar index.js»), `tabindex="-1"`, dentro de un contenedor `role="presentation"` junto a su pestaña. Sin textos por defecto (`labels` del consumidor, #97).

## 5. Responsive (por contenedor, un solo sistema)

- Todo por el **ancho del contenedor** (`ResizeObserver` en la raíz), no del visor; sin consultas de medios para valores fijos (#69, #98). Los umbrales se derivan de `space` y de lo medido, no de números fijos.
- **Orden de degradación** (propuesta): (1) todo visible; (2) con `labels="auto"` y **todas** las pestañas con icono, las inactivas pasan a solo icono y la activa conserva icono + etiqueta (como la píldora activa de `GSidebar`, #68); (3) estrategia de desbordamiento.
- **Desbordamiento** (`overflow`): `scroll`, `arrows`, `more`, `combined`, `auto`. En `scroll` el cue de que hay más es un degradado en el borde; en `arrows`/`combined` además hay botones. `auto` (propuesta): puntero táctil → `scroll`; fino → `combined`. La activa **siempre** queda visible: en scroll se desplaza a ella, en `more` entra en la barra y sale del menú. La estrategia solo aplica en horizontal; en vertical hay scroll vertical con altura máxima del consumidor.
- **Vertical → horizontal** por ancho (`responsive`, de r01): se mantiene, umbral derivado de `space`, como `GSidebar`.
- **`segmented`**: pocas opciones (≈ 2–6): se reparte el ancho; si no caben **degrada a scroll** sin cambiar de apariencia ni mostrar botones. Más de 6 → aviso en desarrollo. No admite pestañas cerrables ni vertical.
- **Táctil** (sin hover): objetivo ≥ 44px con `pointer: coarse` y ≥ 24px siempre, **sin importar la densidad** (tokens.md §7); el área del botón «cerrar» se amplía con un área de impacto, no con el glifo. **Momentum** nativo, `overscroll-behavior-inline: contain` (deslizar la lista no dispara «atrás» ni arrastra el contenido), **snap opcional** (`snap`, `scroll-snap-type: x proximity`).
- **Swipe entre paneles: no incluido** en v0.1. Choca con contenido que se desplaza en horizontal (tablas, carruseles) y exige alternativa (WCAG 2.5.1); la lista deslizable cubre el caso. **Propuesta kiwi pendiente de visto bueno**.
- **Densidad** (`compact`/`comfortable`/`spacious`): cambia altura, relleno, separación y grosor de la marca; la lógica y la tipografía no cambian; piso de 24px.
- **Alineación** (`align`): `start`, `center`, `distribute` (huecos iguales) y `fill` (columnas iguales). Con desbordamiento, `center`/`distribute`/`fill` degradan a `start` porque no sobra espacio.

## 6. Reglas de jerarquía

1. Los tabs son navegación entre vistas **del mismo nivel** de una misma vista; **un solo nivel**.
2. **No se anidan.** Un `GTabs` dentro del `tabpanel` de otro `GTabs` es un error de uso: aviso en desarrollo (verificado). Subnavegación dentro de una pestaña: `GSidebar`, lista de enlaces, secciones con encabezados, `GStepper` o `GFilterBar` según el caso.
3. **No son navegación entre páginas.** Si el destino es una ruta con su propia página, es `GSidebar` o enlaces. Con router, el tab se mantiene como `role="tab"`; el router solo sincroniza el valor (§9).
4. Vertical no añade niveles; no hay árboles de pestañas.

## 7. Integración con superficies

El comportamiento no cambia. Se adapta el **tono relativo a la anfitriona**: la pista de `segmented` toma un paso más oscuro que su fondo (como la `inset` de `GSurface`, #99), la banda de `contained` va a sangre con la activa fundida con el panel, y las pestañas planas heredan el fondo. Prototipo: plano, card, inset, dialog real y panel lateral (con y sin etiquetas).

- **Dentro de `GDialog`** (probado con `<dialog>` modal real): bajo el encabezado, `underline` + `compact`, sin color, línea fina a sangre; no compite con el título (más pequeño, sin peso de título). Esc cierra el diálogo; las flechas siguen funcionando; Tab recorre botón de cierre → pestaña → panel. Ver hallazgos 8 y 9.
- **Dentro de sidebar o panel lateral**: `orientation="vertical"`; con `labels="icons"` queda como riel de iconos (etiqueta oculta accesible).
- **Contained**: el CSS no dibuja borde propio; vive dentro de la superficie anfitriona.

## 8. Animación

Discreta y solo con `transform`/tamaño/opacidad:
- **Marca** única que se desliza entre pestañas (posición y tamaño, ≈ 200ms con curva estándar en el prototipo; valores y tokens son de coco, #71: transiciones, no keyframes).
- **Fondo seleccionado** (pill/segmented): la misma marca.
- **Entrada del contenido**: fundido corto con un desplazamiento de 4px (prototipo 160ms).
- **No se anima** el primer posicionamiento (no desliza al cargar) ni el cambio de apariencia/densidad.
- **`prefers-reduced-motion: reduce`**: sin deslizamiento (la marca salta), sin entrada, sin giro del icono de carga, scroll programático instantáneo. Verificado con `emulateMedia` (duración de transición `0s`); el estado sigue siendo evidente por la forma.
- La marca se recoloca con `ResizeObserver` y al cargar las fuentes.

## 9. Persistencia

- `GTabs` solo expone `v-model` (`modelValue` = `id`) y el evento; **no conoce rutas ni la URL**.
- La sincronización es **externa y opcional**: el prototipo la hace con ~15 líneas sobre `#clave=id` (`pushState`, `popstate`/`hashchange`): recargar, «atrás» y compartir el enlace restauran la pestaña; un id desconocido o deshabilitado se ignora; «atrás» hasta una URL sin clave vuelve a la pestaña por defecto. Con un router se sincroniza igual con la ruta o el *query*.
- **Propuesta kiwi pendiente de visto bueno**: sin prop de URL en el componente; a lo sumo un *composable* opcional de bruno.
- Persistir en `localStorage` queda fuera: es decisión de la aplicación.

## 10. Contenido dinámico y relación tab ↔ panel

- Paneles **montados y ocultos** por defecto (#78: no perder borradores; verificado con un formulario), `lazy` opcional.
- Carga: la pestaña muestra `loading` y su panel `aria-busy` (con esqueleto del consumidor) y se anuncia por la región de estado; verificado.
- La relación se ve y se oye: `aria-controls`/`aria-labelledby`, panel pegado a su marca (en `contained` la activa se funde con el panel), entrada animada.
- Cambio cancelable (§3.6): no se pierde el foco ni el borrador.
- Vacíos y errores de contenido: del consumidor (no de `GTabs`).

## 11. Solo iconos

- Opcional por pestaña; evitar iconos decorativos en todas sin necesidad.
- `labels="icons"` (todas) o `labels="auto"` (las inactivas cuando no caben): la etiqueta **no se quita del DOM**, solo se oculta visualmente (texto oculto estándar) y es el nombre accesible. Aviso en desarrollo si falta el icono de alguna pestaña con etiquetas reducidas.
- El prototipo usa `title` solo como ayuda; no es solución (no hay hover en táctil, no es fiable con lector). Ver pregunta 1.

## 12. Acción secundaria opcional («cerrar»)

Solo para pestañas creadas por el usuario (documentos, archivos). **No** aplica a `segmented`, ni a pestañas deshabilitadas, ni se usa como acción genérica.

- **Estructura** (cambia respecto a r01): un botón dentro de `role="tab"` es un control interactivo anidado (APG lo desaconseja y los lectores no lo anuncian bien). El botón es **hermano** de la pestaña dentro de un contenedor `role="presentation"` que es hijo del `tablist`.
- **No rompe el teclado**: `tabindex="-1"` (no entra en Tab, no altera el tabindex itinerante); su equivalente es **Supr** sobre la pestaña. Alcanzable con AT táctil por el árbol de accesibilidad (no es `aria-hidden`).
- **Al cerrar**: se emite `close` **cancelable** (p. ej. «cambios sin guardar»; verificado), se anuncia («index.js cerrada») y, si era la activa, se activa la vecina y el foco va a ella; la última cerrada deja el vacío del consumidor. Si no era la activa, el foco va a la vecina.
- **Riesgo**: `aria-required-children` puede quejarse del botón dentro del `tablist` aunque esté en un contenedor `presentation`; ver «Qué NO verifiqué» y hallazgo 6.

## 13. Comprobaciones ejecutadas

Playwright (Chromium), `index.html` local, sin errores ni avisos de consola (los avisos de desarrollo solo salen en usos incorrectos, comprobados aparte):

- Roles y enlaces: `tablist` con nombre, 4 `tab`, 4 `tabpanel`, `aria-controls`/`aria-labelledby` consistentes en dos sentidos, `tablist` solo con `tab` (sin cerrables), tabindex itinerante (una sola con 0).
- Teclado horizontal: → activa, End, vuelta, ↓ ignorada, Tab va al panel sin controles. Vertical: ↓ mueve, → ignorada, deshabilitada omitida con vuelta, `aria-orientation="vertical"`.
- Marca: se mueve al activar; transición activa; con `prefers-reduced-motion: reduce` la duración es `0s`; activa con peso 600.
- Desbordamiento: en `scroll` el degradado indica que hay más y no hay botones; `arrows` muestra ambos y «siguiente» desplaza; **activar desde fuera la pestaña 9 (y volver a la 1) la deja visible en las cuatro estrategias**; en `more` hay pestañas ocultas con `aria-setsize` 9; ↓ abre el menú y enfoca un ítem; Escape devuelve el foco al botón; elegir activa y hace visible; «Más» fuera del `tablist`; `combined` lista las 9.
- Móvil: `snap` activo; `segmented` de 3 opciones a 320px cabe y de 7 desborda y degrada a scroll; `labels="auto"` reduce las inactivas a icono manteniendo la etiqueta en el DOM; `fill` da columnas iguales.
- Cerrar: botón fuera de Tab y fuera del `tab`, contenedor `presentation`; Supr cierra, activa la vecina y enfoca; cierre cancelable; clic en la X; `segmented` sin cerrar.
- Dinámico: borrador conservado al cambiar; `loading` en pestaña + `aria-busy` en panel y fin de carga; cambio cancelable.
- URL: clic escribe `#perfil=…`; «atrás» restaura; carga desde `#perfil=act`; id deshabilitado ignorado.
- Dialog real: pestañas dentro, flechas, Esc cierra.
- Aviso de desarrollo al anidar tabs. RTL: ← avanza y la marca coincide con la pestaña. **320px: sin desborde de la página** (`scrollWidth` 320).

## 14. Qué NO verifiqué

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): anuncio de estado + contador, del cierre, del menú «Más» y del botón «cerrar» como hermano en un contenedor `presentation` (la parte más arriesgada).
- **axe / validación ARIA** automática (`aria-required-children` con el botón de cierre).
- Firefox y WebKit; **táctil real**, momentum, snap con dedo, rebote del navegador, zoom al 200%, `forced-colors` (se añadió solo un contorno de prueba a la marca), `prefers-contrast`.
- Contraste y tamaños finales: del estilo de coco; el prototipo usa grises de wireframe.
- Cambio de apariencia/densidad con el menú «Más» abierto; redimensionar con el menú abierto.
- Vertical con muchas pestañas (scroll vertical con `max-block-size`) más que de forma básica; vertical→horizontal por ancho (`responsive`) no se volvió a probar (r01 sí).
- Cerrar la última pestaña y reabrir desde el estado vacío más allá del botón «Restablecer» de la demo.
- Rendimiento con decenas de pestañas.
- El sistema real de tokens y `GMenu`/`GBadge`/`GDialog`: el prototipo los imita sin usarlos.

## 15. Hallazgos para lima

Los valores son de coco y lima; aquí solo se nombran necesidades.

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | Entrega | Alta | `items` (`{ id, label, icon?, count?, countLabel?, badge?, badgeLabel?, status?: 'loading' \| 'attention', statusLabel?, disabled?, closable?, closeLabel? }`) y `v-model` (`id`). Paneles por slot `panel-{id}`; `tab-{id}` para personalizar manteniendo la anatomía |
| 2 | Ejes | Alta | `appearance` (`underline` \| `pill` \| `segmented` \| `contained`), `orientation`, `density` (ver 3), `align` (`start` \| `center` \| `distribute` \| `fill`), `activation` (`auto` \| `manual`), `overflow` (`scroll` \| `arrows` \| `more` \| `combined` \| `auto`), `labels` (`full` \| `icons` \| `auto`), `snap`, `lazy`, `keepMounted`. Restricciones de combinación: `segmented` y `contained` no admiten `vertical`; `segmented` no admite cerrables. Lima decide nombres finales (`appearance` no es `variant`) |
| 3 | **`density`** | Alta | El brief pide `compact`/`comfortable`/`spacious`; la prop compartida de Grana es `default`/`comfortable`/`compact` (1×, 0.875×, 0.75×, `api.md`). No son equivalentes (en Grana `comfortable` es **más denso** que `default`). Ver pregunta 2 |
| 4 | Eventos | Alta | `update:modelValue`, `change` `{ id, index, source: 'keyboard' \| 'pointer' \| 'menu' \| 'program' }` **cancelable**, `close` `{ id, source }` **cancelable** (y su `labels` de anuncio) |
| 5 | Textos | Alta | `labels` sin valor por defecto: nombre del `tablist` (obligatorio), «Más pestañas», «Todas las pestañas», anuncios de carga y de cierre; aviso en desarrollo |
| 6 | Cerrar | Alta | Estructura de §12 (hermano en `role="presentation"`). Lima valida con bruno que no rompe `aria-required-children`; alternativa de reserva si falla: sin botón visible, solo Supr y un control equivalente en el panel/menú |
| 7 | Tokens | Media | Reutilizar los existentes (primario/acento, borde, foco, `space`, `duration-*`, `ease-*`, radios, superficies). Necesidades que **no** están cubiertas y lima debe decidir (sin valores): (a) pista y fondo seleccionado de `segmented` **relativos a la superficie anfitriona** (paso de tono sobre `--g-surface-*`, #99); (b) grosor de la marca por densidad; (c) tono de la banda y de la activa fundida en `contained`; (d) duración/curva de la marca; (e) tamaños de contador y badge (secundarios). Sin valores de respaldo |
| 8 | Dialog | Alta | La cabecera de pestañas debe quedar **fija** y solo el panel desplazarse. Opciones: `GDialog` ofrece un slot `tabs` fijo bajo el encabezado, o `GTabs` expone el panel como región con `max-block-size` del consumidor. Además la línea de base **a sangre** (a todo el ancho del diálogo con las pestañas sangradas) necesita una propiedad o variable (`inset`) en `GTabs` o un slot a sangre en `GDialog` |
| 9 | Panel vs. lista separados | Media | Con `GDialog`/`GSidebar` conviene poder pintar los paneles en otro sitio que la cabecera (headless: `GTabs` + `GTabPanels`). Lima decide si en v0.1 o se difiere |
| 10 | Menú «Más» | Media | Reutilizar `GMenu` (#82–83) si su disparador-slot admite el botón fuera del `tablist` y la lista sigue a su disparador (#55: lista en capa superior, no recortada por `overflow` de un diálogo). El prototipo usa lista propia |
| 11 | Contador/badge | Baja | Componer `GBadge` (modo `count`, #59) o replicar; lima decide acoplamiento |
| 12 | Iconos | Baja | `GIcon`; añadir a `icons.md` los que falten (en el prototipo: `message-circle`, `triangle-alert`, `bell`, `folder`, `file-text`, `list`, `table`, `chart-column`, `calendar`, `house`, `inbox`, `mail`, `settings`, `user`, `users`, `lock`, `loader-circle`, `circle-alert`, `check`, `x`, `chevron-left/right/down`) |
| 13 | Persistencia | Media | Solo `v-model`; sincronización con URL externa (§9) |
| 14 | `responsive` vertical → horizontal | Media | Se mantiene de r01: umbral derivado de `space` |
| 15 | Contraste y no solo color | Alta | coco: marca de forma visible con 3:1 contra el fondo (controles, #89), `forced-colors` y `prefers-contrast` |

## 16. Preguntas de producto realmente abiertas

1. **Etiqueta de pestañas solo-icono**: ¿hace falta un tooltip del sistema (visible al hover y al foco, no solo `title`)? En táctil no hay hover; ¿se acepta que en `labels="icons"` la etiqueta aparezca únicamente a lectores y que la activa muestre su etiqueta (`labels="auto"`) como alternativa? Recomendación: `icons` solo cuando el icono sea universal, o usar `auto`.
2. **`density`**: ¿se adopta la prop compartida (`default`/`comfortable`/`compact`) con la salvedad de que `spacious` equivale a `default`, o `GTabs` usa la escala del brief (`compact`/`comfortable`/`spacious`) y se acepta la inconsistencia con el resto de componentes? Recomendación: la compartida (mapeo `spacious` = `default`), y se documenta; es decisión de coherencia del sistema.
3. **Estrategia de desbordamiento por defecto**: `scroll` (recomendada, ordena sin ruido) frente a `auto` (`combined` con puntero fino). ¿Se publican las cinco en v0.1 o se difiere `combined` y `auto`?
4. **Pestañas cerrables en v0.1**: el brief las admite «solo cuando tenga sentido», pero conllevan el riesgo de accesibilidad de §12. ¿Se publican ya o se difieren hasta validar con lector de pantalla? Recomendación: diferir si la verificación con lector falla.

Sin pregunta (asumidas como propuesta kiwi pendiente de visto bueno): activación automática por defecto, deshabilitadas omitidas por flechas, swipe entre paneles fuera de v0.1, persistencia externa por `v-model`, `auto` = táctil→`scroll`/fino→`combined`.
