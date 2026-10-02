# Contrato · GTabs

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/tabs/r02/` (kiwi; `r01` queda superada) · **Complementa:** `design/contracts/dialog.md` (slot `tabs`), `menu.md`, `badge.md`
**Tag:** `g-tabs` (y `g-tab-panel`, el panel suelto) · **Categoría:** navegación

Navegación **entre vistas del mismo nivel dentro de una misma vista**, con el patrón *Tabs* de APG. Un solo componente con dos ejes (`appearance` × `orientation`) sobre una sola lógica. Decisiones del usuario (delegadas, «decide tú») y propuestas de kiwi aprobadas por derivar de un estándar: DECISIONS.md #112 a #121.

---

## Principios

- **Un solo nivel.** No se anidan tabs ni se usan para árboles; la subnavegación dentro de una pestaña es otro patrón (`GSidebar`, enlaces, secciones, `GStepper`, `GFilterBar`). Un `GTabs` dentro del panel de otro `GTabs` es un error de uso: aviso en desarrollo.
- **Presenta y emite intención.** `modelValue` es la pestaña activa; el componente emite `change` (cancelable) y `update:modelValue`, y nunca cambia el prop por su cuenta.
- **No es navegación entre páginas.** Con un router el tab sigue siendo `role="tab"`; el router solo sincroniza el valor (ver Persistencia).
- **La activa nunca es solo color** (WCAG 1.4.1): marca de forma **y** peso tipográfico. **El foco no es lo activo:** anillo distinto de la marca.
- **Sin textos propios.** Grana es internacional: nombre del `tablist`, textos de los botones y de los anuncios los aporta la aplicación.
- **Un solo sistema adaptable**, por el ancho **del contenedor** (no del visor), sin versiones por dispositivo.
- **Se reutiliza, no se duplica:** `GBadge` (contador e insignia), `GMenu` («Más»), `GIcon` (iconos internos).

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `items` | Array | ver «Pestañas» | `[]` (función) | propia |
| `modelValue` | String \| Number | `id` de la pestaña activa | primera habilitada | compartida |
| `appearance` | String | `underline` `pill` `segmented` `contained` | `underline` | propia |
| `orientation` | String | `horizontal` `vertical` | `horizontal` | propia |
| `color` | String | `brand` `accent` `neutral` | `brand` | compartida (subconjunto) |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `align` | String | `start` `center` `distribute` `fill` | `start` | propia |
| `activation` | String | `auto` `manual` | `auto` | propia |
| `overflow` | String | `scroll` `arrows` `more` | `scroll` | propia |
| `labelMode` | String | `full` `icon` `auto` | `full` | propia |
| `snap` | Boolean | | `false` | propia |
| `lazy` | Boolean | | `false` | propia |
| `responsive` | String | `auto` `never` | `auto` | propia |
| `detached` | Boolean | | `false` | propia |
| `disabled` | Boolean | | `false` | compartida |
| `label` | String | nombre accesible del `tablist` | sin valor | propia |
| `labelledby` | String | `id` de un elemento que nombra el `tablist` | sin valor | propia |
| `labels` | Object | ver «Textos» | `{}` (función) | propia |
| `id` | String | | generado | propia |

### Pestañas (`items`)

```js
[
  { id: 'general', label: 'General', icon: 'house' },
  { id: 'msgs', label: 'Mensajes', count: 8, countLabel: '8 sin leer' },
  { id: 'news', label: 'Novedades', badge: 'Nuevo' },
  { id: 'errs', label: 'Errores', status: 'attention', statusLabel: 'requiere atención' },
  { id: 'rep', label: 'Informe', status: 'loading', statusLabel: 'cargando' },
  { id: 'perm', label: 'Permisos', disabled: true }
]
```

| Campo | Tipo | Uso |
| --- | --- | --- |
| `id` | String \| Number | **Obligatorio**, único. Sin `id`, la pestaña se ignora y avisa una vez en desarrollo (a diferencia de `GStepper`, aquí el `id` es la identidad estable que viaja a la URL y a los paneles) |
| `label` | String | **Obligatorio**; nombre accesible de la pestaña, también con solo iconos |
| `icon` | String (nombre de Lucide) \| cualquier valor | De la aplicación; decorativo. **Cadena y sin slot `icon`:** la pestaña dibuja `GIcon` con ese nombre (registro de la aplicación o lista de la librería; `icons.md` §5, `api.md` «Iconos en los componentes», #202). **Con slot `icon`, manda el slot.** Otro valor: dato opaco que solo recibe el slot |
| `count` | Number | Contador (`GBadge` modo `count`, `size="sm"`); 0 no se pinta (`showZero` de `GBadge`) |
| `countLabel` | String | Texto accesible del contador («8 sin leer»). **Obligatorio con `count`**; sin él, aviso en desarrollo |
| `badge` | String | Texto breve («Nuevo») en una `GBadge` de texto, `size="sm"` |
| `badgeLabel` | String | Opcional; si se da, se lee **en lugar** del texto visible (regla de `GBadge`) |
| `status` | String | `loading` `attention` |
| `statusLabel` | String | Texto oculto del estado. **Obligatorio con `status`**; sin él, aviso en desarrollo |
| `disabled` | Boolean | `aria-disabled="true"`, atenuada, omitida por las flechas y por `Home`/`End`, no se activa |

Campos **reservados y no publicados en v0.1** (`closable`, `closeLabel`) y el evento `close`: ver «Fuera de v0.1». Si llegan, se ignoran y avisan una vez en desarrollo. Campos desconocidos se ignoran.

### Reglas de props

- **`modelValue`:** `id` de la activa. Sin valor, la primera pestaña habilitada. Si no coincide con ninguna o apunta a una deshabilitada, **ninguna** está activa (ningún panel visible), la primera habilitada es la tabulable y, en desarrollo, `console.warn`. Sin `v-model`, solo es informativo: el componente nunca cambia el prop.
- **`appearance`:** solo cambia **cómo se dibuja** (nunca lógica ni DOM):
  - `underline`: marca en línea bajo (o al borde de inicio en vertical) de la activa; sin fondo ni bordes; línea base fina bajo toda la fila.
  - `pill`: la activa lleva una superficie redondeada; las demás, planas.
  - `segmented`: todas viven en una pista común y la activa es un segmento elevado; pensado para **2 a 6** opciones equivalentes. **No admite `vertical`** (cae a `horizontal` y avisa en desarrollo); con más de 6, aviso en desarrollo; si no caben, **degrada a scroll** sin botones ni cambio de apariencia.
  - `contained`: banda a sangre dentro de una superficie (panel, card, diálogo) con la activa **fundida** con el panel. **No admite `vertical`** (igual que `segmented`). No dibuja borde propio: vive dentro de la superficie anfitriona.
- **`orientation`:** `vertical` para configuración, paneles laterales y layouts con ancho. El eje `aria-orientation` sigue siempre al diseño **real** (cambia si `responsive` lo pasa a horizontal). En vertical el desbordamiento es **scroll vertical** limitado por el alto del consumidor (`overflow` no aplica).
- **`responsive`:** `auto` pasa `vertical` a `horizontal` cuando el ancho del **contenedor** (medido por bruno con `ResizeObserver`) es menor que `--g-space-1 × 120` (480px con `space` 4; derivado de `space`, como `GSidebar`, sin literales ni consultas de medios nuevas); `never` lo mantiene siempre vertical. Sin medición (SSR), se renderiza como se pidió.
- **`color`:** familia de la **marca de selección** y de la superficie de la activa en `pill`; la tipografía y el resto son neutros. `brand` lee `--g-color-primary*` (DECISIONS.md #95). `attention` usa siempre `warning` y `loading`, neutro, sea cual sea `color`.
- **`density`:** la prop compartida. **Equivalencia con el brief** (`compact` · `comfortable` · `spacious`): `compact` = `compact` (0.75×), `comfortable` = `comfortable` (0.875×), **`spacious` = `default` (1×)**: mismo orden, de menor a mayor. Multiplica altura, relleno horizontal, separación y **grosor de la marca** (tokens por densidad, `tokens.md` §18); no cambia la tipografía ni la lógica. Piso de 24px; con `pointer: coarse`, 44px reales **sin importar la densidad** (`tokens.md` §7).
- **`align`:** `start` (por defecto), `center`, `distribute` (huecos iguales) y `fill` (columnas iguales). Con desbordamiento, `center`, `distribute` y `fill` **degradan a `start`**: no sobra espacio. En vertical solo tiene efecto `fill`.
- **`activation`:** `auto` (APG, por defecto): enfocar con flechas activa. `manual`: enfocar no activa; Enter o Espacio sí. Usar `manual` cuando activar es costoso (carga de red por pestaña).
- **`overflow`** (solo horizontal; v0.1: tres estrategias):
  - `scroll` (por defecto): lista desplazable con degradado en el borde como indicio de que hay más (`is-scrollable-start|end`), sin botones.
  - `arrows`: lo anterior más botones anterior/siguiente en los bordes. **Solo puntero**: `aria-hidden`, `tabindex="-1"`; el teclado ya alcanza todas las pestañas.
  - `more`: las que no caben salen del `tablist` y pasan al menú «Más» (`GMenu`); la activa **siempre** entra en la barra y sale del menú.
  - La activa **siempre queda visible** (en `scroll` y `arrows` se desplaza a ella al activarla o enfocarla, sin mover la página). `combined` y `auto` se **difieren a una r03** (el validador los rechaza; ver «Fuera de v0.1»).
- **`labelMode`:** `full` (etiqueta visible), `icon` (todas solo con icono) y `auto` (si **todas** las pestañas tienen `icon` y no caben, las inactivas pasan a solo icono y la activa conserva icono y etiqueta, como la píldora activa de `GSidebar`, #68). En solo icono la etiqueta **no sale del DOM**: se oculta con el patrón de texto oculto estándar y es el nombre accesible. **Sin tooltip propio en v0.1** (#113). Con `icon` o `auto`, si a alguna pestaña le falta `icon`, aviso en desarrollo y esa conserva su etiqueta visible. **Una pestaña «tiene icono»** si hay slot `icon` y `item.icon` tiene valor, o si **no** hay slot e `item.icon` es una cadena (#202).
- **`snap`:** `scroll-snap-type: x proximity` en la lista (móvil nativo). No cambia nada más.
- **`lazy`:** por defecto los paneles están **montados y ocultos** (`hidden`), para no perder borradores ni estado (#78). Con `lazy`, un panel se monta la primera vez que se activa y **luego se conserva**. Sin `unmount` en v0.1.
- **`detached`:** no renderiza paneles (versión **headless**): solo la cabecera; los paneles se pintan con `GTabPanel` donde el consumidor quiera (ver «Paneles separados»). Los atributos `aria-controls` se calculan igual.
- **`disabled`:** todas las pestañas `aria-disabled`; `is-disabled` en la raíz.
- **`label` / `labelledby`:** nombre del `tablist` (`aria-label` / `aria-labelledby`). **Obligatorio uno de los dos**; sin ninguno, en desarrollo `console.warn` (como el título de `GDialog`).
- **`id`:** base de los ids: pestaña `ID-tab-{id}`, panel `ID-panel-{id}`. Con `detached`, el consumidor pasa el mismo `id` a `GTabPanel`.
- **Resto de atributos** (`class`, `style`, `data-*`, escuchas): van a la **raíz**.

### Textos (`labels`, sin valores por defecto)

| Clave | Uso | Si falta |
| --- | --- | --- |
| `more` | Nombre del botón «Más» (`overflow="more"`) | El botón no se renderiza y, en desarrollo, `console.warn` (las pestañas ocultas quedarían inalcanzables: se cae a `scroll`) |
| `menu` | Nombre del menú de «Más» (`label` de `GMenu`) | Se nombra por el botón |
| `loading` | Anuncio al empezar a cargar, plantilla con `{label}` («{label}: cargando») | No se anuncia el inicio; en desarrollo, `console.warn` una sola vez |
| `loaded` | Anuncio al terminar, con `{label}` | No se anuncia el fin |

Los textos de cada pestaña (`countLabel`, `badgeLabel`, `statusLabel`) viajan en `items`.

## Pestañas, contador, insignia y estados

Orden interno **fijo** de una pestaña: **icono** (slot `icon`, decorativo) · **etiqueta** · **estado** (`status`: icono + texto oculto) · **insignia** (`badge`) · **contador** (`count`). Más de una de las tres informaciones secundarias a la vez (estado, insignia, contador) genera aviso en desarrollo. Lo secundario es **más pequeño y pálido que la etiqueta** (jerarquía por tamaño, peso y contraste; nunca color fuerte).

| Estado | Representación | No solo color |
| --- | --- | --- |
| Predeterminado | `aria-selected="false"`, `tabindex="-1"` | |
| Hover | Solo con puntero real (`@media (hover: hover)`); nunca esencial | Cambio de fondo y color |
| Foco | Anillo sobre la pestaña enfocada, **independiente de la activa** | Anillo (forma) distinto de la marca; coco lo verifica con activa y foco en pestañas distintas |
| Activa | `aria-selected="true"`, `tabindex="0"`, marca de selección y peso 600; **ancho reservado en negrita** para que no desplace a las demás | Forma de la marca y peso |
| Deshabilitada | `aria-disabled="true"`, `tabindex="-1"` | Atenuada (exenta de contraste en WCAG 1.4.3) |
| `loading` | Icono `loader-circle` (gira) y texto oculto (`statusLabel`); la pestaña **sigue habilitada**; si es la visible, su panel lleva `aria-busy="true"` | Icono; con movimiento reducido no gira y el icono permanece |
| `attention` | Icono `circle-alert` y texto oculto | Icono, no punto de color |
| Con insignia / contador | `GBadge` (`variant="soft"`, `color="neutral"`, `size="sm"`) | Texto visible |
| Vacía (`items` vacío) | No se dibuja `tablist`; slot `empty`; aviso en desarrollo | |

El **nombre accesible** de cada pestaña es etiqueta + `statusLabel` + insignia + `countLabel`: los visuales son `aria-hidden` y el equivalente es texto oculto (modelo de `GBadge`). **Cambiar a otra pestaña mientras una carga está permitido**: `loading` no deshabilita.

## Estructura accesible

```html
<div class="g-tabs g-tabs--appearance-underline g-tabs--orientation-horizontal g-tabs--color-brand g-tabs--density-default g-tabs--align-start g-tabs--overflow-scroll is-ready" id="ID">
  <div class="g-tabs__header">
    <button class="g-tabs__edge g-tabs__edge--prev" type="button" tabindex="-1" aria-hidden="true">…</button>   <!-- solo overflow="arrows" -->
    <div class="g-tabs__scroller">
      <div class="g-tabs__list" role="tablist" aria-orientation="horizontal" aria-label="Perfil">
        <button class="g-tabs__tab is-active" role="tab" type="button" id="ID-tab-a" aria-selected="true" aria-controls="ID-panel-a" tabindex="0">
          <span class="g-tabs__icon" aria-hidden="true">…</span>                  <!-- con slot icon, o item.icon cadena (GIcon) -->
          <span class="g-tabs__label" data-text="Mensajes">Mensajes</span>   <!-- data-text = etiqueta: reserva el ancho en negrita -->
          <span class="g-tabs__status" aria-hidden="true">…</span><span class="g-tabs__sr">, cargando</span>   <!-- solo con status -->
          <span class="g-badge …">…</span>                                       <!-- GBadge: insignia o contador -->
        </button>
        …
      </div>
      <span class="g-tabs__mark" aria-hidden="true"></span>                       <!-- única marca; FUERA del tablist -->
    </div>
    <button class="g-tabs__edge g-tabs__edge--next" type="button" tabindex="-1" aria-hidden="true">…</button>
    <!-- solo overflow="more": GMenu con su disparador (aria-haspopup="menu", aria-expanded, aria-controls) FUERA del tablist -->
    <button class="g-tabs__more" type="button" aria-label="Más pestañas">…</button>
  </div>
  <div class="g-tabs__panels">                                                    <!-- ausente con detached -->
    <div class="g-tabs__panel" role="tabpanel" id="ID-panel-a" aria-labelledby="ID-tab-a" tabindex="0">…</div>
    <div class="g-tabs__panel" role="tabpanel" id="ID-panel-b" aria-labelledby="ID-tab-b" hidden>…</div>
  </div>
  <div class="g-tabs__live" role="status"></div>                                  <!-- oculta visualmente; existe antes del cambio -->
