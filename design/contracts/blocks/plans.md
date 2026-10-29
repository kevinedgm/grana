# Contrato · Plans & upgrade (`GbPlans01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #957 a #961 y #966, 2026-10-29) · **Plan:** S5 (§4.5) · **Entrada:** `@grana/blocks/saas` · **Tipo `Plan`:** `types/common.d.ts` (lo reutilizará Marketing M6, §51) · **Común:** `_comun.md` §1 a §5 y §41 a §54 · **Compone:** `GSection`, `GPriceScope` + `GPrice`, `GRadioGroup` (`segmented` para el periodo, `card` en 02), `GAdaptiveLayout`, `GCard`, `GTable` (02), `GBadge`, `GBtn`, `GIcon`, `GText`, `GProgress` (03, decorativa, SA-L1) y la confirmación común (§43.2) · **Fase:** 4c·3 · **Compleja: coco y bruno en Opus** (precios por periodo, consecuencias, confirmación)

## Promesa

Cambiar de plan **dentro de la aplicación** sabiendo antes qué cambia: cuánto se paga desde cuándo, qué se gana y, al bajar, qué se pierde. El plan actual está marcado; el periodo (mes o año) se elige en el sitio; la consecuencia del cambio va **junto al botón**. El bloque no calcula prorrateos: los da la aplicación en `Plan.change`.

## Props

```ts
interface GbPlansProps {
  title: string                          // «Cambia de plan»
  description?: string
  plans: Plan[]                          // 2 a 4 (C7 por encima de 4)
  current?: string                       // Plan.id del plan actual (sin él: nadie tiene plan, p. ej. al acabar la prueba)
  period: BillingPeriod                  // v-model:period
  periods?: BillingPeriod[]              // los que se ofrecen; por defecto, los que tienen precio en algún plan
  prices: PriceRegion                    // obligatoria (EC1)
  usage?: UsageItem[]                    // 03: lo que empuja a cambiar (los que están cerca del límite)
  suggested?: string                     // 03: Plan.id propuesto
  locale?: string
  labels: {
    current: string                      // «Tu plan»
    choose: string | ((plan: string) => string)          // «Cambiar a {plan}»
    switchPeriod?: string | ((period: string) => string) // «Pasar a pago {period}» (mismo plan, otro periodo)
    period: string                       // nombre del grupo del periodo («Forma de pago»)
    periods: Partial<Record<BillingPeriod, string>>      // «Mensual», «Anual»
    included: string; notIncluded: string                // texto de cada celda o punto («Incluido», «No incluido»)
    features?: string                    // caption de la tabla (02) y nombre de la lista de cada plan («Qué incluye»)
    choosePlan?: string                  // 02: nombre del grupo de elección («Elige tu plan»)
    unavailable?: string
    confirm: { downgrade: ConfirmLabels }   // §43.2
    keep: string                         // «Mantener mi plan»
    consequence?: ConsequenceLabels
    near?: string                        // 03: «Cerca del límite»
    price?: PriceLabels & { legend?: string }
    table?: GranaLabels
    external?: string
  }
}
```

## Anatomía (común)

