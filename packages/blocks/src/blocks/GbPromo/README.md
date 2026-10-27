# GbPromo · GbPromo01, GbPromo02 y GbPromo03

Una oferta de la tienda **con lo que da, hasta qué fecha y con qué condiciones**, y su código listo para copiar. La fecha es una fecha en la hora de la tienda, nunca una cuenta atrás; las condiciones van siempre a la vista y se oyen con la acción principal. Compone `GSurface`, `GContainer`, `GSection`, `GStack`, `GCard`, `GAdaptiveLayout`, `GBtn` y `GText`; no trae color, CSS ni textos propios, y no necesita ninguna entrada extra de `@grana/vue`.

**Etiquetas:** `<gb-promo-01>`, `<gb-promo-02>`, `<gb-promo-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/ecommerce`

```js
import { GbPromo01, GbPromo02, GbPromo03 } from '@grana/blocks/ecommerce'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/ecommerce/promo.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`; esta sección no compone ninguna entrada propia de `@grana/vue`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md#ecommerce).

## Qué lo hace distinto

**La oferta dice cuándo acaba con una fecha, no con un reloj** (DECISIONS #925). «Hasta el domingo, 15 de noviembre» en la hora de la tienda, en lugar de una cuenta atrás que apura a quien lee despacio o con lector de pantalla (2.2.2) y que es la presión falsa de siempre. El bloque no tiene temporizadores. Las condiciones van **al lado** de la oferta y se oyen con la acción principal (`aria-describedby`), no escondidas tras un asterisco. El código se copia en un toque y también se puede leer en voz alta y seleccionar a mano: es texto, no imagen.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbPromoProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbPromo01` | Banda: una banda de marca a todo lo ancho entre dos secciones | `GSurface zone="brand" level="flat" padding="lg"` > `GContainer` > `GSection` > `GStack gap="md"` (fecha, código, condiciones y acciones) | `media` |
| `GbPromo02` | Tarjeta con imagen: la oferta sobre la foto de lo que se vende | `GCard as="section" mediaPosition="background"` (título al nivel de la sección, sin `GSection` alrededor) con fecha, código y condiciones en el cuerpo y las acciones en `actions` | — |
| `GbPromo03` | Línea: una línea sobria sobre la rejilla con el título, la fecha y una acción | `GText as="div" size="body-sm" role="group"` (`aria-label` = `title`) > `GAdaptiveLayout gap="md" vertical="center"` (título y fecha, código y la primera acción `link`); las condiciones debajo de la línea | `media`, `description` y la segunda acción |

**Piezas (comunes).** **La fecha:** `until` en `<time datetime>`, dicha con `Intl.DateTimeFormat` y `labels.until` («Hasta el domingo, 15 de noviembre»); `until` sin zona vale en la hora de la tienda y, con zona (`Z`, `±hh:mm`), se dice en `timeZone`. Con `until` en el pasado al montar, el bloque avisa (EC7) y se pinta igual: quitar la oferta es de tu aplicación. **El código:** su `label` y el valor (con `translate="no"`, para que el traductor del navegador no lo cambie) y un botón `labels.copy` que emite `activate` con el código, síncrono en el gesto. **Las condiciones:** `terms` en texto pequeño, siempre a la vista y ligadas a la acción principal. **Las acciones:** como máximo dos; la primera es la principal (`solid`), la segunda `outline` (03 pinta solo la primera, como enlace).

## Recetas

### Copiar el código

El bloque no toca el portapapeles: emite `activate { event, item: code }` en el mismo gesto y tu aplicación copia y da su acuse. Hacerlo dentro del gesto es lo que permite `navigator.clipboard`:

```vue
<!-- Fragmento: `promo` y `avisar` son de tu aplicación (`avisar` da el acuse que prefieras, por ejemplo un GToast) -->
<script setup>
import { GbPromo02 } from '@grana/blocks/ecommerce'

async function activar({ item }) {
  if ('value' in item) { // «Copiar código»: el item es el PromoCode
    await navigator.clipboard.writeText(item.value)
    avisar('Código copiado')
  }
}
</script>

<template>
  <GbPromo02 v-bind="promo" @activate="activar" />
</template>
```

Un acuse en el sitio, junto al botón («Copiado»), está reservado: depende de que un componente ofrezca las acciones con acuse (hallazgo EC-L6).

### Dos promociones lado a lado

El bloque es una oferta. Dos ofertas son dos `GbPromo02` en una rejilla de tu aplicación, cada una con su pista de reparto:

```vue
<!-- Fragmento: `ofertaMezcal` y `ofertaTextiles` son de tu aplicación -->
<script setup>
import { GAdaptiveLayout } from '@grana/vue'
import { GbPromo02 } from '@grana/blocks/ecommerce'
</script>

<template>
  <GAdaptiveLayout>
    <div class="g-adapt-standard"><GbPromo02 v-bind="ofertaMezcal" /></div>
    <div class="g-adapt-standard"><GbPromo02 v-bind="ofertaTextiles" /></div>
  </GAdaptiveLayout>
</template>
```

Cada `GbPromo02` es una `section` con su propio título; el título de cada oferta es su nombre accesible. No hay una variante de «dos ofertas» porque obligaría a una lista con un título de sección que repite el de cada oferta (DECISIONS #914).

## Uso

```vue
<!-- Fragmento: `fotoJarro`, `irA` y `copiar` son de tu aplicación -->
<script setup>
import { GbPromo01 } from '@grana/blocks/ecommerce'

const promo = {
  title: 'Temporada de muertos: 10 % en barro negro',
  description: 'Jarros, cántaros y figuras de San Bartolo Coyotepec para el altar.',
  until: '2026-11-02T23:59',
  timeZone: 'America/Mexico_City',
  code: { value: 'OAXACA10', label: 'Código' },
  terms: 'En compras desde $1,500 MXN de barro negro. No acumulable con otras promociones.',
  locale: 'es-MX',
  actions: [
    { id: 'coleccion', label: 'Ver el barro negro', href: '/tienda/barro-negro' },
    { id: 'condiciones', label: 'Condiciones', href: '#promo' }
  ],
  labels: { until: 'Hasta el {date}', copy: 'Copiar código', external: 'se abre en otra pestaña' }
}
</script>

<template>
  <GbPromo01 v-bind="promo" @navigate="({ event, href }) => { event.preventDefault(); irA(href) }" @activate="copiar" />
</template>
```

`media` (`{ src, alt, width, height }`) solo lo usa 02. Pasada la fecha de `until`, el bloque avisa EC7 en desarrollo y se pinta igual.

## Ejemplos

### e1 · Una banda entre dos secciones (`GbPromo01`)

**Por qué:** cuando la oferta es de temporada y merece un corte de color entre la portada y el escaparate. La banda toma la zona de marca del tema: el texto y los botones usan el grupo de color de la zona, con su contraste garantizado. No sirve si la oferta lleva foto: ahí, la tarjeta.

```vue
<!-- Fragmento: `promo` es de tu aplicación -->
<GbPromo01 v-bind="promo" />
```

### e2 · La oferta sobre la foto (`GbPromo02`)

**Por qué:** cuando lo que se vende se ve mejor que se dice (el jarro, el rebozo). La tarjeta lleva la foto de fondo con el velo de `GCard`, y el texto sobre la foto se mide por píxeles.

```vue
<!-- Fragmento: `promo` es de tu aplicación (con `media`) -->
<GbPromo02 v-bind="promo" />
```

### e3 · Una línea sobre la rejilla (`GbPromo03`)

**Por qué:** cuando la oferta es un recordatorio, no el protagonista: una línea con el título, la fecha, el código y una acción, sobre la rejilla de productos. A 1440 cabe en una línea; en estrecho se parte sin desbordar.

```vue
<!-- Fragmento: `promo` es de tu aplicación -->
<GbPromo03 v-bind="promo" />
```

### e4 · Sin código ni fecha

**Por qué:** cuando la oferta es permanente («Envío gratis desde $3,000»). Sin `until` no hay fecha; sin `code`, no hay botón de copiar; las condiciones siguen a la vista.

```vue
<!-- Fragmento: `envioGratis` es de tu aplicación -->
<GbPromo01 title="Envío gratis desde $3,000" terms="En compras a toda la República." :actions="[{ label: 'Ver la tienda', href: '/tienda' }]" :labels="{ external: 'se abre en otra pestaña' }" />
```

## Props

Una sola interfaz para las tres variantes (`GbPromoProps`). Los tipos de datos salen de `@grana/blocks/ecommerce`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | El título de la oferta. |
| `description` | `string` | Solo 01 y 02. El slot `description` la sustituye. |
| `media` | `Media` | Solo 02: la foto de fondo de la tarjeta. |
| `actions` | `Action[]` (requerida) | 1 a 2 (§3; C8 por encima): la primera `solid`, la segunda `outline`; 03 pinta solo la primera, como enlace. |
| `until` | `string` | ISO (fecha, o fecha y hora): hasta cuándo vale; se dice como fecha en `<time>`. Sin zona vale en la hora de la tienda. No ISO: PM1; ya pasada al montar: EC7. |
| `timeZone` | `string` | IANA de la tienda: una fecha con zona (`Z`, `±hh:mm`) se dice en ella. |
| `code` | `PromoCode` | `{ value, label }`: el valor con `translate="no"` y el botón «Copiar código». |
| `terms` | `string` | Condiciones, siempre a la vista; describen la acción principal (`aria-describedby`). |
| `locale` | `string` | BCP 47; sin él, el `lang` del ancestro al montar. |
| `labels` | `PromoLabels = {}` | `until` (con `until`), `copy` (con `code`) y `external`; sin valores por defecto (C5). |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href, item }` (`BlockNavigate<Action>`) | Una acción con `href`, con clic primario; nunca con `external` |
| `activate` | `{ event, item }` (`PromoActivate`) | Una acción sin `href` (`item`: la `Action`) o «Copiar código» (`item`: el `PromoCode`), síncrono en el gesto |

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `description` | — | Sustituye a la prop `description` |
| `actions` | `{ describedby: string \| undefined }` | Escape de las acciones (§3) con el `id` de las condiciones, para ligarlas a tu propio botón |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `until` | Sí, con `until` (C5). Plantilla con `{date}` o función `(date) => string` |
| `copy` | Sí, con `code` (C5; sin él, el código sin botón) |
| `external` | Sí, con una acción externa (C5) |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| `Tab` | Recorre el botón «Copiar código» (con `code`) y las acciones |
| `Intro` o `Espacio` | Activa el botón enfocado (`activate`) o sigue el enlace (`navigate`) |

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. La fecha va en `<time datetime>` y se dice en la zona de la tienda, también con el sistema en otra zona (`prueba`, Vitest). No hay cuenta atrás: `setInterval` y `setTimeout` no se llaman al montar (`prueba`; cumple 2.2.2).
b. 01 va en la zona de marca en los tres temas; el texto de 02 sobre la foto, medido **por píxeles**, tiene al menos 17,93:1 en el peor caso; 03 cabe en una línea a 1440.
c. 01 y 02 son una sección con título; 03 es un `role="group"` con nombre y sin encabezado. Ningún `h1`.
d. Las condiciones están ligadas a la acción principal por `aria-describedby` (`prueba`).
e. Sin desplazamiento horizontal a 1440, 390, 320 ni a 320 con el texto al 200 %.

> **Peligro.** El bloque no comprueba que la oferta siga vigente: pasada la fecha de `until` se pinta igual y solo avisa en desarrollo (EC7). Quita la oferta de tu página (o cambia `until`) antes de que venza, o la persona verá «Hasta el 2 de noviembre» el 3. Y una `until` que no es ISO no se pinta (PM1): la oferta se queda sin fecha.

## Personalidad

Nada se mueve: ni la banda, ni la tarjeta, ni la línea animan nada propio, y no hay temporizadores. La personalidad es de contenido (#925): hasta cuándo, con qué condiciones y un código que se lee en voz alta. Con movimiento reducido no cambia nada.

## Avisos de desarrollo

Prefijo `[Grana GbPromo<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C8, EC1 a EC7) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-ecommerce). Los de esta sección: C2, C4 a C6, C8, EC7 (`until` ya pasado al montar: se pinta igual). El propio:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| PM1 | `until` que no es ISO | No se pinta la fecha |

