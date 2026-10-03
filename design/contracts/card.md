# Contrato · GCard

**Dueño:** lima · **Estado:** aprobado (pendiente de CSS y construcción) · **Basado en:** `design/lab/card/r01/` (kiwi; `brief.md` del usuario y `declaracion.md`) · **Compone:** `surface.md`, `menu.md`, `badge.md`, `btn.md` · **Se usa con:** `widget.md` (`GMetric`, `GProgress`, `GDataList`)
**Tag:** `g-card` · **Categoría:** presentación de contenido

Una **superficie de contenido contenida**, con regiones opcionales combinables (media, encabezado, contenido, metadata, acciones, pie), que sirve para resumir, representar una entidad, mostrar métricas, ofrecer acciones o ser el punto de entrada a una vista de detalle. **No impone qué contiene.** Las doce composiciones del brief (Basic, Content, Media, Entity, Profile, Metric, Status, Interactive, Selectable, Horizontal, Action, Inset) **no son componentes**: son el mismo `GCard` con otras props y slots. Decisiones del usuario: DECISIONS.md #123 a #125; derivadas de estándar: #126 a #135.

---

## Principios

- **`GCard` compone `GSurface`** (`surface.md`): la raíz **es** una `GSurface` (`as="article"`). Fondo, borde, sombra, radio, escala de relleno y `density` son de la superficie; `GCard` añade regiones, orden del DOM, acción principal, selección, estado y medición. No copia ni extiende su CSS.
- **Un solo componente, sin subcomponentes** (`GCardHeader`, `GCardMedia`… no existen): las regiones salen de props de atajo y slots, y el orden del DOM, el de foco y el enlace estirado son de la tarjeta. El agrupamiento de selección (`GCardGroup`) se difiere (#124).
- **Nunca la tarjeta entera es un control.** La acción principal es un `<a>`, `<button>` o `<label>`/`<input>` **dentro del título**, cuyo `::after` cubre la tarjeta («enlace estirado»). Las demás acciones son hermanas por encima. Una tarjeta con varios controles no puede ser un `<button>` ni un `<a>` (WCAG 4.1.2; un botón no contiene encabezados ni controles).
- **Una sola activación principal por tarjeta:** navegar, accionar, alternar o seleccionar con toda la tarjeta son **excluyentes**. Combinar «abrir» y «elegir» se hace con la casilla explícita (`selectable`).
- **Presenta y emite intención** (como el resto de Grana): `modelValue` es el estado; el componente nunca lo cambia por su cuenta sin emitir.
- **Los estados cambian poco la superficie y ninguno cambia su tamaño.** Nunca solo color (WCAG 1.4.1); el hover **no mueve** la tarjeta (sin `transform`).
- **Adaptable por el espacio de la propia tarjeta**, no del dispositivo: una `ResizeObserver` sobre la raíz. Sin `@container` ni `@media` con valores fijos.
- **Sin textos por defecto** (Grana es internacional): todo texto va en props, slots y `labels`.
- **Sin dependencias de dominio:** el avatar, la imagen, el gráfico, el mapa o el vídeo son del consumidor, por slot.
- **Se reutiliza, no se duplica:** `GSurface`, `GMenu`, `GBadge`, `GBtn`, `GIcon` y, como contenido, `GMetric`, `GProgress` y `GDataList`.

## Frontera con otros componentes

| Componente | Relación |
| --- | --- |
| `GSurface` | Es la raíz de `GCard` (compone). Una `GSurface` suelta sigue siendo la primitiva no interactiva sin estructura |
| `GWidget` | **Independiente en v0.1** (#125, decisión del usuario): `GWidget` es la carcasa de **dashboard** (mide ancho y alto, niveles `s`/`m`/`l`, estados `populated`/`loading`/`empty`/`error`/`stale`/`disabled`, rejilla, galería); `GCard` es la primitiva **general** y se **reorganiza** en lugar de ocultar zonas. Comparten vocabulario (eyebrow, título, `badge`/`badgeColor`, `GMenu`, pie, `labels` sin valores) pero no código. `GWidgetGallery` **no** ofrece tarjetas como widgets; la revisión de una posible convergencia queda para cuando `GCard` esté verificada |
| `GCheckbox layout="card"` | **Complementarios** (#36): `GCheckbox card` es un **campo de formulario** (toda la tarjeta es su `<label>`, sin interactivos dentro). `GCard` seleccionable es una **tarjeta de contenido con acciones** en la que la selección es un control más. Si solo se elige un valor y no hay otra acción, `GCheckbox card`; si hay media, metadata o acciones, `GCard` |
| `GTable` | Mantiene su modo tarjetas (#109); no usa `GCard` |
| Lista (`ListItem`) | **No existe `GListItem`:** una fila de lista es `GCard` (`orientation="horizontal"`, `density="compact"`, `level="flat"`, `as="li"`) |
| Metric Card | `GCard` + `GMetric` en el slot por defecto (más un gráfico en un slot con `role="img"`); no hay prop ni tipo «métrica» (#126) |

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `as` | String | `article` `li` `div` `section` | `article` | propia (precisa la de `GSurface`) |
| `level` | String | `flat` `outlined` `raised` `inset` | `outlined` | propia (subconjunto de `GSurface`) |
| `padding` | String | `xs` `sm` `md` `lg` | `md` | propia (la de `GSurface`, sin `none`) |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | según `level` | compartida |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `color` | String | `brand` `accent` `neutral` | `brand` | compartida (subconjunto) |
| `orientation` | String | `vertical` `horizontal` `auto` | `vertical` | propia |
| `mediaPosition` | String | `top` `start` `end` `background` `inline` | `top` | propia |
| `eyebrow` | String | texto libre | sin valor | propia (como `GWidget`) |
| `title` | String | texto libre | sin valor | propia (nombre accesible) |
| `subtitle` | String | texto libre | sin valor | propia |
| `description` | String | texto libre | sin valor | propia (como `GWidget`) |
| `headingLevel` | Number | 2 a 6 | `3` | propia (como `GWidget`) |
| `titleLines` | Number \| String | `1` `2` `3` `4` `none` | `2` | propia |
| `descriptionLines` | Number \| String | `1` `2` `3` `4` `none` | `none` | propia |
| `expandable` | Boolean | | `false` | propia |
| `badge` | String \| Number | texto corto | sin valor | propia (como `GWidget`) |
| `badgeColor` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `neutral` | compartida |
| `meta` | Array | `[{ label, value, priority? }]` | `[]` (función) | propia |
| `menu` | Array | `items` de `GMenu` | `[]` (función) | propia (como `actions` de `GWidget`) |
| `status` | String | `info` `success` `warning` `error` | sin valor | propia |
| `statusText` | String | texto libre | sin valor | propia |
| `retryable` | Boolean | | `false` | propia (solo con `status="error"`) |
| `empty` | Boolean | | `false` | propia |
| `loading` | Boolean | | `false` | compartida (precisada en `api.md`) |
| `skeleton` | Object | ver «Carga» | sin valor | propia |
| `disabled` | Boolean | | `false` | compartida |
| `interaction` | String | `auto` `none` `link` `button` `toggle` `select` | `auto` | propia |
| `href` | String | URL del destino | sin valor | propia |
| `target`, `rel` | String | como en `<a>` | sin valor | propia |
| `current` | Boolean | | `false` | propia (solo con enlace) |
| `modelValue` | Boolean \| Array \| String \| Number | ver «Selección» | `false` | compartida |
| `selectable` | Boolean | casilla explícita sobre una tarjeta de enlace o de acción | `false` | propia |
| `selectType` | String | `checkbox` `radio` | `checkbox` | propia |
| `name`, `value` | String \| Number | como en `<input>` | sin valor | propia |
| `labels` | Object | ver «Textos» | `{}` (función) | propia |
| `id` | String | | generado | propia |

Cada prop enumerada declara `validator` con su lista (`api.md`).

### Reglas de props

- **`as`:** solo elementos de contenido. `article` (por defecto, nombra por el título, ver «ARIA»), `li` (colecciones: el consumidor pone el `ul`/`ol`) y `div`/`section`. Un `as` interactivo (`a`, `button`…) se rechaza con el validador y avisa: la tarjeta **nunca** es el control.
- **`level`:** `flat`, `outlined`, `raised` e `inset` de `GSurface` con sus reglas (#99). **`floating` no se expone** (es de superficies flotantes). **`interactive` y `selected` no son niveles:** son comportamiento y estado y no cambian la estructura. Sobre una superficie hundida, `inset` toma el tono contrario al padre.
- **`padding`:** el relleno de la `GSurface` raíz (`xs` `sm` `md` `lg`), multiplicado por `density`. Las regiones **a sangre** (media `top`/`start`/`end` y pie) usan ese relleno publicado (ver «Relleno y regiones a sangre»). No hay `none`: sin relleno no hay región a sangre ni radio concéntrico que calcular.
- **`color`:** familia de la **marca de selección**, de la marca de «actual» y del anillo del indicador; el resto es neutro. `brand` lee `--g-color-primary*` (#95). No colorea el fondo.
- **`orientation`:** `vertical` (siempre `data-layout="column"`), `horizontal` (`row` mientras el tamaño no sea `narrow`) y `auto` (`row` solo en `wide`). **Con media lateral se usa `auto` u `horizontal`.** Con `vertical`, una media `start`/`end` se pinta arriba.
- **`mediaPosition`:**
  - `top`: media a sangre arriba (también es la colocación de `start` y `end` cuando el layout es `column`).
  - `start` / `end`: lateral, a sangre, con `data-layout="row"`; el lado es **lógico** (RTL se espeja). `end` en columna se pinta arriba (solo orden visual; la media es decorativa).
  - `background`: detrás de todo el contenido, con velo (`--g-card-scrim`) y texto del color `--g-card-on-scrim`; primer hijo del DOM. Solo tiene sentido con media decorativa.
  - `inline`: dentro del cuerpo, entre el encabezado y el contenido; **se renderiza dentro del cuerpo** (decisión de render, no de CSS), sin sangrar.
  La media es el slot `media`. **No es un control:** el clic sobre ella activa la acción principal. Un control dentro de la media (reproducir) es un interactivo más, por encima del estirado. Media **decorativa por defecto** (`g-card__media` lleva `aria-hidden="true"`) o **informativa**: si el nodo raíz del slot trae `role="img"` (con nombre, de la aplicación), el envoltorio no se oculta.
- **`title`:** nombre accesible de la tarjeta y texto del encabezado. Sin `title` (ni slot `title`, ni `aria-label`/`aria-labelledby` en `$attrs`) avisa en desarrollo (excepto con `loading`). `headingLevel` fija el nivel (`h2` a `h6`) para la jerarquía de la página.
- **`titleLines` / `descriptionLines`:** limitan las líneas con recorte (`line-clamp`); **el texto completo sigue en el DOM**. Valores `1` a `4` o `none`. El título por defecto limita a `2`; la descripción, no. Un título de 120 caracteres con `1` pierde información visible: es decisión del consumidor.
- **`expandable`:** con `descriptionLines` distinto de `none`, añade el botón «Mostrar más»/«Mostrar menos» (`labels.expand`/`labels.collapse`, `aria-expanded`, `aria-controls`) **solo si realmente hay recorte** (medido por bruno con `ResizeObserver`; sin recorte no se renderiza). Emite `expand`. El título no se expande.
- **`badge`:** texto o número corto, con forma y texto (`GBadge`, `size="sm"`, `variant="soft"`); no solo color. El slot `badge` lo sustituye.
- **`meta`:** `[{ label, value, priority? }]` (`label` y `value` obligatorios; `priority`: `high` por defecto, `low`). Se renderiza como lista de descripción (`<dl>`). Con `density="compact"`, los de `priority: 'low'` **no se renderizan**. El slot `meta` lo sustituye (el consumidor mantiene la semántica).
- **`menu`:** el **menú de acciones** del encabezado, con `GMenu` (`menu.md`; #129): los `items` de `GMenu`. Sin valor no hay botón. Disparador: botón de la tarjeta con `GIcon` `ellipsis-vertical` y nombre `labels.menu` + título (ver «ARIA»). **No hay menú de clic derecho** (`GMenu` no lo cubre y no es accesible por sí solo; si algún día entra, **duplicará** este). La lista vive en la capa superior (`popover`): el `overflow` de la tarjeta no la recorta. Cada elemento activado emite `action` con `{ id }` (y `checked` en casillas y opciones); **la tarjeta no guarda el estado** del menú.
- **`status` y `statusText`:** un **aviso de contenido de la tarjeta** (no de un campo) en el cuerpo: icono + texto + marca de borde de inicio de distinta forma por valor (sólido/discontinuo; no solo color). Valores `info` `success` `warning` `error`, que leen `--g-color-info|success|warning|danger` (`-soft`/`-text`): el nombre `error` es el del brief y el de `GWidget`; el color es `danger` (`api.md`). **`statusText` es obligatorio con `status`** (aviso en desarrollo si falta; el icono es decorativo). `status="error"` es `role="alert"` **solo cuando aparece después de montar** (al montar ya con él, `role="status"`: no se interrumpe al usuario por un estado que ya existía); los demás, `role="status"`. Con `retryable`, el aviso `error` añade un `GBtn` con `labels.retry` que emite `retry` (carga fallida); **sin `labels.retry` no se dibuja el botón** y solo avisa en desarrollo. `status` no cambia `loading`, `empty` ni la acción principal.
- **`empty`:** el área de contenido muestra el slot `empty` (o, sin slot, `labels.empty`; sin ninguno de los dos avisa en desarrollo y no dibuja nada); **el encabezado se conserva**. Una `GMetric` sin datos deja su sitio al vacío sin cambiar el encabezado. No todas las tarjetas lo necesitan.
- **`loading`:** ver «Carga». **`disabled`:** ver «Estados».
- **`interaction`:** el modelo de la acción principal (una sola):

  | Valor | Elemento principal | Cubre | Para qué |
  | --- | --- | --- | --- |
  | `none` | ninguno | | Tarjeta informativa |
  | `link` | `<a href>` dentro del título | Toda la tarjeta | Navegar (abrir en pestaña, clic derecho y arrastrar **funcionan**: es un enlace real) |
  | `button` | `<button type="button">` dentro del título | Toda la tarjeta | **Action Card**: una tarjeta con un solo propósito |
  | `toggle` | `<button aria-pressed>` dentro del título | Toda la tarjeta | Estado **de la interfaz** (filtros, preferencias), no un valor de formulario |
  | `select` | `<input type="checkbox\|radio">` real; el **título es su `<label>`** | Toda la tarjeta | Un valor de formulario elegido |
  | `auto` (defecto) | `link` si hay `href`; si no, `none` | | |

  Un `href` con `interaction` distinto de `link`/`auto` avisa en desarrollo (navegar y seleccionar son excluyentes). `interaction="link"` sin `href` avisa y cae a `none`. **No hay prop `to` ni `router-link`** (#70, #133): el router se integra con el evento cancelable `navigate`.
- **`href`, `target`, `rel`:** del `<a>` principal. Con `target="_blank"` y sin `rel`, se emite `rel="noopener noreferrer"`. Con `disabled`, el `<a>` **no lleva `href`** y es `role="link" aria-disabled="true"` (no enfocable, sigue leyéndose; como `GBtn` y `GSidebar`, #70).
- **`current`:** con enlace, `aria-current="true"` en el `<a>` y `is-current` (lista maestro-detalle); marca visible con **borde, fondo y un `chevron-right` decorativo** (en RTL, espejado). Es distinto de `selected` y del foco. Sin enlace, avisa.
- **`selectable` y `selectType`:** una **casilla o radio explícita** (hermana, **antes** del título en el DOM) en una tarjeta `link` o `button`, para abrir una cosa y elegir otra. Nombre accesible: el título (`aria-labelledby`). Con `interaction="select"` o `toggle` es redundante y avisa. Con `selectable` el modelo de selección va por `modelValue` (ver abajo) y **el clic en la casilla no activa la principal**.
- **`modelValue`, `value`, `name` (selección):** como el `<input>` nativo con `v-model` (mismo criterio que `GCheckbox`, #36):
  - `checkbox`/`toggle` sin `value`: `Boolean`.
  - `checkbox` con `value`: `Array` (se emite un arreglo nuevo con el valor agregado o quitado).
  - `radio`: el modelo es el **valor elegido del grupo**; la tarjeta está seleccionada si `modelValue === value`. Al elegirla se emite `value`. Un grupo = tarjetas con el mismo `name` y el mismo `v-model`, dentro de un `role="radiogroup"` **del consumidor**, con nombre. (`GCardGroup` queda diferido: #124.)
  - `name` se aplica al `<input>`; con `radio` es necesario (aviso en desarrollo si falta).
  Una tarjeta `disabled` o `loading` no emite.
- **`labels`:** ver «Textos».
- **Atributos** (`class`, `style`, `data-*`, `aria-*`, escuchas): van a la **raíz**. `aria-label`/`aria-labelledby` del consumidor sustituyen al nombre por el título.

### Relleno y regiones a sangre (hallazgo 1 de kiwi; #131)

La media (`top`/`start`/`end`) y el pie **sangran** hasta el borde interior de la tarjeta, pero el relleno de la `GSurface` raíz es parte del **radio concéntrico** de las regiones `inset` hijas. Resolución: **`GSurface` conserva el relleno** (`padding` de la tarjeta = `padding` de la superficie, con `density`) y **publica ese valor resuelto** como propiedad pública `--g-surface-padding` (solo lectura para los descendientes; ver `surface.md`, «Cambio aparte»). Las regiones a sangre usan `margin` negativo `calc(-1 * var(--g-surface-padding))` en el lado que sangran; el cuerpo usa el relleno normal. No se elige `padding="none"` con relleno propio por región: rompería el radio concéntrico de la `inset` interna (se calcularía con relleno 0). La raíz lleva `overflow: clip` para que la media siga las esquinas redondeadas (la media a sangre toma el radio interior de la tarjeta, sin `border-radius` propio); el anillo de foco va **dentro** y los menús están en la capa superior, así que nada se recorta. Límite: contenido posicionado del consumidor que sobresalga de la tarjeta (un tooltip sin capa superior) se recorta.

## Estructura accesible

Orden del DOM = orden de lectura = orden de foco:

```html
<article class="g-card g-surface g-surface--level-outlined g-surface--padding-md g-surface--density-default g-card--orientation-auto g-card--color-brand g-card--media-top g-card--interaction-link g-card--size-medium g-card--layout-column is-interactive"
         id="ID" data-size="medium" data-layout="column">
  <div class="g-card__media" aria-hidden="true">…</div>                           <!-- slot media; top/start/end; background: primer hijo, con g-card__scrim -->
  <div class="g-card__main">
    <div class="g-card__body">
      <div class="g-card__stack">
        <div class="g-card__header">
          <span class="g-card__selectbox">                                            <!-- solo con selectable (casilla explícita) -->
            <input class="g-card__select" id="ID-input" type="checkbox" aria-labelledby="ID-title">   <!-- en select: sin aria-labelledby, el título es <label for="ID-input"> -->
            <span class="g-card__tick" aria-hidden="true"><svg class="g-icon">…</svg></span>   <!-- GIcon check (radio: circle rellena); hermano inmediato del input -->
          </span>                                                                          <!-- toggle: solo <span class="g-card__tick g-card__tick--static"> aquí mismo -->
          <span class="g-card__lead" aria-hidden="true">…</span>                      <!-- slot lead -->
          <div class="g-card__titles">
            <p class="g-card__eyebrow">…</p>
            <h3 class="g-card__title" id="ID-title" data-lines="2"><a class="g-card__primary" href="…" aria-describedby="ID-desc">Título</a></h3>
            <p class="g-card__subtitle">…</p>
          </div>
          <div class="g-card__aside">
            <span class="g-badge …">…</span>                                          <!-- badge -->
            <span class="g-card__current" aria-hidden="true">…</span>                 <!-- current -->
            <button class="g-card__menu" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Acciones de" aria-labelledby="ID-menu ID-title">…</button>
          </div>
        </div>
        <div class="g-card__content">
          <div class="g-card__media g-card__media--inline">…</div>                    <!-- mediaPosition="inline" -->
          <p class="g-card__description" id="ID-desc" data-lines="none">…</p>
          <button class="g-card__expand" type="button" aria-expanded="false" aria-controls="ID-desc">…</button>   <!-- expandable y recortada -->
          <div class="g-card__status" role="status">…</div>                           <!-- status; role="alert" si error -->
          <div class="g-card__empty">…</div>                                          <!-- empty -->
          <!-- slot default: GMetric, GProgress, GDataList, gráfico con role="img"… -->
        </div>
        <dl class="g-card__meta"><div class="g-card__meta-item"><dt>…</dt><dd>…</dd></div>…</dl>   <!-- priority low: + g-card__meta-item--low -->
        <div class="g-card__more" id="ID-more" hidden>…</div>                         <!-- slot more; plegada solo en narrow -->
        <button class="g-card__more-toggle" type="button" aria-expanded="false" aria-controls="ID-more">…</button>
      </div>
      <div class="g-card__actions">…</div>                                            <!-- slot actions -->
    </div>
    <div class="g-card__footer">…</div>                                               <!-- slot footer -->
  </div>
  <div class="g-card__live" role="status"></div>                                      <!-- oculta; existe desde el montaje -->
</article>
```

- **Título y principal:** el título es un `h2`–`h6` que **contiene** el `<a>`, el `<button>` o el `<label>` (un encabezado puede contener un control; un control no contiene un encabezado). El nombre del control es el título.
- **Enlace estirado:** el `::after` de `g-card__primary` cubre la tarjeta (`position: absolute; inset: 0`); la raíz crea el contexto de apilamiento. **Por encima del estirado** va todo control que no sea la principal, con una regla **genérica** (`a`, `button`, `input`, `select`, `textarea`, `summary`, `label`, `[tabindex]` dentro de la tarjeta, salvo `g-card__primary`) para que valga con contenido libre del consumidor. **Nada interactivo dentro de otro** (verificado por kiwi: 0 anidados). Concesión asumida: el enlace estirado **impide seleccionar texto con el puntero** en una tarjeta navegable (el brief pide el clic en toda la tarjeta).
- **Colección:** `ul > li.g-card`; el modo lista reordena visualmente (metadata antes del menú) con `order`, sin cambiar el DOM; la metadata no es interactiva.
- **Textos largos:** el recorte (`line-clamp`) no quita texto del DOM; `titleLines` y `descriptionLines` son solo visuales y llegan al CSS como **`data-lines="1|2|3|4|none"`** en `g-card__title` y `g-card__description`; `is-expanded` en la raíz anula el recorte de la descripción.
- **Indicador de selección:** un `<input>` no puede contener un icono, así que el control va en un envoltorio `g-card__selectbox` con el `<input class="g-card__select">` (real, sin `appearance` nativa) seguido **inmediatamente** de su hermano `g-card__tick` (`aria-hidden`, con `GIcon` `check` o `circle` rellena). El envoltorio es **hermano dentro de `g-card__header`, antes del título**, en los dos modos: en `select`, el título es `<label for>` del `<input>` (el control no va dentro del encabezado; además rompería el `order` del modo lista); en `selectable`, el `<input>` se nombra por el título (`aria-labelledby`). En `toggle` no hay `<input>`: el indicador `g-card__tick g-card__tick--static` también va como hermano antes del título, y su estado sale de `aria-pressed`/`is-selected` (#137; corrige lo dicho en #136).
- **Modo lista:** no hay clase propia; el CSS lo reconoce por `li.g-card.g-card--orientation-horizontal.g-surface--level-flat` (`as="li"`, `orientation="horizontal"`, `level="flat"`).

## ARIA

- **Raíz** (`article`): con **título y sin acción principal propia**, `aria-labelledby` → título. **Con acción principal** (`link`, `button`, `toggle`, `select`) **no lleva `aria-labelledby`**: el control ya da el nombre y se evita «artículo, Título … enlace, Título». Con `as="li"`, `div` o `section`, nunca `aria-labelledby` (no hay landmark). **Esta omisión es una hipótesis pendiente de verificar con lector de pantalla real** (VoiceOver, NVDA, TalkBack; kiwi §13); si falla, se vuelve a nombrar la `article`.
- **Principal:** `aria-describedby` → descripción (si existe). `aria-pressed` solo en `toggle`; **sin `aria-selected`** (no es un `option` ni un `tab`). En `select`, el `<input>` nativo aporta `checked`/`aria-checked`.
- **Disabled:** el `<a>` sin `href` con `role="link"` y `aria-disabled="true"`; los `button` y `input`, `disabled`; el botón del menú va `disabled`; **`g-card__content`, `g-card__actions`, `g-card__footer` y `g-card__more` pasan a `inert`** (sin foco ni interacción, como el cuerpo de `GWidget`); la descripción sigue enlazada por `aria-describedby` (se lee aunque esté `inert`).
- **Menú:** botón con `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`; el nombre es `labels.menu` (en `aria-label`) más el título, mediante `aria-labelledby="ID-menu ID-title"` («Acciones de Ingresos»).
- **Solo iconos en `actions`:** el consumidor pone `aria-label` (aviso en desarrollo si un `GBtn` de solo icono no lo tiene; lo verifica bruno sobre el slot). Tooltip: sin tooltip propio en v0.1 (#113); no se resuelve aquí.
- **Carga:** `aria-busy="true"` en la raíz y la región `role="status"` (`g-card__live`), que **existe desde el montaje**, anuncia `labels.loading` al empezar (y `labels.loaded` al terminar, si se da). El esqueleto es decorativo (`aria-hidden`).
- **Estados de aviso:** `role="alert"` solo cuando el `error` aparece **después de montar** (al montar con él, `role="status"`); `role="status"` para los demás.
- **Decorativos** (`aria-hidden`): `lead`, escrim, marcas, iconos, `chevron-right` de «actual», media decorativa. Media informativa: `role="img"` + nombre.
- **Región plegable (`more`):** botón `aria-expanded` + `aria-controls`; plegada = `hidden` (fuera del árbol de accesibilidad). La descripción expandible usa el mismo mecanismo.
- **Métrica:** `GMetric` conserva `role="group"` con `aria-labelledby` → título de la tarjeta (no duplica el nombre).
- **Selección sin color:** `selected` se lee por el estado nativo del control; visualmente, borde de doble grosor + indicador con icono + fondo (ver «Estados»).

## Estados

Cambian poco la superficie y **ninguno cambia el tamaño**.

| Estado | Representación | No solo color / forma |
| --- | --- | --- |
| Default | | |
| Hover | **Solo con puntero real** (`@media (hover: hover)`) y **solo si el puntero está sobre la principal** (`:hover` de la tarjeta con `:has()` no sobre una acción interna); fondo (`--g-card-hover`) y borde. **Sin `transform`.** Desaparece al pasar a una acción interna | Cambio de fondo + borde |
| Foco | Anillo **sobre toda la tarjeta** (el `::after` de `g-card__primary`, `:focus-visible`), **hacia dentro** (la raíz recorta); las acciones internas llevan el suyo | Anillo continuo, distinto de la marca de `selected` |
| Pressed | `--g-card-pressed` mientras se pulsa la principal | |
| Selected | `is-selected`; control nativo marcado o `aria-pressed="true"` | **Borde de doble grosor (`2 × --g-border-width`, regla, no token) + indicador con icono (`check` en casilla, `circle` rellena en radio) + fondo `--g-card-selected`**; distinto de hover y de foco; contorno ≥ 3:1 (#89) |
| Current | `is-current`, `aria-current="true"` | Borde + fondo + `chevron-right` |
| Disabled | `is-disabled`; atenuada | Atenuada + título tachado (exenta de contraste en WCAG 1.4.3) |
| Loading | `is-loading`, `aria-busy`, esqueleto con la anatomía declarada; sin controles enfocables | Forma de las líneas, no una caja gris |
| `status` | `g-card--status-{info\|success\|warning\|error}` y `has-status` | Icono + texto + marca de borde de inicio |
| Empty | `is-empty` | Texto |
| Con `status="error"` | `role="alert"` y, con `retryable`, «Reintentar» | Icono + texto |

La combinación `selected` + `current` + `disabled` es válida; coco decide la precedencia visual (la selección se conserva).

## Carga (esqueleto sin datos; #132)

**Decisión:** con `loading` los **datos no existen**, así que el esqueleto sale de lo que la tarjeta **declara**. Se ofrecen **ambos mecanismos**, por capas:

1. **Por defecto, derivado de las regiones declaradas:** se pintan formas para cada región que la tarjeta **tiene** como prop o slot presente (`media`, `lead`, `eyebrow`, `subtitle`, `description`, `badge`, `meta` con elementos o slot, `actions`, `footer`, `menu`), cada una con la altura de línea real. Las líneas de la descripción son `descriptionLines` (o 2 si es `none`).
2. **`skeleton` (Object):** precisa o corrige lo anterior: `{ media: Boolean, lead: Boolean, eyebrow: Boolean, subtitle: Boolean, badge: Boolean, descriptionLines: Number (0 a 6), meta: Number (filas), actions: Number, footer: Boolean, menu: Boolean }`. Un campo omitido sigue la regla 1; `false`/`0` quita la región.
3. **Slot `loading`:** sustituye **solo el cuerpo** del esqueleto (la tarjeta conserva su superficie, `aria-busy` y la región `role="status"`); recibe `{ size, layout }`. Debe ser decorativo (`aria-hidden`) y conservar el tamaño esperado.
4. **Sin ninguna de las anteriores** (tarjeta sin props ni slots declarados): forma mínima (título + dos líneas).

Con `loading` no se renderizan principal, menú, acciones ni controles enfocables (`inert` si el consumidor los dejó en slots). El esqueleto **no promete** la misma altura que la tarjeta cargada (la altura real depende de los datos): kiwi la verificó construyéndola desde las mismas props; con `skeleton` declarado con fidelidad el salto es mínimo, pero **no hay prueba con datos reales** (pendiente; ver «Verificación»). Sin animación con `prefers-reduced-motion`. **Tono del esqueleto: `--g-color-border-strong`** (#136), no `--g-color-surface-sunken` como `GWidget`: este da 1.07:1 sobre blanco (invisible) y es justo el fondo de una `inset`.

**Marcado del esqueleto:** `g-card__skeleton` sustituye a `g-card__body` (con `aria-hidden="true"`) y usa **dentro las clases reales de región** (`g-card__header`, `__meta`, `__actions`…) para conservar la colocación; cada forma es `g-card__sk` con un modificador `--eyebrow`, `--title`, `--meta`, `--footer`, `--btn` o `--circle` (sin modificador: línea de texto). El ancho de cada línea va en la variable dinámica `--_sk-w` (en línea; excepción justificada como las `--_mark-*` de `GTabs`).

## Adaptación al contenedor (un solo sistema; #130)

- **Mecanismo:** `ResizeObserver` (bruno) sobre la **propia raíz** → `data-size` y `data-layout`, con clases `g-card--size-*` y `g-card--layout-*`. Sin `@container` ni `@media` con valores fijos (una consulta de contenedor no admite `var()`; #34, #39); la familia ya mide (`GWidget` #73, `GSidebar` #69, `GStepper` #98, `GTable` #109). Sin medición (SSR), se renderiza como `medium` y `column`, y el layout se corrige al montar.

  | `data-size` | Ancho propio |
  | --- | --- |
  | `wide` | ≥ `--g-space-1 × 130` (520px con `space` 4) |
  | `medium` | ≥ `space × 80` y < `space × 130` (320px a 520px) |
  | `narrow` | < `space × 80` |

  Los umbrales derivan de `space`; **sin excepción nueva** a `tokens.md` §7. Son constantes de diseño (no tokens), como en `GStepper` y `GTable`.
- **`data-layout`:** `row` o `column` según `orientation` (ver «Reglas de props»).
- **Amplio:** media lateral (o `lead`) + contenido + acciones al final. **Intermedio:** media arriba, acciones debajo. **Estrecho:** columna simplificada; **acciones apiladas a ancho completo** (≥ 40px, 44px con `pointer: coarse`); la media lateral pasa arriba; `more` se pliega con disclosure (solo si hay `labels.more` y `labels.less`; si no, permanece visible y avisa en desarrollo).
- **Requisito:** la tarjeta debe tener un **ancho definido por su contenedor** (`inline-size: 100%`), no por su contenido; si no, medir depende de lo medido. Documentar en el README (mora-docs).
- **Rejilla:** `align-items: stretch` = alturas iguales (acciones y pie anclados al fondo); `start` = naturales. La tarjeta no conoce el número de columnas. Alinear regiones entre tarjetas con `subgrid`: **fuera de v0.1**.
- **`density`:** la prop compartida (1×, 0.875×, 0.75×). **Equivalencia con el brief** (`compact` · `comfortable` · `spacious`): `compact` = `compact`, `comfortable` = `comfortable`, **`spacious` = `default`** (#114). Cambia relleno (vía `GSurface`), separación, **tamaño de la media lateral** y la metadata de prioridad baja; **no** la semántica ni la tipografía. Objetivos ≥ 24px siempre, 44px con `pointer: coarse` (`tokens.md` §7).
- **Táctil:** objetivos ≥ 44px con `pointer: coarse`, anillo siempre visible, sin hover para nada esencial.
- **Movimiento:** solo opacidad y color (sin `transform`) con los tokens existentes (`--g-duration-press`, `--g-ease-standard`); sin tokens de duración nuevos. Con `prefers-reduced-motion: reduce`, sin transiciones ni animación del esqueleto.

## Jerarquía de superficies

Una tarjeta es **un nivel de superficie** (la raíz `GSurface`); una región `inset` dentro (`GSurface level="inset"` por slot) es el **segundo** y toma el **radio concéntrico** del relleno publicado por `GSurface`. **Máximo dos pasos de tono** (#99); un tercer nivel se aplana. **Tarjeta dentro de tarjeta dentro de tarjeta** avisa en desarrollo (la guía es una región `inset` o una lista). Una tarjeta `level="inset"` sobre una superficie hundida toma el tono contrario al padre (`surface.md`).

**Límite conocido de `surface.md` («no-inset dentro de una inset») aplicado a `GCard`:** una tarjeta `outlined`/`raised`/`flat` **dentro de una región `inset`** vuelve a publicar su tono y su radio; **se resuelve así:** la tarjeta es una **superficie nueva** (su propio fondo y borde), sus propias `inset` son de segundo nivel respecto a ella; la regla de «tercer nivel» de `GSurface` (selector de descendientes) aplana cualquier `inset` que además tenga una `inset` ascendiente. **Verificado por coco** (banco `design/lab/card/estilo-banco.html`, sección 14): la tarjeta nueva dentro de una `inset` y sus regiones se ven con el radio concéntrico correcto **sin `rounded`** del consumidor (#136).

Jerarquía visual (brief): 1 información principal (título, valor de la métrica) · 2 estado o métrica · 3 metadata · 4 auxiliar (`more`, pie) · 5 acciones secundarias. Por tamaño y peso, no por color.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href }` | `interaction="link"`: el usuario activa el enlace. Se emite con el **evento nativo**; `event.preventDefault()` (síncrono) evita la navegación y permite un router (#70). No bloquea la apertura en pestaña con modificadores |
| `activate` | `{ event }` | `interaction="button"`: el usuario activa el botón principal |
| `update:modelValue` | según `selectType`/`value` (ver «Selección») | El usuario marca o desmarca (`select`, `toggle`, `selectable`). Con `navigate` y `selectable`, la casilla **no** emite `navigate` |
| `action` | `{ id }` (y `checked`) | El usuario elige un elemento del menú (`GMenu`) |
| `retry` | `{ event }` | El usuario pulsa «Reintentar» (`status="error"` + `retryable`) |
| `expand` | `{ expanded, region }` | Se pliega o despliega la descripción (`region: 'description'`) o `more` (`region: 'more'`) |

- Todos se **declaran en `emits`**: si no, `navigate`, `activate` o un `click` del consumidor llegarían por `$attrs` a la raíz y se dispararían también con una acción interna. `click` y `keydown` nativos **no** se declaran.
- Una acción interna (menú, `actions`, controles del contenido) **no activa la principal** (probado por kiwi con el estirado).
- Una tarjeta `disabled` o `loading` no emite `navigate`, `activate` ni `update:modelValue`.

## Slots

| Slot | Propósito | Alcance | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `media` | Imagen, ilustración, vídeo, mapa, gráfico | `{ size, layout }` | Dentro de `g-card__media`; decorativa (`aria-hidden`) o informativa (`role="img"`); **sin interactivos** salvo controles propios por encima |
| `lead` | **Icono o avatar** (iniciales, imagen, icono) del consumidor (#123); para un avatar, `GAvatar size="lg"` sin `label` (#295) | `{ size, layout }` | Dentro de `g-card__lead` (`aria-hidden`); la caja mide `space × 10` y el contenido la llena (`inline-size: 100%`). **Con un hijo directo `.g-avatar`, el `lead` pierde su marco** (sin borde, relleno ni radio propios) y **no estira** al avatar: se ve una sola forma, la del avatar (`lg` = `space × 10`); el esqueleto de carga no cambia (#295, `avatar.md`) |
| `eyebrow`, `subtitle` | Texto con contenido rico | | Dentro de su `g-card__*`; sin interactivos |
| `title` | Título con contenido rico (sustituye a `title`) | | Dentro del encabezado; **conserva el texto** para el nombre; el control principal lo envuelve la tarjeta |
| `description` | Descripción con contenido rico | | Dentro de `g-card__description` |
| `badge` | Sustituye al badge | `{ state }` | Con texto (no solo color) |
| `default` | Contenido libre: `GMetric`, `GProgress`, `GDataList`, listas, gráfico con `role="img"` | `{ size, layout, state, selected }` | Dentro de `g-card__content` |
| `status` | Sustituye al icono y texto del aviso | `{ status }` | Mantiene el rol y el texto |
| `empty` | Estado vacío (icono, mensaje, acción) | `{ size }` | Sustituye a `labels.empty` |
| `meta` | Metadata con estructura propia | | `<dl>` (o equivalente semántico) |
| `more` | Región secundaria que se pliega en `narrow` | `{ size }` | Dentro de `g-card__more` |
| `actions` | Acciones: `GBtn` principal, secundarias, terciarias y solo-icono | `{ size, layout }` | Dentro de `g-card__actions`; jerarquía por `GBtn` (`variant`); **anclado al fondo** |
| `footer` | Metadata, marcas de tiempo, estado, navegación secundaria | `{ size }` | Dentro de `g-card__footer`; línea fina de separación |
| `loading` | Esqueleto propio | `{ size, layout }` | Decorativo; **conserva el tamaño** |

**Avatar:** sin slot propio (decisión del usuario, #123): va en `lead` (o `media`). Desde #293 existe **`GAvatar`** (`avatar.md`): en `lead`, `<GAvatar size="lg" … />` decorativo (el nombre ya es el título). `GCard` **no depende de él**: solo su CSS reconoce la clase `.g-avatar` para quitar el marco del `lead` (#295).

## Textos (`labels`, sin valores por defecto)

Sin valor por defecto (Grana es internacional, como `GWidget`, `GStepper` y `GTabs`). Los requeridos avisan una vez en desarrollo.

| Clave | Uso | Requerido |
| --- | --- | --- |
| `menu` | Prefijo del nombre del botón de menú («Acciones de») | Sí, con `menu` |
| `loading` | Anuncio al empezar a cargar | Sí, con `loading` |
| `loaded` | Anuncio al terminar de cargar | No |
| `expand`, `collapse` | «Mostrar más» y «Mostrar menos» de la descripción | Sí, con `expandable` |
| `more`, `less` | «Más detalles» y «Menos detalles» (región `more` en `narrow`) | Sí, con el slot `more` |
| `retry` | «Reintentar» | Sí, con `retryable` |
| `empty` | Mensaje del estado vacío si no hay slot `empty` | Sí, con `empty` sin slot |

## Teclado

| Contexto | Teclas |
| --- | --- |
| Tarjeta `link` o `button` | **Tab** entra en el título (el anillo cubre la tarjeta); **Enter** activa el enlace, **Enter** o **Espacio** el botón |
| Tarjeta con varias acciones | Orden del **DOM**: [casilla] → título → menú → acciones (principal, secundarias, solo-icono) → controles del contenido → enlace del pie |
| `select` (checkbox) | **Espacio** marca/desmarca (nativo) |
| `select` (radio) | **Tab** entra en el seleccionado del grupo; **flechas** mueven la selección (nativo, con el `name` común); en RTL invertidas por el navegador |
| `toggle` | **Enter** o **Espacio** alternan `aria-pressed` |
| Menú de acciones | Como `GMenu`: **Enter/Espacio/↓** abren (primero), **↑** abre (último); ↑/↓/Inicio/Fin con vuelta; deshabilitados enfocables; **Esc** cierra, devuelve el foco al botón y **no llega** a un ancestro (un `GDialog`); **Tab** cierra |
| «Mostrar más», «Más detalles», «Reintentar» | Botones: **Enter** o **Espacio** |
| Lista de tarjetas | Sin *roving tabindex*: es una lista de enlaces; Tab recorre título → menú de cada fila |

Una acción interna con foco **no** activa la principal; Enter en el título **no** abre el menú.

## Tokens consumidos

Existentes: `--g-color-{primary|accent|neutral}[-soft|-text]`, `--g-color-on-primary[-soft]`, `--g-color-{info|success|warning|danger}[-soft|-text]`, `--g-color-surface`, `--g-color-surface-sunken`, `--g-surface-{shell|inset|gap}`, `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle`, `--g-color-border`, `--g-color-border-strong`, `--g-color-border-control`, `--g-color-focus`, `--g-radius-{none|xs|sm|md|lg|xl|pill}`, `--g-radius-shape`, `--g-shadow-1`, `--g-space-1..8`, `--g-font-ui`, `--g-text-{caption|body-sm|body|title-sm|title|title-lg}-{size|line|tracking|weight}`, `--g-text-action-weight`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset`, `--g-duration-{fast|press}`, `--g-ease-{standard|out}`. De `GSurface`, `GMenu`, `GBadge` y `GBtn` se heredan los suyos.

**Tokens nuevos** (nombrados y registrados en `docs/contract/tokens.md` §19; los **valores** los fija coco en `defaults.css`; #134):

| Token | Para qué |
| --- | --- |
| `--g-card-hover` | Fondo en hover de una tarjeta interactiva: un paso de tono **relativo a la superficie anfitriona** (patrón de `--g-tabs-*`, #120) |
| `--g-card-pressed` | Fondo mientras se pulsa: un paso más fuerte que el hover |
| `--g-card-selected` | Fondo de la tarjeta seleccionada o «actual»: relativo a la anfitriona; con borde y marca, nunca solo fondo |
| `--g-card-scrim` | **Velo** sobre la media de fondo (`mediaPosition="background"`); con `--g-card-on-scrim`, el texto cumple ≥ 4.5:1 sobre el peor caso del velo |
| `--g-card-on-scrim` | Color del texto y los iconos sobre el velo |

Del hallazgo 10 de kiwi **no** son tokens (reglas o alias locales `--_*`; `tokens.md` §17.6): grosor doble del borde de selected (`2 × --g-border-width`, borde de la raíz + anillo interior, sin cambiar el tamaño), anillo de foco **hacia dentro** (`outline-offset` negativo de `max(--g-focus-width, --g-focus-offset)`), línea del pie (`--g-color-border`: **separador decorativo**, no exige 3:1; con `prefers-contrast: more` sube a `--g-color-border-control`; #136), tono del esqueleto (`--g-color-border-strong`, #136) y **ancho de la media lateral** (derivado de `space` y `density`: propuesta `space × 40`, 160px a `default`; lo fija coco como alias). Derivaciones propuestas para coco: caja de `lead` = `space × 10`; separación entre regiones = relleno de la superficie × 0.75.

**Propiedad pública que consume y no declara:** `--g-surface-padding` (declarada por `GSurface.css`, ver `surface.md` y `tokens.md` §19; `levels.test.js` debe aceptar que un componente lea una propiedad declarada por la superficie que compone).

## Clases (contrato entre bruno y coco)

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-card` (con las de `g-surface`) | Raíz | Siempre (la raíz es una `GSurface`: `g-surface--level-*`, `--padding-*`, `--density-*`, `--rounded-*`) |
| `g-card--orientation-{vertical\|horizontal\|auto}` | Raíz | Siempre |
| `g-card--color-{brand\|accent\|neutral}` | Raíz | Siempre |
| `g-card--media-{top\|start\|end\|background\|inline}` | Raíz | Con slot `media` |
| `g-card--interaction-{none\|link\|button\|toggle\|select}` | Raíz | Siempre (la **efectiva**, tras `auto`) |
| `g-card--size-{wide\|medium\|narrow}` y `g-card--layout-{row\|column}` | Raíz | Siempre: **las clases y además** `data-size`/`data-layout` (el CSS lee ambas formas) |
| `g-card--status-{info\|success\|warning\|error}` | Raíz | Con `status` |
| `is-interactive`, `is-selected`, `is-current`, `is-disabled`, `is-loading`, `is-empty`, `has-status` | Raíz | Estado |
| `is-expanded` | **Raíz** | Descripción desplegada (anula `data-lines`) |
| `g-card__media`, `__media--inline`, `__scrim`, `__main`, `__body`, `__stack`, `__header`, `__lead`, `__titles`, `__eyebrow`, `__title`, `__primary`, `__subtitle`, `__aside`, `__current`, `__menu`, `__select`, `__content`, `__description`, `__expand`, `__status`, `__empty`, `__meta`, `__more`, `__more-toggle`, `__actions`, `__footer`, `__skeleton`, `__live` | Partes | Según prop o slot |
| `g-card__meta-item` (+ `--low`) | Elemento de `meta` (envuelve `dt` + `dd`) | Siempre; `--low` con `priority: 'low'` |
| `g-card__selectbox`, `g-card__tick`, `g-card__tick--static` | Indicador de selección, **hermano en `g-card__header` antes del título** | `select` y `selectable` (envoltorio + `input` + `tick` hermano); `--static` en `toggle` (sin `input`) |
| `data-lines="1\|2\|3\|4\|none"` | `g-card__title`, `g-card__description` | Siempre (de `titleLines` y `descriptionLines`) |
| `g-card__skeleton`, `g-card__sk`, `g-card__sk--{eyebrow\|title\|meta\|footer\|btn\|circle}` | Esqueleto | Con `loading` (ancho por `--_sk-w`) |
| Modo lista | `li.g-card.g-card--orientation-horizontal.g-surface--level-flat` | Sin clase propia |

Una `GBadge`, `GMenu` o `GBtn` interna lleva sus propias clases; no existe `g-card__badge`. `GIcon` es **hijo directo** de `g-card__current`, `g-card__menu`, `g-card__status`, `g-card__tick` y `g-card__empty`.

## Iconos (solo Lucide, vía `GIcon`; #134)

En `icons.md` §4 (ya en la librería, `packages/vue/scripts/icons.json`, #137): `check` (casilla y alternar), `circle` rellena (radio), `ellipsis-vertical` (menú), `circle-alert` (`error`), `triangle-alert` (`warning`), `circle-check` (`success`), `info` (`info`), `chevron-right` (marca de «actual») y `chevron-down` (botones «mostrar más»). Los de `media`, `lead` y las acciones son de la aplicación (`icons.md` §5; en la documentación, `image`, `play`, `map-pin`). Sin glifos ni pictogramas dibujados con CSS.

## Avisos de desarrollo

`typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'` (nunca `import.meta.env.DEV`), una vez cada uno: sin título ni `aria-label`/`aria-labelledby` (excepto con `loading`); `interaction="link"` sin `href`; `href` con `interaction` distinto de `link`/`auto` (navegar y seleccionar son excluyentes); `selectable` con `interaction` `select` o `toggle`; `current` sin enlace; `selectType="radio"` sin `name`; `status` sin `statusText`; `labels.*` requerido ausente (`menu`, `loading`, `expand`/`collapse`, `more`/`less`, `retry`, `empty`); `GBtn` de solo icono sin `aria-label` en `actions`; `as` interactivo; tarjeta dentro de tarjeta dentro de tarjeta; `meta` con elementos sin `label` o `value`; `mediaPosition` `start`/`end` con `orientation="vertical"` (se pinta arriba); un valor de enum fuera de lista (validadores); `skeleton` con claves desconocidas.

## Resolución de hallazgos de kiwi (r01, §11)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | Relleno de `GSurface` y regiones a sangre | **`GSurface` conserva el relleno y lo publica** como `--g-surface-padding` (propiedad pública de solo lectura); las regiones a sangre usan margen negativo derivado de ella; `GCard` **no** usa `padding="none"`. Cambio aparte en `surface.md` (coco, bruno). Límite «no-inset en inset»: ver «Jerarquía de superficies» | #99; el relleno es parte del radio concéntrico |
| 2 | Entrega y nombres | Tabla de props; `level` sin `floating`; `padding` sin `none`; `status` con `statusText`; `retryable` aparte; **`color` añadida** (marca de selección) | `api.md`; `widget.md`; `tabs.md` |
| 3 | Acción principal y selección | **`interaction`** (`auto` `none` `link` `button` `toggle` `select`), `href`/`target`/`rel`, `current`, `modelValue`/`value`/`name`/`selectType` como el nativo, **`selectable`** (casilla explícita, en lugar de `selectable="corner"`); exclusión por diseño y por aviso; **sin `to`** | #70, #36, #133 |
| 4 | Slots | Los listados; **`lead` único** para icono y avatar (sin slot `avatar`; #123); `title` conserva el texto; alcance `{ size, layout, … }` | #123; `widget.md` |
| 5 | Eventos | `navigate` `{ event, href }`, `activate`, `update:modelValue`, `action`, `retry`, `expand` `{ expanded, region }`; todos en `emits` | #70; `btn.md` (`click` en `emits`) |
| 6 | Medición | `data-size` y `data-layout`, clases `--size-*`/`--layout-*`; `space × 130` y `space × 80`; sin excepción nueva; sin `@container` | #130; #34, #39, #98 |
| 7 | Textos | `labels`: `menu`, `loading`, `loaded`, `expand`, `collapse`, `more`, `less`, `retry`, `empty`, sin valores; avisos | #97, #121 |
| 8 | Esqueleto sin datos | **`skeleton` (Object) más slot `loading`**, con derivación de las regiones declaradas por defecto y forma mínima si no hay nada (#132) | Brief («respeta la anatomía»); sin datos reales la forma sale de lo declarado |
| 9 | Iconos | Lista en `icons.md` §4; **`info` falta en `lucide-icons.js` y en el script**; `chevron-down` añadido | #85 a #87 |
| 10 | Tokens | `--g-card-{hover\|pressed\|selected\|scrim\|on-scrim}` (relativos a la anfitriona o de la media); el resto, reglas o alias `--_*` | `tokens.md` §17.6; #120 |
| 11 | `overflow` y esquinas | Raíz con `overflow: clip`, media con el radio interior de la raíz, anillo de foco **dentro**, menú en capa superior | Probado en el prototipo (`popover`) |
| 12 | Subgrid | **Diferido** (la tarjeta no asume la rejilla) | Hallazgo de baja severidad |
| 13 | Selección de grupo | Radios con `name` común y `role="radiogroup"` del **consumidor**; **`GCardGroup` diferido** (#124) | Decisión del usuario |
| 14 | `GWidget` | Independiente; frontera documentada aquí y en `widget.md` (#125) | Decisión del usuario |
| 15 | Contraste y forma | Para coco: marca de `selected`, anillo de foco y casilla ≥ 3:1 (la **línea del pie es decorativa**: `--g-color-border`, sin 3:1, #136); texto ≥ 4.5:1 sobre el velo; `forced-colors`; `prefers-contrast`; el hover no basta como único cambio de la selección | #89 |

## Verificación (qué y cómo)

- **bruno** (pruebas): una sola `GSurface` raíz con las clases de `GCard`; orden del DOM y de foco (casilla → título → menú → acciones → controles → pie); `interaction` en sus seis valores (el elemento correcto en el título; `auto` con y sin `href`); `navigate` cancelable (`preventDefault` evita la navegación; los modificadores no se bloquean); acciones internas **no** activan la principal; clic en la casilla explícita no navega; `disabled` (`<a>` sin `href`, `role="link"`, `aria-disabled`); `selectType` checkbox (Boolean y Array con `value`) y radio (`modelValue === value`, flechas nativas, grupo con `name`); `aria-pressed` en `toggle`, sin `aria-selected`; `aria-labelledby` solo en `article` sin principal; `aria-describedby`; menú (`GMenu`, nombre `labels.menu` + título, `action`, Esc sin llegar al ancestro); `status` (`role` por valor, `statusText` obligatorio), `retry`; `expandable` solo con recorte real y `aria-expanded`; `meta` y `priority` en `compact`; `more` plegable solo en `narrow`; `loading` (`aria-busy`, región `role="status"` presente desde el montaje, sin controles, esqueleto derivado y con `skeleton`/slot); `data-size`/`data-layout` con `ResizeObserver` (con el mismo visor, tarjeta de `sidebar` `narrow` y del área principal `wide`; dentro de `GDialog` de 360 y 680px); `orientation` en los tres valores; todos los eventos en `emits`; **avisos de desarrollo** de la lista; lectura de `--g-surface-padding` (la prueba de niveles la acepta).
- **coco** (auditoría con tema distinto al de defecto): hover solo sobre la principal; anillo hacia dentro con 3:1; selected (borde doble + indicador + fondo) distinto de hover/foco/current; `inset` sobre plano, `surface` y hundida; claro y oscuro; `forced-colors`; `prefers-contrast`; movimiento reducido; táctil 44px; contraste sobre el velo; esqueleto con `inset`; radio concéntrico de una región `inset` interna; una `inset` interna con una `inset` ascendiente; RTL; `overflow: clip` con el menú abierto.
- **No verificado por kiwi y pendiente:** **lector de pantalla real** (el nombre del `article` sin `aria-labelledby` y el título-enlace son una hipótesis; `aria-busy`, `role="status"` y `role="alert"`); Firefox y WebKit (`:has()`, `line-clamp`, `popover`, `overflow: clip`; Playwright cubre lo automatizable, #108); táctil real (pulsación larga sobre el enlace estirado) y zoom 200%; `forced-colors` real; **esqueleto con datos ausentes reales**; selección y copia de texto con el enlace estirado; rendimiento con cientos de tarjetas (un `ResizeObserver` por tarjeta: ¿uno compartido?); rejilla con contenido muy desigual; menú dentro de un `GDialog` (Esc cierra solo el menú); cambio en caliente de `orientation`/`density`/`level` con el menú abierto.

## Fuera de v0.1 (diferido, no abierto al usuario)

- **`GCardGroup`** (`v-model`, mínimo/máximo, casilla maestra): decisión del usuario (#124); mientras tanto, radios con `name` y `role="radiogroup"` del consumidor y `modelValue` por tarjeta.
- **Menú contextual de clic derecho**, **`subgrid`**, tooltip de solo iconos (#113), tipos de celda y de contenido dentro de la tarjeta.
- **Migrar `GWidget` sobre `GCard`:** se evaluará cuando `GCard` esté verificada (#125).
- **Preguntas de producto abiertas: ninguna.**
