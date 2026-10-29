# Contrato · Integrations (`GbIntegrations01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #957 a #961 y #971, 2026-10-29) · **Plan:** S10 (§4.5) · **Entrada:** `@grana/blocks/saas` · **Común:** `_comun.md` §1 a §5 y §41 a §54 · **Compone:** `GSection`, `GStack`, `GAdaptiveLayout` + `GCard` (01), `GCard` horizontal (02), `GAccordion` + `GAccordionItem` (03), `GBadge`, `GBtn`, `GText`, `GTag` (`@grana/vue/tag`, categoría) y la confirmación común (§43.2) · **Fase:** 4c·2 · **No compleja** (Sonnet; la confirmación es la pieza común de 4c·2)

## Promesa

Los servicios que se pueden conectar a la cuenta, **con lo que cada uno podrá hacer dicho antes de conectar**, su estado en texto (conectada como quién, con error, no disponible y por qué) y desconectar diciendo antes qué deja de pasar. La autorización (OAuth u otra) es de la aplicación; el bloque emite.

## Props

```ts
interface GbIntegrationsProps {
  title: string                          // «Integraciones»
  description?: string
  items: Integration[]
  categories?: { id: string; title: string; description?: string }[]   // agrupan (GSection anidada), en este orden
  busy?: string[]                        // ids conectando o desconectando (GBtn loading)
  locale?: string
  labels: {
    connect: string | ((name: string) => string)       // «Conectar {name}»
    disconnect: string | ((name: string) => string)    // «Desconectar {name}»
    configure: string | ((name: string) => string)     // «Ajustes de {name}»
    retry?: string | ((name: string) => string)        // «Volver a conectar {name}» (con error)
    connectedAs?: string | ((who: string) => string)   // «Conectada como {who}»
    permissions: string                  // «Podrá:» (antes de conectar) 
    permissionsConnected?: string        // «Puede:» (conectada)
    unavailable?: string                 // «No disponible»
    details?: string | ((name: string) => string)      // 03: nombre del despliegue si hace falta
    confirm: { disconnect: ConfirmLabels }
    keep: string
    consequence?: ConsequenceLabels
    busy?: string
    external?: string
  }
}
```

## Anatomía (común)

- **Una integración:** `logo` (imagen de la aplicación, §1 regla 9; decorativa, el nombre va escrito: Lucide no tiene marcas), nombre, `summary`, `category` como `GTag` estático (sin `categories`), estado **en texto** (`statusText` en una `GBadge`: `success` conectada, `danger` error, `neutral` disponible y no disponible) y `connectedAs` con `labels.connectedAs`.
- **Antes de conectar** (§43.2 forma 1): `permissions` como lista con `labels.permissions` («Podrá: leer tus pedidos; crear guías de envío»), **a la vista y enlazada con `aria-describedby` del botón** «Conectar {nombre}» (sólido, §3). → `connect`.
- **Conectada:** «Ajustes de {nombre}» (`configure`; con `configure.href`, enlace con `navigate`) y «Desconectar {nombre}» (`GBtn variant="link"`) → confirmación con `consequences.disconnect` («Dejarán de crearse guías de envío para los pedidos nuevos; las guías hechas se conservan») → `disconnect`. Sus permisos siguen a la vista con `labels.permissionsConnected`.
- **Con error** (`status: 'error'`): `attention` o `statusText` en texto (§43.3), «Volver a conectar» (`labels.retry`, sólido, `connect`) y «Desconectar».
- **No disponible:** sigue a la vista con su motivo (`unavailable` o `labels.unavailable`) y sin acción (§42 regla 1).
- **Ficha:** con `href`, el nombre es enlace a la ficha de la integración (`navigate`; con `external`, §3).
- **Grupos:** con `categories`, una `GSection` anidada por categoría (título, descripción) con sus integraciones; las de categoría desconocida, al final sin grupo (SA6). Sin `categories`, una sola lista y la categoría como `GTag`.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Galería** | Una tarjeta por servicio con su logo, estado y permisos | `GSection` › (por categoría) `GAdaptiveLayout role="list" gap="md"` › `div role="listitem" class="g-adapt-standard"` › `GCard` (`media` = logo, `title` = nombre con enlace en el slot `title` si hay `href`, `badge` = estado, `status`/`statusText` con error, `description` = `summary`; cuerpo: permisos y `connectedAs`; `actions`: las del estado) | — |
| **02 · Renglones** | Una línea por servicio, para listas largas | `GSection` › (por categoría) `GStack as="ul" gap="sm"` › `GCard as="li" level="flat" orientation="horizontal" mediaPosition="start"` (lo de 01, con los permisos en una línea) | — |
| **03 · Con permisos a la vista** | Cada servicio plegado y, al abrirlo, todo lo que hará y los botones | `GSection` › `GAccordion` (varios abiertos) › `GAccordionItem` por integración (`value` = `id`, `title` = nombre, nivel `useSectionLevel()` + 1; `meta` = estado en texto; `peek` = `summary`; panel: permisos, `connectedAs`, acciones) | `logo` (en un encabezado plegado no cabe sin CSS) |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `connect` | `{ event, integration }` | «Conectar» o «Volver a conectar» |
| `disconnect` | `{ event, integration }` | Tras confirmar |
| `configure` | `{ event, integration }` | «Ajustes» sin `configure.href` |
| `navigate` | §4 (`item` = la integración) | Ficha o ajustes con `href` |

