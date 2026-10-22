# Contrato · Stats (`GbStats01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #815 a #817 y #820, 2026-10-22; remates #829, #830, #841, #856) · **Plan:** M4 (§4.1) · **Entrada:** `@grana/blocks/marketing` · **Común:** `_comun.md` · **Compone:** `GSection`, `GAdaptiveLayout`, `GMetric`, `GSurface zone="brand"`, `GContainer`

## Promesa

Dos a seis cifras que sostienen la promesa del sitio («12 habitaciones», «4,8 en Google», «desde 1998»), **quietas, legibles al primer pintado y con su origen a la vista**.

## Props

```ts
interface GbStatsProps {
  title: string                        // obligatorio (corrige el `title?` del plan, _comun.md §10)
  description?: string
  items: Stat[]                        // 2 a 6 (C7 fuera de ese rango)
}
```

`Stat.value` se pinta **tal cual** (cadena ya formateada por la aplicación en su idioma; un `Number` se pinta con `String()`): el bloque no formatea, no redondea y no anima.

## Variantes

| Variante | Concepto | Compone | Notas |
| --- | --- | --- | --- |
| **01 · Fila** | Las cifras en una línea que se parte sola | `GSection` › `GAdaptiveLayout role="list"` › `div role="listitem" class="g-adapt-short"` › `GMetric size="lg"` | `label`, `value`, `unit`; `source` como `context` |
| **02 · Banda** | Las cifras dentro de una banda de marca | `GSurface zone="brand" level="flat" padding="lg"` (raíz; `flat`: sin borde ni radio, también a sangre, #830) › `GSection` › la lista de 01 | Banda a sangre: `class="g-bleed"` de la aplicación dentro de un `GContainer` (regla 1 de `_comun.md`). La zona cuenta como el sólido de marca de la región (R5): una banda de marca por página además del héroe |
| **03 · Junto a un párrafo** | El párrafo que explica y las cifras que lo prueban, lado a lado | `GSection` (sin `description`) › `GAdaptiveLayout` › [`div class="g-adapt-wide"` › `GContainer width="reading"` › `GText as="div"` con los párrafos de `description` o el slot `description` (#841, #856)] + [`GAdaptiveLayout role="list"` anidado con las cifras de 01] | Sin `description`, 03 se pinta como 01 |

## Eventos y slots

Ningún evento. Slot `description` (sustituye al párrafo de 03 y a la descripción de la sección en 01 y 02).

## Estructura accesible

Lista de cifras con nombre implícito por la sección; cada `GMetric` lee etiqueta, cifra, unidad y contexto en ese orden (su estructura). Sin `aria-live`: nada cambia.

## Qué lo hace distinto (#820)

**Ninguna cifra sin su origen, y ninguna cuenta hacia arriba.** Cada cifra lleva su `source` a la vista («4,8 · 312 opiniones en Google, octubre de 2026») en el contexto de `GMetric`: el viajero que llega desde Instagram sabe de dónde sale el número. Y se descarta el contador animado que es costumbre en esta sección: la cifra es legible en el primer pintado, en una captura de pantalla y con conexión lenta, y nada se mueve solo (2.2.2).

## Textos (`labels`)

Ninguno: todo el texto viene en los datos.

## Avisos propios (`[Grana GbStats<NN>]`)

Comunes C1 a C3 y C7. Además: **S1** · una cifra sin `source` (una vez por instancia; se pinta igual), **S2** · más de un bloque `[data-gb="stats-02"]` o `[data-gb="cta-01"]` en el documento (dos bandas de marca compiten; R5), en `onMounted`.

## Banco (`stats.bank.js`)

Cuatro cifras de Casa Alcalá: «12» habitaciones; «4,8» de 5 (`source` Google con fecha); «1998» desde; «3 min» a pie de Santo Domingo; una mínima sin `unit`; `description` de dos frases.

## Verificación propia

Vitest: `GMetric` por cifra con `context` = `source`; en 03, los párrafos dentro de una `GText` `div` (sin márgenes del navegador; el primero a ras del inicio de la columna); 02 con `data-g-zone="brand"` y `g-surface--level-flat` en la raíz; 03 sin `description` igual a 01; ningún `requestAnimationFrame` ni temporizador al montar. Chromium: contraste de las cifras dentro de la zona con los dos temas del CLI (lo garantiza §44, se mide igual).