</div>
```

- `tablist` contiene **solo `tab`**. La marca, los botones de borde y «Más» están **fuera**.
- En `overflow="more"` las pestañas que no caben **no están en el DOM del `tablist`** (están en el menú): `aria-setsize` (total) y `aria-posinset` en todas las renderizadas mientras haya alguna oculta.
- Panel: `tabindex="0"` solo si no contiene elementos enfocables (lo decide bruno al activar); con enfocables, sin `tabindex`. `aria-busy="true"` si su pestaña está en `loading`.
- Con `lazy`, un panel aún no montado **no se renderiza** y su pestaña **no lleva `aria-controls`** (sin referencias colgantes).
- La región `role="status"` existe desde el montaje y anuncia el inicio y el fin de carga (`labels.loading|loaded`).
- Los iconos de estado y de borde son `GIcon` (decorativos).

### Menú «Más» (`GMenu`)

Se reutiliza `GMenu` con su slot `trigger` (el botón es de `GTabs`, fuera del `tablist`). `items` del menú: **todas** las pestañas como `{ type: 'radio', id, label, checked, disabled }` (`menuitemradio`; la activa `checked`); `closeOnSelect="always"`. El disparador lleva el nombre `labels.more`; si alguna oculta es `loading` o `attention`, el botón lo señala con la misma marca de icono (forma y texto oculto, no solo color). Al elegir: se emite `change` con `source: 'menu'`; si el consumidor no lo impide, se activa, **entra en la barra**, se hace visible y **recibe el foco** (por encima de la devolución de foco habitual de `GMenu`). Esc y Tab, como en `GMenu`. La lista vive en la capa superior (`popover`, #55) y no la recorta el `overflow` de un diálogo.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `id` de la pestaña elegida | El usuario activa una pestaña y nadie impidió `change` |
| `change` | `{ id, index, source, preventDefault() }` | El usuario activa una pestaña. `source`: `keyboard` `pointer` `menu`. **Cancelable:** `preventDefault()` síncrono evita `update:modelValue`, **y el valor, la marca y el foco no se mueven** (p. ej. «cambios sin guardar»; precedente `GStepper.select`, #97) |

- Un cambio de `modelValue` desde fuera **no** emite `change` (ni mueve el foco), pero sí desplaza la lista para mostrar la activa y recoloca la marca.
- Con `activation="manual"`, `change` se emite al Enter o Espacio, no al enfocar.
- Ambos eventos se declaran en `emits` (si no, `change` llegaría también al nativo por `$attrs`).

## Slots

| Slot | Propósito | Alcance | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `panel-{id}` | Contenido del panel de esa pestaña | `{ item, active }` | Dentro de `g-tabs__panel` (que pone el componente) |
| `panel` | Contenido genérico de panel (si no hay `panel-{id}`) | `{ item, active }` | Ídem |
| `icon` | Icono de la pestaña (valor `item.icon`); **sustituye** al `GIcon` por nombre | `{ item, index, active }` | Dentro de `g-tabs__icon`; decorativo |
| `label` | Etiqueta con contenido rico | `{ item, index, active }` | Dentro de `g-tabs__label`; **sin interactivos**; no cambia el nombre accesible (que sale de `item.label`) |
| `empty` | Vacío (sin pestañas) | | Se renderiza en lugar de la cabecera |

Con `detached` no hay slots `panel*`: los paneles son `GTabPanel`.

## Paneles separados (`GTabPanel`) y `GDialog`

**Decisión (#118):** v0.1 publica **`GTabs`** con paneles integrados (caso general) **y** un segundo componente mínimo **`GTabPanel`** más la prop `detached`, en lugar de provide/inject o de dos componentes obligatorios. Razón: el caso real (cabecera fija en un diálogo, cabecera en un `sidebar` y paneles en otra zona) obliga a que cabecera y paneles vivan en **ramas distintas del árbol**, donde provide/inject no llega; el enlace por `id` y el estado explícito funcionan en cualquier sitio, son SSR-seguros y no esconden magia.

`GTabPanel`:

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `tabs` | String | `id` del `GTabs` al que pertenece | **obligatorio** | propia |
| `value` | String \| Number | `id` de la pestaña que lo gobierna | **obligatorio** | propia |
| `active` | Boolean | si es el panel visible (el consumidor lo calcula con el mismo `v-model`) | `false` | propia |
| `lazy` | Boolean | monta al primer activarse y luego conserva | `false` | propia |
| `busy` | Boolean | `aria-busy` (el consumidor lo liga al `status` de la pestaña) | `false` | propia |

Renderiza el mismo `<div class="g-tabs__panel" role="tabpanel" id="TABS-panel-VALUE" aria-labelledby="TABS-tab-VALUE">` con `hidden` si no está activo. Los avisos de desarrollo: sin `tabs` o `value`; un `id` de `GTabs` que no existe al montar. Los atributos van a ese `div`. Sin `GTabPanel` correspondiente, `aria-controls` queda colgante: es responsabilidad del consumidor en modo `detached`.

**Cambio aparte, de contrato de `GDialog` (hallazgo 8 de kiwi; #119):** la cabecera de pestañas debe quedar **fija** y solo el cuerpo desplazarse. Se decide **un slot `tabs` en `GDialog`** (no una región desplazable dentro de `GTabs`), porque el desplazamiento y el relleno son de la carcasa y no deben filtrarse a un componente genérico. Texto del cambio (añadido a `dialog.md`): slot `tabs`, **a sangre** y **fijo**, entre el encabezado y el cuerpo, que **no se desplaza**; la carcasa define `--g-tabs-inset` (su relleno inline) en `g-dialog__tabs` para que el texto de la primera pestaña alinee con el del título y la línea base llegue de borde a borde. Con el slot, el cuerpo no se anuncia como región propia (`role="region"` y `tabindex` pasan a los `tabpanel`). **Quién:** lima (contrato, hecho), bruno (`GDialog.vue`, prueba), coco (`GDialog.css`, auditoría). Mientras tanto, `GTabs` dentro del cuerpo funciona pero la cabecera se desplaza.

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab | Entra en la pestaña activa (la única con `tabindex="0"`) y de ahí sale al panel (o a su primer control); no recorre las demás |
| Shift+Tab | Sale antes del `tablist` |
| → / ← (horizontal) | Siguiente / anterior pestaña habilitada, con vuelta; **invertidas en RTL**. Con `activation="auto"` además activa |
| ↓ / ↑ (vertical) | Ídem en vertical. Las flechas del **eje contrario no se interceptan** |
| Home / End | Primera / última pestaña habilitada (y renderizada) |
| Enter / Espacio | Activa la pestaña enfocada (necesario con `activation="manual"`; inocuo en auto) |
| «Más» | Enter, Espacio o ↓ abren con el foco en la marcada; ↑ en la última; ↑/↓/Inicio/Fin dentro; Esc cierra y devuelve el foco al botón; Tab cierra (como `GMenu`) |

- **Las deshabilitadas se omiten** al navegar con flechas y `Home`/`End`.
- Enfocar o activar una pestaña la **desplaza a la vista** (sin mover la página).
- Los botones de borde no entran en el teclado.
- Esc **no se intercepta** en el `tablist` (un `GDialog` anfitrión se cierra con Esc).

## Adaptación y táctil

- Medición por **contenedor** con `ResizeObserver` en la raíz; sin consultas de medios con valores fijos (#69, #98). Los umbrales derivan de `space` y de lo medido, no de números fijos; no requieren excepción nueva en `tokens.md` §7.
- **Orden de degradación:** (1) todo visible; (2) `labelMode="auto"` reduce las inactivas a icono; (3) estrategia de `overflow`. `segmented` degrada a scroll.
- Táctil: ≥ 44px con `pointer: coarse` y ≥ 24px siempre. **Momentum** nativo, `overscroll-behavior-inline: contain` (deslizar la lista no dispara «atrás» ni arrastra el contenido), `snap` opcional. Sin hover para nada esencial.
- **Sin swipe entre paneles** en v0.1 (#117): choca con contenido desplazable en horizontal (tablas, carruseles) y exigiría una alternativa (WCAG 2.5.1); la lista deslizable cubre el caso.
- **Marca:** una sola, `aria-hidden`, fuera del `tablist`, que se desliza entre pestañas; bruno la posiciona con variables CSS dinámicas `--_mark-x`, `--_mark-y`, `--_mark-w` y `--_mark-h` (excepción justificada a «sin estilos en línea», como `GMenu`) y las recoloca con `ResizeObserver` y al cargar las fuentes. **No se anima el primer posicionamiento** (clase `is-ready` tras el primero) ni el cambio de apariencia o densidad.
- **Convención de la marca:** `--_mark-x`, `--_mark-y`, `--_mark-w` y `--_mark-h` en **px**, medidos contra la **caja de relleno de `g-tabs__scroller`** e incluyendo su desplazamiento; en RTL, `x` se mide desde el borde **derecho**; sin pestaña activa, `w` y `h` valen `0px`.
- **Rueda:** con `overflow="scroll"`, la rueda vertical del ratón sobre la lista se convierte en desplazamiento horizontal.
- **`GIcon`** es **hijo directo** de `g-tabs__icon`, `g-tabs__status` y `g-tabs__edge`. `g-tabs__label` lleva `data-text` con la etiqueta (reserva de negrita).
- **Movimiento:** solo `transform`, tamaño y opacidad; transiciones, no *keyframes* (#71), con los tokens existentes (`--g-duration-press`, `--g-ease-standard`; la entrada del contenido, `--g-duration-press` y `--g-ease-out`): **sin tokens de duración nuevos**. Con `prefers-reduced-motion: reduce`: la marca salta, sin entrada de contenido, sin giro del icono y desplazamiento programático instantáneo.

## Persistencia

`GTabs` solo expone `v-model` y el evento; **no conoce rutas ni la URL** (#117). La sincronización es externa y opcional:

- **Hash o *query*:** el consumidor lee `#pestaña=id` al montar, escribe con `history.pushState` en `update:modelValue` y escucha `popstate`/`hashchange`; ignora ids desconocidos o deshabilitados (recargar, «atrás» y compartir restauran la pestaña).
- **Router:** `modelValue` ligado a un parámetro o a la ruta, `update:modelValue` hace `router.push`; `change` con `preventDefault()` sirve para guardias de navegación.
- `localStorage` queda fuera: es decisión de la aplicación. A lo sumo, un *composable* opcional de bruno; no es parte del contrato.

