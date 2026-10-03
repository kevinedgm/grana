# Contrato · GRadioGroup

**Dueño:** lima · **Estado:** aprobado (todas las decisiones derivan de estándar o de contratos vigentes; ninguna pregunta de producto abierta) · **Basado en:** `design/lab/radio-group/r01/` (kiwi; `brief.md`, `declaracion.md` con los hallazgos L1 a L11, `index.html`, `verificar.mjs` 596/596 en los tres motores; commit `1463dfa`) · **Convive con:** `form.md` (contexto, `useFormField`, `GFormRow`; Fase 2), `checkbox.md` (hermano de varias respuestas), `select.md` (misma forma de `options`), `card.md` (`selectType="radio"`, #124), `tabs.md` (`segmented` de navegación, #112), `icons.md`
**Tag:** `g-radio-group` · **Categoría:** entradas · **Componente complejo** (CLAUDE.md, «Modelos por rol»: se solapa con `GCheckboxGroup`, `GCard selectType="radio"` y `GTabs appearance="segmented"`): **coco y bruno en Opus**.

Una **pregunta con una sola respuesta** dentro de un formulario (Sí/No, sexo, modalidad de consulta, tipo de sangre, frecuencia), con **radios nativos** (`<input type="radio">`) de `name` común y cinco apariencias que cambian la **forma**, no la semántica. Decisiones: DECISIONS.md **#267 a #273**.

---

## Principios

- **El navegador hace el trabajo.** Estado, teclado (una parada de Tab, flechas que mueven y eligen), envío y agrupación son los del radio nativo. Sin manejadores de teclado propios, salvo el bloqueo de solo lectura (#272).
- **Una sola semántica en las cinco apariencias:** `role="radiogroup"` con nombre visible; `aria-required`, `aria-invalid`, `aria-readonly` y `aria-describedby` **en el grupo**, nunca en los radios (#269).
- **Presenta y emite intención.** `modelValue` es el valor elegido; el componente emite `update:modelValue` y **no valida** (`GForm` decide cuándo se ve el error, #157).
- **Ningún texto se recorta** (#176): un segmentado que no cabe **se apila**; las demás apariencias envuelven o ya son columna.
- **Una respuesta no es una navegación:** el segmentado se lee como **caja de campo**, no como la pista de `GTabs` (#112, #273).
- **Sin textos propios** (Grana es internacional) y **solo Lucide** (`icons.md`).

## Cuándo usarlo (frontera)

| Necesidad | Usar | No usar |
| --- | --- | --- |
| Una respuesta entre 2 y ~7 opciones que conviene **ver** a la vez | `GRadioGroup` | `GSelect` (esconde las opciones) |
| Muchas opciones, o poco espacio | `GSelect` | `GRadioGroup appearance="chip"` con decenas de chips |
| Varias respuestas | `GCheckboxGroup` | `GRadioGroup` |
| Encender o apagar un ajuste que se aplica en el acto | `GSwitch` | Un Sí/No con radios |
| Cada opción es una **entidad con contenido propio** (media, métricas, acciones, menú) | `GCard selectType="radio"` dentro de un `role="radiogroup"` del consumidor (#124, #133) | `appearance="card"` (es una opción de formulario: indicador, icono, etiqueta, descripción; sin `GSurface`, sin acciones, sin media) |
| Cambiar **lo que se ve** (vistas, paneles) | `GTabs` (`segmented` incluido) | `GRadioGroup appearance="segmented"` |
| «Ninguna» es una respuesta válida | Una opción más («No sé», «Prefiero no decirlo») | Permitir deseleccionar (no existe en el nativo ni en APG) |

---

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | String \| Number \| Boolean \| null | `value` de la opción elegida | `null` (sin selección) | compartida |
| `options` | Array | ver «Opciones» | `[]` (función) | propia |
| `appearance` | String | `list` `inline` `segmented` `chip` `card` | `list` | propia |
| `labelMode` | String | `full` `icon` | `full` | propia (nombre y valores de `GTabs`, subconjunto) |
| `name` | String | | generado | propia |
| `label` | String | texto libre | sin valor | propia |
| `hint` | String | texto libre | sin valor | propia |
| `error` | String | texto libre | sin valor | propia (form.md C4) |
| `warning` | String | texto libre | sin valor | propia (form.md C5) |
| `valid` | String | texto libre | sin valor | propia (form.md C5) |
| `required` | Boolean | | `false` | propia |
| `mark` | Boolean | | `undefined` | propia (form.md §2) |
| `readonly` | Boolean | | `undefined` → `false` | compartida |
| `disabled` | Boolean | | `undefined` → `false` | compartida |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | compartida |
| `density` | String | `default` `comfortable` `compact` | `undefined` → contexto o `default` | compartida |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` | compartida |
| `field` | Boolean | | `true` | propia (#262) |
| `id` | String | | generado | propia |

**Sin `orientation`, `variant`, `rounded` ni `block`** (#267): la apariencia ya fija la disposición y el apilado del segmentado es automático; la caja del segmentado toma el radio y el borde de la caja de campo por defecto (como `GCheckboxGroup`, que tampoco las tiene); el grupo siempre ocupa su sitio (en `GFormLayout` y `GFormRow`, como cualquier campo). Si algún día se piden, tendrán esos nombres (`api.md`).

### Opciones

```js
[
  { value: 'presencial', label: 'Presencial', description: 'En el consultorio de Reforma 120.', icon: 'map-pin' },
  { value: 'linea', label: 'En línea', description: 'Videollamada; el enlace llega por correo.', icon: 'globe' },
  { value: 'tel', label: 'Por teléfono', icon: 'message-circle', disabled: true }
]
```

- **Opción:** `{ value, label, description?, icon?, disabled? }` (forma de `GSelect`, #267).
- **`value`:** String, Number o Boolean, **único** en la lista comparado con `===` **y** con `String(value)` (lo que se envía; `1` y `'1'` chocarían en `FormData`). `null` y `undefined` no son valores (son «sin selección»): la opción se ignora y avisa.
- **`label`:** String obligatorio. Es el texto visible, el **nombre accesible del radio** y, en solo icono, el texto oculto accesible. Sin `label`, la opción se ignora y avisa.
- **`description`:** solo en `list` y `card`; va **fuera del nombre**, por `aria-describedby` del radio. En `inline`, `segmented` y `chip` se ignora con aviso.
- **`icon`:** «dato → nombre; plantilla → slot» (`api.md`, #202): una **cadena** con un nombre de Lucide se dibuja con `<GIcon :name>` (resolución de la aplicación: registro → librería) en el hueco `__icon` `aria-hidden`; con slot `icon`, **manda el slot**; un `icon` que no es cadena es un dato opaco que solo recibe el slot. Siempre decorativo.
- **`disabled`:** esa opción no se elige, las flechas la saltan y no se envía. **La opción elegida no puede estar deshabilitada** (§ «Estados»).
- **Sin grupos** (`{ label, options }` de `GSelect`): un grupo de opciones dentro de una pregunta de radios es otra pregunta. Un elemento con `options` se ignora y avisa.

### Reglas de props

- **`modelValue`:** el `value` de la opción elegida, **con su tipo original** (número, booleano), comparado con `===`. `null` (o `undefined`) = sin selección: ningún radio `checked` y el grupo **no aparece** en `FormData`. Un valor que no está en `options` se trata como sin selección y avisa. **Nota para bruno:** `type: [String, Number, Boolean]` con `String` **antes** de `Boolean` (si no, Vue convierte `''` en `true`) y `default: null` (si no, Vue convierte la prop ausente en `false`).
- **Controlado:** al elegir, el componente emite `update:modelValue` y **no** cambia nada por su cuenta; si el consumidor no actualiza el modelo, el `checked` del DOM se **vuelve a alinear** con `modelValue` (como `GCheckbox`).
- **`appearance`:** estructura, no estilo (tabla «Apariencias»). Fija la **raíz** (#268): `inline` y `segmented` → `<div role="radiogroup">` con tres hijos (etiqueta · caja · pie), que **comparten línea** en una `GFormRow`; `list`, `chip` y `card` → `<fieldset role="radiogroup">` con `<legend>`, siempre en su propia fila. La raíz **no** cambia según dónde esté el componente (sin saltos de marcado; igual en SSR). Valores en **singular**, los de `GCheckbox`/`GCheckboxGroup` `layout` (#267).
- **`labelMode`:** `full` (etiqueta visible) o `icon` (solo icono: la etiqueta **no sale del DOM**, se oculta con el patrón de texto oculto accesible y sigue siendo el nombre del radio; **sin tooltip propio**, #113). Solo en `segmented` y `chip`; en otra apariencia cuenta como `full` y avisa. Una opción que **no tiene icono** (regla de `GTabs`, #202: slot `icon` y `option.icon` con valor, o sin slot y `option.icon` cadena) conserva su etiqueta visible y avisa. Pensado para iconos inequívocos (formato, alineación, vista); en una pregunta de formulario se prefiere texto. Sin `auto`: un segmentado que no cabe se apila, no reduce etiquetas.
- **`name`:** nombre común de los radios y clave del grupo en `errors`/`warnings` de `GForm` y en `FormData`. Sin `name`, el componente **genera** uno estable (`useId`), porque los radios lo necesitan para agruparse y para las flechas; dentro de un `<form>` sin `name` avisa (el envío llevaría una clave aleatoria y `GForm` no podría asociar errores).
- **`label`:** el grupo necesita nombre. Sin `label`, sin slot `label` y sin `aria-label` ni `aria-labelledby` (en `$attrs`), aviso en desarrollo. Con etiqueta visible, la raíz lleva `aria-labelledby="ID-label"` (gana a uno de `$attrs`); sin ella, el `aria-label`/`aria-labelledby` del consumidor va en la raíz y la pista de etiqueta queda vacía (form.md §4).
- **`hint`:** ayuda del grupo, en el pie (`ID-hint`), en el `aria-describedby` de la raíz.
- **`error`, `warning`, `valid`:** mensajes del grupo con la región única de form.md C4 y C5. Solo `error` (visible) pone `aria-invalid="true"` **en la raíz**; nunca en los radios. **El componente no valida.**
- **`required`:** **`aria-required="true"` en la raíz** y la marca según la convención de `GForm` (asterisco `aria-hidden` o «(opcional)» en el nombre, form.md §2). **Nunca `required` nativo en los radios** (#269): Chromium expone un radio obligatorio sin elegir como **inválido desde el primer momento**, aunque el `<form>` tenga `novalidate` (medido por kiwi), contra «castigar tarde» (#157). Límite: sin `required` nativo, un `<form>` nativo sin `GForm` no bloquea el envío; quien lo necesite valida y usa `error` (como `GSelect`).
- **`mark`:** `false` quita la marca; `true` no inventa otra convención (form.md §2). `markRule` de campo (`both`): un grupo de radios **sí** lleva «(opcional)», a diferencia de una casilla suelta.
- **`readonly`:** `aria-readonly="true"` en la raíz; radios **habilitados**, enfocables y dentro de `FormData`; las flechas (`keydown` de las cuatro) y el `click` (también el de la etiqueta y el que dispara Espacio) se **cancelan**, de modo que ni la selección ni el foco cambian de opción (#272). Dentro de `GForm readonly` lo hereda (C1, #266), nunca como `disabled`, y sin marca.
- **`disabled`:** en `fieldset`, el atributo nativo del `<fieldset>` (deshabilita en cascada); en la raíz `div`, `disabled` en **cada** radio. Fuera del Tab y de `FormData`. Clase `is-disabled`.
- **`size`:** en `inline` y `segmented`, la **caja** mide lo mismo que la caja de un campo del mismo `size` (`GInput`: 6, 7, 9, 11 y 13 unidades de `space`, × `density`, con piso de 24px y ≥ 44px con `pointer: coarse`); en `list`, `chip` y `card`, el tamaño del indicador y del texto, como `GCheckbox`.
- **`color`:** relleno de la elegida (punto del círculo, segmento, chip; borde y fondo de la tarjeta). El error usa siempre `danger`.
- **`field`** (#262): con `true` (por defecto) es un **campo**: región de mensaje siempre presente (C4) y contexto de `GForm`. Con **`false`** es un **control suelto dentro de otro componente** (un selector de vista en una barra de herramientas): sin `__message` (ni `aria-live`), sin leer el contexto de `GForm` (no se registra ni hereda `density`, `readonly`, `disabled`, errores ni marcas) y sin marca; `error`, `warning`, `valid`, `required` y `mark` se **ignoran con aviso**. El pie solo existe si hay `hint`.
- **`id`:** de la raíz; sin él se genera (`useId`). Derivan: `ID-label`, `ID-hint`, `ID-message` y, por opción `i` (índice en `options` tras descartar las inválidas), `ID-i` (radio), `ID-i-label`, `ID-i-description`.
- **Resto de atributos** (`aria-*`, `data-*`, escuchas, `class`, `style`): a la **raíz** (`inheritAttrs: false`, fusionados con `mergeProps(handlers, propios, attrs)`: los del contexto primero, C8). Un `@change` del consumidor en la raíz recibe el `change` nativo que sube del radio, ya con el modelo actualizado. **`form`** (asociar los radios a un `<form>` externo) no se admite en v0.1 (límite conocido).

## Apariencias

| | `list` | `inline` | `segmented` | `chip` | `card` |
| --- | --- | --- | --- | --- | --- |
| Raíz | `fieldset` | `div` | `div` | `fieldset` | `fieldset` |
| En una `GFormRow` con más hijos | No (aviso 3) | **Sí** | **Sí** | No (aviso 3) | No (aviso 3) |
| Indicador | círculo (el `<input>` dibujado) | círculo | relleno del segmento | relleno del chip | círculo + borde de la tarjeta |
| `description` | Sí | No (aviso) | No (aviso) | No (aviso) | Sí |
| `icon` | Sí | Sí | Sí | Sí | Sí |
| `labelMode="icon"` | No (aviso) | No (aviso) | **Sí** | **Sí** | No (aviso) |
| Opciones (guía) | 2 a ~7 | 2 a ~4 cortas | **2 a 6** (aviso fuera de rango) | muchas cortas | 2 a ~6 |
| Disposición | columna | fila que envuelve; caja del alto de un campo, opciones centradas | una línea; si no cabe, **se apila** (`is-stacked`) | fila que envuelve | rejilla; una columna en estrecho |

- **Círculo** (`list`, `inline`, `card`): el propio `<input>` dibujado con `appearance: none` (como el cuadro de `GCheckbox`). **Relleno** (`segmented`, `chip`): el `<input>` **cubre** la opción con `opacity: 0` (nunca `display: none` ni `visibility: hidden`; precedente del chip de `GCheckbox`) y el estado lo dice el relleno.
- **Objetivo de clic:** la **opción entera** (`<label>`): la fila, la píldora, la tarjeta o el segmento (WCAG 2.5.8). **Nada interactivo dentro** de una opción.
- **Segmentado:** caja de campo del alto de sus vecinas, con el marco **hacia dentro** (cada segmento ocupa el alto entero); la elegida **rellena en su sitio**, **sin pista ni marca deslizante** (#273). El icono y la etiqueta van en un bloque (`__segment`) que **no se parte** mientras el segmentado está en una línea.

## Estructura accesible

### `inline` y `segmented` (tres hijos; comparten línea)

```html
<div class="g-radio-group g-radio-group--appearance-segmented g-radio-group--size-md g-radio-group--density-default g-radio-group--color-brand [is-stacked] [is-invalid]"
     id="ID" role="radiogroup" aria-labelledby="ID-label" aria-describedby="ID-hint ID-message"
     aria-required="true" aria-invalid="true">                                                      <!-- aria-readonly="true" con readonly -->
  <span class="g-radio-group__label" id="ID-label">Sexo<span class="g-radio-group__required" aria-hidden="true">*</span></span>
  <div class="g-radio-group__options">                                                             <!-- pista de la caja -->
    <label class="g-radio-group__option" for="ID-0">
      <input class="g-radio-group__input" type="radio" id="ID-0" name="sexo" value="F" aria-labelledby="ID-0-label">
      <span class="g-radio-group__segment">                                                          <!-- solo segmented -->
        <span class="g-radio-group__text"><span class="g-radio-group__option-label" id="ID-0-label" dir="auto">Femenino</span></span>
      </span>
    </label>
    …
  </div>
  <div class="g-radio-group__support">
    <div class="g-radio-group__hint" id="ID-hint">Como aparece en la identificación</div>
    <div class="g-radio-group__message" id="ID-message" aria-live="polite">                         <!-- siempre presente (C4) -->
      <svg class="g-icon g-radio-group__message-icon" aria-hidden="true">…</svg><span class="g-radio-group__message-type">Error:</span>Elige el sexo
    </div>
  </div>
</div>
```

### `list`, `chip` y `card` (`fieldset`; fila propia)

```html
<fieldset class="g-radio-group g-radio-group--appearance-card …" id="ID" role="radiogroup" aria-labelledby="ID-label" aria-describedby="ID-message" disabled>
  <legend class="g-radio-group__label" id="ID-label">Modalidad <span class="g-radio-group__optional">(opcional)</span></legend>
  <div class="g-radio-group__options">
    <label class="g-radio-group__option [is-disabled]" for="ID-0">
      <input class="g-radio-group__input" type="radio" id="ID-0" name="modalidad" value="presencial" checked
             aria-labelledby="ID-0-label" aria-describedby="ID-0-description">
      <span class="g-radio-group__icon" aria-hidden="true"><svg class="g-icon">…</svg></span>     <!-- solo con icono -->
      <span class="g-radio-group__text">
        <span class="g-radio-group__option-label" id="ID-0-label" dir="auto">Presencial</span>
        <span class="g-radio-group__description" id="ID-0-description">En el consultorio de Reforma 120.</span>   <!-- solo list y card -->
      </span>
    </label>
    …
  </div>
  <div class="g-radio-group__support">…</div>
</fieldset>
```

- **`fieldset role="radiogroup"`** (permitido por *ARIA in HTML*) con **`aria-labelledby`** a la `<legend>` (Chromium la toma sin él; los demás motores lo necesitan). Conserva lo nativo del `fieldset` (`disabled` en cascada) y expone lo mismo que la raíz `div` (#269).
- **Nombre de cada radio = su etiqueta** (`aria-labelledby` → `ID-i-label`); la descripción por `aria-describedby` (solo `list` y `card`); el icono `aria-hidden`. En solo icono, `ID-i-label` es el texto oculto accesible (clase `is-icon-only` en la opción).
- **`dir="auto"`** en `__option-label` (aislamiento bidi: «A+» en una página RTL no se lee «+A»).
- `aria-describedby` de la **raíz**: `$attrs['aria-describedby']`, `ID-hint` si hay ayuda e `ID-message` solo mientras hay mensaje.
- **Región `ID-message`**: siempre presente salvo con `field: false`; vacía = sin nodos de texto (C4); `aria-live` = `live` del contexto (`polite` fuera de `GForm`). Dentro: `GIcon` (`circle-alert`, `triangle-alert`, `circle-check`) + prefijo oculto `__message-type` (`labels.error|warning|valid` de `GForm`; fuera, sin prefijo) + texto.
- **Marcas** dentro de `__label`: asterisco `__required` `aria-hidden` o texto `__optional` (parte del nombre).
- Con slot `option`, el contenido del slot sustituye a `__icon` y `__text` dentro de un `<span class="g-radio-group__option-label" id="ID-i-label">` (es todo el nombre; sin descripción automática).

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | el `value` de la opción (tipo original) | El usuario elige otra opción (`change` nativo del radio). Nunca con `readonly` ni `disabled`, ni al cambiar `modelValue` desde fuera |

Solo ese evento va en `emits`. `change`, `focusin`, `focusout`, `keydown`… **no se declaran**: llegan a la raíz por `$attrs` con su `Event` nativo (suben desde el radio).

## Slots

| Slot | Props | Propósito | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `label` | — | Etiqueta con contenido rico (sustituye a `label`) | Dentro de `ID-label` (`<span>` o `<legend>`); nunca elementos interactivos |
| `hint` | — | Ayuda con contenido rico | Conserva `ID-hint` dentro de `__support` |
| `error` | — | Mensaje de error con contenido rico | Solo con error visible; dentro de `ID-message`, tras icono y prefijo |
| `option` | `{ option, index, checked, disabled }` | Contenido rico de una opción (sustituye a icono, etiqueta y descripción) | Dentro de la `<label>`, en `ID-i-label` (todo es el nombre del radio); el `<input>` lo pone el componente; **nada interactivo**. Con él, `labelMode="icon"` no tiene efecto (aviso) |
| `icon` | `{ option, index, checked }` | Icono de una opción (manda sobre `option.icon`, #202) | Dentro de `__icon` `aria-hidden`; lo que no es Lucide va aquí, nunca en `GIcon` |

## Teclado

Nativo (APG *Radio Group*; medido por kiwi en los tres motores, `declaracion.md` §3). **Sin manejadores propios** salvo el bloqueo de `readonly`.

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Entra **una vez** en el grupo: en la elegida; sin elegida, en la primera habilitada (Shift+Tab sin elegida: la última en Chromium, la primera en Firefox). La siguiente Tab sale del grupo |
| Flechas (←↑→↓) | Mueven el foco **y eligen**; saltan las deshabilitadas. Chromium y Firefox envuelven y siguen la dirección visual en RTL; **WebKit no envuelve ni invierte ←/→ en RTL**: no se normaliza (#272) |
| Espacio | Elige la enfocada si no lo estaba |
| Enter | Sin acción propia (lo que haga el navegador; no se intercepta) |
| Con `readonly` | Flechas y Espacio no cambian nada; el foco se queda en la elegida; Tab entra y sale |

## Estados

| Estado | Semántica | Comportamiento | Clase |
| --- | --- | --- | --- |
| Elegida | `checked` nativo | Una por grupo | — (`:checked`, `:has()`) |
| Sin selección | ningún `checked` | Tab entra en la primera; fuera de `FormData` | — |
| Opción deshabilitada | `disabled` en ese radio | Las flechas la saltan; no se envía | `is-disabled` en `__option` |
| Grupo deshabilitado | `fieldset disabled` o `disabled` en cada radio | Fuera del Tab y de `FormData` | `is-disabled` en la raíz |
| Solo lectura | `aria-readonly` en la raíz; radios habilitados | Enfocable, legible, dentro de `FormData`; flechas y clic cancelados | `is-readonly` |
| Error | `aria-invalid` en la raíz + `ID-message` en su `aria-describedby` | Revelado con el momento de `GForm` (`trigger: 'change'`) | `is-invalid` |
| Advertencia / válido | sin `aria-invalid` | No bloquean (C5) | `is-warning` / `is-valid` |
| Obligatorio / opcional | `aria-required` en la raíz / «(opcional)» en el nombre | — | — |
| Segmentado apilado | — | Una opción por línea, misma caja, mismo orden | `is-stacked` |

- **La opción elegida no puede estar deshabilitada** (medido por kiwi: una flecha elige otra y la elegida se pierde; además no se envía). Se pinta como se pide y **avisa en desarrollo**: si el valor no se puede cambiar, el grupo es `readonly`.
- **Solo lectura homogéneo** (C7, #165, #186): contraste completo, fondo `neutral-soft`, borde **discontinuo**, cursor normal; distinto de `disabled` sin depender del color.
- **`forced-colors`:** elegida con `SelectedItem`/`SelectedItemText`; tarjeta con borde más grueso; marco del segmentado con `outline` (no `box-shadow`). **`prefers-reduced-motion`:** sin transición.

## Contexto de formulario (`useFormField`, form.md §2)

| Opción | Valor |
| --- | --- |
| `name`, `id`, `error`, `warning`, `valid`, `required`, `readonly`, `disabled`, `density`, `mark` | Las props (default `undefined` en `readonly`, `disabled`, `density`, `mark`; precedencia prop › contexto › default) |
| `trigger` | `'change'` (control de elección: revela al cambiar) |
| `control` | **El radio por el que Tab entraría**: la elegida si está habilitada; si no, la primera habilitada (getter o `computed`; cambia al elegir). Destino del enlace de `GErrorSummary` y del foco al primer inválido |
| `root` | La raíz (para desplazar con la etiqueta a la vista) |
| `markRule` (interna) | `'both'` (por defecto) |
| `role` (interna) | `'field'` (por defecto): los radios no son campos de Grana; no provee contexto de grupo |
| Registro | Con `name`, el grupo se registra (no hay radios registrados sueltos). Con `field: false`, `useFormField` no se usa |

Los `handlers` (`onChange`, `onFocusout`…) se fusionan **primero** en la raíz (C8): el `change` nativo sube del radio a la raíz.

## En una `GFormRow` (form.md §4)

- **`inline` y `segmented`** son hijos admitidos (#268): etiqueta en la pista 1 (apoyada abajo, nunca recortada), `__options` en la **pista de la caja**, `__support` en la 3, con `grid-template-rows: subgrid` (CSS de coco en `GRadioGroup.css`, como C12). La caja de `inline` tiene el alto mínimo de la caja de un campo y centra sus opciones (el texto de «Sí · No» queda a la altura del de sus vecinas).
- **`list`, `chip` y `card`** van en su propia fila (hijo directo de `GFormLayout`); en una fila con más hijos, aviso 3 de `GFormRow`.
- **Mínimo intrínseco del segmentado** (#271): el segmentado **publica a su fila** su ancho natural (todas las opciones en una línea e iguales al ancho de la más larga) con la función interna del sub‑contexto de `GFormRow` **`setIntrinsicMin(el, px)`** (form.md §2 y §4). La fila usa como mínimo efectivo el **mayor** entre el de su `g-form-w-*`, `--g-form-min` × `space` y el intrínseco: **la fila se parte en líneas antes de que el segmentado se apile** (medido por kiwi: a 480px «Sexo» pasa a su propia línea y cabe sin apilarse). Solo cuenta si la raíz del grupo es **hijo directo** de la fila (como `--g-form-min`). Al desmontar o al dejar de ser `segmented`, publica `0`.
- **Tamaño recomendado** (documentación, no regla): Sí/No `inline` con `g-form-w-xs` o `sm`; un segmentado de 3 opciones cortas con `sm` o `md`.

## Segmentado: medida y apilado (#271)

- **Ancho natural** = `n × (ancho max-content del __segment más ancho + relleno en línea de la opción)` + separadores y marco. Lo mide el `.vue` en una pasada síncrona **sin** `is-stacked` (precedente: `g-stepper--measure`, #151); si bruno necesita una clase interna de medida, se llama **`g-radio-group--measure`** y coco la respeta (sin transición, sin apilar).
- **Cuándo se mide el natural:** al montar (antes del primer pintado del cliente), al cambiar `options`, `labelMode`, `size`, `density` o `appearance`, y cuando terminan de cargar las fuentes (`document.fonts`, si existe). **Cuándo se decide el apilado:** con un `ResizeObserver` sobre `__options` (un observador compartido, como `GFormRow`): `is-stacked` si el natural supera el ancho disponible (tolerancia 0,5px). Las escrituras van **fuera** de la devolución del observador (`requestAnimationFrame`) y **solo si cambian** (lección de #169). Se decide por **su ancho propio**, nunca por el visor.
- **Apilado:** una opción por línea, **misma caja, mismo orden** (DOM = lectura = Tab = visual), mismas flechas; las etiquetas pueden partirse (nunca recortarse). Ni rejilla de 2×2, ni scroll, ni paso a `list` (kiwi §7).
- **Sin medida** (SSR, sin `ResizeObserver`): una línea, como se pidió (precedente de `GStepper` y `GTabs`); no publica mínimo intrínseco.

## Avisos de desarrollo (`[Grana GRadioGroup]`)

Una vez por instancia y mensaje; con `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`.

1. Sin nombre accesible (`label`, slot `label`, `aria-label`, `aria-labelledby`).
2. Menos de 2 opciones válidas; `segmented` con más de 6.
3. Opción sin `value` (o `null`/`undefined`) o sin `label`; elemento con `options` (grupo): se ignoran.
4. `value` repetido (por `===` o por `String(value)`).
5. `modelValue` que no está en `options` (y no es `null`/`undefined`).
6. **Opción elegida deshabilitada** («usa `readonly` si el valor no se puede cambiar»).
7. `description` en `inline`, `segmented` o `chip` (se ignora).
8. `labelMode="icon"` fuera de `segmented`/`chip` (cuenta como `full`); opción sin icono con `labelMode="icon"` (conserva su etiqueta); slot `option` con `labelMode="icon"` (sin efecto).
9. Dentro de un `<form>` sin `name`.
10. Con `field: false`: `error`, `warning`, `valid`, `required` o `mark` (se ignoran, #262).

## Tokens consumidos

| Token | Para qué |
| --- | --- |
| `--g-color-surface` | Fondo del círculo, de la caja del segmentado, del chip y de la tarjeta sin elegir |
| `--g-color-border-control` | Borde del círculo y marco de la caja del segmentado (≥ 3:1) |
| `--g-color-border` | Separadores entre segmentos (decorativos) |
| `--g-color-border-strong` | Borde del chip y de la tarjeta sin elegir; `disabled` |
| `--g-color-{color}`, `--g-color-on-{color}` | Punto del círculo; segmento y chip elegidos y su texto |
| `--g-color-{color}-soft`, `--g-color-on-{color}-soft` | Fondo de la tarjeta elegida |
| `--g-color-{color}-text` | Borde de la tarjeta y del chip elegidos |
| `--g-color-neutral-soft` | Fondo de `readonly` (#186) |
| `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Etiquetas; ayuda y descripción; `disabled` |
| `--g-color-danger-text`, `--g-color-warning-text`, `--g-color-success-text` | Mensajes, marca de obligatorio, caja del segmentado inválida |
| `--g-color-focus` | Anillo de foco por opción |
| `--g-radius-sm` | Caja del segmentado (la de la caja de campo por defecto) |
| `--g-radius-pill`, `--g-radius-lg` | Círculo y chip; tarjeta |
| `--g-space-1` | Unidad del círculo, de la caja (alturas de `size`), rellenos y separaciones |
| `--g-font-ui` | Familia |
| `--g-text-body-sm-size`, `--g-text-body-size`, `--g-text-action-weight` | Etiqueta del grupo y de las opciones según `size` (`tokens.md` §23.2) |
| `--g-text-caption-size`, `--g-text-caption-line` | Ayuda, descripción y mensaje |
| `--g-border-width`, `--g-focus-width`, `--g-focus-offset` | Bordes y foco |
| `--g-duration-fast`, `--g-duration-press`, `--g-ease-standard` | Hover y relleno de la elegida en su sitio |

**Tokens nuevos: ninguno** (#273; `tokens.md` §25). El segmentado es una **caja de campo** con los tokens de los campos y el relleno de una casilla marcada; **no** lee `--g-tabs-track`/`--g-tabs-thumb` (son de navegación, #120). Si coco no alcanza con estos, lo pide aquí antes de escribir literales.

## Clases (contrato entre bruno y coco)

Bruno las emite; coco las estiliza. Ninguno usa otras. Elegida, foco y hover se estilizan con `:checked`, `:focus-visible` y `:has()`, sin clases propias.

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-radio-group` | Raíz (`div` o `fieldset`) | Siempre |
| `g-radio-group--appearance-{list\|inline\|segmented\|chip\|card}` | Raíz | Siempre (incluido el defecto) |
| `g-radio-group--size-{s}`, `--density-{d}`, `--color-{c}` | Raíz | Siempre |
| `g-radio-group--icon-only` | Raíz | `labelMode="icon"` efectivo (`segmented`/`chip`) |
| `g-radio-group--measure` | Raíz | Solo durante la medida síncrona del segmentado (interna; si bruno la usa) |
| `is-disabled`, `is-readonly`, `is-invalid`, `is-warning`, `is-valid` | Raíz | Estado |
| `is-stacked` | Raíz | Segmentado apilado (tras medir) |
| `g-radio-group__label` | `span` o `legend` | Con `label` o slot `label` |
| `g-radio-group__required`, `g-radio-group__optional` | Marca dentro de `__label` | Según `mark` resuelta |
| `g-radio-group__options` | Contenedor de opciones (la caja en `inline`/`segmented`) | Siempre |
| `g-radio-group__option` | `<label>` | Por opción |
| `is-disabled`, `is-icon-only` | `__option` | Opción deshabilitada; etiqueta oculta en solo icono |
| `g-radio-group__input` | `<input type="radio">` | Por opción |
| `g-radio-group__segment` | Bloque icono + texto | Solo `segmented` |
| `g-radio-group__icon` | `span` `aria-hidden` | Opción con icono |
| `g-radio-group__text`, `__option-label`, `__description` | Texto de la opción | `__description` solo `list`/`card` |
| `g-radio-group__support` | Pie | Siempre con `field`; con `field: false`, solo si hay ayuda |
| `g-radio-group__hint` | Ayuda | Con `hint` o slot `hint` |
| `g-radio-group__message`, `__message-icon`, `__message-type` | Región de mensaje y sus partes | Siempre con `field` (C4) |

## Verificación

- **bruno** (vitest + jsdom): raíz por apariencia (`div`/`fieldset`) con `role="radiogroup"` y `aria-labelledby`; `name` común (dado y generado); `value` = `String(value)` y `update:modelValue` con el tipo original (número, booleano); controlado (sin actualizar el modelo, el `checked` vuelve); `null` sin selección; `aria-required`/`aria-invalid`/`aria-readonly`/`aria-describedby` **solo en la raíz** y **ningún `required` nativo**; nombre del radio = etiqueta, descripción solo en `list`/`card`, icono `aria-hidden`, `dir="auto"`; solo icono (texto oculto, opción sin icono visible); `readonly` (flechas y clic cancelados, radios habilitados, en `FormData`); `disabled` de grupo en las dos raíces y por opción; contexto de `GForm` (`trigger: 'change'`, `control` = la que recibiría Tab, marcas con `markRule` `both`, `readonly` heredado sin marca, orden de manejadores); `field: false`; slots `option` e `icon`; los diez avisos. **Playwright** (tres motores): adaptar `design/lab/radio-group/r01/verificar.mjs` al componente real en `design/lab/theme-playground/` (teclado, `FormData`, solo lectura, ajuste a 1280/960/720/480/360/320, cajas de una línea con el mismo `top` ±1px, opciones ≥ 24×24 y ≥ 44×44 táctil, segmentado apilado por su ancho y fila que se parte antes) y añadir una fila con `segmented` e `inline` a la **prueba obligatoria de distribución** (`tests/form-distribution.spec.mjs`, #184). En el playground, Sexo pasa de `GSelect` a `GRadioGroup appearance="segmented"` (form.md «Migración»).
- **coco** (auditoría con un tema distinto): el segmentado se lee como caja de campo y no como `GTabs`; la elegida no depende solo del color (punto, relleno con texto en `on-*`, borde doble en la tarjeta); foco visible por opción (dentro del segmento); solo lectura distinto de deshabilitado; `forced-colors`; movimiento reducido.

## Resolución de hallazgos de kiwi (r01, §12)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | API | Aceptada con ajustes: `options` `{ value, label, description?, icon?, disabled? }` sin grupos; `modelValue` String \| Number \| Boolean \| null; `appearance` (`list` por defecto) en singular; **`hint`** (no `help`); `labelMode` `full` · `icon`; `field`; `mark`; sin `orientation`, `variant`, `rounded` ni `block`; slots `label`, `hint`, `error`, `option` y, por #202, `icon`; **sin `GRadio`** en v0.1 (nombre reservado) | #267; `GSelect`, `GCheckboxGroup`, `GTabs`; `api.md` (#202) |
| L2 | `chips`/`cards` frente a `chip`/`card` | **Singular** (`chip`, `card`): son los valores ya publicados en `GCheckbox`/`GCheckboxGroup` `layout`; la reserva en plural de `form.md` no se llegó a publicar y se corrige allí. La prop sigue siendo `appearance` (no `layout`): cambia la raíz y su lugar en la fila, como `appearance` de `GTabs`/`GTable`; el `layout` de las casillas es la estructura de cada casilla hija | #267 |
| L3 | `inline` comparte línea | **Aceptado** y registrado como ampliación de #181: `inline` y `segmented` con raíz `div role="radiogroup"` y tres hijos; `list`, `chip` y `card`, `fieldset` y fila propia. `form.md` §4 y Fase 2 actualizados | #268 |
| L4 | Mínimo natural del segmentado | Función interna **`setIntrinsicMin(el, px)`** del sub‑contexto de `GFormRow` (no hay mecanismo previo en `GInputGroup` ni `GDatePicker`: usan `--g-form-min` del consumidor). Mínimo efectivo = el mayor de los tres. No es una propiedad `--g-*` (no es del tema ni del consumidor; una propiedad escrita en línea chocaría con el `style` del consumidor y obligaría a leer estilos) | #271; form.md §4 (#174, #175) |
| L5 | `aria-required` y no `required` nativo | Regla del grupo de radios (#269) y **también para `GCheckbox`** (#270; cambio anotado en `checkbox.md` para bruno en esta ronda) | #157; medido por kiwi en Chromium |
| L6 | Raíz y estados | `fieldset role="radiogroup"` + `aria-labelledby`; estados y descripciones en el grupo, nunca en los radios | #269; ARIA 1.2 |
| L7 | Avisos de desarrollo | Los diez de «Avisos de desarrollo»: los de kiwi más menos de 2 opciones, grupos en `options`, slot `option` con solo icono y `field: false` (#262) | #267 |
| L8 | Tokens | Ninguno nuevo; segmentado con tokens de campo y relleno de casilla marcada; sin `--g-tabs-*`; `tokens.md` §25 | #273; `tokens.md` §17.6 |
| L9 | Teclado de WebKit | **Nativo** (propuesta de kiwi): no se reimplementan las flechas; las diferencias de WebKit son las de todos los radios de esa plataforma y no incumplen 2.1.1 | #272 |
| L10 | Marcado | Clases de kiwi con dos cambios: `data-fit="stack"` → **`is-stacked`** (convención `is-*` de `api.md` para estados), y `__segment` para el bloque del segmentado; añadidas `--size-*`, `--density-*`, `--color-*`, `--icon-only` e `is-icon-only` (como `GTabs`) | `api.md`; `tabs.md` |
| L11 | `useFormField` | `trigger: 'change'`, `control` = el radio por el que Tab entraría, `markRule` `both`, `role` `field`, registro del grupo | form.md §2; C9 |

## Límites conocidos

- **WebKit:** Tab no llega a los radios con la preferencia por defecto de macOS (Safari real: «Acceso total por teclado» u Opción+Tab); las flechas no envuelven ni se invierten en RTL (#272).
- **Sin `required` nativo:** un `<form>` nativo sin `GForm` no bloquea el envío; la aplicación valida y pasa `error`.
- **`form` externo:** v0.1 no asocia los radios a un `<form>` fuera de su árbol.
- **Ancho natural:** se mide en el cliente; en SSR el segmentado sale en una línea hasta montar.

## Abierto (no bloquea el paso siguiente)

- **Lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): entrada al `fieldset role="radiogroup"` frente a la raíz `div`; si `aria-required`/`aria-invalid`/`aria-readonly` del grupo se anuncian (y si se repiten al moverse); `aria-describedby` del grupo; descripción por opción; solo icono.
- Árbol de accesibilidad de Firefox y WebKit; Safari real; `forced-colors` y táctil en Firefox y WebKit; zoom 200/400 %.

## Para otros dueños (esta ronda)

- **bruno · `GFormRow.vue`:** sub‑contexto con `setIntrinsicMin(el, px)` (form.md §4); lista `NOT_ADMITTED` += `.g-radio-group--appearance-list`, `--appearance-chip`, `--appearance-card`.
- **bruno · `GErrorSummary.vue`:** `closest(…)` += `.g-radio-group` (raíz a desplazar).
- **bruno · `GCheckbox.vue`:** `aria-required` en vez de `required` nativo (#270, `checkbox.md`).
- **coco · `GRadioGroup.css`:** pistas en `GFormRow` (C12), caja del segmentado del alto de un campo con marco hacia dentro, `is-stacked`, `--measure`, foco por opción, `forced-colors`, movimiento.
