# GPageHeader

Encabezado de página pegado con zócalo y muelle: dónde estoy (ruta), qué es (`h1`, antetítulo, descripción, estado), qué puedo hacer (acciones) y qué secciones tiene (pestañas). Al desplazar, el encabezado entero se hunde bajo el borde hasta que solo asoma el zócalo; en estrecho y pegado, las acciones bajan a un muelle en la zona del pulgar con `--g-ease-spring`. **No navega, no pide datos, no mueve el foco por su cuenta.**

**Etiqueta:** `<g-page-header>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/page-header/auditoria.md`](../../../../../design/lab/page-header/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio. Exige Vue `^3.5.0`.

> **Primer hijo de `main`, sin `role` ni `aria-label`.** Un `header` dentro de `main` no es `banner` (HTML-AAM). El encabezado va directamente en el contenedor que se desplaza; un envoltorio alrededor suyo limita el pegado a ese envoltorio (aviso 5).

## En esta página

[§ Uso](#uso) · [§ Ejemplos](#ejemplos) · [§ API](#props) · [§ Teclado y foco](#teclado-y-foco) · [§ Accesibilidad](#accesibilidad) · [§ Personalidad](#personalidad) · [§ Tema](#tema) · [§ Alcance](#alcance) · [§ Verificación](#verificación)

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import GranaPageHeader from '@grana/vue/page-header'
import '@grana/vue/style.css'

createApp(App).use(Grana).use(GranaPageHeader).mount('#app')
```

Receta de la aplicación (una sola variable):

```css
:root {
  --app-header: 56px;                                   /* alto de la barra fija de la aplicación */
  --g-page-header-top: var(--app-header);
  scroll-padding-block-start: calc(var(--app-header) + max(var(--g-space-12), 44px));
}
```

```vue
<!-- Fragmento: `masAcciones` es de tu aplicación -->
<script setup>
import { ref } from 'vue'

const seccion = ref('resumen')
const secciones = [
  { value: 'resumen',   label: 'Resumen' },
  { value: 'analitos',  label: 'Analitos' },
  { value: 'historia',  label: 'Historia' },
]
const ruta = [
  { label: 'Hematología', href: '/hematologia' },
  { label: 'Muestras',    href: '/hematologia/muestras' },
]
</script>

<template>
  <main id="main" tabindex="-1">
    <GPageHeader
      ref="header"
      title="Muestra M-0007"
      eyebrow="Hematología · Ambulatorio"
      description="Hemograma completo. Recibida el 12 de octubre de 2026 a las 08:14."
      :labels="{ actions: 'Acciones de la página' }"
    >
      <template #trail>
        <GBreadcrumbs :items="ruta" label="Ruta de navegación" />
      </template>
      <template #meta>
        <GBadge color="info">En análisis</GBadge>
      </template>
      <template #actions="{ narrow, docked }">
        <GBtn v-if="!narrow" variant="outline" color="neutral">Editar</GBtn>
        <GBtn>Validar resultados</GBtn>
        <GMenu :items="masAcciones" label="Más acciones" />
      </template>
      <template #tabs>
        <GTabs
          id="muestra"
          v-model="seccion"
          :items="secciones"
          detached
          label="Secciones de la muestra"
        />
      </template>
    </GPageHeader>
    <GTabPanel tabs="muestra" value="resumen" :active="seccion === 'resumen'">…</GTabPanel>
    <GTabPanel tabs="muestra" value="analitos" :active="seccion === 'analitos'">…</GTabPanel>
    <GTabPanel tabs="muestra" value="historia" :active="seccion === 'historia'">…</GTabPanel>
  </main>
</template>
```

> **En plantillas dentro del HTML** (sin compilar), escribe `<g-page-header ...></g-page-header>`: Vue no admite etiquetas de componente autocerradas.

> **Las pestañas van con `detached`.** Los `GTabPanel` van en el cuerpo de la página, no dentro del encabezado. Con paneles integrados, aviso 9 en desarrollo.

## Ejemplos

### e1 · Encabezado básico: ruta, título y acciones

```vue demo
<script setup>
import { ref } from 'vue'
const ruta = [{ label: 'Pedidos', href: '#pedidos' }]
</script>
<template>
  <div style="min-height: 200px; overflow-y: auto; position: relative;">
    <GPageHeader
      title="Pedido #4821"
      eyebrow="Tienda en línea"
      description="Creado el 10 de octubre de 2026."
      :labels="{ actions: 'Acciones del pedido' }"
    >
      <template #trail>
        <GBreadcrumbs :items="ruta" label="Ruta de navegación" />
      </template>
      <template #meta>
        <GBadge color="warning">En proceso</GBadge>
      </template>
      <template #actions>
        <GBtn variant="outline" color="neutral">Editar</GBtn>
        <GBtn>Confirmar</GBtn>
      </template>
    </GPageHeader>
    <p style="padding: var(--g-space-4)">Aquí va el cuerpo de la página.</p>
  </div>
</template>
```

El encabezado sin pestañas no se pega (no hay zócalo que mostrar al hundir). Es el caso de una página de detalle sin secciones. Úsalo para dar contexto (dónde estoy, qué es) sin añadir la complejidad del pegado.

### e2 · Con pestañas y pegado

```vue demo
<script setup>
import { ref } from 'vue'
const seccion = ref('datos')
const secciones = [
  { value: 'datos',    label: 'Datos' },
  { value: 'bitacora', label: 'Bitácora' },
  { value: 'adjuntos', label: 'Adjuntos' },
]
</script>
<template>
  <div style="height: 280px; overflow-y: auto; position: relative; scroll-padding-block-start: 44px;">
    <GPageHeader
      title="Expediente 2026-09-EX"
      description="Actualizado hace 2 horas."
      :labels="{ actions: 'Acciones del expediente' }"
    >
      <template #actions="{ narrow }">
        <GBtn variant="outline" color="neutral">Descargar</GBtn>
        <GBtn>Archivar</GBtn>
      </template>
      <template #tabs>
        <GTabs id="exp-tabs" v-model="seccion" :items="secciones" detached label="Secciones del expediente" />
      </template>
    </GPageHeader>
    <GTabPanel tabs="exp-tabs" value="datos"    :active="seccion === 'datos'">
      <div style="padding: var(--g-space-4)">
        <p>Datos del expediente.</p>
        <div style="height: 300px; background: var(--g-color-surface); border-radius: var(--g-radius-md)" />
      </div>
    </GTabPanel>
    <GTabPanel tabs="exp-tabs" value="bitacora" :active="seccion === 'bitacora'">
      <div style="padding: var(--g-space-4)"><p>Bitácora del expediente.</p></div>
    </GTabPanel>
    <GTabPanel tabs="exp-tabs" value="adjuntos" :active="seccion === 'adjuntos'">
      <div style="padding: var(--g-space-4)"><p>Adjuntos del expediente.</p></div>
    </GTabPanel>
  </div>
</template>
```

Con pestañas hay zócalo y el encabezado se pega de serie (`sticky: true`). Al desplazar, el encabezado se hunde hasta que asoma el zócalo con las pestañas y las acciones. Úsalo cuando la página tiene secciones que el usuario navega mientras trabaja en el cuerpo.

### e3 · Acción principal que se adapta al ancho

```vue
<!-- Fragmento: `masAcciones` es de tu aplicación; el slot `actions` va dentro de `<GPageHeader>` -->
<!--
  En estrecho (< space×150 ≈ 600px), la acción secundaria se oculta y la principal
  puede cambiar a solo icono (con nombre accesible y tooltip).
  Nunca un v-if/v-else que monte dos botones distintos: los mismos nodos cambian props.
-->
<template #actions="{ narrow, docked }">
  <!-- La secundaria desaparece en estrecho -->
  <GBtn v-if="!narrow" variant="outline" color="neutral">Editar</GBtn>
  <!-- La principal: siempre el mismo nodo; en estrecho-zócalo pasa a solo icono -->
  <GBtn
    v-bind="narrow && !docked
      ? { 'aria-label': 'Validar resultados', icon: 'check' }
      : {}"
  >
    <template v-if="!narrow || docked">Validar resultados</template>
  </GBtn>
  <!-- Más acciones con el resto -->
  <GMenu :items="masAcciones" label="Más acciones" />
</template>
```

`narrow` es `true` cuando el encabezado mide menos de `space × 150` (≈ 600 px). `docked` es `true` cuando las acciones están en el muelle (estrecho y pegado). Lo que depende de `docked` cambia **props**, no instancias: un `v-if/v-else` entre dos botones distintos desmontaría la acción al mudarse y perdería el foco y el estado.

### e4 · Zona de marca

```vue
<!--
  zone="brand" pone data-g-zone="brand" en la raíz.
  La barra de la aplicación, el encabezado y el zócalo pegado pueden
  compartir la misma zona para una banda de marca continua.
-->
<GPageHeader
  zone="brand"
  title="Dashboard"
  :labels="{ actions: 'Acciones del panel' }"
>
  <template #actions>
    <GBtn color="neutral" variant="soft">Configurar</GBtn>
  </template>
</GPageHeader>
```

`zone="brand"` pone `data-g-zone="brand"` en la raíz (nunca en un envoltorio: el pegado no funcionaría). Úsalo cuando el encabezado forma parte de una banda de marca continua con la barra de la aplicación. El fondo del muelle es siempre `--g-color-surface` (sin zona), para no confundir la capa del pulgar con la zona de marca.

## Props

| Prop | Tipo | Valores | Default | Descripción |
| --- | --- | --- | --- | --- |
| `title` | `String` | texto | — (**obligatoria**) | Texto del `hN`, del título compacto (`aria-hidden`) y del enlace del muelle. Sin ella o vacía, aviso 1 |
| `headingLevel` | `Number` | `1` `2` `3` | `1` | Nivel del encabezado. `2` o `3` para una vista anidada (panel de detalle, `GDialog` a pantalla completa). Fuera de lista: aviso 3 y se usa `1` |
| `eyebrow` | `String` | texto | — | Antetítulo, antes del `hN`. El slot `eyebrow` lo sustituye |
| `description` | `String` | texto | — | Párrafo bajo el título. El slot `description` lo sustituye |
| `sticky` | `Boolean` | | `true` | Pegado de serie cuando hay zócalo. `false`: el encabezado se va con la página, sin muelle |
| `zone` | `String` | `'none'` `'brand'` | `'none'` | Zona de marca: `'brand'` pone `data-g-zone="brand"` en la raíz. `'inverse'` reservado. Fuera de lista: aviso 10 |
| `labels` | `Object` | `{ actions }` | `{}` | `actions`: nombre del `role="group"` de acciones. Obligatorio si hay acciones (aviso 4). Sin valor por defecto (#226): ponlo siempre |
| `id` | `String` | | generado (SSR-seguro) | Base de ids: `{id}-title` es el `hN` y el destino del enlace del muelle |

## Eventos

`GPageHeader` no emite eventos propios. La ruta emite por `GBreadcrumbs` (`navigate`), las pestañas por `GTabs` y las acciones por `GBtn`/`GMenu`.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `trail` | — | `GBreadcrumbs`. Primer hijo de la raíz |
| `eyebrow` | — | Texto en línea. Sustituye a la prop |
| `title` | — | Contenido en línea del `hN` (p. ej. un código con `<bdi>`). Nunca elementos interactivos. Las copias usan la prop `title` |
| `description` | — | Texto. Sustituye a la prop |
| `meta` | — | `GBadge`, `GTag`, `GSummary`, texto. Estado de la página |
| `default` | — | Contenido: `GMetric`, `GAdaptiveLayout`. No va al zócalo |
| `tabs` | — | Un `GTabs` con `detached`. Los `GTabPanel` van en el cuerpo de la página |
| `actions` | `{ narrow: Boolean, docked: Boolean }` | `GBtn`, `GMenu`. `narrow`: el encabezado es estrecho. `docked`: las acciones están en el muelle |

## Métodos

| Método | Firma | Qué hace |
| --- | --- | --- |
| `focus` | `focus(options?: FocusOptions): void` | Enfoca el `hN` (`tabindex="-1"`), pasando `options` a `HTMLElement.focus`. Úsalo al cambiar de ruta; cuándo llamarlo lo decide la aplicación |

## Teclado y foco

| Tecla / elemento | Efecto |
| --- | --- |
| Tab | El orden es: ruta (`GBreadcrumbs`) → título → descripción → meta → contenido → pestañas → acciones. Ni `order` ni `grid-area` reordenan |
| Enlace del muelle (Enter / clic primario sin modificadores) | Lleva el `hN` al inicio de la vista y lo enfoca con `preventScroll` |
| Cambio de pestaña con el encabezado pegado | La página se coloca al instante en la posición justa de pegado; el foco queda en la pestaña |

`GPageHeader` no mueve el foco por su cuenta. Lo que tiene el foco no se muda: la mudanza al muelle espera al `focusout` de las acciones y al cierre de cualquier `aria-expanded="true"` dentro.

## Accesibilidad

a. Raíz `header` dentro de `main`, sin `role` ni `aria-label`: no es `banner` (HTML-AAM); el único `banner` de la página es la barra de la aplicación. Verificado en los tres motores (nivel `medido`, auditoría de coco 2026-10-14, 19/19 Playwright Chromium; ver también `design/lab/page-header/auditoria.md`).

b. Un solo `h1` por página con `headingLevel` 1 (aviso 2 en desarrollo si ya hay otro `h1` al montar). `dir="auto"` en el título, el título compacto y el enlace del muelle.

c. Acciones en `role="group"` con `aria-label` = `labels.actions`. El mismo nodo en el zócalo y en el muelle.

d. Título compacto: `aria-hidden="true"`; no es enfocable ni pulsable.

e. Muelle: sin rol (no es un punto de referencia). Cerrado: `hidden` + `inert`. El enlace lleva al `hN`.

f. Sin anuncios propios: pegarse, hundirse y abrir el muelle son consecuencia del desplazamiento del usuario (4.1.3 no aplica).

g. Táctil: con `pointer: coarse`, todo lo que se pulsa en el encabezado, el zócalo y el muelle mide ≥ 44 × 44 px. Verificado en el banco de estilo (1284 comprobaciones en los tres motores; `design/lab/page-header/estilo.md`).

h. Contraste: título ≥ 11,57:1, descripción ≥ 7,46:1, pestañas ≥ 4,64:1 en 13 temas medidos (nivel `medido`, `design/lab/page-header/estilo.md`).

i. Pegado nunca ocupa más de un cuarto del alto visible (regla del cuarto, WCAG 1.4.10). Verificado con Playwright: «regla del cuarto: con un visor de 180 px de alto no se pega» (19/19 Playwright Chromium).

j. `Δ0`: el contenido que sigue no se mueve al pegarse ni al volver. 0 mudanzas medidas en escritorio. Verificado con Playwright.

> **Peligro.** Poner el `GPageHeader` dentro de un elemento con `transform`, `translate`, `scale`, `filter`, `backdrop-filter`, `perspective`, `contain` (layout o paint) o `will-change` de esas propiedades atrapa el muelle (`position: fixed` dentro de la raíz) y lo hace desaparecer. El encabezado debe ser hijo directo del contenedor que se desplaza (`main` o equivalente).

## Personalidad

El encabezado entero se hunde bajo el borde al desplazar: no encoge, no copia, no mueve nada. Al pasar el `h1`, un **título compacto** aparece al principio del zócalo ligado al desplazamiento (opacidad y desplazamiento en `--_p`, de 0 a 1, una vez por cuadro). En estrecho y pegado, las mismas acciones bajan al **muelle** con `--g-ease-spring` (#635): la barra de borde a borde en la zona del pulgar se desliza desde abajo con la curva de resorte y lleva un enlace al `h1`.

Con `prefers-reduced-motion: reduce`, el título compacto aparece/desaparece por umbral (0 o 1, sin interpolación) y el muelle solo hace fundido, sin deslizamiento.

## Tema

Propiedades que lee del tema. El color lo pone tu hoja de variables `--g-*`; el encabezado no escribe ninguno.

| Token | Qué controla |
| --- | --- |
| `--g-page-header-top` | Propiedad de entrada pública (no del tema): distancia al borde del contenedor que se desplaza. La pone la aplicación. `0px` por defecto y dentro de `GDialog` |
| `--g-color-bg` | Fondo de la raíz (sin zona) |
| `--g-color-surface` | Fondo del zócalo pegado y del muelle |
| `--g-color-text` | Título, antetítulo |
| `--g-color-text-muted` | Descripción |
| `--g-color-border`, `--g-color-border-strong` | Borde del zócalo al pegarse |
| `--g-color-focus` | Anillo de foco del `hN` y del enlace del muelle |
| `--g-shadow-2` | Sombra del zócalo al pegarse |
| `--g-space-*` | Rellenos y separaciones |
| `--g-duration-fast`, `--g-duration-press`, `--g-duration-slow` | Duración de la entrada del muelle y del título compacto |
| `--g-ease-out`, `--g-ease-spring` | Curva del título compacto y del muelle |

## Alcance

- **En el tema oscuro por defecto, la banda de zona de marca en reposo no se separa de la página** (1,12:1 sin pegar; 1,86:1 y sombra al pegarse): límite aceptado por lima (DECISIONS #652), coherente con `tokens.md` §44.2; la propuesta para el usuario es un filo `inset` en `GPageHeader.css`. Medido en `design/lab/page-header/auditoria.md`.

- **Muelle dentro de `<dialog>`**: el encabezado detecta si está dentro de un diálogo y no pinta el muelle (la zona del pulgar del diálogo es de `GDialog`).

- **Pegado con ancestro que atrapa lo fijo** (aviso 8): `transform`, `translate`, `scale`, `filter`, `backdrop-filter`, `perspective`, `contain: layout/paint` o `will-change` en un ancestro hacen desaparecer el muelle. No es detectable en JS; el aviso solo se activa si el muelle no llega al borde inferior del visor.

## Verificación

- **Lector de pantalla en entorno real** no verificado (VoiceOver, NVDA).

- **Safari real y táctil** no verificados (WebKit se prueba con el motor de Playwright).

- **Motores:** `tests/page-header.spec.mjs` pasa en Chromium, Firefox y WebKit (2026-10-18, `design/lab/limitaciones/revision.md`).

- **Pendientes abiertos:** ninguno propio de este componente (los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md)).

## Fuentes

- Contrato: [`design/contracts/page-header.md`](../../../../../design/contracts/page-header.md)
- Decisiones: #626–#635 en [`DECISIONS.md`](../../../../../DECISIONS.md)
- API: [`GPageHeader.meta.json`](GPageHeader.meta.json)
- Auditoría de coco: [`design/lab/page-header/auditoria.md`](../../../../../design/lab/page-header/auditoria.md)
- Pruebas: [`GPageHeader.test.js`](GPageHeader.test.js) (28 pruebas, nivel `prueba`); Playwright [`design/lab/theme-playground/tests/page-header.spec.mjs`](../../../../../design/lab/theme-playground/tests/page-header.spec.mjs) (19 pruebas Chromium, nivel `medido`)
