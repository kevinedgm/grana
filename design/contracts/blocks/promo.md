# Contrato · Promo (`GbPromo01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #909 a #914 y #925, 2026-10-23) · **Plan:** E11 (§4.2) · **Entrada:** `@grana/blocks/ecommerce` · **Común:** `_comun.md` §1 a §5 y §26 a §38 · **Compone:** `GSection`, `GSurface zone="brand"`, `GCard`, `GContainer`, `GBtn`, `GText` · **Parte de bruno:** A

## Promesa

Una oferta de la tienda **con lo que da, hasta qué fecha y con qué condiciones**, y su código listo para copiar. Sin reloj que corre.

## Props

```ts
interface GbPromoProps {
  title: string
  description?: string
  media?: Media
  actions: Action[]                    // 1 a 2 (§3): «Ver la colección», «Condiciones»
  until?: string                       // ISO (fecha o fecha y hora): hasta cuándo vale; se dice como fecha
  timeZone?: string                    // IANA de la tienda (la oferta acaba en la hora de la tienda)
  code?: PromoCode                     // { value: 'OAXACA10', label: 'Código' }
  terms?: string                       // condiciones, en texto («En compras desde $1,500. No acumulable.»)
  locale?: string
  labels?: {
    until?: string | ((date: string) => string)   // «Hasta el {date}»
    copy?: string                      // «Copiar código»
    external?: string
  }
}
```

## Piezas (comunes)

- **La fecha**: `until` en `<time datetime>` con `Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone })` dentro de `labels.until` («Hasta el domingo, 15 de noviembre»). **Nunca una cuenta atrás**, «quedan 3 horas» ni un temporizador (2.2.2; §27 regla 7). Con `until` en el pasado al montar: EC7 y se pinta igual.
- **El código**: `GText` con `code.label` y el valor (`span` con `translate="no"`, para que el traductor del navegador no lo cambie) y un `GBtn variant="outline"` `labels.copy` que emite **`activate { event, item: code }`** síncrono en el gesto (la aplicación usa `navigator.clipboard` y da su acuse con `GToast`; como «Compartir» de Confirmation, #873; acuse en el sitio reservado, EC-L6). El código se lee también en voz (texto, no imagen).
- **Las condiciones**: `terms` en `GText size="caption" tone="muted"`, **siempre a la vista** junto a la oferta (no detrás de un asterisco ni de un «ver condiciones» plegado), con `id` ligado por `aria-describedby` a la acción principal (patrón de `assurance`, #838, con `GbActions`).
- **Acciones**: §3 (la primera, `solid`; la segunda, `outline`; en la banda de marca, las de la zona).

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Banda** | Una banda de marca a todo lo ancho entre dos secciones | `GSurface zone="brand" level="flat"` (raíz, #830) › `GContainer` › `GSection` (título, descripción) › `GStack gap="md"` › fecha + código + condiciones + acciones | `media` |
| **02 · Tarjeta con imagen** | La oferta sobre la foto de lo que se vende | `GSection` › `GCard mediaPosition="background"` (título de la oferta como título de la tarjeta, `min(level, 6)`, como CTA 02) con fecha, código, condiciones y acciones en el cuerpo y `actions` | — |
| **03 · Línea** | Una línea sobria sobre la rejilla: el título, la fecha y una acción | `GText as="div" size="body-sm"` (raíz, `role="group"` con `aria-label` = `title`, como Booking summary 03, #894) › `GAdaptiveLayout gap="md" vertical="center"` › [`strong` título + fecha] + código + primera acción (`variant="link"`) | `media`, `description`, la segunda acción; `terms` va debajo de la línea |

**Dos ofertas lado a lado** (plan): dos `GbPromo02` en una rejilla de la aplicación (`GAdaptiveLayout` con `g-adapt-standard` en cada una; receta del README), no una variante (§36).

## Eventos

`navigate` y `activate` de `actions` (§4); `activate { event, item: code }` de «Copiar código».

## Slots

`description` (escape), `actions` `{ describedby }` (escape de §3 con el `id` de las condiciones, #838).

## Estructura accesible

01 y 02: región de sección con título (nivel automático; en 02 el de la tarjeta); 03: `role="group"` con nombre, sin encabezado. La fecha en `time`. El código es texto copiable también a mano (seleccionable). En la zona de marca, los textos y los `GBtn` usan el grupo de color de la zona (`tokens.md` §44.5; contraste que coco mide).

## Qué lo hace distinto (#925)

**La oferta dice cuándo acaba con una fecha, no con un reloj.** «Hasta el domingo, 15 de noviembre, en la hora de Oaxaca» en lugar de una cuenta atrás que apura a quien lee despacio o con lector (2.2.2) y que es la presión falsa de siempre. Las condiciones van **al lado** de la oferta y se oyen con la acción principal, no escondidas tras un asterisco; el código se copia en un toque y se puede leer en voz alta.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `until` | Sí, con `until` (C5; sin él, la fecha sin frase) |
| `copy` | Sí, con `code` (C5; sin él, el código sin botón) |
| `external` | Sí, con una acción externa (C5) |

## Avisos propios (`[Grana GbPromo<NN>]`)

C2, C4 a C6, C8, EC7. Además: **PM1** · `until` que no es ISO (no se pinta la fecha).

## Banco (`promo.bank.js`)

«Temporada de muertos: 10 % en barro negro», `until` `2026-11-02T23:59` con `timeZone: 'America/Mexico_City'`, `code` OAXACA10, `terms`, `media` (el jarro), `actions` «Ver el barro negro» (`href`) y «Condiciones» (`href` `#promo`).

## Verificación propia

Vitest: `time` con `datetime` y el texto en la zona de la tienda (también con el sistema en otra zona); ningún temporizador (`setInterval`/`setTimeout` no se llaman al montar); `activate` con `code` síncrono; `terms` en el `aria-describedby` de la principal; 03 con `role="group"` y una acción. Chromium: 01 en la zona de marca en los tres temas; 03 en una línea a 1440 y partida sin desbordar a 320.
