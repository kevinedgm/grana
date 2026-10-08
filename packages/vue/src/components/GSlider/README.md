# GSlider

Deslizador para **un valor acotado donde manda la posición** (el volumen de los avisos, la intensidad del dolor de 0 a 10, una edad aproximada) o para **un rango de dos extremos** (el precio mínimo y máximo de un filtro). El asa **es** el valor: una píldora con la cifra dentro, siempre a la vista y del ancho de su texto más largo. El modelo es un `Number` o `null` («sin elegir») o, con `range`, un arreglo `[inicio, fin]`; **nunca una cadena**. Etiqueta, ayuda, mensajes, marcas y contexto de [`GForm`](../GForm/README.md) siguen las reglas de [`GInput`](../GInput/README.md), y el área mide lo que la caja de un `GInput` `md`, así que comparte fila con él en una [`GFormRow`](../GFormRow/README.md).

**Etiqueta:** `<g-slider>` · **Estado:** `candidate` (auditoría de coco aprobada, sin defectos bloqueantes; ver [`design/lab/slider/auditoria.md`](../../../../../design/lab/slider/auditoria.md)) · **Desde:** 0.1.0 · **Entrada:** propia, `@grana/vue/slider` (global UMD `GranaSlider`)

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`, sección `GSlider`, `#sec-slider`). Exige Vue `^3.5.0` (usa `useId`) y un navegador actual.

## Instalación: entrada propia

`GSlider` **no** viaja en `@grana/vue`: ni lo exporta ni lo registra su `install`. Va en su propia entrada y quien no lo usa no lo paga.

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import Slider, { GSlider } from '@grana/vue/slider'
import '@grana/vue/style.css'          // el CSS del deslizador ya está en esta hoja única

createApp(App).use(Grana).use(Slider).mount('#app')   // registra <g-slider>
// o, sin plugin: components: { GSlider }
```

Sin empaquetador, carga en orden `vue.global.js`, `dist/grana.umd.js` (global `Grana`) y `dist/slider.umd.js` (global `GranaSlider`): `app.use(Grana).use(GranaSlider)`. En plantillas dentro del HTML (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-slider ...></g-slider>`.

La entrada exporta `GSlider` y, por defecto, un plugin (`install`) que solo lo registra. No hay gestor ni servicio.

