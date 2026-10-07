# Declaración — etiqueta suelta (`GTag` + `GTagGroup`, nombres de trabajo), r01: base funcional y tres conceptos

> kiwi, 2026-10-07. Prototipo: `index.html` (motor `tag.js` sin dependencias; geometría y estados en `tag.css` con tokens; CSS real de `dist/grana.css` y 8 categorías generadas por el motor en `tema-cat8.css`; iconos solo Lucide de `design/lab/lucide-icons.js`). Verificación: `verificar.mjs`, **223/223** en Chromium (75), Firefox (73: sin las dos pruebas táctiles, que Firefox no emula) y WebKit (75), puerto 4213. La base deriva de HTML, APG y WCAG 2.2; la identidad (A/B/C) y el alcance de «alternar» son **preguntas de producto** (al final).

## Anatomía (base)

```
GTagGroup  <ul class="g-tag-group" role="list" aria-label|aria-labelledby>      ← lista (cuenta: «lista, 4 elementos»)
           | <div role="group" aria-label>  si todas son de alternar              ← conjunto de interruptores, sin cuenta
           | <span role="list"> + <span role="listitem">  dentro de una frase (C)
├─ <li>
│  └─ GTag  <span class="g-tag" [data-cat="k"]>
│     ├─ [lead: GAvatar xs decorativo | icono Lucide por nombre]   (aria-hidden; el hueco adopta la caja, #295)
│     ├─ cuerpo, uno de:
│     │    <span class="g-tag__body"><span class="g-tag__text" dir="auto">Penicilina</span></span>      estática
│     │    <a class="g-tag__body" href>…texto…</a>                                                       enlace
│     │    <button type="button" class="g-tag__body" aria-pressed="true|false">[check] …texto…</button> alternar
│     └─ [<button type="button" class="g-tag__remove" aria-label="Quitar Penicilina" aria-keyshortcuts="Delete">x</button>]
├─ …
├─ [<button aria-expanded aria-controls>Ver 3 más</button>]        con limit
├─ [<button>Quitar todas</button>  →  <button>Deshacer</button>]   con clearable
└─ región viva cortés propia, vacía al montar (aria-live="polite" aria-atomic="true")
```

## Decisiones de la base

**Qué es y qué no es**

