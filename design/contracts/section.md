# Contrato · GSection (sección de página)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #720, #717 y #723, 2026-10-21; `tokens.md` §23.1 y §49) · **Basado en:** `design/lab/app-shell/r01/` (kiwi, commit 0c202e3; `declaracion.md` Parte 3, hallazgo L14; prototipo `.sec` en `shell.css`; medido en `verificar.mjs`)
**Tag:** `g-section` · **Categoría:** estructura de página · **Paquete:** `@grana/vue` (principal, con compuerta de peso conjunta con `GStack`; #723)

**Sin forma visible propia** (sin superficie): no aplica «conceptos antes que caja» (#362); sí «Qué lo hace distinto». **No es complejo:** coco y bruno en Sonnet.

## Promesa

Una región de página con **encabezado** (`h2`…`h4`), descripción y acciones, cuyo **nivel lo pone el documento** y cuyo tamaño lo pone la anidación. Sin superficie, sin plegado, sin pegado.

## ¿Componente o receta? Componente (#720)

1. **El nivel del encabezado sale del documento.** Con `provide`/`inject`, la primera sección es `h2` (bajo el `h1` de `GPageHeader`), una anidada `h3`, otra `h4` (tope). Una receta (`GStack` + `hN`) obliga a cada pantalla a contar niveles, que es justo donde se saltan (WCAG 1.3.1, técnica H42). Medido por kiwi: `h2 › h3 › h4` por anidación.
2. **El rol tipográfico del título lo decide el contenedor** (`tokens.md` §23.4): el componente lo fija; una receta deja que cada aplicación elija un tamaño.
3. **El nombre accesible y el landmark** (`aria-labelledby` con un id propio) solo cuando se pide.
4. Coste mínimo: un render, sin estado ni medidas.

## Qué lo hace distinto (#720)

**El encabezado sabe dónde está:** el nivel lo pone el documento (una sección dentro de otra baja un nivel sola, nunca se salta uno) y el tamaño lo pone la anidación (cada nivel un rol menos, con suelo en 14 px), de modo que **el esquema que oye el lector de pantalla y la jerarquía que ve el ojo no pueden desalinearse**. La región con nombre es opcional, así una página con seis secciones no llena de puntos de referencia la lista del lector.

## Cuándo usarlo (fronteras)

| Necesito | Uso | No |
| --- | --- | --- |
| Una parte de una página con título y, quizá, acciones | **`GSection`** | `GCard` (un **objeto** con superficie y su título) |
| Una sección de formulario (registro de campos, `collapsible`, `addable`, errores) | `GFormSection` | `GSection` dentro de `GForm` para agrupar campos |
| Una superficie sin título | `GSurface as="section"` | — |
| El encabezado de la página (`h1`, zócalo) | `GPageHeader` | `GSection headingLevel="1"` (no existe) |
| Secciones que se pliegan | `GAccordion` | — |

## Uso

```vue
<GSection title="Firmantes" description="Quién valida el informe." :labels="{ actions: 'Acciones de firmantes' }">
  <template #actions><GBtn variant="outline" color="neutral">Añadir</GBtn></template>
  <GTable … />
  <GSection title="Suplentes">…</GSection>   <!-- h3 sola -->
</GSection>
```

## Anatomía

```
section.g-section.g-section--depth-{1|2|3} [aria-labelledby="{id}-title" solo con landmark]
├─ div.g-section__head                               ← flex-wrap: las acciones bajan bajo el título sin punto de corte
│  ├─ div.g-section__titles
│  │  ├─ h{2|3|4}.g-section__title#{id}-title dir="auto"   [title | slot title]
│  │  └─ p.g-section__desc                           [description | slot description]
│  └─ div.g-section__actions role="group" aria-label="{labels.actions}"   [slot actions]
└─ div.g-section__body                               ← la pila vertical (regla de GStack, gap md); [slot default]
```

- Orden del DOM = lectura = Tab: título → descripción → acciones → cuerpo.
- Sin `description`: no se pinta el `p`. Sin slot `actions`: no se pinta el grupo.
- El cuerpo **usa la regla de `GStack`** (mismo CSS de pila vertical `md`, márgenes de bloque de los hijos a 0, exclusión de `.g-tooltip`), no un `GStack` anidado.

## Props

| Prop | Tipo | Valores | Default | Origen / nota |
| --- | --- | --- | --- | --- |
| `title` | String | texto | — (**obligatoria** salvo con slot `title`) | Sin ninguno de los dos, aviso 1 |
| `description` | String | texto | sin valor | Párrafo bajo el título |
| `headingLevel` | Number | `2` `3` `4` | **automático** | Nombre compartido (`GCard`, `GPageHeader`). Automático: 2 en la primera, +1 por cada `GSection` antepasada, tope 4. Fijado, **gana** y las de dentro cuentan desde él (+1, tope 4). Fuera de lista: aviso 3 y automático |
| `landmark` | Boolean | | `false` | Con `true`, `aria-labelledby` al título: la `section` pasa a ser `region` con nombre (APG *Landmark Regions*: usar con moderación) |
| `labels` | Object | `{ actions }` | `{}` (**sin valores por defecto**, #226) | `actions`: nombre del grupo. Obligatorio si hay slot `actions` (aviso 2) |
| `id` | String | | generado (SSR-seguro) | Base de ids: `{id}-title` |

**No existen** (y por qué): `level` (es `headingLevel`); `collapsible` (`GAccordion`); `sticky` (fuera de esta ronda); `surface`, `padding` (`GCard`, `GSurface`); `gap` (el cuerpo es la pila `md`; una pila con otro ritmo va dentro como hijo); `size` del título (lo pone la anidación).

## Nivel y tamaño (#720)

| Profundidad (secciones antepasadas + 1) | Nivel automático | Rol del título (`tokens.md` §23.1) |
| --- | --- | --- |
| 1 | `h2` | **title-sm 20/28, 600** (como `GDialog`: entre el `h1` de `GPageHeader` y las tarjetas), `--g-font-title` |
| 2 | `h3` | **body 16/24, 600** (como `GFormSection` y `GCard`) |
| 3 y más | `h4` | **body-sm 14/20, 600** (suelo de §23.5(b): nunca menos de 14) |

- **El tamaño va por profundidad, no por nivel:** `headingLevel` fijado cambia la etiqueta y **no** el tamaño (#196). La clase `g-section--depth-{1|2|3}` la pone el `.vue` (tope 3) con la profundidad de `GSection` contada por `inject`; el CSS no depende de cadenas de descendientes.
- **Clave interna de anidación** (`sectionKey`, módulo del principal; no es API): lleva el siguiente nivel y la profundidad. `GCard`, `GFormSection` y `GDialog` **no la leen** en esta entrega (L14: reservado, «Fuera de v1»).
- **Descripción:** body-sm 14/20, 400, `muted` (`--g-color-text-muted`), con medida de lectura `66ch` (literal de unidad, #717).
- Medido por kiwi: 20 › 16 › 14.

## Slots

| Slot | Qué va | Regla |
| --- | --- | --- |
| `title` | Contenido en línea del `hN` | Nunca elementos interactivos |
| `description` | Texto | Sustituye a la prop |
| `actions` | `GBtn`, `GMenu` | Al final de la fila del título; con poco ancho bajan solas (medido a 320, sin punto de corte). Selectores con la exclusión de `.g-tooltip` (#383) |
| `default` | Contenido de la sección | El cuerpo (pila `md`) |

## Eventos y métodos

**Ninguno.** Puro (#444).

## Estructura accesible

- **`section`** siempre. Sin `landmark`, sin nombre: no es punto de referencia (HTML-AAM), la estructura la dan los encabezados (la navegación por encabezados es la principal en lector). Con `landmark`: `region` con el nombre del título. Medido por kiwi: `region "Firmantes"` con `landmark`, ninguna sin él.
- **`dir="auto"`** en el título (#282).
- **Acciones en `role="group"`** con `aria-label` = `labels.actions`.
- **`scroll-margin-block-start: var(--g-space-4)`** en la raíz: un `#id` de sección deja aire bajo lo pegado (lo pegado lo suma el `scroll-padding` del chasis o de la aplicación, #515; esto es aire, no la barra).
- Estilos de elemento de la aplicación sobre el `hN` o el `p` (sin capa) ganan: límite general y receta de capas de #516 (`api.md`).

## Avisos de desarrollo (`[Grana GSection]`, una vez por instancia y motivo)

Con la guarda canónica de #653, al montar y al cambiar la prop que comprueban.

1. Sin `title` ni slot `title` (o vacío).
2. Hay slot `actions` y falta `labels.actions`.
3. `headingLevel` fuera de `2`–`4` (se usa el automático).
4. Nivel automático `2` dentro de un `GDialog` (`.g-dialog`; su título ya es `h2`): pasa `headingLevel="3"`.

## Tokens consumidos (`tokens.md` §49)

**Ningún token nuevo.** `--g-text-title-sm-*`, `--g-text-body-*`, `--g-text-body-sm-*`, `--g-font-title`, `--g-font-ui`, `--g-color-text`, `--g-color-text-muted`, `--g-space-*` (separaciones de coco: cabecera `space-2 × space-4`, cabecera → cuerpo `space × 4`, título → descripción `space × 1`), las de la pila (§«Anatomía»). Dentro de la zona de marca, todos en §44.5.

**No son tokens:** `66ch` (literal de unidad, #717); el tope de profundidad 3 y de nivel 4.

## Clases (contrato bruno ↔ coco)

| Clase | Cuándo |
| --- | --- |
| `g-section`, `g-section--depth-{1\|2\|3}` | Siempre |
| `g-section__head`, `__titles`, `__title` | Siempre |
| `g-section__desc` | Con `description` o slot |
| `g-section__actions` | Con slot `actions` |
| `g-section__body` | Siempre |

## Peso y paquete (#723)

En el **principal**, con la compuerta conjunta con `GStack` (≤ 1 KiB gzip; `stack.md` «Peso»). Compuerta de `dist`: `grep -q "g-section__actions" packages/vue/dist/grana.css`.

## `meta.json` y tipos (#443)

`GSection.meta.json`: las seis props (`headingLevel` `2 | 3 | 4` sin default fijo: «automático»), los cuatro slots, `labels` `{ actions?: string }`, `events: []`, `methods: []`, `status: "draft"` hasta la auditoría de coco.

## Verificación

- **bruno (vitest):** niveles automáticos 2 › 3 › 4 › 4; fijado gana y los de dentro cuentan desde él; clase de profundidad con tope 3; `aria-labelledby` solo con `landmark`; grupo de acciones con nombre; los cuatro avisos; SSR.
- **Playwright** (`tests/stack-section.spec.mjs`): tamaños 20 › 16 › 14 medidos; `region` con nombre solo con `landmark` (árbol de accesibilidad); acciones que bajan a 320 sin desbordamiento; `#id` con aire bajo lo pegado dentro de `GAppShell`; tres motores.
- **coco:** `GSection.css`; auditoría con un tema distinto (otra `typeScale`).

## Fuera de v1

Encabezado de sección pegado; lectura de `sectionKey` por `GCard`, `GFormSection` y `GDialog` para su `headingLevel` por defecto (L14; ronda propia: cambiaría el nivel por defecto de componentes ya `candidate`).

## Encargos

- **coco (Sonnet):** `GSection.css` (la pila del cuerpo con la regla de `GStack.css` o compartiendo su selector).
- **bruno (Sonnet):** `GSection.vue` con `sectionKey`, pruebas, `meta.json`, registro, compuerta, ejemplo en el playground.
- **mora-docs (Sonnet):** `GSection/README.md` con la frontera y la regla del nivel.
