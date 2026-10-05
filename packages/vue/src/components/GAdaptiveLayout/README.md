# GAdaptiveLayout

Un **contenedor sin superficie** que reparte a sus hijos directos en líneas contiguas, **en el orden del DOM**, según lo que cada uno necesita (la palabra más larga de su etiqueta, el dominio de un número, las opciones de una lista, el «chrome» del control) y el ancho disponible. No pide filas, columnas, mínimos en píxeles ni breakpoints. Un campo corto **conserva su ancho** aunque quede solo en su línea; el aire sobrante queda al final de la línea.

No es masonry, no ordena por relevancia, no tiene superficie, semántica de formulario, teclado ni movimiento propios, y no promete proporciones exactas cuando chocan con la legibilidad. Los nodos nunca se mueven: cambiar el ancho recoloca por CSS.

**Etiqueta:** `<g-adaptive-layout>` · **Estado:** `candidate` (auditoría de coco, ronda 2, sin defectos bloqueantes; ver [`design/lab/adaptive-layout/auditoria-coco.md`](../../../../../design/lab/adaptive-layout/auditoria-coco.md)) · **Desde:** 0.1.0 · **Entrada:** paquete principal `@grana/vue`

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (banco [`playground/adaptive-layout.html`](../../../playground/adaptive-layout.html) y sección `GAdaptiveLayout` del playground, `#sec-adaptive`). Es **opt-in**: no cambia `GFormLayout`, `GFormRow` ni sus reglas.

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')   // install registra <g-adaptive-layout> / <GAdaptiveLayout>
```

También se puede importar solo el componente: `import { GAdaptiveLayout } from '@grana/vue'`.

```vue
<script setup>
import { ref } from 'vue'
const calle = ref(''), exterior = ref(null), interior = ref(null)
</script>

<template>
  <!-- Caso común: sin pistas. Calle larga; Exterior e Interior compactos por su rango entero -->
  <GAdaptiveLayout>
    <GInput v-model="calle" name="calle" label="Calle" />
    <GNumberField v-model="exterior" name="exterior" label="Exterior" steppers
      :min="0" :max="9" :precision="0" />
    <GNumberField v-model="interior" name="interior" label="Interior" steppers
      :min="0" :max="9" :precision="0" />
  </GAdaptiveLayout>
</template>
```

A 460 px, con el tema por defecto, Calle ocupa la primera línea y los dos números comparten la segunda, conservando sus botones −/+; nunca tres campos cortos a ancho completo (comprobado en los tres motores). Esa composición sale de los perfiles, no de un nombre de campo programado: con otras etiquetas, otra fuente u otro dominio numérico la partición válida puede ser otra.

> **En plantillas dentro del HTML** (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-input ...></g-input>`.

## Cuándo usarlo (y cuándo no)

`GFormLayout` + `GFormRow` siguen siendo la distribución **por defecto de un formulario**: el consumidor declara qué va junto y cada línea llena el ancho. `GAdaptiveLayout` es para cuando el consumidor no puede o no quiere declarar las filas.

| Necesidad | Usar | No usar |
| --- | --- | --- |
| Formulario cuyos grupos conoces (Nombre · Apellido; Calle · Ext. · Int.; signos vitales) | **[`GFormLayout`](../GFormLayout/README.md) + [`GFormRow`](../GFormRow/README.md)**: filas explícitas, cada línea llena el ancho | `GAdaptiveLayout` por costumbre: deja aire al final de la línea, justo lo que `GFormRow` evita |
| Contenido **mixto** (avatar, ficha, datos, campos, tabla) en una sola composición | **`GAdaptiveLayout`** | Anidar `GFormRow` con clases `g-form-w-*` adivinadas para piezas que no son campos |
| Campos que **no conoces de antemano** (formulario generado desde un esquema, filtros configurables) | **`GAdaptiveLayout`**, con una pista en el hijo solo en las excepciones, derivada del esquema | Calcular filas en la aplicación |
| Un campo corto que debe **conservar su ancho** aunque quede solo en su línea | **`GAdaptiveLayout`** | Un campo `xs` suelto en `GFormLayout` (se estira) |
| Una pregunta compuesta con una etiqueta por parte | [`GFieldGroup`](../GFieldGroup/README.md), como bloque | Un `GAdaptiveLayout` anidado en lugar de `fieldset`/`legend` |

**Convivencia:**

