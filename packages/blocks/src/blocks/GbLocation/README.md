# GbLocation · GbLocation01, GbLocation02 y GbLocation03

Dónde está el lugar (o dónde se reúne el grupo), **en una dirección de verdad que se puede copiar**, con su horario, el mapa como imagen que describe el sitio y un «Cómo llegar» que abre la ruta en el teléfono. El mapa vivo queda para `GEmbed` (reservado, BK-L5): hoy el mapa es una imagen estática de tu aplicación, sin red de terceros. Va como tarjeta con mapa, en dos columnas o como lista de puntos de encuentro. Compone `GSection`, `GCard`, `GAdaptiveLayout`, `GStack`, `GText as="address"`, `GBtn` y `GIcon`; no trae color, CSS ni textos propios.

**Etiquetas:** `<gb-location-01>`, `<gb-location-02>`, `<gb-location-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/booking`

```js
import { GbLocation01, GbLocation02, GbLocation03 } from '@grana/blocks/booking'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/booking/location.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Esta sección solo necesita `@grana/vue`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**La dirección se puede copiar y la ruta empieza donde estás** (DECISIONS #876). El viajero que llega en taxi enseña o copia la dirección (texto, no una imagen de mapa); «Cómo llegar» abre la aplicación de mapas del teléfono con el destino ya puesto (el enlace lo da tu aplicación); el mapa estático **dice el sitio** en su texto alternativo («Casa Alcalá, a dos calles de Santo Domingo, en la esquina de Alcalá con Murguía») y no carga nada de terceros; y en un tour, cada punto de encuentro dice **a qué hora te esperan**, en la hora del lugar.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbLocationProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbLocation01` | Tarjeta con mapa: el mapa arriba, la dirección, el horario y «Cómo llegar» | `GCard as="section"` (raíz; título al nivel de `useSectionLevel()`, `media` = el `<img>` del mapa) > la dirección > `actions`: `directions` (`solid`) | `points` |
| `GbLocation02` | Dos columnas: la dirección y cómo llegar a un lado, el mapa al otro | `GSection` > `GAdaptiveLayout gap="lg"` > [`div g-adapt-wide`: la dirección + `directions` `outline`] + [`GCard as="div" level="flat" mediaPosition="top"` `g-adapt-standard` con el mapa] | `points` |
| `GbLocation03` | Puntos de encuentro: la lista de sitios donde empieza el recorrido, cada uno con su hora y su ruta | `GSection` > [la dirección principal si hay] + una `GSection` anidada (`labels.points`) > `GStack as="ul" gap="md"` > `GCard as="li" level="outlined"` por punto (nombre, hora en `time`, descripción, foto, su dirección en `GText as="address"` y su `directions` `outline`) | `map` (cada punto lleva su foto) |

**La dirección (común):** una `GText as="address"` con el nombre y las líneas de `address`, la lista de canales (teléfono, WhatsApp, correo; cada uno con su ayuda) y el horario (`labels.hours` y las líneas de `hours`). Es texto real, nunca solo imagen (1.1.1, 1.4.5). `<address>` es la dirección **del lugar** de la página.

**«Cómo llegar»** es la primera acción del bloque. Casi siempre es `external` (Google Maps, Apple Maps, `geo:`): lleva su marca y `labels.external`, y no emite `navigate`. Los `tel:`, `mailto:` y `sms:` tampoco.

**Las horas de un punto** (`Point.time`) se dicen en la zona del lugar (`timeZone`), no en la del teléfono del viajero: `HH:mm` tal cual o una fecha y hora ISO en esa zona.

## Recetas

### Montaje en columna (BK-L13)

