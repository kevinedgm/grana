# Contrato · Onboarding (`GbOnboarding01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #957 a #961 y #963, 2026-10-29) · **Plan:** S2 (§4.5) · **Entrada:** `@grana/blocks/saas` · **Común:** `_comun.md` §1 a §5 y §41 a §54 · **Compone:** `GSection`, `GStack`, `GAccordion` + `GAccordionItem` (01), `GProgress` (02), `GCard`, `GAdaptiveLayout` (03), `GBtn`, `GBadge`, `GText` · **Fase:** 4c·1 · **No compleja** (Sonnet)

## Promesa

Los primeros pasos para dejar la cuenta lista, **en cualquier orden**, cada uno con cuánto lleva, por qué importa y qué lleva a hacerlo; **lo hecho se queda hecho** y saltar un paso dice antes qué se pierde. El estado de cada paso lo da la aplicación; el bloque lo dice y emite intenciones.

## Props

```ts
interface GbOnboardingProps {
  title: string                          // «Deja tu taller listo»
  description?: string
  steps: OnboardingStep[]                // 2 a 7 (C7 por encima de 7)
  current?: string                       // v-model:current (01: el paso abierto); por defecto, el primero `todo`
  dismissible?: boolean                  // ofrece ocultar la guía («skip» con step: null)
  locale?: string
  labels: {
    progress: string | ((done: number, total: number) => string)   // «2 de 5 pasos hechos»
    status: { todo: string; done: string; skipped: string }       // «Por hacer», «Hecho», «Saltado»
    optional?: string                    // «Opcional»
    markDone?: string | ((title: string) => string)               // «Ya lo hice»
    skip?: string | ((title: string) => string)                   // «Saltar este paso»
    skipAll?: string                     // «Ocultar la guía»
    estimate?: string | ((estimate: string) => string)            // «Lleva {estimate}»
    why?: string                         // «Por qué»
    consequence?: ConsequenceLabels
    external?: string
  }
}
```

## Anatomía (común a las tres)

