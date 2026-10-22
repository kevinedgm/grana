# Declaración · texto suelto (`GText`, nombre de trabajo), r01 · ronda corta

> kiwi, 2026-10-22. Origen: #841 (confirmada por el usuario el 2026-10-22) y la propuesta mínima de lima en `design/contracts/blocks/_comun.md` §11 B-L5; medidas de MK-L1 (`design/lab/blocks/marketing/auditoria.md`). Prototipo: `index.html` (`?vista=casos`; `?vista=bloques&b=testimonials|cta|newsletter|footer|stats|faq` con `&tema=rustico|lujo` y `&dark=1`), regla propuesta en `tx.css` (no es el CSS del componente: es de coco), «después» sobre los **bloques reales** del banco de bruno con `tx.js`. Verificación: `GRANA_PW_PORT=4218 node design/lab/text/r01/verificar.mjs` (§«Comprobaciones»). Base: HTML (contenido de flujo y de fraseo), WCAG 2.2 (1.3.1, 1.4.1, 1.4.3, 1.4.4, 1.4.10, 1.4.12), `tokens.md` §5, §7, §23 y los contratos de `GStack`, `GContainer`, `GSection` y `GSurface`. Ronda corta: primitiva sin forma visible (no aplica «conceptos antes que caja», #362). **Preguntas de producto: ninguna** (la decisión es #841).

## Anatomía

```
<as>.g-text.g-text--size-{body|sm|caption}.g-text--tone-{default|muted}   ← raíz única; recibe $attrs (lang, dir, id, cite, aria-*)
└─ [slot default]  texto, fraseo (em, strong, cite, small, a, code, br…) y bloques nativos (p, ul, ol, blockquote, figure…)
```

Sin nodos internos, sin envoltorio, sin JS de comportamiento. Lo que dibuja es el texto de la aplicación con el rol y el ritmo del tema.

## Decisiones

**Raíz y elemento**

