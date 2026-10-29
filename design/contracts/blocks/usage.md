# Contrato · Usage & limits (`GbUsage01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #983 a #987 y #994, 2026-10-29) · **Plan:** S7 (§4.5) · **Entrada:** `@grana/blocks/saas` · **Común:** `_comun.md` §1 a §5 y §41 a §54 · **Compone:** `GSection`, `GStack`, `GProgress` (decorativa, SA-L1), `GAdaptiveLayout`, `GMetric`, `GCard`, `GBtn`, `GText` · **Fase:** 4c·2 · **No compleja** (Sonnet)

## Promesa

Cuánto se ha usado de cada recurso del plan, **cuándo vuelve a cero y qué pasa al llegar al límite**, dicho antes de llegar. Las cifras las da la aplicación ya escritas; el bloque las ordena, marca lo que se acerca al límite en texto y ofrece ampliar.

## Props

```ts
interface GbUsageProps {
  title: string                          // «Consumo de este mes»
  description?: string
  items: UsageItem[]                     // 1 a 8 (C7 por encima de 8)
  period?: { from: string; to: string }  // ISO: el periodo de medida
  plan?: string                          // «Plan Taller» (texto de contexto)
  upgrade?: Pick<Action, 'label' | 'icon' | 'href'>   // «Ampliar plan»
  locale?: string
  labels: {
    period?: string | ((from: string, to: string) => string)   // «Del {from} al {to}»
    resets?: string | ((date: string) => string)               // «Vuelve a cero el {date}»
    unlimited: string                    // «Sin límite»
    near: string                         // «Cerca del límite»
    over: string                         // «Límite alcanzado»
    atLimit?: string                     // título de la consecuencia («Al llegar al límite»)
    consequence?: ConsequenceLabels
    external?: string
  }
}
```

## Anatomía (común)

- **Estado de cada recurso** (de vista, no de negocio): con `limit` numérico, `ratio = used / limit`; **cerca** si `ratio ≥ warnAt` (0,8 por defecto) y **alcanzado** si `ratio ≥ 1`. Sin `limit` (`null`): `labels.unlimited` y nunca cerca. El estado se dice **en texto** (`labels.near` / `labels.over`) y con el tono (`warning` / `danger`), nunca solo con el color de la barra.
- **La cifra** es `valueText` tal cual («1 840 de 2 000 productos»); el bloque no formatea `used` ni `limit` (§42 regla 6).
- **La barra** (01, 03): `GProgress` (`value` = `used`, `max` = `limit`, `color` = `warning`/`danger` según el estado) dentro de un envoltorio **`aria-hidden="true"`**: es una medida, no una tarea (SA-L1; con `role="meter"` contratado, dejará de ser decorativa sin cambiar la `interface`). El texto al lado lo dice todo.
- **Al llegar al límite** (`atLimit`, §43.2 forma 1): la consecuencia a la vista en los recursos cerca o alcanzados («Al llegar a 2 000 productos no podrás dar de alta nuevos; los que tienes siguen a la venta»), con `labels.atLimit`.
- **Vuelve a cero** (`resets`): `<time>` con `labels.resets`. El periodo de arriba, con `labels.period`.
- **Ampliar** (`upgrade`): `GBtn` (sólido en 03, contorno en 01 y 02, §3) → `upgrade { event, item: null }` o `navigate` con `href`.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Barras** | Una fila por recurso con su barra, su cifra y lo que pasa al límite | `GSection` (descripción = periodo y plan) › `GStack as="ul" gap="md"` › `li` › `GStack gap="sm"` › `GText` (nombre en `body`, cifra y estado en `body-sm`) + barra decorativa + `resets` y `atLimit` (`GText size="caption"`) · al final, `upgrade` | `trend` |
| **02 · Cifras** | Una cifra por recurso con su tendencia, para un vistazo | `GSection` › `GAdaptiveLayout role="list" gap="md"` › `div role="listitem" class="g-adapt-short"` › `GMetric` (`label` = nombre, `value` = `valueText`, `trend`/`direction` de `trend`, `context` = estado o `labels.unlimited`) · al final, `upgrade` | la barra, `atLimit` (el estado sí, en `context`) |
| **03 · Lo que se acerca** | Solo lo que está cerca o en el límite, con lo que pasará y cómo evitarlo | `GCard status="warning"` (o `error` si alguno está alcanzado; `statusText` = `labels.near`/`labels.over`; título = `title`, nivel `min(level, 6)`, #927) › los recursos cerca o alcanzados como en 01 + `upgrade` sólido. **Sin ninguno cerca, el bloque no se pinta** (sin aviso: es el estado normal) | los recursos lejos del límite, `trend` |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `upgrade` | `{ event, item: null }` | «Ampliar plan» sin `href` |
| `navigate` | `{ event, href, item }` | «Ampliar plan» con `href` |

## Slots

`item` `{ item, state }` (escape: el cuerpo de un recurso en 01 y 03), `description`.

## Estructura accesible

`GSection` (01, 02) o `GCard` (03) con título; los recursos en lista; cada uno con nombre, cifra, estado y consecuencia **en texto**; la barra fuera del árbol de accesibilidad (`aria-hidden`, SA-L1); fechas en `<time>`; sin región viva (el consumo no habla al cambiar).

## Qué lo hace distinto (#994)

**El límite se dice antes de llegar, con lo que pasará.** En lugar de una barra que se pone roja cuando ya es tarde, cada recurso cerca del límite dice **qué dejará de funcionar** («no podrás dar de alta productos nuevos; los que tienes siguen a la venta») y **cuándo vuelve a cero**, y 03 aparece solo cuando hace falta, con el camino para evitarlo al lado. Sin alarmas ni porcentajes que asustan: frases.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `unlimited`, `near`, `over` | Sí (C5 al necesitarlos) |
| `period` | Sí, con `period` (C5) |
| `resets` | Sí, con `resets` en algún recurso (C5) |
| `atLimit`, `consequence` | Sí, con `atLimit` en algún recurso cerca (C5) |
| `external` | Sí, con `upgrade.href` externo (C5) |

## Avisos propios (`[Grana GbUsage<NN>]`)

C1, C2, C3, C5, C7, SA5. Además: **US1** · `used` o `limit` negativos o no numéricos (no se calcula el estado: se pinta `valueText` sin barra ni estado), **US2** · `warnAt` fuera de 0..1 (se usa 0,8), **US3** · sin `valueText` (C2: el recurso se omite: el bloque no escribe cifras).

## Banco (`usage.bank.js`)

Taller: productos 1 840 de 2 000 (cerca, `atLimit` con consecuencia, `trend` «+120 este mes» `up`), almacenamiento 8,2 de 10 GB (cerca), miembros 4 de 10, pedidos del mes 312 sin límite (`limit: null`), envíos con etiqueta 500 de 500 (alcanzado); `period` del 1 al 30 de noviembre; `resets` 1 de diciembre; `upgrade` «Ampliar plan» con `href`; `labels` completos.

## Verificación propia

Vitest: estado cerca/alcanzado/sin límite por `ratio` y `warnAt`, siempre en texto; la barra con `aria-hidden` en un envoltorio y sin `progressbar` en el árbol; `valueText` tal cual; `atLimit` solo en los cerca o alcanzados; 02 con `GMetric` y su tendencia; 03 solo con recursos cerca y no se pinta sin ninguno; `upgrade` con y sin `href`. Chromium: 320 px sin desbordar; Tab con foco visible; oscuro con los tonos del tema.