## Banco de datos de ejemplo

`promo.bank.js` exporta `{ props }` con «Temporada de muertos: 10 % en barro negro», `until` `2026-11-02T23:59` con `timeZone: 'America/Mexico_City'`, `code` OAXACA10, `terms`, `media` (el jarro) y dos acciones («Ver el barro negro» y «Condiciones»). **A partir del 2 de noviembre de 2026 el banco avisa EC7** (la fecha ya pasó); las pruebas fijan la fecha. Con él, antes de esa fecha, ninguna variante avisa. Banco real: `packages/blocks/playground/ecommerce/promo.html`.

## Peso

`dist/ecommerce.js` pesa **49 328 B gzip** con sus trozos compartidos (`medido` con `node packages/blocks/scripts/measure-entry.mjs ecommerce`, 2026-10-26); tope de la entrada **51 200 B** (DECISIONS #932; no se vuelve a subir). Una variante importada sola (`node packages/blocks/scripts/measure-partial.mjs 7168 ecommerce GbCheckout=9728 +cartTotals=2048`): `GbPromo01` 3 196 B, `GbPromo02` 3 426 B, `GbPromo03` 3 163 B; tope por variante **7 168 B** (#932). `@grana/vue` es *peer*: lo paga la aplicación.

## Alcance

- **Sin cuenta atrás ni urgencia falsa:** no hay temporizadores, «quedan 5 minutos» ni contadores de personas viendo (#925, 2.2.2). Una oferta dice hasta qué fecha.
- **No copia el código:** emite `activate`; tu aplicación usa `navigator.clipboard`. El acuse «Copiado» en el sitio está **reservado** (EC-L6).
- **No valida la oferta:** el bloque no comprueba que `code` exista ni que `until` siga vigente.
- **Una oferta por bloque:** dos ofertas son dos `GbPromo02` en tu rejilla (receta arriba).
- **Sin antetítulo** (B-L1): `GSection` no tiene antetítulo.
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbPromo` (`time` con `datetime` y el texto en la zona de la tienda; ningún temporizador al montar; `activate` con `code` síncrono; `terms` en el `aria-describedby` de la principal; 03 con `role="group"` y una acción; avisos PM1 y EC7) | `npm test -w @grana/blocks` pasa **1 463 de 1 463** en 40 archivos (todo el paquete, 2026-10-26) | `prueba` |
| Auditoría de coco: 01 en la zona de marca y 02 sobre foto (17,93:1 en el peor caso) en tres temas; 03 en una línea a 1440; veredicto `candidate` | Familia: Chromium 3 248 de 3 275, Firefox 3 189 de 3 216 y WebKit 3 188 de 3 216 al auditar; 3 266 de 3 275 tras el remate de bruno (#945) | `medido` |

**No verificado:** lector de pantalla real (la fecha en palabras y las condiciones leídas con la acción principal); `forced-colors` real; teléfono real; el copiado real del portapapeles (es de tu aplicación). **Pendientes abiertos:** EC-L6 (acuse en el sitio); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/promo.md`](../../../../../design/contracts/blocks/promo.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§26 a §39).
- Decisiones: #909 a #914, #925, #932 en `DECISIONS.md`.
- Metadatos: [`GbPromo.meta.json`](./GbPromo.meta.json). Pruebas: [`GbPromo.test.js`](./GbPromo.test.js). Auditoría: [`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md).
