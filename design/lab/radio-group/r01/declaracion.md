# Declaración de cumplimiento · GRadioGroup · r01

**Estado:** en revisión. Fuente de verdad: `brief.md` de esta ronda.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises, iconos solo Lucide (`design/lab/lucide-icons.js`).
**Siguiente dueño:** lima → `design/contracts/radio-group.md` (y las líneas de `form.md` que esta ronda toca, §13).
**Prototipo:** `index.html` (6 secciones; una sola fábrica `rg()` genera todos los grupos con las reglas de esta declaración; motor de fila de `form/r02`). **Verificación:** `verificar.mjs` (Playwright, Chromium, Firefox y WebKit: **596/596**).
**Complejidad (CLAUDE.md, «Modelos por rol»):** se solapa con `GCard selectType="radio"`, `GCheckboxGroup` y `GTabs segmented` → **componente complejo: coco y bruno en Opus**.
**Convención:** «propuesta kiwi» = recomendación que se asume si nadie la objeta. Grises, grosores, separaciones y radios del prototipo son de wireframe, **no** propuestas.

## 0. Solapes revisados antes de proponer

| Ya existe | Qué hace | Relación con `GRadioGroup` |
| --- | --- | --- |
| `GCheckboxGroup` + `GCheckbox` | Varias respuestas; `fieldset`/`legend`, `useFormField`, `layout` `default`/`card`/`chip`, `readonly` con `aria-readonly` y bloqueo | **Hermano**: misma anatomía de grupo (leyenda · opciones · pie con ayuda y región de mensaje), mismas marcas y mismo solo lectura. Diferencias: una respuesta, una parada de Tab, flechas, `options` en vez de hijas (§11) |
| `GSelect` | Una respuesta en lista emergente; `options` `{ value, label, … }`; `aria-required` en el control | **Misma forma de `options`** y mismo `aria-required`. Regla de uso: 2 a ~6 opciones que conviene **ver** a la vez → `GRadioGroup`; muchas, o poco espacio → `GSelect` |
| `GCard selectType="radio"` (#124, #133) | Tarjeta de **contenido** (media, métricas, acciones, menú) que además se puede elegir; el grupo lo pone el consumidor | **No se compone ni se duplica.** `cards` de `GRadioGroup` es una **opción de formulario** con forma de tarjeta (indicador, icono, etiqueta, descripción): sin superficie `GSurface`, sin acciones, sin media. Si cada opción es una entidad con contenido propio o acciones → `GCard` (y `GCardGroup` sigue diferido, #124) |
| `GTabs appearance="segmented"` (#112) | **Navegación** entre paneles: `tablist`/`tab`, pista tonal con segmento elevado que se desliza | **No se confunde** (§6 del prototipo): el segmentado de radios es una **respuesta** (`radiogroup`, `FormData`, etiqueta, error); aspecto de **caja de control** como sus vecinos, elegida **rellena**, sin pista ni deslizamiento (§8). Guía: cambiar lo que se ve = `GTabs`; responder = `GRadioGroup` |
| `GMenu` (elementos `radio`, `menuitemradio`) | Elegir un modo **dentro de un menú** de órdenes | Sin relación: otro patrón APG |
| `GWidgetGallery` (radios crudos de categoría) | Filtro fuera de un formulario | Se queda como está (fuera de alcance) |
| `form/r02` (segmentado de wireframe) | Primer boceto del segmentado en fila | **Sustituido**: tenía `text-overflow: ellipsis`; aquí las etiquetas **no se recortan** (#176) y el segmentado se apila (§7) |

## 1. Decisiones estructurales

| # | Pregunta | Decisión | Fundamento |
| --- | --- | --- | --- |
| 1.1 | ¿Qué control? | **`<input type="radio">` nativo** en todas las apariencias, con **`name` común** por grupo. El teclado, el estado y el envío son los del navegador; **sin manejadores de teclado propios** salvo el bloqueo de solo lectura (§5) | Encargo; #124 («el nativo ya da estado, formulario y flechas»); APG *Radio Group* admite radios nativos |
| 1.2 | ¿Dos raíces? | Por apariencia, **no por contexto**: **`inline` y `segmented`** = campo de **tres hijos** (`<div role="radiogroup" aria-labelledby>` · etiqueta `<span>` · caja de opciones · pie). **`list`, `chips` y `cards`** = **`<fieldset role="radiogroup" aria-labelledby>`** con `<legend>`. La raíz no cambia según dónde esté el componente (sin saltos de marcado, igual en SSR) | #181 (segmentado con `radiogroup` y tres hijos; los demás con `fieldset`); un `<legend>` renderizado no participa en la rejilla (`form.md` §4). **`inline` se suma al segmentado** (ver 1.3) |
| 1.3 | ¿`inline` comparte línea? | **Sí**, con la misma estructura que `segmented`. Es la forma natural de un Sí/No junto a otros campos («¿Fuma? Sí · No» · Cigarros al día · Desde). `list`, `chips` y `cards` van **siempre en su propia fila** | **Amplía #181, no lo contradice:** su porqué era que el `fieldset` no puede tomar las pistas; `inline` no se había analizado (r02 solo tenía el segmentado) y es igual de bajo que una caja. Verificado: cajas de una línea con el mismo `top` (±1px) a 6 anchos × 2 estados × 3 motores. **lima lo registra** (hallazgo L3) |
| 1.4 | ¿Rol del `fieldset`? | **`role="radiogroup"`** sobre el `fieldset` (permitido por *ARIA in HTML*), con **`aria-labelledby`** a la `<legend>` | ARIA 1.2: `aria-required`, `aria-invalid` y `aria-readonly` se admiten en `radiogroup`, **no** en `group` ni en `radio` (en `radio`, `aria-invalid` como global está desaprobado). Con el rol, **las cinco apariencias exponen lo mismo**. El `fieldset` conserva lo nativo (`disabled` en cascada, `<legend>`). Chromium toma el nombre de la `<legend>` incluso sin `aria-labelledby` (medido); `aria-labelledby` lo asegura en los demás motores |
| 1.5 | ¿Dónde va `required`? | **`aria-required="true"` en el `radiogroup`**; **nunca `required` nativo** en los radios. Marca visible según la convención (C3): asterisco `aria-hidden` o «(opcional)» en el nombre | **Medido en Chromium:** un radio (y una casilla) con `required` nativo y sin elegir se expone como **`invalid=true` desde el primer momento**, aunque el `<form>` tenga `novalidate`: el lector diría «no válido» antes de que la persona haga nada, contra «castigar tarde» (#157). `GForm` no usa la validación nativa (`novalidate`); `GSelect` ya usa `aria-required` (precedente) |
| 1.6 | ¿Dónde va `aria-invalid`? | **En el `radiogroup`** solo mientras hay error **visible**; **nunca en cada radio**. El mensaje (icono + prefijo oculto + texto) en el pie y en `aria-describedby` del grupo | ARIA 1.2 (1.4). Igual que `GCheckboxGroup` (el error es del grupo, en su `aria-describedby`). Medido: Chromium expone `invalid` en el grupo |
| 1.7 | ¿Nombre de cada radio? | **Solo la etiqueta de la opción** (`aria-labelledby` → `__option-label`). La **descripción** va por `aria-describedby`. El icono, `aria-hidden` | Precedente `GCheckbox layout="card"` (`aria-labelledby` + `aria-describedby`); un nombre corto se anuncia y se busca mejor (2.5.3, 4.1.2). Medido en Chromium: «En línea», descripción «Videollamada; …» |
| 1.8 | ¿Objetivo de clic? | **La opción entera** (`<label>`): en `list`/`inline` la fila (indicador + texto + descripción); en `chips`, `cards` y `segmented` la píldora, la tarjeta o el segmento. **Nada interactivo dentro** de una opción | Como `GCheckbox`; 2.5.8 |
| 1.9 | ¿Sin `name`? | Se **genera** uno (los radios necesitan nombre común para agruparse y para las flechas). Con `name`, es la clave en `errors` de `GForm` y en `FormData` | HTML: el grupo de radios lo define el `name` dentro del mismo dueño de formulario |
| 1.10 | ¿Valor en `FormData`? | `value` del `<input>` = **`String(option.value)`**; `v-model` conserva el tipo original (número, booleano) | HTML solo envía cadenas; `GSelect` hace lo mismo con su oculto |
| 1.11 | ¿Se puede deseleccionar? | **No** (nativo y APG). Si «ninguna» es una respuesta válida, es **una opción más** («No sé», «Prefiero no decirlo») | APG *Radio Group*; WCAG 3.3.2 (la respuesta neutra visible) |

## 2. Anatomía

### Común a las cinco apariencias (tres partes)

| Parte | `inline`, `segmented` | `list`, `chips`, `cards` | Nota |
| --- | --- | --- | --- |
| Raíz | `<div role="radiogroup" aria-labelledby="ID-label" [aria-describedby] [aria-required] [aria-invalid] [aria-readonly]>` | `<fieldset role="radiogroup" aria-labelledby="ID-label" …>` (+ `disabled` nativo) | Clases `is-invalid`, `is-warning`, `is-valid`, `is-readonly`, `is-disabled` |
| Etiqueta | `<span class="…__label" id="ID-label">` (pista 1, apoyada abajo) | `<legend class="…__label" id="ID-label">` | Marca: asterisco `aria-hidden` o `…__optional` dentro (C3). Nunca recortada |
| Opciones | `<div class="…__options">` (pista 2: **la caja**) | `<div class="…__options">` | Una `<label class="…__option">` por opción |
| Pie | `<div class="…__support">` (pista 3) | `<div class="…__support">` | Ayuda `…__hint` (`ID-hint`) + región `…__message` (`ID-message`, siempre presente, `aria-live` del contexto, C4) |

### Una opción

```html
<label class="…__option [is-disabled]" for="ID-0">
  <input class="…__input" type="radio" id="ID-0" name="N" value="v" aria-labelledby="ID-0-label" [aria-describedby="ID-0-desc"] [checked] [disabled]>
  <span class="…__icon" aria-hidden="true"><svg class="g-icon">…</svg></span>          <!-- solo con icon -->
  <span class="…__text">
    <span class="…__option-label" id="ID-0-label" dir="auto">Presencial</span>         <!-- en solo icono: texto oculto accesible -->
    <span class="…__description" id="ID-0-desc">En el consultorio de Reforma 120.</span>  <!-- solo list y cards -->
  </span>
</label>
```

- **Indicador:** en `list`, `inline` y `cards` el **propio `<input>` dibujado** (círculo, como el cuadro de `GCheckbox`); en `chips` y `segmented` el `<input>` **cubre** la opción con opacidad 0 (nunca `display: none`; precedente del chip de `GCheckbox`) y el estado lo dice el relleno.
- **`dir="auto"`** en la etiqueta de la opción: «A+» dentro de una página RTL se leía «+A» (visto en el prototipo); con aislamiento bidi toma su propia dirección.
- **Segmentado:** icono y etiqueta en un bloque que **no se parte** mientras está en una línea (se mide para su ancho natural, §7).

### Qué admite cada apariencia

| | `list` | `inline` | `segmented` | `chips` | `cards` |
| --- | --- | --- | --- | --- | --- |
| Raíz | `fieldset` | `div` | `div` | `fieldset` | `fieldset` |
| En una `GFormRow` con más hijos | No | **Sí** | **Sí** | No | No |
| Indicador | círculo | círculo | relleno | relleno | círculo + borde |
| Descripción por opción | Sí | No (aviso) | No (aviso) | No (aviso) | Sí |
| Icono por opción | Sí | Sí | Sí | Sí | Sí |
| Solo icono | No | No | **Sí** | **Sí** | No |
| Opciones (guía) | 2 a ~7 | 2 a ~4 cortas | **2 a 6** (aviso fuera de rango, como `GTabs`) | muchas cortas | 2 a ~6 |
| Disposición | columna | fila que envuelve | una línea; si no cabe, **se apila** | fila que envuelve | rejilla; una columna en estrecho |

## 3. Teclado (nativo; medido en los tres motores)

| Tecla | Comportamiento | Chromium | Firefox | WebKit |
| --- | --- | --- | --- | --- |
| Tab | Entra **una vez** en la elegida; sin elegida, en la **primera**; Tab siguiente sale del grupo | Sí | Sí | **No llega a los radios** con la preferencia por defecto de macOS (en Safari real, con «Acceso total por teclado» u Opción+Tab) |
| Shift+Tab sin elegida | Entra en la **última** (Chromium) o en la **primera** (Firefox) | última | primera | — |
| Flechas | Mueven el foco **y eligen**; saltan las deshabilitadas | Sí, **envuelven** | Sí, **envuelven** | Sí, **no envuelven** |
| Flechas en RTL | Siguen la **dirección visual** | Sí | Sí | **No**: ←/→ siguen el DOM |
| Espacio | Elige la enfocada si no lo estaba | Sí | Sí | Sí |
| Enter | Envía el formulario (nativo) | — | — | — |

**Decisión: no se normalizan las diferencias de WebKit.** Es el comportamiento de **todos** los radios de esa plataforma (la persona lo encuentra igual en cualquier formulario de Safari), ninguna incumple WCAG (2.1.1 se cumple: todo es operable con teclado) y normalizar exigiría reimplementar el teclado de los radios en todos los motores, contra 1.1. Queda como **hallazgo L9** por si lima prefiere lo contrario.

## 4. Estados

| Estado | Semántica | Comportamiento | Señal no cromática (wireframe; el aspecto es de coco) |
| --- | --- | --- | --- |
| Por defecto | `radiogroup` con nombre; radios con nombre | — | — |
| Hover (`hover: hover`) | — | Solo opciones habilitadas y editables | Borde del círculo o fondo de la opción |
| Foco visible | — | Un anillo **por opción**: en `list`/`inline` en el **indicador**; en `chips`/`cards` **alrededor** de la opción; en `segmented` **dentro** del segmento (no lo tapa el vecino ni lo recorta la caja) | Anillo ≥ 3:1 (coco), 2.4.7, 2.4.11 |
| Elegida | `checked` nativo | Una por grupo | Punto en el círculo; relleno en segmento y chip; borde doble + punto en tarjeta |
| Sin selección | Ningún `checked`; el grupo **no aparece** en `FormData` | Tab entra en la primera; Espacio la elige | — |
| Deshabilitada (opción) | `disabled` en ese radio | Las flechas la saltan; fuera del envío | Opacidad + borde punteado |
| Deshabilitado (grupo) | `fieldset disabled` o `disabled` en cada radio (`div`) | Fuera del Tab y de `FormData` | Ídem en todo el grupo |
| **Solo lectura** | **`aria-readonly="true"` en el `radiogroup`**; radios **habilitados** | **Enfocable** (Tab entra en la elegida), **legible** (todas las opciones visibles, la elegida marcada), **dentro de `FormData`**; flechas (`keydown` cancelado), Espacio y clic (`click` cancelado, también el de la etiqueta) **no cambian nada** | Borde **discontinuo**, contraste completo, cursor normal (C7) |
| Error | `aria-invalid="true"` en el grupo; `ID-message` en su `aria-describedby` | Revelado con el momento de `GForm` (`trigger: 'change'`, como `GCheckboxGroup`) | Icono `circle-alert` + prefijo oculto + texto; el segmentado, además, caja como la de un campo inválido |
| Advertencia / válido | Sin `aria-invalid` | No bloquean (C5) | `triangle-alert` / `circle-check` + prefijo |
| Obligatorio / opcional | `aria-required` en el grupo / «(opcional)» en el nombre del grupo | — | Asterisco `aria-hidden` / texto |
| `forced-colors` | — | — | Elegida con `SelectedItem`/`SelectedItemText`; tarjeta con borde más grueso; marco del segmentado con `outline` (no `box-shadow`, que desaparece) |
| `prefers-reduced-motion` | — | Sin transición | — |

**Reglas que salen de lo medido:**

- **La opción elegida no puede estar deshabilitada.** Medido en Chromium y Firefox: con la elegida deshabilitada, Tab entra en la primera habilitada, **una flecha elige otra y la elegida se pierde**, y la deshabilitada **no se envía**. Aviso en desarrollo; si el valor no se puede cambiar, el grupo es `readonly`.
- **Solo lectura es el bloqueo de #266.** Dentro de `GForm readonly` el grupo hereda `readonly` (C1), **nunca** `disabled`; sin marca (regla de §2: solo campos editables).
- **Destino del foco** de `GErrorSummary` y del primer inválido: el radio por el que Tab entraría (la elegida o la primera habilitada).

## 5. Solo lectura: mecanismo

Los radios no admiten `readonly`. Como `GCheckbox` (`checkbox.md`, hallazgo 4), con dos diferencias medidas:

1. Chromium y Firefox **disparan `click`** al moverse con flechas (medido); cancelar el `click` evita el cambio pero **deja el foco en otra opción sin elegir**. Por eso se cancela también el **`keydown`** de las cuatro flechas: el foco se queda en la elegida.
2. `aria-readonly` va en el **`radiogroup`** (en `radio` no lo admite ARIA 1.2). Chromium no lo muestra en su árbol de CDP (tampoco el de una casilla con `aria-readonly`, precedente vigente): se verifica en lector real (§15).

## 6. En una `GFormRow` (tres pistas)

- `inline` y `segmented`: etiqueta en la pista 1 (apoyada abajo), opciones en la **pista de la caja**, pie en la 3. Con `subgrid`, igual que `GInput` (C12).
- **La caja del segmentado mide lo mismo que la de sus vecinos** (`min-block-size` de la caja de un campo del mismo `size`): su marco va **hacia dentro** (en el prototipo, `outline` con desplazamiento negativo) para que cada segmento ocupe el alto entero (≥ 24px; ≥ 44px táctil; medido 44 = 44 junto a la caja de la fecha). La caja de `inline` tiene el mismo alto mínimo y centra sus opciones: el texto de «Sí · No» queda a la altura del texto de las cajas vecinas.
- **Mínimo natural del segmentado** (hallazgo L4): el ancho con todas las opciones en una línea e **iguales al ancho de la más larga**. La fila lo usa como mínimo efectivo (el mayor entre el de su `g-form-w-*`, `--g-form-min` y el natural): **la fila se parte en líneas antes de que el segmentado se apile**. Medido: a 480px «Sexo» pasa a su propia línea y cabe sin apilarse.
- `list`, `chips` y `cards` en una fila con más hijos: aviso 3 de `GFormRow` («va en su propia fila»), como `GCheckboxGroup`.

## 7. Contenedores estrechos

| Apariencia | Si no cabe | Por qué |
| --- | --- | --- |
| `segmented` | **Se apila**: una opción por línea, **misma caja, mismo orden**, flechas iguales. Se decide por **su ancho propio** (medido), no por el visor | Envolver en una rejilla de 2×2 crea un orden en dos dimensiones ambiguo (y en RTL); el **scroll** de `GTabs` esconde respuestas de una pregunta (1.4.10, 3.3.2); recortar está prohibido (#176); **pasar a `list`** cambiaría la forma de golpe y movería el indicador. Medido: «Lado dominante» (4 opciones) se apila a 320; «Sexo» (3) cabe en 288px |
| `inline` | Envuelve (fila que salta) | Orden de lectura conservado |
| `chips` | Envuelve | Ídem |
| `cards` | Una columna (rejilla `auto-fill` con mínimo) | Una tarjeta no se estrecha por debajo de su lectura |
| `list` | — (ya es una columna); el texto se parte | — |

Ningún texto se recorta: medido `scrollWidth ≤ clientWidth` en etiquetas, opciones y descripciones a 1280/960/720/480/360/320, limpio y con mensajes, en los tres motores.

## 8. Movimiento

**Sin indicador que se desliza.** La elegida **se rellena en su sitio** (transición de color/fondo corta; el punto del círculo crece desde el centro). Con `prefers-reduced-motion: reduce`, sin transición (medido: `0s`).

Por qué no la marca de `GTabs`: (1) es lo que **distingue** visualmente una respuesta de una navegación; (2) un indicador que viaja necesita medir posiciones y recalcularlas al apilar, al envolver y en RTL (en apilado el viaje sería vertical, en `chips` diagonal); (3) la respuesta debe verse **en el acto**, no al final de una animación. Coco elige duración y curva con los tokens vigentes (`--g-duration-press`).

## 9. Solo icono

Solo en `segmented` y `chips`. El texto de la opción **no sale del DOM** (texto oculto accesible) y es el nombre del radio (medido: «Lista», «Tabla», «Gráfica»). **Sin tooltip propio** (como `GTabs`, #113): el modo solo icono es para iconos **inequívocos** (formato, alineación, vista); en una pregunta de formulario se prefiere texto. Todas las opciones del grupo con icono o ninguna (aviso).

## 10. RTL

Automático: flex y propiedades lógicas; la primera opción queda a la derecha (medido). Flechas: §3. Etiquetas con `dir="auto"` (§2).

## 11. ¿`GRadio` como hijo? **No en v0.1**

`options` (como `GSelect`) + slot `option` con ámbito. Motivos: (1) un radio **suelto no tiene sentido** (no se puede desmarcar; una casilla sí, por eso existe `GCheckbox` solo); (2) con hijas, el grupo tiene que registrar el orden y los `id` para el foco, el destino del resumen y la descripción (lo que `GCheckboxGroup` ya paga con su registro); con `options` la lista **es** el orden; (3) el contenido rico de una opción cabe en el slot `option`. Propuesta kiwi: el nombre `GRadio` queda **reservado**.

## 12. Hallazgos para lima

| # | Hallazgo | Propuesta |
| --- | --- | --- |
| L1 | **API** | `modelValue` (cualquier tipo; `update:modelValue`), `options` `{ value, label, description?, icon?, disabled? }` (forma de `GSelect`), `appearance` (`list` por defecto), `name`, `label`, **`hint`** (no `help`: es el nombre de toda la librería, `GInput`, `GCheckboxGroup`), `error`, `warning`, `valid`, `required`, `mark`, `readonly`, `disabled`, `density`, `size`, `color` (como `GCheckboxGroup`), `field` (#262), `labelMode` (`full` · `icon`, nombre de `GTabs`; `icon` solo en `segmented`/`chips`), `id`. **Sin `orientation`**: la apariencia ya la fija (§2) y el apilado del segmentado es automático. Slots: `label`, `hint`, `error`, `option` (`{ option, checked, disabled }`; dentro de la `<label>`, sin nada interactivo; con él, el nombre del radio es todo su contenido y no hay descripción automática) |
| L2 | **Nombre de los valores de `appearance`** | `form.md` reservó `chips`/`cards` (plural); `GCheckboxGroup layout` usa `chip`/`card`. Decidir uno para los dos (kiwi sugiere el **singular**, el ya publicado) |
| L3 | **`inline` comparte línea** (amplía #181) | Añadir `GRadioGroup appearance="inline"` a la lista de hijos admitidos (`form.md` §4, «Pistas y alineación») y a la Fase 2; `list`/`chips`/`cards`, en su propia fila (aviso 3 de `GFormRow`) |
| L4 | **Mínimo natural del segmentado** | `GFormRow` necesita un mínimo que **publica el hijo** (medido en px, cambia con la fuente y las opciones), además de `g-form-w-*` y `--g-form-min`. Sugerencia: el sub‑contexto de la fila ofrece `setIntrinsicMin(el, px)` y recalcula al cambiar (sin observar estilos). Mínimo efectivo = el mayor de los tres |
| L5 | **`aria-required` y no `required` nativo** | Regla para `GRadioGroup` (1.5). **Hallazgo para `checkbox.md`:** `GCheckbox` pone `required` nativo (`GCheckbox.vue`) y Chromium expone la casilla obligatoria sin marcar como **inválida desde el principio** (medido); valorar `aria-required` también allí |
| L6 | **Raíz y estados** | `fieldset role="radiogroup"` + `aria-labelledby` (1.4); `aria-invalid`, `aria-required`, `aria-readonly` y `aria-describedby` **en el grupo**, nunca en los radios |
| L7 | **Avisos de desarrollo** | Sin nombre (`label`, slot, `aria-label`/`aria-labelledby`); `modelValue` que no está en `options`; **opción elegida deshabilitada** (§4); `description` en `inline`/`segmented`/`chips`; `labelMode="icon"` fuera de `segmented`/`chips` o con opciones sin `icon`; `segmented` con < 2 o > 6 opciones; `value` repetido en `options`; dentro de un `<form>` sin `name` |
| L8 | **Tokens** | Sin tokens nuevos previsibles: el círculo y el foco como `GCheckbox`; la caja del segmentado como la de un campo (`border-control`, `control-height` del `size`); relleno de la elegida = el de una casilla marcada con `color`. **No** usar `--g-tabs-track`/`--g-tabs-thumb` (son de navegación). coco confirma |
| L9 | **Teclado de WebKit** | No envuelve y no invierte ←/→ en RTL (medido). Propuesta kiwi: **nativo** (§3). Si lima prefiere APG estricto, bruno tendría que reimplementar las flechas en todos los motores |
| L10 | **Marcado de una opción** | Clases sugeridas: `g-radio-group`, `--appearance-{a}`, `__label`, `__optional`, `__required`, `__options`, `__option`, `__input`, `__icon`, `__text`, `__option-label`, `__description`, `__support`, `__hint`, `__message`, `__message-icon`, `__message-type`; `is-*` en la raíz; `data-fit="stack"` en el segmentado apilado |
| L11 | **`useFormField`** | `trigger: 'change'`, `control` = el radio por el que Tab entraría, `markRule` de campo (no es una casilla suelta: «(opcional)» sí) |

## 13. Para otros dueños

- **lima (`form.md`):** l. 410 (hijos admitidos: añadir `inline`, L3) y l. 984 (Fase 2: `GRadio` reservado, §11; nombres de `appearance`, L2).
- **lima / bruno (`checkbox.md`, `GCheckbox.vue`):** `required` nativo → `invalid` temprano en Chromium (L5). No lo toco: no es mi archivo.
- **coco:** el aspecto del segmentado debe leerse como **caja de campo**, no como la pista de `GTabs` (§0, §8).

## 14. Comprobaciones ejecutadas (`verificar.mjs`, 596/596)

En **Chromium, Firefox y WebKit**:

- **Teclado:** Tab entra una vez en la primera sin selección (Chromium, Firefox); Espacio elige; flechas cambian la selección y envuelven (Chromium, Firefox; WebKit registrado como nota); Tab sale; Shift+Tab vuelve a la elegida; las flechas saltan la deshabilitada; RTL con la dirección visual (Chromium, Firefox).
- **`name` común:** todos los radios de cada grupo con el mismo `name`; como mucho una elegida por grupo.
- **Solo lectura:** flechas, Espacio, clic en la opción y en la etiqueta no cambian; radios no deshabilitados; dentro de `FormData`.
- **Deshabilitado:** grupo fuera de `FormData` y con radios `:disabled`; sin selección, fuera de `FormData`.
- **Semántica del marcado:** `radiogroup` con nombre visible en todos; `div` para `inline`/`segmented` y `fieldset` para el resto; `aria-required` solo en el grupo; sin `required` ni `aria-invalid` en los radios; iconos `aria-hidden`.
- **Ajuste:** a 1280/960/720/480/360/320, limpio y con mensajes: sin desborde, **cajas de una línea con el mismo `top` (±1px)** en las filas con `segmented` e `inline`, textos sin recortar, **opciones ≥ 24×24px**; segmentado en una línea a 1280, «Lado dominante» apilado a 320 y «Sexo» sin apilar; a 480 la fila manda a «Sexo» a su propia línea antes de apilarlo; ventana de 320 sin desborde.
- **Movimiento reducido:** transición > 0 sin preferencia y 0 con `reduce`.
- **Consola limpia.**

Solo en **Chromium**: árbol de accesibilidad real (CDP): todos los `radiogroup` con nombre (también los `fieldset`), `invalid` en el grupo con error, `required` en los obligatorios, **ningún radio inválido antes de tiempo**, radios con nombre (también solo icono), descripción fuera del nombre; **táctil** (`pointer: coarse`, 360px): todas las opciones ≥ 44×44 y la caja del segmentado igual de alta que la de su vecino; **`forced-colors`**: elegida distinta y marco visible.

Sondas previas (fuera de `verificar.mjs`, mismos motores): flechas que disparan `click` en Chromium y Firefox; elegida deshabilitada que se pierde con una flecha y no se envía; `required` nativo → `invalid=true` en Chromium (radio y casilla); `fieldset role="radiogroup"` nombrado por la `<legend>` sin `aria-labelledby` en Chromium.

## 15. Qué NO verifiqué

- **Lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): anuncio de `fieldset role="radiogroup"` frente a `fieldset` (entrada al grupo, lectura de la `<legend>`), `aria-required`/`aria-invalid`/`aria-readonly` en el grupo (y si se repiten al moverse entre radios), `aria-describedby` del grupo al entrar, descripción por opción, solo icono.
- **Árbol de accesibilidad de Firefox y WebKit** (sin acceso desde Playwright): solo Chromium.
- **Safari real** con «Acceso total por teclado» (Tab), y si su envolvimiento coincide con el WebKit de Playwright.
- `forced-colors` y táctil en Firefox y WebKit; móvil real; zoom 200/400 %.
- El aspecto: todo es wireframe (coco).

## 16. Preguntas de producto realmente abiertas

**Ninguna.** Todo deriva de estándares (ARIA 1.2, APG *Radio Group*, WCAG 2.2) o de decisiones vigentes (#124, #157, #176, #181, #262, #266). Lo que amplía o elige entre opciones equivalentes queda como **propuesta kiwi** para lima: `inline` en fila (L3), singular o plural de `appearance` (L2), `GRadio` reservado (§11) y teclado nativo en WebKit (L9).
