# GAppShell

Chasis de aplicación: reparte el visor entre la cabecera, la navegación (`GSidebar`), la región principal y el pie, con sus puntos de referencia y su enlace de salto. Reserva el sitio de la navegación **leyendo su forma por CSS** y escribe **una sola vez** la cifra de la cabecera para todo lo que se pega debajo. **No navega, no pide datos, no abre el menú del drawer por su cuenta, no trae color propio** (lo pone el tema).

**Etiqueta:** `<g-app-shell>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/app-shell/auditoria.md`](../../../../../design/lab/app-shell/auditoria.md)) · **Entrada propia:** `@grana/vue/app-shell` (global UMD `GranaAppShell`) · **Desde:** 0.1.0

```js
import GranaAppShell from '@grana/vue/app-shell'
```

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio. Exige Vue `^3.5.0`.

> **Un solo chasis por documento, y no dentro de un `<dialog>`.** Dos chasis duplican el `main` (aviso 2); dentro de un diálogo no publica bordes ni escribe la cifra (aviso 7). El chasis ocupa el visor: se usa en la raíz de la aplicación, no en un trozo de página.

## En esta página

[§ Uso](#uso) · [§ Ejemplos](#ejemplos) · [§ API](#props) · [§ Teclado y foco](#teclado-y-foco) · [§ Accesibilidad](#accesibilidad) · [§ Personalidad](#personalidad) · [§ Tema](#tema) · [§ Alcance](#alcance) · [§ Verificación](#verificación)

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import GranaAppShell from '@grana/vue/app-shell'
import GranaPageHeader from '@grana/vue/page-header'
import '@grana/vue/style.css'

createApp(App).use(Grana).use(GranaAppShell).use(GranaPageHeader).mount('#app')
```

```vue
<!-- Fragmento: `destinos`, `MiMarca` y `MiBuscador` son de tu aplicación -->
<script setup>
import { ref } from 'vue'

const actual = ref('muestras')
const sidebarMovil = ref(false)
const nav = ref(null)
</script>

<template>
  <GAppShell :labels="{ skip: 'Saltar al contenido' }">
    <template #header>
      <GBtn v-if="sidebarMovil" icon="menu" aria-label="Abrir la navegación" variant="ghost" color="neutral" @click="nav.open()" />
      <MiMarca />
      <MiBuscador />
    </template>
    <template #nav>
      <GSidebar
        ref="nav"
        v-model="actual"
        :items="destinos"
        label="Principal"
        @mode-change="sidebarMovil = $event.mode === 'drawer'"
      />
    </template>

    <GContainer>
      <GPageHeader title="Muestras" :labels="{ actions: 'Acciones de la página' }" />
      <GStack gap="lg">
        <GSection title="Pendientes">…</GSection>
        <GSection title="Validadas">…</GSection>
      </GStack>
    </GContainer>

    <template #footer>…</template>
  </GAppShell>
</template>
```

Sin receta de cabecera: ni `--g-page-header-top`, ni `--g-accordion-sticky-top`, ni `scroll-padding-block-start`, ni `offset.top` en `GStatusIsland`, `GToaster` o un `GFab` de arriba. El chasis ya los resuelve (#713, #714). `mode-change` solo hace falta para lo que decidas tú (el botón de menú del drawer), no para reservar sitio.

> **En plantillas dentro del HTML** (sin compilar), escribe `<g-app-shell ...></g-app-shell>`: Vue no admite etiquetas de componente autocerradas.

## Ejemplos

### e1 · La aplicación entera: cabecera, navegación, página y pie

El ejemplo siguiente es una reducción: el chasis real ocupa el visor, así que en esta página se monta dentro de un marco con altura fija y sin la navegación fija al visor. El banco completo, con cabecera, `GSidebar`, `GPageHeader`, bandas `g-bleed`, isla de estado y avisos, es [`packages/vue/playground/app-shell.html`](../../../playground/app-shell.html).

```vue demo
<script setup>
import { ref } from 'vue'
const actual = ref('inicio')
const items = [
  { id: 'inicio', label: 'Inicio', href: '#inicio', icon: 'house' },
  { id: 'muestras', label: 'Muestras', href: '#muestras', icon: 'chart-column' },
  { id: 'ajustes', label: 'Ajustes', href: '#ajustes', icon: 'settings' }
]
const textos = { collapse: 'Contraer la barra lateral', expand: 'Expandir la barra lateral', more: 'Más', moreActive: 'contiene la página actual', drawer: 'Navegación', close: 'Cerrar' }
const navegar = ({ item, event }) => { event.preventDefault(); actual.value = item.id }
</script>
<template>
  <div style="position: relative; block-size: 360px; overflow: auto; transform: translateZ(0); border: 1px solid var(--g-color-border)">
    <GAppShell :labels="{ skip: 'Saltar al contenido' }" style="min-block-size: 360px">
      <template #header>
        <strong>Laboratorio central</strong>
      </template>
      <template #nav>
        <GSidebar v-model="actual" :items="items" label="Principal" :labels="textos" mode="rail" @navigate="navegar" />
      </template>
      <GContainer as="div" width="md">
        <GStack gap="md">
          <GSection title="Pendientes" description="Muestras que esperan resultado.">
            <p>Página actual: {{ actual }}</p>
          </GSection>
        </GStack>
      </GContainer>
      <template #footer>
        <small>Pie de la aplicación</small>
      </template>
    </GAppShell>
  </div>
</template>
```

**Por qué así:** es el caso de toda aplicación con navegación lateral. Úsalo una vez, en la raíz. No lo uses para una página suelta sin navegación ni cabecera: `GContainer as="main"` basta (ver [`GContainer`](../GContainer/README.md)).

> Este ejemplo vive en un marco con `transform` para que la navegación, que en el chasis real es fija al visor, quede dentro del marco. Eso solo vale para la documentación: **en tu aplicación, ningún antepasado del chasis lleva `transform`, `filter` ni `contain`** (atraparían lo fijo, ver «Alcance»).

### e2 · Lectura larga: la cabecera cede el borde (`header="relay"`)

```vue
<!-- Fragmento: `destinos`, `MiMarca` y `secciones` son de tu aplicación -->
<GAppShell header="relay" :labels="{ skip: 'Saltar al contenido' }">
  <template #header><MiMarca /></template>
  <template #nav>
    <GSidebar v-model="actual" :items="destinos" label="Principal" />
  </template>
  <GContainer>
    <GPageHeader title="Política de validación" :labels="{ actions: 'Acciones de la página' }">
      <template #tabs>
        <GTabs id="politica" v-model="seccion" :items="secciones" detached label="Secciones" />
      </template>
    </GPageHeader>
    …
  </GContainer>
</GAppShell>
```

**Por qué:** con `header="relay"` la cabecera de la aplicación y el encabezado de la página **se pasan el borde**. Al bajar leyendo con el zócalo de `GPageHeader` pegado, la cabecera sale por arriba y el zócalo sube a 0; al subir, al volver arriba o al entrar el foco en la cabecera, vuelve. Recupera 56 px de lectura (más del 20 % en un teléfono apaisado) sin perder el título ni las acciones. **Úsalo para lectura larga** (documentos, políticas, informes), no para paneles de trabajo en los que quieres la cabecera siempre a mano.

**Sin zócalo pegado, B no hace nada:** si no hay `GPageHeader` con zócalo (pestañas), si tiene `sticky: false` o si la regla del cuarto lo despegó, la cabecera no cede y B equivale a `pinned`. Nunca queda la pantalla sin franja.

### e3 · Cabecera de marca

```vue
<!-- Fragmento: `MiMarca` es de tu aplicación -->
<GAppShell header-zone="brand" :labels="{ skip: 'Saltar al contenido' }">
  <template #header><MiMarca /></template>
  …
</GAppShell>
```

`headerZone="brand"` pone `data-g-zone="brand"` en el `header` del chasis (la banda entera), nunca en la raíz (pintaría la página) ni en `<html>`. Lo que vive dentro (botones, buscador) hereda la zona. Para la navegación de marca, `data-g-zone="brand"` va en `<GSidebar>` (los atributos llegan a su raíz); su comportamiento con `drawer` no está verificado (ver «Verificación»).

### e4 · Migrar la receta manual de «Cabecera fija»

Antes, cada aplicación escribía la cifra de la cabecera, el `scroll-padding` y el `offset.top` de la isla y los avisos (receta de [`api.md`](../../../../../docs/contract/api.md) «Cabecera fija»). Con el chasis, se borra:

```css
/* Antes: ya no hace falta con GAppShell */
:root {
  --app-header: 56px;
  --g-page-header-top: var(--app-header);
  --g-accordion-sticky-top: var(--app-header);
  scroll-padding-block-start: calc(var(--app-header) + max(var(--g-space-12), 44px));
}
```

Pasos: (1) envuelve la aplicación en `GAppShell` y mueve tu barra al slot `header` y tu `GSidebar` al slot `nav` (hijo directo); (2) borra la receta de arriba; (3) quita `offset.top` de `GStatusIsland`, `GToaster` y de un `GFab` de arriba; (4) si tu cabecera mide más que `max(space × 14, 44px)` (56 px con `space` 4), declara **en `:root`** `--g-app-shell-header: 72px` (la longitud real); (5) cambia `GContainer as="main"` por el `GContainer` normal (`as="div"`): el chasis ya pone el `main`. Si dejas tu receta sin capa, sigue ganando pero se contaría dos veces: el chasis lo avisa (aviso 10).

**La voz es la excepción:** la pastilla de `GSpeechHost` no lee las reservas de borde (#322), así que sigue necesitando su `offset.top` con el alto de la banda, o la lectura de `--g-app-shell-top`. La isla sí suma bien debajo de la voz.

## Props

| Prop | Tipo | Valores | Default | Descripción |
| --- | --- | --- | --- | --- |
| `header` | `String` | `'pinned'` `'relay'` | `'pinned'` | Comportamiento de la cabecera al desplazar. `relay` = B · Relevo de franja: cede el borde al zócalo pegado de `GPageHeader` al bajar y vuelve al subir, sin zócalo pegado o con el foco en la cabecera. Fuera de lista: aviso 9 y `pinned` |
| `headerZone` | `String` | `'none'` `'brand'` | `'none'` | Zona de marca de la banda de cabecera: `brand` pone `data-g-zone="brand"` en el `header`, nunca en la raíz. Fuera de lista o sin slot `header`: aviso 8 y `none` |
| `labels` | `Object` | `{ skip }` | `{}` | `skip`: texto del enlace «Saltar al contenido». **Obligatorio** (aviso 1); vacío o solo espacios cuenta como ausente. Sin valores por defecto (#226): ponlo siempre |
| `id` | `String` | | generado (SSR-seguro) | Base de ids: `{id}-main` es el destino del salto |

## Eventos

`GAppShell` no emite eventos. El estado de la cabecera (pegada, despegada, cedida) no es un suceso del usuario; las piezas de dentro emiten los suyos (`mode-change` de `GSidebar`, `navigate` de `GBreadcrumbs`…).

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `header` | — | Marca, buscador, cuenta, el botón de menú del drawer. Va dentro de la banda de alto fijo (más alto: aviso 6, declara `--g-app-shell-header` en `:root`). Sin `GPageHeader` aquí: el encabezado de página va en `main` |
| `nav` | — | Un `GSidebar`, **hijo directo** de la raíz (un envoltorio: aviso 4; `contained`: aviso 5) |
| `default` | — | La página (`GContainer`, `GPageHeader`, `GStack`…) dentro del `main` único del chasis. Ningún `main` dentro (aviso 3) |
| `footer` | — | Pie de la aplicación, fuera de `main` (`contentinfo`) |

## Métodos

`GAppShell` no expone métodos. Para llevar el foco al cambiar de ruta, usa `GPageHeader.focus()`.

## Teclado y foco

| Tecla / elemento | Efecto |
| --- | --- |
| Tab (la primera) | Enfoca el enlace «Saltar al contenido». Es el primer enfocable del documento y solo se ve con foco |
| Intro (o clic primario sin modificadores) en el enlace de salto | Enfoca `main` con `preventScroll` y lo coloca al inicio respetando el `scroll-padding`. No cambia `location.hash`; con modificadores o botón central lo hace el navegador |
| Tab después del salto | Cae en el primer enfocable de la página |
| Av Pág, Re Pág, Espacio, ↑ y ↓ | Desplazan el documento (el chasis desplaza `<html>`, no una caja) |
| Tab hacia la cabecera cedida (B) | La cabecera vuelve **antes** de que el foco se pinte (`focusin`; 2.4.11) |

El chasis no es enfocable y **no mueve el foco por su cuenta** (salvo el salto). Enfocar algo pegado (la banda, el sidebar, el zócalo, una acción del zócalo) no desplaza la página (S1). **En Safari/WebKit, el enlace de salto necesita Opción+Tab** (o activar «Pulsar Tab para resaltar cada elemento» en las preferencias del navegador): por defecto el Tab no llega a los enlaces (S7). No se cambia por un botón: es navegación.

## Accesibilidad

a. Landmarks: `banner` (solo con slot `header`), `navigation` (el de `GSidebar`, con su `label`), un solo `main` y `contentinfo` (solo con slot `footer`) fuera de `main`. El chasis no añade `role` ni `aria-label`. Verificado con el árbol de accesibilidad en los tres motores (nivel `medido`, auditoría de coco 2026-10-21, 900/900).

b. Enlace de salto (2.4.1): primer enfocable, visible solo con foco (`translate`, no `display` ni `visibility`), ≥ 24 px de alto (≥ 44 con `pointer: coarse`), anillo ≥ 3:1 y texto ≥ 4,5:1 en 14 temas (`medido`, 900/900).

c. Orden del DOM = lectura = Tab: salto → cabecera → navegación → página → pie (1.3.2, 2.4.3). Ni `order` ni `grid-area` reordenan.

d. Presupuesto del cuarto (1.4.10): lo pegado arriba (banda + zócalo) no pasa del 25 % del visor pequeño. 1440×900 y 800×430, pegada; 800×400 y 320×256 (≈ zoom 400 %), despegada con 48 px (19 %); sin desplazamiento horizontal (`medido`, 900/900).

e. Foco no tapado (2.4.11) y S1: con la página desplazada 1200 px, enfocar el botón de contraer, un enlace del sidebar, los botones de la banda, las acciones del zócalo y la pestaña del zócalo (y Mayús+Tab) mueve la página 0 px, con `pinned` y con `relay` (`medido`, 900/900).

f. Sin anuncios propios: pegarse, despegarse y ceder la franja son consecuencia del desplazamiento (4.1.3 no aplica).

g. Contraste: texto de la banda, iconos de sus botones (≥ 3:1), pie `text-muted` (≥ 4,5:1) y zona de marca en la banda, en 14 temas (7 × claro/oscuro) con y sin zona (`medido`). El borde de la banda contra la página mide 1,17–1,19:1: es una separación decorativa sobre una banda opaca; en `forced-colors` la da un borde real.

h. `forced-colors`: borde real `solid` en la banda y el pie, y el salto conserva su anillo (`medido` solo en Chromium).

i. RTL: sidebar en el borde derecho, página a su izquierda, `g-bleed` a los dos bordes, salto al inicio (`medido`).

j. Movimiento reducido (2.3.3): A sin espera, B sin cuadros intermedios (`medido`).

> **Peligro.** Un `<GSidebar>` envuelto en un `div` de tu aplicación, o con `contained`, rompe la reserva: el sidebar mediría su propia pista y caería al formato móvil, sin lugar para la página. El slot `nav` lleva el `GSidebar` como hijo directo (avisos 4 y 5 en desarrollo). Igual de peligroso es declarar `--g-app-shell-header` en el chasis o en un ancestro que no sea `:root`: el `scroll-padding` vive en `<html>` y no lo ve (aviso 11).

## Personalidad

Un chasis que **lee la forma de la navegación en lugar de escucharla**: la reserva sale de las clases públicas de `GSidebar` con `:has()`, así que es correcta en el primer pintado (SSR) y en cada cambio de formato, sin eventos ni medidas. Escribe una vez la cifra de la cabecera para todos y **se despega solo cuando lo pegado ya no cabe** (zoom 400 %, teléfono apaisado).

**A · Cortina (por defecto, sin API).** Al contraer, la página se ensancha al instante y el riel se encoge **sobre** ella; al expandir, el sidebar crece sobre la página y la página se aparta **una sola vez**, cuando ya la cubre (tras `--g-duration-slow`, acoplada al ancho de `GSidebar`). Un reflujo por cambio en vez de quince cuadros; es interrumpible desde cualquier punto. Durante ese tiempo el sidebar tapa los primeros píxeles de la página: es lo buscado.

**B · Relevo de franja (`header="relay"`).** Banda y cifra con `--g-duration-fast` y `--g-ease-out` (sin `--g-ease-spring`, #299: no es una entrada de forma). Cede tras bajar `space × 4` seguidos y vuelve al subir `space × 4`, al llegar arriba, al entrar el foco o al pasar a `pinned`.

Con `prefers-reduced-motion: reduce`: A sin espera y B instantáneo, sin deslizarse; el enlace de salto aparece sin `translate`.

## Tema

El chasis no escribe color. Lee los tokens existentes; ninguno es nuevo.

| Token | Qué controla |
| --- | --- |
| `--g-app-shell-header` | **Propiedad de entrada pública** (longitud; no del tema): alto de tu cabecera si mide más que `max(space × 14, 44px)`. Se declara en `:root`. `0px` por defecto |
| `--g-app-shell-top` | **Publicada, solo lectura:** lo que la cabecera ocupa arriba mientras está pegada (0 sin cabecera, despegada o cedida). Puedes leerla; nunca escribirla |
| `--g-page-header-top`, `--g-accordion-sticky-top` | Las **escribe el chasis** (entradas públicas de `GPageHeader` y `GAccordion`) |
| `--g-sidebar-width`, `--g-sidebar-rail`, `--g-sidebar-bar` | Pista de la navegación según su forma |
| `--g-color-bg`, `--g-color-surface` | Fondo de la página y del enlace de salto |
| `--g-color-text`, `--g-color-text-muted` | Texto de la banda y del pie |
| `--g-color-border`, `--g-color-border-strong` | Borde de la banda y del pie; borde del enlace de salto |
| `--g-color-focus`, `--g-focus-width`, `--g-focus-offset` | Anillo del enlace de salto |
| `--g-shadow-2`, `--g-radius-md`, `--g-border-width`, `--g-space-*` | Enlace de salto y rellenos |
| `--g-font-ui`, `--g-text-body-sm-*`, `--g-text-action-weight` | Tipografía del pie y del enlace de salto |
| `--g-duration-fast`, `--g-duration-slow`, `--g-ease-out` | Movimiento de B y espera de A |

## Alcance

- **C · Escenario** (`appearance="stage"`): reservada (#708). No existe la prop `appearance`.
- **Un `toggleNav` en el ámbito del slot `header`**, evento o método de pegado o de relevo, y un presupuesto inferior para el navbar: reservados, sin API hoy.
- **No hay `mode`, `collapsed`, `sidebarWidth`, `stickyOffset`, `headerHeight` ni `scrollContainer`**: son de `GSidebar` o del CSS (#711).
- **El marco recorta lo horizontal** (`overflow-x: clip`): una banda que sangre más allá del marco se corta. El chasis desplaza el documento, no una caja.
- **La pastilla de la voz no lee las reservas** (S4, #322): lleva su `offset.top`.
- **Pegado con ancestro que atrapa lo fijo:** `transform`, `translate`, `scale`, `filter`, `backdrop-filter`, `perspective`, `contain` (layout o paint) o `will-change` en un antepasado del chasis hacen que el sidebar fijo y el muelle de `GPageHeader` dejen de seguir al visor.
- **Navbar a 320×256:** el presupuesto solo cuenta arriba; el navbar fijo tapa 68 px abajo (27 % del visor). Se valora en `GSidebar`, no en el chasis (S9).
- **Contrato entre componentes:** el chasis lee las clases públicas de `GSidebar` (`g-sidebar--mode-expanded`, `--mode-rail`, `--mode-navbar`, `--overlay`, `--variant-floating`, `--contained`, `g-sidebar__drawer` e `is-ready`) y `.g-page-header.is-sticky`. Renombrarlas es un cambio de contrato.
- **Peso:** `@grana/vue/app-shell` pesa **3 898 B gzip** (`medido` por bruno el 2026-10-21; tope de 4096 B, #716). `edgeReserve` y la clave del canal llegan por `__shared`, sin copia.

## Verificación

- **Motores:** `design/lab/app-shell/auditoria-verificar.mjs` sobre el componente real: **900/900** en Chromium (302), Firefox (299) y WebKit (299), con 14 temas y la zona de marca (`medido`, coco, 2026-10-21).
- **Pruebas de bruno:** `GAppShell.test.js` (24 pruebas, nivel `prueba`) y los specs `app-shell.spec.mjs` y `app-shell-perf.spec.mjs` en los tres motores. El lote `app-shell`, `app-shell-perf`, `container` y `stack-section` da 196 pasan y 2 omitidos por diseño (`forced-colors` solo en Chromium). El perf mide que desplazar no vuelve a pintar el chasis (3/3 por motor).
- **No verificado:** lector de pantalla real (VoiceOver, NVDA), móvil y táctil reales, zoom real del navegador, `forced-colors` en Firefox y WebKit, restauración del desplazamiento e impresión, zona de marca en `GSidebar` con `drawer`, y el coste de `:root:has(.g-app-shell …)` en una página muy grande.
- **Pendientes abiertos:** de este componente, S2 (`overlay` de `GSidebar` fuera del chasis), S8 (foco del drawer en WebKit), S9 (navbar a 320×256) y S11 (banco del playground sin guarda de `scroll-behavior`); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md) §6.

## Fuentes

- Contrato: [`design/contracts/app-shell.md`](../../../../../design/contracts/app-shell.md)
- Decisiones: #708–#718 y remates #746–#750 en [`DECISIONS.md`](../../../../../DECISIONS.md)
- API: [`GAppShell.meta.json`](GAppShell.meta.json)
- Auditoría de coco: [`design/lab/app-shell/auditoria.md`](../../../../../design/lab/app-shell/auditoria.md)
- Pruebas: [`GAppShell.test.js`](GAppShell.test.js) (24 pruebas, nivel `prueba`); Playwright [`design/lab/theme-playground/tests/app-shell.spec.mjs`](../../../../../design/lab/theme-playground/tests/app-shell.spec.mjs) y [`app-shell-perf.spec.mjs`](../../../../../design/lab/theme-playground/tests/app-shell-perf.spec.mjs)
- Banco: [`packages/vue/playground/app-shell.html`](../../../playground/app-shell.html) (`?header=relay` para B)
