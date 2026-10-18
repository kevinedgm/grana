# Contrato · GFab (botón flotante con acciones)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #654 a #666, 2026-10-18; **respuestas a las 9 preguntas de coco** de `design/lab/fab/estilo.md` en #668 a #671, mismo día: velo cerrado en cuatro piezas, `data-ack` en el elemento, política con alturas medidas y anotaciones; cambios en archivos compartidos aplicados en `api.md` «Convivencia de servicios», «Entradas propias que no son servicios», «Paquete, entradas y tipos», «Acciones con acuse», «Una activación por gesto», «Letras en listas de comandos», «Flotantes persistentes y el foco» y el mapa de huecos; `tokens.md` §29.5, §29.6 y §47; `status.md` «`utils/edgeReserve.js` generalizado»; **tras la construcción de bruno** (5bdb4c1, 18c6932): peso de la entrada en #676, datos del `.vue` al CSS en #677 —preguntas 10 de coco y notas de bruno— y conciliación con #672 a #674 en #678 —pregunta 11 de coco—) · **Basado en:** `design/lab/fab/r01/` (kiwi, commit 7c0b032: `brief.md`, `declaracion.md` con 27 decisiones de base, fronteras, conceptos A/B/C, hallazgos L1 a L16 y propuesta de API; `index.html`, `fab.js`, `fab.css`, `frontera.html` con `GBtn`, `GMenu` y `GDialog` reales; `verificar.mjs` 553/553 en Chromium, Firefox y WebKit, puerto 4213)
**Tag:** `g-fab` · **Categoría:** superposiciones · **Paquete:** entrada propia **`@grana/vue/fab`** (global UMD `GranaFab`; #656)

**Componente complejo** (teclado compuesto de menú; se posiciona sobre otros elementos; compone `GBtn` y `GTooltip` y comparte el motor de `GMenu`; convive con `edgeReserve`): **coco y bruno en Opus** (regla de `CLAUDE.md`).

Un botón flotante en un borde del visor (o de un contenedor) para **crear o capturar desde cualquier sitio**. Contraído es un círculo con icono; abierto despliega sus acciones con icono y etiqueta siempre visibles. Es un **botón de menú** (APG *Menu Button* + *Menu*) con el motor de `GMenu` y lo que solo tiene algo flotante: sitio en el borde con área segura, convivencia con los otros elementos del borde, «se aparta» del foco, confirmación en el sitio, acuse en el propio botón y una sola activación por gesto.

**Forma (decisión del usuario del 2026-10-18, #654): A · «La pila que crece» por defecto y C · «Acción con cola» como opción.**
- **A · La pila que crece** (por defecto, `appearance="auto"`): salen del FAB **las que caben** (hasta 5) como píldoras con icono y etiqueta, la más usada pegada al botón. Si sobran, la más lejana es **«Más acciones (N)»**, que abre el resto **agrupado** en un panel. Cambiar de 6 a 10 o 15 acciones **no mueve** ninguna de las cuatro primeras.
- **C · Acción con cola** (opción, prop **`main`**): el FAB **es** la acción principal, con icono **y etiqueta visible**, a un toque; pegada lleva una **cola** («Más acciones») en un `role="group"`. La cola abre un **panel que nace de ella** con grupos y descripciones, y en ese panel **escribir filtra sin campo** (§«C · Buscar al escribir»).
- **B · «Arco con gesto»** queda **reservado** con su nombre (`appearance="arc"`), prototipado y medido en la r01 (§«Fuera de v1»).

---

## Principios

1. **Comandos, no controles.** Solo acciones. Si una acción necesita un campo o un selector, no es un FAB: es `GDialog` o `GHelper`.
2. **Semántica `menu` en todas las formas** (pila y panel): la forma cambia con el espacio y la semántica no (WCAG 3.2.4), y el motor ya está verificado en `GMenu`.
3. **El orden nace del botón.** El arreglo `items` es el orden de frecuencia; la primera es la más cercana al FAB, también en el foco y en el DOM (#660).
4. **Nada se recorta en silencio.** Con más de 15, con ids repetidos o con datos que faltan se pinta todo lo que se puede pintar y se avisa en desarrollo; nunca se lanza (#665).
5. **Nunca tapa lo que usas** (WCAG 2.4.11): se aparta del foco y del teclado en pantalla y deja 24px operables (#664).
6. **Una activación por gesto:** un doble clic o una tecla mantenida no ejecutan dos veces ni cierran lo que acaban de abrir (#661).
7. **Presenta y emite intención** (como `GMenu`): emite `select`; el acuse lo da la aplicación con el ticket (#663). Sin `fetch`, sin globals de la aplicación.
8. **Sin textos por defecto** (#226): todo texto lo pone la aplicación en `label`, en los elementos o en `labels`.

## Cuándo usarlo (fronteras)

| Necesito | Uso | No |
| --- | --- | --- |
| Crear o capturar desde cualquier pantalla («Nueva muestra», «Tomar foto», «Dictar nota») | **`GFab`** | — |
| Acciones de **la página** (editar, exportar esta vista) | `GPageHeader` (zócalo; en estrecho, su muelle, #630) | El FAB. No poner la misma acción en los dos |
| Acciones **sobre una selección** | La barra de selección de `GTable`, junto a lo elegido | El FAB |
| Un menú anclado a un botón cualquiera, casillas, opciones, submenús, enlaces | `GMenu` | El FAB (no tiene casillas, opciones, enlaces ni submenús propios) |
| Una acción que pide datos | `GDialog` (o `GHelper` para una nota) abierto desde `select` | Un campo dentro del FAB |
| Dictar | Una acción que llama a `speech.start()` (aplicación); la pill de la voz y el FAB conviven por `EDGE_ORDER` | Alojar la voz dentro del FAB |

**Respuesta honesta a «¿no es un `GMenu` con otro disparador?»:** el panel de C sí es, por dentro, el mismo menú; por eso comparten motor (`utils/menuNav.js`, #657). Lo que `GMenu` no tiene y un FAB necesita es el 60 % de lo pedido: sitio fijo en el borde con área segura, registro de bordes, se aparta, velo táctil con hueco, orden desde el botón, pila con cola, confirmación en el sitio, acuse con ticket, `description` y `group` planos y una activación por gesto. Sin `GFab`, cada aplicación lo rehace.

## Uso

```html
<!-- A · La pila que crece (por defecto) -->
<GFab
  label="Crear y capturar"
  :items="[
    { id: 'sample', label: 'Nueva muestra', icon: 'flask-conical' },
    { id: 'photo',  label: 'Tomar foto',    icon: 'camera' },
    { id: 'note',   label: 'Dictar nota',   icon: 'mic' },
    { id: 'csv',    label: 'Exportar CSV',  icon: 'file-down', group: 'Exportar', description: 'Lo filtrado, en UTF-8' },
    { id: 'purge',  label: 'Vaciar borradores', icon: 'trash-2', group: 'Mantenimiento', danger: true,
      confirm: '¿Vaciar los 12 borradores?', confirmLabel: 'Vaciar' },
  ]"
  :labels="{ more: 'Más acciones ({count})', cancel: 'Cancelar' }"
  @select="onSelect"
/>

<!-- C · Acción con cola -->
<GFab label="Crear y capturar" main="sample" :items="items"
  :labels="{ moreShort: 'Más acciones', cancel: 'Cancelar', findHint: 'Escribe para buscar',
             matches: '{count} acciones', matchesOne: '1 acción', none: 'Ninguna acción con' }"
  @select="onSelect" />
```

```js
function onSelect({ id, waitUntil }) {
  if (id === 'csv') waitUntil(exportCsv().then(() => 'CSV exportado'))   // acuse en el FAB (#663)
}
```

Los iconos de las acciones son nombres de Lucide de la aplicación (registro de `createIcons` → lista de la librería, `icons.md` §5.4).

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `items` | Array | ver «Elementos» | `() => []` | propia |
| `modelValue` | Boolean | abierto (con `update:modelValue`) | `undefined` (sin `v-model`: estado propio) | compartida |
| `label` | String | nombre del FAB (A) o del grupo principal + cola (C) | sin valor | propia |
| `main` | String \| Number | `id` de un elemento | sin valor | propia (C) |
| `appearance` | String | `auto` · `panel` (· `arc` reservado) | `auto` | compartida (`appearance`, como `GTable`/`GTabs`) |
| `position` | String | `bottom-end` `bottom-start` `bottom-center` `top-end` `top-start` `top-center` | `bottom-end` | compartida (lógica, como `GToaster` y `GSpeechHost`) |
| `anchor` | String | `viewport` · `container` | `viewport` | propia |
| `offset` | Object | `{ top?, bottom? }` (longitudes CSS) | `() => ({})` | compartida (como `GToaster`) |
| `closeOnSelect` | String | `auto` · `never` | `auto` | compartida (de `GMenu`; sin `always`: todo es acción) |
| `labels` | Object | ver «Textos» | `() => ({})` | compartida (sin valores por defecto, #226) |
| `id` | String | | generado (SSR-seguro) | propia |

### Reglas de props

- **`items`:** el **orden del arreglo es el orden de frecuencia** (no hay `order` ni `maxActions`). Ver «Elementos» y «Errores de configuración».
- **`modelValue`:** con valor (`true`/`false`), el FAB es **controlado** como `GMenu`: no cambia el prop por su cuenta y emite `update:modelValue`. **Sin valor** (`undefined`, sin `v-model`), guarda su estado y emite igual `update:modelValue`, `open` y `closed`. Abrir por el prop pone el foco en la primera por frecuencia (como `GMenu`). Con una sola acción, sin acciones o con todo inerte (modal encima), `true` no abre nada y avisa (aviso 12).
- **`label`:** **obligatorio** salvo con una sola acción (el FAB se nombra como ella). En A es el nombre constante del FAB («Crear y capturar»); el icono que cambia a «x» al abrir es solo visual (como los conmutadores de #645) y el estado lo da `aria-expanded`. En C es el nombre del `role="group"` que une la principal y la cola. Sin `label` con más de una acción: se pinta igual y avisa (aviso 2).
- **`main`:** activa **C**. Debe ser el `id` de un elemento habilitable, no `danger` y que no esté repetido (con `id` repetido, el primero). La principal sale de la lista y el resto va en el panel de la cola. Con `main`, **`appearance` no cuenta** (C siempre abre su panel). Un `main` que no existe o que es `danger` se ignora (forma A) y avisa (avisos 8 y 9); sin `labels.moreShort`, también se ignora (aviso 11).
- **`appearance`:** `auto` = política de A (§«A · Política `auto`»); `panel` = siempre panel, sin pila (cuando las descripciones importan más que la memoria del sitio). `arc` es nombre reservado (B): hoy avisa (aviso 10) y se comporta como `auto`. No hay `vertical`, `radial` ni `direction`: la dirección se deriva de `position` (abajo → la lista sube) y nunca salen más de las que caben.
- **`position`:** lógica (`start`/`end` siguen a `dir`). `*-center` centra el FAB en su borde.
- **`anchor`:** `viewport` (fijo al visor, por defecto) o `container`: absoluto dentro del **antecesor posicionado** más cercano (un mapa, un panel). La aplicación pone `position: relative` (u otro valor distinto de `static`) en ese contenedor. Con `container` el FAB **no publica ni lee reservas de borde** (no ocupa el borde del visor) y sigue las reglas de paneles anclados (§«Posición»).
- **`offset`:** se suma al margen seguro de su borde (`top` o `bottom`), como `GToaster`. Para una cabecera fija de la aplicación, su alto en `offset.top` (receta de `api.md` «Cabecera fija de la aplicación»).
- **`closeOnSelect`:** `auto` (por defecto) cierra al elegir; `never` no cierra (varias acciones seguidas). `event.preventDefault()` en el `select` mantiene abierto **esa vez** (como `GMenu`, #573).
- **Resto de atributos:** `class`, `style` y `data-*` van a la **raíz** (`div.g-fab`).
- **No hay** `color` (el FAB es la acción principal de la pantalla: `brand`, `tokens.md` §2), `size`, `density`, `variant`, `rounded`, `disabled` (se deshabilitan las acciones, no el lanzador), `showLabels` (las etiquetas siempre se ven), `groupByCategory` (agrupa el panel si hay `group`), `direction`, `onOpen`/`onClose` (son eventos) ni `accessibleLabel` (es `label`).

## Elementos (`items`)

```js
{
  id: 'csv',                    // String | Number, obligatorio, único
  label: 'Exportar CSV',        // String, obligatorio: el nombre accesible
  icon: 'file-down',            // String (nombre de Lucide; «dato → nombre», #202) · opcional
  description: 'Lo filtrado…',  // String · opcional: segunda línea (panel) y descripción accesible
  group: 'Exportar',            // String · opcional: título del grupo en el panel
  disabled: 'Sin conexión',     // Boolean | String (motivo visible) · opcional
  danger: true,                 // Boolean · opcional
  confirm: '¿Vaciar…?',         // String | false · solo con danger
  confirmLabel: 'Vaciar',       // String · solo con danger y confirm
}
```

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | String \| Number | **Obligatorio**; sin él (ausente, `null` o `''`) el elemento no se pinta y avisa (aviso 4). Debe ser único; repetido se pintan **los dos** y avisa (aviso 5): `select` lleva `item` para distinguirlos y el estado del acuse va **por elemento**, no por `id` (#663) |
| `label` | String | **Obligatorio** (no vacío tras recortar); sin él no se pinta y avisa (aviso 3): una acción sin nombre no se puede anunciar ni operar. La letra y el filtro buscan aquí |
| `icon` | String \| otro | Cadena: `GIcon` con ese nombre en `g-fab__icon` (`aria-hidden`); un nombre que no existe deja el hueco vacío con el aviso de `GIcon`. Otro valor: dato opaco que hoy no se pinta (lo recibirá el slot `icon`, reservado). La pila y el panel funcionan sin icono (la etiqueta manda) |
| `description` | String | En el **panel**, segunda línea visible y `aria-describedby`. En la **pila** no se pinta (la píldora es una línea) pero sigue como descripción accesible con el patrón de texto oculto. La busca el filtro de C, no la letra |
| `group` | String | Título del grupo **en el panel** (`role="group"` con nombre); los grupos se ordenan por **primera aparición** y los elementos sin `group` van primero, sin título. En la pila no hay grupos (manda la frecuencia). Plano a propósito (#657): con grupos anidados el orden de frecuencia y el de grupos chocarían |
| `disabled` | Boolean \| String | `aria-disabled="true"`, **sigue enfocable** (como `GMenu`); no ejecuta ni cierra. Con **String**, ese motivo es su **descripción visible** (también en la pila, segunda línea; regla 1 de «Acciones con acuse», #643) |
| `danger` | Boolean | Marca de forma `triangle-alert` (decorativa) y color `danger-text`, nunca solo color. Con confirmación en el sitio (§«Peligrosas») |
| `confirm` | String \| `false` | Solo con `danger`. String: la **pregunta** (nombre del grupo de confirmación). `false`: sin confirmación (solo si la aplicación ofrece «Deshacer» en su aviso: README). **Ausente con `danger`:** se confirma igual, con la `label` como pregunta, y avisa (aviso 6). Sin `danger`, se ignora y avisa (aviso 7) |
| `confirmLabel` | String | Texto del botón que confirma; sin él, la `label` del elemento |

**Sin manejador por elemento** (Vue emite `select`), sin `order`, sin `shortcut`/`keyshortcuts` (en v1), sin `href` (un FAB no navega: un destino es `GMenu` con elementos-enlace o la navegación de la aplicación en `select`).

## Formas y estados

### Datos de forma

| Caso | Qué se pinta | `data-appearance` |
| --- | --- | --- |
| `items` vacío (tras validar) | **Nada**: ni botón ni panel vacío (los permisos pueden quitarlas todas); sin aviso | (sin raíz visible: comentario de Vue) |
| Una sola acción, sin `main` | El FAB **es** esa acción: `GBtn` solo icono, nombre = su `label` (por `GTooltip`), un toque la ejecuta, sin `aria-haspopup` | `single` |
| `main` con el resto vacío | La principal de C sola (icono + etiqueta visible), sin cola | `single` |
| `main` (C) | Grupo principal + cola; la cola abre el **panel** | `main` en la raíz; `panel` en la lista |
| `appearance="auto"` (A) | Pila, pila con cola o panel según la política | `stack` · `panel` |
| `appearance="panel"` | Panel directo | `panel` |

### A · Política `auto` (medible)

**Estimación:** `k₀ = min(n, 5, ⌊(H + g) / (p + g)⌋)`, con:

- `n` = número de acciones pintables;
- `H` = espacio en el eje de bloque entre el FAB (más `space × 3`) y el margen seguro del lado hacia el que crece (visor o contenedor, ya descontados `offset` y las reservas que lee, §«Bordes compartidos»);
- `p` = alto de una píldora **de una línea**: `max(24px, space × 10)`; **44px** con `pointer: coarse` (es el `--_pill` del CSS; con `space` ≥ 2,4 vale `space × 10`);
- `g` = separación: `space × 2`.

**Ajuste con lo medido (#670):** una píldora con motivo visible (deshabilitada con String, fallo con texto) añade una línea `caption`, y una etiqueta larga se parte en dos a 320px o con texto al 200 %; ninguna de las dos cabe en `p`. Por eso `k` es **el mayor entero ≤ `k₀`** con el que la pila **medida** cabe en `H`: las `k − 1` primeras más la cola (o las `k`, si `k = n`), con sus altos reales y `g` entre ellas. El `.vue` lo mide en `opening` (lista ya mostrada y sin transición, §«Estados») y baja `k` de uno en uno mientras no quepa; nunca lo sube por encima de `k₀`. La cola mide lo que mida su etiqueta (`labels.more`).

Resultado: **`n ≤ k`** → todas en la pila; **`n > k ≥ 2`** → `k − 1` píldoras + la cola «Más acciones (N)» (N = `n − k + 1`); **`k ≤ 1`** → panel directo. `k` se calcula **al abrir**, **al redimensionar** con la lista abierta y **cuando la pila abierta deja de caber en `H`** porque cambió el alto de una píldora (un fallo que añade su motivo mientras está abierta; `ResizeObserver` sobre la lista, una vez por cuadro); **nunca al desplazar** y nunca para subir `k` con la lista abierta (lo que entró en el panel no vuelve a la pila hasta cerrar). Constantes de diseño (`k ≤ 5`, `space × 3`, `space × 10`, `space × 2`): no son tokens (`tokens.md` §47).

**Promesa de A (criterio de hecho):** con el mismo `H`, pasar de 6 a 10 o a 15 acciones no mueve ninguna de las cuatro primeras (Δ ≤ 0,5px; kiwi midió 0,02px) y con 3 están donde estaban con 15. El ajuste medido no la rompe: el sitio de cada píldora solo depende de las que tiene entre ella y el FAB, no de `n` ni de `k`. La peligrosa respeta el orden que da la aplicación (la protege la confirmación en el sitio).

### Panel (A con cola, `appearance="panel"` y C)

- Contenido: los elementos que no están en la pila (A), todos (`panel`) o todos menos `main` (C), **agrupados por `group`** con el orden escrito de arriba abajo; descripciones visibles.
- Ancho: `min(space × 80, ancho disponible)`; en **estrecho** (ancho del visor o del contenedor < `space × 130`, umbral de `GDialog`), todo el ancho menos los márgenes seguros.
- Alto: el espacio entre el disparador (+ `space × 3`) y el margen seguro, con un mínimo de `space × 20`; si el contenido es mayor, **el panel se desplaza** y el FAB (el cierre) queda siempre **fuera** del panel y visible. `--_max` fijo durante el desplazamiento (#358 regla 2).
- **Dónde, en A con cola:** encima de la pila si en ese lado quedan ≥ `space × 40`; si no, **la cubre entera** (cascada, como `GMenu`): el `.vue` escribe entonces en el panel **`--_minh`** (px, alto de la caja de la lista de la pila) para que una pila más alta que el contenido del panel no asome por debajo; sin cubrirla, no lo escribe. Abrir el panel no mueve la pila.
- **`--_minh` es el alto exacto** (#677): `getBoundingClientRect().height` de la lista de la pila, **sin margen**. El panel que la cubre se coloca desde el mismo origen que la pila (FAB + `space × 3`), así que con ese alto la tapa justa. El `+ space × 1` del banco de coco no es contrato: si en la auditoría asoma la sombra de la píldora más lejana, el margen lo pone el CSS (`calc(var(--_minh) + …)` en su `min-block-size`), nunca el `.vue`.
- **Dónde, en C y `panel`:** pegado al disparador (la cola en C), hacia dentro.

### Estados (todos con comportamiento explícito)

| Estado | `data-state` | Comportamiento |
| --- | --- | --- |
| Contraído | `closed` | Lista oculta (`popover` cerrado, fuera del árbol de accesibilidad); FAB (o cola) con `aria-expanded="false"`; reserva de borde publicada |
| Abriéndose | `opening` (dos cuadros) | **Estado de partida, sin transición** (#671): el `.vue` muestra la lista (popover abierto), mide (política `auto` con alturas medidas), escribe **en `opening`** todos sus datos de colocación (`--_x`, `--_y`, `--_w`, `--_max`, `--_minh`, `--_fx`, `--_fy`, `--_i`, `--_clip-from`, `--_hole-*`) y pasa a `open` en el **segundo cuadro**; así la entrada sale siempre de la semilla, con cualquier orden de escrituras. La lista **ya es operable y tiene el foco**; el segundo clic de una ráfaga (`detail > 1`) se ignora (#661); el velo táctil aparece |
| Abierto | `open` | Foco itinerante en la lista; `aria-expanded="true"`; el FAB no se aparta |
| Cerrándose | `closing` | La lista es **inerte** (`inert`) y todos sus elementos llevan `tabindex="-1"` (sin ello Chromium hace del panel una parada de Tab y el foco cae en `body`, medido; L7). Volver a abrir durante la salida la cancela y pasa **directamente a `open`, sin volver a `opening`** (si pasara por `opening`, la fila saltaría a la semilla): desde donde esté (transiciones, no keyframes: nada queda a medias); los datos se reescriben solo si la geometría cambió |
| Sin acciones | — | No se pinta nada; sin aviso; sin reserva |
| Deshabilitadas | — | `aria-disabled` enfocables con su motivo visible (String). **Todas** deshabilitadas: el FAB se abre igual y enseña los motivos. **Una sola** (`single`): el FAB lleva `aria-disabled` y el motivo es la `detail` de su `GTooltip` (descripción y segunda etapa visible) |
| Acción en curso | `data-ack="busy"` (raíz **y** el elemento, #669) | Ticket de #663: insignia que gira en el FAB, el texto como descripción del FAB, anuncio cortés; la acción `aria-disabled` con ese texto mientras dura (no se lanza dos veces). **No se pinta como deshabilitada** (ni tachada ni atenuada como una no disponible): `data-ack="busy"` en el elemento dice «en marcha» |
| Hecha | `data-ack="done"` (solo la raíz) | Insignia `check` durante `RECEIPT_MS` (4000 ms) y anuncio; la acción vuelve a estar disponible (el elemento pierde `data-ack`) |
| Fallida | `data-ack="failed"` (raíz **y** el elemento) | Insignia `circle-alert` y anuncio; el motivo queda como descripción visible de la acción (`g-fab__reason`, que coco puede pintar en `danger-text`), que **se puede reintentar** (`retry: true` en el `select`) |
| Contenido que excede la altura | — | La pila **nunca** desplaza (solo entra lo que cabe, ≤ 5); el panel limita su alto y desplaza; el FAB queda fuera del panel |
| Apartado | `is-tucked` | §«Se aparta» |
| Bajo un modal | — | §«Modal» |
| Error de configuración | — | §«Errores de configuración»: se pinta lo pintable y avisa; **nunca lanza ni descarta en silencio** |

## Anatomía

```
div.g-fab  data-position data-anchor data-appearance data-state data-ack? is-tucked?   ← raíz, en el borde; recibe $attrs
├─ A / single:  GTooltip text=label [detail=acuse|motivo]
│               └─ GBtn icon rounded="pill" size="xl"  id="ID-trigger"
│                  aria-haspopup="menu" aria-expanded aria-controls="ID-menu"     (single: sin haspopup/expanded/controls)
│                  ├─ span.g-fab__glyph.g-fab__glyph--rest aria-hidden > slot trigger-icon (por defecto GLibIcon plus)
│                  ├─ span.g-fab__glyph.g-fab__glyph--open aria-hidden > GLibIcon x  (los dos se cruzan, #671)
│                  └─ span.g-fab__badge aria-hidden > GLibIcon (loader-circle|check|circle-alert)   (insignia del acuse)
├─ C:  div.g-fab__main-group role="group" aria-label=label
│      ├─ GTooltip text=main.label [detail=acuse|motivo] └─ GBtn size="xl" id="ID-main"   (icono del elemento + etiqueta visible + insignia)
│      └─ GBtn icon id="ID-trigger" aria-haspopup="menu" aria-expanded aria-controls="ID-menu"
│         nombre labels.moreShort (GTooltip) · span.g-fab__glyph--rest > ellipsis-vertical ↔ span.g-fab__glyph--open > x
│         (la principal es el primer `button` del grupo y la cola el último; los `div.g-tooltip` hermanos no cuentan)
├─ ul.g-fab__list  id="ID-menu" role="menu" popover="manual" tabindex="-1" aria-labelledby="ID-trigger"
│  ├─ (pila)  li role="none" > button.g-fab__item role="menuitem" tabindex="-1|0" aria-describedby="…" [data-ack]
│  │          span.g-fab__icon aria-hidden · span.g-fab__label · span.g-fab__desc|__reason · span.g-fab__mark (danger)
│  │          … y la cola: button.g-fab__item--more role="menuitem" id="ID-tail" aria-haspopup="menu"
│  │                       aria-expanded aria-controls="ID-more"  → labels.more con {count}
│  │          armada:  li role="none" > div.g-fab__confirm role="group" aria-label=pregunta
│  │                   ├─ button.g-fab__cancel role="menuitem"           ← hijos directos, solo estos dos, en el orden
│  │                   └─ button.g-fab__confirm-action role="menuitem"   ← visual (Cancelar bajo la pulsación); sin g-fab__item
│  ├─ (panel C) li.g-fab__find role="none" aria-hidden  → pista, o span.g-fab__find-query (lo escrito)
│  │                                                       + span.g-fab__find-count (recuento); sin coincidencias, is-empty-result
│  └─ (panel)  li role="none" > div.g-fab__group-title id="ID-g0" role="presentation" + ul role="group" aria-labelledby="ID-g0"
├─ ul.g-fab__list  id="ID-more" role="menu" popover="manual" tabindex="-1" aria-labelledby="ID-tail"   ← panel de la cola de A
└─ div.g-fab__scrim popover="manual" aria-hidden="true" > span.g-fab__scrim-part   ← solo pointer: coarse; cuatro piezas alrededor del disparador (#668)
```

- **Iconos que se cruzan (#671):** el FAB de A y la cola de C llevan **dos** `span.g-fab__glyph` (`--rest` y `--open`), uno sobre otro; el CSS los cruza con `data-state` de la raíz. El slot `trigger-icon` va **dentro** de `--rest` (no sustituye al `span`). Los dos son `aria-hidden`: el estado lo da `aria-expanded`.
- **Par de confirmación (#671):** `.g-fab__cancel` y `.g-fab__confirm-action` son **hijos directos** de `.g-fab__confirm` y **sus únicos hijos elemento** (el nombre del grupo va en `aria-label`, no en un hijo visible): el CSS pone los extremos de la píldora partida con `:first-child`/`:last-child`, sea cual sea el orden. **No llevan** `g-fab__item` (heredarían la sombra de la píldora en cada medio). El par **sustituye** al `button.g-fab__item` dentro del mismo `li` y al deshacerse vuelve el `button`.

- **El disparador es un `GBtn`** `icon rounded="pill" size="xl"` (52 × 52 con `space` 4, medido; sin tamaño ni variante nuevos de `GBtn`), con el rebote al soltar de #300 tal cual. El nombre visible lo da `GTooltip` (#380; con `aria-expanded="true"` no abre, #384). La elevación (`--g-shadow-2`) es del CSS de `GFab`, no de `GBtn`.
- **Una sola descripción:** el texto del acuse (o el motivo de una sola acción deshabilitada) es la **`detail` del `GTooltip`** del FAB (o de la principal en C): es la descripción accesible y, al pasar o al enfocar por navegación, se ve en la segunda etapa (#389). Sustituye al `span` de estado oculto del prototipo: así quien ve tiene el texto y el lector no lo oye dos veces.
- **Las listas viven dentro de la raíz**, después del disparador (una sola raíz: `$attrs` llega a ella), con `popover="manual"` (capa superior, sin foco automático) y **sin `Teleport`**: heredan la zona de marca y el `dir` del sitio (`api.md` «Zona de marca», regla 3). El top layer no se ve afectado por el `translate` de la raíz al apartarse.
- **`tabindex="-1"` en cada lista** (contenedor desplazable con foco itinerante, #570) y **lista inerte** mientras se cierra (L7).
- **Lo propio del componente usa la lista de la librería** (`GLibIcon`): `plus`, `x`, `ellipsis-vertical`, `loader-circle`, `check`, `circle-alert`, `triangle-alert`. **Cero iconos nuevos** (comprobado en `scripts/icons.json`).

## Orden y foco (#660)

1. **Pila:** el primer elemento de `items` es **el más cercano al FAB**. Cuando la pila **sube** (FAB abajo), el DOM va de arriba abajo, así que la más importante es **la última del DOM**, junto al botón (precedente: iOS `UIMenu` con `preferredMenuElementOrder = .priority`); cuando baja (FAB arriba), es la primera. Lectura, foco y flechas siguen a lo visual (1.3.2, 2.4.3). **Desviación registrada respecto de `GMenu`**, que siempre empieza arriba.
2. **Panel:** orden escrito, de arriba abajo, por grupos.
3. **Foco al abrir:** Intro, Espacio, el clic y **la flecha hacia la lista** (↑ con el FAB abajo, ↓ con el FAB arriba) abren con el foco en la **primera por frecuencia** (pila: la más cercana; panel: la primera escrita); **la flecha contraria** abre en la **más lejana** (pila) o la última (panel).
4. **Foco al cerrar:** Esc, elegir y pulsar el FAB → **al FAB** (en C, a la cola; tras elegir la principal, a la principal); **Tab** → cierra y el foco sigue su curso **desde el FAB** (Mayús+Tab hacia atrás; en C, hacia atrás es la principal); **clic fuera** con puntero fino → cierra **sin robar** el foco; **toque en el velo** (puntero grueso) → cierra sin activar lo de debajo y el foco vuelve al FAB (no hay destino que lo reciba); **el ancla sale del visor o de su contenedor** (`anchor="container"`) → cierra **sin devolver** el foco (#358 regla 3); **un modal se abre** → cierra sin tocar el foco (lo toma el modal). Esc con el foco perdido en `body` mientras la lista está abierta (WebKit no enfoca un botón al pulsarlo) **también cierra** (medido por kiwi).
5. **Orden de `select`:** el de `GMenu` (#573): emitir, cerrar, foco al disparador si seguía en la lista. Un `GDialog` abierto dentro del manejador recibe el foco y al cerrarse lo devuelve al disparador (medido con los componentes reales en los tres motores).
6. **Si `items` cambia con la lista abierta**, se vuelve a calcular la forma; el elemento enfocado conserva el foco si sigue (por su clave interna); si no, va a la primera por frecuencia.

## Teclado (APG *Menu*, como `GMenu`)

| Tecla | Dónde | Acción |
| --- | --- | --- |
| Intro / Espacio | FAB, cola | Abre con el foco en la primera por frecuencia. En `single` y en la principal de C, ejecuta |
| Flecha hacia la lista / la contraria | FAB, cola | Abre en la primera / en la más lejana (§«Orden y foco», 3) |
| ↑ ↓ | Lista | Anterior / siguiente en el DOM, **cíclico** (en la pila que sube, ↑ se aleja del FAB y ↓ se acerca) |
| Inicio / Fin | Lista | Primer / último del DOM |
| Letra | Pila, panel de A y `panel` | Salta al siguiente elemento cuya **etiqueta** empieza por lo escrito (búfer de 500 ms; motor de `GMenu`) |
| Letra / Retroceso | Panel de C | **Filtra** / corrige (§«C · Buscar al escribir») |
| Intro / Espacio | Lista | Activa (Espacio **no** forma parte de lo escrito en C) |
| → (← en RTL) · Intro · Espacio | Cola «Más acciones» de A | Abre su panel con el foco en su primera |
| ← (→ en RTL) · Esc | Panel de la cola de A | Vuelve a la cola |
| ← → | Par de confirmación | Entre «Cancelar» y la confirmación (espejadas en RTL) |
| Esc | Lista | Por orden, **un paso por pulsación**: deshace la confirmación armada → limpia lo escrito (C) → cierra el panel de la cola (A) → cierra y devuelve el foco al FAB. **No llega a un ancestro** (como `GMenu`) y **`event.repeat` se ignora** (#565, #661) |
| Tab / Mayús+Tab | Lista | Cierra; el foco sigue su curso desde el FAB |

- **Sin hover para abrir:** la cola de A **no** abre su panel al pasar el puntero (todo se abre con un toque o una tecla; sin M4 de `GMenu`).
- **El puntero mueve el foco** (M1 de `GMenu`, #305): al entrar con `pointerType` `mouse`/`pen` en un elemento habilitado, pasa a ser el activo (`preventScroll`); sobre un deshabilitado no; **el puntero quieto nunca mueve la lista** (#358 regla 4). El resaltado **que viaja** (`has-highlight`, `--_active-y/h`) vale en el **panel**; en la pila cada píldora es su propia superficie y pinta su estado activo (coco).
- **Una activación por gesto** (#661): el segundo clic de una ráfaga (`detail > 1`) no cierra el FAB, no ejecuta otra acción y no confirma una peligrosa; Intro o Espacio **mantenidos** (`repeat`) no repiten la acción ni reabren el FAB.

## C · Buscar al escribir (#658)

Solo en el **panel de C** (con `main`) y solo con sus cuatro textos (`labels.findHint`, `matches`, `matchesOne`, `none`; sin alguno, el panel salta por letra como el de A y avisa, aviso 11). Cumple la regla común de `api.md` «Letras en listas de comandos»:

1. **Se anuncia a la vista desde que se abre:** la primera fila del panel (`li.g-fab__find`, `aria-hidden`) dice `labels.findHint` («Escribe para buscar»). Con algo escrito, dice lo escrito y el recuento (««exp» · 1 acción»). La semántica sigue siendo `menu`: **no hay `textbox`** dentro.
2. **Qué cuenta como escribir:** una tecla de un carácter imprimible **distinto de Espacio**, sin Ctrl, ⌘ ni Alt, fuera de una composición de IME (`isComposing`). Retroceso borra el último carácter. Lo escrito se compara **sin mayúsculas ni diacríticos** (`toLocaleLowerCase` + NFD sin marcas) y **contiene** (no «empieza por») sobre `label` y `description`.
3. **Filtra:** los elementos que no coinciden se ocultan (`hidden`: fuera del árbol y del foco itinerante) y un grupo sin elementos visibles también. El orden de los visibles no cambia.
4. **El foco cae donde lo habría puesto la letra:** en el primer visible cuya **etiqueta empieza** por lo escrito; si ninguno, en el primer visible. Así una letra sola lleva al mismo sitio que en `GMenu` (desde el principio de la lista) y dos letras afinan.
5. **Sin coincidencias:** lo escrito **no se amplía** con esa tecla, la cabecera dice `labels.none` seguido de lo que se intentó, se anuncia, **la lista no se vacía** y el foco no se mueve.
6. **Anuncios:** el recuento (`matches` con `{count}` / `matchesOne`) y `none`, por el **canal cortés de página** (`announcePage`, #533, que fusiona las pulsaciones seguidas).
7. **Esc** limpia lo escrito (todo vuelve) y la siguiente cierra. Cerrar limpia lo escrito.
8. **Límite (README):** lo escrito no lleva espacios (Espacio activa, APG); con 15 acciones, dos letras bastan (medido por kiwi).

## Peligrosas: confirmación en el sitio (#662)

1. Activar una acción `danger` con confirmación **parte su fila en dos sin mover nada más**: «Cancelar» (`labels.cancel`) **con el foco y bajo el punto de la pulsación** (con teclado, al inicio lógico) y la confirmación (`confirmLabel`, relleno `danger` + `on-danger`) al lado, dentro de un `div role="group"` cuyo **nombre es la pregunta** (`confirm`, o la `label`). Los dos son `menuitem` del foco itinerante (↑ ↓ y ← → los recorren); el lector dice la pregunta al entrar en el grupo.
2. **Se deshace sin temporizador** (2.2.1): «Cancelar», Esc, o el foco que sale del par (flechas, puntero, Tab). Vuelve la fila con el foco en ella.
3. **Un doble clic nunca ejecuta:** el segundo clic de la ráfaga se ignora (#661) y, si cae, cae en «Cancelar». Con teclado: Intro en la acción, → (o ↓) a la confirmación, Intro: se ejecuta **una vez**.
4. Confirmar emite `select` del elemento (con su ticket) y sigue `closeOnSelect`.
5. **Nada se mueve** (#677): en la pila, el par es más estrecho que la píldora y la columna se movería. El `.vue` escribe al armar, en el `li` de esa fila, **`--_armed-w`** (px, ancho de la píldora en ese momento) y lo retira al deshacer o confirmar; el CSS lo aplica como `min-inline-size` de ese `li`. El `.vue` **no escribe propiedades en línea** (`api.md`: solo variables dinámicas justificadas).
6. Igual en la pila y en el panel. `confirm: false` se salta el par (solo si la aplicación ofrece «Deshacer»). **Sin `labels.cancel`** con alguna peligrosa que confirma, esas acciones quedan `aria-disabled` (fallo seguro: nada destructivo sin poder cancelar) y avisa (aviso 11).
7. **Elegido frente a** retener para confirmar (exige tiempo y motricidad fina), diálogo de confirmación (salto de contexto para una acción de un menú) y deshacer como única vía (solo vale si la aplicación puede deshacer).

## Acuse: `select` con ticket (#663; `api.md` «Acciones con acuse», regla 3)

`select` es **síncrono en el gesto** y su carga trae el ticket de #643:

```ts
type FabSelectEvent = {
  id: string | number
  item: FabItem            // el objeto de items (distingue ids repetidos)
  event: Event             // nativo; event.preventDefault() mantiene abierto esa vez
  retry: boolean           // la acción venía de un fallo
  busy(text?: string): void
  done(text?: string): void
  failed(text?: string): void
  cancel(): void
  waitUntil(p: Promise<string | { message?: string } | boolean | null | void>): void
}
```

- **Semántica idéntica a #643:** `waitUntil` = `busy()` y al asentarse: String o `{ message }` → `done(texto)`; `true` → `done()`; `false`/`null`/`undefined` → `cancel()`; rechazo `{ message? }` → `failed(message)`. El ticket vale hasta asentarse o hasta que **ese mismo elemento** vuelve a empezar; se puede usar **más tarde** (tras un `GDialog` de la aplicación); una llamada fuera de tiempo se ignora y avisa (aviso 13). **Sin ticket no hay acuse** (nunca un éxito no confirmado).
- **Textos:** el del ticket o, sin él, `labels.busy` / `labels.done` / `labels.failed`; sin ninguno, la insignia sin texto ni anuncio, y aviso 11 (una acción `aria-disabled` sin motivo es peor que con él).
- **En curso:** insignia `loader-circle` que gira (quieta con movimiento reducido) en la esquina del FAB (o de la principal, si es ella); el texto, `detail` del `GTooltip` del FAB y anuncio cortés; al reabrir, la acción está `aria-disabled` con ese texto visible. Pulsarla no hace nada.
- **Hecho:** insignia `check` durante **`RECEIPT_MS` = 4000 ms** (la constante de `GDocumentPreview`, `tokens.md` §29.6) y anuncio; luego se retira sola.
- **Fallo:** insignia `circle-alert` y anuncio; el texto queda como **descripción visible de la acción** y como `detail` del FAB hasta que esa acción vuelve a empezar, se cancela o sale de `items`. La acción vuelve a estar habilitada: activarla emite `select` con `retry: true`.
- **Dato en el elemento (#669):** además de `data-ack` en la raíz (lo que pinta la insignia), el `.vue` pone **`data-ack="busy"`** o **`data-ack="failed"`** en **el elemento que ejecuta esa acción**: el `button.g-fab__item` de la pila o del panel, o el `GBtn` del FAB en `single` y el de la principal en C (llega al `button` por `$attrs`). Sin valor (atributo ausente) en reposo y tras `done`/`cancel`. En curso el elemento sigue `aria-disabled="true"` (no se lanza dos veces), pero el CSS **no lo tacha ni lo pinta como no disponible**: una acción que se está haciendo no es una que no se puede hacer. En el fallo el elemento está habilitado y su motivo es el texto del fallo.
- **Varias a la vez:** cada elemento tiene su estado (clave interna, no `id`); la insignia muestra el más prioritario (en curso › fallo › hecho) y la `detail`, el texto más reciente de ese nivel.
- **Anuncios:** todos por `announcePage` (#533); nada de `role="alert"`. Un aviso flotante (`GToast`) es decisión de la aplicación.

## Se aparta (#664; WCAG 2.4.11)

1. **Cuándo:** al llegar el foco (`focusin` del documento) a un elemento **fuera** del FAB cuya caja se cruza con la del FAB contraído; y, **con `pointer: coarse`**, al enfocar un campo editable (`input` de texto, `textarea`, `contenteditable`; no `readonly` ni `disabled`) en cualquier sitio (teclado en pantalla). Nunca con la lista abierta.
2. **Qué:** `is-tucked`: el FAB se desplaza **contra su borde** (esquinas: en el eje en línea, hacia su lado; `*-center`: en el eje de bloque, hacia su borde) y deja **24px** visibles y operables. Nada de la página se mueve; la reserva de borde **no cambia** (lo transitorio no mueve a lo persistente).
3. **Criterio de hecho:** apartado, el FAB cubre **≤ 5 %** del elemento con foco y **nunca su centro** (kiwi midió 1,2 %).
4. **Vuelve:** cuando el foco sale de ese elemento a uno no cubierto, cuando llega al propio FAB (Tab) o al soltar el campo editable. **El primer toque o clic sobre el FAB apartado solo lo devuelve** (no abre ni ejecuta: en C la principal ejecuta a un toque y no se activa algo a medio ver); con teclado, el foco lo devuelve y la siguiente Intro activa.
5. **No se esconde al desplazar** (moverse con el scroll es un estorbo y un riesgo vestibular) ni por el puntero.
6. Límite (README): el teclado en pantalla se detecta por el foco en un campo, no por `visualViewport` (no verificado en móvil real).

## Velo táctil (#664, #668)

Solo con `pointer: coarse`: bajo la lista, un velo (`div.g-fab__scrim`, `popover="manual"`, `aria-hidden`) con `--g-surface-backdrop` a la mitad de su opacidad (constante de coco, `tokens.md` §47; sin token nuevo) que cubre **el visor entero salvo una ventana sobre el disparador**. Tocar el velo **cierra sin activar lo de debajo** (medido: el enlace tocado no se sigue) y el FAB sigue siendo el cierre. Con puntero fino no hay velo y el clic fuera llega a su destino (convención de escritorio, como `GMenu`).

**Forma (#668), sustituye al «`clip-path` con hueco, `evenodd`»** (`polygon()` está prohibido en CSS de componente, `icons.md` §1, y una máscara no cambia dónde cae el toque):

1. **Cuatro piezas** que no se solapan alrededor de la ventana y la **cierran por los cuatro lados**: el elemento, su `::before`, su `::after` y **un hijo `span.g-fab__scrim-part`** (geometría de cada pieza: coco). **La franja entre el disparador y su borde también se vela**: ahí viven el margen seguro, `offset` y las reservas, es decir, la pill de la voz y el muelle de `GPageHeader` (§«Bordes compartidos»); un toque que falla el FAB por abajo es justo el que no debe activar nada.
2. **La ventana** es la caja del **disparador contraído** (en A y `single`, el FAB; en C, el grupo principal + cola: los dos siguen operables, la cola cierra y la principal ejecuta y cierra), **más `space × 1` por lado** (para no velar el contorno ni la sombra; #668 dejaba elegir entre 0 y `space × 1` y coco eligió `space × 1`, fijado en #677). Un toque en ese anillo, o en las esquinas de la caja fuera de la forma redonda, llega a lo que haya debajo: **límite aceptado** (README), a ≤ `space × 1` del borde visible del FAB.
3. **Datos:** `--_hole-x`, `--_hole-y`, `--_hole-w`, `--_hole-h` (px **enteros**, redondeados **hacia fuera**: `floor` del origen, `ceil` del extremo) de la ventana **con su anillo** en coordenadas del visor. **El anillo lo suma el `.vue`** (constante `HOLE_RING = 1`, en unidades de `space`) **antes** de redondear: `x = floor(left − s)`, `w = ceil(right + s) − x`, igual en bloque; **el CSS no suma nada** (#677: sumado en CSS con un `space` fraccionario, las costuras de las cuatro piezas quedarían en medio píxel) (el velo lo cubre entero, así que «relativo al velo» = «del visor»). Con fracciones, la costura entre piezas dejaría una línea más clara. Se escriben en `opening` y al redimensionar con la lista abierta (el FAB no se aparta con la lista abierta, §«Se aparta»). Sin ellos la ventana es nula y el velo lo cubre todo, también el FAB.
4. **También con `anchor="container"`** el velo cubre **el visor entero**, no solo el contenedor: «tocar fuera no activa lo de debajo» (personalidad 6) no depende de dónde acabe el contenedor, y un contenedor dentro de un `<dialog>` ya tiene el fondo del modal alrededor. El `.vue` **no escribe** `--_x`/`--_y`/`--_w`/`--_h` en el velo (los valores de partida del CSS ya cubren el visor; quedan sin uso).
5. **Sin** `transform`, `filter`, `contain` ni `will-change` en el velo (sus piezas son fijas y su bloque contenedor debe ser el visor; como popover de la capa superior, el `translate` de la raíz no le afecta).

## Posición y paneles anclados

- **Margen seguro:** `space × 4` desde el borde + `env(safe-area-inset-*)` del lado (solo `viewport`) + `offset` + la reserva leída (§«Bordes compartidos»). El `.vue` escribe en la raíz **`--_offset`** = la longitud de `offset.bottom` (posiciones `bottom-*`) u `offset.top` (`top-*`) **tal cual** (longitud CSS de la aplicación, sin convertir; como `--_toaster-offset-*` de `GToaster`) y **`--_reserve`** (px); el margen y el apartarse los suman en CSS (#671).
- **La lista siempre crece hacia dentro** (FAB abajo → sube; arriba → baja): no hay cambio de lado (la regla 1 de #358 se cumple trivialmente). Si no hay sitio, se limita el alto y el panel desplaza (regla 2: `--_max` fijo al desplazar; se recalcula al abrir, al cambiar el contenido y al redimensionar).
- **Regla 3:** con `anchor="viewport"` el FAB no sale nunca del visor; con `container`, si el contenedor (o su contenedor con desplazamiento) saca al FAB de la vista, la lista **se cierra sin devolver el foco**. La lista sigue al FAB con `followFrame` de `utils/anchor.js` (una escritura por cuadro y solo si cambia).
- **Regla 4:** el puntero quieto no cambia el activo ni desplaza (motor compartido).
- **Pila:** alineada con el borde del FAB de su lado (los iconos en columna sobre el del FAB); con `*-center`, centrada. **Panel:** §«Panel».
- **Estrecho** (< `space × 130`): la pila no cambia (es la columna del pulgar); el panel a todo el ancho menos los márgenes, encima del FAB. **Reflujo a 320px** sin desplazamiento horizontal (1.4.10).
- **RTL:** todo lógico; `bottom-end` va a la izquierda. Medido por kiwi.

## Bordes compartidos (`edgeReserve`, #659)

**Cuarto cliente de `utils/edgeReserve.js`** (#322, #631). Cambio interno en el principal (bruno): **`EDGE_ORDER = { speech: 10, pageHeader: 15, status: 20, fab: 25 }`**.

| Pieza | Borde | Publica | Lee | Efecto |
| --- | --- | --- | --- | --- |
| FAB contraído (`anchor="viewport"`) | el de su `position` | Su alto **contraído** + el margen seguro (px; `order: EDGE_ORDER.fab`) | `edgeReserve(borde, { before: EDGE_ORDER.fab })`: abajo, la pill de la voz y el muelle de `GPageHeader`; arriba, la voz, el zócalo pegado y la isla | El FAB queda **encima** de la voz y del muelle (abajo) o **debajo** del zócalo y la isla (arriba); `GToaster`, que suma todo, queda **más allá** del FAB, sin cambiar su llamada |

- **El FAB abierto no cambia su reserva** (movería los avisos bajo el dedo); apartado, tampoco.
- **Por borde, sin mirar la alineación** (regla de #322): un FAB en `bottom-end` también eleva los avisos de `bottom-start`. Se acepta como en la isla.
- **No publica ni lee** con `anchor="container"`, dentro de un `<dialog>`, sin acciones ni durante SSR. Se retira al desmontar.
- **`edgeReserve.js` llega a la entrada por `__shared`** (#240): una copia crearía otro registro (lo prueba bruno con las dos entradas cargadas).
- **`GPageHeader`:** abajo, el FAB queda encima del muelle (25 > 15). Receta (README, sin aviso): lo que es de la página va en el muelle; lo de crear o capturar, en el FAB; nunca la misma acción en los dos.
- **Voz:** «Dictar nota» puede ser una acción del FAB que llama a `speech.start()`; la pill (más cerca del borde) y el FAB conviven sin solaparse. La pill de la voz arriba no lee reservas (límite conocido de #631, no se reabre `speech.md`).

## Modal (#659)

El FAB **no se traslada** al `<dialog>` modal superior (la voz sí, #213, porque se dicta en los campos del modal; las acciones de página no aplican dentro). Al abrirse un modal (detectado con `utils/topModal.js`): la lista se cierra **sin mover el foco** y el FAB queda **inerte** bajo el fondo (lo hace el propio modal). Un `GFab` montado **dentro** de un `<dialog>` (con `anchor="container"`, p. ej. un mapa en un diálogo) funciona y no toca reservas.

## Movimiento (#655; `tokens.md` §29 y §47)

| Qué | Cómo | Movimiento reducido |
| --- | --- | --- |
| Píldoras de la pila al abrir | Cada una **sale del centro del FAB** y viaja a su sitio (`translate` desde el vector `--_fx`/`--_fy`), con `--g-duration-press` + `--g-ease-out`, **la más cercana primero**: retardo `--g-duration-fast × min(i, 4) / 8` (`--_i`); con el tema por defecto, 160 + 60 = 220 ms ≤ 240 | Fundido `--g-duration-fast`, sin `translate` ni escalonado |
| Píldoras al cerrar | Vuelven hacia el FAB con `--g-duration-fast` + `--g-ease-out`, sin escalonado (la salida, más corta, #152) | Fundido |
| Icono del FAB | `plus` ↔ `x` (o `ellipsis-vertical` ↔ `x`) **se cruzan** (coco: fundido y giro corto) con `--g-duration-press` | Fundido |
| Panel de la cola de A y `panel` | Entrada de popover: `--g-duration-press` + `--g-ease-out` (como `GMenu`) | Fundido |
| Panel de C | **Transformación de contenedor:** nace con el tamaño y el sitio de la cola (`clip-path: inset(…)` desde `--_clip-from`) y crece hasta su caja con `--g-duration-slow` + `--g-ease-out` | Fundido, sin recorte |
| Se aparta / vuelve | `translate` con `--g-duration-press` + `--g-ease-out` | Aparece en su sitio |
| Confirmación en el sitio | La fila se parte con un fundido `--g-duration-fast` (nada se mueve) | Igual |
| Insignia en curso | Giro de carga (`--g-duration-spin`; keyframes `g-*`, §29.4) | Quieta |
| Velo táctil | Fundido `--g-duration-fast` | Igual |

- **Sin muelle ni rebote propios** (`--g-ease-spring` y `--g-ease-bounce` no aplican a menús ni paneles, #299). El rebote al soltar del FAB es el de `GBtn` (#300), uso ya aprobado. Nada supera 240 ms (#71); nada se anima al montar (`is-ready`); los efectos de puntero solo con `@media (hover: hover)`.
- Las transiciones son interrumpibles: reabrir durante la salida parte de donde esté.

## Personalidad (#655)

**Qué lo hace distinto** (de `declaracion.md` «Qué lo hace distinto», puntos 1 a 6 y 8; el 7 es de B, reservado):

1. **El orden nace del botón:** lo más usado está siempre pegado al FAB, también en el foco y en el DOM. Menos recorrido para el pulgar; el foco cae en lo más probable.
2. **Las frecuentes nunca se mueven** (A): añadir acciones cambia la cola, no el sitio de lo aprendido (Δ 0 con 3, 6, 10 y 15).
3. **Nunca tapa lo que usas:** se aparta del foco y del teclado en pantalla y se queda en 24px operables.
4. **Lo que confirma nunca nace bajo el puntero:** la confirmación se abre en la misma fila con «Cancelar» bajo el dedo; un doble clic nunca borra, sin diálogo ni temporizador.
5. **El FAB cuenta lo que hizo:** «Exportando…» → «CSV exportado» en el propio botón, sin otro flotante que tape pantalla, y la acción no se lanza dos veces.
6. **Tocar fuera no activa lo de debajo** (táctil).
7. **Una acción dominante no se esconde** (C) y **dos letras** llevan a cualquiera de 15 sin un campo de búsqueda que rompa el menú.

Nada de esto toca contraste, foco ni movimiento reducido: los estados llevan forma además de color (marca de peligro, insignias con icono), en reducido todo se funde y en `forced-colors` mandan los bordes del sistema.

## Tokens consumidos (`tokens.md` §47; **ninguno nuevo**)

Corregido en #671 con el CSS real de coco: el FAB no lee `brand` (lo impide `roles.test.js`); su relleno llega por **`GBtn color="brand"`, que lee la familia `primary`** (§17.4: `primary` es el color de la acción principal y, sin valor propio, alias de `brand`).

| Token | Para qué |
| --- | --- |
| `--g-color-primary`, `--g-color-on-primary`, `-strong`, `-soft` (por `GBtn color="brand"`) | FAB, principal y cola |
| `--g-color-primary-text` (**por `GBtn` `solid`**, #672; `GFab.css` no lo lee, #678) | **Contorno** del FAB, de la principal y de la cola: el borde de `--g-border-width` que `GBtn` `solid` pinta en `{familia}-text` (el relleno solo da 1,77:1 frente a la página con una marca pálida; con el contorno, ≥ 4,53:1 medido en los trece temas). En el tema por defecto no se ve (`primary-text` = `primary`). `GFab.css` solo añade la elevación (6a88382 quitó su anillo propio, que lo duplicaba). **Junta de C:** una sola línea, la costura de la cola; el borde final de la principal, transparente (#678) |
| `--g-color-primary` (en `GFab.css`) | Relleno y borde de **partida** del panel de C en la transformación de contenedor (el color de la cola) |
| `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-border`, `--g-color-border-control` | Píldoras, panel, activo, separadores, contorno de la cola, ficha de lo escrito, borde de la insignia en curso |
| `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Etiqueta, descripción y motivo, título de grupo y pista de C; `text`/`surface` es el par inverso de la semilla encendida (#325) |
| `--g-color-danger-text` | Etiqueta y marca de la peligrosa sobre `surface`; motivo de un fallo (#669) |
| `--g-color-danger`, `--g-color-on-danger` | Botón que confirma, semilla encendida de la peligrosa, insignia «fallo» |
| `--g-color-success`, `--g-color-on-success` | Insignia «hecho» (**siempre un relleno con su par**: un `-text` sobre un `-soft` se rompe dentro de la zona de marca, donde `-text` se redeclara y `-soft` no; corrige L14 de kiwi) |
| `--g-color-success-text`, `--g-color-danger-text` (como **borde**, #673) | Contorno de las insignias «hecho» y «fallo» y del botón «Confirmar» (relleno de familia como forma, §7.1, como `GBtn` `solid`): ≥ 4,51:1, 5,41 en la zona de marca. El `-text` va en el **borde**, contra lo de fuera, no como texto sobre su relleno: no contradice «un relleno con su par». La insignia «en curso» (`surface` + `border-control`) no es relleno de familia y no cambia |
| `--g-color-focus`, `--g-focus-width`, `--g-focus-offset` | Foco |
| `--g-surface-backdrop` | Velo táctil (a la mitad de su opacidad) |
| `--g-radius-pill`, `--g-radius-lg`, `--g-radius-md`, `--g-radius-sm`, `--g-border-width` | Forma (`sm`: medios de la píldora partida y ficha de lo escrito) |
| `--g-shadow-1`, `--g-shadow-2`, `--g-shadow-3` | Elevación: FAB deshabilitado, FAB y píldoras, panel (elegida por coco) |
| `--g-text-body-size`, `--g-text-body-weight`, `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-action-weight`, `--g-text-title-sm-weight`, `--g-font-ui` | Etiquetas, descripciones, títulos de grupo; tamaño del icono del FAB (`body-size × 1.4`, el de `GBtn xl`); peso de la peligrosa (`title-sm`) |
| `--g-space-*` | Márgenes, separaciones y constantes de la política |
| `--g-duration-fast`, `--g-duration-press`, `--g-duration-slow`, `--g-duration-spin`, `--g-ease-out`, `--g-ease-standard` | Movimiento (`standard` en los cambios de color y en el fundido del resaltado, como `GMenu`) |

- **Contorno y `aria-disabled` (#678):** `GBtn` solo quita el contorno de #672 con `[disabled]`, `.is-disabled` o `:disabled`; el FAB usa `aria-disabled` (sigue enfocable), así que `single` y la principal **en curso** conservan contorno y elevación, como pide #669. Una `single` o principal **deshabilitada** (no en curso) también conserva el contorno: no lo exige 1.4.11 (exime lo inactivo) pero tampoco lo prohíbe; su aspecto de no disponible (hoy, `--g-shadow-1`) es de coco, que lo mide en la auditoría sin quitar el contorno por #672.
- **Zona de marca:** todos los del grupo de color que se pintan sobre una superficie están en la lista de `tokens.md` §44.5 o en «no se redeclaran» con su par; no se añade ninguno (`api.md` «Zona de marca», regla 5). Dentro de una zona, el FAB sólido `brand` es la tinta invertida (§44.1). coco lo mide dentro de una zona.
- **Constantes de `GFab.css` (#671; no son tokens ni literales de tema):**
  - **De coreografía** (`tokens.md` §29.6, #187): giro de **45°** de los iconos que se cruzan (es la geometría que hace del `+` una `x`, como los giros de 90° y 180° de `GBreadcrumbs`, #500); **`0.96`** de escala de partida del panel de la cola y de `appearance="panel"` (la de `GMenu`); márgenes del recorte en reposo **`space × −6`** (fila de la pila) y **`space × −12`** (panel de C), que dejan ver el anillo de foco y la sombra sin quitar el `clip-path` (no se interpola con `none`).
  - **Factores geométricos** (#187, como `50% − 50%/sqrt(2)` de `GBadge`): **`0.1464`** = `(1 − 1/√2)/2`, el punto del círculo a 45° donde se centra la insignia. Mejor escrito como `calc((1 - 1 / sqrt(2)) / 2)` (se lee de dónde sale; `sqrt()` está en los tres motores): opcional para coco.
  - **De diseño** (como #532 y las medidas de `estilo.md` derivadas de `space`): **opacidad `0.5`** del velo (la mitad del fondo de un modal: el velo no bloquea una tarea, solo se traga el toque); la **costura de C al 35 %** de `currentColor` (decorativa: la principal y la cola se nombran por su etiqueta y su icono); `space × 13` del FAB (el `GBtn xl`), `space × 11` de la cola, `space × 5` de insignia e iconos, `space × 3,5` de sus glifos, `space × 1,5` de relleno del panel. Un tema no las cambia.
  - **Límite (README):** un tema cuya `--g-shadow-2` o `--g-shadow-3` se extienda más allá de `space × 6` (24px con `space` 4) o `space × 12` verá su sombra recortada en las píldoras o en el panel de C en reposo. Las del tema por defecto caben con margen.
- **Mínimos (no son tema):** objetivos ≥ 24px (píldora `max(24px, space × 10)` = 40px) y **≥ 44px con `pointer: coarse`**; texto ≥ 12px; etiquetas ≥ 4,5:1; FAB, icono e insignias ≥ 3:1 frente a lo que tienen al lado (1.4.11); foco visible.

## Clases y datos (contrato bruno ↔ coco)

| Clase o dato | Dónde | Cuándo |
| --- | --- | --- |
| `g-fab` | Raíz `div` | Siempre que hay acciones |
| `data-position`, `data-anchor` | Raíz | Siempre |
| `data-appearance` | Raíz y cada lista | `single` · `stack` · `panel` (en la raíz de C, `main`) |
| `data-state` | Raíz y lista | `closed` · `opening` · `open` · `closing` |
| `data-ack` | Raíz | `busy` · `done` · `failed` (sin valor: sin acuse) |
| `data-ack` | **Elemento que ejecuta** (`g-fab__item`, o el `GBtn` de `single` y de la principal de C) | `busy` · `failed` mientras dura ese estado de esa acción; ausente en reposo y tras `done` (#669) |
| `is-tucked` | Raíz | Apartado |
| `is-coarse` | Raíz | Opcional: fuerza el modo táctil (la consulta `pointer: coarse` ya lo resuelve; Firefox no emula el puntero grueso) |
| `--_reserve` | Raíz, en línea | Reserva leída de su borde (px) |
| `--_offset` | Raíz, en línea | `offset.bottom` (`bottom-*`) u `offset.top` (`top-*`), longitud CSS tal cual; ausente sin `offset` de ese borde (#671) |
| `g-fab__main-group`, `g-fab__main` | C | Con `main` |
| `g-fab__glyph` (+ `--rest`, `--open`) | Dentro del FAB de A y de la cola de C | Siempre: `--rest` con `trigger-icon`/`plus` o `ellipsis-vertical`, `--open` con `x` (#671) |
| `g-fab__badge` | Dentro del FAB (o de la principal) | Siempre (vacía sin acuse) |
| `g-fab__list` (+ `--stack`, `--panel`) | `ul role="menu"` | Siempre |
| `--_x`, `--_y`, `--_w`, `--_max` | Cada lista, en línea | Abierta |
| `--_minh` | Panel de la cola de A, en línea | Solo cuando cubre la pila: alto **exacto** de la caja de la lista de la pila (px), sin margen (#671, #677) |
| `--_armed-w` | `li` de la fila armada, en línea | Mientras dura el par de confirmación: ancho de la píldora al armarse (px); el CSS lo aplica como `min-inline-size` del `li` (#677) |
| `--_clip-from` | Panel de C, en línea | Al abrir (recorte de partida) |
| `g-fab__item` (+ `--danger`, `--more`), `is-expanded` | Elemento | Siempre (`is-expanded` en la cola con su panel abierto) |
| `--_fx`, `--_fy`, `--_i` | Cada `li` de la pila, en línea | Al colocar la pila, **en `opening`** (vector del centro de la fila al centro del FAB, px, e índice desde el FAB, tope 4) |
| `g-fab__icon`, `__label`, `__desc`, `__reason`, `__mark` | Partes del elemento | Según el elemento |
| `g-fab__group-title` | Título de grupo | Panel con `group` |
| `g-fab__find` (+ `is-empty-result`) | Cabecera de C | Panel de C con sus textos |
| `g-fab__find-query`, `g-fab__find-count` | Dentro de `g-fab__find` | Con algo escrito: lo escrito y el recuento (o `labels.none` + lo intentado) (#671) |
| `g-fab__confirm`, `__cancel`, `__confirm-action` | Par de confirmación | Armada (estructura en §«Anatomía») |
| `has-highlight`, `is-highlight-instant`, `--_active-y`, `--_active-h` | Panel | M1 (motor compartido) |
| `g-fab__scrim`, `g-fab__scrim-part` | Velo y su cuarta pieza | `pointer: coarse` y abierto (#668) |
| `--_hole-x`, `--_hole-y`, `--_hole-w`, `--_hole-h` | Velo, en línea | Ventana sobre el disparador **con su anillo de `space × 1` ya sumado por el `.vue`**, en px enteros del visor, redondeada hacia fuera (#668, #677) |
| `--_x`, `--_y`, `--_w`, `--_h` | Velo | **No se escriben** (el velo cubre siempre el visor, #668) |
| `g-fab__sr` | Texto oculto (patrón accesible) | Descripción en la pila |

**Selectores sobre hijos de la aplicación:** uno, `.g-fab__glyph > svg`, que da al icono del slot `trigger-icon` el tamaño del hueco (como `GBtn` con el suyo; `icons.md` §2.2, #204: el hueco fija el tamaño y una clase de la aplicación gana por capa). Un `svg` no puede ser un `.g-tooltip`, así que no necesita la exclusión de #383; cualquier otro que llegue, con ella.

## Slots

| Slot | Propósito | Alcance |
| --- | --- | --- |
| `trigger-icon` | Icono del FAB contraído en A (sustituye a `plus`; decorativo, un `<GIcon>` dentro). En C no se usa: la principal lleva el icono de su elemento | `{ open }` |

**Por qué un slot y no una prop `icon`** (#666): regla de `api.md` «Iconos en los componentes» (#202): plantilla → slot; un nombre de icono solo viene de datos (`items[].icon`). Precedente: `toggle-icon`, `search-icon` y `more-icon` de `GSidebar`. **Reservado:** slot `icon` `{ item }` para el icono de cada elemento (mismo nombre y forma que en `GMenu`) y slot `item`.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `select` | `FabSelectEvent` (§«Acuse») | Se activa una acción (también la principal de C, la única de `single` y la confirmación de una peligrosa). Nunca un deshabilitado, ni la cola, ni «Cancelar» |
| `update:modelValue` | Boolean | Se abre o cierra por una vía del usuario (con o sin `v-model`) |
| `open`, `closed` | — | La lista ya se muestra / ya se ocultó |

Todos declarados en `emits` (si no, los escuchas llegan al elemento nativo por `$attrs`).

## Métodos

Ninguno en v1 (abrir y cerrar van por `modelValue`).

## Textos (`labels`; sin valores por defecto, #226)

| Clave | Para qué | Cuándo hace falta | Sin ella |
| --- | --- | --- | --- |
| `more` | Nombre de la cola de A («Más acciones ({count})»; `{count}` = acciones en el panel) | Hay cola | **Panel directo** (sin cola), aviso 11 |
| `moreShort` | Nombre de la cola de C («Más acciones») | Con `main` y resto no vacío | `main` se ignora (forma A), aviso 11 |
| `cancel` | «Cancelar» del par de confirmación | Alguna peligrosa que confirma | Esas acciones `aria-disabled` (fallo seguro), aviso 11 |
| `findHint` | Pista visible del panel de C | C | Sin filtro (salta por letra), aviso 11 |
| `matches` (`{count}`), `matchesOne` | Recuento del filtro (cabecera y anuncio) | C | Igual que `findHint` (van juntas) |
| `none` | Sin coincidencias («Ninguna acción con») | C | Igual |
| `busy`, `done`, `failed` | Texto del acuse cuando el ticket no lo trae | Opcional | Insignia sin texto ni anuncio, aviso 11 |

Cadenas; las que llevan `{count}` admiten también una función `({ count }) => string` (como `tag.md`).

## Estructura accesible (resumen)

- Disparador A: `button` (por `GBtn`) con nombre `label` (por `GTooltip`), `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`; descripción = `detail` del acuse. C: `group` con nombre `label` que contiene la principal (su `label` visible) y la cola (`labels.moreShort`, botón de menú).
- Lista: `ul role="menu"` con `aria-labelledby` del disparador; `li role="none"`; `button role="menuitem"` con `aria-describedby` a su descripción y a su motivo; grupos `ul role="group"` con `aria-labelledby` a su título (`role="presentation"`); cola `aria-haspopup="menu"` y `aria-controls` del panel, que se nombra por la cola.
- `aria-disabled` (nunca `disabled`) en las deshabilitadas, en curso y, en el fallo seguro, en las peligrosas sin `labels.cancel`.
- Abrir y cerrar no se anuncian (`aria-expanded`); las acciones las lee el foco; el acuse y el recuento van por `announcePage`; el par de confirmación por el nombre de su grupo.

## Errores de configuración (#665; avisos `[Grana GFab]`, una vez por instancia y motivo)

**Nunca lanza, nunca descarta en silencio.** Con la guarda canónica de #653 (`try { if (process.env.NODE_ENV !== 'production' …) … } catch {}`, `api.md` «Avisos de desarrollo»); la validación de `items` corre al montar y al cambiar `items` (nunca por cuadro ni por evento continuo), con la guarda **fuera** del bucle cuando el bucle solo sirve al aviso.

| # | Cuándo | Qué hace el componente |
| --- | --- | --- |
| 1 | `items` no es un arreglo | No pinta nada |
| 2 | Más de una acción y sin `label` | Pinta; el FAB (o el grupo de C) sin nombre |
| 3 | Elemento sin `label` | No lo pinta (sin nombre no es operable) |
| 4 | Elemento sin `id` | No lo pinta |
| 5 | `id` repetido | Pinta **los dos**; `select` lleva `item`; acuse por elemento |
| 6 | `danger` sin `confirm` | Confirma con la `label` como pregunta |
| 7 | `confirm` o `confirmLabel` sin `danger` | Los ignora |
| 8 | `main` que no es el `id` de ningún elemento pintable | Lo ignora: forma A |
| 9 | `main` que apunta a una peligrosa | Lo ignora: forma A (lo destructivo no va a un toque) |
| 10 | `appearance="arc"` (reservado) | Se comporta como `auto` |
| 11 | Falta un texto de `labels` que hace falta (`more`, `moreShort`, `cancel`, `findHint`/`matches`/`matchesOne`/`none`, `busy`/`done`/`failed`) | La salida de §«Textos» |
| 12 | `modelValue` `true` sin nada que abrir (`single`, sin acciones, bajo un modal) | No abre |
| 13 | Un método del ticket tras asentarse o ser sustituido | Lo ignora |
| 14 | **Más de 15** acciones | Pinta **todas** (el resto, en el panel): el límite es una guía de diseño, no un recorte; el texto sugiere una página de acciones o `GMenu` con submenús |
| 15 | `anchor="container"` y el antecesor posicionado es el `<body>`/`<html>` (ninguno de la aplicación) | Funciona como `viewport` sin reservas |

Un icono que no existe lo avisa `GIcon` (no es un aviso de `GFab`). Medido por kiwi: 18 elementos con un duplicado y uno sin nombre → 17 pintados y 3 avisos.

## Colores forzados, RTL, SSR

- **`forced-colors`:** borde `CanvasText` en el FAB, las píldoras, el panel y las insignias; el resaltado del panel se oculta y manda el foco del sistema (como `GMenu`); la marca de peligro es un icono (no depende del color). Reglas de coco, medidas en Chromium.
- **RTL:** todo lógico (posición, alineación de la pila, flechas de la cola y del par). Medido por kiwi.
- **SSR:** ids SSR-seguros; sin `window`/`document` al importar ni en el servidor; sin reservas, velo ni medidas hasta montar en el cliente. Sin efectos en el nivel superior del módulo (#444).

## Accesibilidad (criterios)

| Criterio | Cómo se cumple |
| --- | --- |
| 1.3.1 / 4.1.2 | Botón de menú y `menu` con grupos con nombre; `aria-expanded`, `aria-controls`; C como `group` con nombre |
| 1.3.2 / 2.4.3 | Orden del DOM = visual = foco (la pila invierte el DOM al subir) |
| 1.4.1 / 1.4.11 | Peligro, deshabilitado y acuse con forma o texto además del color; FAB e insignias ≥ 3:1 |
| 1.4.10 | 320px sin desplazamiento horizontal; panel a todo el ancho en estrecho |
| 2.1.1 / 2.4.7 | Todo por teclado; foco visible siempre |
| 2.2.1 | Confirmación sin temporizador; el acuse «hecho» es informativo (el texto también va al lector) |
| 2.4.11 | Se aparta del foco y del teclado en pantalla |
| 2.5.2 / 2.5.8 | Una activación por gesto; objetivos ≥ 24px, ≥ 44px en táctil; velo que se traga el toque de fuera |
| 3.2.4 | Misma semántica en todas las formas |
| 4.1.3 | Acuse y recuento por el canal cortés de página |

## Frontera con `GMenu` y el motor compartido (#657)

- **`GFab` no envuelve al componente `GMenu`** (su lista es una pila con geometría propia, su panel nace de otro sitio y su disparador es fijo), pero **comparte su motor**, extraído a **`utils/menuNav.js`** (interno, sin promesa de estabilidad; como `utils/collapse.js` salió de `GFormSection` para `GAccordion`). Contenido mínimo (bruno decide la forma): recorrido de los enfocables de un nivel (incluidos los `aria-disabled`, sin los `hidden`); ↑ ↓ cíclicas, Inicio y Fin; **la letra** con su búfer de 500 ms sobre la etiqueta; **M1** (el puntero mueve el foco, el puntero quieto no desplaza) y los datos del resaltado (`--_active-y/h`, `has-highlight`, `is-highlight-instant`); y la guarda de **una activación por gesto** (#661).
- **`GMenu` no cambia ni de API ni de comportamiento** con la extracción: su `GMenu.test.js`, `GMenu.ssr.test.js` y sus specs de Playwright pasan **sin tocar sus aserciones**. Lo que solo es de `GMenu` (submenús con M4, casillas y opciones, elementos-enlace, pie de destino, huellas de C) se queda en `GMenu.vue`.
- **El filtro de C no entra en `GMenu`** (#658). `menuNav.js` lo ofrece como un modo del motor que solo activa `GFab`.
- **El defecto del doble clic de `GMenu` (L8)** no se arregla en esta entrega: queda en `PENDIENTES.md` §6 para bruno, con la regla de `api.md` «Una activación por gesto».
- **Nombres compartidos:** `items`, `id`, `label`, `icon`, `disabled`, `danger`, `closeOnSelect`, `select`, `open`, `closed`, `modelValue`. **Diferencias registradas:** `disabled` admite un String (motivo, #643); `group` es un String plano (no un elemento `type: 'group'`); `description` existe en `GFab` y **queda reservado con el mismo nombre y significado en `GMenu`** (si un día lo adopta, sin otra ronda de nombre); el orden de la pila nace del FAB (#660).

## Paquete y peso (#656)

- **Entrada propia `@grana/vue/fab`** (global UMD `GranaFab`): exporta `GFab` y, por defecto, un plugin que lo registra (`app.use(Fab)`); `@grana/vue` no lo exporta ni lo registra. **Por qué:** #550 (margen del principal agotado; entrada propia por defecto para un componente nuevo).
- **Llegan por `__shared`** (#240, sin copias): `GBtn`, `GTooltip`, `GIcon`, `GLibIcon`, `utils/menuNav.js`, `utils/edgeReserve.js` (**obligatorio**: un solo registro por documento), `utils/topModal.js`, `utils/liveRegion.js` (`announcePage`), `utils/anchor.js` y lo que use de `utils/motion.js`. El CSS (`GFab.css`) va en `grana.css`.
- **En el principal solo crece:** la extracción de `utils/menuNav.js` (neutra en lo posible) y `EDGE_ORDER.fab`. **Presupuesto del principal: ≤ 512 B gzip** sobre la base vigente (215 279 B, #653) para los dos; con más, vuelve a lima.
- ~~Tope de la entrada: ≤ 8 KiB (8192 B) gzip~~ (estimación de kiwi: ~4–5 KiB + 1,5 KiB). **Tope vigente (#676): ≤ 10,25 KiB (10 496 B) gzip** de `dist/fab.js`, con A, C (incluido el filtro), confirmación, acuse, se aparta y velo, incluidas sus guardas de avisos (#653, punto 5). **No se vuelve a subir:** con más, vuelve a lima y la salida ya es decisión del usuario (el filtro de C bajo demanda o fuera de v1).
- **Medida de lima** (2026-10-18, copia aislada del `src` de 18c6932, solo la entrada; `gzip` por defecto; ruido entre compilaciones ±60 B, #636):

  | Variante | `fab.js` | `fab.umd.js` | Minificado sin avisos (lo que paga la aplicación en producción) |
  | --- | --- | --- | --- |
  | Tal cual (la compuerta) | **10 149** (bruno: 10 142) | 9 264 | 8 453 |
  | Sin avisos (`NODE_ENV=production`) | 9 400 (avisos ≈ 749) | 8 582 | 8 453 |
  | Sin el filtro de C | 9 660 (filtro ≈ 489) | 8 793 | 7 993 |
  | Sin avisos ni filtro | 8 906 | 8 104 | 7 985 |

  Ni quitando el filtro y los avisos a la vez se llega a 8 192 B: el exceso está repartido (formas, política medida, confirmación, ticket, se aparta, velo), no en una pieza.
- Se declara en **`exports`** (`./fab`, con `types`, `import` y `default`), **`typesVersions`**, **`ENTRIES`** de `scripts/build-types.mjs` y **`src/types.test.js`** (#442, #443).
- **Compuertas de `dist`** (bruno las añade a `.github/scripts/gates.sh`): `grep -q "g-fab__item" packages/vue/dist/grana.css`, `! grep -q "GFab" packages/vue/dist/grana.js`, `test -f packages/vue/dist/fab.js`.
- bruno mide y registra el peso gzip (KiB, #550) de la entrada y el crecimiento del principal en el `meta.json`, `CHANGELOG.md` y `CLAUDE.md`.

## `meta.json` y tipos (#443)

`GFab.meta.json`: las once props con tipo, valores, default y obligatoriedad (`appearance` `'auto' | 'panel'` —`arc` no entra en el tipo mientras esté reservado—; `position` con sus seis valores; `anchor` `'viewport' | 'container'`; `closeOnSelect` `'auto' | 'never'`; `modelValue` `boolean | undefined`; `main` `string | number`); el slot `trigger-icon` `{ open: boolean }`; los eventos `select`, `update:modelValue`, `open`, `closed`; `methods: []`; `labels` con sus diez claves. En `packages/vue/types/overrides.mjs` (`GFab.items`, `GFab.select`): el tipo `FabItem` (§«Elementos») y `FabSelectEvent` (§«Acuse»), con `confirm: string | false` y `disabled: boolean | string`.

## Resolución de hallazgos de kiwi (L1 a L16)

| # | Hallazgo | Resolución |
| --- | --- | --- |
| L1 | Nombre, entrada y peso | `GFab` / `g-fab`, `[Grana GFab]`; entrada `@grana/vue/fab` (`GranaFab`); tope 8 KiB, principal ≤ 512 B (#656); medido, el tope pasa a 10 496 B (#676; principal +461 B, dentro) |
| L2 | Semántica | `menu` en todas las formas; disparador `GBtn icon rounded="pill" size="xl"` con nombre constante (`label`) y `GTooltip`; sin variante nueva (#657) |
| L3 | Orden desde el FAB | Contratado como desviación registrada de `GMenu`; panel en orden escrito (#660). Lector real en Fase D |
| L4 | Motor compartido | `utils/menuNav.js`; `GMenu` sin cambios de API ni comportamiento (#657) |
| L5 | Campos nuevos y letra | `description`, `group` (String plano), `confirm`, `confirmLabel` (#657, #662). El filtro de C entra **solo en el panel de C** con la regla común de letras; `GMenu` no lo adopta; `description` reservado en `GMenu` (#658). Pregunta abierta al usuario: §«Dudas» |
| L6 | Borde compartido | `EDGE_ORDER.fab = 25`; alto contraído; solo con `viewport`; nada en un `<dialog>` (#659) |
| L7 | Listas desplazables | `tabindex="-1"` en cada lista (#570) e inerte durante la salida (§«Estados») |
| L8 | Doble clic en `GMenu` | Regla común «Una activación por gesto» en `api.md`; el defecto de `GMenu` (y la medida en `GSelect`, `GDatePicker`, `GHelper`) en `PENDIENTES.md` §6 para bruno (#661) |
| L9 | Acuse en `select` | Ticket de #643 en la carga de `select`; insignia, `detail` del `GTooltip`, `announcePage`; `RECEIPT_MS` 4000 ms (#663) |
| L10 | Peligrosa | Confirmación en el sitio; `labels.cancel`; fallo seguro sin él (#662) |
| L11 | Se aparta | Contratado; regla común «Flotantes persistentes y el foco» en `api.md`; la voz ya cambia de borde (§6.3) y no se reabre (#664) |
| L12 | Velo táctil | Solo `pointer: coarse`, `--g-surface-backdrop`, opacidad de coco; sin token (#664) |
| L13 | Movimiento | §«Movimiento»; escalonado con `--g-duration-fast × min(i, 4) / 8` (precedente de #500) en lugar de 16 ms literales; sin muelle (#655) |
| L14 | Tokens | Ninguno nuevo; insignias con relleno y su par (corrige `success-soft`/`success-text`) |
| L15 | API | §«Props», «Elementos», «Eventos», «Slots»; `icon` del FAB pasa a slot `trigger-icon` (#666); `modelValue` con o sin `v-model` |
| L16 | `PENDIENTES.md` | Fila de `GFab` en §3 y defecto L8 en §6 |

## Fuera de v1 (reservado con nombre)

- **B · «Arco con gesto»** (`appearance="arc"`): cuarto de círculo (semicírculo con `*-center`) con etiquetas siempre visibles en pestaña inversa, pulsar-deslizar-soltar con cancelación en el centro, alcance del pulgar `space × 50`, umbral de gesto 10px (el `MOVE` de `GTooltip`), lo destructivo siempre en «Más», resolución a A en estrecho o si no cabe (`data-fallback="arc"`). Prototipado y medido en `design/lab/fab/r01/` (3 acciones a 96px de radio; 6 piden 346px; con el tope, 3 + «Más (3)» a 156px). Entrega propia si un producto lo pide.
- Slot `icon` `{ item }` (icono por elemento, como `GMenu`) y slot `item`.
- `shortcut`/`keyshortcuts` por elemento.
- `description` en `GMenu` (mismo nombre).
- Filtro al escribir en el panel de A, en `appearance="panel"` y en `GMenu` (pendiente de la pregunta al usuario, §«Dudas»).
- `color`, `size` y `density` del FAB.
- Ocultar el FAB al desplazar (descartado, no reservado: riesgo vestibular).

## Límites conocidos (para «Alcance» y «Verificación» del README, #675)

- **El orden de Tab es el del DOM:** el FAB es una parada donde la aplicación lo monte (receta: al final del contenido principal, antes del pie). En C son dos paradas.
- **Por borde, sin mirar la alineación:** un FAB abajo eleva todos los avisos de abajo.
- **La pill de la voz arriba** no lee reservas (#631).
- **El teclado en pantalla** se detecta por el foco en un campo, no por `visualViewport`.
- **Lo escrito en C no lleva espacios.**
- **Lector de pantalla real** sin verificar: el orden invertido de la pila («Nueva muestra, 5 de 5» al abrir), el par de confirmación dentro de un `menu` y el filtro de C.
- Estilos de elemento de la aplicación sin capa ganan (#516).
- **Peso:** la entrada `@grana/vue/fab` pesa ≈ 10 KiB gzip en `dist/` (≈ 8,3 KiB minificada y sin avisos en producción); solo la paga quien la importa (#676).
- **Velo táctil:** un toque a ≤ `space × 1` del FAB (el anillo de la ventana) o en las esquinas de su caja fuera de la forma redonda llega a lo que haya debajo (#668).
- **Sombras del tema** más extensas que `space × 6` (píldoras) o `space × 12` (panel de C) se recortan en reposo (#671).

## Verificación (cómo se da por hecho)

### bruno (vitest + jsdom)

`GFab.test.js`: formas por cantidad y política (`single`, `stack`, pila con cola, `panel`, C, con `k` simulado); orden del DOM invertido al subir y foco en la más cercana; flechas, Inicio/Fin, letra (500 ms) y el filtro de C (normalización, «contiene», foco al primero que empieza por lo escrito, sin coincidencias no amplía ni vacía, Retroceso, Esc limpia y luego cierra, sin espacios, `isComposing`); confirmación (par con nombre, foco en «Cancelar», ← →, se deshace con Esc y con el foco que sale, ejecuta una vez); una activación por gesto (`detail > 1`, `repeat`); ticket (`busy`/`done`/`failed`/`cancel`/`waitUntil`, sustitución, llamada tardía, `retry`, estado por elemento con ids repetidos, `RECEIPT_MS`); `modelValue` controlado y no; `closeOnSelect` y `preventDefault`; `edgeReserve` publica y retira con `order` 25 y lee `before`, nada con `container` ni dentro de un `<dialog>`; los quince avisos (una vez cada uno) y la guarda de #653; `trigger-icon`; sin efectos al importar ni en el servidor. `menuNav.js` con pruebas propias; **`GMenu.test.js` sin cambios en sus aserciones**.

### Playwright (`design/lab/theme-playground/`, **puerto propio**; las comprobaciones de `verificar.mjs` como base)

`tests/fab.spec.mjs` y `tests/personalidad-fab.spec.mjs`, en Chromium, Firefox y WebKit, con `GBtn`, `GTooltip`, `GMenu` y `GDialog` reales y la isla (`@grana/vue/status`), `GToaster`, la voz simulada y `GPageHeader` reales en el borde: semántica (botón de menú, `menuitem`, `li role="none"`, grupos con nombre, una parada); forma por cantidad (1, 3, 6, 10, 15) en 720 × 480 y 360 × 600; **Δ ≤ 0,5px de las cuatro primeras con 6, 10 y 15**; la cola con `aria-haspopup`, `aria-controls` y la cuenta; el panel encima de la pila o cubriéndola; dentro del marco con margen ≥ 8px y sin solapes; foco al abrir y al cerrar por cada vía; Esc con el foco en `body` (WebKit); el par de confirmación; el acuse con insignia, `detail` y un anuncio por cambio; doble clic y Intro mantenido; se aparta (≤ 5 % y nunca el centro, ≥ 24px visibles, primer toque solo devuelve); velo táctil (Chromium y WebKit con `hasTouch`: el enlace tocado no se sigue; un toque en la franja entre el FAB y su borde, sobre la pill de la voz o el muelle, cierra sin activarlos, #668; con `anchor="container"`, un toque fuera del contenedor también); política con alturas medidas (una píldora con motivo de dos líneas y etiquetas partidas a 320px: la pila no pasa de `H` y las primeras no se mueven, #670); `data-ack` en el elemento en curso y en el fallo (#669); voz → muelle → FAB → avisos sin solapes, y arriba zócalo → isla → FAB → avisos; un modal cierra la lista y deja el FAB inerte; 320px sin desplazamiento horizontal; RTL; oscuro y movimiento reducido (sin `translate`, sin recorte en C); dentro de una zona de marca; `GMenu` → `GDialog` y vuelta del foco; consola limpia. Rendimiento: abrir con 15 no supera 1 cuadro largo; el desplazamiento no vuelve a pintar Vue (**lección de bd888df**: ningún `watch` con getter que devuelva un arreglo nuevo). Los specs de `GMenu` pasan sin cambios tras la extracción.

### coco (Opus) · CSS y auditoría

`GFab.css` sin literales ni respaldos (salvo `24px`/`44px`); FAB 52 × 52 por `GBtn xl`; píldoras ≥ 40px (44px táctil); contrastes en el tema por defecto, en otro tema (NisaNabani) y en la zona de marca, en claro y oscuro; insignias ≥ 3:1; `forced-colors` en Chromium; movimiento reducido; auditoría del componente real con verificación propia en `design/lab/fab/`.

### No verificado (entorno real)

Lector de pantalla real (VoiceOver, NVDA, TalkBack) sobre el orden invertido de la pila, el par de confirmación dentro de un `menu` y el filtro de C; `forced-colors` real; teclado en pantalla real; táctil real (velo, primer toque del FAB apartado).

## Encargos

- **coco (Opus):** `GFab.css` (raíz y sitio con área segura, `--_reserve`, FAB con elevación e insignia, C con principal y cola, pila con salida desde el FAB y escalonado, panel con grupos y descripciones, cabecera de C, par de confirmación, velo con hueco, se aparta, estrecho, `pointer: coarse`, RTL, forzados, movimiento y reducido); banco y `design/lab/fab/estilo.md`; después, la auditoría. Sin cambios en `defaults.css`.
- **bruno (Opus):** `utils/menuNav.js` extraído de `GMenu.vue` sin cambiar `GMenu`; `GFab.vue` (formas y política, foco y teclado, filtro de C, confirmación, ticket y acuse, se aparta, velo, `edgeReserve`, `topModal`, `anchor`); `EDGE_ORDER.fab` en `utils/edgeReserve.js`; entrada `@grana/vue/fab` (`exports`, `typesVersions`, `ENTRIES`, `types.test.js`, `__shared`); `meta.json`, `overrides.mjs`; compuertas en `gates.sh`; specs y playground `#sec-fab`; medir los dos pesos.
- **Tras las respuestas a coco (#668 a #671), antes de que bruno cierre:**
  - **coco:** (1) velo en **cuatro piezas** con `span.g-fab__scrim-part`, cerrado también por el lado del borde, ventana = caja del disparador contraído (en C, el grupo) + 0 a `space × 1`; con `anchor="container"` sigue cubriendo el visor (#668); (2) **`data-ack` en el elemento:** `busy` sin tachado ni aspecto de no disponible (también el `GBtn` de `single` y de la principal de C, hoy con la sombra de deshabilitado) y `failed` con el motivo en `danger-text` si lo mide ≥ 4,5:1 (#669); (3) opcional: `0.1464` escrito como `(1 − 1/√2)/2` con `sqrt()`. Medir de nuevo velo y acuse en el banco.
  - **bruno:** todo lo de «Clases y datos» y «Estados» marcado con #668 a #671: `opening` sin transición con todos los datos escritos ahí y `open` en el segundo cuadro, reabrir en `closing` → `open`; `--_offset`, `--_minh`, `--_hole-*` (enteros hacia fuera, del visor) y la cuarta pieza; `data-ack` en el elemento; `k` con alturas medidas y el `ResizeObserver` de la pila abierta (sin `watch` con getter que devuelva un arreglo nuevo, lección de bd888df); el par de confirmación con sus dos hijos directos y sin `g-fab__item`.
- **Tras #676 a #678 (después de 5bdb4c1 y 18c6932), antes de la auditoría:**
  - **bruno:** (1) la fila armada conserva su ancho con **`--_armed-w`** en el `li` (sustituye al `min-inline-size` en línea de `GFab.vue`, tres sitios: al armar, al deshacer y al confirmar); (2) `GFab.meta.json` `bundle.budget` **10 496** y la línea de peso de `CHANGELOG.md` (ya no está «por encima de su tope»); (3) `HOLE_RING = 1` y `--_minh` exacto se quedan como están (#677). Las tres cosas, sin cambiar el comportamiento.
  - **coco:** (1) aplicar `min-inline-size: var(--_armed-w)` al `li` de la fila armada (sin respaldo: sin la variable, `auto`); (2) **junta de C** con una sola línea: borde final de la principal transparente en reposo, hover y active, con la costura de la cola (#678); medirlo con una marca pálida; (3) el aspecto de una `single`/principal deshabilitada con el contorno de `GBtn` (#678); (4) si asoma la sombra de la píldora más lejana bajo el panel que cubre la pila, el margen en `min-block-size` (#677); (5) un panel de `space × 80` más estrecho que una píldora larga deja asomar la pila por el lado: medirlo a 320px y en ancho; (6) la auditoría del componente real con verificación propia en `design/lab/fab/`, con `fab.js` y el CSS reales; si pasa, bruno pone `status: "candidate"` en `GFab.meta.json`.
- **mora-docs (Sonnet):** `GFab/README.md` tras la auditoría: cuándo usarlo (fronteras), A y C, el ticket, la receta con `GPageHeader` y con la voz, el orden de Tab, la entrada y el global UMD en el `README.md` raíz, y los límites.

## Dudas para el usuario (no bloquean)

1. **Buscar al escribir más allá de C** (L5, #658). Contratado solo en el panel de C, como lo eligió. ¿Lo extendemos a **todo panel de `GFab`** (el de «Más acciones» de A y `appearance="panel"`) con la regla «lista corta salta, panel filtra»? ¿Y a **`GMenu`** cuando sus listas son largas? Cualquiera de las dos cambia un comportamiento existente o elegido, por eso no se decide aquí. Si dices que sí, es una opción del motor compartido (sin cambios de API).