- **El avance** en texto: `labels.progress(done, total)` (cuentan `done`; los `skipped` se dicen aparte en su paso, no suman ni restan). En 02 además `GProgress` (`value` = hechos, `max` = total, `valueText` = el mismo texto): **aquí sí es el avance de una tarea**, así que `progressbar` es correcto (a diferencia de SA-L1).
- **Cada paso:** título; estado en texto (`labels.status[step.status]`) en una `GBadge` de texto (`color` `neutral` por hacer y saltado, `success` hecho; el texto es lo que distingue, nunca el color solo); `estimate` y `optional` en la misma línea (`GText size="caption" tone="muted"`); `description` y `why` (`GText`, con `labels.why`); las acciones.
- **Acciones de un paso `todo`:** `step.action` como principal (`GBtn` sólido, §3: `href` → `navigate`, sin `href` → `activate`); con `manual`, «Ya lo hice» (`GBtn variant="outline"`, `complete`); con `optional`, «Saltar» (`GBtn variant="link"`) con **su consecuencia antes** (`step.skip`, §43.1, como `aria-describedby` del botón de saltar). Un paso `done` no lleva acciones (la acción de rehacer, si existe, es otra `Action` de la aplicación); un paso `skipped` conserva su acción principal (se puede hacer después) y dice «Saltado».
- **Ocultar la guía** (`dismissible`): `GBtn variant="link"` `labels.skipAll` al final, que emite `skip` con `step: null`. Sin consecuencia propia: la guía oculta no pierde nada (la aplicación decide si vuelve a enseñarla).

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Uno abierto** | La guía como lista plegada; el paso que toca, abierto | `GSection` › `GText` (avance) + `GAccordion exclusive` (un solo abierto; `v-model` = `current`) › `GAccordionItem` por paso (`value` = `id`, `title`, `meta` = el estado en texto, `peek` = `estimate` y la primera línea de `description`, panel = descripción, `why`, consecuencia y acciones; título al nivel de `useSectionLevel()` + 1, #817) | `media` |
| **02 · Lista con progreso** | La barra y la lista entera a la vista | `GSection` › `GProgress` + `GStack as="ol" gap="sm"` › `GCard as="li" level="flat" orientation="horizontal"` por paso (`title`, `description`, el estado en `badge` + `badgeColor`; las acciones en el slot `actions`). No usa `status`/`statusText` de `GCard`: son de un estado que pide atención, y un paso por hacer no lo es | `media`, `current` |
| **03 · Tarjetas de bienvenida** | Pocas tarjetas grandes para la primera vez, cada una con su foto | `GSection` › `GText` (avance) + `GAdaptiveLayout role="list" gap="md"` › `div role="listitem" class="g-adapt-standard"` › `GCard` (`media` con `step.media`, `title`, `badge` = estado, `description`, acciones) | `current` |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `complete` | `{ event, step }` | «Ya lo hice» de un paso `manual` |
| `skip` | `{ event, step }` · `{ event, step: null }` | Saltar un paso `optional` · ocultar la guía |
| `update:current` | `string` | 01: se abre otro paso |
| `navigate` · `activate` | §4 (`item` = el paso) | La acción del paso |

**Lo hecho se queda hecho:** el bloque no cambia `status` por su cuenta; tras `complete` o `skip` la aplicación actualiza el dato. En 01, cuando el paso abierto pasa a `done`, el bloque **no** abre el siguiente solo (nada se mueve solo); el foco se queda en el encabezado del paso (el botón del `GAccordionItem`, que es su control público) y el avance en texto ya dice el cambio.

## Slots

`step-{id}` `{ step }` (escape: el cuerpo de un paso, p. ej. un formulario corto en el sitio), `description`.

## Estructura accesible

`GSection` con título (sin `h1`); los pasos en lista ordenada (`ol` en 02; la lista del acordeón en 01; rejilla `role="list"` en 03); estado de cada paso **en texto** (nunca solo el color de `GBadge`); la consecuencia de saltar es descripción del botón de saltar; el avance es texto (y en 02, `progressbar` con `valueText`).

## Qué lo hace distinto (#963)

**Una guía que respeta tu orden y tu tiempo.** No obliga a ir del 1 al 5 (por eso no es un `GStepper`, §52): cada paso dice cuánto lleva («2 min») y por qué importa antes de pedirlo, lo hecho queda hecho aunque cierres la sesión (lo guarda la aplicación), y **saltar dice antes qué te pierdes** («Sin tu dirección de envío, las etiquetas de paquetería salen en blanco»), junto al botón: saltar no castiga ni se esconde, pero tampoco sorprende.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `progress`, `status.*` | Sí (C5) |
| `optional`, `skip` | Sí, con un paso `optional` (C5; sin `skip` no se ofrece saltar) |
| `markDone` | Sí, con un paso `manual` (C5; sin él no se ofrece) |
| `skipAll` | Sí, con `dismissible` (C5) |
| `estimate`, `why` | Sí, con `estimate` / `why` en algún paso (C5) |
| `consequence` | Sí, con `skip` en algún paso (C5) |
| `external` | Sí, con una acción externa (C5) |

## Avisos propios (`[Grana GbOnboarding<NN>]`)

C1, C2, C3, C5, C7, SA1 (paso `optional` sin `skip`: se ofrece saltar sin consecuencia), SA5, SA6 (`current` que no es ningún paso). Además: **ON1** · `status` fuera de `todo`/`done`/`skipped` (cuenta como `todo`), **ON2** · `skip` en un paso que no es `optional` (se ignora: no se ofrece saltar un paso obligatorio), **ON3** · `media` sin `width`/`height` (C4).

## Banco (`onboarding.bank.js`)

Milpa · Barro y Agave: «Agrega tus productos» (`done`), «Invita a tu equipo» (`todo`, `action` con `href`), «Conecta tu paquetería» (`todo`, `optional`, `skip` con consecuencia, `estimate` «3 min»), «Configura tus impuestos» (`skipped`, `why`), «Imprime tu primera etiqueta» (`todo`, `manual`), con fotos de `bank/fotos.js` para 03; `dismissible`; `labels` completos; un paso en inglés no (los pasos son de la aplicación: el texto largo sin espacios en una descripción).

## Verificación propia

Vitest: el avance cuenta solo `done`; cada estado en texto; un paso `done` sin acciones; `optional` con «Saltar» y la consecuencia en `aria-describedby`; `manual` con «Ya lo hice» → `complete`; `skip` con `step: null` al ocultar; 01 abre el primer `todo` sin `current` y emite `update:current`; 02 con `GProgress` `value`/`max`/`valueText`; 03 rejilla `role="list"`; el bloque no cambia `status` por su cuenta. Chromium: 320 px sin desbordar; Tab con foco visible; movimiento reducido en el acordeón.