## Tokens consumidos

Existentes: `--g-color-primary[-strong|-soft|-text]`, `--g-color-on-primary[-soft]` (vía `color="brand"`), `--g-color-{accent|neutral|warning}[-soft|-text]`, `--g-color-surface`, `--g-color-surface-sunken`, `--g-surface-{shell|inset}`, `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle`, `--g-color-border`, `--g-color-border-strong`, `--g-color-border-control`, `--g-color-focus`, `--g-radius-{xs|sm|md|pill}`, `--g-radius-shape`, `--g-space-1..8`, `--g-font-ui`, `--g-text-{caption|body-sm|body}-{size|line|weight}`, `--g-text-action-weight`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset`, `--g-duration-{fast|press|spin}`, `--g-ease-{standard|out}`, `--g-shadow-1`. De `GBadge` y `GMenu` se heredan los suyos.

**Tokens nuevos** (nombrados y registrados en `docs/contract/tokens.md` §18; los **valores** los fija coco en `defaults.css`):

| Token | Para qué |
| --- | --- |
| `--g-tabs-track` | Fondo de la **pista** de `segmented`: un paso de tono **relativo a la superficie anfitriona** (más oscuro sobre superficie clara, más claro sobre oscura), como la `inset` de `GSurface` (#99) |
| `--g-tabs-thumb` | Fondo del **segmento seleccionado** de `segmented`: se distingue de la pista y del anfitrión (con borde ≥ 3:1 si hace falta, #89) |
| `--g-tabs-band` | Fondo de la **banda** de pestañas de `contained` |
| `--g-tabs-panel` | Tono de la pestaña activa **fundida** con el panel y del panel contiguo en `contained` (debe coincidir con la superficie anfitriona) |
| `--g-tabs-mark-{default\|comfortable\|compact}` | **Grosor de la marca** de `underline` y de la línea vertical, por densidad |
| `--g-tabs-inset` | Sangrado inline de la cabecera dentro de su anfitrión. **Vive en `GTabs.css` con valor `0px`** (excepción documentada a `levels.test.js`); la anfitriona (`GDialog`, panel) lo sobrescribe con un selector más cercano para alinear con su contenido |

Tamaño de contador e insignia: los de `GBadge` `sm`, sin token. Duración y curva de la marca: los existentes.

Derivaciones propuestas para coco (no son tokens): alto de pestaña = `space × 10` (`default`, antes de `density`); relleno inline = `space × 3`; separación = `space × 1`; degradado de borde = `space × 6`.

## Clases (contrato entre bruno y coco)

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-tabs` | Raíz | Siempre |
| `g-tabs--appearance-{underline\|pill\|segmented\|contained}` | Raíz | Siempre |
| `g-tabs--orientation-{horizontal\|vertical}` | Raíz | Siempre (la **efectiva**, tras `responsive`, `segmented` y `contained`) |
| `g-tabs--color-*`, `--density-*`, `--align-*`, `--overflow-*` | Raíz | Siempre (`--align-*` y `--overflow-*` ya degradados) |
| `g-tabs--icon-only` | Raíz | Con `labelMode="icon"` o `auto` reducido |
| `g-tabs--snap` | Raíz | Con `snap` |
| `is-ready` | Raíz | Tras el primer posicionamiento de la marca |
| `is-disabled` | Raíz | Con `disabled` |
| `is-scrollable-start`, `is-scrollable-end` | Raíz | Hay lista fuera de vista por cada extremo (indicio de scroll) |
| `g-tabs__header`, `__scroller`, `__list`, `__mark`, `__edge`, `__edge--prev`, `__edge--next`, `__more`, `__panels`, `__panel`, `__live` | Partes | Según prop |
| `g-tabs__tab` | `tab` | Por pestaña |
| `is-active`, `is-disabled`, `is-loading`, `is-attention`, `is-icon-only` | `tab` | Estado (`is-active` y `is-disabled` exclusivos de la activa y deshabilitada, no se combinan) |
| `g-tabs__icon`, `__label`, `__status`, `__sr` | Partes de la pestaña | Según el contenido |