## Slots

`integration` `{ integration }` (escape: el cuerpo de una), `description`.

## Estructura accesible

`GSection` con título (sin `h1`); categorías como secciones anidadas; integraciones en lista (rejilla `role="list"`, `ul` o la lista del acordeón); estado en texto; permisos como descripción del botón de conectar; «Conectar {nombre}», «Desconectar {nombre}»: nombres completos; el logo decorativo; desconectar es `alertdialog` con el foco en «Mantener». Conectar suele abrir otra página (la autorización): el botón no lleva `aria-pressed` ni es un interruptor (§52).

## Qué lo hace distinto (#971)

**Antes de conectar, lo que podrá hacer.** Cada servicio dice **qué permisos pide** junto al botón de conectar —no en la pantalla del otro sitio, cuando ya se ha decidido—; conectada, dice **como quién** («tienda@barroyagave.mx») y lo que puede; y desconectar dice qué deja de pasar y qué se conserva. Un servicio con error o no disponible sigue a la vista con su motivo y el camino para arreglarlo.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `connect`, `permissions` | Sí (C5) |
| `disconnect`, `confirm.disconnect`, `keep` | Sí, con una conectada (SA9: sin ellos no se ofrece desconectar) |
| `configure`, `permissionsConnected`, `connectedAs` | Sí, con una conectada y el dato (C5) |
| `retry` | Sí, con una con error (C5) |
| `unavailable` | Sí, con una no disponible sin motivo propio (C5) |
| `consequence` | Sí, con `consequences.disconnect` (C5) |
| `busy` | Sí, con `busy` (C5) |
| `external` | Sí, con un enlace externo (C5) |

## Avisos propios (`[Grana GbIntegrations<NN>]`)

C1, C3, C4 (logo), C5, C6, SA1 (desconectar sin consecuencia), SA5, SA6 (`category` sin categoría), SA7 (sin escucha de `connect`), SA8, SA9. Además: **IN1** · una disponible sin `permissions` (se ofrece conectar sin decir qué hará: avisa, como SA1), **IN2** · `status` fuera de la lista (cuenta como `available`).

## Banco (`integrations.bank.js`)

Nombres inventados (§49): «Paquetería del Sur» (conectada como `tienda@barroyagave.mx`, permisos, `consequences.disconnect`, `configure.href`), «Cobros Lince» (error, `attention` «La autorización caducó»), «Hoja de Cálculo Abierta» (disponible, permisos, `href` externo a su ficha), «Tienda Nopal» (no disponible: «Solo en el plan Cooperativa»); categorías «Envíos», «Cobros», «Datos»; logos con proporciones de `bank/fotos.js`; `labels` completos.

## Verificación propia

Vitest: permisos en `aria-describedby` de «Conectar»; `connect` al pulsar; desconectar solo tras confirmar con la consecuencia; con error, «Volver a conectar» y el motivo en texto; no disponible a la vista sin acción; categorías como `GSection` anidadas y la desconocida al final; IN1 sin permisos; `busy` → `loading`. Chromium: 01 rejilla y 02 renglones sin desbordar a 320; 03 plegado con movimiento reducido; Tab y foco visible; el foco vuelve al disparador al cerrar la confirmación.