- **No va dentro de una `GFormRow`** (aviso de desarrollo). Una `GFormRow`, un `GFieldGroup`, un `GFormLayout` o cualquier hijo con varios controles **dentro** de un `GAdaptiveLayout` es un **bloque de línea completa**.
- **Dentro de una `GFormSection`**, va en el `GFormLayout` del cuerpo, como cualquier distribución.
- **Mezclar las dos políticas es válido por bloques:** un `GFormLayout` puede tener filas `GFormRow` y, como otro hijo, un `GAdaptiveLayout`.
- No comparte el motor de decisión con `GFormRow`: comparte el observador y el canal de mínimos intrínsecos (`setIntrinsicMin`); la política de `GFormRow` no cambia.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `horizontal` | String | `start` `center` `end` | `start` |
| `vertical` | String | `top` `center` `bottom` | `top` |
| `gap` | String | `none` `sm` `md` `lg` | `md` |
| `density` | String | `default` `comfortable` `compact` | la del contexto de distribución, la de `GForm` o `default` |

Un valor fuera de la lista muestra la advertencia de Vue. Los valores anteriores (`left`, `right`, `default`, `small`, `large`) **ya no existen**, y tampoco la prop `hints`: no hay alias de compatibilidad.

- **`horizontal`** coloca la línea cuando sus hijos no la llenan (todos saturan en su máximo). Es **lógico**: en RTL, `start` es la derecha y `end` la izquierda. Nunca cambia el orden del DOM ni el de lectura.
- **`vertical`** alinea los hijos genéricos dentro de su línea y, si el contenedor tiene alto sobrante, coloca el conjunto de líneas arriba, al centro o abajo. Sin alto sobrante no inventa alto. Con alto fijo menor que el contenido, `center` y `bottom` no dejan contenido inalcanzable (`safe center`, `safe end`; hallazgo 2 de la auditoría). En campos con pistas compartidas (ver «Alineación de compañeros») manda la alineación de cajas, no el centrado de cada raíz.
- **`gap`** multiplica las dos separaciones de formulario (en línea y entre líneas), después de la densidad: `none` 0, `sm` 0,5, `md` 1, `lg` 2.
- **`density`** aplica 1 · 0,875 · 0,75 a las separaciones y se **re-provee** a los campos de dentro, como `GFormLayout`.

Los atributos (`id`, `class`, `style`, `lang`, `dir`, `aria-*`) van a la raíz.

## Pistas en el hijo

Solo las **excepciones** necesitan una pista, y va **en el propio hijo directo**, como el tamaño de un hijo de `GFormRow`. No hay prop en el contenedor, ni claves que resolver (`id` y `name` no importan al layout).

| Pista | Dónde | Qué hace |
| --- | --- | --- |
| `g-adapt-short` · `g-adapt-standard` · `g-adapt-wide` | `class` del hijo | Preferencia de **familia**; gana a la familia inferida. `short`: capacidad de referencia de 8 glifos y máximo de 16; `standard`: mínimo 8, preferido 24; `wide`: mínimo 12, preferido 40 |
| `g-adapt-full` | `class` | **Línea propia.** El hijo conserva su perfil (mínimos y máximos) dentro de esa línea: un número corto sigue corto |
| `g-adapt-natural` | `class` | Su tamaño intrínseco, peso 0 (como un avatar) |
| `--g-adapt-chars` | `style` del hijo o una regla del consumidor | Longitud **esperada**, entero positivo, en glifos de referencia de la fuente del hijo. No valida ni toca `maxlength`. Gana a la capacidad inferida (rango numérico, opciones, `maxlength`) |
| `--g-adapt-weight` | ídem | Peso en el reparto del sobrante, número positivo; nunca supera el máximo del hijo |

Clase y propiedades son **ortogonales** y se combinan (`g-adapt-short` con `--g-adapt-chars: 4` es familia corta con capacidad 4). Las familias son preferencias relativas a la fuente real del hijo, no medidas en píxeles.

```vue
<!-- Excepciones: el DOM no dice cuánto mide un código postal ni que las referencias van solas -->
<GAdaptiveLayout>
  <GInput class="g-adapt-short" style="--g-adapt-chars: 5" label="Código postal" name="cp" inputmode="numeric" />
  <GInput label="Colonia" name="colonia" style="--g-adapt-weight: 2" />
  <GSelect class="g-adapt-wide" label="Municipio" name="municipio" :options="municipios" />
  <GTextarea class="g-adapt-full" label="Referencias" name="referencias" />
</GAdaptiveLayout>

<!-- Formulario generado: la pista sale del esquema, campo a campo -->
<GAdaptiveLayout>
  <component v-for="campo in esquema" :key="campo.name" :is="campo.componente" v-bind="campo.props"
    :class="campo.ancho && `g-adapt-${campo.ancho}`"
    :style="campo.chars && { '--g-adapt-chars': campo.chars }" />
</GAdaptiveLayout>
```

```css
/* Desde la hoja de estilos de la aplicación: vale igual que el style en línea */
.campo-cp { --g-adapt-chars: 5; }
```

### Reglas y precedencia

