# GStack

Pila de un eje con la escala de separación de Grana: `sm` «va con lo anterior», `md` «lo siguiente», `lg` «otro tema». **Sin superficie, sin envoltorio por hijo y sin poder romper el reflujo**: en línea siempre se parte, y es la **única** fuente de aire entre sus hijos. Es el ritmo de bloque que `GContainer` deja fuera. **No pinta color** (lo pone el tema).

**Etiqueta:** `<g-stack>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/stack/auditoria.md`](../../../../../design/lab/stack/auditoria.md)) · **Desde:** 0.1.0

```js
import { GStack } from '@grana/vue'
```

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio. Exige Vue `^3.5.0`.

> **La pila no distribuye campos ni reparte por tamaño.** Los campos de un formulario van en `GFormLayout` + `GFormRow`; repartir hijos en líneas por su tamaño es de `GAdaptiveLayout`. Ver «Cuándo usarla».

## En esta página

[§ Uso](#uso) · [§ Cuándo usarla](#cuándo-usarla) · [§ Ejemplos](#ejemplos) · [§ API](#props) · [§ Accesibilidad](#accesibilidad) · [§ Personalidad](#personalidad) · [§ Tema](#tema) · [§ Alcance](#alcance) · [§ Verificación](#verificación)

## Uso

```vue
<GStack gap="lg">
  <GSection title="Pendientes" :labels="{ actions: 'Acciones de pendientes' }">…</GSection>
  <GSection title="Validadas" :labels="{ actions: 'Acciones de validadas' }">…</GSection>
</GStack>

<GStack orientation="horizontal" gap="sm" vertical="center">
  <GBadge color="success">Validado</GBadge>
  <GBadge color="info">Hematología</GBadge>
</GStack>
```

## Cuándo usarla

| Necesito | Uso | No |
| --- | --- | --- |
| Apilar bloques de una página o de un panel | **`GStack`** | Márgenes escritos a mano |
| Campos de un formulario | `GFormLayout` + `GFormRow` (#171, #361) | `GStack` para distribuir campos: sus filas siempre llenan el ancho |
| Repartir hijos en líneas según su tamaño | `GAdaptiveLayout` (#339 a #365) | `GStack horizontal` con `between`: no existe (eso reparte) |
| Un grupo de tarjetas que filtran | `GCardGroup` (#603) | — |
| Relleno, fondo, borde | `GSurface` | `GStack` (no tiene superficie) |
| La columna de la página | `GContainer` | — |

## Ejemplos

### e1 · El ritmo de una página: la separación es una relación

```vue demo
<div style="display: grid; gap: var(--g-space-4); grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))">
  <GStack gap="sm"><p>sm</p><p>va con lo anterior</p><p>12 px</p></GStack>
  <GStack gap="md"><p>md</p><p>lo siguiente</p><p>24 px</p></GStack>
  <GStack gap="lg"><p>lg</p><p>otro tema</p><p>48 px</p></GStack>
</div>
```

**Por qué:** la separación no es una cifra, es una relación. `sm` junta lo que va con lo anterior, `md` separa el siguiente bloque, `lg` marca otro tema. Es el mismo vocabulario que `GAdaptiveLayout`, `GSection` y la densidad del tema, así que una pantalla entera cambia de ritmo con `space` y nunca con un número escrito a mano. Úsalo entre los bloques de una página; no mezcles su aire con márgenes de los hijos (valen 0 dentro de la pila).

### e2 · Una fila de estado que se parte sola

```vue demo
<GStack orientation="horizontal" gap="sm" vertical="center" horizontal="start">
  <GBadge color="success">Validado</GBadge>
  <GBadge color="info">Hematología</GBadge>
  <GBadge color="warning">Pendiente de firma</GBadge>
  <GBtn variant="outline" color="neutral" size="sm">Ver historial</GBtn>
</GStack>
```

**Por qué:** en horizontal los hijos conservan su tamaño y **siempre se parten en filas** con la misma separación (también entre filas), así que a 320 px no hay desplazamiento horizontal (1.4.10). No hay `nowrap`: una fila que no se parte rompe el reflujo. Úsalo para etiquetas, insignias y acciones de una línea; para repartir por tamaño, `GAdaptiveLayout`.

### e3 · Bloques separados por una línea (`divided`)

```vue demo
<GStack divided>
  <p>Resultado de hematología: sin alteraciones.</p>
  <p>Resultado de química sanguínea: pendiente de validar.</p>
  <p hidden>Este bloque está oculto y no cuenta.</p>
  <p>Resultado de orina: sin alteraciones.</p>
</GStack>
```

**Por qué:** una línea `--g-color-border` entre hijos **visibles**, con el aire repartido a los dos lados (la distancia entre dos hijos es `2 × gap`); nunca antes del primero ni tras el último. **Solo en vertical** (en horizontal, aviso 3 y no se pinta). **No se dibuja sobre un hijo con superficie propia** (`GSurface`, `GCard`): ya está delimitado y lo separa el `gap`. Para una lista de tarjetas, usa `gap`, no `divided` (#752).

## Props

| Prop | Tipo | Valores | Default | Descripción |
| --- | --- | --- | --- | --- |
| `as` | `String` | etiqueta HTML no interactiva | `'div'` | `div`, `section`, `article`, `aside`, `nav`, `header`, `footer`, `ul`, `ol`, `form`, `fieldset`… La pila no añade roles; con `ul`/`ol` pones tú los `li`. Con `a`, `button`, `input`, `select`, `textarea`, `summary`, `label` o `main`, aviso 1 (se pinta igual) |
| `orientation` | `String` | `'vertical'` `'horizontal'` | `'vertical'` | Eje de la pila |
| `gap` | `String` | `'none'` `'sm'` `'md'` `'lg'` | `'md'` | Factor 0 · 0,5 · 1 · 2 sobre la base de página `space × 6` (0 · 12 · 24 · 48 px con `space` 4); la misma separación en los dos ejes |
| `density` | `String` | `'default'` `'comfortable'` `'compact'` | sin valor: sigue la región | Multiplica la separación 1 · 0,875 · 0,75. Con valor, el `GStack` es la región de lo que lleva dentro, no solo de su separación ([Densidad](../../../../../README.md#densidad-global-y-por-región)). Pasa la prop, no `data-g-density` |
| `horizontal` | `String` | `'start'` `'center'` `'end'` | sin valor | Eje en línea, lógico. En vertical, el ancho de los hijos (sin valor, estirar); en horizontal, dónde va la fila (sin valor, `start`) |
| `vertical` | `String` | `'top'` `'center'` `'bottom'` | sin valor | Eje de bloque; **solo en horizontal** (sin valor, `center`). En vertical no actúa (aviso 3) |
| `divided` | `Boolean` | | `false` | Línea entre hijos visibles; solo en vertical (en horizontal, aviso 3 y no se pinta) |

Un valor fuera de lista avisa (aviso 2) y se usa el default.

**No existen** (y por qué): `between`, `around`, `evenly` (eso reparte: `GAdaptiveLayout`); `nowrap` (en línea siempre se parte, 1.4.10); `reverse` y cualquier orden visual distinto del DOM (1.3.2, 2.4.3); `gap` numérico o en px (la escala es la relación); `padding`, `background`, `border` (`GSurface`); `inline`.

## Eventos

`GStack` no emite eventos ni expone métodos. Es puro: sin medidas, observadores ni estado.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `default` | — | Los hijos, en el orden del DOM, sin envoltorio por hijo |

## Reglas de los hijos

- **Una sola fuente de aire:** los márgenes de bloque de los hijos directos valen 0 dentro de la pila, en la capa de Grana. **Un estilo de tu aplicación sin capa sobre los hijos gana** (#516): un `p { margin-block: 1rem }` sin capa vuelve a sumar aire. Pon tus estilos de elemento en una capa anterior a las de Grana, o no pongas márgenes a los hijos.
- Un hijo con `hidden` no cuenta para `divided`. Un hijo que ocultas con una clase propia (`display: none`) **sí cuenta**: no se puede detectar en CSS sin coste.
- El nodo de `GTooltip` hermano se ignora en todos los selectores de hijos (#383): una pista abierta no cambia la separación.
- En horizontal, los hijos conservan su tamaño intrínseco.

## Accesibilidad

a. Sin `role`, `aria-*` ni foco propios: la semántica es la de `as` y la de los hijos. Orden del DOM = orden visual = orden de Tab (no hay `reverse`).

b. Reflujo (1.4.10): en horizontal, a 320 px se parte en varias filas con la misma separación y sin desplazamiento horizontal (`medido`, 362/362 en los tres motores, auditoría de coco 2026-10-21).

c. La línea de `divided` mide 1,17–1,30:1 contra la página: es decorativa (el aire también separa); el contrato no exige 3:1. En `forced-colors` es un borde `solid` visible (`medido` solo en Chromium).

d. Alineaciones lógicas (`start`, `end`) en RTL (`medido`).

> **Peligro.** Una `GStack` con `as="main"`, `as="a"` o `as="button"` avisa (aviso 1) pero se pinta igual: una pila no es el punto de referencia de la página ni un control, y la persona que use lector de pantalla recibe una semántica que no corresponde a lo que hace. Para la página, `GContainer`; para un control, el componente de Grana que corresponda. Con `as="ul"` o `as="ol"`, los `li` los pones tú como hijos directos.

## Personalidad

La separación **es una relación, no una cifra**: `sm`, `md` y `lg` comparten vocabulario con `GAdaptiveLayout`, `GSection` y la densidad del tema, así que toda la pantalla cambia de ritmo con `space`. Y la pila **no puede romper el reflujo**: en línea siempre se parte y es la única fuente de aire entre sus hijos. Sin movimiento: no anima hijos que entran o salen (eso es de quien los pone).

## Tema

| Token | Qué controla |
| --- | --- |
| `--g-space-1` | Base de página `× 6` y factores (`sm` = `space × 3`, `md` = `space × 6`, `lg` = `space × 12`) |
| `--g-color-border`, `--g-border-width` | Línea de `divided` (en zona de marca, `border` de `tokens.md` §44.5) |

La base `space × 6` es **distinta** de `--g-form-gap` (de `GFormLayout` y `GAdaptiveLayout`): la pila no es un formulario.

## Alcance

- **Sin superficie ni distribución:** no hay `padding`, `background`, `between` ni `gap` numérico (#719).
- **`divided` solo en vertical y no sobre hijos con superficie** (`GSurface`, `GCard`): los separa el `gap` (#752).
- **Límite conocido:** un hijo oculto con una clase propia (`display: none`) sigue contando para `divided`.
- **Peso:** `GStack` y `GSection` crecen **1 381 B gzip** en `dist/grana.js` (`medido` por bruno; tope conjunto de 1,5 KiB, #746). Con más, las tres primitivas de página pasan juntas a `@grana/vue/layout`.

## Verificación

- **Motores:** `design/lab/stack/auditoria-verificar.mjs` sobre el componente real: **362/362** en Chromium (122), Firefox (120) y WebKit (120), con cuatro temas en claro y oscuro (`medido`, coco, 2026-10-21). Un defecto corregido en la auditoría: `divided` ya no deforma a los hijos con superficie.
- **Pruebas de bruno:** `GStack.test.js` (14 pruebas, nivel `prueba`) y `stack-section.spec.mjs` en los tres motores (el lote de cuatro specs da 196 pasan y 2 omitidos por diseño).
- **No verificado:** `forced-colors` en Firefox y WebKit.
- **Pendientes abiertos:** ninguno propio; los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md) §6.

## Fuentes

- Contrato: [`design/contracts/stack.md`](../../../../../design/contracts/stack.md)
- Decisiones: #717, #719, #723, #746 y #752 en [`DECISIONS.md`](../../../../../DECISIONS.md)
- API: [`GStack.meta.json`](GStack.meta.json)
- Auditoría de coco: [`design/lab/stack/auditoria.md`](../../../../../design/lab/stack/auditoria.md)
- Pruebas: [`GStack.test.js`](GStack.test.js) (14 pruebas, nivel `prueba`); Playwright [`design/lab/theme-playground/tests/stack-section.spec.mjs`](../../../../../design/lab/theme-playground/tests/stack-section.spec.mjs)
- Banco: `#sec-stack` de [`packages/vue/playground/index.html`](../../../playground/index.html)