1. **Un solo elemento, el que se pide con `as`:** `p` (por defecto) · `div` · `span` · `small` · `blockquote` · `figure` · `figcaption` · `address`. Nada interactivo, ningún encabezado (`h1`–`h6`: los pone `GSection`, #196) y ninguna lista como raíz (una lista de piezas es `GStack as="ul"`, #827; una lista dentro de un texto va **dentro** de la `GText`). Los atributos van a la raíz por `$attrs` (`lang` y `cite` de una cita, `dir`, `id` para `aria-describedby` de la garantía de CTA, #838).
2. **`as` fuera de la lista: aviso de desarrollo y `p`** (como los demás valores fuera de lista de la librería). **`p`, `span` o `small` con bloques dentro** es HTML no válido: en SSR el analizador cierra el `p` antes del bloque y la hidratación no casa (Vue ya lo avisa). La receta es `as="div"`; si además hace falta un aviso propio es de lima (X-L6: cuesta bytes en el principal).
3. **Sin contenido, no se pinta.** Un slot vacío o solo con espacios no deja elemento. Medido (C4): una `GText` vacía dentro de `GStack` **suma un gap más** (24 px entre sus vecinos frente a 12), aunque mida 0 de alto: la pila cuenta cada hijo. Los bloques ya usan `v-if`; esto protege a la aplicación.

**Rol tipográfico y tono**

4. **`size` = rol del tema, sin inventar tamaños:** `body` (por defecto) · `sm` (`body-sm`) · `caption`, leídos de `--g-text-{rol}-size`, `-line` y `-tracking`, con `--g-font-ui`. Medido en los tres temas: todo el texto suelto de los seis bloques cae en la escala del tema (antes, en rústico, 16 px fuera de una escala de 17/14,9/12,8). **Nombre de los valores:** propongo `body-sm` en vez de `sm` (X-L10).
5. **Peso de texto en los tres tamaños** (`--g-text-body-weight`, 400). El rol `caption` del tema pesa 500 porque es de **rótulo** (eyebrow, rótulo de grupo); la ayuda de un campo, que es texto, ya lo baja a 400 (§23.2). Medido: el legal de Newsletter con GText pesa lo mismo que la ayuda de encima (X-L4).
6. **`tone`: `default` = `--g-color-text`, `muted` = `--g-color-text-muted`, siempre explícitos** (no heredados): así un bloque fuera de superficie no se queda con el negro del navegador en oscuro, y la zona de marca, que redeclara los dos (§44.5), los cambia sola. Medido: ≥ 4,5:1 en claro, oscuro y zona de marca (C6) y en los seis bloques en los tres temas. Sin `subtle` ni colores de familia: el texto suelto no comunica estado.
7. **Sin `density`.** El texto no tiene altura de control y el ritmo de párrafo no debe cambiar porque un panel sea compacto (§4: la densidad no cambia la tipografía).

**Ritmo: una sola fuente de aire**

8. **La raíz no tiene margen ni cursiva** (`margin: 0`, `font-style: normal`). Una `GText` nunca añade aire hacia fuera: el aire **entre piezas** lo pone la pila o el `gap` del padre. Medido: dos `GText` en `GStack gap="sm"` quedan a 12 px, solo el `gap` (C4); en Newsletter, entre el campo y el legal solo queda el `gap` del formulario (ayuda → legal **56 → 40 px**, en los tres temas).
9. **Dentro, una pausa por tamaño entre bloques nativos, a cualquier profundidad:** `p`, `div`, `ul`, `ol`, `dl`, `blockquote`, `figure`, `figcaption`, `address`, `pre` separados por **r = `space × 3` (`body`) · `× 2,5` (`sm`) · `× 2` (`caption`)** = 12 · 10 · 8 px con `space` 4 (medio renglón de cada rol en el tema por defecto). Nada antes del primero ni tras el último, contados **sin** `[hidden]`, `template` ni el nodo del tooltip (#383; medido en C5 con un primer hijo oculto). Márgenes en línea a 0: la cita y la figura arrancan en su borde (medido: sin los 40 px en las 12 opiniones de Testimonials, tres temas).
10. **El ritmo de `body` es el `sm` de `GStack`** («va con lo anterior», #719): un párrafo y el siguiente de un mismo texto se separan como dos piezas que van juntas en la pila. Es relación, no tema: sigue a `space` y no hay token (X-L5).
11. **No entra en componentes.** El ámbito se corta en cualquier elemento con clase `g-*` (salvo otra `GText`) y en el nodo del tooltip; lo de dentro de un componente es del componente. **Un bloque nativo junto a un componente le da el ritmo por su lado** (los márgenes se colapsan): en el `address` del pie, `p` → `GStack` de canales → `p` quedan a 10 y 10 px aunque `ul.g-stack` ponga su margen a 0 (C2).
12. **Anidada: la de fuera da el ritmo a la de dentro, y la de dentro manda en lo suyo.** En una opinión (`figure` `sm` › `blockquote` `body` + `figcaption`), la cita y su pie se separan con el ritmo de la figura (10) y los párrafos de la cita con el de la cita (12) (C1). Nota de construcción para coco: el valor va **en la regla de cada tamaño**, no en una variable (una variable se resuelve en el elemento que recibe el margen, y la anidada tiene la suya: con variable, la cita imponía su 12 a la figura; medido y corregido en el prototipo).
13. **Listas dentro de un texto:** conservan la viñeta y la semántica, con la sangría **dentro** de la caja (`space × 6` en el prototipo, a ajustar por coco) y al lado lógico (RTL medido en C5).

**Fraseo**

14. **Solo se normaliza lo que el navegador pone sin que signifique nada:** `cite` y `address` sin cursiva (la cursiva no es su semántica: un lector no la anuncia), `small` dentro **no encoge** (el navegador lo baja a `smaller`: en un `caption` serían 10 px, por debajo del mínimo de 12, §7; medido 12 en C3). **`em` e `i` conservan la cursiva** (es el énfasis); `strong`, `code` y `a` no se tocan: un enlace de la aplicación sigue subrayado y con su color (1.4.1; medido en C3). En los bloques no hay `a` desnudo (regla 8 de `_comun.md`): el enlace es `GBtn variant="link"`.
15. **Línea con oficio:** `text-wrap: pretty` en el texto y `balance` en `figcaption` (detalle en «Qué lo hace distinto» 2).

**Herencia y convivencia**

16. **`lang` y `dir` por `$attrs`:** una cita en inglés lleva `lang="en"` en su `blockquote` (Testimonials, #821). Para texto de usuarios, la receta es `dir="auto"`.
17. **Con `GContainer prose`:** `prose` mide la línea (66ch) y `GText` pone rol y ritmo; deberían sumarse. **Hoy no:** la clase `g-text` saca a la `GText` del ámbito de `prose` (medido en C7: 1280 px de columna frente a 703 de medida, tres motores). Hallazgo X-L2.
18. **Con los componentes:** `GText` va en los **slots libres** (cuerpo de `GCard`, panel de `GAccordionItem`, cuerpo de `GSection`, pie de tarjeta) y fuera de superficies; nunca sustituye `title`/`description`/`hint` de un componente (#196). En un hueco que ya tiene rol, el bloque elige ese rol: la garantía en el pie de `GCard` (CTA 02) es `caption`, el rol del pie.
19. **Qué no hace:** títulos (`GSection`); prosa larga de artículo con medida (`GContainer prose`); colocar piezas (`GStack`, `GAdaptiveLayout`); superficie, fondo o borde (`GSurface`); recortar o truncar líneas; enlaces o acciones (`GBtn`); estados; movimiento.

**Accesibilidad**

20. **Sin `role` ni `aria-*` propios.** La semántica es la del elemento pedido y queda intacta: `figure` toma su nombre de `figcaption`, `blockquote` conserva `cite`, `address` y `cite` siguen siendo lo que son aunque no vayan en cursiva.
21. **Mínimos:** texto ≥ 12 px (el menor rol es `caption`; `small` no baja), contraste ≥ 4,5:1 medido, reflujo sin desplazamiento horizontal a 390 y 320 px en los seis bloques. **1.4.12 (espaciado de texto):** todo en la capa de Grana, así que la hoja del usuario (sin capa) que aumenta el espacio entre párrafos gana sin `!important` (por construcción; no medido con una hoja de usuario real).
22. **Estados: ninguno.** Nada se mueve, nada es enfocable.

**Casos límite**

23. **Texto suelto mezclado con bloques** en `as="div"` (`Hola <p>…</p>`): el `p` es el primer elemento y no lleva margen arriba, así que toca el texto. Receta: el texto en su propio `p`. No se arregla en CSS sin tocar nodos de texto.
24. **Hijo con `display: flex` o `grid` de la aplicación:** dentro de él los márgenes no se colapsan (dos bloques quedarían a 2r). Límite documentado; es su distribución, no la de `GText`.
25. **Utilidades sobre un hijo** (`<p class="g-mt-4">`): el corte del ámbito por el prefijo `g-` lo saca y conserva el margen del navegador del otro lado (medido en C7 con `prose`: 16 px). Afecta igual a `GContainer prose`. Hallazgo X-L3.
26. **`GText` dentro de un componente que ya pone márgenes a sus hijos** (`GStack`, el cuerpo de `GSection`, el panel del acordeón): la raíz vale 0 en los dos casos y el componente decide el aire de fuera. Medido en los seis bloques.

## Uso en el lote (propuesta para lima, X-L7)

Medido con este reparto sobre los bloques reales (`tx.js`, tabla `PLAN`):

| Bloque | Antes | `<GText>` |
| --- | --- | --- |
| Testimonials 01 (tarjeta) | `figure` › `blockquote` › `p` + `figcaption` › `cite` | `as="figure" size="sm"` › `as="blockquote" size="sm" :lang :cite` + `as="figcaption" size="sm" tone="muted"` (en tarjeta, el contexto es `body-sm`) |
| Testimonials 02 (lista) y 03 (acordeón) | ídem | `as="figure"` › `as="blockquote" :lang :cite` + `as="figcaption" size="sm" tone="muted"`; la destacada de 02, en tarjeta, como 01 |
| CTA 01 y 03 | `p` `assurance` | `size="sm" tone="muted" :id` (14, igual que la descripción) |
| CTA 02 | `p` en el pie de `GCard` | `size="caption" tone="muted" :id` (el rol del pie) |
| Newsletter 01–03 | `p` legal en `GForm` | `size="caption" tone="muted"` |
| Footer 01–03 | `address` › `p` + `GStack` + `p`; `p` nota | `as="address" size="sm"`; nota `size="caption" tone="muted"` |
| Stats 03 | `p` × n en `GContainer width="reading"` | `as="div"` envolviendo los párrafos |
| FAQ 01–03 | `p` × n en el panel | `as="div"` envolviendo los párrafos de la respuesta |

## Qué lo hace distinto

1. **Una sola pausa, el mismo vocabulario que la página.** El patrón habitual es un componente de texto con `margin-bottom: 1em` o un `<p>` con márgenes del navegador: cada texto trae su aire y, junto a una pila, el aire se suma (los 54–56 px del legal). Aquí la raíz **no tiene aire hacia fuera**, el de dentro es **una pausa por tamaño** y la pausa de un párrafo es la relación `sm` de la pila. Para quien lee, las piezas de una pantalla se separan siempre por lo mismo que significan («va con lo anterior», «lo siguiente», «otro tema») y nunca por quién escribió el `p`. Medido: el aire doble desaparece en los seis bloques, tres temas y tres motores.
2. **Línea con oficio, sin JS.** `text-wrap: pretty` evita que la última línea de una cita, un legal o una respuesta sea una palabra sola; `balance` reparte el pie de una figura en líneas parecidas. Es lo que hace un buen cajista y no cuesta ni un byte de JS ni un cuadro de pintado: donde el motor no lo sabe hacer, se ignora. Medido en C8 (a 236 px, donde el ajuste normal deja una palabra viuda): **Chromium** 2 palabras en la última línea, **WebKit** 4, **Firefox** no lo admite (`pretty`; sí `balance`) y se queda como estaba. Sirve a quien lee textos cortos en tarjetas estrechas, donde una viuda pesa más.
3. **La composición se reparte el ritmo sola.** Una opinión es tres textos anidados; con la regla de proximidad, la figura decide la pausa entre la cita y su pie y la cita decide la pausa entre sus párrafos, sin props de margen ni cálculos (C1). Quien compone una cita no elige ningún número.
4. **Reservada: comillas en el idioma de la cita.** La cita pondría sus comillas con `quotes: auto` según su `lang` (« » en español, “ ” en inglés, „ “ en alemán). **No entra en la v1:** medido en C9, los motores no coinciden (para `es`, Chromium y Firefox ponen “ ” y WebKit « »), y si los datos ya traen comillas saldrían dobles. Queda anotada para una versión con dato explícito.

## Comprobaciones

`GRANA_PW_PORT=4218 node design/lab/text/r01/verificar.mjs` (Chromium, Firefox y WebKit; `packages/vue/dist` y `packages/blocks/dist/marketing.js` del árbol actual):

- **Casos** (`index.html?vista=casos`, claro y oscuro): anidada (C1), componente dentro (C2), fraseo (C3), en `GStack` y vacía (C4), lista, primer hijo oculto y RTL (C5), zona de marca (C6), `prose` (C7), `text-wrap` (C8), comillas reservadas (C9).
- **Bloques** (Testimonials, CTA 01–03, Newsletter, Footer, Stats 03, FAQ 01 y 03; tema por defecto, rústico y lujo; claro y oscuro): se mide **antes** con el texto nativo y **después** con las clases de trabajo de `GText` en el mismo DOM: sin sangría, márgenes 0 o el ritmo, sin cursiva del navegador, texto en la escala y en el rol de su `GText`, ritmo entre bloques, contraste, `assurance` ≤ descripción, legal ≤ ayuda y con su peso, campo → legal solo con el `gap`, cita en el borde de la figura, consola limpia, sin desplazamiento horizontal a 390 y 320 px; y que **antes** el hallazgo se reproduce (si no, la prueba no prueba).

**Resultado (2026-10-22):** **2871/2871** en Chromium, Firefox y WebKit (casos y bloques, pasada completa), más la comprobación de la vista «bloques» de `index.html` añadida después: casos **171/171** en los tres motores (pasada aparte). Total **2883/2883**, 0 fallos.

**Antes, en Chromium con el tema por defecto** (para que conste que la medida ve el problema): Testimonials 13 márgenes del navegador y 4 cursivas por variante (en rústico, además 8 tamaños fuera de escala en 02); Newsletter un margen de navegador por variante y **54–56 px** entre ayuda y legal; Footer 01/03 2–3 márgenes y 3 cursivas, 02 una cursiva; Stats 03 dos márgenes; FAQ 01/03 cinco márgenes; CTA 01/03 `assurance` 16 frente a 14 (en rústico, fuera de escala), CTA 02 un margen. **Después:** todo en verde en los tres temas, claro y oscuro, y los tres motores; ayuda → legal **40 px** (el `gap` del formulario).

**Notas de los motores:** `@scope`, `:nth-child(1 of …)` y `text-wrap: balance` en los tres; `text-wrap: pretty` en Chromium y WebKit, no en Firefox (se ignora sin efecto).

## Peso

Estimación (X-L9): un componente funcional de tres props sin estado, con la comprobación de vacío y un aviso de desarrollo, **526 B gzip** como módulo suelto (`gzip -9`, borrador minificado en el scratchpad); dentro de `grana.js` comparte `defineComponent`, `h` y los nombres de props con el resto, así que el crecimiento esperado es **≈ 350–420 B**, dentro de la compuerta de **≤ 512 B** de #841. El CSS de la regla del prototipo (sin la propuesta reservada) mide **≈ 540 B gzip** suelto y va a `grana.css`, fuera de esa compuerta. Si la compuerta no llega, lo primero que sale es el aviso del punto 2, no la comprobación de vacío (punto 3), que es comportamiento.

## Hallazgos para lima

| # | Para | Qué |
| --- | --- | --- |
| X-L1 | `DECISIONS.md` #196, `tokens.md` §23.4 | #196 y §23.4 dicen «no hay primitivas `Text`/`Heading`». #841 reabre **solo** `Text` para el texto corrido: enmendar las dos con el límite (sin títulos, sin tamaños fuera de `body`/`body-sm`/`caption`; `GHeading` sigue descartada) |
| X-L2 | `container.md` (#751) | Añadir `.g-text` a las **primitivas transparentes** de `prose` (`.g-stack`, `.g-section`, `.g-section__body`, `.g-bleed`, `.g-bleed-raw`): hoy una `GText` dentro de `prose` ocupa toda la columna (C7). La `GText` es prosa de la aplicación, con su propio límite de ámbito para los componentes de dentro |
| X-L3 | `container.md`, el futuro `text.md`, `utilities.md` | El corte del ámbito por `[class^="g-"]`/`[class*=" g-"]` atrapa también las **utilidades** (`g-mt-4`, `g-text-muted`): un `p` de la aplicación con una utilidad sale de `prose` y de `GText` y conserva márgenes del navegador (C7, 16 px). Hace falta otro criterio de «es un componente» (lista de utilidades de `utilities.json` excluida del corte, o una marca de raíz de componente); afecta ya a `GContainer` |
| X-L4 | `text.md`, `tokens.md` §23 | Peso: el de texto (`--g-text-body-weight`) en los tres tamaños, no `--g-text-caption-weight` (500, de rótulo). Registrar en §23.2 junto a la ayuda de campo |
| X-L5 | `text.md`, `tokens.md` | Ritmo `space × 3 · 2,5 · 2` por tamaño, relación como #717 (no token: un tema que lo cambiara desacompasaría el texto de la pila). Alternativa considerada y descartada: medio interlineado del rol (`--g-text-*-line` / 2): seguiría al interlineado del tema, pero sacaría el ritmo de la escala de `space` y rompería la equivalencia con el `sm` de `GStack` (punto 10) |
| X-L6 | `text.md`, `api.md` «Avisos» | Avisos: `as` fuera de lista (sí); bloques dentro de `p`/`span`/`small` (decidir: Vue ya avisa en hidratación y cuesta bytes) |
| X-L7 | `_comun.md` §11 B-L5, contratos de las secciones | Reparto por bloque de la tabla «Uso en el lote». Además, para el contrato de Newsletter: el legal queda a **40 px** de la ayuda (el `gap` de `GForm`); si debe ir «con el campo», es `GStack gap="sm"` o el legal dentro del hueco del campo, no un margen |
| X-L8 | `utilities.md` «Cuándo usarlo» | Fila nueva: «Un texto con flujo nativo dentro (párrafos, cita, dirección) o sin hoja propia» → `GText`; «un tamaño de rol sobre un elemento suelto de la aplicación» → `g-text-{rol}` |
| X-L9 | `api.md` «Paquete», `CHANGELOG` | Peso estimado en «Peso»; en el principal (#841), compuerta ≤ 512 B gzip de `dist/grana.js`; CSS ≈ 540 B en `grana.css` |
| X-L10 | `text.md`, `api.md` `size` | Valores de `size`: `body` · **`body-sm`** · `caption` (los nombres de los roles, de `--g-text-body-sm-*` y de `g-text-body-sm`) en vez de `sm`, que en `api.md` es un paso de la escala `xs`…`xl` y en `GPrice` significa otra cosa (`sm` = body-sm pero `md` = title-sm, #770). Añadir `GText` a la fila de `size` de `api.md` como «rol tipográfico, con los nombres del rol» |

## Para coco (no es contrato; notas del prototipo)

- La regla del flujo de dentro usa `@scope` (como `GContainer prose`), `:nth-child(1 of …)` y `:where()`; medidos los tres en los tres motores.
- El ritmo, **en una regla por tamaño con el valor escrito** (punto 12), no en una variable.
- `strong` dentro sube a `bolder` (700) cuando el tema tiene 400/500/600: decidir si se lleva al peso de título (600). No lo midió MK-L1.
- La sangría de la lista (`space × 6` en el prototipo) es tuya.

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** anatomía de un elemento con `as` de texto; rol y tono con tokens existentes, ningún token nuevo; raíz sin margen ni cursiva; ritmo por tamaño solo dentro, sin aire doble con `GStack` ni con el `gap` del formulario; no entra en componentes; anidada con el ritmo de la de fuera; `cite`/`address` sin cursiva, `small` sin encoger, `em` y `a` intactos; listas dentro de la caja y RTL; contraste ≥ 4,5:1 en claro, oscuro y zona de marca; texto ≥ 12 px; sin desplazamiento horizontal a 390 y 320; consola limpia; los seis casos de MK-L1 medidos antes (fallan) y después (pasan) sobre los bloques reales en tres temas y tres motores (ver «Comprobaciones»).

**Correcciones (en la ronda):** el ritmo en variable hacía que una cita anidada impusiera el suyo a la figura (C1 fallaba: 12 en vez de 10); pasa a una regla por tamaño. El primer y el último hijo se cuentan sin `[hidden]`, `template` ni el nodo del tooltip.

**Pendientes:**
- **lima:** X-L1 a X-L10; contrato `design/contracts/text.md`; decisión de personalidad en `DECISIONS.md` («Qué lo hace distinto» 1 a 3; 4 reservada).
- **coco:** `GText.css` desde `tx.css` (notas de arriba); auditoría con los bloques cambiados.
- **bruno:** `GText.vue` (funcional, vacío → nada, aviso), `meta.json`, registro, pruebas y peso; después, los bloques con el reparto de X-L7 y el verificador de coco (`auditoria-verificar.mjs`) debe aceptar el ritmo de `GText` como margen propio (hoy cuenta todo margen de un elemento sin clase `g-*` como del navegador).
- **No verificado:** lector de pantalla real (la `figure` nombrada, `cite`, `address`, la garantía por `aria-describedby`); una hoja de usuario real para 1.4.12; zoom del navegador (solo reflujo a 320); `forced-colors`; SSR del `p` con bloques dentro (se razona desde el analizador de HTML, no se ejecutó); el peso real dentro de `grana.js` (estimado).
