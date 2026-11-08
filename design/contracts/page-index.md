# Contrato · GPageIndex (índice de la página)

**Dueño:** lima · **Estado:** aprobado (forma `relay`); las demás formas, reservadas · **Basado en:** `design/lab/sitio/r01/` (kiwi; concepto A «El índice se escribe», elegido por el usuario el 2026-11-08, #1034), hallazgos S-L2 y S-L4 de su `declaracion.md` e inventario #2 (`inventario-componentes.md`) · **Decisiones:** #1038 a #1040, #1042, #1047 a #1049, #1051
**Tag:** `g-page-index` · **Categoría:** navegación · **Entrada:** `@grana/vue/page-index`

Índice de las secciones **de la página que se está leyendo**, con la sección actual siguiendo la lectura (`aria-current="location"`). Es la pieza que el sitio necesita en A («En esta página» como **relevo** en el zócalo de `GPageHeader`) y la que hoy se escribe a mano en formularios largos y ajustes (`GbSettingsLayout01` compone un índice con `GCard interaction="link"` y `current`). Por eso es un **componente reutilizable**, no una enmienda de `GPageHeader` (#1038): el encabezado solo lo aloja en su slot `actions`, como aloja cualquier `GMenu`.

## Principios

- **Datos, no lectura del DOM en el primer render.** Las secciones llegan en `items` (la aplicación las conoce: en el sitio, `page.headers` de VitePress; en un formulario, sus `GFormSection`). El HTML del servidor ya trae el índice (regla #1033: nada que dependa del entorno en el primer render).
- **La sección actual es un hecho de la lectura, no del foco.** La decide la **línea de lectura** (`api.md` «Lugar actual en la página», #1039), nunca el puntero ni el foco; cambia sin anuncio.
- **Presenta y emite intención.** Elegir una sección es un enlace a `#id`: lo resuelve el navegador (respeta el `scroll-behavior` de la aplicación) y Grana solo lleva el foco al destino. Con router o desplazamiento propio, la aplicación cancela `navigate` (#505).
- **Una forma por contexto, un solo motor.** El motor (secciones, actual, elegir, foco) es común; la forma es `appearance`. En v1 solo existe `relay`.
- **Sin textos ni iconos por defecto** (#226): los textos van en `label` y `labels`; el único icono propio es el de la librería (`chevrons-up-down`, ya en la lista).

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
| `appearance` | String | `relay` | `relay` | propia (`list`, `line` y `rail` reservados, #1038) |
| `label` | String | texto | sin valor (**obligatoria**) | propia (nombre del `<nav>` y primera parte del disparador) |
| `align` | String | `start` `end` | `end` | de `GMenu` (se pasa tal cual) |
| `labels` | Object | `findHint`, `matches`, `matchesOne`, `none` (buscar al escribir de `GMenu`, #797) y `opened`, `openedLive`, `copied`, `copiedLive` (gestos de los elementos-enlace de `GMenu`, #577) | `{}` | compartida, de `GMenu` (sin valores por defecto, #1049) |
| `id` | String | | generado (SSR-seguro) | propia |

### Reglas de props

- **`items`:** un elemento sin `id` o sin `label` (vacío o solo espacios) se ignora y avisa (aviso 1); `id` duplicado avisa (aviso 2) y gana el primero. El orden de `items` es el del documento: Grana no lo reordena.
- **`modelValue`:** controlado u opcional. Sin `v-model`, el componente lleva su estado interno y emite igual. Con `track`, el valor lo pone la lectura; la aplicación puede fijarlo (p. ej. tras una navegación propia) y la lectura lo corrige en el siguiente desplazamiento. Un `id` sin item se trata como ninguno.
- **`track`:** `false` apaga la línea de lectura (la actual es solo `modelValue`): para un índice dentro de un panel que no se desplaza o cuando la aplicación calcula la actual por su cuenta.
- **`scroller`:** el contenedor cuyo desplazamiento mueve las secciones. Sin valor, el documento (`document.scrollingElement`). Un selector que no encuentra nada avisa (aviso 3) y se usa el documento. Se resuelve **al montar** (#1033).
- **`appearance`:** fuera de lista, aviso 4 y `relay`.
- **`label`:** obligatoria (aviso 5). Nombra el `<nav>` y es el texto fijo del disparador.
- **Sin `density` (#1047):** el disparador mide siempre la altura de `GBtn` `md` (la de su `--g-btn-*`, 44 px táctil, nunca `compact` ni `comfortable`: es un control de cabecera, como los de `GPageHeader`); la lista sigue la región como cualquier `GMenu` (`density.md` §5.1). Una `density` que llegue por `attrs` no cambia el disparador.
- **`labels` (#1049):** `GPageIndex` **no tiene textos propios** en `labels`: pasa el objeto **entero y tal cual** a `GMenu`, y valen las reglas de `menu.md` (§«Textos» de los elementos-enlace y «Letras en listas de comandos» de `api.md`). Los ocho que importan aquí: los cuatro de buscar al escribir (#797; sin ellos, salto por letra) y las dos parejas `opened`/`openedLive` (Ctrl/⌘+clic y botón central dejan el menú abierto con huella: abrir la sección en otra pestaña) y `copied`/`copiedLive` (Ctrl/⌘+C copia el enlace absoluto a la sección, el gesto que más pide un índice de documentación). Sin una pareja, ese gesto cae al del navegador y **`GMenu` emite E6** (el aviso es suyo, con su prefijo; `GPageIndex` no añade otro). Recomendado: pasar las ocho. Las demás claves de `GMenu` (`external`, `newTab`, `destExternal`, `destNewTab`) no aplican: los enlaces son de la misma página.
- **Atributos:** `class`, `style` y `data-*` van a la raíz (`nav`).

### Modelo de `items`

```js
[{ id: 'uso', label: 'Ejemplos' }, { id: 'api', label: 'API' }, { id: 'teclado', label: 'Teclado y foco', href: '/combobox#teclado' }]
```

- **`id`:** el `id` del **elemento destino** en el documento (el encabezado de la sección o la sección). Es la clave de la lectura y del foco.
- **`href`:** por defecto `#` + `id`. Se admite otro solo si apunta a la misma página (p. ej. con `base`); Grana no lo comprueba.
- **Un solo nivel en v1.** `level` (subsecciones `h3` con sangría) queda **reservado** (#1038): en el relevo, una lista larga de dos niveles dentro de un menú no se recorre bien; el sitio pasa solo los `h2`.
- Cualquier otro campo se conserva (llega al evento).

## Forma `relay` (A · el relevo; la única de v1)

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

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `id` \| `null` | La sección actual cambia (lectura o elección) |
| `navigate` | `{ item, event }` | Se elige una sección (guarda de #505); cancelable |

## Métodos

| Método | Firma | Qué hace |
| --- | --- | --- |
| `refresh` | `refresh(): void` | Vuelve a leer la actual en el siguiente cuadro (contenido que crece sin desplazamiento: imágenes, `GFormReveal`, un acordeón). Con una elegida sostenida (#1048) no hace nada: la sostenida solo la suelta un desplazamiento |

Expuesto con `defineExpose`; consta en `meta.json` (`methods`).

## Teclado

El de `GMenu` (disparador Intro/Espacio/↓ abre en el primero, ↑ en el último; ↑ ↓ Inicio Fin; letras con buscar al escribir; Intro sigue el enlace; Espacio activa; Esc cierra y devuelve el foco al disparador; Tab cierra y sigue). Tras elegir, el foco va al destino (§«Elegir una sección», 3).

## Accesibilidad

- `aria-current="location"` en **un solo** elemento, y solo en la lista (el disparador no lo lleva: su texto ya lo dice).
- **Sin anuncios:** el cambio de sección es consecuencia del desplazamiento del propio usuario (4.1.3 no aplica); el nombre del disparador cambia en silencio. Nada de regiones vivas.
- 1.4.1: la actual se distingue en la lista por forma y peso además del color (coco; la marca de `current` de `GMenu`).
- 2.4.11: el disparador vive en el zócalo pegado; el foco que llega al destino queda bajo el zócalo gracias al `scroll-padding` de #713 (`api.md` «Piezas pegadas»).
- Contraste: `key` en `--g-color-text-muted` y `current` en `--g-color-text` ≥ 4,5:1 sobre el fondo del zócalo; borde del disparador como control ≥ 3:1.

## Movimiento (#1040; rúbrica `docs/documentacion/rubrica-movimiento.md`)

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

## Tokens

**Ninguno nuevo** (`tokens.md` §59). Consume los de `GBtn` `outline` `neutral` para el disparador (lo pinta `GPageIndex.css` con sus mismos tokens: `--g-color-border-control`, `--g-color-text`, `--g-color-text-muted`, `--g-radius-shape`, `--g-color-focus`, `--g-focus-width`, `--g-focus-offset`, `--g-border-width`), `--g-text-body-sm-*`, `--g-text-action-weight`, `--g-font-ui`, `--g-space-1`, `--g-duration-fast`, `--g-ease-out`. La lista es la de `GMenu`.

## Avisos de desarrollo (`[Grana GPageIndex]`, guarda canónica de #653, una vez por instancia y motivo)

1. Elemento de `items` sin `id` o sin `label`: se ignora. 2. `id` duplicado: gana el primero. 3. `scroller` no encontrado: se usa el documento. 4. `appearance` fuera de lista: `relay`. 5. Sin `label`. 6. El destino de un `id` no está en el documento al elegirlo (y, al montar con `track`, ningún `id` de `items` está en el documento).

## SSR

El primer render no lee `location`, `matchMedia` ni cajas (#1033): pinta `items` y `modelValue`. La lectura, el `hash` y el `scroller` se resuelven en `onMounted`. Prueba de hidratación (`GPageIndex.hydration.test.js`, como `GCombobox`).

## Paquete y peso (#1042)

- **Entrada propia `@grana/vue/page-index`** (global UMD `GranaPageIndex`), con plugin `app.use(PageIndex)`; `@grana/vue` no lo exporta. #550: el margen del principal está agotado. `GMenu` y `utils/menuNav.js` llegan por `__shared`, **sin copia** (compuerta).
- **Tope: 3 KiB (3 072 B) gzip** de `dist/page-index.js` (#1051, decisión del usuario del 2026-11-08; antes 2 560 B por #1042; medido 2 905 B en 336f3624). Si no cabe, vuelve a lima, y con más decide el usuario.
- Declarar en `exports`, `typesVersions`, `ENTRIES` de `scripts/build-types.mjs` y `src/types.test.js` (#442, #443).
- Compuertas para `gates.sh`: `test -f packages/vue/dist/page-index.js`, `! grep -q "GPageIndex" packages/vue/dist/grana.js`, `grep -q "g-page-index__stack" packages/vue/dist/grana.css`, y que `dist/page-index.js` no lleve una copia de `GMenu` (bruno elige la cadena propia de `GMenu.vue` que lo demuestra).

## `meta.json` y tipos (#443)

Props, eventos (`update:modelValue`, `navigate`), método `refresh`; `types/overrides.mjs`: `'GPageIndex.items': 'Array<{ id: string; label: string; href?: string; [key: string]: unknown }>'`, `'GPageIndex.scroller': 'string | Element | null'`. `status: "draft"` hasta la auditoría de coco.

## Reservado (con nombre, #1038)

- **`appearance="list"`** (columna clásica pegada, para ajustes y formularios largos; con **errores por sección** de `GForm`, `labels.sectionErrors`) y **`appearance="line"`** (línea de enlaces bajo el encabezado, concepto C) y **`appearance="rail"`** (estaciones numeradas, concepto B): cada una con su ronda corta de kiwi sobre este motor. La de formularios y ajustes es la siguiente que se pedirá (`GbSettingsLayout01` dejaría de componerlo a mano).
- **`level`** (dos niveles) y **abrir el menú en la actual**.
- **Pegado propio** (para `list` fuera de `GPageHeader`): exigirá las condiciones de `GSplit` S-L5 (alto máximo con desplazamiento propio y `tabindex="-1"`, #570).

## Verificación (criterio de hecho)

- **bruno (vitest + jsdom):** modelo y avisos 1 a 6; `labels` llega entero a `GMenu`; ids `{id}-trigger` y `{id}-list`; `aria-current="location"` en uno solo; `navigate` con la guarda de #505 (clic primario emite; modificadores, botón central y `target` no); cancelado no mueve el foco; sin cancelar el foco acaba en el destino (`tabindex="-1"` puesto si falta); ancho de la pila con todas las etiquetas; hidratación sin desajuste.
- **Playwright (puerto propio, tres motores):** la actual sigue a la línea de lectura (una sola, la correcta al llevar cada sección a la vista; la última al final del documento); elegir no recorre las intermedias; **la elegida se sostiene** tras el salto con una sección más corta que un tercio del visor y con la última del documento, y el primer desplazamiento posterior (rueda y teclas) reanuda la lectura (#1048); Δ0 del disparador al cambiar de sección; ráfaga sin transiciones; dentro de `GPageHeader` pegado y en el muelle (mismo nodo, foco); táctil ≥ 44; reducido = fundido; rendimiento con 200 secciones (tareas < 50 ms, `--workers=1`).
- **coco:** `GPageIndex.css`, contraste del disparador en claro y oscuro y en la zona de marca, rúbrica de movimiento, auditoría.
- **No verificado (entorno real):** lector de pantalla con `aria-current="location"` dentro de un `menu`, desplazamiento inercial en táctil real.