- **Una `GPriceScope`** con `prices` envuelve la sección (la moneda y los impuestos se dicen una vez, #772); cada precio es `GPrice` con `plan.prices[period]` tal cual (`unit` «/ mes», `unitLabel` «al mes»). Un plan sin precio del periodo elegido dice `labels.unavailable` en su sitio (§42 regla 1: no se esconde).
- **El periodo:** `GRadioGroup appearance="segmented"` **sin `name`** (#934) con `labels.period` y una opción por periodo; `v-model` = `period` (`update:period`). `plan.note[period]` («2 meses gratis») va bajo el precio como `GText size="caption"`. Con un solo periodo, no se pinta el grupo.
- **El plan actual:** `badge` / texto `labels.current` y **sin botón de cambiar a sí mismo**; si el periodo elegido no es el suyo, el botón es `labels.switchPeriod` (`direction: 'period'`).
- **La acción de otro plan:** `GBtn` (`labels.choose(plan.name)`; con la jerarquía de §3: **una** sólida, la del `suggested` o, sin él, la del primer plan superior al actual, y en contorno las demás) con la **consecuencia** `plan.change[period]` **justo antes**, a la vista (§43.1: «Desde el 1 de diciembre pagarás $899 al mes; hoy se cobran $412 por los días que quedan»), enlazada con `aria-describedby`. Con `plan.contact`, en su lugar la `Action` («Hablar con ventas»: `navigate`/`activate`), sin precio de cambio.
- **Subir** (`direction: 'up'`) emite `upgrade` al pulsar: la consecuencia ya estaba delante y el cobro lo confirma la pasarela de la aplicación. **Bajar** (`direction: 'down'`) abre la confirmación de §43.2 (`labels.confirm.downgrade`, «¿Pasar a Semilla?», con `change[period]`: lo que se pierde) y emite al confirmar. Qué es subir o bajar lo dice el **orden de `plans`** (de menor a mayor: el contrato lo exige y el banco lo cumple; un plan antes del actual es bajar).
- **Funciones** (`features`): por plan, la lista `ul` con cada función **en texto**: `included: true` → `GIcon check` decorativo + `labels.included` oculto tras el nombre; `false` → `GIcon minus` + `labels.notIncluded` **visible** (nunca solo un guion); String («Hasta 5») → ese texto.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Tarjetas** | Un plan por tarjeta, el actual marcado, el periodo arriba | `GSection` › `GPriceScope` › `GStack gap="lg"` › periodo + `GAdaptiveLayout role="list" gap="md"` › `div role="listitem" class="g-adapt-standard"` › `GCard` por plan (`title` = nombre, `badge` = `labels.current` o `plan.badge`, `description` = `summary`; cuerpo: `GPrice size="lg"`, nota, límites como `GText`, funciones; `footer`: consecuencia + acción) | `usage`, `suggested` como contenido (solo decide la sólida) |
| **02 · Comparar y elegir** | La tabla para comparar y, debajo, la elección con su consecuencia | `GSection` › `GPriceScope` › `GStack gap="lg"` › periodo + `GTable` (`caption` = `labels.features`; filas = funciones agrupadas por `group` y la primera fila «Precio»; columnas = la función y un plan por columna; celda con `cell-{planId}`: `GPrice size="sm"` o la marca + texto) + `GRadioGroup appearance="card"` **sin `name`** (`labels.choosePlan`; una opción por plan con nombre, precio y `labels.current` en el actual) + la consecuencia del elegido + **un** `GBtn` | `usage`, `suggested` |
| **03 · Propuesta al límite** | Cuando algo se acerca al límite: lo que pasa, el plan que lo resuelve y su costo | `GCard status="warning"` (`statusText` = `labels.near`; título = `title`, nivel `min(level, 6)`, #927) › los `usage` cerca del límite (`GText` con `valueText`, barra `GProgress` **decorativa** en un envoltorio `aria-hidden`, SA-L1, y su `atLimit`) + el plan `suggested` (nombre, `GPrice`, las funciones que **gana** frente al actual) + consecuencia + `GBtn` sólido. Sin `suggested`, el primer plan superior al actual. Sin consumo cerca del límite ni `suggested`, el bloque **no se pinta** (sin aviso: es el estado normal) | los planes que no son el propuesto, el periodo como grupo (usa `period`) |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `upgrade` | `{ event, plan, period, direction: 'up' \| 'down' \| 'period' }` | `up` y `period` al pulsar; `down` tras confirmar |
| `update:period` | `BillingPeriod` | Se elige otro periodo |
| `navigate` · `activate` | §4 (`item` = el plan) | `plan.contact` |

## Slots

`plan` `{ plan, current, period }` (escape: el cuerpo de una tarjeta en 01), `cell-{planId}` (02, pasa a `GTable`), `description`.

## Estructura accesible

`GSection` con título (sin `h1`); la región de precios con su leyenda; el periodo es un grupo de radios con nombre; cada plan en 01 es un elemento de lista con su encabezado; la tabla de 02 con `caption`, encabezados de columna (los planes) y de fila (las funciones); «incluido / no incluido» **en texto** (1.4.1); la consecuencia es descripción del botón; la confirmación de bajar es `alertdialog` con el foco inicial en «Mantener».

## Qué lo hace distinto (#966)

**El precio del cambio, dicho antes y con fecha.** Ninguna tarjeta dice solo «$899/mes»: el botón de cada plan lleva delante **lo que cambia para ti** —«Desde el 1 de diciembre pagarás $899 al mes; hoy se cobran $412 por los días que quedan»— y bajar de plan **pregunta antes de quitar** diciendo qué se pierde («Tus 3 tableros privados pasan a solo lectura»). En 03 el plan aparece **cuando hace falta y por qué**: el consumo que se acerca al límite, lo que pasará al llegar y lo que cuesta evitarlo, sin cuentas atrás ni rojo que asuste.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `current`, `choose`, `period`, `periods.*` (los ofrecidos), `included`, `notIncluded` | Sí (C5) |
| `switchPeriod` | Sí, si el periodo elegido no es el del plan actual (C5) |
| `features` | Sí en 02 y con funciones (C5) |
| `choosePlan` | Sí en 02 (C5) |
| `unavailable` | Sí, con un plan sin precio del periodo o `available: false` (C5) |
| `confirm.downgrade`, `keep` | Sí, con un plan inferior al actual (SA9: sin ellos no se ofrece bajar) |
| `consequence` | Sí, con alguna `change` (C5) |
| `near` | Sí en 03 (C5) |
| `price`, `table` | Los de cada componente |
| `external` | Sí, con un `contact` externo (C5) |

## Avisos propios (`[Grana GbPlans<NN>]`)

C1, C2, C5, C7, EC1, K3, SA1 (un plan distinto del actual sin `change[period]`), SA5, SA6 (`current` o `suggested` que no están), SA7 (sin escucha de `upgrade`), SA9. Además: **PL1** · `period` que no está en `periods` (se usa el primero), **PL2** · `features` de los planes con etiquetas distintas en 02 (la tabla usa la unión; una celda sin dato dice `labels.notIncluded`).

## Banco (`plans.bank.js`)

Los cuatro planes de `bank/saas.js` (Semilla, **Taller** actual, Cooperativa, Empresa con `contact`), precios mensual y anual en MXN con `unit`/`unitLabel`, `note` anual «2 meses gratis», funciones agrupadas («Inventario», «Equipo», «Ayuda»), límites, `change` por periodo (subir con prorrateo y bajar con `loses`), `usage` con productos al 92 % y `suggested` «cooperativa»; `labels` completos.

## Verificación propia

Vitest: una `GPriceScope`; el periodo sin `name` y `update:period`; el actual sin botón de cambiar a sí mismo y con `switchPeriod` al cambiar de periodo; subir emite `upgrade` `up` al pulsar con la consecuencia en `aria-describedby`; bajar abre el `alertdialog` y solo emite al confirmar; «incluido / no incluido» en texto; 02 tabla con `caption` y la elección con un solo botón; 03 solo con consumo cerca del límite o `suggested`, barra `aria-hidden`; SA1 sin `change`. Chromium: 01 rejilla sin desbordar a 320 y a 1440; 02 la tabla pasa a tarjetas en estrecho (`responsive="auto"` de `GTable`) sin perder «no incluido»; Tab y foco visible; el foco vuelve al botón al cerrar la confirmación.
