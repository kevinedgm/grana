# Contrato · Location (`GbLocation01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #860 a #866 y #876, 2026-10-22) · **Plan:** B10 (§4.3); receta R8 de `design/lab/marketing/r01/` · **Entrada:** `@grana/blocks/booking` · **Común:** `_comun.md` §1 a §5 y §14 a §25 · **Compone:** `GSection`, `GCard`, `GAdaptiveLayout`, `GStack`, `GText` (`as="address"`), `GBtn`, `GIcon` · **Parte de bruno:** B

## Promesa

Dónde está el lugar (o dónde se reúne el grupo), **en una dirección de verdad que se puede copiar**, con su horario, el mapa como imagen que describe el sitio y «Cómo llegar» que abre la ruta en el teléfono. El mapa vivo queda para `GEmbed` (reservado, BK-L5).

## Props

```ts
interface GbLocationProps {
  title: string
  description?: string
  name?: string                          // nombre del lugar en la dirección («Casa Alcalá»)
  address?: string[]                     // líneas postales
  hours?: string[]                       // líneas de horario («Recepción 24 h»)
  map?: Media                            // imagen estática; `alt` que describe el lugar (R8), no «mapa»
  directions?: Action                    // «Cómo llegar» (casi siempre `external`: Google Maps, Apple Maps, `geo:`)
  channels?: Channel[]                   // teléfono, WhatsApp
  points?: Point[]                       // puntos de encuentro (tour); 0 a 8 (C7)
  timeZone?: string                      // la hora de `Point.time`
  locale?: string
  labels?: {
    map?: string                         // nombre de la tarjeta del mapa en 02 («Mapa de la zona»)
    points?: string                      // título de los puntos (03) («Puntos de encuentro»)
    hours?: string                       // rótulo del horario («Horario»)
    channels?: string                    // nombre de la lista de canales
    external?: string
  }
}
```

Sin `address` ni `points`, aviso L1 (no hay a dónde ir) y se pinta lo que haya.

## La dirección (común)

```
GText as="address" size="body-sm"
├─ <p> name (si hay) + líneas de `address` con <br>
├─ GStack as="ul" gap="sm" [aria-label=labels.channels] › li › GBtn variant="link" (tel:, https://wa.me/…; hint en GText caption muted)
└─ <p> labels.hours + líneas de `hours`
GBtn (directions) — la primera acción del bloque: `solid` en 01, `outline` en 02 y 03 (§3); externa con su marca y `labels.external`
```

**Texto real, nunca solo imagen** (1.1.1, 1.4.5): la dirección se lee, se selecciona y se copia; el mapa la acompaña. `<address>` es la dirección **del lugar** de la página (uso de contacto del HTML).

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Tarjeta con mapa** | Una tarjeta: el mapa arriba, la dirección, el horario y «Cómo llegar» | `GCard as="section"` (raíz; título al nivel de `useSectionLevel()`, `description`; `media` = `<img>` del `map` arriba) › la dirección › `actions`: `directions` | `points` |
| **02 · Dos columnas** | La dirección y cómo llegar a un lado, el mapa al otro | `GSection` › `GAdaptiveLayout gap="lg"` › [`div` `g-adapt-wide`: la dirección + `directions`] + [`GCard as="div" level="flat" mediaPosition="top"` `g-adapt-standard`, `title` = `labels.map`, `media` = el mapa] | `points` |
| **03 · Puntos de encuentro** | La lista de sitios donde empieza el recorrido, cada uno con su hora y su ruta | `GSection` › [la dirección principal si hay] + `GSection` anidada (`labels.points`) › `GStack as="ul" gap="md"` › `GCard as="li" level="outlined" orientation="auto" mediaPosition="start"` por punto (`title` = `name`, slot `eyebrow` = `<time>` de `time`, `description`, `media`, la dirección del punto en `GText as="address"`, `actions`: su `directions` `outline`) | `map` (cada punto lleva su foto) |

## Eventos

`navigate` y `activate` (§4). Los enlaces del sistema (`tel:`, `geo:`) y los externos no emiten `navigate` (#574, #834).

## Slots

`map` (escape: en lugar del `<img>`, p. ej. una fachada de `GEmbed` cuando exista; dentro del `media` de `GCard`), `address` (escape).

## Qué lo hace distinto (#876)

**La dirección se puede copiar y la ruta empieza donde estás.** El viajero que llega en taxi enseña o copia la dirección (texto, no una imagen de mapa); «Cómo llegar» abre la aplicación de mapas del teléfono con el destino ya puesto (el enlace lo da la aplicación); el mapa estático **dice el sitio** en su texto alternativo («A dos calles de Santo Domingo, esquina con Alcalá») y no carga nada de terceros; en un tour, cada punto de encuentro dice **a qué hora te esperan** en la hora del lugar. Sin iframes ni cookies: cuando llegue `GEmbed`, el mapa vivo será a petición.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `map` | Sí, en 02 con `map` (C5) |
| `points` | Sí, en 03 con `points` (C5) |
| `hours` | Sí, con `hours` (C5) |
| `channels` | Sí, con `channels` (C5) |
| `external` | Sí, con un enlace externo (C5) |

## Avisos propios (`[Grana GbLocation<NN>]`)

C4 a C7. Además: **L1** · sin `address` ni `points`, **L2** · `map.alt` vacío o que solo dice «mapa»/«map» (se pinta; el texto alternativo debe describir el sitio, R8), **L3** · `points` en 01 o 02 **y sin `address`** (no los usan y la sección quedaría sin nada que leer; una vez, para que la aplicación elija 03; con `address` no avisa, #888).

## Banco (`location.bank.js`)

Casa Alcalá: `name`, dos líneas de dirección, `hours` (recepción, desayuno), `map` 1200 × 800 con `alt` descriptivo, `directions` externo a un mapa, `channels` (WhatsApp externo, `tel:`); tres `points` del tour (Zócalo 07:45, hotel 08:00, uno mínimo con solo `name`) en `America/Mexico_City`; `labels` completos. El banco **no** dispara L3: Vitest monta 01 y 02 con `points` en un caso aparte.

## Verificación propia

Vitest: `address` real con las líneas y los canales dentro; el mapa es un `<img>` con su `alt` dentro de `media` (01, 02), nunca fuera de un componente; «Cómo llegar» externo con `aria-label` «{label}, {external}» y sin `navigate`; 03 con un `li` por punto y su hora en `time`; L2 con `alt: 'Mapa'`. Chromium: 02 en dos columnas a 1440 y una a 390; la dirección no desborda a 320 con una calle larga; sin peticiones de red a terceros al cargar la página del banco.