Una `GBadge` interna lleva sus propias clases (`g-badge…`); el `g-tabs__badge` no existe.

## Resolución de hallazgos de kiwi (r02, §15)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | Entrega | `items` + `v-model` (`id`); slots `panel-{id}`, `panel`, `icon`, `label`, `empty`; `GTabPanel` para modo `detached`. `count`/`badge`/`status` en cada item con su texto accesible obligatorio | Patrón de datos de `GSidebar`, `GStepper` y `GMenu`; el `id` sobrevive a reordenar |
| 2 | Ejes | `appearance` × `orientation` (+ `density`, `color`, `align`, `activation`, `overflow`, `labelMode`, `snap`, `lazy`, `responsive`, `detached`); `appearance` y no `variant`; `segmented` y `contained` sin vertical; `keepMounted` se sustituye por el defecto «montadas y ocultas» y `lazy` | `api.md`: `variant` no describe tabs (como `GTable`, `GStepper`); #78 |
| 3 | `density` | La prop compartida; `spacious` = `default` (#114) | Coherencia del sistema; decisión delegada |
| 4 | Eventos | `update:modelValue` y `change` `{ id, index, source, preventDefault() }` cancelable. **`close` fuera de v0.1** | Precedente `GStepper.select` (#97); #116 |
| 5 | Textos | `label`/`labelledby` para el `tablist` (aviso en desarrollo); `labels` `more`, `menu`, `loading`, `loaded`; textos por pestaña en `items`; sin valores por defecto | Grana internacional (#97) |
| 6 | Cerrar | **Diferido** (#116): sin botón hermano en v0.1; nombres reservados `closable`, `closeLabel`, `close` y `Supr`; el riesgo `aria-required-children` se valida con lector real antes | Decisión delegada; riesgo de accesibilidad |
| 7 | Tokens | Nuevos solo los necesarios: `--g-tabs-{track\|thumb\|band\|panel\|mark-*\|inset}` (§18); duración/curva y tamaños de insignia, existentes | `tokens.md` §17.6 (un token de componente solo con caso real) |
| 8 | Dialog | Slot **`tabs` en `GDialog`**, fijo y a sangre, con `--g-tabs-inset` (#119); cambio aparte para bruno y coco | Desplazamiento y relleno son de la carcasa |
| 9 | Paneles separados | `GTabPanel` + `detached` en v0.1 (#118) | Cabecera y paneles en ramas distintas del árbol |
| 10 | Menú «Más» | `GMenu` con `trigger` slot, ítems `radio`, `closeOnSelect="always"`, foco a la pestaña elegida | #82 a #84; #55 |
| 11 | Contador/insignia | Se compone `GBadge` (`count` o texto, `sm`, `soft`, `neutral`) | Una sola implementación; #59 |
| 12 | Iconos | `GIcon` interno: `loader-circle`, `circle-alert`, `chevron-left`, `chevron-right`, `chevron-down`; añadidos a `icons.md` §4. Los de las pestañas, de la aplicación | #85 a #87; `icons.md` §5 |
| 13 | Persistencia | Solo `v-model`; URL y router externos (sección Persistencia) | #117 |
| 14 | `responsive` | `auto`/`never`; umbral `space × 120` por contenedor | #69, #98 |
| 15 | Contraste y no solo color | Marca ≥ 3:1 (#89), `forced-colors` y `prefers-contrast` los verifica coco; activa = forma + peso | #89 |

## Verificación (qué y cómo)

- **bruno** (pruebas): roles y enlaces `tablist`/`tab`/`tabpanel` en los dos sentidos y con `detached`; tabindex itinerante (una sola con 0, también sin activa válida); teclado horizontal y vertical, RTL, omisión de deshabilitadas, `Home`/`End`, vuelta, eje contrario sin interceptar; `activation` auto y manual; `change` cancelable (valor y foco intactos); `modelValue` externo desplaza sin foco ni evento; paneles montados/ocultos, `lazy`; `aria-busy` y anuncios; `aria-setsize`/`posinset` con ocultas; `overflow` (activa siempre visible en las tres), «Más» con foco devuelto a la pestaña; `segmented` con 7 degrada y avisa; vertical con `segmented` avisa; anidar `GTabs` avisa; avisos de desarrollo (`typeof process !== 'undefined'…`): sin `label`, ítem sin `id`, `count` sin `countLabel`, `status` sin `statusLabel`, `labelMode` sin `icon`, `labels.more` ausente, más de una información secundaria, `closable` reservado, `modelValue` desconocido.
- **coco** (auditoría con tema distinto al de defecto): marca visible a 3:1, activa y foco distintos, `segmented` y `contained` sobre plano/surface/inset/dialog, claro y oscuro, `forced-colors`, `prefers-contrast`, movimiento reducido, táctil 44px, densidades con piso 24px.
- **No verificado por kiwi y pendiente:** lector de pantalla real (VoiceOver, NVDA, TalkBack: anuncio de estado y contador, «Más»), axe, Firefox y WebKit (Playwright cubre lo automatizable, #108), táctil real y snap con dedo, zoom 200%, rendimiento con decenas de pestañas, redimensionar con «Más» abierto.

## Fuera de v0.1 (diferido, no abierto al usuario)

- **Cerrables** (`closable`, `closeLabel`, evento `close`, `Supr`): se reservan los nombres; requieren validar con lector de pantalla la estructura con botón hermano en un contenedor `role="presentation"` y `aria-required-children`. Si falla: alternativa sin botón visible (Supr y control equivalente en el panel o el menú).
- **`overflow="combined"` y `"auto"`:** en una **r03** de kiwi (qué hace `auto` con puntero táctil o fino).
- **Tooltip** para solo iconos: queda como pendiente hasta que exista un componente de tooltip; `title` no se usa como único mecanismo (#113).
- **Swipe entre paneles** y `unmount` de paneles inactivos.
- **`GWidgetConfig`** y otros con pestañas propias pueden migrar a `GTabs` más adelante.
- **Preguntas de producto abiertas: ninguna.**