- **Reconocimiento.** Son pistas las clases que empiezan por `g-adapt-`; `g-adaptive-layout` y sus modificadores no lo son. Sin clase de familia, la familia se infiere. **No existe `g-adapt-auto`** (avisa como desconocida).
- **Lectura.** El motor lee `--g-adapt-chars` y `--g-adapt-weight` del **estilo calculado** del hijo, así que valen desde `style`, desde una clase del consumidor o desde una hoja de estilos. Están registradas con `@property` (`<number>`, **sin herencia**, valor inicial `0`): la pista de un grupo no baja a sus hijos ni la de un campo a sus partes, y un valor no numérico cae a `0` (sin pista). No son del tema: no están en `defaults.css` ni en `tokens.json`.
- **Dónde va la clase.** `GNumberField`, `GSelect`, `GCombobox`, `GInput`, `GTextarea`, `GSummary` y `GAvatar` llevan `class` y `style` a su raíz, que es el hijo directo; ahí se lee la pista. En un nativo, la pista va en el hijo directo (el `<label>` que envuelve, o el `<input>` si él es el hijo). El motor no busca pistas dentro de la anatomía del hijo.
- **Precedencia**, de más fuerte a más débil:
  1. **Mínimos duros** que ninguna pista baja: palabra más larga de la etiqueta, chrome del control, área táctil (24 px; 44 px con puntero grueso), `setIntrinsicMin` (`GNumberField` con −/+) y el suelo de `GSummary`.
  2. `g-adapt-full` y `g-adapt-natural`.
  3. Pistas del hijo: `--g-adapt-chars` gana a la capacidad inferida; la clase de familia, a la familia inferida; `--g-adapt-weight`, al peso inferido.
  4. Perfil propio de `GSummary` y de un grupo anidado.
  5. Perfil inferido del DOM.
- **Contradicción:** dos o más clases de familia (`short`, `standard`, `wide`, `full`, `natural`) en un hijo: aviso y **no se aplica ninguna** (el orden de las clases no significa nada).
- **Pista sin efecto** (se ignora con aviso): en un bloque completo (tabla, `fieldset`, `section`, `GFormReveal` abierto, `GFormRow`, `GFieldGroup`, `GFormLayout`, hijo con varios controles) todo salvo `g-adapt-full`, que ahí es redundante y no avisa; en un grupo anidado, familias, `natural` y `--g-adapt-chars`; `g-adapt-natural` en un campo reconocido o en `GSummary`; en un hijo natural inferido (avatar, imagen) una familia distinta de `natural` y `full`, `--g-adapt-chars` o `--g-adapt-weight`; `--g-adapt-chars` o `--g-adapt-weight` con `g-adapt-natural`, y `--g-adapt-chars` con `g-adapt-full`.
- **`v-if` y `GFormReveal`:** la pista viaja con el hijo. Los hijos de un `GFormReveal` no son hijos directos del layout: sus clases no tienen efecto (el bloque abierto es un bloque completo).
- **`g-form-w-*` y `--g-form-min` son de `GFormRow`:** el layout no los lee. Una clase `g-form-w-*` en un hijo directo avisa («usa `g-adapt-*`»).
- **No hay API pública** de mínimos o máximos en píxeles, del coeficiente de reparto ni del límite de optimización.

## Grupos anidados

Otro `GAdaptiveLayout` como hijo directo forma un **grupo**: su raíz es una unidad contigua para el padre y su motor interior parte sus propios hijos con el ancho asignado, sin deshacerse en el padre.

```vue
<!-- Contenido mixto: avatar natural, grupo con peso propio y la ficha en su línea -->
<GAdaptiveLayout>
  <GAvatar name="María López" size="xl" />
  <GAdaptiveLayout style="--g-adapt-weight: 2">
    <GInput label="Nombre" name="nombre" />
    <GInput label="Apellido" name="apellido" />
  </GAdaptiveLayout>
  <GSummary class="g-adapt-full" title="Expediente 0042" :facts="datos" />
</GAdaptiveLayout>
```

- **Perfil exterior del grupo:** mínimo = el mayor mínimo de sus hijos; **preferido = el mayor preferido** (un estado interior apilado válido; sumarlos penalizaría compartir sitio con un avatar); máximo = suma de máximos más separaciones si todos son finitos, infinito si alguno es flexible; peso = suma de pesos. Un grupo vacío publica cero.
- **Las pistas de la raíz del grupo las lee el padre** (`g-adapt-full`, `--g-adapt-weight`); las de sus hijos las lee solo el grupo. Por la ausencia de herencia, el peso de la raíz no llega a sus hijos (medido: el grupo con peso 5 lo tiene en su raíz y 0 en todos sus descendientes, y su plan interior es el mismo con y sin la pista).
- Un grupo sin nombre es un `div` decorativo, sin `role`. Si la pregunta necesita `fieldset`/`legend`, lo aporta el consumidor.
- No se promete alinear pistas entre líneas distintas ni minimizar la altura global de un árbol de grupos. Solo se auditó **un nivel** de anidamiento.