**Peso (DECISIONS #455).** La entrada se decidió aparte **antes de construir**, porque el motor, el teclado, los gestos de puntero y la integración con `GForm` superan con holgura el tope de 8 KB gzip del paquete principal (#238, #328, #337, #415). Peso anotado por bruno el 2026-10-07 en `GSlider.meta.json`: `dist/slider.js` **11 286 bytes gzip** y `dist/slider.umd.js` **10 280**; el principal crece solo **+95 B gzip** (la regla de modalidad de `utils/keyFocus.js`, #450). **Remedido al documentar** sobre el `dist/` del árbol de trabajo, con `gzip -9`: 11 275 y 10 291 bytes. `useFormField` con las claves de contexto (una copia propia crearía otro `Symbol` y el campo no vería su `GForm`), `GLibIcon`, `oneOf`, el observador de tamaño y `utils/keyFocus.js` llegan por `__shared` **sin copia**; el motor (`utils/slider.js`, interno y no exportado) viaja solo en esta entrada. Comprobado al documentar: `dist/grana.js` no contiene `GSlider` y `dist/grana.css` contiene `g-slider__pill`. El CSS va en `grana.css`.

## Qué lo hace distinto

Forma **B «El valor es el asa»**, elegida por el usuario el 2026-10-07 mirando los prototipos de kiwi (`design/lab/slider/r01/`, DECISIONS #445 y #452). Las otras dos formas quedan reservadas (ver «Reservado»).

El deslizador habitual esconde el valor (bajo el dedo o en un globo que aparece al arrastrar), monta las dos asas de un rango una sobre otra y no deja precisión sin un segundo campo. `GSlider` resuelve cada fallo con una pieza propia:

| | Qué hace | Por qué sirve |
| --- | --- | --- |
| **La cifra vive en el asa** | La píldora que se arrastra lleva el valor dentro (`tabular-nums`) y su **ancho no cambia**: es el de su texto más ancho posible (primer punto, último, punto medio, negativo y cada marca) | El valor está donde se mira y donde se toca; la píldora no baila al moverse |
| **Las asas se funden** | En un rango, cuando las dos píldoras se alcanzan se unen en una cápsula «18 a \| 24 a» con una raya entre las dos mitades; cada mitad **sigue siendo su asa** (foco, nombre, teclado, arrastre) y vuelven a ser dos al separarse | Se lee como un intervalo, no como dos fichas montadas |
| **El tramo se arrastra entero** | Arrastrar el tramo entre las dos asas mueve las dos **conservando la anchura**; un toque en él lleva el asa más cercana (WCAG 2.5.7) | «El mismo margen de precio, un poco más caro» es un gesto, no dos |
| **Se escribe la cifra** | Con el foco en una píldora, teclear «3 5» la vuelve campo; Intro (o una pausa de 900 ms) la lleva al 35 | Precisión sin un segundo control. Es un extra: no se descubre solo |
| **El tope** | Una pulsación que no puede avanzar por estar en el límite desplaza la píldora un instante y vuelve | El límite se siente sin texto nuevo |
| **El salto se desliza** | Un clic o toque en el riel desliza el asa hasta el punto; arrastrar y teclear van pegados al dedo y a la tecla | Se ve de dónde viene el valor |
| **«Sin elegir» de verdad** | Con `null` no hay píldora ni tramo y el riel va en trazos | Una escala de dolor no empieza en 5 ni se envía sin que nadie la haya elegido |

**Con `prefers-reduced-motion: reduce` nada se desplaza**: el salto no se desliza, el tope no se mueve y la fusión cambia de forma sin transición (medido en la auditoría). Nada se anima al montar. No usa `--g-ease-spring` ni `--g-ease-bounce`.

## Uso

### Un valor con marcas y «sin elegir»

```vue
<script setup>
import { ref } from 'vue'
const dolor = ref(null)          // Number o null («sin elegir»), nunca una cadena
</script>

<template>
  <g-slider v-model="dolor" name="dolor" label="Intensidad del dolor" locale="es-MX"
            :max="10" required
            :marks="[{ value: 0, label: 'Sin dolor' }, { value: 5, label: 'Moderado' }, { value: 10, label: 'El peor' }]"
            :labels="{ empty: 'Sin elegir' }"
            hint="0 es sin dolor; 10, el peor imaginable"
            @change="guardar"></g-slider>
</template>
```

Con `null`, la cabecera dice «Sin elegir» (de `labels.empty`) y no hay píldora. El primer toque o clic pone el valor en ese punto; con el teclado, una tecla que sube da el primer punto y una que baja, el último. Cuando el valor cae en una marca con nombre, el nombre entra en `aria-valuetext` («5, Moderado»).

### Un porcentaje

```vue
<g-slider v-model="volumen" name="volumen" label="Volumen de los avisos" locale="es-MX"
          :format="{ style: 'unit', unit: 'percent' }"
          hint="Del silencio al máximo"></g-slider>
```

El modelo `40` se lee «40 %». **No uses `style: 'percent'`** con `max` mayor que 1: multiplica por 100 (espera fracciones) y avisa.

### Un rango

```vue
<script setup>
import { ref } from 'vue'
const precio = ref([800, 2400])   // [inicio, fin]
</script>

<template>
  <g-slider range v-model="precio" name="precio" label="Precio" locale="es-MX"
            :max="5000" :step="50" :min-gap="100"
            :format="{ style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }"
            :labels="{ start: 'mínimo', end: 'máximo' }"
            hint="Arrastra el tramo para moverlo entero"></g-slider>
</template>
```

`range` es **explícita** (no se deduce del modelo). `labels.start` y `labels.end` nombran las dos asas («Precio mínimo», «Precio máximo»); sin ellos las dos se llamarían igual y el campo avisa. `minGap` es la distancia mínima entre las asas. Cada emisión es un **arreglo nuevo**: nunca se muta el de tu aplicación.

### Un texto propio en la píldora

```vue
<g-slider v-model="minutos" label="Duración de la sesión" locale="es-MX"
          :min="15" :max="480" :step="5" color="accent"
          :value-text="m => `${Math.floor(m / 60)} h ${m % 60} min`"></g-slider>
```

`valueText` sustituye **a la vez** el texto de la píldora y `aria-valuetext`: lo que se ve es lo que se oye. Si no devuelve una cadena no vacía, avisa y se usa el texto por defecto.

### Solo marcas como rejilla

```vue
<g-slider v-model="porPagina" label="Resultados por página" locale="es-MX"
          :min="10" :max="100" :marks="[10, 25, 50, 100]" snap="marks"></g-slider>
```

Con `snap="marks"` las marcas son la rejilla: las flechas van de marca en marca y el puntero cae en la más cercana. Para elegir entre pocas opciones **con nombre propio** (Bajo · Medio · Alto) usa [`GRadioGroup`](../GRadioGroup/README.md).

## Dentro de un formulario

```vue
<g-form aria-label="Aviso" @submit="enviar">
  <g-form-layout>
    <g-form-row>
      <g-input v-model="aviso.nombre" name="nombre" label="Nombre del aviso"></g-input>
      <g-slider v-model="aviso.volumen" name="volumen" label="Volumen" class="g-form-w-lg"
                locale="es-MX" :format="{ style: 'unit', unit: 'percent' }"></g-slider>
    </g-form-row>
  </g-form-layout>
  <g-btn type="submit">Guardar</g-btn>
</g-form>
```

- **`GForm`:** `name` registra el campo (clave de `errors`). El error se revela **al cambiar** (`trigger: 'change'`, como `GSelect` y `GRadioGroup`) y un gesto que cambia el valor cuenta como **cambio** (no como escritura) al acabar. `GForm` no valida: el mensaje lo pones con `error` o con `errors[name]`.
- **[`GErrorSummary`](../GErrorSummary/README.md)** enlaza al **primer** asa (`#ID`, también en un rango). Al llegar con Intro desde el enlace, el asa recibe el anillo de foco (ver «Foco visible»).
- **«Sin elegir» obligatorio:** `required` pone la marca de obligatorio y **nada más** (sin `aria-required`, que no está admitido en el rol `slider`, y sin `required` nativo). Lo que bloquea el envío es un `errors[name]` de tu aplicación; al enviar, `GForm` marca el campo con `is-rejected`, lleva el foco al asa y, al dar un valor (↑ da el mínimo), el error se va.
- **Dentro de una `GFormRow`** el deslizador publica su **mínimo intrínseco** y la fila se parte antes de que no quepa (ver «En una fila de formulario»). **Fuera de una fila** ocupa el ancho de su contenedor.

### Receta: proporción y cifra exacta

Cuando importan las dos cosas a la vez, un `GSlider` y un [`GNumberField`](../GNumberField/README.md) con **el mismo `v-model`** en una fila:

```vue
<g-form-row>
  <g-slider v-model="volumen" name="volumen" label="Volumen" class="g-form-w-lg"
            locale="es-MX" :format="{ style: 'unit', unit: 'percent' }"></g-slider>
  <g-number-field v-model="volumen" label="Exacto" class="g-form-w-xs"
                  :min="0" :max="100" suffix="%" locale="es-MX"></g-number-field>
</g-form-row>
```

Solo el deslizador lleva `name` en la receta (el que se envía). Es la del playground (`#sec-slider`, «Receta»). No pongas un campo propio **dentro** del deslizador: la frontera con `GNumberField` es esta (DECISIONS #445).

## Modelo y envío

- **`v-model` sin `range`:** un número finito o `null`. `undefined` se lee como `null` sin aviso. `NaN`, `±Infinity` o un arreglo se leen como `null` **con aviso**.
- **`v-model` con `range`:** `[inicio, fin]`. `null` o `undefined` se **dibujan** como el recorrido entero, sin aviso y **sin emitir**; un valor mal formado (longitud distinta de 2, no finito, un número suelto) o desordenado se dibuja (entero u ordenado) **con aviso**. El modelo no se toca hasta el primer gesto, que emite ya ordenado. **Un rango no tiene «sin elegir».**
- **Se emite siempre** un número, `null` o un arreglo nuevo; nunca una cadena.
- **Grana no valida ni redondea** (DECISIONS #157): un valor de tu aplicación fuera de la rejilla o de `[min, max]` se **conserva**. Fuera de la rejilla, el primer paso cae en el punto siguiente en esa dirección. Fuera de `[min, max]`, se dibuja en el extremo, el modelo no se toca, el oculto envía el valor real y se avisa.
- **Envío:** un `<input type="hidden">` **por asa** con el canónico (`String(número)`, `""` sin elegir), en orden inicio, fin y **con el mismo `name`**. Un rango envía dos valores: `FormData.getAll('precio')` da `['800', '2400']`. El `<input type="range">` nativo **no lleva `name`**. Con `readonly` **se envía**; con `disabled`, no. `form` (por atributo) se copia a los ocultos. `name` es **prop**, no atributo.
- **Una conversión que te toca a ti:** el rango llega al servidor como dos campos con el mismo nombre; tu aplicación los junta.

## Teclado

Cada asa es un `<input type="range" step="any">` nativo invisible, pero **el teclado lo resuelve el componente** (igual en los tres motores, también en RTL).

| Tecla | Acción |
| --- | --- |
| → / ↑ | + `step` (con `snap="marks"`, la marca siguiente) |
| ← / ↓ | − `step` |
| Mayús + flecha, Re Pág / Av Pág | ± `bigStep` (con marcas, dos marcas) |
| Inicio / Fin | Los **límites del asa** (en un rango, el inicio llega hasta `fin − minGap`) |
| En un límite | Nada cambia; **tope** si la pulsación no es autorrepetición |
| Desde «sin elegir» | Una tecla que sube da el primer punto; una que baja, el último; Inicio y Fin, los extremos |
| Cifras, separador, «-» | **Teclear la cifra** (abajo) |
| Tab / Mayús + Tab | Una parada por asa, en orden inicio → fin |
| Alt, Ctrl o Meta + tecla, rueda, composición | No se interceptan |

- **RTL:** ← y → siguen la **dirección visual** (← sube, → baja); ↑ y ↓ no cambian. Resuelve la discrepancia del nativo, que sube o baja con → según el motor.
- **Medido por kiwi en los tres motores** con un 50: → ↑ ← Mayús+→ Re Pág Av Pág ↓ Inicio Fin → dan 45 50 45 55 65 55 50 0 100 100.

### Teclear la cifra

Con el foco en una píldora y sin `readonly`: una **cifra** (latina o del idioma) empieza o sigue la cifra; un **separador** entra una vez y solo si `step` o `min` tienen decimales; **«-»** solo como primer carácter y solo con `min < 0`; Retroceso borra el último. Mientras se teclea, la píldora **se vuelve campo** (`is-typing`) y `aria-valuetext` **no cambia** hasta confirmar.

- **Confirman:** Intro, una pausa de 900 ms, cualquier otra tecla (que luego actúa: una flecha confirma y da su paso) o perder el foco. **Esc anula.**
- **Al confirmar**, el número va al punto de la rejilla más cercano dentro de los límites del asa; si lo tecleado queda fuera, va al límite **con el tope**. Una confirmación es un gesto: un `change` si cambió.
- **Es un extra de precisión, no la vía accesible:** no se descubre solo y **no se anuncia mientras se escribe**. Con un lector de pantalla, el teclado de la tabla.

## Puntero y táctil

- **Ratón y lápiz sobre el riel:** el asa **más cercana** va ahí deslizándose y el arrastre sigue. **Sobre una píldora:** el arrastre empieza en el acto (también en táctil). **Sobre el nombre de una marca:** su valor exacto, aunque no esté en la rejilla.
- **Táctil sobre el riel:** solo un **toque** (movimiento de 10 px o menos) salta; un **gesto vertical desplaza la página** (`touch-action: pan-y`); uno horizontal arrastra el asa más cercana.
- **Asas juntas** (mismo valor, rango): mueve la que pide la **dirección del primer movimiento** (más de 2 px). Con las dos juntas, **una pulsación en el riel mueve la del lado pulsado**.
- **El tramo** (rango sin fundir): el gesto queda en suspenso hasta 10 px. Si se suelta antes, es un toque y el asa más cercana va a ese punto (alternativa sin arrastre, WCAG 2.5.7). Si se mueve en horizontal, las dos asas se mueven conservando la anchura, acotado al recorrido. Con las píldoras fundidas el tramo queda bajo la cápsula y no se arrastra.
- **Solo lectura:** pulsar enfoca el asa y no cambia nada. **Deshabilitado:** nada.
- **Todo lo que se arrastra tiene un gesto de un toque y teclado** (WCAG 2.5.7).
- **Área táctil:** píldora, tramo y asa de **24 px o más** y, con puntero grueso, **44 × 44 px**; el alto del área es el de la caja de `GInput` `md` con la misma densidad (44 px con puntero grueso).

## Foco visible (DECISIONS #450)

El anillo **no** viene de `:focus-visible`: medido en los tres motores, el nativo enfocado por el componente tras un clic **sí** casa con `:focus-visible`, así que el anillo saldría al hacer clic. El componente escribe un dato interno (`data-g-key-focus`, no es API) cuando el foco llega por una **tecla** que no es modificador (Tab, flechas, y también **Intro en el enlace de `GErrorSummary`**) o cuando se pulsa una tecla con el foco dentro, y lo quita al salir y con cualquier pulsación de puntero. El anillo se dibuja solo con ese dato, **en la píldora**.

Medido en la auditoría sobre el componente real: clic en la píldora, foco **sin** anillo; ← da el anillo (sólido, con `--g-focus-width`, `--g-focus-offset` y el color de foco); Tab da el anillo en el siguiente; otro clic lo quita; en un rango, Tab pasa el anillo a la segunda mitad de la cápsula; Intro en el enlace de `GErrorSummary` lleva el foco al asa **con** anillo. En «sin elegir», el anillo rodea el área entera como una cápsula.

La misma regla de modalidad la usan ahora `GRadioGroup`, `GCard` radio y `GWidgetGallery` (`utils/keyFocus.js`); sin regresión del motor del tooltip (DECISIONS #396).

### Safari y Tab (DECISIONS #451)

WebKit (Safari sin «Pulsar Tab para resaltar cada elemento») **salta el `range` con Tab**, como casillas, radios y botones. **No se fuerza `tabindex="0"`**: Grana sigue la preferencia del sistema, igual que `GCheckbox`, `GRadioGroup` y `GBtn`. **En Safari, Opción+Tab llega al deslizador, o activa la preferencia del sistema.** En la auditoría, WebKit de Playwright se midió con Opción+Tab.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` | Number \| null \| Array | número finito o `null`; con `range`, `[inicio, fin]` | `null` |
| `range` | Boolean | dos asas; explícita | `false` |
| `min` | Number | finito; la rejilla cuenta desde `min`; `min ≥ max` deja el control sin recorrido (aviso) | `0` |
| `max` | Number | finito; un `max` fuera de la rejilla no se alcanza: el último punto es el mayor ≤ `max` | `100` |
| `step` | Number | `> 0`; otro valor avisa y se usa `1`; decimales sin error de coma flotante | `1` |
| `bigStep` | Number | múltiplo positivo de `step`; sin valor (o no múltiplo, con aviso), una décima del recorrido en pasos enteros; con `snap="marks"`, dos marcas | sin valor |
| `minGap` | Number | distancia mínima entre las asas de un rango; negativa o mayor que el recorrido avisa y se usa `0`; sin `range` se ignora | `0` |
| `marks` | Boolean \| Array | `true`: una raya por punto (≤ 25) o por paso grande; arreglo de `Number` o `{ value, label? }`: rayas y nombres pulsables bajo el riel | `false` |
| `snap` | String | `step` `marks` (las marcas son la rejilla; requiere `marks` en arreglo, si no avisa y usa `step`) | `step` |
| `locale` | String | etiqueta BCP 47 | ver «Idioma» |
| `format` | Object | opciones de `Intl.NumberFormat` (moneda, unidad, decimales); un porcentaje es `{ style: 'unit', unit: 'percent' }` | sin valor |
| `valueText` | Function | `(value: number) => string`: texto de la píldora y `aria-valuetext` | sin valor |
| `labels` | Object | `{ start?, end?, empty? }`: nombres de las asas de un rango y texto de «sin elegir». Sin textos propios (#226) | `{}` |
| `name` | String | va a los ocultos y registra el campo en `GForm` | sin valor |
| `label` | String | valor único: `<label for>`; rango: `span` que nombra el grupo (pulsarlo enfoca el inicio) | sin valor |
| `hint` | String | ayuda (`aria-describedby`) | sin valor |
| `error` | String | mensaje de error | sin valor |
| `warning` | String | advertencia | sin valor |
| `valid` | String | mensaje de válido | sin valor |
| `required` | Boolean | marca de obligatorio; sin `aria-required` ni `required` nativo | `false` |
| `mark` | Boolean | `false`: sin marca de obligatorio ni de opcional | sin valor |
| `readonly` | Boolean | `aria-readonly` en cada nativo; enfocable; nada cambia el valor; **se envía** | sin valor, equivale a `false` (contexto de `GForm`) |
| `disabled` | Boolean | `disabled` en cada nativo y en los ocultos (no se envía) | sin valor, equivale a `false` (contexto de `GForm`) |
| `density` | String | `default` `comfortable` `compact` | contexto de `GForm` o `default` |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info`: familia de la píldora y del tramo; `brand` lee el rol `primary` | `brand` |
| `id` | String | `id` del primer nativo (el del inicio en un rango); el del fin lleva `id-end` | generado |

**No existen** (DECISIONS #447): `tooltip`, `showValue`, `thumbLabel` (el valor siempre se ve), `inverted`, `vertical`, `ticks` (son `marks`), `precision` (los decimales salen de `step` y la presentación de `format` o `valueText`), `block` (la raíz ocupa el ancho de su contenedor), `inputmode` y `type`. **Reservados con nombre** (si llegan por atributos, avisan y no se aplican): `appearance`, `distribution`, `countText`, `pxPerStep`, `orientation`, `clearable`, `size`.

**Atributos** (`inheritAttrs: false`): `class` y `style` van a la raíz; `aria-label` y `aria-labelledby` dan el nombre (grupo y asas en un rango: con `aria-label`, cada asa lleva «{aria-label} {labels.start|end}»); `aria-describedby` se **añade** a cada nativo; `autofocus` va al primer nativo; `form` a cada oculto; el resto (`data-*`, escuchas) a la raíz.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `Number \| null`, o un arreglo nuevo con `range` | **Cada cambio** del valor: cada paso de teclado (también al repetir), cada movimiento de puntero que cambia de punto, cada confirmación de la cifra tecleada, cada ajuste del lector |
| `change` | El mismo tipo | **Una vez por gesto** que cambió el valor (DECISIONS #448): al soltar la tecla (`keyup`), al soltar el puntero (`pointerup`, `pointercancel`, `lostpointercapture`), al confirmar la cifra tecleada, por cada ajuste del lector y al perder el foco con un gesto abierto. Sin cambio, ninguno |

- **Un cambio de `modelValue` desde la aplicación no emite nada.**
- **`change` está declarado en `emits`:** tu `@change` recibe el valor y no llega a ningún nativo.
- **Los eventos `input` y `change` del `<input type="range">` nativo se consumen y no burbujean:** serían incoherentes (unos gestos los dan y otros no). **Un `<form @change>` de tu aplicación no ve el deslizador**: usa el `@change` del componente o el estado sucio de `GForm`.

**Métodos expuestos:** ninguno.

## Slots

| Slot | Propósito | Notas |
| --- | --- | --- |
| `label` | Etiqueta con contenido rico | Dentro del `<label for>` (o del `span` con `id` en un rango); sin interactivos |
| `hint` | Ayuda con contenido rico | Conserva el `id` de la ayuda |
| `error` | Error con contenido rico | Dentro de la región del mensaje |

**Sin slot de la píldora ni de las marcas:** el texto de la píldora es un dato (`format`, `valueText`) y su ancho se mide de textos de referencia; un contenido arbitrario rompería el ancho fijo.

## Idioma

- **Resolución:** prop `locale`, después el `lang` del **ancestro más cercano** (incluye `<html>`) y por último `navigator.language`; al montar y cuando cambia la prop. Un `locale` que `Intl` rechaza avisa y sigue la cadena sin la prop.
- **Cifras:** las del sistema del idioma, sin las marcas bidi de `Intl` (en la píldora y en `aria-valuetext`). Al **teclear la cifra** se aceptan las latinas y las del idioma (arábigo-índicas, persas, devanagari).
- **Dirección:** el riel sigue la de la página (el mínimo en el inicio lógico: a la derecha en RTL). La píldora, los nombres de marcas y las referencias usan `unicode-bidi: plaintext` («24 a», no «a 24», en RTL); el «sin elegir» va en `<bdi>`. Sin iconos direccionales. Medido en la auditoría: marcas y fusión en LTR, RTL y 320 px.
- **Idioma cambiado en caliente:** un cambio del `lang` de un ancestro **después de montar** no se observa; pasa `locale` reactivo.
- **Sin textos propios** (DECISIONS #226): los nombres de las asas de un rango y el texto de «sin elegir» los pones tú en `labels`.

## En una fila de formulario

El deslizador comparte línea con `GInput`, `GNumberField` y `GSelect` en una `GFormRow` sin CSS propio de colocación: tres hijos (cabecera, fila, pie) por subgrid, con el centro del riel en el de la caja de sus vecinos. Medido en la auditoría: centros y altos por línea Δ ≤ 1 px en marcos de 1100, 720 y 320 px y en ventanas de 1280, 1024, 720, 480, 360 y 320 (tema por defecto y el de la auditoría, oscuro), sin desborde de página.

**Mínimo publicado (DECISIONS #453).** El deslizador publica a la fila su mínimo con `setIntrinsicMin`: el mayor entre `space × 40`, **3 × el ancho de la píldora** (4 × con `range`) y **los nombres de las marcas** (la suma de sus anchos más `space × 2` entre cada dos). Se publica al montar, al cargar las fuentes y al cambiar `min`, `max`, `step`, `marks`, `format`, `valueText`, `locale`, `range` o `density`, y se retira al desmontar. **Receta: `class="g-form-w-lg"`.**

Medido en la auditoría con la fuente servida (Instrument Sans), `md` y `space` 4: dolor (0 a 10 con tres nombres) **160 px**, volumen (0 a 100 %) **179 px**, precio en rango (MXN de 0 a 5000) **289 px**; con el tema de la auditoría (`space` 3, 19 px, Georgia) 180 · 184 · 296; con el propio del estilo (`space` 5, borde de 2 px) 200 · 203 · 321; y con el texto al 200 % 304 · 280 · 473. En el último ancho de una línea el deslizador mide lo publicado −0,5 px (la tolerancia de `GFormRow`). Bloquear y desbloquear el campo en ese ancho (patrón «lock-edit», #266) no cambia ni la línea ni el ancho ni el alto. Las cifras cambian con el tema y la fuente: el valor se **mide en vivo**.

**Fuera de una fila** no publica nada: la raíz ocupa el ancho de su contenedor y a tu aplicación le toca no dejarla por debajo de su mínimo. **Pocos nombres de marcas y cortos.** Ver el límite de los nombres de marcas en «Limitaciones conocidas».

## Accesibilidad

Valor único:

```html
<div class="g-slider g-slider--color-brand g-slider--density-default is-ready" style="--_pill-w: 52px">
  <div class="g-slider__head">
    <label class="g-slider__label" id="ID-label" for="ID">Volumen de los avisos</label>
  </div>
  <div class="g-slider__row">
    <div class="g-slider__area">
      <span class="g-slider__track"></span>
      <span class="g-slider__fill" style="--_from: 0; --_to: 0.4"></span>
      <span class="g-slider__thumb" data-thumb="0" style="--_at: 0.4">
        <span class="g-slider__pill" aria-hidden="true"><span class="g-slider__pill-text" dir="auto">40 %</span>…</span>
        <input class="g-slider__native" type="range" step="any" id="ID" min="0" max="100" value="40"
               aria-valuetext="40 %" aria-describedby="ID-hint ID-message">
      </span>
    </div>
    <input type="hidden" name="volumen" value="40">
  </div>
  <div class="g-slider__support">…<div class="g-slider__message" id="ID-message"></div></div>
</div>
```

- **Nativo por dentro** (DECISIONS #446): cada asa es un `<input type="range" step="any">` real, invisible (`opacity: 0`) y del tamaño del **interior de la píldora** (no de 1 px: el foco de VoiceOver y la exploración táctil dibujan el asa). Da el rol, el foco y el ajuste de los lectores de pantalla móviles sin simular teclas. **Sin `name`** y **sin `aria-required`**.
- **`min` y `max` del nativo = los límites de esa asa:** en un rango, el inicio llega hasta `fin − minGap` y el fin baja hasta `inicio + minGap`, de modo que `aria-valuemin` y `aria-valuemax` dicen lo que pide el patrón *Multi-Thumb Slider* de APG.
- **`aria-valuetext` siempre:** el formato del idioma; en una marca con nombre, «5, Moderado»; con `valueText`, lo suyo; sin elegir, `labels.empty`. La píldora es `aria-hidden` (el nativo ya anuncia el valor) y **no hay región viva** para el valor: no se repite en cada paso. Auditoría: el texto de la píldora es igual a `aria-valuetext` (sin marcas con nombre ni `valueText`).
- **Nombre:** valor único, `<label for>`. Rango: `role="group"` con `aria-labelledby` a la etiqueta, y cada asa con `aria-labelledby="ID-label ID-n0|1"` (los textos ocultos llevan `labels.start` y `labels.end`).
- **Descripción:** `aria-describedby` = ayuda, los de tu aplicación y mensaje, en cada nativo. `aria-invalid="true"` en cada nativo con error. El mensaje lleva su icono de Lucide (error, advertencia o válido) y un prefijo oculto; **la señal del error no depende solo del color**.
- **`readonly`:** `aria-readonly="true"` en cada nativo.
- **«Sin elegir»:** el nativo cubre todo el riel, de modo que el lector lo encuentra y el toque llega a él; el riel va en trazos y, con error, los trazos pasan a `danger-text`.
- **Movimiento reducido:** nada se desplaza ni cambia de forma con transición; los colores conservan su fundido (medido en la auditoría).

**Contraste medido** (auditoría, 28 configuraciones por motor: tema por defecto, el de la auditoría, el propio del estilo y los once de Dark Color Presence, claro y oscuro; colores compuestos sobre el fondo real; mismas cifras en los tres motores):

| Medida | Mínimo en las 28 |
| --- | --- |
| Texto de la píldora, siete familias (se exigen 4,5:1) | **4,51:1** (apple claro) |
| Texto al pasar y al arrastrar, `on-{color}` sobre `{color}-strong` (4,5:1) | **5,01:1** |
| Contorno de la píldora `{color}-text` (3:1) | **4,19:1** |
| Tramo `{color}-text` (3:1) | **4,19:1** |
| Riel `border-control` (3:1) | **3,18:1** |
| Tecleando, contorno (3:1) / texto (4,5:1) | **4,20:1** |
| Solo lectura, texto sobre `neutral-soft` (4,5:1) | **13,83:1** |
| Solo lectura, contorno `border-control` discontinuo (3:1) | **3,18:1** |
| Error, contorno `danger-text` (3:1) | **4,51:1** |
| Etiqueta, nombres de marcas, «Sin elegir», ayuda y mensajes (4,5:1) | **7,38:1** |
| Anillo de foco contra las superficies (3:1) | **4,19:1** |

El texto de la píldora en 4,51 vive del par `on-primary` / `primary` que el motor del tema garantiza de al menos 4,5:1. El tramo contra el riel mide apenas 1,04 a 1,9:1 según la familia y el tema (informativo): por eso el tramo es **1,5 veces más grueso** que el riel (6 px frente a 4 px) y no depende solo del color.

**`forced-colors`** (emulado en Chromium; tema por defecto claro, oscuro y el de la auditoría): riel `GrayText`, tramo `Highlight`, píldora `ButtonFace` / `ButtonText` con borde `ButtonText`, tecleando `Field` / `FieldText`, **solo lectura con el trazo discontinuo en `ButtonText`**, deshabilitado `GrayText`, anillo `Highlight` sólido y error con borde doble.

## Personalidad

Con tokens y sin constantes de tema nuevas (DECISIONS #454). **Con `prefers-reduced-motion: reduce` nada se desplaza.**

| Pieza | Qué | Duración y curva |
| --- | --- | --- |
| **Salto (B6)** | Un clic o toque en el riel o en una marca desliza el asa y el tramo hasta el punto (`is-jumping`). Arrastrar, teclear y el teclado **no** se deslizan. Desde «sin elegir» la píldora aparece en su sitio | `--g-duration-press`, `--g-ease-out` |
| **Fusión (B2)** | Esquinas interiores de las dos mitades a 0 y raya `on-{color}` entre ellas; sin desplazamiento | `--g-duration-press`, `--g-ease-out` |
| **Tope (B5)** | La píldora enfocada se desplaza `--g-space-1 × 0,5` en el sentido visual y vuelve, una vez; el valor no cambia. Sin autorrepetición. En `readonly`, sin tope | `--g-duration-press`, `--g-ease-out` |
| **Levantada al arrastrar** | La píldora enfocada pasa a `{color}-strong` y a `--g-shadow-2`: color y sombra, no desplazamiento; se queda con movimiento reducido | `--g-duration-fast` |
| **Rechazo al enviar** | `is-rejected`: una sola sacudida de la fila (la de `GInput`); con movimiento reducido, sin sacudida | La de `GInput` |

Medido en la auditoría: nada se anima al montar; el arrastre no tiene transición de posición; el salto retira `is-jumping` al terminar; el tope llega a un pico de `space × 0,5` en el sentido visual, vuelve a 0 y retira `data-bump`, con el valor intacto y también en RTL y con un valor fuera de límites; con autorrepetición, sin tope. Con movimiento reducido: salto sin deslizar, tope sin animación, fusión sin transición de esquinas.

## Tema

El componente solo lee tokens `--g-*` y alias locales (`--_*`). **No define tokens nuevos** (DECISIONS #454), no usa valores de respaldo y no lleva colores literales. Según la auditoría, en `GSlider.css` solo hay literales de `24px`, `44px` y el patrón de texto oculto; no usa `:focus-visible` ni muelle ni rebote; y ningún selector toma hijos de tu aplicación por estructura (DECISIONS #383). Lo de la etiqueta, la ayuda y el mensaje es de `GInput`.

| Token | Para qué |
| --- | --- |
| `--g-color-{color}`, `--g-color-on-{color}` | Relleno y texto de la píldora (par de al menos 4,5:1 que garantiza el motor del tema); `brand` lee `--g-color-primary*` |
| `--g-color-{color}-text` | Contorno de la píldora y tramo (DECISIONS #431 y #439) |
| `--g-color-{color}-strong` | Píldora al pasar y mientras se arrastra |
| `--g-color-border-control` | Riel y trazos de «sin elegir»; contorno discontinuo de la píldora en solo lectura |
| `--g-color-border-strong` | Rayas de las marcas; tramo deshabilitado |
| `--g-color-border` | Riel y contorno de la píldora deshabilitados |
| `--g-color-surface`, `--g-color-text` | Píldora tecleando |
| `--g-color-neutral-soft` | Relleno de la píldora en solo lectura |
| `--g-color-surface-sunken`, `--g-color-text-subtle` | Píldora, etiqueta y nombres deshabilitados |
| `--g-color-text-muted` | Nombres de las marcas, «sin elegir» |
| `--g-color-danger-text` | Contorno de la píldora y trazos de «sin elegir» con error |
| `--g-shadow-1`, `--g-shadow-2` | Sombra de la píldora en reposo y levantada al arrastrar |
| `--g-radius-pill` | Píldora, riel y tramo |
| `--g-space-1` | Alto del área (`× 9`), de la píldora (`× 7`), relleno en línea (`× 3`), grosor del riel (`× 1`) y del tramo (`× 1,5`), rayas de marca, separación de los nombres, tope y mínimo en fila |
| `--g-border-width` | Contorno de la píldora, raya de la cápsula, rayas de marca y cursor de la cifra tecleada |
| `--g-text-body-sm-*`, `--g-text-action-weight` | Texto de la píldora y de la etiqueta |
| `--g-text-caption-*` | Nombres de las marcas, ayuda y mensaje |
| `--g-focus-width`, `--g-color-focus`, `--g-focus-offset` | Anillo en la píldora, solo con el dato de foco por teclado |
| `--g-duration-press`, `--g-ease-out` | Salto, fusión y tope |
| `--g-duration-fast`, `--g-ease-standard` | Color, fondo y sombra de la píldora |

**Medidas del componente** (de tokens; constantes de diseño, no tokens): alto del área = el de la caja de `GInput` `md` con la misma densidad (36 · 31,5 · 27 px con `space` 4; 44 px con puntero grueso); alto de la píldora 28 · 24,5 · 24 px. **Área y píldora crecen con su texto** (auditoría, hallazgo 2): son el mayor entre lo anterior y una línea de `body-sm` más los dos bordes, como la caja de `GInput`; con el tema de la auditoría (`space` 3, 19 px, Georgia) el área mide 27 · 26 · 26 px y, con el texto al 200 %, 42 px (la caja de `GInput`).

**No son tokens:** `TAP` (10 px), `TYPE_MS` (900 ms) y el umbral de 2 px del empate, constantes de JavaScript.

## SSR

Sin acceso a `document`, `window`, `navigator`, `matchMedia` ni `ResizeObserver` al importar ni al renderizar en el servidor. Las posiciones salen de fracciones (`--_at`, `--_from`, `--_to`), así que el HTML del servidor ya coloca las píldoras; el ancho medido de la píldora (`--_pill-w`) llega al montar, sin transición. **Con `locale`**, servidor y primer render del cliente escriben el texto formateado; **sin `locale`**, los dos escriben el **canónico** (`String(valor)`) y al montar se reformatea. Los ocultos llevan el canónico desde el servidor. **Pasa `locale` en SSR** para que el HTML llegue formateado. Cubierto por `GSlider.ssr.test.js` (3 pruebas).

## Avisos de desarrollo

Prefijo `[Grana GSlider]`; una vez por instancia; solo fuera de producción.

| # | Causa | Qué hace el componente |
| --- | --- | --- |
| 1 | Sin nombre accesible (sin `label`, slot `label`, `aria-label` ni `aria-labelledby`) | Avisa |
| 2 | `range` sin `labels.start` o sin `labels.end` | Las dos asas se llamarían igual |
| 3 | Valor único `null` sin `labels.empty` | Avisa |
| 4 | `modelValue` no válido (`NaN`, `±Infinity`, arreglo sin `range`; con `range`, mal formado o desordenado) | Se lee `null`; con `range`, se dibuja el recorrido entero u ordenado |
| 5 | `modelValue` fuera de `[min, max]` | Se dibuja en el extremo; el modelo no se toca |
| 6 | `min ≥ max` | El control queda sin recorrido |
| 7 | `step` ≤ 0 o no finito | Se usa `1` |
| 8 | `bigStep` que no es múltiplo positivo de `step` | Se usa la décima del recorrido |
| 9 | `minGap` negativo o mayor que el recorrido | Se usa `0` |
| 10 | `marks` fuera de `[min, max]` o repetidas; `snap="marks"` sin arreglo | Se ignoran / se usa `step` |
| 11 | `locale` o `format` que `Intl` rechaza | Se usa la cadena sin la prop / `{}` |
| 12 | `format.style` `'percent'` con `max > 1` | Avisa (usa `{ style: 'unit', unit: 'percent' }`) |
| 13 | `valueText` que no devuelve una cadena no vacía | Se usa el texto por defecto |
| 14 | Nombres reservados en los atributos | No se aplican |

## Clases

- **Raíz:** `g-slider`, `g-slider--color-{color}`, `g-slider--density-{density}`, `g-slider--range`, y los estados `is-empty`, `is-readonly`, `is-disabled`, `is-invalid`, `is-warning`, `is-valid`, `is-rejected`, `is-ready`, `is-dragging`, `is-jumping`, `is-merged`; `data-bump="up|down"`; variables `--_pill-w` y `--_mid`.
- **Cabecera:** `g-slider__head`, `__label`, `__optional`, `__required`, `__value` (solo con `is-empty`).
- **Fila y área:** `__row`, `__area`, `__track`, `__fill` (con `--_from` y `--_to`), `__thumb` (con `data-thumb`, `--_at` e `is-typing`), `__pill`, `__pill-text`, `__pill-ref`, `__native`, `__thumb-name` (con `range`).
- **Marcas:** `__marks`, `__mark` (con `has-label`, `data-value` y `--_at`), `__mark-label`.
- **Pie:** `__support`, `__hint`, `__message`, `__message-icon`, `__sr`.
- **Interno:** `data-g-key-focus` en el nativo; no es API.

## Limitaciones conocidas

- **Mínimo publicado con nombres de marcas desiguales (hallazgo 3 de la auditoría, abierto; lo cerrarán lima y bruno).** La fórmula suma los anchos de los nombres más `space × 2` entre cada dos, como si fueran juntos; pero el del medio va **centrado en su valor** y los de los extremos pegados al borde. Con «Sin dolor · Moderado · El peor» en el mínimo, el hueco entre nombres mide **2,8 px** con el tema por defecto (debería ser 8), **−0,11 px** (se tocan) con el de la auditoría y **−2,1 px** (se solapan) con el texto al 200 %. Los nombres son `aria-hidden` (el nombre de la marca va en `aria-valuetext`), por eso no bloquea el uso, pero **con la receta `g-form-w-lg` no se alcanza ese mínimo** con nombres de marca desiguales. Mientras no se corrija: pocos nombres, cortos, y comprueba tu fila con el texto al 200 %. En una fila de 320 px con el texto al 200 %, la fila ni siquiera llega al mínimo (−10,9 px; límite del contenedor, como el del 12 h de `GTimeField`).
- **Valor fuera de `[min, max]`:** una flecha **hacia fuera** sobre un valor ya fuera de los límites **no lo mueve y da el tope**; Inicio y Fin sí van al límite (hallazgo 5). El nativo acota su `value` (y `aria-valuenow`) al rango; `aria-valuetext` dice el valor real.
- **Asas juntas** (mismo valor): una pulsación en el riel mueve **la del lado pulsado**; con un puntero que las agarra, la dirección del primer movimiento decide cuál (hallazgo 5).
- **Teclear la cifra no se anuncia mientras se escribe y no se descubre sola.**
- **`aria-readonly` en un `range` puede no exponerse en Chromium** (como en `spinbutton`, DECISIONS #311). Lo que dice un lector real, sin verificar.
- **Safari y Tab:** el `range` se salta con Tab sin la preferencia del sistema; Opción+Tab llega (DECISIONS #451).
- **`<form @change>` de tu aplicación no ve el deslizador:** usa el `@change` del componente.
- **SSR:** pasa `locale` para que el HTML llegue formateado.
- **Idioma cambiado en caliente** (`lang` de un ancestro): no se observa; pasa `locale` reactivo.
- **No existe la orientación vertical** (`orientation` reservado) y **no se puede volver a «sin elegir» desde la interfaz** (`clearable` reservado): tu aplicación puede poner `null`.
- **Con movimiento reducido**, `GForm` pone `is-rejected` sin animación y la clase queda hasta el siguiente cambio (lo mismo que `GInput`); sin efecto visible en el deslizador (hallazgo 6).
- **Navegadores:** usa `:has()` (anillo de foco en la píldora), capas CSS, subgrid y `ResizeObserver`. No se midió ningún navegador anterior a los tres motores de Playwright (Chromium, Firefox, WebKit).

## Reservado (fuera de v0.1)

Nombres y formas apartados para entregas siguientes; **hoy no existen** (DECISIONS #457). Si se pasan por atributos, avisan y no se aplican.

- **C «Escalones con datos»: `appearance="steps"`** con `distribution` (conteos por tramo) y `countText(n, total)` (la consecuencia, «281 de 480 productos», a la vista y en `aria-valuetext`); `profile="rise"` para una escala sin datos. Segunda entrega, con contrato propio antes de construirse.
- **A «La cinta»: `appearance="tape"`** con `pxPerStep` y ajuste fino; solo valor único. Solo si un producto la pide. Con `appearance`, el valor por defecto será `'pill'` (B).
- **También reservados:** `orientation` (vertical), `clearable` (volver a «sin elegir»), `size`; adoptar `GSlider range` en el editor `between` de `GFilterBar` y arrastrar los extremos de un tramo en `GTimeField`.

## Verificación

- **Pruebas** (vitest con jsdom y, para el servidor, entorno node), **93 de 93 en verde al documentar** (ejecutadas de nuevo): `GSlider.test.js` (52), `GSlider.ssr.test.js` (3), `utils/slider.test.js` (29, el motor) y `src/slider.test.js` (9, la entrada). Además, `utils/keyFocus.test.js` (la regla de modalidad, #450) y `src/types.test.js` (no ejecutados al documentar).
- **Navegador** (Playwright en Chromium, Firefox y WebKit): los specs de bruno `slider.spec.mjs`, `personalidad-slider.spec.mjs` y `key-focus.spec.mjs` (ampliado). Según la auditoría de coco, con el CSS corregido **solo en Chromium** (20 de 20 en `slider.spec.mjs` y `personalidad-slider.spec.mjs`); en Firefox y WebKit no se repitieron tras los arreglos de la auditoría. Los specs **no se ejecutaron al documentar**.
- **Auditoría de coco** con el componente real publicado (`dist/slider.umd.js` + `dist/grana.umd.js` + `dist/grana.css` + `dist/fonts.css`) y un tema distinto al por defecto (generado con `@grana/cli`: primario `#4A1D6B`, `space` 3, texto de 19 px, Georgia, sin esquinas redondeadas): `node design/lab/slider/auditoria-verificar.mjs`. **74 491 de 74 491** comprobaciones (estático 24/24, Chromium 24 855/24 855, Firefox 24 791/24 791 y WebKit 24 821/24 821). **No se repitió al documentar.** Resultado: sin defecto bloqueante, `candidate`. Hallazgos: 1 (contorno de la píldora en solo lectura a ≈ 1,5:1; corregido: `border-control` discontinuo sobre `neutral-soft`), 2 (área y píldora no crecían con su texto; corregido), 3 (mínimo con nombres de marcas desiguales; abierto), 4 (cambios de contrato que `slider.md` aún no recoge: de lima), 5 (decisiones de bruno recogidas) y 6 (información). En la primera pasada Firefox y WebKit dieron tres fallos de contraste de «tecleando» medidos a mitad del fundido de color; el verificador ahora mide tras la transición y el reposo queda en 4,20:1 o más.
- **Empaquetado** (al documentar): `dist/slider.js`, `dist/slider.umd.js` y `dist/slider.d.ts` existen; `dist/grana.js` no contiene `GSlider`; `dist/grana.css` contiene `g-slider__pill`.
- **Tipos:** `GSlider.meta.json` es contrato de tipos; lo que no expresa (la unión del modelo según `range`, la firma de `valueText`, la forma de `marks` y de `labels`) está en `types/overrides.mjs`.

## No verificado

- **Lector de pantalla real** (VoiceOver en macOS y en iOS con el gesto «ajustable», NVDA, JAWS, TalkBack): el nativo invisible, `aria-valuetext`, los nombres del rango (grupo y asas) y `aria-readonly`. Solo se comprobó el marcado y el árbol de accesibilidad.
- **Táctil real** (iOS Safari, Android): `pan-y` con desplazamiento real, el gesto vertical que abandona el arrastre (la auditoría solo midió toques) y el arrastre de la píldora y del tramo con el dedo.
- **IME** y cifras de otros sistemas al **teclear la cifra**; idiomas con cifras propias tecleando.
- **`forced-colors` real** (Windows): emulado solo en Chromium; en Firefox y WebKit ni siquiera emulado. Puntero grueso en Firefox no emulado por Playwright.
- **Zoom real** de solo texto y de página al 200 y 400 % (aproximado con `html` al 200 % y con un visor de 640 px y DPR 2).
- **Cifras de este README tomadas de otros informes** (pesos de bruno, auditoría y estilo de coco) y no remedidas al documentar, salvo las marcadas como «Remedido» o «ejecutadas de nuevo».

## Fuentes

- API: [`GSlider.meta.json`](./GSlider.meta.json) · Contrato: [`design/contracts/slider.md`](../../../../../design/contracts/slider.md) (DECISIONS #445 a #457) · Formularios: [`design/contracts/form.md`](../../../../../design/contracts/form.md) (§1, §2, §4 y §7) · Ronda de kiwi: [`design/lab/slider/r01/`](../../../../../design/lab/slider/r01/) · Estilo: [`design/lab/slider/estilo.md`](../../../../../design/lab/slider/estilo.md) · Auditoría: [`design/lab/slider/auditoria.md`](../../../../../design/lab/slider/auditoria.md) · Caja y mensajes: [`GInput`](../GInput/README.md) · Fila: [`GFormRow`](../GFormRow/README.md) · Hermano: [`GNumberField`](../GNumberField/README.md) · Alternativa con nombres: [`GRadioGroup`](../GRadioGroup/README.md)
