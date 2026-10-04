# GNumberField

Campo para **un número que se escribe** (edad, peso, temperatura, porcentaje, cantidad): texto con forma de número que se escribe libre, se lee en el formato del idioma y, si lo pides, se ajusta con −/+ o con las flechas. El modelo es un `Number` o `null`, **nunca una cadena**, y el envío lleva el valor canónico (`72.5`), no el texto visible («72,5»). Compone [`GInput`](../GInput/README.md): etiqueta, caja, prefijo y sufijo, valor calculado (`output`), ayuda, mensajes, marcas y contexto de `GForm` son los de `GInput`.

**Etiqueta:** `<g-number-field>` · **Estado:** `candidate` (auditoría de coco aprobada, sin defectos bloqueantes; ver [`design/lab/number-field/auditoria.md`](../../../../../design/lab/number-field/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`, sección `GNumberField` y los signos vitales de «Alta de paciente»). Exige Vue `^3.5.0` (usa `useId`).

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

```vue
<script setup>
import { ref } from 'vue'

const peso = ref(72.5)   // Number o null, nunca una cadena
</script>

<template>
  <g-number-field
    v-model="peso"
    label="Peso"
    name="peso"
    :min="0" :max="400" :step="0.1" :precision="1"
    suffix="kg" suffix-label="kilogramos"
    hint="Con la coma o el punto: ambos valen."
  ></g-number-field>
</template>
```

Con ese ejemplo, en un navegador en español, el campo dice «72,5 kg» al salir y «72,5» al editar; `peso` vale `72.5` y un `<form>` nativo envía `peso=72.5`.

Los atributos nativos (`placeholder`, `autocomplete`, `form`, `inputmode`, `aria-*`, escuchas como `@blur`) van al `<input>` visible; solo `class` y `style` van a la raíz.

> **En plantillas dentro del HTML** (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-number-field ...></g-number-field>`.

### Por qué es un campo de texto y no `type="number"`

El `<input>` es **`type="text" role="spinbutton"`**, nunca `type="number"`: la rueda del ratón cambia el valor sin querer, las flechas y la validación nativas son confusas y el formato no sigue al idioma (criterio de GOV.UK). Con `role="spinbutton"` el árbol de accesibilidad conserva valor, límites y «incrementador». La **rueda del ratón no hace nada**. Lleva `inputmode` derivado de `precision` (`decimal`, o `numeric` con `precision` `0`; `$attrs` puede sobrescribirlo), `autocomplete="off"` por defecto y `dir="ltr"` siempre (sin él, el «-» de «-4,5» se dibuja al final en una página RTL).

Un identificador hecho de cifras (código postal, folio, teléfono, tarjeta) **no** es una cantidad: usa `GInput inputmode="numeric"`. El dinero con formato de moneda no está en esta versión.

### Fuera de rango: no se recorta

Grana no valida (DECISIONS #157). Lo escrito o pegado fuera de `min`/`max` **no se recorta** y el modelo lo conserva; el error de rango lo calcula tu aplicación y lo pasa en `error` (o en `errors` de `GForm`).

```vue
<g-number-field v-model="edad" label="Edad" name="edad" :min="0" :max="120" :precision="0" suffix="años"
                :error="edad != null && (edad < 0 || edad > 120) ? 'La edad debe estar entre 0 y 120 años.' : undefined"></g-number-field>
```

`min` y `max` limitan los **pasos** (flechas, −/+, Re Pág/Av Pág) y se exponen al árbol de accesibilidad; desde un valor fuera de rango, un paso hacia dentro entra al límite (Flecha abajo desde 150 con `max` 120 → 120).

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` (`v-model`) | Number \| null | número finito | `null` |
| `min` | Number | | sin valor |
| `max` | Number | | sin valor |
| `step` | Number | mayor que 0 | `1` |
| `precision` | Number | entero ≥ 0 | sin valor (decimales libres) |
| `locale` | String | etiqueta BCP 47 | sin valor (ver [Idioma](#idioma-locale)) |
| `grouping` | Boolean | | `true` |
| `prefix` | String | | sin valor |
| `suffix` | String | | sin valor |
| `prefixLabel` | String | | sin valor |
| `suffixLabel` | String | | sin valor |
| `steppers` | Boolean | | `false` |
| `decrementLabel` | String | | sin valor |
| `incrementLabel` | String | | sin valor |
| `name` | String | | sin valor |
| `label` | String | | sin valor |
| `hint` | String | | sin valor |
| `error` | String | | sin valor |
| `warning` | String | | sin valor |
| `valid` | String | | sin valor |
| `output` | String | | sin valor |
| `required` | Boolean | | `false` |
| `mark` | Boolean | | sin valor: lo decide `GForm` |
| `readonly` | Boolean | | sin valor: `GForm` o `false` |
| `disabled` | Boolean | | sin valor: `GForm` o `false` |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` |
| `variant` | String | `outline` `soft` | `outline` |
| `density` | String | `default` `comfortable` `compact` | sin valor: `GForm` o `default` |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | sin valor: foco del tema |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor: radio `sm` del tema |
| `block` | Boolean | | sin valor: `false` (dentro del layout de `GForm`, `true`) |
| `id` | String | | generado |

Un valor fuera de la lista de `size`, `variant`, `density`, `color` o `rounded` muestra una advertencia de Vue en desarrollo. `size`, `variant`, `density`, `color`, `rounded`, `block`, `label`, `hint`, `error`, `warning`, `valid`, `output`, `mark` e `id` pasan tal cual a `GInput`: mismas alturas, mismas reglas (ver su [README](../GInput/README.md)). `variant` solo admite `outline` y `soft`, y `color` solo colorea el foco, como en `GInput`.

**No existen:** `unit` (la unidad fija es `suffix`), `inputmode` como prop, `type`, `loading`, `counter`, `field` (nombre reservado) ni `controls` (el nombre es `steppers`). El ancho por defecto es el de `GInput` (240px; con `block`, el 100 % del contenedor).

### Modelo

- **`modelValue`:** `Number` finito o `null`. `undefined` (un `ref()` sin valor inicial) se lee como `null` sin aviso; `NaN` e `±Infinity` se leen como `null` **con aviso**. Una cadena la rechaza la comprobación de tipos de Vue en desarrollo; si es un número canónico («72.5») se muestra como ese número, y si no, como vacío. **El componente nunca emite cadenas.**
- **`precision`:** número de decimales. **Redondea el modelo en el acto** (con «36,55» escrito y `precision` `1`, el modelo ya vale 36,6) y **el texto al salir o con Enter** («36,6»); al salir se muestran siempre `precision` decimales (37 → «37,0»). Con `0` el separador decimal no entra. Si `step` (o `min`) tiene más decimales que `precision`, se avisa en desarrollo: el resultado de un paso se redondea y puede salir de la rejilla.
- **`step`:** los pasos encajan en la rejilla de `step` **contada desde `min`** (o desde 0 sin `min`): Flecha arriba desde 72,53 con `step` `0.1` → 72,6; Flecha abajo → 72,5. Sin error de coma flotante: 72,5 más tres pasos de 0,1 es exactamente 72,8. Un `step` menor o igual que 0 o no finito se sustituye por `1` y avisa.
- **Vacío más paso:** pone el **punto de partida**, que es `0` o, si 0 queda fuera de los límites, el límite más cercano (con `min` 30 y `max` 45, 30). No suma un paso a «nada».
- **`min` > `max`:** avisa y se ignoran **los dos** límites (sin límites en los pasos ni en el árbol). `min` decide también si se acepta el «-»: solo sin `min` o con `min` negativo.
- **`grouping`:** miles al salir con la regla del idioma (`Intl.NumberFormat`: en `es`, «1234,5» y «12.345»). Ponlo en `false` para cifras que no se agrupan nunca: un año en `en-US` sería «2,026». Mientras se escribe, nunca hay miles.

### Texto: crudo al entrar, `Intl` al salir

- **Al entrar** (foco): el texto crudo del modelo, sin miles y con el separador y las cifras del idioma. Si el texto estaba seleccionado entero, sigue seleccionado entero.
- **Al salir** (o con Enter): el formato de `Intl`, con miles y `precision`. «-», «,» o «-,» solos se vacían (el modelo pasa a `null`).
- **Texto parcial:** «1,» se respeta mientras se escribe (el modelo ya vale 1 y no emite otra vez). Un cambio de `modelValue` desde la aplicación que **no** coincide con lo escrito reescribe el texto; uno que coincide no lo toca, así no se pierde la coma a medio escribir.
- **Escritura:** solo entran cifras (del idioma y latinas), **un** separador decimal (si `precision` no es `0`) y «-» solo al principio y solo si se aceptan negativos. Lo demás no entra y el cursor se conserva. Durante una composición de IME no se filtra; se aplica al terminar.
- **Separador:** «,», «.» o «٫» se aceptan y **se convierten al del idioma al teclearlos** («36.5» se ve «36,5» en el acto). El teclado decimal del móvil sigue la región del sistema, no el idioma de la página; por eso valen todos.
- **Pegar:** se interpreta con una regla propia. Dos tipos de separador: el último es el decimal («1,234.5» → 1234,5). Uno repetido: miles. Uno solo seguido de exactamente tres cifras y que es el de miles del idioma: miles («12.345» en `es` → 12345). Si no, decimal. Lo que no es número no entra. Se inserta el texto crudo del número ya redondeado.

```vue
<g-number-field v-model="anio" label="Año" :grouping="false" :precision="0" :min="1900"></g-number-field>
<g-number-field v-model="poblacion" label="Población" :precision="0" placeholder="0"></g-number-field>
```

### Idioma (`locale`)

- **Resolución:** la prop `locale` › el atributo `lang` del **ancestro más cercano** (incluye `<html>`; un bloque `lang="ar-EG"` manda dentro de una página `es`) › `navigator.language`. Se lee **al montar** y cuando cambia la prop. Un `locale` que `Intl` rechaza avisa y sigue la cadena sin la prop.
- **Separadores, miles y cifras** salen de `Intl.NumberFormat`. Se muestran las **cifras del sistema del idioma**: con `ar-EG`, arábigo-índicas («-٤٫٥»); al escribir se aceptan las del idioma **y** las latinas. Las marcas bidi que `Intl` antepone (U+200E, U+200F, U+061C) se quitan del texto y de `aria-valuetext`.

```vue
<div lang="ar-EG" dir="rtl">
  <g-number-field v-model="grados" label="درجة الحرارة" :precision="1" suffix="°C"></g-number-field>
</div>
<g-number-field v-model="importe" locale="en-US" label="Quantity" :precision="2"></g-number-field>
```

### Envío (`name`) y valor canónico

`name` es una **prop** (como en `GSelect` y `GDatePicker`) y va a un `<input type="hidden">` con el valor canónico: punto decimal, sin miles ni exponente (`72.5`, `12345`, o `''` si está vacío). **El `<input>` visible no lleva `name`.** El oculto se deshabilita con el campo (no se envía), **sigue presente en solo lectura** (se envía) y copia el atributo `form` del consumidor. `name` también registra el campo en `GForm` (clave de `errors`).

```vue
<form @submit.prevent="enviar">
  <g-number-field v-model="m.peso" label="Peso" name="peso" :precision="1" suffix="kg"></g-number-field>
  <g-btn type="submit">Enviar</g-btn>
</form>
<!-- new FormData(form).get('peso') === '72.5' -->
```

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `Number \| null` | Cada cambio del **número** (no del texto): al escribir («1» → «1,» no emite), al pegar, en **cada** paso (también al repetir) y al redondear por `precision` |
| `change` | `Number \| null` | El **valor confirmado** cambia: al salir del campo o con Enter (si difiere del último confirmado) y **una vez por gesto de paso** (al soltar −/+, al soltar la tecla de paso o al activar −/+ sin puntero); nunca por cada paso repetido |

- **`change` es propio y está declarado:** tu `@change` recibe el `Number` confirmado y **no** el evento nativo del `<input>`. El nativo no sirve como «confirmado» (no salta con los pasos y sí con el reformateo de salida), y uno por cada paso repetido inundaría un autoguardado.
- **Último confirmado:** se fija al montar y con cada `change`. Un cambio de `modelValue` hecho desde la aplicación lo actualiza **sin** emitir.
- Los demás eventos (`focus`, `blur`, `keydown`, `input`, `paste`…) no se declaran: llegan nativos al `<input>` visible, **después** de los manejadores propios (una escucha `@input` tuya ya ve el `v-model` actualizado).

```vue
<g-number-field v-model="cantidad" label="Cantidad" :min="1" :max="99" :precision="0"
                steppers decrement-label="Restar" increment-label="Sumar"
                @change="guardar"></g-number-field>
```

## Slots

| Slot | Contenido |
| --- | --- |
| `label` | Etiqueta con contenido rico (como `GInput`) |
| `hint` | Ayuda con contenido rico |
| `error` | Mensaje de error con contenido rico |
| `prepend` | Icono decorativo antes del prefijo (con `aria-hidden`) |

**No hay `append` ni `action`:** el final de la caja es de −/+ y, con la unidad pegada al número, un icono al final la separaría de lo que sigue. Si los pasas, no se pintan y se avisa en desarrollo.

## Prefijo, sufijo y unidad

`prefix` y `suffix` son texto visible **dentro de la caja** (`kg`, `°C`, `%`, `×`), no interactivo: pulsarlo enfoca el campo. Con `prefixLabel`/`suffixLabel` el texto visible se oculta a los lectores y se lee la expansión («kilogramos»). Entran en `aria-describedby` antes de ayuda y mensaje. La unidad **no** entra en `aria-valuetext` (se leería dos veces). Regla idéntica a la de `GInput`.

```vue
<g-number-field v-model="temp" label="Temperatura" :min="30" :max="45" :step="0.1" :precision="1"
                suffix="°C" suffix-label="grados Celsius"></g-number-field>
```

**La unidad va pegada al número** (ver [Personalidad](#personalidad)): «72,5 kg» a unos 8px aunque la fila haga la caja de 300px.

### Unidad elegible (°C / °F)

No hay prop `unit`. Una unidad **fija** es un `suffix`; una **elegible** es otra pregunta: un `GSelect` «Unidad» en la misma `GFormRow` (dos preguntas, dos etiquetas). Es una composición de props ya verificadas, pero el conjunto no está en el playground ni en las pruebas.

```vue
<g-form-row>
  <g-number-field v-model="temp" class="g-form-w-sm" label="Temperatura" name="temp"
                  :precision="1" :suffix="unidad === 'C' ? '°C' : '°F'"></g-number-field>
  <g-select v-model="unidad" class="g-form-w-xs" label="Unidad"
            :options="[{ value: 'C', label: 'Celsius' }, { value: 'F', label: 'Fahrenheit' }]"></g-select>
</g-form-row>
```

La alternativa es un `GInputGroup` (una sola pregunta, un solo mensaje) con `GInputGroupInput inputmode="decimal"` y `GInputGroupSelect`; es la que usa la receta de signos vitales, pero ahí el valor es texto, no un `Number`. Un número como **parte** de un `GInputGroup` (`GInputGroupNumber`) está reservado, no existe.

## −/+ (`steppers`)

`steppers` pinta −/+ **dentro de la caja**, al final, solo si das **`decrementLabel` y `incrementLabel`**. No tienen valor por defecto porque Grana es internacional (un texto fijo estaría en el idioma equivocado); sin ellos no se pintan y se avisa en desarrollo.

```vue
<g-number-field v-model="qty" label="Cantidad" :min="1" :max="99" :precision="0"
                steppers decrement-label="Restar" increment-label="Sumar"></g-number-field>
```

- **Fuera del Tab, pero en el árbol:** son `<button tabindex="-1">` sin `aria-hidden`: el teclado ya tiene Flecha arriba/abajo y los lectores táctiles necesitan −/+ para ajustar sin teclado. Nombre accesible = su texto oculto + la etiqueta del campo («Restar Peso (opcional)»); respeta el slot `label`. Sin etiqueta visible, usan el `aria-labelledby` o el `aria-label` que pases al campo.
- **Puntero:** `pointerdown` con el botón principal da un paso y **no mueve el foco**: sin foco previo, el campo no se enfoca (en un móvil, sumar no abre el teclado). **Al mantener**, otro paso a los 400ms y luego cada 60ms; se detiene al soltar, al perder la ventana el foco, al llegar al límite, al deshabilitarse y al desmontar. Un `change` por gesto.
- **Sin puntero:** un `click` sin posición (lector de pantalla, activación por teclado de una tecnología de apoyo) da **un** paso con su `change`.
- **Deshabilitados en los límites:** − con el modelo menor o igual que `min`, + con el modelo mayor o igual que `max` (con 150 y `max` 120: + deshabilitado y − habilitado), y los dos con el campo `disabled`. Con `null`, los dos habilitados.
- **Ausentes en `readonly`** (modo vista). Con el bloqueo con interruptor aparecen al desbloquear **sin cambiar la altura ni repartir la fila de nuevo** (ver [Dentro de un formulario](#dentro-de-un-formulario)).

## Teclado

| Tecla | Acción |
| --- | --- |
| Flecha arriba / abajo | ± `step`, en la rejilla desde `min`; nunca rebasa `min`/`max` |
| Shift + Flecha arriba / abajo | ± 10 × `step` (se pierde «extender la selección» de Shift con las flechas: un campo de una línea) |
| Re Pág / Av Pág | ± 10 × `step` |
| Inicio / Fin | **Edición de texto**, no saltan a `min`/`max`; en macOS no mueven el cursor, por convención del sistema |
| Vacío + Flecha arriba/abajo | Punto de partida (0 o el límite más cercano) |
| En el límite + Flecha arriba/abajo | No cambia; el número «topa» ([Personalidad](#personalidad)) si la pulsación no es una autorrepetición |
| Alt / Ctrl / Meta + flechas | Nativo: no se interceptan |
| Enter | Confirma (redondea, formatea y emite `change` si toca) y **deja seguir el envío implícito** del formulario |
| Tab | Entra y sale del campo; −/+ no están en el orden |
| Rueda del ratón | Nada |

Con el foco en el campo, un paso deja el cursor **al final** del texto. Las flechas y Re Pág/Av Pág cuentan como **escritura** para `GForm` (el error se revela al salir); −/+ cuentan como **cambio** (marcan `dirty`, no revelan el error). Los dos retiran `is-rejected`.

## Accesibilidad

- **Semántica:** `<input type="text" role="spinbutton">` con `aria-valuenow` (con valor), **`aria-valuetext` siempre que hay valor** (el número en el formato del idioma, con miles y `precision`, sin unidad ni marcas bidi) y `aria-valuemin`/`aria-valuemax` solo con `min`/`max`. Vacío: sin `aria-valuenow` ni `aria-valuetext`. Por qué `valuetext` siempre: `valuenow` no tiene idioma y **Chromium lo recorta al rango** (150 con `max` 120 expone 120), mientras `valuetext` conserva «150». **Sin `min`/`max`, Chromium expone igualmente `aria-valuemin` 0 y `aria-valuemax` 0** (el valor por defecto del rol; no hay forma ARIA de evitarlo): con `aria-valuetext` el lector dice el valor correcto.
- **Obligatorio:** `required` pone la marca de la convención de `GForm` y **`aria-required="true"`**, y **nunca el atributo nativo `required`** (DECISIONS #311): el `<input>` visible no es el que se envía, así que una restricción nativa sobre él no tendría sentido. Consecuencia: un `<form>` nativo sin `GForm` no bloquea el envío de un campo vacío; valida tú y usa `error`.
- **Solo lectura:** `readonly` nativo **y** `aria-readonly="true"`. Es enfocable, seleccionable y se envía. Chromium no expone ninguno de los dos en un `spinbutton`; se ponen para el resto de motores y lectores.
- **Etiqueta, ayuda y mensaje:** como `GInput` (`for`/`id`, `aria-describedby`, región de mensaje `aria-live="polite"` siempre presente). La etiqueta lleva `id="{id}-label"`, que usan los nombres de −/+. Sin nombre accesible (`label`, slot `label`, `aria-label` ni `aria-labelledby`) se avisa en desarrollo.
- **Capas decorativas:** el espejo, la capa de cifras que ruedan y el medidor son `aria-hidden`; el `<input>` y el árbol tienen el valor nuevo desde el primer cuadro de cada paso.
- **Tamaños de −/+:** cuadrados del alto de la caja (medidos: **24 · 28 · 36 · 44 · 52** px de `xs` a `xl`; `md` compacto 27 y `xs` compacto 24, el piso). Con `pointer: coarse`, **44×44** (52×52 en `xl`) y la caja ≥ 44. Un toque en + suma sin enfocar el campo.
- **Contraste medido** (27 configuraciones por motor: tema por defecto, el tema de la auditoría generado con `@grana/cli`, «Tema de prueba», Spotify y los once generados de Dark Color Presence, claro y oscuro; colores calculados y compuestos sobre el fondo real). Mínimos: valor **12.53:1**; prefijo y sufijo **5.57:1**; icono de −/+ **5.94:1**; separador de −/+ **3.02:1**; al pasar o pulsar, icono sobre `neutral-soft` **12.53:1** y separador **3.02:1**. Con el tema por defecto, claro y oscuro: valor 15.27 y 13.87, sufijo 6.54 y 7.83, icono 6.90 y 8.59, separador 3.03 y 3.93. Los colores de la caja, el texto y el foco son los de `GInput`; −/+ solo añaden los de la tabla de [Tema](#tema).
- **Foco:** el anillo de `GInput` rodea el conjunto (caja con −/+ dentro); −/+ llevan un anillo interior solo si una tecnología de apoyo los enfoca.
- **Error sin depender del color:** el de `GInput` (texto, icono y borde de doble trazo). −/+ tapan el borde doble y el discontinuo de la advertencia sin pisarlos, de borde a borde.
- **`forced-colors`** (emulado en Chromium; defecto, oscuro y auditoría): icono y separador visibles, deshabilitado en `GrayText`, pasar con `Highlight`, foco visible.
- **RTL:** la caja sigue el orden RTL (valor a la derecha, −/+ a la izquierda con + en el extremo) y el texto se ancla a la derecha cuando desborda; probado con `ar-EG` y `he`. Los iconos `minus` y `plus` no se reflejan.
- **Zoom y escalas:** con un visor de 640px y DPR 2 (aproxima el zoom 200 % de un navegador a 1280) las filas quedan alineadas y sin desborde de página; el separador de −/+ mide al menos 1 píxel de dispositivo a DPR 1.25, 1.5 y 2. A 320px un número de 16 cifras encoge la celda y la unidad sigue entera dentro de la caja.
- **Árbol de accesibilidad en los tres motores** con nombres y roles (`getByRole`); el árbol completo (`ariaSnapshot`, CDP) solo en Chromium.

## Dentro de un formulario

Con un `GForm` alrededor, el campo lee su contexto (densidad, solo lectura, deshabilitado, ancho completo y el error de `errors[name]`) con las mismas reglas que `GInput`; **la prop explícita del campo siempre gana**. Marcas por convención (`marks`), un solo mensaje bajo el campo y solo lectura con borde discontinuo: ver [`GInput`](../GInput/README.md#dentro-de-un-formulario) y la guía [`GForm`](../GForm/README.md).

### En una `GFormRow`

Su raíz es la de `GInput` (tres hijos: etiqueta, caja y pie), así que comparte las tres pistas de la fila **sin CSS propio de colocación**: las cajas de una línea quedan al mismo `top` (±1px) y con la misma altura que las de `GInput` y `GSelect`, medido a 1100, 720 y 320px de marco y en ventanas de 1280 a 320px, también con ayuda y con un error en la misma fila. El tamaño en la fila se da con `g-form-w-xs|sm|md|lg`.

**Mínimo publicado.** Un campo con −/+ necesita más sitio que su clase de tamaño (−/+ ocupan dos alturas de caja). En vez de una cifra fija de `--g-form-min`, **mide su mínimo y se lo publica a la fila**: lo que hay antes del valor (relleno y prefijo) + el ancho del texto de referencia + sufijo y `output` + −/+ con su separación y borde. El texto de referencia es el más ancho, medido, entre `min` y `max` formateados y el `placeholder`; sin límites, cuatro cifras del idioma. Se vuelve a medir al cambiar texto, tamaño, densidad, fuente o puntero. Medido con «Cantidad» 1–99 con −/+:

| Contexto | Mínimo |
| --- | --- |
| `md`, `space` 4, puntero fino (defecto; Chromium, Firefox y WebKit) | unos **110px** (111px medidos) |
| `md`, puntero grueso (Chromium y WebKit) | unos **130px** (127px medidos) |
| «Tema de prueba» (`space` 5, borde 2px, Georgia) | 129px |
| Tema de la auditoría (`space` 5, texto de 17px) | 135px |

Depende de la fuente, por eso se mide y no se tabula: la cifra de referencia de un banco sin la fuente servida daba 112px. Barrido de un campo con −/+ junto a un `GInput`, de 420 a 140px de 1 en 1: mientras comparten línea, **«99» cabe entero**; la fila se parte antes de que deje de caber y, en el último ancho de una línea, el campo mide lo que necesita (±2px). `--g-form-min` sigue disponible para subirlo.

- **Solo con `steppers` y sus dos textos.** Sin −/+ el campo no publica nada y se comporta como `GInput` (clase de tamaño y `--g-form-min`), así que la distribución de una fila de campos sin −/+ no cambia.
- **Bloquear y desbloquear no reparte la fila** (DECISIONS #266, [receta del bloqueo con interruptor](../GForm/README.md#bloqueo-con-interruptor)): en `readonly` −/+ no se pintan pero **cuentan** en el mínimo. Fila «Producto · Cantidad · Presentación» de 900 a 260px cada 20px: con y sin `readonly` la misma distribución, la misma caja (alto, `top`, ancho ±0,5px).

### Receta de signos vitales

Unidad **fija** → `suffix` de `GNumberField`; unidad **elegible** → `GInputGroup` (Temperatura). Es la fila del playground («Alta de paciente», `#fm-vitals`) y de la prueba de distribución obligatoria: 1 línea a 1280 y 960px, 2 a 720 (Temperatura · Presión / Frecuencia · Saturación · Peso · Estatura) y 3 a 360.

```vue
<g-form-row>
  <g-input-group class="g-form-w-sm" label="Temperatura" name="temp" required>
    <g-input-group-input v-model="v.temp" name="temp" principal inputmode="decimal" placeholder="36.5" />
    <g-input-group-select v-model="v.unidad" name="temp-unidad" part-label="Unidad"
                          :options="[{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }]" />
  </g-input-group>
  <g-input-group class="g-form-w-sm" label="Presión arterial" name="presion" style="--g-form-min: 38">
    <g-input-group-input name="pa-sistolica" principal part-label="sistólica" inputmode="numeric" placeholder="120" />
    <g-input-group-text text="/" decorative />
    <g-input-group-input name="pa-diastolica" part-label="diastólica" inputmode="numeric" placeholder="80" />
    <g-input-group-text text="mmHg" label="milímetros de mercurio" />
  </g-input-group>
  <g-number-field v-model="v.fc" class="g-form-w-xs" label="Frecuencia" name="fc" :min="20" :max="250" :precision="0"
                  suffix="lpm" suffix-label="latidos por minuto" />
  <g-number-field v-model="v.sat" class="g-form-w-xs" label="Saturación" name="sat" :min="0" :max="100" :precision="0" suffix="%" />
  <g-number-field v-model="v.peso" class="g-form-w-xs" label="Peso" name="peso" :min="0" :max="400" :step="0.1" :precision="1"
                  suffix="kg" suffix-label="kilogramos" />
  <g-number-field v-model="v.estatura" class="g-form-w-xs" label="Estatura" name="estatura" :min="30" :max="250" :precision="0"
                  suffix="cm" suffix-label="centímetros" />
</g-form-row>
```

`v.peso` es `72.5`, nunca «72,5»; el envío lleva `peso=72.5`. `min`/`max` **no validan**: el error de rango lo calcula la aplicación y lo pasa en `errors`.

### Rechazo al enviar (`is-rejected`) y mensaje que sale del campo (`is-ready`)

Las dos reacciones de `GInput` llegan sin CSS propio: al enviar con errores, `GForm` pone `is-rejected` en el campo que bloquea y se sacude **una sola vez** la fila de la caja, **con −/+ dentro** (se mueven con la fila: diferencia 0 en cada cuadro), con `aria-invalid="true"` y el evento `invalid`; con `is-ready`, el mensaje que llega entra con fundido y baja desde la caja. Con movimiento reducido no hay sacudida. El foco desde `GErrorSummary` llega al campo con el anillo de `GInput`. Detalle en [`GInput`, Personalidad](../GInput/README.md#personalidad) y [`GForm`](../GForm/README.md#personalidad-rechazo-al-enviar).

## Personalidad

`GNumberField` no es «un `<input>` con flechitas». Tres gestos propios, **sin props, slots ni eventos nuevos**, sin tocar el árbol accesible y con `--g-duration-press` y `--g-ease-out` (ninguna curva nueva). **Con `prefers-reduced-motion: reduce` ninguno se mueve.** Origen: ronda de kiwi [`design/lab/number-field/r01/`](../../../../../design/lab/number-field/r01/); decisiones #313 y #314 en `DECISIONS.md` (los tres gestos los adoptó el usuario el 2026-10-03).

**P1 · La unidad va pegada al número.** La celda del valor mide su texto, y el sufijo y el `output` van justo detrás; el hueco libre de la caja queda **después**, antes de −/+. Es la separación **por tamaño** de la caja: medida **4 · 4 · 8 · 8 · 12px** de `xs` a `xl` (compacto 6 y 3; con el tema de la auditoría, 5 · 5 · 10 · 10 · 15), con 1, 4 y 6 caracteres, también con el foco (texto crudo) y en RTL. Por qué: en una fila que siempre llena el ancho, un peso ocupa 200 a 400px y la unidad quedaba a unos 389px del valor; pegada se lee «72,5 kg» como en papel. Con un número que no cabe, el valor se desplaza y la unidad sigue visible. Pulsar el área vacía de la caja (o prefijo, sufijo, `output`) enfoca el campo con el cursor al final; −/+ quedan fuera. Siempre activa, con o sin sufijo.

**P2 · Las cifras ruedan.** Al dar un paso **deliberado** (−/+, flechas, Re Pág/Av Pág), solo las cifras que cambian se deslizan en vertical: **arriba al sumar, abajo al restar** (19 → 20 mueve dos cifras; 20 → 21, una; 99 → 100 hace entrar la posición nueva). Un contador mecánico que confirma sentido y orden de magnitud justo cuando miras el valor y no el teclado. Medido sobre el componente real: 9 a 11 cuadros con la capa, 5 a 7 posiciones intermedias, retirada por `animationend` a los 142–177ms; los extremos de la capa coinciden con el rango completo del espejo (±0,1px). **No rueda** al mantener ni con autorrepetición (0 capas al mantener 1s: la animación nunca se queda atrás del dato), al escribir o pegar, con texto que no cabe en la celda ni si ya hay una capa (pasos rápidos).

**P3 · El tope.** Flecha arriba en el máximo (o Flecha abajo en el mínimo), con una pulsación que no es autorrepetición, mueve el número `--g-space-1 × 0.5` hacia donde no puede ir y vuelve, una vez; el valor no cambia. Medido: **−2px** con `space` 4 y **−2,5px** con `space` 5 (sigue a la escala del tema), vuelta a 0. Fuera del límite no aparece, y con −/+ no hace falta (ya están deshabilitados).

**−/+ dentro de la caja.** No son botones sueltos junto al campo: son parte de la caja, cuadrados de su alto y de borde a borde, con la esquina de la caja (la esquina de + coincide con la de la caja, también con `pill` y con un radio de 16px), separados por una línea del grosor del borde.

**Con movimiento reducido** (comprobado en tres motores): P2 sin desplazamiento y sin capa que quede (se retira en el acto), P3 quieto y sin clase, la sacudida de `is-rejected` sin efecto e I1 solo con fundido.

**Reservada:** P4, arrastrar para ajustar sobre prefijo o sufijo (choca con seleccionar texto y con el desplazamiento táctil; −/+ y las flechas ya cubren la alternativa sin arrastre). **Descartada:** el sufijo que se funde al vaciar.

## Tema

El componente solo lee tokens `--g-*` (sin valores de respaldo). **No define tokens propios** (DECISIONS #313): usa los de `GInput` más estos, y cambiar el tema no deja ningún valor fijo en el CSS publicado (auditado en 27 configuraciones por motor; el CSS de `dist/grana.css` sin colores literales, sin `var()` con respaldo y con literales solo de `24px`, `44px` y `1px`).

| Token | Para qué |
| --- | --- |
| `--g-space-1` | Lado de −/+ (el alto de la caja, derivado de `space`); separación de P1; desplazamiento de P3 (`× 0.5`) |
| `--g-border-width` | Separador entre la caja y −/+ y entre − y +; −/+ llegan de borde a borde |
| `--g-color-border-control` | Separador de −/+ (≥ 3:1) |
| `--g-color-border-strong` | Separador con el campo deshabilitado |
| `--g-color-text-muted` | Icono de −/+ en reposo (≥ 3:1) |
| `--g-color-text` | Icono al pasar y pulsar |
| `--g-color-text-subtle` | Icono deshabilitado |
| `--g-color-neutral-soft` | Fondo de −/+ al pasar y pulsar |
| `--g-duration-fast`, `--g-ease-standard` | Fondo y color de −/+ |
| `--g-duration-press`, `--g-ease-out` | P2 y P3 |
| `--g-focus-width` | Anillo interior de −/+ si una tecnología de apoyo los enfoca |

Además, las esquinas finales de −/+ son las de la caja de `GInput` (`--g-radius-*`) y el tamaño del icono es `1em` del texto de cada `size`. **Un tema que cambia `space` escala −/+ y P1 sin recortes:** con `space` 5, −/+ miden 30 · 35 · 45 · 55 · 65px y la unidad queda a 10px del número.

```css
:root {
  --g-color-border-control: #5b6b8c;  /* separador de −/+ y borde de la caja: debe llegar a 3:1 */
  --g-color-neutral-soft: #eaf0fd;    /* fondo de −/+ al pasar y pulsar (y relleno de solo lectura de GInput) */
}
```

Constantes de diseño que **no** son tema (`tokens.md` §29.6): la repetición de −/+ (400ms y 60ms), el `0.5` de P3 y el hueco de 1px del cursor al final del espejo.

## SSR

Importar el componente y renderizarlo en el servidor no toca `window`, `document`, `navigator` ni `matchMedia`; los temporizadores, las medidas y las animaciones son solo del cliente. **Pasa `locale` para que el HTML llegue ya formateado:** con `locale`, el servidor y el primer render del cliente escriben el mismo texto formateado. **Sin `locale`**, los dos escriben el texto **canónico** («72.5», igual en ambos, sin desajuste de hidratación) y al montar se reformatea con el idioma resuelto. El oculto lleva el canónico desde el servidor.

## Avisos de desarrollo

Prefijo `[Grana GNumberField]`; una vez por instancia y mensaje; solo fuera de producción.

1. Sin nombre accesible (`label`, slot `label`, `aria-label` ni `aria-labelledby`).
2. `steppers` sin `decrementLabel` o sin `incrementLabel`: −/+ no se pintan.
3. `min` mayor que `max`: se ignoran los dos límites.
4. `step` menor o igual que 0 o no finito: se usa `1`.
5. `precision` menor que los decimales de `step` o de `min`: los pasos se redondean y pueden salir de la rejilla.
6. `modelValue` `NaN` o `±Infinity`: se lee como `null`.
7. `locale` que `Intl` rechaza: se usa el idioma del documento.
8. `type` en los atributos (el campo es siempre `type="text"`), o los slots `append` y `action` (no se pintan).

## Clases

Las emite el componente y las estiliza `GNumberField.css`, después de `GInput.css`. Las de `GInput` (raíz, caja, prefijo y sufijo, `output`, pie, estados `is-*`, `is-ready`, `is-rejected`) siguen siendo de `GInput`.

- **Raíz:** `g-number-field` (junto a las de `GInput`) y `g-number-field--has-steppers` (solo con −/+ pintados, nunca en solo lectura).
- **Elementos:** `g-number-field__value` (la celda), `__mirror`, `__field` (junto a `g-input__field`), `__roll`, `__roll-slot`, `__roll-new`, `__roll-old`, `__measure` (solo con −/+ dentro de una `GFormRow`), `__steppers`, `__step`, `__step--decrement`, `__step--increment` y `__step-label`.
- **Estados de la personalidad:** `is-rolling` (mientras existe la capa de P2) e `is-bumping` con `data-bump="up|down"` (durante P3), en `__value`; `data-direction="up|down"` en `__roll`. Keyframes `g-number-roll-*` y `g-number-bump-*`.

## Limitaciones conocidas

- **WebKit desplaza 1px el número enfocado** con el cursor al final (P1), con la fuente de serie servida por `dist/fonts.css`: WebKit redondea hacia arriba el ancho del texto y reserva además el cursor, y el hueco de 1px del espejo no alcanza. Medido: 27 de 63 campos del banco se desplazan 1px (el número se corre 1px y pierde 1px del lado inicial del primer glifo); lo mismo, al final de P2. Chromium y Firefox, 0 de 63. Con el hueco a 2px, en WebKit, 0 de 63. **Abierto** (hallazgo 1 de la auditoría): es una constante de la decisión #313 y la enmienda lima; el arreglo sube 1px el mínimo publicado.
- **Un número que no cabe, sin el foco, se recorta con elipsis** («1.234.567.890.12…»), la de `GInput`. Con el foco se desplaza y la unidad sigue visible. La elipsis avisa de que faltan cifras (un recorte limpio mostraría otro número sin avisar); otro tratamiento (por ejemplo alinear al final) sería una decisión de estructura (hallazgo 4).
- **Un cambio de `lang` de un ancestro después de montar no se observa.** Una aplicación que cambia de idioma en caliente pasa `locale` reactivo (o vuelve a montar el campo).
- **Chromium no resuelve `text-align: match-parent`** contra la dirección de la página cuando el `<input>` es `dir="ltr"`; el CSS fija el lado desde `:dir(rtl)`.
- **iOS no tiene tecla «-»** en `inputmode="decimal"` ni `"numeric"`: para negativos frecuentes, usa −/+ (bajar de 0 pasa a negativos) o `inputmode="text"` por los atributos. No medido en un dispositivo.
- **Teclear «.» en `es`** lo convierte en «,» (decimal): «1.234» tecleado es 1,234. Los miles se escriben sin separador y los pone `Intl` al salir («12345» → «12.345»; en `es`, «1234» queda «1234»). **Pegar** sí distingue miles. La regla de pegado no se midió con la agrupación india («12,34,567») ni con `de-CH` (apóstrofo).
- **Chromium recorta `aria-valuenow`** al rango y, sin límites, expone `aria-valuemin` y `aria-valuemax` 0 ([Accesibilidad](#accesibilidad)).
- **`GInputGroupNumber` y `field` están reservados:** un número como parte de un `GInputGroup` y el campo suelto dentro de otro componente (la cantidad por fila de una tabla) no existen; `field` exige antes el mismo slot en `GInput`. La moneda con formato es una ronda propia (DECISIONS #154).
- **`GInput` gana dos slots internos** para esto ([nota en su README](../GInput/README.md#slots-internos)); no son API pública.
- **Sin verificar:**
  - un **lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): cómo anuncian el `spinbutton` editable con `valuetext`, el recorte de `valuenow`, el solo lectura (que Chromium no expone) y −/+ fuera del Tab, y el ajuste por gestos en iOS;
  - **Safari real** y dispositivos **iOS y Android reales** (teclado decimal por región, el «-» en iOS, −/+ sin abrir el teclado, doble toque sin zoom);
  - un **IME real** (la composición se probó con eventos sintéticos) y el pegado real en Firefox;
  - **`forced-colors` real** de Windows (emulado en Chromium; no se emula en Firefox ni en WebKit) y el puntero grueso real (emulado en Chromium y WebKit);
  - el **zoom real** del navegador al 200 % y 400 % (se aproximó con un visor a la mitad y DPR 2).

## Verificación

- **Pruebas** (vitest con jsdom): 63 en `GNumberField.test.js` (estructura y atributos, modelo y escritura, teclado, `change` una vez por gesto, −/+, `GForm`, personalidad, idioma, mínimo publicado y los ocho avisos), 3 en `GNumberField.ssr.test.js` (servidor sin entorno de navegador, con y sin `locale`) y 20 en `utils/numberInput.test.js` (el motor numérico interno: idioma, filtro, pegado, redondeo y rejilla). 86 de 86 en estos tres archivos; la suite completa de `@grana/vue` pasó 2061 de 2061 al auditar coco.
- **Navegador** (Playwright en Chromium, Firefox y WebKit, sobre el componente real del playground): `number-field.spec.mjs` (15 pruebas: árbol accesible, teclado, pegado, −/+, estados, P1, P2 y P3, movimiento reducido, fila con `GInput` y `GSelect`, mínimo publicado, RTL, `is-rejected` por `GForm`, 320px y táctil), `form-distribution.spec.mjs` (signos vitales con `GNumberField`: 1, 2 y 3 líneas) y `personalidad-input.spec.mjs`: **131 pasan y 7 se omiten por diseño** (puntero grueso y colores forzados solo se emulan en Chromium).
- **Auditoría de coco** con el componente real y un tema distinto al por defecto (`brand` `#5B1A3A`, `radius` 16, `shape` `pill`, `space` 5, `fontSize` 17, generado con `@grana/cli`), más claro y oscuro, «Tema de prueba» y los once temas de Dark Color Presence: `node design/lab/number-field/auditoria-verificar.mjs`, **20798 de 20798** comprobaciones en los tres motores. Incluye que `GInput` sin los slots internos se comporta igual que antes: 29 campos y 245 elementos con el mismo HTML salvo el `id` de la etiqueta, cajas y 26 propiedades calculadas idénticas. Consola sin errores ni avisos.
- **Banco de estilo de coco** (`estilo-verificar.mjs`, sobre el marcado del contrato): 17354 de 17354.

## Fuentes

- API: [`GNumberField.meta.json`](./GNumberField.meta.json) · Contrato: [`design/contracts/number-field.md`](../../../../../design/contracts/number-field.md) (DECISIONS #309 a #314), [`input.md`](../../../../../design/contracts/input.md) («Cambio por `GNumberField`») y [`form.md`](../../../../../design/contracts/form.md) (§4, §8 y §13) · Prototipo: [`design/lab/number-field/r01/`](../../../../../design/lab/number-field/r01/) · Estilo: [`design/lab/number-field/estilo.md`](../../../../../design/lab/number-field/estilo.md) · Auditoría: [`design/lab/number-field/auditoria.md`](../../../../../design/lab/number-field/auditoria.md)