## `GSummary` como hijo directo

[`GSummary`](../GSummary/README.md) lleva `contain: inline-size` y no aporta ancho intrínseco, así que tiene **perfil propio**: mínimo = su suelo (caja de identidad, si la hay, más la separación de su raíz más el suelo del título: `7ch` en `row` y `stack`, `4ch` en `inline`), preferido de familia `wide`, máximo infinito y peso 3. La ficha nunca recibe menos que su suelo y no comparte línea con su título recortado.

Una pista en la ficha (familia, `--g-adapt-chars`, `--g-adapt-weight`, `g-adapt-full`) gana sobre preferido, máximo y peso, **nunca sobre el suelo**; `g-adapt-natural` no tiene efecto. No hace falta pedir pista al consumidor.

Medido en los tres motores, dos temas, LTR y RTL, de 240 a 600 px: ninguna ficha bajo su suelo y ninguna compartiendo línea con el título recortado. Con el banco de la auditoría, a 400 px dos fichas van apiladas con el título entero; junto a dos números compactos, a 280 px la ficha va sola y a 460 px comparte línea (351 px, título entero). Única ficha recortada: «Hipertensión esencial (primaria)» a 240 px, sola a ancho completo (es el truncado propio de `GSummary`).

## Cómo decide la distribución

Cada hijo visible tiene un perfil interno `{ mínimo, preferido, máximo, peso }` en píxeles, medido con la fuente real de cada elemento. **Nunca se lee el valor escrito** para decidir un perfil.

- **Hijos que cuentan:** los elementos hijos directos visibles. Se excluyen `hidden`, `display: none` y un `GFormReveal` cerrado. No se excluye por `aria-hidden` (un avatar decorativo cuenta), `disabled` ni `readonly`. Un `GFormReveal` abierto, una `section`, un `fieldset` o un hijo con varios controles es un **bloque completo**.
- **Campo reconocido** (`GInput`, `GNumberField`, `GTextarea`, `GSelect`, `GCombobox` y sus nativos): el mínimo de etiqueta es la **palabra más larga**, más el chrome (relleno, bordes, prefijo, sufijo, botones, iconos). Un pie o un error aumentan el alto, no el ancho.
- **Texto libre:** mínimo de edición 8 glifos, preferido 40, máximo libre. `maxlength` es capacidad: baja el preferido a `min(maxlength, 40)`.
- **Número:** solo un rango finito **y** una precisión conocida permiten una capacidad compacta (`GNumberField` con `inputmode="numeric"`). Precisión desconocida, `inputmode="decimal"` sin precisión o extremos muy grandes usan el perfil estándar conservador. Los botones −/+ y la unidad se respetan por `setIntrinsicMin`.
- **Lista de opciones:** capacidad = la etiqueta visible más larga más chrome. Nunca solo la opción elegida (cambiar de opción no mueve las líneas); sin catálogo en el DOM, perfil estándar.
- **Avatar o imagen** con tamaño estable: `mínimo = preferido = máximo` = su caja natural, peso 0. **Tabla directa:** línea propia con su propio desplazamiento.
- **Genérico:** perfil estándar; no se promete entender un `div` arbitrario.

**Planificador.** Partición contigua, sin `order` ni `dense`. Una línea es admisible si la suma de mínimos cabe, si tiene un único hijo (que cede su mínimo) o si es un único bloque `full`. El reparto parte de los preferidos: si no caben, reduce cada hijo en proporción a su margen `preferido − mínimo`; si sobra, reparte por pesos con tope en los máximos. Si todos saturan, conserva el espacio libre y `horizontal` coloca la línea. Una programación dinámica minimiza el coste de línea `1 + 24 × Σ pérdida relativa al preferido al cuadrado`; el 24 es un parámetro **experimental** del contrato, no una ley de diseño. Optimización exacta hasta **64 hijos visibles** por contenedor; con más, partición contigua voraz por mínimos (`data-strategy="linear"`, con aviso único). Ningún hijo se descarta ni se esconde.

**Por debajo de un mínimo** solo cede la restricción horizontal: la raíz cabe, la etiqueta puede partir palabras (`overflow-wrap: break-word`) y el control admite su edición y desplazamiento nativos. El motor **no reduce** la fuente ni el área táctil, y no repara un CSS fijo arbitrario del consumidor.

### Alineación de compañeros

