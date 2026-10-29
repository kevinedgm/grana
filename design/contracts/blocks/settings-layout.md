# Contrato · Settings layout (`GbSettingsLayout01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #983 a #987 y #990, 2026-10-29) · **Plan:** S3 (§4.5) · **Entrada:** `@grana/blocks/saas` · **Común:** `_comun.md` §1 a §5 y §41 a §54 · **Compone:** `GSplit` + `GCard interaction="link"` (01), `GTabs` (02), `GSection`, `GStack`, `GBtn`, `GBadge`, `GText` · **Fase:** 4c·1 · **Compleja: coco y bruno en Opus** (navegación con estado actual, paneles, `GTabs` con teclado compuesto)

## Promesa

La página de ajustes: **un índice de las secciones y el panel de la que se está viendo**, con **lo pendiente de cada sección dicho en el índice** («Facturación · Pago fallido») para que nada espere escondido en una pestaña. El contenido de cada panel es de la aplicación (otros bloques SaaS o sus formularios); el bloque distribuye, nombra y marca la actual.

## Props

```ts
interface GbSettingsLayoutProps {
  sections: SettingsSection[]            // 2 a 12 (C7 por encima de 12)
  current: string                        // v-model:current: SettingsSection.id visible
  locale?: string
  labels: {
    nav: string                          // nombre del índice («Secciones de ajustes»)
    tabs?: GranaLabels                   // a GTabs (02)
    external?: string
  }
}
```

**Sin `title`:** el título de la página («Ajustes») es de la aplicación (su `GPageHeader`, con el `h1`); el bloque nombra el índice con `labels.nav` y titula **el panel** con la sección actual. Así no hay dos encabezados «Ajustes» seguidos.

**Cada sección** (`SettingsSection`, §45): `id`, `title`, `description` (una línea en el índice y bajo el título del panel), `icon` (Lucide, decorativo), `href` (con ruta propia: el índice navega; sin ella, el panel cambia en la página), `group` (agrupa el índice: «Cuenta», «Espacio de trabajo»), `attention` (§43.3).

## Anatomía (común)

- **El índice** dice cada sección con su `attention` **en texto**: `badge` = `attention.text` con `badgeColor` según `tone` (§43.3), nunca solo un punto.
- **El panel** de la sección actual: `GSection` (`title` = `section.title`, `description`, nivel por anidación) › slot `section-{id}` `{ section }` (o `panel` `{ section }` si no hay uno por sección). El bloque **no** pinta otro contenido: lo de dentro (Profile, Team, Billing…) lo pone la aplicación.
- **Cambiar de sección** sin `href`: el índice es un enlace **a la propia página** (`href="#{idBase}-{id}"`, con `idBase` de `useId()`) y su `navigate` con la guarda de #505 hace `preventDefault()` y emite `update:current`; el foco **se queda en el enlace** pulsado (3.2.2: elegir en un índice no cambia de contexto) y el panel nuevo sigue al índice en el DOM. Con `href`, el enlace navega (la aplicación lo intercepta con `navigate` para su router) y emite `update:current`.
- **Grupos** (`group`): el índice se parte en `GSection` anidadas por grupo, con el nombre del grupo como título (nivel por anidación) y su lista dentro.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Índice al lado** | Maestro y detalle: el índice a un lado y el panel al otro; en estrecho, el índice encima | `GSplit as="div" ratio="1:2" collapse="sm" gap="lg"` › [`#start` › `nav aria-label={labels.nav}` › `GStack as="ul" gap="sm"` › `GCard as="li" level="flat" padding="sm" interaction="link"` por sección (`title`, `description` con `descriptionLines="1"`, `href`, **`current`** en la actual, `badge`/`badgeColor` con la atención, icono en `lead`)] + [`#end` › el panel] | `labels.tabs` |
| **02 · Pestañas** | Pocas secciones de un mismo tema, en pestañas | `GTabs` (`items` = secciones: `id`, `label` = `title`, `icon`, `badge` = `attention.text`; `v-model` = `current`; `label` = `labels.nav`; `labels` = `labels.tabs`; `overflow="more"`) › `panel-{id}` › el contenido del slot **sin** `GSection` propia (la pestaña ya nombra el panel: `GTabs` lo enlaza con `aria-labelledby`); la `description` va arriba como `GText size="body-sm" tone="muted"` | `href` (02 cambia de panel; si la aplicación enruta, lo hace en `update:current`), `group` |
| **03 · Una página con índice** | Todo en una página larga, con un índice de anclas arriba | `GStack gap="lg"` › `nav aria-label={labels.nav}` › `GStack as="ul" gap="sm"` de `GBtn variant="link"` con `href="#{idBase}-{id}"` + **todas** las secciones como `GSection id="{idBase}-{id}"` con su slot y, si tiene `attention`, la `GBadge` de texto al principio del cuerpo | `current` como estado visible (el índice no sigue al desplazamiento, SA-L6; activar un ancla emite `update:current`) |