1. **Componente nuevo, `GTag` (y `GTagGroup`), no `GChip`.** En Grana «chip» ya es una **apariencia de opción de formulario** (`GCheckbox layout="chip"`, `GRadioGroup appearance="chip"`) y una pieza interna de `GFilterBar` y `GDatePicker`; un `GChip` haría preguntar «¿cuál uso?». «Tag» nombra el contenido (una etiqueta puesta a algo) y forma pareja con `GTagInput`, ya reservado para etiquetas de texto libre (#338). Tag `g-tag`, avisos `[Grana GTag]`.
2. **Frontera con `GBadge` (regla de una línea): «¿dice el estado o la cantidad de otra cosa y no se toca? → `GBadge`. ¿Es un elemento de un conjunto que clasifica o resume una elección? → `GTag`».** Consecuencias: `GBadge` sigue sin interacción (#59) y con colores **semánticos** (`success`, `danger`…: estado); `GTag` usa **neutro o categorías** del tema (clasificación) y **nunca semánticos** (una etiqueta roja diría «peligro»; aviso de desarrollo y se pinta neutra). Una etiqueta **estática** de categoría es `GTag`, no `GBadge`: así una lista de etiquetas tiene el mismo aspecto y medida en modo lectura y en modo edición (cambia `removable`, no el componente). Presencia, contadores e insignias ancladas siguen en `GBadge`.
3. **Frontera con las opciones-chip:** si la elección es un **valor de formulario** (se envía, tiene `name`, error, `GForm`), es `GCheckboxGroup layout="chip"` o `GRadioGroup appearance="chip"`. `GTag` alternable **cambia la vista en el acto** (filtro rápido de una lista, faceta) y no participa en el envío. Si «alternar» entra o no en `GTag` es la **pregunta 2**.
4. **Frontera con `GFilterBar`, `GCombobox`, `GSummary`, `GFileField`, `GBtn`:** el chip aplicado de `GFilterBar` es el mismo patrón (resumen + quitar, foco al siguiente); su adopción queda para una ronda propia (L11). `GCombobox multiple` no usa etiquetas (#417). Una pieza con varios datos es `GSummary`; un adjunto, la ficha de `GFileField`; una acción que no es quitar, alternar ni navegar, `GBtn size="sm"`.

**Semántica por caso**

5. **Estática:** `<span>` sin rol ni foco; su texto es contenido. Nada de `tabindex` para «poder leerla»: el lector la lee en la lista.
6. **Enlace:** toda la etiqueta es un `<a href>` («enlace, Vue»). Sin rol extra. Con `removable`, el enlace y «Quitar» son **dos controles hermanos** dentro de la etiqueta, nunca anidados (HTML no permite interactivos dentro de `<a>`).
7. **Alternar:** `<button type="button" aria-pressed>` (APG *Button*, toggle). El estado **no depende del color**: aparece el icono `check` (decorativo) y cambia el relleno. El nombre es el texto y **no cambia** con el estado (APG: un botón de alternar no cambia su etiqueta). Sin anuncio propio: el lector ya dice «activado/presionado». `disabled` nativo. **Enlace + alternar en la misma etiqueta no existe** (aviso): navegar y cambiar un estado son dos intenciones.
8. **Quitable:** botón real `<button type="button">` con el icono `x` y **nombre propio** desde la plantilla `labels.remove` (`«Quitar {label}»`, sin valor por defecto: Grana es internacional), único entre hermanos (WCAG 2.4.6, 4.1.2). El cuerpo de una etiqueta quitable sigue siendo estático, enlace o alternar.
9. **Grupo:** `GTagGroup` pinta `<ul role="list">` con nombre (`label`/`labelledby`; aviso si falta). `role="list"` explícito porque Safari quita la semántica de lista a un `<ul>` con `list-style: none`; la cuenta («lista, 4 elementos») es información útil en filtros aplicados. **Si todas las etiquetas son de alternar**, `<div role="group">` (un conjunto de interruptores, sin cuenta). **Dentro de una frase** (C, una celda), `<span role="list">` + `<span role="listitem">`: un `<ul>` no puede ir dentro de `<p>`. Una etiqueta suelta fuera de grupo es válida (sin lista).

**Teclado y foco**

10. **Sin widget compuesto:** cada control es una parada de Tab nativa (cuerpo interactivo y «Quitar»), en orden del documento. Sin *roving tabindex* ni flechas: APG no define un patrón de etiquetas, los elementos nativos bastan, ← → chocarían con la edición en `GTagInput` (y la rejilla 2D de fichas ya se descartó en `combobox/r02`). Con pocas etiquetas (lo normal) cuesta lo mismo que `GFilterBar` hoy.
11. **Atajo de quitar:** <kbd>Supr</kbd> o <kbd>Retroceso</kbd> sobre cualquier control de una etiqueta quitable la quita (`aria-keyshortcuts="Delete"` en «Quitar»). Es un atajo; la vía principal sigue siendo el botón con nombre (WCAG 2.1.1).
12. **Foco tras quitar (WCAG 2.4.3):** al control **equivalente** de la siguiente («Quitar» → «Quitar»; cuerpo → cuerpo); si era la última, al de la anterior; si no queda ninguna, a un destino que da la aplicación (`emptyFocus`, como «Agregar filtro» de `GFilterBar`) o, sin él, al propio grupo (`tabindex="-1"`, que lee su nombre y «Sin etiquetas»). Nunca a `<body>`. Una vecina estática (sin control) se salta hasta la siguiente que lo tenga. Medido: segunda → siguiente, última → anterior, vacía → «Agregar filtro»; sin `emptyFocus`, al grupo.
13. **Anuncio (WCAG 4.1.3):** al quitar, región viva **cortés** propia del grupo, vacía al montar y escrita en el ciclo siguiente (patrón de `liveRegion.js`): «Alta prioridad quitada» (`labels.removed`). Alternar no anuncia (lo dice el estado). Quitar todas: «Se quitaron 4 etiquetas».
14. **Quitar todas → Deshacer en su sitio:** con `clearable` y ≥ 2 quitables, «Quitar todas» al final; al pulsarlo, **el mismo botón** pasa a «Deshacer» con el foco (la acción contraria aparece donde actuaste); deshacer devuelve todas en su orden y el foco a «Quitar todas». Desaparece al salir del grupo.
15. **Tope (`limit`):** muestra las primeras N y un botón de despliegue «Ver 3 más» (APG *Disclosure*: `aria-expanded`, `aria-controls` a la lista; las ocultas con `hidden`, fuera del árbol). Al desplegar, **el foco se queda en el botón** («Ver menos»). No es un «+3» sin texto.

**Medida, color y lectura**

16. **Tamaños:** `md` = `space × 8` (32px) y `sm` = `space × 6` (24px). «Quitar» dibuja **24 × 24** (el mínimo de 2.5.8 sin depender de la excepción de espaciado) y, con `pointer: coarse`, su área llega a **44px** con un `::after` centrado, sin cambiar el dibujo (como `GBtn`). Cuerpo interactivo ≥ 24px de alto en `sm`. Separación entre etiquetas `space × 2`.
17. **Color por categoría, como `GAvatar` (#294):** neutro por defecto (`neutral-soft`/`text`); `color` fija la categoría `k` (1..12); `categories` (las que declara el tema) la deriva de **`colorKey ?? label`** con **el mismo hash** (FNV-1a de 32 bits sobre UTF-8 + `fmix32`, `mod n + 1`): la misma clave da el mismo color en una etiqueta y en un avatar. Medido: los siete vectores de `avatar.md` coinciden en los tres motores. Estática y quitable: `cat-k-soft` + `on-cat-k-soft` (par garantizado; medido 4,60 a 5,10:1 en claro, mínimo 4,52 en oscuro). **El color nunca va solo:** el texto de la etiqueta dice qué es.
18. **Alternar pulsado (§7.1, #431):** relleno de familia → contorno `{familia}-text`. Neutro: `primary` + `on-primary` + contorno `primary-text` (16,5:1). Con categoría: `cat-k` + `on-cat-k` + contorno `cat-k-text` (5,86:1). Sin pulsar: superficie + contorno `border-control` (3,45:1, WCAG 1.4.11).
19. **Recorte:** solo se recorta (una línea, `…`, tope `space × 60`) lo que tiene **un control enfocable**: el nombre accesible es el texto entero y la **pista visual** (modo visual del motor de `GTooltip`, `aria-hidden`, #433) lo enseña al apuntar o enfocar (WCAG 1.4.13: se puede apuntar, no tapa el control). **Una etiqueta estática no se recorta: se parte en líneas** (`overflow-wrap: anywhere`), porque sin foco no habría forma de leerla con teclado. «Quitar» y «Deshacer» (solo icono) muestran su nombre como pista.
20. **Texto e idioma:** el texto lleva `dir="auto"` (contenido de la aplicación, scripts mezclados, como #282); la × va al final **lógico** y el lomo de B al inicio lógico (espejo en RTL, medido). Iniciales del avatar con `translate="no"` (las de `GAvatar`).
21. **Estados:** `disabled` (controles nativos deshabilitados, texto `text-subtle`); sin `readonly` propio: una etiqueta de solo lectura es la estática. Foco visible en todos los controles (`--g-focus-width`, `--g-color-focus`).
22. **Movimiento:** entrada sin animación al montar; el `check` del pulsado se abre con `--g-duration-press` + `--g-ease-out` (como el chip de `GCheckbox`); quitar en la base no anima (el foco va al vecino en el acto). Con `prefers-reduced-motion: reduce`, solo color. `forced-colors`: borde `CanvasText` y el pulsado con `Highlight`; el estado sigue en el icono `check`.

## Los tres conceptos

Los tres comparten todo lo anterior. Cada uno cuestiona una parte distinta de la premisa.

### A · Huella — «quitar no mueve nada bajo tu mano»

Premisa que cuestiona: *quitar es instantáneo y las demás se recolocan.*

- **Tapa entera:** «Quitar» ocupa **toda la altura** de la etiqueta (32 × 32 en `md`), separada del texto por un filo (`border-strong`), con las esquinas de final de la etiqueta. Forma: `--g-radius-shape` (la del tema), no la píldora.
- **Vista previa:** apuntar o enfocar la tapa **tacha el texto** antes de quitar: se ve cuál se va.
- **Huella:** al quitar, la etiqueta **no desaparece**: queda su contorno discontinuo (`border-control`), el texto tachado y atenuado (fuera del árbol) y **del mismo ancho**; la tapa pasa a ser «Deshacer» (`undo-2`, nombre «Deshacer: quitar Látex») **con el foco**. Anuncio «Látex quitada. Deshacer disponible». **El modelo ya cambió en el acto** (`update:modelValue`): la huella es solo visual.
- **Se recogen cuando nadie apunta:** mientras el puntero o el foco sigan dentro del grupo, nada se mueve; al salir los dos (o al tocar fuera), las huellas se recogen a la vez (`inline-size` a 0 con `--g-duration-fast` + `--g-ease-out`; con movimiento reducido, sin animación).
- Medidas: tapa 32 × 32; posiciones y anchos de todas las etiquetas **Δ0** al quitar; doble clic rápido sobre la misma tapa = quitar y deshacer (la vecina sigue); deshacer devuelve la etiqueta a su sitio con el foco en su «Quitar»; texto ≥ 4,6:1 en cada categoría; pulsado con categoría 5,86:1 y contorno 5,86:1.

**Qué lo hace distinto (A).** El error clásico de las etiquetas (quitar dos seguidas y que la segunda sea la que estaba al lado) desaparece por construcción: lo que hay bajo el puntero no cambia mientras el puntero está ahí. El «Deshacer» vive **en el sitio del gesto**, no en un aviso que hay que ir a buscar, y lleva el foco: quien usa teclado o lector lo tiene en la siguiente pulsación. **Gana:** seguridad al editar, deshacer sin `GToast`, foco nunca perdido. **Arriesga:** varias huellas acumuladas si el puntero no sale del grupo (se recogen todas a la vez); necesita un grupo dirigido por datos (L3).

### B · Racimo — «la categoría se dice una vez»

Premisa que cuestiona: *cada etiqueta es una píldora suelta con su color.*

- Las etiquetas con la misma **faceta** (`facet`: «Estado», «Alergias») forman un **racimo**: el nombre de la faceta **una vez** (texto, `caption`, `text-muted`), un **lomo** al inicio lógico en `cat-k-text` (forma sin par, #439; 3px = `space × 0.75`) y los valores en fila, separados por filos. Sin faceta, la etiqueta va sola con lomo neutro.
- Cada racimo es una **lista nombrada por su faceta** (`aria-labelledby`): «Alergias, lista, 3 elementos». «Quitar Penicilina de Alergias» (`labels.removeIn`). El foco al quitar va **al vecino del mismo racimo**; si era el último, el racimo se va y el foco pasa al siguiente racimo. Anuncio «Pendiente quitada de Estado».
- Con alternar, el racimo es un `role="group"` nombrado por la faceta: un **filtro de facetas** en una línea («Estado: Pendiente · En curso · Cerrado»), pulsado = `cat-k-soft` + `on-cat-k-soft` (4,94:1) + `check` + raya inferior `cat-k-text`.
- Medidas: lomo 5,26 a 5,86:1 contra la superficie; racimos en orden de aparición; RTL con el lomo a la derecha.

**Qué lo hace distinto (B).** Lee como piensa la persona: «Estado: pendiente o en curso; prioridad: alta», no seis píldoras de colores. El color deja de ser la pista de la categoría (lo es el nombre) y pasa a ser un lomo discreto que agrupa a la vista; caben más valores por línea porque la faceta no se repite. Es la forma natural de los filtros aplicados (O dentro de una faceta, Y entre facetas, #111). **Gana:** lectura y densidad en conjuntos grandes y facetados. **Arriesga:** exige `facet` en los datos; sin facetas, es la base con un lomo.

### C · Palabra — «la caja solo cuando significa algo»

Premisa que cuestiona: *una etiqueta es una caja.*

- En reposo, la etiqueta es **una palabra**: punto relleno de su categoría (`circle` relleno en `cat-k-text`, ≥ 3:1: 5,18 a 5,86) + texto, en la línea. En una frase o en una celda, la altura de línea **no cambia** (Δ0 medido frente al mismo texto sin etiquetas).
- **La caja significa encendido:** solo una etiqueta **pulsada** tiene fondo (`cat-k-soft`, 5,10:1), y su marca pasa de `circle` vacío a `check`. Un enlace va subrayado con el color de su categoría; una alternable sin pulsar, subrayado punteado.
- **Quitable:** al apuntar o enfocar, la palabra se marca y **cuelga una pestaña «Quitar»** (icono `x` + texto visible, 24px de alto) debajo de ella, en el idioma de la pestaña de `GTooltip` (#380). Nada se mueve (Δ0); la pestaña no tapa la palabra vecina de la misma línea. «Quitar» está en el orden de Tab aunque no se vea, y se ve al enfocarlo. En táctil, el primer toque muestra la pestaña y **no quita**; el segundo, sí.

**Qué lo hace distinto (C).** En una tabla o una ficha de lectura, cinco cajas compiten con el dato y suben la altura de la fila; aquí las etiquetas se leen como texto y la caja aparece solo para decir «esto está encendido». La acción de quitar tiene **texto visible** (no una × que hay que adivinar) y no ocupa sitio hasta que la buscas. **Gana:** densidad máxima, filas de tabla sin cambio de altura, calma visual. **Arriesga:** descubrir que se puede quitar (solo al apuntar o enfocar); la pestaña tapa por un momento la línea de debajo; en táctil son dos toques.

## Comparativa

| Criterio | A · Huella | B · Racimo | C · Palabra |
| --- | --- | --- | --- |
| Qué cambia | Comportamiento al quitar | Estructura del grupo | Forma en reposo |
| Quitar la equivocada | Imposible por salto (Δ0 hasta salir) + vista previa | Solo se mueve dentro del racimo | Dos pasos; el texto se mueve |
| Deshacer | En el sitio, con el foco | Lo da la aplicación | Lo da la aplicación |
| Leer por categoría | Color + texto de cada una | Nombre de faceta una vez + lomo | Punto de color + palabra |
| Densidad | Como hoy (32px por fila) | Más valores por línea | Máxima; altura de texto |
| Táctil | Tapa entera de 32 (44 de área) | 24 (44 de área) | Dos toques |
| Dónde brilla | Editar etiquetas, filtros aplicados | Filtros aplicados, expedientes con muchas | Tablas y fichas de lectura |
| Riesgo | Huellas acumuladas si no sales | Exige `facet` | Descubrimiento; tapa la línea inferior |
| Coste | Grupo dirigido por datos (L3) | Agrupar por `facet` en el grupo | Raíz en línea (`as="inline"`) y CSS propio |

## Recomendación

**A como comportamiento por defecto de toda etiqueta quitable dentro de un `GTagGroup`** (tapa entera, vista previa, huella con «Deshacer» en el sitio) **+ B como opción del grupo** cuando los datos traen faceta (`groupBy: 'facet'` o similar, lo nombra lima). Son ortogonales: un racimo también deja huella. **C queda reservada** como apariencia de lectura (`appearance="text"`) para una entrega posterior: su valor está en tablas y fichas, pero su descubrimiento de «quitar» es más débil y conviene medirla dentro de `GTable` antes de publicarla. La base convencional no se publica como identidad: es el piso funcional sobre el que se construyen A y B.

## Qué lo hace distinto (resumen de la recomendación)

- **Quitar no mueve nada bajo tu mano** y la vuelta atrás aparece **donde actuaste**, con el foco (A): ni saltos, ni foco perdido, ni un aviso aparte para deshacer.
- **La categoría se dice una vez y con palabras** (B): el color agrupa, el nombre informa; los filtros se leen como frases.
- **Una tapa entera en vez de una × diminuta**, con vista previa tachada de lo que se va a quitar.
- **El mismo color que su avatar:** la misma clave da la misma categoría en `GTag` y en `GAvatar`, entre motores y en el servidor (hash documentado).
- Todo sin tokens nuevos, sin animación que exprese un estado que no existe, con `prefers-reduced-motion` y `forced-colors` cubiertos.

## Comprobaciones (verificar.mjs, puerto 4213)

| Parte | Qué se mide | Chromium | Firefox | WebKit |
| --- | --- | --- | --- | --- |
| Base | Roles y nombres por caso (`ariaSnapshot`); `aria-pressed` con clic, Espacio y Enter; nombres «Quitar X» únicos; foco tras quitar (siguiente, anterior, `emptyFocus`); Supr y Retroceso; anuncio y canal vivo; quitar todas → deshacer; despliegue; tamaños 32/24 y «Quitar» 24 × 24; área táctil de 44 (Chromium y WebKit); recorte con pista y estática partida; avatar decorativo de 20px; foco visible; hash = vectores de `GAvatar`; contraste de categorías y del pulsado; «Deshacer» de quitar todas se va al salir; foco a la siguiente con control y, sin ninguna, al grupo; RTL; 320px sin desplazamiento; consola limpia | 39/39 | 38/38 | 39/39 |
| A | Tapa 32 × 32; vista previa tachada; Δ0 al quitar; foco a «Deshacer»; anuncio; huella discontinua fuera del árbol; deshacer en su sitio; doble clic no quita la vecina; recogida al salir puntero y foco; modelo inmediato; contraste; movimiento reducido | 13/13 | 13/13 | 13/13 |
| B | Racimos por faceta; listas nombradas; lomo ≥ 3:1; «Quitar X de Faceta»; foco dentro del racimo y al siguiente; alternar en grupo nombrado; contraste | 9/9 | 9/9 | 9/9 |
| C | Δ0 en una frase; `span role=list/listitem`; sin caja en reposo; «Quitar» oculto pero en Tab; pestaña debajo, 24px, sin tapar la vecina, Δ0; texto visible en el nombre (2.5.3); foco la muestra; quitar y anuncio; caja solo al pulsar; marca ≥ 3:1; táctil en dos toques (Chromium y WebKit) | 13/13 | 12/12 | 13/13 |
| Tema | Oscuro: categorías y pulsado ≥ 4,5:1 (mínimo 4,52) | 1/1 | 1/1 | 1/1 |

**No verificado aquí:** lectores de pantalla reales (cómo se anuncian la huella, el racimo anidado y la lista en línea de C en VoiceOver y NVDA); táctil real (la emulación de Playwright no cubre el área de 44px con dedo real); `forced-colors` (solo escrito en el CSS del prototipo, sin medir); rendimiento con cientos de etiquetas; C dentro de una celda real de `GTable`.

## Hallazgos para lima

- **L1 · Nombre y entrega.** `GTag` + `GTagGroup` en `@grana/vue` (piezas pequeñas sin motor; no parece justificar entrada propia como `combobox`). Tag `g-tag`/`g-tag-group`, avisos `[Grana GTag]`/`[Grana GTagGroup]`.
- **L2 · API de `GTag` (propuesta).** `label` (String, obligatorio: es el texto, la clave del color y la base de los nombres), `href`, `pressed` (Boolean o `null`/ausente = no alterna; `v-model:pressed`), `removable`, `disabled`, `size` (`sm` · `md`), `color` (`'neutral'` o categoría 1..12; semánticos ignorados con aviso, como `GAvatar`), `categories`, `colorKey`, `avatar` (objeto de props de `GAvatar`, decorativo) o `icon` (nombre de Lucide, «dato → nombre», #202), `labels` (`remove`). Eventos `update:pressed` y `remove`. Avisos: sin `label`; `href` + `pressed`; `color` semántico; `removable` sin `labels.remove`.
- **L3 · API de `GTagGroup`.** Dirigido por datos para poder hacer A: `items` (`{ id, label, … }` con la forma de L2) con `v-model` (la lista sin lo quitado, actualizada **en el acto**); `label`/`labelledby` (obligatorio uno); `limit`; `clearable`; `emptyFocus` (elemento o selector; sin él, el grupo con `tabindex="-1"`); `as` (`list` por defecto · `inline` para frases y celdas); slot `tag` para pintar cada una sin perder la anatomía. La huella de A es **estado interno** del grupo (copia del quitado y su índice), no un `item` del modelo. Una `GTag` suelta con `removable` solo emite `remove` (sin huella: no tiene dónde volver).
- **L4 · Textos (`labels`, sin valores por defecto).** `remove` (`{label}`), `removeIn` (`{label}`, `{facet}`, B), `removed`, `removedIn`, `removedUndo`, `undo` (`{label}`), `restored`, `more` (`{n}`), `less`, `clearAll`, `cleared` (`{n}`), `undoAll` (`{n}`), `restoredAll` (`{n}`), `empty`. Aviso si falta uno que se va a usar.
- **L5 · Color y excepción `CAT_FAMILY_READERS`.** `GTag.css` leería `cat-k-soft`, `on-cat-k-soft` (estática), `cat-k`, `on-cat-k` y `cat-k-text` (alternar pulsado, §7.1; lomo de B y marca de C, #439). Hoy la excepción admite `GTranscript` (con `-text`) y `GAvatar` (solo `soft`/`on-soft`, #294): añadir `GTag` con esas cinco familias. **El hash debería salir de `GAvatar.vue` a una utilidad compartida** (`utils/categoryHash.js`, bruno) con los mismos vectores, para que no haya dos copias que puedan divergir.
- **L6 · Tokens: ninguno nuevo previsto.** Filo de la tapa `border-strong`; huella `border-control` discontinuo; lomo `space × 0.75` en `cat-k-text`; pestaña de C en `surface-sunken`; pulsado neutro `primary`/`on-primary`/`primary-text`. Lo mide coco.
- **L7 · Iconos.** `x`, `check`, `undo-2` y `circle` (relleno en C): **todos ya están** en la lista de la librería (`icons.md`). Ninguno nuevo.
- **L8 · Pista visual.** Reutilizar `utils/visualTip.js` (modo visual de #433) para el texto recortado y para «Quitar»/«Deshacer» de solo icono. Ningún `title`.
- **L9 · Movimiento.** A: recogida de huellas con `--g-duration-fast` + `--g-ease-out` (un desplazamiento que **se va**, no uno que llega: sin muelle, #299). `check` del pulsado con `--g-duration-press` + `--g-ease-out`. Ningún uso nuevo de `--g-ease-spring`/`--g-ease-bounce`.
- **L10 · `GTag` no es un campo.** No se envía ni se registra en `GForm`. Quien necesite enviar etiquetas usará `GTagInput` (reservado) o pondrá sus ocultos; anotarlo en el contrato para que nadie lo espere.
- **L11 · Adopción en `GFilterBar` (reservada).** Sus chips aplicados son «resumen (botón que edita) + quitar»: encajan como `GTag` con cuerpo de botón… que no es alternar ni enlace. Si se adopta, `GTag` necesitaría un cuarto cuerpo «botón de acción» (`aria-haspopup="dialog"`); no se propone ahora (rompería la regla de L2 de tres cuerpos) y queda para la ronda de adopción.
- **L12 · `GTagInput` (reservado, #338)** compondrá `GTagGroup` con A: la huella resuelve el «Retroceso que borra la última sin querer» de los campos de etiquetas.

## Preguntas de producto (dos)

1. **¿Qué concepto es la identidad de la etiqueta de Grana?** (a) A + B, con C reservada; (b) A + B + C; (c) solo A; (d) solo B. **Recomendación: (a).** A arregla el error real de quitar la equivocada y da deshacer en el sitio; B mejora la lectura donde hay facetas sin coste para quien no las usa; C tiene más riesgo de descubrimiento y conviene medirla dentro de `GTable` primero.
2. **¿«Alternar» (`aria-pressed`) entra en `GTag`?** (a) Sí, para filtros de la vista que actúan en el acto, con la regla «¿se envía con el formulario? → `GCheckboxGroup layout="chip"`»; (b) no: todo lo que se marca va en `GCheckboxGroup`/`GRadioGroup` chip y `GTag` solo es estática, enlace o quitable. **Recomendación: (a).** Los filtros rápidos de una tabla y los racimos de facetas de B no son campos (no tienen `name`, error ni envío), y una casilla obliga a etiqueta, ayuda y registro en `GForm` que aquí sobran; el riesgo es tener dos chips que se marcan, que la regla de una línea resuelve.
