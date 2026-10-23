# Contrato común · Bloques estructurales: Marketing P0 (`@grana/blocks/marketing`) y Booking (`@grana/blocks/booking`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #814 a #826, 2026-10-22; remates tras la construcción #827 a #844, §13; decisión del usuario del 2026-10-22: «Vale #780: los bloques van en `packages/blocks/` como paquete `@grana/blocks` aparte. Que lima enmiende #765 y arranca el lote 2 (Marketing P0) ahí») · **Plan:** `design/lab/blocks/plan.md` §2, §4.1, §5 (lote 2), §6 · **Flujo:** reducido (#766): lima → bruno → coco (solo auditoría) → mora-docs
**Paquete:** `@grana/blocks`, entrada **`@grana/blocks/marketing`** (`dist/marketing.js`, #815) · **Avisos:** `[Grana Gb<Sección><NN>]` · **Usuario final de referencia:** el viajero en el teléfono del inventario `design/lab/marketing/r01/brief.md` (hotel boutique, restaurante, tour; inglés además de español, conexión lenta, sol de frente)

Este archivo fija lo que comparten las nueve secciones del lote 2 (§1 a §13) y, desde el lote 3, las once secciones de Booking (**§14 a §24**, #860 a #877; las reglas de §1 a §5 valen también para Booking salvo donde §15 las amplía). Cada sección tiene su contrato corto con el mismo esqueleto:

| Sección (plan §4.1) | Contrato | Variantes |
| --- | --- | --- |
| M2 Hero | `hero.md` | `GbHero01` · `02` · `03` |
| M3 Features | `features.md` | `GbFeatures01` · `02` · `03` |
| M4 Stats | `stats.md` | `GbStats01` · `02` · `03` |
| M5 Testimonials | `testimonials.md` | `GbTestimonials01` · `02` · `03` |
| M7 CTA | `cta.md` | `GbCta01` · `02` · `03` |
| M8 FAQ | `faq.md` | `GbFaq01` · `02` · `03` |
| M11 Newsletter | `newsletter.md` | `GbNewsletter01` · `02` · `03` |
| M13 Blog list | `blog-list.md` | `GbBlogList01` · `02` · `03` |
| M14 Footer | `footer.md` | `GbFooter01` · `02` · `03` |

Tags: `gb-hero-01`, `gb-features-02`, `gb-blog-list-03`… (#764). Sin clases `gb-*`: no hay CSS.

---

## 1. Reglas comunes (todas las secciones)

1. **Cero CSS y cero utilidades** (#763, #807, #814; `api.md` «Grana Blocks» regla 3). Cada variante es un `.vue` sin `<style>` y sin archivo `.css`, y no pone clases utilitarias (`g-p-*`, `g-text-*`, `g-flex`…): las utilidades son ajuste puntual de la aplicación y su hoja es opcional, así que un bloque que dependiera de ellas se rompería donde no se cargan. Las únicas clases que un bloque escribe son **contratos de otras primitivas**: las pistas `g-adapt-*` de `GAdaptiveLayout` (#364). `g-bleed` la pone la aplicación en la raíz del bloque si quiere la banda a sangre dentro de un `GContainer` (llega por `$attrs`).
2. **Solo API pública de `@grana/vue`** (#792): `@grana/vue` (principal), `@grana/vue/hero` y `@grana/vue/tag`, todas *peer*. Nunca `__shared`, clases internas (`.g-card__*`) ni el DOM interno de un componente. Un bloque no busca nodos dentro de lo que compone.
3. **Una sola `interface Props` por sección**, compartida por sus tres variantes (#763). En el código, las tres importan **el mismo objeto** `props` (y `emits`) de `props.js` de la sección: así la igualdad no depende de copiarlas bien. Una variante no añade props y lo que no usa lo ignora en silencio, **también frente a lo que compone**: no pasa a un componente una prop o un slot que su forma no usa (p. ej. `detail` a un `GHero` que no es `window`), para que el mismo banco de datos no haga avisar a ninguna variante (`api.md` «Grana Blocks» regla 7).
4. **Distribución solo con primitivas:** `GSection` (encabezado y cuerpo), `GStack` (un eje), `GContainer` (medida de lectura, anidado sin margen), `GAdaptiveLayout` (reparto por tamaño), `GSurface zone="brand"` (banda de marca). **`GCardGroup` no es una rejilla** (#603: es una barra de tarjetas que filtran, `role="toolbar"`): ninguna sección de Marketing lo usa (corrige el plan §4.1). **Columna de lectura dentro de una sección (#845):** `GContainer width="reading"` lleva siempre `horizontal="start"`; centrada, la columna flota a la derecha del título de la sección (que va al inicio). Sin sección (una columna suelta de página) el `center` por defecto sigue valiendo.
5. **Listas reales** (1.3.1):
   - **Rejilla** (elementos lado a lado): `GAdaptiveLayout` con `role="list"` en su raíz (llega por `$attrs`; no tiene prop de etiqueta, #343) y cada elemento envuelto en un `div role="listitem"` hijo directo, con la **misma pista de familia** en todos (`g-adapt-standard` o `g-adapt-wide`, según la sección) para que se repartan igual. El contenido (una `GCard`, un `GMetric`) va dentro del envoltorio.
   - **Lista en columna:** `GStack as="ul"` (o `ol`) con `GCard as="li"` o un `li` por elemento. `GStack` quita las marcas del navegador y pone `role="list"` (#827): el bloque no lo repite.
   - Una lista de un solo elemento sigue siendo lista.
6. **Encabezados por anidación** (#720, #817; `api.md` «Grana Blocks» regla 8): el título de una sección lo pone su `GSection` (nivel automático). Lo que el bloque titula **dentro** (títulos de `GCard`, de `GAccordion`) va un nivel por debajo, leído en el `setup` con `useSectionLevel()` de `@grana/vue`: `sección = min(level, 4)`, `dentro = min(sección + 1, 6)`. Cuando el título de la sección es el de una `GCard` (CTA 02, Newsletter 02), la tarjeta lleva `min(level, 6)`. **Nunca un `hN` suelto** (sin estilo, sin nivel). **Un solo `h1` por página: el de `GHero`**; ningún otro bloque pinta `h1`.
7. **Texto solo donde un componente lo tipografía:** props y slots de `GSection` (`title`, `description`), `GCard` (`eyebrow`, `title`, `description`, cuerpo), `GHero`, `GMetric`, `GAccordionItem`, `GInput` (`label`, `hint`, mensajes), `GEmpty`. Los elementos semánticos sin componente (`p`, `blockquote`, `figure`, `figcaption`, `cite`, `time`, `address`, `ul`/`li`) se permiten **dentro** de esas regiones y heredan su texto. Si la auditoría de coco encuentra texto sin estilo, es un **hallazgo para lima** (prop o primitiva), nunca CSS del bloque. **Texto suelto (#841, #856):** el que no va en una prop de componente (la cita y su pie, `assurance`, `legal`, `address`, horario, nota, la marca sin enlace, párrafos de una respuesta o de la descripción de Stats 03) va en **`GText`** de `@grana/vue` (`design/contracts/text.md`), con el reparto de §11 B-L5. `GText` es un componente, no una utilidad: la regla 1 no la prohíbe. Hasta que bruno cambie el bloque y la auditoría de coco lo confirme, una sección con hallazgo de texto sin estilo sigue en `draft`.
8. **Enlaces y botones = `GBtn`** (o el enlace propio de `GCard interaction="link"` y de `GTag href`). Ningún `<a>` desnudo: sin CSS quedaría con el estilo del navegador y sin área táctil garantizada. Un enlace suelto es `GBtn variant="link"`; una acción, `GBtn` con la jerarquía de §3.
9. **Imágenes:** las del bloque (`Media`, §2) son `<img>` con `width`, `height`, `alt` (o `alt=""` con `decorative`), `loading="lazy"` y `decoding="async"`, dentro del slot `media` de `GCard` o de `lead`. **Nunca `fetchpriority="high"`**: la foto prioritaria de la página es la de `GHero` (#726, H-L5).
10. **Nada se mueve solo** (2.2.2): ni carrusel, ni autoavance, ni cifras que cuentan, ni aparición al desplazar. El único movimiento de un bloque es el de los componentes que compone (la mirada y el fundido de `GHero`, el plegado de `GAccordion`), con su movimiento reducido. No hay rúbrica de movimiento propia del bloque; coco la aplica a lo compuesto en su auditoría (#766).
11. **Sin `fetch`, sin estado de negocio, sin región viva propia** (#780, #792). Los bloques emiten intención (§4); lo que se anuncia es de los componentes (`output` de `GInput`, `GBtn loading`) o de la aplicación (`GToast`).
12. **Textos de Grana en `labels`, sin valores por defecto** (#226). Solo hay `labels` donde el bloque escribe algo que no viene en los datos (nombre de un grupo, «se abre en otra pestaña», la cuenta de una búsqueda). Falta uno que el estado necesita: aviso C5 y se pinta sin ese texto (el control sigue funcionando).
13. **Raíz:** cada variante tiene **un** elemento raíz (el de su primitiva exterior) que recibe `$attrs` (`class`, `style`, `id`, `aria-*`, `data-*`) y lleva **`data-gb="<sección>-<nn>"`** (`data-gb="features-01"`): identifica el bloque para pruebas y para los avisos que cuentan bloques en el documento; **no es un gancho de estilo** (nadie lo selecciona en CSS).
14. **SSR y efectos:** importar un bloque no toca `document` ni `window` (#444); los avisos que miran el documento corren en `onMounted`. Ids con `useId()` (SSR-seguro).

## 2. Tipos compartidos

Escritos a mano en `packages/blocks/types/marketing.d.ts` (bruno) y reexportados desde `dist/marketing.d.ts`; los `meta.json` los citan por nombre (§6). `[key: string]: unknown` **no** se admite en estos tipos: un dato de marketing con un nombre mal escrito debe fallar al compilar (al contrario que #443 límite (b), que protege datos de la aplicación en componentes genéricos).

```ts
/** Imagen. La forma de `GHero` (`hero.md` «Props»), para que una misma foto sirva al héroe y a una tarjeta. */
type Media = {
  src: string
  srcset?: string
  sizes?: string
  width: number            // obligatorios: reservan el hueco (CLS 0)
  height: number
  alt?: string             // informativa
  decorative?: boolean     // alt="" (lo que dice ya lo dice el texto)
  credit?: string          // solo lo pinta GHero
}

/** Una acción. La jerarquía (cuál es la principal) la pone la sección, no el dato (§3). */
type Action = {
  id?: string | number     // identidad en `activate`
  label: string
  href?: string            // con href: enlace (`navigate`); sin href: botón (`activate`)
  icon?: string            // nombre canónico de Lucide; la aplicación lo registra con `createIcons` si no es de la librería (#200)
  external?: boolean       // otro sitio: target="_blank" rel="noopener", marca `external-link` y labels.external; sin `navigate` (#574)
}

/** Un enlace de navegación (pie, legales, redes, canales). */
type NavLink = {
  label: string
  href: string             // también tel:, mailto:, https://wa.me/…
  external?: boolean
  current?: boolean        // aria-current="page"
  lang?: string            // idioma del texto del enlace («English»), 3.1.2
  hreflang?: string        // idioma del destino
}

type LinkGroup = { title: string; links: NavLink[] }

type Brand = { name: string; href?: string; logo?: Media }

type Feature = {
  id?: string | number
  title: string
  description?: string
  icon?: string            // Lucide (como Action.icon)
  media?: Media
  action?: Action          // «la ventaja lleva a su prueba» (features.md, #819)
}

type Stat = {
  id?: string | number
  value: string | number   // la cifra tal como se lee («4,8», «12», «1998»); el bloque no formatea ni anima
  unit?: string            // «habitaciones», «%»
  label: string
  source?: string          // de dónde sale («Google, octubre de 2026»); stats.md, #820
}

type Testimonial = {
  id?: string | number
  quote: string            // texto plano; párrafos separados por una línea en blanco
  lang?: string            // idioma de la cita si no es el de la página (3.1.2)
  author: { name: string; role?: string; avatar?: string }   // avatar: URL de la foto (GAvatar src)
  source: { label: string; href?: string; external?: boolean }   // dónde se publicó; testimonials.md, #821; obligatoria desde #865
}

type Faq = {
  id?: string              // ancla estable de la pregunta (#482); faq.md, #823
  question: string
  answer: string           // texto plano; párrafos separados por una línea en blanco (rico: slot `answer`)
}

type Post = {
  id?: string | number
  title: string
  href: string
  date: string             // ISO 8601 (AAAA-MM-DD o fecha y hora)
  updated?: string         // ISO 8601; blog-list.md, #825
  excerpt?: string
  media?: Media
  tags?: string[]          // etiquetas estáticas (GTag sin href)
  external?: boolean
}

/** Reservado para M9 Team (fuera del lote 2): se fija aquí para que no cambie de forma. */
type Member = { id?: string | number; name: string; role: string; avatar?: string; bio?: string; links?: NavLink[] }

/** El de `price.md` (#769), importado de `@grana/vue/price`. Ninguna sección del lote 2 lo usa. */
type Money = import('@grana/vue/price').Money
```

**Identidad de los elementos:** `id` si existe; si no, el índice (clave de `v-for`). Un `id` repetido en la misma lista avisa (C3) y se usa el índice.

## 3. Acciones: jerarquía por posición

Una sección con `actions: Action[]` pinta **como mucho dos** (la tercera y siguientes se ignoran con aviso C8): **la primera es la principal** (`GBtn variant="solid"`), **la segunda, secundaria** (`variant` según la sección: `link` en el héroe, `outline` en el resto). Así una página construida con bloques tiene una sola principal sólida por región sin que la aplicación lo cuide (`form.md` §6, #762). `Action.icon` va en el slot `prepend` del `GBtn` con `GIcon` decorativo. Con `external`, el `GBtn` lleva `target="_blank"`, `rel="noopener"`, en `append` `GIcon name="external-link"` **decorativo** (el hueco `append` de `GBtn` es `aria-hidden`) y el nombre en el control: **`aria-label="{label}, {labels.external}"`** («Instagram, se abre en otra pestaña»; empieza por el texto visible, 2.5.3). Sin `labels.external`, aviso C5 y sin `aria-label` (#832, corrige la versión anterior de este párrafo, que ponía el nombre en el icono). Vale igual para `NavLink` y la fuente de una opinión; en una tarjeta-enlace (`GCard interaction="link"`) la marca con `label` va dentro del título.

## 4. Eventos de intención (comunes)

Declarados en `emits` de `props.js` (si no, la escucha llega al nodo nativo por `$attrs`).

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href, item }` | Activación de un enlace del bloque (`Action`, `NavLink`, `Post`, `Feature.action`) **solo** con clic primario sin modificadores ni `defaultPrevented`, o Intro (#505); **nunca** con `external` (#574). Síncrono, antes de la navegación: `event.preventDefault()` deja la navegación al router de la aplicación. En `GCard interaction="link"` se reemite el `navigate` de la tarjeta (ya trae la guarda) |
| `activate` | `{ event, item }` | Una `Action` **sin** `href` (abrir el diálogo de reserva, desplegar la consulta) |
| `submit` | `{ event, email }` | Solo Newsletter (`newsletter.md`), tras la validación de `GForm` |

**`item`** es el elemento de datos que lleva el enlace (#833): la `Feature`, el `Post`, la `Testimonial`, el `NavLink` o la `Brand`, y la `Action` cuando es una acción de la sección (`actions`). Los enlaces `tel:`, `mailto:` y `sms:` **no** emiten `navigate`: los abre el sistema (#834).

`select` queda **reservado** para las secciones con elección (Pricing, ofertas; P1). Ninguna sección del lote 2 tiene estado propio que la aplicación deba sincronizar (sin `v-model`).

## 5. Avisos de desarrollo comunes

Guarda canónica de #653 en el sitio de cada texto (`try { if (process.env.NODE_ENV !== 'production' …) … } catch {}`), una vez por instancia y motivo, prefijo `[Grana Gb<Sección><NN>]`. **El bloque no repite** los avisos que ya da lo que compone (`GSection` sin `title`, `GHero` sin `width`/`height`, `GCard` sin `labels.expand`…): añade solo los suyos.

| # | Motivo | Qué pasa |
| --- | --- | --- |
| C1 | La lista principal de la sección está vacía (`items`, `posts`) | No pinta nada (comentario de Vue) |
| C2 | Un elemento sin su campo obligatorio (`title`, `question`, `quote`, `label`, `href`, `value`…) | Ese elemento se omite |
| C3 | `id` repetido en una lista | Se usa el índice |
| C4 | `Media` sin `width`/`height`, o sin `alt` ni `decorative` | Se pinta con `alt=""` y sin reservar hueco |
| C5 | Falta un texto de `labels` que el estado actual necesita | Se pinta sin ese texto |
| C6 | `href` con esquema `javascript:` | Se ignora el enlace: en una acción o un `NavLink`, `GBtn` deshabilitado con su texto; en una tarjeta, la tarjeta sin interacción (#834) |
| C7 | Más elementos de los recomendados por la sección (tope en su contrato) | Se pintan todos |
| C8 | Más de dos `actions` | Se pintan las dos primeras |

## 6. Archivos, `meta.json` y tipos (#443, #815; encargo a bruno)

```
packages/blocks/src/blocks/
  common/                       ← internos del paquete (no es `__shared` de @grana/vue): navigate con la guarda, acciones → GBtn, avisos, párrafos, medios
  GbFeatures/
    props.js                    ← `props` y `emits` de la sección (un solo objeto, importado por las tres variantes)
    GbFeatures01.vue  GbFeatures02.vue  GbFeatures03.vue
    GbFeatures.meta.json        ← uno por sección, compartido
    GbFeatures.test.js          ← las tres variantes con el mismo banco
    features.bank.js            ← banco de datos falsos único (§7)
    README.md                   ← mora-docs
  …
packages/blocks/src/marketing.js ← índice de la entrada: exporta las 27 variantes (puras) y el plugin `marketing` que las registra
packages/blocks/types/marketing.d.ts ← tipos de §2, a mano
```

**`Gb<Sección>.meta.json`** (forma de los `meta.json` de `@grana/vue`, con dos campos más): `name` (`"GbFeatures"`), `kind: "block-section"`, `family: "marketing"`, **`variants`** (`[{ "name": "GbFeatures01", "tag": "gb-features-01", "concept": "Rejilla" }, …]`), `props`, `events`, `slots` (con `variants` en el slot que solo usa alguna), `types` (nombres de §2 que cita), `status: "draft"` hasta la auditoría de coco, `bundle: { entry: "@grana/blocks/marketing", measured: <B gzip> }`.

**`packages/blocks/scripts/build-types.mjs`** (hoy escribe `export {}`) pasa a: (1) leer cada `src/blocks/Gb*/Gb*.meta.json` con `kind: "block-section"`; (2) escribir en `dist/marketing.d.ts` **un** `export interface Gb<Sección>Props` por sección y, por cada variante, `export declare const Gb<Sección><NN>: DefineComponent<Gb<Sección>Props, …emits>` **con ese mismo tipo**; (3) reexportar los tipos de `types/marketing.d.ts`; (4) ampliar `GlobalComponents` de Vue con las 27 variantes; (5) **detenerse** si una variante del `meta.json` no se exporta en `src/marketing.js`, si una exportación no consta en ningún `meta.json` o si un tipo no se sabe leer (como #443). La entrada de Gestión (`dist/blocks.d.ts`, `GResourceList`) sigue su propio camino. Una prueba de tipos del paquete (`src/types.test.js` con `vue-tsc`, que recorre las secciones desde los `meta.json` con `kind: "block-section"`, sin lista a mano, #836) comprueba que el banco de cada sección compila con las tres variantes y que un campo de §2 mal escrito falla (límite (a) de #443: una prop obligatoria ausente en plantilla no se detecta sin `strictTemplates`).

**Paquete:** `exports` gana `"./marketing": { "types": "./dist/marketing.d.ts", "import": "./dist/marketing.js", "default": "./dist/marketing.js" }`; `vite.config.js`, entrada `marketing` además de la principal; `@grana/vue`, `@grana/vue/hero`, `@grana/vue/tag` y `vue`, externos. Cada variante se exporta con `/* @__PURE__ */` y el índice no tiene efectos (sin `import './components.css'` en la entrada de Marketing: no hay CSS).

**Peso (#793, #844; `api.md` «Grana Blocks» reglas 5 y 6):** **`dist/marketing.js` ≤ 18 KiB (18 432 B) gzip** y **una variante importada sola ≤ 4 KiB (4 096 B) gzip** (esbuild, `vue` y `@grana/vue*` externos), medidos con `gzip -c` como la primera medida (16 934 B con las 27 variantes; parciales de 1 859 a 3 218 B, cfd4573). bruno anota la medida en cada `meta.json` (`bundle.measured` y `bundle.cap: 18432`) y en `CHANGELOG.md`; con más, vuelve a lima. `dist/blocks.js` (Gestión, tope de 8 KiB de #793) **no crece**.

## 7. Banco de datos falsos (uno por sección)

`<seccion>.bank.js` exporta `{ props, slots }`: **un** juego de datos que pasa **igual** por las tres variantes en Vitest, en el playground y en el spec. Tema común: el hotel boutique de Oaxaca del inventario (Casa Alcalá; fotos con las proporciones de `design/lab/marketing/r01/fotos.js`, servidas en local). Cada banco cubre, además de lo que pide su contrato: **un texto largo con una palabra sin espacios** (`Donaudampfschifffahrt…`, prueba de 320 px), **un elemento en inglés** con `lang="en"` donde el tipo lo admite, **un enlace externo** y **un elemento mínimo** (solo los campos obligatorios). El banco **no** lleva errores a propósito: con él, ninguna variante avisa (criterio de §8).

## 8. Verificación común (además de la de cada sección)

**bruno, Vitest + jsdom (`packages/blocks`):**
1. Por sección, las tres variantes montadas con el banco: **ningún aviso** de Vue (`app.config.warnHandler`) ni `[Grana …]` (`console.warn` capturado), tampoco de los componentes compuestos.
2. `GbX01.props === GbX02.props === GbX03.props` (mismo objeto) y lo mismo con `emits`; las claves coinciden con el `meta.json`.
3. HTML semántico: raíz con `data-gb`; listas (`role="list"` + `role="listitem"` hijos directos, o `ul > li`); **cero `h1`** salvo `GbHero*` (exactamente uno); niveles: título de la sección `h2` en la raíz y `h3` dentro de una `GSection` de la aplicación, y lo de dentro un nivel por debajo.
4. Sin `style` ni clases de utilidad en el HTML pintado por el bloque (expresión de §9; las clases de `GText`, `g-text` y `g-text--*`, son de un componente y no cuentan: la expresión busca `\bg-text-[a-z]`, #856; hoy `UTILITY` de `bank/harness.js` usa `\bg-(text|…)\b` y marcaría `g-text--size-body`); ningún `<a>` que no sea de un `GBtn`, una `GCard` o un `GTag`.
5. `navigate` con clic primario; **no** con Ctrl, ⌘, Mayús, Alt ni botón central; **no** con `external`; `preventDefault()` en la escucha impide la navegación. `activate` en una `Action` sin `href`.
6. Cada aviso de §5 y los propios de la sección, una vez por instancia.
7. SSR (`renderToString`) de las tres variantes sin errores ni acceso a `window` al importar.

**Playwright, Chromium (`design/lab/theme-playground/`, puerto propio 4213):** página `packages/blocks/playground/marketing/<seccion>.html` con las tres variantes del banco, una debajo de otra (**salvo el héroe: una variante por carga, `?v=01|02|03`**, porque una página tiene un solo `h1`; #836), y selector de tema: el tema por defecto y **dos temas generados con `@grana/cli`** con `typeScale`, radios y fuente de títulos distintos (los de M-L5, rústico y lujo, cuando existan; mientras, dos de los del banco del playground). Comprobar: **sin desplazamiento horizontal a 320, 390 y 1440 px** (y a 320 px con zoom de texto 200 %); un `h1` solo en la página del héroe; orden de encabezados sin saltos; foco visible al recorrer con Tab; con movimiento reducido nada del bloque anima; oscuro; consola limpia. La pasada en Firefox y WebKit se hace **una vez** al cerrar el lote (verificación por niveles).

## 9. Compuertas (bruno, en el script del paquete y en `gates.sh`)

```bash
! find packages/blocks/src/blocks -path '*/Gb*' \( -name '*.css' -o -name '*.scss' \) | grep -q .   # ningún CSS en un bloque estructural
! grep -l "<style" packages/blocks/src/blocks/Gb*/*.vue                                                # ningún <style>
! grep -qE 'class="[^"]*\bg-(m|p)[tbsexy]?-[0-9]|\bg-text-[a-z]|\bg-(font|gap|flex|grid|block|hidden|w-|h-|items|justify|self|grow|shrink|truncate|radius|sr-only)' packages/blocks/src/blocks/Gb*/*.vue  # sin utilidades (#807); g-text y g-text--* son de GText (#856)
test -f packages/blocks/dist/marketing.js && test -f packages/blocks/dist/marketing.d.ts
! grep -q "createApp" packages/blocks/dist/marketing.js
! grep -q "__shared" packages/blocks/dist/marketing.js
! grep -qE "g-[a-z-]+__[a-z]" packages/blocks/dist/marketing.js                                       # ninguna clase interna de un componente
! grep -q "GbHero01" packages/blocks/dist/blocks.js                                                    # Gestión no paga Marketing
test "$(gzip -c packages/blocks/dist/marketing.js | wc -c)" -le 18432                                  # tope de la entrada (#844)
```

Y la parcial (#844): la aplicación de prueba de importación parcial que bruno ya usa (esbuild, `vue` y `@grana/vue*` externos) mide cada una de las 27 variantes sola y falla si alguna pasa de 4 096 B gzip.

## 10. Correcciones al plan §4.1 (recogidas en #816)

| Plan | Contrato | Por qué |
| --- | --- | --- |
| Rejillas con `GCardGroup` (Testimonials, Blog) | `GAdaptiveLayout role="list"` (§1.5) | `GCardGroup` es una barra de filtros (`toolbar` + `aria-pressed`, #603) |
| Newsletter con `GInputGroup` + `GBtn` | `GInput type="email"` con el slot **`action`** («suscripción», `input.md`) | `GInputGroup` solo admite sus cuatro partes; el botón acoplado ya existe en `GInput` |
| `eyebrow` en Features | Fuera del lote (hallazgo B-L1) | `GSection` no tiene antetítulo; dentro del `hN` cambiaría el nombre del encabezado |
| Stats con `title?` | `title` obligatorio | Todo bloque con `GSection` tiene encabezado (#720); sin él, la lista de cifras no tendría nombre |
| Testimonials con `rating?` | Reservado (M-L2) | Sin `star` en la lista de la librería; una calificación a medias (sin forma visual) no se contrata |
| FAQ 02 «dos columnas pregunta/respuesta» | 02 «Todo a la vista» (`GSection` anidada por pregunta) | Dos columnas exigen tipografía de la pregunta sin `GSection`, o CSS; la sección anidada da el mismo esquema de encabezados en las tres variantes |
| Footer en `GAppShell` | El bloque **va dentro** del slot `footer` de `GAppShell` (con `as="div"`) o suelto (`footer`) | El chasis ya da el `contentinfo`; un `footer` dentro de otro es HTML inválido |
| Features 03 «columna con `dl`» | `GSection` anidada por ventaja dentro de `GContainer width="reading"` | `dt`/`dd` sin componente quedan sin tipografía; la sección anidada mantiene el mismo esquema que las tarjetas de 01 y 02 |

## 11. Hallazgos para lima (no bloquean el lote; en `PENDIENTES.md` §3)

- **B-L1 · Antetítulo en `GSection`.** Marketing lo usa mucho («Por qué Casa Alcalá»). Propuesta futura: prop `eyebrow` de `GSection` con la forma de `GCard` (fuera del `hN`, antes de él). Cambia la v1; no se contrata sin un caso de la plantilla real.
- **B-L2 · `GAdaptiveLayout` con lista nativa.** Hoy la rejilla usa `role="list"`/`listitem` porque la raíz es siempre `div` (#343). Una prop `as` (`div`/`ul`/`ol`) daría `ul > li` nativos. Reservado.
- **B-L3 · Imagen suelta.** El logo del pie es el único `<img>` fuera de un componente: sin CSS no se limita al ancho de su caja. Mientras, `Brand.logo` exige `width`/`height` y el banco usa un logo ≤ 160 px; coco lo mide a 320 px en la auditoría.
- **B-L4 · Nivel por defecto de `GCard`/`GAccordion` dentro de `GSection`** (L14 de `section.md`). `useSectionLevel()` (#817) lo resuelve para quien lo lee; que los componentes lo lean solos sigue reservado.
- **B-L5 · Texto suelto: resuelto con `GText` (#841, #851 a #856).** Ronda corta de kiwi `design/lab/text/r01/` (3063b54; reparto medido con `tx.js` `PLAN` sobre los bloques reales, 2883/2883 en tres motores) y contrato `design/contracts/text.md`: `as` `p`/`div`/`span`/`small`/`blockquote`/`figure`/`figcaption`/`address`, `size` **`body`/`body-sm`/`caption`** (con el nombre del rol, no `sm`, #851), `tone` `default`/`muted`; raíz sin margen ni cursiva, una pausa por tamaño entre bloques nativos internos, no entra en componentes. **Reparto por bloque (X-L7; lo aplica bruno, `GText` del principal de `@grana/vue`):**

  | Sección · variante | Texto suelto | `<GText>` |
  | --- | --- | --- |
  | Testimonials 01 (tarjeta) y la destacada de 02 (tarjeta) | `figure` › `blockquote` › `p` + `figcaption` › nombre y `cite` | `as="figure" size="body-sm"` › `as="blockquote" size="body-sm" :lang :cite` (sus `p` y el slot `quote` dentro) + `as="figcaption" size="body-sm" tone="muted"`. En tarjeta el contexto es `body-sm` (el cuerpo de `GCard`) |
  | Testimonials 02 (las de la lista) y 03 (panel del acordeón) | ídem | `as="figure"` › `as="blockquote" :lang :cite` + `as="figcaption" size="body-sm" tone="muted"` |
  | CTA 01 (banda de marca) y 03 (línea sobria) | `p` con `assurance` | `size="body-sm" tone="muted" :id` (igual que la descripción de la sección; en la zona de marca, `muted` es el de §44.5) |
  | CTA 02 (tarjeta) | `p` con `assurance` en el `footer` de `GCard` | `size="caption" tone="muted" :id` (el rol del pie de la tarjeta) |
  | Newsletter 01 a 03 | `p` con `legal` (y el slot `legal`) | `size="caption" tone="muted"`, hijo del `GForm` como hoy |
  | Footer 01 a 03 | `address` › `p` de líneas (con `br`) + `GStack` de canales + `p` de horario | `as="address" size="body-sm"` (en 02 solo con los canales) |
  | Footer 01 a 03 | `p` con `note` (y el slot `note`) | `size="caption" tone="muted"` |
  | Footer 01 a 03 | marca sin `href` (`p` con el logo o el nombre, `FooterBrand.vue`) | `GText` con el `size` y el `tone` por defecto (el nombre no se atenúa). **No medido por kiwi** (el banco tiene `href`): coco lo mide en la auditoría |
  | Stats 03 | `p` × n de `description` (y el slot `description`) dentro de `GContainer width="reading"` | `as="div"` envolviendo los párrafos o el slot |
  | FAQ 01 y 03 (panel de `GAccordionItem`) | `p` × n de `answer` (y el slot `answer`) | `as="div"` envolviendo los párrafos o el slot |
  | FAQ 02 (cuerpo de la `GSection` anidada) | ídem | `as="div"` envolviendo los párrafos o el slot. **No medido por kiwi** (midió 01 y 03): coco lo mide en la auditoría |

  **Reglas del reparto:** (1) La `GText` envuelve también el slot de escape del mismo texto (`quote`, `legal`, `note`, `description`, `answer`): el contenido rico de la aplicación recibe la misma tipografía y, si trae componentes, la `GText` no entra en ellos. (2) **Ningún margen ni utilidad** para separar un texto de su vecino: lo hace la primitiva que los coloca. **Newsletter:** el legal queda a **40 px** de la ayuda del campo, el `gap` de `GForm` (antes 54–56 px, márgenes del navegador sumados); si un día debe ir «con el campo», será `GStack gap="sm"` o el hueco del campo, nunca un margen. (3) `assurance` sigue con su `id` en la raíz de la `GText` (`aria-describedby` de la principal, #838). (4) `lang` y `cite` de la cita van a la raíz del `blockquote` (#821). (5) Los `peek` de `GAccordionItem` (Testimonials 03, FAQ 01/03) son de un slot del componente con rol propio: **no** llevan `GText`.

  **Verificación:** el verificador de coco (`design/lab/blocks/marketing/auditoria-verificar.mjs`) cuenta hoy como «del navegador» todo margen de un elemento sin clase `g-*`; debe aceptar el ritmo de `GText` (`space × 3 · 2,5 · 2` dentro de una `.g-text`) como margen propio (coco). La expresión de utilidades del arnés de bruno y de §9 usa `\bg-text-[a-z]` (§8 punto 4). Las secciones pasan a `candidate` cuando bruno cambie los bloques y la auditoría de coco lo confirme en los tres temas.
- **B-L6 · Línea entre tarjetas planas (#843).** `divided` de `GStack` no pinta sobre hijos con superficie (#752), tampoco sobre `GCard level="flat"`. Una lista de tarjetas planas con línea queda reservada; mientras, las separa el `gap`.
- **B-L7 · Banda de marca redondeada dentro de la columna (#830).** Las bandas de los bloques son `flat` (sin radio). Una banda con radio cuando no va a sangre queda reservada.

## 12. Encargos

- **bruno (Sonnet; Opus en Hero y FAQ, que componen `GHero` con sus tres formas y el buscador):** `useSectionLevel()` en `@grana/vue` (#817, `section.md`); `packages/blocks/src/blocks/common/`; las 27 variantes, nueve `props.js`, nueve `meta.json`, nueve bancos y nueve archivos de prueba; `src/marketing.js` y el plugin; `types/marketing.d.ts`; `build-types.mjs` (§6); `exports` y `vite.config.js`; compuertas de §9; playground `packages/blocks/playground/marketing/` y `tests/blocks-marketing.spec.mjs` (puerto 4213); medida de peso.
- **coco (Sonnet; Opus en Hero):** **solo auditoría** (#766): `auditoria-visual.md` previa y posterior por sección sobre el bloque real con el tema por defecto y los dos del CLI, y la rúbrica de movimiento sobre lo compuesto (`GHero`, `GAccordion`); todo lo que pida CSS vuelve a lima como hallazgo. Resultado en `design/lab/blocks/marketing/auditoria.md`.
- **mora-docs (Sonnet):** un `README.md` por sección con las tres variantes lado a lado, la `Props`, el banco como ejemplo y las entradas *peer* que carga la aplicación.

## 13. Remates tras la construcción (#827 a #844, 2026-10-22)

Revisión de lima tras bruno (99c1aef, f2e7888, cfd4573) y las correcciones de CSS de coco (04fd906), con la auditoría de coco en curso (`design/lab/blocks/marketing/auditoria.md`).

| # | Qué | Dónde | Quién |
| --- | --- | --- | --- |
| #827 | `GStack` con `as="ul"`/`ol`: sin marcas (CSS hecho) y `role="list"` en la raíz | `stack.md` | bruno (`GStack.vue`, prueba) |
| #828 | `GBtn variant="link"` mide su contenido; `block` gana | `btn.md` | hecho (coco); coco lo confirma en la auditoría |
| #829 | Unidad de `GMetric` en caja en línea atómica | `widget.md` «GMetric» | hecho (coco) |
| #830 | Bandas de marca `level="flat"` (Stats 02, CTA 01, Newsletter 03) | `stats.md`, `cta.md`, `newsletter.md` | bruno |
| #831 | Hero 02 con menos de dos vistas = `window` sin `detail` + H1 | `hero.md` | hecho (bruno) |
| #832 | Enlace externo: `aria-label` en el control, marca decorativa | §3 | hecho (bruno) |
| #833 | `item` = elemento de datos; slot `item` = cuerpo | §4, `features.md` | hecho (bruno) |
| #834 | C6 (deshabilitado o tarjeta sin interacción); `tel:`/`mailto:`/`sms:` sin `navigate` | §4, §5 | hecho (bruno) |
| #835 | `id` de `GbHero*` = `id` de `GHero` | `hero.md` | hecho (bruno); mora-docs lo dice en el README |
| #836 | Héroe una variante por carga; prueba de tipos desde los `meta.json` | §6, §8 | hecho (bruno) |
| #837 | Testimonials 01/02: tarjeta `role="group"` con el nombre del autor | `testimonials.md` | hecho (bruno) |
| #838 | `assurance`: `describedby` en `GbActions`; slot `actions` con `{ describedby }` | `cta.md` | bruno (alcance del slot, `meta.json`, prueba) |
| #839 | Newsletter: `ValidityState` + `labels.invalid`/`labels.required` | `newsletter.md` | bruno |
| #840 | Newsletter: `labels.form` → `labels` de `GForm` | `newsletter.md` | bruno |
| #841 | Texto suelto → primitiva de texto (B-L5); secciones con el hallazgo siguen en `draft` | §1 regla 7, §11 | confirmado por el usuario (2026-10-22); kiwi (3063b54) y lima (#851 a #856) hechos; coco, bruno |
| #842 | `media` de `GCard` adopta la caja de `GAvatar` | `card.md` | coco (`GCard.css`) |
| #843 | Blog list 02 sin `divided`, `gap="sm"` | `blog-list.md` | bruno |
| #844 | Topes: 18 KiB la entrada, 4 KiB una variante | §6, §9, `api.md` | bruno (compuertas y `bundle.cap`) |
| #845 | `GContainer width="reading"` dentro de una sección con `horizontal="start"` (MK-B2) | regla 4, `features.md` 03, `faq.md` 02 | bruno |
| #846 | Pista `g-adapt-wide` en el `nav` de Footer 01/03 (MK-B3) | `footer.md` | bruno |
| #847 | Los `div role="listitem"` de una rejilla llenan su fila y la tarjeta llena el elemento (MK-L2); B-L2 sigue reservado | `adaptive-layout.md` «DOM, CSS…» | coco (`GAdaptiveLayout.css`) |
| #851 a #856 | `GText` contratada (`text.md`); reparto por bloque de B-L5; expresión de utilidades con `\bg-text-[a-z]`; el verificador acepta el ritmo de `GText` | §1 regla 7, §8, §9, §11 B-L5 | coco (`GText.css`, verificador, auditoría), bruno (`GText.vue`, seis bloques, arnés) |
| #848 | Título de `GAccordionItem` dentro de un `GSection` al escalón anidado (MK-C5) | `accordion.md` | coco (`GAccordionItem.css`) |
| #849 | `widget.md` describe el comportamiento de la unidad y el tamaño de `context` (MK-C1, MK-C2) | `widget.md` | hecho (coco; lima el contrato) |
| #850 | Peso de `GStack`: +40 B por `role="list"`; pila y sección ≈ 1421 B de 1536 | `stack.md` | anotado |


---

# Parte B · Booking (`@grana/blocks/booking`, lote 3)

**Estado:** contratado (DECISIONS.md **#860 a #877**, 2026-10-22; decisión del usuario del 2026-10-22: «Arranca el lote 3 (Booking) según el plan §4.3 y §5: lima contrata las secciones y seguimos el flujo reducido») · **Plan:** `design/lab/blocks/plan.md` §4.3 y §5 (lote 3) · **Flujo:** reducido (#766) · **Usuario final:** el mismo viajero en el teléfono (§ cabecera), ahora **a mitad de una reserva**: ya dijo fechas y personas, compara, elige, da sus datos y guarda la confirmación. Plantillas: hotel (Casa Alcalá), restaurante y tour de `design/lab/marketing/r01/`.

## 14. Secciones del lote

| Sección (plan §4.3) | Contrato | Variantes | Parte de bruno |
| --- | --- | --- | --- |
| B1 Search | `search.md` | `GbSearch01` La frase · `02` La barra · `03` La que acompaña | A |
| B2 Offer list | `offer-list.md` | `GbOfferList01` Tarjetas · `02` Renglones · `03` Rejilla compacta | A |
| B6 Guest form | `guest-form.md` | `GbGuestForm01` Una página · `02` Por pasos · `03` Con lo pedido a la vista | A |
| B7 Confirmation | `confirmation.md` | `GbConfirmation01` Tarjeta · `02` Lo que sigue · `03` Captura | A |
| B8 Itinerary | `itinerary.md` | `GbItinerary01` Lista con hora · `02` Por días · `03` Tabla | B |
| B10 Location | `location.md` | `GbLocation01` Tarjeta con mapa · `02` Dos columnas · `03` Puntos de encuentro | B |
| B11 Policies | `policies.md` | `GbPolicies01` Avance · `02` Todo a la vista · `03` Tarjetas | B |
| B3 Offer detail | `offer-detail.md` | `GbOfferDetail01` Espacios + ficha · `02` Tira + pestañas · `03` Lectura larga | B |
| B5 Booking summary | `booking-summary.md` | `GbBookingSummary01` Tarjeta · `02` El recibo · `03` Línea | C |
| B9 Menu | `menu.md` | `GbMenu01` Carta · `02` Por tiempos · `03` Platos con foto | C |
| B4 Availability | `availability.md` | `GbAvailability01` Calendario con precio · `02` Próximas fechas · `03` Calendario + resumen | C |
| B12 Reviews | — (**reutiliza `GbTestimonials`**, §22) | — | — |

Tags `gb-search-01`, `gb-offer-list-02`, `gb-booking-summary-03`… (#764).

## 15. Reglas comunes de Booking (amplían §1 a §5)

1. **Todo lo de §1** (cero CSS y utilidades, solo API pública, una `interface Props`, primitivas, listas reales, encabezados por anidación con `useSectionLevel()`, texto suelto en `GText`, enlaces = `GBtn`/`GCard`/`GTag`, imágenes sin prioridad, nada se mueve solo, sin `fetch` ni región viva, `labels` sin valores por defecto, raíz con `data-gb`, SSR) y la jerarquía de acciones de §3. **Ningún bloque de Booking pinta `h1`** (el de la página es de `GHero` o del `GPageHeader` de la aplicación).
2. **Entradas *peer* que compone** (todas públicas, #792): `@grana/vue` (principal: `GSection`, `GStack`, `GContainer`, `GAdaptiveLayout`, `GCard`, `GText`, `GBtn`, `GIcon`, `GBadge`, `GSummary`, `GMetric`, `GAccordion`, `GTabs`, `GTable`, `GStepper`, `GDatePicker`, `GForm` y campos, `GErrorSummary`, `GFormActions`, `useSectionLevel`), **`@grana/vue/booking`** (`GBookingBar`, `GPartyField`, `describeQuery`, §16), **`@grana/vue/gallery`** (`GGallery`, `GGalleryViewer`), **`@grana/vue/price`** (`GPrice`, `GPriceScope`, `formatPrice`) y `@grana/vue/tag` (`GTag`). El README de cada sección dice qué entradas carga la aplicación.
3. **La consulta es el hilo** (#864, personalidad de familia). Toda sección que habla de lo pedido recibe **el mismo objeto `BookingQuery`** (§16) que emitió la búsqueda y lo dice **con las mismas palabras** que la consulta, con **`describeQuery`** de `@grana/vue/booking` (enmienda de `booking-bar.md`, #862): ninguna sección vuelve a formatear fechas, noches o personas por su cuenta. Para decirla necesita `partyRows` (las filas de `GPartyField`) y `labels.query` (§16 `QueryLabels`); con `query` y sin ellas, aviso K2 y la línea de la consulta no se pinta.
4. **Precios solo con `GPrice`** (`price.md`): un precio de dato es un **`PriceSpec`** (§16) que va **tal cual** a las props de `GPrice` (sin renombrar); una región de precios (`prices: PriceRegion`) envuelve la lista o la tarjeta en **un** `GPriceScope` (la moneda se dice una vez, #772) y sus `labels.price` van a la región (los `GPrice` de dentro los heredan). **Grana no suma, no multiplica ni convierte** (#769): el total de lo pedido (`PriceTotal`, `Totals`) lo da la aplicación. En texto llano (un `GSummary`, `GMetric`), `formatPrice(…).text` con su límite conocido (el lector lee el símbolo, `price.md` «Límites»).
5. **Pasos directos de `labels`** (#761, #840): los textos de un componente compuesto viajan **tal cual** en una clave con su nombre (`labels.price` → `GPriceScope`, `labels.gallery` → `GGalleryViewer`/`GGallery`, `labels.datePicker` → `GDatePicker`, `labels.bar` → `GBookingBar`, `labels.party` → `GPartyField`, `labels.form` → `GForm`, `labels.errorSummary` → `GErrorSummary`, `labels.stepper` → `GStepper`). El bloque no los completa ni avisa por ellos: avisa el componente con su prefijo.
6. **Fechas y horas** (1.3.1, 3.1): toda fecha u hora visible va en **`<time datetime>`** (ISO) con el texto de `Intl.DateTimeFormat(locale)` (día de la semana en palabras cuando ayuda a planear: «viernes, 13 de noviembre»); **sin fechas relativas** («mañana», «en 3 días»: cambian con la caché, #825) salvo el «ahora» de Itinerary (§`itinerary.md`) y lo que dice **`describeQuery`** (la consulta de una mesa dice «hoy»/«mañana» como la barra, #884: la consulta se dice con las mismas palabras en todas partes; el riesgo de caché lo asume quien monta la sección con `kind: 'table'`, que ya lo asumía la barra). `locale`: la prop `locale` de la sección › el `lang` del ancestro (leído en `onMounted`, como `GPrice`) › `navigator.language`; en SSR sin `locale`, la fecha ISO canónica y se reformatea al montar (como `GPrice`, #775). **Las horas del lugar** (Itinerary, Location, Confirmation) se dicen en la zona del lugar (`timeZone` IANA de la sección), no en la del teléfono del viajero.
7. **Lo no disponible se dice, no se esconde** (1.4.1): una oferta, un plato, un turno o un día que no se puede elegir **sigue a la vista** con su motivo en texto (`available: false` → `labels.unavailable`; String → ese texto) y sin acción de elegir; nunca solo atenuado ni quitado de la lista.
8. **Intenciones con objeto** (§17): `select`, `book`, `submit`, `photos`. La carga lleva siempre **el dato entero** (`offer`, `day`) y **la consulta** (`query`) si la sección la recibió, para que la aplicación arme su enlace a su motor o a WhatsApp sin volver a buscarla. Nada navega ni reserva por su cuenta.
9. **Estado de interfaz, sí; de negocio, no.** Un bloque de Booking puede guardar estado **de vista** (qué visor está abierto, la pestaña, el paso del formulario, los valores que se están escribiendo) y emitirlo con `update:*` cuando la aplicación pueda necesitarlo (`v-model:query`, `v-model:values`, `v-model:value`, `v-model:step`); **no** calcula disponibilidad, precios ni totales.

## 16. Tipos compartidos de Booking (#861)

En `packages/blocks/types/booking.d.ts` (a mano, bruno), reexportados desde `dist/booking.d.ts`; sin `[key: string]: unknown` (como §2). Reutilizan `Media`, `Action`, `NavLink` de §2 (los reexporta también la entrada de Booking) y los tipos de `@grana/vue/price` y de `@grana/vue/booking`.

```ts
// ── De @grana/vue (no se redefinen) ──
type Money = import('@grana/vue/price').Money               // { amount, currency, approximate? } (#769)
type PriceTotal = import('@grana/vue/price').PriceTotal     // { value: Money | Money[], label } (#773)
type PriceLabels = import('@grana/vue/price').PriceLabels

/** Foto de GGallery (`gallery.md` «Datos de foto»). Si `@grana/vue/gallery` no exporta el tipo,
 *  bruno lo escribe con esa forma y una prueba de tipos comprueba que es asignable a `photos`. */
type Photo = { src: string; thumb?: string; srcset?: string; sizes?: string; thumbSrcset?: string; thumbSizes?: string
               width: number; height: number; alt: string; caption?: string; group?: string | number; id?: string | number }
type PhotoGroup = { value: string | number; label: string; id?: string }   // `groups` de GGallery

/** Fila de GPartyField (`booking-bar.md` «Filas»). Mismo criterio que Photo. */
type PartyRow = { key: string; label: string; hint?: string; min?: number; max?: number | ((v: Record<string, number>) => number)
                  default?: number; unit?: string | ((count: number) => string); decrementLabel: string; incrementLabel: string }
type Party = Record<string, number>                          // el modelo de GPartyField

// ── La consulta (el hilo) ──
type BookingKind = 'stay' | 'table' | 'tour'
/** El modelo de GBookingBar (`booking-bar.md` «Modelo») más su `kind`: lo que sale del `submit` sin `event` ni funciones. */
type BookingQuery =
  | { kind: 'stay'; from: string | null; to: string | null; party: Party }     // ISO sin zona
  | { kind: 'table'; date: string | null; time: string | null; party: Party }  // time = value del turno
  | { kind: 'tour'; tour: string | number | null; date: string | null; party: Party }
/** Textos para decir la consulta: las claves de GBookingBar con el mismo significado (#862). */
type QueryLabels = { nights: string | ((n: number) => string); separator: string; checkout?: string
                     noDates?: string; noDate?: string; noTime?: string; noTour?: string }
type QueryContext = { partyRows: PartyRow[]; times?: { value: string; label?: string }[]; tours?: { value: string | number; label: string }[] }

// ── Precio ──
/** Lo que va tal cual a GPrice (sin renombrar: mismas claves que sus props). */
type PriceSpec = { value: Money | Money[] | null; max?: Money | Money[]; compareAt?: Money | Money[]; compareLabel?: string
                   lead?: string; unit?: string; unitLabel?: string; total?: PriceTotal }
/** Lo que va a GPriceScope (una región por lista o tarjeta). */
type PriceRegion = { currency: string; view?: string; legend?: boolean; taxes?: string; locale?: string }
/** Lo que cobra el lugar, ya calculado por la aplicación. */
type Totals = { lines?: { label: string; amount: Money | Money[]; note?: string }[]; total: PriceTotal; note?: string }

// ── Ofertas ──
type OfferFact = { label: string; value: string; group?: string | number }   // ya formateado; `group` = espacio de la galería que lo enseña
type Offer = {
  id: string | number            // obligatorio: identidad en `select`
  name: string
  lang?: string                  // idioma del nombre, resumen y detalles si no es el de la página (3.1.2, #885); va a la raíz de lo que los pinta
  kind?: string                  // antetítulo: «Suite», «Mesa en terraza», «Recorrido a pie»
  summary?: string               // una línea
  photos?: Photo[]               // la primera es la portada; «Ver fotos» con dos o más
  facts?: OfferFact[]            // capacidad, m², cama, duración (≤ 4 a la vista; C7 por encima de 6)
  perks?: string[]               // «Desayuno incluido», «Cancelación gratis»
  price?: PriceSpec
  badge?: string                 // texto corto («La más pedida»); nunca solo color
  available?: boolean | string   // false: labels.unavailable; String: el motivo visible («Solo quedan 2» no es esto: va en badge)
  href?: string                  // página de la oferta (la tarjeta es enlace)
  external?: boolean
}
type OfferSection = { id?: string; title: string; body?: string; items?: string[] }   // «Qué incluye», «No incluye», «La cama»
type OfferDetail = Offer & { description?: string; groups?: PhotoGroup[]; sections?: OfferSection[] }

// ── Disponibilidad ──
type DayStatus = 'open' | 'few' | 'full' | 'closed'
type AvailabilityDay = { date: string; status: DayStatus; price?: PriceSpec; note?: string }   // note: «Quedan 2», «Solo terraza»

// ── Datos de quien reserva ──
type GuestField = {
  name: string; label: string
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'date'   // lista cerrada; por defecto 'text' (guest-form.md)
  autocomplete?: string          // token de HTML (`given-name`, `tel`, `email`…), 1.3.5
  required?: boolean; hint?: string; placeholder?: string
  why?: string                   // por qué se pide («Para avisarte si cambia el clima»); se suma a la ayuda
  options?: { value: string; label: string }[]   // solo `select`
  group?: string                 // grupo (`groups` de la sección)
  row?: string                   // campos con el mismo `row` comparten GFormRow
  messages?: { required?: string; invalid?: string }
}
type GuestGroup = { id: string; title: string; description?: string }
type Consent = { name: string; label: string; required?: boolean; link?: NavLink; policy?: string; linkLabel?: string }   // policy = id de una Policy; linkLabel = texto del enlace `#policy` cuando no hay `link` (#880)
type Policy = { id?: string; title: string; summary?: string; body: string; icon?: string; link?: NavLink }

// ── Confirmación y contacto ──
type Reference = { code: string; label: string }             // «A7K-29Q», «Código de reserva»
type Channel = NavLink & { icon?: string; hint?: string }    // WhatsApp, tel:, mailto:; hint: «Respuesta en menos de 2 h»
type NextStep = { id?: string | number; title: string; description?: string; date?: string }

// ── Itinerario, carta, ubicación ──
type Stop = { id?: string | number; time?: string; end?: string; title: string; description?: string; place?: string; media?: Media }   // HH:mm del lugar
type ItineraryDay = { id?: string | number; label: string; date?: string; summary?: string; stops: Stop[] }
type MenuItem = { id?: string | number; name: string; lang?: string; description?: string; price?: PriceSpec
                  tags?: string[]; media?: Media; available?: boolean | string }
type MenuSection = { id?: string; name: string; description?: string; hours?: string; items: MenuItem[] }
type Point = { id?: string | number; name: string; address?: string[]; time?: string; description?: string; directions?: Action; media?: Media }
```

**Tipos de los pasos directos de `labels`** (§15 regla 5: `gallery`, `datePicker`, `bar`, `party`, `form`, `errorSummary`, `stepper`): `GranaLabels` de `@grana/vue` (`Record<string, any>`) salvo que la entrada del componente exporte su tipo de textos; `GBookingBarLabels` en `search.md` es ese mismo `GranaLabels` con nombre propio.

**Identidad y orden:** como §2 (`id` o el índice; `id` repetido, C3), salvo `Offer.id`, obligatorio (K5). Los textos de dato llegan **ya formateados** por la aplicación (`OfferFact.value`, `Stop.time` en `HH:mm` del lugar, `AvailabilityDay.note`); las fechas ISO las formatea el bloque (§15 regla 6).

## 17. Eventos de intención de Booking (además de §4)

| Evento | Carga | Secciones | Cuándo |
| --- | --- | --- | --- |
| `submit` | **Search:** la carga de `GBookingBar` tal cual (`{ kind, …consulta, nights?, event, preventDefault(), defaultPrevented }`, `booking-bar.md` «Envío»). **Guest form:** `{ event, data: FormData, values, party, consents, query }` | B1, B6 | Envío válido |
| `select` | `{ event, offer, query }` (Offer list) · `{ event, kind, value, day, query }` (Availability) | B2, B4 | El viajero elige (botón «Elegir» o la tarjeta-botón; día o fechas) |
| `book` | `{ event, offer, query }` | B3 | «Reservar» de la ficha sin slot `consult` |
| `photos` | `{ event, offer, index }` | B2 | Se abre el visor de fotos de una oferta (informativo; el bloque ya lo abre) |
| `update:query` · `update:values` · `update:value` · `update:step` | el valor | B1 · B6 · B4 · B6 | Estado de vista (§15 regla 9) |

`navigate` y `activate` siguen §4 (enlaces y acciones sin `href`). **Una activación por gesto** (#661) en los disparadores que abren algo («Ver fotos»): lo cumple `GGalleryViewer`/`GBtn`; el bloque no añade otro.

## 18. Avisos comunes de Booking (`[Grana Gb<Sección><NN>]`, guarda de #653)

Los de §5 (C1 a C8) y además:

| # | Motivo | Qué pasa |
| --- | --- | --- |
| K1 | `query` sin `kind` o con forma inválida para su `kind` | Se trata como sin consulta |
| K2 | `query` sin `partyRows` o sin `labels.query` | La línea de la consulta no se pinta |
| K3 | Un `PriceSpec` sin `value` (ni `null` explícito) o una lista con precios y sin `prices` | Se pinta sin región (`GPrice` con su código, regla `auto`) |
| K4 | `available` que no es Boolean ni String | Cuenta como disponible |
| K5 | `id` ausente en una `Offer` (es obligatorio para `select`) | Se usa el índice y avisa |

## 19. Archivos, `meta.json`, tipos y paquete (#860; encargo a bruno, parte A)

```
packages/blocks/src/blocks/Gb<Sección>/        ← como §6: props.js, 01..03.vue, meta.json, test, banco, README
packages/blocks/src/blocks/common/             ← se reutiliza (navigate, GbActions, avisos, medios, listas); lo nuevo de Booking también aquí
packages/blocks/src/booking.js                 ← índice: las 33 variantes (puras) y el plugin `booking`
packages/blocks/types/booking.d.ts             ← §16, a mano
```

- **`meta.json`:** la forma de §6 con `family: "booking"` y `bundle.entry: "@grana/blocks/booking"`.
- **`build-types.mjs`** escribe `dist/booking.d.ts` con el mismo procedimiento de §6 (una `Gb<Sección>Props` por sección y cada variante con ese tipo; reexporta `types/booking.d.ts` y los tipos comunes de §2; amplía `GlobalComponents` con las 33; se detiene ante una variante sin exportar o una exportación sin `meta.json`), recorriendo los `meta.json` por `family`. La prueba de tipos de #836 recorre también los de Booking.
- **`package.json`:** `exports` gana `"./booking"` (`types`/`import`/`default`) y `typesVersions` `booking`; `vite.config.js` gana la entrada `booking`; externos: `vue`, `@grana/vue`, `@grana/vue/booking`, `@grana/vue/gallery`, `@grana/vue/price`, `@grana/vue/hero`, `@grana/vue/tag`.
- **Código común entre entradas:** lo de `common/` que usan las dos familias puede ir en un trozo compartido del paquete que generan Vite y Rollup (es interno de `@grana/blocks`, no `__shared` de `@grana/vue`); **no se exporta**. La medida de peso de una entrada incluye los trozos que importa.
- **Peso, topes fijados en el remate (#886, #887):** **`dist/booking.js` ≤ 37 KiB (37 888 B) gzip con su trozo compartido** (medido 35 942 B con las 11 secciones; **36 851 B tras el remate**; el tope inicial de 36 KiB lo subió #907 y no se vuelve a subir) y **una variante importada sola ≤ 5 KiB (5 120 B)**, salvo **Guest form ≤ 7 KiB (7 168 B)** (medido 6 547 B: lleva `GForm`, campos y consentimientos). Search y Offer list: el tope de 5 KiB. `bundle.cap` de cada `meta.json` y las compuertas de §21 los llevan. Historia del primer lote (**sin tope**, referencia de 4 KiB como Marketing): bruno mide `dist/booking.js` (con sus trozos) y cada variante sola (esbuild, `vue` y `@grana/vue*` externos), `gzip -c`, y lima fija el tope en el remate (como #844). Referencia mientras: una variante sola **≤ 4 KiB (4 096 B)**, el mismo criterio que Marketing; una que lo pase vuelve a lima con su medida. **Medidas de la parte A (#879), solo como referencia, sin tope todavía:** Guest form 5 982 a 6 547 B, Confirmation 4 480 a 4 663 B, entrada Booking con su trozo compartido 17 058 B, Marketing 17 630 B (tope 18 432, por el trozo compartido). Los topes de la entrada y por variante los fija lima al cierre con B y C, con las 33 medidas. **`dist/marketing.js` y `dist/blocks.js` no crecen** por Booking (compuertas de §21).

## 20. Banco y verificación de Booking

- **Banco** (`<seccion>.bank.js`, §7): un juego por sección que pasa igual por las tres variantes. Hotel Casa Alcalá para Search, Offer list, Offer detail, Availability, Booking summary, Guest form, Confirmation y Policies; restaurante (carta) para Menu; tour (Monte Albán, punto de encuentro) para Itinerary y los puntos de Location. Todos llevan **la misma consulta** de estancia (`{ kind: 'stay', from: '2026-11-13', to: '2026-11-15', party: { adults: 2, children: 1, rooms: 1 } }`, salvo Menu e Itinerary) y las mismas `partyRows` y `labels.query`, exportados una vez desde `bank/booking.js` (bruno), para que la prueba compare **la misma línea** en todas. Además de §7: una oferta o un plato no disponible con motivo, un precio `null` («a consultar»), un precio en dos monedas con `approximate`, un texto en inglés con `lang="en"`.
- **Vitest:** lo de §8 en las 33 variantes, y además: (1) la línea de la consulta de cada sección es **exactamente** `describeQuery(query, …).text` (y coincide con el resumen de un `GBookingBar` montado con la misma consulta); (2) un solo `GPriceScope` por región y ningún precio fuera de `GPrice`; (3) toda fecha visible está en un `time` con `datetime` ISO (única excepción, #890: el `caption` de la `GTable` de Itinerary 03, texto plano); (4) lo no disponible está en el DOM con su motivo y sin acción de elegir; (5) cada intención con su carga exacta (`query` incluida); (6) avisos K1 a K5 y los propios, una vez; (7) SSR de las 33 sin acceso a `window` ni a la hora del sistema en el servidor.
- **Playwright, Chromium** (`packages/blocks/playground/booking/<seccion>.html`, spec `tests/blocks-booking.spec.mjs`, **puerto propio 4214**): lo de §8 (320, 390, 1440; zoom 200 %; Tab con foco visible; reducido; oscuro; consola limpia; tema por defecto y dos del CLI) y, por sección, su «Verificación propia». La pasada en Firefox y WebKit, una vez al cerrar el lote.

## 21. Compuertas de Booking (bruno, en el script del paquete y en `gates.sh`)

Las de §9 sobre los `Gb*` (valen para todos) y además:

```bash
test -f packages/blocks/dist/booking.js && test -f packages/blocks/dist/booking.d.ts
! grep -q "createApp" packages/blocks/dist/booking.js
! grep -q "__shared" packages/blocks/dist/booking.js
! grep -qE "g-[a-z-]+__[a-z]" packages/blocks/dist/booking.js        # ninguna clase interna de un componente
! grep -q "GbHero01" packages/blocks/dist/booking.js                  # Booking no paga Marketing
! grep -q "GbOfferList01" packages/blocks/dist/marketing.js           # Marketing no paga Booking
! grep -q "GbOfferList01" packages/blocks/dist/blocks.js              # Gestión no paga Booking
! grep -qE "fetch\(|XMLHttpRequest" packages/blocks/dist/booking.js
test "$(gzip -c packages/blocks/dist/marketing.js | wc -c)" -le 18432 # Marketing no crece por Booking (#844)
```

Y las de peso (#886, #887):

```bash
test "$(gzip -c packages/blocks/dist/booking.js | wc -c)" -le 37888
# cada variante sola ≤ 5120 B (GbGuestForm* ≤ 7168 B): script del paquete, con esbuild y gzip -c
```

## 22. Alcance: lo que se reutiliza y lo que queda fuera (#865)

- **B12 Reviews = `GbTestimonials` tal cual** (`testimonials.md`), importado de `@grana/blocks/marketing`; **no** se reexporta desde Booking (una sección, una entrada; quien usa Booking y opiniones carga las dos). Para que una opinión nunca llegue sin fuente (R7), **`Testimonial.source` pasa a obligatoria en el tipo** (enmienda de `testimonials.md`, #865; el aviso T1 se queda para quien no usa TypeScript). La calificación sigue reservada (M-L2).
- **Fuera del lote:** mapa vivo (`GEmbed`, ronda futura; Location usa la imagen estática y «Cómo llegar»), calificación (`rating`, M-L2), pago y carrito (la aplicación; Ecommerce), edades de los niños (`childAges` de `GPartyField`, reservado), el conserje de la consulta (`appearance="guided"`, reservado), un muelle genérico y una columna pegada (BK-L1, BK-L2).

## 23. Correcciones al plan §4.3 (#866)

| Plan | Contrato | Por qué |
| --- | --- | --- |
| Search 03 «en el umbral del héroe (`GHero threshold`)» | 03 **«La que acompaña»** (la frase con el muelle, `dock`); el umbral es una **receta**: `GbHero03` con `GbSearch01` o `02` en su slot `consult` | `GbHero03` ya es `GHero threshold` + `consult` (#818): una variante de Search con héroe duplicaría la apertura, pintaría un `h1` en una sección que no es la apertura y obligaría a meter los datos del héroe en `GbSearchProps` |
| Offer detail con `GBookingBar dock` dentro | Slot **`consult`** (la aplicación pone `GbSearch03` o un `GBookingBar`) | La consulta tiene sus props propias (`partyRows`, límites, `labels.bar`); duplicarlas en la ficha engorda su `interface` y crea dos fuentes de la misma consulta |
| Availability con `GCalendar` | `GDatePicker inline` (slot `day` + `dayDescription`) | `GCalendar` es una agenda de recursos y eventos (`calendar.md`); el mes con precio por día es `GDatePicker` (#778) |
| Booking summary 01 «tarjeta lateral **pegada**», 02 «muelle al pie» | 01 Tarjeta · **02 El recibo** (el desglose completo) · 03 Línea | Sin CSS, un bloque no puede pegarse (no hay primitiva de columna pegada) ni tener un muelle propio (el único muelle es el de la consulta, con `EDGE_ORDER` y 2.4.11): hallazgos BK-L1 y BK-L2. La aplicación puede pegar su columna con su CSS (receta del README) |
| Guest form 02 «por pasos con `GDialogStep`» | 02 con **`GStepper` en la página** | Un formulario de reserva en un modal tapa lo pedido y, en el teléfono, el teclado tapa el modal; `GDialogStep` es para niveles dentro de un diálogo (#580) |
| Guest form 03 «con resumen pegado» | 03 con lo pedido **arriba** y el pie de envío **pegado** (`GFormActions sticky`, que ya cuida 2.4.11 dentro de `GForm`) | Es lo pegado que existe |
| Itinerary 03 «línea de tiempo en tabla» | 03 **`GTable`** por día (sin línea dibujada) | Una línea de tiempo dibujada necesita CSS |
| Policies 02 «lista `dl`» | 02 **«Todo a la vista»** (`GSection` anidada por política, como FAQ 02) | Mismo motivo que #816 (g): `dt`/`dd` sin componente no llevan tipografía de título; la sección anidada da el mismo esquema que 01 y 03 |
| Menu 01 «secciones con `dl`» | Se mantiene, con **`GText` que tipografía `dl`** (enmienda de `text.md`, #863) | Una carta **es** una lista de definiciones (plato → descripción y precio); `GText` ya recibía `dl` en su ritmo, faltaba quitar la sangría del navegador al `dd` y dar peso al `dt` |

## 24. Hallazgos para lima (no bloquean; en `PENDIENTES.md` §3)

- **BK-L1 · Columna pegada.** Booking summary y la ficha piden una columna que se queda a la vista mientras se lee (escritorio). No hay primitiva (`GSection`/`GStack` sin `sticky`, `section.md`). Reservado: `GStack sticky` o una prop de `GAdaptiveLayout` para un hijo pegado, con la regla de 2.4.11 de `api.md` «Flotantes persistentes».
- **BK-L2 · Muelle genérico.** Un muelle al pie para el resumen o el total (como el de `GBookingBar` o `GPageHeader`) sería un componente con `EDGE_ORDER`, reserva de borde y `scroll-padding`; ronda propia de kiwi si una plantilla lo pide. Mientras, el muelle de la consulta (`GbSearch03`) cubre el caso del hotel.
- **BK-L3 · Precio al final del renglón de la carta.** La medida de kiwi (`price/r01`: un solo borde derecho para los precios de la carta) necesita una fila con el nombre que crece y el precio a su ancho natural; sin CSS, Menu 01 pone el precio debajo de la descripción. Reservado: una forma de renglón en `GText` para `dl` (`dt` + `dd` final en la misma línea) o `GSummary` con lectura aparte de precio (pendiente de `price.md`).
- **BK-L4 · El código de reserva dicho letra a letra.** `GMetric` lee «A7K29Q» como una palabra; una lectura aparte (`valueLabel`, reservada en `price.md` «Fuera de v1») permitiría «A, 7, K…». Mientras, Confirmation separa el código en grupos con guion (dato de la aplicación).
- **BK-L5 · `GEmbed`** (mapa vivo, vídeo del recorrido) y **BK-L6 · calificación** (M-L2): siguen en el lote 5 del plan.

## 25. Encargos de Booking

**Remate tras la parte A (#878 a #885):** tope de `@grana/vue/booking` en 15 360 B (la compuerta vive en `packages/vue/src/marketing.test.js`, línea de `booking`, `limit`); topes de Booking diferidos al cierre (#879); Guest form (consentimientos, sin `groups`, 03) en `guest-form.md`; Confirmation y el total en `confirmation.md`; `describeQuery` «hoy»/«mañana» en §15 regla 6; `Offer.lang` en §16.

**bruno** (Opus en Guest form, Offer detail y Availability: componen tres o más componentes complejos —formulario con pasos y validación; galería, pestañas y precio; calendario con precio—; Sonnet en el resto), en **tres partes que se pueden construir en paralelo** (cada una con su puerto de Playwright si corre a la vez: A 4214, B 4215, C 4216):

- **A · Infraestructura + B1, B2, B6, B7:** enmienda de `@grana/vue/booking` (`describeQuery` exportada, #862, con su prueba de igualdad frente al resumen de `GBookingBar` y su medida); entrada `@grana/blocks/booking` (§19: `src/booking.js`, plugin, `exports`, `typesVersions`, `vite.config.js`, externos, `build-types.mjs` por `family`, `types/booking.d.ts` con §16); `bank/booking.js` (la consulta, `partyRows` y `labels.query` comunes); compuertas de §21; `tests/blocks-booking.spec.mjs` y `playground/booking/`; `Testimonial.source` obligatoria en `types/marketing.d.ts` y en `GbTestimonials.meta.json` (#865). Secciones **Search**, **Offer list**, **Guest form**, **Confirmation** (props, variantes, `meta.json`, banco, pruebas, playground).
- **B · B8, B10, B11, B3:** **Itinerary** (con el «ahora» de su contrato), **Location**, **Policies**, **Offer detail**. Depende de A solo en la entrada y el banco común (puede empezar con un índice provisional y unirse al de A).
- **C · B5, B9, B4:** **Booking summary**, **Menu** (con la enmienda de `GText` hecha por coco, #863), **Availability**.
- Al final de las tres: la medida de peso (entrada y 33 parciales) para que lima fije el tope, y la pasada única en Firefox y WebKit.

**coco** (Sonnet; Opus en Offer detail y Availability): **`GText.css`** con la enmienda de `dl` (#863, antes de que bruno cierre Menu) y su caso en el verificador de `GText`; **solo auditoría** de las once secciones (`auditoria-visual.md` previa y posterior, dos temas del CLI, rúbrica de movimiento sobre lo compuesto: visor de fotos, muelle, acordeón, cuenta de `GPrice`), resultado en `design/lab/blocks/booking/auditoria.md`; lo que pida CSS vuelve a lima.

**mora-docs** (Sonnet): un `README.md` por sección (las tres variantes, la `Props`, el banco, las entradas *peer*) y las recetas: «El umbral» (`GbHero03` + `GbSearch01`), «La consulta que viaja» (de `GbSearch` a `GbOfferList`, `GbBookingSummary`, `GbGuestForm` y `GbConfirmation` con el mismo objeto), «Columna pegada con CSS de la aplicación» (BK-L1), «Opiniones con `GbTestimonials`».