Cuando alguna línea del plan tiene al menos **dos raíces directas reconocidas** (`GInput`, incluidos `GNumberField` y `GCombobox`, `GSelect` o `GTextarea`), esa raíz recibe la clase interna `has-shared-tracks` y los campos de cada línea comparten tres pistas: **etiqueta, caja y pie**. Una etiqueta de varias líneas no descuadra la caja de su vecino: las cajas de una línea comparten el borde superior (medido < 0,7 px de diferencia, de 240 a 720 px, LTR y RTL, `gap` `none`/`md`/`lg`). Cada campo conserva su alto, sus botones y su unidad; compartir pista no estira un número.

Requiere `subgrid`. Sin él (o antes de medir), la distribución y las etiquetas se conservan íntegras y la alineación compartida es un límite documentado. Las líneas distintas son independientes; un grupo, un avatar o un bloque abierto ocupan las tres pistas como un bloque.

### Invalidación y `refresh()`

La medida se agrupa en un cuadro: todas las lecturas antes de las escrituras, y solo se escriben diferencias. Vuelven a medir: el ancho de contenido, los hijos y su visibilidad, las etiquetas, `lang` y `dir`, los atributos semánticos (`min`, `max`, `step`, `inputmode`, `maxlength`, opciones), las pistas del hijo, la carga de una imagen, `document.fonts`, el tema (clase o estilo de los antepasados, incluido `html`) y la inserción, retirada o cambio de un `<style>` o `<link rel="stylesheet">` del `<head>`. **No** vuelven a medir: escribir en un campo, un cambio de clase `is-*` de un campo, el cambio de `id` o `name`, ni la geometría de los antepasados.

**Lo que el navegador no notifica** queda para `refresh()`: `adoptedStyleSheets`, las ediciones del CSSOM (`insertRule`, `deleteRule`; por ejemplo, una regla tuya que cambia `--g-adapt-chars` sin tocar el hijo) y las hojas ubicadas en el `<body>`.

```vue
<script setup>
import { ref } from 'vue'
const layout = ref(null)
function tras() { layout.value?.refresh() }   // programa una medida en el siguiente cuadro; no mide en el acto
</script>
<template><g-adaptive-layout ref="layout"><!-- contenido --></g-adaptive-layout></template>
```

## Slots, eventos y método expuesto

| Slot | Propósito |
| --- | --- |
| `default` | Hijos directos en orden del DOM: campos, contenido genérico, avatar, `GSummary`, tablas y otro `GAdaptiveLayout`. Sin alcance. Los comentarios no cuentan; un fragmento con varias raíces elemento cuenta como varios hijos |

**Eventos: ninguno.** Un cambio de distribución no es una intención del usuario; no hay evento por cambio de tamaño. Los modelos, la validación y el envío son de los hijos.

**Expuesto:** `refresh(): void` (ver arriba).

**Texto suelto** como hijo directo: no se inventa un envoltorio; avisa y queda en la pila de respaldo hasta que lo envuelvas en un elemento.

## Contexto de formulario

Puede ir dentro de `GForm`. Provee el contexto de distribución (`block`, densidad resuelta y `setIntrinsicMin`) y hereda `readonly`, `disabled` y `stack`; no cambia el registro de `GForm`, la validación, el envío ni `GFormReveal` (probado: `FormData` nativo dentro de una sección, registro de errores y exclusión de un revelado cerrado). Con `stack` heredado pone un hijo por línea **conservando sus máximos**.

**`GFormReveal` cerrado:** dentro del layout sale de flujo (absoluto en el origen lógico, `opacity: 0`, `visibility: hidden`, sin transición), sin reservar línea ni separación; conserva nodos, valores y medida, y no recibe `data-line`. Su cierre se hace invisible de inmediato; no se promete una animación de compresión de la línea. Al abrir vuelve a la rejilla como bloque completo con sus transiciones propias. Fuera del layout, `GFormReveal` no cambia. **`hidden`** en un hijo directo da `display: none` aunque el CSS del campo declare `flex` o `grid`.

## Teclado y accesibilidad

| Tecla | Acción |
| --- | --- |
| Tab / Mayús+Tab | Nativo, en el orden del DOM |
| Cualquier otra | Es del componente hijo; el layout no intercepta nada |

