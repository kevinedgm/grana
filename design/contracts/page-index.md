# Contrato · GPageIndex (índice de la página)

**Dueño:** lima · **Estado:** aprobado (formas `relay` y `list`, con `fold`); `line` y `rail`, reservadas · **Basado en:** `design/lab/sitio/r01/` (kiwi; concepto A «El índice se escribe», elegido por el usuario el 2026-11-08, #1034), hallazgos S-L2 y S-L4 de su `declaracion.md` e inventario #2 (`inventario-componentes.md`); la forma `list` en `design/lab/page-index/r01/` (kiwi, 16272793: PI-L1 a PI-L9, `verificar.mjs` 198/198 en los tres motores; calco de «En esta página» del sitio anterior, `design/lab/sitio/referencia/medidas.md` §5) · **Decisiones:** #1038 a #1040, #1042, #1047 a #1049, #1051, #1054, #1059
**Tag:** `g-page-index` · **Categoría:** navegación · **Entrada:** `@grana/vue/page-index` (forma `list`: extensión **`@grana/vue/page-index-list`**, #1054)

Índice de las secciones **de la página que se está leyendo**, con la sección actual siguiendo la lectura (`aria-current="location"`). Es la pieza que el sitio necesita en A («En esta página» como **relevo** en el zócalo de `GPageHeader`) y la que hoy se escribe a mano en formularios largos y ajustes (`GbSettingsLayout01` compone un índice con `GCard interaction="link"` y `current`). Por eso es un **componente reutilizable**, no una enmienda de `GPageHeader` (#1038): el encabezado solo lo aloja en su slot `actions`, como aloja cualquier `GMenu`.

## Principios

- **Datos, no lectura del DOM en el primer render.** Las secciones llegan en `items` (la aplicación las conoce: en el sitio, `page.headers` de VitePress; en un formulario, sus `GFormSection`). El HTML del servidor ya trae el índice (regla #1033: nada que dependa del entorno en el primer render).
- **La sección actual es un hecho de la lectura, no del foco.** La decide la **línea de lectura** (`api.md` «Lugar actual en la página», #1039), nunca el puntero ni el foco; cambia sin anuncio.
- **Presenta y emite intención.** Elegir una sección es un enlace a `#id`: lo resuelve el navegador (respeta el `scroll-behavior` de la aplicación) y Grana solo lleva el foco al destino. Con router o desplazamiento propio, la aplicación cancela `navigate` (#505).
- **Una forma por contexto, un solo motor.** El motor (secciones, actual, elegir, foco) es común; la forma es `appearance`. Existen `relay` (botón de menú en un zócalo) y `list` (columna de enlaces, con su forma plegada `fold`; #1054). Las dos pueden convivir en la misma página y comparten `items`, `modelValue` y eventos.
- **Sin textos ni iconos por defecto** (#226): los textos van en `label` y `labels`; los iconos propios son de la lista de la librería (`chevrons-up-down` en `relay`, `chevron-right` en `fold`; ya estaban).

## Cuándo usarlo (fronteras)

| Necesidad | Pieza |
| --- | --- |
| Secciones de **esta** página, con la actual | `GPageIndex` |
| Páginas del sitio o de la aplicación, con la actual (`aria-current="page"`) | `GSidebar` |
| Hermanos de un nivel de la ruta | puertas de `GBreadcrumbs` |
| Pasos de un proceso con estado (hecho, error) | `GStepper` |
| Paneles que se intercambian en el mismo sitio | `GTabs` (no es un índice: los paneles no conviven en la página) |
| Unos pocos destinos sueltos en un menú de acciones | `GMenu` con elementos-enlace (#571) |

## Uso

```vue
<!-- sections = [{ id: 'uso', label: 'Ejemplos' }, { id: 'api', label: 'API' }, …] -->
<GPageHeader :title="title" :labels="{ actions: 'Acciones de la página' }">
  <template #actions>
    <GPageIndex
      :items="sections"
      label="En esta página"
      :labels="{ findHint: 'Escribe para buscar', matches: '{count} secciones', matchesOne: '1 sección', none: 'Ninguna sección' }"
    />
    <GBtn variant="ghost" color="neutral" :done="copied" done-text="Copiada">Copiar importación</GBtn>
  </template>
</GPageHeader>
```

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `items` | Array | `{ id, label, href? }` (ver «Modelo») | `[]` | propia |
| `modelValue` | String \| null | `id` de la sección actual | `null` | compartida (`v-model` opcional) |
| `track` | Boolean | | `true` | propia |
| `scroller` | String \| Element \| null | selector o elemento que se desplaza | `null` (el documento) | propia |
| `appearance` | String | `relay` `list` | `relay` | propia (`list` necesita la extensión, #1054; `line` y `rail` reservados, #1038) |
| `fold` | Boolean | | `false` | propia (solo con `list`: forma plegada, #1054) |
| `label` | String | texto | sin valor (**obligatoria**) | propia (nombre del `<nav>` y primera parte del disparador) |
| `align` | String | `start` `end` | `end` | de `GMenu` (se pasa tal cual); con `fold`, el borde del botón con el que se alinea el panel |
| `labels` | Object | `relay`: `findHint`, `matches`, `matchesOne`, `none` (buscar al escribir de `GMenu`, #797) y `opened`, `openedLive`, `copied`, `copiedLive` (gestos de los elementos-enlace de `GMenu`, #577). `list` con `fold`: **`top`** («Volver arriba», propia, #1054) | `{}` | compartida (sin valores por defecto, #1049) |
| `id` | String | | generado (SSR-seguro) | propia |

### Reglas de props

- **`items`:** un elemento sin `id` o sin `label` (vacío o solo espacios) se ignora y avisa (aviso 1); `id` duplicado avisa (aviso 2) y gana el primero. El orden de `items` es el del documento: Grana no lo reordena.
- **`modelValue`:** controlado u opcional. Sin `v-model`, el componente lleva su estado interno y emite igual. Con `track`, el valor lo pone la lectura; la aplicación puede fijarlo (p. ej. tras una navegación propia) y la lectura lo corrige en el siguiente desplazamiento. Un `id` sin item se trata como ninguno.
- **`track`:** `false` apaga la línea de lectura (la actual es solo `modelValue`): para un índice dentro de un panel que no se desplaza o cuando la aplicación calcula la actual por su cuenta.
- **`scroller`:** el contenedor cuyo desplazamiento mueve las secciones. Sin valor, el documento (`document.scrollingElement`). Un selector que no encuentra nada avisa (aviso 3) y se usa el documento. Se resuelve **al montar** (#1033).
- **`appearance`:** fuera de lista, aviso 4 y `relay`. `list` sin la extensión instalada: aviso 7 y se pinta `relay` (la función sigue, con otra forma; patrón de extensiones de `api.md`, #1050).
- **`fold`:** solo con `list` (con `relay`, aviso 8 y se ignora). Ver «Forma `list`» §«Plegada».
- **`label`:** obligatoria (aviso 5). Nombra el `<nav>` y es el texto fijo del disparador.
- **Sin `density` (#1047):** el disparador mide siempre la altura de `GBtn` `md` (la de su `--g-btn-*`, 44 px táctil, nunca `compact` ni `comfortable`: es un control de cabecera, como los de `GPageHeader`); la lista sigue la región como cualquier `GMenu` (`density.md` §5.1). Una `density` que llegue por `attrs` no cambia el disparador.
- **`labels` (#1049; `top`, #1054):** en `relay`, `GPageIndex` **no tiene textos propios** en `labels`: pasa el objeto **entero y tal cual** a `GMenu`, y valen las reglas de `menu.md` (§«Textos» de los elementos-enlace y «Letras en listas de comandos» de `api.md`). Los ocho que importan aquí: los cuatro de buscar al escribir (#797; sin ellos, salto por letra) y las dos parejas `opened`/`openedLive` (Ctrl/⌘+clic y botón central dejan el menú abierto con huella: abrir la sección en otra pestaña) y `copied`/`copiedLive` (Ctrl/⌘+C copia el enlace absoluto a la sección, el gesto que más pide un índice de documentación). Sin una pareja, ese gesto cae al del navegador y **`GMenu` emite E6** (el aviso es suyo, con su prefijo; `GPageIndex` no añade otro). Recomendado: pasar las ocho. Las demás claves de `GMenu` (`external`, `newTab`, `destExternal`, `destNewTab`) no aplican: los enlaces son de la misma página.
- **Atributos:** `class`, `style` y `data-*` van a la raíz (`nav`).

### Modelo de `items`

```js
[{ id: 'uso', label: 'Ejemplos' }, { id: 'api', label: 'API' }, { id: 'teclado', label: 'Teclado y foco', href: '/combobox#teclado' }]
```

- **`id`:** el `id` del **elemento destino** en el documento (el encabezado de la sección o la sección). Es la clave de la lectura y del foco.
- **`href`:** por defecto `#` + `id`. Se admite otro solo si apunta a la misma página (p. ej. con `base`); Grana no lo comprueba.
- **`level`** (`2` | `3`; sin valor, `2`; #1054, PI-L3): **vale en `list`**: un `3` cuelga del `2` anterior en una lista anidada sangrada; un `3` sin `2` previo va a la raíz; otro valor cuenta como `2` y avisa (aviso 9). **En `relay` sigue reservado** (#1038: una lista larga de dos niveles dentro de un menú no se recorre bien): con `relay`, los `3` **no se pintan** (sin aviso; así una aplicación puede pasar los mismos `items` a las dos formas).
- Cualquier otro campo se conserva (llega al evento).

## Forma `relay` (A · el relevo)

Un **botón de menú** cuyo texto dice dónde estás («En esta página · API») y que despliega las secciones como un `GMenu` de elementos-enlace. Vive en el zócalo de `GPageHeader` (slot `actions`), que ya se pega; en estrecho, el encabezado lo muda al muelle con las demás acciones (`page-header.md` §«Muelle», mismos nodos). Fuera de `GPageHeader` funciona igual (una barra de herramientas de un formulario largo).

### Anatomía

```html
<nav class="g-page-index g-page-index--appearance-relay" aria-label="En esta página" id="ID">
  <!-- GMenu: el disparador es de GPageIndex (slot trigger), la lista es la de GMenu -->
  <button class="g-page-index__trigger" type="button" id="ID-trigger" aria-haspopup="menu" aria-expanded="false" aria-controls="ID-list">
    <span class="g-page-index__key" dir="auto">En esta página</span>
    <span class="g-page-index__value">
      <span class="g-page-index__stack" aria-hidden="true">       <!-- todas las etiquetas, apiladas: dan el ancho -->
        <span class="g-page-index__ghost" dir="auto">Ejemplos</span><span class="g-page-index__ghost" dir="auto">Teclado y foco</span>…
      </span>
      <span class="g-page-index__current" dir="auto">API</span>      <!-- la actual, en la misma celda de la pila -->
    </span>
    <span class="g-page-index__icon" aria-hidden="true"><!-- GLibIcon chevrons-up-down --></span>
  </button>
  <ul class="g-menu__list" role="menu" id="ID-list" popover="manual" aria-labelledby="ID-trigger">
    <li role="none"><a class="g-menu__item" role="menuitem" href="#uso" tabindex="-1">…Ejemplos</a></li>
    <li role="none"><a class="g-menu__item" role="menuitem" href="#api" aria-current="location" tabindex="-1">…API</a></li>
  </ul>
</nav>
```

- **Identificadores (#1049):** `GPageIndex` pasa su `id` (prop o generado, SSR-seguro) a `GMenu` como prop `id`; `GMenu` genera `{id}-trigger` para el disparador, `{id}-list` para la lista y `{id}-i-…` para cada elemento (`menu.md` §«`id` del disparador», #308), sin poner `{id}` en ningún nodo, así que el `nav` lo lleva sin duplicarse. El disparador de `GPageIndex` recibe sus atributos por el slot `trigger` y **no** pone `id` propio.
- **`nav` con nombre** (`label`): el índice es un punto de referencia propio («En esta página»), como midió kiwi en los tres motores. Dentro del `role="group"` de las acciones de `GPageHeader` es válido.
- **El menú es `GMenu`** con elementos-enlace (`menu.md` §«Elementos-enlace»): teclado, cierre, panel estable (#358), una sola luz (M1), buscar al escribir con sus cuatro `labels` (#797; **aún no construido en `GMenu`**, `PENDIENTES.md` §6: hasta entonces, salto por letra). **Enmienda de la frontera de #571 (#1038):** `GMenu` puede llevar **todas** las secciones de una página cuando lo compone `GPageIndex` (patrón «Navigation Menu Button» de APG); la navegación entre páginas sigue en `GSidebar`.
- **Sección actual en la lista:** el elemento lleva `current: 'location'` → `aria-current="location"` (enmienda de `GMenu`, #1039). Al abrir, el foco sigue empezando en el primero (APG; abrir en la actual sigue reservado en `menu.md` L11).
- **Disparador:** `<button>` de `GPageIndex` en el slot `trigger` de `GMenu` (recibe sus `attrs`). Nombre accesible = su texto: «En esta página API» (`key` + `current`); la pila es `aria-hidden`. Sin actual (antes de la primera sección), solo `key`; la celda conserva el ancho.
- **Ancho estable (Δ0):** la celda del valor es una pila (rejilla de una celda) con **todas** las etiquetas ocultas (`visibility: hidden`) y la actual encima: el disparador mide la etiqueta más larga desde el HTML del servidor, **sin medir con JS**, y no cambia de ancho al cambiar la sección. Tope de ancho de coco (alias local `--_relay-max`, múltiplo de `space`) con elipsis en la actual; el nombre accesible lleva siempre el texto entero.
- **Táctil:** el disparador y cada elemento ≥ 44 px con `pointer: coarse` (de `GBtn`/`GMenu` y de `GPageIndex.css`).

### Elegir una sección

1. El enlace del menú pasa por la guarda común (#505 con #574) y `GMenu` emite `navigate`; `GPageIndex` lo **reemite** como su `navigate` `{ item, event }` (mismo evento nativo).
2. **Sin cancelar:** el navegador sigue el `#id` (respeta `scroll-padding` de `GAppShell`/`GPageHeader`, #713, y el `scroll-behavior` de la aplicación: Grana no anima el desplazamiento). La actual pasa **al instante** al destino y la línea de lectura queda en pausa hasta que el desplazamiento termina (`scrollend`, o 150 ms sin cambios donde no existe), para que el relevo no recorra las secciones intermedias. **La elegida se sostiene (#1048):** al terminar el salto la lectura **no** se reanuda en ese momento; la elegida sigue siendo la actual hasta el **primer evento `scroll` posterior al fin del salto** (rueda, toque, teclas de desplazamiento, barra, un enlace del contenido o un desplazamiento de la aplicación), que reanuda la lectura en ese mismo cuadro. Así una sección más corta que un tercio del visor, o una del final del documento, no cede la actual a la siguiente sin que el usuario se haya movido (ver `api.md` «Lugar actual…»).
3. **Foco:** cuando `GMenu` ha cerrado y devuelto el foco al disparador, `GPageIndex` lo lleva al **destino** (`focus({ preventScroll: true })`). Si el destino no es enfocable y no tiene `tabindex`, Grana le pone `tabindex="-1"` (y no lo quita; límite documentado). Así el siguiente Tab sigue desde la sección (WCAG 2.4.3), no desde el zócalo pegado. Si el destino no existe en el documento, el foco se queda en el disparador y avisa (aviso 6).
4. **Cancelado** (`event.preventDefault()`, síncrono): Grana no cambia la actual ni mueve el foco; la aplicación desplaza y enfoca (router, desplazamiento propio).
5. Ctrl/⌘/Mayús+clic, botón central y Ctrl/⌘+C: lo de `GMenu` (pestaña nueva, copiar el enlace a la sección).

### Al montar y al cambiar de ruta

- Al montar: si `location.hash` coincide con un `id`, esa es la actual; si no, la lectura decide en el primer cuadro.
- Al cambiar `items` (nueva página en la misma instancia): se descarta la actual (y la elegida sostenida, #1048) y se vuelve a leer en el siguiente cuadro; el ancho de la pila se rehace con el HTML (sin medir).

## Forma `list` (columna «En esta página»; #1054)

La columna clásica de un sitio de documentación: título, enlaces a las secciones (`h2` y `h3` sangrados), la actual marcada sobre una **línea guía** con un **marcador** de 2 px. Es el calco de «En esta página» del sitio anterior (`design/lab/sitio/referencia/medidas.md` §5: Δ x, y y alto 0 a 1280 en el prototipo de kiwi). Sirve también fuera del sitio: formularios largos y páginas de ajustes (`GbSettingsLayout01` dejará de componerlo a mano).

**Mismo motor que `relay`, otra semántica:** `relay` es un botón de menú (solo cabe un control en un zócalo); `list` es una **navegación de enlaces** (`nav` + `ul` + `a`) que se recorre con Tab y se lee como lista. No pinta un `GMenu`.

### Anatomía

```html
<nav class="g-page-index g-page-index--appearance-list [has-current]" aria-labelledby="ID-title" id="ID">
  <div class="g-page-index__body">                                    <!-- la línea guía: borde inicial -->
    <span class="g-page-index__marker" aria-hidden="true"></span>     <!-- 2 × 18 sobre la línea, centrado en la actual -->
    <p class="g-page-index__title" id="ID-title" dir="auto">En esta página</p>
    <div class="g-page-index__scroll" tabindex="-1">                  <!-- desplazamiento propio (#570) -->
      <ul class="g-page-index__list">
        <li><a class="g-page-index__link" href="#uso" dir="auto" title="Uso">Uso</a>
          <ul class="g-page-index__sub">
            <li><a class="g-page-index__link" href="#catalogo" dir="auto" title="Catálogo local" aria-current="location">Catálogo local</a></li>
          </ul></li>
      </ul>
    </div>
  </div>
</nav>
```

1. **`nav` nombrado por su título visible** (`label`, la misma prop obligatoria) con `aria-labelledby`. El título es un **`<p>`, no un encabezado**: no entra en el esquema de la página (el original tampoco) y el punto de referencia ya lo anuncia.
2. **Una línea por enlace con elipsis** y `title` con el texto entero (calco); el nombre accesible es siempre el texto completo.
3. **`aria-current="location"` en un solo enlace** (`api.md` «Lugar actual», #1039); la rama (`h2` del que cuelga) no lo lleva. `has-current` en la raíz mientras hay actual (el marcador se ve).
4. **Desplazamiento propio (PI-N3; corrige el defecto 8 del original, que dejaba fuera del visor la actual a partir de la sección 20 en una ficha de 62):** la lista cabe en el visor bajo lo pegado (`max-block-size` con `--g-app-shell-top` y la barra local, coco) y se desplaza dentro (`overscroll-behavior: contain`); el contenedor `__scroll` lleva `tabindex="-1"` (#570).
5. **El pegado es de la maqueta, no del componente:** la columna derecha `position: sticky` es del `Layout` de la aplicación (como la columna izquierda es del chasis). `GPageIndex` no se pega a sí mismo (sigue reservado, abajo).

### Elegir, actual y foco

Los del motor (§«Elegir una sección» de `relay`, 1 a 5; la elegida se sostiene, #1048), con dos diferencias: el enlace es del propio `GPageIndex` (no de `GMenu`), así que la guarda de #505 la aplica él y emite `navigate` `{ item, event }` directamente; y no hay menú que cerrar antes de llevar el foco al destino. Ctrl/⌘/Mayús+clic y botón central: los del navegador (no hay gestos de `GMenu` en `list`).

### PI-P1 · La lista se sigue sola (personalidad, #1054)

- Cuando la sección actual sale de la vista **de la columna**, la columna se desplaza **ella sola** lo justo para traerla de vuelta, con **dos filas de margen**; **nunca desplaza la página**. Suave (`scrollBy` con `behavior: 'smooth'`) si el salto es menor que el alto de la columna; **instantáneo** si es mayor o con movimiento reducido.
- **Se detiene mientras el puntero está sobre la columna o el foco dentro de ella** (quien mira la lista manda; regla 4 de #358) y se reanuda en el siguiente cambio de actual tras salir.
- **Sin prop:** es la personalidad de la forma y no cambia el aspecto en reposo (`follow` queda como nombre reservado si alguien pide apagarlo).
- **Por qué:** en la ficha de `GCombobox` el original perdía el marcador por debajo del visor; quien lee siempre ve dónde está sin tocar la columna (medido por kiwi en las secciones 1, 6, 20, 40 y al final, sin mover la página, tres motores).

### Plegada (`fold`; PI-L2)

La **misma instancia** se pinta como **botón de texto + panel** (APG *Disclosure*), el desplegable de la barra local del sitio anterior:

```html
<nav class="g-page-index g-page-index--appearance-list g-page-index--fold g-page-index--align-{start|end}" aria-labelledby="ID-fold" id="ID">
  <button class="g-page-index__fold" id="ID-fold" type="button" aria-expanded="false" aria-controls="ID-drop">
    <span dir="auto">En esta página</span><span class="g-page-index__chev" aria-hidden="true">[GLibIcon chevron-right flip-rtl]</span>
  </button>
  <div class="g-page-index__drop" id="ID-drop" hidden>
    <a class="g-page-index__top" href="#">Volver arriba</a>           <!-- labels.top -->
    <div class="g-page-index__scroll" tabindex="-1"><ul class="g-page-index__list">…la misma lista…</ul></div>
  </div>
</nav>
```

1. **Botón con `aria-expanded` y `aria-controls`** (el original no tenía `aria-expanded`: se corrige); nombre = `label`; el `chevron-right` gira 90° al abrir (con `flip-rtl` en reposo).
2. **«Volver arriba»** (`labels.top`, obligatorio con `fold`, aviso 10): primer enlace del panel; desplaza el documento (o el `scroller`) a 0, cierra el panel y lleva el foco al **`h1` de `main`** (si no hay, a `main`, que `GAppShell` ya hace enfocable; sin `main`, al botón). No emite `navigate`; con `preventDefault` del clic primario, como un enlace interno (Ctrl/⌘+clic lo deja al navegador).
3. **Elegir** una sección cierra el panel y lleva el foco al destino; **Esc** cierra y devuelve el foco al botón; **pulsar fuera** cierra; al cambiar `items`, se cierra.
4. **`align`** (`start` | `end`): el borde del botón con el que se alinea el panel (`g-page-index--align-*`). El panel nunca sale del visor (coco; medido por kiwi a 1024 y 375).
5. **Táctil:** con `pointer: coarse`, botón y filas ≥ 44 px (las filas siguen con elipsis).
6. **Sin luz ni PI-P1 en el panel** (es corto y se abre a petición); el marcador sí se pinta.

### Dos instancias en la misma página (PI-L5)

Como el original, la aplicación pone **dos instancias** —la columna y la plegada— y su maqueta enseña una u otra con su CSS (el corte es de la maqueta, no del índice). **La instancia `list` que no se pinta** (sin cajas: `getClientRects().length === 0` en el cuadro de lectura) **no lee, no emite y no sigue**: sin trabajo doble y sin que las dos se disputen la actual si comparten `v-model` (lo destapó la prueba de kiwi: la plegada oculta deshacía la elegida sostenida de la columna). Al volver a pintarse (cambio de corte), lee en el siguiente cuadro. Vale para `list` (la que convive consigo misma); en `relay` no se pide (el muelle de `GPageHeader` mueve los mismos nodos).

### Movimiento (`list`; rúbrica `docs/documentacion/rubrica-movimiento.md`)

| Qué | Cómo | Movimiento reducido |
| --- | --- | --- |
| Marcador al cambiar de sección | `translate` (eje de bloque) con `--g-duration-slow` + `--g-ease-out` (el calco: `top .25s cubic-bezier(0,1,.5,1)`; 240 ms es el nivel más cercano de la escala, sin duración ni curva nuevas; PI-H2 lo mide coco) | Solo fundido `--g-duration-fast` |
| Color del enlace | `--g-duration-slow` | Igual |
| Chevron del plegado | `rotate` 90° con `--g-duration-slow` + `--g-ease-out` | Sin giro (cambio al instante) |
| PI-P1 · la columna se sigue | `scrollBy` suave dentro de la columna; instantáneo si el salto supera la columna | Instantáneo |
| Apertura del panel plegado | Entrada y salida comunes de los paneles (#1002) | Las de #1002 |
| Nada al montar | La primera actual se pinta sin viajar (`is-instant` dos cuadros) | — |

Rúbrica: **A** cumple (el marcador dice dónde se lee; PI-P1 lo mantiene a la vista); **B** cumple; **C** cumple (nada mueve la página: marcador y lista se mueven **dentro** de la columna); **D** cumple (transiciones; un cambio a mitad parte de donde está); **E** cumple (lo provoca el desplazamiento del usuario; PI-P1 se detiene si la persona mira la lista); **F** cumple; **G** a medir por bruno (una lectura de cajas por cuadro, leer todo antes de escribir, #964; prueba de 200 secciones, tareas < 50 ms); **H** cumple (mismo motor y misma línea de lectura que `relay`). **No verificable aquí:** comodidad con desplazamiento inercial táctil.

### Extensión `@grana/vue/page-index-list` (PI-L9, #1054)

- **Patrón de extensiones de `api.md`** (#1050, como el filtro de `GSidebar`): la prop (`appearance="list"`, `fold`, `level`, `labels.top`) sigue en `GPageIndex` (tipos y documentación en un solo sitio); **la forma `list` va en la extensión** (global UMD `GranaPageIndexList`), que exporta un plugin por defecto, `app.use(PageIndexList)`, que hace `app.provide` de una **clave interna** compartida por `__shared` y que `GPageIndex` inyecta. Igual en SSR (la aplicación instala el plugin en el servidor y en el cliente).
- **El motor se queda en `GPageIndex`** (lectura, elegida sostenida, `navigate`, foco al destino): la extensión recibe por la conexión el estado y las acciones y pinta la lista, el marcador, la plegada, PI-P1 y PI-L5. **Sin copia del motor** en `page-index-list.js` (compuerta, PI-H1).
- **Sin el plugin:** `appearance="list"` se pinta como `relay` y avisa (aviso 7). Nunca un error.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `id` \| `null` | La sección actual cambia (lectura o elección) |
| `navigate` | `{ item, event }` | Se elige una sección (guarda de #505), en `relay` o en `list`; cancelable. «Volver arriba» no lo emite |

## Métodos

| Método | Firma | Qué hace |
| --- | --- | --- |
| `refresh` | `refresh(): void` | Vuelve a leer la actual en el siguiente cuadro (contenido que crece sin desplazamiento: imágenes, `GFormReveal`, un acordeón). Con una elegida sostenida (#1048) no hace nada: la sostenida solo la suelta un desplazamiento |

Expuesto con `defineExpose`; consta en `meta.json` (`methods`).

## Teclado

**`list`:** Tab recorre los enlaces (y en `fold`, el botón; abierto, «Volver arriba» y los enlaces); Intro sigue el enlace; sin flechas (es una lista de enlaces). **`fold`:** Intro/Espacio en el botón abre o cierra; Esc cierra y devuelve el foco al botón. Tras elegir, el foco va al destino.

**`relay`:** el de `GMenu` (disparador Intro/Espacio/↓ abre en el primero, ↑ en el último; ↑ ↓ Inicio Fin; letras con buscar al escribir; Intro sigue el enlace; Espacio activa; Esc cierra y devuelve el foco al disparador; Tab cierra y sigue). Tras elegir, el foco va al destino (§«Elegir una sección», 3).

## Accesibilidad

- `aria-current="location"` en **un solo** elemento, y solo en la lista (el disparador no lo lleva: su texto ya lo dice).
- **Sin anuncios:** el cambio de sección es consecuencia del desplazamiento del propio usuario (4.1.3 no aplica); el nombre del disparador cambia en silencio. Nada de regiones vivas.
- 1.4.1: en `relay`, la actual se distingue en la lista por forma y peso además del color (coco; la marca de `current` de `GMenu`). En `list`, por el **marcador** (forma, `--g-color-accent-text` ≥ 3:1 sobre el fondo: 5,69:1 claro, 4,95:1 oscuro) además del color `text` frente a `text-muted` (2,33:1 y 1,77:1: el color solo no basta, el marcador es obligatorio).
- `list`: `nav` nombrado por el título (`aria-labelledby`), título sin encabezado; el desplazador con `tabindex="-1"` (#570). `fold`: `aria-expanded` real.
- 2.4.11: el disparador vive en el zócalo pegado; el foco que llega al destino queda bajo el zócalo gracias al `scroll-padding` de #713 (`api.md` «Piezas pegadas»).
- Contraste: `key` en `--g-color-text-muted` y `current` en `--g-color-text` ≥ 4,5:1 sobre el fondo del zócalo; borde del disparador como control ≥ 3:1.

## Movimiento de `relay` (#1040; rúbrica `docs/documentacion/rubrica-movimiento.md`)

| Qué se mueve | Cómo | Movimiento reducido |
| --- | --- | --- |
| **Relevo del texto** al cambiar la sección actual (#1047) | **En dos fases sobre una sola etiqueta** (`__current`; nunca hay dos visibles). **1. Sale:** `data-dir` (`down`/`up`, el sentido de la lectura) + `data-phase="out"`: la etiqueta se funde y se va un paso de `space × 1` hacia donde se lee. **2. Entra:** al terminar la salida (`transitionend`, con red de seguridad de `--g-duration-fast` + un cuadro) bruno **cambia el texto** y pone `data-phase="in"` (invisible, desplazada un paso desde donde viene la lectura). **3.** En el cuadro siguiente, tras forzar el estilo, quita `data-phase` **y** `data-dir`: transición a reposo. `--g-duration-fast` + `--g-ease-out` cada fase; solo `opacity` y `transform` | Solo fundido `--g-duration-fast` (patrón único de #300), mismas fases sin desplazamiento |
| **Ráfaga** (otro cambio a menos de 600 ms del anterior, la ventana de `GTooltip`) | Cambio **instantáneo**, sin fundido ni desplazamiento: al desplazarse deprisa no hay animaciones encadenadas | Igual |
| Interrupción | Un cambio a mitad de transición parte del estado actual (transición CSS, no `@keyframes`): durante la salida, el destino nuevo sustituye al pendiente (no se encadenan relevos: al entrar se pinta la **última** actual); durante la entrada, vuelve a `data-phase="out"`. Nunca dos etiquetas visibles | — |
| Apertura de la lista | La de `GMenu` (#1002) | La de `GMenu` |
| Nada al montar | El primer valor se pinta sin transición | — |

Evaluación (rúbrica §2): **A** cumple (dice qué cambió y en qué dirección se lee); **B** N/A; **C** cumple (desplazamiento de 4 px dentro de una celda fija, sin mover el disparador ni la página: referencia estacionaria); **D** cumple con la regla de interrupción; **E** cumple (lo provoca el desplazamiento del usuario; nada bloquea); **F** cumple (reducido = fundido); **G** a medir: lectura de cajas en un cuadro por desplazamiento, sin escribir hasta leer todas (lección de #964), tareas < 50 ms con 200 secciones; **H** N/A. **No verificable hasta construir:** comodidad con desplazamiento inercial real en táctil.

## Clases (contrato bruno ↔ coco)

| Clase / atributo | Dónde | Quién la pone |
| --- | --- | --- |
| `g-page-index`, `g-page-index--appearance-relay` | raíz `nav` | bruno |
| `g-page-index__trigger`, `__key`, `__value`, `__stack`, `__ghost`, `__current`, `__icon` | disparador | bruno |
| `data-dir="down"` / `"up"` | `__current` durante el relevo (sentido de la lectura); se quita en el último cuadro | bruno |
| `data-phase="out"` / `"in"` | `__current`: `out` mientras sale la etiqueta, `in` desde el cambio de texto hasta el cuadro siguiente; se quita al reposo (#1047) | bruno |
| `is-burst` | `__current` cuando el cambio cae en la ventana de 600 ms: **el texto cambia al instante**, sin `data-phase` ni `data-dir` | bruno |
| `is-empty` | raíz, sin sección actual | bruno |
| `g-page-index--appearance-list`, `g-page-index--fold`, `g-page-index--align-start` / `--align-end` (con `fold`) | raíz | bruno (extensión) |
| `g-page-index__body`, `__marker`, `__title`, `__scroll`, `__list`, `__sub`, `__link` | `list` | bruno (extensión) |
| `g-page-index__fold`, `__chev`, `__drop`, `__top` | `fold` | bruno (extensión) |
| `has-current` | raíz `list`, con actual (marcador visible) | bruno |
| `is-instant` | raíz `list`, dos cuadros: el marcador se coloca sin viajar (al montar, al volver a pintarse, al cambiar `items`) | bruno |
| `is-open` | raíz `fold`, panel abierto (el chevron gira) | bruno |
| `--_marker-y`, `--_marker-h` | `__marker` (geometría escrita en la capa que la pinta, #964): **borde superior y alto de la fila del enlace actual** (su caja de `space × 8`, no la del texto), en px, **relativos al borde de relleno de `g-page-index__body`**; el CSS dibuja el marcador de 2 × 18 centrado en ese tramo (H6 de bruno y coco, #1067) | bruno |

## Tokens

**Ninguno nuevo** (`tokens.md` §59). Consume los de `GBtn` `outline` `neutral` para el disparador (lo pinta `GPageIndex.css` con sus mismos tokens: `--g-color-border-control`, `--g-color-text`, `--g-color-text-muted`, `--g-radius-shape`, `--g-color-focus`, `--g-focus-width`, `--g-focus-offset`, `--g-border-width`), `--g-text-body-sm-*`, `--g-text-action-weight`, `--g-font-ui`, `--g-space-1`, `--g-duration-fast`, `--g-ease-out`. La lista es la de `GMenu`.

**`list` (PI-L7, #1054): ninguno nuevo** (`tokens.md` §60): línea guía `--g-color-border`, marcador `--g-color-accent-text`, enlaces `--g-color-text-muted` (actual y hover `--g-color-text`), título `--g-color-text` con `--g-text-title-sm-weight`, texto `--g-text-body-sm-*`, panel de `fold` `--g-color-surface` + `--g-color-border-strong` + `--g-shadow-2` + **`--g-radius-lg`** (8 px: el calco mide 8, `referencia/medidas.md` §5, estado `en-esta-pagina-375`; antes `--g-radius-md`, H3 de coco, #1067), `--g-duration-fast`/`slow`, `--g-ease-out`. El marcador de 2 px, las filas de 32 (`space × 8`) y la sangría de `h3` (`space × 4`) son medidas de coco.

## Avisos de desarrollo (`[Grana GPageIndex]`, guarda canónica de #653, una vez por instancia y motivo)

1. Elemento de `items` sin `id` o sin `label`: se ignora. 2. `id` duplicado: gana el primero. 3. `scroller` no encontrado: se usa el documento. 4. `appearance` fuera de lista: `relay`. 5. Sin `label`. 6. El destino de un `id` no está en el documento al elegirlo (y, al montar con `track`, ningún `id` de `items` está en el documento). 7. `appearance="list"` sin la extensión `@grana/vue/page-index-list` instalada: se pinta `relay`. 8. `fold` sin `list`: se ignora. 9. `level` fuera de `2` o `3`: cuenta como `2`. 10. `fold` sin `labels.top`.

## SSR

El primer render no lee `location`, `matchMedia` ni cajas (#1033): pinta `items` y `modelValue`. La lectura, el `hash`, el `scroller`, PI-L5 (¿se pinta?) y PI-P1 se resuelven en `onMounted`; en `list`, el primer HTML ya trae la lista con la actual de `modelValue` y el marcador sin colocar (`has-current` solo tras la primera lectura: sin salto, porque el marcador es una capa absoluta). Prueba de hidratación (`GPageIndex.hydration.test.js`, como `GCombobox`).

## Paquete y peso (#1042)

- **Entrada propia `@grana/vue/page-index`** (global UMD `GranaPageIndex`), con plugin `app.use(PageIndex)`; `@grana/vue` no lo exporta. #550: el margen del principal está agotado. `GMenu` y `utils/menuNav.js` llegan por `__shared`, **sin copia** (compuerta).
- **Tope: 3,25 KiB (3 328 B) gzip** de `dist/page-index.js` (**#1067**, decisión del usuario del 2026-11-08 tras la medida de bruno en 6b50edc4: 3 141 B con la conexión de `list`; antes 3 072 B por #1051 y 2 560 B por #1042). Lo que `list` añade aquí sigue siendo solo la conexión (inyectar la clave, delegar el pintado, el aviso 7, `fold`/`level`/`labels.top` en las props y la consulta de PI-L5 al motor). Si no cabe, vuelve a lima con la medida, y con más decide el usuario.
- **Extensión `@grana/vue/page-index-list`** (global UMD `GranaPageIndexList`; #1054): **tope 2,25 KiB (2 304 B) gzip** de `dist/page-index-list.js` (**#1067**, decisión del usuario del 2026-11-08: medido 2 228 B en 6b50edc4; antes 2 048 B por #1059, con la estimación de kiwi de ≈ 1,2 KiB sin medir). La clave interna de conexión viaja por `__shared` (módulo `utils/pageIndexList.js` en el principal: bytes; lote de #1059); `GLibIcon` y `utils/landing.js` (`land`, para el foco de «Volver arriba») también por `__shared`, sin copia.
- Declarar las dos en `exports`, `typesVersions`, `ENTRIES` de `scripts/build-types.mjs` y `src/types.test.js` (#442, #443).
- Compuertas para `gates.sh`: `test -f packages/vue/dist/page-index-list.js`, `grep -q "g-page-index__marker" packages/vue/dist/grana.css`, `! grep -q "g-page-index__marker" packages/vue/dist/page-index.js` (la forma no viaja en la entrada de `relay`) y que `page-index-list.js` no lleve copia del motor de lectura (bruno elige la cadena propia). Además: `test -f packages/vue/dist/page-index.js`, `! grep -q "GPageIndex" packages/vue/dist/grana.js`, `grep -q "g-page-index__stack" packages/vue/dist/grana.css`, y que `dist/page-index.js` no lleve una copia de `GMenu` (bruno elige la cadena propia de `GMenu.vue` que lo demuestra).

## `meta.json` y tipos (#443)

Props (también `fold` y `appearance` con `list`), eventos (`update:modelValue`, `navigate`), método `refresh`; `types/overrides.mjs`: `'GPageIndex.items': 'Array<{ id: string; label: string; href?: string; level?: 2 | 3; [key: string]: unknown }>'`, `'GPageIndex.scroller': 'string | Element | null'`. `status: "draft"` hasta la auditoría de coco.

## Reservado (con nombre, #1038)

- ~~`appearance="list"`~~ **contratada** (#1054); siguen reservados en ella los **errores por sección** de `GForm` (`labels.sectionErrors`, para formularios y ajustes), **PI-P2 · Llegada** (`landing`: marca de llegada `data-g-landed` en el encabezado de destino, `utils/landing.js`; kiwi la midió) y el nombre `follow` (apagar PI-P1). Siguen reservadas **`appearance="line"`** (línea de enlaces bajo el encabezado, concepto C) y **`appearance="rail"`** (estaciones numeradas, concepto B): cada una con su ronda corta de kiwi sobre este motor. La de formularios y ajustes es la siguiente que se pedirá (`GbSettingsLayout01` dejaría de componerlo a mano).
- **`level` en `relay`** y **abrir el menú en la actual**.
- **Pegado propio** (la columna `list` se pega hoy por la maqueta de la aplicación): exigirá las condiciones de `GSplit` S-L5 (alto máximo con desplazamiento propio y `tabindex="-1"`, #570).

## Verificación (criterio de hecho)

- **bruno (vitest + jsdom):** modelo y avisos 1 a 6; `labels` llega entero a `GMenu`; ids `{id}-trigger` y `{id}-list`; `aria-current="location"` en uno solo; `navigate` con la guarda de #505 (clic primario emite; modificadores, botón central y `target` no); cancelado no mueve el foco; sin cancelar el foco acaba en el destino (`tabindex="-1"` puesto si falta); ancho de la pila con todas las etiquetas; hidratación sin desajuste.
- **Playwright (puerto propio, tres motores):** la actual sigue a la línea de lectura (una sola, la correcta al llevar cada sección a la vista; la última al final del documento); elegir no recorre las intermedias; **la elegida se sostiene** tras el salto con una sección más corta que un tercio del visor y con la última del documento, y el primer desplazamiento posterior (rueda y teclas) reanuda la lectura (#1048); Δ0 del disparador al cambiar de sección; ráfaga sin transiciones; dentro de `GPageHeader` pegado y en el muelle (mismo nodo, foco); táctil ≥ 44; reducido = fundido; rendimiento con 200 secciones (tareas < 50 ms, `--workers=1`).
- **`list` y `fold` (bruno, vitest):** sin la extensión, aviso 7 y `relay`; `nav` con `aria-labelledby` al título `<p>`; `level` 3 anidado bajo el 2 anterior y a la raíz sin 2 previo; en `relay`, los 3 no se pintan; una sola `location`; `navigate` desde `list` con la guarda; `fold`: `aria-expanded`, «Volver arriba» primero (desplaza a 0, foco al `h1` de `main`), Esc devuelve el foco, elegir cierra; avisos 7 a 10; PI-L5 (la instancia sin cajas no emite).
- **`list` (Playwright, tres motores; las de `design/lab/page-index/r01/verificar.mjs` como base):** cuatro posiciones de lectura con una sola actual y marcador centrado (±1,5 px); al final, la última visible; elegir una del final se sostiene; la rueda reanuda; PI-P1 trae la actual a la vista sin mover la página y se detiene con el puntero encima; dos instancias con el mismo `v-model` sin disputa; plegada a 1024 y 375 dentro del visor, táctil ≥ 44, destino bajo lo pegado (`--g-app-shell-local-bar`); reducido = fundido; 200 secciones con tareas < 50 ms (`--workers=1`).
- **coco:** `GPageIndex.css` (las dos formas), contraste del disparador, del marcador y de los enlaces en claro y oscuro y en la zona de marca, PI-H2 (curva del marcador), rúbrica de movimiento, paridad con `referencia/` (`sitio-marco.md` §12), auditoría.
- **No verificado (entorno real):** lector de pantalla con `aria-current="location"` dentro de un `menu` y en una lista larga de enlaces, y con la *disclosure* de `fold`; desplazamiento inercial en táctil real.
