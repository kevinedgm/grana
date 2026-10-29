# Contrato común · Bloques estructurales: Marketing P0 (`@grana/blocks/marketing`), Booking (`@grana/blocks/booking`), Ecommerce (`@grana/blocks/ecommerce`) y SaaS (`@grana/blocks/saas`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #814 a #826, 2026-10-22; remates tras la construcción #827 a #844, §13; decisión del usuario del 2026-10-22: «Vale #780: los bloques van en `packages/blocks/` como paquete `@grana/blocks` aparte. Que lima enmiende #765 y arranca el lote 2 (Marketing P0) ahí») · **Plan:** `design/lab/blocks/plan.md` §2, §4.1, §5 (lote 2), §6 · **Flujo:** reducido (#766): lima → bruno → coco (solo auditoría) → mora-docs
**Paquete:** `@grana/blocks`, entrada **`@grana/blocks/marketing`** (`dist/marketing.js`, #815) · **Avisos:** `[Grana Gb<Sección><NN>]` · **Usuario final de referencia:** el viajero en el teléfono del inventario `design/lab/marketing/r01/brief.md` (hotel boutique, restaurante, tour; inglés además de español, conexión lenta, sol de frente)

Este archivo fija lo que comparten las nueve secciones del lote 2 (§1 a §13) y, desde el lote 3, las once secciones de Booking (**§14 a §24**, #860 a #877; las reglas de §1 a §5 valen también para Booking salvo donde §15 las amplía) y, desde el lote 4, las doce de Ecommerce (**§26 a §38**, #909 a #926; §1 a §5 y lo que §27 toma de §15) y, desde el lote 4c, las doce de SaaS (**Parte D, §41 a §54**, #957 a #974; §1 a §5 y lo que §42 toma de §15 y §27). Cada sección tiene su contrato corto con el mismo esqueleto:

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
4. **Distribución solo con primitivas:** `GSection` (encabezado y cuerpo), `GStack` (un eje), `GContainer` (medida de lectura, anidado sin margen), `GAdaptiveLayout` (reparto por tamaño), **`GSplit`** (exactamente dos regiones lado a lado con proporción, que se apilan por su caja; para un panel con varios controles junto a otra cosa; `split.md`, #946, #950), `GSurface zone="brand"` (banda de marca). **`GCardGroup` no es una rejilla** (#603: es una barra de tarjetas que filtran, `role="toolbar"`): ninguna sección de Marketing lo usa (corrige el plan §4.1). **Columna de lectura dentro de una sección (#845):** `GContainer width="reading"` lleva siempre `horizontal="start"`; centrada, la columna flota a la derecha del título de la sección (que va al inicio). Sin sección (una columna suelta de página) el `center` por defecto sigue valiendo.
5. **Listas reales** (1.3.1):
   - **Rejilla** (elementos lado a lado): `GAdaptiveLayout` con `role="list"` en su raíz (llega por `$attrs`; no tiene prop de etiqueta, #343) y cada elemento envuelto en un `div role="listitem"` hijo directo, con la **misma pista de familia** en todos (`g-adapt-standard` o `g-adapt-wide`, según la sección) para que se repartan igual. El contenido (una `GCard`, un `GMetric`) va dentro del envoltorio.
   - **Lista en columna:** `GStack as="ul"` (o `ol`) con `GCard as="li"` o un `li` por elemento. `GStack` quita las marcas del navegador y pone `role="list"` (#827): el bloque no lo repite.
   - Una lista de un solo elemento sigue siendo lista.
6. **Encabezados por anidación** (#720, #817; `api.md` «Grana Blocks» regla 8): el título de una sección lo pone su `GSection` (nivel automático). Lo que el bloque titula **dentro** (títulos de `GCard`, de `GAccordion`) va un nivel por debajo, leído en el `setup` con `useSectionLevel()` de `@grana/vue`: `sección = min(level, 4)`, `dentro = min(sección + 1, 6)`. Cuando el título de la sección es el de una `GCard` (CTA 02, Newsletter 02, Promo 02), la tarjeta lleva `min(level, 6)`. **Regla de familia (#927):** el nivel depende de si el bloque abre un esquema propio. Con `GSection` propia (Offer list, Category previews, Features…), los títulos de dentro van a `min(min(level, 4) + 1, 6)`; **sin `GSection` propia** —la raíz es la tarjeta o es una pieza que vive dentro de la sección de otro (Product card, la tarjeta de Product grid y de Cart, las tarjetas de Booking summary, Confirmation, Order summary y Location)—, el título es un encabezado puesto en ese sitio y lleva `min(level, 6)`: `useSectionLevel()` ya dice el nivel que corresponde ahí (`2` en la raíz, sección + 1 dentro de una `GSection` de la aplicación o del bloque contenedor), y sumar uno saltaría un nivel (`h3` bajo la página sin `h2`). **Nunca un `hN` suelto** (sin estilo, sin nivel). **Un solo `h1` por página: el de `GHero`**; ningún otro bloque pinta `h1`.
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
2. **Entradas *peer* que compone** (todas públicas, #792): `@grana/vue` (principal: `GSection`, `GStack`, `GContainer`, `GAdaptiveLayout`, `GSplit` (#950), `GCard`, `GText`, `GBtn`, `GIcon`, `GBadge`, `GSummary`, `GMetric`, `GAccordion`, `GTabs`, `GTable`, `GStepper`, `GDatePicker`, `GForm` y campos, `GErrorSummary`, `GFormActions`, `useSectionLevel`), **`@grana/vue/booking`** (`GBookingBar`, `GPartyField`, `describeQuery`, §16), **`@grana/vue/gallery`** (`GGallery`, `GGalleryViewer`), **`@grana/vue/price`** (`GPrice`, `GPriceScope`, `formatPrice`) y `@grana/vue/tag` (`GTag`). El README de cada sección dice qué entradas carga la aplicación.
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

- **BK-L1 · Columna pegada.** Booking summary y la ficha piden una columna que se queda a la vista mientras se lee (escritorio). No hay primitiva (`GSection`/`GStack` sin `sticky`, `section.md`). Reservado: `GStack sticky` o una prop de `GAdaptiveLayout` para un hijo pegado, con la regla de 2.4.11 de `api.md` «Flotantes persistentes». **Actualización (#951):** la vía prevista es la `sticky` reservada de `GSplit` (solo la región `end`, con salida para lo que no cabe y la suma de la cabecera; `split.md` «Reservados»), en ronda propia; `GSplit` no la trae hoy.
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

---

# Parte C · Ecommerce (`@grana/blocks/ecommerce`, lote 4)

**Estado:** contratado (DECISIONS.md **#909 a #926**, 2026-10-23; decisión del usuario del 2026-10-23: «Arranca el lote 4 (Ecommerce) según el plan §4.2 y §5: lima contrata las secciones y seguimos el flujo reducido») · **Plan:** `design/lab/blocks/plan.md` §4.2 y §5 (lote 4) · **Flujo:** reducido (#766) · **Usuario final:** quien compra **en el teléfono**, con una mano, a ratos (vuelve a la lista, cierra la app, regresa al carrito al día siguiente), con datos móviles y sin paciencia para reescribir; a veces con lector de pantalla o con zoom. Plantilla: **la tienda de Oaxaca «Barro y Agave»** (mezcal, textiles teñidos con grana cochinilla y añil, barro negro y verde), la misma ciudad que Casa Alcalá.

## 26. Secciones del lote

| Sección (plan §4.2) | Contrato | Variantes | Parte de bruno | Compleja (coco y bruno en Opus) |
| --- | --- | --- | --- | --- |
| E1 Product card | `product-card.md` | `GbProductCard01` Foto arriba · `02` Horizontal · `03` Compacta con acción rápida | A | — |
| E3 Category previews | `category-previews.md` | `GbCategoryPreviews01` Puertas con foto · `02` Tira · `03` Lista con cuenta | A | — |
| E12 Trust | `trust.md` | `GbTrust01` Fila · `02` Tarjetas · `03` Lista al pie | A | — |
| E11 Promo | `promo.md` | `GbPromo01` Banda · `02` Tarjeta con imagen · `03` Línea | A | — |
| E2 Product grid | `product-grid.md` | `GbProductGrid01` Rejilla · `02` Con filtros al lado · `03` Renglones | B | **Sí** |
| E4 Product overview | `product-overview.md` | `GbProductOverview01` Galería + panel · `02` Galería arriba · `03` Tira + pestañas | B | **Sí** |
| E5 Quick view | `quick-view.md` | `GbQuickView01` Diálogo · `02` Hoja lateral · `03` Elegir y añadir | B | **Sí** |
| E6 Reviews | `reviews.md` | `GbReviews01` Lista con resumen · `02` Resumen y distribución · `03` Tarjetas | B | — |
| E7 Cart | `cart.md` | `GbCart01` Lista + resumen al lado · `02` Resumen al pie · `03` Cajón | C | **Sí** |
| E8 Checkout | `checkout.md` | `GbCheckout01` Por pasos · `02` Se pliega lo hecho · `03` Con el pedido al lado | C | **Sí** |
| E9 Order summary | `order-summary.md` | `GbOrderSummary01` Tarjeta · `02` El recibo · `03` Línea | C | — |
| E10 Order history | `order-history.md` | `GbOrderHistory01` Tabla · `02` Tarjetas con seguimiento · `03` Lista | C | — |

Tags `gb-product-card-01`, `gb-product-grid-02`, `gb-quick-view-03`… (#764). 36 variantes.

## 27. Reglas comunes de Ecommerce (amplían §1 a §5 y toman de §15 lo que se nombra)

1. **Todo lo de §1** y la jerarquía de acciones de §3; de Booking (§15) valen tal cual: **precios solo con `GPrice`** y **una** `GPriceScope` por región (regla 4; en Ecommerce la región es **obligatoria** donde hay más de un precio de la misma moneda: lista, rejilla, carrito, pedido), **pasos directos de `labels`** (regla 5, con las claves `price`, `gallery`, `form`, `errorSummary`, `stepper`, `datePicker`, `pagination`, `region` → `GLoadRegion`, `tags` → `GTagGroup`, `table` → `GTable`, `dialog` → `GDialog`), **fechas en `<time datetime>`** con `Intl` y sin relativas (regla 6; los plazos de entrega relativos, «Llega mañana», solo como texto de la aplicación en `note`, porque la aplicación sabe cuándo pinta), **lo no disponible se dice, no se esconde** (regla 7: un producto, una variante, una línea o una categoría que no se puede pedir sigue a la vista con su motivo en texto y sin la acción de pedirla) y **estado de vista sí, de negocio no** (regla 9). **Ningún bloque de Ecommerce pinta `h1`.**
2. **Entradas *peer* que compone** (todas públicas, #792): `@grana/vue` (principal: `GSection`, `GStack`, `GContainer`, `GAdaptiveLayout`, `GSplit` (#950), `GCard`, `GText`, `GBtn`, `GIcon`, `GBadge`, `GSummary`, `GMetric`, `GProgress`, `GAccordion`, `GTabs`, `GTable`, `GStepper`, `GDialog`, `GSelect`, `GRadioGroup`, `GNumberField`, `GDatePicker`, `GForm` y campos, `GErrorSummary`, `GFormActions`, `GFormSection`, `GFieldGroup`, `GCheckbox`, `GPagination`, `GEmpty`, `GSurface`, `useSectionLevel`), **`@grana/vue/price`** (`GPrice`, `GPriceScope`, `formatPrice`, `currencyDigits`), **`@grana/vue/gallery`** (`GGallery`, `GGalleryViewer`), **`@grana/vue/tag`** (`GTag`, `GTagGroup`) y **`@grana/vue/load-region`** (`GLoadRegion`). **No** compone `@grana/vue/booking` (Ecommerce no tiene consulta). El README de cada sección dice qué entradas carga la aplicación.
3. **Nada se pierde al volver** (#913, personalidad de familia). Quien compra en el teléfono va y vuelve: de la rejilla a la ficha, de la vista rápida a la lista, del pago a la dirección, del carrito a la tienda. La familia promete que **lo que eligió le sigue y se dice con las mismas palabras**, y que **ningún gesto de ida borra lo hecho**:
   - **La elección viaja** (`selection` y `options` de §28): la talla, el color y la cantidad que se eligieron en la ficha o en la vista rápida son las mismas `{ label, value }` que se leen en la línea del carrito, en el resumen del pedido y en el historial; ninguna sección las vuelve a redactar.
   - **Quitar deja huella** (Cart, #921): la línea quitada deja en su sitio «Quitaste {nombre} · Deshacer» con el foco en «Deshacer», hasta que foco y puntero se van (el patrón A «Huella» de `GTag`, `tag.md`, aplicado a una línea); el foco nunca cae en `body`.
   - **Volver no borra** (Checkout, #922): retroceder un paso conserva lo escrito; lo hecho se resume en una línea con «Cambiar».
   - **Cerrar devuelve** (Quick view, #919): al cerrar la vista rápida el foco vuelve a la tarjeta que la abrió y la elección queda en la aplicación (`v-model:selection`) para la próxima vez.
   - **Nunca a ciegas** (Product card, Product overview, Quick view): una acción rápida **no añade** un producto con opciones sin elegir; dice «Elegir opciones» y abre la elección. «Añadir» sin una opción obligatoria no emite y lleva el foco a la pregunta que falta.
4. **Grana suma una sola vez, en un solo sitio** (#911). Los bloques **no suman, no multiplican ni redondean** precios: el total de una línea, el del carrito y el del pedido llegan hechos (`CartLine.total`, `Totals`). La aritmética del carrito vive solo en **`cartTotals`** (§29), utilidad pura que la aplicación llama (o no: su servidor puede dar los mismos `Totals`). Así el bloque pinta lo mismo venga de donde venga, y un total del servidor con una regla fiscal propia nunca discute con uno de Grana. Lo único que un bloque calcula es de vista: el porcentaje de cada fila de la distribución de opiniones (Reviews) y qué variante corresponde a la elección (Product overview).
5. **La calificación se dice en palabras** (#912): «4,8 de 5 · 312 opiniones» (el decimal es el de `Intl` para `locale`, #929: «4,8» en `es`, «4.8» en `es-MX`; los ejemplos del contrato escriben coma), con su cuenta siempre; **sin estrellas** (M-L2 sigue reservada: sin `star` en la lista de la librería, `icons.md`). Sin opiniones, `labels.noReviews` («Todavía sin opiniones»), nunca «0 de 5». Cuando llegue M-L2, la forma visual irá **junto** al texto, nunca en su lugar, y el dato (`Rating`, §28) no cambia.
6. **El pago es de la aplicación** (#922). Ningún bloque pide, pinta, valida ni transmite datos de tarjeta, cuenta o identidad fiscal: el paso de pago de Checkout es un **slot** donde la aplicación monta el componente de su pasarela; los bloques solo muestran lo que la aplicación ya resumió («Tarjeta terminada en 4242», §28 `PaymentSummary`). Sin `fetch`, sin `XMLHttpRequest`, sin globals (compuerta de §34).
7. **Urgencia honesta** (2.2.2 y patrones oscuros): sin cuenta atrás, sin «quedan 5 minutos», sin contadores de «personas viendo esto», sin temporizadores. Una oferta dice **hasta qué fecha** (`until`, en `<time>`); unas existencias bajas son un `badge` de texto que da la aplicación («Últimas 3 piezas») y solo si es verdad; una referencia de precio siempre **nombrada** (`compareLabel`, C de `price.md`): una referencia sin nombre no se pinta.
8. **Intenciones con objeto** (§30): la carga lleva **el dato entero** (`product`, `line`, `order`) y la **elección** (`variant`, `selection`, `quantity`) para que la aplicación arme su llamada a su carrito sin volver a buscar nada. Nada navega, añade ni cobra por su cuenta.
9. **Una pregunta que no es un campo no lleva `name`** (#934). Las preguntas de un bloque que se eligen por `v-model` y no se envían (las opciones de Product overview y Quick view) usan `GRadioGroup` **sin `name`**: el componente genera uno único y estable. Un `name` legible fuera de un `<form>` junta en un solo grupo nativo los radios de dos bloques de la página (la ficha y la vista rápida) y elegir en uno desmarca el otro. Los `choice` de Checkout son campos de `GForm` y conservan su `name`.
10. **Escuchas de la raíz** (#940). Un bloque cuya raíz es un componente que emite un evento con el mismo nombre que una intención de la familia (Cart 03 sobre `GDialog`: `open`) declara `inheritAttrs: false` y **no le pasa esas escuchas**; el resto de atributos sí llega a la raíz.

## 28. Tipos compartidos de Ecommerce (#910)

En `packages/blocks/types/ecommerce.d.ts` (a mano, bruno), reexportados desde `dist/ecommerce.d.ts`; sin `[key: string]: unknown` (§2). **Tipos de más de una familia (#909):** los que ya usan Booking y ahora Ecommerce (`Photo`, `PhotoGroup`, `PriceSpec`, `PriceRegion`, `Totals`, `TotalsLine`, `Reference`, `GuestField`, `Consent`, `Policy`) pasan a **`types/common.d.ts`** (bruno), y `booking.d.ts` y `ecommerce.d.ts` los reexportan **con los mismos nombres** (ninguna importación de la aplicación cambia; la prueba de tipos de #836 lo comprueba con los dos bancos). `Media`, `Action` y `NavLink` siguen en `marketing.d.ts` y también se reexportan.

```ts
// ── De otras familias y de @grana/vue (no se redefinen) ──
type Money = import('@grana/vue/price').Money
type PriceTotal = import('@grana/vue/price').PriceTotal
type PriceLabels = import('@grana/vue/price').PriceLabels
// Photo, PhotoGroup, PriceSpec, PriceRegion, Reference, GuestField, Consent, Policy: §16, ahora en types/common.d.ts

/** Enmienda aditiva de §16 (#910): una línea de `Totals` puede decir qué es y si ya está incluida.
 *  Booking no la usa y no cambia; un `amount: null` es «se calcula después» (se pinta con `labels.pending`). */
type TotalsLine = {
  label: string
  amount: Money | Money[] | null
  note?: string
  kind?: 'subtotal' | 'discount' | 'shipping' | 'tax' | 'fee'
  included?: boolean          // impuesto ya incluido en los precios («Incluye IVA $172»): se dice, no se suma
}
type Totals = { lines?: TotalsLine[]; total: PriceTotal; note?: string }

// ── Producto ──
type Rating = { average: number; max?: number; count: number }   // max por defecto 5; average lo da la aplicación (no se calcula)
type ProductFact = { label: string; value: string }               // ya formateado: «Contenido» → «750 ml»
type Product = {
  id: string | number            // obligatorio: identidad en add/open (EC5)
  name: string
  lang?: string                  // idioma del nombre y del resumen si no es el de la página (3.1.2)
  maker?: string                 // antetítulo: quien lo hace o la línea («Taller Mendoza · Teotitlán»)
  summary?: string               // una línea
  href?: string                  // la ficha (la tarjeta es enlace)
  external?: boolean
  photos?: Photo[]               // la primera es la portada
  price: PriceSpec               // value, compareAt + compareLabel (C), lead («desde»), unit
  badge?: string                 // «Nuevo», «Últimas 3 piezas»: texto corto que da la aplicación, nunca solo color
  rating?: Rating
  facts?: ProductFact[]          // ≤ 2 a la vista en la tarjeta; la ficha los enseña todos
  optionsSummary?: string        // «3 colores · 4 tallas» (texto de la aplicación)
  options?: ProductOption[]      // si trae opciones obligatorias, la acción rápida es «Elegir opciones» (§27 regla 3)
  available?: boolean | string   // false: labels.unavailable; String: el motivo («Vuelve el 2 de diciembre»)
}
type OptionValue = { value: string | number; label: string; available?: boolean | string; photo?: number }   // photo: índice en ProductDetail.photos
type ProductOption = { key: string; label: string; values: OptionValue[]; required?: boolean }   // required por defecto true
type Variant = {
  id: string | number
  options: Record<string, string | number>   // una entrada por ProductOption.key
  price?: PriceSpec                          // sin él, el de Product
  available?: boolean | string
  max?: number                               // existencias o tope por pedido (GNumberField max)
  photo?: number
  sku?: string
}
type ProductSection = { id?: string; title: string; body?: string; items?: string[] }   // «Cuidados», «Envío y devoluciones»
type ProductDetail = Product & {
  photos: Photo[]                // obligatorio en la ficha (≥ 1)
  groups?: PhotoGroup[]
  description?: string           // párrafos separados por una línea en blanco
  variants?: Variant[]
  sections?: ProductSection[]
  note?: string                  // «Hecho a mano: cada pieza cambia un poco», «Envío en 2 días hábiles»
  reviews?: { href: string; label?: string }   // ancla a la sección de opiniones («#opiniones»)
}
/** La elección, tal como viaja (§27 regla 3): ya formateada para leerla igual en todas partes. */
type ChosenOption = { key?: string; label: string; value: string }   // «Talla» · «M»; «Color» · «Añil»

// ── Categorías, promociones, confianza ──
type Category = { id?: string | number; name: string; lang?: string; href: string; description?: string; media?: Media; count?: number; external?: boolean }
type PromoCode = { value: string; label: string }    // «OAXACA10», «Código»
type Incentive = { id?: string | number; icon?: string; title: string; description?: string; action?: Action; policy?: string }   // policy: id de una Policy (ancla #policy)

// ── Carrito ──
type CartLine = {
  id: string | number            // obligatorio (EC5)
  product: Pick<Product, 'id' | 'name' | 'lang' | 'href' | 'photos' | 'maker'>
  variant?: string | number      // Variant.id elegida
  options?: ChosenOption[]       // la elección, como se leerá
  quantity: number               // entero ≥ 0 (0 = quitar)
  min?: number                   // por defecto 1
  max?: number                   // existencias o tope por pedido
  unitPrice: Money | Money[]
  compareAt?: Money | Money[]; compareLabel?: string
  total?: Money | Money[]        // total de la línea; de la aplicación o de `cartTotals` (byLine). Sin él, solo el unitario
  available?: boolean | string   // false/motivo: «Ya no queda»; no entra en el total
  note?: string                  // «Hecho a pedido: sale en 10 días»
}
type CartGoal = { id: string; label: string; reached: boolean; remaining: Money; target: Money; value: Money }   // salida de cartTotals (§29)

// ── Pago, pedido, historial ──
type PaymentSummary = { label: string; value: string }    // «Pago» · «Tarjeta terminada en 4242» (texto de la aplicación; nunca el número)
type ShippingSummary = { label: string; method?: string; address?: string[]; date?: string; note?: string }   // date ISO (entrega estimada)
type OrderLine = { id: string | number; name: string; lang?: string; href?: string; photo?: Photo; options?: ChosenOption[]
                   quantity: number; unitPrice?: Money | Money[]; total: Money | Money[] }
type OrderSummary = { reference?: Reference; placedAt?: string; lines: OrderLine[]; totals: Totals
                      shipping?: ShippingSummary; payment?: PaymentSummary; note?: string }
type OrderStatus = 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
type OrderProgress = { steps: { id: string; label: string; date?: string }[]; current: string }   // la aplicación da los pasos y el actual
type Order = { id: string | number; reference: Reference; placedAt: string; status: OrderStatus; statusText: string
               total: Money | Money[]; count: number; lines?: OrderLine[]; href?: string; tracking?: NavLink
               progress?: OrderProgress; note?: string }

// ── Checkout ──
type ChoiceOption = { value: string; label: string; description?: string; price?: PriceSpec; disabled?: boolean | string }
type CheckoutField = GuestField | (Omit<GuestField, 'type' | 'options' | 'autocomplete' | 'placeholder'> & { type: 'choice'; options: ChoiceOption[] })
type CheckoutStep = {
  id: string                     // obligatorio: v-model:step y slot `step-{id}`
  title: string
  description?: string
  fields?: CheckoutField[]       // sin `fields`: un paso de la aplicación (slot `step-{id}`, p. ej. el pago)
  groups?: { id: string; title: string; fields: string[] }[]   // grupos dentro del paso (GFormSection), por `name`
  consents?: Consent[]           // casillas del paso, nunca marcadas (§ guest-form)
  action: string                 // texto del botón del paso («Continuar al envío», «Confirmar pedido»)
  summary?: string               // resumen del paso hecho que da la aplicación (sin él, el bloque lo arma con los valores: §checkout)
}

// ── Opiniones ──
type ReviewSummary = Rating & { distribution?: { value: number; count: number }[] }   // value 1..max; la aplicación da las cuentas
type Review = {
  id?: string | number
  rating: number                 // 1..max
  title?: string
  quote: string                  // párrafos separados por una línea en blanco
  lang?: string
  author: { name: string; avatar?: string; place?: string }
  date: string                   // ISO
  verified?: boolean | string    // true: labels.verified («Compra verificada»); String: ese texto
  options?: ChosenOption[]       // lo que compró («Talla M»)
  source?: { label: string; href?: string; external?: boolean }   // si la opinión viene de otro sitio
  reply?: { author: string; quote: string; date?: string }        // la respuesta de la tienda, a la vista
}
```

**Identidad y orden:** como §2 y §16 (`id` o el índice; repetido, C3), salvo `Product.id`, `CartLine.id`, `Order.id` y `CheckoutStep.id`, obligatorios (EC5). Los textos de dato llegan **ya formateados** (`ProductFact.value`, `ChosenOption.value`, `statusText`, `PaymentSummary.value`); el bloque formatea solo fechas ISO (§15 regla 6), importes (`GPrice`/`formatPrice`) y la calificación (`Intl.NumberFormat`, regla 5 de §27).

## 29. `cartTotals` (#911; reservada en `price.md` «Fuera de v1» y #776/#858)

**Dónde:** exportada desde **`@grana/blocks/ecommerce`** (no desde `@grana/vue/price`: la v1 de `@grana/vue` mantiene «Grana nunca calcula totales», principio 2 de `price.md`, y la entrada de precio tiene su tope de 6 KiB). Pura: sin DOM, sin estado, sin `Intl` salvo lo que use `currencyDigits` (importada de `@grana/vue/price`, *peer*); funciona en SSR, en un worker y en el servidor de la aplicación. Tipos en `ecommerce.d.ts`.

```ts
cartTotals(lines: CartLine[], options: CartTotalsOptions): CartTotals

type CartTotalsOptions = {
  currency: string                               // la moneda del carrito (ISO 4217); obligatoria
  discounts?: ({ id?: string; label: string } & ({ amount: Money } | { percent: number }))[]   // en orden; los da la aplicación (cupón ya validado)
  shipping?: { label: string; amount: Money | null; note?: string }   // null: «se calcula después»
  taxes?: { label: string; rate?: number; amount?: Money; included?: boolean }[]   // rate en fracción (0.16); o amount ya calculado
  goals?: { id: string; label: string; target: Money }[]               // umbrales («envío gratis desde $1,500»)
  labels: { subtotal: string; total: string | ((count: number) => string) }   // total = PriceTotal.label («por 3 piezas»)
}
type CartTotals = Totals & {
  count: number                                   // piezas que entran (suma de quantity de las líneas disponibles)
  subtotal: Money
  byLine: Record<string, Money>                   // total de cada línea, por String(id): para `CartLine.total`
  excluded: (string | number)[]                   // ids que no entran: no disponibles o de otra moneda
  pending: boolean                                // hay un importe por calcular (envío null)
  approximate: boolean                            // algún importe usado era `approximate`
  goals: CartGoal[]
}
```

**Reglas:**
1. **Enteros escalados**: cada importe se pasa a unidades menores con `currencyDigits(currency)` (`Math.round(amount × 10^d)`) antes de operar; el resultado vuelve a unidades mayores al final. Nunca se suma coma flotante.
2. **Líneas:** entra una línea con `available` verdadero (o ausente), `quantity` entero > 0 y un `unitPrice` en `currency` (de un `Money[]` se toma la alternativa de esa moneda). Su total es `CartLine.total` si la aplicación lo dio (gana: descuentos por línea, precios por volumen) o `unitario × quantity`. No disponibles, de otra moneda o con `quantity` inválida → `excluded` (aviso CT2 en las dos últimas).
3. **Orden:** subtotal (suma de líneas) → descuentos en su orden (`percent` sobre el subtotal, redondeado; `amount` tal cual; **nunca por debajo de 0**: lo que sobra se recorta, aviso CT3) → envío → impuestos **no incluidos** con `rate` sobre (subtotal − descuentos), o su `amount` → total. Los impuestos **incluidos** (`included: true`, el IVA de los precios de México) se calculan como `base − base / (1 + rate)` para decirlos («Incluye IVA $172.41») y **no** se suman.
4. **Redondeo:** a la unidad menor, **mitad hacia fuera de cero**, **una vez por operación** (por descuento y por impuesto, sobre su base; no por línea). Una regla fiscal distinta (por línea, al par, impuestos sobre el envío) la aplica la aplicación y pasa `amount`; es el límite declarado, no un defecto.
5. **Salida:** `lines` de `Totals` en orden: `subtotal` (`kind: 'subtotal'`, `options.labels.subtotal`), cada descuento (`kind: 'discount'`, importe **negativo**: `GPrice` lo pinta con U+2212), el envío (`kind: 'shipping'`, `amount: null` si está por calcular), cada impuesto (`kind: 'tax'`, `included` si lo es). `total = { value: Money, label }` con `label` = `options.labels.total` (función de `count` si lo es). `goals`: por umbral, `reached` si el subtotal tras descuentos ≥ `target`, `remaining` = lo que falta (0 si se alcanzó).
6. **Contagio de aproximado:** si algún importe usado lleva `approximate`, el total, el subtotal y las líneas resultantes lo llevan y `approximate: true` (la aplicación marcó una conversión; Grana no la oculta).
7. **Nunca lanza.** `currency` mal formada o ausente: total `null`-seguro (todo a 0, `excluded` = todas) y aviso CT1. Avisos con la guarda de #653 y prefijo `[Grana cartTotals]`: **CT1** moneda inválida, **CT2** línea de otra moneda o `quantity` no entera, **CT3** descuentos mayores que el subtotal, **CT4** impuesto sin `rate` ni `amount`, **CT5** `percent` fuera de 0..100.
8. **Lo que no hace:** convertir divisas, validar cupones, decidir existencias, calcular el envío, decidir qué impuesto aplica. Todo eso es de la aplicación.

**Verificación (bruno, Vitest):** los casos de `price.md` sin error de coma flotante (0.1 + 0.2; 3 × 33.33 = 99.99); JPY (0 decimales) y KWD (3); descuentos `percent` y `amount`, recortados en 0; IVA no incluido 16 % y **incluido** (Barro y Agave: 2 880 MXN con IVA → 397.24 incluido); envío `null` → `pending`; líneas no disponibles y de otra moneda en `excluded` sin entrar en `count`; `CartLine.total` gana a la multiplicación; aproximado contagiado; `goals` alcanzado y por alcanzar; los cinco avisos una vez; SSR sin DOM; **la misma salida que un `Totals` hecho a mano** pintada por `GbCart` y `GbOrderSummary` (el bloque no distingue el origen).

## 30. Eventos de intención de Ecommerce (además de §4)

| Evento | Carga | Secciones | Cuándo |
| --- | --- | --- | --- |
| `add` | `{ event, product, variant, selection, options, quantity }` (`variant`: la `Variant` resuelta o `null`; `selection`: `{ [key]: value }`; `options`: `ChosenOption[]` ya dichas) | E1 (03), E2, E4, E5 | «Añadir» con todo lo obligatorio elegido y el producto disponible |
| `open` | `{ event, product }` (E1, E2) · `{ event, order }` (E10) | E1, E2, E10 | Abrir la vista rápida o elegir opciones (tarjeta sin `href`, «Elegir opciones»); abrir un pedido sin `href` |
| `change` | `{ event: null, line, quantity }` | E7 | La cantidad de una línea cambia **por gesto** (el `change` de `GNumberField`, no cada tecla; sin evento del DOM, #936) |
| `remove` | `{ event, line, index }` | E7 | «Quitar», o cantidad 0 |
| `restore` | `{ event, line, index }` | E7 | «Deshacer» de la huella (vuelve a la misma posición) |
| `select` | `{ event, product, key, value, variant }` | E4, E5 | Se elige un valor de una opción (informativo: la elección ya está en `v-model:selection`) |
| `submit` | `{ event, step, data: FormData, values, consents, final, preventDefault(), defaultPrevented }` | E8 | Paso válido (o el último). **Cancelable** y síncrono: sin `preventDefault()`, el bloque pasa al paso siguiente; con él, espera a que la aplicación cambie `step` |
| `update:filters` · `update:sort` · `update:page` | el valor | E2 · E2 · E2, E6, E10 | Estado de vista: la aplicación vuelve a pedir la página |
| `update:selection` · `update:quantity` · `update:open` · `update:step` · `update:values` | el valor | E4, E5 · E4, E5 · E5, E7 (03) · E8 · E8 | Estado de vista (§15 regla 9) |
| `retry` | `{ event: null }` | E2, E10 | «Reintentar» de la región que falló (el de `GLoadRegion`/`GTable`, que no entregan evento, #936) |

**`event: null`** (#936): cuando el componente compuesto no entrega un evento del DOM, la carga lleva `event: null` (nunca un evento fabricado ni la clave ausente); el tipo es `Event | null` en esas intenciones.

`navigate` y `activate` siguen §4. **Una activación por gesto** (#661) en los disparadores que abren algo (vista rápida, cajón, visor): la cumplen `GDialog`, `GGalleryViewer` y `GBtn`; el bloque no añade otra. `restore` es nuevo en la familia (#913): «Deshacer» no es un `add` (la aplicación debe devolver la línea **a su sitio** con su cantidad, no añadir un producto nuevo al final).

## 31. Avisos comunes de Ecommerce (`[Grana Gb<Sección><NN>]`, guarda de #653)

Los de §5 (C1 a C8), K3 y K4 de §18 (precio sin `value` o lista sin región; `available` que no es Boolean ni String) y además:

| # | Motivo | Qué pasa |
| --- | --- | --- |
| EC1 | Una lista con precios y sin `prices` (región obligatoria en Ecommerce, §27 regla 1) | Se pinta sin región (cada `GPrice` con su código, regla `auto`) |
| EC2 | `rating` con `average` fuera de `0..max`, o sin `count` | No se pinta la calificación |
| EC3 | Un producto con `options` obligatorias y la acción «Añadir» sin `labels.choose` | La acción rápida no se pinta (nunca se añade a ciegas) |
| EC4 | `variants` cuya `options` no cubre todas las `ProductOption.key`, o dos variantes con la misma combinación | Esa variante se ignora |
| EC5 | Falta el `id` obligatorio (`Product`, `CartLine`, `Order`, `CheckoutStep`) | Se usa el índice (o, en `CheckoutStep`, el paso se omite) |
| EC6 | Un dato de tarjeta en un campo del bloque: `autocomplete` `cc-*` o `name` que empieza por `card` (§27 regla 6) | El campo **no se pinta** (el pago es del slot de la aplicación) |
| EC7 | `until` en el pasado al montar (Promo) | Se pinta igual (la aplicación decide quitarla) |

## 32. Archivos, `meta.json`, tipos, paquete y peso (#909; encargo a bruno, parte A)

```
packages/blocks/src/blocks/Gb<Sección>/        ← como §6: props.js, 01..03.vue, meta.json, test, banco, README
packages/blocks/src/blocks/common/             ← se reutiliza; lo nuevo de Ecommerce aquí (rating, elección y variante, huella, campos)
packages/blocks/src/ecommerce.js               ← índice: las 36 variantes (puras), `cartTotals` y el plugin `ecommerce`
packages/blocks/src/cartTotals.js              ← la utilidad (§29), sin dependencias de Vue
packages/blocks/types/common.d.ts              ← tipos de más de una familia (§28)
packages/blocks/types/ecommerce.d.ts           ← §28, a mano
packages/blocks/src/blocks/bank/ecommerce.js   ← la tienda común (§33)
```

- **`meta.json`:** la forma de §6 con `family: "ecommerce"` y `bundle.entry: "@grana/blocks/ecommerce"`; `complex: true` en las cinco complejas (§26). `build-types.mjs` escribe `dist/ecommerce.d.ts` por `family` (§19), reexporta `types/common.d.ts`, `types/ecommerce.d.ts` y los de §2, declara `cartTotals` y amplía `GlobalComponents` con las 36; se detiene ante una variante sin exportar o una exportación sin `meta.json`.
- **`package.json`:** `exports` gana `"./ecommerce"` (`types`/`import`/`default`) y `typesVersions` `ecommerce`; `vite.config.js` gana la entrada; externos: `vue`, `@grana/vue`, `@grana/vue/price`, `@grana/vue/gallery`, `@grana/vue/tag`, `@grana/vue/load-region`.
- **Código común:** el motor de campos de Guest form (tipo cerrado → control, `ValidityState`, mensajes, consentimientos, pasos con foco) lo necesita Checkout: bruno lo lleva a `common/` como pieza compartida por las dos entradas (trozo interno del paquete, §19), **sin cambiar el comportamiento de Guest form** (sus pruebas siguen verdes) y **sin que `dist/booking.js` pase de 37 888 B** (#907: ese tope no se vuelve a subir; si moverlo lo pasa, Checkout lleva su copia y lo anota con su medida). Lo mismo con la anatomía de cita de Testimonials (Reviews).
- **Peso (#932, cierre de medidas del lote 4; sustituye las referencias de #909):** **`dist/ecommerce.js` ≤ 50 KiB (51 200 B) gzip** con sus trozos (medido 48 712 B con las 36 variantes; **no se vuelve a subir: con más, decide el usuario**); **una variante importada sola ≤ 7 KiB (7 168 B)** (la mayor, Product grid, 6 633 B); **Checkout ≤ 9,5 KiB (9 728 B)**, excepción con nombre (medido 9 048 a 9 176 B: formulario por pasos, copia del motor de campos, pedido y hueco del pago); **`cartTotals` sola ≤ 2 KiB (2 048 B)** sin volver a subir (#931; medida al cierre 1 903 B, margen 145 B). Una que pase vuelve a lima con su medida. **`dist/marketing.js` (18 432 B; 17 712 medidos), `dist/booking.js` (37 888 B; 37 105 medidos) y `dist/blocks.js` no suben** por Ecommerce: crecen solo por el preludio compartido y dentro de sus topes (compuertas de §34).
- **Motor de campos de Checkout** (#941): compartirlo con Booking pasaba `GbGuestForm03` de 7 168 B, así que Checkout lleva **su copia** en `common/fields.js` y Guest form conserva la suya. Las dos cumplen el mismo contrato (`guest-form.md` «Anatomía» y avisos G1 a G8): un cambio en una va a la otra en el mismo commit y una **prueba de paridad** pasa los mismos casos por las dos.

## 33. Banco y verificación de Ecommerce

- **Banco común** (`bank/ecommerce.js`, bruno): la tienda **Barro y Agave** (Oaxaca), `prices` `{ currency: 'MXN', taxes: 'IVA incluido' }` y los `labels` comunes de tarjeta, calificación y precio, exportados una vez para que la misma tarjeta se lea igual en Product card, Product grid y Cart. **Productos** (fotos con las proporciones de `bank/fotos.js`, servidas en local): Mezcal espadín «Tierra de Sola» 750 ml ($890, `facts` contenido y grado, `rating` 4.8 de 5 con 312); Mezcal tobalá ($1,650 con `compareAt` $1,850 y `compareLabel` «Precio de lista»); Rebozo de algodón teñido con grana cochinilla ($2,400, opción **Color** Grana/Añil/Natural con foto por color, Añil agotado: «Vuelve el 2 de diciembre»); Huipil bordado de San Antonino ($3,200, opciones **Talla** CH/M/G/EG —G sin existencias— y Color, `variants` con `max`, `badge` «Últimas 3 piezas»); Jarro de barro negro de San Bartolo Coyotepec ($480); Plato de barro verde de Atzompa (`available: 'Vuelve el 2 de diciembre'`); uno **mínimo** (`id`, `name`, `price`). Una opinión en inglés con `lang="en"`, un texto largo con palabra sin espacios (§7), un enlace externo (el transportista). **Carrito** de tres líneas (mezcal × 2, rebozo Grana × 1, plato no disponible), `totals` de `cartTotals` con IVA incluido, envío por calcular y el umbral «Envío gratis desde $3,000». **Pedido** con referencia `BYA-2611-07`, dirección de Oaxaca, «Tarjeta terminada en 4242»; **historial** de cinco pedidos (uno por estado, uno cancelado y uno en USD aproximado). Ninguna variante avisa con el banco (§7).
- **Vitest:** lo de §8 en las 36 variantes y además: (1) **ningún cálculo de precio en un bloque**: los bancos dan totales que **no** son la suma de sus partes y los bloques pintan lo dado; (2) un solo `GPriceScope` por región y ningún precio fuera de `GPrice`; (3) la calificación es texto («4,8 de 5 · 312 opiniones» en `es-MX`, «4.8 out of 5…» con los `labels` en inglés), nunca un `img` ni un icono; (4) lo no disponible a la vista con su motivo y sin acción; (5) la elección viaja: la misma `ChosenOption` sale igual en la línea del carrito, el resumen del pedido y el historial; (6) cada intención con su carga exacta; (7) ningún campo de tarjeta (EC6); (8) avisos EC1 a EC7 y los propios, una vez; (9) SSR de las 36 sin `window`.
- **Playwright, Chromium** (`packages/blocks/playground/ecommerce/<seccion>.html`, spec `tests/blocks-ecommerce.spec.mjs`, **puertos propios 4217 (A), 4218 (B), 4219 (C)**): lo de §8 (320, 390, 1440; zoom 200 %; Tab con foco visible; reducido; oscuro; consola limpia; tema por defecto y dos del CLI) y, por sección, su «Verificación propia». La pasada en Firefox y WebKit, una vez al cerrar el lote.

## 34. Compuertas de Ecommerce (bruno, en el script del paquete y en `gates.sh`)

Las de §9 sobre los `Gb*` y además:

```bash
test -f packages/blocks/dist/ecommerce.js && test -f packages/blocks/dist/ecommerce.d.ts
! grep -q "createApp" packages/blocks/dist/ecommerce.js
! grep -q "__shared" packages/blocks/dist/ecommerce.js
! grep -qE "g-[a-z-]+__[a-z]" packages/blocks/dist/ecommerce.js      # ninguna clase interna de un componente
! grep -qE "fetch\(|XMLHttpRequest|sendBeacon" packages/blocks/dist/ecommerce.js
! grep -q "describeQuery" packages/blocks/dist/ecommerce.js          # Ecommerce no carga Booking
! grep -q "GbProductCard01" packages/blocks/dist/booking.js           # Booking no paga Ecommerce
! grep -q "GbProductCard01" packages/blocks/dist/marketing.js
! grep -q "GbProductCard01" packages/blocks/dist/blocks.js
! grep -q "cartTotals" packages/blocks/dist/booking.js packages/blocks/dist/marketing.js
! grep -qE "cc-(number|csc|exp)" packages/blocks/src/blocks/Gb*/*.vue  # ningún campo de tarjeta (§27 regla 6)
test "$(gzip -c packages/blocks/dist/marketing.js | wc -c)" -le 18432
test "$(gzip -c packages/blocks/dist/booking.js | wc -c)" -le 37888
test "$(gzip -c packages/blocks/dist/ecommerce.js | wc -c)" -le 51200   # #932
```

Por variante (#932), con `measure-partial.mjs` y los `bundle.cap`/`bundle.variantCap` de cada `meta.json`: cada una de las 36 ≤ 7 168 B, las tres de Checkout ≤ 9 728 B y `+cartTotals=2048`.

## 35. Alcance: lo que se reutiliza y lo que queda fuera (#914)

- **Políticas de la tienda** (devoluciones, envíos): **`GbPolicies` de `@grana/blocks/booking`** tal cual (receta del README; su `Policy.id` es el ancla que citan `Incentive.policy` y los consentimientos de Checkout). No se reexporta (una sección, una entrada; importación parcial: la variante sola pesa ≤ 5 KiB). Hallazgo EC-L5 por si la familia de políticas se muda a una entrada común.
- **Lo que dicen de la tienda** (no de un producto): `GbTestimonials` de Marketing. **Las opiniones de un producto** son `GbReviews` (E6, #920): llevan calificación por opinión, fecha, compra verificada, lo que se compró, la respuesta de la tienda y la distribución, que `Testimonial` no tiene; la anatomía de la cita (`figure` › `blockquote` + `figcaption` con `GText`) es la misma.
- **Fuera del lote:** pago y pasarela (slot de la aplicación, §27 regla 6), validación de cupones, cálculo de envío y de existencias (aplicación), lista de deseos, comparador, búsqueda con sugerencias (receta con `GCombobox`), estrellas (M-L2), mini carrito en la cabecera (receta: `GBadge` con la cuenta sobre el `GBtn` del carrito y `GbCart03`), mapa de la tienda (`GEmbed`), un muelle genérico y una columna pegada (BK-L1, BK-L2).

## 36. Correcciones al plan §4.2 (#914)

| Plan | Contrato | Por qué |
| --- | --- | --- |
| Product grid con `GFilterBar` | Facetas con **`GTag` de alternar** en un `GTagGroup layout="facets"` (01, 03) o en un `GAccordion` por faceta (02) | `GFilterBar` es un editor de reglas (`op`, `value`) sobre columnas de datos (`filter-bar.md`); quien compra elige valores, y un filtro de la vista que actúa en el acto es `GTag` de alternar (`radio-group.md` «Frontera», `tag.md`) |
| Product grid con `GCardGroup` | `GAdaptiveLayout role="list"` (§1.5) | `GCardGroup` es una barra de tarjetas que filtran (`role="toolbar"`, #603), no una rejilla (como #816) |
| Product grid 03 «lista» | 03 **Renglones** (`GStack as="ul"` con la tarjeta horizontal de E1 02) | La misma anatomía de E1 en las tres; «lista» sin tarjeta pediría tipografía propia |
| Quick view con dos variantes (diálogo · hoja) | Tres: 01 Diálogo (hoja inferior en el teléfono), 02 Hoja lateral, **03 Elegir y añadir** (solo opciones, cantidad y «Añadir») | Toda sección lleva tres variantes con la misma `Props`; la tercera es el destino de «Elegir opciones» de la tarjeta compacta (§27 regla 3) |
| Reviews «resumen + distribución con `GProgress`» | La distribución se **lee como texto**; la barra de `GProgress` va en un envoltorio `aria-hidden` (decorativa) | Una distribución no es un progreso: `role="progressbar"` mentiría al lector. Hallazgo EC-L2 (`GProgress` como medidor) |
| Reviews depende de M-L2 (P2) | Contratado ya con **calificación textual** (§27 regla 5) | El dato es el mismo con o sin estrellas; esperar a M-L2 dejaría la ficha de producto sin opiniones |
| Cart 02 «resumen al pie (muelle)» | 02 **Resumen al pie** sin muelle: el total va **justo antes** de la acción principal, en la misma tarjeta del pie | No hay muelle genérico (BK-L2), y el pie pegado que existe (`GFormActions sticky`) es de un `GForm`: el carrito no es un formulario |
| Cart 03 «compacta (cajón)» | 03 **Cajón**: el bloque lleva su `GDialog placement="end"` (hoja lateral; pantalla completa en el teléfono) con `v-model:open` | Un cajón es una superficie con foco atrapado y devolución: `GDialog` ya lo cuida (`GSidebar drawer` es navegación) |
| Checkout 03 «dos columnas con resumen pegado» | 03 **Con el pedido al lado** (sin pegar) y el total en el `status` de `GFormActions sticky` | Sin CSS no hay columna pegada (BK-L1); el pie pegado de `GFormActions` sí existe y cuida 2.4.11 |
| Checkout 02 «una página larga con secciones» | 02 **Se pliega lo hecho**: `GFormSection mode="collapsible"` por paso; el hecho se pliega con su `summary` y «Cambiar» | Una página larga con todo abierto obliga a desplazar entre el envío y el total en el teléfono; plegar lo hecho da el mismo formulario sin perder nada |
| Order history 02 «tarjetas con `GStepper` de estado» | Se mantiene, con `GStepper` **informativo** (`navigation="none"`) y el estado también en texto | Igual que Confirmation 02 (#873) |
| Promo 03 «dos ofertas lado a lado» | 03 **Línea** (una oferta en una línea sobria); dos ofertas = dos `GbPromo02` en una rejilla de la aplicación (receta) | Una sección, una `interface`: «dos ofertas» obligaría a una lista con un título de sección que repite el de la oferta en 01 y 02 |
| Promo con `eyebrow` | Sin antetítulo (B-L1) | `GSection` no tiene antetítulo |
| E1 «`rating?`» (M-L2) | `rating` textual (§27 regla 5) | — |

## 37. Hallazgos para lima (no bloquean; en `PENDIENTES.md` §3)

- **EC-L1 · El nombre del producto como `h1`.** En una ficha de producto el nombre suele ser el `h1`; ningún bloque pinta `h1` (§1 regla 6) y `GSection` admite 2 a 4. Como Offer detail, Product overview titula la sección con el nombre (`h2` bajo el `h1` de la aplicación). Reservado: que la aplicación declare la sección como cabecera de página (`GSection headingLevel="1"` o el `h1` en `GPageHeader` con el nombre), ronda propia si el usuario lo pide.
- **EC-L2 · `GProgress` como medidor.** La distribución de opiniones y el umbral del carrito son medidas, no progresos de una tarea; hoy `GProgress` es siempre `progressbar`. Reservado: `role="meter"` (cambia la v1). Mientras, Reviews lo usa decorativo con el texto al lado y Cart lo usa como progreso hacia una meta (que sí lo es).
- **EC-L3 · Recuento de una rejilla filtrada sin carga.** Si la aplicación filtra en el cliente sin `loading`, nadie anuncia «24 productos» (sin región viva propia, #792); el recuento visible cambia y `GTag` anuncia su estado. Se resolverá con `announce` (nombre reservado en `api.md` «Grana Blocks» regla 2).
- **EC-L4 · Muestra de color.** Una opción de color se dice con su nombre («Añil»); una muestra visual del color (un círculo) necesita CSS o un componente. Reservado (ronda de kiwi si una plantilla lo pide); la foto por color (`OptionValue.photo`) ya enseña el color real.
- **EC-L5 · Políticas en una entrada común.** `GbPolicies` vive en Booking y la tienda la importa de ahí (§35). Si una tercera familia la pide, se muda a una entrada común sin cambiar su API.
- **EC-L6 · Copiar un código** (Promo) depende de la aplicación (`activate` síncrono con `navigator.clipboard`, como «Compartir» de Confirmation, #873); un acuse en el sitio («Copiado») es el patrón de acciones con acuse de `api.md` (#643), reservado para cuando un componente lo ofrezca.
- **EC-L7 · Dos columnas: decidida, `GSplit`** (#933, enmendada por #942 y por **#950**; el usuario aprobó la primitiva el 2026-10-28, «Sí, GSplit»; ronda corta de kiwi `design/lab/split/r01/`; contrato `split.md`). `GAdaptiveLayout` pone en línea propia todo hijo con varios controles, una `section` o una `table` (#361, #365), y sin CSS (#763) un bloque no podía poner un panel al lado de otra cosa. **Casos (lista corregida, S-L7):** Product overview 01 (`ratio="1:1" collapse="lg" gap="lg"`, PO-L1), Cart 01 (`ratio="3:2" gap="lg"`, CR-L1), Checkout 03 (`ratio="3:2" gap="lg"`) y Availability 03 (`ratio="2:1" gap="lg"`, AV-L1; enmienda #892/#899). **No son casos:** Booking summary 03 (una línea de tres piezas que se parte por tamaño: sigue con `GAdaptiveLayout`, #906 y #908) y Product grid 02 (ya queda al lado con `GAdaptiveLayout`, #942; puede adoptarlo sin cambiar de API). Uso medido y encargos en §40. **Cerrada (#954, #955, 2026-10-28):** recompuestas por bruno (8710e80), medidas por coco (b19cd65: Ecommerce 11 129/11 129, Booking 6507/6516 con AV-C1 de `GDatePicker`, #952) y Product overview, Cart y Checkout en `candidate` (f285c25); Availability sigue `candidate`.
- **CK-L1 · `focus()` público en `GRadioGroup`** (#940). Un paso de Checkout que empieza por un `choice` no puede llevar el foco a la pregunta sin leer el DOM interno; el foco se queda en el botón del paso. Reservado (cambio de la v1).
- **BK-L1, BK-L2, BK-L3** siguen abiertos y los toca Ecommerce (resumen pegado, muelle del total, precio al final del renglón). **`GSplit` no resuelve BK-L1** (#951): su `sticky` queda reservada porque, medida (K11 de kiwi, tres motores), una región final más alta que el visor deja su último control fuera de la vista al enfocarlo (2.4.7, 2.4.11). Condiciones para la ronda que la abra en `split.md` «Reservados»: solo `end`, salida para lo que no cabe (alto máximo con desplazamiento propio, #570, o pegarse por abajo), suma de la cabecera (#515) y la prueba de foco en verde.

## 38. Encargos de Ecommerce

**bruno**, en **tres partes** (cada una con su puerto si corre a la vez: A 4217, B 4218, C 4219). Opus en las cinco complejas (§26); Sonnet en el resto.

- **A · Infraestructura + E1, E3, E12, E11:** entrada `@grana/blocks/ecommerce` (§32: `src/ecommerce.js`, plugin, `exports`, `typesVersions`, `vite.config.js`, externos, `build-types.mjs` por `family`); `types/common.d.ts` (mudanza de §28, con la prueba de tipos de Booking verde) y `types/ecommerce.d.ts`; **`cartTotals`** (§29) con su prueba; `common/` de Ecommerce (calificación textual, elección y variante, `ChosenOption`); `bank/ecommerce.js`; compuertas de §34; `tests/blocks-ecommerce.spec.mjs` y `playground/ecommerce/`. Secciones **Product card**, **Category previews**, **Trust**, **Promo**.
- **B · E2, E4, E5, E6:** **Product grid** (facetas, orden, `GLoadRegion`, `GEmpty filtered`, `GPagination`), **Product overview** (galería que sigue a la elección, opciones, cantidad, variante), **Quick view** (comparte el panel de E4 por `common/`, no importa la variante de E4), **Reviews** (anatomía de cita compartida con Testimonials, distribución decorativa). Depende de A en la entrada, el banco y la tarjeta.
- **C · E7, E8, E9, E10:** **Cart** (huella con `restore`, cantidad por gesto, umbral, cajón), **Checkout** (motor de campos llevado a `common/` desde Guest form sin cambiarlo, pasos con `submit` cancelable, paso de la aplicación por slot, EC6), **Order summary**, **Order history** (`GTable` con `rowHref`/`detail`, seguimiento con `GStepper` informativo).
- Al final de las tres: la medida de peso (entrada con sus trozos, 36 parciales y `cartTotals` sola) para que lima fije los topes, y la pasada única en Firefox y WebKit.

**coco** (Sonnet; **Opus en las cinco complejas**): **solo auditoría** de las doce secciones (`auditoria-visual.md` previa y posterior, dos temas del CLI, rúbrica de movimiento sobre lo compuesto: vista rápida y cajón de `GDialog`, visor de `GGallery`, cifras que ruedan de `GPrice` en el carrito, plegado de `GFormSection` y `GAccordion`, la huella), resultado en `design/lab/blocks/ecommerce/auditoria.md`; lo que pida CSS vuelve a lima.

**mora-docs** (Sonnet): un `README.md` por sección y las recetas: «La elección que viaja» (de `GbProductOverview` a `GbCart`, `GbOrderSummary` y `GbOrderHistory` con las mismas `ChosenOption`), «`cartTotals` o el servidor» (los mismos `Totals` de los dos lados), «El pago en el slot» (Checkout con la pasarela de la aplicación), «Mini carrito en la cabecera», «Dos promociones lado a lado», «Políticas de la tienda con `GbPolicies`».

## 39. Remates tras la construcción (#932 a #941, 2026-10-26)

Tras las partes B (942ce40) y C (64ec599) de bruno, con coco auditando en paralelo (`design/lab/blocks/ecommerce/`).

| # | Qué | Dónde |
| --- | --- | --- |
| #932 | Topes: entrada 51 200 B, variante 7 168 B, Checkout 9 728 B, `cartTotals` 2 048 B | §32, §34, `api.md` regla 5 |
| #933 | Dos columnas (EC-L7): recomendación `GSplit`, pendiente del usuario; Product overview, Cart, Checkout y Product grid en `draft` | §37, cuatro contratos |
| #934 | PO-L2: preguntas sin `name` fuera de un formulario | §27 regla 9, `product-overview.md` |
| #935 | PG-L1: `labels.facetOption` con `{label}` y `{count}`, aviso PG4 | `product-grid.md` |
| #936 | PG-L2 y D: `event: null` en `change` y `retry` | §30 |
| #937 | `GGallery` en tira sigue un `index` externo (defecto de `GGallery`) | `gallery.md` «Reglas de props» |
| #938 | Checkout: `labels.quantity`, claves del pedido opcionales, G5 → CK4 | `checkout.md` |
| #939 | Order history: «Ver el pedido» al final de la ficha; la puerta y las tarjetas se nombran con el código | `order-history.md` |
| #940 | Esc escalonado en el cajón; paso que empieza por `choice` (CK-L1); `GbActions block`; escuchas de la raíz | §27 regla 10, `cart.md`, `checkout.md` |
| #941 | Copia del motor de campos en `common/fields.js` con prueba de paridad | §32 |

**Estado:** Product card, Category previews, Trust, Promo, Product grid, Quick view, Reviews, Order summary y Order history son `candidate` tras la auditoría de coco y el remate de bruno (#942, #945). ~~Product overview, Cart y Checkout siguen en `draft` hasta que el usuario decida EC-L7 (#933)~~ **Las doce secciones en `candidate`** desde 2026-10-28 (EC-L7 cerrada por `GSplit`, #955); **Product grid es `candidate`** (#942). Quick view comparte el panel con Product overview pero no tiene dos columnas: no depende de la pregunta.

**Encargos a bruno (remate de Ecommerce):**

1. Pesos (#932): `bundle.cap: 51200` y `bundle.variantCap: 7168` en los doce `meta.json` (Checkout `9728`); compuertas de entrada, por variante y `+cartTotals=2048` en `measure-partial.mjs` (hoy dice `1024`) y `gates.sh`.
2. PO-L2 (#934): quitar `name = option.key` de las preguntas en `common/ProductPanel.js`; prueba con dos paneles del mismo producto en una página (elegir en uno no desmarca el otro).
3. PG-L1 (#935): `labels.facetOption` (plantilla o función), aviso PG4, cuenta con `Intl`; tipos y banco.
4. `event: null` (#936): `change` de Cart y `retry` de Product grid y Order history; tipos `Event | null`.
5. `GGallery` (#937, en `packages/vue`): la tira sigue un `index` externo desplazando solo la tira, sin mover el foco ni anunciar; prueba en `GGallery.test.js` y en el spec de la galería.
6. Checkout (#938): `labels.quantity` en el tipo (claves del pedido opcionales, C5 solo si el bloque pinta el pedido); retirar G5 de su lista y añadir CK4; un campo sin grupo va después de los grupos.
7. Order history (#939): «Ver el pedido» al final del `detail` en 01 (`labels.open(reference)`, `navigate` u `open`); la puerta y las tarjetas con el código como nombre (sin `labels.open`).
8. #940: prueba de que el foco no cae en `body` al avanzar a un paso que empieza por `choice`.
9. #941: prueba de paridad de `common/fields.js` con el motor de Guest form.
10. ~~**No tocar** el «al lado» de Product overview 01, Cart 01, Checkout 03 y Product grid 02 hasta la decisión del usuario (#933).~~ Decidido (#950): ver §40.

## 40. Dos columnas con `GSplit` (#946 a #951, 2026-10-28)

El usuario aprobó `GSplit` («Sí, GSplit»); contrato en `split.md`, ronda de kiwi `design/lab/split/r01/` (c8a34ce, 1272/1272 en tres motores sobre los bloques reales). Resuelve EC-L7 (§37) **sin** resolver BK-L1 (`sticky` reservada, #951).

| Bloque | Antes | Después (`GSplit`) | 1440 · 1024 · 768 · ≤ 390 · texto 200 % |
| --- | --- | --- | --- |
| Product overview 01 | `GAdaptiveLayout gap="lg"` › `g-adapt-wide` galería + `g-adapt-standard` panel | `ratio="1:1" collapse="lg" gap="lg"`: `#start` galería · `#end` panel (el `GAccordion` sigue después, en el `GStack`) | al lado (488 + 488) · al lado (447 + 447) · apilado · apilado · apilado |
| Cart 01 | `GAdaptiveLayout gap="lg"` › líneas + resumen | `ratio="3:2" gap="lg"`: `#start` líneas · `#end` resumen | al lado (586 + 390) · al lado (536 + 358) · apilado · apilado · apilado |
| Checkout 03 | `GAdaptiveLayout gap="lg"` › pasos y formulario + pedido | `ratio="3:2" gap="lg"`: `#start` `GStepper` + `GForm` · `#end` pedido | al lado (586 + 390) · al lado (536 + 358) · apilado · apilado · apilado |
| Availability 03 | `GPriceScope` › `GStack gap="lg"` › calendario + tarjeta | `GPriceScope` › `ratio="2:1" gap="lg"`: `#start` `GDatePicker` · `#end` `GCard` | al lado (651 + 325) · apilado · apilado · apilado · apilado |

**Reglas para la recomposición:** los envoltorios `div class="g-adapt-*"` desaparecen (las pistas de `GAdaptiveLayout` no significan nada en `GSplit`); el orden del DOM no cambia (lo que era primero va en `#start`); ningún CSS ni utilidad en el bloque (§1); `collapse` solo donde la tabla lo dice; ninguna verificación pide el «al lado» por debajo del umbral (`split.md` «Umbrales»). Los topes de peso no suben (§32 y §34; `booking.js` #907).

**Encargos a bruno** (después de construir `GSplit`, `split.md` «Encargos»): (1) recomponer las cuatro variantes con la tabla; (2) sus pruebas de Vitest (estructura: `g-split` con las clases pedidas y las dos regiones en orden) y los casos de `tests/blocks-ecommerce.spec.mjs` y del spec de Booking (al lado a 1440 y apilado a 768 y 390, proporción, orden de Tab, sin desplazamiento horizontal, la secuencia 768 → 1440 sin quedarse apilado en Checkout 03); (3) medir los pesos (`ecommerce.js`, las tres variantes, `booking.js`) y registrar; (4) `meta.json` de Product overview, Cart y Checkout a `candidate` **solo** cuando la auditoría de coco lo confirme. **coco:** medir las cuatro recomposiciones con dos temas del CLI y anotar el resultado en `design/lab/blocks/ecommerce/auditoria.md` y `design/lab/blocks/booking/auditoria.md` (addendum), más S-L11 (a). **mora-docs:** los cuatro README de sección.

---

# Parte D · SaaS (`@grana/blocks/saas`, lote 4c)

**Estado:** contratado (DECISIONS.md **#957 a #974**, 2026-10-29; decisión del usuario del 2026-10-29: «vamos con 4c·0», sobre el plan `design/lab/blocks/plan.md` §4.5 y las fases pequeñas de §5.1) · **Flujo:** reducido (#766), **por fases** (§54): 4c·1 → 4c·2 → 4c·3, cada una bruno → coco (auditoría) → remates → README, **un solo agente a la vez** · **Usuario final:** quien **administra la cuenta** de un producto SaaS: la dueña de un taller que paga el plan, invita a su equipo y conecta su tienda; entra pocas veces, con prisa y a menudo desde el teléfono, y **lo que más teme es una sorpresa**: un cobro que no esperaba, alguien que pierde el acceso sin saberlo, una clave que deja de funcionar en producción. A veces con lector de pantalla, gestor de contraseñas o zoom. Plantilla: **«Milpa»**, el programa de inventario y pedidos que usa el taller **Barro y Agave** (el mismo de Ecommerce), con su espacio de trabajo, su equipo y sus planes en pesos (§49).

## 41. Secciones del lote

| Sección (plan §4.5) | Contrato | Variantes | Fase (§54) | Compleja (coco y bruno en Opus) |
| --- | --- | --- | --- | --- |
| S1 Auth | `auth.md` | `GbAuth01` Tarjeta · `02` Dividida con marca · `03` Un paso por pantalla | 4c·1 | **Sí** (formulario por pasos, credenciales, gestores de contraseñas) |
| S2 Onboarding | `onboarding.md` | `GbOnboarding01` Uno abierto · `02` Lista con progreso · `03` Tarjetas de bienvenida | 4c·1 | — |
| S4 Profile | `profile.md` | `GbProfile01` En secciones · `02` Con vista previa · `03` Compacto | 4c·1 | — |
| S3 Settings layout | `settings-layout.md` | `GbSettingsLayout01` Índice al lado · `02` Pestañas · `03` Una página con índice | 4c·1 | **Sí** (navegación y paneles; `GTabs` con teclado compuesto) |
| S7 Usage & limits | `usage.md` | `GbUsage01` Barras · `02` Cifras · `03` Lo que se acerca | 4c·2 | — |
| S8 Team & roles | `team.md` | `GbTeam01` Tabla · `02` Tarjetas · `03` Invitar arriba | 4c·2 | **Sí** (tabla, diálogos, formulario de invitación, confirmaciones) |
| S11 Notification preferences | `notification-preferences.md` | `GbNotificationPreferences01` Matriz · `02` Por aviso · `03` Por canal | 4c·2 | — |
| S10 Integrations | `integrations.md` | `GbIntegrations01` Galería · `02` Renglones · `03` Con permisos a la vista | 4c·2 | — |
| S5 Plans & upgrade | `plans.md` | `GbPlans01` Tarjetas · `02` Comparar y elegir · `03` Propuesta al límite | 4c·3 | **Sí** (precios por periodo, consecuencias, confirmación) |
| S6 Billing | `billing.md` | `GbBilling01` Resumen completo · `02` Facturas · `03` Próximo cobro | 4c·3 | **Sí** (tabla, diálogo de cancelación, estado de cobro) |
| S9 API keys & tokens | `api-keys.md` | `GbApiKeys01` Tabla · `02` Tarjetas · `03` Crear arriba | 4c·3 | **Sí** (secreto de una vez, diálogos) |
| S12 Changelog & audit log | `changelog.md` | `GbChangelog01` Novedades · `02` Registro filtrable · `03` Qué hay de nuevo | 4c·3 | — |

Tags `gb-auth-01`, `gb-settings-layout-02`, `gb-notification-preferences-03`… (#764). **36 variantes.**

## 42. Reglas comunes de SaaS (amplían §1 a §5 y toman de §15 y §27 lo que se nombra)

1. **Todo lo de §1** (cero CSS y utilidades, solo API pública, una `interface Props`, primitivas, listas reales, encabezados por anidación con `useSectionLevel()`, texto suelto en `GText`, enlaces = `GBtn`/`GCard`/`GTag`, nada se mueve solo, sin `fetch` ni región viva propia, `labels` sin valores por defecto, raíz con `data-gb`, SSR) y la jerarquía de acciones de §3. De §15 y §27 valen tal cual: **precios solo con `GPrice`** y **una `GPriceScope` por región** (obligatoria con más de un precio: EC1), **pasos directos de `labels`** (`form`, `errorSummary`, `price`, `table`, `tabs`, `dialog`, `tags`, `pagination`), **fechas en `<time datetime>`** con `Intl` y **sin relativas** («hace 3 días» cambia con la caché; la última actividad de una clave o de un miembro se dice con su fecha), **lo no disponible se dice, no se esconde**, **estado de vista sí, de negocio no** (#913 regla 9), **una pregunta que no es un campo no lleva `name`** (#934) y **escuchas de la raíz** (#940). **Ningún bloque de SaaS pinta `h1`** (§53 SA-L2: `GCard` y `GSection` no admiten nivel 1; el de la página es de la aplicación).
2. **Entradas *peer* que compone** (todas públicas, #792): `@grana/vue` (principal: `GSection`, `GStack`, `GContainer`, `GAdaptiveLayout`, `GSplit`, `GSurface`, `GCard`, `GText`, `GBtn`, `GIcon`, `GBadge`, `GAvatar`, `GSummary`, `GMetric`, `GProgress`, `GAccordion`, `GTabs`, `GTable`, `GDialog`, `GDivider`, `GForm` y campos —`GInput`, `GTextarea`, `GSelect`, `GCheckbox`, `GCheckboxGroup`, `GRadioGroup`, `GSwitch`—, `GFormSection`, `GFormLayout`, `GFormRow`, `GFieldGroup`, `GErrorSummary`, `GFormActions`, `GEmpty`, `useSectionLevel`), **`@grana/vue/price`** (`GPrice`, `GPriceScope`, `formatPrice`; Plans, Billing, Team, Usage) y **`@grana/vue/tag`** (`GTag`; Changelog, Integrations). **No** compone `@grana/vue/booking`, `/gallery`, `/combobox`, `/file-field`, `/status` ni `/load-region` (§52). El README de cada sección dice qué entradas carga la aplicación.
3. **La cuenta nunca te sorprende** (personalidad de familia, §43, #958).
4. **Seguridad por construcción** (§44, #959).
5. **Intenciones con objeto, después de decir la consecuencia** (§46): la carga lleva **el dato entero** (`member`, `key`, `plan`, `integration`, `invoice`) y lo elegido (`role`, `period`, `scopes`), para que la aplicación haga su llamada sin volver a buscar nada. Una intención destructiva o que cuesta se emite **solo tras decir lo que cambia** (§43). Nada guarda, cobra, invita ni revoca por su cuenta.
6. **Un dato de cuenta llega dicho por la aplicación.** Los estados de negocio (`statusText` de una suscripción, una factura, un miembro o una integración), los importes ya calculados (prorrateos, próximo cobro), las cifras de consumo (`valueText`) y los permisos los da la aplicación **en texto**; el bloque formatea solo fechas ISO (`Intl`), importes (`GPrice`) y cuentas (`Intl.NumberFormat`). **Grana no calcula prorrateos, impuestos ni consumos** (como #769 y #911).
7. **Identidad obligatoria** (`id: string`) en todo lo que se puede accionar: `Plan`, `Member`, `Invite`, `Role`, `ApiKey`, `Scope`, `Integration`, `NotifEvent`, `NotifChannel`, `SettingsSection`, `OnboardingStep`, `LogEntry`, `Invoice` (aviso SA5).

## 43. «La cuenta nunca te sorprende» (personalidad de familia, #958)

Lo que distingue a la familia: **cada acción con consecuencia dice antes, junto al botón, qué cambia, cuánto cuesta, desde cuándo y qué se pierde**, en palabras y no solo en color; y **lo pendiente se ve donde se decide**, no solo en un correo. Sirve a quien administra la cuenta: decide con la información delante, en el mismo sitio donde pulsa, y nada se hace a medias en silencio.

### 43.1 `Consequence`: lo que cambia, dicho antes

Tipo común (§45). Lo **da la aplicación** (sabe el prorrateo, a quién afecta y si se deshace); el bloque solo lo dice:

| Campo | Se pinta | Componente |
| --- | --- | --- |
| `changes` (obligatorio) | La frase de lo que cambia («Luis Mendoza dejará de ver los pedidos de Barro y Agave») | `GText size="body-sm"` |
| `cost` | Lo que cuesta o se deja de pagar, con su periodo («+ $199 al mes») | `GPrice size="sm"` con `lead` = `labels.consequence.cost`, dentro de la `GPriceScope` del bloque |
| `when` | Desde cuándo (ISO) | `<time datetime>` con `labels.consequence.when` («Desde el 1 de diciembre») |
| `loses` | Lo que se pierde, en lista | `GText as="div" size="body-sm"` › `labels.consequence.loses` + `ul` |
| `reversible` | `true` → `labels.consequence.reversible`; `false` → `labels.consequence.irreversible`; String → ese texto («Puedes volver a invitarlo cuando quieras») | `GText size="caption" tone="muted"` |

El conjunto lleva un `id` y es la **descripción accesible** (`aria-describedby`) del botón que confirma: quien usa lector oye la consecuencia al llegar al botón, antes de pulsarlo (como `assurance` de CTA, #838). Una `Consequence` sin `changes` no se pinta (aviso SA1).

### 43.2 Dos formas de decirla

1. **En el sitio, antes de pulsar** (una acción principal por vista: elegir un plan, enviar una invitación, conectar una integración, saltar un paso, ampliar el plan al límite, crear la cuenta). La consecuencia va **justo antes del botón**, a la vista, como dato de la sección (`Plan.change`, `invite.consequence`, `Integration.permissions`, `OnboardingStep.skip`, `UsageItem.atLimit`, `consequence` de Auth).
2. **Confirmación en el sitio, al pulsar** (acciones **destructivas** sobre un elemento de una lista o sobre la cuenta: quitar un miembro o una invitación, cambiar un rol, revocar una clave, desconectar una integración, cancelar la suscripción, bajar de plan). El bloque abre **su propio `GDialog role="alertdialog"`** (pieza común `common/ConfirmDialog`, una por bloque, montada solo al abrir):
   - `title` = `labels.confirm.<acción>.title` (plantilla o función con el nombre del elemento: «¿Quitar a Luis Mendoza del espacio?»); `size="sm"`; `from` = el disparador (el foco vuelve a él al cerrar, #583).
   - Cuerpo: la `Consequence` del elemento (`item.consequences?.[acción]`, §45) con 43.1.
   - Pie: **«Mantener»** (`labels.keep`, `GBtn variant="outline"`, con `autofocus`: el foco inicial va a lo que no destruye, APG *Alert Dialog*) y la confirmación (`labels.confirm.<acción>.action`, «Quitar a Luis», `GBtn color="danger"`, con `aria-describedby` a la consecuencia). Esc y «Mantener» cierran sin emitir.
   - **La intención se emite al confirmar**, con el evento del clic del botón de confirmación (§46). El diálogo se cierra en el mismo gesto; el resultado lo cuenta la aplicación (`GToast` o el dato que cambia).
   - **El foco nunca cae en `body`** (#913): si el elemento confirmado desaparece de la lista al actualizarse los datos y su disparador ya no existe, el bloque lleva el foco al control principal del elemento que ocupa su sitio (el siguiente, o el anterior si era el último) y, sin elementos, al primer control de la sección. Lo resuelve con los `id` de **sus propios** controles (generados con `useId()`), nunca con el DOM interno de un componente.
   - Sin `Consequence` para una acción destructiva: el diálogo se abre igual con la pregunta sola y avisa **SA1** (la pregunta no basta para no sorprender, pero sin ella el gesto sería peor).

**No hay dos pasos para lo que no destruye ni cuesta** (guardar el perfil, marcar un aviso, reenviar una invitación, copiar): se hace al pulsar.

### 43.3 `Attention`: lo pendiente, donde se decide

Tipo común (§45): `{ tone: 'info' | 'warning' | 'error'; text: string }`. Un pago fallido, una invitación caducada, un método de pago que vence, un límite cerca, una integración con error: **siempre en texto**, con el componente del sitio donde se toma la decisión:

| Sitio | Cómo |
| --- | --- |
| Índice de ajustes (Settings layout) | `badge` de la `GCard` del índice o de la pestaña (`GTabs` `badge`), con `badgeColor` por `tone` (`info` → `info`, `warning` → `warning`, `error` → `danger`): «Pago fallido» junto a «Facturación» |
| Tarjeta de un dato (suscripción, método, uso, integración) | `GCard status` (`info`/`warning`/`error`) con `statusText` = `text` |
| Fila de una tabla (miembro, invitación, factura, clave) | `rowStatus` de `GTable` (#600) con `text` |

**Lo pendiente no anima, no parpadea y no habla solo** (sin región viva propia, #792): está a la vista cuando la persona llega. Si la aplicación quiere anunciarlo al cambiar, usa `GToast` o la isla.

## 44. Seguridad por construcción (#959)

1. **El bloque no guarda contraseñas, códigos, tokens ni secretos.** Un campo de contraseña o de código **no tiene `v-model` en el bloque**, **no entra en `values`**, en `update:values` ni en ninguna otra carga de evento: viaja **solo** en el `FormData` de `submit` (el que construye `GForm`). Cambiar de `mode` o de paso desmonta el campo y su valor se pierde con él. Ningún secreto se escribe en `console`, en un atributo `data-*`, en la URL ni en el título de la página.
2. **Ningún campo de pago** (EC6, #922): ningún bloque SaaS pinta un campo con `autocomplete` `cc-*` ni un `name` que empiece por `card`; si llega en datos (`AuthField`, `ProfileField`), **no se pinta** (aviso SA2). El método de pago es un **texto de la aplicación** (`MaskedCard`, §45: «Visa terminada en 4242»), nunca el número; cambiarlo es la intención `change-method` (la pasarela es de la aplicación).
3. **Un secreto se pinta completo una sola vez** (`OnceSecret`, §45): API keys lo enseña en un campo de solo lectura con «Copiar» y «Ya la guardé» (`api-keys.md`); al cerrar, emite `update:created` con `null` y **recuerda el `keyId`** (no el valor) durante la vida de la instancia: si la aplicación vuelve a pasar el mismo `keyId`, no lo pinta (aviso SA3). **Solo en el cliente**: en el render del servidor no se pinta (un HTML con el secreto podría quedar en una caché); se pinta al montar (aviso SA4 si llega en SSR). Después, la clave se ve solo **enmascarada** (`ApiKey.masked`, texto de la aplicación).
4. **`autocomplete` correcto** (1.3.5; WCAG 3.3.8 *Autenticación accesible*): identidad `username` (con `type="email"` o `text`), contraseña de entrada `current-password`, contraseña nueva `new-password`, código `one-time-code` (`inputmode="numeric"`), nombre `name`, correo del perfil `email`. **Nunca se bloquea pegar** ni el gestor de contraseñas; sin pruebas cognitivas; el código es un solo campo (no una casilla por cifra). En los pasos que piden la contraseña (03 de Auth, `new-password`, `verify`), la identidad está **en el mismo formulario** como campo de solo lectura con `autocomplete="username"` (el gestor asocia la contraseña a la cuenta correcta).
5. **Sin red, sin almacenamiento, sin pago real** (#780, #922): nada de `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource`, `localStorage`, `sessionStorage`, `indexedDB` ni `document.cookie` (compuertas de §50 y prueba de §49). El portapapeles lo usa **la aplicación** en su escucha de `copy` (síncrona, en el gesto; EC-L6 sigue reservada: §53 SA-L3).
6. **Sin región viva propia** (#792): «Copiado», «Invitación enviada», «Clave revocada» los dice la aplicación (`GToast`) o el componente (`output`/`valid` de un campo, `status` de `GFormActions`).
7. **Los errores de credenciales los redacta la aplicación** (`error` de Auth): el contrato recomienda en el README no revelar si la cuenta existe («Correo o contraseña incorrectos»; en `reset`, el mismo `done` exista o no la cuenta). El bloque no distingue.

## 45. Tipos compartidos de SaaS (#957, #960)

En **`packages/blocks/types/saas.d.ts`** (a mano, bruno), reexportados desde `dist/saas.d.ts`; sin `[key: string]: unknown` (§2). **`Plan`, `PlanFeature`, `PlanLimit` y `BillingPeriod` van a `types/common.d.ts`** desde el primer día: los usa SaaS (S5) y los usará Marketing M6 Pricing (no construido), con el mismo nombre y la misma forma (§51). Reutilizan `Media`, `Action`, `NavLink` (§2), `PriceSpec`, `PriceRegion`, `Consent`, `GuestField` (§16/§28, `types/common.d.ts`) y los tipos de `@grana/vue/price`.

**Nombres sin choque (#960):** un nombre, una forma en todo el paquete. `Member` es el de SaaS (§ abajo): el `Member` **reservado** de Marketing (§2, M9 Team, sin construir ni usar) pasa a llamarse **`Person`** con la misma forma (encargo a bruno en 4c·1). El canal de avisos se llama **`NotifChannel`**, porque `Channel` ya es el canal de contacto de Booking (§16, construido).

```ts
// ── De otras familias y de @grana/vue (no se redefinen) ──
type Money = import('@grana/vue/price').Money
type PriceLabels = import('@grana/vue/price').PriceLabels
// Media, Action, NavLink: §2 · PriceSpec, PriceRegion, Consent, GuestField: types/common.d.ts

// ── Personalidad (§43) ──
type Consequence = {
  changes: string                       // lo que cambia, en una frase de la aplicación
  cost?: PriceSpec                      // lo que cuesta o se deja de pagar (value negativo = se deja de pagar; GPrice pinta U+2212)
  when?: string                         // ISO: desde cuándo
  loses?: string[]                      // lo que se pierde
  reversible?: boolean | string         // true/false: labels.consequence.reversible / irreversible; String: cómo se deshace
}
type Consequences<A extends string> = Partial<Record<A, Consequence>>
type Attention = { tone: 'info' | 'warning' | 'error'; text: string }
/** Textos de una confirmación (§43.2): plantilla con {name} o función del nombre del elemento. */
type ConfirmLabels = { title: string | ((name: string) => string); action: string | ((name: string) => string) }
type ConsequenceLabels = { cost?: string; when?: string | ((date: string) => string); loses?: string; reversible?: string; irreversible?: string }

// ── S1 Auth ──
type AuthMode = 'sign-in' | 'sign-up' | 'reset' | 'new-password' | 'verify'
/** Otra forma de entrar. Sin logo: Grana solo dibuja Lucide, que no tiene marcas; el logo lo pone la aplicación en el slot `provider`. */
type Provider = { id: string; label: string }   // «Continuar con Arrecife»
type PasswordRule = { id?: string; label: string; test?: (value: string) => boolean }   // dicha antes de escribir; test opcional marca «cumplida»
/** Un campo extra de alta (empresa, teléfono). Lista cerrada sin contraseña ni pago (§44). */
type AuthField = Omit<GuestField, 'type'> & { type?: 'text' | 'email' | 'tel' | 'select' }
type AuthFields = {
  identifier: { label: string; type?: 'email' | 'text'; hint?: string }   // correo o usuario (autocomplete="username")
  password?: { label: string; hint?: string; rules?: PasswordRule[] }      // current-password o new-password según el modo
  name?: { label: string; hint?: string; required?: boolean }              // solo sign-up (autocomplete="name")
  code?: { label: string; hint?: string; length?: number }                 // solo verify (one-time-code)
  extra?: AuthField[]                                                      // solo sign-up
}

// ── S2 Onboarding ──
type OnboardingStep = {
  id: string; title: string; description?: string
  status: 'todo' | 'done' | 'skipped'
  optional?: boolean                    // se puede saltar
  manual?: boolean                      // se puede marcar a mano («Ya lo hice»)
  estimate?: string                     // «2 min» (texto de la aplicación)
  why?: string                          // por qué importa
  action?: Action                       // lo que lleva a hacerlo
  skip?: Consequence                    // qué se pierde al saltarlo (§43.2 forma 1)
  media?: Media                         // 03
}

// ── S3 Settings layout ──
type SettingsSection = { id: string; title: string; description?: string; icon?: string; href?: string; group?: string; attention?: Attention }

// ── S4 Profile ──
type Profile = { name: string; email?: string; avatar?: string; meta?: string }   // lo guardado: la vista previa y el avatar
type ProfileField = Omit<GuestField, 'type'> & {
  type?: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select' | 'switch'
  change?: string                       // qué pasa si cambia («Te enviaremos un enlace al correo nuevo…»): a la vista en cuanto el valor difiere de `saved`
  pending?: string                      // algo a medias («Pendiente de confirmar: ana.r@…»): advertencia del campo
  readonly?: boolean | string           // String: por qué no se puede cambiar
}

// ── S5 Plans (types/common.d.ts: también Marketing M6) ──
type BillingPeriod = 'month' | 'year'
type PlanFeature = { id?: string; label: string; included: boolean | string; group?: string; hint?: string }   // String: «Hasta 5»
type PlanLimit = { id?: string; label: string; value: string }          // «Miembros» · «Hasta 10»
type Plan = {
  id: string; name: string; summary?: string
  badge?: string                        // «El más elegido»: texto, nunca solo color
  prices: Partial<Record<BillingPeriod, PriceSpec>>   // con unit/unitLabel («/ mes», «al mes»)
  note?: Partial<Record<BillingPeriod, string>>       // «2 meses gratis al pagar el año»
  features: PlanFeature[]
  limits?: PlanLimit[]
  available?: boolean | string
  contact?: Action                      // «Hablar con ventas»: sin precio ni cambio directo
  change?: Partial<Record<BillingPeriod, Consequence>>   // SaaS: relativo al plan actual, de la aplicación. Marketing lo ignora
}

// ── S6 Billing ──
type MaskedCard = { label: string; detail?: string; attention?: Attention }   // «Visa terminada en 4242» · «Vence 12/2027»: texto, nunca el número
type Subscription = {
  plan: string                          // nombre del plan («Taller»)
  status: 'trialing' | 'active' | 'past-due' | 'canceling' | 'canceled' | 'paused'
  statusText: string
  period: BillingPeriod
  price: PriceSpec
  next?: { date: string; amount: PriceSpec; note?: string }   // próximo cobro, ya calculado
  endsAt?: string                       // ISO: fin de la prueba o de la cancelación
  seats?: { used: number; total: number | null }
  attention?: Attention                 // «El cobro del 1 de noviembre falló»
  consequences?: Consequences<'cancel'>
}
type Invoice = {
  id: string; reference: string; date: string
  amount: Money | Money[]
  status: 'paid' | 'open' | 'failed' | 'refunded' | 'void'; statusText: string
  period?: { from: string; to: string }
  href?: string                         // la factura (la fila es puerta)
  download?: NavLink                    // el PDF
}

// ── S7 Usage ──
type UsageItem = {
  id: string; label: string
  used: number; limit: number | null    // null: sin límite (labels.unlimited)
  valueText: string                     // «8,2 de 10 GB» (de la aplicación)
  warnAt?: number                       // fracción 0..1; por defecto 0.8
  resets?: string                       // ISO: cuándo vuelve a cero
  trend?: { value: string; direction: 'up' | 'down' | 'flat'; text?: string }   // a GMetric
  atLimit?: Consequence                 // qué pasa al llegar al límite (§43.2 forma 1)
}

// ── S8 Team ──
type Role = { id: string; label: string; description: string; assignable?: boolean }   // description: lo que puede hacer
type Member = {
  id: string; name: string; email: string; avatar?: string
  role: string                          // Role.id
  statusText?: string; attention?: Attention
  you?: boolean                         // labels.you
  locked?: string                       // por qué no se puede quitar ni cambiar («Es la dueña del espacio»)
  lastActive?: string                   // ISO
  consequences?: Consequences<'remove' | 'change-role'>
}
type Invite = { id: string; email: string; role: string; sentAt: string; expiresAt?: string; attention?: Attention; consequences?: Consequences<'remove'> }
type Seats = { used: number; total: number | null; price?: PriceSpec }

// ── S9 API keys ──
type Scope = { id: string; label: string; description?: string; group?: string; danger?: boolean }   // danger: escritura o borrado
type ApiKey = {
  id: string; name: string; masked: string   // «mlp_live_…4f2a» (de la aplicación)
  scopes: string[]                      // Scope.id
  createdAt: string; lastUsed?: string | null; expiresAt?: string | null
  statusText?: string; attention?: Attention
  consequences?: Consequences<'revoke'>
}
type OnceSecret = { keyId: string; value: string }   // se pinta completo una sola vez (§44 regla 3)

// ── S10 Integrations ──
type Integration = {
  id: string; name: string; summary?: string; category?: string
  logo?: Media                          // imagen de la aplicación (Lucide no tiene marcas)
  status: 'available' | 'connected' | 'error' | 'unavailable'; statusText: string
  connectedAs?: string                  // «tienda@barroyagave.mx»
  permissions?: string[]                // lo que podrá hacer, dicho antes de conectar
  href?: string                         // la ficha de la integración
  configure?: { href?: string }         // ajustes de una conectada
  attention?: Attention
  consequences?: Consequences<'disconnect'>
}

// ── S11 Notification preferences ──
type NotifChannel = { id: string; label: string; detail?: string; icon?: string; available?: boolean | string }   // detail: «ana@…»; String: «Agrega un teléfono»
type NotifEvent = { id: string; label: string; description?: string; group?: string; channels?: string[]; required?: Record<string, string> }   // required: canal → motivo (siempre encendido)
type NotifValue = Record<string, string[]>   // NotifEvent.id → NotifChannel.id[]

// ── S12 Changelog & audit log ──
type LogEntry = {
  id: string; date: string; title: string; summary?: string; body?: string
  lang?: string
  kind?: string                         // id de `kinds` («new», «fixed», «security»…)
  tags?: string[]
  href?: string; external?: boolean
  media?: Media
  actor?: { name: string; avatar?: string }   // registro: quién
  target?: string                             // registro: sobre qué
}
type LogKind = { id: string; label: string }
```

**Identidad y orden:** `id` obligatorio en lo que se acciona (§42 regla 7; ausente: SA5, se usa el índice o, si no puede funcionar sin él, el elemento se omite). Un `id` que cita otro que no existe (un `Member.role` sin `Role`, un `scope` sin `Scope`, `current` sin `Plan`, un canal sin `NotifChannel`): aviso **SA6** y se pinta lo que se pueda (el rol con su `id` en crudo no: sin rol a la vista y el `GSelect` sin valor).

## 46. Eventos de intención de SaaS (además de §4)

**Carga común:** `{ event, … }`; `event` es `Event | null` (#936) cuando el componente compuesto no entrega un evento del DOM. En una intención **confirmada** (§43.2), `event` es el clic del botón de confirmación.

| Evento | Carga | Secciones | Cuándo |
| --- | --- | --- | --- |
| `submit` | **Auth:** `{ event, mode, step, data: FormData, values, consents, final, preventDefault(), defaultPrevented }` (`values` sin contraseña ni código, §44) · **Profile:** `{ event, data, values, changed: string[] }` · **Notifications:** `{ event, value, muted }` | S1, S4, S11 | Envío válido. En Auth, **síncrono y cancelable** (como Checkout, #922): en 03, sin `preventDefault()` el paso de identidad pasa al de la contraseña; con él, espera a que la aplicación cambie `step` (p. ej. lleva a un SSO) |
| `provider` | `{ event, provider, mode }` | S1 | «Continuar con…» |
| `switch` | `{ event, to: AuthMode }` | S1 | Cambiar de modo («Crear cuenta», «¿Olvidaste tu contraseña?»). Con `routes[to]`, es un enlace y sigue la guarda de `navigate` (#505): `preventDefault()` deja la ruta al router |
| `complete` · `skip` | `{ event, step }` · `{ event, step: OnboardingStep \| null }` | S2 | «Ya lo hice» (paso `manual`) · saltar un paso `optional`, o la guía entera con `step: null` |
| `avatar` | `{ event, action: 'change' \| 'remove' }` | S4 | «Cambiar foto» / «Quitar foto» (el selector y el recorte son de la aplicación, §52) |
| `upgrade` | `{ event, plan, period, direction: 'up' \| 'down' \| 'period' }` (S5) · `{ event, item: UsageItem \| null }` (S7) | S5, S7 | Cambiar de plan (`down`, tras confirmar) · «Ampliar plan» de un consumo. El nombre del plan (§4.5) se conserva para cualquier cambio; `direction` dice cuál |
| `cancel` · `resume` | `{ event, subscription }` | S6 | Cancelar (tras confirmar) · reanudar una suscripción `canceling` |
| `change-method` | `{ event }` | S6 | «Cambiar método de pago» (la pasarela es de la aplicación) |
| `open` | `{ event, invoice }` · `{ event, entry }` | S6, S12 | Abrir una factura o una entrada **sin** `href` (con `href`, `navigate`) |
| `invite` | `{ event, emails: string[], role: string }` | S8 | Invitación válida |
| `change-role` | `{ event, member, role }` | S8 | Tras confirmar (`role` = el nuevo `Role`) |
| `remove` | `{ event, member }` · `{ event, invite }` | S8 | Tras confirmar |
| `resend` | `{ event, invite }` | S8 | «Reenviar» |
| `create` | `{ event, name, scopes: string[], expires: string \| null }` | S9 | Clave nueva válida |
| `revoke` | `{ event, key }` | S9 | Tras confirmar |
| `copy` | `{ event, keyId }` | S9 | «Copiar» del secreto: la aplicación lo copia en su escucha (síncrona, en el gesto) |
| `connect` · `disconnect` · `configure` | `{ event, integration }` | S10 | Conectar (la autorización es de la aplicación) · desconectar (tras confirmar) · ajustes sin `configure.href` |
| `update:step` · `update:current` · `update:values` · `update:period` · `update:value` · `update:muted` · `update:created` · `update:page` · `update:filters` · `update:since` | el valor | S1 · S2, S3 · S4 · S5 · S11 · S11 · S9 · S6, S12 · S12 · S12 | Estado de vista (§42)¹ |
| `retry` | `{ event: null }` | S6, S12 | «Reintentar» de la tabla que falló |

¹ **No existe `update:mode`:** el modo de Auth cambia por `switch` (suele ser una ruta). Los nombres `page` y `filter` del plan son `update:page` y `update:filters` (como Ecommerce, #914).

`navigate` y `activate` siguen §4 (enlaces y `Action` sin `href`). **Una activación por gesto** (#661) en lo que abre algo (confirmación, invitación, crear clave): la cumplen `GDialog` y `GBtn`; el bloque no añade otra.

## 47. Avisos comunes de SaaS (`[Grana Gb<Sección><NN>]`, guarda de #653)

Los de §5 (C1 a C8), **K3** y **K4** de §18 (precio sin `value`; `available` que no es Boolean ni String), **EC1** de §31 (precios sin `prices`) y además:

| # | Motivo | Qué pasa |
| --- | --- | --- |
| SA1 | Una acción destructiva o que cuesta sin su `Consequence` (o una `Consequence` sin `changes`) | Se confirma solo con la pregunta (§43.2) o el botón va sin consecuencia |
| SA2 | Un campo de datos con `autocomplete` `cc-*`, `name` que empieza por `card`, o un tipo de contraseña en `AuthField`/`ProfileField` (§44 reglas 1 y 2) | El campo **no se pinta** |
| SA3 | Un `OnceSecret` con un `keyId` ya mostrado y cerrado en esta instancia | No se pinta otra vez |
| SA4 | `created` (secreto) presente en el render del servidor | No se pinta hasta montar en el cliente |
| SA5 | Falta el `id` obligatorio (§42 regla 7) | Se usa el índice; si la acción depende de él, el elemento se pinta sin acciones |
| SA6 | Un `id` que cita algo que no existe (rol, alcance, plan actual, canal, sección actual) | Se pinta lo que se pueda; el control queda sin valor |
| SA7 | Sin escucha de la intención principal de la sección (`submit`, `invite`, `create`, `upgrade`, `connect`) | Se pinta igual (nada puede hacerse) |
| SA8 | `Attention` sin `text` o con `tone` fuera de lista | No se pinta la atención |
| SA9 | Falta un texto de `labels.confirm.<acción>` o `labels.keep` cuando el bloque va a confirmar | La acción **no se ofrece** (sin pregunta no hay confirmación posible) |

## 48. Archivos, `meta.json`, tipos, paquete y peso (#957; encargo a bruno, 4c·1)

```
packages/blocks/src/blocks/Gb<Sección>/        ← como §6: props.js, 01..03.vue, meta.json, test, banco, README
packages/blocks/src/blocks/common/             ← se reutiliza; lo nuevo de SaaS aquí: Consequence (pintar 43.1), ConfirmDialog (43.2, en 4c·2), Attention → badge/status/rowStatus, campos de credencial
packages/blocks/src/saas.js                    ← índice: las 36 variantes (puras) y el plugin `saas`
packages/blocks/types/saas.d.ts                ← §45, a mano
packages/blocks/types/common.d.ts              ← + Plan, PlanFeature, PlanLimit, BillingPeriod (§45)
packages/blocks/src/blocks/bank/saas.js        ← la empresa común (§49)
```

- **`meta.json`:** la forma de §6 con `family: "saas"`, `bundle.entry: "@grana/blocks/saas"` y `complex: true` en las seis complejas (§41). `build-types.mjs` escribe `dist/saas.d.ts` por `family` (§19), reexporta `types/common.d.ts`, `types/saas.d.ts` y los de §2, y amplía `GlobalComponents`; se detiene ante una variante sin exportar o una exportación sin `meta.json`. Las secciones se añaden **por fases**: el índice y el generador aceptan una entrada con solo las secciones construidas (4 en 4c·1, 8 en 4c·2, 12 en 4c·3).
- **`package.json`:** `exports` gana `"./saas"` (`types`/`import`/`default`) y `typesVersions` `saas`; `vite.config.js` gana la entrada; externos: `vue`, `@grana/vue`, `@grana/vue/price`, `@grana/vue/tag`.
- **Código común:** el motor de campos de Checkout (`common/fields.js`, #941) sirve a Auth y Profile **si** no sube `dist/ecommerce.js` ni `dist/booking.js` (topes que no se vuelven a subir, #907, #932); si los sube, SaaS lleva su copia y la prueba de paridad la cubre (como #941).
- **Peso (tope tras la medida, como Booking #879):** **sin tope en 4c·1 y 4c·2**; referencias: **una variante importada sola ≤ 7 KiB (7 168 B)** y, para las complejas que llevan formulario y diálogo (Auth, Team, API keys, Billing), **≤ 9,5 KiB (9 728 B)**; la entrada se mide en cada fase y se anota en los `meta.json` (`bundle.measured`) y en `CHANGELOG.md`. **lima fija los topes al cerrar 4c·3** con las 36 medidas. Una variante que pase su referencia vuelve a lima con su medida. **`dist/marketing.js`, `dist/booking.js`, `dist/ecommerce.js` y `dist/blocks.js` no suben** por SaaS (compuertas de §50).

## 49. Banco común y verificación de SaaS

- **Banco común** (`bank/saas.js`, bruno): **Milpa**, programa de inventario y pedidos para talleres; el espacio **Barro y Agave** (Oaxaca). `prices` `{ currency: 'MXN', taxes: 'IVA incluido' }`. **Planes:** Semilla (gratis, 1 miembro, 100 productos), **Taller** (actual; $249 al mes o $2,490 al año, «2 meses gratis», 10 miembros, 2 000 productos), Cooperativa ($899 al mes o $8,990 al año, miembros sin límite, `badge` «Para varios talleres»), Empresa (`contact` «Hablar con ventas»). **Equipo:** Ana Ruiz (dueña, `you`, `locked`), Luis Mendoza (Edición), Rosa Hernández (Lectura, `attention` «No ha entrado en 60 días»), una invitación pendiente y una caducada; roles Dueña, Administración, Edición, Lectura; asientos 4 de 10 a $49 al mes cada uno. **Consumo:** productos 1 840 de 2 000 (cerca), almacenamiento 8,2 de 10 GB, pedidos del mes 312 sin límite. **Facturación:** suscripción activa anual, próximo cobro $2,490 el 1 de diciembre, `MaskedCard` «Visa terminada en 4242 · Vence 12/2027», seis facturas (una `failed`, una `refunded`, una en USD aproximada). **Claves:** dos activas, una caducada; alcances de lectura y escritura (`danger`) de pedidos, productos e inventario. **Integraciones** (nombres inventados, sin marcas reales): «Paquetería del Sur» (conectada), «Cobros Lince» (error), «Hoja de Cálculo Abierta» (disponible), «Tienda Nopal» (no disponible con motivo). **Avisos:** eventos de pedidos, inventario, equipo y seguridad (este con `required` por correo); canales correo, SMS (no disponible: «Agrega un teléfono») y en la aplicación. **Novedades y registro:** ocho entradas, una en inglés con `lang="en"`. Además de §7: texto largo con palabra sin espacios, un enlace externo, un elemento mínimo. Ninguna variante avisa con el banco.
- **Vitest** (lo de §8 en las variantes de la fase y además): (1) **ningún secreto persiste** (prueba de §50): con el banco completo pasando por todas las variantes construidas, espías en `fetch`, `XMLHttpRequest.prototype.open`, `navigator.sendBeacon`, `Storage.prototype.setItem`, el `setter` de `document.cookie` y `console.*` que **nadie llama** con un valor de contraseña, código o `OnceSecret`; la contraseña y el código no aparecen en ninguna carga de evento salvo en `data` de `submit`; tras «Ya la guardé» el valor del secreto no está en el DOM; (2) `autocomplete` exacto por modo (§44 regla 4); (3) ningún campo `cc-*` ni `card*` (SA2); (4) cada intención destructiva abre el `alertdialog` con la consecuencia como `aria-describedby` del botón y **solo** emite al confirmar; «Mantener» y Esc no emiten y devuelven el foco al disparador; (5) un solo `GPriceScope` por región y ningún precio fuera de `GPrice`; (6) toda fecha visible en `<time datetime>`; (7) `Attention` siempre en texto (badge, `statusText` o `rowStatus.text`); (8) avisos SA1 a SA9 y los propios, una vez; (9) SSR de las variantes sin `window` y sin el secreto en el HTML.
- **Playwright, Chromium** (`packages/blocks/playground/saas/<seccion>.html`, spec `tests/blocks-saas.spec.mjs`, **puerto propio 4223**, **`--workers=1`**, plan §5.1): lo de §8 (320, 390, 1440; zoom 200 %; Tab con foco visible; reducido; oscuro; consola limpia; tema por defecto y dos del CLI) y la «Verificación propia» de cada sección. **Firefox y WebKit una vez al cerrar cada fase**, un motor tras otro y solo sobre los specs de esa fase; la pasada completa de SaaS, al cerrar 4c·3.

## 50. Compuertas de SaaS (bruno, en el script del paquete y en `gates.sh`)

Las de §9 sobre los `Gb*` y además:

```bash
test -f packages/blocks/dist/saas.js && test -f packages/blocks/dist/saas.d.ts
! grep -q "createApp" packages/blocks/dist/saas.js
! grep -q "__shared" packages/blocks/dist/saas.js
! grep -qE "g-[a-z-]+__[a-z]" packages/blocks/dist/saas.js           # ninguna clase interna de un componente
! grep -qE "fetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource" packages/blocks/dist/saas.js
! grep -qE "localStorage|sessionStorage|indexedDB|document\.cookie" packages/blocks/dist/saas.js   # el bloque no persiste nada (§44)
! grep -rqE "cc-(name|number|csc|exp|type)" packages/blocks/src/blocks/Gb*/                       # ningún campo de pago (amplía la de §34 a todo el bloque)
! grep -qE "describeQuery|cartTotals" packages/blocks/dist/saas.js     # SaaS no carga Booking ni Ecommerce
! grep -qE "GbAuth01|GbTeam01" packages/blocks/dist/marketing.js packages/blocks/dist/booking.js packages/blocks/dist/ecommerce.js packages/blocks/dist/blocks.js
! grep -qE "GbHero01|GbOfferList01|GbProductCard01" packages/blocks/dist/saas.js
test "$(gzip -c packages/blocks/dist/marketing.js | wc -c)" -le 18432
test "$(gzip -c packages/blocks/dist/booking.js | wc -c)" -le 37888
test "$(gzip -c packages/blocks/dist/ecommerce.js | wc -c)" -le 51200
# saas.js y por variante: sin tope hasta 4c·3 (§48); measure-partial.mjs mide y anota
```

Y la **prueba de que ningún bloque SaaS persiste un secreto** (§49 Vitest punto 1) es compuerta: corre en `npm test` y en el job `verify` de `ci.yml`.

## 51. Alcance: lo que se reutiliza y lo que queda fuera (#957)

- **`Plan` sirve a Marketing M6 Pricing** (sin construir): el tipo vive en `types/common.d.ts` y M6, cuando se contrate, lo usará tal cual; `change` es solo de SaaS (Marketing lo ignora, como una variante ignora lo que no usa). **No se reexporta `GbPlans` desde Marketing** (una sección, una entrada): la página pública de precios será M6 con sus variantes.
- **Políticas, opiniones, consentimientos:** `Consent` de `types/common.d.ts` (Auth); para los términos completos, `GbPolicies` de Booking (receta).
- **Fuera del lote:** pago y pasarela (la aplicación; `change-method`), autorización OAuth de proveedores e integraciones (la aplicación), verificación en dos pasos completa (solo el campo del código, `verify`; los códigos de respaldo son un `OnceSecret` de la aplicación: receta con `GbApiKeys` no, con el patrón de §44 regla 3 en el README de Auth), borrar la cuenta o el espacio (receta: `GbSettingsLayout` con una sección «Zona de peligro» y una confirmación de la aplicación), sesiones y dispositivos activos, facturación por consumo con gráfica (`GChart` reservado), recorte de la foto de perfil, sugerencias de personas al invitar (§53 SA-L7), barra «qué hay de nuevo» flotante.

## 52. Correcciones al plan §4.5 (#961)

| Plan | Contrato | Por qué |
| --- | --- | --- |
| Settings layout 01 con `GSidebar` | 01 **Índice al lado**: `GSplit` con un `nav` de `GCard interaction="link" current` (la lista maestro-detalle de `card.md`) | `GSidebar` es **la** navegación de la aplicación: fija al visor, con barra inferior en el teléfono; una segunda en la página pondría dos barras inferiores (`sidebar.md` `contained`, `mode`) |
| Plans 01 y Integrations 01 con `GCardGroup` | `GAdaptiveLayout role="list"` (§1 regla 5) | `GCardGroup` es una barra de tarjetas que filtran (`role="toolbar"`, #603), no una rejilla (#816, #914) |
| Usage 03 y Billing con `GStatus` | `GCard status` + `statusText` (§43.3) | `GStatus` es la isla de la aplicación (servicio imperativo, `draft` en su rediseño): un bloque no empuja mensajes ni tiene región viva (#792) |
| Changelog con `GDataList` | 01 `GStack as="ol"` de `GCard`; 02 `GTable` con filtros de columna | `GDataList` es una lista de pares etiqueta–valor de widget (`widget.md`), sin título, cuerpo ni fecha |
| Changelog 02 con `GFilterBar` suelto | Los filtros de columna de `GTable` (`columns[].filter`, que ya componen `GFilterBar`) con `filterMode="external"` | Un registro de actividad **es** una tabla de datos; el editor de reglas va con sus columnas |
| Onboarding 01 con `GStepper` | 01 **Uno abierto**: `GAccordion` de pasos | `GStepper` deriva el estado del índice (`i < actual` = completo, `stepper.md`): una guía que se hace en cualquier orden mentiría |
| Onboarding con `GCheckbox` por paso | `GBtn` «Ya lo hice» en los pasos `manual` (`complete`) | Una casilla que se desmarca pediría «des-completar» un paso; la intención es de un solo sentido |
| Profile con `GFileField` para el avatar | `GBtn` «Cambiar foto» / «Quitar foto» (`avatar`) | El recorte y la vista previa son de la aplicación; `GFileField` sube archivos con un adaptador (12 KB *peer*) y no recorta |
| Team con `GCombobox` para invitar | `GTextarea` «un correo por línea o separados por comas», validado con el `ValidityState` de `type="email"` (`team.md`) | Sin sugerencias de personas conocidas no hace falta la búsqueda (21,7 KB *peer*); SA-L7 |
| Integrations 02 «lista con interruptor» | 02 **Renglones** con botones «Conectar» / «Desconectar» | Conectar abre la autorización de otro sitio (cambio de contexto, 3.2.2) y desconectar destruye: un interruptor promete un cambio inmediato y reversible |
| S12 `page`, `filter`; S3 `update:current` | `update:page`, `update:filters`, `update:current` | Mismo vocabulario que Ecommerce (#914) |
| S5 «aviso de límite» y S7 03 «aviso» con `GStatus`/`GBtn` | `GCard status="warning"` con la consecuencia del límite y la propuesta | Ídem; la consecuencia (§43) es el contenido |
| S1 «`fields`» libre | `fields` con las claves de credencial que pinta el bloque (`identifier`, `password`, `name`, `code`) + `extra` cerrado | El `autocomplete` de las credenciales no puede depender del dato (§44 regla 4) |

## 53. Hallazgos para lima (no bloquean; en `PENDIENTES.md` §3)

- **SA-L1 · `GProgress` como medidor (EC-L2, ahora con dos casos más).** El consumo de un recurso y la ocupación de asientos son **medidas** de un rango conocido, no el avance de una tarea: `role="progressbar"` mentiría. Mientras, Usage y Team pintan la barra **decorativa** (envoltorio `aria-hidden`) con el texto al lado (como Reviews, #914). Recomendación al usuario: contratar `GProgress role="meter"` antes de 4c·2 (cambio de la v1, peso pequeño; pregunta 1 de #974).
- **SA-L2 · `h1` de la página de entrada** (con EC-L1). Una página de entrada es solo Auth; `GCard` y `GSection` no admiten nivel 1. Mientras, el título va a `useSectionLevel()` (h2 en la raíz) y la aplicación pone el `h1` (su `GPageHeader` o el nombre del producto). Pregunta 2 de #974.
- **SA-L3 · Copiar con acuse en el sitio** (con EC-L6, #643): el secreto se copia en la escucha de `copy` de la aplicación y el acuse lo da ella (`GToast`); «Copiado» en el propio botón llegará con el patrón de acciones con acuse cuando un componente lo ofrezca.
- **SA-L4 · `aria-current="page"` en `GCard`.** El índice de Settings 01 usa `current` de `GCard`, que pone `aria-current="true"` (maestro-detalle). Cuando cada sección es una ruta, `page` sería más exacto; reservado (`current` con valor de `aria-current`, cambio de la v1).
- **SA-L5 · Consecuencia en tiempo real.** El prorrateo de un cambio de plan o de asientos depende del servidor; hoy la aplicación lo pone en el dato antes de pintar. Si una plantilla necesita pedirlo al abrir la confirmación (asíncrono), el diálogo necesitará un estado `loading` con su texto: reservado.
- **SA-L6 · Índice que sigue al desplazamiento** (Settings 03). Nada se mueve solo y el bloque no observa el desplazamiento: el índice no marca la sección a la vista. Reservado (2.2.2 no lo prohíbe, pero añade estado y observadores).
- **SA-L7 · Invitar con sugerencias** (`GTagInput`, #338 y #473, o `GCombobox multiple` con texto libre): reservado hasta que una plantilla tenga directorio de personas.
- **SA-L8 · Rejilla de casillas** (Notifications 01). La matriz canal × aviso usa `GTable` con `GCheckbox field: false` en celdas; en tarjetas (`responsive`) cada casilla lleva el nombre completo («Correo · Pedido nuevo»). Una rejilla de casillas con flechas (APG *Grid*) queda reservada.

## 54. Reparto por fases y encargos (plan §5.1, #974)

Reglas de ejecución en todas las fases: **un solo agente a la vez**; Playwright **`--workers=1`**, un motor tras otro; **verificación por niveles** (en la fase, solo sus secciones y en Chromium; los tres motores una vez al cerrar la fase y solo sobre sus specs; la pasada completa de SaaS al cerrar 4c·3); cada fase cierra con push y una línea en Notion antes de la siguiente.

| Fase | Secciones | bruno | coco (auditoría) | mora-docs |
| --- | --- | --- | --- | --- |
| **4c·0** | Contratos (este documento y los doce `*.md`) | — | — | — |
| **4c·1** | S1 Auth, S2 Onboarding, S4 Profile, S3 Settings layout + **infraestructura** | **Opus** (Auth y Settings layout complejas; la infraestructura) | **Opus** (Auth, Settings layout) | README de las cuatro |
| **4c·2** | S7 Usage, S8 Team, S11 Notification preferences, S10 Integrations + `common/ConfirmDialog` | **Opus** (Team; la confirmación común) | **Opus** en Team, Sonnet en el resto | README de las cuatro |
| **4c·3** | S5 Plans, S6 Billing, S9 API keys, S12 Changelog + **topes de peso** (lima) | **Opus** (Plans, Billing, API keys) | **Opus** en las tres complejas | README de las cuatro, recetas de la familia y sitio |

**Encargos a bruno · 4c·1 (en este orden):**

1. **Infraestructura de la entrada** `@grana/blocks/saas` (§48): `src/saas.js` y plugin `saas`; `exports`, `typesVersions`, `vite.config.js` y externos; `build-types.mjs` por `family: "saas"` (acepta una entrada con solo las secciones construidas); `types/saas.d.ts` con **todo** §45 (también lo de 4c·2 y 4c·3, para que los tipos no cambien de forma); `Plan`, `PlanFeature`, `PlanLimit`, `BillingPeriod` en `types/common.d.ts`; **`Member` reservado de `types/marketing.d.ts` → `Person`** (#960, misma forma; prueba de tipos verde).
2. **`common/` de SaaS:** pintar una `Consequence` (§43.1: `GText`, `GPrice` en la región, `<time>`, lista de pérdidas, `reversible`; `id` para `aria-describedby`); `Attention` → `badge`/`badgeColor`, `status`/`statusText` y `rowStatus` (§43.3); **campos de credencial** (§44 regla 4: identidad, contraseña con `rules`, nombre, código; sin `v-model` en contraseña y código); filtro SA2 de campos de datos. Valorar el motor de `common/fields.js` (§48 «Código común»).
3. **`bank/saas.js`** (§49) con todo el banco (también lo de fases siguientes: los tipos ya existen).
4. **Compuertas de §50** en el script del paquete y en `gates.sh`, y la **prueba de no persistencia** (§49 Vitest 1) como prueba del paquete.
5. **Secciones** Auth (`auth.md`), Onboarding (`onboarding.md`), Profile (`profile.md`), Settings layout (`settings-layout.md`): `props.js`, tres variantes, `meta.json` (`status: "draft"`, `complex` donde toca), banco por sección, pruebas, playground `packages/blocks/playground/saas/` y casos en `tests/blocks-saas.spec.mjs` (puerto **4223**, `--workers=1`, solo Chromium dentro de la fase).
6. **Medida de peso** (`dist/saas.js` con sus trozos y las 12 parciales) anotada en `meta.json` y `CHANGELOG.md`; comprobar que Marketing, Booking, Ecommerce y Gestión no suben.
7. **Al cerrar la fase:** Firefox y WebKit **una vez**, un motor tras otro, solo sobre los casos de 4c·1.

**Preguntas al usuario (no bloquean 4c·1; #974):** (1) contratar `GProgress role="meter"` antes de 4c·2 (SA-L1; recomendado: sí, ronda corta y cambio pequeño de la v1); (2) `h1` en Auth cuando es la página entera (SA-L2; recomendado: esperar y decidirlo junto a EC-L1); (3) oferta de retención al cancelar en Billing (recomendado: no; ningún patrón oscuro en el bloque, la aplicación puede ponerla en su propia página).

**coco · 4c·1:** solo auditoría (`auditoria-visual.md` previa y posterior, dos temas del CLI, rúbrica de movimiento sobre lo compuesto: `GAccordion` de Onboarding 01, `GTabs` de Settings 02, la sacudida de `GForm` y el revelado de la contraseña en Auth); resultado en `design/lab/blocks/saas/auditoria.md`; lo que pida CSS vuelve a lima. **mora-docs · 4c·1:** README de las cuatro y la receta «Entrar con gestor de contraseñas» (§44 regla 4).