- **Orden de lectura y de foco = DOM.** Los mismos nodos cambian de colocación: sin `appendChild`, sin reordenar, sin `order` ni `dense`, sin envoltorios de línea. Medido con Tab real a 320 y 720 px en LTR y RTL: la secuencia es exactamente la de los enfocables del DOM y nunca retrocede visualmente (WCAG 1.3.2 y 2.4.3).
- **Sin semántica propia:** `<div>` sin `role`, `tabindex` ni región viva; no es `role="grid"`. Nombre accesible, `fieldset`/`legend` y preguntas compuestas son de los hijos y del consumidor.
- **Foco y selección** se preservan por identidad de nodo: redimensionar conserva foco, `selectionStart`/`selectionEnd`/`selectionDirection` y valor. Escribir no dispara el plan (0 escrituras de colocación; mediana hasta el siguiente cuadro 16,7 ms dentro y fuera del layout en Chromium).
- **Sin animación de recolocación** (con y sin `prefers-reduced-motion: reduce`: ninguna animación en la raíz ni en los hijos al recolocar). Un cambio estructural legítimo (un salto de línea) puede mover visualmente los campos, sin romper el foco.
- **Mínimos de accesibilidad** (auditoría de coco, tres motores): de 240 a 1280 px, LTR y RTL, el reparto mantiene texto ≥ 12 px, botones −/+ y cajas ≥ 24 px, etiquetas sin recorte y cero solapes entre hijos; ninguna pista baja un control de 24 px. Sin desplazamiento horizontal de página en un visor de 320 CSS px. Las mismas comprobaciones de reparto pasan con texto al 200 % (aproximado con `rem` raíz) y con el espaciado de texto de WCAG 1.4.12 inyectado como hoja de usuario (0 palabras de etiqueta partidas).
- **Contraste:** el layout no aporta color. Medido sobre el compuesto real de etiquetas, valores y celdas, mínimos de 7,46:1 (tema por defecto claro), 8,59:1 (oscuro), 7,51:1 y 8,60:1 (tema de auditoría).
- **Foco visible:** el layout no recorta el foco de los hijos (sin `overflow`); el anillo se ve en el lado que da al vecino aun con `gap` `none`, y en `forced-colors` (emulado en Chromium) sigue como contorno sólido.
- **Tablas:** una tabla hija conserva su propio desplazamiento; su región desplazable y su nombre accesible son del consumidor.

## Personalidad

Lo distinto es **cómo reparte**, no un movimiento (no hay ninguno, a propósito: animar solo cambiaría los saltos dentro de una línea y desplazaría campos bajo el cursor durante un redimensionado).

1. **Sin filas ni columnas que declarar:** el ancho sale de lo que ya dice el contenido (palabra más larga de la etiqueta, dominio, `maxlength`, opciones, chrome).
2. **Un campo corto parece corto aunque esté solo:** «Exterior» de 0 a 9 con −/+ mide 103 px a 240 px y a 1280 px; su forma anuncia qué cabe.
3. **La composición sigue al texto real:** otro idioma, otra fuente u otro tema producen otra partición válida, sin umbrales. Con el tema de auditoría (Georgia 18 px, `space` 5) las líneas se recomponen solas al mismo ancho.
4. **Los nodos nunca se mueven:** foco, selección y lo escrito siguen en el mismo elemento.
5. **Los compañeros de una línea se alinean solos** (etiqueta, caja y pie), sin declarar nada.

## Tema

El componente **no añade tokens**, ni colores, superficie, sombra, radio, fuente ni duración propios. Lee solo estos dos y alias locales `--_adaptive-*`, sin valores de respaldo:

| Token | Uso |
| --- | --- |
| `--g-form-column-gap` | Separación en línea entre hijos de una línea, por densidad y por el factor de `gap` |
| `--g-form-gap` | Separación entre líneas, por densidad y por el factor de `gap` |

Las fuentes que se miden son las **reales** de cada elemento (estilo calculado), no un token. Los factores de densidad (1 · 0,875 · 0,75) y de `gap` (0 · 0,5 · 1 · 2) son multiplicadores geométricos, no tema. Las propiedades `--g-adapt-chars` y `--g-adapt-weight` son **entradas del consumidor**, no tokens del tema. Cambiar el tema (otro `space`, otra fuente) cambia las separaciones y los perfiles medidos; el layout no cambia sus mínimos de accesibilidad.

## Clases, atributos y alias

`g-adaptive-layout`, `g-adaptive-layout--horizontal-{start|center|end}`, `--vertical-{top|center|bottom}`, `--gap-{none|sm|md|lg}`, `--density-{default|comfortable|compact}`; `is-ready` solo tras una medida útil; `has-shared-tracks` (interna). En la raíz, `data-lines` y `data-strategy` (`optimal` o `linear`); en cada hijo planificado, `data-line`. Los alias `--_adaptive-*` (`line`, `track`, `width`, `start`, `rows`) son geometría interna, no API de tema; se limpian al cambiar los hijos y al desmontar. Antes de medir, sin `ResizeObserver` y en SSR, el layout es una pila legible con los mismos nodos y el mismo marcado que el primer render de cliente (cubierto por una prueba de SSR sin globals del navegador).

## Avisos de desarrollo