`GbLocation01` está pensada para una **columna** (de 360 a 640 px), no para toda la página. A 1440 px de ancho su foto mide de 560 a 700 px de alto y baja la dirección y el horario del primer pantallazo (hallazgo BK-L13, #905). Móntala dentro de una columna de tu aplicación, o prefiere `GbLocation02`, que ya reparte la dirección y el mapa en dos columnas:

```vue
<!-- Fragmento: `ubicacion` es de tu aplicación -->
<GContainer width="reading">
  <GbLocation01 v-bind="ubicacion" />
</GContainer>
```

El banco la monta a 1024 px por la misma razón.

### Un recorrido con varios puntos de encuentro

Con `points`, usa `GbLocation03`: cada punto lleva su hora y su ruta. `01` y `02` ignoran `points` en silencio si hay `address`; sin `address` avisan L3, porque la sección quedaría sin nada que leer.

## Uso

```vue
<script setup>
import { GbLocation02 } from '@grana/blocks/booking'

const ubicacion = {
  title: 'Dónde estamos',
  description: 'En el centro de Oaxaca, a dos calles de Santo Domingo.',
  name: 'Casa Alcalá',
  address: ['Macedonio Alcalá 307, Centro', '68000 Oaxaca de Juárez, Oax.'],
  hours: ['Recepción las 24 horas', 'Desayuno de 8:00 a 11:00'],
  map: { src: '/mapa/casa-alcala.jpg', width: 1200, height: 800, alt: 'Casa Alcalá, a dos calles de Santo Domingo, en la esquina de Alcalá con Murguía' },
  directions: { id: 'llegar', label: 'Cómo llegar', href: 'https://maps.example.com/?q=Casa+Alcala+Oaxaca', external: true, icon: 'navigation' },
  channels: [
    { label: 'WhatsApp', href: 'https://wa.me/529515550000', external: true, icon: 'message-circle', hint: 'Respuesta en menos de 2 h' },
    { label: '951 555 0000', href: 'tel:+529515550000', icon: 'phone' }
  ],
  timeZone: 'America/Mexico_City',
  locale: 'es',
  labels: { map: 'Mapa de la zona', hours: 'Horario', channels: 'Escríbenos', external: 'se abre en otra pestaña' }
}
</script>

<template>
  <GbLocation02 v-bind="ubicacion" />
</template>
```

La aplicación registra los iconos Lucide que use (`createIcons`: `message-circle`, `phone`, `mail`, `navigation`). Esta sección solo carga `@grana/vue`.

## Ejemplos

### e1 · La dirección en una tarjeta con mapa (`GbLocation01`)

**Por qué:** cuando la ubicación es una pieza dentro de una columna (pie de página, contacto). El mapa abre la tarjeta y «Cómo llegar» es la acción principal.

```vue
<!-- Fragmento: `ubicacion` es de tu aplicación -->
<GbLocation01 v-bind="ubicacion" />
```

### e2 · La dirección y el mapa lado a lado (`GbLocation02`)

**Por qué:** cuando la ubicación tiene su propia sección en una página ancha. La dirección y cómo llegar quedan a un lado y el mapa al otro; en estrecho, uno debajo del otro.

```vue
<!-- Fragmento: `ubicacion` es de tu aplicación -->
<GbLocation02 v-bind="ubicacion" />
```

### e3 · Los puntos donde empieza un recorrido (`GbLocation03`)

**Por qué:** cuando el grupo se reúne en varios sitios según dónde se hospede cada quien. Cada punto dice a qué hora te esperan y cómo llegar.

```vue
<!-- Fragmento: `puntos` es de tu aplicación (lista de { name, time, description, address, directions, media }) -->
<GbLocation03 v-bind="{ ...ubicacion, points: puntos }" />
```

### e4 · Un mapa propio en lugar de la imagen (slot `map`)

**Por qué:** cuando tu aplicación ya tiene su propio mapa (una fachada de `GEmbed` cuando exista). El slot sustituye al `<img>` dentro del `media` de la tarjeta (01 y 02).

```vue
<!-- Fragmento: `MiMapa` es de tu aplicación -->
<GbLocation02 v-bind="ubicacion">
  <template #map>
    <MiMapa />
  </template>
</GbLocation02>
```

## Props

Una sola interfaz para las tres variantes (`GbLocationProps`). Los tipos de datos salen de `@grana/blocks/booking`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | Título de la sección (en 01, el de la tarjeta, al nivel de `useSectionLevel()`). |
| `description` | `string` | Descripción de la sección. |
| `name` | `string` | Nombre del lugar en la dirección («Casa Alcalá») |
| `address` | `string[]` | Líneas postales; texto real que se copia (1.1.1, 1.4.5) |
| `hours` | `string[]` | Líneas de horario («Recepción 24 h»), con labels.hours (C5) |
| `map` | `Media` | Imagen estática con alt que describe el sitio (L2), no «mapa»; 03 la ignora. Solo `GbLocation01`, `GbLocation02`; las demás lo ignoran. |
| `directions` | `Action` | «Cómo llegar»: la primera acción del bloque (solid en 01, outline en 02 y 03); casi siempre external (no emite navigate, #574) |
| `channels` | `Channel[]` | Teléfono, WhatsApp, correo; tel:/mailto:/sms: y los externos no emiten navigate (#834) |
| `points` | `Point[]` | Puntos de encuentro (tour), 0 a 8 (C7); solo 03. 01 y 02 los ignoran en silencio salvo sin address (L3) Solo `GbLocation03`; las demás lo ignoran. |
| `timeZone` | `string` | IANA del lugar: la hora de Point.time (HH:mm tal cual; una fecha y hora ISO, en esa zona) |
| `locale` | `string` |  |
| `labels` | `LocationLabels = {}` | map (02 con map), points (03 con points), hours (con hours), channels (con channels), external (con un enlace externo); C5; sin valores por defecto |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href, item }` (`BlockNavigate<Action \| Channel \| Point>`) | Un enlace interno con clic primario (#505): directions, un canal o la ruta de un punto (item = el punto); nunca con external (#574) ni con tel:/mailto:/sms:/geo (#834) |
| `activate` | `{ event, item }` (`BlockActivate<Action \| Point>`) | Una directions sin href |

Una `directions` sin `href` emite `activate`. Un enlace `external` no emite `navigate`.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `map` | — | Escape: en lugar del <img> del mapa (p. ej. la fachada de GEmbed cuando exista), dentro del media de GCard. Solo `GbLocation01`, `GbLocation02`. |
| `address` | — | Escape: el contenido de la GText as="address" de la dirección principal |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `map` | Sí, en 02 con `map` (C5): nombre de la tarjeta del mapa |
| `points` | Sí, en 03 con `points` (C5): título de la lista |
| `hours` | Sí, con `hours` (C5) |
| `channels` | Sí, con `channels` (C5): nombre de la lista |
| `external` | Sí, con un enlace externo (C5) |

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. La dirección es un `address` real con las líneas y los canales dentro; el mapa es una imagen con `alt`, dentro de un componente, nunca suelta (`prueba`, Vitest).
b. «Cómo llegar» es un enlace externo con su marca y su `aria-label` «{label}, {external}», sin `navigate`.
c. Sin peticiones de red a terceros al cargar la página del banco (spec de bruno, Chromium).
d. 02: dos columnas a 1440 y una a 390; la dirección con una calle larga no desborda a 320.
e. Sin desplazamiento horizontal a 1440, 390, 320 ni a 320 con el texto al 200 %; el botón con una palabra larga parte la etiqueta sin desbordar (BK-C2, corregido en `GBtn.css`).
f. Nada se mueve.

> **Peligro.** El `alt` del mapa debe describir el sitio («A dos calles de Santo Domingo, esquina con Alcalá»), no decir «mapa». Con un `alt` vacío o que solo dice «mapa», el bloque avisa L2 y pinta la imagen: quien usa lector oye una imagen sin sentido y, como la dirección es texto aparte, tampoco sabe a qué se refiere el mapa.

## Avisos de desarrollo

Prefijo `[Grana GbLocation<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C4 a C7) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-booking). Los propios:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| L1 | Sin `address` ni `points` | No hay a dónde ir; se pinta lo que haya |
| L2 | `map.alt` vacío o que solo dice «mapa» o «map» | Se pinta; el texto alternativo debe describir el sitio |
| L3 | `points` en 01 o 02 y sin `address` | No los usan; para un recorrido, 03 |

## Banco de datos de ejemplo

`location.bank.js` exporta `{ appIcons, props, slots }`: Casa Alcalá con `name`, dos líneas de dirección (una con una calle larga sin espacios para la prueba de 320 px), `hours`, `map` de 1200 × 800 con un `alt` que describe el sitio, `directions` externo a un mapa, `channels` (WhatsApp externo, `tel:` y un correo con `lang: 'en'`), tres `points` del tour (Zócalo 07:45, el hotel 08:00 y uno mínimo con solo `name`) en `America/Mexico_City` y `labels` completos. El banco **no** dispara L3: las pruebas montan 01 y 02 con `points` en un caso aparte. Banco real: `packages/blocks/playground/booking/location.html`.

## Peso

`dist/booking.js` pesa **36 851 B gzip** con su trozo compartido de `common/` (las 11 secciones y 33 variantes; `medido` con `node packages/blocks/scripts/measure-entry.mjs booking`  2026-10-23); tope de la entrada **37 888 B** (DECISIONS #907; el tope inicial de 36 KiB no se vuelve a subir). Una variante importada sola (esbuild minificado  `vue` y `@grana/vue*` externos; `node packages/blocks/scripts/measure-partial.mjs 5120 booking GbGuestForm=7168`): `GbLocation01` 3 877 B  `GbLocation02` 3 954 B  `GbLocation03` 4 268 B; tope por variante **5 120 B** (#887). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **Sin mapa vivo:** `GEmbed` (BK-L5) queda reservado; el slot `map` está listo para cuando llegue, a petición y sin cookies.
- **El mapa es una imagen de tu aplicación:** el bloque no la pide a ningún servicio.
- **03 ignora `map`:** cada punto lleva su propia foto.
- **BK-L13 (#905):** la tarjeta 01 se monta en una columna; la receta está arriba.
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbLocation` (`address` real con las líneas y los canales dentro; el mapa es un `<img>` con `alt` dentro de `media`; «Cómo llegar» externo con `aria-label` y sin `navigate`; 03 con un `li` por punto y su hora en `time`; L2 con `alt: 'Mapa'`) | 37/37 (`npm test -w @grana/blocks`, 2026-10-23) | `prueba` |
| Auditoría de coco: Location 01, 02 y 03; sin red de terceros (spec de bruno) | Veredicto `candidate`, sin hallazgos propios abiertos | `medido` |

**No verificado:** lector de pantalla real (la dirección y el `alt` del mapa); abrir «Cómo llegar» en la aplicación de mapas de un teléfono real; `forced-colors` real; rendimiento con el perfilador. **Pendientes abiertos:** BK-L13 (receta de montaje, arriba); BK-L5 (`GEmbed`); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/location.md`](../../../../../design/contracts/blocks/location.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§15 a §25).
- Decisiones: #860 a #866, #876, #888, #905, #907 en `DECISIONS.md`.
- Metadatos: [`GbLocation.meta.json`](./GbLocation.meta.json). Pruebas: [`GbLocation.test.js`](./GbLocation.test.js). Auditoría: [`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md).
