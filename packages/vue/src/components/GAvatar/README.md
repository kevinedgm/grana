# GAvatar

La **cara de una persona o de una entidad** (organización, equipo, espacio) en una caja de lado fijo. Muestra, por orden, una **imagen**, unas **iniciales** o un **icono**, y la caja **nunca cambia** al pasar de uno a otro: cargar o fallar una foto no mueve nada (medido: 0px). Es **decorativo** por defecto (el nombre casi siempre está escrito al lado); con `label` es una imagen con nombre. **Nunca es interactivo**, no lleva estado de presencia (esa es una `GBadge` anclada) y no tiene slots ni eventos. El color es neutro, fijo (`color`) o derivado de forma estable del nombre o de un id (`categories`).

**Etiqueta:** `<g-avatar>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/avatar/auditoria.md`](../../../../../design/lab/avatar/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`, sección `GAvatar`). Exige Vue `^3.5.0`. El icono de respaldo y el `icon` usan Lucide (`GIcon`); el color por categorías necesita que tu tema declare `categories` (ver «Color»).

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')   // install registra <g-avatar> / <GAvatar>
```

También se puede importar solo el componente: `import { GAvatar } from '@grana/vue'`.

```vue
<!-- Iniciales («AL»), color derivado del nombre entre las 8 categorías del tema -->
<g-avatar name="Ana María López" :categories="8"></g-avatar>

<!-- Imagen; si falla o tarda, se ven las iniciales -->
<g-avatar src="/fotos/ana.jpg" name="Ana María López" size="lg" :categories="8"></g-avatar>

<!-- Entidad: cuadrado con icono (no hay nombre del que sacar iniciales) -->
<g-avatar icon="building-complex" shape="square" size="lg" label="Grana Labs"></g-avatar>

<!-- Sin nada: el icono user -->
<g-avatar></g-avatar>
```

> **En plantillas dentro del HTML** (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-avatar ...></g-avatar>`.

### Qué se ve: el orden de respaldo

| Prioridad | Fuente | Se ve cuando |
| --- | --- | --- |
| 1 | `src` (imagen) | Ya cargó. Mientras carga o si falla, se ve lo siguiente |
| 2 | `initials` | Tiene al menos un grafema tras recortar |
| 3 | `icon` | Resuelve (registro de la aplicación → librería). Si no resuelve, cuenta como ausente (aviso 6) |
| 4 | Iniciales derivadas de `name` | `name` tiene alguna palabra con letra o número |
| 5 | Icono `user` | Siempre: es el último recurso |

**Lo explícito gana a lo derivado:** con `name="Asistente" icon="bot"` se ve el icono, y `name` sigue sirviendo para el color. El respaldo (iniciales o icono) **existe siempre en el DOM**; la `<img>` se apila encima. Una cadena vacía o solo de espacios en `src`, `name`, `initials`, `icon`, `colorKey` o `label` cuenta como ausente.

### Iniciales a partir de `name`

La regla, en este orden: normaliza a NFC y parte por espacios; de cada palabra toma el **primer grafema que sea letra o número** (las palabras sin ellos, como un emoji suelto, se saltan); con una palabra, esa; con varias, la de la **primera** y la de la **última**; **una sola** en `xs`/`sm` o si alguna de las elegidas es de escritura ancha (han, hiragana, katakana, hangul); mayúscula con `toUpperCase()` sin configuración regional, y solo si sigue siendo un grafema.

| `name` | `md` (y `lg`, `xl`) | `xs` (y `sm`) | Nota |
| --- | --- | --- | --- |
| `Ana María López` | AL | A | Primera y última palabra |
| `Madonna` | M | M | Un solo nombre |
| `jean-luc picard` | JP | J | El guion no parte; pasa a mayúscula |
| `O'Brien` | O | O | El signo dentro de la palabra no cuenta |
| `Émile Zola` (en NFD) | ÉZ | É | NFC une la tilde antes de elegir |
| `łukasz żółw` | ŁŻ | Ł | Mayúscula fuera de ASCII |
| `🦊 Zorro Plateado` | ZP | Z | El emoji se salta |
| `🦊`, `""`, `"   "` | icono `user` | icono `user` | Sin letras: sigue la cadena |
| `李小龙` | 李 | 李 | Escritura ancha: una sola |
| `山田 太郎` | 山 | 山 | Dos palabras, ancha: una |
| `김민수` | 김 | 김 | Hangul |
| `محمد علي` | مع | م | Árabe; las iniciales llevan `dir="auto"` |
| `Straße` | S | S | Una palabra |
| `ßeta` | ß | ß | «ß» no pasa a «SS» (se queda si la mayúscula no es un grafema) |
| `Ana` con `icon="no-existe"` | A | A | Icono que no resuelve: sigue la cadena, con aviso 6 |

Todos estos casos son pruebas unitarias.

### `initials` explícitas

Se respetan **tal cual**: NFC, recorte y sin grafemas de espacio; **no se pasan a mayúsculas** y admiten emoji. Se cortan al máximo (2 grafemas; 1 si alguno de los dos primeros es de escritura ancha; 1 en `xs`/`sm`).

```vue
<g-avatar initials="ab"></g-avatar>   <!-- «ab», sin mayúsculas forzadas -->
<g-avatar initials="🦊"></g-avatar>   <!-- las explícitas admiten emoji -->
<g-avatar initials="ABC"></g-avatar>  <!-- «AB», y avisa (aviso 2) -->
```

**Cuándo usarlas en vez de `name`:** el servidor y el cliente deben dar las mismas letras (SSR sin desajuste de hidratación), así que las mayúsculas se calculan **sin configuración regional**. Con nombres turcos, `toUpperCase()` da «I» para «i» y no «İ»: pasa `initials` si te importa (`name="ilker yıldız"` da «IY»; `initials="İY"` da «İY»). Lo mismo vale para cualquier otro límite de `toUpperCase()` sin región.

### `icon`

Un **nombre** de Lucide que tu aplicación elige como dato (organización → `building-complex`, bot → `bot`). Se resuelve como cualquier nombre de la aplicación: primero el registro más cercano (`createIcons`), después la lista de la librería. La librería ya trae `user`, `user-plus` y `users`; los demás se registran con `createIcons`:

```js
import Grana, { createIcons } from '@grana/vue'
import { Building2 } from 'lucide-static'

createApp(App).use(Grana).use(createIcons([Building2]))   // se llama building-complex
```

- **El nombre que resuelve el registro es `building-complex`**, no `building-2`.
- Un nombre que no resuelve cuenta como ausente: la cadena sigue (iniciales de `name` → `user`) y en desarrollo avisa cómo registrarlo.
- **El icono de respaldo `user` es propio del componente:** sale **solo de la librería** y un `user` distinto en tu registro **no** lo cambia (pasarlo como `icon="user"` sí usa tu registro).
- Si lo que quieres es el icono de una acción o de un estado, usa [`GIcon`](../GIcon/README.md), no `GAvatar`.

## Decorativo o con nombre

| Caso | Cómo | Árbol de accesibilidad |
| --- | --- | --- |
| El nombre está escrito al lado (tarjeta, lista, menú, select) | Sin `label` | Fuera del árbol (`aria-hidden="true"` en la raíz) |
| Dentro de un control que ya tiene nombre (botón de cuenta, riel de `GSidebar`) | Sin `label`; el nombre lo da el control | El control con su nombre |
| Es la **única** identificación (celda densa solo con avatar, avatar suelto) | Con `label` | `img "Ana María López"` (`role="img"` + `aria-label` en la raíz) |

```vue
<!-- Tarjeta con el nombre al lado: decorativo, el nombre se lee una sola vez -->
<span class="persona"><g-avatar name="Ana María López" :categories="8"></g-avatar>Ana María López</span>

<!-- Avatar suelto o celda densa sin texto: con nombre -->
<g-avatar name="Luis Torres" label="Luis Torres" :categories="8"></g-avatar>

<!-- Celda de GTable con solo el avatar (ejemplo del contrato; el playground no lo monta) -->
<template #cell-responsable="{ row }">
  <g-avatar :name="row.nombre" :color-key="row.id" :label="row.nombre" size="sm" :categories="8"></g-avatar>
</template>

<!-- Dentro de un botón: el avatar es decorativo, el nombre es del botón -->
<button type="button" @click="abrirMenuDeCuenta">
  <g-avatar name="Ana María López" size="sm" :categories="8"></g-avatar>Cuenta de Ana
</button>
```

- **`name` no es el nombre accesible.** Solo deriva iniciales y color: exponerlo por defecto lo leería dos veces junto al texto visible.
- **No hay prop `alt`:** la `<img>` lleva siempre `alt=""` y el nombre sale de una sola fuente (`label`), que no cambia entre cargando, cargada y fallida.
- **No pongas `label` dentro de un hueco decorativo.** El hueco `lead` de `GCard`, el `icon` de `GMenu` y de `GSelect` van en `aria-hidden`: el nombre no llegaría y, en desarrollo, avisa (aviso 1). Pon el nombre en el texto vecino o en el control.
- **Si el avatar abre algo**, el `<button>` lo pone tu aplicación con su nombre; el avatar dentro va sin `label`. Un `onClick` o `tabindex` sobre el avatar no se enlaza y avisa.

## Tamaños

El lado es **`space × n`** (`--g-space-1`) y el avatar **nunca se estira ni se encoge** para llenar un hueco: es el hueco el que adopta su caja.

| `size` | Lado | Con `space` 4 | Letras | Hueco al que corresponde |
| --- | --- | --- | --- | --- |
| `xs` | `space × 5` | 20px | 1 | Icono de `GMenu` y de `GSelect`; en línea con texto `body-sm` |
| `sm` | `space × 6` | 24px | 1 | Celda densa solo con avatar (`cell-{key}` de `GTable`, con `label`) |
| `md` (por defecto) | `space × 8` | 32px | 2 | `leading-{key}` de `GTable`; slot `user` de `GSidebar` (también en el riel) |
| `lg` | `space × 10` | 40px | 2 | `lead` de `GCard` (su caja mide lo mismo) |
| `xl` | `space × 16` | 64px | 2 | Perfil, cabecera de detalle |

Las iniciales se escriben con el rol tipográfico del tamaño (`xs`/`sm` `caption`, `md` `body-sm`, `lg` `body`, `xl` `title-sm`), siempre ≥ 12px y con el peso de `title-sm`. **No cambia con la densidad** (no hay `density`). La escala de [`GAvatarMotion`](../GAvatarMotion/README.md) es otra (sm 6 · md 8 · lg 12 · xl 24 × `space`): no se unifican (DECISIONS #297).

## Forma: persona o entidad

| `shape` | Qué dice |
| --- | --- |
| `circle` (por defecto) | Una **persona** |
| `square` | Una **entidad** (organización, equipo, espacio) |

La forma dice **qué es** lo representado, no la personalidad del tema: **no lee `--g-radius-shape`** (con `shape: "pill"` las entidades parecerían personas). El cuadrado toma un radio de la escala del tema que crece con el tamaño (`xs`/`sm` `--g-radius-xs`, `md` `--g-radius-sm`, `lg` `--g-radius-md`, `xl` `--g-radius-lg`); el círculo es `50%`.

## Color

Los colores son los del sistema, nunca semánticos (un avatar rojo diría «peligro»): neutro, o una de las **categorías** del tema.

| Entrada | Resultado |
| --- | --- |
| Sin `color` y `categories` en `0` (por defecto) | Neutro (`neutral-soft`) |
| `color="neutral"` | Neutro (gana a `categories`) |
| `color="3"` o `:color="3"` (1 a 12) | Categoría fija 3 |
| `:categories="8"` sin `color`, con `colorKey` o `name` | Categoría derivada: `hash(clave) mod 8 + 1` |
| `:categories="8"` sin `colorKey` ni `name` | Neutro |

Cualquier otro valor en `color` (`brand`, `danger`, `"azul"`…) **se ignora** como si no estuviera y avisa (aviso 3): sigue el color derivado o el neutro. `categories` fuera de 0 a 12 o no entero se trata como `0` (aviso 4).

> **Cuidado:** `:color="3"` **fija** la categoría 3; `:categories="3"` **reparte** entre 3. Los nombres son parecidos y los dos aceptan números válidos con efectos distintos.

### Receta: color estable por persona

El componente no puede saber cuántas categorías declara tu tema sin leer estilos (y no usa valores de respaldo), así que **lo declaras tú**, con el mismo número que la entrada `categories` de tu tema:

```json
{ "brand": "#7A1F5C", "categories": 8 }
```

```bash
npx @grana/cli theme grana.config.json   # escribe tokens.css con --g-color-cat-1 a cat-8 (y sus -soft / on-…-soft)
```

```vue
<g-avatar :name="p.name" :color-key="p.id" :categories="8"></g-avatar>
```

- **`colorKey`** (un id estable) fija el color a la persona y no a su nombre: **no cambia al renombrarla** y dos homónimos pueden diferir. Un número se convierte con `String()`. Sin `colorKey`, la clave es `name`.
- **Si cambias `categories`, los colores se reparten de nuevo** (es inherente al módulo). Para un color que no debe moverse, usa `color` fijo.
- **Si `categories` supera las que declara el tema**, o `color="k"` con `k` mayor que ellas, el avatar queda **sin relleno** y con la letra en el color heredado (legible). El componente no puede detectarlo y no avisa.
- **Contraste:** `on-cat-k-soft` sobre `cat-k-soft` está garantizado ≥ 4,5:1 por derivación del CLI. El avatar no lee `-strong`, `-text` ni `cat-k`: no es un control y no lleva borde de categoría.

### Reproducir el color fuera de JavaScript

El hash es parte del contrato y **no cambia entre versiones sin una decisión**: FNV-1a de 32 bits sobre los **octetos UTF-8** de la clave normalizada (NFC, recorte, espacios colapsados a uno, minúsculas), más el finalizador `fmix32` de MurmurHash3, módulo `n`, más 1. Así un correo, un PDF o el servidor pueden pintar el mismo color. Equivalente en Python, comprobado contra los vectores de la tabla:

```python
import re, unicodedata

def avatar_category(key, n):                 # key: colorKey o name; n: categories (1..12)
    s = re.sub(r'\s+', ' ', unicodedata.normalize('NFC', str(key)).strip()).lower()
    if not s:
        return None                          # sin clave: neutro
    h = 0x811c9dc5
    for b in s.encode('utf-8'):
        h ^= b
        h = (h * 0x01000193) & 0xffffffff
    h ^= h >> 16; h = (h * 0x85ebca6b) & 0xffffffff
    h ^= h >> 13; h = (h * 0xc2b2ae35) & 0xffffffff
    h ^= h >> 16
    return h % n + 1
```

| Clave | `n = 4` | `n = 8` | `n = 12` |
| --- | --- | --- | --- |
| `a` | 4 | 4 | 4 |
| `Ana María López` (y `  ANA   MARÍA lópez `, y la forma NFD) | 2 | 2 | 2 |
| `李小龙` | 1 | 1 | 1 |
| `محمد علي` | 2 | 6 | 2 |
| `Grana Labs` | 3 | 3 | 11 |
| `u_8f3a2c` | 2 | 2 | 2 |
| `Zoë` | 3 | 3 | 11 |

Los vectores son pruebas unitarias y se comprueban también en Chromium, Firefox y WebKit. Mayúsculas, espacios y NFD dan la misma categoría. El componente **no exporta** la función en v0.1.

## Imagen

| Estado | Clase en la raíz | Se ve | `<img>` |
| --- | --- | --- | --- |
| Sin `src` | (ninguna) | El respaldo | No existe |
| Cargando | `is-loading` | El respaldo; la `<img>` está encima, invisible | Existe |
| Cargada | `is-loaded` | La imagen (`object-fit: cover`); el respaldo queda `visibility: hidden`, sin salir del flujo | Existe |
| Fallida | `is-failed` | El respaldo | **Se quita** (sin icono de imagen rota) |
| Cambio de `src` | vuelve a `is-loading` | El respaldo hasta `load` | Una nueva |

- La `<img>` lleva `alt=""`, `loading="lazy"`, `decoding="async"` y `draggable="false"`: en tablas y listas largas no se descargan las caras fuera de vista, y la caja fija impide el salto.
- Una imagen ya en caché al montar (o tras hidratar en el servidor) se resuelve al montar, sin esperar a un `load` que pudo ocurrir antes. Si está completa y sin tamaño natural, `decode()` decide: una imagen rota falla; un SVG sin tamaño intrínseco carga.
- Un `load` o `error` tardío de la imagen anterior no cambia el estado de la nueva.
- El relleno queda debajo de la imagen (útil para PNG con transparencia).
- No hay eventos `load` ni `error`: el estado se ve en la clase.

## Presencia: una `GBadge` anclada

No hay prop `status`. La presencia es una [`GBadge`](../GBadge/README.md) con el avatar en el slot `anchor`: ya resuelve **figura + `label` + colocación lógica**, el significado nunca depende solo del color (WCAG 1.4.1) y se espeja en RTL.

```vue
<g-badge shape="circle" color="success" label="En línea" placement="bottom-end">
  <template #anchor><g-avatar name="Ana María López" :src="foto" size="lg" :categories="8"></g-avatar></template>
</g-badge>
```

- **Convención sugerida** (la ratifica tu aplicación): en línea = `circle` `success`, ausente = `diamond` `warning`, ocupado = `square` `danger`; desconectado = sin insignia.
- **Sobre un círculo, la insignia se centra en el contorno** (el punto a 45°), no en la esquina de la caja; sobre `square`, en la esquina. Lo resuelve `GBadge.css` cuando el destino es un `.g-avatar--shape-circle`.
- Con el avatar decorativo se lee solo «En línea», junto al nombre visible; con `label`, «Ana María López, En línea» (el destino va antes de la insignia).
- Un avatar de entidad con nombre: `<g-badge shape="circle" color="success" label="Activa" placement="top-end"><template #anchor><g-avatar icon="building-complex" shape="square" size="lg" label="Grana Labs"></g-avatar></template></g-badge>`.

## En los huecos de otros componentes

**Regla:** el avatar mide siempre `space × n` de su `size`; **el hueco que lo recibe adopta su caja y pierde su marco** (borde, relleno, radio y recorte propios), para que se vea una sola forma. Se detecta en CSS con un **hijo directo** `.g-avatar`: **el avatar debe ser hijo directo del slot**, sin envoltorios. Ningún componente importa `GAvatar`.

| Anfitrión | Slot | `size` | Qué cambia en el anfitrión (medido) |
| --- | --- | --- | --- |
| `GCard` | `lead` | `lg` | Sin borde, relleno ni radio; la caja de 40px es el avatar, una sola forma. El esqueleto de carga es idéntico con y sin avatar. Un `lead` de texto conserva su marco |
| `GTable` | `leading-{key}` | `md` | Sin relleno, radio ni recorte: 32px = el avatar; un `square` se ve cuadrado. **Mismo alto de fila** que con el `leading` de texto (que no cambia) |
| `GMenu` | `icon` (con `item.icon` como dato opaco) | `xs` | Los huecos no vacíos de la lista miden `space × 5` (20px con `space` 4): etiquetas alineadas, alto del elemento sin cambio (36px) |
| `GSelect` | `icon` | `xs` | Hueco de `space × 5`; el avatar queda centrado en la línea de texto, junto al valor y en la lista; alto del control sin cambio (34px) |
| `GSidebar` | `user` | `md` | Ninguno: es un botón de tu aplicación |
| `GBadge` | `anchor` | cualquiera | Insignia en el contorno (ver «Presencia») |

```vue
<!-- GCard: avatar en lead -->
<g-card as="li" :title="m.name" :subtitle="m.team" orientation="horizontal">
  <template #lead><g-avatar :name="m.name" :src="m.photo" size="lg" :categories="8"></g-avatar></template>
</g-card>

<!-- GTable: avatar en una columna compuesta -->
<template #leading-cliente="{ row }">
  <g-avatar :name="row.nombre" :src="row.foto" :color-key="row.id" size="md" :categories="8"></g-avatar>
</template>

<!-- GSelect: elegir personas -->
<g-select v-model="responsable" :options="personas" label="Responsable">
  <template #icon="{ option }"><g-avatar :name="option.label" :src="option.src" size="xs" :categories="8"></g-avatar></template>
</g-select>

<!-- GMenu: el dato del avatar va en item.icon (un objeto); no hay item.avatar -->
<g-menu v-model="abierto" :items="personas" label="Asignar a">
  <template #trigger="{ attrs }"><g-btn v-bind="attrs" variant="outline">Asignar a…</g-btn></template>
  <template #icon="{ item }">
    <g-avatar v-if="typeof item.icon === 'object'" v-bind="item.icon" size="xs" :categories="8"></g-avatar>
    <g-icon v-else :name="item.icon"></g-icon>
  </template>
</g-menu>
<!-- personas = [{ id: 'ana', label: 'Ana María López', icon: { name: 'Ana María López', src: foto } },
                 { id: 'invitar', label: 'Invitar a alguien…', icon: 'user-plus' }] -->

<!-- GSidebar: el avatar es decorativo dentro del botón; el nombre es del botón (en el riel, su aria-label) -->
<template #user="{ collapsed }">
  <button type="button" :aria-label="collapsed ? 'Ana García, Administradora' : undefined">
    <g-avatar name="Ana García" size="md" :categories="8"></g-avatar>
    <span v-if="!collapsed">Ana García</span>
  </button>
</template>
```

- **`GMenu`:** el avatar va en `item.icon` como **valor opaco** que solo recibe el slot `icon` (sin slot no se dibuja nada); no existe `item.avatar` (reservado si un segundo componente lo pide).
- **`GTable` con solo texto:** el `leading` de texto (iniciales) sigue como está. Para imagen, color o iniciales derivadas, usa `leading-{key}` con `GAvatar`.
- **`GTranscript` no usa `GAvatar`:** la marca de hablante es suya (etiqueta de posición con borde y ancho variable).
- Una **pila de avatares** («+3») no existe: `GAvatarGroup` está reservada. No la imites con márgenes negativos.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `src` | String | URL de la imagen | sin valor |
| `name` | String | nombre de la persona o entidad | sin valor |
| `initials` | String | 1 o 2 grafemas | sin valor |
| `icon` | String | nombre de Lucide (registro de la aplicación → librería) | sin valor |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` |
| `shape` | String | `circle` `square` | `circle` |
| `color` | String \| Number | `'neutral'` o una categoría `1` a `12` (número o cadena numérica) | sin valor |
| `categories` | Number | entero `0` a `12` | `0` |
| `colorKey` | String \| Number | id estable | sin valor |
| `label` | String | texto libre | sin valor |

`size` y `shape` fuera de su lista muestran la advertencia de Vue. **No existen** `alt`, `status`, `variant`, `rounded`, `density`, `loading`, `srcset`, `sizes`, `crossorigin` ni `referrerpolicy` (los tres últimos, reservados).

## Eventos y slots

**Ninguno.** El avatar no es interactivo: `emits: []` está declarado y las escuchas del consumidor no se enlazan. Tampoco hay slots: un logotipo es `src`; un pictograma, `icon`; un nombre, `label`. Un slot dejaría meter controles o texto suelto en una caja decorativa; contenido en el slot por defecto no se pinta y avisa (aviso 7).

## Atributos (`inheritAttrs: false`)

| Atributo | Qué pasa |
| --- | --- |
| `class`, `style`, `id`, `title`, `data-*`, `lang` | Van a la **raíz** (la clase de Grana va primero) |
| `role`, `aria-*` (incluido `aria-hidden`), `tabindex` | **Se ignoran** y avisan (aviso 5): romperían el contrato decorativo / con nombre |
| Escuchas (`onClick`, `onKeydown`…) | **No se enlazan** y avisan (aviso 5): un `<span>` con clic sería un control sin rol ni teclado |
| Cualquiera | **Nunca llegan a la `<img>`** |

## Teclado

No aplica: el avatar **nunca** es enfocable ni interactivo, y ningún elemento suyo lleva `tabindex`. Si abre algo, la aplicación lo envuelve en un `<button>` con su nombre.

## Accesibilidad

- **Decorativo por defecto:** `aria-hidden="true"` en la raíz, fuera del árbol. Con `label`, `role="img"` + `aria-label` y la `<img>` con `alt=""`. Comprobado con el árbol de accesibilidad de Playwright en los tres motores (decorativos fuera, `label` → `img` con nombre, botón de cuenta con su nombre, presencia con texto).
- **Iniciales:** en un `<span dir="auto" translate="no">`. En una página RTL, «AL» no se lee «LA» y «مع» toma su orden; un traductor automático no las reescribe.
- **Contraste** (iniciales ≥ 4,5:1; icono ≥ 3:1, mismo color que el texto), medido sobre el componente real en Chromium, Firefox y WebKit, claro y oscuro: mínimo **4,60** (claro) y **4,52** (oscuro) con el tema del playground y 8 categorías; 4,64 / 4,52 con 12 categorías; 4,65 / 4,52 con una marca roja y 8; en el neutro de los once temas del banco de estilo, mínimo 4,53. En ningún caso bajó de 4,5.
- **Texto ≥ 12px** en todos los tamaños; 15 nombres de escrituras distintas × 5 tamaños × 2 formas caben y quedan centrados (±1px).
- **`forced-colors`:** el relleno desaparece y un borde `CanvasText` de `--g-border-width` conserva la forma **sin cambiar el tamaño**; la foto cargada sigue visible. Solo se comprobó emulado, en Chromium.
- **Sin área táctil:** no es interactivo.
- **RTL:** el avatar no cambia; la insignia anclada se espeja.
- **Zoom y ancho:** sin desplazamiento horizontal a 320px ni a un zoom aproximado de 200 %; los lados no cambian.

## Personalidad: movimiento

Todo ocurre **solo con `prefers-reduced-motion: no-preference`**; con `reduce`, todo es instantáneo (duración `0s`, sin escala, la foto aparece a opacidad 1 en el primer fotograma cargado). Usa los tokens `--g-duration-fast` y `--g-ease-standard` y no cambia la caja ni el contraste (DECISIONS #298).

1. **La foto se revela desde las iniciales.** Al pasar a `is-loaded`, la imagen se funde sobre el respaldo y se asienta de `scale: 1.06` a `1` (el doble de `--g-duration-fast`), como un enfoque. El respaldo se queda entero debajo y se retira al terminar el fundido: **ningún fotograma deja ver el relleno vacío**, tampoco al cambiar de foto. Medido: 5 fotogramas intermedios de opacidad y 11 de escala, monótonos, asentada en unos 250ms (con `--g-duration-fast` de 120ms). En una tabla que carga 50 caras, se percibe como la misma persona enfocándose y no como 50 parpadeos.
2. **La forma se transforma.** Cambiar `shape` de `circle` a `square` (o al revés) anima el radio en lugar de saltar; útil si una vista alterna entre persona y organización.
3. **Monograma con ajuste tipográfico propio:** cifras a la altura de las mayúsculas (`lining-nums`), sin ligaduras y con `kerning`, para que dos iniciales nunca se fundan en una.

Una imagen ya decodificada al montar (abrir por segunda vez la lista de un `GSelect`, remontar con `v-if`) aparece cargada en el primer fotograma; lo decide `complete` al montar. La primera vez que una foto aparece en un contexto puede revelarse, según el motor (medido en Chromium, Firefox y WebKit). Cambiar `src` pasa por el respaldo (no hay fundido entre la foto anterior y la nueva).

## Tema

El componente solo lee tokens `--g-*` y alias locales `--_av-*`; **no añade tokens nuevos**. Constantes geométricas no tematizables: `50%` (círculo), el factor `0.5` del tamaño del icono respecto del lado (nunca menor que 1em) y `1.06` del asentamiento.

| Token | Para qué |
| --- | --- |
| `--g-space-1` | Lado (`× 5, 6, 8, 10, 16`) |
| `--g-color-neutral-soft`, `--g-color-on-neutral-soft` | Relleno y texto/icono neutros |
| `--g-color-cat-{1…12}-soft`, `--g-color-on-cat-{1…12}-soft` | Relleno y texto/icono de la categoría `k`. **Familia condicional:** solo existe si tu tema declara `categories: N` (el tema por defecto no la trae) |
| `--g-text-{caption\|body-sm\|body\|title-sm}-size`, `-line`, `-tracking` | Iniciales por tamaño |
| `--g-text-title-sm-weight` | Peso de las iniciales en todos los tamaños |
| `--g-font-ui` | Fuente de las iniciales |
| `--g-radius-{xs\|sm\|md\|lg}` | Radio del `square` por tamaño |
| `--g-border-width` | Borde `CanvasText` en `forced-colors` |
| `--g-duration-fast`, `--g-ease-standard` | Revelado de la imagen y morfo de forma |

`GAvatar.css` es el único componente, junto con `GTranscript`, que puede leer `--g-color-cat-k-soft` y `--g-color-on-cat-k-soft` sin que existan en `defaults.css` y sin valor de respaldo.

## Avisos de desarrollo

Con `NODE_ENV` distinto de `production`, `console.warn` con el prefijo `[Grana GAvatar]`, **una vez por causa y valor**. En producción no avisa.

| # | Causa | Qué hace el componente |
| --- | --- | --- |
| 1 | `label` con un antecesor `aria-hidden="true"` (se comprueba al montar) | Dibuja igual; avisa que el nombre no llega |
| 2 | `initials` con más grafemas que el máximo (2, o 1 con escritura ancha), en cualquier tamaño | Las corta. Reducir a una letra en `xs`/`sm` unas `initials` de 1 o 2 grafemas **no** avisa |
| 3 | `color` que no es `'neutral'` ni un entero de 1 a 12 (un semántico como `danger` tiene su propio texto) | Lo ignora: color derivado o neutro |
| 4 | `categories` fuera de 0 a 12 o no entero | Lo trata como `0` |
| 5 | `role`, `aria-*`, `tabindex` o escuchas como atributos | No los pasa; remite a `label` o a envolver el avatar en un `<button>` |
| 6 | `icon` que no está en el registro ni en la librería | Sigue la cadena (iniciales de `name` → `user`) y explica cómo registrarlo |
| 7 | Contenido en el slot por defecto | No lo pinta |

**No avisa** (imposible sin leer estilos): `k` mayor que las categorías del tema; `categories` distinto del `categories` real del tema.

## Render de servidor (SSR)

Sin `window` ni `document`: con `src`, el servidor emite `is-loading` con el respaldo primero y la `<img>` última, y al montar se resuelven `complete` y `naturalWidth`. Vue serializa `alt=""` como **`alt` sin valor**, que en HTML es exactamente la cadena vacía (imagen decorativa). Las mayúsculas sin configuración regional y el hash sobre UTF-8 hacen que servidor y cliente den las mismas iniciales y la misma categoría, sin desajuste de hidratación.

```html
<span class="g-avatar g-avatar--size-lg g-avatar--shape-circle g-avatar--content-initials is-loading" data-cat="2" aria-hidden="true"><span class="g-avatar__initials" dir="auto" translate="no">AL</span><img class="g-avatar__img" src="/ana.png" alt loading="lazy" decoding="async" draggable="false"></span>
```

## Clases

Las emite el componente y las estiliza `GAvatar.css`: `g-avatar`, `g-avatar--size-{xs|sm|md|lg|xl}`, `g-avatar--shape-{circle|square}`, `g-avatar--content-{initials|icon}` (qué **respaldo** hay, también con la imagen cargada); estados `is-loading`, `is-loaded`, `is-failed` (uno a la vez, solo con `src`); `data-cat="k"` (solo con categoría fija o derivada); y las partes `g-avatar__initials`, `g-avatar__icon` (el `GIcon` interno, `g-icon g-avatar__icon`) y `g-avatar__img` (siempre la última hija). `label` no tiene clase: se expresa con `role` y `aria-label`.

## Limitaciones conocidas

- **Lector de pantalla real sin verificar** (VoiceOver, NVDA) sobre `<span role="img" aria-label>` con una `<img alt="">` dentro, en celda, botón y elemento de menú: solo se comprobó el árbol de accesibilidad de Playwright.
- **`forced-colors` real** (Windows) sin verificar, y fuera de Chromium no se emula.
- **Carga diferida real por red**, imágenes de alta densidad, SSR con imagen en caché e hidratación real: sin verificar (las pruebas usan `data:`, una ruta retenida por Playwright y un PNG local). Tampoco se midió el zoom real del navegador (solo aproximado con un visor a escala 2).
- **Escrituras complejas sin validar con hablantes:** devanagari (`Intl.Segmenter` da «प्रि» + «श»), árabe con ligadura, tailandés y secuencias ZWJ en `initials` solo se midieron (caben).
- **«ЖШ» en `md` circular deja 0,1px de aire** dentro del margen de 1px que se exige con la fuente por defecto (Instrument Sans); en `square`, 1,7px. Un tema con **tipografía más ancha** podría tocar el borde del círculo con dos letras anchas.
- **Temas con `space` y `fontSize` desacoplados:** `xs` deja de igualar el interlineado de `body-sm` (se midió `space` 4 y 5).
- **Categoría inexistente en el tema:** sin relleno y sin aviso (ver «Color»).
- **Turco y otros límites de `toUpperCase()` sin región:** pasa `initials`.
- **Hash:** la equivalencia en otros lenguajes está comprobada solo contra los vectores; casos raros de minúsculas fuera de ellos (por ejemplo, la «İ» turca) no se verificaron.
- **Sin pila de avatares** (`GAvatarGroup`, reservada), sin `status`, sin eventos `load`/`error`, sin `srcset`/`crossorigin`/`referrerpolicy`, sin `categories` por aplicación (un `provide` para no repetirlo) y sin exportar el hash: reservados o candidatos, sin consumidor.
- **Estilos globales sin capa ganan:** una regla global tuya sobre `span` o `img` (sin capa) gana al CSS de Grana (capa `grana.components`); acótala con un selector más específico.
- **Relación con `GAvatarMotion`:** es otro componente (una personalidad animada que reacciona a estados); `GAvatar` es la identidad de alguien concreto y no lo sustituye ni lo absorbe.

## Verificación

- **Pruebas** (vitest con jsdom y, para el servidor, entorno node): 80 en `GAvatar.test.js` y 4 en `GAvatar.ssr.test.js`, todas en verde en la última ejecución. Cubren el marcado y las clases, la precedencia del contenido, la tabla de iniciales (`md` y `xs`), los vectores del hash y su invariancia (también sin `TextEncoder` y sin `Intl.Segmenter`), `color` frente a `categories`, los estados de la imagen (`load`, `error`, `src` cambiado, evento tardío, imagen en caché y `decode()`), la semántica, los atributos filtrados y los siete avisos.
- **Navegador** (Playwright en Chromium, Firefox y WebKit, sobre el componente real del playground): `avatar.spec.mjs`, 13 pruebas por motor. Ejecutadas con un solo worker: 37 pasan y 2 se omiten por diseño (`forced-colors` solo en Chromium). Con varios workers en paralelo y la máquina cargada, algunas pruebas de Firefox y WebKit agotaron el tiempo; con un worker pasan.
- **Auditoría de coco** con el componente real y temas distintos al por defecto (`tema-cat12`, `tema-marca-cat8`, el tema alterno del playground y `space` 5): `node design/lab/avatar/auditoria-verificar.mjs`, **1084/1084** comprobaciones en los tres motores (vuelto a ejecutar al documentar, con el hallazgo del tema de categorías del playground ya cerrado); el banco de estilo, 2269/2269, y la suite completa de `@grana/vue`, 1864/1864, son las cifras de la auditoría (no se repitieron al documentar). Compuerta de build: `grep -q "g-avatar--shape-square" packages/vue/dist/grana.css`.
- **Sin verificar:** todo lo de «Limitaciones conocidas».

## Fuentes

- API: [`GAvatar.meta.json`](./GAvatar.meta.json) · Contrato: [`design/contracts/avatar.md`](../../../../../design/contracts/avatar.md) (DECISIONS #293 a #298) · Prototipo: [`design/lab/avatar/r01/`](../../../../../design/lab/avatar/r01/) · Estilo: [`design/lab/avatar/estilo.md`](../../../../../design/lab/avatar/estilo.md) · Auditoría: [`design/lab/avatar/auditoria.md`](../../../../../design/lab/avatar/auditoria.md)