**01 en estrecho:** con `collapse="sm"` el índice se queda al lado mientras su lado no baja de `space × 64` / 16 cuerpos (`split.md` regla 2) y si no, va **encima** del panel (orden del DOM). En el teléfono, la persona ve el índice y, debajo, la sección actual; no hay «volver al índice» porque nunca se va.

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `update:current` | `string` | Se elige otra sección (índice, pestaña o ancla) |
| `navigate` | `{ event, href, item }` (`item` = la sección) | Un enlace del índice con `href` propio (guarda de #505) |

## Slots

`section-{id}` `{ section }` (el contenido de cada sección; **obligatorio** para la actual), `panel` `{ section }` (alternativa genérica cuando la aplicación pinta todas igual), `item` `{ section, current }` (escape: el contenido de una entrada del índice en 01).

## Estructura accesible

Sin `h1` (el de la aplicación). El índice es un `nav` con nombre (`labels.nav`) y una lista; la sección actual se dice con `aria-current` (01: `true` por `GCard`, SA-L4; 03: sin marca de actual); en 02, el patrón *Tabs* de `GTabs` (flechas, Inicio/Fin). El panel es un `GSection` con el título de la sección, al nivel que le toca. La atención de cada sección es texto en el índice y al principio del panel, nunca solo color (1.4.1).

## Qué lo hace distinto (#990)

**Lo pendiente se ve en el índice, no al abrir la sección.** Un pago fallido, una invitación caducada o una integración con error se dicen **junto al nombre de su sección** en el índice («Facturación · Pago fallido»), en texto y con el tono del tema, así que quien entra a cambiar su foto ve también que el cobro falló, sin abrir pestaña por pestaña. Y elegir en el índice no saca a nadie de su sitio: el foco se queda donde pulsó y el panel cambia al lado.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `nav` | Sí (C5; sin él, el `nav` va sin nombre) |
| `tabs` | Los de `GTabs` (avisa él) |
| `external` | Sí, con una sección de `href` externo (C5) |

## Avisos propios (`[Grana GbSettingsLayout<NN>]`)

C1, C3, C5, C6, C7, SA5, SA6 (`current` que no es ninguna sección: se usa la primera), SA8. Además: **SL1** · falta el slot de la sección actual (`section-{id}` ni `panel`): se pinta el título y la descripción sin contenido, **SL2** · secciones con `group` mezcladas con secciones sin él (las que no tienen van al final, sin grupo).

## Banco (`settings-layout.bank.js`)

Milpa: grupos «Tu cuenta» (Perfil, Avisos) y «Espacio de trabajo» (Equipo con `attention` `warning` «1 invitación caducada», Facturación con `attention` `error` «Pago fallido», Integraciones, Claves de la API, Registro de actividad); una con `href` externo (Centro de ayuda); `current` «perfil»; contenido de cada panel con un `GText` de muestra; `labels` completos.

## Verificación propia

Vitest: 01 con `GCard` enlace por sección, `current` solo en la actual, la atención en `badge` con su color; clic primario sin `href` → `update:current`, sin navegar y con el foco en el enlace; con modificadores, no; 02 con `GTabs` y la atención en `badge`; 03 con todas las secciones y anclas a sus `id`; el panel con el título de la sección al nivel de `useSectionLevel()`; SL1 sin slot; grupos como `GSection` anidadas. Chromium: 01 al lado a 1440 y apilado a 390 con el índice primero; Tab y flechas en 02; sin desbordar a 320; el foco no salta al cambiar de sección.
