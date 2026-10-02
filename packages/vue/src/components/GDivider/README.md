# GDivider

Línea de separación **entre grupos de contenido tuyos**, para cuando el espacio por sí solo no basta: horizontal entre bloques apilados, vertical entre grupos de acciones de una fila, con un texto corto centrado («O bien», «Ayer»), acortada por un inset que define la anfitriona, sutil o fuerte, y decorativa cuando un encabezado ya marca la separación. Es deliberadamente simple: no tiene estados, ni movimiento, ni densidad, ni márgenes propios, y nunca es enfocable.

**Etiqueta:** `<g-divider>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/divider/auditoria.md`](../../../../../design/lab/divider/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`, sección «GDivider»). Exige Vue `^3.5.0`.

> **Regla de uso: no sustituye al espacio.** Si dos secciones ya quedan claramente separadas por título + espacio, no hace falta una línea. Usa `GDivider` cuando la separación necesita una marca más (un cambio de tema entre párrafos, dos grupos de acciones en una barra, «O bien» entre dos formas de entrar), no por instinto entre cada bloque. El componente no lo puede imponer: es una guía.

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

### Horizontal entre bloques

```vue
<div class="pila">                       <!-- el aire lo pone el contenedor: display: flex; flex-direction: column; gap: … -->
  <p>El envío estándar llega en tres a cinco días hábiles.</p>
  <g-divider></g-divider>
  <p>Las devoluciones se aceptan durante 30 días.</p>
</div>
```

El divider **no tiene márgenes**: la separación con lo de arriba y lo de abajo es el `gap` (o el margen) de tu contenedor. La línea ocupa la caja de contenido del contenedor, sin sangrar sobre su relleno.

> **En plantillas dentro del HTML** (sin compilar), escribe `<g-divider></g-divider>`: Vue no admite etiquetas de componente autocerradas.

### Con texto (solo horizontal)

```vue
<g-btn variant="outline" block>Continuar con correo</g-btn>
<g-divider label="O bien"></g-divider>
<g-btn variant="outline" block>Continuar con un enlace mágico</g-btn>

<g-divider><template #label>Ayer</template></g-divider>   <!-- el slot label gana a la prop -->
```

- El texto va **centrado** entre dos líneas. Si es largo, **envuelve** (centrado) y cada línea conserva un mínimo de `space × 4`; nunca se recorta ni lleva «…».
- Es **contenido de frase** sin nada interactivo (un enlace o un botón dentro avisan). Si el texto **titula** lo que sigue («Ajustes avanzados»), usa un encabezado `hN`, no un divider: un separador no aparece en la navegación por encabezados.
- En vertical el texto se ignora (no se pinta) y avisa.

### Inset: `none`, `both` y `start`

```vue
<g-divider></g-divider>                 <!-- none (por defecto): la caja de contenido entera -->
<g-divider inset="both"></g-divider>    <!-- acorta los dos extremos -->
<g-divider inset="start"></g-divider>   <!-- acorta solo el inicio (a la derecha en RTL) -->
```

La **cantidad** del inset es el token `--g-divider-inset` (por defecto `space × 2`, 8px), el mismo para `both` y `start` y para las dos orientaciones. Lo define **la anfitriona**, que es quien conoce su relleno, su icono y su densidad; el divider solo lo hereda. Para alinear la línea con el texto de una lista con icono:

```vue
<nav class="carpetas" aria-label="Carpetas">
  <ul>
    <li><a href="/entrada"><IconoBandeja /> Entrada</a></li>
    <li><a href="/enviados"><IconoCorreo /> Enviados</a></li>
  </ul>
  <g-divider inset="start"></g-divider>   <!-- entre las dos listas, nunca dentro -->
  <ul>
    <li><a href="/proyectos"><IconoCarpeta /> Proyectos</a></li>
  </ul>
</nav>
```

```css
.carpetas {
  --pad: 12px; --icono: 16px; --sep: 8px;
  --g-divider-inset: calc(var(--pad) + var(--icono) + var(--sep));  /* la línea empieza donde el texto */
}
.carpetas[data-density="compact"] { --pad: 8px; --sep: 6px; }      /* la densidad la calcula la anfitriona */
```

Verificado: la línea empieza donde el texto (±1px) en `default` y `compact`, y termina donde el texto en RTL. Con `label`, el inset acorta la raíz entera (las dos líneas y el texto quedan dentro).

### Vertical entre grupos de acciones

```vue
<div class="barra" role="group" aria-label="Edición">   <!-- display: flex; align-items: center; gap: 8px -->
  <g-btn variant="ghost" icon aria-label="Editar"><IconoLapiz /></g-btn>
  <g-btn variant="ghost" icon aria-label="Compartir"><IconoCompartir /></g-btn>
  <g-divider orientation="vertical" inset="both"></g-divider>
  <g-btn variant="ghost" icon aria-label="Nuevo"><IconoMas /></g-btn>
  <g-divider orientation="vertical"></g-divider>
  <g-btn variant="ghost" icon aria-label="Buscar"><IconoBuscar /></g-btn>
</div>
```

> **Requisito:** el vertical debe ser **hijo directo de un contenedor flex en fila** (`display: flex` o `inline-flex` con `flex-direction: row` o `row-reverse`) **o de un grid**. Toma el alto de la fila estirándose (`align-self: stretch`), también si la fila centra a sus hijos (`align-items: center`). En un padre de bloque mide 0 de alto y en una columna flex se estira a lo ancho: en ambos casos avisa en desarrollo. No le pongas `height` ni `block-size: 100%`.

Medido con `GBtn` reales y el valor por defecto del token: sin inset mide el alto de la fila (**28 / 36 / 44px** en filas `sm` / `md` / `lg`); con `inset="both"` resta el inset arriba y abajo (**12 / 20 / 28px**). `inset="start"` no existe en vertical: se aplica `both` y avisa.

### Sutil y fuerte

```vue
<g-divider></g-divider>                       <!-- subtle (por defecto): refuerza una separación que ya dan el espacio o un título -->
<g-divider emphasis="strong"></g-divider>     <!-- strong: la línea es la única señal visual; ≥ 3:1 -->
<g-divider emphasis="strong" label="O bien"></g-divider>   <!-- afecta a las líneas, no al texto -->
```

Mismo grosor (`--g-border-width`) y dos tonos del neutro, **nunca un color semántico**. `subtle` (`--g-color-border`) es una línea discreta que **no llega a 3:1** a propósito: si la línea es lo único que separa dos grupos, usa `strong` (`--g-color-border-control`).

### Decorativo dentro de un diálogo

```vue
<g-dialog v-model="abierto" title="Cuenta" close-label="Cerrar">
  <div class="pila">
    <section><h3>Perfil</h3><p>Nombre, foto y zona horaria.</p></section>
    <g-divider decorative></g-divider>
    <section><h3>Seguridad</h3><p>Contraseña y sesiones abiertas.</p></section>
    <g-divider decorative></g-divider>
    <section><h3>Facturación</h3><p>Método de pago y facturas.</p></section>
  </div>
  <template #footer="{ close }"><g-btn @click="close">Listo</g-btn></template>
</g-dialog>
```

Cada sección ya tiene su encabezado, así que la línea no aporta estructura: `decorative` la saca del árbol de accesibilidad. Verificado en el `GDialog` real: la línea tiene **el mismo color** que la del pie del diálogo y no sangra fuera del cuerpo. Una línea de borde a borde entre secciones de una carcasa la dibuja la carcasa (`GDialog`, pie de `GCard`), no un `GDivider`.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `orientation` | String | `horizontal` `vertical` | `horizontal` |
| `label` | String | texto corto; solo horizontal (el slot `label` gana) | sin valor |
| `inset` | String | `none` `both` `start` (`start` solo horizontal; en vertical se aplica `both`) | `none` |
| `emphasis` | String | `subtle` `strong` | `subtle` |
| `decorative` | Boolean | `aria-hidden="true"` sin rol; con texto no cambia nada | `false` |

Un valor fuera de la lista muestra una advertencia en desarrollo. **Sin** `density`, `color`, `variant`, `size`, `as`, `rounded` ni grosor. El resto de atributos (`id`, `class`, `style`, `data-*`, `aria-label`/`aria-labelledby` de un separador que necesite nombre) van a la raíz.

## Eventos

Ninguno.

## Slots

| Slot | Contenido |
| --- | --- |
| `label` | Texto entre las dos líneas (contenido de frase, sin nada interactivo); dentro de `g-divider__label`; solo horizontal |

**No hay slot por defecto:** `<g-divider>O bien</g-divider>` no pinta el texto y avisa («usa `label` o el slot `label`»).

## Teclado

No aplica: el divider no es enfocable ni interactivo. Un `tabindex` tuyo llega a la raíz pero avisa (un separador enfocable es un *splitter*, otro componente).

## Semántica: separador o decorativo

| Caso | Elemento | Rol expuesto |
| --- | --- | --- |
| Horizontal | `<hr>` | `separator` (implícito, horizontal) |
| Horizontal, `decorative` | `<hr aria-hidden="true">` | fuera del árbol |
| Vertical | `<div role="separator" aria-orientation="vertical">` | `separator` vertical |
| Vertical, `decorative` | `<div aria-hidden="true">` | fuera del árbol |
| Horizontal con texto (con o sin `decorative`) | `<div>` + `<span class="g-divider__label">` | **ninguno**: el texto se lee como texto |

**Cuándo cada uno:**

- **Separador (por defecto)** cuando la línea es la **única** marca de que empieza otro grupo o tema (párrafos que cambian de tema sin título, dos grupos de acciones en una barra): un lector de pantalla anuncia la frontera (WCAG 1.3.1).
- **`decorative`** cuando un encabezado, el nombre de un grupo o el propio contenido ya dicen dónde empieza lo siguiente (secciones con `hN` en un diálogo o una página, grupos con título visible, un adorno bajo una cabecera): anunciar «separador» ahí sería ruido.
- **Con texto** la raíz nunca es `separator`: en WAI-ARIA un `separator` tiene hijos presentacionales y su nombre solo viene del autor, así que el texto podría no leerse. Por eso el texto queda como texto y las líneas son `::before`/`::after`, que no entran en el árbol.

## Accesibilidad

- **Árbol** (medido en el playground con Chromium, Firefox y WebKit): 17 separadores, **ninguno con nombre**; ningún divider con texto lleva rol; los decorativos del diálogo, fuera del árbol; ninguno es enfocable.
- **Contraste medido** sobre `surface` y `surface-sunken`, en claro y oscuro, con el tema por defecto, el «Tema de prueba» del playground, un tema con `space` 5 y borde 2px y los diez temas generados por el CLI (incluidos **Spotify**, de marca pálida, y **lustre**): `strong` **≥ 3.19:1** (por defecto 3.45 / 3.19 en claro, 4.32 / 4.82 en oscuro); texto **≥ 5.94:1** (por defecto 7.46 / 6.90 en claro, 8.59 / 9.59 en oscuro). `subtle` mide 1.17 a 1.34:1 por diseño (no es la única señal). Una marca pálida no cambia nada: línea y texto se derivan del neutro.
- **Texto:** rol `body-sm` (14px en el tema por defecto) en `--g-color-text-muted`; sin fondo, así la línea nunca pasa por debajo y vale sobre superficie, superficie hundida o cristal.
- **`prefers-contrast: more`:** todas las líneas pasan a `--g-color-border-control` (≥ 3:1, también `subtle`) y el texto a `--g-color-text` (17.4 / 16.1:1 en claro). Emulado en los tres motores.
- **Colores forzados:** las líneas son **bordes**, nunca fondos, y pasan a `CanvasText` (`<hr>`, `::before`, `::after` y vertical; 21:1 medido por píxeles). Emulado en Chromium.
- **Zoom y escalas:** comprobado por píxeles a 1×, 1.25×, 1.5× y 2×, zoom del navegador 125 / 150 / 200 % y zoom CSS 150 / 200 %: la línea de 1px siempre se pinta, en una sola franja (no desaparece ni se duplica), y `strong` conserva 3.45:1 a escala entera. A 125 % el motor puede repartir la línea entre dos filas de píxeles con antialias (pasa con cualquier borde de 1px).
- **RTL:** automático por propiedades lógicas y flex, sin prop: `start` acorta por la derecha, el texto sigue centrado y los verticales conservan su alto. Verificado con `dir="rtl"` en la página y local.
- **320px:** sin desborde en LTR, RTL, oscuro y con Spotify; el texto largo envuelve y las líneas conservan su mínimo.

## Tema

| Token | Por defecto | Qué es |
| --- | --- | --- |
| `--g-divider-inset` | `calc(var(--g-space-1) * 2)` (8px) en `:root` | Cuánto acorta la línea `inset="both"` (cada extremo) e `inset="start"` (el inicio), en las dos orientaciones. **Se hereda:** redefínelo en la anfitriona (`.mi-lista { --g-divider-inset: … }`) y gana por cercanía. No es de color (no se repite en el oscuro) ni se multiplica por densidad |

```css
:root {
  --g-border-width: 2px;              /* grosor de todas las líneas */
  --g-color-border-control: #8a6d4b;  /* strong: debe llegar a 3:1 sobre surface y surface-sunken */
  --g-space-1: 5px;                   /* inset por defecto (10px), separación texto ↔ línea y mínimo de línea escalan */
}
```

Consume además `--g-border-width`, `--g-color-border` (`subtle`), `--g-color-border-control` (`strong` y `prefers-contrast: more`), `--g-color-text-muted` (texto), `--g-color-text` (texto con `prefers-contrast: more`), `--g-text-body-sm-{size|line|weight|tracking}`, `--g-font-ui` y `--g-space-1` (separación texto ↔ línea `space × 3` y mínimo de cada línea `space × 4`, que no escalan con densidad). Verificado con un tema de `space` 5 y borde 2px: inset 10px, líneas de 2px y verticales de 15 / 25 / 35px con inset en filas `sm` / `md` / `lg`.

## Clases

`g-divider` · `g-divider--orientation-{horizontal|vertical}` · `g-divider--inset-{none|both|start}` (el valor **efectivo**: `start` en vertical → `both`) · `g-divider--emphasis-{subtle|strong}` · `g-divider--labeled` (con texto, solo horizontal) · `g-divider__label` (el `<span>` del texto). `decorative` no tiene clase: se expresa con `aria-hidden`.

## Dónde no va

- **Dentro de una lista** (`<ul>`, `<ol>`, `role="list"`): una lista solo admite `listitem`. Parte la lista en dos y pon el divider **entre** ellas (ver el ejemplo de inset). Avisa en desarrollo.
- **Dentro de `GMenu`** (o de un `menu`, `menubar`, `listbox` o `tablist`): usa el separador propio del menú (`{ type: 'separator' }`). Avisa en desarrollo.
- **Entre `GFormSection`:** las secciones se separan por espacio (`--g-form-section-gap`) y su título. La línea entre secciones está reservada para la Fase 3 como prop de `GFormSection`; un `GDivider` a mano entre secciones rompe el ritmo (81px dentro de `GForm`, 1px fuera).
- **Como borde de una carcasa** (de lado a lado de un diálogo o una tarjeta): lo dibuja la carcasa.
- **Como panel redimensionable:** eso es un *splitter*, no un divider.

## Avisos de desarrollo

Solo en desarrollo (`process.env.NODE_ENV !== 'production'`), una vez por instancia y motivo, con el prefijo `[Grana GDivider]`:

1. Vertical sin padre flex en fila o grid (mira el primer ancestro que no sea `display: contents`).
2. Hijo de `ul`, `ol`, `menu` o de un `role` `list`, `menu`, `menubar`, `listbox` o `tablist`.
3. `label` o slot `label` en vertical (no se pinta).
4. `inset="start"` en vertical (se aplica `both`).
5. Contenido interactivo en el texto.
6. `tabindex` tuyo en el divider.
7. Contenido en el slot por defecto (no se pinta).

## Limitaciones conocidas

- **Vertical con un inset de anfitriona mayor que la mitad del alto de la fila** (DECISIONS #194): el inset se resta dos veces, así que si tu anfitriona define un `--g-divider-inset` mayor que la mitad del alto de contenido de su fila, un vertical con `inset="both"` **mide 0 y desaparece sin aviso** (sigue en el árbol como separador). Elige un valor que deje línea en tu fila **más baja** (densidad `compact`, `GBtn` `xs`/`sm`). El valor por defecto (8px) deja 8px en una fila `xs` (24px) y 12px en `sm`.
- **Fila que envuelve** (`flex-wrap`): un vertical puede quedar al principio o al final de una línea, separando nada. Sin aviso en v0.1.
- **`subtle` como única señal:** es un mal uso que el componente no puede detectar; usa `strong`.
- **Sin verificar:** lector de pantalla real (VoiceOver, NVDA, TalkBack: si anuncian «separador» en el `<hr>` y en el vertical, si VoiceOver los omite, cómo se lee el texto entre líneas); `forced-colors` real de Windows (solo emulado en Chromium); `prefers-contrast` con un tema de alto contraste real.

## Fuentes

- API: [`GDivider.meta.json`](./GDivider.meta.json) · Contrato: [`design/contracts/divider.md`](../../../../../design/contracts/divider.md) · Prototipo: [`design/lab/divider/r01/`](../../../../../design/lab/divider/r01/) · Estilo: [`design/lab/divider/estilo.md`](../../../../../design/lab/divider/estilo.md) · Auditoría: [`design/lab/divider/auditoria.md`](../../../../../design/lab/divider/auditoria.md)
