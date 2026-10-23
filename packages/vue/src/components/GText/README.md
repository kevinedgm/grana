# GText

Texto suelto con la tipografía del tema: el rol (`body`, `body-sm`, `caption`), el color (`default` o `muted`) y **una pausa por tamaño entre sus bloques**, sin añadir aire hacia fuera. Es para el texto que no cabe en una prop de componente: la cita y su pie, la garantía bajo una llamada a la acción, el legal de un boletín, la dirección de un pie, los párrafos de una respuesta. **No pinta caja ni color propio** (lo pone el tema) y, sin contenido, **no deja elemento**.

**Etiqueta:** `<g-text>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/text/auditoria.md`](../../../../../design/lab/text/auditoria.md)) · **Desde:** 0.1.0

```js
import { GText } from '@grana/vue'
```

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio. Exige Vue `^3.5.0`.

> **Un bloque dentro de `p`, `span` o `small` es HTML no válido.** Si tu texto lleva párrafos, listas o citas dentro, usa `as="div"`. Ver «Recetas y límites».

## En esta página

[§ Uso](#uso) · [§ Cuándo usarlo](#cuándo-usarlo) · [§ Ejemplos](#ejemplos) · [§ API](#props) · [§ Ritmo y normalización](#ritmo-y-normalización) · [§ Recetas y límites](#recetas-y-límites) · [§ Accesibilidad](#accesibilidad) · [§ Personalidad](#personalidad) · [§ Tema](#tema) · [§ Alcance](#alcance) · [§ Verificación](#verificación)

## Uso

```vue
<GText size="body-sm" tone="muted">Sin pago ahora · Respuesta en menos de 2 h</GText>

<GText as="div">
  <p>Primer párrafo de la respuesta.</p>
  <p>Segundo párrafo.</p>
</GText>
```

La raíz recibe `lang`, `dir`, `id`, `cite`, `aria-*`, `class` y `style` por los atributos que no son props.

## Cuándo usarlo

| Necesito | Uso | No |
| --- | --- | --- |
| Un párrafo, una cita, una dirección, una nota o un legal **sin componente que los tipografíe** | **`GText`** | `<p>` desnudo (márgenes y cursivas del navegador); CSS propio |
| El título o la descripción de un contenedor | La prop o el slot del componente: `GSection` (`title`, `description`), `GCard` (`title`, `description`, `eyebrow`), `GInput` (`hint`)… | `GText` en lugar de `description`; `GText` como título |
| Un título con nivel (`h2` a `h4`) | `GSection` | `GText` con un encabezado: `h1` a `h6` no están en `as` |
| Aire **entre** piezas de una página o de un panel | `GStack` (`gap` como relación) | Márgenes en una `GText`: su raíz siempre vale 0 |
| La medida de lectura (66ch) de un artículo | `GContainer width="reading"` o `prose` | `GText` no mide la línea; las dos conviven |
| Una lista de piezas | `GStack as="ul"` | `GText` como raíz de una lista: `ul` y `ol` no están en `as` (una lista **dentro** de un texto sí va) |
| El tamaño de un rol sobre un elemento suelto de tu aplicación | La utilidad `g-text-{rol}` | — |
| Superficie, fondo, borde | `GSurface` o `GCard` | `GText` (no pinta caja) |

**No entra en los componentes:** va en sus **slots libres** (el cuerpo o el pie de `GCard`, el panel de `GAccordionItem`, el cuerpo de `GSection`) y fuera de superficies. Nunca sustituye `title`, `description` ni `hint`. En un hueco que ya tiene rol, elige ese rol: la garantía en el pie de una `GCard` es `caption`.

## Ejemplos

### e1 · La garantía bajo una llamada a la acción

```vue demo
<template>
  <GStack gap="sm" horizontal="start">
    <GBtn aria-describedby="garantia-demo">Reservar</GBtn>
    <GText id="garantia-demo" size="body-sm" tone="muted">Sin pago ahora · Respuesta por WhatsApp en menos de 2 h</GText>
  </GStack>
</template>
```

**Por qué:** la frase que quita la duda antes de pulsar es texto de apoyo: pesa menos que lo que apoya (`body-sm`, `muted`) y se pega al botón con el `gap` de la pila, no con un margen. El `id` llega a la raíz, así que `aria-describedby` la liga al botón y quien usa lector de pantalla la oye al llegar a «Reservar». Úsala así cuando el texto cuelga de una acción; para una descripción de sección, la prop `description`.

### e2 · Una opinión: la cita y su pie

```vue demo
<template>
  <GText as="figure">
    <GText as="blockquote" lang="en">
      <p>We booked two nights and stayed five.</p>
      <p>The rooftop at sunset is the best view in the city.</p>
    </GText>
    <GText as="figcaption" size="body-sm" tone="muted"><span>Emily Clarke</span> · <cite>Google, August 2026</cite></GText>
  </GText>
</template>
```

**Por qué:** tres textos anidados se reparten el ritmo solos. La de fuera (`figure`) decide la pausa entre la cita y su pie; la de dentro (`blockquote`), la pausa entre sus párrafos; ninguna lleva margen ni cifra. La cita arranca en el borde de la figura (sin la sangría de 40 px del navegador), `cite` no sale en cursiva y `lang="en"` hace que el lector la pronuncie en inglés. Úsalo para citas con fuente; para una frase suelta basta un `GText` simple.

### e3 · Una respuesta de varios párrafos

```vue demo
<template>
  <GText as="div">
    <p>Sí, aceptamos mascotas pequeñas en las habitaciones del patio.</p>
    <p>Avísanos al reservar para dejarte la habitación lista.</p>
  </GText>
</template>
```

**Por qué:** con `as="div"` los párrafos son hijos de un bloque válido y reciben una pausa de `body` entre ellos, sin aire antes del primero ni tras el último. Con `as="p"` (el valor por defecto) esos `p` quedarían dentro de otro `p`: HTML no válido que el servidor reordena y la hidratación no casa. Úsalo siempre que el texto lleve bloques dentro (párrafos, listas, citas).

## Props

| Prop | Tipo | Valores | Default | Descripción |
| --- | --- | --- | --- | --- |
| `as` | `String` | `'p'` `'div'` `'span'` `'small'` `'blockquote'` `'figure'` `'figcaption'` `'address'` | `'p'` | Etiqueta de la raíz (lista cerrada: sin encabezados, listas ni controles). Fuera de lista: aviso y se pinta `p`. Con `p`, `span` o `small`, **no pongas bloques dentro**: usa `div` |
| `size` | `String` | `'body'` `'body-sm'` `'caption'` | `'body'` | Rol tipográfico del tema (tamaño, interlínea y tracking) y pausa entre bloques: `space × 3` · `2,5` · `2`. Fuera de lista: aviso y `body` |
| `tone` | `String` | `'default'` `'muted'` | `'default'` | `default` = `--g-color-text`, `muted` = `--g-color-text-muted`, siempre explícitos. Fuera de lista: aviso y `default` |

**No existen** (y por qué): `density` (el ritmo de un párrafo no cambia porque el panel sea compacto); un `size` mayor que `body` (títulos y `display` son de los contenedores); `weight`, `italic`, `align`, `truncate`, `lines` (estilo puntual: utilidades de tu aplicación o el componente que tiene el hueco); `gap` y `margin` (el aire es de `GStack`); un color semántico (el texto suelto no comunica estado); `lang` y `dir` como props (van por los atributos de la raíz).

## Eventos

`GText` no emite eventos ni expone métodos. Es puro: sin medidas, observadores ni estado.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `default` | — | Texto, fraseo (`em`, `strong`, `cite`, `small`, `a`, `code`, `br`…) y bloques nativos (`p`, `ul`, `ol`, `dl`, `blockquote`, `figure`, `figcaption`, `address`, `pre`, `div`). Sin contenido, el componente no deja elemento |

## Ritmo y normalización

**Raíz.** `margin: 0` y `font-style: normal`: nunca añade aire hacia fuera. Dos `GText` en una `GStack gap="sm"` quedan a 12 px, solo el `gap` (`medido`).

**Sin contenido, no se pinta.** Sin slot, con un slot que solo da comentarios (un `v-if` falso), con blancos o con fragmentos vacíos, no hay elemento. Si dejara una caja de alto 0, la pila le sumaría un `gap` más a sus vecinos (`medido`).

**Pausa entre bloques**, a cualquier profundidad dentro de la `GText`:

| `size` | Pausa | Con `space` 4 |
| --- | --- | --- |
| `body` | `space × 3` | 12 px |
| `body-sm` | `space × 2,5` | 10 px |
| `caption` | `space × 2` | 8 px |

Los bloques que la reciben son `p`, `div`, `ul`, `ol`, `dl`, `blockquote`, `figure`, `figcaption`, `address` y `pre`. **Nada antes del primero ni tras el último**, sin contar los `[hidden]`. Los márgenes se colapsan: dos bloques vecinos quedan a una pausa. La pausa **no es un token**: es una relación con `space` (la de `body` es la `sm` de `GStack`), así que una pantalla entera cambia de ritmo con `space` y nunca con una cifra escrita a mano. En `blockquote` y `figure` los márgenes en línea valen 0.

**Anidada.** La `GText` de fuera da el ritmo a la de dentro, y la de dentro manda en lo suyo: en una opinión, la cita y su pie se separan con el ritmo de la figura y los párrafos de la cita con el de la cita.

**Ámbito.** El ritmo no entra en componentes: se corta en cualquier elemento con una clase que empieza por `g-` salvo otra `GText` y el nodo de `GTooltip`. Un bloque nativo junto a un componente le da el ritmo por su lado.

**Fraseo normalizado** (solo lo que el navegador pone sin que signifique nada):

- `cite` y `address` van sin cursiva.
- `small` dentro no encoge (en `caption` daría 10 px, por debajo del mínimo de 12).
- `strong` y `b` pesan lo que el título pequeño del tema (`--g-text-title-sm-weight`), nunca un número escrito.
- `em` e `i` conservan la cursiva (es el énfasis). `a` conserva su subrayado y su color (1.4.1). `code` no se toca.
- Las listas conservan viñeta y semántica, con la sangría dentro de la caja y del lado lógico (`space × 6`). `ul` lleva `disc` y solo un `ul` anidado **dentro** de la misma `GText` lleva `circle`: sin esa regla, una lista dentro de una tarjeta `li` salía con `circle` en una variante y con `disc` en otra (hallazgo BK-C3 de la auditoría de Booking, corregido en `GText.css`).
- Encabezados, `hr` y `table` dentro de una `GText` quedan **fuera de contrato**: los títulos son de `GSection` y una tabla es `GTable`.

**Listas de definiciones (`dl`).** Un `dl` dentro de una `GText` es una lista de término y definición (la carta de un restaurante, el desglose de un total; DECISIONS #863):

- **`dd` sin la sangría del navegador** (`margin-inline-start: 0`): los 40 px no significan nada y desbordan a 320 px.
- **`dt` con el peso de título pequeño del tema** (`--g-text-title-sm-weight`, el mismo que `strong`), sin cambiar tamaño ni color.
- **Sin pausa entre `dt` y `dd`** (son de fraseo dentro del par); **cada grupo** (un `div` dentro del `dl`, o el par `dt` y `dd` si no hay `div`) recibe la pausa del tamaño respecto al siguiente, como un bloque.
- Lo de dentro de un `dd` (un `GPrice`, un `GStack` de `GTag`) es de su componente.
- **Reservado:** el renglón con el último `dd` al final de la línea (BK-L3); hoy el precio queda debajo del nombre.

```vue
<GText as="div" size="body-sm">
  <dl>
    <div><dt>Viernes 13 de noviembre</dt><dd>$1,850</dd></div>
    <div><dt>Sábado 14 de noviembre</dt><dd>$2,100</dd></div>
  </dl>
</GText>
```

**Línea.** `text-wrap: pretty` en el texto y `balance` en `figcaption`, sin JavaScript. Donde el motor no lo sabe hacer, se ignora.

**Cascada.** Todo va en la capa de Grana con especificidad 0: tu CSS sin capa gana sin `!important`, y una utilidad gana a la regla de la `GText`.

## Recetas y límites

Cada punto está medido en el componente real (auditoría de coco).

- **Bloques dentro: `as="div"`.** `as="p"`, `"span"` o `"small"` con párrafos, listas o citas dentro es HTML no válido (en el servidor el analizador cierra el `p` antes del bloque y la hidratación no casa). `GText` no avisa de esto: la receta es `as="div"`.
- **Una utilidad va en la raíz.** Las clases utilitarias también empiezan por `g-`, así que `<p class="g-mt-4">` **dentro** de una `GText` sale de su ámbito y conserva el margen del navegador del otro lado. Pon la utilidad en la raíz de la `GText` (`<GText class="g-mt-4">`, que tiene `.g-text` y no corta), o parte el texto en dos `GText` dentro de una `GStack`. Una utilidad sobre un elemento de fraseo (`<span class="g-text-muted">`) no tiene efecto apreciable. Lo mismo vale para `GContainer prose`.
- **Texto suelto mezclado con bloques.** En un `as="div"`, `Hola <p>…</p>` deja el `p` sin margen arriba, pegado al texto. Pon el texto en su propio `p`.
- **Hijo con `display: flex` o `grid`.** Dentro de él los márgenes no se colapsan y dos bloques quedan a dos pausas. Es la distribución de ese hijo, no de `GText`.
- **Firefox ignora `text-wrap: pretty`** (sí admite `balance`): la última línea de un párrafo queda como la deja el motor. Es una mejora donde existe, no una garantía.
- **Con `GContainer prose`,** la `GText` se mide como la prosa vecina (66ch). Con `as="div"` se miden los bloques de dentro.

## Avisos de desarrollo

Prefijo `[Grana GText]`, una vez por instancia y valor, al montar y al cambiar la prop. Solo en desarrollo.

| Cuándo | Qué pasa |
| --- | --- |
| `as`, `size` o `tone` fuera de lista | Un aviso con el nombre de la prop, el valor recibido y los válidos; se usa el default (`p`, `body`, `default`) |

## Accesibilidad

a. Sin `role`, `aria-*` ni foco propios: la semántica es la del elemento pedido. `figure` toma su nombre de `figcaption`, `blockquote` conserva `cite`, `address` y `cite` siguen siendo lo que son aunque no vayan en cursiva.

b. Contraste de `default` y `muted` ≥ 4,5:1 sobre el fondo, la superficie y la zona de marca, en claro y oscuro, con tres temas (`medido`, 900/900 en los tres motores, auditoría de coco).

c. Texto ≥ 12 px: el menor rol es `caption` y `small` no baja de ahí (`medido`).

d. Sin desplazamiento horizontal a 1440, 390 y 320 px (`medido`).

e. El espacio entre párrafos lo decide tu CSS por construcción: la especificidad 0 deja ganar una hoja de usuario que lo aumente (1.4.12), `sin verificar` con una hoja real.

f. `forced-colors`: `default` y `muted` toman el mismo color del sistema, legible, y no hay borde ni contorno propio (`medido` solo en Chromium).

> **Peligro.** Un `GText` con `as="p"`, `"span"` o `"small"` que lleva párrafos, listas o citas dentro es HTML no válido y no avisa: en el servidor el navegador reordena el árbol y al hidratar Vue lo detecta como un desajuste. Quien lo lea con un lector de pantalla puede encontrar los párrafos fuera de la estructura que escribiste. Usa `as="div"` siempre que haya bloques dentro.

## Personalidad

Una sola pausa, el mismo vocabulario que la página: la raíz no tiene aire hacia fuera y dentro hay **una pausa por tamaño**, así que las piezas de una pantalla se separan por lo que significan y no por quién escribió el `p`. Junto a una pila, el aire no se suma: en un boletín, la ayuda del campo y el legal quedaron a 40 px (el `gap` del formulario) en vez de los 54–56 px de dos márgenes de `p` (`medido`). Además, el texto lleva `pretty` y `balance` sin JavaScript, y tres textos anidados se reparten el ritmo solos.

Sin movimiento: nada se anima, así que `prefers-reduced-motion` no tiene nada que reducir.

## Tema

| Token | Qué controla |
| --- | --- |
| `--g-font-ui` | Familia de la raíz |
| `--g-text-body-size`, `-line`, `-tracking` | Rol de `size="body"` |
| `--g-text-body-sm-size`, `-line`, `-tracking` | Rol de `size="body-sm"` |
| `--g-text-caption-size`, `-line`, `-tracking` | Rol de `size="caption"` |
| `--g-text-body-weight` | Peso del texto en los tres tamaños (el rol `caption` pesa más en el tema porque es de rótulo; la `GText` baja a texto) |
| `--g-text-title-sm-weight` | Peso de `strong` y `b` |
| `--g-color-text`, `--g-color-text-muted` | `tone="default"` y `tone="muted"`; el oscuro y la zona de marca los redeclaran |
| `--g-space-1` | La pausa (`× 3 · 2,5 · 2`) y la sangría de las listas (`× 6`) |

No lee `--g-text-caption-weight`, `density` ni colores de familia.

### Clases

`g-text`, `g-text--size-{body|body-sm|caption}` y `g-text--tone-{default|muted}` (siempre una de cada). Son distintas de las utilidades `g-text-{rol}` y `g-text-{muted|subtle}` (un guion): si buscas utilidades en el HTML, usa `\bg-text-[a-z]` y no `\bg-text\b`.

## Alcance

- **Sin títulos ni encabezados:** `h1` a `h6` no están en `as`; el nivel lo decide el contenedor (`GSection`, #854).
- **Sin listas como raíz:** `ul` y `ol` no están en `as`; una lista **dentro** de un texto sí va (#827).
- **Sin color de familia ni `subtle`:** el texto suelto no comunica estado.
- **Reservado: comillas en el idioma de la cita.** Los motores no coinciden (para `es`, Chromium y Firefox ponen “ ” y WebKit « »); volvería con un dato explícito (#852).
- **Reservado: afinar el corte del ámbito** para que una utilidad sobre un bloque interno no lo saque de la `GText` ni de `prose`. Se reabre si una aplicación real lo necesita.
- **Reservado: reglas de prosa en `GSurface`, `GCard` o `GSection`** para sus hijos nativos.
- **Peso:** `grana.js` crece **356 B gzip** (`medido` por bruno, 2026-10-22; tope 512 B, #853) y `GText.css` pesa **548 B gzip** medido sobre el archivo (`medido` por coco; dentro de `dist/grana.css` `sin verificar`).

## Verificación

- **Motores:** `design/lab/text/auditoria-verificar.mjs` sobre el componente real: **900/900** en Chromium, Firefox y WebKit, con tema por defecto, rústico y lujo, claro y oscuro (`medido`, coco, 2026-10-22). Se suma el verificador del estilo con el prototipo (3767/3767) y los seis bloques de marketing de `@grana/blocks`, 4327/4327 en los tres motores (addendum de `design/lab/blocks/marketing/auditoria.md`). Tras las enmiendas de Booking (`dl`, #863, y la viñeta `disc`, BK-C3), coco volvió a pasar el verificador en Chromium: 331/331 (`medido`, 2026-10-23, según `design/lab/blocks/booking/auditoria.md`; no se repitió en Firefox y WebKit).
- **Pruebas de bruno:** `GText.test.js` (21 pruebas, nivel `prueba`: etiqueta por `as`, defaults y avisos, clases, atributos en la raíz, vacío, SSR) y `text.spec.mjs` (5 casos en Chromium).
- **Defectos corregidos en la auditoría:** ninguno en el CSS; sí en el verificador de los bloques.
- **No verificado:** lector de pantalla real (la `figure` nombrada por su `figcaption`, `cite`, `address`, la garantía por `aria-describedby`); 1.4.12 con una hoja de usuario real; `forced-colors` en Firefox y WebKit; zoom del navegador (solo reflujo a 320 px); SSR de un `p` con bloques dentro (razonado, no ejecutado).
- **Pendientes abiertos:** ninguno propio; los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md) §6.

## Fuentes

- Contrato: [`design/contracts/text.md`](../../../../../design/contracts/text.md)
- Decisiones: #851 a #856 en [`DECISIONS.md`](../../../../../DECISIONS.md)
- API: [`GText.meta.json`](GText.meta.json)
- Auditoría de coco: [`design/lab/text/auditoria.md`](../../../../../design/lab/text/auditoria.md)
- Pruebas: [`GText.test.js`](GText.test.js); Playwright [`design/lab/theme-playground/tests/text.spec.mjs`](../../../../../design/lab/theme-playground/tests/text.spec.mjs)
- Banco: `#sec-text` de [`packages/vue/playground/index.html`](../../../playground/index.html)
