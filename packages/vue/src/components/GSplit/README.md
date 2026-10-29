# GSplit

Dos regiones **lado a lado con una proporción** cuando caben y **una debajo de otra** cuando no, en el orden del DOM y solo con CSS. Es la pieza para **un panel con varios controles junto a otra cosa**: el panel de compra junto a las fotos, el resumen junto a las líneas del carrito, el pedido junto al formulario de pago, lo elegido junto al calendario. El umbral no lo dice el visor sino **el ancho mínimo del lado estrecho** (`collapse`), que además **sigue al texto**. **No pinta caja ni color** (lo pone el tema) y no mide nada con JavaScript.

**Etiqueta:** `<g-split>` · **Estado:** `candidate` (auditoría de coco aprobada, 2241/2241; ver [`design/lab/split/auditoria.md`](../../../../../design/lab/split/auditoria.md)) · **Desde:** 0.1.0

```js
import { GSplit } from '@grana/vue'
```

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio. Exige Vue `^3.5.0`.

> **Los umbrales de este README son del tema por defecto** (`space` 4, cuerpo de 16 px). Con otro `space` o un cuerpo mayor se recalculan con la fórmula de «Cuándo va al lado»: con un cuerpo de 17 px la pareja se apila antes.

## En esta página

[§ Uso](#uso) · [§ Cuándo usarlo](#cuándo-usarlo) · [§ Ejemplos](#ejemplos) · [§ API](#props) · [§ Cuándo va al lado](#cuándo-va-al-lado) · [§ Recetas y límites](#recetas-y-límites) · [§ Accesibilidad](#accesibilidad) · [§ Personalidad](#personalidad) · [§ Tema](#tema) · [§ Alcance](#alcance) · [§ Verificación](#verificación)

## Uso

```vue
<GSplit ratio="3:2" gap="lg">
  <template #start>
    <GStack as="ul" gap="md">…las líneas…</GStack>
  </template>
  <template #end>
    <GCard title="Resumen">…</GCard>
  </template>
</GSplit>
```

La raíz recibe `lang`, `dir`, `id`, `aria-labelledby` (con `as="section"`), `class` y `style` por los atributos que no son props. Las regiones son `div` de Grana sin rol: la semántica la pone el contenido (el resumen ya es un `GCard` o una `section` con su encabezado).

## Cuándo usarlo

| Necesito | Uso | No |
| --- | --- | --- |
| **Exactamente dos regiones** lado a lado con proporción, que se apilan cuando no caben; una o las dos con varios controles, una sección o una tabla | **`GSplit`** | `GAdaptiveLayout` (pone en línea propia un hijo con varios controles, una `section` o una `table`); márgenes o rejilla a mano |
| Repartir **n** hijos en líneas por su tamaño, con pistas | `GAdaptiveLayout` | `GSplit` anidados para simular n columnas |
| Una línea de piezas cortas que se parte (resumen, total y acción) | `GAdaptiveLayout` | `GSplit` (no son dos regiones con proporción) |
| Apilar bloques en un eje | `GStack` (comparten `gap` y `density`) | — |
| Campos de un formulario | `GFormLayout` + `GFormRow` | `GSplit` para repartir campos. Un formulario **entero** sí puede ir en una región |
| El ancho y el margen de la página | `GContainer` (el `GSplit` va dentro de su columna) | `GContainer width="reading"` o `prose` para la medida de lectura: conviven |
| Tarjetas que filtran | `GCardGroup` | — |
| La navegación lateral de la aplicación | `GAppShell` + `GSidebar` | `GSplit` con el menú en una región |

**Convivencia.** Un `GSplit` hijo directo de `GAdaptiveLayout` es un **bloque de línea completa**, como una `section`: dos regiones con proporción no se reparten con otros hijos en la misma línea. Dentro de una región puede ir cualquier cosa, también otro `GSplit` o un `GAdaptiveLayout`. Dentro de `GContainer prose` no corta la medida: la prosa de una región se mide a 66ch y nunca más ancha que su región.

## Ejemplos

### e1 · El resumen junto a las líneas

```vue demo
<template>
  <GSplit ratio="3:2" gap="lg">
    <template #start>
      <GCard as="section" title="Lo que llevas" description="Dos piezas: un mezcal y un rebozo." />
    </template>
    <template #end>
      <GCard as="section" title="Resumen" description="Subtotal, envío y total." />
    </template>
  </GSplit>
</template>
```

**Por qué:** el resumen del carrito es el lado estrecho y no debe aplastarse: con `3:2` y `collapse="md"` el resumen nunca baja de 320 px; si no cabe con esa medida, se apila **debajo** de las líneas (el orden del DOM). Úsalo así cuando la pareja es «lo que eliges» junto a «lo que cuesta»; para repartir piezas cortas, `GAdaptiveLayout`.

### e2 · Las fotos y el panel de compra a partes iguales

```vue demo
<template>
  <GSplit ratio="1:1" collapse="lg" gap="lg" align="start">
    <template #start>
      <GCard as="section" title="Fotos" description="La galería del producto." />
    </template>
    <template #end>
      <GCard as="section" title="Huipil bordado" description="Talla, color y el botón de añadir." />
    </template>
  </GSplit>
</template>
```

**Por qué:** cada lado pide al menos 384 px (`collapse="lg"`): en una tablet de 768 el panel de compra va **a todo el ancho** debajo de las fotos, en vez de quedar en dos columnas de 330. `align="start"` (el valor por defecto) evita que el panel se estire hasta la altura de una galería larga. Úsalo cuando el panel tiene controles que necesitan aire.

### e3 · Una región que aún no llega

```vue demo
<template>
  <GSplit ratio="2:1" gap="md">
    <template #start>
      <GCard as="section" title="Calendario" description="Sin el resumen todavía: ocupa todo el ancho." />
    </template>
    <template v-if="false" #end>
      <GCard as="section" title="Tu selección" />
    </template>
  </GSplit>
</template>
```

**Por qué:** una región vacía (`v-if` falso, comentarios, blancos) **no pinta envoltorio** y la otra ocupa todo el ancho; así el calendario no queda a dos tercios de la pantalla mientras el resumen no existe. Si las dos están vacías, la raíz queda sin hijos y sin aviso (una lista que aún no ha llegado no es un error).

## Props

| Prop | Tipo | Valores | Default | Descripción |
| --- | --- | --- | --- | --- |
| `as` | `String` | `'div'` `'section'` `'article'` `'aside'` `'header'` `'footer'` `'form'` | `'div'` | Etiqueta de la raíz (lista cerrada). Fuera de lista: aviso y se pinta `div`. Sin `main`, `nav`, `ul`/`ol` (dos regiones no son elementos de lista) ni `fieldset` (su `legend` sería un tercer hijo) |
| `ratio` | `String` | `'1:1'` `'3:2'` `'2:1'` `'2:3'` `'1:2'` | `'3:2'` | Proporción `start:end` al lado. Fuera de lista: aviso y `3:2` |
| `collapse` | `String` | `'sm'` `'md'` `'lg'` | `'md'` | **El ancho mínimo del lado estrecho**, no un punto de corte: `max(space × 64 · 80 · 96, cuerpo × 16 · 20 · 24)`. Fuera de lista: aviso y `md` |
| `gap` | `String` | `'none'` `'sm'` `'md'` `'lg'` | `'md'` | Separación, **la misma en los dos ejes**: `space × 6 × 0 · 0,5 · 1 · 2` (0, 12, 24 y 48 px con `space` 4). Entra en el umbral. Fuera de lista: aviso y `md` |
| `density` | `String` | `'default'` `'comfortable'` `'compact'` | sin valor: sigue la región | Multiplica la separación 1 · 0,875 · 0,75 (`compact` con `gap="md"` mide 18 px). Sin valor la separación sigue la región; con valor, el `GSplit` es la región de lo que lleva dentro ([Densidad](../../../../../README.md#densidad-global-y-por-región)). Pasa la prop, no `data-g-density`. Fuera de lista: aviso y se ignora |
| `align` | `String` | `'start'` `'stretch'` | `'start'` | Alineación de bloque de las dos regiones **al lado**: `start` (el resumen no se estira con la lista) o `stretch` (alturas iguales). Apiladas no actúa. Fuera de lista: aviso y `start` |

**No existen** (y por qué): `order` y `reverse` (ningún orden visual distinto del DOM: 1.3.2 y 2.4.3); `breakpoint` o anchos de visor (decide la caja); un `ratio` numérico o libre (la lista cerrada es la que se puede verificar exacta); `padding`, `background`, `border` (`GSurface`); tres o más regiones (`GAdaptiveLayout`).

## Eventos

`GSplit` no emite eventos ni expone métodos. Es puro: sin medidas, observadores ni estado.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `start` | — | Lo que se lee primero: al inicio en línea al lado, arriba al apilar. Vacío no pinta región |
| `end` | — | Lo que se lee después. Vacío no pinta región; entonces la otra ocupa todo el ancho |

**Sin slot `default` en el contrato de tipos.** Si llega contenido por `default`, no se pierde: se pinta al final de la región `start` (o como `start` si no hay slot `start`) y sale un aviso. Usa `#start` y `#end`.

## Cuándo va al lado

**La regla.** Cada región tiene de base su parte mínima y crece con su peso: el lado estrecho no baja de `n = max(space × k, cuerpo × k / 4)`, con `k` = 64 · 80 · 96 para `sm` · `md` · `lg`. El ancho que pide la pareja para ir al lado es

`n × (a + b) / min(a, b) + separación`

donde `a:b` es el `ratio`. Si no cabe en **la caja de la raíz** (no en el visor), la fila se parte y las regiones se apilan. Al lado, el reparto es exacto (±1,5 px) en las cinco proporciones.

**Tabla de umbrales — del tema por defecto** (`space` 4, cuerpo 16 px, texto al 100 %). Ancho de caja a partir del cual van al lado, **sin la separación** (súmale 0 · 12 · 24 · 48 px según `gap`, por la densidad):

| `ratio` | `sm` (n = 256) | `md` (n = 320) | `lg` (n = 384) |
| --- | --- | --- | --- |
| `1:1` | 512 | 640 | 768 |
| `3:2` · `2:3` | 640 | 800 | 960 |
| `2:1` · `1:2` | 768 | 960 | 1152 |

Ejemplos con `gap="lg"`: `3:2 md` → 848; `2:1 md` → 1008; `1:1 lg` → 816. Con `gap="md"`, `2:1 md`: a 983 se apila y a 984 va al lado con el estrecho a 320 exactos (`medido`).

**Otros temas: la misma fórmula.** Los dos términos de `n` valen lo mismo con el tema por defecto (4 × 80 = 16 × 20 = 320); con otro `space` o cuerpo, manda el mayor. Ejemplo con el tema **rústico** (cuerpo 17 px, `space` 4): `n` = `max(4 × 64, 17 × 16)` = 272 en `sm`, `max(320, 340)` = **340** en `md` y 408 en `lg`. La disponibilidad con calendario y tarjeta (`ratio="2:1" collapse="md" gap="lg"`) pide `340 × 3 + 48 = 1068` px: a 1440 su caja es de 1024, así que **se apila**, mientras que con el tema por defecto pide 1008 y va al lado. Es comportamiento contratado, no un defecto (hallazgo SP-N1, DECISIONS #953): un tema de letra mayor necesita más ancho para que el lado estrecho no quede en menos de 20 cuerpos. Quien quiera dos columnas con ese tema baja `gap` o elige `3:2`; no se compensa con un token.

**Crece con el texto.** Con el texto al 200 % (`--g-text-body-size` en `rem`) el término de texto se dobla y la pareja se apila antes: el carrito va al lado a 1440 con el texto al 100 % y apilado al 200 %. Nadie escribe una consulta para ello (`medido`).

**Determinista.** La decisión depende solo de la caja y del texto, nunca de lo que el contenido mide en ese instante, así que es la misma tras cualquier secuencia de cambios de tamaño (768 → 1440 → 1024 → 1440 → 320 → 1440): sin histéresis ni parpadeo en el servidor.

## Recetas y límites

- **Contenido rígido más ancho que su región** (una imagen sin `max-inline-size`, un `white-space: nowrap` largo): sobresale al lado. Es el precio de no tener suelo de contenido (abajo): 520 px de contenido rígido en una región de 325 sobresalen 207 px (`medido`, K9). La receta es **subir `collapse`** (más ancho mínimo para el lado estrecho) o **elegir otra proporción**; o dar al contenido `max-inline-size: 100%`. Las palabras largas sí se parten en su región.
- **Sin suelo de contenido, a propósito.** Las regiones llevan `min-inline-size: 0`. Con el `min-content` de cada región como mínimo, los componentes que se miden a sí mismos (`GStepper`, `GAdaptiveLayout`, el mínimo de `GFormRow`, los meses de `GCalendar`) informan el `min-content` **de su disposición actual**: el pedido de un checkout que pasaba por 768 (apilado) **se quedaba apilado a 1440 para siempre**, y la disponibilidad daba un orden no monótono. Sin suelo, la decisión al cargar es la que habría tras cualquier cambio de tamaño. No «arregles» un desborde poniendo un suelo en tu CSS.
- **El orden del DOM es el orden de lectura.** Apiladas, `start` queda arriba y `end` debajo. Que en el teléfono el resumen del carrito quede al final es el orden del DOM; quien lo quiera arriba usa otra variante del bloque, no `GSplit`.
- **RTL.** Al lado, `start` va al inicio en línea (a la derecha en RTL) sin código: todo es lógico (`medido`, K5).
- **Anidado.** Permitido y sin reglas propias: cada `GSplit` decide por su caja, no por la del visor ni por la del padre (`medido` anidado a 1400 y a 700).
- **Dentro de `GAdaptiveLayout`.** Un `GSplit` hijo directo cuenta como bloque de línea completa, tenga o no controles. Para repartir a otros hijos en la misma línea, ponlos en el `GAdaptiveLayout` y deja el `GSplit` en su propia línea.
- **Dentro de un `GFormRow`: no.** `GSplit` no reparte campos; si hace falta separar un formulario entero de su resumen, el formulario completo va en una región.
- **Una utilidad en la raíz.** Las clases `g-*` de tu aplicación sobre la raíz ganan al componente sin `!important`; tu CSS sin capa gana a ambos.

## Avisos de desarrollo

Prefijo `[Grana GSplit]`, una vez por instancia y motivo, al montar y al cambiar la prop. Solo en desarrollo.

| Cuándo | Qué pasa |
| --- | --- |
| `as`, `ratio`, `collapse`, `gap`, `density` o `align` fuera de lista | Un solo texto con el nombre de la prop y el valor recibido; se usa el default (`div`, `3:2`, `md`, `md`, `default`, `start`) |
| Contenido en el slot `default` | Se pinta al final de `start` (o como `start`); usa `#start` y `#end` |

No avisa cuando una región desborda (mediría en una pieza pura) ni de un `GSplit` dentro de `GFormRow`: la frontera está documentada aquí.

## Accesibilidad

a. Sin `role`, `aria-*` ni foco propios: la semántica es la del elemento pedido en `as` y la del contenido (`medido`, 2241/2241: la raíz y las regiones sin rol ni `tabindex`, con `as="section"` y `aria-labelledby` correctos).

b. Orden de lectura = orden de Tab = orden visual: sin `order` ni `reverse`; Tab recorre 1 → 2 → 3 al lado y apilado (`medido`, K10 con Tab real en los tres motores; en WebKit, con Alt+Tab).

c. Sin desplazamiento horizontal a 320 px, ni con el texto al 200 % (1.4.10, 1.4.4): las parejas se apilan a todo el ancho de su caja (`medido`, los 28 casos del banco en los tres motores).

d. El foco nunca queda tapado: nada se superpone (no hay `sticky`, 2.4.11).

e. Nada se mueve: pasar de dos columnas a una no se anima; transición y animación computadas en `0` / `none` con y sin `prefers-reduced-motion` (`medido`).

f. `forced-colors`: la geometría es la misma que sin colores forzados y no hay nada que perder, porque no pinta (`medido` en los tres motores, emulado).

> **Peligro.** Un contenido rígido (imagen sin `max-inline-size`, un `nowrap` largo) más ancho que su región **sobresale de ella** y puede tapar la región vecina o producir desplazamiento horizontal: `GSplit` no pone un suelo de contenido (por qué, arriba). Quien lo vea a 1024 y no lo pruebe a 768 puede no darse cuenta. Sube `collapse`, elige otra proporción o limita el ancho del contenido.

## Personalidad

**Decide por su sitio y por el texto, no por la pantalla.** Las rejillas de los frameworks eligen las columnas por el visor: el mismo carrito en un cajón de 480 px de una pantalla grande sale con dos columnas aplastadas, y quien lee con el texto al 200 % recibe un resumen de 300 px con tres palabras por línea. `GSplit` dice el umbral en palabras del diseño («el resumen no baja de 320»), lo mide en la caja de la raíz (un cajón, un diálogo, anidado o junto a una barra lateral) y lo hace crecer con el cuerpo de texto. Sirve a quien compra o reserva: el panel con el botón y el resumen con el total no se aplastan. Todo con CSS: primer pintado definitivo, sin medición ni parpadeo.

Sin movimiento: nada se anima, así que `prefers-reduced-motion` no tiene nada que reducir.

## Tema

| Token | Qué controla |
| --- | --- |
| `--g-space-1` | La separación (`× 6 × factor × densidad`) y el mínimo del lado estrecho (`× 64 · 80 · 96`) |
| `--g-text-body-size` | El mínimo que sigue al texto (`× 16 · 20 · 24`) |

Ningún token nuevo ni de color, borde, radio, sombra, fuente o duración. Las cifras de `collapse` y los factores de `gap` y `density` **no son tokens**: son relaciones con `space` y con el cuerpo, como las alturas del tema; un token dejaría que un tema desacompasara la pareja del texto que contiene.

### Clases

`g-split`, `g-split--ratio-{1-1|3-2|2-1|2-3|1-2}`, `g-split--collapse-{sm|md|lg}`, `g-split--gap-{none|sm|md|lg}`, `g-split--density-{default|comfortable|compact}` (solo con la prop) y `g-split--align-{start|stretch}` (siempre una de cada); las regiones, `g-split__region` con `g-split__region--start` o `g-split__region--end`. Una región sola se detecta en CSS con `:only-child`: no hay clase para eso.

## Alcance

- **Reservado: `sticky`** (la región final pegada). Medido en los tres motores: con la región pegada más alta que el visor, al llevar el foco a su último control el navegador desplaza y el control **sigue fuera de la vista**, lo que falla 2.4.7 y 2.4.11 sin aviso. Vuelve en una ronda propia con una salida para lo que no cabe, la suma de la cabecera fija y la prueba de foco en verde (DECISIONS #951). Hoy no hay columna pegada (BK-L1 sigue abierto): quien la quiera la hace con su CSS en su contenedor.
- **Reservado: `ratio="auto"`** (la primera región a su contenido): no hay forma de decir «natural al lado, completa debajo» sin `calc-size()` y reintroduciría el suelo de contenido. Se reabre con `calc-size()` en los tres motores y un caso real (#951).
- **Reservado: `align="center"`**: medido, sin caso real (#951).
- **Sin orden visual distinto del DOM, sin `breakpoint`, sin tres o más regiones, sin superficie propia.**
- **Peso:** `grana.js` crece **527 B gzip** (`medido` por bruno, 2026-10-28; tope 640 B, #949, que incluye la línea que hace de `.g-split` un bloque completo en `GAdaptiveLayout`). El CSS va en `grana.css`, fuera de esa compuerta.

## Verificación

- **Motores:** `design/lab/split/auditoria-verificar.mjs` sobre el componente real: **2241/2241** en Chromium, Firefox y WebKit (747 por motor), con el tema por defecto, rústico (cuerpo de 17 px) y lujo, claro y oscuro, `forced-colors` y `#sec-split` (`medido`, coco, 2026-10-28): K1 y K2 (proporción exacta y umbral exacto), K3 a K10, el texto al 200 %, la secuencia de cambios de tamaño sin histéresis, 320 px y 320 al 200 %, RTL, anidado, `GAdaptiveLayout`, `GContainer prose`, `as="section"` y consola limpia. `estilo-tema.mjs` con otro `space` y otro cuerpo de 17 px: 95/95 en los tres motores.
- **Bloques que lo usan:** los cuatro bloques recompuestos (`GbProductOverview`, `GbCart`, `GbCheckout` y `GbAvailability`) a 1440, 1024, 768, 390 y 320, con el texto al 100 y al 200 %: Ecommerce **11 129/11 129** en los tres motores (`design/lab/blocks/ecommerce/auditoria.md`, addendum del 2026-10-28), Booking **6516/6516** tras cerrar AV-C1 (`design/lab/blocks/booking/auditoria.md`).
- **Pruebas de bruno:** `GSplit.test.js` (27 pruebas, nivel `prueba`: etiqueta por `as`, clases, avisos, región vacía, `default`, atributos, SSR con `renderToString`) y `split.spec.mjs` (tres motores).
- **Defectos corregidos en la auditoría:** ninguno en `GSplit.css`. SP-N1 (el umbral depende del cuerpo del tema) quedó contratado como comportamiento (#953); SP-N2 (el tramo «bloques» de `estilo-verificar.mjs` compara con un «antes» que ya no existe) es del banco de coco y no del componente.
- **No verificado:** lector de pantalla real (no hay nada que anunciar, pero no se escuchó); zoom real de página del navegador (se midió el texto al 200 % y los anchos de 768 a 320); teléfono, Safari y táctil reales; SSR ejecutado en un servidor (razonado y cubierto por `renderToString`); temas del CLI distintos de los tres auditados; `forced-colors` real en Firefox y WebKit (emulado).
- **Pendientes abiertos:** `sticky` (BK-L1), `ratio="auto"` y `align="center"` reservados; los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md) §6.

## Fuentes

- Contrato: [`design/contracts/split.md`](../../../../../design/contracts/split.md)
- Decisiones: #946 a #951, #953 y #954 en [`DECISIONS.md`](../../../../../DECISIONS.md)
- API: [`GSplit.meta.json`](GSplit.meta.json)
- Auditoría de coco: [`design/lab/split/auditoria.md`](../../../../../design/lab/split/auditoria.md)
- Ronda de kiwi: [`design/lab/split/r01/`](../../../../../design/lab/split/r01/)
- Pruebas: [`GSplit.test.js`](GSplit.test.js); Playwright [`design/lab/theme-playground/tests/split.spec.mjs`](../../../../../design/lab/theme-playground/tests/split.spec.mjs)
- Banco: [`packages/vue/playground/split.html`](../../../playground/split.html) y `#sec-split` de [`packages/vue/playground/index.html`](../../../playground/index.html)
