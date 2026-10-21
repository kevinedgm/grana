# GContainer

Contenedor de página (el componente, no el «contenedor de consultas» de CSS): pone los **límites en línea** del contenido, es decir, cuánto ancho ocupa, dónde se centra, cuánto aire deja contra el borde y qué elemento es. **Mide su sitio, no el visor.** No reparte, no apila, no hace columnas y **no pinta nada** (ni fondo, ni borde, ni sombra): el color y la superficie los ponen el tema y `GSurface`.

**Etiqueta:** `<g-container>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/container/auditoria.md`](../../../../../design/lab/container/auditoria.md)) · **Desde:** 0.1.0

```js
import { GContainer } from '@grana/vue'
```

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio. Exige Vue `^3.5.0`.

> **Un solo contenedor por página.** El ancho completo no se logra con un segundo contenedor `full` (el «emparedado» corta el pegado de `GPageHeader`): una banda pide el borde con `g-bleed` y su contenido se queda en la columna.

## En esta página

[§ Uso](#uso) · [§ Ejemplos](#ejemplos) · [§ API](#props) · [§ Accesibilidad](#accesibilidad) · [§ Personalidad](#personalidad) · [§ Tema](#tema) · [§ Alcance](#alcance) · [§ Verificación](#verificación)

## Uso

```vue
<!-- Fragmento: `GPageHeader` es de `@grana/vue/page-header` y `ajustes` de tu aplicación -->
<!-- Sin chasis: el contenedor es el main y el encabezado su primer hijo -->
<GContainer as="main" id="main" tabindex="-1" width="sm">
  <GPageHeader title="Ajustes" :labels="{ actions: 'Acciones de la página' }" />
  <GForm>…</GForm>
</GContainer>

<!-- Con GAppShell: el chasis ya pone el main; el contenedor es un div -->
<GAppShell :labels="{ skip: 'Saltar al contenido' }">
  <GContainer>
    <GPageHeader title="Muestras" :labels="{ actions: 'Acciones de la página' }" />
    …
  </GContainer>
</GAppShell>
```

Son las dos recetas: **con chasis, `as="div"` (el valor por defecto); sin chasis, `as="main"`**. `GContainer as="main"` dentro del chasis duplica el `main` (aviso 3 de los dos componentes). `tabindex="-1"` lo pone tu aplicación (destino de su salto), no el componente. `GPageHeader` es hijo directo de la columna: esa columna es su contenedor largo y el pegado dura toda la página.

## Ejemplos

### e1 · Una columna que respira con su caja

```vue demo
<div style="resize: horizontal; overflow: auto; max-inline-size: 100%; border: 1px dashed var(--g-color-border)">
  <GContainer width="md">
    <p>La columna mide como mucho 768 px. Estrecha esta caja y verás el margen lateral crecer y encogerse de forma continua, de 16 a 48 px, sin puntos de corte.</p>
    <GContainer width="sm" horizontal="start">
      <p>Un contenedor anidado no suma margen: empieza donde empieza la columna.</p>
    </GContainer>
  </GContainer>
</div>
```

**Por qué:** el margen se calcula sobre **la caja del contenedor**, no sobre el visor. Si pliegas la barra lateral de tu aplicación, la columna se ensancha sola sin saber que la barra existe. `gutter="auto"` (el valor por defecto) pone el margen medio arriba y **0 cuando está anidado** (dentro de otro contenedor, de `GSurface` o de `GDialog`), así no se acumula. Úsalo para toda columna de página; no escribas `max-width` y `padding` a mano.

### e2 · Una banda de borde a borde con el texto alineado (`g-bleed`)

```vue demo
<div style="resize: horizontal; overflow: auto; max-inline-size: 100%; border: 1px dashed var(--g-color-border)">
  <GContainer width="md">
    <p>Texto de la página, dentro de la columna.</p>
    <section class="g-bleed" style="background: var(--g-color-surface); padding-block: var(--g-space-3)" aria-label="Aviso de la auditoría">
      <p style="margin: 0">El fondo de esta banda llega al borde de la caja; este texto sigue alineado con la columna.</p>
    </section>
    <p>Más texto de la página.</p>
  </GContainer>
</div>
```

**Por qué:** una banda (un encabezado de marca, un aviso, una tabla ancha) quiere el fondo hasta el borde y el contenido en la columna. `g-bleed` pone el margen negativo hasta el borde de **la caja del contenedor** (nunca el visor: no se mete bajo la barra lateral ni crea desplazamiento horizontal) y el mismo valor como relleno en línea. **Un desplazable** (una tabla ancha) empieza alineado con el texto, se desliza hasta el borde y termina alineado con el final de la columna. `g-bleed-raw` solo pone el margen negativo, sin realinear: para media, un mapa o una línea de `GDivider` de borde a borde. Una zona de marca de borde a borde es `data-g-zone="brand"` en el elemento con `g-bleed`.

**Receta del relleno propio.** `g-bleed` pone el `padding-inline` en la capa de Grana: si tu banda tiene relleno propio sin capa, el tuyo gana y debe sumar los márgenes publicados:

```css
.mi-banda {
  padding-inline:
    calc(var(--g-container-inset-start) + var(--g-space-4))
    calc(var(--g-container-inset-end) + var(--g-space-4));
}
```

`--g-container-inset-start` y `--g-container-inset-end` los publica la columna (solo lectura, lógicos, en px) y se heredan a cualquier profundidad.

### e3 · Un artículo: la medida de lectura (`width="reading"` y `prose`)

```vue demo
<GContainer width="xl" prose>
  <p>Con <code>prose</code>, este párrafo se queda en unos 66 caracteres aunque la columna mida hasta 1280 px, para que la línea se lea cómoda. Cualquier párrafo, lista o título de la columna hace lo mismo.</p>
  <p class="g-wide">Este párrafo lleva <code>g-wide</code> y usa la columna entera, como una tabla o un componente de Grana.</p>
</GContainer>
```

**Por qué:** una columna de 1280 px es buena para una tabla y mala para un párrafo. Con `prose`, el contenedor limita **la línea y no la caja**: la prosa se lee a 66 caracteres y lo ancho usa toda la columna. Si lo único que hay es texto, `width="reading"` hace la columna entera de 66 caracteres. Usa `prose` cuando mezclas texto y tablas; `reading` cuando es un artículo.

**Límite:** `prose` selecciona elementos de tu aplicación por etiqueta (`p`, listas, `blockquote`, `h1`–`h6`, `figcaption`, `address`). Un `<p>` que quieras ancho necesita `g-wide`. Por eso es opción y no valor por defecto. Atraviesa `GStack`, `GSection` (su cuerpo, no su título ni su descripción) y las bandas `g-bleed`/`g-bleed-raw`, y **no entra** en otros componentes de Grana, en una `table` ni en lo marcado con `g-wide` (#751).

## Props

| Prop | Tipo | Valores | Default | Descripción |
| --- | --- | --- | --- | --- |
| `width` | `String` | `'sm'` `'md'` `'lg'` `'xl'` `'2xl'` `'full'` `'reading'` | `'lg'` | Ancho máximo de la columna: `space × 160 · 192 · 256 · 320 · 384` (640 · 768 · 1024 · 1280 · 1536 px con `space` 4); `full` sin máximo (la caja menos el margen); `reading` = 66ch de la fuente de la columna. `--g-container-max` en la raíz gana. Fuera de lista: aviso 1 y `lg` |
| `horizontal` | `String` | `'center'` `'start'` | `'center'` | `center` reparte el sobrante; `start` deja el margen al inicio lógico y el sobrante al final. Con `width="full"` no tiene efecto (aviso 2) |
| `gutter` | `String` | `'auto'` `'none'` `'sm'` `'md'` `'lg'` | `'auto'` | Margen lateral fluido (clamp con unidades de contenedor y el área segura). `auto` = `md` arriba y 0 anidado. Uno explícito siempre gana. Fuera de lista: aviso 4 y `auto` |
| `as` | `String` | `'div'` `'main'` `'section'` `'article'` | `'div'` | Elemento de la raíz; no añade roles ni nombres (los `aria-*` van a la raíz por `$attrs`). `main` solo sin `GAppShell` (aviso 3). Fuera de lista: aviso 4 y `div` |
| `prose` | `Boolean` | | `false` | La prosa de la columna se queda en 66ch alineada al inicio; excluye lo de dentro de un componente de Grana, de una tabla y de `.g-wide` |

| `gutter` | Margen a cada lado (crece con la caja) |
| --- | --- |
| `sm` | de 12 a 24 px (`clamp(space-3, 2cqi, space-6)`) |
| `md` | de 16 a 48 px (`clamp(space-4, 4cqi, space-12)`) |
| `lg` | de 24 a 64 px (`clamp(space-6, 6cqi, space-16)`) |
| `none` | 0 |

El margen es el mayor entre ese valor y el área segura (`env(safe-area-inset-*)`), salvo con `none`.

## Eventos

`GContainer` no emite eventos.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `default` | — | El contenido de la página, en flujo normal dentro de la columna (`.g-container__body`). Bandas con `g-bleed` / `g-bleed-raw` y excepciones de `prose` con `g-wide` |

## Clases públicas de entrada

| Clase | Dónde la pone tu aplicación | Qué hace |
| --- | --- | --- |
| `g-bleed` | Un descendiente cuya caja ocupa la columna | Margen negativo hasta los bordes de la caja y el mismo valor como relleno en línea: el fondo llega al borde, el contenido sigue en la columna |
| `g-bleed-raw` | Un descendiente | Solo el margen negativo (media, mapas, una línea) |
| `g-wide` | Un hijo de la columna con `prose` | Excluye ese elemento de la medida de lectura |

## Accesibilidad

a. El contenedor **no añade roles, nombres ni foco** y no cambia el orden del DOM. Con `as="section"`, pasa `aria-labelledby` o `aria-label` por `$attrs`: sin nombre no es punto de referencia.

b. Reflujo (1.4.10): a 320×256, con y sin chasis, sin desplazamiento horizontal; una URL larga se parte dentro de la columna (`overflow-wrap: break-word`). `medido`, 473/473 en los tres motores (auditoría de coco, 2026-10-21).

c. La medida de `prose` está en caracteres: con el texto al 200 %, la línea sigue teniendo unos 66 caracteres y no desborda (`medido`).

d. No pinta nada: el contraste de la banda `g-bleed` con zona de marca (título y texto) mide ≥ 4,5:1 en 12 temas (`medido`). Fondo transparente en esos 12 temas.

e. No atrapa lo fijo ni corta el pegado: un descendiente `position: fixed` (el muelle de `GPageHeader`) sigue pegado al visor y uno `sticky` se pega con normalidad (`medido`).

f. RTL: columna, `horizontal="start"` y `g-bleed` siguen la dirección (`medido`).

> **Peligro.** `as="main"` dentro de `GAppShell` (o con otro `main` en la página) duplica el punto de referencia principal: el lector de pantalla anuncia dos regiones principales y «Saltar al contenido» deja de ser fiable. Con chasis, deja `as="div"`; sin chasis, un solo `main` (aviso 3 en desarrollo).

## Personalidad

Un contenedor que **mide su sitio y no el visor**, con un margen que **respira de forma continua** en lugar de saltar en puntos de corte, que **no acumula margen** al anidarse y en el que **el ancho completo no rompe la página**: la banda sabe dónde está la columna (los márgenes publicados) y la tabla ancha de un teléfono arranca alineada con el texto y se desliza desde el borde, donde el pulgar la empuja.

Sin movimiento: cambiar de ancho (plegar la barra, redimensionar) no es un suceso del usuario y animarlo reflujaría el texto. Con `GAppShell`, el cambio de ancho llega una vez por la cortina del chasis.

## Tema

El contenedor **no pinta** y no lee ningún token de color. Lee solo la escala de espacio:

| Token | Qué controla |
| --- | --- |
| `--g-space-1` | Anchos máximos (`× 160 … 384`) |
| `--g-space-3`, `--g-space-4`, `--g-space-6`, `--g-space-12`, `--g-space-16` | Extremos del margen lateral |
| `--g-container-max` | **Propiedad de entrada pública** (longitud; no del tema): un ancho máximo a medida que gana a `width` (`0px`, el inicial, significa «sin valor»). **Va en la raíz del contenedor**, no hereda a un contenedor anidado (`inherits: false`). Para toda una vista: `.mi-vista .g-container { --g-container-max: 70rem }` |
| `--g-container-inset-start`, `--g-container-inset-end` | **Publicadas, solo lectura:** distancia de cada borde de la columna al borde de la caja, en px |

## Alcance

- **C · Medida a la mano** (`adjustable`, `v-model:measure`; el usuario ajusta la medida de lectura): reservada (#721). `horizontal="end"` tampoco existe.
- **No existen** `size`, `fluid`, `centered`, `padding` de bloque, `gap` ni `zone` (#722): el ritmo es de `GStack`, la superficie de `GSurface`, la zona de marca va en la raíz con `data-g-zone` o en una banda.
- **`GPageHeader` dentro de la columna (L4, abierto, #751):** su relleno lateral propio (`space × 6`) se suma al margen, así que el `h1` y las acciones quedan **24 px por dentro** del texto de la página (medido en los tres motores, con y sin chasis). Decisión pendiente (coco propone en `GPageHeader.css`, lima la registra). Con `g-bleed` en un `GPageHeader`, el relleno del sangrado y el suyo se pelean.
- **`GTable` con `g-bleed` (L10):** en reposo, la leyenda y las celdas se alinean con la columna; lo que no llega al borde de la caja es el desplazable interno de la tabla cuando es más ancha que la columna.
- **Una banda solo sangra bien si su caja ocupa la columna** (aviso 5): dentro de una superficie con relleno o de una caja más estrecha sangraría al sitio equivocado. Se mide una sola vez, al montar.
- **El contenedor no recorta** (`overflow` visible): lo ancho de verdad necesita su propio desplazable.
- **Anfitrionas del margen 0:** `.g-container__body`, `.g-surface` (incluye `GCard`) y `.g-dialog__body`. Una anfitriona nueva se añade al contrato.
- **Peso:** 1 015 B gzip de crecimiento de `dist/grana.js` (`medido` por bruno; tope de 1 KiB, #723, #746).

## Verificación

- **Motores:** `design/lab/container/auditoria-verificar.mjs` sobre el componente real: **473/473** en Chromium (159), Firefox (157) y WebKit (157), con seis temas en claro y oscuro y el texto al 200 % (`medido`, coco, 2026-10-21).
- **Pruebas de bruno:** `GContainer.test.js` (11 pruebas, nivel `prueba`) y `container.spec.mjs` en los tres motores (el lote `app-shell`, `app-shell-perf`, `container` y `stack-section` da 196 pasan y 2 omitidos por diseño).
- **WebKit:** el desplazable `g-bleed` termina alineado con el final de la columna ±2 px (desplazamiento a píxel entero; límite del motor).
- **No verificado:** lector de pantalla real, zoom real del navegador, `forced-colors` en Firefox y WebKit (en Chromium, nada que perder: no pinta).
- **Pendientes abiertos:** L4 (el `h1` de `GPageHeader` dentro de la columna) y la adopción del sangrado en `GTable` (L10); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md) §6.

## Fuentes

- Contrato: [`design/contracts/container.md`](../../../../../design/contracts/container.md)
- Decisiones: #717, #718 y #721–#724, remates #746, #751 y #754 en [`DECISIONS.md`](../../../../../DECISIONS.md)
- API: [`GContainer.meta.json`](GContainer.meta.json)
- Auditoría de coco: [`design/lab/container/auditoria.md`](../../../../../design/lab/container/auditoria.md)
- Pruebas: [`GContainer.test.js`](GContainer.test.js) (11 pruebas, nivel `prueba`); Playwright [`design/lab/theme-playground/tests/container.spec.mjs`](../../../../../design/lab/theme-playground/tests/container.spec.mjs)
- Banco: [`packages/vue/playground/container.html`](../../../playground/container.html)