Con `NODE_ENV` distinto de `production`, `console.warn` con el prefijo `[Grana GAdaptiveLayout]`, **una vez por causa e instancia**, sin datos escritos por el usuario. En producción no avisa.

| Causa | Qué hace el componente |
| --- | --- |
| Clase `g-adapt-*` desconocida (incluida `g-adapt-auto`) | La ignora |
| Dos o más clases de familia en un hijo | No aplica ninguna |
| `--g-adapt-chars` que no es un entero positivo, o `--g-adapt-weight` que no es positivo | Lo ignora (`0` es «sin pista» y no avisa) |
| Valor no numérico de `--g-adapt-chars` o `--g-adapt-weight` en el `style` en línea | Queda en `0` |
| Pista sin efecto en ese hijo (bloque completo, grupo, `g-adapt-natural` en un campo o en `GSummary`, combinación redundante) | La ignora |
| Clase `g-form-w-*` en un hijo directo | No la lee («usa `g-adapt-*`») |
| Texto suelto como hijo directo | Pila de respaldo |
| Más de 64 hijos | Partición voraz |
| Dentro de una `GFormRow` | Avisa |
| Hijo con `order` distinto de 0 o rejilla con `dense` | Avisa |

## Rendimiento

Cifras medidas, con contexto; no son un presupuesto portátil.

- **Auditoría de coco** (Chromium, CPU por CDP, barrido de 53 anchos de 240 a 1280 px con 7 contenedores y 26 raíces, mismo contenido en `GFormLayout` como referencia): sobrecoste de **≈ 5,4 ms por paso de ancho** frente a `GFormLayout` (la pasada completa mide 623 ms frente a 286 ms; la medida suelta varía ± 1,5 ms entre corridas). Un cambio de CSS de coco (alias de colocación sin herencia, hallazgo 9) lo bajó de ≈ 10,5 ms. Escribir no cuesta.
- **500 hijos nativos** (`adaptive-layout.spec.mjs`, banco `#performance`, ejecutado al documentar en una Mac con un solo worker; dos cuadros por muestra, 12 muestras): `data-strategy="linear"`, una pista por línea y sin `has-shared-tracks`.

| Motor | Montaje | Redimensionado p50 | p95 |
| --- | --- | --- | --- |
| Chromium | 268 ms | 83,5 ms | 115,0 ms |
| Firefox | 272 ms | 92,0 ms | 154,0 ms |
| WebKit | 257 ms | 109,0 ms | 162,0 ms |

- **Desmontaje:** tras 10 montajes y desmontajes repetidos, los blancos del `ResizeObserver` vuelven a la cifra inicial y ninguno queda desprendido. Es evidencia del registro de observadores, no una prueba completa de memoria.

Con 200 o 500 campos reales el coste de DOM y de medida es un límite observado: no garantiza 60 fps en un redimensionado sostenido con muchos controles ni en móvil. El planificador acotado a 64 hijos exactos es un límite de trabajo del motor, no una promesa de velocidad. No se midió el peso añadido al paquete.

## Límites conocidos

