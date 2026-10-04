# GInput

Campo de texto de una línea, completo: etiqueta, ayuda, mensaje de error, iconos, contador y, en contraseñas, botón para mostrar u ocultar. Con el slot `action`, un botón (`GBtn`) queda acoplado al final del campo.

**Etiqueta:** `<g-input>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/input/auditoria.md`](../../../../../design/lab/input/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0` (usa `useId`).

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

```vue
<g-input v-model="correo" label="Correo" type="email" required autocomplete="email"
         hint="Te enviaremos el comprobante." :error="errorCorreo" @blur="validar" />
```

Los atributos nativos (`name`, `placeholder`, `maxlength`, `autocomplete`, `inputmode`, `aria-*`, escuchas como `@blur`) van al `<input>`; solo `class` y `style` van a la raíz.

> **En plantillas dentro del HTML** (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-input ...></g-input>`.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` (`v-model`) | String | | `''` |
| `variant` | String | `outline` `soft` | `outline` |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | sin valor: foco del tema |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor: radio `sm` del tema |
| `block` | Boolean | | `false` |
| `disabled` | Boolean | | `false` |
| `readonly` | Boolean | | `false` |
| `loading` | Boolean | | `false` |
| `type` | String | `text` `email` `password` `search` `tel` `url` | `text` |
| `label` | String | | sin valor |
| `hint` | String | | sin valor |
| `error` | String | | sin valor |
| `required` | Boolean | | `false` |
| `counter` | Boolean | | `false` |
| `showPasswordLabel` | String | | sin valor |
| `hidePasswordLabel` | String | | sin valor |
| `id` | String | | generado |

Un valor fuera de la lista muestra una advertencia en desarrollo. Otros tipos de entrada (`number`, fecha, archivo) y varias líneas no están en esta versión.

- **`variant`:** `outline` (caja con borde) y `soft` (caja rellena con una línea inferior). `solid`, `ghost` y `link` no aplican a un campo y se rechazan.
- **`color`:** solo colorea el anillo de foco y el borde mientras el campo tiene el foco. El error usa siempre `danger`.
- **`rounded`:** `shape: "pill"` del tema **no** afecta a los campos; solo `rounded="pill"` en el propio campo.
- **`label`:** el campo necesita un nombre accesible. Sin `label`, sin slot `label` y sin `aria-label` ni `aria-labelledby`, en desarrollo se emite `console.warn`.
- **`error`:** con texto, el campo queda inválido (`aria-invalid="true"`) y se muestra el mensaje. **El campo no valida:** tú decides cuándo hay error (al salir del campo, al enviar).
- **`required`:** pone el atributo nativo `required` y una marca visual junto a la etiqueta. El envío lo valida el formulario nativo.
- **`counter`:** muestra `n/máx` y necesita un `maxlength` (que va al `<input>`). Sin `maxlength`, no se muestra y, en desarrollo, se avisa.
- **`loading`:** muestra un indicador y pone `aria-busy`. **No bloquea la escritura**: sirve para una validación asíncrona.
- **`disabled` / `readonly`:** atributos nativos. `readonly` sigue enfocable y se envía; `disabled`, no.
- **`type="password"`:** el botón mostrar/ocultar solo aparece si das **`showPasswordLabel` y `hidePasswordLabel`**. No tienen valor por defecto porque Grana es internacional: un texto fijo estaría en el idioma equivocado. Sin ellas, el campo funciona sin botón y, en desarrollo, se avisa.
- **`id`:** si no lo das, se genera uno estable; de él derivan los ids de la ayuda y del error.

```vue
<g-input v-model="clave" label="Contraseña" type="password" required
         show-password-label="Mostrar contraseña" hide-password-label="Ocultar contraseña" />
```

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `String` | El usuario cambia el valor |

Los demás eventos (`focus`, `blur`, `change`, `keydown`…) no se declaran: al ir los atributos al `<input>`, tus escuchas reciben el evento nativo.

## Slots

| Slot | Contenido |
| --- | --- |
| `label` | Etiqueta con contenido rico (sustituye a `label`) |
| `prepend` | Icono antes del texto. Decorativo: el componente lo marca con `aria-hidden="true"` |
| `append` | Icono después del texto. Igual que `prepend` |
| `hint` | Ayuda con contenido rico (sustituye a `hint`) |
| `error` | Mensaje de error con contenido rico; solo se muestra si `error` tiene valor |
| `action` | Botón de acción acoplado al final del campo (ver abajo) |

### Iconos (prefijo y sufijo)

Los iconos son de [Lucide](https://lucide.dev) con [`GIcon`](../GIcon/README.md) en el slot: los de la lista de la librería sin más; los demás (`search`, `mail`…) los registra tu aplicación con `createIcons` importándolos de `lucide-static` (ver el README de `GIcon`).

```vue
<g-input v-model="q" label="Buscar" type="search">
  <template #prepend><g-icon name="search"></g-icon></template>
  <template #append><g-icon name="circle-check"></g-icon></template>
</g-input>
```

`prepend` y `append` se ocultan a los lectores de pantalla: úsalos para iconos (`GIcon` decorativo, sin `label`), **no** para texto que el usuario deba leer (como "$" o "https://"). El componente no fija el tamaño del icono: `GIcon` mide 1em del texto del campo y toma su color.

### Botón de acción (`action`)

Un slot con alcance: recibe `size`, `density` y `disabled` del campo, para que el botón tenga la misma altura y se deshabilite con él. Pon **un** `GBtn`.

```vue
<form @submit.prevent="suscribir">
  <g-input v-model="correo" label="Correo" type="email" block>
    <template #action="{ size, density, disabled }">
      <g-btn type="submit" :size="size" :density="density" :disabled="disabled">Suscribirse</g-btn>
    </template>
  </g-input>
</form>
```

- **Enter en el campo** envía el formulario solo si hay un `<form>` con un botón `type="submit"`; fuera de un formulario no ocurre nada y escuchas `keydown.enter` tú. Enter y Espacio activan el botón.
- **Carga de la acción:** usa `loading` del propio `GBtn`. Verificado con un formulario real: tres Enter seguidos generan un solo envío. El `loading` de `GInput` es otra cosa.
- **Botón solo icono:** `<g-btn icon aria-label="Buscar" …>` (el `aria-label` es obligatorio en `GBtn icon`).
- **Anchos estrechos:** por debajo de ~300px de ancho del campo, un botón con texto pasa debajo, a ancho completo. Un botón solo icono se queda a la derecha.
- **Ancho por defecto:** 240px sin acción y 360px con acción; con `block`, el 100% del contenedor.
- El error describe al **campo** y va debajo del conjunto.

## Accesibilidad

- **Etiqueta y `input`:** asociados con `for`/`id`. Nunca se sustituye la etiqueta por el `placeholder`.
- **Ayuda y error:** se enlazan al `<input>` con `aria-describedby`. La región del error existe siempre (vacía si no hay error) con `aria-live="polite"`.
- **El error no depende solo del color:** lleva texto, un icono `triangle-alert` de Lucide que los lectores de pantalla no leen, y un borde de doble grosor.
- **Botón mostrar/ocultar:** su texto visible es su nombre accesible (`showPasswordLabel` u `hidePasswordLabel`), sin `aria-pressed` (un botón cuyo nombre cambia con el estado no debe llevarlo). Va **después** del campo en el orden de tabulación y conserva el foco.
- **Teclado:** Tab y Shift+Tab recorren campo → botón mostrar → acción. Sin manejadores propios: escritura, selección y portapapeles son los del `<input>`.
- **Foco:** anillo de `--g-focus-width` pegado al borde (sin hueco), con transición de color. Con botón de acción, un solo anillo rodea caja y botón cuando el foco está en el campo; el botón enfocado tiene el suyo. El botón mostrar tiene el suyo.
- **Área táctil:** con `pointer: coarse`, la caja y el botón de acción miden al menos 44px.
- **Contraste:** con el tema por defecto y con el tema de prueba de la auditoría, texto, ayuda, error, `placeholder` y botones llegan a 4.5:1 o más; el borde de la caja, a 3:1 o más (3.45:1 con el tema por defecto).

## Movimiento

- El borde y el fondo cambian en `--g-duration-fast` (120ms).
- El indicador de carga gira en `--g-duration-spin` (800ms).
- Con `prefers-reduced-motion: reduce`, se quitan las transiciones de desplazamiento y el indicador de carga sigue girando, 2.5 veces más lento; el mensaje solo se funde.
- El mensaje que aparece y la sacudida al enviar con error tienen su propia sección: [Personalidad](#personalidad).

## Personalidad

El campo **habla con el cuerpo, pero solo cuando importa**: su mensaje sale de la caja en lugar de aparecer pegado de golpe, y el «no» de un formulario es un gesto de una sola vez. Sin props, slots ni eventos nuevos. Origen: ronda de kiwi [`design/lab/personalidad/r01/`](../../../../../design/lab/personalidad/r01/) (§7); decisiones #299, #304 y #306 en `DECISIONS.md`.

**El mensaje sale del campo.** Cuando `g-input__message` pasa de vacía a tener texto (error, advertencia o válido), entra con fundido y baja `--g-space-1 × 1` (4px con el espacio por defecto) desde la caja, en `--g-duration-press` con `--g-ease-out`. Por qué: el ojo va del campo a su mensaje. Es una **transición**, no una animación con keyframes (#306): el estado de partida es la región vacía, y la transición solo existe cuando la raíz lleva `is-ready`.

- **Nada al montar:** `is-ready` llega dos cuadros después de montar (tras el primer pintado, nunca en SSR), así que un error que ya viene al montar no se anima, tampoco cuando llega la clase.
- **Cambiar el texto o el tipo** con el mensaje ya visible no la repite. El hueco aparece en un cuadro, como antes.
- **Con `prefers-reduced-motion: reduce`:** solo fundido (`--g-duration-fast`), sin desplazamiento. La región viva sigue siendo la misma: el anuncio no cambia.

**Un solo aviso al enviar.** Dentro de un `GForm`, al enviar con errores (no con un botón `formnovalidate`) o al llamar a `showErrors()`, cada campo que **bloquea** el envío niega una vez con la cabeza: una sacudida horizontal decreciente, de **4px como máximo** (`--g-space-1`), en `--g-duration-slow`. Señala **cuáles** fallaron, también los que quedan fuera del foco, y es la identidad del «no» del formulario. Por qué: lo pone `GForm` y no el campo porque solo el formulario sabe qué bloquea un envío; así el campo no distingue envíos de interacciones.

- **Cómo:** `GForm` pone la clase `is-rejected` en la raíz de cada campo que bloquea (en el cuadro siguiente al envío); el CSS mueve la fila del campo (`g-input__row`: la caja con su acción, para que el anillo de foco vaya con ella). La clase se retira cuando termina la animación (`animationend` o `animationcancel` de una animación `g-reject…`), con el siguiente `input` o `change` del campo, o al desmontarse. Un envío nuevo la quita y la vuelve a poner. Fuera de un `GForm`, el campo nunca la recibe.
- **Nunca** al escribir, al salir del campo ni al montar.
- **Con `prefers-reduced-motion: reduce`: no hay sacudida.** La clase se pone igual pero sin efecto visible, y sin animación no hay `animationend`: se queda hasta el siguiente `input`, `change` o envío. El error ya es borde doble, icono y texto, así que no se pierde información.
- **RTL:** la sacudida empieza hacia la izquierda física en los dos sentidos; no transmite dirección.
- La sacudida la comparten `GTextarea`, `GSelect` y los demás campos de formulario; qué pieza se mueve en cada uno está en [`GForm`](../GForm/README.md#personalidad-rechazo-al-enviar).

### Verificación

Spec `design/lab/theme-playground/tests/personalidad-input.spec.mjs` sobre el `GInput` real del UMD, en Chromium, Firefox y WebKit (coco, [`estilo.md`](../../../../../design/lab/input/estilo.md), «Personalidad»; 30 de 30 en los tres motores en su entrega). Las medidas de la sacudida pausan la animación real en cuanto llega `is-rejected` y recorren su tiempo cada 2ms, así que no dependen de la carga de la máquina:

| Medida | Resultado (los tres motores) |
| --- | --- |
| Sacudida: desplazamiento máximo | 3,958px (≤ 4px; kiwi, en tiempo real, 3,47px) |
| Picos en 16, 36, 56 y 76 % | 3,96 · 2,94 · 1,96 · 0,97 (decreciente) |
| Cambios de sentido / posición final | 3 / 0px |
| Duración / iteraciones | 240ms / 1 |
| La clase se retira con el `animationend` real | sí; dura al menos 230ms, no por temporizador |
| Escribir y salir del campo tras un envío | 0 animaciones |
| Segundo envío | se repite |
| Sacudida con `reduce` | clase presente, 0 animaciones, desplazamiento 0 |
| Mensaje: al aparecer | `opacity` y `translate` en 160ms; de −4px a 0; 8 muestras intermedias de 10ms, monótono |
| Mensaje: cambiar el texto con la región llena | 0 transiciones |
| Mensaje: error ya presente al montar | 0 animaciones, también al llegar `is-ready` |
| Mensaje con `reduce` | solo `opacity`, 120ms; `translate` 0 |

**Sin verificar:** lector de pantalla real (la región viva no cambia, pero no se escuchó), Safari real, táctil real y `forced-colors` real (`translate` y `opacity` no tocan los colores del sistema).

## Tema

El componente solo lee tokens `--g-*`. Ojo: **un tema que solo cambie `brand` no cambia los campos.** `brand` es la acción principal; el campo usa `accent` (foco), la escala de radios, los neutros y `danger`. Para cambiar su aspecto, redefine los tokens **sin capa** (siempre ganan sobre el tema por defecto):

```css
:root {
  --g-color-accent-text: #6d28d9;  /* anillo de foco (--g-color-focus lo toma de aquí) */
  --g-color-border-control: #5b6b8c; /* borde de la caja en reposo */
  --g-color-surface-sunken: #eaf0fd; /* relleno de la variante soft y de solo lectura */
  --g-radius-sm: 9px;               /* esquinas del campo */
}
```

Tokens que consume: `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-border-control`, `--g-color-border-strong`, `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle`, `--g-color-danger-text`, `--g-color-focus`, `--g-color-{color}-text`, `--g-radius-*`, `--g-space-1..6`, `--g-font-ui`, `--g-text-{caption|body-sm|body}-{size|line}`, `--g-text-action-weight`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset`, `--g-duration-{fast|press|slow|spin}`, `--g-ease-{standard|out}`. La definición de cada uno está en `docs/contract/tokens.md`.

## Dentro de un formulario

Con un `GForm` alrededor el campo lee su contexto: densidad, solo lectura, deshabilitado, ancho completo y el error de `errors[name]` (que `GForm` muestra cuando toca: al salir tras escribir, al elegir o al enviar). **La prop explícita del campo siempre gana**; fuera de `GForm` se comporta exactamente como antes. Guía completa del sistema: [`GForm/README.md`](../GForm/README.md).

- **Marcas por convención** del formulario (`marks` de `GForm`): «(opcional)» como texto dentro de la etiqueta (forma parte del nombre accesible) o asterisco con `required`, nunca las dos; `mark: false` quita la del campo.
- **Un solo mensaje** bajo el campo, `g-input__message` (región viva siempre presente): `error` (icono `circle-alert`, borde doble), `warning` (`triangle-alert`, borde **discontinuo** doble) o `valid` (`circle-check`, borde sencillo de éxito), en ese orden de prioridad, con un prefijo oculto («Error: », «Advertencia: », «Correcto: », de `labels` de `GForm`). Sustituye a la antigua región `__error`.
- **En una `GFormRow`** comparte línea con otros campos: la raíz tiene tres hijos (etiqueta, caja y `g-input__support` con ayuda y mensaje) y las cajas de una línea quedan a la misma altura aunque una etiqueta ocupe dos líneas. El tamaño en la fila se da con `g-form-w-xs|sm|md|lg`.
- **`prefix`/`suffix`** (texto dentro de la caja: `$`, `kg`, `%`) con `prefixLabel`/`suffixLabel` para su expansión accesible («kilogramos»), y **`output`**: un valor que calcula la aplicación (`<output>` cortés al final de la caja, no se envía).
- **Solo lectura** (propia o por `GForm readonly`): relleno `--g-color-neutral-soft`, borde **discontinuo** `--g-color-border-control` (≥ 3.02:1 sobre el relleno, medido) y texto pleno; enfocable y seleccionable. Distinto de deshabilitado sin depender del color.

## Clases

Las emite el componente y las estiliza `GInput.css`: `g-input`, `g-input--variant-*`, `g-input--size-*`, `g-input--density-*`, `g-input--color-*` y `g-input--rounded-*` (solo si se pasan), `g-input--block`, `g-input--has-action`, `is-disabled`, `is-readonly`, `is-invalid`, `is-loading`, `is-ready` (tras el primer pintado), `is-rejected` (la pone `GForm`; ver [Personalidad](#personalidad)), y los elementos `g-input__label`, `g-input__required`, `g-input__row`, `g-input__control`, `g-input__prepend`, `g-input__field`, `g-input__append`, `g-input__loader`, `g-input__toggle`, `g-input__action`, `g-input__messages`, `g-input__hint`, `g-input__counter` y `g-input__support`, `g-input__message`.

## Limitaciones conocidas

- **Botón mostrar/ocultar con texto largo.** Con "Mostrar contraseña" mide unos 129px y en el ancho por defecto (240px) deja unos 77px al campo. Si traduces a un texto más largo, considera `block` o un texto más corto. No hay icono ni slot para sustituirlo.
- **Texto de 14px en táctil.** El texto sigue el tamaño del tema (`body-sm`, 14px por defecto); iOS Safari amplía la página al enfocar un campo con menos de 16px. Sube `fontSize` del tema a 16 o más, o usa `size="lg"` o `"xl"`.
- **Un solo botón de acción,** sin menús ni botón a la izquierda; sin variante separada del campo.
- **Umbral de apilado** de ~300px: es una constante de diseño (DECISIONS.md #34), no se cambia desde el tema.
- No hay tema oscuro todavía.
- **Sin verificar:** un lector de pantalla real (si la región viva junto a `aria-describedby` duplica el anuncio del error, y cómo se anuncia el conjunto con acción), las preferencias reales de `prefers-reduced-motion` y `forced-colors` (las reglas están escritas y se comprobaron aplicadas sin condición), el zoom al 200%, un dispositivo táctil real, y el autocompletado con gestores de contraseñas.

## Fuentes

- API: [`GInput.meta.json`](./GInput.meta.json) · Contrato: [`design/contracts/input.md`](../../../../../design/contracts/input.md) · Prototipos: [`design/lab/input/r01/`](../../../../../design/lab/input/r01/) y [`r02/`](../../../../../design/lab/input/r02/) · Estilo: [`design/lab/input/estilo.md`](../../../../../design/lab/input/estilo.md) · Personalidad: [`design/lab/personalidad/r01/`](../../../../../design/lab/personalidad/r01/) · Auditoría: [`design/lab/input/auditoria.md`](../../../../../design/lab/input/auditoria.md)
