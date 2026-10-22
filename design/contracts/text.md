# Contrato · GText (texto suelto)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #851 a #856, 2026-10-22; reabre #196 solo para el texto corrido, #841) · **Basado en:** `design/lab/text/r01/` (kiwi, commit 3063b54: `brief.md`, `declaracion.md` con 26 puntos, hallazgos X-L1 a X-L10, regla de trabajo en `tx.css`, reparto por bloque en `tx.js` `PLAN`; `verificar.mjs`, **2883/2883** en Chromium, Firefox y WebKit sobre los bloques reales, tema por defecto, rústico y lujo, claro y oscuro)
**Tag:** `g-text` · **Categoría:** tipografía · **Paquete:** `@grana/vue` (principal, con compuerta de peso ≤ 512 B gzip; #853)

**Sin forma visible propia:** no aplica «conceptos antes que caja» (#362); sí «Qué lo hace distinto». **No es complejo:** coco y bruno en Sonnet. Decisión de producto ya tomada por el usuario (#841, confirmada el 2026-10-22): no hay pregunta de elección.

## Promesa

Da la tipografía del tema al **texto que no va en una prop de componente** (la cita y su pie, la garantía bajo una llamada a la acción, el legal de un boletín, la dirección de un pie, los párrafos de una respuesta) y a su flujo nativo de dentro, **sin añadir aire hacia fuera**. Lo usan primero los bloques de `@grana/blocks`, que no llevan CSS (#763) ni utilidades (#807); después, cualquier aplicación que quiera escribir ese texto sin hoja propia.

## Qué lo hace distinto (#852)

1. **Una sola pausa, el mismo vocabulario que la página.** El patrón habitual es un componente de texto con `margin-bottom: 1em`, o un `<p>` con los márgenes del navegador: cada texto trae su aire y, junto a una pila, el aire se suma (medido por kiwi: 54–56 px entre la ayuda y el legal de Newsletter). Aquí la raíz **no tiene aire hacia fuera** y dentro hay **una pausa por tamaño**; la de `body` es la relación `sm` de `GStack` («va con lo anterior», #719). Las piezas de una pantalla se separan siempre por lo que significan, nunca por quién escribió el `p`. Medido: el aire doble desaparece en los seis bloques, tres temas y tres motores.
2. **Línea con oficio, sin JS.** `text-wrap: pretty` en el texto (sin una palabra sola en la última línea de una cita, un legal o una respuesta) y `balance` en `figcaption` (el pie de una figura en líneas parecidas). Cero bytes de JS y cero cuadros de pintado; donde el motor no lo sabe hacer, se ignora (medido en C8 a 236 px: Chromium 2 palabras en la última línea, WebKit 4; Firefox no admite `pretty` y se queda como estaba).
3. **La composición se reparte el ritmo sola.** Una opinión son tres textos anidados: la `GText` de fuera decide la pausa entre la cita y su pie, la de dentro la pausa entre sus párrafos, sin props de margen ni números (proximidad de `@scope`; medido en C1).
4. **Reservada: comillas en el idioma de la cita** (`quotes: auto` según `lang`). No entra en la v1: los motores no coinciden (para `es`, Chromium y Firefox ponen “ ” y WebKit « »; C9) y unos datos que ya traen comillas saldrían dobles. Volvería con un dato explícito (§«Reservados»).

## Cuándo usarlo (fronteras)

| Necesito | Uso | No |
| --- | --- | --- |
| Un párrafo, una cita, una dirección, una nota o un legal **sin componente que los tipografíe** | **`GText`** | `<p>` desnudo (márgenes y cursivas del navegador); CSS propio del bloque |
| El título o la descripción de un contenedor | La prop o el slot del componente: `GSection` (`title`, `description`), `GCard` (`title`, `description`, `eyebrow`), `GInput` (`hint`), `GAccordionItem`… (#196) | `GText` en lugar de `description`; `GText` como título (no hay `GHeading`, #854) |
| Un título con nivel | `GSection` (#720) | `GText` con un `hN` (no está en `as`) |
| Aire **entre** piezas de una página o un panel | `GStack` (`gap` como relación, #719) | Márgenes en una `GText` (la raíz siempre vale 0) |
| La medida de lectura (66ch) de un artículo | `GContainer width="reading"` o `prose` (#721, #751) | `GText` no mide la línea; las dos conviven (#855) |
| Una lista de piezas | `GStack as="ul"` (#827) | `GText` como raíz de lista (`ul`/`ol` no están en `as`); una lista **dentro** de un texto sí va dentro de la `GText` |
| El tamaño de un rol sobre un elemento suelto de la aplicación | Utilidad `g-text-{rol}` (#804) | — (frontera en `utilities.md`, #855) |
| Superficie, fondo, borde | `GSurface` / `GCard` | `GText` (no pinta caja) |

**No entra en los componentes:** va en sus **slots libres** (cuerpo de `GCard`, pie de `GCard`, panel de `GAccordionItem`, cuerpo de `GSection`) y fuera de superficies; nunca sustituye `title`/`description`/`hint` ni se mete en la anatomía de un componente. En un hueco que ya tiene rol, el texto elige ese rol (la garantía en el pie de `GCard` es `caption`, el rol del pie).

## Uso

```vue
<GText size="body-sm" tone="muted" :id="assuranceId">Sin pago ahora · Respuesta en menos de 2 h</GText>

<GText as="figure">
  <GText as="blockquote" lang="en" :cite="source.href"><p>…</p><p>…</p></GText>
  <GText as="figcaption" size="body-sm" tone="muted"><span>Ana</span> — <cite>Google</cite></GText>
</GText>

<GText as="div"><p>Primer párrafo de la respuesta.</p><p>Segundo.</p></GText>
```

## Anatomía

```
<as>.g-text.g-text--size-{body|body-sm|caption}.g-text--tone-{default|muted}   ← raíz única; recibe $attrs (lang, dir, id, cite, aria-*, class, style)
└─ [slot default]  texto, fraseo (em, strong, cite, small, a, code, br…) y bloques nativos (p, ul, ol, dl, blockquote, figure, figcaption, address, pre, div)
```

Sin nodos internos, sin envoltorio, sin JS de comportamiento (#444): ni medidas, ni observadores, ni estado.

## Props (#851)

| Prop | Tipo | Valores | Default | Origen / nota |
| --- | --- | --- | --- | --- |
| `as` | String | `p` `div` `span` `small` `blockquote` `figure` `figcaption` `address` | `p` | Lista **cerrada** (#841). Nada interactivo, ningún encabezado (`h1`–`h6` son de `GSection`, #196) y ninguna lista como raíz (#827). Fuera de lista: aviso 1 y se pinta `p`. **`p`, `span` o `small` con bloques dentro** es HTML no válido (en SSR el analizador cierra el `p` antes del bloque y la hidratación no casa): la receta es `as="div"` (sin aviso propio; #851 (e)) |
| `size` | String | `body` `body-sm` `caption` | `body` | **Rol tipográfico del tema con el nombre del rol** (X-L10): lee `--g-text-{rol}-size`, `-line` y `-tracking`. `body-sm` y no `sm`: en `api.md` `sm` es un paso de la escala `xs`…`xl` y en `GPrice` `sm` es body-sm pero `md` es title-sm (#770); con el nombre del rol, la prop, el token y la utilidad `g-text-body-sm` dicen lo mismo. Fuera de lista: aviso 1 y `body` |
| `tone` | String | `default` `muted` | `default` | `default` = `--g-color-text`, `muted` = `--g-color-text-muted`, **siempre explícitos** (no heredados): fuera de superficie no se queda con el negro del navegador en oscuro, y en la zona de marca, que redeclara los dos (§44.5), cambia sola. Sin `subtle` ni colores de familia: el texto suelto no comunica estado. Fuera de lista: aviso 1 y `default` |

**No existen** (y por qué): `density` (el texto no tiene altura de control y el ritmo de un párrafo no cambia porque un panel sea compacto; §4: la densidad no cambia la tipografía); `size` fuera de `body`/`body-sm`/`caption` (títulos y `display` son de los contenedores, #854); `weight`, `italic`, `align`, `truncate`, `lines` (estilo puntual: utilidades de la aplicación o el componente que tiene el hueco); `gap`/`margin` (aire: `GStack`); `color` semántico; `lang`/`dir` como props (van por `$attrs`, regla 9).

## Slots, eventos, métodos

Slot `default`. **Ningún evento ni método.** Componente puro (#444): ningún efecto al importar.

## Reglas (#851)

1. **La raíz no tiene margen ni cursiva** (`margin: 0`, `font-style: normal`) y nunca añade aire hacia fuera: el aire entre piezas lo pone la pila o el `gap` del padre. Medido: dos `GText` en `GStack gap="sm"` quedan a 12 px, solo el `gap` (C4); en Newsletter, entre la ayuda del campo y el legal solo queda el `gap` del formulario (56 → 40 px, tres temas). **Excepción, la anidada (regla 5):** la raíz de una `GText` dentro del flujo de otra recibe el ritmo de la de fuera.
2. **Sin contenido, no se pinta.** Sin slot, o con un slot que solo da comentarios (`v-if` falso), texto en blanco o fragmentos vacíos, el componente no deja elemento. Medido (C4): una `GText` vacía dentro de `GStack` sumaba un `gap` más (24 px entre sus vecinos en vez de 12) aunque midiera 0 de alto. Es comportamiento: lo último que se recortaría por peso (#853).
3. **Rol, peso y color en la raíz:** `--g-font-ui`, `--g-text-{rol}-size`/`-line`/`-tracking` según `size`, **peso de texto `--g-text-body-weight` en los tres tamaños** (X-L4: el rol `caption` pesa 500 en el tema porque es de rótulo; la ayuda de un campo, que es texto, ya lo baja a 400, §23.2) y color según `tone`. Medido: el legal de Newsletter pesa lo mismo que la ayuda de encima.
4. **Ritmo: una pausa por tamaño entre bloques nativos internos, a cualquier profundidad** dentro del ámbito (regla 6). Bloques que la reciben: `p`, `div`, `ul`, `ol`, `dl`, `blockquote`, `figure`, `figcaption`, `address`, `pre`. Pausa **r = `space × 3` (`body`) · `space × 2,5` (`body-sm`) · `space × 2` (`caption`)**: 12 · 10 · 8 px con `space` 4 (medio renglón de cada rol en el tema por defecto). **Nada antes del primero ni tras el último**, contados sin `[hidden]`, `template` ni el nodo del tooltip (#383; medido en C5 con un primer hijo oculto). Los márgenes de bloque se colapsan: dos bloques vecinos quedan a r. **Márgenes en línea a 0**: la cita y la figura arrancan en su borde (sin los 40 px del navegador; medido en las 12 opiniones de Testimonials, tres temas). El ritmo **no es token** (X-L5, #854): es una relación con `space`, como #717; el de `body` es el `sm` de `GStack`.
5. **Anidada: la de fuera da el ritmo a la de dentro, y la de dentro manda en lo suyo.** En una opinión (`figure` `body-sm` › `blockquote` `body-sm` + `figcaption`), la cita y su pie se separan con el ritmo de la figura y los párrafos de la cita con el de la cita (C1). **Nota de construcción para coco:** el valor de la pausa va **escrito en la regla de cada tamaño**, no en una variable (una variable se resuelve en el elemento que recibe el margen, y la anidada tiene la suya: con variable, la cita imponía su 12 a la figura; medido y corregido en la ronda).
6. **Ámbito: no entra en componentes.** El ámbito de una `GText` se corta en cualquier elemento con una clase `g-*` **salvo otra `GText`** (`.g-text`) y en el nodo del tooltip (`.g-tooltip`, #383): lo de dentro de un componente es del componente. Un bloque nativo junto a un componente le da el ritmo por su lado (el margen del bloque se colapsa con el 0 del componente): en el `address` del pie, `p` → `GStack` de canales → `p` quedan a 10 y 10 px (C2). **Límite aceptado (X-L3, #855):** las clases utilitarias también empiezan por `g-` y también cortan el ámbito (regla 12).
7. **Normalización del fraseo, solo de lo que el navegador pone sin que signifique nada:**
   - `cite` y `address` **sin cursiva** (la cursiva no es su semántica; un lector no la anuncia).
   - `small` dentro **no encoge** (`font-size: inherit`): en un `caption` el `smaller` del navegador daría 10 px, por debajo del mínimo de 12 (§7); medido 12 en C3.
   - **`em` e `i` conservan la cursiva** (es el énfasis). **`a` no se toca**: sigue subrayado y con su color (1.4.1; medido en C3). `code` no se toca.
   - **`strong` y `b`:** conservan su semántica; el peso lo decide coco **solo con un token de peso del tema** (`--g-text-title-sm-weight` u otro `--g-text-*-weight`), o deja el `bolder` del navegador; nunca un número escrito (nota de kiwi: `bolder` sube a 700 con un tema de 400/500/600).
   - Encabezados (`h1`–`h6`), `hr` y `table` dentro de una `GText` quedan **fuera de contrato** (no reciben ritmo ni normalización): los títulos son de `GSection` y una tabla es `GTable`.
8. **Listas dentro de un texto:** conservan la viñeta y la semántica, con la sangría **dentro** de la caja y al lado lógico (`padding-inline-start`; RTL medido en C5). El valor de la sangría es de coco, en múltiplos de `space` (`space × 6` en el prototipo).
9. **Línea:** `text-wrap: pretty` en la raíz (se hereda al flujo de dentro) y `balance` en `figcaption`, como raíz o dentro.
10. **`lang` y `dir` por `$attrs`**, en la raíz: una cita en inglés lleva `lang="en"` en su `blockquote` (Testimonials, #821); para texto de usuarios, la receta es `dir="auto"`. `id` y `aria-*` también llegan a la raíz (la garantía de CTA con su `id` para `aria-describedby`, #838).
11. **Cascada:** todo en la capa de Grana (`grana.components`) con **especificidad 0** (`:where`/`@scope`): la aplicación sin capa gana sin `!important` (#516), y una utilidad gana a la regla de la `GText` (#806). Así, una hoja de usuario que aumenta el espacio entre párrafos (1.4.12) gana por construcción.
12. **Límites del ámbito (para el README; #855):**
    - **Utilidad sobre un bloque interno** (`<p class="g-mt-4">` dentro de una `GText`): el corte por prefijo `g-` saca ese `p` del ámbito y conserva el margen del navegador del otro lado (medido en C7: 16 px). Receta: la utilidad va en la **raíz** de la `GText` (que tiene `.g-text` y no corta), o se parte el texto en dos `GText` dentro de un `GStack`. Una utilidad sobre un elemento de **fraseo** (`<span class="g-text-muted">`) no tiene efecto apreciable (no contiene bloques). Afecta igual a `GContainer prose`. Afinar el criterio (lista de utilidades fuera del corte o una marca de raíz de componente) queda **reservado** (§«Reservados»).
    - **Texto suelto mezclado con bloques** en `as="div"` (`Hola <p>…</p>`): el `p` es el primer elemento y no lleva margen arriba, así que toca el texto. Receta: el texto en su propio `p`.
    - **Hijo de la aplicación con `display: flex` o `grid`:** dentro de él los márgenes no se colapsan (dos bloques quedarían a 2r). Es su distribución, no la de `GText`.
    - **`GText` dentro de un componente que ya pone márgenes a sus hijos** (`GStack`, el cuerpo de `GSection`, el panel del acordeón): la raíz vale 0 y el componente decide el aire de fuera (medido en los seis bloques).

## Convivencia con `GContainer prose` (#855; X-L2)

`prose` **mide** la línea (66ch) y `GText` pone **rol y ritmo**: se suman. `.g-text` entra en la lista de **primitivas transparentes** de `prose` (`container.md` «A · Medida», #751), así que una `GText` dentro de `prose` se mide como el resto de la prosa (antes de esta enmienda ocupaba la columna entera: 1280 px frente a 703 de medida, C7, tres motores). La raíz de la `GText` se mide si su etiqueta es de prosa (`p`, `blockquote`, `figure`…); con `as="div"`, se miden sus bloques de dentro. Los componentes de dentro de una `GText` siguen fuera de `prose` (su propio corte).

## Estructura accesible

**Sin `role` ni `aria-*` propios.** La semántica es la del elemento pedido y queda intacta: `figure` toma su nombre de `figcaption`, `blockquote` conserva `cite`, `address` y `cite` siguen siendo lo que son aunque no vayan en cursiva. Nada enfocable, ningún estado. **Mínimos:** texto ≥ 12 px (el menor rol es `caption` y `small` no baja), contraste ≥ 4,5:1 con `default` y `muted` sobre `bg`, `surface` y la zona de marca (medido por kiwi en claro, oscuro y zona, C6, y en los seis bloques con tres temas), reflujo sin desplazamiento horizontal a 390 y 320 px.

## Avisos de desarrollo (`[Grana GText]`, una vez por instancia y motivo; #851 (e), X-L6)

Con la guarda canónica de #653 (`api.md` «Avisos de desarrollo»), al montar y al cambiar la prop que comprueban.

1. `as`, `size` o `tone` fuera de lista (se usa el default: `p`, `body`, `default`). **Un solo texto para las tres props** (por peso, como #754), con el nombre de la prop y el valor recibido.

**Sin aviso propio** para bloques dentro de `p`/`span`/`small`: Vue ya avisa del desajuste en la hidratación, comprobarlo exige recorrer los vnodes en cada render y cuesta bytes en el principal (X-L6). La receta (`as="div"`) va en el README.

## Tokens consumidos (`tokens.md` §56)

**Ningún token nuevo.** `--g-font-ui`; `--g-text-body-size`, `-line`, `-tracking`; `--g-text-body-sm-size`, `-line`, `-tracking`; `--g-text-caption-size`, `-line`, `-tracking`; `--g-text-body-weight` (los tres tamaños, X-L4); `--g-color-text`, `--g-color-text-muted` (redeclarados por el oscuro y la zona de marca, §44.5); `--g-space-1` (ritmo y sangría de listas). Si coco fija el peso de `strong` (regla 7), un `--g-text-*-weight` existente, que coco añade a §56 al entregar `GText.css`. **No lee** `--g-text-caption-weight` (rótulo), `density` ni ningún color de familia.

**No son tokens (#717, X-L5):** la pausa **`space × 3 · 2,5 · 2`** por tamaño y la sangría de listas en múltiplos de `space`. Un token de ritmo dejaría que un tema desacompasara el texto de la pila. Descartado: medio interlineado del rol (`--g-text-*-line` / 2), que sacaría el ritmo de la escala de `space` y rompería la equivalencia con el `sm` de `GStack`.

## Clases (contrato bruno ↔ coco)

| Clase | Cuándo |
| --- | --- |
| `g-text` | Siempre |
| `g-text--size-{body\|body-sm\|caption}` | Según `size` (siempre una) |
| `g-text--tone-{default\|muted}` | Según `tone` (siempre una) |

**Distintas de las utilidades** `g-text-{rol}` y `g-text-{muted|subtle}` (un guion; #804): las de `GText` son `g-text` y `g-text--*` (dos guiones). Toda expresión que busque utilidades en el HTML (compuertas y pruebas de los bloques) usa `\bg-text-[a-z]` y no `\bg-text\b` (#856).

## Movimiento

Ninguno.

## SSR y efectos

Render puro por `as`, con la comprobación de vacío en el propio render (sin `onMounted`): el HTML del servidor y el del cliente coinciden. Ningún acceso a `document` ni `window`. El único caso que no hidrata es el de la regla `as` (bloques dentro de `p`), que es HTML no válido de la aplicación.

## Peso y paquete (#853; X-L9)

En el **principal** (`@grana/vue`), registrado en `src/index.js`, `components.css` y el `install`. **Compuerta: ≤ 512 B gzip (`gzip -9`) de crecimiento de `dist/grana.js`** sobre la medida inmediatamente anterior a añadirlo, con la guarda del aviso dentro (#653.5). Estimación de kiwi: ≈ 350–420 B dentro de `grana.js`. Es la excepción que #550 admite (peso despreciable, puro, vocabulario de las recetas de página y de todos los bloques), como las primitivas de #723. **Si la supera:** primero se recorta el texto del aviso; si sigue por encima, vuelve a lima (la comprobación de vacío no se quita: es comportamiento). CSS en `grana.css` (≈ 540 B gzip estimados), fuera de la compuerta de JS; bruno lo mide y lo registra en `CHANGELOG.md`. Compuerta de `dist`: `grep -q "g-text--size-body-sm" packages/vue/dist/grana.css`.

## `meta.json` y tipos (#443)

`GText.meta.json`: las tres props con sus valores y defaults, slot `default`, `events: []`, `methods: []`, `status: "draft"` hasta la auditoría de coco. `GlobalComponents` gana `GText` por el `install` del principal; `src/types.test.js` la cubre sin entrada nueva (no hay `exports` nuevos).

## Resolución de hallazgos de kiwi (X-L1 a X-L10)

| # | Hallazgo | Resolución |
| --- | --- | --- |
| X-L1 | #196 y §23.4 | Enmendados (#854): se reabre **solo** `Text` para el texto corrido; `GHeading` sigue descartada y el título lo decide el contenedor |
| X-L2 | `prose` | `.g-text` entre las primitivas transparentes (#855; `container.md`) |
| X-L3 | Utilidades cortan el ámbito | **Límite aceptado y documentado** con receta (regla 12, #855); afinar el corte, reservado. Afecta igual a `prose` (`container.md` «Límites») |
| X-L4 | Peso de `caption` | `--g-text-body-weight` en los tres tamaños; registrado en §23.2 (#854) |
| X-L5 | Ritmo como token | No: relación con `space` (#854; `tokens.md` §56) |
| X-L6 | Avisos | Uno, fuera de lista (las tres props, un texto); sin aviso de bloques dentro de `p` (#851 (e)) |
| X-L7 | Reparto por bloque | `_comun.md` §11 B-L5 y los seis contratos de sección (#856) |
| X-L8 | Frontera con utilidades | `utilities.md` «Cuándo usarlo» (#855) |
| X-L9 | Peso | Principal con compuerta ≤ 512 B (#853; `api.md` «Paquete») |
| X-L10 | Nombres de `size` | `body` · `body-sm` · `caption` (#851; `api.md` fila `size`) |

## Reservados

- **Comillas en el idioma de la cita** (`quotes` por `lang`, «Qué lo hace distinto» 4): con un dato explícito (prop o atributo) y comillas iguales en los tres motores; sin él, no.
- **Afinar el corte del ámbito** (X-L3): una marca de raíz de componente o la lista de `utilities.json` excluida del corte, para que una utilidad sobre un bloque interno no lo saque de la `GText` ni de `prose`. Se reabre si una aplicación real lo necesita; cambiaría también `GContainer prose`.
- **Reglas de prosa en `GSurface`/`GCard`/`GSection`** para sus hijos nativos (dirección (b) de #841): sigue reservado.
- `size` con más roles, `tone="subtle"`, truncado por líneas: fuera de la v1.

## Límites conocidos (para el README)

- **Firefox no admite `text-wrap: pretty`** (sí `balance`): la última línea se queda como la deja el motor.
- **Utilidades sobre bloques internos** cortan el ámbito (regla 12); la utilidad va en la raíz.
- **Bloques dentro de `as="p"`** (o `span`, `small`): HTML no válido; usar `as="div"`.
- **Encabezados, `hr` y `table` dentro** quedan fuera de contrato (regla 7).
- **Sin verificar** (kiwi): lector de pantalla real (la `figure` nombrada por su `figcaption`, `cite`, `address`, la garantía por `aria-describedby`); 1.4.12 con una hoja de usuario real (se cumple por construcción, regla 11); zoom del navegador (solo reflujo a 320); `forced-colors` (no pinta nada propio: nada que perder, a confirmar por coco); SSR del `p` con bloques dentro (razonado, no ejecutado); el peso real dentro de `grana.js` (estimado).

## Verificación

- **bruno (Vitest, `GText.test.js`):** etiqueta por `as` en los ocho valores; fuera de lista → `p`, `body`, `default` y el aviso 1 una vez por instancia y motivo; clases por prop (siempre una de tamaño y una de tono); `$attrs` (`lang`, `dir`, `cite`, `id`, `aria-describedby`, `class`) en la raíz; **vacío**: sin slot, slot con solo un comentario de `v-if`, solo espacios y fragmento vacío → nada en el DOM; con texto o un hijo → la raíz; SSR (`renderToString`) igual que el cliente; sin efectos al importar; guarda de #653 (lo vigila `src/devWarnings.test.js`).
- **Playwright** (`tests/text.spec.mjs`, puerto propio, tres motores; los casos C1 a C8 de `design/lab/text/r01/verificar.mjs` como base, sobre el componente real): ritmo 12 · 10 · 8 y 0 antes del primero y tras el último (con un primer hijo `hidden`); anidada (C1: 10 entre cita y pie, 12 entre párrafos de la cita); componente dentro (C2: `p` → `GStack` → `p` a 10 y 10); fraseo (C3: `cite`/`address` normales, `em` en cursiva, `a` subrayado, `small` en `caption` = 12 px); en `GStack` y vacía (C4: 12 entre vecinos); lista con sangría dentro y RTL (C5); contraste ≥ 4,5:1 en claro, oscuro y zona de marca (C6); dentro de `prose` medida a 66ch (C7, tras #855) y una utilidad en un bloque interno que corta (el límite, para que conste); `text-wrap` (C8, Firefox omitido por diseño); 320 px sin desplazamiento horizontal; consola limpia.
- **coco:** `GText.css` sin literales ni respaldos (solo `var(--g-*)` y alias `--_*`); auditoría con un tema distinto (`space` 5 → pausas 15 · 12,5 · 10; `fontSize` y `typeScale` distintos; rústico y lujo) sobre los **seis bloques cambiados**; `forced-colors`; rúbrica de movimiento: «no aplica» (sin movimiento).

## Encargos

- **coco (Sonnet):** `packages/vue/src/components/GText/GText.css` desde `design/lab/text/r01/tx.css` con los nombres de clase de este contrato (`g-text--size-body-sm`, no `sm`), sin la propuesta reservada de comillas; el valor de la pausa escrito en la regla de cada tamaño (regla 5); límite del ámbito `.g-*` salvo `.g-text` y `.g-tooltip`; peso de `strong` con un token o `bolder` (regla 7) y sangría de listas; `.g-text` en las primitivas transparentes de `GContainer.css` (`prose`, #855); lista exacta de tokens en `tokens.md` §56 si cambia (vuelve a lima). Después, la **auditoría** sobre el componente y los seis bloques cambiados, y la actualización de su verificador `design/lab/blocks/marketing/auditoria-verificar.mjs` para que cuente el ritmo de `GText` como margen propio (#856).
- **bruno (Sonnet):** `GText.vue` (render por `as`, clases, vacío → nada, aviso 1 con la guarda de #653), `GText.test.js`, `GText.meta.json`, registro en `src/index.js` (exportación e `install`) y `components.css`, tipos (`GlobalComponents`), compuerta de peso ≤ 512 B y de `dist` en `gates.sh`, `tests/text.spec.mjs`, ejemplo en el playground. **Después**, los seis bloques con el reparto de `_comun.md` §11 B-L5 (#856), la expresión de utilidades del arnés y de §9 con `\bg-text-[a-z]`, y su paso a `candidate` cuando la auditoría de coco lo confirme.
- **mora-docs (Sonnet):** `GText/README.md` con las fronteras, la receta `as="div"`, la receta de utilidades en la raíz y los límites; actualizar los README de los seis bloques si citan el texto suelto.