- **Calle + Exterior (0–99999) + Interior (0–9999), sin −/+, a 460 px:** el plan óptimo del coste experimental es **[Calle, Exterior][Interior]**, no «Calle sola y dos compactos debajo». Es aceptable (respeta los mínimos duros y no deja tres cortos a ancho completo). Para Calle sola, pon `g-adapt-full` en Calle: medido a 460 px con el tema por defecto, LTR y RTL, en los tres motores, queda [Calle][Exterior, Interior]. Con el tema de auditoría (Georgia 18 px, `space` 5) los números son más anchos y Calle ya va sola sin pista. Si el uso real contradice el coeficiente, se reabre (decisión #342).
- **`g-adapt-full` no estira:** da línea propia pero conserva los máximos del hijo; un número sigue corto.
- **Sin `subgrid`**, la alineación de etiqueta, caja y pie entre compañeros no se repara con DOM ni con JavaScript.
- **Un `<style>` en el `<head>` sí** vuelve a medir; `adoptedStyleSheets`, el CSSOM y las hojas del `<body>` requieren `refresh()`.
- **jsdom no aplica `@property`:** en pruebas de unidad, las pistas `--g-adapt-*` deben ponerse en el propio hijo, porque sin registro la propiedad se heredaría. En un navegador real no hay herencia.
- **Un CSS fijo tuyo** (anchos o mínimos en píxeles sobre los hijos) puede desbordar bajo el mínimo del layout; no se repara.
- **No hay** virtualización, reordenación para eliminar huecos, alineación compartida entre líneas distintas ni porcentajes garantizados. La longitud de una pista es una expectativa, nunca una observación del uso real.
- **Con texto al 200 %** las iniciales de `GAvatar` desbordan su caja, también fuera del layout (defecto de `GAvatar.css`, hallazgo 7 de la auditoría; ajeno a este componente).

## Verificación

- **Pruebas de unidad** (vitest, jsdom y entorno de servidor): `GAdaptiveLayout.test.js`, **39 en verde** al documentar (ejecutadas de nuevo). Cubren el planificador (óptimo contra un oráculo en casos pequeños, 1 a 500 hijos, respaldo voraz, colocación lógica), los perfiles, las pistas del hijo y sus avisos, los bloques completos, `GSummary`, los validadores (rechazan los valores retirados y no existe `hints`), el contexto de `GForm`, el desmontaje, la invalidación y SSR.
- **Navegador** (Playwright en Chromium, Firefox y WebKit sobre el componente real de `dist/`, banco `playground/adaptive-layout.html`): `tests/adaptive-layout.spec.mjs` en `design/lab/theme-playground/`, **36/36** (12 pruebas por motor), ejecutadas de nuevo al documentar con `GRANA_PW_PORT=4210 npx playwright test tests/adaptive-layout.spec.mjs --workers=1`. Cubren `horizontal` lógico en LTR y RTL, la dirección a 460 px, `GSummary` junto a un campo, la no herencia de las pistas, que ninguna pista baje un control de 24 px, el orden de foco, Δ0 al escribir, un `<style>` insertado y `refresh()`, el banco compuesto de avatar con grupo y tabla, los compañeros C12, los 500 hijos y el banco sin avisos.
- **Auditoría de coco** (ronda 2, con el componente real, el tema por defecto claro y oscuro, y un tema de `@grana/cli` con `space` 5, 18 px y Georgia): `design/lab/adaptive-layout/auditoria-coco-verificar.mjs`, **65 122 comprobaciones, 0 fallos** (Chromium 21 960, Firefox 21 581, WebKit 21 581), más 42/42 del CSS fuente aislado en los tres motores. Cifras tomadas de la auditoría; no se repitió esa pasada al documentar.
- **CSS:** en `dist/grana.css` están `--_adaptive-start`, `margin-inline-start:var(--_adaptive-start)` y las clases `--gap-{none|sm|md|lg}`, y no están `--_adaptive-x`, `margin-left` ni las clases de `gap` retiradas; sin tokens nuevos ni valores de respaldo (según la auditoría de coco). Iconos: el componente no escribe pictogramas.

## No verificado

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack) sobre una composición con grupos, avatar y tabla.
- **Móvil y táctil reales:** el área táctil de 44 px con puntero grueso se comprobó solo por emulación.
- **Safari real** (solo el WebKit de Playwright).
- **Zoom nativo del navegador** al 200 % y 400 %: se aproxima con `rem` raíz y un visor de 320 px.
- **`forced-colors`** en Firefox y WebKit (solo Chromium, emulado).
- **Más de un nivel de anidamiento** de grupos y su altura global.
- **Coste en Firefox y WebKit con desglose** (la medida de CPU por CDP es solo de Chromium; en los otros motores solo hay el tiempo por paso del banco de 500 hijos).
- **El defecto de Firefox de #348** (etiqueta 32 px por encima de su campo) no se reproduce en el Firefox actual de Playwright ni quitando el límite que lo corregía: la equivalencia se garantiza por construcción, no por haber visto el defecto y su arreglo.
- **Peso añadido al paquete** de este componente.

## Fuentes

- API: [`GAdaptiveLayout.meta.json`](./GAdaptiveLayout.meta.json) · Contrato: [`design/contracts/adaptive-layout.md`](../../../../../design/contracts/adaptive-layout.md) (DECISIONS #339 a #348 y #359 a #365) · Prototipo: [`design/lab/adaptive-layout/r01/`](../../../../../design/lab/adaptive-layout/r01/) · Estilo: [`design/lab/adaptive-layout/estilo.md`](../../../../../design/lab/adaptive-layout/estilo.md) · Auditoría: [`design/lab/adaptive-layout/auditoria-coco.md`](../../../../../design/lab/adaptive-layout/auditoria-coco.md)
- Piezas relacionadas: [`GFormLayout`](../GFormLayout/README.md), [`GFormRow`](../GFormRow/README.md), [`GFieldGroup`](../GFieldGroup/README.md), [`GSummary`](../GSummary/README.md), [`GAvatar`](../GAvatar/README.md), [`GNumberField`](../GNumberField/README.md), [`GFormReveal`](../GFormReveal/README.md)
- Estándares: [CSS Grid, orden y accesibilidad](https://www.w3.org/TR/css-grid-1/#order-accessibility), [CSS Flexbox, reparto flexible](https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths), [CSS Sizing 3](https://www.w3.org/TR/css-sizing-3/), [ResizeObserver](https://www.w3.org/TR/resize-observer/) y [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
