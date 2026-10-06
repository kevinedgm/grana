# API compartida de props

**Dueño:** lima. Todos los componentes `g-*` que rendericen un control usan estos nombres y valores. Se incluyen solo las props que apliquen; nunca se renombran ni se inventan sinónimos.

| Prop | Tipo | Valores | Default | Nota |
| --- | --- | --- | --- | --- |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | según componente (`GBtn`: `brand`) | Semántico, nunca hex. Lee `--g-color-<valor>` y sus derivados. Los avisos (`GToast`) no tienen `color`: su `type` (`neutral` `info` `success` `warning` `error` `loading`) elige el semántico y `error` lee `danger` (como `status` de `GCard`). La isla de estado y su marca (`status.md`) tampoco: `type` `info` `success` `warning` `error`. En `GDatePicker` es el color de la selección (círculo y franja), no del foco. En `GSidebar`, el relleno de la píldora activa del navbar y de los indicadores (el activo del sidebar es neutro). **En `GAvatar`**, valores propios: `neutral` o una **categoría** `1` a `12` del tema (`cat-k`), con `categories` para derivarla; **nunca** un semántico (un avatar no dice «peligro»; `avatar.md`, #293) |
| `variant` | String | `solid` `soft` `outline` `ghost` `link` | según componente | `solid` usa base + `on`; `soft` usa `soft` + `on-soft`; `outline`, `ghost` y `link` usan `text`. Un componente puede aceptar un subconjunto (`GInput`, `GTextarea`, `GSelect`, `GNumberField` y `GCombobox`: `outline` y `soft`; `GBadge`: `solid`, `soft`, `outline` y `glass`, con `glass` fuera de la lista compartida: es el cristal, `tokens.md` §12; `GDatePicker`: `outline` y `soft`, solo el campo; `GSidebar`: `fixed` y `floating`, fuera de la lista compartida: es la forma de la superficie; `GWidget`, `GWidgetGrid`, `GWidgetGallery`, `GWidgetConfig`, `GMenu`, `GStepper`, `GPagination`, `GFilterBar`, `GTabs`, `GCard`, `GToaster`, `GStatusIsland`, `GStatusMark`, `GSpeechHost`, `GSpeechPill`, `GSpeechTrigger`, `GDivider` y las primitivas no tienen `variant`; `GDivider` usa `emphasis` (`subtle` `strong`, tono del neutro, nunca color: `divider.md`); `GSurface` y `GCard` usan `level` (`GCard`: `flat` `outlined` `raised` `inset`) y `GTable`, `GTabs`, `GRadioGroup` y `GCombobox`, `appearance` (en `GCombobox`: `field` `palette`, cómo se abre; #330)) y rechaza el resto con su validador |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | Altura desde `space` (ver contrato de tokens §4). `GBadge` acepta solo `sm` `md` `lg` (una insignia no es un control). `GDialog` acepta solo `sm` `md` `lg` y los usa para el **ancho** de la carcasa (400, 560 y 760px con `space` 4). En `GAvatar` es el **lado** (`xs` 5 · `sm` 6 · `md` 8 · `lg` 10 · `xl` 16 × `space`, #293). En los campos es siempre la **altura**: el ancho de un campo dentro de una `GFormRow` se da con las clases `g-form-w-{xs\|sm\|md\|lg}` (peso + mínimo, `form.md` §4, #174), nunca con `size` |
| `density` | String | `default` `comfortable` `compact` | `default` | Multiplica altura, padding y gap (en `GWidget` y `GWidgetGrid`, relleno y separación; en `GWidgetGallery` y `GWidgetConfig`, como `GDialog`): 1×, 0.875×, 0.75×, con piso de 24px. No cambia la tipografía. `GDialog` la aplica al relleno y la separación de carcasa e inset. `GCard` la aplica al relleno (vía `GSurface`), la separación y el tamaño de la media lateral. `GCalendar` usa `compact` `comfortable` `spacious` (altura de una hora de 11, 15 o 20 unidades de `space`), porque no multiplica un control. `GForm` la **comparte** con los campos, `GFormLayout`, `GFormRow`, `GInputGroup`, secciones y pie que no traen la suya (`form.md`) y la aplica a `--g-form-gap`, `--g-form-column-gap` y `--g-form-section-gap`. `GAdaptiveLayout` la hereda igual, la aplica a sus dos separaciones y la re‑provee a sus hijos (`adaptive-layout.md`) |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | según rol y `shape` del tema | La instancia gana sobre el tema |
| `block` | Boolean | | `false` | Ancho completo. Dentro de `GFormLayout`, `GFormRow` o `GFieldGroup`, los campos son `block` por defecto (llenan su sitio; `form.md` §4); la prop explícita gana |
| `disabled` | Boolean | | `false` | `disabled` nativo, o `aria-disabled` si debe seguir enfocable |
| `readonly` | Boolean | | `false` | Solo controles de entrada (`GDatePicker`: el campo es enfocable y no abre; en `inline`, navegable sin elegir; `GInput`, `GTextarea`: atributo nativo; `GNumberField`: nativo **y** `aria-readonly` (Chromium no expone ninguno en un `spinbutton`), sin pasos y sin −/+; `GSelect`: `aria-readonly`, enfocable y no abre; `GCombobox`: nativo y `aria-readonly`, enfocable, no abre, sin limpiar ni flecha). En `GCheckbox` y `GSwitch` (el `<input type="checkbox">` no admite `readonly` nativo): `aria-readonly="true"` y el cambio se bloquea; la casilla sigue enfocable. En `GRadioGroup`: `aria-readonly="true"` en el `radiogroup` (no en los radios), flechas y clic cancelados; los radios siguen habilitados, enfocables y en `FormData` (#272). **Aspecto único en todos los campos** (DECISIONS.md #165): contraste completo, fondo `neutral-soft` (#186), borde discontinuo, enfocable y seleccionable; nunca atenuado como `disabled`. `GForm readonly` lo aplica a todo el formulario. En `GInputGroup`, la parte de elección (`<select>` nativo, que no admite `readonly`) se pinta como texto de solo lectura con un campo oculto con el valor (#178) |
| `loading` | Boolean | | `false` | Bloquea la acción, `aria-busy="true"`, no cambia el tamaño. En **controles de entrada** (`GInput`, `GTextarea`, `GSelect`, `GSwitch`) solo muestra el indicador y `aria-busy`: no bloquea la escritura ni el cambio (un guardado asíncrono se revierte desde el consumidor). En `GCombobox` es «buscando»: indicador en el campo y `aria-busy` en el `listbox`, **sin vaciar la lista** (#332). En `GDialog`: `aria-busy="true"` en la carcasa y `is-loading`; no bloquea nada. En `GCalendar`: conserva la estructura y muestra esqueleto de filas, nunca reemplaza la pantalla. En `GCard`: `aria-busy`, esqueleto con las regiones declaradas (prop `skeleton` o slot `loading`), sin controles enfocables. En `GTable`: `aria-busy` en el `<table>`, filas esqueleto `aria-hidden`, y su región viva anuncia `labels.loading` al empezar y `labels.results` (`{count}`) al terminar (#265). **Patrón para componentes con `labels`:** el texto de carga es `labels.loading` en una región viva que existe desde el montaje y fuera del elemento con `aria-busy` |
| `modelValue` | según componente | | | Con `update:modelValue`. En `GSidebar`: el `id` del destino actual. En `GWidgetGallery` y `GWidgetConfig`: Boolean, hoja abierta (como `GDialog`). En `GMenu`: Boolean, menú abierto. En `GCard`: selección como el `<input>` nativo (Boolean, Array con `value`, o el valor elegido del grupo en `radio`). En `GDatePicker`: ISO `YYYY-MM-DD` (`single`) o `{ start, end }` (`range`); solo se emiten valores completos. En `GRadioGroup`: el `value` de la opción elegida con su tipo original (String, Number o Boolean); `null` sin selección (`radio-group.md`). En `GNumberField`: `Number` finito o `null`, **nunca** una cadena; lo enviado es el canónico de un oculto (`number-field.md`, #310). En `GCombobox`: el `value` de la opción elegida (String o Number) o `null`, **nunca** el texto libre, que va en `v-model:custom` (String; `combobox.md`, #331); reservado para `multiple`: Array (#338) |
| `locale` | String | etiqueta BCP 47 | según componente | Formato e idioma de fechas y números con `Intl`. Sin valor: `GDatePicker`, el de `<html lang>` (o `navigator.language`); `GCalendar`, el del entorno; **`GNumberField`, el `lang` del ancestro más cercano** (incluye `<html>`; un bloque `lang` manda dentro), luego `navigator.language`, leído al montar (#310). Un valor que `Intl` rechaza avisa en desarrollo |

## Reglas

- **Contexto de formulario** (DECISIONS.md #158, `design/contracts/form.md` §2): dentro de `GForm`, los campos (`GInput`, `GTextarea`, `GSelect`, `GCheckbox`, `GCheckboxGroup`, `GRadioGroup`, `GSwitch`, `GDatePicker`, `GNumberField` y `GCombobox` (a través del `GInput` que componen, #309, #330) y los propios con `useFormField()`) heredan `density`, `readonly`, `disabled`, `block` (en la rejilla) y su error por `name`. **La prop explícita siempre gana**; por eso esas props tienen default `undefined` en los campos y se resuelven a los defaults de esta tabla fuera de `GForm`. Dentro de un **`GFormReveal` inactivo** (`form.md` §14, #276) o de una **`GFormSection addable` sin agregar** (`form.md` §3, #288) los campos siguen registrados pero no cuentan (ni bloqueo, ni resumen, ni revelado) y salen del envío por su `fieldset disabled`; no cambia su API. Dentro de una **`GFormSection collapsible` plegada** siguen contando y en el envío; la sección se abre antes de que el foco vaya a uno de ellos (#287).
- **Mensajes de campo** (#164): `error`, `warning` y `valid` (String) comparten una región viva `g-<tag>__message`, dentro del pie `g-<tag>__support` (r02, #176); solo `error` pone `aria-invalid`.
- **Obligatorio en controles de elección, en `GNumberField` y en `GCombobox`** (#269, #270, #311, #334): una casilla, un grupo de radios, un campo numérico o un combobox obligatorios lo exponen con **`aria-required="true"`** (en el `<input>` de la casilla; en el `radiogroup`, nunca en los radios; en el `spinbutton` visible de `GNumberField` y en el `combobox` visible de `GCombobox`, que no son los que se envían) y **nunca con `required` nativo**, que en Chromium expone casilla y radios como inválidos antes de interactuar (contra #157). `aria-invalid` solo con el error visible. `GInput`, `GTextarea` y `GInputGroupSelect` siguen con `required` nativo hasta medirlos (pendiente).
- **Estructura de campo en filas** (r02, #176): los campos que comparten línea en una `GFormRow` tienen tres hijos en flujo (etiqueta, caja, `__support`). **Valor calculado** (#180): prop `output` (String) en `GInput` y `GDatePicker`.

- Cada prop enumerada declara `validator` con su lista.
- Defaults de objeto o array como función.
- Clases de estado: `g-<tag>--color-*`, `--variant-*`, `--size-*`, `--density-*`, `--rounded-*`, `--block`, `is-disabled`, `is-loading`.
- Sin estilos en línea, salvo variables CSS dinámicas justificadas.

## Patrón (JS)

```js
const oneOf = (list) => (v) => list.includes(v)

export const sharedProps = {
  color: { type: String, default: 'brand', validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  variant: { type: String, default: 'solid', validator: oneOf(['solid', 'soft', 'outline', 'ghost', 'link']) },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
  rounded: { type: String, default: undefined, validator: oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill']) },
  block: Boolean,
  disabled: Boolean,
  loading: Boolean,
}
```

## Patrón (CSS, lo escribe coco)

La variante solo reasigna a qué token apunta el componente; el esqueleto tiene una sola regla por propiedad.

```css
.g-btn {
  background: var(--_btn-bg);
  color: var(--_btn-fg);
  border-radius: var(--_btn-radius);
}
.g-btn--color-brand.g-btn--variant-solid {
  --_btn-bg: var(--g-color-brand);
  --_btn-fg: var(--g-color-on-brand);
}
```

Las variables `--_*` son alias locales del componente, no tokens del tema: no se documentan en el contrato global. El prefijo `--g-` queda reservado para tokens del contrato, incluidos los tokens de componente como `--g-btn-radius` cuando lima los apruebe.

## Servicios imperativos (gestor + región)

Para lo que nace de un **evento** y no de un estado de la vista (primer caso: avisos, `design/contracts/toast.md`, DECISIONS.md #140), Grana no ofrece un componente declarativo ni una instancia global:

- `create<Servicio>(options)` crea **el gestor de la aplicación** (objeto con métodos y estado reactivo de solo lectura) y es **plugin de Vue** (`app.use(gestor)` lo provee con una `InjectionKey` exportada).
- `use<Servicio>()` lo inyecta; sin gestor provisto, aviso en desarrollo y `undefined`.
- Un componente `G<Servicio>` pinta **una** región del gestor (prop opcional con el gestor; por defecto, el inyectado).
- Las opciones usan los nombres compartidos cuando existen (`labels` sin valores por defecto, `position` lógica con `start`/`end`); los callbacks van en las opciones (`onDismiss`, `action.onClick`), no como eventos de la región.
- Importar el paquete y crear el gestor no toca `document` ni `window` (SSR).
- `createIcons` (registro de iconos de la aplicación, `icons.md` §5; #200) usa la **misma forma de plugin** (`app.use(registro)`, `iconsKey` exportada, sin efectos al importar ni al crear), sin `use<…>()` público ni componente de región.
- **Captura de voz** (`design/contracts/speech.md`, DECISIONS.md #207 a #226): segundo servicio con el patrón completo, en su **propia entrada `@grana/vue/speech`** (#238: quien no la usa no la paga; su `app.use` registra también sus tres componentes). `createSpeech(options)` crea el gestor (plugin, `speechKey`), `useSpeech()` lo inyecta y `<GSpeechHost />` pinta **la** región (canales vivos, pill flotante, panel, hoja móvil). Añade dos piezas que leen el mismo gestor: `GSpeechTrigger` (disparador) y `GSpeechPill` (pill colocable, una por gestor). Los métodos que cambian de estado devuelven `Promise<boolean>` y **nunca rechazan** (los fallos van al estado y a `onError`). La lógica que no es de Grana (el motor) entra por un **adaptador** que aporta la aplicación: Grana define su interfaz y sigue sin red. Una entrada de pruebas `@grana/vue/testing` trae el adaptador simulado. Usa los nombres compartidos `position` (lógica, para su pill flotante), `offset`, `hotkey` y `labels`. **Fase 2** (#241 a #256): la misma entrada añade un **modelo de datos con operaciones** (`createTranscript(data?)`: capas literal / corregido / derivado, historial compartido por las vistas y fuera de `toJSON()`, `onChange`), la vista **`GTranscript`** (rejilla APG; `v-model:selected` como `GTable`, `headingLevel` como `GCard`, `maxHeight` como `GTable`; nombre por las props `labelledby`/`label` porque es de la rejilla, no de la raíz) y **destinos ligados al modelo del formulario** (`{ id, label, get, set }`, `useSpeechTarget`, `speech.targets`), sin API nueva en los campos ni en `GForm`. Las operaciones del modelo, como los métodos del gestor, **nunca lanzan**: devuelven `false` y avisan en desarrollo.
- **`__shared` es interno** (#240): `@grana/vue` exporta `__shared` (`src/shared.js`) únicamente para que las entradas `@grana/vue/speech` y `@grana/vue/status` reutilicen las mismas instancias. No es API pública, no tiene promesa de estabilidad y nadie fuera de Grana debe importarlo.
- **Isla de estado** (`design/contracts/status.md`, DECISIONS.md #315 a #325): tercer servicio, en su **propia entrada `@grana/vue/status`** (global UMD `GranaStatus`; #317 corregido por #328: medido +14,7 KB gzip sobre el principal, tope de 8 KB superado, mismo criterio que #238; `app.use(status)` registra también sus tres componentes; el CSS sigue en `grana.css`). `createStatus(options)` crea el gestor (plugin, `statusKey`), `useStatus()` lo inyecta y `<GStatusIsland />` pinta **la** región. **Variación del patrón: una condición es estado con clave, no un suceso** (#318): los métodos llevan `id` (`set(id, options)` declara o sustituye en el sitio, `update`, `resolve`, `remove`, `announce`), y **sí hay un declarativo sin pintura**, `<GStatus>`, que registra mientras está montado y limpia al desmontarse (lo que #140 descartó para `GToast` aquí es lo natural). Segunda pieza que lee el gestor: `GStatusMark` (marca junto al origen). Tipos `info` `success` `warning` `error` (sin `neutral` ni `loading`; `error` lee `danger`); nombres compartidos `position` (solo `top-*`), `offset`, `hotkey`, `labels`, y `description` como en `GToast`. Los métodos nunca lanzan.
- **Entradas propias que no son servicios** (#337): **`@grana/vue/combobox`** (global UMD `GranaCombobox`) exporta `GCombobox` y, por defecto, un plugin que solo lo registra (`app.use(Combobox)`); no hay gestor ni `use…()`. Mismo criterio de peso que #238 y #328 (tope de 8 KB gzip para entrar en el principal) y mismo mecanismo `__shared` (#240); el CSS sigue en `grana.css`. **`@grana/vue/file-field`** (global UMD `GranaFileField`; `file-field.md`, #367) sigue el mismo patrón: exporta `GFileField`, la utilidad `formatFileSize` y un plugin; recibe `useFormField` y las claves de contexto por `__shared` (una copia propia crearía otro `Symbol` y el campo no vería su `GForm`).
- **Convivencia de servicios:** cada uno tiene **sus** canales vivos y **su** atajo (F8 avisos, Mayús+F8 voz, **Alt+F8 isla de estado**). **Un suceso, un canal:** o aviso flotante o isla. Orden en un borde compartido: voz → isla → avisos (registro interno con `order`, #322). Cuando dos regiones comparten borde del visor, el elemento **persistente** (pill de voz) conserva el borde y el **transitorio** (avisos) se apila por dentro, con un registro interno de reservas por documento (no es API; `speech.md` §6.7, #225). El seguimiento del `<dialog>` modal superior es un útil interno compartido (`utils/topModal.js`, #213).

## Paneles anclados: cuatro reglas comunes (#358)

Valen para todo panel que se coloca junto a un ancla y sigue al desplazar la página: `GCombobox` (`appearance="field"`), `GSelect`, `GMenu`, `GDatePicker` (popover), `GHelper` (popover) y el editor de `GFilterBar`. La lógica compartida vive en `utils/anchor.js` (`stickySide`, `setVar`, `followFrame`, `anchorGone`); cada contrato solo remite aquí.

1. **El lado se decide al abrir y se conserva.** Solo cambia, con histéresis, si el lado actual ofrece menos de `space × 40` **y** el otro ofrece al menos `space × 12` más. Nunca se reevalúa «a secas» en cada cuadro del desplazamiento.
2. **`--_max` queda fijo durante el desplazamiento.** Se calcula al abrir, al cambiar el contenido, al redimensionar y al cambiar de lado; mientras se desplaza la página solo se escribe la posición (una vez por cuadro y solo si cambia), de modo que el alto del panel no «respira».
3. **Si el ancla sale de la vista, el panel se cierra, sin devolver el foco** (devolverlo desplazaría la página). «Salir» es salir del visor o del contenedor con desplazamiento que contiene al ancla. No rige en la **hoja móvil** (≤ ~520px, #42, #56), que no sigue a un ancla.
4. **El puntero quieto nunca desplaza la lista.** Mantener el puntero sobre una opción mientras la página o la lista se desplaza no cambia la opción activa ni mueve el scroll; solo activa un movimiento real del puntero. La opción activa por teclado sí se mantiene a la vista, desplazando el panel y nunca la página.

Los umbrales derivan de `space`; no hay tokens nuevos. Se verifica con `tests/panel-estable.spec.mjs` (vaivén de ±20px sin cambios de lado y cierre al salir del visor, en los tres motores).

**`GTooltip`** (`design/contracts/tooltip.md`, #386) sigue las reglas **1** y **3** con una salvedad: la regla 1 en su forma **estricta** (el lado se decide al abrir y no cambia mientras está abierto, sin histéresis; se reevalúa al reabrir y al viajar de un control a otro), con `followFrame` y `setVar`; la 3 con `anchorGone`. Las reglas **2** (`--_max`) y **4** (lista) **no aplican**: el tooltip no tiene alto máximo ni lista. Sin hoja móvil.

## Nodos hermanos de `GTooltip` (#383)

`GTooltip` no añade envoltorio: renderiza su nodo `role="tooltip"` (`.g-tooltip`, `popover="manual"`) **inmediatamente después** de la raíz del control que envuelve (también con `<GBtn tooltip>`, #390). Cerrado no ocupa sitio, pero **cuenta para los selectores estructurales** (`:last-child`, `:only-child`, `:nth-child()` de los siguientes, `:nth-last-child()`, `+` y `~` desde el control). Regla para el CSS de Grana que selecciona por estructura **hijos que pone la aplicación**: ignorar `.g-tooltip` (`:nth-last-child(1 of :not(.g-tooltip))` en lugar de `:last-child`; en una combinación adyacente, también la variante `A + .g-tooltip + B`, o `:has()`). Un `:first-child` no se ve afectado. Revisión inicial y archivos afectados: `tooltip.md` §«Nodo hermano». Los selectores sobre piezas internas de un componente no cambian mientras esas piezas no lleven tooltip.

## Iconos en los componentes: «dato → nombre; plantilla → slot» (#202)

Contrato de iconos: `docs/contract/icons.md` v0.2 (`GIcon` público, registro `createIcons`, solo Lucide). Regla única para todos los componentes:

- **Dato → nombre.** Cuando el contenido llega como **arreglo de datos** (`items`), el campo `icon` admite una **cadena con el nombre de Lucide**. Si el item trae `icon` cadena y **no** hay slot `icon`, el componente dibuja `<GIcon :name="item.icon">` (resolución de la aplicación: registro → librería, `icons.md` §5.4) dentro de su hueco `aria-hidden`. **Con slot `icon`, manda el slot** (recibe el item como hoy y decide). Un `icon` que **no** es cadena sigue siendo un dato opaco que solo recibe el slot; sin slot no se dibuja nada (comportamiento de siempre: compatible). Un nombre que no existe deja el hueco vacío y avisa en desarrollo (aviso de `GIcon`). Aplica a **`GTabs`**, **`GMenu`**, **`GSidebar`** (items de primer nivel; los hijos de `GSidebar` no llevan icono), **`GRadioGroup`** (`options`, #267) y **`GCombobox`** (`options`: `icon` cadena en el hueco inicial si la opción no trae `avatar`; con slot `lead`, manda el slot; #335).
- **Plantilla → slot.** Cuando el componente se escribe en plantilla, el icono va en su **slot** con un `<GIcon>` dentro (una línea). **Sin props nuevas** de icono en `GBtn`, `GInput`, `GSelect`, `GSwitch`, `GBadge`, `GCard`, `GDialog`, `GFormSection` ni en el resto. En **`GBtn`, `icon` sigue siendo Boolean** (modo solo icono, con aviso si falta `aria-label`); nunca un nombre.
- **Nombres reservados:** `prependIcon` y `appendIcon` (icono por nombre en un componente suelto) no existen en v0.2 y no se usan para otra cosa; si algún día se piden, tendrán ese nombre.
- **Todo hueco de icono es decorativo:** el componente lo envuelve con `aria-hidden="true"` (en el slot por defecto de `GBtn` solo icono y en `trigger` de `GHelper`, el `GIcon` sin `label` ya es decorativo por sí mismo). El nombre accesible lo da el texto o el `aria-label` del control. Un `GIcon` con `label` dentro de un hueco avisa en desarrollo (`icons.md` §2.4).
- **Lo que no es Lucide** (logotipo, avatar, imagen) va en el slot, nunca en `GIcon`. Un avatar es **`GAvatar`** (`avatar.md`): en un hueco de Grana **el avatar manda su caja** (`space × n` de su `size`) y el hueco la adopta y **pierde su marco** si su hijo directo es `.g-avatar` (#295): `GCard` `lead` → `lg`, `GTable` `leading-{key}` → `md`, `GMenu` y `GSelect` `icon` → `xs` (hueco a `space × 5`).
- **`GAvatar` es la excepción acotada a «plantilla → slot»** (#296): su prop `icon` es un **nombre** porque el icono es el contenido de la identidad (dato), no la decoración de un control; no tiene slots.
- **El tamaño lo manda el hueco** (alias local de cada componente). Una clase de la aplicación sobre el `GIcon` gana **siempre**, también dentro de un hueco, porque la aplicación va sin capa (#4): por eso **no se ponen clases de tamaño en un icono dentro de un hueco**; si hace falta otro tamaño, se cambia el contenedor (`size`, `density`, tema; `icons.md` §2.2, #204).

### Mapa de huecos

| Componente | Hueco | Alcance | Desde datos (`icon` cadena) |
| --- | --- | --- | --- |
| `GBtn` | `prepend`, `append`; con `icon` (Boolean), el slot por defecto | | — |
| `GInput` | `prepend`, `append` | | — |
| `GNumberField` | `prepend` (sin `append`: el final de la caja es de −/+, #310) | | — |
| `GSelect` | `prepend`; `icon` de cada opción (sustituye al prefijo en la elegida, #58) | `{ option }` | — (candidato, `icons.md` §9) |
| `GCheckbox` | `icon` (solo `layout="card"`) | | — |
| `GSwitch` | `icon-on`, `icon-off` (sustituyen a `check` / `minus` del pulgar) | | — |
| `GDatePicker` | `icon` (sustituye a `calendar`) | | — |
| `GBadge` | `icon` | | — |
| `GStepper` | `icon` (solo `indicator="icon"`; sin él, el número) | `{ step, index, state }` | — (candidato, `icons.md` §9) |
| `GWidget` | `icon` (encabezado) | `{ level }` | — |
| `GCard` | `lead` (icono o avatar, #123) | `{ size, layout }` | — |
| `GDialog` | `icon` (antes del título) | | — |
| `GFormSection` | `lead` (antes del título; nuevo, #203; en `mode="collapsible"`, dentro del botón del título, tras el chevron, #285) | | — |
| `GTabs` | `icon` | `{ item, index, active }` | **Sí** (`item.icon`); en `labelMode="icon"`/`auto` un `icon` cadena cuenta como icono |
| `GMenu` | `icon` | `{ item }` | **Sí** (`item.icon`) |
| `GSidebar` | `icon` (items); `toggle-icon`, `search-icon`, `more-icon` | `{ item }`; `{ collapsed }` | **Sí** (`item.icon`, primer nivel); los otros tres, solo slot |
| `GRadioGroup` | `icon` (por opción, `aria-hidden`); `option` sustituye icono y texto | `{ option, index, checked }`; `{ option, index, checked, disabled }` | **Sí** (`option.icon`); en `labelMode="icon"` un `icon` cadena cuenta como icono |
| `GCombobox` | `prepend` (campo; se oculta mientras hay ficha); `lead` (hueco inicial de cada opción, de la ficha y de la vista previa; icono o `GAvatar`) | `{ option }` | **Sí** (`option.icon`; `option.avatar` para un `GAvatar`) |
| `GHelper` | `trigger` (contenido del botón disparador; por defecto `circle-question-mark`, #206) | `{ open }` | — |
| `GAvatar` | Sin hueco ni slot: el icono es **contenido** (respaldo por defecto `user`, solo librería) | | **Sí**, como prop `icon` (nombre; #296) |

Los iconos **propios** de cada componente (cierre, marcas, chevrons, estados) no son huecos: los dibuja el componente con la lista de la librería (`icons.md` §4) y la aplicación no los cambia por el registro. `GSpeechHost`, `GSpeechPill` y `GSpeechTrigger` **no tienen huecos de icono** en la Fase 1: todos sus iconos son de estado o de control (`speech.md` §13). `GTranscript` (Fase 2) tampoco: sus iconos son de acción y de marca (`speech.md` §28.2).
