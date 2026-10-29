# GSection

Región de página con **encabezado** (`h2` a `h4`), descripción y acciones. **El nivel lo pone el documento por anidación** y el tamaño del título lo pone la profundidad: el esquema que oye el lector de pantalla y la jerarquía que ve el ojo no pueden desalinearse. **Sin superficie, sin plegado y sin pegado**; no es punto de referencia salvo que lo pidas con `landmark`.

**Etiqueta:** `<g-section>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/section/auditoria.md`](../../../../../design/lab/section/auditoria.md)) · **Desde:** 0.1.0

```js
import { GSection } from '@grana/vue'
```

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio. Exige Vue `^3.5.0`.

> **Bajo el `h1` de `GPageHeader`.** La primera sección es `h2`. Dentro de un `GDialog` (cuyo título ya es `h2`), pasa `headingLevel="3"` (aviso 4).

## En esta página

[§ Uso](#uso) · [§ Cuándo usarla](#cuándo-usarla) · [§ Ejemplos](#ejemplos) · [§ API](#props) · [§ Accesibilidad](#accesibilidad) · [§ Personalidad](#personalidad) · [§ Tema](#tema) · [§ Alcance](#alcance) · [§ Verificación](#verificación)

## Uso

```vue
<GSection title="Firmantes" description="Quién valida el informe." :labels="{ actions: 'Acciones de firmantes' }">
  <template #actions><GBtn variant="outline" color="neutral">Añadir</GBtn></template>
  <p>…</p>
  <GSection title="Suplentes">…</GSection>  <!-- h3 sola -->
</GSection>
```

## Cuándo usarla

| Necesito | Uso | No |
| --- | --- | --- |
| Una parte de una página con título y, quizá, acciones | **`GSection`** | `GCard` (un **objeto** con superficie y su título) |
| Una sección de formulario (registro de campos, `collapsible`, `addable`, errores) | `GFormSection` | `GSection` dentro de `GForm` para agrupar campos |
| Una superficie sin título | `GSurface as="section"` | — |
| El encabezado de la página (`h1`, zócalo) | `GPageHeader` | `GSection headingLevel="1"`: no existe |
| Secciones que se pliegan | `GAccordion` | — |

## Ejemplos

### e1 · Secciones anidadas: el nivel y el tamaño salen de la estructura

```vue demo
<template>
  <GSection title="Firmantes" description="Quién valida el informe." :labels="{ actions: 'Acciones de firmantes' }">
    <template #actions>
      <GBtn variant="outline" color="neutral" size="sm">Añadir</GBtn>
    </template>
    <p>Cuerpo de la sección, separado por la pila <code>md</code>.</p>
    <GSection title="Suplentes">
      <p>Una sección anidada baja a <code>h3</code> sola.</p>
      <GSection title="Excepciones">
        <p>Y otra, a <code>h4</code>.</p>
      </GSection>
    </GSection>
  </GSection>
</template>
```

**Por qué:** una receta con `GStack` y un `hN` obliga a cada pantalla a contar niveles, que es justo donde se saltan (WCAG 1.3.1, técnica H42). Con `GSection` la primera es `h2`, una anidada `h3`, otra `h4` (tope). El tamaño baja con la profundidad: `title-sm` (20/28 con la escala por defecto) → `body` (16/24) → `body-sm` (14/20, el suelo: nunca menos que el `body-sm` de su paso; en una región `compact` baja con la escala, 13,13 con el tema por defecto). Úsala para las partes de una página.

### e2 · Fijar el nivel sin cambiar el tamaño (`headingLevel`)

```vue demo
<GSection title="Resumen">
  <GSection title="Detalle fijado a h3" :heading-level="3">
    <p>La etiqueta es <code>h3</code>; el tamaño sigue siendo el de la profundidad 2.</p>
  </GSection>
</GSection>
```

**Por qué:** hay casos en que el documento ya trae un nivel que `GSection` no puede adivinar (un panel de detalle dentro de un diálogo, una sección dentro de una tarjeta). `headingLevel` **fija la etiqueta y gana**; las secciones de dentro cuentan desde él (+1, tope 4). **No cambia el tamaño** (#196): ese lo sigue poniendo la anidación. No lo uses para hacer un título más grande o más pequeño; para eso, estructura.

### e3 · Una región con nombre (`landmark`), con moderación

```vue
<!-- Fragmento: el contenido de la sección es de tu aplicación -->
<GSection title="Firmantes" landmark>…</GSection>
```

**Por qué:** con `landmark`, `aria-labelledby` apunta al título y la `section` pasa a ser `region` con nombre, un punto de referencia al que el lector de pantalla puede saltar. Una página con seis secciones no debe llenar la lista de regiones: sin `landmark`, la estructura la dan los encabezados (la navegación por encabezados es la principal). Ponlo solo en las pocas secciones a las que alguien necesita saltar de una vez.

## Props

| Prop | Tipo | Valores | Default | Descripción |
| --- | --- | --- | --- | --- |
| `title` | `String` | texto | — (**obligatoria** salvo con el slot `title`) | Texto del encabezado. Sin ninguno de los dos, aviso 1 |
| `description` | `String` | texto | — | Párrafo bajo el título. El slot `description` lo sustituye |
| `headingLevel` | `Number` | `2` `3` `4` | automático | Automático: 2 en la primera, +1 por cada `GSection` antepasada, tope 4. Fijado, gana y las de dentro cuentan desde él. Cambia la etiqueta, no el tamaño. Fuera de lista: aviso 3 y automático |
| `landmark` | `Boolean` | | `false` | `aria-labelledby` al título: la `section` pasa a ser `region` con nombre |
| `labels` | `Object` | `{ actions }` | `{}` | `actions`: nombre del grupo de acciones. Obligatorio si hay slot `actions` (aviso 2). Sin valor por defecto (#226): ponlo siempre |
| `id` | `String` | | generado (SSR-seguro) | Base de ids (`{id}-title`) e id de la raíz |

| Profundidad | Nivel automático | Rol del título |
| --- | --- | --- |
| 1 | `h2` | `title-sm` 20/28, 600, `--g-font-title` |
| 2 | `h3` | `body` 16/24, 600, `--g-font-ui` |
| 3 y más | `h4` | `body-sm` 14/20, 600, `--g-font-ui` |

**No existen** (y por qué): `level` (es `headingLevel`); `collapsible` (`GAccordion`); `sticky`; `surface`, `padding` (`GCard`, `GSurface`); `gap` (el cuerpo es la pila `md`; una pila con otro ritmo va dentro como hijo); `size` del título (lo pone la anidación).

## Eventos

`GSection` no emite eventos ni expone métodos.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `title` | — | Contenido en línea del `hN`. Nunca elementos interactivos |
| `description` | — | Texto. Sustituye a la prop |
| `actions` | — | `GBtn` y `GMenu`, al final de la fila del título; con poco ancho bajan solas bajo el título, sin punto de corte |
| `default` | — | El contenido de la sección (el cuerpo, pila `md`) |

## Accesibilidad

a. Raíz `section`. Sin `landmark` y sin nombre no es punto de referencia (HTML-AAM); con `landmark` es `region` con el nombre del título. Medido con el árbol de accesibilidad: una sola `region`, la que pide `landmark` (`medido`, 668/668 en los tres motores, auditoría de coco 2026-10-21).

b. Esquema: bajo el único `h1` (de `GPageHeader`), `h2 → h3 → h4 → h4` por anidación, sin saltos. Tamaño estrictamente decreciente con suelo en el `body-sm` de su paso (14 px en `default`, 13,13 px en `compact` con el tema por defecto; relativo desde #989), peso 600 y `dir="auto"` en el título (`medido`).

c. Acciones en `role="group"` con `aria-label` = `labels.actions`; a 320 px bajan bajo el título sin desbordar, en LTR y RTL; un título largo se parte en varias líneas sin recortarse (`medido`).

d. Contraste: título y descripción ≥ 4,5:1 sobre la página, `GSurface`, superficie hundida y `GCard` en 11 temas; descripción ≥ 12 px (`medido`).

e. Orden del DOM = lectura = Tab: título → descripción → acciones → cuerpo.

f. Dentro de `GAppShell`, un `#id` de sección queda bajo la banda y el zócalo pegados con `space × 4` de aire (`medido`).

g. `forced-colors`: título y descripción con colores del sistema distintos del fondo (`medido` solo en Chromium).

> **Peligro.** Poner `GSection` sin el `h1` de la página, o dentro de un `GDialog` sin `headingLevel="3"`, deja un `h2` donde el documento ya tiene otro `h2`: el esquema que oye el lector de pantalla se repite o salta de nivel. Y un `GSection` con slot `actions` sin `labels.actions` deja el grupo de acciones sin nombre (aviso 2 en desarrollo).

## Personalidad

**El encabezado sabe dónde está:** el nivel lo pone el documento (una sección dentro de otra baja un nivel sola, nunca se salta uno) y el tamaño lo pone la anidación (cada nivel un rol menos, con suelo en el `body-sm` de su paso). La región con nombre es opcional, así una página con seis secciones no llena de puntos de referencia la lista del lector.

**Familia de los títulos (#753):** solo la profundidad 1 lleva `--g-font-title`; las anidadas, `--g-font-ui`. Con un tema de títulos serif, el `h1` de `GPageHeader` y el `h2` de la sección salen serif y `h3`/`h4` en la de interfaz, igual que los títulos de `GCard` y `GFormSection`. Sin movimiento.

## Tema

| Token | Qué controla |
| --- | --- |
| `--g-text-title-sm-*` | Título de la profundidad 1 |
| `--g-text-body-*` | Título de la profundidad 2 |
| `--g-text-body-sm-*` | Título de la profundidad 3 y descripción |
| `--g-font-title`, `--g-font-ui` | Familia del título de la profundidad 1; de las anidadas y la descripción |
| `--g-color-text`, `--g-color-text-muted` | Título y descripción |
| `--g-space-*` | Título → descripción `space × 1`, cabecera → cuerpo `space × 4`, entre hijos del cuerpo `space × 6` |

## Alcance

- **Sin superficie, plegado ni pegado:** un encabezado de sección pegado queda fuera de v1.
- **`GCard`, `GFormSection` y `GDialog` no leen todavía la clave de anidación** de `GSection` para su `headingLevel` por defecto (L14, reservado: cambiaría el nivel por defecto de componentes ya `candidate`).
- **Un estilo de elemento de tu aplicación** sobre el `hN` o el `p` (sin capa) gana: límite general y receta de capas de #516.
- **Peso:** `GStack` y `GSection` crecen **1 381 B gzip** en `dist/grana.js` (`medido` por bruno; tope conjunto de 1,5 KiB, #746).

## Verificación

- **Motores:** `design/lab/section/auditoria-verificar.mjs` sobre el componente real: **668/668** en Chromium (224), Firefox (222) y WebKit (222), con 11 temas (`medido`, coco, 2026-10-21).
- **Pruebas de bruno:** `GSection.test.js` (20 pruebas, nivel `prueba`) y `stack-section.spec.mjs` en los tres motores (el lote de cuatro specs da 196 pasan y 2 omitidos por diseño).
- **No verificado:** lector de pantalla real (la región y los niveles se midieron con el árbol de accesibilidad, no con VoiceOver ni NVDA); `forced-colors` en Firefox y WebKit.
- **Pendientes abiertos:** ninguno propio; los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md) §6.

## Fuentes

- Contrato: [`design/contracts/section.md`](../../../../../design/contracts/section.md)
- Decisiones: #717, #720, #723, #746 y #753 en [`DECISIONS.md`](../../../../../DECISIONS.md)
- API: [`GSection.meta.json`](GSection.meta.json)
- Auditoría de coco: [`design/lab/section/auditoria.md`](../../../../../design/lab/section/auditoria.md)
- Pruebas: [`GSection.test.js`](GSection.test.js) (20 pruebas, nivel `prueba`); Playwright [`design/lab/theme-playground/tests/stack-section.spec.mjs`](../../../../../design/lab/theme-playground/tests/stack-section.spec.mjs)
- Banco: `#sec-section` de [`packages/vue/playground/index.html`](../../../playground/index.html)
